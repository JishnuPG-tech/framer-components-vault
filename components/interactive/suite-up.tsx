import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion } from "framer-motion"

type Img = { src?: string; alt?: string } | string | undefined

interface Props {
    front?: Img
    back?: Img
    figureHeight: number
    cropBottom: number
    mobileWidth: number
    mobileScale: number
    brush: number
    touchBrush: number
    life: number
    wander: boolean
    idle: number
    cursor: boolean
    cursorColor: string
    cursorSize: number
    intro: boolean
    introDelay: number
    introDuration: number
    sweep: boolean
    showBack: boolean
    keyboard: boolean
    revealLabel: string
    style?: React.CSSProperties
}

type Lobe = { dx: number; dy: number; r: number }
type Stamp = { x: number; y: number; t: number; lobes: Lobe[] }

const TAU = Math.PI * 2
const srcOf = (i: Img) => (typeof i === "string" ? i : i?.src) || ""
const altOf = (i: Img) => (typeof i === "object" && i?.alt) || ""

/**
 * Hover Reveal — paint a torn brush trail that swaps the front image for the back one.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function HoverReveal(props: Props) {
    const { front, back, cursor, cursorColor, cursorSize, style } = props
    const rootRef = useRef<HTMLDivElement>(null)
    const figRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dotRef = useRef<HTMLDivElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props
    // Static contexts (canvas, export, thumbnails, SSR snapshots) get a fully still result.
    const isStatic = useIsStaticRenderer()
    const relayoutRef = useRef<(() => void) | null>(null)
    const paintRef = useRef<((dir: "left" | "right" | "up" | "down") => void) | null>(null)
    const endKeysRef = useRef<(() => void) | null>(null)
    const reduced = !!useReducedMotion()
    const animateIn = props.intro && !isStatic && !reduced
    const [revealed, setRevealed] = useState(!!props.showBack)
    const [focusVisible, setFocusVisible] = useState(false)
    useEffect(() => setRevealed(!!props.showBack), [props.showBack])
    const srcF = srcOf(front)
    const srcB = srcOf(back)

    useEffect(() => {
        const root = rootRef.current
        const fig = figRef.current
        const canvas = canvasRef.current
        if (!root || !fig || !canvas) return
        const ctx = canvas.getContext("2d")!
        const mask = document.createElement("canvas")
        const mctx = mask.getContext("2d")!
        const buf = document.createElement("canvas")
        const bctx = buf.getContext("2d")!

        const touchMQ = window.matchMedia("(hover: none), (pointer: coarse)")
        let coarse = touchMQ.matches
        const syncTouch = () => {
            coarse = touchMQ.matches
            root.style.cursor = propsRef.current.cursor && !coarse && !isStatic ? "none" : "auto"
            if (coarse && dotRef.current) dotRef.current.style.opacity = "0"
        }
        syncTouch()
        touchMQ.addEventListener?.("change", syncTouch)

        let W = 1
        let H = 1
        let dpr = 1
        let aspect = 0.75
        let frontReady = false
        let backReady = false
        let dirty = true
        let wasActive = false
        const stamps: Stamp[] = []
        let last: { x: number; y: number } | null = null
        let lastMove = 0
        let autoT = 0
        let autoLast: { x: number; y: number } | null = null
        let raf = 0
        let visible = true
        let sweepAt = 0
        let sweepLast: { x: number; y: number } | null = null
        let introTimer = 0
        const SWEEP = 1500
        const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

        const layout = () => {
            const p = propsRef.current
            const rw = root.clientWidth || 1
            const rh = root.clientHeight || 1
            let fw: number
            let fh: number
            if (rw <= p.mobileWidth) {
                fw = Math.min(rw * p.mobileScale, rh * 0.64 * (aspect / 0.75))
                fh = fw / aspect
            } else {
                fh = Math.min(rh * (p.figureHeight / 100), (rw * 1.33 * 0.75) / aspect)
                fw = fh * aspect
            }
            fig.style.width = Math.round(fw) + "px"
            fig.style.bottom = -Math.round((fh * Math.max(0, p.cropBottom)) / 100) + "px"
            fig.style.height = Math.round(fh) + "px"
            W = fw
            H = fh
            dpr = Math.min(window.devicePixelRatio || 1, 2)
            const pw = Math.max(1, Math.round(W * dpr))
            const ph = Math.max(1, Math.round(H * dpr))
            canvas.width = mask.width = buf.width = pw
            canvas.height = mask.height = buf.height = ph
            dirty = true
        }

        const drawCover = (c: CanvasRenderingContext2D, img: HTMLImageElement) => {
            const cw = c.canvas.width
            const ch = c.canvas.height
            const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
            const w = img.naturalWidth * s
            const h = img.naturalHeight * s
            c.drawImage(img, (cw - w) / 2, ch - h, w, h)
        }

        const addStamp = (x: number, y: number, now: number) => {
            const p = propsRef.current
            const base = Math.max(W, 260) * (coarse ? p.touchBrush : p.brush)
            const n = 3 + Math.floor(Math.random() * 3)
            const lobes: Lobe[] = []
            for (let i = 0; i < n; i++) {
                const a = Math.random() * TAU
                const d = Math.random() * base * 0.45
                lobes.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: base * (0.45 + Math.random() * 0.55) })
            }
            stamps.push({ x, y, t: now, lobes })
        }

        const pointerTo = (cx: number, cy: number, now: number) => {
            const r = fig.getBoundingClientRect()
            paintAt(cx - r.left, cy - r.top, now)
        }

        const paintAt = (x: number, y: number, now: number) => {
            if (last) {
                const dx = x - last.x
                const dy = y - last.y
                const step = Math.max(W, 260) * 0.04
                const n = Math.min(40, Math.floor(Math.hypot(dx, dy) / step))
                for (let i = 1; i <= n; i++) addStamp(last.x + (dx * i) / (n + 1), last.y + (dy * i) / (n + 1), now)
            }
            addStamp(x, y, now)
            last = { x, y }
            lastMove = now
        }

        const autoWander = (now: number) => {
            const p = propsRef.current
            if (!p.wander || now - lastMove < p.idle) return
            autoT += 0.016
            const x = W * (0.5 + Math.sin(autoT * 1.3) * 0.28)
            const y = H * (0.32 + Math.sin(autoT * 0.9 + 1) * 0.22)
            if (!autoLast || Math.hypot(x - autoLast.x, y - autoLast.y) > W * 0.02) {
                addStamp(x, y, now)
                autoLast = { x, y }
            }
        }

        const render = (now: number) => {
            const p = propsRef.current
            if (coarse && !isStatic && !reduced) autoWander(now)
            // One automatic stroke after the intro, to hint that the figure can be painted.
            if (sweepAt && now >= sweepAt) {
                const t = (now - sweepAt) / SWEEP
                if (t > 1 || lastMove > 0) sweepAt = 0
                else {
                    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
                    const x = W * (0.14 + 0.72 * e)
                    const y = H * (0.4 - 0.16 * Math.sin(e * Math.PI))
                    if (!sweepLast || Math.hypot(x - sweepLast.x, y - sweepLast.y) > W * 0.015) {
                        addStamp(x, y, now)
                        sweepLast = { x, y }
                    }
                }
            }
            while (stamps.length && now - stamps[0].t > p.life) stamps.shift()
            const active = stamps.length > 0
            if (!active && !dirty && !wasActive) return
            wasActive = active
            dirty = false

            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.globalCompositeOperation = "source-over"
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            if (frontReady && frontImg) drawCover(ctx, frontImg)
            if (!active) return

            mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            mctx.clearRect(0, 0, W, H)
            mctx.fillStyle = "#000"
            mctx.beginPath()
            for (const s of stamps) {
                const k = 1 - (now - s.t) / p.life
                const sc = k < 0.75 ? k / 0.75 : 1
                const rs = Math.pow(sc, 0.8)
                for (const l of s.lobes) {
                    const cx = s.x + l.dx * sc
                    const cy = s.y + l.dy * sc
                    const r = l.r * rs
                    mctx.moveTo(cx + r, cy)
                    mctx.arc(cx, cy, r, 0, TAU)
                }
            }
            mctx.fill()

            ctx.globalCompositeOperation = "destination-out"
            ctx.drawImage(mask, 0, 0)
            ctx.globalCompositeOperation = "source-over"
            if (backReady && backImg) {
                bctx.setTransform(1, 0, 0, 1, 0, 0)
                bctx.globalCompositeOperation = "source-over"
                bctx.clearRect(0, 0, buf.width, buf.height)
                bctx.drawImage(mask, 0, 0)
                bctx.globalCompositeOperation = "source-in"
                drawCover(bctx, backImg)
                bctx.globalCompositeOperation = "source-over"
                ctx.drawImage(buf, 0, 0)
            }
        }
        const kick = () => render(performance.now())

        const load = (s: string, onload: (im: HTMLImageElement) => void) => {
            if (!s) return null
            const im = new Image()
            im.decoding = "async"
            im.onload = () => onload(im)
            im.src = s
            return im
        }
        const frontImg = load(srcF, (im) => {
            aspect = im.naturalWidth / im.naturalHeight || 0.75
            frontReady = true
            layout()
            if (!isStatic) canvas.style.opacity = "1"
            kick()
            const p = propsRef.current
            if (animateIn) {
                const d = Math.max(0.1, p.introDuration)
                introTimer = window.setTimeout(() => {
                    fig.style.transition = "opacity " + d + "s " + EASE + ", transform " + d + "s " + EASE + ", filter " + d + "s " + EASE
                    fig.style.opacity = "1"
                    fig.style.transform = "translateX(-50%) translateY(0%) scale(1)"
                    fig.style.filter = "blur(0px)"
                }, Math.max(0, p.introDelay) * 1000)
                if (p.sweep) sweepAt = performance.now() + (Math.max(0, p.introDelay) + d * 0.7) * 1000
            } else if (p.sweep && !isStatic && !reduced) {
                sweepAt = performance.now() + 600
            }
        })
        const backImg = load(srcB, () => {
            backReady = true
            dirty = true
        })

        layout()
        relayoutRef.current = () => {
            layout()
            kick()
        }
        const ro = new ResizeObserver(() => {
            layout()
            kick()
        })
        ro.observe(root)

        const onMove = (e: PointerEvent) => {
            pointerTo(e.clientX, e.clientY, performance.now())
            const dot = dotRef.current
            if (dot && !coarse && propsRef.current.cursor) {
                const rr = root.getBoundingClientRect()
                dot.style.transform = "translate(" + (e.clientX - rr.left) + "px, " + (e.clientY - rr.top) + "px)"
                dot.style.opacity = "1"
            }
        }
        const onLeave = () => {
            last = null
            if (dotRef.current) dotRef.current.style.opacity = "0"
        }
        const onDown = (e: PointerEvent) => pointerTo(e.clientX, e.clientY, performance.now())

        // Keyboard brush: arrow keys move a virtual point across the figure and paint.
        let kb: { x: number; y: number } | null = null
        paintRef.current = (dir) => {
            if (!kb) kb = { x: W * 0.5, y: H * 0.4 }
            const step = Math.max(W, 260) * 0.06
            if (dir === "left") kb.x -= step
            if (dir === "right") kb.x += step
            if (dir === "up") kb.y -= step
            if (dir === "down") kb.y += step
            kb.x = Math.min(W, Math.max(0, kb.x))
            kb.y = Math.min(H, Math.max(0, kb.y))
            paintAt(kb.x, kb.y, performance.now())
            const dot = dotRef.current
            if (dot && propsRef.current.cursor) {
                const fr = fig.getBoundingClientRect()
                const rr = root.getBoundingClientRect()
                dot.style.transform = "translate(" + (fr.left - rr.left + kb.x) + "px, " + (fr.top - rr.top + kb.y) + "px)"
                dot.style.opacity = "1"
            }
        }
        endKeysRef.current = () => {
            kb = null
            onLeave()
        }

        let io: IntersectionObserver | null = null
        if (!isStatic) {
            root.addEventListener("pointermove", onMove)
            root.addEventListener("pointerleave", onLeave)
            root.addEventListener("pointerdown", onDown)
            io = new IntersectionObserver((entries) => {
                visible = entries[0]?.isIntersecting ?? true
            })
            io.observe(root)
            const loop = (now: number) => {
                if (visible && !document.hidden) render(now)
                raf = requestAnimationFrame(loop)
            }
            raf = requestAnimationFrame(loop)
        }

        return () => {
            cancelAnimationFrame(raf)
            window.clearTimeout(introTimer)
            ro.disconnect()
            io?.disconnect()
            touchMQ.removeEventListener?.("change", syncTouch)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            root.removeEventListener("pointerdown", onDown)
            paintRef.current = null
            endKeysRef.current = null
        }
    }, [srcF, srcB, isStatic, animateIn, reduced])

    const onKeyDown = (e: React.KeyboardEvent) => {
        const map: Record<string, "left" | "right" | "up" | "down"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }
        const dir = map[e.key]
        if (dir) {
            e.preventDefault()
            paintRef.current?.(dir)
        } else if (e.key === "Escape" && revealed) {
            setRevealed(false)
        }
    }
    const fade = isStatic || reduced ? "none" : "opacity .6s cubic-bezier(0.16, 1, 0.3, 1)"
    const altB = altOf(back)

    // Re-measure the figure when its size controls change.
    useEffect(() => {
        relayoutRef.current?.()
    }, [props.figureHeight, props.cropBottom, props.mobileScale, props.mobileWidth])

    return (
        <div
            ref={rootRef}
            style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "pan-y", ...style }}
        >
            <div
                ref={figRef}
                style={{
                    position: "absolute",
                    left: "50%",
                    bottom: 0,
                    width: 300,
                    height: 400,
                    pointerEvents: "none",
                    opacity: animateIn ? 0 : 1,
                    transform: animateIn ? "translateX(-50%) translateY(14%) scale(0.97)" : "translateX(-50%)",
                    filter: animateIn ? "blur(14px)" : "none",
                    willChange: animateIn ? "opacity, transform, filter" : undefined,
                }}
            >
                {srcF && (
                    <img
                        src={srcF}
                        alt={altOf(front)}
                        aria-hidden={revealed || undefined}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom", opacity: isStatic ? 1 : 0 }}
                    />
                )}
                <canvas
                    ref={canvasRef}
                    aria-hidden
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", opacity: srcF || isStatic ? 0 : 1, transition: isStatic || reduced ? "none" : "opacity .8s ease" }}
                />
                {srcB && (
                    <img
                        src={srcB}
                        alt={altB}
                        aria-hidden={!revealed || undefined}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center bottom", opacity: revealed ? 1 : 0, transition: fade, zIndex: 1 }}
                    />
                )}
                {!srcF && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", font: "500 13px/1.4 system-ui, sans-serif", color: "#9a8a90", textAlign: "center", padding: 16 }}>
                        Add a front and a back image
                    </div>
                )}
            </div>
            {props.keyboard && srcB && (
                <button
                    type="button"
                    aria-pressed={revealed}
                    aria-label={props.revealLabel || "Reveal alternate image"}
                    aria-keyshortcuts="Enter Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
                    onClick={() => setRevealed((v) => !v)}
                    onKeyDown={onKeyDown}
                    onFocus={(e) => {
                        let fv = true
                        try {
                            fv = e.currentTarget.matches(":focus-visible")
                        } catch (_err) {
                            fv = true
                        }
                        setFocusVisible(fv)
                    }}
                    onBlur={() => {
                        setFocusVisible(false)
                        endKeysRef.current?.()
                    }}
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: 24,
                        transform: "translateX(-50%)",
                        zIndex: 2,
                        padding: "8px 16px",
                        border: 0,
                        borderRadius: 999,
                        background: "rgba(10, 10, 14, 0.78)",
                        color: "#fff",
                        font: "500 13px/1.3 system-ui, sans-serif",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        outline: focusVisible ? "2px solid " + cursorColor : "none",
                        outlineOffset: 2,
                        opacity: focusVisible ? 1 : 0,
                        pointerEvents: focusVisible ? "auto" : "none",
                        transition: isStatic || reduced ? "none" : "opacity .2s",
                    }}
                >
                    {revealed ? "Hide" : props.revealLabel || "Reveal"}
                    <span style={{ opacity: 0.6 }}>{" \u00B7 Enter \u00B7 Arrow keys paint"}</span>
                </button>
            )}
            {cursor && (
                <div
                    ref={dotRef}
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cursorSize,
                        height: cursorSize,
                        marginLeft: -cursorSize / 2,
                        marginTop: -cursorSize / 2,
                        borderRadius: "50%",
                        background: cursorColor,
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity .25s",
                    }}
                />
            )}
        </div>
    )
}

HoverReveal.defaultProps = {
    figureHeight: 94,
    cropBottom: 0,
    mobileWidth: 720,
    mobileScale: 1.6,
    brush: 0.12,
    touchBrush: 0.15,
    life: 1100,
    wander: true,
    idle: 2500,
    cursor: true,
    cursorColor: "#FF7FAB",
    cursorSize: 14,
    intro: true,
    introDelay: 0.9,
    introDuration: 1.4,
    sweep: true,
    showBack: false,
    keyboard: true,
    revealLabel: "Reveal",
}

addPropertyControls(HoverReveal, {
    front: { type: ControlType.ResponsiveImage, title: "Front" },
    back: { type: ControlType.ResponsiveImage, title: "Back" },
    figureHeight: { type: ControlType.Number, title: "Height", min: 30, max: 200, step: 1, unit: "%", defaultValue: 94 },
    cropBottom: { type: ControlType.Number, title: "Crop Bottom", min: 0, max: 60, step: 1, unit: "%", defaultValue: 0 },
    mobileWidth: { type: ControlType.Number, title: "Mobile ≤", min: 320, max: 1200, step: 10, unit: "px", defaultValue: 720 },
    mobileScale: { type: ControlType.Number, title: "Mobile Size", min: 0.5, max: 4, step: 0.05, defaultValue: 1.6 },
    brush: { type: ControlType.Number, title: "Brush", min: 0.03, max: 0.4, step: 0.01, defaultValue: 0.12 },
    touchBrush: { type: ControlType.Number, title: "Touch Brush", min: 0.03, max: 0.4, step: 0.01, defaultValue: 0.15 },
    life: { type: ControlType.Number, title: "Trail", min: 300, max: 4000, step: 50, unit: "ms", defaultValue: 1100 },
    wander: { type: ControlType.Boolean, title: "Auto (touch)", defaultValue: true },
    idle: { type: ControlType.Number, title: "Idle", min: 500, max: 8000, step: 100, unit: "ms", defaultValue: 2500, hidden: (p: Props) => !p.wander },
    cursor: { type: ControlType.Boolean, title: "Cursor Dot", defaultValue: true },
    cursorColor: { type: ControlType.Color, title: "Dot Color", defaultValue: "#FF7FAB", hidden: (p: Props) => !p.cursor },
    cursorSize: { type: ControlType.Number, title: "Dot Size", min: 4, max: 60, step: 1, unit: "px", defaultValue: 14, hidden: (p: Props) => !p.cursor },
    intro: { type: ControlType.Boolean, title: "Intro", defaultValue: true },
    introDelay: { type: ControlType.Number, title: "Intro Delay", min: 0, max: 5, step: 0.05, unit: "s", defaultValue: 0.9, hidden: (p: Props) => !p.intro },
    introDuration: { type: ControlType.Number, title: "Intro Time", min: 0.2, max: 4, step: 0.05, unit: "s", defaultValue: 1.4, hidden: (p: Props) => !p.intro },
    sweep: { type: ControlType.Boolean, title: "Teaser Stroke", defaultValue: true },
    showBack: { type: ControlType.Boolean, title: "Show Back", defaultValue: false, description: "Show the back image fully, no pointer needed." },
    keyboard: { type: ControlType.Boolean, title: "Keyboard", defaultValue: true },
    revealLabel: { type: ControlType.String, title: "Reveal Label", defaultValue: "Reveal", hidden: (p: Props) => !p.keyboard },
})
