import { useEffect, useRef, useMemo, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

type ButtonStyle = "filled" | "outline" | "ghost"
type TextTransform = "none" | "capitalize" | "uppercase" | "lowercase"

const svg = (children: JSX.Element) => <svg viewBox="0 0 24 24">{children}</svg>

const ICONS: Record<string, JSX.Element> = {
    strategy: svg(
        <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </>
    ),
    design: svg(
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
        </>
    ),
    build: svg(
        <>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </>
    ),
    rocket: svg(
        <>
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </>
    ),
    globe: svg(
        <>
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
    ),
    chart: svg(
        <>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </>
    ),
    camera: svg(
        <>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </>
    ),
    pen: svg(
        <>
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
        </>
    ),
    code: svg(
        <>
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </>
    ),
    heart: svg(
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    star: svg(
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    bolt: svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
    shield: svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
    layers: svg(
        <>
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
        </>
    ),
    box: svg(
        <>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </>
    ),
    users: svg(
        <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    briefcase: svg(
        <>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </>
    ),
    lightbulb: svg(
        <>
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
        </>
    ),
    target: svg(
        <>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </>
    ),
    zap: svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
}

const ARROW_SVG = svg(<polyline points="9 18 15 12 9 6" />)

const BUTTON_ARROW_SVG = (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)

const badgeSvg = (children: JSX.Element, stroke = false) => (
    <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill={stroke ? "none" : "currentColor"}
        stroke={stroke ? "currentColor" : undefined}
        strokeWidth={stroke ? 3 : undefined}
    >
        {children}
    </svg>
)

const BADGE_ICONS: Record<string, JSX.Element> = {
    star: badgeSvg(
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    ),
    check: badgeSvg(<polyline points="20 6 9 17 4 12" />, true),
    fire: badgeSvg(
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
    ),
    heart: badgeSvg(
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    ),
    zap: badgeSvg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
    crown: badgeSvg(
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
    ),
    award: badgeSvg(
        <>
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </>
    ),
}

const ICON_KEYS = Object.keys(ICONS)

/** Public input model for a single card. */
export interface FlipCardInput {
    id?: string
    title?: string
    description?: string
    introTextColor?: string
    introTextPlacement?: "front" | "back" | "both" | "none"
    services?: string[]
    frontLayout?: "standard" | "image-first" | "badge-prominent"
    price?: PriceSettings
    featured?: FeaturedSettings
    icon?: IconSettings
    serviceIcon?: ServiceIconSettings
    image?: ImageSettings
    button?: ButtonSettings
    labels?: LabelSettings
    theme?: ThemeSettings
}

export interface PriceSettings {
    show?: boolean
    monthly?: string
    yearly?: string
    label?: string
    period?: string
    toggle?: boolean
}
export interface FeaturedSettings {
    enabled?: boolean
    text?: string
    position?: "top-center" | "top-right"
    icon?: string
    style?: "filled" | "outline" | "ghost"
    radius?: number
    shadow?: boolean
    uppercase?: boolean
    animation?: "none" | "pulse" | "bounce"
    color?: string
    textColor?: string
}
export interface IconSettings {
    type?: string
    size?: number
    shape?: "none" | "circle" | "square"
    shapeBg?: string
    color?: string
    file?: string
    svg?: string
}
export interface ServiceIconSettings {
    type?: "dot" | "check" | "arrow" | "star" | "custom" | "none"
    size?: number
    shape?: "none" | "circle" | "square"
    color?: string
    file?: string
    svg?: string
}
export interface ImageSettings {
    src?: string
    showOn?: "none" | "front" | "back" | "both"
    darken?: number
    overlay?: string
}
export interface ButtonSettings {
    label?: string
    link?: string
    style?: ButtonStyle
    uppercase?: boolean
    radius?: number
    color?: string
    textColor?: string
}
export interface LabelSettings {
    preview?: string
    front?: string
    back?: string
}
export interface ThemeSettings {
    front?: "light" | "dark" | "custom"
    frontBg?: string
    frontText?: string
    back?: "light" | "dark" | "custom"
    backBg?: string
    backText?: string
}
export interface MotionSettings {
    flipDuration?: number
    staggerDelay?: number
    featuredLiftEnabled?: boolean
    featuredLift?: number
    scrub?: number
}

/** Sanitizes user-entered SVG before it reaches dangerouslySetInnerHTML. */
function sanitizeSvgMarkup(markup: string): string {
    if (!markup?.trim()) return ""
    const parser = new DOMParser()
    const doc = parser.parseFromString(markup, "image/svg+xml")
    if (doc.querySelector("parsererror")) return ""
    const root = doc.documentElement
    if (root?.tagName.toLowerCase() !== "svg") return ""
    const blocked =
        /^(script|iframe|object|embed|foreignobject|link|meta|style)$/i
    const unsafeAttr =
        /^(on[a-z]+|href|xlink:href|src|action|formaction|poster)$/i
    doc.querySelectorAll("*").forEach((node) => {
        if (blocked.test(node.tagName)) {
            node.remove()
            return
        }
        Array.from(node.attributes).forEach((attr) => {
            const value = attr.value.trim().toLowerCase()
            if (
                unsafeAttr.test(attr.name) ||
                value.startsWith("javascript:") ||
                value.startsWith("data:text/html")
            ) {
                node.removeAttribute(attr.name)
            }
        })
    })
    return new XMLSerializer().serializeToString(root)
}

export interface ProcessedCard {
    id: string
    autoNumber: string
    title: string
    description: string
    introTextColor?: string
    introTextPlacement: "front" | "back" | "both" | "none"
    services: string[]
    frontLayout: string
    showPrice: boolean
    monthlyPrice: string
    yearlyPrice: string
    priceLabel: string
    pricePeriodLabel: string
    showBillingToggle: boolean
    isFeatured: boolean
    featuredBadge: string
    badgePosition: "top-center" | "top-right"
    badgeIcon: string
    badgeStyle: string
    badgeBorderRadius: number
    badgeEnableShadow: boolean
    badgeUppercase: boolean
    badgeAnimation: string
    badgeBgColor?: string
    badgeTextColor?: string
    icon: string
    iconSize: number
    iconShape: string
    iconShapeBg: string
    iconColor?: string
    customIconFile: string
    customIconCode: string
    serviceIconType: string
    serviceIconSize: number
    serviceIconShape: string
    serviceIconColor?: string
    serviceIconFile: string
    serviceIconCode: string
    cardImage: string
    imageBackgroundFace: string
    imageOverlayOpacity: number
    imageOverlayColor?: string
    buttonText: string
    buttonLink: string
    buttonStyle: ButtonStyle
    buttonTextTransform: TextTransform
    buttonBorderRadius: number
    buttonBgColor?: string
    buttonFontColor?: string
    buttonPaddingX: number
    buttonPaddingY: number
    previewLabel: string
    frontFooterText: string
    backFooterText: string
    frontTheme: string
    backTheme: string
    resolvedFrontBg: string
    resolvedFrontText: string
    resolvedBackBg: string
    resolvedBackText: string
}
const EASE = [0.22, 1, 0.36, 1] as const
const INK = "#101B34"
const PAPER = "#EEF0F4"
const ACCENT = "#4C6FFF"

function isExternalLink(link: string): boolean {
    return /^https?:\/\//i.test(link)
}

function opaqueColor(color?: string): string | undefined {
    if (!color?.trim()) return undefined
    const value = color.trim()
    const rgba = value.match(
        /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i
    )
    if (rgba) return `rgb(${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
    const hsla = value.match(
        /^hsla?\(\s*([\d.]+)(?:deg)?\s*[,/]\s*([\d.]+)%?\s*[,/]\s*([\d.]+)%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i
    )
    if (hsla) return `hsl(${hsla[1]}, ${hsla[2]}%, ${hsla[3]}%)`
    if (/^#[\da-f]{8}$/i.test(value)) return value.slice(0, 7)
    return value
}

/* ---------- Button ---------- */

interface CardButtonProps {
    text: string
    link: string
    isStatic?: boolean
    buttonStyle?: ButtonStyle
    bgColor?: string
    fontColor?: string
    hoverBgColor?: string
    hoverFontColor?: string
    borderColor?: string
    hoverBorderColor?: string
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    textTransform?: TextTransform
}

function ArrowMove({
    children,
    isStatic = false,
}: {
    children: JSX.Element
    isStatic?: boolean
}) {
    const staticStyle = { display: "flex", alignItems: "center" }

    if (isStatic) {
        return (
            <div style={staticStyle} aria-hidden="true">
                {children}
            </div>
        )
    }

    return (
        <motion.div
            variants={{
                rest: { x: 0, y: 0, rotate: 0 },
                hover: { x: 4, y: -4, rotate: -45 },
            }}
            transition={{ duration: 0.4, ease: EASE }}
            style={staticStyle}
            aria-hidden="true"
        >
            {children}
        </motion.div>
    )
}

function CardButton(props: CardButtonProps) {
    const {
        text,
        link,
        isStatic = false,
        buttonStyle = "filled",
        bgColor = "#ffffff",
        fontColor = "#000000",
        hoverBgColor = "rgba(255, 255, 255, 0.85)",
        hoverFontColor = "#000000",
        borderColor = "#ffffff",
        hoverBorderColor = "#ffffff",
        borderRadius = 100,
        paddingX = 28,
        paddingY = 14,
        textTransform = "none",
    } = props

    if (!link) return null
    const hasText = !!text?.trim()
    const isFilled = buttonStyle === "filled"
    const isOutline = buttonStyle === "outline"
    const isGhost = buttonStyle === "ghost"
    const linkProps = {
        href: link,
        ...(isExternalLink(link)
            ? { target: "_blank" as const, rel: "noopener noreferrer" }
            : {}),
    }

    const baseStyle: React.CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingTop: isGhost && hasText ? 0 : paddingY,
        paddingRight: !hasText ? paddingY : isGhost ? 6 : paddingX,
        paddingBottom: isGhost && hasText ? 15 : paddingY,
        paddingLeft: !hasText ? paddingY : isGhost ? 6 : paddingX,
        background: isFilled ? bgColor : "transparent",
        border: isOutline
            ? `1px solid ${borderColor}`
            : "1px solid transparent",
        borderRadius: borderRadius + "px",
        textDecoration: "none",
        fontSize: "14px",
        fontWeight: 600,
        letterSpacing: "0.01em",
        lineHeight: "1em",
        textTransform,
        color: fontColor,
        cursor: "pointer",
        overflow: "hidden",
        pointerEvents: "auto",
        fontFamily: "inherit",
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    const inner = (
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {hasText && <span>{text}</span>}
            {BUTTON_ARROW_SVG}
        </span>
    )

    if (isStatic) {
        return (
            <a {...linkProps} style={baseStyle}>
                {inner}
            </a>
        )
    }

    if (isFilled) {
        return (
            <motion.a
                {...linkProps}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ ...baseStyle, isolation: "isolate" }}
            >
                <motion.div
                    variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                    transition={{ duration: 0.38, ease: EASE }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: hoverBgColor,
                        borderRadius: borderRadius + "px",
                        originX: 0,
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                />
                <motion.span
                    variants={{
                        rest: { color: fontColor },
                        hover: { color: hoverFontColor },
                    }}
                    transition={{ duration: 0.22 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    {hasText && <span>{text}</span>}
                    <ArrowMove isStatic={isStatic}>
                        {BUTTON_ARROW_SVG}
                    </ArrowMove>
                </motion.span>
            </motion.a>
        )
    }

    if (isOutline) {
        return (
            <motion.a
                {...linkProps}
                whileHover="hover"
                initial="rest"
                animate="rest"
                variants={{
                    rest: { borderColor },
                    hover: { borderColor: hoverBorderColor },
                }}
                transition={{ duration: 0.25 }}
                style={{ ...baseStyle, isolation: "isolate" }}
            >
                <motion.div
                    variants={{ rest: { opacity: 0 }, hover: { opacity: 0.1 } }}
                    transition={{ duration: 0.25 }}
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: hoverBgColor,
                        borderRadius: borderRadius + "px",
                        zIndex: -1,
                    }}
                    aria-hidden="true"
                />
                <motion.span
                    variants={{
                        rest: { x: 0, color: fontColor },
                        hover: { x: 3, color: hoverFontColor },
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    {hasText && <span>{text}</span>}
                    <ArrowMove isStatic={isStatic}>
                        {BUTTON_ARROW_SVG}
                    </ArrowMove>
                </motion.span>
            </motion.a>
        )
    }

    // ghost
    return (
        <motion.a
            {...linkProps}
            whileHover="hover"
            initial="rest"
            animate="rest"
            style={{ ...baseStyle, gap: 6, border: "none" }}
        >
            <motion.span
                style={{ position: "relative" }}
                variants={{
                    rest: { color: fontColor },
                    hover: { color: hoverFontColor },
                }}
            >
                {hasText && text}
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        bottom: -2,
                        left: 0,
                        height: 1.5,
                        background: "currentColor",
                        borderRadius: 2,
                        originX: 0,
                        width: "100%",
                    }}
                    variants={{
                        rest: { scaleX: 0, opacity: 0.6 },
                        hover: { scaleX: 1, opacity: 1 },
                    }}
                    transition={{ type: "tween", ease: EASE, duration: 0.32 }}
                />
            </motion.span>
            <motion.div
                aria-hidden="true"
                style={{
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    width: 16,
                    height: 16,
                    position: "relative",
                }}
            >
                <motion.div
                    style={{
                        position: "absolute",
                        display: "flex",
                        color: fontColor,
                    }}
                    variants={{
                        rest: { x: 0, y: 0, opacity: 1 },
                        hover: { x: 10, y: -10, opacity: 0 },
                    }}
                    transition={{ duration: 0.26, ease: EASE }}
                >
                    {BUTTON_ARROW_SVG}
                </motion.div>
                <motion.div
                    style={{
                        position: "absolute",
                        display: "flex",
                        color: hoverFontColor,
                    }}
                    variants={{
                        rest: { x: -10, y: 10, opacity: 0 },
                        hover: { x: 0, y: 0, opacity: 1 },
                    }}
                    transition={{ duration: 0.26, ease: EASE, delay: 0.05 }}
                >
                    {BUTTON_ARROW_SVG}
                </motion.div>
            </motion.div>
        </motion.a>
    )
}

/* ---------- Helpers ---------- */

function getFontStyle(font: any): React.CSSProperties {
    if (!font) return {}
    return {
        fontFamily: font.fontFamily ?? font.family ?? undefined,
        fontSize: font.fontSize ?? undefined,
        fontWeight: font.fontWeight ?? font.weight ?? undefined,
        fontStyle: font.fontStyle ?? font.style ?? undefined,
        lineHeight: font.lineHeight ?? undefined,
        letterSpacing: font.letterSpacing ?? undefined,
        textAlign: font.textAlign ?? undefined,
        textTransform: font.textTransform ?? undefined,
        textDecoration: font.textDecoration ?? undefined,
    }
}

function resolveThemeColors(
    theme: string,
    customBg: string,
    customText: string
) {
    if (theme === "dark") return { bg: INK, text: "#F3F5FA" }
    if (theme === "custom")
        return { bg: customBg || PAPER, text: customText || INK }
    return { bg: PAPER, text: INK }
}

function buildShadow(
    enabled: boolean,
    x: number,
    y: number,
    blur: number,
    spread: number,
    color: string
): string {
    if (!enabled) return "none"
    return `0 1px 2px rgba(16,27,52,0.06), ${x}px ${y}px ${blur}px ${spread}px ${color}`
}

function renderIcon(card: ProcessedCard) {
    const iconType = card.icon || "strategy"
    const iconSize = card.iconSize ?? 24
    const iconShape = card.iconShape || "none"
    const iconShapeBg = card.iconShapeBg || "rgba(16,27,52,0.07)"
    const iconPadding = card.iconPadding ?? 12
    const icoColor = card.iconColor

    const shapeStyle: React.CSSProperties =
        iconShape === "none"
            ? {
                  width: iconSize,
                  height: iconSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
              }
            : {
                  width: iconSize + iconPadding * 2,
                  height: iconSize + iconPadding * 2,
                  borderRadius: iconShape === "circle" ? "50%" : "14px",
                  background: iconShapeBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
              }

    const svgStyle: React.CSSProperties = {
        width: iconSize,
        height: iconSize,
        stroke: icoColor || "currentColor",
        strokeWidth: 1.5,
        fill: "none",
        display: "block",
    }

    if (iconType === "custom") {
        if (card.customIconCode && card.customIconCode.trim()) {
            return (
                <div
                    className="fc-icon fc-custom-icon"
                    style={{ ...shapeStyle, color: icoColor || "currentColor" }}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeSvgMarkup(card.customIconCode),
                    }}
                />
            )
        }
        const iconSrc = card.customIconFile || card.customIconUrl
        if (iconSrc) {
            return (
                <div className="fc-icon fc-custom-icon" style={shapeStyle}>
                    <img
                        src={iconSrc}
                        alt=""
                        style={{
                            width: iconSize,
                            height: iconSize,
                            objectFit: "contain",
                            display: "block",
                        }}
                    />
                </div>
            )
        }
    }

    const icon = (ICONS[iconType] || ICONS.strategy) as React.ReactElement
    return (
        <div className="fc-icon" style={shapeStyle}>
            <svg viewBox={icon.props.viewBox || "0 0 24 24"} style={svgStyle}>
                {icon.props.children}
            </svg>
        </div>
    )
}

function renderServiceIcon(card: ProcessedCard, fallbackColor: string) {
    const type = card.serviceIconType || "dot"
    if (type === "none") return null

    const color = card.serviceIconColor || fallbackColor
    const size = card.serviceIconSize || 10
    const shape = card.serviceIconShape || "none"
    const frameSize = size + 12
    const frameStyle: React.CSSProperties =
        shape === "none"
            ? {}
            : {
                  width: frameSize,
                  height: frameSize,
                  borderRadius: shape === "circle" ? "50%" : 6,
                  background: `${color}18`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
              }
    const frame = (content: JSX.Element) =>
        shape === "none" ? content : <span style={frameStyle}>{content}</span>

    if (type === "dot") {
        return frame(
            <span
                className="fc-dot"
                aria-hidden="true"
                style={{
                    width: size,
                    height: Math.max(1, size / 5),
                    background: color,
                }}
            />
        )
    }

    if (type === "custom") {
        if (card.serviceIconCode?.trim()) {
            return frame(
                <span
                    className="fc-service-icon fc-custom-icon"
                    aria-hidden="true"
                    style={{ width: size, height: size, color }}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeSvgMarkup(card.serviceIconCode),
                    }}
                />
            )
        }
        if (card.serviceIconFile) {
            return frame(
                <img
                    className="fc-service-icon"
                    src={card.serviceIconFile}
                    alt=""
                    aria-hidden="true"
                    style={{ width: size, height: size, objectFit: "contain" }}
                />
            )
        }
        return null
    }

    const icon = ICONS[type] || ICONS.check
    return frame(
        <span
            className="fc-service-icon"
            aria-hidden="true"
            style={{ width: size, height: size, color, display: "inline-flex" }}
        >
            <svg
                viewBox="0 0 24 24"
                style={{
                    width: "100%",
                    height: "100%",
                    stroke: "currentColor",
                    strokeWidth: 1.8,
                    fill: "none",
                }}
            >
                {icon.props.children}
            </svg>
        </span>
    )
}

/* ---------- Styles ---------- */

const STYLES = `
  .fc-root * { margin: 0; padding: 0; box-sizing: border-box; }
  .fc-root.fc-static *, .fc-root.fc-static *::before, .fc-root.fc-static *::after {
    animation: none !important;
    transition: none !important;
  }
  .fc-root.fc-static .fc-badge-pulse, .fc-root.fc-static .fc-badge-bounce,
  .fc-root.fc-static .fc-mobile-tooltip { animation: none !important; }
  .fc-root.fc-static .fc-mobile-tooltip { opacity: 1; transform: none; }
  .fc-root.fc-static .fc-mobile-inner, .fc-root.fc-static .fc-face,
  .fc-root.fc-static .fc-front .fc-arrow, .fc-root.fc-static .fc-back .fc-arrow { transition: none !important; }
  .fc-root.fc-static .fc-service { transform: translateY(0) !important; opacity: 1 !important; }

  .fc-root {
    --fc-accent: ${ACCENT};
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    width: 100%;
    min-height: 100%;
    color: ${INK};
    overflow: hidden;
  }

  /* Desktop */
  .fc-desktop { display: block; }
  .fc-animation { position: relative; width: 100%; min-height: 0; }
  .fc-stage {
    display: flex; align-items: center; justify-content: center;
    padding: 56px 24px; position: relative;
  }
  .fc-wrap {
    position: relative; width: min(1240px, 100%); max-width: 1240px;
    height: 100%; min-height: 0;
    perspective: 1800px; z-index: 1;
  }
  .fc-card { position: absolute; left: 50%; top: 50%; will-change: transform; overflow: visible; }
  .fc-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; overflow: visible; }

  /* Mobile */
  .fc-mobile { display: none; }
  .fc-mobile-container {
    position: relative; width: 100%; padding: 34px 18px 42px;
    display: flex; flex-direction: column;
  }
  .fc-mobile-section {
    width: 100%; display: flex; align-items: center; justify-content: center;
    padding: 16px 0 28px; position: relative; margin-bottom: 24px;
  }
  .fc-mobile-section::after {
    content: ''; position: absolute; left: 16%; right: 16%; bottom: 0;
    height: 1px; background: rgba(16,27,52,0.1);
  }
  .fc-mobile-section:last-child { margin-bottom: 0; padding-bottom: 0; }
  .fc-mobile-section:last-child::after { display: none; }
  .fc-mobile-card { will-change: transform; filter: drop-shadow(0 18px 28px rgba(16,27,52,0.12)); }
  .fc-mobile-inner {
    width: 100%; height: 100%; position: relative; transform-style: preserve-3d;
    transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
  }

  @media (max-width: 768px) {
    .fc-desktop { display: none !important; }
    .fc-mobile { display: block !important; }
    .fc-service { transform: translateY(0) !important; font-size: 14px !important; }
    .fc-face { padding: var(--fc-card-padding) !important; }
    .fc-front h2, .fc-back h3 { font-size: clamp(1.6rem, 7vw, 2rem) !important; }
    .fc-price-amount { font-size: clamp(32px, 10vw, 40px) !important; }
    .fc-card-counter { top: 16px !important; left: 16px !important; }
    .fc-featured-badge { top: -12px !important; left: 50% !important; right: auto !important; transform: translateX(-50%) !important; font-size: 11px !important; padding: 7px 14px !important; white-space: nowrap !important; z-index: 20 !important; }
    .fc-featured-badge-top-right { top: 16px !important; left: auto !important; right: 16px !important; transform: none !important; }
    .fc-front .fc-arrow { width: 30px !important; height: 30px !important; }
    .fc-back .fc-arrow { width: 32px !important; height: 32px !important; }
    .fc-stage { padding: 44px 16px 56px; }
  }

  /* Faces */
  .fc-face {
    position: absolute; inset: 0; padding: var(--fc-card-padding);
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    display: flex; flex-direction: column; overflow: hidden;
    transition: box-shadow 0.35s ease-out, transform 0.35s ease-out;
    background-size: cover; background-position: center; background-repeat: no-repeat;
    isolation: isolate;
  }
  .fc-front { justify-content: space-between; overflow: visible; }
  .fc-back { transform: rotateY(180deg); justify-content: flex-start; }
  .fc-front-header, .fc-front-bottom, .fc-back-header, .fc-back-content, .fc-back-footer { z-index: 2; }

  .fc-front-header {
    display: flex; flex-direction: column; justify-content: space-between;
    gap: 12px; flex: 1; min-height: 0; position: relative; z-index: 2;
  }
  .fc-front-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .fc-front-titlegroup { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
  .fc-front-bottom {
    display: flex; flex-direction: column; gap: 20px;
    margin-top: 26px; padding-top: 22px;
    border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
    position: relative; z-index: 2;
  }
  .fc-front-bottom-centered { align-items: center; text-align: center; }
  .fc-front-bottom-centered .fc-price-head { justify-content: center; }
  .fc-front-bottom-centered .fc-price-value { justify-content: center; }
  .fc-front-bottom-centered .fc-front-footer { justify-content: center; gap: 12px; width: 100%; }
  .fc-front-header-image-first { gap: 18px; justify-content: flex-start; }
  .fc-front-image-block {
    width: 100%; flex: 1; min-height: 145px; border-radius: 18px; position: relative;
    background-size: cover; background-position: center; background-repeat: no-repeat;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
  }
  .fc-front-header-badge-prominent {
    flex: 1; justify-content: center; align-items: center; text-align: center; margin-top: 0; gap: 16px;
  }
  .fc-front-header-badge-prominent .fc-icon { margin: 0 auto; }
  .fc-front-header-badge-prominent .fc-price-container { align-items: center; }
  .fc-front-header-badge-prominent .fc-price-row { justify-content: center; }
  .fc-featured-badge-inline {
    position: static; display: inline-flex; align-self: center; align-items: center; gap: 6px;
    font-weight: 700; letter-spacing: 0.02em; transition: box-shadow 0.35s ease-out;
  }
  .fc-featured-badge-inline svg { flex-shrink: 0; }

  .fc-custom-icon img, .fc-custom-icon svg { width: 100%; height: 100%; object-fit: contain; }
  .fc-custom-icon svg { stroke: unset; fill: unset; stroke-width: unset; }
  .fc-icon { filter: drop-shadow(0 4px 8px rgba(16,27,52,0.08)); }

  .fc-front h2, .fc-back h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: clamp(2.05rem, 3.1vw, 2.75rem); line-height: 1.02; font-weight: 400; letter-spacing: -0.035em;
  }
  .fc-front-footer {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 14px; font-weight: 600; letter-spacing: 0.01em;
    position: relative; z-index: 2;
  }
  a.fc-front-footer { text-decoration: none; cursor: pointer; }
  .fc-front .fc-arrow {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: box-shadow 0.35s ease-out, transform 0.35s ease;
  }
  .fc-front .fc-arrow:hover, .fc-back .fc-arrow:hover { transform: translateY(-2px); }
  .fc-front .fc-arrow svg { width: 12px; height: 12px; stroke: currentColor; stroke-width: 2; fill: none; }

  .fc-back-header { display: flex; flex-direction: column; gap: 12px; position: relative; z-index: 2; }
  .fc-preview-label { font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  .fc-back-content { margin-top: 28px; display: flex; flex-direction: column; gap: 0; flex: 1; position: relative; z-index: 2; }
  .fc-back-footer {
    margin-top: auto; padding-top: 26px; display: flex; justify-content: space-between;
    align-items: center; font-size: 14px; position: relative; z-index: 2; gap: 12px;
  }
  .fc-back-footer-left { display: flex; align-items: center; flex-shrink: 0; }
  .fc-back-footer-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .fc-back .fc-arrow {
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    transition: box-shadow 0.35s ease-out, transform 0.35s ease; flex-shrink: 0;
  }
  .fc-back .fc-arrow svg { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2; fill: none; transform: rotate(180deg); }

  .fc-service {
    display: flex; align-items: center; gap: 12px; padding: 14px 0;
    font-size: 15px; transform: translateY(10px);
    border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  }
  .fc-service:last-child { border-bottom: 1px solid color-mix(in srgb, currentColor 16%, transparent); }
  .fc-service .fc-dot { width: 10px; height: 2px; flex-shrink: 0; border-radius: 999px; }

  .fc-image-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
  .fc-has-image h2, .fc-has-image h3,
  .fc-has-image .fc-price-amount, .fc-has-image .fc-price-period,
  .fc-has-image .fc-price-label, .fc-has-image .fc-front-footer,
  .fc-has-image .fc-back-footer, .fc-has-image .fc-service,
  .fc-has-image .fc-preview-label { text-shadow: 0 1px 5px rgba(0,0,0,0.65); }

  .fc-card-counter {
    position: absolute; top: 24px; left: 24px;
    font-variant-numeric: tabular-nums; pointer-events: none; user-select: none; z-index: 10; line-height: 1;
    letter-spacing: 0.08em;
  }
  .fc-featured-badge {
    position: absolute; top: -16px; left: 50%; right: auto; transform: translateX(-50%); padding: 8px 15px;
    font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 6px;
    pointer-events: none; z-index: 20; line-height: 1; white-space: nowrap; transition: box-shadow 0.35s ease-out;
  }
  .fc-featured-badge svg { flex-shrink: 0; }
  .fc-featured-badge-top-right { top: 20px; left: auto; right: 20px; transform: none; }
  .fc-badge-outline { background: transparent !important; }
  .fc-badge-ghost { background: transparent !important; box-shadow: none !important; border: none !important; }

  @keyframes badge-pulse { 0%, 100% { transform: translateX(-50%) scale(1); } 50% { transform: translateX(-50%) scale(1.05); } }
  @keyframes badge-bounce { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-3px); } }
  @keyframes badge-pulse-right { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes badge-bounce-right { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .fc-badge-pulse { animation: badge-pulse 2s ease-in-out infinite; }
  .fc-badge-bounce { animation: badge-bounce 1.5s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce) {
    .fc-badge-pulse, .fc-badge-bounce { animation: none; }
    .fc-mobile-inner, .fc-face, .fc-front .fc-arrow, .fc-back .fc-arrow { transition: none; }
  }

  /* Price */
  .fc-price-container { display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 2; }
  .fc-price-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-height: 24px; }
  .fc-price-label { font-size: 13px; font-weight: 600; letter-spacing: 0.02em; }
  .fc-price-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .fc-price-value { display: flex; align-items: baseline; gap: 5px; }
  .fc-price-amount {
    font-family: Georgia, 'Times New Roman', serif; font-size: 48px; font-weight: 400;
    letter-spacing: -0.04em; line-height: 0.95; font-variant-numeric: tabular-nums;
  }
  .fc-price-period { font-size: 13px; font-weight: 500; }

  .fc-card-billing-toggle {
    display: inline-flex; align-items: center; border-radius: 100px; padding: 3px;
    pointer-events: auto; width: fit-content; flex-shrink: 0; position: relative; z-index: 3;
  }
  .fc-card-billing-toggle-btn {
    padding: 6px 11px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
    border: none; background: transparent; color: inherit; cursor: pointer;
    border-radius: 100px; transition: all 0.25s ease; font-family: inherit; line-height: 1; white-space: nowrap;
  }
  .fc-card-billing-toggle-btn.active { box-shadow: none; }

  .fc-root a:focus-visible, .fc-root button:focus-visible { outline: 2px solid var(--fc-accent); outline-offset: 3px; }
  .fc-flip-control { display: inline-flex; align-items: center; gap: 12px; }
  .fc-flip-label { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
  .fc-mobile .fc-flip-label { display: none !important; }
  .fc-mobile-card:focus-visible { outline: 3px solid var(--fc-accent); outline-offset: 8px; border-radius: 24px; }
  .fc-sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }

  /* Mobile hint */
  .fc-mobile-tooltip {
    display: none; position: absolute; bottom: calc(100% + 10px); right: 0;
    background: rgba(16,27,52,0.94); color: white; padding: 7px 12px; border-radius: 8px;
    font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none;
    opacity: 0; transform: translateY(4px); z-index: 100;
  }
  .fc-root a:hover .fc-mobile-tooltip,
  .fc-root button:hover .fc-mobile-tooltip,
  .fc-root .fc-arrow:hover .fc-mobile-tooltip,
  .fc-root .fc-arrow:focus-visible .fc-mobile-tooltip {
    opacity: 0 !important; visibility: hidden; transform: translateY(4px) !important;
    animation: none !important;
  }
  .fc-mobile-tooltip::after { content: ''; position: absolute; top: 100%; right: 12px; border: 5px solid transparent; border-top-color: rgba(16,27,52,0.94); }
  @media (max-width: 768px) { .fc-mobile-tooltip { display: block; animation: tooltip-fade-in 0.5s ease 1s forwards; } }
  @media (max-width: 768px) and (prefers-reduced-motion: reduce) { .fc-mobile-tooltip { animation: none; opacity: 1; transform: none; } }
  @keyframes tooltip-fade-in { to { opacity: 1; transform: translateY(0); } }
`

/* ---------- Component ---------- */

const SHADOW_PRESETS: Record<string, any> = {
    soft: {
        y: 6,
        blur: 20,
        spread: -6,
        a: 14,
        hy: 16,
        hblur: 36,
        hspread: -8,
        ha: 22,
    },
    medium: {
        y: 12,
        blur: 32,
        spread: -8,
        a: 18,
        hy: 32,
        hblur: 64,
        hspread: -16,
        ha: 32,
    },
    strong: {
        y: 20,
        blur: 48,
        spread: -10,
        a: 28,
        hy: 40,
        hblur: 80,
        hspread: -18,
        ha: 42,
    },
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export interface FlipCardsProps {
    cards?: FlipCardInput[]
    backgroundColor?: string
    cardPadding?: number
    scrollStart?: "top top" | "center center"
    scrollDistance?: number
    cardWidth?: number
    cardHeight?: number
    cardDistance?: number
    cardBorderRadius?: number
    showCounter?: boolean
    counterColor?: string
    accentColor?: string
    shadowStyle?: string
    shadowColor?: string
    typography?: Record<string, any>
    defaultBilling?: "monthly" | "yearly"
    flipDuration?: number
    staggerDelay?: number
    featuredLiftEnabled?: boolean
    featuredLift?: number
    scrub?: number
}

export default function FlipCards(props: FlipCardsProps) {
    const {
        cards = [],
        backgroundColor = PAPER,
        cardPadding = 36,
        scrollStart = "center center",
        scrollDistance = 1800,
        cardWidth = 320,
        cardHeight = 540,
        cardDistance = 390,
        cardBorderRadius = 22,
        showCounter = true,
        counterColor,
        accentColor = ACCENT,
        shadowStyle = "medium",
        shadowColor = INK,
        typography = {},
        defaultBilling = "monthly",
        flipDuration = 1,
        staggerDelay = 0.12,
        featuredLiftEnabled = true,
        featuredLift = 18,
        scrub = 1,
    } = props

    const {
        titleFont,
        priceFont,
        bodyFont,
        bodySize = 15,
        uppercaseHeaders = false,
    } = typography

    const titleTransform = "none"
    const serviceTransform = "none"
    const footerTransform = "none"
    const headerTransform = uppercaseHeaders ? "uppercase" : titleTransform

    const [billing, setBilling] = useState<"monthly" | "yearly">(
        defaultBilling === "yearly" ? "yearly" : "monthly"
    )
    const [mobileFlipped, setMobileFlipped] = useState<Record<number, boolean>>(
        {}
    )
    const [flipAnnouncement, setFlipAnnouncement] = useState("")

    const rootRef = useRef<HTMLDivElement>(null)
    const desktopAnimRef = useRef<HTMLDivElement>(null)
    const desktopWrapRef = useRef<HTMLDivElement>(null)
    const mobileRef = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()

    const setMobileCardFlipped = (
        index: number,
        flipped: boolean,
        title: string
    ) => {
        setMobileFlipped((previous) => ({ ...previous, [index]: flipped }))
        setFlipAnnouncement(
            `${title}: ${flipped ? "details shown" : "front shown"}.`
        )
    }

    const preset = SHADOW_PRESETS[shadowStyle] || SHADOW_PRESETS.medium
    const tint = (pct: number) =>
        `color-mix(in srgb, ${shadowColor} ${pct}%, transparent)`
    const baseShadow =
        shadowStyle === "none"
            ? "none"
            : `0 1px 2px ${tint(6)}, 0 ${preset.y}px ${preset.blur}px ${preset.spread}px ${tint(preset.a)}`
    const hoverShadow =
        shadowStyle === "none"
            ? "none"
            : `0 2px 4px ${tint(8)}, 0 ${preset.hy}px ${preset.hblur}px ${preset.hspread}px ${tint(preset.ha)}`

    const processedCards = useMemo(() => {
        return (cards as FlipCardInput[]).map(
            (card: FlipCardInput, index: number) => {
                const p = card.price || {}
                const f = card.featured || {}
                const ic = card.icon || {}
                const sic = card.serviceIcon || {}
                const im = card.image || {}
                const b = card.button || {}
                const l = card.labels || {}
                const t = card.theme || {}
                const front = resolveThemeColors(
                    t.front || "light",
                    t.frontBg,
                    t.frontText
                )
                const back = resolveThemeColors(
                    t.back || "dark",
                    t.backBg,
                    t.backText
                )
                return {
                    id: card.id || `card-${index + 1}`,
                    autoNumber: String(index + 1).padStart(2, "0"),
                    title: card.title || `Card ${index + 1}`,
                    description: card.description || "",
                    introTextColor: card.introTextColor,
                    introTextPlacement: card.introTextPlacement || "back",
                    services: card.services || [],
                    frontLayout: card.frontLayout || "standard",

                    showPrice: p.show !== false,
                    monthlyPrice: p.monthly || "",
                    yearlyPrice: p.yearly || "",
                    priceLabel: p.label || "",
                    pricePeriodLabel: p.period || "",
                    showBillingToggle: p.toggle !== false,

                    isFeatured: f.enabled === true,
                    featuredBadge: f.text || "",
                    badgePosition: f.position || "top-center",
                    badgeIcon: f.icon || "star",
                    badgeStyle: f.style || "filled",
                    badgeBorderRadius: f.radius ?? 100,
                    badgeEnableShadow: f.shadow === true,
                    badgeUppercase: f.uppercase === true,
                    badgeAnimation: f.animation || "none",
                    badgeBgColor: f.color,
                    badgeTextColor: f.textColor,

                    icon: ic.type || "strategy",
                    iconSize: ic.size ?? 24,
                    iconShape: ic.shape || "square",
                    iconShapeBg: ic.shapeBg || "rgba(16,27,52,0.07)",
                    iconColor: ic.color,
                    customIconFile: ic.file || "",
                    customIconCode: ic.svg || "",
                    serviceIconType: sic.type || "dot",
                    serviceIconSize: sic.size ?? 10,
                    serviceIconShape: sic.shape || "none",
                    serviceIconColor: sic.color,
                    serviceIconFile: sic.file || "",
                    serviceIconCode: sic.svg || "",

                    cardImage: im.src || "",
                    imageBackgroundFace: im.showOn || "none",
                    imageOverlayOpacity: Math.max(
                        (im.darken ?? 45) / 100,
                        0.55
                    ),
                    imageOverlayColor: im.overlay,

                    buttonText: b.label || "Book a call",
                    buttonLink: b.link || "",
                    buttonStyle: b.style || "filled",
                    buttonTextTransform: b.uppercase ? "uppercase" : "none",
                    buttonBorderRadius: b.radius ?? 100,
                    buttonBgColor: b.color,
                    buttonFontColor: b.textColor,
                    buttonPaddingX: 20,
                    buttonPaddingY: 10,

                    previewLabel: l.preview || "What's included",
                    frontFooterText: l.front ?? "See what's included",
                    backFooterText: "",

                    frontTheme: t.front || "light",
                    backTheme: t.back || "dark",
                    resolvedFrontBg: front.bg,
                    resolvedFrontText: front.text,
                    resolvedBackBg: back.bg,
                    resolvedBackText: back.text,
                }
            }
        )
    }, [cards])

    /* Keyboard: only while the component is on screen, never hijack the rest of the page */
    useEffect(() => {
        if (isStatic) return
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement
            if (
                el?.tagName === "INPUT" ||
                el?.tagName === "TEXTAREA" ||
                el?.isContentEditable
            )
                return
            const root = rootRef.current
            if (!root) return
            const r = root.getBoundingClientRect()
            if (r.bottom < 0 || r.top > window.innerHeight) return

            const forward = e.key === "ArrowRight" || e.key === "ArrowDown"
            const backward = e.key === "ArrowLeft" || e.key === "ArrowUp"
            if (!forward && !backward) return
            e.preventDefault()

            const isMobile = window.matchMedia("(max-width: 768px)").matches
            const step = isMobile
                ? window.innerHeight
                : scrollDistance / Math.max(1, processedCards.length)
            const reduce = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
            window.scrollBy({
                top: forward ? step : -step,
                behavior: reduce ? "auto" : "smooth",
            })
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [isStatic, scrollDistance, processedCards.length])

    /* Desktop animation: created only on desktop widths, reduced motion gets a static spread */
    useEffect(() => {
        if (isStatic) return
        const wrap = desktopWrapRef.current
        const anim = desktopAnimRef.current
        if (!wrap || !anim) return

        const mm = gsap.matchMedia()

        const setup = (reduced: boolean) => {
            const cardsEls = wrap.querySelectorAll<HTMLElement>(".fc-card")
            if (cardsEls.length === 0) return
            const middle = (cardsEls.length - 1) / 2

            if (reduced) {
                cardsEls.forEach((c, i) => {
                    gsap.set(c, {
                        xPercent: -50,
                        yPercent: -50,
                        x: (i - middle) * cardDistance,
                        rotation: 0,
                    })
                })
                gsap.set(wrap.querySelectorAll(".fc-service"), {
                    y: 0,
                })
                return
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: anim,
                    start: scrollStart,
                    end: `+=${scrollDistance}`,
                    scrub,
                    pin: true,
                    anticipatePin: 1,
                },
            })

            cardsEls.forEach((c, i) => {
                const inner = c.querySelector(".fc-inner")
                const frontFace = c.querySelector(".fc-front")
                const items = c.querySelectorAll(".fc-service")
                const offset = i - middle

                gsap.set(c, {
                    xPercent: -50,
                    yPercent: -50,
                    x: 0,
                    rotation: offset < 0 ? -8 : offset > 0 ? 8 : 0,
                })

                tl.to(
                    c,
                    {
                        x: offset * cardDistance,
                        rotation: 0,
                        duration: flipDuration,
                    },
                    0
                )

                if (inner)
                    tl.to(
                        inner,
                        {
                            rotateY: 180,
                            duration: flipDuration,
                            ease: "power2.inOut",
                        },
                        1
                    )
                if (frontFace) {
                    tl.fromTo(
                        frontFace,
                        { zIndex: 0 },
                        { zIndex: -1, duration: 0.01, ease: "none" },
                        1
                    )
                }
                if (items.length > 0) {
                    // Keep the reveal deterministic: CSS provides the static fallback,
                    // while GSAP owns both the start and end values at runtime.
                    tl.fromTo(
                        items,
                        { y: 10, opacity: 0 },
                        {
                            y: 0,
                            opacity: 1,
                            stagger: staggerDelay,
                            duration: 0.35,
                            ease: "power2.out",
                        },
                        1 + flipDuration + 0.8
                    )
                }
                // The one memorable moment: featured card lifts once the deck has flipped
                if (featuredLiftEnabled && c.dataset.featured === "true") {
                    tl.to(
                        c,
                        {
                            y: -featuredLift,
                            scale: 1.04,
                            duration: 0.6,
                            ease: "power2.out",
                        },
                        1 + flipDuration * 0.6
                    )
                }
            })
        }

        mm.add(
            {
                full: "(min-width: 769px) and (prefers-reduced-motion: no-preference)",
                reduced:
                    "(min-width: 769px) and (prefers-reduced-motion: reduce)",
            },
            (ctx) => {
                setup(!!ctx.conditions?.reduced)
            }
        )

        return () => mm.revert()
    }, [
        isStatic,
        processedCards,
        scrollDistance,
        scrollStart,
        cardDistance,
        flipDuration,
        staggerDelay,
        featuredLiftEnabled,
        featuredLift,
        scrub,
    ])

    const bodyBase = getFontStyle(bodyFont)
    const bodyCss: React.CSSProperties = {
        fontFamily: bodyBase.fontFamily,
        fontWeight: bodyBase.fontWeight,
        fontStyle: bodyBase.fontStyle,
    }
    const titleStyle = getFontStyle(titleFont)
    const numberStyle: React.CSSProperties = {
        fontFamily: titleStyle.fontFamily,
    }
    const priceStyle = getFontStyle(priceFont)
    const serviceStyle: React.CSSProperties = { ...bodyCss, fontSize: bodySize }
    const descriptionStyle: React.CSSProperties = {
        ...bodyCss,
        fontSize: bodySize,
        lineHeight: 1.5,
    }
    const footerStyle: React.CSSProperties = {
        ...bodyCss,
        fontSize: bodySize - 1,
    }
    const previewLabelStyle: React.CSSProperties = {
        ...bodyCss,
        fontSize: bodySize - 2,
    }

    const renderFeaturedBadge = (
        card: any,
        textColor: string,
        bgColor: string,
        variant: "corner" | "inline" | "tag" = "corner"
    ) => {
        if (!card.isFeatured || !card.featuredBadge) return null

        const badgeBg = card.badgeBgColor || "var(--fc-accent)"
        const badgeText = card.badgeTextColor || "#ffffff"
        const badgeIcon = card.badgeIconColor || badgeText
        const badgeBorder = card.badgeBorderColor || badgeBg

        const sizeMap = {
            small: { fontSize: "10px", iconSize: 9 },
            medium: { fontSize: "12px", iconSize: 11 },
            large: { fontSize: "14px", iconSize: 13 },
        }
        const size =
            variant === "inline"
                ? { fontSize: "13px" }
                : variant === "tag"
                  ? { fontSize: "11px" }
                  : sizeMap[card.badgeSize as keyof typeof sizeMap] ||
                    sizeMap.medium

        const padY =
            variant === "inline"
                ? 8
                : variant === "tag"
                  ? 6
                  : (card.badgePaddingY ?? 7)
        const padX =
            variant === "inline"
                ? 18
                : variant === "tag"
                  ? 12
                  : (card.badgePaddingX ?? 14)

        const badgeCss: React.CSSProperties = {
            fontSize: size.fontSize,
            padding: `${padY}px ${padX}px`,
            fontWeight: card.badgeFontWeight || "700",
            background: card.badgeStyle === "filled" ? badgeBg : "transparent",
            color: card.badgeStyle === "filled" ? badgeText : badgeBg,
            border:
                card.badgeStyle === "outline"
                    ? `1px solid ${badgeBorder}`
                    : card.badgeStyle === "filled"
                      ? `1px solid ${badgeText}33`
                      : "none",
            borderRadius: card.badgeBorderRadius,
            boxShadow: card.badgeEnableShadow
                ? "0 2px 8px rgba(0,0,0,0.2)"
                : "none",
            textTransform: card.badgeUppercase ? "uppercase" : "none",
            ...(variant === "corner" && card.badgePosition === "top-right"
                ? {
                      position: "absolute",
                      top: 20,
                      right: 20,
                      left: "auto",
                      transform: "none",
                      zIndex: 20,
                  }
                : variant === "corner"
                  ? {
                        position: "absolute",
                        top: -16,
                        left: "50%",
                        right: "auto",
                        transform: "translateX(-50%)",
                        zIndex: 20,
                    }
                  : {}),
            ...(variant === "tag" ? { alignSelf: "flex-start" } : {}),
        }

        const animClass =
            !isStatic && variant === "corner" && card.badgeAnimation !== "none"
                ? `fc-badge-${card.badgeAnimation}${card.badgePosition === "top-right" ? "-right" : ""}`
                : ""

        return (
            <div
                className={`${variant === "corner" ? `fc-featured-badge fc-featured-badge-${card.badgePosition}` : "fc-featured-badge-inline"} fc-badge-${card.badgeStyle} ${animClass}`}
                style={badgeCss}
            >
                {card.badgeIcon !== "none" && (
                    <span
                        style={{
                            color:
                                card.badgeStyle === "filled"
                                    ? badgeIcon
                                    : "currentColor",
                            display: "flex",
                        }}
                    >
                        {BADGE_ICONS[card.badgeIcon] || BADGE_ICONS.star}
                    </span>
                )}
                <span>{card.featuredBadge}</span>
            </div>
        )
    }

    const renderCounter = (
        card: any,
        fallbackColor: string,
        variant: "corner" | "inline" | "chip" = "corner",
        chipBg?: string
    ) => {
        if (!showCounter) return null
        return (
            <div
                className="fc-card-counter"
                style={{
                    ...numberStyle,
                    color: counterColor || fallbackColor,
                    fontSize: variant === "chip" ? "15px" : "22px",
                    fontWeight: 400,
                    ...(variant === "inline" ? { position: "static" } : {}),
                    ...(variant === "chip"
                        ? {
                              top: 12,
                              left: 12,
                              background: chipBg,
                              padding: "6px 11px",
                              borderRadius: 100,
                          }
                        : {}),
                }}
            >
                {card.autoNumber}
            </div>
        )
    }

    const renderBillingToggle = (
        card: any,
        textColor: string,
        bgColor: string
    ) => {
        if (!card.showBillingToggle) return null
        const toggleBg = card.billingToggleBg || textColor + "15"
        const activeBg = card.billingToggleActiveBg || textColor
        const activeColor = card.billingToggleActiveColor || bgColor
        const inactiveColor = card.billingToggleInactiveColor || textColor

        const btn = (
            value: "monthly" | "yearly",
            label: string,
            aria: string
        ) => (
            <button
                type="button"
                aria-pressed={billing === value}
                aria-label={aria}
                className={`fc-card-billing-toggle-btn ${billing === value ? "active" : ""}`}
                style={
                    billing === value
                        ? { background: activeBg, color: activeColor }
                        : { color: inactiveColor }
                }
                onClick={(e) => {
                    e.stopPropagation()
                    setBilling(value)
                }}
            >
                {label}
            </button>
        )

        return (
            <div
                className="fc-card-billing-toggle"
                style={{ background: toggleBg }}
            >
                {btn("monthly", "Monthly", "Show monthly price")}
                {btn("yearly", "Yearly", "Show yearly price")}
            </div>
        )
    }

    const renderPrice = (card: any, textColor: string, bgColor: string) => {
        if (!card.showPrice) return null
        const price =
            billing === "monthly" ? card.monthlyPrice : card.yearlyPrice
        if (!price) return null

        const priceColor = card.priceColor || textColor
        const labelColor = card.priceLabelColor || textColor
        const periodLabel =
            card.pricePeriodLabel || (billing === "monthly" ? "/mo" : "/yr")

        const toggle = renderBillingToggle(card, textColor, bgColor)

        return (
            <div className="fc-price-container">
                {(card.priceLabel || toggle) && (
                    <div className="fc-price-head">
                        <span
                            className="fc-price-label"
                            style={{ color: labelColor }}
                        >
                            {card.priceLabel}
                        </span>
                        {toggle}
                    </div>
                )}
                <div className="fc-price-value">
                    <span
                        className="fc-price-amount"
                        style={{
                            color: priceColor,
                            ...(priceStyle.fontSize
                                ? { fontSize: priceStyle.fontSize }
                                : {}),
                            ...(priceStyle.fontFamily
                                ? { fontFamily: priceStyle.fontFamily }
                                : {}),
                            ...(priceStyle.fontWeight
                                ? { fontWeight: priceStyle.fontWeight }
                                : {}),
                            ...(priceStyle.letterSpacing
                                ? { letterSpacing: priceStyle.letterSpacing }
                                : {}),
                            ...(priceStyle.lineHeight
                                ? { lineHeight: priceStyle.lineHeight }
                                : {}),
                        }}
                    >
                        {price}
                    </span>
                    {periodLabel && (
                        <span
                            className="fc-price-period"
                            style={{ color: priceColor }}
                        >
                            {periodLabel}
                        </span>
                    )}
                </div>
            </div>
        )
    }

    const shouldShowImage = (card: any, side: "front" | "back"): boolean => {
        if (!card.cardImage) return false
        if (side === "front" && card.frontLayout === "image-first") return false
        const mode = card.imageBackgroundFace || "none"
        return mode === "both" || mode === side
    }

    const getFaceBackgroundStyle = (
        card: any,
        bgColor: string,
        side: "front" | "back"
    ): React.CSSProperties => {
        if (shouldShowImage(card, side)) {
            return {
                backgroundImage: `url('${card.cardImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundColor: bgColor,
                borderRadius: cardBorderRadius + "px",
            }
        }
        return { background: bgColor, borderRadius: cardBorderRadius + "px" }
    }

    const renderImageOverlay = (card: any, side: "front" | "back") => {
        if (!shouldShowImage(card, side)) return null
        const opacity = card.imageOverlayOpacity ?? 0.45
        if (opacity <= 0) return null
        return (
            <div
                className="fc-image-overlay"
                style={{
                    background: card.imageOverlayColor || INK,
                    opacity,
                    borderRadius: cardBorderRadius + "px",
                }}
            />
        )
    }

    const renderFrontHeader = (
        card: any,
        frontText: string,
        icoColor: string,
        frontBg: string
    ) => {
        const layout = card.frontLayout || "standard"
        const titleEl = (
            <h2
                style={{
                    ...titleStyle,
                    color: frontText,
                    textTransform:
                        (titleStyle.textTransform as any) ?? headerTransform,
                }}
            >
                {card.title}
            </h2>
        )
        const iconEl = <div style={{ color: icoColor }}>{renderIcon(card)}</div>

        if (layout === "image-first") {
            return (
                <div className="fc-front-header fc-front-header-image-first">
                    {card.cardImage ? (
                        <div
                            className="fc-front-image-block"
                            style={{
                                backgroundImage: `url('${card.cardImage}')`,
                            }}
                        >
                            {renderCounter(card, frontText, "chip", frontBg)}
                        </div>
                    ) : (
                        <div className="fc-front-top">
                            {iconEl}
                            {renderCounter(card, frontText, "inline")}
                        </div>
                    )}
                    <div
                        className="fc-front-titlegroup"
                        style={{ marginTop: "auto" }}
                    >
                        {renderFeaturedBadge(
                            card,
                            frontText,
                            frontBg,
                            "corner"
                        )}
                        {titleEl}
                    </div>
                </div>
            )
        }

        if (layout === "badge-prominent") {
            return (
                <div className="fc-front-header fc-front-header-badge-prominent">
                    {renderCounter(card, frontText, "corner")}
                    {renderFeaturedBadge(card, frontText, frontBg, "corner")}
                    {iconEl}
                    {titleEl}
                </div>
            )
        }

        return (
            <div className="fc-front-header">
                <div className="fc-front-top">
                    {iconEl}
                    {renderCounter(card, frontText, "inline")}
                </div>
                <div className="fc-front-titlegroup">
                    {renderFeaturedBadge(card, frontText, frontBg, "corner")}
                    {titleEl}
                </div>
            </div>
        )
    }

    const renderCardFace = (
        card: any,
        side: "front" | "back",
        onFlip?: () => void,
        isFlipped?: boolean
    ) => {
        const frontBg = card.resolvedFrontBg
        const frontText = card.resolvedFrontText
        const backBg = card.resolvedBackBg
        const backText = card.resolvedBackText

        const icoColor = card.iconColor || frontText
        const svcColor = card.serviceColor || backText
        const svcDotColor = card.serviceDotColor || backText
        const fArrowBg =
            card.frontArrowBg ||
            (card.frontTheme === "dark"
                ? "rgba(255,255,255,0.15)"
                : "rgba(16,27,52,0.07)")
        const fArrowColor = card.frontArrowColor || frontText
        const bArrowBg =
            card.backArrowBg ||
            (card.backTheme === "light"
                ? "rgba(16,27,52,0.08)"
                : "rgba(255,255,255,0.1)")
        const bArrowColor = card.backArrowColor || backText

        const arrowShadow = buildShadow(
            card.arrowEnableShadow !== false,
            card.arrowShadowX ?? 0,
            card.arrowShadowY ?? 2,
            card.arrowShadowBlur ?? 8,
            card.arrowShadowSpread ?? 0,
            card.arrowShadowColor || "rgba(16,27,52,0.08)"
        )

        // Featured cards keep their badge and lift animation without a border ring.
        const withRing = (s: string) => s

        const buttonBg = card.buttonBgColor || backText
        const buttonFont = card.buttonFontColor || backBg
        const buttonHoverBg = card.buttonHoverBgColor || backBg
        const buttonHoverFont = card.buttonHoverFontColor || backText
        const buttonBorder = card.buttonBorderColor || backText
        const buttonHoverBorder = card.buttonHoverBorderColor || backBg

        const hasButtonLink = !!card.buttonLink
        const linkSafetyProps =
            hasButtonLink && isExternalLink(card.buttonLink)
                ? { target: "_blank" as const, rel: "noopener noreferrer" }
                : {}

        const footerCss: React.CSSProperties = {
            ...footerStyle,
            color: frontText,
            textTransform:
                (footerStyle.textTransform as any) ?? footerTransform,
        }

        const frontArrow = (
            <span className="fc-flip-control">
                {onFlip && <span className="fc-flip-label">View details</span>}
                <span
                    className="fc-arrow"
                    role={onFlip ? "button" : undefined}
                    tabIndex={onFlip ? 0 : undefined}
                    aria-label={
                        onFlip ? `Show details for ${card.title}` : undefined
                    }
                    style={{
                        background: fArrowBg,
                        color: fArrowColor,
                        boxShadow: arrowShadow,
                        cursor: onFlip ? "pointer" : "default",
                        position: "relative",
                    }}
                    onClick={(e) => {
                        if (onFlip) {
                            e.preventDefault()
                            e.stopPropagation()
                            onFlip()
                        }
                    }}
                    onKeyDown={(e) => {
                        if (onFlip && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault()
                            onFlip()
                        }
                    }}
                >
                    {ARROW_SVG}
                    {onFlip && (
                        <div className="fc-mobile-tooltip">
                            Tap to see what's included
                        </div>
                    )}
                </span>
            </span>
        )

        if (side === "front") {
            return (
                <div
                    className={`fc-face fc-front${shouldShowImage(card, "front") ? " fc-has-image" : ""}`}
                    style={{
                        ...getFaceBackgroundStyle(card, frontBg, "front"),
                        color: frontText,
                        boxShadow: withRing(baseShadow),
                        zIndex: isFlipped ? 0 : 2,
                    }}
                    onPointerEnter={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                            withRing(hoverShadow)
                    }}
                    onPointerLeave={(e) => {
                        ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                            withRing(baseShadow)
                    }}
                >
                    {renderImageOverlay(card, "front")}
                    {renderFrontHeader(card, frontText, icoColor, frontBg)}
                    {(card.introTextPlacement === "front" ||
                        card.introTextPlacement === "both") &&
                        card.description && (
                            <p
                                style={{
                                    ...descriptionStyle,
                                    color:
                                        opaqueColor(card.introTextColor) ||
                                        frontText,
                                    position: "relative",
                                    zIndex: 2,
                                    maxWidth: "60ch",
                                    marginTop: 16,
                                }}
                            >
                                {card.description}
                            </p>
                        )}
                    <div
                        className={`fc-front-bottom${card.frontLayout === "badge-prominent" ? " fc-front-bottom-centered" : ""}`}
                    >
                        {renderPrice(card, frontText, frontBg)}
                        {hasButtonLink ? (
                            <a
                                href={card.buttonLink}
                                className="fc-front-footer"
                                style={{
                                    ...footerCss,
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                }}
                                {...linkSafetyProps}
                            >
                                <span>{card.frontFooterText}</span>
                                {frontArrow}
                            </a>
                        ) : (
                            <div className="fc-front-footer" style={footerCss}>
                                <span>{card.frontFooterText}</span>
                                {frontArrow}
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return (
            <div
                className={`fc-face fc-back${shouldShowImage(card, "back") ? " fc-has-image" : ""}`}
                style={{
                    ...getFaceBackgroundStyle(card, backBg, "back"),
                    color: backText,
                    boxShadow: withRing(baseShadow),
                    zIndex: isFlipped ? 2 : 0,
                }}
                onPointerEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                        withRing(hoverShadow)
                }}
                onPointerLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow =
                        withRing(baseShadow)
                }}
            >
                {renderImageOverlay(card, "back")}
                <div className="fc-back-header">
                    <h3
                        style={{
                            ...titleStyle,
                            color: backText,
                            textTransform:
                                (titleStyle.textTransform as any) ??
                                headerTransform,
                        }}
                    >
                        {card.title}
                    </h3>
                </div>
                <div className="fc-back-content">
                    {(card.introTextPlacement === "back" ||
                        card.introTextPlacement === "both") &&
                        card.description && (
                            <p
                                style={{
                                    ...descriptionStyle,
                                    color:
                                        opaqueColor(card.introTextColor) ||
                                        backText,
                                    position: "relative",
                                    zIndex: 2,
                                    maxWidth: "60ch",
                                    marginBottom:
                                        card.services?.length > 0 ? 16 : 0,
                                }}
                            >
                                {card.description}
                            </p>
                        )}
                    {card.services?.map((service: string, idx: number) => (
                        <div
                            key={idx}
                            className="fc-service"
                            style={{
                                ...serviceStyle,
                                color: svcColor,
                                textTransform:
                                    (serviceStyle.textTransform as any) ??
                                    serviceTransform,
                            }}
                        >
                            {renderServiceIcon(card, svcDotColor)}
                            <span>{service}</span>
                        </div>
                    ))}
                </div>
                <div
                    className="fc-back-footer"
                    style={{
                        ...footerStyle,
                        color: backText,
                        textTransform:
                            (footerStyle.textTransform as any) ??
                            footerTransform,
                    }}
                >
                    <div className="fc-back-footer-left">
                        {hasButtonLink ? (
                            <CardButton
                                text={card.buttonText || "Book a call"}
                                link={card.buttonLink}
                                isStatic={isStatic}
                                buttonStyle={card.buttonStyle}
                                bgColor={buttonBg}
                                fontColor={buttonFont}
                                hoverBgColor={buttonHoverBg}
                                hoverFontColor={buttonHoverFont}
                                borderColor={buttonBorder}
                                hoverBorderColor={buttonHoverBorder}
                                borderRadius={card.buttonBorderRadius}
                                paddingX={card.buttonPaddingX}
                                paddingY={card.buttonPaddingY}
                                textTransform={card.buttonTextTransform}
                            />
                        ) : null}
                    </div>
                    <div className="fc-back-footer-right">
                        <span className="fc-flip-control">
                            {onFlip && (
                                <span className="fc-flip-label">
                                    Back to overview
                                </span>
                            )}
                            <span
                                className="fc-arrow"
                                role={onFlip ? "button" : undefined}
                                tabIndex={onFlip ? 0 : undefined}
                                aria-label={
                                    onFlip ? `Back to ${card.title}` : undefined
                                }
                                style={{
                                    background: bArrowBg,
                                    color: bArrowColor,
                                    boxShadow: arrowShadow,
                                    cursor: onFlip ? "pointer" : "default",
                                }}
                                onClick={(e) => {
                                    if (onFlip) {
                                        e.stopPropagation()
                                        onFlip()
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (
                                        onFlip &&
                                        (e.key === "Enter" || e.key === " ")
                                    ) {
                                        e.preventDefault()
                                        onFlip()
                                    }
                                }}
                            >
                                {ARROW_SVG}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`fc-root${isStatic ? " fc-static" : ""}`}
            ref={rootRef}
            style={
                {
                    "--fc-accent": accentColor,
                    "--fc-card-padding": `${cardPadding}px`,
                    background: backgroundColor,
                } as React.CSSProperties
            }
        >
            <style>{STYLES}</style>
            <div className="fc-sr-only" aria-live="polite" aria-atomic="true">
                {flipAnnouncement}
            </div>

            {/* Desktop */}
            <div className="fc-desktop">
                <div ref={desktopAnimRef} className="fc-animation">
                    <div
                        className="fc-stage"
                        style={{
                            height: cardHeight + 100,
                            minHeight: cardHeight + 100,
                            paddingTop: 0,
                            paddingBottom: 0,
                        }}
                    >
                        <div
                            ref={desktopWrapRef}
                            className="fc-wrap"
                            style={{
                                height: cardHeight,
                                minHeight: cardHeight,
                            }}
                        >
                            {processedCards.map((card: any, i: number) => (
                                <div
                                    key={i}
                                    className="fc-card"
                                    data-featured={
                                        card.isFeatured ? "true" : "false"
                                    }
                                    style={{
                                        width: cardWidth,
                                        height: cardHeight,
                                        ...(isStatic
                                            ? {
                                                  transform: `translate(-50%, -50%) translateX(${(i - (processedCards.length - 1) / 2) * cardDistance}px) rotate(${i < (processedCards.length - 1) / 2 ? -8 : i > (processedCards.length - 1) / 2 ? 8 : 0}deg)`,
                                              }
                                            : {}),
                                    }}
                                >
                                    <div className="fc-inner">
                                        {renderCardFace(card, "front")}
                                        {renderCardFace(card, "back")}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: vertical stack, tap to flip */}
            <div className="fc-mobile">
                <div ref={mobileRef} className="fc-mobile-container">
                    {processedCards.map((card: any, i: number) => {
                        const isFlipped = mobileFlipped[i] || false
                        return (
                            <div key={i} className="fc-mobile-section">
                                <div
                                    className="fc-mobile-card"
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isFlipped}
                                    aria-label={`${isFlipped ? "Show front of" : "Show details for"} ${card.title}`}
                                    style={{
                                        width: `min(${cardWidth}px, 88vw, calc(85vh * ${cardWidth} / ${cardHeight}))`,
                                        height: `min(${cardHeight}px, 82vh, calc(88vw * ${cardHeight} / ${cardWidth}))`,
                                    }}
                                    onClick={(event) => {
                                        const target =
                                            event.target as HTMLElement
                                        if (
                                            target.closest(
                                                "a, button, [role='button']"
                                            ) !== event.currentTarget
                                        )
                                            return
                                        setMobileCardFlipped(
                                            i,
                                            !isFlipped,
                                            card.title
                                        )
                                    }}
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === "Enter" ||
                                            event.key === " "
                                        ) {
                                            event.preventDefault()
                                            setMobileCardFlipped(
                                                i,
                                                !isFlipped,
                                                card.title
                                            )
                                        }
                                    }}
                                >
                                    <div
                                        className="fc-mobile-inner"
                                        style={{
                                            transform: isFlipped
                                                ? "rotateY(180deg)"
                                                : "rotateY(0deg)",
                                        }}
                                    >
                                        {renderCardFace(
                                            card,
                                            "front",
                                            () =>
                                                setMobileCardFlipped(
                                                    i,
                                                    true,
                                                    card.title
                                                ),
                                            isFlipped
                                        )}
                                        {renderCardFace(
                                            card,
                                            "back",
                                            () =>
                                                setMobileCardFlipped(
                                                    i,
                                                    false,
                                                    card.title
                                                ),
                                            isFlipped
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* ---------- Property controls ---------- */
/*
 * Panel layout (kept short on purpose):
 *   Cards → each card has: Title, Intro Text, Included Items, Front Layout,
 *           then collapsible groups: Price, Highlight, Icon, Background Image,
 *           Button, Small Text, Colors.
 *   Then global Look, Typography and Motion settings.
 */

const iconOptionTitles = ICON_KEYS.map(
    (k) => k.charAt(0).toUpperCase() + k.slice(1)
).concat(["Custom"])
const badgeIconOptions = Object.keys(BADGE_ICONS).concat(["none"])
const badgeIconTitles = badgeIconOptions.map((k) =>
    k === "none" ? "No icon" : k.charAt(0).toUpperCase() + k.slice(1)
)

const group = (title: string, controls: any) => ({
    type: ControlType.Object,
    title,
    controls,
})

const segmented = (
    title: string,
    options: string[],
    optionTitles: string[],
    defaultValue: string,
    extra: any = {}
) => ({
    type: ControlType.Enum,
    title,
    options,
    optionTitles,
    defaultValue,
    displaySegmentedControl: true,
    ...extra,
})

const px = (
    title: string,
    defaultValue: number,
    min: number,
    max: number,
    extra: any = {}
) => ({
    type: ControlType.Number,
    title,
    defaultValue,
    min,
    max,
    step: 1,
    unit: "px",
    displayStepper: true,
    ...extra,
})

const CARD_DEFAULTS: any = {
    title: "Strategy",
    description: "",
    introTextColor: undefined,
    introTextPlacement: "back",
    services: [
        "Market research",
        "Competitor analysis",
        "Strategic planning",
        "Growth roadmap",
    ],
    frontLayout: "standard",
    price: {
        show: true,
        monthly: "$49",
        yearly: "$490",
        label: "Starting from",
        period: "",
        toggle: true,
    },
    featured: {
        enabled: false,
        text: "Most popular",
        icon: "star",
        style: "filled",
        animation: "none",
    },
    icon: { type: "strategy", size: 24, shape: "square" },
    image: { showOn: "none", darken: 45 },
    button: {
        label: "Book a call",
        link: "#",
        style: "filled",
        uppercase: false,
        radius: 100,
    },
    labels: {
        preview: "What's included",
        front: "See what's included",
        back: "",
    },
    theme: { front: "light", back: "dark" },
}

/** Merges nested groups one level deep so overrides stay short. */
const makeCard = (o: Partial<FlipCardInput>) => {
    const out: any = { ...CARD_DEFAULTS }
    Object.keys(o).forEach((k) => {
        const v = o[k]
        out[k] =
            v && typeof v === "object" && !Array.isArray(v)
                ? { ...CARD_DEFAULTS[k], ...v }
                : v
    })
    return out
}

addPropertyControls(FlipCards, {
    cards: {
        type: ControlType.Array,
        title: "Cards",
        description:
            "Add, remove or reorder cards. Each one flips to show its included items.",
        control: {
            type: ControlType.Object,
            title: "Card",
            controls: {
                title: {
                    type: ControlType.String,
                    defaultValue: "Strategy",
                    title: "Title",
                },
                description: {
                    type: ControlType.String,
                    defaultValue: "",
                    title: "Intro Text",
                    displayTextArea: true,
                    placeholder: "Optional intro text.",
                },
                introTextPlacement: {
                    type: ControlType.Enum,
                    defaultValue: "back",
                    options: ["front", "back", "both", "none"],
                    optionTitles: ["Front", "Back", "Both", "None"],
                    title: "Show Intro On",
                    displaySegmentedControl: true,
                },
                introTextColor: {
                    type: ControlType.Color,
                    title: "Intro Text Color",
                    optional: true,
                    description: "Uses the face text color when empty.",
                },
                services: {
                    type: ControlType.Array,
                    title: "Included Items",
                    control: {
                        type: ControlType.String,
                        defaultValue: "New item",
                    },
                    defaultValue: CARD_DEFAULTS.services,
                },
                frontLayout: {
                    type: ControlType.Enum,
                    defaultValue: "standard",
                    options: ["standard", "image-first", "badge-prominent"],
                    optionTitles: [
                        "Standard",
                        "Image on top",
                        "Centered with badge",
                    ],
                    title: "Front Layout",
                },

                price: group("Price", {
                    show: {
                        type: ControlType.Boolean,
                        defaultValue: true,
                        title: "Show Price",
                        enabledTitle: "Yes",
                        disabledTitle: "No",
                    },
                    monthly: {
                        type: ControlType.String,
                        defaultValue: "$49",
                        title: "Monthly",
                        hidden: (p: any) => !p.show,
                    },
                    yearly: {
                        type: ControlType.String,
                        defaultValue: "$490",
                        title: "Yearly",
                        hidden: (p: any) => !p.show,
                    },
                    label: {
                        type: ControlType.String,
                        defaultValue: "Starting from",
                        title: "Text Above",
                        hidden: (p: any) => !p.show,
                    },
                    period: {
                        type: ControlType.String,
                        defaultValue: "",
                        title: "Text After",
                        placeholder: "/mo or /yr (automatic)",
                        description:
                            "Leave empty to show /mo or /yr automatically.",
                        hidden: (p: any) => !p.show,
                    },
                    toggle: {
                        type: ControlType.Boolean,
                        defaultValue: true,
                        title: "Monthly / Yearly Switch",
                        description:
                            "Visitors can switch every card between monthly and yearly.",
                        enabledTitle: "Show",
                        disabledTitle: "Hide",
                        hidden: (p: any) => !p.show,
                    },
                }),

                featured: group("Highlight", {
                    enabled: {
                        type: ControlType.Boolean,
                        defaultValue: false,
                        title: "Highlight Card",
                        description:
                            "Adds a colored ring and a badge, and lifts the card after it flips.",
                        enabledTitle: "Yes",
                        disabledTitle: "No",
                    },
                    text: {
                        type: ControlType.String,
                        defaultValue: "Most popular",
                        title: "Badge Text",
                        hidden: (p: any) => !p.enabled,
                    },
                    position: {
                        type: ControlType.Enum,
                        defaultValue: "top-center",
                        options: ["top-center", "top-right"],
                        optionTitles: ["Top Center", "Top Right"],
                        title: "Badge Position",
                        displaySegmentedControl: true,
                        hidden: (p: any) => !p.enabled,
                    },
                    icon: {
                        type: ControlType.Enum,
                        defaultValue: "star",
                        options: badgeIconOptions,
                        optionTitles: badgeIconTitles,
                        title: "Badge Icon",
                        hidden: (p: any) => !p.enabled,
                    },
                    style: segmented(
                        "Badge Style",
                        ["filled", "outline", "ghost"],
                        ["Filled", "Outline", "Plain"],
                        "filled",
                        {
                            hidden: (p: any) => !p.enabled,
                        }
                    ),
                    radius: px("Badge Border Radius", 100, 0, 100, {
                        description:
                            "Controls how rounded the badge corners are.",
                        hidden: (p: any) => !p.enabled,
                    }),
                    shadow: {
                        type: ControlType.Boolean,
                        title: "Enable Badge Shadow",
                        defaultValue: false,
                        enabledTitle: "On",
                        disabledTitle: "Off",
                        hidden: (p: any) => !p.enabled,
                    },
                    uppercase: {
                        type: ControlType.Boolean,
                        title: "Badge Text Uppercase",
                        defaultValue: false,
                        enabledTitle: "Uppercase",
                        disabledTitle: "Original",
                        hidden: (p: any) => !p.enabled,
                    },
                    animation: segmented(
                        "Badge Motion",
                        ["none", "pulse", "bounce"],
                        ["None", "Pulse", "Bounce"],
                        "none",
                        {
                            hidden: (p: any) => !p.enabled,
                        }
                    ),
                    color: {
                        type: ControlType.Color,
                        title: "Badge Color",
                        optional: true,
                        description: "Uses your accent color when empty.",
                        hidden: (p: any) => !p.enabled,
                    },
                    textColor: {
                        type: ControlType.Color,
                        title: "Badge Text Color",
                        optional: true,
                        description: "White when empty.",
                        hidden: (p: any) => !p.enabled,
                    },
                }),

                icon: group("Icon", {
                    type: {
                        type: ControlType.Enum,
                        defaultValue: "strategy",
                        options: ICON_KEYS.concat(["custom"]),
                        optionTitles: iconOptionTitles,
                        title: "Icon",
                    },
                    file: {
                        type: ControlType.File,
                        title: "Upload Icon",
                        allowedFileTypes: ["svg", "png", "jpg", "jpeg", "webp"],
                        hidden: (p: any) => p.type !== "custom",
                    },
                    svg: {
                        type: ControlType.String,
                        defaultValue: "",
                        title: "Or Paste SVG",
                        displayTextArea: true,
                        placeholder: "<svg viewBox='0 0 24 24'>...</svg>",
                        description:
                            "SVG is sanitized: scripts, event handlers, external URLs and unsafe elements are removed.",
                        hidden: (p: any) => p.type !== "custom",
                    },
                    size: px("Size", 24, 12, 80),
                    shape: segmented(
                        "Background",
                        ["none", "circle", "square"],
                        ["None", "Circle", "Square"],
                        "square"
                    ),
                    shapeBg: {
                        type: ControlType.Color,
                        title: "Background Color",
                        defaultValue: "rgba(16,27,52,0.07)",
                        hidden: (p: any) => p.shape === "none",
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        optional: true,
                        description: "Matches the card text when empty.",
                    },
                }),

                serviceIcon: group("Service List Icon", {
                    type: {
                        type: ControlType.Enum,
                        defaultValue: "dot",
                        options: [
                            "dot",
                            "check",
                            "arrow",
                            "star",
                            "custom",
                            "none",
                        ],
                        optionTitles: [
                            "Dash",
                            "Check",
                            "Arrow",
                            "Star",
                            "Custom",
                            "None",
                        ],
                        title: "Icon",
                    },
                    size: px("Size", 10, 4, 28),
                    shape: segmented(
                        "Background",
                        ["none", "circle", "square"],
                        ["None", "Circle", "Square"],
                        "none"
                    ),
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        optional: true,
                        description: "Uses the service text color when empty.",
                    },
                    file: {
                        type: ControlType.File,
                        title: "Upload Icon",
                        allowedFileTypes: ["svg", "png", "jpg", "jpeg", "webp"],
                        hidden: (p: any) => p.type !== "custom",
                    },
                    svg: {
                        type: ControlType.String,
                        defaultValue: "",
                        title: "Or Paste SVG",
                        displayTextArea: true,
                        placeholder: "<svg viewBox='0 0 24 24'>...</svg>",
                        description: "SVG is sanitized before rendering.",
                        hidden: (p: any) => p.type !== "custom",
                    },
                }),

                image: group("Background Image", {
                    src: { type: ControlType.Image, title: "Image" },
                    showOn: {
                        type: ControlType.Enum,
                        defaultValue: "none",
                        options: ["none", "front", "back", "both"],
                        optionTitles: ["Off", "Front", "Back", "Both sides"],
                        title: "Show On",
                        description:
                            "With the “Image on top” layout, the image appears inline on the front instead.",
                    },
                    darken: {
                        type: ControlType.Number,
                        defaultValue: 45,
                        min: 0,
                        max: 100,
                        step: 5,
                        unit: "%",
                        displayStepper: true,
                        title: "Darken",
                        description: "Makes text easier to read over photos.",
                        hidden: (p: any) => !p.showOn || p.showOn === "none",
                    },
                    overlay: {
                        type: ControlType.Color,
                        title: "Darken Color",
                        optional: true,
                        hidden: (p: any) => !p.showOn || p.showOn === "none",
                    },
                }),

                button: group("Button", {
                    label: {
                        type: ControlType.String,
                        defaultValue: "Book a call",
                        title: "Label",
                    },
                    link: {
                        type: ControlType.Link,
                        title: "Link",
                        description: "Leave empty to hide the button.",
                    },
                    style: segmented(
                        "Style",
                        ["filled", "outline", "ghost"],
                        ["Filled", "Outline", "Text"],
                        "filled"
                    ),
                    uppercase: {
                        type: ControlType.Boolean,
                        title: "Uppercase Text",
                        defaultValue: false,
                        enabledTitle: "Uppercase",
                        disabledTitle: "Original",
                    },
                    radius: px("Roundness", 100, 0, 100),
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        optional: true,
                    },
                    textColor: {
                        type: ControlType.Color,
                        title: "Text Color",
                        optional: true,
                    },
                }),

                labels: group("Small Text", {
                    preview: {
                        type: ControlType.String,
                        defaultValue: "What's included",
                        title: "Back Heading",
                    },
                    front: {
                        type: ControlType.String,
                        defaultValue: "See what's included",
                        title: "Front Hint",
                    },
                    back: {
                        type: ControlType.String,
                        defaultValue: "",
                        title: "Back Footer",
                        description:
                            "Only shown when the card has no button link.",
                    },
                }),

                theme: group("Colors", {
                    front: segmented(
                        "Front Side",
                        ["light", "dark", "custom"],
                        ["Light", "Dark", "Custom"],
                        "light"
                    ),
                    frontBg: {
                        type: ControlType.Color,
                        title: "Front Background",
                        hidden: (p: any) => p.front !== "custom",
                    },
                    frontText: {
                        type: ControlType.Color,
                        title: "Front Text",
                        hidden: (p: any) => p.front !== "custom",
                    },
                    back: segmented(
                        "Back Side",
                        ["light", "dark", "custom"],
                        ["Light", "Dark", "Custom"],
                        "dark"
                    ),
                    backBg: {
                        type: ControlType.Color,
                        title: "Back Background",
                        hidden: (p: any) => p.back !== "custom",
                    },
                    backText: {
                        type: ControlType.Color,
                        title: "Back Text",
                        hidden: (p: any) => p.back !== "custom",
                    },
                }),
            },
        },
        defaultValue: [
            makeCard({
                introTextColor: "#5A3B2E",
                theme: {
                    front: "custom",
                    frontBg: "#FFF4E8",
                    frontText: "#3A2416",
                    back: "custom",
                    backBg: "#3A2416",
                    backText: "#FFF4E8",
                },
            }),
            makeCard({
                title: "Design",
                introTextColor: "#294C78",
                frontLayout: "badge-prominent",
                services: [
                    "UI/UX design",
                    "Visual design",
                    "Responsive layout",
                    "Brand identity",
                ],
                price: { monthly: "$79", yearly: "$790" },
                featured: { enabled: true, icon: "fire", animation: "pulse" },
                icon: { type: "design" },
                theme: {
                    front: "custom",
                    frontBg: "#EAF0FF",
                    frontText: "#183B68",
                    back: "custom",
                    backBg: "#183B68",
                    backText: "#EAF0FF",
                },
            }),
            makeCard({
                title: "Build",
                introTextColor: "#216A4D",
                services: ["Frontend", "Backend", "Performance", "QA testing"],
                price: { monthly: "$99", yearly: "$990" },
                icon: { type: "build" },
                theme: {
                    front: "custom",
                    frontBg: "#E6F6EF",
                    frontText: "#15513A",
                    back: "custom",
                    backBg: "#15513A",
                    backText: "#E6F6EF",
                },
            }),
        ],
    },

    accentColor: {
        type: ControlType.Color,
        defaultValue: ACCENT,
        title: "Accent Color",
        description:
            "Used for the highlighted card's ring, its badge and keyboard focus.",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: PAPER,
        title: "Background Color",
        description: "Uses one solid color behind the card layout.",
    },
    cardPadding: px("Card Padding", 36, 0, 100, {
        description: "Controls the inner spacing on both sides of every card.",
    }),
    scrollStart: segmented(
        "Scroll Start",
        ["top top", "center center"],
        ["Top enters viewport", "Card centered"],
        "center center",
        {
            description:
                "Controls where the scroll-linked card animation begins.",
        }
    ),
    cardBorderRadius: px("Corner Roundness", 12, 0, 60),
    shadowStyle: {
        type: ControlType.Enum,
        defaultValue: "medium",
        options: ["none", "soft", "medium", "strong"],
        optionTitles: ["None", "Soft", "Medium", "Strong"],
        title: "Shadow",
        displaySegmentedControl: true,
        description: "Cards lift a little more on hover.",
    },
    shadowColor: {
        type: ControlType.Color,
        defaultValue: INK,
        title: "Shadow Color",
        hidden: (p: any) => p.shadowStyle === "none",
    },
    showCounter: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Card Numbers",
        description:
            "Shows 01, 02, 03 on each card. Best when the cards are steps in a sequence.",
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    counterColor: {
        type: ControlType.Color,
        title: "Number Color",
        optional: true,
        description: "Matches the card text when empty.",
        hidden: (p: any) => !p.showCounter,
    },
    defaultBilling: segmented(
        "Start On",
        ["monthly", "yearly"],
        ["Monthly", "Yearly"],
        "monthly",
        {
            description: "Which price shows first.",
        }
    ),

    flipDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Item Stagger",
        defaultValue: 0.12,
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: "s",
    },
    featuredLiftEnabled: {
        type: ControlType.Boolean,
        title: "Featured Card Lift",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Lifts the featured card slightly after the deck flips.",
    },
    featuredLift: px("Featured Lift", 18, 0, 60),
    scrub: {
        type: ControlType.Number,
        title: "Scroll Smoothness",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        unit: "s",
        description: "Higher values make scroll-linked motion smoother.",
    },

    typography: group("Typography", {
        titleFont: {
            type: ControlType.Font,
            title: "Headings",
            controls: "extended",
            defaultFontType: "serif",
            defaultValue: {
                fontFamily: "Instrument Serif",
                fontSize: "2.25rem",
                fontWeight: "400",
                letterSpacing: "-0.01em",
                lineHeight: "1.05",
            },
        },
        priceFont: {
            type: ControlType.Font,
            title: "Prices",
            controls: "extended",
            defaultFontType: "serif",
            defaultValue: {
                fontFamily: "Instrument Serif",
                fontSize: "44px",
                fontWeight: "400",
                letterSpacing: "-0.01em",
                lineHeight: "1",
            },
        },
        bodyFont: {
            type: ControlType.Font,
            title: "Body Text",
            controls: "basic",
            defaultFontType: "sans-serif",
            defaultValue: { fontFamily: "Instrument Sans", fontWeight: "400" },
        },
        bodySize: px("Body Size", 15, 12, 20, {
            description: "Labels and footers scale from this size.",
        }),
        uppercaseHeaders: {
            type: ControlType.Boolean,
            defaultValue: false,
            title: "Uppercase Headers",
            description:
                "Applies uppercase styling only to card headings. Other text keeps its original casing.",
            enabledTitle: "On",
            disabledTitle: "Off",
        },
    }),

    cardWidth: px("Card Width", 300, 200, 500, { step: 10 }),
    cardHeight: px("Card Height", 520, 300, 800, { step: 10 }),
    cardDistance: px("Space Between Cards", 420, 200, 800, {
        step: 10,
        description: "Distance between card centers once the cards spread out.",
    }),
    scrollDistance: px("Scroll Length", 1800, 500, 5000, {
        step: 100,
        description:
            "How much the visitor scrolls to play the whole animation. Longer feels slower.",
    }),
})
