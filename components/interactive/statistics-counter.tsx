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
    MotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion"

type NumberFormatOption =
    | "Plain"
    | "Separated"
    | "Compact"
    | "Currency"
    | "Percent"

type Stat = {
    index: string
    value: string
    suffix: string
    label: string
    description: string
    className?: string
    link?: string
    numberFormat?: NumberFormatOption
    decimals?: number
    currency?: string
    background?: string
    hoverBackground?: string
    hoverTextColor?: string
}

type LayoutOption = "4 Columns" | "2 x 2 Grid" | "1 Column"
type TypographyStyle = React.CSSProperties

type HeaderSettings = {
    show: boolean
    source: "Manual" | "Framer Connect"
    eyebrow: string
    title: string
    eyebrowFont: TypographyStyle
    titleFont: TypographyStyle
}

type Props = {
    stats: Stat[]
    layout: LayoutOption
    background: string
    textColor: string
    mutedColor: string
    lineColor: string
    progressColor: string
    hoverBackground: string
    hoverTextColor: string
    sectionHeight: number
    contentMaxWidth: number
    sidePadding: number
    cardMinHeight: number
    cardPadding: number
    cardBackground: string
    cardBorderRadius: number
    showProgressBar: boolean
    showBorder: boolean
    enableBorderAnimation: boolean
    header: HeaderSettings
    headerConnect?: React.ReactNode
    indexFont: TypographyStyle
    numberFont: TypographyStyle
    labelFont: TypographyStyle
    descriptionFont: TypographyStyle
    showDescriptions: boolean
    enableHover: boolean
    enableScrollSnap: boolean
    snapDelay: number
    respectReducedMotion: boolean
    style?: React.CSSProperties
}

type StatCardProps = {
    item: Stat
    itemIndex: number
    progress: MotionValue<number>
    start: number
    end: number
    forceVisible: boolean
    textColor: string
    mutedColor: string
    hoverBackground: string
    hoverTextColor: string
    enableHover: boolean
    cardMinHeight: number
    cardPadding: number
    cardBackground: string
    cardBorderRadius: number
    indexFont: TypographyStyle
    numberFont: TypographyStyle
    labelFont: TypographyStyle
    descriptionFont: TypographyStyle
    showDescriptions: boolean
}

const cardRevealStarts = [0.16, 0.41, 0.66, 0.88]
const cardRevealDuration = 0.08

