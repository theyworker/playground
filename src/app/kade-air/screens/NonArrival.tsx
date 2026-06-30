// Refs are supplied by useDrop and only mutated inside the descent timers (never
// read during render); see KadeAir.tsx for the full rationale.
/* eslint-disable react-hooks/refs */
import { s } from "../css";
import type { DropVM, DropRefs } from "../useDrop";

export default function NonArrival({ vm, refs }: { vm: DropVM; refs: DropRefs }) {
  const { scene } = vm;
  return (
    <div style={s("position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#120e2c 0%,#1d1640 50%,#3a2450 80%,#5a3550 100%)")}>
      <div style={s("position:absolute;right:50px;top:80px;width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 38% 36%, #fff3d4, #e9c98e);box-shadow:0 0 28px 4px rgba(255,235,190,.45)")} />
      {scene.stars.map((st, i) => (
        <div key={i} style={s(`position:absolute;left:${st.x}%;top:${st.y}%;width:${st.s}px;height:${st.s}px;border-radius:50%;background:#fff4d6;animation:ka-twinkle ${st.t}s ease-in-out ${st.d}s infinite`)} />
      ))}
      {/* distant Lotus glow */}
      <div style={s("position:absolute;left:40px;bottom:200px;width:7px;height:170px;background:linear-gradient(180deg,#5a4480,#2c2148);opacity:.6")} />
      <div style={s("position:absolute;left:30px;bottom:360px;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle,#e0789a,#a04a72);box-shadow:0 0 24px 4px rgba(224,120,158,.4);opacity:.7;animation:ka-glowpulse 3.4s ease-in-out infinite")} />

      {/* rooftop */}
      <div style={s("position:absolute;bottom:0;left:0;right:0;height:230px;z-index:10")}>
        <div style={s("position:absolute;bottom:0;left:0;right:0;height:140px;background:linear-gradient(180deg,#241a3e,#150f2a)")} />
        <div style={s("position:absolute;bottom:128px;left:0;right:0;height:20px;background:#2e2348;border-radius:4px")} />
        <div style={s("position:absolute;bottom:148px;left:36px;width:54px;height:74px;border-radius:10px 10px 6px 6px;background:linear-gradient(180deg,#3a2c5a,#241a3e)")} />
        <div style={s("position:absolute;bottom:220px;left:48px;width:30px;height:8px;border-radius:4px;background:#46365f")} />
        <div style={s("position:absolute;bottom:148px;right:44px;width:26px;height:22px;border-radius:0 0 8px 8px;background:#7a4a36")} />
        <div style={s("position:absolute;bottom:166px;right:40px;width:34px;height:40px;border-radius:50% 50% 46% 54%;background:radial-gradient(circle at 40% 30%,#6fa97a,#3f7a52)")} />
        <div style={s("position:absolute;bottom:206px;left:96px;right:90px;height:2px;background:rgba(244,234,217,.3)")} />
        <div style={s("position:absolute;bottom:188px;left:150px;width:18px;height:22px;background:#c98a8a;border-radius:2px;opacity:.8")} />
        <div style={s("position:absolute;bottom:188px;left:200px;width:18px;height:22px;background:#8a9ec9;border-radius:2px;opacity:.8")} />
        <div style={s("position:absolute;bottom:148px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center")}>
          <div style={s("width:16px;height:16px;border-radius:50%;background:#2a2040")} />
          <div style={s("width:26px;height:44px;border-radius:13px 13px 6px 6px;background:#332650;margin-top:-2px")} />
        </div>
        <div style={s("position:absolute;bottom:148px;left:50%;transform:translateX(-50%);width:84px;height:14px;border-radius:50%;background:radial-gradient(closest-side, rgba(247,185,106,.4), transparent);animation:ka-shimmer 2.4s ease-in-out infinite")} />
      </div>

      {/* descending drone */}
      <div ref={refs.naDrone} style={s("position:absolute;left:50%;top:54%;z-index:20;transform:translate(-50%,-50%) translateY(-280px);opacity:0")}>
        <div style={s("position:absolute;left:50%;top:55%;transform:translate(-50%,-50%);width:110px;height:80px;border-radius:50%;background:radial-gradient(circle, rgba(255,200,130,.4), transparent 65%)")} />
        <div style={s("position:absolute;top:6px;left:-30px;width:96px;height:5px;background:#2a2138;border-radius:3px")} />
        <div style={s("position:absolute;top:-7px;left:-34px;width:34px;height:9px;border-radius:50%;background:rgba(210,200,230,.35);filter:blur(1px);animation:ka-spin .1s linear infinite")} />
        <div style={s("position:absolute;top:-7px;right:-34px;width:34px;height:9px;border-radius:50%;background:rgba(210,200,230,.35);filter:blur(1px);animation:ka-spin .1s linear infinite")} />
        <div style={s("position:relative;width:60px;height:20px;border-radius:11px;background:linear-gradient(180deg,#4a3f63,#241c38);box-shadow:0 4px 10px -2px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.15)")}>
          <div style={s("position:absolute;top:-7px;left:14px;width:30px;height:13px;border-radius:9px 9px 4px 4px;background:#5a4d78")} />
          <div style={s("position:absolute;bottom:3px;right:6px;width:5px;height:5px;border-radius:50%;background:#ff6b6b;box-shadow:0 0 6px #ff6b6b;animation:ka-blink 1.1s steps(1) infinite")} />
        </div>
        <div style={s("position:absolute;top:20px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center")}>
          <div ref={refs.naParcel} style={s("transform-origin:top center;transform:scaleY(0);display:flex;flex-direction:column;align-items:center")}>
            <div style={s("width:2px;height:46px;background:rgba(244,234,217,.5)")} />
            <div style={s("width:20px;height:18px;border-radius:3px;background:linear-gradient(180deg,#e8b878,#c98a4a);box-shadow:0 3px 6px -1px rgba(0,0,0,.4)")} />
          </div>
        </div>
      </div>

      {/* status + button */}
      <div style={s("position:absolute;top:90px;left:0;right:0;z-index:30;text-align:center;padding:0 30px")}>
        <div style={s("font-family:'Baloo 2',cursive;font-weight:600;font-size:18px;color:#f6ecdc;min-height:24px;transition:opacity .4s")}>{vm.naStatus}</div>
      </div>
      {vm.naShowBtn && (
        <div style={s("position:absolute;bottom:36px;left:0;right:0;z-index:40;display:flex;justify-content:center;animation:ka-fadeIn .7s ease")}>
          <button className="press" onClick={vm.handlers.goPayoff} style={s("padding:15px 30px;border:1px solid rgba(247,185,106,.4);border-radius:22px;background:rgba(36,26,62,.7);backdrop-filter:blur(6px);color:#f7b96a;font:700 16px 'Baloo 2',sans-serif;cursor:pointer")}>See what you saved ›</button>
        </div>
      )}
    </div>
  );
}
