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
    animate,
    motion,
    useInView,
    useMotionValue,
    useTransform,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

// User request: add editable height mode controls, hide native scrollbars cross-browser, and improve vertical script safety (including Devanagari) while keeping existing reveal behavior and property controls.

const DEFAULT_COLORS = ["#c679c4", "#fa3d1d", "#ffb005", "#e1e1fe", "#0358f7"]
const BAND_HALF = 17
const SWEEP_START = -BAND_HALF
const SWEEP_END = 100 + BAND_HALF
const TEXT_SWAP_EASE = [0.22, 1, 0.36, 1] as const
const BASE_VERTICAL_BUFFER_EM = 0.45
const BASELINE_OFFSET_PX = -1
const MAX_SHIFT_PX = 2
const MAX_SWAP_BLUR_PX = 4
const SCROLLBAR_HIDE_CLASS = "dia-text-reveal-scrollbar-hide"

interface MyComponentProps {
    textItems: string[]
    textColor: string
    colors: string[]
    duration: number
    delay: number
    easing: "cubic" | "linear" | "easeInOut"
    repeat: boolean
    repeatDelay: number
    trigger: "onView" | "onMount"
    once: boolean
    direction: "leftToRight" | "rightToLeft"
    overflowMode: "hidden" | "visible"
    heightMode: "auto" | "fixed"
    fixedHeight: number
    fixedWidth: boolean
    textStyle: Font
    style?: CSSProperties
}

const sweepEase = (t: number) =>
    t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2

function buildGradient(pos: number, colors: string[], textColor: string) {
    const bandStart = pos - BAND_HALF
    const bandEnd = pos + BAND_HALF

    if (bandStart >= 100) {
        return `linear-gradient(90deg, ${textColor}, ${textColor})`
    }

    const count = colors.length
    const parts: string[] = []

    if (bandStart > 0) {
        parts.push(`${textColor} 0%`, `${textColor} ${bandStart.toFixed(2)}%`)
    }

    colors.forEach((color, index) => {
        const pct =
            count === 1
                ? pos
                : bandStart + (index / (count - 1)) * BAND_HALF * 2

        parts.push(`${color} ${pct.toFixed(2)}%`)
    })

    if (bandEnd < 100) {
        parts.push(`transparent ${bandEnd.toFixed(2)}%`, "transparent 100%")
    }

    return `linear-gradient(90deg, ${parts.join(", ")})`
}

