// User instructions: Create a cyberpunk/tech navigation bar in Framer with black scanline background, neon logo with typing cursor, centered SYS.* nav links with hover glow underline and active flicker, right [ CONNECT ] neon button, bottom gradient border, and a mobile collapse to icon that opens a dark overlay with vertical glowing links.

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


type NavItem = {
    label: string
    url: string
}

interface Props {
    logoMode: "text" | "image"
    logoImage?: { src: string; srcSet?: string; alt?: string }
    logoText: string
    logoUrl: string
    links: NavItem[]
    activeIndex: number
    connectLabel: string
    connectUrl: string

    backgroundColor: string
    scanlineOpacity: number
    scanlineThickness: number
    scanlineGap: number
    overlayOpacity: number

    backgroundPadding: number

    mobileMenuPadding: string

    neonColor: string
    mutedOpacity: number

    paddingX: number
    paddingY: number
    height: number
    borderGlow: number

    mobileBreakpoint: number
    tabletBreakpoint: number
    tabletPaddingX: number

    logoFont: any
    linkFont: any
    buttonFont: any

    style?: React.CSSProperties
}

const DEFAULT_LINKS: NavItem[] = [
    { label: "SYS.HOME", url: "#/" },
    { label: "SYS.WORK", url: "#/work" },
    { label: "SYS.ABOUT", url: "#/about" },
    { label: "SYS.CONTACT", url: "#/contact" },
]

