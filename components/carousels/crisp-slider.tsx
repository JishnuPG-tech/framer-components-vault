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

import { motion, AnimatePresence } from "framer-motion"

// --- CONSTANTS ---

// 1. MATCHING TRANSITION STYLES
const SLIDE_TRANSITION = {
    duration: 1.5,
    ease: [0.625, 0.05, 0, 1],
}

const DOT_TRANSITION = {
    duration: 0.6,
    ease: [0.625, 0.05, 0, 1],
}

const VARIANTS = {
    enter: (direction) => {
        const { isHorizontal, dir } = direction
        return {
            x: isHorizontal ? (dir > 0 ? "100%" : "-100%") : "0%",
            y: isHorizontal ? "0%" : dir > 0 ? "100%" : "-100%",
            zIndex: 1,
            willChange: "transform",
        }
    },
    center: {
        x: "0%",
        y: "0%",
        zIndex: 1,
        willChange: "transform",
    },
    exit: (direction) => {
        const { isHorizontal, dir } = direction
        return {
            x: isHorizontal ? (dir < 0 ? "100%" : "-100%") : "0%",
            y: isHorizontal ? "0%" : dir < 0 ? "100%" : "-100%",
            zIndex: 0,
            willChange: "transform",
        }
    },
}

const INNER_VARIANTS = {
    enter: (direction) => {
        const { isHorizontal, dir } = direction
        return {
            x: isHorizontal ? (dir > 0 ? "-25%" : "25%") : "0%",
            y: isHorizontal ? "0%" : dir > 0 ? "-25%" : "25%",
        }
    },
    center: { x: "0%", y: "0%" },
    exit: (direction) => {
        const { isHorizontal, dir } = direction
        return {
            x: isHorizontal ? (dir < 0 ? "-25%" : "25%") : "0%",
            y: isHorizontal ? "0%" : dir < 0 ? "-25%" : "25%",
        }
    },
}

// --- COMPONENT START ---

