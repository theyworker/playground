import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildMug, BEER_BOTTOM, BEER_TOP, INNER_RADIUS } from "./mug";
import { Fizz } from "./fizz";

export function createBeerScene(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0a07);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  camera.position.set(2.6, 2.2, 3.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  scene.add(new THREE.AmbientLight(0xffe8c0, 0.3));
  const keyLight = new THREE.DirectionalLight(0xfff2dd, 1.5);
  keyLight.position.set(3, 5, 2);
  scene.add(keyLight);

  const floorGeometry = new THREE.CircleGeometry(5, 64).rotateX(-Math.PI / 2);
  // Lightly lacquered bar-top look so the mug picks up a soft reflection.
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x171008,
    roughness: 0.55,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  });
  scene.add(new THREE.Mesh(floorGeometry, floorMaterial));

  const mug = buildMug();
  scene.add(mug.group);

  const fizz = new Fizz(BEER_BOTTOM + 0.05, BEER_TOP - 0.05, INNER_RADIUS - 0.12);
  scene.add(fizz.mesh);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, 0);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.minDistance = 2;
  controls.maxDistance = 8;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  const clock = new THREE.Clock();
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    fizz.update(clock.getElapsedTime());
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
    mug.dispose();
    fizz.dispose();
    floorGeometry.dispose();
    floorMaterial.dispose();
    envTexture.dispose();
    pmrem.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
