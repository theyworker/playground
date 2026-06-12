import * as THREE from "three";
import { Kit } from "../pac-meeting/mansion-kit";
import type { SceneSetting } from "./types";

// Setting-driven stage dressing: lights tuned by time_of_day/weather,
// rain particles when wet, and an indoor room (floor + walls) versus an
// open outdoor ground tinted by the location.

export interface EnvironmentBuild {
  group: THREE.Group;
  lights: {
    sunColor: number;
    sunIntensity: number;
    sunPosition: [number, number, number];
    ambientColor: number;
    ambientIntensity: number;
    background: number;
  };
  update: (elapsed: number) => void;
  dispose: () => void;
}

// Room footprint; walls are low enough that the clamped camera sees over
// them, and rain only spawns outside this box.
const ROOM_HALF_X = 8;
const ROOM_BACK_Z = -8;
const ROOM_FRONT_Z = 7;
const WALL_HEIGHT = 3.1;

const RAIN_COUNT = 600;
const RAIN_TOP = 11;

function lightsFor(setting: SceneSetting): EnvironmentBuild["lights"] {
  const time = setting.time_of_day.toLowerCase();
  const lights: EnvironmentBuild["lights"] = {
    sunColor: 0xffffff,
    sunIntensity: 1.4,
    sunPosition: [6, 12, 4],
    ambientColor: 0xcdd6e8,
    ambientIntensity: 0.5,
    background: 0x9cb8d9,
  };
  if (time.includes("morning")) {
    lights.sunColor = 0xfff3d6;
    lights.sunIntensity = 1.5;
    lights.ambientColor = 0xbfd4ff;
    lights.ambientIntensity = 0.55;
    lights.background = 0x9cc4e4;
  } else if (time.includes("afternoon")) {
    // Late-day golden light, sun low in the west.
    lights.sunColor = 0xffc98a;
    lights.sunIntensity = 1.25;
    lights.sunPosition = [-8, 6, 5];
    lights.ambientColor = 0xd9c2a6;
    lights.ambientIntensity = 0.5;
    lights.background = 0xcfa177;
  } else if (/evening|night|dusk/.test(time)) {
    lights.sunColor = 0x8ca3d9;
    lights.sunIntensity = 0.55;
    lights.sunPosition = [-4, 8, -3];
    lights.ambientColor = 0x39406b;
    lights.ambientIntensity = 0.45;
    lights.background = 0x141a2e;
  }
  if (setting.indoor) {
    lights.ambientColor = 0xe8d9c0;
    lights.ambientIntensity = 0.55;
    lights.background = 0x262a38;
  }
  if (/rain|storm|drizzle/.test(setting.weather.toLowerCase())) {
    lights.sunIntensity *= 0.45;
    lights.ambientIntensity *= 0.75;
    lights.background = setting.indoor ? 0x2b303b : 0x49505e;
  }
  return lights;
}

function groundColorFor(setting: SceneSetting): number {
  const location = setting.location.toLowerCase();
  if (/park|garden|forest|lawn/.test(location)) return 0x2d4a23;
  if (/street|bus|road|stop|city|sidewalk/.test(location)) return 0x3a3d42;
  if (/beach|sand/.test(location)) return 0xc4ab7a;
  return 0x4a5160;
}

function buildRain(kit: Kit, indoor: boolean): {
  update: (elapsed: number) => void;
} {
  const positions = new Float32Array(RAIN_COUNT * 3);
  const seeds = new Float32Array(RAIN_COUNT);
  const speeds = new Float32Array(RAIN_COUNT);
  for (let i = 0; i < RAIN_COUNT; i++) {
    let x = 0;
    let z = 0;
    // Indoors the room has no roof the camera can see through, so keep
    // drops outside its footprint.
    do {
      x = (Math.random() - 0.5) * 28;
      z = -12 + Math.random() * 22;
    } while (
      indoor &&
      Math.abs(x) < ROOM_HALF_X + 0.4 &&
      z > ROOM_BACK_Z - 0.4 &&
      z < ROOM_FRONT_Z + 0.4
    );
    positions[i * 3] = x;
    positions[i * 3 + 2] = z;
    seeds[i] = Math.random() * RAIN_TOP;
    speeds[i] = 6 + Math.random() * 3;
  }
  const geometry = kit.track(new THREE.BufferGeometry());
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = kit.track(
    new THREE.PointsMaterial({
      color: 0x8fa3c4,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    }),
  );
  const points = new THREE.Points(geometry, material);
  kit.group.add(points);

  const attribute = geometry.attributes.position as THREE.BufferAttribute;
  return {
    update: (elapsed) => {
      for (let i = 0; i < RAIN_COUNT; i++) {
        attribute.setY(i, RAIN_TOP - ((seeds[i] + elapsed * speeds[i]) % RAIN_TOP));
      }
      attribute.needsUpdate = true;
    },
  };
}

export function buildEnvironment(setting: SceneSetting): EnvironmentBuild {
  const kit = new Kit();
  const lights = lightsFor(setting);
  const rainy = /rain|storm|drizzle/.test(setting.weather.toLowerCase());

  if (setting.indoor) {
    const floor = kit.material({ color: 0x6b4a2c, roughness: 0.8 });
    const wall = kit.material({ color: 0xd9cdb4, roughness: 0.95 });
    const trim = kit.material({ color: 0x4a3a28, roughness: 0.85 });
    const width = ROOM_HALF_X * 2;
    const depth = ROOM_FRONT_Z - ROOM_BACK_Z;
    const centerZ = (ROOM_FRONT_Z + ROOM_BACK_Z) / 2;
    kit.box(floor, 0, -0.06, centerZ, width, 0.12, depth);
    kit.box(wall, 0, WALL_HEIGHT / 2, ROOM_BACK_Z, width, WALL_HEIGHT, 0.25);
    for (const x of [-ROOM_HALF_X, ROOM_HALF_X]) {
      kit.box(wall, x, WALL_HEIGHT / 2, centerZ, 0.25, WALL_HEIGHT, depth);
    }
    kit.box(trim, 0, 0.12, ROOM_BACK_Z + 0.14, width, 0.24, 0.06);
    // Pavement outside the room so rain doesn't fall on the void.
    const pavement = kit.material({ color: 0x33363d, roughness: 1 });
    const outsideGeometry = kit.track(
      new THREE.CircleGeometry(15, 48).rotateX(-Math.PI / 2),
    );
    const outside = new THREE.Mesh(outsideGeometry, pavement);
    outside.position.y = -0.14;
    outside.receiveShadow = true;
    kit.group.add(outside);
  } else {
    const ground = kit.material({
      color: groundColorFor(setting),
      roughness: 0.95,
    });
    const groundGeometry = kit.track(
      new THREE.CircleGeometry(15, 64).rotateX(-Math.PI / 2),
    );
    const groundMesh = new THREE.Mesh(groundGeometry, ground);
    groundMesh.receiveShadow = true;
    kit.group.add(groundMesh);
  }

  const rain = rainy ? buildRain(kit, setting.indoor) : null;
  const { group, dispose } = kit.build();
  return {
    group,
    lights,
    update: (elapsed) => rain?.update(elapsed),
    dispose,
  };
}
