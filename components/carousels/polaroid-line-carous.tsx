"use client"

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


export type LandPalette = "dawn" | "alpine" | "dusk" | "mist"

export type SlideItem = {
  image?: { src?: string } | string
  title?: string
  caption?: string
  alt?: string
  palette?: LandPalette
  seed?: number
}

interface PolaroidLineCarouselProps {
  slides?: SlideItem[]
  height?: number | string
  cardWidth?: number
  sag?: number
  swing?: number
  autoplay?: number
  stringColor?: string
  backgroundColor?: string
  inkColor?: string
  buttonsPosition?: "bottom-between" | "bottom-center" | "bottom-right" | "floating-sides" | "top-right"
  bottomOffset?: number
  sideOffset?: number
  buttonSize?: number
  showNavButtons?: boolean
  showCaptions?: boolean
  showCounter?: boolean
  style?: React.CSSProperties
}

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

function stringY(x: number, w: number, y0: number, sag: number): number {
  const t = clamp(x / w, 0, 1)
  return y0 + 4 * sag * t * (1 - t)
}

function springStep(x: number, v: number, target: number, dt: number, k = 70): [number, number] {
  const c = 2 * Math.sqrt(k)
  const nv = v + (k * (target - x) - c * v) * dt
  return [x + nv * dt, nv]
}

function swingStep(a: number, w: number, lineVel: number, dt: number, gain: number): [number, number] {
  const nw = w + (-38 * a - 4.2 * w + lineVel * 0.0034 * gain) * dt
  return [clamp(a + nw * dt, -0.6, 0.6), nw]
}

function nearestAt(off: number, spacing: number, n: number): number {
  return clamp(Math.round(off / spacing), 0, Math.max(0, n - 1))
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n)
}

