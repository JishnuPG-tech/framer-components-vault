/* Copyright (c) 2026 Lorenzo Cabra

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Image Accordion — from Bencho (bencho.dev), MIT licensed. Adapted as a
Framer code component: the Images array, a spring loop that can follow
that count, the link-on-press, the grouped Layout / Colors controls,
responsive Stretch and Fixed sizing, a Vertical layout that
opens on click, and the design tokens are Framer additions;
the swell, the crop and the comments are Bencho's. The
original SHOTS placeholders do not travel. */
import { useEffect, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const CSS: string = `/* Image accordion
   A row or column of pictures cropped to slivers, one of
   which opens under the pointer (horizontal) or on a
   direct click (vertical). The arithmetic of who pays for
   that is in the component — grow numbers on springs —
   and what is here is the box they negotiate inside and
   the crop that keeps a photograph a photograph while it
   happens.

   The strip fills the Framer instance (Stretch) or a Fixed
   panel size, independent of the frame. In a vertical Fit
   the height comes from the resting panel size, the gaps,
   the open extra and the padding, and follows the springs.
   A fixed or fill height shares the frame instead. Nothing
   here is scaled as a whole. */
.acc {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  /* The clip stays because flex widths land on fractions and a
     cell can overhang its container by a sub-pixel; it is no
     longer doing any shaping of its own. */
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
  touch-action: pan-y;
  background: var(--mat, transparent);}

.acc[data-direction="vertical"] {
  flex-direction: column;
  touch-action: manipulation;}

.acc[data-mode="fixed"] {
  width: var(--acc-extent);
  height: 100%;
  flex: none;}

.acc[data-mode="fixed"][data-direction="vertical"] {
  width: 100%;
  height: 100%;}

/* Vertical + Fit: height is the spring-driven stack, so the
   component wraps the panels exactly, also while one opens. */
.acc[data-direction="vertical"][data-size="auto"] {
  width: 100%;
  height: var(--acc-stack);
  flex: none;}

.acc-cell {
  position: relative;
  /* flex-basis: 0 so nothing is reserved before the
     negotiation starts — with auto the pictures' own widths
     get a vote and the grow numbers only divide what is left
     over. min-width: 0 so a cell can shrink below its image. */
  flex-basis: 0;
  flex-shrink: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--cell-fill, transparent);}

.acc[data-direction="vertical"] .acc-cell {
  width: 100%;}

.acc-cell img {
  display: block;
  width: 100%;
  height: 100%;
  /* cover, and the crossing axis is what fixes the scale.
     Growing a cell along the strip admits more of the
     photograph on each side and moves nothing that was
     already showing. */
  object-fit: cover;
  -webkit-user-drag: none;}
`

/* ── inlined from lab/spring ──────────────────────── */
/* ── one spring, for everything that settles ───────────────
   The maths was already on this bench twice, copied by hand:
   Humidity's wheel and Brightness's column both accumulate
   velocity toward a target, damp it, and snap when both the
   delta and the velocity fall under 0.02. Two copies is a
   coincidence; five would be a policy, so it comes out here
   before the elastic blocks are written against it.

   The two shipped copies are deliberately NOT refactored onto
   this. They work, they are tuned, and rewriting the innards
   of two live components to prove a point about duplication
   is how a good afternoon becomes a bad one. This is the one
   new code uses.

   Frames, not milliseconds. `dt` is expressed in sixtieths of
   a second and the damping is RAISED to it rather than
   multiplied by it, so a dropped frame decays the same amount
   of energy as the two frames it replaced. Multiplying is the
   version that makes a spring behave differently on a busy
   page, which is the hardest kind of bug to see.

   The loop parks itself the moment the value has settled.
   CLAUDE.md is not complimentary about the one permanent
   requestAnimationFrame already on this bench and there is no
   case for five more. */

/* 0..100 into the two numbers a spring actually has.

   50 is what Humidity and Brightness were tuned at, which is
   the rule every elastic knob on this bench follows — see
   lab/motion. Turn the panel to the middle and nothing has
   changed.

   Both ends have to be usable, which is what fixes the range:
   at 0 it is slow and heavy and still arrives, at 100 it is
   quick with a visible overshoot, and nowhere in between does
   it ring for longer than it takes to read. */
/* The pair is chosen by DAMPING RATIO and then written back
   as stiffness and decay, because the ratio is the thing a
   person is actually setting and the two numbers on their own
   do not say what they add up to.

     zeta = -ln(d) / (2 * sqrt(k))

   The first version of this ran 0.06..0.26 stiffness against
   0.93..0.74 decay, which reads as a sensible spread and is
   not one: it puts zeta between 0.15 and 0.16 across the
   WHOLE range, so every setting overshot by about sixty per
   cent and the knob only changed how fast it did it. Pull's
   return went 130px past its own resting position and lifted
   the content off the top of the card.

     0   → zeta ~0.85, heavy, arrives without a ring
     50  → zeta ~0.41, near where Humidity and Brightness sit
     100 → zeta ~0.20, lively, two visible rebounds

   Both ends shippable, which is the constraint that fixed the
   numbers rather than taste. */
const springOf = (tune: number) => ({
  /* stiffness: how hard it is pulled toward the target */
  k: 0.08 + (tune / 100) * 0.16,
  /* decay, per frame: how much of the velocity survives */
  d: 0.62 + (tune / 100) * 0.2,
})

/* Units matter. The snap threshold is absolute, so a caller
   works in pixels or in 0..100 — a spring driven over 0..1
   would be "settled" before it had visibly moved. */

/* Framer: the original block ran five useSpring hooks, one
   per picture, because a hook cannot be drawn conditionally
   and the count was fixed at five. The Images array can be
   added to, taken from and reordered, so one loop now drives
   every spring — same maths, same units, same snap, and the
   strip still moves as one measurement. */
function useSprings(targets: number[], tune = 50, instant = false) {
  const [at, setAt] = useState<number[]>(() => targets.slice())
  const cur = useRef<number[]>(targets.slice())
  const vel = useRef<number[]>(targets.map(() => 0))
  const raf = useRef(0)
  const targetsRef = useRef(targets)
  targetsRef.current = targets
  const key = targets.join(",")

  useEffect(() => {
    const want = targetsRef.current
    const n = want.length
    if (cur.current.length !== n) {
      cur.current = Array.from({ length: n }, (_, i) => cur.current[i] ?? want[i] ?? 0)
      vel.current = Array.from({ length: n }, (_, i) => vel.current[i] ?? 0)
    }
    if (instant) {
      cur.current = want.slice()
      vel.current = want.map(() => 0)
      setAt(want.slice())
      return
    }
    const { k, d } = springOf(tune)
    let prev = 0
    const tick = (t: number) => {
      const tgt = targetsRef.current
      if (cur.current.length !== tgt.length) {
        cur.current = Array.from({ length: tgt.length }, (_, i) => cur.current[i] ?? tgt[i] ?? 0)
        vel.current = Array.from({ length: tgt.length }, (_, i) => vel.current[i] ?? 0)
      }
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1
      prev = t
      let settled = true
      for (let i = 0; i < tgt.length; i++) {
        vel.current[i] += (tgt[i] - cur.current[i]) * k * dt
        vel.current[i] *= Math.pow(d, dt)
        cur.current[i] += vel.current[i] * dt
        if (Math.abs(tgt[i] - cur.current[i]) < 0.02 && Math.abs(vel.current[i]) < 0.02) {
          cur.current[i] = tgt[i]
          vel.current[i] = 0
        } else {
          settled = false
        }
      }
      setAt(cur.current.slice())
      if (settled) {
        raf.current = 0
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    }
    /* `tune` sits here beside the targets for the reason
       Brightness spells out: the loop closes over it, so
       without it a knob turned mid-flight would do nothing
       until something else restarted the effect. Restarting
       picks up from the refs, so it continues rather than
       snapping. */
  }, [key, tune, instant])

  if (at.length !== targets.length) {
    return Array.from({ length: targets.length }, (_, i) => at[i] ?? 0)
  }
  return at
}

/* Read once, the way the wheel and the pill nav do. A
   preference, not a live input. */
const stillness = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches


const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const num = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

const layoutKind = (v: unknown): "auto" | "fill" | "fixed" => {
  if (v == null) return "auto"
  if (typeof v === "number") return Number.isFinite(v) ? "fixed" : "auto"
  const s = String(v).trim().toLowerCase()
  if (!s || s === "auto" || s === "max-content" || s === "min-content" || s === "fit-content") {
    return "auto"
  }
  if (
    s.endsWith("%") ||
    s.endsWith("vw") ||
    s.endsWith("vh") ||
    s.endsWith("dvh") ||
    s.endsWith("svh") ||
    s.includes("calc(")
  ) {
    return "fill"
  }
  return "fixed"
}

const merge = <T extends Record<string, unknown>>(base: T, extra: unknown): T => {
  const o = extra && typeof extra === "object" ? (extra as Record<string, unknown>) : {}
  return { ...base, ...o }
}

const MAX = 8
const FALLBACK_W = 340
const FALLBACK_H = 300
/* Resting width of one panel at the original 340px strip,
   five pictures and a default 8px gap: (340 - 4*8) / 5. */
const FALLBACK_PANEL = 62

const DEFAULT_LAYOUT = {
  direction: "horizontal" as "horizontal" | "vertical",
  mode: "stretch" as "stretch" | "fixed",
  extent: FALLBACK_PANEL,
  gap: 8,
  radius: 8,
  padding: 0,
}

const DEFAULT_COLORS = {
  mat: "rgba(0, 0, 0, 0)",
  fill: "#f1f1f0",
}

type LayoutConfig = typeof DEFAULT_LAYOUT
type ColorsConfig = typeof DEFAULT_COLORS

type Pic = { name: string; src: string; alt?: string; link?: string }

/* How much the open one takes, as a share of a resting
   picture. 50 is 1.8 — nearly three times a resting one. */
const lift = (open: number) => 0.4 + (clamp(open, 0, 100) / 100) * 2.8

/* How far the swell carries: a gaussian on the distance in
   pictures. 35 lands the first neighbour at a tenth. */
const fall = (d: number, reach: number) => {
  const s = 0.35 + (clamp(reach, 0, 100) / 100) * 0.9
  return Math.exp(-((d / s) ** 2))
}

function Play({
  pics,
  open = 50,
  reach = 35,
  bounce = 10,
  layout,
  colors,
  linkFor = () => "",
  newTab = true,
  fitHeight = false,
}: {
  pics: Pic[]
  open?: number
  reach?: number
  bounce?: number
  layout: LayoutConfig
  colors: ColorsConfig
  linkFor?: (i: number) => string
  newTab?: boolean
  fitHeight?: boolean
}) {
  const [at, setAt] = useState<number | null>(null)
  const still = stillness()
  const down = useRef<{ x: number; y: number; i: number } | null>(null)
  const atRef = useRef<number | null>(null)
  atRef.current = at
  const linkRef = useRef({ linkFor, newTab })
  linkRef.current = { linkFor, newTab }
  const vertical = layout.direction === "vertical"

  const want = pics.map((_, i) => (at === null ? 0 : fall(Math.abs(i - at), reach) * 100))
  const swell = useSprings(want, bounce, still)

  const g = clamp(num(layout.gap, DEFAULT_LAYOUT.gap), 0, 48)
  const r = clamp(num(layout.radius, DEFAULT_LAYOUT.radius), 0, 80)
  const extent = clamp(num(layout.extent, DEFAULT_LAYOUT.extent), 24, 400)
  const stretch = layout.mode === "stretch"
  const k = lift(open)
  const strip = pics.length * extent + Math.max(0, pics.length - 1) * g
  const sumU = swell.reduce((acc, v) => acc + (v ?? 0) / 100, 0)
  const stack = extent * (pics.length + k * sumU) + Math.max(0, pics.length - 1) * g

  const openLink = (i: number) => {
    const href = linkRef.current.linkFor(i)
    if (!href || href === "#" || typeof window === "undefined" || RenderTarget.current() === RenderTarget.canvas) return
    if (linkRef.current.newTab) window.open(href, "_blank", "noopener,noreferrer")
    else window.location.href = href
  }

  const onDown = (i: number) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    down.current = { x: e.clientX, y: e.clientY, i }
  }
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = down.current
    down.current = null
    if (!d) return
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return
    if (vertical) {
      if (atRef.current === d.i) openLink(d.i)
      else setAt(d.i)
      return
    }
    openLink(d.i)
  }

  return (
    <div
      className="acc"
      data-mode={stretch ? "stretch" : "fixed"}
      data-direction={vertical ? "vertical" : "horizontal"}
      data-size={fitHeight ? "auto" : undefined}
      style={
        {
          gap: g,
          borderRadius: r,
          padding: 0,
          "--acc-extent": `${strip}px`,
          "--acc-stack": `${stack}px`,
          "--mat": colors.mat,
          "--cell-fill": colors.fill,
        } as CSSProperties
      }
      onPointerOut={(e) => {
        if (vertical) return
        const to = e.relatedTarget as Node | null
        if (!to || !e.currentTarget.contains(to)) setAt(null)
      }}
      onPointerCancel={() => {
        down.current = null
        if (!vertical) setAt(null)
      }}
      onPointerUp={onUp}
    >
      {pics.map((pic, i) => {
        const u = (swell[i] ?? 0) / 100
        const href = linkFor(i)
        return (
          <div
            key={pic.name}
            className="acc-cell"
            data-open={at === i || undefined}
            style={{
              flexGrow: 1 + k * u,
              borderRadius: r,
              cursor: href || vertical ? "pointer" : undefined,
            }}
            onPointerEnter={() => {
              if (vertical) return
              if (at === i) return
              setAt(i)
            }}
            onPointerDown={onDown(i)}
          >
            <img src={pic.src} alt={pic.alt || ""} draggable={false} />
          </div>
        )
      })}
    </div>
  )
}

