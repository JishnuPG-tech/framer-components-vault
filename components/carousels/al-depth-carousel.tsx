// Copyright AL Webdesign Studio · https://alwebdesignstudio.com/
import * as React from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

type Photo = { src?: string; srcSet?: string; alt?: string };
type Entry = { photo?: Photo; description?: string };
interface Props {
  photos?: Entry[];
  navigationFont?: React.CSSProperties;
  background?: string;
  cornerRadius?: number;
  cardSize?: number;
  gap?: number;
  yaw?: number;
  perspective?: number;
  glide?: number;
  fog?: number;
  autoPlay?: boolean;
  idleTime?: number;
  interval?: number;
  reducedMotion?: boolean;
  fullViewport?: boolean;
  showReload?: boolean;
  showPause?: boolean;
  showLibrary?: boolean;
  libraryLink?: string;
  price?: string;
  style?: React.CSSProperties;
}
const DEFAULTS: Entry[] = [
  {
    photo: {
      src: "https://framerusercontent.com/images/tptKfEFi2LgChmsBUiV3Hui7tM.webp",
    },
    description: "Awake newborn in a pale wrap in a basket with greenery",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/sQRWoeblTM8WJ19fldUq3Goi6UQ.webp",
    },
    description: "Newborn wrapped in beige fabric on a fluffy cushion",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/vWx7BGzcWb8mXa2jGTJm6JYq0A.webp",
    },
    description: "Awake newborn in a blue wrap in a fern-lined basket",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/MzxDZv5DbLFaB3VoRowP4pxd89Q.webp",
    },
    description: "Smiling baby nestled in a blue fabric swing",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/NO1gNg6xAAQ2anId7Rc4zvfiLXE.webp",
    },
    description: "Sleeping baby in a white bear bonnet beside a knitted teddy",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/ytOErIu91DR7nKr1B3FvbwyUCE.webp",
    },
    description: "Sleeping newborn in a dark green wrap in a wooden basket",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/HaLHrW1HpmKSjtGD8nLI5k26I.webp",
    },
    description: "Smiling newborn in a long knit cap beside a white teddy",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/Lps6kIe2Yk3Wa8KbjxNeu6A4c.webp",
    },
    description: "Sleeping newborn in a cream hood supported by an adult hand",
  },
  {
    photo: {
      src: "https://framerusercontent.com/images/UP3q0jq1Lc9euqJxqR3nWfQ6k.webp",
    },
    description: "Sleeping newborn in a yellow wrap and floral headband",
  },
];
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const wrap = (x: number, n: number) => ((x % n) + n) % n;
const css = `
[data-al-dc]{outline:none;overscroll-behavior:none;touch-action:pinch-zoom;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:grab}
[data-al-dc][data-dragging="true"],[data-al-dc][data-dragging="true"] .al-dc-card{cursor:grabbing}
[data-al-dc] .al-dc-view{position:absolute;inset:0;perspective-origin:50% 50%}
[data-al-dc] .al-dc-drum{position:absolute;transform-style:preserve-3d}
[data-al-dc] .al-dc-card{position:absolute;inset:0;margin:0;padding:0;border:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;cursor:pointer;appearance:none;background:#f3f2f0;box-shadow:0 3px 14px rgba(74,67,57,.07)}
[data-al-dc] .al-dc-photo{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none;-webkit-user-drag:none}
[data-al-dc] .al-dc-fog{position:absolute;inset:0;pointer-events:none;background:var(--dc-background)}
[data-al-dc] .al-dc-card:focus-visible::after{content:"";position:absolute;left:calc(50% - 16px);bottom:10px;width:32px;height:2px;background:#62615e;box-shadow:0 0 0 2px rgba(255,255,255,.8)}
[data-al-dc]:focus-visible::after{content:"";position:absolute;width:32px;height:2px;left:calc(50% - 16px);bottom:74px;background:#817d77;pointer-events:none}
[data-al-dc] button,[data-al-dc] a{outline:none;-webkit-tap-highlight-color:transparent}
[data-al-dc] .al-dc-control:focus-visible,[data-al-dc] .al-dc-library a:focus-visible{outline:2px solid #77736e;outline-offset:4px}
[data-al-dc] .al-dc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
`;
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function ALDepthCarousel(props: Props) {
  const {
    photos = DEFAULTS,
    navigationFont,
    background = "#FFFFFF",
    cornerRadius = 6,
    cardSize = 1,
    gap = 0.06,
    yaw = -10,
    perspective = 2.6,
    glide = 0.085,
    fog = 0.95,
    autoPlay = true,
    idleTime = 5,
    interval = 3.6,
    reducedMotion = false,
    fullViewport = true,
    showReload = true,
    showPause = true,
    showLibrary = false,
    libraryLink = "/",
    price = "Free",
    style,
  } = props;
  const isStatic = useIsStaticRenderer(),
    uid = React.useId().replace(/:/g, "");
  const host = React.useRef<HTMLElement>(null),
    view = React.useRef<HTMLDivElement>(null),
    drum = React.useRef<HTMLDivElement>(null),
    cards = React.useRef<(HTMLElement | null)[]>([]),
    fogs = React.useRef<(HTMLSpanElement | null)[]>([]),
    images = React.useRef<(HTMLImageElement | null)[]>([]),
    status = React.useRef<HTMLSpanElement>(null);
  const api = React.useRef({ restart: () => {}, choose: (_i: number) => {}, togglePause: () => {} }),
    [systemReduced, setSystemReduced] = React.useState(false);
  const reduced = reducedMotion || systemReduced;
  const [pausedUI, setPausedUI] = React.useState(false);
  const retained = React.useRef<null | {
    signature: string; current: number; target: number; lean: number; push: number;
    ready: boolean; paused: boolean; inputAge: number; autoAge: number; frames: number;
  }>(null);
  const signature = JSON.stringify(photos.map((p) => [
    p.photo?.src, p.photo?.srcSet, p.photo?.alt, p.description,
  ]));
  const items = React.useMemo(() => {
    const a = photos
      .map((p, i) => ({
        ...p,
        photo: p.photo?.src
          ? p.photo
          : p.description === DEFAULTS[i]?.description
            ? DEFAULTS[i].photo
            : undefined,
      }))
      .filter((p) => p.photo?.src);
    return a.length ? a : DEFAULTS;
  }, [signature]);
  const slots = React.useMemo(
    () => (items.length === 2 ? [...items, ...items] : items),
    [items],
  );
  React.useEffect(() => {
    if (isStatic) return;
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(q.matches);
    change();
    q.addEventListener("change", change);
    return () => q.removeEventListener("change", change);
  }, [isStatic]);
  React.useEffect(() => {
    const h = host.current,
      v = view.current,
      d = drum.current;
    if (!h || !v || !d) return;
    const buttons = cards.current.slice(0, slots.length),
      mist = fogs.current.slice(0, slots.length),
      imgs = images.current.slice(0, slots.length);
    const n = slots.length,
      step = n > 1 ? (2 * Math.PI) / n : 0,
      degrees = n > 1 ? 360 / n : 0;
    const saved = retained.current?.signature === signature ? retained.current : null;
    let alive = true,
      ready = isStatic || (saved?.ready ?? false),
      raf = 0,
      last = 0,
      current = saved?.current ?? (isStatic || reduced || n === 1 ? 0 : -2.4),
      target = saved?.target ?? 0,
      lean = saved?.lean ?? 0,
      push = saved?.push ?? 0,
      radius = 0,
      stepPx = 1,
      width = 0,
      height = 0,
      autoTimer = 0,
      wheelTimer = 0,
      loadTimer = 0,
      loadGeneration = 0,
      inside = true,
      paused = saved?.paused ?? false,
      lastInput = performance.now() - (saved?.inputAge ?? 0),
      lastAuto = performance.now() - (saved?.autoAge ?? 0),
      front = -1,
      frames = saved?.frames ?? 0,
      announce = false;
    let suspendedAt: number | null = null;
    setPausedUI(paused);
    type Drag = {
      id: number;
      y: number;
      target: number;
      moved: number;
      index: number;
      samples: { t: number; y: number }[];
    };
    let drag: Drag | null = null;
    let removeLoads: () => void = () => {};
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      clearTimeout(autoTimer);
      autoTimer = 0;
    };
    const present = () => {
      d.style.transform =
        n === 1
          ? "none"
          : `translate3d(0,0,${-push}px) rotateY(${yaw + lean}deg) translateZ(${-radius}px) rotateX(${current * degrees}deg)`;
      const next = wrap(Math.round(current), n);
      buttons.forEach((b, i) => {
        if (!b) return;
        const angle = (i - current) * step,
          cosine = n === 1 ? 1 : Math.cos(angle);
        const visible = cosine >= -0.05;
        b.style.visibility = visible ? "visible" : "hidden";
        if (mist[i])
          mist[i]!.style.opacity = String(clamp((1 - cosine) * fog, 0, 1));
        if (!isStatic && front !== next) {
          b.tabIndex = i === next ? 0 : -1;
          b.setAttribute(
            "aria-label",
            `${i === next ? "Next photograph. Current" : "Show photograph"} ${(i % items.length) + 1} of ${items.length}: ${slots[i].description ?? slots[i].photo?.alt ?? ""}`,
          );
          b.setAttribute("aria-current", i === next ? "true" : "false");
        }
      });
      front = next;
      h.dataset.current = current.toFixed(4);
      h.dataset.target = target.toFixed(4);
      h.dataset.front = String(next % items.length);
      h.dataset.frames = String(++frames);
      h.dataset.lean = lean.toFixed(3);
      h.dataset.push = push.toFixed(3);
    };
    const schedule = () => {
      clearTimeout(autoTimer);
      autoTimer = 0;
      if (
        !alive ||
        isStatic ||
        reduced ||
        !autoPlay ||
        paused ||
        !inside ||
        document.hidden ||
        drag ||
        !ready ||
        n === 1
      )
        return;
      const due = Math.max(
        lastInput + Math.max(1, idleTime) * 1000,
        lastAuto + Math.max(1, interval) * 1000,
      );
      autoTimer = window.setTimeout(
        () => {
          autoTimer = 0;
          if (!alive || paused || !inside || document.hidden || drag) return;
          lastAuto = performance.now();
          target = Math.round(target) + 1;
          wake();
        },
        Math.max(0, due - performance.now()),
      );
    };
    const settled = () =>
      Math.abs(current - target) < 0.0004 &&
      Math.abs(lean) < 0.001 &&
      Math.abs(push) < 0.01;
    const tick = (now: number) => {
      raf = 0;
      if (!alive || isStatic || !ready || !inside || document.hidden) return;
      const dt = last ? clamp(now - last, 0, 64) / (1000 / 60) : 1;
      last = now;
      const ease = reduced ? 1 : 1 - Math.pow(1 - clamp(glide, 0.02, 0.3), dt);
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.0004) current = target;
      const remaining = target - current,
        k = reduced ? 1 : 1 - Math.pow(0.92, dt);
      lean += ((reduced ? 0 : clamp(remaining * 7, -9, 9)) - lean) * k;
      push +=
        ((reduced ? 0 : Math.min(Math.abs(remaining) * 70, 150)) - push) * k;
      const resting = settled();
      if (resting) {
        current = target;
        lean = 0;
        push = 0;
        if (Math.abs(current) > n * 100) {
          const turns = Math.trunc(current / n) * n;
          current -= turns;
          target -= turns;
        }
      }
      present();
      h.dataset.state = paused
        ? "paused"
        : drag
          ? "dragging"
          : resting
            ? "idle"
            : "moving";
      if (resting && !drag) {
        last = 0;
        if (announce && status.current) {
          status.current.textContent = `Photograph ${(front % items.length) + 1} of ${items.length}: ${slots[front].description ?? slots[front].photo?.alt ?? ""}`;
          announce = false;
        }
        schedule();
      } else raf = requestAnimationFrame(tick);
    };
    function wake() {
      if (!alive || isStatic || !ready || !inside || document.hidden || raf)
        return;
      clearTimeout(autoTimer);
      autoTimer = 0;
      last = 0;
      raf = requestAnimationFrame(tick);
    }
    const touched = () => {
      lastInput = performance.now();
      lastAuto = lastInput;
      clearTimeout(autoTimer);
      autoTimer = 0;
      announce = true;
    };
    const stepBy = (delta: number) => {
      if (n === 1 || !ready || isStatic) return;
      touched();
      target = Math.round(target) + delta;
      wake();
    };
    const choose = (index: number) => {
      if (n === 1 || !ready || isStatic) return;
      touched();
      const base = Math.round(target);
      let delta = wrap(index - wrap(base, n), n);
      if (delta > n / 2) delta -= n;
      target = base + (delta === 0 ? 1 : delta);
      wake();
    };
    const release = () => {
      if (drag && h.hasPointerCapture(drag.id))
        h.releasePointerCapture(drag.id);
      drag = null;
      h.dataset.dragging = "false";
    };
    const layout = () => {
      const r = h.getBoundingClientRect();
      const w = Math.round(r.width),
        hh = Math.round(r.height);
      if (!w || !hh || (width === w && height === hh)) return;
      width = w;
      height = hh;
      const desired =
        width <= 700
          ? Math.min(width * 0.84, 520, height * 0.64)
          : Math.min(width * 0.36, 560, height * 0.64);
      const cw = Math.max(
          40,
          Math.min(width * 0.9, desired * clamp(cardSize, 0.5, 1.5)),
        ),
        ch = cw / 1.5;
      d.style.width = `${cw}px`;
      d.style.height = `${ch}px`;
      d.style.left = `${(width - cw) / 2}px`;
      d.style.top = `${(height - ch) / 2}px`;
      radius =
        n > 1
          ? (ch * (1 + clamp(gap, 0, 0.3))) / (2 * Math.tan(Math.PI / n))
          : 0;
      stepPx = Math.max(1, radius * step);
      v.style.perspective = `${Math.max(1, radius * clamp(perspective, 1.8, 5))}px`;
      buttons.forEach((b, i) => {
        if (b)
          b.style.transform =
            n > 1
              ? `rotateX(${-i * degrees}deg) translateZ(${radius}px)`
              : "none";
      });
      if (drag) {
        release();
        target = Math.round(target);
      }
      present();
      wake();
    };
    const preload = () => {
      ++loadGeneration;
      const token = loadGeneration;
      clearTimeout(loadTimer);
      removeLoads();
      ready = false;
      h.dataset.state = "loading";
      const listeners: { img: HTMLImageElement; fn: () => void }[] = [];
      const waits = imgs.map((img) => {
        if (!img) return Promise.resolve();
        return new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          listeners.push({ img, fn: done });
        }).then(() =>
          img.naturalWidth && img.decode
            ? img.decode().catch(() => {})
            : undefined,
        );
      });
      removeLoads = () =>
        listeners.forEach(({ img, fn }) => {
          img.removeEventListener("load", fn);
          img.removeEventListener("error", fn);
        });
      const start = () => {
        if (!alive || token !== loadGeneration || ready) return;
        clearTimeout(loadTimer);
        removeLoads();
        ready = true;
        lastInput = performance.now();
        lastAuto = lastInput;
        wake();
      };
      loadTimer = window.setTimeout(start, 8000);
      Promise.all(waits).then(start);
    };
    const restart = () => {
      if (isStatic) return;
      stop();
      clearTimeout(wheelTimer);
      release();
      paused = false;
      setPausedUI(false);
      current = reduced || n === 1 ? 0 : -2.4;
      target = 0;
      lean = 0;
      push = 0;
      announce = false;
      present();
      preload();
    };
    const setPaused = (value: boolean) => {
      paused = value;
      setPausedUI(value);
      touched();
      release();
      clearTimeout(wheelTimer);
      target = Math.round(current);
      if (status.current) status.current.textContent = value ? "Automatic playback paused." : "Automatic playback resumed.";
      announce = false;
      wake();
    };
    api.current = { restart, choose, togglePause: () => setPaused(!paused) };
    const excluded = (e: Event) => {
      const t = e.target as HTMLElement;
      return Boolean(t.closest("a,nav,.al-dc-control"));
    };
    const wheel = (e: WheelEvent) => {
      if (isStatic || !ready || excluded(e) || e.ctrlKey || n === 1) return;
      e.preventDefault();
      touched();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1;
      const delta =
        (Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * unit;
      target = clamp(target + delta / 360, current - 2.5, current + 2.5);
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        target = Math.round(target);
        wake();
      }, 160);
      wake();
    };
    const down = (e: PointerEvent) => {
      if (
        isStatic ||
        !ready ||
        excluded(e) ||
        e.button !== 0 ||
        !e.isPrimary ||
        n === 1
      )
        return;
      e.preventDefault();
      touched();
      clearTimeout(wheelTimer);
      const b = (e.target as HTMLElement).closest("button.al-dc-card");
      drag = {
        id: e.pointerId,
        y: e.clientY,
        target,
        moved: 0,
        index: buttons.indexOf(b as HTMLElement),
        samples: [{ t: e.timeStamp, y: e.clientY }],
      };
      h.setPointerCapture(e.pointerId);
      h.focus({ preventScroll: true });
    };
    const move = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      touched();
      const dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dy));
      if (drag.moved > 6) h.dataset.dragging = "true";
      target = drag.target - dy / stepPx;
      drag.samples.push({ t: e.timeStamp, y: e.clientY });
      while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100)
        drag.samples.shift();
      wake();
    };
    const up = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const a = drag;
      touched();
      release();
      if (a.moved <= 6) {
        if (e.type !== "pointercancel" && a.index >= 0) choose(a.index);
      } else {
        const first = a.samples[0],
          last = a.samples[a.samples.length - 1],
          velocity = (last.y - first.y) / Math.max(1, last.t - first.t);
        target = Math.round(
          target +
            (e.type === "pointercancel"
              ? 0
              : clamp((-velocity * 260) / stepPx, -3, 3)),
        );
      }
      wake();
    };
    const lost = (e: PointerEvent) => {
      if (drag?.id === e.pointerId) {
        drag = null;
        h.dataset.dragging = "false";
        target = Math.round(target);
        wake();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isStatic) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setPaused(true);
        return;
      }
      if (excluded(e)) return;
      const next = ["ArrowDown", "ArrowRight", "PageDown", " "],
        prev = ["ArrowUp", "ArrowLeft", "PageUp"];
      if (next.includes(e.key)) {
        e.preventDefault();
        stepBy(1);
      } else if (prev.includes(e.key)) {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        touched();
        const index = e.key === "Home" ? 0 : n - 1;
        const base = Math.round(target);
        let delta = wrap(index - wrap(base, n), n);
        if (delta > n / 2) delta -= n;
        target = base + delta;
        wake();
      } else if (e.key === "Enter" && e.target === h) {
        e.preventDefault();
        restart();
      }
    };
    const visibility = () => {
      if (!inside || document.hidden) {
        if (suspendedAt === null) suspendedAt = performance.now();
        stop();
        h.dataset.state = "suspended";
        if (drag) {
          release();
          target = Math.round(target);
        }
      } else {
        if (suspendedAt !== null) {
          const hiddenFor = performance.now() - suspendedAt;
          lastInput += hiddenFor;
          lastAuto += hiddenFor;
          suspendedAt = null;
        }
        wake();
      }
    };
    const ro = new ResizeObserver(layout);
    ro.observe(h);
    layout();
    if (isStatic) {
      current = 0;
      target = 0;
      present();
      h.dataset.state = "static";
      return () => { alive = false; ro.disconnect(); };
    }
    const io = new IntersectionObserver((entries) => {
      inside = entries[0]?.isIntersecting ?? true;
      visibility();
    });
    io.observe(h);
    h.addEventListener("wheel", wheel, { passive: false });
    h.addEventListener("pointerdown", down);
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
    h.addEventListener("pointercancel", up);
    h.addEventListener("lostpointercapture", lost);
    h.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    if (!ready) preload();
    else wake();
    return () => {
      const now = suspendedAt ?? performance.now();
      retained.current = {
        signature, current, target: drag ? Math.round(target) : target, lean, push,
        ready, paused, inputAge: now - lastInput, autoAge: now - lastAuto, frames,
      };
      alive = false;
      ++loadGeneration;
      stop();
      release();
      clearTimeout(wheelTimer);
      clearTimeout(loadTimer);
      removeLoads();
      ro.disconnect();
      io.disconnect();
      h.removeEventListener("wheel", wheel);
      h.removeEventListener("pointerdown", down);
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", up);
      h.removeEventListener("pointercancel", up);
      h.removeEventListener("lostpointercapture", lost);
      h.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [
    slots,
    items,
    isStatic,
    reduced,
    gap,
    yaw,
    perspective,
    glide,
    fog,
    cardSize,
    autoPlay,
    idleTime,
    interval,
  ]);
  const Card = isStatic ? "div" : "button";
  const pill: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,.92)",
    color: "#62615E",
    border: "1px solid rgba(0,0,0,.13)",
    borderRadius: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,.04)",
    WebkitTapHighlightColor: "transparent",
  };
  return (
    <section
      ref={host}
      data-al-dc=""
      data-reduced={reduced}
      data-al-demo-viewport={
        fullViewport && showLibrary && !isStatic ? "true" : undefined
      }
      aria-label="Depth Carousel"
      aria-roledescription="carousel"
      aria-describedby={isStatic ? undefined : `${uid}-hint`}
      tabIndex={isStatic ? undefined : 0}
      style={
        {
          ...style,
          position: "relative",
          width: style?.width ?? "100%",
          height: fullViewport && !isStatic ? "100dvh" : (style?.height ?? 900),
          minHeight: 160,
          overflow: "clip",
          isolation: "isolate",
          background,
          fontFamily: "Inter, sans-serif",
          "--dc-background": background,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div ref={view} className="al-dc-view">
        <div ref={drum} className="al-dc-drum">
          {slots.map((p, i) => (
            <Card
              type={isStatic ? undefined : "button"}
              key={i}
              ref={(e: HTMLButtonElement | HTMLDivElement | null) => {
                cards.current[i] = e;
              }}
              className="al-dc-card"
              style={{ borderRadius: cornerRadius }}
              tabIndex={isStatic ? undefined : i === 0 ? 0 : -1}
              aria-label={isStatic ? undefined : `Show photograph ${(i % items.length) + 1} of ${items.length}: ${p.description ?? p.photo?.alt ?? ""}`}
              onClick={isStatic ? undefined : (e) => {
                if (e.detail === 0) api.current.choose(i);
              }}
            >
              <img
                ref={(e) => {
                  images.current[i] = e;
                }}
                className="al-dc-photo"
                src={p.photo?.src}
                alt={p.description ?? p.photo?.alt ?? ""}
                draggable={false}
                decoding="async"
              />
              <span
                ref={(e) => {
                  fogs.current[i] = e;
                }}
                className="al-dc-fog"
                aria-hidden="true"
              />
            </Card>
          ))}
        </div>
      </div>
      {!isStatic && <span id={`${uid}-hint`} className="al-dc-sr">
        Drag vertically, scroll, or use the arrow keys to explore. Space
        advances, Home and End select the first and last photograph. Escape
        pauses automatic playback. Enter on the scene or Restart animation
        starts again.
      </span>}
      <span ref={status} className="al-dc-sr" role="status" />
      {showPause && autoPlay && items.length > 1 && !reduced && !isStatic && (
        <button type="button" className="al-dc-control"
          aria-label={pausedUI ? "Resume autoplay" : "Pause autoplay"}
          title={pausedUI ? "Resume autoplay" : "Pause autoplay"}
          onClick={() => api.current.togglePause()}
          style={{ ...pill, position: "absolute", right: showReload ? 94 : 16,
            top: "max(16px,env(safe-area-inset-top))", width: 44, height: 44,
            padding: 0, cursor: "pointer", zIndex: 5 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {pausedUI ? <path d="M8 5v14l11-7Z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}
          </svg>
        </button>
      )}
      {showReload && !isStatic && (
        <button
          type="button"
          aria-label={"Restart animation"}
          title={"Restart animation"}
          className="al-dc-control"
          onClick={() => api.current.restart()}
          style={{
            ...pill,
            position: "absolute",
            right: 16,
            top: "max(16px,env(safe-area-inset-top))",
            width: 68,
            height: 44,
            padding: 0,
            cursor: "pointer",
            zIndex: 5,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <linearGradient
                id={`${uid}-reload-top`}
                x1="24"
                y1="8"
                x2="24"
                y2="37"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id={`${uid}-reload-bottom`}
                x1="24"
                y1="40"
                x2="24"
                y2="11"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="currentColor" />
                <stop offset=".38" stopColor="currentColor" stopOpacity=".94" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M27 8.3A16 16 0 0 1 35.3 35.3"
              stroke={`url(#${uid}-reload-top)`}
              strokeWidth="4.5"
            />
            <path
              d="M21 39.7A16 16 0 0 1 12.7 12.7"
              stroke={`url(#${uid}-reload-bottom)`}
              strokeWidth="4.5"
            />
            <path
              d="M18 8.3 28 2.3v12Z M30 39.7 20 45.7v-12Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
      {showLibrary && !isStatic && (
        <nav
          className="al-dc-library"
          aria-label="Library"
          style={{
            ...pill,
            position: "absolute",
            left: 20,
            bottom: "max(20px,env(safe-area-inset-bottom))",
            height: 38,
            padding: "0 16px",
            gap: 14,
            border: 0,
            zIndex: 5,
            fontSize: 14,
            ...navigationFont,
          }}
        >
          <a
            href={libraryLink || "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m15 5-7 7 7 7" />
            </svg>
            Library
          </a>
          <span style={{ fontWeight: 600 }}>{price}</span>
        </nav>
      )}
    </section>
  );
}
addPropertyControls(ALDepthCarousel, {
  photos: {
    type: ControlType.Array,
    title: "Photos",
    defaultValue: DEFAULTS,
    maxCount: 20,
    control: {
      type: ControlType.Object,
      controls: {
        photo: { type: ControlType.ResponsiveImage, title: "Photo" },
        description: {
          type: ControlType.String,
          title: "Description",
          defaultValue: "",
        },
      },
    },
  },
  navigationFont: {
    type: ControlType.Font,
    title: "Navigation Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.2em" },
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#FFFFFF",
  },
  cornerRadius: {
    type: ControlType.Number,
    title: "Corners",
    defaultValue: 6,
    min: 0,
    max: 40,
    step: 1,
  },
  cardSize: {
    type: ControlType.Number,
    title: "Card Size",
    defaultValue: 1,
    min: 0.5,
    max: 1.5,
    step: 0.05,
  },
  gap: {
    type: ControlType.Number,
    title: "Card Gap",
    defaultValue: 0.06,
    min: 0,
    max: 0.3,
    step: 0.01,
  },
  yaw: {
    type: ControlType.Number,
    title: "Side Angle",
    defaultValue: -10,
    min: -25,
    max: 25,
    step: 1,
    unit: "°",
  },
  perspective: {
    type: ControlType.Number,
    title: "Perspective",
    defaultValue: 2.6,
    min: 1.8,
    max: 5,
    step: 0.1,
  },
  glide: {
    type: ControlType.Number,
    title: "Glide",
    defaultValue: 0.085,
    min: 0.02,
    max: 0.3,
    step: 0.005,
  },
  fog: {
    type: ControlType.Number,
    title: "Mist",
    defaultValue: 0.95,
    min: 0,
    max: 1.5,
    step: 0.05,
  },
  autoPlay: {
    type: ControlType.Boolean,
    title: "Autoplay",
    defaultValue: true,
  },
  idleTime: {
    type: ControlType.Number,
    title: "Idle Delay",
    defaultValue: 5,
    min: 1,
    max: 20,
    step: 0.5,
    unit: "s",
    hidden: (p) => !p.autoPlay,
  },
  interval: {
    type: ControlType.Number,
    title: "Interval",
    defaultValue: 3.6,
    min: 1,
    max: 15,
    step: 0.1,
    unit: "s",
    hidden: (p) => !p.autoPlay,
  },
  fullViewport: {
    type: ControlType.Boolean,
    title: "Full Viewport",
    defaultValue: true,
  },
  showPause: { type: ControlType.Boolean, title: "Show Pause", defaultValue: true },
  showReload: {
    type: ControlType.Boolean,
    title: "Show Reload",
    defaultValue: true,
  },
  showLibrary: {
    type: ControlType.Boolean,
    title: "Show Library",
    defaultValue: false,
  },
  libraryLink: {
    type: ControlType.Link,
    title: "Library Link",
    defaultValue: "/",
  },
  price: { type: ControlType.String, title: "Price", defaultValue: "Free" },
  reducedMotion: {
    type: ControlType.Boolean,
    title: "Reduced Motion",
    defaultValue: false,
  },
});
