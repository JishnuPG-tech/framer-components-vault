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


type ProjectItem = {
    image?: string
    label?: string
    link?: any
}

type FontStyle = React.CSSProperties & {
    fontFamily?: string
    fontSize?: string | number
    fontWeight?: string | number
    fontStyle?: string
    lineHeight?: string | number
    letterSpacing?: string | number
    textAlign?: React.CSSProperties["textAlign"]
}

type ContentSettings = {
    showCopy: boolean
    textColor: string
    leftTitle: string
    rightTitle: string
    desktopTitleFont: FontStyle
    compactTitleFont: FontStyle
    titleCenterGap: number
    centerText: string
    centerTextWidth: number
    desktopCenterFont: FontStyle
    tabletCenterFont: FontStyle
    mobileCenterFont: FontStyle
    compactTextColor: string
    compactTextGap: number
}

type CardSettings = {
    background: string
    radius: number
    aspect: number
    imageFit: "cover" | "contain"
    depthOpacity: number
    depthScale: number
    renderQuality: number
    labelColor: string
    labelFont: FontStyle
}

type MotionSettings = {
    scrollLength: number
    startOffset: number
    smoothness: number
    perspective: number
    curveWidth: number
    curveHeight: number
    depth: number
    rotation: number
    cardWidth: number
    offsetY: number
}

type GridSettings = {
    columns: number
    gap: number
    maxWidth: number
    positionY: number
}

type ResponsiveSettings = {
    desktopBreakpoint: number
    mobileBreakpoint: number
    tabletColumns: number
    mobileColumns: number
    tabletPadding: string
    mobilePadding: string
    gap: number
    headerGap: number
}

type CanvasSettings = {
    layout: "desktop" | "tablet" | "mobile"
    progress: number
}

type Props = {
    items: ProjectItem[]
    background: string
    content: ContentSettings
    cards: CardSettings
    motion: MotionSettings
    grid: GridSettings
    responsive: ResponsiveSettings
    canvas: CanvasSettings
    style?: React.CSSProperties
}

type ViewportSize = {
    width: number
    height: number
}

const DEFAULT_ITEMS: ProjectItem[] = [
    {
        image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1600&q=90",
        label: "Project 01",
    },
    {
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1600&q=90",
        label: "Project 02",
    },
    {
        image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1600&q=90",
        label: "Project 03",
    },
    {
        image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1600&q=90",
        label: "Project 04",
    },
    {
        image: "https://images.unsplash.com/photo-1559028012-d74eadee55f9?auto=format&fit=crop&w=1600&q=90",
        label: "Project 05",
    },
    {
        image: "https://images.unsplash.com/photo-1613909207039-6b173b755cc1?auto=format&fit=crop&w=1600&q=90",
        label: "Project 06",
    },
]

const DEFAULT_CONTENT: ContentSettings = {
    showCopy: true,
    textColor: "#242424",
    leftTitle: "MOTION",
    rightTitle: "DESIGN IN",
    desktopTitleFont: {
        fontFamily: "Inter",
        fontSize: 144,
        fontWeight: 400,
        lineHeight: 0.86,
        letterSpacing: "-0.075em",
        textAlign: "left",
    },
    compactTitleFont: {
        fontFamily: "Inter",
        fontSize: 72,
        fontWeight: 400,
        lineHeight: 0.9,
        letterSpacing: "-0.065em",
        textAlign: "left",
    },
    titleCenterGap: 32,
    centerText: "Exploring ideas through daily design practice.",
    centerTextWidth: 220,
    compactTextGap: 28,
    desktopCenterFont: {
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        textAlign: "center",
    },
    tabletCenterFont: {
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        textAlign: "left",
    },
    mobileCenterFont: {
        fontFamily: "Inter",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        textAlign: "left",
    },
    compactTextColor: "#242424",
}

const DEFAULT_CARDS: CardSettings = {
    background: "#E8E8E8",
    radius: 8,
    aspect: 1.48,
    imageFit: "cover",
    depthOpacity: 20,
    depthScale: 82,
    renderQuality: 2,
    labelColor: "rgba(0, 0, 0, 0.5)",
    labelFont: {
        fontFamily: "Inter",
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: "0em",
        textAlign: "center",
    },
}

const DEFAULT_MOTION: MotionSettings = {
    scrollLength: 460,
    startOffset: 55,
    smoothness: 7,
    perspective: 1300,
    curveWidth: 570,
    curveHeight: 210,
    depth: 520,
    rotation: 310,
    cardWidth: 410,
    offsetY: -40,
}

const DEFAULT_GRID: GridSettings = {
    columns: 3,
    gap: 16,
    maxWidth: 1160,
    positionY: 52,
}

const DEFAULT_RESPONSIVE: ResponsiveSettings = {
    desktopBreakpoint: 1024,
    mobileBreakpoint: 640,
    tabletColumns: 2,
    mobileColumns: 1,
    tabletPadding: "72px 24px",
    mobilePadding: "72px 24px",
    gap: 14,
    headerGap: 56,
}

const DEFAULT_CANVAS: CanvasSettings = {
    layout: "desktop",
    progress: 0.48,
}

function clamp(value: number, minimum = 0, maximum = 1) {
    return Math.min(Math.max(value, minimum), maximum)
}

