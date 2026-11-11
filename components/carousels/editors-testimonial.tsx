import * as React from "react"
import {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useMemo,
    useCallback,
    memo,
} from "react"
import {
    motion,
    useMotionValue,
    animate,
    useReducedMotion,
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


// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const defaultTestimonials = [
    {
        quote: "Lumina didn't just find us a house; they curated an entirely new lifestyle. The level of discretion, architectural knowledge, and aesthetic understanding is completely unmatched in the industry.",
        name: "Jonathan & Claire Mercer",
        detail: "Purchased Villa Solstice",
    },
    {
        quote: "Their approach to off-market properties gave us access to estates we never knew existed. An absolutely seamless experience from the first consultation to the final closing.",
        name: "David Chen",
        detail: "Purchased The Glass Pavilion",
    },
    {
        quote: "As an architect, I am exceedingly particular. The Lumina team immediately understood my structural and aesthetic requirements and delivered a property that exceeded every expectation.",
        name: "Eleanor Vance",
        detail: "Purchased Brutalist Retreat",
    },
]

const cleanLinearSmooth = {
    type: "tween" as const,
    ease: [0.25, 1, 0.5, 1],
    duration: 0.5,
}

const INSTANT = { duration: 0 }

// Static styles — module-level, never recreated
const STATIC = {
    flowRoot: { width: "100%", display: "flow-root" as const },
    navRow: {
        marginTop: "48px",
        display: "flex",
        alignItems: "center",
        gap: "24px",
    },
    buttonGroup: { display: "flex", gap: "10px" },
    progressTrack: {
        flex: 1,
        height: "1px",
        position: "relative" as const,
    },
    progressFill: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        transformOrigin: "left",
        willChange: "transform",
    },
    progressStatic: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        height: "100%",
        width: "35%",
        opacity: 0.4,
    },
    counterFont: {
        fontSize: "12px",
        fontFamily: "monospace",
    } as React.CSSProperties,
    clipper: {
        overflow: "hidden" as const,
    },
}

// ─────────────────────────────────────────────
// SVG Arrows — outside component, never recreated
// ─────────────────────────────────────────────

const ArrowLeft = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
)

const ArrowRight = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
)

// ─────────────────────────────────────────────
// TestimonialContent
// ─────────────────────────────────────────────

interface TestimonialContentProps {
    activeIndex: number
    quote: string
    name: string
    detail: string
    label: string
    labelStyle: React.CSSProperties
    quoteStyle: React.CSSProperties
    authorStyle: React.CSSProperties
    detailStyle: React.CSSProperties
    disableAnimations: boolean
}

