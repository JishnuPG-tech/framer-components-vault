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

type ImageValue = { src?: string; srcSet?: string; alt?: string };
type Slide = {
  landscape?: ImageValue;
  portrait?: ImageValue;
  landscapeAlt?: string;
  portraitAlt?: string;
  title?: string;
  tag?: string;
  caption?: string;
  focusX?: number;
  focusY?: number;
};
interface Props {
  slides?: Slide[];
  titleFont?: React.CSSProperties;
  captionFont?: React.CSSProperties;
  metaFont?: React.CSSProperties;
  navigationFont?: React.CSSProperties;
  background?: string;
  textColor?: string;
  mutedColor?: string;
  corners?: number;
  gutter?: number;
  shade?: number;
  veil?: number;
  zoom?: number;
  scrollDistance?: number;
  smoothing?: number;
  reducedMotion?: boolean;
  fullViewport?: boolean;
  showReload?: boolean;
  showLibrary?: boolean;
  libraryLink?: string;
  price?: string;
  style?: React.CSSProperties;
}
const DEFAULTS: Slide[] = [
  {
    landscape: {
      src: "https://framerusercontent.com/images/H0g76woB4lIFrsipxh7W9juvK0M.webp",
    },
    landscapeAlt: "Sleeping newborn in a cream bonnet and wrap",
    portrait: {
      src: "https://framerusercontent.com/images/Qy1YbhrKPI8udD25CsgbsyeydM.webp",
    },
    portraitAlt: "Sleeping newborn in a knit bonnet and cream wrap",
    title: "COZY CUDDLES",
    tag: "SOFT KNITS",
    caption: "WRAPPED IN WARMTH.",
    focusX: 50,
    focusY: 45,
  },
  {
    landscape: {
      src: "https://framerusercontent.com/images/xH4c3E8W0ijFfcFzdZIJKVWTo0.webp",
    },
    landscapeAlt: "Awake baby in a cream cap between two toy rabbits",
    portrait: {
      src: "https://framerusercontent.com/images/M6oiYdJjpawpY8zBQgpZJL7wiVw.webp",
    },
    portraitAlt: "Baby held in the air reaching toward a white teddy bear",
    title: "PLAYFUL DAYS",
    tag: "SWEET COMPANY",
    caption: "A FRIEND CLOSE BY.",
    focusX: 50,
    focusY: 45,
  },
  {
    landscape: {
      src: "https://framerusercontent.com/images/0ZdT7aLPk06skh7x4bKtQQ3NZI.webp",
    },
    landscapeAlt: "Sleeping newborn in a blue cap on a pale blanket",
    portrait: {
      src: "https://framerusercontent.com/images/3LD4O7bLfWeKGBxjABMsWMbeE.webp",
    },
    portraitAlt: "Close-up of sleeping baby legs tucked into a soft blanket",
    title: "DREAMY BLUE",
    tag: "QUIET MOMENTS",
    caption: "SOFT LIGHT. TINY DETAILS.",
    focusX: 50,
    focusY: 45,
  },
  {
    landscape: {
      src: "https://framerusercontent.com/images/uRNJe6FKWcoaAqjpVLcAIUoNP00.webp",
    },
    landscapeAlt: "Sleeping newborn in grey fabric surrounded by leaves",
    portrait: {
      src: "https://framerusercontent.com/images/QbyBx8JvDmVWQa7HUlANBujA3Kk.webp",
    },
    portraitAlt:
      "Newborn wrapped in pink cloth in a basket surrounded by greenery",
    title: "GENTLE NATURE",
    tag: "CALM & COZY",
    caption: "A SOFT PLACE TO DREAM.",
    focusX: 50,
    focusY: 45,
  },
  {
    landscape: {
      src: "https://framerusercontent.com/images/ytOErIu91DR7nKr1B3FvbwyUCE.webp",
    },
    landscapeAlt: "Sleeping newborn in a dark green wrap in a wooden basket",
    portrait: {
      src: "https://framerusercontent.com/images/c7dW2n9PVqZu6ROpGsIJOJeh7nM.webp",
    },
    portraitAlt: "Smiling baby in a wicker basket with small autumn pumpkins",
    title: "WARM WISHES",
    tag: "EVERYDAY WONDER",
    caption: "MOMENTS TO HOLD CLOSE.",
    focusX: 50,
    focusY: 45,
  },
];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const inOut = (p: number, power: number) =>
  p < 0.5 ? Math.pow(p * 2, power) / 2 : 1 - Math.pow((1 - p) * 2, power) / 2;
