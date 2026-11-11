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
    animate,
    motion,
    useInView,
    useMotionValue,
    useReducedMotion,
} from "framer-motion"

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type Testimonial = {
    quote?: string
    name?: string
    byline?: string
    image?: ResponsiveImage | string
    altText?: string
    imageFit?: "cover" | "contain"
    focalX?: number
    focalY?: number
    imageZoom?: number
}

type TestimonialRotationProps = {
    testimonials?: Testimonial[]
    autoplay?: boolean
    duration?: number
    pauseOnHover?: boolean
    respectReducedMotion?: boolean

    quoteTypography?: React.CSSProperties
    nameTypography?: React.CSSProperties
    bylineTypography?: React.CSSProperties
    quoteColor?: string
    nameColor?: string
    bylineColor?: string
    background?: string

    showProgress?: boolean
    progressColor?: string
    progressTrackColor?: string
    progressHeight?: number
    progressGap?: number

    showArrows?: boolean
    arrowColor?: string
    arrowSize?: number
    arrowGap?: number
    arrowToProgressGap?: number

    avatarSize?: number
    avatarBackground?: string
    padding?: number
    cornerRadius?: number
    progressToQuoteGap?: number
    quoteToAuthorGap?: number
    authorGap?: number
    profileLineGap?: number

    lineDuration?: number
    lineStagger?: number
    lineOffset?: number
    blurAmount?: number
    authorDelay?: number

    ariaLabel?: string
    style?: React.CSSProperties
}

type PlaybackControls = {
    pause: () => void
    play: () => void
    stop: () => void
}

type WrappedLineResult = {
    lines: string[]
    measureRef: React.RefObject<HTMLDivElement>
}

const DEFAULT_QUOTE_TYPOGRAPHY: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.25,
    letterSpacing: -0.4,
    textAlign: "left",
}

const DEFAULT_NAME_TYPOGRAPHY: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 17,
    fontWeight: 500,
    lineHeight: 1.25,
    letterSpacing: -0.2,
    textAlign: "left",
}

const DEFAULT_BYLINE_TYPOGRAPHY: React.CSSProperties = {
    ...DEFAULT_NAME_TYPOGRAPHY,
    fontWeight: 400,
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
    {
        quote: "Working with Konstantin was refreshing, he actually took the time to understand what we were building before jumping into design. The rebrand captured exactly the tone we were going for, and the process felt collaborative from start to finish. We're already looking forward to working together again.",
        name: "Gary Fox",
        byline: "Founder, The Entrepreneur Experiment",
        altText: "Portrait of Gary Fox",
        imageFit: "cover",
        focalX: 50,
        focalY: 50,
        imageZoom: 1,
    },
    {
        quote: "The process was clear, thoughtful and surprisingly fast. Every decision felt intentional, and the final result gave our brand exactly the confidence it had been missing.",
        name: "Alex Morgan",
        byline: "Creative Director, North & Co.",
        altText: "Portrait of Alex Morgan",
        imageFit: "cover",
        focalX: 50,
        focalY: 50,
        imageZoom: 1,
    },
    {
        quote: "From the first workshop to the final handoff, we felt understood. The work is beautiful, but more importantly, it feels unmistakably like us.",
        name: "Maya Chen",
        byline: "Co-Founder, Studio Field",
        altText: "Portrait of Maya Chen",
        imageFit: "cover",
        focalX: 50,
        focalY: 50,
        imageZoom: 1,
    },
]

const visuallyHidden: React.CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

const useIsomorphicLayoutEffect =
    typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function clamp(
    value: number | undefined,
    min: number,
    max: number,
    fallback: number
) {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback
    return Math.min(max, Math.max(min, value))
}

function sameLines(a: string[], b: string[]) {
    return a.length === b.length && a.every((line, index) => line === b[index])
}

function normalizeImage(
    image: ResponsiveImage | string | undefined
): ResponsiveImage | undefined {
    if (!image) return undefined
    return typeof image === "string" ? { src: image } : image
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
}

function profileJustification(
    textAlign: React.CSSProperties["textAlign"]
): React.CSSProperties["justifyContent"] {
    if (textAlign === "center") return "center"
    if (textAlign === "right" || textAlign === "end") return "flex-end"
    return "flex-start"
}

function usePageVisibility() {
    const [isVisible, setIsVisible] = React.useState(() =>
        typeof document === "undefined"
            ? true
            : document.visibilityState !== "hidden"
    )

    React.useEffect(() => {
        if (typeof document === "undefined") return

        const update = () => setIsVisible(document.visibilityState !== "hidden")
        document.addEventListener("visibilitychange", update)
        return () => document.removeEventListener("visibilitychange", update)
    }, [])

    return isVisible
}

