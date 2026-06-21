// statistics.js
// Exact combinatorics of the n-cube and human-readable measure expressions.
//
// Key identities (all verified against known polytope data):
//   vertices  V        = 2^n
//   edges     E        = n * 2^(n-1)
//   k-faces   f_k(n)   = C(n, k) * 2^(n-k)
//   hypervolume        = s^n
//   boundary measure   = 2n * s^(n-1)

/** Binomial coefficient C(n, k) using a stable integer product. */
export function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

export function binomialBigInt(n, k) {
  if (k < 0 || k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  k = Math.min(k, n - k);
  let result = 1n;
  for (let i = 0; i < k; i++) {
    result = (result * BigInt(n - i)) / BigInt(i + 1);
  }
  return result;
}

/**
 * Number of k-dimensional faces of an n-cube:  C(n, k) * 2^(n-k).
 * k = 0 vertices, k = 1 edges, k = 2 squares, k = 3 cubic cells, ...
 */
export function faceCount(n, k) {
  if (k < 0 || k > n) return 0;
  return binomial(n, k) * Math.pow(2, n - k);
}

export function faceCountExact(n, k) {
  if (k < 0 || k > n) return 0n;
  return binomialBigInt(n, k) * (2n ** BigInt(n - k));
}

export function formatCount(value) {
  return value.toLocaleString();
}

/** Superscript helper for compact "s^n" style strings. */
function sup(n) {
  const map = { '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n).split('').map((d) => map[d] ?? d).join('');
}

/**
 * Full statistics bundle for a given dimension.
 * @param {number} n 0..8
 */
export function getStats(n) {
  const vertices = faceCount(n, 0);            // 2^n
  const edges = n === 0 ? 0 : faceCount(n, 1); // n * 2^(n-1)
  const squares = faceCount(n, 2);
  const cubes = faceCount(n, 3);

  // Hypervolume and boundary measure as readable expressions in side length s.
  const hypervolume = n === 0 ? '1 (a single point)' : `s${sup(n)}`;
  const boundary =
    n === 0 ? '0' :
    n === 1 ? '2 (two endpoints)' :
    `${2 * n}·s${sup(n - 1)}`;

  // Full face vector f_0 .. f_n (vertices, edges, squares, cells, ...).
  const faceVector = [];
  for (let k = 0; k <= n; k++) faceVector.push(faceCount(n, k));

  return { n, vertices, edges, squares, cubes, hypervolume, boundary, faceVector };
}
