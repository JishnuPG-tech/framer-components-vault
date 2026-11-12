// Dynamic copyright component that automatically updates the year
import { useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface CopyrightProps {
    companyName: string
    startYear?: number
    showStartYear: boolean
    showCopyrightText: boolean
    copyrightTextPosition: "before" | "after"
    prefix: string
    suffix: string
    showAllRightsReserved: boolean
    font: CSSProperties
    textColor: string
    companyNameFont: CSSProperties
    companyNameColor: string
    enableCompanyLink: boolean
    companyLink: string
    textAlign: "left" | "center" | "right"
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Copyright(props: CopyrightProps) {
    const {
        companyName = "Your Company",
        startYear = 2020,
        showStartYear = true,
        showCopyrightText = false,
        copyrightTextPosition = "before",
        prefix = "",
        suffix = "",
        showAllRightsReserved = false,
        font,
        textColor,
        companyNameFont,
        companyNameColor,
        enableCompanyLink = false,
        companyLink = "",
        textAlign = "left",
    } = props

    const copyrightText = useMemo(() => {
        const currentYear = new Date().getFullYear()
        
        // Build the year part
        let yearPart = ""
        if (showStartYear && startYear && startYear < currentYear) {
            yearPart = `${startYear}-${currentYear}`
        } else {
            yearPart = `${currentYear}`
        }
        
        // Build copyright text part
        let copyrightPart = ""
        if (showCopyrightText) {
            if (copyrightTextPosition === "before") {
                copyrightPart = "Copyright "
            }
        }
        
        // Build main text with proper spacing
        let mainText = ""
        
        // Add prefix with gap if present
        if (prefix) {
            mainText += `${prefix} `
        }
        
        // Add copyright text before symbol if needed
        mainText += copyrightPart
        
        // Add symbol and year
        mainText += `© `
        
        // Add copyright text after symbol if needed
        if (showCopyrightText && copyrightTextPosition === "after") {
            mainText += "Copyright "
        }
        
        // Add year
        mainText += `${yearPart} `
        
        return { beforeCompany: mainText, afterCompany: "" }
    }, [startYear, showStartYear, showCopyrightText, copyrightTextPosition, prefix])

    const afterCompanyText = useMemo(() => {
        let afterText = ""
        
        // Add suffix with gap if present
        if (suffix) {
            afterText += ` ${suffix}`
        }
        
        // Add "All rights reserved." if needed
        if (showAllRightsReserved) {
            afterText += ". All rights reserved."
        }
        
        return afterText
    }, [suffix, showAllRightsReserved])

    const isFixedWidth = props?.style && props.style.width === "100%"

    const companyElement = enableCompanyLink && companyLink ? (
        <a
            href={companyLink}
            style={{
                color: companyNameColor,
                textDecoration: "none",
                ...companyNameFont,
            }}
        >
            {companyName}
        </a>
    ) : (
        <span
            style={{
                color: companyNameColor,
                ...companyNameFont,
            }}
        >
            {companyName}
        </span>
    )

    return (
        <span
            style={{
                ...props.style,
                color: textColor,
                display: "block",
                ...font,
                textAlign: textAlign, // Apply textAlign after font to ensure it's not overridden
            }}
        >
            {copyrightText.beforeCompany}
            {companyElement}
            {afterCompanyText}
        </span>
    )
}

addPropertyControls(Copyright, {
    companyName: {
        type: ControlType.String,
        title: "Company Name",
        defaultValue: "Your Company",
    },
    showStartYear: {
        type: ControlType.Boolean,
        title: "Show Start Year",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    startYear: {
        type: ControlType.Number,
        title: "Start Year",
        defaultValue: 2020,
        min: 1900,
        max: new Date().getFullYear(),
        step: 1,
        displayStepper: true,
        hidden: ({ showStartYear }) => !showStartYear,
    },
    showCopyrightText: {
        type: ControlType.Boolean,
        title: "Show 'Copyright' Text",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    copyrightTextPosition: {
        type: ControlType.Enum,
        title: "Copyright Text Position",
        options: ["before", "after"],
        optionTitles: ["Before Symbol", "After Symbol"],
        defaultValue: "before",
        displaySegmentedControl: true,
        hidden: ({ showCopyrightText }) => !showCopyrightText,
    },
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        placeholder: "Text before copyright...",
    },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        placeholder: "Text after company name...",
    },
    showAllRightsReserved: {
        type: ControlType.Boolean,
        title: "All Rights Reserved",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    companyNameColor: {
        type: ControlType.Color,
        title: "Company Name Color",
        defaultValue: "#000000",
    },
    companyNameFont: {
        type: ControlType.Font,
        title: "Company Name Font",
        defaultValue: {
            fontSize: "14px",
            variant: "Bold",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    enableCompanyLink: {
        type: ControlType.Boolean,
        title: "Enable Company Link",
        defaultValue: false,
        enabledTitle: "Enable",
        disabledTitle: "Disable",
    },
    companyLink: {
        type: ControlType.String,
        title: "Company Link",
        defaultValue: "https://example.com",
        placeholder: "https://example.com",
        hidden: ({ enableCompanyLink }) => !enableCompanyLink,
    },
})