function MeasureWords({ text }: { text: string }) {
    const paragraphs = text.replace(/\r/g, "").split("\n")

    return (
        <>
            {paragraphs.map((paragraph, paragraphIndex) => {
                const words = paragraph.trim()
                    ? paragraph.trim().split(/\s+/)
                    : []

                return (
                    <React.Fragment key={paragraphIndex}>
                        {words.length > 0 ? (
                            words.map((word, wordIndex) => (
                                <span
                                    data-line-word
                                    key={`${paragraphIndex}-${wordIndex}`}
                                >
                                    {word}
                                    {wordIndex < words.length - 1 ? " " : ""}
                                </span>
                            ))
                        ) : (
                            <span data-line-word data-empty-line="true">
                                {"\u00A0"}
                            </span>
                        )}
                        {paragraphIndex < paragraphs.length - 1 && <br />}
                    </React.Fragment>
                )
            })}
        </>
    )
}

function useWrappedLines(
    text: string,
    styleSignature: string
): WrappedLineResult {
    const measureRef = React.useRef<HTMLDivElement>(null)
    const [lines, setLines] = React.useState<string[]>(() => {
        const manualLines = text.replace(/\r/g, "").split("\n")
        return manualLines.length > 0 ? manualLines : [""]
    })

    useIsomorphicLayoutEffect(() => {
        let cancelled = false

        const measure = () => {
            if (cancelled) return
            const element = measureRef.current
            if (!element) return

            const wordNodes = Array.from(
                element.querySelectorAll<HTMLElement>("[data-line-word]")
            )

            if (wordNodes.length === 0) {
                setLines((previous) =>
                    sameLines(previous, [""]) ? previous : [""]
                )
                return
            }

            const nextLines: string[] = []
            let currentTop: number | null = null
            let currentWords: string[] = []

            wordNodes.forEach((wordNode) => {
                const top =
                    Math.round(wordNode.getBoundingClientRect().top * 2) / 2
                const word =
                    wordNode.dataset.emptyLine === "true"
                        ? ""
                        : (wordNode.textContent || "").trim()

                if (currentTop !== null && Math.abs(top - currentTop) > 0.75) {
                    nextLines.push(currentWords.join(" "))
                    currentWords = []
                }

                currentTop = top
                currentWords.push(word)
            })

            if (currentWords.length > 0) nextLines.push(currentWords.join(" "))
            if (nextLines.length === 0) nextLines.push("")

            setLines((previous) =>
                sameLines(previous, nextLines) ? previous : nextLines
            )
        }

        measure()

        const observer =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(measure)
                : undefined

        if (measureRef.current) observer?.observe(measureRef.current)

        if (typeof window !== "undefined") {
            window.addEventListener("resize", measure)
        }

        if (typeof document !== "undefined" && document.fonts) {
            document.fonts.ready.then(measure)
            document.fonts.addEventListener?.("loadingdone", measure)
        }

        return () => {
            cancelled = true
            observer?.disconnect()
            if (typeof window !== "undefined") {
                window.removeEventListener("resize", measure)
            }
            if (typeof document !== "undefined" && document.fonts) {
                document.fonts.removeEventListener?.("loadingdone", measure)
            }
        }
    }, [text, styleSignature])

    return { lines, measureRef }
}

function LineReveal({
    text,
    measurement,
    delay,
    lineDuration,
    lineStagger,
    lineOffset,
    blurAmount,
    reduceMotion,
}: {
    text: string
    measurement: WrappedLineResult
    delay: number
    lineDuration: number
    lineStagger: number
    lineOffset: number
    blurAmount: number
    reduceMotion: boolean
}) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                minWidth: 0,
                whiteSpace: "normal",
                wordBreak: "normal",
                overflowWrap: "normal",
            }}
        >
            <span style={visuallyHidden}>{text}</span>

            <div
                ref={measurement.measureRef}
                aria-hidden="true"
                style={{
                    width: "100%",
                    visibility: "hidden",
                    pointerEvents: "none",
                    whiteSpace: "normal",
                    wordBreak: "normal",
                    overflowWrap: "normal",
                }}
            >
                <MeasureWords text={text} />
            </div>

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    pointerEvents: "none",
                }}
            >
                {measurement.lines.map((line, index) => (
                    <span
                        key={`${index}-${line}`}
                        style={{
                            display: "block",
                            overflow: "hidden",
                            marginBlock: "-0.12em",
                            paddingBlock: "0.12em",
                        }}
                    >
                        <motion.span
                            initial={
                                reduceMotion
                                    ? false
                                    : {
                                          opacity: 0,
                                          y: lineOffset,
                                          filter: `blur(${blurAmount}px)`,
                                      }
                            }
                            animate={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                            }}
                            transition={{
                                duration: reduceMotion ? 0 : lineDuration,
                                delay: reduceMotion
                                    ? 0
                                    : delay + index * lineStagger,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                display: "block",
                                whiteSpace: "pre",
                                willChange: reduceMotion
                                    ? undefined
                                    : "transform, opacity, filter",
                            }}
                        >
                            {line || "\u00A0"}
                        </motion.span>
                    </span>
                ))}
            </div>
        </div>
    )
}

