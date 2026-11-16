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

import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

type Testimonial = {
    name: string
    role?: string
    company?: string
    quote?: string
    video?: string
    poster?: unknown
    avatar?: unknown
    rating?: number
    tags?: string
    background?: string
    textColor?: string
}

type VideoTypeDesign = {
    eyebrow?: React.CSSProperties
    title?: React.CSSProperties
    body?: React.CSSProperties
    filter?: React.CSSProperties
    quote?: React.CSSProperties
    name?: React.CSSProperties
    role?: React.CSSProperties
    modalQuote?: React.CSSProperties
    fallback?: React.CSSProperties
    empty?: React.CSSProperties
    close?: React.CSSProperties
    initials?: React.CSSProperties
    avatarInitials?: React.CSSProperties
}

type VideoColorDesign = {
    filterBackground?: string
    filterText?: string
    filterBorder?: string
    filterActiveBackground?: string
    filterActiveText?: string
    filterHoverBorder?: string
    cardBorder?: string
    cardHoverBorder?: string
    cardShadow?: string
    cardHoverShadow?: string
    ratingBackground?: string
    playBackground?: string
    playIcon?: string
    quoteColor?: string
    nameColor?: string
    roleColor?: string
    avatarBackground?: string
    avatarText?: string
    emptyColor?: string
    emptyBorder?: string
    mediaGlow?: string
    mediaStart?: string
    mediaEnd?: string
    scrimStart?: string
    scrimEnd?: string
    fallbackInitialsColor?: string
    modalOverlay?: string
    dialogBackground?: string
    dialogBorder?: string
    dialogText?: string
    dialogMuted?: string
    dialogVideoBackground?: string
    dialogQuote?: string
    dialogAvatarBackground?: string
    dialogAvatarText?: string
    closeBackground?: string
    closeBorder?: string
    closeText?: string
    closeHover?: string
    eyebrowColor?: string
    titleColor?: string
    bodyColor?: string
    filterHoverText?: string
    metaBorder?: string
    playShadow?: string
    dialogShadow?: string
}

type VideoLayoutDesign = {
    headerGap?: number
    filtersGap?: number
    filterMarginTop?: number
    gridGap?: number
    gridMarginTop?: number
    borderWidth?: number
    cardHoverLift?: number
    filterRadius?: number
    filterPaddingX?: number
    filterPaddingY?: number
    ratingRadius?: number
    playSize?: number
    avatarSize?: number
    metaPaddingX?: number
    metaPaddingY?: number
    quoteInset?: number
    titleMaxWidth?: number
    subMaxWidth?: number
    emptyPadding?: number
    modalPadding?: number
    modalWidth?: number
    modalRadius?: number
    dialogBodyPadding?: number
    dialogGridColumns?: string
    dialogVideoMaxHeight?: number
    closeSize?: number
    closeOffset?: number
    personGap?: number
}

type VideoLabels = {
    allLabel?: string
    closeGlyph?: string
    emptyText?: string
    dialogFallback?: string
    roleSeparator?: string
    playGlyph?: string
    playIcon?: { src?: string; srcSet?: string; alt?: string }
    closeIcon?: { src?: string; srcSet?: string; alt?: string }
    starGlyph?: string
    starIcon?: { src?: string; srcSet?: string; alt?: string }
}

interface VideoTestimonialWallProps {
    testimonials?: Testimonial[]
    eyebrow?: string
    title?: string
    subtitle?: string
    showEyebrow?: boolean
    showTitle?: boolean
    showSubtitle?: boolean
    labels?: VideoLabels
    columns?: number
    aspect?: "portrait" | "square" | "landscape"
    showFilters?: boolean
    showQuotes?: boolean
    hoverPlay?: boolean
    showRating?: boolean
    background?: string
    cardBackground?: string
    textColor?: string
    mutedColor?: string
    accent?: string
    starColor?: string
    borderColor?: string
    radius?: number
    padding?: number
    font?: React.CSSProperties
    typeDesign?: VideoTypeDesign
    colorDesign?: VideoColorDesign
    layoutDesign?: VideoLayoutDesign
    customCss?: string
    style?: React.CSSProperties
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
    {
        name: "Maya Chen",
        role: "Founder",
        company: "Northline",
        quote: "We replaced three tools with this. The site finally feels like the product we are selling.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        rating: 5,
        tags: "SaaS,Launch",
    },
    {
        name: "Jonas Meyer",
        role: "Creative Director",
        company: "Studio Format",
        quote: "The motion is restrained. It reads as confidence, not decoration — exactly the brief.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        rating: 5,
        tags: "Agency,Design",
    },
    {
        name: "Priya Nair",
        role: "Head of Growth",
        company: "Ledgerly",
        quote: "Our demo requests doubled in the first month. The calculator did the qualifying for us.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        rating: 5,
        tags: "SaaS,Conversion",
    },
    {
        name: "Diego Ramos",
        role: "E-commerce Lead",
        company: "Atelier Nine",
        quote: "Launch week was the calmest we have ever had. Everything just worked on mobile.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        rating: 4,
        tags: "E-commerce,Launch",
    },
    {
        name: "Amelia Hart",
        role: "COO",
        company: "Field & Form",
        quote: "It looks custom. Clients assume we spent six figures, and we let them.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        rating: 5,
        tags: "Agency,Design",
    },
    {
        name: "Noah Williams",
        role: "Product Lead",
        company: "Cadence",
        quote: "The details are the product. Every state, every hover, every edge case was considered.",
        video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        rating: 5,
        tags: "SaaS,Design",
    },
]

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function weightValue(value: unknown): string {
    if (typeof value === "number") return String(value)
    const key = String(value || "")
        .toLowerCase()
        .replace(/\s+/g, "")
    const map: Record<string, number> = {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
    }
    return map[key] ? String(map[key]) : ""
}

function fontCss(
    font: React.CSSProperties | undefined,
    fallback: React.CSSProperties
): string {
    const f = { ...fallback, ...(font || {}) } as Record<string, unknown>
    const size = typeof f.fontSize === "number" ? `${f.fontSize}px` : f.fontSize
    const spacing =
        typeof f.letterSpacing === "number"
            ? `${f.letterSpacing}em`
            : f.letterSpacing
    const weight = weightValue(f.fontWeight ?? f.variant)
    return [
        f.fontFamily ? `font-family: ${f.fontFamily};` : "",
        size ? `font-size: ${size};` : "",
        weight ? `font-weight: ${weight};` : "",
        spacing ? `letter-spacing: ${spacing};` : "",
        f.lineHeight ? `line-height: ${f.lineHeight};` : "",
        f.textAlign ? `text-align: ${f.textAlign};` : "",
        f.fontStyle ? `font-style: ${f.fontStyle};` : "",
    ]
        .filter(Boolean)
        .join(" ")
}

function fontSizeOf(
    font: React.CSSProperties | undefined,
    fallback: number
): number {
    const value = font?.fontSize
    if (typeof value === "number") return value
    if (typeof value === "string") {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : fallback
    }
    return fallback
}

function responsiveSize(
    font: React.CSSProperties | undefined,
    fallback: number,
    min: number,
    vw: number
): string {
    const size = fontSizeOf(font, fallback)
    return size === fallback
        ? `clamp(${min}px, ${vw}vw, ${fallback}px)`
        : `${size}px`
}

function sourceOf(value: unknown): string {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object") {
        const record = value as Record<string, unknown>
        const src = record.src || record.url || record.default
        if (typeof src === "string") return src
    }
    return ""
}

