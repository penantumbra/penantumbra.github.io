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
it generates sparse distance field data with mips