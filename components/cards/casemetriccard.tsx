import * as React from "react"
// @ts-ignore - ControlType.Font / useIsStaticRenderer aren't in Framer's public types.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const ImageControl = (ControlType as any).ResponsiveImage || ControlType.Image
// Aliased so TypeScript doesn't flag the Font control's returned "fontFamily" shape.
const FontControl = (ControlType as any).Font

type FontValue = {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
    letterSpacing?: string | number
    lineHeight?: string | number
}

const FALLBACK_FONT =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

type ImageValue =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

type Preset = "mono" | "tech" | "saas" | "emerald" | "warm" | "dark"
type Size = "compact" | "default" | "large"
type MediaStyle = "image" | "browser" | "placeholder"
type LinkMode = "none" | "ctaOnly" | "wholeCard"
type HoverMode = "none" | "subtle"
type PanelWidth = "balanced" | "contentFirst" | "metricFirst"
type CategoryStyle = "label" | "pill" | "hidden"
type AspectRatio = "original" | "16:9" | "16:10" | "3:2" | "4:3" | "1:1"

interface CaseMetricCardProps {
    style?: React.CSSProperties
    projectImage?: ImageValue

    category: string
    categoryStyle: CategoryStyle
    title: string
    description: string
    clientName: string
    clientLogo?: ImageValue

    mainMetric: string
    metricLabel: string
    progressValue: number

    stat1Value: string
    stat1Label: string
    stat2Value: string
    stat2Label: string
    stat3Value: string
    stat3Label: string

    ctaText: string
    ctaUrl: string
    ctaNewTab: boolean

    showCategory: boolean
    showClient: boolean
    showCTA: boolean
    showProgressBar: boolean
    showThirdStat: boolean
    showResultBadge: boolean
    resultBadge: string

    size: Size
    imageSide: "left" | "right"
    panelWidth: PanelWidth
    mediaStyle: MediaStyle
    aspectRatio: AspectRatio
    imageFit: "cover" | "contain"
    linkMode: LinkMode

    preset: Preset
    accentColor?: string
    backgroundColor?: string
    textColor?: string
    mutedTextColor?: string
    borderColor?: string
    resultPanelBackground?: string
    chipBackgroundColor?: string
    chipTextColor?: string
    borderRadius?: number
    shadowIntensity?: number

    hover: HoverMode
    motionStrength: number

    entranceReveal: boolean
    countUpMetrics: boolean
    imageShine: boolean

    bodyFont?: FontValue
    headingFont?: FontValue
}

const componentStyles = `
.caseMetricCard {
    container-type: inline-size;
}

.caseMetricLayout[data-image-side="right"] .caseMetricPreview {
    order: 2;
}

.caseMetricLayout[data-image-side="right"] .caseMetricResults {
    order: 1;
}

@container (max-width: 560px) {
    .caseMetricLayout {
        grid-template-columns: 1fr !important;
    }

    .caseMetricLayout[data-image-side="right"] .caseMetricPreview,
    .caseMetricLayout[data-image-side="right"] .caseMetricResults {
        order: initial !important;
    }
}

/* Entrance reveal — armed only on the client so SSR stays fully visible. */
.cm-armed .cm-item {
    opacity: 0;
    transform: translateY(12px);
    will-change: opacity, transform;
}

.cm-armed.cm-inview .cm-item {
    opacity: 1;
    transform: none;
    transition:
        opacity 0.6s cubic-bezier(0.22, 0.7, 0.2, 1),
        transform 0.6s cubic-bezier(0.22, 0.7, 0.2, 1);
    transition-delay: calc(var(--cm-i, 0) * 65ms);
}

/* Light sweep across the media on hover. */
.cm-shine::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background: linear-gradient(
        105deg,
        transparent 32%,
        rgba(255, 255, 255, 0.28) 47%,
        rgba(255, 255, 255, 0.12) 54%,
        transparent 68%
    );
    transform: translateX(-130%);
}

.cm-hoverable:hover .cm-shine::after {
    transform: translateX(130%);
    transition: transform 0.9s cubic-bezier(0.4, 0.1, 0.2, 1);
}

/* Image loading shimmer. */
.cm-skeleton {
    position: absolute;
    inset: 0;
    z-index: 4;
    border-radius: inherit;
    background: linear-gradient(
        100deg,
        var(--cm-sk1) 20%,
        var(--cm-sk2) 40%,
        var(--cm-sk1) 60%
    );
    background-size: 220% 100%;
    animation: cmShimmer 1.4s ease-in-out infinite;
    transition: opacity 0.45s ease;
}

@keyframes cmShimmer {
    0% {
        background-position: 180% 0;
    }
    100% {
        background-position: -60% 0;
    }
}

/* Traveling sheen on the progress fill. */
.cm-progressFill {
    position: relative;
    overflow: hidden;
}

.cm-progressFill::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.55),
        transparent
    );
    transform: translateX(-100%);
    animation: cmProgressSheen 2.4s ease-in-out 1.2s infinite;
}

@keyframes cmProgressSheen {
    0% {
        transform: translateX(-100%);
    }
    55%,
    100% {
        transform: translateX(340%);
    }
}

/* Growing CTA underline. */
.cm-cta {
    position: relative;
}

.cm-cta::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -2px;
    height: 1.5px;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.cm-hoverable:hover .cm-cta::after,
.cm-cta:focus-visible::after {
    transform: scaleX(1);
}

/* Respect reduced motion regardless of JS timing. */
@media (prefers-reduced-motion: reduce) {
    .cm-item {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
    }

    .cm-shine::after {
        display: none !important;
    }

    .cm-skeleton,
    .cm-progressFill::after,
    .cm-cta::after {
        animation: none !important;
        transition: none !important;
    }
}
`

const presets: Record<
    Preset,
    {
        background: string
        text: string
        muted: string
        accent: string
        border: string
        resultBackground: string
        chipBackground: string
        chipText: string
        shadow: number
    }
