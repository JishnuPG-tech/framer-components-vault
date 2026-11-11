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


/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 600
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

export default function SplitImageCompare(props) {
    const {
        beforeImage,
        afterImage,
        direction,
        initial,
        divider,
        handleType,
        handleSlot,
        border,
        interactionType,
    } = props

    const containerRef = useRef(null)
    const isStatic = useIsStaticRenderer()

    const initialRatio = Math.max(0, Math.min(100, initial)) / 100

    const [position, setPosition] = useState(isStatic ? initialRatio : 0.5)
    const [dragging, setDragging] = useState(false)
    const [hasAnimated, setHasAnimated] = useState(false)

    const isHorizontal = direction === "horizontal"

    const updatePosition = (clientX, clientY) => {
        const rect = containerRef.current.getBoundingClientRect()

        let newPos = isHorizontal
            ? (clientX - rect.left) / rect.width
            : (clientY - rect.top) / rect.height

        setPosition(Math.max(0, Math.min(1, newPos)))
    }

    const handleMove = (e) => {
        if (interactionType === "drag" && !dragging) return
        if (isStatic) return

        if (e.touches) {
            updatePosition(e.touches[0].clientX, e.touches[0].clientY)
        } else {
            updatePosition(e.clientX, e.clientY)
        }
    }

    // Reset animation
    useEffect(() => {
        if (isStatic) {
            setPosition(initialRatio)
            return
        }

        setHasAnimated(false)
        setPosition(0.5)
    }, [initial, isStatic])

    // Animate on view
    useEffect(() => {
        if (isStatic) return
        if (!containerRef.current || hasAnimated) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !dragging) {
                    requestAnimationFrame(() => {
                        setPosition(initialRatio)
                    })
                    setHasAnimated(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.3 }
        )

        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [initialRatio, hasAnimated, dragging, isStatic])

    const dividerWidth = divider?.width ?? 2
    const dividerColor = divider?.color ?? "#fff"

    const borderRadius = border?.radius ?? 0
    const borderWidth = border?.width ?? 0
    const borderColor = border?.color ?? "#000"

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor:
                    interactionType === "hover"
                        ? "default"
                        : isHorizontal
                          ? "ew-resize"
                          : "ns-resize",
                userSelect: "none",
                borderRadius: borderRadius,
            }}
            onMouseDown={(e) => {
                if (interactionType !== "drag") return
                e.preventDefault()
                setDragging(true)
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onMouseMove={(e) => {
                if (interactionType === "hover") {
                    if (!isStatic) {
                        updatePosition(e.clientX, e.clientY)
                    }
                } else {
                    handleMove(e)
                }
            }}
            onTouchStart={(e) => {
                if (interactionType !== "drag") return
                setDragging(true)
            }}
            onTouchEnd={() => setDragging(false)}
            onTouchMove={handleMove}
        >
            {/* AFTER */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    background: "#e5e5e5",
                }}
            >
                {afterImage && (
                    <img
                        src={afterImage}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>

            {/* BEFORE */}
            <div
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    background: "#d4d4d4",
                    overflow: "hidden",
                    clipPath: isHorizontal
                        ? `inset(0 ${100 - position * 100}% 0 0)`
                        : `inset(0 0 ${100 - position * 100}% 0)`,
                    transition:
                        isStatic || interactionType === "hover"
                            ? "none"
                            : dragging
                              ? "none"
                              : "clip-path 0.4s ease",
                }}
            >
                {beforeImage && (
                    <img
                        src={beforeImage}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>

            {/* DIVIDER */}
            <div
                style={{
                    position: "absolute",
                    background: dividerColor,
                    zIndex: 2,
                    pointerEvents: "none",
                    transition:
                        isStatic || interactionType === "hover"
                            ? "none"
                            : dragging
                              ? "none"
                              : isHorizontal
                                ? "left 0.4s ease"
                                : "top 0.4s ease",
                    ...(isHorizontal
                        ? {
                              left: `${position * 100}%`,
                              top: 0,
                              width: `${dividerWidth}px`,
                              height: "100%",
                              transform: `translateX(-${dividerWidth / 2}px)`,
                          }
                        : {
                              top: `${position * 100}%`,
                              left: 0,
                              height: `${dividerWidth}px`,
                              width: "100%",
                              transform: `translateY(-${dividerWidth / 2}px)`,
                          }),
                }}
            />

            {/* HANDLE */}
            {handleType !== "none" && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 3,
                        pointerEvents: "none",
                        transition:
                            isStatic || interactionType === "hover"
                                ? "none"
                                : dragging
                                  ? "none"
                                  : isHorizontal
                                    ? "left 0.4s ease"
                                    : "top 0.4s ease",
                        ...(isHorizontal
                            ? {
                                  left: `${position * 100}%`,
                                  top: "50%",
                                  transform: "translate(-50%, -50%)",
                              }
                            : {
                                  top: `${position * 100}%`,
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                              }),
                    }}
                >
                    {handleType === "custom" && handleSlot}

                    {handleType === "default" && (
                        <div
                            style={{
                                width: isHorizontal ? 20 : 36,
                                height: isHorizontal ? 36 : 20,
                                borderRadius: 8,
                                border: "1px solid rgba(0,0,0,0.2)",
                                background: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: isHorizontal
                                        ? "column"
                                        : "row",
                                    gap: 4,
                                }}
                            >
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: 3,
                                            height: 3,
                                            borderRadius: "50%",
                                            background: "#000",
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* BORDER */}
            {borderWidth > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: borderRadius,
                        boxSizing: "border-box",
                        border: `${borderWidth}px solid ${borderColor}`,
                        pointerEvents: "none",
                        zIndex: 4,
                    }}
                />
            )}
        </div>
    )
}

SplitImageCompare.defaultProps = {
    beforeImage: "",
    afterImage: "",
    direction: "horizontal",
    initial: 50,
    handleType: "default",
    handleSlot: null,
    interactionType: "drag",
    divider: {
        width: 2,
        color: "#ffffff",
    },
    border: {
        radius: 0,
        width: 0,
        color: "#000000",
    },
}

addPropertyControls(SplitImageCompare, {
    beforeImage: { type: ControlType.Image, title: "Before" },
    afterImage: { type: ControlType.Image, title: "After" },

    direction: {
        type: ControlType.SegmentedEnum,
        title: "Direction",
        options: ["horizontal", "vertical"],
    },

    interactionType: {
        type: ControlType.SegmentedEnum,
        title: "Interaction",
        options: ["drag", "hover"],
    },

    initial: {
        type: ControlType.Number,
        title: "Start %",
        min: 0,
        max: 100,
        step: 1,
    },

    handleType: {
        type: ControlType.SegmentedEnum,
        title: "Handle Type",
        options: ["none", "default", "custom"],
    },

    handleSlot: {
        type: ControlType.ComponentInstance,
        title: "Custom Handle",
        hidden: (props) => props.handleType !== "custom",
    },

    divider: {
        type: ControlType.Object,
        title: "Divider",
        controls: {
            width: { type: ControlType.Number, min: 1, max: 20 },
            color: { type: ControlType.Color },
        },
    },

    border: {
        type: ControlType.Object,
        title: "Border & Radius",
        controls: {
            radius: { type: ControlType.Number, min: 0, max: 100 },
            width: { type: ControlType.Number, min: 0, max: 20 },
            color: { type: ControlType.Color },
        },
    },
})
