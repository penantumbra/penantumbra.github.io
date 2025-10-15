---
layout: post
title:  "Compare Shadow Map Atlas and Shadow Map Texture Array"
categories: ideas
---

some notes on shadowmap rt format

## Texture Atlas

pros:
- very flexible shadowmap layout managment, can combine different size of csm/spotlight/pointlight shadow into one texture
- only 1 binding slot in shadowdepthrendering
- don't need to switch rt when render different light shadowmaps
cons:
- big texture made load/store bindwidth increase
- may have space waste
- need border between different shadow maps 

## Texture Array

pros:
- load/store bindwidth is same with render single shadowmap
cons:
- fixed texture size of each slice, to achieve different size texture, need to create multiple arrays or manage a atlas inside texturearray
- some old hardware don't support it
- need to switch rt when render different light shadowmaps(for csm, split each cascade rendering into different frames can reduce rt switch)

## Bindless Texture

pros:
- arbitrary size texture array
cons:
- need modern hardware