import {
    memo,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react"
import type { CSSProperties } from "react"
import { animate, motion, useMotionValue, useTransform } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface CarouselItem {
    title?: string
    description?: string
    image?: ResponsiveImageValue
    video?: string
}

type ArrowSide = "prev" | "next" | "none"

interface FeatureCarouselProps {
    items?: CarouselItem[]
    cardWidth: number
    cardHeight: number
    gap: number
    bleedLeft: number
    bleedRight: number
    cardRadius: number
    cardPadding: number
    cardBackground: string
    mediaRadius: number
    mediaBackground: string
    mediaPadding: number
    textWidth: number
    textGap: number
    stacked?: boolean
    titleFont: CSSProperties
    titleColor: string
    descFont: CSSProperties
    descColor: string
    showArrows: boolean
    arrowsGap: number
    arrowSpacing: number
    arrowBackground: string
    arrowBorderWidth: number
    arrowBorderColor: string
    arrowPadding: number
    iconSize: number
    iconFill: string
    iconColor: string
    activeIconColor: string
    startActive: ArrowSide
    transition: Record<string, unknown>
    style?: CSSProperties
}

const EMPTY: CarouselItem[] = []

// Traced from the project's own 24x24 arrow assets. Both icons are the same
// pixel squares with a dark fill; only the outline colour differs.
const PREV_FILL_D =
    "M13 5h-2v2h2zm6 0h-2v2h2zm-9 3H8v2h2zm6 0h-2v2h2zm-9 3H5v2h2zm6 0h-2v2h2zm-3 3H8v2h2zm6 0h-2v2h2zm-3 3h-2v2h2zm6 0h-2v2h2z"
const PREV_STROKE_D =
    "M11.5 17.5v1h1v-1zm6 0v1h1v-1zm-9-3v1h1v-1zm6 0v1h1v-1zm-9-3v1h1v-1zm6 0v1h1v-1zm-3-3v1h1v-1zm6 0v1h1v-1zm-3-3v1h1v-1zm6 0v1h1v-1z"
const NEXT_D =
    "M12.5 17.5v1h-1v-1zm-6 0v1h-1v-1zm9-3v1h-1v-1zm-6 0v1h-1v-1zm9-3v1h-1v-1zm-6 0v1h-1v-1zm3-3v1h-1v-1zm-6 0v1h-1v-1zm3-3v1h-1v-1zm-6 0v1h-1v-1z"

// Three copies of the list: one on screen, one spare each side.
const COPIES = 3
const HOME_COPY = 1

// How far either side of the viewport a card's video keeps playing.
const VIDEO_BEHIND = 1
const VIDEO_AHEAD = 3

const hideWithoutArrows = (p: Partial<FeatureCarouselProps>) => !p.showArrows
const hideWithoutArrowBorder = (p: Partial<FeatureCarouselProps>) =>
    !p.showArrows || !p.arrowBorderWidth

function ArrowIcon({
    direction,
    size,
    fill,
    stroke,
}: {
    direction: "prev" | "next"
    size: number
    fill: string
    stroke: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ display: "block", pointerEvents: "none" }}
        >
            {direction === "prev" ? (
                <g>
                    <path d={PREV_FILL_D} fill={fill} />
                    <path d={PREV_STROKE_D} stroke={stroke} fill="none" />
                </g>
            ) : (
                <path d={NEXT_D} fill={fill} stroke={stroke} />
            )}
        </svg>
    )
}

interface CardProps {
    title?: string
    description?: string
    imageSrc?: string
    imageSrcSet?: string
    imageAlt?: string
    videoSrc?: string
    playing: boolean
    inert: boolean
    cardWidth: number
    cardPadding: number
    cardRadius: number
    cardBackground: string
    mediaRadius: number
    mediaBackground: string
    mediaPadding: number
    textWidth: number
    textGap: number
    stacked?: boolean
    titleStyle: CSSProperties
    descStyle: CSSProperties
}

