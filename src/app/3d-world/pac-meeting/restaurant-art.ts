// Canvas art for Dehan's Korean BBQ: the signboard, the two flags, and the
// pixelated boss portrait.

// 16x20 pixel map: h hair, f face, e eye, m mouth, n neck, s suit,
// w shirt, t tie, . background.
const BOSS_PIXELS = [
  "................",
  "................",
  "....hhhhhhhh....",
  "...hhhhhhhhhh...",
  "...hhhhhhhhhh...",
  "...hffffffffh...",
  "...ffffffffff...",
  "...ffeffffeff...",
  "...ffffffffff...",
  "...ffffmmffff...",
  "...ffffffffff...",
  "....fnnnnnnf....",
  "..sssswwwwssss..",
  ".ssssswttwsssss.",
  "sssssswttwssssss",
  "sssssswttwssssss",
  "sssssswttwssssss",
  "sssssswwwwssssss",
  "ssssssssssssssss",
  "ssssssssssssssss",
];

const BOSS_COLORS: Record<string, string> = {
  ".": "#c8d4da",
  h: "#3a2a1a",
  f: "#e0b186",
  e: "#26201a",
  m: "#a8704e",
  n: "#d4a47a",
  s: "#28344e",
  w: "#f0f0ea",
  t: "#a8242c",
};

export function drawBossPortrait(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < BOSS_PIXELS.length; y++) {
    for (let x = 0; x < BOSS_PIXELS[y].length; x++) {
      ctx.fillStyle = BOSS_COLORS[BOSS_PIXELS[y][x]];
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

export function drawBossCaption(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#1c0f08";
  ctx.fillRect(0, 0, 256, 48);
  ctx.strokeStyle = "#e8a33d";
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, 250, 42);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 19px serif";
  ctx.fillText("Best Boss in the world", 128, 31);
}

export function drawSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#1c0f08";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#e8a33d";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5c542";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("DEHAN'S KOREAN BBQ", 128, 30);
  ctx.fillStyle = "#d97f4a";
  ctx.font = "12px sans-serif";
  ctx.fillText("라면 · 코리안 바베큐 · කොත්තු", 128, 50);
}

// Simplified Sri Lankan flag: gold border, green/orange hoist stripes,
// maroon field with a stylized gold lion and four bo leaves.
export function drawSriLankaFlag(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f5b50a";
  ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = "#006a44";
  ctx.fillRect(8, 8, 14, 64);
  ctx.fillStyle = "#ef7d00";
  ctx.fillRect(24, 8, 14, 64);
  ctx.fillStyle = "#8d153a";
  ctx.fillRect(44, 8, 76, 64);
  // Stylized lion (abstract): body, head, raised sword arm, tail.
  ctx.fillStyle = "#f5b50a";
  ctx.fillRect(64, 36, 30, 16); // body
  ctx.fillRect(88, 26, 12, 14); // head
  ctx.fillRect(98, 18, 3, 22); // sword
  ctx.beginPath();
  ctx.moveTo(64, 38);
  ctx.quadraticCurveTo(54, 30, 58, 22);
  ctx.lineTo(62, 24);
  ctx.quadraticCurveTo(60, 32, 66, 36);
  ctx.fill(); // tail
  ctx.fillRect(66, 52, 4, 8);
  ctx.fillRect(74, 52, 4, 8);
  ctx.fillRect(82, 52, 4, 8); // legs
  // Bo leaves in the corners.
  for (const [lx, ly] of [[48, 12], [114, 12], [48, 66], [114, 66]]) {
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Simplified South Korean flag: white field, taeguk, four corner trigrams.
export function drawKoreaFlag(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(0, 0, 128, 80);
  const cx = 64;
  const cy = 40;
  ctx.fillStyle = "#cd2e3a";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#0047a0";
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = "#cd2e3a";
  ctx.beginPath();
  ctx.arc(cx - 8, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0047a0";
  ctx.beginPath();
  ctx.arc(cx + 8, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  // Trigram bar stacks in the four corners.
  ctx.fillStyle = "#1a1a1a";
  for (const [tx, ty] of [[18, 10], [94, 10], [18, 58], [94, 58]]) {
    for (let bar = 0; bar < 3; bar++) {
      ctx.fillRect(tx, ty + bar * 5, 16, 3);
    }
  }
}
