---
layout: post
title:  "analysis a android tombstone crash"
categories: ideas
---

adb pull /data/tombstones/ 拉一下tombstone文件

```
Build fingerprint: 'Xiaomi/lhasa/lhasa:17/CP2A.260605.016/OS4.0.260921.1.XPNCNXM.PRE:userdebug/test-keys'
Kernel Release: '6.18.21-android17-5-maybe-dirty-4k'
Revision: '0'
ABI: 'arm64'
Timestamp: 2026-09-22 18:41:13.604705632+0800
Process uptime: 509s
Executable: /system/bin/app_process64
Cmdline: com.khronos.vulkan_samples
pid: 12103, ppid: 1805, tid: 14016, name: Thread-9  >>> com.khronos.vulkan_samples <<<
uid: 10353
tagged_addr_ctrl: 0000000000000001 (PR_TAGGED_ADDR_ENABLE)
pac_enabled_keys: 000000000000000f (PR_PAC_APIAKEY, PR_PAC_APIBKEY, PR_PAC_APDAKEY, PR_PAC_APDBKEY)
esr: 0000000092000046 (Data Abort Exception 0x24)
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x000000000000007c (write)
Cause: null pointer dereference
    x0  0000000000000000  x1  b40000740b2958d0  x2  0000000000000001  x3  0000000000000000
    x4  0000000000000000  x5  0000000000000001  x6  0000007340257438  x7  0000000000000001
    x8  0000000000000006  x9  0000005fce000a48  x10 0000000000000000  x11 0400ff0000000000
    x12 0300000000010000  x13 000000731e51f000  x14 00000000ffffffe8  x15 0000000000000000
    x16 00000073241d5ee0  x17 00000076180c9300  x18 00000072b2e44000  x19 b40000740b2958d0
    x20 0000000000000000  x21 0000000000000000  x22 0000005fc9574a00  x23 0000000000000001
    x24 0000007340257b88  x25 0000007340257558  x26 025000000bad0bad  x27 0000007340257b88
    x28 0000000000004e20  x29 0000007340257728
    lr  0000007320b18c10  sp  00000073402574d0  pc  0000007320b18c3c  pst 0000000060001000
    esr 0000000092000046  vg  0000000000000002

20 total frames
backtrace:
      #00 pc 0000000002900c3c  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #01 pc 0000000002900c0c  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #02 pc 0000000002877778  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #03 pc 0000000001207860  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #04 pc 0000000001207b34  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #05 pc 00000000011e5a90  /vendor/lib64/egl/libGLES_mali.so (BuildId: b84ffec1fe5d0c26)
      #06 pc 000000000098387c  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk (offset 0x92c000) (BuildId: a91af5ca8686d706622bf20c727c551ecccbf6f1)
      #07 pc 0000000000c694e0  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk (offset 0x92c000) (BuildId: a91af5ca8686d706622bf20c727c551ecccbf6f1)
      #08 pc 00000000007f46b4  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (vkb::core::AccelerationStructure::build(VkQueue_T*, unsigned int, VkBuildAccelerationStructureModeKHR)+1704) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #09 pc 00000000007fc6a0  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (RaytracingExtended::create_bottom_level_acceleration_structure(bool, bool)+472) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #10 pc 00000000007fda10  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (RaytracingExtended::create_scene()+352) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #11 pc 0000000000800e0c  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (RaytracingExtended::prepare(vkb::ApplicationOptions const&)+416) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #12 pc 00000000004d2610  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (vkb::Platform::start_app()+372) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #13 pc 00000000004d2178  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (vkb::Platform::main_loop_frame()+52) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #14 pc 00000000004d2b78  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (vkb::Platform::main_loop()+20) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #15 pc 00000000004ce23c  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (platform_main(vkb::PlatformContext const&)+100) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #16 pc 00000000004ce164  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (android_main+40) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #17 pc 0000000000928584  /data/app/~~RSotEG6DEP5-UOBfM45JuA==/com.khronos.vulkan_samples-iSACuCXQFnjTwltGRAk7kQ==/base.apk!libvulkan_samples.so (offset 0x1e04000) (BuildId: 6df4158d6f2398d8e1d31a25771803c9252dd817)
      #18 pc 000000000008e830  /apex/com.android.runtime/lib64/bionic/libc.so (__pthread_start(void*) (.__uniq.67847048707805468364044055584648682506)+184) (BuildId: 79c2c20a592482e53185605996fae138)
      #19 pc 000000000007fb24  /apex/com.android.runtime/lib64/bionic/libc.so (__start_thread+68) (BuildId: 79c2c20a592482e53185605996fae138)
```

拉取带符号的驱动文件
adb pull /xxx/libGLES_mali.so

用llvm-addr2line.exe和驱动文件寻找crash栈的函数名
@echo off
set "TC=D:\Android\Sdk\ndk\29.0.14206865\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-addr2line.exe"
set "SYM=.\libGLES_mali1.so"

"%TC%" -f -C -e "%SYM%" 0000000002900c3c 0000000002900c0c 0000000002877778
- -f：输出函数名（function name）。
- -C：对 C++ 符号做反混淆（demangle），例如把 _ZN3foo3barEv 显示为 foo::bar()。
- -e <文件>：指定要查地址的 ELF/共享库文件，例如 -e libGLES_mali1.so。
注意：你写的 -c 小写通常不是 -C。llvm-addr2line 里常用的是大写 -C；Windows 命令行参数区分大小写。
输出

```
xxx::xxx::build_acceleration_structure_hploc_single_template_internal::init(xxx::xxx::device_internal const&)
xxx.cpp:0
xxx::xxx::build_acceleration_structure_hploc_template_internal::build_command(xxx::command_memory&, xxx::xxx::gpu_state_internal&, xxx::xxx::command_list_internal&, xxx::acceleration_structure_build_info const&) const
xxx.cpp:0
xxx::xxx::command_buffer_builder::build_acceleration_structure_hploc(xxx::acceleration_structure_build_info const&)
xxx.cpp:0

```