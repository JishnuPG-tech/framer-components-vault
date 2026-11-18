import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Safely wrap index arrays for infinite looping
const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min
    if (rangeSize === 0) return 0
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

// Scale Framer's font objects based on breakpoints
const scaleFont = (fontObj: any, scaleFactor: number) => {
    if (!fontObj || !fontObj.fontSize) return fontObj
    const match = fontObj.fontSize.match(/^([\d.]+)([a-zA-Z%]+)$/)
    if (match) {
        const val = parseFloat(match[1]) * scaleFactor
        const unit = match[2]
        return { ...fontObj, fontSize: `${val}${unit}` }
    }
    return fontObj
}

// Bulletproof image resolver for Framer's ResponsiveImage control
const resolveImage = (img: any) => {
    if (!img) return { src: "", srcSet: undefined, alt: "" }
    if (typeof img === "string") return { src: img, srcSet: undefined, alt: "" }
    return {
        src: img.src || "",
        srcSet: img.srcSet || undefined,
        alt: img.alt || "",
    }
}

export default function TestimonialSlider(props: any) {
    const {
        testimonials = [],
        backgroundColor,
        quoteFont,
        authorFont,
        quoteColor,
        authorColor,
        quoteIconColor,
        authorIconColor,
        authorIconSize,
        placeholderBgColor,
        placeholderBorderColor,
        placeholderWidth,
        placeholderHeight,
        buttonIconColor,
        buttonHoverIconColor,
        buttonBorderColor,
        buttonHoverBgColor,
        borderRadius,
        animationSpeed,
        width, // Framer passes this live in the editor
        gridGap,
    } = props

    // State tracks the absolute page number and direction
    const [[page, direction], setPage] = useState([0, 0])

    // State for button hover contrast
    const [isPrevHovered, setPrevHovered] = useState(false)
    const [isNextHovered, setNextHovered] = useState(false)

    const activeIndex =
        testimonials.length > 0 ? wrap(0, testimonials.length, page) : 0
    const activeData = testimonials[activeIndex] || {
        quote: "",
        author: "",
        image: "",
        authorIcon: "",
    }

    // --- BULLETPROOF RESPONSIVENESS ---
    const [dimensions, setDimensions] = useState({ width: 1000, height: 800 })
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                })
            }
        }

        updateDimensions()
        const observer = new ResizeObserver(updateDimensions)
        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // CRITICAL FIX: Strictly enforce that containerWidth is a valid Number.
    let containerWidth = 1000
    if (typeof width === "number" && width > 0) {
        containerWidth = width
    } else if (dimensions.width > 0) {
        containerWidth = dimensions.width
    }

    // Strict Breakpoints
    const isMobile = containerWidth < 768
    const isTablet = containerWidth >= 768 && containerWidth < 1024

    // Calculate grid item sizes based on the EXACT width of the grid's half-container
    const gridContainerWidth = isMobile ? containerWidth : containerWidth / 2

    // Scale the user-defined width and height smoothly across devices
    const sizeScale = isMobile ? 0.7 : isTablet ? 0.85 : 1
    const itemWidth = placeholderWidth * sizeScale
    const itemHeight = placeholderHeight * sizeScale

    const distance = itemHeight + gridGap

    // Scale typography smoothly
    const fontScale = isMobile ? 0.75 : isTablet ? 0.9 : 1
    const responsiveQuoteFont = scaleFont(quoteFont, fontScale)
    const responsiveAuthorFont = scaleFont(authorFont, fontScale)

    // Navigation
    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection])
    }
    const next = () => paginate(1)
    const prev = () => paginate(-1)

    // --- GSAP-STYLE ANIMATION CONFIGURATION ---
    const gsapEaseOut = [0.19, 1, 0.22, 1]
    const transitionSettings = {
        duration: animationSpeed,
        ease: gsapEaseOut,
    }

    const textVariants = {
        enter: (direction: number) => ({
            y: direction > 0 ? 20 : -20,
            opacity: 0,
            filter: "blur(8px)",
        }),
        center: {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            transition: { ...transitionSettings },
        },
        exit: (direction: number) => ({
            y: direction > 0 ? -20 : 20,
            opacity: 0,
            filter: "blur(8px)",
            transition: { duration: animationSpeed * 0.5, ease: gsapEaseOut },
        }),
    }

    // We render 60 items in each track to ensure infinite scrolling space
    const trackItems = Array.from({ length: 60 })

    // Reusable Column Render Function
    const renderColumn = (
        isCenter: boolean,
        offsetMultiplier: number,
        staggerY: number,
        keyPrefix: string
    ) => (
        <div
            key={keyPrefix}
            style={{
                width: itemWidth,
                height: itemHeight,
                position: "relative",
                transform: `translateY(${staggerY}px)`,
            }}
        >
            <motion.div
                initial={false}
                animate={{ y: page * distance * offsetMultiplier }}
                transition={transitionSettings}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                {trackItems.map((_, i) => {
                    const offset = i - 30 // Center the 60 items around index 0
                    const isActive = isCenter && offset === page
                    const t = testimonials[wrap(0, testimonials.length, offset)]
                    const imgData = resolveImage(t?.image)

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                top: offset * distance,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                backgroundColor: isCenter
                                    ? "transparent"
                                    : placeholderBgColor,
                                border: isCenter
                                    ? "none"
                                    : `1px solid ${placeholderBorderColor}`,
                                borderRadius: borderRadius,
                                boxShadow: isActive
                                    ? "0 20px 40px -10px rgba(0,0,0,0.2)"
                                    : "inset 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.1)",
                                overflow: "hidden",
                                zIndex: isActive ? 10 : 1,
                            }}
                        >
                            {isCenter && imgData.src && (
                                <motion.img
                                    src={imgData.src}
                                    {...(imgData.srcSet
                                        ? { srcSet: imgData.srcSet }
                                        : {})}
                                    alt={
                                        imgData.alt ||
                                        t?.author ||
                                        "Testimonial"
                                    }
                                    initial={false}
                                    animate={{
                                        opacity: isActive ? 1 : 0.3,
                                        filter: isActive
                                            ? "blur(0px)"
                                            : "blur(8px)",
                                        scale: isActive ? 1 : 0.9,
                                    }}
                                    transition={transitionSettings}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </motion.div>
        </div>
    )

    return (
        <div
            ref={containerRef}
            style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                width: "100%",
                height: "100%",
                minHeight: isMobile ? "100vh" : 600,
                backgroundColor: backgroundColor,
                overflow: "hidden",
            }}
        >
            {/* LEFT SIDE: GRID AREA */}
            <div
                style={{
                    width: isMobile ? "100%" : "50%",
                    height: isMobile ? "50vh" : "100%",
                    minHeight: isMobile ? 350 : "auto",
                    flexShrink: 0,
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: gridGap,
                    overflow: "hidden",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0))",
                    maskImage:
                        "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0))",
                }}
            >
                {!isMobile &&
                    renderColumn(false, 1, itemHeight * 0.5, "col-left")}
                {renderColumn(true, -1, 0, "col-center")}
                {!isMobile &&
                    renderColumn(false, 1, -itemHeight * 0.5, "col-right")}
            </div>

            {/* RIGHT SIDE: TEXT AREA */}
            <div
                style={{
                    width: isMobile ? "100%" : "50%",
                    flex: isMobile ? 1 : "none",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isMobile ? "center" : "flex-start",
                    padding: isMobile ? "32px 24px" : "48px 8%",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: 520,
                        textAlign: isMobile ? "center" : "left",
                    }}
                >
                    {/* Large Quote Icon */}
                    <svg
                        width={isMobile ? "40" : "56"}
                        height={isMobile ? "40" : "56"}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ margin: isMobile ? "0 auto" : "0" }}
                    >
                        <path
                            d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z"
                            fill={quoteIconColor}
                        />
                    </svg>

                    <div
                        style={{
                            position: "relative",
                            minHeight: isMobile ? 180 : 240,
                            marginTop: isMobile ? 24 : 32,
                            width: "100%",
                        }}
                    >
                        <AnimatePresence
                            initial={false}
                            custom={direction}
                            mode="wait"
                        >
                            <motion.div
                                key={page}
                                custom={direction}
                                variants={textVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                }}
                            >
                                <p
                                    style={{
                                        ...responsiveQuoteFont,
                                        color: quoteColor,
                                        margin: 0,
                                    }}
                                >
                                    {activeData.quote}
                                </p>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: isMobile
                                            ? "center"
                                            : "flex-start",
                                        marginTop: isMobile ? 24 : 32,
                                        gap: 12,
                                    }}
                                >
                                    {/* Custom Author Icon or Default */}
                                    {activeData.authorIcon ? (
                                        <img
                                            src={activeData.authorIcon}
                                            alt={activeData.author || "Author"}
                                            style={{
                                                width: authorIconSize,
                                                height: authorIconSize,
                                                objectFit: "contain",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <svg
                                            width={authorIconSize}
                                            height={authorIconSize}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            style={{ flexShrink: 0 }}
                                        >
                                            <path
                                                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                                                stroke={authorIconColor}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                            <circle
                                                cx="12"
                                                cy="7"
                                                r="4"
                                                stroke={authorIconColor}
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                    <span
                                        style={{
                                            ...responsiveAuthorFont,
                                            color: authorColor,
                                        }}
                                    >
                                        {activeData.author}
                                    </span>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Buttons */}
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            marginTop: isMobile ? 32 : 40,
                            justifyContent: isMobile ? "center" : "flex-start",
                            width: "100%",
                        }}
                    >
                        <motion.button
                            onClick={prev}
                            onHoverStart={() => setPrevHovered(true)}
                            onHoverEnd={() => setPrevHovered(false)}
                            whileHover={{ backgroundColor: buttonHoverBgColor }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                border: `1px solid ${buttonBorderColor}`,
                                backgroundColor: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                                outline: "none",
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={
                                    isPrevHovered
                                        ? buttonHoverIconColor
                                        : buttonIconColor
                                }
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transition: "stroke 0.2s ease" }}
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </motion.button>
                        <motion.button
                            onClick={next}
                            onHoverStart={() => setNextHovered(true)}
                            onHoverEnd={() => setNextHovered(false)}
                            whileHover={{ backgroundColor: buttonHoverBgColor }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                border: `1px solid ${buttonBorderColor}`,
                                backgroundColor: "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                padding: 0,
                                outline: "none",
                            }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={
                                    isNextHovered
                                        ? buttonHoverIconColor
                                        : buttonIconColor
                                }
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ transition: "stroke 0.2s ease" }}
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    )
}

