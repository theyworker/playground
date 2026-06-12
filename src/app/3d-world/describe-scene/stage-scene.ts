import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { compileScene } from "./compile";
import { buildSceneMeshes, BuiltScene } from "./mesh-factory";
import { buildEnvironment, EnvironmentBuild } from "./environment";
import { disposeSharedMaterials } from "./materials";
import { disposeProceduralTextures, setTextureAnisotropy } from "./textures";
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
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  // r184 deprecated PCFSoftShadowMap; PCF + shadow.radius gives soft edges.
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  setTextureAnisotropy(renderer.capabilities.getMaxAnisotropy());

  // Image-based lighting without assets: the built-in RoomEnvironment is a
  // procedural studio box prefiltered through PMREM. Kept subtle so the
  // per-scene sun/hemisphere stay in charge of the mood.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = environmentTexture;
  scene.environmentIntensity = 0.5;

  // Deliberate three-light setup: hemisphere ambient (sky/ground bounce),
  // one shadow-casting key, and a soft non-shadow fill from the other side.
  const hemi = new THREE.HemisphereLight(0xcdd6e8, 0x3a3d42, 0.65);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.8);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  // Tight frustum around the populated stage keeps 1024px crisp.
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 11;
  sun.shadow.camera.bottom = -11;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xcdd6e8, 0.4);
  fill.position.set(-6, 6, 6);
  scene.add(fill);

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
    hemi.color.set(lights.ambientColor);
    hemi.groundColor.set(lights.groundColor);
    hemi.intensity = lights.ambientIntensity;
    // Fill mirrors the key on x at half height, tinted like the sky, and
    // scales with the key so the ratio holds across times of day.
    fill.color.set(lights.ambientColor);
    fill.intensity = lights.sunIntensity * 0.25;
    fill.position.set(-lights.sunPosition[0], lights.sunPosition[1] * 0.5, 6);
    scene.environmentIntensity = lights.envIntensity;
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
      environmentTexture.dispose();
      disposeSharedMaterials();
      disposeProceduralTextures();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
