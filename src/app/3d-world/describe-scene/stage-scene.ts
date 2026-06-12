import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Empty stage for the "Describe the Scene" drill. Phase 1 renders only the
// lit ground; scene entities are compiled onto it in later phases.
export function createStageScene(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10121f);
  scene.fog = new THREE.Fog(0x10121f, 18, 34);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(0, 3.2, 9.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xbfc8ff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  scene.add(sun);

  const groundGeometry = new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a3142,
    roughness: 0.95,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  scene.add(ground);

  // Viewers may nudge the camera slightly to peek around, but the framing
  // stays fixed — no fly-around, pan, or big zooms.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 8.5;
  controls.maxDistance = 11;
  controls.minAzimuthAngle = -0.2;
  controls.maxAzimuthAngle = 0.2;
  controls.minPolarAngle = 1.25;
  controls.maxPolarAngle = 1.42;

  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };
  window.addEventListener("resize", onResize);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", onResize);
    controls.dispose();
    groundGeometry.dispose();
    groundMaterial.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
