// AKNavMenuBox.tsx — Framer Code Component
// Responsive navigation menu with image slider dropdown
//
// Fixes applied:
//  1. useIsStaticRenderer — disables animations & interval on canvas/export
//  2. btnFontFamily exposed as a Property Control
//  3. Trigger button has aria-expanded, aria-haspopup, aria-controls
//  4. Slider dots replaced with <button> elements (keyboard accessible)

import { useState, useEffect, useRef } from "react"
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


// ─── Types ───────────────────────────────────────────────────────────────────

interface MenuItem {
    label: string
    href: string
}

// Font object returned by ControlType.Font
interface FontValue {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    fontStyle?: string
    lineHeight?: number | string
    letterSpacing?: number | string
    [key: string]: unknown
}

interface Props {
    menuItems: MenuItem[]
    images: string[]
    btnLabel: string
    btnBackground: string
    btnColor: string
    btnFontSize: number
    btnFont: FontValue
    menuBackground: string
    menuColor: string
    menuFontSize: number
    mobileBreakpoint: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AKNavMenuBox(props: Props) {
    const {
        menuItems = defaultProps.menuItems,
        images = defaultProps.images,
        btnLabel = defaultProps.btnLabel,
        btnBackground = defaultProps.btnBackground,
        btnColor = defaultProps.btnColor,
        btnFontSize = defaultProps.btnFontSize,
        btnFont = defaultProps.btnFont,
        menuBackground = defaultProps.menuBackground,
        menuColor = defaultProps.menuColor,
        menuFontSize = defaultProps.menuFontSize,
        mobileBreakpoint = defaultProps.mobileBreakpoint,
    } = props

    // Fix 1 — detect static rendering context (canvas / export)
    const isStatic = useIsStaticRenderer()

    const [open, setOpen] = useState(false)
    const [slide, setSlide] = useState(0)
    const [mobile, setMobile] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const menuId = "ak-nav-menu-box"

    // Responsive breakpoint listener
    useEffect(() => {
        const check = () => setMobile(window.innerWidth <= mobileBreakpoint)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [mobileBreakpoint])

    // Fix 1 — skip interval when static
    useEffect(() => {
        if (isStatic) return
        if (!open || images.length <= 1) return
        const t = setInterval(
            () => setSlide((s) => (s + 1) % images.length),
            3000
        )
        return () => clearInterval(t)
    }, [open, images.length, isStatic])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const mobileFontSize = Math.max(13, menuFontSize - 3)

    // Derive CSS font properties from the Font control value
    const btnFontStyle: React.CSSProperties = {
        fontFamily: btnFont?.fontFamily,
        fontWeight: btnFont?.fontWeight,
        fontStyle: btnFont?.fontStyle,
        letterSpacing: btnFont?.letterSpacing,
    }

    // ── Static fallback (Fix 1) ───────────────────────────────────────────────
    if (isStatic) {
        return (
            <div style={{ position: "relative", display: "inline-block" }}>
                <button
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 18px",
                        borderRadius: 999,
                        background: btnBackground,
                        color: btnColor,
                        fontSize: btnFontSize,
                        ...btnFontStyle,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: btnFontStyle.fontWeight ?? 500,
                    }}
                >
                    {btnLabel} <span style={{ fontSize: 15 }}>+</span>
                </button>
            </div>
        )
    }

