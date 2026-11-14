// User instructions: Create a futuristic interactive workshop website in Framer with a dark cosmic theme and ultra-modern UI. The layout should feel alive with floating glassmorphism cards, smooth mouse-follow animations, glowing neon borders, magnetic buttons, animated gradients, particle backgrounds, and cinematic lighting effects. Add unique hover interactions where components expand, rotate slightly in 3D, and reveal hidden glowing elements. Include a hero section with animated text, orbiting icons, floating geometric shapes, and smooth scroll transitions. Use premium typography, dynamic blur effects, liquid motion animations, parallax layers, and interactive cards that react to cursor movement. Add sections for services, projects, testimonials, and futuristic stats counters with elegant transitions. Make the design visually powerful, highly creative, responsive, and unlike traditional workshop websites. Use vibrant neon blue, purple, and cyan accents with smooth micro-interactions and immersive visual depth.

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

import {
    motion,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion"

type FontLike = any

type ImageLike = { src: string; alt?: string }

type CardItem = {
    title: string
    description: string
    tag?: string
    image?: ImageLike
}

type TestimonialItem = {
    quote: string
    name: string
    role: string
}

type StatItem = {
    label: string
    value: number
    suffix?: string
}

type ExtraSection = {
    id: string
    title: string
    subtitle?: string
    content?: React.ReactNode | React.ReactNode[]
    showInNav?: boolean
}

interface FuturisticWorkshopSiteProps {
    theme: "custom" | "darkNeon" | "lightNeon" | "deepPurple" | "cyberCyan"

    headline: string
    subhead: string
    primaryCta: string
    secondaryCta: string
    showSecondaryCta: boolean

    servicesTitle: string
    projectsTitle: string
    testimonialsTitle: string
    statsTitle: string

    services: CardItem[]
    projects: CardItem[]
    testimonials: TestimonialItem[]
    stats: StatItem[]

    extraSections: ExtraSection[]

    backgroundColor: string
    textColor: string
    subtleTextColor: string

    neonBlue: string
    neonPurple: string
    neonCyan: string

    glassTint: string

    headingFont: FontLike
    bodyFont: FontLike
    buttonFont: FontLike

    enableParticles: boolean
    enableOrbit: boolean
    enableParallax: boolean

    maxWidth: number
    sectionGap: number
    cardRadius: number
    cardBorderWidth: number

    style?: React.CSSProperties
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
}

function toSectionId(input: string) {
    const raw = (input || "").trim().toLowerCase()
    const id = raw
        .replace(/[^a-z0-9\s-_]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
    return id || "section"
}

function usePrefersReducedMotionSafe() {
    const reduced = useReducedMotion()
    return !!reduced
}

function useSmoothScroll() {
    return React.useCallback((id: string) => {
        if (typeof window === "undefined") return
        const el = document.getElementById(id)
        if (!el) return
        try {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
        } catch {
            el.scrollIntoView()
        }
    }, [])
}

function ParticleField(props: {
    enabled: boolean
    neonBlue: string
    neonPurple: string
    neonCyan: string
    opacity?: number
}) {
    const { enabled, neonBlue, neonPurple, neonCyan, opacity = 0.55 } = props
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    const rafRef = React.useRef<number | null>(null)
    const particlesRef = React.useRef<
        Array<{
            x: number
            y: number
            vx: number
            vy: number
            r: number
            c: string
        }>
    >([])

    React.useEffect(() => {
        if (!enabled) return
        if (typeof window === "undefined") return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

        const palette = [neonBlue, neonPurple, neonCyan]

        function resize() {
            const parent = canvas.parentElement
            if (!parent) return
            const rect = parent.getBoundingClientRect()
            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))
            canvas.style.width = `${rect.width}px`
            canvas.style.height = `${rect.height}px`

            const count = clamp(Math.floor((rect.width * rect.height) / 18000), 20, 90)
            const next: typeof particlesRef.current = []
            for (let i = 0; i < count; i++) {
                const c = palette[i % palette.length]
                next.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.25 * dpr,
                    vy: (Math.random() - 0.5) * 0.25 * dpr,
                    r: (Math.random() * 2.2 + 0.8) * dpr,
                    c,
                })
            }
            particlesRef.current = next
        }

        const ro = new ResizeObserver(() => resize())
        if (canvas.parentElement) ro.observe(canvas.parentElement)
        resize()

        let t = 0
        function tick() {
            t += 1
            const w = canvas.width
            const h = canvas.height
            ctx.clearRect(0, 0, w, h)

            ctx.globalCompositeOperation = "lighter"
            const pts = particlesRef.current
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i]
                p.x += p.vx
                p.y += p.vy
                if (p.x < -20) p.x = w + 20
                if (p.x > w + 20) p.x = -20
                if (p.y < -20) p.y = h + 20
                if (p.y > h + 20) p.y = -20

                ctx.beginPath()
                ctx.fillStyle = p.c
                ctx.globalAlpha = opacity
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fill()
            }

            // subtle connecting lines
            ctx.globalAlpha = opacity * 0.35
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const a = pts[i]
                    const b = pts[j]
                    const dx = a.x - b.x
                    const dy = a.y - b.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    const limit = 160 * dpr
                    if (dist < limit) {
                        ctx.strokeStyle = i % 2 === 0 ? neonCyan : neonPurple
                        ctx.lineWidth = 1 * dpr
                        ctx.beginPath()
                        ctx.moveTo(a.x, a.y)
                        ctx.lineTo(b.x, b.y)
                        ctx.stroke()
                    }
                }
            }

            ctx.globalCompositeOperation = "source-over"
            rafRef.current = window.requestAnimationFrame(tick)
        }

        rafRef.current = window.requestAnimationFrame(tick)

        return () => {
            ro.disconnect()
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [enabled, neonBlue, neonCyan, neonPurple, opacity])

    if (!enabled) return null

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                filter: "blur(0.1px)",
                opacity: 1,
            }}
            aria-hidden="true"
        />
    )
}

