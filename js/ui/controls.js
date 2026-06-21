// controls.js
// Left control panel, dimensional ladder, performance readout, and keyboard
// shortcuts. The panel mutates a shared `state` object and notifies the app via
// callbacks; the app owns the consequences (rebuild geometry, update inspector).

import { DIM_MIN, DIM_MAX, FULL_RENDER_DIM_MAX } from '../constants.js';
import { rotationPresets } from '../math/rotation.js';
import { LADDER_DIMENSIONS } from '../data.js';
import { ladderCaption } from '../content.js';

export class Controls {
  /**
   * @param {object} refs { panel, ladder, perf, captionEl }
   * @param {object} state shared app state (mutated in place)
   * @param {object} cb callbacks { onChange(reason), onResetView(), onTogglePanels() }
   */
  constructor(refs, state, cb) {
    this.state = state;
    this.cb = cb;
    this.refs = refs;
    this._buildPanel();
    this._buildLadder();
    this._bindKeys();
    this.refreshPresets();
    this.syncFromState();
  }

  _buildPanel() {
    this.refs.panel.innerHTML = `
      <header class="panel-head">
        <span class="panel-eyebrow">Instrument</span>
        <h2>Controls</h2>
      </header>

      <div class="control-group">
        <label class="control-label" for="c-dim">Dimension <output id="c-dim-out" class="mono">4D</output></label>
        <input type="range" id="c-dim" min="${DIM_MIN}" max="${DIM_MAX}" step="1" value="4" title="0D-8D renders the full cube graph. 9D-50D uses a sampled preview with exact formulas.">
        <p id="c-dim-note" class="control-note">Full geometry renderer through 8D.</p>
      </div>

      <div class="control-group">
        <span class="control-label">Projection</span>
        <div class="seg" role="radiogroup" aria-label="Projection mode">
          <button class="seg-btn" data-proj="orthographic" role="radio" title="Parallel projection: hidden axes are dropped without perspective scaling.">Ortho</button>
          <button class="seg-btn" data-proj="perspective" role="radio" title="Perspective projection: hidden-axis distance changes apparent size.">Perspective</button>
          <button class="seg-btn" data-proj="sequential" role="radio" title="Sequential projection collapses hidden axes one at a time for high-D legibility.">Sequential</button>
        </div>
        <label class="control-label sub" for="c-focal">Focal length <output id="c-focal-out" class="mono">3.2</output></label>
        <input type="range" id="c-focal" min="1.8" max="8" step="0.1" value="3.2" title="Higher focal length reduces perspective exaggeration.">
      </div>

      <div class="control-group">
        <span class="control-label">Rotation</span>
        <label class="check"><input type="checkbox" id="c-auto" checked><span>Auto-rotate</span></label>
        <label class="control-label sub" for="c-speed">Speed <output id="c-speed-out" class="mono">0.50</output></label>
        <input type="range" id="c-speed" min="0" max="2" step="0.05" value="0.5">
        <label class="control-label sub" for="c-plane">Rotation plane</label>
        <select id="c-plane" class="select" title="A rotation happens in the selected coordinate plane or planes."></select>
        <label class="check" title="Rotate through every plane in the selected preset."><input type="checkbox" id="c-multi" checked><span>Multi-plane rotation</span></label>
      </div>

      <div class="control-group">
        <span class="control-label">View</span>
        <label class="check" title="Draw the projected cube edges."><input type="checkbox" id="c-wire" checked><span>Wireframe edges</span></label>
        <label class="check" title="Show each projected vertex as a marker."><input type="checkbox" id="c-verts" checked><span>Vertex markers</span></label>
        <label class="check" title="Colour encodes position along collapsed hidden coordinates."><input type="checkbox" id="c-color" checked><span>Hidden-dimension colour</span></label>
        <label class="check" title="Leave fading echoes of previous edge positions."><input type="checkbox" id="c-trail"><span>Ghost trails</span></label>
        <button class="btn" id="c-reset">Reset view</button>
      </div>

      <div class="control-group">
        <span class="control-label">Cross-section</span>
        <label class="check" title="Fix one coordinate to intersect the cube with a flat hyperplane."><input type="checkbox" id="c-slice"><span>Slice mode</span></label>
        <label class="control-label sub" for="c-axis">Slice coordinate</label>
        <select id="c-axis" class="select" title="Choose which coordinate is fixed by the slicing plane."></select>
        <label class="control-label sub" for="c-pos">Slice position <output id="c-pos-out" class="mono">0.00</output></label>
        <input type="range" id="c-pos" min="-1" max="1" step="0.01" value="0" title="Move the axis-aligned slice through parallel layers of the solid cube.">
      </div>
    `;

    const $ = (id) => this.refs.panel.querySelector(id);
    this.el = {
      dim: $('#c-dim'), dimOut: $('#c-dim-out'),
      dimNote: $('#c-dim-note'),
      projBtns: [...this.refs.panel.querySelectorAll('[data-proj]')],
      focal: $('#c-focal'), focalOut: $('#c-focal-out'),
      auto: $('#c-auto'),
      speed: $('#c-speed'), speedOut: $('#c-speed-out'),
      plane: $('#c-plane'), multi: $('#c-multi'),
      wire: $('#c-wire'), verts: $('#c-verts'), color: $('#c-color'), trail: $('#c-trail'),
      reset: $('#c-reset'),
      slice: $('#c-slice'), axis: $('#c-axis'), pos: $('#c-pos'), posOut: $('#c-pos-out'),
    };

    // Wiring.
    this.el.dim.addEventListener('input', () => this.setDimension(+this.el.dim.value));

    this.el.projBtns.forEach((b) => b.addEventListener('click', () => {
      this.state.projection = b.dataset.proj;
      this._syncProjButtons();
      this.cb.onChange('projection');
    }));

    this.el.focal.addEventListener('input', () => {
      this.state.focalLength = +this.el.focal.value;
      this.el.focalOut.textContent = this.state.focalLength.toFixed(1);
      this.cb.onChange('render');
    });

    this.el.auto.addEventListener('change', () => {
      this.state.autoRotate = this.el.auto.checked;
      this.cb.onChange('render');
    });
    this.el.speed.addEventListener('input', () => {
      this.state.rotationSpeed = +this.el.speed.value;
      this.el.speedOut.textContent = this.state.rotationSpeed.toFixed(2);
    });
    this.el.plane.addEventListener('change', () => {
      this.state.presetIndex = +this.el.plane.value;
      this.cb.onChange('rotation');
    });
    this.el.multi.addEventListener('change', () => {
      this.state.multiPlane = this.el.multi.checked;
      this.cb.onChange('rotation');
    });

    this.el.wire.addEventListener('change', () => { this.state.wireframe = this.el.wire.checked; this.cb.onChange('render'); });
    this.el.verts.addEventListener('change', () => { this.state.vertexMarkers = this.el.verts.checked; this.cb.onChange('render'); });
    this.el.color.addEventListener('change', () => { this.state.colorEncoding = this.el.color.checked; this.cb.onChange('render'); });
    this.el.trail.addEventListener('change', () => { this.state.ghostTrails = this.el.trail.checked; this.cb.onChange('render'); });
    this.el.reset.addEventListener('click', () => this.cb.onResetView());

    this.el.slice.addEventListener('change', () => {
      this.state.slice.enabled = this.el.slice.checked;
      this.cb.onChange('slice');
    });
    this.el.axis.addEventListener('change', () => {
      this.state.slice.axis = +this.el.axis.value;
      this.cb.onChange('slice');
    });
    this.el.pos.addEventListener('input', () => {
      this.state.slice.position = +this.el.pos.value;
      this.el.posOut.textContent = this.state.slice.position.toFixed(2);
      this.cb.onChange('slice');
    });
  }

