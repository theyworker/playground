import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { createBeamMaterial, createHologramMaterial } from "./hologram-material";

const CYAN = 0x36e5ff;
const PARTICLE_COUNT = 350;

function createParticles(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: CYAN,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

export function createHologramScene(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020409);
  scene.fog = new THREE.FogExp2(0x020409, 0.055);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(0, 1.7, 5.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      1.25,
      0.7,
      0.1,
    ),
  );

  const disposables: { dispose: () => void }[] = [];
  const animatedMaterials: THREE.ShaderMaterial[] = [];

  const grid = new THREE.GridHelper(40, 80, CYAN, 0x0a2e3a);
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.35;
  scene.add(grid);
  disposables.push(grid.geometry, gridMaterial);

  const emitterGeometry = new THREE.TorusGeometry(0.85, 0.02, 12, 96);
  const emitterMaterial = new THREE.MeshBasicMaterial({ color: CYAN });
  const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
  emitter.rotation.x = -Math.PI / 2;
  emitter.position.y = 0.02;
  scene.add(emitter);
  disposables.push(emitterGeometry, emitterMaterial);

  const beamGeometry = new THREE.CylinderGeometry(1.5, 0.35, 2.8, 48, 1, true);
  const beamMaterial = createBeamMaterial(CYAN, 0, 2.8);
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.y = 1.4;
  scene.add(beam);
  disposables.push(beamGeometry, beamMaterial);
  animatedMaterials.push(beamMaterial);

  const coreGeometry = new THREE.IcosahedronGeometry(0.85, 1);
  const coreMaterial = createHologramMaterial(CYAN, 0.9, true);
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.position.y = 1.7;
  scene.add(core);
  disposables.push(coreGeometry, coreMaterial);
  animatedMaterials.push(coreMaterial);

  const ringGeometry = new THREE.TorusGeometry(1.25, 0.015, 8, 128);
  const ringMaterial = createHologramMaterial(CYAN, 0.7);
  const ringA = new THREE.Mesh(ringGeometry, ringMaterial);
  ringA.position.y = 1.7;
  const ringB = new THREE.Mesh(ringGeometry, ringMaterial);
  ringB.position.y = 1.7;
  ringB.scale.setScalar(1.25);
  scene.add(ringA, ringB);
  disposables.push(ringGeometry, ringMaterial);
  animatedMaterials.push(ringMaterial);

  const particles = createParticles();
  scene.add(particles);
  disposables.push(particles.geometry, particles.material as THREE.Material);

  const pointer = new THREE.Vector2();
  const onPointerMove = (event: PointerEvent) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      (event.clientY / window.innerHeight) * 2 - 1,
    );
  };
  window.addEventListener("pointermove", onPointerMove);

  const clock = new THREE.Clock();
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    for (const material of animatedMaterials) {
      material.uniforms.uTime.value = time;
    }
    core.rotation.y = time * 0.4;
    core.rotation.x = Math.sin(time * 0.3) * 0.2;
    core.position.y = 1.7 + Math.sin(time * 0.8) * 0.06;
    ringA.rotation.set(Math.PI / 2 + Math.sin(time * 0.5) * 0.3, 0, time * 0.3);
    ringB.rotation.set(time * 0.25, Math.PI / 3, Math.cos(time * 0.4) * 0.4);
    particles.rotation.y = time * 0.02;

    // Subtle parallax toward the pointer keeps the hologram feeling volumetric.
    camera.position.x += (pointer.x * 0.45 - camera.position.x) * 0.05;
    camera.position.y += (1.7 - pointer.y * 0.25 - camera.position.y) * 0.05;
    camera.lookAt(0, 1.6, 0);

    composer.render();
  };
  animate();

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    composer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    disposables.forEach((d) => d.dispose());
    composer.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
