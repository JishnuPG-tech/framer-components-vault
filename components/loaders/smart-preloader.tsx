// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"
import {
    animate,
    cubicBezier as motionCubicBezier,
    motion,
    useMotionValue,
    useTransform,
} from "framer-motion"

type Direction =
    | "bottom-to-top"
    | "top-to-bottom"
    | "left-to-right"
    | "right-to-left"
type Phase = "idle" | "revealing" | "exiting" | "done"
type EffectPreset = "default"
type CounterEffect = "none" | "default" | "sync"

function parseBezier(input: string) {
    const raw = (input || "").trim()
    const m = raw.match(/cubic-bezier\(([^)]+)\)/i)
    const inner = (m ? m[1] : raw).replace(/\s+/g, "")
    const parts = inner
        .split(/[,\s]+/)
        .filter(Boolean)
        .map((v) => Number.parseFloat(v))

    if (parts.length >= 4 && parts.every((n) => Number.isFinite(n))) {
        return { x1: parts[0], y1: parts[1], x2: parts[2], y2: parts[3] }
    }
    return null
}

function buildEasing(x1: number, y1: number, x2: number, y2: number) {
    try {
        return motionCubicBezier(x1, y1, x2, y2)
    } catch {
        return (t: number) => t
    }
}

function createSlowWarp(slowSteps: number[]) {
    const windowPct = 16
    const slowFactor = 0.12
    const half = windowPct / 2
    const N = 200

    const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
    const bump = (d: number) => {
        const ad = Math.abs(d)
        if (ad >= half) return 0
        return 0.5 * (1 + Math.cos((Math.PI * ad) / half))
    }

    const speedAt = (pct: number) => {
        if (pct >= 100) return 1
        if (!slowSteps.length) return 1
        let influence = 0
        for (const s of slowSteps)
            influence = Math.max(influence, bump(pct - s))
        return 1 - (1 - slowFactor) * clamp01(influence)
    }

    const timeAtPct = new Array<number>(N + 1)
    timeAtPct[0] = 0
    let acc = 0
    for (let i = 1; i <= N; i++) {
        const p0 = ((i - 1) / N) * 100
        const p1 = (i / N) * 100
        const mid = (p0 + p1) / 2
        const sp = Math.max(0.0001, speedAt(mid))
        acc += (p1 - p0) / sp
        timeAtPct[i] = acc
    }
    const total = acc

    return (tNorm: number) => {
        const t = Math.max(0, Math.min(1, tNorm))
        const target = t * total

        let lo = 0,
            hi = N
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2)
            if (timeAtPct[mid] < target) lo = mid + 1
            else hi = mid
        }

        const i = Math.max(1, lo)
        const t0 = timeAtPct[i - 1]
        const t1 = timeAtPct[i]
        const alpha = t1 > t0 ? (target - t0) / (t1 - t0) : 0
        return (i - 1 + alpha) / N
    }
}