function MagneticButton(props: {
    label: string
    onClick?: () => void
    kind: "primary" | "secondary"
    neonBlue: string
    neonPurple: string
    neonCyan: string
    textColor: string
    subtleTextColor: string
    buttonFont: any
}) {
    const {
        label,
        onClick,
        kind,
        neonBlue,
        neonPurple,
        neonCyan,
        textColor,
        subtleTextColor,
        buttonFont,
    } = props

    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const sx = useSpring(x, { stiffness: 320, damping: 26, mass: 0.6 })
    const sy = useSpring(y, { stiffness: 320, damping: 26, mass: 0.6 })

    const ref = React.useRef<HTMLButtonElement | null>(null)

    const handleMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (e.pointerType === "touch") return
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const dx = e.clientX - (r.left + r.width / 2)
            const dy = e.clientY - (r.top + r.height / 2)
            const max = 10
            const nx = clamp(dx / (r.width / 2), -1, 1) * max
            const ny = clamp(dy / (r.height / 2), -1, 1) * max
            x.set(nx)
            y.set(ny)
        },
        [x, y],
    )

    const handleLeave = React.useCallback(() => {
        x.set(0)
        y.set(0)
    }, [x, y])

    const gradient =
        kind === "primary"
            ? `linear-gradient(135deg, ${neonBlue}, ${neonPurple}, ${neonCyan})`
            : `linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06))`

    const border =
        kind === "primary"
            ? `1px solid rgba(255,255,255,0.14)`
            : `1px solid rgba(255,255,255,0.18)`

    return (
        <motion.button
            ref={ref}
            type="button"
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            onClick={onClick}
            style={{
                position: "relative",
                appearance: "none",
                border,
                background: gradient,
                color: kind === "primary" ? "#050510" : textColor,
                padding: "12px 16px",
                borderRadius: 14,
                cursor: "pointer",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
                transform: useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`,
                boxShadow:
                    kind === "primary"
                        ? `0 18px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06), 0 0 28px rgba(140, 90, 255, 0.25)`
                        : `0 18px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)`,
                ...buttonFont,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            aria-label={label}
        >
            <span
                style={{
                    position: "relative",
                    zIndex: 2,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    whiteSpace: "nowrap",
                }}
            >
                {label}
                <span
                    aria-hidden="true"
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: kind === "primary" ? "rgba(0,0,0,0.45)" : neonCyan,
                        boxShadow:
                            kind === "primary"
                                ? "0 0 0 6px rgba(0,0,0,0.10), 0 0 24px rgba(0,0,0,0.22)"
                                : `0 0 0 6px rgba(0, 255, 240, 0.10), 0 0 24px rgba(0, 255, 240, 0.25)`,
                    }}
                />
            </span>

            <motion.span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: 16,
                    background:
                        kind === "primary"
                            ? `radial-gradient(300px 120px at 20% 20%, rgba(0,255,240,0.25), transparent 60%), radial-gradient(260px 120px at 70% 80%, rgba(140,90,255,0.20), transparent 60%)`
                            : `radial-gradient(240px 120px at 20% 20%, rgba(0,255,240,0.14), transparent 60%)`,
                    filter: "blur(10px)",
                    opacity: 0.85,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    background:
                        kind === "primary"
                            ? "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))"
                            : "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 1,
                    borderRadius: 13,
                    boxShadow:
                        kind === "primary"
                            ? `inset 0 0 0 1px rgba(255,255,255,0.20), inset 0 -30px 40px rgba(0,0,0,0.15)`
                            : `inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 -30px 40px rgba(0,0,0,0.15)`,
                    pointerEvents: "none",
                }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 16,
                    top: 10,
                    width: 60,
                    height: 10,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.22)",
                    filter: "blur(10px)",
                    opacity: 0.7,
                    pointerEvents: "none",
                }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    boxShadow:
                        kind === "primary"
                            ? `0 0 0 1px rgba(0,255,240,0.14), 0 0 40px rgba(0, 153, 255, 0.18)`
                            : `0 0 0 1px rgba(0,255,240,0.10), 0 0 34px rgba(140, 90, 255, 0.14)`,
                    pointerEvents: "none",
                }}
            />

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    color: subtleTextColor,
                    opacity: 0,
                    pointerEvents: "none",
                }}
            />
        </motion.button>
    )
}

function InteractiveGlassCard(props: {
    item: CardItem
    accentA: string
    accentB: string
    accentC: string
    glassTint: string
    textColor: string
    subtleTextColor: string
    radius: number
    borderWidth: number
    headingFont: any
    bodyFont: any
}) {
    const {
        item,
        accentA,
        accentB,
        accentC,
        glassTint,
        textColor,
        subtleTextColor,
        radius,
        borderWidth,
        headingFont,
        bodyFont,
    } = props

    const ref = React.useRef<HTMLDivElement | null>(null)
    const mx = useMotionValue(0.5)
    const my = useMotionValue(0.5)

    const rx = useTransform(my, [0, 1], [10, -10])
    const ry = useTransform(mx, [0, 1], [-12, 12])

    const srx = useSpring(rx, { stiffness: 220, damping: 22, mass: 0.6 })
    const sry = useSpring(ry, { stiffness: 220, damping: 22, mass: 0.6 })

    const glow = useMotionTemplate`radial-gradient(220px 140px at calc(${mx} * 100%) calc(${my} * 100%), rgba(0,255,240,0.22), transparent 60%), radial-gradient(240px 160px at 10% 20%, rgba(140,90,255,0.18), transparent 60%)`

    const onMove = React.useCallback(
        (e: React.PointerEvent) => {
            if (e.pointerType === "touch") return
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const x = (e.clientX - r.left) / Math.max(1, r.width)
            const y = (e.clientY - r.top) / Math.max(1, r.height)
            mx.set(clamp(x, 0, 1))
            my.set(clamp(y, 0, 1))
        },
        [mx, my],
    )

    const onLeave = React.useCallback(() => {
        mx.set(0.5)
        my.set(0.5)
    }, [mx, my])

    return (
        <motion.article
            ref={ref}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            initial={false}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: radius,
                overflow: "hidden",
                transformStyle: "preserve-3d",
                background: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), ${glassTint}`,
                border: `${borderWidth}px solid rgba(255,255,255,0.14)`,
                boxShadow:
                    "0 20px 70px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(255,255,255,0.06)",
                perspective: 900,
            }}
        >
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -1,
                    borderRadius: radius + 2,
                    background: glow,
                    filter: "blur(18px)",
                    opacity: 0.8,
                    pointerEvents: "none",
                }}
            />

            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: radius,
                    background: `linear-gradient(135deg, rgba(0,255,240,0.08), rgba(140,90,255,0.10), rgba(0,153,255,0.06))`,
                    mixBlendMode: "screen",
                    opacity: 0.6,
                    pointerEvents: "none",
                }}
            />

            <motion.div
                style={{
                    position: "relative",
                    height: "100%",
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    transform: useMotionTemplate`rotateX(${srx}deg) rotateY(${sry}deg) translateZ(0)`,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            minWidth: 0,
                        }}
                    >
                        <span
                            aria-hidden="true"
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: accentC,
                                boxShadow: `0 0 0 6px rgba(0,255,240,0.10), 0 0 30px rgba(0,255,240,0.22)`,
                                flex: "0 0 auto",
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                minWidth: 0,
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: textColor,
                                    ...headingFont,
                                    fontSize: headingFont?.fontSize || "16px",
                                    lineHeight: headingFont?.lineHeight || "1.1em",
                                    letterSpacing: headingFont?.letterSpacing || "-0.01em",
                                }}
                            >
                                {item.title}
                            </h3>
                            {item.tag ? (
                                <p
                                    style={{
                                        margin: 0,
                                        color: subtleTextColor,
                                        ...bodyFont,
                                        fontSize: "12px",
                                        lineHeight: "1.2em",
                                        opacity: 0.9,
                                    }}
                                >
                                    {item.tag}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <motion.div
                        aria-hidden="true"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: `radial-gradient(26px 26px at 35% 30%, rgba(255,255,255,0.22), rgba(255,255,255,0.04)), linear-gradient(135deg, rgba(0,153,255,0.10), rgba(140,90,255,0.12))`,
                            border: "1px solid rgba(255,255,255,0.14)",
                            boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 0 40px rgba(0,153,255,0.18)`,
                            flex: "0 0 auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: "translateZ(16px)",
                        }}
                        whileHover={{ rotate: 10, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 280, damping: 18 }}
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                        >
                            <path
                                d="M12 2l2.5 7.2L22 12l-7.5 2.8L12 22l-2.5-7.2L2 12l7.5-2.8L12 2z"
                                stroke={accentA}
                                strokeWidth="1.6"
                                opacity="0.95"
                            />
                        </svg>
                    </motion.div>
                </div>

                <p
                    style={{
                        margin: 0,
                        color: subtleTextColor,
                        ...bodyFont,
                        lineHeight: bodyFont?.lineHeight || "1.4em",
                        letterSpacing: bodyFont?.letterSpacing || "-0.01em",
                        fontSize: bodyFont?.fontSize || "14px",
                        opacity: 0.96,
                    }}
                >
                    {item.description}
                </p>

                <div style={{ flex: 1 }} />

                <motion.div
                    aria-hidden="true"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 10,
                        transform: "translateZ(14px)",
                    }}
                    initial={{ opacity: 0.5, y: 8 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 240, damping: 20 }}
                >
                    <div
                        style={{
                            height: 10,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${accentA}, transparent)`,
                            filter: "blur(0.2px)",
                        }}
                    />
                    <div
                        style={{
                            height: 10,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${accentB}, transparent)`,
                            filter: "blur(0.2px)",
                        }}
                    />
                    <div
                        style={{
                            height: 10,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${accentC}, transparent)`,
                            filter: "blur(0.2px)",
                        }}
                    />
                </motion.div>
            </motion.div>

            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: radius,
                    boxShadow: `inset 0 0 0 1px rgba(0,255,240,0.08), inset 0 0 50px rgba(0,153,255,0.06)`,
                    pointerEvents: "none",
                }}
            />
        </motion.article>
    )
}

