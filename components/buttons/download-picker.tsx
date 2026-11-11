import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence } from "framer-motion"

interface DownloadItem {
    label: string
    info?: string
    badge?: string
    source?: "file" | "link"
    file?: string
    link?: string
    saveAs?: string
    lineAbove?: boolean
}

interface ButtonStyle {
    font?: CSSProperties
    color?: string
    background?: string
    hover?: string
    border?: any
    radius?: string
    padX?: number
    padY?: number
    divider?: string
    shadow?: string
}

interface MenuStyle {
    align?: "left" | "right"
    direction?: "down" | "up"
    offset?: number
    minWidth?: number
    infoLayout?: "inline" | "right"
    font?: CSSProperties
    color?: string
    infoColor?: string
    background?: string
    hover?: string
    border?: any
    radius?: number
    padding?: number
    itemPadX?: number
    itemPadY?: number
    line?: string
    shadow?: string
    blur?: number
}

interface BadgeStyle {
    color?: string
    background?: string
}

interface DownloadPickerProps {
    trigger: "split" | "single"
    label: string
    icon: boolean
    items: DownloadItem[]
    mainItem: number
    button: ButtonStyle
    menu: MenuStyle
    badge: BadgeStyle
    showMenu: boolean
    style?: CSSProperties
}

function itemUrl(item: DownloadItem) {
    return item?.source === "link" ? item?.link : item?.file
}

function fileName(item: DownloadItem, url: string) {
    let base = ""
    try {
        base = decodeURIComponent(new URL(url).pathname.split("/").pop() || "")
    } catch (e) {}
    const ext = base.includes(".") ? base.split(".").pop() : ""
    const custom = (item.saveAs || "").trim()
    if (!custom) return base || "download"
    if (custom.includes(".") || !ext) return custom
    return `${custom}.${ext}`
}

// Only Framer-managed files are fetched; any other link is opened by the browser
function isFramerFile(url: string) {
    try {
        const { protocol, hostname } = new URL(url)
        return protocol === "https:" && hostname === "framerusercontent.com"
    } catch (e) {
        return false
    }
}

function openLink(url: string) {
    if (!/^https?:\/\//i.test(url)) return
    const a = document.createElement("a")
    a.href = url
    a.target = "_blank"
    a.rel = "noopener noreferrer"
    document.body.appendChild(a)
    a.click()
    a.remove()
}

async function downloadItem(item: DownloadItem) {
    const url = itemUrl(item)
    if (!url || typeof window === "undefined") return
    if (!isFramerFile(url)) {
        openLink(url)
        return
    }
    const name = fileName(item, url)
    try {
        // Cross-origin files ignore the download attribute, so go through a blob
        const res = await fetch(url, { mode: "cors" })
        if (!res.ok) throw new Error(String(res.status))
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = objectUrl
        a.download = name
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
    } catch (e) {
        openLink(url)
    }
}

function DownloadIcon() {
    return (
        <svg width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
            <path d="M12 4v11" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 20h14" />
        </svg>
    )
}

function Chevron({ open, isStatic }: { open: boolean; isStatic: boolean }) {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: isStatic ? "none" : "transform 0.2s ease" }}>
            <path d="M6 9l6 6 6-6" />
        </svg>
    )
}

