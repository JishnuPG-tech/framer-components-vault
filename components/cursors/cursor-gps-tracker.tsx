// Cursor Coordinates - shows live pointer coordinates inside the component area with a padded coordinate label
import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
    type CSSProperties,
    type PointerEvent,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const FORMAT_OPTIONS = ["plain", "latlng", "dms"] as const
type CoordinateFormat = (typeof FORMAT_OPTIONS)[number]

const DEFAULT_FORMAT: CoordinateFormat = "plain"
const DEFAULT_DECIMAL = 6
const MIN_DECIMAL = 1
const MAX_DECIMAL = 12

// ============================================================================
// TYPES
// ============================================================================

interface CursorCoordinatesProps {
    font: any
    format: string
    decimal: number
    showTrail: boolean
    trailLength: number
    trailOpacity: number
    trailColor: string
    labelPosition:
        | "br"
        | "bl"
        | "tr"
        | "tl"
        | "follow"
        | "top"
        | "right"
        | "bottom"
        | "left"
    labelBg?: string
    labelColor?: string
    labelPadding?: any
    labelRadius?: number
    labelShadow?: string
    labelBorder?: any
    style?: CSSProperties
    offsetX?: number
    offsetY?: number
}

function normalizeFormat(value: unknown): CoordinateFormat {
    return typeof value === "string" &&
        (FORMAT_OPTIONS as readonly string[]).includes(value)
        ? (value as CoordinateFormat)
        : DEFAULT_FORMAT
}

