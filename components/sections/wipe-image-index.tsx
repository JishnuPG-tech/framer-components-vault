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

type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }

type Scene = {
    label: string
    headline: string
    description: string
    image?: ResponsiveImage
    imagePosition: string
    accent: string
    cta: string
    link: string
}

type Props = {
    scenes: Scene[]
    initialScene: number
    hoverToPreview: boolean
    animationDuration: number
    radius: number
    background: string
    sidebarBackground: string
    sidebarText: string
    sidebarMuted: string
    imageText: string
    imageOverlay: number
    headlineFont?: React.CSSProperties
    headlineSize: number
    indexSize: number
    indexFont?: React.CSSProperties
    descriptionFont?: React.CSSProperties
    showDescription?: boolean
    showFooter?: boolean
    style?: React.CSSProperties
}

const DEFAULT_SCENES: Scene[] = [
    {
        label: "Play it bold",
        headline: "Play it\nbold.",
        description: "Make something impossible to ignore.",
        image: { src: "https://images.unsplash.com/photo-1747253523869-4d5c4bd3f1e0?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800", alt: "Orange sculpture against cobalt blue steps" },
        imagePosition: "50% 50%",
        accent: "#D8FE43",
        cta: "Start Creating",
        link: "",
    },
    {
        label: "Think in color",
        headline: "Think in\ncolor.",
        description: "A little unexpected. A lot more memorable.",
        image: { src: "https://images.unsplash.com/photo-1693129499971-ae047f40ca70?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800", alt: "Fashion portrait with a colorful curtain" },
        imagePosition: "50% 45%",
        accent: "#FF84B5",
        cta: "Start Creating",
        link: "",
    },
    {
        label: "Feel everything",
        headline: "Feel\neverything.",
        description: "Bring a little emotion into every pixel.",
        image: { src: "https://images.unsplash.com/photo-1684442891387-bd147e671b46?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800", alt: "Expressive portrait illuminated by deep green light" },
        imagePosition: "54% 46%",
        accent: "#A5F9C2",
        cta: "Start Creating",
        link: "",
    },
    {
        label: "Break the rules",
        headline: "Break the\nrules.",
        description: "Your best ideas rarely play by the book.",
        image: { src: "https://images.unsplash.com/photo-1779398261180-9a8568c5a426?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=1800", alt: "Colorful editorial portrait of two women" },
        imagePosition: "50% 45%",
        accent: "#FF9C55",
        cta: "Start Creating",
        link: "",
    },
]