> = {
    mono: {
        background: "#FFFFFF",
        text: "#09090B",
        muted: "#71717A",
        accent: "#18181B",
        border: "#E4E4E7",
        resultBackground: "#FAFAFA",
        chipBackground: "transparent",
        chipText: "#52525B",
        shadow: 1,
    },
    tech: {
        background: "#FFFFFF",
        text: "#09090B",
        muted: "#71717A",
        accent: "#2563EB",
        border: "#E4E4E7",
        resultBackground: "#FAFAFA",
        chipBackground: "transparent",
        chipText: "#52525B",
        shadow: 2,
    },
    saas: {
        background: "#FFFFFF",
        text: "#101828",
        muted: "#667085",
        accent: "#635BFF",
        border: "rgba(16, 24, 40, 0.10)",
        resultBackground: "#F8F7FF",
        chipBackground: "rgba(99, 91, 255, 0.08)",
        chipText: "#5147D9",
        shadow: 10,
    },
    emerald: {
        background: "#FFFFFF",
        text: "#0A0A0A",
        muted: "#6B7280",
        accent: "#059669",
        border: "#E5E7EB",
        resultBackground: "#F0FDF9",
        chipBackground: "rgba(5, 150, 105, 0.09)",
        chipText: "#047857",
        shadow: 8,
    },
    warm: {
        background: "#FFFFFF",
        text: "#292524",
        muted: "#78716C",
        accent: "#B45309",
        border: "#E7E5E4",
        resultBackground: "#FAF9F7",
        chipBackground: "rgba(180, 83, 9, 0.08)",
        chipText: "#9A3412",
        shadow: 4,
    },
    dark: {
        background: "#09090B",
        text: "#FAFAFA",
        muted: "#A1A1AA",
        accent: "#60A5FA",
        border: "rgba(255, 255, 255, 0.12)",
        resultBackground: "#111113",
        chipBackground: "rgba(255, 255, 255, 0.06)",
        chipText: "#D4D4D8",
        shadow: 6,
    },
}

const sizes: Record<
    Size,
    {
        padding: number
        gap: number
        mediaRatio: string
        titleSize: number
        metricSize: number
        bodySize: number
        minHeight: number
        panelPadding: number
        chipSize: number
        mediaMinHeight: number
    }
> = {
    compact: {
        padding: 8,
        gap: 8,
        mediaRatio: "16 / 9",
        titleSize: 16,
        metricSize: 34,
        bodySize: 12,
        minHeight: 190,
        panelPadding: 9,
        chipSize: 10,
        mediaMinHeight: 92,
    },
    default: {
        padding: 10,
        gap: 10,
        mediaRatio: "16 / 10",
        titleSize: 19,
        metricSize: 40,
        bodySize: 13,
        minHeight: 230,
        panelPadding: 10,
        chipSize: 10.5,
        mediaMinHeight: 108,
    },
    large: {
        padding: 12,
        gap: 12,
        mediaRatio: "16 / 10",
        titleSize: 22,
        metricSize: 48,
        bodySize: 14,
        minHeight: 270,
        panelPadding: 12,
        chipSize: 11,
        mediaMinHeight: 128,
    },
}

function getPreset(preset: Preset) {
    return presets[preset] || presets.mono
}

function getSize(size: Size) {
    return sizes[size] || sizes.default
}

function getPanelColumns(panelWidth: PanelWidth) {
    if (panelWidth === "contentFirst") {
        return "minmax(0, 60fr) minmax(0, 40fr)"
    }

    if (panelWidth === "metricFirst") {
        return "minmax(0, 48fr) minmax(0, 52fr)"
    }

    return "minmax(0, 56fr) minmax(0, 44fr)"
}

function getImage(image?: ImageValue) {
    if (!image) return { src: "", srcSet: undefined, alt: "" }
    if (typeof image === "string")
        return { src: image, srcSet: undefined, alt: "" }

    return {
        src: image.src || "",
        srcSet: image.srcSet,
        alt: image.alt || "",
    }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function alpha(color: string, opacity: number) {
    if (!color) return `rgba(24, 24, 27, ${opacity})`
    if (color === "transparent") return "rgba(0, 0, 0, 0)"

    if (color.startsWith("#")) {
        const raw = color.replace("#", "")
        const hex =
            raw.length === 3
                ? raw
                      .split("")
                      .map((part) => part + part)
                      .join("")
                : raw

        if (hex.length >= 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }
    }

    return color
}

function getShadow(
    intensity: number,
    preset: Preset,
    accent: string,
    focused: boolean,
    glow: boolean
) {
    const amount = clamp(intensity, 0, 100)

    const base =
        amount <= 0
            ? "none"
            : preset === "dark"
              ? `0 12px 28px rgba(0, 0, 0, ${amount / 360}), 0 0 0 1px ${alpha(
                    accent,
                    0.045
                )}`
              : preset === "saas"
                ? `0 ${5 + amount / 8}px ${14 + amount / 3.5}px rgba(16, 24, 40, ${
                      amount / 1200
                  })`
                : `0 ${3 + amount / 18}px ${8 + amount / 10}px rgba(16, 24, 40, ${
                      amount / 2600
                  })`

    const layers: string[] = []

    if (glow) {
        // Lifted, accent-tinted glow while the card is hovered.
        layers.push(
            preset === "dark"
                ? `0 18px 44px rgba(0, 0, 0, 0.45), 0 8px 24px ${alpha(accent, 0.28)}`
                : `0 16px 40px rgba(16, 24, 40, 0.14), 0 6px 18px ${alpha(accent, 0.16)}`
        )
    } else if (base !== "none") {
        layers.push(base)
    }

    if (focused) layers.push(`0 0 0 3px ${alpha(accent, 0.2)}`)

    return layers.length ? layers.join(", ") : "none"
}

function useReducedMotion(isStatic: boolean) {
    const [reduced, setReduced] = React.useState(isStatic)

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined" || !window.matchMedia) {
            setReduced(isStatic)
            return
        }

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(query.matches)

        const update = () => setReduced(query.matches)

        if (query.addEventListener) {
            query.addEventListener("change", update)
            return () => query.removeEventListener("change", update)
        }

        // Legacy Safari fallback — cast through any to avoid deprecated-API warnings.
        const legacy = query as any
        legacy.addListener(update)
        return () => legacy.removeListener(update)
    }, [isStatic])

    return reduced
}

// Runs before paint on the client, falls back to a no-op-safe effect on the server.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// Fires once when the element scrolls into view. When disabled it reports true
// immediately so static renders and reduced-motion users see the final state.
function useInView(ref: React.RefObject<Element>, enabled: boolean) {
    const [inView, setInView] = React.useState(false)

    React.useEffect(() => {
        if (!enabled) {
            setInView(true)
            return
        }

        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setInView(true)
            return
        }

        let done = false
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && !done) {
                        done = true
                        setInView(true)
                        io.disconnect()
                    }
                }
            },
            { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
        )

        io.observe(el)
        return () => io.disconnect()
    }, [enabled, ref])

    return inView
}

