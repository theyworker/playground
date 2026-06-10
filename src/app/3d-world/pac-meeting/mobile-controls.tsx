"use client";

import { useEffect, useState } from "react";

const ARROWS: { code: string; glyph: string; cell: string }[] = [
  { code: "ArrowUp", glyph: "▲", cell: "col-start-2 row-start-1" },
  { code: "ArrowLeft", glyph: "◀", cell: "col-start-1 row-start-2" },
  { code: "ArrowRight", glyph: "▶", cell: "col-start-3 row-start-2" },
  { code: "ArrowDown", glyph: "▼", cell: "col-start-2 row-start-3" },
];

function press(code: string, type: "keydown" | "keyup") {
  window.dispatchEvent(new KeyboardEvent(type, { code }));
}

// Floating d-pad, shown only on coarse-pointer (touch) devices. It feeds the
// game by dispatching synthetic arrow-key events that the scene already
// listens for.
export default function MobileControls() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    setIsTouch(query.matches);
    const onChange = (event: MediaQueryListEvent) => setIsTouch(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  if (!isTouch) return null;

  return (
    <div
      className="absolute bottom-20 left-5 z-10 grid select-none grid-cols-3
        grid-rows-3 gap-1.5"
      style={{ touchAction: "none" }}
    >
      {ARROWS.map(({ code, glyph, cell }) => (
        <button
          key={code}
          type="button"
          aria-label={code}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            press(code, "keydown");
          }}
          onPointerUp={() => press(code, "keyup")}
          onPointerCancel={() => press(code, "keyup")}
          className={`${cell} flex h-14 w-14 items-center justify-center
            rounded-full border border-slate-400/40 bg-black/35 text-lg
            text-slate-200 backdrop-blur-sm transition-colors
            active:bg-slate-200/30 active:text-white`}
        >
          {glyph}
        </button>
      ))}
    </div>
  );
}
