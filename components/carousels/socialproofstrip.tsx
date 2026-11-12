import * as React from "react"
// @ts-ignore — useIsStaticRenderer and ControlType.Font are not in Framer's
// public TypeScript definitions but exist at runtime.
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
 * UniversalSocialProofStrip
 * ------------------------------------------------------------------
 * A compact, highly configurable reviews & trust bar for Framer.
 * Works near heroes, pricing tables, forms, checkout CTAs and footers
 * across SaaS, ecommerce, portfolios, local businesses and rentals.
 *
 * - No external dependencies, no CSS files, no API keys.
 * - All content is manual OR bindable to Framer CMS fields.
 * - Sized by Framer: renders at its set frame size and wraps to fit.
 * - Accessible: semantic markup, aria-labels, focus-visible, reduced motion.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 96
 */

// This IS ControlType.Font (Framer's native font picker). It is aliased via
// a cast because `Font` is missing from Framer's public ControlType types;
// the `@ts-ignore` on the import alone does not silence the key-level error.
const FontControl = (ControlType as any).Font

/* ======================================================================
 *  Types
 * ==================================================================== */

type FontValue = React.CSSProperties

interface MetricItemData {
    value: string
    label: string
    icon?: string
    tooltip?: string
    primary: boolean
}

interface LogoItemData {
    image?: string
    alt: string
    link?: string
    tooltip?: string
}

interface TestimonialItem {
    quote: string
    author: string
    role: string
    company: string
    avatar?: string
    verified?: boolean
}

interface AvatarItem {
    image?: string
    alt: string
}

// Animation state threaded into number-bearing blocks.
interface AnimState {
    numbers: boolean // count-up feature on for this instance
    run: boolean // element is in view → play
    duration: number
}

interface BadgeItemData {
    platform: string
    icon?: string
    rating?: string
    reviewCount?: string
    link?: string
    background: string
    text: string
    border: string
}

type Preset =
    | "fullWidth"
    | "inline"
    | "mini"
    | "stacked"
    | "logoFocused"
    | "testimonialFocused"

type Emphasis =
    | "rating"
    | "primaryMetric"
    | "testimonial"
    | "platformBadge"
    | "balanced"

type ThemeName =
    | "cleanLight"
    | "cleanDark"
    | "softNeutral"
    | "highContrast"
    | "minimalBorderless"
    | "glass"
    | "warm"
    | "custom"

interface ThemeTokens {
    background: string
    text: string
    muted: string
    border: string
    borderWidth: number
    borderStyle: "solid" | "dashed" | "dotted" | "none"
    radius: number
    shadow: string
    star: string
    starEmpty: string
    divider: string
    accent: string
    accentText: string
    backdropBlur: number
}

interface Props {
    // Content root
    preset: Preset
    layoutMode: "auto" | "horizontal" | "vertical"
    emphasis: Emphasis
    theme: ThemeName

    trustMessageEnabled: boolean
    trustMessage: string
    trustMessagePosition: "above" | "beside" | "below"

    // Rating
    showRating: boolean
    ratingValue: number
    ratingMax: number
    reviewCount: string
    ratingLabel: string
    ratingLabelEnabled: boolean
    partialStars: boolean
    starSize: number
    starGap: number
    starFilled: string
    starEmpty: string
    showReviewCount: boolean
    scoreFont: FontValue
    ratingLabelFont: FontValue
    reviewCountFont: FontValue

    // Platforms
    showBadges: boolean
    badges: BadgeItemData[]
    badgeLayout: "row" | "wrap" | "column"
    badgeSize: number
    badgeRadius: number
    badgeGap: number
    maxBadges: number
    badgeNewTab: boolean
    badgeShowRating: boolean
    badgeShowCount: boolean
    badgeFont: FontValue

    // Testimonial
    showTestimonial: boolean
    quote: string
    author: string
    authorRole: string
    authorCompany: string
    avatar?: string
    testimonials: TestimonialItem[]
    rotateTestimonials: boolean
    rotateInterval: number
    showRotatorDots: boolean
    showVerified: boolean
    verifiedLabel: string
    showQuoteIcon: boolean
    quoteMaxWidth: number
    quoteMaxLines: number
    quoteAlign: "left" | "center" | "right"
    quoteFont: FontValue
    authorFont: FontValue

    // Metrics
    showMetrics: boolean
    metrics: MetricItemData[]
    metricsVisible: number
    metricOrientation: "row" | "column"
    metricGap: number
    metricValueFont: FontValue
    metricLabelFont: FontValue
    metricDividers: boolean

    // Logos
    showLogos: boolean
    logos: LogoItemData[]
    logoHeight: number
    logoGap: number
    logoOpacity: number
    logoGrayscale: boolean
    logoHoverOpacity: number
    maxLogos: number
    logoAlign: "flex-start" | "center" | "flex-end"
    logoOverflow: "wrap" | "clip" | "marquee"
    logoMarqueeSpeed: number

    // Avatar stack
    showAvatars: boolean
    avatars: AvatarItem[]
    avatarSize: number
    avatarOverlap: number
    avatarRing: string
    avatarRingWidth: number
    maxAvatars: number
    avatarShowCounter: boolean
    avatarExtraCount: string
    avatarCaption: string
    avatarCaptionPosition: "right" | "below"
    avatarCaptionFont: FontValue

    // CTA
    showCTA: boolean
    ctaLabel: string
    ctaUrl: string
    ctaStyle: "text" | "outlined" | "filled"
    ctaIcon: boolean
    ctaNewTab: boolean
    ctaFont: FontValue
    ctaBackground: string
    ctaText: string
    ctaBorder: string
    ctaRadius: number
    ctaPaddingX: number
    ctaPaddingY: number

    // Layout / Style container
    align: "flex-start" | "center" | "flex-end"
    justify:
        | "flex-start"
        | "center"
        | "flex-end"
        | "space-between"
        | "space-around"
    minHeight: number
    bg: string
    borderColor: string
    borderW: number
    borderStyle: "solid" | "dashed" | "dotted" | "none"
    radius: number
    shadow: string
    padX: number
    padY: number
    blockGap: number
    overflow: "visible" | "hidden"
    backdropBlur: number

    // Dividers
    showDividers: boolean
    dividerColor: string
    dividerThickness: number
    dividerLength: number
    dividerSpacing: number

    // Trust message font
    trustFont: FontValue

    // Interaction
    hoverEffects: boolean
    ctaArrowMove: boolean
    badgeHoverBg: boolean

    // Animations
    enableAnimations: boolean
    entranceAnimation: boolean
    entranceStagger: number
    animateNumbers: boolean
    numberDuration: number

    // Live activity ticker
    showLiveActivity: boolean
    liveMessages: { text: string }[]
    liveDotColor: string
    liveInterval: number
}

/* ======================================================================
 *  Utilities
 * ==================================================================== */

// Clamp any numeric rating into a safe [0, max] range, guarding NaN.
function clampRating(value: number, max: number): number {
    const safeMax = Number.isFinite(max) && max > 0 ? max : 5
    if (!Number.isFinite(value)) return 0
    return Math.min(Math.max(value, 0), safeMax)
}

// Layout effect on the client, plain effect on the server (avoids the
// useLayoutEffect SSR warning). Running before paint lets us settle the
// animation state without a visible flicker.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

// Live OS-level reduced-motion preference (client only).
function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])
    return reduced
}

// Fires once when the element scrolls into view. When `enabled` is false it
// reports visible immediately, so static renders and reduced-motion users
// always see final content (no hidden blocks, no layout shift).
function useInView<T extends HTMLElement>(
    ref: React.RefObject<T>,
    enabled: boolean
): boolean {
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
        // Await observation (the callback fires immediately if already
        // visible, so above-the-fold content still animates on load).
        setInView(false)
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setInView(true)
                        io.disconnect()
                    }
                }
            },
            { threshold: 0.25 }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [ref, enabled])
    return inView
}

// requestAnimationFrame count-up. rAF only runs while `run` is true, and
// `run` is only ever true off the static renderer — satisfying the
// "gate all rAF" rule. easeOutCubic for a natural deceleration.
function useCountUp(
    target: number,
    willAnimate: boolean,
    run: boolean,
    duration: number
): number {
    const [val, setVal] = React.useState(willAnimate ? 0 : target)
    // Layout effect: when the count-up switches on, the reset to 0 happens
    // before paint, so the final value is never briefly shown first.
    useIsomorphicLayoutEffect(() => {
        if (!willAnimate) {
            setVal(target)
            return
        }
        if (!run) {
            setVal(0)
            return
        }
        let raf = 0
        let start = 0
        const step = (t: number) => {
            if (!start) start = t
            const p = Math.min((t - start) / Math.max(1, duration), 1)
            const eased = 1 - Math.pow(1 - p, 3)
            setVal(target * eased)
            if (p < 1) raf = requestAnimationFrame(step)
            else setVal(target)
        }
        raf = requestAnimationFrame(step)
        return () => cancelAnimationFrame(raf)
    }, [target, willAnimate, run, duration])
    return val
}

// Auto-advancing index for rotators. Timer is gated by `active`, which is
// false on the static renderer and for reduced-motion users.
function useRotator(
    count: number,
    active: boolean,
    intervalMs: number
): [number, (i: number) => void, () => void, () => void] {
    const [index, setIndex] = React.useState(0)
    const [paused, setPaused] = React.useState(false)
    // Keep the index valid if the list shrinks.
    React.useEffect(() => {
        if (index >= count) setIndex(0)
    }, [count, index])
    React.useEffect(() => {
        if (!active || paused || count <= 1) return
        const id = setInterval(
            () => setIndex((i) => (i + 1) % count),
            Math.max(1200, intervalMs)
        )
        return () => clearInterval(id)
    }, [active, paused, count, intervalMs])
    const go = React.useCallback((i: number) => setIndex(i), [])
    const pause = React.useCallback(() => setPaused(true), [])
    const resume = React.useCallback(() => setPaused(false), [])
    return [Math.min(index, Math.max(0, count - 1)), go, pause, resume]
}

// Split "2,300+", "98%", "4.9" into an animatable number + prefix/suffix.
function parseMetricValue(
    raw: string
): { prefix: string; suffix: string; value: number; decimals: number } | null {
    const match = /^(\D*)([\d.,]+)(.*)$/.exec((raw ?? "").trim())
    if (!match) return null
    const [, prefix, numStr, suffix] = match
    const decimals = (numStr.split(".")[1] || "").length
    const value = parseFloat(numStr.replace(/,/g, ""))
    if (!Number.isFinite(value)) return null
    return { prefix, suffix, value, decimals }
}