const PALETTES = {
  dawn: { top: "#e7b7a5", bottom: "#f8e8d6", sun: "#fff4df", far: "#d2b2bb", near: "#3a2a3b", mist: "255,240,232" },
  alpine: { top: "#7ea5c8", bottom: "#e3ecf2", sun: "#ffffff", far: "#a9bfd0", near: "#1c3044", mist: "236,244,250" },
  dusk: { top: "#2a2450", bottom: "#ef8d60", sun: "#ffd9a6", far: "#93607c", near: "#18121f", mist: "255,196,160" },
  mist: { top: "#c4d0cb", bottom: "#eef1ec", sun: "#ffffff", far: "#aebcb5", near: "#2c3a33", mist: "246,248,245" },
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexRgb(h: string): [number, number, number] {
  const v = parseInt(h.replace("#", ""), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function mixRgb(a: string, b: string, t: number): string {
  const A = hexRgb(a)
  const B = hexRgb(b)
  return "rgb(" + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",") + ")"
}

function paintLandscape(seed: number, palette: LandPalette, w = 1600, h = 1000): string {
  if (typeof document === "undefined") return ""
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const g = c.getContext("2d")
  if (!g) return ""
  const P = PALETTES[palette] ?? PALETTES.dawn
  const r = mulberry32(seed * 104729 + 7)

  const sky = g.createLinearGradient(0, 0, 0, h * 0.72)
  sky.addColorStop(0, P.top)
  sky.addColorStop(1, P.bottom)
  g.fillStyle = sky
  g.fillRect(0, 0, w, h)
  const sx = w * (0.22 + r() * 0.56)
  const sy = h * (0.26 + r() * 0.16)
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45)
  halo.addColorStop(0, "rgba(" + hexRgb(P.sun).join(",") + ",.85)")
  halo.addColorStop(0.08, "rgba(" + hexRgb(P.sun).join(",") + ",.55)")
  halo.addColorStop(1, "rgba(" + hexRgb(P.sun).join(",") + ",0)")
  g.fillStyle = halo
  g.fillRect(0, 0, w, h)
  g.fillStyle = P.sun
  g.beginPath()
  g.arc(sx, sy, h * 0.045, 0, Math.PI * 2)
  g.fill()

  const layers = 5
  for (let L = 0; L < layers; L++) {
    const k = L / (layers - 1)
    const base = h * (0.42 + k * 0.4)
    const amp = h * (0.07 + k * 0.1)
    const ph = [r(), r(), r(), r()].map((v) => v * Math.PI * 2)
    const fr = [1.3 + r(), 3.1 + r() * 2, 7 + r() * 4, 17 + r() * 8]
    const ridge = (x: number) => {
      const u = x / w
      return (
        base -
        amp *
          (0.55 * Math.sin(u * fr[0] + ph[0]) +
            0.28 * Math.sin(u * fr[1] + ph[1]) +
            0.12 * Math.abs(Math.sin(u * fr[2] + ph[2])) +
            0.05 * Math.sin(u * fr[3] + ph[3]))
      )
    }
    const mist = g.createLinearGradient(0, base - amp * 1.4, 0, base + amp * 0.4)
    mist.addColorStop(0, "rgba(" + P.mist + ",0)")
    mist.addColorStop(1, "rgba(" + P.mist + "," + (0.55 - k * 0.35).toFixed(2) + ")")
    g.fillStyle = mist
    g.fillRect(0, base - amp * 1.4, w, amp * 1.8)
    const body = g.createLinearGradient(0, base - amp, 0, h)
    body.addColorStop(0, mixRgb(P.far, P.near, Math.pow(k, 1.3)))
    body.addColorStop(1, mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.18)))
    g.fillStyle = body
    g.beginPath()
    g.moveTo(0, h)
    for (let x = 0; x <= w; x += 6) g.lineTo(x, ridge(x))
    g.lineTo(w, h)
    g.closePath()
    g.fill()
    if (L >= layers - 2) {
      g.fillStyle = mixRgb(P.far, P.near, Math.min(1, Math.pow(k, 1.3) + 0.08))
      for (let x = 0; x < w; x += 7 + r() * 9) {
        if (r() < 0.35) continue
        const y = ridge(x) + 2
        const th = h * (0.025 + r() * 0.035) * (0.6 + k)
        const tw = th * 0.32
        g.beginPath()
        g.moveTo(x, y - th)
        g.lineTo(x + tw, y)
        g.lineTo(x - tw, y)
        g.closePath()
        g.fill()
      }
    }
  }

  const vig = g.createRadialGradient(w / 2, h * 0.45, h * 0.3, w / 2, h / 2, w * 0.78)
  vig.addColorStop(0, "rgba(0,0,0,0)")
  vig.addColorStop(1, "rgba(0,0,0,.32)")
  g.fillStyle = vig
  g.fillRect(0, 0, w, h)
  const grain = g.getImageData(0, 0, w, h)
  const d = grain.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (r() - 0.5) * 14
    d[i] += v
    d[i + 1] += v
    d[i + 2] += v
  }
  g.putImageData(grain, 0, 0)
  return c.toDataURL("image/jpeg", 0.88)
}

const DEFAULT_SLIDES: SlideItem[] = [
  {
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1800&auto=format&fit=crop",
    title: "Kyoto Twilight",
    caption: "Arashiyama bamboo groves whispering in the dusk.",
    palette: "dawn",
    seed: 3,
  },
  {
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1800&auto=format&fit=crop",
    title: "Amalfi Coastline",
    caption: "Pastel cliffside villas overlooking the Mediterranean.",
    palette: "dusk",
    seed: 8,
  },
  {
    image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=1800&auto=format&fit=crop",
    title: "Northern Lights",
    caption: "Emerald aurora dancing across the Arctic night sky.",
    palette: "alpine",
    seed: 14,
  },
  {
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1800&auto=format&fit=crop",
    title: "Sahara Whispers",
    caption: "Endless golden dunes carved by the desert wind.",
    palette: "dawn",
    seed: 21,
  },
  {
    image: "https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?q=80&w=1800&auto=format&fit=crop",
    title: "Big Sur Cliffs",
    caption: "Ocean mist rising off the Pacific coastal bluffs.",
    palette: "mist",
    seed: 34,
  },
  {
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1800&auto=format&fit=crop",
    title: "Alpine Emerald",
    caption: "Mirror lake nestled deep in the Austrian Alps.",
    palette: "alpine",
    seed: 55,
  },
]