function parseAnimatedNumber(input: string) {
    if (typeof input !== "string") return null

    const match = input.match(/\d[\d,]*(?:\.\d+)?/)
    if (!match) return null

    const raw = match[0]
    const normalized = raw.replace(/,/g, "")
    const value = parseFloat(normalized)
    if (!isFinite(value)) return null

    const decimals = normalized.includes(".")
        ? normalized.split(".")[1].length
        : 0
    const grouped = raw.includes(",")
    const idx = match.index || 0

    return {
        value,
        decimals,
        grouped,
        prefix: input.slice(0, idx),
        suffix: input.slice(idx + raw.length),
    }
}

function formatAnimatedNumber(
    value: number,
    parsed: NonNullable<ReturnType<typeof parseAnimatedNumber>>
) {
    const fixed = value.toFixed(parsed.decimals)
    if (!parsed.grouped) return fixed

    const [intPart, decPart] = fixed.split(".")
    const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return decPart ? `${withSeparators}.${decPart}` : withSeparators
}

// Counts the numeric part of a metric string up from zero when in view,
// preserving any prefix/suffix (+, %, ×, " weeks", …).
function AnimatedValue({
    text,
    animate,
    inView,
    duration,
}: {
    text: string
    animate: boolean
    inView: boolean
    duration: number
}) {
    const parsed = React.useMemo(() => parseAnimatedNumber(text), [text])
    const [display, setDisplay] = React.useState(() =>
        parsed ? parsed.value : 0
    )
    const frame = React.useRef(0)

    // Pre-set to the start value before paint so the final number never flashes.
    useIsomorphicLayoutEffect(() => {
        if (animate && parsed) setDisplay(0)
    }, [animate, parsed])

    React.useEffect(() => {
        if (!parsed) return

        if (!animate || !inView) {
            setDisplay(parsed.value)
            return
        }

        const from = 0
        const to = parsed.value
        const start =
            typeof performance !== "undefined" ? performance.now() : Date.now()

        const tick = (now: number) => {
            const elapsed = now - start
            const t = Math.min(1, elapsed / duration)
            const eased = 1 - Math.pow(1 - t, 3)
            setDisplay(from + (to - from) * eased)
            if (t < 1) frame.current = requestAnimationFrame(tick)
        }

        frame.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame.current)
    }, [animate, inView, parsed, duration])

    if (!parsed) return <>{text}</>

    return (
        <>
            {parsed.prefix}
            {formatAnimatedNumber(display, parsed)}
            {parsed.suffix}
        </>
    )
}

