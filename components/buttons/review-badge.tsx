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


type ReviewPreset = "clean" | "dark" | "warm" | "minimal" | "elevated"
type CTAStyle = "filled" | "outline" | "minimal"

interface ReviewBadgeProps {
    preset: ReviewPreset
    customizePreset: boolean
    businessName: string
    rating: number
    reviewCount: number
    platformLabel: string
    reviewsUrl: string
    leaveReviewUrl: string
    supportingText: string
    layout: "badge" | "card" | "compact" | "strip"
    showBusinessName: boolean
    showRating: boolean
    showReviewCount: boolean
    showPlatformLabel: boolean
    showReadReviews: boolean
    showLeaveReview: boolean
    showSupportingText: boolean
    showStars: boolean
    background: string
    textColor: string
    mutedTextColor: string
    starColor: string
    accentColor: string
    borderColor: string
    borderWidth: number
    cornerRadius: number
    internalPadding: string
    gap: number
    buttonStyle: CTAStyle
    buttonRadius: number
    ctaBackground: string
    ctaTextColor: string
    ctaBorderColor: string
    ctaBorderWidth: number
    ctaGap: number
    ctaAlignment: "left" | "center" | "right"
    shadow: string
    alignment: "left" | "center" | "right"
    starSize: number
    starGap: number
    style?: React.CSSProperties
}

interface StarProps {
    fillAmount: number
    color: string
    size: number
}

interface PresetTheme {
    background: string; textColor: string; mutedTextColor: string; starColor: string; accentColor: string
    borderColor: string; borderWidth: number; cornerRadius: number; internalPadding: string; gap: number; shadow: string
    ctaBackground: string; ctaTextColor: string; ctaBorderColor: string
}
const presetThemes: Record<ReviewPreset, PresetTheme> = {
    clean: { background: "#FFFFFF", textColor: "#171717", mutedTextColor: "#666666", starColor: "#F5A623", accentColor: "#2563EB", borderColor: "#E5E7EB", borderWidth: 1, cornerRadius: 16, internalPadding: "20px", gap: 14, shadow: "none", ctaBackground: "#2563EB", ctaTextColor: "#FFFFFF", ctaBorderColor: "#2563EB" },
    dark: { background: "#171717", textColor: "#FAFAFA", mutedTextColor: "#B8B8B8", starColor: "#FFD166", accentColor: "#A8C7FF", borderColor: "#333333", borderWidth: 1, cornerRadius: 16, internalPadding: "20px", gap: 14, shadow: "0 12px 32px rgba(0,0,0,.28)", ctaBackground: "#FAFAFA", ctaTextColor: "#171717", ctaBorderColor: "#FAFAFA" },
    warm: { background: "#FFF8ED", textColor: "#3F2A1D", mutedTextColor: "#806A5A", starColor: "#E88918", accentColor: "#B45309", borderColor: "#F2D3AC", borderWidth: 1, cornerRadius: 18, internalPadding: "22px", gap: 14, shadow: "none", ctaBackground: "#B45309", ctaTextColor: "#FFFFFF", ctaBorderColor: "#B45309" },
    minimal: { background: "transparent", textColor: "#171717", mutedTextColor: "#737373", starColor: "#EAA317", accentColor: "#171717", borderColor: "transparent", borderWidth: 0, cornerRadius: 0, internalPadding: "0px", gap: 10, shadow: "none", ctaBackground: "transparent", ctaTextColor: "#171717", ctaBorderColor: "transparent" },
    elevated: { background: "#FFFFFF", textColor: "#111827", mutedTextColor: "#667085", starColor: "#F59E0B", accentColor: "#4F46E5", borderColor: "#EEF0F3", borderWidth: 1, cornerRadius: 20, internalPadding: "24px", gap: 16, shadow: "0 16px 42px rgba(15,23,42,.14)", ctaBackground: "#4F46E5", ctaTextColor: "#FFFFFF", ctaBorderColor: "#4F46E5" },
}

const starPath = "M12 1.75l3.16 6.4 7.06 1.03-5.11 4.98 1.21 7.03L12 17.87l-6.32 3.32 1.21-7.03-5.11-4.98 7.06-1.03L12 1.75z"

function Star({ fillAmount, color, size }: StarProps) {
    return (
        <span style={{ position: "relative", display: "block", width: size, height: size, flex: "0 0 auto" }}>
            <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: "block" }}>
                <path d={starPath} fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round" opacity={0.45} />
            </svg>
            <span style={{ position: "absolute", inset: 0, width: `${Math.max(0, Math.min(1, fillAmount)) * 100}%`, overflow: "hidden" }}>
                <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" style={{ display: "block", maxWidth: "none" }}>
                    <path d={starPath} fill={color} stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
            </span>
        </span>
    )
}

