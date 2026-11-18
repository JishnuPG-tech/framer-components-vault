import {
    useState,
    useEffect,
    useRef,
    useMemo,
    startTransition,
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


/**
 * Glass Bubble
 * Cycling display text with a looping directional blur sweep, a glassy
 * bubble that trails smaller bubbles behind the cursor, and a click that
 * pops the bubble into a burst before it reforms. The background gradient
 * drifts slowly via a single GPU-composited transform.
 *
 * All continuous animation (the requestAnimationFrame loop, the text
 * cycle, the blur sweep, and the background drift) is disabled during
 * Framer's static rendering via useIsStaticRenderer(), and also pauses
 * offscreen (IntersectionObserver) and under reduced-motion. In static
 * renders the component shows a still frame: first phrase sharp, bubble
 * at rest, gradient shown but not moving.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

const POOL = 44

interface MyComponentProps {
    texts?: string[]
    interval?: number
    showText?: boolean
    textColor?: string
    font?: React.CSSProperties
    fontSize?: number
    fontWeight?: string
    fontStyle?: "normal" | "italic"
    letterSpacing?: number
    textPositionX?: number
    textPositionY?: number
    color1?: string
    color2?: string
    glassSize?: number
    blur?: number
    glowStrength?: number
    trailDuration?: number
    cornerRadius?: number
    useGradient?: boolean
    backgroundMotion?: boolean
    background?: string
    background2?: string
    style?: React.CSSProperties
}

interface Particle {
    active: boolean
    x: number
    y: number
    vx: number
    vy: number
    size: number
    born: number
    life: number
    maxOpacity: number
    grow: number
}

function easeOutBack(t: number) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export default function GlassBubble(props: MyComponentProps) {
    const {
        texts = ["We Design", "We Develop", "We Brand", "We Elevate"],
        interval = 3,
        showText = true,
        textColor = "#F7ECF3",
        font,
        fontSize = 84,
        fontWeight = "700",
        fontStyle = "italic",
        letterSpacing = -1.5,
        textPositionX = 50,
        textPositionY = 50,
        color1 = "#CA3782",
        color2 = "#F075B5",
        glassSize = 240,
        blur = 40,
        glowStrength = 0.9,
        trailDuration = 1,
        cornerRadius = -1,
        useGradient = true,
        backgroundMotion = true,
        background = "#1B0614",
        background2 = "#4A1238",
        style,
    } = props

    // In Framer's static rendering (canvas thumbnails, exports, SSG) we must
    // not run any continuous animation. This disables the rAF loop and the
    // CSS animations and renders a still frame instead.
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const bubbleRef = useRef<HTMLDivElement>(null)
    const partRefs = useRef<(HTMLDivElement | null)[]>([])

    const target = useRef({ x: 0, y: 0 })
    const cur = useRef({ x: 0, y: 0 })
    const lastSpawn = useRef({ x: 0, y: 0 })
    const hoverAmt = useRef(0)
    const hoveredRef = useRef(false)
    const pop = useRef({ active: false, start: 0 })
    const poolCursor = useRef(0)
    const particles = useRef<Particle[]>(
        Array.from({ length: POOL }, () => ({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            size: 0,
            born: 0,
            life: 0,
            maxOpacity: 0,
            grow: 1,
        }))
    )
    const raf = useRef(0)

    const [cycle, setCycle] = useState(0)
    const [reduced, setReduced] = useState(false)
    const [inView, setInView] = useState(true)
    const [containerWidth, setContainerWidth] = useState(1200)

    const list: string[] = Array.isArray(texts) ? texts : []
    const responsiveScale = useMemo(() => {
        const base = Math.max(320, containerWidth)
        return Math.min(1.3, Math.max(0.5, base / 1200))
    }, [containerWidth])
    const bubbleScale = Math.max(0.6, Math.min(1.3, responsiveScale))
    const size = useMemo(
        () => (glassSize || 240) * (0.85 + responsiveScale * 0.55),
        [glassSize, responsiveScale]
    )
    const mainSize = size * 0.66
    const fluidFontSize = useMemo(() => {
        const maxByWidth = containerWidth * 0.19
        return Math.max(20, Math.min(fontSize, maxByWidth))
    }, [fontSize, containerWidth])
    const fluidLetterSpacing = useMemo(
        () => letterSpacing * Math.max(0.65, Math.min(1, responsiveScale)),
        [letterSpacing, responsiveScale]
    )
    const textPositionStyles = useMemo(() => {
        const clampedX = Math.max(0, Math.min(100, textPositionX))
        const clampedY = Math.max(0, Math.min(100, textPositionY))
        const left = 6 + clampedX * 0.88
        const top = 6 + clampedY * 0.88
        return {
            left: `${left}%`,
            top: `${top}%`,
            transform: `translate(-${clampedX}%, -${clampedY}%)`,
        }
    }, [textPositionX, textPositionY])

    // Corner radius: -1 (default) means inherit the parent's radius,
    // any value >= 0 applies that pixel radius explicitly.
    const radius = cornerRadius >= 0 ? `${cornerRadius}px` : "inherit"

    // Respect reduced-motion preference
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduced(mq.matches))
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    // Pause all animation when the component is offscreen
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                const visible = entries[0]?.isIntersecting ?? true
                startTransition(() => setInView(visible))
            },
            { root: null, rootMargin: "150px 0px", threshold: 0 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Track container width for responsive sizing
    useEffect(() => {
        const el = containerRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver((entries) => {
            const nextWidth = entries[0]?.contentRect.width ?? 1200
            startTransition(() => setContainerWidth(nextWidth))
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Drive the text + blur sweep cycle (off in static, offscreen, or hidden)
    useEffect(() => {
        if (isStatic || !inView || !showText) return
        const ms = Math.max(0.3, interval || 3) * 1000
        const id = setInterval(() => {
            startTransition(() => setCycle((c) => c + 1))
        }, ms)
        return () => clearInterval(id)
    }, [interval, inView, showText, isStatic])

    // Center the bubble on mount
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        target.current = { x: cx, y: cy }
        cur.current = { x: cx, y: cy }
        lastSpawn.current = { x: cx, y: cy }
        if (bubbleRef.current)
            bubbleRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(1)`
    }, [])

    // Main animation loop: bubble follow, pop/reform, and particle updates.
    // Disabled in static rendering, offscreen, and reduced-motion.
    useEffect(() => {
        if (isStatic || reduced || !inView) return
        if (typeof requestAnimationFrame === "undefined") return
        let last =
            typeof performance !== "undefined" ? performance.now() : Date.now()
        const nowFn = () =>
            typeof performance !== "undefined" ? performance.now() : Date.now()
        const step = () => {
            const now = nowFn()
            const dt = Math.min(48, now - last)
            last = now
            const f = dt / 16.6667

            // Smoothly follow the cursor
            cur.current.x += (target.current.x - cur.current.x) * Math.min(1, 0.32 * f)
            cur.current.y += (target.current.y - cur.current.y) * Math.min(1, 0.32 * f)

            // Hover fade
            const hoverTarget = hoveredRef.current ? 1 : 0
            hoverAmt.current += (hoverTarget - hoverAmt.current) * Math.min(1, 0.14 * f)

            // Main bubble scale / opacity (with pop + reform)
            let mScale = 1
            let mOpacity = hoverAmt.current
            if (pop.current.active) {
                const t = (now - pop.current.start) / 460
                if (t >= 1) {
                    pop.current.active = false
                } else if (t < 0.26) {
                    const tt = t / 0.26
                    mScale = 1 + tt * 0.4
                    mOpacity = 1 - tt
                } else {
                    const tt = (t - 0.26) / 0.74
                    mScale = 0.2 + easeOutBack(tt) * 0.8
                    mOpacity = Math.max(hoverAmt.current, tt)
                }
            }
            if (bubbleRef.current) {
                bubbleRef.current.style.transform = `translate3d(${cur.current.x}px, ${cur.current.y}px, 0) translate(-50%, -50%) scale(${mScale.toFixed(3)})`
                bubbleRef.current.style.opacity = mOpacity.toFixed(3)
            }

            // Particles
            const arr = particles.current
            for (let i = 0; i < POOL; i++) {
                const p = arr[i]
                const el = partRefs.current[i]
                if (!p.active) continue
                const age = now - p.born
                const k = age / p.life
                if (k >= 1) {
                    p.active = false
                    if (el) {
                        el.style.opacity = "0"
                        el.style.display = "none"
                    }
                    continue
                }
                p.x += p.vx * f
                p.y += p.vy * f
                p.vx *= Math.pow(0.985, f)
                p.vy = p.vy * Math.pow(0.985, f) - 0.006 * f
                const fadeIn = Math.min(1, age / 70)
                const op = p.maxOpacity * fadeIn * (1 - k)
                const sc = 1 + (p.grow - 1) * k
                if (el) {
                    el.style.opacity = op.toFixed(3)
                    el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`
                }
            }

            raf.current = requestAnimationFrame(step)
        }
        raf.current = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf.current)
    }, [isStatic, reduced, inView])

    // When leaving the viewport, retire any lingering trail/burst particles
    // so nothing is left half-drawn when we resume.
    useEffect(() => {
        if (inView) return
        const arr = particles.current
        for (let i = 0; i < POOL; i++) {
            arr[i].active = false
            const el = partRefs.current[i]
            if (el) {
                el.style.opacity = "0"
                el.style.display = "none"
            }
        }
    }, [inView])

    // ---- spawning helpers (defined in render so they read fresh props) ----
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const stamp = () =>
        typeof performance !== "undefined" ? performance.now() : Date.now()

    const allocate = () => {
        const arr = particles.current
        for (let i = 0; i < POOL; i++) if (!arr[i].active) return i
        const i = poolCursor.current
        poolCursor.current = (i + 1) % POOL
        return i
    }

    const styleParticle = (i: number, s: number) => {
        const el = partRefs.current[i]
        if (el) {
            el.style.width = `${s}px`
            el.style.height = `${s}px`
            el.style.display = "block"
        }
    }

    const spawnTrail = (x: number, y: number) => {
        const i = allocate()
        const p = particles.current[i]
        const s = rand(6, 16) * bubbleScale
        p.active = true
        p.x = x + rand(-6, 6)
        p.y = y + rand(-6, 6)
        p.vx = rand(-0.25, 0.25)
        p.vy = rand(-0.55, -0.1)
        p.size = s
        p.born = stamp()
        p.life = Math.max(400, (trailDuration || 1) * 1000) * rand(0.7, 1.1)
        p.maxOpacity = 0.55 * (glowStrength ?? 0.9)
        p.grow = rand(1.05, 1.45)
        styleParticle(i, s)
    }

    const spawnBurst = (x: number, y: number) => {
        const n = 12
        for (let k = 0; k < n; k++) {
            const i = allocate()
            const p = particles.current[i]
            const ang = (k / n) * Math.PI * 2 + rand(-0.25, 0.25)
            const spd = rand(1.4, 3.8) * bubbleScale
            const s = rand(4, 11) * bubbleScale
            p.active = true
            p.x = x
            p.y = y
            p.vx = Math.cos(ang) * spd
            p.vy = Math.sin(ang) * spd - 0.4
            p.size = s
            p.born = stamp()
            p.life = rand(450, 780)
            p.maxOpacity = 0.75 * (glowStrength ?? 0.9)
            p.grow = rand(0.5, 0.9)
            styleParticle(i, s)
        }
    }

    const relative = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = containerRef.current
        if (!el) return null
        const rect = el.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return null
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || !inView) return
        const pt = relative(e)
        if (!pt) return
        target.current = pt
        hoveredRef.current = true
        const dx = pt.x - lastSpawn.current.x
        const dy = pt.y - lastSpawn.current.y
        const gap = 16 * bubbleScale
        if (dx * dx + dy * dy > gap * gap) {
            spawnTrail(pt.x, pt.y)
            lastSpawn.current = pt
        }
    }

    const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || !inView) return
        const pt = relative(e)
        if (!pt) return
        target.current = pt
        hoveredRef.current = true
        pop.current = { active: true, start: stamp() }
        spawnBurst(pt.x, pt.y)
    }

    const gradientImage = `radial-gradient(90% 90% at 18% 12%, ${background2} 0%, rgba(0,0,0,0) 55%), radial-gradient(85% 85% at 85% 92%, ${color1} 0%, rgba(0,0,0,0) 46%), linear-gradient(155deg, ${background} 0%, #0C0308 100%)`

    const current = list.length ? list[cycle % list.length] : ""
    const sweepDir = cycle % 2 === 0 ? "dznBlurLeft" : "dznBlurRight"

    const bubbleFace = `radial-gradient(circle at 34% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0.03) 44%, rgba(0,0,0,0) 64%), radial-gradient(circle at 68% 74%, ${color2}55, rgba(0,0,0,0) 58%)`

    const fontObj: React.CSSProperties =
        font && typeof font === "object"
            ? font
            : { fontFamily: "Inter, sans-serif" }
    const sharedTextStyle: React.CSSProperties = {
        ...fontObj,
        display: "block",
        fontSize: fluidFontSize,
        fontWeight,
        fontStyle,
        letterSpacing: fluidLetterSpacing,
        color: textColor,
        lineHeight: 1.05,
        width: "100%",
        maxWidth: "100%",
        textAlign: "center",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
    }

    // Tight, letter-hugging glow: small blur radii keep it aligned to the
    // glyph edges instead of spreading into a wide halo around the text.
    const textGlowShadow =
        "0 0 1px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.55), 0 0 3px rgba(0,0,0,0.4)"

    // Background drift is only "active" (animated) when not static, not
    // reduced-motion, gradient on, and motion enabled.
    const driftActive =
        !isStatic && useGradient && backgroundMotion && !reduced
    // The blur sweep overlay only renders when animation is allowed.
    const sweepAllowed = !isStatic && !reduced && inView

    // Defensive sizing so the component always has a real box to render into,
    // even in the isolated component preview where no parent size is given.
    const styleWidth = style?.width
    const styleHeight = style?.height
    const unconstrained =
        (styleWidth === undefined ||
            styleWidth === null ||
            styleWidth === "100%") &&
        (styleHeight === undefined ||
            styleHeight === null ||
            styleHeight === "100%")

    return (
        <div
            ref={containerRef}
            onPointerMove={onMove}
            onPointerDown={onDown}
            onPointerEnter={() => {
                hoveredRef.current = true
            }}
            onPointerLeave={() => {
                hoveredRef.current = false
            }}
            style={{
                ...style,
                position: "relative",
                width: unconstrained ? "100%" : styleWidth,
                height: unconstrained ? "100%" : styleHeight,
                maxWidth: "100%",
                minWidth: unconstrained ? "260px" : style?.minWidth,
                minHeight: unconstrained ? "200px" : style?.minHeight || "160px",
                aspectRatio: unconstrained ? "16 / 7" : style?.aspectRatio,
                borderRadius: radius,
                overflow: "hidden",
                backgroundColor: background,
                isolation: "isolate",
            }}
        >
            {/* Drifting gradient layer (single GPU-composited transform).
                In static / reduced-motion it renders a still, centered frame. */}
            {useGradient && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: "-16%",
                        zIndex: 0,
                        pointerEvents: "none",
                        backgroundImage: gradientImage,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 50%",
                        transformOrigin: "50% 50%",
                        transform: driftActive
                            ? "translate3d(-4%, -3%, 0) scale(1.05)"
                            : "translate3d(0, 0, 0) scale(1.06)",
                        willChange: driftActive ? "transform" : "auto",
                        animation: driftActive
                            ? "dznBgDrift 16s ease-in-out infinite"
                            : "none",
                        animationPlayState: inView ? "running" : "paused",
                    }}
                />
            )}

            {/* Bubble particle pool (trail + pop burst) */}
            {Array.from({ length: POOL }).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        partRefs.current[i] = el
                    }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        display: "none",
                        opacity: 0,
                        borderRadius: "50%",
                        pointerEvents: "none",
                        background: `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.12) 30%, rgba(0,0,0,0) 62%), radial-gradient(circle at 66% 72%, ${color1}44, rgba(0,0,0,0) 60%)`,
                        border: "1px solid rgba(255,255,255,0.32)",
                        boxShadow: "inset 0 0 8px rgba(255,255,255,0.35)",
                        willChange: "transform, opacity",
                        zIndex: 1,
                    }}
                />
            ))}

            {/* Leading glass bubble (hidden at rest / in static) */}
            <div
                ref={bubbleRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: mainSize,
                    height: mainSize,
                    borderRadius: "50%",
                    pointerEvents: "none",
                    background: bubbleFace,
                    backdropFilter: `blur(${Math.max(2, (blur || 40) * 0.06)}px) saturate(140%)`,
                    WebkitBackdropFilter: `blur(${Math.max(2, (blur || 40) * 0.06)}px) saturate(140%)`,
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: `inset -6px -8px 26px ${color1}22, inset 6px 8px 28px rgba(255,255,255,0.22), 0 10px 32px ${color1}22`,
                    opacity: 0,
                    willChange: "transform, opacity",
                    zIndex: 2,
                }}
            />

            {/* Center cycling text with looping blur sweep */}
            {showText && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        padding: "6%",
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            ...textPositionStyles,
                            textAlign: "center",
                            maxWidth: "88%",
                            width: "max-content",
                            minWidth: 0,
                        }}
                    >
                        {/* Sharp base text (always present, and the static state) */}
                        <span
                            style={{
                                ...sharedTextStyle,
                                textShadow: textGlowShadow,
                            }}
                        >
                            {current}
                        </span>
                        {/* Blurred overlay that sweeps in and clears (runtime only) */}
                        {sweepAllowed && (
                            <span
                                key={cycle}
                                aria-hidden
                                style={{
                                    ...sharedTextStyle,
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    filter: "blur(9px)",
                                    opacity: 0,
                                    maskImage:
                                        "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 22%, #000 42%, rgba(0,0,0,0) 68%)",
                                    WebkitMaskImage:
                                        "linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 22%, #000 42%, rgba(0,0,0,0) 68%)",
                                    maskSize: "260% 100%",
                                    WebkitMaskSize: "260% 100%",
                                    maskRepeat: "no-repeat",
                                    WebkitMaskRepeat: "no-repeat",
                                    animation: `${sweepDir} 1.6s ease forwards`,
                                }}
                            >
                                {current}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes dznBlurLeft {
                    0%   { opacity: 0.95; -webkit-mask-position: 0% 0%; mask-position: 0% 0%; }
                    55%  { opacity: 0.95; -webkit-mask-position: 62% 0%; mask-position: 62% 0%; }
                    100% { opacity: 0;    -webkit-mask-position: 100% 0%; mask-position: 100% 0%; }
                }
                @keyframes dznBlurRight {
                    0%   { opacity: 0.95; -webkit-mask-position: 100% 0%; mask-position: 100% 0%; }
                    55%  { opacity: 0.95; -webkit-mask-position: 38% 0%; mask-position: 38% 0%; }
                    100% { opacity: 0;    -webkit-mask-position: 0% 0%; mask-position: 0% 0%; }
                }
                @keyframes dznBgDrift {
                    0%   { transform: translate3d(-4%, -3%, 0) scale(1.05); }
                    50%  { transform: translate3d(4%, 3%, 0) scale(1.13); }
                    100% { transform: translate3d(-4%, -3%, 0) scale(1.05); }
                }
            `}</style>
        </div>
    )
}

addPropertyControls(GlassBubble, {
    texts: {
        type: ControlType.Array,
        title: "Texts",
        control: { type: ControlType.String, placeholder: "Add a phrase" },
        defaultValue: ["We Design", "We Develop", "We Brand", "We Elevate"],
    },
    showText: {
        type: ControlType.Boolean,
        title: "Show Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 3,
        min: 1,
        max: 15,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        hidden: (props: any) => !props.showText,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F7ECF3",
        hidden: (props: any) => !props.showText,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        hidden: (props: any) => !props.showText,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 84,
        min: 12,
        max: 260,
        step: 1,
        unit: "px",
        hidden: (props: any) => !props.showText,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        options: ["300", "400", "500", "600", "700", "800", "900"],
        optionTitles: [
            "Light",
            "Regular",
            "Medium",
            "Semibold",
            "Bold",
            "Extrabold",
            "Black",
        ],
        defaultValue: "700",
        hidden: (props: any) => !props.showText,
    },
    fontStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["normal", "italic"],
        optionTitles: ["Normal", "Italic"],
        defaultValue: "italic",
        hidden: (props: any) => !props.showText,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: -1.5,
        min: -12,
        max: 20,
        step: 0.5,
        unit: "px",
        hidden: (props: any) => !props.showText,
    },
    textPositionX: {
        type: ControlType.Number,
        title: "Text X (%)",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: any) => !props.showText,
    },
    textPositionY: {
        type: ControlType.Number,
        title: "Text Y (%)",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (props: any) => !props.showText,
    },
    color1: {
        type: ControlType.Color,
        title: "Bubble Tint 1",
        defaultValue: "#CA3782",
    },
    color2: {
        type: ControlType.Color,
        title: "Bubble Tint 2",
        defaultValue: "#F075B5",
    },
    glassSize: {
        type: ControlType.Number,
        title: "Bubble Size",
        defaultValue: 240,
        min: 80,
        max: 600,
        step: 10,
        unit: "px",
    },
    blur: {
        type: ControlType.Number,
        title: "Bubble Blur",
        defaultValue: 40,
        min: 0,
        max: 140,
        step: 1,
        unit: "px",
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Bubble Opacity",
        defaultValue: 0.9,
        min: 0,
        max: 1,
        step: 0.05,
    },
    trailDuration: {
        type: ControlType.Number,
        title: "Trail Life",
        defaultValue: 1,
        min: 0.3,
        max: 2.5,
        step: 0.1,
        unit: "s",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: -1,
        min: -1,
        max: 200,
        step: 1,
        unit: "px",
        description:
            "Leave at -1 to match the parent's radius, or set a value to override.",
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: true,
        enabledTitle: "Gradient",
        disabledTitle: "Solid",
    },
    backgroundMotion: {
        type: ControlType.Boolean,
        title: "BG Motion",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: any) => !props.useGradient,
    },
    background: {
        type: ControlType.Color,
        title: "BG Base",
        defaultValue: "#1B0614",
    },
    background2: {
        type: ControlType.Color,
        title: "BG Glow",
        defaultValue: "#4A1238",
        hidden: (props: any) => !props.useGradient,
    },
})