  _buildLadder() {
    const html = LADDER_DIMENSIONS.map((d) => `
      <button class="ladder-step" data-dim="${d.n}" aria-label="${d.n}D ${d.name}">
        <span class="ladder-icon">${ladderIcon(d.n)}</span>
        <span class="ladder-num mono">${d.n}D</span>
        <span class="ladder-name">${d.name}</span>
      </button>
    `).join('');
    this.refs.ladder.innerHTML = html;
    this.refs.ladder.querySelectorAll('.ladder-step').forEach((b) => {
      b.addEventListener('click', () => this.setDimension(+b.dataset.dim));
    });
  }

  /** Rebuild the rotation-plane dropdown and slice-axis dropdown for current n. */
  refreshPresets() {
    const n = this.state.dimension;
    const highPreview = n > FULL_RENDER_DIM_MAX;
    const presets = rotationPresets(n);
    if (this.state.presetIndex >= presets.length) this.state.presetIndex = 0;
    this.el.plane.innerHTML = presets
      .map((p, i) => `<option value="${i}">${p.name}</option>`)
      .join('');
    this.el.plane.value = String(this.state.presetIndex);
    this.el.plane.disabled = n < 2;

    // Slice axis options (0..n-1). Default to the highest (hidden) axis.
    const axisCount = Math.max(n, 1);
    if (this.state.slice.axis >= axisCount) this.state.slice.axis = axisCount - 1;
    this.el.axis.innerHTML = Array.from({ length: axisCount }, (_, i) =>
      `<option value="${i}">${coordName(i)}</option>`).join('');
    this.el.axis.value = String(this.state.slice.axis);
    this.el.axis.disabled = n < 1 || highPreview;
    this.el.slice.disabled = highPreview;
    this.el.pos.disabled = highPreview;
    if (highPreview) {
      this.state.slice.enabled = false;
      this.el.slice.checked = false;
    }
  }

