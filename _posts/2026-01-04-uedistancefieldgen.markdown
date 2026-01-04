---
layout: post
title:  "DistanceField Generation of Unreal"
categories: ideas
---

...


## DistanceField Generation of Unreal

```c++
// Runtime\Engine\Private\StaticMesh.cpp
void UStaticMesh::Serialize(FArchive& Ar)
```

then

```c++
// Runtime\Engine\Private\StaticMesh.cpp
FStaticMeshRenderData::Cache
{
    ...

	static const auto CVar = IConsoleManager::Get().FindTConsoleVariableDataInt(TEXT("r.GenerateMeshDistanceFields"));

	if (CVar->GetValueOnAnyThread(true) != 0 || Owner->bGenerateMeshDistanceField)
	{
		if (LODResources.IsValidIndex(0))
		{
			if (!LODResources[0].DistanceFieldData)
			{
				LODResources[0].DistanceFieldData = new FDistanceFieldVolumeData();
				LODResources[0].DistanceFieldData->AssetName = Owner->GetFName();
			}

			// Only generate distance fields and card representations for the base render data, not platform render data.
			if (this == Owner->GetRenderData())
			{
				const FMeshBuildSettings& BuildSettings = Owner->GetSourceModel(0).BuildSettings;
				UStaticMesh* MeshToGenerateFrom = BuildSettings.DistanceFieldReplacementMesh ? ToRawPtr(BuildSettings.DistanceFieldReplacementMesh) : Owner;

				if (BuildSettings.DistanceFieldReplacementMesh)
				{
					// Make sure dependency is postloaded
					BuildSettings.DistanceFieldReplacementMesh->ConditionalPostLoad();
				}

				LODResources[0].DistanceFieldData->CacheDerivedData(Owner, MeshToGenerateFrom, BuildSettings.DistanceFieldResolutionScale, BuildSettings.bGenerateDistanceFieldAsIfTwoSided);
			}
            ...
		}
        ...
	}
    ...
}
```
only build for lod0

then

```c++
// Runtime\Engine\Private\DistanceFieldAtlas.cpp
void FDistanceFieldAsyncQueue::Build(FAsyncDistanceFieldTask* Task, FQueuedThreadPool& BuildThreadPool)
{
    ...
    GenerateSignedDistanceFieldVolumeData()
    ...
}
```

then

https://github.com/RenderKit/embree


it generates sparse distance field data with mips

```c++
// Developer\MeshUtilities\Private\MeshDistanceFieldUtilities.cpp
void FMeshUtilities::GenerateSignedDistanceFieldVolumeData()
{
...
SetupEmbreeScene()
AddMeshDataToEmbreeScene()
BuildSignedDistanceField()
DeleteEmbreeScene()
...
}
```
then

```c++
static void BuildSignedDistanceField()
{
	...
	for (int32 MipIndex = 0; MipIndex < DistanceField::NumMips; MipIndex++)
	{
		...
		TArray<FSparseMeshDistanceFieldAsyncTask> AsyncTasks;
		AsyncTasks.Reserve(IndirectionDimensions.X * IndirectionDimensions.Y * IndirectionDimensions.Z);
		for (int32 ZIndex = 0; ZIndex < IndirectionDimensions.Z; ZIndex++)
		{
			for (int32 YIndex = 0; YIndex < IndirectionDimensions.Y; YIndex++)
			{
				for (int32 XIndex = 0; XIndex < IndirectionDimensions.X; XIndex++)
				{
					AsyncTasks.Emplace(
						EmbreeScene,
						&SampleDirections,
						LocalSpaceTraceDistance,
						DistanceFieldVolumeBounds,
						LocalToVolumeScale,
						DistanceFieldToVolumeScaleBias,
						FInt32Vector(XIndex, YIndex, ZIndex),
						IndirectionDimensions,
						bUsePointQuery);
				}
			}
		}
		...
	}
}
```

find closets point of each voxel

