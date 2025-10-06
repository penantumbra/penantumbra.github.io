---
layout: post
title:  "Shadow Compression"
categories: ideas
---

some method to compress shadow map

## BC4 & RGTC

gpu compression texture format

compression ratio: 0.5

## Sparse Shadow Tree

use many planes to fit shadow map

![alt text](image.png)

plane fit:

least squireS

depth plane function
ax + by + c = depth

a = depth - (c - by)/x

a = sum(x_i * x_i)/sum(x_i * z_i)
b = sum(y_i * y_i)/sum(y_i * z_i)
