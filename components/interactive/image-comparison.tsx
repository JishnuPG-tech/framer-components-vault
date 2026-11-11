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

function invertColor(color: string): string {
    const hex = color.replace("#", "")
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
        const r = 255 - parseInt(hex.slice(0, 2), 16)
        const g = 255 - parseInt(hex.slice(2, 4), 16)
        const b = 255 - parseInt(hex.slice(4, 6), 16)
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    }
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
        const r = 255 - parseInt(hex[0] + hex[0], 16)
        const g = 255 - parseInt(hex[1] + hex[1], 16)
        const b = 255 - parseInt(hex[2] + hex[2], 16)
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
    }
    const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgb) {
        return `rgb(${255 - +rgb[1]},${255 - +rgb[2]},${255 - +rgb[3]})`
    }
    return color
}

interface HandleOptions {
    show?: boolean
    style?: "solid" | "circle"
    borderWidth?: number
    radius?: string
    size?: number
    icon?: "arrows" | "chevrons" | "lines" | "none" | "custom"
    iconSize?: number
    customIcon?: string
    circleBlur?: boolean
}

interface LabelOptions {
    show?: boolean
    beforeText?: string
    afterText?: string
    font?: Record<string, unknown>
    padding?: string
    color?: string
    background?: string
    borderRadius?: string
    border?: Record<string, unknown>
}

interface Props {
    beforeImage?: { src: string; srcSet?: string; alt?: string }
    afterImage?: { src: string; srcSet?: string; alt?: string }
    initialPosition?: number
    orientation?: "horizontal" | "vertical"
    sliderColor?: string
    sliderWidth?: number
    handle?: HandleOptions
    labels?: LabelOptions
}

