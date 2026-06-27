// content.js
// All human-readable copy: per-dimension inspector text, projection
// explanations, dimensional-ladder captions, and the long-form narrative
// sections. Written to be accurate and to separate mathematics from physics.

// Plain-language "what you are seeing" for each dimension (0..8).
export const DIMENSION_BLURB = [
  // 0
  'A single point. It has no length, width, or depth — only position. Every higher cube is built by sweeping this point through space.',
  // 1
  'A line segment: the path traced when a point moves a fixed distance along one axis. Two endpoints, one edge.',
  // 2
  'A square: a segment swept perpendicular to itself. Four vertices, four edges, one filled face.',
  // 3
  'A cube: a square swept along a third axis. This is the highest cube we can see directly, with no projection required.',
  // 4
  'A tesseract shown as a 3D shadow. You cannot see a true 4-cube; this is its projection. The "cube within a cube" appears because one bounding cell is nearer in the fourth direction and the other is farther.',
  // 5
  'A penteract projected through two hidden axes into 3D. The nesting deepens: more cells overlap, so colour and depth cues help separate near from far in the collapsed directions.',
  // 6
  'A hexeract. Six bounding directions are folded into three. The figure is dense, but every crossing is an exact edge of the real 6-cube — nothing here is decorative.',
  // 7
  'A hepteract. With four hidden axes collapsed, the projection is intricate. Reducing rotation to a single plane or enabling slice mode makes the structure easier to read.',
  // 8
  'An octeract: 256 vertices and 1024 edges projected from eight dimensions into three. This is near the practical limit of legibility for a direct edge projection.',
];

export function dimensionBlurb(n) {
  if (DIMENSION_BLURB[n]) return DIMENSION_BLURB[n];
  return `A ${n}D hypercube is too large to enumerate interactively: it has ${Math.pow(2, n).toLocaleString()} vertices before edges are even drawn. The viewport therefore shows one exact 8D coordinate face embedded in Q${n}, with the remaining coordinates fixed at −1. The formulas, Hamming-shell profile, and counts remain for the complete ${n}-cube.`;
}

// Short caption shown under the dimensional ladder for the active dimension.
export const LADDER_CAPTION = [
  'A point has zero dimensions: pure position, nothing to project.',
  'A line segment is the simplest one-dimensional figure.',
  'A square lives fully in the plane — no projection needed.',
  'A cube is the last hypercube we can see directly in our space.',
  'A tesseract is not directly visible in three-dimensional space; this is its projected shadow.',
  'A penteract is shown as a projection of a projection — twice removed from direct sight.',
  'A hexeract folds six directions into three; every line is a genuine edge.',
  'A hepteract: four hidden axes collapsed into the visible three.',
  'An octeract: the projected shadow of an eight-dimensional cube.',
];

export function ladderCaption(n) {
  if (LADDER_CAPTION[n]) return LADDER_CAPTION[n];
  return `${n}D view: one exact 8D coordinate face on screen; exact full-Q${n} combinatorics in the inspector.`;
}

// Projection-mode explanations (for the inspector).
export const PROJECTION_EXPLAIN = {
  orthographic:
    'Orthographic (parallel) projection drops the hidden coordinates without scaling. Parallel edges stay parallel, so nesting is uniform but depth in the collapsed directions is flat.',
  perspective:
    'Perspective projection scales each hidden coordinate by f / (f − q): cells nearer along a hidden axis appear larger. This produces the familiar cube-within-cube look.',
  sequential:
    'Sequential projection collapses one hidden axis at a time with a focal length that grows at each stage, giving a gentler, more legible nesting for high dimensions.',
};