function Arrow({
    color,
    active,
    transition,
}: {
    color: string
    active: boolean
    transition: string
}) {
    return (
        <span
            aria-hidden="true"
            style={{
                display: "inline-flex",
                transform: active ? "translateX(2px)" : "translateX(0)",
                transition,
                color,
            }}
        >
            →
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 264
 */
export default function CaseMetricCard(props: CaseMetricCardProps) {
    const {
        style,
        projectImage,

        category = "Growth Design",
        categoryStyle = "label",
        title = "A clearer path from visit to value",
        description = "A focused product story that turned more qualified traffic into trials.",
        clientName = "Northstar",
        clientLogo,

        mainMetric = "+48%",
        metricLabel = "Conversion lift",
        progressValue = 74,

        stat1Value = "3.2×",
        stat1Label = "Return on spend",
        stat2Value = "−31%",
        stat2Label = "Cost per lead",
        stat3Value = "6 weeks",
        stat3Label = "Time to impact",

        ctaText = "View case study",
        ctaUrl = "#",
        ctaNewTab = false,

        showCategory = true,
        showClient = true,
        showCTA = true,
        showProgressBar = true,
        showThirdStat = true,
        showResultBadge = true,
        resultBadge = "RESULT",

        size = "default",
        imageSide = "left",
        panelWidth = "balanced",
        mediaStyle = "browser",
        aspectRatio = "original",
        imageFit = "contain",
        linkMode = "ctaOnly",

        preset = "mono",
        accentColor,
        backgroundColor,
        textColor,
        mutedTextColor,
        borderColor,
        resultPanelBackground,
        chipBackgroundColor,
        chipTextColor,
        borderRadius = 14,
        shadowIntensity,

        hover = "subtle",
        motionStrength = 45,

        entranceReveal = true,
        countUpMetrics = true,
        imageShine = true,

        bodyFont,
        headingFont,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const prefersReducedMotion = useReducedMotion(isStatic)

    const [mounted, setMounted] = React.useState(false)
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [ctaFocused, setCtaFocused] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)

    const cardRef = React.useRef<HTMLElement>(null)
    const imgRef = React.useRef<HTMLImageElement>(null)

    useIsomorphicLayoutEffect(() => {
        setMounted(true)
    }, [])

    // Master switch for all JS-driven motion — off on canvas and for reduced motion.
    const animationsOn = mounted && !isStatic && !prefersReducedMotion
    const inView = useInView(cardRef, animationsOn)

    const presetValues = getPreset(preset)
    const sizeValues = getSize(size)
    const image = getImage(projectImage)
    const hasImage = Boolean(image.src)
    const logo = getImage(clientLogo)
    const hasLogo = Boolean(logo.src)
    const innerRadius = Math.max(8, borderRadius - 4)

    // Open case-study links in a new tab safely when requested.
    const linkTarget = ctaNewTab
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {}

    // Framer loads the chosen webfonts as long as the Font controls hold a value;
    // we only read the family so the component keeps its own size/weight scale.
    const bodyFontFamily = bodyFont?.fontFamily || FALLBACK_FONT
    const headingFontFamily = headingFont?.fontFamily || bodyFontFamily

    // Detect already-cached images so the skeleton never gets stuck.
    useIsomorphicLayoutEffect(() => {
        setImageLoaded(false)
        const img = imgRef.current
        if (img && img.complete && img.naturalWidth > 0) setImageLoaded(true)
    }, [image.src])

    // Each color control is an optional override: leave it off to keep the preset,
    // or enable it and pick a project color token. Undefined falls back to the preset.
    const colors = {
        background: backgroundColor || presetValues.background,
        text: textColor || presetValues.text,
        muted: mutedTextColor || presetValues.muted,
        accent: accentColor || presetValues.accent,
        border: borderColor || presetValues.border,
        result: resultPanelBackground || presetValues.resultBackground,
        chipBackground: chipBackgroundColor || presetValues.chipBackground,
        chipText: chipTextColor || presetValues.chipText,
    }

    const resolvedShadow =
        typeof shadowIntensity === "number"
            ? shadowIntensity
            : presetValues.shadow

    const motionAmount =
        isStatic || prefersReducedMotion
            ? 0
            : clamp(motionStrength, 0, 100) / 100

    const canMove = hover === "subtle" && motionAmount > 0

    const transition = canMove
        ? "transform 220ms cubic-bezier(.2,.8,.2,1), border-color 200ms ease, box-shadow 240ms ease, color 200ms ease, opacity 200ms ease"
        : "none"

    const lift = hovered && canMove ? -3 * motionAmount : 0
    const imageScale = hovered && canMove ? 1 + 0.03 * motionAmount : 1
    const ctaColor = hovered && canMove ? colors.accent : colors.text
    const glow = hovered && canMove

    const linkLabel = title
        ? `${ctaText || "Open case study"}: ${title}`
        : ctaText || "Open case study"

    const stats = [
        { value: stat1Value, label: stat1Label },
        { value: stat2Value, label: stat2Label },
        ...(showThirdStat ? [{ value: stat3Value, label: stat3Label }] : []),
    ]

    const shouldShowCategory =
        showCategory && categoryStyle !== "hidden" && Boolean(category)

    const doCountUp = animationsOn && countUpMetrics
    const hoverableClass = hover !== "none" ? " cm-hoverable" : ""
    const armedClass =
        entranceReveal && animationsOn
            ? inView
                ? " cm-armed cm-inview"
                : " cm-armed"
            : ""

    // Progress bar fill animates from 0 to target when it enters view.
    const targetProgress = clamp(progressValue, 0, 100)
    const [progressWidth, setProgressWidth] = React.useState(targetProgress)

    useIsomorphicLayoutEffect(() => {
        setProgressWidth(animationsOn ? 0 : targetProgress)
    }, [animationsOn, targetProgress])

    React.useEffect(() => {
        if (animationsOn && inView) setProgressWidth(targetProgress)
    }, [animationsOn, inView, targetProgress])

    const cardStyle: React.CSSProperties = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: sizeValues.minHeight,
        boxSizing: "border-box",
        overflow: "hidden",
        padding: sizeValues.padding,
        borderRadius,
        border: `1px solid ${
            hovered && hover !== "none"
                ? alpha(colors.accent, 0.28)
                : colors.border
        }`,
        background: colors.background,
        color: colors.text,
        boxShadow: getShadow(
            resolvedShadow,
            preset,
            colors.accent,
            focused || ctaFocused,
            glow
        ),
        transform: `translateY(${lift}px)`,
        transition,
        willChange: canMove ? "transform, box-shadow" : undefined,
        fontFamily: bodyFontFamily,
        outline: "none",
    }

    const ratioMap: Record<string, string> = {
        "1:1": "1 / 1",
        "4:3": "4 / 3",
        "3:2": "3 / 2",
        "16:10": "16 / 10",
        "16:9": "16 / 9",
    }
    const canShowRealImage =
        hasImage && (mediaStyle === "image" || mediaStyle === "browser")
    // "Original" lets the image define its own height, so no image is ever
    // cropped or letterboxed — it always displays at its true proportions.
    const useOriginalRatio = aspectRatio === "original" && canShowRealImage
    const shellAspect = useOriginalRatio
        ? undefined
        : ratioMap[aspectRatio] || sizeValues.mediaRatio
    // A blurred fill makes "contain" (which otherwise leaves empty bars) look
    // intentional for any image proportion.
    const useContainBackdrop =
        !useOriginalRatio && imageFit === "contain" && canShowRealImage
    const browserChromeHeight = 22

    const mediaShellStyle: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        borderRadius: innerRadius,
        // A floor keeps the skeleton visible pre-load and stops very small images
        // from collapsing; taller images grow the frame so it hugs them.
        minHeight: sizeValues.mediaMinHeight,
        aspectRatio: shellAspect,
        background: preset === "dark" ? "#101014" : "#F8F8F8",
        border: `1px solid ${alpha(colors.text, preset === "dark" ? 0.08 : 0.065)}`,
        isolation: "isolate",
    }

    // Image sizing: fill the frame (fixed ratios) or flow to natural height (original).
    const buildImageStyle = (withChrome: boolean): React.CSSProperties =>
        useOriginalRatio
            ? {
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: "auto",
                  display: "block",
                  paddingTop: withChrome ? browserChromeHeight : 0,
                  boxSizing: "border-box",
                  transform: `scale(${imageScale})`,
                  transformOrigin: "center top",
                  transition,
              }
            : {
                  position: "relative",
                  zIndex: 1,
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: imageFit,
                  objectPosition: "center",
                  paddingTop: withChrome ? browserChromeHeight : 0,
                  boxSizing: "border-box",
                  transform: `scale(${imageScale})`,
                  transition,
              }

    const containBackdrop = useContainBackdrop ? (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                backgroundImage: `url("${image.src}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(24px) saturate(1.1)",
                transform: "scale(1.18)",
                opacity: preset === "dark" ? 0.5 : 0.55,
            }}
        />
    ) : null

    const canSkeleton =
        hasImage && (mediaStyle === "image" || mediaStyle === "browser")
    const showSkeleton = animationsOn && canSkeleton && !imageLoaded

    // Only mounted on the live client — never animates on the Framer canvas/thumbnail.
    const skeleton =
        animationsOn && canSkeleton ? (
            <div
                aria-hidden="true"
                className="cm-skeleton"
                style={
                    {
                        opacity: showSkeleton ? 1 : 0,
                        // Halt the shimmer once loaded while the fade-out plays.
                        animation: showSkeleton ? undefined : "none",
                        pointerEvents: "none",
                        "--cm-sk1":
                            preset === "dark"
                                ? "rgba(255,255,255,0.05)"
                                : "rgba(0,0,0,0.05)",
                        "--cm-sk2":
                            preset === "dark"
                                ? "rgba(255,255,255,0.12)"
                                : "rgba(0,0,0,0.09)",
                    } as React.CSSProperties
                }
            />
        ) : null

    const productPlaceholder = (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                background:
                    preset === "dark"
                        ? "linear-gradient(180deg, #101014, #0D0D10)"
                        : "linear-gradient(180deg, #FAFAFA, #F5F5F5)",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    opacity: preset === "dark" ? 0.055 : 0.075,
                    backgroundImage: `linear-gradient(${alpha(
                        colors.text,
                        0.08
                    )} 1px, transparent 1px), linear-gradient(90deg, ${alpha(
                        colors.text,
                        0.08
                    )} 1px, transparent 1px)`,
                    backgroundSize: "24px 24px",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    left: "16%",
                    right: "16%",
                    top: "20%",
                    bottom: "18%",
                    overflow: "hidden",
                    borderRadius: 9,
                    border: `1px solid ${alpha(colors.text, 0.075)}`,
                    background: preset === "dark" ? "#151518" : "#FFFFFF",
                    boxShadow: `0 5px 12px ${alpha(
                        colors.text,
                        preset === "dark" ? 0.09 : 0.04
                    )}`,
                    display: "grid",
                    gridTemplateRows: "22px 1fr",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "34px 1fr 24px",
                        alignItems: "center",
                        gap: 7,
                        padding: "0 8px",
                        borderBottom: `1px solid ${alpha(colors.text, 0.065)}`,
                        background: preset === "dark" ? "#18181B" : "#FAFAFA",
                    }}
                >
                    <div style={{ display: "flex", gap: 3.5 }}>
                        {[0, 1, 2].map((dot) => (
                            <span
                                key={dot}
                                style={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: 999,
                                    background: alpha(colors.text, 0.2),
                                }}
                            />
                        ))}
                    </div>
                    <div
                        style={{
                            height: 5,
                            width: "56%",
                            borderRadius: 999,
                            background: alpha(colors.text, 0.07),
                        }}
                    />
                    <div
                        style={{
                            height: 5,
                            borderRadius: 999,
                            background: alpha(colors.accent, 0.18),
                        }}
                    />
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "26% 1fr",
                        minHeight: 0,
                    }}
                >
                    <div
                        style={{
                            borderRight: `1px solid ${alpha(colors.text, 0.055)}`,
                            padding: 8,
                            display: "grid",
                            alignContent: "start",
                            gap: 6,
                            background:
                                preset === "dark"
                                    ? "rgba(255,255,255,0.012)"
                                    : "rgba(0,0,0,0.012)",
                        }}
                    >
                        {[0, 1, 2].map((row) => (
                            <span
                                key={row}
                                style={{
                                    height: 5,
                                    width:
                                        row === 0
                                            ? "72%"
                                            : row === 1
                                              ? "56%"
                                              : "64%",
                                    borderRadius: 999,
                                    background:
                                        row === 0
                                            ? alpha(colors.accent, 0.18)
                                            : alpha(colors.text, 0.075),
                                }}
                            />
                        ))}
                    </div>

                    <div
                        style={{
                            padding: 9,
                            display: "grid",
                            gap: 7,
                            alignContent: "start",
                        }}
                    >
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 34px",
                                gap: 7,
                            }}
                        >
                            <span
                                style={{
                                    height: 6,
                                    width: "66%",
                                    borderRadius: 999,
                                    background: alpha(colors.text, 0.105),
                                }}
                            />
                            <span
                                style={{
                                    height: 6,
                                    borderRadius: 999,
                                    background: alpha(colors.accent, 0.2),
                                }}
                            />
                        </div>

                        <div
                            style={{
                                height: 26,
                                borderRadius: 7,
                                border: `1px solid ${alpha(colors.text, 0.055)}`,
                                background: alpha(colors.text, 0.025),
                            }}
                        />

                        {[0, 1].map((row) => (
                            <div
                                key={row}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "38% 1fr 24px",
                                    gap: 6,
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        height: 5,
                                        borderRadius: 999,
                                        background: alpha(colors.text, 0.085),
                                    }}
                                />
                                <span
                                    style={{
                                        height: 5,
                                        borderRadius: 999,
                                        background: alpha(colors.text, 0.06),
                                    }}
                                />
                                <span
                                    style={{
                                        height: 5,
                                        borderRadius: 999,
                                        background:
                                            row === 1
                                                ? alpha(colors.accent, 0.16)
                                                : alpha(colors.text, 0.065),
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    const minimalPlaceholder = (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                inset: 0,
                background:
                    preset === "dark"
                        ? alpha(colors.accent, 0.035)
                        : alpha(colors.text, 0.018),
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "26%",
                    right: "26%",
                    top: "32%",
                    bottom: "30%",
                    borderRadius: 8,
                    border: `1px solid ${alpha(colors.text, 0.07)}`,
                    background: preset === "dark" ? "#151518" : "#FFFFFF",
                    display: "grid",
                    gap: 7,
                    alignContent: "center",
                    padding: 12,
                    boxShadow: `0 4px 10px ${alpha(colors.text, 0.035)}`,
                }}
            >
                <span
                    style={{
                        height: 6,
                        width: "70%",
                        borderRadius: 999,
                        background: alpha(colors.text, 0.1),
                    }}
                />
                <span
                    style={{
                        height: 6,
                        width: "44%",
                        borderRadius: 999,
                        background: alpha(colors.accent, 0.16),
                    }}
                />
            </div>
        </div>
    )

    const shineClass = imageShine && hover !== "none" ? " cm-shine" : ""

    const mediaBlock = (
        <div
            className={`cm-item cm-media${shineClass}`}
            style={{ ...mediaShellStyle, ["--cm-i" as any]: 0 }}
        >
            {mediaStyle === "image" && hasImage ? (
                <>
                    {containBackdrop}
                    <img
                        ref={imgRef}
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || `${title} project preview`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                        style={buildImageStyle(false)}
                    />
                </>
            ) : mediaStyle === "browser" && hasImage ? (
                <>
                    {containBackdrop}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 22,
                            zIndex: 2,
                            display: "grid",
                            gridTemplateColumns: "34px 1fr",
                            alignItems: "center",
                            gap: 7,
                            padding: "0 8px",
                            borderBottom: `1px solid ${alpha(colors.text, 0.065)}`,
                            background:
                                preset === "dark"
                                    ? "rgba(255,255,255,0.04)"
                                    : "rgba(250,250,250,0.84)",
                            backdropFilter: "blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                        }}
                    >
                        <div style={{ display: "flex", gap: 3.5 }}>
                            {[0, 1, 2].map((dot) => (
                                <span
                                    key={dot}
                                    style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: 999,
                                        background: alpha(colors.text, 0.22),
                                    }}
                                />
                            ))}
                        </div>
                        <div
                            style={{
                                width: "44%",
                                height: 5,
                                borderRadius: 999,
                                background: alpha(colors.text, 0.075),
                            }}
                        />
                    </div>
                    <img
                        ref={imgRef}
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || `${title} project preview`}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageLoaded(true)}
                        style={buildImageStyle(true)}
                    />
                </>
            ) : mediaStyle === "placeholder" ? (
                minimalPlaceholder
            ) : (
                productPlaceholder
            )}

            {skeleton}
        </div>
    )

    const cta =
        showCTA && ctaText ? (
            linkMode === "ctaOnly" && ctaUrl ? (
                <a
                    href={ctaUrl}
                    {...linkTarget}
                    className="cm-cta"
                    aria-label={linkLabel}
                    onFocus={() => setCtaFocused(true)}
                    onBlur={() => setCtaFocused(false)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        width: "fit-content",
                        color: ctaColor,
                        fontSize: sizeValues.bodySize,
                        fontWeight: 600,
                        lineHeight: 1,
                        textDecoration: "none",
                        borderRadius: 6,
                        outline: "none",
                        opacity: hovered && canMove ? 1 : 0.9,
                        transition,
                        boxShadow: ctaFocused
                            ? `0 0 0 3px ${alpha(colors.accent, 0.2)}`
                            : undefined,
                    }}
                >
                    <span>{ctaText}</span>
                    <Arrow
                        color={ctaColor}
                        active={hovered && canMove}
                        transition={transition}
                    />
                </a>
            ) : linkMode === "none" ? (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        width: "fit-content",
                        color: colors.text,
                        fontSize: sizeValues.bodySize,
                        fontWeight: 600,
                        lineHeight: 1,
                        opacity: 0.9,
                    }}
                >
                    <span>{ctaText}</span>
                    <Arrow
                        color={colors.text}
                        active={false}
                        transition={transition}
                    />
                </span>
            ) : (
                <span
                    aria-hidden="true"
                    className="cm-cta"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        width: "fit-content",
                        color: ctaColor,
                        fontSize: sizeValues.bodySize,
                        fontWeight: 600,
                        lineHeight: 1,
                        opacity: hovered && canMove ? 1 : 0.9,
                        transition,
                    }}
                >
                    <span>{ctaText}</span>
                    <Arrow
                        color={ctaColor}
                        active={hovered && canMove}
                        transition={transition}
                    />
                </span>
            )
        ) : null

    const categoryNode =
        shouldShowCategory && categoryStyle === "label" ? (
            <span
                className="cm-item"
                style={{
                    ["--cm-i" as any]: 1,
                    display: "inline-flex",
                    width: "fit-content",
                    color: colors.muted,
                    fontSize: sizeValues.chipSize,
                    lineHeight: 1,
                    fontWeight: 650,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                }}
            >
                {category}
            </span>
        ) : shouldShowCategory && categoryStyle === "pill" ? (
            <span
                className="cm-item"
                style={{
                    ["--cm-i" as any]: 1,
                    display: "inline-flex",
                    width: "fit-content",
                    padding: "3px 6px",
                    borderRadius: 7,
                    background: colors.chipBackground,
                    color: colors.chipText,
                    fontSize: sizeValues.chipSize,
                    lineHeight: 1,
                    fontWeight: 650,
                    letterSpacing: "0.01em",
                }}
            >
                {category}
            </span>
        ) : null

    const contentBlock = (
        <div
            style={{
                display: "grid",
                gap: size === "compact" ? 6 : 7,
                alignContent: "start",
            }}
        >
            {categoryNode}

            <div
                className="cm-item"
                style={{ ["--cm-i" as any]: 2, display: "grid", gap: 4 }}
            >
                <h3
                    style={{
                        margin: 0,
                        color: colors.text,
                        fontFamily: headingFontFamily,
                        fontSize: sizeValues.titleSize,
                        lineHeight: 1.1,
                        letterSpacing: "-0.028em",
                        fontWeight: 720,
                    }}
                >
                    {title}
                </h3>

                {description && (
                    <p
                        style={{
                            margin: 0,
                            color: colors.muted,
                            fontSize: sizeValues.bodySize,
                            lineHeight: 1.4,
                        }}
                    >
                        {description}
                    </p>
                )}
            </div>

            {showClient && (hasLogo || clientName) && (
                <div
                    className="cm-item"
                    style={{
                        ["--cm-i" as any]: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                    }}
                >
                    {hasLogo && (
                        <img
                            src={logo.src}
                            srcSet={logo.srcSet}
                            alt={
                                logo.alt ||
                                (clientName
                                    ? `${clientName} logo`
                                    : "Client logo")
                            }
                            loading="lazy"
                            decoding="async"
                            style={{
                                height:
                                    size === "large"
                                        ? 22
                                        : size === "compact"
                                          ? 16
                                          : 18,
                                width: "auto",
                                maxWidth: 132,
                                objectFit: "contain",
                                display: "block",
                                // Neutral-toned logos read on dark; full-color logos are untouched.
                                opacity: preset === "dark" ? 0.92 : 1,
                            }}
                        />
                    )}
                    {clientName &&
                        (hasLogo ? (
                            <span
                                style={{
                                    color: colors.muted,
                                    fontSize: Math.max(
                                        10,
                                        sizeValues.bodySize - 1
                                    ),
                                    lineHeight: 1.3,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {clientName}
                            </span>
                        ) : (
                            <p
                                style={{
                                    margin: 0,
                                    color: colors.muted,
                                    fontSize: Math.max(
                                        10,
                                        sizeValues.bodySize - 1
                                    ),
                                    lineHeight: 1.3,
                                }}
                            >
                                Client{" "}
                                <span
                                    style={{
                                        color: colors.text,
                                        fontWeight: 650,
                                    }}
                                >
                                    {clientName}
                                </span>
                            </p>
                        ))}
                </div>
            )}

            {cta && (
                <div className="cm-item" style={{ ["--cm-i" as any]: 4 }}>
                    {cta}
                </div>
            )}
        </div>
    )

    const previewSide = (
        <section
            className="caseMetricPreview"
            style={{
                position: "relative",
                zIndex: 1,
                minWidth: 0,
                display: "grid",
                gap: sizeValues.gap,
                alignContent: "start",
            }}
        >
            {mediaBlock}
            {contentBlock}
        </section>
    )

    const resultSide = (
        <section
            className="caseMetricResults"
            aria-label="Case study results"
            style={{
                position: "relative",
                zIndex: 1,
                minWidth: 0,
                display: "grid",
                // Centered so the metric stays balanced when the image (and thus
                // the story column) is taller than the results content.
                alignContent: "center",
                gap: size === "compact" ? 6 : 7,
                padding: sizeValues.panelPadding,
                borderRadius: innerRadius,
                border: `1px solid ${alpha(
                    colors.text,
                    preset === "dark" ? 0.075 : 0.065
                )}`,
                background: colors.result,
            }}
        >
            {showResultBadge && resultBadge && (
                <span
                    className="cm-item"
                    style={{
                        ["--cm-i" as any]: 2,
                        display: "inline-flex",
                        width: "fit-content",
                        color: colors.muted,
                        fontSize: size === "compact" ? 9.5 : 10,
                        lineHeight: 1,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    {resultBadge}
                </span>
            )}

            <div
                className="cm-item"
                style={{ ["--cm-i" as any]: 3, display: "grid", gap: 2 }}
            >
                <div
                    style={{
                        color: colors.accent,
                        fontFamily: headingFontFamily,
                        fontSize: sizeValues.metricSize,
                        lineHeight: 0.95,
                        letterSpacing: "-0.035em",
                        fontWeight: 720,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    <AnimatedValue
                        text={mainMetric}
                        animate={doCountUp}
                        inView={inView}
                        duration={1200}
                    />
                </div>

                <p
                    style={{
                        margin: 0,
                        color: colors.muted,
                        fontSize: sizeValues.bodySize,
                        lineHeight: 1.2,
                        fontWeight: 580,
                    }}
                >
                    {metricLabel}
                </p>
            </div>

            {showProgressBar && (
                <div
                    className="cm-item"
                    aria-hidden="true"
                    style={{
                        ["--cm-i" as any]: 4,
                        width: "100%",
                        height: 3,
                        borderRadius: 999,
                        overflow: "hidden",
                        background: alpha(
                            colors.text,
                            preset === "dark" ? 0.13 : 0.08
                        ),
                        marginTop: 1,
                    }}
                >
                    <div
                        className={animationsOn ? "cm-progressFill" : undefined}
                        style={{
                            width: `${progressWidth}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: colors.accent,
                            opacity: 0.85,
                            transition: animationsOn
                                ? "width 1.1s cubic-bezier(.2,.7,.2,1)"
                                : "none",
                        }}
                    />
                </div>
            )}

            <dl
                style={{
                    display: "grid",
                    gap: 0,
                    margin: showProgressBar ? "1px 0 0" : 0,
                }}
            >
                {stats.map((stat, index) => (
                    <div
                        key={`${stat.value}-${stat.label}-${index}`}
                        className="cm-item"
                        style={{
                            ["--cm-i" as any]: 5 + index,
                            display: "grid",
                            gridTemplateColumns: "64px minmax(0, 1fr)",
                            alignItems: "center",
                            gap: 8,
                            padding:
                                index === 0
                                    ? "0 0 6px"
                                    : index === stats.length - 1
                                      ? "6px 0 0"
                                      : "6px 0",
                            borderTop:
                                index === 0
                                    ? undefined
                                    : `1px solid ${alpha(
                                          colors.text,
                                          preset === "dark" ? 0.095 : 0.065
                                      )}`,
                        }}
                    >
                        <dd
                            style={{
                                margin: 0,
                                color: colors.text,
                                fontSize: sizeValues.bodySize,
                                lineHeight: 1,
                                fontWeight: 680,
                                whiteSpace: "nowrap",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            <AnimatedValue
                                text={stat.value}
                                animate={doCountUp}
                                inView={inView}
                                duration={1000 + index * 130}
                            />
                        </dd>
                        <dt
                            style={{
                                margin: 0,
                                color: colors.muted,
                                fontSize: Math.max(10, sizeValues.bodySize - 1),
                                lineHeight: 1.2,
                                textAlign: "right",
                            }}
                        >
                            {stat.label}
                        </dt>
                    </div>
                ))}
            </dl>
        </section>
    )

    return (
        <article
            ref={cardRef as any}
            className={`caseMetricCard${hoverableClass}${armedClass}`}
            onMouseEnter={() => {
                if (!isStatic) setHovered(true)
            }}
            onMouseLeave={() => {
                if (!isStatic) setHovered(false)
            }}
            style={cardStyle}
        >
            <style>{componentStyles}</style>

            {linkMode === "wholeCard" && ctaUrl && (
                <a
                    href={ctaUrl}
                    {...linkTarget}
                    aria-label={linkLabel}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 5,
                        borderRadius,
                        outline: "none",
                        background: "transparent",
                    }}
                />
            )}

            <div
                className="caseMetricLayout"
                data-image-side={imageSide}
                style={{
                    position: "relative",
                    zIndex: 1,
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    gridTemplateColumns: getPanelColumns(panelWidth),
                    gap: sizeValues.gap,
                    alignItems: "stretch",
                }}
            >
                {previewSide}
                {resultSide}
            </div>
        </article>
    )
}

