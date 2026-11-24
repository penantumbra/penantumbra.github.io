---
layout: post
title: "Alpha-Tested Ray-Traced Shadows with Ray Queries"
categories: ideas
---

Foliage and fences often use alpha-tested textures to cut holes in a small number of triangles. A shadow ray intersects the full triangle, so the renderer must decide whether the hit falls on solid material or a cutout.

This article compares five ways to make that decision with inline ray queries, from treating every hit as opaque to using opacity micromaps. The methods differ in where they evaluate opacity and how much work remains in the shader.

## Shared assumptions

The examples use HLSL-style ray queries and return `true` when the ray is blocked. They assume triangle geometry, a valid shadow-ray interval, and an origin offset that avoids self-intersection.

Solid geometry is built as opaque. Alpha-masked geometry is built as non-opaque so it can produce candidates for shader-side testing. The examples cover binary cutout shadows. `LoadRTDraw()` maps an instance ID to mesh data, and `SampleRayTracingAlpha()` reconstructs UVs and evaluates texture alpha together with the material alpha factor. Alpha sampling uses an explicit LOD because neighboring shadow rays do not necessarily hit the same surface.

## Opaque baseline

The simplest path treats every triangle as opaque. This avoids material lookups and alpha texture samples, but foliage cards cast the silhouette of their full triangles.

```hlsl
bool TraceRTShadowOpaque(RaytracingAccelerationStructure Scene, RayDesc Ray)
{
    RayQuery<RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH |
             RAY_FLAG_FORCE_OPAQUE | RAY_FLAG_SKIP_PROCEDURAL_PRIMITIVES> Rq;
    Rq.TraceRayInline(Scene, RAY_FLAG_NONE, 0xff, Ray);
    Rq.Proceed();
    return Rq.CommittedStatus() == COMMITTED_TRIANGLE_HIT;
}
```

`FORCE_OPAQUE` prevents non-opaque triangle candidates from returning to the shader. With procedural primitives skipped, one `Proceed()` completes the query. `ACCEPT_FIRST_HIT_AND_END_SEARCH` allows traversal to stop at the first accepted blocker because a binary shadow only needs to know whether a blocker exists.

## Candidate alpha testing

This is the inline equivalent of an any-hit alpha test. Each non-opaque candidate provides a primitive index and barycentric coordinates. The shader samples alpha and commits the candidate when it meets the material cutoff. Leaving a candidate uncommitted lets traversal continue.

```hlsl
bool TraceRTShadowAlpha(RaytracingAccelerationStructure Scene, RayDesc Ray)
{
    RayQuery<RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH | RAY_FLAG_SKIP_PROCEDURAL_PRIMITIVES> Rq;
    Rq.TraceRayInline(Scene, RAY_FLAG_NONE, 0xff, Ray);
    while (Rq.Proceed())
    {
        GpuDrawData Mesh = LoadRTDraw(uint(Rq.CandidateInstanceID()));
        ByteAddressBuffer Materials = ResourceDescriptorHeap[MaterialsIndex];
        GpuMaterialData   Material = Materials.Load<GpuMaterialData>(Mesh.Material * sizeof(GpuMaterialData));
        if (SampleRayTracingAlpha(Mesh, Material, Rq.CandidatePrimitiveIndex(), Rq.CandidateTriangleBarycentrics()) >= Material.AlphaCutoff)
        {
            Rq.CommitNonOpaqueTriangleHit();
        }
    }
    return Rq.CommittedStatus() == COMMITTED_TRIANGLE_HIT;
}
```

Opaque geometry is handled automatically. For masked geometry, the cost includes mesh and material reads, UV reconstruction, texture sampling, and returning control between traversal and shader code. Dense layers of foliage can require many candidate tests per ray.

## Opaque retracing

Another approach forces opaque traversal, retrieves the closest hit, and evaluates its alpha afterward. If the hit is a cutout, the shader advances `TMin` and starts another query along the same ray.