export default function ImageCompareViewer({
    beforeImage,
    afterImage,
    initialPosition = 50,
    orientation = "horizontal",
    sliderColor = "#ffffff",
    sliderWidth = 2,
    handle = {},
    labels = {},
    ...props
}: Props) {
    const {
        show: showHandle = true,
        style: handleStyle = "circle",
        borderWidth: handleBorderWidth = 2,
        radius: handleRadius = "60px",
        size: handleSize = 44,
        icon: handleIcon = "arrows",
        iconSize = 16,
        customIcon,
        circleBlur = true,
    } = handle

    const {
        show: showLabels = true,
        beforeText: beforeLabel = "Before",
        afterText: afterLabel = "After",
        font: labelFont = {},
        padding: labelPadding = "4px 10px",
        color: labelColor = "#ffffff",
        background: labelBackground = "rgba(0,0,0,0.45)",
        borderRadius: labelBorderRadius = "4px",
        border: labelBorder = {},
    } = labels

    const [position, setPosition] = useState(initialPosition)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const isHorizontal = orientation === "horizontal"
    const isCircle = handleStyle === "circle"

    const updatePosition = useCallback(
        (clientX: number, clientY: number) => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const raw = isHorizontal
                ? ((clientX - rect.left) / rect.width) * 100
                : ((clientY - rect.top) / rect.height) * 100
            setPosition(Math.min(100, Math.max(0, raw)))
        },
        [isHorizontal]
    )

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isDragging.current = true
            updatePosition(e.clientX, e.clientY)
        },
        [updatePosition]
    )

    const onTouchStart = useCallback(
        (e: React.TouchEvent) => {
            isDragging.current = true
            updatePosition(e.touches[0].clientX, e.touches[0].clientY)
        },
        [updatePosition]
    )

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (isDragging.current) updatePosition(e.clientX, e.clientY)
        }
        const onTouchMove = (e: TouchEvent) => {
            if (isDragging.current)
                updatePosition(e.touches[0].clientX, e.touches[0].clientY)
        }
        const onUp = () => {
            isDragging.current = false
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", onUp)
        window.addEventListener("touchmove", onTouchMove, { passive: true })
        window.addEventListener("touchend", onUp)
        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", onUp)
            window.removeEventListener("touchmove", onTouchMove)
            window.removeEventListener("touchend", onUp)
        }
    }, [updatePosition])

    const dividerStyle: React.CSSProperties = isHorizontal
        ? {
              position: "absolute",
              top: 0,
              left: `${position}%`,
              width: sliderWidth,
              height: "100%",
              backgroundColor: sliderColor,
              transform: "translateX(-50%)",
              pointerEvents: "none",
          }
        : {
              position: "absolute",
              left: 0,
              top: `${position}%`,
              height: sliderWidth,
              width: "100%",
              backgroundColor: sliderColor,
              transform: "translateY(-50%)",
              pointerEvents: "none",
          }

    const beforeClip: React.CSSProperties = isHorizontal
        ? { clipPath: `inset(0 ${100 - position}% 0 0)` }
        : { clipPath: `inset(0 0 ${100 - position}% 0)` }

    const sharedImgStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
    }

    const labelBase: React.CSSProperties = {
        position: "absolute",
        backgroundColor: labelBackground,
        color: labelColor,
        padding: labelPadding,
        borderRadius: labelBorderRadius,
        ...(labelBorder as React.CSSProperties),
        ...(labelFont as React.CSSProperties),
        pointerEvents: "none",
        userSelect: "none",
        lineHeight: 1.4,
    }

    const circleHandleStyle: React.CSSProperties = {
        background: "transparent",
        border: `${handleBorderWidth}px solid ${sliderColor}`,
        boxShadow: `0 0 15px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.1)`,
        WebkitBackdropFilter: circleBlur ? "blur(5px)" : "none",
        backdropFilter: circleBlur ? "blur(5px)" : "none",
    }

    const solidHandleStyle: React.CSSProperties = {
        background: sliderColor,
        border: "none",
        boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
    }

    const arrowColor = isCircle ? sliderColor : invertColor(sliderColor)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                userSelect: "none",
                cursor: isHorizontal ? "ew-resize" : "ns-resize",
                touchAction: "none",
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {afterImage?.src ? (
                <img
                    src={afterImage.src}
                    srcSet={afterImage.srcSet}
                    alt={afterImage.alt || "After"}
                    draggable={false}
                    style={sharedImgStyle}
                />
            ) : (
                <Placeholder label="After" />
            )}

            {beforeImage?.src ? (
                <img
                    src={beforeImage.src}
                    srcSet={beforeImage.srcSet}
                    alt={beforeImage.alt || "Before"}
                    draggable={false}
                    style={{ ...sharedImgStyle, ...beforeClip }}
                />
            ) : (
                <div
                    style={{
                        ...sharedImgStyle,
                        ...beforeClip,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Placeholder label="Before" />
                </div>
            )}

            <div style={dividerStyle} />

            {showHandle && (
                <div
                    style={{
                        position: "absolute",
                        ...(isHorizontal
                            ? {
                                  top: "50%",
                                  left: `${position}%`,
                                  transform: "translate(-50%, -50%)",
                              }
                            : {
                                  left: "50%",
                                  top: `${position}%`,
                                  transform: "translate(-50%, -50%)",
                              }),
                        width: handleSize,
                        height: handleSize,
                        borderRadius: handleRadius,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        ...(isCircle ? circleHandleStyle : solidHandleStyle),
                    }}
                >
                    <HandleIcon
                        icon={handleIcon}
                        customSrc={customIcon}
                        horizontal={isHorizontal}
                        color={arrowColor}
                        size={iconSize}
                    />
                </div>
            )}

            {showLabels && (
                <>
                    <div
                        style={{
                            ...labelBase,
                            ...(isHorizontal
                                ? { top: 12, left: 12 }
                                : {
                                      top: 12,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                  }),
                            opacity: position < 15 ? 0 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        {beforeLabel}
                    </div>
                    <div
                        style={{
                            ...labelBase,
                            ...(isHorizontal
                                ? { top: 12, right: 12 }
                                : {
                                      bottom: 12,
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                  }),
                            opacity: position > 85 ? 0 : 1,
                            transition: "opacity 0.2s ease",
                        }}
                    >
                        {afterLabel}
                    </div>
                </>
            )}
        </div>
    )
}

// Phosphor icon paths (viewBox 0 0 256 256)
const PATHS = {
    arrowLeft:
        "M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z",
    arrowRight:
        "M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z",
    caretLeft:
        "M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z",
    caretRight:
        "M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z",
    arrowsOut:
        "M136,40V216a8,8,0,0,1-16,0V40a8,8,0,0,1,16,0ZM96,120H35.31l18.35-18.34A8,8,0,0,0,42.34,90.34l-32,32a8,8,0,0,0,0,11.32l32,32a8,8,0,0,0,11.32-11.32L35.31,136H96a8,8,0,0,0,0-16Zm149.66,2.34-32-32a8,8,0,0,0-11.32,11.32L220.69,120H160a8,8,0,0,0,0,16h60.69l-18.35,18.34a8,8,0,0,0,11.32,11.32l32-32A8,8,0,0,0,245.66,122.34Z",
}

function PhosphorIcon({
    path,
    size,
    color,
    rotate = 0,
}: {
    path: string
    size: number
    color: string
    rotate?: number
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 256 256"
            fill={color}
            style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        >
            <path d={path} />
        </svg>
    )
}

function HandleIcon({
    icon,
    customSrc,
    horizontal,
    color,
    size,
}: {
    icon: string
    customSrc?: string
    horizontal: boolean
    color: string
    size: number
}) {
    if (icon === "none") return null

    if (icon === "custom") {
        if (!customSrc) return null
        return (
            <img
                src={customSrc}
                width={size}
                height={size}
                style={{ objectFit: "contain", display: "block" }}
                draggable={false}
            />
        )
    }

    // arrows-out-line-horizontal: single icon, rotate 90° for vertical
    if (icon === "lines") {
        return (
            <PhosphorIcon
                path={PATHS.arrowsOut}
                size={size}
                color={color}
                rotate={horizontal ? 0 : 90}
            />
        )
    }

    // Two-icon layouts: side-by-side (horizontal) or stacked (vertical)
    const isArrows = icon === "arrows"
    const leftPath = isArrows ? PATHS.arrowLeft : PATHS.caretLeft
    const rightPath = isArrows ? PATHS.arrowRight : PATHS.caretRight

    // Rotate each icon 90° for vertical so left→up, right→down
    const rot = horizontal ? 0 : 90

    return (
        <div
            style={{
                display: "flex",
                flexDirection: horizontal ? "row" : "column",
                alignItems: "center",
                justifyContent: "center",
                gap: size * 0.125,
            }}
        >
            <PhosphorIcon
                path={leftPath}
                size={size}
                color={color}
                rotate={rot}
            />
            <PhosphorIcon
                path={rightPath}
                size={size}
                color={color}
                rotate={rot}
            />
        </div>
    )
}

function Placeholder({ label }: { label: string }) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: label === "Before" ? "#e8e8e8" : "#d0d0d0",
                gap: 8,
            }}
        >
            <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#999"
                strokeWidth="1.5"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
            </svg>
            <span style={{ color: "#999", fontSize: 13, fontWeight: 500 }}>
                {label} Image
            </span>
        </div>
    )
}