type Props = {
    effectPreset: EffectPreset
    direction: Direction
    overlayColor: string
    progressColor: string
    startDelayMs: number
    totalRevealMs: number
    fadeMs: number
    easing: "cinematic" | "expo" | "custom"
    bezierCurve: string
    useCustomBezier: boolean
    bezierX1: number
    bezierY1: number
    bezierX2: number
    bezierY2: number
    showInCanvas: boolean
    counterEffect: CounterEffect
    counterColor: string
    counterFont: any
    counterTextTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
    counterPosition:
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right"
        | "center"
    counterPadding: number
    slowStep1: number
    slowStep2: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function SmartPreloader(props: Props) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    const {
        direction = "bottom-to-top",
        overlayColor,
        progressColor,
        startDelayMs,
        totalRevealMs,
        fadeMs,
        easing,
        bezierCurve,
        useCustomBezier,
        bezierX1,
        bezierY1,
        bezierX2,
        bezierY2,
        showInCanvas,
        counterEffect = "default",
        counterColor,
        counterFont,
        counterTextTransform = "none",
        counterPosition,
        counterPadding,
        slowStep1,
        slowStep2,
        style,
    } = props

    const hostRef = useRef<HTMLDivElement | null>(null)
    const finalizedRef = useRef(false)
    const counterOutTimerRef = useRef<number | null>(null)

    const [counterDone, setCounterDone] = useState(false)
    const [phase, setPhase] = useState<Phase>("idle")
    const [isVisible, setIsVisible] = useState(true)

    const tNormMV = useMotionValue(isCanvas ? 0.5 : 0)
    const exitMV = useMotionValue(0)
    const counterTextRef = useRef<HTMLSpanElement | null>(null)

    const revealAnimStopRef = useRef<null | (() => void)>(null)
    const exitAnimStopRef = useRef<null | (() => void)>(null)

    const overridePointerEvents = style?.pointerEvents
    const overrideDisplay = style?.display
    const isForceHidden = overrideDisplay === "none"

    const overlayVisible = isVisible && phase !== "done" && !isForceHidden
    const displayPhase = isCanvas ? "revealing" : phase

    const isHidden = isCanvas
        ? !showInCanvas
        : !isVisible || !overlayVisible || phase === "done" || isForceHidden

    const slowWarpPct = useMemo(() => {
        const clampPct = (v: number) =>
            Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0))
        const steps = [clampPct(slowStep1), clampPct(slowStep2)]
            .filter((v) => v > 0 && v < 100)
            .sort((a, b) => a - b)
        return createSlowWarp(steps)
    }, [slowStep1, slowStep2])

    const revealProgressMV = useTransform(tNormMV, (t) => slowWarpPct(t))
    const revealPercentMV = useTransform(revealProgressMV, (p) => p * 100)

    useEffect(() => {
        if (typeof window === "undefined" || isCanvas) return

        const shouldLock = overlayVisible && phase !== "done"
        const el = hostRef.current

        if (shouldLock && el) {
            const preventDefault = (e: Event) => e.preventDefault()
            const preventScrollKeys = (e: KeyboardEvent) => {
                const keys = [
                    "Space",
                    "ArrowUp",
                    "ArrowDown",
                    "PageUp",
                    "PageDown",
                    "Home",
                    "End",
                ]
                if (keys.includes(e.code)) {
                    e.preventDefault()
                }
            }

            el.addEventListener("wheel", preventDefault, { passive: false })
            el.addEventListener("touchmove", preventDefault, { passive: false })
            el.addEventListener("keydown", preventScrollKeys as EventListener, {
                passive: false,
            })

            return () => {
                el.removeEventListener("wheel", preventDefault)
                el.removeEventListener("touchmove", preventDefault)
                el.removeEventListener(
                    "keydown",
                    preventScrollKeys as EventListener
                )
            }
        }
    }, [isCanvas, overlayVisible, phase])

    const easingFn = useMemo(() => {
        if (easing === "custom" || useCustomBezier) {
            const parsed = parseBezier(bezierCurve)
            if (parsed)
                return buildEasing(parsed.x1, parsed.y1, parsed.x2, parsed.y2)
            const x1 = Number.isFinite(bezierX1) ? bezierX1 : 0.25
            const y1 = Number.isFinite(bezierY1) ? bezierY1 : 0.1
            const x2 = Number.isFinite(bezierX2) ? bezierX2 : 0.25
            const y2 = Number.isFinite(bezierY2) ? bezierY2 : 1
            return buildEasing(x1, y1, x2, y2)
        }
        if (easing === "expo") return buildEasing(0.19, 1, 0.22, 1)
        return buildEasing(0.16, 1, 0.3, 1)
    }, [
        easing,
        useCustomBezier,
        bezierCurve,
        bezierX1,
        bezierY1,
        bezierX2,
        bezierY2,
    ])

    const finalize = useCallback(() => {
        if (finalizedRef.current) return
        finalizedRef.current = true
        if (typeof window !== "undefined") {
            startTransition(() => setPhase("exiting"))
            window.setTimeout(
                () => {
                    startTransition(() => {
                        setPhase("done")
                        setIsVisible(false)
                    })
                },
                Math.max(0, fadeMs)
            )
        } else {
            startTransition(() => {
                setPhase("done")
                setIsVisible(false)
            })
        }
    }, [fadeMs])

    useEffect(() => {
        if (
            isCanvas ||
            !isVisible ||
            typeof window === "undefined" ||
            isForceHidden
        )
            return
        startTransition(() => {
            setPhase("idle")
            setCounterDone(false)
        })
        finalizedRef.current = false
        tNormMV.set(0)
        exitMV.set(0)
        if (counterOutTimerRef.current != null) {
            window.clearTimeout(counterOutTimerRef.current)
            counterOutTimerRef.current = null
        }
        if (revealAnimStopRef.current) {
            revealAnimStopRef.current()
            revealAnimStopRef.current = null
        }
        if (exitAnimStopRef.current) {
            exitAnimStopRef.current()
            exitAnimStopRef.current = null
        }
        const startTimer = window.setTimeout(
            () => {
                startTransition(() => setPhase("revealing"))
            },
            Math.max(0, startDelayMs)
        )
        return () => window.clearTimeout(startTimer)
    }, [isVisible, startDelayMs, isCanvas, tNormMV, exitMV, isForceHidden])

    useEffect(() => {
        if (
            isCanvas ||
            !overlayVisible ||
            phase !== "revealing" ||
            typeof window === "undefined"
        )
            return
        if (revealAnimStopRef.current) {
            revealAnimStopRef.current()
            revealAnimStopRef.current = null
        }
        tNormMV.set(0)
        const controls = animate(tNormMV, 1, {
            duration: Math.max(0.001, totalRevealMs / 1000),
            ease: (t) => t,
        })
        revealAnimStopRef.current = () => controls.stop()
        controls.finished
            .then(() => {
                if (typeof window === "undefined") return
                if (counterOutTimerRef.current != null) return
                counterOutTimerRef.current = window.setTimeout(() => {
                    counterOutTimerRef.current = null
                    startTransition(() => setCounterDone(true))
                    finalize()
                }, 100)
            })
            .catch(() => {})
        return () => {
            if (revealAnimStopRef.current) {
                revealAnimStopRef.current()
                revealAnimStopRef.current = null
            }
        }
    }, [
        animate,
        finalize,
        isCanvas,
        overlayVisible,
        phase,
        tNormMV,
        totalRevealMs,
    ])

    useEffect(() => {
        if (isCanvas || !overlayVisible || typeof window === "undefined") return
        if (phase !== "exiting") {
            exitMV.set(0)
            if (exitAnimStopRef.current) {
                exitAnimStopRef.current()
                exitAnimStopRef.current = null
            }
            return
        }
        if (exitAnimStopRef.current) {
            exitAnimStopRef.current()
            exitAnimStopRef.current = null
        }
        exitMV.set(0)
        const controls = animate(exitMV, 1, {
            duration: Math.max(0.001, fadeMs / 1000),
            ease: (t) => t,
        })
        exitAnimStopRef.current = () => controls.stop()
        return () => {
            if (exitAnimStopRef.current) {
                exitAnimStopRef.current()
                exitAnimStopRef.current = null
            }
        }
    }, [fadeMs, isCanvas, overlayVisible, phase, exitMV])

    const counterValueText = useMemo(() => {
        if (isCanvas) {
            let p = 50
            if (counterEffect === "sync") {
                const synced = easingFn(0.5) * 100
                p = Math.floor(Math.max(0, Math.min(100, synced)))
            }
            return `${p}%`
        }
        return ""
    }, [isCanvas, counterEffect, easingFn])

    useEffect(() => {
        if (isCanvas || !overlayVisible || !counterTextRef.current) return
        const clamp = (v: number) => Math.max(0, Math.min(100, v))
        const unsub = revealPercentMV.on("change", (pct) => {
            const doneNow = phase === "exiting" || phase === "done"
            const rawPct = doneNow ? 100 : clamp(pct)
            const t = rawPct / 100
            let p = rawPct >= 99.5 ? 100 : Math.floor(rawPct)
            if (counterEffect === "sync") {
                const synced = easingFn(t) * 100
                const syncedClamped = clamp(synced)
                p = t >= 0.995 ? 100 : Math.floor(syncedClamped)
            }
            if (counterTextRef.current)
                counterTextRef.current.textContent = `${p}%`
        })
        return () => {
            unsub()
        }
    }, [
        counterEffect,
        easingFn,
        isCanvas,
        overlayVisible,
        phase,
        revealPercentMV,
    ])

    const baseHostStyle = useMemo<CSSProperties>(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            minWidth: 5,
            minHeight: 5,
            overflow: "hidden",
            display: isForceHidden ? "none" : isHidden ? "none" : "block",
            pointerEvents:
                overridePointerEvents === "none"
                    ? "none"
                    : isCanvas
                      ? "auto"
                      : isHidden ||
                          displayPhase === "exiting" ||
                          displayPhase === "done"
                        ? "none"
                        : "auto",
            touchAction:
                !isHidden &&
                displayPhase !== "exiting" &&
                displayPhase !== "done"
                    ? "none"
                    : "auto",
        }),
        [displayPhase, isCanvas, isHidden, overridePointerEvents, isForceHidden]
    )

    const exitEasedPctMV = useTransform(exitMV, (t) => easingFn(t) * 100)
    const overlayTranslateMV = useTransform(exitEasedPctMV, (val) => {
        if (displayPhase !== "exiting") return "translate3d(0%, 0%, 0)"
        if (direction === "left-to-right") return `translate3d(${val}%, 0%, 0)`
        if (direction === "right-to-left") return `translate3d(${-val}%, 0%, 0)`
        if (direction === "top-to-bottom") return `translate3d(0%, ${val}%, 0)`
        return `translate3d(0%, ${-val}%, 0)`
    })

    const overlayLayerStyle = useMemo<CSSProperties>(
        () => ({
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: overlayColor,
            zIndex: 1,
            willChange: "transform",
        }),
        [overlayColor]
    )

    const indicatorMaskStyle = useMemo<CSSProperties>(
        () => ({
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 3,
            willChange: displayPhase === "exiting" ? "clip-path" : undefined,
        }),
        [displayPhase]
    )

    const counterClipPathMV = useTransform(exitEasedPctMV, (val) => {
        if (displayPhase !== "exiting") return "inset(0% 0% 0% 0%)"
        const v = Math.max(0, Math.min(100, val))
        if (direction === "left-to-right") return `inset(0% 0% 0% ${v}%)`
        if (direction === "right-to-left") return `inset(0% ${v}% 0% 0%)`
        if (direction === "top-to-bottom") return `inset(${v}% 0% 0% 0%)`
        return `inset(0% 0% ${v}% 0%)`
    })

    const progressTransformOrigin = useMemo(() => {
        if (direction === "left-to-right") return "0% 50%"
        if (direction === "right-to-left") return "100% 50%"
        if (direction === "top-to-bottom") return "50% 0%"
        return "50% 100%"
    }, [direction])

    const progressScaleXMV = useTransform(revealProgressMV, (p) => {
        if (direction === "left-to-right" || direction === "right-to-left")
            return p
        return 1
    })

    const progressScaleYMV = useTransform(revealProgressMV, (p) => {
        if (direction === "top-to-bottom" || direction === "bottom-to-top")
            return p
        return 1
    })

    const progressLayerBaseStyle = useMemo<CSSProperties>(
        () => ({
            position: "absolute",
            inset: 0,
            background: progressColor,
            willChange: "transform",
            transformOrigin: progressTransformOrigin,
        }),
        [progressColor, progressTransformOrigin]
    )

    const counterPlacementStyle = useMemo<CSSProperties>(() => {
        const p = Math.max(
            0,
            Number.isFinite(counterPadding) ? counterPadding : 0
        )
        const pad = `${p}px`
        switch (counterPosition) {
            case "top-left":
                return { top: pad, left: pad }
            case "top-right":
                return { top: pad, right: pad }
            case "bottom-left":
                return { bottom: pad, left: pad }
            case "center":
                return {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                }
            case "bottom-right":
            default:
                return { bottom: pad, right: pad }
        }
    }, [counterPosition, counterPadding])

    const counterStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            ...counterPlacementStyle,
            color: counterColor,
            textTransform: counterTextTransform,
            ...counterFont,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
        }),
        [counterPlacementStyle, counterColor, counterTextTransform, counterFont]
    )

    if (isStatic && !isCanvas) return null

    return (
        <div
            ref={hostRef}
            style={{ ...style, ...baseHostStyle }}
            aria-label="Preloader"
            aria-hidden={isHidden || phase === "done" ? "true" : "false"}
        >
            {!isHidden && (
                <React.Fragment>
                    {counterEffect !== "none" && (
                        <motion.div
                            style={{
                                ...indicatorMaskStyle,
                                clipPath: counterClipPathMV,
                            }}
                        >
                            <div style={counterStyle}>
                                {isCanvas ? (
                                    <span>{counterValueText}</span>
                                ) : (
                                    <span ref={counterTextRef} />
                                )}
                            </div>
                        </motion.div>
                    )}
                    <motion.div
                        style={{
                            ...overlayLayerStyle,
                            transform: overlayTranslateMV,
                        }}
                    >
                        <motion.div
                            style={{
                                ...progressLayerBaseStyle,
                                scaleX: progressScaleXMV,
                                scaleY: progressScaleYMV,
                            }}
                        />
                    </motion.div>
                </React.Fragment>
            )}
        </div>
    )
}

