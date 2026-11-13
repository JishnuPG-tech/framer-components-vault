/**
 * List/Grid Flip Toggle
 * Creator: Frankie, framer-expert.com
 * Day 2 of the 100 Days of Components
 *
 * Install:
 * 1. In Framer, go to Assets > Code > New Component and paste this file.
 * 2. Drop the component on the canvas. Edit items and colors in the property panel.
 *    CMS: set Source to CMS and connect a Collection List to the Collection slot. Name the
 *    item layers Title, Tag, Year and Image; the component reads them and renders its own cards.
 * 3. Fonts: pick any font in the Font control. It uses your project's default font until you do.
 *
 * Layout: width and height flex to the frame. Not position fixed or absolute, so the canvas preview and the published site should match.
 */
import * as React from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Item {
    title: string
    tag: string
    year: string
    image?: ImageValue
}

interface ListGridFlipProps {
    source: "items" | "cms"
    collection?: React.ReactNode
    items: Item[]
    defaultMode: "list" | "grid"
    showYear: boolean
    align: "top" | "center"
    background: string
    pillText: string
    cardBackground: string
    textColor: string
    accent: string
    radius: number
    buttonRadius: number
    tagRadius: number
    gap: number
    duration: number
    font?: React.CSSProperties
}

type Mode = "list" | "grid"
const EXPO_IN_OUT: [number, number, number, number] = [0.87, 0, 0.13, 1]

const img = (id: string, alt: string): ImageValue => ({
    src: `https://framerusercontent.com/images/${id}.jpg`,
    alt,
})

const DEFAULT_ITEMS: Item[] = [
    {
        title: "Pulse",
        tag: "Analytics",
        year: "2026",
        image: img("euLOO6Ou9QZdgqKU751KI8t8bk", "Gold-lit facade of a building at night"),
    },
    {
        title: "Relay",
        tag: "Developer API",
        year: "2026",
        image: img("6Wkw88YdEewX7DRohHkl5bog", "Dark ribbed tower against a grey sky"),
    },
    {
        title: "Stack",
        tag: "Infrastructure",
        year: "2025",
        image: img("hHdtsofstKIbMVMeRf04wZgOjk", "Curved high-rise with a warm edge of light at night"),
    },
    {
        title: "Focus",
        tag: "Productivity",
        year: "2025",
        image: img("jpD6ZiA6ijTJf73dMpNiDIwh8I", "Grid of warm lit windows on a dark facade"),
    },
    {
        title: "Orbit",
        tag: "Mobile App",
        year: "2024",
        image: img("Rkz63WK1d4h3V7XAVmNnIUQw60", "City lights reflected in a gold glass facade"),
    },
    {
        title: "Hello",
        tag: "Onboarding",
        year: "2024",
        image: img("S4OIP9UoWC0Yeu3PhSnE0hM9UQ", "Single glowing window on a dark building"),
    },
]