function measureWidths(element: HTMLElement, texts: string[]) {
    if (typeof document === "undefined") return []

    const computed = window.getComputedStyle(element)
    const ghost = document.createElement("span")

    Object.assign(ghost.style, {
        position: "absolute",
        visibility: "hidden",
        pointerEvents: "none",
        width: "max-content",
        minWidth: "max-content",
        whiteSpace: "nowrap",
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
        lineHeight: computed.lineHeight,
        letterSpacing: computed.letterSpacing,
        textTransform: computed.textTransform,
        fontKerning: computed.fontKerning,
        fontVariant: computed.fontVariant,
        fontFeatureSettings: computed.fontFeatureSettings,
    } as CSSProperties)

    document.body.appendChild(ghost)

    const widths = texts.map((entry) => {
        ghost.textContent = entry
        return ghost.getBoundingClientRect().width
    })

    ghost.remove()
    return widths
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function DiaTextReveal(props: MyComponentProps) {
    const {
        textItems = ["Design in motion"],
        colors = DEFAULT_COLORS,
        textColor = "#000000",
        duration = 1.5,
        delay = 0,
        easing = "cubic",
        repeat = false,
        repeatDelay = 0.5,
        trigger = "onView",
        once = true,
        direction = "leftToRight",
        overflowMode = "hidden",
        heightMode = "auto",
        fixedHeight = 60,
        fixedWidth = false,
        textStyle,
        style,
    } = props

    const spanRef = useRef<HTMLSpanElement | null>(null)
    const contentRef = useRef<HTMLSpanElement | null>(null)
    const isStatic = useIsStaticRenderer()
    const [activeIndex, setActiveIndex] = useState(0)
    const [measuredWidths, setMeasuredWidths] = useState<number[]>([])
    const controlsRef = useRef<ReturnType<typeof animate> | null>(null)
    const timerRef = useRef<number | null>(null)
    const indexRef = useRef(0)
    const hasPlayedRef = useRef(false)
    const previousTextKeyRef = useRef("")
    const previousActiveIndexRef = useRef(0)

    const sweepPos = useMotionValue(SWEEP_START)
    const textOpacity = useMotionValue(1)
    const textBlur = useMotionValue(0)
    const textShift = useMotionValue(0)
    const inView = useInView(spanRef, { once, amount: 0.1 })

    const texts = useMemo(
        () =>
            textItems.length > 0
                ? textItems.filter(Boolean)
                : ["Design in motion"],
        [textItems]
    )
    const textKey = useMemo(() => texts.join("\0"), [texts])
    const isMulti = texts.length > 1
    const isVisible = trigger === "onView" ? inView : true

    const backgroundImage = useTransform(sweepPos, (rawPos) => {
        const mappedPos = direction === "rightToLeft" ? 100 - rawPos : rawPos
        return buildGradient(mappedPos, colors, textColor)
    })
    const contentFilter = useTransform(
        textBlur,
        (blur) => `blur(${Math.min(blur, MAX_SWAP_BLUR_PX).toFixed(2)}px)`
    )
    const contentTransform = useTransform(
        textShift,
        (shift) =>
            `translateY(${(BASELINE_OFFSET_PX + Math.min(shift, MAX_SHIFT_PX)).toFixed(2)}px)`
    )

    const fixedW = useMemo(
        () =>
            isMulti && fixedWidth && measuredWidths.length > 0
                ? Math.max(...measuredWidths)
                : undefined,
        [fixedWidth, isMulti, measuredWidths]
    )
    const animatedW = useMemo(
        () =>
            isMulti && !fixedWidth && measuredWidths[activeIndex] != null
                ? measuredWidths[activeIndex]
                : undefined,
        [activeIndex, fixedWidth, isMulti, measuredWidths]
    )
    const verticalBufferEm = useMemo(() => {
        const rawLineHeight = textStyle?.lineHeight
        if (typeof rawLineHeight === "number") {
            return Math.max(BASE_VERTICAL_BUFFER_EM, rawLineHeight * 0.32)
        }
        if (typeof rawLineHeight === "string") {
            const trimmed = rawLineHeight.trim()
            if (trimmed.endsWith("em")) {
                const parsed = Number.parseFloat(trimmed.replace("em", ""))
                if (Number.isFinite(parsed)) {
                    return Math.max(BASE_VERTICAL_BUFFER_EM, parsed * 0.32)
                }
            } else {
                const parsed = Number.parseFloat(trimmed)
                if (Number.isFinite(parsed) && !trimmed.endsWith("px")) {
                    return Math.max(BASE_VERTICAL_BUFFER_EM, parsed * 0.32)
                }
            }
        }
        return BASE_VERTICAL_BUFFER_EM
    }, [textStyle?.lineHeight])

    const clearCycle = useCallback(() => {
        controlsRef.current?.stop()
        controlsRef.current = null
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current)
        }
        timerRef.current = null
    }, [])

    const playRef = useRef<() => void>(() => undefined)
    const sweepEasing = useMemo(() => {
        if (easing === "linear") return "linear" as const
        if (easing === "easeInOut") return [0.42, 0, 0.58, 1] as const
        return sweepEase
    }, [easing])

    playRef.current = () => {
        if (isStatic) {
            sweepPos.set(50)
            return
        }

        clearCycle()
        sweepPos.set(SWEEP_START)

        controlsRef.current = animate(sweepPos, SWEEP_END, {
            duration,
            delay,
            ease: sweepEasing,
            onComplete: () => {
                if (!repeat || texts.length === 0) return
                timerRef.current = setTimeout(() => {
                    const next = (indexRef.current + 1) % texts.length
                    indexRef.current = next
                    startTransition(() => setActiveIndex(next))
                    playRef.current()
                }, repeatDelay * 1000)
            },
        })
    }

    useEffect(() => {
        if (textKey === previousTextKeyRef.current) return
        previousTextKeyRef.current = textKey
        indexRef.current = 0
        startTransition(() => setActiveIndex(0))
        hasPlayedRef.current = false
        clearCycle()
        sweepPos.set(SWEEP_START)
        if (isVisible || isStatic) {
            hasPlayedRef.current = true
            playRef.current()
        }
    }, [clearCycle, isStatic, isVisible, sweepPos, textKey])

    useEffect(() => {
        const element = contentRef.current
        if (!(element && isMulti)) {
            startTransition(() => setMeasuredWidths([]))
            return
        }

        let cancelled = false
        const runMeasure = () => {
            if (cancelled) return
            const next = measureWidths(element, texts)
            startTransition(() => setMeasuredWidths(next))
        }

        runMeasure()

        if (typeof document !== "undefined" && "fonts" in document) {
            void (
                document as Document & { fonts?: FontFaceSet }
            ).fonts?.ready.then(() => {
                runMeasure()
            })
        }

        return () => {
            cancelled = true
        }
    }, [isMulti, texts])

    useEffect(() => {
        if (isStatic) return
        if (!isVisible) {
            if (!once) hasPlayedRef.current = false
            return
        }
        if (once && hasPlayedRef.current) return
        hasPlayedRef.current = true
        playRef.current()
        return clearCycle
    }, [clearCycle, isStatic, isVisible, once])

    useEffect(() => {
        if (!isMulti || isStatic) {
            textOpacity.set(1)
            textBlur.set(0)
            textShift.set(0)
            previousActiveIndexRef.current = activeIndex
            return
        }
        if (previousActiveIndexRef.current === activeIndex) return
        previousActiveIndexRef.current = activeIndex
        textOpacity.set(0.58)
        textBlur.set(MAX_SWAP_BLUR_PX)
        textShift.set(MAX_SHIFT_PX)
        const opacityControls = animate(textOpacity, 1, {
            duration: 0.26,
            ease: TEXT_SWAP_EASE,
        })
        const blurControls = animate(textBlur, 0, {
            duration: 0.34,
            ease: TEXT_SWAP_EASE,
        })
        const shiftControls = animate(textShift, 0, {
            duration: 0.34,
            ease: TEXT_SWAP_EASE,
        })
        return () => {
            opacityControls.stop()
            blurControls.stop()
            shiftControls.stop()
        }
    }, [activeIndex, isMulti, isStatic, textBlur, textOpacity, textShift])

    useEffect(() => clearCycle, [clearCycle])

    const containerStyle = useMemo<CSSProperties>(
        () => ({
            ...style,
            position: "relative",
            display: heightMode === "fixed" ? "inline-flex" : "inline-block",
            alignItems: heightMode === "fixed" ? "center" : undefined,
            overflowX:
                overflowMode === "visible"
                    ? "visible"
                    : isMulti
                      ? "hidden"
                      : "visible",
            overflowY: overflowMode,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            whiteSpace: "nowrap",
            verticalAlign: "bottom",
            boxSizing: "border-box",
            paddingTop: heightMode === "auto" ? `${verticalBufferEm}em` : 0,
            paddingBottom: heightMode === "auto" ? `${verticalBufferEm}em` : 0,
            height: heightMode === "fixed" ? `${fixedHeight}px` : style?.height,
            width:
                overflowMode === "visible"
                    ? style?.width === "100%"
                        ? "max-content"
                        : style?.width
                    : isMulti && fixedW != null
                      ? fixedW
                      : style?.width === "100%" && !isMulti
                        ? "max-content"
                        : style?.width,
            minWidth: !isMulti ? "max-content" : style?.minWidth,
        }),
        [
            fixedHeight,
            fixedW,
            heightMode,
            isMulti,
            overflowMode,
            style,
            verticalBufferEm,
        ]
    )

    useEffect(() => {
        const element = contentRef.current
        if (!(element && isMulti)) return
        if (typeof ResizeObserver === "undefined") return

        const syncRealWidth = () => {
            const realWidth = Math.ceil(
                Math.max(
                    element.scrollWidth,
                    element.getBoundingClientRect().width
                )
            )
            startTransition(() => {
                setMeasuredWidths((prev) => {
                    const next =
                        prev.length > 0 ? [...prev] : texts.map(() => 0)
                    const current = next[activeIndex] ?? 0
                    if (realWidth <= current) return prev
                    next[activeIndex] = realWidth
                    return next
                })
            })
        }

        const observer = new ResizeObserver(() => {
            syncRealWidth()
        })

        observer.observe(element)
        syncRealWidth()

        return () => {
            observer.disconnect()
        }
    }, [activeIndex, isMulti, texts])

    return (
        <>
            <style>
                {`.${SCROLLBAR_HIDE_CLASS}{scrollbar-width:none;-ms-overflow-style:none;}.${SCROLLBAR_HIDE_CLASS}::-webkit-scrollbar{display:none;width:0;height:0;}`}
            </style>
            <motion.span
                ref={spanRef}
                className={SCROLLBAR_HIDE_CLASS}
                animate={
                    overflowMode === "hidden" && isMulti && animatedW != null
                        ? { width: animatedW }
                        : undefined
                }
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={containerStyle}
            >
                <motion.span
                    ref={contentRef}
                    aria-hidden={true}
                    style={{
                        display: "inline-block",
                        minWidth: "max-content",
                        lineHeight: textStyle?.lineHeight ?? "1.2em",
                        color: "transparent",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        backgroundImage,
                        opacity: textOpacity,
                        filter: contentFilter,
                        transform: contentTransform,
                        willChange: "filter, opacity, transform",
                        fontSize: textStyle?.fontSize,
                        letterSpacing: textStyle?.letterSpacing,
                        textAlign: textStyle?.textAlign,
                        fontWeight: textStyle?.fontWeight,
                        fontStyle: textStyle?.fontStyle,
                        fontFamily: textStyle?.fontFamily,
                    }}
                >
                    {texts[activeIndex]}
                </motion.span>
                <span
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        margin: -1,
                        padding: 0,
                        overflow: "hidden",
                        clip: "rect(0, 0, 0, 0)",
                        border: 0,
                    }}
                >
                    {texts[activeIndex]}
                </span>
            </motion.span>
        </>
    )
}