addPropertyControls(SmartPreloader, {
    effectPreset: {
        type: ControlType.Enum,
        title: "Effect Preset",
        options: ["default"],
        optionTitles: ["Default"],
        defaultValue: "default",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: [
            "bottom-to-top",
            "left-to-right",
            "top-to-bottom",
            "right-to-left",
        ],
        optionTitles: ["🡡", "🡢", "🡣", "🡠"],
        displaySegmentedControl: true,
        defaultValue: "bottom-to-top",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#111111",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Load Color",
        defaultValue: "#0099FF",
    },
    startDelayMs: {
        type: ControlType.Number,
        title: "Start Delay (ms)",
        defaultValue: 200,
        min: 0,
        max: 5000,
        step: 50,
    },
    totalRevealMs: {
        type: ControlType.Number,
        title: "Reveal Time (ms)",
        defaultValue: 1600,
        min: 100,
        max: 5000,
        step: 100,
    },
    fadeMs: {
        type: ControlType.Number,
        title: "Exit Anim (ms)",
        defaultValue: 800,
        min: 0,
        max: 3000,
        step: 50,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["cinematic", "expo", "custom"],
        optionTitles: ["Cinematic", "Expo", "Custom"],
        defaultValue: "custom",
    },
    bezierCurve: {
        type: ControlType.String,
        title: "Bezier",
        defaultValue: "0.83, 0, 0.17, 1",
        placeholder: "e.g. 0.25, 0.1, 0.25, 1",
        hidden: (props) => props.easing !== "custom",
    },
    useCustomBezier: {
        type: ControlType.Boolean,
        title: "Custom Bezier",
        defaultValue: false,
        hidden: () => true,
    },
    bezierX1: {
        type: ControlType.Number,
        title: "Bezier X1",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: () => true,
    },
    bezierY1: {
        type: ControlType.Number,
        title: "Bezier Y1",
        defaultValue: 0.1,
        step: 0.01,
        hidden: () => true,
    },
    bezierX2: {
        type: ControlType.Number,
        title: "Bezier X2",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        hidden: () => true,
    },
    bezierY2: {
        type: ControlType.Number,
        title: "Bezier Y2",
        defaultValue: 1,
        step: 0.01,
        hidden: () => true,
    },
    showInCanvas: {
        type: ControlType.Boolean,
        title: "Show in Canvas",
        defaultValue: true,
    },
    counterEffect: {
        type: ControlType.Enum,
        title: "Counter",
        options: ["none", "default", "sync"],
        optionTitles: ["Hide", "Default", "Sync"],
        defaultValue: "sync",
    },
    counterPosition: {
        type: ControlType.Enum,
        title: "Counter Position",
        options: [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "center",
        ],
        optionTitles: [
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
            "Center",
        ],
        defaultValue: "bottom-right",
        hidden: (props) => props.counterEffect === "none",
    },
    counterPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 40,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        hidden: (props) => props.counterEffect === "none",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Counter Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.counterEffect === "none",
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter Font",
        hidden: (props) => props.counterEffect === "none",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "56px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    slowStep1: {
        type: ControlType.Number,
        title: "Slow Step 1 (%)",
        defaultValue: 27,
        min: 0,
        max: 100,
        step: 1,
    },
    slowStep2: {
        type: ControlType.Number,
        title: "Slow Step 2 (%)",
        defaultValue: 82,
        min: 0,
        max: 100,
        step: 1,
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/?tab=component), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
