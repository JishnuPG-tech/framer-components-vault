// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"

// CTA Kit — ten call-to-action buttons with hover and press micro-interactions, in your own fonts and colours.
// Designed by Miguel Recio · miguelrecio.es
// Documentation: https://miguelrecio-components.framer.website/cta-kit/docs
//
// Network: none. Pure CSS effects; Magnetic and Spotlight read the pointer over the button itself.
// The Glow border only animates while the button is on screen, and every effect calms down for visitors
// who prefer reduced motion.

type Effect = "shine" | "arrow" | "roll" | "fill" | "glow" | "glass" | "press" | "magnetic" | "spotlight" | "link"
type Size = "s" | "m" | "l"
type Shape = "pill" | "rounded" | "square"
type Icon = "none" | "arrow" | "arrowUpRight" | "chevron" | "plus" | "download" | "play"
type IconSide = "right" | "left"

interface Props {
    label: string
    link: string
    newTab: boolean
    effect: Effect
    size: Size
    shape: Shape
    icon: Icon
    iconSide: IconSide
    fullWidth: boolean
    background: string
    textColor: string
    accentColor: string
    accentTextColor: string
    borderColor: string
    font: CSSProperties
    ariaLabel: string
    onTap?: () => void
    style?: CSSProperties
}

const SIZES: Record<Size, { h: number; px: number; gap: number; icon: number }> = {
    s: { h: 40, px: 18, gap: 8, icon: 14 },
    m: { h: 50, px: 24, gap: 10, icon: 16 },
    l: { h: 60, px: 30, gap: 12, icon: 18 },
}

// Links: pages of this site, web addresses, email and phone only. Any other scheme (javascript:, data:, vbscript:, file:…) is dropped
const SAFE_SCHEMES = ["http", "https", "mailto", "tel"]
function safeHref(v: unknown): string {
    const s = typeof v === "string" ? v.trim() : ""
    if (!s) return ""
    // Browsers ignore tabs, line breaks and control characters in a URL, so test without them
    const scheme = s.replace(/[\u0000-\u0020\u007f]+/g, "").match(/^([a-z][a-z0-9+.-]*):/i)
    return scheme && !SAFE_SCHEMES.includes(scheme[1].toLowerCase()) ? "" : s
}

function IconSvg({ icon, size }: { icon: Icon; size: number }) {
    const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true as const, focusable: "false" as const }
    const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    switch (icon) {
        case "arrow":
            return (
                <svg {...common}>
                    <path d="M3 8h10M9 4l4 4-4 4" {...stroke} />
                </svg>
            )
        case "arrowUpRight":
            return (
                <svg {...common}>
                    <path d="M4.5 11.5l7-7M6 4.5h5.5V10" {...stroke} />
                </svg>
            )
        case "chevron":
            return (
                <svg {...common}>
                    <path d="M6 3.5L10.5 8 6 12.5" {...stroke} />
                </svg>
            )
        case "plus":
            return (
                <svg {...common}>
                    <path d="M8 3v10M3 8h10" {...stroke} />
                </svg>
            )
        case "download":
            return (
                <svg {...common}>
                    <path d="M8 2.5v8M4.5 7.5L8 11l3.5-3.5M3 13.5h10" {...stroke} />
                </svg>
            )
        case "play":
            return (
                <svg {...common}>
                    <path d="M5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
                </svg>
            )
        default:
            return null
    }
}

