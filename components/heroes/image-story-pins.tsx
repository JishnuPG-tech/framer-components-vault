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
type StoryPin = {
    label: string
    title: string
    description: string
    x: number
    y: number
    image?: ImageValue
    cta: string
    link: string
}
type Props = {
    image?: ImageValue
    pins: StoryPin[]
    defaultActive: number
    imagePosition: string
    imageHeight: number
    radius: number
    gap: number
    padding: number
    background: string
    panelColor: string
    textColor: string
    mutedColor: string
    pinColor: string
    activePinColor: string
    buttonColor: string
    buttonText: string
    duration: number
    headingFont?: React.CSSProperties
    bodyFont?: React.CSSProperties
    labelFont?: React.CSSProperties
    style?: React.CSSProperties
}

const IMAGE = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1800&q=85"
const DEFAULT_PINS: StoryPin[] = [
    {
        label: "Creative freedom",
        title: "Make it yours.",
        description: "Every detail can feel like you. Create a distinctive website that brings your ideas into focus.",
        x: 31, y: 34,
        image: { src: "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=600&q=85", alt: "Design composition on a creative workstation" },
        cta: "Start Creating", link: "",
    },
    {
        label: "Visual design",
        title: "Shape every detail.",
        description: "Explore layouts, refine your typography and make things feel right without getting lost in code.",
        x: 63, y: 57,
        image: { src: "https://images.unsplash.com/photo-1559028006-448665bd7c7f?auto=format&fit=crop&w=600&q=85", alt: "Creative website design process" },
        cta: "Start Creating", link: "",
    },
    {
        label: "Go live",
        title: "Ready for the world.",
        description: "Take your next idea from a first draft to a live website worth sharing.",
        x: 79, y: 27,
        image: { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=85", alt: "Digital work on a laptop" },
        cta: "Start Creating", link: "",
    },
]

const CSS = [
    ".isp-layout{display:grid;grid-template-columns:minmax(0,1.58fr) minmax(0,1fr);gap:var(--isp-gap);width:100%;}",
    ".isp-media{position:relative;min-width:0;overflow:hidden;isolation:isolate;border-radius:var(--isp-radius);height:var(--isp-height);background:#C9C9C6;}",
    ".isp-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none;}",
    ".isp-detail{border-radius:var(--isp-radius);background:var(--isp-panel);color:var(--isp-text);min-width:0;min-height:var(--isp-height);box-sizing:border-box;padding:clamp(22px,3.2vw,42px);display:flex;flex-direction:column;justify-content:space-between;gap:25px;text-decoration:none;position:relative;overflow:hidden;}",
    ".isp-detail[data-linked='true']{cursor:pointer;}",
    ".isp-detail[data-linked='true']:focus-visible{outline:3px solid #171717;outline-offset:4px;}",
    ".isp-pin{appearance:none;border:1.5px solid rgba(255,255,255,.95);border-radius:50%;display:flex;align-items:center;justify-content:center;width:46px;height:46px;position:absolute;transform:translate(-50%,-50%);cursor:pointer;box-shadow:0 5px 23px rgba(0,0,0,.16);background:var(--isp-pin);color:#171717;padding:0;font:600 13px/1 Inter,system-ui,sans-serif;touch-action:manipulation;transition:background .23s ease,color .23s ease,box-shadow .23s ease;}",
    ".isp-pin[data-active='true']{background:var(--isp-pin-active);box-shadow:0 0 0 7px rgba(255,255,255,.24),0 5px 23px rgba(0,0,0,.16);}",
    ".isp-pin:focus-visible{outline:3px solid #D9FA72;outline-offset:5px;}",
    ".isp-pin:hover{box-shadow:0 0 0 7px rgba(255,255,255,.20),0 5px 23px rgba(0,0,0,.22);}",
    ".isp-mini-photo{width:122px;height:88px;object-fit:cover;border-radius:12px;display:block;background:rgba(0,0,0,.12);}",
    ".isp-cta{display:inline-flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;background:var(--isp-button);color:var(--isp-button-text);border-radius:999px;min-width:175px;max-width:100%;box-sizing:border-box;transition:transform .3s cubic-bezier(.2,.8,.2,1);}",
    ".isp-detail[data-linked='true']:hover .isp-cta{transform:translateY(-3px)}",
    ".isp-arrow{display:flex;align-items:center;justify-content:center;width:22px;height:22px;}",
    ".isp-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;}",
    ".isp-caption{position:absolute;left:26px;bottom:23px;color:#fff;font:600 10px/1.4 Inter,system-ui,sans-serif;letter-spacing:.15em;text-transform:uppercase;text-shadow:0 1px 9px rgba(0,0,0,.3);pointer-events:none;}",
    "@container (max-width:760px){.isp-layout{grid-template-columns:minmax(0,1fr)}.isp-media{height:min(64vw,410px);min-height:260px}.isp-detail{min-height:305px;padding:28px}.isp-mini-photo{width:108px;height:76px}.isp-pin{width:44px;height:44px}}",
    "@container (max-width:410px){.isp-detail{min-height:315px;padding:23px}.isp-mini-photo{width:83px;height:68px}.isp-top{gap:12px}.isp-caption{left:18px;bottom:17px}}",
    "@media (prefers-reduced-motion:reduce){.isp-pin,.isp-cta{transition:none!important}.isp-detail[data-linked='true']:hover .isp-cta{transform:none!important}}"
].join("")

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 535
 */
export default function ImageStoryPins(props: Props) {
    const {
        image = { src: IMAGE, alt: "Creative workspace with laptop" },
        pins = DEFAULT_PINS,
        defaultActive = 0,
        imagePosition = "50% 50%",
        imageHeight = 515,
        radius = 22,
        gap = 10,
        padding = 10,
        background = "#F5F5F2",
        panelColor = "#DDF58B",
        textColor = "#171914",
        mutedColor = "#535B41",
        pinColor = "#FFFFFF",
        activePinColor = "#DDF58B",
        buttonColor = "#161916",
        buttonText = "#FFFFFF",
        duration = 0.46,
        headingFont,
        bodyFont,
        labelFont,
        style,
    } = props

    const safePins = Array.isArray(pins) && pins.length ? pins : DEFAULT_PINS
    const firstIndex = Math.max(0, Math.min(safePins.length - 1, Math.round(defaultActive)))
    const [active, setActive] = React.useState(firstIndex)
    const selectedIndex = Math.max(0, Math.min(safePins.length - 1, active))
    const item = safePins[selectedIndex]
    const isStatic = useIsStaticRenderer()
    const reduced = useReducedMotion()
    const animate = !isStatic && !reduced
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const link = (item.link || "").trim()
    const linked = /^(https?:\/\/|\/(?!\/)|#)/i.test(link)
    const variables = {
        "--isp-gap": Math.max(0, gap) + "px",
        "--isp-height": Math.max(260, imageHeight) + "px",
        "--isp-radius": Math.max(0, radius) + "px",
        "--isp-panel": panelColor,
        "--isp-text": textColor,
        "--isp-pin": pinColor,
        "--isp-pin-active": activePinColor,
        "--isp-button": buttonColor,
        "--isp-button-text": buttonText,
    } as React.CSSProperties

    React.useEffect(() => {
        setActive((old) => Math.min(old, safePins.length - 1))
    }, [safePins.length])

    React.useEffect(() => {
        setActive(Math.max(0, Math.min(safePins.length - 1, Math.round(defaultActive))))
    }, [defaultActive])

    const heading: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 43,
        fontWeight: 550, letterSpacing: "-0.055em", lineHeight: 1.04,
        margin: 0, color: textColor, ...headingFont,
    }
    const paragraph: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 15,
        fontWeight: 400, letterSpacing: "-0.012em", lineHeight: 1.55,
        color: mutedColor, margin: 0, ...bodyFont,
    }
    const small: React.CSSProperties = {
        fontFamily: "Inter, Arial, sans-serif", fontSize: 11,
        fontWeight: 600, letterSpacing: "0.095em", lineHeight: 1.3,
        textTransform: "uppercase", color: textColor, ...labelFont,
    }

    const top = (
        <div className="isp-top">
            <div style={{ ...small, display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: textColor }} />
                Explore the details
            </div>
            <div style={{ ...small, opacity: .56, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {String(selectedIndex + 1).padStart(2, "0")} / {String(safePins.length).padStart(2, "0")}
            </div>
        </div>
    )

    const content = (
        <>
            {top}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={selectedIndex}
                    initial={animate ? { opacity: 0, y: 12 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={animate ? { opacity: 0, y: -8 } : undefined}
                    transition={{ duration: animate ? duration * .65 : 0, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: "flex", flexDirection: "column", gap: 17, minWidth: 0 }}
                >
                    <div style={{ ...small, opacity: .65 }}>{item.label}</div>
                    <h2 style={heading}>{item.title}</h2>
                    <p style={{ ...paragraph, maxWidth: 355 }}>{item.description}</p>
                </motion.div>
            </AnimatePresence>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, minHeight: 88 }}>
                {linked && item.cta ? (
                    <div className="isp-cta">
                        <span style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 14, fontWeight: 600 }}>{item.cta}</span>
                        <span className="isp-arrow" aria-hidden="true">
                            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                                <path d="M4.5 12h14m-5.5-5.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                ) : (
                    <div style={{ fontFamily: "Inter, Arial, sans-serif", fontSize: 11, lineHeight: 1.4, opacity: .45, letterSpacing: ".08em" }}>
                        SELECT A POINT TO EXPLORE
                    </div>
                )}
                {item.image?.src ? (
                    <motion.img
                        key={(item.image.src || "") + selectedIndex}
                        className="isp-mini-photo"
                        src={item.image.src}
                        srcSet={item.image.srcSet}
                        alt={item.image.alt || ""}
                        draggable={false}
                        initial={animate ? { opacity: 0, scale: 1.05 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: animate ? duration : 0 }}
                        style={{ flexShrink: 0 }}
                    />
                ) : null}
            </div>
        </>
    )

    return (
        <div
            data-image-story-pins={uid}
            style={{
                width: "100%", height: "auto", minWidth: 0,
                boxSizing: "border-box", ...({ containerType: "inline-size" } as any),
                background, borderRadius: Math.max(0, radius) +  Math.max(0, padding),
                padding: Math.max(0, padding), ...variables, ...style,
            }}
        >
            <style>{CSS}</style>
            <div className="isp-layout">
                <div className="isp-media">
                    <img
                        className="isp-photo"
                        src={image?.src || IMAGE}
                        srcSet={image?.srcSet}
                        alt={image?.alt || "Feature overview"}
                        draggable={false}
                        style={{ objectPosition: imagePosition }}
                    />
                    <div aria-hidden="true" style={{
                        position: "absolute", inset: 0, background:
                            "linear-gradient(0deg,rgba(0,0,0,.38),transparent 27%)", pointerEvents: "none",
                    }} />
                    {safePins.map((pin, index) => {
                        const isActive = index === selectedIndex
                        return (
                            <button
                                type="button"
                                key={index}
                                className="isp-pin"
                                data-active={isActive ? "true" : "false"}
                                aria-pressed={isActive}
                                aria-label={"Show " + (pin.label || pin.title)}
                                onClick={() => setActive(index)}
                                style={{
                                    left: Math.max(7, Math.min(93, Number(pin.x) || 50)) + "%",
                                    top: Math.max(9, Math.min(91, Number(pin.y) || 50)) + "%",
                                    zIndex: isActive ? 5 : 2,
                                }}
                            >{String(index + 1).padStart(2, "0")}</button>
                        )
                    })}
                    <div className="isp-caption" aria-hidden="true">Select a point · Discover more</div>
                </div>
                {linked ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="isp-detail"
                        data-linked="true"
                        aria-label={(item.cta || "Explore") + ": " + item.title}
                    >
                        {content}
                    </a>
                ) : (
                    <div className="isp-detail" data-linked="false">{content}</div>
                )}
            </div>
        </div>
    )
}

