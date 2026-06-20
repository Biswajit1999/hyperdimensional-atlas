// materials.js
// Materials and the hidden-dimension colour encoding.
//
// Colour here is a *visual encoding* of position along the collapsed (4th and
// higher) axes — not a physical property of those dimensions. Vertices farther
// "into" the hidden axes shift toward violet/blue; nearer ones toward amber.

import * as THREE from 'three';
import { PALETTE_HEX } from '../constants.js';

const farColor = new THREE.Color(PALETTE_HEX.violet);
const midColor = new THREE.Color(PALETTE_HEX.cyan);
const nearColor = new THREE.Color(PALETTE_HEX.amber);
const flatColor = new THREE.Color(PALETTE_HEX.cyan);

/**
 * Map a hidden-depth value in roughly [-1, 1] to an RGB colour.
 * @param {number} depth normalised hidden-axis position
 * @param {boolean} encode whether colour encoding is on
 * @param {THREE.Color} target colour to write into
 */
export function depthColor(depth, encode, target) {
  if (!encode) {
    target.copy(flatColor);
    return target;
  }
  // Piecewise lerp: far (violet) -> mid (cyan) -> near (amber).
  const t = Math.max(-1, Math.min(1, depth));
  if (t < 0) {
    target.copy(farColor).lerp(midColor, t + 1);
  } else {
    target.copy(midColor).lerp(nearColor, t);
  }
  return target;
}

/** Generate a soft round sprite texture for vertex markers (procedural). */
function makeDiscTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Build the materials used by the scene. Call once. */
export function createMaterials() {
  const discTexture = makeDiscTexture();

  const edgeMaterial = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const vertexMaterial = new THREE.PointsMaterial({
    size: 0.13,
    map: discTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Trail material is cloned per echo so each can carry its own opacity.
  const trailMaterialBase = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return { edgeMaterial, vertexMaterial, trailMaterialBase, discTexture };
}
