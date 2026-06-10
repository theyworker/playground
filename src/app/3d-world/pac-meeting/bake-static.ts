import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Collapses every static Mesh under `root` into one merged mesh per
// material, slashing draw calls (the scene is thousands of tiny boxes —
// dispatch overhead, not vertex work, is what costs).
//
// Subtrees flagged with `userData.dynamic = true` are left untouched
// (anything whose transform animates). Non-mesh children (lights,
// Points) stay in place. Canvas textures keep updating fine because
// materials are reused by reference.
export function bakeStatic(root: THREE.Object3D): { dispose: () => void } {
  root.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  const collect = (object: THREE.Object3D) => {
    if (object.userData.dynamic) return;
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh && !Array.isArray(mesh.material)) meshes.push(mesh);
    for (const child of object.children) collect(child);
  };
  collect(root);

  type Bucket = {
    material: THREE.Material;
    castShadow: boolean;
    geometries: THREE.BufferGeometry[];
  };
  const buckets = new Map<string, Bucket>();
  for (const mesh of meshes) {
    const material = mesh.material as THREE.Material;
    const key = `${material.uuid}|${mesh.castShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, castShadow: mesh.castShadow, geometries: [] };
      buckets.set(key, bucket);
    }
    bucket.geometries.push(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
  }
  for (const mesh of meshes) mesh.removeFromParent();

  const baked = new THREE.Group();
  const merged: THREE.BufferGeometry[] = [];
  for (const bucket of buckets.values()) {
    const geometry = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const mesh = new THREE.Mesh(geometry, bucket.material);
    mesh.castShadow = bucket.castShadow;
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    baked.add(mesh);
    merged.push(geometry);
  }
  root.add(baked);

  return { dispose: () => merged.forEach((g) => g.dispose()) };
}
