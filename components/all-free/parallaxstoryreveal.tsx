import { useRef, useState, useEffect, useMemo, type CSSProperties } from "react"
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
    useScroll,
    useTransform,
    useSpring,
    useReducedMotion,
    useMotionValue,
    type MotionValue,
} from "framer-motion"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageCardData {
    image?: { src?: string; srcSet?: string; alt?: string }
    altText?: string
    objectPosition?: string
    desktopWidth?: number
    tabletWidth?: number
    mobileWidth?: number
    aspectRatio?: number
    desktopX?: number
    tabletX?: number
    mobileX?: number
    sectionY?: number
    parallaxStrength?: number
    xDrift?: number
    scrollStart?: number
    scrollEnd?: number
    scaleStart?: number
    scaleEnd?: number
    rotationStart?: number
    rotationEnd?: number
    zIndex?: number
    hideOnMobile?: boolean
}

type Breakpoint = "desktop" | "tablet" | "mobile"

interface EditorialParallaxStoryProps {
    introText: string
    historicalText: string
    dateText: string
    businessText: string
    amenitiesText: string
    closingText: string
    backgroundColor: string
    textColor: string
    revealDim: string
    enableReveal: boolean
    ctaBackgroundColor: string
    ctaTextColor: string
    font: any
    desktopFontSize: string
    tabletFontSize: string
    mobileFontSize: string
    lineHeight: number
    letterSpacing: string
    fontWeight: number
    desktopSectionHeight: number
    tabletSectionHeight: number
    mobileSectionHeight: number
    horizontalPadding: number
    topTransitionMode: "none" | "hard" | "overlap" | "slideUnder"
    images: ImageCardData[]
    motionSmoothing: number
    reducedMotionMode: "auto" | "on" | "off"
    globalParallaxMultiplier: number
    showCTA: boolean
    ctaText: string
    ctaLink?: string
    ctaHeightDesktop: number
    ctaHeightMobile: number
    ctaHorizontalMovement: number
    style?: CSSProperties
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp01(n: number): number {
    if (typeof n !== "number" || Number.isNaN(n)) return 0
    return Math.max(0, Math.min(1, n))
}

const FALLBACK_IMG =
    "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg"

// ---------------------------------------------------------------------------
// Floating image card — owns its own scroll-driven transforms
// ---------------------------------------------------------------------------

interface ImageCardProps {
    data: ImageCardData
    progress: MotionValue<number>
    bp: Breakpoint
    viewportWidth: number
    globalParallaxMultiplier: number
    reduce: boolean
}

interface RevealParagraphProps {
    text: string
    style: CSSProperties
    textColor: string
    revealDim: string
    enableReveal: boolean
    reduce: boolean
    isStatic: boolean
}

function ImageCard(props: ImageCardProps) {
    const { data, progress, bp, viewportWidth, globalParallaxMultiplier, reduce } =
        props

    const start = clamp01(data.scrollStart ?? 0)
    const end = Math.max(start + 0.04, clamp01(data.scrollEnd ?? 1))
    const fade = Math.min(0.06, ((end - start) / 2) * 0.7)

    const yTravel =
        (reduce ? 0 : data.parallaxStrength ?? 140) *
        (globalParallaxMultiplier || 1)
    // Horizontal drift in px, softened on mobile so nothing clips off-canvas.
    const driftBase = reduce ? 0 : data.xDrift ?? 0
    const drift = bp === "mobile" ? driftBase * 0.35 : driftBase

    const opacity = useTransform(
        progress,
        [start, start + fade, end - fade, end],
        [0, 1, 1, 0]
    )
    const y = useTransform(progress, [start, end], [yTravel, -yTravel])
    const x = useTransform(progress, [start, end], [0, drift])
    const scale = useTransform(
        progress,
        [start, end],
        [reduce ? 1 : data.scaleStart ?? 0.97, reduce ? 1 : data.scaleEnd ?? 1.02]
    )
    const rotate = useTransform(
        progress,
        [start, end],
        [reduce ? 0 : data.rotationStart ?? 0, reduce ? 0 : data.rotationEnd ?? 0]
    )

    if (bp === "mobile" && data.hideOnMobile) return null

    const widthVw =
        bp === "mobile"
            ? data.mobileWidth ?? 28
            : bp === "tablet"
              ? data.tabletWidth ?? 18
              : data.desktopWidth ?? 14
    const leftPct =
        bp === "mobile"
            ? data.mobileX ?? 40
            : bp === "tablet"
              ? data.tabletX ?? 50
              : data.desktopX ?? 50

    const src = data.image?.src || FALLBACK_IMG
    const ratio = data.aspectRatio && data.aspectRatio > 0 ? data.aspectRatio : 0.75

    return (
        <motion.div
            aria-hidden={data.altText ? undefined : true}
            style={{
                position: "absolute",
                top: `${data.sectionY ?? 30}%`,
                left: `${leftPct}%`,
                width: `${widthVw}vw`,
                maxWidth: "88vw",
                aspectRatio: String(ratio),
                zIndex: data.zIndex ?? 5,
                opacity,
                x,
                y,
                scale,
                rotate,
                pointerEvents: "none",
                transformOrigin: "center center",
                willChange: "transform, opacity",
            }}
        >
            <img
                src={src}
                srcSet={data.image?.srcSet}
                alt={data.altText || ""}
                draggable={false}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: data.objectPosition || "center",
                    userSelect: "none",
                }}
            />
        </motion.div>
    )
}

