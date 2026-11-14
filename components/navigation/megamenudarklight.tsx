// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef, useCallback, useEffect, memo, useMemo } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FooterLink { label: string; href: string }

interface SubLink {
    label: string; description: string; href: string
    icon: string; iconImg: string; badge: string
}

interface MenuGroup {
    groupLabel: string; groupIcon: string; groupIconImg: string
    link1Show: boolean; link1Label: string; link1Desc: string; link1Href: string; link1Icon: string; link1IconImg: string; link1Badge: string
    link2Show: boolean; link2Label: string; link2Desc: string; link2Href: string; link2Icon: string; link2IconImg: string; link2Badge: string
    link3Show: boolean; link3Label: string; link3Desc: string; link3Href: string; link3Icon: string; link3IconImg: string; link3Badge: string
    link4Show: boolean; link4Label: string; link4Desc: string; link4Href: string; link4Icon: string; link4IconImg: string; link4Badge: string
    link5Show: boolean; link5Label: string; link5Desc: string; link5Href: string; link5Icon: string; link5IconImg: string; link5Badge: string
    link6Show: boolean; link6Label: string; link6Desc: string; link6Href: string; link6Icon: string; link6IconImg: string; link6Badge: string
}

interface NavItem {
    label: string; href: string
    itemType: "link" | "dropdown"
    groups: MenuGroup[]
}

function extractFont(f: any): string {
    if (!f) return "inherit"
    if (typeof f === "string") return f
    if (typeof f === "object" && f.family) return f.family
    return "inherit"
}

function isTransparent(v: string): boolean {
    if (!v || v === "" || v === "transparent") return true
    const s = v.replace(/\s/g, "").toLowerCase()
    if (s === "rgba(0,0,0,0)" || s === "hsla(0,0%,0%,0)" || s === "#00000000") return true
    const m = s.match(/(?:rgba|hsla)\([^)]+,(\d*\.?\d+)\)$/)
    if (m && parseFloat(m[1]) === 0) return true
    return false
}

function toNum(v: any): number { return Number(v) || 0 }

// ─── Defaults ─────────────────────────────────────────────────────────────────

function makeGroup(gl: string, gi: string, links: { label: string; desc: string; href: string; icon: string; badge: string }[]): MenuGroup {
    const p = (i: number) => links[i] ?? { label: "", desc: "", href: "#", icon: "", badge: "" }
    return {
        groupLabel: gl, groupIcon: gi, groupIconImg: "",
        link1Show: !!links[0], link1Label: p(0).label, link1Desc: p(0).desc, link1Href: p(0).href, link1Icon: p(0).icon, link1IconImg: "", link1Badge: p(0).badge,
        link2Show: !!links[1], link2Label: p(1).label, link2Desc: p(1).desc, link2Href: p(1).href, link2Icon: p(1).icon, link2IconImg: "", link2Badge: p(1).badge,
        link3Show: !!links[2], link3Label: p(2).label, link3Desc: p(2).desc, link3Href: p(2).href, link3Icon: p(2).icon, link3IconImg: "", link3Badge: p(2).badge,
        link4Show: !!links[3], link4Label: p(3).label, link4Desc: p(3).desc, link4Href: p(3).href, link4Icon: p(3).icon, link4IconImg: "", link4Badge: p(3).badge,
        link5Show: !!links[4], link5Label: p(4).label, link5Desc: p(4).desc, link5Href: p(4).href, link5Icon: p(4).icon, link5IconImg: "", link5Badge: p(4).badge,
        link6Show: !!links[5], link6Label: p(5).label, link6Desc: p(5).desc, link6Href: p(5).href, link6Icon: p(5).icon, link6IconImg: "", link6Badge: p(5).badge,
    }
}

function groupToLinks(g: MenuGroup): SubLink[] {
    const slots = [
        { show: g.link1Show, label: g.link1Label, description: g.link1Desc, href: g.link1Href, icon: g.link1Icon, iconImg: g.link1IconImg, badge: g.link1Badge },
        { show: g.link2Show, label: g.link2Label, description: g.link2Desc, href: g.link2Href, icon: g.link2Icon, iconImg: g.link2IconImg, badge: g.link2Badge },
        { show: g.link3Show, label: g.link3Label, description: g.link3Desc, href: g.link3Href, icon: g.link3Icon, iconImg: g.link3IconImg, badge: g.link3Badge },
        { show: g.link4Show, label: g.link4Label, description: g.link4Desc, href: g.link4Href, icon: g.link4Icon, iconImg: g.link4IconImg, badge: g.link4Badge },
        { show: g.link5Show, label: g.link5Label, description: g.link5Desc, href: g.link5Href, icon: g.link5Icon, iconImg: g.link5IconImg, badge: g.link5Badge },
        { show: g.link6Show, label: g.link6Label, description: g.link6Desc, href: g.link6Href, icon: g.link6Icon, iconImg: g.link6IconImg, badge: g.link6Badge },
    ]
    return slots.filter(s => s.show && s.label.trim() !== "").map(({ show, ...rest }) => rest)
}

const DEFAULT_NAV: NavItem[] = [
    {
        label: "Products", href: "#", itemType: "dropdown",
        groups: [
            makeGroup("Platform", "🧩", [
                { label: "Components",  desc: "Ready-made UI building blocks",   href: "#", icon: "◈", badge: "New" },
                { label: "Templates",   desc: "Production-ready page layouts",   href: "#", icon: "▣", badge: "" },
                { label: "CMS",         desc: "Dynamic content management",      href: "#", icon: "⊞", badge: "" },
                { label: "Analytics",   desc: "Traffic & performance insights",  href: "#", icon: "⊕", badge: "" },
            ]),
            makeGroup("Design", "🎨", [
                { label: "Canvas",      desc: "Visual design editor",            href: "#", icon: "◉", badge: "" },
                { label: "Variables",   desc: "Global design tokens",            href: "#", icon: "◈", badge: "Beta" },
                { label: "Prototyping", desc: "Interactive flows & transitions", href: "#", icon: "▷", badge: "" },
            ]),
            makeGroup("Developers", "⚙️", [
                { label: "Code Components", desc: "React + TypeScript in canvas", href: "#", icon: "⊗", badge: "" },
                { label: "API & Webhooks",  desc: "Automate your workflow",       href: "#", icon: "⊜", badge: "" },
                { label: "CLI Tools",       desc: "Command-line productivity",    href: "#", icon: "▶", badge: "" },
            ]),
        ],
    },
    {
        label: "Solutions", href: "#", itemType: "dropdown",
        groups: [
            makeGroup("By Team", "👥", [
                { label: "Marketing",   desc: "Launch campaigns faster",       href: "#", icon: "📢", badge: "" },
                { label: "Engineering", desc: "Ship production-grade sites",   href: "#", icon: "🔧", badge: "" },
                { label: "Design",      desc: "Prototype at full fidelity",    href: "#", icon: "✏️", badge: "" },
            ]),
            makeGroup("By Size", "🏢", [
                { label: "Startups",   desc: "Move fast, look great",         href: "#", icon: "🚀", badge: "Popular" },
                { label: "Enterprise", desc: "Scale with confidence",          href: "#", icon: "🏛️", badge: "" },
            ]),
        ],
    },
    { label: "Pricing", href: "#", itemType: "link", groups: [] },
    { label: "Blog",    href: "#", itemType: "link", groups: [] },
    { label: "Docs",    href: "#", itemType: "link", groups: [] },
]

