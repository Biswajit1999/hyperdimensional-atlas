import { getStats, faceCountExact, binomial, binomialBigInt } from './js/math/statistics.js';
import { generateVertices, generateEdges, generatePreviewSkeleton, sliceCube } from './js/math/hypercube.js';
import { rotationPresets, planeRate } from './js/math/rotation.js';
import { project, hiddenDepth, perspectiveWarning } from './js/math/projection.js';
import { rotateInPlane } from './js/math/rotation.js';
import { readFileSync } from 'node:fs';
import { ALL_DIMENSIONS, LADDER_DIMENSIONS } from './js/data.js';
import { DIMENSION_BLURB, LADDER_CAPTION, PROJECTION_EXPLAIN, NARRATIVE_SECTIONS, dimensionBlurb, ladderCaption } from './js/content.js';
import { DEFAULTS, DIM_MAX, FULL_RENDER_DIM_MAX, HIGH_DIM_PREVIEW_AXES } from './js/constants.js';

let pass = true;
const exp = {4:[16,32,24,8],5:[32,80,80,40],6:[64,192,240,160],7:[128,448,672,560],8:[256,1024,1792,1792]};
console.log('== combinatorics ==');
for (const n of [0,1,2,3,4,5,6,7,8]) {
  const s = getStats(n);
  const gv=generateVertices(n).length, ge=generateEdges(n).length;
  const okGen = gv===s.vertices && ge===s.edges;
  let ok = true;
  if (exp[n]) { const [v,e,sq,cu]=exp[n]; ok = s.vertices===v&&s.edges===e&&s.squares===sq&&s.cubes===cu; }
  if(!ok||!okGen) pass=false;
  console.log(`n=${n}: V=${s.vertices} E=${s.edges} sq=${s.squares} cu=${s.cubes} ${ok&&okGen?'ok':'FAIL'}`);
}

console.log('\n== projection bounds (300 frames each) ==');
for (const [n,mode] of [[4,'perspective'],[5,'sequential'],[8,'perspective'],[8,'sequential'],[8,'orthographic']]) {
  const V=generateVertices(n); const out=[0,0,0]; let mx=0,bad=0;
  for(let fr=0;fr<300;fr++){const a=fr*0.137;
    for(const v0 of V){const v=Float64Array.from(v0);
      rotateInPlane(v,0,n-1,Math.cos(a),Math.sin(a));
      if(n>4) rotateInPlane(v,1,n-2,Math.cos(a*0.83),Math.sin(a*0.83));
      project(v,n,mode,3.2,out);
      for(const x of out){if(!isFinite(x))bad++; mx=Math.max(mx,Math.abs(x));}}}
  const okp = bad===0 && mx<=3.31;
  if(!okp) pass=false;
  console.log(`n=${n} ${mode.padEnd(12)} max=${mx.toFixed(3)} nonfinite=${bad} ${okp?'ok':'FAIL'}`);
}

console.log('\n== slice / data / content sanity ==');
const sl = sliceCube(4,3,0.5);
console.log(`slice4D@x4: subDim=${sl.subDim} V=${sl.vertices.length} E=${sl.edges.length} ${sl.subDim===3&&sl.vertices.length===8&&sl.edges.length===12?'ok':'FAIL'}`);
console.log(`data dims=${ALL_DIMENSIONS.length} (expect 51) ${ALL_DIMENSIONS.length===51?'ok':'FAIL'}`);
console.log(`ladder milestones=${LADDER_DIMENSIONS.map(d=>d.n).join(',')}`);
console.log(`blurbs=${DIMENSION_BLURB.length} captions=${LADDER_CAPTION.length} narrative=${NARRATIVE_SECTIONS.length}`);
console.log(`projExplain keys=${Object.keys(PROJECTION_EXPLAIN).join(',')}`);
console.log(`schlafli 4D=${ALL_DIMENSIONS[4].schlafli}`);
console.log(`schlafli 50D=${ALL_DIMENSIONS[50].schlafli}`);
console.log(`presets defined for 0..50: ${[0,1,2,3,4,5,6,7,8,20,50].every(n=>rotationPresets(n).length>=1)?'ok':'FAIL'}`);
console.log(`DEFAULTS dim=${DEFAULTS.dimension} proj=${DEFAULTS.projection}`);
if(ALL_DIMENSIONS.length!==51||DIMENSION_BLURB.length!==9||LADDER_CAPTION.length!==9||NARRATIVE_SECTIONS.length!==5||DIM_MAX!==50||FULL_RENDER_DIM_MAX!==8) pass=false;