    // ── Slider dot keyboard handler (Fix 4) ───────────────────────────────────
    const handleDotKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>,
        i: number
    ) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setSlide(i)
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            ref={ref}
            style={{ position: "relative", display: "inline-block" }}
        >
            {/* ── Trigger Button (Fix 3 — aria attributes) ── */}
            <button
                onClick={() => setOpen((o) => !o)}
                // Fix 3
                aria-expanded={open}
                aria-haspopup="menu"
                aria-controls={menuId}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 18px",
                    borderRadius: 999,
                    background: btnBackground,
                    color: btnColor,
                    fontSize: btnFontSize,
                    ...btnFontStyle,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: btnFontStyle.fontWeight ?? 500,
                }}
            >
                {btnLabel}{" "}
                <span style={{ fontSize: 15, lineHeight: 1 }}>
                    {open ? "×" : "+"}
                </span>
            </button>

            {/* ── Dropdown Box (Fix 1 — AnimatePresence only when not static) ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        id={menuId}
                        role="menu"
                        initial={{ opacity: 0, scale: 0.92, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -6 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                            position: "absolute",
                            top: "calc(100% + 10px)",
                            right: 0,
                            display: "flex",
                            flexDirection: mobile ? "column" : "row",
                            borderRadius: 14,
                            overflow: "hidden",
                            boxShadow: "0 12px 40px rgba(0,0,0,0.32)",
                            zIndex: 100,
                            width: mobile ? 280 : 520,
                            transformOrigin: "top right",
                        }}
                    >
                        {/* ── Nav Links ── */}
                        <div
                            style={{
                                background: menuBackground,
                                padding: mobile
                                    ? "1.25rem 1.5rem"
                                    : "1.5rem 1.75rem",
                                display: "flex",
                                flexDirection: "column",
                                minWidth: mobile ? undefined : 210,
                                width: mobile ? "100%" : undefined,
                            }}
                        >
                            {menuItems.map((item, i) => (
                                <motion.a
                                    key={item.label}
                                    href={item.href}
                                    role="menuitem"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ opacity: 0.55 }}
                                    style={{
                                        display: "block",
                                        padding: mobile ? "9px 0" : "11px 0",
                                        fontSize: mobile
                                            ? mobileFontSize
                                            : menuFontSize,
                                        color: menuColor,
                                        textDecoration: "none",
                                        borderBottom:
                                            i < menuItems.length - 1
                                                ? "0.5px solid rgba(255,255,255,0.1)"
                                                : "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    {item.label}
                                </motion.a>
                            ))}
                        </div>

                        {/* ── Image Slider ── */}
                        <div
                            style={{
                                flex: mobile ? undefined : 1,
                                position: "relative",
                                height: mobile ? 160 : undefined,
                                minHeight: mobile ? undefined : 260,
                                background: "#222",
                                overflow: "hidden",
                            }}
                        >
                            {images.map((src, i) => (
                                <motion.img
                                    key={src}
                                    src={src}
                                    alt={`Slide ${i + 1}`}
                                    animate={{ opacity: i === slide ? 1 : 0 }}
                                    transition={{ duration: 0.5 }}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                    }}
                                />
                            ))}

                            {/* ── Dots (Fix 4 — <button> with aria-label & keyboard support) ── */}
                            {images.length > 1 && (
                                <div
                                    role="group"
                                    aria-label="Slide navigation"
                                    style={{
                                        position: "absolute",
                                        bottom: 10,
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        display: "flex",
                                        gap: 5,
                                        zIndex: 5,
                                    }}
                                >
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSlide(i)}
                                            onKeyDown={(e) =>
                                                handleDotKeyDown(e, i)
                                            }
                                            // Fix 4 — accessible label
                                            aria-label={`Go to slide ${i + 1}`}
                                            aria-pressed={i === slide}
                                            style={{
                                                width: 7,
                                                height: 7,
                                                borderRadius: "50%",
                                                border: "none",
                                                padding: 0,
                                                cursor: "pointer",
                                                background:
                                                    i === slide
                                                        ? "#fff"
                                                        : "rgba(255,255,255,0.35)",
                                                transform:
                                                    i === slide
                                                        ? "scale(1.25)"
                                                        : "scale(1)",
                                                transition: "all 0.2s",
                                                // Ensure focus ring is visible
                                                outline: "none",
                                            }}
                                            onFocus={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    "0 0 0 2px rgba(255,255,255,0.8)")
                                            }
                                            onBlur={(e) =>
                                                (e.currentTarget.style.boxShadow =
                                                    "none")
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─── Default Props ────────────────────────────────────────────────────────────

const defaultProps: Props = {
    menuItems: [
        { label: "Home", href: "/" },
        { label: "Services", href: "/services" },
        { label: "Benefits", href: "/benefits" },
        { label: "Work", href: "/work" },
        { label: "Pricing", href: "/pricing" },
        { label: "Reviews", href: "/reviews" },
        { label: "FAQs", href: "/faqs" },
        { label: "Contact", href: "/contact" },
    ],
    images: [],
    btnLabel: "Menu",
    btnBackground: "#111111",
    btnColor: "#ffffff",
    btnFontSize: 14,
    btnFont: { fontFamily: "Inter", fontWeight: 500 },
    menuBackground: "#111111",
    menuColor: "#ffffff",
    menuFontSize: 18,
    mobileBreakpoint: 768,
}

AKNavMenuBox.defaultProps = defaultProps

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(AKNavMenuBox, {
    btnLabel: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: defaultProps.btnLabel,
    },
    btnBackground: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: defaultProps.btnBackground,
    },
    btnColor: {
        type: ControlType.Color,
        title: "Button Text Color",
        defaultValue: defaultProps.btnColor,
    },
    btnFontSize: {
        type: ControlType.Number,
        title: "Button Font Size",
        defaultValue: defaultProps.btnFontSize,
        min: 10,
        max: 24,
        step: 1,
        displayStepper: true,
    },
    // Fix 2 — btnFont uses ControlType.Font (native Framer font picker)
    btnFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
    },
    menuBackground: {
        type: ControlType.Color,
        title: "Menu BG",
        defaultValue: defaultProps.menuBackground,
    },
    menuColor: {
        type: ControlType.Color,
        title: "Menu Text Color",
        defaultValue: defaultProps.menuColor,
    },
    menuFontSize: {
        type: ControlType.Number,
        title: "Menu Font Size",
        defaultValue: defaultProps.menuFontSize,
        min: 12,
        max: 36,
        step: 1,
        displayStepper: true,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: defaultProps.mobileBreakpoint,
        min: 320,
        max: 1200,
        step: 1,
        displayStepper: true,
    },
    menuItems: {
        type: ControlType.Array,
        title: "Menu Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                href: { type: ControlType.String, title: "URL" },
            },
        },
    },
    images: {
        type: ControlType.Array,
        title: "Slide Images",
        control: { type: ControlType.Image },
    },
})
