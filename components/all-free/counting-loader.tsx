// Customizable Loading Animation Screen
// Features: Animated count 1-100, swipe-up reveal, full customizability (background, count, animation, text, position)
import { useEffect, useRef, useState, useCallback, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

const defaultBgImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "Gradient 1 - Blue"
}

const positionMap = {
    "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end" },
    "bottom-left": { justifyContent: "flex-end", alignItems: "flex-start" },
    "top-right": { justifyContent: "flex-start", alignItems: "flex-end" },
    "top-left": { justifyContent: "flex-start", alignItems: "flex-start" },
    center: { justifyContent: "center", alignItems: "center" },
}

/**
 * Customizable Loading Animation Screen
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LoadingScreen(props) {
    const {
        backgroundColor,
        backgroundImage = defaultBgImage,
        useImage,
        countFont,
        countColor,
        countSpeed,
        countStyle,
        countPrefix,
        countSuffix,
        countPosition,
        showPercent,
        swipeDuration,
        style,
        scrollBlock = true,
    } = props

    const [count, setCount] = useState(1)
    const [loading, setLoading] = useState(true)
    const [swipe, setSwipe] = useState(false)
    const isStatic = useIsStaticRenderer()
    const timerRef = useRef(null)
    const scrollBlockedRef = useRef(false)

    // Block scroll when loading
    useEffect(() => {
        if (typeof window === "undefined" || typeof document === "undefined") return
        function preventScroll(e) {
            e.preventDefault()
        }
        if (loading && scrollBlock && !scrollBlockedRef.current) {
            document.body.style.overflow = "hidden"
            window.addEventListener("wheel", preventScroll, false)
            window.addEventListener("touchmove", preventScroll, false)
            scrollBlockedRef.current = true
        } else if ((!loading || scrollBlock === false) && scrollBlockedRef.current) {
            document.body.style.overflow = ""
            window.removeEventListener("wheel", preventScroll, false)
            window.removeEventListener("touchmove", preventScroll, false)
            scrollBlockedRef.current = false
        }
        return () => {
            if (scrollBlockedRef.current) {
                document.body.style.overflow = ""
                window.removeEventListener("wheel", preventScroll, false)
                window.removeEventListener("touchmove", preventScroll, false)
                scrollBlockedRef.current = false
            }
        }
    }, [loading, scrollBlock])

    // Counting logic
    useEffect(() => {
        if (!loading || isStatic) return
        if (count >= 100) {
            timerRef.current = setTimeout(() => {
                startTransition(() => setSwipe(true))
                timerRef.current = setTimeout(() => {
                    startTransition(() => setLoading(false))
                }, swipeDuration)
            }, 400)
            return
        }
        timerRef.current = setTimeout(() => {
            startTransition(() => setCount((c) => c + 1))
        }, countSpeed)
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [count, loading, isStatic, countSpeed, swipeDuration])

    // Clean up
    useEffect(() => { return () => { if (timerRef.current) clearTimeout(timerRef.current) } }, [])

    // Positioning
    const pos = positionMap[countPosition] || positionMap["bottom-right"]

    // Animation variants
    const swipeVariants = {
        initial: { y: 0 },
        animate: { y: "-100%", transition: { duration: swipeDuration / 1000, ease: [0.4, 0, 0.2, 1] } },
        exit: { y: "-100%" },
    }

    // Count style
    const countStyles = {
        ...countFont,
        color: countColor,
        fontVariantNumeric: countStyle === "monospace" ? "tabular-nums" : undefined,
        fontFamily: countStyle === "monospace" ? "monospace" : countFont?.fontFamily,
        fontWeight: countFont?.fontWeight,
        fontSize: countFont?.fontSize,
        letterSpacing: countFont?.letterSpacing,
        lineHeight: countFont?.lineHeight,
        textAlign: "right",
        textShadow: "0 2px 8px rgba(0,0,0,0.08)",
        margin: 0,
        userSelect: "none",
        transition: "color 0.3s, font-size 0.3s",
    }

    // Loading screen
    return (
        <div style={{ ...style, width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
            <AnimatePresence>
                {loading && (
                    <motion.div
                        key="loader"
                        initial="initial"
                        animate={swipe ? "animate" : "initial"}
                        exit="exit"
                        variants={swipeVariants}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 10,
                            background: useImage && backgroundImage?.src ? `url(${backgroundImage.src}) center/cover no-repeat` : backgroundColor,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: pos.justifyContent,
                            alignItems: pos.alignItems,
                            transition: "background 0.3s",
                        }}
                        aria-label="Loading screen"
                        role="dialog"
                        aria-modal="true"
                        tabIndex={0}
                        aria-live="polite"
                        aria-busy={loading}
                        onKeyDown={e => {
                            if (e.key === "Escape" && loading) {
                                startTransition(() => setLoading(false))
                            }
                        }}
                    >
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: pos.justifyContent, alignItems: pos.alignItems, pointerEvents: "none" }}>
                            <span style={{ ...countStyles }} aria-live="polite" aria-atomic="true" tabIndex={0}>
                                {countPrefix}
                                {count}
                                {showPercent ? "%" : null}
                                {countSuffix}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

addPropertyControls(LoadingScreen, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    useImage: {
        type: ControlType.Boolean,
        title: "Use Image",
        defaultValue: false,
        enabledTitle: "Image",
        disabledTitle: "Color",
    },
    backgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: ({ useImage }) => !useImage,
    },
    countFont: {
        type: ControlType.Font,
        title: "Count Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "48px",
            variant: "Bold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    countColor: {
        type: ControlType.Color,
        title: "Count Color",
        defaultValue: "#000000",
    },
    countSpeed: {
        type: ControlType.Number,
        title: "Count Speed (ms)",
        defaultValue: 18,
        min: 5,
        max: 200,
        step: 1,
        displayStepper: true,
    },
    countStyle: {
        type: ControlType.Enum,
        title: "Count Style",
        options: ["default", "monospace"],
        optionTitles: ["Default", "Monospace"],
        defaultValue: "default",
        displaySegmentedControl: true,
    },
    countPrefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
    },
    countSuffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
    },
    showPercent: {
        type: ControlType.Boolean,
        title: "Show %",
        defaultValue: true,
    },
    countPosition: {
        type: ControlType.Enum,
        title: "Count Position",
        options: ["bottom-right", "bottom-left", "top-right", "top-left", "center"],
        optionTitles: ["Bottom Right", "Bottom Left", "Top Right", "Top Left", "Center"],
        defaultValue: "bottom-right",
        displaySegmentedControl: false,
    },
    swipeDuration: {
        type: ControlType.Number,
        title: "Swipe Duration (ms)",
        defaultValue: 700,
        min: 200,
        max: 2000,
        step: 10,
        displayStepper: true,
    },
    scrollBlock: {
        type: ControlType.Boolean,
        title: "Block Scroll",
        defaultValue: true,
        enabledTitle: "Block",
        disabledTitle: "Allow",
    },
})

// Documentation:
// - Background: Use 'Background' color or enable 'Use Image' and select an image.
// - Counting: Adjust 'Count Speed (ms)', 'Count Font', 'Count Color', 'Count Style', 'Prefix', 'Suffix', and 'Show %'.
// - Animation: 'Swipe Duration (ms)' controls the reveal speed. All transitions are smooth and use Framer Motion.
// - Text Position: Use 'Count Position' to place the number (bottom-right, bottom-left, top-right, top-left, center).
// - Content: Place your page content in the 'Content' slot. It will be revealed after loading.
// - Optimized for performance: Animations are paused in static/preview mode, and timers are cleaned up properly.
