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


const CSS =
    "@keyframes crt-flicker{0%{opacity:1}8%{opacity:.15}14%{opacity:1}22%{opacity:.3}26%{opacity:1}48%{opacity:.55}52%{opacity:1}100%{opacity:1}}" +
    "@keyframes crt-box-pulse{0%,100%{box-shadow:0 0 0 rgba(255,255,255,0),inset 0 0 0 rgba(255,255,255,0)}50%{box-shadow:0 0 22px rgba(255,255,255,.12),inset 0 0 14px rgba(255,255,255,.05)}}" +
    "@keyframes crt-text-pulse{0%,100%{text-shadow:0 0 0 rgba(255,255,255,0)}50%{text-shadow:0 0 6px rgba(255,255,255,.7),0 0 18px rgba(255,255,255,.3)}}" +
    "@media (prefers-reduced-motion:reduce){.crt-btn,.crt-btn *{animation:none!important}}"

interface Props {
    text: string
    link: string
    newTab: boolean
    font?: React.CSSProperties
    fontSize: number
    letterSpacing: number
    uppercase: boolean
    color: string
    hotColor: string
    glow: string
    framed: boolean
    borderColor: string
    padding: string
    pulse: boolean
    fullWidth: boolean
    style?: React.CSSProperties
}

/**
 * CRT Button: on hover every letter lights up and flickers at its own moment, like a neon tube catching.
 * Framed mode adds a border with corner ticks and an optional slow glow pulse.
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CRTButton(props: Props) {
    const { text, link, newTab, font, fontSize, letterSpacing, uppercase, color, hotColor, glow, framed, borderColor, padding, fullWidth } = props
    const pulse = props.pulse && !useIsStaticRenderer()
    const [hover, setHover] = React.useState(false)
    const chars: string[] = Array.from(text || "")
    const g = glow || hotColor
    const mix = (p: number) => "color-mix(in srgb, " + g + " " + p + "%, transparent)"
    const shadow = "0 0 4px " + mix(90) + ", 0 0 12px " + mix(55) + ", 0 0 28px " + mix(25)
    const fill = "color-mix(in srgb, " + hotColor + " 7%, transparent)"
    const typo: React.CSSProperties = { fontFamily: "Chakra Petch, sans-serif", fontWeight: 600, ...(font || {}), fontSize, letterSpacing: letterSpacing + "em", textTransform: uppercase ? "uppercase" : "none", lineHeight: 1.2 }
    const tick: React.CSSProperties = { position: "absolute", width: 7, height: 7, borderColor: hotColor, borderStyle: "solid", borderWidth: 0 }
    const frame: React.CSSProperties = framed
        ? { position: "relative", display: "inline-flex", width: fullWidth ? "100%" : undefined, justifyContent: "center", boxSizing: "border-box", padding, border: "1px solid " + (hover ? hotColor : borderColor), background: hover ? fill : "transparent", transition: "background .4s, border-color .4s", animation: pulse ? "crt-box-pulse 2.8s ease-in-out infinite" : undefined }
        : { display: "inline-flex" }
    const on = () => setHover(true)
    const off = () => setHover(false)
    return (
        <a
            className="crt-btn"
            href={link || undefined}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener" : undefined}
            onMouseEnter={on}
            onMouseLeave={off}
            onFocus={on}
            onBlur={off}
            style={{ ...props.style, textDecoration: "none", cursor: "pointer", display: "inline-flex", width: fullWidth ? "100%" : undefined }}
        >
            <style>{CSS}</style>
            <span style={frame}>
                {framed && <span style={{ ...tick, top: -1, left: -1, borderTopWidth: 1, borderLeftWidth: 1 }} />}
                {framed && <span style={{ ...tick, bottom: -1, right: -1, borderBottomWidth: 1, borderRightWidth: 1 }} />}
                <span style={{ ...typo, display: "inline-flex", whiteSpace: "nowrap" }}>
                    {chars.map((c, i) => (
                        <span
                            key={i}
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                transition: "text-shadow .3s, color .3s",
                                color: hover ? hotColor : color,
                                textShadow: hover ? shadow : undefined,
                                animation: hover ? "crt-flicker .7s steps(1, end) " + ((i * 37) % 160) / 1000 + "s 1 both" : pulse ? "crt-text-pulse 2.8s ease-in-out infinite" : undefined,
                            }}
                        >
                            {c}
                        </span>
                    ))}
                </span>
            </span>
        </a>
    )
}

CRTButton.defaultProps = { link: "", newTab: false, fontSize: 13, letterSpacing: 0.14, uppercase: true, color: "#d2d2d2", hotColor: "#ffffff", glow: "rgba(255,255,255,0.7)", framed: true, borderColor: "rgba(255,255,255,0.3)", padding: "17px 22px", pulse: true, fullWidth: false }

addPropertyControls(CRTButton, {
    text: { type: ControlType.String, title: "Text", defaultValue: "Get started →" },
    link: { type: ControlType.Link, title: "Link" },
    newTab: { type: ControlType.Boolean, title: "New tab" },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif" },
    fontSize: { type: ControlType.Number, title: "Size", min: 8, max: 64, unit: "px" },
    letterSpacing: { type: ControlType.Number, title: "Tracking", min: -0.05, max: 0.4, step: 0.01, unit: "em" },
    uppercase: { type: ControlType.Boolean, title: "Uppercase" },
    color: { type: ControlType.Color, title: "Color" },
    hotColor: { type: ControlType.Color, title: "Hover" },
    glow: { type: ControlType.Color, title: "Glow", description: "Usually the same as Hover. Softened automatically." },
    framed: { type: ControlType.Boolean, title: "Framed" },
    borderColor: { type: ControlType.Color, title: "Border", hidden: (p: Props) => !p.framed },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "17px 22px", hidden: (p: Props) => !p.framed },
    pulse: { type: ControlType.Boolean, title: "Idle pulse" },
    fullWidth: { type: ControlType.Boolean, title: "Full width" },
})