function Section(props: {
    id: string
    title: string
    subtitle?: string
    headingFont: any
    bodyFont: any
    textColor: string
    subtleTextColor: string
    children: React.ReactNode
}) {
    const { id, title, subtitle, headingFont, bodyFont, textColor, subtleTextColor, children } = props

    const ref = React.useRef<HTMLDivElement | null>(null)
    const inView = useInView(ref, { margin: "-10% 0px -10% 0px", amount: 0.2 })

    return (
        <section
            id={id}
            style={{
                position: "relative",
                width: "100%",
            }}
        >
            <div ref={ref} />
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0.4, y: 18 }}
                transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginBottom: 18,
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        color: textColor,
                        ...headingFont,
                        fontSize: headingFont?.fontSize || "28px",
                        lineHeight: headingFont?.lineHeight || "1.05em",
                        letterSpacing: headingFont?.letterSpacing || "-0.03em",
                    }}
                >
                    {title}
                </h2>
                {subtitle ? (
                    <p
                        style={{
                            margin: 0,
                            color: subtleTextColor,
                            ...bodyFont,
                            opacity: 0.95,
                            maxWidth: 680,
                        }}
                    >
                        {subtitle}
                    </p>
                ) : null}
            </motion.div>
            {children}
        </section>
    )
}

function StatCounter(props: {
    item: StatItem
    inView: boolean
    textColor: string
    subtleTextColor: string
    headingFont: any
    bodyFont: any
    neonCyan: string
}) {
    const { item, inView, textColor, subtleTextColor, headingFont, bodyFont, neonCyan } = props

    const reduced = usePrefersReducedMotionSafe()
    const mv = useMotionValue(0)
    const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.9 })
    const rounded = useTransform(spring, (v) => Math.round(v))

    React.useEffect(() => {
        if (!inView) return
        if (reduced) {
            mv.set(item.value)
            return
        }
        mv.set(0)
        mv.set(item.value)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView, item.value, reduced])

    return (
        <div
            style={{
                position: "relative",
                padding: 18,
                borderRadius: 18,
                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow:
                    "0 18px 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)",
                overflow: "hidden",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: 20,
                    background: `radial-gradient(220px 120px at 20% 20%, rgba(0,255,240,0.18), transparent 60%), radial-gradient(240px 140px at 80% 80%, rgba(0,153,255,0.14), transparent 60%)`,
                    filter: "blur(18px)",
                    opacity: 0.9,
                    pointerEvents: "none",
                }}
            />

            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
                <motion.div
                    style={{
                        color: textColor,
                        ...headingFont,
                        fontSize: "34px",
                        lineHeight: "1em",
                        letterSpacing: "-0.04em",
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: 6,
                    }}
                >
                    <motion.span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {RenderTarget.current() === RenderTarget.thumbnail ? item.value : (
                            <motion.span>{rounded}</motion.span>
                        )}
                    </motion.span>
                    <span
                        style={{
                            fontSize: "18px",
                            opacity: 0.9,
                            color: neonCyan,
                        }}
                    >
                        {item.suffix || ""}
                    </span>
                </motion.div>

                <p
                    style={{
                        margin: 0,
                        color: subtleTextColor,
                        ...bodyFont,
                        opacity: 0.95,
                    }}
                >
                    {item.label}
                </p>
            </div>
        </div>
    )
}

