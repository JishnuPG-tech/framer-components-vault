// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"

interface Media {
    src: string
    alt?: string
}

interface SplitViewProps {
    beforeType: "image" | "video"
    afterType: "image" | "video"
    beforeImage: Media
    afterImage: Media
    beforeVideo: string
    afterVideo: string
    beforeFilter: "none" | "grayscale" | "invert" | "blur" | "contrast"
    afterFilter: "none" | "grayscale" | "invert" | "blur" | "contrast"
    beforeFilterIntensity: number
    afterFilterIntensity: number
    beforeContrastIntensity: number
    afterContrastIntensity: number
    initialPosition: number
    dividerStyle: "straight" | "slanted"
    dividerAngle: number
    dividerColor: string
    dividerWidth: number
    dividerShadow: boolean
    showHandle: boolean
    handleColor: string
    handleSize: number
    handleIconColor: string
    handleIcon: "arrows" | "waffle" | "grip" | "resize"
    borderRadius: number
    showLabels: boolean
    leftLabel: string
    rightLabel: string
    style?: CSSProperties
}

/**
 * SplitView
 *
 * A component that allows users to compare two images or videos by dragging a divider.
 * Perfect for Before vs After scenarios.
 *
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 300
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SplitView(props: SplitViewProps) {
    const {
        beforeType = "image",
        afterType = "image",
        beforeImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Before",
        },
        afterImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "After",
        },
        beforeVideo = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        afterVideo = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        beforeFilter = "none",
        afterFilter = "none",
        beforeFilterIntensity = 100,
        afterFilterIntensity = 100,
        beforeContrastIntensity = 100,
        afterContrastIntensity = 100,
        initialPosition = 50,
        dividerStyle = "straight",
        dividerAngle = 15,
        dividerColor = "#FFFFFF",
        dividerWidth = 2,
        dividerShadow = true,
        showHandle = true,
        handleColor = "#FFFFFF",
        handleSize = 40,
        handleIconColor = "#000000",
        handleIcon = "arrows",
        borderRadius = 0,
        showLabels = true,
        leftLabel = "Before",
        rightLabel = "After",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState(initialPosition)
    const [isDragging, setIsDragging] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
    const isStatic = useIsStaticRenderer()
    const displayPosition = isStatic ? initialPosition : position

    const beforeRef = useRef<HTMLVideoElement>(null)
    const afterRef = useRef<HTMLVideoElement>(null)

    // Get container dimensions on mount and resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setDimensions({ width: rect.width, height: rect.height })
            }
        }

        updateDimensions()

        const resizeObserver =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(updateDimensions)
                : null

        if (resizeObserver && containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        window.addEventListener("resize", updateDimensions)

        return () => {
            if (resizeObserver && containerRef.current) {
                resizeObserver.unobserve(containerRef.current)
            }
            window.removeEventListener("resize", updateDimensions)
        }
    }, [])

    // Sync position with initialPosition prop for real-time canvas updates
    useEffect(() => {
        startTransition(() => setPosition(initialPosition))
    }, [initialPosition])

    const updatePosition = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const newPosition = Math.max(0, Math.min(100, (x / rect.width) * 100))
        startTransition(() => setPosition(newPosition))
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        startTransition(() => setIsDragging(true))
    }, [])

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return
            updatePosition(e.clientX)
        },
        [isDragging, updatePosition]
    )

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) {
                updatePosition(e.clientX)
            }
        },
        [isDragging, updatePosition]
    )

    const handleDoubleClick = useCallback(() => {
        startTransition(() => setPosition(initialPosition))
    }, [initialPosition])

    useEffect(() => {
        if (isStatic) return

        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updatePosition(e.clientX)
            }
        }

        const handleGlobalMouseUp = () => {
            startTransition(() => setIsDragging(false))
        }

        if (isDragging) {
            window.addEventListener("mousemove", handleGlobalMouseMove)
            window.addEventListener("mouseup", handleGlobalMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove)
            window.removeEventListener("mouseup", handleGlobalMouseUp)
        }
    }, [isDragging, updatePosition, isStatic])

    // Sync video playback
    useEffect(() => {
        if (isStatic) return

        if (beforeType === "video" && afterType === "video") {
            const beforeVideo = beforeRef.current
            const afterVideo = afterRef.current
            if (beforeVideo && afterVideo) {
                const syncTime = () => {
                    afterVideo.currentTime = beforeVideo.currentTime
                }
                beforeVideo.addEventListener("timeupdate", syncTime)
                return () =>
                    beforeVideo.removeEventListener("timeupdate", syncTime)
            }
        }
    }, [beforeType, afterType, isStatic])

    const getFilterStyle = (
        filter: string,
        intensity: number,
        contrastIntensity?: number
    ): string => {
        const normalizedIntensity = Math.max(0, Math.min(100, intensity))
        const normalizedContrast = Math.max(
            0,
            Math.min(100, contrastIntensity ?? 100)
        )
        const filters: string[] = []

        switch (filter) {
            case "grayscale":
                filters.push(`grayscale(${normalizedIntensity}%)`)
                break
            case "blur":
                const blurAmount = (normalizedIntensity / 100) * 10
                filters.push(`blur(${blurAmount}px)`)
                break
            case "contrast":
                const contrastAmount = 100 + normalizedIntensity
                filters.push(`contrast(${contrastAmount}%)`)
                break
        }

        return filters.join(" ")
    }

    // Calculate clip path based on divider style
    const getClipPath = (pos: number): string => {
        if (dividerStyle === "straight") {
            return `inset(0 ${100 - pos}% 0 0)`
        }
        // Slanted divider - use stored dimensions
        if (dimensions.width === 0) return `inset(0 ${100 - pos}% 0 0)`

        const aspectRatio = dimensions.height / dimensions.width
        const angleRad = (dividerAngle * Math.PI) / 180
        const offset = Math.tan(angleRad) * aspectRatio * 100

        const topX = pos + offset / 2
        const bottomX = pos - offset / 2
        return `polygon(0% 0%, ${topX}% 0%, ${bottomX}% 100%, 0% 100%)`
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                cursor: isStatic
                    ? "default"
                    : isDragging
                      ? "ew-resize"
                      : "pointer",
                userSelect: "none",
            }}
            onClick={isStatic ? undefined : handleClick}
            onDoubleClick={isStatic ? undefined : handleDoubleClick}
            onMouseMove={isStatic ? undefined : handleMouseMove}
            role="slider"
            aria-valuenow={Math.round(displayPosition)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Media comparison slider"
            tabIndex={isStatic ? -1 : 0}
            onKeyDown={
                isStatic
                    ? undefined
                    : (e) => {
                          if (e.key === "ArrowLeft") {
                              startTransition(() =>
                                  setPosition(Math.max(0, position - 5))
                              )
                          } else if (e.key === "ArrowRight") {
                              startTransition(() =>
                                  setPosition(Math.min(100, position + 5))
                              )
                          } else if (e.key === "Home") {
                              startTransition(() => setPosition(0))
                          } else if (e.key === "End") {
                              startTransition(() => setPosition(100))
                          }
                      }
            }
        >
            {/* After Media (Full) */}
            {afterType === "video" && !isStatic ? (
                <video
                    ref={afterRef}
                    src={afterVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        filter: getFilterStyle(
                            afterFilter,
                            afterFilterIntensity,
                            afterContrastIntensity
                        ),
                    }}
                />
            ) : (
                <img
                    src={afterImage.src}
                    alt={
                        afterType === "video"
                            ? "Static preview for right video"
                            : afterImage.alt
                    }
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        pointerEvents: "none",
                        filter: getFilterStyle(
                            afterFilter,
                            afterFilterIntensity,
                            afterContrastIntensity
                        ),
                    }}
                />
            )}

            {/* Before Media (Clipped) */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    clipPath: getClipPath(displayPosition),
                }}
            >
                {beforeType === "video" && !isStatic ? (
                    <video
                        ref={beforeRef}
                        src={beforeVideo}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: getFilterStyle(
                                beforeFilter,
                                beforeFilterIntensity,
                                beforeContrastIntensity
                            ),
                        }}
                    />
                ) : (
                    <img
                        src={beforeImage.src}
                        alt={
                            beforeType === "video"
                                ? "Static preview for left video"
                                : beforeImage.alt
                        }
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: getFilterStyle(
                                beforeFilter,
                                beforeFilterIntensity,
                                beforeContrastIntensity
                            ),
                        }}
                    />
                )}
            </div>

            {/* Divider Line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: `${displayPosition}%`,
                    width: `${dividerWidth}px`,
                    height: "100%",
                    backgroundColor: dividerColor,
                    transform:
                        dividerStyle === "slanted"
                            ? `translateX(-${dividerWidth / 2}px) skewX(-${dividerAngle}deg)`
                            : `translateX(-${dividerWidth / 2}px)`,
                    boxShadow: dividerShadow
                        ? "0 0 10px rgba(0, 0, 0, 0.5)"
                        : "none",
                    cursor: isStatic ? "default" : "ew-resize",
                    zIndex: 2,
                }}
                onMouseDown={isStatic ? undefined : handleMouseDown}
            />

            {/* Drag Handle */}
            {showHandle && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: `${displayPosition}%`,
                        width: `${handleSize}px`,
                        height: `${handleSize}px`,
                        borderRadius: "50%",
                        backgroundColor: handleColor,
                        transform: `translate(-50%, -50%)`,
                        boxShadow: dividerShadow
                            ? "0 2px 10px rgba(0, 0, 0, 0.3)"
                            : "none",
                        cursor: isStatic ? "default" : "ew-resize",
                        zIndex: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${dividerColor}`,
                    }}
                    onMouseDown={isStatic ? undefined : handleMouseDown}
                >
                    {handleIcon === "arrows" && (
                        <svg
                            width={handleSize * 0.5}
                            height={handleSize * 0.5}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={handleIconColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="9 17 4 12 9 7" />
                            <polyline points="15 7 20 12 15 17" />
                        </svg>
                    )}
                    {handleIcon === "waffle" && (
                        <svg
                            width={handleSize * 0.4}
                            height={handleSize * 0.4}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={handleIconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                    )}
                    {handleIcon === "grip" && (
                        <svg
                            width={handleSize * 0.4}
                            height={handleSize * 0.4}
                            viewBox="0 0 24 24"
                            fill={handleIconColor}
                        >
                            <circle cx="9" cy="6" r="2" />
                            <circle cx="15" cy="6" r="2" />
                            <circle cx="9" cy="12" r="2" />
                            <circle cx="15" cy="12" r="2" />
                            <circle cx="9" cy="18" r="2" />
                            <circle cx="15" cy="18" r="2" />
                        </svg>
                    )}
                    {handleIcon === "resize" && (
                        <svg
                            width={handleSize * 0.5}
                            height={handleSize * 0.5}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={handleIconColor}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M8 3L3 8L3 3L8 3Z" />
                            <path d="M16 21L21 16L21 21L16 21Z" />
                            <line x1="3" y1="3" x2="10" y2="10" />
                            <line x1="21" y1="21" x2="14" y2="14" />
                        </svg>
                    )}
                </div>
            )}

            {/* Labels */}
            {showLabels && (
                <>
                    <span
                        style={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    >
                        {leftLabel}
                    </span>
                    <span
                        style={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    >
                        {rightLabel}
                    </span>
                </>
            )}
        </div>
    )
}

addPropertyControls(SplitView, {
    beforeType: {
        type: ControlType.Enum,
        title: "Left Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    afterType: {
        type: ControlType.Enum,
        title: "Right Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    beforeImage: {
        type: ControlType.ResponsiveImage,
        title: "Left Image",
        hidden: ({ beforeType }) => beforeType !== "image",
    },
    afterImage: {
        type: ControlType.ResponsiveImage,
        title: "Right Image",
        hidden: ({ afterType }) => afterType !== "image",
    },
    beforeVideo: {
        type: ControlType.File,
        title: "Left Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ beforeType }) => beforeType !== "video",
    },
    afterVideo: {
        type: ControlType.File,
        title: "Right Video",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: ({ afterType }) => afterType !== "video",
    },
    beforeFilter: {
        type: ControlType.Enum,
        title: "Left Filter",
        options: ["none", "grayscale", "blur", "contrast"],
        optionTitles: ["None", "Grayscale", "Blur", "Contrast"],
        defaultValue: "none",
    },
    beforeFilterIntensity: {
        type: ControlType.Number,
        title: "Left Intensity",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ beforeFilter }) => beforeFilter === "none",
    },
    afterFilter: {
        type: ControlType.Enum,
        title: "Right Filter",
        options: ["none", "grayscale", "blur", "contrast"],
        optionTitles: ["None", "Grayscale", "Blur", "Contrast"],
        defaultValue: "none",
    },
    afterFilterIntensity: {
        type: ControlType.Number,
        title: "Right Intensity",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: ({ afterFilter }) => afterFilter === "none",
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
    dividerStyle: {
        type: ControlType.Enum,
        title: "Divider Style",
        options: ["straight", "slanted"],
        optionTitles: ["Straight", "Slanted"],
        defaultValue: "straight",
        displaySegmentedControl: true,
    },
    dividerAngle: {
        type: ControlType.Number,
        title: "Divider Angle",
        defaultValue: 15,
        min: 5,
        max: 45,
        step: 1,
        unit: "°",
        hidden: ({ dividerStyle }) => dividerStyle !== "slanted",
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
        title: "Shadow",
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
        title: "Handle Icon",
        defaultValue: "#000000",
        hidden: ({ showHandle }) => !showHandle,
    },
    handleIcon: {
        type: ControlType.Enum,
        title: "Handle Icon",
        options: ["arrows", "waffle", "grip", "resize"],
        optionTitles: ["Arrows", "Waffle", "Grip", "Resize"],
        defaultValue: "arrows",
        hidden: ({ showHandle }) => !showHandle,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Labels",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    leftLabel: {
        type: ControlType.String,
        title: "Left Label",
        defaultValue: "Before",
        hidden: ({ showLabels }) => !showLabels,
    },
    rightLabel: {
        type: ControlType.String,
        title: "Right Label",
        defaultValue: "After",
        hidden: ({ showLabels }) => !showLabels,
    },
})

SplitView.displayName = "SplitView"
