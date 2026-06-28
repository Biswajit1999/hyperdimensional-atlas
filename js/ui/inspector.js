// inspector.js
// The right-hand scientific inspector. Reflects the current dimension's exact
// combinatorics, measures, and a plain-language description. Pure DOM updates.

import { dimensionData } from '../data.js';
import { dimensionBlurb, PROJECTION_EXPLAIN } from '../content.js';
import { perspectiveWarning } from '../math/projection.js';
import { FULL_RENDER_DIM_MAX, HIGH_DIM_PREVIEW_AXES } from '../constants.js';

export class Inspector {
  constructor(root) {
    this.root = root;
    ensureHighDimensionStyles();
    this.root.innerHTML = `
      <header class="panel-head">
        <span class="panel-eyebrow">Scientific inspector</span>
        <h2 id="insp-name" class="insp-name">Tesseract</h2>
        <div class="insp-sub">
          <span id="insp-ncube" class="mono">4-cube</span>
          <span class="dot">·</span>
          <span class="mono">Schläfli <span id="insp-schlafli">{4, 3, 3}</span></span>
        </div>
      </header>

      <dl class="insp-grid" id="insp-grid">
        <div><dt>Vertices</dt><dd id="insp-v" class="mono">16</dd></div>
        <div><dt>Edges</dt><dd id="insp-e" class="mono">32</dd></div>
        <div><dt>Square faces</dt><dd id="insp-sq" class="mono">24</dd></div>
        <div><dt>Cubic cells</dt><dd id="insp-cu" class="mono">8</dd></div>
        <div><dt>Hypervolume</dt><dd id="insp-hv" class="mono">s⁴</dd></div>
        <div><dt>Boundary</dt><dd id="insp-bd" class="mono">8·s³</dd></div>
      </dl>

      <section class="insp-block">
        <h3>Projection</h3>
        <p id="insp-proj" class="insp-text"></p>
        <p id="insp-warn" class="insp-warn" hidden>⚠ High perspective exaggeration — near cells are strongly magnified.</p>
      </section>

      <section class="insp-block">
        <h3>What you are seeing</h3>
        <p id="insp-blurb" class="insp-text"></p>
      </section>

      <section class="insp-block" id="insp-preview-block" hidden>
        <h3>High-dimensional representation</h3>
        <p id="insp-preview" class="insp-text"></p>
      </section>

      <section class="insp-block" id="insp-shell-block" hidden>
        <div class="insp-shell-head">
          <h3>Exact Hamming shells</h3>
          <span class="insp-shell-badge">full Qₙ</span>
        </div>
        <p class="insp-text">For one reference vertex, shell <span class="mono">k</span> contains exactly <span class="mono">C(n,k)</span> vertices. This profile describes the complete n-cube, not only the coordinate face in the viewport.</p>
        <div id="insp-shell-profile" class="insp-shell-profile"></div>
      </section>

      <section class="insp-block" id="insp-slice-block" hidden>
        <h3>Cross-section</h3>
        <p id="insp-slice" class="insp-text"></p>
      </section>
    `;

    this.el = {
      name: this.root.querySelector('#insp-name'),
      ncube: this.root.querySelector('#insp-ncube'),
      schlafli: this.root.querySelector('#insp-schlafli'),
      v: this.root.querySelector('#insp-v'),
      e: this.root.querySelector('#insp-e'),
      sq: this.root.querySelector('#insp-sq'),
      cu: this.root.querySelector('#insp-cu'),
      hv: this.root.querySelector('#insp-hv'),
      bd: this.root.querySelector('#insp-bd'),
      proj: this.root.querySelector('#insp-proj'),
      warn: this.root.querySelector('#insp-warn'),
      blurb: this.root.querySelector('#insp-blurb'),
      previewBlock: this.root.querySelector('#insp-preview-block'),
      preview: this.root.querySelector('#insp-preview'),
      shellBlock: this.root.querySelector('#insp-shell-block'),
      shellProfile: this.root.querySelector('#insp-shell-profile'),
      sliceBlock: this.root.querySelector('#insp-slice-block'),
      slice: this.root.querySelector('#insp-slice'),
    };
  }

