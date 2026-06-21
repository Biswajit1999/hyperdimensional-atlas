// constants.js
// Central configuration: palette, ranges, defaults. Kept free of DOM/Three so
// it can be imported anywhere without side effects.

export const DIM_MIN = 0;
export const DIM_MAX = 50;
export const FULL_RENDER_DIM_MAX = 8;
export const HIGH_DIM_PREVIEW_AXES = 8;
export const DEFAULT_DIM = 4;

// "Obsidian Observatory" palette. Hex strings for CSS, numbers for Three.js.
export const PALETTE = {
  background: '#05060a',
  cyan: '#46e0f0',
  blue: '#5b8cff',
  violet: '#a98bff',
  amber: '#ffb454',
  white: '#eaf2ff',
};

export const PALETTE_HEX = {
  cyan: 0x46e0f0,
  blue: 0x5b8cff,
  violet: 0xa98bff,
  amber: 0xffb454,
  white: 0xeaf2ff,
};

// Default interaction / render state.
export const DEFAULTS = {
  dimension: DEFAULT_DIM,
  projection: 'perspective',     // 'orthographic' | 'perspective' | 'sequential'
  focalLength: 3.2,              // user-tunable; internally clamped for safety
  autoRotate: true,
  rotationSpeed: 0.5,            // radians/sec base rate (scaled per plane)
  presetIndex: 0,               // index into rotationPresets(n)
  multiPlane: true,
  wireframe: true,
  vertexMarkers: true,
  colorEncoding: true,
  ghostTrails: false,
  slice: { enabled: false, axis: 3, position: 0 },
  showPanels: true,
  paused: false,
};

// Visual scale applied to projected coordinates before handing them to Three.
export const RENDER_SCALE = 1.55;

// Ghost-trail configuration.
export const TRAIL = {
  segments: 6,        // number of fading echoes
  frameStride: 2,     // capture a snapshot every N frames
};

// Pinned Three.js version (kept in sync with the import map in index.html).
export const THREE_VERSION = '0.160.0';
