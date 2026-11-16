import { useEffect, useId, useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type LinkItem = { title: string; link: string; newTab?: boolean }

interface LayoutGroup {
    mode: "auto" | "desktop" | "mobile"
    breakpoint: number
    openWidth: number
}
interface LogoGroup {
    text: string
    link: string
}
interface CtaGroup {
    show: boolean
    label: string
    link: string
    fill: string
    color: string
    newTab: boolean
}
interface ColorsGroup {
    background: string
    border: string
    text: string
    hover: string
}
interface EffectsGroup {
    blur: number
    shadow: string
}

interface Props {
    layout: Partial<LayoutGroup>
    logoSlot?: ReactNode
    logo: Partial<LogoGroup>
    links: LinkItem[]
    cta: Partial<CtaGroup>
    font: CSSProperties
    colors: Partial<ColorsGroup>
    effects: Partial<EffectsGroup>
    style?: CSSProperties
}

const DEFAULT_SHADOW = "0px 12px 32px -12px rgba(0, 0, 0, 0.45)"

const DEFAULTS = {
    layout: { mode: "auto", breakpoint: 810, openWidth: 340 } as LayoutGroup,
    logo: { text: "Logo", link: "/" } as LogoGroup,
    cta: {
        show: true,
        label: "Let's talk",
        link: "/contact",
        fill: "#FFFFFF",
        color: "#0A0A0A",
        newTab: false,
    } as CtaGroup,
    colors: {
        background: "rgba(18, 18, 18, 0.72)",
        border: "rgba(255, 255, 255, 0.08)",
        text: "#FFFFFF",
        hover: "rgba(255, 255, 255, 0.1)",
    } as ColorsGroup,
    effects: { blur: 20, shadow: DEFAULT_SHADOW } as EffectsGroup,
}

const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const

// Treat bare domains ("google.com", "www.site.com/page") as absolute URLs instead of
// slugs of the current page. Site paths, anchors and mailto/tel links pass through.
function toHref(url?: string): string | undefined {
    const u = (url || "").trim()
    if (!u) return undefined
    if (/^([a-z][a-z0-9+.-]*:|\/|#|\?|\.)/i.test(u)) return u
    return "https://" + u
}

/**
 * Morphing pill navigation
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PillNav(props: Props) {
    const { logoSlot, links = [], font, style } = props
    const layout = { ...DEFAULTS.layout, ...props.layout }
    const logo = { ...DEFAULTS.logo, ...props.logo }
    const cta = { ...DEFAULTS.cta, ...props.cta }
    const colors = { ...DEFAULTS.colors, ...props.colors }
    const effects = { ...DEFAULTS.effects, ...props.effects }

    const id = useId()
    const [isMobile, setIsMobile] = useState(layout.mode === "mobile")
    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)

    // Responsive switch: Auto follows the viewport, Desktop/Mobile force a layout (handy on canvas)
    useEffect(() => {
        if (layout.mode !== "auto") {
            setIsMobile(layout.mode === "mobile")
            return
        }
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(max-width: " + layout.breakpoint + "px)")
        const update = () => setIsMobile(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [layout.mode, layout.breakpoint])

    useEffect(() => {
        if (!isMobile) setOpen(false)
    }, [isMobile])

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open])

    const expanded = isMobile && open

    // A connected canvas frame/component replaces the text logo
    const hasLogoSlot = Array.isArray(logoSlot)
        ? logoSlot.length > 0
        : Boolean(logoSlot)

    const linkReset: CSSProperties = {
        color: colors.text,
        textDecoration: "none",
        whiteSpace: "nowrap",
        outline: "none",
    }

    const ctaButton = (full = false) => (
        <motion.a
            href={toHref(cta.link)}
            target={cta.newTab ? "_blank" : undefined}
            rel={cta.newTab ? "noopener noreferrer" : undefined}
            onClick={() => setOpen(false)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            style={{
                ...linkReset,
                color: cta.color,
                background: cta.fill,
                padding: full ? "14px 18px" : "10px 18px",
                borderRadius: 999,
                fontWeight: 600,
                textAlign: "center",
                display: "block",
            }}
        >
            {cta.label}
        </motion.a>
    )

    return (
        <motion.nav
            layout
            transition={spring}
            aria-label="Main"
            style={{
                ...style,
                ...font,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: 6,
                width: expanded ? layout.openWidth : "auto",
                maxWidth: "calc(100vw - 32px)",
                background: colors.background,
                border: "1px solid " + colors.border,
                // Mobile keeps one radius (half the closed height) so the close morph never balloons into a circle
                borderRadius: isMobile ? 28 : 999,
                backdropFilter: "blur(" + effects.blur + "px)",
                WebkitBackdropFilter: "blur(" + effects.blur + "px)",
                boxShadow: effects.shadow || "none",
                overflow: "hidden",
                boxSizing: "border-box",
            }}
        >
            {/* Top row */}
            <motion.div
                layout="position"
                transition={spring}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: isMobile ? 20 : 4,
                    width: expanded ? "100%" : "auto",
                }}
            >
                <a
                    href={toHref(logo.link)}
                    aria-label={hasLogoSlot ? logo.text : undefined}
                    style={{
                        ...linkReset,
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                        fontWeight: 650,
                        padding: hasLogoSlot
                            ? "4px 10px 4px 8px"
                            : "10px 14px 10px 12px",
                    }}
                >
                    {hasLogoSlot ? logoSlot : logo.text}
                </a>

                {!isMobile && (
                    <div
                        style={{ display: "flex", gap: 2 }}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {links.map((item, i) => (
                            <a
                                key={i}
                                href={toHref(item.link)}
                                target={item.newTab ? "_blank" : undefined}
                                rel={item.newTab ? "noopener noreferrer" : undefined}
                                onMouseEnter={() => setHovered(i)}
                                onFocus={() => setHovered(i)}
                                onBlur={() => setHovered(null)}
                                style={{
                                    ...linkReset,
                                    position: "relative",
                                    padding: "10px 16px",
                                    borderRadius: 999,
                                }}
                            >
                                {hovered === i && (
                                    <motion.span
                                        layoutId={id + "-hover"}
                                        transition={spring}
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: 999,
                                            background: colors.hover,
                                        }}
                                    />
                                )}
                                <motion.span
                                    animate={{
                                        opacity:
                                            hovered === null
                                                ? 0.75
                                                : hovered === i
                                                  ? 1
                                                  : 0.45,
                                    }}
                                    transition={{ duration: 0.2 }}
                                    style={{ position: "relative" }}
                                >
                                    {item.title}
                                </motion.span>
                            </a>
                        ))}
                    </div>
                )}

                {!isMobile && cta.show && ctaButton()}

                {isMobile && (
                    <button
                        type="button"
                        aria-label={open ? "Close menu" : "Open menu"}
                        aria-expanded={open}
                        onClick={() => setOpen((o) => !o)}
                        style={{
                            position: "relative",
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            border: "none",
                            borderRadius: 999,
                            background: colors.hover,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            padding: 0,
                        }}
                    >
                        <motion.span
                            animate={open ? { rotate: 45, y: 0 } : { rotate: 0, y: -3 }}
                            transition={spring}
                            style={{
                                position: "absolute",
                                width: 16,
                                height: 1.5,
                                borderRadius: 2,
                                background: colors.text,
                            }}
                        />
                        <motion.span
                            animate={open ? { rotate: -45, y: 0 } : { rotate: 0, y: 3 }}
                            transition={spring}
                            style={{
                                position: "absolute",
                                width: 16,
                                height: 1.5,
                                borderRadius: 2,
                                background: colors.text,
                            }}
                        />
                    </button>
                )}
            </motion.div>

            {/* Expanded mobile menu */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            paddingTop: 4,
                        }}
                    >
                        {links.map((item, i) => (
                            <motion.a
                                key={i}
                                href={toHref(item.link)}
                                target={item.newTab ? "_blank" : undefined}
                                rel={item.newTab ? "noopener noreferrer" : undefined}
                                onClick={() => setOpen(false)}
                                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                    transition: { ...spring, delay: 0.06 + i * 0.045 },
                                }}
                                whileHover={{ backgroundColor: colors.hover }}
                                style={{
                                    ...linkReset,
                                    fontSize: "1.2em",
                                    padding: "14px 16px",
                                    borderRadius: 18,
                                    backgroundColor: "rgba(0,0,0,0)",
                                }}
                            >
                                {item.title}
                            </motion.a>
                        ))}
                        {cta.show && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: { ...spring, delay: 0.06 + links.length * 0.045 },
                                }}
                                style={{ paddingTop: 6 }}
                            >
                                {ctaButton(true)}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}