  setDimension(n) {
    n = Math.max(DIM_MIN, Math.min(DIM_MAX, n));
    if (n === this.state.dimension) return;
    this.state.dimension = n;
    this.el.dim.value = String(n);
    this.el.dimOut.textContent = `${n}D`;
    this.el.dimNote.textContent = n > FULL_RENDER_DIM_MAX
      ? 'Analytical sampled preview; exact counts remain live.'
      : 'Full geometry renderer through 8D.';
    this.refreshPresets();
    this._syncLadder();
    this._syncCaption();
    this.cb.onChange('dimension');
  }

  /** Push current state values onto every control (initial sync). */
  syncFromState() {
    const s = this.state;
    this.el.dim.value = String(s.dimension);
    this.el.dimOut.textContent = `${s.dimension}D`;
    this.el.dimNote.textContent = s.dimension > FULL_RENDER_DIM_MAX
      ? 'Analytical sampled preview; exact counts remain live.'
      : 'Full geometry renderer through 8D.';
    this.el.focal.value = String(s.focalLength);
    this.el.focalOut.textContent = s.focalLength.toFixed(1);
    this.el.auto.checked = s.autoRotate;
    this.el.speed.value = String(s.rotationSpeed);
    this.el.speedOut.textContent = s.rotationSpeed.toFixed(2);
    this.el.multi.checked = s.multiPlane;
    this.el.wire.checked = s.wireframe;
    this.el.verts.checked = s.vertexMarkers;
    this.el.color.checked = s.colorEncoding;
    this.el.trail.checked = s.ghostTrails;
    this.el.slice.checked = s.slice.enabled;
    this.el.pos.value = String(s.slice.position);
    this.el.posOut.textContent = s.slice.position.toFixed(2);
    this._syncProjButtons();
    this._syncLadder();
    this._syncCaption();
  }

  _syncProjButtons() {
    this.el.projBtns.forEach((b) => {
      const on = b.dataset.proj === this.state.projection;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  _syncLadder() {
    this.refs.ladder.querySelectorAll('.ladder-step').forEach((b) => {
      b.classList.toggle('active', +b.dataset.dim === this.state.dimension);
    });
  }

  _syncCaption() {
    if (this.refs.captionEl) this.refs.captionEl.textContent = ladderCaption(this.state.dimension);
  }

  /** Update the performance readout. */
  setPerf(fps, vertices, edges) {
    if (!this.refs.perf) return;
    this.refs.perf.fps.textContent = fps.toFixed(0);
    this.refs.perf.verts.textContent = compactCount(vertices);
    this.refs.perf.edges.textContent = compactCount(edges);
    this.refs.perf.dim.textContent = `${this.state.dimension}D`;
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      // Ignore typing in form fields (none editable here, but be safe).
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) && e.key !== 'Escape') {
        if (e.key === ' ' || e.key.startsWith('Arrow')) { /* allow shortcuts */ } else return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.state.paused = !this.state.paused;
          this.cb.onChange('render');
          break;
        case 'r': case 'R':
          this.cb.onResetView();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.setDimension(this.state.dimension - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.setDimension(this.state.dimension + 1);
          break;
        case 'h': case 'H':
          this.cb.onTogglePanels();
          break;
        default: break;
      }
    });
  }
}

function compactCount(value) {
  if (value < 1_000_000) return value.toLocaleString();
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value < 1_000_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value < 1_000_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(1)}T`;
  return value.toExponential(2).replace('e+', 'e');
}

function coordName(i) {
  return i < 3 ? `${['x', 'y', 'z'][i]} axis` : `axis ${i + 1}`;
}

// Minimal inline SVG glyph per dimension for the ladder.
function ladderIcon(n) {
  const s = 'stroke="currentColor" fill="none" stroke-width="1.4"';
  switch (n) {
    case 0: return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>`;
    case 1: return `<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" ${s}/></svg>`;
    case 2: return `<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" ${s}/></svg>`;
    case 3: return `<svg viewBox="0 0 24 24"><rect x="6" y="8" width="9" height="9" ${s}/><rect x="9" y="5" width="9" height="9" ${s}/><line x1="6" y1="8" x2="9" y2="5" ${s}/><line x1="15" y1="8" x2="18" y2="5" ${s}/><line x1="6" y1="17" x2="9" y2="14" ${s}/><line x1="15" y1="17" x2="18" y2="14" ${s}/></svg>`;
    default:
      // 4D+ : nested squares as a generic "hypercube shadow".
      return `<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" ${s}/><rect x="9" y="9" width="6" height="6" ${s}/><line x1="4" y1="4" x2="9" y2="9" ${s}/><line x1="20" y1="4" x2="15" y2="9" ${s}/><line x1="4" y1="20" x2="9" y2="15" ${s}/><line x1="20" y1="20" x2="15" y2="15" ${s}/></svg>`;
  }
}