addPropertyControls(DiaTextReveal, {
    textItems: {
        type: ControlType.Array,
        title: "Text",
        control: { type: ControlType.String, placeholder: "Enter text" },
        defaultValue: ["Design that Speaks", "Built for Framer"],
        maxCount: 10,
    },
    textStyle: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "42px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#000000",
    },
    colors: {
        type: ControlType.Array,
        title: "Sweep Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        maxCount: 8,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.5,
        min: 0.1,
        max: 8,
        step: 0.1,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
    },
    easing: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "cubic",
        options: ["cubic", "linear", "easeInOut"],
        optionTitles: ["Cubic", "Linear", "Ease In Out"],
    },
    repeat: {
        type: ControlType.Boolean,
        title: "Cycle Text",
        defaultValue: false,
    },
    repeatDelay: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.5,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: (props) => !props.repeat,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        defaultValue: "onView",
        options: ["onView", "onMount"],
        optionTitles: ["On Scroll Into View", "On Mount"],
    },
    once: {
        type: ControlType.Boolean,
        title: "Play Once",
        defaultValue: true,
        hidden: (props) => props.trigger !== "onView",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "leftToRight",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left → Right", "Right → Left"],
    },
    overflowMode: {
        type: ControlType.Enum,
        title: "Overflow",
        defaultValue: "hidden",
        options: ["hidden", "visible"],
        optionTitles: ["Hidden", "Visible"],
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Height",
        defaultValue: "auto",
        options: ["auto", "fixed"],
        optionTitles: ["Auto", "Fixed"],
    },
    fixedHeight: {
        type: ControlType.Number,
        title: "Fixed Height",
        defaultValue: 60,
        min: 24,
        max: 600,
        step: 1,
        unit: "px",
        hidden: (props) => props.heightMode !== "fixed",
    },
    fixedWidth: {
        type: ControlType.Boolean,
        title: "Fixed Width",
        defaultValue: false,
    },
})
