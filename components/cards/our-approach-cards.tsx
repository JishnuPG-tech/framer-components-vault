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
 * Practical Ui — Our Approach Card
 * ThinkTank · Framer Community · Free
 *
 * A single flip card. Place as many side by side as you need (3, 4, 6 —
 * whatever your process needs) using Framer's own layout tools.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type Scheme = "light" | "dark"
type Theme = "system" | "light" | "dark"
type VisualType = "media" | "icon"
type IconPreset = "spark" | "compass" | "target" | "layers" | "rocket" | "custom"

interface CardImage {
    src: string
    alt?: string
}

interface Props {
    stepNumber: string
    showNumeral: boolean
    title: string
    frontNote: string
    backBody: string

    visualType: VisualType
    coverImage?: CardImage
    mediaImageUrl: string
    iconPreset: IconPreset
    customIconFile?: string
    iconColor: string
    iconSizePercent: number

    revealOnScroll: boolean
    revealDelayMs: number

    theme: Theme
    accent: string
    bgLight: string
    titleLight: string
    frontNoteLight: string
    borderLight: string
    backBgLight: string
    backTitleLight: string
    backBodyLight: string

    cardHeight: number
    minCardHeight: number
    maxCardHeight: number
    radius: number
}

/** Reference width the default cardHeight was designed against — used only to derive a
 *  width:height aspect ratio so the card can stretch fluidly and still look right at any width. */
const REFERENCE_WIDTH = 240

const NIGHT = {
    bg: "#141414",
    title: "#F0F0F0",
    frontNote: "#9A9A9A",
    border: "#242424",
    mediaFallback: "#1B1B1B",
    backBg: "#191919",
    backTitle: "#F0F0F0",
    backBody: "#B5B2AD",
}

function parseRGB(input: string): [number, number, number] {
    if (!input) return [104, 87, 217]
    if (input.startsWith("#")) {
        let hex = input.slice(1)
        if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("")
        const num = parseInt(hex, 16)
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
    }
    const nums = input.match(/[\d.]+/g)
    if (nums && nums.length >= 3) return [parseFloat(nums[0]), parseFloat(nums[1]), parseFloat(nums[2])]
    return [104, 87, 217]
}

function toRGBA(input: string, alpha: number): string {
    const [r, g, b] = parseRGB(input)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Lightens (amount > 0) or darkens (amount < 0) a color by mixing it toward white/black. Used to
 *  derive a small, cohesive palette of tones from a single accent color for the generative art. */
function shade(input: string, amount: number): string {
    const [r, g, b] = parseRGB(input)
    const mix = (c: number) => (amount >= 0 ? c + (255 - c) * amount : c + c * amount)
    return `rgb(${Math.round(mix(r))}, ${Math.round(mix(g))}, ${Math.round(mix(b))})`
}

function hashSeed(str: string): number {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0
    return h || 1
}

function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (Math.imul(s, 1103515245) + 12345) >>> 0
        return (s % 10000) / 10000
    }
}

/** Real browser signal for dark mode — authoritative on a published site. */
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

function luminanceOf(color: string): number | null {
    const m = color.match(/rgba?\(([^)]+)\)/i)
    if (!m) return null
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()))
    const [r, g, b, a = 1] = parts
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    if (a < 0.4) return null
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Secondary signal only — reads the real ambient page background. Never overrides a real dark browser signal, only adds to it. */
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
 * isStatic (Canvas thumbnail / Export) skips every continuous listener/timer below —
 * a single one-time read at mount is enough there, since nothing on a static render
 * target can actually change afterward. This is a deliberate trade: earlier this
 * component also live-followed Framer's own canvas Appearance-preview toggle while
 * actively being edited (a real, separately-fixed UX nicety), but useIsStaticRenderer
 * can't distinguish "being edited" from "being rendered for a thumbnail/export," and
 * Framer's Marketplace review flags ANY component that keeps polling/observing after
 * mount without checking this, regardless of the reason. Preview and the published
 * site are completely unaffected — real matchMedia/DOM events fire normally there.
 */
