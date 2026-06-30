import { s } from "../css";
import type { DropVM } from "../useDrop";

export default function Payoff({ vm }: { vm: DropVM }) {
  return (
    <div style={s("height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:54px 30px 30px;background:radial-gradient(120% 70% at 50% 18%, #2a2050 0%, #17122b 60%);animation:ka-fadeIn .5s ease")}>
      <div style={s("width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 38% 35%, #ffe6a8, #f2a65a);box-shadow:0 0 36px -2px rgba(242,166,90,.7);margin-bottom:22px")} />
      <div style={s("font-size:13px;color:#9a8cb5;font-weight:700;letter-spacing:.08em;text-transform:uppercase")}>By not ordering the {vm.dish.shortName}</div>

      <div style={s("margin-top:20px;display:flex;gap:14px;width:100%")}>
        <div style={s("flex:1;padding:20px 12px;background:#221b3b;border-radius:22px")}>
          <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:24px;color:#f2a65a;line-height:1")}>{vm.savedFmt}</div>
          <div style={s("font-size:11.5px;color:#9a8cb5;margin-top:6px")}>saved</div>
        </div>
        <div style={s("flex:1;padding:20px 12px;background:#221b3b;border-radius:22px")}>
          <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:24px;color:#7fb389;line-height:1")}>{vm.kcalFmt}</div>
          <div style={s("font-size:11.5px;color:#9a8cb5;margin-top:6px")}>not eaten</div>
        </div>
      </div>

      <p style={s("margin:26px 0 0;font-size:14px;line-height:1.55;color:#d8ccbd;max-width:280px")}>You saved <b style={s("color:#f4ead9")}>{vm.savedFmt}</b> and <b style={s("color:#f4ead9")}>{vm.kcalFmt}</b> by not ordering that {vm.dish.shortName}.</p>

      <div style={s("margin-top:30px;padding:16px 26px;background:rgba(127,179,137,.1);border:1px solid rgba(127,179,137,.22);border-radius:20px")}>
        <div style={s("font-size:11.5px;color:#9a8cb5;letter-spacing:.06em")}>SAVED SO FAR</div>
        <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:30px;color:#a9d3b1;margin-top:4px")}>{vm.lifetimeFmt}</div>
      </div>

      <p style={s("margin:22px 0 0;font-size:12.5px;color:#7c6f9c;font-style:italic")}>It almost made it. Maybe next time.</p>

      <div style={s("margin-top:auto;width:100%;padding-top:24px")}>
        <button className="press" onClick={vm.handlers.restart} style={s("width:100%;padding:17px;border:none;border-radius:20px;font:800 17px 'Baloo 2',sans-serif;color:#2a1606;background:linear-gradient(180deg,#f7b96a,#ef9a45);box-shadow:0 12px 26px -8px rgba(239,154,69,.6),inset 0 1px 0 rgba(255,255,255,.45);cursor:pointer")}>Do the ritual again</button>
      </div>
    </div>
  );
}
