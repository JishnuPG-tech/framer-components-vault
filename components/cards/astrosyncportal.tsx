// User instructions: Create "AstroSync Portal" — an elite futuristic, fully interactive sci‑fi gateway with synchronized animations (rotating orbit layers, pulsing energy waves, holographic panels, cursor‑bent light trails, depth‑shifting UI modules). Rewritten from scratch to fix previous type errors.

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
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion"

type FontProps = any

type Mode = "calm" | "active" | "hyper"

type PanelDensity = "minimal" | "dense"

interface AstroSyncPortalProps {
    title: string
    subtitle: string

    mode: Mode
    panelDensity: PanelDensity

    useColorPreset: boolean
    colorPreset: "Nebula" | "Ion" | "Solar" | "Monochrome"

    backgroundColor: string
    textColor: string
    accentColor: string
    glowColor: string

    titleFont: FontProps
    bodyFont: FontProps

    speed: number
    ringCount: number
    particleCount: number

    showPanels: boolean
    showParticles: boolean
    showCursorTrails: boolean

    borderRadius: string
    style?: React.CSSProperties
}

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}

function withAlpha(hexOrCss: string, alpha: number) {
    const a = clamp01(alpha)
    const s = String(hexOrCss || "")

    if (s.startsWith("rgba(")) return s.replace(/,\s*([01]?\.?\d*)\s*\)$/, `, ${a})`)
    if (s.startsWith("hsla(")) return s.replace(/,\s*([01]?\.?\d*)\s*\)$/, `, ${a})`)
    if (s.startsWith("rgb(")) return s.replace(/^rgb\(/, "rgba(").replace(/\)$/, `, ${a})`)
    if (s.startsWith("hsl(")) return s.replace(/^hsl\(/, "hsla(").replace(/\)$/, `, ${a})`)

    if (s[0] === "#") {
        let r = 0,
            g = 0,
            b = 0
        if (s.length === 4) {
            r = parseInt(s[1] + s[1], 16)
            g = parseInt(s[2] + s[2], 16)
            b = parseInt(s[3] + s[3], 16)
        } else if (s.length === 7) {
            r = parseInt(s.slice(1, 3), 16)
            g = parseInt(s.slice(3, 5), 16)
            b = parseInt(s.slice(5, 7), 16)
        } else {
            return s
        }
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }

    return s
}

function mulberry32(seed: number) {
    let t = seed >>> 0
    return function () {
        t += 0x6d2b79f5
        let x = t
        x = Math.imul(x ^ (x >>> 15), x | 1)
        x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296
    }
}

function useCursorField(ref: React.RefObject<HTMLElement>, enabled: boolean) {
    const x = useMotionValue(0.5)
    const y = useMotionValue(0.5)
    const a = useMotionValue(0) // activity 0..1

    React.useEffect(() => {
        if (!enabled) return
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el) return

        let raf = 0
        const onMove = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect()
            if (rect.width <= 0 || rect.height <= 0) return
            const nx = clamp01((e.clientX - rect.left) / rect.width)
            const ny = clamp01((e.clientY - rect.top) / rect.height)

            cancelAnimationFrame(raf)
            raf = window.requestAnimationFrame(() => {
                x.set(nx)
                y.set(ny)
                a.set(1)
            })
        }

        const onLeave = () => {
            cancelAnimationFrame(raf)
            raf = window.requestAnimationFrame(() => {
                x.set(0.5)
                y.set(0.5)
                a.set(0)
            })
        }

        el.addEventListener("pointermove", onMove)
        el.addEventListener("pointerleave", onLeave)
        return () => {
            cancelAnimationFrame(raf)
            el.removeEventListener("pointermove", onMove)
            el.removeEventListener("pointerleave", onLeave)
        }
    }, [enabled, ref, x, y, a])

    return { x, y, a }
}