const TestimonialContent = memo(function TestimonialContent({
    activeIndex,
    quote,
    name,
    detail,
    label,
    labelStyle,
    quoteStyle,
    authorStyle,
    detailStyle,
    disableAnimations,
}: TestimonialContentProps) {
    const innerRef = useRef<HTMLDivElement>(null)
    const [contentHeight, setContentHeight] = useState<number | "auto">("auto")

    // No dep array — runs after EVERY render so we always have the real
    // height of whatever content just mounted. This is the key fix:
    // measuring after the new content is in the DOM (not before) means
    // the clipper always animates to the correct target height.
    useLayoutEffect(() => {
        const el = innerRef.current
        if (!el) return
        const h = el.offsetHeight
        if (h > 0) setContentHeight(h)
    })

    const transition = disableAnimations ? INSTANT : cleanLinearSmooth

    return (
        <div style={STATIC.flowRoot}>
            <span style={labelStyle}>{label}</span>

            {/*
              Clipper div: overflow:hidden, animates to the exact measured
              height. Inner div is in NORMAL FLOW (not absolute) — this is
              critical. Absolute positioning during AnimatePresence caused
              old+new content to stack, doubling the measured height and
              producing the extra gap. Normal flow means only the live
              content contributes to offsetHeight.

              No AnimatePresence here — crossfading two absolutely-positioned
              children while also animating the parent height was the source
              of the stacking bug. Instead we do a simple opacity fade on
              the single live content div, keyed to activeIndex so React
              re-mounts it and triggers the fade.
            */}
            <motion.div
                animate={{ height: contentHeight }}
                transition={transition}
                style={{ ...STATIC.clipper, height: contentHeight }}
            >
                <motion.div
                    ref={innerRef}
                    key={activeIndex}
                    initial={disableAnimations ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={transition}
                    aria-live="polite"
                >
                    <p style={quoteStyle}>"{quote}"</p>
                    <div>
                        <p style={authorStyle}>{name}</p>
                        <p style={detailStyle}>{detail}</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
})

// ─────────────────────────────────────────────
// NavigationButtons
// ─────────────────────────────────────────────

interface NavigationButtonsProps {
    onPrev: () => void
    onNext: () => void
    navButtonStyle: React.CSSProperties
    accentColor: string
    bgColor: string
    primaryTextColor: string
}

const NavigationButtons = memo(function NavigationButtons({
    onPrev,
    onNext,
    navButtonStyle,
    accentColor,
    bgColor,
    primaryTextColor,
}: NavigationButtonsProps) {
    // CSS transition instead of whileHover — GPU-handled, zero JS overhead.
    // Framer Motion's whileHover creates an animation controller on every
    // hover interaction; a CSS transition costs essentially nothing.
    const buttonStyle: React.CSSProperties = {
        ...navButtonStyle,
        transition: "background-color 0.2s ease, color 0.2s ease",
    }

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = accentColor
        e.currentTarget.style.color = bgColor
    }
    const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = "transparent"
        e.currentTarget.style.color = primaryTextColor
    }

    return (
        <div style={STATIC.buttonGroup}>
            <button
                onClick={onPrev}
                style={buttonStyle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                aria-label="Previous Testimonial"
            >
                <ArrowLeft />
            </button>
            <button
                onClick={onNext}
                style={buttonStyle}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                aria-label="Next Testimonial"
            >
                <ArrowRight />
            </button>
        </div>
    )
})

// ─────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────

interface ProgressBarProps {
    activeIndex: number
    autoplayDuration: number
    accentColor: string
    trackColor: string
    disableAnimations: boolean
    onComplete: () => void
}

const ProgressBar = memo(function ProgressBar({
    activeIndex,
    autoplayDuration,
    accentColor,
    trackColor,
    disableAnimations,
    onComplete,
}: ProgressBarProps) {
    const progress = useMotionValue(0)

    useEffect(() => {
        if (disableAnimations) return

        progress.set(0)

        const controls = animate(progress, 1, {
            duration: autoplayDuration,
            ease: "linear",
        })

        // controls.then() fires exactly when the animation finishes —
        // more accurate than setTimeout which can drift in background tabs.
        controls.then(onComplete)

        return () => controls.stop()
    }, [activeIndex, autoplayDuration, disableAnimations, onComplete, progress])

    return (
        <div style={{ ...STATIC.progressTrack, backgroundColor: trackColor }}>
            {!disableAnimations ? (
                <motion.div
                    style={{
                        ...STATIC.progressFill,
                        backgroundColor: accentColor,
                        scaleX: progress,
                    }}
                />
            ) : (
                // Canvas / reduced-motion: show a static 35% bar as a preview
                <div
                    style={{
                        ...STATIC.progressStatic,
                        backgroundColor: accentColor,
                    }}
                />
            )}
        </div>
    )
})

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

/**
 * @framerDisableUnlink
 */
export default function EditorialTestimonial(props) {
    const {
        testimonials = defaultTestimonials,
        autoplayDuration = 8,
        label = "Client Testimonial",
        padding = "40px",
        borderRadius = 32,
        bgColor = "#0F0F0F",
        primaryTextColor = "#F5F2EB",
        secondaryTextColor = "rgba(245, 242, 235, 0.5)",
        accentColor = "#F5F2EB",
        buttonBorderColor = "rgba(245, 242, 235, 0.15)",
        labelFont,
        quoteFont,
        authorFont,
        detailFont,
    } = props

    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const reduceMotion = useReducedMotion() ?? false

    // disableAnimations: single flag used everywhere instead of scattered
    // isCanvas checks. Canvas still renders and measures correctly —
    // only transitions become instant. This fixes the canvas preview collapse.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const disableAnimations = isCanvas || reduceMotion

    const safeTestimonials = useMemo(
        () => (testimonials?.length > 0 ? testimonials : defaultTestimonials),
        [testimonials]
    )

    // Stable callbacks — NavigationButtons and ProgressBar never re-render
    // on slide changes because these references never change
    const nextTestimonial = useCallback(() => {
        setActiveTestimonial((prev) => (prev + 1) % safeTestimonials.length)
    }, [safeTestimonials.length])

    const prevTestimonial = useCallback(() => {
        setActiveTestimonial(
            (prev) =>
                (prev - 1 + safeTestimonials.length) % safeTestimonials.length
        )
    }, [safeTestimonials.length])

    // Guard: if testimonials shrink while on a high index, reset to 0
    useEffect(() => {
        if (activeTestimonial >= safeTestimonials.length)
            setActiveTestimonial(0)
    }, [safeTestimonials.length, activeTestimonial])

    // Track tab visibility
    const pausedRef = useRef(false)
    useEffect(() => {
        const handle = () => {
            pausedRef.current = document.hidden
        }
        document.addEventListener("visibilitychange", handle)
        return () => document.removeEventListener("visibilitychange", handle)
    }, [])

    // Track in-view — inViewRef is now actually used in the guarded callback
    const containerRef = useRef<HTMLDivElement>(null)
    const inViewRef = useRef(true)
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                inViewRef.current = entry.isIntersecting
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Guarded next: only advances if the component is visible and tab is active.
    // Previously inViewRef was set up but never checked here, so autoplay
    // ran even when the component was scrolled off-screen.
    const guardedNext = useCallback(() => {
        if (!pausedRef.current && inViewRef.current) nextTestimonial()
    }, [nextTestimonial])

    const currentItem =
        safeTestimonials[activeTestimonial] ?? safeTestimonials[0]
    const currentQuote =
        currentItem?.quote ?? "Testimonial quote text goes here..."
    const currentName = currentItem?.name ?? "Client Name"
    const currentDetail = currentItem?.detail ?? "Context details"

    // Font styles — useMemo kept here because font objects are non-primitive
    // and spreading them is non-trivial work
    const labelStyle = useMemo<React.CSSProperties>(
        () => ({
            display: "block",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontWeight: 600,
            color: secondaryTextColor,
            marginBottom: "32px",
            ...labelFont,
        }),
        [secondaryTextColor, labelFont]
    )

    const quoteStyle = useMemo<React.CSSProperties>(
        () => ({
            fontWeight: 300,
            lineHeight: "1.6",
            color: primaryTextColor,
            margin: "0 0 40px 0",
            ...quoteFont,
        }),
        [primaryTextColor, quoteFont]
    )

    const authorStyle = useMemo<React.CSSProperties>(
        () => ({
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 600,
            color: primaryTextColor,
            margin: 0,
            ...authorFont,
        }),
        [primaryTextColor, authorFont]
    )

    const detailStyle = useMemo<React.CSSProperties>(
        () => ({
            color: secondaryTextColor,
            margin: "6px 0 0 0",
            ...detailFont,
        }),
        [secondaryTextColor, detailFont]
    )

    const containerStyle = useMemo<React.CSSProperties>(
        () => ({
            backgroundColor: bgColor,
            padding,
            borderRadius: `${borderRadius}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            // overflow:hidden — nothing escapes the container intentionally,
            // and hidden is cheaper to paint than visible
            overflow: "hidden",
            width: "100%",
            height: "auto",
            boxSizing: "border-box",
            // contain:content = layout + paint + style isolation together;
            // Chrome optimizes this path more aggressively than "layout style"
            contain: "content",
        }),
        [bgColor, padding, borderRadius]
    )

    const navButtonStyle = useMemo<React.CSSProperties>(
        () => ({
            padding: "12px",
            border: `1px solid ${buttonBorderColor}`,
            borderRadius: "50%",
            backgroundColor: "transparent",
            color: primaryTextColor,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }),
        [buttonBorderColor, primaryTextColor]
    )

    // Plain values — no useMemo needed; cost of memo > cost of value
    const trackColor = "rgba(245, 242, 235, 0.1)"
    const counterStyle: React.CSSProperties = {
        ...STATIC.counterFont,
        color: secondaryTextColor,
    }

    return (
        <div ref={containerRef} style={containerStyle}>
            <TestimonialContent
                activeIndex={activeTestimonial}
                quote={currentQuote}
                name={currentName}
                detail={currentDetail}
                label={label}
                labelStyle={labelStyle}
                quoteStyle={quoteStyle}
                authorStyle={authorStyle}
                detailStyle={detailStyle}
                disableAnimations={disableAnimations}
            />

            <div style={STATIC.navRow}>
                <NavigationButtons
                    onPrev={prevTestimonial}
                    onNext={nextTestimonial}
                    navButtonStyle={navButtonStyle}
                    accentColor={accentColor}
                    bgColor={bgColor}
                    primaryTextColor={primaryTextColor}
                />

                <ProgressBar
                    activeIndex={activeTestimonial}
                    autoplayDuration={autoplayDuration}
                    accentColor={accentColor}
                    trackColor={trackColor}
                    disableAnimations={disableAnimations}
                    onComplete={guardedNext}
                />

                <div style={counterStyle}>
                    0{activeTestimonial + 1} / 0{safeTestimonials.length}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(EditorialTestimonial, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                },
                name: { type: ControlType.String, title: "Client Name" },
                detail: {
                    type: ControlType.String,
                    title: "Context / Subtitle",
                },
            },
        },
        defaultValue: defaultTestimonials,
    },
    label: {
        type: ControlType.String,
        title: "Tag Label",
        defaultValue: "Client Testimonial",
    },
    autoplayDuration: {
        type: ControlType.Number,
        title: "Autoplay (s)",
        min: 2,
        max: 30,
        defaultValue: 8,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        group: "Layout",
        defaultValue: "40px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        group: "Layout",
        min: 0,
        max: 80,
        defaultValue: 32,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        group: "Color Scheme",
        defaultValue: "#0F0F0F",
    },
    primaryTextColor: {
        type: ControlType.Color,
        title: "Primary Text",
        group: "Color Scheme",
        defaultValue: "#F5F2EB",
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        group: "Color Scheme",
        defaultValue: "rgba(245, 242, 235, 0.5)",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        group: "Color Scheme",
        defaultValue: "#F5F2EB",
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Btn Borders",
        group: "Color Scheme",
        defaultValue: "rgba(245, 242, 235, 0.15)",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Tag Label",
        group: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "11px",
            variant: "SemiBold",
            letterSpacing: "0.2em",
        },
    },
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Text",
        group: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "22px", variant: "Light", lineHeight: "1.6" },
    },
    authorFont: {
        type: ControlType.Font,
        title: "Author Name",
        group: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "SemiBold",
            letterSpacing: "0.15em",
        },
    },
    detailFont: {
        type: ControlType.Font,
        title: "Detail Subtitle",
        group: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "12px" },
        description:
            "Get more Framer components at [Integry](https://integry.framer.ai/).",
    },
})