/**
 * CTA Kit
 *
 * Ten call-to-action buttons with hover and press micro-interactions: Shine, Arrow, Roll, Fill, Glow,
 * Glass, Press, Magnetic, Spotlight and Link. Your fonts and colours, a real link or a Tap interaction.
 *
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 50
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function CTAKit(props: Props) {
    const {
        label = "Get started",
        link = "",
        newTab = false,
        effect = "shine",
        size = "m",
        shape = "pill",
        icon = "arrow",
        iconSide = "right",
        fullWidth = false,
        background = "#111111",
        textColor = "#FFFFFF",
        accentColor = "#F2C14E",
        accentTextColor = "#111111",
        borderColor = "rgba(0, 0, 0, 0)",
        font = {},
        ariaLabel = "",
        onTap,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const isCanvas = isStatic && RenderTarget.current() === RenderTarget.canvas
    const cls = `cta${useId().replace(/[^a-zA-Z0-9]/g, "")}`
    const ref = useRef<HTMLElement | null>(null)

    // Glow only spins while the button is on screen
    const [inView, setInView] = useState(true)
    useEffect(() => {
        if (effect !== "glow" || isStatic) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "80px" })
        io.observe(el)
        return () => io.disconnect()
    }, [effect, isStatic])

    // Magnetic and Spotlight follow the pointer over the button itself, written straight to CSS variables
    const tracks = effect === "magnetic" || effect === "spotlight" || effect === "glass"
    const onMove = (e: ReactPointerEvent<HTMLElement>) => {
        if (!tracks || e.pointerType === "touch") return
        const el = e.currentTarget
        const r = el.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        el.style.setProperty("--mx", `${x}px`)
        el.style.setProperty("--my", `${y}px`)
        if (effect === "magnetic") {
            el.style.setProperty("--dx", `${((x / r.width) * 2 - 1) * 6}px`)
            el.style.setProperty("--dy", `${((y / r.height) * 2 - 1) * 5}px`)
        }
    }
    const onLeave = (e: ReactPointerEvent<HTMLElement>) => {
        if (!tracks) return
        const el = e.currentTarget
        el.style.setProperty("--dx", "0px")
        el.style.setProperty("--dy", "0px")
    }

    const z = SIZES[size] || SIZES.m
    const radius = shape === "pill" ? 999 : shape === "rounded" ? 14 : 6
    const href = safeHref(link)
    const isLinkStyle = effect === "link"
    const showIcon = icon !== "none"
    const fontSize = (font as CSSProperties).fontSize

    const css = `
@property --ctaAngle{syntax:'<angle>';inherits:false;initial-value:0deg}
.${cls}{--mx:50%;--my:50%;--dx:0px;--dy:0px;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:${z.gap}px;box-sizing:border-box;height:${isLinkStyle ? "auto" : `${z.h}px`};padding:${isLinkStyle ? "4px 0" : `0 ${z.px}px`};border-radius:${radius}px;border:0;background:${isLinkStyle ? "transparent" : background};color:${textColor};text-decoration:none;cursor:pointer;white-space:nowrap;isolation:isolate;overflow:${effect === "glow" || effect === "magnetic" || isLinkStyle ? "visible" : "hidden"};-webkit-tap-highlight-color:transparent;user-select:none;outline:none;box-shadow:${isLinkStyle ? "none" : `inset 0 0 0 1px ${borderColor}`};transition:transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,background-color .35s ease,color .35s ease;width:${fullWidth ? "100%" : "auto"};font:inherit;line-height:1.1}
.${cls}:focus-visible{outline:2px solid ${accentColor};outline-offset:3px}
.${cls} .lbl,.${cls} .ico{position:relative;z-index:2;display:inline-flex;align-items:center}
.${cls} .ico{flex:none;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.${cls}:active{transform:scale(.97)}

/* Shine: a light sweep crosses the button */
.${cls}.fx-shine::after{content:"";position:absolute;inset:-2px;z-index:1;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.55) 48%,rgba(255,255,255,.15) 56%,transparent 70%);transform:translateX(-130%);transition:transform .8s cubic-bezier(.2,.8,.2,1);pointer-events:none}
@media (hover:hover){.${cls}.fx-shine:hover::after{transform:translateX(130%)}.${cls}.fx-shine:hover .ico{transform:translateX(3px)}}