function formatNumber(value: number, decimals: number): string {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

const THEMES: Record<Exclude<ThemeName, "custom">, ThemeTokens> = {
    cleanLight: {
        background: "#ffffff",
        text: "#0e1116",
        muted: "#5b6472",
        border: "#e6e9ef",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 14,
        shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
        star: "#f5a623",
        starEmpty: "#e2e6ec",
        divider: "#e6e9ef",
        accent: "#0e1116",
        accentText: "#ffffff",
        backdropBlur: 0,
    },
    cleanDark: {
        background: "#111418",
        text: "#f4f6f8",
        muted: "#9aa3af",
        border: "#242a31",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 14,
        shadow: "0 2px 24px rgba(0,0,0,0.35)",
        star: "#ffc65c",
        starEmpty: "#333b44",
        divider: "#242a31",
        accent: "#ffffff",
        accentText: "#111418",
        backdropBlur: 0,
    },
    softNeutral: {
        background: "#f7f6f3",
        text: "#2b2a27",
        muted: "#6f6c65",
        border: "#e7e4dd",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 16,
        shadow: "0 1px 3px rgba(43,42,39,0.05)",
        star: "#d99a2b",
        starEmpty: "#e0ddd5",
        divider: "#e7e4dd",
        accent: "#2b2a27",
        accentText: "#f7f6f3",
        backdropBlur: 0,
    },
    highContrast: {
        background: "#ffffff",
        text: "#000000",
        muted: "#1a1a1a",
        border: "#000000",
        borderWidth: 2,
        borderStyle: "solid",
        radius: 8,
        shadow: "none",
        star: "#000000",
        starEmpty: "#c9c9c9",
        divider: "#000000",
        accent: "#000000",
        accentText: "#ffffff",
        backdropBlur: 0,
    },
    minimalBorderless: {
        background: "transparent",
        text: "#12141a",
        muted: "#616a78",
        border: "transparent",
        borderWidth: 0,
        borderStyle: "none",
        radius: 0,
        shadow: "none",
        star: "#f5a623",
        starEmpty: "#dfe3ea",
        divider: "#e6e9ef",
        accent: "#12141a",
        accentText: "#ffffff",
        backdropBlur: 0,
    },
    glass: {
        background: "rgba(255,255,255,0.55)",
        text: "#0e1116",
        muted: "#4c5563",
        border: "rgba(255,255,255,0.6)",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 18,
        shadow: "0 8px 32px rgba(16,24,40,0.12)",
        star: "#f5a623",
        starEmpty: "rgba(14,17,22,0.15)",
        divider: "rgba(14,17,22,0.12)",
        accent: "#0e1116",
        accentText: "#ffffff",
        backdropBlur: 14,
    },
    warm: {
        background: "#fff8f1",
        text: "#3a2a1d",
        muted: "#8a7563",
        border: "#f0e2d3",
        borderWidth: 1,
        borderStyle: "solid",
        radius: 16,
        shadow: "0 2px 12px rgba(120,80,40,0.08)",
        star: "#e8843c",
        starEmpty: "#f0e2d3",
        divider: "#f0e2d3",
        accent: "#c05621",
        accentText: "#fff8f1",
        backdropBlur: 0,
    },
}

// Blocks that can be reordered on mobile.
type BlockKey =
    | "rating"
    | "testimonial"
    | "metrics"
    | "badges"
    | "logos"
    | "cta"
    | "live"
    | "avatars"

/* ======================================================================
 *  Injected stylesheet (constant → SSR-safe, no hydration mismatch)
 * ==================================================================== */

const STYLESHEET = `
.uosps-root, .uosps-root *, .uosps-root *::before, .uosps-root *::after { box-sizing: border-box; }
.uosps-root { -webkit-font-smoothing: antialiased; }
.uosps-link { text-decoration: none; color: inherit; display: inline-flex; align-items: center; }
.uosps-focusable:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 6px; }
.uosps-clamp { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.uosps-logo-img { transition: none; display: block; width: auto; max-width: 100%; object-fit: contain; }
.uosps-arrow { display: inline-block; transition: none; }
@media (prefers-reduced-motion: no-preference) {
  .uosps-root[data-anim="true"] .uosps-anim { transition: transform .22s ease, box-shadow .22s ease, opacity .22s ease, background .22s ease, border-color .22s ease, filter .22s ease; }
  .uosps-root[data-anim="true"] .uosps-logo-img { transition: opacity .22s ease, filter .22s ease, transform .22s ease; }
  .uosps-root[data-anim="true"] .uosps-arrow { transition: transform .22s ease; }
  .uosps-root[data-anim="true"] .uosps-cta[data-arrow="true"]:hover .uosps-arrow { transform: translateX(3px); }
  .uosps-root[data-anim="true"] .uosps-badge[data-hoverbg="true"]:hover { filter: brightness(0.96); }
  /* Element-level hover micro-interactions (gated by data-hover). */
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-metric:hover { transform: translateY(-3px); }
  .uosps-star { transform-origin: center 70%; }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-star { transition: transform .2s cubic-bezier(.34,1.56,.64,1); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-star-wrap:hover .uosps-star:not(:hover) { transform: translateY(-1px); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-star:hover { transform: scale(1.3) translateY(-2px) rotate(-6deg); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-badge.uosps-anim:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16,24,40,0.10); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-cta:hover { transform: translateY(-2px); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-cta[data-filled="true"]:hover { box-shadow: 0 8px 20px var(--uosps-cta-shadow, rgba(16,24,40,0.18)); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-dot:hover { transform: scale(1.35); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-logo:hover .uosps-logo-img { transform: scale(1.06); }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-avatar:hover { transform: translateY(-3px) scale(1.08); z-index: 20; }
}
.uosps-root .uosps-logo:hover .uosps-logo-img { opacity: var(--uosps-logo-hover-opacity, 1) !important; filter: none !important; }
/* Keyframes — transform/opacity only, so they run on the compositor. */
@keyframes uosps-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes uosps-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes uosps-pulse { 0% { box-shadow: 0 0 0 0 var(--uosps-pulse, rgba(34,197,94,0.5)); } 70% { box-shadow: 0 0 0 7px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
@keyframes uosps-shine { 0% { left: -70%; opacity: 0; } 20% { opacity: 1; } 100% { left: 130%; opacity: 0; } }
.uosps-marquee { overflow: hidden; max-width: 100%; }
.uosps-marquee-track { display: inline-flex; width: max-content; }
.uosps-cta[data-filled="true"] { position: relative; overflow: hidden; }
.uosps-cta[data-filled="true"]::after { content: ""; position: absolute; top: 0; left: -70%; width: 45%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); pointer-events: none; opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .uosps-reveal { animation: uosps-fadein 0.5s ease both; }
  .uosps-root[data-anim="true"] .uosps-fade { animation: uosps-fadein 0.45s ease both; }
  .uosps-root[data-anim="true"] .uosps-marquee-track { animation: uosps-marquee var(--uosps-marquee-dur, 30s) linear infinite; will-change: transform; }
  .uosps-root[data-anim="true"] .uosps-marquee:hover .uosps-marquee-track { animation-play-state: paused; }
  .uosps-root[data-anim="true"] .uosps-livedot { animation: uosps-pulse 2s ease-out infinite; }
  .uosps-root[data-anim="true"][data-hover="true"] .uosps-cta[data-filled="true"]:hover::after { animation: uosps-shine 0.7s ease; }
}`

// Constant stylesheet rendered as a JSX <style> child. Because the CSS
// string never changes, it is SSR-safe (no hydration mismatch) and works
// on the Framer canvas — unlike head injection inside useEffect.
const StyleTag: React.FC = React.memo(() => <style>{STYLESHEET}</style>)

/* ======================================================================
 *  Sub-component: StarRating
 * ==================================================================== */

const StarShape: React.FC<{ size: number; color: string }> = ({
    size,
    color,
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={color}
        aria-hidden="true"
        focusable="false"
        style={{ display: "block" }}
    >
        <path d="M12 2.2l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.25 6.1 20.36l1.12-6.57L2.45 9.14l6.6-.96L12 2.2z" />
    </svg>
)

// A single star: an empty base with a filled copy clipped to this star's
// own fill fraction (0–1). Being self-contained lets each star be hovered
// and animated individually, while still supporting partial fills.
const Star: React.FC<{
    size: number
    fill: number
    filled: string
    empty: string
}> = React.memo(({ size, fill, filled, empty }) => {
    const f = Math.min(Math.max(fill, 0), 1)
    return (
        <span
            className="uosps-star"
            style={{
                position: "relative",
                display: "inline-block",
                width: size,
                height: size,
                lineHeight: 0,
                flex: "0 0 auto",
            }}
        >
            <StarShape size={size} color={empty} />
            {f > 0 ? (
                <span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${f * 100}%`,
                        height: "100%",
                        overflow: "hidden",
                    }}
                >
                    <StarShape size={size} color={filled} />
                </span>
            ) : null}
        </span>
    )
})

interface StarRatingProps {
    value: number
    displayValue?: number
    max: number
    size: number
    gap: number
    filled: string
    empty: string
    partial: boolean
    reviewCount: string
}

const StarRating: React.FC<StarRatingProps> = React.memo(
    ({
        value,
        displayValue,
        max,
        size,
        gap,
        filled,
        empty,
        partial,
        reviewCount,
    }) => {
        const safeMax = Math.max(1, Math.round(max))
        const clamped = clampRating(value, safeMax)
        // `shown` drives the visible fill (may be a mid-count-up value); the
        // aria-label always reports the final rating. Each star clips its own
        // fill, so animating never changes the row's box → no reflow.
        const shown = clampRating(
            displayValue == null ? value : displayValue,
            safeMax
        )
        const rounded = Math.round(shown)
        const label = `Rated ${clamped} out of ${safeMax}${
            reviewCount ? ` based on ${reviewCount} reviews` : ""
        }`

        return (
            <span
                role="img"
                aria-label={label}
                style={{ display: "inline-flex", gap, lineHeight: 0 }}
            >
                {Array.from({ length: safeMax }, (_, i) => (
                    <Star
                        key={i}
                        size={size}
                        // Partial: this star's own fraction. Otherwise a
                        // rounded whole-star fill.
                        fill={partial ? shown - i : i < rounded ? 1 : 0}
                        filled={filled}
                        empty={empty}
                    />
                ))}
            </span>
        )
    }
)

/* ======================================================================
 *  Sub-component: StableNumber
 *  Reserves the final value's width (invisible sizer) and uses tabular
 *  figures, so a counting-up number never changes width or reflows the
 *  surrounding layout. `display` is the live value; `sizer` the final one.
 * ==================================================================== */

const StableNumber: React.FC<{
    display: string
    sizer: string
    style?: React.CSSProperties
}> = ({ display, sizer, style }) => (
    <span
        style={{
            position: "relative",
            display: "inline-block",
            fontVariantNumeric: "tabular-nums",
            fontFeatureSettings: '"tnum"',
            ...style,
        }}
    >
        <span aria-hidden="true" style={{ visibility: "hidden" }}>
            {sizer}
        </span>
        <span
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                whiteSpace: "nowrap",
            }}
        >
            {display}
        </span>
    </span>
)

/* ======================================================================
 *  Sub-component: RatingBlock
 * ==================================================================== */

const RatingBlock: React.FC<{
    props: Props
    tokens: ThemeTokens
    scale: number
    anim: AnimState
}> = React.memo(({ props, tokens, scale, anim }) => {
    const clamped = clampRating(props.ratingValue, props.ratingMax)
    const scoreDecimals = Number.isInteger(clamped) ? 0 : 1
    const animatedScore = useCountUp(
        clamped,
        anim.numbers,
        anim.run,
        anim.duration
    )
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 4 * scale,
                alignItems: "flex-start",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8 * scale,
                    flexWrap: "wrap",
                }}
            >
                <span
                    className="uosps-star-wrap uosps-anim"
                    style={{ display: "inline-flex", lineHeight: 0 }}
                >
                    <StarRating
                        value={props.ratingValue}
                        displayValue={animatedScore}
                        max={props.ratingMax}
                        size={props.starSize * scale}
                        gap={props.starGap}
                        filled={props.starFilled}
                        empty={props.starEmpty}
                        partial={props.partialStars}
                        reviewCount={props.reviewCount}
                    />
                </span>
                <span
                    style={{
                        ...props.scoreFont,
                        color: tokens.text,
                        fontSize: num(props.scoreFont.fontSize, 18) * scale,
                        display: "inline-flex",
                        alignItems: "baseline",
                    }}
                >
                    <StableNumber
                        display={formatNumber(animatedScore, scoreDecimals)}
                        sizer={formatNumber(clamped, scoreDecimals)}
                    />
                    <span style={{ color: tokens.muted, fontWeight: 400 }}>
                        {" "}
                        / {props.ratingMax}
                    </span>
                </span>
                {props.ratingLabelEnabled && props.ratingLabel ? (
                    <span
                        style={{
                            ...props.ratingLabelFont,
                            color: tokens.text,
                        }}
                    >
                        {props.ratingLabel}
                    </span>
                ) : null}
            </div>
            {props.showReviewCount && props.reviewCount ? (
                <span
                    style={{
                        ...props.reviewCountFont,
                        color: tokens.muted,
                    }}
                >
                    Based on {props.reviewCount} reviews
                </span>
            ) : null}
        </div>
    )
})

/* ======================================================================
 *  Sub-component: PlatformBadge
 * ==================================================================== */

const PlatformBadge: React.FC<{
    data: BadgeItemData
    size: number
    radius: number
    showRating: boolean
    showCount: boolean
    newTab: boolean
    font: FontValue
    hoverBg: boolean
    emphasized: boolean
}> = React.memo(
    ({
        data,
        size,
        radius,
        showRating,
        showCount,
        newTab,
        font,
        hoverBg,
        emphasized,
    }) => {
        const padY = Math.round(size * 0.55)
        const padX = Math.round(size * 0.85)
        const content = (
            <>
                {data.icon ? (
                    <img
                        src={data.icon}
                        alt=""
                        aria-hidden="true"
                        style={{
                            height: size,
                            width: "auto",
                            display: "block",
                        }}
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        style={{
                            width: size,
                            height: size,
                            borderRadius: 4,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: data.text,
                            color: data.background,
                            fontSize: size * 0.62,
                            fontWeight: 700,
                            flex: "0 0 auto",
                        }}
                    >
                        {(data.platform || "?").charAt(0).toUpperCase()}
                    </span>
                )}
                <span style={{ fontWeight: 600 }}>{data.platform}</span>
                {showRating && data.rating ? (
                    <span style={{ opacity: 0.85 }}>★ {data.rating}</span>
                ) : null}
                {showCount && data.reviewCount ? (
                    <span style={{ opacity: 0.7 }}>({data.reviewCount})</span>
                ) : null}
            </>
        )

        const style: React.CSSProperties = {
            ...font,
            display: "inline-flex",
            alignItems: "center",
            gap: Math.round(size * 0.5),
            padding: `${padY}px ${padX}px`,
            background: data.background,
            color: data.text,
            border: `1px solid ${data.border}`,
            borderRadius: radius,
            fontSize: size,
            lineHeight: 1,
            whiteSpace: "nowrap",
            transform: emphasized ? "scale(1.04)" : "none",
            transformOrigin: "left center",
        }

        if (data.link) {
            return (
                <a
                    href={data.link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    className="uosps-link uosps-badge uosps-anim uosps-focusable"
                    data-hoverbg={hoverBg ? "true" : "false"}
                    style={style}
                >
                    {content}
                </a>
            )
        }
        return (
            <span
                className="uosps-badge uosps-anim"
                data-hoverbg={hoverBg ? "true" : "false"}
                style={style}
            >
                {content}
            </span>
        )
    }
)

/* ======================================================================
 *  Sub-component: Testimonial
 * ==================================================================== */

// Presentational single testimonial.
const TestimonialView: React.FC<{
    item: TestimonialItem
    props: Props
    tokens: ThemeTokens
    scale: number
    animate: boolean
    animKey: number
    reserve: boolean
}> = React.memo(({ item, props, tokens, scale, animate, animKey, reserve }) => {
    const meta = [item.role, item.company].filter(Boolean).join(" · ")
    // Reserve vertical space for the tallest possible quote so rotating
    // between quotes of different lengths does not change the height.
    const lineHeight = num(props.quoteFont.fontSize, 15) * scale * 1.45
    const reservedHeight = reserve
        ? lineHeight * Math.max(1, props.quoteMaxLines)
        : undefined
    return (
        <figure
            // key remount drives the crossfade animation between quotes
            key={animKey}
            className={animate ? "uosps-fade" : undefined}
            style={{
                margin: 0,
                maxWidth: props.quoteMaxWidth,
                textAlign: props.quoteAlign,
                display: "flex",
                flexDirection: "column",
                gap: 8 * scale,
                alignItems:
                    props.quoteAlign === "center"
                        ? "center"
                        : props.quoteAlign === "right"
                          ? "flex-end"
                          : "flex-start",
            }}
        >
            <blockquote
                className="uosps-clamp"
                style={{
                    ...props.quoteFont,
                    margin: 0,
                    color: tokens.text,
                    WebkitLineClamp: Math.max(1, props.quoteMaxLines),
                    fontSize: num(props.quoteFont.fontSize, 15) * scale,
                    minHeight: reservedHeight,
                }}
            >
                {props.showQuoteIcon ? (
                    <span
                        aria-hidden="true"
                        style={{
                            color: tokens.muted,
                            marginRight: 4,
                            fontWeight: 700,
                        }}
                    >
                        “
                    </span>
                ) : null}
                {item.quote}
            </blockquote>
            {(item.author || item.avatar) && (
                <figcaption
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexDirection:
                            props.quoteAlign === "right"
                                ? "row-reverse"
                                : "row",
                    }}
                >
                    {item.avatar ? (
                        <img
                            src={item.avatar}
                            alt={item.author || "Reviewer"}
                            style={{
                                width: 28 * scale,
                                height: 28 * scale,
                                borderRadius: "50%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : null}
                    <span style={{ ...props.authorFont }}>
                        <span
                            style={{
                                color: tokens.text,
                                fontWeight: 600,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                            }}
                        >
                            {item.author}
                            {props.showVerified && item.verified ? (
                                <span
                                    title={props.verifiedLabel || "Verified"}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                    }}
                                >
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            background: "#2f9bff",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flex: "0 0 auto",
                                        }}
                                    >
                                        <svg
                                            width="9"
                                            height="9"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#fff"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M20 6L9 17l-5-5" />
                                        </svg>
                                    </span>
                                    {props.verifiedLabel ? (
                                        <span
                                            style={{
                                                color: "#2f9bff",
                                                fontWeight: 600,
                                                fontSize: 11,
                                            }}
                                        >
                                            {props.verifiedLabel}
                                        </span>
                                    ) : null}
                                </span>
                            ) : null}
                        </span>
                        {meta ? (
                            <span style={{ color: tokens.muted }}>
                                {item.author ? " — " : ""}
                                {meta}
                            </span>
                        ) : null}
                    </span>
                </figcaption>
            )}
        </figure>
    )
})

// Auto-rotating testimonial carousel with pause-on-hover and dot controls.
const TestimonialRotator: React.FC<{
    props: Props
    tokens: ThemeTokens
    scale: number
    animate: boolean
}> = React.memo(({ props, tokens, scale, animate }) => {
    // Prefer the multi-item array; fall back to the single-quote fields.
    const items: TestimonialItem[] = React.useMemo(() => {
        const list = (props.testimonials || [])
            .map((t) => ({
                quote: t.quote,
                author: t.author,
                role: t.role,
                company: t.company,
                avatar: t.avatar,
                verified: t.verified,
            }))
            .filter((t) => t.quote && t.quote.trim().length > 0)
        if (list.length > 0) return list
        if (!props.quote) return []
        return [
            {
                quote: props.quote,
                author: props.author,
                role: props.authorRole,
                company: props.authorCompany,
                avatar: props.avatar,
                verified: true,
            },
        ]
    }, [
        props.testimonials,
        props.quote,
        props.author,
        props.authorRole,
        props.authorCompany,
        props.avatar,
    ])

    // Whether the carousel *can* rotate (config) vs. whether it is currently
    // animating. Size reservation keys off config so the section never
    // resizes when animations switch on after mount.
    const willRotate = props.rotateTestimonials && items.length > 1
    const active = animate && willRotate
    const [index, go, pause, resume] = useRotator(
        items.length,
        active,
        props.rotateInterval * 1000
    )

    if (items.length === 0) return null
    const current = items[Math.min(index, items.length - 1)]
    const showDots = props.showRotatorDots && items.length > 1
    const dotAlign =
        props.quoteAlign === "center"
            ? "center"
            : props.quoteAlign === "right"
              ? "flex-end"
              : "flex-start"

    return (
        <div
            onMouseEnter={active ? pause : undefined}
            onMouseLeave={active ? resume : undefined}
            onFocusCapture={active ? pause : undefined}
            onBlurCapture={active ? resume : undefined}
            onKeyDown={
                willRotate
                    ? (e) => {
                          if (e.key === "ArrowRight") {
                              e.preventDefault()
                              go((index + 1) % items.length)
                          } else if (e.key === "ArrowLeft") {
                              e.preventDefault()
                              go((index - 1 + items.length) % items.length)
                          }
                      }
                    : undefined
            }
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                // Hold a constant width whenever the carousel can rotate, so
                // shorter quotes never let neighbouring blocks shift around.
                width: willRotate ? props.quoteMaxWidth : undefined,
                maxWidth: "100%",
            }}
        >
            <TestimonialView
                item={current}
                props={props}
                tokens={tokens}
                scale={scale}
                animate={animate && props.rotateTestimonials}
                animKey={index}
                reserve={willRotate}
            />
            {showDots ? (
                <div
                    role="tablist"
                    aria-label="Testimonials"
                    style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: dotAlign,
                    }}
                >
                    {items.map((_, i) => {
                        const selected = i === index
                        return (
                            <button
                                key={i}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-label={`Show testimonial ${i + 1}`}
                                onClick={() => go(i)}
                                className="uosps-anim uosps-focusable uosps-dot"
                                style={{
                                    width: selected ? 18 : 7,
                                    height: 7,
                                    padding: 0,
                                    border: "none",
                                    borderRadius: 999,
                                    cursor: "pointer",
                                    background: selected
                                        ? tokens.accent
                                        : withAlpha(tokens.text, 0.22),
                                }}
                            />
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
})

// Live-activity ticker: pulsing dot + rotating short messages.
const LiveActivity: React.FC<{
    props: Props
    tokens: ThemeTokens
    animate: boolean
}> = React.memo(({ props, tokens, animate }) => {
    const messages = React.useMemo(
        () =>
            (props.liveMessages || [])
                .map((m) => m.text)
                .filter((t) => t && t.trim().length > 0),
        [props.liveMessages]
    )
    const active = animate && messages.length > 1
    const [index] = useRotator(
        Math.max(1, messages.length),
        active,
        props.liveInterval * 1000
    )
    if (messages.length === 0) return null
    const message = messages[Math.min(index, messages.length - 1)]
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 11px",
                borderRadius: 999,
                background: withAlpha(props.liveDotColor, 0.1),
                border: `1px solid ${withAlpha(props.liveDotColor, 0.25)}`,
                maxWidth: "100%",
            }}
        >
            <span
                className="uosps-livedot"
                aria-hidden="true"
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: props.liveDotColor,
                    flex: "0 0 auto",
                    ["--uosps-pulse" as any]: withAlpha(
                        props.liveDotColor,
                        0.5
                    ),
                }}
            />
            <span
                key={index}
                className={animate ? "uosps-fade" : undefined}
                aria-live="polite"
                style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: tokens.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
            >
                {message}
            </span>
        </div>
    )
})

/* ======================================================================
 *  Sub-component: MetricItem + MetricsBlock
 * ==================================================================== */

const MetricItem: React.FC<{
    data: MetricItemData
    tokens: ThemeTokens
    valueFont: FontValue
    labelFont: FontValue
    scale: number
    emphasized: boolean
    anim: AnimState
}> = React.memo(
    ({ data, tokens, valueFont, labelFont, scale, emphasized, anim }) => {
        const strong = data.primary || emphasized
        // Parse once so the hook is always called with stable inputs.
        const parsed = React.useMemo(
            () => parseMetricValue(data.value),
            [data.value]
        )
        const willAnimate = anim.numbers && !!parsed
        const animatedValue = useCountUp(
            parsed?.value ?? 0,
            willAnimate,
            anim.run,
            anim.duration
        )
        const displayValue =
            parsed && willAnimate
                ? `${parsed.prefix}${formatNumber(
                      animatedValue,
                      parsed.decimals
                  )}${parsed.suffix}`
                : data.value
        return (
            <div
                className="uosps-metric uosps-anim"
                title={data.tooltip || undefined}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: strong ? "6px 12px" : 0,
                    borderRadius: strong ? 10 : 0,
                    background: strong
                        ? withAlpha(tokens.accent, 0.06)
                        : "transparent",
                    minWidth: 0,
                }}
            >
                <span
                    style={{
                        ...valueFont,
                        color: strong ? tokens.accent : tokens.text,
                        fontSize:
                            num(valueFont.fontSize, 20) *
                            scale *
                            (strong ? 1.12 : 1),
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                    }}
                >
                    {data.icon ? (
                        <img
                            src={data.icon}
                            alt=""
                            aria-hidden="true"
                            style={{
                                height: num(valueFont.fontSize, 20) * scale,
                                width: "auto",
                            }}
                        />
                    ) : null}
                    <StableNumber display={displayValue} sizer={data.value} />
                </span>
                <span
                    style={{
                        ...labelFont,
                        color: tokens.muted,
                        whiteSpace: "nowrap",
                    }}
                >
                    {data.label}
                </span>
            </div>
        )
    }
)

const MetricsBlock: React.FC<{
    props: Props
    tokens: ThemeTokens
    scale: number
    emphasizePrimary: boolean
    anim: AnimState
}> = React.memo(({ props, tokens, scale, emphasizePrimary, anim }) => {
    const items = props.metrics.slice(0, Math.max(0, props.metricsVisible))
    if (items.length === 0) return null
    return (
        <div
            style={{
                display: "flex",
                flexDirection: props.metricOrientation,
                gap: props.metricGap,
                alignItems:
                    props.metricOrientation === "row" ? "center" : "flex-start",
                flexWrap: "wrap",
            }}
        >
            {items.map((m, i) => (
                <React.Fragment key={`${m.value}-${m.label}-${i}`}>
                    <MetricItem
                        data={m}
                        tokens={tokens}
                        valueFont={props.metricValueFont}
                        labelFont={props.metricLabelFont}
                        scale={scale}
                        emphasized={emphasizePrimary && m.primary}
                        anim={anim}
                    />
                    {props.metricDividers &&
                    i < items.length - 1 &&
                    props.metricOrientation === "row" ? (
                        <span
                            aria-hidden="true"
                            style={{
                                width: 1,
                                alignSelf: "stretch",
                                background: tokens.divider,
                            }}
                        />
                    ) : null}
                </React.Fragment>
            ))}
        </div>
    )
})

/* ======================================================================
 *  Sub-component: LogoItem + LogoStrip
 * ==================================================================== */

const LogoItem: React.FC<{
    data: LogoItemData
    height: number
    opacity: number
    grayscale: boolean
    tokens: ThemeTokens
}> = React.memo(({ data, height, opacity, grayscale, tokens }) => {
    const imgStyle: React.CSSProperties = {
        height,
        opacity,
        filter: grayscale ? "grayscale(1)" : "none",
    }
    // Neutral placeholder when no image is supplied (keeps layout stable).
    const inner = data.image ? (
        <img
            className="uosps-logo-img"
            src={data.image}
            alt={data.alt || ""}
            style={imgStyle}
        />
    ) : (
        <span
            className="uosps-logo-img"
            role="img"
            aria-label={data.alt || "Client logo"}
            style={{
                ...imgStyle,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 12px",
                height,
                borderRadius: 6,
                background: withAlpha(tokens.text, 0.06),
                color: tokens.muted,
                fontSize: height * 0.42,
                fontWeight: 600,
                letterSpacing: 0.2,
                whiteSpace: "nowrap",
            }}
        >
            {data.alt || "Logo"}
        </span>
    )

    if (data.link) {
        return (
            <a
                href={data.link}
                title={data.tooltip || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="uosps-link uosps-logo uosps-focusable"
                style={{ display: "inline-flex" }}
            >
                {inner}
            </a>
        )
    }
    return (
        <span
            className="uosps-logo"
            title={data.tooltip || undefined}
            style={{ display: "inline-flex" }}
        >
            {inner}
        </span>
    )
})

const LogoStrip: React.FC<{
    props: Props
    tokens: ThemeTokens
    animate: boolean
}> = React.memo(({ props, tokens, animate }) => {
    const items = props.logos.slice(0, Math.max(0, props.maxLogos))
    if (items.length === 0) return null

    const renderLogo = (logo: LogoItemData, key: React.Key) => (
        <LogoItem
            key={key}
            data={logo}
            height={props.logoHeight}
            opacity={props.logoOpacity}
            grayscale={props.logoGrayscale}
            tokens={tokens}
        />
    )

    // Marquee mode: duplicate the list and slide the track -50% seamlessly.
    // Each item carries its own trailing margin so both halves are equal
    // width (uniform gap → clean loop). Falls back to a static row when
    // animation is suppressed (canvas / export / reduced motion).
    if (props.logoOverflow === "marquee" && animate) {
        const doubled = [...items, ...items]
        return (
            <div
                className="uosps-marquee"
                style={{
                    width: "100%",
                    ["--uosps-marquee-dur" as any]: `${Math.max(
                        4,
                        props.logoMarqueeSpeed
                    )}s`,
                    ["--uosps-logo-hover-opacity" as any]:
                        props.logoHoverOpacity,
                }}
            >
                <div className="uosps-marquee-track">
                    {doubled.map((logo, i) => (
                        <span
                            key={i}
                            aria-hidden={i >= items.length ? true : undefined}
                            style={{
                                marginRight: props.logoGap,
                                display: "inline-flex",
                                alignItems: "center",
                            }}
                        >
                            {renderLogo(logo, i)}
                        </span>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                display: "flex",
                gap: props.logoGap,
                alignItems: "center",
                justifyContent: props.logoAlign,
                flexWrap: props.logoOverflow === "clip" ? "nowrap" : "wrap",
                overflow: props.logoOverflow === "clip" ? "hidden" : "visible",
                // Expose hover opacity to CSS without inline :hover.
                ["--uosps-logo-hover-opacity" as any]: props.logoHoverOpacity,
                maxWidth: "100%",
            }}
        >
            {items.map((logo, i) =>
                renderLogo(logo, `${logo.alt || "logo"}-${i}`)
            )}
        </div>
    )
})

/* ======================================================================
 *  Sub-component: AvatarStack
 *  Overlapping customer faces + optional "+N" counter and caption — the
 *  classic "join thousands of happy customers" social-proof pattern.
 * ==================================================================== */

const AvatarStack: React.FC<{
    props: Props
    tokens: ThemeTokens
}> = React.memo(({ props, tokens }) => {
    const all = props.avatars || []
    const items = all.slice(0, Math.max(0, props.maxAvatars))
    // Placeholder palette for avatars without an image (deterministic).
    const palette = [
        "#6366f1",
        "#ec4899",
        "#f59e0b",
        "#10b981",
        "#0ea5e9",
        "#8b5cf6",
    ]
    const size = props.avatarSize
    const ring = props.avatarRingWidth
    const overlap = Math.min(props.avatarOverlap, size - 6)

    const counterText = props.avatarShowCounter
        ? props.avatarExtraCount
            ? `+${props.avatarExtraCount}`
            : all.length > props.maxAvatars
              ? `+${all.length - props.maxAvatars}`
              : ""
        : ""

    if (items.length === 0 && !counterText) return null

    const circleBase: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${ring}px solid ${props.avatarRing}`,
        boxSizing: "border-box",
        flex: "0 0 auto",
        overflow: "hidden",
        background: tokens.background,
    }

    const stack = (
        <div style={{ display: "inline-flex", alignItems: "center" }}>
            {items.map((a, i) => (
                <span
                    key={`${a.alt || "avatar"}-${i}`}
                    className="uosps-avatar uosps-anim"
                    title={a.alt || undefined}
                    style={{
                        ...circleBase,
                        marginLeft: i === 0 ? 0 : -overlap,
                        // Later avatars sit above earlier ones.
                        zIndex: i + 1,
                        position: "relative",
                    }}
                >
                    {a.image ? (
                        <img
                            src={a.image}
                            alt={a.alt || "Customer"}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    ) : (
                        <span
                            role="img"
                            aria-label={a.alt || "Customer"}
                            style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: palette[i % palette.length],
                                color: "#fff",
                                fontSize: size * 0.42,
                                fontWeight: 600,
                            }}
                        >
                            {(a.alt || "?").charAt(0).toUpperCase()}
                        </span>
                    )}
                </span>
            ))}
            {counterText ? (
                <span
                    className="uosps-avatar"
                    style={{
                        ...circleBase,
                        marginLeft: items.length ? -overlap : 0,
                        zIndex: items.length + 1,
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: withAlpha(tokens.text, 0.08),
                        color: tokens.text,
                        fontSize: size * 0.34,
                        fontWeight: 700,
                    }}
                >
                    {counterText}
                </span>
            ) : null}
        </div>
    )

    if (!props.avatarCaption) return stack

    const caption = (
        <span style={{ ...props.avatarCaptionFont, color: tokens.muted }}>
            {props.avatarCaption}
        </span>
    )

    return (
        <div
            style={{
                display: "flex",
                flexDirection:
                    props.avatarCaptionPosition === "below" ? "column" : "row",
                alignItems:
                    props.avatarCaptionPosition === "below"
                        ? "flex-start"
                        : "center",
                gap: props.avatarCaptionPosition === "below" ? 6 : 10,
            }}
        >
            {stack}
            {caption}
        </div>
    )
})

/* ======================================================================
 *  Sub-component: TrustCTA
 * ==================================================================== */

const TrustCTA: React.FC<{
    props: Props
    tokens: ThemeTokens
}> = React.memo(({ props, tokens }) => {
    if (!props.ctaLabel) return null
    const base: React.CSSProperties = {
        ...props.ctaFont,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        whiteSpace: "nowrap",
        lineHeight: 1.2,
    }
    let style: React.CSSProperties
    if (props.ctaStyle === "text") {
        style = {
            ...base,
            color: props.ctaText || tokens.accent,
            padding: 0,
        }
    } else if (props.ctaStyle === "outlined") {
        style = {
            ...base,
            color: props.ctaText || tokens.text,
            border: `1px solid ${props.ctaBorder || tokens.border}`,
            borderRadius: props.ctaRadius,
            padding: `${props.ctaPaddingY}px ${props.ctaPaddingX}px`,
            background: "transparent",
        }
    } else {
        style = {
            ...base,
            color: props.ctaText || tokens.accentText,
            background: props.ctaBackground || tokens.accent,
            borderRadius: props.ctaRadius,
            padding: `${props.ctaPaddingY}px ${props.ctaPaddingX}px`,
            border: `1px solid ${props.ctaBackground || tokens.accent}`,
            // Tint the hover glow with the button's own colour.
            ["--uosps-cta-shadow" as any]: withAlpha(
                props.ctaBackground || tokens.accent,
                0.35
            ),
        }
    }
    return (
        <a
            href={props.ctaUrl || "#"}
            target={props.ctaNewTab ? "_blank" : undefined}
            rel={props.ctaNewTab ? "noopener noreferrer" : undefined}
            className="uosps-link uosps-cta uosps-anim uosps-focusable"
            data-arrow={props.ctaArrowMove && props.ctaIcon ? "true" : "false"}
            data-filled={props.ctaStyle === "filled" ? "true" : "false"}
            style={style}
        >
            {props.ctaLabel}
            {props.ctaIcon ? (
                <span className="uosps-arrow" aria-hidden="true">
                    →
                </span>
            ) : null}
        </a>
    )
})

/* ======================================================================
 *  Sub-component: Divider
 * ==================================================================== */

const Divider: React.FC<{
    orientation: "vertical" | "horizontal"
    color: string
    thickness: number
    length: number
    spacing: number
}> = ({ orientation, color, thickness, length, spacing }) => {
    if (orientation === "horizontal") {
        return (
            <span
                aria-hidden="true"
                style={{
                    height: thickness,
                    width: length > 0 ? length : "100%",
                    background: color,
                    margin: `${spacing}px 0`,
                    flex: "0 0 auto",
                }}
            />
        )
    }
    return (
        <span
            aria-hidden="true"
            style={{
                width: thickness,
                height: length,
                background: color,
                margin: `0 ${spacing}px`,
                flex: "0 0 auto",
                alignSelf: "center",
            }}
        />
    )
}

/* ======================================================================
 *  Helpers
 * ==================================================================== */

function num(v: unknown, fallback: number): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback
}

// Convert a hex or rgb colour into an rgba string with the given alpha.
function withAlpha(color: string, alpha: number): string {
    if (!color) return `rgba(0,0,0,${alpha})`
    if (color.startsWith("#")) {
        let hex = color.slice(1)
        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("")
        }
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        if ([r, g, b].some((n) => Number.isNaN(n)))
            return `rgba(0,0,0,${alpha})`
        return `rgba(${r},${g},${b},${alpha})`
    }
    if (color.startsWith("rgb")) {
        const nums = color.match(/[\d.]+/g)
        if (nums && nums.length >= 3) {
            return `rgba(${nums[0]},${nums[1]},${nums[2]},${alpha})`
        }
    }
    return color
}