/**
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function CrispSlider(props) {
    const slides = props.slides || []
    const count = slides.length

    const [[page, direction], setPage] = React.useState([0, 0])
    const index = ((page % count) + count) % count

    const containerRef = React.useRef(null)
    const isAnimating = React.useRef(false)
    const timerRef = React.useRef(null)
    const [isHovering, setIsHovering] = React.useState(false)

    // True on the Framer canvas and during export/thumbnails:
    // render a still frame with no animations, timers or listeners
    const isStatic = useIsStaticRenderer()

    const shouldLoop = props.autoplay ? true : props.loopContent
    const isHorizontal = props.transitionDirection === "Horizontal"

    const customVariantProps = { isHorizontal, dir: direction }

    const transitionSettings = {
        ...SLIDE_TRANSITION,
        duration: props.duration ?? SLIDE_TRANSITION.duration,
    }

    React.useEffect(() => {
        if (isStatic) return
        if (containerRef.current)
            containerRef.current.focus({ preventScroll: true })
    }, [isStatic])

    const paginate = React.useCallback(
        (newDirection) => {
            if (isAnimating.current || count === 0) return
            const currentInd = ((page % count) + count) % count

            if (!shouldLoop) {
                if (newDirection > 0 && currentInd === count - 1) return
                if (newDirection < 0 && currentInd === 0) return
            }

            isAnimating.current = true
            setPage([page + newDirection, newDirection])
        },
        [page, count, shouldLoop]
    )

    const jumpTo = (targetIndex) => {
        if (isAnimating.current || targetIndex === index) return
        isAnimating.current = true
        const jumpDirection = targetIndex > index ? 1 : -1
        const diff = targetIndex - index
        setPage([page + diff, jumpDirection])
    }

    // --- AUTOPLAY ---
    React.useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current)
        if (isStatic) return

        if (props.autoplay && !isHovering && count > 1) {
            timerRef.current = setInterval(() => {
                paginate(1)
            }, props.autoplayDelay * 1000)
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [
        props.autoplay,
        props.autoplayDelay,
        isHovering,
        paginate,
        count,
        isStatic,
    ])

    // --- KEYBOARD ---
    React.useEffect(() => {
        if (isStatic) return
        const handleKeyDown = (e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault()
                paginate(1)
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault()
                paginate(-1)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [paginate, isStatic])

    // --- HELPER: WRAPPER STYLE ---
    const getWrapperStyle = () => {
        // Distance of the nav from the slider edge it's pinned to
        const offset = props.navOffset ?? 32

        const wrapperStyle = {
            position: "absolute",
            zIndex: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
        }

        if (props.progressPosition === "Bottom") {
            wrapperStyle.bottom = offset
            wrapperStyle.left = 0
            wrapperStyle.width = "100%"
        } else if (props.progressPosition === "Top") {
            wrapperStyle.top = offset
            wrapperStyle.left = 0
            wrapperStyle.width = "100%"
        } else if (props.progressPosition === "Left") {
            wrapperStyle.left = offset
            wrapperStyle.top = 0
            wrapperStyle.height = "100%"
        } else if (props.progressPosition === "Right") {
            wrapperStyle.right = offset
            wrapperStyle.top = 0
            wrapperStyle.height = "100%"
        }
        return wrapperStyle
    }

    // --- RENDERERS ---

    const renderThumbnails = () => {
        const isVerticalNav =
            props.progressPosition === "Left" ||
            props.progressPosition === "Right"

        // Plain element in static renderers, animated one otherwise
        const Thumb = isStatic ? "div" : motion.div

        return (
            <div style={getWrapperStyle()}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: isVerticalNav ? "column" : "row",
                        gap: 12,
                        pointerEvents: "auto",
                    }}
                >
                    {slides.map((SlideComponent, i) => {
                        const isActive = i === index
                        const activeStyle = {
                            borderColor: isActive
                                ? "rgba(255, 255, 255, 1)"
                                : "rgba(255, 255, 255, 0)",
                            borderWidth: isActive ? "1px" : "0px",
                            padding: isActive ? "4px" : "0px",
                        }
                        const motionProps = isStatic
                            ? {}
                            : {
                                  initial: false,
                                  animate: activeStyle,
                                  whileHover: {
                                      borderColor: "rgba(255, 255, 255, 1)",
                                      borderWidth: "1px",
                                      padding: "4px",
                                  },
                                  whileTap: { scale: 0.95 },
                                  transition: {
                                      duration: 0.4,
                                      ease: "easeInOut",
                                  },
                              }
                        return (
                            <Thumb
                                key={i}
                                onClick={isStatic ? undefined : () => jumpTo(i)}
                                {...motionProps}
                                style={{
                                    width: 60,
                                    height: 40,
                                    borderRadius: 6,
                                    overflow: "hidden",
                                    position: "relative",
                                    cursor: "pointer",
                                    backgroundColor: "transparent",
                                    borderStyle: "solid",
                                    boxSizing: "border-box",
                                    flexShrink: 0,
                                    ...activeStyle,
                                }}
                            >
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        position: "relative",
                                        borderRadius: 2,
                                        overflow: "hidden",
                                    }}
                                >
                                    {SlideComponent && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                width: "300%",
                                                height: "300%",
                                                transform:
                                                    "translate(-50%, -50%)",
                                                pointerEvents: "none",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {React.cloneElement(
                                                SlideComponent,
                                                {
                                                    style: {
                                                        ...SlideComponent.props
                                                            .style,
                                                        width: "100%",
                                                        height: "100%",
                                                    },
                                                }
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Thumb>
                        )
                    })}
                </div>
            </div>
        )
    }

    const renderDots = () => {
        const isVerticalNav =
            props.progressPosition === "Left" ||
            props.progressPosition === "Right"

        const { dotSize, activeDotWidth, dotColor, dotGap } = props

        // Plain elements in static renderers, animated ones otherwise
        const Row = isStatic ? "div" : motion.div
        const Dot = isStatic ? "div" : motion.div

        return (
            <div style={getWrapperStyle()}>
                <Row
                    // Applying the transition to the layout prop of the PARENT
                    // ensures the container resizes in sync with the dots.
                    {...(isStatic
                        ? {}
                        : { layout: true, transition: DOT_TRANSITION })}
                    style={{
                        display: "flex",
                        flexDirection: isVerticalNav ? "column" : "row",
                        gap: dotGap,
                        pointerEvents: "auto",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                    }}
                >
                    {slides.map((_, i) => {
                        const isActive = i === index
                        const dotStyle = {
                            width: isVerticalNav
                                ? dotSize
                                : isActive
                                  ? activeDotWidth
                                  : dotSize,
                            height: isVerticalNav
                                ? isActive
                                    ? activeDotWidth
                                    : dotSize
                                : dotSize,
                            opacity: isActive ? 1 : 0.3,
                            backgroundColor: dotColor,
                        }
                        return (
                            <Dot
                                key={i}
                                onClick={isStatic ? undefined : () => jumpTo(i)}
                                {...(isStatic
                                    ? {}
                                    : {
                                          layout: true,
                                          initial: false,
                                          animate: dotStyle,
                                          // Applying the transition explicitly to the child
                                          // ensures the width change matches the parent's layout change.
                                          transition: DOT_TRANSITION,
                                      })}
                                style={{
                                    borderRadius: 999,
                                    cursor: "pointer",
                                    ...dotStyle,
                                }}
                            />
                        )
                    })}
                </Row>
            </div>
        )
    }

    if (count === 0)
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                }}
            />
        )

    const ActiveSlideComponent = slides[index]

    // --- STATIC RENDER (Canvas / Export) ---
    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {ActiveSlideComponent && (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                        }}
                    >
                        {React.cloneElement(ActiveSlideComponent, {
                            style: {
                                ...ActiveSlideComponent.props.style,
                                width: "100%",
                                height: "100%",
                            },
                        })}
                    </div>
                )}
                {props.navType === "Dots" ? renderDots() : renderThumbnails()}
            </div>
        )
    }

    return (
        <motion.div
            ref={containerRef}
            tabIndex={0}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden",
                position: "relative",
                outline: "none",
                cursor: "default",
            }}
        >
            <AnimatePresence
                initial={false}
                custom={customVariantProps}
                onExitComplete={() => {
                    isAnimating.current = false
                }}
            >
                <motion.div
                    key={page}
                    custom={customVariantProps}
                    variants={VARIANTS}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={transitionSettings}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        background: "transparent",
                    }}
                >
                    <motion.div
                        custom={customVariantProps}
                        variants={INNER_VARIANTS}
                        transition={transitionSettings}
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "relative",
                        }}
                    >
                        {ActiveSlideComponent && (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    margin: 0,
                                    padding: 0,
                                    display: "flex",
                                }}
                            >
                                {React.cloneElement(ActiveSlideComponent, {
                                    style: {
                                        ...ActiveSlideComponent.props.style,
                                        width: "100%",
                                        height: "100%",
                                    },
                                })}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            </AnimatePresence>
            {props.navType === "Dots" ? renderDots() : renderThumbnails()}
        </motion.div>
    )
}

addPropertyControls(CrispSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: { type: ControlType.ComponentInstance },
    },
    navType: {
        type: ControlType.Enum,
        title: "Nav Style",
        options: ["Thumbnails", "Dots"],
        defaultValue: "Thumbnails",
        displaySegmentedControl: true,
    },
    transitionDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["Vertical", "Horizontal"],
        defaultValue: "Vertical",
        displaySegmentedControl: true,
    },
    progressPosition: {
        type: ControlType.Enum,
        title: "Nav Position",
        options: ["Bottom", "Top", "Left", "Right"],
        defaultValue: "Bottom",
    },
    navOffset: {
        type: ControlType.Number,
        title: "Nav Offset",
        defaultValue: 32,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        displayStepper: true,
    },
    // --- DOT SPECIFIC CONTROLS ---
    dotColor: {
        type: ControlType.Color,
        title: "Dot Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.navType !== "Dots",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 2,
        max: 50,
        step: 1,
        hidden: (props) => props.navType !== "Dots",
    },
    activeDotWidth: {
        type: ControlType.Number,
        title: "Active Width",
        defaultValue: 24,
        min: 5,
        max: 100,
        step: 1,
        hidden: (props) => props.navType !== "Dots",
    },
    dotGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 50,
        hidden: (props) => props.navType !== "Dots",
    },
    // --- GENERAL CONTROLS ---
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    autoplayDelay: {
        type: ControlType.Number,
        title: "Delay (s)",
        defaultValue: 3,
        min: 1,
        max: 20,
        step: 0.5,
        hidden: (props) => !props.autoplay,
    },
    loopContent: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        hidden: (props) => props.autoplay,
    },
    duration: {
        type: ControlType.Number,
        title: "Speed (s)",
        defaultValue: 1.5,
        min: 0.5,
        max: 4,
        step: 0.1,
    },
})
