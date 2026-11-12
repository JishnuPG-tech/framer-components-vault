import * as React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- EXACT REPLICA FALLBACK CARD ---
const PremiumCard = ({ type }) => {
    const isHover = type === "hover"

    // Non-hover is white, Hover is the warm yellow
    const bg = isHover ? "#F4DE3B" : "#FFFFFF"
    const borderColor = isHover ? "transparent" : "rgba(0,0,0,0.08)"

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: 320, // Prevents collapsing if set to "Fit Content"
                minHeight: 360,
                backgroundColor: bg,
                borderRadius: 0,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#000000",
                boxSizing: "border-box",
                boxShadow: `inset 0 0 0 1px ${borderColor}`,
                overflow: "hidden",
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    fontSize: 52,
                    fontWeight: 800,
                    lineHeight: 0.95,
                    letterSpacing: "0.01em",
                    textTransform: "uppercase",
                }}
            >
                SCHEDULE DEMO
            </h2>

            <p
                style={{
                    margin: 0,
                    fontFamily:
                        '"Aileron", system-ui, -apple-system, sans-serif',
                    fontSize: 22,
                    fontWeight: 500,
                    lineHeight: 1.15,
                    letterSpacing: "-0.03em",
                }}
            >
                Let's transform your work to incredible workflow. Join our daily
                newsletter for everyday updates.
            </p>
        </div>
    )
}

// --- HELPER: FORCES CONNECTED CARDS TO FILL THE WRAPPER ---
const forceFill = (children) => {
    return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                style: {
                    ...child.props.style,
                    width: "100%",
                    height: "100%",
                },
            })
        }
        return child
    })
}

