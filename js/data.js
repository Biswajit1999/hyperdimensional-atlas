// data.js
// Per-dimension descriptive data: object names, Schläfli symbols, and short
// dimensional-ladder captions. Numeric facts come from math/statistics.js so
// there is a single source of truth for counts.

import { getStats } from './math/statistics.js';

// Names of the measure-polytope (n-cube) in each dimension.
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

/**
 * Assemble the complete data record for one dimension.
 */
export function dimensionData(n) {
  return {
    n,
    name: DIMENSION_NAMES[n],
    ncube: DIMENSION_NCUBE[n],
    schlafli: SCHLAFLI[n],
    stats: getStats(n),
  };
}

// Pre-built array for ladder construction (0..8).
export const ALL_DIMENSIONS = Array.from({ length: 9 }, (_, n) => dimensionData(n));
