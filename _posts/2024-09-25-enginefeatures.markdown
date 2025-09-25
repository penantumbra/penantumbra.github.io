---
layout: post
title:  "How to correctly add engine feature"
categories: ideas
---

## Compile Time Macro

compile time macro can enable/disable your code during preprocess stage

- for features only affect some platform, e.g.  integrate some non-cross platform libraries. created some overhead if compiled to other platform not using this library.
- completely disable a feature

## Config File

config file is loaded on game startup

preinit some cases
scalbility,

## Console variable

Dynamic Switch is 
is this feature enabled by default(editor/game mode) or only enabled  in some case.
don't forget to refresh some cached states

## Object Property

new features apply on game object

how to control priority of object property and console variable