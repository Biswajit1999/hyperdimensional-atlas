// app.js
// Application entry point and main loop. Wires the math engine to the Three.js
// scene and the DOM UI, owns the shared state, and recomputes geometry only when
// it must (dimension / slice / rotation-plane changes); cosmetic changes reuse
// the existing buffers.

import * as THREE from 'three';
import { DEFAULTS, FULL_RENDER_DIM_MAX, HIGH_DIM_PREVIEW_AXES, RENDER_SCALE } from './constants.js';
import {
  generateVertices, generateEdges, generatePreviewSkeleton, sliceCube, vertexCount, edgeCount,
} from './math/hypercube.js';
import { rotateInPlane, rotationPresets, planeRate } from './math/rotation.js';
import { project, hiddenDepth } from './math/projection.js';
import { getStats, faceCountExact, formatCount } from './math/statistics.js';
import { LADDER_DIMENSIONS, dimensionData } from './data.js';
import { SceneManager, webGLDiagnostics } from './scene/renderer.js?v=20260621b';
import { createMaterials } from './scene/materials.js';
import { HypercubeObject } from './scene/geometry.js';
import { depthColor } from './scene/materials.js';
import { Inspector } from './ui/inspector.js';
import { Controls } from './ui/controls.js';
import { buildNarrative } from './ui/narrative.js';

const prefersReducedMotion =
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const forceFallback =
  new URLSearchParams(window.location.search).has('fallback');

// ---- Shared state ----------------------------------------------------------
const state = structuredClone(DEFAULTS);
if (prefersReducedMotion) state.autoRotate = false;

// ---- Scene (with graceful WebGL fallback) ---------------------------------
// The authoritative test for WebGL is whether the renderer actually
// constructs; a feature-detect alone gives false negatives on some browsers.
// So we attempt the real scene and only fall back if it genuinely throws.
const canvas = document.getElementById('scene');
let scene, materials, hypercube;
let webglReady = true;
try {
  if (forceFallback) throw new Error('Fallback preview requested by URL');
  scene = new SceneManager(canvas, { reducedMotion: prefersReducedMotion });
  materials = createMaterials();
  hypercube = new HypercubeObject(scene.scene, materials);
} catch (err) {
  console.warn('Hyperdimensional Atlas — WebGL scene unavailable:', err);
  webglReady = false;
  showWebGLFallback(err);
}

// ---- UI --------------------------------------------------------------------
let inspector = null;
let controls = null;

if (webglReady) {
  inspector = new Inspector(document.getElementById('inspector'));
  controls = new Controls(
    {
      panel: document.getElementById('controls'),
      ladder: document.getElementById('ladder'),
      captionEl: document.getElementById('ladder-caption'),
      perf: {
        fps: document.getElementById('perf-fps'),
        verts: document.getElementById('perf-verts'),
        edges: document.getElementById('perf-edges'),
        dim: document.getElementById('perf-dim'),
      },
    },
    state,
    {
      onChange: handleChange,
      onResetView: resetView,
      onTogglePanels: togglePanels,
    },
  );
}

const diagrams = buildNarrative(document.getElementById('narrative'), prefersReducedMotion);

// ---- Working buffers (rebuilt on topology change) --------------------------
let base = { vertices: [], edges: [], n: -1 };
let projectedPos = new Float32Array(3);
let colorBuf = new Float32Array(3);
let scratch = new Float64Array(64);
const colorTmp = new THREE.Color();
const out3 = [0, 0, 0];

// Per-plane accumulated angles, keyed by "i,j".
const planeAngles = new Map();

function activePlanes() {
  const presets = rotationPresets(state.dimension);
  const preset = presets[Math.min(state.presetIndex, presets.length - 1)] || { planes: [] };
  const planes = preset.planes;
  if (!planes.length) return [];
  return state.multiPlane ? planes : [planes[0]];
}