ImageStoryPins.defaultProps = {
    image: { src: IMAGE, alt: "Creative workspace with laptop" },
    pins: DEFAULT_PINS,
    defaultActive: 0,
    imagePosition: "50% 50%",
    imageHeight: 515,
    radius: 22,
    gap: 10,
    padding: 10,
    background: "#F5F5F2",
    panelColor: "#DDF58B",
    textColor: "#171914",
    mutedColor: "#535B41",
    pinColor: "#FFFFFF",
    activePinColor: "#DDF58B",
    buttonColor: "#161916",
    buttonText: "#FFFFFF",
    duration: 0.46,
}

addPropertyControls(ImageStoryPins, {
    image: { type: ControlType.ResponsiveImage, title: "Main Image" },
    pins: { type: ControlType.Array, title: "Story Points", maxCount: 8, control: {
        type: ControlType.Object,
        controls: {
            label: { type: ControlType.String, title: "Label", defaultValue: "Feature" },
            title: { type: ControlType.String, title: "Title", defaultValue: "Make it yours." },
            description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "Tell the story behind this detail." },
            image: { type: ControlType.ResponsiveImage, title: "Detail Image" },
            x: { type: ControlType.Number, title: "Point X", min: 7, max: 93, step: 1, unit: "%", defaultValue: 50 },
            y: { type: ControlType.Number, title: "Point Y", min: 9, max: 91, step: 1, unit: "%", defaultValue: 50 },
            cta: { type: ControlType.String, title: "CTA", defaultValue: "Start Creating" },
            link: { type: ControlType.Link, title: "Link", defaultValue: "" },
        },
    }, defaultValue: DEFAULT_PINS },
    defaultActive: { type: ControlType.Number, title: "Open Point", min: 0, max: 7, step: 1, defaultValue: 0 },
    imagePosition: { type: ControlType.String, title: "Image Position", defaultValue: "50% 50%" },
    imageHeight: { type: ControlType.Number, title: "Desktop Height", min: 320, max: 820, step: 5, unit: "px", defaultValue: 515 },
    radius: { type: ControlType.Number, title: "Corner Radius", min: 0, max: 50, defaultValue: 22 },
    gap: { type: ControlType.Number, title: "Card Gap", min: 0, max: 32, defaultValue: 10 },
    padding: { type: ControlType.Number, title: "Outer Padding", min: 0, max: 35, defaultValue: 10 },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F5F5F2" },
    panelColor: { type: ControlType.Color, title: "Panel Color", defaultValue: "#DDF58B" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#171914" },
    mutedColor: { type: ControlType.Color, title: "Description", defaultValue: "#535B41" },
    pinColor: { type: ControlType.Color, title: "Pin", defaultValue: "#FFFFFF" },
    activePinColor: { type: ControlType.Color, title: "Active Pin", defaultValue: "#DDF58B" },
    buttonColor: { type: ControlType.Color, title: "CTA Background", defaultValue: "#161916" },
    buttonText: { type: ControlType.Color, title: "CTA Text", defaultValue: "#FFFFFF" },
    duration: { type: ControlType.Number, title: "Motion Speed", min: 0, max: 1.5, step: .05, defaultValue: .46 },
    headingFont: { type: ControlType.Font, title: "Heading", controls: "extended" },
    bodyFont: { type: ControlType.Font, title: "Body", controls: "extended" },
    labelFont: { type: ControlType.Font, title: "Labels", controls: "extended" },
})
