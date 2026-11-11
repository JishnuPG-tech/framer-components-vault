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

import { motion, useReducedMotion } from "framer-motion"

type ShapeKind = "flower" | "orbit" | "diamond"
type CardItem = {
    eyebrow: string
    title: string
    description: string
    detail: string
    cta: string
    link: string
    shape: ShapeKind
    background: string
    shapeColor: string
    detailColor: string
}
interface Props {
    items: CardItem[]
    cardHeight: number
    cardGap: number
    minCardWidth: number
    radius: number
    cardPadding: number
    surface: string
    textColor: string
    mutedColor: string
    selectionLift: number
    motionSpeed: number
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_ITEMS: CardItem[] = [
    {
        eyebrow: "01  /  CREATE",
        title: "Dream it up.",
        description: "Big ideas start somewhere. Give yours a little room to grow.",
        detail: "Make space for your next idea.",
        cta: "Get Started",
        link: "",
        shape: "flower",
        background: "#D8FF73",
        shapeColor: "#4652ED",
        detailColor: "#FF775F",
    },
    {
        eyebrow: "02  /  DESIGN",
        title: "Make it yours.",
        description: "Mix it, shape it, switch it up. Every detail can be different.",
        detail: "Give your vision a unique voice.",
        cta: "Get Started",
        link: "",
        shape: "orbit",
        background: "#C6BAFF",
        shapeColor: "#FD5D95",
        detailColor: "#F4E78C",
    },
    {
        eyebrow: "03  /  LAUNCH",
        title: "Out in the world.",
        description: "From the first sketch to something everyone can see.",
        detail: "Ready when you are.",
        cta: "Get Started",
        link: "",
        shape: "diamond",
        background: "#FF9B7B",
        shapeColor: "#3A3FD8",
        detailColor: "#FFF29A",
    },
]
const safeHex = (v: unknown, fallback: string) => typeof v === "string" && v ? v : fallback

function pathFor(kind: ShapeKind, animated: boolean): string {
    const out: string[] = []
    const n = 64
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        let r: number
        if (kind === "flower") {
            r = animated ? 87 + 14 * Math.cos(7 * a) : 76 + 29 * Math.cos(7 * a)
        } else if (kind === "orbit") {
            r = animated ? 81 + 14 * Math.sin(5 * a + 0.6) : 77 + 26 * Math.sin(5 * a + 0.6)
        } else {
            r = animated ? 83 + 15 * Math.cos(4 * a + 0.55) : 76 + 28 * Math.cos(4 * a + 0.55)
        }
        const x = 150 + Math.cos(a) * r * 1.19
        const y = 121 + Math.sin(a) * r * 0.93
        out.push((i ? "L" : "M") + x.toFixed(2) + "," + y.toFixed(2))
    }
    return out.join(" ") + " Z"
}

