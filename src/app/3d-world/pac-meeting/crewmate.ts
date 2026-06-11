import * as THREE from "three";

// The man: an articulated human figure, ~1.8 units tall, built from
// smooth primitives. Faces +Z when rotation.y === 0. Joint pivots
// (hips, knees, shoulders, elbows) are driven by update() for a walk
// cycle; setColor recolors his t-shirt (the wardrobe mechanic).
export function buildCrewmate(): {
  group: THREE.Group;
  setColor: (color: number) => void;
  update: (delta: number, walkPhase: number, moving: boolean) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  const material = (options: THREE.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial(options);
    disposables.push(m);
    return m;
  };
  const skin = material({ color: 0xd9a47e, roughness: 0.62 });
  const hair = material({ color: 0x2e2119, roughness: 0.9 });
  const shirt = material({ color: 0xc51111, roughness: 0.75 });
  const pants = material({ color: 0x32415e, roughness: 0.85 });
  const shoe = material({ color: 0xe9e6df, roughness: 0.55 });
  const sclera = material({ color: 0xf4f2ee, roughness: 0.25 });
  const iris = material({ color: 0x47301e, roughness: 0.2 });
  const pupil = material({ color: 0x101010, roughness: 0.2 });
  const lips = material({ color: 0xa8635a, roughness: 0.6 });

  const sphere = (
    parent: THREE.Object3D,
    m: THREE.Material,
    radius: number,
    x: number, y: number, z: number,
    sx = 1, sy = 1, sz = 1,
  ) => {
    const geometry = new THREE.SphereGeometry(radius, 24, 18);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const capsule = (
    parent: THREE.Object3D,
    m: THREE.Material,
    radius: number, length: number,
    x: number, y: number, z: number,
  ) => {
    const geometry = new THREE.CapsuleGeometry(radius, length, 6, 20);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // `figure` bobs vertically with the stride; everything hangs off it.
  const figure = new THREE.Group();
  group.add(figure);

  // Pelvis stays level; `upper` (torso, head, arms) leans into the walk.
  sphere(figure, pants, 0.15, 0, 0.96, 0, 1.05, 0.72, 0.8);
  const upper = new THREE.Group();
  upper.position.y = 1.02;
  figure.add(upper);

  const torso = capsule(upper, shirt, 0.155, 0.26, 0, 0.24, 0);
  torso.scale.set(1.05, 1, 0.72);

  // --- Head, on a neck above the torso ---
  capsule(upper, skin, 0.042, 0.06, 0, 0.5, 0);
  const head = new THREE.Group();
  head.position.y = 0.62;
  upper.add(head);

  sphere(head, skin, 0.105, 0, 0.01, 0, 0.92, 1.08, 0.98); // skull
  sphere(head, skin, 0.085, 0, -0.045, 0.012, 0.82, 0.9, 0.85); // jaw and chin
  for (const side of [-1, 1]) {
    sphere(head, sclera, 0.0185, side * 0.039, 0.012, 0.082);
    sphere(head, iris, 0.0095, side * 0.039, 0.012, 0.0975);
    sphere(head, pupil, 0.005, side * 0.039, 0.012, 0.105);
    const brow = sphere(head, hair, 0.0125, side * 0.04, 0.052, 0.088, 1.7, 0.3, 0.5);
    brow.rotation.z = side * -0.12;
    sphere(head, skin, 0.022, side * 0.094, -0.005, 0.005, 0.45, 1, 0.75); // ear
  }
  sphere(head, skin, 0.016, 0, -0.022, 0.094, 0.75, 1.35, 0.9); // nose
  sphere(head, lips, 0.012, 0, -0.078, 0.082, 2.1, 0.55, 0.7); // mouth

  const hairCapGeometry = new THREE.SphereGeometry(
    0.112, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.58,
  );
  disposables.push(hairCapGeometry);
  const hairCap = new THREE.Mesh(hairCapGeometry, hair);
  hairCap.position.set(0, 0.012, -0.008);
  hairCap.rotation.x = -0.22; // tilt back to clear the forehead
  hairCap.castShadow = true;
  head.add(hairCap);
  sphere(head, hair, 0.1, 0, 0.005, -0.04, 0.96, 0.95, 0.75); // back volume

  // --- Arms: shoulder pivot -> sleeve + upper arm -> elbow pivot ---
  const shoulders: THREE.Group[] = [];
  const elbows: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.205, 0.4, 0);
    upper.add(shoulder);
    capsule(shoulder, shirt, 0.058, 0.09, 0, -0.07, 0); // short sleeve
    capsule(shoulder, skin, 0.045, 0.14, 0, -0.21, 0);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    capsule(elbow, skin, 0.04, 0.18, 0, -0.13, 0);
    sphere(elbow, skin, 0.046, 0, -0.27, 0.005, 0.8, 1.1, 0.9); // hand
    shoulders.push(shoulder);
    elbows.push(elbow);
  }

  // --- Legs: hip pivot -> thigh -> knee pivot -> calf + sneaker ---
  const hips: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.085, 1.0, 0);
    figure.add(hip);
    capsule(hip, pants, 0.072, 0.28, 0, -0.22, 0);
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    capsule(knee, pants, 0.055, 0.32, 0, -0.235, 0);
    const foot = sphere(knee, shoe, 0.07, 0, -0.49, 0.045, 0.75, 0.6, 1.7);
    foot.receiveShadow = true;
    hips.push(hip);
    knees.push(knee);
  }

  // Walk cycle, blended in and out so stopping doesn't snap the pose.
  let walkWeight = 0;
  let idleTime = 0;
  const update = (delta: number, walkPhase: number, moving: boolean) => {
    idleTime += delta;
    const target = moving ? 1 : 0;
    walkWeight += (target - walkWeight) * Math.min(1, delta * 8);

    const swing = Math.sin(walkPhase) * walkWeight;
    for (const [i, side] of [-1, 1].entries()) {
      // Opposite legs, and arms opposite their own-side leg.
      hips[i].rotation.x = side * swing * -0.6;
      // Bend peaks as the foot swings through under the body.
      knees[i].rotation.x =
        Math.max(0, Math.sin(walkPhase - 1.6 + (side < 0 ? 0 : Math.PI))) *
        0.75 * walkWeight;
      shoulders[i].rotation.x = side * swing * 0.45;
      shoulders[i].rotation.z = side * 0.06;
      elbows[i].rotation.x = -(0.18 + 0.28 * walkWeight);
    }

    figure.position.y =
      Math.abs(Math.cos(walkPhase)) * 0.035 * walkWeight;
    upper.rotation.x =
      0.07 * walkWeight + Math.sin(idleTime * 1.7) * 0.012 * (1 - walkWeight);
    head.rotation.x = -upper.rotation.x * 0.6;
  };
  update(0, 0, false);

  return {
    group,
    setColor: (color: number) => shirt.color.set(color),
    update,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