export default function UltimatePremiumTransitions(props) {
    // Added strict default values to prevent undefined CSS errors
    const {
        defaultState,
        hoverState,
        effect = "staggeredStrips",
        duration = 0.8,
        wipeDirection = "up",
        rippleOrigin = "center",
        parallaxDirection = "up",
        splitAxis = "horizontal",
        sliceDirection = "topLeft",
        morphAxis = "center",
        stripDirection = "up",
        slideDirection = "up",
    } = props

    const isStatic = useIsStaticRenderer()
    const [isHovered, setIsHovered] = useState(false)

    const hasDefault =
        defaultState &&
        (!Array.isArray(defaultState) || defaultState.length > 0)
    const hasHover =
        hoverState && (!Array.isArray(hoverState) || hoverState.length > 0)

    // Apply the forceFill helper to the connected components
    const resolvedDefault = hasDefault ? (
        forceFill(defaultState)
    ) : (
        <PremiumCard type="default" />
    )
    const resolvedHover = hasHover ? (
        forceFill(hoverState)
    ) : (
        <PremiumCard type="hover" />
    )

    // --- STATIC RENDERER FALLBACK ---
    if (isStatic) {
        return (
            <div
                className={props.className}
                style={{ ...containerStyle, ...props.style }}
            >
                <div style={childStyle}>{resolvedDefault}</div>
            </div>
        )
    }

    // --- HIGH-END GSAP EASING CURVES ---
    const easeLiquid = [0.76, 0, 0.24, 1]
    const transitionLiquid = { duration, ease: easeLiquid }

    // --- 1. LINEAR WIPE ---
    const renderLiquidWipe = () => {
        const getClip = (isHoverLayer) => {
            if (wipeDirection === "up")
                return isHoverLayer
                    ? "inset(100% 0% 0% 0%)"
                    : "inset(0% 0% 100% 0%)"
            if (wipeDirection === "down")
                return isHoverLayer
                    ? "inset(0% 0% 100% 0%)"
                    : "inset(100% 0% 0% 0%)"
            if (wipeDirection === "left")
                return isHoverLayer
                    ? "inset(0% 0% 0% 100%)"
                    : "inset(0% 100% 0% 0%)"
            if (wipeDirection === "right")
                return isHoverLayer
                    ? "inset(0% 100% 0% 0%)"
                    : "inset(0% 0% 0% 100%)"
        }
        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: {
                            clipPath: "inset(0% 0% 0% 0%)",
                            pointerEvents: "auto",
                        },
                        hover: {
                            clipPath: getClip(false),
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            clipPath: getClip(true),
                            pointerEvents: "none",
                        },
                        hover: {
                            clipPath: "inset(0% 0% 0% 0%)",
                            pointerEvents: "auto",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
            </>
        )
    }

    // --- 2. RADIAL RIPPLE ---
    const renderRadialRipple = () => {
        const originMap = {
            center: "50% 50%",
            topLeft: "0% 0%",
            topRight: "100% 0%",
            bottomLeft: "0% 100%",
            bottomRight: "100% 100%",
        }
        const origin = originMap[rippleOrigin] || "50% 50%"
        return (
            <>
                <motion.div style={{ ...childStyle, zIndex: 1 }}>
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            clipPath: `circle(0% at ${origin})`,
                            pointerEvents: "none",
                        },
                        hover: {
                            clipPath: `circle(150% at ${origin})`,
                            pointerEvents: "auto",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
            </>
        )
    }

    // --- 3. PARALLAX REVEAL ---
    const renderParallaxReveal = () => {
        const isUp = parallaxDirection === "up"
        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: { y: "0%", scale: 1, pointerEvents: "auto" },
                        hover: {
                            y: isUp ? "-20%" : "20%",
                            scale: 0.95,
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            clipPath: isUp
                                ? "inset(100% 0% 0% 0%)"
                                : "inset(0% 0% 100% 0%)",
                            pointerEvents: "none",
                        },
                        hover: {
                            clipPath: "inset(0% 0% 0% 0%)",
                            pointerEvents: "auto",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    <motion.div
                        style={childStyle}
                        variants={{
                            default: { y: isUp ? "50%" : "-50%" },
                            hover: { y: "0%" },
                        }}
                        transition={transitionLiquid}
                    >
                        {resolvedHover}
                    </motion.div>
                </motion.div>
            </>
        )
    }

    // --- 4. CURTAIN SPLIT ---
    const renderCurtainSplit = () => {
        const isH = splitAxis === "horizontal"
        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: {
                            scale: 0.9,
                            opacity: 0,
                            pointerEvents: "none",
                        },
                        hover: { scale: 1, opacity: 1, pointerEvents: "auto" },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            y: "0%",
                            x: "0%",
                            clipPath: isH
                                ? "inset(0% 0% 49.9% 0%)"
                                : "inset(0% 49.9% 0% 0%)",
                            pointerEvents: "auto",
                        },
                        hover: {
                            y: isH ? "-100%" : "0%",
                            x: !isH ? "-100%" : "0%",
                            clipPath: isH
                                ? "inset(0% 0% 49.9% 0%)"
                                : "inset(0% 49.9% 0% 0%)",
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            y: "0%",
                            x: "0%",
                            clipPath: isH
                                ? "inset(49.9% 0% 0% 0%)"
                                : "inset(0% 0% 0% 49.9%)",
                            pointerEvents: "auto",
                        },
                        hover: {
                            y: isH ? "100%" : "0%",
                            x: !isH ? "100%" : "0%",
                            clipPath: isH
                                ? "inset(49.9% 0% 0% 0%)"
                                : "inset(0% 0% 0% 49.9%)",
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
            </>
        )
    }

    // --- 5. DIAGONAL SLICE ---
    const renderDiagonalSlice = () => {
        const isTL = sliceDirection === "topLeft"
        // Perfect geometric triangles for seamless alignment
        const poly1 = isTL
            ? "polygon(0% 0%, 100% 0%, 100% 100%)"
            : "polygon(0% 0%, 100% 0%, 0% 100%)"
        const poly2 = isTL
            ? "polygon(0% 0%, 100% 100%, 0% 100%)"
            : "polygon(100% 0%, 100% 100%, 0% 100%)"
        const move1 = isTL
            ? { x: "100%", y: "-100%" }
            : { x: "-100%", y: "-100%" }
        const move2 = isTL
            ? { x: "-100%", y: "100%" }
            : { x: "100%", y: "100%" }

        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: { pointerEvents: "none" },
                        hover: { pointerEvents: "auto" },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            x: "0%",
                            y: "0%",
                            clipPath: poly1,
                            pointerEvents: "auto",
                        },
                        hover: {
                            x: move1.x,
                            y: move1.y,
                            clipPath: poly1,
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            x: "0%",
                            y: "0%",
                            clipPath: poly2,
                            pointerEvents: "auto",
                        },
                        hover: {
                            x: move2.x,
                            y: move2.y,
                            clipPath: poly2,
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
            </>
        )
    }

    // --- 6. LIQUID MORPH ---
    const renderLiquidMorph = () => {
        const getInset = () => {
            if (morphAxis === "center")
                return "inset(40% 40% 40% 40% round 100px)"
            if (morphAxis === "horizontal")
                return "inset(40% 10% 40% 10% round 100px)"
            if (morphAxis === "vertical")
                return "inset(10% 40% 10% 40% round 100px)"
        }
        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: {
                            scale: 1,
                            opacity: 1,
                            pointerEvents: "auto",
                        },
                        hover: {
                            scale: 0.9,
                            opacity: 0.5,
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            clipPath: getInset(),
                            opacity: 0,
                            pointerEvents: "none",
                        },
                        hover: {
                            clipPath: "inset(0% 0% 0% 0% round 0px)",
                            opacity: 1,
                            pointerEvents: "auto",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
            </>
        )
    }

    // --- 7. STAGGERED STRIPS ---
    const renderStaggeredStrips = () => {
        const isUp = stripDirection === "up"
        const strips = [
            "inset(0% 75% 0% 0%)",
            "inset(0% 50% 0% 25%)",
            "inset(0% 25% 0% 50%)",
            "inset(0% 0% 0% 75%)",
        ]
        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: { scale: 1, pointerEvents: "auto" },
                        hover: { scale: 0.95, pointerEvents: "none" },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                {strips.map((clip, i) => (
                    <motion.div
                        key={i}
                        style={{ ...childStyle, zIndex: 2 }}
                        variants={{
                            default: {
                                y: isUp ? "100%" : "-100%",
                                clipPath: clip,
                                pointerEvents: "none",
                            },
                            hover: {
                                y: "0%",
                                clipPath: clip,
                                pointerEvents: "auto",
                            },
                        }}
                        transition={{
                            duration,
                            ease: easeLiquid,
                            delay: i * 0.06,
                        }}
                    >
                        {resolvedHover}
                    </motion.div>
                ))}
            </>
        )
    }

    // --- 8. FILMSTRIP SLIDE ---
    const renderFilmstripSlide = () => {
        const isV = slideDirection === "up" || slideDirection === "down"
        const isNeg = slideDirection === "up" || slideDirection === "left"
        const offset = isNeg ? "-100%" : "100%"
        const startOffset = isNeg ? "100%" : "-100%"

        return (
            <>
                <motion.div
                    style={{ ...childStyle, zIndex: 1 }}
                    variants={{
                        default: {
                            x: "0%",
                            y: "0%",
                            scale: 1,
                            opacity: 1,
                            pointerEvents: "auto",
                        },
                        hover: {
                            x: isV ? "0%" : offset,
                            y: isV ? offset : "0%",
                            scale: 0.85,
                            opacity: 0,
                            pointerEvents: "none",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedDefault}
                </motion.div>
                <motion.div
                    style={{ ...childStyle, zIndex: 2 }}
                    variants={{
                        default: {
                            x: isV ? "0%" : startOffset,
                            y: isV ? startOffset : "0%",
                            scale: 0.85,
                            opacity: 0,
                            pointerEvents: "none",
                        },
                        hover: {
                            x: "0%",
                            y: "0%",
                            scale: 1,
                            opacity: 1,
                            pointerEvents: "auto",
                        },
                    }}
                    transition={transitionLiquid}
                >
                    {resolvedHover}
                </motion.div>
            </>
        )
    }

    return (
        <motion.div
            className={props.className}
            style={{ ...containerStyle, ...props.style }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onTapStart={() => setIsHovered(true)}
            onTapCancel={() => setIsHovered(false)}
            onTap={() => setIsHovered(false)}
            initial="default"
            animate={isHovered ? "hover" : "default"}
        >
            {effect === "liquidWipe" && renderLiquidWipe()}
            {effect === "radialRipple" && renderRadialRipple()}
            {effect === "parallaxReveal" && renderParallaxReveal()}
            {effect === "curtain" && renderCurtainSplit()}
            {effect === "diagonal" && renderDiagonalSlice()}
            {effect === "liquidMorph" && renderLiquidMorph()}
            {effect === "staggeredStrips" && renderStaggeredStrips()}
            {effect === "filmstrip" && renderFilmstripSlide()}
        </motion.div>
    )
}

// --- STYLES ---
const containerStyle: React.CSSProperties = {
    display: "grid",
    placeItems: "stretch",
    cursor: "pointer",
    overflow: "hidden",
    width: "100%",
    height: "100%",
}

const childStyle: React.CSSProperties = {
    gridArea: "1 / 1",
    display: "flex",
    justifyContent: "center",
    alignItems: "stretch",
    width: "100%",
    height: "100%",
}

// --- FRAMER PROPERTY CONTROLS ---
addPropertyControls(UltimatePremiumTransitions, {
    defaultState: { type: ControlType.ComponentInstance, title: "Default" },
    hoverState: { type: ControlType.ComponentInstance, title: "Hover" },

    effect: {
        type: ControlType.Enum,
        title: "Animation",
        options: [
            "liquidWipe",
            "radialRipple",
            "parallaxReveal",
            "curtain",
            "diagonal",
            "liquidMorph",
            "staggeredStrips",
            "filmstrip",
        ],
        optionTitles: [
            "Wipe",
            "Ripple",
            "Parallax",
            "Curtain",
            "Diagonal",
            "Morph",
            "Strips",
            "Slide",
        ],
        defaultValue: "staggeredStrips",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 2.0,
        step: 0.1,
        displaySegmentedControl: false,
    },

    // --- DYNAMIC CONTROLS ---
    wipeDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["up", "down", "left", "right"],
        optionTitles: ["Up", "Down", "Left", "Right"],
        defaultValue: "up",
        hidden: (props) => props.effect !== "liquidWipe",
    },
    rippleOrigin: {
        type: ControlType.Enum,
        title: "Origin",
        options: ["center", "topLeft", "topRight", "bottomLeft", "bottomRight"],
        optionTitles: [
            "Center",
            "Top Left",
            "Top Right",
            "Bottom Left",
            "Bottom Right",
        ],
        defaultValue: "center",
        hidden: (props) => props.effect !== "radialRipple",
    },
    parallaxDirection: {
        type: ControlType.Enum,
        title: "Reveal From",
        options: ["up", "down"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "up",
        hidden: (props) => props.effect !== "parallaxReveal",
    },
    splitAxis: {
        type: ControlType.Enum,
        title: "Split Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        hidden: (props) => props.effect !== "curtain",
    },
    sliceDirection: {
        type: ControlType.Enum,
        title: "Slice Angle",
        options: ["topLeft", "topRight"],
        optionTitles: ["Top-Left", "Top-Right"],
        defaultValue: "topLeft",
        hidden: (props) => props.effect !== "diagonal",
    },
    morphAxis: {
        type: ControlType.Enum,
        title: "Morph Shape",
        options: ["center", "horizontal", "vertical"],
        optionTitles: ["Circle", "Horizontal", "Vertical"],
        defaultValue: "center",
        hidden: (props) => props.effect !== "liquidMorph",
    },
    stripDirection: {
        type: ControlType.Enum,
        title: "Slide From",
        options: ["up", "down"],
        optionTitles: ["Bottom", "Top"],
        defaultValue: "up",
        hidden: (props) => props.effect !== "staggeredStrips",
    },
    slideDirection: {
        type: ControlType.Enum,
        title: "Slide To",
        options: ["up", "down", "left", "right"],
        optionTitles: ["Top", "Bottom", "Left", "Right"],
        defaultValue: "up",
        hidden: (props) => props.effect !== "filmstrip",
    },
})