const Card = memo(function Card(props: CardProps) {
    const {
        title,
        description,
        imageSrc,
        imageSrcSet,
        imageAlt,
        videoSrc,
        playing,
        inert,
        cardWidth,
        cardPadding,
        cardRadius,
        cardBackground,
        mediaRadius,
        mediaBackground,
        mediaPadding,
        textWidth,
        textGap,
        stacked = false,
        titleStyle,
        descStyle,
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)

    // The element is never unmounted - only playback is gated.
    useEffect(() => {
        const el = videoRef.current
        if (!el) return
        if (playing) {
            const attempt = el.play()
            if (attempt && typeof attempt.catch === "function") {
                attempt.catch(() => {})
            }
        } else if (!el.paused) {
            el.pause()
        }
    }, [playing, videoSrc])

    return (
        <article
            aria-hidden={inert}
            style={{
                flex: "0 0 auto",
                width: cardWidth,
                height: "100%",
                boxSizing: "border-box",
                padding: cardPadding,
                borderRadius: cardRadius,
                background: cardBackground,
                overflow: "hidden",
                display: "flex",
                flexDirection: stacked ? "column" : "row",
                alignItems: "stretch",
                contain: "paint",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flex: "1 1 auto",
                    borderRadius: mediaRadius,
                    background: mediaBackground,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: mediaPadding,
                    boxSizing: "border-box",
                }}
            >
                {videoSrc ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        disablePictureInPicture
                        tabIndex={-1}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                        }}
                    />
                ) : null}
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        srcSet={imageSrcSet}
                        alt={imageAlt || ""}
                        decoding="async"
                        style={{
                            position: "relative",
                            zIndex: 2,
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                        }}
                    />
                ) : null}
            </div>
            <div
                style={{
                    flex: "0 0 auto",
                    width: stacked ? "100%" : textWidth + "%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    gap: textGap,
                    padding: stacked ? "20px 12px 12px" : "0 24px 0 32px",
                    boxSizing: "border-box",
                }}
            >
                <h3 style={titleStyle}>{title}</h3>
                <p style={descStyle}>{description}</p>
            </div>
        </article>
    )
})

/**
 * Infinite looping feature carousel.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1290
 * @framerIntrinsicHeight 471
 */
