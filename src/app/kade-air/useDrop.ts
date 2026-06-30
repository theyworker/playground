import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dishes,
  fmt,
  generateScene,
  presenceLines,
  type Dish,
} from "./data";

// Editor-tunable props from the original design, fixed to their defaults here.
const FLIGHT_SECONDS = 15;
const STORM_MODE: "Always" | "Sometimes" | "Never" = "Sometimes";

export type Screen =
  | "home" | "dish" | "cart" | "flight" | "nonarrival" | "payoff" | "profile";

const FLIGHT_SEGMENTS = [
  { p: 0, t: "Lifting off from your rooftop…" },
  { p: 0.13, t: "Climbing over the rooftops of Colombo 7…" },
  { p: 0.27, t: "Threading past the Lotus Tower…" },
  { p: 0.4, t: "Sliding past Altair, the Shangri-La and ITC towers…" },
  { p: 0.5, t: "Banking over Galle Face Green…" },
  { p: 0.66, t: "Gliding across Beira Lake…" },
  { p: 0.8, t: "Cutting low over Pettah…" },
  { p: 0.92, t: "Almost at your rooftop…" },
];

const vibe = (p: number | number[]) => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(p);
  } catch {
    /* ignore */
  }
};

function loadInt(key: string, fallback: number) {
  try {
    const v = parseInt(localStorage.getItem(key) || "", 10);
    return Number.isNaN(v) ? fallback : v;
  } catch {
    return fallback;
  }
}