/**
 * AstroSync Portal
 *
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AstroSyncPortal(props: AstroSyncPortalProps) {
    const {
        title,
        subtitle,
        mode,
        panelDensity,
        useColorPreset,
        colorPreset,
        backgroundColor,
        textColor,
        accentColor,
        glowColor,
        titleFont,
        bodyFont,
        speed,
        ringCount,
        particleCount,
        showPanels,
        showParticles,
        showCursorTrails,
        borderRadius,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion()

    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.25 })

    const allowMotion = !isStatic && !reduceMotion && inView

    const field = useCursorField(rootRef, allowMotion && showCursorTrails)
    const sx = useSpring(field.x, { stiffness: 260, damping: 28, mass: 0.8 })
    const sy = useSpring(field.y, { stiffness: 260, damping: 28, mass: 0.8 })
    const sa = useSpring(field.a, { stiffness: 220, damping: 30, mass: 0.9 })

    const modeParams = React.useMemo(() => {
        const s = Math.max(0.25, speed)
        if (mode === "hyper") {
            return {
                orbit: 10 / s,
                ring: 14 / s,
                wave: 2.4 / s,
                panel: 2.6 / s,
                trailCount: 22,
                particleDrift: 1.55,
            }
        }
        if (mode === "active") {
            return {
                orbit: 16 / s,
                ring: 20 / s,
                wave: 3.0 / s,
                panel: 3.0 / s,
                trailCount: 16,
                particleDrift: 1.25,
            }
        }
        return {
            orbit: 22 / s,
            ring: 28 / s,
            wave: 3.8 / s,
            panel: 3.6 / s,
            trailCount: 12,
            particleDrift: 1.0,
        }
    }, [mode, speed])

    const particles = React.useMemo(() => {
        const count = Math.max(1, Math.min(240, Math.round(particleCount)))
        const rnd = mulberry32(1337)
        return new Array(count).fill(0).map((_, i) => {
            const a = rnd() * Math.PI * 2
            const r = lerp(0.16, 0.55, Math.pow(rnd(), 0.65))
            const z = lerp(-1, 1, rnd())
            const size = lerp(1.1, 2.8, rnd())
            const drift = lerp(0.9, 1.4, rnd())
            const delay = rnd() * 2.2
            const tint = rnd() > 0.55 ? "glow" : "accent"
            return { i, a, r, z, size, drift, delay, tint }
        })
    }, [particleCount])

    const rings = React.useMemo(() => {
        const count = Math.max(2, Math.min(8, Math.round(ringCount)))
        return new Array(count).fill(0).map((_, i) => ({ i }))
    }, [ringCount])

    const panels = React.useMemo(() => {
        const rnd = mulberry32(42)
        const count = panelDensity === "dense" ? 7 : 4
        return new Array(count).fill(0).map((_, i) => {
            const side = i % 2 === 0 ? -1 : 1
            const y = lerp(0.16, 0.82, rnd())
            const w = lerp(0.18, 0.28, rnd())
            const h = lerp(0.09, 0.16, rnd())
            const depth = lerp(-1, 1, rnd())
            const delay = rnd() * 1.3
            return { i, side, y, w, h, depth, delay }
        })
    }, [panelDensity])

    const presetColors = React.useMemo(() => {
        if (!useColorPreset) return null

        if (colorPreset === "Ion") {
            return {
                backgroundColor: "#05070D",
                textColor: "#EAF2FF",
                accentColor: "#00D1FF",
                glowColor: "#6A5CFF",
            }
        }

        if (colorPreset === "Solar") {
            return {
                backgroundColor: "#07060A",
                textColor: "#FFF3E8",
                accentColor: "#FF8A00",
                glowColor: "#FF2D7D",
            }
        }

        if (colorPreset === "Monochrome") {
            return {
                backgroundColor: "#06070A",
                textColor: "#F5F7FF",
                accentColor: "#FFFFFF",
                glowColor: "#A7B0C2",
            }
        }

        // Nebula
        return {
            backgroundColor: "#05070D",
            textColor: "#EAF2FF",
            accentColor: "#6A5CFF",
            glowColor: "#00D1FF",
        }
    }, [colorPreset, useColorPreset])

    const effectiveColors = React.useMemo(() => {
        return {
            backgroundColor: presetColors?.backgroundColor ?? backgroundColor,
            textColor: presetColors?.textColor ?? textColor,
            accentColor: presetColors?.accentColor ?? accentColor,
            glowColor: presetColors?.glowColor ?? glowColor,
        }
    }, [accentColor, backgroundColor, glowColor, presetColors, textColor])

    const sceneBg = React.useMemo(() => {
        return {
            background:
                `radial-gradient(800px 560px at 50% 48%, ${withAlpha(effectiveColors.glowColor, 0.18)} 0%, ${withAlpha(
                    effectiveColors.glowColor,
                    0,
                )} 60%),` +
                `radial-gradient(900px 620px at 50% 75%, ${withAlpha(effectiveColors.accentColor, 0.14)} 0%, ${withAlpha(
                    effectiveColors.accentColor,
                    0,
                )} 58%),` +
                `linear-gradient(180deg, ${withAlpha(effectiveColors.backgroundColor, 0.0)} 0%, ${withAlpha("#000000", 0.62)} 100%),` +
                `${effectiveColors.backgroundColor}`,
        } as React.CSSProperties
    }, [effectiveColors])

    const glass = React.useMemo(() => {
        return {
            border: `1px solid ${withAlpha(effectiveColors.glowColor, 0.22)}`,
            background: `linear-gradient(180deg, ${withAlpha(effectiveColors.backgroundColor, 0.16)} 0%, ${withAlpha(
                effectiveColors.backgroundColor,
                0.05,
            )} 100%)`,
            boxShadow: `0 30px 80px ${withAlpha("#000000", 0.25)}`,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
        } as React.CSSProperties
    }, [effectiveColors])

    const tiltX = useTransform(sy, (v) => `${(0.5 - v) * 10}deg`)
    const tiltY = useTransform(sx, (v) => `${(v - 0.5) * 12}deg`)

    const cursorFxOpacity = allowMotion && showCursorTrails ? 1 : 0

    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    return (
        <section
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                color: effectiveColors.textColor,
                ...(isFixedWidth || isFixedHeight ? null : { minWidth: 360, minHeight: 320 }),
                ...sceneBg,
            }}
            aria-label="AstroSync Portal interactive futuristic gateway"
        >
            {/* Subtle grid */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -2,
                    backgroundImage:
                        `linear-gradient(${withAlpha(effectiveColors.textColor, 0.07)} 1px, transparent 1px),` +
                        `linear-gradient(90deg, ${withAlpha(effectiveColors.textColor, 0.05)} 1px, transparent 1px)`,
                    backgroundSize: "52px 52px",
                    maskImage: "radial-gradient(circle at 50% 55%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)",
                    opacity: 0.55,
                    pointerEvents: "none",
                }}
            />

            {/* Cursor-bent trails */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: cursorFxOpacity,
                    filter: `drop-shadow(0 0 18px ${withAlpha(effectiveColors.glowColor, 0.35)})`,
                }}
            >
                <CursorTrails
                    enabled={allowMotion && showCursorTrails}
                    sx={sx}
                    sy={sy}
                    sa={sa}
                    accentColor={effectiveColors.accentColor}
                    glowColor={effectiveColors.glowColor}
                    trailCount={modeParams.trailCount}
                />
            </motion.div>

            {/* Portal core */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "68%",
                    height: "92%",
                    maxWidth: 560,
                    maxHeight: 560,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 999,
                        transformStyle: "preserve-3d",
                        perspective: 900,
                        rotateX: tiltX,
                        rotateY: tiltY,
                        filter: `drop-shadow(0 0 50px ${withAlpha(effectiveColors.glowColor, 0.22)})`,
                    }}
                >
                    <PortalCore
                        allowMotion={allowMotion}
                        orbitDuration={modeParams.orbit}
                        ringDuration={modeParams.ring}
                        waveDuration={modeParams.wave}
                        rings={rings}
                        accentColor={effectiveColors.accentColor}
                        glowColor={effectiveColors.glowColor}
                        textColor={effectiveColors.textColor}
                        activity={sa}
                    />
                </motion.div>
            </div>

            {/* Holo panels */}
            {showPanels && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {panels.map((p) => (
                        <HoloPanel
                            key={p.i}
                            allowMotion={allowMotion}
                            glass={glass}
                            accentColor={effectiveColors.accentColor}
                            glowColor={effectiveColors.glowColor}
                            textColor={effectiveColors.textColor}
                            sx={sx}
                            sy={sy}
                            activity={sa}
                            panelDuration={modeParams.panel}
                            {...p}
                        />
                    ))}
                </div>
            )}

            {/* Energy particles */}
            {showParticles && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    {particles.map((p) => (
                        <EnergyParticle
                            key={p.i}
                            allowMotion={allowMotion}
                            a={p.a}
                            r={p.r}
                            z={p.z}
                            size={p.size}
                            drift={p.drift * modeParams.particleDrift}
                            delay={p.delay}
                            color={p.tint === "glow" ? effectiveColors.glowColor : effectiveColors.accentColor}
                        />
                    ))}
                </div>
            )}

            {/* Foreground copy */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: 28,
                    pointerEvents: "none",
                }}
            >
                <div style={{ maxWidth: 520 }}>
                    <div
                        style={{
                            ...titleFont,
                            color: effectiveColors.textColor,
                            letterSpacing: titleFont?.letterSpacing ?? "-0.04em",
                            lineHeight: titleFont?.lineHeight ?? "1.05em",
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            marginTop: 10,
                            ...bodyFont,
                            color: withAlpha(effectiveColors.textColor, 0.8),
                            maxWidth: 520,
                        }}
                    >
                        {subtitle}
                    </div>
                </div>

                <div
                    style={{
                        ...glass,
                        borderRadius: 14,
                        padding: "12px 14px",
                        minWidth: "max-content",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        opacity: 0.92,
                    }}
                >
                    <StatusPill
                        label={mode.toUpperCase()}
                        color={effectiveColors.accentColor}
                        textColor={effectiveColors.textColor}
                        bodyFont={bodyFont}
                    />
                    <StatusPill
                        label={allowMotion ? "SYNC" : "STATIC"}
                        color={allowMotion ? effectiveColors.glowColor : withAlpha(effectiveColors.textColor, 0.35)}
                        textColor={effectiveColors.textColor}
                        bodyFont={bodyFont}
                    />
                </div>
            </div>

            {/* Edge vignette */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                        `radial-gradient(120% 100% at 50% 40%, ${withAlpha("#000000", 0)} 0%, ${withAlpha(
                            "#000000",
                            0.55,
                        )} 75%, ${withAlpha("#000000", 0.85)} 100%)`,
                    mixBlendMode: "multiply",
                }}
            />
        </section>
    )
}