// Preset → default arrangement config. Presets shape layout only; the
// user's content and visibility toggles are never mutated.
interface PresetConfig {
    direction: "row" | "column"
    wrap: boolean
    order: BlockKey[]
    defaultScale: number
}

function presetConfig(preset: Preset): PresetConfig {
    switch (preset) {
        case "inline":
            return {
                direction: "row",
                wrap: true,
                order: ["rating", "avatars", "badges", "live", "cta"],
                defaultScale: 0.92,
            }
        case "mini":
            return {
                direction: "row",
                wrap: true,
                order: ["rating", "badges"],
                defaultScale: 0.82,
            }
        case "stacked":
            return {
                direction: "column",
                wrap: false,
                order: [
                    "rating",
                    "avatars",
                    "live",
                    "testimonial",
                    "metrics",
                    "badges",
                    "logos",
                    "cta",
                ],
                defaultScale: 1,
            }
        case "logoFocused":
            return {
                direction: "column",
                wrap: true,
                order: ["logos", "metrics", "avatars", "rating", "live", "cta"],
                defaultScale: 1,
            }
        case "testimonialFocused":
            return {
                direction: "row",
                wrap: true,
                order: ["testimonial", "rating", "avatars", "live", "cta"],
                defaultScale: 1,
            }
        case "fullWidth":
        default:
            return {
                direction: "row",
                wrap: true,
                order: [
                    "rating",
                    "avatars",
                    "testimonial",
                    "metrics",
                    "badges",
                    "live",
                    "cta",
                ],
                defaultScale: 1,
            }
    }
}

