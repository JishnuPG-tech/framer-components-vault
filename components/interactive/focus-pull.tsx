import * as React from "react"
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ProgressMode = "simulated" | "assets"
type EasingName = "linear" | "easeOut" | "easeInOut" | "expoOut"
type BarPosition = "top" | "bottom" | "none"
type ContentType = "none" | "text" | "image"
type Phase = "idle" | "delay" | "running" | "settling" | "done"

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

export interface FocusPullProps {
    progressMode: ProgressMode
    duration: number
    minDuration: number
    maxWait: number
    delay: number
    easing: EasingName

    blurStrength: number
    blurSteps: number
    scaleAmount: number

    veilColor: string
    veilOpacity: number
    fadeOutStart: number

    barPosition: BarPosition
    barHeight: number
    barColor: string
    trackColor: string
    barRadius: number
    barInset: number

    contentType: ContentType
    text: string
    font: React.CSSProperties
    textColor: string
    image: ResponsiveImageValue | string | null
    imageWidth: number
    showPercentage: boolean

    oncePerSession: boolean
    sessionKey: string
    lockScroll: boolean
    allowSkip: boolean
    respectReducedMotion: boolean
    zIndex: number

    onStart?: () => void
    onComplete?: () => void

    style?: React.CSSProperties
}

const SETTLE_DURATION = 0.45
const ASSET_SMOOTHING = 6
const PORTAL_ATTRIBUTE = "data-focus-pull-portal"

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

const EASINGS: Record<EasingName, (t: number) => number> = {
    linear: (t) => t,
    easeOut: (t) => 1 - Math.pow(1 - t, 2),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

const SR_ONLY: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
}

const DEFAULTS: FocusPullProps = {
    progressMode: "simulated",
    duration: 1.6,
    minDuration: 0.8,
    maxWait: 5,
    delay: 0,
    easing: "expoOut",

    blurStrength: 32,
    blurSteps: 24,
    scaleAmount: 1.03,

    veilColor: "#F7F6F3",
    veilOpacity: 0.35,
    fadeOutStart: 0.7,

    barPosition: "bottom",
    barHeight: 3,
    barColor: "#111111",
    trackColor: "rgba(17, 17, 17, 0.12)",
    barRadius: 0,
    barInset: 0,

    contentType: "none",
    text: "Loading",
    font: {
        fontSize: 14,
        letterSpacing: "0.08em",
        lineHeight: "1.2em",
    },
    textColor: "#111111",
    image: null,
    imageWidth: 120,
    showPercentage: false,

    oncePerSession: true,
    sessionKey: "focus-pull",
    lockScroll: true,
    allowSkip: false,
    respectReducedMotion: true,
    zIndex: 100000,
}

function resolveImageSrc(
    image: ResponsiveImageValue | string | null | undefined
): { src: string; srcSet?: string; alt: string } | null {
    if (!image) return null
    if (typeof image === "string") return { src: image, alt: "" }
    if (!image.src) return null
    return { src: image.src, srcSet: image.srcSet, alt: image.alt ?? "" }
}

function prefersReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function readSessionFlag(key: string): boolean {
    try {
        return window.sessionStorage.getItem(key) === "1"
    } catch {
        return false
    }
}

function writeSessionFlag(key: string): void {
    try {
        window.sessionStorage.setItem(key, "1")
    } catch {
        /* storage unavailable */
    }
}

function CanvasPlaceholder({
    progressMode,
}: {
    progressMode: ProgressMode
}): React.ReactElement {
    return (
        <div
            style={{
                width: 240,
                height: 64,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8,
                padding: "0 14px",
                borderRadius: 10,
                background:
                    "linear-gradient(135deg, rgba(11,11,15,0.94), rgba(38,38,52,0.94))",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#FFFFFF",
                fontFamily: "Inter, sans-serif",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 8,
                }}
            >
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: -0.1,
                    }}
                >
                    Focus Pull
                </span>
                <span
                    style={{
                        fontSize: 10,
                        fontWeight: 500,
                        opacity: 0.55,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                    }}
                >
                    {progressMode}
                </span>
            </div>
            <div
                style={{
                    position: "relative",
                    height: 3,
                    borderRadius: 3,
                    background: "rgba(255,255,255,0.16)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformOrigin: "left center",
                        transform: "scaleX(0.62)",
                        background: "#FFFFFF",
                    }}
                />
            </div>
        </div>
    )
}