const out = (p: number, power: number) => 1 - Math.pow(1 - p, power);
const fontScale = (f: React.CSSProperties | undefined, base: number) =>
  typeof f?.fontSize === "number"
    ? f.fontSize / base
    : typeof f?.fontSize === "string" && f.fontSize.endsWith("px")
      ? parseFloat(f.fontSize) / base
      : 1;
const css = `
[data-al-mr]{outline:none;overscroll-behavior:none;touch-action:pinch-zoom;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
[data-al-mr] *{box-sizing:border-box}
[data-al-mr] .al-mr-frame{position:absolute;inset:var(--mr-gap,24px);overflow:hidden;border-radius:var(--mr-radius);background:#e8e5e0;box-shadow:0 3px 16px rgba(66,58,49,.06)}
[data-al-mr] .al-mr-slide{position:absolute;inset:0;margin:0;overflow:hidden}
[data-al-mr] .al-mr-media,[data-al-mr] .al-mr-photo,[data-al-mr] .al-mr-blur{position:absolute;inset:0;width:100%;height:100%}
[data-al-mr] .al-mr-photo,[data-al-mr] .al-mr-blur{object-fit:cover;pointer-events:none;-webkit-user-drag:none}
[data-al-mr] .al-mr-blur{filter:blur(24px);transform:scale(1.12);opacity:.5}
[data-al-mr][data-portrait=true] .al-mr-landscape,[data-al-mr][data-portrait=false] .al-mr-portrait{display:none}
[data-al-mr] .al-mr-shade,[data-al-mr] .al-mr-veil{position:absolute;inset:0;pointer-events:none}
[data-al-mr] .al-mr-veil{background:#000;opacity:0}
[data-al-mr] .al-mr-caption{position:absolute;left:var(--mr-inset,32px);right:var(--mr-inset,32px);bottom:var(--mr-bottom,64px);display:grid;gap:var(--mr-caption-gap,9px);z-index:2}
[data-al-mr] .al-mr-line{display:block;overflow:hidden;padding-bottom:.08em}
[data-al-mr] .al-mr-line>span{display:block}
[data-al-mr] .al-mr-title{margin:0;font-weight:400;line-height:1.04;letter-spacing:-.025em;overflow-wrap:anywhere;font-size:var(--mr-title,54px)}
[data-al-mr] .al-mr-copy{margin:0;max-width:30em;font-weight:400;line-height:1.5;font-size:var(--mr-copy,13px)}
[data-al-mr] .al-mr-meta{font-weight:400;line-height:1.5;letter-spacing:.18em;font-size:var(--mr-meta,10px)}
[data-al-mr]:focus-visible::after{content:"";position:absolute;width:32px;height:2px;left:calc(50% - 16px);bottom:var(--mr-focus,74px);background:#77716b;box-shadow:0 0 0 2px rgba(255,255,255,.8);pointer-events:none;z-index:12}
[data-al-mr] button,[data-al-mr] a{outline:none;-webkit-tap-highlight-color:transparent}
[data-al-mr] button:focus-visible,[data-al-mr] a:focus-visible{outline:2px solid #77716b;outline-offset:4px}
[data-al-mr] .al-mr-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
`;
/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ALMaskReveal(props: Props) {
  const {
    slides = DEFAULTS,
    titleFont,
    captionFont,
    metaFont,
    navigationFont,
    background = "#FFFFFF",
    textColor = "#F2EEE8",
    mutedColor = "#E4DED6",
    corners = 6,
    gutter = 24,
    shade = 0.7,
    veil = 0.5,
    zoom = 1.35,
    scrollDistance = 1,
    smoothing = 6,
    reducedMotion = false,
    fullViewport = true,
    showReload = true,
    showLibrary = false,
    libraryLink = "/",
    price = "Free",
    style,
  } = props;
  const isStatic = useIsStaticRenderer(),
    uid = React.useId().replace(/:/g, "");
  const photos = React.useMemo(() => {
    const valid = slides
      .filter((s) => s.landscape?.src || s.portrait?.src)
      .slice(0, 10);
    return valid.length ? valid : DEFAULTS;
  }, [JSON.stringify(slides)]);
  const host = React.useRef<HTMLElement>(null),
    frame = React.useRef<HTMLDivElement>(null),
    figures = React.useRef<(HTMLElement | null)[]>([]),
    media = React.useRef<(HTMLDivElement | null)[]>([]),
    veils = React.useRef<(HTMLSpanElement | null)[]>([]),
    captions = React.useRef<(HTMLElement | null)[]>([]),
    lines = React.useRef<(HTMLSpanElement | null)[][]>([]),
    images = React.useRef<(HTMLImageElement | null)[][]>([]),
    status = React.useRef<HTMLSpanElement>(null);
  const model = React.useRef({ pos: 0, target: 0 }),
    restart = React.useRef(() => {});
  const fontsKey = JSON.stringify([titleFont, captionFont, metaFont]);
  React.useEffect(() => {
    const h = host.current,
      f = frame.current;
    if (!h || !f) return;
    const motion = isStatic ? null : window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedMotion || !!motion?.matches,
      visible = true,
      dead = false,
      raf = 0,
      last = 0,
      frames = 0,
      w = 0,
      height = 0,
      portrait = false,
      active = -1;
    const lead = 0.2,
      span = 1.47,
      end = photos.length > 1 ? lead + (photos.length - 1) * span : 0;
    let pos = clamp(model.current.pos, 0, end),
      target = clamp(model.current.target, 0, end);
    let drag: null | { id: number; y: number; time: number; velocity: number } =
      null;
    const present = () => {
      let current = 0;
      photos.forEach((_, i) => {
        const entry = i === 0 ? 1 : clamp(pos - (lead + (i - 1) * span)),
          exit = i === photos.length - 1 ? 0 : clamp(pos - (lead + i * span)),
          age = i === 0 ? 2 : pos - (lead + (i - 1) * span);
        let cross = 0,
          along = 0;
        if (i > 0 && entry < 1) {
          if (entry < 0.4) {
            const e = inOut(entry / 0.4, 3);
            cross = 49.5 - 8.5 * e;
            along = 50 * (1 - e);
          } else {
            cross = 41 * (1 - inOut((entry - 0.4) / 0.6, 4));
            along = 0;
          }
        }
        const x = portrait ? along : cross,
          y = portrait ? cross : along,
          el = figures.current[i],
          m = media.current[i],
          v = veils.current[i],
          c = captions.current[i];
        if (el) {
          el.style.clipPath = `inset(${y}% ${x}% round ${clamp(corners, 0, 30)}px)`;
          el.style.visibility = i > 0 && age <= 0 ? "hidden" : "visible";
          el.dataset.reveal = entry.toFixed(4);
        }
        const scale =
          reduced || isStatic
            ? 1
            : entry < 1
              ? 1 + (clamp(zoom, 1, 1.8) - 1) * (1 - out(entry, 3))
              : 1 + 0.12 * exit;
        if (m) m.style.transform = `scale(${scale})`;
        if (v) v.style.opacity = String(clamp(veil, 0, 0.65) * exit * exit);
        const gone = clamp(exit / 0.35);
        if (c) {
          c.style.opacity = String(1 - gone * gone);
          c.style.transform = `translateY(${-24 * gone * gone}px)`;
        }
        lines.current[i]?.forEach((line, j) => {
          if (line)
            line.style.transform = `translateY(${i === 0 ? 0 : 110 * (1 - out(clamp((age - 0.45 - j * 0.06) / 0.5), 4))}%)`;
        });
        if (i > 0 && entry > 0.65) current = i;
      });
      if (current !== active) {
        active = current;
        figures.current.forEach((el, i) =>
          el?.setAttribute("aria-hidden", String(i !== active)),
        );
        if (status.current)
          status.current.textContent = `Photograph ${active + 1} of ${photos.length}: ${photos[active]?.title || ""}`;
      }
      model.current = { pos, target };
      h.dataset.position = pos.toFixed(5);
      h.dataset.target = target.toFixed(5);
      h.dataset.active = String(active);
      h.dataset.frames = String(++frames);
      h.dataset.reduced = String(reduced);
      h.dataset.portrait = String(portrait);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      h.dataset.running = "false";
    };
    const tick = (now: number) => {
      raf = 0;
      if (dead || !visible || document.hidden) return;
      const dt = last ? Math.min(0.064, (now - last) / 1000) : 1 / 60;
      last = now;
      pos = reduced
        ? target
        : pos + (target - pos) * (1 - Math.exp(-clamp(smoothing, 1, 20) * dt));
      if (Math.abs(target - pos) < 0.0005) pos = target;
      present();
      if (pos !== target) {
        raf = requestAnimationFrame(tick);
        h.dataset.running = "true";
      } else stop();
    };
    const wake = () => {
      if (dead || isStatic || !visible || document.hidden || raf) return;
      if (reduced) {
        pos = target;
        present();
        stop();
      } else if (pos !== target) {
        raf = requestAnimationFrame(tick);
        h.dataset.running = "true";
      }
    };
    const moveTo = (value: number) => {
      if (isStatic) return;
      target = clamp(value, 0, end);
      model.current.target = target;
      h.dataset.target = target.toFixed(5);
      wake();
    };
    const layout = () => {
      const r = h.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      w = r.width;
      height = r.height;
      portrait = height >= w;
      const gap = Math.min(clamp(gutter, 0, 48), w * 0.045, height * 0.045),
        inset = clamp(w * 0.034, 16, 48),
        available = w - gap * 2 - inset * 2,
        short = height < 500;
      const title =
        Math.min(
          clamp(w * 0.052, 25, 82),
          Math.max(20, height * 0.11),
          available / 9.3,
        ) * fontScale(titleFont, 60);
      h.style.setProperty("--mr-gap", `${gap}px`);
      h.style.setProperty("--mr-inset", `${inset}px`);
      h.style.setProperty("--mr-title", `${title}px`);
      h.style.setProperty(
        "--mr-copy",
        `${(short ? 10 : clamp(w * 0.012, 11, 14)) * fontScale(captionFont, 14)}px`,
      );
      h.style.setProperty(
        "--mr-meta",
        `${(short ? 8 : 10) * fontScale(metaFont, 10)}px`,
      );
      h.style.setProperty("--mr-caption-gap", `${short ? 5 : 9}px`);
      h.style.setProperty(
        "--mr-bottom",
        `${showLibrary ? Math.max(68 - gap, 22) : clamp(height * 0.05, 20, 56)}px`,
      );
      h.style.setProperty("--mr-focus", `${showLibrary ? 74 : 12}px`);
      const captionHeight = Math.max(0, ...captions.current.map(c => c?.offsetHeight || 0));
      const captionBottom = showLibrary ? Math.max(68 - gap, 22) : clamp(height * 0.05, 20, 56);
      h.style.setProperty("--mr-shade-stop", `${captionBottom + captionHeight + 8}px`);
      const fr = f.getBoundingClientRect(),
        ratio = fr.width / Math.max(1, fr.height);
      images.current.forEach((pair) =>
        pair.forEach((im) => {
          if (!im?.naturalWidth) return;
          const sourceRatio = im.naturalWidth / im.naturalHeight;
          im.style.objectFit =
            Math.min(ratio / sourceRatio, sourceRatio / ratio) < 0.78
              ? "contain"
              : "cover";
        }),
      );
      present();
      wake();
    };
    const excluded = (e: Event) =>
      e.target instanceof Element &&
      !!e.target.closest("button,a,nav,input,textarea,select");
    const wheel = (e: WheelEvent) => {
      if (excluded(e) || e.ctrlKey || isStatic) return;
      e.preventDefault();
      moveTo(
        target +
          (e.deltaY *
            (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? height : 1)) /
            (Math.max(1, height) * clamp(scrollDistance, 0.25, 3)),
      );
    };
    const down = (e: PointerEvent) => {
      if (excluded(e) || !e.isPrimary || e.button !== 0 || isStatic) return;
      e.preventDefault();
      h.focus({ preventScroll: true });
      drag = { id: e.pointerId, y: e.clientY, time: e.timeStamp, velocity: 0 };
      h.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault();
      const dy = drag.y - e.clientY,
        dt = Math.max(8, e.timeStamp - drag.time);
      drag.velocity = (dy / dt) * 1000;
      drag.y = e.clientY;
      drag.time = e.timeStamp;
      moveTo(
        target + dy / (Math.max(1, height) * clamp(scrollDistance, 0.25, 3)),
      );
    };
    const release = (e?: PointerEvent) => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag;
      drag = null;
      if (e?.type === "pointerup" && !reduced && e.timeStamp - d.time < 100)
        moveTo(
          target +
            (clamp(d.velocity, -4000, 4000) * 0.35) /
              (Math.max(1, height) * clamp(scrollDistance, 0.25, 3)),
        );
      if (h.hasPointerCapture(d.id)) h.releasePointerCapture(d.id);
    };
    const key = (e: KeyboardEvent) => {
      if (excluded(e) || isStatic || e.altKey || e.ctrlKey || e.metaKey) return;
      let value = target;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") value += 0.25;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") value -= 0.25;
      else if (e.key === "PageDown" || e.key === " ")
        value += e.shiftKey ? -1 : 1;
      else if (e.key === "PageUp") value -= 1;
      else if (e.key === "Home") value = 0;
      else if (e.key === "End") value = end;
      else if (e.key === "Escape") {
        release();
        value = pos;
      } else return;
      e.preventDefault();
      moveTo(value);
    };
    const visibility = () => {
      h.dataset.suspended = String(!visible || document.hidden);
      if (document.hidden || !visible) stop();
      else wake();
    };
    const motionChange = () => {
      reduced = reducedMotion || !!motion?.matches;
      if (reduced) pos = target;
      present();
      wake();
    };
    const ro = new ResizeObserver(layout);
    ro.observe(h);
    captions.current.forEach(c => { if (c) ro.observe(c); });
    if (isStatic) {
      pos = target = 0;
      const staticImages = images.current.flat().filter(Boolean);
      staticImages.forEach(im => im?.addEventListener("load", layout));
      layout();
      return () => {
        dead = true; stop(); ro.disconnect();
        staticImages.forEach(im => im?.removeEventListener("load", layout));
      };
    }
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      visibility();
    });
    io.observe(h);
    const clean: (() => void)[] = [];
    images.current.forEach((pair) =>
      pair.forEach((im) => {
        if (im) {
          im.addEventListener("load", layout);
          clean.push(() => im.removeEventListener("load", layout));
        }
      }),
    );
    restart.current = () => {
      release();
      stop();
      pos = target = 0;
      active = -1;
      present();
    };
    h.addEventListener("wheel", wheel, { passive: false });
    h.addEventListener("pointerdown", down);
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", release);
    h.addEventListener("pointercancel", release);
    h.addEventListener("lostpointercapture", release);
    h.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", visibility);
    motion?.addEventListener("change", motionChange);
    layout();
    return () => {
      dead = true;
      stop();
      release();
      ro.disconnect();
      io.disconnect();
      clean.forEach((fn) => fn());
      h.removeEventListener("wheel", wheel);
      h.removeEventListener("pointerdown", down);
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", release);
      h.removeEventListener("pointercancel", release);
      h.removeEventListener("lostpointercapture", release);
      h.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", visibility);
      motion?.removeEventListener("change", motionChange);
      restart.current = () => {};
    };
  }, [
    photos,
    isStatic,
    reducedMotion,
    zoom,
    veil,
    corners,
    gutter,
    scrollDistance,
    smoothing,
    showLibrary,
    fontsKey,
  ]);
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
      data-al-mr=""
      data-portrait="false"
      data-al-demo-viewport={
        fullViewport && showLibrary && !isStatic ? "true" : undefined
      }
      tabIndex={isStatic ? undefined : 0}
      role="region"
      aria-label="Mask Reveal"
      aria-describedby={isStatic ? undefined : `${uid}-hint`}
      style={
        {
          ...style,
          position: "relative",
          width: style?.width || "100%",
          height: fullViewport && !isStatic ? "100dvh" : style?.height || 900,
          minHeight: 180,
          overflow: "clip",
          isolation: "isolate",
          background,
          fontFamily: "Inter, sans-serif",
          "--mr-radius": `${clamp(corners, 0, 30)}px`,
        } as React.CSSProperties
      }
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div ref={frame} className="al-mr-frame">
        {photos.map((photo, i) => (
          <figure
            key={i}
            ref={(el) => {
              figures.current[i] = el;
            }}
            className="al-mr-slide"
            aria-hidden={i !== 0}
            style={{
              zIndex: i + 1,
              visibility: i === 0 ? "visible" : "hidden",
            }}
          >
            <div
              ref={(el) => {
                media.current[i] = el;
              }}
              className="al-mr-media"
            >
              {[false, true].map((p, j) => {
                const preferred = p ? photo.portrait : photo.landscape;
                const img = preferred?.src ? preferred : p ? photo.landscape : photo.portrait;
                const imageAlt = preferred?.src
                  ? p ? photo.portraitAlt : photo.landscapeAlt
                  : p ? photo.landscapeAlt : photo.portraitAlt;
                return (
                  <React.Fragment key={j}>
                    <img
                      className={`al-mr-blur al-mr-${p ? "portrait" : "landscape"}`}
                      src={img?.src}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                    />
                    <img
                      ref={(el) => {
                        (images.current[i] ??= [])[j] = el;
                      }}
                      className={`al-mr-photo al-mr-${p ? "portrait" : "landscape"}`}
                      src={img?.src}
                      srcSet={img?.srcSet}
                      sizes="100vw"
                      alt={imageAlt ?? img?.alt ?? ""}
                      draggable={false}
                      decoding="async"
                      style={{
                        objectPosition: `${photo.focusX ?? 50}% ${photo.focusY ?? 45}%`,
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>
            <span
              className="al-mr-shade"
              style={{
                background: `linear-gradient(to top,rgba(30,25,20,${clamp(shade, 0, 0.7)}) var(--mr-shade-stop,30%),transparent calc(var(--mr-shade-stop,30%) + 28%))`,
              }}
            />
            <span
              className="al-mr-veil"
              ref={(el) => {
                veils.current[i] = el;
              }}
            />
            <figcaption
              className="al-mr-caption"
              ref={(el) => {
                captions.current[i] = el;
              }}
              style={{ color: textColor }}
            >
              <span
                className="al-mr-meta"
                style={{
                  ...metaFont,
                  color: mutedColor,
                  fontSize: "var(--mr-meta)",
                }}
              >
                <span className="al-mr-line">
                  <span
                    ref={(el) => {
                      (lines.current[i] ??= [])[0] = el;
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(photos.length).padStart(2, "0")} · {photo.tag}
                  </span>
                </span>
              </span>
              <h2
                className="al-mr-title"
                style={{ ...titleFont, fontSize: "var(--mr-title)" }}
              >
                <span className="al-mr-line">
                  <span
                    ref={(el) => {
                      (lines.current[i] ??= [])[1] = el;
                    }}
                  >
                    {photo.title}
                  </span>
                </span>
              </h2>
              <p
                className="al-mr-copy"
                style={{
                  ...captionFont,
                  color: mutedColor,
                  fontSize: "var(--mr-copy)",
                }}
              >
                <span className="al-mr-line">
                  <span
                    ref={(el) => {
                      (lines.current[i] ??= [])[2] = el;
                    }}
                  >
                    {photo.caption}
                  </span>
                </span>
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
      {!isStatic && <span id={`${uid}-hint`} className="al-mr-sr">
        Scroll or drag upward to reveal the next photograph. Reverse the gesture
        to go back. Arrow keys make small changes; Page Up, Page Down and Space
        make larger changes. Home and End choose the beginning and end. Escape
        stops the glide.
      </span>}
      <span ref={status} className="al-mr-sr" role="status" />
      {showReload && !isStatic && (
        <button
          type="button"
          aria-label="Restart animation"
          title="Restart animation"
          onClick={() => restart.current()}
          style={{
            ...pill,
            position: "absolute",
            right: 16,
            top: "max(16px,env(safe-area-inset-top))",
            width: 68,
            height: 44,
            padding: 0,
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          {" "}
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
            zIndex: 20,
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
addPropertyControls(ALMaskReveal, {
  slides: {
    type: ControlType.Array,
    title: "Slides",
    maxCount: 10,
    defaultValue: DEFAULTS,
    control: {
      type: ControlType.Object,
      controls: {
        landscape: { type: ControlType.ResponsiveImage, title: "Landscape" },
        landscapeAlt: {
          type: ControlType.String,
          title: "Landscape Alt",
          defaultValue: "",
        },
        portrait: { type: ControlType.ResponsiveImage, title: "Portrait" },
        portraitAlt: {
          type: ControlType.String,
          title: "Portrait Alt",
          defaultValue: "",
        },
        title: {
          type: ControlType.String,
          title: "Title",
          defaultValue: "CUTE MOMENTS",
        },
        tag: {
          type: ControlType.String,
          title: "Tag",
          defaultValue: "SOFT & SWEET",
        },
        caption: {
          type: ControlType.String,
          title: "Caption",
          defaultValue: "MOMENTS TO HOLD CLOSE.",
        },
        focusX: {
          type: ControlType.Number,
          title: "Focus X",
          defaultValue: 50,
          min: 0,
          max: 100,
          unit: "%",
        },
        focusY: {
          type: ControlType.Number,
          title: "Focus Y",
          defaultValue: 45,
          min: 0,
          max: 100,
          unit: "%",
        },
      },
    },
  },
  titleFont: {
    type: ControlType.Font,
    title: "Title Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "60px",
      lineHeight: "1.04em",
      letterSpacing: "-.025em",
    },
  },
  captionFont: {
    type: ControlType.Font,
    title: "Caption Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", lineHeight: "1.5em" },
  },
  metaFont: {
    type: ControlType.Font,
    title: "Meta Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: {
      fontSize: "10px",
      lineHeight: "1.5em",
      letterSpacing: ".18em",
    },
  },
  navigationFont: {
    type: ControlType.Font,
    title: "Navigation Font",
    controls: "extended",
    defaultFontType: "sans-serif",
    defaultValue: { fontSize: "14px", lineHeight: "1.2em" },
  },
  background: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#FFFFFF",
  },
  textColor: {
    type: ControlType.Color,
    title: "Text Color",
    defaultValue: "#F2EEE8",
  },
  mutedColor: {
    type: ControlType.Color,
    title: "Muted Color",
    defaultValue: "#E4DED6",
  },
  corners: {
    type: ControlType.Number,
    title: "Corners",
    defaultValue: 6,
    min: 0,
    max: 30,
  },
  gutter: {
    type: ControlType.Number,
    title: "Frame Inset",
    defaultValue: 24,
    min: 0,
    max: 48,
  },
  shade: {
    type: ControlType.Number,
    title: "Caption Shade",
    defaultValue: 0.7,
    min: 0,
    max: 0.7,
    step: 0.01,
  },
  veil: {
    type: ControlType.Number,
    title: "Transition Veil",
    defaultValue: 0.5,
    min: 0,
    max: 0.65,
    step: 0.01,
  },
  zoom: {
    type: ControlType.Number,
    title: "Incoming Zoom",
    defaultValue: 1.35,
    min: 1,
    max: 1.8,
    step: 0.01,
  },
  scrollDistance: {
    type: ControlType.Number,
    title: "Scroll Distance",
    defaultValue: 1,
    min: 0.25,
    max: 3,
    step: 0.05,
  },
  smoothing: {
    type: ControlType.Number,
    title: "Smoothing",
    defaultValue: 6,
    min: 1,
    max: 20,
    step: 0.5,
  },
  reducedMotion: {
    type: ControlType.Boolean,
    title: "Reduced Motion",
    defaultValue: false,
  },
  fullViewport: {
    type: ControlType.Boolean,
    title: "Full Viewport",
    defaultValue: true,
  },
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
});