/* Arrow: the icon leaves and a new one slides in */
.${cls}.fx-arrow .ico{overflow:hidden;width:${z.icon}px;height:${z.icon}px;position:relative}
.${cls}.fx-arrow .ico span{position:absolute;inset:0;display:flex;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.${cls}.fx-arrow .ico span+span{transform:translateX(-120%)}
@media (hover:hover){.${cls}.fx-arrow:hover .ico span:first-child{transform:translateX(120%)}.${cls}.fx-arrow:hover .ico span+span{transform:translateX(0)}.${cls}.fx-arrow:hover{gap:${z.gap + 4}px}}
.${cls}.fx-arrow{transition:gap .45s cubic-bezier(.2,.8,.2,1),transform .5s cubic-bezier(.2,.8,.2,1)}

/* Roll: every letter rolls up to its copy */
.${cls}.fx-roll .ch{display:inline-flex;flex-direction:column;height:1.15em;overflow:hidden;line-height:1.15em}
.${cls}.fx-roll .ch>span{display:block;transition:transform .5s cubic-bezier(.65,0,.35,1);transition-delay:calc(var(--i) * 18ms)}
@media (hover:hover){.${cls}.fx-roll:hover .ch>span{transform:translateY(-100%)}.${cls}.fx-roll:hover .ico{transform:translateX(3px)}}

/* Fill: the accent fills the button from the left */
.${cls}.fx-fill::before{content:"";position:absolute;inset:0;z-index:1;background:${accentColor};transform:scaleX(0);transform-origin:left center;transition:transform .55s cubic-bezier(.65,0,.35,1);border-radius:inherit}
.${cls}.fx-fill:active::before{transform:scaleX(1)}
.${cls}.fx-fill:active{color:${accentTextColor}}
@media (hover:hover){.${cls}.fx-fill:hover::before{transform:scaleX(1)}.${cls}.fx-fill:hover{color:${accentTextColor}}.${cls}.fx-fill:hover .ico{transform:translateX(3px)}}

/* Glow: a light runs around the border */
.${cls}.fx-glow{background:linear-gradient(${background},${background}) padding-box,conic-gradient(from var(--ctaAngle),${borderColor === "rgba(0, 0, 0, 0)" ? "rgba(255,255,255,.08)" : borderColor} 0deg,${accentColor} 60deg,${borderColor === "rgba(0, 0, 0, 0)" ? "rgba(255,255,255,.08)" : borderColor} 120deg) border-box;border:1.5px solid transparent;box-shadow:none;animation:${cls}spin 3.2s linear infinite}
.${cls}.fx-glow[data-off]{animation-play-state:paused}
@keyframes ${cls}spin{to{--ctaAngle:360deg}}
@media (hover:hover){.${cls}.fx-glow:hover{box-shadow:0 0 0 4px color-mix(in srgb,${accentColor} 18%,transparent),0 8px 28px color-mix(in srgb,${accentColor} 35%,transparent)}.${cls}.fx-glow:hover .ico{transform:translateX(3px)}}

/* Glass: frosted, with a highlight that follows the pointer */
.${cls}.fx-glass{background:color-mix(in srgb,${background} 22%,transparent);backdrop-filter:blur(14px) saturate(1.6);-webkit-backdrop-filter:blur(14px) saturate(1.6);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),inset 0 1px 0 rgba(255,255,255,.45),0 8px 24px rgba(0,0,0,.12)}
.${cls}.fx-glass::before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(120px circle at var(--mx) var(--my),rgba(255,255,255,.35),transparent 60%);opacity:0;transition:opacity .35s ease;border-radius:inherit;pointer-events:none}
@media (hover:hover){.${cls}.fx-glass:hover::before{opacity:1}.${cls}.fx-glass:hover .ico{transform:translateX(3px)}}

/* Press: a tactile 3D key */
.${cls}.fx-press{box-shadow:inset 0 0 0 1px ${borderColor},0 5px 0 ${accentColor};transform:translateY(0);margin-bottom:5px}
@media (hover:hover){.${cls}.fx-press:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px ${borderColor},0 6px 0 ${accentColor}}}
.${cls}.fx-press:active{transform:translateY(5px);box-shadow:inset 0 0 0 1px ${borderColor},0 0 0 ${accentColor};transition-duration:.08s}