console.log('\n== high-dimension representation guard ==');
for (const n of [20,50]) {
  const preview = generatePreviewSkeleton(n, HIGH_DIM_PREVIEW_AXES);
  const expectedV = 2 ** HIGH_DIM_PREVIEW_AXES;
  const expectedE = HIGH_DIM_PREVIEW_AXES * 2 ** (HIGH_DIM_PREVIEW_AXES - 1);
  const validVertices = preview.vertices.every((vertex) =>
    vertex.slice(0, HIGH_DIM_PREVIEW_AXES).every((coordinate) => Math.abs(coordinate) === 1) &&
    vertex.slice(HIGH_DIM_PREVIEW_AXES).every((coordinate) => coordinate === -1)
  );
  const validEdges = preview.edges.every(([a, b]) => {
    let differences = 0;
    for (let axis = 0; axis < n; axis++) if (preview.vertices[a][axis] !== preview.vertices[b][axis]) differences++;
    return differences === 1;
  });
  const okPreview = preview.vertices.length === expectedV && preview.edges.length === expectedE && preview.vertices[0].length === n && validVertices && validEdges;
  if (!okPreview) pass = false;
  console.log(`preview ${n}D: exact coordinate face=${okPreview?'ok':'FAIL'} drawnV=${preview.vertices.length} drawnE=${preview.edges.length} fullV=${getStats(n).vertices.toLocaleString()}`);
}
const exact50Edges = faceCountExact(50, 1) === 28147497671065600n;
const exactCentralShell = binomialBigInt(50, 25) === 126410606437752n;
if (!exact50Edges || !exactCentralShell) pass = false;
console.log(`exact 50D edge count: ${exact50Edges ? 'ok' : 'FAIL'}`);
console.log(`exact Q50 central Hamming shell: ${exactCentralShell ? 'ok' : 'FAIL'}`);
const highCopyOk = dimensionBlurb(20).includes('sample') && ladderCaption(20).includes('preview');
if (!highCopyOk) pass = false;
console.log(`high blurb: ${highCopyOk ? 'ok' : 'FAIL'}`);

console.log('\n== frontend guards ==');
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('styles.css', 'utf8');
const app = readFileSync('js/app.js', 'utf8');
const inspector = readFileSync('js/ui/inspector.js', 'utf8');
const styleVersion = html.match(/styles\.css\?v=([^"]+)/)?.[1] || '';
const appVersion = html.match(/js\/app\.js\?v=([^']+)/)?.[1] || '';
const rendererVersion = app.match(/renderer\.js\?v=([^']+)/)?.[1] || '';
const hidesFallback = css.includes('.fallback[hidden]') && css.includes('display: none !important');
const exactShellUi = inspector.includes('Exact Hamming shells') && inspector.includes('binomial Hamming-shell profile');
const versionsAligned = !!styleVersion && styleVersion === appVersion && appVersion === rendererVersion;
if (!hidesFallback || !versionsAligned || !exactShellUi) pass = false;
console.log(`fallback hidden guard: ${hidesFallback ? 'ok' : 'FAIL'}`);
console.log(`high-dimensional shell UI: ${exactShellUi ? 'ok' : 'FAIL'}`);
console.log(`cache versions aligned: ${versionsAligned ? styleVersion : 'FAIL'}`);

console.log(pass?'\n==== ALL CHECKS PASS ====':'\n==== CHECKS FAILED ====');
