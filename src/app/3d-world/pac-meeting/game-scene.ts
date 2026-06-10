import * as THREE from "three";
import { buildCrewmate } from "./crewmate";
import { buildHouse, Collider } from "./house";
import { buildTshirts } from "./tshirts";
import { buildWashroom } from "./washroom";
import { buildTvRoom } from "./tv-room";
import { buildExterior } from "./exterior";
import { buildRestaurant } from "./restaurant";
import { buildTycoon } from "./tycoon";
import { buildDevind } from "./devind";
import { buildCmyna } from "./cmyna";

const PLAYER_RADIUS = 0.38;
const PLAYER_SPEED = 3.2;
// "Five times the man" — the capsule body is ~0.4 units wide.
const MEETING_RADIUS = PLAYER_RADIUS * 5;
const MIN_PITCH = 0.25;
const MAX_PITCH = 1.45;
const MIN_DISTANCE = 4;
const MAX_DISTANCE = 16;

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
  sun.shadow.camera.left = -42;
  sun.shadow.camera.right = 42;
  sun.shadow.camera.top = 42;
  sun.shadow.camera.bottom = -42;
  scene.add(sun);

  const house = buildHouse();
  scene.add(house.group);

  const crewmate = buildCrewmate();
  crewmate.group.position.set(-4, 0, 0);
  scene.add(crewmate.group);

  const wardrobe = buildTshirts();
  scene.add(wardrobe.group);

  const washroom = buildWashroom();
  scene.add(washroom.group);
  house.colliders.push(...washroom.colliders);

  const tvRoom = buildTvRoom();
  scene.add(tvRoom.group);
  house.colliders.push(...tvRoom.colliders);

  const exterior = buildExterior();
  scene.add(exterior.group);
  house.colliders.push(...exterior.colliders);

  const restaurant = buildRestaurant();
  scene.add(restaurant.group);
  house.colliders.push(...restaurant.colliders);

  const tycoon = buildTycoon();
  scene.add(tycoon.group);
  house.colliders.push(...tycoon.colliders);

  const devind = buildDevind();
  scene.add(devind.group);
  house.colliders.push(...devind.colliders);

  const cmyna = buildCmyna();
  scene.add(cmyna.group);
  house.colliders.push(...cmyna.colliders);

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

  // Mouse-orbit state: drag to rotate around the crewmate, wheel to zoom.
  let yaw = 0;
  let pitch = 0.86;
  let distance = 9.9;
  let dragging = false;
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    dragging = true;
    renderer.domElement.setPointerCapture(event.pointerId);
    renderer.domElement.style.cursor = "grabbing";
  };
  const onPointerUp = (event: PointerEvent) => {
    dragging = false;
    renderer.domElement.releasePointerCapture(event.pointerId);
    renderer.domElement.style.cursor = "grab";
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!dragging) return;
    yaw -= event.movementX * 0.005;
    pitch = THREE.MathUtils.clamp(
      pitch + event.movementY * 0.004,
      MIN_PITCH,
      MAX_PITCH,
    );
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    distance = THREE.MathUtils.clamp(
      distance + event.deltaY * 0.01,
      MIN_DISTANCE,
      MAX_DISTANCE,
    );
  };
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  const cameraOffset = () => {
    const horizontal = Math.cos(pitch) * distance;
    return new THREE.Vector3(
      Math.sin(yaw) * horizontal,
      Math.sin(pitch) * distance,
      Math.cos(yaw) * horizontal,
    );
  };

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
      // Camera-relative movement: W always walks away from the camera.
      moveDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
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

    // Spinning t-shirts; walking through one recolors the crewmate.
    for (const shirt of wardrobe.shirts) {
      shirt.group.rotation.y += delta * 1.6;
      const dx = shirt.group.position.x - crewmate.group.position.x;
      const dz = shirt.group.position.z - crewmate.group.position.z;
      if (dx * dx + dz * dz < 0.45 * 0.45) {
        crewmate.setColor(shirt.color);
      }
    }

    washroom.update(delta, crewmate.group.position);
    tvRoom.update(delta, crewmate.group.position);

    cameraTarget.copy(crewmate.group.position).add(cameraOffset());
    camera.position.lerp(cameraTarget, Math.min(1, delta * (dragging ? 20 : 4)));
    camera.lookAt(
      crewmate.group.position.x,
      crewmate.group.position.y + 0.6,
      crewmate.group.position.z,
    );

    renderer.render(scene, camera);
  };
  camera.position.copy(crewmate.group.position).add(cameraOffset());
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
    renderer.domElement.removeEventListener("pointerdown", onPointerDown);
    renderer.domElement.removeEventListener("pointerup", onPointerUp);
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("wheel", onWheel);
    house.dispose();
    crewmate.dispose();
    wardrobe.dispose();
    washroom.dispose();
    tvRoom.dispose();
    exterior.dispose();
    restaurant.dispose();
    tycoon.dispose();
    devind.dispose();
    cmyna.dispose();
    circleGeometry.dispose();
    circleMaterial.dispose();
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}
