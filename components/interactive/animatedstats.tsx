import * as React from "react"
// @ts-ignore - ControlType.Font and useIsStaticRenderer work in Framer at runtime.
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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 430
 * @framerIntrinsicHeight 300
 */

type Alignment = "left" | "center" | "right"
type EasingName = "linear" | "easeOutCubic" | "easeOutQuart" | "easeInOutCubic"
type RevealStyle = "fadeUp" | "mask" | "blur" | "scale"
type SplitMode = "word" | "letter"
type AppearTiming = "afterNumber" | "immediate"
type SizingMode = "fit" | "fill"

type StatItem = {
    label?: string
    start?: number
    end?: number
    prefix?: string
    suffix?: string
    decimalPlaces?: number
    description?: string
    customDuration?: number
    customDelay?: number
    highlight?: boolean
}

type AnimatedStatsProps = {
    style?: React.CSSProperties
    stats?: StatItem[]
    numberFont?: React.CSSProperties
    descriptionFont?: React.CSSProperties
    numberColor?: string
    prefixSuffixColor?: string
    descriptionColor?: string
    backgroundColor?: string
    backgroundRadius?: number
    componentPadding?: number
    cardBackgroundColor?: string
    cardBorderColor?: string
    sizing?: SizingMode
    showCards?: boolean
    cardRadius?: number
    maxWidth?: number
    gap?: number
    padding?: number
    columnsDesktop?: number
    columnsTablet?: number
    alignment?: Alignment
    numberSize?: number
    descriptionSize?: number
    contentGap?: number
    scaleWithFrame?: boolean
    numberDuration?: number
    numberEasing?: EasingName
    numberStaggerDelay?: number
    affixScale?: number
    affixGap?: number
    animationsEnabled?: boolean
    triggerThreshold?: number
    triggerOnce?: boolean
    decimalPlacesDefault?: number
    thousandsSeparator?: boolean
    prefixSuffixAnimationStyle?: RevealStyle
    prefixSuffixDuration?: number
    prefixSuffixDelay?: number
    prefixSuffixAppearTiming?: AppearTiming
    descriptionSplitMode?: SplitMode
    descriptionAnimationStyle?: RevealStyle
    descriptionStagger?: number
    descriptionDuration?: number
    descriptionDelay?: number
    descriptionAppearTiming?: AppearTiming
}

const defaultStats: StatItem[] = [
    {
        label: "",
        start: 0,
        end: 3,
        prefix: "",
        suffix: "M+",
        decimalPlaces: 0,
        description: "Organic views\ngenerated",
        customDuration: 1.25,
        customDelay: 0,
        highlight: false,
    },
]

const defaultNumberFont: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 188,
    fontWeight: 900,
    lineHeight: "0.9em",
    letterSpacing: "0em",
}

const defaultDescriptionFont: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 44,
    fontWeight: 700,
    lineHeight: "1.18em",
    letterSpacing: "0em",
}

const defaultNumberFontControl: React.CSSProperties = {
    fontFamily: "Inter",
    fontWeight: 900,
}

const defaultDescriptionFontControl: React.CSSProperties = {
    fontFamily: "Inter",
    fontWeight: 700,
}

const easingFunctions: Record<EasingName, (progress: number) => number> = {
    linear: (progress) => progress,
    easeOutCubic: (progress) => 1 - Math.pow(1 - progress, 3),
    easeOutQuart: (progress) => 1 - Math.pow(1 - progress, 4),
    easeInOutCubic: (progress) =>
        progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2,
}

const alignItemsByTextAlign: Record<
    Alignment,
    React.CSSProperties["alignItems"]
> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}

