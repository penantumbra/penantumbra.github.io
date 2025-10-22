---
layout: post
title:  "Graphics Quality Configuration for Android"
categories: ideas
---

...

## UE

Unreal Configure the default graphics quality in BaseDeviceProfiles.ini

it detect gpu model to configure the quality to lowest/low/mid/high/highest

there are some problems

### adreno gpus

adreno 730/740/750 are for high end platforms, but from https://www.bilibili.com/opus/789029760736952320, there are gpu models like 710/722/725/732/735, designed for low end platform, they are also classified into Android_Highest by Unreal's method

### mali gpus

arm authorize their ip to lots of vendors, gpu always have different range core count, different soc may use same gpu model but different core count, e.g. Mali-G615 MP6 and Mali-G615 MP2, core count may range from 2-20, cause a big performance difference, but Unreal's method classfied them into same performance level.

btw, the gpu model returned from vendor may not contains core count but only the prefix