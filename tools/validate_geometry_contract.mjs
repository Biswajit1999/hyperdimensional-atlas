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