export default function FeatureCarousel(props: FeatureCarouselProps) {
    const {
        items = EMPTY,
        cardWidth,
        cardHeight,
        gap,
        bleedLeft,
        bleedRight,
        cardRadius,
        cardPadding,
        cardBackground,
        mediaRadius,
        mediaBackground,
        mediaPadding,
        textWidth,
        textGap,
        stacked = false,
        titleFont,
        titleColor,
        descFont,
        descColor,
        showArrows,
        arrowsGap,
        arrowSpacing,
        arrowBackground,
        arrowBorderWidth,
        arrowBorderColor,
        arrowPadding,
        iconSize,
        iconFill,
        iconColor,
        activeIconColor,
        startActive,
        transition,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const count = items.length
    const step = cardWidth + gap
    const BASE = count * HOME_COPY
    const restX = -BASE * step

    // Unique class, so the reset below cannot leak to anything else.
    const rawId = useId()
    const btnClass = "fcArrow" + rawId.replace(/[^a-zA-Z0-9]/g, "")

    const [page, setPage] = useState(0)
    const [instant, setInstant] = useState(false)
    const [active, setActive] = useState<ArrowSide>(startActive)
    const [inView, setInView] = useState(false)
    const pageRef = useRef(0)
    pageRef.current = page

    const sectionRef = useRef<HTMLElement>(null)

    // Framer can hand a fresh transition object on any render. Reading it
    // through a ref keeps it out of effect deps.
    const transitionRef = useRef(transition)
    transitionRef.current = transition

    // Starts AT the resting offset. Starting at 0 would read as a travel of
    // thousands of pixels on the first render.
    const x = useMotionValue(restX)
    const mountedRef = useRef(false)

    const startedRef = useRef(false)
    const openedRef = useRef(false)

    // The clip follows the strip's own travel, so its edge sits exactly on
    // the outgoing card's left edge - never ahead of it, so never cutting it.
    const closed = "inset(0px 0px 0px " + bleedLeft + "px)"
    const clipPath = useTransform(x, (value) => {
        if (isStatic || !startedRef.current) return closed
        if (openedRef.current) return "inset(0px 0px 0px 0px)"
        const travelled = Math.abs(value - restX)
        const left = Math.max(0, bleedLeft - travelled)
        if (left <= 0.5) openedRef.current = true
        return "inset(0px 0px 0px " + left + "px)"
    })

    // Nothing plays until the section is near the viewport.
    useEffect(() => {
        if (isStatic) return
        const el = sectionRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }
        const io = new IntersectionObserver(
            (entries) => setInView(entries[0].isIntersecting),
            { rootMargin: "200px 0px" }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (!instant) return
        const raf = requestAnimationFrame(() => setInstant(false))
        return () => cancelAnimationFrame(raf)
    }, [instant])

    useEffect(() => {
        setActive(startActive)
    }, [startActive])

    const normalize = useCallback(() => {
        if (count === 0) return
        const current = pageRef.current
        if (current >= 0 && current < count) return
        setInstant(true)
        setPage(((current % count) + count) % count)
    }, [count])

    const firstVisible = BASE + page
    const target = -firstVisible * step

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true
            x.set(target)
            return
        }
        if (instant || isStatic) {
            x.set(target)
            return
        }
        const controls = animate(x, target, {
            ...transitionRef.current,
            onComplete: normalize,
        })
        return () => controls.stop()
    }, [target, instant, isStatic, x, normalize])

    const paginate = useCallback(
        (direction: number, side: ArrowSide) => {
            setActive(side)
            if (count === 0) return
            startedRef.current = true
            setPage((current) => current + direction)
        },
        [count]
    )

    const handleNext = useCallback(() => paginate(1, "next"), [paginate])
    const handlePrev = useCallback(() => paginate(-1, "prev"), [paginate])

    const titleStyle = useMemo(
        () => ({ margin: 0, color: titleColor, ...titleFont }),
        [titleColor, titleFont]
    )
    const descStyle = useMemo(
        () => ({ margin: 0, color: descColor, ...descFont }),
        [descColor, descFont]
    )

    const strip = useMemo(() => {
        const out: Array<{
            key: string
            index: number
            copy: number
            item: CarouselItem
        }> = []
        for (let copy = 0; copy < COPIES; copy++) {
            for (let i = 0; i < count; i++) {
                out.push({
                    key: copy + "-" + i,
                    index: out.length,
                    copy,
                    item: items[i],
                })
            }
        }
        return out
    }, [items, count])

    if (count === 0) {
        return (
            <section
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: cardHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: cardRadius,
                    background: cardBackground,
                    color: descColor,
                    ...descFont,
                    ...style,
                }}
            >
                Add feature cards in the properties panel.
            </section>
        )
    }

    // Inline, so it always beats the reset stylesheet. border-box keeps the
    // button the same size whether or not it carries a border.
    const buttonStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: arrowPadding,
        borderRadius: 99,
        border:
            arrowBorderWidth > 0
                ? arrowBorderWidth + "px solid " + arrowBorderColor
                : "0",
        background: arrowBackground,
        cursor: "pointer",
        lineHeight: 0,
        touchAction: "manipulation",
    }

    return (
        <section
            ref={sectionRef}
            aria-roledescription="carousel"
            style={{
                position: "relative",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: arrowsGap,
                ...style,
            }}
        >
            {/* Clears what the browser draws on its own - Firefox's inner
                border and the focus ring left behind after a click. The
                element border itself is set inline from the controls, and
                the ring comes back on :focus-visible for keyboard users. */}
            <style>{`
.${btnClass}{appearance:none;-webkit-appearance:none;outline:0;margin:0;box-shadow:none;-webkit-tap-highlight-color:transparent}
.${btnClass}::-moz-focus-inner{border:0;padding:0}
.${btnClass}:focus{outline:0}
.${btnClass}:focus-visible{outline:2px solid ${activeIconColor};outline-offset:3px}
`}</style>

            <motion.div
                style={{
                    position: "relative",
                    width: "calc(100% + " + (bleedLeft + bleedRight) + "px)",
                    marginLeft: -bleedLeft,
                    height: cardHeight,
                    overflow: "hidden",
                    clipPath,
                    WebkitClipPath: clipPath,
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: bleedLeft,
                        height: "100%",
                        display: "flex",
                        gap: gap,
                        x,
                    }}
                >
                    {strip.map(({ key, index, copy, item }) => {
                        const offset = index - firstVisible
                        return (
                            <Card
                                key={key}
                                title={item?.title}
                                description={item?.description}
                                imageSrc={item?.image?.src}
                                imageSrcSet={item?.image?.srcSet}
                                imageAlt={item?.image?.alt}
                                videoSrc={item?.video}
                                playing={
                                    !isStatic &&
                                    inView &&
                                    offset >= -VIDEO_BEHIND &&
                                    offset <= VIDEO_AHEAD
                                }
                                inert={copy !== HOME_COPY}
                                cardWidth={cardWidth}
                                cardPadding={cardPadding}
                                cardRadius={cardRadius}
                                cardBackground={cardBackground}
                                mediaRadius={mediaRadius}
                                mediaBackground={mediaBackground}
                                mediaPadding={mediaPadding}
                                textWidth={textWidth}
                                textGap={textGap}
                                stacked={stacked}
                                titleStyle={titleStyle}
                                descStyle={descStyle}
                            />
                        )
                    })}
                </motion.div>
            </motion.div>

            {showArrows ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: arrowSpacing,
                        width: "100%",
                    }}
                >
                    <button
                        type="button"
                        className={btnClass}
                        aria-label="Previous feature"
                        aria-pressed={active === "prev"}
                        onClick={handlePrev}
                        style={buttonStyle}
                    >
                        <ArrowIcon
                            direction="prev"
                            size={iconSize}
                            fill={iconFill}
                            stroke={
                                active === "prev" ? activeIconColor : iconColor
                            }
                        />
                    </button>
                    <button
                        type="button"
                        className={btnClass}
                        aria-label="Next feature"
                        aria-pressed={active === "next"}
                        onClick={handleNext}
                        style={buttonStyle}
                    >
                        <ArrowIcon
                            direction="next"
                            size={iconSize}
                            fill={iconFill}
                            stroke={
                                active === "next" ? activeIconColor : iconColor
                            }
                        />
                    </button>
                </div>
            ) : null}
        </section>
    )
}

