import { useRef, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */
export default function Coin3D(props) {
    const {
        headsImage,
        tailsImage,
        animationDuration,
        topEdgeColor,
        bottomEdgeColor,
        headsBackgroundColor,
        tailsBackgroundColor,
        headsBackgroundImage,
        tailsBackgroundImage,
        headsBackgroundImageSize,
        tailsBackgroundImageSize,
        headsImageScale,
        tailsImageScale,
        animationDirection,
        spinEnabled,
        showShadow,
        shadowStrength,
        shadowDistance,
        coinRadius,
        floatEnabled,
        floatHeight,
        floatSpeed,
        style,
    } = props

    // ── Responsive sizing ──────────────────────────────
    // With fixed layout Framer passes explicit px values in style.width / style.height
    const containerRef = useRef(null)
    const [measuredSize, setMeasuredSize] = useState({
        width: 200,
        height: 200,
    })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setMeasuredSize({ width, height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const styleWidth = typeof style?.width === "number" ? style.width : null
    const styleHeight = typeof style?.height === "number" ? style.height : null
    const w = styleWidth || measuredSize.width
    const h = styleHeight || measuredSize.height
    const coinSize = Math.min(w, h)

    // ── Spin axis ──────────────────────────────────────
    const isVertical =
        animationDirection === "topToBottom" ||
        animationDirection === "bottomToTop"

    const getRotation = () => {
        switch (animationDirection) {
            case "leftToRight":
                return { initial: { rotateY: 90 }, animate: { rotateY: 450 } }
            case "rightToLeft":
                return { initial: { rotateY: 90 }, animate: { rotateY: -270 } }
            case "topToBottom":
                return { initial: { rotateX: 90 }, animate: { rotateX: 450 } }
            case "bottomToTop":
                return { initial: { rotateX: 90 }, animate: { rotateX: -270 } }
            default:
                return { initial: { rotateY: 90 }, animate: { rotateY: 450 } }
        }
    }

    const rotation = getRotation()

    // ── Background helpers ─────────────────────────────
    const buildSideBackground = (bgColor, bgImage, bgImageSize) => {
        if (bgImage?.src) {
            return {
                backgroundColor: bgColor,
                backgroundImage: `url(${bgImage.src})`,
                backgroundSize: bgImageSize || "cover",
                backgroundPosition: `${bgImage.positionX || "center"} ${bgImage.positionY || "center"}`,
                backgroundRepeat: "no-repeat",
            }
        }
        return { background: bgColor }
    }

    const headsBg = buildSideBackground(
        headsBackgroundColor,
        headsBackgroundImage,
        headsBackgroundImageSize
    )
    const tailsBg = buildSideBackground(
        tailsBackgroundColor,
        tailsBackgroundImage,
        tailsBackgroundImageSize
    )

    // ── Geometry (axis-aware) ──────────────────────────
    const stripStyle = isVertical
        ? { width: "1em", height: "0.1em" }
        : { width: "0.1em", height: "1em" }

    const edgeGradient = isVertical
        ? `linear-gradient(to right, ${topEdgeColor}, ${bottomEdgeColor})`
        : `linear-gradient(${topEdgeColor}, ${bottomEdgeColor})`

    const headsFaceStyle = isVertical
        ? { bottom: "-0.4em", transform: "rotateX(90deg)" }
        : { right: "-0.4em", transform: "rotateY(-90deg)" }

    const tailsFaceStyle = isVertical
        ? { top: "-0.4em", transform: "rotateX(-90deg)" }
        : { left: "-0.4em", transform: "rotateY(90deg)" }

    const edgeBeforeStyle = isVertical
        ? { bottom: "-0.4em", transform: "rotateX(-90deg)" }
        : { right: "-0.4em", transform: "rotateY(90deg)" }

    const edgeAfterStyle = isVertical
        ? { top: "-0.4em", transform: "rotateX(90deg)" }
        : { left: "-0.4em", transform: "rotateY(-90deg)" }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                perspective: `${coinSize * 5}px`,
                position: "relative",
                width: "100%",
                height: "100%",
            }}
        >
            {/* Float wrapper — independent of spin, no prop conflicts */}
            <motion.div
                animate={floatEnabled ? { y: [0, -floatHeight, 0] } : { y: 0 }}
                transition={{
                    duration: floatSpeed,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.5, 1],
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <motion.div
                    initial={rotation.initial}
                    animate={spinEnabled ? rotation.animate : rotation.initial}
                    transition={{
                        duration: animationDuration,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{
                        fontSize: `${coinSize}px`,
                        ...stripStyle,
                        background: edgeGradient,
                        position: "relative",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* Heads Side */}
                    <div
                        style={{
                            position: "absolute",
                            width: "1em",
                            height: "1em",
                            overflow: "hidden",
                            borderRadius: `${coinRadius}%`,
                            textAlign: "center",
                            lineHeight: 1,
                            backfaceVisibility: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            ...headsFaceStyle,
                            ...headsBg,
                        }}
                    >
                        {headsImage ? (
                            <img
                                src={headsImage.src}
                                srcSet={headsImage.srcSet}
                                alt={headsImage.alt || "Coin heads"}
                                style={{
                                    width: `${headsImageScale}%`,
                                    height: `${headsImageScale}%`,
                                    objectFit: "contain",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.2em",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                H
                            </div>
                        )}
                    </div>

                    {/* Tails Side */}
                    <div
                        style={{
                            position: "absolute",
                            width: "1em",
                            height: "1em",
                            overflow: "hidden",
                            borderRadius: `${coinRadius}%`,
                            textAlign: "center",
                            lineHeight: 1,
                            backfaceVisibility: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            ...tailsFaceStyle,
                            ...tailsBg,
                        }}
                    >
                        {tailsImage ? (
                            <img
                                src={tailsImage.src}
                                srcSet={tailsImage.srcSet}
                                alt={tailsImage.alt || "Coin tails"}
                                style={{
                                    width: `${tailsImageScale}%`,
                                    height: `${tailsImageScale}%`,
                                    objectFit: "contain",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.2em",
                                    color: "#fff",
                                    fontWeight: "bold",
                                    position: "relative",
                                    zIndex: 1,
                                }}
                            >
                                T
                            </div>
                        )}
                    </div>

                    {/* Coin Edge - Before */}
                    <div
                        style={{
                            position: "absolute",
                            width: "1em",
                            height: "1em",
                            borderRadius: `${coinRadius}%`,
                            background: edgeGradient,
                            backfaceVisibility: "hidden",
                            ...edgeBeforeStyle,
                        }}
                    />

                    {/* Coin Edge - After */}
                    <div
                        style={{
                            position: "absolute",
                            width: "1em",
                            height: "1em",
                            borderRadius: `${coinRadius}%`,
                            background: edgeGradient,
                            backfaceVisibility: "hidden",
                            ...edgeAfterStyle,
                        }}
                    />
                </motion.div>
            </motion.div>

            {/* Shadow */}
            {showShadow && shadowStrength > 0 && (
                <motion.div
                    animate={
                        floatEnabled
                            ? {
                                  scaleX: [1, 0.7, 1],
                                  opacity: [
                                      shadowStrength / 100,
                                      (shadowStrength / 100) * 0.3,
                                      shadowStrength / 100,
                                  ],
                              }
                            : { scaleX: 1, opacity: shadowStrength / 100 }
                    }
                    transition={{
                        duration: floatSpeed,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                    }}
                    style={{
                        position: "absolute",
                        top: `calc(50% + ${coinSize / 2}px + ${shadowDistance}px)`,
                        left: "50%",
                        translateX: "-50%",
                        width: `${coinSize * 0.8}px`,
                        height: `${coinSize * 0.15}px`,
                        background: `radial-gradient(ellipse, rgba(0, 0, 0, ${shadowStrength / 100}), transparent)`,
                        borderRadius: "50%",
                        filter: `blur(${shadowStrength * 0.2}px)`,
                        zIndex: -1,
                        transformOrigin: "center center",
                    }}
                />
            )}
        </div>
    )
}

Coin3D.defaultProps = {
    animationDuration: 7,
    topEdgeColor: "#faa504",
    bottomEdgeColor: "#141001",
    headsBackgroundColor: "#faa504",
    tailsBackgroundColor: "#faa504",
    headsImageScale: 100,
    tailsImageScale: 100,
    headsBackgroundImageSize: "cover",
    tailsBackgroundImageSize: "cover",
    animationDirection: "leftToRight",
    spinEnabled: true,
    showShadow: true,
    shadowStrength: 30,
    shadowDistance: 50,
    coinRadius: 50,
    floatEnabled: true,
    floatHeight: 15,
    floatSpeed: 2,
}

addPropertyControls(Coin3D, {
    // ── HEADS ──────────────────────────────────────────
    headsImage: {
        type: ControlType.ResponsiveImage,
        title: "Heads Image",
    },
    headsImageScale: {
        type: ControlType.Number,
        title: "Heads Scale",
        min: 20,
        max: 200,
        step: 5,
        defaultValue: 100,
        unit: "%",
        hidden: (props) => !props.headsImage,
    },
    headsBackgroundColor: {
        type: ControlType.Color,
        title: "Heads BG Color",
        defaultValue: "#faa504",
    },
    headsBackgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Heads BG Image",
    },
    headsBackgroundImageSize: {
        type: ControlType.Enum,
        title: "Heads BG Fit",
        options: ["cover", "contain", "fill", "auto"],
        optionTitles: ["Cover", "Contain", "Fill", "Auto"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        hidden: (props) => !props.headsBackgroundImage,
    },

    // ── TAILS ──────────────────────────────────────────
    tailsImage: {
        type: ControlType.ResponsiveImage,
        title: "Tails Image",
    },
    tailsImageScale: {
        type: ControlType.Number,
        title: "Tails Scale",
        min: 20,
        max: 200,
        step: 5,
        defaultValue: 100,
        unit: "%",
        hidden: (props) => !props.tailsImage,
    },
    tailsBackgroundColor: {
        type: ControlType.Color,
        title: "Tails BG Color",
        defaultValue: "#faa504",
    },
    tailsBackgroundImage: {
        type: ControlType.ResponsiveImage,
        title: "Tails BG Image",
    },
    tailsBackgroundImageSize: {
        type: ControlType.Enum,
        title: "Tails BG Fit",
        options: ["cover", "contain", "fill", "auto"],
        optionTitles: ["Cover", "Contain", "Fill", "Auto"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        hidden: (props) => !props.tailsBackgroundImage,
    },

    // ── COIN SHAPE ─────────────────────────────────────
    coinRadius: {
        type: ControlType.Number,
        title: "Coin Radius",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 50,
        unit: "%",
    },

    // ── FLOAT ──────────────────────────────────────────
    floatEnabled: {
        type: ControlType.Boolean,
        title: "Float",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    floatHeight: {
        type: ControlType.Number,
        title: "Float Height",
        min: 2,
        max: 80,
        step: 1,
        defaultValue: 15,
        unit: "px",
        hidden: (props) => !props.floatEnabled,
    },
    floatSpeed: {
        type: ControlType.Number,
        title: "Float Speed",
        min: 0.3,
        max: 8,
        step: 0.1,
        defaultValue: 2,
        unit: "s",
        hidden: (props) => !props.floatEnabled,
    },

    // ── SPIN ───────────────────────────────────────────
    spinEnabled: {
        type: ControlType.Boolean,
        title: "Spin",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Spin Duration",
        min: 1,
        max: 20,
        step: 0.5,
        defaultValue: 7,
        unit: "s",
        hidden: (props) => !props.spinEnabled,
    },
    animationDirection: {
        type: ControlType.Enum,
        title: "Spin Direction",
        options: ["leftToRight", "rightToLeft", "topToBottom", "bottomToTop"],
        optionTitles: ["→", "←", "↑", "↓"],
        defaultValue: "leftToRight",
        displaySegmentedControl: true,
        hidden: (props) => !props.spinEnabled,
    },

    // ── SHADOW ─────────────────────────────────────────
    showShadow: {
        type: ControlType.Boolean,
        title: "Show Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow Strength",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 30,
        unit: "%",
        hidden: (props) => !props.showShadow,
    },
    shadowDistance: {
        type: ControlType.Number,
        title: "Shadow Distance",
        min: 0,
        max: 200,
        step: 5,
        defaultValue: 50,
        unit: "px",
        hidden: (props) => !props.showShadow,
    },

    // ── EDGE ───────────────────────────────────────────
    topEdgeColor: {
        type: ControlType.Color,
        title: "Top Edge Color",
        defaultValue: "#faa504",
    },
    bottomEdgeColor: {
        type: ControlType.Color,
        title: "Bottom Edge Color",
        defaultValue: "#141001",
    },
    bottomEdgeColor: {
        type: ControlType.Color,
        title: "Bottom Edge Color",
        defaultValue: "#141001",
        description:
            "Follow [Rayan Yasser](https://x.com/rayanyasserouan) for more components",
    },
})