```hlsl
bool TraceRTShadowRetrace(RaytracingAccelerationStructure Scene, RayDesc Ray)
{
    RayQuery<RAY_FLAG_FORCE_OPAQUE | RAY_FLAG_SKIP_PROCEDURAL_PRIMITIVES> Rq;
    for (uint Depth = 0; Depth < RetraceMaxDepth; ++Depth)
    {
        Rq.TraceRayInline(Scene, RAY_FLAG_NONE, 0xff, Ray);
        Rq.Proceed();
        if (Rq.CommittedStatus() == COMMITTED_NOTHING)
        {
            return false;
        }
        GpuDrawData Mesh = LoadRTDraw(uint(Rq.CommittedInstanceID()));
        ByteAddressBuffer Materials = ResourceDescriptorHeap[MaterialsIndex];
        GpuMaterialData   Material = Materials.Load<GpuMaterialData>(Mesh.Material * sizeof(GpuMaterialData));
        if (SampleRayTracingAlpha(Mesh, Material, Rq.CommittedPrimitiveIndex(), Rq.CommittedTriangleBarycentrics()) >= Material.AlphaCutoff)
        {
            return true;
        }
        // Positive ray distances: advance one representable float without a fixed gap.
        Ray.TMin = asfloat(asuint(Rq.CommittedRayT()) + 1u);
        if (Ray.TMin >= Ray.TMax)
        {
            return false;
        }
    }
    // Conservatively keep the shadow when the budget is exhausted.
    return true;
}
```

This path must find the closest hit on each iteration. Using `ACCEPT_FIRST_HIT_AND_END_SEARCH` could return a farther cutout first, and advancing past it could skip a nearer blocker.

For positive finite ray distances, incrementing the float bit pattern advances `TMin` by one representable value. This avoids introducing a fixed gap between traces, although it does not remove the need for a robust initial ray offset.

`RetraceMaxDepth` bounds the number of queries. A miss returns unblocked, an accepted alpha test returns blocked, and an exhausted budget conservatively returns blocked. A small budget can therefore make layered foliage too dark. Repeated traversal also has a cost, so opaque retracing needs to be measured against candidate testing on the target GPU and scene.

## Screen-space alpha testing

The GBuffer has already alpha-tested the surfaces visible to the camera. That depth can provide evidence that a masked hit lies in a cutout. If the hit projects clearly in front of the visible surface, its triangle did not write depth there. A valid projected hit over sky provides similar evidence.

The test below ignores those hits. Hits near the visible depth, behind it, outside the screen, or outside the camera clip range are kept as blockers.

```hlsl
bool ScreenSpaceAlphaCutout(float3 HitPosition)
{
    StructuredBuffer<FrameData> Frames = ResourceDescriptorHeap[FrameIndexBuffer];
    const float4                Clip = mul(Frames[0].ViewProjection, float4(HitPosition, 1.0));
    if (Clip.w <= 0.0)
    {
        return false;
    }
    const float3 Ndc = Clip.xyz / Clip.w;
    if (any(abs(Ndc.xy) >= 1.0) || Ndc.z < 0.0 || Ndc.z > 1.0)
    {
        return false;
    }
    Texture2D<float> DepthTexture = ResourceDescriptorHeap[DepthIndex];
    uint2            Size;
    DepthTexture.GetDimensions(Size.x, Size.y);
    const uint2 Pixel = min(uint2((Ndc.xy * float2(0.5, -0.5) + 0.5) * float2(Size)), Size - 1);
    const float SceneDepth = DepthTexture.Load(int3(Pixel, 0));
    if (SceneDepth >= 1.0)
    {
        return true;
    }
    // Express the tolerance as a fraction of camera distance.
    const float3 Eye = Frames[0].Eye.xyz;
    const float3 Visible = ReconstructWorldPosition((float2(Pixel) + 0.5) / float2(Size), SceneDepth, Frames[0].InverseViewProjection);
    const float  VisibleDistance = length(Visible - Eye);
    return length(HitPosition - Eye) < VisibleDistance * (1.0 - ScreenSpaceAlphaTestDepthBias);
}

bool TraceRTShadowScreenSpace(RaytracingAccelerationStructure Scene, RayDesc Ray)
{
    RayQuery<RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH | RAY_FLAG_SKIP_PROCEDURAL_PRIMITIVES> Rq;
    Rq.TraceRayInline(Scene, RAY_FLAG_NONE, 0xff, Ray);
    while (Rq.Proceed())
    {
        const float3 HitPosition = Ray.Origin + Ray.Direction * Rq.CandidateTriangleRayT();
        if (!ScreenSpaceAlphaCutout(HitPosition))
        {
            Rq.CommitNonOpaqueTriangleHit();
        }
    }
    return Rq.CommittedStatus() == COMMITTED_TRIANGLE_HIT;
}
```

This example assumes forward-Z depth in the range [0, 1], with a clear value of 1. The UV conversion matches a framebuffer whose Y direction is opposite to camera NDC. `ReconstructWorldPosition()` uses the same projection and depth convention as the GBuffer.