function FocusPullRuntime(props: FocusPullProps): React.ReactElement | null {
    const {
        blurStrength,
        blurSteps,
        scaleAmount,
        veilColor,
        veilOpacity,
        fadeOutStart,
        barPosition,
        barHeight,
        barColor,
        trackColor,
        barRadius,
        barInset,
        contentType,
        text,
        font,
        textColor,
        image,
        imageWidth,
        showPercentage,
        allowSkip,
        lockScroll,
        zIndex,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const [phase, setPhase] = useState<Phase>("idle")
    const [progress, setProgress] = useState(0)
    const [mounted, setMounted] = useState(false)

    const configRef = useRef(props)
    configRef.current = props

    const portalHostRef = useRef<HTMLElement | null>(null)
    const skipRef = useRef<() => void>(() => undefined)
    const completedRef = useRef(false)

    useIsomorphicLayoutEffect(() => {
        if (isStaticRenderer) return
        if (typeof document === "undefined" || !document.body) return
        const host = document.createElement("div")
        host.setAttribute(PORTAL_ATTRIBUTE, "")
        document.body.appendChild(host)
        portalHostRef.current = host
        setMounted(true)
        return () => {
            portalHostRef.current = null
            setMounted(false)
            if (host.parentNode) host.parentNode.removeChild(host)
        }
    }, [isStaticRenderer])

    useEffect(() => {
        if (isStaticRenderer) return
        if (typeof window === "undefined") return

        const cfg = () => configRef.current
        let cancelled = false
        let raf = 0
        const timers: number[] = []
        const disposers: Array<() => void> = []

        const dispose = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            timers.splice(0).forEach((id) => clearTimeout(id))
            disposers.splice(0).forEach((fn) => {
                try {
                    fn()
                } catch {
                    /* listener already detached */
                }
            })
        }

        const complete = () => {
            if (cancelled || completedRef.current) return
            completedRef.current = true
            if (cfg().oncePerSession) {
                writeSessionFlag(cfg().sessionKey || "focus-pull")
            }
            setPhase("done")
            cfg().onComplete?.()
        }

        const settle = () => {
            if (cancelled) return
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            setProgress(1)
            setPhase("settling")
            timers.push(window.setTimeout(complete, SETTLE_DURATION * 1000))
        }

        skipRef.current = () => {
            if (cancelled || completedRef.current) return
            dispose()
            settle()
        }

        const alreadySeen =
            cfg().oncePerSession &&
            readSessionFlag(cfg().sessionKey || "focus-pull")
        const reduced = cfg().respectReducedMotion && prefersReducedMotion()

        if (alreadySeen || reduced) {
            setProgress(1)
            completedRef.current = true
            if (cfg().oncePerSession) {
                writeSessionFlag(cfg().sessionKey || "focus-pull")
            }
            setPhase("done")
            cfg().onComplete?.()
            return () => {
                cancelled = true
                dispose()
            }
        }

        let committed = -1
        const commit = (value: number) => {
            const pct = Math.round(value * 100)
            if (pct === committed) return
            committed = pct
            setProgress(value)
        }

        const runSimulated = () => {
            const total = Math.max(0.001, cfg().duration)
            const ease = EASINGS[cfg().easing] ?? EASINGS.expoOut
            const t0 = performance.now()
            const tick = (now: number) => {
                if (cancelled) return
                const t = clamp01((now - t0) / 1000 / total)
                commit(clamp01(ease(t)))
                if (t >= 1) {
                    settle()
                    return
                }
                raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
        }

        const runAssets = () => {
            const images = Array.from(document.images || [])
            const total = 2 + images.length
            let resolved = 0
            let targetRatio = 0

            const bump = () => {
                resolved = Math.min(total, resolved + 1)
                targetRatio = total <= 0 ? 1 : resolved / total
            }

            if (document.readyState === "complete") {
                bump()
            } else {
                const onLoad = () => bump()
                window.addEventListener("load", onLoad, { once: true })
                disposers.push(() => window.removeEventListener("load", onLoad))
            }

            const fonts = (
                document as Document & { fonts?: { ready?: Promise<unknown> } }
            ).fonts
            if (fonts && typeof fonts.ready?.then === "function") {
                let alive = true
                fonts.ready
                    .then(() => {
                        if (alive) bump()
                    })
                    .catch(() => {
                        if (alive) bump()
                    })
                disposers.push(() => {
                    alive = false
                })
            } else {
                bump()
            }

            images.forEach((img) => {
                if (img.complete) {
                    bump()
                    return
                }
                const handler = () => bump()
                img.addEventListener("load", handler, { once: true })
                img.addEventListener("error", handler, { once: true })
                disposers.push(() => {
                    img.removeEventListener("load", handler)
                    img.removeEventListener("error", handler)
                })
            })

            const minDuration = Math.max(0, cfg().minDuration)
            const maxWait = Math.max(0.1, cfg().maxWait)
            // Aggressive curves such as expoOut distort the reading of real progress.
            const ease = EASINGS[cfg().easing] ?? EASINGS.expoOut
            const t0 = performance.now()
            let displayed = 0
            let last = t0

            const tick = (now: number) => {
                if (cancelled) return
                const dt = Math.min(0.1, (now - last) / 1000)
                last = now
                const elapsed = (now - t0) / 1000
                const timedOut = elapsed >= maxWait
                const gate =
                    minDuration > 0 ? clamp01(elapsed / minDuration) : 1
                const goal = timedOut ? 1 : Math.min(targetRatio, gate)
                const smoothing = 1 - Math.exp(-dt * ASSET_SMOOTHING)
                const next = displayed + (goal - displayed) * smoothing
                displayed = clamp01(Math.max(displayed, next))
                if (goal >= 1 && displayed > 0.995) displayed = 1
                commit(clamp01(ease(displayed)))
                if (displayed >= 1) {
                    settle()
                    return
                }
                raf = requestAnimationFrame(tick)
            }
            raf = requestAnimationFrame(tick)
        }

        const start = () => {
            if (cancelled) return
            setPhase("running")
            cfg().onStart?.()
            if (cfg().progressMode === "assets") runAssets()
            else runSimulated()
        }

        const startDelay = Math.max(0, cfg().delay)
        if (startDelay > 0) {
            setPhase("delay")
            timers.push(window.setTimeout(start, startDelay * 1000))
        } else {
            start()
        }

        return () => {
            cancelled = true
            dispose()
        }
    }, [isStaticRenderer])

    const active = phase !== "done"
    const locked = lockScroll && active && !isStaticRenderer

    useEffect(() => {
        if (!locked || typeof document === "undefined") return
        const body = document.body
        const previousOverflow = body.style.overflow
        const previousPadding = body.style.paddingRight
        const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth
        const currentPadding =
            parseFloat(window.getComputedStyle(body).paddingRight) || 0
        body.style.overflow = "hidden"
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${currentPadding + scrollbarWidth}px`
        }
        return () => {
            body.style.overflow = previousOverflow
            body.style.paddingRight = previousPadding
        }
    }, [locked])

    const skip = useCallback(() => {
        if (!allowSkip) return
        skipRef.current()
    }, [allowSkip])

    useEffect(() => {
        if (isStaticRenderer || !allowSkip || !active) return
        if (typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" || event.key === "Esc") skip()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [isStaticRenderer, allowSkip, active, skip])

    const percent = Math.round(clamp01(progress) * 100)
    const milestone = Math.min(100, Math.floor(percent / 25) * 25)

    const quantized = useMemo(() => {
        const remaining = 1 - clamp01(progress)
        const steps = Math.max(1, Math.round(blurSteps))
        return Math.round(remaining * steps) / steps
    }, [progress, blurSteps])

    const portalHost = portalHostRef.current
    if (isStaticRenderer) return null
    if (!mounted || !portalHost || phase === "done") return null

    const blurPx = Math.max(0, blurStrength) * quantized
    const scaleValue = 1 + (Math.max(1, scaleAmount) - 1) * quantized
    const isRunning = phase === "running"
    const filterValue = `blur(${blurPx.toFixed(2)}px)`
    const imageSource = resolveImageSrc(image)

    const fadeStart = clamp01(fadeOutStart)
    const veilFade =
        fadeStart >= 1
            ? 1
            : clamp01(1 - (clamp01(progress) - fadeStart) / (1 - fadeStart))
    const veilAlpha = clamp01(veilOpacity) * veilFade

    const showBar = barPosition !== "none"
    const hasText = contentType === "text" && !!text
    const hasImage = contentType === "image" && !!imageSource
    const hasContent = hasText || hasImage || showPercentage

    const overlay = (
        <motion.div
            role="status"
            aria-live="polite"
            aria-busy={active}
            aria-label="Page loading overlay"
            tabIndex={allowSkip ? 0 : -1}
            onClick={allowSkip ? skip : undefined}
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === "settling" ? 0 : 1 }}
            transition={{ duration: SETTLE_DURATION, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: "fixed",
                inset: 0,
                zIndex,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                pointerEvents: phase === "settling" ? "none" : "auto",
                cursor: allowSkip ? "pointer" : "default",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: "-4%",
                    backdropFilter: filterValue,
                    WebkitBackdropFilter: filterValue,
                    transform: `scale(${scaleValue.toFixed(4)})`,
                    transformOrigin: "center center",
                    willChange: isRunning
                        ? "backdrop-filter, transform"
                        : "auto",
                }}
            />

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: veilColor,
                    opacity: veilAlpha,
                }}
            />

            {hasContent ? (
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        textAlign: "center",
                        padding: 24,
                        color: textColor,
                        userSelect: "none",
                    }}
                >
                    {hasImage && imageSource ? (
                        <img
                            src={imageSource.src}
                            srcSet={imageSource.srcSet}
                            alt={imageSource.alt}
                            style={{
                                width: imageWidth,
                                height: "auto",
                                display: "block",
                                objectFit: "contain",
                            }}
                        />
                    ) : null}

                    {hasText ? (
                        <div style={{ ...font, color: textColor, margin: 0 }}>
                            {text}
                        </div>
                    ) : null}

                    {showPercentage ? (
                        <div
                            aria-hidden="true"
                            style={{
                                ...font,
                                color: textColor,
                                margin: 0,
                                fontVariantNumeric: "tabular-nums",
                                opacity: hasText || hasImage ? 0.7 : 1,
                            }}
                        >
                            {percent}%
                        </div>
                    ) : null}
                </div>
            ) : null}

            {showBar ? (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: barInset,
                        right: barInset,
                        top: barPosition === "top" ? barInset : undefined,
                        bottom: barPosition === "bottom" ? barInset : undefined,
                        height: Math.max(1, barHeight),
                        borderRadius: barRadius,
                        backgroundColor: trackColor,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: barRadius,
                            backgroundColor: barColor,
                            transformOrigin: "left center",
                            transform: `scaleX(${clamp01(progress).toFixed(4)})`,
                            transition: "transform 120ms linear",
                            willChange: isRunning ? "transform" : "auto",
                        }}
                    />
                </div>
            ) : null}

            <span style={SR_ONLY}>{`Loading ${milestone} percent`}</span>
        </motion.div>
    )

    return createPortal(overlay, portalHost)
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 64
 * @framerDisableUnlink
 */
export default function FocusPull(
    props: Partial<FocusPullProps>
): React.ReactElement | null {
    const isStaticRenderer = useIsStaticRenderer()
    const resolved: FocusPullProps = { ...DEFAULTS, ...props }
    const target = RenderTarget.current()

    if (target === RenderTarget.canvas) {
        return <CanvasPlaceholder progressMode={resolved.progressMode} />
    }

    if (
        isStaticRenderer ||
        target === RenderTarget.export ||
        target === RenderTarget.thumbnail
    ) {
        return null
    }

    return <FocusPullRuntime {...resolved} />
}

FocusPull.displayName = "Focus Pull"

addPropertyControls(FocusPull, {
    // ---------- PROGRESSO ----------
    progressMode: {
        type: ControlType.Enum,
        title: "Progress",
        options: ["simulated", "assets"],
        optionTitles: ["Simulated", "Real assets"],
        defaultValue: "simulated",
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.4,
        max: 8,
        step: 0.1,
        defaultValue: 1.6,
        unit: "s",
        displayStepper: true,
        hidden: (p) => p.progressMode !== "simulated",
    },
    minDuration: {
        type: ControlType.Number,
        title: "Min time",
        min: 0,
        max: 5,
        step: 0.1,
        defaultValue: 0.8,
        unit: "s",
        hidden: (p) => p.progressMode !== "assets",
    },
    maxWait: {
        type: ControlType.Number,
        title: "Max wait",
        min: 1,
        max: 15,
        step: 0.5,
        defaultValue: 5,
        unit: "s",
        hidden: (p) => p.progressMode !== "assets",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0,
        unit: "s",
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["linear", "easeOut", "easeInOut", "expoOut"],
        optionTitles: ["Linear", "Ease out", "Ease in out", "Expo out"],
        defaultValue: "expoOut",
    },

    // ---------- BLUR ----------
    blurStrength: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 32,
        unit: "px",
    },
    blurSteps: {
        type: ControlType.Number,
        title: "Steps",
        min: 4,
        max: 60,
        step: 1,
        defaultValue: 24,
        description: "Lower values improve performance on mobile",
    },
    scaleAmount: {
        type: ControlType.Number,
        title: "Scale",
        min: 1,
        max: 1.15,
        step: 0.005,
        defaultValue: 1.03,
        description: "Subtle zoom out as the page resolves",
    },

    // ---------- VÉU ----------
    veilColor: {
        type: ControlType.Color,
        title: "Veil",
        defaultValue: "#F7F6F3",
    },
    veilOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.35,
    },
    fadeOutStart: {
        type: ControlType.Number,
        title: "Fade at",
        min: 0.3,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
        description: "Progress point where the veil starts to fade",
    },

    // ---------- BARRA ----------
    barPosition: {
        type: ControlType.Enum,
        title: "Bar",
        options: ["top", "bottom", "none"],
        optionTitles: ["Top", "Bottom", "None"],
        defaultValue: "bottom",
        displaySegmentedControl: true,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 1,
        max: 16,
        step: 1,
        defaultValue: 3,
        unit: "px",
        hidden: (p) => p.barPosition === "none",
    },
    barColor: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#111111",
        hidden: (p) => p.barPosition === "none",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track",
        defaultValue: "rgba(17, 17, 17, 0.12)",
        hidden: (p) => p.barPosition === "none",
    },
    barRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 12,
        step: 1,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => p.barPosition === "none",
    },
    barInset: {
        type: ControlType.Number,
        title: "Inset",
        min: 0,
        max: 80,
        step: 2,
        defaultValue: 0,
        unit: "px",
        hidden: (p) => p.barPosition === "none",
    },

    // ---------- CONTEÚDO CENTRAL ----------
    contentType: {
        type: ControlType.Enum,
        title: "Content",
        options: ["none", "text", "image"],
        optionTitles: ["None", "Text", "Image"],
        defaultValue: "none",
        displaySegmentedControl: true,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Loading",
        hidden: (p) => p.contentType !== "text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            letterSpacing: "0.08em",
            lineHeight: "1.2em",
        },
        hidden: (p) => p.contentType !== "text" && !p.showPercentage,
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#111111",
        hidden: (p) => p.contentType !== "text" && !p.showPercentage,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (p) => p.contentType !== "image",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 24,
        max: 400,
        step: 4,
        defaultValue: 120,
        unit: "px",
        hidden: (p) => p.contentType !== "image",
    },
    showPercentage: {
        type: ControlType.Boolean,
        title: "Percent",
        defaultValue: false,
    },

    // ---------- COMPORTAMENTO ----------
    oncePerSession: {
        type: ControlType.Boolean,
        title: "Once",
        defaultValue: true,
        description: "Show only on the first visit of the session",
    },
    sessionKey: {
        type: ControlType.String,
        title: "Key",
        defaultValue: "focus-pull",
        hidden: (p) => !p.oncePerSession,
    },
    lockScroll: {
        type: ControlType.Boolean,
        title: "Lock scroll",
        defaultValue: true,
    },
    allowSkip: {
        type: ControlType.Boolean,
        title: "Skip",
        defaultValue: false,
        description: "Click or press Escape to dismiss",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced motion",
        defaultValue: true,
    },
    zIndex: {
        type: ControlType.Number,
        title: "z-index",
        min: 1,
        max: 999999,
        step: 1,
        defaultValue: 100000,
    },

    // ---------- EVENTOS ----------
    onStart: {
        type: ControlType.EventHandler,
        title: "On start",
    },
    onComplete: {
        type: ControlType.EventHandler,
        title: "On complete",
    },
})
