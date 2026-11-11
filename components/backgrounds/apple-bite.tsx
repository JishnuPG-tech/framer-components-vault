// ============================================================================
// AppleBite
// ----------------------------------------------------------------------------
// An interactive apple cursor that takes a procedural bite on every click.
// The apple follows your pointer with spring physics and accumulates bite
// marks, reveals flesh, crumbs, shockwaves, and aroma particles.
// After max bites the core is revealed. Auto-reforms after a delay.
//
// Author: sbarah.com
// Ported from Apple Bite v2 (1).html
// Marketplace listing copy: ./AppleBite.md
// ============================================================================

import {
    useEffect,
    useRef,
    useState,
    useCallback,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const STATIC_CSS = `
@keyframes ab-breathe {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
@keyframes ab-shake {
  10%, 90% { transform: translate(-2px, 0); }
  20%, 80% { transform: translate(3px, -1px); }
  30%, 50%, 70% { transform: translate(-4px, 1px); }
  40%, 60% { transform: translate(4px, 0); }
}
.ab-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
.ab-root.is-paused .ab-apple-inner {
  animation-play-state: paused;
}
.ab-apple-wrap {
  position: fixed;
  top: 0;
  left: 0;
  will-change: transform;
}
.ab-apple-inner {
  animation: ab-breathe 4.6s ease-in-out infinite;
}
.ab-fx {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
.ab-crumb {
  position: fixed;
  width: 4px;
  height: 4px;
  background: var(--ab-crumb, #b81f1a);
  border-radius: 50%;
  will-change: transform, opacity;
}
.ab-crumb.flesh { background: var(--ab-crumb-flesh, #e8d3a2); }
.ab-crumb.tiny { width: 2.5px; height: 2.5px; }
.ab-crumb.tri {
  background: transparent;
  width: 0; height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-bottom: 5px solid var(--ab-crumb, #b81f1a);
  border-radius: 0;
}
.ab-crumb.tri.flesh {
  border-bottom-color: var(--ab-crumb-flesh, #e8d3a2);
}
.ab-shock {
  position: fixed;
  border: 1.5px solid var(--ab-shock, #b81f1a);
  border-radius: 50%;
  transform: translate(-50%,-50%) scale(0.2);
  opacity: 0.7;
  width: 10px;
  height: 10px;
}
.ab-aroma {
  position: fixed;
  width: 22px;
  height: 60px;
  transform: translate(-50%, -100%);
  opacity: 0;
}
.ab-aroma path {
  fill: none;
  stroke: var(--ab-aroma, #b81f1a);
  stroke-width: 1.2;
  stroke-linecap: round;
  opacity: 0.55;
}
`

let styleInjected = false
function injectStyle() {
    if (styleInjected || typeof document === "undefined") return
    styleInjected = true
    const el = document.createElement("style")
    el.setAttribute("data-ab-style", "1")
    el.textContent = STATIC_CSS
    document.head.appendChild(el)
}

// ---------- Edge points where bites can spawn ----------
const EDGES = [
    { x: 88, y: 130, a: Math.PI },
    { x: 80, y: 168, a: Math.PI },
    { x: 82, y: 206, a: Math.PI * 0.95 },
    { x: 100, y: 244, a: Math.PI * 0.85 },
    { x: 130, y: 286, a: Math.PI * 0.65 },
    { x: 168, y: 302, a: Math.PI * 0.55 },
    { x: 192, y: 302, a: Math.PI * 0.45 },
    { x: 230, y: 286, a: Math.PI * 0.35 },
    { x: 260, y: 244, a: Math.PI * 0.15 },
    { x: 278, y: 206, a: 0.05 },
    { x: 280, y: 168, a: 0 },
    { x: 272, y: 130, a: -Math.PI * 0.1 },
    { x: 240, y: 100, a: -Math.PI * 0.35 },
    { x: 120, y: 100, a: -Math.PI * 0.65 },
]

// ---------- Bite geometry ----------
function makeBitePath(cx: number, cy: number, angle: number, baseR: number) {
    const r = baseR + Math.random() * (baseR * 0.45)
    const segs = 7 + Math.floor(Math.random() * 3)
    const inward = angle + Math.PI
    const startA = angle - Math.PI / 2
    const endA = angle + Math.PI / 2

    const pts: [number, number][] = []
    for (let i = 0; i <= segs; i++) {
        const t = i / segs
        const a = startA + (endA - startA) * t
        const rr = r * (0.95 + Math.random() * 0.18)
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
    }
    const bulgeR = r * (0.72 + Math.random() * 0.18)
    const ib1 = [
        cx + Math.cos(inward - 0.55) * bulgeR * (0.85 + Math.random() * 0.2),
        cy + Math.sin(inward - 0.55) * bulgeR * (0.85 + Math.random() * 0.2),
    ]
    const ib2 = [
        cx + Math.cos(inward) * bulgeR * (1.0 + Math.random() * 0.15),
        cy + Math.sin(inward) * bulgeR * (1.0 + Math.random() * 0.15),
    ]
    const ib3 = [
        cx + Math.cos(inward + 0.55) * bulgeR * (0.85 + Math.random() * 0.2),
        cy + Math.sin(inward + 0.55) * bulgeR * (0.85 + Math.random() * 0.2),
    ]

    const all = [...pts, ib3, ib2, ib1]
    let d = `M ${all[0][0].toFixed(2)} ${all[0][1].toFixed(2)} `
    for (let i = 1; i < all.length; i++) {
        const [x0, y0] = all[i - 1]
        const [x1, y1] = all[i]
        const mx = (x0 + x1) / 2
        const my = (y0 + y1) / 2
        d += `Q ${x0.toFixed(2)} ${y0.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)} `
    }
    d += "Z"
    return d
}

function pickEdge(used: Set<number>) {
    const avail = EDGES.map((_, i) => i).filter((i) => !used.has(i))
    if (avail.length === 0) {
        used.clear()
        return Math.floor(Math.random() * EDGES.length)
    }
    return avail[Math.floor(Math.random() * avail.length)]
}

// ---------- Types ----------
interface AppleGroup {
    size: number
    skinColor: string
    stemColor: string
    leafColor: string
    fleshColor: string
}

interface PhysicsGroup {
    stiffness: number
    damping: number
}

interface EffectsGroup {
    enableCrumbs: boolean
    enableShockwave: boolean
    enableAroma: boolean
    enableShake: boolean
    crumbCount: number
    biteSize: number
}

interface BehaviorGroup {
    mode: string
    autoResetDelay: number
    maxBites: number
}

interface CursorGroup {
    hideSystemCursor: boolean
    zIndex: number
}

interface StageGroup {
    background: string
}

interface AppleBiteProps {
    apple: AppleGroup
    physics: PhysicsGroup
    effects: EffectsGroup
    behavior: BehaviorGroup
    cursor: CursorGroup
    stage: StageGroup
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 80
 * @framerIntrinsicHeight 80
 */
export default function AppleBite(props: AppleBiteProps) {
    const { apple, physics, effects, behavior, cursor, stage, style } = props
    const isStatic = useIsStaticRenderer()

    const rootRef = useRef<HTMLDivElement | null>(null)
    const appleWrapRef = useRef<HTMLDivElement | null>(null)
    const svgRef = useRef<SVGSVGElement | null>(null)
    const bitesRef = useRef<SVGGElement | null>(null)
    const rimsRef = useRef<SVGGElement | null>(null)
    const coreRef = useRef<SVGGElement | null>(null)
    const bodyRef = useRef<SVGPathElement | null>(null)
    const shakeRef = useRef<SVGGElement | null>(null)
    const fxRef = useRef<HTMLDivElement | null>(null)
    const disposedRef = useRef(false)
    const cursorClassRef = useRef("")

    const [biteCount, setBiteCount] = useState(0)

    // Physics state (refs for RAF, direct DOM writes)
    const mouseRef = useRef({
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 400,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 300,
    })
    const posRef = useRef({
        x: typeof window !== "undefined" ? window.innerWidth / 2 : 400,
        y: typeof window !== "undefined" ? window.innerHeight / 2 : 300,
        vx: 0,
        vy: 0,
    })

    const biteStateRef = useRef<{
        biteRecords: {
            edgeIdx: number
            d: string
            cx: number
            cy: number
            angle: number
            rim: SVGPathElement
            hole: SVGPathElement
        }[]
        usedEdges: Set<number>
        reforming: boolean
        autoResetTimer: ReturnType<typeof setTimeout> | null
    }>({
        biteRecords: [],
        usedEdges: new Set(),
        reforming: false,
        autoResetTimer: null,
    })

    const liveRef = useRef(props)
    liveRef.current = props

    // ---------- Effects ----------
    const spawnCrumbs = useCallback(
        (screenX: number, screenY: number, outwardAngle: number) => {
            if (!fxRef.current || !effects.enableCrumbs) return
            const n = effects.crumbCount
            for (let i = 0; i < n; i++) {
                const el = document.createElement("div")
                const cls = ["ab-crumb"]
                const isFlesh = Math.random() < 0.55
                if (isFlesh) cls.push("flesh")
                if (Math.random() < 0.35) cls.push("tiny")
                if (Math.random() < 0.18) cls.push("tri")
                el.className = cls.join(" ")
                el.style.left = screenX - 2 + "px"
                el.style.top = screenY - 2 + "px"
                fxRef.current.appendChild(el)

                const spread = (Math.random() - 0.5) * 1.4
                const a = outwardAngle + spread
                const speed = 70 + Math.random() * 120
                const vx = Math.cos(a) * speed
                const vy = Math.sin(a) * speed - 60
                const dur = 700 + Math.random() * 350

                const start = performance.now()
                const g = 520
                function step(now: number) {
                    if (disposedRef.current) {
                        el.remove()
                        return
                    }
                    const t = (now - start) / 1000
                    if (now - start >= dur) {
                        el.remove()
                        return
                    }
                    const x = vx * t
                    const y = vy * t + 0.5 * g * t * t
                    const rot = vx * t * 1.2
                    const op = 1 - (now - start) / dur
                    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`
                    el.style.opacity = op.toFixed(3)
                    requestAnimationFrame(step)
                }
                requestAnimationFrame(step)
            }
        },
        [effects.enableCrumbs, effects.crumbCount]
    )

    const spawnShock = useCallback(
        (screenX: number, screenY: number) => {
            if (!fxRef.current || !effects.enableShockwave) return
            const el = document.createElement("div")
            el.className = "ab-shock"
            el.style.left = screenX + "px"
            el.style.top = screenY + "px"
            fxRef.current.appendChild(el)
            const start = performance.now()
            const dur = 420
            function step(now: number) {
                if (disposedRef.current) {
                    el.remove()
                    return
                }
                const t = Math.min(1, (now - start) / dur)
                const s = 0.2 + t * 6.4
                const op = (1 - t) * 0.7
                el.style.transform = `translate(-50%,-50%) scale(${s.toFixed(2)})`
                el.style.opacity = op.toFixed(3)
                if (t < 1) requestAnimationFrame(step)
                else el.remove()
            }
            requestAnimationFrame(step)
        },
        [effects.enableShockwave]
    )

    const spawnAroma = useCallback(
        (screenX: number, screenY: number) => {
            if (!fxRef.current || !effects.enableAroma) return
            const SVG_NS = "http://www.w3.org/2000/svg"
            for (let i = 0; i < 3; i++) {
                const offX = (i - 1) * 9 + (Math.random() * 4 - 2)
                const svg = document.createElementNS(SVG_NS, "svg")
                svg.setAttribute("viewBox", "0 0 22 60")
                svg.classList.add("ab-aroma")
                svg.style.left = screenX + offX + "px"
                svg.style.top = screenY + "px"
                const path = document.createElementNS(SVG_NS, "path")
                const sway = 4 + Math.random() * 2
                const d = `M 11 58 C ${11 - sway} 46, ${11 + sway} 36, 11 24 C ${11 - sway} 14, ${11 + sway} 6, 11 0`
                path.setAttribute("d", d)
                svg.appendChild(path)
                fxRef.current.appendChild(svg)

                const start = performance.now()
                const dur = 800
                const delay = i * 70
                function step(now: number) {
                    if (disposedRef.current) {
                        svg.remove()
                        return
                    }
                    const t = (now - start - delay) / dur
                    if (t < 0) {
                        requestAnimationFrame(step)
                        return
                    }
                    if (t >= 1) {
                        svg.remove()
                        return
                    }
                    const e = 1 - (1 - t) * (1 - t)
                    const ty = -e * 36
                    const op = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85
                    svg.style.transform = `translate(-50%,-100%) translateY(${ty.toFixed(1)}px)`
                    svg.style.opacity = Math.max(0, op).toFixed(3)
                    requestAnimationFrame(step)
                }
                requestAnimationFrame(step)
            }
        },
        [effects.enableAroma]
    )

    const shakeApple = useCallback(() => {
        if (!shakeRef.current || !effects.enableShake) return
        shakeRef.current.classList.remove("shaking")
        requestAnimationFrame(() => {
            if (shakeRef.current) shakeRef.current.classList.add("shaking")
        })
        setTimeout(() => {
            if (shakeRef.current) shakeRef.current.classList.remove("shaking")
        }, 380)
    }, [effects.enableShake])

    const revealCore = useCallback(() => {
        if (coreRef.current) {
            coreRef.current.style.transition = "opacity 420ms ease"
            coreRef.current.style.opacity = "1"
        }
        if (bodyRef.current) {
            bodyRef.current.style.transition = "opacity 420ms ease"
            bodyRef.current.style.opacity = "0"
        }
    }, [])

    const hideCore = useCallback(() => {
        if (coreRef.current) {
            coreRef.current.style.transition = "opacity 280ms ease"
            coreRef.current.style.opacity = "0"
        }
        if (bodyRef.current) {
            bodyRef.current.style.transition = "opacity 280ms ease"
            bodyRef.current.style.opacity = "1"
        }
    }, [])

    // ---------- Bite flow ----------
    const scheduleAutoReset = useCallback(() => {
        const s = biteStateRef.current
        const live = liveRef.current
        if (s.autoResetTimer) {
            clearTimeout(s.autoResetTimer)
            s.autoResetTimer = null
        }
        if (live.behavior.mode !== "auto") return
        if (s.biteRecords.length === 0) return
        s.autoResetTimer = setTimeout(() => {
            reform()
        }, live.behavior.autoResetDelay)
    }, [])

    const reform = useCallback(() => {
        const s = biteStateRef.current
        if (s.reforming || s.biteRecords.length === 0) return
        s.reforming = true
        if (s.biteRecords.length >= liveRef.current.behavior.maxBites) {
            hideCore()
        }

        const records = [...s.biteRecords]
        const total = 1500
        const perBite = records.length > 0 ? total / records.length : total
        const reversed = [...records].reverse()
        const start = performance.now()

        function tick(now: number) {
            if (disposedRef.current) return
            const elapsed = now - start
            let allDone = true
            reversed.forEach((rec, i) => {
                const localStart = i * perBite
                const localT = (elapsed - localStart) / perBite
                let sc = 1,
                    op = 1
                if (localT < 0) {
                    sc = 1
                    op = 1
                    allDone = false
                } else if (localT >= 1) {
                    sc = 0
                    op = 0
                } else {
                    const e = localT * localT * localT
                    sc = 1 - e
                    op = 1 - localT * 0.4
                    allDone = false
                }
                const tx = `translate(${rec.cx}px ${rec.cy}px) scale(${sc.toFixed(3)}) translate(${-rec.cx}px ${-rec.cy}px)`
                rec.hole.setAttribute(
                    "style",
                    `transform-origin:${rec.cx}px ${rec.cy}px; transform-box:fill-box; transform:${tx}; opacity:${op.toFixed(3)}`
                )
                rec.rim.setAttribute(
                    "style",
                    `transform-origin:${rec.cx}px ${rec.cy}px; transform-box:fill-box; transform:${tx}; opacity:${(op * 0.85).toFixed(3)}`
                )
            })
            if (allDone) {
                if (bitesRef.current) bitesRef.current.innerHTML = ""
                if (rimsRef.current) rimsRef.current.innerHTML = ""
                s.biteRecords = []
                s.usedEdges.clear()
                setBiteCount(0)
                s.reforming = false
            } else {
                requestAnimationFrame(tick)
            }
        }
        requestAnimationFrame(tick)
    }, [hideCore])

    const hardReset = useCallback(() => {
        const s = biteStateRef.current
        if (s.autoResetTimer) {
            clearTimeout(s.autoResetTimer)
            s.autoResetTimer = null
        }
        if (bitesRef.current) bitesRef.current.innerHTML = ""
        if (rimsRef.current) rimsRef.current.innerHTML = ""
        s.biteRecords = []
        s.usedEdges.clear()
        setBiteCount(0)
        s.reforming = false
        hideCore()
    }, [hideCore])

    const bite = useCallback(() => {
        const s = biteStateRef.current
        const live = liveRef.current
        if (s.reforming) return
        if (s.biteRecords.length >= live.behavior.maxBites) return
        if (!bitesRef.current || !rimsRef.current) return

        const idx = pickEdge(s.usedEdges)
        s.usedEdges.add(idx)
        const edge = EDGES[idx]
        const jitterR = 10
        const jx = (Math.random() - 0.5) * jitterR * 2
        const jy = (Math.random() - 0.5) * jitterR * 2
        const cx = edge.x + jx
        const cy = edge.y + jy
        const d = makeBitePath(cx, cy, edge.a, live.effects.biteSize)

        const SVG_NS = "http://www.w3.org/2000/svg"

        // Rim
        const rim = document.createElementNS(SVG_NS, "path")
        rim.setAttribute("d", d)
        rim.setAttribute("fill", "#c9a868")
        rim.setAttribute("opacity", "0.85")
        rim.setAttribute(
            "transform",
            `translate(${(Math.cos(edge.a + Math.PI) * 2).toFixed(2)} ${(Math.sin(edge.a + Math.PI) * 2).toFixed(2)}) scale(1.06)`
        )
        rim.style.transformOrigin = `${cx}px ${cy}px`
        rim.style.transformBox = "fill-box"
        rimsRef.current.appendChild(rim)

        // Hole
        const hole = document.createElementNS(SVG_NS, "path")
        hole.setAttribute("d", d)
        hole.setAttribute("fill", "url(#ab-fleshGrad)")
        bitesRef.current.appendChild(hole)

        s.biteRecords.push({
            edgeIdx: idx,
            d,
            cx,
            cy,
            angle: edge.a,
            rim,
            hole,
        })
        setBiteCount(s.biteRecords.length)

        // Compute screen position for effects
        const scale = live.apple.size / 360
        const offset = live.apple.size / 2
        const screenCx = posRef.current.x - offset + cx * scale
        const screenCy = posRef.current.y - offset + cy * scale

        spawnCrumbs(screenCx, screenCy, edge.a)
        spawnShock(screenCx, screenCy)
        spawnAroma(screenCx, screenCy)
        shakeApple()

        if (s.biteRecords.length >= live.behavior.maxBites) {
            revealCore()
        }

        scheduleAutoReset()
    }, [
        spawnCrumbs,
        spawnShock,
        spawnAroma,
        shakeApple,
        revealCore,
        scheduleAutoReset,
    ])

    // ---------- RAF follow loop ----------
    useEffect(() => {
        if (isStatic) return
        injectStyle()
        disposedRef.current = false

        const root = rootRef.current
        const appleEl = appleWrapRef.current
        if (!root || !appleEl) return

        let raf = 0
        let paused = false
        let visible = typeof document !== "undefined" ? !document.hidden : true
        let onScreen = true

        const applyPause = () => {
            const shouldPause = !(visible && onScreen)
            if (shouldPause === paused) return
            paused = shouldPause
            root.classList.toggle("is-paused", paused)
        }

        const onVis = () => {
            visible = !document.hidden
            applyPause()
        }
        const onBlur = () => {
            visible = false
            applyPause()
        }
        const onFocus = () => {
            visible = !document.hidden
            applyPause()
        }
        document.addEventListener("visibilitychange", onVis)
        window.addEventListener("blur", onBlur)
        window.addEventListener("focus", onFocus)

        const io = new IntersectionObserver((entries) => {
            for (const entry of entries) onScreen = entry.isIntersecting
            applyPause()
        })
        io.observe(root)

        const onMove = (e: PointerEvent) => {
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }
        window.addEventListener("pointermove", onMove)

        const tick = () => {
            if (disposedRef.current) return
            if (!paused) {
                const dx = mouseRef.current.x - posRef.current.x
                const dy = mouseRef.current.y - posRef.current.y
                const stiffness = liveRef.current.physics.stiffness
                const damping = liveRef.current.physics.damping
                posRef.current.vx += dx * stiffness
                posRef.current.vy += dy * stiffness
                posRef.current.vx *= damping
                posRef.current.vy *= damping
                posRef.current.x += posRef.current.vx
                posRef.current.y += posRef.current.vy

                const offset = liveRef.current.apple.size / 2
                appleEl.style.transform = `translate(${(posRef.current.x - offset).toFixed(1)}px, ${(posRef.current.y - offset).toFixed(1)}px)`
            }
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        return () => {
            if (raf) cancelAnimationFrame(raf)
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            window.removeEventListener("blur", onBlur)
            window.removeEventListener("focus", onFocus)
            window.removeEventListener("pointermove", onMove)
        }
    }, [isStatic])

    // ---------- Cursor hide ----------
    useEffect(() => {
        if (isStatic) return
        if (!cursor.hideSystemCursor) return

        cursorClassRef.current =
            "ab-cursor-hide-" + Math.random().toString(36).slice(2, 8)
        const styleEl = document.createElement("style")
        styleEl.setAttribute("data-ab-cursor", cursorClassRef.current)
        styleEl.textContent = `.${cursorClassRef.current}, .${cursorClassRef.current} * { cursor: none !important; }`
        document.head.appendChild(styleEl)
        document.body.classList.add(cursorClassRef.current)

        return () => {
            if (cursorClassRef.current) {
                const el = document.querySelector(
                    `style[data-ab-cursor="${cursorClassRef.current}"]`
                )
                if (el) el.remove()
                document.body.classList.remove(cursorClassRef.current)
                cursorClassRef.current = ""
            }
        }
    }, [isStatic, cursor.hideSystemCursor])

    // ---------- Click = bite ----------
    useEffect(() => {
        if (isStatic) return
        const onClick = () => {
            if (disposedRef.current) return
            bite()
        }
        window.addEventListener("click", onClick)
        return () => window.removeEventListener("click", onClick)
    }, [isStatic, bite])

    // ---------- Unmount cleanup ----------
    useEffect(() => {
        return () => {
            disposedRef.current = true
            const s = biteStateRef.current
            if (s.autoResetTimer) clearTimeout(s.autoResetTimer)
        }
    }, [])

    // ---------- Static fallback ----------
    if (isStatic) {
        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    background: stage.background,
                    ...style,
                }}
                aria-label="Apple bite cursor"
            >
                <svg
                    viewBox="0 0 360 360"
                    width={apple.size}
                    height={apple.size}
                >
                    <defs>
                        <radialGradient
                            id="ab-skin"
                            cx="0.38"
                            cy="0.32"
                            r="0.85"
                        >
                            <stop offset="0%" stopColor="#ff8a6b" />
                            <stop offset="35%" stopColor={apple.skinColor} />
                            <stop offset="80%" stopColor="#b81f1a" />
                            <stop offset="100%" stopColor="#7a1410" />
                        </radialGradient>
                        <radialGradient id="ab-flesh" cx="0.5" cy="0.5" r="0.7">
                            <stop offset="0%" stopColor="#fff8e2" />
                            <stop offset="70%" stopColor={apple.fleshColor} />
                            <stop offset="100%" stopColor="#d9bf86" />
                        </radialGradient>
                    </defs>
                    <ellipse
                        cx="180"
                        cy="320"
                        rx="78"
                        ry="8"
                        fill="#000"
                        opacity="0.10"
                    />
                    <path
                        d="M180,96 C180,76 184,62 192,50"
                        stroke={apple.stemColor}
                        strokeWidth="4.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                    <path
                        d="M192,56 C214,42 236,48 244,68 C224,80 204,74 192,56 Z"
                        fill={apple.leafColor}
                    />
                    <path
                        d="M180,96 C150,96 138,82 132,78 C108,78 76,104 76,156 C76,216 110,296 152,304 C164,306 168,298 180,298 C192,298 196,306 208,304 C250,296 284,216 284,156 C284,104 252,78 228,78 C222,82 210,96 180,96 Z"
                        fill="url(#ab-skin)"
                    />
                    <ellipse
                        cx="128"
                        cy="142"
                        rx="16"
                        ry="30"
                        fill="#fff"
                        opacity="0.32"
                        transform="rotate(-18 128 142)"
                    />
                    <ellipse
                        cx="116"
                        cy="180"
                        rx="6"
                        ry="14"
                        fill="#fff"
                        opacity="0.22"
                        transform="rotate(-12 116 180)"
                    />
                </svg>
            </div>
        )
    }

    const cssVars: CSSProperties = {
        ["--ab-crumb" as any]: "#b81f1a",
        ["--ab-crumb-flesh" as any]: "#e8d3a2",
        ["--ab-shock" as any]: "#b81f1a",
        ["--ab-aroma" as any]: "#b81f1a",
        ...style,
    }

    return (
        <>
            <div
                className="ab-root"
                ref={rootRef}
                style={{ zIndex: cursor.zIndex, ...cssVars }}
            >
                <div
                    className="ab-apple-wrap"
                    ref={appleWrapRef}
                    style={{ width: apple.size, height: apple.size }}
                >
                    <div className="ab-apple-inner">
                        <svg
                            viewBox="0 0 360 360"
                            width={apple.size}
                            height={apple.size}
                            style={{ display: "block", overflow: "visible" }}
                            ref={svgRef}
                        >
                            <defs>
                                <radialGradient
                                    id="ab-appleGrad"
                                    cx="0.38"
                                    cy="0.32"
                                    r="0.85"
                                >
                                    <stop offset="0%" stopColor="#ff8a6b" />
                                    <stop
                                        offset="35%"
                                        stopColor={apple.skinColor}
                                    />
                                    <stop offset="80%" stopColor="#b81f1a" />
                                    <stop offset="100%" stopColor="#7a1410" />
                                </radialGradient>
                                <radialGradient
                                    id="ab-fleshGrad"
                                    cx="0.5"
                                    cy="0.5"
                                    r="0.7"
                                >
                                    <stop offset="0%" stopColor="#fff8e2" />
                                    <stop
                                        offset="70%"
                                        stopColor={apple.fleshColor}
                                    />
                                    <stop offset="100%" stopColor="#d9bf86" />
                                </radialGradient>
                                <linearGradient
                                    id="ab-stemGrad"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="0"
                                >
                                    <stop offset="0%" stopColor="#3a2410" />
                                    <stop offset="50%" stopColor="#6b4320" />
                                    <stop offset="100%" stopColor="#3a2410" />
                                </linearGradient>
                                <linearGradient
                                    id="ab-leafGrad"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#8cc24a" />
                                    <stop offset="100%" stopColor="#4d7a24" />
                                </linearGradient>
                                <clipPath
                                    id="ab-appleClip"
                                    clipPathUnits="userSpaceOnUse"
                                >
                                    <path d="M180,96 C150,96 138,82 132,78 C108,78 76,104 76,156 C76,216 110,296 152,304 C164,306 168,298 180,298 C192,298 196,306 208,304 C250,296 284,216 284,156 C284,104 252,78 228,78 C222,82 210,96 180,96 Z" />
                                </clipPath>
                            </defs>

                            <g className="ab-apple-rot">
                                <g className="ab-apple-shake" ref={shakeRef}>
                                    <ellipse
                                        cx="180"
                                        cy="320"
                                        rx="78"
                                        ry="8"
                                        fill="#000"
                                        opacity="0.10"
                                    />

                                    <path
                                        d="M180,96 C180,76 184,62 192,50"
                                        stroke="url(#ab-stemGrad)"
                                        strokeWidth="4.5"
                                        fill="none"
                                        strokeLinecap="round"
                                    />

                                    <g>
                                        <path
                                            d="M192,56 C214,42 236,48 244,68 C224,80 204,74 192,56 Z"
                                            fill="url(#ab-leafGrad)"
                                        />
                                        <path
                                            d="M196,60 C212,66 228,68 240,68"
                                            stroke="#3d6418"
                                            strokeWidth="1.1"
                                            fill="none"
                                            opacity="0.6"
                                        />
                                    </g>

                                    <g clipPath="url(#ab-appleClip)">
                                        <rect
                                            x="60"
                                            y="70"
                                            width="240"
                                            height="240"
                                            fill="url(#ab-fleshGrad)"
                                        />
                                        <path
                                            ref={bodyRef}
                                            d="M180,96 C150,96 138,82 132,78 C108,78 76,104 76,156 C76,216 110,296 152,304 C164,306 168,298 180,298 C192,298 196,306 208,304 C250,296 284,216 284,156 C284,104 252,78 228,78 C222,82 210,96 180,96 Z"
                                            fill="url(#ab-appleGrad)"
                                        />
                                        <ellipse
                                            cx="128"
                                            cy="142"
                                            rx="16"
                                            ry="30"
                                            fill="#fff"
                                            opacity="0.32"
                                            transform="rotate(-18 128 142)"
                                        />
                                        <ellipse
                                            cx="116"
                                            cy="180"
                                            rx="6"
                                            ry="14"
                                            fill="#fff"
                                            opacity="0.22"
                                            transform="rotate(-12 116 180)"
                                        />
                                        <path
                                            d="M150,110 C148,160 146,210 152,270"
                                            stroke="#7a1410"
                                            strokeWidth="1"
                                            fill="none"
                                            opacity="0.18"
                                        />
                                        <path
                                            d="M210,110 C212,160 214,210 208,270"
                                            stroke="#7a1410"
                                            strokeWidth="1"
                                            fill="none"
                                            opacity="0.18"
                                        />

                                        <g ref={rimsRef} />
                                        <g ref={bitesRef} />
                                    </g>

                                    <g ref={coreRef} opacity="0">
                                        <path
                                            d="M158,118 C152,140 154,172 152,200 C150,228 154,260 162,286 L198,286 C206,260 210,228 208,200 C206,172 208,140 202,118 Z"
                                            fill="url(#ab-fleshGrad)"
                                            stroke="#c9a868"
                                            strokeWidth="1.2"
                                        />
                                        <line
                                            x1="180"
                                            y1="120"
                                            x2="180"
                                            y2="284"
                                            stroke="#a48144"
                                            strokeWidth="1.2"
                                            strokeLinecap="round"
                                            opacity="0.7"
                                        />
                                        <ellipse
                                            cx="172"
                                            cy="190"
                                            rx="3.4"
                                            ry="6"
                                            fill="#3a1c0a"
                                            transform="rotate(-14 172 190)"
                                        />
                                        <ellipse
                                            cx="188"
                                            cy="210"
                                            rx="3.4"
                                            ry="6"
                                            fill="#3a1c0a"
                                            transform="rotate(14 188 210)"
                                        />
                                        <ellipse
                                            cx="176"
                                            cy="232"
                                            rx="3"
                                            ry="5.4"
                                            fill="#3a1c0a"
                                            transform="rotate(-8 176 232)"
                                        />
                                    </g>
                                </g>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
            <div
                className="ab-fx"
                ref={fxRef}
                style={{ zIndex: cursor.zIndex - 1 }}
            />
        </>
    )
}

// ---------------------- Defaults ----------------------

AppleBite.defaultProps = {
    apple: {
        size: 48,
        skinColor: "#e23a2e",
        stemColor: "#5a3a1f",
        leafColor: "#4d7a24",
        fleshColor: "#f3e2b6",
    },
    physics: {
        stiffness: 0.15,
        damping: 0.78,
    },
    effects: {
        enableCrumbs: true,
        enableShockwave: true,
        enableAroma: true,
        enableShake: true,
        crumbCount: 8,
        biteSize: 22,
    },
    behavior: {
        mode: "auto",
        autoResetDelay: 6000,
        maxBites: 8,
    },
    cursor: {
        hideSystemCursor: false,
        zIndex: 9999,
    },
    stage: {
        background: "transparent",
    },
}

// ---------------------- Property Controls ----------------------

addPropertyControls(AppleBite, {
    apple: {
        type: ControlType.Object,
        title: "Apple",
        icon: "color",
        controls: {
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 48,
                min: 24,
                max: 120,
                step: 1,
                unit: "px",
            },
            skinColor: {
                type: ControlType.Color,
                title: "Skin Color",
                defaultValue: "#e23a2e",
            },
            stemColor: {
                type: ControlType.Color,
                title: "Stem Color",
                defaultValue: "#5a3a1f",
            },
            leafColor: {
                type: ControlType.Color,
                title: "Leaf Color",
                defaultValue: "#4d7a24",
            },
            fleshColor: {
                type: ControlType.Color,
                title: "Flesh Color",
                defaultValue: "#f3e2b6",
            },
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Physics",
        icon: "effect",
        controls: {
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                defaultValue: 0.15,
                min: 0.01,
                max: 0.5,
                step: 0.01,
                description: "How strongly the apple pulls toward the cursor.",
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                defaultValue: 0.78,
                min: 0.5,
                max: 0.98,
                step: 0.01,
                description: "Motion friction (higher = more glide).",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        icon: "effect",
        controls: {
            enableCrumbs: {
                type: ControlType.Boolean,
                title: "Crumbs",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            enableShockwave: {
                type: ControlType.Boolean,
                title: "Shockwave",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            enableAroma: {
                type: ControlType.Boolean,
                title: "Aroma",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            enableShake: {
                type: ControlType.Boolean,
                title: "Shake",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            crumbCount: {
                type: ControlType.Number,
                title: "Crumb Count",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                hidden: ({ enableCrumbs }) => !enableCrumbs,
            },
            biteSize: {
                type: ControlType.Number,
                title: "Bite Size",
                defaultValue: 22,
                min: 6,
                max: 50,
                step: 1,
                unit: "px",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        icon: "interact",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Reset Mode",
                defaultValue: "auto",
                options: ["auto", "persist"],
                optionTitles: ["Auto", "Persist"],
                displaySegmentedControl: true,
            },
            autoResetDelay: {
                type: ControlType.Number,
                title: "Auto Reset Delay",
                defaultValue: 6000,
                min: 1000,
                max: 30000,
                step: 500,
                unit: "ms",
                hidden: ({ mode }) => mode !== "auto",
            },
            maxBites: {
                type: ControlType.Number,
                title: "Max Bites",
                defaultValue: 8,
                min: 1,
                max: 14,
                step: 1,
            },
        },
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        icon: "cursor",
        controls: {
            hideSystemCursor: {
                type: ControlType.Boolean,
                title: "Hide System Cursor",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            zIndex: {
                type: ControlType.Number,
                title: "Z-Index",
                defaultValue: 9999,
                min: 0,
                max: 99999,
                step: 1,
            },
        },
    },
    stage: {
        type: ControlType.Object,
        title: "Stage",
        icon: "color",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "transparent",
            },
        },
    },
})
