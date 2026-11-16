import * as React from "react";
import {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef
} from "react";
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export type ExtrusionType = "solid" | "stack";
export type ViewType = "pointer" | "fixed";
export type AreaType = "parent" | "self";
export type ElementType = "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface RisingInkProps {
  text?: string;
  as?: ElementType;
  preset?: "violet" | "stack" | "blueprint" | "ember" | "mono" | "ink" | "paper" | "custom";
  color?: string;
  nearColor?: string;
  farColor?: string;
  colors?: string[];
  extrusion?: ExtrusionType;
  plates?: number;
  lift?: number;
  radius?: number;
  view?: ViewType;
  perspective?: number;
  angle?: number;
  stiffness?: number;
  damping?: number;
  pop?: number;
  shadow?: number;
  intro?: boolean;
  area?: AreaType;
  paused?: boolean;
  fontSize?: number;
  fontWeight?: string | number;
  uppercase?: boolean;
  className?: string;
  containerRef?: React.RefObject<HTMLElement | null>;
  style?: React.CSSProperties;
  ref?: React.Ref<RisingInkRef>;
}

export interface RisingInkRef {
  wave: () => void;
  pop: (clientX?: number, clientY?: number) => void;
}

const PRESETS: Record<
  string,
  {
    color: string;
    near: string;
    far: string;
    extrusion: ExtrusionType;
    view: ViewType;
  }
> = {
  violet: {
    color: "#FFFFFF",
    near: "#B19EEF",
    far: "#3A1DB8",
    extrusion: "solid",
    view: "pointer"
  },
  stack: {
    color: "#FFFFFF",
    near: "#5EEAD4",
    far: "#0A0A0A",
    extrusion: "stack",
    view: "fixed"
  },
  blueprint: {
    color: "#EAF6FF",
    near: "#60A5FA",
    far: "#0A0A0A",
    extrusion: "stack",
    view: "pointer"
  },
  ember: {
    color: "#FFF4E8",
    near: "#FFB86B",
    far: "#9A2D0A",
    extrusion: "solid",
    view: "pointer"
  },
  mono: {
    color: "#FFFFFF",
    near: "#A1A1AA",
    far: "#27272A",
    extrusion: "solid",
    view: "fixed"
  },
  ink: {
    color: "#0A0A0A",
    near: "#B19EEF",
    far: "#5227FF",
    extrusion: "solid",
    view: "pointer"
  },
  paper: {
    color: "#0A0A0A",
    near: "#5227FF",
    far: "#FAFAFA",
    extrusion: "stack",
    view: "fixed"
  }
};

const DEFAULT_NEAR = "#B19EEF";
const DEFAULT_FAR = "#5227FF";

const PLATE_OFFSETS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.71, 0.71],
  [-0.71, 0.71],
  [0.71, -0.71],
  [-0.71, -0.71]
];

const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

const SR_ONLY_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0
};

const ISOLATE_CONTAINER: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
  isolation: "isolate"
};

const PRE_WRAP_STYLE: React.CSSProperties = {
  whiteSpace: "pre-wrap"
};

const WORD_INLINE_STYLE: React.CSSProperties = {
  display: "inline-block",
  whiteSpace: "nowrap"
};

const LETTER_WRAP_STYLE: React.CSSProperties = {
  position: "relative",
  display: "inline-block"
};

const BODY_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  color: "transparent",
  pointerEvents: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  willChange: "transform"
};

const FACE_STYLE: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
  willChange: "transform"
};

interface LetterItem {
  node: HTMLElement;
  body: HTMLElement;
  face: HTMLElement;
  x: number;
  y: number;
  h: number;
  v: number;
}