`ScreenSpaceAlphaTestDepthBias` is a relative camera-distance tolerance. A value of 0.001 requires the hit to be at least 0.1% closer than the reconstructed visible surface before rejecting it. This avoids expressing the tolerance in nonlinear depth units. Depth quantization and pixel discretization still affect the result.

The inference depends on the masked triangles being present in the camera pass with matching geometry, transforms, and alpha rules. Backface culling must not remove surfaces that the shadow rays can hit. Camera-pass occlusion culling or mismatched LODs can also invalidate the inference.

This method avoids material-alpha sampling, but it still reads scene depth and reconstructs a position. Hidden and off-screen cutouts remain opaque, so shadows can be too dark and can change as the camera moves. Thin geometry and silhouette pixels are particularly sensitive to the depth comparison.

## Opacity micromaps

Opacity micromaps precompute opacity classifications over subdivided triangles and attach the data to ray tracing geometry. Traversal can then resolve many hits before returning a candidate to the shader. The feature requires API, driver, and hardware support. The acceleration-structure build flags and shader or pipeline declarations must enable OMM for the selected API. The candidate alpha-test function above can remain the fallback for unresolved hits.

A 2-state micromap stores one bit per microtriangle for opaque or transparent. A 4-state micromap stores two bits and adds unknown states. With ordinary 4-state traversal, opaque hits are accepted, transparent hits are ignored, and unknown hits still reach the shader for alpha testing. These traversal rules are described in the [Vulkan specification](https://docs.vulkan.org/spec/latest/chapters/raytraversal.html).

At subdivision level L, a triangle has 4^L microtriangles. Higher levels can classify smaller regions around alpha boundaries, at the cost of more bake work and data. A low level may leave much of a detailed leaf texture unknown, so alpha-test shader execution can remain substantial even with OMM enabled.

OMM also adds preprocessing and resource-management costs. Changes to the alpha texture, cutoff, UV mapping, or subdivision settings may require rebaking micromaps and rebuilding the associated acceleration structures. Whether this pays off depends on how often those costs are incurred and how much runtime alpha testing is avoided.

## Visual comparison

### Screen-space alpha test

![Screen-space alpha test]({{ '/assets/img/ray-traced-alpha-shadows/screen-space-alpha-test.jpg' | relative_url }})

### Opaque retrace

![Opaque retrace]({{ '/assets/img/ray-traced-alpha-shadows/opaque-retrace.jpg' | relative_url }})

### Alpha test

![Alpha test]({{ '/assets/img/ray-traced-alpha-shadows/candidate-alpha-test.jpg' | relative_url }})

### Opaque

![Opaque]({{ '/assets/img/ray-traced-alpha-shadows/opaque.jpg' | relative_url }})

### Opacity micromaps (OMM)

![Opacity micromaps (OMM)]({{ '/assets/img/ray-traced-alpha-shadows/omm.jpg' | relative_url }})

## Comparing the methods

| Method | Opacity work | Main tradeoff |
| --- | --- | --- |
| Opaque | No material-alpha evaluation | Full triangles block light |
| Candidate alpha test | Shader evaluates non-opaque candidates | Candidate and texture costs grow with foliage overlap |
| Opaque retrace | Shader evaluates each closest hit | Repeated traversal and a finite query budget |
| Screen space | Camera depth approximates cutouts | View-dependent errors and incomplete coverage |
| OMM | Precomputed classifications, with shader fallback for unknowns | Bake cost, storage, and feature support |

Candidate alpha testing provides a useful quality reference. Opaque retracing trades candidate processing for repeated queries, while screen-space testing accepts view-dependent error to avoid material-alpha reads. OMM moves part of the classification work into preprocessing and traversal.

For an isolated comparison, run the first four methods with OMM disabled. With OMM enabled, its classifications can resolve hits before shader-side alpha testing.

The practical choice depends on foliage density, alpha complexity, camera position, and GPU architecture. Comparing GPU time and shadow quality across representative views gives a more reliable basis than counting alpha samples alone. OMM comparisons should also account for bake time, memory use, and how frequently the data changes.

## References

- [MediaTek — Best Practices for Mobile Ray Tracing](https://developer.mediatek.com/RayTracing/642649b5f55b040d6989a9a1.html)
- [Real-Time Path Tracing in RE ENGINE for Resident Evil Requiem and PRAGMATA](https://www.youtube.com/watch?v=Gq1QdlQSzn0)
- [Microsoft DirectX Developer Blog — D3D12 Opacity Micromaps](https://devblogs.microsoft.com/directx/omm/)
- [Vulkan Specification — Ray Traversal](https://docs.vulkan.org/spec/latest/chapters/raytraversal.html)
