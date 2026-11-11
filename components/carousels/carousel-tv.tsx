import { useEffect, useState, useRef, useId } from "react"
import { AnimatePresence, motion } from "motion/react"

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface Slide {
    img: string
    title: string
    desc: string
}

interface CarouselTVProps {
    data: Slide[]
    minTextHeight?: number
    titleFont?: any
    titleColor?: string
    descFont?: any
    descColor?: string
    duration?: number
    trackDuration?: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 500
 */
export default function CarouselTV({
    data = [
        {
            img: "",
            title: "Topic One",
            desc: "Add a short description for the first topic.",
        },
        {
            img: "",
            title: "Topic Two",
            desc: "Add a short description for the second topic.",
        },
        {
            img: "",
            title: "Topic Three",
            desc: "Add a short description for the third topic.",
        },
    ],

    minTextHeight = 180,
    titleFont = {
        fontSize: 32,
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.15em",
    },
    titleColor = "#000000",
    descFont = {
        fontSize: 14,
        variant: "Regular",
        letterSpacing: "0em",
        lineHeight: "1.25em",
    },
    descColor = "#000000",
    duration = 4,
    trackDuration = 500,
}: CarouselTVProps) {
    const isStatic = useIsStaticRenderer()

    const [activeIndex, setActiveIndex] = useState<number>(0)

    const [knobRotation, setKnobRotation] = useState<number>(0)
    const durationMs = Math.max(0.5, duration) * 1000

    const slides: Slide[] = data

    const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0

    const activeSlide = slides[safeIndex]

    const changeTopic = (index: number) => {
        if (index === activeIndex) return
        setActiveIndex(index)
        setKnobRotation((rotation) => rotation + 30)
    }

    const stepsViewportRef = useRef<HTMLDivElement>(null)
    const stepsTrackRef = useRef<HTMLDivElement>(null)
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        if (isStatic) return

        const viewport = stepsViewportRef.current
        const activeStep = stepRefs.current[safeIndex]

        if (!viewport || !activeStep) return

        const centerStep = () => {
            const viewportWidth = viewport.clientWidth
            const stepCenter =
                activeStep.offsetLeft + activeStep.offsetWidth / 2

            const translateX = viewportWidth / 2 - stepCenter

            if (stepsTrackRef.current) {
                stepsTrackRef.current.style.transform = `translateX(${translateX}px)`
            }
        }

        centerStep()
        window.addEventListener("resize", centerStep)

        return () => {
            window.removeEventListener("resize", centerStep)
        }
    }, [isStatic, safeIndex, slides.length])

    // Automatically move to the next slide
    useEffect(() => {
        // Don't run autoplay in Framer's canvas or during export.
        if (isStatic || slides.length <= 1) return

        const timer = setTimeout(() => {
            setActiveIndex((currentIndex) => {
                const nextIndex = (currentIndex + 1) % slides.length
                setKnobRotation((rotation) => rotation + 30)
                return nextIndex
            })
        }, durationMs)

        return () => clearTimeout(timer)
    }, [isStatic, activeIndex, durationMs, slides.length])

    if (isStatic) {
        const previewSlide = slides[safeIndex] ?? {
            img: "",
            title: "Carousel TV",
            desc: "Add topics in the component properties.",
        }

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    minHeight: 280,
                    boxSizing: "border-box",
                    padding: 24,
                    textAlign: "center",
                    background: "#fafafa",
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                    color: "#171717",
                }}
            >
                <div
                    style={{
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#737373",
                        marginBottom: 16,
                    }}
                >
                    Carousel TV
                </div>

                <div
                    style={{
                        width: 48,
                        height: 36,
                        border: "2px solid #737373",
                        borderRadius: 6,
                        marginBottom: 20,
                        position: "relative",
                        background: "#e5e5e5",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            width: 18,
                            height: 2,
                            background: "#737373",
                            bottom: -7,
                            left: "50%",
                            transform: "translateX(-50%)",
                        }}
                    />
                </div>

                <h2
                    style={{
                        ...titleFont,
                        color: titleColor,
                        margin: 0,
                    }}
                >
                    {previewSlide.title}
                </h2>

                <p
                    style={{
                        ...descFont,
                        color: descColor,
                        margin: "12px 0 0",
                    }}
                >
                    {previewSlide.desc}
                </p>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",

                width: "100%",
                height: "100%",

                boxSizing: "border-box",
                marginInline: "auto",
            }}
        >
            {/* Image */}

            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                }}
            >
                <div style={{ width: "100%" }}>
                    <TVAsset
                        imageSrc={activeSlide.img}
                        knobRotation={knobRotation}
                    />
                </div>
            </div>

            {/* Step indicators */}
            <div
                ref={stepsViewportRef}
                style={{
                    position: "relative",
                    width: "100%",
                    overflow: "hidden",
                }}
            >
                {/* Animated track */}
                <div
                    ref={stepsTrackRef}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "clamp(1.5rem, 5vw, 2rem)",
                        width: "max-content",
                        marginTop: "2rem",
                        transition: `transform ${trackDuration}ms ease-in-out`,
                        willChange: "transform",
                    }}
                >
                    {slides.map((slide, index) => {
                        const isActive = index === activeIndex

                        return (
                            <div
                                key={index}
                                ref={(el) => {
                                    stepRefs.current[index] = el
                                }}
                                style={{ flexShrink: 0 }}
                            >
                                <motion.button
                                    key={index}
                                    type="button"
                                    onClick={() => changeTopic(index)}
                                    aria-label={`Show slide ${index + 1}`}
                                    animate={{
                                        scale: isActive ? 1 : 0.8,
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeInOut",
                                    }}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "2rem",
                                        height: "2rem",
                                        padding: 0,
                                        border: 0,
                                        borderRadius: "9999px",
                                        outline: "none",
                                        cursor: "pointer",
                                        background: "transparent",
                                        willChange: "transform",
                                        userSelect: "none",
                                        WebkitUserSelect: "none",
                                        WebkitTapHighlightColor: "transparent",
                                        WebkitTouchCallout: "none",
                                    }}
                                >
                                    {/* Indicator background */}

                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "9999px",
                                            background: "#e5e5e5",
                                        }}
                                    />

                                    {/* Animated loader */}

                                    {isActive && (
                                        <svg
                                            viewBox="0 0 32 32"
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                width: "2rem",
                                                height: "2rem",
                                                transform: "rotate(-90deg)",
                                                overflow: "visible",
                                            }}
                                        >
                                            <motion.circle
                                                key={activeIndex}
                                                cx="16"
                                                cy="16"
                                                r="14"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                pathLength={1}
                                                initial={{
                                                    pathLength: 0,
                                                }}
                                                animate={{
                                                    pathLength: 1,
                                                }}
                                                transition={{
                                                    duration: Math.max(
                                                        0.5,
                                                        duration
                                                    ),
                                                    ease: "linear",
                                                }}
                                                style={{ color: "#000" }}
                                            />
                                        </svg>
                                    )}

                                    {/* Number */}

                                    <span
                                        style={{
                                            position: "relative",
                                            zIndex: 10,
                                            color: "#000",
                                            fontSize: 13,
                                            fontWeight: 500,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {index + 1}
                                    </span>
                                </motion.button>
                            </div>
                        )
                    })}
                </div>

                {/* Left fade */}
                <div
                    style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        width: 52,
                        background:
                            "linear-gradient(to right, white, transparent)",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />

                {/* Right fade */}
                <div
                    style={{
                        position: "absolute",
                        inset: "0 0 0 auto",
                        width: 52,
                        background:
                            "linear-gradient(to left, white, transparent)",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            </div>

            {/* Title + Description */}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    flex: 1,
                    minHeight: minTextHeight,
                    boxSizing: "border-box",
                    marginTop: "2.5rem",
                    textAlign: "center",
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{
                            opacity: 0,
                            y: 8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -8,
                        }}
                        transition={{
                            duration: 0.35,
                            ease: "easeOut",
                        }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            width: "100%",
                            minWidth: 0,
                            height: "auto",
                            boxSizing: "border-box",
                        }}
                    >
                        <h2
                            style={{
                                width: "100%",
                                minWidth: 0,
                                overflowWrap: "anywhere",
                                boxSizing: "border-box",
                                ...titleFont,
                                color: titleColor,
                            }}
                        >
                            {activeSlide.title}
                        </h2>

                        <p
                            style={{
                                width: "100%",
                                maxWidth: "100%",
                                minWidth: 0,
                                overflowWrap: "anywhere",
                                margin: "0.5rem 0 0",
                                padding: "0 0.75rem",
                                boxSizing: "border-box",
                                ...descFont,
                                color: descColor,
                            }}
                        >
                            {activeSlide.desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

interface TVAssetProps {
    imageSrc: string

    knobRotation: number
}

function TVAsset({
    imageSrc,

    knobRotation,
}: TVAssetProps) {
    const id = useId()

    const screenClipId = `tv-screen-clip-${id.replace(/:/g, "")}`

    return (
        <svg
            width={377}
            height={243}
            viewBox="0 0 377 243"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            style={{ display: "block", width: "100%", height: "auto" }}
        >
            <g id="TV">
                <g id="Rectangle 2">
                    <mask id="path-1-inside-1_522_73" fill="white">
                        <path d="M30.1006 242.5H347.101C350.967 242.5 354.101 239.366 354.101 235.5H23.1006C23.1006 239.366 26.2346 242.5 30.1006 242.5Z" />
                    </mask>

                    <path
                        d="M30.1006 242.5H347.101C350.967 242.5 354.101 239.366 354.101 235.5H23.1006C23.1006 239.366 26.2346 242.5 30.1006 242.5Z"
                        fill="#737373"
                        stroke="#737373"
                        strokeWidth={2}
                        mask="url(#path-1-inside-1_522_73)"
                    />
                </g>

                <g id="Rectangle 3" filter="url(#filter0_ii_522_73)">
                    <path
                        d="M3.10059 8.5C3.10059 4.08172 6.68231 0.5 11.1006 0.5H365.101C369.519 0.5 373.101 4.08172 373.101 8.5V223.5H3.10059V8.5Z"
                        fill="url(#paint0_linear_522_73)"
                    />
                </g>

                <path
                    id="Rectangle 3 (Stroke)"
                    d="M372.601 8.5C372.601 4.35787 369.243 1 365.101 1H11.1006C6.95845 1 3.60059 4.35786 3.60059 8.5V223H372.601V8.5ZM373.601 224H2.60059V8.5C2.60059 3.80558 6.40617 0 11.1006 0H365.101C369.795 0 373.601 3.80558 373.601 8.5V224Z"
                    fill="#D4D4D4"
                />

                <g id="speeker side">
                    <g id="Container " filter="url(#filter1_i_522_73)">
                        <path
                            d="M299.101 15.5C299.101 12.7386 301.339 10.5 304.101 10.5H359.101C361.862 10.5 364.101 12.7386 364.101 15.5V210.5C364.101 213.261 361.862 215.5 359.101 215.5H304.101C301.339 215.5 299.101 213.261 299.101 210.5V15.5Z"
                            fill="url(#paint1_linear_522_73)"
                        />
                    </g>

                    <path
                        id="Container  (Stroke)"
                        d="M363.601 15.5C363.601 13.0147 361.586 11 359.101 11H304.101C301.615 11 299.601 13.0147 299.601 15.5V210.5C299.601 212.985 301.615 215 304.101 215H359.101C361.586 215 363.601 212.985 363.601 210.5V15.5ZM364.601 210.5C364.601 213.538 362.138 216 359.101 216H304.101C301.063 216 298.601 213.538 298.601 210.5V15.5C298.601 12.4624 301.063 10 304.101 10H359.101C362.138 10 364.601 12.4624 364.601 15.5V210.5Z"
                        fill="#737373"
                    />

                    <g id="Rectangle 6">
                        <g filter="url(#filter2_i_522_73)">
                            <rect
                                x={301.601}
                                y={116.5}
                                width={60}
                                height={89}
                                rx={5}
                                fill="url(#paint2_linear_522_73)"
                            />
                        </g>

                        <rect
                            x={302.101}
                            y={117}
                            width={59}
                            height={88}
                            rx={4.5}
                            stroke="#737373"
                        />
                    </g>

                    <g id="Tak">
                        <g id="Nob1">
                            <circle
                                id="Ellipse 22"
                                cx={341.101}
                                cy={139}
                                r={17}
                                fill="url(#paint3_radial_522_73)"
                                stroke="#737373"
                            />

                            <g id="Repeat group 1">
                                <g
                                    id="Repeat group 1_inner"
                                    data-figma-trr="r11p28-0f"
                                >
                                    <circle
                                        id="Ellipse 25"
                                        cx={341.035}
                                        cy={125.535}
                                        r={1}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(129.577 -162.227) rotate(32.7273)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(326.29 -228.646) rotate(65.4545)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(527.685 -178.171) rotate(98.1818)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(669.82 -26.8259) rotate(130.909)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(707.568 177.338) rotate(163.636)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(628.945 369.499) rotate(-163.636)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(458.912 488.649) rotate(-130.909)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(251.455 496.957) rotate(-98.1818)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(72.4385 391.787) rotate(-65.4546)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_inner"
                                    transform="translate(-21.3003 206.528) rotate(-32.7273)"
                                />
                            </g>

                            <motion.g
                                id="Rotator1"
                                animate={{ rotate: knobRotation }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeInOut",
                                }}
                            >
                                &#x20;
                                <circle
                                    id="Ellipse 24"
                                    cx={341.101}
                                    cy={139}
                                    r={9.5}
                                    stroke="#737373"
                                />
                                <g
                                    id="Rectangle 8"
                                    filter="url(#filter3_i_522_73)"
                                >
                                    <path
                                        d="M342.601 146.5C342.601 147.052 342.153 147.5 341.601 147.5H340.601C340.048 147.5 339.601 147.052 339.601 146.5V133.342L341.101 130.5L342.601 133.342V146.5Z"
                                        fill="#FAFAFA"
                                    />
                                </g>
                            </motion.g>
                        </g>

                        <g id="Button">
                            <rect
                                id="Rectangle 9"
                                x={336.101}
                                y={158.5}
                                width={10}
                                height={5}
                                fill="#404040"
                            />

                            <rect
                                id="Rectangle 10"
                                x={339.101}
                                y={159.5}
                                width={4}
                                height={3}
                                fill="#D4D4D4"
                            />
                        </g>

                        <g id="Nob2">
                            <circle
                                id="Ellipse 22_2"
                                cx={341.101}
                                cy={183}
                                r={17}
                                fill="url(#paint4_radial_522_73)"
                                stroke="#737373"
                            />

                            <g id="Repeat group 1_2">
                                <g
                                    id="Repeat group 1_2_inner"
                                    data-figma-trr="r11p28-0f"
                                >
                                    <circle
                                        id="Ellipse 25_2"
                                        cx={341.035}
                                        cy={169.535}
                                        r={1}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(153.365 -155.242) rotate(32.7273)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(366.314 -202.925) rotate(65.4545)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(571.237 -127.909) rotate(98.1818)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(703.073 45.988) rotate(130.909)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(719.964 263.555) rotate(163.636)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(616.548 455.717) rotate(-163.636)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(425.659 561.463) rotate(-130.909)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(207.903 547.219) rotate(-98.1818)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(32.4146 417.509) rotate(-65.4546)"
                                />

                                <use
                                    xlinkHref="#Repeat%20group%201_2_inner"
                                    transform="translate(-45.0885 213.513) rotate(-32.7273)"
                                />
                            </g>

                            <motion.g
                                id="Rotator2"
                                animate={{ rotate: knobRotation * 2 }}
                                transition={{
                                    duration: 0.4,
                                    ease: "easeInOut",
                                }}
                            >
                                <circle
                                    id="Ellipse 24_2"
                                    cx={341.101}
                                    cy={183}
                                    r={9.5}
                                    stroke="#737373"
                                />

                                <g
                                    id="Rectangle 8_2"
                                    filter="url(#filter4_i_522_73)"
                                >
                                    <path
                                        d="M342.601 190.5C342.601 191.052 342.153 191.5 341.601 191.5H340.601C340.048 191.5 339.601 191.052 339.601 190.5V177.342L341.101 174.5L342.601 177.342V190.5Z"
                                        fill="#FAFAFA"
                                    />
                                </g>
                            </motion.g>
                        </g>
                    </g>

                    <g id="Rectangle 7">
                        <mask id="path-18-inside-2_522_73" fill="white">
                            <path d="M302.601 120.5H316.601C319.362 120.5 321.601 122.739 321.601 125.5V196.5C321.601 199.261 319.362 201.5 316.601 201.5H302.601V120.5Z" />
                        </mask>

                        <path
                            d="M302.601 120.5H316.601C319.362 120.5 321.601 122.739 321.601 125.5V196.5C321.601 199.261 319.362 201.5 316.601 201.5H302.601V120.5Z"
                            fill="#171717"
                        />

                        <path
                            d="M302.601 119.5H316.601C319.914 119.5 322.601 122.186 322.601 125.5H320.601C320.601 123.291 318.81 121.5 316.601 121.5H302.601V119.5ZM322.601 196.5C322.601 199.814 319.914 202.5 316.601 202.5H302.601V200.5H316.601C318.81 200.5 320.601 198.709 320.601 196.5H322.601ZM320.601 196.5M302.601 201.5V120.5V201.5M316.601 119.5C319.914 119.5 322.601 122.186 322.601 125.5V196.5C322.601 199.814 319.914 202.5 316.601 202.5V200.5C318.81 200.5 320.601 198.709 320.601 196.5V125.5C320.601 123.291 318.81 121.5 316.601 121.5V119.5Z"
                            fill="#737373"
                            mask="url(#path-18-inside-2_522_73)"
                        />
                    </g>

                    <g id="Frame 20">
                        <g id="Group 18">
                            <circle
                                id="Ellipse 20"
                                cx={311.101}
                                cy={128.5}
                                r={4.5}
                                fill="#171717"
                                stroke="#737373"
                            />

                            <g id="Ellipse 21">
                                <g filter="url(#filter5_i_522_73)">
                                    <circle
                                        cx={311.101}
                                        cy={128.5}
                                        r={3}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <circle
                                    cx={311.101}
                                    cy={128.5}
                                    r={2.5}
                                    stroke="#D4D4D4"
                                />
                            </g>
                        </g>

                        <g id="Group 23">
                            <circle
                                id="Ellipse 20_2"
                                cx={311.101}
                                cy={144.5}
                                r={4.5}
                                fill="#171717"
                                stroke="#737373"
                            />

                            <g id="Ellipse 21_2">
                                <g filter="url(#filter6_i_522_73)">
                                    <circle
                                        cx={311.101}
                                        cy={144.5}
                                        r={3}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <circle
                                    cx={311.101}
                                    cy={144.5}
                                    r={2.5}
                                    stroke="#D4D4D4"
                                />
                            </g>
                        </g>

                        <g id="Group 24">
                            <circle
                                id="Ellipse 20_3"
                                cx={311.101}
                                cy={160.5}
                                r={4.5}
                                fill="#171717"
                                stroke="#737373"
                            />

                            <g id="Ellipse 21_3">
                                <g filter="url(#filter7_i_522_73)">
                                    <circle
                                        cx={311.101}
                                        cy={160.5}
                                        r={3}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <circle
                                    cx={311.101}
                                    cy={160.5}
                                    r={2.5}
                                    stroke="#D4D4D4"
                                />
                            </g>
                        </g>

                        <g id="Group 25">
                            <circle
                                id="Ellipse 20_4"
                                cx={311.101}
                                cy={176.5}
                                r={4.5}
                                fill="#171717"
                                stroke="#737373"
                            />

                            <g id="Ellipse 21_4">
                                <g filter="url(#filter8_i_522_73)">
                                    <circle
                                        cx={311.101}
                                        cy={176.5}
                                        r={3}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <circle
                                    cx={311.101}
                                    cy={176.5}
                                    r={2.5}
                                    stroke="#D4D4D4"
                                />
                            </g>
                        </g>

                        <g id="Group 26">
                            <circle
                                id="Ellipse 20_5"
                                cx={311.101}
                                cy={192.5}
                                r={4.5}
                                fill="#171717"
                                stroke="#737373"
                            />

                            <g id="Ellipse 21_5">
                                <g filter="url(#filter9_i_522_73)">
                                    <circle
                                        cx={311.101}
                                        cy={192.5}
                                        r={3}
                                        fill="#D4D4D4"
                                    />
                                </g>

                                <circle
                                    cx={311.101}
                                    cy={192.5}
                                    r={2.5}
                                    stroke="#D4D4D4"
                                />
                            </g>
                        </g>
                    </g>

                    <line
                        id="Line 4"
                        x1={300.101}
                        y1={18}
                        x2={363.101}
                        y2={18}
                        stroke="#737373"
                    />

                    <line
                        id="Line 5"
                        x1={300.101}
                        y1={208}
                        x2={363.101}
                        y2={208}
                        stroke="#737373"
                    />

                    <g id="Speaker">
                        <line
                            id="Line 6"
                            x1={300.101}
                            y1={22}
                            x2={363.101}
                            y2={22}
                            stroke="#737373"
                        />

                        <line
                            id="Line 7"
                            x1={300.101}
                            y1={26}
                            x2={363.101}
                            y2={26}
                            stroke="#737373"
                        />

                        <line
                            id="Line 8"
                            x1={300.101}
                            y1={30}
                            x2={363.101}
                            y2={30}
                            stroke="#737373"
                        />

                        <line
                            id="Line 9"
                            x1={300.101}
                            y1={34}
                            x2={363.101}
                            y2={34}
                            stroke="#737373"
                        />

                        <line
                            id="Line 10"
                            x1={300.101}
                            y1={38}
                            x2={363.101}
                            y2={38}
                            stroke="#737373"
                        />

                        <line
                            id="Line 11"
                            x1={300.101}
                            y1={42}
                            x2={363.101}
                            y2={42}
                            stroke="#737373"
                        />

                        <line
                            id="Line 12"
                            x1={300.101}
                            y1={46}
                            x2={363.101}
                            y2={46}
                            stroke="#737373"
                        />

                        <line
                            id="Line 13"
                            x1={300.101}
                            y1={50}
                            x2={363.101}
                            y2={50}
                            stroke="#737373"
                        />

                        <line
                            id="Line 14"
                            x1={300.101}
                            y1={54}
                            x2={363.101}
                            y2={54}
                            stroke="#737373"
                        />

                        <line
                            id="Line 15"
                            x1={300.101}
                            y1={58}
                            x2={363.101}
                            y2={58}
                            stroke="#737373"
                        />

                        <line
                            id="Line 16"
                            x1={300.101}
                            y1={62}
                            x2={363.101}
                            y2={62}
                            stroke="#737373"
                        />

                        <line
                            id="Line 17"
                            x1={300.101}
                            y1={66}
                            x2={363.101}
                            y2={66}
                            stroke="#737373"
                        />

                        <line
                            id="Line 18"
                            x1={300.101}
                            y1={70}
                            x2={363.101}
                            y2={70}
                            stroke="#737373"
                        />

                        <line
                            id="Line 19"
                            x1={300.101}
                            y1={74}
                            x2={363.101}
                            y2={74}
                            stroke="#737373"
                        />

                        <line
                            id="Line 20"
                            x1={300.101}
                            y1={78}
                            x2={363.101}
                            y2={78}
                            stroke="#737373"
                        />

                        <line
                            id="Line 21"
                            x1={300.101}
                            y1={82}
                            x2={363.101}
                            y2={82}
                            stroke="#737373"
                        />

                        <line
                            id="Line 22"
                            x1={300.101}
                            y1={86}
                            x2={363.101}
                            y2={86}
                            stroke="#737373"
                        />

                        <line
                            id="Line 23"
                            x1={300.101}
                            y1={90}
                            x2={363.101}
                            y2={90}
                            stroke="#737373"
                        />

                        <line
                            id="Line 24"
                            x1={300.101}
                            y1={94}
                            x2={363.101}
                            y2={94}
                            stroke="#737373"
                        />

                        <line
                            id="Line 25"
                            x1={300.101}
                            y1={98}
                            x2={363.101}
                            y2={98}
                            stroke="#737373"
                        />

                        <line
                            id="Line 26"
                            x1={300.101}
                            y1={102}
                            x2={363.101}
                            y2={102}
                            stroke="#737373"
                        />
                    </g>
                </g>

                <g id="screen side">
                    <g id="Screen Outer 2" filter="url(#filter10_i_522_73)">
                        <path
                            d="M13.1006 15.5C13.1006 12.7386 15.3392 10.5 18.1006 10.5H287.101C289.862 10.5 292.101 12.7386 292.101 15.5V210.5C292.101 213.261 289.862 215.5 287.101 215.5H18.1006C15.3392 215.5 13.1006 213.261 13.1006 210.5V15.5Z"
                            fill="#D9D9D9"
                        />
                    </g>

                    <path
                        id="Screen Outer 2 (Stroke)"
                        d="M291.601 15.5C291.601 13.0147 289.586 11 287.101 11H18.1006C15.6153 11 13.6006 13.0147 13.6006 15.5V210.5C13.6006 212.985 15.6153 215 18.1006 215H287.101C289.586 215 291.601 212.985 291.601 210.5V15.5ZM292.601 210.5C292.601 213.538 290.138 216 287.101 216H18.1006C15.063 216 12.6006 213.538 12.6006 210.5V15.5C12.6006 12.4624 15.063 10 18.1006 10H287.101C290.138 10 292.601 12.4624 292.601 15.5V210.5Z"
                        fill="#A1A1A1"
                    />

                    <g id="Screen Outer">
                        <mask id="path-60-inside-3_522_73" fill="white">
                            <path d="M26.7297 28.7302C26.9398 26.2781 28.8645 24.3855 31.3209 24.2329C47.9961 23.1966 110.438 19.5 152.601 19.5C194.764 19.5 257.205 23.1966 273.88 24.2329C276.337 24.3855 278.261 26.278 278.472 28.73C279.629 42.2411 283.101 85.1865 283.101 114.5C283.101 143.814 279.629 186.759 278.472 200.27C278.261 202.722 276.337 204.615 273.88 204.767C257.207 205.803 194.775 209.5 152.601 209.5C110.426 209.5 47.9944 205.803 31.3208 204.767C28.8645 204.615 26.9398 202.722 26.7297 200.27C25.5719 186.757 22.1006 143.802 22.1006 114.5C22.1006 85.1985 25.5718 42.2434 26.7297 28.7302Z" />
                        </mask>

                        <path
                            d="M26.7297 28.7302C26.9398 26.2781 28.8645 24.3855 31.3209 24.2329C47.9961 23.1966 110.438 19.5 152.601 19.5C194.764 19.5 257.205 23.1966 273.88 24.2329C276.337 24.3855 278.261 26.278 278.472 28.73C279.629 42.2411 283.101 85.1865 283.101 114.5C283.101 143.814 279.629 186.759 278.472 200.27C278.261 202.722 276.337 204.615 273.88 204.767C257.207 205.803 194.775 209.5 152.601 209.5C110.426 209.5 47.9944 205.803 31.3208 204.767C28.8645 204.615 26.9398 202.722 26.7297 200.27C25.5719 186.757 22.1006 143.802 22.1006 114.5C22.1006 85.1985 25.5718 42.2434 26.7297 28.7302Z"
                            fill="#171717"
                            stroke="#737373"
                            strokeWidth={2}
                            mask="url(#path-60-inside-3_522_73)"
                        />
                    </g>

                    <path
                        id="Screen"
                        d="M32.1237 37.7726C32.5273 32.8667 36.4348 29.0306 41.3482 28.7334C61.8707 27.4921 115.172 24.5 152.101 24.5C189.03 24.5 242.331 27.4922 262.853 28.7334C267.767 29.0306 271.674 32.8667 272.078 37.7724C273.409 53.949 276.101 89.7734 276.101 115C276.101 140.227 273.409 176.051 272.078 192.228C271.674 197.133 267.767 200.969 262.853 201.267C242.333 202.508 189.039 205.5 152.101 205.5C115.162 205.5 61.8685 202.508 41.3481 201.267C36.4347 200.969 32.5273 197.133 32.1237 192.228C30.7924 176.048 28.1006 140.217 28.1006 115C28.1006 89.7833 30.7924 53.9517 32.1237 37.7726Z"
                    />

                    <foreignObject
                        x="28.1"
                        y="24.5"
                        width="248"
                        height="181"
                        clipPath={`url(#${screenClipId})`}
                    >
                        <div style={{ width: "100%", height: "100%" }}>
                            <img
                                src={imageSrc}
                                alt=""
                                style={{
                                    width: "100%",

                                    height: "100%",

                                    objectFit: "cover",

                                    objectPosition: "center",

                                    display: "block",
                                }}
                            />
                        </div>
                    </foreignObject>
                </g>

                <path
                    id="Vector 44"
                    d="M0.600586 236.5L3.18027 222.5H373.101L375.601 236.5H0.600586Z"
                    fill="url(#paint6_linear_522_73)"
                    stroke="#D4D4D4"
                />
            </g>

            <defs>
                <clipPath id={screenClipId}>
                    <path d="M32.1237 37.7726C32.5273 32.8667 36.4348 29.0306 41.3482 28.7334C61.8707 27.4921 115.172 24.5 152.101 24.5C189.03 24.5 242.331 27.4922 262.853 28.7334C267.767 29.0306 271.674 32.8667 272.078 37.7724C273.409 53.949 276.101 89.7734 276.101 115C276.101 140.227 273.409 176.051 272.078 192.228C271.674 197.133 267.767 200.969 262.853 201.267C242.333 202.508 189.039 205.5 152.101 205.5C115.162 205.5 61.8685 202.508 41.3481 201.267C36.4347 200.969 32.5273 197.133 32.1237 192.228C30.7924 176.048 28.1006 140.217 28.1006 115C28.1006 89.7833 30.7924 53.9517 32.1237 37.7726Z" />
                </clipPath>

                <filter
                    id="filter0_ii_522_73"
                    x={3.10059}
                    y={-6.5}
                    width={370}
                    height={233}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={3} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.960784 0 0 0 0 0.960784 0 0 0 0 0.960784 0 0 0 1 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={-7} />

                    <feGaussianBlur stdDeviation={3.5} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 0 0.45098 0 0 0 1 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="effect1_innerShadow_522_73"
                        result="effect2_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter1_i_522_73"
                    x={299.101}
                    y={10.5}
                    width={65}
                    height={210}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={5} />

                    <feGaussianBlur stdDeviation={7.1} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 0 0.0392157 0 0 0 1 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter2_i_522_73"
                    x={301.601}
                    y={116.5}
                    width={60}
                    height={93}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter3_i_522_73"
                    x={339.601}
                    y={127.5}
                    width={3}
                    height={20}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter4_i_522_73"
                    x={339.601}
                    y={171.5}
                    width={3}
                    height={20}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter5_i_522_73"
                    x={308.101}
                    y={125.5}
                    width={6}
                    height={10}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter6_i_522_73"
                    x={308.101}
                    y={141.5}
                    width={6}
                    height={10}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter7_i_522_73"
                    x={308.101}
                    y={157.5}
                    width={6}
                    height={10}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter8_i_522_73"
                    x={308.101}
                    y={173.5}
                    width={6}
                    height={10}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter9_i_522_73"
                    x={308.101}
                    y={189.5}
                    width={6}
                    height={10}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset dy={4} />

                    <feGaussianBlur stdDeviation={2} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <filter
                    id="filter10_i_522_73"
                    x={13.1006}
                    y={10.5}
                    width={279}
                    height={205}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity={0} result="BackgroundImageFix" />

                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />

                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />

                    <feOffset />

                    <feGaussianBlur stdDeviation={7.5} />

                    <feComposite
                        in2="hardAlpha"
                        operator="arithmetic"
                        k2={-1}
                        k3={1}
                    />

                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.65 0"
                    />

                    <feBlend
                        mode="normal"
                        in2="shape"
                        result="effect1_innerShadow_522_73"
                    />
                </filter>

                <linearGradient
                    id="paint0_linear_522_73"
                    x1={188.101}
                    y1={0.5}
                    x2={188.101}
                    y2={223.5}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E5E5E5" />

                    <stop offset={0.947115} stopColor="#D4D4D4" />
                </linearGradient>

                <linearGradient
                    id="paint1_linear_522_73"
                    x1={331.601}
                    y1={10.5}
                    x2={331.601}
                    y2={215.5}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#262626" />

                    <stop offset={1} stopColor="#404040" />
                </linearGradient>

                <linearGradient
                    id="paint2_linear_522_73"
                    x1={331.601}
                    y1={116.5}
                    x2={331.601}
                    y2={205.5}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#E5E5E5" />

                    <stop offset={1} stopColor="#D4D4D4" />
                </linearGradient>

                <radialGradient
                    id="paint3_radial_522_73"
                    cx={0}
                    cy={0}
                    r={1}
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(341.101 139) rotate(90) scale(17.5)"
                >
                    <stop offset={0.778846} stopColor="#171717" />

                    <stop offset={1} stopColor="#D4D4D4" />
                </radialGradient>

                <radialGradient
                    id="paint4_radial_522_73"
                    cx={0}
                    cy={0}
                    r={1}
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(341.101 183) rotate(90) scale(17.5)"
                >
                    <stop offset={0.778846} stopColor="#171717" />

                    <stop offset={1} stopColor="#D4D4D4" />
                </radialGradient>

                <radialGradient
                    id="paint5_radial_522_73"
                    cx={0}
                    cy={0}
                    r={1}
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(152.101 115) rotate(90) scale(90.5 124)"
                >
                    <stop stopColor="#525252" />

                    <stop offset={1} stopColor="#404040" />
                </radialGradient>

                <linearGradient
                    id="paint6_linear_522_73"
                    x1={194.601}
                    y1={222.5}
                    x2={195.101}
                    y2={252}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#D4D4D4" />

                    <stop offset={1} stopColor="#404040" />
                </linearGradient>
            </defs>
        </svg>
    )
}

