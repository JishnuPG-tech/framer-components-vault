import * as React from "react"
import {
    motion,
    useTransform,
    useMotionValue,
    type MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface TextScrollHighlightProps {
    text: string
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p"
    font: any
    textColor: string
    pushTextColor: string
    splitMode: "letter" | "word"
    scrollStagger: number
    rotationMode: "2d" | "3d"
    rotation2DStart: number
    rotateXStart: number
    rotateYStart: number
    perspective: number
    spatialDepth: boolean
    depthBlur: number
    depthScale: number
    depthScaleHighlight: number
    depthTranslateZ: number
    waveFX: boolean
    waveAmplitude: number
    repeat: boolean
    direction: "forward" | "reverse"
    startRef: "top" | "center" | "bottom"
    startOffset: number
    style?: React.CSSProperties
}

interface SegmentRange {
    start: number
    end: number
}

interface CharSegment {
    text: string
    index: number
    range: SegmentRange
}

type ParsedSegment =
    | { kind: "space"; text: string }
    | { kind: "word"; text: string; index: number; range: SegmentRange }
    | { kind: "letters"; chars: CharSegment[] }

interface SegmentFxConfig {
    textColor: string
    pushTextColor: string
    spatialDepth: boolean
    depthBlur: number
    depthScale: number
    depthScaleHighlight: number
    depthTranslateZ: number
    waveFX: boolean
    waveAmplitude: number
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function getStartSegmentTransform(fx: SegmentFxConfig): string | undefined {
    if (!fx.spatialDepth) return undefined
    return `scale(${fx.depthScale}) translateZ(${fx.depthTranslateZ}em)`
}

function getStartSegmentFilter(fx: SegmentFxConfig): string | undefined {
    if (!fx.spatialDepth) return undefined
    return fx.depthBlur > 0 ? `blur(${fx.depthBlur}em)` : undefined
}

function getContainerTransformAtProgress(
    progress: number,
    rotationMode: "2d" | "3d",
    rotation2DStart: number,
    rotateXStart: number,
    rotateYStart: number
): string {
    if (rotationMode === "3d") {
        const rx = rotateXStart * (1 - progress)
        const ry = rotateYStart * (1 - progress)
        if (rx === 0 && ry === 0) return "none"
        return `rotateX(${rx}deg) rotateY(${ry}deg)`
    }
    if (rotationMode === "2d") {
        const rz = rotation2DStart * (1 - progress)
        return rz === 0 ? "none" : `rotateZ(${rz}deg)`
    }
    return "none"
}

function measureScrollProgress(element: HTMLElement, startVal: number) {
    const rect = element.getBoundingClientRect()
    const vh = window.innerHeight || 1
    const startTop = startVal * vh
    let endTop = 0.5 * vh - rect.height

    if (endTop >= startTop - 1) {
        endTop = startTop - vh
    }

    const denom = startTop - endTop
    if (Math.abs(denom) < 0.5) {
        return rect.top <= startTop ? 1 : 0
    }
    return clamp((startTop - rect.top) / denom, 0, 1)
}

function collectScrollRoots(element: HTMLElement | null) {
    const roots: Array<Element | Window> = [window]
    if (typeof document !== "undefined") {
        roots.push(document)
    }
    let node = element?.parentElement ?? null
    while (node) {
        const style = window.getComputedStyle(node)
        const overflow = `${style.overflow}|${style.overflowY}|${style.overflowX}`
        if (/(auto|scroll|overlay)/.test(overflow)) {
            roots.push(node)
        }
        node = node.parentElement
    }
    return roots
}

function getSegmentRange(
    index: number,
    totalAnimatable: number,
    scrollStagger: number
): SegmentRange {
    const rand = totalAnimatable > 1 ? index / (totalAnimatable - 1) : 0
    const start = rand * scrollStagger
    const end = start + (1 - scrollStagger)
    return { start, end }
}

function getLocalProgress(pos: number, start: number, end: number) {
    if (end <= start) return pos >= start ? 1 : 0
    return clamp((pos - start) / (end - start), 0, 1)
}

function getHighlightMix(localProgress: number, waveFX: boolean) {
    if (waveFX) {
        if (localProgress <= 0.5) return Math.sin(localProgress * Math.PI)
        return 1
    }
    if (localProgress <= 0.5) return localProgress * 2
    return 1
}

function isHighlighted(
    pos: number,
    start: number,
    end: number,
    waveFX: boolean
) {
    const localProgress = getLocalProgress(pos, start, end)
    if (waveFX) return localProgress >= 0.5
    const stepTrigger = start + (end - start) / 2
    return pos >= stepTrigger
}

function parseSegments(
    text: string,
    splitMode: "letter" | "word",
    scrollStagger: number
) {
    let count = 0
    const segments: ParsedSegment[] = []

    text.split(/(\s+)/).forEach((part) => {
        if (/^\s+$/.test(part)) {
            segments.push({ kind: "space", text: part })
            return
        }

        if (splitMode === "word") {
            const index = count++
            segments.push({
                kind: "word",
                text: part,
                index,
                range: getSegmentRange(index, 0, scrollStagger),
            })
            return
        }

        const chars: CharSegment[] = part.split("").map((char) => {
            const index = count++
            return {
                text: char,
                index,
                range: getSegmentRange(index, 0, scrollStagger),
            }
        })

        segments.push({ kind: "letters", chars })
    })

    const totalAnimatable = count

    segments.forEach((segment) => {
        if (segment.kind === "word") {
            segment.range = getSegmentRange(
                segment.index,
                totalAnimatable,
                scrollStagger
            )
        } else if (segment.kind === "letters") {
            segment.chars.forEach((char) => {
                char.range = getSegmentRange(
                    char.index,
                    totalAnimatable,
                    scrollStagger
                )
            })
        }
    })

    return { segments, totalAnimatable }
}

const WORD_UNIT_STYLE: React.CSSProperties = {
    display: "inline-block",
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
}

const TEXT_FLOW_STYLE: React.CSSProperties = {
    display: "block",
    width: "100%",
    overflow: "visible",
    wordBreak: "normal",
    overflowWrap: "normal",
    hyphens: "manual",
}

const INLINE_SEGMENT_STYLE: React.CSSProperties = {
    display: "inline-block",
    verticalAlign: "bottom",
}

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 120
 */
export default function TextScrollHighlight(props: TextScrollHighlightProps) {
    const {
        text = "Scroll to highlight your headline",
        tag = "h2",
        font,
        textColor = "#111111",
        pushTextColor = "#FF5500",
        splitMode = "word",
        scrollStagger = 0.5,
        rotationMode = "2d",
        rotation2DStart = 0,
        rotateXStart = 12,
        rotateYStart = 0,
        perspective = 21,
        spatialDepth = false,
        depthBlur = 0.17,
        depthScale = 0.95,
        depthScaleHighlight = 1.05,
        depthTranslateZ = -0.42,
        waveFX = false,
        waveAmplitude = 0.25,
        repeat = false,
        direction = "forward",
        startRef = "bottom",
        startOffset = 0,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()
    const isDesignPreview = isCanvas
    const isReverse = direction === "reverse"
    const containerRef = React.useRef<HTMLDivElement>(null)

    const startVal =
        startRef === "top"
            ? startOffset / 100
            : startRef === "center"
              ? 0.5 + startOffset / 100
              : 1 - startOffset / 100

    const effectiveScroll = useMotionValue(isDesignPreview ? 1 : 0)
    const visualScroll = useTransform(
        effectiveScroll,
        [0, 1],
        isReverse ? [1, 0] : [0, 1]
    )

    React.useEffect(() => {
        if (isDesignPreview || isStatic) return

        const element = containerRef.current
        if (!element) return

        effectiveScroll.set(0)

        let rafId = 0
        let bootRaf1 = 0
        let bootRaf2 = 0
        let frameScheduled = false
        let settleFrames = 0
        const SETTLE_FRAMES = 4

        const applyProgress = (latest: number, allowDecrease: boolean) => {
            const value = clamp(latest, 0, 1)
            if (repeat || allowDecrease) {
                effectiveScroll.set(value)
                return
            }
            if (value > effectiveScroll.get()) {
                effectiveScroll.set(value)
            }
        }

        const update = () => {
            frameScheduled = false
            const latest = measureScrollProgress(element, startVal)
            if (settleFrames < SETTLE_FRAMES) {
                settleFrames += 1
                applyProgress(latest, true)
                return
            }
            applyProgress(latest, false)
        }

        const scheduleUpdate = () => {
            if (frameScheduled) return
            frameScheduled = true
            rafId = requestAnimationFrame(update)
        }

        bootRaf1 = requestAnimationFrame(() => {
            bootRaf2 = requestAnimationFrame(scheduleUpdate)
        })

        const scrollRoots = collectScrollRoots(element)
        scrollRoots.forEach((root) => {
            root.addEventListener("scroll", scheduleUpdate, { passive: true })
        })
        window.addEventListener("resize", scheduleUpdate)

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(scheduleUpdate)
                : null
        resizeObserver?.observe(element)

        return () => {
            cancelAnimationFrame(rafId)
            cancelAnimationFrame(bootRaf1)
            cancelAnimationFrame(bootRaf2)
            scrollRoots.forEach((root) => {
                root.removeEventListener("scroll", scheduleUpdate)
            })
            window.removeEventListener("resize", scheduleUpdate)
            resizeObserver?.disconnect()
        }
    }, [
        isDesignPreview,
        isStatic,
        effectiveScroll,
        startVal,
        repeat,
        text,
        splitMode,
        scrollStagger,
    ])

    const hasRotation =
        rotationMode === "3d"
            ? rotateXStart !== 0 || rotateYStart !== 0
            : rotation2DStart !== 0

    const containerTransform = useTransform(visualScroll, (progress) =>
        getContainerTransformAtProgress(
            progress,
            rotationMode,
            rotation2DStart,
            rotateXStart,
            rotateYStart
        )
    )

    const cleanedFont = React.useMemo(() => {
        if (!font) return {}
        const { variant, ...rest } = font
        const fontStyle: React.CSSProperties = { ...rest }

        if (
            variant &&
            (fontStyle.fontWeight == null || fontStyle.fontStyle == null)
        ) {
            const italic = String(variant).toLowerCase().includes("italic")
            if (fontStyle.fontStyle == null) {
                fontStyle.fontStyle = italic ? "italic" : "normal"
            }

            const weightMap: Record<string, number> = {
                thin: 100,
                "extra light": 200,
                light: 300,
                regular: 400,
                medium: 500,
                semibold: 600,
                bold: 700,
                "extra bold": 800,
                black: 900,
            }
            const normalized = String(variant)
                .replace(/\s*Italic\s*$/i, "")
                .trim()
                .toLowerCase()

            if (fontStyle.fontWeight == null) {
                fontStyle.fontWeight =
                    weightMap[normalized] ??
                    (normalized === "variable" ? 400 : undefined)
            }
        }

        if (fontStyle.fontVariationSettings && fontStyle.fontWeight != null) {
            fontStyle.fontWeight = "normal"
        }

        return fontStyle
    }, [font])

    const { fontSize, ...letterFontProps } = cleanedFont
    const effectiveFontSize = fontSize || "48px"

    const strictLineHeight = React.useMemo(() => {
        const lh = cleanedFont.lineHeight
        if (!lh) return "1.2em"
        const str = String(lh).trim()
        return !isNaN(Number(str)) ? `${str}em` : str
    }, [cleanedFont.lineHeight])

    const { segments } = React.useMemo(
        () => parseSegments(text, splitMode, scrollStagger),
        [text, splitMode, scrollStagger]
    )

    const fxConfig = React.useMemo<SegmentFxConfig>(
        () => ({
            textColor,
            pushTextColor,
            spatialDepth,
            depthBlur,
            depthScale,
            depthScaleHighlight,
            depthTranslateZ,
            waveFX,
            waveAmplitude,
        }),
        [
            textColor,
            pushTextColor,
            spatialDepth,
            depthBlur,
            depthScale,
            depthScaleHighlight,
            depthTranslateZ,
            waveFX,
            waveAmplitude,
        ]
    )

    const hasSegmentFx = spatialDepth || waveFX
    const needs3DContext = rotationMode === "3d" || spatialDepth

    const Tag = tag as keyof JSX.IntrinsicElements

    return (
        <Tag
            ref={containerRef}
            aria-label={text}
            style={{
                position: "relative",
                display: "block",
                width: "100%",
                boxSizing: "border-box",
                margin: 0,
                overflow: "visible",
                fontSize: effectiveFontSize,
                ...style,
            }}
        >
            <div
                style={{
                    width: "100%",
                    overflow: "visible",
                    perspective:
                        rotationMode === "3d" ? `${perspective}em` : undefined,
                    perspectiveOrigin: "50% 50%",
                }}
            >
                <motion.div
                    style={{
                        width: "100%",
                        overflow: "visible",
                        transform: containerTransform,
                        transformStyle: needs3DContext
                            ? "preserve-3d"
                            : undefined,
                        transformOrigin: "50% 100%",
                        willChange: hasRotation ? "transform" : undefined,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            ...TEXT_FLOW_STYLE,
                            height: "auto",
                            fontSize: effectiveFontSize,
                            lineHeight: strictLineHeight,
                            textAlign: "inherit",
                            transformStyle: needs3DContext
                                ? "preserve-3d"
                                : undefined,
                            ...letterFontProps,
                        }}
                    >
                        {segments.map((segment, i) => {
                            if (segment.kind === "space") {
                                return (
                                    <React.Fragment key={`space-${i}`}>
                                        {segment.text}
                                    </React.Fragment>
                                )
                            }

                            if (segment.kind === "letters") {
                                return (
                                    <span
                                        key={`word-${i}`}
                                        style={{
                                            ...WORD_UNIT_STYLE,
                                            transformStyle: needs3DContext
                                                ? "preserve-3d"
                                                : undefined,
                                        }}
                                    >
                                        {segment.chars.map((char) => {
                                            if (isDesignPreview) {
                                                return (
                                                    <StaticSegment
                                                        key={char.index}
                                                        text={char.text}
                                                        textColor={
                                                            isReverse
                                                                ? textColor
                                                                : pushTextColor
                                                        }
                                                    />
                                                )
                                            }
                                            if (isStatic) {
                                                return isReverse ? (
                                                    <StaticSegment
                                                        key={char.index}
                                                        text={char.text}
                                                        textColor={
                                                            pushTextColor
                                                        }
                                                    />
                                                ) : (
                                                    <StartSegment
                                                        key={char.index}
                                                        text={char.text}
                                                        fx={fxConfig}
                                                        preserve3D={
                                                            spatialDepth
                                                        }
                                                    />
                                                )
                                            }
                                            return (
                                                <AnimatedSegment
                                                    key={char.index}
                                                    text={char.text}
                                                    range={char.range}
                                                    scrollYProgress={
                                                        visualScroll
                                                    }
                                                    fx={fxConfig}
                                                    hasFx={hasSegmentFx}
                                                    preserve3D={spatialDepth}
                                                />
                                            )
                                        })}
                                    </span>
                                )
                            }

                            if (isDesignPreview) {
                                return (
                                    <StaticSegment
                                        key={`word-${i}`}
                                        text={segment.text}
                                        textColor={
                                            isReverse
                                                ? textColor
                                                : pushTextColor
                                        }
                                        nowrap
                                    />
                                )
                            }

                            if (isStatic) {
                                return isReverse ? (
                                    <StaticSegment
                                        key={`word-${i}`}
                                        text={segment.text}
                                        textColor={pushTextColor}
                                        nowrap
                                    />
                                ) : (
                                    <StartSegment
                                        key={`word-${i}`}
                                        text={segment.text}
                                        fx={fxConfig}
                                        preserve3D={spatialDepth}
                                        nowrap
                                    />
                                )
                            }

                            return (
                                <AnimatedSegment
                                    key={`word-${i}`}
                                    text={segment.text}
                                    range={segment.range}
                                    scrollYProgress={visualScroll}
                                    fx={fxConfig}
                                    hasFx={hasSegmentFx}
                                    preserve3D={spatialDepth}
                                    nowrap
                                />
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </Tag>
    )
}

TextScrollHighlight.defaultProps = {
    text: "Scroll to highlight your headline",
    tag: "h2",
    textColor: "#111111",
    pushTextColor: "#FF5500",
    splitMode: "word",
    scrollStagger: 0.5,
    rotationMode: "2d",
    rotation2DStart: 0,
    rotateXStart: 12,
    rotateYStart: 0,
    perspective: 21,
    spatialDepth: false,
    depthBlur: 0.17,
    depthScale: 0.95,
    depthScaleHighlight: 1.05,
    depthTranslateZ: -0.42,
    waveFX: false,
    waveAmplitude: 0.25,
    repeat: false,
    direction: "forward",
    startRef: "bottom",
    startOffset: 0,
}

const StaticSegment = React.memo(function StaticSegment({
    text,
    textColor,
    nowrap = false,
}: {
    text: string
    textColor: string
    nowrap?: boolean
}) {
    return (
        <span
            style={{
                ...INLINE_SEGMENT_STYLE,
                color: textColor,
                whiteSpace: nowrap ? "nowrap" : undefined,
            }}
        >
            {text}
        </span>
    )
})

const StartSegment = React.memo(function StartSegment({
    text,
    fx,
    preserve3D,
    nowrap = false,
}: {
    text: string
    fx: SegmentFxConfig
    preserve3D: boolean
    nowrap?: boolean
}) {
    const hasFx = fx.spatialDepth || fx.waveFX
    return (
        <span
            style={{
                ...INLINE_SEGMENT_STYLE,
                color: fx.textColor,
                whiteSpace: nowrap ? "nowrap" : undefined,
                transformOrigin: hasFx ? "50% 50%" : undefined,
                transformStyle: preserve3D ? "preserve-3d" : undefined,
                transform: getStartSegmentTransform(fx),
                filter: getStartSegmentFilter(fx),
            }}
        >
            {text}
        </span>
    )
})

interface AnimatedSegmentProps {
    text: string
    range: SegmentRange
    scrollYProgress: MotionValue<number>
    fx: SegmentFxConfig
    hasFx: boolean
    preserve3D: boolean
    nowrap?: boolean
}

const ColorSegment = React.memo(function ColorSegment({
    text,
    range,
    scrollYProgress,
    fx,
    nowrap,
}: AnimatedSegmentProps) {
    const { start, end } = range

    const color = useTransform(scrollYProgress, (pos) =>
        isHighlighted(pos, start, end, fx.waveFX)
            ? fx.pushTextColor
            : fx.textColor
    )

    return (
        <motion.span
            style={{
                ...INLINE_SEGMENT_STYLE,
                whiteSpace: nowrap ? "nowrap" : undefined,
                color,
            }}
        >
            {text}
        </motion.span>
    )
})

const FxSegment = React.memo(function FxSegment({
    text,
    range,
    scrollYProgress,
    fx,
    preserve3D,
    nowrap,
}: AnimatedSegmentProps) {
    const { start, end } = range

    const color = useTransform(scrollYProgress, (pos) =>
        isHighlighted(pos, start, end, fx.waveFX)
            ? fx.pushTextColor
            : fx.textColor
    )

    const transform = useTransform(scrollYProgress, (pos) => {
        const localProgress = getLocalProgress(pos, start, end)
        const mix = getHighlightMix(localProgress, fx.waveFX)
        const parts: string[] = []

        if (fx.waveFX) {
            const offset = Math.sin(localProgress * Math.PI) * -fx.waveAmplitude
            parts.push(`translateY(${offset}em)`)
        }

        if (fx.spatialDepth) {
            const scale =
                fx.depthScale + (fx.depthScaleHighlight - fx.depthScale) * mix
            const z = fx.depthTranslateZ * (1 - mix)
            parts.push(`scale(${scale})`, `translateZ(${z}em)`)
        }

        return parts.length > 0 ? parts.join(" ") : undefined
    })

    const filter = useTransform(scrollYProgress, (pos) => {
        if (!fx.spatialDepth) return undefined
        const localProgress = getLocalProgress(pos, start, end)
        const mix = getHighlightMix(localProgress, fx.waveFX)
        const amount = fx.depthBlur * (1 - mix)
        return amount > 0 ? `blur(${amount}em)` : undefined
    })

    return (
        <motion.span
            style={{
                ...INLINE_SEGMENT_STYLE,
                whiteSpace: nowrap ? "nowrap" : undefined,
                transformOrigin: "50% 50%",
                transformStyle: preserve3D ? "preserve-3d" : undefined,
                color,
                transform,
                filter,
            }}
        >
            {text}
        </motion.span>
    )
})

function AnimatedSegment(props: AnimatedSegmentProps) {
    if (props.hasFx) return <FxSegment {...props} />
    return <ColorSegment {...props} />
}

addPropertyControls(TextScrollHighlight, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Scroll to highlight your headline",
        displayTextArea: true,
    },
    tag: {
        type: ControlType.Enum,
        title: "HTML Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph"],
        defaultValue: "h2",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Initial Color",
        defaultValue: "#111111",
    },
    pushTextColor: {
        type: ControlType.Color,
        title: "Highlight Color",
        defaultValue: "#FF5500",
    },
    splitMode: {
        type: ControlType.Enum,
        title: "Split By",
        options: ["letter", "word"],
        optionTitles: ["Letter", "Word"],
        defaultValue: "word",
        displaySegmentedControl: true,
    },
    scrollStagger: {
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0.05,
        max: 2,
        step: 0.05,
        title: "Scroll Stagger",
    },
    rotationMode: {
        type: ControlType.Enum,
        title: "Rotation",
        options: ["2d", "3d"],
        optionTitles: ["2D", "3D"],
        defaultValue: "2d",
        displaySegmentedControl: true,
    },
    rotation2DStart: {
        type: ControlType.Number,
        title: "Rotation (°)",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
        displayStepper: true,
        hidden: (props) => props.rotationMode !== "2d",
    },
    rotateXStart: {
        type: ControlType.Number,
        title: "Tilt X (°)",
        defaultValue: 12,
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        displayStepper: true,
        hidden: (props) => props.rotationMode !== "3d",
    },
    rotateYStart: {
        type: ControlType.Number,
        title: "Tilt Y (°)",
        defaultValue: 0,
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        displayStepper: true,
        hidden: (props) => props.rotationMode !== "3d",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 21,
        min: 4,
        max: 120,
        step: 0.5,
        unit: "em",
        displayStepper: true,
        hidden: (props) => props.rotationMode !== "3d",
    },
    spatialDepth: {
        type: ControlType.Boolean,
        title: "Spatial Depth",
        defaultValue: false,
    },
    depthBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 0.17,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "em",
        displayStepper: true,
        hidden: (props) => !props.spatialDepth,
    },
    depthScale: {
        type: ControlType.Number,
        title: "Scale (Hidden)",
        defaultValue: 0.95,
        min: 0.5,
        max: 1,
        step: 0.01,
        hidden: (props) => !props.spatialDepth,
    },
    depthScaleHighlight: {
        type: ControlType.Number,
        title: "Scale (Active)",
        defaultValue: 1.05,
        min: 1,
        max: 1.5,
        step: 0.01,
        hidden: (props) => !props.spatialDepth,
    },
    depthTranslateZ: {
        type: ControlType.Number,
        title: "Depth (Z)",
        defaultValue: -0.42,
        min: -1.67,
        max: 0,
        step: 0.01,
        unit: "em",
        displayStepper: true,
        hidden: (props) => !props.spatialDepth,
    },
    waveFX: {
        type: ControlType.Boolean,
        title: "Wave FX",
        defaultValue: false,
    },
    waveAmplitude: {
        type: ControlType.Number,
        title: "Wave Height",
        defaultValue: 0.25,
        min: -2,
        max: 2,
        step: 0.05,
        unit: "em",
        displayStepper: true,
        hidden: (props) => !props.waveFX,
    },
    repeat: {
        type: ControlType.Boolean,
        title: "Repeat",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["forward", "reverse"],
        optionTitles: ["Forward", "Reverse"],
        defaultValue: "forward",
        displaySegmentedControl: true,
    },
    startRef: {
        type: ControlType.Enum,
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        defaultValue: "bottom",
        title: "Start Reference",
    },
    startOffset: {
        type: ControlType.Number,
        defaultValue: 0,
        min: -120,
        max: 120,
        step: 1,
        title: "Start Offset (%)",
        description:
            "Crafted with 🖤 by Igor.\n\nGrab more [Framer components](https://www.framer.com/%40igor-reif/), and if this freebie saved you some time, feel free to [Buy me a beer](https://revolut.me/ireif). Cheers!🍻",
    },
})
