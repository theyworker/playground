import { s } from "../css";
import type { DropVM } from "../useDrop";

export default function Profile({ vm }: { vm: DropVM }) {
  return (
    <div style={s("height:100%;display:flex;flex-direction:column;background:radial-gradient(130% 60% at 80% 0%, #251c44 0%, #17122b 55%);animation:ka-fadeIn .4s ease")}>
      <div style={s("padding:54px 18px 4px;display:flex;align-items:center;justify-content:space-between")}>
        <div className="press" onClick={vm.handlers.backHome} style={s("width:38px;height:38px;border-radius:50%;background:#241d3e;display:flex;align-items:center;justify-content:center;color:#f4ead9;font-size:20px;cursor:pointer")}>‹</div>
        <span style={s("font-family:'Baloo 2',cursive;font-weight:700;font-size:13px;color:#8d7fae;letter-spacing:.1em;text-transform:uppercase")}>Your ritual</span>
        <div style={s("width:38px;height:38px")} />
      </div>

      <div style={s("flex:1;overflow-y:auto;padding:10px 22px 30px")}>
        <div style={s("display:flex;flex-direction:column;align-items:center;text-align:center;margin:6px 0 26px")}>
          <div style={s("width:88px;height:88px;border-radius:50%;background:radial-gradient(circle at 35% 32%, #ffe6a8, #f2a65a);box-shadow:0 0 42px -4px rgba(242,166,90,.7);animation:ka-floaty 5s ease-in-out infinite")} />
          <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:23px;color:#f4ead9;margin-top:16px;line-height:1")}>The Almost-Eater</div>
          <div style={s("font-size:12.5px;color:#9a8cb5;margin-top:5px")}>Colombo 7 · member since the first empty drone</div>
        </div>

        <div style={s("display:flex;gap:11px")}>
          <div style={s("flex:1;padding:18px 8px;background:#221b3b;border-radius:20px;text-align:center")}>
            <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:23px;color:#f2a65a;line-height:1")}>{vm.profileFlights}</div>
            <div style={s("font-size:10.5px;color:#9a8cb5;margin-top:6px;line-height:1.3")}>drones sent</div>
          </div>
          <div style={s("flex:1;padding:18px 8px;background:#221b3b;border-radius:20px;text-align:center")}>
            <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:23px;color:#7fb389;line-height:1")}>{vm.profileKcal}</div>
            <div style={s("font-size:10.5px;color:#9a8cb5;margin-top:6px;line-height:1.3")}>kcal not eaten</div>
          </div>
          <div style={s("flex:1;padding:18px 8px;background:#221b3b;border-radius:20px;text-align:center")}>
            <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:23px;color:#e0789a;line-height:1")}>{vm.profileSaved}</div>
            <div style={s("font-size:10.5px;color:#9a8cb5;margin-top:6px;line-height:1.3")}>rupees saved</div>
          </div>
        </div>

        <div style={s("margin-top:28px;font-family:'Baloo 2',cursive;font-weight:700;font-size:14px;color:#8d7fae;letter-spacing:.04em")}>DISHES YOU ALMOST LOVE</div>
        <div style={s("display:flex;flex-direction:column;gap:10px;margin-top:12px")}>
          {vm.favorites.map((f) => (
            <div key={f.id} className="press-sm" onClick={f.onSelect} style={s("display:flex;align-items:center;gap:14px;padding:12px;background:#241d3e;border:1px solid rgba(255,255,255,.05);border-radius:20px;cursor:pointer")}>
              <div style={s("width:30px;text-align:center;font-family:'Baloo 2',cursive;font-weight:800;font-size:16px;color:#5e527a")}>{f.rank}</div>
              <div style={s("position:relative;width:54px;height:54px;flex:none;border-radius:50%;background:radial-gradient(circle at 50% 42%, #3a2f57, #211a38);display:flex;align-items:center;justify-content:center")}>
                <div style={s(`width:38px;height:34px;border-radius:52% 48% 50% 50%/58% 58% 42% 42%;background:radial-gradient(circle at 38% 32%, ${f.c1}, ${f.c2})`)} />
                <div style={s(`position:absolute;top:15px;left:17px;width:9px;height:9px;border-radius:50%;background:${f.c3};opacity:.95`)} />
              </div>
              <div style={s("flex:1;min-width:0")}>
                <div style={s("font-family:'Baloo 2',cursive;font-weight:700;font-size:16px;color:#f4ead9;line-height:1.1")}>{f.name}</div>
                <div style={s("font-size:11.5px;color:#9a8cb5;margin-top:3px")}>almost ordered {f.count}</div>
              </div>
              <div style={s("width:54px;height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;flex:none")}>
                <div style={s(`height:100%;width:${f.pct}%;background:linear-gradient(90deg,#f7b96a,#e0789a);border-radius:3px`)} />
              </div>
            </div>
          ))}
        </div>

        <p style={s("text-align:center;margin:24px 0 0;font-size:11.5px;color:#5e527a;font-style:italic")}>a lifetime of meals, beautifully unfulfilled</p>
      </div>
    </div>
  );
}
