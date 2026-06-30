// Static content + scene generators for Kadé Air, ported from the Drop design.

export type Review = { t: string; by: string };

export type Dish = {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  price: number;
  kcal: number;
  rating: number;
  c1: string;
  c2: string;
  c3: string;
  reviews: Review[];
};

export const dishes: Dish[] = [
  { id: "kottu", name: "Chicken Kottu", shortName: "kottu", tag: "Chopped, clattered, never delivered", price: 2400, kcal: 1950, rating: 4.9, c1: "#f2a65a", c2: "#d97a3e", c3: "#7fb389",
    reviews: [ { t: "Best kottu I never had. The clatter alone filled me up.", by: "Dilani · Nugegoda" }, { t: "Watched the drone leave empty and felt strangely complete.", by: "Roshan · Wellawatte" } ] },
  { id: "hoppers", name: "Egg Hoppers", shortName: "hoppers", tag: "Crisp edges, soft middle, zero arrival", price: 900, kcal: 540, rating: 4.8, c1: "#f6d58a", c2: "#e0a14e", c3: "#e0789a",
    reviews: [ { t: "Crispy edges I could almost taste. 11/10 would not receive again.", by: "Amaya · Dehiwala" }, { t: "The drone hovered so gently. My appetite said thank you.", by: "Suresh · Kotahena" } ] },
  { id: "lamprais", name: "Lamprais", shortName: "lamprais", tag: "Wrapped in a leaf you will never open", price: 2800, kcal: 1400, rating: 4.9, c1: "#c99a5a", c2: "#8a6a3a", c3: "#7fb389",
    reviews: [ { t: "Wrapped in a banana leaf I never unwrapped. Pure bliss.", by: "Nimal · Mount Lavinia" }, { t: "Saved the calories, kept the longing. Perfect dinner.", by: "Fathima · Colombo 4" } ] },
  { id: "biryani", name: "Chicken Biryani", shortName: "biryani", tag: "Saffron you can smell from the sky", price: 2600, kcal: 1600, rating: 4.7, c1: "#f2b85a", c2: "#cf7a36", c3: "#e0789a",
    reviews: [ { t: "Smelled the saffron from the skyline. That was enough.", by: "Imran · Slave Island" }, { t: "No biryani arrived. My wallet purred.", by: "Tharindu · Rajagiriya" } ] },
  { id: "kiribath", name: "Kiribath", shortName: "milk rice", tag: "Milk rice, cut in diamonds, undelivered", price: 750, kcal: 480, rating: 4.8, c1: "#f4ead9", c2: "#cdbfa6", c3: "#7fb389",
    reviews: [ { t: "Cut into diamonds I never ate. Auspiciously empty.", by: "Kumari · Maharagama" }, { t: "The drone wobbled like it was full. It wasn't.", by: "Sanjay · Borella" } ] },
  { id: "string", name: "String Hoppers", shortName: "string hoppers", tag: "Ten little nests of nothing", price: 1100, kcal: 600, rating: 4.6, c1: "#f0e4cf", c2: "#c9b48e", c3: "#e0789a",
    reviews: [ { t: "Ten little nests of nothing. I slept like a baby.", by: "Priya · Kohuwala" }, { t: "Watched it thread past the Lotus Tower. Forgot I was hungry.", by: "Lahiru · Pita Kotte" } ] },
];

export const presenceLines: string[] = [
  "37 people in Colombo are also not-ordering kottu right now.",
  "12 hoppers are not being delivered across Dehiwala tonight.",
  "Someone in Nugegoda just didn't order lamprais. Again.",
  "5 drones are idling over Bambalapitiya, carrying nothing.",
  "“Almost” is trending in Wellawatte this evening.",
  "89 biryanis remain happily uncooked across Colombo.",
];

export const fmt = (n: number) =>
  "Rs. " + Math.round(n).toLocaleString("en-US");

export type Building = { x: number; w: number; h: number; c: string };
export type Star = { x: number; y: number; s: number; t: number; d: number };
export type Cloud = { x: number; y: number; w: number; h: number; dur: number };
export type Confetti = {
  left: number; color: string; size: number; r: number;
  dx: number; dur: number; delay: number;
};
export type Scene = {
  stars: Star[]; clouds: Cloud[];
  farB: Building[]; midB: Building[]; nearB: Building[];
  confettiPieces: Confetti[];
};

function mkB(W: number, n: number, minH: number, maxH: number, cols: string[]): Building[] {
  const a: Building[] = [];
  let x = -20;
  for (let i = 0; i < n; i++) {
    const w = 30 + Math.random() * 70;
    const h = minH + Math.random() * (maxH - minH);
    a.push({ x: Math.round(x), w: Math.round(w), h: Math.round(h), c: cols[i % cols.length] });
    x += w + 28 + Math.random() * 60;
    if (x > W) break;
  }
  return a;
}

export function generateScene(): Scene {
  const stars: Star[] = Array.from({ length: 38 }, () => ({
    x: +(Math.random() * 100).toFixed(1), y: +(Math.random() * 52).toFixed(1),
    s: +(Math.random() * 1.8 + 1).toFixed(1), t: +(Math.random() * 2 + 2).toFixed(1),
    d: +(Math.random() * 3).toFixed(1),
  }));
  const clouds: Cloud[] = [
    { x: 6, y: 20, w: 120, h: 26, dur: 9 }, { x: 58, y: 12, w: 90, h: 20, dur: 11 },
    { x: 34, y: 32, w: 140, h: 30, dur: 13 }, { x: 74, y: 26, w: 80, h: 18, dur: 10 },
  ];
  const farB = mkB(1000, 11, 40, 130, ["#241c3c", "#2b2146", "#1e1838"]);
  const midB = mkB(2000, 16, 70, 220, ["#3a2c5a", "#322750", "#42345e", "#2e2348"]);
  const nearB = mkB(2800, 13, 70, 170, ["#140e26"]);
  const cols = ["#f2a65a", "#e0789a", "#7fb389", "#f4ead9", "#9a7fd1", "#f7b96a"];
  const confettiPieces: Confetti[] = Array.from({ length: 90 }, () => ({
    left: +(Math.random() * 100).toFixed(1),
    color: cols[Math.floor(Math.random() * cols.length)],
    size: Math.round(6 + Math.random() * 7),
    r: Math.random() < 0.5 ? 5 : 1,
    dx: Math.round((Math.random() - 0.5) * 180),
    dur: +(1.6 + Math.random() * 1.4).toFixed(2),
    delay: +(Math.random() * 0.4).toFixed(2),
  }));
  return { stars, clouds, farB, midB, nearB, confettiPieces };
}
