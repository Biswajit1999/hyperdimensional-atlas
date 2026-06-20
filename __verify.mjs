import { getStats, faceCount, binomial } from './js/math/statistics.js';
import { generateVertices, generateEdges, edgeCount, vertexCount, sliceCube } from './js/math/hypercube.js';
import { rotationPresets } from './js/math/rotation.js';
import { project, hiddenDepth } from './js/math/projection.js';

const expected = {
  4: {v:16,e:32,sq:24,cu:8},
  5: {v:32,e:80,sq:80,cu:40},
  6: {v:64,e:192,sq:240,cu:160},
  7: {v:128,e:448,sq:672,cu:560},
  8: {v:256,e:1024,sq:1792,cu:1792},
};
let pass = true;
for (const n of [0,1,2,3,4,5,6,7,8]) {
  const s = getStats(n);
  // cross-check generated topology matches formulas
  const gv = generateVertices(n).length;
  const ge = generateEdges(n).length;
  const okGen = gv === s.vertices && ge === s.edges;
  let line = `n=${n} ${String(s.vertices).padStart(3)}v ${String(s.edges).padStart(4)}e ${String(s.squares).padStart(4)}sq ${String(s.cubes).padStart(4)}cu  hv=${s.hypervolume} bd=${s.boundary} genOK=${okGen}`;
  if (expected[n]) {
    const x = expected[n];
    const ok = s.vertices===x.v&&s.edges===x.e&&s.squares===x.sq&&s.cubes===x.cu;
    if(!ok){pass=false; line+="  <<< MISMATCH";}
  }
  if(!okGen){pass=false; line+="  <<< GEN MISMATCH";}
  console.log(line);
}

// projection stability test: 8D, ensure no NaN/Inf for many rotated points
import { rotateInPlane } from './js/math/rotation.js';
let bad=0, maxv=0;
const V = generateVertices(8);
const out=[0,0,0];
for(let frame=0; frame<50; frame++){
  const a = frame*0.3;
  for(const v0 of V){
    const v = Float64Array.from(v0);
    rotateInPlane(v,0,7,Math.cos(a),Math.sin(a));
    rotateInPlane(v,1,6,Math.cos(a*0.8),Math.sin(a*0.8));
    project(v,8,'perspective',3.2,out);
    for(const c of out){ if(!isFinite(c)) bad++; maxv=Math.max(maxv,Math.abs(c)); }
  }
}
console.log(`\nprojection 8D: nonfinite=${bad}, maxCoord=${maxv.toFixed(2)} (clamped, should be finite & bounded)`);

// slice test: 4D sliced -> 3D cube (8 verts, 12 edges)
const sl = sliceCube(4, 3, 0.5);
console.log(`slice 4D@x4=0.5 -> subDim=${sl.subDim}, verts=${sl.vertices.length}, edges=${sl.edges.length} (expect 3,8,12)`);

// presets exist for each dim
for(const n of [2,3,4,5,6,7,8]){
  const p = rotationPresets(n);
  console.log(`presets n=${n}: ${p.length} -> ${p.map(x=>x.name).join(' | ')}`);
}
console.log('\nbinomial(8,4)='+binomial(8,4)+' (expect 70)');
console.log(pass ? '\nALL MATH CHECKS PASS' : '\nMATH CHECKS FAILED');
