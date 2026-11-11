// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useRef, useState } from "react"

// ─── Helper ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    return [
        parseInt(f.slice(0, 2), 16),
        parseInt(f.slice(2, 4), 16),
        parseInt(f.slice(4, 6), 16),
    ]
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const DEMO_THEMES = [
    { name: "Deep Space", bg: "#050c1a" },
    { name: "Void", bg: "#0a0614" },
    { name: "Obsidian", bg: "#080808" },
]
const DEMO_INTERVAL = 4000

// ─── Ring Definitions ─────────────────────────────────────────────────────────

const RINGS = [
    { rp: 0.1, n: 18, dir: 1 as const, spd: 0.0008, ds: 1.8, op: 0.82 },
    { rp: 0.2, n: 34, dir: -1 as const, spd: 0.00055, ds: 1.5, op: 0.6 },
    { rp: 0.32, n: 54, dir: 1 as const, spd: 0.00038, ds: 1.2, op: 0.42 },
    { rp: 0.46, n: 74, dir: -1 as const, spd: 0.00026, ds: 1.0, op: 0.28 },
    { rp: 0.61, n: 98, dir: 1 as const, spd: 0.00017, ds: 0.8, op: 0.18 },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    colorPreset: string
    customColor: string
    lightColor: string
    lightWidth: number
    pulseEnabled: boolean
    pulseSpeed: number
    parallaxStrength: number
    noiseStrength: number
    rotationSpeed: number
    dotBrightness: number
    starCount: number
    demoMode: boolean
    showThemeSelector: boolean
    style?: React.CSSProperties
}