function splitTags(tags?: string): string[] {
    return (tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
}

// Framer fills optional per-item color slots with its placeholder blue when nothing was set —
// deliver it in several forms, so treat every spelling of it as "no override".
function cardColor(value: unknown): string | undefined {
    if (!value) return undefined
    let raw: string | undefined
    if (typeof value === "string") {
        raw = value
    } else if (typeof value === "object") {
        const record = value as Record<string, unknown>
        const candidate = record.value ?? record.color
        if (typeof candidate === "string") raw = candidate
    }
    if (!raw) return undefined
    const v = raw.trim()
    if (!v) return undefined
    const lower = v.toLowerCase()
    if (lower === "#09f" || lower === "#0099ff") return undefined
    if (
        /^rgba?\(\s*0\s*,\s*153\s*,\s*255(?:\s*,\s*1(?:\.0+)?\s*)?\)$/i.test(v)
    ) {
        return undefined
    }
    return v
}

function initials(name: string) {
    return (name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")
}

function Star({
    filled,
    color,
    iconImage,
    glyph,
}: {
    filled: boolean
    color: string
    iconImage?: { src?: string; srcSet?: string; alt?: string }
    glyph?: string
}) {
    if (iconImage?.src) {
        return (
            <img
                src={iconImage.src}
                srcSet={iconImage.srcSet}
                alt={iconImage.alt || ""}
                width={13}
                height={13}
                style={{
                    display: "block",
                    opacity: filled ? 1 : 0.35,
                    filter: filled ? "none" : "grayscale(1)",
                }}
            />
        )
    }
    if (glyph) {
        return (
            <span
                aria-hidden="true"
                style={{
                    display: "block",
                    fontSize: 13,
                    lineHeight: "13px",
                    color,
                    opacity: filled ? 1 : 0.35,
                }}
            >
                {glyph}
            </span>
        )
    }
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ display: "block" }}
        >
            <path
                d="M12 3.2l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8L12 3.2z"
                fill={filled ? color : "none"}
                stroke={color}
                strokeWidth="1.4"
                strokeLinejoin="round"
                opacity={filled ? 1 : 0.35}
            />
        </svg>
    )
}

function Rating({
    value,
    color,
    iconImage,
    glyph,
}: {
    value: number
    color: string
    iconImage?: { src?: string; srcSet?: string; alt?: string }
    glyph?: string
}) {
    const rounded = Math.round(clamp(value, 0, 5))
    return (
        <div
            style={{ display: "flex", gap: 2 }}
            aria-label={`${rounded} out of 5 stars`}
        >
            {[1, 2, 3, 4, 5].map((index) => (
                <Star
                    key={index}
                    filled={index <= rounded}
                    color={color}
                    iconImage={iconImage}
                    glyph={glyph}
                />
            ))}
        </div>
    )
}

/**
 * Video Testimonial Wall
 *
 * A responsive wall of muted, looping video testimonials with tag filters,
 * ratings, and a full-screen player.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1120
 * @framerIntrinsicHeight 780
 * @framerDisableUnlink
 */
