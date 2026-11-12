/**
 * Arc Curved Text Pro v2
 *
 * Precision curved typography for Framer.
 *
 * Made with 💛 by Karim Saif
 * 𝕏 @karimsaif0
 *
 * Features:
 * - Positive / negative bend
 * - 0° straight text
 * - ±90° quarter arc
 * - ±180° semicircle
 * - ±270° major arc
 * - ±360° complete circle
 * - Exact Bend mode
 * - Exact Radius mode
 * - Arc-length positioning
 * - Automatic text fitting
 * - Responsive SVG
 * - Typography controls
 * - Stroke controls
 * - Background controls
 * - Direction / flip
 * - Alignment
 * - Static-renderer safe
 * - Font-aware text measurement
 * - Resize-safe layout
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 300
 */

import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ============================================================
   CONSTANTS
   ============================================================ */

const VIEWBOX = 1000
const CENTER = VIEWBOX / 2
const DEG = Math.PI / 180
const TAU = Math.PI * 2
const EPS = 0.000001

const PATH_LENGTH = 1000

const MIN_BEND = -360
const MAX_BEND = 360

const DEFAULT_TEXT = "CURVED TEXT"

/* ============================================================
   TYPES
   ============================================================ */

type CurveMode = "bend" | "radius"

type Direction = "leftToRight" | "rightToLeft"

type Alignment = "start" | "middle" | "end"

type TextCase = "none" | "uppercase" | "lowercase"

type FitMode = "off" | "arc"

interface Props {
    text: string

    font: any
    fontSize: number
    fontWeight: number
    letterSpacing: number
    textCase: TextCase

    bend: number
    curveMode: CurveMode
    radius: number

    arcWidth: number
    position: number
    offsetX: number
    offsetY: number

    direction: Direction
    flip: boolean
    alignment: Alignment

    arcOffset: number
    textOffset: number

    fitMode: FitMode
    fitAmount: number

    rotation: number

    color: string
    opacity: number

    stroke: string
    strokeWidth: number
    strokeOpacity: number

    background: string
    backgroundOpacity: number

    padding: string

    responsive: boolean

    showPath: boolean
    pathOpacity: number
    pathWidth: number

    ariaLabel: string

    style?: React.CSSProperties
}

interface ArcGeometry {
    path: string
    radius: number
    chord: number
    bend: number
    arcLength: number

    isStraight: boolean
    isCircle: boolean
    isMajor: boolean
}

/* ============================================================
   NUMERIC UTILITIES
   ============================================================ */

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function safeNumber(value: unknown, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : fallback
}

function positiveNumber(value: unknown, fallback: number): number {
    const result = safeNumber(value, fallback)

    return result > 0 ? result : fallback
}

/* ============================================================
   FONT UTILITIES
   ============================================================ */

function getFontFamily(font: any): string {
    if (typeof font === "string" && font.trim()) {
        return font
    }

    return font?.fontFamily || "Inter, sans-serif"
}

function getFontWeight(font: any, fallback: number): number {
    const value = Number(font?.fontWeight)

    return Number.isFinite(value) ? value : fallback
}

function getOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value : undefined
}

/* ============================================================
   TEXT UTILITIES
   ============================================================ */

function applyCase(value: string, textCase: TextCase): string {
    switch (textCase) {
        case "uppercase":
            return value.toUpperCase()

        case "lowercase":
            return value.toLowerCase()

        default:
            return value
    }
}

/* ============================================================
   ID UTILITIES
   ============================================================ */

function createSafeId(value: string): string {
    const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "")

    return cleaned || "default"
}

/* ============================================================
   STRAIGHT PATH
   ============================================================ */

function createStraightPath(
    centerX: number,
    centerY: number,
    chord: number,
    reverse: boolean
): ArcGeometry {
    const safeChord = Math.max(safeNumber(chord, 1), 1)

    const half = safeChord / 2

    const left = centerX - half

    const right = centerX + half

    const startX = reverse ? right : left

    const endX = reverse ? left : right

    return {
        path: `M ${startX} ${centerY} ` + `L ${endX} ${centerY}`,

        radius: Infinity,

        chord: safeChord,

        bend: 0,

        arcLength: safeChord,

        isStraight: true,

        isCircle: false,

        isMajor: false,
    }
}