PillNav.defaultProps = {
    layout: DEFAULTS.layout,
    logo: DEFAULTS.logo,
    links: [
        { title: "Work", link: "/work" },
        { title: "About", link: "/about" },
        { title: "Services", link: "/services" },
        { title: "Journal", link: "/journal" },
    ],
    cta: DEFAULTS.cta,
    colors: DEFAULTS.colors,
    effects: DEFAULTS.effects,
}

addPropertyControls(PillNav, {
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["auto", "desktop", "mobile"],
                optionTitles: ["Auto", "Desktop", "Mobile"],
                displaySegmentedControl: true,
                defaultValue: "auto",
            },
            breakpoint: {
                type: ControlType.Number,
                title: "Breakpoint",
                min: 320,
                max: 1600,
                unit: "px",
                defaultValue: 810,
                hidden: (p: LayoutGroup) => p.mode !== "auto",
            },
            openWidth: {
                type: ControlType.Number,
                title: "Open width",
                min: 240,
                max: 600,
                unit: "px",
                defaultValue: 340,
            },
        },
    },
    logoSlot: {
        type: ControlType.ComponentInstance,
        title: "Logo frame",
    },
    logo: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Logo",
                description: "Shown when no frame is connected. Used as the link's accessible name otherwise.",
            },
            link: { type: ControlType.Link, title: "Link" },
        },
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Link" },
                link: { type: ControlType.Link, title: "Link" },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                },
            },
        },
    },
    cta: {
        type: ControlType.Object,
        title: "CTA",
        controls: {
            show: { type: ControlType.Boolean, title: "Show", defaultValue: true },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Let's talk",
                hidden: (p: CtaGroup) => !p.show,
            },
            link: {
                type: ControlType.Link,
                title: "Link",
                hidden: (p: CtaGroup) => !p.show,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
                hidden: (p: CtaGroup) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#0A0A0A",
                hidden: (p: CtaGroup) => !p.show,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p: CtaGroup) => !p.show,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 14,
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(18, 18, 18, 0.72)" },
            border: { type: ControlType.Color, title: "Border", defaultValue: "rgba(255, 255, 255, 0.08)" },
            text: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
            hover: { type: ControlType.Color, title: "Hover", defaultValue: "rgba(255, 255, 255, 0.1)" },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            blur: { type: ControlType.Number, title: "Blur", min: 0, max: 60, unit: "px", defaultValue: 20 },
            shadow: { type: ControlType.BoxShadow, title: "Shadow", defaultValue: DEFAULT_SHADOW },
        },
    },
})