function RevealWord({
    word,
    index,
    total,
    progress,
    revealDim,
    textColor,
}: {
    word: string
    index: number
    total: number
    progress: MotionValue<number>
    revealDim: string
    textColor: string
}) {
    const start = index / total
    const end = Math.min(1, start + 1 / total)
    const color = useTransform(progress, [start, end], [revealDim, textColor])
    return <motion.span style={{ color }}>{word}</motion.span>
}

function RevealParagraph(props: RevealParagraphProps) {
    const { text, style, textColor, revealDim, enableReveal, reduce, isStatic } = props
    const paragraphRef = useRef<HTMLParagraphElement>(null)
    const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text])
    const { scrollYProgress } = useScroll({
        target: paragraphRef,
        offset: ["start 0.8", "end 0.4"],
    })
    const shouldReveal = enableReveal && !reduce && !isStatic
    const total = Math.max(words.length, 1)

    return (
        <p ref={paragraphRef} style={style}>
            {words.map((word, index) => {
                if (!shouldReveal) {
                    return (
                        <span key={`${word}-${index}`} style={{ color: textColor }}>
                            {word}
                            {index < words.length - 1 ? " " : ""}
                        </span>
                    )
                }
                return (
                    <span key={`${word}-${index}`}>
                        <RevealWord
                            word={word}
                            index={index}
                            total={total}
                            progress={scrollYProgress}
                            revealDim={revealDim}
                            textColor={textColor}
                        />
                        {index < words.length - 1 ? " " : ""}
                    </span>
                )
            })}
        </p>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Editorial Parallax Story
 *
 * A long, scroll-driven editorial section: intense red field, oversized
 * near-black typography, and floating image crops that parallax over the text
 * at individual speeds, resolving into a dark oversized CTA.
 *
 * @framerIntrinsicWidth 1280
 * @framerIntrinsicHeight 4000
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function EditorialParallaxStory(
    props: EditorialParallaxStoryProps
) {
    const {
        introText,
        historicalText,
        dateText,
        businessText,
        amenitiesText,
        closingText,
        backgroundColor,
        textColor,
        revealDim,
        enableReveal,
        ctaBackgroundColor,
        ctaTextColor,
        font,
        desktopFontSize,
        tabletFontSize,
        mobileFontSize,
        lineHeight,
        letterSpacing,
        fontWeight,
        desktopSectionHeight,
        tabletSectionHeight,
        mobileSectionHeight,
        horizontalPadding,
        topTransitionMode,
        images,
        motionSmoothing,
        reducedMotionMode,
        globalParallaxMultiplier,
        showCTA,
        ctaText,
        ctaLink,
        ctaHeightDesktop,
        ctaHeightMobile,
        ctaHorizontalMovement,
    } = props

    const sectionRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    // --- Breakpoint detection -------------------------------------------------
    const [vw, setVw] = useState<number>(1280)
    useEffect(() => {
        if (typeof window === "undefined") return
        const onResize = () => setVw(window.innerWidth)
        onResize()
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])
    const bp: Breakpoint = vw < 768 ? "mobile" : vw < 1200 ? "tablet" : "desktop"

    // --- Reduced motion -------------------------------------------------------
    const prefersReduced = useReducedMotion()
    const reduce =
        reducedMotionMode === "on" ||
        (reducedMotionMode === "auto" && !!prefersReduced)

    // --- Scroll progress ------------------------------------------------------
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"],
    })
    const smoothing = clamp01(motionSmoothing)
    const smooth = useSpring(scrollYProgress, {
        stiffness: 380 - smoothing * 300,
        damping: 90 - smoothing * 45,
        mass: 1,
        restDelta: 0.0005,
    })
    const staticProgress = useMotionValue(0.42)
    const progress = isStatic ? staticProgress : smooth

    // --- CTA horizontal drift -------------------------------------------------
    const ctaDriftPx = reduce ? 0 : (ctaHorizontalMovement / 100) * vw
    const ctaX = useTransform(progress, [0.75, 1], [ctaDriftPx, -ctaDriftPx])

    // --- Typography -----------------------------------------------------------
    const fontSize =
        bp === "mobile"
            ? mobileFontSize
            : bp === "tablet"
              ? tabletFontSize
              : desktopFontSize
    const fontFamily = font?.fontFamily
    const baseTextStyle: CSSProperties = {
        margin: 0,
        color: textColor,
        fontFamily,
        fontSize,
        lineHeight,
        letterSpacing,
        fontWeight,
    }

    // Breakpoint-aware indents (kept internal to keep the panel tidy).
    const businessIndent =
        bp === "mobile" ? "4vw" : bp === "tablet" ? "8vw" : "16vw"
    const closingIndent =
        bp === "mobile" ? "6vw" : bp === "tablet" ? "14vw" : "28vw"
    const introOffset = bp === "desktop" ? "3vw" : "0vw"
    const closingMaxWidth = bp === "mobile" ? "90vw" : "68vw"

    const pad = `${horizontalPadding}px`

    // --- Heights --------------------------------------------------------------
    const sectionH =
        bp === "mobile"
            ? mobileSectionHeight
            : bp === "tablet"
              ? tabletSectionHeight
              : desktopSectionHeight
    const ctaH = bp === "mobile" ? ctaHeightMobile : ctaHeightDesktop

    const overlapTop =
        topTransitionMode === "overlap" || topTransitionMode === "slideUnder"
            ? "-7vh"
            : "0px"

    const list = Array.isArray(images) ? images : []

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                overflowX: "clip",
                background: ctaBackgroundColor,
                marginTop: overlapTop,
            }}
        >
            {/* ---------------------------------------------------------------- */}
            {/* RED EDITORIAL SECTION                                            */}
            {/* ---------------------------------------------------------------- */}
            <section
                ref={sectionRef}
                aria-label="Editorial Section"
                style={{
                    position: "relative",
                    width: "100%",
                    minHeight: `${sectionH}vh`,
                    background: backgroundColor,
                    overflow: "clip",
                    boxSizing: "border-box",
                }}
            >
                {/* Text Composition */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        paddingLeft: pad,
                        paddingRight: pad,
                        paddingTop: "clamp(80px, 16vh, 260px)",
                        paddingBottom: "clamp(120px, 26vh, 420px)",
                        gap: "clamp(56px, 10vh, 180px)",
                    }}
                >
                    {/* Intro Text */}
                    <RevealParagraph
                        text={introText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "center",
                            textAlign: "center",
                            maxWidth: "84vw",
                            transform: `translateX(${introOffset})`,
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />

                    {/* Historical Text */}
                    <RevealParagraph
                        text={historicalText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "flex-start",
                            textAlign: "left",
                            maxWidth: "96vw",
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />

                    {/* Date Line */}
                    <RevealParagraph
                        text={dateText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "flex-start",
                            textAlign: "left",
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />

                    {/* Business Text */}
                    <RevealParagraph
                        text={businessText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "flex-start",
                            textAlign: "left",
                            marginLeft: businessIndent,
                            maxWidth: "80vw",
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />

                    {/* Amenities Text */}
                    <RevealParagraph
                        text={amenitiesText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "flex-start",
                            textAlign: "left",
                            marginLeft: bp === "mobile" ? "0vw" : "2vw",
                            maxWidth: "92vw",
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />

                    {/* Closing Text */}
                    <RevealParagraph
                        text={closingText}
                        style={{
                            ...baseTextStyle,
                            alignSelf: "flex-start",
                            textAlign: "left",
                            marginLeft: closingIndent,
                            maxWidth: closingMaxWidth,
                        }}
                        textColor={textColor}
                        revealDim={revealDim}
                        enableReveal={enableReveal}
                        reduce={reduce}
                        isStatic={isStatic}
                    />
                </div>

                {/* Floating Images */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 4,
                        pointerEvents: "none",
                    }}
                >
                    {list.map((card, i) => (
                        <ImageCard
                            key={i}
                            data={card}
                            progress={progress}
                            bp={bp}
                            viewportWidth={vw}
                            globalParallaxMultiplier={globalParallaxMultiplier}
                            reduce={reduce}
                        />
                    ))}
                </div>
            </section>

            {/* ---------------------------------------------------------------- */}
            {/* CTA TRANSITION                                                   */}
            {/* ---------------------------------------------------------------- */}
            {showCTA && (
                <a
                    href={ctaLink || "#"}
                    aria-label={ctaText}
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: `${ctaH}vh`,
                        background: ctaBackgroundColor,
                        overflow: "clip",
                        textDecoration: "none",
                        boxSizing: "border-box",
                    }}
                >
                    <motion.span
                        style={{
                            x: ctaX,
                            display: "block",
                            whiteSpace: "nowrap",
                            color: ctaTextColor,
                            fontFamily,
                            fontWeight: 600,
                            letterSpacing: "-0.03em",
                            lineHeight: 0.82,
                            fontSize:
                                bp === "mobile"
                                    ? "clamp(70px, 22vw, 150px)"
                                    : "clamp(110px, 16vw, 280px)",
                            willChange: "transform",
                        }}
                    >
                        {ctaText}
                    </motion.span>
                </a>
            )}
        </div>
    )
}

