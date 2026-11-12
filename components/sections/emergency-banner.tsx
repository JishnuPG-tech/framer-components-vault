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


const FONT_FALLBACK = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

/**
 * Kerbkit · Emergency banner: a 24/7 call-out strip with the phone number.
 * @framerIntrinsicWidth 1200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
type Props = {
    heading?: string
    detail?: string
    phone?: string
    buttonPrefix?: string
    background?: string
    text?: string
    buttonBackground?: string
    buttonText?: string
    font?: React.CSSProperties
    style?: React.CSSProperties
}

export default function EmergencyBanner({
    heading = "Burst pipe or no power? Call us any hour.",
    detail = "Emergency service 24 hours a day, 7 days a week.",
    phone = "(555) 010-0199",
    buttonPrefix = "Call",
    background = "#A93A1E",
    text = "#FFFFFF",
    buttonBackground = "#FFFFFF",
    buttonText = "#7A2812",
    font,
    style,
}: Props) {
    return (
        <aside aria-label="Emergency contact" style={{ ...style, boxSizing: "border-box", width: "100%", background, color: text, fontFamily: FONT_FALLBACK, ...font, padding: "16px 24px" }}>
            <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px 24px" }}>
                <div style={{ flex: "1 1 280px" }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "clamp(1.125rem, 2.4vw, 1.375rem)" }}>{heading}</p>
                    {detail ? <p style={{ margin: "4px 0 0", fontSize: 15 }}>{detail}</p> : null}
                </div>
                <a href={"tel:" + phone.replace(/[^+\d]/g, "")} style={{ display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 22px", borderRadius: 10, background: buttonBackground, color: buttonText, fontWeight: 700, fontSize: 18, textDecoration: "none" }}>
                    {buttonPrefix} {phone}
                </a>
            </div>
        </aside>
    )
}

addPropertyControls(EmergencyBanner, {
    heading: { type: ControlType.String, title: "Heading", defaultValue: "Burst pipe or no power? Call us any hour." },
    detail: { type: ControlType.String, title: "Detail", defaultValue: "Emergency service 24 hours a day, 7 days a week." },
    phone: { type: ControlType.String, title: "Phone", defaultValue: "(555) 010-0199" },
    buttonPrefix: { type: ControlType.String, title: "Button prefix", defaultValue: "Call" },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#A93A1E" },
    text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    buttonBackground: { type: ControlType.Color, title: "Button", defaultValue: "#FFFFFF" },
    buttonText: { type: ControlType.Color, title: "Button text", defaultValue: "#7A2812" },
})
