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

import { AnimatePresence, motion, useInView } from "framer-motion"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type SlideItem = {
    title: string
    subtitle: string
    image: ResponsiveImage
}

type ArrowStyle = {
    size: number
    color: string
    background: string
    borderRadius: number
    shadow: string
    borderColor: string
    borderWidth: number
    offsetX: number
    offsetY: number
}

type Props = {
    slides: SlideItem[]
    leftWidthPercent: number

    leftBackground: string
    textColor: string
    overlayColor: string
    overlayOpacity: number

    titleFont: any
    subtitleFont: any

    slideSpeed: number
    autoplay: boolean
    autoplayDelay: number
    pauseOnHover: boolean
    loop: boolean

    arrowStyle: ArrowStyle
    showArrows: boolean
    arrowGap: number

    direction: "row" | "row-reverse" | "column" | "column-reverse"

    style?: React.CSSProperties
}

/**
 * Instructions:
 * Create a modern vertical split slider component with:
 * - Fullscreen split layout (left text / right image), vertical sliding, opposite-direction parallax feel
 * - Smooth looping slider with up/down arrows and keyboard support
 * - Autoplay w/ delay, pause on hover, optional loop
 * - Subtle text animation + background zoom
 * - Clean modern style, responsive (stack vertically on mobile)
 * - Clear property controls for editing slides, speed, autoplay, arrows, and ratio
 */

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function VerticalSplitSlider(props: Props) {
    const {
        slides = [
            {
                title: "Modern layouts",
                subtitle: "Split text and imagery with a smooth vertical slider.",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
            },
            {
                title: "Parallax feel",
                subtitle: "Left content moves opposite to the right side.",
                image: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
            },
            {
                title: "Reusable",
                subtitle: "Edit slides, speed, arrows, and ratio in properties.",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
            },
        ],
        leftWidthPercent = 35,

        leftBackground = "#FFFFFF",
        textColor = "#000000",
        overlayColor = "#000000",
        overlayOpacity = 0.15,

        titleFont,
        subtitleFont,

        slideSpeed = 800,
        autoplay = false,
        autoplayDelay = 3500,
        pauseOnHover = true,
        loop = true,

        arrowStyle,
        showArrows = true,
        arrowGap = 10,

        direction = "column",

        style,
    } = props

    const MOBILE_BREAKPOINT = 840

    const isStatic = useIsStaticRenderer()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const inView = useInView(rootRef, { amount: 0.25 })

    const safeSlides = React.useMemo(() => {
        const s = Array.isArray(slides) ? slides.filter(Boolean) : []
        if (s.length > 0) return s
        return [
            {
                title: "Add slides",
                subtitle: "Use the Slides property to add content.",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
            },
        ] as SlideItem[]
    }, [slides])

    const count = safeSlides.length

    const [index, setIndex] = React.useState(0)
    const [hovered, setHovered] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const [ready, setReady] = React.useState(false)

    const clampedLeft = React.useMemo(() => {
        const v = Number.isFinite(leftWidthPercent) ? leftWidthPercent : 35
        return Math.max(10, Math.min(90, v))
    }, [leftWidthPercent])

    const rightWidthPercent = React.useMemo(() => 100 - clampedLeft, [clampedLeft])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const bp = MOBILE_BREAKPOINT

        const updateFromWidth = (width: number) => {
            React.startTransition(() => setIsMobile(width <= bp))
        }

        // Prefer measuring the component itself (more responsive inside Framer layouts)
        if (typeof ResizeObserver !== "undefined" && rootRef.current) {
            const ro = new ResizeObserver((entries) => {
                const w = entries?.[0]?.contentRect?.width
                if (typeof w === "number") updateFromWidth(w)
            })
            ro.observe(rootRef.current)
            updateFromWidth(rootRef.current.getBoundingClientRect().width)
            return () => ro.disconnect()
        }

        // Fallback to viewport media query
        const mq = window.matchMedia(`(max-width: ${bp}px)`)
        const update = () => updateFromWidth(window.innerWidth)
        update()

        if ("addEventListener" in mq) {
            mq.addEventListener("change", update)
            return () => mq.removeEventListener("change", update)
        } else {
            // @ts-ignore
            mq.addListener(update)
            // @ts-ignore
            return () => mq.removeListener(update)
        }
    }, [])

    React.useEffect(() => {
        if (isStatic) return
        React.startTransition(() => setReady(true))
    }, [isStatic])

    React.useEffect(() => {
        React.startTransition(() => {
            setIndex((prev) => {
                if (count <= 0) return 0
                const next = Math.max(0, Math.min(count - 1, prev))
                return next
            })
        })
    }, [count])

    const canAutoPlay = autoplay && !isStatic && inView && count > 1 && (!pauseOnHover || !hovered)

    const goTo = React.useCallback(
        (nextIndex: number) => {
            React.startTransition(() => {
                setIndex(() => {
                    if (count <= 0) return 0
                    if (loop) {
                        const m = ((nextIndex % count) + count) % count
                        return m
                    }
                    return Math.max(0, Math.min(count - 1, nextIndex))
                })
            })
        },
        [count, loop]
    )

    const next = React.useCallback(() => goTo(index + 1), [goTo, index])
    const prev = React.useCallback(() => goTo(index - 1), [goTo, index])

    React.useEffect(() => {
        if (!canAutoPlay) return
        if (typeof window === "undefined") return

        const delay = Math.max(800, Number.isFinite(autoplayDelay) ? autoplayDelay : 3500)
        const id = window.setInterval(() => {
            next()
        }, delay)

        return () => window.clearInterval(id)
    }, [autoplayDelay, canAutoPlay, next])

    React.useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowUp") {
                e.preventDefault()
                prev()
            } else if (e.key === "ArrowDown") {
                e.preventDefault()
                next()
            }
        }

        window.addEventListener("keydown", onKeyDown, { passive: false })
        return () => window.removeEventListener("keydown", onKeyDown as any)
    }, [isStatic, next, prev])

    const transition = React.useMemo(() => {
        const dur = Math.max(200, Math.min(3000, Number.isFinite(slideSpeed) ? slideSpeed : 800)) / 1000
        return { duration: dur, ease: [0.42, 0, 0.58, 1] as const }
    }, [slideSpeed])

    const axisLayout = React.useMemo(() => {
        return isMobile ? direction : "row"
    }, [direction, isMobile])

    const isColumn = axisLayout === "column" || axisLayout === "column-reverse"

    const leftBasis = React.useMemo(() => {
        if (isColumn) return "45%"
        return `${clampedLeft}%`
    }, [clampedLeft, isColumn])

    const leftPaneHeight = React.useMemo(() => (isColumn ? "45%" : "100%"), [isColumn])
    const rightPaneHeight = React.useMemo(() => (isColumn ? "55%" : "100%"), [isColumn])

    const rightBasis = React.useMemo(() => {
        if (isColumn) return "55%"
        return `${rightWidthPercent}%`
    }, [isColumn, rightWidthPercent])

    const splitPointPercent = React.useMemo(() => {
        if (axisLayout === "row") return clampedLeft
        if (axisLayout === "row-reverse") return 100 - clampedLeft
        if (axisLayout === "column") return 45
        return 55
    }, [axisLayout, clampedLeft])

    const arrow = arrowStyle || {
        size: 44,
        color: "#000000",
        background: "#FFFFFF",
        borderRadius: 999,
        shadow: "0 10px 30px rgba(0,0,0,0.12)",
        borderColor: "rgba(0,0,0,0.10)",
        borderWidth: 1,
        offsetX: 0,
        offsetY: 0,
    }

    const arrowSize = Math.max(28, Math.min(84, Number.isFinite(arrow.size) ? arrow.size : 44))
    const arrowX = arrow.offsetX || 0
    const arrowY = arrow.offsetY || 0

    const arrowDisabledUp = !loop && index <= 0
    const arrowDisabledDown = !loop && index >= count - 1

    const handleEnter = React.useCallback(() => {
        if (!pauseOnHover) return
        React.startTransition(() => setHovered(true))
    }, [pauseOnHover])

    const handleLeave = React.useCallback(() => {
        if (!pauseOnHover) return
        React.startTransition(() => setHovered(false))
    }, [pauseOnHover])

    const rightTranslate = React.useMemo(() => `-${index * 100}%`, [index])
    const leftTranslate = React.useMemo(() => `${index * 100}%`, [index])

    const activeSlide = safeSlides[index] || safeSlides[0]

    return (
        <section
            ref={rootRef}
            aria-roledescription="carousel"
            aria-label="Vertical split slider"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: style?.height ? undefined : "100vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: axisLayout as any,
                background: leftBackground,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div
                style={{
                    position: "relative",
                    flex: `0 0 ${leftBasis}`,
                    width: axisLayout === "column" ? "100%" : undefined,
                    height: axisLayout === "column" ? leftPaneHeight : "100%",
                    background: leftBackground,
                    overflow: "hidden",
                    boxShadow:
                        axisLayout === "column"
                            ? "0 10px 30px rgba(0,0,0,0.06)"
                            : "10px 0 30px rgba(0,0,0,0.06)",
                    zIndex: 1,
                }}
            >
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        willChange: "transform",
                    }}
                    animate={isStatic ? { y: 0 } : { y: leftTranslate }}
                    transition={transition}
                >
                    {safeSlides.map((s, i) => {
                        return (
                            <div
                                key={`left-${i}`}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    flex: "0 0 100%",
                                }}
                            />
                        )
                    })}
                </motion.div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: axisLayout === "column" ? "42px 22px" : "56px 34px",
                        boxSizing: "border-box",
                        pointerEvents: "none",
                    }}
                >
                    <AnimatePresence mode="wait" initial={true}>
                        <motion.div
                            key={`active-text-${index}`}
                            style={{
                                width: "100%",
                                maxWidth: 520,
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                                color: textColor,
                                opacity: isStatic ? 1 : ready ? 1 : 0,
                            }}
                            initial={isStatic ? false : ready ? { opacity: 0, y: 14 } : false}
                            animate={
                                isStatic ? { opacity: 1, y: 0 } : ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }
                            }
                            exit={isStatic ? undefined : { opacity: 0, y: -10 }}
                            transition={transition}
                        >
                            <div style={{ ...titleFont, margin: 0, color: textColor }}>{activeSlide?.title}</div>
                            <div style={{ ...subtitleFont, margin: 0, color: textColor, opacity: 0.8 }}>
                                {activeSlide?.subtitle}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    flex: `1 1 ${rightBasis}`,
                    width: axisLayout === "column" ? "100%" : undefined,
                    height: axisLayout === "column" ? rightPaneHeight : "100%",
                    overflow: "hidden",
                    background: "#F5F5F5",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        willChange: "transform",
                    }}
                    animate={isStatic ? { y: 0 } : { y: rightTranslate }}
                    transition={transition}
                >
                    {safeSlides.map((s, i) => {
                        const img = s.image || {
                            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                            alt: "Gradient 1 - Blue",
                        }
                        const isActive = i === index

                        return (
                            <div
                                key={`right-${i}`}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    flex: "0 0 100%",
                                    overflow: "hidden",
                                }}
                                aria-label={img.alt || s.title || "Slide image"}
                                role="img"
                            >
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: `url(${img.src})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                        transformOrigin: "center",
                                        willChange: "transform",
                                    }}
                                    initial={false}
                                    animate={
                                        isStatic
                                            ? { scale: 1.02 }
                                            : isActive
                                              ? { scale: 1.06 }
                                              : { scale: 1.02 }
                                    }
                                    transition={transition}
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: overlayColor,
                                        opacity: Math.max(0, Math.min(0.7, overlayOpacity)),
                                    }}
                                    aria-hidden="true"
                                />
                            </div>
                        )
                    })}
                </motion.div>

                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                    }}
                    aria-hidden="true"
                />
            </div>

            {showArrows && count > 1 && (
                <div
                    style={{
                        position: "absolute",
                        left: isColumn ? "50%" : `calc(${splitPointPercent}% + ${arrowX}px)`,
                        top: isColumn ? `calc(${splitPointPercent}% + ${arrowY}px)` : `calc(50% + ${arrowY}px)`,
                        transform: "translate(-50%, -50%)",
                        zIndex: 5,
                        display: "flex",
                        flexDirection: "column",
                        gap: Math.max(6, arrowGap),
                        pointerEvents: "auto",
                    }}
                >
                    <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={arrowDisabledUp ? undefined : prev}
                        disabled={arrowDisabledUp}
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: arrow.borderRadius,
                            background: arrow.background,
                            color: arrow.color,
                            borderStyle: "solid",
                            borderColor: arrow.borderColor,
                            borderWidth: Math.max(0, arrow.borderWidth),
                            boxShadow: arrow.shadow,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: arrowDisabledUp ? "not-allowed" : "pointer",
                            opacity: arrowDisabledUp ? 0.5 : 1,
                            padding: 0,
                            outline: "none",
                        }}
                    >
                        <ArrowIcon direction="up" color={arrow.color} />
                    </button>

                    <button
                        type="button"
                        aria-label="Next slide"
                        onClick={arrowDisabledDown ? undefined : next}
                        disabled={arrowDisabledDown}
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            borderRadius: arrow.borderRadius,
                            background: arrow.background,
                            color: arrow.color,
                            borderStyle: "solid",
                            borderColor: arrow.borderColor,
                            borderWidth: Math.max(0, arrow.borderWidth),
                            boxShadow: arrow.shadow,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: arrowDisabledDown ? "not-allowed" : "pointer",
                            opacity: arrowDisabledDown ? 0.5 : 1,
                            padding: 0,
                            outline: "none",
                        }}
                    >
                        <ArrowIcon direction="down" color={arrow.color} />
                    </button>
                </div>
            )}
        </section>
    )
}

function ArrowIcon({ direction, color }: { direction: "up" | "down"; color: string }) {
    const rotate = direction === "up" ? 180 : 0
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${rotate}deg)` }}
            aria-hidden="true"
        >
            <path
                d="M12 16.5a1.2 1.2 0 0 1-.85-.35l-6-6a1.2 1.2 0 1 1 1.7-1.7L12 13.6l5.15-5.15a1.2 1.2 0 1 1 1.7 1.7l-6 6a1.2 1.2 0 0 1-.85.35Z"
                fill={color}
            />
        </svg>
    )
}

