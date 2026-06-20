// rotation.js
// Rotations in n dimensions happen in coordinate *planes*, not around axes.
// A rotation by angle theta in the plane spanned by axes (i, j) acts as:
//
//   x_i' = x_i cos(theta) - x_j sin(theta)
//   x_j' = x_i sin(theta) + x_j cos(theta)
//
// with all other coordinates unchanged. An n-dimensional rotation has
// n(n-1)/2 independent planes; we let the user drive several at once.

/**
 * Rotate a single coordinate vector in place in plane (i, j) by angle theta.
 * cos/sin are passed in so the caller can precompute them once per frame.
 */
export function rotateInPlane(p, i, j, cos, sin) {
  const a = p[i];
  const b = p[j];
  p[i] = a * cos - b * sin;
  p[j] = a * sin + b * cos;
}

/**
 * Build the list of named rotation-plane presets for a given dimension.
 * Each preset is { name, planes: [[i, j], ...] }. Indices are 0-based
 * (0 = x, 1 = y, 2 = z, 3 = w, ...).
 */
export function rotationPresets(n) {
  if (n < 2) return [{ name: 'None (too few dimensions)', planes: [] }];

  if (n === 2) {
    return [{ name: 'x–y', planes: [[0, 1]] }];
  }

  if (n === 3) {
    return [
      { name: 'x–y', planes: [[0, 1]] },
      { name: 'x–z', planes: [[0, 2]] },
      { name: 'y–z', planes: [[1, 2]] },
      { name: 'tumble (x–y + y–z)', planes: [[0, 1], [1, 2]] },
    ];
  }

  if (n === 4) {
    return [
      { name: 'x–w', planes: [[0, 3]] },
      { name: 'y–w', planes: [[1, 3]] },
      { name: 'z–w', planes: [[2, 3]] },
      { name: 'x–y + z–w', planes: [[0, 1], [2, 3]] },
      { name: 'x–z + y–w', planes: [[0, 2], [1, 3]] },
      { name: 'double (x–w + y–z)', planes: [[0, 3], [1, 2]] },
    ];
  }

  // n >= 5: generate sensible presets that always involve the hidden axes.
  const last = n - 1;
  const axisName = (k) => (k < 3 ? ['x', 'y', 'z'][k] : `q${k + 1}`);
  const label = (planes) =>
    planes.map(([i, j]) => `${axisName(i)}–${axisName(j)}`).join(' + ');

  const presets = [];
  presets.push({ name: label([[0, last]]), planes: [[0, last]] });
  presets.push({ name: label([[1, last - 1]]), planes: [[1, last - 1]] });
  presets.push({
    name: 'double ' + label([[0, last], [1, last - 1]]),
    planes: [[0, last], [1, last - 1]],
  });

  // Cascade: pair each visible axis with a successive hidden axis.
  const cascade = [];
  for (let v = 0; v < 3 && 3 + v < n; v++) cascade.push([v, 3 + v]);
  if (cascade.length) {
    presets.push({ name: 'cascade ' + label(cascade), planes: cascade });
  }

  // Full hidden mix: chain all consecutive hidden-axis pairs plus a visible link.
  const full = [[0, last]];
  for (let k = 3; k + 1 < n; k += 2) full.push([k, k + 1]);
  presets.push({ name: 'multi-plane', planes: dedupePlanes(full) });

  return presets;
}

/** Remove duplicate / degenerate planes from a list. */
function dedupePlanes(planes) {
  const seen = new Set();
  const out = [];
  for (const [i, j] of planes) {
    if (i === j) continue;
    const key = i < j ? `${i},${j}` : `${j},${i}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([i, j]);
  }
  return out;
}

// Slightly different angular rate per plane so stacked rotations never collapse
// into a single degenerate motion. Deterministic by index.
const PLANE_RATES = [1.0, 0.78, 0.61, 0.47, 0.37, 0.29];

export function planeRate(index) {
  return PLANE_RATES[index % PLANE_RATES.length];
}
