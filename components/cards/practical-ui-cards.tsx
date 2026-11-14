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


/**
 * Practical Ui Card — structured project/case-study card
 * ThinkTank · Framer Community · Free
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type Scheme = "light" | "dark"
type Theme = "system" | "light" | "dark"
type Variant = "full" | "compact"
type CTALook = "text" | "filled" | "outline"
type CTAIcon = "none" | "arrow" | "diagonal"
type MediaKind = "image" | "gif" | "video"

interface Props {
    title: string
    subtitle: string
    tagOne: string
    tagTwo: string
    tagThree: string
    challengeText: string
    approachText: string
    outcomeText: string

    ctaLabel: string
    ctaUrl: string
    ctaLook: CTALook
    ctaIcon: CTAIcon
    ctaColor: string
    ctaRadius: number

    showMedia: boolean
    mediaKind: MediaKind
    coverImage?: { src: string; alt?: string }
    videoUrl: string
    mediaHeight: number

    titleFont: string
    titleWeight: string
    bodyFont: string

    theme: Theme
    accent: string
    bgLight: string
    titleLight: string
    subtitleLight: string
    bodyLight: string
    labelLight: string
    dividerLight: string
    borderLight: string
    tagTextLight: string
    tagBgLight: string

    variant: Variant
    radius: number
    bordered: boolean
    topBar: boolean

    hoverEnabled: boolean
    hoverLift: number
    hoverShadowColorLight: string
    hoverShadowColorDark: string
    hoverShadowBlur: number
    hoverShadowSpread: number
    hoverShadowY: number
    pressScale: number
}

const NIGHT = {
    bg: "#111111",
    title: "#F0F0F0",
    body: "#888888",
    divider: "#1E1E1E",
    border: "#222222",
}

function toRGBA(input: string, alpha: number): string {
    if (!input) return `rgba(217, 119, 87, ${alpha})`
    if (input.startsWith("#")) {
        let hex = input.slice(1)
        if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
        const num = parseInt(hex, 16)
        const r = (num >> 16) & 255
        const g = (num >> 8) & 255
        const b = num & 255
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    const nums = input.match(/[\d.]+/g)
    if (nums && nums.length >= 3) {
        return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`
    }
    return input
}

/**
 * Checks the real, standard browser signal for dark mode — prefers-color-scheme
 * — plus every class/attribute Framer's canvas or preview has been observed to
 * use. This is the PRIMARY signal on a real published site: a visitor's actual
 * OS/browser dark-mode setting is authoritative and should always win.
 */
function readDarkSignal(): boolean {
    if (typeof window === "undefined") return false
    const el = document.documentElement
    const body = document.body

    const classHit =
        el.classList.contains("dark") ||
        el.classList.contains("framer-dark") ||
        (body && body.classList.contains("dark")) ||
        (body && body.classList.contains("framer-dark"))

    const attrHit =
        el.getAttribute("data-theme") === "dark" ||
        el.getAttribute("data-framer-theme") === "dark" ||
        (body && body.getAttribute("data-theme") === "dark") ||
        (body && body.getAttribute("data-framer-theme") === "dark")

    const mediaHit = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false

    return Boolean(classHit || attrHit || mediaHit)
}

/**
 * Parses a resolved CSS color (rgb/rgba from getComputedStyle) into a 0–255
 * relative luminance. Returns null if the color is fully/mostly transparent
 * or unparseable — that means "inconclusive, keep looking."
 */
function luminanceOf(color: string): number | null {
    const m = color.match(/rgba?\(([^)]+)\)/i)
    if (!m) return null
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()))
    const [r, g, b, a = 1] = parts
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    if (a < 0.4) return null
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Walks up from the card's own wrapper element looking for the first ancestor
 * with an actual opaque, resolved background color. This is a SECONDARY signal
 * only — useful for the rare case where a page is manually forced dark/light
 * regardless of the visitor's real OS setting. It never overrides a real
 * dark browser signal (see useScheme below) — only adds to it.
 */