/* ============================================================
   FULL CIRCLE PATH
   ============================================================ */

function createFullCirclePath(
    centerX: number,
    centerY: number,
    radius: number,
    clockwise: boolean
): string {
    const safeRadius = Math.max(positiveNumber(radius, 1), 1)

    const startX = centerX + safeRadius

    const oppositeX = centerX - safeRadius

    const sweep = clockwise ? 1 : 0

    return [
        `M ${startX} ${centerY}`,

        `A ${safeRadius} ${safeRadius} 0 1 ${sweep} ${oppositeX} ${centerY}`,

        `A ${safeRadius} ${safeRadius} 0 1 ${sweep} ${startX} ${centerY}`,
    ].join(" ")
}

/* ============================================================
   ARC GEOMETRY
   ============================================================ */

function createArcGeometry({
    bend,
    chord,
    centerX,
    centerY,
    curveMode,
    radius,
    reverse,
}: {
    bend: number
    chord: number
    centerX: number
    centerY: number
    curveMode: CurveMode
    radius: number
    reverse: boolean
}): ArcGeometry {
    const requestedBend = clamp(safeNumber(bend, 0), MIN_BEND, MAX_BEND)

    const safeChord = Math.max(safeNumber(chord, 1), 1)

    /* --------------------------------------------------------
       STRAIGHT
       -------------------------------------------------------- */

    if (Math.abs(requestedBend) < 0.0001) {
        return createStraightPath(centerX, centerY, safeChord, reverse)
    }

    /* --------------------------------------------------------
       FULL CIRCLE
       -------------------------------------------------------- */

    if (Math.abs(requestedBend) >= 359.999) {
        const circleRadius =
            curveMode === "radius"
                ? Math.max(positiveNumber(radius, 300), 1)
                : Math.max(safeChord / 2, 1)

        let clockwise = requestedBend > 0

        if (reverse) {
            clockwise = !clockwise
        }

        return {
            path: createFullCirclePath(
                centerX,
                centerY,
                circleRadius,
                clockwise
            ),

            radius: circleRadius,

            chord: safeChord,

            bend: requestedBend >= 0 ? 360 : -360,

            arcLength: TAU * circleRadius,

            isStraight: false,

            isCircle: true,

            isMajor: false,
        }
    }

    /* --------------------------------------------------------
       RADIUS
       -------------------------------------------------------- */

    let actualRadius: number
    let actualBend: number

    if (curveMode === "radius") {
        const requestedRadius = Math.max(
            positiveNumber(radius, 300),
            safeChord / 2 + 0.0001
        )

        actualRadius = requestedRadius

        const ratio = clamp(safeChord / (2 * actualRadius), 0, 1)

        const minorAngle = 2 * Math.asin(ratio)

        const requestedMagnitude = Math.abs(requestedBend)

        /*
         * For a radius, the same
         * radius can describe either
         * the minor or major arc.
         */
        const actualMagnitude =
            requestedMagnitude > 180 ? TAU - minorAngle : minorAngle

        actualBend = Math.sign(requestedBend) * (actualMagnitude / DEG)
    } else {
        /* --------------------------------------------------------
       EXACT BEND
       -------------------------------------------------------- */
        const absoluteAngle = clamp(
            Math.abs(requestedBend) * DEG,
            EPS,
            TAU - EPS
        )

        const sine = Math.sin(absoluteAngle / 2)

        actualRadius = safeChord / Math.max(2 * Math.abs(sine), EPS)

        actualBend = requestedBend
    }

    /* --------------------------------------------------------
       FINAL SAFETY
       -------------------------------------------------------- */

    actualRadius = Math.max(
        positiveNumber(actualRadius, safeChord / 2),
        safeChord / 2 + 0.0001
    )

    const absoluteAngle = clamp(Math.abs(actualBend) * DEG, EPS, TAU - EPS)

    const isMajor = Math.abs(actualBend) > 180

    /* --------------------------------------------------------
       ENDPOINTS
       -------------------------------------------------------- */

    const halfChord = safeChord / 2

    const left = centerX - halfChord

    const right = centerX + halfChord

    const startX = reverse ? right : left

    const endX = reverse ? left : right

    /* --------------------------------------------------------
       DIRECTION
       -------------------------------------------------------- */

    let clockwise = actualBend > 0

    if (reverse) {
        clockwise = !clockwise
    }

    const sweep = clockwise ? 1 : 0

    const largeArc = isMajor ? 1 : 0

    /* --------------------------------------------------------
       ARC PATH
       -------------------------------------------------------- */

    const path =
        `M ${startX} ${centerY} ` +
        `A ${actualRadius} ${actualRadius} ` +
        `0 ${largeArc} ${sweep} ` +
        `${endX} ${centerY}`

    const arcLength = actualRadius * absoluteAngle

    return {
        path,

        radius: actualRadius,

        chord: safeChord,

        bend: actualBend,

        arcLength: Number.isFinite(arcLength) ? arcLength : safeChord,

        isStraight: false,

        isCircle: false,

        isMajor,
    }
}