addPropertyControls(ImageCompareViewer, {
    // ─── Images ───────────────────────────────────────────
    beforeImage: {
        type: ControlType.ResponsiveImage,
        title: "Before",
    },
    afterImage: {
        type: ControlType.ResponsiveImage,
        title: "After",
    },

    // ─── Slider ───────────────────────────────────────────
    initialPosition: {
        type: ControlType.Number,
        title: "Position",
        defaultValue: 50,
        min: 0,
        max: 100,
        unit: "%",
        step: 1,
        displayStepper: true,
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    sliderColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#ffffff",
    },
    sliderWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 2,
        min: 1,
        max: 8,
        unit: "px",
        step: 1,
        displayStepper: true,
    },

    // ─── Handle group ─────────────────────────────────────
    handle: {
        type: ControlType.Object,
        title: "Handle",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["circle", "solid"],
                optionTitles: ["Circle Outline", "Solid"],
                defaultValue: "circle",
                displaySegmentedControl: true,
                hidden: (props) => !props.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 44,
                min: 20,
                max: 120,
                unit: "px",
                step: 1,
                displayStepper: true,
                hidden: (props) => !props.show,
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "60px",
                hidden: (props) => !props.show,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 2,
                min: 0,
                max: 16,
                unit: "px",
                step: 1,
                displayStepper: true,
                hidden: (props) => !props.show || props.style !== "circle",
            },
            circleBlur: {
                type: ControlType.Boolean,
                title: "Frosted Blur",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (props) => !props.show || props.style !== "circle",
            },
            icon: {
                type: ControlType.Enum,
                title: "Icon",
                options: ["arrows", "chevrons", "lines", "none", "custom"],
                optionTitles: [
                    "Arrows",
                    "Chevrons",
                    "Lines",
                    "None",
                    "Custom SVG",
                ],
                defaultValue: "arrows",
                hidden: (props) => !props.show,
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                defaultValue: 16,
                min: 0,
                max: 80,
                unit: "px",
                step: 1,
                displayStepper: true,
                hidden: (props) => !props.show,
            },
            customIcon: {
                type: ControlType.File,
                title: "SVG File",
                allowedFileTypes: ["svg"],
                hidden: (props) => !props.show || props.icon !== "custom",
            },
        },
    },

    // ─── Labels group ─────────────────────────────────────
    labels: {
        type: ControlType.Object,
        title: "Labels",
        description:
            "Made by Hugo Marques @ [seiikudesign.com](https://seiikudesign.com?utm_source=framerComponent&utm_content=imageComparison)",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Visible",
                defaultValue: true,
                enabledTitle: "Yes",
                disabledTitle: "No",
            },
            beforeText: {
                type: ControlType.String,
                title: "Before",
                defaultValue: "Before",
                placeholder: "Before",
                hidden: (props) => !props.show,
            },
            afterText: {
                type: ControlType.String,
                title: "After",
                defaultValue: "After",
                placeholder: "After",
                hidden: (props) => !props.show,
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: { fontSize: 14, fontWeight: 600 },
                hidden: (props) => !props.show,
            },
            padding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "4px 10px",
                hidden: (props) => !props.show,
            },
            color: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#ffffff",
                hidden: (props) => !props.show,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(0,0,0,0.45)",
                hidden: (props) => !props.show,
            },
            borderRadius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "4px",
                hidden: (props) => !props.show,
            },
            border: {
                type: ControlType.Border,
                title: "Border",
                hidden: (props) => !props.show,
            },
        },
    },
})