/**
 * Futuristic Workshop Site
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 1600
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function FuturisticWorkshopSite(props: FuturisticWorkshopSiteProps) {
    const {
        theme,
        headline,
        subhead,
        primaryCta,
        secondaryCta,
        showSecondaryCta,
        servicesTitle,
        projectsTitle,
        testimonialsTitle,
        statsTitle,
        services,
        projects,
        testimonials,
        stats,
        extraSections,
        backgroundColor,
        textColor,
        subtleTextColor,
        neonBlue,
        neonPurple,
        neonCyan,
        glassTint,
        headingFont,
        bodyFont,
        buttonFont,
        enableParticles,
        enableOrbit,
        enableParallax,
        maxWidth,
        sectionGap,
        cardRadius,
        cardBorderWidth,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduced = usePrefersReducedMotionSafe()

    const themePalette = React.useMemo(() => {
        if (theme === "lightNeon") {
            return {
                backgroundColor: "#F5F5F5",
                textColor: "#050510",
                subtleTextColor: "#4B4B4B",
                neonBlue: "#0066FF",
                neonPurple: "#8855FF",
                neonCyan: "#00B8FF",
                glassTint: "rgba(255,255,255,0.55)",
            }
        }

        if (theme === "deepPurple") {
            return {
                backgroundColor: "#050112",
                textColor: "#FFFFFF",
                subtleTextColor: "#CCCCCC",
                neonBlue: "#4D7CFF",
                neonPurple: "#B14DFF",
                neonCyan: "#00FFF0",
                glassTint: "rgba(255,255,255,0.02)",
            }
        }

        if (theme === "cyberCyan") {
            return {
                backgroundColor: "#02080B",
                textColor: "#EFFFFD",
                subtleTextColor: "#9ADBD6",
                neonBlue: "#00B8FF",
                neonPurple: "#5D5CFF",
                neonCyan: "#00FFF0",
                glassTint: "rgba(255,255,255,0.02)",
            }
        }

        // darkNeon (default)
        if (theme === "darkNeon") {
            return {
                backgroundColor: "#050510",
                textColor: "#FFFFFF",
                subtleTextColor: "#CCCCCC",
                neonBlue: "#0099FF",
                neonPurple: "#8855FF",
                neonCyan: "#00FFF0",
                glassTint: "rgba(255,255,255,0.02)",
            }
        }

        // custom
        return {
            backgroundColor,
            textColor,
            subtleTextColor,
            neonBlue,
            neonPurple,
            neonCyan,
            glassTint,
        }
    }, [
        theme,
        backgroundColor,
        textColor,
        subtleTextColor,
        neonBlue,
        neonPurple,
        neonCyan,
        glassTint,
    ])

    const backgroundColorUsed = themePalette.backgroundColor
    const textColorUsed = themePalette.textColor
    const subtleTextColorUsed = themePalette.subtleTextColor
    const neonBlueUsed = themePalette.neonBlue
    const neonPurpleUsed = themePalette.neonPurple
    const neonCyanUsed = themePalette.neonCyan
    const glassTintUsed = themePalette.glassTint

    const rootRef = React.useRef<HTMLDivElement | null>(null)

    const cursorX = useMotionValue(0.5)
    const cursorY = useMotionValue(0.35)
    const cursorXS = useSpring(cursorX, { stiffness: 140, damping: 26, mass: 0.7 })
    const cursorYS = useSpring(cursorY, { stiffness: 140, damping: 26, mass: 0.7 })

    const { scrollYProgress } = useScroll()
    const parallaxA = useTransform(scrollYProgress, [0, 1], [0, -120])
    const parallaxB = useTransform(scrollYProgress, [0, 1], [0, -220])

    const heroGradient = useMotionTemplate`
        radial-gradient(900px 500px at calc(${cursorXS} * 100%) calc(${cursorYS} * 100%), rgba(0,255,240,0.20), transparent 62%),
        radial-gradient(900px 540px at 20% 10%, rgba(0,153,255,0.18), transparent 60%),
        radial-gradient(900px 540px at 80% 60%, rgba(140,90,255,0.16), transparent 60%),
        linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.00))
    `

    const animatedBorder = useMotionTemplate`linear-gradient(90deg, ${neonBlueUsed}, ${neonPurpleUsed}, ${neonCyanUsed}, ${neonBlueUsed})`

    const smoothScrollTo = useSmoothScroll()

    const onRootMove = React.useCallback(
        (e: React.PointerEvent) => {
            const el = rootRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const x = (e.clientX - r.left) / Math.max(1, r.width)
            const y = (e.clientY - r.top) / Math.max(1, r.height)
            cursorX.set(clamp(x, 0, 1))
            cursorY.set(clamp(y, 0, 1))
        },
        [cursorX, cursorY],
    )

    const onRootLeave = React.useCallback(() => {
        cursorX.set(0.5)
        cursorY.set(0.35)
    }, [cursorX, cursorY])

    const heroWords = React.useMemo(() => headline.split(" "), [headline])

    const heroSubRef = React.useRef<HTMLDivElement | null>(null)
    const heroInView = useInView(heroSubRef, { amount: 0.4, margin: "-10% 0px -10% 0px" })

    const statsRef = React.useRef<HTMLDivElement | null>(null)
    const statsInView = useInView(statsRef, { amount: 0.35, margin: "-10% 0px -10% 0px" })

    const gridCols = "repeat(auto-fit, minmax(240px, 1fr))"

    const extraNavLinks = React.useMemo(() => {
        return (extraSections || [])
            .map((s, idx) => {
                const baseId = toSectionId(s?.id || `custom-${idx + 1}`)
                return {
                    id: `extra-${baseId}-${idx}`,
                    label: s?.title || `Section ${idx + 1}`,
                    showInNav: s?.showInNav !== false,
                }
            })
            .filter((l) => l.showInNav)
            .map(({ id, label }) => ({ id, label }))
    }, [extraSections])

    return (
        <div
            ref={rootRef}
            onPointerMove={isStatic ? undefined : onRootMove}
            onPointerLeave={isStatic ? undefined : onRootLeave}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColorUsed,
                color: textColorUsed,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(1200px 700px at 40% -10%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(900px 700px at 80% 30%, rgba(255,255,255,0.03), transparent 60%)",
                    pointerEvents: "none",
                }}
            />

            <ParticleField
                enabled={!isStatic && enableParticles}
                neonBlue={neonBlueUsed}
                neonPurple={neonPurpleUsed}
                neonCyan={neonCyanUsed}
            />

            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    background: heroGradient,
                    pointerEvents: "none",
                    opacity: isStatic ? 0.65 : 1,
                    filter: "saturate(1.05)",
                }}
                animate={
                    isStatic || reduced
                        ? undefined
                        : {
                              opacity: [0.9, 1, 0.9],
                          }
                }
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -200,
                    background:
                        "conic-gradient(from 210deg at 40% 35%, rgba(0,255,240,0.10), rgba(140,90,255,0.10), rgba(0,153,255,0.10), rgba(0,255,240,0.10))",
                    filter: "blur(80px)",
                    opacity: 0.35,
                    pointerEvents: "none",
                }}
                animate={isStatic || reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
            />

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth,
                    padding: "clamp(18px, 4vw, 44px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: sectionGap,
                }}
            >
                <header
                    style={{
                        position: "relative",
                        paddingTop: 18,
                        display: "flex",
                        flexDirection: "column",
                        gap: 18,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 16,
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "10px 12px",
                                borderRadius: 999,
                                background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
                                border: "1px solid rgba(255,255,255,0.14)",
                                boxShadow:
                                    "0 16px 70px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",
                            }}
                        >
                            <span
                                aria-hidden="true"
                                style={{
                                    width: 9,
                                    height: 9,
                                    borderRadius: 999,
                                    background: neonCyanUsed,
                                    boxShadow: `0 0 0 6px rgba(0,255,240,0.12), 0 0 22px rgba(0,255,240,0.24)`,
                                }}
                            />
                            <span
                                style={{
                                    ...bodyFont,
                                    color: subtleTextColorUsed,
                                    fontSize: "13px",
                                    letterSpacing: "-0.01em",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Cosmic Workshop / Live Prototype
                            </span>
                        </div>

                        <nav
                            className="fw-nav"
                            aria-label="Section navigation"
                            style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                            }}
                        >
                            {[
                                { id: "services", label: "Services" },
                                { id: "projects", label: "Projects" },
                                { id: "testimonials", label: "Testimonials" },
                                { id: "stats", label: "Stats" },
                                ...extraNavLinks,
                            ].map((l) => (
                                <button
                                    key={l.id}
                                    type="button"
                                    onClick={() => smoothScrollTo(l.id)}
                                    className="fw-nav-btn"
                                    style={{
                                        appearance: "none",
                                        border: "1px solid rgba(255,255,255,0.14)",
                                        background:
                                            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                                        color: subtleTextColorUsed,
                                        padding: "10px 12px",
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        ...bodyFont,
                                        fontSize: "13px",
                                        lineHeight: "1em",
                                        backdropFilter: "blur(10px)",
                                        WebkitBackdropFilter: "blur(10px)",
                                    }}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div
                        className="fw-hero-grid"
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "1.3fr 0.7fr",
                            gap: 22,
                            alignItems: "stretch",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                                padding: "clamp(18px, 3vw, 26px)",
                                borderRadius: 26,
                                background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                                border: "1px solid rgba(255,255,255,0.16)",
                                boxShadow:
                                    "0 30px 110px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                overflow: "hidden",
                                backdropFilter: "blur(14px)",
                                WebkitBackdropFilter: "blur(14px)",
                            }}
                        >
                            <motion.div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: -2,
                                    borderRadius: 28,
                                    background: animatedBorder,
                                    opacity: 0.25,
                                    filter: "blur(18px)",
                                    pointerEvents: "none",
                                }}
                                animate={isStatic || reduced ? undefined : { backgroundPositionX: ["0%", "100%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            />

                            <div ref={heroSubRef} />

                            <motion.h1
                                style={{
                                    margin: 0,
                                    ...headingFont,
                                    color: textColorUsed,
                                    letterSpacing: headingFont?.letterSpacing || "-0.04em",
                                    lineHeight: headingFont?.lineHeight || "1em",
                                    fontSize: "clamp(40px, 6vw, 70px)",
                                }}
                                initial={isStatic ? false : { opacity: 0, y: 16 }}
                                animate={
                                    isStatic
                                        ? { opacity: 1, y: 0 }
                                        : heroInView
                                          ? { opacity: 1, y: 0 }
                                          : { opacity: 0.75, y: 16 }
                                }
                                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                            >
                                {heroWords.map((w, i) => (
                                    <motion.span
                                        key={`${w}-${i}`}
                                        style={{
                                            display: "inline-block",
                                            marginRight: 10,
                                            background:
                                                i % 3 === 0
                                                    ? `linear-gradient(90deg, ${neonCyanUsed}, ${neonBlueUsed})`
                                                    : i % 3 === 1
                                                      ? `linear-gradient(90deg, ${neonPurpleUsed}, ${neonCyanUsed})`
                                                      : `linear-gradient(90deg, ${neonBlueUsed}, ${neonPurpleUsed})`,
                                            WebkitBackgroundClip: "text",
                                            backgroundClip: "text",
                                            color: "transparent",
                                            filter: "drop-shadow(0 12px 22px rgba(0,0,0,0.45))",
                                        }}
                                        initial={isStatic ? false : { opacity: 0, y: 14, rotateX: 12 }}
                                        animate={isStatic ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
                                        transition={{
                                            delay: isStatic ? 0 : 0.06 * i,
                                            duration: 0.7,
                                            ease: [0.2, 0.8, 0.2, 1],
                                        }}
                                    >
                                        {w}
                                    </motion.span>
                                ))}
                            </motion.h1>

                            <motion.p
                                style={{
                                    margin: 0,
                                    color: subtleTextColorUsed,
                                    ...bodyFont,
                                    fontSize: "clamp(15px, 1.4vw, 18px)",
                                    lineHeight: "1.45em",
                                    maxWidth: 760,
                                    opacity: 0.96,
                                }}
                                initial={isStatic ? false : { opacity: 0, y: 12 }}
                                animate={isStatic ? undefined : { opacity: 1, y: 0 }}
                                transition={{ delay: isStatic ? 0 : 0.22, duration: 0.7 }}
                            >
                                {subhead}
                            </motion.p>

                            <div
                                className="fw-hero-cta"
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 12,
                                    marginTop: 6,
                                }}
                            >
                                <MagneticButton
                                    label={primaryCta}
                                    kind="primary"
                                    neonBlue={neonBlueUsed}
                                    neonPurple={neonPurpleUsed}
                                    neonCyan={neonCyanUsed}
                                    textColor={textColorUsed}
                                    subtleTextColor={subtleTextColorUsed}
                                    buttonFont={buttonFont}
                                    onClick={() => smoothScrollTo("services")}
                                />
                                {showSecondaryCta ? (
                                    <MagneticButton
                                        label={secondaryCta}
                                        kind="secondary"
                                        neonBlue={neonBlueUsed}
                                        neonPurple={neonPurpleUsed}
                                        neonCyan={neonCyanUsed}
                                        textColor={textColorUsed}
                                        subtleTextColor={subtleTextColorUsed}
                                        buttonFont={buttonFont}
                                        onClick={() => smoothScrollTo("projects")}
                                    />
                                ) : null}
                            </div>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                                    gap: 12,
                                    marginTop: 10,
                                }}
                            >
                                {[
                                    {
                                        label: "Real-time",
                                        value: "Motion UX",
                                    },
                                    { label: "Neon", value: "Cinematic Light" },
                                    { label: "Glass", value: "Deep Blur" },
                                    { label: "Alive", value: "Cursor React" },
                                ].map((pill) => (
                                    <div
                                        key={pill.label}
                                        style={{
                                            position: "relative",
                                            borderRadius: 18,
                                            padding: "12px 12px",
                                            background:
                                                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                                            border: "1px solid rgba(255,255,255,0.14)",
                                            backdropFilter: "blur(12px)",
                                            WebkitBackdropFilter: "blur(12px)",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                inset: -2,
                                                borderRadius: 20,
                                                background: `radial-gradient(180px 80px at 20% 20%, rgba(0,255,240,0.16), transparent 55%), radial-gradient(180px 90px at 85% 70%, rgba(140,90,255,0.12), transparent 60%)`,
                                                filter: "blur(18px)",
                                                opacity: 0.85,
                                                pointerEvents: "none",
                                            }}
                                        />
                                        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4 }}>
                                            <span
                                                style={{
                                                    ...bodyFont,
                                                    fontSize: "12px",
                                                    color: subtleTextColorUsed,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {pill.label}
                                            </span>
                                            <span
                                                style={{
                                                    ...bodyFont,
                                                    fontSize: "14px",
                                                    color: textColorUsed,
                                                    letterSpacing: "-0.01em",
                                                }}
                                            >
                                                {pill.value}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className="fw-hero-visual"
                            style={{
                                position: "relative",
                                borderRadius: 26,
                                background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                                border: "1px solid rgba(255,255,255,0.14)",
                                boxShadow:
                                    "0 30px 110px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                overflow: "hidden",
                                backdropFilter: "blur(16px)",
                                WebkitBackdropFilter: "blur(16px)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 18,
                                minHeight: 300,
                            }}
                        >
                            <motion.div
                                aria-hidden="true"
                                style={{
                                    position: "absolute",
                                    inset: -70,
                                    background:
                                        "radial-gradient(320px 240px at 35% 35%, rgba(0,153,255,0.25), transparent 60%), radial-gradient(320px 240px at 70% 70%, rgba(140,90,255,0.22), transparent 60%), radial-gradient(260px 220px at 55% 40%, rgba(0,255,240,0.20), transparent 60%)",
                                    filter: "blur(18px)",
                                    opacity: 0.9,
                                }}
                                animate={
                                    isStatic || reduced
                                        ? undefined
                                        : {
                                              rotate: [0, 90, 180, 360],
                                          }
                                }
                                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                            />

                            <motion.div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    maxWidth: 420,
                                    aspectRatio: "1 / 1",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <motion.div
                                    aria-hidden="true"
                                    style={{
                                        width: "70%",
                                        height: "70%",
                                        borderRadius: 999,
                                        background: "rgba(0,0,0,0.22)",
                                        border: "1px solid rgba(255,255,255,0.14)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                        boxShadow:
                                            "0 40px 140px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                    }}
                                    animate={isStatic || reduced ? undefined : { scale: [1, 1.03, 1] }}
                                    transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                                />

                                {enableOrbit && !isStatic && !reduced ? (
                                    <motion.div
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                        }}
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                                    >
                                        {[0, 1, 2, 3, 4, 5].map((i) => {
                                            const angle = (i / 6) * Math.PI * 2
                                            const r = 44
                                            const x = 50 + Math.cos(angle) * r
                                            const y = 50 + Math.sin(angle) * r
                                            const c = i % 3 === 0 ? neonCyanUsed : i % 3 === 1 ? neonBlueUsed : neonPurpleUsed
                                            return (
                                                <div
                                                    key={i}
                                                    style={{
                                                        position: "absolute",
                                                        left: `${x}%`,
                                                        top: `${y}%`,
                                                        transform: "translate(-50%, -50%)",
                                                        width: 34,
                                                        height: 34,
                                                        borderRadius: 14,
                                                        background:
                                                            "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
                                                        border: "1px solid rgba(255,255,255,0.16)",
                                                        backdropFilter: "blur(12px)",
                                                        WebkitBackdropFilter: "blur(12px)",
                                                        boxShadow:
                                                            "0 20px 60px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 999,
                                                            background: c,
                                                            boxShadow: `0 0 0 6px rgba(0,255,240,0.10), 0 0 26px rgba(0,255,240,0.20)`,
                                                        }}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </motion.div>
                                ) : null}

                                {/* Floating geometric shapes */}
                                <motion.div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        pointerEvents: "none",
                                    }}
                                >
                                    {[
                                        { s: 80, x: "18%", y: "22%", c: neonBlueUsed, d: 0 },
                                        { s: 64, x: "78%", y: "26%", c: neonPurpleUsed, d: 0.5 },
                                        { s: 92, x: "70%", y: "76%", c: neonCyanUsed, d: 1.0 },
                                    ].map((sh, i) => (
                                        <motion.div
                                            key={i}
                                            style={{
                                                position: "absolute",
                                                left: sh.x,
                                                top: sh.y,
                                                width: sh.s,
                                                height: sh.s,
                                                borderRadius: 22,
                                                background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))`,
                                                border: "1px solid rgba(255,255,255,0.14)",
                                                boxShadow: `0 0 50px rgba(0,0,0,0.55), 0 0 40px ${sh.c}33`,
                                                backdropFilter: "blur(12px)",
                                                WebkitBackdropFilter: "blur(12px)",
                                                transform: "translate(-50%, -50%)",
                                            }}
                                            animate={
                                                isStatic || reduced
                                                    ? undefined
                                                    : {
                                                          y: [0, -10, 0],
                                                          rotate: [0, 6, 0],
                                                      }
                                            }
                                            transition={{
                                                duration: 4.6,
                                                delay: sh.d,
                                                repeat: Infinity,
                                                ease: "easeInOut",
                                            }}
                                        />
                                    ))}
                                </motion.div>

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: "18%",
                                        borderRadius: 999,
                                        border: "1px dashed rgba(255,255,255,0.14)",
                                        opacity: 0.6,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: "8%",
                                        borderRadius: 999,
                                        border: "1px solid rgba(255,255,255,0.10)",
                                        opacity: 0.65,
                                    }}
                                    aria-hidden="true"
                                />

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: "30%",
                                        borderRadius: 999,
                                        background:
                                            "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), rgba(255,255,255,0.02))",
                                        border: "1px solid rgba(255,255,255,0.14)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                    }}
                                    aria-hidden="true"
                                />
                            </motion.div>
                        </div>
                    </div>

                    <div
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: sectionGap,
                        }}
                    >
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "-10%",
                                top: "-10%",
                                width: "120%",
                                height: "120%",
                                pointerEvents: "none",
                                opacity: 0.35,
                                filter: "blur(28px)",
                                background:
                                    "radial-gradient(500px 240px at 20% 20%, rgba(0,255,240,0.18), transparent 60%), radial-gradient(600px 280px at 80% 35%, rgba(140,90,255,0.14), transparent 60%)",
                                transform:
                                    enableParallax && !isStatic ? undefined : "translate3d(0,0,0)",
                            }}
                        />

                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "-10%",
                                top: "-10%",
                                width: "120%",
                                height: "120%",
                                pointerEvents: "none",
                                opacity: 0.25,
                                filter: "blur(42px)",
                                background:
                                    "radial-gradient(680px 320px at 50% 70%, rgba(0,153,255,0.16), transparent 60%)",
                                y: enableParallax && !isStatic ? parallaxA : 0,
                            }}
                        />

                        <Section
                            id="services"
                            title={servicesTitle}
                            subtitle="Floating glassmorphism modules that react to your cursor."
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                            textColor={textColorUsed}
                            subtleTextColor={subtleTextColorUsed}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: gridCols,
                                    gap: 14,
                                }}
                            >
                                {services.map((item, idx) => (
                                    <div key={idx} style={{ minHeight: 180 }}>
                                        <InteractiveGlassCard
                                            item={item}
                                            accentA={neonBlueUsed}
                                            accentB={neonPurpleUsed}
                                            accentC={neonCyanUsed}
                                            glassTint={glassTintUsed}
                                            textColor={textColorUsed}
                                            subtleTextColor={subtleTextColorUsed}
                                            radius={cardRadius}
                                            borderWidth={cardBorderWidth}
                                            headingFont={headingFont}
                                            bodyFont={bodyFont}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section
                            id="projects"
                            title={projectsTitle}
                            subtitle="Cinematic projects with neon edges and liquid motion transitions."
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                            textColor={textColorUsed}
                            subtleTextColor={subtleTextColorUsed}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: 14,
                                }}
                            >
                                {projects.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        style={{
                                            position: "relative",
                                            minHeight: 220,
                                        }}
                                        whileHover={{ rotateZ: 0.6 }}
                                        transition={{ type: "spring", stiffness: 240, damping: 20 }}
                                    >
                                        <InteractiveGlassCard
                                            item={item}
                                            accentA={neonPurpleUsed}
                                            accentB={neonBlueUsed}
                                            accentC={neonCyanUsed}
                                            glassTint={glassTintUsed}
                                            textColor={textColorUsed}
                                            subtleTextColor={subtleTextColorUsed}
                                            radius={cardRadius}
                                            borderWidth={cardBorderWidth}
                                            headingFont={headingFont}
                                            bodyFont={bodyFont}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </Section>

                        <Section
                            id="testimonials"
                            title={testimonialsTitle}
                            subtitle="Voices from the future — premium workshops, elevated craft."
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                            textColor={textColorUsed}
                            subtleTextColor={subtleTextColorUsed}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                    gap: 14,
                                }}
                            >
                                {testimonials.map((t, idx) => (
                                    <motion.article
                                        key={idx}
                                        whileHover={{ y: -8, rotateX: 3, rotateY: -4 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                                        style={{
                                            position: "relative",
                                            padding: 20,
                                            borderRadius: 22,
                                            background:
                                                "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                                            border: "1px solid rgba(255,255,255,0.14)",
                                            boxShadow:
                                                "0 20px 70px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                            overflow: "hidden",
                                            transformStyle: "preserve-3d",
                                            backdropFilter: "blur(14px)",
                                            WebkitBackdropFilter: "blur(14px)",
                                        }}
                                    >
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                inset: -2,
                                                borderRadius: 24,
                                                background: `radial-gradient(240px 140px at 20% 20%, rgba(0,153,255,0.14), transparent 60%), radial-gradient(260px 160px at 85% 70%, rgba(140,90,255,0.12), transparent 60%)`,
                                                filter: "blur(18px)",
                                                opacity: 0.9,
                                                pointerEvents: "none",
                                            }}
                                        />

                                        <p
                                            style={{
                                                position: "relative",
                                                margin: 0,
                                                color: textColorUsed,
                                                ...bodyFont,
                                                fontSize: "15px",
                                                lineHeight: "1.5em",
                                            }}
                                        >
                                            “{t.quote}”
                                        </p>

                                        <div style={{ height: 14 }} />

                                        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
                                            <span
                                                aria-hidden="true"
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 999,
                                                    background: neonCyanUsed,
                                                    boxShadow: `0 0 0 6px rgba(0,255,240,0.10), 0 0 24px rgba(0,255,240,0.22)`,
                                                }}
                                            />
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                                <span
                                                    style={{
                                                        ...bodyFont,
                                                        color: textColorUsed,
                                                        fontSize: "14px",
                                                        letterSpacing: "-0.01em",
                                                    }}
                                                >
                                                    {t.name}
                                                </span>
                                                <span
                                                    style={{
                                                        ...bodyFont,
                                                        color: subtleTextColorUsed,
                                                        fontSize: "12px",
                                                        opacity: 0.9,
                                                    }}
                                                >
                                                    {t.role}
                                                </span>
                                            </div>
                                        </div>

                                        <motion.div
                                            aria-hidden="true"
                                            initial={{ opacity: 0, y: 10 }}
                                            whileHover={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35 }}
                                            style={{
                                                position: "absolute",
                                                right: 16,
                                                bottom: 16,
                                                width: 48,
                                                height: 48,
                                                borderRadius: 18,
                                                background: `linear-gradient(135deg, ${neonBlueUsed}33, ${neonPurpleUsed}33, ${neonCyanUsed}33)`,
                                                border: "1px solid rgba(255,255,255,0.14)",
                                                filter: "blur(0px)",
                                                boxShadow: `0 0 40px rgba(0,153,255,0.18)`,
                                            }}
                                        />
                                    </motion.article>
                                ))}
                            </div>
                        </Section>

                        <div ref={statsRef} />
                        <Section
                            id="stats"
                            title={statsTitle}
                            subtitle="Futuristic counters with elegant neon transitions."
                            headingFont={headingFont}
                            bodyFont={bodyFont}
                            textColor={textColorUsed}
                            subtleTextColor={subtleTextColorUsed}
                        >
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: 14,
                                }}
                            >
                                {stats.map((s, idx) => (
                                    <StatCounter
                                        key={idx}
                                        item={s}
                                        inView={!isStatic && statsInView}
                                        textColor={textColorUsed}
                                        subtleTextColor={subtleTextColorUsed}
                                        headingFont={headingFont}
                                        bodyFont={bodyFont}
                                        neonCyan={neonCyanUsed}
                                    />
                                ))}
                            </div>
                        </Section>

                        {(extraSections || []).map((sec, idx) => {
                            const baseId = toSectionId(sec?.id || `custom-${idx + 1}`)
                            const id = `extra-${baseId}-${idx}`
                            const contentNodes = Array.isArray(sec?.content)
                                ? sec?.content
                                : sec?.content
                                  ? [sec.content]
                                  : []
                            return (
                                <Section
                                    key={id}
                                    id={id}
                                    title={sec?.title || `Section ${idx + 1}`}
                                    subtitle={sec?.subtitle || ""}
                                    headingFont={headingFont}
                                    bodyFont={bodyFont}
                                    textColor={textColorUsed}
                                    subtleTextColor={subtleTextColorUsed}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            borderRadius: 22,
                                            background:
                                                "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            boxShadow:
                                                "0 20px 70px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.06)",
                                            overflow: "hidden",
                                            padding: 18,
                                            backdropFilter: "blur(14px)",
                                            WebkitBackdropFilter: "blur(14px)",
                                        }}
                                    >
                                        <div
                                            aria-hidden="true"
                                            style={{
                                                position: "absolute",
                                                inset: -2,
                                                borderRadius: 24,
                                                background: `radial-gradient(260px 140px at 20% 20%, ${neonCyanUsed}22, transparent 60%), radial-gradient(280px 160px at 85% 70%, ${neonPurpleUsed}1F, transparent 60%)`,
                                                filter: "blur(18px)",
                                                opacity: 0.9,
                                                pointerEvents: "none",
                                            }}
                                        />
                                        <div style={{ position: "relative" }}>
                                            {contentNodes.length ? (
                                                contentNodes.map((node, i) => (
                                                    <React.Fragment key={i}>{node}</React.Fragment>
                                                ))
                                            ) : (
                                                sec?.content || null
                                            )}
                                        </div>
                                    </div>
                                </Section>
                            )
                        })}

                        <footer
                            style={{
                                position: "relative",
                                padding: "28px 0 10px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 12,
                                borderTop: "1px solid rgba(255,255,255,0.10)",
                            }}
                        >
                            <span
                                style={{
                                    ...bodyFont,
                                    color: subtleTextColorUsed,
                                    fontSize: "13px",
                                    opacity: 0.9,
                                }}
                            >
                                Built as a single Framer component — dark cosmic glass, neon edges, alive motion.
                            </span>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <MagneticButton
                                    label="Back to top"
                                    kind="secondary"
                                    neonBlue={neonBlueUsed}
                                    neonPurple={neonPurpleUsed}
                                    neonCyan={neonCyanUsed}
                                    textColor={textColorUsed}
                                    subtleTextColor={subtleTextColorUsed}
                                    buttonFont={buttonFont}
                                    onClick={() => {
                                        if (typeof window === "undefined") return
                                        try {
                                            window.scrollTo({ top: 0, behavior: "smooth" })
                                        } catch {
                                            window.scrollTo(0, 0)
                                        }
                                    }}
                                />
                                <MagneticButton
                                    label="Start a workshop"
                                    kind="primary"
                                    neonBlue={neonBlueUsed}
                                    neonPurple={neonPurpleUsed}
                                    neonCyan={neonCyanUsed}
                                    textColor={textColorUsed}
                                    subtleTextColor={subtleTextColorUsed}
                                    buttonFont={buttonFont}
                                    onClick={() => smoothScrollTo("services")}
                                />
                            </div>
                        </footer>
                    </div>
                </header>

                {/* Responsive adjustment */}
                <style>{`
                    @media (max-width: 920px) {
                        .fw-hero-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .fw-nav {
                            width: 100%;
                            flex-wrap: nowrap !important;
                            overflow-x: auto;
                            -webkit-overflow-scrolling: touch;
                            padding-bottom: 4px;
                            scrollbar-width: none;
                        }
                        .fw-nav::-webkit-scrollbar {
                            display: none;
                        }
                        .fw-nav-btn {
                            flex: 0 0 auto;
                        }
                        .fw-hero-cta {
                            width: 100%;
                        }
                        .fw-hero-cta > button {
                            width: 100%;
                        }
                        .fw-hero-visual {
                            min-height: 240px !important;
                        }
                    }

                    @media (max-width: 520px) {
                        .fw-hero-grid {
                            gap: 14px !important;
                        }
                        .fw-nav-btn {
                            padding: 9px 10px !important;
                            font-size: 12px !important;
                        }
                        .fw-hero-visual {
                            padding: 14px !important;
                            min-height: 220px !important;
                        }
                    }

                    @media (hover: none) and (pointer: coarse) {
                        .fw-nav-btn {
                            backdrop-filter: none !important;
                            -webkit-backdrop-filter: none !important;
                        }
                    }
                `}</style>
            </div>

            {/* Foreground cinematic vignette */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                        "radial-gradient(1200px 700px at 50% 20%, transparent 35%, rgba(0,0,0,0.55) 100%)",
                    mixBlendMode: "multiply",
                    opacity: 0.7,
                }}
            />

            {/* Soft scanline */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${neonCyanUsed}66, transparent)`,
                    filter: "blur(1px)",
                    opacity: 0.35,
                    pointerEvents: "none",
                    y: enableParallax && !isStatic ? parallaxB : 0,
                }}
                animate={isStatic || reduced ? undefined : { opacity: [0.12, 0.5, 0.12] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    )
}

addPropertyControls(FuturisticWorkshopSite, {
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["custom", "darkNeon", "lightNeon", "deepPurple", "cyberCyan"],
        optionTitles: ["Custom", "Dark Neon", "Light Neon", "Deep Purple", "Cyber Cyan"],
        defaultValue: "darkNeon",
        displaySegmentedControl: true,
    },
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Futuristic Workshop Experiences",
    },
    subhead: {
        type: ControlType.String,
        title: "Subhead",
        defaultValue:
            "A dark cosmic workshop site with living glassmorphism, neon borders, particle atmospheres, and cursor-reactive cards.",
        displayTextArea: true,
    },
    primaryCta: {
        type: ControlType.String,
        title: "Primary CTA",
        defaultValue: "Explore Services",
    },
    secondaryCta: {
        type: ControlType.String,
        title: "Secondary CTA",
        defaultValue: "View Projects",
    },
    showSecondaryCta: {
        type: ControlType.Boolean,
        title: "Show 2nd CTA",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    servicesTitle: {
        type: ControlType.String,
        title: "Services Title",
        defaultValue: "Services",
    },
    projectsTitle: {
        type: ControlType.String,
        title: "Projects Title",
        defaultValue: "Projects",
    },
    testimonialsTitle: {
        type: ControlType.String,
        title: "Testimonials Title",
        defaultValue: "Testimonials",
    },
    statsTitle: {
        type: ControlType.String,
        title: "Stats Title",
        defaultValue: "Stats",
    },

    services: {
        type: ControlType.Array,
        title: "Services",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Neon Prototyping" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Cursor-reactive interactions, magnetic CTAs, and fluid motion systems.",
                    displayTextArea: true,
                },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Interaction" },
            },
        },
        defaultValue: [
            {
                title: "Neon Prototyping",
                description: "Cursor-reactive interactions, magnetic CTAs, and fluid motion systems.",
                tag: "Interaction",
            },
            {
                title: "Cosmic Branding",
                description: "Ultra-modern typography, cinematic lighting, and glass UI kits.",
                tag: "Design",
            },
            {
                title: "Workshop Sprints",
                description: "High-energy sessions that ship premium prototypes fast — with depth and motion.",
                tag: "Strategy",
            },
        ],
    },

    projects: {
        type: ControlType.Array,
        title: "Projects",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Orbital Dashboard" },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Glass panels, animated gradients, and neon edge lighting.",
                    displayTextArea: true,
                },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "UI System" },
            },
        },
        defaultValue: [
            {
                title: "Orbital Dashboard",
                description: "Glass panels, animated gradients, and neon edge lighting.",
                tag: "UI System",
            },
            {
                title: "Particle Landing",
                description: "Cinematic hero with orbiting icons and smooth scroll transitions.",
                tag: "Marketing",
            },
            {
                title: "Liquid Cards",
                description: "Interactive cards that tilt in 3D and reveal hidden glowing elements.",
                tag: "Motion",
            },
        ],
    },

    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "We shipped an immersive prototype in a single sprint — it felt alive.",
                    displayTextArea: true,
                },
                name: { type: ControlType.String, title: "Name", defaultValue: "Astra V." },
                role: { type: ControlType.String, title: "Role", defaultValue: "Product Lead" },
            },
        },
        defaultValue: [
            {
                quote: "We shipped an immersive prototype in a single sprint — it felt alive.",
                name: "Astra V.",
                role: "Product Lead",
            },
            {
                quote: "The neon micro-interactions and cinematic depth made our brand unforgettable.",
                name: "Kairo N.",
                role: "Creative Director",
            },
            {
                quote: "Magnetic buttons + cursor-reactive cards = the most premium workshop site we’ve seen.",
                name: "Nova R.",
                role: "Founder",
            },
        ],
    },

    stats: {
        type: ControlType.Array,
        title: "Stats",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Workshops" },
                value: { type: ControlType.Number, title: "Value", defaultValue: 42, min: 0, max: 9999, step: 1 },
                suffix: { type: ControlType.String, title: "Suffix", defaultValue: "+" },
            },
        },
        defaultValue: [
            { label: "Workshops launched", value: 48, suffix: "+" },
            { label: "Prototype velocity", value: 3, suffix: "x" },
            { label: "Avg. satisfaction", value: 97, suffix: "%" },
            { label: "Global teams", value: 12, suffix: "" },
        ],
    },

    extraSections: {
        type: ControlType.Array,
        title: "Extra Sections",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "ID", defaultValue: "custom" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Custom Section" },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Add any extra workshop content here — agenda, pricing, FAQ, or resources.",
                    displayTextArea: true,
                },
                showInNav: {
                    type: ControlType.Boolean,
                    title: "Show in Nav",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                },
                content: {
                    title: "Content",
                    type: ControlType.Array,
                    maxCount: 5,
                    control: {
                        type: ControlType.ComponentInstance,
                    },
                    defaultValue: [null],
                },
            },
        },
        defaultValue: [
            {
                id: "custom",
                title: "Extra Section",
                subtitle: "Add any extra workshop content here — agenda, pricing, FAQ, or resources.",
                showInNav: true,
            },
        ],
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#050510",
        hidden: ({ theme }) => theme !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
        hidden: ({ theme }) => theme !== "custom",
    },
    subtleTextColor: {
        type: ControlType.Color,
        title: "Subtle Text",
        defaultValue: "#CCCCCC",
        hidden: ({ theme }) => theme !== "custom",
    },

    neonBlue: {
        type: ControlType.Color,
        title: "Neon Blue",
        defaultValue: "#0099FF",
        hidden: ({ theme }) => theme !== "custom",
    },
    neonPurple: {
        type: ControlType.Color,
        title: "Neon Purple",
        defaultValue: "#8855FF",
        hidden: ({ theme }) => theme !== "custom",
    },
    neonCyan: {
        type: ControlType.Color,
        title: "Neon Cyan",
        defaultValue: "#00FFF0",
        hidden: ({ theme }) => theme !== "custom",
    },

    glassTint: {
        type: ControlType.Color,
        title: "Glass Tint",
        defaultValue: "rgba(255,255,255,0.02)",
        hidden: ({ theme }) => theme !== "custom",
    },

    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },

    enableParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableOrbit: {
        type: ControlType.Boolean,
        title: "Orbit",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    enableParallax: {
        type: ControlType.Boolean,
        title: "Parallax",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 700,
        max: 1600,
        step: 10,
        unit: "px",
    },
    sectionGap: {
        type: ControlType.Number,
        title: "Section Gap",
        defaultValue: 44,
        min: 18,
        max: 100,
        step: 2,
        unit: "px",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 22,
        min: 8,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.5,
        unit: "px",
    },
})