function lerp(from: number, to: number, progress: number) {
    return from + (to - from) * progress
}

function smootherstep(start: number, end: number, value: number) {
    if (start === end) {
        return value < start ? 0 : 1
    }

    const progress = clamp((value - start) / (end - start))

    return (
        progress * progress * progress * (progress * (progress * 6 - 15) + 10)
    )
}

function getLinkValue(link: any) {
    if (!link) return ""

    if (typeof link === "string") {
        return link
    }

    return String(link.url || link.href || link.link || link.path || "")
}

function CardContent({
    item,
    index,
    radius,
    imageFit,
    background,
    labelColor,
    labelFont,
    renderQuality = 1,
    shadowStrength = 1,
}: {
    item: ProjectItem
    index: number
    radius: number
    imageFit: "cover" | "contain"
    background: string
    labelColor: string
    labelFont: FontStyle
    renderQuality?: number
    shadowStrength?: number
}) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: radius,
                background,
                boxShadow: `0 ${18 * shadowStrength * renderQuality}px ${
                    50 * shadowStrength * renderQuality
                }px rgba(0, 0, 0, ${0.12 * shadowStrength})`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
            }}
        >
            {item.image ? (
                <img
                    src={item.image}
                    alt={item.label || `Project ${index + 1}`}
                    draggable={false}
                    loading="eager"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: imageFit,
                        background,
                        userSelect: "none",
                        pointerEvents: "none",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                        boxSizing: "border-box",
                        ...labelFont,
                        color: labelColor,
                    }}
                >
                    {item.label || `Project ${index + 1}`}
                </div>
            )}
        </div>
    )
}

function DesktopProjectCard({
    item,
    index,
    x,
    y,
    z,
    width,
    height,
    rotateY,
    rotateZ,
    scale,
    opacity,
    zIndex,
    radius,
    imageFit,
    cardBackground,
    labelColor,
    labelFont,
    renderQuality,
    flattened,
}: {
    item: ProjectItem
    index: number
    x: number
    y: number
    z: number
    width: number
    height: number
    rotateY: number
    rotateZ: number
    scale: number
    opacity: number
    zIndex: number
    radius: number
    imageFit: "cover" | "contain"
    cardBackground: string
    labelColor: string
    labelFont: FontStyle
    renderQuality: number
    flattened: number
}) {
    const href = getLinkValue(item.link)

    /**
     * Positive translateZ + perspective can make the front card visually
     * much larger than its CSS width. Browsers then upscale the card's
     * rasterized texture, which makes the front image look soft.
     *
     * Render image cards at a larger internal CSS size and compensate with
     * scale so the visible size/position stays exactly the same.
     */
    const quality = item.image ? clamp(renderQuality, 1, 3) : 1

    const renderWidth = width * quality
    const renderHeight = height * quality

    const renderX = x - (renderWidth - width) / 2

    const renderY = y - (renderHeight - height) / 2

    const renderScale = scale / quality
    const renderRadius = radius * quality

    const content = (
        <CardContent
            item={item}
            index={index}
            radius={renderRadius}
            imageFit={imageFit}
            background={cardBackground}
            labelColor={labelColor}
            labelFont={labelFont}
            renderQuality={quality}
            shadowStrength={lerp(1, 0.4, flattened)}
        />
    )

    return (
        <div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: renderWidth,
                height: renderHeight,
                opacity,
                zIndex,
                transformOrigin: "50% 50%",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: `
                    translate3d(${renderX}px, ${renderY}px, ${z}px)
                    rotateY(${rotateY}deg)
                    rotateZ(${rotateZ}deg)
                    scale(${renderScale})
                `,
            }}
        >
            {href ? (
                <a
                    href={href}
                    aria-label={item.label || `Open project ${index + 1}`}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        color: "inherit",
                        textDecoration: "none",
                    }}
                >
                    {content}
                </a>
            ) : (
                content
            )}
        </div>
    )
}

function CompactProjectCard({
    item,
    index,
    radius,
    imageFit,
    cardBackground,
    labelColor,
    labelFont,
    aspect,
}: {
    item: ProjectItem
    index: number
    radius: number
    imageFit: "cover" | "contain"
    cardBackground: string
    labelColor: string
    labelFont: FontStyle
    aspect: number
}) {
    const href = getLinkValue(item.link)

    const content = (
        <div
            style={{
                position: "relative",
                width: "100%",
                aspectRatio: `${Math.max(aspect, 0.2)} / 1`,
            }}
        >
            <CardContent
                item={item}
                index={index}
                radius={radius}
                imageFit={imageFit}
                background={cardBackground}
                labelColor={labelColor}
                labelFont={labelFont}
                shadowStrength={0.3}
            />
        </div>
    )

    if (!href) {
        return content
    }

    return (
        <a
            href={href}
            aria-label={item.label || `Open project ${index + 1}`}
            style={{
                display: "block",
                width: "100%",
                color: "inherit",
                textDecoration: "none",
            }}
        >
            {content}
        </a>
    )
}

