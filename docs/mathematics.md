# Mathematics of the n-cube

This document records the exact mathematics behind every figure in the atlas. The
code in `js/math/` implements these definitions directly.

## 1. Definition

A centred **n-cube** (also called a hypercube or measure polytope) is the set of
points in `R^n` whose coordinates each lie in `{-1, +1}` for the vertex set, with the
solid body filling `[-1, +1]^n`. The square (n = 2) and cube (n = 3) are the familiar
low-dimensional cases.

## 2. Vertex generation

The vertices are all sign combinations:

```
(-1, -1, ..., -1)
(+1, -1, ..., -1)
...
(+1, +1, ..., +1)
```

There are exactly

```
V = 2^n
```

of them. In code we read the bits of an integer index `v` in `[0, 2^n)`: bit `b` set
gives `+1` on axis `b`, bit `b` clear gives `-1`.

## 3. Adjacency by Hamming distance

Two vertices are joined by an edge **iff** their coordinate vectors differ in exactly
one coordinate — that is, Hamming distance one. In the integer encoding this is a
single-bit flip, so the neighbours of vertex `v` are `v XOR (1 << b)` for each bit `b`.
Counting each undirected edge once gives

```
E = n · 2^(n-1)
```

## 4. Face counts

The number of k-dimensional faces of an n-cube is

```
f_k(n) = C(n, k) · 2^(n-k)
```

where `C(n, k)` is the binomial coefficient. Setting `k = 0` recovers the vertices
(`2^n`) and `k = 1` recovers the edges (`n · 2^(n-1)`).

## 5. Measures

For side length `s`:

```
hypervolume      V_n     = s^n
boundary measure B_(n-1) = 2n · s^(n-1)
```

The boundary consists of `2n` cells, each an (n−1)-cube of measure `s^(n-1)`.

## 6. Axis-aligned cross-sections

The interactive slice fixes one coordinate, for example `x_j = c` with `-1 <= c <= 1`.
For the solid cube `[-1, +1]^n`, this axis-aligned intersection is another cube:

```
[-1, +1]^n intersect {x_j = c} = [-1, +1]^(n-1)
```

embedded back in the original space with the fixed coordinate held at `c`. Sliding
the control moves the cut through parallel layers. More general angled slices can
change shape, but the atlas keeps the control axis-aligned so the result is legible
and exactly an `(n-1)`-cube.

## 7. Plane rotations

In `n` dimensions a rotation acts in a coordinate **plane**, not around an axis. For
the plane spanned by axes `(i, j)`:

```
x_i' = x_i cos θ − x_j sin θ
x_j' = x_i sin θ + x_j cos θ
```

with all other coordinates unchanged. There are `n(n-1)/2` independent rotation
planes (6 in 4D, 10 in 5D). Combining two planes produces the double rotation that
makes a tesseract appear to turn inside out.

## 8. Projection to 3D

To render an n-cube we collapse hidden coordinates one at a time. For a hidden
coordinate `q` and focal length `f`:

```
scale = f / (f − q)
```

Each remaining coordinate is multiplied by `scale`, then `q` is dropped. Repeating
this from the highest coordinate down to the third yields a 3D point. Orthographic
projection simply drops the hidden coordinates without scaling.

Near `q = f` the scale factor diverges. The implementation guards against this by
(a) raising the effective focal length to at least `sqrt(n) + margin` — since a
rotated unit vertex can have a coordinate as large as `sqrt(n)` — and (b) clamping
the denominator to a small positive minimum.

## 9. Why projections distort

A projection trades one dimension for an effect in the others. Perspective makes the
cell that is "nearer" along a hidden axis appear larger, exactly as railway tracks
appear to converge. The inner and outer cubes of a tesseract are the **same size** in
4D; the size difference is an artefact of the projection, not a property of the
object. This is the central caution of the atlas: a projection is a faithful but
lossy representation, and reading it requires knowing what was discarded.

## 10. Dimensional growth, 0D → 50D milestones

The browser renders the full graph through 8D. Above that, the interface uses a
sampled visual skeleton and keeps the full combinatorics in the tables. The reason
is visible in the growth itself: the edge graph grows exponentially.

| Dim | Name | Vertices | Edges | Squares | Cubic cells |
| --- | --- | --- | --- | --- | --- |
| 0 | Point | 1 | 0 | 0 | 0 |
| 1 | Line segment | 2 | 1 | 0 | 0 |
| 2 | Square | 4 | 4 | 1 | 0 |
| 3 | Cube | 8 | 12 | 6 | 1 |
| 4 | Tesseract | 16 | 32 | 24 | 8 |
| 5 | Penteract | 32 | 80 | 80 | 40 |
| 6 | Hexeract | 64 | 192 | 240 | 160 |
| 7 | Hepteract | 128 | 448 | 672 | 560 |
| 8 | Octeract | 256 | 1024 | 1792 | 1792 |
| 10 | 10-cube | 1,024 | 5,120 | 11,520 | 15,360 |
| 12 | 12-cube | 4,096 | 24,576 | 67,584 | 112,640 |
| 16 | 16-cube | 65,536 | 524,288 | 1,966,080 | 4,587,520 |
| 20 | 20-cube | 1,048,576 | 10,485,760 | 49,807,360 | 149,422,080 |
| 30 | 30-cube | 1,073,741,824 | 16,106,127,360 | 116,769,423,360 | 544,923,975,680 |
| 40 | 40-cube | 1,099,511,627,776 | 21,990,232,555,520 | 214,404,767,416,320 | 1,357,896,860,303,360 |
| 50 | 50-cube | 1,125,899,906,842,624 | 28,147,497,671,065,600 | 344,806,846,470,553,600 | 2,758,454,771,764,428,800 |

All values follow from `f_k(n) = C(n, k) · 2^(n-k)`.
