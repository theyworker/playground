import * as THREE from "three";
import { Kit, RoomBuild } from "./mansion-kit";
import { buildMansionKitchen } from "./mansion-kitchen";
import { buildGym } from "./gym";
import { buildLibraryRoom } from "./library-room";
import { buildBarRoom } from "./bar-room";
import { buildPoolHall } from "./pool-hall";
import { buildTennis } from "./tennis";

const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.3;

// The mansion expansion: a west wing (library north, gym south) over
// x -30..-14 / z -10..10, a north wing (bar west, pool hall east) over
// x -30..14 / z -26..-10, the facade dressing, and the tennis court.
// Room interiors live in their own modules; this builds the shell and
// merges everything.
export function buildMansion(): RoomBuild {
  const kit = new Kit();

  const wallMaterial = kit.material({ color: 0xd8d0c0, roughness: 0.85 });
  const trimMaterial = kit.material({ color: 0xe8e2d4, roughness: 0.7 });
  const oakMaterial = kit.material({ color: 0xb59a72, roughness: 0.65 });
  const stoneMaterial = kit.material({ color: 0xb8b4a8, roughness: 0.85 });
  const hedgeMaterial = kit.material({ color: 0x3a5a2e, roughness: 1 });

  const wall = (x: number, z: number, w: number, d: number) =>
    kit.box(wallMaterial, x, WALL_HEIGHT / 2, z, w, WALL_HEIGHT, d, true);

  // --- Wing floors ---
  const westFloorGeometry = kit.track(
    new THREE.PlaneGeometry(15.7, 19.7).rotateX(-Math.PI / 2),
  );
  const westFloor = new THREE.Mesh(westFloorGeometry, oakMaterial);
  westFloor.position.set(-22, 0.008, 0);
  westFloor.receiveShadow = true;
  kit.group.add(westFloor);
  const northFloorGeometry = kit.track(
    new THREE.PlaneGeometry(43.7, 15.7).rotateX(-Math.PI / 2),
  );
  const northFloor = new THREE.Mesh(northFloorGeometry, oakMaterial);
  northFloor.position.set(-8, 0.006, -18);
  northFloor.receiveShadow = true;
  kit.group.add(northFloor);

  // --- West wing shell ---
  // North wall (z=-10) with the library-to-bar door (gap x -26..-24.5).
  wall(-28, -10, 4, WALL_THICKNESS);
  wall(-19.25, -10, 10.5, WALL_THICKNESS);
  wall(-22, 10, 16, WALL_THICKNESS); // south
  // Outer west wall (x=-30) with the gym-to-tennis door (gap z 5..6.5).
  wall(-30, -10.5, WALL_THICKNESS, 31);
  wall(-30, 8.25, WALL_THICKNESS, 3.5);
  // Library/gym divider (z=0) with door (gap x -23..-21.5).
  wall(-26.5, 0, 7, WALL_THICKNESS);
  wall(-17.75, 0, 7.5, WALL_THICKNESS);

  // --- North wing shell ---
  wall(-8, -26, 44, WALL_THICKNESS); // outer north
  wall(14, -18, WALL_THICKNESS, 16); // outer east
  // Bar/pool divider (x=-8) with door (gap z -13..-11.5), placed clear
  // of the back-bar shelving that runs along the divider's south span.
  wall(-8, -19.5, WALL_THICKNESS, 13);
  wall(-8, -10.75, WALL_THICKNESS, 1.5);

  // --- Facade: cornice, pilasters, hedges, fountain ---
  kit.box(trimMaterial, -22, 2.5, 10, 16.4, 0.22, 0.5);
  kit.box(trimMaterial, 0, 2.5, 10, 28.4, 0.22, 0.5);
  for (const px of [-29, -25, -21, -17, -13.5, -9, -5, -1, 6, 10, 13.5]) {
    const pilaster = kit.box(trimMaterial, px, 1.2, 10.25, 0.45, 2.4, 0.25);
    pilaster.castShadow = false;
    kit.box(trimMaterial, px, 2.32, 10.28, 0.6, 0.14, 0.3);
  }
  for (const hx of [-27, -23, -19, -15, -11, -7, -3, 8.2, 12]) {
    kit.box(hedgeMaterial, hx, 0.35, 10.65, 1.5, 0.7, 0.5, true);
  }
  // Fountain on the front lawn.
  const basinGeometry = kit.track(new THREE.CylinderGeometry(1.6, 1.7, 0.4, 24));
  const fountainBasin = new THREE.Mesh(basinGeometry, stoneMaterial);
  fountainBasin.position.set(-6, 0.2, 14);
  fountainBasin.castShadow = true;
  kit.group.add(fountainBasin);
  const fountainWaterGeometry = kit.track(new THREE.CircleGeometry(1.45, 24).rotateX(-Math.PI / 2));
  const fountainWater = kit.material({
    color: 0x3aa8c9,
    emissive: 0x1a6886,
    emissiveIntensity: 0.3,
    roughness: 0.1,
  });
  const waterDisc = new THREE.Mesh(fountainWaterGeometry, fountainWater);
  waterDisc.position.set(-6, 0.42, 14);
  kit.group.add(waterDisc);
  const pedestalGeometry = kit.track(new THREE.CylinderGeometry(0.18, 0.28, 0.8, 14));
  kit.mesh(pedestalGeometry, stoneMaterial, -6, 0.8, 14);
  const bowlGeometry = kit.track(new THREE.CylinderGeometry(0.55, 0.15, 0.2, 16));
  kit.mesh(bowlGeometry, stoneMaterial, -6, 1.25, 14);
  kit.solid(-7.8, -4.2, 12.2, 15.8);

  // --- Merge the rooms ---
  const rooms: RoomBuild[] = [
    buildMansionKitchen(),
    buildGym(),
    buildLibraryRoom(),
    buildBarRoom(),
    buildPoolHall(),
    buildTennis(),
  ];
  const result = kit.build();
  for (const room of rooms) {
    result.group.add(room.group);
    result.colliders.push(...room.colliders);
  }
  const baseDispose = result.dispose;
  return {
    ...result,
    dispose: () => {
      baseDispose();
      rooms.forEach((room) => room.dispose());
    },
  };
}