// Note: no `CaseMetricCard.defaultProps` — it's deprecated for function
// components. Runtime defaults come from the destructured props above, and
// canvas defaults come from each control's `defaultValue` below.

addPropertyControls(CaseMetricCard as React.ComponentType<any>, {
    // ── Content ─────────────────────────────────────────────
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "A clearer path from visit to value",
        displayTextArea: true,
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "A focused product story that turned more qualified traffic into trials.",
        displayTextArea: true,
    },
    categoryStyle: {
        type: ControlType.Enum,
        title: "Category",
        options: ["label", "pill", "hidden"],
        optionTitles: ["Label", "Pill", "Hidden"],
        defaultValue: "label",
        description: "The small tag shown above the title.",
    },
    category: {
        type: ControlType.String,
        title: "Category Text",
        defaultValue: "Growth Design",
        hidden: (p) => p.categoryStyle === "hidden" || !p.showCategory,
    },
    showCategory: {
        type: ControlType.Boolean,
        title: "Show Category",
        defaultValue: true,
        hidden: (p) => p.categoryStyle === "hidden",
    },
    clientName: {
        type: ControlType.String,
        title: "Client",
        defaultValue: "Northstar",
        hidden: (p) => !p.showClient,
    },
    clientLogo: {
        type: ImageControl,
        title: "Client Logo",
        description:
            "Optional. Shown in place of — or beside — the client name.",
        hidden: (p) => !p.showClient,
    } as any,
    showClient: {
        type: ControlType.Boolean,
        title: "Show Client",
        defaultValue: true,
    },

    // ── Result / metrics ────────────────────────────────────
    mainMetric: {
        type: ControlType.String,
        title: "Main Metric",
        defaultValue: "+48%",
        description:
            "Any text. The number counts up on scroll; a prefix/suffix like +, %, × or “weeks” is kept.",
    },
    metricLabel: {
        type: ControlType.String,
        title: "Metric Label",
        defaultValue: "Conversion lift",
    },
    showResultBadge: {
        type: ControlType.Boolean,
        title: "Badge",
        defaultValue: true,
        description: "Small caption above the main metric.",
    },
    resultBadge: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "RESULT",
        hidden: (p) => !p.showResultBadge,
    },
    showProgressBar: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
    },
    progressValue: {
        type: ControlType.Number,
        title: "Progress",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 74,
        unit: "%",
        hidden: (p) => !p.showProgressBar,
        description: "Fills the bar beneath the metric as it scrolls in.",
    },
    stat1Value: {
        type: ControlType.String,
        title: "Stat 1",
        defaultValue: "3.2×",
    },
    stat1Label: {
        type: ControlType.String,
        title: "Label 1",
        defaultValue: "Return on spend",
    },
    stat2Value: {
        type: ControlType.String,
        title: "Stat 2",
        defaultValue: "−31%",
    },
    stat2Label: {
        type: ControlType.String,
        title: "Label 2",
        defaultValue: "Cost per lead",
    },
    showThirdStat: {
        type: ControlType.Boolean,
        title: "Stat 3",
        defaultValue: true,
    },
    stat3Value: {
        type: ControlType.String,
        title: "Stat 3",
        defaultValue: "6 weeks",
        hidden: (p) => !p.showThirdStat,
    },
    stat3Label: {
        type: ControlType.String,
        title: "Label 3",
        defaultValue: "Time to impact",
        hidden: (p) => !p.showThirdStat,
    },

    // ── Call to action / link ───────────────────────────────
    linkMode: {
        type: ControlType.Enum,
        title: "Link",
        options: ["none", "ctaOnly", "wholeCard"],
        optionTitles: ["None", "CTA Only", "Whole Card"],
        defaultValue: "ctaOnly",
        description:
            "None = no link. CTA Only = the link text is clickable. Whole Card = the entire card links.",
    },
    showCTA: {
        type: ControlType.Boolean,
        title: "Show CTA Text",
        defaultValue: true,
    },
    ctaText: {
        type: ControlType.String,
        title: "CTA Text",
        defaultValue: "View case study",
        hidden: (p) => !p.showCTA,
    },
    ctaUrl: {
        type: ControlType.Link,
        title: "URL",
        defaultValue: "#",
        hidden: (p) => p.linkMode === "none",
    },
    ctaNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (p) => p.linkMode === "none",
        description: "Open the link in a new browser tab.",
    },

    // ── Media ───────────────────────────────────────────────
    mediaStyle: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "browser", "placeholder"],
        optionTitles: ["Image", "Browser Mockup", "Minimal Placeholder"],
        defaultValue: "browser",
        description:
            "Your image plain, framed in a browser mockup, or a built-in placeholder.",
    },
    projectImage: {
        type: ImageControl,
        title: "Project Image",
        hidden: (p) => p.mediaStyle === "placeholder",
    } as any,
    aspectRatio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ["original", "16:9", "16:10", "3:2", "4:3", "1:1"],
        optionTitles: ["Hug image", "16:9", "16:10", "3:2", "4:3", "1:1"],
        defaultValue: "original",
        hidden: (p) => p.mediaStyle === "placeholder",
        description:
            "“Hug image” fits the frame to each image — no empty background. Pick a fixed ratio to keep every card the same height in a grid.",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "contain",
        hidden: (p) =>
            p.mediaStyle === "placeholder" || p.aspectRatio === "original",
        description:
            "Fill crops to fill the frame; Fit shows the whole image on a blurred backdrop.",
    },

    // ── Layout ──────────────────────────────────────────────
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["compact", "default", "large"],
        optionTitles: ["Compact", "Default", "Large"],
        defaultValue: "default",
        description: "Overall scale and typography.",
    },
    imageSide: {
        type: ControlType.Enum,
        title: "Image Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
    },
    panelWidth: {
        type: ControlType.Enum,
        title: "Panel Width",
        options: ["balanced", "contentFirst", "metricFirst"],
        optionTitles: ["Balanced", "Content First", "Metric First"],
        defaultValue: "balanced",
        description: "How space is split between the story and the results.",
    },

    // ── Theme ───────────────────────────────────────────────
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["mono", "tech", "saas", "emerald", "warm", "dark"],
        optionTitles: ["Mono", "Tech", "SaaS", "Emerald", "Warm", "Dark"],
        defaultValue: "mono",
        description:
            "Starting color theme. Enable any color below to override it.",
    },
    headingFont: {
        type: FontControl,
        title: "Heading Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    } as any,
    bodyFont: {
        type: FontControl,
        title: "Body Font",
        controls: "basic",
        defaultFontType: "sans-serif",
    } as any,
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        optional: true,
        description: "Overrides the preset. Leave disabled to keep the theme.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        optional: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        optional: true,
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        optional: true,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        optional: true,
    },
    resultPanelBackground: {
        type: ControlType.Color,
        title: "Result BG",
        optional: true,
    },
    chipBackgroundColor: {
        type: ControlType.Color,
        title: "Chip BG",
        optional: true,
    },
    chipTextColor: {
        type: ControlType.Color,
        title: "Chip Text",
        optional: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 8,
        max: 28,
        step: 1,
        defaultValue: 14,
        unit: "px",
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        min: 0,
        max: 100,
        step: 1,
        optional: true,
        description: "Leave disabled to use the preset's shadow.",
    },

    // ── Motion ──────────────────────────────────────────────
    hover: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["none", "subtle"],
        optionTitles: ["None", "Subtle"],
        defaultValue: "subtle",
        description: "Lift, glow and image zoom on pointer hover.",
    },
    motionStrength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 45,
        hidden: (p) => p.hover === "none",
    },
    entranceReveal: {
        type: ControlType.Boolean,
        title: "Entrance Reveal",
        defaultValue: true,
        description: "Fade and rise content in when it scrolls into view.",
    },
    countUpMetrics: {
        type: ControlType.Boolean,
        title: "Count Up",
        defaultValue: true,
        description: "Animate numeric values up from zero on scroll.",
    },
    imageShine: {
        type: ControlType.Boolean,
        title: "Image Shine",
        defaultValue: true,
        hidden: (p) => p.hover === "none",
        description: "Sweep a light reflection across the image on hover.",
    },
})