const CSS = [
    ".cwi-root,.cwi-root *{box-sizing:border-box}",
    ".cwi-root{container-type:inline-size;isolation:isolate;position:relative;overflow:hidden}",
    ".cwi-stage{height:100%;width:100%;display:flex;overflow:hidden}",
    ".cwi-media{position:relative;flex:1 1 66%;min-width:0;min-height:0;overflow:hidden;background:#26242a}",
    ".cwi-media-surface{display:block;position:absolute;inset:0;width:100%;height:100%;color:inherit;text-decoration:none;overflow:hidden}",
    ".cwi-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;will-change:clip-path,transform;pointer-events:none}",
    ".cwi-scrim{pointer-events:none;position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.09) 0%,rgba(0,0,0,0) 27%,rgba(0,0,0,.06) 48%,rgba(0,0,0,.60) 100%)}",
    ".cwi-media-content{position:absolute;left:0;right:0;bottom:0;padding:clamp(25px,4.6cqw,64px);z-index:3;pointer-events:none}",
    ".cwi-topline{position:absolute;top:clamp(22px,3.2cqw,40px);left:clamp(24px,4.6cqw,64px);right:clamp(24px,4.6cqw,64px);z-index:3;display:flex;justify-content:space-between;gap:20px;color:white;font:600 10px/1.2 'Inter',Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;pointer-events:none}",
    ".cwi-headline{margin:0;color:inherit;font:600 clamp(44px,7.6cqw,106px)/.89 'Inter',Arial,sans-serif;letter-spacing:-.085em;white-space:pre-line;max-width:96%;text-wrap:balance}",
    ".cwi-under{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-top:20px}",
    ".cwi-desc{margin:0;max-width:310px;color:inherit;font:400 clamp(12px,1.1cqw,15px)/1.45 'Inter',Arial,sans-serif;letter-spacing:-.02em}",
    ".cwi-cta{flex-shrink:0;min-height:42px;display:inline-flex;align-items:center;gap:24px;padding:12px 15px;background:#fff;color:#111;border-radius:100px;font:600 12px/1 'Inter',Arial,sans-serif;letter-spacing:-.02em;transition:transform .25s ease,background .25s ease}",
    ".cwi-media-surface[href]{cursor:pointer}",
    ".cwi-media-surface[href]:hover .cwi-cta,.cwi-media-surface[href]:focus-visible .cwi-cta{transform:translateY(-2px)}",
    ".cwi-media-surface[href]:focus-visible{outline:3px solid #D8FE43;outline-offset:-5px}",
    ".cwi-sidebar{flex:0 0 34%;min-width:295px;display:flex;flex-direction:column;padding:clamp(26px,3.1cqw,42px) clamp(23px,2.9cqw,40px);overflow:hidden}",
    ".cwi-sidebar-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:auto;padding-bottom:15px}",
    ".cwi-eyebrow{font:600 10px/1.3 'Inter',Arial,sans-serif;letter-spacing:.15em;text-transform:uppercase}",
    ".cwi-sidebar-index{font:500 12px/1 'Inter',Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.03em}",
    ".cwi-choices{display:flex;flex-direction:column;width:100%;gap:0}",
    ".cwi-row{appearance:none;display:flex;align-items:center;gap:16px;min-width:0;min-height:76px;padding:17px 0;border:0;border-top:1px solid rgba(255,255,255,.21);background:transparent;color:inherit;text-align:left;font:500 clamp(17px,1.85cqw,25px)/1.15 'Inter',Arial,sans-serif;letter-spacing:-.055em;cursor:pointer;transition:color .23s ease}",
    ".cwi-row:last-child{border-bottom:1px solid rgba(255,255,255,.21)}",
    ".cwi-row-number{flex:0 0 22px;align-self:center;font:500 10px/1 'Inter',Arial,sans-serif;letter-spacing:0;font-variant-numeric:tabular-nums;opacity:.55}",
    ".cwi-row-label{flex:1;min-width:0;overflow-wrap:anywhere}",
    ".cwi-row-arrow{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;font:400 22px/1 Arial,sans-serif;opacity:0;transform:translateX(-8px);transition:transform .3s cubic-bezier(.2,.75,.2,1),opacity .3s}",
    ".cwi-row[data-active='true'] .cwi-row-arrow{opacity:1;transform:translateX(0)}",
    ".cwi-row:hover .cwi-row-arrow,.cwi-row:focus-visible .cwi-row-arrow{opacity:1;transform:translateX(0)}",
    ".cwi-row:focus-visible{outline:2px solid currentColor;outline-offset:-2px}",
    ".cwi-sidebar-footer{margin-top:auto;padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font:500 10px/1.3 'Inter',Arial,sans-serif;letter-spacing:.09em;text-transform:uppercase}",
    "@container (max-width:760px){.cwi-stage{flex-direction:column}.cwi-media{flex:none;height:58%;width:100%}.cwi-sidebar{flex:none;width:100%;height:42%;min-width:0;padding:19px 24px 16px}.cwi-sidebar-top{margin-bottom:13px;padding-bottom:0}.cwi-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 22px}.cwi-row{min-height:65px;padding:10px 0;font-size:19px!important}.cwi-row:nth-last-child(-n+2){border-bottom:1px solid rgba(255,255,255,.21)}.cwi-sidebar-footer{padding-top:12px}.cwi-headline{font-size:clamp(52px,10.3cqw,82px)!important}.cwi-media-content{padding:25px 28px 27px}.cwi-topline{top:26px;left:28px;right:28px}.cwi-desc{font-size:13px}}",
    "@container (max-width:460px){.cwi-media{height:64%}.cwi-sidebar{height:36%;padding:16px 18px 12px}.cwi-media-content{padding:18px 22px 23px}.cwi-topline{top:21px;left:22px;right:22px;font-size:9px}.cwi-headline{font-size:clamp(54px,13.5cqw,70px)!important}.cwi-desc{font-size:11px;max-width:200px}.cwi-cta{min-height:34px;padding:10px 11px;gap:9px;font-size:10px}.cwi-under{margin-top:13px}.cwi-choices{gap:0 13px}.cwi-row{min-height:54px;padding:8px 0;font-size:15px!important;gap:7px}.cwi-row-number{flex-basis:17px;font-size:9px}.cwi-row-arrow{width:16px;font-size:17px}.cwi-sidebar-footer{font-size:8px;padding-top:8px}.cwi-eyebrow{font-size:9px}}",
    "@media(prefers-reduced-motion:reduce){.cwi-cta,.cwi-row,.cwi-row-arrow{transition:none!important}}",
].join("\n")

