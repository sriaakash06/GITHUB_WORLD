import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * ═══════════════════════════════════════════════════════════════════
 * INSTANCING TOOLKIT  (Fix 9)
 * ═══════════════════════════════════════════════════════════════════
 * The village is built almost entirely from four unit primitives that are
 * scaled and rotated per instance. Roof tiles, stone blocks, fence posts,
 * planks, windows, trees and lamps therefore collapse into a handful of
 * THREE.InstancedMesh draw calls instead of thousands of separate meshes.
 */

// ── Unit primitives (deliberately low segment counts) ──
export const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
export const UNIT_CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1);
export const UNIT_CONE = new THREE.ConeGeometry(0.5, 1, 6, 1);
export const UNIT_SPHERE = new THREE.SphereGeometry(0.5, 6, 4);

// ── Shared materials. Colour always arrives per instance. ──
export const MAT_MATTE = new THREE.MeshStandardMaterial({
  roughness: 0.9,
  flatShading: true,
});
export const MAT_GLASS = new THREE.MeshStandardMaterial({
  roughness: 0.12,
  metalness: 0.35,
  flatShading: true,
});
export const MAT_METAL = new THREE.MeshStandardMaterial({
  roughness: 0.3,
  metalness: 0.75,
  flatShading: true,
});
/** Invisible, unlit material for hover/click proxy volumes. */
export const MAT_PICK = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});

// ─────────────────────────────────────────────────────────────────
// BATCH BUILDER
// ─────────────────────────────────────────────────────────────────

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scl = new THREE.Vector3();
const _euler = new THREE.Euler();
const _local = new THREE.Matrix4();
const _world = new THREE.Matrix4();
const _col = new THREE.Color();
const _tmp = new Array(16);

/** A growable list of instance matrices + colours. */
export const createBatch = () => ({ m: [], c: [], count: 0 });

/**
 * Appends every part in `parts` to `batch`, transformed by `parentMatrix`.
 * Parts are authored in a component's own local space as
 * `{ p:[x,y,z], r:[rx,ry,rz]?, s:[sx,sy,sz], c:'#hex' }`.
 */
export function addParts(batch, parts, parentMatrix) {
  for (let i = 0; i < parts.length; i++) {
    const it = parts[i];
    _pos.set(it.p[0], it.p[1], it.p[2]);
    _euler.set(it.r ? it.r[0] : 0, it.r ? it.r[1] : 0, it.r ? it.r[2] : 0);
    _quat.setFromEuler(_euler);
    _scl.set(it.s[0], it.s[1], it.s[2]);
    _local.compose(_pos, _quat, _scl);

    if (parentMatrix) _world.multiplyMatrices(parentMatrix, _local);
    else _world.copy(_local);

    _world.toArray(_tmp);
    for (let k = 0; k < 16; k++) batch.m.push(_tmp[k]);

    _col.set(it.c || '#ffffff');
    batch.c.push(_col.r, _col.g, _col.b);
    batch.count++;
  }
}

/** Freeze a batch into typed arrays ready for an InstancedMesh. */
export const finalizeBatch = (batch) => ({
  count: batch.count,
  matrices: new Float32Array(batch.m),
  colors: new Float32Array(batch.c),
});

/** Compose a parent transform for one placed object. */
export function objectMatrix(target, position, rotationY, scale) {
  _pos.set(position[0], position[1], position[2]);
  _euler.set(0, rotationY, 0);
  _quat.setFromEuler(_euler);
  _scl.set(scale, scale, scale);
  return target.compose(_pos, _quat, _scl);
}

// ─────────────────────────────────────────────────────────────────
// RENDERER
// ─────────────────────────────────────────────────────────────────

/**
 * Renders one finalized batch as a single InstancedMesh.
 * `data` must be a stable object (build it inside a useMemo).
 */
export const InstancedBatch = React.memo(function InstancedBatch({
  geometry = UNIT_BOX,
  material = MAT_MATTE,
  data,
  castShadow = true,
  receiveShadow = true,
  ...rest
}) {
  const ref = useRef();

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh || !data || !data.count) return;

    mesh.instanceMatrix.array.set(data.matrices);
    mesh.instanceMatrix.needsUpdate = true;

    if (!mesh.instanceColor || mesh.instanceColor.count !== data.count) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(data.count * 3),
        3
      );
    }
    mesh.instanceColor.array.set(data.colors);
    mesh.instanceColor.needsUpdate = true;

    mesh.computeBoundingSphere();
  }, [data]);

  if (!data || !data.count) return null;

  return (
    <instancedMesh
      key={data.count}
      ref={ref}
      args={[geometry, material, data.count]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      {...rest}
    />
  );
});
