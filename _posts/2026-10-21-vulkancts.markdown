---
layout: post
title:  "Vulkan CTS"
categories: ideas
---

> A quick reference for running dEQP-VK Ray Tracing tests on Windows / Android.

## 1. Ray Tracing Test Groups

Vulkan CTS has two main ray tracing test groups:

| Test Group | Description |
|---|---|
| `dEQP-VK.ray_tracing_pipeline.*` | Ray Tracing Pipeline tests |
| `dEQP-VK.ray_query.*` | Ray Query (inline ray tracing) tests |

> These correspond to the two ray tracing models: the pipeline model (raygen/hit/miss + SBT) and the inline model (`rayQueryEXT` inside a shader).

---

## 2. Running on Windows

### 2.1 Enter the test resource directory

Tests must run from their resource directory (relative paths depend on it):

```powershell
cd <vulkancts>\build\external\vulkancts\modules\vulkan
```

### 2.2 Run a single case first to verify the environment

The full group is huge — **always run a single case first** to confirm the setup works:

```powershell
.\Release\deqp-vk.exe `
  --deqp-case=dEQP-VK.ray_tracing_pipeline.trace_rays_cmds.direct.11_13_1 `
  --deqp-log-filename=rt-single.qpa
```

### 2.3 Run the full groups

```powershell
# Full Ray Tracing Pipeline group
.\Release\deqp-vk.exe "--deqp-case=dEQP-VK.ray_tracing_pipeline.*" `
  --deqp-log-filename=raytracing.qpa

# Full Ray Query group
.\Release\deqp-vk.exe "--deqp-case=dEQP-VK.ray_query.*" `
  --deqp-log-filename=rayquery.qpa
```

Results show in the console in real time; detailed logs go to the `.qpa` file in the current directory.

---

## 3. Running on Android

### 3.1 Install the APK (from the repo root)

```bash
adb install -r build/android/package/dEQP.apk
```

### 3.2 Enter the device shell and launch the test

```bash
adb shell

# Make sure no stale process is running
am force-stop com.drawelements.deqp

# Launch the test (ray_query full group as an example)
am start -n com.drawelements.deqp/android.app.NativeActivity -e cmdLine \
  "deqp --deqp-case=dEQP-VK.ray_query.* \
  --deqp-log-filename=/sdcard/Documents/raytracing.qpa \
  --deqp-log-images=disable \
  --deqp-log-shader-sources=disable"

exit
```

> `--deqp-log-images=disable` and `--deqp-log-shader-sources=disable` reduce log size — recommended for full runs.

### 3.3 Monitor progress

```bash
adb logcat -s dEQP
```

### 3.4 Pull the log (after Ctrl+C to exit logcat)

```bash
adb pull /sdcard/Documents/raytracing.qpa .
```

On Android you can also swap the filter for a single case or another group (e.g. `dEQP-VK.ray_tracing_pipeline.*`).

---

## 4. Common Command-Line Options

| Option | Purpose |
|---|---|
| `--deqp-case=<pattern>` | Select cases, supports `*` wildcard |
| `--deqp-log-filename=<file>` | Set `.qpa` log output path |
| `--deqp-log-images=disable` | Disable image logging (smaller logs) |
| `--deqp-log-shader-sources=disable` | Disable shader source logging |

---

## 5. Reading Results: NotSupported ≠ Fail

This is the most commonly misread point:

- If the device/driver **does not support an extension or feature** a case requires, the result is usually **`NotSupported`**.
- **`NotSupported` does NOT mean the test failed** — it means the environment can't run that case.
- The actual failure state is **`Fail`** (plus `QualityWarning` / `CompatibilityWarning`, which deserve attention).

Common result states:

| State | Meaning |
|---|---|
| `Pass` | Passed |
| `Fail` | Failed (needs investigation) |
| `NotSupported` | Feature/extension unsupported — not a failure |
| `QualityWarning` | Passed, but with a quality warning |