// Rebuild base vertex/edge data and reallocate GPU buffers.
function rebuildTopology() {
  const n = state.dimension;
  if (n > FULL_RENDER_DIM_MAX) {
    state.slice.enabled = false;
    const preview = generatePreviewSkeleton(n, HIGH_DIM_PREVIEW_AXES);
    base = { vertices: preview.vertices, edges: preview.edges, n, preview: true };
  } else if (state.slice.enabled && n >= 1) {
    const axis = Math.min(state.slice.axis, Math.max(n - 1, 0));
    const r = sliceCube(n, axis, state.slice.position);
    base = { vertices: r.vertices, edges: r.edges, n };
  } else {
    base = { vertices: generateVertices(n), edges: generateEdges(n), n };
  }
  const V = base.vertices.length;
  projectedPos = new Float32Array(V * 3);
  colorBuf = new Float32Array(V * 3);
  hypercube.setTopology(V, base.edges);
}

// Recompute projected positions + colours for the current frame.
function computeFrame() {
  const n = state.dimension;
  const planes = activePlanes();

  // Precompute cos/sin for each active plane at its current angle.
  const trig = planes.map(([i, j]) => {
    const key = `${i},${j}`;
    const a = planeAngles.get(key) || 0;
    return { i, j, cos: Math.cos(a), sin: Math.sin(a) };
  });

  const verts = base.vertices;
  for (let v = 0; v < verts.length; v++) {
    const src = verts[v];
    for (let k = 0; k < n; k++) scratch[k] = src[k];

    for (let t = 0; t < trig.length; t++) {
      rotateInPlane(scratch, trig[t].i, trig[t].j, trig[t].cos, trig[t].sin);
    }

    const depth = hiddenDepth(scratch, n);
    project(scratch, n, state.projection, state.focalLength, out3);

    const o = v * 3;
    projectedPos[o] = out3[0] * RENDER_SCALE;
    projectedPos[o + 1] = out3[1] * RENDER_SCALE;
    projectedPos[o + 2] = out3[2] * RENDER_SCALE;

    depthColor(depth, state.colorEncoding, colorTmp);
    colorBuf[o] = colorTmp.r;
    colorBuf[o + 1] = colorTmp.g;
    colorBuf[o + 2] = colorTmp.b;
  }

  hypercube.update(projectedPos, colorBuf, {
    wireframe: state.wireframe,
    vertexMarkers: state.vertexMarkers,
    ghostTrails: state.ghostTrails,
  });
}

// ---- Change handling -------------------------------------------------------
function handleChange(reason) {
  if (reason === 'dimension' || reason === 'slice') {
    rebuildTopology();
    inspector.update(state);
    updateMathTable(state.dimension);
  } else if (reason === 'rotation') {
    // Active plane set changed; nothing to reallocate.
  } else {
    // 'render' / 'projection' — cosmetic, handled next frame.
    inspector.update(state);
  }
}

function resetView() {
  scene.resetCamera();
  planeAngles.clear();
}

function togglePanels() {
  state.showPanels = !state.showPanels;
  document.body.classList.toggle('panels-hidden', !state.showPanels);
}

function applyStageComposition() {
  if (!hypercube) return;
  const wide = window.innerWidth >= 1180;
  hypercube.object3d.position.set(wide ? 1.35 : 0, wide ? -0.04 : 0, 0);
  hypercube.object3d.scale.setScalar(wide ? 0.96 : 0.9);
}

window.addEventListener('resize', applyStageComposition);

// ---- Mathematics section tables -------------------------------------------
function updateMathTable(n) {
  const tbody = document.getElementById('combinatorics-body');
  if (!tbody) return;
  const stats = getStats(n);
  const d = dimensionData(n);
  document.getElementById('combinatorics-title').textContent =
    `${n}D — ${d.name} (${d.ncube})`;
  let rows = '';
  for (let k = 0; k <= n; k++) {
    const label = ['vertices', 'edges', 'squares', 'cubic cells'][k] || `${k}-faces`;
    rows += `<tr><td class="mono">${k}</td><td>${label}</td><td class="mono">${formatCount(faceCountExact(n, k))}</td></tr>`;
  }
  tbody.innerHTML = rows;
  document.getElementById('formula-vertices').textContent = stats.vertices.toLocaleString();
  document.getElementById('formula-edges').textContent = stats.edges.toLocaleString();
}