// Per-block emphasis scale/dim. Emphasised block scales up slightly; the
// rest dim a touch to create a clear visual hierarchy.
function emphasisFor(
    emphasis: Emphasis,
    block: BlockKey
): { scale: number; opacity: number; grow: number } {
    const NORMAL = { scale: 1, opacity: 1, grow: 0 }
    const DIM = { scale: 1, opacity: 0.82, grow: 0 }
    const UP = { scale: 1.12, opacity: 1, grow: 1 }
    if (emphasis === "balanced") return NORMAL
    const map: Record<Emphasis, BlockKey | null> = {
        rating: "rating",
        primaryMetric: "metrics",
        testimonial: "testimonial",
        platformBadge: "badges",
        balanced: null,
    }
    const target = map[emphasis]
    if (!target) return NORMAL
    if (block === target)
        return block === "testimonial"
            ? { scale: 1.06, opacity: 1, grow: 2 }
            : UP
    return DIM
}

/* ======================================================================
 *  Main component
 * ==================================================================== */

export default function UniversalSocialProofStrip(props: Props) {
    // Suppress all transitions/hover motion on the Framer canvas and during
    // static export — motion there causes artifacts and perf issues.
    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const reducedMotion = usePrefersReducedMotion()
    // `mounted` starts false so the first client render matches the static
    // export (useIsStaticRenderer differs between the two) — this prevents
    // hydration mismatches. Animations engage on the next commit.
    const [mounted, setMounted] = React.useState(false)
    // Layout effect (not useEffect): flips before the first browser paint,
    // so entrance + count-up start from their initial frame instead of
    // showing final content and then jumping — no load-time flicker.
    useIsomorphicLayoutEffect(() => setMounted(true), [])

    // Master gate: JS-driven motion only after mount, live (not canvas /
    // export), animations enabled, and no reduced-motion request.
    const animationsOn =
        mounted && !isStatic && !reducedMotion && props.enableAnimations

    const rootRef = React.useRef<HTMLDivElement>(null)

    // Count-up waits until the strip scrolls into view.
    const wantsReveal = animationsOn && props.animateNumbers
    const inView = useInView(rootRef, wantsReveal)
    const entranceOn = animationsOn && props.entranceAnimation
    const anim: AnimState = React.useMemo(
        () => ({
            numbers: animationsOn && props.animateNumbers,
            run: inView,
            duration: Math.max(200, props.numberDuration * 1000),
        }),
        [animationsOn, props.animateNumbers, inView, props.numberDuration]
    )

    // Resolve theme tokens; "custom" reads the explicit style controls.
    const tokens: ThemeTokens = React.useMemo(() => {
        if (props.theme === "custom") {
            return {
                background: props.bg,
                text: props.ctaText || "#0e1116",
                muted: withAlpha(props.borderColor || "#5b6472", 1),
                border: props.borderColor,
                borderWidth: props.borderW,
                borderStyle: props.borderStyle,
                radius: props.radius,
                shadow: props.shadow,
                star: props.starFilled,
                starEmpty: props.starEmpty,
                divider: props.dividerColor,
                accent: props.ctaBackground || "#0e1116",
                accentText: props.ctaText || "#ffffff",
                backdropBlur: props.backdropBlur,
            }
        }
        return THEMES[props.theme]
    }, [
        props.theme,
        props.bg,
        props.borderColor,
        props.borderW,
        props.borderStyle,
        props.radius,
        props.shadow,
        props.starFilled,
        props.starEmpty,
        props.dividerColor,
        props.ctaBackground,
        props.ctaText,
        props.backdropBlur,
    ])

    const cfg = presetConfig(props.preset)
    const baseScale = cfg.defaultScale

    // Column vs row is a purely explicit choice. "auto" follows the preset;
    // "horizontal"/"vertical" lock the orientation. No width measuring — the
    // component simply renders at the size Framer gives it and wraps to fit.
    const isColumn =
        props.layoutMode === "vertical"
            ? true
            : props.layoutMode === "horizontal"
              ? false
              : cfg.direction === "column"

    const order: BlockKey[] = cfg.order

    // Visibility per block.
    const visible: Record<BlockKey, boolean> = {
        rating: props.showRating,
        testimonial: props.showTestimonial,
        metrics: props.showMetrics,
        badges: props.showBadges,
        logos: props.showLogos,
        cta: props.showCTA,
        live: props.showLiveActivity,
        avatars: props.showAvatars,
    }

    const badges = props.badges.slice(0, Math.max(0, props.maxBadges))

    // Build the ordered list of rendered blocks (with emphasis applied).
    const blocks: { key: BlockKey; node: React.ReactNode; grow: number }[] = []
    for (const key of order) {
        if (!visible[key]) continue
        const emph = emphasisFor(props.emphasis, key)
        const scale = baseScale * emph.scale
        let node: React.ReactNode = null

        if (key === "rating") {
            node = (
                <RatingBlock
                    props={props}
                    tokens={tokens}
                    scale={scale}
                    anim={anim}
                />
            )
        } else if (key === "testimonial") {
            node = (
                <TestimonialRotator
                    props={props}
                    tokens={tokens}
                    scale={scale}
                    animate={animationsOn}
                />
            )
        } else if (key === "metrics") {
            node = (
                <MetricsBlock
                    props={props}
                    tokens={tokens}
                    scale={scale}
                    emphasizePrimary={props.emphasis === "primaryMetric"}
                    anim={anim}
                />
            )
        } else if (key === "live") {
            node = (
                <LiveActivity
                    props={props}
                    tokens={tokens}
                    animate={animationsOn}
                />
            )
        } else if (key === "avatars") {
            node = <AvatarStack props={props} tokens={tokens} />
        } else if (key === "badges") {
            if (badges.length === 0) continue
            node = (
                <div
                    style={{
                        display: "flex",
                        flexDirection:
                            props.badgeLayout === "column" ? "column" : "row",
                        flexWrap:
                            props.badgeLayout === "wrap" ? "wrap" : "nowrap",
                        gap: props.badgeGap,
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    {badges.map((b, i) => (
                        <PlatformBadge
                            key={`${b.platform}-${i}`}
                            data={b}
                            size={props.badgeSize}
                            radius={props.badgeRadius}
                            showRating={props.badgeShowRating}
                            showCount={props.badgeShowCount}
                            newTab={props.badgeNewTab}
                            font={props.badgeFont}
                            hoverBg={props.badgeHoverBg}
                            emphasized={
                                props.emphasis === "platformBadge" && i === 0
                            }
                        />
                    ))}
                </div>
            )
        } else if (key === "logos") {
            node = (
                <LogoStrip
                    props={props}
                    tokens={tokens}
                    animate={animationsOn}
                />
            )
        } else if (key === "cta") {
            node = <TrustCTA props={props} tokens={tokens} />
        }

        if (node) {
            // Staggered CSS entrance. The class is only applied once
            // animations are live (post-mount, not canvas/reduced-motion),
            // so the static/first render stays visible — no flash, no shift.
            const revealIndex = blocks.length
            const delay = revealIndex * Math.max(0, props.entranceStagger)
            blocks.push({
                key,
                grow: emph.grow,
                node: (
                    <div
                        className={entranceOn ? "uosps-reveal" : undefined}
                        style={{
                            opacity: emph.opacity,
                            animationDelay: entranceOn
                                ? `${delay}ms`
                                : undefined,
                            display: "flex",
                            flex:
                                !isColumn && emph.grow > 0
                                    ? `${emph.grow} 1 auto`
                                    : "0 1 auto",
                            minWidth: 0,
                            justifyContent:
                                props.quoteAlign === "center" &&
                                key === "testimonial"
                                    ? "center"
                                    : "flex-start",
                        }}
                    >
                        {node}
                    </div>
                ),
            })
        }
    }

    const dividerOrientation: "vertical" | "horizontal" = isColumn
        ? "horizontal"
        : "vertical"

    const children: React.ReactNode[] = []
    blocks.forEach((b, i) => {
        children.push(
            <React.Fragment key={`block-${b.key}`}>{b.node}</React.Fragment>
        )
        if (
            props.showDividers &&
            i < blocks.length - 1 &&
            !isColumn // dividers only separate a horizontal row; stacked stays clean
        ) {
            children.push(
                <Divider
                    key={`divider-${i}`}
                    orientation={dividerOrientation}
                    color={props.dividerColor}
                    thickness={props.dividerThickness}
                    length={
                        dividerOrientation === "vertical"
                            ? props.dividerLength
                            : 0
                    }
                    spacing={props.dividerSpacing}
                />
            )
        }
    })

    const gap = props.blockGap
    const padX = props.padX
    const padY = props.padY
    // Stacked layouts left-align by default (cross-axis is horizontal);
    // rows use the chosen cross-axis alignment.
    const alignItems = isColumn ? "flex-start" : props.align

    const containerStyle: React.CSSProperties = {
        display: "flex",
        flexDirection: isColumn ? "column" : "row",
        flexWrap: !isColumn && cfg.wrap ? "wrap" : "nowrap",
        alignItems,
        justifyContent: props.justify,
        gap,
        width: "100%",
        minHeight: props.minHeight,
        padding: `${padY}px ${padX}px`,
        background: tokens.background,
        color: tokens.text,
        border:
            tokens.borderStyle === "none"
                ? "none"
                : `${tokens.borderWidth}px ${tokens.borderStyle} ${tokens.border}`,
        borderRadius: tokens.radius,
        boxShadow: tokens.shadow === "none" ? undefined : tokens.shadow,
        overflow: props.overflow,
        backdropFilter: tokens.backdropBlur
            ? `blur(${tokens.backdropBlur}px)`
            : undefined,
        WebkitBackdropFilter: tokens.backdropBlur
            ? `blur(${tokens.backdropBlur}px)`
            : undefined,
    }

    const strip = (
        <div
            ref={rootRef}
            className="uosps-root uosps-anim"
            data-anim={animationsOn ? "true" : "false"}
            data-hover={props.hoverEffects ? "true" : "false"}
            style={containerStyle}
            role="group"
            aria-label="Social proof and reviews"
        >
            <StyleTag />
            {children.length > 0 ? (
                children
            ) : (
                <span style={{ color: tokens.muted, fontSize: 13 }}>
                    Enable a content block to display social proof.
                </span>
            )}
        </div>
    )

    // Trust message placement.
    if (props.trustMessageEnabled && props.trustMessage) {
        const message = (
            <span
                style={{
                    ...props.trustFont,
                    color: tokens.muted,
                    whiteSpace:
                        props.trustMessagePosition === "beside"
                            ? "nowrap"
                            : "normal",
                }}
            >
                {props.trustMessage}
            </span>
        )
        if (props.trustMessagePosition === "beside") {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                        width: "100%",
                    }}
                >
                    {message}
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>{strip}</div>
                </div>
            )
        }
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    alignItems:
                        props.align === "center" ? "center" : "flex-start",
                    width: "100%",
                }}
            >
                {props.trustMessagePosition === "above" ? message : null}
                {strip}
                {props.trustMessagePosition === "below" ? message : null}
            </div>
        )
    }

    return strip
}