/* ============================================================
   NORMALIZED PATH OFFSET
   ============================================================ */

function degreesToPathOffset(degrees: number): number {
    return (degrees / 360) * PATH_LENGTH
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function ArcCurvedTextPro(props: Props) {
    const isStatic = useIsStaticRenderer()

    /* ========================================================
       NORMALIZED PROPS
       ======================================================== */

    const rawText = typeof props.text === "string" ? props.text : DEFAULT_TEXT

    const font = props.font || {
        fontFamily: "Inter",
        fontWeight: 600,
    }

    const safeFontSize = clamp(safeNumber(props.fontSize, 64), 4, 300)

    const safeFontWeight = clamp(
        getFontWeight(font, safeNumber(props.fontWeight, 600)),
        100,
        900
    )

    const safeLetterSpacing = clamp(
        safeNumber(props.letterSpacing, 0),
        -50,
        150
    )

    const safeBend = clamp(safeNumber(props.bend, 45), MIN_BEND, MAX_BEND)

    const safeRadius = Math.max(positiveNumber(props.radius, 300), 1)

    const safeArcWidth = clamp(safeNumber(props.arcWidth, 90), 10, 100)

    const safePosition = clamp(safeNumber(props.position, 50), 0, 100)

    const safeOffsetX = clamp(safeNumber(props.offsetX, 0), -500, 500)

    const safeOffsetY = clamp(safeNumber(props.offsetY, 0), -500, 500)

    const safeArcOffset = clamp(safeNumber(props.arcOffset, 0), -360, 360)

    const safeTextOffset = clamp(safeNumber(props.textOffset, 0), -300, 300)

    const safeFitAmount = clamp(safeNumber(props.fitAmount, 90), 10, 100)

    const safeRotation = safeNumber(props.rotation, 0)

    const safeOpacity = clamp(safeNumber(props.opacity, 1), 0, 1)

    const safeStrokeWidth = clamp(safeNumber(props.strokeWidth, 0), 0, 30)

    const safeStrokeOpacity = clamp(safeNumber(props.strokeOpacity, 0), 0, 1)

    const safeBackgroundOpacity = clamp(
        safeNumber(props.backgroundOpacity, 0),
        0,
        1
    )

    const safePathOpacity = clamp(safeNumber(props.pathOpacity, 0.25), 0, 1)

    const safePathWidth = clamp(safeNumber(props.pathWidth, 2), 0.5, 10)

    const textCase = props.textCase || "uppercase"

    const curveMode = props.curveMode || "bend"

    const direction = props.direction || "leftToRight"

    const alignment = props.alignment || "middle"

    const fitMode = props.fitMode || "arc"

    const displayText = applyCase(rawText, textCase)

    /* ========================================================
       FONT
       ======================================================== */

    const fontFamily = getFontFamily(font)

    const fontStyle = getOptionalString(font?.fontStyle)

    const fontStretch = getOptionalString(font?.fontStretch)

    const fontVariant = getOptionalString(font?.fontVariant)

    /* ========================================================
       STABLE ID
       ======================================================== */

    const reactId = React.useId()

    const pathId = `arc-curved-text-${createSafeId(reactId)}`

    /* ========================================================
       CONTENT BOX
       ======================================================== */

    const margin = 60

    const availableWidth = VIEWBOX - margin * 2

    const chord = availableWidth * (safeArcWidth / 100)

    const travel = availableWidth - chord

    const chordCenterX =
        margin + chord / 2 + travel * (safePosition / 100) + safeOffsetX

    const chordCenterY = CENTER + safeOffsetY

    /* ========================================================
       DIRECTION
       ======================================================== */

    const reverse =
        direction === "rightToLeft" ? !Boolean(props.flip) : Boolean(props.flip)

    /* ========================================================
       GEOMETRY
       ======================================================== */

    const geometry = React.useMemo(
        () =>
            createArcGeometry({
                bend: safeBend,

                chord,

                centerX: chordCenterX,

                centerY: chordCenterY,

                curveMode,

                radius: safeRadius,

                reverse,
            }),
        [
            safeBend,
            chord,
            chordCenterX,
            chordCenterY,
            curveMode,
            safeRadius,
            reverse,
        ]
    )

    /* ========================================================
       TEXT MEASUREMENT
       ======================================================== */

    const measurementRef = React.useRef<SVGTextElement | null>(null)

    const [measuredTextLength, setMeasuredTextLength] = React.useState(0)

    const measureText = React.useCallback(() => {
        if (isStatic) {
            return
        }

        const element = measurementRef.current

        if (!element) {
            return
        }

        try {
            const length = element.getComputedTextLength()

            if (Number.isFinite(length) && length >= 0) {
                setMeasuredTextLength((previous) =>
                    Math.abs(previous - length) < 0.1 ? previous : length
                )
            }
        } catch {
            // SVG measurement can fail
            // during initial mounting.
        }
    }, [isStatic])

    /* ========================================================
       FONT-AWARE MEASUREMENT
       ======================================================== */

    React.useLayoutEffect(() => {
        if (isStatic) {
            return
        }

        let cancelled = false

        const runMeasurement = () => {
            if (cancelled) {
                return
            }

            measureText()
        }

        const frame = requestAnimationFrame(runMeasurement)

        let removeFontListener: (() => void) | undefined

        /*
         * Re-measure after web fonts
         * finish loading.
         */
        if (typeof document !== "undefined" && "fonts" in document) {
            const fonts = document.fonts

            fonts.ready.then(() => {
                if (!cancelled) {
                    measureText()
                }
            })

            const fontSet = fonts as FontFaceSet & {
                addEventListener?: (
                    type: string,
                    listener: EventListener
                ) => void

                removeEventListener?: (
                    type: string,
                    listener: EventListener
                ) => void
            }

            if (fontSet.addEventListener) {
                const listener = () => {
                    measureText()
                }

                fontSet.addEventListener("loadingdone", listener)

                removeFontListener = () => {
                    fontSet.removeEventListener?.("loadingdone", listener)
                }
            }
        }

        return () => {
            cancelled = true

            cancelAnimationFrame(frame)

            removeFontListener?.()
        }
    }, [
        isStatic,
        measureText,
        displayText,
        fontFamily,
        fontStyle,
        fontStretch,
        fontVariant,
        safeFontSize,
        safeFontWeight,
        safeLetterSpacing,
    ])

    /* ========================================================
       TEXT FITTING
       ======================================================== */

    const availableTextLength = Math.max(
        geometry.arcLength * (safeFitAmount / 100),
        1
    )

    const shouldFit =
        fitMode === "arc" &&
        !isStatic &&
        measuredTextLength > 0 &&
        measuredTextLength > availableTextLength

    const fittedTextLength = shouldFit ? availableTextLength : undefined

    const lengthAdjust = shouldFit ? "spacingAndGlyphs" : undefined

    /* ========================================================
       ALIGNMENT
       ======================================================== */

    const textAnchor =
        alignment === "start" ? "start" : alignment === "end" ? "end" : "middle"

    /*
     * PathLength is normalized to 1000.
     *
     * Start:
     * 0
     *
     * Center:
     * 500
     *
     * End:
     * 1000
     */
    let alignmentOffset = PATH_LENGTH / 2

    if (alignment === "start") {
        alignmentOffset = 0
    }

    if (alignment === "end") {
        alignmentOffset = PATH_LENGTH
    }

    /*
     * Arc Offset is intentionally
     * independent from alignment.
     */
    const arcOffsetUnits = degreesToPathOffset(safeArcOffset)

    const startOffset = alignmentOffset + arcOffsetUnits

    /* ========================================================
       ACCESSIBILITY
       ======================================================== */

    const safeAriaLabel =
        typeof props.ariaLabel === "string" && props.ariaLabel.trim()
            ? props.ariaLabel.trim()
            : displayText || "Curved text"

    /* ========================================================
       COLORS
       ======================================================== */

    const backgroundColor = props.background || "#FFFFFF"

    const textColor = props.color || "#000000"

    const strokeColor = props.stroke || "#000000"

    /* ========================================================
       TEXT STYLE
       ======================================================== */

    const textStyle: React.CSSProperties = {
        fontFamily,

        fontSize: `${safeFontSize}px`,

        fontWeight: safeFontWeight,

        letterSpacing: `${safeLetterSpacing}px`,

        fontStyle,

        fontStretch: fontStretch as any,

        fontVariant,

        userSelect: "none",

        WebkitUserSelect: "none",

        pointerEvents: "none",

        textRendering: "geometricPrecision",
    }

    /* ========================================================
       RENDER
       ======================================================== */

    return (
        <div
            style={{
                width: "100%",
                height: "100%",

                minWidth: 0,
                minHeight: 0,

                position: "relative",

                boxSizing: "border-box",

                overflow: "visible",

                padding: props.padding || "0px",

                ...props.style,
            }}
        >
            {/* =================================================
                BACKGROUND
                ================================================= */}

            {safeBackgroundOpacity > 0 && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",

                        inset: 0,

                        background: backgroundColor,

                        opacity: safeBackgroundOpacity,

                        pointerEvents: "none",

                        zIndex: 0,
                    }}
                />
            )}

            {/* =================================================
                SVG
                ================================================= */}

            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1000 1000"
                preserveAspectRatio={
                    props.responsive ? "xMidYMid meet" : "none"
                }
                role="img"
                aria-label={safeAriaLabel}
                style={{
                    position: "relative",

                    zIndex: 1,

                    width: "100%",
                    height: "100%",

                    display: "block",

                    overflow: "visible",

                    transform: `rotate(${safeRotation}deg)`,

                    transformOrigin: "50% 50%",

                    userSelect: "none",

                    WebkitUserSelect: "none",

                    pointerEvents: "none",

                    textRendering: "geometricPrecision",
                }}
            >
                <defs>
                    <path
                        id={pathId}
                        d={geometry.path}
                        fill="none"
                        pathLength={PATH_LENGTH}
                    />
                </defs>

                {/* =================================================
                    MEASUREMENT TEXT

                    Kept completely out of the visible
                    rendering area.
                    ================================================= */}

                {!isStatic && (
                    <text
                        ref={measurementRef}
                        x="-10000"
                        y="-10000"
                        visibility="hidden"
                        aria-hidden="true"
                        fontFamily={fontFamily}
                        fontSize={safeFontSize}
                        fontWeight={safeFontWeight}
                        fontStyle={fontStyle}
                        fontStretch={fontStretch}
                        fontVariant={fontVariant}
                        letterSpacing={safeLetterSpacing}
                    >
                        {displayText}
                    </text>
                )}

                {/* =================================================
                    DEBUG PATH
                    ================================================= */}

                {props.showPath && (
                    <path
                        d={geometry.path}
                        fill="none"
                        stroke={textColor}
                        strokeWidth={safePathWidth}
                        strokeOpacity={safePathOpacity}
                        vectorEffect="non-scaling-stroke"
                        pointerEvents="none"
                    />
                )}

                {/* =================================================
                    CURVED TEXT
                    ================================================= */}

                {displayText && (
                    <text
                        fill={textColor}
                        fillOpacity={safeOpacity}
                        stroke={safeStrokeWidth > 0 ? strokeColor : "none"}
                        strokeWidth={safeStrokeWidth}
                        strokeOpacity={
                            safeStrokeWidth > 0 ? safeStrokeOpacity : 0
                        }
                        paintOrder="stroke fill"
                        fontFamily={fontFamily}
                        fontSize={safeFontSize}
                        fontWeight={safeFontWeight}
                        fontStyle={fontStyle}
                        fontStretch={fontStretch}
                        fontVariant={fontVariant}
                        letterSpacing={safeLetterSpacing}
                        textAnchor={textAnchor}
                        dominantBaseline="middle"
                        textLength={fittedTextLength}
                        lengthAdjust={lengthAdjust}
                        style={textStyle}
                    >
                        <textPath
                            href={`#${pathId}`}
                            startOffset={`${startOffset}`}
                            dy={safeTextOffset}
                        >
                            {displayText}
                        </textPath>
                    </text>
                )}
            </svg>
        </div>
    )
}