/* Magnetic: the button leans towards the pointer */
.${cls}.fx-magnetic{transform:translate(var(--dx),var(--dy));transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease}
.${cls}.fx-magnetic .lbl,.${cls}.fx-magnetic .ico{transform:translate(calc(var(--dx) * .5),calc(var(--dy) * .5));transition:transform .35s cubic-bezier(.2,.8,.2,1)}
@media (hover:hover){.${cls}.fx-magnetic:hover{box-shadow:inset 0 0 0 1px ${borderColor},0 10px 26px rgba(0,0,0,.18)}}

/* Spotlight: a soft light under the pointer */
.${cls}.fx-spotlight::before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(140px circle at var(--mx) var(--my),color-mix(in srgb,${accentColor} 55%,transparent),transparent 65%);opacity:0;transition:opacity .35s ease;border-radius:inherit;pointer-events:none}
@media (hover:hover){.${cls}.fx-spotlight:hover::before{opacity:1}.${cls}.fx-spotlight:hover .ico{transform:translateX(3px)}}

/* Link: a text link whose underline redraws */
.${cls}.fx-link .lbl{background:linear-gradient(currentColor,currentColor) left bottom/100% 1.5px no-repeat;padding-bottom:3px;transition:background-size .5s cubic-bezier(.65,0,.35,1)}
@media (hover:hover){.${cls}.fx-link:hover .lbl{animation:${cls}redraw .7s cubic-bezier(.65,0,.35,1)}.${cls}.fx-link:hover{color:${accentColor}}.${cls}.fx-link:hover .ico{transform:translateX(4px)}}
@keyframes ${cls}redraw{0%{background-position:right bottom;background-size:100% 1.5px}45%{background-position:right bottom;background-size:0 1.5px}46%{background-position:left bottom;background-size:0 1.5px}100%{background-position:left bottom;background-size:100% 1.5px}}