/* ======================================================================
 *  Defaults
 * ==================================================================== */

UniversalSocialProofStrip.defaultProps = {
    preset: "fullWidth",
    layoutMode: "auto",
    emphasis: "balanced",
    theme: "cleanLight",

    trustMessageEnabled: false,
    trustMessage: "Trusted by thousands of customers",
    trustMessagePosition: "above",

    showRating: true,
    ratingValue: 4.8,
    ratingMax: 5,
    reviewCount: "428",
    ratingLabel: "Excellent",
    ratingLabelEnabled: true,
    partialStars: true,
    starSize: 18,
    starGap: 2,
    starFilled: "#f5a623",
    starEmpty: "#e2e6ec",
    showReviewCount: true,

    showBadges: true,
    badgeLayout: "row",
    badgeSize: 13,
    badgeRadius: 999,
    badgeGap: 8,
    maxBadges: 4,
    badgeNewTab: true,
    badgeShowRating: true,
    badgeShowCount: true,

    showTestimonial: true,
    quote: "The entire experience was simple, fast, and better than we expected.",
    author: "Alex Morgan",
    authorRole: "Verified customer",
    authorCompany: "",
    rotateTestimonials: true,
    rotateInterval: 5,
    showRotatorDots: true,
    testimonials: [
        {
            quote: "The entire experience was simple, fast, and better than we expected.",
            author: "Alex Morgan",
            role: "Verified customer",
            company: "",
            verified: true,
        },
        {
            quote: "Setup took minutes and support replied the same day. Genuinely impressed.",
            author: "Priya Nair",
            role: "Operations Lead",
            company: "Northwind",
            verified: true,
        },
        {
            quote: "We switched three tools for this one. Our team hasn't looked back.",
            author: "Daniel Roth",
            role: "Founder",
            company: "Acme Co",
            verified: true,
        },
    ],
    showVerified: true,
    verifiedLabel: "",
    showQuoteIcon: true,
    quoteMaxWidth: 320,
    quoteMaxLines: 2,
    quoteAlign: "left",

    showMetrics: true,
    metricsVisible: 3,
    metricOrientation: "row",
    metricGap: 20,
    metricDividers: true,

    showLogos: false,
    logoHeight: 24,
    logoGap: 24,
    logoOpacity: 0.75,
    logoGrayscale: true,
    logoHoverOpacity: 1,
    maxLogos: 6,
    logoAlign: "center",
    logoOverflow: "wrap",
    logoMarqueeSpeed: 20,

    showAvatars: false,
    avatarSize: 34,
    avatarOverlap: 12,
    avatarRing: "#ffffff",
    avatarRingWidth: 2,
    maxAvatars: 4,
    avatarShowCounter: true,
    avatarExtraCount: "2,300",
    avatarCaption: "Join 2,300+ happy customers",
    avatarCaptionPosition: "right",
    avatars: [
        { alt: "Maya" },
        { alt: "Leo" },
        { alt: "Sana" },
        { alt: "Tom" },
        { alt: "Ivy" },
    ],

    showCTA: true,
    ctaLabel: "Read all reviews",
    ctaUrl: "#",
    ctaStyle: "text",
    ctaIcon: true,
    ctaNewTab: false,
    ctaBackground: "#0e1116",
    ctaText: "",
    ctaBorder: "#e6e9ef",
    ctaRadius: 10,
    ctaPaddingX: 16,
    ctaPaddingY: 10,

    align: "center",
    justify: "space-between",
    minHeight: 0,
    bg: "#ffffff",
    borderColor: "#e6e9ef",
    borderW: 1,
    borderStyle: "solid",
    radius: 14,
    shadow: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
    padX: 24,
    padY: 16,
    blockGap: 20,
    overflow: "visible",
    backdropBlur: 0,

    showDividers: true,
    dividerColor: "#e6e9ef",
    dividerThickness: 1,
    dividerLength: 32,
    dividerSpacing: 4,

    hoverEffects: true,
    ctaArrowMove: true,
    badgeHoverBg: true,

    enableAnimations: true,
    entranceAnimation: true,
    entranceStagger: 80,
    animateNumbers: true,
    numberDuration: 1.2,

    showLiveActivity: false,
    liveDotColor: "#22c55e",
    liveInterval: 4,
    liveMessages: [
        { text: "12 people are viewing this right now" },
        { text: "Sarah just left a 5-star review" },
        { text: "8 bookings in the last 24 hours" },
    ],

    metrics: [
        { value: "2,300+", label: "happy customers", primary: true },
        { value: "98%", label: "satisfaction", primary: false },
        { value: "42", label: "countries", primary: false },
    ],
    badges: [
        {
            platform: "Google Reviews",
            rating: "4.8",
            reviewCount: "428",
            link: "",
            background: "#ffffff",
            text: "#1a1a1a",
            border: "#e6e9ef",
        },
    ],
    logos: [
        { alt: "Northwind", link: "", tooltip: "" },
        { alt: "Acme Co", link: "", tooltip: "" },
        { alt: "Globex", link: "", tooltip: "" },
    ],
} as Partial<Props>

