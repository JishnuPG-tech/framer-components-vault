// Component that converts location names to GPS coordinates with customizable styling
import { useState, useEffect, startTransition, useRef, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MinimalMapCoordinatesProps {
    location: string
    backgroundColor: string
    textColor: string
    labelColor: string
    unitColor: string
    font: any
    borderRadius: number
    padding: number
    showLabels: boolean
    shortLabels: boolean
    precision: number
    textAlignment: "left" | "center" | "right"
    coordinateLayout: "vertical" | "horizontal"
    link?: string
    linkEffects: {
        enableHoverScale: boolean
        hoverScale: number
        enableHoverShadow: boolean
        hoverShadowColor: string
        enableHoverColorChange: boolean
        hoverBackgroundColor: string
        hoverTextColor: string
        hoverLabelColor: string
        hoverUnitColor: string
    }
    coordinateFormat: "decimal" | "dms"
    showDegreeUnit: boolean
    style?: CSSProperties
}

/**
 * Minimal Map Coordinates
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function MinimalMapCoordinates(props: MinimalMapCoordinatesProps) {
    const {
        location,
        backgroundColor,
        textColor,
        labelColor,
        unitColor,
        font,
        borderRadius,
        padding,
        showLabels,
        shortLabels,
        precision,
        textAlignment,
        coordinateLayout,
        link,
        linkEffects,
        coordinateFormat,
        showDegreeUnit,
    } = props

    const [coordinates, setCoordinates] = useState<{
        lat: number
        lng: number
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const lastFetchedLocation = useRef<string>("")

    useEffect(() => {
        if (!location || location.trim() === "") {
            setCoordinates(null)
            setError(null)
            lastFetchedLocation.current = ""
            return
        }

        // Don't refetch if we already have coordinates for this location
        if (lastFetchedLocation.current === location.trim()) {
            return
        }

        const fetchCoordinates = async () => {
            if (typeof window === "undefined") return

            startTransition(() => {
                setLoading(true)
                setError(null)
            })

            try {
                // Using OpenStreetMap Nominatim API (free, no API key required)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
                )

                if (!response.ok) {
                    throw new Error("Failed to fetch coordinates")
                }

                const data = await response.json()

                if (data.length === 0) {
                    throw new Error("Location not found")
                }

                const lat = parseFloat(data[0].lat)
                const lng = parseFloat(data[0].lon)

                startTransition(() => {
                    setCoordinates({ lat, lng })
                    setLoading(false)
                    lastFetchedLocation.current = location.trim()
                })
            } catch (err) {
                startTransition(() => {
                    setError(
                        err instanceof Error ? err.message : "Unknown error"
                    )
                    setLoading(false)
                })
            }
        }

        const timeoutId = setTimeout(fetchCoordinates, 500) // Debounce API calls
        return () => clearTimeout(timeoutId)
    }, [location])

    const formatCoordinateWithUnit = (value: number) => {
        if (coordinateFormat === "decimal") {
            const formatted = value.toFixed(precision)
            if (showDegreeUnit) {
                return (
                    <>
                        {formatted}
                        <span
                            style={{
                                color:
                                    isHovered &&
                                    linkEffects.enableHoverColorChange
                                        ? linkEffects.hoverUnitColor
                                        : unitColor,
                            }}
                        >
                            °
                        </span>
                    </>
                )
            }
            return formatted
        } else {
            const degrees = Math.floor(value)
            const minutes = Math.floor((value - degrees) * 60)
            const seconds = ((value - degrees) * 60 - minutes) * 60
            return (
                <>
                    {degrees}
                    <span
                        style={{
                            color:
                                isHovered && linkEffects.enableHoverColorChange
                                    ? linkEffects.hoverUnitColor
                                    : unitColor,
                        }}
                    >
                        °{" "}
                    </span>
                    {minutes}
                    <span
                        style={{
                            color:
                                isHovered && linkEffects.enableHoverColorChange
                                    ? linkEffects.hoverUnitColor
                                    : unitColor,
                        }}
                    >
                        '{" "}
                    </span>
                    {seconds.toFixed(2)}
                    <span
                        style={{
                            color:
                                isHovered && linkEffects.enableHoverColorChange
                                    ? linkEffects.hoverUnitColor
                                    : unitColor,
                        }}
                    >
                        "
                    </span>
                </>
            )
        }
    }

    const isFixedWidth = props?.style && props.style.width === "100%"
    const hasLink = link && link.trim() !== ""

    if (hasLink) {
        return (
            <a
                href={link}
                style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "block",
                }}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => startTransition(() => setIsHovered(true))}
                onMouseLeave={() => startTransition(() => setIsHovered(false))}
            >
                <div
                    style={{
                        ...props.style,
                        position: "relative",
                        ...(isFixedWidth
                            ? { ...props?.style }
                            : { minWidth: "max-content" }),
                        backgroundColor:
                            isHovered && linkEffects.enableHoverColorChange
                                ? linkEffects.hoverBackgroundColor
                                : backgroundColor,
                        color:
                            isHovered && linkEffects.enableHoverColorChange
                                ? linkEffects.hoverTextColor
                                : textColor,
                        borderRadius,
                        padding,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: hasLink ? "all 0.2s ease" : "none",
                        cursor: hasLink ? "pointer" : "default",
                        transform:
                            isHovered && linkEffects.enableHoverScale
                                ? `scale(${linkEffects.hoverScale})`
                                : "scale(1)",
                        boxShadow:
                            isHovered && linkEffects.enableHoverShadow
                                ? `0 8px 24px ${linkEffects.hoverShadowColor}`
                                : "none",
                        ...font,
                    }}
                >
                    {loading && (
                        <div style={{ opacity: 0.7 }}>Loading coordinates...</div>
                    )}

                    {error && <div style={{ color: "#ff4444" }}>Error: {error}</div>}

                    {coordinates && !loading && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection:
                                    coordinateLayout === "vertical" ? "column" : "row",
                                flexWrap: coordinateLayout === "horizontal" ? "wrap" : "nowrap",
                                gap: coordinateLayout === "vertical" ? 4 : 16,
                                textAlign: textAlignment,
                                alignItems:
                                    coordinateLayout === "horizontal"
                                        ? "center"
                                        : "stretch",
                                justifyContent:
                                    textAlignment === "center"
                                        ? "center"
                                        : textAlignment === "right"
                                          ? "flex-end"
                                          : "flex-start",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    justifyContent:
                                        textAlignment === "center"
                                            ? "center"
                                            : textAlignment === "right"
                                              ? "flex-end"
                                              : "flex-start",
                                }}
                            >
                                {showLabels && (
                                    <span
                                        style={{
                                            opacity: 0.7,
                                            color:
                                                isHovered &&
                                                linkEffects.enableHoverColorChange
                                                    ? linkEffects.hoverLabelColor
                                                    : labelColor,
                                        }}
                                    >
                                        {shortLabels ? "Lat:" : "Latitude:"}
                                    </span>
                                )}
                                <span>
                                    {formatCoordinateWithUnit(coordinates.lat)}
                                    {!showLabels &&
                                        coordinateLayout === "horizontal" && (
                                            <span
                                                style={{
                                                    color:
                                                        isHovered &&
                                                        linkEffects.enableHoverColorChange
                                                            ? linkEffects.hoverUnitColor
                                                            : unitColor,
                                                }}
                                            >
                                                ,
                                            </span>
                                        )}
                                </span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    justifyContent:
                                        textAlignment === "center"
                                            ? "center"
                                            : textAlignment === "right"
                                              ? "flex-end"
                                              : "flex-start",
                                }}
                            >
                                {showLabels && (
                                    <span
                                        style={{
                                            opacity: 0.7,
                                            color:
                                                isHovered &&
                                                linkEffects.enableHoverColorChange
                                                    ? linkEffects.hoverLabelColor
                                                    : labelColor,
                                        }}
                                    >
                                        {shortLabels ? "Lon:" : "Longitude:"}
                                    </span>
                                )}
                                <span>{formatCoordinateWithUnit(coordinates.lng)}</span>
                            </div>
                        </div>
                    )}

                    {!location && !loading && !error && (
                        <div style={{ opacity: 0.5 }}>
                            Enter a location to get coordinates
                        </div>
                    )}
                </div>
            </a>
        )
    }

    return (
        <div
            style={{
                ...props.style,
                position: "relative",
                ...(isFixedWidth
                    ? { ...props?.style }
                    : { minWidth: "max-content" }),
                backgroundColor,
                color: textColor,
                borderRadius,
                padding,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                ...font,
            }}
        >
            {loading && (
                <div style={{ opacity: 0.7 }}>Loading coordinates...</div>
            )}

            {error && <div style={{ color: "#ff4444" }}>Error: {error}</div>}

            {coordinates && !loading && (
                <div
                    style={{
                        display: "flex",
                        flexDirection:
                            coordinateLayout === "vertical" ? "column" : "row",
                        flexWrap: coordinateLayout === "horizontal" ? "wrap" : "nowrap",
                        gap: coordinateLayout === "vertical" ? 4 : 16,
                        textAlign: textAlignment,
                        alignItems:
                            coordinateLayout === "horizontal"
                                ? "center"
                                : "stretch",
                        justifyContent:
                            textAlignment === "center"
                                ? "center"
                                : textAlignment === "right"
                                  ? "flex-end"
                                  : "flex-start",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            justifyContent:
                                textAlignment === "center"
                                    ? "center"
                                    : textAlignment === "right"
                                      ? "flex-end"
                                      : "flex-start",
                        }}
                    >
                        {showLabels && (
                            <span
                                style={{
                                    opacity: 0.7,
                                    color: labelColor,
                                }}
                            >
                                {shortLabels ? "Lat:" : "Latitude:"}
                            </span>
                        )}
                        <span>
                            {formatCoordinateWithUnit(coordinates.lat)}
                            {!showLabels &&
                                coordinateLayout === "horizontal" && (
                                    <span
                                        style={{
                                            color: unitColor,
                                        }}
                                    >
                                        ,
                                    </span>
                                )}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            justifyContent:
                                textAlignment === "center"
                                    ? "center"
                                    : textAlignment === "right"
                                      ? "flex-end"
                                      : "flex-start",
                        }}
                    >
                        {showLabels && (
                            <span
                                style={{
                                    opacity: 0.7,
                                    color: labelColor,
                                }}
                            >
                                {shortLabels ? "Lon:" : "Longitude:"}
                            </span>
                        )}
                        <span>{formatCoordinateWithUnit(coordinates.lng)}</span>
                    </div>
                </div>
            )}

            {!location && !loading && !error && (
                <div style={{ opacity: 0.5 }}>
                    Enter a location to get coordinates
                </div>
            )}
        </div>
    )
}

addPropertyControls(MinimalMapCoordinates, {
    location: {
        type: ControlType.String,
        title: "Location",
        defaultValue: "Amsterdam",
        placeholder: "Enter city, address, or landmark...",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    linkEffects: {
        type: ControlType.Object,
        title: "Link Effects",
        controls: {
            enableHoverScale: {
                type: ControlType.Boolean,
                title: "Enable Scale Effect",
                defaultValue: true,
            },
            hoverScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                defaultValue: 1.05,
                min: 0.8,
                max: 1.3,
                step: 0.01,
            },
            enableHoverShadow: {
                type: ControlType.Boolean,
                title: "Shadow Effect",
                defaultValue: true,
            },
            hoverShadowColor: {
                type: ControlType.Color,
                title: "Shadow Color",
                defaultValue: "rgba(0, 0, 0, 0.15)",
            },
            enableHoverColorChange: {
                type: ControlType.Boolean,
                title: "Color Change",
                defaultValue: false,
            },
            hoverBackgroundColor: {
                type: ControlType.Color,
                title: "Hover Background",
                defaultValue: "#F0F0F0",
            },
            hoverTextColor: {
                type: ControlType.Color,
                title: "Hover Text Color",
                defaultValue: "#000000",
            },
            hoverUnitColor: {
                type: ControlType.Color,
                title: "Hover Unit Color",
                defaultValue: "#333333",
            },
            hoverLabelColor: {
                type: ControlType.Color,
                title: "Hover Label Color",
                defaultValue: "#666",
            },
        },
        hidden: ({ link }) => !link || link.trim() === "",
    },
    coordinateLayout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    showLabels: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shortLabels: {
        type: ControlType.Boolean,
        title: "Short Labels",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ showLabels }) => !showLabels,
    },
    textAlignment: {
        type: ControlType.Enum,
        title: "Text Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: ({ coordinateLayout }) => coordinateLayout !== "vertical",
    },
    coordinateFormat: {
        type: ControlType.Enum,
        title: "Format",
        options: ["decimal", "dms"],
        optionTitles: ["Decimal", "DMS"],
        defaultValue: "decimal",
        displaySegmentedControl: true,
    },
    showDegreeUnit: {
        type: ControlType.Boolean,
        title: "Show Unit",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: ({ coordinateFormat }) => coordinateFormat !== "decimal",
    },
    precision: {
        type: ControlType.Number,
        title: "Decimal Points",
        defaultValue: 4,
        min: 1,
        max: 10,
        step: 1,
        hidden: ({ coordinateFormat }) => coordinateFormat !== "decimal",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "1rem",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
            textAlign: "left",
        },
        controls: "extended",
        defaultFontType: "monospace",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#666666",
    },
    unitColor: {
        type: ControlType.Color,
        title: "Unit Color",
        defaultValue: "#999999",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 48,
        unit: "px",
    },
})