export function useDrop() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dishId, setDishId] = useState("kottu");
  const [presenceIdx, setPresenceIdx] = useState(0);
  const [flightStatus, setFlightStatus] = useState("Lifting off from your rooftop…");
  const [storm, setStorm] = useState(false);
  const [confettiOn, setConfettiOn] = useState(false);
  const [naStatus, setNaStatus] = useState("");
  const [naShowBtn, setNaShowBtn] = useState(false);
  const [savedAnim, setSavedAnim] = useState(0);
  const [kcalAnim, setKcalAnim] = useState(0);
  const [lifetime, setLifetime] = useState(18600);
  const [lifetimeAnim, setLifetimeAnim] = useState(18600);
  const [flights, setFlights] = useState(9);
  const [totalKcal, setTotalKcal] = useState(14200);
  const [faves, setFaves] = useState<Record<string, number>>({
    kottu: 3, hoppers: 2, lamprais: 2, biryani: 1, string: 1, kiribath: 1,
  });

  // Scene geometry is generated once and kept stable across renders.
  const scene = useMemo(() => generateScene(), []);

  // Imperative DOM handles for the animation loops. Returned as a separate
  // `refs` object (not folded into the view model) and attached directly to
  // `ref=` props, so the render-data object never carries a ref value.
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const droneRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const naDroneRef = useRef<HTMLDivElement>(null);
  const naParcelRef = useRef<HTMLDivElement>(null);

  const flightInt = useRef<number | null>(null);
  const naTimers = useRef<number[]>([]);
  const countInt = useRef<number | null>(null);

  const dish: Dish = useMemo(
    () => dishes.find((d) => d.id === dishId) || dishes[0],
    [dishId],
  );

  const stopFlight = useCallback(() => {
    if (flightInt.current) clearInterval(flightInt.current);
    flightInt.current = null;
  }, []);

  const clearNA = useCallback(() => {
    naTimers.current.forEach(clearTimeout);
    naTimers.current = [];
  }, []);

  const startNA = useCallback(() => {
    clearNA();
    const d = naDroneRef.current;
    const par = naParcelRef.current;
    if (d) {
      d.style.transition = "none";
      d.style.transform = "translate(-50%,-50%) translateY(-280px)";
      d.style.opacity = "0";
      void d.offsetWidth;
    }
    if (par) {
      par.style.transition = "none";
      par.style.transform = "scaleY(0)";
    }
    setNaStatus("Descending to your rooftop…");
    setNaShowBtn(false);
    const T = (ms: number, fn: () => void) => {
      naTimers.current.push(window.setTimeout(fn, ms));
    };
    T(80, () => {
      if (d) {
        d.style.transition = "transform 3s cubic-bezier(.3,.7,.3,1), opacity 1.2s ease";
        d.style.transform = "translate(-50%,-50%) translateY(0px)";
        d.style.opacity = "1";
      }
    });
    T(3300, () => {
      setNaStatus("Lowering your order, gently…");
      if (par) {
        par.style.transition = "transform 1.6s ease";
        par.style.transform = "scaleY(1)";
      }
    });
    T(5600, () => setNaStatus("…"));
    T(7000, () => {
      setNaStatus("Hm.");
      if (par) {
        par.style.transition = "transform 1s ease";
        par.style.transform = "scaleY(0)";
      }
    });
    T(8400, () => {
      setNaStatus("It almost made it.");
      if (d) {
        d.style.transition = "transform 3.6s ease-in, opacity 2.8s ease-in";
        d.style.transform = "translate(-50%,-50%) translate(230px,-200px)";
        d.style.opacity = "0";
      }
    });
    T(11600, () => setNaShowBtn(true));
  }, [clearNA]);

  const startFlight = useCallback(() => {
    stopFlight();
    const dur = Math.max(6, FLIGHT_SECONDS) * 1000;
    const stormAt = 0.46;
    const doStorm =
      STORM_MODE === "Always" ? true
      : STORM_MODE === "Never" ? false
      : Math.random() < 0.6;
    let stormStart: number | null = null;
    let stormDone = false;
    let stormPause = 0;
    let stormNow = false;
    setStorm(false);
    setFlightStatus("Lifting off from your rooftop…");
    let lastSeg = -1;
    const t0 = performance.now();
    let lastNow = t0;
    const tick = () => {
      const now = performance.now();
      const dt = now - lastNow;
      lastNow = now;
      if (doStorm && !stormDone) {
        const rawP = (now - t0 - stormPause) / dur;
        if (stormStart === null && rawP >= stormAt) {
          stormStart = now;
          stormNow = true;
          setStorm(true);
          setFlightStatus("Sheltering from the 4 p.m. thunderstorm…");
        }
        if (stormStart !== null) {
          if (now - stormStart < 4200) stormPause += dt;
          else {
            stormDone = true;
            stormNow = false;
            setStorm(false);
            lastSeg = -1;
          }
        }
      }
      const p = Math.min(1, (now - t0 - stormPause) / dur);
      if (farRef.current) farRef.current.style.transform = `translateX(${-p * 520}px)`;
      if (midRef.current) midRef.current.style.transform = `translateX(${-p * 1640}px)`;
      if (nearRef.current) nearRef.current.style.transform = `translateX(${-p * 2520}px)`;
      const bob = Math.sin(now / 620) * 9;
      const sway = Math.sin(now / 1400) * 8;
      const tilt = Math.sin(now / 900) * 3 - 4;
      if (droneRef.current)
        droneRef.current.style.transform =
          `translate(-50%,-50%) translate(${sway}px,${bob}px) rotate(${tilt}deg)`;
      if (fillRef.current) fillRef.current.style.width = `${(p * 100).toFixed(1)}%`;
      if (!stormNow) {
        let si = 0;
        for (let i = 0; i < FLIGHT_SEGMENTS.length; i++) {
          if (p >= FLIGHT_SEGMENTS[i].p) si = i;
        }
        if (si !== lastSeg) {
          lastSeg = si;
          setFlightStatus(FLIGHT_SEGMENTS[si].t);
        }
      }
      if (p >= 1) {
        stopFlight();
        setScreen("nonarrival");
        window.setTimeout(() => startNA(), 80);
      }
    };
    flightInt.current = window.setInterval(tick, 16);
  }, [stopFlight, startNA]);

  const selectDish = useCallback((id: string) => {
    vibe(8);
    stopFlight();
    clearNA();
    setScreen("dish");
    setDishId(id);
  }, [stopFlight, clearNA]);

  const goCart = useCallback(() => { vibe(8); setScreen("cart"); }, []);
  const backHome = useCallback(() => { stopFlight(); clearNA(); setScreen("home"); }, [stopFlight, clearNA]);
  const goProfile = useCallback(() => { vibe(8); stopFlight(); clearNA(); setScreen("profile"); }, [stopFlight, clearNA]);
  const backToDish = useCallback(() => setScreen("dish"), []);
  const restart = useCallback(() => { vibe(8); stopFlight(); clearNA(); setScreen("home"); }, [stopFlight, clearNA]);

  const sendDrone = useCallback(() => {
    vibe([12, 28, 12, 40]);
    setConfettiOn(true);
    window.setTimeout(() => {
      setConfettiOn(false);
      setScreen("flight");
      window.setTimeout(() => startFlight(), 80);
    }, 1150);
  }, [startFlight]);

  const commitPayoff = useCallback(() => {
    const saved = dish.price;
    const kcal = dish.kcal;
    const from = lifetime;
    const to = from + saved;
    const nextFlights = flights + 1;
    const nextKcal = totalKcal + kcal;
    const nextFaves = { ...faves, [dish.id]: (faves[dish.id] || 0) + 1 };
    try {
      localStorage.setItem("drop_lifetime", String(to));
      localStorage.setItem("drop_flights", String(nextFlights));
      localStorage.setItem("drop_kcal", String(nextKcal));
      localStorage.setItem("drop_faves", JSON.stringify(nextFaves));
    } catch {
      /* ignore */
    }
    setLifetime(to);
    setFlights(nextFlights);
    setTotalKcal(nextKcal);
    setFaves(nextFaves);
    const start = performance.now();
    const cdur = 1500;
    if (countInt.current) clearInterval(countInt.current);
    countInt.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / cdur);
      const e = 1 - Math.pow(1 - t, 3);
      setSavedAnim(saved * e);
      setKcalAnim(kcal * e);
      setLifetimeAnim(from + saved * e);
      if (t >= 1 && countInt.current) {
        clearInterval(countInt.current);
        countInt.current = null;
      }
    }, 16);
  }, [dish, lifetime, flights, totalKcal, faves]);

  const goPayoff = useCallback(() => {
    vibe(8);
    setScreen("payoff");
    window.setTimeout(() => commitPayoff(), 0);
  }, [commitPayoff]);

  // Mount: hydrate from localStorage, rotate presence, keep the phone fitted.
  useEffect(() => {
    // localStorage is client-only, so hydration must run post-mount to avoid an
    // SSR/client mismatch — the one render this triggers is the intended cost.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLifetime((v) => loadInt("drop_lifetime", v));
    setLifetimeAnim((v) => loadInt("drop_lifetime", v));
    setFlights((v) => loadInt("drop_flights", v));
    setTotalKcal((v) => loadInt("drop_kcal", v));
    try {
      const raw = localStorage.getItem("drop_faves");
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === "object") setFaves(o);
      }
    } catch {
      /* ignore */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const presenceTimer = window.setInterval(
      () => setPresenceIdx((i) => (i + 1) % presenceLines.length),
      3400,
    );
    return () => {
      clearInterval(presenceTimer);
      if (countInt.current) clearInterval(countInt.current);
      stopFlight();
      clearNA();
    };
  }, [stopFlight, clearNA]);

  const favorites = useMemo(() => {
    const ranked = dishes
      .map((d) => ({ d, count: faves[d.id] || 0 }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    const max = ranked.length ? ranked[0].count : 1;
    return ranked.map((x, i) => ({
      id: x.d.id, name: x.d.name, c1: x.d.c1, c2: x.d.c2, c3: x.d.c3,
      count: x.count + (x.count === 1 ? " time" : " times"),
      rank: String(i + 1),
      pct: Math.round((x.count / max) * 100),
      onSelect: () => selectDish(x.d.id),
    }));
  }, [faves, selectDish]);

  const dishCards = useMemo(
    () => dishes.map((d) => ({
      id: d.id, name: d.name, tag: d.tag, rating: d.rating,
      c1: d.c1, c2: d.c2, c3: d.c3, priceFmt: fmt(d.price),
      onSelect: () => selectDish(d.id),
    })),
    [selectDish],
  );

  const dishE = useMemo(
    () => ({
      ...dish,
      priceFmt: fmt(dish.price),
      kcalFmt: dish.kcal.toLocaleString("en-US") + " kcal",
    }),
    [dish],
  );

  const view = {
    screen,
    dish: dishE,
    dishCards,
    favorites,
    presence: presenceLines[presenceIdx % presenceLines.length],
    flightStatus,
    storm,
    confettiOn,
    naStatus,
    naShowBtn,
    scene,
    savedFmt: fmt(savedAnim),
    kcalFmt: Math.round(kcalAnim).toLocaleString("en-US") + " kcal",
    lifetimeFmt: fmt(lifetimeAnim),
    profileFlights: flights.toLocaleString("en-US"),
    profileKcal:
      totalKcal >= 1000
        ? (totalKcal / 1000).toFixed(1).replace(/\.0$/, "") + "k"
        : String(totalKcal),
    profileSaved: "Rs. " + Math.round(lifetime).toLocaleString("en-US"),
    handlers: { selectDish, goCart, backHome, goProfile, backToDish, sendDrone, goPayoff, restart },
  };

  const refs = {
    far: farRef, mid: midRef, near: nearRef,
    drone: droneRef, fill: fillRef, naDrone: naDroneRef, naParcel: naParcelRef,
  };

  return [view, refs] as const;
}

export type DropVM = ReturnType<typeof useDrop>[0];
export type DropRefs = ReturnType<typeof useDrop>[1];