function detectAmbientDark(start: HTMLElement | null): boolean | null {
    if (typeof window === "undefined" || !start) return null
    let el: HTMLElement | null = start.parentElement
    let hops = 0
    while (el && hops < 24) {
        const bg = window.getComputedStyle(el).backgroundColor
        const lum = luminanceOf(bg)
        if (lum !== null) return lum < 128
        el = el.parentElement
        hops++
    }
    return null
}

/**
 * Resolves the active color scheme.
 * - "light" / "dark": always applies immediately, regardless of canvas or preview.
 * - "system": dark if EITHER signal says dark — the visitor's real OS/browser
 *   preference (readDarkSignal, checked first and authoritative) OR the ambient
 *   page background (detectAmbientDark, for pages manually forced into a mode
 *   that doesn't match the visitor's OS). Combining with OR means a real dark
 *   browser setting is never overridden by an inconclusive or wrong ambient read.
 */
function useScheme(theme: Theme, wrapRef: React.RefObject<HTMLDivElement>): Scheme {
    const [detected, setDetected] = React.useState<Scheme>(() =>
        readDarkSignal() ? "dark" : "light"
    )

    React.useEffect(() => {
        if (theme !== "system") return
        if (typeof window === "undefined") return

        const evaluate = () => {
            const osDark = readDarkSignal()
            const ambientDark = detectAmbientDark(wrapRef.current)
            const isDark = osDark || ambientDark === true
            setDetected(isDark ? "dark" : "light")
        }
        evaluate()

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        media.addEventListener("change", evaluate)

        const watcher = new MutationObserver(evaluate)
        watcher.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme", "data-framer-theme"],
        })
        if (document.body) {
            watcher.observe(document.body, {
                attributes: true,
                attributeFilter: ["class", "data-theme", "data-framer-theme"],
            })
        }

        // Catches cases where the ambient background resolves slightly after
        // this component mounts (layout/paint timing on first load).
        let ticks = 0
        const poll = window.setInterval(() => {
            evaluate()
            ticks += 1
            if (ticks > 10) window.clearInterval(poll)
        }, 300)

        return () => {
            media.removeEventListener("change", evaluate)
            watcher.disconnect()
            window.clearInterval(poll)
        }
    }, [theme])

    if (theme === "light" || theme === "dark") return theme
    return detected
}