function normalizeDecimal(value: unknown): number {
    const numberValue =
        typeof value === "number" && Number.isFinite(value)
            ? value
            : DEFAULT_DECIMAL

    return Math.max(MIN_DECIMAL, Math.min(MAX_DECIMAL, Math.round(numberValue)))
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Cursor Coordinates
 *
 * Shows pointer position in the component area with an optional visual trail.
 * Cursor data only. No location data.
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorCoordinates(props: CursorCoordinatesProps) {
    // ------------------------------------------------------------------------
    // Props Destructuring
    // ------------------------------------------------------------------------

    const {
        font = {},
        format = DEFAULT_FORMAT,
        decimal = DEFAULT_DECIMAL,
        showTrail = false,
        trailLength = 18,
        trailOpacity = 0.7,
        trailColor = "#2079fc",
        labelPosition = "br",
        style = {},
        labelBg = "rgba(0,0,0,0.66)",
        labelColor = "#fff",
        labelPadding = 12,
        labelRadius = 8,
        labelShadow = "0px 2px 8px rgba(0, 0, 0, 0.15)",
        labelBorder,
        offsetX = 12,
        offsetY = 12,
    } = props

    // ------------------------------------------------------------------------
    // Refs
    // ------------------------------------------------------------------------

    const ref = useRef<HTMLDivElement | null>(null) // Main container ref
    const labelRef = useRef<HTMLDivElement | null>(null) // Label ref for direct DOM manipulation in follow mode
    const rectRef = useRef<DOMRect | null>(null) // Cached bounding rect to avoid layout thrashing
    const frame = useRef<number | null>(null) // RAF handle for cleanup

    // Ring buffer for trail points (O(1) operations)
    const trailRef = useRef<Array<{ x: number; y: number }>>([])
    const headRef = useRef(0) // Ring buffer head pointer

    // ------------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------------

    const [pos, setPos] = useState({ x: 0.5, y: 0.5 }) // Normalized cursor position (0-1)
    const [trailVersion, setTrailVersion] = useState(0) // Cheap version bump to trigger trail path recalc
    const isStatic = useIsStaticRenderer() // Disable interactions in static renders

    const pendingPos = useRef(pos) // Pending position for RAF batching

    // ------------------------------------------------------------------------
    // Effects - Bounding Rect Cache
    // ------------------------------------------------------------------------

    /**
     * Cache bounding rect and update on resize/scroll
     * Prevents layout thrashing from getBoundingClientRect() on every mousemove
     */
    useEffect(() => {
        const updateRect = () => {
            if (ref.current) {
                rectRef.current = ref.current.getBoundingClientRect()
            }
        }
        updateRect()

        const ro = new ResizeObserver(updateRect)
        if (ref.current) ro.observe(ref.current)

        const opts = { capture: true } as const
        addEventListener("resize", updateRect)
        addEventListener("scroll", updateRect, opts)

        return () => {
            ro.disconnect()
            removeEventListener("resize", updateRect)
            removeEventListener("scroll", updateRect, opts)
        }
    }, [])

    // ------------------------------------------------------------------------
    // Effects - Cleanup
    // ------------------------------------------------------------------------

    /**
     * Cancel pending animation frame on unmount
     */
    useEffect(() => {
        return () => {
            if (frame.current !== null) cancelAnimationFrame(frame.current)
        }
    }, [])

    // ------------------------------------------------------------------------
    // Effects - Trail Reset
    // ------------------------------------------------------------------------

    /**
     * Clear trail when showTrail is disabled
     */
    useEffect(() => {
        if (!showTrail && trailRef.current.length > 0) {
            trailRef.current = []
            headRef.current = 0
        }
    }, [showTrail])

    // ------------------------------------------------------------------------
    // Callbacks - Ring Buffer
    // ------------------------------------------------------------------------

    /**
     * Push point to ring buffer (O(1) operation)
     * Avoids expensive array.shift() operations
     */
    const pushPoint = useCallback(
        (p: { x: number; y: number }) => {
            if (trailRef.current.length < trailLength) {
                trailRef.current.push(p)
            } else {
                trailRef.current[headRef.current] = p
                headRef.current = (headRef.current + 1) % trailLength
            }
        },
        [trailLength]
    )

    // ------------------------------------------------------------------------
    // Callbacks - Animation Frame
    // ------------------------------------------------------------------------

    /**
     * RAF callback - batches state updates and trail point additions
     * Direct DOM manipulation for follow mode to avoid React re-renders
     */
    const runFrame = useCallback(() => {
        setPos(pendingPos.current)

        if (showTrail) {
            pushPoint(pendingPos.current)
            setTrailVersion((v) => (v + 1) & 0x3fff) // Cheap version bump (bitwise AND keeps it small)
        }

        // Direct DOM manipulation for follow mode (bypasses React for performance)
        if (labelPosition === "follow" && labelRef.current) {
            labelRef.current.style.left = `${pendingPos.current.x * 100}%`
            labelRef.current.style.top = `${pendingPos.current.y * 100}%`
        }

        frame.current = null
    }, [showTrail, labelPosition, pushPoint])

    // ------------------------------------------------------------------------
    // Callbacks - Pointer Move Handler
    // ------------------------------------------------------------------------

    /**
     * Pointer move handler - uses cached rect and RAF batching
     * onPointerMove is preferred over onMouseMove for better device support
     */
    const handleMove = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            const rect = rectRef.current
            if (!rect) return

            // Normalize coordinates to 0-1 range
            const x = (e.clientX - rect.left) / rect.width
            const y = (e.clientY - rect.top) / rect.height
            pendingPos.current = {
                x: Math.max(0, Math.min(x, 1)),
                y: Math.max(0, Math.min(y, 1)),
            }

            // Schedule RAF if not already scheduled
            if (frame.current === null) {
                frame.current = requestAnimationFrame(runFrame)
            }
        },
        [runFrame]
    )

    // ------------------------------------------------------------------------
    // Memoized Values - Coordinates
    // ------------------------------------------------------------------------

    /**
     * Convert normalized position to Lat/Lng style coordinates
     * Lat: -45 to 45, Lng: -90 to 90
     */
    const { lat, lng } = useMemo(
        () => ({
            lat: pos.y * 90 - 45,
            lng: pos.x * 180 - 90,
        }),
        [pos.x, pos.y]
    )

    const normalizedFormat = normalizeFormat(format)
    const normalizedDecimal = normalizeDecimal(decimal)

    // ------------------------------------------------------------------------
    // Memoized Values - Formatted Display
    // ------------------------------------------------------------------------

    /**
     * Format coordinates based on selected format
     * - plain: "Lat: X, Lng: Y"
     * - latlng: "X, Y"
     * - dms: Degrees Minutes Seconds format
     */
    const formattedValue = useMemo(() => {
        if (normalizedFormat === "plain") {
            return `Lat: ${lat.toFixed(normalizedDecimal)}, Lng: ${lng.toFixed(normalizedDecimal)}`
        }
        if (normalizedFormat === "latlng") {
            return `${lat.toFixed(normalizedDecimal)}, ${lng.toFixed(normalizedDecimal)}`
        }

        // DMS (Degrees Minutes Seconds) format
        const latAbs = Math.abs(lat)
        const lngAbs = Math.abs(lng)
        const latD = Math.floor(latAbs)
        const latM = Math.floor((latAbs - latD) * 60)
        const latS = (((latAbs - latD) * 60 - latM) * 60).toFixed(
            normalizedDecimal
        )
        const latDir = lat >= 0 ? "N" : "S"
        const lngD = Math.floor(lngAbs)
        const lngM = Math.floor((lngAbs - lngD) * 60)
        const lngS = (((lngAbs - lngD) * 60 - lngM) * 60).toFixed(
            normalizedDecimal
        )
        const lngDir = lng >= 0 ? "E" : "W"
        return `${latDir}${latD}°${latM}'${latS}", ${lngDir}${lngD}°${lngM}'${lngS}"`
    }, [lat, lng, normalizedFormat, normalizedDecimal])

    // ------------------------------------------------------------------------
    // Memoized Values - Trail Path
    // ------------------------------------------------------------------------

    /**
     * Generate SVG path for trail with smooth curves
     * Only recalculates when trail changes (not on every cursor move)
     * Uses quadratic Bezier curves for smooth transitions
     */
    const trailPath = useMemo(() => {
        if (!showTrail || trailRef.current.length < 2) return ""

        const points = trailRef.current
        const len = points.length

        // Read from ring buffer in correct order
        const orderedPoints: Array<{ x: number; y: number }> = []
        if (len < trailLength) {
            // Buffer not full yet, use points as-is
            orderedPoints.push(...points)
        } else {
            // Buffer full, read from head to maintain order
            for (let i = 0; i < len; i++) {
                orderedPoints.push(points[(headRef.current + i) % len])
            }
        }

        // Build SVG path with quadratic curves for smoothness
        let path = `M ${orderedPoints[0].x * 100} ${orderedPoints[0].y * 100}`

        for (let i = 1; i < orderedPoints.length; i++) {
            const prev = orderedPoints[i - 1]
            const curr = orderedPoints[i]
            const midX = ((prev.x + curr.x) / 2) * 100
            const midY = ((prev.y + curr.y) / 2) * 100

            if (i === 1) {
                path += ` L ${midX} ${midY}`
            } else {
                // Quadratic curve through previous point to midpoint
                path += ` Q ${prev.x * 100} ${prev.y * 100} ${midX} ${midY}`
            }
        }

        // Line to final point
        const last = orderedPoints[orderedPoints.length - 1]
        path += ` L ${last.x * 100} ${last.y * 100}`

        return path
    }, [showTrail, trailVersion, trailLength])

    // ------------------------------------------------------------------------
    // Memoized Values - Label Styles
    // ------------------------------------------------------------------------

    /**
     * Convert padding prop to style object
     * Supports both single value and object with top/right/bottom/left
     */
    const paddingStyle = useMemo(() => {
        if (typeof labelPadding === "object" && labelPadding !== null) {
            return {
                paddingTop: labelPadding.top,
                paddingRight: labelPadding.right,
                paddingBottom: labelPadding.bottom,
                paddingLeft: labelPadding.left,
            }
        }
        return { padding: labelPadding ?? 12 }
    }, [labelPadding])

    /**
     * Label positioning and styling
     * Follow mode uses will-change for better compositing
     * Static positions use offset controls
     */
    const labelStyle: CSSProperties = useMemo(() => {
        const base: CSSProperties = {
            position: "absolute",
            zIndex: 10,
            pointerEvents: "none",
            ...font,
            fontVariantNumeric: "tabular-nums", // Monospaced numbers for stable width
            color: labelColor,
            background: labelBg,
            borderRadius: labelRadius,
            boxShadow: labelShadow,
            ...labelBorder,
            ...paddingStyle,
            width: "max-content",
            display: "inline-block",
        }

        if (labelPosition === "follow") {
            return {
                ...base,
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: "translate(-50%, calc(-100% - 12px))", // Center horizontally, position above cursor
                willChange: "transform", // Hint to browser for better compositing
            }
        }

        // Static corner positions
        const positions = {
            br: { bottom: offsetY, right: offsetX },
            bl: { bottom: offsetY, left: offsetX },
            tr: { top: offsetY, right: offsetX },
            tl: { top: offsetY, left: offsetX },
            top: { top: offsetY, left: "50%", transform: "translateX(-50%)" },
            bottom: {
                bottom: offsetY,
                left: "50%",
                transform: "translateX(-50%)",
            },
            left: { left: offsetX, top: "50%", transform: "translateY(-50%)" },
            right: {
                right: offsetX,
                top: "50%",
                transform: "translateY(-50%)",
            },
        }
        return { ...base, ...(positions[labelPosition] || positions.br) }
    }, [
        font,
        labelColor,
        labelBg,
        labelRadius,
        labelShadow,
        labelBorder,
        paddingStyle,
        labelPosition,
        pos.x,
        pos.y,
        offsetX,
        offsetY,
    ])

    // ------------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------------

    return (
        <div
            ref={ref}
            onPointerMove={isStatic ? undefined : handleMove}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Trail SVG - single path element for all trail points */}
            {showTrail && trailPath && (
                <svg
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d={trailPath}
                        stroke={trailColor}
                        strokeWidth={0.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity={trailOpacity}
                    />
                </svg>
            )}

            {/* Coordinate Label */}
            <div ref={labelRef} style={labelStyle}>
                {formattedValue}
            </div>
        </div>
    )
}

