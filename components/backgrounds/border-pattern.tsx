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
 * @framerIntrinsicWidth auto
 * @framerIntrinsicHeight auto
 */
export default function BorderPattern(props) {
    const {
        dashLength,
        gapLength,
        strokeWidth,
        strokeColor,
        strokeLinecap,
        style,
    } = props

    const strokeDasharray = `${dashLength} ${gapLength}`

    const svgStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block",
    }

    return (
        <div style={{ ...style, position: "relative", overflow: "visible" }}>
            <svg style={svgStyle} preserveAspectRatio="none">
                <line
                    x1={strokeWidth / 2}
                    y1="0"
                    x2={strokeWidth / 2}
                    y2="100%"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap={strokeLinecap}
                />
                <line
                    x1={`calc(100% - ${strokeWidth / 2}px)`}
                    y1="0"
                    x2={`calc(100% - ${strokeWidth / 2}px)`}
                    y2="100%"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap={strokeLinecap}
                />
            </svg>
        </div>
    )
}

BorderPattern.defaultProps = {
    dashLength: 12,
    gapLength: 4,
    strokeWidth: 1,
    strokeColor: "#000000",
}

addPropertyControls(BorderPattern, {
    strokeColor: {
        type: ControlType.Color,
        title: "Color",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Thickness",
        min: 1,
        max: 20,
        displayStepper: true,
    },
    dashLength: {
        type: ControlType.Number,
        title: "Dash",
        description: "Set the length of each individual das",
        min: 1,
        max: 100,
    },
    gapLength: {
        type: ControlType.Number,
        title: "Gap",
        description: "Set the spacing between your dashes",
        min: 0,
        max: 100,
    },
})
