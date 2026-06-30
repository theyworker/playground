// Refs are supplied by useDrop and only mutated inside the animation loop (never
// read during render); see KadeAir.tsx for the full rationale.
/* eslint-disable react-hooks/refs */
import { s } from "../css";
import type { DropVM, DropRefs } from "../useDrop";
import Landmarks from "./Landmarks";

export default function Flight({ vm, refs }: { vm: DropVM; refs: DropRefs }) {
  const { scene } = vm;
  return (
    <div style={s("position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#1a1442 0%,#34225a 42%,#7a3b62 66%,#c66a52 82%,#e89a52 100%)")}>
      {/* sun glow */}
      <div style={s("position:absolute;left:50%;bottom:8%;transform:translateX(-50%);width:240px;height:240px;border-radius:50%;background:radial-gradient(circle, rgba(255,210,140,.9), rgba(245,150,80,.35) 45%, transparent 70%);filter:blur(2px)")} />
      {/* moon */}
      <div style={s("position:absolute;right:40px;top:124px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 38% 36%, #fff3d4, #e9c98e);box-shadow:0 0 30px 4px rgba(255,235,190,.5)")} />
      {/* stars */}
      {scene.stars.map((st, i) => (
        <div key={i} style={s(`position:absolute;left:${st.x}%;top:${st.y}%;width:${st.s}px;height:${st.s}px;border-radius:50%;background:#fff4d6;animation:ka-twinkle ${st.t}s ease-in-out ${st.d}s infinite`)} />
      ))}
      {/* clouds */}
      {scene.clouds.map((c, i) => (
        <div key={i} style={s(`position:absolute;left:${c.x}%;top:${c.y}%;width:${c.w}px;height:${c.h}px;border-radius:50px;background:rgba(255,200,160,.12);filter:blur(6px);animation:ka-drift ${c.dur}s ease-in-out infinite alternate`)} />
      ))}

      {/* FAR layer */}
      <div ref={refs.far} style={s("position:absolute;left:0;bottom:0;width:1000px;height:100%;will-change:transform")}>
        {scene.farB.map((b, i) => (
          <div key={i} style={s(`position:absolute;bottom:70px;left:${b.x}px;width:${b.w}px;height:${b.h}px;background:${b.c};border-radius:3px 3px 0 0;opacity:.7`)} />
        ))}
      </div>

      {/* MID layer (timed landmarks) */}
      <div ref={refs.mid} style={s("position:absolute;left:0;bottom:0;width:2000px;height:100%;will-change:transform")}>
        <div style={s("position:absolute;bottom:0;left:0;width:2000px;height:72px;background:linear-gradient(180deg,#2a1f44,#1c1432)")} />
        {scene.midB.map((b, i) => (
          <div key={i} style={s(`position:absolute;bottom:64px;left:${b.x}px;width:${b.w}px;height:${b.h}px;background:${b.c};background-image:radial-gradient(rgba(245,180,110,.55) 1px, transparent 1.6px);background-size:9px 12px;border-radius:4px 4px 0 0`)} />
        ))}
        <Landmarks />
      </div>

      {/* NEAR layer (foreground) */}
      <div ref={refs.near} style={s("position:absolute;left:0;bottom:0;width:2800px;height:100%;will-change:transform")}>
        {scene.nearB.map((b, i) => (
          <div key={i} style={s(`position:absolute;bottom:0;left:${b.x}px;width:${b.w}px;height:${b.h}px;background:linear-gradient(180deg,#140e26,#0c081a);border-radius:5px 5px 0 0`)} />
        ))}
      </div>

      {/* DRONE */}
      <div ref={refs.drone} style={s("position:absolute;left:46%;top:40%;z-index:30;transform:translate(-50%,-50%)")}>
        <div style={s("position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);width:120px;height:90px;border-radius:50%;background:radial-gradient(circle, rgba(255,200,130,.45), transparent 65%);filter:blur(2px)")} />
        <div style={s("position:absolute;top:6px;left:-30px;width:96px;height:5px;background:#2a2138;border-radius:3px;transform:rotate(-8deg)")} />
        <div style={s("position:absolute;top:-7px;left:-34px;width:34px;height:9px;border-radius:50%;background:rgba(210,200,230,.35);filter:blur(1px);animation:ka-spin .1s linear infinite")} />
        <div style={s("position:absolute;top:1px;right:-34px;width:34px;height:9px;border-radius:50%;background:rgba(210,200,230,.35);filter:blur(1px);animation:ka-spin .1s linear infinite")} />
        <div style={s("position:relative;width:60px;height:20px;border-radius:11px;background:linear-gradient(180deg,#4a3f63,#241c38);box-shadow:0 4px 10px -2px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.15)")}>
          <div style={s("position:absolute;top:-7px;left:14px;width:30px;height:13px;border-radius:9px 9px 4px 4px;background:#5a4d78")} />
          <div style={s("position:absolute;bottom:3px;right:6px;width:5px;height:5px;border-radius:50%;background:#ff6b6b;box-shadow:0 0 6px #ff6b6b;animation:ka-blink 1.1s steps(1) infinite")} />
        </div>
        <div style={s("position:absolute;top:20px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center")}>
          <div style={s("width:2px;height:14px;background:rgba(244,234,217,.5)")} />
          <div style={s("width:18px;height:16px;border-radius:3px;background:linear-gradient(180deg,#e8b878,#c98a4a);box-shadow:0 3px 6px -1px rgba(0,0,0,.4)")} />
        </div>
      </div>

      {/* storm overlay */}
      {vm.storm && (
        <div style={s("position:absolute;inset:0;z-index:40;pointer-events:none")}>
          <div style={s("position:absolute;inset:0;background:rgba(20,16,40,.45)")} />
          <div style={s("position:absolute;inset:0;background-image:repeating-linear-gradient(108deg, rgba(190,200,230,.28) 0 1.5px, transparent 1.5px 9px);background-size:auto 220px;animation:ka-rainfall .55s linear infinite")} />
          <div style={s("position:absolute;inset:0;background:#cfd6ff;animation:ka-flash 4s linear infinite")} />
        </div>
      )}

      {/* status pill */}
      <div style={s("position:absolute;top:62px;left:0;right:0;z-index:50;display:flex;justify-content:center;padding:0 24px")}>
        <div style={s("max-width:320px;text-align:center;padding:9px 18px;background:rgba(20,14,38,.5);backdrop-filter:blur(8px);border-radius:30px;border:1px solid rgba(255,255,255,.1)")}>
          <div style={s("font-family:'Baloo 2',cursive;font-weight:600;font-size:14.5px;color:#f8eedd")}>{vm.flightStatus}</div>
        </div>
      </div>

      {/* bottom progress */}
      <div style={s("position:absolute;bottom:0;left:0;right:0;z-index:50;padding:18px 26px 26px;background:linear-gradient(0deg,rgba(20,12,32,.7),transparent)")}>
        <div style={s("display:flex;justify-content:space-between;font-size:11px;color:#ffe6c8;margin-bottom:8px;font-weight:700;letter-spacing:.04em")}>
          <span>ETA · never</span>
          <span>the wait is the meal</span>
        </div>
        <div style={s("height:5px;border-radius:3px;background:rgba(255,255,255,.18);overflow:hidden")}>
          <div ref={refs.fill} style={s("height:100%;width:0%;background:linear-gradient(90deg,#f7b96a,#e0789a);border-radius:3px")} />
        </div>
      </div>
    </div>
  );
}
