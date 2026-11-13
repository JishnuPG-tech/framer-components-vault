// PillDock — floating glass pill navigation for Framer
// SAM™ · Paste into Assets → Code → New component, then set the instance to Fixed (top center).

import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, AnimatePresence, LayoutGroup } from "framer-motion"

type NavLink = { label: string; link: string; newTab?: boolean }

const SHADOW =
    "inset 0px 1px 0px 0px rgba(255, 255, 255, 0.06), 0px 12px 40px -12px rgba(0, 0, 0, 0.45)"

// Links work as URLs, exactly as entered. Plain web addresses get https://
const resolveHref = (href?: string) => {
    if (!href) return undefined
    const h = href.trim()
    if (!h) return undefined
    // Has a scheme (https:, mailto:, tel:...), or is a path / hash / relative URL: keep as is
    if (/^[a-z][a-z0-9+.-]*:/i.test(h) || /^(\/|#|\.)/.test(h)) return h
    // Looks like a domain (example.com, www.example.com/page): make it a full URL
    if (/^[^\s/]+\.[a-z]{2,}([/?#]|$)/i.test(h)) return "https://" + h
    return h
}

// Opens a link in a new tab when enabled
const tab = (on?: boolean) =>
    on ? { target: "_blank", rel: "noopener noreferrer" } : {}

const spring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.8 }

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PillDock(props) {
    const {
        links,
        shrinkOnScroll,
        breakpoint,
        layout = "auto",
        logoFrame,
        logo,
        cta,
        look,
        effects,
        style,
    } = props

    const {
        image: logoImage,
        text: logoText = "Goodness",
        link: logoLink,
        newTab: logoNewTab,
    } = logo ?? {}
    const {
        show: showCta = true,
        label: ctaLabel = "Let's talk",
        link: ctaLink = "/contact",
        newTab: ctaNewTab,
        icon: showCtaIcon = true,
        customIcon: ctaCustomIcon,
        iconSize: ctaIconSize = 12,
        fill: ctaBackground = "#FFFFFF",
        textColor: ctaTextColor = "#0A0A0A",
    } = cta ?? {}
    const {
        font,
        background = "rgba(16, 16, 16, 0.72)",
        borderColor = "rgba(255, 255, 255, 0.08)",
        textColor = "#FFFFFF",
        mutedColor = "rgba(255, 255, 255, 0.58)",
        indicatorColor = "rgba(255, 255, 255, 0.10)",
    } = look ?? {}
    const { blur = 18, shadow = SHADOW } = effects ?? {}

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [scrolled, setScrolled] = useState(false)
    const [hovered, setHovered] = useState<number | null>(null)
    const [active, setActive] = useState(0)
    const [open, setOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const groupId = useRef(`dock-${Math.random().toString(36).slice(2, 8)}`)

    useEffect(() => {
        if (isCanvas || typeof window === "undefined") return

        const onScroll = () => setScrolled(window.scrollY > 40)
        const onResize = () => setIsMobile(window.innerWidth < breakpoint)
        onScroll()
        onResize()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)

        // Highlight the link matching the current page
        const clean = (p: string) => p.replace(/\/$/, "") || "/"
        const here = clean(window.location.pathname)
        const idx = (links as NavLink[]).findIndex((l) => {
            const href = resolveHref(l.link)
            if (!href || href.startsWith("#")) return false
            try {
                const url = new URL(href, window.location.href)
                return (
                    url.origin === window.location.origin &&
                    clean(url.pathname) === here
                )
            } catch {
                return false
            }
        })
        if (idx >= 0) setActive(idx)

        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
        }
    }, [breakpoint, links, isCanvas])

    // Layout: forced per breakpoint on the canvas, or auto by window width
    const mode: "desktop" | "tablet" | "phone" =
        layout !== "auto"
            ? layout
            : isMobile
              ? "phone"
              : "desktop"
    const phone = mode === "phone"
    const tablet = mode === "tablet"

    const compact = shrinkOnScroll && scrolled && !open
    const indicatorIndex = hovered ?? active

    // Closed radius = half the closed bar height, so the shape never balloons into a circle
    const radius = phone ? (open ? 24 : compact ? 26 : 29) : 999

    const shell: React.CSSProperties = {
        ...style,
        ...font,
        display: "flex",
        flexDirection: "column",
        background,
        color: textColor,
        border: `1px solid ${borderColor}`,
        backdropFilter: `blur(${blur}px) saturate(160%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
        boxShadow: Array.isArray(shadow)
            ? shadow.join(", ")
            : shadow || "none",
        overflow: "hidden",
        width: phone ? "100%" : "auto",
        boxSizing: "border-box",
    }

    // A frame connected on the canvas takes priority over text/image
    const frame = React.Children.toArray(logoFrame)[0] as
        | React.ReactElement
        | undefined

    const Logo = (
        <a
            {...tab(logoNewTab)}
            href={
                resolveHref(logoLink || (links?.[0] as NavLink)?.link) || "/"
            }
            aria-label={logoText || "Home"}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: textColor,
                textDecoration: "none",
                fontWeight: 600,
                paddingLeft: 10,
                paddingRight: 6,
                whiteSpace: "nowrap",
            }}
        >
            {frame ? (
                <motion.div
                    animate={{ scale: compact ? 0.88 : 1 }}
                    transition={spring}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        transformOrigin: "left center",
                        pointerEvents: "none",
                    }}
                >
                    {React.cloneElement(frame, {
                        style: {
                            ...(frame.props?.style || {}),
                            position: "relative",
                        },
                    })}
                </motion.div>
            ) : logoImage?.src ? (
                <img
                    src={logoImage.src}
                    alt={logoImage.alt || logoText}
                    style={{ height: 22, width: "auto", display: "block" }}
                />
            ) : (
                logoText
            )}
        </a>
    )

    const ctaIcon = ctaCustomIcon?.src ? (
        <img
            src={ctaCustomIcon.src}
            alt={ctaCustomIcon.alt || ""}
            aria-hidden={ctaCustomIcon.alt ? undefined : true}
            style={{
                width: ctaIconSize,
                height: ctaIconSize,
                objectFit: "contain",
                display: "block",
                flexShrink: 0,
            }}
        />
    ) : (
        <Arrow size={ctaIconSize} />
    )

    const Cta = showCta ? (
            <motion.a
                href={resolveHref(ctaLink)}
                {...tab(ctaNewTab)}
                whileTap={{ scale: 0.96 }}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: compact ? "8px 14px" : "10px 18px",
                    borderRadius: 999,
                    background: ctaBackground,
                    color: ctaTextColor,
                    textDecoration: "none",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    transition: "padding 0.35s cubic-bezier(.2,.8,.2,1)",
                }}
            >
                <RollText text={ctaLabel} hovered={false} hoverable />
                {showCtaIcon && ctaIcon}
            </motion.a>
    ) : null

    return (
        <LayoutGroup id={groupId.current}>
            <motion.nav
                layout
                initial={false}
                animate={{ borderRadius: radius }}
                transition={spring}
                style={shell}
                aria-label="Main navigation"
            >
                <motion.div
                    layout="position"
                    animate={{
                        paddingTop: compact ? 5 : 8,
                        paddingBottom: compact ? 5 : 8,
                        paddingLeft: compact ? 6 : 8,
                        paddingRight: compact ? 5 : 8,
                        gap: compact ? 4 : 10,
                    }}
                    transition={spring}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {Logo}

                    {!phone && (
                        <ul
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                listStyle: "none",
                                margin: 0,
                                padding: 0,
                            }}
                        >
                            {(links as NavLink[]).map((l, i) => {
                                const on = indicatorIndex === i
                                return (
                                    <li
                                        key={`${l.label}-${i}`}
                                        style={{ position: "relative" }}
                                    >
                                        {on && (
                                            <motion.span
                                                layoutId="dock-indicator"
                                                transition={spring}
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    borderRadius: 999,
                                                    background: indicatorColor,
                                                }}
                                            />
                                        )}
                                        <a
                                            href={resolveHref(l.link)}
                                            {...tab(l.newTab)}
                                            onMouseEnter={() => setHovered(i)}
                                            onFocus={() => setHovered(i)}
                                            onClick={() => setActive(i)}
                                            aria-current={
                                                active === i
                                                    ? "page"
                                                    : undefined
                                            }
                                            style={{
                                                position: "relative",
                                                display: "block",
                                                padding: compact
                                                    ? "8px 12px"
                                                    : "10px 14px",
                                                color:
                                                    on || active === i
                                                        ? textColor
                                                        : mutedColor,
                                                textDecoration: "none",
                                                transition:
                                                    "color 0.25s ease, padding 0.35s cubic-bezier(.2,.8,.2,1)",
                                                outline: "none",
                                            }}
                                        >
                                            <RollText
                                                text={l.label}
                                                hovered={hovered === i}
                                            />
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    {!phone && Cta}

                    {phone && (
                        <button
                            onClick={() => setOpen((o) => !o)}
                            aria-expanded={open}
                            aria-label={open ? "Close menu" : "Open menu"}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 999,
                                border: "none",
                                background: indicatorColor,
                                cursor: "pointer",
                                position: "relative",
                                flexShrink: 0,
                            }}
                        >
                            {[0, 1].map((n) => (
                                <motion.span
                                    key={n}
                                    animate={
                                        open
                                            ? { rotate: n ? -45 : 45, y: 0 }
                                            : { rotate: 0, y: n ? 3 : -3 }
                                    }
                                    transition={spring}
                                    style={{
                                        position: "absolute",
                                        left: 12,
                                        right: 12,
                                        top: "50%",
                                        height: 1.5,
                                        marginTop: -0.75,
                                        borderRadius: 2,
                                        background: textColor,
                                    }}
                                />
                            ))}
                        </button>
                    )}
                </motion.div>

                <AnimatePresence initial={false}>
                    {phone && open && (
                        <motion.div
                            key="panel"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.15 },
                            }}
                            style={{ padding: "4px 8px 10px" }}
                        >
                            {(links as NavLink[]).map((l, i) => (
                                <motion.a
                                    key={`${l.label}-m-${i}`}
                                    href={resolveHref(l.link)}
                                    {...tab(l.newTab)}
                                    onClick={() => {
                                        setActive(i)
                                        setOpen(false)
                                    }}
                                    initial={{
                                        opacity: 0,
                                        y: 14,
                                        filter: "blur(6px)",
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        filter: "blur(0px)",
                                    }}
                                    transition={{
                                        ...spring,
                                        delay: 0.04 * i + 0.05,
                                    }}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "14px 12px",
                                        borderRadius: 14,
                                        color:
                                            active === i
                                                ? textColor
                                                : mutedColor,
                                        textDecoration: "none",
                                        fontSize: "1.5em",
                                        letterSpacing: "-0.02em",
                                        background:
                                            active === i
                                                ? indicatorColor
                                                : "transparent",
                                    }}
                                >
                                    {l.label}
                                    <span
                                        style={{ fontSize: 12, opacity: 0.5 }}
                                    >
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </motion.a>
                            ))}
                            {showCta && (
                                <motion.a
                                    href={resolveHref(ctaLink)}
                                    {...tab(ctaNewTab)}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        ...spring,
                                        delay: 0.04 * links.length + 0.08,
                                    }}
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: 8,
                                        marginTop: 8,
                                        padding: "14px 18px",
                                        borderRadius: 999,
                                        background: ctaBackground,
                                        color: ctaTextColor,
                                        textDecoration: "none",
                                        fontWeight: 600,
                                    }}
                                >
                                    {ctaLabel} {showCtaIcon && ctaIcon}
                                </motion.a>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.nav>
        </LayoutGroup>
    )
}

/* ---------- Text that rolls up on hover ---------- */
function RollText({
    text,
    hovered,
    hoverable = false,
}: {
    text: string
    hovered: boolean
    hoverable?: boolean
}) {
    const [self, setSelf] = useState(false)
    const on = hovered || (hoverable && self)
    return (
        <span
            onMouseEnter={hoverable ? () => setSelf(true) : undefined}
            onMouseLeave={hoverable ? () => setSelf(false) : undefined}
            style={{
                display: "inline-block",
                overflow: "hidden",
                height: "1.2em",
                lineHeight: "1.2em",
                verticalAlign: "top",
            }}
        >
            <motion.span
                animate={{ y: on ? "-50%" : "0%" }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ display: "flex", flexDirection: "column" }}
            >
                <span>{text}</span>
                <span aria-hidden>{text}</span>
            </motion.span>
        </span>
    )
}

function Arrow({ size = 12 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
                d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ---------- Property controls ---------- */
PillDock.defaultProps = {
    links: [
        { label: "Home", link: "/" },
        { label: "About", link: "/about" },
        { label: "Work", link: "/work" },
        { label: "Services", link: "/services" },
        { label: "Contact", link: "/contact" },
    ],
    shrinkOnScroll: true,
    breakpoint: 810,
}

addPropertyControls(PillDock, {
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "desktop", "tablet", "phone"],
        optionTitles: ["Auto", "Desktop", "Tablet", "Phone"],
        defaultValue: "auto",
        description: "Set per breakpoint so the canvas shows each version.",
    },
    breakpoint: {
        hidden: (p) => p.layout !== "auto",
        type: ControlType.Number,
        title: "Mobile below",
        min: 320,
        max: 1440,
        unit: "px",
    },
    shrinkOnScroll: { type: ControlType.Boolean, title: "Shrink on scroll" },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Link" },
                link: { type: ControlType.Link },
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
    logoFrame: {
        type: ControlType.ComponentInstance,
        title: "Logo frame",
    },
    logo: {
        type: ControlType.Object,
        title: "Logo",
        controls: {
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
            },
            text: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Goodness",
                description:
                    "Used as fallback and as the link's accessible name.",
            },
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
    cta: {
        type: ControlType.Object,
        title: "Button",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Let's talk",
                hidden: (p) => !p.show,
            },
            link: {
                type: ControlType.Link,
                title: "Link",
                hidden: (p) => !p.show,
            },
            newTab: {
                type: ControlType.Boolean,
                title: "New tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                hidden: (p) => !p.show,
            },
            icon: {
                type: ControlType.Boolean,
                title: "Icon",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                hidden: (p) => !p.show,
            },
            customIcon: {
                type: ControlType.ResponsiveImage,
                title: "Custom icon",
                description: "Leave empty to use the default arrow. SVG or PNG.",
                hidden: (p) => !p.show || !p.icon,
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon size",
                defaultValue: 12,
                min: 8,
                max: 40,
                unit: "px",
                hidden: (p) => !p.show || !p.icon,
            },
            fill: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",
                hidden: (p) => !p.show,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text color",
                defaultValue: "#0A0A0A",
                hidden: (p) => !p.show,
            },
        },
    },
    look: {
        type: ControlType.Object,
        title: "Style",
        controls: {
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: 14,
                    lineHeight: "1.2em",
                    letterSpacing: "-0.01em",
                },
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(16, 16, 16, 0.72)",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "rgba(255, 255, 255, 0.08)",
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#FFFFFF",
            },
            mutedColor: {
                type: ControlType.Color,
                title: "Text muted",
                defaultValue: "rgba(255, 255, 255, 0.58)",
            },
            indicatorColor: {
                type: ControlType.Color,
                title: "Indicator",
                defaultValue: "rgba(255, 255, 255, 0.10)",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 18,
                min: 0,
                max: 40,
                unit: "px",
            },
            shadow: {
                type: ControlType.BoxShadow,
                title: "Shadow",
                defaultValue: SHADOW,
            },
        },
    },
})
