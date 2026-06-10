// Canvas art for Cmyna Crib: signboard, the apple poster, and framed
// Drake quotes.

export function drawCmynaSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0a120a";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#46d35e";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#6df285";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("CMYNA CRIB", 128, 42);
}

export function drawApplePoster(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f7f3e6";
  ctx.fillRect(0, 0, 192, 128);
  ctx.strokeStyle = "#27632a";
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 182, 118);
  // Apple with leaf.
  ctx.fillStyle = "#c8332b";
  ctx.beginPath();
  ctx.arc(88, 48, 22, 0, Math.PI * 2);
  ctx.arc(104, 48, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a3a1e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(96, 28);
  ctx.quadraticCurveTo(98, 18, 104, 14);
  ctx.stroke();
  ctx.fillStyle = "#3f8f3a";
  ctx.beginPath();
  ctx.ellipse(108, 20, 10, 5, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#27632a";
  ctx.font = "bold 13px serif";
  ctx.fillText("AN APPLE A DAY", 96, 94);
  ctx.fillText("KEEPS THE DOCTOR AWAY.", 96, 112);
}

const DRAKE_QUOTES: string[][] = [
  ["“STARTED FROM THE", "BOTTOM NOW", "WE'RE HERE”"],
  ["“YOU ONLY LIVE ONCE.", "THAT'S THE MOTTO.", "YOLO.”"],
  ["“KNOW YOURSELF,", "KNOW YOUR WORTH”"],
];

export function drawDrakeQuote(ctx: CanvasRenderingContext2D, index: number) {
  const lines = DRAKE_QUOTES[index % DRAKE_QUOTES.length];
  ctx.fillStyle = "#16120e";
  ctx.fillRect(0, 0, 192, 128);
  ctx.strokeStyle = "#c9962e";
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 180, 116);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f0e6d2";
  ctx.font = "bold 13px serif";
  const startY = 64 - (lines.length - 1) * 10;
  lines.forEach((line, i) => ctx.fillText(line, 96, startY + i * 20));
  ctx.fillStyle = "#c9962e";
  ctx.font = "italic 12px serif";
  ctx.fillText("— DRAKE", 96, 112);
}
