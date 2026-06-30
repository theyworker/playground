import { s } from "../css";
import type { DropVM } from "../useDrop";

export default function Home({ vm }: { vm: DropVM }) {
  return (
    <div style={s("height:100%;display:flex;flex-direction:column;background:radial-gradient(130% 60% at 80% 0%, #251c44 0%, #17122b 55%);animation:ka-fadeIn .4s ease")}>
      <div style={s("padding:56px 22px 14px")}>
        <div style={s("display:flex;align-items:center;justify-content:space-between")}>
          <div style={s("display:flex;align-items:baseline;gap:9px")}>
            <span style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:30px;color:#f4ead9;letter-spacing:-1px;line-height:1")}>drop</span>
            <span style={s("font-size:11px;font-weight:700;color:#f2a65a;letter-spacing:.12em;text-transform:uppercase")}>Kadé Air</span>
          </div>
          <div className="press" onClick={vm.handlers.goProfile} style={s("width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 35% 35%, #ffe6a8, #f2a65a);box-shadow:0 0 22px -2px rgba(242,166,90,.7);cursor:pointer")} />
        </div>
        <p style={s("margin:14px 0 0;font-size:13.5px;line-height:1.5;color:#b9aacf")}>{vm.presence}</p>
      </div>

      <div style={s("flex:1;overflow-y:auto;padding:6px 16px 30px")}>
        <div style={s("display:flex;flex-direction:column;gap:12px")}>
          {vm.dishCards.map((d) => (
            <div key={d.id} className="press-sm" onClick={d.onSelect} style={s("display:flex;align-items:center;gap:14px;padding:13px;background:#241d3e;border:1px solid rgba(255,255,255,.05);border-radius:22px;cursor:pointer;box-shadow:0 8px 20px -14px rgba(0,0,0,.7)")}>
              <div style={s("position:relative;width:66px;height:66px;flex:none;border-radius:50%;background:radial-gradient(circle at 50% 42%, #3a2f57, #211a38);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -4px 10px rgba(0,0,0,.35)")}>
                <div style={s(`width:46px;height:42px;border-radius:52% 48% 50% 50%/58% 58% 42% 42%;background:radial-gradient(circle at 38% 32%, ${d.c1}, ${d.c2});box-shadow:0 4px 10px -2px rgba(0,0,0,.4)`)} />
                <div style={s(`position:absolute;top:18px;left:20px;width:11px;height:11px;border-radius:50%;background:${d.c3};opacity:.95`)} />
              </div>
              <div style={s("flex:1;min-width:0")}>
                <div style={s("font-family:'Baloo 2',cursive;font-weight:700;font-size:17px;color:#f4ead9;line-height:1.1")}>{d.name}</div>
                <div style={s("font-size:12px;color:#9a8cb5;margin-top:2px;line-height:1.35")}>{d.tag}</div>
                <div style={s("display:flex;align-items:center;gap:8px;margin-top:7px")}>
                  <span style={s("font-size:12px;color:#f2c879;font-weight:700")}>★ {d.rating}</span>
                  <span style={s("color:#4a3f63;font-size:11px")}>•</span>
                  <span style={s("font-size:13px;font-weight:800;color:#f4ead9")}>{d.priceFmt}</span>
                </div>
              </div>
              <div style={s("color:#6a5c87;font-size:22px;font-weight:300;padding-right:4px")}>›</div>
            </div>
          ))}
        </div>
        <p style={s("text-align:center;margin:22px 0 0;font-size:11.5px;color:#5e527a;font-style:italic")}>nothing arrives, on purpose</p>
      </div>
    </div>
  );
}