function Avatar({
    item,
    size,
    background,
    color,
    delay,
    reduceMotion,
}: {
    item: Testimonial
    size: number
    background: string
    color: string
    delay: number
    reduceMotion: boolean
}) {
    const image = normalizeImage(item.image)
    const name = item.name?.trim() || ""
    const alt = item.altText?.trim() || image?.alt || ""
    const focalX = clamp(item.focalX, 0, 100, 50)
    const focalY = clamp(item.focalY, 0, 100, 50)
    const zoom = clamp(item.imageZoom, 1, 3, 1)

    return (
        <motion.div
            initial={
                reduceMotion
                    ? false
                    : {
                          scale: 0,
                          opacity: 0,
                      }
            }
            animate={{ scale: 1, opacity: 1 }}
            transition={
                reduceMotion
                    ? { duration: 0 }
                    : {
                          type: "spring",
                          stiffness: 380,
                          damping: 26,
                          delay,
                      }
            }
            style={{
                position: "relative",
                width: size,
                height: size,
                flex: `0 0 ${size}px`,
                overflow: "hidden",
                borderRadius: "50%",
                background,
                transformOrigin: "center",
            }}
        >
            {image?.src ? (
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    sizes={`${size}px`}
                    alt={alt}
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit:
                            item.imageFit === "contain" ? "contain" : "cover",
                        objectPosition: `${focalX}% ${focalY}%`,
                        transform: `scale(${zoom})`,
                        transformOrigin: `${focalX}% ${focalY}%`,
                    }}
                />
            ) : (
                <span
                    aria-hidden="true"
                    style={{
                        display: "grid",
                        placeItems: "center",
                        width: "100%",
                        height: "100%",
                        color,
                        fontSize: Math.max(11, size * 0.28),
                        fontWeight: 650,
                        lineHeight: 1,
                    }}
                >
                    {getInitials(name)}
                </span>
            )}
        </motion.div>
    )
}