const DEFAULT_FOOTER: FooterLink[] = [
    { label: "What's New", href: "#" },
    { label: "Roadmap",    href: "#" },
    { label: "Changelog",  href: "#" },
]

// ─── Theme ────────────────────────────────────────────────────────────────────

interface Theme {
    navBg: string; navBorder: string
    menuBg: string; menuBorder: string
    sidebarBg: string; sidebarBorder: string
    textPrimary: string; textMuted: string
    divider: string; groupLabel: string; footerLink: string
    linkText: string; linkDesc: string; sidebarItem: string
    cardHoverBg: string; cardHoverBorder: string
    drawerBg: string; drawerBorder: string
    hamburgerBg: string; menuShadow: string
    isDark: boolean
}

function makeTheme(isDark: boolean): Theme {
    return isDark ? {
        navBg: "rgba(13,13,18,0.95)", navBorder: "rgba(255,255,255,0.09)",
        menuBg: "rgba(11,11,16,1)", menuBorder: "rgba(255,255,255,0.09)",
        sidebarBg: "rgba(255,255,255,0.03)", sidebarBorder: "rgba(255,255,255,0.06)",
        textPrimary: "#f0f0f0", textMuted: "#888888",
        divider: "rgba(255,255,255,0.07)", groupLabel: "#555555", footerLink: "#666666",
        linkText: "#e0e0e0", linkDesc: "#666666", sidebarItem: "#aaaaaa",
        cardHoverBg: "rgba(255,255,255,0.05)", cardHoverBorder: "rgba(255,255,255,0.10)",
        drawerBg: "#0d0d12", drawerBorder: "rgba(255,255,255,0.07)",
        hamburgerBg: "rgba(255,255,255,0.08)",
        menuShadow: "0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
        isDark: true,
    } : {
        navBg: "rgba(255,255,255,0.97)", navBorder: "rgba(0,0,0,0.09)",
        menuBg: "rgba(255,255,255,1)", menuBorder: "rgba(0,0,0,0.09)",
        sidebarBg: "rgba(0,0,0,0.025)", sidebarBorder: "rgba(0,0,0,0.06)",
        textPrimary: "#111111", textMuted: "#777777",
        divider: "rgba(0,0,0,0.07)", groupLabel: "#aaaaaa", footerLink: "#999999",
        linkText: "#1a1a1a", linkDesc: "#888888", sidebarItem: "#555555",
        cardHoverBg: "rgba(0,0,0,0.04)", cardHoverBorder: "rgba(0,0,0,0.09)",
        drawerBg: "#ffffff", drawerBorder: "rgba(0,0,0,0.07)",
        hamburgerBg: "rgba(0,0,0,0.06)",
        menuShadow: "0 20px 60px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)",
        isDark: false,
    }
}

function applyColors(t: Theme, overrides: Record<string, string>): Theme {
    const out = { ...t }
    for (const [k, v] of Object.entries(overrides)) {
        if (!isTransparent(v)) (out as any)[k] = v
    }
    return out
}

// ─── Icon ─────────────────────────────────────────────────────────────────────

function IconEl({ emoji, img, size = 14, color }: { emoji?: string; img?: string; size?: number; color?: string }) {
    if (img && img !== "") {
        return <img src={img} alt="" style={{ width: size, height: size, objectFit: "contain", display: "block", flexShrink: 0 }} />
    }
    if (emoji && emoji !== "") {
        return <span style={{ fontSize: size, lineHeight: 1, color: color || "inherit", flexShrink: 0, display: "block" }}>{emoji}</span>
    }
    return null
}

function ChevronDown({ size = 11, color = "currentColor", rotated = false }: { size?: number; color?: string; rotated?: boolean }) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
            style={{ display: "block", flexShrink: 0, transition: "transform 0.22s cubic-bezier(0.32,0.72,0,1)", transform: rotated ? "rotate(180deg)" : "rotate(0deg)" }}>
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function useWindowWidth() {
    const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440))
    useEffect(() => {
        const upd = () => setW(window.innerWidth)
        window.addEventListener("resize", upd)
        return () => window.removeEventListener("resize", upd)
    }, [])
    return w
}

function NavItemBtn({ item, isOpen, onEnter, onLeave, onClick, t, fontFamily, navFontSize, navFontWeight, navFontColor, navFontColorActive, isTablet }: {
    item: NavItem; isOpen: boolean
    onEnter: () => void; onLeave: () => void; onClick: () => void
    t: Theme; fontFamily: string
    navFontSize: number; navFontWeight: number
    navFontColor: string; navFontColorActive: string
    isTablet: boolean
}) {
    const [hov, setHov] = useState(false)
    const hasDD = item.itemType === "dropdown" && Array.isArray(item.groups) && item.groups.length > 0
    const lit = isOpen || hov
    const color = lit
        ? (!isTransparent(navFontColorActive) ? navFontColorActive : t.textPrimary)
        : (!isTransparent(navFontColor) ? navFontColor : t.textMuted)

    return (
        <div
            onMouseEnter={() => { setHov(true); onEnter() }}
            onMouseLeave={() => { setHov(false); onLeave() }}
            onClick={onClick}
            style={{
                padding: isTablet ? "7px 10px" : "8px 13px",
                fontSize: navFontSize, fontWeight: navFontWeight, fontFamily, color,
                cursor: hasDD ? "pointer" : "default",
                borderRadius: 10, display: "flex", alignItems: "center", gap: 5,
                background: isOpen
                    ? (t.isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)")
                    : hov ? (t.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)") : "transparent",
                transition: "all 0.14s ease", userSelect: "none", whiteSpace: "nowrap",
            }}
        >
            {hasDD ? (
                <><span>{item.label}</span><ChevronDown size={11} color={color} rotated={isOpen} /></>
            ) : (
                <a href={item.href || "#"} style={{ color: "inherit", textDecoration: "none" }}>{item.label}</a>
            )}
        </div>
    )
}

