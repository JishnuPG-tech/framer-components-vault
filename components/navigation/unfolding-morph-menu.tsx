import * as React from "react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
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

/* Internal pages go through Framer's own Link (named import, so the publish build maps it):
   it matches the path to a route and navigates with the site router, which keeps client-side
   navigation and the page transitions set in the project. A plain <a> would hard-reload the page.
   External, mailto and tel links stay plain anchors. */
const isInternalHref = (href?: string) =>
    !!href && /^(\/(?!\/)|\.|#)/.test(href)

/* Links come from a free-text Link field: drop script-style URLs rather than render them */
const safeHref = (href?: string) =>
    href && /^\s*(javascript|data|vbscript):/i.test(href) ? undefined : href

type NavAnchorProps = React.ComponentProps<typeof motion.a>

function NavAnchor({ href, children, ...rest }: NavAnchorProps) {
    const safe = safeHref(href) || undefined
    const anchor = (
        <motion.a href={safe} {...rest}>
            {children}
        </motion.a>
    )
    const canvas = RenderTarget.current() === RenderTarget.canvas
    if (!canvas && isInternalHref(safe))
        return <Link href={safe}>{anchor}</Link>
    return anchor
}

/* =============================================================================
   MORPH MENU
   A morphing menu: pill -> "Menu +" -> open panel with links. Hovering a link
   reveals its own image + caption in a side panel. Hovering a legal link (or
   leaving a link) returns the menu to its "Open: Default" state.

   HOW TO EDIT
   - Everything below in DEFAULTS is also a property control in Framer, grouped
     in this order: Canvas Preview, Content (brand, links, side panel text),
     Layout + Style, Typography, Animation and Behavior. Change values in the
     panel, or edit this block to change the defaults for new instances.
   - "Canvas State" lets you pin the menu open / on a link while designing.
   - Responsive: the image side panel hides itself on viewports narrower than
     "Side Panel > Hide Below" so the open menu never overflows a phone screen.
   - Mobile Layout: on viewports narrower than "Mobile Layout > Below" the main and
     legal link texts switch to their larger mobile sizes. With "Fill Screen Width"
     on, the bar stays compact while closed and widens to the full screen width as
     the open animation starts (and folds back when it closes).
   - The menu closes on Escape, on a link click and on an outside click (each is a
     toggle under Behavior), so it works on its own without any code override.
   - Place the component in a fixed / absolute layer (a nav bar, an overlay): the
     panel animates its own size, which would push neighbours inside a normal stack.
   - onOpenChange / closeSignal are optional hooks for code overrides: the
     MenuBackdrop.tsx overrides use them to blur + darken the page while the menu
     is open.
   ========================================================================== */

type Transition = Record<string, any>
type Phase = "closed" | "hover" | "intro" | "open" | "closing"
type ImageValue = { src?: string; srcSet?: string; alt?: string }
type NavItem = {
    label?: string
    href?: string
    showPreview?: boolean
    image?: ImageValue
    imageUrl?: string
    title?: string
    description?: string
}
type LegalItem = { label?: string; href?: string }

const SPRING: Transition = { type: "spring", duration: 0.6, bounce: 0 }

const DEFAULTS = {
    /* ---- Elements ---- */
    brandText: "Knoll©",
    brandLink: "",
    menuLabel: "Menu",
    infoBrand: "Knoll©",
    infoCopyright: "© 2026 Knoll.\nAll Rights Reserved.",
    links: [
        {
            label: "Home",
            href: "/",
            showPreview: true,
            title: "Home",
            description: "Start here and see what we do",
            imageUrl:
                "https://framerusercontent.com/images/v35gyx0zU78O1zSDZnGUM60ZpoQ.jpg?scale-down-to=512",
        },
        {
            label: "Studio",
            href: "/studio",
            showPreview: true,
            title: "Studio",
            description: "Get to know our team and how we work",
            imageUrl:
                "https://framerusercontent.com/images/C4mcNIdzBfiraDaLnTTUmfJjm8.jpg?scale-down-to=512",
        },
        {
            label: "Projects",
            href: "/projects",
            showPreview: true,
            title: "Projects",
            description: "Selected buildings, from first sketch to handover",
            imageUrl:
                "https://framerusercontent.com/images/qUzMCxXftr48zIu9biLX3JkGSc.jpg?scale-down-to=512",
        },
        {
            label: "Services",
            href: "/services",
            showPreview: true,
            title: "Services",
            description: "Architecture, interiors, urbanism and restoration",
            imageUrl:
                "https://framerusercontent.com/images/mq7nn6C2NFPyUg8dC0XXlB5qDU.jpg?scale-down-to=512",
        },
        {
            label: "Journal",
            href: "/journal",
            showPreview: true,
            title: "Journal",
            description: "Notes on materials, process and place",
            imageUrl:
                "https://framerusercontent.com/images/AQREfU0n5BxEelypeNwHhpAWB2U.jpg?scale-down-to=512",
        },
        {
            label: "Contact",
            href: "/contact",
            showPreview: true,
            title: "Contact",
            description: "Tell us about your site and your plans",
            imageUrl:
                "https://framerusercontent.com/images/bFtstzcWd3fOyAbT3RvubwhStw.jpg?scale-down-to=512",
        },
    ] as NavItem[],
    legalLinks: [
        { label: "Privacy Policy", href: "" },
        { label: "Terms & Conditions", href: "" },
    ] as LegalItem[],

    /* ---- UI: container (the dark glass pill) ---- */
    container: {
        fill: "rgba(0, 0, 0, 0.74)",
        blur: 10,
        radius: 10,
        padding: 5,
        gap: 10,
        panelGap: 5,
    },
    brand: { padding: 5, logoHeight: 16 },

    /* ---- UI: trigger button that grows into the link panel ---- */
    trigger: {
        size: 29,
        radius: 5,
        iconSize: 9,
        iconColor: "#FFFFFF",
        closedFill: "rgba(255, 255, 255, 0.08)",
        hoverFill: "rgba(255, 255, 255, 0.15)",
        openFill: "rgba(161, 161, 161, 0.15)",
        hoverPaddingX: 12,
        labelGap: 10,
        openPaddingTop: 7,
        openPaddingRight: 30,
        openPaddingBottom: 7,
        openPaddingLeft: 12,
        headerToLinks: 13,
        headerOpacity: 0.5,
        iconRotateHover: 90,
        iconRotateOpen: 225,
    },

    /* ---- UI: link list ---- */
    list: {
        linkGap: 5,
        groupGap: 30,
        legalGap: 5,
        dimOpacity: 0.2,
        linkHoverOpacity: 1,
        legalOpacity: 0.5,
        legalHoverOpacity: 0.5,
    },

    /* ---- UI: image + caption layered over the side panel ---- */
    preview: {
        captionMode: "fill" as "fill" | "bar" | "box",
        captionWidth: 132,
        captionSide: "right" as "left" | "right",
        captionFill: "rgba(0, 0, 0, 0.5)",
        captionPaddingX: 10,
        captionPaddingY: 7,
        captionTitleOpacity: 0.5,
    },

    /* ---- UI: side panel = the Knoll block (logo + copyright). Image + caption sit ON TOP of it ---- */
    side: {
        enabled: true,
        width: 168,
        radius: 5,
        fill: "rgb(18, 18, 18)",
        padding: 10,
        show: true,
        logoHeight: 36,
        brandOpacity: 0.2,
        copyrightOpacity: 0.2,
        hideBelow: 480, // viewport width (px) under which the side panel is dropped; 0 = never
    },

    /* ---- UI: mobile layout (bar widens to the screen when open, bigger link texts) ---- */
    mobile: {
        below: 810, // viewport width (px) under which the mobile layout applies (Framer's Phone breakpoint); 0 = never
        fillWidth: true, // widen the bar to the screen width while the menu is open (closed stays compact)
        margin: 0, // gap kept free on each side of the screen when the bar widens
        linkSize: 32, // main links
        legalSize: 18, // legal links
    },

    /* ---- Typography ---- */
    font: { fontFamily: "Switzer", fontWeight: 500 } as React.CSSProperties,
    displayFont: {
        fontFamily: "Switzer",
        fontWeight: 500,
    } as React.CSSProperties,
    type: {
        textColor: "#FFFFFF",
        size: 16,
        lineHeight: 1.2,
        letterSpacing: -0.04,
        legalSize: 14,
        displaySize: 44,
        displayLineHeight: 0.8,
    },

    /* ---- Animation ---- */
    timing: {
        introDelay: 0.6, // "Open Intro" -> "Open: Default"
        closeDelay: 0.6, // side panels collapse, then the menu folds back
        leaveDelay: 0.08, // grace period when moving between links
        captionStart: 0.1,
        captionStagger: 0.07,
        captionOffsetY: 10, // caption words
        labelStagger: 0.05,
        labelOffsetY: -10,
        labelRotate: -7, // "Menu" characters
    },
    morph: SPRING, // size / fill / icon morph
    fade: SPRING, // link dimming + content fades
    wipe: SPRING, // image curtain + image-to-image wipe
    caption: SPRING, // caption words
    label: SPRING, // "Menu" characters

    /* ---- Behavior ---- */
    behavior: {
        closeOnNavigate: true,
        closeOnEscape: true,
        closeOnOutsideClick: true,
    },

    /* ---- Credits ---- */
    /* Component by David Bagdasaryan — https://www.framer.com/@dtaw/ */
}

type Props = {
    style?: React.CSSProperties
    brandText?: string
    brandLink?: string
    menuLabel?: string
    infoBrand?: string
    infoCopyright?: string
    logo?: string
    logoImage?: ImageValue
    infoLogoImage?: ImageValue
    infoLogo?: string
    links?: NavItem[]
    legalLinks?: LegalItem[]
    container?: Partial<typeof DEFAULTS.container>
    brand?: Partial<typeof DEFAULTS.brand>
    trigger?: Partial<typeof DEFAULTS.trigger>
    list?: Partial<typeof DEFAULTS.list>
    preview?: Partial<typeof DEFAULTS.preview>
    side?: Partial<typeof DEFAULTS.side>
    mobile?: Partial<typeof DEFAULTS.mobile>
    font?: React.CSSProperties
    displayFont?: React.CSSProperties
    type?: Partial<typeof DEFAULTS.type>
    timing?: Partial<typeof DEFAULTS.timing>
    morphTransition?: Transition
    fadeTransition?: Transition
    wipeTransition?: Transition
    captionTransition?: Transition
    labelTransition?: Transition
    behavior?: Partial<typeof DEFAULTS.behavior>
    canvasState?: "closed" | "hover" | "open" | "link"
    canvasLink?: number
    /* Hooks for code overrides (see MenuBackdrop.tsx) */
    onOpenChange?: (open: boolean) => void
    closeSignal?: number
}

const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/* Transition controls may hand back "0.6s" strings: normalise to seconds for framer-motion */
function norm(t: Transition): Transition {
    const out: Transition = { ...t }
    for (const k of ["duration", "delay", "repeatDelay"]) {
        const v = out[k]
        if (typeof v === "string") {
            const n = parseFloat(v)
            out[k] = v.trim().endsWith("ms") ? n / 1000 : n
        }
    }
    return out
}

/* An item's image: the uploaded/linked image control wins, then the plain "Image URL" field */
function imgSrc(item?: NavItem): string {
    return (item && ((item.image && item.image.src) || item.imageUrl)) || ""
}

/* srcSet only comes with the uploaded image control, never with the plain URL field */
function imgSrcSet(item?: NavItem): string | undefined {
    return item && item.image && item.image.src ? item.image.srcSet : undefined
}

function merge<T extends object>(base: T, over?: Partial<T> | null): T {
    return { ...base, ...(over || {}) }
}

/* Quote a font family so names with digits or symbols ("Neue Haas Grotesk 55") stay valid CSS */
const FONT_FALLBACK = ", Inter, system-ui, sans-serif"
function fontStack(family: string): string {
    return (/^["']/.test(family) ? family : '"' + family + '"') + FONT_FALLBACK
}

/* True while the viewport is narrower than `px` (false on the server and when px is 0) */
function useViewportBelow(px: number): boolean {
    const [below, setBelow] = useState(false)
    useIsoLayoutEffect(() => {
        if (!px || typeof window === "undefined" || !window.matchMedia) {
            setBelow(false)
            return
        }
        const mq = window.matchMedia("(max-width: " + (px - 0.02) + "px)")
        const update = () => setBelow(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [px])
    return below
}

/* Current viewport width in px (0 on the server and when `on` is false); follows resizes and rotation */
function useViewportWidth(on: boolean): number {
    const [w, setW] = useState(0)
    useIsoLayoutEffect(() => {
        if (!on || typeof window === "undefined") {
            setW(0)
            return
        }
        const update = () =>
            setW(document.documentElement.clientWidth || window.innerWidth)
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [on])
    return w
}

/* Style rules that inline styles can't express: a visible keyboard focus ring */
const FOCUS_CSS =
    ".morph-menu a:focus-visible,.morph-menu button:focus-visible{outline:2px solid currentColor;outline-offset:2px}" +
    ".morph-menu button:focus-visible{outline-offset:-2px}"

/* Word-by-word reveal (the caption text effect) */
function Words(props: {
    text: string
    start: number
    stagger: number
    offsetY: number
    transition: Transition
    skip: boolean
}) {
    const words = (props.text || "").split(" ")
    return (
        <>
            {words.map((w, i) => (
                <React.Fragment key={i}>
                    <motion.span
                        style={{ display: "inline-block" }}
                        initial={
                            props.skip
                                ? false
                                : { opacity: 0, y: props.offsetY }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                            props.skip
                                ? { duration: 0 }
                                : {
                                      ...props.transition,
                                      delay: props.start + i * props.stagger,
                                  }
                        }
                    >
                        {w}
                    </motion.span>
                    {i < words.length - 1 ? " " : null}
                </React.Fragment>
            ))}
        </>
    )
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 110
 * @framerIntrinsicHeight 39
 */
export default function MorphMenu(props: Props) {
    const reduce = useReducedMotion()
    // Canvas / export / thumbnail renders are static: they show the "Canvas State" you pick.
    // The first real interaction (hover / click / focus) hands control to the live state machine.
    const target = RenderTarget.current()
    const staticTarget =
        target === RenderTarget.canvas ||
        target === RenderTarget.export ||
        target === RenderTarget.thumbnail
    const [touched, setTouched] = useState(false)
    const isCanvas = staticTarget && !touched

    /* ---------- resolve variables (props over DEFAULTS) ---------- */
    const container = merge(DEFAULTS.container, props.container)
    const brand = merge(DEFAULTS.brand, props.brand)
    const trigger = merge(DEFAULTS.trigger, props.trigger)
    const list = merge(DEFAULTS.list, props.list)
    const preview = merge(DEFAULTS.preview, props.preview)
    const side = merge(DEFAULTS.side, props.side)
    const mobile = merge(DEFAULTS.mobile, props.mobile)
    const typo = merge(DEFAULTS.type, props.type)
    const timing = merge(DEFAULTS.timing, props.timing)
    const behavior = merge(DEFAULTS.behavior, props.behavior)
    const morphT = norm(props.morphTransition || DEFAULTS.morph)
    const fadeT = norm(props.fadeTransition || DEFAULTS.fade)
    const wipeT = norm(props.wipeTransition || DEFAULTS.wipe)
    const captionT = norm(props.captionTransition || DEFAULTS.caption)
    const labelT = norm(props.labelTransition || DEFAULTS.label)

    /* ---------- mobile layout ----------
       isMobile switches the link sizes. `fill` widens the bar to the screen, but only
       while the menu is open: the closed bar keeps its compact size, and the open
       panel (below, in the geometry) animates to the width that makes the whole bar
       span the screen. */
    const viewportW = useViewportWidth(mobile.below > 0)
    const isMobile =
        mobile.below > 0 && viewportW > 0 && viewportW < mobile.below
    const fill = !!mobile.fillWidth && isMobile

    const brandText = props.brandText ?? DEFAULTS.brandText
    const brandLink = props.brandLink ?? DEFAULTS.brandLink
    const menuLabel = props.menuLabel ?? DEFAULTS.menuLabel
    const infoBrand = props.infoBrand ?? DEFAULTS.infoBrand
    const infoCopyright = props.infoCopyright ?? DEFAULTS.infoCopyright
    const brandLogo =
        (props.logoImage && props.logoImage.src) ||
        (typeof props.logo === "string" ? props.logo : "")
    const blockLogo =
        (props.infoLogoImage && props.infoLogoImage.src) ||
        (typeof props.infoLogo === "string" && props.infoLogo) ||
        brandLogo
    const brandInner = brandLogo ? (
        <img
            data-testid="brand-logo"
            src={brandLogo}
            alt={brandText}
            draggable={false}
            style={{
                display: "block",
                height: brand.logoHeight,
                width: "auto",
            }}
        />
    ) : (
        brandText
    )
    const links: NavItem[] = props.links ?? DEFAULTS.links
    const legalLinks: LegalItem[] = props.legalLinks ?? DEFAULTS.legalLinks

    const family =
        ((props.font && props.font.fontFamily) as string) ||
        (DEFAULTS.font.fontFamily as string)
    const displayFamily =
        ((props.displayFont && props.displayFont.fontFamily) as string) ||
        (DEFAULTS.displayFont.fontFamily as string)
    const textBase: React.CSSProperties = {
        ...DEFAULTS.font,
        ...props.font,
        fontFamily: fontStack(family),
        fontSize: typo.size,
        lineHeight: typo.lineHeight,
        letterSpacing: typo.letterSpacing + "em",
        color: typo.textColor,
        margin: 0,
    }
    const linkStyle: React.CSSProperties = {
        ...textBase,
        fontSize: isMobile ? mobile.linkSize : typo.size,
    }
    const legalStyle: React.CSSProperties = {
        ...textBase,
        fontSize: isMobile ? mobile.legalSize : typo.legalSize,
    }
    const displayStyle: React.CSSProperties = {
        ...DEFAULTS.displayFont,
        ...props.displayFont,
        fontFamily: fontStack(displayFamily),
        fontSize: typo.displaySize,
        lineHeight: typo.displayLineHeight,
        letterSpacing: typo.letterSpacing + "em",
        color: typo.textColor,
        margin: 0,
    }

    /* ---------- state machine ---------- */
    const [phase, setPhase] = useState<Phase>("closed")
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const hoverRef = useRef(false)
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const navRef = useRef<HTMLElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // The image panel needs room (and a pointer): drop it on narrow viewports
    const narrow = useViewportBelow(side.hideBelow)
    const sideVisible = side.enabled !== false && !narrow

    const nLinks = links.length
    const canvasState = props.canvasState || "closed"
    const canvasIdx = Math.min(
        Math.max((props.canvasLink || 1) - 1, 0),
        Math.max(nLinks - 1, 0)
    )
    const effPhase: Phase = isCanvas
        ? canvasState === "link"
            ? "open"
            : canvasState
        : phase
    const rawActive: number | null = isCanvas
        ? canvasState === "link" &&
          nLinks > 0 &&
          links[canvasIdx] &&
          links[canvasIdx].showPreview !== false
            ? canvasIdx
            : null
        : activeIndex

    const panelOpen =
        effPhase === "intro" || effPhase === "open" || effPhase === "closing"
    const sideOpen = effPhase === "open"
    const labelVisible = effPhase !== "closed"
    const active = sideOpen ? rawActive : null
    const revealOpen = active !== null

    const clearLeave = () => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current)
            leaveTimer.current = null
        }
    }
    const activate = (i: number | null) => {
        clearLeave()
        setTouched(true)
        setActiveIndex(i)
    }
    const deactivateSoon = () => {
        clearLeave()
        setTouched(true)
        leaveTimer.current = setTimeout(
            () => setActiveIndex(null),
            timing.leaveDelay * 1000
        )
    }
    useEffect(() => clearLeave, [])

    const close = () => {
        clearLeave()
        setTouched(true)
        setActiveIndex(null)
        setPhase((p) =>
            p === "open"
                ? "closing"
                : p === "intro"
                  ? hoverRef.current
                      ? "hover"
                      : "closed"
                  : p
        )
    }
    const closeRef = useRef(close)
    closeRef.current = close
    const toggle = () => {
        setTouched(true)
        if (phase === "closed" || phase === "hover") setPhase("intro")
        else if (phase === "intro" || phase === "open") close()
    }
    const onNavigate = () => {
        if (behavior.closeOnNavigate && !isCanvas) close()
    }

    // timed steps: Open Intro -> Open: Default, and Backwards -> Menu Hover / Default
    useEffect(() => {
        if (isCanvas) return
        let t: ReturnType<typeof setTimeout> | undefined
        if (phase === "intro")
            t = setTimeout(() => setPhase("open"), timing.introDelay * 1000)
        if (phase === "closing")
            t = setTimeout(
                () => setPhase(hoverRef.current ? "hover" : "closed"),
                timing.closeDelay * 1000
            )
        return () => {
            if (t) clearTimeout(t)
        }
    }, [phase, timing.introDelay, timing.closeDelay, isCanvas])

    const isOpening = phase === "intro" || phase === "open"

    useEffect(() => {
        if (isCanvas || !behavior.closeOnEscape || !isOpening) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return
            const nav = navRef.current
            const hadFocus = !!nav && nav.contains(document.activeElement)
            closeRef.current()
            // keyboard users land back on the trigger instead of a hidden link
            if (hadFocus && buttonRef.current) buttonRef.current.focus()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isOpening, behavior.closeOnEscape, isCanvas])

    useEffect(() => {
        if (isCanvas || !behavior.closeOnOutsideClick || !isOpening) return
        const onDown = (e: PointerEvent) => {
            const nav = navRef.current
            if (nav && !nav.contains(e.target as Node)) closeRef.current()
        }
        document.addEventListener("pointerdown", onDown)
        return () => document.removeEventListener("pointerdown", onDown)
    }, [isOpening, behavior.closeOnOutsideClick, isCanvas])

    /* ---------- hooks for code overrides (see MenuBackdrop.tsx) ----------
       onOpenChange(open): fires when the menu starts opening (true) or starts closing (false).
       closeSignal: closes the menu whenever the number changes. */
    const openNow = !isCanvas && isOpening
    const onOpenChangeRef = useRef(props.onOpenChange)
    onOpenChangeRef.current = props.onOpenChange
    const reportedOpen = useRef(false)
    useEffect(() => {
        if (reportedOpen.current === openNow) return
        reportedOpen.current = openNow
        if (onOpenChangeRef.current) onOpenChangeRef.current(openNow)
    }, [openNow])
    useEffect(
        () => () => {
            if (reportedOpen.current && onOpenChangeRef.current)
                onOpenChangeRef.current(false)
        },
        []
    )
    const seenClose = useRef(props.closeSignal || 0)
    useEffect(() => {
        const s = props.closeSignal || 0
        if (s === seenClose.current) return
        seenClose.current = s
        closeRef.current()
    }, [props.closeSignal])

    /* ---------- preview layers: base image, wipe image, caption ---------- */
    const [layers, setLayers] = useState<{
        base: number | null
        wipe: number | null
    }>({ base: active, wipe: null })
    const [captionIdx, setCaptionIdx] = useState<number | null>(active)
    const [captionKey, setCaptionKey] = useState(0)
    const prevActive = useRef<number | null>(active)
    useIsoLayoutEffect(() => {
        const prev = prevActive.current
        prevActive.current = active
        if (active === null) return
        setCaptionIdx(active)
        if (prev !== active) setCaptionKey((k) => k + 1)
        setLayers((l) =>
            prev === null || l.base === null
                ? { base: active, wipe: null }
                : active === l.base
                  ? { base: l.base, wipe: null }
                  : { base: l.base, wipe: active }
        )
    }, [active])

    /* ---------- warm the preview images on first hover / open so the wipe never shows an empty frame ---------- */
    const warmed = useRef(false)
    useEffect(() => {
        if (isCanvas || warmed.current || phase === "closed" || !sideVisible)
            return
        warmed.current = true
        links.forEach((item) => {
            const src = imgSrc(item)
            if (!src || item.showPreview === false) return
            const img = new Image()
            img.sizes = side.width + "px"
            const set = imgSrcSet(item)
            if (set) img.srcset = set
            img.src = src
        })
    }, [phase, isCanvas, sideVisible])

    /* ---------- measurements (text-dependent sizes) ---------- */
    const linksRef = useRef<HTMLDivElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)
    const brandRef = useRef<HTMLDivElement>(null)
    const [m, setM] = useState({
        linksW: 140,
        linksH: 175,
        labelW: 39,
        labelH: 19,
        brandW: 70, // the brand never changes size while the menu animates, so it is safe to read
    })
    const [ready, setReady] = useState(false)

    useIsoLayoutEffect(() => {
        const measure = () => {
            const next = {
                linksW: linksRef.current ? linksRef.current.offsetWidth : 0,
                linksH: linksRef.current ? linksRef.current.offsetHeight : 0,
                labelW:
                    labelRef.current && labelRef.current.offsetWidth
                        ? labelRef.current.offsetWidth + 1
                        : 0,
                labelH: labelRef.current ? labelRef.current.offsetHeight : 0,
                brandW: brandRef.current ? brandRef.current.offsetWidth : 0,
            }
            setM((prev) => {
                const merged = {
                    linksW: next.linksW || prev.linksW,
                    linksH: next.linksH || prev.linksH,
                    labelW: next.labelW || prev.labelW,
                    labelH: next.labelH || prev.labelH,
                    brandW: next.brandW || prev.brandW,
                }
                return merged.linksW === prev.linksW &&
                    merged.linksH === prev.linksH &&
                    merged.labelW === prev.labelW &&
                    merged.labelH === prev.labelH &&
                    merged.brandW === prev.brandW
                    ? prev
                    : merged
            })
        }
        measure()
        let ro: ResizeObserver | null = null
        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver(measure)
            if (linksRef.current) ro.observe(linksRef.current)
            if (labelRef.current) ro.observe(labelRef.current)
            if (brandRef.current) ro.observe(brandRef.current)
        }
        const fonts =
            typeof document !== "undefined" ? (document as any).fonts : null
        if (fonts && fonts.ready) fonts.ready.then(measure)
        const raf =
            typeof requestAnimationFrame !== "undefined"
                ? requestAnimationFrame(() => setReady(true))
                : 0
        return () => {
            if (ro) ro.disconnect()
            if (raf && typeof cancelAnimationFrame !== "undefined")
                cancelAnimationFrame(raf)
        }
    }, [])

    const instant = !ready || isCanvas || !!reduce
    const gate = (t: Transition): Transition => (instant ? { duration: 0 } : t)

    /* ---------- geometry derived from the variables ---------- */
    const labelW = m.labelW
    const headerH = Math.max(m.labelH, trigger.iconSize)
    const hoverW =
        trigger.hoverPaddingX * 2 + labelW + trigger.labelGap + trigger.iconSize
    const openW =
        trigger.openPaddingLeft +
        Math.max(m.linksW, labelW + trigger.labelGap + trigger.iconSize) +
        trigger.openPaddingRight
    const openH =
        trigger.openPaddingTop +
        headerH +
        trigger.headerToLinks +
        m.linksH +
        trigger.openPaddingBottom
    // Mobile fill (open only): the panel grows to the width that makes the whole bar span the
    // screen: screen - side margins - bar padding - brand - brand gap, minus the image panel
    // once that unfolds. The bar is as wide as its content, so it widens along with the panel.
    const sideReserve =
        sideOpen && sideVisible ? side.width + container.panelGap : 0
    const fillOpenW =
        fill && viewportW > 0
            ? Math.max(
                  openW,
                  viewportW -
                      mobile.margin * 2 -
                      container.padding * 2 -
                      m.brandW -
                      container.gap -
                      sideReserve
              )
            : openW
    const panelW = panelOpen
        ? fillOpenW
        : effPhase === "hover"
          ? hoverW
          : trigger.size
    const panelH = panelOpen ? openH : trigger.size
    const rowX = panelOpen
        ? trigger.openPaddingLeft
        : effPhase === "hover"
          ? trigger.hoverPaddingX
          : (trigger.size - trigger.iconSize) / 2
    const rowY = panelOpen
        ? trigger.openPaddingTop
        : (trigger.size - headerH) / 2
    const iconRotate = panelOpen
        ? trigger.iconRotateOpen
        : effPhase === "hover"
          ? trigger.iconRotateHover
          : 0
    const panelFill = panelOpen
        ? trigger.openFill
        : effPhase === "hover"
          ? trigger.hoverFill
          : trigger.closedFill

    const baseItem = layers.base !== null ? links[layers.base] : undefined
    const wipeItem = layers.wipe !== null ? links[layers.wipe] : undefined
    const captionItem = captionIdx !== null ? links[captionIdx] : undefined

    // blur(0px) still forces a compositing layer: skip the filter entirely when it is off
    const blurFilter =
        container.blur > 0 ? "blur(" + container.blur + "px)" : "none"

    const imgStyle: React.CSSProperties = {
        position: "absolute",
        left: 0,
        bottom: 0,
        width: side.width,
        height: openH,
        objectFit: "cover",
        display: "block",
    }

    /* ---------- render ---------- */
    return (
        <nav
            ref={navRef}
            className="morph-menu"
            data-framer-name="Morph Menu"
            aria-label="Site menu"
            style={{
                ...props.style,
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                width: "max-content",
                height: "max-content",
                boxSizing: "border-box",
                padding: container.padding,
                gap: container.gap,
                background: container.fill,
                backdropFilter: blurFilter,
                WebkitBackdropFilter: blurFilter,
                borderRadius: container.radius,
                overflow: "hidden",
            }}
        >
            <style>{FOCUS_CSS}</style>

            {/* Brand */}
            <div
                ref={brandRef}
                data-framer-name="Brand"
                style={{
                    ...textBase,
                    boxSizing: "border-box",
                    padding: brand.padding,
                    minHeight: trigger.size,
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    flex: "none",
                }}
            >
                {brandLink ? (
                    <NavAnchor
                        href={brandLink}
                        onClickCapture={onNavigate}
                        style={{
                            color: "inherit",
                            textDecoration: "none",
                            display: "block",
                        }}
                    >
                        {brandInner}
                    </NavAnchor>
                ) : (
                    brandInner
                )}
            </div>

            <div
                style={{ display: "flex", alignItems: "stretch", flex: "none" }}
            >
                {/* Trigger -> link panel */}
                <motion.div
                    data-framer-name="Trigger"
                    initial={false}
                    animate={{
                        width: panelW,
                        height: panelH,
                        backgroundColor: panelFill,
                    }}
                    transition={gate(morphT)}
                    onMouseEnter={() => {
                        hoverRef.current = true
                        setTouched(true)
                        setPhase((p) => (p === "closed" ? "hover" : p))
                    }}
                    onMouseLeave={() => {
                        hoverRef.current = false
                        setTouched(true)
                        setPhase((p) => (p === "hover" ? "closed" : p))
                    }}
                    style={{
                        position: "relative",
                        flex: "none",
                        overflow: "hidden",
                        borderRadius: trigger.radius,
                    }}
                >
                    <button
                        ref={buttonRef}
                        type="button"
                        data-framer-name="Toggle"
                        aria-label={panelOpen ? "Close menu" : "Open menu"}
                        aria-expanded={panelOpen}
                        onClick={toggle}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            width: "100%",
                            height: panelOpen
                                ? trigger.openPaddingTop * 2 + headerH
                                : "100%",
                            zIndex: 2,
                            appearance: "none",
                            background: "transparent",
                            border: 0,
                            padding: 0,
                            margin: 0,
                            cursor: "pointer",
                        }}
                    />

                    {/* Header row: "Menu" label + plus/close icon */}
                    <motion.div
                        initial={false}
                        animate={{
                            x: rowX,
                            y: rowY,
                            opacity: panelOpen ? trigger.headerOpacity : 1,
                        }}
                        transition={gate(morphT)}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            display: "flex",
                            alignItems: "center",
                            height: headerH,
                            pointerEvents: "none",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <motion.span
                            initial={false}
                            animate={{
                                width: labelVisible ? labelW : 0,
                                marginRight: labelVisible
                                    ? trigger.labelGap
                                    : 0,
                            }}
                            transition={gate(morphT)}
                            style={{ display: "block", overflow: "hidden" }}
                        >
                            <span
                                ref={labelRef}
                                style={{
                                    ...textBase,
                                    display: "inline-block",
                                    width: "max-content",
                                    whiteSpace: "pre",
                                }}
                            >
                                {Array.from(menuLabel).map((ch, i) => (
                                    <motion.span
                                        key={i}
                                        initial={false}
                                        animate={
                                            labelVisible
                                                ? {
                                                      opacity: 1,
                                                      y: 0,
                                                      rotate: 0,
                                                  }
                                                : {
                                                      opacity: 0,
                                                      y: timing.labelOffsetY,
                                                      rotate: timing.labelRotate,
                                                  }
                                        }
                                        transition={
                                            labelVisible
                                                ? {
                                                      ...gate(labelT),
                                                      delay: instant
                                                          ? 0
                                                          : i *
                                                            timing.labelStagger,
                                                  }
                                                : { duration: 0 }
                                        }
                                        style={{
                                            display: "inline-block",
                                            whiteSpace: "pre",
                                        }}
                                    >
                                        {ch}
                                    </motion.span>
                                ))}
                            </span>
                        </motion.span>
                        <motion.span
                            initial={false}
                            animate={{ rotate: iconRotate }}
                            transition={gate(morphT)}
                            style={{
                                display: "block",
                                width: trigger.iconSize,
                                height: trigger.iconSize,
                                flex: "none",
                            }}
                        >
                            <svg
                                width={trigger.iconSize}
                                height={trigger.iconSize}
                                viewBox="0 0 9 9"
                                style={{
                                    display: "block",
                                    overflow: "visible",
                                }}
                                aria-hidden="true"
                            >
                                <path
                                    d="M 9 5.143 L 5.143 5.143 L 5.143 9 L 3.857 9 L 3.857 5.143 L 0 5.143 L 0 3.857 L 3.857 3.857 L 3.857 0 L 5.143 0 L 5.143 3.857 L 9 3.857 Z"
                                    fill={trigger.iconColor}
                                />
                            </svg>
                        </motion.span>
                    </motion.div>

                    {/* Links */}
                    <motion.div
                        ref={linksRef}
                        data-framer-name="Links"
                        initial={false}
                        animate={{ opacity: panelOpen ? 1 : 0 }}
                        transition={gate(fadeT)}
                        aria-hidden={!panelOpen}
                        style={{
                            position: "absolute",
                            left: trigger.openPaddingLeft,
                            top:
                                trigger.openPaddingTop +
                                headerH +
                                trigger.headerToLinks,
                            width: "max-content",
                            display: "flex",
                            flexDirection: "column",
                            gap: list.groupGap,
                            pointerEvents: panelOpen ? "auto" : "none",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: list.linkGap,
                            }}
                        >
                            {links.map((item, i) => {
                                const hasPreview = item.showPreview !== false
                                const dimmed = active !== null && active !== i
                                return (
                                    <NavAnchor
                                        key={i}
                                        href={item.href}
                                        tabIndex={panelOpen ? 0 : -1}
                                        initial={false}
                                        animate={{
                                            opacity: dimmed
                                                ? list.dimOpacity
                                                : active === i
                                                  ? list.linkHoverOpacity
                                                  : 1,
                                        }}
                                        transition={gate(fadeT)}
                                        onMouseEnter={() =>
                                            activate(hasPreview ? i : null)
                                        }
                                        onMouseLeave={deactivateSoon}
                                        onFocus={() =>
                                            activate(hasPreview ? i : null)
                                        }
                                        onBlur={deactivateSoon}
                                        onClickCapture={onNavigate}
                                        style={{
                                            ...linkStyle,
                                            display: "block",
                                            textDecoration: "none",
                                            cursor: "pointer",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {item.label}
                                    </NavAnchor>
                                )
                            })}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: list.legalGap,
                            }}
                        >
                            {legalLinks.map((item, i) => (
                                <NavAnchor
                                    key={i}
                                    href={item.href}
                                    tabIndex={panelOpen ? 0 : -1}
                                    initial={false}
                                    animate={{ opacity: list.legalOpacity }}
                                    whileHover={{
                                        opacity: list.legalHoverOpacity,
                                    }}
                                    transition={gate(fadeT)}
                                    onMouseEnter={() => activate(null)}
                                    onFocus={() => activate(null)}
                                    onClickCapture={onNavigate}
                                    style={{
                                        ...legalStyle,
                                        display: "block",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {item.label}
                                </NavAnchor>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    data-testid="side"
                    data-framer-name="Side Panel"
                    initial={false}
                    animate={{
                        width: sideOpen ? side.width : 0,
                        marginLeft:
                            sideOpen && sideVisible ? container.panelGap : 0,
                    }}
                    transition={gate(morphT)}
                    aria-hidden={!sideOpen}
                    style={{
                        display: sideVisible ? "block" : "none",
                        position: "relative",
                        flex: "none",
                        alignSelf: "stretch",
                        overflow: "hidden",
                        borderRadius: side.radius,
                        background: side.fill,
                    }}
                >
                    {/* Knoll block: the background of the panel (logo + copyright) */}
                    <div
                        data-testid="block"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: side.width,
                            boxSizing: "border-box",
                            padding: side.padding,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: 10,
                        }}
                    >
                        {side.show ? (
                            <>
                                {blockLogo ? (
                                    <img
                                        data-testid="block-logo"
                                        src={blockLogo}
                                        alt={infoBrand}
                                        draggable={false}
                                        style={{
                                            display: "block",
                                            height: side.logoHeight,
                                            width: "100%",
                                            objectFit: "contain",
                                            objectPosition: "left top",
                                            opacity: side.brandOpacity,
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            ...displayStyle,
                                            opacity: side.brandOpacity,
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {infoBrand}
                                    </div>
                                )}
                                <div
                                    style={{
                                        ...textBase,
                                        opacity: side.copyrightOpacity,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {infoCopyright}
                                </div>
                            </>
                        ) : null}
                    </div>

                    {/* Image layer: rises from the bottom over the Knoll block */}
                    <motion.div
                        data-testid="curtain"
                        initial={false}
                        animate={{ height: revealOpen ? "100%" : "0%" }}
                        transition={gate(wipeT)}
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            overflow: "hidden",
                            borderRadius: side.radius,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                bottom: 0,
                                width: side.width,
                                height: openH,
                            }}
                        >
                            {imgSrc(baseItem) ? (
                                <img
                                    data-testid="base-img"
                                    src={imgSrc(baseItem)}
                                    srcSet={imgSrcSet(baseItem)}
                                    sizes={side.width + "px"}
                                    alt=""
                                    decoding="async"
                                    draggable={false}
                                    style={imgStyle}
                                />
                            ) : null}
                            {imgSrc(wipeItem) ? (
                                <motion.div
                                    data-testid="wipe"
                                    key={"wipe-" + layers.wipe}
                                    initial={{ height: "0%" }}
                                    animate={{ height: "100%" }}
                                    transition={gate(wipeT)}
                                    onAnimationComplete={() =>
                                        setLayers((l) =>
                                            l.wipe !== null
                                                ? { base: l.wipe, wipe: null }
                                                : l
                                        )
                                    }
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        overflow: "hidden",
                                    }}
                                >
                                    <img
                                        data-testid="wipe-img"
                                        src={imgSrc(wipeItem)}
                                        srcSet={imgSrcSet(wipeItem)}
                                        sizes={side.width + "px"}
                                        alt=""
                                        decoding="async"
                                        draggable={false}
                                        style={imgStyle}
                                    />
                                </motion.div>
                            ) : null}
                            {captionItem ? (
                                <div
                                    data-testid="caption"
                                    data-framer-name="Caption"
                                    style={{
                                        position: "absolute",
                                        bottom: 0,
                                        ...(preview.captionMode === "box"
                                            ? preview.captionSide === "left"
                                                ? {
                                                      left: 0,
                                                      width: preview.captionWidth,
                                                  }
                                                : {
                                                      right: 0,
                                                      width: preview.captionWidth,
                                                  }
                                            : { left: 0, right: 0 }),
                                        ...(preview.captionMode === "bar" ||
                                        preview.captionMode === "box"
                                            ? {}
                                            : { top: 0 }),
                                        boxSizing: "border-box",
                                        padding:
                                            preview.captionPaddingY +
                                            "px " +
                                            preview.captionPaddingX +
                                            "px",
                                        background: preview.captionFill,
                                        zIndex: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <div
                                        key={"caption-" + captionKey}
                                        data-testid="caption-text"
                                    >
                                        <div
                                            style={{
                                                ...textBase,
                                                opacity:
                                                    preview.captionTitleOpacity,
                                            }}
                                        >
                                            <Words
                                                text={captionItem.title || ""}
                                                start={timing.captionStart}
                                                stagger={timing.captionStagger}
                                                offsetY={timing.captionOffsetY}
                                                transition={captionT}
                                                skip={instant}
                                            />
                                        </div>
                                        <div style={textBase}>
                                            <Words
                                                text={
                                                    captionItem.description ||
                                                    ""
                                                }
                                                start={
                                                    timing.captionStart + 0.1
                                                }
                                                stagger={timing.captionStagger}
                                                offsetY={timing.captionOffsetY}
                                                transition={captionT}
                                                skip={instant}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </nav>
    )
}

/* =============================================================================
   PROPERTY CONTROLS
   Order in the panel: Canvas Preview -> Content -> Layout + Style -> Typography
   -> Animation -> Behavior. Complex controls carry a short description.
   ========================================================================== */
const num = (
    title: string,
    defaultValue: number,
    min: number,
    max: number,
    step = 1,
    unit?: string,
    description?: string
) => ({
    type: ControlType.Number as ControlType.Number,
    title,
    defaultValue,
    min,
    max,
    step,
    unit,
    description,
    displayStepper: true,
})
const col = (title: string, defaultValue: string, description?: string) => ({
    type: ControlType.Color as ControlType.Color,
    title,
    defaultValue,
    description,
})
const bool = (title: string, defaultValue: boolean, description?: string) => ({
    type: ControlType.Boolean as ControlType.Boolean,
    title,
    defaultValue,
    description,
})
const obj = (
    title: string,
    controls: any,
    description?: string,
    icon?: "object" | "effect" | "color" | "interaction" | "boolean"
) => ({
    type: ControlType.Object as ControlType.Object,
    title,
    buttonTitle: title,
    description,
    icon,
    controls,
})
const tr = (title: string, description?: string) => ({
    type: ControlType.Transition as ControlType.Transition,
    title,
    description,
    defaultValue: SPRING,
})

const D = DEFAULTS

addPropertyControls(MorphMenu, {
    /* ---- Canvas preview (design-time only) ---- */
    canvasState: {
        type: ControlType.Enum,
        title: "Canvas State",
        description:
            "Pins the menu to a state while you design. The published site always runs the live hover and click behavior.",
        options: ["closed", "hover", "open", "link"],
        optionTitles: [
            "Closed",
            "Menu Hover",
            "Open: Default",
            "Open: Link Hover",
        ],
        defaultValue: "closed",
    },
    canvasLink: {
        type: ControlType.Number,
        title: "Canvas Link #",
        description:
            "Which link (counting from 1) shows its image and caption when Canvas State is Open: Link Hover.",
        defaultValue: 1,
        min: 1,
        max: 20,
        step: 1,
        displayStepper: true,
        hidden: (p: any) => p.canvasState !== "link",
    },

    /* ---- Content ---- */
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo (image)",
        description:
            "Replaces the brand text. Use the SVG field below for a vector logo.",
    },
    logo: {
        type: ControlType.File,
        title: "Logo (SVG)",
        allowedFileTypes: ["svg"],
        hidden: (p: any) => !!p.logoImage,
    },
    brandText: {
        type: ControlType.String,
        title: "Brand Text",
        defaultValue: D.brandText,
        hidden: (p: any) => !!(p.logo || p.logoImage),
    },
    brandLink: {
        type: ControlType.Link,
        title: "Brand Link",
        description:
            "Where the brand text or logo goes when clicked. Optional.",
    },
    menuLabel: {
        type: ControlType.String,
        title: "Menu Label",
        defaultValue: D.menuLabel,
    },
    links: {
        type: ControlType.Array,
        title: "Links",
        description:
            "Main navigation. Each link can reveal its own image and caption in the side panel on hover or focus.",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Link",
                },
                href: { type: ControlType.Link, title: "Link" },
                showPreview: {
                    type: ControlType.Boolean,
                    title: "Preview",
                    description:
                        "Show the image and caption in the side panel when this link is hovered.",
                    defaultValue: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (item: any) => item.showPreview === false,
                },
                imageUrl: {
                    type: ControlType.String,
                    title: "Image URL",
                    description:
                        "Fallback address, used only when no image is set above.",
                    defaultValue: "",
                    placeholder: "https://…",
                    hidden: (item: any) => item.showPreview === false,
                },
                title: {
                    type: ControlType.String,
                    title: "Caption Title",
                    defaultValue: "",
                    hidden: (item: any) => item.showPreview === false,
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    displayTextArea: true,
                    hidden: (item: any) => item.showPreview === false,
                },
            },
        },
        defaultValue: D.links as any,
    },
    legalLinks: {
        type: ControlType.Array,
        title: "Legal Links",
        description:
            "Smaller links under the main list. Hovering one returns the menu to its default open state.",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Legal",
                },
                href: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: D.legalLinks as any,
    },
    infoLogoImage: {
        type: ControlType.ResponsiveImage,
        title: "Block Logo (image)",
        description:
            "Logo shown in the side panel. Falls back to the brand logo when empty.",
    },
    infoLogo: {
        type: ControlType.File,
        title: "Block Logo (SVG)",
        allowedFileTypes: ["svg"],
        hidden: (p: any) => !!p.infoLogoImage,
    },
    infoBrand: {
        type: ControlType.String,
        title: "Block Text",
        description:
            "Large text in the side panel. Hidden when any logo is set.",
        defaultValue: D.infoBrand,
        hidden: (p: any) =>
            !!(p.infoLogo || p.infoLogoImage || p.logo || p.logoImage),
    },
    infoCopyright: {
        type: ControlType.String,
        title: "Copyright",
        defaultValue: D.infoCopyright,
        displayTextArea: true,
    },

    /* ---- Layout + Style ---- */
    container: obj(
        "Container",
        {
            fill: col("Fill", D.container.fill),
            blur: num("Blur", D.container.blur, 0, 80, 1, "px"),
            radius: num("Radius", D.container.radius, 0, 60, 1, "px"),
            padding: num("Padding", D.container.padding, 0, 40, 1, "px"),
            gap: num("Brand Gap", D.container.gap, 0, 60, 1, "px"),
            panelGap: num("Panel Gap", D.container.panelGap, 0, 40, 1, "px"),
        },
        "The outer glass pill. Brand Gap separates the brand from the menu; Panel Gap separates the link panel from the image panel.",
        "color"
    ),
    brand: obj(
        "Brand Style",
        {
            padding: num("Padding", D.brand.padding, 0, 40, 1, "px"),
            logoHeight: num("Logo Height", D.brand.logoHeight, 4, 120, 1, "px"),
        },
        undefined,
        "object"
    ),
    trigger: obj(
        "Trigger + Panel",
        {
            size: num(
                "Closed Size",
                D.trigger.size,
                16,
                80,
                1,
                "px",
                "Width and height of the button while the menu is closed."
            ),
            radius: num("Radius", D.trigger.radius, 0, 40, 1, "px"),
            iconSize: num("Icon Size", D.trigger.iconSize, 4, 40, 1, "px"),
            iconColor: col("Icon Color", D.trigger.iconColor),
            closedFill: col("Fill: Closed", D.trigger.closedFill),
            hoverFill: col("Fill: Hover", D.trigger.hoverFill),
            openFill: col("Fill: Open", D.trigger.openFill),
            hoverPaddingX: num(
                "Hover Padding X",
                D.trigger.hoverPaddingX,
                0,
                40,
                1,
                "px"
            ),
            labelGap: num(
                "Label Gap",
                D.trigger.labelGap,
                0,
                40,
                1,
                "px",
                "Space between the Menu label and the plus icon."
            ),
            openPaddingTop: num(
                "Open Padding Top",
                D.trigger.openPaddingTop,
                0,
                60,
                1,
                "px"
            ),
            openPaddingRight: num(
                "Open Padding Right",
                D.trigger.openPaddingRight,
                0,
                80,
                1,
                "px"
            ),
            openPaddingBottom: num(
                "Open Padding Bottom",
                D.trigger.openPaddingBottom,
                0,
                60,
                1,
                "px"
            ),
            openPaddingLeft: num(
                "Open Padding Left",
                D.trigger.openPaddingLeft,
                0,
                80,
                1,
                "px"
            ),
            headerToLinks: num(
                "Header to Links",
                D.trigger.headerToLinks,
                0,
                80,
                1,
                "px",
                "Space between the Menu header row and the first link."
            ),
            headerOpacity: num(
                "Header Opacity",
                D.trigger.headerOpacity,
                0,
                1,
                0.05,
                undefined,
                "Opacity of the Menu header row while the menu is open."
            ),
            iconRotateHover: num(
                "Icon Rotate: Hover",
                D.trigger.iconRotateHover,
                -720,
                720,
                5,
                "°"
            ),
            iconRotateOpen: num(
                "Icon Rotate: Open",
                D.trigger.iconRotateOpen,
                -720,
                720,
                5,
                "°"
            ),
        },
        "The Menu button and the panel it grows into: sizes, fills and spacing for the closed, hover and open states.",
        "interaction"
    ),
    list: obj(
        "Link List",
        {
            linkGap: num("Link Gap", D.list.linkGap, 0, 40, 1, "px"),
            groupGap: num(
                "Legal Group Gap",
                D.list.groupGap,
                0,
                100,
                1,
                "px",
                "Space between the main links and the legal links."
            ),
            legalGap: num("Legal Link Gap", D.list.legalGap, 0, 40, 1, "px"),
            dimOpacity: num(
                "Dimmed Opacity",
                D.list.dimOpacity,
                0,
                1,
                0.05,
                undefined,
                "Opacity of the other links while one link is hovered."
            ),
            linkHoverOpacity: num(
                "Hover Opacity",
                D.list.linkHoverOpacity,
                0,
                1,
                0.05
            ),
            legalOpacity: num("Legal Opacity", D.list.legalOpacity, 0, 1, 0.05),
            legalHoverOpacity: num(
                "Legal Hover Opacity",
                D.list.legalHoverOpacity,
                0,
                1,
                0.05
            ),
        },
        undefined,
        "object"
    ),
    side: obj(
        "Side Panel (Knoll Block)",
        {
            enabled: bool(
                "Show Side Panel (Image)",
                D.side.enabled,
                "Turn off to drop the image panel entirely and keep a compact menu."
            ),
            hideBelow: num(
                "Hide Below",
                D.side.hideBelow,
                0,
                1200,
                10,
                "px",
                "Automatically hides the side panel on viewports narrower than this, so the open menu fits phones. Set to 0 to always show it."
            ),
            width: num("Width", D.side.width, 60, 500, 1, "px"),
            radius: num("Radius", D.side.radius, 0, 40, 1, "px"),
            fill: col("Fill", D.side.fill),
            padding: num("Padding", D.side.padding, 0, 60, 1, "px"),
            show: bool("Show Logo + Copyright", D.side.show),
            logoHeight: num("Logo Height", D.side.logoHeight, 4, 200, 1, "px"),
            brandOpacity: num("Logo Opacity", D.side.brandOpacity, 0, 1, 0.05),
            copyrightOpacity: num(
                "Copyright Opacity",
                D.side.copyrightOpacity,
                0,
                1,
                0.05
            ),
        },
        "The panel beside the links: logo and copyright underneath, link image and caption on top.",
        "object"
    ),
    mobile: obj(
        "Mobile Layout",
        {
            below: num(
                "Below",
                D.mobile.below,
                0,
                1200,
                10,
                "px",
                "Viewport width under which the mobile layout applies. 810 matches Framer's Phone breakpoint. Set to 0 to turn the mobile layout off."
            ),
            fillWidth: bool(
                "Fill Screen Width",
                D.mobile.fillWidth,
                "Widen the bar to the screen width when the menu opens. It stays compact while closed and animates back when it closes."
            ),
            margin: {
                ...num(
                    "Side Margin",
                    D.mobile.margin,
                    0,
                    60,
                    1,
                    "px",
                    "Space kept free on each side of the screen when the bar widens. Match it to the offset of the layer holding the menu."
                ),
                hidden: (o: any) => !o.fillWidth,
            },
            linkSize: num("Link Size", D.mobile.linkSize, 8, 96, 1, "px"),
            legalSize: num(
                "Legal Link Size",
                D.mobile.legalSize,
                8,
                64,
                1,
                "px"
            ),
        },
        "How the menu looks on phones: the bar widens to the screen when opened, and link texts are larger.",
        "interaction"
    ),
    preview: obj(
        "Image + Caption",
        {
            captionMode: {
                type: ControlType.Enum,
                title: "Caption Block",
                description:
                    "Fill Image tints the whole image, Full-Width Bar sits along the bottom, Fixed Box is a card in one corner.",
                options: ["fill", "bar", "box"],
                optionTitles: ["Fill Image", "Full-Width Bar", "Fixed Box"],
                defaultValue: D.preview.captionMode,
            },
            captionWidth: {
                ...num(
                    "Caption Width",
                    D.preview.captionWidth,
                    40,
                    500,
                    1,
                    "px"
                ),
                hidden: (o: any) => o.captionMode !== "box",
            },
            captionSide: {
                type: ControlType.Enum,
                title: "Caption Side",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: D.preview.captionSide,
                hidden: (o: any) => o.captionMode !== "box",
            },
            captionFill: col("Caption Fill", D.preview.captionFill),
            captionPaddingX: num(
                "Caption Padding X",
                D.preview.captionPaddingX,
                0,
                40,
                1,
                "px"
            ),
            captionPaddingY: num(
                "Caption Padding Y",
                D.preview.captionPaddingY,
                0,
                40,
                1,
                "px"
            ),
            captionTitleOpacity: num(
                "Caption Title Opacity",
                D.preview.captionTitleOpacity,
                0,
                1,
                0.05
            ),
        },
        undefined,
        "object"
    ),

    /* ---- Typography ---- */
    font: {
        type: ControlType.Font,
        title: "Font",
        description: "Font for links, labels and captions.",
        defaultFontType: "sans-serif",
        defaultValue: D.font as any,
    },
    displayFont: {
        type: ControlType.Font,
        title: "Display Font",
        description: "Font for the large text in the side panel.",
        defaultFontType: "sans-serif",
        defaultValue: D.displayFont as any,
    },
    type: obj(
        "Type Scale",
        {
            textColor: col("Text Color", D.type.textColor),
            size: num("Text Size", D.type.size, 8, 48, 1, "px"),
            lineHeight: num(
                "Line Height",
                D.type.lineHeight,
                0.6,
                2.5,
                0.05,
                "em"
            ),
            letterSpacing: num(
                "Letter Spacing",
                D.type.letterSpacing,
                -0.2,
                0.5,
                0.01,
                "em"
            ),
            legalSize: num("Legal Size", D.type.legalSize, 8, 48, 1, "px"),
            displaySize: num(
                "Display Size",
                D.type.displaySize,
                12,
                200,
                1,
                "px"
            ),
            displayLineHeight: num(
                "Display Line Height",
                D.type.displayLineHeight,
                0.5,
                2.5,
                0.05,
                "em"
            ),
        },
        undefined,
        "object"
    ),

    /* ---- Animation ---- */
    morphTransition: tr(
        "Morph (size, fill, icon)",
        "Spring for the button growing into the panel and the icon turning."
    ),
    fadeTransition: tr(
        "Fade (links, content)",
        "Spring for link dimming and content fading in and out."
    ),
    wipeTransition: tr(
        "Wipe (image curtain)",
        "Spring for the image rising over the side panel and image-to-image wipes."
    ),
    captionTransition: tr(
        "Caption Words",
        "Spring for each caption word as it appears."
    ),
    labelTransition: tr(
        "Menu Label Characters",
        "Spring for each letter of the Menu label."
    ),
    timing: obj(
        "Timing + Offsets",
        {
            introDelay: num(
                "Open Intro Delay",
                D.timing.introDelay,
                0,
                3,
                0.05,
                "s",
                "Pause between the panel opening and the side panel unfolding."
            ),
            closeDelay: num(
                "Close Delay",
                D.timing.closeDelay,
                0,
                3,
                0.05,
                "s",
                "How long the side panel collapses before the menu folds back."
            ),
            leaveDelay: num(
                "Link Leave Delay",
                D.timing.leaveDelay,
                0,
                1,
                0.01,
                "s",
                "Grace period when the pointer moves between two links, so the image does not flicker."
            ),
            captionStart: num(
                "Caption Start Delay",
                D.timing.captionStart,
                0,
                2,
                0.01,
                "s"
            ),
            captionStagger: num(
                "Caption Word Stagger",
                D.timing.captionStagger,
                0,
                0.5,
                0.01,
                "s"
            ),
            captionOffsetY: num(
                "Caption Offset Y",
                D.timing.captionOffsetY,
                -60,
                60,
                1,
                "px"
            ),
            labelStagger: num(
                "Label Char Stagger",
                D.timing.labelStagger,
                0,
                0.5,
                0.01,
                "s"
            ),
            labelOffsetY: num(
                "Label Offset Y",
                D.timing.labelOffsetY,
                -60,
                60,
                1,
                "px"
            ),
            labelRotate: num(
                "Label Rotate",
                D.timing.labelRotate,
                -90,
                90,
                1,
                "°"
            ),
        },
        "Delays, staggers and start offsets. All motion is skipped when the visitor prefers reduced motion.",
        "interaction"
    ),

    /* ---- Behavior ---- */
    behavior: obj(
        "Behavior",
        {
            closeOnNavigate: bool(
                "Close on Link Click",
                D.behavior.closeOnNavigate
            ),
            closeOnEscape: bool("Close on Escape", D.behavior.closeOnEscape),
            closeOnOutsideClick: bool(
                "Close on Outside Click",
                D.behavior.closeOnOutsideClick,
                "Close the menu when the visitor clicks or taps anywhere outside it."
            ),
        },
        undefined,
        "boolean"
    ),

    /* ---- Hooks for code overrides ---- */
    onOpenChange: { type: ControlType.EventHandler },
    closeSignal: {
        type: ControlType.Number,
        title: "Close Signal",
        description:
            "Used by code overrides: closes the menu whenever the number changes.",
        defaultValue: 0,
        hidden: () => true,
    },
})