function StatusPill(props: { label: string; color: string; textColor: string; bodyFont: any }) {
    const { label, color, textColor, bodyFont } = props
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: "max-content",
                ...bodyFont,
                fontSize: bodyFont?.fontSize ?? "12px",
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: color,
                    boxShadow: `0 0 18px ${withAlpha(color, 0.55)}`,
                }}
            />
            <span style={{ color: withAlpha(textColor, 0.92) }}>{label}</span>
        </div>
    )
}

function PortalCore(props: {
    allowMotion: boolean
    orbitDuration: number
    ringDuration: number
    waveDuration: number
    rings: Array<{ i: number }>
    accentColor: string
    glowColor: string
    textColor: string
    activity: any
}) {
    const { allowMotion, orbitDuration, ringDuration, waveDuration, rings, accentColor, glowColor, textColor, activity } =
        props

    const activityBoost = useTransform(activity, (v: number) => lerp(1, 1.28, v))

    return (
        <motion.div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: 999,
                transformStyle: "preserve-3d",
            }}
        >
            {/* Outer rotating shell */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "3%",
                    borderRadius: 999,
                    border: `1px solid ${withAlpha(glowColor, 0.28)}`,
                    boxShadow: `0 0 0 1px ${withAlpha(accentColor, 0.1)}, 0 0 70px ${withAlpha(glowColor, 0.2)}`,
                }}
                animate={
                    allowMotion
                        ? {
                              rotate: 360,
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(8, orbitDuration * 1.2),
                              ease: "linear",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />

            {/* Plasma core */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "14%",
                    borderRadius: 999,
                    background:
                        `radial-gradient(circle at 48% 45%, ${withAlpha(accentColor, 0.95)} 0%, ${withAlpha(
                            glowColor,
                            0.65,
                        )} 28%, ${withAlpha(glowColor, 0.12)} 56%, ${withAlpha("#000000", 0)} 74%),` +
                        `conic-gradient(from 180deg, ${withAlpha(accentColor, 0)} 0%, ${withAlpha(
                            accentColor,
                            0.55,
                        )} 30%, ${withAlpha(glowColor, 0)} 55%, ${withAlpha(accentColor, 0)} 100%)`,
                    boxShadow: `inset 0 0 80px ${withAlpha(glowColor, 0.22)}, 0 0 80px ${withAlpha(glowColor, 0.25)}`,
                    mixBlendMode: "screen",
                    scale: activityBoost,
                }}
                animate={
                    allowMotion
                        ? {
                              rotate: [-6, 6, -6],
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(1.8, waveDuration),
                              ease: "easeInOut",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />

            {/* Glow waves */}
            <GlowWaves allowMotion={allowMotion} waveDuration={waveDuration} glowColor={glowColor} accentColor={accentColor} />

            {/* Data rings */}
            <div style={{ position: "absolute", inset: 0, borderRadius: 999 }}>
                {rings.map((r) => (
                    <DataRing
                        key={r.i}
                        index={r.i}
                        count={rings.length}
                        allowMotion={allowMotion}
                        ringDuration={ringDuration}
                        accentColor={accentColor}
                        glowColor={glowColor}
                        textColor={textColor}
                        activity={activity}
                    />
                ))}
            </div>

            {/* Orbit layers */}
            <Orbitals allowMotion={allowMotion} orbitDuration={orbitDuration} glowColor={glowColor} accentColor={accentColor} />

            {/* Spec highlight */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "8%",
                    borderRadius: 999,
                    background: `radial-gradient(260px 220px at 40% 32%, ${withAlpha("#FFFFFF", 0.24)} 0%, ${withAlpha(
                        "#FFFFFF",
                        0,
                    )} 60%)`,
                    mixBlendMode: "screen",
                    opacity: 0.85,
                    transform: "translateZ(10px)",
                }}
                animate={
                    allowMotion
                        ? {
                              opacity: [0.65, 0.9, 0.65],
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(2.0, waveDuration * 1.2),
                              ease: "easeInOut",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />

            {/* Center dot */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    transform: "translate(-50%, -50%)",
                    background: accentColor,
                    boxShadow: `0 0 30px ${withAlpha(glowColor, 0.55)}`,
                }}
                animate={
                    allowMotion
                        ? {
                              scale: [1, 1.35, 1],
                              opacity: [0.6, 1, 0.6],
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(1.2, waveDuration * 0.85),
                              ease: "easeInOut",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />
        </motion.div>
    )
}

function GlowWaves(props: { allowMotion: boolean; waveDuration: number; glowColor: string; accentColor: string }) {
    const { allowMotion, waveDuration, glowColor, accentColor } = props

    const wave = (delay: number, color: string, thickness: number) => (
        <motion.div
            key={`${delay}-${color}-${thickness}`}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: "14%",
                borderRadius: 999,
                border: `${thickness}px solid ${withAlpha(color, 0.28)}`,
                boxShadow: `0 0 40px ${withAlpha(color, 0.18)}`,
                filter: "blur(0.2px)",
            }}
            animate={
                allowMotion
                    ? {
                          scale: [0.86, 1.18],
                          opacity: [0.0, 0.55, 0.0],
                      }
                    : { scale: 1.06, opacity: 0.25 }
            }
            transition={
                allowMotion
                    ? {
                          duration: Math.max(1.8, waveDuration),
                          ease: "easeOut",
                          repeat: Infinity,
                          delay,
                      }
                    : undefined
            }
        />
    )

    return (
        <div style={{ position: "absolute", inset: 0, borderRadius: 999 }}>
            {wave(0.0, glowColor, 1)}
            {wave(0.7, accentColor, 1)}
            {wave(1.4, glowColor, 2)}
        </div>
    )
}

function DataRing(props: {
    index: number
    count: number
    allowMotion: boolean
    ringDuration: number
    accentColor: string
    glowColor: string
    textColor: string
    activity: any
}) {
    const { index, count, allowMotion, ringDuration, accentColor, glowColor, textColor, activity } = props

    const inset = 6 + index * (48 / Math.max(1, count - 1))
    const width = 1 + (index % 2)
    const direction = index % 2 === 0 ? 1 : -1

    const baseOpacity = 0.36 - index * 0.04
    const strokeOpacity = Math.max(0.12, baseOpacity)

    const flashOpacity = useTransform(activity, (v: number) => Math.min(0.22, v * 0.22))

    return (
        <motion.div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: `${inset}%`,
                borderRadius: 999,
                border: `${width}px dashed ${withAlpha(index % 2 === 0 ? glowColor : accentColor, strokeOpacity)}`,
                boxShadow: `inset 0 0 0 1px ${withAlpha(textColor, 0.06)}, 0 0 40px ${withAlpha(glowColor, 0.08)}`,
                opacity: 0.95,
            }}
            animate={
                allowMotion
                    ? {
                          rotate: 360 * direction,
                      }
                    : undefined
            }
            transition={
                allowMotion
                    ? {
                          duration: Math.max(8, ringDuration + index * 2.5),
                          ease: "linear",
                          repeat: Infinity,
                      }
                    : undefined
            }
        >
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -2,
                    borderRadius: 999,
                    background: `conic-gradient(from 90deg, ${withAlpha(accentColor, 0.0)}, ${withAlpha(
                        accentColor,
                        0.18,
                    )}, ${withAlpha(glowColor, 0.0)}, ${withAlpha(accentColor, 0.0)})`,
                    maskImage:
                        "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 78%)",
                    opacity: 0.65,
                    mixBlendMode: "screen",
                }}
                animate={
                    allowMotion
                        ? {
                              rotate: [-5, 5, -5],
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(2.2, ringDuration * 0.85),
                              ease: "easeInOut",
                              repeat: Infinity,
                          }
                        : undefined
                }
            />

            {/* Cursor-driven flash (IMPORTANT: MotionValue used only in style, not animate) */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    opacity: flashOpacity,
                    background: `radial-gradient(circle at 50% 50%, ${withAlpha(glowColor, 0.0)} 0%, ${withAlpha(
                        glowColor,
                        0.18,
                    )} 55%, ${withAlpha(glowColor, 0.0)} 72%)`,
                    mixBlendMode: "screen",
                    filter: "blur(0.2px)",
                }}
            />
        </motion.div>
    )
}

