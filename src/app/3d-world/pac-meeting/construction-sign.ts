import * as THREE from "three";
import type { Collider } from "./house";

function drawConstructionSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f2c10f";
  ctx.fillRect(0, 0, 256, 128);
  // Hazard stripes top and bottom.
  ctx.fillStyle = "#1c1c1c";
  for (let x = -32; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 16, 0);
    ctx.lineTo(x + 32, 16);
    ctx.lineTo(x + 16, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, 112);
    ctx.lineTo(x + 16, 112);
    ctx.lineTo(x + 32, 128);
    ctx.lineTo(x + 16, 128);
    ctx.fill();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1c1c";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("STILL UNDER", 128, 58);
  ctx.fillText("CONSTRUCTION", 128, 92);
}

// A freestanding warning board on two wooden posts.
export function buildConstructionSign(
  x: number,
  z: number,
  rotationY: number,
): { group: THREE.Group; collider: Collider; dispose: () => void } {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const postGeometry = new THREE.BoxGeometry(0.08, 1.15, 0.08);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x5d4023 });
  for (const px of [-0.55, 0.55]) {
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(px, 0.575, 0);
    post.castShadow = true;
    group.add(post);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  drawConstructionSign(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  const boardMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });
  const boardGeometry = new THREE.PlaneGeometry(1.45, 0.72);
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.set(0, 0.92, 0.045);
  board.rotation.z = -0.02;
  board.castShadow = true;
  group.add(board);

  // The board's long axis follows the rotation.
  const sideways = Math.abs(Math.sin(rotationY)) > 0.5;
  const halfW = sideways ? 0.15 : 0.55;
  const halfD = sideways ? 0.55 : 0.15;
  return {
    group,
    collider: { minX: x - halfW, maxX: x + halfW, minZ: z - halfD, maxZ: z + halfD },
    dispose: () => {
      postGeometry.dispose();
      postMaterial.dispose();
      texture.dispose();
      boardMaterial.dispose();
      boardGeometry.dispose();
    },
  };
}
