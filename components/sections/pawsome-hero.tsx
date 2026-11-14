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


/*
 * PAWSOME HERO – all in one file. Three components:
 *   PawsomeHero      (default) full hero: photo + navbar + glass card
 *   PawsomeHeroBg    photo + navbar only
 *   PawsomeCard      glass card only (drag it on the canvas over PawsomeHeroBg)
 */

type NavItem = { label: string; link?: string }
type Img = { src: string; srcSet?: string; alt?: string }

type Props = {
    images?: Img[]
    effect: string
    interval: number
    fadeTime: number
    showDots: boolean
    entrance: boolean
    cardZIndex: number
    showSignIn: boolean
    showVisit: boolean
    navStyle: string
    navAlign: string
    linkHover: string
    navBg: string
    navSolid: string
    navBlur: number
    navRadius: number
    navSize: number
    navTextColor: string
    imagePosition: string
    imagePositionTablet: string
    imagePositionMobile: string
    overlay: number
    edgeSpacing: number
    showNav: boolean
    logoText: string
    logoImage?: Img
    navItems: NavItem[]
    signInLabel: string
    signInLink?: string
    visitLabel: string
    visitLink?: string
    line1: string
    line1Highlight: string
    line2: string
    line2Highlight: string
    description: string
    primaryLabel: string
    primaryLink?: string
    secondaryLabel: string
    secondaryLink?: string
    alignX: "left" | "center" | "right"
    alignY: "top" | "center" | "bottom"
    offsetX: number
    offsetY: number
    cardWidth: number
    font: Record<string, any>
    headlineSize: number
    headlineTag: string
    descTag: string
    descSize: number
    textColor: string
    chipColor: string
    chipTextColor: string
    buttonColor: string
    buttonTextColor: string
    cardColor: string
    cardBlur: number
    cardBorder: string
    cardRadius: number
    cardPadding: number
    fallbackFrom: string
    fallbackTo: string
    draggable: boolean
    customCard?: React.ReactNode
}

const PawIcon = () => (
    <svg
        width="1.25em"
        height="1.25em"
        viewBox="0 0 64 64"
        fill="currentColor"
        aria-hidden="true"
    >
        <ellipse cx="14" cy="28" rx="7" ry="9" transform="rotate(-18 14 28)" />
        <ellipse cx="26" cy="15" rx="7" ry="9.5" transform="rotate(-6 26 15)" />
        <ellipse cx="40" cy="15" rx="7" ry="9.5" transform="rotate(6 40 15)" />
        <ellipse cx="52" cy="28" rx="7" ry="9" transform="rotate(18 52 28)" />
        <path d="M32 31c-9 0-17 9-17 16 0 6 5 9 10 9 3 0 5-1 7-1s4 1 7 1c5 0 10-3 10-9 0-7-8-16-17-16z" />
    </svg>
)

const Arrow = () => (
    <svg
        width="1.1em"
        height="1.1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
)

function Btn({
    href,
    className,
    children,
    onClick,
}: {
    href?: string
    className: string
    children: React.ReactNode
    onClick?: () => void
}) {
    return (
        <a
            className={className}
            href={href || undefined}
            role={href ? undefined : "button"}
            tabIndex={0}
            onClick={onClick}
        >
            {children}
        </a>
    )
}

function useWidth(ref: React.RefObject<HTMLElement>) {
    const [w, setW] = useState(1200)
    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => setW(el.offsetWidth || 1200)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    return w
}

// ─────────────────────────────  Background slideshow (shared)  ─────────────────────────────

const slideDefaults = {
    effect: "zoom",
    interval: 5,
    fadeTime: 1.2,
    showDots: true,
}

const slideControls: any = {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 10,
        control: { type: ControlType.ResponsiveImage },
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["fade", "zoom", "slide", "blur"],
        optionTitles: ["Fade", "Zoom (Ken Burns)", "Slide", "Blur Fade"],
        defaultValue: "zoom",
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        min: 2,
        max: 15,
        step: 0.5,
        unit: "s",
        defaultValue: 5,
    },
    fadeTime: {
        type: ControlType.Number,
        title: "Transition",
        min: 0.3,
        max: 3,
        step: 0.1,
        unit: "s",
        defaultValue: 1.2,
    },
    showDots: { type: ControlType.Boolean, title: "Dots", defaultValue: true },
}

