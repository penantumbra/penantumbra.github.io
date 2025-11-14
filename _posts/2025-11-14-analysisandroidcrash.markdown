---
layout: post
title:  "Analysis Android Game Crash"
categories: ideas
---

...

some times the game crash, and don't generate any crash dump or related log, then you need to use adb logcat to get sys infos to analyze crash.

search keywords bwlow can help

### game crash

package name/enginelib(libUE4.so)/game pid

### driver crash

qcom, mtk, mali, adreno, opengl, vulkan

### killed by system

kill, memorykiller, oom, lmkd

### others

exit/due to/reason/error/fail