function ArrowButton({
    direction,
    color,
    size,
    onClick,
    reduceMotion,
}: {
    direction: "previous" | "next"
    color: string
    size: number
    onClick: () => void
    reduceMotion: boolean
}) {
    const isPrevious = direction === "previous"
    const hitArea = Math.max(28, size + 10)

    return (
        <motion.button
            type="button"
            aria-label={
                isPrevious
                    ? "Vorheriges Testimonial anzeigen"
                    : "Nächstes Testimonial anzeigen"
            }
            onClick={onClick}
            whileHover={reduceMotion ? undefined : { opacity: 0.58 }}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
                appearance: "none",
                WebkitAppearance: "none",
                display: "grid",
                placeItems: "center",
                width: hitArea,
                height: hitArea,
                padding: 0,
                border: 0,
                color,
                background: "transparent",
                cursor: "pointer",
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d={isPrevious ? "M15 5L8 12L15 19" : "M9 5L16 12L9 19"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </motion.button>
    )
}

function AnimatedCard({
    item,
    index,
    count,
    quoteTypography,
    nameTypography,
    bylineTypography,
    quoteColor,
    nameColor,
    bylineColor,
    avatarSize,
    avatarBackground,
    quoteToAuthorGap,
    authorGap,
    profileLineGap,
    lineDuration,
    lineStagger,
    lineOffset,
    blurAmount,
    authorDelay,
    reduceMotion,
    live,
}: {
    item: Testimonial
    index: number
    count: number
    quoteTypography: React.CSSProperties
    nameTypography: React.CSSProperties
    bylineTypography: React.CSSProperties
    quoteColor: string
    nameColor: string
    bylineColor: string
    avatarSize: number
    avatarBackground: string
    quoteToAuthorGap: number
    authorGap: number
    profileLineGap: number
    lineDuration: number
    lineStagger: number
    lineOffset: number
    blurAmount: number
    authorDelay: number
    reduceMotion: boolean
    live: "off" | "polite"
}) {
    const quote = item.quote || ""
    const name = item.name || ""
    const byline = item.byline || ""
    const image = normalizeImage(item.image)
    const hasAuthor = Boolean(name.trim() || byline.trim() || image?.src)

    const quoteSignature = React.useMemo(
        () => JSON.stringify(quoteTypography),
        [quoteTypography]
    )
    const nameSignature = React.useMemo(
        () => JSON.stringify(nameTypography),
        [nameTypography]
    )
    const bylineSignature = React.useMemo(
        () => JSON.stringify(bylineTypography),
        [bylineTypography]
    )

    const quoteMeasurement = useWrappedLines(quote, quoteSignature)
    const nameMeasurement = useWrappedLines(name, nameSignature)
    const bylineMeasurement = useWrappedLines(byline, bylineSignature)

    const quoteTail =
        Math.max(0, quoteMeasurement.lines.length - 1) * lineStagger +
        lineDuration * 0.55
    const profileStart = quoteTail + authorDelay
    const bylineStart =
        profileStart + Math.max(1, nameMeasurement.lines.length) * lineStagger

    return (
        <motion.figure
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} von ${count}`}
            aria-live={live}
            aria-atomic="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            style={{
                width: "100%",
                minWidth: 0,
                margin: 0,
            }}
        >
            <blockquote
                style={{
                    ...quoteTypography,
                    minWidth: 0,
                    margin: 0,
                    color: quoteColor,
                }}
            >
                <LineReveal
                    text={quote}
                    measurement={quoteMeasurement}
                    delay={0}
                    lineDuration={lineDuration}
                    lineStagger={lineStagger}
                    lineOffset={lineOffset}
                    blurAmount={blurAmount}
                    reduceMotion={reduceMotion}
                />
            </blockquote>

            {hasAuthor && (
                <figcaption
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: profileJustification(
                            nameTypography.textAlign
                        ),
                        gap: authorGap,
                        minWidth: 0,
                        marginTop: quoteToAuthorGap,
                    }}
                >
                    <Avatar
                        item={item}
                        size={avatarSize}
                        background={avatarBackground}
                        color={nameColor}
                        delay={profileStart}
                        reduceMotion={reduceMotion}
                    />

                    <div
                        style={{
                            display: "flex",
                            flex: "1 1 auto",
                            flexDirection: "column",
                            gap: profileLineGap,
                            minWidth: 0,
                        }}
                    >
                        {name && (
                            <div
                                style={{
                                    ...nameTypography,
                                    color: nameColor,
                                    minWidth: 0,
                                }}
                            >
                                <LineReveal
                                    text={name}
                                    measurement={nameMeasurement}
                                    delay={profileStart}
                                    lineDuration={lineDuration}
                                    lineStagger={lineStagger}
                                    lineOffset={lineOffset}
                                    blurAmount={blurAmount}
                                    reduceMotion={reduceMotion}
                                />
                            </div>
                        )}

                        {byline && (
                            <div
                                style={{
                                    ...bylineTypography,
                                    color: bylineColor,
                                    minWidth: 0,
                                }}
                            >
                                <LineReveal
                                    text={byline}
                                    measurement={bylineMeasurement}
                                    delay={bylineStart}
                                    lineDuration={lineDuration}
                                    lineStagger={lineStagger}
                                    lineOffset={lineOffset}
                                    blurAmount={blurAmount}
                                    reduceMotion={reduceMotion}
                                />
                            </div>
                        )}
                    </div>
                </figcaption>
            )}
        </motion.figure>
    )
}

function StaticCardSizer({
    item,
    quoteTypography,
    nameTypography,
    bylineTypography,
    quoteToAuthorGap,
    authorGap,
    profileLineGap,
    avatarSize,
}: {
    item: Testimonial
    quoteTypography: React.CSSProperties
    nameTypography: React.CSSProperties
    bylineTypography: React.CSSProperties
    quoteToAuthorGap: number
    authorGap: number
    profileLineGap: number
    avatarSize: number
}) {
    const name = item.name || ""
    const byline = item.byline || ""
    const image = normalizeImage(item.image)
    const hasAuthor = Boolean(name.trim() || byline.trim() || image?.src)

    return (
        <figure
            style={{
                display: "block",
                gridArea: "1 / 1",
                width: "100%",
                minWidth: 0,
                margin: 0,
                visibility: "hidden",
                pointerEvents: "none",
            }}
        >
            <blockquote
                style={{
                    ...quoteTypography,
                    minWidth: 0,
                    margin: 0,
                    whiteSpace: "pre-wrap",
                }}
            >
                {item.quote || "\u00A0"}
            </blockquote>

            {hasAuthor && (
                <figcaption
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: profileJustification(
                            nameTypography.textAlign
                        ),
                        gap: authorGap,
                        minWidth: 0,
                        marginTop: quoteToAuthorGap,
                    }}
                >
                    <span
                        style={{
                            width: avatarSize,
                            height: avatarSize,
                            flex: `0 0 ${avatarSize}px`,
                        }}
                    />
                    <span
                        style={{
                            display: "flex",
                            flex: "1 1 auto",
                            flexDirection: "column",
                            gap: profileLineGap,
                            minWidth: 0,
                        }}
                    >
                        {name && <span style={nameTypography}>{name}</span>}
                        {byline && (
                            <span style={bylineTypography}>{byline}</span>
                        )}
                    </span>
                </figcaption>
            )}
        </figure>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 360
 */
export default function TestimonialRotation(props: TestimonialRotationProps) {
    const {
        testimonials = DEFAULT_TESTIMONIALS,
        autoplay = true,
        duration = 6,
        pauseOnHover = true,
        respectReducedMotion = true,

        quoteTypography: quoteTypographyProp = DEFAULT_QUOTE_TYPOGRAPHY,
        nameTypography: nameTypographyProp = DEFAULT_NAME_TYPOGRAPHY,
        bylineTypography: bylineTypographyProp = DEFAULT_BYLINE_TYPOGRAPHY,
        quoteColor = "#FFFFFF",
        nameColor = "#DDB39E",
        bylineColor = "#DDB39E",
        background = "rgba(18, 18, 18, 0)",

        showProgress = true,
        progressColor = "#FF4D43",
        progressTrackColor = "rgba(255, 255, 255, 0.08)",
        progressHeight = 2,
        progressGap = 20,

        showArrows = true,
        arrowColor = "#DDB39E",
        arrowSize = 18,
        arrowGap = 2,
        arrowToProgressGap = 6,

        avatarSize = 60,
        avatarBackground = "#D8D2CD",
        padding = 0,
        cornerRadius = 0,
        progressToQuoteGap = 28,
        quoteToAuthorGap = 28,
        authorGap = 18,
        profileLineGap = 1,

        lineDuration = 0.55,
        lineStagger = 0.075,
        lineOffset = 18,
        blurAmount = 8,
        authorDelay = 0.05,

        ariaLabel = "Kundenstimmen",
        style,
    } = props

    const items = Array.isArray(testimonials)
        ? testimonials.filter(Boolean)
        : DEFAULT_TESTIMONIALS
    const count = items.length

    const rootRef = React.useRef<HTMLElement>(null)
    const isInView = useInView(rootRef, { amount: 0.2 })
    const isPageVisible = usePageVisibility()
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReducedMotion = Boolean(useReducedMotion())

    const [activeIndex, setActiveIndex] = React.useState(0)
    const [cycle, setCycle] = React.useState(0)
    const [pointerPaused, setPointerPaused] = React.useState(false)
    const [focusPaused, setFocusPaused] = React.useState(false)

    const boundedIndex = count > 0 ? Math.min(activeIndex, count - 1) : 0
    const safeDuration = clamp(duration, 0.5, 60, 6)
    const reducedMotionActive =
        isStaticRenderer || (respectReducedMotion && prefersReducedMotion)
    const canRotate =
        autoplay && count > 1 && !isStaticRenderer && !reducedMotionActive
    const isPaused =
        canRotate &&
        (pointerPaused || focusPaused || !isInView || !isPageVisible)

    const progress = useMotionValue(canRotate ? 0 : count > 0 ? 1 : 0)
    const timerRef = React.useRef<PlaybackControls | null>(null)
    const timerGeneration = React.useRef(0)
    const pausedRef = React.useRef(isPaused)
    pausedRef.current = isPaused

    const quoteTypography = React.useMemo(
        () => ({
            ...DEFAULT_QUOTE_TYPOGRAPHY,
            ...(quoteTypographyProp || {}),
        }),
        [quoteTypographyProp]
    )
    const nameTypography = React.useMemo(
        () => ({
            ...DEFAULT_NAME_TYPOGRAPHY,
            ...(nameTypographyProp || {}),
        }),
        [nameTypographyProp]
    )
    const bylineTypography = React.useMemo(
        () => ({
            ...DEFAULT_BYLINE_TYPOGRAPHY,
            ...(bylineTypographyProp || {}),
        }),
        [bylineTypographyProp]
    )

    const safeAvatarSize = clamp(avatarSize, 24, 180, 60)
    const safeArrowSize = clamp(arrowSize, 12, 40, 18)
    const safeArrowGap = clamp(arrowGap, 0, 24, 2)
    const safeArrowToProgressGap = clamp(arrowToProgressGap, 0, 48, 6)
    const safeLineDuration = clamp(lineDuration, 0, 2, 0.55)
    const safeLineStagger = clamp(lineStagger, 0, 0.5, 0.075)
    const safeLineOffset = clamp(lineOffset, 0, 80, 18)
    const safeBlur = clamp(blurAmount, 0, 24, 8)
    const safeAuthorDelay = clamp(authorDelay, 0, 2, 0.05)

    useIsomorphicLayoutEffect(() => {
        if (count === 0 && activeIndex !== 0) {
            setActiveIndex(0)
            setCycle((value) => value + 1)
        } else if (count > 0 && activeIndex >= count) {
            setActiveIndex(count - 1)
            setCycle((value) => value + 1)
        }
    }, [activeIndex, count])

    React.useEffect(() => {
        if (!pauseOnHover) setPointerPaused(false)
    }, [pauseOnHover])

    React.useEffect(() => {
        timerRef.current?.stop()
        timerRef.current = null

        const generation = ++timerGeneration.current

        if (!canRotate) {
            progress.set(count > 0 ? 1 : 0)
            return
        }

        progress.set(0)

        const controls = animate(progress, 1, {
            duration: safeDuration,
            ease: "linear",
            onComplete: () => {
                if (timerGeneration.current !== generation) return
                progress.set(0)
                setActiveIndex((current) => (current + 1) % count)
                setCycle((value) => value + 1)
            },
        }) as PlaybackControls

        timerRef.current = controls
        if (pausedRef.current) controls.pause()

        return () => {
            if (timerGeneration.current === generation) {
                timerGeneration.current += 1
            }
            controls.stop()
            if (timerRef.current === controls) timerRef.current = null
        }
    }, [activeIndex, canRotate, count, cycle, progress, safeDuration])

    React.useEffect(() => {
        if (!canRotate || !timerRef.current) return
        if (isPaused) timerRef.current.pause()
        else timerRef.current.play()
    }, [canRotate, isPaused])

    const nextImage =
        count > 1
            ? normalizeImage(items[(boundedIndex + 1) % count]?.image)
            : undefined
    const nextImageSrc = nextImage?.src
    const nextImageSrcSet = nextImage?.srcSet

    React.useEffect(() => {
        if (!nextImageSrc || typeof window === "undefined") return
        const preloader = new window.Image()
        if (nextImageSrcSet) preloader.srcset = nextImageSrcSet
        preloader.src = nextImageSrc
    }, [nextImageSrc, nextImageSrcSet])

    const selectItem = (index: number) => {
        if (index < 0 || index >= count) return
        progress.set(0)
        setActiveIndex(index)
        setCycle((value) => value + 1)
    }

    const handlePointerEnter = (event: React.PointerEvent<HTMLElement>) => {
        if (
            pauseOnHover &&
            (event.pointerType === "mouse" || event.pointerType === "pen")
        ) {
            setPointerPaused(true)
        }
    }

    const handlePointerLeave = () => setPointerPaused(false)

    const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
        const nextTarget = event.relatedTarget
        if (
            !(nextTarget instanceof Node) ||
            !event.currentTarget.contains(nextTarget)
        ) {
            setFocusPaused(false)
        }
    }

    const activeItem = items[boundedIndex]
    const navMargin = showProgress ? clamp(progressToQuoteGap, 0, 160, 28) : 0

    return (
        <section
            ref={rootRef}
            role="region"
            aria-roledescription="carousel"
            aria-label={ariaLabel}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onFocusCapture={() => setFocusPaused(true)}
            onBlurCapture={handleBlur}
            style={{
                position: "relative",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                isolation: "isolate",
                padding: clamp(padding, 0, 160, 0),
                borderRadius: clamp(cornerRadius, 0, 200, 0),
                backgroundColor: background || "transparent",
                color: quoteColor,
                overflow: "visible",
                ...style,
            }}
        >
            {showArrows && count > 1 && (
                <nav
                    aria-label="Testimonial-Navigation"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: safeArrowGap,
                        width: "100%",
                        marginBottom: showProgress
                            ? safeArrowToProgressGap
                            : clamp(progressToQuoteGap, 0, 160, 28),
                    }}
                >
                    <ArrowButton
                        direction="previous"
                        color={arrowColor}
                        size={safeArrowSize}
                        onClick={() =>
                            selectItem((boundedIndex - 1 + count) % count)
                        }
                        reduceMotion={reducedMotionActive}
                    />
                    <ArrowButton
                        direction="next"
                        color={arrowColor}
                        size={safeArrowSize}
                        onClick={() => selectItem((boundedIndex + 1) % count)}
                        reduceMotion={reducedMotionActive}
                    />
                </nav>
            )}

            {showProgress && count > 0 && (
                <nav
                    aria-label={`${ariaLabel} Navigation`}
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                        gap: clamp(progressGap, 0, 80, 20),
                        width: "100%",
                        marginBottom: navMargin,
                    }}
                >
                    {items.map((_, index) => {
                        const isPast = index < boundedIndex
                        const isActive = index === boundedIndex
                        const staticScale = isPast || isActive ? 1 : 0
                        const scale =
                            isActive && canRotate ? progress : staticScale

                        return (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Testimonial ${index + 1} von ${count} anzeigen`}
                                aria-current={isActive ? "true" : undefined}
                                onClick={() => selectItem(index)}
                                style={{
                                    appearance: "none",
                                    WebkitAppearance: "none",
                                    position: "relative",
                                    width: "100%",
                                    height: Math.max(
                                        24,
                                        clamp(progressHeight, 1, 16, 2)
                                    ),
                                    padding: 0,
                                    border: 0,
                                    background: "transparent",
                                    cursor: "pointer",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        right: 0,
                                        left: 0,
                                        height: clamp(progressHeight, 1, 16, 2),
                                        overflow: "hidden",
                                        borderRadius: 999,
                                        background: progressTrackColor,
                                        transform: "translateY(-50%)",
                                    }}
                                >
                                    <motion.span
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            height: "100%",
                                            borderRadius: "inherit",
                                            background: progressColor,
                                            scaleX: scale,
                                            transformOrigin: "0% 50%",
                                        }}
                                    />
                                </span>
                            </button>
                        )
                    })}
                </nav>
            )}

            {activeItem ? (
                <div
                    style={{
                        position: "relative",
                        display: "grid",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            display: "grid",
                            gridArea: "1 / 1",
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        {items.map((item, index) => (
                            <StaticCardSizer
                                key={index}
                                item={item}
                                quoteTypography={quoteTypography}
                                nameTypography={nameTypography}
                                bylineTypography={bylineTypography}
                                quoteToAuthorGap={clamp(
                                    quoteToAuthorGap,
                                    0,
                                    160,
                                    28
                                )}
                                authorGap={clamp(authorGap, 0, 100, 18)}
                                profileLineGap={clamp(profileLineGap, 0, 40, 1)}
                                avatarSize={safeAvatarSize}
                            />
                        ))}
                    </div>

                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            left: 0,
                            width: "100%",
                            minWidth: 0,
                        }}
                    >
                        <AnimatedCard
                            key={`${boundedIndex}-${cycle}`}
                            item={activeItem}
                            index={boundedIndex}
                            count={count}
                            quoteTypography={quoteTypography}
                            nameTypography={nameTypography}
                            bylineTypography={bylineTypography}
                            quoteColor={quoteColor}
                            nameColor={nameColor}
                            bylineColor={bylineColor}
                            avatarSize={safeAvatarSize}
                            avatarBackground={avatarBackground}
                            quoteToAuthorGap={clamp(
                                quoteToAuthorGap,
                                0,
                                160,
                                28
                            )}
                            authorGap={clamp(authorGap, 0, 100, 18)}
                            profileLineGap={clamp(profileLineGap, 0, 40, 1)}
                            lineDuration={safeLineDuration}
                            lineStagger={safeLineStagger}
                            lineOffset={safeLineOffset}
                            blurAmount={safeBlur}
                            authorDelay={safeAuthorDelay}
                            reduceMotion={reducedMotionActive}
                            live={canRotate && !isPaused ? "off" : "polite"}
                        />
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        ...quoteTypography,
                        minHeight: 120,
                        display: "grid",
                        placeItems: "center",
                        color: quoteColor,
                        opacity: 0.55,
                        textAlign: "center",
                    }}
                >
                    Füge mindestens ein Testimonial hinzu.
                </div>
            )}
        </section>
    )
}

