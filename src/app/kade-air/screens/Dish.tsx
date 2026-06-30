import { s } from "../css";
import type { DropVM } from "../useDrop";

export default function Dish({ vm }: { vm: DropVM }) {
  const dish = vm.dish;
  return (
    <div style={s("height:100%;display:flex;flex-direction:column;background:#17122b;animation:ka-fadeIn .35s ease")}>
      <div style={s("padding:54px 18px 4px")}>
        <div onClick={vm.handlers.backHome} style={s("width:38px;height:38px;border-radius:50%;background:#241d3e;display:flex;align-items:center;justify-content:center;color:#f4ead9;font-size:20px;cursor:pointer")}>‹</div>
      </div>
      <div style={s("flex:1;overflow-y:auto;padding:8px 22px 20px")}>
        <div style={s("display:flex;justify-content:center;margin:6px 0 18px")}>
          <div style={s("position:relative;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle at 50% 40%, #3a2f57, #1d1735);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 -8px 22px rgba(0,0,0,.4), 0 18px 40px -20px rgba(0,0,0,.8);animation:ka-floaty 5s ease-in-out infinite")}>
            <div style={s(`position:absolute;width:150px;height:60px;bottom:6px;border-radius:50%;background:radial-gradient(closest-side, ${dish.c1}, transparent);opacity:.18;filter:blur(8px)`)} />
            <div style={s(`width:108px;height:98px;border-radius:52% 48% 50% 50%/58% 58% 42% 42%;background:radial-gradient(circle at 38% 30%, ${dish.c1}, ${dish.c2});box-shadow:0 8px 18px -4px rgba(0,0,0,.5)`)} />
            <div style={s(`position:absolute;top:46px;left:52px;width:22px;height:22px;border-radius:50%;background:${dish.c3}`)} />
          </div>
        </div>
        <div style={s("display:flex;align-items:flex-start;justify-content:space-between;gap:12px")}>
          <div>
            <h1 style={s("margin:0;font-family:'Baloo 2',cursive;font-weight:800;font-size:25px;color:#f4ead9;line-height:1.05")}>{dish.name}</h1>
            <div style={s("margin-top:5px;font-size:13px;color:#9a8cb5")}>★ {dish.rating} · {dish.tag}</div>
          </div>
          <div style={s("font-family:'Baloo 2',cursive;font-weight:800;font-size:21px;color:#f2a65a;white-space:nowrap")}>{dish.priceFmt}</div>
        </div>

        <div style={s("margin-top:16px;padding:13px 15px;background:rgba(127,179,137,.1);border:1px solid rgba(127,179,137,.2);border-radius:16px;color:#a9d3b1;font-size:12.5px;line-height:1.5")}>
          Order it and you&apos;ll save <b style={s("color:#c8ecce")}>{dish.priceFmt}</b> and <b style={s("color:#c8ecce")}>{dish.kcalFmt}</b>. The drone does the flying. You do the not-eating.
        </div>

        <div style={s("margin-top:22px;font-family:'Baloo 2',cursive;font-weight:700;font-size:14px;color:#8d7fae;letter-spacing:.04em")}>WHAT PEOPLE ALMOST TASTED</div>
        <div style={s("display:flex;flex-direction:column;gap:10px;margin-top:11px")}>
          {dish.reviews.map((r, i) => (
            <div key={i} style={s("padding:14px 16px;background:#221b3b;border-radius:18px")}>
              <div style={s("font-size:11px;color:#f2c879;letter-spacing:2px")}>★★★★★</div>
              <p style={s("margin:7px 0 0;font-size:13.5px;line-height:1.5;color:#e7dcca")}>“{r.t}”</p>
              <p style={s("margin:8px 0 0;font-size:11.5px;color:#8d7fae;font-weight:700")}>{r.by}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={s("padding:14px 18px 24px;background:linear-gradient(0deg,#17122b 70%,transparent)")}>
        <button className="press" onClick={vm.handlers.goCart} style={s("display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:17px;border:none;border-radius:20px;font:800 17px 'Baloo 2',sans-serif;color:#2a1606;background:linear-gradient(180deg,#f7b96a,#ef9a45);box-shadow:0 12px 26px -8px rgba(239,154,69,.6),inset 0 1px 0 rgba(255,255,255,.45);cursor:pointer")}>Add to cart</button>
      </div>
    </div>
  );
}
