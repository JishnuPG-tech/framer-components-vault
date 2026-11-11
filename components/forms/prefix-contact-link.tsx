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


type Props = {
    form: "Link" | "Button"
    ghost: boolean
    radius: number

    padding: number
    paddingPerSide: boolean
    paddingTop: number
    paddingRight: number
    paddingBottom: number
    paddingLeft: number

    font: any
    underlineOnHover: boolean
    linkColor: string
    linkHoverColor: string
    buttonTextColor: string
    ghostColor: string
    buttonHoverColor: string
    fill: string
    type: "Email" | "Phone"
    value: string
    subject: string

    width?: number
    height?: number
}

export default function PrefixContactLink({
    form,
    ghost,
    radius,
    padding,

    paddingPerSide,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,

    font = {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: 20,
        lineHeight: 1,
        letterSpacing: 0,
    },
    underlineOnHover,
    linkColor,
    linkHoverColor,
    buttonTextColor,
    ghostColor,
    buttonHoverColor,
    fill,
    type,
    value,
    subject,
}: Props) {
    const isEmail = type === "Email"
    const isButton = form === "Button"
    const defaultEmail = "name@gmail.com"
    const defaultPhone = "+421 000 222 333"

    const effectiveValue =
        value?.trim() || (isEmail ? defaultEmail : defaultPhone)
    const displayText = effectiveValue

    let href = ""
    if (isEmail) {
        const baseHref = `mailto:${effectiveValue}`
        const subjectParam = subject?.trim()
            ? `?subject=${encodeURIComponent(subject)}`
            : ""
        href = baseHref + subjectParam
    } else {
        href = `tel:${effectiveValue}`
    }

    const [hovered, setHovered] = React.useState(false)

    // Font defaults
    const fontStyles = {
        fontFamily: font?.fontFamily || "Inter",
        fontSize: font?.fontSize || 20,
        fontWeight: font?.fontWeight || 400,
        lineHeight: font?.lineHeight || 1,
        letterSpacing: font?.letterSpacing || 0,
        textAlign: font?.textAlign || "left",
    }

    // Animation
    const transitionStyle = "all 0.15s ease"

    const cssPadding = paddingPerSide
        ? `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
        : `${padding}px`

    const getLinkStyle = (): React.CSSProperties => ({
        width: "100%",
        height: "100%",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        borderRadius: 0,
        ...fontStyles,
        backgroundColor: "transparent",
        color: hovered ? linkHoverColor : linkColor,
        border: "none",
        boxSizing: "border-box",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow:
            underlineOnHover && hovered
                ? `inset 0px -1px 0px ${linkHoverColor}`
                : "none",
        whiteSpace: "nowrap",
        transition: transitionStyle,
    })

    const getButtonStyle = (): React.CSSProperties => {
        if (ghost) {
            return {
                width: "100%",
                height: "100%",
                padding: cssPadding,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${radius}px`,
                ...fontStyles,
                backgroundColor: "transparent",
                color: hovered ? buttonHoverColor : ghostColor,
                border: `1px solid ${hovered ? buttonHoverColor : ghostColor}`,
                boxSizing: "border-box",
                cursor: "pointer",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: transitionStyle,
            }
        } else {
            return {
                width: "100%",
                height: "100%",
                padding: cssPadding,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${radius}px`,
                ...fontStyles,
                backgroundColor: hovered ? buttonHoverColor : fill,
                color: buttonTextColor,
                border: "none",
                boxSizing: "border-box",
                cursor: "pointer",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: transitionStyle,
            }
        }
    }

    const style = isButton ? getButtonStyle() : getLinkStyle()

    return (
        <a
            href={href}
            style={style}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {displayText}
        </a>
    )
}

PrefixContactLink.defaultProps = {
    width: 240,
    height: 48,
    padding: 12,
    paddingPerSide: false,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12,
}

addPropertyControls(PrefixContactLink, {
    form: {
        type: ControlType.Enum,
        title: "Form",
        options: ["Link", "Button"],
        optionTitles: ["Link", "Button"],
        defaultValue: "Link",
    },
    type: {
        type: ControlType.Enum,
        title: "Type",
        options: ["Email", "Phone"],
        optionTitles: ["Email", "Phone"],
        defaultValue: "Email",
    },
    ghost: {
        type: ControlType.Boolean,
        title: "Ghost",
        defaultValue: false,
        hidden: (props) => props?.form !== "Button",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 50,
        defaultValue: 4,
        step: 1,
        unit: "",
        hidden: (props) => props?.form !== "Button",
    },

    padding: {
        type: ControlType.FusedNumber,
        title: "Padding",
        defaultValue: 12,
        toggleKey: "paddingPerSide",
        toggleTitles: ["All", "Sides"],
        valueKeys: [
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        hidden: (props) => props?.form !== "Button",
    },
    value: {
        type: ControlType.String,
        title: "Value (CMS)",
        placeholder: "Enter contact...",
        defaultValue: "",
        description: "Here goes your data",
    },
    subject: {
        type: ControlType.String,
        title: "Email Subject",
        placeholder: "Enter email subject...",
        defaultValue: "",
        hidden: (props) => props?.type !== "Email",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    underlineOnHover: {
        type: ControlType.Boolean,
        title: "Underline on Hover",
        defaultValue: true,
        hidden: (props) => props?.form !== "Link",
    },
    linkColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#3657FF",
        hidden: (props) => props?.form !== "Link",
    },
    linkHoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#3657FF",
        hidden: (props) => props?.form !== "Link",
        description:
            "Component created by [Andrej Borský](https://tinyurl.com/borsky)",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => props?.form !== "Button" || props?.ghost === true,
    },
    ghostColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#3657FF",
        hidden: (props) => props?.form !== "Button" || props?.ghost !== true,
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#3A27D5",
        hidden: (props) => props?.form !== "Button" || props?.ghost === true,
    },
    buttonHoverColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#3657FF",
        hidden: (props) => props?.form !== "Button",
        description:
            "Component created by [Andrej Borský](https://tinyurl.com/borsky)",
    },
})