TestimonialRotation.defaultProps = {
    testimonials: DEFAULT_TESTIMONIALS,
    autoplay: true,
    duration: 6,
    pauseOnHover: true,
    respectReducedMotion: true,
    quoteTypography: DEFAULT_QUOTE_TYPOGRAPHY,
    nameTypography: DEFAULT_NAME_TYPOGRAPHY,
    bylineTypography: DEFAULT_BYLINE_TYPOGRAPHY,
    quoteColor: "#FFFFFF",
    nameColor: "#DDB39E",
    bylineColor: "#DDB39E",
    background: "rgba(18, 18, 18, 0)",
    showProgress: true,
    progressColor: "#FF4D43",
    progressTrackColor: "rgba(255, 255, 255, 0.08)",
    progressHeight: 2,
    progressGap: 20,
    showArrows: true,
    arrowColor: "#DDB39E",
    arrowSize: 18,
    arrowGap: 2,
    arrowToProgressGap: 6,
    avatarSize: 60,
    avatarBackground: "#D8D2CD",
    padding: 0,
    cornerRadius: 0,
    progressToQuoteGap: 28,
    quoteToAuthorGap: 28,
    authorGap: 18,
    profileLineGap: 1,
    lineDuration: 0.55,
    lineStagger: 0.075,
    lineOffset: 18,
    blurAmount: 8,
    authorDelay: 0.05,
    ariaLabel: "Kundenstimmen",
}

