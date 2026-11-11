import React, { useState, useRef, useCallback, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function BeforeAfterSlider(props) {
    const {
        imageBefore,
        imageAfter,
        labelBefore,
        labelAfter,
        labelBeforeColor,
        labelAfterColor,
        font,
        direction,
    } = props

    const [sliderPos, setSliderPos] = useState(50)
    const containerRef = useRef(null)
    const isDragging = useRef(false)
    const isHorizontal = direction === "horizontal"

    // Refs for direct DOM manipulation (avoids re-render flicker)
    const beforeImgRef = useRef(null)
    const lineRef = useRef(null)
    const labelBeforeRef = useRef(null)
    const labelAfterRef = useRef(null)

    const applyPosition = useCallback(
        (pos) => {
            const clamped = Math.min(100, Math.max(0, pos))

            if (beforeImgRef.current) {
                beforeImgRef.current.style.clipPath = isHorizontal
                    ? `inset(0% ${100 - clamped}% 0% 0%)`
                    : `inset(0% 0% ${100 - clamped}% 0%)`
            }

            if (lineRef.current) {
                if (isHorizontal) {
                    lineRef.current.style.left = `${clamped}%`
                } else {
                    lineRef.current.style.top = `${clamped}%`
                }
            }

            if (labelBeforeRef.current) {
                labelBeforeRef.current.style.opacity = clamped < 15 ? "0" : "1"
            }
            if (labelAfterRef.current) {
                labelAfterRef.current.style.opacity = clamped > 85 ? "0" : "1"
            }
        },
        [isHorizontal]
    )

    const getPosFromEvent = useCallback(
        (e) => {
            const rect = containerRef.current.getBoundingClientRect()
            const clientX = e.touches ? e.touches[0].clientX : e.clientX
            const clientY = e.touches ? e.touches[0].clientY : e.clientY

            if (isHorizontal) {
                return ((clientX - rect.left) / rect.width) * 100
            } else {
                return ((clientY - rect.top) / rect.height) * 100
            }
        },
        [isHorizontal]
    )

    const handleStart = useCallback(
        (e) => {
            e.preventDefault()
            isDragging.current = true
            const pos = getPosFromEvent(e)
            applyPosition(pos)
            setSliderPos(Math.min(100, Math.max(0, pos)))
        },
        [getPosFromEvent, applyPosition]
    )

    const handleMove = useCallback(
        (e) => {
            if (!isDragging.current) return
            e.preventDefault()
            const pos = getPosFromEvent(e)
            applyPosition(pos)
        },
        [getPosFromEvent, applyPosition]
    )

    const handleEnd = useCallback(
        (e) => {
            if (!isDragging.current) return
            isDragging.current = false
            const pos = getPosFromEvent(
                e.changedTouches
                    ? {
                          clientX: e.changedTouches[0].clientX,
                          clientY: e.changedTouches[0].clientY,
                      }
                    : e
            )
            setSliderPos(Math.min(100, Math.max(0, pos)))
        },
        [getPosFromEvent]
    )

    useEffect(() => {
        const el = containerRef.current
        if (!el) return

        // Passive: false so we can preventDefault and block scroll-while-dragging
        el.addEventListener("touchstart", handleStart, { passive: false })
        el.addEventListener("touchmove", handleMove, { passive: false })
        el.addEventListener("touchend", handleEnd, { passive: false })
        el.addEventListener("mousedown", handleStart)
        window.addEventListener("mousemove", handleMove)
        window.addEventListener("mouseup", handleEnd)

        return () => {
            el.removeEventListener("touchstart", handleStart)
            el.removeEventListener("touchmove", handleMove)
            el.removeEventListener("touchend", handleEnd)
            el.removeEventListener("mousedown", handleStart)
            window.removeEventListener("mousemove", handleMove)
            window.removeEventListener("mouseup", handleEnd)
        }
    }, [handleStart, handleMove, handleEnd])

    const parseLineHeight = (lh) => {
        if (!lh) return "inherit"
        return typeof lh === "number" ? `${lh}px` : lh
    }

    const baseDynamicLabelStyle = {
        ...labelStyle,
        ...font,
        fontSize: font?.fontSize ? `${font.fontSize}px` : "14px",
        lineHeight: parseLineHeight(font?.lineHeight),
    }

    const clipPath = isHorizontal
        ? `inset(0% ${100 - sliderPos}% 0% 0%)`
        : `inset(0% 0% ${100 - sliderPos}% 0%)`

    return (
        <div
            ref={containerRef}
            style={{
                ...containerStyle,
                cursor: isHorizontal ? "ew-resize" : "ns-resize",
                touchAction: "none",
            }}
        >
            {imageAfter ? (
                <img
                    src={imageAfter}
                    style={imageStyle}
                    alt="After"
                    draggable={false}
                />
            ) : (
                <div style={{ ...imageStyle, backgroundColor: "#EBEBEB" }} />
            )}

            {imageBefore ? (
                <img
                    ref={beforeImgRef}
                    src={imageBefore}
                    style={{ ...imageStyle, clipPath }}
                    alt="Before"
                    draggable={false}
                />
            ) : (
                <div
                    ref={beforeImgRef}
                    style={{
                        ...imageStyle,
                        backgroundColor: "#CCCCCC",
                        clipPath,
                    }}
                />
            )}

            {labelBefore && (
                <div
                    ref={labelBeforeRef}
                    style={{
                        ...baseDynamicLabelStyle,
                        backgroundColor: labelBeforeColor,
                        ...(isHorizontal
                            ? { left: "16px", bottom: "16px" }
                            : {
                                  top: "16px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                              }),
                        opacity: sliderPos < 15 ? 0 : 1,
                        transition: "opacity 0.25s ease-in-out",
                    }}
                >
                    {labelBefore}
                </div>
            )}
            {labelAfter && (
                <div
                    ref={labelAfterRef}
                    style={{
                        ...baseDynamicLabelStyle,
                        backgroundColor: labelAfterColor,
                        ...(isHorizontal
                            ? { right: "16px", bottom: "16px" }
                            : {
                                  bottom: "16px",
                                  left: "50%",
                                  transform: "translateX(-50%)",
                              }),
                        opacity: sliderPos > 85 ? 0 : 1,
                        transition: "opacity 0.25s ease-in-out",
                    }}
                >
                    {labelAfter}
                </div>
            )}

            <div
                ref={lineRef}
                style={{
                    ...lineStyle,
                    left: isHorizontal ? `${sliderPos}%` : 0,
                    top: isHorizontal ? 0 : `${sliderPos}%`,
                    width: isHorizontal ? "2px" : "100%",
                    height: isHorizontal ? "100%" : "2px",
                    transform: isHorizontal
                        ? "translateX(-50%)"
                        : "translateY(-50%)",
                }}
            >
                <div
                    style={{
                        ...handleStyle,
                        transform: isHorizontal
                            ? "rotate(0deg)"
                            : "rotate(90deg)",
                    }}
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="32"
                        height="32"
                        stroke="#333"
                        strokeWidth="2.5"
                        fill="none"
                    >
                        <polyline points="9 16 5 12 9 8" />
                        <polyline points="15 8 19 12 15 16" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(BeforeAfterSlider, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    imageBefore: { type: ControlType.Image, title: "Before Image" },
    imageAfter: { type: ControlType.Image, title: "After Image" },
    labelBefore: {
        type: ControlType.String,
        title: "Left/Top Label",
        defaultValue: "Before",
    },
    labelBeforeColor: {
        type: ControlType.Color,
        title: "Left/Top Color",
        defaultValue: "#408053",
    },
    labelAfter: {
        type: ControlType.String,
        title: "Right/Bottom Label",
        defaultValue: "After",
    },
    labelAfterColor: {
        type: ControlType.Color,
        title: "Right/Bottom Color",
        defaultValue: "#408053",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        displayFontSize: true,
        defaultValue: {
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
        },
    },
})

const containerStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    backgroundColor: "#F5F5F5",
    userSelect: "none",
    WebkitUserSelect: "none",
}

const imageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    pointerEvents: "none",
}

const labelStyle = {
    position: "absolute",
    padding: "6px 14px",
    color: "#FFFFFF",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    backdropFilter: "blur(4px)",
    pointerEvents: "none",
    zIndex: 2,
}

const lineStyle = {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    pointerEvents: "none",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0px 0px 5px rgba(0,0,0,0.3)",
}

const handleStyle = {
    width: "64px",
    height: "40px",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
}