// Long-form narrative sections rendered below the canvas.
// Each entry: { id, kicker, title, html }. The html is trusted static content.
export const NARRATIVE_SECTIONS = [
  {
    id: 'from-point-to-hypercube',
    kicker: '01 — Construction',
    title: 'From Point to Hypercube',
    html: `
      <p>Every cube is built by sweeping the one below it through a new, perpendicular
      direction. A point swept along an axis becomes a segment. A segment swept
      sideways becomes a square. A square lifted becomes a cube. Continue the same
      move into a fourth perpendicular direction and you get a tesseract.</p>
      <p>The pattern is exact. Sweeping doubles the vertices each time, which is why an
      <em>n</em>-cube has <strong>2<sup>n</sup></strong> vertices: 1, 2, 4, 8, 16, 32, 64, 128, 256.
      The number of edges follows the same logic — each old vertex gains one new edge
      along the sweep direction — giving <strong>n·2<sup>n−1</sup></strong> edges.</p>
      <div class="mini" data-mini="sweep" aria-label="Interactive sweep diagram"></div>
      <p class="caption">Each step adds one perpendicular direction. We run out of
      directions to <em>see</em> at three, but not directions to <em>compute</em>.</p>
    `,
  },
  {
    id: 'how-we-see',
    kicker: '02 — Projection',
    title: 'How We See What We Cannot See',
    html: `
      <p>We have no sensory access to a fourth spatial axis, so we do what cartographers
      do with a globe: we project. A perspective projection divides each visible
      coordinate by its distance along the hidden axis,</p>
      <p class="equation">scale = f / (f − q)</p>
      <p>so the bounding cell that is "nearer" in the fourth direction is drawn larger and
      the "farther" one smaller. The result is the cube-within-a-cube. The inner and
      outer cubes are the <em>same size</em> in four dimensions; the size difference is
      an artefact of projection, exactly like railway tracks narrowing toward a horizon.</p>
      <div class="mini" data-mini="projection" aria-label="Interactive projection diagram"></div>
      <p class="caption">Colour in the main view encodes position along the hidden axes.
      It is a reading aid, not a physical property of those dimensions.</p>
    `,
  },
  {
    id: 'rotations',
    kicker: '03 — Rotation',
    title: 'Rotations Beyond Axes',
    html: `
      <p>In three dimensions we speak of rotating "around an axis", but that is a
      coincidence of having exactly three directions. A rotation really happens
      <em>in a plane</em>. In 3D the plane of rotation has one leftover perpendicular
      direction, which we call the axis. In four dimensions a rotation in one plane
      leaves a whole plane fixed, not a line.</p>
      <p class="equation">x<sub>i</sub>′ = x<sub>i</sub> cos θ − x<sub>j</sub> sin θ &nbsp;&nbsp;
      x<sub>j</sub>′ = x<sub>i</sub> sin θ + x<sub>j</sub> cos θ</p>
      <p>An <em>n</em>-dimensional figure has <strong>n(n−1)/2</strong> independent rotation
      planes — six in 4D, ten in 5D. Driving two planes at once produces the
      double rotation that makes a tesseract appear to turn itself inside out.</p>
      <div class="mini" data-mini="planes" aria-label="Rotation plane diagram"></div>
    `,
  },
  {
    id: 'cosmos',
    kicker: '04 — Physics',
    title: 'Geometry, Physics, and the Universe',
    html: `
      <p>A tesseract is a four-dimensional <em>Euclidean spatial</em> object. It is not
      the same thing as spacetime. Modern physics models spacetime as three spatial
      dimensions plus one time dimension, and in relativity time does not behave like an
      ordinary spatial axis — its contribution to the interval carries the opposite sign.</p>
      <p>General relativity describes spacetime as a curved four-dimensional manifold.
      Frameworks such as Kaluza–Klein models and string theory introduce additional
      spatial dimensions for mathematical consistency, typically compactified at tiny
      scales. No confirmed experiment has revealed large, directly accessible extra
      spatial dimensions.</p>
      <p>Astronomy, meanwhile, already reasons in high-dimensional spaces every day —
      stellar spectra, exoplanet population parameters, Gaia astrometry, and cosmological
      likelihood surfaces all live in many dimensions. We never see those spaces directly;
      we understand them through projections, slices, and correlations. That is exactly
      the habit of mind this atlas is built to exercise.</p>
    `,
  },
  {
    id: 'meaning',
    kicker: '05 — Interpretation',
    title: 'What Higher Dimensions Do — and Do Not — Mean',
    html: `
      <p>This is a visual instrument for mathematics. Everything you rotate and slice here
      is an exact projection of a real geometric object. But a projection is a choice, and
      a beautiful projection is still not evidence.</p>
      <p>A simulation can build intuition; it cannot replace measurement. The cube-within-a-cube
      is true to the geometry of a 4-cube and tells you nothing, on its own, about whether
      our universe has extra dimensions. Keep the two questions separate: <em>what is the
      structure of this mathematical object</em>, and <em>what does the physical world
      actually contain</em>. The first is settled here; the second is decided in laboratories
      and observatories.</p>
    `,
  },
];