TestimonialSlider.defaultProps = {
    // Content
    testimonials: [
        {
            quote: "I'm not a designer, but with Stellart, my site looks like it was made by a pro. Super smooth process.",
            author: "Sarah M.",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
            authorIcon: "",
        },
        {
            quote: "Honestly, StarX did most of the work for us. Looks sharp, feels premium, and editing was way easier than I expected.",
            author: "Michael T.",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
            authorIcon: "",
        },
        {
            quote: "Frysta was simple to work with and helped me get my site up quickly. The design looks clean and did exactly what I needed.",
            author: "Emily R.",
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
            authorIcon: "",
        },
        {
            quote: "The platform is incredibly intuitive. We launched our new product page in half the time it usually takes.",
            author: "David L.",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
            authorIcon: "",
        },
        {
            quote: "I love how customizable everything is. It gave me the freedom to match my brand perfectly without writing code.",
            author: "Jessica W.",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
            authorIcon: "",
        },
    ],
    // Layout & Sizing
    placeholderWidth: 280,
    placeholderHeight: 250,
    borderRadius: 16,
    // Animation
    animationSpeed: 1.6,
    // Typography
    authorIconSize: 20,
    // Colors
    backgroundColor: "#000000",
    quoteColor: "#FFFFFF",
    quoteIconColor: "#5449D1",
    authorColor: "#757575",
    authorIconColor: "#9CA3AF",
    placeholderBgColor: "#0D0D0D",
    placeholderBorderColor: "#000000",
    buttonIconColor: "#5E5E5E",
    buttonHoverIconColor: "#FFFFFF",
    buttonBorderColor: "#3D3D3D",
    buttonHoverBgColor: "#5350CD",
    gridGap: 10,
}

