// Canvas art for the WADX CELPIP academy: the signboard and the
// instruction posters pasted around the test center.

export function drawWadxSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#0d1b2e";
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = "#e8633a";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2f5f8";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("WADX", 80, 41);
  ctx.fillStyle = "#e8633a";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("CELPIP PREPARATION", 178, 32);
  ctx.fillText("ACADEMY · TEST CENTER", 178, 47);
}

export type Poster = { title: string; lines: string[]; accent: string };

// CELPIP instructions, one poster each.
export const POSTERS: Poster[] = [
  {
    title: "CELPIP LISTENING",
    lines: ["47-55 MINUTES · 6 PARTS", "ANSWER AS YOU LISTEN", "AUDIO PLAYS ONLY ONCE"],
    accent: "#3a7ab5",
  },
  {
    title: "CELPIP READING",
    lines: ["55-60 MINUTES · 4 PARTS", "READ CORRESPONDENCE & DIAGRAMS", "MANAGE YOUR TIME PER PART"],
    accent: "#3a8f5a",
  },
  {
    title: "CELPIP WRITING",
    lines: ["53-60 MINUTES · 2 TASKS", "TASK 1: WRITE AN EMAIL", "TASK 2: SURVEY RESPONSE"],
    accent: "#b5743a",
  },
  {
    title: "CELPIP SPEAKING",
    lines: ["15-20 MINUTES · 8 TASKS", "SPEAK CLEARLY INTO THE MIC", "PREP TIME BEFORE EACH TASK"],
    accent: "#9a4a8f",
  },
  {
    title: "TEST DAY RULES",
    lines: ["VALID PHOTO ID REQUIRED", "ARRIVE 30 MINUTES EARLY", "NO PERSONAL ITEMS AT DESK"],
    accent: "#b53a3a",
  },
  {
    title: "NO PHONES",
    lines: ["BEYOND THIS POINT", "LOCKERS AT RECEPTION", "VIOLATION VOIDS YOUR TEST"],
    accent: "#b53a3a",
  },
  {
    title: "QUIET PLEASE",
    lines: ["TEST IN PROGRESS", "RAISE YOUR HAND FOR HELP", "DO NOT LEAVE YOUR SEAT"],
    accent: "#3a7ab5",
  },
  {
    title: "CELPIP SCORES",
    lines: ["LEVELS 1-12 PER SKILL", "RESULTS IN 4-5 DAYS", "ONLINE ACCOUNT REQUIRED"],
    accent: "#3a8f5a",
  },
  {
    title: "COMPUTER DELIVERED",
    lines: ["ALL SECTIONS ON SCREEN", "HEADSETS PROVIDED", "SPELLCHECK IS DISABLED"],
    accent: "#b5743a",
  },
];

export function drawPoster(ctx: CanvasRenderingContext2D, poster: Poster) {
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, 0, 192, 128);
  ctx.fillStyle = poster.accent;
  ctx.fillRect(0, 0, 192, 30);
  ctx.strokeStyle = poster.accent;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 188, 124);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f1ea";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText(poster.title, 96, 21);
  ctx.fillStyle = "#2a2620";
  ctx.font = "10px sans-serif";
  poster.lines.forEach((line, i) => {
    ctx.fillText(line, 96, 52 + i * 22);
  });
}