const defaultItems: CarouselItem[] = [
    {
        title: "Deep SEO analysis",
        description:
            "Identify critical gaps across technical SEO, content strategy, and backlinks—giving you a 360° view of your site's health and ranking potential.",
    },
    {
        title: "Technical site audit",
        description:
            "Crawl every page for broken links, redirect chains, and indexing issues, then get a prioritised fix list instead of a raw error dump.",
    },
    {
        title: "Keyword intelligence",
        description:
            "See which terms actually move revenue, with difficulty, intent, and traffic potential scored side by side.",
    },
    {
        title: "Backlink monitoring",
        description:
            "Track new and lost links in real time, and get alerted the moment a high-value referring domain drops you.",
    },
    {
        title: "Content optimization",
        description:
            "Compare your pages against the ones already ranking and get concrete edits to close the gap.",
    },
    {
        title: "Rank tracking",
        description:
            "Follow daily position changes by device and location, so you can tie every movement back to what you shipped.",
    },
]

addPropertyControls(FeatureCarousel, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Deep SEO analysis",
                },
                description: {
                    type: ControlType.String,
                    title: "Text",
                    displayTextArea: true,
                    defaultValue:
                        "Identify critical gaps across technical SEO, content strategy, and backlinks.",
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
            },
        },
        defaultValue: defaultItems,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 620,
        min: 120,
        max: 2000,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card H",
        defaultValue: 359,
        min: 120,
        max: 2000,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 10,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    bleedLeft: {
        type: ControlType.Number,
        title: "Bleed L",
        description:
            "Closed at rest. Opens as the cards move, tracking them exactly, and stays open.",
        defaultValue: 295,
        min: 0,
        max: 2000,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    bleedRight: {
        type: ControlType.Number,
        title: "Bleed R",
        description: "How far cards run off past the right edge.",
        defaultValue: 295,
        min: 0,
        max: 2000,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 32,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 8,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgb(255, 255, 255)",
    },
    mediaRadius: {
        type: ControlType.Number,
        title: "Media R",
        defaultValue: 24,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    mediaBackground: {
        type: ControlType.Color,
        title: "Media BG",
        defaultValue: "rgb(235, 233, 210)",
    },
    mediaPadding: {
        type: ControlType.Number,
        title: "Media P",
        defaultValue: 42,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    stacked: {
        type: ControlType.Boolean,
        title: "Stacked",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    textWidth: {
        type: ControlType.Number,
        title: "Text W",
        defaultValue: 47,
        min: 20,
        max: 80,
        step: 1,
        unit: "%",
        displayStepper: false,
    },
    textGap: {
        type: ControlType.Number,
        title: "Text Gap",
        defaultValue: 4,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        displayStepper: false,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Regular",
            lineHeight: "1.2em",
            letterSpacing: "0px",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "rgb(26, 26, 28)",
    },
    descFont: {
        type: ControlType.Font,
        title: "Text Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Regular",
            lineHeight: "150%",
            letterSpacing: "0px",
        },
    },
    descColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "rgba(26, 26, 28, 0.6)",
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    arrowsGap: {
        type: ControlType.Number,
        title: "Arrows Y",
        defaultValue: 72,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: hideWithoutArrows,
    },
    arrowSpacing: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: hideWithoutArrows,
    },
    arrowBackground: {
        type: ControlType.Color,
        title: "Arrow BG",
        defaultValue: "rgb(26, 26, 28)",
        hidden: hideWithoutArrows,
    },
    arrowBorderWidth: {
        type: ControlType.Number,
        title: "Arrow Border",
        description: "0 means no border. Above 0 reveals the colour control.",
        defaultValue: 0,
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
        displayStepper: true,
        hidden: hideWithoutArrows,
    },
    arrowBorderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.2)",
        hidden: hideWithoutArrowBorder,
    },
    arrowPadding: {
        type: ControlType.Number,
        title: "Arrow P",
        defaultValue: 8,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: hideWithoutArrows,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon",
        defaultValue: 24,
        min: 8,
        max: 80,
        step: 1,
        unit: "px",
        displayStepper: false,
        hidden: hideWithoutArrows,
    },
    iconFill: {
        type: ControlType.Color,
        title: "Icon Fill",
        defaultValue: "rgb(26, 26, 28)",
        hidden: hideWithoutArrows,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Icon Idle",
        defaultValue: "rgba(255, 255, 255, 0.5)",
        hidden: hideWithoutArrows,
    },
    activeIconColor: {
        type: ControlType.Color,
        title: "Icon Active",
        defaultValue: "rgb(255, 254, 84)",
        hidden: hideWithoutArrows,
    },
    startActive: {
        type: ControlType.Enum,
        title: "Active",
        options: ["next", "prev", "none"],
        optionTitles: ["Next", "Back", "None"],
        defaultValue: "next",
        displaySegmentedControl: true,
        hidden: hideWithoutArrows,
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "spring",
            stiffness: 300,
            damping: 38,
            mass: 0.8,
        },
    },
})