addPropertyControls(VerticalSplitSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        maxCount: 12,
        defaultValue: [
            {
                title: "Modern layouts",
                subtitle: "Split text and imagery with a smooth vertical slider.",
                image: "",
            },
            {
                title: "Parallax feel",
                subtitle: "Left content moves opposite to the right side.",
                image: "",
            },
            {
                title: "Reusable",
                subtitle: "Edit slides, speed, arrows, and ratio in properties.",
                image: "",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Slide title" },
                subtitle: {
                    type: ControlType.String,
                    title: "Subtitle",
                    defaultValue: "Small description",
                    displayTextArea: true,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
    },

    leftWidthPercent: {
        type: ControlType.Number,
        title: "Left Width",
        defaultValue: 35,
        min: 10,
        max: 90,
        unit: "%",
        step: 1,
    },

    leftBackground: {
        type: ControlType.Color,
        title: "Left BG",
        defaultValue: "#FFFFFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 0.7,
        step: 0.01,
    },

    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.4em",
            textAlign: "center",
        },
    },

    slideSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 800,
        min: 200,
        max: 3000,
        step: 50,
        unit: "ms",
    },

    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Autoplay Delay",
        defaultValue: 3500,
        min: 800,
        max: 15000,
        step: 100,
        unit: "ms",
        hidden: (p) => !p.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.autoplay,
    },

    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    arrowGap: {
        type: ControlType.Number,
        title: "Arrow Gap",
        defaultValue: 10,
        min: 6,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showArrows,
    },
    arrowStyle: {
        type: ControlType.Object,
        title: "Arrow Style",
        icon: "effect",
        hidden: (p) => !p.showArrows,
        controls: {
            size: { type: ControlType.Number, title: "Size", defaultValue: 44, min: 28, max: 84, step: 1, unit: "px" },
            color: { type: ControlType.Color, title: "Icon", defaultValue: "#000000" },
            background: { type: ControlType.Color, title: "BG", defaultValue: "#FFFFFF" },
            borderRadius: { type: ControlType.Number, title: "Radius", defaultValue: 999, min: 0, max: 999, step: 1 },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#EEEEEE" },
            borderWidth: { type: ControlType.Number, title: "Border W", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0 10px 30px rgba(0,0,0,0.12)" },
            offsetX: { type: ControlType.Number, title: "Offset X", defaultValue: 0, min: -200, max: 200, step: 1, unit: "px" },
            offsetY: { type: ControlType.Number, title: "Offset Y", defaultValue: 0, min: -200, max: 200, step: 1, unit: "px" },
        },
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["column", "column-reverse", "row", "row-reverse"],
        optionTitles: ["Stack", "Stack Reverse", "Side", "Side Reverse"],
        defaultValue: "column",
    },
})