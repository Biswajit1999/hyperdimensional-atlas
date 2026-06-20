// narrative.js
// Builds the long-form sections below the canvas and their small interactive
// 2D diagrams. The diagrams reuse the same math modules as the main scene, so
// nothing here is faked: they are genuine low-dimensional projections.

import { NARRATIVE_SECTIONS } from '../content.js';
import { generateVertices, generateEdges } from '../math/hypercube.js';
import { rotateInPlane } from '../math/rotation.js';
import { project } from '../math/projection.js';
import { PALETTE } from '../constants.js';

/**
 * Render all narrative sections into the container and wire up mini diagrams.
 * @param {HTMLElement} container
 * @param {boolean} reducedMotion
 * @returns {MiniDiagram[]} the diagram instances (so the loop can drive them)
 */
export function buildNarrative(container, reducedMotion) {
  const diagrams = [];
  for (const sec of NARRATIVE_SECTIONS) {
    const section = document.createElement('section');
    section.className = 'narrative-section';
    section.id = sec.id;
    section.innerHTML = `
      <div class="narrative-inner">
        <span class="kicker mono">${sec.kicker}</span>
        <h2>${sec.title}</h2>
        ${sec.html}
      </div>
    `;
    container.appendChild(section);

    // Attach mini canvases.
    section.querySelectorAll('[data-mini]').forEach((holder) => {
      const kind = holder.getAttribute('data-mini');
      const canvas = document.createElement('canvas');
      canvas.className = 'mini-canvas';
      holder.appendChild(canvas);
      diagrams.push(new MiniDiagram(canvas, kind, reducedMotion));
    });
  }

  // Reveal-on-scroll for a calm entrance.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.15 });
    container.querySelectorAll('.narrative-section').forEach((s) => io.observe(s));
  } else {
    container.querySelectorAll('.narrative-section').forEach((s) => s.classList.add('visible'));
  }

  return diagrams;
}

/** A small self-contained 2D wireframe animation on a canvas. */
class MiniDiagram {
  constructor(canvas, kind, reducedMotion) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.kind = kind;
    this.reducedMotion = reducedMotion;
    this.t = 0;
    this.visible = true;
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);

    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((ents) => {
        this.visible = ents[0].isIntersecting;
      });
      this._io.observe(canvas);
    }
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.w = rect.width;
    this.h = rect.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.reducedMotion) this.draw(); // draw a static frame once
  }

  /** Advance and draw. dt in seconds. */
  step(dt) {
    if (this.reducedMotion || !this.visible) return;
    this.t += dt;
    this.draw();
  }

  draw() {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);

    if (this.kind === 'sweep') this._drawSweep();
    else if (this.kind === 'projection') this._drawCube(4, true);
    else if (this.kind === 'planes') this._drawCube(4, true, true);
  }

  // Cycle through 0D -> 4D, building each cube up.
  _drawSweep() {
    const period = 9; // seconds for the full cycle
    const phase = (this.t % period) / period;
    const n = Math.min(4, Math.floor(phase * 5)); // 0..4
    this._drawCube(n, true);
    this._label(`${n}D — ${['point', 'segment', 'square', 'cube', 'tesseract'][n]}`);
  }

  // Draw an n-cube projected to 2D with a gentle rotation.
  _drawCube(n, perspective, doublePlane = false) {
    const { ctx, w, h } = this;
    const verts = generateVertices(n);
    const edges = generateEdges(n);
    const ang1 = this.t * 0.5;
    const ang2 = this.t * 0.32;

    const pts = verts.map((v0) => {
      const v = Float64Array.from(v0);
      if (n >= 2) rotateInPlane(v, 0, 1, Math.cos(ang2), Math.sin(ang2));
      if (n >= 4) rotateInPlane(v, 0, 3, Math.cos(ang1), Math.sin(ang1));
      if (n >= 4 && doublePlane) rotateInPlane(v, 1, 2, Math.cos(ang1 * 0.8), Math.sin(ang1 * 0.8));
      const out = [0, 0, 0];
      project(v, n, perspective ? 'perspective' : 'orthographic', 3.0, out);
      return out;
    });

    const scale = Math.min(w, h) * 0.30;
    const cx = w / 2;
    const cy = h / 2;
    const toScreen = (p) => [cx + p[0] * scale, cy - p[1] * scale];

    ctx.lineWidth = 1.1;
    for (const [a, b] of edges) {
      const pa = toScreen(pts[a]);
      const pb = toScreen(pts[b]);
      // Depth-tint using the 4th coordinate where present.
      const depth = n >= 4 ? (verts[a][3] + verts[b][3]) / 2 : 0;
      ctx.strokeStyle = depth < 0 ? PALETTE.violet : (depth > 0 ? PALETTE.amber : PALETTE.cyan);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = PALETTE.white;
    for (const p of pts) {
      const s = toScreen(p);
      ctx.beginPath();
      ctx.arc(s[0], s[1], 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _label(text) {
    const { ctx, h } = this;
    ctx.fillStyle = 'rgba(234,242,255,0.6)';
    ctx.font = '11px ui-monospace, monospace';
    ctx.fillText(text, 10, h - 10);
  }
}