function CompactLayout({
    items,
    background,
    textColor,
    leftTitle,
    rightTitle,
    centerText,
    showCopy,
    titleFont,
    centerFont,
    centerTextWidth,
    centerTextColor,
    contentGap,
    columns,
    gap,
    headerGap,
    padding,
    radius,
    aspect,
    imageFit,
    cardBackground,
    labelColor,
    labelFont,
}: {
    items: ProjectItem[]
    background: string
    textColor: string
    leftTitle: string
    rightTitle: string
    centerText: string
    showCopy: boolean
    titleFont: FontStyle
    centerFont: FontStyle
    centerTextWidth: number
    centerTextColor: string
    contentGap: number
    columns: number
    gap: number
    headerGap: number
    padding: string
    radius: number
    aspect: number
    imageFit: "cover" | "contain"
    cardBackground: string
    labelColor: string
    labelFont: FontStyle
}) {
    return (
        <section
            style={{
                position: "relative",
                width: "100%",
                height: "auto",
                padding,
                boxSizing: "border-box",
                background,
            }}
        >
            {showCopy && (
                <header
                    style={{
                        position: "relative",
                        width: "100%",
                        marginBottom: headerGap,
                    }}
                >
                    <h2
                        style={{
                            ...titleFont,
                            margin: 0,
                            width: "100%",
                            maxWidth: "100%",
                            color: textColor,
                        }}
                    >
                        <span style={{ display: "block" }}>{leftTitle}</span>

                        <span style={{ display: "block" }}>{rightTitle}</span>
                    </h2>

                    {centerText && (
                        <p
                            style={{
                                ...centerFont,
                                margin: `${contentGap}px 0 0`,
                                maxWidth: centerTextWidth,
                                color: centerTextColor,
                                textAlign: "left",
                            }}
                        >
                            {centerText}
                        </p>
                    )}
                </header>
            )}

            <div
                style={{
                    position: "relative",
                    display: "grid",
                    width: "100%",
                    gridTemplateColumns: `repeat(${Math.max(
                        Math.round(columns),
                        1
                    )}, minmax(0, 1fr))`,
                    gap,
                }}
            >
                {items.map((item, index) => (
                    <CompactProjectCard
                        key={`${item.label || "project"}-${index}`}
                        item={item}
                        index={index}
                        radius={radius}
                        imageFit={imageFit}
                        cardBackground={cardBackground}
                        labelColor={labelColor}
                        labelFont={labelFont}
                        aspect={aspect}
                    />
                ))}
            </div>
        </section>
    )
}

/**
 * Made in Stylokit
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 900
 * @framerDisableUnlink
 */