const hrefOf = (link: unknown) => {
  if (!link) return ""
  let raw = ""
  if (typeof link === "string") raw = link.trim()
  else if (typeof link === "object") {
    const o = link as { href?: string; url?: string }
    raw = String(o.href || o.url || "").trim()
  }
  if (!raw || raw === "#") return ""
  return raw
}

const srcOf = (image: unknown) => {
  if (!image) return ""
  if (typeof image === "string") {
    return image.startsWith("data:framer/") ? "" : image
  }
  if (typeof image === "object") {
    const o = image as { src?: string; url?: string; srcSet?: string }
    const direct = String(o.src || o.url || "").trim()
    if (direct && !direct.startsWith("data:framer/")) return direct
    const set = String(o.srcSet || "")
    const first = set.split(",")[0]?.trim().split(/\s+/)[0] || ""
    return first.startsWith("data:framer/") ? "" : first
  }
  return ""
}

const altOf = (image: unknown) => {
  if (image && typeof image === "object") {
    const alt = String((image as { alt?: string }).alt || "").trim()
    if (alt) return alt
  }
  return ""
}

type ImageItem = {
  image?: { src?: string; alt?: string } | string
  link?: unknown
}

interface ImageAccordionProps {
  images?: ImageItem[]
  open?: number
  reach?: number
  bounce?: number
  layout?: Partial<LayoutConfig>
  colors?: Partial<ColorsConfig>
  /* Kept so existing canvas instances that still pass it
     continue to look right after the controls were grouped. */
  gap?: number
  link?: unknown
  newTab?: boolean
  style?: CSSProperties
}