/**
 * Cyberpunk Tech Nav
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CyberpunkNavBar(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        logoMode = "text",
        logoImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Logo",
        },
        logoText = "NX//BRAND",
        logoUrl = "#/",
        links = DEFAULT_LINKS,
        activeIndex = 0,
        connectLabel = "[ CONNECT ]",
        connectUrl = "#/connect",
        backgroundColor = "#000000",
        scanlineOpacity = 0.05,
        scanlineThickness = 1,
        scanlineGap = 6,
        overlayOpacity = 0.85,
        backgroundPadding = 0,
        mobileMenuPadding = "28px 20px",
        neonColor = "#00FF87",
        mutedOpacity = 0.6,
        paddingX = 48,
        paddingY = 0,
        height = 64,
        borderGlow = 12,
        mobileBreakpoint = 720,
        tabletBreakpoint = 1024,
        tabletPaddingX = 24,
        logoFont,
        linkFont,
        buttonFont,
        style,
    } = props

    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [menuOpen, setMenuOpen] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const [overlayTop, setOverlayTop] = React.useState<number>(height)

    const navRef = React.useRef<HTMLElement | null>(null)

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const mql = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`) // safe for SSR in effect
        const apply = () => {
            React.startTransition(() => setIsMobile(!!mql.matches))
        }

        apply()
        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", apply)
            return () => mql.removeEventListener("change", apply)
        } else {
            // Safari
            mql.addListener(apply)
            return () => mql.removeListener(apply)
        }
    }, [mobileBreakpoint])

    React.useEffect(() => {
        if (!isMobile && menuOpen) {
            React.startTransition(() => setMenuOpen(false))
        }
    }, [isMobile, menuOpen])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (!isMobile || !menuOpen) return

        const update = () => {
            const el = navRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            React.startTransition(() => setOverlayTop(Math.max(0, Math.round(rect.bottom))))
        }

        update()
        window.addEventListener("resize", update)
        window.addEventListener("scroll", update, { passive: true } as any)
        return () => {
            window.removeEventListener("resize", update)
            window.removeEventListener("scroll", update as any)
        }
    }, [isMobile, menuOpen])

    const safeLinks = React.useMemo(() => {
        const arr = Array.isArray(links) ? links.filter(Boolean) : []
        return arr.length > 0 ? arr : DEFAULT_LINKS
    }, [links])

    const active = Math.max(0, Math.min(activeIndex ?? 0, safeLinks.length - 1))

    const css = React.useMemo(() => {
        const flicker = isStatic
            ? "none"
            : "nx-flicker 2.2s linear infinite"

        const cursorAnim = isStatic ? "none" : "nx-cursor 1s steps(1) infinite"

        const t = Math.max(0, Math.round(scanlineThickness))
        const g = Math.max(t + 1, Math.round(scanlineGap))
        const a = Math.max(0, Math.min(1, scanlineOpacity))
        const o = Math.max(0, Math.min(1, overlayOpacity))

        return `
:root { --nx-neon: ${neonColor}; --nx-bg: ${backgroundColor}; }

@keyframes nx-flicker {
  0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; text-shadow: 0 0 ${borderGlow}px var(--nx-neon); }
  20%, 24%, 55% { opacity: 0.35; text-shadow: none; }
  56% { opacity: 0.7; text-shadow: 0 0 ${borderGlow * 0.75}px var(--nx-neon); }
}

@keyframes nx-cursor {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.nx-bg {
  background: 
    repeating-linear-gradient(
      0deg,
      rgba(255,255,255,${a}) 0px,
      rgba(255,255,255,${a}) ${t}px,
      rgba(255,255,255,0) ${t + 1}px,
      rgba(255,255,255,0) ${g}px
    ),
    linear-gradient(180deg, rgba(0,0,0,${o}), rgba(0,0,0,${o}));
  background-color: var(--nx-bg);
}

.nx-inner {
  padding: var(--nx-padY) var(--nx-padX);
  gap: var(--nx-gap);
}

.nx-center { gap: var(--nx-centerGap); }

.nx-link { position: relative; }
.nx-underline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10px;
  height: 1px;
  background: var(--nx-neon);
  opacity: 0;
  transform: scaleX(0.25);
  transform-origin: 50% 50%;
  transition: opacity 140ms ease, transform 180ms ease;
  box-shadow: 0 0 16px rgba(0,255,135,0.9);
}

.nx-link:hover .nx-underline { opacity: 1; transform: scaleX(1); }

.nx-active { animation: ${flicker}; }

.nx-connect {
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.nx-connect:hover {
  background: var(--nx-neon);
  color: #000;
  box-shadow: 0 0 18px rgba(0,255,135,0.7);
  transform: translateY(-1px);
}

.nx-cursor { animation: ${cursorAnim}; }
        `.trim()
    }, [backgroundColor, neonColor, borderGlow, isStatic, scanlineOpacity, scanlineThickness, scanlineGap, overlayOpacity])

    const onEnter = React.useCallback((index: number) => {
        React.startTransition(() => setHoverIndex(index))
    }, [])

    const onLeave = React.useCallback(() => {
        React.startTransition(() => setHoverIndex(null))
    }, [])

    const toggleMenu = React.useCallback(() => {
        React.startTransition(() => setMenuOpen((v) => !v))
    }, [])

    const closeMenu = React.useCallback(() => {
        React.startTransition(() => setMenuOpen(false))
    }, [])

    const isFixedWidth = !!(style && style.width === "100%")
    const overlayTopPx = typeof window === "undefined" ? height : overlayTop

    return (
        <nav
            ref={(node) => {
                navRef.current = node
            }}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: `${height}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: isMobile && menuOpen ? "visible" : "hidden",
                fontFamily: '"Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
            aria-label="Primary navigation"
            className="nx-shell"
        >
            <style>{css}</style>

            <div
                aria-hidden="true"
                className="nx-bg"
                style={{
                    position: "absolute",
                    top: backgroundPadding,
                    left: backgroundPadding,
                    right: backgroundPadding,
                    bottom: backgroundPadding,
                    pointerEvents: "none",
                }}
            />

            {/* Bottom gradient border */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 1,
                    background: `linear-gradient(90deg, rgba(0,255,135,0) 0%, ${neonColor} 50%, rgba(0,255,135,0) 100%)`,
                    opacity: 0.9,
                }}
            />

            <div
                className="nx-inner"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                    ...(isFixedWidth ? {} : { minWidth: "max-content" }),
                    ...( {
                        "--nx-padX": `${paddingX}px`,
                        "--nx-padY": `${paddingY}px`,
                        "--nx-padXTablet": `${tabletPaddingX}px`,
                        "--nx-gap": "24px",
                        "--nx-centerGap": "24px",
                    } as React.CSSProperties),
                }}
            >
                {/* Left logo */}
                <a
                    href={logoUrl || "#/"}
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        color: neonColor,
                        textDecoration: "none",
                        textShadow: `0 0 12px ${neonColor}`,
                        ...logoFont,
                        userSelect: "none",
                        whiteSpace: "nowrap",
                    }}
                    aria-label="Home"
                    onClick={isMobile && menuOpen ? closeMenu : undefined}
                >
                    {logoMode === "image" ? (
                        <img
                            src={logoImage?.src}
                            srcSet={logoImage?.srcSet}
                            alt={logoImage?.alt || ""}
                            style={{
                                display: "block",
                                height: Math.max(16, height - paddingY * 2 - 10),
                                width: "auto",
                                objectFit: "contain",
                                filter: `drop-shadow(0 0 12px ${neonColor})`,
                            }}
                        />
                    ) : (
                        <span style={{ width: "max-content" }}>{logoText}</span>
                    )}
                    <span
                        className="nx-cursor"
                        aria-hidden="true"
                        style={{
                            display: "inline-block",
                            width: 10,
                            height: 14,
                            background: neonColor,
                            boxShadow: `0 0 12px ${neonColor}`,
                            transform: "translateY(1px)",
                        }}
                    />
                </a>

                {/* Center links */}
                {!isMobile && (
                    <div
                        className="nx-center"
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 24,
                            flex: 1,
                            minWidth: 0,
                        }}
                    >
                        {safeLinks.map((item, i) => {
                            const isActive = i === active
                            const isHover = hoverIndex === i
                            const opacity = isActive || isHover ? 1 : mutedOpacity

                            return (
                                <a
                                    key={`${item.label}-${i}`}
                                    href={item.url || "#"}
                                    className={`nx-link ${isActive ? "nx-active" : ""}`}
                                    style={{
                                        position: "relative",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        color: neonColor,
                                        textDecoration: "none",
                                        opacity,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        padding: "8px 0",
                                        ...linkFont,
                                        cursor: "pointer",
                                        userSelect: "none",
                                        whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={() => onEnter(i)}
                                    onMouseLeave={onLeave}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <span style={{ width: "max-content" }}>{item.label}</span>
                                    <span className="nx-underline" aria-hidden="true" />
                                </a>
                            )
                        })}
                    </div>
                )}

                {/* Right connect button + mobile icon */}
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flex: "0 0 auto",
                    }}
                >
                    {!isMobile && (
                        <a
                            href={connectUrl || "#"}
                            className="nx-connect"
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 34,
                                padding: "0 14px",
                                border: `1px solid ${neonColor}`,
                                color: neonColor,
                                textDecoration: "none",
                                textShadow: `0 0 10px rgba(0,255,135,0.7)`,
                                boxShadow: `0 0 14px rgba(0,255,135,0.25)`,
                                background: "transparent",
                                borderRadius: 6,
                                letterSpacing: "0.12em",
                                ...buttonFont,
                                cursor: "pointer",
                                userSelect: "none",
                                whiteSpace: "nowrap",
                            }}
                            aria-label={connectLabel}
                        >
                            <span style={{ width: "max-content" }}>{connectLabel}</span>
                        </a>
                    )}

                    {isMobile && (
                        <button
                            type="button"
                            className="nx-mobileBtn"
                            onClick={toggleMenu}
                            aria-label={menuOpen ? "Close menu" : "Open menu"}
                            aria-expanded={menuOpen}
                            style={{
                                position: "relative",
                                width: 40,
                                height: 40,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "transparent",
                                border: `1px solid rgba(0,255,135,0.55)`,
                                borderRadius: 8,
                                color: neonColor,
                                boxShadow: `0 0 12px rgba(0,255,135,0.18)`,
                                cursor: "pointer",
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path
                                    d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"}
                                    stroke={neonColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile overlay */}
            {isMobile && menuOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                    style={{
                        position: "fixed",
                        left: 0,
                        right: 0,
                        top: overlayTopPx,
                        bottom: 0,
                        background: "rgba(0,0,0,0.96)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        padding: mobileMenuPadding,
                        zIndex: 9999,
                        overflow: "auto",
                        borderTop: `1px solid rgba(0,255,135,0.14)`,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "min(520px, 100%)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                        }}
                    >
                        {safeLinks.map((item, i) => {
                            const isActive = i === active
                            return (
                                <a
                                    key={`mobile-${item.label}-${i}`}
                                    href={item.url || "#"}
                                    onClick={closeMenu}
                                    style={{
                                        position: "relative",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        padding: "14px 14px",
                                        borderRadius: 10,
                                        border: `1px solid rgba(0,255,135,${isActive ? 0.65 : 0.25})`,
                                        textDecoration: "none",
                                        color: neonColor,
                                        opacity: isActive ? 1 : 0.85,
                                        boxShadow: isActive
                                            ? `0 0 18px rgba(0,255,135,0.25)`
                                            : `0 0 0 rgba(0,0,0,0)`,
                                        ...linkFont,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                    }}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <span style={{ width: "max-content" }}>{item.label}</span>
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 99,
                                            background: neonColor,
                                            opacity: isActive ? 1 : 0.25,
                                            boxShadow: `0 0 16px rgba(0,255,135,0.7)`,
                                        }}
                                    />
                                </a>
                            )
                        })}

                        <a
                            href={connectUrl || "#"}
                            onClick={closeMenu}
                            style={{
                                position: "relative",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: 46,
                                padding: "0 18px",
                                border: `1px solid ${neonColor}`,
                                borderRadius: 12,
                                textDecoration: "none",
                                color: "#000",
                                background: neonColor,
                                boxShadow: `0 0 22px rgba(0,255,135,0.4)`,
                                ...buttonFont,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                            }}
                            aria-label={connectLabel}
                        >
                            <span style={{ width: "max-content" }}>{connectLabel}</span>
                        </a>
                    </div>
                </div>
            )}
        </nav>
    )
}

addPropertyControls(CyberpunkNavBar, {
    logoMode: {
        type: ControlType.Enum,
        title: "Logo Type",
        options: ["text", "image"],
        optionTitles: ["Text", "Image"],
        defaultValue: "text",
        displaySegmentedControl: true,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: ({ logoMode }) => logoMode !== "image",
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "NX//BRAND",
        hidden: ({ logoMode }) => logoMode !== "text",
    },
    logoUrl: {
        type: ControlType.Link,
        title: "Logo URL",
        defaultValue: "#/",
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "SYS.HOME" },
                url: { type: ControlType.Link, title: "URL", defaultValue: "#/" },
            },
        },
        defaultValue: DEFAULT_LINKS,
    },
    activeIndex: {
        type: ControlType.Number,
        title: "Active",
        defaultValue: 0,
        min: 0,
        max: 7,
        step: 1,
    },
    connectLabel: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "[ CONNECT ]",
    },
    connectUrl: {
        type: ControlType.Link,
        title: "Button URL",
        defaultValue: "#/connect",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    scanlineOpacity: {
        type: ControlType.Number,
        title: "Scan Opacity",
        defaultValue: 0.05,
        min: 0,
        max: 0.25,
        step: 0.01,
    },
    scanlineThickness: {
        type: ControlType.Number,
        title: "Scan Thick",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
        unit: "px",
    },
    scanlineGap: {
        type: ControlType.Number,
        title: "Scan Gap",
        defaultValue: 6,
        min: 2,
        max: 24,
        step: 1,
        unit: "px",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
    },
    backgroundPadding: {
        type: ControlType.Number,
        title: "BG Pad",
        defaultValue: 0,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
    },
    mobileMenuPadding: {
        type: ControlType.Padding,
        title: "Menu Pad",
        defaultValue: "28px 20px",
    },
    neonColor: {
        type: ControlType.Color,
        title: "Neon",
        defaultValue: "#00FF87",
    },
    mutedOpacity: {
        type: ControlType.Number,
        title: "Muted",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 64,
        min: 44,
        max: 120,
        step: 1,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Pad X",
        defaultValue: 48,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Pad Y",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    borderGlow: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 12,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile",
        defaultValue: 720,
        min: 320,
        max: 1200,
        step: 10,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet",
        defaultValue: 1024,
        min: 480,
        max: 1600,
        step: 10,
        unit: "px",
    },
    tabletPaddingX: {
        type: ControlType.Number,
        title: "Tab Pad X",
        defaultValue: 24,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    logoFont: {
        type: ControlType.Font,
        title: "Logo Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Bold",
            letterSpacing: "0.08em",
            lineHeight: "1em",
        },
    },
    linkFont: {
        type: ControlType.Font,
        title: "Link Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.16em",
            lineHeight: "1em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0.12em",
            lineHeight: "1em",
        },
    },
})