EditorialParallaxStory.displayName = "Editorial Parallax Story"

// ---------------------------------------------------------------------------
// Default floating-image composition (matches the reference beats)
// ---------------------------------------------------------------------------

const DEFAULT_IMAGES: ImageCardData[] = [
    {
        // 01 — facade crop, appears early, drifts slowly
        image: {
            src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=700&q=80&auto=format&fit=crop",
            alt: "Building facade detail",
        },
        altText: "Building facade detail",
        objectPosition: "center",
        desktopWidth: 15,
        tabletWidth: 20,
        mobileWidth: 32,
        aspectRatio: 0.66,
        desktopX: 50,
        tabletX: 48,
        mobileX: 40,
        sectionY: 15,
        parallaxStrength: 170,
        xDrift: 0,
        scrollStart: 0.1,
        scrollEnd: 0.38,
        scaleStart: 0.97,
        scaleEnd: 1.0,
        rotationStart: 0,
        rotationEnd: 0,
        zIndex: 5,
        hideOnMobile: false,
    },
    {
        // 02 — interior / chair, later, diagonal drift, far right
        image: {
            src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=700&q=80&auto=format&fit=crop",
            alt: "Interior workspace",
        },
        altText: "Interior workspace",
        objectPosition: "center",
        desktopWidth: 11,
        tabletWidth: 16,
        mobileWidth: 27,
        aspectRatio: 1.0,
        desktopX: 80,
        tabletX: 74,
        mobileX: 62,
        sectionY: 36,
        parallaxStrength: 160,
        xDrift: -50,
        scrollStart: 0.27,
        scrollEnd: 0.55,
        scaleStart: 0.98,
        scaleEnd: 1.02,
        rotationStart: 0,
        rotationEnd: 0,
        zIndex: 7,
        hideOnMobile: false,
    },
    {
        // 03 — architecture detail, mid, faint rotation
        image: {
            src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=700&q=80&auto=format&fit=crop",
            alt: "Architecture detail",
        },
        altText: "Architecture detail",
        objectPosition: "center",
        desktopWidth: 12,
        tabletWidth: 17,
        mobileWidth: 29,
        aspectRatio: 0.7,
        desktopX: 32,
        tabletX: 30,
        mobileX: 12,
        sectionY: 50,
        parallaxStrength: 210,
        xDrift: 24,
        scrollStart: 0.4,
        scrollEnd: 0.69,
        scaleStart: 0.98,
        scaleEnd: 1.01,
        rotationStart: -3,
        rotationEnd: 2,
        zIndex: 6,
        hideOnMobile: false,
    },
    {
        // 04 — copper object, lingers into the CTA
        image: {
            src: "https://images.unsplash.com/photo-1470723710355-95304d8aece4?w=700&q=80&auto=format&fit=crop",
            alt: "Copper object",
        },
        altText: "Copper object",
        objectPosition: "center",
        desktopWidth: 11,
        tabletWidth: 16,
        mobileWidth: 28,
        aspectRatio: 0.9,
        desktopX: 55,
        tabletX: 54,
        mobileX: 48,
        sectionY: 73,
        parallaxStrength: 120,
        xDrift: -20,
        scrollStart: 0.61,
        scrollEnd: 0.91,
        scaleStart: 0.96,
        scaleEnd: 1.03,
        rotationStart: 0,
        rotationEnd: 0,
        zIndex: 8,
        hideOnMobile: true,
    },
]

