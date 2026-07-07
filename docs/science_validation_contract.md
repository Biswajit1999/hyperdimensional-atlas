# Hyperdimensional Atlas validation contract

This repository visualises mathematical projections of `n`-cubes. The validation contract protects the scientific and mathematical claims before any interface or rendering upgrade.

## Scope

The Atlas is a Euclidean geometry teaching tool. It does not claim to show extra dimensions physically, spacetime, string theory compactification, or observational evidence. Visual effects must remain display aids only.

## Mathematical claims to preserve

For a centred `n`-cube on `[-1,+1]^n`:

```text
vertices = 2^n
edges = n 2^(n-1), with 0 edges for n = 0
k-faces = C(n,k) 2^(n-k)
hypervolume for side s = s^n
boundary measure for side s = 2 n s^(n-1)
```

The application may render the full edge graph only for low dimensions and use a labelled preview skeleton for high dimensions, but it must keep exact combinatoric counts separate from sampled rendering.

## Rotation claim

An `n`-dimensional rotation occurs in a coordinate plane, not around a single 3D-style axis:

```text
x_i' = x_i cos(theta) - x_j sin(theta)
x_j' = x_i sin(theta) + x_j cos(theta)
```

This transformation must preserve squared radius and leave all other coordinates unchanged.

## Projection claim

The 3D view is a projection or staged collapse of coordinates. It is not a direct view of higher-dimensional space. Perspective projection may distort lengths and angles, especially near singular focal configurations. Any projection warnings or clamps are numerical and educational safeguards, not physical effects.

Projection diagnostics must compare equal original edge lengths against the displayed 3D edge-length distribution. For the side-two `n`-cube, all mathematical graph edges have original length 2. A rendered view may preserve that only for a true 3D cube under orthographic projection. For `n > 3`, projection necessarily hides, collapses, or distorts at least some directions.

## Projection truth rules

- Orthographic projection of a 3D cube must preserve all displayed edge lengths.
- Orthographic projection of a 5D cube onto the first three coordinates collapses hidden-axis edges to zero length, so it must be labelled as a projection.
- Sequential or staged hidden-coordinate projection may keep hidden-axis edges visible, but those edges are display encodings and their lengths are not physical measurements.
- Perspective projection must remain finite for the documented focal distance and must be labelled as a distorted display transform.
- No animation, bloom, trail, particle, or parallax effect may imply that the viewer is seeing physical extra dimensions directly.

## Validation checks

`tools/validate_geometry_contract.mjs` checks:

1. Exact vertex counts from 0D through 8D.
2. Exact edge counts from 0D through 8D.
3. All generated edges connect vertices with Hamming distance one.
4. Canonical counts for the square, cube, tesseract, 5-cube faces, and 8-cube cubic cells.
5. Plane rotations preserve squared radius.
6. Zero-angle plane rotation is identity.
7. Side-two hypervolume and boundary-measure scaling.
8. 3D orthographic projection preserves all cube edge lengths.
9. 5D orthographic projection collapses hidden-axis edges and therefore needs a projection warning.
10. Sequential 5D projection keeps hidden-axis edges visible only by introducing measurable display distortion.
11. Perspective 5D projection remains finite at the documented focal distance and distorts equal high-dimensional edges.

## Visualisation rules

- Hidden-dimension colour is a display convention, not a physical property.
- Trails, glow, bloom, and starfield effects must not be described as data.
- High-dimensional previews must be labelled as sampled skeletons when the full graph is not rendered.
- A tesseract must not be described as spacetime or as evidence for physical extra dimensions.
- Projection distortion warnings must appear before adding further interface polish.

## Next scientific gap

Bind the browser projection code to the validation fixture so the inspector can report edge-length distortion ratios for the exact active scene rather than relying only on the standalone Node contract.