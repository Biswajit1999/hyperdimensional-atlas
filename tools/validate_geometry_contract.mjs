const EPS = 1e-10;

function assertNear(name, value, expected, tolerance = EPS) {
  const pass = Math.abs(value - expected) <= tolerance;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) {
    console.log(`  value=${value} expected=${expected} tolerance=${tolerance}`);
    process.exitCode = 1;
  }
}

function assertTrue(name, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}`);
  if (!condition) process.exitCode = 1;
}

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = (result * (n - k + i)) / i;
  return result;
}

function vertexCount(n) {
  return 2 ** n;
}

function edgeCount(n) {
  return n === 0 ? 0 : n * 2 ** (n - 1);
}

function faceCount(n, k) {
  return choose(n, k) * 2 ** (n - k);
}

function generateVertices(n) {
  const count = vertexCount(n);
  const dim = Math.max(n, 1);
  const vertices = [];
  for (let v = 0; v < count; v += 1) {
    const p = new Array(dim).fill(0);
    for (let b = 0; b < n; b += 1) p[b] = (v & (1 << b)) ? 1 : -1;
    vertices.push(p);
  }
  return vertices;
}

function generateEdges(n) {
  const count = vertexCount(n);
  const edges = [];
  for (let v = 0; v < count; v += 1) {
    for (let b = 0; b < n; b += 1) {
      const u = v ^ (1 << b);
      if (u > v) edges.push([v, u]);
    }
  }
  return edges;
}

function hamming(a, b, n) {
  let distance = 0;
  for (let k = 0; k < n; k += 1) if (a[k] !== b[k]) distance += 1;
  return distance;
}

function rotateInPlane(p, i, j, theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  const a = p[i];
  const b = p[j];
  p[i] = a * c - b * s;
  p[j] = a * s + b * c;
  return p;
}

function norm2(p) {
  return p.reduce((sum, x) => sum + x * x, 0);
}

function distance(a, b) {
  return Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));
}

function orthographicProject(p) {
  return [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];
}

function sequentialProjection(p) {
  const out = orthographicProject(p);
  for (let k = 3; k < p.length; k += 1) {
    const weight = 0.22 / (k - 1);
    out[0] += weight * p[k];
    out[1] -= 0.72 * weight * p[k];
    out[2] += 0.48 * weight * p[k];
  }
  return out;
}

function perspectiveProject(p, focal = 7) {
  const w = focal - 0.35 * (p[3] ?? 0) - 0.18 * (p[4] ?? 0);
  const scale = focal / Math.max(1e-6, w);
  return [(p[0] ?? 0) * scale, (p[1] ?? 0) * scale, (p[2] ?? 0) * scale];
}

function edgeLengths(vertices, edges, projector) {
  const projected = vertices.map(projector);
  return edges.map(([a, b]) => distance(projected[a], projected[b]));
}

function stats(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, x) => sum + x, 0) / values.length;
  return { min, max, mean, ratio: max / Math.max(min, 1e-12) };
}

for (let n = 0; n <= 8; n += 1) {
  const vertices = generateVertices(n);
  const edges = generateEdges(n);
  assertNear(`vertex count ${n}D`, vertices.length, vertexCount(n), 0);
  assertNear(`edge count ${n}D`, edges.length, edgeCount(n), 0);
  if (n > 0) {
    assertTrue(`all ${n}D edges have Hamming distance one`, edges.every(([a, b]) => hamming(vertices[a], vertices[b], n) === 1));
  }
}

assertNear('square has four vertices', vertexCount(2), 4, 0);
assertNear('cube has twelve edges', edgeCount(3), 12, 0);
assertNear('tesseract has sixteen vertices', vertexCount(4), 16, 0);
assertNear('tesseract has thirty-two edges', edgeCount(4), 32, 0);
assertNear('5-cube has eighty square faces', faceCount(5, 2), 80, 0);
assertNear('8-cube has 1792 cubic cells', faceCount(8, 3), 1792, 0);

const p = [1, -1, 1, -1, 1];
const before = norm2(p);
rotateInPlane(p, 1, 4, Math.PI / 3);
assertNear('plane rotation preserves squared radius', norm2(p), before, 1e-12);

const p0 = [1, 2, 3, 4];
const q0 = rotateInPlane([...p0], 0, 3, 0);
assertTrue('zero-angle rotation is identity', q0.every((x, i) => x === p0[i]));

const side = 2;
for (let n = 0; n <= 8; n += 1) {
  assertNear(`hypercube side-two volume ${n}D`, side ** n, 2 ** n, 0);
  if (n > 0) assertNear(`hypercube side-two boundary ${n}D`, 2 * n * side ** (n - 1), 2 * n * 2 ** (n - 1), 0);
}

const cube3 = generateVertices(3);
const cube3Edges = generateEdges(3);
const cube3Lengths = edgeLengths(cube3, cube3Edges, orthographicProject);
assertTrue('3D orthographic cube preserves all edge lengths', cube3Lengths.every((x) => Math.abs(x - 2) < 1e-12));

const cube5 = generateVertices(5);
const cube5Edges = generateEdges(5);
const orthographicLengths5 = edgeLengths(cube5, cube5Edges, orthographicProject);
const collapsedEdges = orthographicLengths5.filter((x) => x < 1e-12).length;
assertNear('5D orthographic projection collapses hidden-axis edges', collapsedEdges, edgeCount(5) - edgeCount(3) * 2 ** 2, 0);
assertTrue('5D orthographic projection needs distortion warning', collapsedEdges > 0);

const sequentialLengths5 = edgeLengths(cube5, cube5Edges, sequentialProjection);
const sequentialStats = stats(sequentialLengths5);
assertTrue('sequential projection keeps every 5D edge visible but distorted', sequentialStats.min > 0 && sequentialStats.ratio > 1.5);

const perspectiveLengths5 = edgeLengths(cube5, cube5Edges, perspectiveProject);
const perspectiveStats = stats(perspectiveLengths5);
assertTrue('perspective projection is finite for the documented focal distance', perspectiveLengths5.every(Number.isFinite));
assertTrue('perspective projection distorts equal high-dimensional edges', perspectiveStats.ratio > 1.1);

console.log(`Projection length ratios: orthographic hidden-collapse=${collapsedEdges}, sequential=${sequentialStats.ratio.toFixed(3)}, perspective=${perspectiveStats.ratio.toFixed(3)}`);