addPropertyControls(TestimonialSlider, {
    // --- 1. CONTENT ---
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
                author: { type: ControlType.String, title: "Author" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                authorIcon: { type: ControlType.Image, title: "Author Icon" },
            },
        },
    },

    // --- 2. LAYOUT & SIZING ---
    gridGap: {
        type: ControlType.Number,
        title: "Grid Gap",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 10,
    },
    placeholderWidth: {
        type: ControlType.Number,
        title: "Image Width",
        min: 100,
        max: 600,
        step: 1,
        defaultValue: 280,
    },
    placeholderHeight: {
        type: ControlType.Number,
        title: "Image Height",
        min: 100,
        max: 800,
        step: 1,
        defaultValue: 250,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
    },

    // --- 3. ANIMATION ---
    animationSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        min: 0.2,
        max: 3,
        step: 0.1,
        displayStepper: true,
        defaultValue: 1.6,
    },

    // --- 4. TYPOGRAPHY & ICONS ---
    quoteFont: {
        type: ControlType.Font,
        title: "Quote Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Satoshi",
            fontSize: "24px",
            fontWeight: 400,
            letterSpacing: "0px",
            lineHeight: "1.3em",
            textAlign: "left",
        },
    },
    authorFont: {
        type: ControlType.Font,
        title: "Author Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontFamily: "Satoshi",
            fontSize: "16px",
            fontWeight: 400,
            letterSpacing: "0em",
            lineHeight: "1.5em",
            textAlign: "left",
        },
    },
    authorIconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 8,
        max: 64,
        step: 1,
        defaultValue: 20,
    },

    // --- 5. COLORS ---
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },

    quoteColor: {
        type: ControlType.Color,
        title: "Quote Text",
        defaultValue: "#FFFFFF",
    },
    quoteIconColor: {
        type: ControlType.Color,
        title: "Quote Icon",
        defaultValue: "#5449D1",
    },

    authorColor: {
        type: ControlType.Color,
        title: "Author Text",
        defaultValue: "#757575",
    },
    authorIconColor: {
        type: ControlType.Color,
        title: "Author Icon",
        defaultValue: "#9CA3AF",
    },

    placeholderBgColor: {
        type: ControlType.Color,
        title: "Grid Fill",
        defaultValue: "#0D0D0D",
    },
    placeholderBorderColor: {
        type: ControlType.Color,
        title: "Grid Border",
        defaultValue: "#000000",
    },

    buttonIconColor: {
        type: ControlType.Color,
        title: "Button Icon",
        defaultValue: "#5E5E5E",
    },
    buttonHoverIconColor: {
        type: ControlType.Color,
        title: "Btn Hover Icon",
        defaultValue: "#FFFFFF",
    },
    buttonBorderColor: {
        type: ControlType.Color,
        title: "Button Border",
        defaultValue: "#3D3D3D",
    },
    buttonHoverBgColor: {
        type: ControlType.Color,
        title: "Button Hover",
        defaultValue: "#5350CD",
    },
})