@media (prefers-reduced-motion:reduce){
.${cls},.${cls} *,.${cls}::before,.${cls}::after{transition-duration:.01ms !important;animation:none !important}
.${cls}.fx-magnetic,.${cls}.fx-magnetic .lbl,.${cls}.fx-magnetic .ico{transform:none !important}
}`

    // Roll needs each letter twice; screen readers read the label once
    const labelContent =
        effect === "roll" ? (
            <span className="lbl" aria-hidden="true">
                {Array.from(label).map((c, i) => {
                    const ch = c === " " ? "\u00A0" : c
                    return (
                        <span key={i} className="ch" style={{ ["--i" as string]: i } as CSSProperties}>
                            <span>{ch}</span>
                            <span>{ch}</span>
                        </span>
                    )
                })}
            </span>
        ) : (
            <span className="lbl">{label}</span>
        )

    const iconContent = showIcon ? (
        effect === "arrow" ? (
            <span className="ico" aria-hidden="true">
                <span>
                    <IconSvg icon={icon} size={z.icon} />
                </span>
                <span>
                    <IconSvg icon={icon} size={z.icon} />
                </span>
            </span>
        ) : (
            <span className="ico" aria-hidden="true">
                <IconSvg icon={icon} size={z.icon} />
            </span>
        )
    ) : null

    const children = (
        <>
            {showIcon && iconSide === "left" ? iconContent : null}
            {labelContent}
            {showIcon && iconSide === "right" ? iconContent : null}
        </>
    )

    const name = ariaLabel || (effect === "roll" ? label : undefined)
    const common = {
        className: `${cls} fx-${effect}`,
        style: { ...font, ...(fontSize ? {} : { fontSize: size === "s" ? 14 : size === "l" ? 17 : 15 }), ...style, width: fullWidth ? "100%" : style?.width },
        onPointerMove: tracks ? onMove : undefined,
        onPointerLeave: tracks ? onLeave : undefined,
        "aria-label": name,
        "data-off": effect === "glow" && !inView ? "" : undefined,
    }

    // A real link when there's somewhere to go; otherwise a button for Framer's Tap interaction. Never an empty link
    if (href && !isCanvas) {
        const external = /^https?:/i.test(href)
        return (
            <>
            <style>{css}</style>
            <a
                {...common}
                ref={ref as React.Ref<HTMLAnchorElement>}
                href={href}
                target={newTab ? "_blank" : undefined}
                rel={newTab || external ? "noopener" : undefined}
                onClick={onTap ? () => onTap() : undefined}
            >
                {children}
            </a>
            </>
        )
    }
    return (
        <>
            <style>{css}</style>
            <button {...common} ref={ref as React.Ref<HTMLButtonElement>} type="button" onClick={onTap ? () => onTap() : undefined}>
                {children}
            </button>
        </>
    )
}

CTAKit.displayName = "CTA Kit"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyControls: any = {
    label: { type: ControlType.String, title: "Label", defaultValue: "Get started" },
    link: { type: ControlType.Link, title: "Link", description: "A page, a section or a web address. Empty makes it a button for the Tap interaction." },
    newTab: { type: ControlType.Boolean, title: "New tab", defaultValue: false, hidden: (p: Partial<Props>) => !p.link },
    onTap: { type: ControlType.EventHandler, title: "Tap" },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        options: ["shine", "arrow", "roll", "fill", "glow", "glass", "press", "magnetic", "spotlight", "link"],
        optionTitles: ["Shine", "Arrow", "Roll", "Fill", "Glow", "Glass", "Press", "Magnetic", "Spotlight", "Link"],
        defaultValue: "shine",
        description: "Shine sweeps a light across. Arrow swaps the icon. Roll rolls the letters. Fill fills with the accent. Glow runs a light around the border. Glass is frosted, for photos. Press is a 3D key. Magnetic leans to the pointer. Spotlight follows it. Link is a text link.",
    },
    size: { type: ControlType.Enum, title: "Size", options: ["s", "m", "l"], optionTitles: ["S", "M", "L"], defaultValue: "m", displaySegmentedControl: true },
    shape: { type: ControlType.Enum, title: "Shape", options: ["pill", "rounded", "square"], optionTitles: ["Pill", "Rounded", "Square"], defaultValue: "pill", displaySegmentedControl: true, hidden: (p: Partial<Props>) => p.effect === "link" },
    icon: {
        type: ControlType.Enum,
        title: "Icon",
        options: ["none", "arrow", "arrowUpRight", "chevron", "plus", "download", "play"],
        optionTitles: ["None", "Arrow", "Arrow ↗", "Chevron", "Plus", "Download", "Play"],
        defaultValue: "arrow",
    },
    iconSide: { type: ControlType.Enum, title: "Icon side", options: ["right", "left"], optionTitles: ["Right", "Left"], defaultValue: "right", displaySegmentedControl: true, hidden: (p: Partial<Props>) => p.icon === "none" },
    fullWidth: { type: ControlType.Boolean, title: "Full width", defaultValue: false, hidden: (p: Partial<Props>) => p.effect === "link" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#111111", hidden: (p: Partial<Props>) => p.effect === "link" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#F2C14E",
        description: "Fill and Spotlight colour, the Glow light, the Press depth, the Link hover and the focus ring.",
    },
    accentTextColor: { type: ControlType.Color, title: "Accent text", defaultValue: "#111111", hidden: (p: Partial<Props>) => p.effect !== "fill" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(0, 0, 0, 0)", hidden: (p: Partial<Props>) => p.effect === "link" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.1em" },
    },
    ariaLabel: { type: ControlType.String, title: "Screen reader", defaultValue: "", placeholder: "Optional", description: "A longer name for screen readers, like “Get started with Lumbre”. Empty reads the label." },
}
addPropertyControls(CTAKit, anyControls)
