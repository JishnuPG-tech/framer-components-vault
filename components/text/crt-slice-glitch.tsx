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


// an empty slot arrives as [] (truthy), so count real children
const has = (c: any) => React.Children.toArray(c).length > 0

type Slice = { t: number; h: number; dx: number }
type Frame = { slices: Slice[]; dy: number; op: number }
const CALM: Frame = { slices: [], dy: 0, op: 1 }

interface Props {
    content?: React.ReactNode
    text: string
    font?: React.CSSProperties
    fontSize: number
    color: string
    align: "left" | "center" | "right"
    mode: "hover" | "always" | "burst"
    slices: number
    amount: number
    glow: number
    glowColor: string
    fringe: boolean
    scanlines: number
    roll: boolean
    speed: number
    style?: React.CSSProperties
}

const gen = (n: number, amt: number, roll: boolean): Frame => ({
    slices: Array.from({ length: n }).map(() => ({ t: Math.random() * 92, h: 3 + Math.random() * 16, dx: (Math.random() * 2 - 1) * amt })),
    dy: roll ? (Math.random() * 2 - 1) * 5 : 0,
    op: 0.65 + Math.random() * 0.35,
})

const CSS = "@keyframes crt-slc-breathe{0%,100%{opacity:1}50%{opacity:.9}}@media (prefers-reduced-motion:reduce){.crt-slc *{animation:none!important}}"

/**
 * CRT Slice Glitch: a bad CRT signal. A soft phosphor glow, scanlines, horizontal tears with bright edges and colour fringing, and vertical-hold jumps with flicker, in bursts or all the time.
 * Wraps any layer or types a headline.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function CRTSliceGlitch(props: Props) {
    const { content, text, font, fontSize, color, align, mode, slices, amount, glow, glowColor, fringe, scanlines, roll, speed } = props
    const live = !useIsStaticRenderer()
    const [hover, setHover] = React.useState(false)
    const [f, setF] = React.useState<Frame>(live ? CALM : gen(slices, amount, roll))
    React.useEffect(() => {
        if (!live) {
            setF(gen(slices, amount, roll))
            return
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setF(CALM)
            return
        }
        let alive = true
        let timer = 0
        if (mode === "always" || (mode === "hover" && hover)) {
            const t = () => {
                if (!alive) return
                setF(Math.random() < 0.45 ? gen(slices, amount, roll) : CALM)
                timer = window.setTimeout(t, 80 / speed)
            }
            t()
        } else if (mode === "burst") {
            const burst = () => {
                let n = 0
                const run = () => {
                    if (!alive) return
                    if (n++ < 7) {
                        setF(gen(slices, amount, roll))
                        timer = window.setTimeout(run, 55)
                    } else {
                        setF(CALM)
                        timer = window.setTimeout(burst, (1400 + Math.random() * 2400) / speed)
                    }
                }
                run()
            }
            timer = window.setTimeout(burst, 900)
        } else setF(CALM)
        return () => {
            alive = false
            clearTimeout(timer)
            setF(CALM)
        }
    }, [mode, hover, slices, amount, roll, speed, live])

    const inner = has(content) ? content : <div style={{ fontFamily: "Michroma, sans-serif", fontWeight: 400, ...(font || {}), color, fontSize, lineHeight: 1.1, textAlign: align, whiteSpace: "pre-wrap" }}>{text}</div>
    const g = (p: number) => "color-mix(in srgb, " + glowColor + " " + Math.round(glow * p) + "%, transparent)"
    const halo = glow > 0 ? "drop-shadow(0 0 4px " + g(70) + ") drop-shadow(0 0 16px " + g(38) + ")" : undefined
    const fringed = fringe ? "drop-shadow(-3px 0 0 rgba(255,40,80,0.65)) drop-shadow(3px 0 0 rgba(0,225,255,0.65)) brightness(1.35)" : "brightness(1.35)"
    const scan = scanlines > 0 ? "repeating-linear-gradient(0deg, rgba(0,0,0," + (1 - scanlines) + ") 0px, rgba(0,0,0," + (1 - scanlines) + ") 1px, #000 1px, #000 3px)" : undefined
    const masked: React.CSSProperties = scan ? { WebkitMaskImage: scan, maskImage: scan } : {}
    return (
        <div className="crt-slc" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ ...props.style, position: "relative", filter: halo }}>
            <style>{CSS}</style>
            <div style={{ ...masked, transform: f.dy ? "translateY(" + f.dy + "px)" : undefined, opacity: f.op, animation: live ? "crt-slc-breathe 3.4s ease-in-out infinite" : undefined }}>{inner}</div>
            {f.slices.map((s, i) => (
                <div key={i} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", clipPath: "inset(" + s.t + "% 0 " + (100 - s.t - s.h) + "% 0)", transform: "translateX(" + s.dx + "px)", filter: fringed, ...masked }}>
                    {inner}
                </div>
            ))}
        </div>
    )
}

CRTSliceGlitch.defaultProps = { text: "SLICE", fontSize: 72, color: "#ecebe7", align: "left", mode: "burst", slices: 4, amount: 18, glow: 0.7, glowColor: "#ffffff", fringe: true, scanlines: 0.3, roll: true, speed: 1 }

addPropertyControls(CRTSliceGlitch, {
    content: { type: ControlType.ComponentInstance, title: "Content", description: "Optional: any layer. Empty = the headline below." },
    text: { type: ControlType.String, title: "Text", defaultValue: "SLICE", hidden: (p: Props) => has(p.content) },
    font: { type: ControlType.Font, title: "Font", controls: "basic", defaultFontType: "sans-serif", hidden: (p: Props) => has(p.content) },
    fontSize: { type: ControlType.Number, title: "Size", min: 12, max: 300, unit: "px", hidden: (p: Props) => has(p.content) },
    color: { type: ControlType.Color, title: "Color", hidden: (p: Props) => has(p.content) },
    align: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], displaySegmentedControl: true, hidden: (p: Props) => has(p.content) },
    mode: { type: ControlType.Enum, title: "Trigger", options: ["hover", "always", "burst"], optionTitles: ["Hover", "Always", "Bursts"], displaySegmentedControl: true },
    slices: { type: ControlType.Number, title: "Tears", min: 1, max: 8, step: 1 },
    amount: { type: ControlType.Number, title: "Shift", min: 2, max: 80, unit: "px" },
    glow: { type: ControlType.Number, title: "Glow", min: 0, max: 1, step: 0.05 },
    glowColor: { type: ControlType.Color, title: "Glow color" },
    fringe: { type: ControlType.Boolean, title: "RGB fringe" },
    scanlines: { type: ControlType.Number, title: "Scanlines", min: 0, max: 0.8, step: 0.05 },
    roll: { type: ControlType.Boolean, title: "V-hold jump" },
    speed: { type: ControlType.Number, title: "Speed", min: 0.3, max: 3, step: 0.1 },
})