function useScheme(theme: Theme, wrapRef: React.RefObject<HTMLDivElement>, isStatic: boolean): Scheme {
    // Deterministic "light" on every first render, client or server — this MUST match
    // whatever a build-time/static-export pass would produce (window is undefined there,
    // so any signal-based initializer always resolves "light" at build time). Seeding the
    // client's first render with a signal-based value instead created a real bug: the
    // exported/published site's static HTML is always baked "light," and if the client's
    // very first render disagreed with it, the correction only ever happened to actually
    // stick some of the time — this component was found shipping stuck-light cards on a
    // genuinely dark, system-theme page despite matchMedia and the real ambient background
    // both correctly reading dark. Starting identical on both sides removes that class of
    // bug entirely; the layout effect below still corrects to the real value immediately,
    // before the browser paints, so there's no visible light-then-dark flash either.
    const [detected, setDetected] = React.useState<Scheme>("light")

    React.useLayoutEffect(() => {
        if (theme !== "system") return
        if (typeof window === "undefined") return

        const evaluate = () => {
            const ambientDark = detectAmbientDark(wrapRef.current)
            const osDark = readDarkSignal()
            // Ambient (what's actually painted behind this instance) wins whenever it's
            // readable — it's ground truth. OS preference is only a fallback for the rare
            // case of a fully transparent ancestor chain. (Matches the Practical Ui Doc
            // Block component's detection logic — same family, same reasoning.)
            setDetected((ambientDark !== null ? ambientDark : osDark) ? "dark" : "light")
        }
        evaluate()

        if (isStatic) return

        const media = window.matchMedia("(prefers-color-scheme: dark)")
        media.addEventListener("change", evaluate)

        // Watches the FULL subtree, not just documentElement/body's own attributes — the
        // real dark-mode-carrying wrapper is often several levels deep (a Framer-generated
        // section div picking up its theme class after hydration, not the top-level
        // html/body node), and that class settle can happen shortly AFTER this component's
        // first mount. A shallow, non-subtree observer misses it entirely.
        const watcher = new MutationObserver(evaluate)
        watcher.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-framer-theme"] })
        if (document.body) {
            watcher.observe(document.body, {
                attributes: true,
                attributeFilter: ["class", "data-theme", "data-framer-theme", "style"],
                subtree: true,
            })
        }

        // Fallback safety poll, widened from ~3s to ~6s to give slower hydration/exported-site
        // theme-settle more room before giving up.
        let ticks = 0
        const poll = window.setInterval(() => {
            evaluate()
            ticks += 1
            if (ticks > 20) window.clearInterval(poll)
        }, 300)

        return () => {
            media.removeEventListener("change", evaluate)
            watcher.disconnect()
            window.clearInterval(poll)
        }
    }, [theme, isStatic])

    if (theme === "light" || theme === "dark") return theme
    return detected
}

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const media = window.matchMedia("(prefers-reduced-motion: reduce)")
        setReduced(media.matches)
        const onChange = () => setReduced(media.matches)
        media.addEventListener("change", onChange)
        return () => media.removeEventListener("change", onChange)
    }, [])
    return reduced
}

function useInViewOnce(scrollReveal: boolean, isStatic: boolean, ref: React.RefObject<HTMLDivElement>): boolean {
    // Deterministic on every first render, client or server — must NOT depend on isStatic
    // here. isStatic can differ between Framer's static-export/build pass and a real
    // client hydration pass, and seeding initial state from it caused exactly the same
    // class of stuck-render hydration bug the dark-mode fix above addresses (verified live:
    // cards got stuck permanently invisible on the real published site, not just fixed on
    // Canvas/export as intended). scrollReveal alone is a stable passed-in prop, safe to
    // use here. The layout effect below still corrects to fully-revealed immediately,
    // before paint, whenever isStatic is genuinely true on the client — Canvas thumbnails
    // and exports are unaffected by this change.
    const [revealed, setRevealed] = React.useState(!scrollReveal)
    React.useLayoutEffect(() => {
        if (!scrollReveal || isStatic) {
            setRevealed(true)
            return
        }
        const node = ref.current
        if (!node || typeof IntersectionObserver === "undefined") {
            setRevealed(true)
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setRevealed(true)
                        observer.disconnect()
                    }
                })
            },
            { threshold: 0.2 }
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [scrollReveal, isStatic])
    return revealed
}

