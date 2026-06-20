// renderer.js
// Three.js scene setup: renderer, camera, orbit controls, bloom post-processing,
// starfield, and resize handling. Everything that touches the GPU lives here.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { createStarfield } from './effects.js';
import { PALETTE } from '../constants.js';

/** Detect WebGL availability for graceful degradation. */
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

export class SceneManager {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} opts { reducedMotion: boolean }
   */
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.reducedMotion = !!opts.reducedMotion;

    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.background);

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    this.camera.position.set(0, 0.4, 7);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);

    // Orbit controls: drag to rotate, wheel/pinch to zoom.
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 30;
    this.controls.enablePan = false;

    // Subtle fill lighting (mostly for the point sprites / future meshes).
    const ambient = new THREE.AmbientLight(0x404a66, 1.0);
    this.scene.add(ambient);

    // Starfield atmosphere.
    const starCount = this.reducedMotion ? 450 : 900;
    this.starfield = createStarfield(starCount);
    if (this.reducedMotion) this.starfield.points.userData.setDrift(false);
    this.scene.add(this.starfield.points);

    // Post-processing: gentle bloom for a glowing, observatory feel.
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    const strength = this.reducedMotion ? 0.5 : 0.85;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), strength, 0.7, 0.15);
    this.composer.addPass(this.bloom);
    this.composer.setSize(w, h);

    this._onResize = this.resize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  /** Handle viewport resize: renderer, camera, composer all stay in sync. */
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w, h);
  }

  resetCamera() {
    this.camera.position.set(0, 0.4, 7);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  setBloomStrength(s) {
    this.bloom.strength = s;
  }

  /** Advance controls + atmosphere and render one frame. */
  render(dt) {
    this.controls.update();
    this.starfield.update(dt);
    this.composer.render();
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.renderer.dispose();
  }
}
