// data.js
// Per-dimension descriptive data: object names, Schläfli symbols, and short
// dimensional-ladder captions. Numeric facts come from math/statistics.js so
// there is a single source of truth for counts.

import { getStats } from './math/statistics.js';

// Names of the measure-polytope (n-cube) in each low dimension.
export const DIMENSION_NAMES = [
  'Point',        // 0
  'Line segment', // 1
  'Square',       // 2
  'Cube',         // 3
  'Tesseract',    // 4
  'Penteract',    // 5
  'Hexeract',     // 6
  'Hepteract',    // 7
  'Octeract',     // 8
];

// Short alternate label (n-cube convention).
export const DIMENSION_NCUBE = [
  '0-cube', '1-cube', '2-cube', '3-cube',
  '4-cube', '5-cube', '6-cube', '7-cube', '8-cube',
];

// Schläfli symbols for the regular measure polytopes. The n-cube is {4, 3^(n-2)}.
// Lower dimensions have degenerate/short symbols, given explicitly below.
export const SCHLAFLI = [
  '—',            // 0  point (no symbol)
  '{ }',          // 1  segment
  '{4}',          // 2  square
  '{4, 3}',       // 3  cube
  '{4, 3, 3}',    // 4  tesseract
  '{4, 3, 3, 3}', // 5  penteract
  '{4, 3, 3, 3, 3}',       // 6  hexeract
  '{4, 3, 3, 3, 3, 3}',    // 7  hepteract
  '{4, 3, 3, 3, 3, 3, 3}', // 8  octeract
];

export const LADDER_DIMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20, 30, 40, 50];

export function dimensionName(n) {
  return DIMENSION_NAMES[n] || `${n}D hypercube`;
}

export function nCubeName(n) {
  return DIMENSION_NCUBE[n] || `${n}-cube`;
}

export function schlafliSymbol(n) {
  if (SCHLAFLI[n]) return SCHLAFLI[n];
  return `{4, 3^${n - 2}}`;
}

/**
 * Assemble the complete data record for one dimension.
 */
export function dimensionData(n) {
  return {
    n,
    name: dimensionName(n),
    ncube: nCubeName(n),
    schlafli: schlafliSymbol(n),
    stats: getStats(n),
  };
}

// Pre-built arrays for the full control range and the compact milestone ladder.
export const ALL_DIMENSIONS = Array.from({ length: 51 }, (_, n) => dimensionData(n));
export const LADDER_DIMENSIONS = LADDER_DIMS.map((n) => dimensionData(n));
