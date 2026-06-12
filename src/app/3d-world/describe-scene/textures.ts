import * as THREE from "three";
import { hash01 } from "./compile";

// Procedural CanvasTexture factory: every drawn surface (signage, faces,
// grain, speckle) is rendered once into a cached texture + material pair
// keyed by content, so scene switches reuse instead of regenerate and
// nothing leaks. All textures are sRGB, mipmapped, and anisotropic so
// text stays crisp at grazing angles. No image files anywhere.

let maxAnisotropy = 4;
const textures = new Map<string, THREE.CanvasTexture>();
const materials = new Map<string, THREE.MeshStandardMaterial>();

/** Stage setup: pass renderer.capabilities.getMaxAnisotropy(). */
export function setTextureAnisotropy(value: number): void {
  maxAnisotropy = Math.min(value, 8);
  textures.forEach((texture) => {
    texture.anisotropy = maxAnisotropy;
    texture.needsUpdate = true;
  });
}

/** Stage teardown only — scene switches keep the cache warm on purpose. */
export function disposeProceduralTextures(): void {
  materials.forEach((material) => material.dispose());
  materials.clear();
  textures.forEach((texture) => texture.dispose());
  textures.clear();
}

/** Deterministic PRNG so seeded noise (grain, speckle) never flickers
 *  between builds of the same scene. */
export function rng(seed: string): () => number {
  let a = Math.floor(hash01(seed) * 0xffffffff);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Shrinks the font size until the text fits maxWidth. `font` must contain
 *  a "{size}" placeholder, e.g. "bold {size}px system-ui". */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
  startSize: number,
): void {
  let size = startSize;
  do {
    ctx.font = font.replace("{size}", String(size));
    size -= 2;
  } while (size > 10 && ctx.measureText(text).width > maxWidth);
}

export function proceduralTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  let texture = textures.get(key);
  if (!texture) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!, width, height);
    texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = maxAnisotropy;
    if (repeat) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat[0], repeat[1]);
    }
    textures.set(key, texture);
  }
  return texture;
}

export interface SurfaceOptions {
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  repeat?: [number, number];
}

/** Cached MeshStandardMaterial wrapping a procedural texture. */
export function surfaceMaterial(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  options: SurfaceOptions = {},
): THREE.MeshStandardMaterial {
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      map: proceduralTexture(key, width, height, draw, options.repeat),
      roughness: options.roughness ?? 0.85,
      metalness: options.metalness ?? 0,
      ...(options.transparent && { transparent: true }),
    });
    materials.set(key, material);
  }
  return material;
}

const hex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

// ---------------------------------------------------------------------------
// Domain surfaces
// ---------------------------------------------------------------------------

export type Mood = "calm" | "smile" | "open";

/** A simple face — eyes, brows, a mouth with a hint of expression — drawn
 *  onto the front-center UV band of a sphere head. */
export function faceMaterial(skin: number, mood: Mood): THREE.MeshStandardMaterial {
  return surfaceMaterial(
    `face:${skin}:${mood}`,
    256, 128,
    (ctx, w, h) => {
      ctx.fillStyle = hex(skin);
      ctx.fillRect(0, 0, w, h);
      // SphereGeometry puts +z (the way figures face) at u=0.25.
      const cx = w * 0.25;
      ctx.fillStyle = "#2b241f";
      for (const side of [-1, 1]) {
        const ex = cx + side * 13;
        ctx.beginPath();
        ctx.ellipse(ex, 56, 4.5, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#2b241f";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const tilt = mood === "open" ? -2 : 1.5;
        ctx.moveTo(ex - 6, 46 + side * 0); // brows
        ctx.lineTo(ex + 6, 46 - tilt);
        ctx.stroke();
      }
      ctx.strokeStyle = "#4a342a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (mood === "smile") {
        ctx.arc(cx, 74, 8, 0.25 * Math.PI, 0.75 * Math.PI);
      } else if (mood === "open") {
        ctx.ellipse(cx, 80, 4, 5.5, 0, 0, Math.PI * 2);
      } else {
        ctx.moveTo(cx - 6, 80);
        ctx.lineTo(cx + 6, 80);
      }
      ctx.stroke();
    },
    { roughness: 0.65 },
  );
}

