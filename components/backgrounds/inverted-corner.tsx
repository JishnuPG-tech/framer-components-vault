// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


function parsePadding(padding: any): {
    top: number
    right: number
    bottom: number
    left: number
} {
    if (!padding || typeof padding !== "string")
        return { top: 0, right: 0, bottom: 0, left: 0 }
    const parts = padding
        .trim()
        .split(/\s+/)
        .map((v) => Math.max(0, parseFloat(v) || 0))
    if (parts.length === 1)
        return {
            top: parts[0],
            right: parts[0],
            bottom: parts[0],
            left: parts[0],
        }
    if (parts.length === 2)
        return {
            top: parts[0],
            right: parts[1],
            bottom: parts[0],
            left: parts[1],
        }
    if (parts.length === 3)
        return {
            top: parts[0],
            right: parts[1],
            bottom: parts[2],
            left: parts[1],
        }
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
}

function buildPath(
    R: number,
    top: number,
    right: number,
    bottom: number,
    left: number,
    corner: string
): string {
    const W = R + left + right
    const H = R + top + bottom

    switch (corner) {
        case "top-left":
            return `M ${left + R},${top} L ${W},${top} L ${W},${H} L ${left},${H} L ${left},${top + R} A ${R} ${R} 0 0 0 ${left + R},${top} Z`
        case "top-right":
            return `M 0,${top} L ${W - right - R},${top} A ${R} ${R} 0 0 0 ${W - right},${top + R} L ${W - right},${H} L 0,${H} Z`
        case "bottom-right":
            return `M 0,0 L ${W - right},0 L ${W - right},${H - bottom - R} A ${R} ${R} 0 0 0 ${W - right - R},${H - bottom} L 0,${H - bottom} Z`
        case "bottom-left":
            return `M ${left + R},${H - bottom} A ${R} ${R} 0 0 0 ${left},${H - bottom - R} L ${left},0 L ${W},0 L ${W},${H - bottom} Z`
        default:
            return ""
    }
}

const CORNER_ARROWS: Record<string, string> = {
    "top-left": "↖",
    "top-right": "↗",
    "bottom-right": "↘",
    "bottom-left": "↙",
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 24
 * @framerIntrinsicHeight 24
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CornerSmoother(props) {
    const { corner, fill, radius, padding, showLabel, labelColor } = props
    const isOnCanvas = useIsOnFramerCanvas()

    const { top, right, bottom, left } = parsePadding(padding)
    const W = radius + left + right
    const H = radius + top + bottom
    const pathData = buildPath(radius, top, right, bottom, left, corner)
    const labelSize = Math.min(32, Math.max(8, radius * 0.5))

    return (
        <div
            style={{
                width: W,
                height: H,
                fontSize: 0,
                lineHeight: 0,
                display: "block",
                pointerEvents: "none",
                overflow: "visible",
                padding: 0,
                margin: 0,
            }}
        >
            <svg
                width={W}
                height={H}
                viewBox={`0 0 ${W} ${H}`}
                style={{ display: "block" }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d={pathData} fill={fill} />
            </svg>
            {isOnCanvas && showLabel && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: labelSize,
                        lineHeight: 1,
                        color: labelColor ?? "#000000",
                        pointerEvents: "none",
                        userSelect: "none",
                        fontFamily: "sans-serif",
                    }}
                >
                    {CORNER_ARROWS[corner]}
                </div>
            )}
        </div>
    )
}

CornerSmoother.defaultProps = {
    corner: "top-left",
    fill: "#ffffff",
    radius: 24,
    padding: "0px 0px 0px 0px",
    showLabel: true,
    labelColor: "rgba(0,0,0,0.35)",
}

addPropertyControls(CornerSmoother, {
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 24,
        min: 1,
        max: 300,
        step: 1,
        unit: "px",
        description: "Match the border-radius of the adjacent element.",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px 0px 0px 0px",
        description: "Extra space around the notch on each side.",
    },
    corner: {
        type: ControlType.Enum,
        title: "Corner",
        options: ["top-left", "top-right", "bottom-right", "bottom-left"],
        optionTitles: ["Top Left", "Top Right", "Bottom Right", "Bottom Left"],
        defaultValue: "top-left",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
        description: "Which corner the notch cuts into.",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#ffffff",
        description:
            "Match the page background color behind the adjacent element.",
    },
    showLabel: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description: "Show the corner indicator arrow on canvas only.",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Arrow color",
        defaultValue: "rgba(0,0,0,0.35)",
        description: "Color of the canvas indicator arrow.",
        hidden(props) {
            return props.showLabel === false
        },
    },
})
