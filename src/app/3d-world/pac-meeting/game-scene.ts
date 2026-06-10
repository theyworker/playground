import * as THREE from "three";
import { buildCrewmate } from "./crewmate";
import { buildHouse, Collider } from "./house";

const PLAYER_RADIUS = 0.38;
const PLAYER_SPEED = 3.2;
// "Five times the man" — the capsule body is ~0.4 units wide.
const MEETING_RADIUS = PLAYER_RADIUS * 5;
const CAMERA_OFFSET = new THREE.Vector3(0, 7.5, 6.5);

function collides(x: number, z: number, colliders: Collider[]): boolean {
  for (const c of colliders) {
    if (
      x + PLAYER_RADIUS > c.minX &&
      x - PLAYER_RADIUS < c.maxX &&
      z + PLAYER_RADIUS > c.minZ &&
      z - PLAYER_RADIUS < c.maxZ
    ) {
      return true;
    }
  }
  return false;
}

export function createGameScene(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10121f);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100,
  );

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
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  scene.add(sun);

  const house = buildHouse();
  scene.add(house.group);

  const crewmate = buildCrewmate();
  crewmate.group.position.set(-4, 0, 0);
  scene.add(crewmate.group);

  // M-key range circle, drawn flat on the floor around the character.
  const circleGeometry = new THREE.RingGeometry(
    MEETING_RADIUS - 0.06,
    MEETING_RADIUS,
    64,
  ).rotateX(-Math.PI / 2);
  const circleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd23f,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const circle = new THREE.Mesh(circleGeometry, circleMaterial);
  circle.position.y = 0.02;
  circle.visible = false;
  scene.add(circle);

  const keys = new Set<string>();
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "KeyM" && !event.repeat) {
      circle.visible = !circle.visible;
      return;
    }
    keys.add(event.code);
    if (event.code.startsWith("Arrow")) event.preventDefault();
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const moveDirection = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  let targetAngle = 0;
  let walkPhase = 0;

  const clock = new THREE.Clock();
  let frame = 0;
  const animate = () => {
    frame = requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.05);

    moveDirection.set(
      Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft")),
      0,
      Number(keys.has("KeyS") || keys.has("ArrowDown")) -
        Number(keys.has("KeyW") || keys.has("ArrowUp")),
    );
    const moving = moveDirection.lengthSq() > 0;

    if (moving) {
      moveDirection.normalize().multiplyScalar(PLAYER_SPEED * delta);
      const position = crewmate.group.position;
      // Resolve each axis separately so the player slides along walls.
      if (!collides(position.x + moveDirection.x, position.z, house.colliders)) {
        position.x += moveDirection.x;
      }
      if (!collides(position.x, position.z + moveDirection.z, house.colliders)) {
        position.z += moveDirection.z;
      }
      targetAngle = Math.atan2(moveDirection.x, moveDirection.z);
      walkPhase += delta * 11;
    }

    // Shortest-path rotation toward the movement direction.
    let angleDelta = targetAngle - crewmate.group.rotation.y;
    angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
    crewmate.group.rotation.y += angleDelta * Math.min(1, delta * 12);

    crewmate.group.rotation.z = moving ? Math.sin(walkPhase) * 0.04 : 0;

    circle.position.x = crewmate.group.position.x;
    circle.position.z = crewmate.group.position.z;

    cameraTarget.copy(crewmate.group.position).add(CAMERA_OFFSET);
    camera.position.lerp(cameraTarget, Math.min(1, delta * 4));
    camera.lookAt(
      crewmate.group.position.x,
      crewmate.group.position.y + 0.6,
      crewmate.group.position.z,
    );

    renderer.render(scene, camera);
  };
  camera.position.copy(crewmate.group.position).add(CAMERA_OFFSET);
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
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    house.dispose();
    crewmate.dispose();
    circleGeometry.dispose();
    circleMaterial.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
