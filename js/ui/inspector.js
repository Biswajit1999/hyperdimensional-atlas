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
    ensureInspectorStyles();
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

      <section class="insp-block atlas-binomial-block" id="insp-profile-block" hidden>
        <div class="atlas-binomial-heading"><h3>Exact Hamming-weight profile</h3><span class="atlas-representation-tag">full Qₙ</span></div>
        <p class="insp-text">Each bar is the exact number of vertices at one Hamming distance from a reference vertex. The bars describe the complete n-cube; they are not a rendered density field.</p>
        <div id="insp-profile" class="atlas-binomial-profile"></div>
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
      profileBlock: this.root.querySelector('#insp-profile-block'),
      profile: this.root.querySelector('#insp-profile'),
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
        `The viewport shows one exact ${HIGH_DIM_PREVIEW_AXES}D coordinate face of the ${n}D cube. ` +
        `${fixedAxes} remaining coordinate${fixedAxes === 1 ? ' is' : 's are'} held at −1. ` +
        `Every visible point is a genuine ${n}D vertex and every visible segment is a genuine edge, ` +
        `but this is not the complete ${n}-cube graph.`;
      this.el.profileBlock.hidden = false;
      this.el.profile.innerHTML = binomialProfileMarkup(n);
    } else {
      this.el.previewBlock.hidden = true;
      this.el.profileBlock.hidden = true;
      this.el.profile.replaceChildren();
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

function binomialProfileMarkup(n) {
  const values = Array.from({ length: n + 1 }, (_, k) => choose(n, k));
  const maximum = values.reduce((best, value) => value > best ? value : best, 0n);
  const maxNumber = Number(maximum);
  const visibleLabels = n <= 16 ? new Set(values.map((_, k) => k)) : new Set([0, Math.floor(n / 4), Math.floor(n / 2), Math.ceil(3 * n / 4), n]);

  const bars = values.map((value, k) => {
    const height = Math.max(1.5, (Number(value) / maxNumber) * 100);
    const label = visibleLabels.has(k) ? String(k) : '';
    const count = value.toLocaleString();
    return `<div class="atlas-binomial-bar" title="Hamming weight ${k}: ${count} vertices"><span class="atlas-binomial-count">${height > 48 ? count : ''}</span><span class="atlas-binomial-stem"><i style="height:${height.toFixed(3)}%"></i></span><span class="atlas-binomial-label">${label}</span></div>`;
  }).join('');

  return `<div role="img" aria-label="Exact binomial profile for Q${n}; vertex counts by Hamming weight from 0 to ${n}">${bars}</div>`;
}

function ensureInspectorStyles() {
  if (document.getElementById('atlas-highdim-style')) return;
  const style = document.createElement('style');
  style.id = 'atlas-highdim-style';
  style.textContent = `
    .atlas-binomial-block { overflow: hidden; }
    .atlas-binomial-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .atlas-representation-tag { border:1px solid rgba(70,224,240,.35); border-radius:999px; padding:3px 6px; color:#82edf6; background:rgba(70,224,240,.08); font:700 8px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; letter-spacing:.08em; }
    .atlas-binomial-profile > div { display:grid; grid-template-columns:repeat(var(--atlas-columns, 1), minmax(2px,1fr)); gap:2px; min-height:112px; align-items:end; margin-top:10px; }
    .atlas-binomial-bar { display:grid; grid-template-rows:12px 78px 13px; min-width:0; align-items:end; }
    .atlas-binomial-count { overflow:hidden; color:rgba(234,242,255,.70); font:600 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; text-align:center; text-overflow:clip; white-space:nowrap; }
    .atlas-binomial-stem { display:flex; height:78px; align-items:end; justify-content:center; border-bottom:1px solid rgba(70,224,240,.2); }
    .atlas-binomial-stem i { display:block; width:min(100%, 12px); min-height:2px; border-radius:2px 2px 0 0; background:linear-gradient(180deg,#ffb454 0%,#a98bff 46%,#46e0f0 100%); box-shadow:0 0 11px rgba(70,224,240,.24); transform-origin:bottom; animation:atlas-binomial-rise .56s cubic-bezier(.2,.8,.2,1) both; }
    .atlas-binomial-label { color:rgba(234,242,255,.60); font:600 7px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; text-align:center; }
    @keyframes atlas-binomial-rise { from { transform:scaleY(.02); opacity:.22; } to { transform:scaleY(1); opacity:1; } }
    @media (prefers-reduced-motion: reduce) { .atlas-binomial-stem i { animation:none; } }
  `;
  document.head.append(style);
}