/* ======================================================================
 *  Font defaults (spread directly into inline styles)
 * ==================================================================== */

const FONT_SCORE: FontValue = {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.1,
}
const FONT_LABEL: FontValue = {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.2,
}
const FONT_REVIEW: FontValue = { fontSize: 13, fontWeight: 400 }
const FONT_QUOTE: FontValue = {
    fontSize: 15,
    fontWeight: 500,
    lineHeight: 1.45,
}
const FONT_AUTHOR: FontValue = { fontSize: 13, fontWeight: 400 }
const FONT_METRIC_VALUE: FontValue = { fontSize: 20, fontWeight: 700 }
const FONT_METRIC_LABEL: FontValue = { fontSize: 12, fontWeight: 400 }
const FONT_BADGE: FontValue = { fontSize: 13, fontWeight: 500 }
const FONT_CTA: FontValue = { fontSize: 14, fontWeight: 600 }
const FONT_TRUST: FontValue = { fontSize: 13, fontWeight: 500 }
const FONT_AVATAR_CAPTION: FontValue = { fontSize: 13, fontWeight: 500 }

/* ======================================================================
 *  Property controls
 * ==================================================================== */

function fontControl(defaultValue: FontValue) {
    return {
        type: FontControl,
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue,
    } as any
}

addPropertyControls(UniversalSocialProofStrip, {
    /* 1. CONTENT ---------------------------------------------------- */
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: [
            "fullWidth",
            "inline",
            "mini",
            "stacked",
            "logoFocused",
            "testimonialFocused",
        ],
        optionTitles: [
            "Full-width bar",
            "Inline row",
            "Mini",
            "Stacked",
            "Logo-focused",
            "Testimonial-focused",
        ],
        defaultValue: "fullWidth",
    },
    layoutMode: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["auto", "horizontal", "vertical"],
        optionTitles: ["Auto (preset)", "Horizontal", "Vertical (box)"],
        defaultValue: "auto",
        description:
            "Auto follows the preset. Horizontal is a row that wraps to fit; Vertical is a stacked box. Sized by your Framer frame.",
    },
    emphasis: {
        type: ControlType.Enum,
        title: "Emphasis",
        options: [
            "balanced",
            "rating",
            "primaryMetric",
            "testimonial",
            "platformBadge",
        ],
        optionTitles: [
            "Balanced",
            "Rating",
            "Primary metric",
            "Testimonial",
            "Platform badge",
        ],
        defaultValue: "balanced",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "cleanLight",
            "cleanDark",
            "softNeutral",
            "highContrast",
            "minimalBorderless",
            "glass",
            "warm",
            "custom",
        ],
        optionTitles: [
            "Clean Light",
            "Clean Dark",
            "Soft Neutral",
            "High Contrast",
            "Minimal Borderless",
            "Glass",
            "Warm",
            "Custom",
        ],
        defaultValue: "cleanLight",
    },
    trustMessageEnabled: {
        type: ControlType.Boolean,
        title: "Trust message",
        defaultValue: false,
    },
    trustMessage: {
        type: ControlType.String,
        title: "Message",
        defaultValue: "Trusted by thousands of customers",
        hidden: (p: Props) => !p.trustMessageEnabled,
    },
    trustMessagePosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["above", "beside", "below"],
        optionTitles: ["Above", "Beside", "Below"],
        defaultValue: "above",
        hidden: (p: Props) => !p.trustMessageEnabled,
    },

    /* 2. RATING ----------------------------------------------------- */
    showRating: {
        type: ControlType.Boolean,
        title: "Rating block",
        defaultValue: true,
    },
    ratingValue: {
        type: ControlType.Number,
        title: "Rating",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 4.8,
        hidden: (p: Props) => !p.showRating,
    },
    ratingMax: {
        type: ControlType.Number,
        title: "Max",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        hidden: (p: Props) => !p.showRating,
    },
    reviewCount: {
        type: ControlType.String,
        title: "Review count",
        defaultValue: "428",
        hidden: (p: Props) => !p.showRating,
    },
    ratingLabelEnabled: {
        type: ControlType.Boolean,
        title: "Show label",
        defaultValue: true,
        hidden: (p: Props) => !p.showRating,
    },
    ratingLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Excellent",
        hidden: (p: Props) => !p.showRating || !p.ratingLabelEnabled,
    },
    partialStars: {
        type: ControlType.Boolean,
        title: "Partial stars",
        defaultValue: true,
        hidden: (p: Props) => !p.showRating,
    },
    showReviewCount: {
        type: ControlType.Boolean,
        title: "Show count line",
        defaultValue: true,
        hidden: (p: Props) => !p.showRating,
    },
    starSize: {
        type: ControlType.Number,
        title: "Star size",
        min: 8,
        max: 48,
        defaultValue: 18,
        hidden: (p: Props) => !p.showRating,
    },
    starGap: {
        type: ControlType.Number,
        title: "Star gap",
        min: 0,
        max: 12,
        defaultValue: 2,
        hidden: (p: Props) => !p.showRating,
    },
    starFilled: {
        type: ControlType.Color,
        title: "Filled star",
        defaultValue: "#f5a623",
        hidden: (p: Props) => !p.showRating,
    },
    starEmpty: {
        type: ControlType.Color,
        title: "Empty star",
        defaultValue: "#e2e6ec",
        hidden: (p: Props) => !p.showRating,
    },
    scoreFont: {
        ...fontControl(FONT_SCORE),
        title: "Score font",
        hidden: (p: Props) => !p.showRating,
    },
    ratingLabelFont: {
        ...fontControl(FONT_LABEL),
        title: "Label font",
        hidden: (p: Props) => !p.showRating || !p.ratingLabelEnabled,
    },
    reviewCountFont: {
        ...fontControl(FONT_REVIEW),
        title: "Count font",
        hidden: (p: Props) => !p.showRating,
    },

    /* 3. PLATFORMS -------------------------------------------------- */
    showBadges: {
        type: ControlType.Boolean,
        title: "Platform badges",
        defaultValue: true,
    },
    badges: {
        type: ControlType.Array,
        title: "Badges",
        hidden: (p: Props) => !p.showBadges,
        control: {
            type: ControlType.Object,
            controls: {
                platform: {
                    type: ControlType.Enum,
                    title: "Platform",
                    options: [
                        "Google",
                        "Trustpilot",
                        "G2",
                        "Capterra",
                        "Yelp",
                        "Airbnb",
                        "TripAdvisor",
                        "Facebook",
                        "Product Hunt",
                        "Custom",
                    ],
                    defaultValue: "Google",
                },
                icon: {
                    type: ControlType.Image,
                    title: "Icon",
                },
                rating: {
                    type: ControlType.String,
                    title: "Rating",
                    defaultValue: "4.8",
                },
                reviewCount: {
                    type: ControlType.String,
                    title: "Count",
                    defaultValue: "428",
                },
                link: { type: ControlType.Link, title: "Link" },
                background: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#ffffff",
                },
                text: {
                    type: ControlType.Color,
                    title: "Text",
                    defaultValue: "#1a1a1a",
                },
                border: {
                    type: ControlType.Color,
                    title: "Border",
                    defaultValue: "#e6e9ef",
                },
            },
        },
    },
    badgeLayout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["row", "wrap", "column"],
        optionTitles: ["Row", "Wrap", "Column"],
        defaultValue: "row",
        hidden: (p: Props) => !p.showBadges,
    },
    badgeSize: {
        type: ControlType.Number,
        title: "Size",
        min: 9,
        max: 22,
        defaultValue: 13,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        defaultValue: 999,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 40,
        defaultValue: 8,
        hidden: (p: Props) => !p.showBadges,
    },
    maxBadges: {
        type: ControlType.Number,
        title: "Max visible",
        min: 1,
        max: 12,
        defaultValue: 4,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeNewTab: {
        type: ControlType.Boolean,
        title: "Open new tab",
        defaultValue: true,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeShowRating: {
        type: ControlType.Boolean,
        title: "Show rating",
        defaultValue: true,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeShowCount: {
        type: ControlType.Boolean,
        title: "Show count",
        defaultValue: true,
        hidden: (p: Props) => !p.showBadges,
    },
    badgeFont: {
        ...fontControl(FONT_BADGE),
        title: "Badge font",
        hidden: (p: Props) => !p.showBadges,
    },

    /* 4. TESTIMONIAL ------------------------------------------------ */
    showTestimonial: {
        type: ControlType.Boolean,
        title: "Testimonial",
        defaultValue: true,
    },
    quote: {
        type: ControlType.String,
        title: "Quote",
        displayTextArea: true,
        defaultValue:
            "The entire experience was simple, fast, and better than we expected.",
        hidden: (p: Props) => !p.showTestimonial,
    },
    author: {
        type: ControlType.String,
        title: "Author",
        defaultValue: "Alex Morgan",
        hidden: (p: Props) => !p.showTestimonial,
    },
    authorRole: {
        type: ControlType.String,
        title: "Role",
        defaultValue: "Verified customer",
        hidden: (p: Props) => !p.showTestimonial,
    },
    authorCompany: {
        type: ControlType.String,
        title: "Company",
        defaultValue: "",
        hidden: (p: Props) => !p.showTestimonial,
    },
    avatar: {
        type: ControlType.Image,
        title: "Avatar",
        hidden: (p: Props) => !p.showTestimonial,
    },
    testimonials: {
        type: ControlType.Array,
        title: "Rotator items",
        description:
            "Add 2+ to enable the carousel. Leave empty to use the single quote above.",
        hidden: (p: Props) => !p.showTestimonial,
        control: {
            type: ControlType.Object,
            controls: {
                quote: {
                    type: ControlType.String,
                    title: "Quote",
                    displayTextArea: true,
                    defaultValue: "A short, specific line about the result.",
                },
                author: {
                    type: ControlType.String,
                    title: "Author",
                    defaultValue: "Jordan Lee",
                },
                role: {
                    type: ControlType.String,
                    title: "Role",
                    defaultValue: "Verified customer",
                },
                company: {
                    type: ControlType.String,
                    title: "Company",
                    defaultValue: "",
                },
                avatar: { type: ControlType.Image, title: "Avatar" },
            },
        },
    },
    rotateTestimonials: {
        type: ControlType.Boolean,
        title: "Auto-rotate",
        defaultValue: true,
        hidden: (p: Props) => !p.showTestimonial,
    },
    rotateInterval: {
        type: ControlType.Number,
        title: "Interval (s)",
        min: 2,
        max: 20,
        step: 0.5,
        defaultValue: 5,
        hidden: (p: Props) => !p.showTestimonial || !p.rotateTestimonials,
    },
    showRotatorDots: {
        type: ControlType.Boolean,
        title: "Show dots",
        defaultValue: true,
        hidden: (p: Props) => !p.showTestimonial,
    },
    showVerified: {
        type: ControlType.Boolean,
        title: "Verified badge",
        defaultValue: true,
        description: "Shows a check next to authors marked verified.",
        hidden: (p: Props) => !p.showTestimonial,
    },
    verifiedLabel: {
        type: ControlType.String,
        title: "Verified label",
        defaultValue: "",
        placeholder: "Verified",
        hidden: (p: Props) => !p.showTestimonial || !p.showVerified,
    },
    showQuoteIcon: {
        type: ControlType.Boolean,
        title: "Quote mark",
        defaultValue: true,
        hidden: (p: Props) => !p.showTestimonial,
    },
    quoteMaxWidth: {
        type: ControlType.Number,
        title: "Max width",
        min: 120,
        max: 720,
        defaultValue: 320,
        hidden: (p: Props) => !p.showTestimonial,
    },
    quoteMaxLines: {
        type: ControlType.Number,
        title: "Max lines",
        min: 1,
        max: 6,
        defaultValue: 2,
        hidden: (p: Props) => !p.showTestimonial,
    },
    quoteAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        hidden: (p: Props) => !p.showTestimonial,
    },
    quoteFont: {
        ...fontControl(FONT_QUOTE),
        title: "Quote font",
        hidden: (p: Props) => !p.showTestimonial,
    },
    authorFont: {
        ...fontControl(FONT_AUTHOR),
        title: "Author font",
        hidden: (p: Props) => !p.showTestimonial,
    },

    /* 5. METRICS ---------------------------------------------------- */
    showMetrics: {
        type: ControlType.Boolean,
        title: "Metrics",
        defaultValue: true,
    },
    metrics: {
        type: ControlType.Array,
        title: "Items",
        hidden: (p: Props) => !p.showMetrics,
        control: {
            type: ControlType.Object,
            controls: {
                value: {
                    type: ControlType.String,
                    title: "Value",
                    defaultValue: "2,300+",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "happy customers",
                },
                icon: { type: ControlType.Image, title: "Icon" },
                tooltip: {
                    type: ControlType.String,
                    title: "Tooltip",
                    defaultValue: "",
                },
                primary: {
                    type: ControlType.Boolean,
                    title: "Primary",
                    defaultValue: false,
                },
            },
        },
    },
    metricsVisible: {
        type: ControlType.Number,
        title: "Visible",
        min: 1,
        max: 8,
        defaultValue: 3,
        hidden: (p: Props) => !p.showMetrics,
    },
    metricOrientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["row", "column"],
        optionTitles: ["Row", "Column"],
        defaultValue: "row",
        hidden: (p: Props) => !p.showMetrics,
    },
    metricGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 60,
        defaultValue: 20,
        hidden: (p: Props) => !p.showMetrics,
    },
    metricDividers: {
        type: ControlType.Boolean,
        title: "Dividers",
        defaultValue: true,
        hidden: (p: Props) => !p.showMetrics,
    },
    metricValueFont: {
        ...fontControl(FONT_METRIC_VALUE),
        title: "Value font",
        hidden: (p: Props) => !p.showMetrics,
    },
    metricLabelFont: {
        ...fontControl(FONT_METRIC_LABEL),
        title: "Label font",
        hidden: (p: Props) => !p.showMetrics,
    },

    /* 6. LOGOS ------------------------------------------------------ */
    showLogos: {
        type: ControlType.Boolean,
        title: "Logos",
        defaultValue: false,
    },
    logos: {
        type: ControlType.Array,
        title: "Items",
        hidden: (p: Props) => !p.showLogos,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt text",
                    defaultValue: "Client logo",
                },
                link: { type: ControlType.Link, title: "Link" },
                tooltip: {
                    type: ControlType.String,
                    title: "Tooltip",
                    defaultValue: "",
                },
            },
        },
    },
    logoHeight: {
        type: ControlType.Number,
        title: "Height",
        min: 12,
        max: 80,
        defaultValue: 24,
        hidden: (p: Props) => !p.showLogos,
    },
    logoGap: {
        type: ControlType.Number,
        title: "Gap",
        min: 4,
        max: 80,
        defaultValue: 24,
        hidden: (p: Props) => !p.showLogos,
    },
    logoOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
        hidden: (p: Props) => !p.showLogos,
    },
    logoGrayscale: {
        type: ControlType.Boolean,
        title: "Grayscale",
        defaultValue: true,
        hidden: (p: Props) => !p.showLogos,
    },
    logoHoverOpacity: {
        type: ControlType.Number,
        title: "Hover opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden: (p: Props) => !p.showLogos,
    },
    maxLogos: {
        type: ControlType.Number,
        title: "Max visible",
        min: 1,
        max: 20,
        defaultValue: 6,
        hidden: (p: Props) => !p.showLogos,
    },
    logoAlign: {
        type: ControlType.Enum,
        title: "Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        hidden: (p: Props) => !p.showLogos,
    },
    logoOverflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["wrap", "clip", "marquee"],
        optionTitles: ["Wrap", "Clip", "Marquee"],
        defaultValue: "wrap",
        hidden: (p: Props) => !p.showLogos,
    },
    logoMarqueeSpeed: {
        type: ControlType.Number,
        title: "Marquee speed",
        description: "Seconds per loop (lower = faster)",
        min: 4,
        max: 80,
        defaultValue: 20,
        hidden: (p: Props) => !p.showLogos || p.logoOverflow !== "marquee",
    },

    /* 6b. AVATAR STACK --------------------------------------------- */
    showAvatars: {
        type: ControlType.Boolean,
        title: "Avatar stack",
        defaultValue: false,
    },
    avatars: {
        type: ControlType.Array,
        title: "Avatars",
        hidden: (p: Props) => !p.showAvatars,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt / initial",
                    defaultValue: "Customer",
                },
            },
        },
    },
    avatarCaption: {
        type: ControlType.String,
        title: "Caption",
        defaultValue: "Join 2,300+ happy customers",
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarCaptionPosition: {
        type: ControlType.Enum,
        title: "Caption pos",
        options: ["right", "below"],
        optionTitles: ["Right", "Below"],
        defaultValue: "right",
        hidden: (p: Props) => !p.showAvatars || !p.avatarCaption,
    },
    avatarSize: {
        type: ControlType.Number,
        title: "Size",
        min: 20,
        max: 72,
        defaultValue: 34,
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarOverlap: {
        type: ControlType.Number,
        title: "Overlap",
        min: 0,
        max: 40,
        defaultValue: 12,
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarRing: {
        type: ControlType.Color,
        title: "Ring color",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarRingWidth: {
        type: ControlType.Number,
        title: "Ring width",
        min: 0,
        max: 6,
        defaultValue: 2,
        hidden: (p: Props) => !p.showAvatars,
    },
    maxAvatars: {
        type: ControlType.Number,
        title: "Max visible",
        min: 1,
        max: 12,
        defaultValue: 4,
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarShowCounter: {
        type: ControlType.Boolean,
        title: "Show +N",
        defaultValue: true,
        hidden: (p: Props) => !p.showAvatars,
    },
    avatarExtraCount: {
        type: ControlType.String,
        title: "+N value",
        defaultValue: "2,300",
        description: "Leave empty to auto-count hidden avatars.",
        hidden: (p: Props) => !p.showAvatars || !p.avatarShowCounter,
    },

    /* 7. CTA -------------------------------------------------------- */
    showCTA: {
        type: ControlType.Boolean,
        title: "CTA",
        defaultValue: true,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Read all reviews",
        hidden: (p: Props) => !p.showCTA,
    },
    ctaUrl: {
        type: ControlType.Link,
        title: "URL",
        hidden: (p: Props) => !p.showCTA,
    },
    ctaStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["text", "outlined", "filled"],
        optionTitles: ["Text link", "Outlined", "Filled"],
        defaultValue: "text",
        hidden: (p: Props) => !p.showCTA,
    },
    ctaIcon: {
        type: ControlType.Boolean,
        title: "Arrow icon",
        defaultValue: true,
        hidden: (p: Props) => !p.showCTA,
    },
    ctaNewTab: {
        type: ControlType.Boolean,
        title: "Open new tab",
        defaultValue: false,
        hidden: (p: Props) => !p.showCTA,
    },
    ctaBackground: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0e1116",
        hidden: (p: Props) => !p.showCTA || p.ctaStyle !== "filled",
    },
    ctaText: {
        type: ControlType.Color,
        title: "Text color",
        defaultValue: "#ffffff",
        hidden: (p: Props) => !p.showCTA,
    },
    ctaBorder: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#e6e9ef",
        hidden: (p: Props) => !p.showCTA || p.ctaStyle !== "outlined",
    },
    ctaRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        defaultValue: 10,
        hidden: (p: Props) => !p.showCTA || p.ctaStyle === "text",
    },
    ctaPaddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 48,
        defaultValue: 16,
        hidden: (p: Props) => !p.showCTA || p.ctaStyle === "text",
    },
    ctaPaddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 32,
        defaultValue: 10,
        hidden: (p: Props) => !p.showCTA || p.ctaStyle === "text",
    },
    ctaFont: {
        ...fontControl(FONT_CTA),
        title: "CTA font",
        hidden: (p: Props) => !p.showCTA,
    },

    /* 8. LAYOUT / STYLE --------------------------------------------- */
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Start", "Center", "End"],
        defaultValue: "center",
        description: "Cross-axis alignment (row layout).",
        hidden: (p: Props) => p.layoutMode === "vertical",
    },
    justify: {
        type: ControlType.Enum,
        title: "Justify",
        options: [
            "flex-start",
            "center",
            "flex-end",
            "space-between",
            "space-around",
        ],
        optionTitles: ["Start", "Center", "End", "Between", "Around"],
        defaultValue: "space-between",
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min height",
        min: 0,
        max: 400,
        defaultValue: 0,
    },
    padX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 80,
        defaultValue: 24,
    },
    padY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 80,
        defaultValue: 16,
    },
    blockGap: {
        type: ControlType.Number,
        title: "Block gap",
        min: 0,
        max: 80,
        defaultValue: 20,
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["visible", "hidden"],
        optionTitles: ["Visible", "Hidden"],
        defaultValue: "visible",
    },
    // Custom-theme-only style controls.
    bg: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
        hidden: (p: Props) => p.theme !== "custom",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border color",
        defaultValue: "#e6e9ef",
        hidden: (p: Props) => p.theme !== "custom",
    },
    borderW: {
        type: ControlType.Number,
        title: "Border width",
        min: 0,
        max: 8,
        defaultValue: 1,
        hidden: (p: Props) => p.theme !== "custom",
    },
    borderStyle: {
        type: ControlType.Enum,
        title: "Border style",
        options: ["solid", "dashed", "dotted", "none"],
        optionTitles: ["Solid", "Dashed", "Dotted", "None"],
        defaultValue: "solid",
        hidden: (p: Props) => p.theme !== "custom",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        defaultValue: 14,
        hidden: (p: Props) => p.theme !== "custom",
    },
    shadow: {
        type: ControlType.String,
        title: "Shadow",
        defaultValue:
            "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
        hidden: (p: Props) => p.theme !== "custom",
    },
    backdropBlur: {
        type: ControlType.Number,
        title: "Backdrop blur",
        min: 0,
        max: 40,
        defaultValue: 0,
        hidden: (p: Props) => p.theme !== "custom",
    },

    /* Dividers */
    showDividers: {
        type: ControlType.Boolean,
        title: "Dividers",
        defaultValue: true,
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider color",
        defaultValue: "#e6e9ef",
        hidden: (p: Props) => !p.showDividers,
    },
    dividerThickness: {
        type: ControlType.Number,
        title: "Thickness",
        min: 1,
        max: 6,
        defaultValue: 1,
        hidden: (p: Props) => !p.showDividers,
    },
    dividerLength: {
        type: ControlType.Number,
        title: "Length",
        min: 8,
        max: 80,
        defaultValue: 32,
        hidden: (p: Props) => !p.showDividers,
    },
    dividerSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 0,
        max: 24,
        defaultValue: 4,
        hidden: (p: Props) => !p.showDividers,
    },

    /* 9. TRUST MESSAGE FONT */
    trustFont: {
        ...fontControl(FONT_TRUST),
        title: "Trust font",
        hidden: (p: Props) => !p.trustMessageEnabled,
    },
    avatarCaptionFont: {
        ...fontControl(FONT_AVATAR_CAPTION),
        title: "Avatar caption font",
        hidden: (p: Props) => !p.showAvatars || !p.avatarCaption,
    },

    /* 10. INTERACTION ---------------------------------------------- */
    hoverEffects: {
        type: ControlType.Boolean,
        title: "Hover effects",
        defaultValue: true,
        description:
            "Lift/scale micro-interactions on stars, metrics, badges, logos, dots and the CTA.",
    },
    ctaArrowMove: {
        type: ControlType.Boolean,
        title: "CTA arrow move",
        defaultValue: true,
    },
    badgeHoverBg: {
        type: ControlType.Boolean,
        title: "Badge hover",
        defaultValue: true,
    },

    /* 12. ANIMATIONS ------------------------------------------------ */
    enableAnimations: {
        type: ControlType.Boolean,
        title: "Animations",
        defaultValue: true,
        description:
            "Master switch. Auto-disabled on canvas, export and for reduced-motion visitors.",
    },
    entranceAnimation: {
        type: ControlType.Boolean,
        title: "Entrance reveal",
        defaultValue: true,
        hidden: (p: Props) => !p.enableAnimations,
    },
    entranceStagger: {
        type: ControlType.Number,
        title: "Stagger (ms)",
        min: 0,
        max: 300,
        defaultValue: 80,
        hidden: (p: Props) => !p.enableAnimations || !p.entranceAnimation,
    },
    animateNumbers: {
        type: ControlType.Boolean,
        title: "Count-up numbers",
        defaultValue: true,
        hidden: (p: Props) => !p.enableAnimations,
    },
    numberDuration: {
        type: ControlType.Number,
        title: "Count duration (s)",
        min: 0.3,
        max: 4,
        step: 0.1,
        defaultValue: 1.2,
        hidden: (p: Props) => !p.enableAnimations || !p.animateNumbers,
    },

    /* 13. LIVE ACTIVITY -------------------------------------------- */
    showLiveActivity: {
        type: ControlType.Boolean,
        title: "Live ticker",
        defaultValue: false,
    },
    liveMessages: {
        type: ControlType.Array,
        title: "Messages",
        hidden: (p: Props) => !p.showLiveActivity,
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "12 people are viewing this right now",
                },
            },
        },
    },
    liveDotColor: {
        type: ControlType.Color,
        title: "Dot color",
        defaultValue: "#22c55e",
        hidden: (p: Props) => !p.showLiveActivity,
    },
    liveInterval: {
        type: ControlType.Number,
        title: "Interval (s)",
        min: 2,
        max: 20,
        step: 0.5,
        defaultValue: 4,
        hidden: (p: Props) => !p.showLiveActivity,
    },
})