const clampIndex = (i: number, count: number) =>
    Math.max(0, Math.min(count - 1, Number.isFinite(i) ? Math.round(i) : 0))

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 610
 */
export default function ColorWipeImageIndex(props: Props) {
    const {
        scenes = DEFAULT_SCENES,
        initialScene = 0,
        hoverToPreview = true,
        animationDuration = 0.68,
        radius = 6,
        background = "#121315",
        sidebarBackground = "#171817",
        sidebarText = "#F6F7F0",
        sidebarMuted = "#9A9C92",
        imageText = "#FFFFFF",
        imageOverlay = 0.08,
        headlineFont,
        headlineSize = 84,
        indexSize = 22,
        indexFont,
        descriptionFont,
        showDescription = false,
        showFooter = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const shouldReduce = useReducedMotion()
    const reduced = isStatic || shouldReduce
    const safeScenes = Array.isArray(scenes) && scenes.length > 0 ? scenes : DEFAULT_SCENES
    const [activeIndex, setActiveIndex] = React.useState(() => clampIndex(initialScene, safeScenes.length))
    const safeIndex = clampIndex(activeIndex, safeScenes.length)
    const scene = safeScenes[safeIndex]
    const link = typeof scene.link === "string" ? scene.link.trim() : ""
    const canNavigate = Boolean(link)
    const duration = reduced ? 0 : Math.max(0.12, Math.min(1.5, animationDuration))
    const switchTo = React.useCallback((index: number) => setActiveIndex(clampIndex(index, safeScenes.length)), [safeScenes.length])

    React.useEffect(() => {
        setActiveIndex(clampIndex(initialScene, safeScenes.length))
    }, [initialScene, safeScenes.length])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        safeScenes.forEach((item) => {
            if (!item.image?.src) return
            const img = new Image()
            img.src = item.image.src
        })
    }, [scenes])

    const handleRowKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const count = safeScenes.length
        let next: number | null = null
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % count
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + count) % count
        if (event.key === "Home") next = 0
        if (event.key === "End") next = count - 1
        if (next === null) return
        event.preventDefault()
        switchTo(next)
        const target = event.currentTarget.parentElement?.querySelectorAll("button")[next]
        target?.focus()
    }

    const mediaContent = (
        <>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", background }}>
                <AnimatePresence initial={false} mode="sync">
                    <motion.div
                        key={"color-" + safeIndex}
                        initial={reduced ? false : { clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduced ? 0 : duration * 0.46, ease: [0.22, 1, 0.36, 1] }}
                        style={{ position: "absolute", inset: 0, backgroundColor: scene.accent || "#D8FE43" }}
                    />
                </AnimatePresence>
                <AnimatePresence initial={false} mode="sync">
                    <motion.img
                        key={"image-" + safeIndex + "-" + (scene.image?.src || "")}
                        className="cwi-photo"
                        src={scene.image?.src || DEFAULT_SCENES[0].image?.src}
                        srcSet={scene.image?.srcSet}
                        alt={scene.image?.alt || scene.label}
                        draggable={false}
                        initial={reduced ? false : { clipPath: "inset(0 100% 0 0)", scale: 1.045 }}
                        animate={{ clipPath: "inset(0 0% 0 0)", scale: 1 }}
                        exit={{ opacity: 0, transition: { delay: reduced ? 0 : duration * 0.85, duration: reduced ? 0 : 0.08 } }}
                        transition={{ duration, delay: reduced ? 0 : duration * 0.09, ease: [0.22, 1, 0.36, 1] }}
                        style={{ objectPosition: scene.imagePosition || "50% 50%" }}
                    />
                </AnimatePresence>
            </div>
            <div className="cwi-scrim" style={{ opacity: 0.95 + imageOverlay * 0.5 }} />
            <div className="cwi-topline">
                <span>MAKE SOMETHING DIFFERENT</span>
                <span>{String(safeIndex + 1).padStart(2, "0")} / {String(safeScenes.length).padStart(2, "0")}</span>
            </div>
            <div className="cwi-media-content" style={{ color: imageText }}>
                <h2 className="cwi-headline" style={{ ...headlineFont, fontSize: headlineSize, lineHeight: 0.9, fontWeight: 650, letterSpacing: "-0.075em" }}>{scene.headline || scene.label}</h2>
                {(canNavigate || (showDescription && !!scene.description)) && (
                    <div className="cwi-under" style={{ justifyContent: showDescription ? "space-between" : "flex-end" }}>
                        {showDescription && !!scene.description && (
                            <p className="cwi-desc" style={descriptionFont}>{scene.description}</p>
                        )}
                        {canNavigate && (
                            <span className="cwi-cta" aria-hidden="true">
                                <span>{scene.cta || "Discover More"}</span>
                                <span style={{ fontSize: 18, fontWeight: 400 }}>↗</span>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </>
    )

    return (
        <section
            className="cwi-root"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                borderRadius: Math.max(0, radius),
                background,
                ...style,
            }}
            aria-label="Interactive image index"
        >
            <style>{CSS}</style>
            <div className="cwi-stage">
                <div className="cwi-media">
                    {canNavigate ? (
                        <a className="cwi-media-surface" href={link} target="_blank" rel="noopener noreferrer" aria-label={(scene.cta || "Explore") + ": " + scene.label}>
                            {mediaContent}
                        </a>
                    ) : (
                        <div className="cwi-media-surface">{mediaContent}</div>
                    )}
                </div>
                <aside className="cwi-sidebar" style={{ background: sidebarBackground, color: sidebarText }}>
                    <div className="cwi-sidebar-top" style={{ marginBottom: showFooter ? undefined : 0 }}>
                        <span className="cwi-eyebrow" style={{ color: sidebarMuted }}>THE CREATIVE INDEX</span>
                        <span className="cwi-sidebar-index">0{safeIndex + 1} <span style={{ opacity: .4 }}>/</span> {String(safeScenes.length).padStart(2, "0")}</span>
                    </div>
                    <nav className="cwi-choices" aria-label="Choose a creative direction" style={{ margin: showFooter ? undefined : "auto 0" }}>
                        {safeScenes.map((item, i) => {
                            const selected = i === safeIndex
                            return (
                                <button
                                    type="button"
                                    key={i}
                                    className="cwi-row"
                                    data-active={selected ? "true" : "false"}
                                    aria-current={selected ? "true" : undefined}
                                    aria-label={"Show " + item.label}
                                    onClick={() => switchTo(i)}
                                    onMouseEnter={hoverToPreview && !isStatic ? () => switchTo(i) : undefined}
                                    onKeyDown={(event) => handleRowKey(event, i)}
                                    style={{ ...indexFont, fontSize: indexSize, fontWeight: 500, letterSpacing: "-0.055em", color: selected ? (item.accent || "#D8FE43") : sidebarText }}
                                >
                                    <span className="cwi-row-number">{String(i + 1).padStart(2, "0")}</span>
                                    <span className="cwi-row-label">{item.label}</span>
                                    <span className="cwi-row-arrow" aria-hidden="true">↗</span>
                                </button>
                            )
                        })}
                    </nav>
                    {showFooter && (
                        <div className="cwi-sidebar-footer" style={{ color: sidebarMuted }}>
                            <span>CHOOSE YOUR DIRECTION</span>
                            <span>↖ EXPLORE</span>
                        </div>
                    )}
                </aside>
            </div>
        </section>
    )
}

addPropertyControls(ColorWipeImageIndex, {
    scenes: {
        type: ControlType.Array,
        title: "Scenes",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "List Label", defaultValue: "New Direction" },
                headline: { type: ControlType.String, title: "Headline", defaultValue: "Make it\nmemorable.", displayTextArea: true },
                description: { type: ControlType.String, title: "Description", defaultValue: "A fresh way to show your ideas.", displayTextArea: true },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                imagePosition: { type: ControlType.String, title: "Image Position", defaultValue: "50% 50%" },
                accent: { type: ControlType.Color, title: "Accent", defaultValue: "#D8FE43" },
                cta: { type: ControlType.String, title: "CTA Label", defaultValue: "Start Creating" },
                link: { type: ControlType.Link, title: "Link", defaultValue: "" },
            },
        },
        defaultValue: DEFAULT_SCENES,
    },
    showDescription: { type: ControlType.Boolean, title: "Show Description", defaultValue: false },
    showFooter: { type: ControlType.Boolean, title: "Show Footer", defaultValue: false },
    initialScene: { type: ControlType.Number, title: "Initial Scene", min: 0, max: 7, step: 1, defaultValue: 0 },
    hoverToPreview: { type: ControlType.Boolean, title: "Hover Preview", defaultValue: true },
    animationDuration: { type: ControlType.Number, title: "Wipe Speed", min: 0.2, max: 1.5, step: 0.05, defaultValue: 0.68 },
    radius: { type: ControlType.Number, title: "Radius", min: 0, max: 36, step: 1, defaultValue: 6 },
    background: { type: ControlType.Color, title: "Media Fallback", defaultValue: "#121315" },
    sidebarBackground: { type: ControlType.Color, title: "Panel", defaultValue: "#171817" },
    sidebarText: { type: ControlType.Color, title: "Panel Text", defaultValue: "#F6F7F0" },
    sidebarMuted: { type: ControlType.Color, title: "Muted Text", defaultValue: "#9A9C92" },
    imageText: { type: ControlType.Color, title: "Image Text", defaultValue: "#FFFFFF" },
    imageOverlay: { type: ControlType.Number, title: "Overlay", min: 0, max: 1, step: 0.05, defaultValue: 0.08 },
    headlineSize: { type: ControlType.Number, title: "Headline Size", min: 36, max: 130, step: 1, defaultValue: 84 },
    indexSize: { type: ControlType.Number, title: "Index Size", min: 13, max: 34, step: 1, defaultValue: 22 },
    headlineFont: { type: ControlType.Font, title: "Headline Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "82px", variant: "Semibold", letterSpacing: "-0.075em", lineHeight: "0.92em" } },
    indexFont: { type: ControlType.Font, title: "Index Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "22px", variant: "Medium", letterSpacing: "-0.05em", lineHeight: "1.15em" } },
    descriptionFont: { type: ControlType.Font, title: "Body Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.4em" } },
})