/**
 * Download Picker
 *
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function DownloadPicker(props: DownloadPickerProps) {
    const {
        trigger = "split",
        label = "Download",
        icon = false,
        items = [],
        mainItem = 1,
        button = {},
        menu = {},
        badge = {},
        showMenu = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [hoverZone, setHoverZone] = useState<"" | "main" | "arrow">("")
    const [hoverItem, setHoverItem] = useState(-1)
    const [busy, setBusy] = useState(false)

    const isOpen = isStatic ? showMenu : open
    const isSplit = trigger === "split"
    const fixedWidth = style?.width === "100%"

    const {
        font: btnFont,
        color: btnColor = "#111111",
        background: btnBg = "#FFFFFF",
        hover: btnHover = "#F5F5F5",
        border: btnBorder = { borderWidth: 1, borderStyle: "solid", borderColor: "#DDDDDD" },
        radius: btnRadius = "8px",
        padX = 16,
        padY = 10,
        divider = "#DDDDDD",
        shadow: btnShadow,
    } = button

    const {
        align = "right",
        direction = "down",
        offset = 8,
        minWidth = 220,
        infoLayout = "inline",
        font: menuFont,
        color: menuColor = "#111111",
        infoColor = "#888888",
        background: menuBg = "#FFFFFF",
        hover: menuHover = "#F5F5F5",
        border: menuBorder = { borderWidth: 1, borderStyle: "solid", borderColor: "#E5E5E5" },
        radius: menuRadius = 10,
        padding: menuPadding = 6,
        itemPadX = 12,
        itemPadY = 10,
        line = "#E5E5E5",
        shadow: menuShadow = "0px 8px 24px 0px rgba(0,0,0,0.12)",
        blur = 0,
    } = menu

    const { color: badgeColor = "#111111", background: badgeBg = "#FFD43B" } = badge

    // Close on outside click or Escape
    useEffect(() => {
        if (isStatic || !open) return
        const onDown = (e: PointerEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                startTransition(() => setOpen(false))
            }
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") startTransition(() => setOpen(false))
        }
        document.addEventListener("pointerdown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open, isStatic])

    const toggle = () => {
        if (isStatic) return
        startTransition(() => setOpen((v) => !v))
    }

    const run = async (item: DownloadItem) => {
        if (isStatic || !item || !itemUrl(item)) return
        startTransition(() => {
            setOpen(false)
            setBusy(true)
        })
        await downloadItem(item)
        startTransition(() => setBusy(false))
    }

    const main = items[Math.min(Math.max(1, mainItem), items.length) - 1]
    const transition = (value: string) => (isStatic ? "none" : value)

    const zoneBase: CSSProperties = {
        all: "unset",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5em",
        cursor: isStatic ? "default" : busy ? "progress" : "pointer",
        color: btnColor,
        whiteSpace: "nowrap",
        transition: transition("background-color 0.15s ease"),
    }

    const mainZone = (
        <button
            type="button"
            aria-haspopup={isSplit ? undefined : "menu"}
            aria-expanded={isSplit ? undefined : isOpen}
            onClick={isSplit ? () => run(main) : toggle}
            onMouseEnter={isStatic ? undefined : () => setHoverZone("main")}
            onMouseLeave={isStatic ? undefined : () => setHoverZone("")}
            style={{
                ...zoneBase,
                flex: 1,
                padding: `${padY}px ${padX}px`,
                background: hoverZone === "main" || (!isSplit && hoverZone === "arrow") ? btnHover : "transparent",
            }}
        >
            {icon && <DownloadIcon />}
            <span style={{ opacity: busy ? 0.5 : 1, transition: transition("opacity 0.2s ease") }}>{label}</span>
            {!isSplit && <Chevron open={isOpen} isStatic={isStatic} />}
        </button>
    )

    const arrowZone = isSplit && (
        <button
            type="button"
            aria-label="More download options"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={toggle}
            onMouseEnter={isStatic ? undefined : () => setHoverZone("arrow")}
            onMouseLeave={isStatic ? undefined : () => setHoverZone("")}
            style={{
                ...zoneBase,
                padding: `${padY}px`,
                borderLeft: `1px solid ${divider}`,
                background: hoverZone === "arrow" ? btnHover : "transparent",
            }}
        >
            <Chevron open={isOpen} isStatic={isStatic} />
        </button>
    )

    const menuStyle: CSSProperties = {
        position: "absolute",
        zIndex: 10,
        [direction === "up" ? "bottom" : "top"]: `calc(100% + ${offset}px)`,
        [align === "left" ? "left" : "right"]: 0,
        minWidth: `max(100%, ${minWidth}px)`,
        boxSizing: "border-box",
        padding: menuPadding,
        display: "flex",
        flexDirection: "column",
        borderRadius: menuRadius,
        boxShadow: menuShadow,
        color: menuColor,
        fontSize: 14,
        ...menuFont,
    }

    // Fill + blur on their own layer, clipped with clip-path: under a scaled
    // ancestor (e.g. the Marketplace preview) Chrome lets backdrop-filter
    // escape border-radius and paint a blurred rectangle on hover repaints
    const menuBackdrop = (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: menuRadius,
                clipPath: `inset(0 round ${menuRadius}px)`,
                background: menuBg,
                backdropFilter: blur ? `blur(${blur}px)` : undefined,
                WebkitBackdropFilter: blur ? `blur(${blur}px)` : undefined,
                pointerEvents: "none",
            }}
        />
    )

    const menuContent = (
        <>
            {menuBackdrop}
            {items.map((item, i) => {
                const disabled = !itemUrl(item)
                return (
                    <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column" }}>
                        {item.lineAbove && i > 0 && (
                            <div
                                aria-hidden="true"
                                style={{
                                    height: 1,
                                    background: line,
                                    margin: `${menuPadding}px -${menuPadding}px`,
                                }}
                            />
                        )}
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => run(item)}
                            onMouseEnter={isStatic ? undefined : () => setHoverItem(i)}
                            onMouseLeave={isStatic ? undefined : () => setHoverItem(-1)}
                            style={{
                                all: "unset",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: `${itemPadY}px ${itemPadX}px`,
                                borderRadius: Math.max(0, menuRadius - menuPadding),
                                cursor: isStatic ? "default" : disabled ? "not-allowed" : "pointer",
                                whiteSpace: "nowrap",
                                background: hoverItem === i && !disabled ? menuHover : "transparent",
                                transition: transition("background-color 0.12s ease"),
                            }}
                        >
                            <span>{item.label}</span>
                            {infoLayout === "right" && item.badge && (
                                <Badge text={item.badge} color={badgeColor} background={badgeBg} />
                            )}
                            {item.info && (
                                <span style={{ color: infoColor, marginLeft: infoLayout === "right" ? "auto" : 0, paddingLeft: infoLayout === "right" ? 16 : 0 }}>
                                    {infoLayout === "inline" ? `(${item.info})` : item.info}
                                </span>
                            )}
                            {infoLayout === "inline" && item.badge && (
                                <Badge text={item.badge} color={badgeColor} background={badgeBg} />
                            )}
                        </button>
                    </div>
                )
            })}
        </>
    )

    const borderOverlay = btnBorder && (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: btnRadius,
                pointerEvents: "none",
                ...btnBorder,
            }}
        />
    )

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                display: "flex",
                width: fixedWidth ? "100%" : "max-content",
            }}
        >
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "stretch",
                    width: "100%",
                    background: btnBg,
                    borderRadius: btnRadius,
                    overflow: "hidden",
                    boxShadow: btnShadow,
                    fontSize: 14,
                    lineHeight: "1.2em",
                    ...btnFont,
                }}
            >
                {mainZone}
                {arrowZone}
                {borderOverlay}
            </div>

            {isStatic ? (
                isOpen && (
                    <div role="menu" style={menuStyle}>
                        {menuContent}
                        <MenuBorder border={menuBorder} radius={menuRadius} />
                    </div>
                )
            ) : (
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            role="menu"
                            initial={{ opacity: 0, y: direction === "up" ? 4 : -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: direction === "up" ? 4 : -4, scale: 0.98 }}
                            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
                            style={{
                                ...menuStyle,
                                transformOrigin: `${direction === "up" ? "bottom" : "top"} ${align}`,
                            }}
                        >
                            {menuContent}
                            <MenuBorder border={menuBorder} radius={menuRadius} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

function MenuBorder({ border, radius }: { border: any; radius: number }) {
    if (!border) return null
    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                borderRadius: radius,
                pointerEvents: "none",
                ...border,
            }}
        />
    )
}

function Badge({ text, color, background }: { text: string; color: string; background: string }) {
    return (
        <span
            style={{
                // inline-block, not flex: text-box-trim does not reach a flex container's anonymous text
                display: "inline-block",
                fontSize: "0.75em",
                lineHeight: 1,
                fontWeight: 600,
                // Trim the text box to cap height so the label sits optically centered
                ...({ textBoxTrim: "trim-both", textBoxEdge: "cap alphabetic" } as CSSProperties),
                padding: "4px 6px",
                borderRadius: 4,
                color,
                background,
            }}
        >
            {text}
        </span>
    )
}

addPropertyControls(DownloadPicker, {
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["split", "single"],
        optionTitles: ["Split", "Single"],
        defaultValue: "split",
        displaySegmentedControl: true,
        description: "Split: main zone downloads the Main Item, arrow opens the menu. Single: the whole button opens the menu.",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Download",
    },
    icon: {
        type: ControlType.Boolean,
        title: "Icon",
        defaultValue: false,
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Original" },
                info: { type: ControlType.String, title: "Info", defaultValue: "", placeholder: "1920 × 1080, .svg…" },
                badge: { type: ControlType.String, title: "Badge", defaultValue: "", placeholder: "Pro" },
                source: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["file", "link"],
                    optionTitles: ["Upload", "Link"],
                    defaultValue: "file",
                    displaySegmentedControl: true,
                },
                file: {
                    type: ControlType.File,
                    title: "File",
                    allowedFileTypes: ["*"],
                    hidden: (item: DownloadItem) => item.source === "link",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    description: "Opens in a new tab. Use Upload for a direct download.",
                    hidden: (item: DownloadItem) => item.source !== "link",
                },
                saveAs: {
                    type: ControlType.String,
                    title: "Save As",
                    defaultValue: "",
                    placeholder: "logo (optional)",
                },
                lineAbove: { type: ControlType.Boolean, title: "Line Above", defaultValue: false },
            },
        },
        defaultValue: [
            { label: "Small", info: "640 × 480" },
            { label: "Medium", info: "1920 × 1440" },
            { label: "Large", info: "2400 × 1800" },
            { label: "Original Size", info: "4592 × 3448", lineAbove: true },
        ],
    },
    mainItem: {
        type: ControlType.Number,
        title: "Main Item",
        defaultValue: 1,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
        description: "Item downloaded by the main zone (1 = first).",
        hidden: (props: Partial<DownloadPickerProps>) => props.trigger !== "split",
    },
    button: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "14px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
            },
            color: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
            background: { type: ControlType.Color, title: "Fill", defaultValue: "#FFFFFF" },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: "#F5F5F5" },
            border: {
                type: ControlType.Border,
                title: "Border",
                optional: true,
                defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "#DDDDDD" },
            },
            divider: { type: ControlType.Color, title: "Divider", defaultValue: "#DDDDDD" },
            radius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "8px" },
            padX: { type: ControlType.Number, title: "Pad X", defaultValue: 16, min: 0, max: 48, unit: "px" },
            padY: { type: ControlType.Number, title: "Pad Y", defaultValue: 10, min: 0, max: 32, unit: "px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow" },
        },
    },
    menu: {
        type: ControlType.Object,
        title: "Menu",
        controls: {
            align: {
                type: ControlType.Enum,
                title: "Align",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "right",
                displaySegmentedControl: true,
            },
            direction: {
                type: ControlType.Enum,
                title: "Open",
                options: ["down", "up"],
                optionTitles: ["Down", "Up"],
                defaultValue: "down",
                displaySegmentedControl: true,
            },
            infoLayout: {
                type: ControlType.Enum,
                title: "Info",
                options: ["inline", "right"],
                optionTitles: ["Inline", "Right"],
                defaultValue: "inline",
                displaySegmentedControl: true,
            },
            offset: { type: ControlType.Number, title: "Offset", defaultValue: 8, min: 0, max: 40, unit: "px" },
            minWidth: { type: ControlType.Number, title: "Min Width", defaultValue: 220, min: 0, max: 600, unit: "px" },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: { fontSize: "14px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.2em" },
            },
            color: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
            infoColor: { type: ControlType.Color, title: "Info Text", defaultValue: "#888888" },
            background: { type: ControlType.Color, title: "Fill", defaultValue: "#FFFFFF" },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: "#F5F5F5" },
            line: { type: ControlType.Color, title: "Line", defaultValue: "#E5E5E5" },
            border: {
                type: ControlType.Border,
                title: "Border",
                optional: true,
                defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "#E5E5E5" },
            },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 10, min: 0, max: 32, unit: "px" },
            padding: { type: ControlType.Number, title: "Padding", defaultValue: 6, min: 0, max: 24, unit: "px" },
            itemPadX: { type: ControlType.Number, title: "Item Pad X", defaultValue: 12, min: 0, max: 32, unit: "px" },
            itemPadY: { type: ControlType.Number, title: "Item Pad Y", defaultValue: 10, min: 0, max: 24, unit: "px" },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: "0px 8px 24px 0px rgba(0,0,0,0.12)" },
            blur: { type: ControlType.Number, title: "Blur", defaultValue: 0, min: 0, max: 40, unit: "px" },
        },
    },
    badge: {
        type: ControlType.Object,
        title: "Badge",
        controls: {
            color: { type: ControlType.Color, title: "Text", defaultValue: "#111111" },
            background: { type: ControlType.Color, title: "Fill", defaultValue: "#FFD43B" },
        },
    },
    showMenu: {
        type: ControlType.Boolean,
        title: "Show Menu",
        defaultValue: false,
        description: "Keeps the menu open on the canvas to style it. No effect on the live site.",
    },
})

DownloadPicker.displayName = "Download Picker"
