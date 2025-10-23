---
layout: post
title:  "Unreal Shadow Rendering Bugs"
categories: ideas
---

...


## Hidden Objects generate shadow in pie mode

if ishiddeningame set true, hidden objects will cast shaodw in pie mode 

### Problem

FPrimitiveSceneProxy::IsShadowCast only makes judgments in View->Family->EngineShowFlags.Editor mode, but in PIE mode, it corresponds to View->Family->EngineShowFlags.Game

### Repair method

Add the corresponding judgment of View->Family->EngineShowFlags.Game, or also judge IsShown(View)

## ES31 Stationary Light Shadow Disapper in some angle

### Problem

UE4 don't have full support of statioanry csm on es31, EnableStaticMeshCSMVisibilityState will return wrong if scene contains different types objects(static/movable + receivecsm or not)