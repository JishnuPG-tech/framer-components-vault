// User instructions: make it animation for 404 pages
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

import { motion, useInView } from "framer-motion"

type FontValue = any

interface Props {
    title: string
    code: string
    subtitle: string
    animationVariant: "glitch" | "float" | "pulse" | "shake"
    background: string
    textColor: string
    glitchColorA: string
    glitchColorB: string
    glowColor: string
    showScanlines: boolean
    scanlineOpacity: number
    glitchIntensity: number
    glitchSpeed: number
    codeFont: FontValue
    titleFont: FontValue
    subtitleFont: FontValue
    style?: React.CSSProperties
}

/**
 * Animated 404 Page (Glitch)
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 360
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Animated404(props: Props) {
    const {
        title,
        code,
        subtitle,
        animationVariant,
        background,
        textColor,
        glitchColorA,
        glitchColorB,
        glowColor,
        showScanlines,
        scanlineOpacity,
        glitchIntensity,
        glitchSpeed,
        codeFont,
        titleFont,
        subtitleFont,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.2, margin: "-10% 0px -10% 0px" })

    const [fitScale, setFitScale] = React.useState(1)

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!rootRef.current) return

        const baseW = 600
        const baseH = 360

        const el = rootRef.current
        const ro = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect
            if (!rect) return
            const w = Math.max(1, rect.width)
            const h = Math.max(1, rect.height)
            const next = Math.min(1, w / baseW, h / baseH)
            const snapped = Math.max(0.5, Math.min(1, Math.round(next * 1000) / 1000))
            React.startTransition(() => setFitScale(snapped))
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const uid = React.useId().replace(/:/g, "")
    const classRoot = `a404_${uid}`

    const speed = Math.max(0.05, glitchSpeed)
    const intensity = Math.max(0, glitchIntensity)

    const shouldAnimate = !isStatic && inView
    const useFlicker = shouldAnimate && animationVariant === "glitch"

    // CSS keyframes are used to create random-ish glitch slices without JS loops.
    const css = React.useMemo(() => {
        const dur1 = (1.6 / speed).toFixed(3)
        const dur2 = (1.15 / speed).toFixed(3)
        const dur3 = (2.2 / speed).toFixed(3)
        return `
.${classRoot} .glitchWrap { position: relative; display: inline-block; }
.${classRoot} .glitchText { position: relative; display: inline-block; }
.${classRoot} .glitchLayer { position: absolute; inset: 0; pointer-events: none; }
.${classRoot} .glitchA { color: ${glitchColorA}; mix-blend-mode: screen; }
.${classRoot} .glitchB { color: ${glitchColorB}; mix-blend-mode: screen; }

@keyframes ${classRoot}_clipA {
  0% { clip-path: inset(0 0 70% 0); }
  10% { clip-path: inset(15% 0 55% 0); }
  20% { clip-path: inset(40% 0 35% 0); }
  30% { clip-path: inset(10% 0 68% 0); }
  40% { clip-path: inset(55% 0 18% 0); }
  50% { clip-path: inset(30% 0 45% 0); }
  60% { clip-path: inset(65% 0 10% 0); }
  70% { clip-path: inset(25% 0 52% 0); }
  80% { clip-path: inset(45% 0 28% 0); }
  90% { clip-path: inset(5% 0 75% 0); }
  100% { clip-path: inset(0 0 70% 0); }
}

@keyframes ${classRoot}_clipB {
  0% { clip-path: inset(75% 0 0 0); }
  12% { clip-path: inset(55% 0 15% 0); }
  24% { clip-path: inset(35% 0 35% 0); }
  36% { clip-path: inset(68% 0 8% 0); }
  48% { clip-path: inset(18% 0 60% 0); }
  60% { clip-path: inset(42% 0 30% 0); }
  72% { clip-path: inset(60% 0 15% 0); }
  84% { clip-path: inset(30% 0 42% 0); }
  100% { clip-path: inset(75% 0 0 0); }
}

@keyframes ${classRoot}_flicker {
  0%, 100% { opacity: 1; }
  8% { opacity: 0.9; }
  10% { opacity: 0.6; }
  12% { opacity: 0.95; }
  22% { opacity: 0.85; }
  24% { opacity: 1; }
  50% { opacity: 0.92; }
  52% { opacity: 1; }
  70% { opacity: 0.88; }
  72% { opacity: 1; }
}

.${classRoot} .glitchA { animation: ${classRoot}_clipA ${dur1}s infinite linear; animation-play-state: ${animationVariant === "glitch" ? "running" : "paused"}; }
.${classRoot} .glitchB { animation: ${classRoot}_clipB ${dur2}s infinite linear; animation-play-state: ${animationVariant === "glitch" ? "running" : "paused"}; }
.${classRoot} .flicker { animation: ${classRoot}_flicker ${dur3}s infinite linear; animation-play-state: ${animationVariant === "glitch" ? "running" : "paused"}; }

.${classRoot} .scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255,255,255,0) 0px,
    rgba(255,255,255,0) 2px,
    rgba(0,0,0,1) 3px,
    rgba(255,255,255,0) 4px
  );
}

.${classRoot} .vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.6) 100%);
}
`
    }, [animationVariant, classRoot, glitchColorA, glitchColorB, glitchSpeed, speed])

    const baseTextShadow = React.useMemo(() => {
        const t = Math.max(0, intensity)
        if (t === 0) return "none"
        const a = Math.max(0.15, Math.min(0.9, 0.35 + t * 0.25))
        const px = (1.5 + t * 2.0).toFixed(2)
        return `${px}px 0 rgba(0,0,0,0.35), 0 ${px}px rgba(0,0,0,0.25), 0 0 24px rgba(0,0,0,0.35)`
    }, [intensity])

    const layerShift = React.useMemo(() => {
        const t = Math.max(0, intensity)
        const px = 2 + t * 6
        return px
    }, [intensity])

    const codeMotion = React.useMemo(() => {
        if (!shouldAnimate || intensity <= 0) return undefined
        const px = Math.max(1, layerShift)
        switch (animationVariant) {
            case "float":
                return { y: [0, -px * 1.2, 0, px * 0.8, 0] }
            case "pulse":
                return { scale: [1, 1 + Math.min(0.08, 0.02 + intensity * 0.03), 1] }
            case "shake":
                return {
                    x: [0, -px, px, -px * 0.6, px * 0.4, 0],
                    y: [0, px * 0.2, -px * 0.2, 0],
                    rotateZ: [0, -0.25, 0.25, -0.15, 0],
                }
            case "glitch":
            default:
                return {
                    x: [0, -px, px * 0.6, -px * 0.35, 0],
                    y: [0, px * 0.12, -px * 0.12, 0],
                }
        }
    }, [shouldAnimate, intensity, layerShift, animationVariant])

    const codeTransition = React.useMemo(() => {
        if (!shouldAnimate || intensity <= 0) return undefined
        const baseDuration = Math.max(0.3, 0.75 / speed)
        const duration =
            animationVariant === "float"
                ? Math.max(0.8, 1.8 / speed)
                : animationVariant === "pulse"
                  ? Math.max(0.6, 1.2 / speed)
                  : animationVariant === "shake"
                    ? Math.max(0.25, 0.55 / speed)
                    : baseDuration
        return {
            duration,
            repeat: Infinity,
            ease: "linear" as const,
        }
    }, [shouldAnimate, intensity, speed, animationVariant])

    const groupMotion = React.useMemo(() => {
        if (!shouldAnimate) return undefined
        switch (animationVariant) {
            case "float":
                return { y: [0, -10, 0, 6, 0] }
            case "pulse":
                return { scale: [1, 1.02, 0.995, 1] }
            case "shake":
                return { rotateZ: [0, -0.35, 0.35, -0.2, 0] }
            case "glitch":
            default:
                return undefined
        }
    }, [shouldAnimate, animationVariant])

    const groupTransition = React.useMemo(() => {
        if (!shouldAnimate || !groupMotion) return undefined
        const duration =
            animationVariant === "float"
                ? Math.max(1.2, 2.4 / speed)
                : animationVariant === "pulse"
                  ? Math.max(0.8, 1.6 / speed)
                  : Math.max(0.35, 0.9 / speed)
        return { duration, repeat: Infinity, ease: "easeInOut" as const }
    }, [shouldAnimate, groupMotion, animationVariant, speed])

    return (
        <div
            ref={rootRef}
            className={classRoot}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background,
                color: textColor,
            }}
        >
            <style>{css}</style>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "clamp(16px, 4vw, 44px)",
                }}
            >
                {showScanlines && (
                    <div
                        className="scanlines"
                        aria-hidden
                        style={{ opacity: Math.max(0, Math.min(1, scanlineOpacity)) }}
                    />
                )}
                <div className="vignette" aria-hidden />

                <motion.div
                    animate={groupMotion}
                    transition={groupTransition}
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "clamp(8px, 2.2vw, 14px)",
                        textAlign: "center",
                        maxWidth: "min(100%, 980px)",
                        transform: `scale(${fitScale})`,
                        transformOrigin: "center",
                        willChange: shouldAnimate ? "transform" : undefined,
                    }}
                >
                    <div
                        className={useFlicker ? "flicker" : undefined}
                        style={{
                            ...titleFont,
                            letterSpacing: titleFont?.letterSpacing ?? "0.22em",
                            textTransform: "uppercase",
                            opacity: 0.92,
                            textShadow: baseTextShadow,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            maxWidth: "100%",
                        }}
                    >
                        {title}
                    </div>

                    <div className="glitchWrap" aria-label={code} role="heading">
                        <motion.div
                            className="glitchText"
                            style={{
                                ...codeFont,
                                textShadow: baseTextShadow,
                                lineHeight: codeFont?.lineHeight ?? "0.9em",
                                letterSpacing: codeFont?.letterSpacing ?? "-0.04em",
                                textTransform: "uppercase",
                                willChange: shouldAnimate ? "transform" : undefined,
                                whiteSpace: "nowrap",
                                maxWidth: "100%",
                            }}
                            animate={codeMotion}
                            transition={codeTransition}
                        >
                            {code}
                            {/* Glitch layers */}
                            {intensity > 0 && (
                                <>
                                    <span
                                        className="glitchLayer glitchA"
                                        aria-hidden
                                        style={{
                                            transform: `translateX(${-layerShift}px)`,
                                            textShadow: `0 0 ${6 + intensity * 10}px ${glitchColorA}`,
                                        }}
                                    >
                                        {code}
                                    </span>
                                    <span
                                        className="glitchLayer glitchB"
                                        aria-hidden
                                        style={{
                                            transform: `translateX(${layerShift}px)`,
                                            textShadow: `0 0 ${6 + intensity * 10}px ${glitchColorB}`,
                                        }}
                                    >
                                        {code}
                                    </span>
                                </>
                            )}
                        </motion.div>
                    </div>

                    <div
                        className={useFlicker ? "flicker" : undefined}
                        style={{
                            ...subtitleFont,
                            letterSpacing: subtitleFont?.letterSpacing ?? "0.12em",
                            textTransform: "uppercase",
                            opacity: 0.9,
                            textShadow: baseTextShadow,
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            maxWidth: "100%",
                        }}
                    >
                        {subtitle}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

