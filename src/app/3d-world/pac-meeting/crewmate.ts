import * as THREE from "three";

// The man: a single red capsule. Faces +Z when rotation.y === 0.
export function buildCrewmate(): {
  group: THREE.Group;
  dispose: () => void;
} {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xc51111,
    roughness: 0.6,
  });
  const bodyGeometry = new THREE.CapsuleGeometry(0.32, 0.34, 8, 24);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  return {
    group,
    dispose: () => {
      bodyGeometry.dispose();
      bodyMaterial.dispose();
    },
  };
}