const SidebarItem = memo(({ label, icon, iconImg, isActive, onActivate, t, fontFamily, sidebarLabelColor, sidebarActiveBg, accent }: {
    label: string; icon: string; iconImg: string; isActive: boolean
    onActivate: () => void; t: Theme; fontFamily: string
    sidebarLabelColor: string; sidebarActiveBg: string; accent: string
}) => {
    const activeColor = accent
    const idleColor   = !isTransparent(sidebarLabelColor) ? sidebarLabelColor : t.sidebarItem
    const activeBg    = !isTransparent(sidebarActiveBg) ? sidebarActiveBg : accent + "20"

    return (
        <div onClick={onActivate} onMouseEnter={onActivate} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 11px", borderRadius: 10,
            cursor: "pointer", userSelect: "none",
            background: isActive ? activeBg : "transparent",
            color: isActive ? activeColor : idleColor,
            fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily,
            transition: "all 0.12s ease",
            borderLeft: `2px solid ${isActive ? accent : "transparent"}`,
        }}>
            <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? accent + "25" : t.sidebarBg, transition: "background 0.12s",
            }}>
                <IconEl emoji={icon} img={iconImg} size={15} />
            </div>
            <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
            <ChevronDown size={10} color={isActive ? accent : t.groupLabel} rotated={false} />
        </div>
    )
})

const MenuCard = memo(({ link, accent, showDesc, showBadge, t, cardRadius, fontFamily, linkTitleSize, linkTitleWeight, linkTitleColor, linkDescSize, linkDescColor, badgeBg, badgeColor }: {
    link: SubLink; accent: string; showDesc: boolean; showBadge: boolean
    t: Theme; cardRadius: number; fontFamily: string
    linkTitleSize: number; linkTitleWeight: number; linkTitleColor: string
    linkDescSize: number; linkDescColor: string; badgeBg: string; badgeColor: string
}) => {
    const [hov, setHov] = useState(false)
    const resolvedTitleColor = !isTransparent(linkTitleColor) ? linkTitleColor : t.linkText
    const resolvedDescColor  = !isTransparent(linkDescColor)  ? linkDescColor  : t.linkDesc
    const resolvedBadgeBg    = !isTransparent(badgeBg)    ? badgeBg    : accent + "25"
    const resolvedBadgeColor = !isTransparent(badgeColor) ? badgeColor : accent

    return (
        <a href={link.href || "#"}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                display: "flex", flexDirection: "column", gap: 4,
                padding: "11px 12px", borderRadius: cardRadius, textDecoration: "none",
                background: hov ? t.cardHoverBg : "transparent",
                border: `1px solid ${hov ? t.cardHoverBorder : "transparent"}`,
                transform: hov ? "translateY(-1px)" : "translateY(0px)",
                boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.14s ease",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, flex: 1 }}>
                    {(link.iconImg || link.icon) && (
                        <span style={{ flexShrink: 0, opacity: hov ? 1 : 0.8, transition: "opacity 0.14s", display: "flex", alignItems: "center" }}>
                            <IconEl emoji={link.icon} img={link.iconImg} size={14} color={accent} />
                        </span>
                    )}
                    <span style={{
                        fontSize: linkTitleSize, fontWeight: linkTitleWeight, fontFamily,
                        color: hov ? t.textPrimary : resolvedTitleColor,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "color 0.14s",
                    }}>{link.label}</span>
                </div>
                {showBadge && link.badge && link.badge.trim() !== "" && (
                    <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", flexShrink: 0,
                        background: resolvedBadgeBg, color: resolvedBadgeColor,
                        padding: "2px 7px", borderRadius: 99,
                    }}>{link.badge}</span>
                )}
            </div>
            {showDesc && link.description && link.description.trim() !== "" && (
                <span style={{
                    fontSize: linkDescSize, fontFamily, color: resolvedDescColor,
                    paddingLeft: (link.iconImg || link.icon) ? 21 : 0, lineHeight: 1.45,
                }}>{link.description}</span>
            )}
        </a>
    )
})

function CTAButton({ label, href, bg, color, padX, padY, radius, size, fontWeight, fontFamily, borderWidth, borderColor }: {
    label: string; href: string; bg: string; color: string
    padX: number; padY: number; radius: number; size: number
    fontWeight: number; fontFamily: string; borderWidth: number; borderColor: string
}) {
    const [hov, setHov] = useState(false)
    const [pressed, setPressed] = useState(false)

    return (
        <a href={href}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => { setHov(false); setPressed(false) }}
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            style={{
                background: bg, color,
                padding: `${padY}px ${padX}px`,
                borderRadius: radius, fontSize: size, fontWeight, fontFamily,
                textDecoration: "none", flexShrink: 0,
                display: "inline-flex", alignItems: "center", gap: 6,
                border: borderWidth > 0 ? `${borderWidth}px solid ${!isTransparent(borderColor) ? borderColor : bg}` : "1px solid transparent",
                transform: pressed ? "translateY(1px) scale(0.97)" : hov ? "translateY(-2px)" : "translateY(0px)",
                boxShadow: pressed ? "none" : hov ? `0 8px 24px ${bg}60, 0 2px 8px ${bg}30` : `0 2px 6px ${bg}20`,
                filter: (hov && !pressed) ? "brightness(1.08)" : "brightness(1)",
                transition: "all 0.17s cubic-bezier(0.32,0.72,0,1)", cursor: "pointer",
            }}
        >
            {label}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                style={{ opacity: hov ? 0.85 : 0, transform: hov ? "translate(0px,0px)" : "translate(-3px, 3px)", transition: "all 0.17s ease", flexShrink: 0 }}>
                <path d="M2 10L10 2M10 2H4M10 2V8" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </a>
    )
}