export default function CosmicBackground(props: Props) {
    const {
        colorPreset = "Deep Space",
        customColor = "#050c1a",
        lightColor = "#bed7ff",
        lightWidth = 54,
        pulseEnabled = true,
        pulseSpeed = 1.0,
        parallaxStrength = 30,
        noiseStrength = 0.04,
        rotationSpeed = 0.4,
        dotBrightness = 0.4,
        starCount = 330,
        demoMode = false,
        showThemeSelector = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const initIdx = DEMO_THEMES.findIndex((t) => t.name === colorPreset)
    const [activeIdx, setActiveIdx] = useState(initIdx >= 0 ? initIdx : 0)
    const activeIdxRef = useRef(activeIdx)
    const userPickedRef = useRef(false)
    useEffect(() => {
        activeIdxRef.current = activeIdx
    }, [activeIdx])
    useEffect(() => {
        userPickedRef.current = false
    }, [demoMode])
    useEffect(() => {
        const idx = DEMO_THEMES.findIndex((t) => t.name === colorPreset)
        if (idx >= 0) {
            setActiveIdx(idx)
            userPickedRef.current = false
        }
    }, [colorPreset])

    const backgroundColor =
        demoMode || showThemeSelector
            ? DEMO_THEMES[activeIdx].bg
            : colorPreset === "Custom"
              ? customColor
              : (DEMO_THEMES.find((t) => t.name === colorPreset)?.bg ??
                DEMO_THEMES[0].bg)

    const [lr, lg, lb] = hexToRgb(lightColor)

    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const coneRef = useRef<HTMLDivElement>(null)
    const spotRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number>()
    const mouseRef = useRef({ x: 0, y: 0 })
    const smoothRef = useRef({ x: 0, y: 0 })

    const filterId = useRef(
        `cosmic-noise-${Math.random().toString(36).slice(2, 9)}`
    ).current

    // ── Mouse tracking ──────────────────────────────────────────────────────
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onMove = (e: MouseEvent) => {
            const r = el.getBoundingClientRect()
            mouseRef.current = {
                x: ((e.clientX - r.left) / r.width - 0.5) * 2,
                y: ((e.clientY - r.top) / r.height - 0.5) * 2,
            }
        }
        const onLeave = () => {
            mouseRef.current = { x: 0, y: 0 }
        }
        el.addEventListener("mousemove", onMove)
        el.addEventListener("mouseleave", onLeave)
        return () => {
            el.removeEventListener("mousemove", onMove)
            el.removeEventListener("mouseleave", onLeave)
        }
    }, [])

    // ── Main RAF loop ───────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        let W = 0,
            H = 0
        let stars: { x: number; y: number; r: number; a: number }[] = []
        const startTime = performance.now()
        let pausedAt = 0
        let pausedOffset = 0

        const setup = () => {
            const dpr = window.devicePixelRatio || 1
            const rect = canvas.getBoundingClientRect()
            W = rect.width
            H = rect.height
            canvas.width = W * dpr
            canvas.height = H * dpr
            ctx.scale(dpr, dpr)
            stars = Array.from({ length: starCount }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.1 + 0.2,
                a: Math.random() * 0.26 + 0.04,
            }))
        }
        setup()
        const ro = new ResizeObserver(setup)
        ro.observe(canvas)

        if (isStatic) return () => ro.disconnect()

        const draw = (now: number) => {
            const t = now - startTime - pausedOffset
            const raw = mouseRef.current

            // ── Demo cycling ───────────────────────────────────────────────
            if (demoMode && !userPickedRef.current) {
                const ci = Math.floor(t / DEMO_INTERVAL) % DEMO_THEMES.length
                if (ci !== activeIdxRef.current) {
                    activeIdxRef.current = ci
                    setActiveIdx(ci)
                }
            }

            // ── Parallax lerp ──────────────────────────────────────────────
            const sm = smoothRef.current
            sm.x += (raw.x - sm.x) * 0.04
            sm.y += (raw.y - sm.y) * 0.04
            const ox = sm.x * parallaxStrength
            const oy = sm.y * parallaxStrength
            const cx = W / 2 + ox,
                cy = H / 2 + oy
            const base = Math.min(W, H) * 0.88

            ctx.clearRect(0, 0, W, H)

            // ── Star field ─────────────────────────────────────────────────
            for (const s of stars) {
                ctx.beginPath()
                ctx.arc(s.x + ox * 0.3, s.y + oy * 0.3, s.r, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255,255,255,${s.a * dotBrightness * 1.6})`
                ctx.fill()
            }

            // ── Rotating rings ─────────────────────────────────────────────
            for (const ring of RINGS) {
                const radius = ring.rp * base
                const angle = t * ring.spd * rotationSpeed * ring.dir
                for (let i = 0; i < ring.n; i++) {
                    const a = angle + (i / ring.n) * Math.PI * 2
                    ctx.beginPath()
                    ctx.arc(
                        cx + Math.cos(a) * radius,
                        cy + Math.sin(a) * radius,
                        ring.ds,
                        0,
                        Math.PI * 2
                    )
                    ctx.fillStyle = `rgba(255,255,255,${ring.op * dotBrightness})`
                    ctx.fill()
                }
            }

            // ── Breathing light ────────────────────────────────────────────
            const pulse = pulseEnabled
                ? 0.75 + 0.25 * Math.sin(t * pulseSpeed * 0.0008)
                : 1
            if (coneRef.current) coneRef.current.style.opacity = String(pulse)
            if (spotRef.current) spotRef.current.style.opacity = String(pulse)

            rafRef.current = requestAnimationFrame(draw)
        }

        // ── IntersectionObserver: pause when off-screen ────────────────────
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    if (pausedAt) {
                        pausedOffset += performance.now() - pausedAt
                        pausedAt = 0
                    }
                    if (!rafRef.current)
                        rafRef.current = requestAnimationFrame(draw)
                } else {
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current)
                        rafRef.current = undefined
                    }
                    pausedAt = performance.now()
                }
            },
            { threshold: 0 }
        )
        io.observe(canvas)

        return () => {
            ro.disconnect()
            io.disconnect()
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [
        isStatic,
        demoMode,
        rotationSpeed,
        dotBrightness,
        starCount,
        parallaxStrength,
        pulseEnabled,
        pulseSpeed,
    ])

    // ── Static preview ──────────────────────────────────────────────────────
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontFamily: "sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(18px, 4vw, 48px)",
                        letterSpacing: "0.18em",
                        color: "rgba(255,255,255,0.18)",
                        textTransform: "uppercase",
                        userSelect: "none",
                    }}
                >
                    Cosmic Background
                </span>
            </div>
        )
    }

    const coneHalfAngle = lightWidth / 2
    const coneStart = (50 - coneHalfAngle) / 100
    const coneEnd = (50 + coneHalfAngle) / 100

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                transition:
                    demoMode || showThemeSelector
                        ? "background-color 1.2s ease"
                        : undefined,
            }}
        >
            {/* ── 2D canvas: dot rings + star field ───────────────────────── */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />

            {/* ── Cone light ───────────────────────────────────────────────── */}
            <div
                ref={coneRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "110%",
                    height: "65%",
                    background: `conic-gradient(from 270deg at 50% 0%, transparent ${(coneStart * 100).toFixed(1)}%, rgba(${lr},${lg},${lb},0.11) 50%, transparent ${(coneEnd * 100).toFixed(1)}%)`,
                    pointerEvents: "none",
                }}
            />

            {/* ── Spotlight core ───────────────────────────────────────────── */}
            <div
                ref={spotRef}
                style={{
                    position: "absolute",
                    top: -100,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 560,
                    height: 400,
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center, rgba(${lr},${lg},${lb},0.22) 0%, rgba(${lr},${lg},${lb},0.06) 40%, transparent 68%)`,
                    pointerEvents: "none",
                }}
            />

            {/* ── Film grain ───────────────────────────────────────────────── */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    opacity: noiseStrength,
                    mixBlendMode: "screen",
                }}
                aria-hidden="true"
            >
                <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.72"
                        numOctaves="4"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect width="100%" height="100%" filter={`url(#${filterId})`} />
            </svg>

            {/* ── Theme selector buttons ───────────────────────────────────── */}
            {(showThemeSelector || demoMode) && (
                <>
                    <style>{`.cosmic-theme-btn-${filterId}:focus-visible{outline:2px solid rgba(255,255,255,0.55);outline-offset:3px;}`}</style>
                    <div
                        role="group"
                        aria-label="Color theme"
                        style={{
                            position: "absolute",
                            top: 32,
                            left: 0,
                            right: 0,
                            display: "flex",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        {DEMO_THEMES.map((theme, i) => {
                            const isActive = i === activeIdx
                            return (
                                <button
                                    key={theme.name}
                                    className={`cosmic-theme-btn-${filterId}`}
                                    aria-pressed={isActive}
                                    onClick={() => {
                                        userPickedRef.current = true
                                        setActiveIdx(i)
                                        activeIdxRef.current = i
                                    }}
                                    style={{
                                        padding: "7px 20px",
                                        borderRadius: 100,
                                        border: `1px solid ${isActive ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.10)"}`,
                                        backgroundColor: isActive
                                            ? "rgba(255,255,255,0.12)"
                                            : "transparent",
                                        color: isActive
                                            ? "rgba(255,255,255,0.95)"
                                            : "rgba(255,255,255,0.35)",
                                        fontSize: 12,
                                        fontFamily: "sans-serif",
                                        fontWeight: 500,
                                        letterSpacing: "0.12em",
                                        cursor: "pointer",
                                        transition:
                                            "background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease",
                                        outline: "none",
                                        userSelect: "none",
                                        backdropFilter: "blur(8px)",
                                        WebkitBackdropFilter: "blur(8px)",
                                    }}
                                >
                                    {theme.name}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(CosmicBackground, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
    },
    showThemeSelector: {
        type: ControlType.Boolean,
        title: "Theme Selector",
        defaultValue: false,
        hidden: (props: Partial<Props>) => !!props.demoMode,
    },
    colorPreset: {
        type: ControlType.Enum,
        title: "Color Theme",
        options: ["Deep Space", "Void", "Obsidian", "Custom"],
        optionTitles: [
            "Deep Space — #050c1a",
            "Void — #0a0614",
            "Obsidian — #080808",
            "Custom",
        ],
        defaultValue: "Deep Space",
        hidden: (props: Partial<Props>) => !!props.demoMode,
    },
    customColor: {
        type: ControlType.Color,
        title: "Custom Color",
        defaultValue: "#050c1a",
        hidden: (props: Partial<Props>) =>
            !!props.demoMode || props.colorPreset !== "Custom",
    },
    lightColor: {
        type: ControlType.Color,
        title: "Light Color",
        defaultValue: "#bed7ff",
    },
    lightWidth: {
        type: ControlType.Number,
        title: "Light Width",
        min: 10,
        max: 80,
        step: 1,
        defaultValue: 54,
        displayStepper: true,
    },
    pulseEnabled: {
        type: ControlType.Boolean,
        title: "Breathing Light",
        defaultValue: true,
    },
    pulseSpeed: {
        type: ControlType.Number,
        title: "Pulse Speed",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.0,
        displayStepper: true,
        hidden: (props: Partial<Props>) => !props.pulseEnabled,
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Strength",
        min: 0,
        max: 80,
        step: 5,
        defaultValue: 30,
        displayStepper: true,
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Rotation Speed",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.4,
        displayStepper: true,
    },
    dotBrightness: {
        type: ControlType.Number,
        title: "Dot Brightness",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
        displayStepper: true,
    },
    starCount: {
        type: ControlType.Number,
        title: "Star Count",
        min: 50,
        max: 600,
        step: 10,
        defaultValue: 330,
        displayStepper: true,
    },
    noiseStrength: {
        type: ControlType.Number,
        title: "Film Grain",
        min: 0,
        max: 0.4,
        step: 0.01,
        defaultValue: 0.04,
        displayStepper: true,
    },
})
