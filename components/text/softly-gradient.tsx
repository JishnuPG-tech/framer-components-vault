// GradientText.tsx — animated flowing gradient text for Framer
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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 110
 */
//@framerDisableUnlink
export default function SoftlyGradient(props) {
    const { text, font, colors, speed, animate, angle, align, style } = props
    // Freeze the gradient animation in static contexts (canvas, export, thumbnail).
    const isStatic = useIsStaticRenderer()
    const stops = (
        colors && colors.length ? colors : ["#2f6bff", "#7a5ae0"]
    ).join(",")
    const gradient = `linear-gradient(${angle}deg, ${stops}, ${(colors && colors[0]) || "#2f6bff"})`

    return (
        <div style={{ width: "100%", textAlign: align, ...style }}>
            <span
                style={{
                    ...font,
                    display: "inline-block",
                    backgroundImage: gradient,
                    backgroundSize: "300% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    animation:
                        animate && !isStatic
                            ? `gt-flow ${speed}s linear infinite`
                            : "none",
                }}
            >
                {text}
            </span>
            <style>{`@keyframes gt-flow{to{background-position:300% 0}}`}</style>
        </div>
    )
}

const fontDefault = {
    fontSize: 72,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    fontFamily: "Inter, sans-serif",
}

SoftlyGradient.defaultProps = {
    text: "Make it glow",
    font: fontDefault,
    colors: ["#2f6bff", "#7a5ae0", "#36d1c4"],
    speed: 6,
    animate: true,
    angle: 100,
    align: "left",
}

addPropertyControls(SoftlyGradient, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Make it glow",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: fontDefault,
    },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: ["#2f6bff", "#7a5ae0", "#36d1c4"],
        maxCount: 6,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 100,
        min: 0,
        max: 360,
        unit: "°",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 6,
        min: 1,
        max: 20,
        unit: "s",
        hidden: (p) => !p.animate,
        description:
            "More free & paid components at [Softly Supply](https://softly.supply)",
    },
})