export default function RisingInk(props: RisingInkProps) {
  const {
    text = "Beyond the Ordinary.",
    as: Tag = "h2",
    preset = "violet",
    color,
    nearColor,
    farColor,
    colors,
    extrusion,
    plates = 7,
    lift = 0.5,
    radius = 1.4,
    view,
    perspective = 1.3,
    angle = 35,
    stiffness = 1.0,
    damping = 0.5,
    pop = 1.0,
    shadow = 0.6,
    intro = true,
    area = "parent",
    paused = false,
    fontSize = 72,
    fontWeight = "700",
    uppercase = false,
    className = "",
    containerRef,
    style,
    ref
  } = props;
  const isStatic = useIsStaticRenderer();

  const rootRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const internalRef = useRef<RisingInkRef | null>(null);

  // Active theme / preset resolution
  const activePreset = PRESETS[preset] ?? PRESETS.violet;
  const resolvedColor = color ?? activePreset.color;
  const resolvedNear = nearColor ?? colors?.[0] ?? activePreset.near ?? DEFAULT_NEAR;
  const resolvedFar = farColor ?? colors?.[1] ?? activePreset.far ?? DEFAULT_FAR;
  const resolvedExtrusion = extrusion ?? activePreset.extrusion ?? "solid";
  const resolvedView = view ?? activePreset.view ?? "pointer";

  const displayText = uppercase ? text.toUpperCase() : text;

  // Split words & grapheme clusters
  const words = useMemo(() => {
    return displayText
      .split(/(\s+)/)
      .filter((w) => w.length > 0)
      .map((w) => ({
        value: w,
        space: /^\s+$/.test(w),
        glyphs:
          typeof Intl === "undefined" || !(Intl as any).Segmenter
            ? Array.from(w)
            : Array.from(
                new (Intl as any).Segmenter(undefined, {
                  granularity: "grapheme"
                }).segment(w),
                (s: any) => s.segment
              )
      }));
  }, [displayText]);

  // Color mix palette (24-step gradient)
  const palette = useMemo(() => {
    return Array.from({ length: 24 }, (_, a) => {
      const r = Math.round((a / 23) * 100);
      return `color-mix(in oklch, ${resolvedNear} ${100 - r}%, ${resolvedFar})`;
    });
  }, [resolvedNear, resolvedFar]);

  const configRef = useRef({
    extrusion: resolvedExtrusion,
    plates,
    lift,
    radius,
    view: resolvedView,
    perspective,
    angle,
    stiffness,
    damping,
    pop,
    shadow,
    intro,
    area,
    palette,
    near: resolvedNear,
    far: resolvedFar
  });

  useEffect(() => {
    configRef.current = {
      extrusion: resolvedExtrusion,
      plates,
      lift,
      radius,
      view: resolvedView,
      perspective,
      angle,
      stiffness,
      damping,
      pop,
      shadow,
      intro,
      area,
      palette,
      near: resolvedNear,
      far: resolvedFar
    };
  });

  useEffect(() => {
    const rootEl = rootRef.current;
    const textEl = textRef.current;
    if (!rootEl || !textEl || isStatic || paused) return;

    const letters: LetterItem[] = Array.from(
      textEl.querySelectorAll("[data-rising-letter]")
    ).map((el) => ({
      node: el as HTMLElement,
      body: el.querySelector("[data-rising-body]") as HTMLElement,
      face: el.querySelector("[data-rising-face]") as HTMLElement,
      x: 0,
      y: 0,
      h: 0,
      v: 0
    }));

    let currentFontSize = 16;
    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;
    let introStartTime = -1;
    let introDone = false;
    let rafId = 0;
    let lastTime = 0;
    let isRunning = false;

    const measure = () => {
      currentFontSize =
        Number.parseFloat(getComputedStyle(textEl).fontSize) || 16;
      const textW = textEl.offsetWidth;
      const textH = textEl.offsetHeight;
      for (const item of letters) {
        item.x = item.node.offsetLeft + item.node.offsetWidth / 2 - textW / 2;
        item.y = item.node.offsetTop + item.node.offsetHeight / 2 - textH / 2;
      }
    };

    const render = () => {
      const cfg = configRef.current;
      const maxLiftPx = Math.max(cfg.lift, 0) * currentFontSize;
      const viewDistance = 4.5 * currentFontSize;
      const angleRad = (cfg.angle * Math.PI) / 180;
      const pal = cfg.palette;
      const shadowIntensity = clamp(cfg.shadow, 0, 1);

      for (const item of letters) {
        const liftValue = Math.max(item.h, 0);
        if (liftValue < 0.05) {
          item.body.style.transform = "";
          item.body.style.textShadow = "";
          item.body.style.zIndex = "";
          item.face.style.transform = "";
          item.face.style.zIndex = "";
          continue;
        }

        const g =
          viewDistance /
          Math.max(viewDistance - Math.min(liftValue, 1.6 * maxLiftPx), 0.35 * viewDistance);

        let tx = 0;
        let ty = 0;
        let fx = 0;
        let fy = 0;
        let scale = 1;

        if (cfg.view === "fixed") {
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          const depth = liftValue * clamp(cfg.perspective, 0, 4) * 0.75;
          scale = 1 + (g - 1) * 0.35;
          tx = -cos * depth * 0.18;
          ty = -sin * depth * 0.18;
          fx = cos * depth;
          fy = sin * depth;
        } else {
          const factor = (g - 1) * clamp(cfg.perspective, 0, 4);
          scale = g;
          tx = (item.x - pointerX) * factor;
          ty = (item.y - pointerY) * factor - 0.18 * liftValue;
          fx = -tx;
          fy = -ty;
        }

        const hyp = Math.hypot(fx, fy);
        const shadows: string[] = [];

        if (cfg.extrusion === "stack") {
          const numPlates = Math.round(clamp(cfg.plates, 1, 16));
          const invScale = 1 / scale;
          const outlinePct = Math.round(100 * clamp((hyp - 1.5) / 5, 0, 1));
          const outlineColor =
            outlinePct >= 100
              ? cfg.near
              : `color-mix(in srgb, ${cfg.near} ${outlinePct}%, transparent)`;
          const activePlates = Math.max(
            1,
            Math.min(numPlates, Math.round(hyp / 2.5))
          );

          if (outlinePct > 0) {
            for (let p = 1; p <= activePlates; p++) {
              const frac = p / activePlates;
              const ox = (fx * frac) / scale;
              const oy = (fy * frac) / scale;
              shadows.push(
                `${ox.toFixed(2)}px ${oy.toFixed(2)}px 0 ${cfg.far}`
              );
              for (const [dx, dy] of PLATE_OFFSETS) {
                shadows.push(
                  `${(ox + dx * invScale).toFixed(2)}px ${(oy + dy * invScale).toFixed(2)}px 0 ${outlineColor}`
                );
              }
            }
          }
        } else {
          // Solid dense gradient extrusion
          const steps = Math.min(56, Math.ceil(hyp / 0.7));
          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const cIdx = Math.min(
              pal.length - 1,
              Math.round(frac * (pal.length - 1))
            );
            const color = pal[cIdx];
            shadows.push(
              `${((fx * frac) / scale).toFixed(2)}px ${((fy * frac) / scale).toFixed(2)}px 0 ${color}`
            );
          }
        }

        // Contact shadow
        if (shadowIntensity > 0) {
          const normH = liftValue / Math.max(maxLiftPx, 1);
          const shadowAlpha = (
            0.45 *
            shadowIntensity *
            clamp(normH, 0, 1)
          ).toFixed(3);
          shadows.push(
            `${(fx / scale).toFixed(2)}px ${(fy / scale + 0.04 * currentFontSize).toFixed(2)}px ${(0.12 * currentFontSize * normH).toFixed(2)}px rgba(0, 0, 0, ${shadowAlpha})`
          );
        }

        const transformStr = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        const zIndexOffset = Math.round(4 * liftValue);

        item.body.style.transform = transformStr;
        item.body.style.textShadow = shadows.join(", ");
        item.body.style.zIndex = String(1 + zIndexOffset);

        item.face.style.transform = transformStr;
        item.face.style.zIndex = String(2000 + zIndexOffset);
      }
    };

    const stepPhysics = (dt: number, now: number): boolean => {
      const cfg = configRef.current;
      const maxLiftPx = Math.max(cfg.lift, 0) * currentFontSize;
      const radiusPx = Math.max(cfg.radius, 0.1) * currentFontSize;
      const omega = 2 * Math.PI * 2.4 * clamp(cfg.stiffness, 0.1, 5);
      const zeta = clamp(cfg.damping, 0.05, 2);
      let activePointer = hasPointer;

      if (introStartTime >= 0) {
        const elapsed = (now - introStartTime) / 1600;
        if (elapsed >= 1) {
          introStartTime = -1;
        } else if (!hasPointer) {
          const sweepRange = textEl.offsetWidth / 2 + 1.5 * radiusPx;
          pointerX =
            -sweepRange + elapsed * elapsed * (3 - 2 * elapsed) * sweepRange * 2;
          pointerY = 0;
          activePointer = true;
        }
      }

      let stillMoving = false;
      for (const item of letters) {
        const dist = Math.hypot(item.x - pointerX, item.y - pointerY) / radiusPx;
        const targetLift = activePointer
          ? maxLiftPx * Math.exp(-dist * dist)
          : 0;

        const acc =
          omega * omega * (targetLift - item.h) - 2 * zeta * omega * item.v;
        item.v += acc * dt;
        item.h += item.v * dt;

        if (
          Math.abs(item.v) > 0.5 ||
          Math.abs(targetLift - item.h) > 0.05
        ) {
          stillMoving = true;
        }
      }

      return stillMoving || introStartTime >= 0;
    };

    const onFrame = (now: number) => {
      const dt = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
      lastTime = now;
      const subSteps = Math.max(1, Math.ceil(dt / (1 / 240)));
      let moving = false;
      for (let s = 0; s < subSteps; s++) {
        moving = stepPhysics(dt / subSteps, now) || moving;
      }
      render();

      if (moving) {
        rafId = requestAnimationFrame(onFrame);
      } else {
        isRunning = false;
        if (!hasPointer) {
          for (const item of letters) {
            item.h = 0;
            item.v = 0;
          }
          render();
        }
      }
    };

    const ensureLoop = () => {
      if (!isRunning) {
        isRunning = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(onFrame);
      }
    };

    const updatePointerPos = (clientX: number, clientY: number) => {
      const rect = textEl.getBoundingClientRect();
      pointerX = clientX - (rect.left + rect.width / 2);
      pointerY = clientY - (rect.top + rect.height / 2);
    };

    const startWave = () => {
      measure();
      introStartTime = performance.now();
      ensureLoop();
    };

    const triggerPop = (clientX?: number, clientY?: number) => {
      const cfg = configRef.current;
      const popStrength = clamp(cfg.pop, 0, 4);
      if (popStrength <= 0) return;

      const rect = textEl.getBoundingClientRect();
      const clickX =
        (clientX ?? rect.left + rect.width / 2) -
        (rect.left + rect.width / 2);
      const clickY =
        (clientY ?? rect.top + rect.height / 2) -
        (rect.top + rect.height / 2);
      const popRadius = Math.max(cfg.radius, 0.1) * currentFontSize * 1.3;

      for (const item of letters) {
        const dist = Math.hypot(item.x - clickX, item.y - clickY) / popRadius;
        item.v += popStrength * currentFontSize * 9 * Math.exp(-dist * dist);
      }
      ensureLoop();
    };

    const eventTarget =
      containerRef?.current ??
      (configRef.current.area === "parent"
        ? rootEl.parentElement?.parentElement ?? rootEl.parentElement ?? rootEl
        : rootEl);

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hasPointer = true;
      updatePointerPos(e.clientX, e.clientY);
      ensureLoop();
    };

    const onPointerLeave = () => {
      hasPointer = false;
      ensureLoop();
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointerPos(e.clientX, e.clientY);
      triggerPop(e.clientX, e.clientY);
    };

    eventTarget.addEventListener("pointermove", onPointerMove, {
      passive: true
    });
    eventTarget.addEventListener("pointerleave", onPointerLeave, {
      passive: true
    });
    eventTarget.addEventListener("pointerdown", onPointerDown, {
      passive: true
    });

    const ro =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => measure());
    ro?.observe(textEl);

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              if (entry.isIntersecting && !introDone) {
                introDone = true;
                if (configRef.current.intro) {
                  window.setTimeout(startWave, 250);
                }
              }
            },
            { threshold: 0.4 }
          );
    io?.observe(rootEl);

    measure();

    internalRef.current = {
      wave: startWave,
      pop: triggerPop
    };

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
      eventTarget.removeEventListener("pointermove", onPointerMove);
      eventTarget.removeEventListener("pointerleave", onPointerLeave);
      eventTarget.removeEventListener("pointerdown", onPointerDown);

      for (const item of letters) {
        item.body.style.transform = "";
        item.body.style.zIndex = "";
        item.body.style.textShadow = "";
        item.face.style.transform = "";
        item.face.style.zIndex = "";
      }
    };
  }, [displayText, isStatic, paused, area]);

  useImperativeHandle(
    ref,
    () => ({
      wave: () => internalRef.current?.wave(),
      pop: (x, y) => internalRef.current?.pop(x, y)
    }),
    []
  );

  const staticShadow = isStatic
    ? `1px 2px 0 ${resolvedNear}, 2px 4px 0 ${resolvedFar}, 0 8px 16px rgba(0,0,0,0.5)`
    : undefined;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "180px",
        overflow: "visible",
        position: "relative",
        boxSizing: "border-box",
        ...style
      }}
    >
      <Tag
        ref={rootRef as any}
        className={`relative inline-block ${className}`.trim()}
        style={{
          fontSize: `min(${fontSize}px, 12vw)`,
          fontWeight: Number(fontWeight) || 700,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
          fontFamily: "Inter, sans-serif",
          textAlign: "center",
          margin: 0,
          padding: 0,
          userSelect: "none",
          WebkitUserSelect: "none"
        }}
      >
        <span style={SR_ONLY_STYLE}>{displayText}</span>
        <span
          aria-hidden="true"
          ref={textRef}
          style={{
            ...ISOLATE_CONTAINER,
            color: resolvedColor
          }}
        >
          {words.map((w, wIdx) =>
            w.space ? (
              <span key={wIdx} style={PRE_WRAP_STYLE}>
                {w.value}
              </span>
            ) : (
              <span key={wIdx} style={WORD_INLINE_STYLE}>
                {w.glyphs.map((g, gIdx) => (
                  <span
                    key={gIdx}
                    data-rising-letter=""
                    style={LETTER_WRAP_STYLE}
                  >
                    <span
                      data-rising-body=""
                      style={{
                        ...BODY_STYLE,
                        ...(staticShadow ? { textShadow: staticShadow } : null)
                      }}
                    >
                      {g}
                    </span>
                    <span data-rising-face="" style={FACE_STYLE}>
                      {g}
                    </span>
                  </span>
                ))}
              </span>
            )
          )}
        </span>
      </Tag>
    </div>
  );
}

