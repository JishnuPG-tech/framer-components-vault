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

import type { PropertyControls } from "framer"

/**
 * Gallery Wall
 * A hanging wall you can look around. Drag to move along the wall; choose a work and the camera glides in, with a caption beside it.
 * Everything runs on CSS transforms (no WebGL). A Grid view is built in for small screens.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Img = { src?: string; srcSet?: string; alt?: string } | undefined
type Item = { image?: Img; title?: string; subtitle?: string; year?: string; description?: string; details?: Array<{ label?: string; value?: string }>; link?: string; linkLabel?: string; customMat?: boolean; mat?: number }
type FontStyle = { fontFamily?: string; fontWeight?: string | number; letterSpacing?: string | number }

// Items placed in the Collection List register themselves here (CMS mode); see the Item component at the end of this file.
const WallScope = React.createContext<null | { record: (order: number, it: Item) => () => void }>(null)

interface Props {
    items: Item[]
    wall: string
    frameColor: string
    mat: string
    ink: string
    showFrame: boolean
    frameWidth: number
    showShadow: boolean
    showMat: boolean
    matWidth: number
    matBottom: number
    gap: number
    rows: "Auto" | "1" | "2" | "3"
    layout: "Wall" | "Grid"
    mobileLayout: "Grid" | "Wall"
    showToggle: boolean
    tiltAmount: number
    grain: number
    showWall: boolean
    hint: string
    wallLabel: string
    gridLabel: string
    font: FontStyle
    source: "Manual" | "CMS"
    cms?: React.ReactNode
    style?: React.CSSProperties
}

const H0 = 900
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const mix = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, transparent)`
// Colors can be hex (3 to 8 digits), rgb()/rgba(), or a Framer color style (var(--token-..., fallback)); read what we can, never throw.
const parseColor = (c: string, depth = 0): { r: number; g: number; b: number; a: number } | null => {
    c = (c || "").trim()
    if (!c) return null
    if (c === "transparent") return { r: 0, g: 0, b: 0, a: 0 }
    const v = /^var\(\s*--[^,)]+,\s*(.+)\)$/.exec(c)
    if (v) return depth < 3 ? parseColor(v[1], depth + 1) : null
    const h = /^#([0-9a-f]{3,8})$/i.exec(c)
    if (h) {
        let x = h[1]
        if (x.length === 3 || x.length === 4) x = x.split("").map((d) => d + d).join("")
        if (x.length !== 6 && x.length !== 8) return null
        const n = parseInt(x.slice(0, 6), 16)
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: x.length === 8 ? parseInt(x.slice(6), 16) / 255 : 1 }
    }
    const m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(c)
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]) }
    return null
}
const lum = (c: string) => { const p = parseColor(c); return p ? (0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b) / 255 : null }
const isClear = (c: string) => { const p = parseColor(c); return !!p && p.a < 0.98 }
const pad2 = (n: number) => String(n).padStart(2, "0")
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
const isDarkColor = (c: string) => { const l = lum(c); return l !== null && l < 0.36 }
const SHADOW = "0 1px 1px rgba(20,18,14,.14), 6px 12px 22px -6px rgba(20,18,14,.30), 18px 30px 60px -24px rgba(20,18,14,.24)"

type Box = { x: number; y: number; iw: number; ih: number; ow: number; oh: number; m: number; bot: number }

function arrange(aspects: number[], rowsProp: string, mats: number[], bottom: number, fw: number, gapX: number): { boxes: Box[]; W: number; H: number } {
    const n = aspects.length
    const R = rowsProp === "Auto" ? (n <= 4 ? 1 : n <= 12 ? 2 : 3) : Number(rowsProp)
    const marginY = 120, marginX = 200, rowGap = 70, label = 64
    const baseRowH = (H0 - marginY * 2 - (R - 1) * rowGap) / R
    const usable = baseRowH - label
    // The work is sized as if its padding were at most 30; anything beyond that grows the frame (and the wall gets taller) instead of shrinking the work.
    const raw = aspects.map((asp, i) => {
        const m = mats[i] || 0, maxInner = Math.max(60, usable - 2 * (Math.min(m, 30) + fw))
        const ih = Math.min(maxInner, Math.sqrt(Math.pow(maxInner * 0.82, 2) / asp)), iw = ih * asp
        return { r: i % R, m, iw, ih, ow: iw + 2 * (m + fw), oh: ih + 2 * (m + fw) + bottom }
    })
    const rowH = Array.from({ length: R }, (_, r) => Math.max(baseRowH, ...raw.filter((b) => b.r === r).map((b) => b.oh + label)))
    const tops: number[] = []
    rowH.forEach((_h, r) => { tops.push(r === 0 ? marginY : tops[r - 1] + rowH[r - 1] + rowGap) })
    const H = tops[R - 1] + rowH[R - 1] + marginY
    const cursor = Array.from({ length: R }, (_, r) => marginX + r * gapX * 0.55)
    const boxes: Box[] = raw.map((b) => {
        const yc = tops[b.r] + (rowH[b.r] - label) / 2
        const box = { x: cursor[b.r], y: yc - b.oh / 2, iw: b.iw, ih: b.ih, ow: b.ow, oh: b.oh, m: b.m, bot: bottom }
        cursor[b.r] += b.ow + gapX
        return box
    })
    return { boxes, W: Math.max(...cursor, marginX) + marginX - gapX, H }
}

function Fade({ ms, children }: { ms: number; children: React.ReactNode }) {
    const [on, setOn] = React.useState(ms === 0)
    React.useEffect(() => { const id = requestAnimationFrame(() => setOn(true)); return () => cancelAnimationFrame(id) }, [])
    return <div style={{ position: "absolute", inset: 0, zIndex: 6, opacity: on ? 1 : 0, transition: `opacity ${ms}ms ease-out` }}>{children}</div>
}

const Chevron = ({ dir }: { dir: "left" | "right" | "close" }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dir === "left" && <path d="M10 3 5 8l5 5" />}
        {dir === "right" && <path d="m6 3 5 5-5 5" />}
        {dir === "close" && <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />}
    </svg>
)

export default function GalleryWall(props: Props) {
    const { items, wall, frameColor, mat, ink, showFrame, frameWidth, showShadow, showMat, matWidth, matBottom, gap, rows, layout, mobileLayout, showToggle, tiltAmount, grain, showWall, hint, wallLabel, gridLabel, font, source, cms, style } = props
    const [cmsRec, setCmsRec] = React.useState<Record<number, Item>>({})
    const record = React.useCallback((order: number, it: Item) => {
        setCmsRec((m) => ({ ...m, [order]: it }))
        return () => setCmsRec((m) => { const n = { ...m }; delete n[order]; return n })
    }, [])
    const scope = React.useMemo(() => ({ record }), [record])
    const list = React.useMemo(() => (source === "CMS" ? Object.keys(cmsRec).map(Number).sort((a, b) => a - b).map((k) => cmsRec[k]) : (items || []).filter(Boolean)), [source, items, cmsRec])
    const n = list.length
    const srcKey = JSON.stringify(list.map((i) => i.image && i.image.src))
    // canvas, thumbnails and exports render once: show the wall as it rests
    const isCanvas = useIsStaticRenderer() || RenderTarget.current() === RenderTarget.canvas
    const rootRef = React.useRef<HTMLDivElement>(null)
    const wallRef = React.useRef<HTMLDivElement>(null)
    const tiltRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 1000, h: 640 })
    const [aspects, setAspects] = React.useState<number[]>([])
    const [focus, setFocus] = React.useState(-1)
    const [userMode, setUserMode] = React.useState<null | "Wall" | "Grid">(null)
    const [moved, setMoved] = React.useState(false)
    const S = React.useRef({
        cam: { x: 0, y: 0, s: 1 }, tgt: { x: 0, y: 0, s: 1 }, vx: 0, vy: 0, rest: { x: 0, y: 0 }, drag: null as null | { x: number; y: number; cx: number; cy: number; moved: boolean; id: number; lx: number; ly: number; lt: number },
        dragging: false, flying: false, raf: 0, last: 0, reduced: false, tilt: { x: 0, y: 0, tx: 0, ty: 0 }, suppress: false, wheelAcc: 0,
    })
    const fam = (font && font.fontFamily) || "Inter, sans-serif"
    const small = size.w < 640

    // measure the images so frames keep their proportions
    React.useEffect(() => {
        let alive = true
        const out: number[] = list.map(() => 0.8)
        setAspects(out.slice())
        list.forEach((it, i) => {
            const src = it.image && it.image.src
            if (!src) return
            const im = new Image()
            im.onload = () => { if (alive && im.naturalWidth && im.naturalHeight) { out[i] = clamp(im.naturalWidth / im.naturalHeight, 0.4, 2.4); setAspects(out.slice()) } }
            im.src = src
        })
        return () => { alive = false }
    }, [srcKey]) // eslint-disable-line react-hooks/exhaustive-deps

    React.useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const ro = new ResizeObserver(() => setSize({ w: el.clientWidth || 1000, h: el.clientHeight || 640 }))
        ro.observe(el)
        setSize({ w: el.clientWidth || 1000, h: el.clientHeight || 640 })
        return () => ro.disconnect()
    }, [])
    React.useEffect(() => {
        S.current.reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        return () => cancelAnimationFrame(S.current.raf)
    }, [])

    const activeMode: "Wall" | "Grid" = userMode || (small && mobileLayout === "Grid" && !isCanvas ? "Grid" : layout)
    const asps = list.map((_, i) => aspects[i] || 0.8)
    const fwEff = showFrame ? frameWidth : 0
    // a transparent wall lets the page behind show through: lighting follows the text colour, and the overlays that must be solid get a fallback
    const see = !showWall || isClear(wall)
    const dark = see ? (lum(ink) ?? 0) > 0.64 : isDarkColor(wall)
    const solidWall = see ? (dark ? "#121212" : "#E4E3DF") : wall
    const mats = list.map((it) => (showMat ? (it.customMat === true && typeof it.mat === "number" && it.mat >= 0 ? it.mat : matWidth) : 0))
    const botMat = showMat ? matBottom : 0
    const { boxes, W, H: wallH } = React.useMemo(() => arrange(asps, rows, mats, botMat, fwEff, gap), [asps.join(","), rows, mats.join(","), botMat, fwEff, gap]) // eslint-disable-line react-hooks/exhaustive-deps
    const s0 = size.h / wallH
    const panelW = small ? size.w : clamp(Math.round(size.w * 0.3), 280, 380)

    const bounds = () => {
        const Wc = size.w, lo = Math.min(0, Wc - W * s0) - 60, hi = 60
        return { lo, hi }
    }
    const apply = () => {
        const s = S.current, w = wallRef.current, t = tiltRef.current
        if (w) w.style.transform = `translate3d(${s.cam.x.toFixed(2)}px, ${s.cam.y.toFixed(2)}px, 0) scale(${s.cam.s.toFixed(5)})`
        if (t) t.style.transform = `rotateY(${s.tilt.x.toFixed(3)}deg) rotateX(${s.tilt.y.toFixed(3)}deg)`
    }
    const tick = (now: number) => {
        const s = S.current
        const dt = Math.min(48, now - (s.last || now))
        s.last = now
        const k = (r: number) => (s.reduced ? 1 : 1 - Math.pow(1 - r, dt / 16.667))
        const c = s.cam, t = s.tgt
        let busy = false
        if (s.dragging) { c.x = t.x; c.y = t.y; busy = true }
        else {
            if (Math.abs(s.vx) > 0.05 || Math.abs(s.vy) > 0.05) {
                const b = bounds()
                t.x = clamp(t.x + s.vx * (dt / 16.667), b.lo, b.hi)
                s.vx *= Math.pow(0.93, dt / 16.667); s.vy = 0
                busy = true
            } else { s.vx = 0 }
            const r = s.flying ? 0.075 : 0.22
            c.x += (t.x - c.x) * k(r); c.y += (t.y - c.y) * k(r); c.s += (t.s - c.s) * k(r)
            if (Math.abs(t.x - c.x) > 0.05 || Math.abs(t.y - c.y) > 0.05 || Math.abs(t.s - c.s) > 0.0002) busy = true
            else { c.x = t.x; c.y = t.y; c.s = t.s; s.flying = false }
        }
        const tl = s.tilt
        tl.x += (tl.tx - tl.x) * k(0.08); tl.y += (tl.ty - tl.y) * k(0.08)
        if (Math.abs(tl.tx - tl.x) > 0.005 || Math.abs(tl.ty - tl.y) > 0.005) busy = true
        apply()
        s.raf = busy ? requestAnimationFrame(tick) : 0
    }
    const kick = () => { const s = S.current; if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(tick) } }

    // keep the camera in step with the container when nothing is focused
    React.useEffect(() => {
        const s = S.current
        if (focus >= 0) return
        const b = bounds()
        s.tgt.s = s0; s.tgt.y = 0; s.tgt.x = clamp(s.tgt.x, b.lo, b.hi)
        s.cam.s = s0; s.cam.y = 0; s.cam.x = clamp(s.cam.x, b.lo, b.hi)
        apply()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.w, size.h, W, activeMode])

    const open = (i: number) => {
        const s = S.current, b = boxes[i]
        if (!b) return
        if (focus < 0) s.rest = { x: s.tgt.x, y: s.tgt.y }
        setFocus(i)
        if (activeMode === "Wall") {
            const cxm = small ? size.w / 2 : (size.w - panelW - 40) / 2 + 12
            const cym = small ? size.h * 0.27 : size.h / 2
            const sf = Math.min(2.6, ((small ? size.w * 0.78 : (size.w - panelW - 120) * 0.74)) / b.ow, (small ? size.h * 0.4 : size.h * 0.7) / b.oh)
            s.vx = 0; s.flying = true
            s.tgt.s = sf; s.tgt.x = cxm - (b.x + b.ow / 2) * sf; s.tgt.y = cym - (b.y + b.oh / 2) * sf
            kick()
        }
    }
    const close = () => {
        const s = S.current
        setFocus(-1)
        if (activeMode === "Wall") { s.flying = true; s.tgt.s = s0; s.tgt.x = s.rest.x; s.tgt.y = 0; kick() }
    }
    const step = (d: number) => { if (focus >= 0 && n > 0) open((focus + d + n) % n) }

    // pointer: pan the wall
    const onDown = (e: React.PointerEvent) => {
        if (!e.isTrusted || activeMode !== "Wall" || focus >= 0 || (e.target as HTMLElement).closest("[data-ui]")) return
        const s = S.current
        s.drag = { x: e.clientX, y: e.clientY, cx: s.tgt.x, cy: s.tgt.y, moved: false, id: e.pointerId, lx: e.clientX, ly: e.clientY, lt: performance.now() }
        s.vx = 0
    }
    const onMove = (e: React.PointerEvent) => {
        const s = S.current
        if (!e.isTrusted) return
        const root = rootRef.current
        if (root && !s.reduced && focus < 0 && activeMode === "Wall") {
            const r = root.getBoundingClientRect()
            s.tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * tiltAmount
            s.tilt.ty = -((e.clientY - r.top) / r.height - 0.5) * 2 * tiltAmount * 0.6
            kick()
        }
        const d = s.drag
        if (!d) return
        const dx = e.clientX - d.x
        if (!d.moved && Math.abs(dx) + Math.abs(e.clientY - d.y) > 6) { d.moved = true; s.dragging = true; s.suppress = true; setMoved(true); try { rootRef.current && rootRef.current.setPointerCapture(d.id) } catch (_) { /* ignore */ } }
        if (d.moved) {
            const b = bounds()
            const over = d.cx + dx
            s.tgt.x = over < b.lo ? b.lo + (over - b.lo) * 0.3 : over > b.hi ? b.hi + (over - b.hi) * 0.3 : over
            const now = performance.now(), dtm = Math.max(8, now - d.lt)
            s.vx = (e.clientX - d.lx) / dtm * 16.667 * 0.9; d.lx = e.clientX; d.ly = e.clientY; d.lt = now
            kick()
        }
    }
    const onUp = () => {
        const s = S.current, d = s.drag
        s.drag = null
        if (!d) return
        if (d.moved) {
            s.dragging = false
            const b = bounds()
            s.tgt.x = clamp(s.tgt.x, b.lo, b.hi)
            if (performance.now() - d.lt > 90) s.vx = 0
            kick()
            setTimeout(() => { s.suppress = false }, 0)
        }
    }
    const onWheel = (e: React.WheelEvent) => {
        if (activeMode !== "Wall" || focus >= 0) return
        const dx = e.shiftKey ? e.deltaY || e.deltaX : e.deltaX
        if (!dx) return
        const s = S.current, b = bounds()
        s.tgt.x = clamp(s.tgt.x - dx, b.lo, b.hi); s.vx = 0
        kick()
    }
    const onKey = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && focus >= 0) { e.preventDefault(); close(); return }
        if (focus >= 0) { if (e.key === "ArrowRight") { e.preventDefault(); step(1) } if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) } return }
        if (activeMode !== "Wall") return
        const s = S.current, b = bounds()
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); s.tgt.x = clamp(s.tgt.x + (e.key === "ArrowRight" ? -240 : 240), b.lo, b.hi); kick() }
    }

    // editor canvas: show the wall as it rests
    const frameStyle = (k: number, b?: Box): React.CSSProperties => { const m = (b ? b.m : mats[0] || 0) * k, bt = (b ? b.bot : botMat) * k; return { boxSizing: "border-box", border: fwEff > 0 ? `${fwEff * k}px solid ${frameColor}` : "none", background: m > 0.01 ? mat : fwEff > 0 ? frameColor : "transparent", padding: `${m}px ${m}px ${m + bt}px`, boxShadow: showShadow ? (dark ? "0 1px 1px rgba(0,0,0,.5), 8px 16px 28px -8px rgba(0,0,0,.7), 22px 36px 70px -26px rgba(0,0,0,.6)" : SHADOW) : "none" } }
    const picture = (it: Item, b: Box, _k: number) => {
        const src = it.image && it.image.src
        return (
            <span style={{ position: "relative", display: "block", width: "100%", height: "100%", background: mix(ink, 10), overflow: "hidden" }}>
                {src && <img alt={(it.image && it.image.alt) || it.title || ""} draggable={false} decoding="async" src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                {b.m > 0 && fwEff > 0 && <span aria-hidden style={{ position: "absolute", inset: 0, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(0,0,0,0.06)" }} />}
            </span>
        )
    }

    const cur = focus >= 0 ? list[focus] : null
    const rm = S.current.reduced
    const toggleBtn = (m: "Wall" | "Grid"): React.CSSProperties => ({ border: 0, background: "none", padding: "6px 4px", margin: 0, cursor: "pointer", font: "inherit", fontSize: 13, color: activeMode === m ? ink : mix(ink, 46), fontWeight: activeMode === m ? 500 : 400, letterSpacing: "-0.005em" })
    const cols = Math.max(1, Math.floor((size.w - 72) / 220))

    return (
        <WallScope.Provider value={scope}>
        <div
            ref={rootRef}
            tabIndex={0}
            role="region"
            aria-label="Gallery wall"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onPointerLeave={() => { const t = S.current.tilt; t.tx = 0; t.ty = 0; kick() }}
            onWheel={onWheel}
            onKeyDown={onKey}
            onClick={(e) => { if (focus < 0 || S.current.suppress) return; const t = e.target as HTMLElement; if (t.closest("[data-ui]") || t.closest("button[aria-label]")) return; close() }}
            style={{ ...style, position: "relative", boxSizing: "border-box", width: "100%", height: "100%", minHeight: 420, overflow: "hidden", background: showWall ? wall : "transparent", color: ink, fontFamily: fam, WebkitFontSmoothing: "antialiased", outline: "none", touchAction: activeMode === "Wall" ? "pan-y" : "auto", cursor: activeMode === "Wall" && focus < 0 ? (moved ? "grabbing" : "grab") : "default", userSelect: "none", WebkitUserSelect: "none" }}
        >
            {/* light on the wall */}
            {!see && <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, background: dark ? "radial-gradient(110% 80% at 18% 0%, rgba(255,255,255,0.07), rgba(255,255,255,0) 62%), radial-gradient(120% 90% at 100% 100%, rgba(0,0,0,0.35), rgba(0,0,0,0) 60%)" : "radial-gradient(110% 80% at 18% 0%, rgba(255,255,255,0.35), rgba(255,255,255,0) 62%), radial-gradient(120% 90% at 100% 100%, rgba(0,0,0,0.09), rgba(0,0,0,0) 60%)" }} />}
            {showWall && grain > 0 && <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, backgroundImage: GRAIN, opacity: clamp(grain, 0, 1) * 0.14, mixBlendMode: "multiply" }} />}

            {n === 0 && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 14, color: mix(ink, 46) }}>Add works in the properties panel.</div>}

            {activeMode === "Wall" && (
                <div style={{ position: "absolute", inset: 0, perspective: 1800, perspectiveOrigin: "50% 50%" }}>
                    <div ref={tiltRef} style={{ position: "absolute", inset: 0, transformStyle: "flat" }}>
                        <div ref={wallRef} style={{ position: "absolute", left: 0, top: 0, width: W, height: wallH, transformOrigin: "0 0" }}>
                            {list.map((it, i) => {
                                const b = boxes[i]
                                if (!b) return null
                                const on = focus === i
                                return (
                                    <div key={i} style={{ position: "absolute", left: b.x, top: b.y, width: b.ow, opacity: focus >= 0 && !on ? 0.08 : 1, transition: rm ? "none" : `opacity 600ms ${EASE}` }}>
                                        <button
                                            type="button"
                                            aria-label={it.title || `Work ${i + 1}`}
                                            onClick={() => { if (!S.current.suppress) (on ? close() : open(i)) }}
                                            style={{ display: "block", padding: 0, margin: 0, border: 0, background: "none", cursor: "pointer", width: b.ow, height: b.oh, font: "inherit", color: "inherit", outlineOffset: 6 }}
                                        >
                                            <span style={{ ...frameStyle(1, b), display: "block", width: b.ow, height: b.oh, transition: rm ? "none" : `transform 360ms ${EASE}` }}>{picture(it, b, 1)}</span>
                                        </button>
                                        <div style={{ position: "absolute", left: 2, top: b.oh + 18, width: b.ow, whiteSpace: "nowrap", pointerEvents: "none", opacity: on ? 0 : 1, transition: rm ? "none" : "opacity 300ms ease-out" }}>
                                            {it.title && <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: "20px", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div>}
                                            {(it.subtitle || it.year) && <div style={{ fontSize: 13, lineHeight: "18px", color: mix(ink, 52), fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis" }}>{[it.subtitle, it.year].filter(Boolean).join(", ")}</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeMode === "Grid" && (
                <div style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "64px 36px 40px", zIndex: 2, touchAction: "pan-y" }}>
                    <div style={{ columnCount: cols, columnGap: 36 }}>
                        {list.map((it, i) => {
                            const b = boxes[i]
                            const asp = asps[i]
                            return (
                                <button key={i} type="button" aria-label={it.title || `Work ${i + 1}`} onClick={() => open(i)} style={{ display: "block", width: "100%", margin: "0 0 40px", padding: 0, border: 0, background: "none", textAlign: "left", cursor: "pointer", breakInside: "avoid", font: "inherit", color: "inherit" }}>
                                    <span style={{ ...frameStyle(0.5, b || undefined), display: "block", width: "100%", boxShadow: showShadow ? (dark ? "0 1px 1px rgba(0,0,0,.5), 6px 12px 22px -8px rgba(0,0,0,.7)" : "0 1px 1px rgba(20,18,14,.14), 4px 8px 16px -6px rgba(20,18,14,.26)") : "none" }}>
                                        <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: String(asp), background: mix(ink, 10), overflow: "hidden" }}>
                                            {it.image && it.image.src && <img alt={(it.image && it.image.alt) || it.title || ""} draggable={false} decoding="async" src={it.image.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                                            {b && b.m > 0 && fwEff > 0 && <span aria-hidden style={{ position: "absolute", inset: 0, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.28)" }} />}
                                        </span>
                                    </span>
                                    {it.title && <span style={{ display: "block", marginTop: 14, fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>{it.title}</span>}
                                    {(it.subtitle || it.year) && <span style={{ display: "block", fontSize: 13, color: mix(ink, 52), fontVariantNumeric: "tabular-nums" }}>{[it.subtitle, it.year].filter(Boolean).join(", ")}</span>}
                                    {b ? null : null}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* grid focus: the work, centred, on the wall colour */}
            {activeMode === "Grid" && cur && boxes[focus] && (() => {
                const b = boxes[focus]
                const aw = small ? size.w - 48 : size.w - panelW - 120, ah = small ? size.h * 0.4 : size.h - 140
                const k = Math.min(aw / b.ow, ah / b.oh, 3)
                return (
                    <Fade key="gf" ms={rm ? 0 : 420}>
                        <div onClick={(e) => { if (e.target === e.currentTarget) close() }} style={{ position: "absolute", inset: 0, zIndex: 6, background: solidWall, display: "flex", alignItems: small ? "flex-start" : "center", justifyContent: "center", padding: small ? "56px 24px 0" : `0 ${panelW + 64}px 0 56px` }}>
                            <div data-ui style={{ ...frameStyle(k, b), width: b.ow * k, height: b.oh * k }}>{picture(cur, b, k)}</div>
                        </div>
                    </Fade>
                )
            })()}

            {/* caption panel */}
            <div
                data-ui
                aria-hidden={!cur}
                style={{
                    position: "absolute", zIndex: 8, boxSizing: "border-box", pointerEvents: cur ? "auto" : "none",
                    ...(small
                        ? { left: 0, right: 0, bottom: 0, maxHeight: "52%", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", padding: "20px 24px 24px", background: solidWall, borderTop: `1px solid ${mix(ink, 14)}` }
                        : { right: 40, top: "50%", width: panelW, maxHeight: "86%", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }),
                    opacity: cur ? 1 : 0, transform: cur ? (small ? "none" : "translateY(-50%)") : small ? "translateY(16px)" : "translateY(-50%) translateX(16px)",
                    transition: rm ? "none" : `opacity 420ms ${EASE} ${cur ? "260ms" : "0ms"}, transform 520ms ${EASE} ${cur ? "260ms" : "0ms"}`,
                }}
            >
                {cur && (
                    <>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: small ? 10 : 22, fontSize: 13, color: mix(ink, 52), fontVariantNumeric: "tabular-nums" }}>
                            <span>{pad2(focus + 1)} / {pad2(n)}</span>
                            <button type="button" aria-label="Close" onClick={close} style={{ border: 0, background: "none", cursor: "pointer", color: ink, padding: 8, margin: -8, display: "grid", placeItems: "center" }}><Chevron dir="close" /></button>
                        </div>
                        <h2 style={{ margin: 0, fontSize: small ? 26 : 32, lineHeight: 1.1, fontWeight: (font && font.fontWeight) || 300, letterSpacing: (font && font.letterSpacing) || "-0.025em" }}>{cur.title}</h2>
                        {(cur.subtitle || cur.year) && <p style={{ margin: "8px 0 0", fontSize: 14, color: mix(ink, 52), fontVariantNumeric: "tabular-nums" }}>{[cur.subtitle, cur.year].filter(Boolean).join(", ")}</p>}
                        {cur.description && <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.6, color: mix(ink, 82), maxWidth: "40ch" }}>{cur.description}</p>}
                        {(cur.details || []).filter((d) => d && (d.label || d.value)).length > 0 && (
                            <dl style={{ margin: "22px 0 0", padding: 0, fontSize: 13 }}>
                                {(cur.details || []).filter((d) => d && (d.label || d.value)).map((d, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "9px 0", borderTop: `1px solid ${mix(ink, 12)}` }}>
                                        <dt style={{ color: mix(ink, 52) }}>{d.label}</dt>
                                        <dd style={{ margin: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${mix(ink, 12)}` }}>
                            {cur.link ? <a href={cur.link} style={{ color: ink, fontSize: 14, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 5, textDecorationColor: mix(ink, 40) }}>{cur.linkLabel || "View work"}</a> : <span />}
                            <span style={{ display: "flex", gap: 4 }}>
                                <button type="button" aria-label="Previous work" onClick={() => step(-1)} style={{ border: 0, background: "none", cursor: "pointer", color: ink, padding: 8, display: "grid", placeItems: "center" }}><Chevron dir="left" /></button>
                                <button type="button" aria-label="Next work" onClick={() => step(1)} style={{ border: 0, background: "none", cursor: "pointer", color: ink, padding: 8, display: "grid", placeItems: "center" }}><Chevron dir="right" /></button>
                            </span>
                        </div>
                    </>
                )}
            </div>

            {showToggle && n > 0 && (
                <div data-ui style={{ position: "absolute", top: 20, right: 28, zIndex: 7, display: "flex", gap: 14, opacity: cur && !small && activeMode === "Wall" ? 0 : 1, pointerEvents: cur && !small && activeMode === "Wall" ? "none" : "auto", transition: rm ? "none" : "opacity 300ms ease-out" }}>
                    <button type="button" aria-pressed={activeMode === "Wall"} onClick={() => { if (focus >= 0) close(); setUserMode("Wall") }} style={toggleBtn("Wall")}>{wallLabel}</button>
                    <button type="button" aria-pressed={activeMode === "Grid"} onClick={() => { if (focus >= 0) close(); setUserMode("Grid") }} style={toggleBtn("Grid")}>{gridLabel}</button>
                </div>
            )}
            {hint && activeMode === "Wall" && n > 0 && (
                <div aria-hidden style={{ position: "absolute", left: 28, bottom: 22, zIndex: 3, fontSize: 13, color: mix(ink, 46), pointerEvents: "none", opacity: moved || focus >= 0 ? 0 : 1, transition: rm ? "none" : "opacity 500ms ease-out" }}>{hint}</div>
            )}
            {source === "CMS" && cms ? <div aria-hidden style={{ display: "none" }}>{cms}</div> : null}
        </div>
        </WallScope.Provider>
    )
}

type WallItemProps = { index?: number; image?: Img; title?: string; subtitle?: string; year?: string; description?: string; details?: string; link?: string; linkLabel?: string; customMat?: boolean; mat?: number }

/** One work on the wall, for a CMS Collection List. Bind its properties to your collection fields and put the list in the "Collection list" slot of Gallery Wall. */
export function WallItem(props: WallItemProps) {
    const scope = React.useContext(WallScope)
    const { index = 1, image, title, subtitle, year, description, details, link, linkLabel, customMat, mat } = props
    const src = image && image.src, alt = image && image.alt
    React.useEffect(() => {
        if (!scope) return
        const parsed = (details || "").split(/\n/).map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.search(/[:|]/); return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() } : { label: "", value: l } })
        return scope.record(index, { image: src ? { src, alt } : undefined, title, subtitle, year, description, details: parsed, link, linkLabel, customMat, mat })
    }, [scope, index, src, alt, title, subtitle, year, description, details, link, linkLabel, customMat, mat])
    if (scope) return null
    return <div style={{ padding: "10px 14px", fontSize: 13, background: "rgba(0,0,0,0.06)", borderRadius: 6 }}>Gallery Wall work: {title || "Untitled"}</div>
}

GalleryWall.defaultProps = {
    items: [
        { title: "Morning Room", subtitle: "Light study", year: "2025", description: "Add a short description of the work here." },
        { title: "Archway", subtitle: "Light study", year: "2025", description: "" },
        { title: "Stairwell", subtitle: "Light study", year: "2024", description: "" },
        { title: "Still Object", subtitle: "Light study", year: "2024", description: "" },
    ],
    wall: "#E4E3DF",
    frameColor: "#151515",
    mat: "#F8F8F6",
    ink: "#161616",
    showFrame: true,
    frameWidth: 6,
    showShadow: true,
    showMat: true,
    matWidth: 30,
    matBottom: 0,
    gap: 130,
    rows: "Auto",
    layout: "Wall",
    mobileLayout: "Grid",
    showToggle: true,
    tiltAmount: 1.6,
    grain: 0.5,
    showWall: true,
    hint: "Drag to explore",
    wallLabel: "Wall",
    gridLabel: "Grid",
    source: "Manual",
    font: { fontFamily: "Inter", letterSpacing: "-0.025em" },
} as Partial<Props>

export const galleryWallControls: PropertyControls<Props> = {
    source: { type: ControlType.Enum, title: "Content", options: ["Manual", "CMS"], optionTitles: ["Manual (works below)", "CMS (collection list)"], defaultValue: "Manual", displaySegmentedControl: true },
    cms: { type: ControlType.ComponentInstance, title: "Collection list", hidden: (p: Props) => p.source !== "CMS" },
    items: {
        type: ControlType.Array,
        hidden: (p: Props) => p.source === "CMS",
        title: "Works",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Untitled" },
                subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "" },
                year: { type: ControlType.String, title: "Year", defaultValue: "" },
                description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
                details: {
                    type: ControlType.Array,
                    title: "Details",
                    control: { type: ControlType.Object, controls: { label: { type: ControlType.String, title: "Label", defaultValue: "" }, value: { type: ControlType.String, title: "Value", defaultValue: "" } } },
                },
                link: { type: ControlType.Link, title: "Link" },
                linkLabel: { type: ControlType.String, title: "Link label", defaultValue: "View work" },
                customMat: { type: ControlType.Boolean, title: "Custom padding", defaultValue: false },
                mat: { type: ControlType.Number, title: "Padding (this work)", defaultValue: 30, min: 0, max: 80, step: 2, hidden: (p: Item) => !p.customMat },
            },
        },
    },
    showWall: { type: ControlType.Boolean, title: "Wall background", defaultValue: true },
    wall: { type: ControlType.Color, title: "Wall", defaultValue: "#E4E3DF", hidden: (p: Props) => !p.showWall },
    frameColor: { type: ControlType.Color, title: "Frame", defaultValue: "#151515" },
    mat: { type: ControlType.Color, title: "Mat color", defaultValue: "#F8F8F6" },
    showMat: { type: ControlType.Boolean, title: "White padding", defaultValue: true },
    ink: { type: ControlType.Color, title: "Text", defaultValue: "#161616" },
    showFrame: { type: ControlType.Boolean, title: "Frame", defaultValue: true },
    frameWidth: { type: ControlType.Number, title: "Frame width", defaultValue: 6, min: 1, max: 24, step: 1, hidden: (p: Props) => !p.showFrame },
    showShadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true },
    matWidth: { type: ControlType.Number, title: "Padding", defaultValue: 30, min: 0, max: 80, step: 2, hidden: (p: Props) => !p.showMat },
    matBottom: { type: ControlType.Number, title: "Extra at bottom", defaultValue: 0, min: 0, max: 60, step: 2, hidden: (p: Props) => !p.showMat },
    gap: { type: ControlType.Number, title: "Spacing", defaultValue: 130, min: 60, max: 320, step: 10 },
    rows: { type: ControlType.Enum, title: "Rows", options: ["Auto", "1", "2", "3"], defaultValue: "Auto" },
    layout: { type: ControlType.Enum, title: "Start in", options: ["Wall", "Grid"], defaultValue: "Wall" },
    mobileLayout: { type: ControlType.Enum, title: "On phones", options: ["Grid", "Wall"], defaultValue: "Grid" },
    showToggle: { type: ControlType.Boolean, title: "Wall/Grid toggle", defaultValue: true },
    wallLabel: { type: ControlType.String, title: "Wall label", defaultValue: "Wall", hidden: (p: Props) => !p.showToggle },
    gridLabel: { type: ControlType.String, title: "Grid label", defaultValue: "Grid", hidden: (p: Props) => !p.showToggle },
    tiltAmount: { type: ControlType.Number, title: "Depth tilt", defaultValue: 1.6, min: 0, max: 5, step: 0.1, unit: "°" },
    grain: { type: ControlType.Number, title: "Wall grain", defaultValue: 0.5, min: 0, max: 1, step: 0.05, hidden: (p: Props) => !p.showWall },
    hint: { type: ControlType.String, title: "Hint", defaultValue: "Drag to explore" },
    font: { type: ControlType.Font, title: "Heading font", controls: "basic", defaultFontType: "sans-serif", defaultValue: { variant: "Light" } },
}
addPropertyControls(GalleryWall, galleryWallControls)

addPropertyControls(WallItem, {
    index: { type: ControlType.Number, title: "Index", defaultValue: 1, min: 0, step: 1 },
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    title: { type: ControlType.String, title: "Title", defaultValue: "Untitled" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "" },
    year: { type: ControlType.String, title: "Year", defaultValue: "" },
    description: { type: ControlType.String, title: "Description", defaultValue: "", displayTextArea: true },
    details: { type: ControlType.String, title: "Details", defaultValue: "", displayTextArea: true, description: "One per line, as Label: Value" },
    link: { type: ControlType.Link, title: "Link" },
    linkLabel: { type: ControlType.String, title: "Link label", defaultValue: "View work" },
    customMat: { type: ControlType.Boolean, title: "Custom padding", defaultValue: false },
    mat: { type: ControlType.Number, title: "Padding (this work)", defaultValue: 30, min: 0, max: 80, step: 2, hidden: (p: WallItemProps) => !p.customMat },
})