function Orbitals(props: { allowMotion: boolean; orbitDuration: number; glowColor: string; accentColor: string }) {
    const { allowMotion, orbitDuration, glowColor, accentColor } = props

    const orbit = (i: number, inset: string, size: number, color: string, dir: 1 | -1) => (
        <motion.div
            key={i}
            aria-hidden="true"
            style={{
                position: "absolute",
                inset,
                borderRadius: 999,
                border: `1px solid ${withAlpha(color, 0.14)}`,
                boxShadow: `0 0 30px ${withAlpha(color, 0.1)}`,
            }}
            animate={
                allowMotion
                    ? {
                          rotate: 360 * dir,
                      }
                    : undefined
            }
            transition={
                allowMotion
                    ? {
                          duration: Math.max(10, orbitDuration + i * 3.5),
                          ease: "linear",
                          repeat: Infinity,
                      }
                    : undefined
            }
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: -size / 2,
                    width: size,
                    height: size,
                    borderRadius: 999,
                    transform: "translateX(-50%)",
                    background: `radial-gradient(circle at 35% 35%, ${withAlpha("#FFFFFF", 0.35)} 0%, ${withAlpha(
                        color,
                        0.95,
                    )} 35%, ${withAlpha(color, 0.0)} 70%)`,
                    boxShadow: `0 0 24px ${withAlpha(color, 0.38)}`,
                    mixBlendMode: "screen",
                }}
            />
        </motion.div>
    )

    return (
        <div style={{ position: "absolute", inset: "7%", borderRadius: 999 }}>
            {orbit(0, "0%", 10, glowColor, 1)}
            {orbit(1, "6%", 8, accentColor, -1)}
            {orbit(2, "13%", 6, glowColor, 1)}
        </div>
    )
}