export { RisingInk };

addPropertyControls(RisingInk, {
  text: {
    type: ControlType.String,
    title: "Text",
    defaultValue: "Beyond the Ordinary."
  },
  preset: {
    type: ControlType.Enum,
    title: "Preset",
    options: [
      "violet",
      "stack",
      "blueprint",
      "ember",
      "mono",
      "ink",
      "paper"
    ],
    optionTitles: [
      "Violet",
      "Stack",
      "Blueprint",
      "Ember",
      "Mono",
      "Ink",
      "Paper"
    ],
    defaultValue: "violet"
  },
  color: {
    type: ControlType.Color,
    title: "Face Color",
    defaultValue: "#FFFFFF"
  },
  nearColor: {
    type: ControlType.Color,
    title: "Near Color",
    defaultValue: "#B19EEF"
  },
  farColor: {
    type: ControlType.Color,
    title: "Far Color",
    defaultValue: "#3A1DB8"
  },
  fontSize: {
    type: ControlType.Number,
    title: "Font Size",
    min: 24,
    max: 180,
    step: 2,
    defaultValue: 80,
    unit: "px"
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Weight",
    options: ["400", "600", "700", "800", "900"],
    optionTitles: ["Regular", "Semibold", "Bold", "Extrabold", "Black"],
    defaultValue: "700"
  },
  extrusion: {
    type: ControlType.Enum,
    title: "Extrusion",
    options: ["solid", "stack"],
    optionTitles: ["Solid", "Stack"],
    defaultValue: "solid"
  },
  plates: {
    type: ControlType.Number,
    title: "Plates",
    min: 1,
    max: 16,
    step: 1,
    defaultValue: 7
  },
  view: {
    type: ControlType.Enum,
    title: "View",
    options: ["pointer", "fixed"],
    optionTitles: ["Pointer", "Fixed"],
    defaultValue: "pointer"
  },
  lift: {
    type: ControlType.Number,
    title: "Lift",
    min: 0,
    max: 1.5,
    step: 0.05,
    defaultValue: 0.5
  },
  radius: {
    type: ControlType.Number,
    title: "Radius",
    min: 0.3,
    max: 5,
    step: 0.05,
    defaultValue: 1.4
  },
  perspective: {
    type: ControlType.Number,
    title: "Perspective",
    min: 0,
    max: 3,
    step: 0.05,
    defaultValue: 1.3
  },
  angle: {
    type: ControlType.Number,
    title: "Angle",
    min: 0,
    max: 360,
    step: 1,
    defaultValue: 35,
    unit: "°"
  },
  stiffness: {
    type: ControlType.Number,
    title: "Stiffness",
    min: 0.2,
    max: 3,
    step: 0.05,
    defaultValue: 1.0
  },
  damping: {
    type: ControlType.Number,
    title: "Damping",
    min: 0.1,
    max: 1.5,
    step: 0.05,
    defaultValue: 0.5
  },
  pop: {
    type: ControlType.Number,
    title: "Pop Jump",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 1.0
  },
  shadow: {
    type: ControlType.Number,
    title: "Shadow",
    min: 0,
    max: 1,
    step: 0.05,
    defaultValue: 0.6
  },
  intro: {
    type: ControlType.Boolean,
    title: "Intro Wave",
    defaultValue: true
  },
  area: {
    type: ControlType.Enum,
    title: "Area",
    options: ["parent", "self"],
    optionTitles: ["Parent Container", "Text Only"],
    defaultValue: "parent"
  },
  uppercase: {
    type: ControlType.Boolean,
    title: "Uppercase",
    defaultValue: false
  }
});
