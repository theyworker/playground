import * as THREE from "three";

// Material policy for the stage: every scene mesh is a MeshStandardMaterial
// with matte-leaning PBR values (roughness ~0.6-0.9, metalness 0 except for
// genuinely metallic props). Identical tints share one cached instance so a
// crowd of seeded-color figures and repeated props costs one shader program
// and far fewer material switches (mobile perf).
//
// Cached materials are shared across meshes AND scene switches — never
// mutate one per-mesh. In particular `emissive` stays at its default; the
// upcoming highlight phase must swap/clone materials, not edit shared state.

export interface SharedMaterialSpec {
  color: number;
  /** Microfacet roughness; the matte default suits wood/fabric/paint. */
  roughness?: number;
  /** Raise only for genuinely metallic props (chrome, brass, steel). */
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

export function sharedMaterial(
  spec: SharedMaterialSpec,
): THREE.MeshStandardMaterial {
  const roughness = spec.roughness ?? 0.8;
  const metalness = spec.metalness ?? 0;
  const opacity = spec.opacity ?? 1;
  const key = spec.transparent
    ? `${spec.color}|${roughness}|${metalness}|t${opacity}`
    : `${spec.color}|${roughness}|${metalness}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness,
      metalness,
      ...(spec.transparent && { transparent: true, opacity }),
    });
    cache.set(key, material);
  }
  return material;
}

/** Stage teardown only — scene switches keep the cache warm on purpose. */
export function disposeSharedMaterials(): void {
  cache.forEach((material) => material.dispose());
  cache.clear();
}
