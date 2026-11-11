// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function CopyrightYear(props) {
    const { prefix, suffix, gap, font, color, textAlign, width, height } = props

    const year = new Date().getFullYear()
    const parts = [prefix, String(year), suffix].filter(Boolean)

    return (
        <div
            style={{
                width,
                height,
                display: "flex",
                alignItems: "center",
                justifyContent:
                    textAlign === "left"
                        ? "flex-start"
                        : textAlign === "right"
                          ? "flex-end"
                          : "center",
                ...font,
                color,
                whiteSpace: "nowrap",
            }}
        >
            {parts.map((part, index) => (
                <span key={index}>
                    {index > 0 && (
                        <span style={{ display: "inline-block", width: gap }} />
                    )}
                    {part}
                </span>
            ))}
        </div>
    )
}

CopyrightYear.defaultProps = {
    prefix: "©",
    suffix: "Your Business Name",
    gap: 6,
    color: "#000000",
    textAlign: "center",
}

addPropertyControls(CopyrightYear, {
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "©",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "Your Business Name",
    },
    gap: {
        type: ControlType.Number,
        title: "Spacing (px)",
        defaultValue: 6,
        min: 0,
        max: 60,
        step: 1,
        displayStepper: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    color: {
        type: ControlType.Color,
        title: "Font Colour",
        defaultValue: "#000000",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
})