export default function AnimatedStats(props: AnimatedStatsProps) {
    const {
        stats = defaultStats,
        numberFont = defaultNumberFont,
        descriptionFont = defaultDescriptionFont,
        numberColor = "#061D17",
        prefixSuffixColor = "#CFEFDB",
        descriptionColor = "#061D17",
        backgroundColor = "rgba(247, 250, 246, 0)",
        backgroundRadius = 0,
        componentPadding = 0,
        cardBackgroundColor = "#F7FAF6",
        cardBorderColor = "rgba(6, 29, 23, 0)",
        sizing = "fit",
        showCards = false,
        cardRadius = 0,
        maxWidth = 640,
        gap = 24,
        padding = 0,
        columnsDesktop = 1,
        columnsTablet = 1,
        alignment = "left",
        numberSize = 188,
        descriptionSize = 44,
        contentGap = 0.6,
        scaleWithFrame = true,
        numberDuration = 1.25,
        numberEasing = "easeOutCubic",
        numberStaggerDelay = 0.08,
        affixScale = 1,
        affixGap = 0.06,
        animationsEnabled = true,
        triggerThreshold = 0.35,
        triggerOnce = true,
        decimalPlacesDefault = 0,
        thousandsSeparator = true,
        prefixSuffixAnimationStyle = "fadeUp",
        prefixSuffixDuration = 0.45,
        prefixSuffixDelay = 0.02,
        prefixSuffixAppearTiming = "afterNumber",
        descriptionSplitMode = "word",
        descriptionAnimationStyle = "fadeUp",
        descriptionStagger = 0.035,
        descriptionDuration = 0.5,
        descriptionDelay = 0.1,
        descriptionAppearTiming = "afterNumber",
        style,
    } = props

    const prefersReducedMotion = usePrefersReducedMotion()
    const isStaticRenderer =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const motionDisabled =
        isStaticRenderer || prefersReducedMotion || !animationsEnabled
    const reactId = React.useId()
    const instanceClass = React.useMemo(
        () => `animated-stats-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
        [reactId]
    )

    const safeStats =
        Array.isArray(stats) && stats.length > 0 ? stats : defaultStats
    const isFill = sizing === "fill"
    const hasFrameWidth = hasSizeValue(style?.width)
    const hasFrameHeight = hasSizeValue(style?.height)
    const shouldScaleWithFrame = scaleWithFrame && (isFill || hasFrameWidth)
    const mergedNumberFont = mergeFont(
        defaultNumberFont,
        numberFont,
        numberSize,
        shouldScaleWithFrame,
        hasFrameHeight
    )
    const mergedDescriptionFont = mergeFont(
        defaultDescriptionFont,
        descriptionFont,
        descriptionSize,
        shouldScaleWithFrame,
        hasFrameHeight
    )
    const safeBackgroundRadius = Math.max(0, backgroundRadius)
    const safeComponentPadding = Math.max(0, componentPadding)
    const radiusLayoutInset =
        safeBackgroundRadius > 0 ? safeBackgroundRadius * 0.45 : 0

    const rootStyle = {
        ...style,
        display: isFill ? "block" : "inline-block",
        width: isFill ? "100%" : hasFrameWidth ? style?.width : "fit-content",
        height: hasFrameHeight ? style?.height : "auto",
        maxWidth: maxWidth > 0 ? maxWidth : "none",
        margin: 0,
        backgroundColor,
        borderRadius: safeBackgroundRadius,
        padding: safeComponentPadding + radiusLayoutInset,
        boxSizing: "border-box",
        overflow: safeBackgroundRadius > 0 ? "hidden" : "visible",
        "--animated-stats-gap": `${Math.max(0, gap)}px`,
        "--animated-stats-columns-desktop": clampInteger(columnsDesktop, 1, 6),
        "--animated-stats-columns-tablet": clampInteger(columnsTablet, 1, 4),
    } as React.CSSProperties & Record<string, string | number>

    return (
        <section className={instanceClass} style={rootStyle}>
            <style>{`
                .${instanceClass} {
                    container-type: ${hasFrameHeight ? "size" : "inline-size"};
                }

                .${instanceClass} .animated-stats-grid {
                    display: grid;
                    grid-template-columns: ${
                        isFill
                            ? "repeat(var(--animated-stats-columns-desktop), minmax(0, 1fr))"
                            : "repeat(var(--animated-stats-columns-desktop), max-content)"
                    };
                    gap: var(--animated-stats-gap);
                    width: ${isFill ? "100%" : "fit-content"};
                    height: auto;
                    box-sizing: border-box;
                }

                @media (max-width: 809px) {
                    .${instanceClass} .animated-stats-grid {
                        grid-template-columns: ${
                            isFill
                                ? "repeat(var(--animated-stats-columns-tablet), minmax(0, 1fr))"
                                : "repeat(var(--animated-stats-columns-tablet), max-content)"
                        };
                    }
                }

                @media (max-width: 599px) {
                    .${instanceClass} .animated-stats-grid {
                        grid-template-columns: ${isFill ? "minmax(0, 1fr)" : "max-content"};
                    }
                }
            `}</style>

            <div className="animated-stats-grid">
                {safeStats.map((stat, index) => (
                    <AnimatedStatCard
                        key={getStatKey(stat, index)}
                        stat={stat}
                        index={index}
                        numberFont={mergedNumberFont}
                        descriptionFont={mergedDescriptionFont}
                        numberColor={numberColor}
                        prefixSuffixColor={prefixSuffixColor}
                        descriptionColor={descriptionColor}
                        cardBackgroundColor={cardBackgroundColor}
                        cardBorderColor={cardBorderColor}
                        sizing={sizing}
                        showCards={showCards}
                        cardRadius={cardRadius}
                        padding={padding}
                        alignment={alignment}
                        contentGap={contentGap}
                        numberDuration={numberDuration}
                        numberEasing={numberEasing}
                        numberStaggerDelay={numberStaggerDelay}
                        affixScale={affixScale}
                        affixGap={affixGap}
                        motionDisabled={motionDisabled}
                        triggerThreshold={triggerThreshold}
                        triggerOnce={triggerOnce}
                        decimalPlacesDefault={decimalPlacesDefault}
                        thousandsSeparator={thousandsSeparator}
                        prefixSuffixAnimationStyle={prefixSuffixAnimationStyle}
                        prefixSuffixDuration={prefixSuffixDuration}
                        prefixSuffixDelay={prefixSuffixDelay}
                        prefixSuffixAppearTiming={prefixSuffixAppearTiming}
                        descriptionSplitMode={descriptionSplitMode}
                        descriptionAnimationStyle={descriptionAnimationStyle}
                        descriptionStagger={descriptionStagger}
                        descriptionDuration={descriptionDuration}
                        descriptionDelay={descriptionDelay}
                        descriptionAppearTiming={descriptionAppearTiming}
                    />
                ))}
            </div>
        </section>
    )
}

type AnimatedStatCardProps = {
    stat: StatItem
    index: number
    numberFont: React.CSSProperties
    descriptionFont: React.CSSProperties
    numberColor: string
    prefixSuffixColor: string
    descriptionColor: string
    cardBackgroundColor: string
    cardBorderColor: string
    sizing: SizingMode
    showCards: boolean
    cardRadius: number
    padding: number
    alignment: Alignment
    contentGap: number
    numberDuration: number
    numberEasing: EasingName
    numberStaggerDelay: number
    affixScale: number
    affixGap: number
    motionDisabled: boolean
    triggerThreshold: number
    triggerOnce: boolean
    decimalPlacesDefault: number
    thousandsSeparator: boolean
    prefixSuffixAnimationStyle: RevealStyle
    prefixSuffixDuration: number
    prefixSuffixDelay: number
    prefixSuffixAppearTiming: AppearTiming
    descriptionSplitMode: SplitMode
    descriptionAnimationStyle: RevealStyle
    descriptionStagger: number
    descriptionDuration: number
    descriptionDelay: number
    descriptionAppearTiming: AppearTiming
}

function AnimatedStatCard({
    stat,
    index,
    numberFont,
    descriptionFont,
    numberColor,
    prefixSuffixColor,
    descriptionColor,
    cardBackgroundColor,
    cardBorderColor,
    sizing,
    showCards,
    cardRadius,
    padding,
    alignment,
    contentGap,
    numberDuration,
    numberEasing,
    numberStaggerDelay,
    affixScale,
    affixGap,
    motionDisabled,
    triggerThreshold,
    triggerOnce,
    decimalPlacesDefault,
    thousandsSeparator,
    prefixSuffixAnimationStyle,
    prefixSuffixDuration,
    prefixSuffixDelay,
    prefixSuffixAppearTiming,
    descriptionSplitMode,
    descriptionAnimationStyle,
    descriptionStagger,
    descriptionDuration,
    descriptionDelay,
    descriptionAppearTiming,
}: AnimatedStatCardProps) {
    const isFill = sizing === "fill"
    const cardRef = React.useRef<HTMLElement | null>(null)
    const inView = useInViewport(
        cardRef,
        triggerThreshold,
        triggerOnce,
        motionDisabled
    )

    const start = safeNumber(stat.start, 0)
    const end = safeNumber(stat.end, 0)
    const decimals = clampInteger(
        safeNumber(stat.decimalPlaces, decimalPlacesDefault),
        0,
        8
    )
    const duration =
        safeNumber(stat.customDuration, 0) > 0
            ? safeNumber(stat.customDuration, numberDuration)
            : numberDuration
    const delay =
        Math.max(0, safeNumber(stat.customDelay, 0)) +
        index * numberStaggerDelay

    const { value, isComplete } = useAnimatedNumber({
        start,
        end,
        duration,
        delay,
        easing: numberEasing,
        inView,
        triggerOnce,
        reducedMotion: motionDisabled,
    })

    const displayedValue = formatNumber(value, decimals, thousandsSeparator)
    const finalValue = formatNumber(end, decimals, thousandsSeparator)
    const prefix = stat.prefix || ""
    const suffix = stat.suffix || ""
    const description = stat.description || ""
    const label = stat.label || ""
    const revealAffix =
        motionDisabled ||
        (prefixSuffixAppearTiming === "immediate" ? inView : isComplete)
    const revealDescription =
        motionDisabled ||
        (descriptionAppearTiming === "immediate" ? inView : isComplete)
    const affixRevealDelay =
        prefixSuffixAppearTiming === "immediate" ? 0 : prefixSuffixDelay
    const descriptionRevealDelay =
        descriptionAppearTiming === "immediate" ? 0 : descriptionDelay

    const articleLabel = [label, `${prefix}${finalValue}${suffix}`, description]
        .filter(Boolean)
        .join(". ")

    return (
        <article
            ref={cardRef}
            aria-label={articleLabel || `${finalValue}`}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: alignItemsByTextAlign[alignment],
                justifyContent: "flex-start",
                minWidth: 0,
                width: isFill ? "100%" : "fit-content",
                minHeight: 0,
                height: "auto",
                padding: showCards ? Math.max(0, padding) : 0,
                borderRadius: showCards ? Math.max(0, cardRadius) : 0,
                border: showCards
                    ? `1px solid ${stat.highlight ? prefixSuffixColor : cardBorderColor}`
                    : "none",
                background: showCards ? cardBackgroundColor : "transparent",
                boxShadow:
                    showCards && stat.highlight
                        ? "0 18px 60px rgba(130, 255, 190, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                        : "none",
                boxSizing: "border-box",
                overflow: "visible",
                textAlign: alignment,
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: alignItemsByTextAlign[alignment],
                    width: isFill ? "100%" : "fit-content",
                    minWidth: 0,
                }}
            >
                {label ? (
                    <div
                        style={{
                            ...descriptionFont,
                            color: descriptionColor,
                            opacity: 0.72,
                            marginBottom: 12,
                            textTransform: "uppercase",
                            fontSize: resolveFontSize(
                                descriptionFont.fontSize,
                                12
                            ),
                            lineHeight: "1.1em",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {label}
                    </div>
                ) : null}

                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        justifyContent:
                            alignment === "center"
                                ? "center"
                                : alignment === "right"
                                  ? "flex-end"
                                  : "flex-start",
                        flexWrap: "nowrap",
                        width: isFill ? "100%" : "fit-content",
                        minWidth: 0,
                        color: numberColor,
                        whiteSpace: "nowrap",
                    }}
                >
                    <RevealInline
                        text={prefix}
                        revealed={revealAffix}
                        styleName={prefixSuffixAnimationStyle}
                        duration={prefixSuffixDuration}
                        delay={affixRevealDelay}
                        color={prefixSuffixColor}
                        reducedMotion={motionDisabled}
                        style={{
                            ...numberFont,
                            fontSize: resolveAffixFontSize(
                                numberFont.fontSize,
                                affixScale
                            ),
                            lineHeight: "1em",
                            marginRight: prefix
                                ? `${Math.max(0, affixGap)}em`
                                : 0,
                        }}
                    />

                    <span
                        style={{
                            ...numberFont,
                            color: numberColor,
                            display: "inline-block",
                            minWidth: 0,
                            overflowWrap: "normal",
                            whiteSpace: "nowrap",
                            fontVariantNumeric: "tabular-nums",
                        }}
                    >
                        {displayedValue}
                    </span>

                    <RevealInline
                        text={suffix}
                        revealed={revealAffix}
                        styleName={prefixSuffixAnimationStyle}
                        duration={prefixSuffixDuration}
                        delay={affixRevealDelay}
                        color={prefixSuffixColor}
                        reducedMotion={motionDisabled}
                        style={{
                            ...numberFont,
                            fontSize: resolveAffixFontSize(
                                numberFont.fontSize,
                                affixScale
                            ),
                            lineHeight: "1em",
                            marginLeft: suffix
                                ? `${Math.max(0, affixGap)}em`
                                : 0,
                        }}
                    />
                </div>
            </div>

            {description ? (
                <AnimatedDescription
                    text={description}
                    splitMode={descriptionSplitMode}
                    styleName={descriptionAnimationStyle}
                    revealed={revealDescription}
                    stagger={descriptionStagger}
                    duration={descriptionDuration}
                    delay={descriptionRevealDelay}
                    color={descriptionColor}
                    font={descriptionFont}
                    alignment={alignment}
                    sizing={sizing}
                    contentGap={contentGap}
                    reducedMotion={motionDisabled}
                />
            ) : null}
        </article>
    )
}

type AnimatedNumberOptions = {
    start: number
    end: number
    duration: number
    delay: number
    easing: EasingName
    inView: boolean
    triggerOnce: boolean
    reducedMotion: boolean
}

function useAnimatedNumber({
    start,
    end,
    duration,
    delay,
    easing,
    inView,
    triggerOnce,
    reducedMotion,
}: AnimatedNumberOptions) {
    const [value, setValue] = React.useState(reducedMotion ? end : start)
    const [isComplete, setIsComplete] = React.useState(reducedMotion)
    const frameRef = React.useRef<number | null>(null)
    const timerRef = React.useRef<number | null>(null)
    const hasPlayedRef = React.useRef(false)

    React.useEffect(() => {
        hasPlayedRef.current = false
    }, [start, end, duration, delay, easing])

    React.useEffect(() => {
        const cancelPendingWork = () => {
            if (frameRef.current !== null && typeof window !== "undefined") {
                window.cancelAnimationFrame(frameRef.current)
            }

            if (timerRef.current !== null && typeof window !== "undefined") {
                window.clearTimeout(timerRef.current)
            }

            frameRef.current = null
            timerRef.current = null
        }

        cancelPendingWork()

        if (
            reducedMotion ||
            duration <= 0 ||
            start === end ||
            typeof window === "undefined"
        ) {
            setValue(end)
            setIsComplete(true)
            hasPlayedRef.current = true
            return cancelPendingWork
        }

        if (!inView) {
            if (!triggerOnce || !hasPlayedRef.current) {
                setValue(start)
                setIsComplete(false)
            }

            return cancelPendingWork
        }

        if (triggerOnce && hasPlayedRef.current) {
            setValue(end)
            setIsComplete(true)
            return cancelPendingWork
        }

        const easingFunction =
            easingFunctions[easing] || easingFunctions.easeOutCubic
        const durationMs = Math.max(0, duration) * 1000
        const delayMs = Math.max(0, delay) * 1000

        hasPlayedRef.current = true
        setValue(start)
        setIsComplete(false)

        const startAnimation = () => {
            const startedAt = performance.now()

            const tick = (now: number) => {
                const rawProgress =
                    durationMs === 0 ? 1 : (now - startedAt) / durationMs
                const progress = clamp(rawProgress, 0, 1)
                const easedProgress = easingFunction(progress)

                setValue(start + (end - start) * easedProgress)

                if (progress < 1) {
                    frameRef.current = window.requestAnimationFrame(tick)
                    return
                }

                frameRef.current = null
                setValue(end)
                setIsComplete(true)
            }

            frameRef.current = window.requestAnimationFrame(tick)
        }

        timerRef.current = window.setTimeout(startAnimation, delayMs)

        return cancelPendingWork
    }, [
        start,
        end,
        duration,
        delay,
        easing,
        inView,
        triggerOnce,
        reducedMotion,
    ])

    return { value, isComplete }
}

function useInViewport(
    ref: React.RefObject<Element>,
    threshold: number,
    triggerOnce: boolean,
    disabled: boolean
) {
    const [inView, setInView] = React.useState(false)

    React.useEffect(() => {
        if (disabled) {
            setInView(true)
            return
        }

        const node = ref.current

        if (
            !node ||
            typeof window === "undefined" ||
            !("IntersectionObserver" in window)
        ) {
            setInView(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isVisible = entry.isIntersecting

                if (isVisible) {
                    setInView(true)

                    if (triggerOnce) {
                        observer.disconnect()
                    }
                } else if (!triggerOnce) {
                    setInView(false)
                }
            },
            {
                threshold: clamp(threshold, 0, 1),
            }
        )

        observer.observe(node)

        return () => observer.disconnect()
    }, [ref, threshold, triggerOnce, disabled])

    return inView
}

function usePrefersReducedMotion() {
    const [reducedMotion, setReducedMotion] = React.useState(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return false
        }

        return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    })

    React.useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => setReducedMotion(mediaQuery.matches)

        updatePreference()

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", updatePreference)
            return () =>
                mediaQuery.removeEventListener("change", updatePreference)
        }

        mediaQuery.addListener(updatePreference)
        return () => mediaQuery.removeListener(updatePreference)
    }, [])

    return reducedMotion
}

type RevealInlineProps = {
    text: string
    revealed: boolean
    styleName: RevealStyle
    duration: number
    delay: number
    color: string
    reducedMotion: boolean
    style?: React.CSSProperties
}

function RevealInline({
    text,
    revealed,
    styleName,
    duration,
    delay,
    color,
    reducedMotion,
    style,
}: RevealInlineProps) {
    if (!text) return null

    return (
        <RevealElement
            revealed={revealed}
            styleName={styleName}
            duration={duration}
            delay={delay}
            reducedMotion={reducedMotion}
            style={{
                ...style,
                color,
                display: "inline-block",
                verticalAlign: "baseline",
            }}
        >
            {text}
        </RevealElement>
    )
}

type AnimatedDescriptionProps = {
    text: string
    splitMode: SplitMode
    styleName: RevealStyle
    revealed: boolean
    stagger: number
    duration: number
    delay: number
    color: string
    font: React.CSSProperties
    alignment: Alignment
    sizing: SizingMode
    contentGap: number
    reducedMotion: boolean
}

function AnimatedDescription({
    text,
    splitMode,
    styleName,
    revealed,
    stagger,
    duration,
    delay,
    color,
    font,
    alignment,
    sizing,
    contentGap,
    reducedMotion,
}: AnimatedDescriptionProps) {
    const tokens = React.useMemo(
        () => tokenizeText(text, splitMode),
        [text, splitMode]
    )
    const isFill = sizing === "fill"

    return (
        <p
            aria-hidden="true"
            style={{
                ...font,
                color,
                width: isFill ? "100%" : "fit-content",
                margin: `${Math.max(0, contentGap)}em 0 0`,
                textAlign: alignment,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
            }}
        >
            {tokens.map((token) => {
                if (token.isWhitespace) {
                    return (
                        <span
                            key={token.key}
                            style={{ whiteSpace: "pre-wrap" }}
                        >
                            {token.value}
                        </span>
                    )
                }

                return (
                    <RevealElement
                        key={token.key}
                        revealed={revealed}
                        styleName={styleName}
                        duration={duration}
                        delay={delay + token.animationIndex * stagger}
                        reducedMotion={reducedMotion}
                        style={{
                            display: "inline-block",
                            verticalAlign: "baseline",
                        }}
                    >
                        {token.value}
                    </RevealElement>
                )
            })}
        </p>
    )
}

type RevealElementProps = {
    children: React.ReactNode
    revealed: boolean
    styleName: RevealStyle
    duration: number
    delay: number
    reducedMotion: boolean
    style?: React.CSSProperties
}

function RevealElement({
    children,
    revealed,
    styleName,
    duration,
    delay,
    reducedMotion,
    style,
}: RevealElementProps) {
    const isVisible = revealed || reducedMotion
    const safeDuration = Math.max(0, duration)
    const safeDelay = reducedMotion ? 0 : Math.max(0, delay)

    if (reducedMotion) {
        return <span style={style}>{children}</span>
    }

    if (styleName === "mask") {
        return (
            <span
                style={{
                    ...style,
                    overflow: "hidden",
                    lineHeight: style?.lineHeight || "inherit",
                }}
            >
                <span
                    style={{
                        display: "inline-block",
                        opacity: isVisible ? 1 : 0.001,
                        transform: isVisible
                            ? "translateY(0%)"
                            : "translateY(110%)",
                        transitionProperty: "opacity, transform",
                        transitionDuration: `${safeDuration}s`,
                        transitionDelay: `${safeDelay}s`,
                        transitionTimingFunction:
                            "cubic-bezier(0.22, 1, 0.36, 1)",
                        willChange: "opacity, transform",
                    }}
                >
                    {children}
                </span>
            </span>
        )
    }

    return (
        <span
            style={{
                ...style,
                opacity: isVisible ? 1 : 0,
                filter:
                    styleName === "blur" && !isVisible
                        ? "blur(10px)"
                        : "blur(0px)",
                transform: getRevealTransform(styleName, isVisible),
                transitionProperty: "opacity, transform, filter",
                transitionDuration: `${safeDuration}s`,
                transitionDelay: `${safeDelay}s`,
                transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                willChange: "opacity, transform, filter",
            }}
        >
            {children}
        </span>
    )
}

type TextToken = {
    key: string
    value: string
    isWhitespace: boolean
    animationIndex: number
}

function tokenizeText(text: string, mode: SplitMode): TextToken[] {
    const parts =
        mode === "letter" ? splitGraphemes(text) : text.split(/(\s+)/u)
    let animationIndex = 0

    return parts
        .filter((part) => part !== "")
        .map((value, index) => {
            const isWhitespace = /^\s+$/u.test(value)
            const token: TextToken = {
                key: `${mode}-${index}-${value}`,
                value,
                isWhitespace,
                animationIndex: isWhitespace ? -1 : animationIndex,
            }

            if (!isWhitespace) {
                animationIndex += 1
            }

            return token
        })
}

function splitGraphemes(text: string) {
    const Segmenter = (
        Intl as unknown as { Segmenter?: IntlSegmenterConstructor }
    ).Segmenter

    if (Segmenter) {
        const segmenter = new Segmenter(undefined, { granularity: "grapheme" })
        return Array.from(segmenter.segment(text), (part) => part.segment)
    }

    return Array.from(text)
}

type IntlSegmenterConstructor = new (
    locales?: string | string[],
    options?: { granularity?: "grapheme" | "word" | "sentence" }
) => {
    segment(input: string): Iterable<{ segment: string }>
}

function getRevealTransform(styleName: RevealStyle, isVisible: boolean) {
    if (isVisible) return "translateY(0px) scale(1)"

    if (styleName === "scale") return "translateY(0px) scale(0.92)"
    if (styleName === "blur") return "translateY(8px) scale(1)"

    return "translateY(0.65em) scale(1)"
}

function formatNumber(
    value: number,
    decimalPlaces: number,
    useThousandsSeparator: boolean
) {
    const safePlaces = clampInteger(decimalPlaces, 0, 8)
    const fixedValue = safeNumber(value, 0).toFixed(safePlaces)

    if (!useThousandsSeparator) return fixedValue

    const [integerPart, decimalPart] = fixedValue.split(".")
    const sign = integerPart.startsWith("-") ? "-" : ""
    const unsignedInteger = sign ? integerPart.slice(1) : integerPart
    const groupedInteger = unsignedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

    return `${sign}${groupedInteger}${decimalPart !== undefined ? `.${decimalPart}` : ""}`
}

function safeNumber(value: unknown, fallback: number) {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function clampInteger(value: number, min: number, max: number) {
    return Math.round(clamp(safeNumber(value, min), min, max))
}

function getStatKey(stat: StatItem, index: number) {
    return `${index}-${stat.label || "stat"}-${safeNumber(stat.end, 0)}-${stat.suffix || ""}`
}

function hasSizeValue(
    value: React.CSSProperties["width"] | React.CSSProperties["height"]
) {
    return (
        value !== undefined &&
        value !== null &&
        value !== "auto" &&
        value !== "fit-content"
    )
}

function mergeFont(
    fallback: React.CSSProperties,
    font: React.CSSProperties | undefined,
    size: number,
    scaleWithFrame: boolean,
    includeHeight: boolean
) {
    const safeSize = Math.max(
        1,
        safeNumber(size, safeNumber(fallback.fontSize, 16))
    )

    return {
        ...fallback,
        ...(font || {}),
        fontSize: getResponsiveFontSize(
            safeSize,
            scaleWithFrame,
            includeHeight
        ),
        lineHeight: fallback.lineHeight,
        letterSpacing: fallback.letterSpacing,
    }
}

function getResponsiveFontSize(
    size: number,
    scaleWithFrame: boolean,
    includeHeight: boolean
) {
    if (!scaleWithFrame) return size

    const minSize = Math.max(1, size * 0.12)
    const widthExpression = `${(size / 430) * 100}cqw`

    if (!includeHeight) {
        return `clamp(${minSize}px, ${widthExpression}, ${size}px)`
    }

    const heightExpression = `${(size / 300) * 100}cqh`
    return `clamp(${minSize}px, min(${widthExpression}, ${heightExpression}), ${size}px)`
}

function resolveFontSize(
    value: React.CSSProperties["fontSize"],
    fallback: number
) {
    if (typeof value === "number") return value
    if (typeof value === "string") return value
    return fallback
}

function resolveAffixFontSize(
    value: React.CSSProperties["fontSize"],
    scale: number
) {
    const safeScale = clamp(safeNumber(scale, 1), 0.2, 1.5)

    if (typeof value === "number") return Math.max(14, value * safeScale)
    if (typeof value === "string" && value.endsWith("px")) {
        const numberValue = Number.parseFloat(value)

        if (Number.isFinite(numberValue)) {
            return `${Math.max(14, numberValue * safeScale)}px`
        }
    }

    return safeScale === 1 ? value : `calc(${value} * ${safeScale})`
}

;(
    AnimatedStats as typeof AnimatedStats & {
        defaultProps: Partial<AnimatedStatsProps>
    }
).defaultProps = {
    stats: defaultStats,
    numberFont: defaultNumberFont,
    descriptionFont: defaultDescriptionFont,
    numberColor: "#061D17",
    prefixSuffixColor: "#CFEFDB",
    descriptionColor: "#061D17",
    backgroundColor: "rgba(247, 250, 246, 0)",
    backgroundRadius: 0,
    componentPadding: 0,
    cardBackgroundColor: "#F7FAF6",
    cardBorderColor: "rgba(6, 29, 23, 0)",
    sizing: "fit",
    showCards: false,
    cardRadius: 0,
    maxWidth: 640,
    gap: 24,
    padding: 0,
    columnsDesktop: 1,
    columnsTablet: 1,
    alignment: "left",
    numberSize: 188,
    descriptionSize: 44,
    contentGap: 0.6,
    scaleWithFrame: true,
    numberDuration: 1.25,
    numberEasing: "easeOutCubic",
    numberStaggerDelay: 0.08,
    affixScale: 1,
    affixGap: 0.06,
    animationsEnabled: true,
    triggerThreshold: 0.35,
    triggerOnce: true,
    decimalPlacesDefault: 0,
    thousandsSeparator: true,
    prefixSuffixAnimationStyle: "fadeUp",
    prefixSuffixDuration: 0.45,
    prefixSuffixDelay: 0.02,
    prefixSuffixAppearTiming: "afterNumber",
    descriptionSplitMode: "word",
    descriptionAnimationStyle: "fadeUp",
    descriptionStagger: 0.035,
    descriptionDuration: 0.5,
    descriptionDelay: 0.1,
    descriptionAppearTiming: "afterNumber",
}

addPropertyControls(AnimatedStats, {
    stats: {
        type: ControlType.Array,
        title: "Stats",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                },
                start: {
                    type: ControlType.Number,
                    title: "Start",
                    defaultValue: 0,
                    displayStepper: true,
                },
                end: {
                    type: ControlType.Number,
                    title: "End",
                    defaultValue: 3,
                    displayStepper: true,
                },
                prefix: {
                    type: ControlType.String,
                    title: "Prefix",
                    defaultValue: "",
                },
                suffix: {
                    type: ControlType.String,
                    title: "Suffix",
                    defaultValue: "M+",
                },
                decimalPlaces: {
                    type: ControlType.Number,
                    title: "Decimals",
                    defaultValue: 0,
                    min: 0,
                    max: 8,
                    step: 1,
                    displayStepper: true,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "Organic views\ngenerated",
                    displayTextArea: true,
                },
                customDuration: {
                    type: ControlType.Number,
                    title: "Duration",
                    defaultValue: 0,
                    min: 0,
                    max: 10,
                    step: 0.1,
                    unit: "s",
                },
                customDelay: {
                    type: ControlType.Number,
                    title: "Delay",
                    defaultValue: 0,
                    min: 0,
                    max: 5,
                    step: 0.05,
                    unit: "s",
                },
                highlight: {
                    type: ControlType.Boolean,
                    title: "Highlight",
                    defaultValue: false,
                },
            },
        },
        defaultValue: defaultStats,
    },
    numberFont: {
        // @ts-ignore - ControlType.Font is supported in Framer at runtime.
        type: ControlType.Font,
        title: "Number Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: defaultNumberFontControl,
    } as any,
    descriptionFont: {
        // @ts-ignore - ControlType.Font is supported in Framer at runtime.
        type: ControlType.Font,
        title: "Description Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: defaultDescriptionFontControl,
    } as any,
    numberColor: {
        type: ControlType.Color,
        title: "Number",
        defaultValue: "#061D17",
    },
    prefixSuffixColor: {
        type: ControlType.Color,
        title: "Prefix/Suffix",
        defaultValue: "#CFEFDB",
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Description",
        defaultValue: "#061D17",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(247, 250, 246, 0)",
    },
    backgroundRadius: {
        type: ControlType.Number,
        title: "Component Radius",
        defaultValue: 0,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    componentPadding: {
        type: ControlType.Number,
        title: "Component Padding",
        defaultValue: 0,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
    },
    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Card Bg",
        defaultValue: "#F7FAF6",
        hidden: ({ showCards }) => !showCards,
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(6, 29, 23, 0)",
        hidden: ({ showCards }) => !showCards,
    },
    sizing: {
        type: ControlType.Enum,
        title: "Sizing",
        options: ["fit", "fill"],
        optionTitles: ["Fit", "Fill"],
        defaultValue: "fit",
        displaySegmentedControl: true,
    },
    showCards: {
        type: ControlType.Boolean,
        title: "Cards",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 0,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: ({ showCards }) => !showCards,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 640,
        min: 0,
        max: 2400,
        step: 10,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 96,
        step: 1,
        unit: "px",
        hidden: ({ showCards }) => !showCards,
    },
    columnsDesktop: {
        type: ControlType.Number,
        title: "Desktop Cols",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
        displayStepper: true,
    },
    columnsTablet: {
        type: ControlType.Number,
        title: "Tablet Cols",
        defaultValue: 1,
        min: 1,
        max: 4,
        step: 1,
        displayStepper: true,
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    numberSize: {
        type: ControlType.Number,
        title: "Number Size",
        defaultValue: 188,
        min: 12,
        max: 320,
        step: 1,
        unit: "px",
    },
    descriptionSize: {
        type: ControlType.Number,
        title: "Text Size",
        defaultValue: 44,
        min: 8,
        max: 120,
        step: 1,
        unit: "px",
    },
    contentGap: {
        type: ControlType.Number,
        title: "Content Gap",
        defaultValue: 0.6,
        min: 0,
        max: 2,
        step: 0.05,
        unit: "em",
    },
    scaleWithFrame: {
        type: ControlType.Boolean,
        title: "Scale With Frame",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    numberDuration: {
        type: ControlType.Number,
        title: "Number Duration",
        defaultValue: 1.25,
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    numberEasing: {
        type: ControlType.Enum,
        title: "Number Easing",
        options: ["linear", "easeOutCubic", "easeOutQuart", "easeInOutCubic"],
        optionTitles: ["Linear", "Out Cubic", "Out Quart", "In Out Cubic"],
        defaultValue: "easeOutCubic",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    numberStaggerDelay: {
        type: ControlType.Number,
        title: "Number Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "s",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    affixScale: {
        type: ControlType.Number,
        title: "Affix Scale",
        defaultValue: 1,
        min: 0.2,
        max: 1.5,
        step: 0.05,
    },
    affixGap: {
        type: ControlType.Number,
        title: "Affix Gap",
        defaultValue: 0.06,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "em",
    },
    animationsEnabled: {
        type: ControlType.Boolean,
        title: "Animations",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    triggerThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    triggerOnce: {
        type: ControlType.Boolean,
        title: "Trigger Once",
        defaultValue: true,
        enabledTitle: "Once",
        disabledTitle: "Replay",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    decimalPlacesDefault: {
        type: ControlType.Number,
        title: "Default Decimals",
        defaultValue: 0,
        min: 0,
        max: 8,
        step: 1,
        displayStepper: true,
    },
    thousandsSeparator: {
        type: ControlType.Boolean,
        title: "Thousands",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    prefixSuffixAnimationStyle: {
        type: ControlType.Enum,
        title: "Affix Style",
        options: ["fadeUp", "mask", "blur", "scale"],
        optionTitles: ["Fade Up", "Mask", "Blur", "Scale"],
        defaultValue: "fadeUp",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    prefixSuffixDuration: {
        type: ControlType.Number,
        title: "Affix Duration",
        defaultValue: 0.45,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    prefixSuffixDelay: {
        type: ControlType.Number,
        title: "Affix Delay",
        defaultValue: 0.02,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: ({ animationsEnabled, prefixSuffixAppearTiming }) =>
            !animationsEnabled || prefixSuffixAppearTiming === "immediate",
    },
    prefixSuffixAppearTiming: {
        type: ControlType.Enum,
        title: "Affix Reveal",
        options: ["afterNumber", "immediate"],
        optionTitles: ["After Number", "Immediate"],
        defaultValue: "afterNumber",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionAppearTiming: {
        type: ControlType.Enum,
        title: "Content Reveal",
        options: ["afterNumber", "immediate"],
        optionTitles: ["After Number", "Immediate"],
        defaultValue: "afterNumber",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionSplitMode: {
        type: ControlType.Enum,
        title: "Text Split",
        options: ["word", "letter"],
        optionTitles: ["Word", "Letter"],
        defaultValue: "word",
        displaySegmentedControl: true,
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionAnimationStyle: {
        type: ControlType.Enum,
        title: "Text Style",
        options: ["fadeUp", "mask", "blur", "scale"],
        optionTitles: ["Fade Up", "Mask", "Blur", "Scale"],
        defaultValue: "fadeUp",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionStagger: {
        type: ControlType.Number,
        title: "Text Stagger",
        defaultValue: 0.035,
        min: 0,
        max: 0.5,
        step: 0.005,
        unit: "s",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionDuration: {
        type: ControlType.Number,
        title: "Text Duration",
        defaultValue: 0.5,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: ({ animationsEnabled }) => !animationsEnabled,
    },
    descriptionDelay: {
        type: ControlType.Number,
        title: "Text Delay",
        defaultValue: 0.1,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
        hidden: ({ animationsEnabled, descriptionAppearTiming }) =>
            !animationsEnabled || descriptionAppearTiming === "immediate",
    },
})
