// Canvas art for the lake: yacht name plate, statue plaque, and the
// Australian flag flown at the stern.

export function drawNamePlate(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#10243f";
  ctx.fillRect(0, 0, 256, 48);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.strokeRect(3, 3, 250, 42);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0e6d2";
  ctx.font = "bold 24px serif";
  ctx.fillText("TYCOON YATCH", 128, 32);
}

export function drawStatuePlaque(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#6e5a2e";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0e6c8";
  ctx.font = "bold 21px serif";
  ctx.fillText("Statue of the Tycoon", 128, 40);
}

function star(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  points: number,
) {
  const inner = outer * 0.45;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawAustralianFlag(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#012169";
  ctx.fillRect(0, 0, 256, 128);

  // Union Jack canton (simplified), upper hoist quarter.
  const line = (
    x1: number, y1: number, x2: number, y2: number,
    color: string, width: number,
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  line(0, 0, 128, 64, "#ffffff", 13);
  line(128, 0, 0, 64, "#ffffff", 13);
  line(0, 0, 128, 64, "#C8102E", 5);
  line(128, 0, 0, 64, "#C8102E", 5);
  line(64, 0, 64, 64, "#ffffff", 21);
  line(0, 32, 128, 32, "#ffffff", 21);
  line(64, 0, 64, 64, "#C8102E", 11);
  line(0, 32, 128, 32, "#C8102E", 11);

  // Commonwealth Star below the canton.
  star(ctx, 64, 96, 17, 7);
  // Southern Cross on the fly half.
  star(ctx, 196, 16, 8, 7);
  star(ctx, 196, 110, 8, 7);
  star(ctx, 162, 50, 8, 7);
  star(ctx, 232, 42, 8, 7);
  star(ctx, 206, 60, 4.5, 5);
}
