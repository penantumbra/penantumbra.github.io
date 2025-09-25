---
layout: post
title:  "Shader Optimization Cheatsheet"
categories: ideas
---

my shader programming cheatsheet

## MAD

make your shader fit multi-add way, it may optimized by compiler to one MAD instruction.

```glsl
vec4 result = value * 0.5 + 1.0;
```

## Use Builtin Functions

mix/lerp

```glsl
// The above can be converted to the following for MAD purposes:
resultRGB = colorRGB_0  + alpha * (colorRGB_1 - colorRGB_0);

// GLSL provides the mix function. This function should be used where possible:
resultRGB = mix(colorRGB_0, colorRGB_1, alpha);
```

dot product

```glsl
vec3 fvalue1;
result1 = fvalue1.x + fvalue1.y + fvalue1.z;
vec4 fvalue2;
result2 = fvalue2.x + fvalue2.y + fvalue2.z + fvalue2.w;

const vec4 AllOnes = vec4(1.0);
vec3 fvalue1;
result1 = dot(fvalue1, AllOnes.xyz);
vec4 fvalue2;
result2 = dot(fvalue2, AllOnes);
```


## Bandwidth

always affected by buffer read/write, texture read/write, rendertarget read/write.

access your data continuously, not randomly. use mip map when sample textures,

use correct samplerstate, use `SampleLevel`,`Texture.Load` to avoid waste on texture sample

if using compute shader, store data in shared memory for faster access

use [fp16(hlsl)](https://github.com/microsoft/DirectXShaderCompiler/wiki/16-Bit-Scalar-Types) or half(glsl) in shaders

pls/fbf on mobile platforms instead of texture read

## Shader Complexity

from mjp's blog

>Shader cores also typically use a model where waves must statically allocate all of the registers they will ever need for the entire duration of the program, as opposed to a more dynamic model that might involve spilling to the stack. Keeping that register count low is good for occupancy (which is yet another reason why aggressive micro-optimization can help), and so it’s important you only allocate what you truly need. This means you have a problem to solve if you want to let a program jump out to arbitrary code: the wave has to statically allocate sufficient registers before it can call into some function. Even if you know all of the possible places that the shader might jump to, everybody will be limited to the occupancy of the worst-case target. 3 These are not necessarily unsolveable problems, but they help explain why it’s been easier not to rock the boat and just stick with a monolithic shader program.

## Shader Length

long shader are less efficient than shorter one

don't unroll complex loop

```hlsl
[loop]
for (int i = 0; i < 64; i++)
{
    heavycomputation(i)
}
```

try to discouple heavy computation inside dynamic branch

functions are always inlined, call a heavy function inside brnach generate more shader code than expected

```hlsl
if (a)
{
    return heavycomputation(a);
}
else if (b)
{
    return heavycomputation(b);
}
```

heavycomputation will be inlined twice, following code is better

```hlsl
int param;
if (a)
{
    param = a;
}
else if (b)
{
    param = b;
}
heavycomputation(param);
```

### Shader Divergence

shaders are executed in parallel, try to reduce divergence inside a wrap/wave

a tile/material classification pass to before a heavy fullscreen pass(shading/ssao/ssr)

use SM6 waveintrinsics to do compute/sync inside a wrap/wave and reduce vgpr pressure
