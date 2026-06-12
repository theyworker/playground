import * as THREE from "three";
import { Kit } from "../pac-meeting/mansion-kit";
import type { PlacedEntity, PlacedKind } from "./compile";

// Temporary Phase-2 visualization: one small box per placed entity plus a
// canvas-texture nameplate, so compiled placement can be eyeballed before
// the real mesh factory exists.

const KIND_STYLE: Record<PlacedKind, { box: number; border: string }> = {
  person: { box: 0x5b8dd9, border: "#8ab4f8" },
  object: { box: 0xd9a441, border: "#ffd23f" },
  anomaly: { box: 0xe14f7a, border: "#ff7aa2" },
};

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line === "" ? word : `${line} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth || line === "") {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }
  if (lines.length < maxLines) {
    lines.push(line);
  } else if (line !== lines[lines.length - 1]) {
    lines[lines.length - 1] += "…";
  }
  return lines;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  border: string,
) {
  ctx.fillStyle = "#10141f";
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "26px sans-serif";
  ctx.textAlign = "center";
  const lines = wrapLines(ctx, text, 470, 3);
  const startY = 64 - (lines.length - 1) * 17 + 9;
  lines.forEach((line, i) => ctx.fillText(line, 256, startY + i * 34));
}

export function buildDebugMarkers(entities: PlacedEntity[]): {
  group: THREE.Group;
  dispose: () => void;
} {
  const kit = new Kit();
  for (const entity of entities) {
    const style = KIND_STYLE[entity.kind];
    const [x, y, z] = entity.transform.position;
    const marker = kit.box(kit.material({ color: style.box }), x, y + 0.3, z, 0.5, 0.6, 0.5);
    marker.rotation.y = entity.transform.rotationY;
    kit.canvasPlane(
      (ctx) => drawLabel(ctx, entity.descriptor, style.border),
      512, 128, 2.2, 0.55,
      x, y + 1.05, z, 0,
    );
  }
  const { group, dispose } = kit.build();
  return { group, dispose };
}