function ShapeArt({ item, active, reduced }: { item: CardItem; active: boolean; reduced: boolean }) {
    const kind = item.shape || "flower"
    const path = pathFor(kind, active)
    const transition = reduced ? { duration: 0 } : { duration: 0.62, ease: [0.18, 0.76, 0.22, 1] as [number, number, number, number] }
    return (
        <div aria-hidden="true" style={{ position: "relative", width: "100%", minHeight: 170, flex: "1 1 auto", display: "grid", placeItems: "center", overflow: "visible" }}>
            <motion.svg viewBox="0 0 300 242" initial={false} animate={{ rotate: active ? 13 : -11, scale: active ? 1.06 : 0.96 }} transition={transition} style={{ width: "100%", height: "100%", maxWidth: 315, maxHeight: 250, overflow: "visible", display: "block" }}>
                <motion.path d={path} initial={false} animate={{ d: path }} transition={transition} fill={safeHex(item.shapeColor, "#4652ED")} />
                <motion.circle cx="185" cy="87" r="33" initial={false} animate={{ cx: active ? 203 : 184, cy: active ? 76 : 96, scale: active ? 0.75 : 1 }} transition={transition} fill="none" stroke={safeHex(item.detailColor, "#FF775F")} strokeWidth="10" />
                <circle cx="97" cy="162" r="10" fill={safeHex(item.detailColor, "#FF775F")} />
            </motion.svg>
            <motion.div initial={false} animate={{ rotate: active ? -21 : 15, y: active ? -8 : 4 }} transition={transition} style={{ position: "absolute", width: 34, height: 34, border: "3px solid " + item.shapeColor, borderRadius: kind === "orbit" ? "50%" : 7, right: "5%", bottom: "14%", transform: "rotate(16deg)" }} />
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1100
 * @framerIntrinsicHeight 478
 */
export default function ShapeShiftCards(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        cardHeight = 460,
        cardGap = 14,
        minCardWidth = 245,
        radius = 20,
        cardPadding = 26,
        surface = "#FFFFFF",
        textColor = "#181818",
        mutedColor = "#313131",
        selectionLift = 7,
        motionSpeed = 0.45,
        headingFont,
        bodyFont,
        labelFont,
        style,
    } = props
    const safeItems = Array.isArray(items) && items.length ? items : DEFAULT_ITEMS
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion() || isStatic
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [focused, setFocused] = React.useState<number | null>(null)
    const heading: React.CSSProperties = {
        fontFamily: "Space Grotesk, Inter, sans-serif",
        fontWeight: 700,
        fontSize: 31,
        lineHeight: "1.04em",
        letterSpacing: "-0.055em",
        margin: 0,
        ...headingFont,
    }
    const body: React.CSSProperties = {
        fontFamily: "DM Sans, Inter, sans-serif",
        fontSize: 13,
        lineHeight: "1.4em",
        fontWeight: 450,
        margin: 0,
        ...bodyFont,
    }
    const label: React.CSSProperties = {
        fontFamily: "DM Sans, Inter, sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.085em",
        ...labelFont,
    }
    const transition = reduced ? { duration: 0 } : { duration: Math.max(0.12, motionSpeed), ease: [0.2, 0.78, 0.22, 1] as [number,number,number,number] }
    return (
        <div style={{ width: "100%", height: "auto", minWidth: 0, boxSizing: "border-box", backgroundColor: surface, ...style }}>
            <style>{".ssc-link:focus-visible { outline: 3px solid #181818; } @media (hover: none), (pointer: coarse) { .ssc-hover-cta { opacity: 1 !important; transform: none !important; } } @media (prefers-reduced-motion: reduce) { .ssc-hover-cta { transition: none !important; } }"}</style>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, " + Math.max(185, minCardWidth) + "px), 1fr))", gap: Math.max(0, cardGap), width: "100%", boxSizing: "border-box", alignItems: "stretch" }}>
                {safeItems.map((item, index) => {
                    const active = hovered === index || focused === index
                    const animated = active
                    const href = typeof item.link === "string" ? item.link.trim() : ""
                    const hasLink = !!href
                    const background = safeHex(item.background, "#D8FF73")
                    return (
                        <motion.article key={index} initial={false} animate={{ y: active ? -Math.min(2, Math.max(0, selectionLift)) : 0, scale: active ? 1 + Math.max(0, selectionLift) / 500 : 1, boxShadow: active ? "0 20px 40px rgba(28,20,51,0.11)" : "0 0px 0px rgba(28,20,51,0)" }} transition={transition} onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHovered(index) }} onPointerLeave={() => setHovered(null)} style={{ position: "relative", height: Math.max(330, cardHeight), minWidth: 0, borderRadius: Math.max(0, radius), background, overflow: "hidden", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: Math.max(12, cardPadding), isolation: "isolate" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                <span style={{ ...label, color: textColor }}>{item.eyebrow}</span>
                                <span aria-hidden="true" style={{ height: 8, width: 8, backgroundColor: item.shapeColor, borderRadius: "50%" }} />
                            </div>
                            <ShapeArt item={item} active={animated} reduced={reduced} />
                            <div style={{ flexShrink: 0, position: "relative", minHeight: 114, paddingBottom: hasLink ? 39 : 0, pointerEvents: "none" }}>
                                <h3 style={{ ...heading, color: textColor, marginBottom: 9, overflowWrap: "anywhere" }}>{item.title || "Your headline"}</h3>
                                <p style={{ ...body, color: mutedColor, maxWidth: 270, overflowWrap: "anywhere" }}>{active && item.detail ? item.detail : item.description}</p>
                            </div>
                            {hasLink && (
                                <a className="ssc-link" href={href} target="_blank" rel="noopener noreferrer" onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) setFocused(index) }} onBlur={() => setFocused(null)} onClick={() => setFocused(null)} aria-label={(item.cta || "Get Started") + ": " + (item.title || "card") + " (opens in a new tab)"} style={{ position: "absolute", inset: 0, display: "block", cursor: "pointer", zIndex: 2, borderRadius: Math.max(0,radius), outlineOffset: -5, textDecoration: "none" }}>
                                    <span className="ssc-hover-cta" aria-hidden="true" style={{ position: "absolute", bottom: Math.max(12, cardPadding), left: Math.max(12, cardPadding), display: "inline-flex", alignItems: "center", gap: 9, color: textColor, ...label, letterSpacing: "0", fontSize: 12, textTransform: "none", opacity: active ? 1 : 0, transform: active ? "translateY(0px)" : "translateY(8px)", transition: reduced ? "none" : "opacity " + Math.max(0.12, motionSpeed) + "s ease, transform " + Math.max(0.12, motionSpeed) + "s ease" }}>
                                        {item.cta || "Get Started"}<span aria-hidden="true" style={{ width: 25, height: 25, border: "1.5px solid currentColor", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1 }}>↗</span>
                                    </span>
                                </a>
                            )}
                        </motion.article>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(ShapeShiftCards, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 8,
        control: { type: ControlType.Object, controls: {
            eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "01 / CREATE" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Dream it up." },
            description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "The next idea starts here." },
            detail: { type: ControlType.String, title: "Hover Text", displayTextArea: true, defaultValue: "Make space for your next idea." },
            cta: { type: ControlType.String, title: "CTA", defaultValue: "Get Started" },
            link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            shape: { type: ControlType.Enum, title: "Shape", options: ["flower","orbit","diamond"], optionTitles: ["Flower","Orbit","Diamond"], defaultValue: "flower" },
            background: { type: ControlType.Color, title: "Card Color", defaultValue: "#D8FF73" },
            shapeColor: { type: ControlType.Color, title: "Shape Color", defaultValue: "#4652ED" },
            detailColor: { type: ControlType.Color, title: "Detail Color", defaultValue: "#FF775F" },
        }},
        defaultValue: DEFAULT_ITEMS,
    },
    cardHeight: { type: ControlType.Number, title: "Card Height", defaultValue: 460, min: 330, max: 650, step: 10, unit: "px" },
    minCardWidth: { type: ControlType.Number, title: "Min Card Width", defaultValue: 245, min: 180, max: 400, step: 5, unit: "px" },
    cardGap: { type: ControlType.Number, title: "Gap", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 80, step: 1, unit: "px" },
    cardPadding: { type: ControlType.Number, title: "Padding", defaultValue: 26, min: 12, max: 48, step: 1, unit: "px" },
    selectionLift: { type: ControlType.Number, title: "Hover Lift", defaultValue: 7, min: 0, max: 20, step: 1, unit: "px" },
    motionSpeed: { type: ControlType.Number, title: "Motion Speed", defaultValue: 0.45, min: 0.12, max: 1.2, step: 0.05, unit: "s" },
    surface: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#181818" },
    mutedColor: { type: ControlType.Color, title: "Body Text", defaultValue: "#313131" },
    headingFont: { type: ControlType.Font, title: "Heading", controls: "extended",  },
    bodyFont: { type: ControlType.Font, title: "Description", controls: "extended",  },
    labelFont: { type: ControlType.Font, title: "Eyebrow", controls: "extended",  },
})
