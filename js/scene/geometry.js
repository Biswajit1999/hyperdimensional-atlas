// geometry.js
// Owns the renderable buffers for the projected hypercube: edge line segments,
// vertex point cloud, and optional ghost trails. Buffers are reused across
// frames and only reallocated when the topology (vertex/edge count) changes.

import * as THREE from 'three';
import { TRAIL } from '../constants.js';

export class HypercubeObject {
  /**
   * @param {THREE.Scene} scene
   * @param {object} materials from createMaterials()
   */
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.group = new THREE.Group();
    scene.add(this.group);

    // Edge line segments.
    this.edgeGeo = new THREE.BufferGeometry();
    this.edges = [];
    this.lineSegments = new THREE.LineSegments(this.edgeGeo, materials.edgeMaterial);
    this.lineSegments.frustumCulled = false;
    this.group.add(this.lineSegments);

    // Vertex markers.
    this.pointGeo = new THREE.BufferGeometry();
    this.points = new THREE.Points(this.pointGeo, materials.vertexMaterial);
    this.points.frustumCulled = false;
    this.group.add(this.points);

    // Ghost trails: a ring of fading echoes of the edge geometry.
    this.trails = [];
    this.trailGroup = new THREE.Group();
    this.group.add(this.trailGroup);
    for (let i = 0; i < TRAIL.segments; i++) {
      const geo = new THREE.BufferGeometry();
      const mat = materials.trailMaterialBase.clone();
      // Older echoes are dimmer.
      mat.opacity = 0.22 * (1 - i / TRAIL.segments);
      const seg = new THREE.LineSegments(geo, mat);
      seg.frustumCulled = false;
      seg.visible = false;
      this.trailGroup.add(seg);
      this.trails.push({ geo, seg, mat });
    }
    this.trailHead = 0;
    this.frameCounter = 0;

    this._vertexCount = 0;
    this._edgeCount = 0;
  }

  /**
   * (Re)allocate buffers for a new topology.
   * @param {number} vertexCount number of vertices
   * @param {Array<[number, number]>} edges index pairs
   */
  setTopology(vertexCount, edges) {
    this.edges = edges;
    this._vertexCount = vertexCount;
    this._edgeCount = edges.length;

    // Vertex buffers.
    this.pointGeo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    this.pointGeo.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));

    // Edge buffers (2 endpoints per edge).
    const edgeFloats = Math.max(edges.length, 1) * 2 * 3;
    this.edgeGeo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(edgeFloats), 3));
    this.edgeGeo.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(edgeFloats), 3));

    // Trail buffers match the edge buffer size.
    for (const t of this.trails) {
      t.geo.setAttribute('position',
        new THREE.BufferAttribute(new Float32Array(edgeFloats), 3));
      t.geo.setAttribute('color',
        new THREE.BufferAttribute(new Float32Array(edgeFloats), 3));
      t.seg.visible = false;
    }
    this.trailHead = 0;
  }

  /**
   * Update positions and colours from freshly projected data.
   * @param {Float32Array} vertexPos length vertexCount*3
   * @param {Float32Array} vertexCol length vertexCount*3
   * @param {object} flags { wireframe, vertexMarkers, ghostTrails }
   */
  update(vertexPos, vertexCol, flags) {
    // Vertices.
    const pPos = this.pointGeo.attributes.position.array;
    const pCol = this.pointGeo.attributes.color.array;
    pPos.set(vertexPos);
    pCol.set(vertexCol);
    this.pointGeo.attributes.position.needsUpdate = true;
    this.pointGeo.attributes.color.needsUpdate = true;
    this.points.visible = flags.vertexMarkers && this._vertexCount > 0;

    // Edges: gather endpoint positions/colours.
    const ePos = this.edgeGeo.attributes.position.array;
    const eCol = this.edgeGeo.attributes.color.array;
    let o = 0;
    for (let i = 0; i < this.edges.length; i++) {
      const a = this.edges[i][0] * 3;
      const b = this.edges[i][1] * 3;
      ePos[o] = vertexPos[a]; ePos[o + 1] = vertexPos[a + 1]; ePos[o + 2] = vertexPos[a + 2];
      eCol[o] = vertexCol[a]; eCol[o + 1] = vertexCol[a + 1]; eCol[o + 2] = vertexCol[a + 2];
      o += 3;
      ePos[o] = vertexPos[b]; ePos[o + 1] = vertexPos[b + 1]; ePos[o + 2] = vertexPos[b + 2];
      eCol[o] = vertexCol[b]; eCol[o + 1] = vertexCol[b + 1]; eCol[o + 2] = vertexCol[b + 2];
      o += 3;
    }
    this.edgeGeo.attributes.position.needsUpdate = true;
    this.edgeGeo.attributes.color.needsUpdate = true;
    this.edgeGeo.setDrawRange(0, this.edges.length * 2);
    this.lineSegments.visible = flags.wireframe && this.edges.length > 0;

    // Ghost trails.
    this._updateTrails(ePos, eCol, flags.ghostTrails);
  }

  _updateTrails(ePos, eCol, enabled) {
    if (!enabled) {
      for (const t of this.trails) t.seg.visible = false;
      return;
    }
    this.frameCounter++;
    if (this.frameCounter % TRAIL.frameStride === 0) {
      // Capture current edge state into the head echo, then advance the ring.
      const t = this.trails[this.trailHead];
      t.geo.attributes.position.array.set(ePos);
      t.geo.attributes.color.array.set(eCol);
      t.geo.attributes.position.needsUpdate = true;
      t.geo.attributes.color.needsUpdate = true;
      t.geo.setDrawRange(0, this.edges.length * 2);
      this.trailHead = (this.trailHead + 1) % this.trails.length;
    }
    // Assign opacity by age: most recent capture is brightest.
    for (let i = 0; i < this.trails.length; i++) {
      const age = (this.trailHead - 1 - i + this.trails.length * 2) % this.trails.length;
      const t = this.trails[i];
      t.seg.visible = true;
      t.mat.opacity = 0.20 * (1 - age / this.trails.length);
    }
  }

  /** Apply a 3D world rotation/orientation if desired (camera does the rest). */
  get object3d() {
    return this.group;
  }
}