  /**
   * @param {object} state full app state
   */
  update(state) {
    const n = state.dimension;
    const d = dimensionData(n);
    const s = d.stats;

    this.el.name.textContent = d.name;
    this.el.ncube.textContent = d.ncube;
    this.el.schlafli.textContent = d.schlafli;
    setCount(this.el.v, s.vertices);
    setCount(this.el.e, s.edges);
    setCount(this.el.sq, s.squares);
    setCount(this.el.cu, s.cubes);
    this.el.hv.textContent = s.hypervolume;
    this.el.bd.textContent = s.boundary;

    this.el.proj.textContent = PROJECTION_EXPLAIN[state.projection];
    this.el.blurb.textContent = dimensionBlurb(n);

    if (n > FULL_RENDER_DIM_MAX) {
      const fixedAxes = n - HIGH_DIM_PREVIEW_AXES;
      this.el.previewBlock.hidden = false;
      this.el.preview.textContent =
        `The viewport shows one exact ${HIGH_DIM_PREVIEW_AXES}D coordinate face embedded in ${n}D. ` +
        `${fixedAxes} remaining coordinate${fixedAxes === 1 ? ' is' : 's are'} fixed at −1. ` +
        `Every displayed point is a genuine ${n}D vertex and every displayed segment is a genuine edge; ` +
        `the counts above still describe the complete ${n}-cube.`;
      this.el.shellBlock.hidden = false;
      this.el.shellProfile.innerHTML = hammingProfileMarkup(n);
    } else {
      this.el.previewBlock.hidden = true;
      this.el.shellBlock.hidden = true;
      this.el.shellProfile.replaceChildren();
    }

    const warn = perspectiveWarning(n, state.focalLength) && state.projection !== 'orthographic';
    this.el.warn.hidden = !warn;

    // Cross-section readout.
    if (state.slice.enabled && n >= 1) {
      const axisName = n > state.slice.axis ? coordName(state.slice.axis) : coordName(0);
      const sub = Math.max(n - 1, 0);
      const subName = dimensionData(sub).name.toLowerCase();
      this.el.sliceBlock.hidden = false;
      this.el.slice.textContent =
        `Fixing ${axisName} = ${state.slice.position.toFixed(2)} intersects the ` +
        `${d.name.toLowerCase()} in a ${sub}-cube — a ${subName}. ` +
        `This axis-aligned plane slides through parallel layers of the solid cube; ` +
        `the remaining coordinates keep the same range.`;
    } else {
      this.el.sliceBlock.hidden = true;
    }
  }
}

function coordName(i) {
  return i < 3 ? `${['x', 'y', 'z'][i]} axis` : `axis ${i + 1}`;
}

function setCount(el, value) {
  el.textContent = compactCount(value);
  el.title = value.toLocaleString();
}

function compactCount(value) {
  if (value < 1_000_000_000) return value.toLocaleString();
  return value.toExponential(2).replace('e+', 'e');
}

function choose(n, k) {
  const r = Math.min(k, n - k);
  let value = 1n;
  for (let i = 1; i <= r; i++) value = (value * BigInt(n - r + i)) / BigInt(i);
  return value;
}

function hammingProfileMarkup(n) {
  const counts = Array.from({ length: n + 1 }, (_, k) => choose(n, k));
  const maximum = counts.reduce((best, count) => count > best ? count : best, 0n);
  const maximumNumber = Number(maximum);
  const labels = new Set([0, Math.floor(n / 2), n]);

  const bars = counts.map((count, k) => {
    const height = Math.max(2, (100 * Number(count)) / maximumNumber);
    const label = labels.has(k) ? k : '';
    return `<div class="insp-shell-bar" title="Hamming distance ${k}: ${count.toLocaleString()} vertices"><i style="height:${height.toFixed(3)}%"></i><span>${label}</span></div>`;
  }).join('');

  return `<div class="insp-shell-bars" style="--shell-columns:${counts.length}" role="img" aria-label="Exact binomial Hamming-shell profile for Q${n}; shell k contains C(${n}, k) vertices">${bars}</div><p class="insp-shell-axis"><span>k = 0</span><span>k = ${Math.floor(n / 2)}</span><span>k = ${n}</span></p>`;
}

function ensureHighDimensionStyles() {
  if (document.getElementById('atlas-high-dimension-styles')) return;
  const style = document.createElement('style');
  style.id = 'atlas-high-dimension-styles';
  style.textContent = `
    .insp-shell-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .insp-shell-badge { color:#86f0b8; background:rgba(134,240,184,.08); border:1px solid rgba(134,240,184,.26); border-radius:999px; padding:3px 6px; font:700 8px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; letter-spacing:.08em; white-space:nowrap; }
    .insp-shell-profile { margin-top:10px; }
    .insp-shell-bars { display:grid; grid-template-columns:repeat(var(--shell-columns), minmax(2px,1fr)); gap:2px; height:92px; align-items:end; padding:0 2px; border-bottom:1px solid rgba(81,240,229,.20); }
    .insp-shell-bar { display:grid; grid-template-rows:1fr 12px; align-items:end; min-width:0; height:100%; }
    .insp-shell-bar i { display:block; width:100%; min-height:2px; border-radius:2px 2px 0 0; background:linear-gradient(180deg,#f5bd63 0%,#b88cff 46%,#51f0e5 100%); box-shadow:0 0 9px rgba(81,240,229,.22); transform-origin:bottom; animation:atlas-shell-rise .45s cubic-bezier(.2,.8,.2,1) both; }
    .insp-shell-bar span { color:rgba(234,242,255,.62); font:600 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; text-align:center; }
    .insp-shell-axis { display:flex; justify-content:space-between; gap:8px; margin:5px 0 0; color:#738398; font:600 8px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
    @keyframes atlas-shell-rise { from { opacity:.16; transform:scaleY(.04); } to { opacity:1; transform:scaleY(1); } }
    @media (prefers-reduced-motion: reduce) { .insp-shell-bar i { animation:none; } }
  `;
  document.head.append(style);
}