/** Wood grain: long streaks in darker and lighter shades of the tint. */
export function woodMaterial(tint: number, roughness = 0.75): THREE.MeshStandardMaterial {
  return surfaceMaterial(
    `wood:${tint}:${roughness}`,
    256, 256,
    (ctx, w, h) => {
      const base = new THREE.Color(tint);
      ctx.fillStyle = hex(tint);
      ctx.fillRect(0, 0, w, h);
      const random = rng(`wood:${tint}`);
      for (let i = 0; i < 42; i++) {
        const shadeFactor = 0.78 + random() * 0.5;
        ctx.strokeStyle = hex(
          base.clone().multiplyScalar(shadeFactor).getHex(),
        );
        ctx.lineWidth = 1 + random() * 2.5;
        ctx.globalAlpha = 0.35 + random() * 0.3;
        const y = random() * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.3, y + (random() - 0.5) * 14, w * 0.7, y + (random() - 0.5) * 14, w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    { roughness },
  );
}

/** Foliage speckle: leafy dapple in lighter/darker greens over the tint. */
export function foliageMaterial(tint: number): THREE.MeshStandardMaterial {
  return surfaceMaterial(
    `leaf:${tint}`,
    128, 128,
    (ctx, w, h) => {
      const base = new THREE.Color(tint);
      ctx.fillStyle = hex(tint);
      ctx.fillRect(0, 0, w, h);
      const random = rng(`leaf:${tint}`);
      for (let i = 0; i < 240; i++) {
        ctx.fillStyle = hex(
          base.clone().multiplyScalar(0.7 + random() * 0.75).getHex(),
        );
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(
          random() * w, random() * h,
          1.5 + random() * 3, 1 + random() * 2,
          random() * Math.PI, 0, Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    { roughness: 0.9, repeat: [2, 2] },
  );
}

/** Simple clothing stripes over the base tint. */
export function stripedMaterial(tint: number): THREE.MeshStandardMaterial {
  return surfaceMaterial(
    `stripes:${tint}`,
    128, 128,
    (ctx, w, h) => {
      const base = new THREE.Color(tint);
      ctx.fillStyle = hex(tint);
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = hex(base.clone().multiplyScalar(0.72).getHex());
      for (let y = 6; y < h; y += 18) {
        ctx.fillRect(0, y, w, 7);
      }
    },
    { roughness: 0.85 },
  );
}

/** Vertical gradient sky for scene.background; an optional glow color
 *  blends a warm band into the horizon (golden hour). */
export function skyTexture(
  top: number,
  bottom: number,
  horizonGlow?: number,
): THREE.CanvasTexture {
  return proceduralTexture(
    `sky:${top}:${bottom}:${horizonGlow ?? "none"}`,
    64, 512,
    (ctx, w, h) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, hex(top));
      gradient.addColorStop(1, hex(bottom));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      if (horizonGlow !== undefined) {
        const glow = new THREE.Color(horizonGlow);
        const r = Math.round(glow.r * 255);
        const g = Math.round(glow.g * 255);
        const b = Math.round(glow.b * 255);
        const band = ctx.createLinearGradient(0, h * 0.45, 0, h * 0.95);
        band.addColorStop(0, `rgba(${r},${g},${b},0)`);
        band.addColorStop(0.75, `rgba(${r},${g},${b},0.55)`);
        band.addColorStop(1, `rgba(${r},${g},${b},0.15)`);
        ctx.fillStyle = band;
        ctx.fillRect(0, 0, w, h);
      }
    },
  );
}

export type GroundKind = "grass" | "asphalt" | "sand" | "stone";

/** Per-setting ground treatment: tinted color variation plus the same
 *  texture reused as a bump map so the surface catches light unevenly. */
export function groundSurface(
  kind: GroundKind,
  tint: number,
): THREE.MeshStandardMaterial {
  const key = `terrain:${kind}:${tint}`;
  let material = materials.get(key);
  if (!material) {
    const texture = proceduralTexture(
      key, 256, 256,
      (ctx, w, h) => {
        const base = new THREE.Color(tint);
        const random = rng(key);
        const shade = (factor: number) =>
          hex(base.clone().multiplyScalar(factor).getHex());
        ctx.fillStyle = hex(tint);
        ctx.fillRect(0, 0, w, h);
        if (kind === "grass") {
          for (let i = 0; i < 700; i++) {
            ctx.fillStyle = shade(0.75 + random() * 0.6);
            ctx.globalAlpha = 0.4;
            ctx.fillRect(random() * w, random() * h, 1.5 + random() * 2, 1 + random() * 1.5);
          }
          // Short blade strokes give the lawn a direction.
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 1;
          for (let i = 0; i < 160; i++) {
            ctx.strokeStyle = shade(1.05 + random() * 0.35);
            const x = random() * w;
            const y = random() * h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (random() - 0.5) * 2, y - 3 - random() * 3);
            ctx.stroke();
          }
        } else if (kind === "asphalt") {
          // Fine aggregate plus a few hairline cracks.
          for (let i = 0; i < 1400; i++) {
            ctx.fillStyle = shade(0.7 + random() * 0.75);
            ctx.globalAlpha = 0.35;
            ctx.fillRect(random() * w, random() * h, 1 + random(), 1 + random());
          }
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = shade(0.5);
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            let x = random() * w;
            let y = random() * h;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let step = 0; step < 5; step++) {
              x += (random() - 0.5) * 30;
              y += 8 + random() * 14;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        } else if (kind === "sand") {
          for (let i = 0; i < 1100; i++) {
            ctx.fillStyle = shade(0.85 + random() * 0.35);
            ctx.globalAlpha = 0.35;
            ctx.fillRect(random() * w, random() * h, 1 + random(), 1);
          }
          // Wind ripples.
          ctx.globalAlpha = 0.16;
          ctx.lineWidth = 2.5;
          for (let y = 10; y < h; y += 22) {
            ctx.strokeStyle = shade(1.15);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(w * 0.3, y + 6, w * 0.7, y - 6, w, y);
            ctx.stroke();
          }
        } else {
          for (let i = 0; i < 900; i++) {
            ctx.fillStyle = shade(0.75 + random() * 0.6);
            ctx.globalAlpha = 0.4;
            ctx.fillRect(random() * w, random() * h, 1.5 + random() * 2, 1 + random() * 1.5);
          }
        }
        ctx.globalAlpha = 1;
      },
      [7, 7],
    );
    material = new THREE.MeshStandardMaterial({
      map: texture,
      bumpMap: texture,
      bumpScale: kind === "grass" ? 0.03 : 0.02,
      roughness: kind === "asphalt" ? 0.88 : 0.95,
    });
    materials.set(key, material);
  }
  return material;
}

/** Soft radial light pool — additive decal under a window. */
export function lightPoolTexture(): THREE.CanvasTexture {
  return proceduralTexture("light-pool", 128, 128, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.2)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
}

/** Indoor floorboards: planks with seams and gentle shade variation. */
export function plankMaterial(tint: number): THREE.MeshStandardMaterial {
  return surfaceMaterial(
    `planks:${tint}`,
    256, 256,
    (ctx, w, h) => {
      const base = new THREE.Color(tint);
      const random = rng(`planks:${tint}`);
      const rows = 6;
      const rowH = h / rows;
      for (let row = 0; row < rows; row++) {
        ctx.fillStyle = hex(
          base.clone().multiplyScalar(0.88 + random() * 0.26).getHex(),
        );
        ctx.fillRect(0, row * rowH, w, rowH);
        // Stagger one butt seam per row.
        const seam = (random() * 0.8 + 0.1) * w;
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(seam, row * rowH, 2, rowH);
        ctx.fillRect(0, row * rowH, w, 2); // board edge
      }
    },
    { roughness: 0.8, repeat: [4, 4] },
  );
}
