import { s } from "../css";

// The static Colombo landmarks living inside the flight's mid parallax layer.
export default function Landmarks() {
  return (
    <>
      {/* Lotus Tower */}
      <div style={s("position:absolute;bottom:64px;left:660px;width:30px;display:flex;flex-direction:column;align-items:center")}>
        <div style={s("width:4px;height:40px;background:#cda6c6")} />
        <div style={s("position:relative;width:48px;height:48px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%, #f7a6c4, #c85a8d);box-shadow:0 0 34px 6px rgba(224,120,158,.6);animation:ka-glowpulse 3.4s ease-in-out infinite;margin-top:-2px")} />
        <div style={s("width:14px;height:18px;border-radius:50% 50% 40% 40%;background:#b9588a;margin-top:-4px")} />
        <div style={s("width:9px;height:280px;background:linear-gradient(180deg,#6a4f8f,#3a2c5a)")} />
        <div style={s("width:34px;height:30px;background:linear-gradient(180deg,#4a3a6e,#2c2148);clip-path:polygon(18% 0,82% 0,100% 100%,0 100%);margin-top:-1px")} />
      </div>

      {/* Shangri-La twin towers */}
      <div style={s("position:absolute;bottom:64px;left:700px;display:flex;align-items:flex-end;gap:7px")}>
        <div style={s("position:absolute;bottom:0;left:-16px;width:114px;height:240px;background:radial-gradient(58% 64% at 50% 32%, rgba(120,160,230,.26), transparent 72%);filter:blur(7px);pointer-events:none")} />
        <div style={s("position:relative;width:35px;height:216px;border-radius:4px 4px 0 0;background-color:#2c3760;background-image:linear-gradient(104deg,transparent 35%,rgba(220,235,255,.20) 47%,transparent 59%),radial-gradient(circle,rgba(206,226,255,.95) 1px,transparent 1.7px);background-size:100% 100%,7px 9px;box-shadow:inset -3px 0 0 rgba(255,210,160,.26),inset 0 2px 0 rgba(255,255,255,.2),0 0 18px -4px rgba(150,185,250,.5)")}>
          <div style={s("position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:10px;height:9px;background:#3a4670;border-radius:2px 2px 0 0")} />
          <div style={s("position:absolute;top:-15px;left:50%;transform:translateX(-50%);width:2px;height:8px;background:#b9cdf0;box-shadow:0 0 6px rgba(185,205,240,.8)")} />
        </div>
        <div style={s("position:relative;width:35px;height:198px;border-radius:4px 4px 0 0;background-color:#2c3760;background-image:linear-gradient(104deg,transparent 35%,rgba(220,235,255,.20) 47%,transparent 59%),radial-gradient(circle,rgba(206,226,255,.95) 1px,transparent 1.7px);background-size:100% 100%,7px 9px;box-shadow:inset -3px 0 0 rgba(255,210,160,.26),inset 0 2px 0 rgba(255,255,255,.2),0 0 18px -4px rgba(150,185,250,.5)")}>
          <div style={s("position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:10px;height:9px;background:#3a4670;border-radius:2px 2px 0 0")} />
        </div>
      </div>

      {/* ITC Ratnadipa (curved sail tower) */}
      <div style={s("position:absolute;bottom:64px;left:802px;display:flex;flex-direction:column;align-items:center")}>
        <div style={s("position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:130px;height:340px;background:radial-gradient(48% 58% at 50% 30%, rgba(245,180,110,.26), transparent 72%);filter:blur(8px);pointer-events:none")} />
        <div style={s("width:3px;height:28px;background:linear-gradient(180deg,#ffe6b0,#caa15a);box-shadow:0 0 11px rgba(255,220,150,.8)")} />
        <div style={s("width:19px;height:8px;background:#7a6242;border-radius:3px 3px 0 0;margin-top:-1px")} />
        <div style={s("position:relative;width:44px;height:290px;margin-top:-1px;clip-path:polygon(15% 0,85% 0,100% 100%,0 100%);background-color:#3b3043;background-image:linear-gradient(100deg,transparent 28%,rgba(255,232,192,.20) 46%,transparent 62%),radial-gradient(circle,rgba(251,206,142,.92) 1px,transparent 1.7px);background-size:100% 100%,8px 10px;box-shadow:0 0 22px -6px rgba(245,180,110,.6)")}>
          <div style={s("position:absolute;top:62px;left:0;right:0;height:5px;background:rgba(255,224,170,.55)")} />
          <div style={s("position:absolute;top:0;right:0;bottom:0;width:6px;background:linear-gradient(270deg,rgba(255,214,160,.42),transparent)")} />
        </div>
      </div>

      {/* Altair (leaning towers + sky bridges) */}
      <div style={s("position:absolute;bottom:64px;left:858px;width:98px;height:266px")}>
        <div style={s("position:absolute;bottom:0;left:0;width:98px;height:266px;background:radial-gradient(55% 58% at 56% 36%, rgba(245,185,150,.22), transparent 72%);filter:blur(8px);pointer-events:none")} />
        <div style={s("position:absolute;bottom:0;right:8px;width:35px;height:254px;border-radius:4px 4px 0 0;background-color:#352b4c;background-image:linear-gradient(104deg,transparent 35%,rgba(255,232,192,.16) 47%,transparent 59%),radial-gradient(circle,rgba(251,206,142,.9) 1px,transparent 1.7px);background-size:100% 100%,8px 10px;box-shadow:0 0 20px -6px rgba(240,180,120,.5)")}>
          <div style={s("position:absolute;top:-7px;left:6px;right:6px;height:8px;background:#4a3d63;border-radius:2px 2px 0 0")} />
        </div>
        <div style={s("position:absolute;bottom:0;left:0;width:31px;height:230px;transform-origin:bottom left;transform:rotate(15deg);border-radius:4px 4px 0 0;background-color:#2e2643;background-image:linear-gradient(104deg,transparent 35%,rgba(255,232,192,.16) 47%,transparent 59%),radial-gradient(circle,rgba(251,206,142,.84) 1px,transparent 1.7px);background-size:100% 100%,8px 10px;box-shadow:inset -3px 0 0 rgba(255,210,160,.28)")}>
          <div style={s("position:absolute;top:-7px;left:5px;right:5px;height:8px;background:#46395f;border-radius:2px 2px 0 0")} />
        </div>
        <div style={s("position:absolute;bottom:200px;left:24px;width:40px;height:7px;background:linear-gradient(90deg,#8a72ad,#5a4a78);border-radius:2px;transform:rotate(9deg);box-shadow:0 0 9px -1px rgba(180,150,220,.6)")} />
        <div style={s("position:absolute;bottom:106px;left:16px;width:50px;height:7px;background:linear-gradient(90deg,#8a72ad,#5a4a78);border-radius:2px;transform:rotate(9deg);box-shadow:0 0 9px -1px rgba(180,150,220,.6)")} />
      </div>

      {/* Galle Face + sea */}
      <div style={s("position:absolute;bottom:64px;left:1010px;width:230px;height:22px;background:#5f9a6c;border-radius:6px 6px 0 0")} />
      <div style={s("position:absolute;bottom:86px;left:1010px;width:230px;height:50px;background:linear-gradient(180deg,#3a3a6e,#26486a);border-radius:6px 6px 0 0;opacity:.55")} />
      <div style={s("position:absolute;bottom:120px;left:1090px;width:2px;height:34px;background:rgba(255,255,255,.4);transform:rotate(12deg)")} />
      <div style={s("position:absolute;bottom:150px;left:1080px;width:14px;height:14px;background:#f2a65a;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%)")} />

      {/* Beira Lake */}
      <div style={s("position:absolute;bottom:48px;left:1250px;width:170px;height:46px;border-radius:50%;background:radial-gradient(circle at 50% 40%, #2c5876, #163049);box-shadow:inset 0 4px 14px rgba(0,0,0,.4)")} />
      <div style={s("position:absolute;bottom:62px;left:1280px;width:90px;height:6px;border-radius:50%;background:rgba(247,200,140,.4);animation:ka-shimmer 2.6s ease-in-out infinite")} />

      {/* Pettah cluster */}
      <div style={s("position:absolute;bottom:64px;left:1420px;width:42px;height:96px;background:#7a4a52;border-radius:3px 3px 0 0;background-image:radial-gradient(rgba(245,200,140,.6) 1px,transparent 1.6px);background-size:9px 11px")} />
      <div style={s("position:absolute;bottom:64px;left:1466px;width:38px;height:130px;background:#6b5a8a;border-radius:3px 3px 0 0;background-image:radial-gradient(rgba(245,200,140,.6) 1px,transparent 1.6px);background-size:9px 11px")} />
      <div style={s("position:absolute;bottom:64px;left:1508px;width:46px;height:80px;background:#8a6a4a;border-radius:3px 3px 0 0;background-image:radial-gradient(rgba(245,200,140,.6) 1px,transparent 1.6px);background-size:9px 11px")} />
      <div style={s("position:absolute;bottom:64px;left:1558px;width:40px;height:110px;background:#5a6a8a;border-radius:3px 3px 0 0;background-image:radial-gradient(rgba(245,200,140,.6) 1px,transparent 1.6px);background-size:9px 11px")} />

      {/* approach rooftop */}
      <div style={s("position:absolute;bottom:64px;left:1740px;width:120px;height:150px;background:linear-gradient(180deg,#2e2350,#211940);border-radius:4px 4px 0 0;background-image:radial-gradient(rgba(245,200,140,.5) 1px,transparent 1.6px);background-size:11px 14px")} />
      <div style={s("position:absolute;bottom:214px;left:1772px;width:30px;height:26px;background:#3a2d5c;border-radius:6px 6px 0 0")} />
    </>
  );
}
