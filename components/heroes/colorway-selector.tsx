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

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type ImageValue = { src?: string; srcSet?: string; alt?: string }
type Colorway = {
    name: string
    color: string
    scene: string
    image?: ImageValue
    link: string
}
type Props = {
    variants: Colorway[]
    brand: string
    title: string
    description: string
    price: string
    note: string
    ctaLabel: string
    defaultVariant: number
    radius: number
    motionDuration: number
    panelColor: string
    textColor: string
    mutedColor: string
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    style?: React.CSSProperties
}

const DEFAULT_VARIANTS: Colorway[] = [
    { name: "Cobalt Blue", color: "#4467A3", scene: "#DCE3EA", image: { src: "", alt: "" }, link: "" },
    { name: "Warm Coral", color: "#CF7964", scene: "#EBDCD4", image: { src: "", alt: "" }, link: "" },
    { name: "Soft Sage", color: "#647D69", scene: "#DDE3DA", image: { src: "", alt: "" }, link: "" },
]

const css = [
    "[data-pcs-root], [data-pcs-root] *{box-sizing:border-box}",
    "[data-pcs-root] .pcs-layout{display:flex;min-height:520px;width:100%;align-items:stretch}",
    "[data-pcs-root] .pcs-stage{position:relative;flex:0 0 57%;min-width:0;min-height:520px;overflow:hidden}",
    "[data-pcs-root] .pcs-detail{position:relative;flex:1;min-width:0;padding:48px 50px 44px;display:flex;flex-direction:column}",
    "[data-pcs-root] .pcs-art{position:absolute;inset:36px 36px 40px;display:flex;align-items:center;justify-content:center}",
    "[data-pcs-root] .pcs-illustration{width:min(100%,490px);height:100%;max-height:420px;display:block}",
    "[data-pcs-root] .pcs-heading{font-size:clamp(34px,4.4cqw,57px);line-height:1.03;letter-spacing:-.058em}",
    "[data-pcs-root] .pcs-swatch{appearance:none;border:0;cursor:pointer;width:38px;height:38px;border-radius:50%;padding:4px;background:transparent;display:grid;place-items:center;transition:transform .22s ease}",
    "[data-pcs-root] .pcs-swatch:hover{transform:translateY(-3px)}",
    "[data-pcs-root] .pcs-swatch:focus-visible{outline:2px solid #202020;outline-offset:3px}",
    "[data-pcs-root] .pcs-swatch-dot{width:24px;height:24px;display:block;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(0,0,0,.13),0 2px 5px rgba(0,0,0,.08)}",
    "[data-pcs-root] .pcs-link{display:flex;justify-content:space-between;align-items:center;min-height:54px;padding:0 19px;gap:16px;color:white;background:#20211f;border-radius:999px;text-decoration:none;transition:background .2s ease,transform .2s ease}",
    "[data-pcs-root] .pcs-link:hover{background:#444640;transform:translateY(-2px)}",
    "[data-pcs-root] .pcs-link:focus-visible{outline:2px solid #222;outline-offset:4px}",
    "@container colorway (max-width:780px){",
    "[data-pcs-root] .pcs-layout{flex-direction:column;min-height:0}",
    "[data-pcs-root] .pcs-stage{flex:none;width:100%;min-height:410px}",
    "[data-pcs-root] .pcs-detail{padding:36px 42px 40px}",
    "[data-pcs-root] .pcs-art{inset:18px 15px 18px}",
    "[data-pcs-root] .pcs-illustration{max-height:380px}",
    "[data-pcs-root] .pcs-heading{font-size:clamp(36px,7cqw,54px)}",
    "}",
    "@container colorway (max-width:450px){",
    "[data-pcs-root] .pcs-stage{min-height:310px}",
    "[data-pcs-root] .pcs-art{inset:6px 8px 10px}",
    "[data-pcs-root] .pcs-illustration{max-height:285px}",
    "[data-pcs-root] .pcs-detail{padding:28px 24px 30px}",
    "[data-pcs-root] .pcs-heading{font-size:37px}",
    "}",
    "@media (prefers-reduced-motion:reduce){",
    "[data-pcs-root] .pcs-swatch,[data-pcs-root] .pcs-link{transition:none!important}",
    "[data-pcs-root] .pcs-swatch:hover,[data-pcs-root] .pcs-link:hover{transform:none}",
    "}",
].join("")