/**
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 210
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ReviewBadge(props: ReviewBadgeProps) {
    const {
        preset = "clean",
        customizePreset = false,
        businessName = "Northside Print Co.",
        rating = 4.9,
        reviewCount = 287,
        platformLabel = "Google Reviews",
        reviewsUrl = "",
        leaveReviewUrl = "",
        supportingText = "Trusted by customers in the local community.",
        layout = "card",
        showBusinessName = true,
        showRating = true,
        showReviewCount = true,
        showPlatformLabel = true,
        showReadReviews = true,
        showLeaveReview = true,
        showSupportingText = true,
        showStars = true,
        background = "#FFFFFF",
        textColor = "#171717",
        mutedTextColor = "#666666",
        starColor = "#F5A623",
        accentColor = "#2563EB",
        borderColor = "#E5E7EB",
        borderWidth = 1,
        cornerRadius = 16,
        internalPadding = "20px",
        gap = 14,
        buttonStyle = "filled",
        buttonRadius = 10,
        ctaBackground = "#2563EB",
        ctaTextColor = "#FFFFFF",
        ctaBorderColor = "#2563EB",
        ctaBorderWidth = 1,
        ctaGap = 10,
        ctaAlignment = "left",
        shadow = "0 8px 24px rgba(0, 0, 0, 0.08)",
        alignment = "left",
        starSize = 20,
        starGap = 3,
        style,
    } = props

    const baseTheme = presetThemes[preset]
    const theme: PresetTheme = customizePreset ? { background, textColor, mutedTextColor, starColor, accentColor, borderColor, borderWidth, cornerRadius, internalPadding, gap, shadow: typeof shadow === "string" ? shadow : "none", ctaBackground, ctaTextColor, ctaBorderColor } : baseTheme

    const safeRating = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0))
    const safeCount = Math.max(0, Math.round(Number.isFinite(reviewCount) ? reviewCount : 0))
    const compact = layout === "compact" || layout === "badge"
    const strip = layout === "strip"
    const hasReadAction = showReadReviews && reviewsUrl.trim().length > 0
    const hasLeaveAction = showLeaveReview && leaveReviewUrl.trim().length > 0
    const hasActions = hasReadAction || hasLeaveAction
    const justify = alignment === "center" ? "center" : alignment === "right" ? "flex-end" : "flex-start"
    const textAlign: React.CSSProperties["textAlign"] = alignment
    const ctaJustify = ctaAlignment === "center" ? "center" : ctaAlignment === "right" ? "flex-end" : "flex-start"
    const resolvedButtonStyle: CTAStyle = preset === "minimal" && !customizePreset ? "minimal" : buttonStyle

    const buttonColors = resolvedButtonStyle === "filled"
        ? { background: theme.ctaBackground, color: theme.ctaTextColor, border: `${ctaBorderWidth}px solid ${theme.ctaBorderColor}` }
        : resolvedButtonStyle === "outline"
          ? { background: "transparent", color: theme.accentColor, border: `${ctaBorderWidth}px solid ${theme.ctaBorderColor}` }
          : { background: "transparent", color: theme.accentColor, border: `${ctaBorderWidth}px solid transparent` }

    const actionStyle: React.CSSProperties = {
        ...buttonColors,
        minHeight: 44,
        minWidth: 44,
        padding: resolvedButtonStyle === "minimal" ? "10px 4px" : "10px 16px",
        borderRadius: buttonRadius,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        font: "600 14px/1.2 Inter, ui-sans-serif, system-ui, sans-serif",
        textDecoration: "none",
        textAlign: "center",
        whiteSpace: "nowrap",
        cursor: "pointer",
        transition: "outline-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
    }

    return (
        <article
            className={`review-badge-root review-badge-${layout}`}
            aria-label={`Customer reviews for ${businessName || "this business"}`}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                height: "auto",
                boxSizing: "border-box",
                ...({ containerType: "inline-size" } as React.CSSProperties),
                display: "flex",
                flexDirection: strip ? "row" : compact ? "row" : "column",
                alignItems: strip ? "center" : compact ? "center" : justify,
                justifyContent: strip ? "space-between" : justify,
                flexWrap: compact ? "wrap" : "nowrap",
                gap: theme.gap,
                padding: theme.internalPadding,
                overflow: "hidden",
                background: theme.background,
                color: theme.textColor,
                border: `${theme.borderWidth}px solid ${theme.borderColor}`,
                borderRadius: theme.cornerRadius,
                boxShadow: theme.shadow,
                textAlign,
                fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
        >
            <style>{`
                .review-badge-root .review-badge-action:focus-visible { outline: 3px solid ${theme.accentColor}; outline-offset: 3px; }
                .review-badge-root .review-badge-action:active { transform: translateY(1px); }
                @media (max-width: 520px) {
                    .review-badge-root.review-badge-strip { flex-direction: column !important; align-items: stretch !important; }
                    .review-badge-root.review-badge-strip .review-badge-content { align-items: flex-start !important; text-align: left !important; }
                    .review-badge-root .review-badge-actions { width: 100%; }
                    .review-badge-root .review-badge-actions > a { flex: 1 1 150px; white-space: normal !important; }
                }
                @media (max-width: 360px) {
                    .review-badge-root.review-badge-badge, .review-badge-root.review-badge-compact { flex-direction: column !important; align-items: stretch !important; }
                    .review-badge-root .review-badge-actions { flex-direction: column !important; }
                    .review-badge-root .review-badge-actions > a { width: 100%; flex: 0 0 auto; }
                }
            `}</style>

            <div
                className="review-badge-content"
                style={{
                    minWidth: 0,
                    display: "flex",
                    flex: "1 1 auto",
                    flexDirection: compact ? "row" : "column",
                    flexWrap: compact ? "wrap" : "nowrap",
                    alignItems: compact ? "center" : justify,
                    justifyContent: justify,
                    gap: compact ? Math.max(8, theme.gap * 0.7) : Math.max(6, theme.gap * 0.55),
                    textAlign,
                }}
            >
                {showBusinessName && businessName.trim() && (
                    <div style={{ width: compact ? "auto" : "100%", minWidth: 0, fontSize: compact ? 14 : 18, lineHeight: 1.25, fontWeight: 700, overflowWrap: "anywhere" }}>
                        {businessName}
                    </div>
                )}

                <div style={{ display: "flex", minWidth: 0, alignItems: "center", justifyContent: justify, flexWrap: "wrap", gap: 8 }}>
                    {showStars && (
                        <span role="img" aria-label={`${safeRating.toFixed(1)} out of 5 stars`} style={{ display: "inline-flex", gap: starGap, flex: "0 0 auto" }}>
                            {[0, 1, 2, 3, 4].map((index) => (
                                <Star key={index} fillAmount={safeRating - index} color={theme.starColor} size={starSize} />
                            ))}
                        </span>
                    )}
                    {showRating && <strong style={{ fontSize: compact ? 15 : 17, lineHeight: 1.2 }}>{safeRating.toFixed(1)}</strong>}
                    {showReviewCount && <span style={{ color: theme.mutedTextColor, fontSize: 14, lineHeight: 1.35 }}>{safeCount.toLocaleString()} reviews</span>}
                </div>

                {showPlatformLabel && platformLabel.trim() && (
                    <div style={{ color: theme.mutedTextColor, fontSize: 13, lineHeight: 1.35 }}>{platformLabel}</div>
                )}
                {showSupportingText && supportingText.trim() && !compact && (
                    <p style={{ width: "100%", minWidth: 0, margin: 0, color: theme.mutedTextColor, fontSize: 14, lineHeight: 1.5, overflowWrap: "anywhere" }}>
                        {supportingText}
                    </p>
                )}
            </div>

            {hasActions && (
                <nav className="review-badge-actions" aria-label="Review actions" style={{ display: "flex", flex: "0 1 auto", alignItems: "stretch", justifyContent: ctaJustify, flexWrap: "wrap", gap: ctaGap }}>
                    {hasReadAction && <a className="review-badge-action" href={reviewsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Read reviews for ${businessName || "this business"}`} style={actionStyle}>Read Reviews</a>}
                    {hasLeaveAction && <a className="review-badge-action" href={leaveReviewUrl} target="_blank" rel="noopener noreferrer" aria-label={`Leave a review for ${businessName || "this business"}`} style={actionStyle}>Leave a Review</a>}
                </nav>
            )}
        </article>
    )
}

addPropertyControls<ReviewBadgeProps>(ReviewBadge, {
    preset: { type: ControlType.Enum, title: "Preset", options: ["clean", "dark", "warm", "minimal", "elevated"], optionTitles: ["Clean", "Dark", "Warm", "Minimal", "Elevated"], defaultValue: "clean" },
    customizePreset: { type: ControlType.Boolean, title: "Customize", defaultValue: false },
    layout: { type: ControlType.Enum, title: "Layout", options: ["badge", "card", "compact", "strip"], optionTitles: ["Badge", "Card", "Compact", "CTA Strip"], defaultValue: "card", displaySegmentedControl: true, segmentedControlDirection: "vertical" },
    businessName: { type: ControlType.String, title: "Business", defaultValue: "Northside Print Co." },
    rating: { type: ControlType.Number, title: "Rating", defaultValue: 4.9, min: 0, max: 5, step: 0.1, displayStepper: true },
    reviewCount: { type: ControlType.Number, title: "Reviews", defaultValue: 287, min: 0, max: 1000000, step: 1, displayStepper: true },
    platformLabel: { type: ControlType.String, title: "Platform", defaultValue: "Google Reviews" },
    reviewsUrl: { type: ControlType.Link, title: "Reviews URL", defaultValue: "" },
    leaveReviewUrl: { type: ControlType.Link, title: "Review URL", defaultValue: "" },
    supportingText: { type: ControlType.String, title: "Support Text", defaultValue: "Trusted by customers in the local community.", displayTextArea: true },
    showBusinessName: { type: ControlType.Boolean, title: "Business", defaultValue: true },
    showRating: { type: ControlType.Boolean, title: "Rating #", defaultValue: true },
    showReviewCount: { type: ControlType.Boolean, title: "Count", defaultValue: true },
    showPlatformLabel: { type: ControlType.Boolean, title: "Platform", defaultValue: true },
    showReadReviews: { type: ControlType.Boolean, title: "Read CTA", defaultValue: true },
    showLeaveReview: { type: ControlType.Boolean, title: "Leave CTA", defaultValue: true },
    showSupportingText: { type: ControlType.Boolean, title: "Support Text", defaultValue: true },
    showStars: { type: ControlType.Boolean, title: "Stars", defaultValue: true },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#171717" },
    mutedTextColor: { type: ControlType.Color, title: "Muted", defaultValue: "#666666" },
    starColor: { type: ControlType.Color, title: "Stars", defaultValue: "#F5A623" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#2563EB" },
    borderColor: { type: ControlType.Color, title: "Border", defaultValue: "#E5E7EB" },
    borderWidth: { type: ControlType.Number, title: "Border Width", defaultValue: 1, min: 0, max: 8, step: 1, unit: "px" },
    cornerRadius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 64, step: 1, unit: "px" },
    internalPadding: { type: ControlType.Padding, title: "Padding", defaultValue: "20px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 14, min: 0, max: 48, step: 1, unit: "px" },
    buttonStyle: { type: ControlType.Enum, title: "CTA Style", options: ["filled", "outline", "minimal"], optionTitles: ["Filled", "Outline", "Minimal"], defaultValue: "filled", displaySegmentedControl: true },
    buttonRadius: { type: ControlType.Number, title: "CTA Radius", defaultValue: 10, min: 0, max: 40, step: 1, unit: "px" },
    ctaGap: { type: ControlType.Number, title: "CTA Gap", defaultValue: 10, min: 0, max: 32, step: 1, unit: "px" },
    ctaAlignment: { type: ControlType.Enum, title: "CTA Align", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], defaultValue: "left" },
    ctaBorderWidth: { type: ControlType.Number, title: "CTA Border", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" },
    ctaBackground: { type: ControlType.Color, title: "CTA Background", defaultValue: "#2563EB" },
    ctaTextColor: { type: ControlType.Color, title: "CTA Text", defaultValue: "#FFFFFF" },
    ctaBorderColor: { type: ControlType.Color, title: "CTA Border Color", defaultValue: "#2563EB" },
    shadow: { type: ControlType.BoxShadow, title: "Shadow" },
    alignment: { type: ControlType.Enum, title: "Align", options: ["left", "center", "right"], optionTitles: ["Left", "Center", "Right"], defaultValue: "left", displaySegmentedControl: true },
    starSize: { type: ControlType.Number, title: "Star Size", defaultValue: 20, min: 10, max: 40, step: 1, unit: "px", hidden: ({ showStars }) => !showStars },
    starGap: { type: ControlType.Number, title: "Star Gap", defaultValue: 3, min: 0, max: 16, step: 1, unit: "px", hidden: ({ showStars }) => !showStars },
})
