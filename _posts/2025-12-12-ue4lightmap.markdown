---
layout: post
title:  "UE4 LightMap Directionality"
categories: ideas
---

...


## UE4 LightMap Directionality

![alt text](image-2.png)

From [UE4 Lightmap Format Analysis](https://zhuanlan.zhihu.com/p/68754084), Unreal encodes a direction channel in the lower half of the lightmap to interact with the pixel normal.

With directionality:

![alt text](image-3.png)

Without directionality, Unreal uses 0.6 as an empirical value:

![alt text](image-4.png)

Some mobile games discard the lower half to reduce lightmap size, resulting in very flat lighting with a normal map. If your game uses a forward pipeline, you can utilize `geometry normal` to interact with `world normal` to achieve better results with the same lightmap size.

The code is as follows:

```hlsl
// old directionality

// float4 SH = Lightmap1 * GetLightmapData(LightmapDataIndex).LightMapScale[1] + GetLightmapData(LightmapDataIndex).LightMapAdd[1]; // 1 vmad

// half Directionality = max( 0.0, dot( SH, float4(WorldNormal.yzx, 1) ) ); // 1 dot, 1 smax

// faked directionality

half Directionality = 0.6 * max( 0.0, dot( normalize(VertexNormal), normalize(WorldNormal) ) );
```

Result:

![alt text](image-5.png)

Our lightmap now has more detail. Even though we discard the directionality, we still use the empirical value of 0.6 to adjust luminance, resulting in slight differences compared to the original.