function HoloPanel(props: {
    allowMotion: boolean
    glass: React.CSSProperties
    accentColor: string
    glowColor: string
    textColor: string
    sx: any
    sy: any
    activity: any
    panelDuration: number
    i: number
    side: number
    y: number
    w: number
    h: number
    depth: number
    delay: number
}) {
    const {
        allowMotion,
        glass,
        accentColor,
        glowColor,
        textColor,
        sx,
        sy,
        activity,
        panelDuration,
        side,
        y,
        w,
        h,
        depth,
        delay,
    } = props

    const left = side < 0 ? 0.06 : 0.70

    const xParallax = useTransform(sx, (v: number) => `${(v - 0.5) * side * 18}px`)
    const yParallax = useTransform(sy, (v: number) => `${(v - 0.5) * 12}px`)
    const zParallax = useTransform(activity, (v: number) => `${depth * v * 20}px`)

    const shimmerOpacity = useTransform(activity, (v: number) => lerp(0.65, 0.95, v))

    return (
        <motion.div
            aria-hidden="true"
            style={{
                position: "absolute",
                left: `${left * 100}%`,
                top: `${y * 100}%`,
                width: `${w * 100}%`,
                height: `${h * 100}%`,
                borderRadius: 14,
                ...glass,
                transformStyle: "preserve-3d",
                transform: "translate3d(0,0,0)",
                x: xParallax,
                y: yParallax,
                // Framer-motion doesn't type z; use translateZ via style.transform and keep the rest in x/y.
                // Instead, apply z parallax to a child wrapper.
            }}
            animate={
                allowMotion
                    ? {
                          opacity: [0.72, 1, 0.72],
                      }
                    : { opacity: 0.9 }
            }
            transition={
                allowMotion
                    ? {
                          duration: Math.max(2.6, panelDuration),
                          ease: "easeInOut",
                          repeat: Infinity,
                          delay,
                      }
                    : undefined
            }
        >
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 14,
                    transform: "translateZ(0px)",
                    // Use MotionValue in style only
                    transformOrigin: "50% 50%",
                    translateZ: zParallax as any,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 10,
                    borderRadius: 12,
                    border: `1px solid ${withAlpha(glowColor, 0.22)}`,
                    overflow: "hidden",
                }}
            >
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -1,
                        background:
                            `linear-gradient(90deg, ${withAlpha(accentColor, 0.0)} 0%, ${withAlpha(
                                accentColor,
                                0.18,
                            )} 45%, ${withAlpha(glowColor, 0.0)} 78%),` +
                            `linear-gradient(180deg, ${withAlpha(textColor, 0.0)} 0%, ${withAlpha(textColor, 0.12)} 100%)`,
                        opacity: shimmerOpacity,
                        mixBlendMode: "screen",
                    }}
                    animate={
                        allowMotion
                            ? {
                                  x: ["-35%", "35%"],
                              }
                            : undefined
                    }
                    transition={
                        allowMotion
                            ? {
                                  duration: Math.max(2.4, panelDuration * 0.95),
                                  ease: "easeInOut",
                                  repeat: Infinity,
                                  repeatType: "mirror",
                                  delay,
                              }
                            : undefined
                    }
                />

                {/* mini readouts */}
                <div style={{ position: "absolute", left: 10, right: 10, top: 10, display: "flex", gap: 8 }}>
                    <div
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: accentColor,
                            boxShadow: `0 0 16px ${withAlpha(accentColor, 0.35)}`,
                        }}
                    />
                    <div
                        style={{
                            flex: 1,
                            height: 8,
                            borderRadius: 999,
                            background: `linear-gradient(90deg, ${withAlpha(glowColor, 0.35)} 0%, ${withAlpha(
                                glowColor,
                                0.0,
                            )} 85%)`,
                        }}
                    />
                </div>

                <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, display: "grid", gap: 6 }}>
                    {new Array(3).fill(0).map((_, idx) => (
                        <div
                            key={idx}
                            style={{
                                height: 6,
                                borderRadius: 999,
                                background:
                                    idx === 1
                                        ? `linear-gradient(90deg, ${withAlpha(accentColor, 0.35)} 0%, ${withAlpha(
                                              accentColor,
                                              0.0,
                                          )} 92%)`
                                        : `linear-gradient(90deg, ${withAlpha(textColor, 0.24)} 0%, ${withAlpha(
                                              textColor,
                                              0.0,
                                          )} 92%)`,
                                opacity: 0.92,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* panel edge glow */}
            <motion.div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: -1,
                    borderRadius: 14,
                    boxShadow: `0 0 0 1px ${withAlpha(glowColor, 0.18)}, 0 0 40px ${withAlpha(glowColor, 0.08)}`,
                    opacity: 0.65,
                }}
                animate={
                    allowMotion
                        ? {
                              opacity: [0.4, 0.8, 0.4],
                          }
                        : undefined
                }
                transition={
                    allowMotion
                        ? {
                              duration: Math.max(2.8, panelDuration * 1.2),
                              ease: "easeInOut",
                              repeat: Infinity,
                              delay: delay + 0.25,
                          }
                        : undefined
                }
            />
        </motion.div>
    )
}