export default function OrbitProjects(props: Props) {
    const {
        items,
        background,
        content: contentProp,
        cards: cardsProp,
        motion: motionProp,
        grid: gridProp,
        responsive: responsiveProp,
        canvas: canvasProp,
        style,
    } = props

    const content = {
        ...DEFAULT_CONTENT,
        ...(contentProp || {}),
    }

    const cards = {
        ...DEFAULT_CARDS,
        ...(cardsProp || {}),
    }

    const motion = {
        ...DEFAULT_MOTION,
        ...(motionProp || {}),
    }

    const grid = {
        ...DEFAULT_GRID,
        ...(gridProp || {}),
    }

    const responsive = {
        ...DEFAULT_RESPONSIVE,
        ...(responsiveProp || {}),
    }

    const canvas = {
        ...DEFAULT_CANVAS,
        ...(canvasProp || {}),
    }

    const {
        showCopy,
        textColor,
        leftTitle,
        rightTitle,
        desktopTitleFont,
        compactTitleFont,
        titleCenterGap,
        centerText,
        centerTextWidth,
        desktopCenterFont,
        tabletCenterFont,
        mobileCenterFont,
        compactTextColor,
        compactTextGap,
    } = content

    const {
        background: cardBackground,
        radius: cardRadius,
        aspect: cardAspect,
        imageFit,
        depthOpacity,
        depthScale,
        renderQuality,
        labelColor,
        labelFont,
    } = cards

    const {
        scrollLength,
        startOffset,
        smoothness,
        perspective,
        curveWidth,
        curveHeight,
        depth,
        rotation: orbitRotation,
        cardWidth: arcCardWidth,
        offsetY: orbitOffsetY,
    } = motion

    const {
        columns: gridColumns,
        gap: gridGap,
        maxWidth: gridMaxWidth,
        positionY: gridPositionY,
    } = grid

    const {
        desktopBreakpoint,
        mobileBreakpoint,
        tabletColumns,
        mobileColumns,
        tabletPadding,
        mobilePadding,
        gap: compactGap,
        headerGap: compactHeaderGap,
    } = responsive

    const { layout: canvasLayout, progress: canvasProgress } = canvas

    const rootRef = React.useRef<HTMLDivElement | null>(null)

    const [viewportElement, setViewportElement] =
        React.useState<HTMLDivElement | null>(null)

    const viewportRef = React.useCallback((node: HTMLDivElement | null) => {
        setViewportElement(node)
    }, [])

    const targetProgressRef = React.useRef(clamp(canvasProgress))
    const animatedProgressRef = React.useRef(clamp(canvasProgress))
    const progressRafRef = React.useRef<number | null>(null)
    const lastFrameTimeRef = React.useRef<number | null>(null)

    const isStaticRenderer = useIsStaticRenderer()
    const renderTarget = RenderTarget.current()
    const isThumbnailRenderer = renderTarget === RenderTarget.thumbnail

    const projectItems = items && items.length > 0 ? items : DEFAULT_ITEMS

    const [progress, setProgress] = React.useState(clamp(canvasProgress))

    const [viewport, setViewport] = React.useState<ViewportSize>({
        width: 1440,
        height: 900,
    })

    React.useLayoutEffect(() => {
        const element = viewportElement

        if (!element) return

        let frameA: number | null = null
        let frameB: number | null = null

        const measure = () => {
            const bounds = element.getBoundingClientRect()
            const width = Math.max(Math.round(bounds.width), 1)
            const height = Math.max(Math.round(bounds.height), 1)

            setViewport((previous) => {
                if (
                    Math.abs(previous.width - width) < 1 &&
                    Math.abs(previous.height - height) < 1
                ) {
                    return previous
                }

                return {
                    width,
                    height,
                }
            })
        }

        /**
         * Framer Desktop can briefly report an intermediate frame size
         * while its preview shell is restoring. Measure once immediately,
         * then again over the next two frames so the settled size wins.
         */
        measure()

        frameA = window.requestAnimationFrame(() => {
            measure()

            frameB = window.requestAnimationFrame(measure)
        })

        const observer = new ResizeObserver(measure)
        observer.observe(element)

        return () => {
            if (frameA !== null) {
                window.cancelAnimationFrame(frameA)
            }

            if (frameB !== null) {
                window.cancelAnimationFrame(frameB)
            }

            observer.disconnect()
        }
    }, [viewportElement])

    const measuredIsCompact = viewport.width < desktopBreakpoint
    const measuredIsMobile = viewport.width < mobileBreakpoint

    /**
     * Canvas preview can be forced independently from the live responsive mode.
     *
     * - Desktop: Canvas Progress controls the animated desktop state.
     * - Tablet / Mobile: Shows the direct grid layout.
     *
     * Published/Preview site always stays fully responsive.
     */
    /**
     * Framer Marketplace thumbnails are rendered through
     * RenderTarget.thumbnail. Their CSS viewport can be much narrower
     * than the exported screenshot because of DPR/scaling, which was
     * incorrectly triggering the tablet/mobile layout.
     *
     * Always render the desktop composition for thumbnails.
     * Canvas still respects the D / T / M preview control.
     * Live Preview / Published site still uses the real measured width.
     */
    const isCompact = isThumbnailRenderer
        ? false
        : isStaticRenderer
          ? canvasLayout === "tablet" || canvasLayout === "mobile"
          : measuredIsCompact

    const isMobile = isThumbnailRenderer
        ? false
        : isStaticRenderer
          ? canvasLayout === "mobile"
          : measuredIsMobile

    const [isNearViewport, setIsNearViewport] = React.useState(false)

    /**
     * Only activate the desktop scroll engine while the component is
     * in or near the viewport. The 100% root margin wakes it one full
     * viewport early, so there is no visible startup delay.
     */
    React.useEffect(() => {
        if (typeof window === "undefined") return

        if (isStaticRenderer || isCompact) {
            setIsNearViewport(true)
            return
        }

        const root = rootRef.current

        if (!root || !("IntersectionObserver" in window)) {
            setIsNearViewport(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsNearViewport(entry.isIntersecting)
            },
            {
                root: null,
                rootMargin: "100% 0px 100% 0px",
                threshold: 0,
            }
        )

        observer.observe(root)

        return () => {
            observer.disconnect()
        }
    }, [isStaticRenderer, isCompact])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        if (progressRafRef.current !== null) {
            window.cancelAnimationFrame(progressRafRef.current)
            progressRafRef.current = null
        }

        lastFrameTimeRef.current = null

        if (isStaticRenderer || isCompact) {
            const nextProgress = isCompact ? 1 : clamp(canvasProgress)

            targetProgressRef.current = nextProgress
            animatedProgressRef.current = nextProgress
            setProgress(nextProgress)

            return
        }

        if (!isNearViewport) {
            targetProgressRef.current = progress
            animatedProgressRef.current = progress
            return
        }

        if (!rootRef.current) return

        const animateProgress = (time: number) => {
            progressRafRef.current = null

            const previousTime = lastFrameTimeRef.current ?? time

            const deltaSeconds = Math.min(
                Math.max((time - previousTime) / 1000, 0),
                0.064
            )

            lastFrameTimeRef.current = time

            const current = animatedProgressRef.current
            const target = targetProgressRef.current

            const dampingRate = Math.max(smoothness, 0.1)

            const interpolation = 1 - Math.exp(-dampingRate * deltaSeconds)

            const next = current + (target - current) * interpolation

            const difference = Math.abs(target - next)

            const finalProgress = difference < 0.0001 ? target : next

            animatedProgressRef.current = finalProgress

            setProgress(finalProgress)

            if (difference >= 0.0001) {
                progressRafRef.current =
                    window.requestAnimationFrame(animateProgress)
            } else {
                lastFrameTimeRef.current = null
            }
        }

        const updateTargetProgress = () => {
            const root = rootRef.current

            if (!root) return

            const bounds = root.getBoundingClientRect()

            const entryLead =
                window.innerHeight * (clamp(startOffset, 0, 100) / 100)

            const availableDistance = Math.max(
                bounds.height - window.innerHeight,
                1
            )

            targetProgressRef.current = clamp(
                (entryLead - bounds.top) / availableDistance
            )

            if (progressRafRef.current === null) {
                progressRafRef.current =
                    window.requestAnimationFrame(animateProgress)
            }
        }

        updateTargetProgress()

        window.addEventListener("scroll", updateTargetProgress, {
            passive: true,
        })

        window.addEventListener("resize", updateTargetProgress)

        return () => {
            if (progressRafRef.current !== null) {
                window.cancelAnimationFrame(progressRafRef.current)
            }

            progressRafRef.current = null
            lastFrameTimeRef.current = null

            window.removeEventListener("scroll", updateTargetProgress)

            window.removeEventListener("resize", updateTargetProgress)
        }
    }, [
        isStaticRenderer,
        isCompact,
        isNearViewport,
        canvasProgress,
        smoothness,
        startOffset,
    ])

    if (isCompact) {
        return (
            <div
                ref={viewportRef}
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: "auto",
                    overflow: "visible",
                    background,
                }}
            >
                <CompactLayout
                    items={projectItems}
                    background={background}
                    textColor={textColor}
                    leftTitle={leftTitle}
                    rightTitle={rightTitle}
                    centerText={centerText}
                    showCopy={showCopy}
                    titleFont={compactTitleFont}
                    centerFont={isMobile ? mobileCenterFont : tabletCenterFont}
                    centerTextWidth={centerTextWidth}
                    centerTextColor={compactTextColor}
                    contentGap={compactTextGap}
                    columns={isMobile ? mobileColumns : tabletColumns}
                    gap={compactGap}
                    headerGap={compactHeaderGap}
                    padding={isMobile ? mobilePadding : tabletPadding}
                    radius={cardRadius}
                    aspect={cardAspect}
                    imageFit={imageFit}
                    cardBackground={cardBackground}
                    labelColor={labelColor}
                    labelFont={labelFont}
                />
            </div>
        )
    }

    const viewportWidth = viewport.width
    const viewportHeight = viewport.height
    const itemCount = projectItems.length

    const horizontalPadding = 48

    const desktopColumns = Math.min(
        Math.max(Math.round(gridColumns), 1),
        Math.max(itemCount, 1)
    )

    const rows = Math.ceil(itemCount / desktopColumns)

    const availableGridWidth = Math.max(
        viewportWidth - horizontalPadding * 2,
        200
    )

    const finalGridWidth = Math.min(gridMaxWidth, availableGridWidth)

    const finalCardWidth = Math.max(
        90,
        (finalGridWidth - gridGap * (desktopColumns - 1)) / desktopColumns
    )

    const finalCardHeight = finalCardWidth / Math.max(cardAspect, 0.2)

    const finalGridHeight =
        rows * finalCardHeight + Math.max(rows - 1, 0) * gridGap

    const actualArcCardWidth = Math.min(arcCardWidth, viewportWidth * 0.28)

    const actualArcCardHeight = actualArcCardWidth / Math.max(cardAspect, 0.2)

    const actualCurveWidth = Math.min(curveWidth, viewportWidth * 0.44)

    const actualCurveHeight = Math.min(curveHeight, viewportHeight * 0.3)

    const actualDepth = Math.min(depth, viewportWidth * 0.42)

    const titleEnterProgress = smootherstep(0, 0.2, progress)

    const titleExitProgress = smootherstep(0.74, 0.94, progress)

    const titleOpacity = titleEnterProgress * (1 - titleExitProgress)

    const titleVerticalShift = lerp(28, 0, titleEnterProgress)

    const titleOutsideOffset = viewportWidth * 0.7

    /*
     * Center text-ийн өргөнийг title-уудын дундах
     * хамгаалалтын зайд оруулна. Ингэснээр зүүн/баруун
     * том title center text дээр давхарлаж орохгүй.
     */
    const safeCenterTextWidth = Math.min(
        Math.max(centerTextWidth, 0),
        viewportWidth * 0.5
    )

    const titleFinalOffset =
        (safeCenterTextWidth + Math.max(titleCenterGap, 0)) / 2

    const leftTitleOffset = lerp(
        titleOutsideOffset,
        titleFinalOffset,
        titleEnterProgress
    )

    const rightTitleOffset = lerp(
        titleOutsideOffset,
        titleFinalOffset,
        titleEnterProgress
    )

    const revealProgress = smootherstep(0, 0.17, progress)

    const orbitProgress = smootherstep(0.05, 0.7, progress)

    const centerCopyOpacity =
        smootherstep(0.12, 0.25, progress) *
        (1 - smootherstep(0.58, 0.82, progress))

    return (
        <section
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: isStaticRenderer
                    ? "100%"
                    : `${Math.max(scrollLength, 120)}vh`,
                minHeight: isStaticRenderer ? 600 : undefined,
                background,
            }}
        >
            <div
                ref={viewportRef}
                style={{
                    position: isStaticRenderer ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    height: isStaticRenderer ? "100%" : "100svh",
                    minHeight: 600,
                    overflow: "hidden",
                    background,
                    perspective: `${perspective}px`,
                    perspectiveOrigin: "50% 50%",
                    transformStyle: "preserve-3d",
                    isolation: "isolate",
                }}
            >
                {showCopy && (
                    <>
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "56%",
                                zIndex: 0,
                                width: "max-content",
                                pointerEvents: "none",
                                opacity: titleOpacity,
                                transform: `
                                    translate3d(
                                        calc(-100% - ${leftTitleOffset}px),
                                        calc(-50% + ${titleVerticalShift}px),
                                        0
                                    )
                                `,
                                willChange: "transform, opacity",
                            }}
                        >
                            <div
                                style={{
                                    ...desktopTitleFont,
                                    margin: 0,
                                    whiteSpace: "nowrap",
                                    color: textColor,
                                }}
                            >
                                {leftTitle}
                            </div>
                        </div>

                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "39%",
                                zIndex: 0,
                                width: "max-content",
                                pointerEvents: "none",
                                opacity: titleOpacity,
                                transform: `
                                    translate3d(
                                        ${rightTitleOffset}px,
                                        calc(-50% - ${titleVerticalShift}px),
                                        0
                                    )
                                `,
                                willChange: "transform, opacity",
                            }}
                        >
                            <div
                                style={{
                                    ...desktopTitleFont,
                                    margin: 0,
                                    whiteSpace: "nowrap",
                                    color: textColor,
                                }}
                            >
                                {rightTitle}
                            </div>
                        </div>

                        <div
                            style={{
                                ...desktopCenterFont,
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                zIndex: 2,
                                width: safeCenterTextWidth,
                                maxWidth: "80vw",
                                padding: 16,
                                boxSizing: "border-box",
                                pointerEvents: "none",
                                opacity: centerCopyOpacity,
                                transform: "translate3d(-50%, -50%, 0)",
                                color: textColor,
                            }}
                        >
                            {centerText}
                        </div>
                    </>
                )}

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 10,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {projectItems.map((item, index) => {
                        const revealStart = 0.025 + index * 0.01

                        const revealEnd = 0.18 + index * 0.012

                        const cardReveal = smootherstep(
                            revealStart,
                            revealEnd,
                            progress
                        )

                        const flattenStart = 0.56 + index * 0.009

                        const flattenEnd = Math.min(0.91 + index * 0.009, 0.99)

                        const flattenProgress = smootherstep(
                            flattenStart,
                            flattenEnd,
                            progress
                        )

                        const baseAngle =
                            (index / Math.max(itemCount, 1)) * 360 - 125

                        const angle = baseAngle + orbitProgress * orbitRotation

                        const radians = (angle * Math.PI) / 180

                        const arcCenterX = Math.sin(radians) * actualCurveWidth

                        const arcCenterY =
                            Math.cos(radians + 0.65) * actualCurveHeight -
                            viewportHeight * 0.025 +
                            orbitOffsetY

                        const arcZ = Math.cos(radians) * actualDepth

                        const normalizedDepth = clamp(
                            (arcZ + actualDepth) / Math.max(actualDepth * 2, 1)
                        )

                        const minimumDepthScale =
                            clamp(depthScale, 50, 100) / 100

                        const arcScale = lerp(
                            minimumDepthScale,
                            1,
                            normalizedDepth
                        )

                        const minimumDepthOpacity =
                            clamp(depthOpacity, 0, 100) / 100

                        const arcOpacity = lerp(
                            minimumDepthOpacity,
                            1,
                            normalizedDepth
                        )

                        const arcRotateY = -Math.sin(radians) * 62

                        const arcRotateZ = -Math.sin(radians) * 8

                        const entranceOffset =
                            (1 - cardReveal) * viewportHeight * 0.48

                        const arcLeft = arcCenterX - actualArcCardWidth / 2

                        const arcTop =
                            arcCenterY -
                            actualArcCardHeight / 2 +
                            entranceOffset

                        const column = index % desktopColumns

                        const row = Math.floor(index / desktopColumns)

                        const gridLeft =
                            -finalGridWidth / 2 +
                            column * (finalCardWidth + gridGap)

                        const gridTop =
                            viewportHeight * (gridPositionY / 100) -
                            viewportHeight / 2 -
                            finalGridHeight / 2 +
                            row * (finalCardHeight + gridGap)

                        const width = lerp(
                            actualArcCardWidth,
                            finalCardWidth,
                            flattenProgress
                        )

                        const height = lerp(
                            actualArcCardHeight,
                            finalCardHeight,
                            flattenProgress
                        )

                        const x = lerp(arcLeft, gridLeft, flattenProgress)

                        const y = lerp(arcTop, gridTop, flattenProgress)

                        const z = lerp(arcZ, 0, flattenProgress)

                        const rotateY = lerp(arcRotateY, 0, flattenProgress)

                        const rotateZ = lerp(arcRotateZ, 0, flattenProgress)

                        const scale = lerp(arcScale, 1, flattenProgress)

                        const opacity = clamp(
                            lerp(
                                arcOpacity * cardReveal * revealProgress,
                                1,
                                flattenProgress
                            )
                        )

                        const zIndex =
                            flattenProgress > 0.86
                                ? 100 + index
                                : Math.round(100 + normalizedDepth * 800)

                        return (
                            <DesktopProjectCard
                                key={`${item.label || "project"}-${index}`}
                                item={item}
                                index={index}
                                x={x}
                                y={y}
                                z={z}
                                width={width}
                                height={height}
                                rotateY={rotateY}
                                rotateZ={rotateZ}
                                scale={scale}
                                opacity={opacity}
                                zIndex={zIndex}
                                radius={cardRadius}
                                imageFit={imageFit}
                                cardBackground={cardBackground}
                                labelColor={labelColor}
                                labelFont={labelFont}
                                renderQuality={renderQuality}
                                flattened={flattenProgress}
                            />
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

OrbitProjects.displayName = "Orbit Projects"

OrbitProjects.defaultProps = {
    items: DEFAULT_ITEMS,
    background: "#D4D4D4",
    content: DEFAULT_CONTENT,
    cards: DEFAULT_CARDS,
    motion: DEFAULT_MOTION,
    grid: DEFAULT_GRID,
    responsive: DEFAULT_RESPONSIVE,
    canvas: DEFAULT_CANVAS,
}

addPropertyControls(OrbitProjects, {
    items: {
        title: "Projects",
        type: ControlType.Array,
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    title: "Image",
                    type: ControlType.Image,
                },
                label: {
                    title: "Label",
                    type: ControlType.String,
                    defaultValue: "Project",
                },
                link: {
                    title: "Link",
                    type: ControlType.Link,
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },

    background: {
        title: "Background",
        type: ControlType.Color,
        defaultValue: "#D4D4D4",
    },

    content: {
        title: "Content",
        type: ControlType.Object,
        defaultValue: DEFAULT_CONTENT,
        controls: {
            showCopy: {
                title: "Show content",
                type: ControlType.Boolean,
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            textColor: {
                title: "Text color",
                type: ControlType.Color,
                defaultValue: "#242424",
            },
            leftTitle: {
                title: "Title line 1",
                type: ControlType.String,
                defaultValue: "MOTION",
            },
            rightTitle: {
                title: "Title line 2",
                type: ControlType.String,
                defaultValue: "DESIGN IN",
            },
            desktopTitleFont: {
                title: "Desktop title",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 144,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 144,
                    variant: "Regular",
                    lineHeight: 0.86,
                    letterSpacing: "-0.075em",
                    textAlign: "left",
                },
            },
            compactTitleFont: {
                title: "Mobile title",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 72,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 72,
                    variant: "Regular",
                    lineHeight: 0.9,
                    letterSpacing: "-0.065em",
                    textAlign: "left",
                },
            },
            titleCenterGap: {
                title: "Title gap",
                type: ControlType.Number,
                defaultValue: 32,
                min: 0,
                max: 400,
                step: 1,
            },
            centerText: {
                title: "Text",
                type: ControlType.String,
                defaultValue: "Exploring ideas through daily design practice.",
                displayTextArea: true,
            },
            centerTextWidth: {
                title: "Text width",
                type: ControlType.Number,
                defaultValue: 220,
                min: 100,
                max: 600,
                step: 1,
            },
            compactTextGap: {
                title: "Mobile gap",
                type: ControlType.Number,
                defaultValue: 28,
                min: 0,
                max: 160,
                step: 1,
                unit: "px",
            },
            desktopCenterFont: {
                title: "Desktop text",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 12,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                    textAlign: "center",
                },
            },
            tabletCenterFont: {
                title: "Tablet text",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 12,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                    textAlign: "left",
                },
            },
            mobileCenterFont: {
                title: "Mobile text",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 12,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 12,
                    variant: "Medium",
                    lineHeight: 1.05,
                    letterSpacing: "-0.035em",
                    textAlign: "left",
                },
            },
            compactTextColor: {
                title: "T/Mobile color",
                type: ControlType.Color,
                defaultValue: "#242424",
            },
        },
    },

    cards: {
        title: "Cards",
        type: ControlType.Object,
        defaultValue: DEFAULT_CARDS,
        controls: {
            background: {
                title: "Card background",
                type: ControlType.Color,
                defaultValue: "#E8E8E8",
            },
            labelColor: {
                title: "Label color",
                type: ControlType.Color,
                defaultValue: "rgba(0, 0, 0, 0.5)",
            },
            labelFont: {
                title: "Label font",
                type: ControlType.Font,
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultFontSize: 14,
                displayFontSize: true,
                displayTextAlignment: true,
                defaultValue: {
                    fontFamily: "Inter",
                    fontSize: 14,
                    variant: "Regular",
                    lineHeight: 1.2,
                    letterSpacing: "0em",
                    textAlign: "center",
                },
            },
            radius: {
                title: "Radius",
                type: ControlType.Number,
                defaultValue: 8,
                min: 0,
                max: 64,
                step: 1,
            },
            aspect: {
                title: "Ratio",
                type: ControlType.Number,
                defaultValue: 1.48,
                min: 0.5,
                max: 2.5,
                step: 0.01,
            },
            imageFit: {
                title: "Image fit",
                type: ControlType.Enum,
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
                displaySegmentedControl: true,
            },
            depthOpacity: {
                title: "Depth opacity",
                type: ControlType.Number,
                defaultValue: 20,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            depthScale: {
                title: "Depth scale",
                type: ControlType.Number,
                defaultValue: 82,
                min: 50,
                max: 100,
                step: 1,
                unit: "%",
            },
            renderQuality: {
                title: "Image quality",
                type: ControlType.Number,
                defaultValue: 2,
                min: 1,
                max: 3,
                step: 0.25,
                unit: "x",
            },
        },
    },

    motion: {
        title: "Motion",
        type: ControlType.Object,
        defaultValue: DEFAULT_MOTION,
        controls: {
            scrollLength: {
                title: "Scroll length",
                type: ControlType.Number,
                defaultValue: 460,
                min: 180,
                max: 900,
                step: 10,
                unit: "vh",
            },
            startOffset: {
                title: "Start offset",
                type: ControlType.Number,
                defaultValue: 55,
                min: 0,
                max: 100,
                step: 1,
                unit: "%",
            },
            smoothness: {
                title: "Smoothness",
                type: ControlType.Number,
                defaultValue: 7,
                min: 1,
                max: 20,
                step: 0.5,
            },
            perspective: {
                title: "Perspective",
                type: ControlType.Number,
                defaultValue: 1300,
                min: 400,
                max: 3000,
                step: 50,
            },
            curveWidth: {
                title: "Curve width",
                type: ControlType.Number,
                defaultValue: 570,
                min: 100,
                max: 1200,
                step: 10,
            },
            curveHeight: {
                title: "Curve height",
                type: ControlType.Number,
                defaultValue: 210,
                min: 0,
                max: 600,
                step: 10,
            },
            depth: {
                title: "Depth",
                type: ControlType.Number,
                defaultValue: 520,
                min: 0,
                max: 1400,
                step: 10,
            },
            rotation: {
                title: "Rotation",
                type: ControlType.Number,
                defaultValue: 310,
                min: -720,
                max: 720,
                step: 5,
                unit: "°",
            },
            cardWidth: {
                title: "Orbit card",
                type: ControlType.Number,
                defaultValue: 410,
                min: 120,
                max: 800,
                step: 10,
            },
            offsetY: {
                title: "Orbit Y",
                type: ControlType.Number,
                defaultValue: -40,
                min: -200,
                max: 200,
                step: 1,
                unit: "px",
            },
        },
    },

    grid: {
        title: "Desktop grid",
        type: ControlType.Object,
        defaultValue: DEFAULT_GRID,
        controls: {
            columns: {
                title: "Columns",
                type: ControlType.Number,
                defaultValue: 3,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
            },
            gap: {
                title: "Gap",
                type: ControlType.Number,
                defaultValue: 16,
                min: 0,
                max: 80,
                step: 1,
            },
            maxWidth: {
                title: "Max width",
                type: ControlType.Number,
                defaultValue: 1160,
                min: 300,
                max: 1800,
                step: 10,
            },
            positionY: {
                title: "Position Y",
                type: ControlType.Number,
                defaultValue: 52,
                min: 20,
                max: 80,
                step: 1,
                unit: "%",
            },
        },
    },

    responsive: {
        title: "Responsive",
        type: ControlType.Object,
        defaultValue: DEFAULT_RESPONSIVE,
        controls: {
            desktopBreakpoint: {
                title: "Desktop min",
                type: ControlType.Number,
                defaultValue: 1024,
                min: 768,
                max: 1440,
                step: 1,
            },
            mobileBreakpoint: {
                title: "Mobile max",
                type: ControlType.Number,
                defaultValue: 640,
                min: 320,
                max: 900,
                step: 1,
            },
            tabletColumns: {
                title: "Tablet columns",
                type: ControlType.Number,
                defaultValue: 2,
                min: 1,
                max: 4,
                step: 1,
                displayStepper: true,
            },
            mobileColumns: {
                title: "Mobile columns",
                type: ControlType.Number,
                defaultValue: 1,
                min: 1,
                max: 3,
                step: 1,
                displayStepper: true,
            },
            tabletPadding: {
                title: "Tablet padding",
                type: ControlType.Padding,
                defaultValue: "72px 24px",
            },
            mobilePadding: {
                title: "Mobile padding",
                type: ControlType.Padding,
                defaultValue: "72px 24px",
            },
            gap: {
                title: "Grid gap",
                type: ControlType.Number,
                defaultValue: 14,
                min: 0,
                max: 80,
                step: 1,
            },
            headerGap: {
                title: "Header / cards gap",
                type: ControlType.Number,
                defaultValue: 56,
                min: 0,
                max: 200,
                step: 1,
            },
        },
    },

    canvas: {
        title: "Canvas",
        type: ControlType.Object,
        defaultValue: DEFAULT_CANVAS,
        controls: {
            layout: {
                title: "Layout",
                type: ControlType.Enum,
                options: ["desktop", "tablet", "mobile"],
                optionTitles: ["D", "T", "M"],
                defaultValue: "desktop",
                displaySegmentedControl: true,
            },
            progress: {
                title: "Progress",
                type: ControlType.Number,
                defaultValue: 0.48,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
        description: "More components at [Stylokit](https://stylokit.com/).",
    },
})
