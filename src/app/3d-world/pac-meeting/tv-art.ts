// 2D canvas drawing for the TV room: the animated TV program, the standby
// screen, and three generated movie posters.

const TV_W = 512;
const TV_H = 256;

export function drawTvStandby(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#08080c";
  ctx.fillRect(0, 0, TV_W, TV_H);
  ctx.fillStyle = "#1b2a36";
  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("NO SIGNAL", TV_W / 2, TV_H / 2);
}

// A little crewmate chase cartoon: color bars, a bouncing bean hero and a
// pursuer, plus film-style vignette bars.
export function drawTvFrame(ctx: CanvasRenderingContext2D, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, TV_H);
  sky.addColorStop(0, "#0d1b3d");
  sky.addColorStop(1, "#26104a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, TV_W, TV_H);

  // Parallax stars.
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 40; i++) {
    const x = (i * 137 - time * (20 + (i % 3) * 14)) % TV_W;
    ctx.globalAlpha = 0.3 + ((i * 7) % 10) / 14;
    ctx.fillRect(x < 0 ? x + TV_W : x, (i * 61) % TV_H, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Ground strip.
  ctx.fillStyle = "#101726";
  ctx.fillRect(0, TV_H - 46, TV_W, 46);

  const drawBean = (x: number, y: number, color: string, flip: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flip, 1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#bfe6f2";
    ctx.beginPath();
    ctx.ellipse(10, -10, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Hero flees right-to-left; pursuer trails with a wobble.
  const heroX = TV_W - ((time * 90) % (TV_W + 160)) + 80;
  const heroY = TV_H - 76 - Math.abs(Math.sin(time * 6)) * 26;
  const chaserX = heroX + 110 + Math.sin(time * 3) * 18;
  const chaserY = TV_H - 76 - Math.abs(Math.sin(time * 6 + 1.2)) * 22;
  drawBean(heroX, heroY, "#3ec43e", -1);
  drawBean(chaserX, chaserY, "#c51111", -1);

  // Letterbox bars + flicker line for a broadcast feel.
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, TV_W, 14);
  ctx.fillRect(0, TV_H - 14, TV_W, 14);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(0, (time * 140) % TV_H, TV_W, 3);
}

const POSTERS = [
  {
    bg: ["#1a0505", "#420f0f"],
    accent: "#c51111",
    title: "RED CAPSULE",
    tagline: "HE NEVER LEFT",
  },
  {
    bg: ["#04101f", "#0d2c4a"],
    accent: "#e6c300",
    title: "THE IMPOSTOR",
    tagline: "TRUST NO BEAN",
  },
  {
    bg: ["#2a1804", "#5a3408"],
    accent: "#ffd23f",
    title: "FIZZY",
    tagline: "ONE LAST POUR",
  },
] as const;

export function drawPoster(ctx: CanvasRenderingContext2D, variant: number) {
  const { bg, accent, title, tagline } = POSTERS[variant % POSTERS.length];
  const w = 128;
  const h = 176;
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, bg[0]);
  gradient.addColorStop(1, bg[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Hero graphic: a glowing bean silhouette under a spotlight.
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 34, h);
  ctx.lineTo(w / 2 - 8, 28);
  ctx.lineTo(w / 2 + 8, 28);
  ctx.lineTo(w / 2 + 34, h);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(w / 2, 96, 20, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#cfeaf4";
  ctx.beginPath();
  ctx.ellipse(w / 2 + 8, 86, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#f5efe0";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(title, w / 2, 24);
  ctx.fillStyle = accent;
  ctx.font = "8px monospace";
  ctx.fillText(tagline, w / 2, 152);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, w - 10, h - 10);
}
