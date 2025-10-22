---
layout: post
title:  "Shadow Lod/Proxy Trap"
categories: ideas
---

some optimizations techs are not silver bullet

Unreal provide `r.ForceLODShadow` and [Proxy Geometry Shadow](https://dev.epicgames.com/documentation/en-us/unreal-engine/proxy-geometry-shadows-in-unreal-engine) to optimize shadow rendering.

but it not always looks good, when applied on characters, shadow acne is worse.