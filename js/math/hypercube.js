// hypercube.js
// Rigorous generation of the n-dimensional hypercube (n-cube).
//
// A centred n-cube is the set of all points whose coordinates are each either
// -1 or +1. There are exactly 2^n such vertices. We enumerate them by reading
// the bits of an integer index v in [0, 2^n): bit b set -> +1 on axis b,
// bit b clear -> -1 on axis b.
//
// Two vertices are joined by an edge iff their coordinate vectors differ in
// exactly one coordinate (Hamming distance 1). In the integer-index encoding
// this is a single-bit flip, which makes edge enumeration exact and cheap:
// for each vertex v and each bit b the neighbour is (v XOR (1<<b)).

/**
 * Generate all 2^n vertices of the centred n-cube.
 * @param {number} n dimension (0..8 fully enumerated by the app)
 * @returns {Float64Array[]} vertices, each a Float64Array of length max(n,1)
 */
export function generateVertices(n) {
  const count = Math.pow(2, n);    // 2^n  (n = 0 -> 1 vertex)
  const dim = Math.max(n, 1);      // store >=1 coordinate so 0D is a point at origin
  const vertices = new Array(count);
  for (let v = 0; v < count; v++) {
    const p = new Float64Array(dim);
    for (let b = 0; b < n; b++) {
      p[b] = (v & (1 << b)) ? 1 : -1;
    }
    vertices[v] = p; // for n === 0 the lone coordinate stays 0 (the origin)
  }
  return vertices;
}

/**
 * Generate the edge list (index pairs) for an n-cube via single-bit flips.
 * Edge count is exactly n * 2^(n-1).
 * @param {number} n dimension
 * @returns {Array<[number, number]>}
 */
export function generateEdges(n) {
  const count = Math.pow(2, n);
  const edges = [];
  for (let v = 0; v < count; v++) {
    for (let b = 0; b < n; b++) {
      const u = v ^ (1 << b);
      if (u > v) edges.push([v, u]); // add each undirected edge exactly once
    }
  }
  return edges;
}

/**
 * Cross-section of the solid n-cube by the hyperplane (axis = c), |c| <= 1.
 * The intersection of [-1, +1]^n with {x_axis = c} is itself an (n-1)-cube:
 * the remaining n-1 coordinates still range over {-1, +1}, while the sliced
 * axis is pinned to c. We return vertices in the SAME n-dimensional space (the
 * sliced coordinate is kept at c) so the slice can be projected in context, and
 * the matching (n-1)-cube edge list.
 *
 * @param {number} n dimension of the parent cube (n >= 1)
 * @param {number} axis index of the coordinate being fixed (0..n-1)
 * @param {number} c slice position in [-1, 1]
 * @returns {{vertices: Float64Array[], edges: Array<[number, number]>, subDim: number}}
 */
export function sliceCube(n, axis, c) {
  const subDim = Math.max(n - 1, 0);
  const subVerts = generateVertices(subDim); // (n-1)-cube vertices
  const vertices = subVerts.map((sv) => {
    const p = new Float64Array(Math.max(n, 1));
    let s = 0;
    for (let k = 0; k < n; k++) {
      if (k === axis) {
        p[k] = c;
      } else {
        p[k] = subDim > 0 ? sv[s++] : 0;
      }
    }
    return p;
  });
  return { vertices, edges: generateEdges(subDim), subDim };
}

/** Number of vertices = 2^n. */
export function vertexCount(n) {
  return Math.pow(2, n);
}

/** Number of edges = n * 2^(n-1); 0 for n = 0. */
export function edgeCount(n) {
  return n === 0 ? 0 : n * Math.pow(2, n - 1);
}

/**
 * Exact level-of-detail geometry for high-dimensional cubes.
 *
 * Enumerating all vertices of Q_n is intentionally bounded by the renderer.
 * Above that boundary, this function renders an exact m-dimensional coordinate
 * face Q_m embedded in Q_n: the first m axes vary over {-1,+1}; every remaining
 * coordinate is fixed at -1. Therefore every displayed point is a genuine
 * vertex of Q_n and every displayed segment is a genuine Q_n edge. It is not a
 * stochastic cloud, and it does not imply that the displayed face is the whole
 * n-cube. The inspector exposes this distinction alongside the exact global
 * combinatorics and Hamming-weight profile.
 *
 * @param {number} n requested parent dimension
 * @param {number} axes maximum dimension of the exact coordinate face
 * @returns {{vertices: Float64Array[], edges: Array<[number, number]>, sampleAxes: number, fixedAxes: number, representation: string}}
 */
export function generatePreviewSkeleton(n, axes = 8) {
  const sampleAxes = Math.max(1, Math.min(axes, n));
  const count = Math.pow(2, sampleAxes);
  const vertices = new Array(count);

  for (let v = 0; v < count; v++) {
    const p = new Float64Array(Math.max(n, 1));
    for (let b = 0; b < sampleAxes; b++) {
      p[b] = (v & (1 << b)) ? 1 : -1;
    }
    // Fix the remaining coordinates at a true boundary value. Earlier previews
    // used pseudo-random interior values here, which meant their displayed
    // points were not vertices of the parent n-cube.
    for (let b = sampleAxes; b < n; b++) p[b] = -1;
    vertices[v] = p;
  }

  return {
    vertices,
    edges: generateEdges(sampleAxes),
    sampleAxes,
    fixedAxes: n - sampleAxes,
    representation: 'exact-coordinate-face',
  };
}