function useSlideImages(slides: SlideItem[]): string[] {
  const key = slides.map((s) => (typeof s.image === "string" ? s.image : (s.image?.src || "")) + ":" + (s.palette || "dawn") + ":" + (s.seed ?? 1)).join("|")
  const [painted, setPainted] = React.useState(() => slides.map(() => ""))

  React.useEffect(() => {
    setPainted(slides.map((s, i) => {
      const src = typeof s.image === "string" ? s.image : (s.image?.src || "")
      if (src) return ""
      return paintLandscape(s.seed ?? i + 1, s.palette || "dawn")
    }))
  }, [key])

  return slides.map((s, i) => {
    const src = typeof s.image === "string" ? s.image : (s.image?.src || "")
    return src || painted[i] || ""
  })
}

const PL_CSS = `
.pl-root{position:relative;width:100%;height:100%;overflow:hidden;background:var(--pl-bg);color:var(--pl-ink);user-select:none;-webkit-user-select:none;touch-action:pan-y;outline:none;cursor:grab}
.pl-root[data-drag='1']{cursor:grabbing}
.pl-root:focus-visible{box-shadow:inset 0 0 0 2px var(--pl-ink)}
.pl-string{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.pl-card{position:absolute;left:0;top:0;width:var(--pl-cw);transform-origin:50% 0;will-change:transform;cursor:inherit}
.pl-print{margin-top:10px;background:#fbfaf7;padding:10px 10px 0;box-shadow:0 1px 2px rgba(0,0,0,.12),0 18px 30px -16px rgba(0,0,0,.4);transition:transform .5s cubic-bezier(.2,.7,.2,1),filter .5s ease}
.pl-card[data-on='0'] .pl-print{transform:scale(.9);filter:saturate(.7) brightness(.96)}
.pl-shot{position:relative;aspect-ratio:1;overflow:hidden;background:#d9d5cc}
.pl-shot img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;pointer-events:none}
.pl-note{height:46px;display:flex;align-items:center;justify-content:center;padding:0 6px;font:italic 400 15px/1.1 ui-serif,Georgia,'Times New Roman',serif;color:#3b3833;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-peg{position:absolute;left:50%;top:0;width:10px;height:26px;margin-left:-5px;border-radius:2px;background:linear-gradient(90deg,#c9a67a,#e3c9a1 45%,#b8915f);box-shadow:0 2px 3px rgba(0,0,0,.25)}
.pl-peg::after{content:'';position:absolute;left:4px;top:8px;width:2px;height:7px;background:rgba(80,60,30,.45);border-radius:1px}

.pl-bar{position:absolute;display:flex;align-items:center;gap:16px;cursor:default;z-index:20;transition:all .2s ease}
.pl-cap{flex:1;min-width:0;overflow:hidden;padding-bottom:.15em}
.pl-cap>*{display:block;animation:pl-in .55s cubic-bezier(.2,.8,.2,1) both}
.pl-title{font:500 clamp(18px,2.2vw,26px)/1.15 ui-serif,Georgia,'Times New Roman',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-sub{margin-top:4px;font:400 13px/1.4 ui-sans-serif,system-ui,sans-serif;color:var(--pl-muted)}
.pl-count{font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;color:var(--pl-muted)}
.pl-count b{color:var(--pl-ink);font-weight:500}

.pl-btn-group{display:flex;align-items:center;gap:8px}
.pl-btn{appearance:none;width:var(--pl-btn-size, 40px);height:var(--pl-btn-size, 40px);border-radius:50%;border:1px solid var(--pl-line);background:rgba(255,255,255,0.7);backdrop-filter:blur(8px);color:inherit;display:grid;place-items:center;cursor:pointer;transition:background .2s ease,color .2s ease,transform .1s ease}
.pl-btn:hover{background:var(--pl-ink);color:var(--pl-bg);transform:scale(1.05)}
.pl-btn:active{transform:scale(0.95)}
.pl-btn:focus-visible{outline:2px solid var(--pl-ink);outline-offset:2px}

.pl-floating-btn{position:absolute;top:50%;transform:translateY(-50%);z-index:30;box-shadow:0 4px 16px rgba(0,0,0,0.12)}
.pl-floating-prev{left:var(--pl-side-off, 36px)}
.pl-floating-next{right:var(--pl-side-off, 36px)}

.pl-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes pl-in{from{transform:translateY(100%);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pl-cap>*{animation:none}.pl-print{transition:none}}
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PolaroidLineCarousel(props: PolaroidLineCarouselProps) {
  const {
    slides,
    height = "100%",
    cardWidth = 300,
    sag = 46,
    swing = 1,
    autoplay = 4500,
    stringColor = "#8a7f72",
    backgroundColor = "#efece6",
    inkColor = "#161513",
    buttonsPosition = "bottom-between",
    bottomOffset = 32,
    sideOffset = 36,
    buttonSize = 40,
    showNavButtons = true,
    showCaptions = true,
    showCounter = true,
    style,
  } = props

  const safeSlides = (slides && slides.length > 0 ? slides : DEFAULT_SLIDES).map((sl, i) => {
    const fallback = DEFAULT_SLIDES[i % DEFAULT_SLIDES.length] || {}
    let imageSrc = ""
    if (typeof sl.image === "string" && sl.image.length > 0) {
      imageSrc = sl.image
    } else if (typeof sl.image === "object" && sl.image?.src) {
      imageSrc = sl.image.src
    } else if (fallback.image) {
      imageSrc = typeof fallback.image === "string" ? fallback.image : (fallback.image?.src || "")
    }

    return {
      ...fallback,
      ...sl,
      image: imageSrc,
      title: sl.title && sl.title !== "Above the Clouds" ? sl.title : fallback.title,
      caption: sl.caption && !sl.caption.includes("Valais") ? sl.caption : fallback.caption,
    }
  })

  const n = safeSlides.length
  const srcs = useSlideImages(safeSlides)
  const [active, setActive] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const [size, setSize] = React.useState({ w: 1200, h: 800, cw: cardWidth })
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const pathRef = React.useRef<SVGPathElement | null>(null)
  const cards = React.useRef<(HTMLDivElement | null)[]>([])
  const sim = React.useRef({ off: 0, vel: 0, target: 0, a: [] as number[], w: [] as number[] })
  const drag = React.useRef<null | { x: number; off: number; lx: number; lt: number; v: number; moved: boolean }>(null)
  const lastTouch = React.useRef(0)
  const activeRef = React.useRef(0)
  const opts = React.useRef({ sag, swing })
  opts.current = { sag, swing }

  const spacing = size.cw * 1.08
  const goTo = React.useCallback(
    (i: number) => {
      sim.current.target = clamp(i, 0, n - 1) * spacing
    },
    [n, spacing]
  )

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const ro = new ResizeObserver(() => {
      const r = root.getBoundingClientRect()
      const cw = Math.round(Math.max(150, Math.min(cardWidth, r.width * 0.42, r.height * 0.42)))
      setSize({ w: r.width, h: r.height, cw })
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [cardWidth])

  React.useEffect(() => {
    sim.current.target = activeRef.current * spacing
    sim.current.off = activeRef.current * spacing
  }, [spacing])

  React.useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let visible = true
    let raf = 0
    let prev = performance.now()
    const S = sim.current

    const frame = (now: number) => {
      raf = 0
      if (!visible) return
      const dt = Math.min(0.033, (now - prev) / 1000)
      prev = now
      const { w, h, cw } = size
      const y0 = Math.max(40, h * 0.2)
      const d = drag.current
      let lineVel: number
      if (d && d.moved) {
        lineVel = d.v * 1000
      } else {
        const before = S.off
        ;[S.off, S.vel] = springStep(S.off, S.vel, S.target, dt)
        lineVel = -(S.off - before) / Math.max(dt, 1e-3)
      }
      const o = opts.current
      const g = reduce ? 0 : o.swing
      const near = nearestAt(S.off, spacing, n)
      for (let i = 0; i < n; i++) {
        const el = cards.current[i]
        if (!el) continue
        const x = w / 2 + i * spacing - S.off
        if (x < -cw * 1.5 || x > w + cw * 1.5) {
          el.style.visibility = "hidden"
          continue
        }
        el.style.visibility = "visible"
        let a = S.a[i] || 0
        let av = S.w[i] || 0
        ;[a, av] = swingStep(a, av, lineVel, dt, g)
        if (g) a += Math.sin(now / 1300 + i * 1.7) * 0.0009 * g
        S.a[i] = a
        S.w[i] = av
        const y = stringY(x, w, y0, o.sag) - 6
        el.style.transform = "translate(" + (x - cw / 2).toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + a.toFixed(4) + "rad)"
        el.style.zIndex = String(i === near ? n + 1 : n - Math.abs(i - near))
      }
      pathRef.current?.setAttribute("d", "M0 " + y0 + " Q" + w / 2 + " " + (y0 + 2 * o.sag) + " " + w + " " + y0)
      if (near !== activeRef.current) {
        activeRef.current = near
        setActive(near)
      }
      raf = requestAnimationFrame(frame)
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible && !raf) {
        prev = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    io.observe(root)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [size, spacing, n])

  React.useEffect(() => {
    if (!autoplay || n < 2) return
    const t = window.setInterval(() => {
      if (typeof document !== "undefined" && (document.hidden || drag.current || performance.now() - lastTouch.current < autoplay)) return
      goTo(activeRef.current >= n - 1 ? 0 : activeRef.current + 1)
    }, autoplay)
    return () => window.clearInterval(t)
  }, [autoplay, n, goTo])

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".pl-bar, .pl-btn, .pl-floating-btn")) return
    lastTouch.current = performance.now()
    drag.current = { x: e.clientX, off: sim.current.off, lx: e.clientX, lt: e.timeStamp, v: 0, moved: false }
  }

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true
      setDragging(true)
      rootRef.current?.setPointerCapture(e.pointerId)
    }
    if (!d.moved) return
    const dt = Math.max(1, e.timeStamp - d.lt)
    d.v = 0.7 * ((e.clientX - d.lx) / dt) + 0.3 * d.v
    d.lx = e.clientX
    d.lt = e.timeStamp
    const max = (n - 1) * spacing
    let off = d.off - dx
    if (off < 0) off *= 0.35
    if (off > max) off = max + (off - max) * 0.35
    sim.current.off = off
  }

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    lastTouch.current = performance.now()
    if (!d) return
    if (d.moved) {
      setDragging(false)
      sim.current.vel = -d.v * 1000
      goTo(nearestAt(sim.current.off - d.v * 180, spacing, n))
      return
    }
    const card = (e.target as HTMLElement).closest("[data-i]")
    if (card) goTo(Number(card.getAttribute("data-i")))
  }

  const step = (dir: number) => {
    lastTouch.current = performance.now()
    goTo(clamp(activeRef.current + dir, 0, n - 1))
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1)
    else if (e.key === "ArrowLeft") step(-1)
    else return
    e.preventDefault()
  }

  const s = safeSlides[active] || {}

  const isTop = buttonsPosition === "top-right"
  const isCenter = buttonsPosition === "bottom-center"
  const isFloating = buttonsPosition === "floating-sides"

  const barStyle: React.CSSProperties = {
    left: isCenter ? "50%" : `${sideOffset}px`,
    right: isCenter ? "auto" : `${sideOffset}px`,
    transform: isCenter ? "translateX(-50%)" : "none",
    top: isTop ? `${bottomOffset}px` : "auto",
    bottom: isTop ? "auto" : `${bottomOffset}px`,
    justifyContent: isCenter ? "center" : "space-between",
  }

  return (
    <div
      ref={rootRef}
      className="pl-root"
      style={{
        height,
        ["--pl-bg" as any]: backgroundColor,
        ["--pl-ink" as any]: inkColor,
        ["--pl-muted" as any]: "color-mix(in srgb, var(--pl-ink) 55%, transparent)",
        ["--pl-line" as any]: "color-mix(in srgb, var(--pl-ink) 18%, transparent)",
        ["--pl-cw" as any]: size.cw + "px",
        ["--pl-btn-size" as any]: buttonSize + "px",
        ["--pl-side-off" as any]: sideOffset + "px",
        ...style,
      }}
      data-drag={dragging ? "1" : "0"}
      role="region"
      aria-roledescription="carousel"
      aria-label="Polaroid Line Carousel"
      tabIndex={0}
      onKeyDown={onKey}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <style>{PL_CSS}</style>
      <svg className="pl-string" aria-hidden="true">
        <path ref={pathRef} fill="none" stroke={stringColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {safeSlides.map((sl, i) => (
        <div key={i} className="pl-card" data-i={i} data-on={i === active ? "1" : "0"} ref={(el) => { cards.current[i] = el }} aria-hidden={i === active ? undefined : true}>
          <div className="pl-print">
            <div className="pl-shot">{srcs[i] ? <img src={srcs[i]} alt={sl.alt || sl.title || ""} draggable={false} /> : null}</div>
            <div className="pl-note">{sl.title || ""}</div>
          </div>
          <div className="pl-peg" />
        </div>
      ))}

      {isFloating && showNavButtons && (
        <>
          <button type="button" className="pl-btn pl-floating-btn pl-floating-prev" aria-label="Previous" onClick={() => step(-1)}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button type="button" className="pl-btn pl-floating-btn pl-floating-next" aria-label="Next" onClick={() => step(1)}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </>
      )}

      <div className="pl-bar" style={barStyle}>
        {showCaptions && (
          <div className="pl-cap" key={active} aria-hidden="true">
            {s.title ? <span className="pl-title">{s.title}</span> : null}
            {s.caption ? <span className="pl-sub">{s.caption}</span> : null}
          </div>
        )}
        {showCounter && (
          <span className="pl-count" aria-hidden="true">
            <b>{pad2(active + 1)}</b> / {pad2(n)}
          </span>
        )}
        {!isFloating && showNavButtons && (
          <div className="pl-btn-group">
            <button type="button" className="pl-btn" aria-label="Previous" onClick={() => step(-1)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
            <button type="button" className="pl-btn" aria-label="Next" onClick={() => step(1)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="pl-sr" aria-live="polite">
        {"Print " + (active + 1) + " of " + n + (s.title ? ": " + s.title : "")}
      </div>
    </div>
  )
}

addPropertyControls(PolaroidLineCarousel, {
  buttonsPosition: {
    type: ControlType.Enum,
    title: "Button Pos",
    options: ["bottom-between", "bottom-center", "bottom-right", "floating-sides", "top-right"],
    optionTitles: ["Bottom Spread", "Bottom Center", "Bottom Right", "Floating Sides", "Top Right"],
    defaultValue: "bottom-between",
  },
  bottomOffset: {
    type: ControlType.Number,
    title: "Vertical Y",
    min: 0,
    max: 300,
    step: 5,
    defaultValue: 32,
    displayStepper: true,
  },
  sideOffset: {
    type: ControlType.Number,
    title: "Horizontal X",
    min: 0,
    max: 200,
    step: 5,
    defaultValue: 36,
    displayStepper: true,
  },
  buttonSize: {
    type: ControlType.Number,
    title: "Button Size",
    min: 28,
    max: 64,
    step: 2,
    defaultValue: 40,
    displayStepper: true,
  },
  showNavButtons: {
    type: ControlType.Boolean,
    title: "Nav Buttons",
    defaultValue: true,
  },
  showCaptions: {
    type: ControlType.Boolean,
    title: "Captions",
    defaultValue: true,
  },
  showCounter: {
    type: ControlType.Boolean,
    title: "Counter",
    defaultValue: true,
  },
  cardWidth: {
    type: ControlType.Number,
    title: "Card Width",
    min: 150,
    max: 600,
    step: 10,
    defaultValue: 300,
    displayStepper: true,
  },
  sag: {
    type: ControlType.Number,
    title: "String Sag",
    min: 0,
    max: 150,
    step: 2,
    defaultValue: 46,
    displayStepper: true,
  },
  swing: {
    type: ControlType.Number,
    title: "Breeze Swing",
    min: 0,
    max: 3,
    step: 0.1,
    defaultValue: 1,
    displayStepper: true,
  },
  autoplay: {
    type: ControlType.Number,
    title: "Autoplay (ms)",
    min: 0,
    max: 10000,
    step: 500,
    defaultValue: 4500,
    displayStepper: true,
  },
  stringColor: {
    type: ControlType.Color,
    title: "String & Peg",
    defaultValue: "#8a7f72",
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#efece6",
  },
  inkColor: {
    type: ControlType.Color,
    title: "Text & Ink",
    defaultValue: "#161513",
  },
  slides: {
    type: ControlType.Array,
    title: "Prints",
    control: {
      type: ControlType.Object,
      controls: {
        image: { type: ControlType.ResponsiveImage, title: "Image" },
        title: { type: ControlType.String, title: "Title", defaultValue: "Photo Title" },
        caption: { type: ControlType.String, title: "Caption", defaultValue: "Location & details" },
        palette: {
          type: ControlType.Enum,
          title: "Art Palette",
          options: ["dawn", "alpine", "dusk", "mist"],
          optionTitles: ["Dawn", "Alpine", "Dusk", "Mist"],
          defaultValue: "dawn",
        },
      },
    },
    defaultValue: DEFAULT_SLIDES,
  },
})
