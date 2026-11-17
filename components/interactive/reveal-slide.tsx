// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useCallback, useEffect } from "react"

/**
 * Before / After Slider
 *
 * Classic before/after comparison with a drag handle. Useful for
 * retouching, rebranding comparisons, or redesign showcases. The
 * entire area is draggable, not just the handle — important for
 * touch. The handle automatically scales down slightly on narrow
 * containers (e.g. mobile cards) so it never feels too dominant.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 */
export default function BeforeAfterSliderEN(props) {
    const {
        beforeImage,
        afterImage,
        initialPosition,
        handleColor,
        handleIconColor,
        handleBorderColor,
        handleBorderWidth,
        handleSize,
        showLabels,
        beforeLabel,
        afterLabel,
        labelBg,
        labelColor,
        borderRadius,
        style,
    } = props

    const containerRef = useRef(null)
    const [position, setPosition] = useState(initialPosition)
    const [dragging, setDragging] = useState(false)
    const [containerWidth, setContainerWidth] = useState(null)

    const updatePosition = useCallback((clientX) => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        let pct = ((clientX - rect.left) / rect.width) * 100
        pct = Math.max(0, Math.min(100, pct))
        setPosition(pct)
    }, [])

    // Tracks the actual width so handle size & labels can adapt
    // sensibly on narrow (mobile) containers.
    useEffect(() => {
        const el = containerRef.current
        if (!el || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width)
            }
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Pointer Events instead of separate mouse/touch listeners: avoids
    // duplicate/conflicting events on touch devices (e.g. trackpad-phones).
    useEffect(() => {
        if (!dragging) return

        const handleMove = (e) => updatePosition(e.clientX)
        const handleUp = () => setDragging(false)

        window.addEventListener("pointermove", handleMove)
        window.addEventListener("pointerup", handleUp)
        window.addEventListener("pointercancel", handleUp)

        return () => {
            window.removeEventListener("pointermove", handleMove)
            window.removeEventListener("pointerup", handleUp)
            window.removeEventListener("pointercancel", handleUp)
        }
    }, [dragging, updatePosition])

    const getSrc = (img) => {
        if (!img) return undefined
        if (typeof img === "string") return img
        return img.src
    }

    const beforeSrc = getSrc(beforeImage)
    const afterSrc = getSrc(afterImage)

    // Handle automatically shrinks on narrow containers (min. 28px),
    // so it doesn't take up half the area on a 200px-wide mobile card.
    const effectiveHandleSize = containerWidth
        ? Math.max(28, Math.min(handleSize, containerWidth * 0.16))
        : handleSize

    // Labels fade out on very narrow containers instead of overlapping.
    const labelsFit = containerWidth === null || containerWidth >= 160
    const labelsVisible = showLabels && labelsFit

    return (
        <div
            ref={containerRef}
            onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId)
                setDragging(true)
                updatePosition(e.clientX)
            }}
            style={{
                minHeight: 200,
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius,
                userSelect: "none",
                touchAction: "none",
                cursor: dragging ? "grabbing" : "grab",
                width: "100%",
                height: "100%",
                background: "#EEEEEE",
            }}
        >
            {!beforeSrc && !afterSrc && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999999",
                        fontSize: 13,
                        textAlign: "center",
                        padding: 16,
                    }}
                >
                    Assign a before and after image in the property panel
                </div>
            )}

            {/* After image — full size, bottom layer */}
            {afterSrc && (
                <img
                    src={afterSrc}
                    alt={afterLabel || "After"}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Before image — clipped via clip-path, top layer */}
            {beforeSrc && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        clipPath: `inset(0 ${100 - position}% 0 0)`,
                    }}
                >
                    <img
                        src={beforeSrc}
                        alt={beforeLabel || "Before"}
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                        }}
                    />
                </div>
            )}

            {/* Labels */}
            {labelsVisible && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 12,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: labelBg,
                            color: labelColor,
                            opacity: position > 12 ? 1 : 0,
                            transition: "opacity 0.15s ease",
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {beforeLabel}
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: labelBg,
                            color: labelColor,
                            opacity: position < 88 ? 1 : 0,
                            transition: "opacity 0.15s ease",
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {afterLabel}
                    </div>
                </>
            )}

            {/* Divider line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${position}%`,
                    width: 2,
                    background: handleColor,
                    transform: "translateX(-1px)",
                    pointerEvents: "none",
                }}
            />

            {/* Handle */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: `${position}%`,
                    width: effectiveHandleSize,
                    height: effectiveHandleSize,
                    borderRadius: "50%",
                    background: handleColor,
                    border:
                        handleBorderWidth > 0
                            ? `${handleBorderWidth}px solid ${handleBorderColor}`
                            : "none",
                    boxSizing: "border-box",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    pointerEvents: "none",
                }}
            >
                <svg
                    width={effectiveHandleSize * 0.45}
                    height={effectiveHandleSize * 0.45}
                    viewBox="0 0 24 24"
                    fill="none"
                >
                    <path
                        d="M8 6L2 12L8 18"
                        stroke={handleIconColor}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M16 6L22 12L16 18"
                        stroke={handleIconColor}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
    )
}

BeforeAfterSliderEN.defaultProps = {
    initialPosition: 50,
    handleColor: "#FFFFFF",
    handleIconColor: "#000000",
    handleBorderColor: "rgba(0,0,0,0.1)",
    handleBorderWidth: 0,
    handleSize: 44,
    showLabels: true,
    beforeLabel: "Before",
    afterLabel: "After",
    labelBg: "rgba(0,0,0,0.6)",
    labelColor: "#FFFFFF",
    borderRadius: 12,
}

addPropertyControls(BeforeAfterSliderEN, {
    beforeImage: {
        type: ControlType.Image,
        title: "Before Image",
    },
    afterImage: {
        type: ControlType.Image,
        title: "After Image",
    },
    initialPosition: {
        type: ControlType.Number,
        title: "Start Position",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle Background",
    },
    handleIconColor: {
        type: ControlType.Color,
        title: "Arrow Color",
    },
    handleBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 6,
        step: 1,
        unit: "px",
    },
    handleBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        hidden: (props) => !props.handleBorderWidth,
    },
    handleSize: {
        type: ControlType.Number,
        title: "Handle Size (max)",
        min: 28,
        max: 80,
        step: 2,
        unit: "px",
        description:
            "Shrinks automatically on narrow containers (e.g. mobile cards)",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
    },
    beforeLabel: {
        type: ControlType.String,
        title: "Before Label",
        hidden: (props) => !props.showLabels,
    },
    afterLabel: {
        type: ControlType.String,
        title: "After Label",
        hidden: (props) => !props.showLabels,
    },
    labelBg: {
        type: ControlType.Color,
        title: "Label Background",
        hidden: (props) => !props.showLabels,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Text",
        hidden: (props) => !props.showLabels,
    },
})