function EnergyParticle(props: {
    allowMotion: boolean
    a: number
    r: number
    z: number
    size: number
    drift: number
    delay: number
    color: string
}) {
    const { allowMotion, a, r, z, size, drift, delay, color } = props

    const x = 50 + Math.cos(a) * r * 80
    const y = 50 + Math.sin(a) * r * 80

    return (
        <motion.div
            aria-hidden="true"
            style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: 999,
                background: withAlpha(color, 0.92),
                boxShadow: `0 0 ${12 + size * 4}px ${withAlpha(color, 0.25)}`,
                transform: `translate(-50%, -50%) translateZ(${Math.round(z * 18)}px)`,
                mixBlendMode: "screen",
                opacity: 0.85,
            }}
            animate={
                allowMotion
                    ? {
                          y: [`${y}%`, `${y + (z * 1.2 + 0.8)}%`, `${y}%`],
                          x: [`${x}%`, `${x + (z * 0.7 + 0.6)}%`, `${x}%`],
                          opacity: [0.15, 0.9, 0.15],
                          scale: [0.8, 1.35, 0.9],
                      }
                    : undefined
            }
            transition={
                allowMotion
                    ? {
                          duration: Math.max(2.0, 2.8 * drift),
                          ease: "easeInOut",
                          repeat: Infinity,
                          delay,
                      }
                    : undefined
            }
        />
    )
}

