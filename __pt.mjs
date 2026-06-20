import { generateVertices } from './js/math/hypercube.js';
import { rotateInPlane } from './js/math/rotation.js';
import { project } from './js/math/projection.js';
for (const [n,mode] of [[4,'perspective'],[5,'perspective'],[8,'perspective'],[8,'sequential'],[8,'orthographic']]){
  const V=generateVertices(n); const out=[0,0,0]; let maxv=0,bad=0;
  for(let frame=0;frame<200;frame++){const a=frame*0.137;
    for(const v0 of V){const v=Float64Array.from(v0);
      rotateInPlane(v,0,n-1,Math.cos(a),Math.sin(a));
      if(n>4)rotateInPlane(v,1,n-2,Math.cos(a*0.8),Math.sin(a*0.8));
      project(v,n,mode,3.2,out);
      for(const c of out){if(!isFinite(c))bad++;maxv=Math.max(maxv,Math.abs(c));}}}
  console.log(`n=${n} ${mode.padEnd(12)} maxCoord=${maxv.toFixed(3)} nonfinite=${bad}`);
}