function Lamp({ color, label }: { color: string; label: string }) {
    const uid = React.useId().replace(/:/g, "")
    return (
        <svg className="pcs-illustration" viewBox="0 0 520 460" fill="none" role="img" aria-label={label + " table lamp"}>
            <defs>
                <linearGradient id={uid + "-shade"} x1="0" y1="0" x2="1" y2=".45">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity=".43" />
                    <stop offset=".32" stopColor="#FFFFFF" stopOpacity=".09" />
                    <stop offset=".72" stopColor="#000000" stopOpacity=".07" />
                    <stop offset="1" stopColor="#000000" stopOpacity=".31" />
                </linearGradient>
                <linearGradient id={uid + "-stem"} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#121414" />
                    <stop offset=".28" stopColor="#8F9695" />
                    <stop offset=".55" stopColor="#E8E9E7" />
                    <stop offset=".84" stopColor="#525758" />
                    <stop offset="1" stopColor="#141515" />
                </linearGradient>
                <linearGradient id={uid + "-base"} x1="0" y1="0" x2=".8" y2="1">
                    <stop offset="0" stopColor="#EDF0EF" />
                    <stop offset=".3" stopColor="#969A96" />
                    <stop offset=".72" stopColor="#444846" />
                    <stop offset="1" stopColor="#1C1E1D" />
                </linearGradient>
                <filter id={uid + "-shadow"} x="-50%" y="-150%" width="200%" height="400%">
                    <feGaussianBlur stdDeviation="17" />
                </filter>
            </defs>
            <ellipse cx="262" cy="415" rx="149" ry="19" fill="#252521" opacity=".14" filter={"url(#" + uid + "-shadow)"} />
            <path d="M280 273V384" stroke="#222624" strokeWidth="24" strokeLinecap="round" />
            <path d="M280 272V383" stroke={"url(#" + uid + "-stem)"} strokeWidth="21" strokeLinecap="round" />
            <ellipse cx="281" cy="387" rx="90" ry="13" fill="#222523" />
            <path d="M189 385C189 368 230 358 280 358C330 358 373 368 373 385V390C373 406 330 413 280 413C230 413 189 404 189 390V385Z" fill={"url(#" + uid + "-base)"} />
            <ellipse cx="281" cy="382" rx="92" ry="19" fill={color} />
            <ellipse cx="281" cy="382" rx="92" ry="19" fill={"url(#" + uid + "-shade)"} />
            <path d="M150 246C152 149 203 82 282 82C362 82 413 151 416 246C383 267 335 280 282 280C228 280 182 267 150 246Z" fill={color} />
            <path d="M150 246C152 149 203 82 282 82C362 82 413 151 416 246C383 267 335 280 282 280C228 280 182 267 150 246Z" fill={"url(#" + uid + "-shade)"} />
            <path d="M151 246C181 264 230 279 282 279C336 279 384 264 415 246" stroke="#101212" strokeOpacity=".36" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="282" cy="247" rx="130" ry="16" fill="#0D1010" opacity=".12" />
            <path d="M201 184C217 133 253 110 280 109" stroke="white" strokeOpacity=".35" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="280" cy="84" rx="11" ry="4" fill={color} />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1040
 * @framerIntrinsicHeight 520
 */
export default function ProductColorwaySelector(props: Props) {
    const {
        variants = DEFAULT_VARIANTS,
        brand = "FORMA / OBJECTS",
        title = "Palo Table Lamp",
        description = "Soft light. Strong character. A sculptural everyday object, thoughtfully made for wherever life happens.",
        price = "$249",
        note = "Designed for everyday rituals.",
        ctaLabel = "Explore this finish",
        defaultVariant = 0,
        radius = 20,
        motionDuration = 0.48,
        panelColor = "#F8F7F3",
        textColor = "#1E211F",
        mutedColor = "#6B706C",
        headingFont,
        bodyFont,
        style,
    } = props

    const safe = Array.isArray(variants) && variants.length ? variants : DEFAULT_VARIANTS
    const startIndex = Math.max(0, Math.min(safe.length - 1, Math.round(defaultVariant || 0)))
    const [selected, setSelected] = React.useState(startIndex)
    React.useEffect(() => setSelected(startIndex), [startIndex])
    const index = Math.min(selected, safe.length - 1)
    const variant = safe[index] || safe[0]
    const isStatic = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const duration = isStatic || reducedMotion ? 0 : Math.max(0, Math.min(1.5, motionDuration))
    const activeLink = typeof variant.link === "string" ? variant.link.trim() : ""
    const isLinked = /^(https?:\/\/|\/)/i.test(activeLink)
    const body: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        lineHeight: 1.5,
        ...bodyFont,
    }

    return (
        <div
            data-pcs-root="true"
            style={{
                width: "100%",
                height: "auto",
                minWidth: 0,
                containerType: "inline-size",
                containerName: "colorway",
                color: textColor,
                background: panelColor,
                overflow: "hidden",
                borderRadius: radius,
                fontFamily: "Inter, sans-serif",
                ...style,
            } as React.CSSProperties & { containerType: string; containerName: string }}
        >
            <style>{css}</style>
            <div className="pcs-layout">
                <div
                    className="pcs-stage"
                    style={{
                        backgroundColor: variant.scene || "#E4E8EA",
                        transition: duration ? "background-color " + duration + "s cubic-bezier(.2,.8,.2,1)" : "none",
                    }}
                >
                    <div style={{ position: "absolute", left: 26, top: 24, zIndex: 2, fontSize: 11, letterSpacing: ".14em", fontWeight: 600 }}>
                        OBJECT STUDY — 001
                    </div>
                    <div style={{ position: "absolute", right: 27, top: 24, zIndex: 2, fontSize: 11, fontVariantNumeric: "tabular-nums", letterSpacing: ".07em" }}>
                        {String(index + 1).padStart(2, "0")} / {String(safe.length).padStart(2, "0")}
                    </div>
                    <div className="pcs-art">
                        <AnimatePresence initial={false} mode="sync">
                            <motion.div
                                key={index}
                                initial={duration ? { opacity: 0, y: 12, scale: 0.975 } : false}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={duration ? { opacity: 0, y: 12, scale: 0.975 } : undefined}
                                transition={{ duration, ease: [0.25, 0.8, 0.25, 1] }}
                                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                {variant.image?.src ? (
                                    <img
                                        src={variant.image.src}
                                        srcSet={variant.image.srcSet}
                                        alt={variant.image.alt || title + " — " + variant.name}
                                        draggable={false}
                                        style={{ display: "block", width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
                                    />
                                ) : (
                                    <Lamp color={variant.color || "#4467A3"} label={title + " in " + variant.name} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    <div style={{ position: "absolute", bottom: 25, left: 27, right: 27, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, color: "#28312E", fontSize: 11, letterSpacing: ".065em" }}>
                        <span>FORM FOLLOWS FEELING</span>
                        <span>{String(index + 1).padStart(2, "0")} — {String(safe.length).padStart(2, "0")}</span>
                    </div>
                </div>
                <div className="pcs-detail">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 11, letterSpacing: ".13em", fontWeight: 650 }}>
                        <span>{brand}</span>
                        <span aria-hidden="true" style={{ width: 24, height: 24, border: "1px solid currentColor", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, letterSpacing: 0 }}>✳</span>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 52, paddingBottom: 36 }}>
                        <h2 className="pcs-heading" style={{ margin: 0, fontWeight: 500, maxWidth: 430, ...headingFont }}>
                            {title}
                        </h2>
                        <p style={{ ...body, margin: "19px 0 0", maxWidth: 355, color: mutedColor }}>
                            {description}
                        </p>
                        <div style={{ marginTop: 26, fontSize: 23, letterSpacing: "-.05em", fontWeight: 530 }}>
                            {price}
                        </div>
                    </div>
                    <div>
                        <div style={{ borderTop: "1px solid rgba(30,33,31,.17)", paddingTop: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 11, letterSpacing: ".11em", fontWeight: 650, textTransform: "uppercase" }}>Select a finish</span>
                                <span aria-live="polite" style={{ ...body, fontSize: 12, color: mutedColor }}>{variant.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div role="group" aria-label="Available colors" style={{ display: "flex", alignItems: "center", gap: 9, marginLeft: -3 }}>
                                    {safe.map((item, i) => (
                                        <button
                                            key={i}
                                            className="pcs-swatch"
                                            type="button"
                                            aria-label={"Select " + item.name}
                                            aria-pressed={i === index}
                                            onClick={isStatic ? undefined : () => setSelected(i)}
                                            style={{ border: i === index ? "1px solid " + textColor : "1px solid transparent" }}
                                        >
                                            <span className="pcs-swatch-dot" style={{ backgroundColor: item.color || "#777" }} />
                                        </button>
                                    ))}
                                </div>
                                <span style={{ fontSize: 11, color: mutedColor }}>0{index + 1}</span>
                            </div>
                        </div>
                        {isLinked ? (
                            <a className="pcs-link" href={activeLink} target="_blank" rel="noopener noreferrer" style={{ marginTop: 24, ...body, fontWeight: 550 }}>
                                <span>{ctaLabel}</span>
                                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </a>
                        ) : (
                            <p style={{ ...body, margin: "22px 0 0", fontSize: 12, color: mutedColor }}>{note}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ProductColorwaySelector, {
    variants: {
        type: ControlType.Array,
        title: "Colorways",
        maxCount: 12,
        defaultValue: DEFAULT_VARIANTS,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Finish", defaultValue: "New Finish" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#647D69" },
                scene: { type: ControlType.Color, title: "Backdrop", defaultValue: "#DDE3DA" },
                image: { type: ControlType.ResponsiveImage, title: "Product Photo" },
                link: { type: ControlType.Link, title: "Product URL", defaultValue: "" },
            },
        },
    },
    brand: { type: ControlType.String, title: "Brand", defaultValue: "FORMA / OBJECTS" },
    title: { type: ControlType.String, title: "Product Name", defaultValue: "Palo Table Lamp" },
    description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Soft light. Strong character. A sculptural everyday object, thoughtfully made for wherever life happens." },
    price: { type: ControlType.String, title: "Price", defaultValue: "$249" },
    note: { type: ControlType.String, title: "Footnote", defaultValue: "Designed for everyday rituals." },
    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "Explore this finish" },
    defaultVariant: { type: ControlType.Number, title: "Start Finish", defaultValue: 0, min: 0, max: 11, step: 1 },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
    motionDuration: { type: ControlType.Number, title: "Motion", defaultValue: 0.48, min: 0, max: 1.5, step: 0.05, unit: "s" },
    panelColor: { type: ControlType.Color, title: "Panel", defaultValue: "#F8F7F3" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#1E211F" },
    mutedColor: { type: ControlType.Color, title: "Subtext", defaultValue: "#6B706C" },
    headingFont: { type: ControlType.Font, title: "Title Font", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body Font", controls: "extended" },
})
