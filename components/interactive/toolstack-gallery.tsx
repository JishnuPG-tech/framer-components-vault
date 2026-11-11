// Interactive Toolstack: a row of tool icons. Hover one and it takes the stage:
//   preview cards spring up above it, its name grows in under it, and the other icons blur back.
//   Move along the row and the focus follows; leave and it all clears.
//   touch: nothing is focused until a tap; tap an icon to show it, tap it again (or anywhere else) to clear.
//   links: a tool with a link opens it on click; on touch the first tap shows the tool, the second opens the link.
// Smoothness: every preview is mounted up front (images decoded before the first hover),
// focus changes are immediate (no transitions queue), and only the small icons use blur;
// previews and names move with transform and opacity only.
import { useEffect, useRef, useState, type CSSProperties } from "react"
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

interface Img { src: string; alt?: string }
interface Tool { name: string; icon?: Img; iconZoom?: number; previewA?: Img; previewB?: Img; link?: string }

interface InteractiveStackProps {
    tools: Tool[]
    blur: number
    iconSize: number
    iconRadius: number
    iconGap: number
    previewGap: number
    showLabels: boolean
    newTab: boolean
    ink: string
    muted: string
    titleFont: CSSProperties
    textFont: CSSProperties
    style?: CSSProperties
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const IN = { type: "spring" as const, stiffness: 700, damping: 46, mass: 0.5 }
const OUT = { duration: 0.16, ease: EASE }
// ask the Framer image CDN for a small copy: previews show at ~230px, icons at 64px
const sized = (src: string | undefined, w: number) =>
    src && src.includes("framerusercontent.com/images/") ? src.split("?")[0] + "?scale-down-to=" + w : src
const img = (src: string) => ({ src, alt: "" })

// defaults: four generic demo tools with neutral icons and preview mockups (buyers replace them in the panel)
const DEFAULT_TOOLS: Tool[] = [
    { name: "Design", icon: img("https://framerusercontent.com/images/t8dKka9nBqWzftNtulnWi3p1fA.png"), previewA: img("https://framerusercontent.com/images/bE81IwGutDwb8gbJZYNH0s7gHA.jpg"), previewB: img("https://framerusercontent.com/images/xt8vesY3ZgUPtlkygf3KYkA1Ug.jpg") },
    { name: "Build", icon: img("https://framerusercontent.com/images/lrcO9OvjxqOE5Yn8ALcHduOuEpg.png"), previewA: img("https://framerusercontent.com/images/IeV4ewEYbzud8yd3shyXweqow8.jpg"), previewB: img("https://framerusercontent.com/images/D7C9sVirTLlLQqsStZtW97tdeFg.jpg") },
    { name: "Research", icon: img("https://framerusercontent.com/images/oA4E29XD5xXszqMNHhHfvUlZNMo.png"), previewA: img("https://framerusercontent.com/images/0F5OkBXhhITwisS4EptimmLSq4.jpg"), previewB: img("https://framerusercontent.com/images/1wjFsBB3pkvjRseugfXpj0N5reU.jpg") },
    { name: "AI", icon: img("https://framerusercontent.com/images/7hZAYWwn4rkqNLrmyn6GnChx7ng.png"), previewA: img("https://framerusercontent.com/images/LpJS69dx48mVmPQUfHhfKf3y5s.jpg"), previewB: img("https://framerusercontent.com/images/TwZ1QqZ2LP5XErMg11VqlYWj1Y.jpg") },
]

/**
 * Interactive Toolstack
 *
 * @framerIntrinsicWidth 900
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function InteractiveStack(props: InteractiveStackProps) {
    const {
        tools = DEFAULT_TOOLS,
        blur = 6,
        iconSize = 64,
        iconRadius = 14,
        iconGap = 80,
        previewGap = 16,
        showLabels = true,
        newTab = true,
        ink = "#15110E",
        muted = "rgba(21, 17, 14, 0.06)",
        titleFont,
        textFont,
        style,
    } = props
    // any field left empty in the panel falls back to the default for that slot
    const list = (tools.length ? tools : DEFAULT_TOOLS).map((t, i) => {
        const d = DEFAULT_TOOLS[i % DEFAULT_TOOLS.length]
        return { name: t.name || d.name, icon: t.icon?.src ? t.icon : d.icon, iconZoom: t.icon?.src ? t.iconZoom || 1 : d.iconZoom || 1, previewA: t.previewA?.src ? t.previewA : d.previewA, previewB: t.previewB?.src ? t.previewB : d.previewB, link: t.link || "" }
    })
    // each tool is its icon plus 24px for the name pill; below the full row width the layout goes narrow
    const itemWidth = iconSize + 24
    const minWide = Math.max(620, list.length * itemWidth + (list.length - 1) * iconGap)
    const minWideRef = useRef(minWide)
    minWideRef.current = minWide
    const reduce = useReducedMotion()
    // canvas and export render a still frame: the plain row with no animation, previews or interaction
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const [focus, setFocus] = useState<number | null>(null)
    const [narrow, setNarrow] = useState(false)
    const [touch, setTouch] = useState(false)

    // decode the previews once the row is near the viewport, so they never delay the first paint
    useEffect(() => {
        const el = rootRef.current
        if (!el || isStatic) return
        const load = () => {
            for (const t of list) for (const p of [t.previewA, t.previewB, t.icon]) {
                if (!p?.src) continue
                const im = new Image()
                im.src = sized(p.src, p === t.icon ? iconSize * 2 : 640) as string
                im.decode?.().catch(() => {})
            }
        }
        if (typeof IntersectionObserver === "undefined") { load(); return }
        const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { load(); io.disconnect() } }, { rootMargin: "600px" })
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic, list.map((t) => t.previewA?.src + "|" + t.previewB?.src).join()])

    // narrow widths put the previews under the row instead of above each icon
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const check = () => {
            const n = el.offsetWidth < minWideRef.current
            setNarrow((o) => (o === n ? o : n))
        }
        const ro = new ResizeObserver(check)
        ro.observe(el)
        check()
        if (typeof window !== "undefined") setTouch(!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        return () => ro.disconnect()
    }, [minWide])

    // touch: tapping outside clears the focus
    useEffect(() => {
        if (!touch || focus === null) return
        const off = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setFocus(null) }
        window.addEventListener("pointerdown", off)
        return () => window.removeEventListener("pointerdown", off)
    }, [touch, focus])

    const on = focus !== null
    const text: CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: 1.45, color: ink, ...textFont }
    const title: CSSProperties = { fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 24, lineHeight: 1, letterSpacing: "-0.4px", textTransform: "uppercase", color: ink, whiteSpace: "nowrap", ...titleFont }
    const labelPill: CSSProperties = { ...text, fontSize: 13, lineHeight: 1, fontWeight: 500, padding: "7px 12px", borderRadius: 999, background: muted, whiteSpace: "nowrap" }
    const fade = "opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)"

    // interaction only runs live; static renders never change focus
    const focusOn = (i: number | null) => { if (!isStatic) setFocus(i) }

    const cards = (tool: (typeof list)[number], shown: boolean) => isStatic ? null : (
        <motion.div
            aria-hidden
            initial={false}
            animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.92 }}
            transition={reduce ? { duration: 0 } : shown ? IN : OUT}
            style={{ position: "relative", width: 300, height: 190, pointerEvents: "none", willChange: "transform, opacity", contain: "layout" /* no paint containment: it clipped the tilted cards */ }}
        >
            {[tool.previewB, tool.previewA].map((p, k) =>
                p?.src ? (
                    <img
                        key={k}
                        src={sized(p.src, 640)}
                        alt=""
                        decoding="async"
                        style={{
                            // whole image at its own shape, fitted inside the card box, anchored to the bottom centre
                            position: "absolute", left: "50%", bottom: k ? 22 : 8, translate: k ? "-38% 0" : "-62% 0",
                            width: "auto", height: "auto", maxWidth: k ? 230 : 200, maxHeight: k ? 160 : 140,
                            borderRadius: 14, background: "#FFFFFF", rotate: k ? "4deg" : "-7deg",
                            boxShadow: "0 1px 3px rgba(0,0,0,.08), 0 14px 28px -18px rgba(21,17,14,.45)",
                        }}
                    />
                ) : null
            )}
        </motion.div>
    )

    return (
        <div
            ref={rootRef}
            onPointerLeave={() => !touch && focusOn(null)}
            // the previews (190px) sit Preview Gap above the row on wide screens, below it on narrow ones
            style={{ ...style, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: previewGap + 8, paddingTop: narrow ? 0 : 194 + previewGap }}
        >
            <div role="list" style={{ display: "flex", justifyContent: "center", gap: narrow ? Math.min(iconGap, 8) : iconGap, width: "100%" }}>
                {list.map((tool, i) => {
                    const me = focus === i
                    const dim = on && !me
                    // a tool with a link renders as a real link, so it works with middle-click and screen readers
                    const El: any = tool.link ? "a" : "button"
                    const linkProps = tool.link
                        ? { href: tool.link, target: newTab ? "_blank" : undefined, rel: newTab ? "noopener noreferrer" : undefined }
                        : { type: "button", "aria-pressed": me }
                    return (
                        <div key={i} role="listitem" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr)" /* lets big icons shrink in a narrow row */, justifyItems: "center", gap: 12, ...(narrow ? { flex: "1 1 0", minWidth: 0 } : { width: itemWidth }) }}>
                            {/* previews float above their icon; always mounted, only shown when focused */}
                            {!narrow && (
                                <div style={{ position: "absolute", bottom: "100%", left: "50%", translate: `-50% -${previewGap}px`, zIndex: 3 }}>{cards(tool, me)}</div>
                            )}
                            <El
                                {...linkProps}
                                aria-label={tool.name}
                                onPointerEnter={() => !touch && focusOn(i)}
                                onFocus={() => !touch && focusOn(i)}
                                onClick={(e: { preventDefault: () => void }) => {
                                    // touch + link: the first tap shows the tool, the second follows the link
                                    if (tool.link) { if (touch && !me) { e.preventDefault(); focusOn(i) } return }
                                    focusOn(touch && me ? null : i)
                                }}
                                style={{
                                    display: "block", width: "100%", color: "inherit", textDecoration: "none",
                                    border: 0, padding: 0, background: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
                                    filter: dim ? `blur(${blur}px)` : "blur(0px)", opacity: dim ? 0.35 : 1, transform: me ? "scale(1.06)" : "scale(1)",
                                    transition: isStatic ? "none" : "filter 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
                                    willChange: isStatic ? "auto" : "filter, transform",
                                }}
                            >
                                {tool.icon?.src ? (
                                    // every icon sits in the same rounded tile; Zoom crops away any padding baked into the file.
                                    // maxWidth lets the tile shrink when many tools share a narrow row
                                    <span style={{ display: "block", margin: "0 auto", width: iconSize, maxWidth: "100%", aspectRatio: "1 / 1", borderRadius: iconRadius, overflow: "hidden" }}>
                                        <img src={sized(tool.icon.src, iconSize * 2)} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", transform: `scale(${tool.iconZoom})` }} />
                                    </span>
                                ) : (
                                    <span style={{ display: "grid", placeItems: "center", margin: "0 auto", width: iconSize, maxWidth: "100%", aspectRatio: "1 / 1", borderRadius: iconRadius, background: ink, color: "#FFFFFF", ...title, fontSize: Math.round(iconSize * 0.34) }}>{tool.name.slice(0, 2)}</span>
                                )}
                            </El>
                            {/* the small label, swapped for the name in display type when focused */}
                            <div style={{ position: "relative", height: 30, display: "grid", placeItems: "center" }}>
                                {showLabels && <span style={{ ...labelPill, opacity: me ? 0 : dim ? 0.3 : 1, transition: isStatic ? "none" : fade }}>{tool.name}</span>}
                                {!isStatic && <motion.span
                                    aria-hidden
                                    initial={false}
                                    animate={me ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                                    transition={reduce ? { duration: 0 } : me ? { duration: 0.24, ease: EASE } : OUT}
                                    style={{ ...title, position: "absolute", pointerEvents: "none" }}
                                >
                                    {tool.name}
                                </motion.span>}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* narrow screens: the focused tool's previews sit under the row */}
            {narrow && !isStatic && (
                <div style={{ position: "relative", width: 300, height: focus === null ? 0 : 190, transition: "height 220ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
                    {list.map((tool, i) => (
                        <div key={i} style={{ position: "absolute", inset: 0 }}>{cards(tool, focus === i)}</div>
                    ))}
                </div>
            )}

        </div>
    )
}

// the name shown in the Assets panel and insert menu
InteractiveStack.displayName = "Interactive Toolstack"

addPropertyControls(InteractiveStack, {
    tools: {
        type: ControlType.Array,
        title: "Tools",
        description: "Up to 6. Each tool has a name, an icon and two preview images. Empty images use the demo ones.",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Tool" },
                icon: { type: ControlType.ResponsiveImage, title: "Icon" },
                previewA: { type: ControlType.ResponsiveImage, title: "Preview 1" },
                previewB: { type: ControlType.ResponsiveImage, title: "Preview 2" },
                iconZoom: { type: ControlType.Number, title: "Icon Zoom", defaultValue: 1, min: 1, max: 1.6, step: 0.01, description: "Raise it when the logo file has empty space around it" },
                link: { type: ControlType.Link, title: "Link", description: "Optional. Leave empty for no link." },
            },
        },
        defaultValue: DEFAULT_TOOLS.map(({ name }) => ({ name })),
    },
    iconSize: { type: ControlType.Number, title: "Icon Size", description: "Size of the icon tiles. On narrow screens they shrink to fit.", defaultValue: 64, min: 32, max: 128, unit: "px" },
    iconRadius: { type: ControlType.Number, title: "Icon Corners", description: "Corner radius of the icon tiles.", defaultValue: 14, min: 0, max: 64, unit: "px" },
    iconGap: { type: ControlType.Number, title: "Icon Spacing", description: "Space between the tools. Phones use a tight 8px so the row fits.", defaultValue: 80, min: 0, max: 200, unit: "px" },
    previewGap: { type: ControlType.Number, title: "Preview Gap", description: "Space between the preview cards and the icons.", defaultValue: 16, min: 0, max: 80, unit: "px" },
    showLabels: { type: ControlType.Boolean, title: "Labels", description: "The small name under each icon. The large name still appears on focus.", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    newTab: { type: ControlType.Boolean, title: "New Tab", description: "Open tool links in a new tab. On touch, the first tap shows the tool and the second opens its link.", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No", hidden: (p: Partial<InteractiveStackProps>) => !p.tools?.some((t) => t.link) },
    blur: { type: ControlType.Number, title: "Blur Others", description: "How much the other icons blur while one is in focus.", defaultValue: 6, min: 0, max: 16, unit: "px" },
    titleFont: { type: ControlType.Font, title: "Title Font", description: "The large name that appears under the focused icon.", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "24px", variant: "Extra Bold", letterSpacing: "-0.4px", lineHeight: "1em" } },
    textFont: { type: ControlType.Font, title: "Text Font", description: "The small name pills.", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "15px", variant: "Regular", lineHeight: "1.45em" } },
    ink: { type: ControlType.Color, title: "Text", defaultValue: "#15110E" },
    muted: { type: ControlType.Color, title: "Label Pill", description: "Background of the small name pills.\n\nComponent crafted by [Eniyan Rajaa K](https://x.com/_eniyanrajaa_)", defaultValue: "rgba(21, 17, 14, 0.06)" },
})