// ---------------------------------------------------------------------------
// Property controls
// ---------------------------------------------------------------------------

addPropertyControls(EditorialParallaxStory, {
    // ---- CONTENT ----
    introText: {
        type: ControlType.String,
        title: "Intro",
        defaultValue: "This is THE RED. Built to be bold.",
        displayTextArea: true,
    },
    historicalText: {
        type: ControlType.String,
        title: "Historical",
        defaultValue:
            "A historic landmark of character and color that has defined Chicago's skyline since",
        displayTextArea: true,
    },
    dateText: {
        type: ControlType.String,
        title: "Date",
        defaultValue: "1972.",
    },
    businessText: {
        type: ControlType.String,
        title: "Business",
        defaultValue:
            "Today, it meets the needs of modern business, offering over a million square feet of workspace across 44 floors,",
        displayTextArea: true,
    },
    amenitiesText: {
        type: ControlType.String,
        title: "Amenities",
        defaultValue:
            "complemented by outstanding amenities, including a fitness and wellness center, auditorium and conference spaces, childcare services, and East Loop's most comprehensive dining experience: Hayden Hall.",
        displayTextArea: true,
    },
    closingText: {
        type: ControlType.String,
        title: "Closing",
        defaultValue:
            "Discover why today's trailblazers work, play and pioneer in a building like no other in one of the most distinctive districts in Chicago.",
        displayTextArea: true,
    },

    // ---- COLORS ----
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#C6282E",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#240008",
    },
    revealDim: {
        type: ControlType.Color,
        title: "Reveal Dim",
        defaultValue: "rgba(36, 0, 8, 0.18)",
    },
    enableReveal: {
        type: ControlType.Boolean,
        title: "Enable Reveal",
        defaultValue: true,
    },
    ctaBackgroundColor: {
        type: ControlType.Color,
        title: "CTA Back",
        defaultValue: "#240008",
    },
    ctaTextColor: {
        type: ControlType.Color,
        title: "CTA Text",
        defaultValue: "#D62E35",
    },

    // ---- TYPOGRAPHY ----
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: false,
        defaultValue: {
            variant: "Medium",
            letterSpacing: "-0.035em",
            lineHeight: "0.95em",
        },
    },
    desktopFontSize: {
        type: ControlType.String,
        title: "Size ≥1200",
        defaultValue: "clamp(62px, 5.3vw, 102px)",
    },
    tabletFontSize: {
        type: ControlType.String,
        title: "Size 768+",
        defaultValue: "clamp(48px, 7vw, 76px)",
    },
    mobileFontSize: {
        type: ControlType.String,
        title: "Size <768",
        defaultValue: "clamp(39px, 11.5vw, 64px)",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 0.95,
        min: 0.8,
        max: 1.3,
        step: 0.01,
    },
    letterSpacing: {
        type: ControlType.String,
        title: "Tracking",
        defaultValue: "-0.035em",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
    },

    // ---- SECTION ----
    desktopSectionHeight: {
        type: ControlType.Number,
        title: "H ≥1200",
        defaultValue: 320,
        min: 150,
        max: 500,
        step: 10,
        unit: "vh",
    },
    tabletSectionHeight: {
        type: ControlType.Number,
        title: "H 768+",
        defaultValue: 280,
        min: 150,
        max: 500,
        step: 10,
        unit: "vh",
    },
    mobileSectionHeight: {
        type: ControlType.Number,
        title: "H <768",
        defaultValue: 260,
        min: 150,
        max: 500,
        step: 10,
        unit: "vh",
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Side Pad",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    topTransitionMode: {
        type: ControlType.Enum,
        title: "Top Transition",
        defaultValue: "hard",
        options: ["none", "hard", "overlap", "slideUnder"],
        optionTitles: ["None", "Hard Cut", "Overlap", "Slide Under"],
    },

    // ---- IMAGES ----
    images: {
        type: ControlType.Array,
        title: "Floating Images",
        maxCount: 8,
        defaultValue: DEFAULT_IMAGES as any,
        control: {
            type: ControlType.Object,
            buttonTitle: "Image Card",
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                altText: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
                objectPosition: {
                    type: ControlType.String,
                    title: "Focus",
                    defaultValue: "center",
                },
                desktopWidth: {
                    type: ControlType.Number,
                    title: "W ≥1200",
                    defaultValue: 13,
                    min: 5,
                    max: 40,
                    step: 0.5,
                    unit: "vw",
                },
                tabletWidth: {
                    type: ControlType.Number,
                    title: "W 768+",
                    defaultValue: 18,
                    min: 8,
                    max: 45,
                    step: 0.5,
                    unit: "vw",
                },
                mobileWidth: {
                    type: ControlType.Number,
                    title: "W <768",
                    defaultValue: 28,
                    min: 12,
                    max: 60,
                    step: 0.5,
                    unit: "vw",
                },
                aspectRatio: {
                    type: ControlType.Number,
                    title: "Ratio W/H",
                    defaultValue: 0.75,
                    min: 0.4,
                    max: 2,
                    step: 0.01,
                },
                desktopX: {
                    type: ControlType.Number,
                    title: "X ≥1200",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                tabletX: {
                    type: ControlType.Number,
                    title: "X 768+",
                    defaultValue: 50,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                mobileX: {
                    type: ControlType.Number,
                    title: "X <768",
                    defaultValue: 40,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                sectionY: {
                    type: ControlType.Number,
                    title: "Y in Section",
                    defaultValue: 30,
                    min: 0,
                    max: 100,
                    step: 1,
                    unit: "%",
                },
                parallaxStrength: {
                    type: ControlType.Number,
                    title: "Parallax Y",
                    defaultValue: 150,
                    min: 0,
                    max: 400,
                    step: 5,
                    unit: "px",
                },
                xDrift: {
                    type: ControlType.Number,
                    title: "Drift X",
                    defaultValue: 0,
                    min: -160,
                    max: 160,
                    step: 5,
                    unit: "px",
                },
                scrollStart: {
                    type: ControlType.Number,
                    title: "Scroll In",
                    defaultValue: 0.1,
                    min: 0,
                    max: 1,
                    step: 0.01,
                },
                scrollEnd: {
                    type: ControlType.Number,
                    title: "Scroll Out",
                    defaultValue: 0.4,
                    min: 0,
                    max: 1,
                    step: 0.01,
                },
                scaleStart: {
                    type: ControlType.Number,
                    title: "Scale In",
                    defaultValue: 0.97,
                    min: 0.5,
                    max: 1.5,
                    step: 0.01,
                },
                scaleEnd: {
                    type: ControlType.Number,
                    title: "Scale Out",
                    defaultValue: 1.02,
                    min: 0.5,
                    max: 1.5,
                    step: 0.01,
                },
                rotationStart: {
                    type: ControlType.Number,
                    title: "Rotate In",
                    defaultValue: 0,
                    min: -20,
                    max: 20,
                    step: 0.5,
                    unit: "deg",
                },
                rotationEnd: {
                    type: ControlType.Number,
                    title: "Rotate Out",
                    defaultValue: 0,
                    min: -20,
                    max: 20,
                    step: 0.5,
                    unit: "deg",
                },
                zIndex: {
                    type: ControlType.Number,
                    title: "Z-Index",
                    defaultValue: 5,
                    min: 4,
                    max: 9,
                    step: 1,
                },
                hideOnMobile: {
                    type: ControlType.Boolean,
                    title: "Hide <768",
                    defaultValue: false,
                },
            },
        },
    },

    // ---- MOTION ----
    motionSmoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },
    reducedMotionMode: {
        type: ControlType.Enum,
        title: "Reduced Motion",
        defaultValue: "auto",
        options: ["auto", "on", "off"],
        optionTitles: ["Auto", "Force On", "Force Off"],
    },
    globalParallaxMultiplier: {
        type: ControlType.Number,
        title: "Parallax x",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.05,
    },

    // ---- CTA ----
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA",
        defaultValue: true,
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "ENQUIRE ↗",
        hidden: (p: any) => !p.showCTA,
    },
    ctaLink: {
        type: ControlType.Link,
        title: "CTA Link",
        hidden: (p: any) => !p.showCTA,
    },
    ctaHeightDesktop: {
        type: ControlType.Number,
        title: "CTA H ≥768",
        defaultValue: 90,
        min: 40,
        max: 120,
        step: 5,
        unit: "vh",
        hidden: (p: any) => !p.showCTA,
    },
    ctaHeightMobile: {
        type: ControlType.Number,
        title: "CTA H <768",
        defaultValue: 65,
        min: 40,
        max: 120,
        step: 5,
        unit: "vh",
        hidden: (p: any) => !p.showCTA,
    },
    ctaHorizontalMovement: {
        type: ControlType.Number,
        title: "CTA Drift",
        defaultValue: 2.5,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "vw",
        hidden: (p: any) => !p.showCTA,
    },
})
