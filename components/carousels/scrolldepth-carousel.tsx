// Get Started: https://www.framer.com/developers

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, animate } from "framer-motion"
import {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
    startTransition,
} from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
interface CarouselImageItem {
    src?: string
    url?: string
    alt?: string
    tag?: string
    title?: string
    subtitle?: string
}

interface MyComponentProps {
    images: Array<CarouselImageItem | string>
    cardWidth: number
    cardHeight: number
    cardGap: number
    depthIntensity: number
    blurStrength: number
    autoPlay: boolean
    autoPlayInterval: number
    showDots: boolean
    showLabels: boolean
    accentColor: string
    borderRadius: number
    showActiveRing: boolean
    activeRingWidth: number
    interactionSpeed: number
    cardStyle: "Curved" | "Straight"
    tickerMode: boolean
    tickerSpeed: number
    labelFont: any
    cornerBrackets: boolean
    bracketGap: number
    bracketThickness: number
    bracketColor: string
    bracketSize: number
}

export default function SnapCarousel3D(props: MyComponentProps) {
    const {
        images,
        cardWidth,
        cardHeight,
        cardGap,
        depthIntensity,
        blurStrength,
        autoPlay,
        autoPlayInterval,
        showDots,
        showLabels,
        accentColor,
        borderRadius,
        showActiveRing,
        activeRingWidth,
        interactionSpeed,
        cardStyle,
        tickerMode,
        tickerSpeed,
        labelFont,
        cornerBrackets,
        bracketGap,
        bracketThickness,
        bracketColor,
        bracketSize,
    } = props

    const [current, setCurrent] = useState(0)
    const [dragOffset, setDragOffset] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [isTickerHovered, setIsTickerHovered] = useState(false)
    const [hoveredTickerCard, setHoveredTickerCard] = useState<number | null>(
        null
    )
    const [isInView, setIsInView] = useState(false)

    const dragStartX = useRef(0)
    const lastX = useRef(0)
    const lastT = useRef(0)
    const velX = useRef(0)
    const autoTimer = useRef<number | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const tickerAnimControls = useRef<{ stop: () => void } | null>(null)
    const tickerX = useMotionValue(0)
    const isStaticRenderer = useIsStaticRenderer()

    const N = Math.max(1, images.length)
    const SPREAD = cardWidth + cardGap
    const tickerItems = useMemo(() => [...images, ...images], [images])

    const mod = (n: number, m: number) => ((n % m) + m) % m
    const getItemSrc = (item: CarouselImageItem | string) =>
        typeof item === "string" ? item : item?.src || item?.url || ""
    const getItemAlt = (item: CarouselImageItem | string, fallback: string) =>
        typeof item === "string" ? fallback : item?.alt || fallback
    const getItemTag = (item: CarouselImageItem | string) =>
        typeof item === "string" ? "" : item?.tag || ""
    const getItemTitle = (item: CarouselImageItem | string) =>
        typeof item === "string" ? "" : item?.title || ""
    const getItemSubtitle = (item: CarouselImageItem | string) =>
        typeof item === "string" ? "" : item?.subtitle || ""

    const springTransition = useMemo(() => {
        const speed = Math.max(0.2, interactionSpeed)
        return {
            type: "spring" as const,
            stiffness: 260 * speed,
            damping: 30 * Math.sqrt(speed),
            mass: Math.max(0.45, 0.8 / speed),
        }
    }, [interactionSpeed])

    const goTo = useCallback(
        (idx: number) => {
            startTransition(() => {
                setCurrent(mod(idx, N))
                setDragOffset(0)
            })
        },
        [N]
    )

    // ── IntersectionObserver — pause ticker & autoplay when offscreen ──────────
    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                startTransition(() => setIsInView(entry.isIntersecting))
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // ── Auto play — clear existing before creating, reset ref on cleanup ───────
    useEffect(() => {
        // Always clear any existing timer first
        if (autoTimer.current !== null) {
            window.clearInterval(autoTimer.current)
            autoTimer.current = null
        }

        if (!autoPlay || tickerMode || isStaticRenderer || !isInView) return

        autoTimer.current = window.setInterval(() => {
            startTransition(() => {
                setCurrent((c) => mod(c + 1, N))
            })
        }, autoPlayInterval)

        return () => {
            if (autoTimer.current !== null) {
                window.clearInterval(autoTimer.current)
                autoTimer.current = null
            }
        }
    }, [autoPlay, autoPlayInterval, N, tickerMode, isStaticRenderer, isInView])

    // ── Wheel scroll ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (tickerMode) return
        const el = containerRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            e.preventDefault()
            const delta = e.deltaY || e.deltaX
            if (Math.abs(delta) > 20) {
                startTransition(() => {
                    setCurrent((c) => mod(c + (delta > 0 ? 1 : -1), N))
                    setDragOffset(0)
                })
            }
        }
        el.addEventListener("wheel", handler, { passive: false })
        return () => el.removeEventListener("wheel", handler)
    }, [N, tickerMode])

    // ── Ticker animation — only runs when component is in viewport ────────────
    useEffect(() => {
        // Stop any running animation first
        if (tickerAnimControls.current) {
            tickerAnimControls.current.stop()
            tickerAnimControls.current = null
        }

        if (
            !tickerMode ||
            isStaticRenderer ||
            images.length === 0 ||
            !isInView
        ) {
            // Reset position when not visible so it restarts cleanly on re-entry
            if (!isInView) tickerX.set(0)
            return
        }

        const cycleWidth = images.length * SPREAD
        const pxPerSecond =
            Math.max(5, tickerSpeed) * (isTickerHovered ? 0.35 : 1)
        const duration = cycleWidth / pxPerSecond

        // Start a fresh loop from 0 every time conditions change
        tickerX.set(0)
        const controls = animate(tickerX, [0, -cycleWidth], {
            ease: "linear",
            duration,
            repeat: Infinity,
            repeatType: "loop",
        })
        tickerAnimControls.current = controls

        return () => {
            controls.stop()
            tickerAnimControls.current = null
        }
    }, [
        tickerMode,
        images.length,
        SPREAD,
        tickerSpeed,
        isTickerHovered,
        tickerX,
        isStaticRenderer,
        isInView,
    ])

    // ── Pointer events ────────────────────────────────────────────────────────
    const onPointerDown = (e: React.PointerEvent) => {
        if (tickerMode) return
        startTransition(() => setIsDragging(true))
        dragStartX.current = e.clientX
        lastX.current = e.clientX
        lastT.current = performance.now()
        velX.current = 0
        // Clear autoplay timer while dragging
        if (autoTimer.current !== null) {
            window.clearInterval(autoTimer.current)
            autoTimer.current = null
        }
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const onPointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        const now = performance.now()
        const dx = e.clientX - lastX.current
        velX.current = (dx / (now - lastT.current + 1)) * 16
        lastX.current = e.clientX
        lastT.current = now
        startTransition(() => setDragOffset(e.clientX - dragStartX.current))
    }

    const onPointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return
        startTransition(() => setIsDragging(false))
        const total = e.clientX - dragStartX.current
        if (Math.abs(total) > SPREAD * 0.28 || Math.abs(velX.current) > 4) {
            startTransition(() => {
                setCurrent((c) => mod(c + (total > 0 ? -1 : 1), N))
            })
        }
        startTransition(() => setDragOffset(0))
    }

    const getCardStyle = (index: number) => {
        let rel = index - current
        if (rel > N / 2) rel -= N
        if (rel < -N / 2) rel += N

        const relWithDrag = rel + dragOffset / SPREAD
        const absRel = Math.abs(relWithDrag)

        const x = rel * SPREAD + dragOffset
        const scale = Math.max(0.5, 1 - absRel * (0.12 + depthIntensity * 0.04))
        const tz = Math.max(-400, -absRel * (120 + depthIntensity * 20))
        const rotateY =
            cardStyle === "Straight"
                ? 0
                : -relWithDrag * (6 + depthIntensity * 2)
        const opacity = Math.max(0, 1 - absRel * (0.22 + depthIntensity * 0.03))
        const blur = Math.max(0, absRel * blurStrength - 0.4)
        const zIndex = Math.round(20 - Math.abs(rel) * 4)
        const isActive = absRel < 0.4

        return { x, scale, tz, rotateY, opacity, blur, zIndex, isActive }
    }

    // ── Bracket helper ────────────────────────────────────────────────────────
    const renderBrackets = () => (
        <>
            {[
                {
                    top: -bracketGap,
                    left: -bracketGap,
                    borderTop: `${bracketThickness}px solid ${bracketColor}`,
                    borderLeft: `${bracketThickness}px solid ${bracketColor}`,
                },
                {
                    top: -bracketGap,
                    right: -bracketGap,
                    borderTop: `${bracketThickness}px solid ${bracketColor}`,
                    borderRight: `${bracketThickness}px solid ${bracketColor}`,
                },
                {
                    bottom: -bracketGap,
                    left: -bracketGap,
                    borderBottom: `${bracketThickness}px solid ${bracketColor}`,
                    borderLeft: `${bracketThickness}px solid ${bracketColor}`,
                },
                {
                    bottom: -bracketGap,
                    right: -bracketGap,
                    borderBottom: `${bracketThickness}px solid ${bracketColor}`,
                    borderRight: `${bracketThickness}px solid ${bracketColor}`,
                },
            ].map((s, i) => (
                <div
                    key={i}
                    style={{
                        ...styles.bracket,
                        width: bracketSize,
                        height: bracketSize,
                        ...s,
                    }}
                />
            ))}
        </>
    )

    // ── Label overlay ─────────────────────────────────────────────────────────
    const renderOverlay = (
        item: CarouselImageItem | string,
        visible: boolean,
        hovered = false
    ) =>
        showLabels ? (
            <motion.div
                animate={{ opacity: visible || hovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={styles.overlay}
            >
                {getItemTag(item) && (
                    <span style={{ ...labelFont, ...styles.tag }}>
                        {getItemTag(item)}
                    </span>
                )}
                {getItemTitle(item) && (
                    <p style={{ ...labelFont, ...styles.cardTitle }}>
                        {getItemTitle(item)}
                    </p>
                )}
                {getItemSubtitle(item) && (
                    <p style={{ ...labelFont, ...styles.cardSub }}>
                        {getItemSubtitle(item)}
                    </p>
                )}
            </motion.div>
        ) : null

    return (
        <div style={styles.root}>
            {/* Perspective track */}
            <div
                ref={containerRef}
                style={{
                    ...styles.viewport,
                    perspective: tickerMode
                        ? "none"
                        : cardStyle === "Straight"
                          ? "none"
                          : "1200px",
                    cursor: tickerMode ? "default" : "grab",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                    startTransition(() => {
                        setIsDragging(false)
                        setDragOffset(0)
                    })
                }}
                onMouseEnter={() => {
                    if (!tickerMode) return
                    startTransition(() => setIsTickerHovered(true))
                }}
                onMouseLeave={() => {
                    if (!tickerMode) return
                    startTransition(() => {
                        setIsTickerHovered(false)
                        setHoveredTickerCard(null)
                    })
                }}
            >
                {tickerMode ? (
                    <motion.div
                        style={{
                            ...styles.tickerTrack,
                            gap: cardGap,
                            x: tickerX,
                        }}
                    >
                        {tickerItems.map((item, i) => (
                            <motion.div
                                key={`${i}-${getItemSrc(item) || getItemTitle(item) || "slide"}`}
                                onMouseEnter={() =>
                                    startTransition(() =>
                                        setHoveredTickerCard(i)
                                    )
                                }
                                onMouseLeave={() =>
                                    startTransition(() =>
                                        setHoveredTickerCard(null)
                                    )
                                }
                                style={{
                                    ...styles.tickerCard,
                                    width: cardWidth,
                                }}
                            >
                                <div style={styles.imageFrame}>
                                    <div
                                        style={{
                                            ...styles.imageClip,
                                            height: cardHeight,
                                            borderRadius,
                                        }}
                                    >
                                        <img
                                            src={getItemSrc(item)}
                                            alt={getItemAlt(item, "")}
                                            draggable={false}
                                            style={styles.img}
                                        />
                                        {renderOverlay(
                                            item,
                                            false,
                                            hoveredTickerCard === i
                                        )}
                                    </div>
                                    {cornerBrackets && renderBrackets()}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    images.map((item, i) => {
                        const {
                            x,
                            scale,
                            tz,
                            rotateY,
                            opacity,
                            blur,
                            zIndex,
                            isActive,
                        } = getCardStyle(i)

                        return (
                            <motion.div
                                key={i}
                                onClick={() => !isDragging && goTo(i)}
                                animate={{
                                    x,
                                    scale,
                                    opacity,
                                    rotateY,
                                    z: tz,
                                    filter:
                                        blur > 0
                                            ? `blur(${blur.toFixed(1)}px)`
                                            : "none",
                                }}
                                transition={
                                    isDragging
                                        ? { duration: 0 }
                                        : springTransition
                                }
                                style={{
                                    ...styles.card,
                                    width: cardWidth,
                                    zIndex,
                                    cursor: isActive ? "default" : "pointer",
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div style={styles.imageFrame}>
                                    <div
                                        style={{
                                            ...styles.imageClip,
                                            height: cardHeight,
                                            borderRadius,
                                        }}
                                    >
                                        <img
                                            src={getItemSrc(item)}
                                            alt={getItemAlt(
                                                item,
                                                `Slide ${i + 1}`
                                            )}
                                            draggable={false}
                                            style={styles.img}
                                        />
                                        {renderOverlay(item, isActive)}

                                        {/* Active ring */}
                                        {isActive &&
                                            showActiveRing &&
                                            activeRingWidth > 0 && (
                                                <motion.div
                                                    layoutId="activeRing"
                                                    style={{
                                                        ...styles.ring,
                                                        borderWidth:
                                                            activeRingWidth,
                                                        borderColor:
                                                            accentColor,
                                                        borderRadius,
                                                    }}
                                                />
                                            )}
                                    </div>
                                    {cornerBrackets && renderBrackets()}
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* ── Dot indicators — accessible <button> elements ── */}
            {showDots && !tickerMode && (
                <div
                    role="tablist"
                    aria-label="Carousel navigation"
                    style={styles.dots}
                >
                    {images.map((item, i) => {
                        const label =
                            getItemTitle(item) ||
                            getItemAlt(item, "") ||
                            `Slide ${i + 1}`
                        return (
                            <motion.button
                                key={i}
                                role="tab"
                                aria-selected={i === current}
                                aria-label={`Go to ${label}`}
                                onClick={() => goTo(i)}
                                animate={{
                                    width: i === current ? 20 : 6,
                                    backgroundColor:
                                        i === current ? accentColor : "#888",
                                    opacity: i === current ? 1 : 0.4,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                }}
                                style={styles.dot}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    root: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        gap: 20,
    },
    viewport: {
        width: "100%",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspectiveOrigin: "50% 50%",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
    },
    card: {
        position: "absolute",
        overflow: "visible",
        willChange: "transform, opacity",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
    },
    tickerTrack: {
        display: "flex",
        alignItems: "center",
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        willChange: "transform",
    },
    tickerCard: {
        position: "relative",
        overflow: "visible",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
    },
    imageFrame: {
        position: "relative",
        width: "100%",
        height: "auto",
        minHeight: 0,
        overflow: "visible",
    },
    imageClip: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
    },
    bracket: {
        position: "absolute",
        pointerEvents: "none",
        boxSizing: "border-box",
    },
    img: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
    },
    overlay: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "12px 12px 10px",
        background:
            "linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0) 100%)",
        pointerEvents: "none",
    },
    tag: {
        display: "block",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.72)",
        marginBottom: 0,
        fontFamily: "sans-serif",
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: "#FFFFFF",
        margin: 0,
        lineHeight: 1.3,
        fontFamily: "sans-serif",
    },
    cardSub: {
        fontSize: 11,
        color: "rgba(255,255,255,0.78)",
        margin: "3px 0 0",
        fontFamily: "sans-serif",
    },
    ring: {
        position: "absolute",
        inset: 0,
        border: "2px solid",
        pointerEvents: "none",
    },
    dots: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        paddingBottom: 8,
    },
    dot: {
        height: 6,
        borderRadius: 3,
        cursor: "pointer",
        flexShrink: 0,
        border: "none",
        padding: 0,
        outline: "none",
        background: "transparent",
    },
}

// ─── Property Controls ─────────────────────────────────────────────────────

addPropertyControls(SnapCarousel3D, {
    images: {
        title: "Images",
        type: ControlType.Array,
        control: {
            type: ControlType.Object,
            controls: {
                src: { title: "Image", type: ControlType.Image },
                tag: {
                    title: "Tag",
                    type: ControlType.String,
                    defaultValue: "Category",
                },
                title: {
                    title: "Title",
                    type: ControlType.String,
                    defaultValue: "Card Title",
                },
                subtitle: {
                    title: "Subtitle",
                    type: ControlType.String,
                    defaultValue: "Details here",
                },
            },
        },
        defaultValue: [
            {
                tag: "Landscape",
                title: "Alpine Heights",
                subtitle: "Switzerland",
            },
            { tag: "Nature", title: "Emerald Valley", subtitle: "New Zealand" },
            { tag: "Architecture", title: "Urban Light", subtitle: "Tokyo" },
            { tag: "Landscape", title: "Golden Hour", subtitle: "Iceland" },
            { tag: "Forest", title: "Misty Woods", subtitle: "Oregon" },
        ],
    },
    cardWidth: {
        title: "Card Width",
        type: ControlType.Number,
        defaultValue: 240,
        min: 120,
        max: 500,
        step: 4,
        unit: "px",
    },
    cardHeight: {
        title: "Card Height",
        type: ControlType.Number,
        defaultValue: 320,
        min: 120,
        max: 700,
        step: 4,
        unit: "px",
    },
    cardGap: {
        title: "Card Gap",
        type: ControlType.Number,
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    borderRadius: {
        title: "Corner Radius",
        type: ControlType.Number,
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
    },
    depthIntensity: {
        title: "Depth",
        type: ControlType.Number,
        defaultValue: 3,
        min: 0,
        max: 10,
        step: 0.5,
    },
    blurStrength: {
        title: "Blur",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
    },
    accentColor: {
        title: "Accent",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    showActiveRing: {
        title: "Active Ring",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    activeRingWidth: {
        title: "Ring Width",
        type: ControlType.Number,
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
        unit: "px",
        hidden: (props) => !props.showActiveRing,
    },
    interactionSpeed: {
        title: "Interaction Speed",
        type: ControlType.Number,
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
        hidden: (props) => props.tickerMode,
    },
    cardStyle: {
        title: "Card Style",
        type: ControlType.Enum,
        options: ["Curved", "Straight"],
        optionTitles: ["Curved", "Straight"],
        defaultValue: "Curved",
        displaySegmentedControl: true,
        hidden: (props) => props.tickerMode,
    },
    showDots: {
        title: "Show Dots",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    showLabels: {
        title: "Show Labels",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    labelFont: {
        title: "Label Font",
        type: ControlType.Font,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    autoPlay: {
        title: "Auto Play",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    autoPlayInterval: {
        title: "Interval (ms)",
        type: ControlType.Number,
        defaultValue: 3000,
        min: 500,
        max: 10000,
        step: 500,
        hidden: (props) => !props.autoPlay,
    },
    tickerMode: {
        title: "Ticker Mode",
        type: ControlType.Boolean,
        defaultValue: false,
    },
    tickerSpeed: {
        title: "Ticker Speed",
        type: ControlType.Number,
        defaultValue: 40,
        min: 5,
        max: 200,
        step: 1,
        hidden: (props) => !props.tickerMode,
    },
    cornerBrackets: {
        title: "Corner Brackets",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    bracketGap: {
        title: "Bracket Gap",
        type: ControlType.Number,
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props) => !props.cornerBrackets,
    },
    bracketThickness: {
        title: "Bracket Thickness",
        type: ControlType.Number,
        defaultValue: 2,
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
        hidden: (props) => !props.cornerBrackets,
    },
    bracketColor: {
        title: "Bracket Color",
        type: ControlType.Color,
        defaultValue: "#111111",
        hidden: (props) => !props.cornerBrackets,
    },
    bracketSize: {
        title: "Bracket Size",
        type: ControlType.Number,
        defaultValue: 20,
        min: 8,
        max: 40,
        step: 1,
        unit: "px",
        hidden: (props) => !props.cornerBrackets,
    },
})