export default function VideoTestimonialWall(props: VideoTestimonialWallProps) {
    const {
        testimonials: testimonialsProp,
        eyebrow = "PROOF, IN THEIR WORDS",
        title = "People do not read testimonials. They watch them.",
        subtitle = "Short clips, real customers, zero script. Add your own videos in the Framer panel.",
        labels,
        showEyebrow = true,
        showTitle = true,
        showSubtitle = true,
        columns = 3,
        aspect = "portrait",
        showFilters = true,
        showQuotes = true,
        hoverPlay = true,
        showRating = true,
        background = "#0B0D12",
        cardBackground = "#151923",
        textColor = "#FFFFFF",
        mutedColor = "rgba(255,255,255,0.62)",
        accent = "#8DA6FF",
        starColor = "#F5C451",
        borderColor = "rgba(255,255,255,0.10)",
        radius = 20,
        padding = 28,
        font = {},
        typeDesign,
        colorDesign,
        layoutDesign,
        customCss = "",
        style,
    } = props

    const allLabel = labels?.allLabel ?? "All"
    const closeGlyph = labels?.closeGlyph ?? "✕"
    const emptyText = labels?.emptyText ?? "No testimonials in this filter yet."
    const dialogFallbackText =
        labels?.dialogFallback ?? "Add a video or poster to this testimonial."
    const roleSeparator = labels?.roleSeparator ?? "·"
    const playGlyph = labels?.playGlyph ?? ""
    const playIconImage = labels?.playIcon
    const closeIconImage = labels?.closeIcon
    const starGlyph = labels?.starGlyph ?? ""
    const starIconImage = labels?.starIcon

    const testimonials =
        Array.isArray(testimonialsProp) && testimonialsProp.length
            ? testimonialsProp
            : DEFAULT_TESTIMONIALS
    const isStatic = useIsStaticRenderer()
    const reduceMotion = useReducedMotion() === true
    const [activeTag, setActiveTag] = React.useState(allLabel)
    const [openIndex, setOpenIndex] = React.useState<number | null>(null)

    const tagList = React.useMemo(() => {
        const set = new Set<string>()
        for (const testimonial of testimonials) {
            for (const tag of splitTags(testimonial.tags)) set.add(tag)
        }
        return [allLabel, ...Array.from(set)]
    }, [testimonials])

    const visible = React.useMemo(() => {
        if (activeTag === allLabel) return testimonials
        return testimonials.filter((testimonial) =>
            splitTags(testimonial.tags).includes(activeTag)
        )
    }, [testimonials, activeTag])

    const active = openIndex !== null ? visible[openIndex] || null : null

    React.useEffect(() => {
        if (openIndex === null || typeof document === "undefined") return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenIndex(null)
        }
        window.addEventListener("keydown", onKey)
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = ""
        }
    }, [openIndex])

    const play = (element: HTMLElement | null) => {
        const video = element?.querySelector("video")
        if (video) video.play().catch(() => undefined)
    }

    const pause = (element: HTMLElement | null) => {
        const video = element?.querySelector("video")
        if (video) video.pause()
    }

    const safeColumns = Math.round(clamp(columns, 1, 4))
    const safeRadius = clamp(radius, 0, 40)
    const safePadding = clamp(padding, 16, 64)

    // Normalize the aspect value — the panel may store either the enum value or its display title.
    const aspectValue = String(aspect || "").toLowerCase()
    const aspectKey = aspectValue.startsWith("portrait")
        ? "portrait"
        : aspectValue.startsWith("square")
          ? "square"
          : aspectValue.startsWith("landscape")
            ? "landscape"
            : "portrait"

    const filterBackground = colorDesign?.filterBackground || "rgba(0,0,0,0)"
    const filterText = colorDesign?.filterText || mutedColor
    const filterBorder = colorDesign?.filterBorder || borderColor
    const filterActiveBackground =
        colorDesign?.filterActiveBackground || textColor
    const filterActiveText = colorDesign?.filterActiveText || background
    const filterHoverBorder = colorDesign?.filterHoverBorder || `${accent}66`
    const cardBorder = colorDesign?.cardBorder || borderColor
    const cardHoverBorder = colorDesign?.cardHoverBorder || `${accent}55`
    const cardShadow = colorDesign?.cardShadow || "none"
    const cardHoverShadow =
        colorDesign?.cardHoverShadow || "0 26px 60px -30px rgba(0,0,0,.75)"
    const ratingBackground =
        colorDesign?.ratingBackground || "rgba(8,10,14,.55)"
    const playBackground =
        colorDesign?.playBackground || "rgba(255,255,255,.94)"
    const playIcon = colorDesign?.playIcon || "#0B0D12"
    const quoteColor = colorDesign?.quoteColor || "#FFFFFF"
    const nameColor = colorDesign?.nameColor || textColor
    const roleColor = colorDesign?.roleColor || mutedColor
    const avatarBackground = colorDesign?.avatarBackground || `${accent}1F`
    const avatarText = colorDesign?.avatarText || accent
    const emptyColor = colorDesign?.emptyColor || mutedColor
    const emptyBorder = colorDesign?.emptyBorder || borderColor
    const mediaGlow = colorDesign?.mediaGlow || `${accent}33`
    const mediaStart = colorDesign?.mediaStart || "#1D2430"
    const mediaEnd = colorDesign?.mediaEnd || "#0E1118"
    const scrimStart = colorDesign?.scrimStart || "rgba(0,0,0,0)"
    const scrimEnd = colorDesign?.scrimEnd || "rgba(0,0,0,0.72)"
    const fallbackInitialsColor =
        colorDesign?.fallbackInitialsColor || "rgba(255,255,255,0.86)"
    const modalOverlay = colorDesign?.modalOverlay || "rgba(4,6,10,0.78)"
    const dialogBackground = colorDesign?.dialogBackground || "#0E1117"
    const dialogBorder = colorDesign?.dialogBorder || "rgba(255,255,255,0.12)"
    const dialogText = colorDesign?.dialogText || "#FFFFFF"
    const dialogMuted = colorDesign?.dialogMuted || "rgba(255,255,255,0.6)"
    const dialogVideoBackground =
        colorDesign?.dialogVideoBackground || "#05070A"
    const dialogQuote = colorDesign?.dialogQuote || "#FFFFFF"
    const dialogAvatarBackground =
        colorDesign?.dialogAvatarBackground || `${accent}22`
    const dialogAvatarText = colorDesign?.dialogAvatarText || accent
    const closeBackground = colorDesign?.closeBackground || "rgba(8,10,14,.7)"
    const closeBorder = colorDesign?.closeBorder || "rgba(255,255,255,.18)"
    const closeText = colorDesign?.closeText || "#FFFFFF"
    const closeHover = colorDesign?.closeHover || "rgba(255,255,255,.14)"
    const eyebrowColor = colorDesign?.eyebrowColor || accent
    const titleColor = colorDesign?.titleColor || textColor
    const bodyColor = colorDesign?.bodyColor || mutedColor
    const filterHoverText = colorDesign?.filterHoverText || textColor
    const metaBorder = colorDesign?.metaBorder || borderColor
    const playShadow = colorDesign?.playShadow || "0 6px 18px rgba(0,0,0,.35)"
    const dialogShadow = colorDesign?.dialogShadow || "0 60px 140px -40px #000"

    const headerGap = layoutDesign?.headerGap ?? 28
    const filtersGap = layoutDesign?.filtersGap ?? 6
    const filterMarginTop = layoutDesign?.filterMarginTop ?? 22
    const gridGap = layoutDesign?.gridGap ?? 14
    const gridMarginTop = layoutDesign?.gridMarginTop ?? 30
    const borderWidth = layoutDesign?.borderWidth ?? 1
    const cardHoverLift = layoutDesign?.cardHoverLift ?? 3
    const filterRadius = layoutDesign?.filterRadius ?? 99
    const filterPaddingX = layoutDesign?.filterPaddingX ?? 13
    const filterPaddingY = layoutDesign?.filterPaddingY ?? 8
    const ratingRadius = layoutDesign?.ratingRadius ?? 8
    const playSize = layoutDesign?.playSize ?? 34
    const avatarSize = layoutDesign?.avatarSize ?? 30
    const metaPaddingX = layoutDesign?.metaPaddingX ?? 14
    const metaPaddingY = layoutDesign?.metaPaddingY ?? 13
    const quoteInset = layoutDesign?.quoteInset ?? 14
    const titleMaxWidth = layoutDesign?.titleMaxWidth ?? 720
    const subMaxWidth = layoutDesign?.subMaxWidth ?? 520
    const emptyPadding = layoutDesign?.emptyPadding ?? 64
    const modalPadding = layoutDesign?.modalPadding ?? 24
    const modalWidth = layoutDesign?.modalWidth ?? 1000
    const modalRadius = layoutDesign?.modalRadius ?? 22
    const dialogBodyPadding = layoutDesign?.dialogBodyPadding ?? 30
    const dialogGridColumns = layoutDesign?.dialogGridColumns || "1.35fr .85fr"
    const dialogVideoMaxHeight = layoutDesign?.dialogVideoMaxHeight ?? 72
    const closeSize = layoutDesign?.closeSize ?? 34
    const closeOffset = layoutDesign?.closeOffset ?? 12
    const personGap = layoutDesign?.personGap ?? 11

    const designCss = `
        .orix-vwall-header { gap: ${headerGap}px; }
        .orix-vwall-eyebrow { ${fontCss(typeDesign?.eyebrow, { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", lineHeight: 1.2 })} color: ${eyebrowColor}; }
        .orix-vwall-title { max-width: ${titleMaxWidth}px; ${fontCss(typeDesign?.title, { fontSize: 44, fontWeight: 680, letterSpacing: "-.045em", lineHeight: 1.02 })} font-size: ${responsiveSize(typeDesign?.title, 44, 26, 4)}; color: ${titleColor}; }
        .orix-vwall-sub { max-width: ${subMaxWidth}px; ${fontCss(typeDesign?.body, { fontSize: 14, fontWeight: 400, lineHeight: 1.55 })} color: ${bodyColor}; }
        .orix-vwall-filters { gap: ${filtersGap}px; margin-top: ${filterMarginTop}px; }
        .orix-vwall-filter { ${fontCss(typeDesign?.filter, { fontSize: 12, fontWeight: 600, lineHeight: 1.2 })} background: ${filterBackground}; color: ${filterText}; border-color: ${filterBorder}; border-width: ${borderWidth}px; border-radius: ${filterRadius}px; padding: ${filterPaddingY}px ${filterPaddingX}px; }
        .orix-vwall-filter:hover { color: ${filterHoverText}; border-color: ${filterHoverBorder}; }
        .orix-vwall-filter[data-active="true"] { background: ${filterActiveBackground}; color: ${filterActiveText}; border-color: ${filterActiveBackground}; }
        .orix-vwall-grid { gap: ${gridGap}px; margin-top: ${gridMarginTop}px; }
        .orix-vwall-card { border-width: ${borderWidth}px; border-color: ${cardBorder}; box-shadow: ${cardShadow}; }
        .orix-vwall-card:hover { transform: translateY(-${cardHoverLift}px); border-color: ${cardHoverBorder}; box-shadow: ${cardHoverShadow}; }
        .orix-vwall-media { background: radial-gradient(120% 120% at 20% 0%, ${mediaGlow} 0%, transparent 55%), linear-gradient(160deg, ${mediaStart}, ${mediaEnd}); }
        .orix-vwall-fallback-initials { ${typeDesign?.initials ? fontCss(typeDesign.initials, {}) : ""} font-size: ${typeDesign?.initials && fontSizeOf(typeDesign.initials, 44) !== 44 ? `${fontSizeOf(typeDesign.initials, 44)}px` : "clamp(26px, 5vw, 44px)"}; color: ${fallbackInitialsColor}; opacity: .9; }
        .orix-vwall-scrim { background: linear-gradient(180deg, ${scrimStart} 32%, ${scrimEnd} 100%); }
        .orix-vwall-rating { background: ${ratingBackground}; border-radius: ${ratingRadius}px; }
        .orix-vwall-play { width: ${playSize}px; height: ${playSize}px; background: ${playBackground}; color: ${playIcon}; box-shadow: ${playShadow}; }
        .orix-vwall-quote { ${fontCss(typeDesign?.quote, { fontSize: 13, fontWeight: 500, lineHeight: 1.45 })} left: ${quoteInset}px; right: ${quoteInset}px; bottom: ${quoteInset}px; color: ${quoteColor}; }
        .orix-vwall-meta { padding: ${metaPaddingY}px ${metaPaddingX}px; border-top-width: ${borderWidth}px; border-top-color: ${metaBorder}; }
        .orix-vwall-avatar { width: ${avatarSize}px; height: ${avatarSize}px; flex: none; border-radius: 50%; display: grid; place-items: center; background: ${avatarBackground}; color: ${avatarText}; ${typeDesign?.avatarInitials && fontSizeOf(typeDesign.avatarInitials, 11) !== 11 ? fontCss(typeDesign.avatarInitials, {}) : ""} }
                .orix-vwall-avatar-img { width: ${avatarSize}px; height: ${avatarSize}px; flex: none; border-radius: 50%; object-fit: cover; display: block; }
        .orix-vwall-name { ${fontCss(typeDesign?.name, { fontSize: 13, fontWeight: 640, lineHeight: 1.2 })} color: ${nameColor}; }
        .orix-vwall-role { ${fontCss(typeDesign?.role, { fontSize: 11, fontWeight: 400, lineHeight: 1.3 })} color: ${roleColor}; }
        .orix-vwall-empty { ${fontCss(typeDesign?.empty, { fontSize: 14, fontWeight: 400, lineHeight: 1.5 })} color: ${emptyColor}; border-color: ${emptyBorder}; border-width: ${borderWidth}px; padding: ${emptyPadding}px 20px; }
        .orix-vwall-modal { background: ${modalOverlay}; padding: ${modalPadding}px; }
        .orix-vwall-dialog { width: min(${modalWidth}px, 100%); background: ${dialogBackground}; border-color: ${dialogBorder}; border-width: ${borderWidth}px; border-radius: ${modalRadius}px; color: ${dialogText}; box-shadow: ${dialogShadow}; }
        .orix-vwall-dialog-grid { grid-template-columns: ${dialogGridColumns}; }
        .orix-vwall-dialog-video { background: ${dialogVideoBackground}; }
        .orix-vwall-dialog-video video { max-height: ${dialogVideoMaxHeight}vh; background: ${dialogVideoBackground}; }
        .orix-vwall-dialog-fallback { ${fontCss(typeDesign?.fallback, { fontSize: 13, fontWeight: 400, lineHeight: 1.5 })} color: ${dialogMuted}; }
        .orix-vwall-dialog-body { padding: ${dialogBodyPadding}px; color: ${dialogText}; }
        .orix-vwall-dialog-quote { ${fontCss(typeDesign?.modalQuote, { fontSize: 19, fontWeight: 520, letterSpacing: "-.02em", lineHeight: 1.45 })} color: ${dialogQuote}; }
        .orix-vwall-dialog-person { gap: ${personGap}px; }
        .orix-vwall-dialog-avatar { width: ${avatarSize + 8}px; height: ${avatarSize + 8}px; background: ${dialogAvatarBackground}; color: ${dialogAvatarText}; ${typeDesign?.avatarInitials && fontSizeOf(typeDesign.avatarInitials, 11) !== 11 ? fontCss(typeDesign.avatarInitials, {}) : ""} }
        .orix-vwall-close { width: ${closeSize}px; height: ${closeSize}px; top: ${closeOffset}px; right: ${closeOffset}px; background: ${closeBackground}; border-color: ${closeBorder}; border-width: ${borderWidth}px; color: ${closeText}; ${fontCss(typeDesign?.close, { fontSize: 16, fontWeight: 400, lineHeight: 1.2 })} }
        .orix-vwall-close:hover { background: ${closeHover}; }
        @media (max-width: 980px) {
            .orix-vwall-grid { grid-template-columns: repeat(${Math.max(1, Math.min(safeColumns, 2))}, minmax(0, 1fr)); }
            .orix-vwall-dialog-grid { grid-template-columns: minmax(0, 1fr); }
            .orix-vwall-dialog-body { padding: ${Math.max(16, dialogBodyPadding - 8)}px; }
        }
        @media (max-width: 620px) {
            .orix-vwall-grid { grid-template-columns: minmax(0, 1fr); }
            .orix-vwall-dialog { border-radius: ${Math.max(0, modalRadius - 6)}px; }
        }
    `

    return (
        <section
            data-orix-video-wall="true"
            style={{
                ...style,
                position: "relative",
                width: "100%",
                boxSizing: "border-box",
                background,
                color: textColor,
                padding: safePadding,
                borderRadius: safeRadius,
                fontFamily: '"Inter", Arial, sans-serif',
                ...font,
            }}
        >
            <style>{`
                .orix-vwall, .orix-vwall * { box-sizing: border-box; }
                .orix-vwall-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
                .orix-vwall-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: ${accent}; }
                .orix-vwall-title { margin: 12px 0 0; max-width: 720px; font-size: clamp(26px, 4vw, 44px); line-height: 1.02; letter-spacing: -.045em; font-weight: 680; color: ${textColor}; }
                .orix-vwall-sub { margin: 12px 0 0; max-width: 520px; font-size: 14px; line-height: 1.55; color: ${mutedColor}; }
                .orix-vwall-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 22px; }
                .orix-vwall-filter { border: 1px solid ${borderColor}; background: transparent; color: ${mutedColor}; font: inherit; font-size: 12px; font-weight: 600; padding: 8px 13px; border-radius: 99px; cursor: pointer; transition: color 160ms ease, border-color 160ms ease, background 160ms ease; }
                .orix-vwall-filter:hover { color: ${textColor}; border-color: ${accent}66; }
                .orix-vwall-filter[data-active="true"] { background: ${textColor}; color: ${background}; border-color: ${textColor}; }
                .orix-vwall-grid { display: grid; grid-template-columns: repeat(${safeColumns}, minmax(0, 1fr)); gap: 14px; margin-top: 30px; }
                .orix-vwall-card { position: relative; display: block; width: 100%; text-align: left; padding: 0; border: 1px solid ${borderColor}; border-radius: ${safeRadius}px; overflow: hidden; background: ${cardBackground}; color: ${textColor}; cursor: pointer; font: inherit; transition: transform 260ms cubic-bezier(.22,1,.36,1), border-color 260ms ease, box-shadow 260ms ease; }
                .orix-vwall-card:hover { transform: translateY(-3px); border-color: ${accent}55; box-shadow: 0 26px 60px -30px rgba(0,0,0,.75); }
                .orix-vwall-media { position: relative; width: 100%; background: radial-gradient(120% 120% at 20% 0%, ${accent}33 0%, transparent 55%), linear-gradient(160deg, #1D2430, #0E1118); overflow: hidden; }
                .orix-vwall-media[data-aspect="portrait"] { aspect-ratio: 4 / 5; }
                .orix-vwall-media[data-aspect="square"] { aspect-ratio: 1 / 1; }
                .orix-vwall-media[data-aspect="landscape"] { aspect-ratio: 16 / 9; }
                .orix-vwall-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
                .orix-vwall-fallback { position: absolute; inset: 0; display: grid; place-items: center; }
                .orix-vwall-fallback-initials { font-size: clamp(26px, 5vw, 44px); font-weight: 700; letter-spacing: -.05em; color: rgba(255,255,255,.86); opacity: .9; }
                .orix-vwall-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 32%, rgba(0,0,0,.72) 100%); pointer-events: none; }
                .orix-vwall-top { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                .orix-vwall-rating { display: inline-flex; padding: 5px 7px; border-radius: 8px; background: rgba(8,10,14,.55); backdrop-filter: blur(6px); }
                .orix-vwall-play { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.94); color: #0B0D12; display: grid; place-items: center; box-shadow: 0 6px 18px rgba(0,0,0,.35); }
                .orix-vwall-play-img { width: 60%; height: 60%; object-fit: contain; display: block; }
                .orix-vwall-play-glyph { font-size: 14px; line-height: 1; }
                .orix-vwall-close-img { width: 16px; height: 16px; object-fit: contain; display: block; }
                .orix-vwall-quote { position: absolute; left: 14px; right: 14px; bottom: 14px; margin: 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #fff; text-wrap: pretty; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-shadow: 0 1px 12px rgba(0,0,0,.35); }
                .orix-vwall-meta { display: flex; align-items: center; gap: 10px; padding: 13px 14px; border-top: 1px solid ${borderColor}; }
                .orix-vwall-avatar { width: 30px; height: 30px; flex: none; border-radius: 50%; display: grid; place-items: center; background: ${accent}1F; color: ${accent}; font-size: 11px; font-weight: 700; }
                .orix-vwall-avatar-img { width: 30px; height: 30px; flex: none; border-radius: 50%; object-fit: cover; display: block; }
                .orix-vwall-name { display: block; font-size: 13px; font-weight: 640; line-height: 1.2; }
                .orix-vwall-role { display: block; margin-top: 2px; font-size: 11px; line-height: 1.3; color: ${mutedColor}; }
                .orix-vwall-empty { grid-column: 1 / -1; padding: 64px 20px; text-align: center; color: ${mutedColor}; font-size: 14px; border: 1px dashed ${borderColor}; border-radius: ${safeRadius}px; }
                .orix-vwall-modal { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(4,6,10,.78); backdrop-filter: blur(10px); }
                .orix-vwall-dialog { position: relative; width: min(1000px, 100%); max-height: calc(100vh - 48px); overflow-y: auto; background: #0E1117; border: 1px solid rgba(255,255,255,.12); border-radius: 22px; box-shadow: 0 60px 140px -40px #000; }
                .orix-vwall-dialog-grid { display: grid; grid-template-columns: 1.35fr .85fr; }
                .orix-vwall-dialog-video { position: relative; background: #05070A; min-height: 320px; display: grid; place-items: center; }
                .orix-vwall-dialog-video video { width: 100%; height: 100%; max-height: 72vh; object-fit: contain; display: block; background: #05070A; }
                .orix-vwall-dialog-fallback { padding: 80px 24px; text-align: center; color: rgba(255,255,255,.6); font-size: 13px; }
                .orix-vwall-dialog-body { padding: 30px; display: flex; flex-direction: column; }
                .orix-vwall-dialog-quote { margin: 16px 0 0; font-size: 19px; line-height: 1.45; letter-spacing: -.02em; font-weight: 520; color: #fff; text-wrap: pretty; }
                .orix-vwall-dialog-person { margin-top: auto; padding-top: 26px; display: flex; align-items: center; gap: 11px; }
                .orix-vwall-dialog-avatar { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: ${accent}22; color: ${accent}; font-size: 12px; font-weight: 700; }
                .orix-vwall-close { position: absolute; top: 12px; right: 12px; z-index: 2; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,.18); background: rgba(8,10,14,.7); color: #fff; cursor: pointer; font: inherit; font-size: 16px; display: grid; place-items: center; }
                .orix-vwall-close:hover { background: rgba(255,255,255,.14); }
                @media (max-width: 980px) {
                    .orix-vwall-grid { grid-template-columns: repeat(${Math.max(1, Math.min(safeColumns, 2))}, minmax(0, 1fr)); }
                    .orix-vwall-dialog-grid { grid-template-columns: minmax(0, 1fr); }
                    .orix-vwall-dialog-body { padding: 22px; }
                }
                @media (max-width: 620px) {
                    .orix-vwall-grid { grid-template-columns: minmax(0, 1fr); }
                    .orix-vwall-dialog { border-radius: 16px; }
                }
                ${designCss}
                ${customCss}
            `}</style>

            <div className="orix-vwall">
                <header className="orix-vwall-header">
                    <div>
                        {showEyebrow && eyebrow && (
                            <div className="orix-vwall-eyebrow">{eyebrow}</div>
                        )}
                        {showTitle && (
                            <h2 className="orix-vwall-title">{title}</h2>
                        )}
                        {showSubtitle && subtitle && (
                            <p className="orix-vwall-sub">{subtitle}</p>
                        )}
                    </div>
                </header>

                {showFilters && tagList.length > 2 && (
                    <div
                        className="orix-vwall-filters"
                        role="tablist"
                        aria-label="Filter testimonials"
                    >
                        {tagList.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                role="tab"
                                aria-selected={activeTag === tag}
                                className="orix-vwall-filter"
                                data-active={
                                    activeTag === tag ? "true" : "false"
                                }
                                onClick={() => {
                                    setActiveTag(tag)
                                    setOpenIndex(null)
                                }}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}

                <div className="orix-vwall-grid">
                    {visible.length === 0 && (
                        <div className="orix-vwall-empty">{emptyText}</div>
                    )}
                    {visible.map((testimonial, index) => {
                        const poster = sourceOf(testimonial.poster)
                        const video = sourceOf(testimonial.video)
                        const rating = clamp(testimonial.rating ?? 5, 0, 5)
                        const cardBG = cardColor(testimonial.background)
                        const cardText = cardColor(testimonial.textColor)
                        return (
                            <button
                                type="button"
                                className="orix-vwall-card"
                                key={`${testimonial.name}-${index}`}
                                style={{
                                    ...(cardBG ? { background: cardBG } : null),
                                    ...(cardText ? { color: cardText } : null),
                                }}
                                onClick={() => setOpenIndex(index)}
                                onMouseEnter={(event) => {
                                    if (hoverPlay && !isStatic)
                                        play(event.currentTarget)
                                }}
                                onMouseLeave={(event) =>
                                    pause(event.currentTarget)
                                }
                                aria-label={`Play testimonial from ${testimonial.name}`}
                            >
                                <div
                                    className="orix-vwall-media"
                                    data-aspect={aspectKey}
                                >
                                    {video && !isStatic ? (
                                        <video
                                            className="orix-vwall-video"
                                            src={video}
                                            poster={poster || undefined}
                                            muted
                                            loop
                                            playsInline
                                            preload="metadata"
                                        />
                                    ) : poster ? (
                                        <img
                                            className="orix-vwall-video"
                                            src={poster}
                                            alt=""
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="orix-vwall-fallback">
                                            <span className="orix-vwall-fallback-initials">
                                                {initials(testimonial.name)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="orix-vwall-scrim" />
                                    <div className="orix-vwall-top">
                                        {showRating ? (
                                            <span className="orix-vwall-rating">
                                                <Rating
                                                    value={rating}
                                                    color={starColor}
                                                    iconImage={starIconImage}
                                                    glyph={starGlyph}
                                                />
                                            </span>
                                        ) : (
                                            <span />
                                        )}
                                        <span
                                            className="orix-vwall-play"
                                            aria-hidden="true"
                                        >
                                            {playIconImage?.src ? (
                                                <img
                                                    src={playIconImage.src}
                                                    srcSet={
                                                        playIconImage.srcSet
                                                    }
                                                    alt={
                                                        playIconImage.alt || ""
                                                    }
                                                    className="orix-vwall-play-img"
                                                />
                                            ) : playGlyph ? (
                                                <span className="orix-vwall-play-glyph">
                                                    {playGlyph}
                                                </span>
                                            ) : (
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 12 12"
                                                    fill="currentColor"
                                                >
                                                    <path d="M3 1.8v8.4L10 6 3 1.8z" />
                                                </svg>
                                            )}
                                        </span>
                                    </div>
                                    {showQuotes && testimonial.quote && (
                                        <p className="orix-vwall-quote">
                                            “{testimonial.quote}”
                                        </p>
                                    )}
                                </div>
                                <div className="orix-vwall-meta">
                                    {sourceOf(testimonial.avatar) ? (
                                        <img
                                            className="orix-vwall-avatar-img"
                                            src={sourceOf(testimonial.avatar)}
                                            alt=""
                                            loading="lazy"
                                        />
                                    ) : (
                                        <span className="orix-vwall-avatar">
                                            {initials(testimonial.name)}
                                        </span>
                                    )}
                                    <span>
                                        <span
                                            className="orix-vwall-name"
                                            style={
                                                cardText
                                                    ? { color: cardText }
                                                    : undefined
                                            }
                                        >
                                            {testimonial.name}
                                        </span>
                                        <span
                                            className="orix-vwall-role"
                                            style={
                                                cardText
                                                    ? {
                                                          color: cardText,
                                                          opacity: 0.75,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {[
                                                testimonial.role,
                                                testimonial.company,
                                            ]
                                                .filter(Boolean)
                                                .join(` ${roleSeparator} `)}
                                        </span>
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <AnimatePresence>
                {active && (
                    <motion.div
                        className="orix-vwall-modal"
                        initial={reduceMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget)
                                setOpenIndex(null)
                        }}
                    >
                        <motion.div
                            className="orix-vwall-dialog"
                            initial={
                                reduceMotion
                                    ? false
                                    : { opacity: 0, y: 18, scale: 0.985 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={
                                reduceMotion
                                    ? { opacity: 0 }
                                    : { opacity: 0, y: 12, scale: 0.985 }
                            }
                            transition={{
                                duration: 0.22,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Testimonial from ${active.name}`}
                        >
                            <button
                                type="button"
                                className="orix-vwall-close"
                                onClick={() => setOpenIndex(null)}
                                aria-label="Close"
                            >
                                {closeIconImage?.src ? (
                                    <img
                                        src={closeIconImage.src}
                                        srcSet={closeIconImage.srcSet}
                                        alt={closeIconImage.alt || ""}
                                        className="orix-vwall-close-img"
                                    />
                                ) : (
                                    closeGlyph
                                )}
                            </button>
                            <div className="orix-vwall-dialog-grid">
                                <div className="orix-vwall-dialog-video">
                                    {sourceOf(active.video) ? (
                                        <video
                                            src={sourceOf(active.video)}
                                            poster={
                                                sourceOf(active.poster) ||
                                                undefined
                                            }
                                            controls
                                            autoPlay
                                            playsInline
                                            loop={false}
                                        />
                                    ) : sourceOf(active.poster) ? (
                                        <img
                                            src={sourceOf(active.poster)}
                                            alt=""
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        <div className="orix-vwall-dialog-fallback">
                                            {dialogFallbackText}
                                        </div>
                                    )}
                                </div>
                                <div className="orix-vwall-dialog-body">
                                    {showRating && (
                                        <Rating
                                            value={clamp(
                                                active.rating ?? 5,
                                                0,
                                                5
                                            )}
                                            color={starColor}
                                            iconImage={starIconImage}
                                            glyph={starGlyph}
                                        />
                                    )}
                                    {active.quote && (
                                        <p className="orix-vwall-dialog-quote">
                                            “{active.quote}”
                                        </p>
                                    )}
                                    <div className="orix-vwall-dialog-person">
                                        {sourceOf(active.avatar) ? (
                                            <img
                                                className="orix-vwall-avatar-img orix-vwall-dialog-avatar"
                                                src={sourceOf(active.avatar)}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="orix-vwall-dialog-avatar">
                                                {initials(active.name)}
                                            </span>
                                        )}
                                        <span>
                                            <div className="orix-vwall-name">
                                                {active.name}
                                            </div>
                                            <div className="orix-vwall-role">
                                                {[active.role, active.company]
                                                    .filter(Boolean)
                                                    .join(` ${roleSeparator} `)}
                                            </div>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}

VideoTestimonialWall.displayName = "Video Testimonial Wall"

addPropertyControls(VideoTestimonialWall, {
    testimonials: {
        type: ControlType.Array,
        title: "Testimonials",
        maxCount: 24,
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Customer",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Founder",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                    defaultValue: "",
                },
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    defaultValue: "",
                    displayTextArea: true,
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                },
                poster: {
                    type: ControlType.Image,
                    title: "Poster",
                },
                avatar: {
                    type: ControlType.Image,
                    title: "Avatar",
                },
                rating: {
                    type: ControlType.Number,
                    title: "Rating",
                    defaultValue: 5,
                    min: 0,
                    max: 5,
                    step: 1,
                },
                tags: {
                    type: ControlType.String,
                    title: "Tags",
                    defaultValue: "SaaS,Launch",
                },
                background: {
                    type: ControlType.Color,
                    title: "Card BG",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Text Color",
                },
            },
        },
        defaultValue: DEFAULT_TESTIMONIALS,
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "PROOF, IN THEIR WORDS",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "People do not read testimonials. They watch them.",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue:
            "Short clips, real customers, zero script. Add your own videos in the Framer panel.",
        displayTextArea: true,
    },
    showEyebrow: {
        type: ControlType.Boolean,
        title: "Eyebrow",
        defaultValue: true,
    },
    showTitle: {
        type: ControlType.Boolean,
        title: "Title",
        defaultValue: true,
    },
    showSubtitle: {
        type: ControlType.Boolean,
        title: "Subtitle",
        defaultValue: true,
    },
    labels: {
        type: ControlType.Object,
        title: "Labels",
        buttonTitle: "Text & Labels",
        icon: "object",
        controls: {
            allLabel: {
                type: ControlType.String,
                title: "All Filter",
                defaultValue: "All",
            },
            closeGlyph: {
                type: ControlType.String,
                title: "Close Glyph",
                defaultValue: "✕",
            },
            emptyText: {
                type: ControlType.String,
                title: "Empty State",
                defaultValue: "No testimonials in this filter yet.",
                displayTextArea: true,
            },
            dialogFallback: {
                type: ControlType.String,
                title: "Missing Video",
                defaultValue: "Add a video or poster to this testimonial.",
                displayTextArea: true,
            },
            roleSeparator: {
                type: ControlType.String,
                title: "Role Separator",
                defaultValue: "·",
            },
            playGlyph: {
                type: ControlType.String,
                title: "Play Glyph",
                defaultValue: "",
                placeholder: "Leave empty for ▶",
            },
            playIcon: {
                type: ControlType.ResponsiveImage,
                title: "Play Icon",
            },
            closeIcon: {
                type: ControlType.ResponsiveImage,
                title: "Close Icon",
            },
            starGlyph: {
                type: ControlType.String,
                title: "Star Glyph",
                defaultValue: "",
                placeholder: "Leave empty for ★",
            },
            starIcon: {
                type: ControlType.ResponsiveImage,
                title: "Star Icon",
            },
        },
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 4,
        step: 1,
    },
    aspect: {
        type: ControlType.Enum,
        title: "Aspect",
        options: ["portrait", "square", "landscape"],
        optionTitles: ["Portrait 4:5", "Square", "Landscape 16:9"],
        defaultValue: "portrait",
    },
    showFilters: {
        type: ControlType.Boolean,
        title: "Tag Filters",
        defaultValue: true,
    },
    showQuotes: {
        type: ControlType.Boolean,
        title: "Quotes on Card",
        defaultValue: true,
    },
    hoverPlay: {
        type: ControlType.Boolean,
        title: "Hover Play",
        defaultValue: true,
    },
    showRating: {
        type: ControlType.Boolean,
        title: "Ratings",
        defaultValue: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0D12",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#151923",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "rgba(255,255,255,0.62)",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#8DA6FF",
    },
    starColor: {
        type: ControlType.Color,
        title: "Stars",
        defaultValue: "#F5C451",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.10)",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 28,
        min: 0,
        max: 80,
        step: 2,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { variant: "Regular", fontSize: 14, lineHeight: "1.5em" },
    },
    typeDesign: {
        type: ControlType.Object,
        title: "Typography",
        buttonTitle: "Typography",
        icon: "object",
        controls: {
            eyebrow: {
                type: ControlType.Font,
                title: "Eyebrow",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    lineHeight: 1.2,
                },
            },
            title: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: 44,
                    letterSpacing: "-0.045em",
                    lineHeight: 1.02,
                },
            },
            body: {
                type: ControlType.Font,
                title: "Body",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Regular",
                    fontSize: 14,
                    lineHeight: 1.55,
                },
            },
            filter: {
                type: ControlType.Font,
                title: "Filter",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Semibold",
                    fontSize: 12,
                    lineHeight: 1.2,
                },
            },
            quote: {
                type: ControlType.Font,
                title: "Card Quote",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: 13,
                    lineHeight: 1.45,
                },
            },
            name: {
                type: ControlType.Font,
                title: "Name",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Semibold",
                    fontSize: 13,
                    lineHeight: 1.2,
                },
            },
            role: {
                type: ControlType.Font,
                title: "Role",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Regular",
                    fontSize: 11,
                    lineHeight: 1.3,
                },
            },
            modalQuote: {
                type: ControlType.Font,
                title: "Modal Quote",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Medium",
                    fontSize: 19,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.45,
                },
            },
            fallback: {
                type: ControlType.Font,
                title: "Fallback",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Regular",
                    fontSize: 13,
                    lineHeight: 1.5,
                },
            },
            empty: {
                type: ControlType.Font,
                title: "Empty Text",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Regular",
                    fontSize: 14,
                    lineHeight: 1.5,
                },
            },
            close: {
                type: ControlType.Font,
                title: "Close",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Regular",
                    fontSize: 16,
                    lineHeight: 1.2,
                },
            },
            initials: {
                type: ControlType.Font,
                title: "Big Initials",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: 44,
                    letterSpacing: "-0.05em",
                    lineHeight: 1.2,
                },
            },
            avatarInitials: {
                type: ControlType.Font,
                title: "Avatar Initials",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    variant: "Bold",
                    fontSize: 11,
                    lineHeight: 1.2,
                },
            },
        },
    },
    colorDesign: {
        type: ControlType.Object,
        title: "Colors",
        buttonTitle: "Buttons & States",
        icon: "color",
        controls: {
            filterBackground: {
                type: ControlType.Color,
                title: "Filter BG",
                defaultValue: "rgba(0,0,0,0)",
            },
            filterText: {
                type: ControlType.Color,
                title: "Filter Text",
                defaultValue: "rgba(255,255,255,0.62)",
            },
            filterBorder: {
                type: ControlType.Color,
                title: "Filter Border",
                defaultValue: "rgba(255,255,255,0.10)",
            },
            filterActiveBackground: {
                type: ControlType.Color,
                title: "Active Filter BG",
                defaultValue: "#FFFFFF",
            },
            filterActiveText: {
                type: ControlType.Color,
                title: "Active Filter Text",
                defaultValue: "#0B0D12",
            },
            filterHoverBorder: {
                type: ControlType.Color,
                title: "Filter Hover",
                defaultValue: "rgba(141,166,255,0.40)",
            },
            cardBorder: {
                type: ControlType.Color,
                title: "Card Border",
                defaultValue: "rgba(255,255,255,0.10)",
            },
            cardHoverBorder: {
                type: ControlType.Color,
                title: "Card Hover Border",
                defaultValue: "rgba(141,166,255,0.33)",
            },
            cardShadow: {
                type: ControlType.BoxShadow,
                title: "Card Shadow",
                defaultValue: "none",
            },
            cardHoverShadow: {
                type: ControlType.BoxShadow,
                title: "Card Hover Shadow",
                defaultValue: "0px 26px 60px -30px rgba(0,0,0,0.75)",
            },
            ratingBackground: {
                type: ControlType.Color,
                title: "Rating BG",
                defaultValue: "rgba(8,10,14,0.55)",
            },
            playBackground: {
                type: ControlType.Color,
                title: "Play BG",
                defaultValue: "rgba(255,255,255,0.94)",
            },
            playIcon: {
                type: ControlType.Color,
                title: "Play Icon",
                defaultValue: "#0B0D12",
            },
            quoteColor: {
                type: ControlType.Color,
                title: "Quote Color",
                defaultValue: "#FFFFFF",
            },
            nameColor: {
                type: ControlType.Color,
                title: "Name Color",
                defaultValue: "#FFFFFF",
            },
            roleColor: {
                type: ControlType.Color,
                title: "Role Color",
                defaultValue: "rgba(255,255,255,0.62)",
            },
            avatarBackground: {
                type: ControlType.Color,
                title: "Avatar BG",
                defaultValue: "rgba(141,166,255,0.12)",
            },
            avatarText: {
                type: ControlType.Color,
                title: "Avatar Text",
                defaultValue: "#8DA6FF",
            },
            emptyColor: {
                type: ControlType.Color,
                title: "Empty Color",
                defaultValue: "rgba(255,255,255,0.62)",
            },
            emptyBorder: {
                type: ControlType.Color,
                title: "Empty Border",
                defaultValue: "rgba(255,255,255,0.10)",
            },
            mediaGlow: {
                type: ControlType.Color,
                title: "Media Glow",
                defaultValue: "rgba(141,166,255,0.20)",
            },
            mediaStart: {
                type: ControlType.Color,
                title: "Media Start",
                defaultValue: "#1D2430",
            },
            mediaEnd: {
                type: ControlType.Color,
                title: "Media End",
                defaultValue: "#0E1118",
            },
            scrimStart: {
                type: ControlType.Color,
                title: "Scrim Start",
                defaultValue: "rgba(0,0,0,0)",
            },
            scrimEnd: {
                type: ControlType.Color,
                title: "Scrim End",
                defaultValue: "rgba(0,0,0,0.72)",
            },
            fallbackInitialsColor: {
                type: ControlType.Color,
                title: "Fallback Initials",
                defaultValue: "rgba(255,255,255,0.86)",
            },
            modalOverlay: {
                type: ControlType.Color,
                title: "Modal Overlay",
                defaultValue: "rgba(4,6,10,0.78)",
            },
            dialogBackground: {
                type: ControlType.Color,
                title: "Dialog BG",
                defaultValue: "#0E1117",
            },
            dialogBorder: {
                type: ControlType.Color,
                title: "Dialog Border",
                defaultValue: "rgba(255,255,255,0.12)",
            },
            dialogText: {
                type: ControlType.Color,
                title: "Dialog Text",
                defaultValue: "#FFFFFF",
            },
            dialogMuted: {
                type: ControlType.Color,
                title: "Dialog Muted",
                defaultValue: "rgba(255,255,255,0.60)",
            },
            dialogVideoBackground: {
                type: ControlType.Color,
                title: "Dialog Video BG",
                defaultValue: "#05070A",
            },
            dialogQuote: {
                type: ControlType.Color,
                title: "Dialog Quote",
                defaultValue: "#FFFFFF",
            },
            dialogAvatarBackground: {
                type: ControlType.Color,
                title: "Dialog Avatar BG",
                defaultValue: "rgba(141,166,255,0.13)",
            },
            dialogAvatarText: {
                type: ControlType.Color,
                title: "Dialog Avatar Text",
                defaultValue: "#8DA6FF",
            },
            closeBackground: {
                type: ControlType.Color,
                title: "Close BG",
                defaultValue: "rgba(8,10,14,0.70)",
            },
            closeBorder: {
                type: ControlType.Color,
                title: "Close Border",
                defaultValue: "rgba(255,255,255,0.18)",
            },
            closeText: {
                type: ControlType.Color,
                title: "Close Text",
                defaultValue: "#FFFFFF",
            },
            closeHover: {
                type: ControlType.Color,
                title: "Close Hover",
                defaultValue: "rgba(255,255,255,0.14)",
            },
            eyebrowColor: {
                type: ControlType.Color,
                title: "Eyebrow Color",
                defaultValue: "#8DA6FF",
            },
            titleColor: {
                type: ControlType.Color,
                title: "Title Color",
                defaultValue: "#FFFFFF",
            },
            bodyColor: {
                type: ControlType.Color,
                title: "Body Color",
                defaultValue: "rgba(255,255,255,0.62)",
            },
            filterHoverText: {
                type: ControlType.Color,
                title: "Filter Hover Text",
                defaultValue: "#FFFFFF",
            },
            metaBorder: {
                type: ControlType.Color,
                title: "Meta Border",
                defaultValue: "rgba(255,255,255,0.10)",
            },
            playShadow: {
                type: ControlType.BoxShadow,
                title: "Play Shadow",
                defaultValue: "0px 6px 18px rgba(0,0,0,0.35)",
            },
            dialogShadow: {
                type: ControlType.BoxShadow,
                title: "Dialog Shadow",
                defaultValue: "0px 60px 140px -40px rgba(0,0,0,1)",
            },
        },
    },
    layoutDesign: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Spacing & Effects",
        icon: "effect",
        controls: {
            headerGap: {
                type: ControlType.Number,
                title: "Header Gap",
                defaultValue: 28,
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
            },
            filtersGap: {
                type: ControlType.Number,
                title: "Filter Gap",
                defaultValue: 6,
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
            },
            filterMarginTop: {
                type: ControlType.Number,
                title: "Filter Top",
                defaultValue: 22,
                min: 0,
                max: 60,
                step: 2,
                unit: "px",
            },
            gridGap: {
                type: ControlType.Number,
                title: "Grid Gap",
                defaultValue: 14,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            gridMarginTop: {
                type: ControlType.Number,
                title: "Grid Top",
                defaultValue: 30,
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 1,
                min: 0,
                max: 4,
                step: 1,
                unit: "px",
            },
            cardHoverLift: {
                type: ControlType.Number,
                title: "Hover Lift",
                defaultValue: 3,
                min: 0,
                max: 20,
                step: 1,
                unit: "px",
            },
            filterRadius: {
                type: ControlType.Number,
                title: "Filter Radius",
                defaultValue: 99,
                min: 0,
                max: 99,
                step: 1,
                unit: "px",
            },
            filterPaddingX: {
                type: ControlType.Number,
                title: "Filter Padding X",
                defaultValue: 13,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            filterPaddingY: {
                type: ControlType.Number,
                title: "Filter Padding Y",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            ratingRadius: {
                type: ControlType.Number,
                title: "Rating Radius",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
            playSize: {
                type: ControlType.Number,
                title: "Play Size",
                defaultValue: 34,
                min: 18,
                max: 64,
                step: 1,
                unit: "px",
            },
            avatarSize: {
                type: ControlType.Number,
                title: "Avatar Size",
                defaultValue: 30,
                min: 18,
                max: 60,
                step: 1,
                unit: "px",
            },
            metaPaddingX: {
                type: ControlType.Number,
                title: "Meta Padding X",
                defaultValue: 14,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            metaPaddingY: {
                type: ControlType.Number,
                title: "Meta Padding Y",
                defaultValue: 13,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            quoteInset: {
                type: ControlType.Number,
                title: "Quote Inset",
                defaultValue: 14,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            titleMaxWidth: {
                type: ControlType.Number,
                title: "Title Width",
                defaultValue: 720,
                min: 320,
                max: 1200,
                step: 10,
                unit: "px",
            },
            subMaxWidth: {
                type: ControlType.Number,
                title: "Subtitle Width",
                defaultValue: 520,
                min: 240,
                max: 900,
                step: 10,
                unit: "px",
            },
            emptyPadding: {
                type: ControlType.Number,
                title: "Empty Padding",
                defaultValue: 64,
                min: 16,
                max: 120,
                step: 2,
                unit: "px",
            },
            modalPadding: {
                type: ControlType.Number,
                title: "Modal Padding",
                defaultValue: 24,
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
            },
            modalWidth: {
                type: ControlType.Number,
                title: "Modal Width",
                defaultValue: 1000,
                min: 320,
                max: 1400,
                step: 10,
                unit: "px",
            },
            modalRadius: {
                type: ControlType.Number,
                title: "Modal Radius",
                defaultValue: 22,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            dialogBodyPadding: {
                type: ControlType.Number,
                title: "Dialog Body Padding",
                defaultValue: 30,
                min: 0,
                max: 80,
                step: 2,
                unit: "px",
            },
            dialogGridColumns: {
                type: ControlType.String,
                title: "Dialog Columns",
                defaultValue: "1.35fr .85fr",
            },
            dialogVideoMaxHeight: {
                type: ControlType.Number,
                title: "Dialog Video Height",
                defaultValue: 72,
                min: 30,
                max: 100,
                step: 1,
                unit: "vh",
            },
            closeSize: {
                type: ControlType.Number,
                title: "Close Size",
                defaultValue: 34,
                min: 20,
                max: 64,
                step: 1,
                unit: "px",
            },
            closeOffset: {
                type: ControlType.Number,
                title: "Close Offset",
                defaultValue: 12,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            personGap: {
                type: ControlType.Number,
                title: "Person Gap",
                defaultValue: 11,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },
        },
    },
    customCss: {
        type: ControlType.String,
        title: "Custom CSS",
        defaultValue: "",
        displayTextArea: true,
        description: "Override any .orix-vwall-* class.",
    },
})