```c++
void FSparseMeshDistanceFieldAsyncTask::DoWork()
{
	...
	for (int32 ZIndex = 0; ZIndex < DistanceField::BrickSize; ZIndex++)
	{
		for (int32 YIndex = 0; YIndex < DistanceField::BrickSize; YIndex++)
		{
			for (int32 XIndex = 0; XIndex < DistanceField::BrickSize; XIndex++)
			{
				...
				if (bUsePointQuery)
				{
					RTCPointQuery PointQuery;
					PointQuery.x = VoxelPosition.X;
					PointQuery.y = VoxelPosition.Y;
					PointQuery.z = VoxelPosition.Z;
					PointQuery.time = 0;
					PointQuery.radius = LocalSpaceTraceDistance;

					FEmbreePointQueryContext QueryContext;
					rtcInitPointQueryContext(&QueryContext);
					QueryContext.Scene = &EmbreeScene;
					float ClosestUnsignedDistanceSq = (LocalSpaceTraceDistance * 2.0f) * (LocalSpaceTraceDistance * 2.0f);
					rtcPointQuery(EmbreeScene.Scene, &PointQuery, &QueryContext, EmbreePointQueryFunction, &ClosestUnsignedDistanceSq);

					const float ClosestDistance = FMath::Sqrt(ClosestUnsignedDistanceSq);
					bTraceRays = ClosestDistance <= LocalSpaceTraceDistance;
					MinLocalSpaceDistance = FMath::Min(MinLocalSpaceDistance, ClosestDistance);
				}
				...
			}
		}
	}
}



bool EmbreePointQueryFunction(RTCPointQueryFunctionArguments* args)
{
	const FEmbreePointQueryContext* Context = (const FEmbreePointQueryContext*)args->context;

	check(args->userPtr);
	float& ClosestDistanceSq = *(float*)(args->userPtr);

	int32 GeometryIndex = args->geomID;

	if (Context->instID[0] != RTC_INVALID_GEOMETRY_ID)
	{
		// when testing against a geometry instance use instID to index into Scene->Geometries
		GeometryIndex = Context->instID[0];
	}

	const FEmbreeGeometryAsset* GeometryAsset = Context->Scene->Geometries[GeometryIndex].Asset;
	const int32 NumTriangles = GeometryAsset->NumTriangles;

	const int32 TriangleIndex = args->primID;
	check(TriangleIndex < NumTriangles);

	const FVector3f* VertexBuffer = (const FVector3f*)GeometryAsset->VertexArray.GetData();
	const uint32* IndexBuffer = (const uint32*)GeometryAsset->IndexArray.GetData();

	const uint32 I0 = IndexBuffer[TriangleIndex * 3 + 0];
	const uint32 I1 = IndexBuffer[TriangleIndex * 3 + 1];
	const uint32 I2 = IndexBuffer[TriangleIndex * 3 + 2];

	FVector3f V0 = VertexBuffer[I0];
	FVector3f V1 = VertexBuffer[I1];
	FVector3f V2 = VertexBuffer[I2];

	if (Context->instID[0] != RTC_INVALID_GEOMETRY_ID)
	{
		// when testing against a geometry instance need to transform vertices to world space
		FMatrix44f* InstToWorld = (FMatrix44f*)Context->inst2world[0];

		V0 = InstToWorld->TransformPosition(V0);
		V1 = InstToWorld->TransformPosition(V1);
		V2 = InstToWorld->TransformPosition(V2);
	}

	const FVector3f QueryPosition(args->query->x, args->query->y, args->query->z);

	const FVector3f ClosestPoint = (FVector3f)FMath::ClosestPointOnTriangleToPoint((FVector)QueryPosition, (FVector)V0, (FVector)V1, (FVector)V2);
	const float QueryDistanceSq = (ClosestPoint - QueryPosition).SizeSquared();

	if (QueryDistanceSq < ClosestDistanceSq)
	{
		ClosestDistanceSq = QueryDistanceSq;

		bool bShrinkQuery = true;

		if (bShrinkQuery)
		{
			args->query->radius = FMath::Sqrt(ClosestDistanceSq);
			// Return true to indicate that the query radius has shrunk
			return true;
		}
	}

	// Return false to indicate that the query radius hasn't changed
	return false;
}
```
