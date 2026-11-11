// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useRef, useState, startTransition, useMemo, type CSSProperties } from "react"

interface Image {
    src: string
    alt: string
}

interface ImageCompareProps {
    beforeImage: Image
    afterImage: Image
    orientation: "horizontal" | "vertical"
    initialPosition: number
    dividerColor: string
    dividerWidth: number
    dividerShadow: boolean
    showHandle: boolean
    handleColor: string
    handleSize: number
    handleIconColor: string
    showLabels: boolean
    labelBackgroundColor: string
    labelTextColor: string
    labelFont: any
    style?: CSSProperties
}

/**
 * Image Comparison Slider
 *
 * A component that allows users to compare two images by dragging a divider.
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function AfterBeforeImageCompare(props: ImageCompareProps) {
    const {
        beforeImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Before image",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "After image",
        },
        orientation = "horizontal",
        initialPosition = 50,
        dividerColor = "#FFFFFF",
        dividerWidth = 2,
        dividerShadow = true,
        showHandle = true,
        handleColor = "#FFFFFF",
        handleSize = 40,
        handleIconColor = "#000000",
        showLabels = true,
        labelBackgroundColor = "#000000",
        labelTextColor = "#FFFFFF",
        labelFont = {},
        style,
    } = props

    const isHorizontal = orientation === "horizontal"
    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState(initialPosition)
    const [isDragging, setIsDragging] = useState(false)
    const isStatic = useIsStaticRenderer()

    const updatePositionFromEvent = useCallback(
        (e: MouseEvent | React.MouseEvent) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()
            const clientPos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top
            const dimension = isHorizontal ? rect.width : rect.height
            const newPosition = Math.max(0, Math.min(100, (clientPos / dimension) * 100))
            startTransition(() => setPosition(newPosition))
        },
        [isHorizontal]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) {
                updatePositionFromEvent(e)
            }
        },
        [isDragging, updatePositionFromEvent]
    )

    const handleDoubleClick = useCallback(() => {
        startTransition(() => setPosition(initialPosition))
    }, [initialPosition])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        startTransition(() => setIsDragging(true))
    }, [])

    const handleMouseUp = useCallback(() => {
        startTransition(() => setIsDragging(false))
    }, [])

    useEffect(() => {
        if (isStatic || !isDragging) return

        const handleMouseMove = (e: MouseEvent) => updatePositionFromEvent(e)
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDragging, updatePositionFromEvent, handleMouseUp, isStatic])

    const clipPath = useMemo(
        () => (isHorizontal ? `inset(0 ${100 - position}% 0 0)` : `inset(0 0 ${100 - position}% 0)`),
        [isHorizontal, position]
    )

    const dividerStyle = useMemo(
        () => ({
            position: "absolute" as const,
            top: isHorizontal ? (0 as const) : `${position}%`,
            left: isHorizontal ? `${position}%` : (0 as const),
            width: isHorizontal ? `${dividerWidth}px` : "100%",
            height: isHorizontal ? "100%" : `${dividerWidth}px`,
            backgroundColor: dividerColor,
            boxShadow: dividerShadow ? "0 0 5px rgba(0, 0, 0, 0.5)" : ("none" as const),
            transform: isHorizontal
                ? `translateX(-${dividerWidth / 2}px)`
                : `translateY(-${dividerWidth / 2}px)`,
            cursor: isHorizontal ? ("ew-resize" as const) : ("ns-resize" as const),
            zIndex: 2,
        }),
        [isHorizontal, position, dividerColor, dividerWidth, dividerShadow]
    )

    const handleStyle = useMemo(
        () => ({
            position: "absolute" as const,
            top: isHorizontal ? `calc(50% - ${handleSize / 2}px)` : `${position}%`,
            left: isHorizontal ? `${position}%` : `calc(50% - ${handleSize / 2}px)`,
            width: `${handleSize * 1.5}px`,
            height: `${handleSize}px`,
            borderRadius: "9999px",
            backgroundColor: handleColor,
            boxShadow: "0 0 8px rgba(0, 0, 0, 0.4)",
            transform: isHorizontal
                ? `translateX(-${(handleSize * 1.5) / 2}px)`
                : `translateY(-${handleSize / 2}px) rotate(90deg)`,
            cursor: isHorizontal ? ("ew-resize" as const) : ("ns-resize" as const),
            zIndex: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }),
        [isHorizontal, position, handleColor, handleSize]
    )

    const labelStyle = useMemo(
        () => ({
            position: "absolute" as const,
            bottom: 16,
            padding: "8px 16px",
            backgroundColor: labelBackgroundColor,
            color: labelTextColor,
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            zIndex: 4,
            pointerEvents: "none" as const,
        }),
        [labelBackgroundColor, labelTextColor]
    )

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                cursor: isDragging ? (isHorizontal ? "ew-resize" : "ns-resize") : "pointer",
                userSelect: "none",
            }}
            onClick={isStatic ? undefined : handleClick}
            onDoubleClick={handleDoubleClick}
            tabIndex={0}
            role="slider"
            aria-valuenow={position}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-orientation={orientation}
            aria-label="Image comparison slider"
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${afterImage.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
                aria-label={afterImage.alt}
                role="img"
            />

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url(${beforeImage.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    clipPath,
                }}
                aria-label={beforeImage.alt}
                role="img"
            />

            <div style={dividerStyle} onMouseDown={isStatic ? undefined : handleMouseDown} />

            {showHandle && (
                <div style={handleStyle} onMouseDown={isStatic ? undefined : handleMouseDown}>
                    <svg
                        viewBox="0 0 44 24"
                        width={handleSize}
                        height={handleSize * 0.6}
                        fill="none"
                        stroke={handleIconColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <g transform="translate(4, 0)">
                            <polyline points="11 18 5 12 11 6" />
                        </g>
                        <g transform="translate(22, 0)">
                            <polyline points="5 18 11 12 5 6" />
                        </g>
                    </svg>
                </div>
            )}

            {showLabels && (
                <>
                    <div 
                        style={{ 
                            position: "absolute",
                            bottom: "16px",
                            left: "16px",
                            padding: "8px 16px",
                            backgroundColor: labelBackgroundColor,
                            color: labelTextColor,
                            borderRadius: "20px",
                            zIndex: 10,
                            pointerEvents: "none",
                            fontSize: labelFont?.fontSize || "14px",
                            fontFamily: labelFont?.fontFamily || "inherit",
                            fontWeight: labelFont?.fontWeight || 600,
                            fontStyle: labelFont?.fontStyle || "normal",
                            letterSpacing: labelFont?.letterSpacing,
                            lineHeight: labelFont?.lineHeight,
                            textAlign: "center",
                        }}
                    >
                        Before
                    </div>
                    <div 
                        style={{ 
                            position: "absolute",
                            bottom: "16px",
                            right: "16px",
                            padding: "8px 16px",
                            backgroundColor: labelBackgroundColor,
                            color: labelTextColor,
                            borderRadius: "20px",
                            zIndex: 10,
                            pointerEvents: "none",
                            fontSize: labelFont?.fontSize || "14px",
                            fontFamily: labelFont?.fontFamily || "inherit",
                            fontWeight: labelFont?.fontWeight || 600,
                            fontStyle: labelFont?.fontStyle || "normal",
                            letterSpacing: labelFont?.letterSpacing,
                            lineHeight: labelFont?.lineHeight,
                            textAlign: "center",
                        }}
                    >
                        After
                    </div>
                </>
            )}
        </div>
    )
}

addPropertyControls(AfterBeforeImageCompare, {
    beforeImage: {
        type: ControlType.ResponsiveImage,
        title: "Before Image",
    },
    afterImage: {
        type: ControlType.ResponsiveImage,
        title: "After Image",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    initialPosition: {
        type: ControlType.Number,
        title: "Initial Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        defaultValue: "#FFFFFF",
    },
    dividerWidth: {
        type: ControlType.Number,
        title: "Divider Width",
        defaultValue: 2,
        min: 1,
        max: 20,
        step: 1,
        unit: "px",
    },
    dividerShadow: {
        type: ControlType.Boolean,
        title: "Divider Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showHandle: {
        type: ControlType.Boolean,
        title: "Show Handle",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    handleColor: {
        type: ControlType.Color,
        title: "Handle Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showHandle }) => !showHandle,
    },
    handleSize: {
        type: ControlType.Number,
        title: "Handle Size",
        defaultValue: 40,
        min: 20,
        max: 80,
        step: 1,
        unit: "px",
        hidden: ({ showHandle }) => !showHandle,
    },
    handleIconColor: {
        type: ControlType.Color,
        title: "Handle Icon Color",
        defaultValue: "#000000",
        hidden: ({ showHandle }) => !showHandle,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    labelBackgroundColor: {
        type: ControlType.Color,
        title: "Label Background",
        defaultValue: "#000000",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelTextColor: {
        type: ControlType.Color,
        title: "Label Text Color",
        defaultValue: "#FFFFFF",
        hidden: ({ showLabels }) => !showLabels,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "basic",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Semibold",
        },
        hidden: ({ showLabels }) => !showLabels,
    },
})
