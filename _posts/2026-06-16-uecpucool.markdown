---
layout: post
title:  "UE CPU Cooler"
categories: ideas
---

...


## UE CPU Cooler

Unreal Engine’s frame limiter avoids sleeping all the way to the target frame time.

It first sleeps for most of the wait:

```cpp
SleepNoStats(WaitTime - 0.002f);
```

This leaves about 2 ms of slack, because OS sleep calls can oversleep due to scheduler granularity and wake-up latency.

Then UE waits for the exact frame boundary with:

```cpp
while (FPlatformTime::Seconds() < WaitEndTime)
{
    SleepNoStats(0);
}
```

On generic platforms, `SleepNoStats(0)` becomes `sched_yield()`. So the thread does not request a timed sleep; it simply gives up its current time slice and checks again.

This improves frame pacing because UE is less likely to wake up after the target time. The cost is that the final ~2 ms keeps the CPU relatively active, causing extra scheduler work and higher power usage.

In short, UE trades CPU activity for more accurate frame pacing.

If your platform is power-sensitive, you can replace the final `sched_yield` loop with `SleepNoStats(0.002f)` to avoid repeatedly yielding, at the cost of less precise timing.