addPropertyControls(Animated404, {
    animationVariant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["glitch", "float", "pulse", "shake"],
        optionTitles: ["Glitch", "Float", "Pulse", "Shake"],
        defaultValue: "glitch",
    },
    title: {
        type: ControlType.String,
        title: "Top",
        defaultValue: "ERROR!",
    },
    code: {
        type: ControlType.String,
        title: "Code",
        defaultValue: "404",
    },
    subtitle: {
        type: ControlType.String,
        title: "Bottom",
        defaultValue: "PAGE NOT FOUND",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    glitchColorA: {
        type: ControlType.Color,
        title: "Glitch A",
        defaultValue: "#00E5FF",
    },
    glitchColorB: {
        type: ControlType.Color,
        title: "Glitch B",
        defaultValue: "#FF3D7F",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow",
        defaultValue: "#FFFFFF",
    },
    glitchIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.75,
        min: 0,
        max: 2,
        step: 0.05,
    },
    glitchSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.25,
        max: 3,
        step: 0.05,
    },
    showScanlines: {
        type: ControlType.Boolean,
        title: "Scanlines",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    scanlineOpacity: {
        type: ControlType.Number,
        title: "Scan Opacity",
        defaultValue: 0.14,
        min: 0,
        max: 0.6,
        step: 0.01,
        hidden: (p) => !p.showScanlines,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Top Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0.22em",
            lineHeight: "1.2em",
        },
    },
    codeFont: {
        type: ControlType.Font,
        title: "Code Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "120px",
            variant: "Black",
            letterSpacing: "-0.04em",
            lineHeight: "0.9em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Bottom Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.12em",
            lineHeight: "1.3em",
        },
    },
})
