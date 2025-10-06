---
layout: post
title:  "How to correctly add engine feature"
categories: ideas
---

When developing a game engine, adding new features requires careful consideration of how they are enabled, configured, and controlled. This guide outlines several common methods for managing engine features, helping you choose the most appropriate approach for your use case.

## Compile Time Macro

compile time macro can enable/disable your code during preprocess stage

- for features only affect some platform, e.g.  integrate some non-cross platform libraries. created some overhead if compiled to other platform not using this library.
- completely disable a feature

## Config File

config file is loaded on game startup, before any system started

also need to be hot updatable

## Dynamic Switch

dynamic switch is useful when feature only enabled in some cases, gray test, online bug fixing, etc
don't forget to refresh cached states after the switch

## Object Property

new features apply on game object, the problem is how to control priority of object property and dynamic switch?

an example we want to add a radius of shadow distance to a light object

a global variable defined in .cpp file

```
float g_shadow_distance = 100.0f;
```

```
Light::Light() 
{
    m_shadow_distance = g_shadow_distance;
}
```

g_shadow_distance can also modified by config file before the light object created.

then all lights' m_shadow_distance is replaced by the new value.(both editor and the game)

in runtime, modify g_shadow_distance to a specified value to override the previous one to switch on/off the feature 



