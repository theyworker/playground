import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { compileScene } from "./compile";
import { buildSceneMeshes, BuiltScene } from "./mesh-factory";
import { buildEnvironment, EnvironmentBuild } from "./environment";
import type { SceneSpec } from "./types";

export interface SceneReport {
  /** Descriptors that rendered as the placeholder fallback (asset gaps). */
  fallbacks: string[];
}

export interface StageHandle {
  /** Compiles and displays a scene; the stage itself persists. */
  setScene(scene: SceneSpec): SceneReport;
  dispose(): void;
}

// Stage for the "Describe the Scene" drill: renderer, clamped camera, and
// lights whose color/intensity the per-scene environment retunes.
export function createStageScene(container: HTMLElement): StageHandle {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10121f);
  scene.fog = new THREE.Fog(0x10121f, 20, 38);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );
  // Slightly above head height, far enough back that the foreground (z=4),
  // midground (z=0), and background (z=-5) rows separate clearly.
  camera.position.set(0, 3.6, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xbfc8ff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.4);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  scene.add(sun);

  // Viewers may nudge the camera slightly to peek around, but the framing
  // stays fixed — no fly-around, pan, or big zooms.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.9, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 9.5;
  controls.maxDistance = 11.5;
  controls.minAzimuthAngle = -0.2;
  controls.maxAzimuthAngle = 0.2;
  controls.minPolarAngle = 1.22;
  controls.maxPolarAngle = 1.38;

  let content: BuiltScene | null = null;
  let environment: EnvironmentBuild | null = null;

  const setScene = (spec: SceneSpec): SceneReport => {
    if (content) {
      scene.remove(content.group);
      content.dispose();
    }
    if (environment) {
      scene.remove(environment.group);
      environment.dispose();
    }

    environment = buildEnvironment(spec.setting);
    scene.add(environment.group);
    const { lights } = environment;
    sun.color.set(lights.sunColor);
    sun.intensity = lights.sunIntensity;
    sun.position.set(...lights.sunPosition);
    ambient.color.set(lights.ambientColor);
    ambient.intensity = lights.ambientIntensity;
    (scene.background as THREE.Color).set(lights.background);
    (scene.fog as THREE.Fog).color.set(lights.background);

    content = buildSceneMeshes(compileScene(spec));
    scene.add(content.group);
    return { fallbacks: content.fallbacks };
  };

  const clock = new THREE.Clock();
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    content?.update(elapsed);
    environment?.update(elapsed);
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

  return {
    setScene,
    dispose: () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      content?.dispose();
      environment?.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
