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

## Validation checks

`tools/validate_geometry_contract.mjs` checks:

1. Exact vertex counts from 0D through 8D.
2. Exact edge counts from 0D through 8D.
3. All generated edges connect vertices with Hamming distance one.
4. Canonical counts for the square, cube, tesseract, 5-cube faces, and 8-cube cubic cells.
5. Plane rotations preserve squared radius.
6. Zero-angle plane rotation is identity.
7. Side-two hypervolume and boundary-measure scaling.

## Visualisation rules

- Hidden-dimension colour is a display convention, not a physical property.
- Trails, glow, bloom, and starfield effects must not be described as data.
- High-dimensional previews must be labelled as sampled skeletons when the full graph is not rendered.
- A tesseract must not be described as spacetime or as evidence for physical extra dimensions.

## Next scientific gap

Add projection-distortion validation: compare original high-dimensional edge lengths with rendered 3D edge-length distributions for orthographic, perspective, and sequential modes, then expose a distortion warning in the inspector before further visual polish.