addPropertyControls(TestimonialRotation, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 20,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Zitat",
                    defaultValue: "Dein Testimonial-Zitat",
                    displayTextArea: true,
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Jane Doe",
                },
                byline: {
                    type: ControlType.String,
                    title: "Byline",
                    defaultValue: "Founder, Company",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Bild",
                },
                altText: {
                    type: ControlType.String,
                    title: "Alt-Text",
                    defaultValue: "",
                },
                imageFit: {
                    type: ControlType.Enum,
                    title: "Bildmodus",
                    options: ["cover", "contain"],
                    optionTitles: ["Crop", "Einpassen"],
                    defaultValue: "cover",
                    displaySegmentedControl: true,
                },
                focalX: {
                    type: ControlType.Number,
                    title: "Fokus X",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                focalY: {
                    type: ControlType.Number,
                    title: "Fokus Y",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                imageZoom: {
                    type: ControlType.Number,
                    title: "Zoom",
                    defaultValue: 1,
                    min: 1,
                    max: 3,
                    step: 0.05,
                    displayStepper: true,
                },
            },
        },
        defaultValue: DEFAULT_TESTIMONIALS,
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "An",
        disabledTitle: "Aus",
    },
    duration: {
        type: ControlType.Number,
        title: "Anzeigedauer",
        defaultValue: 6,
        min: 0.5,
        max: 60,
        step: 0.5,
        unit: "s",
        displayStepper: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover-Pause",
        defaultValue: true,
        enabledTitle: "An",
        disabledTitle: "Aus",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Bewegung",
        defaultValue: true,
        enabledTitle: "System",
        disabledTitle: "Immer",
        description: "Respektiert die Systemeinstellung ‚Bewegung reduzieren‘.",
    },

    quoteTypography: {
        type: ControlType.Font,
        title: "Zitat-Stil",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: {
            fontSize: 20,
            lineHeight: 1.25,
            letterSpacing: -0.4,
            textAlign: "left",
            variant: "Medium",
        },
    },
    nameTypography: {
        type: ControlType.Font,
        title: "Name-Stil",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: {
            fontSize: 17,
            lineHeight: 1.25,
            letterSpacing: -0.2,
            textAlign: "left",
            variant: "Medium",
        },
    },
    bylineTypography: {
        type: ControlType.Font,
        title: "Byline-Stil",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: true,
        displayTextAlignment: true,
        defaultValue: {
            fontSize: 17,
            lineHeight: 1.25,
            letterSpacing: -0.2,
            textAlign: "left",
            variant: "Regular",
        },
    },
    quoteColor: {
        type: ControlType.Color,
        title: "Zitatfarbe",
        defaultValue: "#FFFFFF",
    },
    nameColor: {
        type: ControlType.Color,
        title: "Name-Farbe",
        defaultValue: "#DDB39E",
    },
    bylineColor: {
        type: ControlType.Color,
        title: "Byline-Farbe",
        defaultValue: "#DDB39E",
    },
    background: {
        type: ControlType.Color,
        title: "Hintergrund",
        defaultValue: "rgba(18, 18, 18, 0)",
    },

    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
        enabledTitle: "An",
        disabledTitle: "Aus",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress-Farbe",
        defaultValue: "#FF4D43",
    },
    progressTrackColor: {
        type: ControlType.Color,
        title: "Track-Farbe",
        defaultValue: "rgba(255, 255, 255, 0.08)",
    },
    progressHeight: {
        type: ControlType.Number,
        title: "Progress-Höhe",
        defaultValue: 2,
        min: 1,
        max: 16,
        step: 1,
        unit: "px",
    },
    progressGap: {
        type: ControlType.Number,
        title: "Progress-Gap",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Pfeile",
        defaultValue: true,
        enabledTitle: "An",
        disabledTitle: "Aus",
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Pfeilfarbe",
        defaultValue: "#DDB39E",
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Pfeilgröße",
        defaultValue: 18,
        min: 12,
        max: 40,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Pfeilabstand",
        defaultValue: 2,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    arrowToProgressGap: {
        type: ControlType.Number,
        title: "Pfeile → Bars",
        defaultValue: 6,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },

    avatarSize: {
        type: ControlType.Number,
        title: "Avatar",
        defaultValue: 60,
        min: 24,
        max: 180,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    avatarBackground: {
        type: ControlType.Color,
        title: "Avatar-Fallback",
        defaultValue: "#D8D2CD",
    },
    padding: {
        type: ControlType.Number,
        title: "Innenabstand",
        defaultValue: 0,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Eckenradius",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    progressToQuoteGap: {
        type: ControlType.Number,
        title: "Bar → Zitat",
        defaultValue: 28,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    quoteToAuthorGap: {
        type: ControlType.Number,
        title: "Zitat → Profil",
        defaultValue: 28,
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },
    authorGap: {
        type: ControlType.Number,
        title: "Avatar → Text",
        defaultValue: 18,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    profileLineGap: {
        type: ControlType.Number,
        title: "Profil-Zeilen",
        defaultValue: 1,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },

    lineDuration: {
        type: ControlType.Number,
        title: "Reveal-Dauer",
        defaultValue: 0.55,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    lineStagger: {
        type: ControlType.Number,
        title: "Zeilen-Stagger",
        defaultValue: 0.075,
        min: 0,
        max: 0.5,
        step: 0.005,
        unit: "s",
    },
    lineOffset: {
        type: ControlType.Number,
        title: "Slide-Weg",
        defaultValue: 18,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 8,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
    },
    authorDelay: {
        type: ControlType.Number,
        title: "Profil-Delay",
        defaultValue: 0.05,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "s",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA-Label",
        defaultValue: "Kundenstimmen",
    },
})