function CursorTrails(props: {
    enabled: boolean
    sx: any
    sy: any
    sa: any
    accentColor: string
    glowColor: string
    trailCount: number
}) {
    const { enabled, sx, sy, sa, accentColor, glowColor, trailCount } = props

    const lines = React.useMemo(() => {
        const count = Math.max(6, Math.min(40, Math.round(trailCount)))
        return new Array(count).fill(0).map((_, i) => {
            const t = i / (count - 1)
            const w = lerp(220, 560, 1 - t)
            const o = lerp(0.18, 0.02, t)
            const blur = lerp(0, 12, t)
            const dur = 2.8 + t * 1.2
            return { i, t, w, o, blur, dur }
        })
    }, [trailCount])

    if (!enabled) return null

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            {lines.map((l) => (
                <CursorTrailLine
                    key={l.i}
                    sx={sx}
                    sy={sy}
                    sa={sa}
                    accentColor={accentColor}
                    glowColor={glowColor}
                    w={l.w}
                    o={l.o}
                    blur={l.blur}
                    dur={l.dur}
                />
            ))}
        </div>
    )
}

function CursorTrailLine(props: {
    sx: any
    sy: any
    sa: any
    accentColor: string
    glowColor: string
    w: number
    o: number
    blur: number
    dur: number
}) {
    const { sx, sy, sa, accentColor, glowColor, w, o, blur, dur } = props

    const left = useTransform(sx, (v: number) => `${v * 100}%`)
    const top = useTransform(sy, (v: number) => `${v * 100}%`)
    const opacity = useTransform(sa, (v: number) => v)
    const rotate = useTransform(sx, (v: number) => `${(v - 0.5) * 20}deg`)

    return (
        <motion.div
            aria-hidden="true"
            style={{
                position: "absolute",
                left,
                top,
                width: w,
                height: 2,
                transform: "translate(-50%, -50%)",
                background: `linear-gradient(90deg, ${withAlpha(glowColor, o)} 0%, ${withAlpha(
                    accentColor,
                    o * 0.9,
                )} 35%, ${withAlpha(glowColor, 0)} 100%)`,
                filter: `blur(${blur}px)`,
                opacity,
                rotate,
                mixBlendMode: "screen",
                borderRadius: 999,
                pointerEvents: "none",
            }}
            animate={{
                // tiny shimmer to feel alive; stays purely numeric to satisfy typings
                scaleX: [1, 1.05, 1],
            }}
            transition={{ duration: dur, ease: "easeInOut", repeat: Infinity }}
        />
    )
}