const DEFAULT_ITEMS: ImageItem[] = [
  { image: { src: "https://framerusercontent.com/images/76ALk5JQ6yA9nishicCCd5ha8t8.webp", alt: "Pink" }, link: "" },
  { image: { src: "https://framerusercontent.com/images/dzITTxCYuY2vNqzxqU9lT4AQgxo.webp", alt: "Lilac" }, link: "" },
  { image: { src: "https://framerusercontent.com/images/qgZaEhuGDDKTtvyJYbOuUZplYFY.webp", alt: "Orange Red" }, link: "" },
  { image: { src: "https://framerusercontent.com/images/e4EcjJZbSotOm6aqzJvRzDLMUJo.webp", alt: "Orange Green" }, link: "" },
  { image: { src: "https://framerusercontent.com/images/GJHQxvk6rs16o7eFKOb2rfAqlqU.webp", alt: "Blue" }, link: "" },
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 340
 * @framerIntrinsicHeight 342
 * @framerDisableUnlink
 */
export default function ImageAccordion(props: ImageAccordionProps) {
  const {
    images = DEFAULT_ITEMS,
    open = 50,
    reach = 35,
    bounce = 10,
    link = "",
    newTab = true,
    style,
  } = props

  const layout = merge(DEFAULT_LAYOUT, props.layout)
  const colors = merge(DEFAULT_COLORS, props.colors)
  if (props.layout == null && typeof props.gap === "number") {
    layout.gap = props.gap
    layout.radius = Math.min(layout.radius, props.gap)
  }

  const pad = clamp(num(layout.padding, DEFAULT_LAYOUT.padding), 0, 64)

  const pics: Pic[] = (Array.isArray(images) ? images : [])
    .map((it, i) => {
      const src = srcOf(it?.image)
      return {
        name: String(i),
        src,
        alt: altOf(it?.image),
        link: hrefOf(it?.link),
      }
    })
    .filter((it) => it.src)
    .slice(0, MAX)

  const shared = hrefOf(link)
  const linkFor = (i: number) => pics[i]?.link || shared
  const vertical = layout.direction === "vertical"
  const fitHeight = vertical && layoutKind(style?.height) === "auto"

  return (
    <div
      style={
        {
          position: "relative",
          overflow: fitHeight ? "visible" : vertical ? "hidden" : "visible",
          width: FALLBACK_W,
          height: FALLBACK_H,
          ...style,
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: vertical || layout.mode === "stretch" ? "stretch" : "center",
          justifyContent: vertical || layout.mode === "stretch" ? "stretch" : "center",
          boxSizing: "border-box",
          padding: pad,
          background: colors.mat,
          ...(fitHeight ? { height: "auto" } : null),
        } as CSSProperties
      }
    >
      <style>{CSS}</style>
      {pics.length > 0 && (
        <Play
          pics={pics}
          open={open}
          reach={reach}
          bounce={bounce}
          layout={layout}
          colors={colors}
          linkFor={linkFor}
          newTab={newTab}
          fitHeight={fitHeight}
        />
      )}
    </div>
  )
}

ImageAccordion.displayName = "Image Accordion"

addPropertyControls(ImageAccordion, {
  images: {
    type: ControlType.Array,
    title: "Images",
    maxCount: MAX,
    defaultValue: DEFAULT_ITEMS,
    control: {
      type: ControlType.Object,
      controls: {
        image: { type: ControlType.ResponsiveImage, title: "Image" },
        link: { type: ControlType.Link, title: "Link", defaultValue: "" },
      },
    },
    description: "One panel per image, up to eight, in a row or a stack. An item's own link is used if set; otherwise the main Link.",
  },
  open: {
    type: ControlType.Number,
    title: "Open",
    defaultValue: 50,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  reach: {
    type: ControlType.Number,
    title: "Reach",
    defaultValue: 35,
    min: 0,
    max: 100,
    step: 1,
  },
  bounce: {
    type: ControlType.Number,
    title: "Bounce",
    defaultValue: 10,
    min: 0,
    max: 100,
    step: 1,
  },
  layout: {
    type: ControlType.Object,
    title: "Layout",
    defaultValue: DEFAULT_LAYOUT,
    controls: {
      direction: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: DEFAULT_LAYOUT.direction,
        displaySegmentedControl: true,
        description:
          "Horizontal opens under the pointer. Vertical stacks the panels and opens on a direct click, with no hover — set this per breakpoint for mobile.",
      },
      mode: {
        type: ControlType.Enum,
        title: "Size",
        options: ["stretch", "fixed"],
        optionTitles: ["Stretch", "Fixed"],
        defaultValue: DEFAULT_LAYOUT.mode,
        displaySegmentedControl: true,
        hidden(props: { layout?: { direction?: string } }) {
          return (props.layout?.direction ?? "horizontal") === "vertical"
        },
        description:
          "Stretch fills the component's width and height. Fixed uses the panel size you set, independent of the component; the other axis still follows the frame.",
      },
      extent: {
        type: ControlType.Number,
        title: "Panel",
        defaultValue: DEFAULT_LAYOUT.extent,
        min: 24,
        max: 400,
        step: 1,
        unit: "px",
        hidden(props: { layout?: { mode?: string; direction?: string } }) {
          if ((props.layout?.direction ?? "horizontal") === "vertical") return false
          return (props.layout?.mode ?? "stretch") !== "fixed"
        },
        description: "Resting width (horizontal) or height (vertical) of each panel. In vertical Fit the component height is this times the number of images, plus gaps, the open extra and padding.",
      },
      gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: DEFAULT_LAYOUT.gap,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
      },
      radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: DEFAULT_LAYOUT.radius,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
      },
      padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: DEFAULT_LAYOUT.padding,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
      },
    },
  },
  colors: {
    type: ControlType.Object,
    title: "Colors",
    defaultValue: DEFAULT_COLORS,
    controls: {
      mat: {
        type: ControlType.Color,
        title: "Mat",
        defaultValue: DEFAULT_COLORS.mat,
      },
      fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: DEFAULT_COLORS.fill,
      },
    },
  },
  link: {
    type: ControlType.Link,
    title: "Link",
    defaultValue: "",
  },
  newTab: {
    type: ControlType.Boolean,
    title: "New Tab",
    defaultValue: true,
    enabledTitle: "On",
    disabledTitle: "Off",
    description:
      "Explore [more components](https://dub.sh/Explore-more).\n\nMade by [Till Janek](https://dub.sh/made-by-tilljanek).",
  },
})
