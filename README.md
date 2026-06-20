# Hyperdimensional Atlas

**An interactive visual laboratory for geometry beyond three dimensions** — explore the projected shadows, rotations, and cross-sections of hypercubes from 0D to 8D, entirely in the browser.

---

## Why I built this

I work on astronomical instrumentation, where high-dimensional spaces are part of the daily routine — spectra, parameter grids, likelihood surfaces — and where we never see those spaces directly but reason about them through projections, slices, and reduced representations. Hyperdimensional Atlas applies that habit to a clean test case: the n-cube. It lets you turn, slice, and inspect the exact structure of a hypercube while keeping clear about what a picture of it can actually claim.

What you see here are **projections**, not direct views. A four-dimensional cube cannot be drawn in three-dimensional space any more than a cube can be drawn on a flat page without distortion. The "cube within a cube" is a shadow — faithful to the geometry, but not a photograph of a fourth dimension. The interface keeps mathematics, established physics, and speculation in separate boxes so the tool stays useful for building intuition without overstating speculative physics.

## Features

- **Dimensions 0–8.** Point, line, square, cube, tesseract, penteract, hexeract, hepteract, octeract — each generated from first principles, not drawn by hand.
- **Three projection modes:** orthographic, perspective, and a staged sequential projection for high dimensions.
- **True plane rotations.** Rotations happen in coordinate planes (not around axes), with single- and multi-plane presets for every dimension.
- **Cross-section explorer.** Slice an n-cube with a fixed-coordinate hyperplane and watch it reduce to an (n−1)-cube.
- **Hidden-dimension colour encoding** as a reading aid (clearly labelled as a visual cue, not a physical property).
- **Live scientific inspector:** object name, Schläfli symbol, vertex/edge/face/cell counts, hypervolume, and boundary measure that update with the dimension.
- **Atmosphere** built procedurally with CSS, a Three.js starfield, and gentle bloom — no stock images.
- Ghost trails, vertex markers, wireframe toggle, FPS monitor, keyboard shortcuts, reduced-motion support, and a WebGL fallback.

## Mathematical foundations

For a centred n-cube on `[-1, +1]^n`:

| Quantity | Formula |
| --- | --- |
| Vertices | `V = 2^n` |
| Edges | `E = n · 2^(n−1)` |
| k-faces | `f_k(n) = C(n, k) · 2^(n−k)` |
| Hypervolume (side `s`) | `V_n = s^n` |
| Boundary measure | `B_(n−1) = 2n · s^(n−1)` |

Vertices are enumerated as all ±1 coordinate combinations; two vertices share an edge exactly when their coordinates differ in one place (Hamming distance one). A rotation in the plane of axes `(i, j)` is

```
x_i' = x_i cos θ − x_j sin θ
x_j' = x_i sin θ + x_j cos θ
```

Projection to 3D collapses each hidden coordinate `q` by a perspective factor `f / (f − q)`, with the focal length clamped to avoid singularities. Full derivations are in [`docs/mathematics.md`](docs/mathematics.md).

## Physics limitations and scientific disclaimer

A tesseract is a four-dimensional **Euclidean spatial** object. It is **not** spacetime. Modern physics models spacetime as three spatial dimensions plus one time dimension, and in relativity time does not behave like an ordinary spatial axis. General relativity describes spacetime as a curved four-dimensional manifold. Frameworks such as Kaluza–Klein models and string/M-theory use additional spatial dimensions for mathematical consistency, but **no confirmed experiment has established large, directly accessible extra spatial dimensions.**

This atlas shows mathematical projections, not photographs or direct observations. Visual beauty is not evidence; a simulation builds intuition but cannot replace measurement. See [`docs/physics-and-astronomy.md`](docs/physics-and-astronomy.md).

## Controls

| Action | Control |
| --- | --- |
| Rotate camera | drag |
| Zoom | scroll / pinch |
| Change dimension | left panel slider, dimensional ladder, or ← / → |
| Pause / resume rotation | Space |
| Reset camera & rotation | R, or "Reset view" |
| Toggle interface panels | H |

The left panel also exposes projection mode, focal length, rotation speed and plane, view toggles (wireframe, vertex markers, colour encoding, ghost trails), and the cross-section explorer.

## Static deployment (GitHub Pages)

This is a static site with no build step. To publish:

1. Push the repository to GitHub.
2. In the repository settings, open **Pages**.
3. Set the source to your default branch and the `/` (root) folder.
4. Save; the site will be served from `https://<user>.github.io/<repo>/`.

Because the project uses relative paths and an import map, it works from a project subpath without configuration.

## Local preview

Modules must be served over HTTP (not opened with `file://`). Any static server works:

```bash
# Python 3
python3 -m http.server 8000

# or Node
npx http-server -p 8000
```

Then open `http://localhost:8000/`.

## File structure

```
/
├── index.html              # markup, import map, document sections
├── styles.css              # Obsidian Observatory styling
├── favicon.svg
├── README.md
├── js/
│   ├── app.js              # entry point + main loop
│   ├── constants.js        # palette, defaults
│   ├── data.js             # per-dimension names, Schläfli symbols
│   ├── content.js          # all narrative / inspector copy
│   ├── math/               # hypercube, projection, rotation, statistics
│   ├── scene/              # renderer, geometry, materials, effects
│   └── ui/                 # controls, inspector, narrative
├── docs/                   # mathematics, physics, references
└── assets/                 # (reserved)
```

## References

A short, non-fabricated reading list is in [`docs/references.md`](docs/references.md). It points to standard texts (Coxeter's *Regular Polytopes*, Banchoff's work on higher-dimensional geometry, Abbott's *Flatland* as historical fiction) and the Three.js documentation, without invented page numbers or DOIs.

## Author

Built and maintained by **Biswajit Jana** — research in exoplanet instrumentation and extreme-precision radial velocity.

- GitHub: https://github.com/Biswajit1999/hyperdimensional-atlas
- Email: biswajitj998@gmail.com

## Citation

If you use or reference this work, please cite it as:

> Jana, B. (2026). *Hyperdimensional Atlas: an interactive visual laboratory for the geometry of hypercubes (0D–8D)* [Web application]. https://biswajit1999.github.io/hyperdimensional-atlas/

```bibtex
@misc{jana2026hyperatlas,
  author = {Jana, Biswajit},
  title  = {Hyperdimensional Atlas: an interactive visual laboratory
            for the geometry of hypercubes (0D--8D)},
  year   = {2026},
  note   = {Web application},
  url    = {https://biswajit1999.github.io/hyperdimensional-atlas/}
}
```

## License

Released under the MIT License. See [`LICENSE`](LICENSE).

---

Built as a static site. Projections, not photographs. No analytics, no server.