addPropertyControls(AstroSyncPortal, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "AstroSync Portal",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Real-time digital gateway core with synchronized orbitals, glow waves, data rings, and cursor-bent trails.",
        displayTextArea: true,
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["calm", "active", "hyper"],
        optionTitles: ["Calm", "Active", "Hyper"],
        defaultValue: "active",
        displaySegmentedControl: true,
    },
    panelDensity: {
        type: ControlType.Enum,
        title: "Panels",
        options: ["minimal", "dense"],
        optionTitles: ["Minimal", "Dense"],
        defaultValue: "minimal",
        displaySegmentedControl: true,
    },
    useColorPreset: {
        type: ControlType.Boolean,
        title: "Color Preset",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    colorPreset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Nebula", "Ion", "Solar", "Monochrome"],
        defaultValue: "Nebula",
        displaySegmentedControl: true,
        hidden: ({ useColorPreset }) => !useColorPreset,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#05070D",
        hidden: ({ useColorPreset }) => useColorPreset,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#EAF2FF",
        hidden: ({ useColorPreset }) => useColorPreset,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#6A5CFF",
        hidden: ({ useColorPreset }) => useColorPreset,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#00D1FF",
        hidden: ({ useColorPreset }) => useColorPreset,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
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
            lineHeight: "1.3em",
        },
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.05,
    },
    ringCount: {
        type: ControlType.Number,
        title: "Rings",
        defaultValue: 5,
        min: 2,
        max: 8,
        step: 1,
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 90,
        min: 1,
        max: 240,
        step: 1,
    },
    showPanels: {
        type: ControlType.Boolean,
        title: "Holo Panels",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showParticles: {
        type: ControlType.Boolean,
        title: "Particles",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCursorTrails: {
        type: ControlType.Boolean,
        title: "Cursor Trails",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "24px",
    },
})