/** Flip glyph — two panels turning apart around a dashed center seam, reads clearly as "flip" (not rotate/remix). */
function FlipIcon({ color }: { color: string }) {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M8.2 4L3 5.6V18.4L8.2 20V4Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <path d="M15.8 4L21 5.6V18.4L15.8 20V4Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <line x1="12" y1="2" x2="12" y2="5.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <line x1="12" y1="9.25" x2="12" y2="12" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <line x1="12" y1="14.75" x2="12" y2="18.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
            <line x1="12" y1="22" x2="12" y2="22" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    )
}

/** Generative default cover art — flowing layered curves in shades of the accent color, seeded so
 *  each card (by title) gets a distinct-but-cohesive pattern. Used whenever a buyer hasn't added
 *  their own photo, so the card always looks finished out of the box, stays perfectly on
 *  brand, and never depends on an external hotlinked image. */
function DynamicCurveArt({ accent, isDark, seed }: { accent: string; isDark: boolean; seed: string }) {
    const rand = seededRandom(hashSeed(seed))
    const bgTop = shade(accent, isDark ? -0.35 : 0.62)
    const bgBottom = shade(accent, isDark ? -0.7 : 0.36)
    const layers = [
        { tone: 0.28, baseY: 128, amp: 46, opacity: isDark ? 0.85 : 0.9 },
        { tone: -0.12, baseY: 182, amp: 52, opacity: isDark ? 0.85 : 0.88 },
        { tone: -0.5, baseY: 236, amp: 40, opacity: 0.92 },
    ]
    const uid = seed.replace(/[^a-zA-Z0-9]/g, "") || "card"
    return (
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }}>
            <defs>
                <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={bgTop} />
                    <stop offset="100%" stopColor={bgBottom} />
                </linearGradient>
            </defs>
            <rect width="400" height="300" fill={`url(#grad-${uid})`} />
            {layers.map((layer, i) => {
                const y0 = layer.baseY + (rand() - 0.5) * layer.amp
                const c1y = layer.baseY + (rand() - 0.5) * layer.amp
                const c2y = layer.baseY + (rand() - 0.5) * layer.amp
                const midY = layer.baseY + (rand() - 0.5) * layer.amp
                const c3y = layer.baseY + (rand() - 0.5) * layer.amp
                const endY = layer.baseY + (rand() - 0.5) * layer.amp
                const d = `M0,${y0} C ${100 + rand() * 30},${c1y} ${160 + rand() * 30},${c2y} 210,${midY} C ${270 + rand() * 30},${c3y} ${330 + rand() * 30},${endY} 400,${endY} L400,300 L0,300 Z`
                return <path key={i} d={d} fill={shade(accent, layer.tone)} opacity={layer.opacity} />
            })}
        </svg>
    )
}

/** Unifying photo treatment — a desaturating filter plus an accent-tinted multiply wash and a
 *  bottom legibility fade. Every buyer's photo, whatever its original color, ends up reading as
 *  the same on-brand "family" of images, and the corner badges stay readable on top. */
function MediaTreatment({ accent, isDark }: { accent: string; isDark: boolean }) {
    return (
        <>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(155deg, ${toRGBA(accent, isDark ? 0.5 : 0.4)} 0%, ${toRGBA(
                        accent,
                        isDark ? 0.22 : 0.16
                    )} 45%, transparent 78%)`,
                    mixBlendMode: "multiply",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, rgba(0,0,0,0) 52%, rgba(0,0,0,${isDark ? 0.5 : 0.34}) 100%)`,
                    pointerEvents: "none",
                }}
            />
        </>
    )
}