// ============================================================================
// PROPERTY CONTROLS
// ============================================================================

;(CursorCoordinates as { displayName?: string }).displayName =
    "Cursor Coordinates"

addPropertyControls(CursorCoordinates, {
    // Format Controls
    format: {
        type: ControlType.Enum,
        title: "Format",
        defaultValue: DEFAULT_FORMAT,
        options: [...FORMAT_OPTIONS],
        optionTitles: ["Plain (Lat/Lng)", "Lat/Lng", "DMS"],
        displaySegmentedControl: false,
    },
    decimal: {
        type: ControlType.Number,
        title: "Decimals",
        defaultValue: DEFAULT_DECIMAL,
        min: MIN_DECIMAL,
        max: MAX_DECIMAL,
        step: 1,
        displayStepper: true,
    },

    // Typography Controls
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    labelColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },

    // Label Position Controls
    labelPosition: {
        type: ControlType.Enum,
        title: "Display",
        defaultValue: "br",
        options: [
            "follow",
            "tl",
            "top",
            "tr",
            "left",
            "right",
            "bl",
            "bottom",
            "br",
        ],
        optionTitles: [
            "Follow Cursor",
            "Top Left",
            "Top Center",
            "Top Right",
            "Left Center",
            "Right Center",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
    },
    offsetX: {
        type: ControlType.Number,
        title: "Offset X",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden: (p: CursorCoordinatesProps) =>
            p.labelPosition === "follow" ||
            p.labelPosition === "top" ||
            p.labelPosition === "bottom",
    },
    offsetY: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 12,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
        hidden: (p: CursorCoordinatesProps) =>
            p.labelPosition === "follow" ||
            p.labelPosition === "left" ||
            p.labelPosition === "right",
    },

    // Label Style Controls
    labelPadding: {
        type: ControlType.Padding,
        title: "Inner Padding",
        defaultValue: { top: 12, right: 12, bottom: 12, left: 12 },
    },
    labelRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        displayStepper: true,
    },
    labelBg: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "rgba(0,0,0,0.66)",
    },
    labelShadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 2px 8px rgba(0, 0, 0, 0.15)",
    },

    // Trail Controls
    showTrail: {
        type: ControlType.Boolean,
        title: "Show Trail",
        defaultValue: false,
    },
    trailColor: {
        type: ControlType.Color,
        title: "Trail Color",
        defaultValue: "#2079fc",
        hidden: (p: CursorCoordinatesProps) => !p.showTrail,
    },
    trailLength: {
        type: ControlType.Number,
        title: "Length",
        defaultValue: 18,
        min: 2,
        max: 60,
        step: 1,
        displayStepper: true,
        hidden: (p: CursorCoordinatesProps) => !p.showTrail,
    },
    trailOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 0.7,
        min: 0.1,
        max: 1,
        step: 0.05,
        displayStepper: true,
        hidden: (p: CursorCoordinatesProps) => !p.showTrail,
    },
    labelBorder: {
        type: ControlType.Border,
        title: "Border",
        description: "Made by [MASH](https://framer.link/mash).",
    },
})
