// Progress Pill by Louis Studios.
// More hand-made components at https://studios.lou15.com/?ref=framer

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* Progress Pill: a soft, pillowy action button. Press it and the label rolls up out of view
   while a recessed progress track rolls in from below and fills; when the work is done the
   track melts away, a check rises in, slides aside and "Done" settles next to it. A moment
   later the whole column rolls down and the original label drops back in from above.
   Every move is one shared damped spring, so the pieces travel together like a slot reel.
   Geometry is measured in "ref px" (a 97 px tall pill) and scaled to `size`. */

export type ProgressPillStatus = "idle" | "loading" | "done"

export interface ProgressPillProps {
  /** Visible text on the button while idle. */
  label?: string
  /** Visible text shown beside the check once the work is finished. */
  doneLabel?: string
  /** Seconds the simulated progress takes when `progress` is not controlled. */
  duration?: number
  /** Controlled progress from 0 to 1 while loading. Leave undefined to let the button fill itself over `duration`. Reaching 1 finishes the run. */
  progress?: number
  /** Seconds the finished state stays up before the button resets itself. */
  doneHold?: number
  /** Resets to the idle label by itself after `doneHold`. When false, the finished state stays until the button is pressed again. */
  autoReset?: boolean
  /** Called when the button is pressed and a run starts. */
  onStart?: () => void
  /** Called when the progress reaches 100 percent and the check appears. */
  onComplete?: () => void
  /** Called when the button rolls back to its idle label. */
  onReset?: () => void
  /** Called whenever the status changes between "idle", "loading" and "done". */
  onStatusChange?: (status: ProgressPillStatus) => void
  /** Disables the button (it keeps its look but ignores input). */
  disabled?: boolean
  /** Stage colour behind the button. Use "transparent" to sit it on your own surface. */
  background?: string
  /** Colour of the button face at its centre; the soft dished shading blends from this to `rim`. */
  surface?: string
  /** Colour of the button face near its edge (the pillowy highlight band). */
  rim?: string
  /** Hairline outline of the button and of the progress track. */
  outline?: string
  /** Colour of the soft shadow under the button. */
  shadowColor?: string
  /** Ink of the labels and of the check disc. */
  color?: string
  /** Colour of the tick inside the check disc. */
  checkColor?: string
  /** Colour of the progress fill. */
  barColor?: string
  /** Colour of the recessed progress track. */
  trackColor?: string
  /** Font stack for the labels. */
  font?: string
  /** Label weight. */
  fontWeight?: number
  /** Button height in px at full size. The whole piece shrinks to fit narrower containers. */
  size?: number
  /** Showcase mode: presses itself, fills, finishes and resets in a seamless 10.3 s loop (two presses). Any pointer or keyboard input stops it. */
  autoplay?: boolean
  /** Drives every animation from this clock in seconds instead of real time (for frame-exact video capture). Implies the showcase loop. */
  time?: number
  /** Extra class name for the outer element. */
  className?: string
  /** Inline styles for the outer element (it fills its parent: width and height 100%, min height 360 px). */
  style?: React.CSSProperties
}

// ---------- measured geometry (ref px, 97 px tall pill) ----------
const PILL_H = 97
const PILL_PAD = 55.25 // horizontal room around the label inside the pill (217 px wide for the sample label)
const PILL_MIN_W = 217.5
const FONT_PX = 28.4
const TRACKING = -0.25 // px at full size
const TRACK_W = 143.5
const TRACK_H = 14.5
const FILL_INSET = 3.25
const DISC = 28.5
const DISC_GAP = 12.7 // disc edge to the label's advance box
const GROUP_DX = 1.25 // the finished row is centred on ink, not on the label's advance (its side bearing)
const TRAVEL = 52 // the reel's step between rows
const LABEL_DY = 0.5 // measured optical drop of the labels below cap centre
const HOVER_SCALE = 1.048
const LABEL_FLOOR = 11
// the hairline outline fades out along the lit top edge and half way along the bottom
const RING_MASK = "linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 1) 14%, rgba(0, 0, 0, 1) 100%)" // ls:keep

