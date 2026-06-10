// Canvas art for Devind's Place: signboard, the anti-technology poster,
// and the TikTok room door sign.

export function drawDevindSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0d1a12";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#7fd49a";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#bfe8cc";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("DEVIND'S PLACE", 128, 40);
}

export function drawTechPoster(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#f4f1e8";
  ctx.fillRect(0, 0, 192, 128);
  ctx.strokeStyle = "#b3271e";
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 180, 116);
  // Prohibition sign over a phone glyph.
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(86, 28, 20, 34);
  ctx.strokeStyle = "#b3271e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(96, 45, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(78, 27);
  ctx.lineTo(114, 63);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#22221e";
  ctx.font = "bold 15px serif";
  ctx.fillText("TECHNOLOGY IS", 96, 92);
  ctx.fillText("PROHIBITED.", 96, 110);
}

export function drawTiktokSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#101014";
  ctx.fillRect(0, 0, 192, 48);
  // TikTok-ish offset glyph.
  ctx.font = "bold 22px sans-serif";
  ctx.fillStyle = "#25f4ee";
  ctx.fillText("♪", 12, 33);
  ctx.fillStyle = "#fe2c55";
  ctx.fillText("♪", 15, 35);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("♪", 13, 34);
  ctx.textAlign = "center";
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#f5f5f5";
  ctx.fillText("TIKTOK STARS ONLY", 105, 31);
}
