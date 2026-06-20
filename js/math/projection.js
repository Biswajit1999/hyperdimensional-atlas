// projection.js
// Project an n-dimensional point down to 3D for rendering.
//
// Three modes are supported:
//   orthographic  - drop coordinates beyond the third (parallel projection).
//   perspective   - collapse each hidden coordinate with a single shared
//                   perspective factor scale = f / (f - q).
//   sequential    - same collapse, but the focal length grows at each stage so
//                   the nesting is gentler and more legible for high n.
//
// Near a projection singularity (q -> f) the scale factor blows up, and for high
// dimensions the per-stage scaling compounds. We keep the geometry bounded with
// three guards: (a) lift the focal length to at least sqrt(n)+margin, since a
// rotated unit vertex can have a coordinate up to sqrt(n); (b) clamp each stage's
// magnification with SCALE_CAP; and (c) clamp the final point into a ball of
// radius MAX_RADIUS so nothing can ever fly off to infinity.

const MIN_DENOM = 0.35;
const FOCAL_MARGIN = 1.2;
const SCALE_CAP = 2.1;     // maximum perspective magnification per collapse stage
const MAX_RADIUS = 3.3;    // final safety clamp on projected radius

/** Effective focal length: never small enough to cross a vertex. */
function effectiveFocal(focal, n) {
  return Math.max(focal, Math.sqrt(n) + FOCAL_MARGIN);
}

// Reused scratch buffer (max 8 dimensions). Avoids per-call allocation.
const projectScratch = new Float64Array(8);

/**
 * Project one coordinate vector to a 3D [x, y, z] array.
 * @param {ArrayLike<number>} coords rotated coordinates (length >= n)
 * @param {number} n dimension
 * @param {string} mode 'orthographic' | 'perspective' | 'sequential'
 * @param {number} focal focal length parameter
 * @param {number[]} out reusable length-3 output array
 * @returns {number[]} out
 */
export function project(coords, n, mode, focal, out) {
  // Work on a local copy so we can collapse coordinates destructively.
  const c = projectScratch;
  for (let k = 0; k < n; k++) c[k] = coords[k];

  if (mode !== 'orthographic') {
    const fEff = effectiveFocal(focal, n);
    let dim = n;
    let stage = 0;
    while (dim > 3) {
      const q = c[dim - 1];
      // Sequential mode widens the focal length at each stage for gentler nesting.
      const f = mode === 'sequential' ? fEff + stage * 0.6 : fEff;
      const denom = Math.max(f - q, MIN_DENOM);
      const scale = Math.min(f / denom, SCALE_CAP); // cap magnification per stage
      for (let k = 0; k < dim - 1; k++) c[k] *= scale;
      dim--;
      stage++;
    }
  }

  // For orthographic (or n <= 3) we simply read the first three coordinates.
  out[0] = n > 0 ? c[0] : 0;
  out[1] = n > 1 ? c[1] : 0;
  out[2] = n > 2 ? c[2] : 0;

  // Final safety clamp: project any out-of-bounds vertex back onto the ball of
  // radius MAX_RADIUS so a near-singular alignment can never explode the figure.
  const r2 = out[0] * out[0] + out[1] * out[1] + out[2] * out[2];
  if (r2 > MAX_RADIUS * MAX_RADIUS) {
    const s = MAX_RADIUS / Math.sqrt(r2);
    out[0] *= s; out[1] *= s; out[2] *= s;
  }
  return out;
}

/**
 * A normalised "hidden depth" value in roughly [-1, 1] used purely as a visual
 * encoding of how far a vertex sits along the collapsed (4th and higher) axes.
 * Returns 0 when there are no hidden dimensions (n <= 3).
 * NOTE: this is a visualisation cue only, not a physical property of those axes.
 */
export function hiddenDepth(coords, n) {
  if (n <= 3) return 0;
  let sum = 0;
  for (let k = 3; k < n; k++) sum += coords[k];
  const hiddenCount = n - 3;
  // Each coordinate of a rotated unit vertex lies within [-sqrt(n), sqrt(n)];
  // dividing by sqrt(n) keeps the mean comfortably within a stable range.
  return sum / (hiddenCount * Math.sqrt(n));
}

/**
 * Report whether the current configuration is near high perspective
 * exaggeration, so the UI can warn that the shape is heavily distorted.
 */
export function perspectiveWarning(n, focal) {
  if (n <= 3) return false;
  const fEff = effectiveFocal(focal, n);
  return fEff - Math.sqrt(n) < 1.0;
}