addPropertyControls(CarouselTV, {
    minTextHeight: {
        type: ControlType.Number,
        title: "Min Text Height",
        defaultValue: 180,
        min: 0,
        max: 1000,
        step: 10,
        unit: "px",
        displayStepper: true,
        group: "Layout",
        description:
            "Set a minimum height that fits your longest text to keep the layout stable during animation.",
    },
    data: {
        type: ControlType.Array,
        title: "Data",
        control: {
            type: ControlType.Object,
            controls: {
                img: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Upload Image or GIF or SVG",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                },
                desc: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                img: "",
                title: "Topic One",
                desc: "Add a short description for the first topic.",
            },
            {
                img: "",
                title: "Topic Two",
                desc: "Add a short description for the second topic.",
            },
            {
                img: "",
                title: "Topic Three",
                desc: "Add a short description for the third topic.",
            },
        ],
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Style",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 32,
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.15em",
        },
        group: "Typography",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#000000",
        group: "Typography",
    },
    descFont: {
        type: ControlType.Font,
        title: "Description Style",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.25em",
        },
        group: "Typography",
    },
    descColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "#000000",
        group: "Typography",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 4,
        min: 0.5,
        max: 30,
        step: 0.5,
        unit: "s",
        displayStepper: true,
        group: "Playback",
    },
    trackDuration: {
        type: ControlType.Number,
        title: "Track Transition",
        defaultValue: 500,
        min: 100,
        max: 2000,
        step: 50,
        unit: "ms",
        displayStepper: true,
        group: "Playback",
    },
})