function buildGrowthTable() {
  const tbody = document.getElementById('growth-body');
  if (!tbody) return;
  tbody.innerHTML = LADDER_DIMENSIONS.map((d) => {
    const s = d.stats;
    return `<tr>
      <td class="mono">${d.n}D</td>
      <td>${d.name}</td>
      <td class="mono">${s.vertices.toLocaleString()}</td>
      <td class="mono">${s.edges.toLocaleString()}</td>
      <td class="mono">${s.squares.toLocaleString()}</td>
      <td class="mono">${s.cubes.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

// ---- Navigation ------------------------------------------------------------
function setupNav() {
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
  const tl = document.getElementById('toggle-left');
  const tr = document.getElementById('toggle-right');
  if (tl) tl.addEventListener('click', () => document.body.classList.toggle('show-left'));
  if (tr) tr.addEventListener('click', () => document.body.classList.toggle('show-right'));
}

function startAmbientField() {
  const ambient = document.getElementById('ambient-field');
  const ctx = ambient && ambient.getContext('2d');
  if (!ctx) return;

  const particles = Array.from({ length: prefersReducedMotion ? 42 : 88 }, (_, i) => ({
    x: (i * 0.61803398875) % 1,
    y: (i * 0.41421356237) % 1,
    r: 0.5 + ((i * 17) % 9) * 0.08,
    speed: 0.006 + ((i * 13) % 11) * 0.0014,
    hue: i % 5,
  }));

  let width = 1;
  let height = 1;
  let dpr = 1;

  function resizeAmbient() {
    const rect = ambient.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    ambient.width = width * dpr;
    ambient.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    resizeAmbient();
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const t = prefersReducedMotion ? 10 : now * 0.001;
    const palette = [
      'rgba(81,240,229,0.62)',
      'rgba(134,240,184,0.50)',
      'rgba(111,156,255,0.46)',
      'rgba(184,140,255,0.42)',
      'rgba(245,189,99,0.38)',
    ];

    for (let rail = 0; rail < 5; rail++) {
      const y = ((rail * 0.21 + t * 0.018) % 1) * height;
      ctx.strokeStyle = rail % 2 ? 'rgba(81,240,229,0.08)' : 'rgba(245,189,99,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(width * 0.08, y);
      ctx.lineTo(width * 0.94, y - height * (0.18 + rail * 0.025));
      ctx.stroke();
    }

    const pts = particles.map((p, i) => {
      const drift = prefersReducedMotion ? 0 : t * p.speed;
      const x = ((p.x + drift) % 1) * width;
      const y = ((p.y + Math.sin(t * 0.18 + i) * 0.012 + drift * 0.36) % 1) * height;
      return { ...p, x, y };
    });

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      ctx.fillStyle = palette[a.hue];
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < Math.min(i + 4, pts.length); j++) {
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        const max = width < 760 ? 7800 : 14000;
        if (d2 < max) {
          ctx.strokeStyle = `rgba(81,240,229,${0.08 * (1 - d2 / max)})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  resizeAmbient();
  draw(performance.now());
}

function showWebGLFallback(err) {
  const fallback = document.getElementById('webgl-fallback');
  const stage = document.getElementById('stage');
  if (fallback) fallback.hidden = false;
  if (stage) stage.classList.add('no-webgl');

  const diagnostic = document.getElementById('webgl-diagnostic');
  if (diagnostic) {
    diagnostic.textContent = [
      'Canvas projection mode active.',
      `WebGL note: ${err?.message || 'renderer did not start'}`,
      'Collecting graphics details...',
    ].join('\n');
    try {
      const lines = [
        'Canvas projection mode active.',
        `WebGL note: ${err?.message || 'renderer did not start'}`,
        ...webGLDiagnostics(),
        'For the full 3D view, enable hardware acceleration / WebGL and reload.',
      ];
      diagnostic.textContent = lines.join('\n');
    } catch (diagnosticErr) {
      diagnostic.textContent = [
        'Canvas projection mode active.',
        `WebGL note: ${err?.message || 'renderer did not start'}`,
        `Graphics probe note: ${diagnosticErr?.message || 'details unavailable'}`,
        'For the full 3D view, enable hardware acceleration / WebGL and reload.',
      ].join('\n');
    }
  }

  startFallbackPreview();
}

function startFallbackPreview() {
  const preview = document.getElementById('fallback-canvas');
  const ctx = preview && preview.getContext('2d');
  if (!ctx) return;

  const verts = generateVertices(4);
  const edges = generateEdges(4);
  const out = [0, 0, 0];
  let lastFrame = performance.now();

  function draw(now) {
    const rect = preview.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (preview.width !== width * dpr || preview.height !== height * dpr) {
      preview.width = width * dpr;
      preview.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    lastFrame = now;
    const a = prefersReducedMotion ? 0.65 : now * 0.00035;
    const b = prefersReducedMotion ? 0.25 : now * 0.00022;
    const pts = verts.map((v0) => {
      const v = Float64Array.from(v0);
      rotateInPlane(v, 0, 3, Math.cos(a), Math.sin(a));
      rotateInPlane(v, 1, 2, Math.cos(b), Math.sin(b));
      project(v, 4, 'perspective', 3.2, out);
      return [out[0], out[1], out[2], v[3]];
    });

    ctx.clearRect(0, 0, width, height);
    const grd = ctx.createRadialGradient(width * 0.62, height * 0.46, 20, width * 0.62, height * 0.46, Math.max(width, height) * 0.58);
    grd.addColorStop(0, 'rgba(70,224,240,0.16)');
    grd.addColorStop(0.42, 'rgba(91,140,255,0.07)');
    grd.addColorStop(1, 'rgba(5,6,10,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    const compact = width < 760;
    const scale = Math.min(width, height) * (compact ? 0.30 : 0.22);
    const cx = compact ? width / 2 : width * 0.62;
    const cy = compact ? height * 0.42 : height * 0.48;
    const toScreen = (p) => [cx + p[0] * scale, cy - p[1] * scale];

    ctx.lineWidth = 1.1;
    for (const [i, j] of edges) {
      const p = toScreen(pts[i]);
      const q = toScreen(pts[j]);
      const depth = (pts[i][3] + pts[j][3]) / 2;
      ctx.strokeStyle = depth < 0 ? 'rgba(169,139,255,0.9)' : 'rgba(70,224,240,0.9)';
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(234,242,255,0.95)';
    for (const p0 of pts) {
      const p = toScreen(p0);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  draw(performance.now());
}

// ---- Main loop -------------------------------------------------------------
let last = performance.now();
let fpsAccum = 0;
let fpsFrames = 0;
let fpsValue = 60;

function loop(now) {
  const dt = Math.min(Math.max((now - last) / 1000, 0), 0.1);
  last = now;

  const rotating = state.autoRotate && !state.paused && state.dimension >= 2;
  if (rotating) {
    const planes = activePlanes();
    planes.forEach(([i, j], idx) => {
      const key = `${i},${j}`;
      const a = (planeAngles.get(key) || 0) + dt * state.rotationSpeed * planeRate(idx);
      planeAngles.set(key, a);
    });
  }

  computeFrame();
  scene.render(dt);
  diagrams.forEach((d) => d.step(dt));

  // FPS sampling.
  fpsAccum += dt;
  fpsFrames++;
  if (fpsAccum >= 0.5) {
    fpsValue = fpsFrames / fpsAccum;
    fpsAccum = 0;
    fpsFrames = 0;
    controls.setPerf(fpsValue, vertexCount(state.dimension), edgeCount(state.dimension));
  }

  requestAnimationFrame(loop);
}

// ---- Boot ------------------------------------------------------------------
startAmbientField();

if (webglReady) {
  rebuildTopology();
  applyStageComposition();
  inspector.update(state);
  updateMathTable(state.dimension);
  buildGrowthTable();
  setupNav();
  controls.setPerf(60, vertexCount(state.dimension), edgeCount(state.dimension));
  requestAnimationFrame(loop);
} else {
  updateMathTable(state.dimension);
  buildGrowthTable();
  setupNav();

  let fallbackLast = performance.now();
  const fallbackLoop = (now) => {
    const dt = Math.min(Math.max((now - fallbackLast) / 1000, 0), 0.1);
    fallbackLast = now;
    diagrams.forEach((d) => d.step(dt));
    requestAnimationFrame(fallbackLoop);
  };
  requestAnimationFrame(fallbackLoop);
}

// Expose a tiny handle for debugging in the console (no analytics, no network).
window.__atlas = { state, scene };