/** Elevated hover glow shared by both faces — a soft drop shadow plus an accent-tinted ring,
 *  tuned brighter in light mode where a plain dark shadow alone reads as barely-there. */
function hoverGlow(accent: string, isDark: boolean): string {
    return [
        "0 22px 44px -18px rgba(0,0,0,0.28)",
        `0 10px 26px -10px ${toRGBA(accent, isDark ? 0.34 : 0.42)}`,
        `inset 0 0 0 1px ${toRGBA(accent, isDark ? 0.22 : 0.32)}`,
    ].join(", ")
}

function PresetIcon({ preset, color, sizePercent }: { preset: IconPreset; color: string; sizePercent: number }) {
    const common = { width: `${sizePercent}%`, height: `${sizePercent}%`, viewBox: "0 0 24 24" }
    switch (preset) {
        case "compass":
            return (
                <svg {...common} fill="none">
                    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
                    <path d="M12 7L14.2 12L12 17L9.8 12Z" fill={color} />
                </svg>
            )
        case "target":
            return (
                <svg {...common} fill="none">
                    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="5.2" stroke={color} strokeWidth={1.5} />
                    <circle cx="12" cy="12" r="1.8" fill={color} />
                </svg>
            )
        case "layers":
            return (
                <svg {...common} fill="none">
                    <polygon points="12,3 21,8 12,13 3,8" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
                    <polyline points="3,13 12,18 21,13" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="3,17.5 12,22 21,17.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        case "rocket":
            return (
                <svg {...common} fill="none">
                    <path
                        d="M12 2C9 5 7 9 7 13C7 15 8 16 9 17L12 20L15 17C16 16 17 15 17 13C17 9 15 5 12 2Z"
                        stroke={color}
                        strokeWidth={1.5}
                        strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10.5" r="1.6" stroke={color} strokeWidth={1.4} />
                    <path d="M7 14.5C5.5 15.5 5 17 5 20C7.5 20 9 19 10 17.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
                    <path d="M17 14.5C18.5 15.5 19 17 19 20C16.5 20 15 19 14 17.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
                </svg>
            )
        case "spark":
        default:
            return (
                <svg {...common} fill="none">
                    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" fill={color} />
                </svg>
            )
    }
}

export default function ApproachCard({
    stepNumber = "01",
    showNumeral = true,
    title = "Discover",
    frontNote = "Understand the real problem",
    backBody = "We start by understanding the business, the users, the market, and the real constraints at play — before touching a single pixel.",

    visualType = "media",
    coverImage,
    mediaImageUrl = "",
    iconPreset = "spark",
    customIconFile,
    iconColor = "#6857D9",
    iconSizePercent = 38,

    revealOnScroll = true,
    revealDelayMs = 0,

    theme = "system",
    accent = "#6857D9",
    bgLight = "#FFFFFF",
    titleLight = "#0F0F0F",
    frontNoteLight = "#8A8782",
    borderLight = "#E8E6E3",
    backBgLight = "#F7F5F2",
    backTitleLight = "#0F0F0F",
    backBodyLight = "#5B5852",

    cardHeight = 270,
    minCardHeight = 200,
    maxCardHeight = 360,
    radius = 16,
}: Props) {
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const tiltRef = React.useRef<HTMLDivElement>(null)
    // Framer's automated Marketplace review checks for exactly this: any code
    // component that runs animations/continuous effects without checking
    // whether it's rendering in a static context (Canvas thumbnail or Export).
    // useIsStaticRenderer() is the official hook for that — true on Canvas and
    // during Export, false in Preview/live.
    const isStatic = useIsStaticRenderer()
    const scheme = useScheme(theme, wrapRef, isStatic)
    const isDark = scheme === "dark"
    const reduceMotion = usePrefersReducedMotion()
    const revealed = useInViewOnce(revealOnScroll, isStatic, wrapRef)

    const [hovered, setHovered] = React.useState(false)
    const [flipped, setFlipped] = React.useState(false)
    const [tilt, setTilt] = React.useState({ x: 0, y: 0 })

    const palette = isDark
        ? {
              bg: NIGHT.bg,
              title: NIGHT.title,
              frontNote: NIGHT.frontNote,
              border: NIGHT.border,
              mediaFallback: NIGHT.mediaFallback,
              backBg: NIGHT.backBg,
              backTitle: NIGHT.backTitle,
              backBody: NIGHT.backBody,
          }
        : {
              bg: bgLight,
              title: titleLight,
              frontNote: frontNoteLight,
              border: borderLight,
              mediaFallback: "#F2F0ED",
              backBg: backBgLight,
              backTitle: backTitleLight,
              backBody: backBodyLight,
          }

    const toggleFlip = () => {
        setTilt({ x: 0, y: 0 })
        setFlipped((f) => !f)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (reduceMotion || flipped) return
        const el = tiltRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        setTilt({ x: py * -7, y: px * 7 })
    }

    const handleLeave = () => {
        setHovered(false)
        setTilt({ x: 0, y: 0 })
    }

    const iconTileBg = toRGBA(accent, isDark ? 0.18 : 0.1)

    // Hard floor the height ceiling can taper down to on genuinely narrow (phone) screens —
    // capped at 180px regardless of the buyer's own Min Height slider, so a demo/instance left
    // at a taller Min Height (e.g. 200) still gets a properly compact card on a phone instead of
    // inheriting excess scroll length. Never raises the floor above what the buyer set, only ever
    // lowers it, and (per the clamp's own vw math) never engages at real desktop widths at all.
    const mobileHeightFloor = Math.min(minCardHeight, 180)

    // Only a plain still image is supported as cover media (no video/GIF media type — removed
    // deliberately to keep this component provably motion-free for Marketplace review, same
    // reasoning as the ThinkTank showcase-card component). A buyer could still pick an actual
    // animated .gif through either image field (upload or paste-URL), so this is checked by file
    // extension and frozen to a plain placeholder whenever isStatic is true (Canvas/Export) —
    // the only way to guarantee zero motion there, since a GIF's animation can't be paused via
    // React/JS the way <video> can.
    const mediaSrc = coverImage?.src || mediaImageUrl
    const mediaSrcIsGif = mediaSrc ? mediaSrc.toLowerCase().endsWith(".gif") : false

    return (
        <div
            ref={wrapRef}
            style={{
                width: "100%",
                minWidth: 220,
                // Height is derived from whatever width the parent layout gives this card
                // (aspectRatio), not hardcoded — so the card stretches/shrinks fluidly with
                // its container instead of staying a rigid box. minHeight/maxHeight keep it
                // from ever looking too squat or too tall at extreme widths.
                aspectRatio: REFERENCE_WIDTH / cardHeight,
                minHeight: minCardHeight,
                // The max-height ceiling itself is viewport-aware (not a flat number), using a
                // vw-based preferred value inside clamp(). At real desktop widths the vw term is
                // always far above maxCardHeight so this saturates to exactly maxCardHeight — i.e.
                // pixel-identical to before, zero effect on Desktop. Only once the browser narrows
                // into tablet/phone territory does the vw term drop below maxCardHeight and start
                // tightening the ceiling — down to mobileHeightFloor at phone widths — so cards get
                // visibly more compact (less scroll) purely from real screen size, independent of
                // whatever cardHeight/maxCardHeight values a given instance happens to carry.
                maxHeight: `clamp(${mobileHeightFloor}px, 46vw, ${maxCardHeight}px)`,
                perspective: 1400,
                fontFamily: "Inter, sans-serif",
                opacity: reduceMotion ? 1 : revealed ? 1 : 0,
                transform: reduceMotion ? "none" : revealed ? "translateY(0px)" : "translateY(26px)",
                transition: reduceMotion
                    ? "none"
                    : `opacity 0.6s ease ${revealDelayMs}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${revealDelayMs}ms`,
            }}
        >
            {/* Tilt layer — fast, independent of the flip transition */}
            <div
                ref={tiltRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={handleLeave}
                style={{
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                    transition: "transform 0.25s ease-out",
                }}
            >
                {/* Flip layer — slow, deliberate */}
                <div
                    role="button"
                    aria-pressed={flipped}
                    aria-label={`${title} — press to ${flipped ? "show front" : "show more"}`}
                    tabIndex={0}
                    onClick={toggleFlip}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            toggleFlip()
                        }
                    }}
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        cursor: "pointer",
                        outline: "none",
                        transformStyle: "preserve-3d",
                        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        transition: "transform 0.65s cubic-bezier(0.4, 0.1, 0.2, 1)",
                    }}
                >
                    {/* FRONT */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            borderRadius: radius,
                            overflow: "hidden",
                            border: `1px solid ${palette.border}`,
                            backgroundColor: palette.bg,
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: hovered && !flipped ? hoverGlow(accent, isDark) : "none",
                            transform: hovered && !flipped ? "translateY(-4px)" : "translateY(0px)",
                            transition: "box-shadow 0.3s ease, transform 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                flex: 1,
                                position: "relative",
                                overflow: "hidden",
                                display: visualType === "icon" ? "flex" : undefined,
                                alignItems: visualType === "icon" ? "center" : undefined,
                                justifyContent: visualType === "icon" ? "center" : undefined,
                                backgroundColor: visualType === "icon" ? iconTileBg : undefined,
                            }}
                        >
                            {visualType === "media" ? (
                                mediaSrc ? (
                                    mediaSrcIsGif && isStatic ? (
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: palette.mediaFallback }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: isDark ? "#4A4A4A" : "#C7C4BF" }}>
                                                GIF Preview
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={mediaSrc}
                                                alt={coverImage?.alt || title}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    filter: "grayscale(0.4) saturate(1.15) contrast(1.05) brightness(0.98)",
                                                    transform: hovered ? "scale(1.045)" : "scale(1)",
                                                    transition: "transform 0.6s ease",
                                                }}
                                            />
                                            <MediaTreatment accent={accent} isDark={isDark} />
                                        </>
                                    )
                                ) : (
                                    <>
                                        <DynamicCurveArt accent={accent} isDark={isDark} seed={`${title}-${stepNumber}`} />
                                        <MediaTreatment accent={accent} isDark={isDark} />
                                    </>
                                )
                            ) : iconPreset === "custom" ? (
                                // Custom-uploaded icons are rendered ONLY via a plain <img> — never parsed or
                                // injected as inline markup. This is Framer's own first-choice recommendation
                                // ("render custom SVGs using an <img> element where possible") and it removes
                                // the entire raw-SVG-injection surface rather than trying to sanitize it: an
                                // <img src="..."> can never execute a script, event handler, or external
                                // reference embedded in the file, regardless of what the buyer uploads. The
                                // one trade-off is the Icon Color control can't recolor a rasterized/opaque
                                // <img> the way it can the built-in vector presets below — so it's hidden
                                // automatically whenever Custom SVG is selected (see iconColor's `hidden`
                                // control below).
                                customIconFile ? (
                                    <img
                                        src={customIconFile}
                                        alt="Custom icon"
                                        style={{ width: `${iconSizePercent}%`, height: `${iconSizePercent}%`, objectFit: "contain" }}
                                    />
                                ) : (
                                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: isDark ? "#4A4A4A" : "#C7C4BF" }}>
                                        Upload SVG
                                    </span>
                                )
                            ) : (
                                <PresetIcon preset={iconPreset} color={iconColor} sizePercent={iconSizePercent} />
                            )}

                            {/* Step number badge — compact circle, top-left, same size as the flip button. Optional. */}
                            {showNumeral && stepNumber ? (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: 12,
                                        left: 12,
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        backgroundColor: "rgba(0,0,0,0.38)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#fff",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}
                                >
                                    {stepNumber}
                                </span>
                            ) : null}

                            {/* Flip affordance — dim at rest, full on hover, same spot on both faces */}
                            <span
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    right: 12,
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(0,0,0,0.38)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: hovered ? 1 : 0.5,
                                    transform: hovered ? "scale(1.08)" : "scale(1)",
                                    transition: "opacity 0.2s ease, transform 0.2s ease",
                                }}
                            >
                                <FlipIcon color="#fff" />
                            </span>
                        </div>
                        <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                            <span
                                style={{
                                    fontSize: 16, fontWeight: 700, color: palette.title,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}
                            >
                                {title}
                            </span>
                            <span
                                style={{
                                    fontSize: 12.5, color: palette.frontNote, lineHeight: 1.5,
                                    // minHeight reserves space for a full 2 lines (1.5 line-height × 2) even
                                    // when the note only wraps to 1 line, so every card in a row ends up the
                                    // same height regardless of how long its note text happens to be.
                                    minHeight: "3em",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {frontNote}
                            </span>
                        </div>
                    </div>

                    {/* BACK — now correctly derived from the same scheme as the front */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: hovered && flipped ? "rotateY(180deg) translateY(-4px)" : "rotateY(180deg) translateY(0px)",
                            borderRadius: radius,
                            overflow: "hidden",
                            border: `1px solid ${palette.border}`,
                            backgroundColor: palette.backBg,
                            backgroundImage: `radial-gradient(120% 120% at 100% 0%, ${toRGBA(accent, isDark ? 0.12 : 0.07)}, transparent 60%)`,
                            padding: "22px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxShadow: hovered && flipped ? hoverGlow(accent, isDark) : "none",
                            transition: "box-shadow 0.3s ease, transform 0.3s ease",
                        }}
                    >
                        {showNumeral && stepNumber ? (
                            <span
                                style={{
                                    position: "absolute",
                                    top: 12,
                                    left: 12,
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    backgroundColor: toRGBA(accent, isDark ? 0.2 : 0.14),
                                    boxShadow: `inset 0 0 0 1px ${toRGBA(accent, isDark ? 0.3 : 0.28)}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: accent,
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                            >
                                {stepNumber}
                            </span>
                        ) : null}
                        {/* marginTop clears the step-number badge above so the title never renders underneath it */}
                        <div
                            style={{
                                display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
                                marginTop: showNumeral && stepNumber ? 30 : 0,
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 16, fontWeight: 700, color: palette.backTitle,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}
                            >
                                {title}
                            </span>
                            <p
                                style={{
                                    margin: 0, fontSize: 13, lineHeight: 1.65, color: palette.backBody,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 6,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                }}
                            >
                                {backBody}
                            </p>
                        </div>
                        <span
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                backgroundColor: toRGBA(accent, isDark ? 0.2 : 0.14),
                                boxShadow: `inset 0 0 0 1px ${toRGBA(accent, isDark ? 0.3 : 0.28)}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: hovered ? 1 : 0.7,
                                transform: hovered ? "scale(1.08)" : "scale(1)",
                                transition: "opacity 0.2s ease, transform 0.2s ease",
                            }}
                        >
                            <FlipIcon color={accent} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(ApproachCard, {
    stepNumber: { type: ControlType.String, title: "Step Number", defaultValue: "01" },
    showNumeral: { type: ControlType.Boolean, title: "Show Step Number", defaultValue: true },
    title: { type: ControlType.String, title: "Title", defaultValue: "Discover" },
    frontNote: { type: ControlType.String, title: "Front Note", defaultValue: "Understand the real problem" },
    backBody: {
        type: ControlType.String, title: "Back Text", displayTextArea: true,
        defaultValue: "We start by understanding the business, the users, the market, and the real constraints at play — before touching a single pixel.",
    },

    visualType: {
        type: ControlType.Enum, title: "Visual Type",
        options: ["media", "icon"], optionTitles: ["Media", "Icon / Vector"],
        defaultValue: "media",
    },
    coverImage: {
        type: ControlType.ResponsiveImage, title: "Cover Image",
        hidden: (p) => p.visualType !== "media",
    },
    mediaImageUrl: {
        type: ControlType.String, title: "Or Paste Image URL", defaultValue: "",
        hidden: (p) => p.visualType !== "media",
    },
    iconPreset: {
        type: ControlType.Enum, title: "Icon",
        options: ["spark", "compass", "target", "layers", "rocket", "custom"],
        optionTitles: ["Spark", "Compass", "Target", "Layers", "Rocket", "Custom SVG"],
        defaultValue: "spark",
        hidden: (p) => p.visualType !== "icon",
    },
    customIconFile: {
        type: ControlType.File, title: "Upload SVG", allowedFileTypes: ["svg"],
        hidden: (p) => p.visualType !== "icon" || p.iconPreset !== "custom",
    },
    iconColor: {
        type: ControlType.Color, title: "Icon Color", defaultValue: "#6857D9",
        // Only applies to the built-in vector presets, which are hardcoded React SVG (safe to
        // recolor directly). A custom-uploaded icon renders as a plain <img> now (see the render
        // branch above), so recoloring it isn't possible — the control is hidden in that case
        // rather than left visible and silently doing nothing.
        hidden: (p) => p.visualType !== "icon" || p.iconPreset === "custom",
    },
    iconSizePercent: {
        type: ControlType.Number, title: "Icon Size", min: 20, max: 70, step: 1, defaultValue: 38,
        hidden: (p) => p.visualType !== "icon",
    },

    revealOnScroll: { type: ControlType.Boolean, title: "Reveal on Scroll", defaultValue: true },
    revealDelayMs: {
        type: ControlType.Number, title: "Reveal Delay (ms)", min: 0, max: 600, step: 10, defaultValue: 0,
        hidden: (p) => !p.revealOnScroll,
    },

    theme: {
        type: ControlType.Enum, title: "Theme",
        options: ["system", "light", "dark"], optionTitles: ["System (Auto)", "Light", "Dark"],
        defaultValue: "system",
    },
    accent: { type: ControlType.Color, title: "Accent Color", defaultValue: "#6857D9" },
    bgLight: { type: ControlType.Color, title: "Card BG", defaultValue: "#FFFFFF" },
    titleLight: { type: ControlType.Color, title: "Title", defaultValue: "#0F0F0F" },
    frontNoteLight: { type: ControlType.Color, title: "Front Note", defaultValue: "#8A8782" },
    borderLight: { type: ControlType.Color, title: "Border", defaultValue: "#E8E6E3" },
    backBgLight: { type: ControlType.Color, title: "Back BG", defaultValue: "#F7F5F2" },
    backTitleLight: { type: ControlType.Color, title: "Back Title", defaultValue: "#0F0F0F" },
    backBodyLight: { type: ControlType.Color, title: "Back Body", defaultValue: "#5B5852" },

    cardHeight: { type: ControlType.Number, title: "Card Height", min: 180, max: 600, step: 10, defaultValue: 270 },
    minCardHeight: { type: ControlType.Number, title: "Min Height", min: 150, max: 400, step: 10, defaultValue: 200 },
    maxCardHeight: { type: ControlType.Number, title: "Max Height", min: 250, max: 700, step: 10, defaultValue: 360 },
    radius: { type: ControlType.Number, title: "Card Radius", min: 0, max: 40, defaultValue: 16 },
})
