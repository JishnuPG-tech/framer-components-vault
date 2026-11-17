// Autocopyright text layer with automatic year and editable name/company
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CopyrightTextProps {
    name: string
    prefix: string
    suffix: string
    color: string
    font: any
    style?: React.CSSProperties
    showIcon: boolean
    showName: boolean
}

/**
 * Autocopyright
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function CopyrightText(props: CopyrightTextProps) {
    const { name, prefix, suffix, color, font, style, showIcon, showName } =
        props
    const year = typeof window !== "undefined" ? new Date().getFullYear() : 2024
    return (
        <span
            style={{
                color,
                ...font,
                ...style,
                width: "max-content",
                minWidth: "max-content",
                display: "inline-block",
            }}
            aria-label={`Copyright ${year} ${name}`}
        >
            {prefix}
            {prefix && " "}
            {showIcon && "©"} {year} {showName && name}
            {suffix && " "}
            {suffix}
        </span>
    )
}

addPropertyControls(CopyrightText, {
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "ACME",
        placeholder: "Company or Name",
    },
    showIcon: {
        type: ControlType.Boolean,
        title: "Show ©",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showName: {
        type: ControlType.Boolean,
        title: "Show Name",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "Prefix (optional)",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "Suffix (optional)",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
})
