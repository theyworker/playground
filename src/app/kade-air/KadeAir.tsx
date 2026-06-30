"use client";

// The flight/non-arrival scenes are animated imperatively by the useDrop hook,
// which owns the element refs and only touches them inside timers/effects (never
// during render). Threading those refs into the JSX is intentional and safe — so
// the screens that attach them disable the React-Compiler ref rule, which only
// models same-component useRef.

import "./kade-air.css";
import { s } from "./css";
import { useDrop } from "./useDrop";
import Home from "./screens/Home";
import Dish from "./screens/Dish";
import Cart from "./screens/Cart";
import Flight from "./screens/Flight";
import NonArrival from "./screens/NonArrival";
import Payoff from "./screens/Payoff";
import Profile from "./screens/Profile";

export default function KadeAir() {
  const [vm, refs] = useDrop();
  return (
    <div className="kade-air" style={s("position:fixed;inset:0;overflow:hidden;background:#17122b")}>
      {vm.screen === "home" && <Home vm={vm} />}
      {vm.screen === "dish" && <Dish vm={vm} />}
      {vm.screen === "cart" && <Cart vm={vm} />}
      {vm.screen === "flight" && <Flight vm={vm} refs={refs} />}
      {vm.screen === "nonarrival" && <NonArrival vm={vm} refs={refs} />}
      {vm.screen === "payoff" && <Payoff vm={vm} />}
      {vm.screen === "profile" && <Profile vm={vm} />}
    </div>
  );
}