/* ============================================================
   PROPERTY CONTROLS
   ============================================================ */

addPropertyControls(ArcCurvedTextPro, {
    /* ======================================================
           CONTENT
           ====================================================== */

    text: {
        type: ControlType.String,

        title: "Text",

        defaultValue: DEFAULT_TEXT,

        displayTextArea: true,

        maxLength: 500,
    },

    font: {
        type: ControlType.Font,

        title: "Font",

        defaultValue: {
            fontFamily: "Inter",

            fontWeight: 600,
        },

        controls: "extended",
    },

    fontSize: {
        type: ControlType.Number,

        title: "Size",

        min: 4,
        max: 300,
        step: 1,

        unit: "px",

        defaultValue: 64,
    },

    fontWeight: {
        type: ControlType.Number,

        title: "Weight",

        min: 100,
        max: 900,
        step: 100,

        defaultValue: 600,
    },

    letterSpacing: {
        type: ControlType.Number,

        title: "Tracking",

        min: -30,
        max: 100,
        step: 0.5,

        unit: "px",

        defaultValue: 0,
    },

    textCase: {
        type: ControlType.Enum,

        title: "Case",

        options: ["none", "uppercase", "lowercase"],

        optionTitles: ["Original", "Uppercase", "Lowercase"],

        defaultValue: "uppercase",
    },

    /* ======================================================
           ARC
           ====================================================== */

    bend: {
        type: ControlType.Number,

        title: "Bend",

        min: -360,
        max: 360,
        step: 1,

        unit: "°",

        defaultValue: 45,

        description:
            "0° is straight. ±180° creates a semicircle. ±270° creates a major arc. ±360° creates a circle.",
    },

    curveMode: {
        type: ControlType.Enum,

        title: "Curve Mode",

        options: ["bend", "radius"],

        optionTitles: ["Exact Bend", "Exact Radius"],

        defaultValue: "bend",
    },

    radius: {
        type: ControlType.Number,

        title: "Radius",

        min: 10,
        max: 1000,
        step: 1,

        unit: "px",

        defaultValue: 300,

        hidden: (props) => props.curveMode !== "radius",

        description:
            "Controls the radius of the curve. The radius is automatically constrained to remain geometrically valid.",
    },

    arcWidth: {
        type: ControlType.Number,

        title: "Arc Width",

        min: 10,
        max: 100,
        step: 1,

        unit: "%",

        defaultValue: 90,
    },

    position: {
        type: ControlType.Number,

        title: "Position",

        min: 0,
        max: 100,
        step: 1,

        unit: "%",

        defaultValue: 50,
    },

    offsetX: {
        type: ControlType.Number,

        title: "X",

        min: -500,
        max: 500,
        step: 1,

        unit: "px",

        defaultValue: 0,
    },

    offsetY: {
        type: ControlType.Number,

        title: "Y",

        min: -500,
        max: 500,
        step: 1,

        unit: "px",

        defaultValue: 0,
    },

    direction: {
        type: ControlType.Enum,

        title: "Direction",

        options: ["leftToRight", "rightToLeft"],

        optionTitles: ["Left → Right", "Right → Left"],

        defaultValue: "leftToRight",
    },

    flip: {
        type: ControlType.Boolean,

        title: "Flip",

        defaultValue: false,
    },

    alignment: {
        type: ControlType.Enum,

        title: "Align",

        options: ["start", "middle", "end"],

        optionTitles: ["Start", "Center", "End"],

        defaultValue: "middle",
    },

    arcOffset: {
        type: ControlType.Number,

        title: "Arc Offset",

        min: -360,
        max: 360,
        step: 1,

        unit: "°",

        defaultValue: 0,

        description:
            "Moves the text around the available curve. 360° equals one full path traversal.",
    },

    textOffset: {
        type: ControlType.Number,

        title: "Text Y",

        min: -300,
        max: 300,
        step: 1,

        unit: "px",

        defaultValue: 0,
    },

    /* ======================================================
           TEXT FIT
           ====================================================== */

    fitMode: {
        type: ControlType.Enum,

        title: "Text Fit",

        options: ["off", "arc"],

        optionTitles: ["Off", "Fit Arc"],

        defaultValue: "arc",
    },

    fitAmount: {
        type: ControlType.Number,

        title: "Fit Amount",

        min: 10,
        max: 100,
        step: 1,

        unit: "%",

        defaultValue: 90,

        hidden: (props) => props.fitMode !== "arc",
    },

    /* ======================================================
           TRANSFORM
           ====================================================== */

    rotation: {
        type: ControlType.Number,

        title: "Rotation",

        min: -360,
        max: 360,
        step: 1,

        unit: "°",

        defaultValue: 0,
    },

    /* ======================================================
           STYLE
           ====================================================== */

    color: {
        type: ControlType.Color,

        title: "Color",

        defaultValue: "#000000",
    },

    opacity: {
        type: ControlType.Number,

        title: "Opacity",

        min: 0,
        max: 1,
        step: 0.01,

        defaultValue: 1,
    },

    stroke: {
        type: ControlType.Color,

        title: "Stroke",

        defaultValue: "#000000",
    },

    strokeWidth: {
        type: ControlType.Number,

        title: "Stroke Width",

        min: 0,
        max: 30,
        step: 0.5,

        unit: "px",

        defaultValue: 0,
    },

    strokeOpacity: {
        type: ControlType.Number,

        title: "Stroke Opacity",

        min: 0,
        max: 1,
        step: 0.01,

        defaultValue: 0,
    },

    /* ======================================================
           CONTAINER
           ====================================================== */

    background: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: "#FFFFFF",
    },

    backgroundOpacity: {
        type: ControlType.Number,

        title: "BG Opacity",

        min: 0,
        max: 1,
        step: 0.01,

        defaultValue: 0,
    },

    padding: {
        type: ControlType.Padding,

        title: "Padding",

        defaultValue: "0px",
    },

    responsive: {
        type: ControlType.Boolean,

        title: "Responsive",

        defaultValue: true,
    },

    /* ======================================================
           DEBUG
           ====================================================== */

    showPath: {
        type: ControlType.Boolean,

        title: "Show Path",

        defaultValue: false,
    },

    pathOpacity: {
        type: ControlType.Number,

        title: "Path Opacity",

        min: 0,
        max: 1,
        step: 0.01,

        defaultValue: 0.25,

        hidden: (props) => !props.showPath,
    },

    pathWidth: {
        type: ControlType.Number,

        title: "Path Width",

        min: 0.5,
        max: 10,
        step: 0.5,

        unit: "px",

        defaultValue: 2,

        hidden: (props) => !props.showPath,
    },

    /* ======================================================
           ACCESSIBILITY
           ====================================================== */

    ariaLabel: {
        type: ControlType.String,

        title: "ARIA Label",

        defaultValue: "Curved text visualization",

        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