function MobileDrawer({ navItems, accent, t, fontFamily, ctaLabel, ctaHref, ctaPadX, ctaPadY, ctaRadius, backdropBlur, logoType, logoText, logoImage, logoColor, logoSize, logoHref, onClose }: {
    navItems: NavItem[]; accent: string; t: Theme; fontFamily: string
    ctaLabel: string; ctaHref: string; ctaPadX: number; ctaPadY: number; ctaRadius: number
    backdropBlur: number; logoType: string; logoText: string; logoImage: string
    logoColor: string; logoSize: number; logoHref: string; onClose: () => void
}) {
    const [expanded, setExpanded] = useState<number | null>(null)
    const [expGroup, setExpGroup] = useState<number | null>(null)

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
            <div style={{ position: "relative", background: t.drawerBg, width: "100%", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", fontFamily }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", borderBottom: `1px solid ${t.drawerBorder}`, background: t.navBg, backdropFilter: `blur(${backdropBlur}px)`, WebkitBackdropFilter: `blur(${backdropBlur}px)`, flexShrink: 0 }}>
                    <a href={logoHref} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        {logoType === "image" && logoImage && logoImage !== ""
                            ? <img src={logoImage} alt="logo" style={{ height: 26, objectFit: "contain" }} />
                            : <span style={{ fontWeight: 800, fontSize: logoSize, color: logoColor, fontFamily }}>{logoText}</span>
                        }
                    </a>
                    <button onClick={onClose} style={{ background: t.hamburgerBg, border: `1px solid ${t.drawerBorder}`, borderRadius: 8, width: 34, height: 34, cursor: "pointer", color: t.textMuted, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ flex: 1 }}>
                    {navItems.map((item, i) => {
                        const hasDD = item.itemType === "dropdown" && Array.isArray(item.groups) && item.groups.length > 0
                        const isExp = expanded === i
                        return (
                            <div key={i} style={{ borderBottom: `1px solid ${t.drawerBorder}` }}>
                                {hasDD ? (
                                    <>
                                        <div onClick={() => setExpanded(isExp ? null : i)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 20px", cursor: "pointer", color: isExp ? accent : t.textPrimary, fontSize: 15, fontWeight: 500, background: isExp ? t.sidebarBg : "transparent", transition: "all 0.14s" }}>
                                            <span>{item.label}</span>
                                            <ChevronDown size={13} color={isExp ? accent : t.textMuted} rotated={isExp} />
                                        </div>
                                        {isExp && (
                                            <div style={{ background: t.sidebarBg }}>
                                                {item.groups.map((g, gi) => {
                                                    const links = groupToLinks(g)
                                                    if (links.length === 0) return null
                                                    const gKey = i * 100 + gi
                                                    const isGrp = expGroup === gKey
                                                    return (
                                                        <div key={gi}>
                                                            <div onClick={() => setExpGroup(isGrp ? null : gKey)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 20px 11px 28px", cursor: "pointer", color: isGrp ? accent : t.sidebarItem, fontSize: 13, fontWeight: 600, transition: "all 0.13s" }}>
                                                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <IconEl emoji={g.groupIcon} img={g.groupIconImg} size={16} />
                                                                    {g.groupLabel}
                                                                </span>
                                                                <ChevronDown size={11} color={isGrp ? accent : t.textMuted} rotated={isGrp} />
                                                            </div>
                                                            {isGrp && (
                                                                <div style={{ paddingBottom: 4 }}>
                                                                    {links.map((l, li) => (
                                                                        <a key={li} href={l.href || "#"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 20px 11px 36px", color: t.linkText, fontSize: 14, textDecoration: "none", borderLeft: "3px solid transparent", transition: "all 0.12s" }}
                                                                            onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderLeftColor = accent; e.currentTarget.style.background = t.sidebarBg }}
                                                                            onMouseLeave={e => { e.currentTarget.style.color = t.linkText; e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = "transparent" }}>
                                                                            <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                                <IconEl emoji={l.icon} img={l.iconImg} size={14} color={accent} />
                                                                            </span>
                                                                            <div>
                                                                                <div style={{ fontWeight: 500 }}>{l.label}</div>
                                                                                {l.description && l.description.trim() !== "" && (
                                                                                    <div style={{ fontSize: 12, color: t.linkDesc, marginTop: 2 }}>{l.description}</div>
                                                                                )}
                                                                            </div>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <a href={item.href || "#"} style={{ display: "block", padding: "15px 20px", color: t.textPrimary, fontSize: 15, fontWeight: 500, textDecoration: "none", transition: "all 0.13s" }}
                                        onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.paddingLeft = "24px" }}
                                        onMouseLeave={e => { e.currentTarget.style.color = t.textPrimary; e.currentTarget.style.paddingLeft = "20px" }}>
                                        {item.label}
                                    </a>
                                )}
                            </div>
                        )
                    })}
                </div>
                <div style={{ padding: "20px", flexShrink: 0 }}>
                    <a href={ctaHref || "#"} style={{ display: "block", textAlign: "center", background: accent, color: "#fff", padding: `${ctaPadY}px ${ctaPadX}px`, borderRadius: ctaRadius, fontSize: 15, fontWeight: 600, textDecoration: "none", fontFamily }}>{ctaLabel}</a>
                </div>
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function OsmoMegaMenu(props: {
    colorMode: "dark" | "light"; accentColor: string
    navBgColor: string; navBorderColor: string; menuBgColor: string; menuBorderColor: string; sidebarBgColor: string
    linkTitleColor: string; linkDescColor: string; groupHeaderColor: string; groupHeaderBg: string
    sidebarLabelColor: string; sidebarActiveBg: string; badgeBg: string; badgeColor: string
    navFontColor: string; navFontColorActive: string
    navbarRadius: number; menuRadius: number; cardRadius: number; backdropBlur: number
    navPadX: number; navPadY: number; menuGap: number; menuMinHeight: number
    menuCols: 2|3|4; sidebarW: number; font: any
    navFontSize: number; navFontWeight: any; linkTitleSize: number; linkTitleWeight: any; linkDescSize: number
    groupHeaderSize: number; groupHeaderWeight: any
    logoType: "text"|"image"; logoText: string; logoImage: string; logoColor: string; logoSize: number; logoHref: string
    navItems: NavItem[]
    showDesc: boolean; showBadges: boolean; showFooter: boolean; footerLinks: FooterLink[]
    showCTA: boolean; ctaLabel: string; ctaHref: string; ctaBg: string; ctaColor: string
    ctaPadX: number; ctaPadY: number; ctaRadius: number; ctaSize: number; ctaFontWeight: any
    ctaBorderWidth: number; ctaBorderColor: string
    trigger: "hover"|"click"; hoverDelay: number; closeDelay: number; animSpeed: "slow"|"normal"|"fast"
    mobileBp: number; tabletBp: number
}) {
    const {
        colorMode = "dark", accentColor = "#7c6dff",
        navBgColor = "", navBorderColor = "", menuBgColor = "", menuBorderColor = "", sidebarBgColor = "",
        linkTitleColor = "", linkDescColor = "", groupHeaderColor = "", groupHeaderBg = "",
        sidebarLabelColor = "", sidebarActiveBg = "", badgeBg = "", badgeColor = "",
        navFontColor = "", navFontColorActive = "",
        navbarRadius = 16, menuRadius = 20, cardRadius = 10, backdropBlur = 28,
        navPadX = 20, navPadY = 13, menuGap = 5, menuMinHeight = 280,
        menuCols = 3, sidebarW = 200, font,
        navFontSize = 14, navFontWeight = 500, linkTitleSize = 13, linkTitleWeight = 500, linkDescSize = 11.5,
        groupHeaderSize = 10, groupHeaderWeight = 700,
        logoType = "text", logoText = "osmo", logoImage = "", logoColor = "", logoSize = 18, logoHref = "/",
        navItems = DEFAULT_NAV,
        showDesc = true, showBadges = true, showFooter = true, footerLinks = DEFAULT_FOOTER,
        showCTA = true, ctaLabel = "Get Started", ctaHref = "#", ctaBg = "", ctaColor = "#fff",
        ctaPadX = 20, ctaPadY = 9, ctaRadius = 10, ctaSize = 14, ctaFontWeight = 600,
        ctaBorderWidth = 0, ctaBorderColor = "",
        trigger = "hover", hoverDelay = 100, closeDelay = 80, animSpeed = "normal",
        mobileBp = 768, tabletBp = 1024,
    } = props

    const isDark = colorMode === "dark"
    const fontFamily = extractFont(font)
    const _navFontWeight     = toNum(navFontWeight)     || 500
    const _linkTitleWeight   = toNum(linkTitleWeight)   || 500
    const _ctaFontWeight     = toNum(ctaFontWeight)     || 600
    const _groupHeaderWeight = toNum(groupHeaderWeight) || 700

    const t = useMemo(() => {
        const base = makeTheme(isDark)
        return applyColors(base, { navBg: navBgColor, navBorder: navBorderColor, menuBg: menuBgColor, menuBorder: menuBorderColor, sidebarBg: sidebarBgColor })
    }, [isDark, navBgColor, navBorderColor, menuBgColor, menuBorderColor, sidebarBgColor])

    const dur      = { slow: 600, normal: 320, fast: 160 }[animSpeed] ?? 320
    const ctaFinal = !isTransparent(ctaBg) ? ctaBg : accentColor
    const logoFinal = !isTransparent(logoColor) ? logoColor : accentColor
    const ghColor = !isTransparent(groupHeaderColor) ? groupHeaderColor : t.groupLabel
    const ghBg    = !isTransparent(groupHeaderBg)    ? groupHeaderBg    : "transparent"

    const [openIdx,    setOpenIdx]    = useState<number | null>(null)
    const [menuStep,   setMenuStep]   = useState(0)
    const [activeGIdx, setActiveGIdx] = useState(0)
    const [mobileOpen, setMobileOpen] = useState(false)

    const hRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
    const s2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)

    const winW     = useWindowWidth()
    const isMobile = winW < mobileBp
    const isTablet = winW >= mobileBp && winW < tabletBp

    const closeMenu = useCallback(() => {
        if (cRef.current) clearTimeout(cRef.current)
        cRef.current = setTimeout(() => {
            setMenuStep(0)
            if (s2Ref.current) clearTimeout(s2Ref.current)
            s2Ref.current = setTimeout(() => { setOpenIdx(null); setActiveGIdx(0) }, dur * 0.5)
        }, closeDelay)
    }, [closeDelay, dur])

    const openMenu = useCallback((i: number) => {
        if (hRef.current)  clearTimeout(hRef.current)
        if (cRef.current)  clearTimeout(cRef.current)
        if (s2Ref.current) clearTimeout(s2Ref.current)
        const item = Array.isArray(navItems) ? navItems[i] : null
        if (!item || item.itemType !== "dropdown" || !Array.isArray(item.groups) || item.groups.length === 0) return
        setOpenIdx(i); setMenuStep(1); setActiveGIdx(0)
        s2Ref.current = setTimeout(() => setMenuStep(2), 120)
    }, [navItems])

    const handleEnter = useCallback((i: number) => {
        if (trigger !== "hover") return
        if (cRef.current) clearTimeout(cRef.current)
        if (hRef.current) clearTimeout(hRef.current)
        hRef.current = setTimeout(() => openMenu(i), Math.max(0, hoverDelay))
    }, [trigger, hoverDelay, openMenu])

    const handleLeave = useCallback(() => { if (hRef.current) clearTimeout(hRef.current) }, [])

    const handleClick = useCallback((i: number) => {
        if (trigger !== "click") return
        if (openIdx === i) closeMenu(); else openMenu(i)
    }, [trigger, openIdx, openMenu, closeMenu])

    useEffect(() => () => {
        if (hRef.current)  clearTimeout(hRef.current)
        if (cRef.current)  clearTimeout(cRef.current)
        if (s2Ref.current) clearTimeout(s2Ref.current)
    }, [])

    const activeItem   = openIdx !== null && Array.isArray(navItems) ? navItems[openIdx] ?? null : null
    const activeGroups = activeItem?.groups ?? []
    const safeGIdx     = Math.min(activeGIdx, Math.max(0, activeGroups.length - 1))
    const activeGroup  = activeGroups[safeGIdx] ?? null
    const activeLinks  = useMemo(() => activeGroup ? groupToLinks(activeGroup) : [], [activeGroup])
    const cols         = isTablet ? Math.min(Number(menuCols) || 3, 2) : (Number(menuCols) || 3)

    if (isMobile) {
        return (
            <div style={{ width: "100%", fontFamily }}>
                <div style={{ background: t.navBg, border: `1px solid ${t.navBorder}`, borderRadius: navbarRadius, padding: `${navPadY}px ${navPadX}px`, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: `blur(${backdropBlur}px)`, WebkitBackdropFilter: `blur(${backdropBlur}px)` }}>
                    <a href={logoHref} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                        {logoType === "image" && logoImage && logoImage !== ""
                            ? <img src={logoImage} alt="logo" style={{ height: 28, objectFit: "contain" }} />
                            : <span style={{ fontWeight: 800, fontSize: logoSize, color: logoFinal, letterSpacing: "-0.03em", fontFamily }}>{logoText}</span>
                        }
                    </a>
                    <button onClick={() => setMobileOpen(true)} style={{ background: t.hamburgerBg, border: `1px solid ${t.navBorder}`, borderRadius: 10, width: 38, height: 38, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        {[0,1,2].map(i => <span key={i} style={{ display: "block", width: i === 1 ? 12 : 17, height: 1.5, background: t.textPrimary, borderRadius: 99 }} />)}
                    </button>
                </div>
                {mobileOpen && (
                    <MobileDrawer navItems={navItems} accent={accentColor} t={t} fontFamily={fontFamily}
                        ctaLabel={ctaLabel} ctaHref={ctaHref} ctaPadX={ctaPadX} ctaPadY={ctaPadY} ctaRadius={ctaRadius}
                        backdropBlur={backdropBlur} logoType={logoType} logoText={logoText} logoImage={logoImage}
                        logoColor={logoFinal} logoSize={logoSize} logoHref={logoHref} onClose={() => setMobileOpen(false)} />
                )}
            </div>
        )
    }

    return (
        <div style={{ width: "100%", fontFamily, position: "relative" }}
            onMouseLeave={() => { if (hRef.current) clearTimeout(hRef.current); closeMenu() }}>

            {/* Navbar */}
            <div style={{ background: t.navBg, border: `1px solid ${t.navBorder}`, borderRadius: navbarRadius, padding: `${navPadY}px ${navPadX}px`, display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: `blur(${backdropBlur}px)`, WebkitBackdropFilter: `blur(${backdropBlur}px)`, position: "relative", zIndex: 20, gap: 12 }}>
                <a href={logoHref} style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {logoType === "image" && logoImage && logoImage !== ""
                        ? <img src={logoImage} alt="logo" style={{ height: 28, objectFit: "contain" }} />
                        : <span style={{ fontWeight: 800, fontSize: logoSize, color: logoFinal, letterSpacing: "-0.03em", fontFamily }}>{logoText}</span>
                    }
                </a>
                <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center", gap: isTablet ? 0 : 2 }}>
                    {(Array.isArray(navItems) ? navItems : []).map((item, i) => (
                        <NavItemBtn key={i} item={item} isOpen={openIdx === i}
                            onEnter={() => handleEnter(i)} onLeave={handleLeave} onClick={() => handleClick(i)}
                            t={t} fontFamily={fontFamily} navFontSize={navFontSize} navFontWeight={_navFontWeight}
                            navFontColor={navFontColor} navFontColorActive={navFontColorActive} isTablet={isTablet} />
                    ))}
                </div>
                {showCTA && (
                    <CTAButton label={ctaLabel} href={ctaHref} bg={ctaFinal} color={ctaColor}
                        padX={ctaPadX} padY={ctaPadY} radius={ctaRadius} size={ctaSize}
                        fontWeight={_ctaFontWeight} fontFamily={fontFamily}
                        borderWidth={ctaBorderWidth} borderColor={ctaBorderColor} />
                )}
            </div>

            {/* Mega Menu */}
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, overflow: "hidden", maxHeight: menuStep === 2 ? "640px" : menuStep === 1 ? "1px" : "0px", opacity: menuStep > 0 ? 1 : 0, transition: `max-height ${dur}ms cubic-bezier(0.32,0.72,0,1), opacity ${dur * 0.4}ms ease`, zIndex: 10, borderRadius: menuRadius, pointerEvents: menuStep === 0 ? "none" : "all" }}
                onMouseEnter={() => { if (cRef.current) clearTimeout(cRef.current) }}
                onMouseLeave={closeMenu}>
                <div style={{ background: t.menuBg, border: `1px solid ${t.menuBorder}`, borderRadius: menuRadius, backdropFilter: `blur(${backdropBlur}px)`, WebkitBackdropFilter: `blur(${backdropBlur}px)`, boxShadow: t.menuShadow, overflow: "hidden", opacity: menuStep === 2 ? 1 : 0, transform: menuStep === 2 ? "translateY(0px)" : "translateY(-8px)", transition: `opacity ${dur * 0.4}ms ease ${menuStep === 2 ? "100ms" : "0ms"}, transform ${dur * 0.45}ms ease ${menuStep === 2 ? "60ms" : "0ms"}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: `${sidebarW}px 1fr`, minHeight: menuMinHeight }}>
                        <div style={{ background: t.sidebarBg, borderRight: `1px solid ${t.sidebarBorder}`, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
                            {activeGroups.map((g, gi) => (
                                <SidebarItem key={gi} label={g.groupLabel || ""} icon={g.groupIcon || ""} iconImg={g.groupIconImg || ""}
                                    isActive={safeGIdx === gi} onActivate={() => setActiveGIdx(gi)}
                                    t={t} fontFamily={fontFamily} sidebarLabelColor={sidebarLabelColor}
                                    sidebarActiveBg={sidebarActiveBg} accent={accentColor} />
                            ))}
                        </div>
                        <div style={{ padding: "20px 22px", minHeight: menuMinHeight }}>
                            {activeGroup && (
                                <div key={`${openIdx ?? 0}-${safeGIdx}`} style={{ animation: `mmIn ${dur * 0.4}ms ease` }}>
                                    <div style={{ fontSize: groupHeaderSize, fontWeight: _groupHeaderWeight, fontFamily, letterSpacing: "0.11em", textTransform: "uppercase", color: ghColor, background: ghBg, marginBottom: 11, paddingBottom: 10, paddingTop: ghBg !== "transparent" ? 6 : 0, paddingLeft: ghBg !== "transparent" ? 8 : 0, borderRadius: ghBg !== "transparent" ? 6 : 0, borderBottom: `1px solid ${t.divider}`, display: "flex", alignItems: "center", gap: 7 }}>
                                        <IconEl emoji={activeGroup.groupIcon || ""} img={activeGroup.groupIconImg || ""} size={14} />
                                        {activeGroup.groupLabel}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: menuGap }}>
                                        {activeLinks.map((link, li) => (
                                            <MenuCard key={li} link={link} accent={accentColor} showDesc={showDesc} showBadge={showBadges}
                                                t={t} cardRadius={cardRadius} fontFamily={fontFamily}
                                                linkTitleSize={linkTitleSize} linkTitleWeight={_linkTitleWeight} linkTitleColor={linkTitleColor}
                                                linkDescSize={linkDescSize} linkDescColor={linkDescColor} badgeBg={badgeBg} badgeColor={badgeColor} />
                                        ))}
                                    </div>
                                    {showFooter && Array.isArray(footerLinks) && footerLinks.length > 0 && (
                                        <div style={{ marginTop: 14, paddingTop: 11, borderTop: `1px solid ${t.divider}`, display: "flex", gap: 4, flexWrap: "wrap" }}>
                                            {footerLinks.map((fl, fi) => (
                                                <a key={fi} href={fl.href || "#"} style={{ fontSize: 11, fontFamily, color: t.footerLink, padding: "4px 8px", borderRadius: 6, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3, transition: "all 0.13s" }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = accentColor; e.currentTarget.style.background = accentColor + "14" }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = t.footerLink; e.currentTarget.style.background = "" }}>
                                                    <span style={{ opacity: 0.5, fontSize: 9 }}>↗</span>{fl.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@keyframes mmIn { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: translateX(0px); } }`}</style>
        </div>
    )
}

// ─── Group Control ────────────────────────────────────────────────────────────

const LINK_CTRL = (n: number, defIcon: string) => ({
    [`link${n}Show`]:    { type: ControlType.Boolean, title: `Link ${n}`,      defaultValue: n <= 2 },
    [`link${n}Label`]:   { type: ControlType.String,  title: "  Label",        defaultValue: `Link ${n}`,             hidden: (p: any) => !p[`link${n}Show`] },
    [`link${n}Desc`]:    { type: ControlType.String,  title: "  Description",  defaultValue: "Short description here", hidden: (p: any) => !p[`link${n}Show`] },
    [`link${n}Href`]:    { type: ControlType.String,  title: "  URL",          defaultValue: "#",                      hidden: (p: any) => !p[`link${n}Show`] },
    [`link${n}Icon`]:    { type: ControlType.String,  title: "  Icon (emoji)", defaultValue: defIcon,                  hidden: (p: any) => !p[`link${n}Show`] },
    [`link${n}IconImg`]: { type: ControlType.Image,   title: "  Icon (image)", hidden: (p: any) => !p[`link${n}Show`] },
    [`link${n}Badge`]:   { type: ControlType.String,  title: "  Badge",        defaultValue: "",                       hidden: (p: any) => !p[`link${n}Show`] },
})

const GROUP_CONTROL = {
    type: ControlType.Object,
    controls: {
        groupLabel:   { type: ControlType.String, title: "Group Name",         defaultValue: "Group" },
        groupIcon:    { type: ControlType.String, title: "Group Icon (emoji)", defaultValue: "🧩" },
        groupIconImg: { type: ControlType.Image,  title: "Group Icon (image)" },
        ...LINK_CTRL(1, "◈"), ...LINK_CTRL(2, "▣"), ...LINK_CTRL(3, "⊞"),
        ...LINK_CTRL(4, "⊕"), ...LINK_CTRL(5, "◉"), ...LINK_CTRL(6, "▷"),
    },
} as const

// ─── Property Controls (Organized by Category) ───────────────────────────────

addPropertyControls(OsmoMegaMenu, {

    // ══ 🧭 CONTENT ═══════════════════════════════════════════════════════════
    navItems: {
        type: ControlType.Array, title: "Nav Items",
        control: {
            type: ControlType.Object,
            controls: {
                label:    { type: ControlType.String, title: "Label",    defaultValue: "Menu Item" },
                href:     { type: ControlType.String, title: "Link URL", defaultValue: "#" },
                itemType: { type: ControlType.Enum,   title: "Type",     options: ["link","dropdown"], optionTitles: ["Direct Link","Dropdown"], defaultValue: "link" },
                groups: {
                    type: ControlType.Array, title: "Groups", control: GROUP_CONTROL, defaultValue: [],
                    hidden: (p: NavItem) => p.itemType !== "dropdown",
                },
            },
        },
        defaultValue: DEFAULT_NAV,
    },

    // ── Logo ─────────────────────────────────────────────────────────────────
    logoType:  { type: ControlType.Enum,   title: "Logo Type",  options: ["text","image"], optionTitles: ["Text","Image"], defaultValue: "text" },
    logoText:  { type: ControlType.String, title: "  Text",     defaultValue: "osmo",    hidden: (p: any) => p.logoType !== "text" },
    logoSize:  { type: ControlType.Number, title: "  Size",     defaultValue: 18, min: 12, max: 48, step: 1, displayStepper: true, hidden: (p: any) => p.logoType !== "text" },
    logoColor: { type: ControlType.Color,  title: "  Color",    defaultValue: "#7c6dff", hidden: (p: any) => p.logoType !== "text" },
    logoImage: { type: ControlType.Image,  title: "  Image",    hidden: (p: any) => p.logoType !== "image" },
    logoHref:  { type: ControlType.String, title: "  Link",     defaultValue: "/" },

    // ── CTA Button ───────────────────────────────────────────────────────────
    showCTA:        { type: ControlType.Boolean, title: "Show CTA",       defaultValue: true },
    ctaLabel:       { type: ControlType.String,  title: "  Label",        defaultValue: "Get Started",          hidden: (p: any) => !p.showCTA },
    ctaHref:        { type: ControlType.String,  title: "  Link",         defaultValue: "#",                    hidden: (p: any) => !p.showCTA },
    ctaBg:          { type: ControlType.Color,   title: "  BG Color",     defaultValue: "#7c6dff",              hidden: (p: any) => !p.showCTA },
    ctaColor:       { type: ControlType.Color,   title: "  Text Color",   defaultValue: "#ffffff",              hidden: (p: any) => !p.showCTA },
    ctaSize:        { type: ControlType.Number,  title: "  Font Size",    defaultValue: 14, min: 10, max: 24, step: 1, displayStepper: true, hidden: (p: any) => !p.showCTA },
    ctaFontWeight:  { type: ControlType.Enum,    title: "  Weight",       options: [400,500,600,700], optionTitles: ["Regular","Medium","SemiBold","Bold"], defaultValue: 600, hidden: (p: any) => !p.showCTA },
    ctaPadX:        { type: ControlType.Number,  title: "  Padding X",    defaultValue: 20, min: 4, max: 60, step: 2, displayStepper: true, hidden: (p: any) => !p.showCTA },
    ctaPadY:        { type: ControlType.Number,  title: "  Padding Y",    defaultValue: 9,  min: 4, max: 28, step: 1, displayStepper: true, hidden: (p: any) => !p.showCTA },
    ctaRadius:      { type: ControlType.Number,  title: "  Radius",       defaultValue: 10, min: 0, max: 50, step: 1, displayStepper: true, hidden: (p: any) => !p.showCTA },
    ctaBorderWidth: { type: ControlType.Number,  title: "  Border Width", defaultValue: 0,  min: 0, max: 4,  step: 1, displayStepper: true, hidden: (p: any) => !p.showCTA },
    ctaBorderColor: { type: ControlType.Color,   title: "  Border Color", defaultValue: "rgba(255,255,255,0.3)", hidden: (p: any) => !p.showCTA || !p.ctaBorderWidth },

    // ── Dropdown Options ─────────────────────────────────────────────────────
    showDesc:    { type: ControlType.Boolean, title: "Show Descriptions", defaultValue: true },
    showBadges:  { type: ControlType.Boolean, title: "Show Badges",       defaultValue: true },
    showFooter:  { type: ControlType.Boolean, title: "Show Footer Links", defaultValue: true },
    footerLinks: {
        type: ControlType.Array, title: "  Footer Links",
        control: { type: ControlType.Object, controls: { label: { type: ControlType.String, title: "Label", defaultValue: "Link" }, href: { type: ControlType.String, title: "URL", defaultValue: "#" } } },
        defaultValue: DEFAULT_FOOTER,
        hidden: (p: any) => !p.showFooter,
    },

    // ══ 🎨 APPEARANCE ════════════════════════════════════════════════════════
    colorMode:   { type: ControlType.Enum,  title: "Color Mode",  options: ["dark","light"], optionTitles: ["🌙 Dark","☀️ Light"], defaultValue: "dark" },
    accentColor: { type: ControlType.Color, title: "Accent Color",defaultValue: "#7c6dff" },

    // ── Navbar Colors ────────────────────────────────────────────────────────
    navBgColor:         { type: ControlType.Color, title: "Nav Background",      defaultValue: "rgba(0,0,0,0)" },
    navBorderColor:     { type: ControlType.Color, title: "Nav Border",           defaultValue: "rgba(0,0,0,0)" },
    navFontColor:       { type: ControlType.Color, title: "Nav Text",             defaultValue: "rgba(0,0,0,0)" },
    navFontColorActive: { type: ControlType.Color, title: "Nav Text (Active)",    defaultValue: "rgba(0,0,0,0)" },

    // ── Dropdown Colors ──────────────────────────────────────────────────────
    menuBgColor:       { type: ControlType.Color, title: "Dropdown Background",   defaultValue: "rgba(0,0,0,0)" },
    menuBorderColor:   { type: ControlType.Color, title: "Dropdown Border",        defaultValue: "rgba(0,0,0,0)" },
    sidebarBgColor:    { type: ControlType.Color, title: "Sidebar Background",     defaultValue: "rgba(0,0,0,0)" },
    sidebarLabelColor: { type: ControlType.Color, title: "Sidebar Text",           defaultValue: "rgba(0,0,0,0)" },
    sidebarActiveBg:   { type: ControlType.Color, title: "Sidebar Active BG",      defaultValue: "rgba(0,0,0,0)" },
    groupHeaderColor:  { type: ControlType.Color, title: "Group Label Color",      defaultValue: "rgba(0,0,0,0)" },
    groupHeaderBg:     { type: ControlType.Color, title: "Group Label Background", defaultValue: "rgba(0,0,0,0)" },
    linkTitleColor:    { type: ControlType.Color, title: "Link Title Color",        defaultValue: "rgba(0,0,0,0)" },
    linkDescColor:     { type: ControlType.Color, title: "Link Desc Color",         defaultValue: "rgba(0,0,0,0)" },
    badgeBg:           { type: ControlType.Color, title: "Badge Background",        defaultValue: "rgba(0,0,0,0)" },
    badgeColor:        { type: ControlType.Color, title: "Badge Text Color",        defaultValue: "rgba(0,0,0,0)" },

    // ══ ✏️ TYPOGRAPHY ════════════════════════════════════════════════════════
    font:              { type: ControlType.Font,   title: "Font Family", displayFontSize: false, displayTextAlignment: false },
    navFontSize:       { type: ControlType.Number, title: "Nav Text Size",     defaultValue: 14,   min: 11, max: 22, step: 1,   displayStepper: true },
    navFontWeight:     { type: ControlType.Enum,   title: "Nav Text Weight",   options: [300,400,500,600,700], optionTitles: ["Light","Regular","Medium","SemiBold","Bold"], defaultValue: 500 },
    linkTitleSize:     { type: ControlType.Number, title: "Link Title Size",   defaultValue: 13,   min: 10, max: 20, step: 1,   displayStepper: true },
    linkTitleWeight:   { type: ControlType.Enum,   title: "Link Title Weight", options: [300,400,500,600,700], optionTitles: ["Light","Regular","Medium","SemiBold","Bold"], defaultValue: 500 },
    linkDescSize:      { type: ControlType.Number, title: "Link Desc Size",    defaultValue: 11.5, min: 9,  max: 16, step: 0.5, displayStepper: true },
    groupHeaderSize:   { type: ControlType.Number, title: "Group Label Size",  defaultValue: 10,   min: 8,  max: 16, step: 1,   displayStepper: true },
    groupHeaderWeight: { type: ControlType.Enum,   title: "Group Label Weight",options: [400,500,600,700,800], optionTitles: ["Regular","Medium","SemiBold","Bold","ExtraBold"], defaultValue: 700 },

    // ══ 📐 LAYOUT & SHAPE ════════════════════════════════════════════════════
    navbarRadius:  { type: ControlType.Number, title: "Navbar Radius",   defaultValue: 16,  min: 0, max: 40,  step: 1,  displayStepper: true },
    menuRadius:    { type: ControlType.Number, title: "Dropdown Radius", defaultValue: 20,  min: 0, max: 40,  step: 1,  displayStepper: true },
    cardRadius:    { type: ControlType.Number, title: "Card Radius",     defaultValue: 10,  min: 0, max: 24,  step: 1,  displayStepper: true },
    backdropBlur:  { type: ControlType.Number, title: "Blur Amount",     defaultValue: 28,  min: 0, max: 60,  step: 2,  displayStepper: true },
    navPadX:       { type: ControlType.Number, title: "Nav Padding X",   defaultValue: 20,  min: 8, max: 64,  step: 2,  displayStepper: true },
    navPadY:       { type: ControlType.Number, title: "Nav Padding Y",   defaultValue: 13,  min: 6, max: 32,  step: 1,  displayStepper: true },
    sidebarW:      { type: ControlType.Number, title: "Sidebar Width",   defaultValue: 200, min: 140, max: 320, step: 10, displayStepper: true },
    menuCols:      { type: ControlType.Enum,   title: "Link Columns",    options: [2,3,4],  optionTitles: ["2 cols","3 cols","4 cols"], defaultValue: 3 },
    menuGap:       { type: ControlType.Number, title: "Link Gap",        defaultValue: 5,   min: 0, max: 20,  step: 1,  displayStepper: true },
    menuMinHeight: { type: ControlType.Number, title: "Dropdown Height", defaultValue: 280, min: 160, max: 600, step: 10, displayStepper: true },

    // ══ ⚡ INTERACTION ════════════════════════════════════════════════════════
    trigger:    { type: ControlType.Enum,   title: "Open On",     options: ["hover","click"],        optionTitles: ["Hover","Click"],              defaultValue: "hover" },
    hoverDelay: { type: ControlType.Number, title: "Open Delay",  defaultValue: 100, min: 0, max: 500, step: 10, displayStepper: true },
    closeDelay: { type: ControlType.Number, title: "Close Delay", defaultValue: 80,  min: 0, max: 400, step: 10, displayStepper: true },
    animSpeed:  { type: ControlType.Enum,   title: "Anim Speed",  options: ["slow","normal","fast"], optionTitles: ["🐢 Slow","✅ Normal","⚡ Fast"], defaultValue: "normal" },

    // ══ 📱 RESPONSIVE ════════════════════════════════════════════════════════
    mobileBp: { type: ControlType.Number, title: "Mobile Breakpoint", defaultValue: 768,  min: 320, max: 1024, step: 8, displayStepper: true },
    tabletBp: { type: ControlType.Number, title: "Tablet Breakpoint", defaultValue: 1024, min: 768, max: 1440, step: 8, displayStepper: true },
})
