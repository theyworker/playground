import { s } from "../css";
import type { DropVM } from "../useDrop";

export default function Cart({ vm }: { vm: DropVM }) {
  const dish = vm.dish;
  return (
    <div style={s("height:100%;display:flex;flex-direction:column;background:#17122b;animation:ka-fadeIn .35s ease;position:relative")}>
      <div style={s("padding:54px 18px 4px")}>
        <div onClick={vm.handlers.backToDish} style={s("width:38px;height:38px;border-radius:50%;background:#241d3e;display:flex;align-items:center;justify-content:center;color:#f4ead9;font-size:20px;cursor:pointer")}>‹</div>
      </div>
      <div style={s("flex:1;overflow-y:auto;padding:10px 22px 20px")}>
        <h1 style={s("margin:4px 0 18px;font-family:'Baloo 2',cursive;font-weight:800;font-size:26px;color:#f4ead9")}>Your order</h1>

        <div style={s("display:flex;align-items:center;gap:14px;padding:14px;background:#241d3e;border-radius:20px")}>
          <div style={s("width:58px;height:58px;flex:none;border-radius:50%;background:radial-gradient(circle at 50% 42%, #3a2f57, #211a38);display:flex;align-items:center;justify-content:center")}>
            <div style={s(`width:40px;height:36px;border-radius:52% 48% 50% 50%/58% 58% 42% 42%;background:radial-gradient(circle at 38% 32%, ${dish.c1}, ${dish.c2})`)} />
          </div>
          <div style={s("flex:1")}>
            <div style={s("font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;color:#f4ead9")}>{dish.name}</div>
            <div style={s("font-size:12px;color:#9a8cb5;margin-top:2px")}>Qty 1 · drone-fresh, allegedly</div>
          </div>
          <div style={s("font-weight:800;color:#f4ead9")}>{dish.priceFmt}</div>
        </div>

        <div style={s("margin-top:18px;padding:16px 18px;background:#1e1837;border-radius:20px;display:flex;flex-direction:column;gap:11px;font-size:13.5px")}>
          <div style={s("display:flex;justify-content:space-between;color:#b9aacf")}><span>Subtotal</span><span style={s("text-decoration:line-through;opacity:.55")}>{dish.priceFmt}</span></div>
          <div style={s("display:flex;justify-content:space-between;color:#b9aacf")}><span>Drone effort</span><span style={s("color:#f2a65a")}>priceless</span></div>
          <div style={s("display:flex;justify-content:space-between;color:#b9aacf")}><span>Thunderstorm risk</span><span>included</span></div>
          <div style={s("height:1px;background:rgba(255,255,255,.07);margin:2px 0")} />
          <div style={s("display:flex;justify-content:space-between;align-items:center")}><span style={s("font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;color:#f4ead9")}>You pay</span><span style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:20px;color:#7fb389")}>Rs. 0</span></div>
        </div>
        <p style={s("margin:14px 4px 0;font-size:12px;line-height:1.55;color:#7c6f9c;font-style:italic")}>We never charge a cent. Nothing arrives. That&apos;s the deal, and honestly it&apos;s been working out.</p>
      </div>
      <div style={s("padding:14px 18px 24px;background:linear-gradient(0deg,#17122b 70%,transparent)")}>
        <button className="press" onClick={vm.handlers.sendDrone} style={s("position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:19px;border:none;border-radius:22px;font:800 19px 'Baloo 2',sans-serif;color:#2a1606;background:linear-gradient(180deg,#f7b96a,#ef9a45);box-shadow:0 16px 32px -8px rgba(239,154,69,.65),inset 0 1px 0 rgba(255,255,255,.5);cursor:pointer;overflow:hidden")}>
          <span style={s("font-size:20px")}>⤴</span> Send the drone
        </button>
      </div>

      {vm.confettiOn && (
        <div style={s("position:absolute;inset:0;z-index:80;pointer-events:none;overflow:hidden")}>
          <div style={s("position:absolute;left:50%;bottom:96px;width:60px;height:60px;border:3px solid #f7b96a;border-radius:50%;animation:ka-pulsering .9s ease-out forwards")} />
          {vm.scene.confettiPieces.map((p, i) => (
            <div key={i} style={s(`position:absolute;top:0;left:${p.left}%;width:${p.size}px;height:${p.size}px;background:${p.color};border-radius:${p.r}px;--dx:${p.dx}px;animation:ka-confettiFall ${p.dur}s ease-in ${p.delay}s forwards;opacity:0`)} />
          ))}
        </div>
      )}
    </div>
  );
}