function IconGlyph({ kind, color }: { kind: CTAIcon; color: string }) {
    if (kind === "none") return null
    if (kind === "diagonal") {
        return (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M7 17L17 7M17 7H9M17 7V15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        )
    }
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export default function ShowcaseCard({
    title = "Project Title",
    subtitle = "Category · Discipline",
    tagOne = "Tag One",
    tagTwo = "Tag Two",
    tagThree = "",
    challengeText = "Describe the challenge or problem this project needed to solve.",
    approachText = "Explain the approach or solution used to tackle it.",
    outcomeText = "Share the outcome or measurable result — numbers help.",
    ctaLabel = "View Case Study",
    ctaUrl = "",
    ctaLook = "text",
    ctaIcon = "arrow",
    ctaColor = "",
    ctaRadius = 8,
    showMedia = true,
    mediaKind = "image",
    coverImage,
    videoUrl = "",
    mediaHeight = 200,
    titleFont = "Inter",
    titleWeight = "700",
    bodyFont = "Inter",
    theme = "system",
    accent = "#D97757",
    bgLight = "#FFFFFF",
    titleLight = "#0F0F0F",
    subtitleLight = "#AAAAAA",
    bodyLight = "#525252",
    labelLight = "#AAAAAA",
    dividerLight = "#EEECE9",
    borderLight = "#E8E6E3",
    tagTextLight = "#D97757",
    tagBgLight = "rgba(217, 119, 87, 0.08)",
    variant = "full",
    radius = 10,
    bordered = true,
    topBar = false,
    hoverEnabled = true,
    hoverLift = 4,
    hoverShadowColorLight = "rgba(0, 0, 0, 0.18)",
    hoverShadowColorDark = "rgba(0, 0, 0, 0.65)",
    hoverShadowBlur = 32,
    hoverShadowSpread = -4,
    hoverShadowY = 14,
    pressScale = 0.98,
}: Props) {
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const scheme = useScheme(theme, wrapRef)
    const isDark = scheme === "dark"
    const isCompact = variant === "compact"

    const [isHovered, setIsHovered] = React.useState(false)
    const [isPressed, setIsPressed] = React.useState(false)

    const palette = isDark
        ? {
              bg: NIGHT.bg,
              title: NIGHT.title,
              subtitle: NIGHT.body,
              body: NIGHT.body,
              label: NIGHT.body,
              divider: NIGHT.divider,
              border: NIGHT.border,
              tagText: accent,
              tagBg: toRGBA(accent, 0.16),
          }
        : {
              bg: bgLight,
              title: titleLight,
              subtitle: subtitleLight,
              body: bodyLight,
              label: labelLight,
              divider: dividerLight,
              border: borderLight,
              tagText: tagTextLight,
              tagBg: tagBgLight,
          }

    const tags = [tagOne, tagTwo, tagThree].filter(Boolean)

    const active = hoverEnabled && isHovered
    const pressed = hoverEnabled && isPressed

    // Shadow color is theme-aware: a soft black at low opacity reads fine on
    // light cards, but the same color is invisible against a dark card on a
    // dark page — so dark mode uses its own (buyer-adjustable) shadow color,
    // typically a heavier/higher-opacity black so the elevation still shows.
    const activeShadowColor = isDark ? hoverShadowColorDark : hoverShadowColorLight

    const liftShadow = active
        ? `0 ${hoverShadowY}px ${hoverShadowBlur}px ${hoverShadowSpread}px ${activeShadowColor}`
        : "0 0px 0px 0px rgba(0,0,0,0)"

    const translateY = active ? -Math.abs(hoverLift) : 0
    const scale = pressed ? pressScale : 1

    const wrap: React.CSSProperties = {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: palette.bg,
        borderRadius: radius,
        border: bordered ? `1px solid ${palette.border}` : "none",
        overflow: "hidden",
        position: "relative",
        fontFamily: bodyFont || "Inter, sans-serif",
        boxShadow: liftShadow,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transition:
            "background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, transform 0.2s ease",
    }

    const eventHandlers = hoverEnabled
        ? {
              onMouseEnter: () => setIsHovered(true),
              onMouseLeave: () => {
                  setIsHovered(false)
                  setIsPressed(false)
              },
              onMouseDown: () => setIsPressed(true),
              onMouseUp: () => setIsPressed(false),
              onTouchStart: () => setIsPressed(true),
              onTouchEnd: () => setIsPressed(false),
          }
        : {}

    const placeholderLabel = mediaKind === "video" ? "Add Video URL" : "Add Cover Image"

    return (
        <div ref={wrapRef} style={wrap} {...eventHandlers}>
            {topBar && (
                <div style={{ height: 3, width: "100%", backgroundColor: accent, flexShrink: 0 }} />
            )}

            {!isCompact && showMedia && (
                <div style={{ width: "100%", height: mediaHeight, flexShrink: 0, position: "relative", background: isDark ? "#181818" : "#F2F0ED" }}>
                    {mediaKind === "video" && videoUrl ? (
                        <video src={videoUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : coverImage?.src ? (
                        <img src={coverImage.src} alt={coverImage.alt || title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        // Placeholder shown only while the field is unset — makes it obvious
                        // to a buyer who just pasted the component that this is an editable
                        // slot, not a broken image.
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: isDark ? "#4A4A4A" : "#C7C4BF" }}>
                                {placeholderLabel}
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: isCompact ? "20px 22px 18px" : "24px 24px 20px", display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontFamily: titleFont || "Inter, sans-serif", fontWeight: titleWeight as React.CSSProperties["fontWeight"], fontSize: isCompact ? 16 : 18, letterSpacing: "-0.02em", color: palette.title }}>
                    {title}
                </span>
                <span style={{ fontSize: 11, color: palette.subtitle, marginBottom: 8 }}>{subtitle}</span>

                {tags.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 12px" }}>
                        {tags.map((t, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: palette.tagText,
                                    backgroundColor: palette.tagBg,
                                    padding: "4px 10px",
                                    borderRadius: 999,
                                }}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                <div style={{ height: 1, backgroundColor: palette.divider, margin: "2px 0 14px" }} />

                {isCompact ? (
                    <p style={{ fontSize: 12.5, lineHeight: 1.65, color: palette.body, margin: 0 }}>{challengeText}</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {challengeText && (
                            <div style={{ borderLeft: `1.5px solid ${palette.divider}`, paddingLeft: 12 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.label, marginBottom: 4 }}>Challenge</div>
                                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: palette.body, margin: 0 }}>{challengeText}</p>
                            </div>
                        )}
                        {approachText && (
                            <div style={{ borderLeft: `1.5px solid ${palette.divider}`, paddingLeft: 12 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.label, marginBottom: 4 }}>Approach</div>
                                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: palette.body, margin: 0 }}>{approachText}</p>
                            </div>
                        )}
                        {outcomeText && (
                            <div style={{ borderLeft: `1.5px solid ${palette.divider}`, paddingLeft: 12 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: palette.label, marginBottom: 4 }}>Outcome</div>
                                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: palette.body, margin: 0 }}>{outcomeText}</p>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ height: 1, backgroundColor: palette.divider, margin: "16px 0 14px" }} />

                <a
                    href={ctaUrl || "#"}
                    target={ctaUrl ? "_blank" : undefined}
                    rel="noreferrer"
                    style={{
                        alignSelf: "flex-end",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        textDecoration: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: ctaLook === "text" ? 0 : "8px 16px",
                        borderRadius: ctaRadius,
                        color: ctaLook === "filled" ? "#fff" : ctaColor || accent,
                        backgroundColor: ctaLook === "filled" ? (ctaColor || accent) : "transparent",
                        border: ctaLook === "outline" ? `1.5px solid ${ctaColor || accent}` : "none",
                    }}
                >
                    {ctaLabel}
                    <IconGlyph kind={ctaIcon} color={ctaLook === "filled" ? "#fff" : ctaColor || accent} />
                </a>
            </div>
        </div>
    )
}

addPropertyControls(ShowcaseCard, {
    title: { type: ControlType.String, title: "Title", defaultValue: "Project Title" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Category · Discipline" },
    tagOne: { type: ControlType.String, title: "Tag 1", defaultValue: "Tag One" },
    tagTwo: { type: ControlType.String, title: "Tag 2", defaultValue: "Tag Two" },
    tagThree: { type: ControlType.String, title: "Tag 3", defaultValue: "" },

    challengeText: {
        type: ControlType.String, title: "Challenge", displayTextArea: true,
        defaultValue: "Describe the challenge or problem this project needed to solve.",
    },
    approachText: {
        type: ControlType.String, title: "Approach", displayTextArea: true,
        defaultValue: "Explain the approach or solution used to tackle it.",
        hidden: (p) => p.variant === "compact",
    },
    outcomeText: {
        type: ControlType.String, title: "Outcome", displayTextArea: true,
        defaultValue: "Share the outcome or measurable result — numbers help.",
        hidden: (p) => p.variant === "compact",
    },

    ctaLabel: { type: ControlType.String, title: "CTA Label", defaultValue: "View Case Study" },
    ctaUrl: { type: ControlType.Link, title: "CTA URL" },
    ctaLook: {
        type: ControlType.Enum, title: "CTA Style",
        options: ["text", "filled", "outline"], optionTitles: ["Text", "Filled", "Outline"],
        defaultValue: "text",
    },
    ctaIcon: {
        type: ControlType.Enum, title: "CTA Icon",
        options: ["none", "arrow", "diagonal"], optionTitles: ["None", "Arrow", "Diagonal"],
        defaultValue: "arrow",
    },
    ctaColor: { type: ControlType.Color, title: "CTA Color", defaultValue: "" },
    ctaRadius: { type: ControlType.Number, title: "CTA Radius", min: 0, max: 40, defaultValue: 8 },

    showMedia: { type: ControlType.Boolean, title: "Show Media", defaultValue: true, hidden: (p) => p.variant === "compact" },
    mediaKind: {
        type: ControlType.Enum, title: "Media Type",
        options: ["image", "gif", "video"], optionTitles: ["Image", "GIF", "Video"],
        defaultValue: "image",
        hidden: (p) => p.variant === "compact" || !p.showMedia,
    },
    coverImage: {
        type: ControlType.ResponsiveImage, title: "Cover Image",
        hidden: (p) => p.variant === "compact" || !p.showMedia || p.mediaKind === "video",
    },
    videoUrl: {
        type: ControlType.String, title: "Video URL", defaultValue: "",
        hidden: (p) => p.variant === "compact" || !p.showMedia || p.mediaKind !== "video",
    },
    mediaHeight: {
        type: ControlType.Number, title: "Media Height", min: 100, max: 500, defaultValue: 200,
        hidden: (p) => p.variant === "compact" || !p.showMedia,
    },

    titleFont: { type: ControlType.String, title: "Title Font", defaultValue: "Inter" },
    titleWeight: { type: ControlType.String, title: "Title Weight", defaultValue: "700" },
    bodyFont: { type: ControlType.String, title: "Body Font", defaultValue: "Inter" },

    theme: {
        type: ControlType.Enum, title: "Theme",
        options: ["system", "light", "dark"], optionTitles: ["System (Auto)", "Light", "Dark"],
        defaultValue: "system",
    },
    accent: { type: ControlType.Color, title: "Accent Color", defaultValue: "#D97757" },

    bgLight: { type: ControlType.Color, title: "Card BG", defaultValue: "#FFFFFF" },
    titleLight: { type: ControlType.Color, title: "Title", defaultValue: "#0F0F0F" },
    subtitleLight: { type: ControlType.Color, title: "Subtitle", defaultValue: "#AAAAAA" },
    bodyLight: { type: ControlType.Color, title: "Body", defaultValue: "#525252" },
    labelLight: { type: ControlType.Color, title: "Labels", defaultValue: "#AAAAAA" },
    dividerLight: { type: ControlType.Color, title: "Dividers", defaultValue: "#EEECE9" },
    borderLight: { type: ControlType.Color, title: "Border", defaultValue: "#E8E6E3" },
    tagTextLight: { type: ControlType.Color, title: "Tag Text", defaultValue: "#D97757" },
    tagBgLight: { type: ControlType.Color, title: "Tag BG", defaultValue: "rgba(217, 119, 87, 0.08)" },

    variant: {
        type: ControlType.Enum, title: "Variant",
        options: ["full", "compact"], optionTitles: ["Full", "Compact"],
        defaultValue: "full",
    },
    radius: { type: ControlType.Number, title: "Card Radius", min: 0, max: 40, defaultValue: 10 },
    bordered: { type: ControlType.Boolean, title: "Show Border", defaultValue: true },
    topBar: { type: ControlType.Boolean, title: "Top Bar", defaultValue: false },

    hoverEnabled: { type: ControlType.Boolean, title: "Hover Effect", defaultValue: true },
    hoverLift: {
        type: ControlType.Number, title: "Hover Lift", min: 0, max: 20, step: 1, defaultValue: 4,
        hidden: (p) => !p.hoverEnabled,
    },
    hoverShadowColorLight: {
        type: ControlType.Color, title: "Shadow (Light)", defaultValue: "rgba(0, 0, 0, 0.18)",
        hidden: (p) => !p.hoverEnabled,
    },
    hoverShadowColorDark: {
        type: ControlType.Color, title: "Shadow (Dark)", defaultValue: "rgba(0, 0, 0, 0.65)",
        hidden: (p) => !p.hoverEnabled,
    },
    hoverShadowBlur: {
        type: ControlType.Number, title: "Shadow Blur", min: 0, max: 100, step: 1, defaultValue: 32,
        hidden: (p) => !p.hoverEnabled,
    },
    hoverShadowSpread: {
        type: ControlType.Number, title: "Shadow Spread", min: -20, max: 40, step: 1, defaultValue: -4,
        hidden: (p) => !p.hoverEnabled,
    },
    hoverShadowY: {
        type: ControlType.Number, title: "Shadow Offset Y", min: 0, max: 60, step: 1, defaultValue: 14,
        hidden: (p) => !p.hoverEnabled,
    },
    pressScale: {
        type: ControlType.Number, title: "Press Scale", min: 0.9, max: 1, step: 0.01, defaultValue: 0.98,
        hidden: (p) => !p.hoverEnabled,
    },
})
