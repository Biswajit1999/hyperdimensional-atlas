// effects.js
// Atmosphere: a restrained procedural starfield. Kept subtle so the hypercube
// remains the visual focus. No external textures or images are used.

import * as THREE from 'three';
import { PALETTE_HEX } from '../constants.js';

/**
 * Create a slowly drifting field of faint star-like points around the scene.
 * @param {number} count number of stars (reduced automatically on low power)
 * @returns {{ points: THREE.Points, update: (dt:number)=>void }}
 */
export function createStarfield(count = 900) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    new THREE.Color(PALETTE_HEX.white),
    new THREE.Color(PALETTE_HEX.cyan),
    new THREE.Color(PALETTE_HEX.blue),
    new THREE.Color(PALETTE_HEX.violet),
  ];

  for (let i = 0; i < count; i++) {
    // Distribute on a thick spherical shell so stars surround the camera.
    const r = 22 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    const b = 0.3 + Math.random() * 0.7; // brightness jitter
    colors[i * 3] = c.r * b;
    colors[i * 3 + 1] = c.g * b;
    colors[i * 3 + 2] = c.b * b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  // Very slow drift to give a sense of depth without distracting motion.
  let driftEnabled = true;
  const update = (dt) => {
    if (!driftEnabled) return;
    points.rotation.y += dt * 0.005;
    points.rotation.x += dt * 0.002;
  };

  points.userData.setDrift = (on) => { driftEnabled = on; };
  return { points, update };
}