function Slides(props: {
    images?: Img[]
    position: string
    effect: string
    interval: number
    fadeTime: number
    showDots: boolean
    edge: string
    from: string
    to: string
}) {
    const {
        images,
        position,
        effect,
        interval,
        fadeTime,
        showDots,
        edge,
        from,
        to,
    } = props
    const list = (images || []).filter((i) => i && i.src)
    const n = list.length
    const [idx, setIdx] = useState(0)
    const [prev, setPrev] = useState(-1)
    const [ready, setReady] = useState(false)
    const idxRef = useRef(0)

    const go = (next: number) => {
        if (next === idxRef.current) return
        setPrev(idxRef.current)
        idxRef.current = next
        setIdx(next)
    }

    useEffect(() => {
        const r = requestAnimationFrame(() => setReady(true))
        return () => cancelAnimationFrame(r)
    }, [])

    useEffect(() => {
        if (n < 2) return
        let canvas = false
        try {
            canvas = RenderTarget.current() === RenderTarget.canvas
        } catch (e) {}
        const reduce =
            typeof window !== "undefined" &&
            !!window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (canvas || reduce) return
        const t = setInterval(
            () => go((idxRef.current + 1) % n),
            Math.max(2, interval) * 1000
        )
        return () => clearInterval(t)
    }, [n, interval])

    const cur = n ? idx % n : 0
    const f = fadeTime

    const css = `
    .sl-wrap{position:absolute;inset:0;overflow:hidden}
    .sl{position:absolute;inset:0;overflow:hidden;opacity:0;transition:opacity ${f}s ease}
    .sl.on,.sl.init{opacity:1}
    .sl img{width:100%;height:100%;object-fit:cover;display:block}
    .sl-fallback{position:absolute;inset:0;background:linear-gradient(160deg,${from},${to})}
    .sl-zoom .sl img{transform:scale(1);transition:transform 0s linear ${f}s}
    .sl-zoom .sl.on img{transform:scale(1.14);transition:transform ${interval + f}s linear}
    .sl-blur .sl img{filter:blur(18px);transform:scale(1.06);transition:filter ${f}s ease,transform ${f}s ease}
    .sl-blur .sl.on img,.sl-blur .sl.init img{filter:blur(0);transform:scale(1)}
    .sl-slide .sl{opacity:1;transform:translateX(100%);transition:none}
    .sl-slide .sl.prev{transform:translateX(-100%);transition:transform ${f}s cubic-bezier(.7,0,.2,1)}
    .sl-slide .sl.on,.sl-slide .sl.init{transform:none;transition:transform ${f}s cubic-bezier(.7,0,.2,1)}
    .sl-dots{position:absolute;z-index:4;left:${edge};bottom:max(20px,3.2cqw);display:flex;gap:10px}
    .sl-dots button{width:10px;height:10px;border-radius:999px;border:0;padding:0;background:rgba(255,255,255,.5);cursor:pointer;transition:width .3s,background .3s}
    .sl-dots button.on{width:28px;background:#fff}
    .sl-dots button:focus-visible{outline:3px solid #fff;outline-offset:3px}
    @media (prefers-reduced-motion:reduce){.sl,.sl img{transition-duration:0s!important;transform:none!important}}
  `

    return (
        <div className={`sl-wrap sl-${effect}`}>
            <style>{css}</style>
            {n === 0 ? (
                <div className="sl-fallback" />
            ) : (
                list.map((img, i) => (
                    <div
                        key={i}
                        className={`sl${i === cur && ready ? " on" : ""}${i === cur && !ready ? " init" : ""}${i === prev && i !== cur ? " prev" : ""}`}
                        aria-hidden={i !== cur}
                    >
                        <img
                            src={img.src}
                            srcSet={img.srcSet}
                            alt={img.alt || ""}
                            style={{ objectPosition: position }}
                        />
                    </div>
                ))
            )}
            {showDots && n > 1 && (
                <div className="sl-dots">
                    {list.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Show image ${i + 1}`}
                            className={i === cur ? "on" : ""}
                            onClick={() => go(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────  Navbar (shared)  ─────────────────────────────

const navDefaults = {
    navStyle: "glass",
    navAlign: "center",
    linkHover: "underline",
    navBg: "rgba(18,22,18,0.30)",
    navSolid: "#14181a",
    navBlur: 18,
    navRadius: 24,
    navSize: 1,
    navTextColor: "#ffffff",
    showSignIn: true,
    showVisit: true,
}

const navControls: any = {
    navStyle: {
        type: ControlType.Enum,
        title: "Nav Style",
        options: ["transparent", "glass", "solid"],
        optionTitles: ["Transparent", "Glass", "Solid"],
        defaultValue: "glass",
    },
    navAlign: {
        type: ControlType.Enum,
        title: "Link Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "center",
    },
    linkHover: {
        type: ControlType.Enum,
        title: "Link Hover",
        options: ["underline", "fade", "pill"],
        optionTitles: ["Underline", "Fade", "Pill"],
        defaultValue: "underline",
    },
    navSize: {
        type: ControlType.Number,
        title: "Nav Size",
        min: 0.7,
        max: 1.4,
        step: 0.05,
        defaultValue: 1,
        description: "Scales the whole navbar up or down",
    },
    navTextColor: {
        type: ControlType.Color,
        title: "Nav Text",
        defaultValue: "#ffffff",
    },
    navBg: {
        type: ControlType.Color,
        title: "Glass Color",
        defaultValue: "rgba(18,22,18,0.30)",
        hidden: (p: any) => p.navStyle !== "glass",
    },
    navBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        min: 0,
        max: 40,
        defaultValue: 18,
        hidden: (p: any) => p.navStyle !== "glass",
    },
    navRadius: {
        type: ControlType.Number,
        title: "Nav Radius",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 24,
        hidden: (p: any) => p.navStyle === "transparent",
    },
    navSolid: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#14181a",
        hidden: (p: any) => p.navStyle !== "solid",
    },
    showSignIn: {
        type: ControlType.Boolean,
        title: "Sign In Btn",
        defaultValue: true,
    },
    showVisit: {
        type: ControlType.Boolean,
        title: "Visit Btn",
        defaultValue: true,
    },
}

type NavProps = {
    w: number
    edge: string
    layer: number
    logoText: string
    logoImage?: Img
    navItems: NavItem[]
    signInLabel: string
    signInLink?: string
    visitLabel: string
    visitLink?: string
    showSignIn: boolean
    showVisit: boolean
    navStyle: string
    navAlign: string
    linkHover: string
    navBg: string
    navSolid: string
    navBlur: number
    navRadius: number
    navSize: number
    navTextColor: string
    buttonColor: string
    buttonTextColor: string
}

function Navbar(p: NavProps) {
    const [open, setOpen] = useState(false)
    const root = useRef<HTMLElement>(null)
    const compact = p.w < 760 // hamburger menu
    const hideSignIn = p.w < 520 // sign in moves into the menu
    const hideVisit = p.w < 400 // visit button moves into the menu on tiny phones

    useEffect(() => {
        if (!compact) setOpen(false)
    }, [compact])

    useEffect(() => {
        if (!open) return
        const down = (e: Event) => {
            if (root.current && !root.current.contains(e.target as Node))
                setOpen(false)
        }
        const key = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", down)
        document.addEventListener("keydown", key)
        return () => {
            document.removeEventListener("pointerdown", down)
            document.removeEventListener("keydown", key)
        }
    }, [open])

    const barBg = p.navStyle === "solid" ? p.navSolid : p.navBg
    const css = `
    .nv{--k:${p.navSize};max-width:100%;position:absolute;top:0;left:0;right:0;z-index:${p.layer};padding:calc(clamp(10px,1.4cqw,20px) * var(--k)) ${p.edge};color:${p.navTextColor}}
    .nv *{box-sizing:border-box}
    .nv-bar{display:grid;min-width:0;align-items:center;column-gap:calc(clamp(10px,1.6cqw,24px) * var(--k))}
    .nv-a-center{grid-template-columns:1fr auto 1fr}
    .nv-a-left,.nv-a-right{grid-template-columns:auto 1fr auto}
    .nv-a-compact{grid-template-columns:minmax(0,1fr) auto}
    .nv-transparent .nv-bar{padding:calc(clamp(2px,.4cqw,6px) * var(--k)) 0}
    .nv-glass .nv-bar,.nv-solid .nv-bar{padding:calc(clamp(6px,.75cqw,10px) * var(--k)) calc(clamp(12px,1.4cqw,20px) * var(--k));border-radius:${p.navRadius}px;background:${barBg};border:1px solid rgba(255,255,255,.24);box-shadow:0 8px 32px rgba(0,0,0,.10)}
    .nv-glass .nv-bar{backdrop-filter:blur(${p.navBlur}px);-webkit-backdrop-filter:blur(${p.navBlur}px)}
    .nv-solid .nv-bar{box-shadow:0 10px 30px rgba(0,0,0,.2)}
    .nv-logo{grid-column:1;justify-self:start;min-width:0;max-width:100%;display:flex;align-items:center;gap:.3em;font-size:calc(clamp(17px,1.6cqw,23px) * var(--k));font-weight:600;letter-spacing:-0.01em;color:inherit;text-decoration:none}
    .nv-logo img{height:1.25em;width:auto;flex:none}
    .nv-logo svg{flex:none}
    .nv-logo-t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .nv-links{grid-column:2;display:flex;gap:calc(clamp(0px,.4cqw,6px) * var(--k))}
    .nv-a-left .nv-links{justify-self:start}
    .nv-a-right .nv-links{justify-self:end}
    .nv-links a{position:relative;color:inherit;text-decoration:none;font-size:calc(clamp(12px,1.05cqw,15px) * var(--k));font-weight:500;padding:.5em .8em;border-radius:999px;transition:opacity .2s,background .25s}
    .nv-h-underline .nv-links a::after{content:"";position:absolute;left:.8em;right:.8em;bottom:.2em;height:2px;border-radius:2px;background:currentColor;transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.2,.7,.2,1)}
    .nv-h-underline .nv-links a:hover::after{transform:scaleX(1)}
    .nv-h-fade .nv-links a:hover{opacity:.6}
    .nv-h-pill .nv-links a:hover{background:rgba(255,255,255,.2)}
    .nv-actions{grid-column:3;justify-self:end;display:flex;align-items:center;gap:calc(clamp(6px,.8cqw,12px) * var(--k))}
    .nv-a-compact .nv-actions{grid-column:2}
    .nv-pill{display:inline-flex;align-items:center;justify-content:center;height:calc(clamp(32px,2.8cqw,40px) * var(--k));padding:0 calc(clamp(14px,1.4cqw,20px) * var(--k));font-size:calc(clamp(12px,1.05cqw,15px) * var(--k));border-radius:999px;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap;transition:transform .2s}
    .nv-glass .nv-pill,.nv-solid .nv-pill{height:calc(clamp(30px,2.5cqw,36px) * var(--k))}
    .nv-pill:hover{transform:translateY(-2px)}
    .nv-solidbtn{background:${p.buttonColor};color:${p.buttonTextColor}}
    .nv-ghost{background:transparent;color:inherit;border:1.5px solid currentColor}
    .nv a:focus-visible,.nv button:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .nv-burger{position:relative;flex:none;width:calc(36px * var(--k));height:calc(36px * var(--k));border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;cursor:pointer;padding:0}
    .nv-burger span{position:absolute;left:28%;right:28%;height:2px;border-radius:2px;background:currentColor;transition:transform .3s,opacity .2s,top .3s}
    .nv-burger span:nth-child(1){top:30%}
    .nv-burger span:nth-child(2){top:calc(50% - 1px)}
    .nv-burger span:nth-child(3){top:calc(70% - 2px)}
    .nv.open .nv-burger span:nth-child(1){top:calc(50% - 1px);transform:rotate(45deg)}
    .nv.open .nv-burger span:nth-child(2){opacity:0}
    .nv.open .nv-burger span:nth-child(3){top:calc(50% - 1px);transform:rotate(-45deg)}
    .nv-panel{position:absolute;top:100%;left:${p.edge};right:${p.edge};margin-top:6px;display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:22px;color:#fff;background:rgba(18,22,16,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.22);
      opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px) scale(.98);transform-origin:top right;transition:opacity .25s,transform .25s,visibility 0s .25s}
    .nv.open .nv-panel{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition:opacity .25s,transform .25s,visibility 0s}
    .nv-panel a.nv-pl{color:#fff;font-size:16px;font-weight:500;text-decoration:none;padding:11px 14px;border-radius:14px;transition:background .2s}
    .nv-panel a.nv-pl:hover{background:rgba(255,255,255,.12)}
    .nv-panel .nv-pill{height:42px;margin-top:4px;font-size:15px}
    @media (prefers-reduced-motion:reduce){.nv *,.nv-panel{transition-duration:0s!important}}
  `

    return (
        <nav
            ref={root}
            className={`nv nv-${p.navStyle} nv-h-${p.linkHover}${open ? " open" : ""}`}
            aria-label="Main"
        >
            <style>{css}</style>
            <div className={`nv-bar nv-a-${compact ? "compact" : p.navAlign}`}>
                <a className="nv-logo" href="#" aria-label={p.logoText}>
                    {p.logoImage?.src ? (
                        <img src={p.logoImage.src} alt="" />
                    ) : (
                        <PawIcon />
                    )}
                    <span className="nv-logo-t">{p.logoText}</span>
                </a>

                {!compact && (
                    <div className="nv-links">
                        {p.navItems.map((item, i) => (
                            <a key={i} href={item.link || "#"}>
                                {item.label}
                            </a>
                        ))}
                    </div>
                )}

                <div className="nv-actions">
                    {p.showSignIn && !hideSignIn && (
                        <Btn className="nv-pill nv-ghost" href={p.signInLink}>
                            {p.signInLabel}
                        </Btn>
                    )}
                    {p.showVisit && !hideVisit && (
                        <Btn className="nv-pill nv-solidbtn" href={p.visitLink}>
                            {p.visitLabel}
                        </Btn>
                    )}
                    {compact && (
                        <button
                            className="nv-burger"
                            aria-label={open ? "Close menu" : "Open menu"}
                            aria-expanded={open}
                            onClick={() => setOpen(!open)}
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    )}
                </div>
            </div>

            {compact && (
                <div className="nv-panel" aria-hidden={!open}>
                    {p.navItems.map((item, i) => (
                        <a
                            key={i}
                            className="nv-pl"
                            href={item.link || "#"}
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </a>
                    ))}
                    {p.showSignIn && hideSignIn && (
                        <Btn
                            className="nv-pill nv-ghost"
                            href={p.signInLink}
                            onClick={() => setOpen(false)}
                        >
                            {p.signInLabel}
                        </Btn>
                    )}
                    {p.showVisit && hideVisit && (
                        <Btn
                            className="nv-pill nv-solidbtn"
                            href={p.visitLink}
                            onClick={() => setOpen(false)}
                        >
                            {p.visitLabel}
                        </Btn>
                    )}
                </div>
            )}
        </nav>
    )
}

const has = (t?: string) => !!(t && t.trim())

const JUSTIFY = {
    top: "flex-start",
    center: "center",
    bottom: "flex-end",
} as const
const ALIGN = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
} as const

/**
 * Pawsome Hero – fully responsive hero with navbar, photo background and a glass card.
 * Move the card with the Align / Move controls, or let visitors drag it (Draggable).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 810
 */
export default function PawsomeHero(props: Props) {
    const {
        images,
        effect,
        interval,
        fadeTime,
        showDots,
        entrance,
        imagePosition,
        imagePositionTablet,
        imagePositionMobile,
        overlay,
        edgeSpacing,
        showNav,
        logoText,
        logoImage,
        navItems,
        signInLabel,
        signInLink,
        visitLabel,
        visitLink,
        line1,
        line1Highlight,
        line2,
        line2Highlight,
        description,
        primaryLabel,
        primaryLink,
        secondaryLabel,
        secondaryLink,
        alignX,
        alignY,
        offsetX,
        offsetY,
        cardWidth,
        font,
        headlineSize,
        headlineTag,
        descTag,
        descSize,
        textColor,
        chipColor,
        chipTextColor,
        buttonColor,
        buttonTextColor,
        cardColor,
        cardBlur,
        cardBorder,
        cardRadius,
        cardPadding,
        fallbackFrom,
        fallbackTo,
        draggable,
        customCard,
        showSignIn,
        showVisit,
        navStyle,
        navAlign,
        linkHover,
        navBg,
        navSolid,
        navBlur,
        navRadius,
        navSize,
        navTextColor,
        cardZIndex,
    } = props

    const ref = useRef<HTMLElement>(null)
    const w = useWidth(ref)
    const innerRef = useRef<HTMLDivElement>(null)
    const iw = useWidth(innerRef)
    const textScale = Math.min(1, Math.max(0.55, iw / 520)) // shrink text on narrow cards

    const stack = w < 640 // card docks full-width at the bottom

    const edge = `max(16px, ${edgeSpacing}cqw)`
    const HTag: any = headlineTag || "h1"
    const DTag: any = descTag || "p"

    const canDrag = draggable && !stack
    const Glass: any = canDrag ? motion.div : "div"
    const glassProps = canDrag
        ? {
              drag: true,
              dragConstraints: ref,
              dragMomentum: false,
              dragElastic: 0,
              whileDrag: { cursor: "grabbing" },
              style: { cursor: "grab", touchAction: "none" },
          }
        : {}

    const css = `
    .pw{position:relative;width:100%;height:100%;overflow:hidden;container-type:inline-size;color:${textColor};box-sizing:border-box}
    .pw *{box-sizing:border-box}
    .pw-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .pw-fallback{position:absolute;inset:0;background:linear-gradient(160deg,${fallbackFrom},${fallbackTo})}
    .pw-shade{position:absolute;inset:0;pointer-events:none;background:${
        stack
            ? `linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,${overlay}) 100%)`
            : `linear-gradient(90deg,rgba(0,0,0,0) 35%,rgba(0,0,0,${overlay}) 100%)`
    }}


    .pw-pill{display:inline-flex;align-items:center;justify-content:center;gap:.6em;border-radius:999px;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap;transition:transform .2s,opacity .2s}
    .pw-pill:hover{transform:translateY(-2px)}
    .pw a:focus-visible,.pw button:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .pw-solid{background:${buttonColor};color:${buttonTextColor}}
    .pw-ghost{background:transparent;color:inherit;border:1.5px solid currentColor}

    .pw-stage{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;
      justify-content:${stack ? "flex-end" : JUSTIFY[alignY]};
      padding:${stack ? `clamp(72px,18cqw,96px) ${edge} max(16px,4cqw)` : `clamp(84px,11cqw,160px) ${edge} max(24px,7cqw)`}}
    .pw-card{position:relative;z-index:${cardZIndex};pointer-events:auto;align-self:${stack ? "stretch" : ALIGN[alignX]};
      width:${stack ? "100%" : `min(100%,max(${cardWidth}%,400px))`};
      transform:${stack ? "none" : `translate(${offsetX}px,${offsetY}px)`}}
    .pw-glass{padding:${cardPadding > 0 ? cardPadding + "px" : "clamp(22px,3.4cqw,56px)"};border-radius:${stack ? Math.min(cardRadius, 36) : cardRadius}px;
      background:${cardColor};border:1px solid ${cardBorder};
      backdrop-filter:blur(${cardBlur}px);-webkit-backdrop-filter:blur(${cardBlur}px)}
    .pw-slot{position:absolute;inset:0;z-index:3}
    .pw-inner{container-type:inline-size${entrance ? ";animation:pwUp .9s .15s cubic-bezier(.2,.7,.2,1) both" : ""}}
    @keyframes pwUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
    .pw-h1{margin:0;font-family:inherit;color:inherit;font-size:${headlineSize}px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;overflow-wrap:anywhere;text-wrap:balance}
    .pw-line{display:block}
    .pw-chip{display:inline-block;max-width:100%;background:${chipColor};color:${chipTextColor};border-radius:.28em;padding:0 .16em;margin-left:.04em}
    .pw-p{margin:4cqw 0 6cqw;font-family:inherit;color:inherit;font-weight:inherit;font-size:${descSize}px;line-height:1.4;max-width:20em;opacity:.92;overflow-wrap:anywhere}
    .pw-cta{display:flex;flex-wrap:wrap;gap:3cqw}
    .pw-p:first-child{margin-top:0}
    .pw-p:last-child{margin-bottom:0}
    .pw-h1+.pw-cta{margin-top:6cqw}
    .pw-cta .pw-pill{height:clamp(44px,10.5cqw,68px);padding:0 clamp(22px,6cqw,40px);font-size:clamp(15px,3.3cqw,22px)}
    @media (prefers-reduced-motion:reduce){.pw-inner{animation:none}.pw-pill,.pw-links a{transition:none}.pw-pill:hover{transform:none}}
  `

    return (
        <section
            ref={ref}
            className="pw"
            style={{ ...font, minHeight: stack ? 640 : 480 }}
        >
            <style>{css}</style>

            <Slides
                images={images}
                position={
                    stack
                        ? imagePositionMobile
                        : w < 1100
                          ? imagePositionTablet
                          : imagePosition
                }
                effect={effect}
                interval={interval}
                fadeTime={fadeTime}
                showDots={showDots && !stack}
                edge={edge}
                from={fallbackFrom}
                to={fallbackTo}
            />
            <div className="pw-shade" />

            {showNav && (
                <Navbar
                    w={w}
                    edge={edge}
                    layer={10}
                    logoText={logoText}
                    logoImage={logoImage}
                    navItems={navItems}
                    signInLabel={signInLabel}
                    signInLink={signInLink}
                    visitLabel={visitLabel}
                    visitLink={visitLink}
                    showSignIn={showSignIn}
                    showVisit={showVisit}
                    navStyle={navStyle}
                    navAlign={navAlign}
                    linkHover={linkHover}
                    navBg={navBg}
                    navSolid={navSolid}
                    navBlur={navBlur}
                    navRadius={navRadius}
                    navSize={navSize}
                    navTextColor={navTextColor}
                    buttonColor={buttonColor}
                    buttonTextColor={buttonTextColor}
                />
            )}

            {customCard ? (
                <div className="pw-slot">
                    {React.Children.map(customCard as any, (child: any) =>
                        React.isValidElement(child)
                            ? React.cloneElement(child as any, {
                                  style: {
                                      ...(child as any).props.style,
                                      width: "100%",
                                      height: "100%",
                                  },
                              })
                            : child
                    )}
                </div>
            ) : (
                <div className="pw-stage">
                    <div className="pw-card">
                        <Glass className="pw-glass" {...glassProps}>
                            <div className="pw-inner" ref={innerRef}>
                                {(has(line1) ||
                                    has(line1Highlight) ||
                                    has(line2) ||
                                    has(line2Highlight)) && (
                                    <HTag
                                        className="pw-h1"
                                        style={{
                                            fontSize: headlineSize * textScale,
                                        }}
                                    >
                                        {(has(line1) ||
                                            has(line1Highlight)) && (
                                            <span className="pw-line">
                                                {has(line1) ? line1 : ""}
                                                {has(line1) &&
                                                has(line1Highlight)
                                                    ? " "
                                                    : ""}
                                                {has(line1Highlight) && (
                                                    <span className="pw-chip">
                                                        {line1Highlight}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        {(has(line2) ||
                                            has(line2Highlight)) && (
                                            <span className="pw-line">
                                                {has(line2) ? line2 : ""}
                                                {has(line2) &&
                                                has(line2Highlight)
                                                    ? " "
                                                    : ""}
                                                {has(line2Highlight) && (
                                                    <span className="pw-chip">
                                                        {line2Highlight}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                    </HTag>
                                )}
                                {has(description) && (
                                    <DTag
                                        className="pw-p"
                                        style={{
                                            fontSize:
                                                descSize *
                                                (0.75 + 0.25 * textScale),
                                        }}
                                    >
                                        {description}
                                    </DTag>
                                )}
                                {(has(primaryLabel) || has(secondaryLabel)) && (
                                    <div className="pw-cta">
                                        {has(primaryLabel) && (
                                            <Btn
                                                className="pw-pill pw-solid"
                                                href={primaryLink}
                                            >
                                                {primaryLabel}
                                                <Arrow />
                                            </Btn>
                                        )}
                                        {has(secondaryLabel) && (
                                            <Btn
                                                className="pw-pill pw-ghost"
                                                href={secondaryLink}
                                            >
                                                {secondaryLabel}
                                            </Btn>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Glass>
                    </div>
                </div>
            )}
        </section>
    )
}

PawsomeHero.defaultProps = {
    imagePosition: "25% 50%",
    imagePositionTablet: "50% 50%",
    imagePositionMobile: "35% 30%",
    overlay: 0.2,
    edgeSpacing: 5.5,
    showNav: true,
    logoText: "Pawsome",
    navItems: [
        { label: "Home", link: "#" },
        { label: "Services", link: "#services" },
        { label: "About", link: "#about" },
        { label: "Blog", link: "#blog" },
    ],
    signInLabel: "Sign In",
    visitLabel: "Book a Visit",
    line1: "Happy",
    line1Highlight: "Pets,",
    line2: "Happier",
    line2Highlight: "Lives.",
    description: "A calm and trusted space for your furry friends.",
    primaryLabel: "Our Services",
    secondaryLabel: "Meet Us",
    alignX: "right",
    alignY: "bottom",
    offsetX: 0,
    offsetY: 0,
    cardWidth: 48,
    headlineSize: 64,
    headlineTag: "h1",
    descTag: "p",
    descSize: 22,
    textColor: "#ffffff",
    chipColor: "rgba(20,24,16,0.88)",
    chipTextColor: "#ffffff",
    buttonColor: "#ffffff",
    buttonTextColor: "#111111",
    cardColor: "rgba(255,255,255,0.10)",
    cardBlur: 14,
    cardBorder: "rgba(255,255,255,0.35)",
    cardRadius: 56,
    cardPadding: 0,
    fallbackFrom: "#4f7fa8",
    fallbackTo: "#5c7a2e",
    draggable: true,
    entrance: true,
    cardZIndex: 2,
    ...slideDefaults,
    ...navDefaults,
}

addPropertyControls(PawsomeHero, {
    ...slideControls,
    imagePosition: {
        type: ControlType.String,
        title: "Focus",
        defaultValue: "25% 50%",
        description: "Image focus on desktop/tablet (CSS object-position)",
    },
    imagePositionTablet: {
        type: ControlType.String,
        title: "Focus Tablet",
        defaultValue: "50% 50%",
        description: "Image focus under 1100px wide. 50% 50% = centered",
    },
    imagePositionMobile: {
        type: ControlType.String,
        title: "Focus Mobile",
        defaultValue: "35% 30%",
        description: "Image focus when the card is stacked at the bottom",
    },
    overlay: {
        type: ControlType.Number,
        title: "Shade",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.2,
    },
    edgeSpacing: {
        type: ControlType.Number,
        title: "Edge Space",
        min: 2,
        max: 12,
        step: 0.5,
        unit: "%",
        defaultValue: 5.5,
    },

    alignX: {
        type: ControlType.Enum,
        title: "Card Align X",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "right",
    },
    alignY: {
        type: ControlType.Enum,
        title: "Card Align Y",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
    },
    cardZIndex: {
        type: ControlType.Number,
        title: "Card Z Index",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 2,
        description:
            "Navbar sits at layer 10. Set above 10 to put the card in front of the navbar.",
    },
    offsetX: {
        type: ControlType.Number,
        title: "Card Move X",
        min: -600,
        max: 600,
        step: 2,
        unit: "px",
        defaultValue: 0,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Card Move Y",
        min: -400,
        max: 400,
        step: 2,
        unit: "px",
        defaultValue: 0,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 30,
        max: 90,
        step: 1,
        unit: "%",
        defaultValue: 48,
    },

    entrance: {
        type: ControlType.Boolean,
        title: "Card Intro",
        defaultValue: true,
        description: "Card fades up when the page loads",
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: true,
        description:
            "Drag the card anywhere inside the hero (works in Preview and on the live site)",
    },

    showNav: { type: ControlType.Boolean, title: "Navbar", defaultValue: true },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Pawsome",
        hidden: (p: Props) => !p.showNav,
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo Image",
        hidden: (p: Props) => !p.showNav,
    },
    navItems: {
        type: ControlType.Array,
        title: "Nav Links",
        hidden: (p: Props) => !p.showNav,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Link" },
                link: { type: ControlType.Link },
            },
        },
    },
    signInLabel: {
        type: ControlType.String,
        title: "Sign In",
        hidden: (p: Props) => !p.showNav,
    },
    signInLink: {
        type: ControlType.Link,
        title: "Sign In Link",
        hidden: (p: Props) => !p.showNav,
    },
    visitLabel: {
        type: ControlType.String,
        title: "Visit Button",
        hidden: (p: Props) => !p.showNav,
    },
    visitLink: {
        type: ControlType.Link,
        title: "Visit Link",
        hidden: (p: Props) => !p.showNav,
    },

    ...navControls,

    line1: { type: ControlType.String, title: "Line 1" },
    line1Highlight: { type: ControlType.String, title: "Line 1 Chip" },
    line2: { type: ControlType.String, title: "Line 2" },
    line2Highlight: { type: ControlType.String, title: "Line 2 Chip" },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    primaryLabel: { type: ControlType.String, title: "Primary CTA" },
    primaryLink: { type: ControlType.Link, title: "Primary Link" },
    secondaryLabel: { type: ControlType.String, title: "Secondary CTA" },
    secondaryLink: { type: ControlType.Link, title: "Secondary Link" },

    font: {
        // @ts-ignore Framer font control
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    headlineSize: {
        type: ControlType.Number,
        title: "Headline Size",
        min: 14,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 64,
        description:
            "Size on a full-width card. Shrinks automatically on narrow cards.",
    },
    headlineTag: {
        type: ControlType.Enum,
        title: "Headline Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph", "Div"],
        defaultValue: "h1",
        description: "Use one H1 per page for SEO",
    },
    descTag: {
        type: ControlType.Enum,
        title: "Text Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div"],
        optionTitles: ["Paragraph", "H1", "H2", "H3", "H4", "H5", "H6", "Div"],
        defaultValue: "p",
    },
    descSize: {
        type: ControlType.Number,
        title: "Text Size",
        min: 10,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 22,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    chipColor: {
        type: ControlType.Color,
        title: "Chip BG",
        defaultValue: "rgba(20,24,16,0.88)",
    },
    chipTextColor: {
        type: ControlType.Color,
        title: "Chip Text",
        defaultValue: "#ffffff",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#ffffff",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#111111",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(255,255,255,0.10)",
    },
    cardBorder: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255,255,255,0.35)",
    },
    cardBlur: {
        type: ControlType.Number,
        title: "Card Blur",
        min: 0,
        max: 40,
        defaultValue: 14,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 100,
        defaultValue: 56,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 0,
        description: "0 = automatic (scales with the card)",
    },
    fallbackFrom: {
        type: ControlType.Color,
        title: "Fallback A",
        defaultValue: "#4f7fa8",
    },
    fallbackTo: {
        type: ControlType.Color,
        title: "Fallback B",
        defaultValue: "#5c7a2e",
    },
})

// ─────────────────────────────  PawsomeHeroBg  ─────────────────────────────

type BgProps = {
    images?: Img[]
    effect: string
    interval: number
    fadeTime: number
    showDots: boolean
    showSignIn: boolean
    showVisit: boolean
    navStyle: string
    navAlign: string
    linkHover: string
    navBg: string
    navSolid: string
    navBlur: number
    navRadius: number
    navSize: number
    navTextColor: string
    imagePosition: string
    imagePositionTablet: string
    imagePositionMobile: string
    overlay: number
    edgeSpacing: number
    logoText: string
    logoImage?: Img
    navItems: NavItem[]
    signInLabel: string
    signInLink?: string
    visitLabel: string
    visitLink?: string
    font: Record<string, any>
    textColor: string
    buttonColor: string
    buttonTextColor: string
    fallbackFrom: string
    fallbackTo: string
}

/**
 * Pawsome Hero Background – photo + responsive navbar.
 * Place "Pawsome Card" on top of it and drag it wherever you like.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 810
 */
export function PawsomeHeroBg(p: BgProps) {
    const ref = useRef<HTMLElement>(null)
    const [w, setW] = useState(1200)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const update = () => setW(el.offsetWidth || 1200)
        update()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const edge = `max(16px, ${p.edgeSpacing}cqw)`

    const css = `
    .pb{position:relative;width:100%;height:100%;overflow:hidden;container-type:inline-size;color:${p.textColor};box-sizing:border-box}
    .pb *{box-sizing:border-box}
    .pb-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${p.imagePosition}}
    .pb-fallback{position:absolute;inset:0;background:linear-gradient(160deg,${p.fallbackFrom},${p.fallbackTo})}
    .pb-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,0) 35%,rgba(0,0,0,${p.overlay}) 100%)}
    .pb-pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap;transition:transform .2s}
    .pb-pill:hover{transform:translateY(-2px)}
    .pb a:focus-visible,.pb button:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .pb-solid{background:${p.buttonColor};color:${p.buttonTextColor}}
    .pb-ghost{background:transparent;color:inherit;border:1.5px solid currentColor}
    @media (prefers-reduced-motion:reduce){.pb-pill,.pb-links a{transition:none}.pb-pill:hover{transform:none}}
  `
    return (
        <section ref={ref} className="pb" style={{ ...p.font }}>
            <style>{css}</style>
            <Slides
                images={p.images}
                position={
                    w < 640
                        ? p.imagePositionMobile
                        : w < 1100
                          ? p.imagePositionTablet
                          : p.imagePosition
                }
                effect={p.effect}
                interval={p.interval}
                fadeTime={p.fadeTime}
                showDots={p.showDots && w >= 640}
                edge={edge}
                from={p.fallbackFrom}
                to={p.fallbackTo}
            />
            <div className="pb-shade" />
            <Navbar
                w={w}
                edge={edge}
                layer={10}
                logoText={p.logoText}
                logoImage={p.logoImage}
                navItems={p.navItems}
                signInLabel={p.signInLabel}
                signInLink={p.signInLink}
                visitLabel={p.visitLabel}
                visitLink={p.visitLink}
                showSignIn={p.showSignIn}
                showVisit={p.showVisit}
                navStyle={p.navStyle}
                navAlign={p.navAlign}
                linkHover={p.linkHover}
                navBg={p.navBg}
                navSolid={p.navSolid}
                navBlur={p.navBlur}
                navRadius={p.navRadius}
                navSize={p.navSize}
                navTextColor={p.navTextColor}
                buttonColor={p.buttonColor}
                buttonTextColor={p.buttonTextColor}
            />
        </section>
    )
}

PawsomeHeroBg.defaultProps = {
    imagePositionTablet: "50% 50%",
    imagePositionMobile: "35% 30%",
    imagePosition: "25% 50%",
    overlay: 0.2,
    edgeSpacing: 5.5,
    logoText: "Pawsome",
    navItems: [
        { label: "Home", link: "#" },
        { label: "Services", link: "#services" },
        { label: "About", link: "#about" },
        { label: "Blog", link: "#blog" },
    ],
    signInLabel: "Sign In",
    visitLabel: "Book a Visit",
    textColor: "#ffffff",
    buttonColor: "#ffffff",
    buttonTextColor: "#111111",
    fallbackFrom: "#4f7fa8",
    fallbackTo: "#5c7a2e",
    ...slideDefaults,
    ...navDefaults,
}

addPropertyControls(PawsomeHeroBg, {
    ...slideControls,
    imagePosition: {
        type: ControlType.String,
        title: "Focus",
        defaultValue: "25% 50%",
        description: "Image focus on desktop",
    },
    imagePositionTablet: {
        type: ControlType.String,
        title: "Focus Tablet",
        defaultValue: "50% 50%",
        description: "Image focus under 1100px wide. 50% 50% = centered",
    },
    imagePositionMobile: {
        type: ControlType.String,
        title: "Focus Mobile",
        defaultValue: "35% 30%",
    },
    overlay: {
        type: ControlType.Number,
        title: "Shade",
        min: 0,
        max: 0.8,
        step: 0.05,
        defaultValue: 0.2,
    },
    edgeSpacing: {
        type: ControlType.Number,
        title: "Edge Space",
        min: 2,
        max: 12,
        step: 0.5,
        unit: "%",
        defaultValue: 5.5,
    },
    logoText: {
        type: ControlType.String,
        title: "Logo Text",
        defaultValue: "Pawsome",
    },
    logoImage: { type: ControlType.ResponsiveImage, title: "Logo Image" },
    navItems: {
        type: ControlType.Array,
        title: "Nav Links",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, defaultValue: "Link" },
                link: { type: ControlType.Link },
            },
        },
    },
    signInLabel: { type: ControlType.String, title: "Sign In" },
    signInLink: { type: ControlType.Link, title: "Sign In Link" },
    visitLabel: { type: ControlType.String, title: "Visit Button" },
    visitLink: { type: ControlType.Link, title: "Visit Link" },
    ...navControls,
    font: {
        // @ts-ignore Framer font control
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#ffffff",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#111111",
    },
    fallbackFrom: {
        type: ControlType.Color,
        title: "Fallback A",
        defaultValue: "#4f7fa8",
    },
    fallbackTo: {
        type: ControlType.Color,
        title: "Fallback B",
        defaultValue: "#5c7a2e",
    },
})

// ─────────────────────────────  PawsomeCard  ─────────────────────────────

type CardProps = {
    line1: string
    line1Highlight: string
    line2: string
    line2Highlight: string
    description: string
    primaryLabel: string
    primaryLink?: string
    secondaryLabel: string
    secondaryLink?: string
    font: Record<string, any>
    headlineSize: number
    headlineTag: string
    descTag: string
    descSize: number
    textColor: string
    chipColor: string
    chipTextColor: string
    buttonColor: string
    buttonTextColor: string
    cardColor: string
    cardBlur: number
    cardBorder: string
    cardRadius: number
    cardPadding: number
    zIndex: number
    draggable: boolean
}

/**
 * Pawsome Card – the glass headline card as a standalone layer.
 * Drag it anywhere on the Framer canvas, and optionally let visitors drag it live.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 420
 */
export function PawsomeCard(p: CardProps) {
    const HTag: any = p.headlineTag || "h1"
    const DTag: any = p.descTag || "p"
    const cardRef = useRef<HTMLDivElement>(null)
    const cw = useWidth(cardRef)
    const textScale = Math.min(1, Math.max(0.55, cw / 640)) // shrink text on narrow cards
    const css = `
    .pc{position:relative;z-index:${p.zIndex};width:100%;container-type:inline-size;color:${p.textColor};box-sizing:border-box;border-radius:${p.cardRadius}px;background:${p.cardColor};border:1px solid ${p.cardBorder};backdrop-filter:blur(${p.cardBlur}px);-webkit-backdrop-filter:blur(${p.cardBlur}px)}
    .pc *{box-sizing:border-box}
    .pc-in{padding:${p.cardPadding > 0 ? p.cardPadding + "px" : "clamp(20px,6cqw,56px)"}}
    .pc-h1{margin:0;font-family:inherit;color:inherit;font-size:${p.headlineSize}px;line-height:1.15;font-weight:700;letter-spacing:-0.02em;overflow-wrap:anywhere;text-wrap:balance}
    .pc-line{display:block}
    .pc-chip{display:inline-block;max-width:100%;background:${p.chipColor};color:${p.chipTextColor};border-radius:.28em;padding:0 .16em;margin-left:.04em}
    .pc-p{margin:3.5cqw 0 5.5cqw;font-family:inherit;color:inherit;font-weight:inherit;font-size:${p.descSize}px;line-height:1.4;max-width:20em;opacity:.92;overflow-wrap:anywhere}
    .pc-cta{display:flex;flex-wrap:wrap;gap:2.6cqw}
    .pc-p:first-child{margin-top:0}
    .pc-p:last-child{margin-bottom:0}
    .pc-h1+.pc-cta{margin-top:5.5cqw}
    .pc-btn{display:inline-flex;align-items:center;justify-content:center;gap:.6em;height:clamp(42px,9.2cqw,68px);padding:0 clamp(20px,5.3cqw,40px);font-size:clamp(14px,2.9cqw,22px);border-radius:999px;font-weight:600;text-decoration:none;cursor:pointer;white-space:nowrap;transition:transform .2s}
    .pc-btn:hover{transform:translateY(-2px)}
    .pc-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
    .pc-solid{background:${p.buttonColor};color:${p.buttonTextColor}}
    .pc-ghost{background:transparent;color:inherit;border:1.5px solid currentColor}
    @media (prefers-reduced-motion:reduce){.pc-btn{transition:none}.pc-btn:hover{transform:none}}
  `
    const Root: any = p.draggable ? motion.div : "div"
    const rootProps = p.draggable
        ? {
              drag: true,
              dragMomentum: false,
              dragElastic: 0,
              whileDrag: { cursor: "grabbing" },
          }
        : {}
    return (
        <Root
            ref={cardRef}
            className="pc"
            {...rootProps}
            style={{
                ...p.font,
                ...(p.draggable ? { cursor: "grab", touchAction: "none" } : {}),
            }}
        >
            <style>{css}</style>
            <div className="pc-in">
                {(has(p.line1) ||
                    has(p.line1Highlight) ||
                    has(p.line2) ||
                    has(p.line2Highlight)) && (
                    <HTag
                        className="pc-h1"
                        style={{ fontSize: p.headlineSize * textScale }}
                    >
                        {(has(p.line1) || has(p.line1Highlight)) && (
                            <span className="pc-line">
                                {has(p.line1) ? p.line1 : ""}
                                {has(p.line1) && has(p.line1Highlight)
                                    ? " "
                                    : ""}
                                {has(p.line1Highlight) && (
                                    <span className="pc-chip">
                                        {p.line1Highlight}
                                    </span>
                                )}
                            </span>
                        )}
                        {(has(p.line2) || has(p.line2Highlight)) && (
                            <span className="pc-line">
                                {has(p.line2) ? p.line2 : ""}
                                {has(p.line2) && has(p.line2Highlight)
                                    ? " "
                                    : ""}
                                {has(p.line2Highlight) && (
                                    <span className="pc-chip">
                                        {p.line2Highlight}
                                    </span>
                                )}
                            </span>
                        )}
                    </HTag>
                )}
                {has(p.description) && (
                    <DTag
                        className="pc-p"
                        style={{
                            fontSize: p.descSize * (0.75 + 0.25 * textScale),
                        }}
                    >
                        {p.description}
                    </DTag>
                )}
                {(has(p.primaryLabel) || has(p.secondaryLabel)) && (
                    <div className="pc-cta">
                        {has(p.primaryLabel) && (
                            <a
                                className="pc-btn pc-solid"
                                href={p.primaryLink || undefined}
                                role={p.primaryLink ? undefined : "button"}
                                tabIndex={0}
                            >
                                {p.primaryLabel}
                                <Arrow />
                            </a>
                        )}
                        {has(p.secondaryLabel) && (
                            <a
                                className="pc-btn pc-ghost"
                                href={p.secondaryLink || undefined}
                                role={p.secondaryLink ? undefined : "button"}
                                tabIndex={0}
                            >
                                {p.secondaryLabel}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </Root>
    )
}

PawsomeCard.defaultProps = {
    line1: "Happy",
    line1Highlight: "Pets,",
    line2: "Happier",
    line2Highlight: "Lives.",
    description: "A calm and trusted space for your furry friends.",
    primaryLabel: "Our Services",
    secondaryLabel: "Meet Us",
    headlineSize: 64,
    headlineTag: "h1",
    descTag: "p",
    descSize: 22,
    textColor: "#ffffff",
    chipColor: "rgba(20,24,16,0.88)",
    chipTextColor: "#ffffff",
    buttonColor: "#ffffff",
    buttonTextColor: "#111111",
    cardColor: "rgba(255,255,255,0.10)",
    cardBlur: 14,
    cardBorder: "rgba(255,255,255,0.35)",
    cardRadius: 56,
    cardPadding: 0,
    zIndex: 2,
    draggable: false,
}

addPropertyControls(PawsomeCard, {
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: false,
        description: "Visitors can drag the card in Preview / live site",
    },
    line1: { type: ControlType.String, title: "Line 1" },
    line1Highlight: { type: ControlType.String, title: "Line 1 Chip" },
    line2: { type: ControlType.String, title: "Line 2" },
    line2Highlight: { type: ControlType.String, title: "Line 2 Chip" },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
    },
    primaryLabel: { type: ControlType.String, title: "Primary CTA" },
    primaryLink: { type: ControlType.Link, title: "Primary Link" },
    secondaryLabel: { type: ControlType.String, title: "Secondary CTA" },
    secondaryLink: { type: ControlType.Link, title: "Secondary Link" },
    font: {
        // @ts-ignore Framer font control
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    headlineSize: {
        type: ControlType.Number,
        title: "Headline Size",
        min: 14,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 64,
        description:
            "Size on a full-width card. Shrinks automatically on narrow cards.",
    },
    headlineTag: {
        type: ControlType.Enum,
        title: "Headline Tag",
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div"],
        optionTitles: ["H1", "H2", "H3", "H4", "H5", "H6", "Paragraph", "Div"],
        defaultValue: "h1",
        description: "Use one H1 per page for SEO",
    },
    descTag: {
        type: ControlType.Enum,
        title: "Text Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "div"],
        optionTitles: ["Paragraph", "H1", "H2", "H3", "H4", "H5", "H6", "Div"],
        defaultValue: "p",
    },
    descSize: {
        type: ControlType.Number,
        title: "Text Size",
        min: 10,
        max: 60,
        step: 1,
        unit: "px",
        defaultValue: 22,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#ffffff",
    },
    chipColor: {
        type: ControlType.Color,
        title: "Chip BG",
        defaultValue: "rgba(20,24,16,0.88)",
    },
    chipTextColor: {
        type: ControlType.Color,
        title: "Chip Text",
        defaultValue: "#ffffff",
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Button BG",
        defaultValue: "#ffffff",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#111111",
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(255,255,255,0.10)",
    },
    cardBorder: {
        type: ControlType.Color,
        title: "Card Border",
        defaultValue: "rgba(255,255,255,0.35)",
    },
    cardBlur: {
        type: ControlType.Number,
        title: "Card Blur",
        min: 0,
        max: 40,
        defaultValue: 14,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        min: 0,
        max: 100,
        defaultValue: 56,
    },
    cardPadding: {
        type: ControlType.Number,
        title: "Card Padding",
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 0,
        description: "0 = automatic (scales with the card)",
    },
    zIndex: {
        type: ControlType.Number,
        title: "Card Z Index",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 2,
    },
})