/**
 * ScrollStatistics
 *
 * Static rendering uses a separate component tree with plain DOM elements.
 * It does not mount scroll observers, motion subscriptions, timers, RAF work,
 * preload work, or animation timelines.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ScrollStatistics(props: Props) {
    const isStatic = useIsStaticRenderer()
    return isStatic ? (
        <StaticStatistics {...props} />
    ) : (
        <AnimatedStatistics {...props} />
    )
}

function getItems(stats: Stat[]) {
    return Array.isArray(stats) && stats.length > 0
        ? stats.slice(0, 4)
        : defaultStats
}

function getLayout(layout: LayoutOption, itemCount: number) {
    const count = Math.max(1, Math.min(4, itemCount))
    const columns =
        layout === "1 Column"
            ? "1fr"
            : layout === "2 x 2 Grid"
              ? `repeat(${Math.min(2, count)}, minmax(0, 1fr))`
              : `repeat(${count}, minmax(0, 1fr))`
    const className =
        layout === "1 Column"
            ? "layout-one"
            : layout === "2 x 2 Grid"
              ? "layout-two"
              : "layout-four"
    const gridWidth = "100%"
    return { columns, className, gridWidth }
}

function StatsHeader({
    header,
    headerConnect,
    textColor,
    mutedColor,
}: {
    header: HeaderSettings
    headerConnect?: React.ReactNode
    textColor: string
    mutedColor: string
}) {
    if (!header || !header.show) return null

    const connected =
        header.source === "Framer Connect" && Boolean(headerConnect)

    return (
        <div
            style={{
                width: "100%",
                marginBottom: "clamp(24px, 4vw, 48px)",
            }}
        >
            {connected ? (
                <div
                    style={{
                        width: "100%",
                        color: textColor,
                    }}
                >
                    {headerConnect}
                </div>
            ) : (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        width: "100%",
                    }}
                >
                    {header.eyebrow && (
                        <div
                            style={{
                                color: mutedColor,
                                textTransform: "uppercase",
                                ...header.eyebrowFont,
                            }}
                        >
                            {header.eyebrow}
                        </div>
                    )}

                    {header.title && (
                        <div
                            style={{
                                color: textColor,
                                ...header.titleFont,
                            }}
                        >
                            {header.title}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function StaticStatistics(props: Props) {
    const items = getItems(props.stats)
    const { columns, className, gridWidth } = getLayout(
        props.layout,
        items.length
    )

    return (
        <section
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 360,
                background: props.background,
                color: props.textColor,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: "100%",
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box",
                    padding: `clamp(28px, 6vw, 84px) ${props.sidePadding}px`,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: props.contentMaxWidth,
                        margin: "0 auto",
                    }}
                >
                    <StatsHeader
                        header={props.header}
                        headerConnect={props.headerConnect}
                        textColor={props.textColor}
                        mutedColor={props.mutedColor}
                    />
                    <div
                        className={`impact-grid ${className}`}
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: columns,
                            width: gridWidth,
                            margin: "0 auto",
                        }}
                    >
                        <StaticGridLines
                            layout={props.layout}
                            itemCount={items.length}
                            lineColor={props.lineColor}
                            progressColor={props.progressColor}
                            showProgressBar={props.showProgressBar}
                            showBorder={props.showBorder}
                        />
                        {items.map((item, index) => (
                            <StaticStatCard
                                key={`${item.index}-${index}`}
                                item={item}
                                itemIndex={index}
                                {...props}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <style>{`.impact-grid > .impact-card { border: 0; }`}</style>
        </section>
    )
}

function StaticGridLines({
    layout,
    itemCount,
    lineColor,
    progressColor,
    showProgressBar,
    showBorder,
}: {
    layout: LayoutOption
    itemCount: number
    lineColor: string
    progressColor: string
    showProgressBar: boolean
    showBorder: boolean
}) {
    const base: React.CSSProperties = {
        position: "absolute",
        zIndex: 4,
        pointerEvents: "none",
    }
    return (
        <>
            {showProgressBar && (
                <span
                    aria-hidden="true"
                    style={{
                        ...base,
                        left: 0,
                        top: -1,
                        zIndex: 5,
                        width: "100%",
                        height: 2,
                        background: progressColor,
                    }}
                />
            )}
            {showBorder && (
                <>
                    <span
                        aria-hidden="true"
                        style={{
                            ...base,
                            left: -1,
                            top: 0,
                            zIndex: 5,
                            width: 1,
                            height: "100%",
                            background: lineColor,
                        }}
                    />
                    <span
                        aria-hidden="true"
                        style={{
                            ...base,
                            right: -1,
                            top: 0,
                            zIndex: 5,
                            width: 1,
                            height: "100%",
                            background: lineColor,
                        }}
                    />
                </>
            )}
            {showBorder &&
                layout === "4 Columns" &&
                Array.from(
                    { length: Math.max(0, itemCount - 1) },
                    (_, index) => (
                        <span
                            key={index}
                            aria-hidden="true"
                            style={{
                                ...base,
                                left: `${((index + 1) / itemCount) * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: 1,
                                background: lineColor,
                            }}
                        />
                    )
                )}
            {showBorder && layout === "2 x 2 Grid" && itemCount > 1 && (
                <span
                    aria-hidden="true"
                    style={{
                        ...base,
                        left: "50%",
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: lineColor,
                    }}
                />
            )}
            {showBorder && layout === "2 x 2 Grid" && itemCount > 2 && (
                <span
                    aria-hidden="true"
                    style={{
                        ...base,
                        left: 0,
                        top: "50%",
                        width: "100%",
                        height: 1,
                        background: lineColor,
                    }}
                />
            )}
            {showBorder &&
                layout === "1 Column" &&
                Array.from(
                    { length: Math.max(0, itemCount - 1) },
                    (_, index) => (
                        <span
                            key={index}
                            aria-hidden="true"
                            style={{
                                ...base,
                                left: 0,
                                top: `${((index + 1) / itemCount) * 100}%`,
                                width: "100%",
                                height: 1,
                                background: lineColor,
                            }}
                        />
                    )
                )}
            {showBorder && (
                <span
                    aria-hidden="true"
                    style={{
                        ...base,
                        left: 0,
                        bottom: -1,
                        zIndex: 5,
                        width: "100%",
                        height: 1,
                        background: lineColor,
                    }}
                />
            )}
        </>
    )
}

function StaticStatCard({
    item,
    itemIndex,
    textColor,
    mutedColor,
    cardMinHeight,
    cardPadding,
    cardBackground,
    cardBorderRadius,
    indexFont,
    numberFont,
    labelFont,
    descriptionFont,
    showDescriptions,
}: Props & { item: Stat; itemIndex: number }) {
    const numericText = String(item.value)
    const target = Number.parseFloat(numericText.replace(/[^0-9.-]/g, "")) || 0
    const sourceDecimals = numericText.includes(".")
        ? numericText.split(".")[1].length
        : 0
    const decimals = item.decimals ?? -1
    const resolvedDecimals = decimals >= 0 ? decimals : sourceDecimals
    const customClass = sanitizeClassName(item.className)
    const className = [
        "impact-card",
        `impact-card-${itemIndex + 1}`,
        customClass,
    ]
        .filter(Boolean)
        .join(" ")
    const link = item.link?.trim() || ""
    const hasLink = Boolean(link)
    const cardStyle: React.CSSProperties = {
        position: "relative",
        zIndex: 1,
        minHeight: cardMinHeight,
        padding: cardPadding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        background: item.background || cardBackground || "transparent",
        borderRadius: cardBorderRadius,
        boxSizing: "border-box",
        color: textColor,
        textDecoration: "none",
        cursor: hasLink ? "pointer" : "default",
    }
    const cardContent = (
        <>
            <span
                style={{
                    color: mutedColor,
                    textTransform: "uppercase",
                    ...indexFont,
                }}
            >
                {item.index}
            </span>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    margin: "auto 0",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    ...numberFont,
                }}
            >
                <span>
                    {formatNumber(
                        target,
                        item.numberFormat || "Plain",
                        resolvedDecimals,
                        item.currency || "USD"
                    )}
                </span>
                {item.numberFormat !== "Percent" && item.suffix && (
                    <span
                        style={{
                            display: "inline-block",
                            marginLeft: "0.03em",
                            fontSize: "0.57em",
                            lineHeight: 1,
                            transform: "translateY(0.06em)",
                        }}
                    >
                        {item.suffix}
                    </span>
                )}
            </div>
            <div>
                <p
                    style={{
                        margin: 0,
                        maxWidth: "17ch",
                        color: mutedColor,
                        ...labelFont,
                    }}
                >
                    {item.label}
                </p>
                {showDescriptions && item.description && (
                    <p
                        style={{
                            margin: "10px 0 0",
                            maxWidth: "27ch",
                            color: mutedColor,
                            ...descriptionFont,
                        }}
                    >
                        {item.description}
                    </p>
                )}
            </div>
        </>
    )

    if (hasLink) {
        return (
            <a
                className={className}
                href={link}
                aria-label={item.label}
                style={cardStyle}
            >
                {cardContent}
            </a>
        )
    }

    return (
        <div className={className} style={cardStyle}>
            {cardContent}
        </div>
    )
}

function AnimatedStatistics(props: Props) {
    const sectionRef = React.useRef<HTMLElement>(null)
    const systemReducedMotion = useReducedMotion()
    const reducedMotion = Boolean(
        props.respectReducedMotion && systemReducedMotion
    )
    const snapTimerRef = React.useRef<number | null>(null)
    const snapResetTimerRef = React.useRef<number | null>(null)
    const isSnappingRef = React.useRef(false)
    const isNearViewportRef = React.useRef(false)
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    })

    React.useEffect(() => {
        if (reducedMotion || !props.enableScrollSnap) return
        const section = sectionRef.current
        if (!section) return

        const snapPoints = [0, 0.25, 0.5, 0.75, 1]
        let isScrollListenerAttached = false

        const clearSnapDelay = () => {
            if (snapTimerRef.current !== null) {
                window.clearTimeout(snapTimerRef.current)
                snapTimerRef.current = null
            }
        }

        const clearSnapReset = () => {
            if (snapResetTimerRef.current !== null) {
                window.clearTimeout(snapResetTimerRef.current)
                snapResetTimerRef.current = null
            }
        }

        const clearSnapTimers = () => {
            clearSnapDelay()
            clearSnapReset()
            isSnappingRef.current = false
        }

        const handleScroll = () => {
            if (!isNearViewportRef.current || isSnappingRef.current) return
            clearSnapDelay()
            snapTimerRef.current = window.setTimeout(() => {
                snapTimerRef.current = null
                if (!isNearViewportRef.current) return

                const currentSection = sectionRef.current
                if (!currentSection) return
                const rect = currentSection.getBoundingClientRect()
                const sectionStart = window.scrollY + rect.top
                const scrollableDistance = Math.max(
                    currentSection.offsetHeight - window.innerHeight,
                    1
                )
                const currentProgress =
                    (window.scrollY - sectionStart) / scrollableDistance
                if (currentProgress < -0.02 || currentProgress > 1.02) return
                const clampedProgress = Math.min(
                    1,
                    Math.max(0, currentProgress)
                )
                const nearestPoint = snapPoints.reduce((nearest, point) =>
                    Math.abs(point - clampedProgress) <
                    Math.abs(nearest - clampedProgress)
                        ? point
                        : nearest
                )
                const targetY = sectionStart + nearestPoint * scrollableDistance
                if (Math.abs(window.scrollY - targetY) < 2) return

                clearSnapReset()
                isSnappingRef.current = true
                window.scrollTo({ top: targetY, behavior: "smooth" })
                snapResetTimerRef.current = window.setTimeout(() => {
                    isSnappingRef.current = false
                    snapResetTimerRef.current = null
                }, 450)
            }, props.snapDelay)
        }

        const startListening = () => {
            if (isScrollListenerAttached) return
            window.addEventListener("scroll", handleScroll, { passive: true })
            isScrollListenerAttached = true
        }

        const stopListening = () => {
            if (!isScrollListenerAttached) return
            window.removeEventListener("scroll", handleScroll)
            isScrollListenerAttached = false
        }

        if (typeof IntersectionObserver === "undefined") {
            isNearViewportRef.current = true
            startListening()
            return () => {
                clearSnapTimers()
                stopListening()
                isNearViewportRef.current = false
            }
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isNearViewport = Boolean(entry?.isIntersecting)
                isNearViewportRef.current = isNearViewport
                if (isNearViewport) {
                    startListening()
                } else {
                    stopListening()
                    clearSnapTimers()
                }
            },
            { rootMargin: "100% 0px" }
        )

        observer.observe(section)
        return () => {
            observer.disconnect()
            clearSnapTimers()
            stopListening()
            isNearViewportRef.current = false
        }
    }, [props.enableScrollSnap, props.snapDelay, reducedMotion])

    const noBorderAnimation = reducedMotion || !props.enableBorderAnimation

    const topBorderScale = useTransform(
        scrollYProgress,
        [0, 0.015, 0.1],
        [0, 0, 1],
        { clamp: true }
    )
    const dividerScale = useTransform(scrollYProgress, [0.1, 0.22], [0, 1], {
        clamp: true,
    })
    const items = getItems(props.stats)
    const finalCardEnd =
        cardRevealStarts[Math.max(0, items.length - 1)] + cardRevealDuration
    const bottomBorderScale = useTransform(
        scrollYProgress,
        [finalCardEnd, 1],
        [0, 1],
        { clamp: true }
    )
    const { columns, className, gridWidth } = getLayout(
        props.layout,
        items.length
    )

    return (
        <section
            ref={sectionRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: `${props.sectionHeight}vh`,
                background: props.background,
                color: props.textColor,
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box",
                    padding: `clamp(28px, 6vw, 84px) ${props.sidePadding}px`,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: props.contentMaxWidth,
                        margin: "0 auto",
                    }}
                >
                    <StatsHeader
                        header={props.header}
                        headerConnect={props.headerConnect}
                        textColor={props.textColor}
                        mutedColor={props.mutedColor}
                    />
                    <div
                        className={`impact-grid ${className}`}
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: columns,
                            width: gridWidth,
                            margin: "0 auto",
                        }}
                    >
                        <AnimatedGridLines
                            layout={props.layout}
                            itemCount={items.length}
                            lineColor={props.lineColor}
                            progressColor={props.progressColor}
                            reducedMotion={noBorderAnimation}
                            showProgressBar={props.showProgressBar}
                            showBorder={props.showBorder}
                            topBorderScale={topBorderScale}
                            dividerScale={dividerScale}
                            bottomBorderScale={bottomBorderScale}
                        />
                        {items.map((item, index) => {
                            const start = cardRevealStarts[index] ?? 0.88
                            return (
                                <StatCard
                                    key={`${item.index}-${index}`}
                                    item={item}
                                    itemIndex={index}
                                    progress={scrollYProgress}
                                    start={start}
                                    end={start + cardRevealDuration}
                                    forceVisible={reducedMotion}
                                    {...props}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
            <style>{`.impact-grid > .impact-card { border: 0; }`}</style>
        </section>
    )
}

function AnimatedGridLines({
    layout,
    itemCount,
    lineColor,
    progressColor,
    reducedMotion,
    showProgressBar,
    showBorder,
    topBorderScale,
    dividerScale,
    bottomBorderScale,
}: {
    layout: LayoutOption
    itemCount: number
    lineColor: string
    progressColor: string
    reducedMotion: boolean
    showProgressBar: boolean
    showBorder: boolean
    topBorderScale: MotionValue<number>
    dividerScale: MotionValue<number>
    bottomBorderScale: MotionValue<number>
}) {
    return (
        <>
            {showProgressBar && (
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: -1,
                        zIndex: 5,
                        width: "100%",
                        height: 2,
                        background: progressColor,
                        transformOrigin: "left center",
                        scaleX: reducedMotion ? 1 : topBorderScale,
                    }}
                />
            )}
            {showBorder && (
                <>
                    <motion.span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: -1,
                            top: 0,
                            zIndex: 5,
                            width: 1,
                            height: "100%",
                            background: lineColor,
                            transformOrigin: "top center",
                            scaleY: reducedMotion ? 1 : bottomBorderScale,
                        }}
                    />
                    <motion.span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            right: -1,
                            top: 0,
                            zIndex: 5,
                            width: 1,
                            height: "100%",
                            background: lineColor,
                            transformOrigin: "top center",
                            scaleY: reducedMotion ? 1 : bottomBorderScale,
                        }}
                    />
                </>
            )}
            {showBorder &&
                layout === "4 Columns" &&
                Array.from(
                    { length: Math.max(0, itemCount - 1) },
                    (_, index) => (
                        <motion.span
                            key={index}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: `${((index + 1) / itemCount) * 100}%`,
                                top: 0,
                                bottom: 0,
                                zIndex: 4,
                                width: 1,
                                background: lineColor,
                                transformOrigin: "top center",
                                scaleY: reducedMotion ? 1 : dividerScale,
                                pointerEvents: "none",
                            }}
                        />
                    )
                )}
            {showBorder && layout === "2 x 2 Grid" && itemCount > 1 && (
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: 0,
                        bottom: 0,
                        zIndex: 4,
                        width: 1,
                        background: lineColor,
                        transformOrigin: "top center",
                        scaleY: reducedMotion ? 1 : dividerScale,
                        pointerEvents: "none",
                    }}
                />
            )}
            {showBorder && layout === "2 x 2 Grid" && itemCount > 2 && (
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        zIndex: 4,
                        width: "100%",
                        height: 1,
                        background: lineColor,
                        transformOrigin: "left center",
                        scaleX: reducedMotion ? 1 : dividerScale,
                        pointerEvents: "none",
                    }}
                />
            )}
            {showBorder &&
                layout === "1 Column" &&
                Array.from(
                    { length: Math.max(0, itemCount - 1) },
                    (_, index) => (
                        <motion.span
                            key={index}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: `${((index + 1) / itemCount) * 100}%`,
                                zIndex: 4,
                                width: "100%",
                                height: 1,
                                background: lineColor,
                                transformOrigin: "left center",
                                scaleX: reducedMotion ? 1 : dividerScale,
                                pointerEvents: "none",
                            }}
                        />
                    )
                )}
            {showBorder && (
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        bottom: -1,
                        zIndex: 5,
                        width: "100%",
                        height: 1,
                        background: lineColor,
                        transformOrigin: "left center",
                        scaleX: reducedMotion ? 1 : bottomBorderScale,
                    }}
                />
            )}
        </>
    )
}

function StatCard({
    item,
    itemIndex,
    progress,
    start,
    end,
    forceVisible,
    textColor,
    mutedColor,
    hoverBackground,
    hoverTextColor,
    enableHover,
    cardMinHeight,
    cardPadding,
    cardBackground,
    cardBorderRadius,
    indexFont,
    numberFont,
    labelFont,
    descriptionFont,
    showDescriptions,
}: StatCardProps) {
    const opacity = useTransform(
        progress,
        [Math.max(0, start - 0.08), start, end, 1],
        [0, 0, 1, 1]
    )
    const y = useTransform(
        progress,
        [Math.max(0, start - 0.08), start, end, 1],
        [70, 70, 0, 0]
    )
    const [hovered, setHovered] = React.useState(false)
    const hoverActive = !forceVisible && enableHover && hovered
    const resolvedHoverBackground = item.hoverBackground || hoverBackground
    const resolvedHoverTextColor = item.hoverTextColor || hoverTextColor
    const resolvedCardBackground =
        item.background || cardBackground || "transparent"
    const customClass = sanitizeClassName(item.className)
    const cardClassName = [
        "impact-card",
        `impact-card-${itemIndex + 1}`,
        customClass,
    ]
        .filter(Boolean)
        .join(" ")
    const link = item.link?.trim() || ""
    const hasLink = Boolean(link)
    const cardProps = {
        className: cardClassName,
        onHoverStart: () => {
            if (enableHover) setHovered(true)
        },
        onHoverEnd: () => setHovered(false),
        style: {
            position: "relative" as const,
            zIndex: 1,
            minHeight: cardMinHeight,
            padding: cardPadding,
            display: "flex" as const,
            flexDirection: "column" as const,
            justifyContent: "space-between" as const,
            overflow: "hidden" as const,
            background: resolvedCardBackground,
            borderRadius: cardBorderRadius,
            boxSizing: "border-box" as const,
            opacity: forceVisible ? 1 : opacity,
            y: forceVisible ? 0 : y,
            color: hoverActive ? resolvedHoverTextColor : textColor,
            textDecoration: "none" as const,
            cursor: hasLink ? "pointer" : "default",
        },
    }
    const cardContent = (
        <>
            <motion.div
                aria-hidden="true"
                animate={{ y: hoverActive ? "0%" : "101%" }}
                transition={{
                    duration: forceVisible ? 0 : 0.65,
                    ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: -1,
                    background: resolvedHoverBackground,
                    pointerEvents: "none",
                }}
            />
            <span
                style={{
                    color: hoverActive
                        ? `${resolvedHoverTextColor}90`
                        : mutedColor,
                    textTransform: "uppercase",
                    ...indexFont,
                }}
            >
                {item.index}
            </span>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    margin: "auto 0",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                    ...numberFont,
                }}
            >
                <AnimatedCounter
                    value={item.value}
                    progress={progress}
                    start={start}
                    end={end}
                    forceFinal={forceVisible}
                    format={item.numberFormat || "Plain"}
                    decimals={item.decimals ?? -1}
                    currency={item.currency || "USD"}
                />
                {item.numberFormat !== "Percent" && item.suffix && (
                    <span
                        style={{
                            display: "inline-block",
                            marginLeft: "0.03em",
                            fontSize: "0.57em",
                            lineHeight: 1,
                            transform: "translateY(0.06em)",
                        }}
                    >
                        {item.suffix}
                    </span>
                )}
            </div>
            <div>
                <p
                    style={{
                        margin: 0,
                        maxWidth: "17ch",
                        color: hoverActive
                            ? `${resolvedHoverTextColor}90`
                            : mutedColor,
                        ...labelFont,
                    }}
                >
                    {item.label}
                </p>
                {showDescriptions && item.description && (
                    <p
                        style={{
                            margin: "10px 0 0",
                            maxWidth: "27ch",
                            color: hoverActive
                                ? `${resolvedHoverTextColor}A6`
                                : mutedColor,
                            ...descriptionFont,
                        }}
                    >
                        {item.description}
                    </p>
                )}
            </div>
        </>
    )

    if (hasLink) {
        return (
            <motion.a {...cardProps} href={link} aria-label={item.label}>
                {cardContent}
            </motion.a>
        )
    }

    return <motion.div {...cardProps}>{cardContent}</motion.div>
}

function sanitizeClassName(value?: string) {
    return String(value ?? "")
        .trim()
        .split(/\s+/)
        .map((name) => name.replace(/[^a-zA-Z0-9_-]/g, ""))
        .filter(Boolean)
        .join(" ")
}

function AnimatedCounter({
    value,
    progress,
    start,
    end,
    forceFinal,
    format,
    decimals,
    currency,
}: {
    value: string
    progress: MotionValue<number>
    start: number
    end: number
    forceFinal: boolean
    format: NumberFormatOption
    decimals: number
    currency: string
}) {
    const numericText = String(value)
    const target = Number.parseFloat(numericText.replace(/[^0-9.-]/g, "")) || 0

    const decimalPart = numericText.includes(".")
        ? numericText.split(".")[1]
        : ""

    const sourceDecimals = decimalPart.length

    const counter = useTransform(progress, [start, end], [0, target], {
        clamp: true,
    })

    const [displayValue, setDisplayValue] = React.useState(
        forceFinal ? target : 0
    )

    useMotionValueEvent(counter, "change", (latest) => {
        if (!forceFinal) setDisplayValue(latest)
    })

    React.useEffect(() => {
        setDisplayValue(forceFinal ? target : counter.get())
    }, [forceFinal, target, counter])

    const resolvedDecimals = decimals >= 0 ? decimals : sourceDecimals

    return (
        <span>
            {formatNumber(displayValue, format, resolvedDecimals, currency)}
        </span>
    )
}

function formatNumber(
    value: number,
    format: NumberFormatOption,
    decimals: number,
    currency: string
) {
    const safeDecimals = Math.max(0, Math.min(6, decimals))

    if (format === "Compact") {
        return new Intl.NumberFormat("en-US", {
            notation: "compact",
            maximumFractionDigits: safeDecimals,
            minimumFractionDigits: safeDecimals,
        }).format(value)
    }

    if (format === "Currency") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
            maximumFractionDigits: safeDecimals,
            minimumFractionDigits: safeDecimals,
        }).format(value)
    }

    if (format === "Percent") {
        return `${new Intl.NumberFormat("en-US", {
            maximumFractionDigits: safeDecimals,
            minimumFractionDigits: safeDecimals,
        }).format(value)}%`
    }

    if (format === "Separated") {
        return new Intl.NumberFormat("en-US", {
            useGrouping: true,
            maximumFractionDigits: safeDecimals,
            minimumFractionDigits: safeDecimals,
        }).format(value)
    }

    return safeDecimals > 0
        ? value.toFixed(safeDecimals)
        : String(Math.round(value))
}

const defaultStats: Stat[] = [
    {
        index: "01 / Craft",
        value: "30",
        suffix: "+",
        label: "Projects Crafted",
        description: "Building digital experiences with purpose and precision.",
        className: "craft-card",
        link: "",
        numberFormat: "Plain",
        decimals: 0,
        currency: "USD",
        background: "",
        hoverBackground: "",
        hoverTextColor: "",
    },
    {
        index: "02 / Range",
        value: "12",
        suffix: "+",
        label: "Industries Served",
        description: "Helping businesses across diverse markets grow online.",
        className: "range-card",
        link: "",
        numberFormat: "Plain",
        decimals: 0,
        currency: "USD",
        background: "",
        hoverBackground: "",
        hoverTextColor: "",
    },
    {
        index: "03 / Trust",
        value: "98",
        suffix: "%",
        label: "Client Satisfaction",
        description:
            "Trusted partnerships built on quality and measurable results.",
        className: "trust-card",
        link: "",
        numberFormat: "Plain",
        decimals: 0,
        currency: "USD",
        background: "",
        hoverBackground: "",
        hoverTextColor: "",
    },
    {
        index: "04 / Experience",
        value: "6",
        suffix: "+",
        label: "Years of Experience",
        description:
            "Creating modern brands, websites, and marketing strategies.",
        className: "experience-card",
        link: "",
        numberFormat: "Plain",
        decimals: 0,
        currency: "USD",
        background: "",
        hoverBackground: "",
        hoverTextColor: "",
    },
]

ScrollStatistics.defaultProps = {
    stats: defaultStats,
    layout: "4 Columns",
    background: "#F2EEE6",
    textColor: "#10100F",
    mutedColor: "#6D6962",
    lineColor: "rgba(16,16,15,0.18)",
    progressColor: "#10100F",
    hoverBackground: "#10100F",
    hoverTextColor: "#F2EEE6",
    sectionHeight: 320,
    contentMaxWidth: 1440,
    sidePadding: 58,
    cardMinHeight: 360,
    cardPadding: 38,
    cardBackground: "transparent",
    cardBorderRadius: 0,
    showProgressBar: true,
    showBorder: true,
    enableBorderAnimation: true,
    header: {
        show: false,
        source: "Manual",
        eyebrow: "Impact",
        title: "Numbers that speak for themselves",
        eyebrowFont: {
            fontFamily: "Inter",
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "1.2em",
            letterSpacing: "0.1em",
            textAlign: "left",
        },
        titleFont: {
            fontFamily: "Inter",
            fontSize: 28,
            fontWeight: 600,
            lineHeight: "1.15em",
            letterSpacing: "-0.02em",
            textAlign: "left",
        },
    },
    indexFont: {
        fontFamily: "Inter",
        fontSize: 10,
        fontWeight: 500,
        lineHeight: "1.2em",
        letterSpacing: "0.09em",
        textAlign: "left",
    },
    numberFont: {
        fontFamily: "Inter",
        fontSize: 132,
        fontWeight: 600,
        lineHeight: "0.78em",
        letterSpacing: "-0.075em",
        textAlign: "left",
    },
    labelFont: {
        fontFamily: "Inter",
        fontSize: 15,
        fontWeight: 400,
        lineHeight: "1.42em",
        letterSpacing: "-0.015em",
        textAlign: "left",
    },
    descriptionFont: {
        fontFamily: "Inter",
        fontSize: 13,
        fontWeight: 400,
        lineHeight: "1.5em",
        letterSpacing: "0em",
        textAlign: "left",
    },
    showDescriptions: false,
    enableHover: true,
    enableScrollSnap: true,
    snapDelay: 120,
    respectReducedMotion: true,
}

addPropertyControls(ScrollStatistics, {
    stats: {
        type: ControlType.Array,
        title: "Stats",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                index: {
                    type: ControlType.String,
                    title: "Index",
                },
                value: {
                    type: ControlType.String,
                    title: "Value",
                },
                suffix: {
                    type: ControlType.String,
                    title: "Suffix",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                className: {
                    type: ControlType.String,
                    title: "CSS Class",
                    placeholder: "custom-card",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                numberFormat: {
                    type: ControlType.Enum,
                    title: "Format",
                    options: [
                        "Plain",
                        "Separated",
                        "Compact",
                        "Currency",
                        "Percent",
                    ],
                    optionTitles: [
                        "Plain",
                        "1,000",
                        "1.2K / 1.2M",
                        "Currency",
                        "Percentage",
                    ],
                    defaultValue: "Plain",
                },
                decimals: {
                    type: ControlType.Number,
                    title: "Decimals",
                    min: 0,
                    max: 6,
                    step: 1,
                    defaultValue: 0,
                },
                currency: {
                    type: ControlType.String,
                    title: "Currency",
                    defaultValue: "USD",
                    placeholder: "USD",
                    hidden: (item) => item.numberFormat !== "Currency",
                },
                background: {
                    type: ControlType.Color,
                    title: "Background",
                    optional: true,
                },
                hoverBackground: {
                    type: ControlType.Color,
                    title: "Hover BG",
                    optional: true,
                },
                hoverTextColor: {
                    type: ControlType.Color,
                    title: "Hover Text",
                    optional: true,
                },
            },
        },
        defaultValue: defaultStats,
    },

    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["4 Columns", "2 x 2 Grid", "1 Column"],
        optionTitles: ["4 Columns", "2 × 2 Grid", "1 Column"],
        defaultValue: "4 Columns",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
    },

    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
    },

    lineColor: {
        type: ControlType.Color,
        title: "Lines",
    },

    progressColor: {
        type: ControlType.Color,
        title: "Progress",
    },

    hoverBackground: {
        type: ControlType.Color,
        title: "Hover BG",
    },

    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text",
    },

    sectionHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        min: 150,
        max: 500,
        step: 10,
        unit: "vh",
    },

    contentMaxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        min: 320,
        max: 2000,
        step: 10,
        unit: "px",
    },

    sidePadding: {
        type: ControlType.Number,
        title: "Side Padding",
        min: 0,
        max: 160,
        step: 1,
        unit: "px",
    },

    cardMinHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 160,
        max: 800,
        step: 10,
        unit: "px",
    },

    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },

    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "transparent",
    },

    cardBorderRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },

    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
    },

    showBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
    },

    enableBorderAnimation: {
        type: ControlType.Boolean,
        title: "Border Animation",
        defaultValue: true,
        hidden: (props) => !props.showBorder,
    },

    header: {
        type: ControlType.Object,
        title: "Header",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: false,
            },
            source: {
                type: ControlType.Enum,
                title: "Header Source",
                options: ["Manual", "Framer Connect"],
                optionTitles: ["Manual", "Framer Connect"],
                defaultValue: "Manual",
            },
            eyebrow: {
                type: ControlType.String,
                title: "Eyebrow",
                placeholder: "Impact",
                hidden: (header) => header.source === "Framer Connect",
            },
            title: {
                type: ControlType.String,
                title: "Title",
                placeholder: "Numbers that speak for themselves",
                displayTextArea: true,
                hidden: (header) => header.source === "Framer Connect",
            },
            eyebrowFont: {
                type: ControlType.Font,
                title: "Eyebrow Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: "1.2em",
                    letterSpacing: "0.1em",
                    textAlign: "left",
                },
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 28,
                    variant: "Semibold",
                    lineHeight: "1.15em",
                    letterSpacing: "-0.02em",
                    textAlign: "left",
                },
            },
        },
    },

    headerConnect: {
        type: ControlType.ComponentInstance,
        title: "Header · Connect",
        description: "Connect a custom Framer header component.",
        hidden: (props) => props.header.source !== "Framer Connect",
    },

    indexFont: {
        type: ControlType.Font,
        title: "Index Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "10px",
        displayFontSize: true,
        defaultValue: {
            fontSize: 10,
            variant: "Medium",
            lineHeight: "1.2em",
            letterSpacing: "0.09em",
            textAlign: "left",
        },
    },

    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "132px",
        displayFontSize: true,
        defaultValue: {
            fontSize: 132,
            variant: "Semibold",
            lineHeight: "0.78em",
            letterSpacing: "-0.075em",
            textAlign: "left",
        },
    },

    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "15px",
        displayFontSize: true,
        defaultValue: {
            fontSize: 15,
            variant: "Regular",
            lineHeight: "1.42em",
            letterSpacing: "-0.015em",
            textAlign: "left",
        },
    },

    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultFontSize: "13px",
        displayFontSize: true,
        defaultValue: {
            fontSize: 13,
            variant: "Regular",
            lineHeight: "1.5em",
            letterSpacing: "0em",
            textAlign: "left",
        },
        hidden: (props) => !props.showDescriptions,
    },

    showDescriptions: {
        type: ControlType.Boolean,
        title: "Descriptions",
    },

    enableScrollSnap: {
        type: ControlType.Boolean,
        title: "Scroll Snap",
        defaultValue: true,
    },

    snapDelay: {
        type: ControlType.Number,
        title: "Snap Delay",
        min: 60,
        max: 300,
        step: 10,
        unit: "ms",
        defaultValue: 120,
        hidden: (props) => !props.enableScrollSnap,
    },

    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
    },

    enableHover: {
        type: ControlType.Boolean,
        title: "Hover Fill",
    },
})