// Reads the hidden Collection List: one card per layer named "Title", siblings named Tag / Year / Image.
function readCollection(root: HTMLElement): Item[] {
    const titles = Array.from(root.querySelectorAll<HTMLElement>('[data-framer-name="Title"]'))
    return titles.map((title) => {
        // Climb to the largest ancestor that still holds only this Title: that is the CMS item.
        let card: HTMLElement = title
        while (
            card.parentElement &&
            card.parentElement !== root &&
            card.parentElement.querySelectorAll('[data-framer-name="Title"]').length === 1
        )
            card = card.parentElement
        const text = (name: string) =>
            card.querySelector(`[data-framer-name="${name}"]`)?.textContent?.trim() || ""
        const pic =
            card.querySelector<HTMLImageElement>('[data-framer-name="Image"] img') ||
            card.querySelector<HTMLImageElement>("img")
        const src = pic?.getAttribute("src")
        return {
            title: title.textContent?.trim() || "",
            tag: text("Tag"),
            year: text("Year"),
            image: pic && src
                ? { src, srcSet: pic.getAttribute("srcset") || undefined, alt: pic.alt }
                : undefined,
        }
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 */
export default function ListGridFlip(props: ListGridFlipProps) {
    const {
        source = "items",
        collection,
        items = DEFAULT_ITEMS,
        defaultMode = "list",
        showYear = true,
        align = "center",
        background = "rgba(0, 0, 0, 0)",
        pillText = "#141414",
        cardBackground = "#1F1F1F",
        textColor = "#F4F4F2",
        accent = "#A3A3A0",
        radius = 16,
        buttonRadius = 100,
        tagRadius = 100,
        gap = 12,
        duration = 800,
        font,
    } = props

    const isStatic = useIsStaticRenderer()
    const uid = React.useId()
    const [mode, setMode] = React.useState<Mode>(defaultMode)
    const [reduceMotion, setReduceMotion] = React.useState(false)
    // Text only fades after a user switch, never on first paint.
    const switched = React.useRef(false)
    const cmsRef = React.useRef<HTMLDivElement>(null)
    const ghostRef = React.useRef<HTMLDivElement>(null)
    const [otherHeight, setOtherHeight] = React.useState(0)

    React.useEffect(() => {
        const ghost = ghostRef.current
        if (!ghost || typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(() =>
            setOtherHeight(Math.round(ghost.getBoundingClientRect().height))
        )
        observer.observe(ghost)
        return () => observer.disconnect()
    }, [])
    const [cmsItems, setCmsItems] = React.useState<Item[]>([])
    // CMS cards only exist after hydration; hide until read so toggle and cards appear together.
    const [cmsReady, setCmsReady] = React.useState(false)
    const isCms = source === "cms"

    React.useEffect(() => {
        const root = cmsRef.current
        if (!isCms || !root || typeof MutationObserver === "undefined") return
        let last = ""
        const sync = () => {
            const next = readCollection(root)
            const key = JSON.stringify(next)
            if (key === last) return
            last = key
            setCmsItems(next)
            if (next.length) setCmsReady(true)
        }
        sync()
        // Empty or unconnected list: reveal anyway so the hint shows.
        const reveal = window.setTimeout(() => setCmsReady(true), 1500)
        // CMS items stream in (and paginate) after mount; we only read, never write, inside root.
        const observer = new MutationObserver(sync)
        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["src", "srcset"],
        })
        return () => {
            observer.disconnect()
            window.clearTimeout(reveal)
        }
    }, [isCms, collection])

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduceMotion(mq.matches)
        const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
        mq.addEventListener("change", onChange)
        return () => mq.removeEventListener("change", onChange)
    }, [])

    React.useEffect(() => {
        setMode(defaultMode)
    }, [defaultMode])

    const skip = isStatic || reduceMotion
    const isGrid = mode === "grid"
    const centered = align === "center"
    const seconds = Math.max(duration, 0) / 1000
    // expo.inOut: images and the toggle pill morph to their new box.
    // Only a user switch animates; load, CMS arrival and resizes snap so nothing drifts into place.
    const morphing = React.useRef(false)
    const morphTimer = React.useRef(0)
    React.useEffect(() => () => window.clearTimeout(morphTimer.current), [])
    const morph =
        skip || !morphing.current
            ? { duration: 0 }
            : { duration: seconds, ease: EXPO_IN_OUT }
    const innerRadius = Math.max(radius - 6, 0)

    const switchTo = (target: Mode) => {
        if (target === mode) return
        switched.current = true
        morphing.current = true
        window.clearTimeout(morphTimer.current)
        morphTimer.current = window.setTimeout(() => {
            morphing.current = false
        }, Math.max(duration, 0) + 100)
        setMode(target)
    }

    // Framer drops image defaults inside Array controls, so items without an image fall back to the demo set.
    const imageAt = (item: Item, i: number): ImageValue | undefined => {
        if (item.image?.src) return item.image
        // CMS items without an image show the plain placeholder, never a demo photo.
        if (isCms) return undefined
        return DEFAULT_ITEMS[i % DEFAULT_ITEMS.length].image
    }
    const shown = isCms ? cmsItems : items

    const tagStyle: React.CSSProperties = {
        padding: "3px 10px",
        borderRadius: tagRadius,
        background: accent,
        color: pillText,
        fontSize: 11,
        whiteSpace: "nowrap",
    }

    const listStyle = (g: boolean): React.CSSProperties =>
        g
            ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", alignContent: "start", gap }
            : { display: "flex", flexDirection: "column", gap }
    const cardStyle = (g: boolean): React.CSSProperties => ({
        background: cardBackground,
        color: textColor,
        boxSizing: "border-box",
        minWidth: 0,
        display: "flex",
        flexDirection: g ? "column" : "row",
        alignItems: g ? "stretch" : "center",
        gap: g ? 10 : 14,
        padding: g ? 10 : "10px 14px",
    })
    // 3:2 in both views so the morph only scales, never stretches.
    const thumbStyle = (g: boolean): React.CSSProperties => ({
        width: g ? "100%" : 72,
        aspectRatio: "3 / 2",
        flexShrink: 0,
        overflow: "hidden",
    })
    const metaStyle = (g: boolean): React.CSSProperties =>
        g
            ? { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, minWidth: 0 }
            : { flex: 1, display: "flex", alignItems: "center", gap: 14, minWidth: 0 }
    const meta = (item: Item, g: boolean) =>
        g ? (
            <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, width: "100%", minWidth: 0 }}>
                    <span style={ellipsis}>{item.title}</span>
                    {showYear && <span style={{ opacity: 0.6, fontSize: 12 }}>{item.year}</span>}
                </div>
                <span style={{ ...tagStyle, fontSize: 10 }}>{item.tag}</span>
            </>
        ) : (
            <>
                <span style={{ ...ellipsis, flex: 1 }}>{item.title}</span>
                <span style={tagStyle}>{item.tag}</span>
                {showYear && <span style={{ opacity: 0.6, fontSize: 12 }}>{item.year}</span>}
            </>
        )

    const ellipsis: React.CSSProperties = {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: 20,
                background,
                borderRadius: radius,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                color: textColor,
                opacity: !isCms || cmsReady || isStatic ? 1 : 0,
                transition: skip ? "none" : "opacity 200ms ease",
                ...font,
            }}
        >
            <div
                role="group"
                aria-label="Layout"
                style={{
                    alignSelf: "flex-end",
                    // Auto margins centre toggle + cards as one block, and still scroll safely when taller.
                    marginTop: centered ? "auto" : 0,
                    display: "inline-flex",
                    padding: 4,
                    borderRadius: buttonRadius,
                    background: cardBackground,
                }}
            >
                {(["list", "grid"] as Mode[]).map((m) => (
                    <button
                        key={m}
                        type="button"
                        aria-pressed={mode === m}
                        onClick={() => switchTo(m)}
                        style={{
                            position: "relative",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            padding: "6px 16px",
                            borderRadius: Math.max(buttonRadius - 4, 0),
                            color: mode === m ? pillText : textColor,
                            font: "inherit",
                            fontSize: 12,
                            transition: skip ? "none" : "color 300ms ease 200ms",
                        }}
                    >
                        {mode === m && (
                            <motion.span
                                layoutId={`${uid}-pill`}
                                transition={morph}
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: Math.max(buttonRadius - 4, 0),
                                    background: textColor,
                                }}
                            />
                        )}
                        <span style={{ position: "relative" }}>
                            {m === "list" ? "List" : "Grid"}
                        </span>
                    </button>
                ))}
            </div>

            <motion.div
                layoutScroll
                style={{
                    flex: "0 1 auto",
                    minHeight: 0,
                    overflowY: "auto",
                    marginBottom: centered ? "auto" : 0,
                }}
            >
                {isCms && shown.length === 0 && (
                    <p style={{ margin: 0, opacity: 0.6, fontSize: 13 }}>
                        Connect a Collection List and name its layers Title, Tag, Year and Image.
                    </p>
                )}
                <div style={{ ...listStyle(isGrid), minHeight: otherHeight }}>
                    {shown.map((item, i) => {
                        const image = imageAt(item, i)
                        const fadeIn = switched.current && !skip
                        return (
                            <motion.div
                                key={i}
                                layout
                                transition={morph}
                                initial={false}
                                animate={{ borderRadius: isGrid ? radius : innerRadius }}
                                style={cardStyle(isGrid)}
                            >
                                <motion.div
                                    layout
                                    transition={morph}
                                    initial={false}
                                    animate={{ borderRadius: isGrid ? innerRadius : 6 }}
                                    style={{
                                        ...thumbStyle(isGrid),
                                        background: `linear-gradient(135deg, ${accent}, #3a3a3a)`,
                                    }}
                                >
                                    {image?.src && (
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            alt={image.alt || ""}
                                            draggable={false}
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )}
                                </motion.div>
                                <motion.div
                                    key={mode}
                                    layout="position"
                                    initial={fadeIn ? { opacity: 0 } : false}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        layout: morph,
                                        opacity: {
                                            duration: 0.3,
                                            ease: "easeOut",
                                            delay:
                                                seconds * 0.69 +
                                                (0.2 * i) / Math.max(shown.length - 1, 1),
                                        },
                                    }}
                                    style={metaStyle(isGrid)}
                                >
                                    {meta(item, isGrid)}
                                </motion.div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>

            {/* Invisible copy of the other view (no images) so both views reserve the same height. */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 20,
                    right: 20,
                    top: 0,
                    height: 0,
                    overflow: "hidden",
                    visibility: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div ref={ghostRef} style={listStyle(!isGrid)}>
                    {shown.map((item, i) => (
                        <div key={i} style={cardStyle(!isGrid)}>
                            <div style={thumbStyle(!isGrid)} />
                            <div style={metaStyle(!isGrid)}>{meta(item, !isGrid)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* The connected Collection List only feeds data; it stays in the DOM but out of view and the a11y tree. */}
            {isCms && (
                <div
                    ref={cmsRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        overflow: "hidden",
                        visibility: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    {collection}
                </div>
            )}
        </div>
    )
}

addPropertyControls(ListGridFlip, {
    source: {
        type: ControlType.Enum,
        title: "Source",
        description: "Items: edit cards here. CMS: connect a Collection List.",
        options: ["items", "cms"],
        optionTitles: ["Items", "CMS"],
        defaultValue: "items",
        displaySegmentedControl: true,
    },
    collection: {
        type: ControlType.Slot,
        title: "Collection",
        description: "A Collection List whose item has layers named Title, Tag, Year and Image.",
        maxCount: 1,
        hidden: (p: any) => p.source !== "cms",
    },
    items: {
        type: ControlType.Array,
        hidden: (p: any) => p.source === "cms",
        title: "Items",
        description: "Title, tag, year and image for each card.",
        maxCount: 12,
        defaultValue: DEFAULT_ITEMS,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Project" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Tag" },
                year: {
                    type: ControlType.String,
                    title: "Year",
                    defaultValue: "2026",
                    hidden: (_: any, root: any) => root?.showYear === false,
                },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
    },
    showYear: {
        type: ControlType.Boolean,
        title: "Show Year",
        description: "Show or hide the year on every card.",
        defaultValue: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        description: "Vertical position of the toggle and cards inside the frame.",
        options: ["top", "center"],
        optionTitles: ["Top", "Center"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    defaultMode: {
        type: ControlType.Enum,
        title: "Start In",
        description: "Layout shown on first load.",
        options: ["list", "grid"],
        optionTitles: ["List", "Grid"],
        defaultValue: "list",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        description: "Panel behind the cards. Transparent by default.",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card",
        defaultValue: "#1F1F1F",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F4F4F2",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        description: "Tag pills.",
        defaultValue: "#A3A3A0",
    },
    pillText: {
        type: ControlType.Color,
        title: "Pill Text",
        description: "Text on the tag pills and the active toggle.",
        defaultValue: "#141414",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 48,
        step: 1,
        displayStepper: true,
    },
    buttonRadius: {
        type: ControlType.Number,
        title: "Toggle Radius",
        description: "Corner radius of the List / Grid toggle. The inner pill follows it.",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    tagRadius: {
        type: ControlType.Number,
        title: "Tag Radius",
        description: "Corner radius of the tag pills.",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Morph",
        description: "How long cards take to move between views. Instant with reduced motion.",
        defaultValue: 800,
        min: 200,
        max: 1500,
        step: 50,
        unit: "ms",
        displayStepper: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            lineHeight: "1.4em",
            variant: "Regular",
        },
    },
})