// ---------- timing (seconds), measured frame by frame at 30 fps ----------
const W_SPRING = 12.9 // rad/s
const Z_SPRING = 0.72
const FULL_TO_DONE = 0.102 // fill reaches 100 percent, then the check starts rising
const BAR_OUT_DELAY = 0.042
const CHECK_SLIDE_DELAY = 0.2
const DONE_TEXT_DELAY = 0.25
const LOOP = 310 / 30 // showcase loop: two presses
// the second press of the loop finishes a touch quicker, as in the measured reference
const SHOWCASE = [
  { at: 11.9 / 30, dur: 3, lag: 0, hold: 0.74 },
  { at: 166.9 / 30, dur: 3 - 3 / 30, lag: 1.5 / 30, hold: 0.74 + 0.85 / 30 },
]
const LOOP_HOVER = 7.4 / 30
const LOOP_CLICK = 11.9 / 30

// ---------- colour helpers ----------
type RGB = [number, number, number]
/** Framer colour tokens arrive as var(--token-id) on the canvas (the value lives on document.body)
    and as var(--token-id, rgb(...)) on published sites: resolve both to a plain colour string. */
function resolveColor(c: string): string {
  let s = (c || "").replace(/\/\*[\s\S]*?\*\//g, "").trim()
  for (let i = 0; i < 4 && s.startsWith("var("); i++) {
    const m = s.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/)
    if (!m) break
    let live = ""
    if (typeof document !== "undefined" && document.body) {
      live = getComputedStyle(document.body).getPropertyValue(m[1]).trim() || getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim()
    }
    s = (live || m[2] || "").trim()
  }
  return s
}
function rgbOf(c: string): RGB {
  const s = resolveColor(c)
  const p3 = s.match(/^color\(\s*display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (p3) return [+p3[1] * 255, +p3[2] * 255, +p3[3] * 255]
  if (s[0] === "#") {
    let h = s.slice(1)
    if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((x) => x + x).join("")
    const n = parseInt(h.slice(0, 6), 16)
    if (!isNaN(n)) return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const m = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/)
  if (m) return [+m[1], +m[2], +m[3]]
  return [128, 128, 128] // ls:keep
}
const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = (c: RGB, a = 1) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${+a.toFixed(4)})`
const WHITE: RGB = [255, 255, 255] // ls:keep

// ---------- motion helpers ----------
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutQuad = (v: number) => {
  const t = clamp01(v)
  return 1 - (1 - t) * (1 - t)
}
const easeOutCubic = (v: number) => {
  const t = clamp01(v)
  return 1 - (1 - t) * (1 - t) * (1 - t)
}
const easeInOutQuad = (v: number) => {
  const t = clamp01(v)
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}
const smooth = (v: number) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}
/** damped spring released from rest: 0 at tau 0, settling at 1 */
function spring(tau: number) {
  if (tau <= 0) return 0
  const w = W_SPRING
  const z = Z_SPRING
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau))
}

// ---------- the timeline: pure function of the event times ----------
type Events = { click: number; done: number; reset: number; hoverAt: number; hoverFrom: number; hoverTo: number; hoverDur: number; lag?: number }
type Look = {
  scale: number
  label: [number, number, number] // y, opacity, blur
  bar: [number, number, number]
  check: [number, number, number, number] // x, y, opacity, blur
  doneText: [number, number, number] // x, y, opacity
  fill: number
}
const NONE = -1e9

function lookAt(t: number, ev: Events, fill: number, checkX: number, reduce: boolean): Look {
  const A = TRAVEL
  const hoverU = ev.hoverDur > 0 ? (t - ev.hoverAt) / ev.hoverDur : 1
  const hoverE = ev.hoverTo > ev.hoverFrom ? easeInOutQuad(hoverU) : easeOutQuad(hoverU)
  const scale = reduce ? 1 : ev.hoverFrom + (ev.hoverTo - ev.hoverFrom) * hoverE
  const look: Look = { scale, label: [0, 1, 0], bar: [0, 0, 0], check: [0, 0, 0, 0], doneText: [0, 0, 0], fill } // ls:keep
  const loading = ev.click > ev.reset
  const done = ev.done > ev.click && ev.done > ev.reset
  if (reduce) {
    // plain cross fades, no travel and no blur
    const f = (tau: number) => smooth(tau / 0.18)
    if (loading && !done) {
      const k = f(t - ev.click)
      look.label = [0, 1 - k, 0]
      look.bar = [0, k, 0]
    } else if (done) {
      const k = f(t - ev.done)
      look.label = [0, 0, 0]
      look.bar = [0, 1 - k, 0]
      look.check = [checkX, 0, k, 0]
      look.doneText = [0, 0, k]
    } else if (ev.reset > NONE) {
      const k = f(t - ev.reset)
      look.label = [0, k, 0]
      look.check = [checkX, 0, 1 - k, 0]
      look.doneText = [0, 0, 1 - k]
    }
    return look
  }
  if (loading || done) {
    // label rolls up and blurs away
    const tau = t - ev.click
    const u = clamp01(tau / 0.175)
    look.label = [-A * spring(tau), 1 - u * u, 4 * u]
    // the track rolls in from below, sharpening as it lands
    const bt = t - ev.click
    look.bar = [A * 1.05 * (1 - spring(bt)), smooth((bt - 0.04) / 0.2), 3.5 * (1 - easeOutQuad(bt / 0.24))]
  } else if (ev.reset > NONE) {
    // the label drops back in from above
    const tau = t - ev.reset - 0.015
    look.label = [-A * (1 - spring(tau)), clamp01((tau - 0.015) / 0.2), 0]
  }
  if (done) {
    const ct = t - ev.done
    const slide = spring(ct - CHECK_SLIDE_DELAY - (ev.lag || 0))
    look.check = [checkX * slide, A * 1.1 * (1 - spring(ct)), smooth(ct / 0.2), 0]
    const ot = t - ev.done - BAR_OUT_DELAY
    look.bar = [0, ot > 0 ? 1 - easeOutQuad(ot / 0.3) : 1, ot > 0 ? 6.4 * easeOutQuad(ot / 0.24) : 0]
    const dt = t - ev.done - DONE_TEXT_DELAY - (ev.lag || 0)
    look.doneText = [6.5 * (1 - easeOutCubic(dt / 0.24)), 0, easeOutQuad(dt / 0.3)]
  } else if (!loading && ev.reset > NONE && ev.done > NONE) {
    // the finished row rolls down out of view, the check a frame ahead of the text
    const ct = t - ev.reset
    look.check = [checkX, A * spring(ct), 1 - smooth((ct - 0.04) / 0.26), 0]
    const tt = ct - 0.033
    look.doneText = [0, A * spring(tt), 1 - smooth((tt - 0.01) / 0.21)]
  }
  return look
}

// ---------- check glyph ----------
function CheckDisc({ disc, tick, px }: { disc: string; tick: string; px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ display: "block", overflow: "visible" }}>
      <circle cx="12" cy="12" r="12" fill={disc} />
      <path d="M7.9 12.9 L10.9 15.6 L16.5 8.1" fill="none" stroke={tick} strokeWidth="2.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

let STYLE_ID = 0

function ProgressPill({
  label = "Back Up",
  doneLabel = "Done",
  duration = 3,
  progress,
  doneHold = 0.74,
  autoReset = true,
  onStart,
  onComplete,
  onReset,
  onStatusChange,
  disabled = false,
  background = "#f1f1f1",
  surface = "#d7d7da",
  rim = "#f0f0f3",
  outline = "#c9c8cc",
  shadowColor = "#2e2d06",
  color = "#000000",
  checkColor = "#ffffff",
  barColor = "#37363b",
  trackColor = "#e9e8eb",
  font = "system-ui, sans-serif",
  fontWeight = 600,
  size = 97,
  autoplay = false,
  time,
  className,
  style,
}: ProgressPillProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const pillRef = React.useRef<HTMLButtonElement>(null)
  const labelRef = React.useRef<HTMLSpanElement>(null)
  const barRef = React.useRef<HTMLDivElement>(null)
  const fillRef = React.useRef<HTMLDivElement>(null)
  const checkRef = React.useRef<HTMLDivElement>(null)
  const doneRef = React.useRef<HTMLSpanElement>(null)
  const [scaleFit, setScaleFit] = React.useState(1)
  const [status, setStatus] = React.useState<ProgressPillStatus>("idle")
  const [metrics, setMetrics] = React.useState({ labelW: 103, doneW: 64, capShift: 0 })
  const [reduce, setReduce] = React.useState(false)
  const [showcase, setShowcase] = React.useState(autoplay)
  React.useEffect(() => setShowcase(autoplay), [autoplay])
  const cls = React.useMemo(() => `lspp${++STYLE_ID}`, [])

  const kickRef = React.useRef<() => void>(() => {})
  const hoverRef = React.useRef<(on: boolean) => void>(() => {})
  const live = React.useRef({
    clock: 0,
    ev: { click: NONE, done: NONE, reset: NONE, hoverAt: NONE, hoverFrom: 1, hoverTo: 1, hoverDur: 0 } as Events,
    fill: 0,
    full: NONE,
    hovered: false,
  })
  const props = React.useRef({ duration, progress, doneHold, autoReset, onStart, onComplete, onReset, onStatusChange })
  props.current = { duration, progress, doneHold, autoReset, onStart, onComplete, onReset, onStatusChange }

  // reduced motion
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setReduce(mq.matches)
    on()
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])

  // fit narrow containers
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const need = (Math.max(PILL_MIN_W, metrics.labelW + PILL_PAD * 2) + 48) * (size / PILL_H)
      setScaleFit(w > 0 && need > w ? Math.max(Math.min(1, LABEL_FLOOR / ((FONT_PX * size) / PILL_H)), w / need) : 1)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [size, metrics.labelW])

  // measure the labels and the baseline in the DOM so text sits optically centred on its caps
  React.useEffect(() => {
    let dead = false
    const measure = () => {
      if (dead || typeof document === "undefined") return
      const probe = document.createElement("div")
      probe.style.cssText = `position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-family:${font};font-size:${FONT_PX}px;font-weight:${fontWeight};letter-spacing:${TRACKING}px;line-height:${FONT_PX}px;height:${FONT_PX}px`
      const a = document.createElement("span")
      a.textContent = label
      const b = document.createElement("span")
      b.textContent = doneLabel
      const mark = document.createElement("span")
      mark.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline"
      probe.append(a, mark, document.createElement("br"), b)
      document.body.appendChild(probe)
      const baseline = mark.offsetTop
      const labelW = a.getBoundingClientRect().width
      const doneW = b.getBoundingClientRect().width
      probe.remove()
      const c = document.createElement("canvas").getContext("2d")
      let cap = FONT_PX * 0.705
      if (c) {
        c.font = `${fontWeight} ${FONT_PX}px ${font}`
        cap = c.measureText("H").actualBoundingBoxAscent || cap
      }
      setMetrics({ labelW, doneW, capShift: FONT_PX / 2 - (baseline - cap / 2) })
    }
    measure()
    document.fonts?.ready?.then(measure)
    return () => {
      dead = true
    }
  }, [label, doneLabel, font, fontWeight])

  const s = (size / PILL_H) * scaleFit
  const pillW = Math.max(PILL_MIN_W, metrics.labelW + PILL_PAD * 2)
  const groupW = DISC + DISC_GAP + metrics.doneW
  const checkX = -(groupW / 2 - DISC / 2) + GROUP_DX
  const doneX = -groupW / 2 + DISC + DISC_GAP + GROUP_DX

  const setStat = React.useCallback((st: ProgressPillStatus) => {
    setStatus(st)
    props.current.onStatusChange?.(st)
  }, [])

  const start = React.useCallback(() => {
    const L = live.current
    const ev = L.ev
    const loading = ev.click > ev.reset
    const done = ev.done > ev.click && ev.done > ev.reset
    if (loading && !done) return
    if (done) {
      ev.reset = L.clock
      setStat("idle")
      props.current.onReset?.()
      kickRef.current()
      return
    }
    ev.click = L.clock
    ev.hoverFrom = currentScale(L)
    ev.hoverTo = 1
    ev.hoverAt = L.clock
    ev.hoverDur = 0.2
    L.fill = 0
    L.full = NONE
    setStat("loading")
    props.current.onStart?.()
    kickRef.current()
  }, [setStat])

  // the frame loop
  React.useEffect(() => {
    const L = live.current
    let raf = 0
    let last = 0
    let visible = true
    let onscreen = true
    const showcaseLoop = time !== undefined || showcase
    const apply = (lk: Look) => {
      const sc = (v: number) => (v * s).toFixed(3)
      if (pillRef.current) pillRef.current.style.transform = `translate(-50%, -50%) scale(${lk.scale.toFixed(5)})`
      const el = labelRef.current
      if (el) {
        el.style.transform = `translate(-50%, ${sc(lk.label[0] + metrics.capShift + LABEL_DY)}px)`
        el.style.opacity = lk.label[1].toFixed(4)
        el.style.filter = lk.label[2] > 0.02 ? `blur(${sc(lk.label[2])}px)` : "none"
        el.style.visibility = lk.label[1] <= 0.002 ? "hidden" : "visible"
      }
      const b = barRef.current
      if (b) {
        b.style.transform = `translate(-50%, ${sc(lk.bar[0])}px)`
        b.style.opacity = lk.bar[1].toFixed(4)
        b.style.filter = lk.bar[2] > 0.02 ? `blur(${sc(lk.bar[2])}px)` : "none"
        b.style.visibility = lk.bar[1] <= 0.002 ? "hidden" : "visible"
      }
      const f = fillRef.current
      if (f) {
        const inner = TRACK_W - FILL_INSET * 2
        const h = TRACK_H - FILL_INSET * 2
        f.style.width = `${sc(Math.max(h, inner * lk.fill))}px`
      }
      const c = checkRef.current
      if (c) {
        c.style.transform = `translate(${sc(lk.check[0] - DISC / 2)}px, ${sc(lk.check[1] - DISC / 2)}px)`
        c.style.opacity = lk.check[2].toFixed(4)
        c.style.visibility = lk.check[2] <= 0.002 ? "hidden" : "visible"
      }
      const d = doneRef.current
      if (d) {
        d.style.transform = `translate(${sc(doneX + lk.doneText[0])}px, ${sc(lk.doneText[1] + metrics.capShift + LABEL_DY)}px)`
        d.style.opacity = lk.doneText[2].toFixed(4)
        d.style.visibility = lk.doneText[2] <= 0.002 ? "hidden" : "visible"
      }
    }
    const step = (now: number) => {
      raf = 0
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      if (time !== undefined || (showcaseLoop && !reduce)) {
        // the showcase is a pure function of the clock: seamless and frame exact
        const clock = time !== undefined ? time : L.clock + dt
        L.clock = clock
        const base = Math.floor(clock / LOOP) * LOOP
        // presses of the previous loop and this one, as absolute times
        type Press = { hover: number; click: number; done: number; reset: number; dur: number; lag: number }
        let cur: Press | null = null
        let prev: Press | null = null
        for (const b0 of [base - LOOP, base]) {
          for (const c of SHOWCASE) {
            const click = b0 + c.at
            const done = click + c.dur + FULL_TO_DONE
            const p = { hover: click - (LOOP_CLICK - LOOP_HOVER), click, done, reset: done + c.hold, dur: c.dur, lag: c.lag }
            if (p.hover <= clock) {
              prev = cur
              cur = p
            }
          }
        }
        const ev: Events = { click: NONE, done: NONE, reset: NONE, hoverAt: NONE, hoverFrom: 1, hoverTo: 1, hoverDur: 0 }
        let dur = 3
        const pv = prev as Press | null
        if (pv) {
          // the previous press is still settling back to the label
          ev.click = pv.click
          ev.done = pv.done
          ev.reset = pv.reset
          ev.lag = pv.lag
        }
        if (cur) {
          dur = cur.dur
          if (clock >= cur.click) ev.lag = cur.lag
          ev.hoverAt = cur.hover
          ev.hoverFrom = 1
          ev.hoverTo = HOVER_SCALE
          ev.hoverDur = 4 / 30
          if (clock >= cur.click) {
            ev.click = cur.click
            ev.hoverAt = cur.click
            ev.hoverFrom = HOVER_SCALE
            ev.hoverTo = 1
            ev.hoverDur = 0.2
          }
          if (clock >= cur.done) ev.done = cur.done
          if (clock >= cur.reset) ev.reset = cur.reset
        }
        const fill = clamp01((clock - ev.click) / dur)
        apply(lookAt(clock, ev, ev.click > ev.reset ? fill : 0, checkX, false))
      } else {
        L.clock += dt
        const ev = L.ev
        const loading = ev.click > ev.reset && !(ev.done > ev.click)
        const P = props.current
        if (loading) {
          if (P.progress === undefined) L.fill = clamp01((L.clock - ev.click) / Math.max(0.05, P.duration))
          else L.fill += (clamp01(P.progress) - L.fill) * (1 - Math.exp(-dt * 10))
          if (L.fill >= 0.999) {
            L.fill = 1
            if (L.full === NONE) L.full = L.clock
            if (L.clock - L.full >= FULL_TO_DONE) {
              ev.done = L.clock
              setStat("done")
              P.onComplete?.()
            }
          }
        } else if (ev.done > ev.click && ev.done > ev.reset && P.autoReset && L.clock - ev.done >= P.doneHold) {
          ev.reset = L.clock
          setStat("idle")
          P.onReset?.()
          hoverRef.current(L.hovered)
        }
        apply(lookAt(L.clock, ev, L.fill, checkX, reduce))
        const isDone = ev.done > ev.click && ev.done > ev.reset
        const quiet = L.clock - Math.max(ev.click, ev.done, ev.reset, ev.hoverAt) > 1.5
        // nothing left to move: sleep until the next pointer or key event
        if (!loading && !(isDone && P.autoReset) && quiet) return
      }
      if (time === undefined && visible && onscreen) raf = requestAnimationFrame(step)
    }
    const kick = () => {
      if (!raf && visible && onscreen) {
        last = 0
        raf = requestAnimationFrame(step)
      }
    }
    kickRef.current = kick
    const onVis = () => {
      visible = document.visibilityState !== "hidden"
      kick()
    }
    document.addEventListener("visibilitychange", onVis)
    let io: IntersectionObserver | undefined
    if (rootRef.current && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => {
        onscreen = es.some((e) => e.isIntersecting)
        kick()
      })
      io.observe(rootRef.current)
    }
    raf = requestAnimationFrame(step)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      kickRef.current = () => {}
      document.removeEventListener("visibilitychange", onVis)
      io?.disconnect()
    }
  }, [time, showcase, reduce, s, checkX, doneX, metrics.capShift, setStat])

  const stopShowcase = () => {
    if (showcase) {
      setShowcase(false)
      const L = live.current
      L.ev = { click: NONE, done: NONE, reset: NONE, hoverAt: NONE, hoverFrom: 1, hoverTo: 1, hoverDur: 0 }
      L.fill = 0
      L.full = NONE
    }
  }
  const hover = (on: boolean) => {
    const L = live.current
    L.hovered = on
    const ev = L.ev
    const idle = !(ev.click > ev.reset)
    const to = on && idle && !disabled ? HOVER_SCALE : 1
    if (to === ev.hoverTo) return
    ev.hoverFrom = currentScale(L)
    ev.hoverTo = to
    ev.hoverAt = L.clock
    ev.hoverDur = on ? 4 / 30 : 0.2
    kickRef.current()
  }
  hoverRef.current = hover

  // colours
  const sh = rgbOf(shadowColor)
  const rimC = rgbOf(rim)
  const bar = rgbOf(barColor)
  const track = rgbOf(trackColor)
  const out = rgbOf(outline)
  const px = (v: number) => `${(v * s).toFixed(3)}px`

  const faceShadow = [
      `inset 0 ${px(2)} ${px(1.6)} ${rgba(WHITE, 0.8)}`,
      `inset 0 ${px(-2)} ${px(1.6)} ${rgba(WHITE, 0.8)}`,
      `inset 0 0 ${px(1)} ${px(0.5)} ${rgba(WHITE, 0.3)}`,
      `inset 0 ${px(-2.2)} ${px(30)} ${px(18.6)} ${rgba(rimC, 1)}`,
      `0 ${px(13.85)} ${px(19.5)} ${px(-0.9)} ${rgba(sh, 0.084)}`,
  ].join(", ")
  const pillStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: px(pillW),
    height: px(PILL_H),
    transform: "translate(-50%, -50%)",
    padding: 0,
    margin: 0,
    border: "none",
    borderRadius: px(PILL_H / 2),
    background: surface,
    cursor: disabled ? "default" : "pointer",
    color,
    font: "inherit",
    WebkitTapHighlightColor: "transparent",
    outline: "none",
    overflow: "hidden",
    isolation: "isolate",
    boxShadow: faceShadow,
  }
  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginTop: px(-FONT_PX / 2),
    height: px(FONT_PX),
    lineHeight: px(FONT_PX),
    fontFamily: font,
    fontSize: px(FONT_PX),
    fontWeight,
    letterSpacing: px(TRACKING),
    whiteSpace: "nowrap",
    color,
    willChange: "transform, opacity, filter",
  }

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 360,
        background,
        overflow: "hidden",
        ...style,
      }}
      onPointerDown={stopShowcase}
      onKeyDown={stopShowcase}
    >
      <style>{`.${cls}:focus-visible{box-shadow:0 0 0 ${px(3)} ${background === "transparent" ? rgba(rimC) : background}, 0 0 0 ${px(5.5)} ${rgba(bar, 0.6)}, ${faceShadow} !important}`}</style>
      <button
        ref={pillRef}
        type="button"
        className={cls}
        style={pillStyle}
        disabled={disabled}
        aria-busy={status === "loading"}
        aria-label={status === "done" ? doneLabel : undefined}
        onClick={() => {
          if (time !== undefined) return
          stopShowcase()
          start()
          hover(live.current.hovered)
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            stopShowcase()
            hover(true)
          }
        }}
        onPointerLeave={() => hover(false)}
      >
        <span ref={labelRef} style={{ ...textStyle, transform: `translate(-50%, ${px(metrics.capShift)})` }}>
          {label}
        </span>
        <div
          ref={barRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: px(TRACK_W),
            height: px(TRACK_H),
            marginTop: px(-TRACK_H / 2),
            borderRadius: px(TRACK_H / 2),
            background: `linear-gradient(180deg, ${rgba(mixRgb(track, WHITE, 0.35))} 0%, ${trackColor} 45%, ${rgba(mixRgb(track, WHITE, 0.12))} 100%)`,
            boxShadow: `0 0 0 ${px(0.6)} ${rgba(out, 0.95)}, inset 0 ${px(1)} ${px(0.5)} ${rgba(WHITE, 0.95)}, inset 0 ${px(-1)} ${px(0.5)} ${rgba(WHITE, 0.95)}, inset 0 0 0 ${px(0.5)} ${rgba(WHITE, 0.3)}`,
            transform: "translate(-50%, 0)",
            opacity: 0,
            visibility: "hidden",
          }}
        >
          <div
            ref={fillRef}
            style={{
              position: "absolute",
              left: px(FILL_INSET),
              top: px(FILL_INSET),
              height: px(TRACK_H - FILL_INSET * 2),
              width: px(TRACK_H - FILL_INSET * 2),
              borderRadius: px(TRACK_H),
              background: barColor,
              boxShadow: `inset 0 0 0 ${px(0.5)} ${barColor}, inset 0 0 0 ${px(1)} ${rgba(mixRgb(bar, WHITE, 0.15))}`,
            }}
          />
        </div>
        <div
          ref={checkRef}
          aria-hidden="true"
          style={{ position: "absolute", left: "50%", top: "50%", width: px(DISC), height: px(DISC), opacity: 0, visibility: "hidden" }}
        >
          <CheckDisc disc={color} tick={checkColor} px={DISC * s} />
        </div>
        <span
          ref={doneRef}
          aria-hidden={status !== "done"}
          style={{ ...textStyle, left: "50%", opacity: 0, visibility: "hidden", transform: `translate(${px(doneX)}, ${px(metrics.capShift)})` }}
        >
          {doneLabel}
        </span>
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            boxShadow: `inset 0 0 0 ${px(0.75)} ${rgba(out, 0.9)}`,
            WebkitMaskImage: RING_MASK,
            maskImage: RING_MASK,
          }}
        />
      </button>
      <span
        aria-live="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", color }}
      >
        {status === "done" ? doneLabel : status === "loading" ? `${label}...` : ""}
      </span>
    </div>
  )
}

function currentScale(L: { clock: number; ev: Events }) {
  const ev = L.ev
  const u = ev.hoverDur > 0 ? (L.clock - ev.hoverAt) / ev.hoverDur : 1
  const e = ev.hoverTo > ev.hoverFrom ? easeInOutQuad(u) : easeOutQuad(u)
  return ev.hoverFrom + (ev.hoverTo - ev.hoverFrom) * e
}

// ---------- Framer wrapper ----------
const SYSTEM_FONT = "system-ui, sans-serif"
const STAGE_W = 420
const STAGE_H = 360

type FramerProps = Omit<ProgressPillProps, "font" | "fontWeight"> & {
  /** Framer font control value: a style object with fontFamily, fontWeight and fontStyle. */
  fontFace?: { fontFamily?: string; fontWeight?: number | string; fontStyle?: string }
}

/**
 * Progress Pill
 * A soft, pillowy button: press it and the label rolls away into a filling progress track,
 * then a check rises beside Done and it rolls back.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 360
 */
export default function ProgressPillFramer(props: FramerProps) {
  const { fontFace, style, ...rest } = props
  const size = rest.size ?? 97
  const family = fontFace?.fontFamily ? `${fontFace.fontFamily}, ${SYSTEM_FONT}` : SYSTEM_FONT
  const weight = Number(fontFace?.fontWeight) || 600
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
      {/* in-flow spacer: gives Fit (auto) sizing a real stage size; clipped away in Fixed and Fill */}
      <div aria-hidden="true" style={{ width: (STAGE_W * size) / 97, height: (STAGE_H * size) / 97, pointerEvents: "none" }} />
      <ProgressPill {...rest} font={family} fontWeight={weight} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", minHeight: 0 }} />
    </div>
  )
}

addPropertyControls(ProgressPillFramer, {
  label: { type: ControlType.String, title: "Label", defaultValue: "Back Up" },
  doneLabel: { type: ControlType.String, title: "Done label", defaultValue: "Done" },
  duration: { type: ControlType.Number, title: "Duration", defaultValue: 3, min: 0.5, max: 20, step: 0.1, unit: "s", description: "Seconds the progress takes to fill." },
  doneHold: { type: ControlType.Number, title: "Done hold", defaultValue: 0.74, min: 0, max: 10, step: 0.05, unit: "s" },
  autoReset: { type: ControlType.Boolean, title: "Auto reset", defaultValue: true },
  autoplay: { type: ControlType.Boolean, title: "Autoplay", defaultValue: false, description: "Presses itself in a loop until someone interacts." },
  disabled: { type: ControlType.Boolean, title: "Disabled", defaultValue: false },
  size: { type: ControlType.Number, title: "Size", defaultValue: 97, min: 40, max: 200, step: 1, unit: "px", description: "Button height. It shrinks to fit narrow layers." },
  fontFace: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif", defaultValue: { variant: "Semibold" } },
  background: { type: ControlType.Color, title: "Background", defaultValue: "#f1f1f1" },
  surface: { type: ControlType.Color, title: "Surface", defaultValue: "#d7d7da" },
  rim: { type: ControlType.Color, title: "Rim", defaultValue: "#f0f0f3" },
  outline: { type: ControlType.Color, title: "Outline", defaultValue: "#c9c8cc" },
  shadowColor: { type: ControlType.Color, title: "Shadow", defaultValue: "#2e2d06" },
  color: { type: ControlType.Color, title: "Text", defaultValue: "#000000" },
  checkColor: { type: ControlType.Color, title: "Check", defaultValue: "#ffffff" },
  barColor: { type: ControlType.Color, title: "Bar", defaultValue: "#37363b" },
  trackColor: { type: ControlType.Color, title: "Track", defaultValue: "#e9e8eb" },
  onStart: { type: ControlType.EventHandler },
  onComplete: { type: ControlType.EventHandler },
  onReset: { type: ControlType.EventHandler },
})
