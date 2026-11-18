// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 1200
// @framerIntrinsicHeight: 800

/**
 * Kern_CornerProjectScroller — Framer Marketplace code component
 * Version: 7.4.6
 *
 * Scroll-pinned corner project showcase: hero handoff (slide-left / corner-morph),
 * caption band with blur+scrim, optional custom cursor. Preview corner fixed bottom-right.
 *
 * Single-file seams:
 * - MotionPolicy at root (canvas guard + reduced motion)
 * - readScrollSegment() — hold/handoff playhead
 * - CaptionOverlayShell — blur/scrim overlay adapter
 * - getSpring() — scrub, caption, cursor track/opacity
 *
 * Buyer panels: Projects, Layout, Scroll, Caption, Caption type, Motion, Interaction, Accessibility
 *
 * Thermo waiver (>1000 lines): Framer Marketplace requires a single buyer-facing .tsx;
 * decomposition lives in named in-file seams (section banners), not sibling modules.
 */

// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    motion,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type MutableRefObject,
    type ReactNode,
    type RefObject,
} from "react"

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

// ─── Types ───────────────────────────────────────────────────────────────────

type CornerHandoff = "slideLeft" | "cornerMorph"
type MotionFeel = "calm" | "standard" | "snappy" | "custom"
type HandoffEase =
    | "soft"
    | "standard"
    | "sharp"
    | "power2InOut"
    | "expoOut"
    | "quartInOut"
    | "editorial"
type HandoffEaseBuyer = "soft" | "standard" | "sharp" | "dramatic"
type InteractionPreset = "off" | "minimal" | "full"

interface ScrollerItem {
    id: string
    image: string
    title: string
    year: string
    category: string
    href?: string
    meta?: { label?: string }
}

interface ProjectItemFields {
    title: string
    year: string
    category: string
    image: string
    href?: string
    /** Optional center caption line (replaces year when set). */
    label?: string
}

/** @deprecated Nested item shape from pre-6.12 — normalized at read time. */
interface LegacyNestedProjectItem {
    content?: { title?: string; year?: string; category?: string }
    media?: { image?: unknown }
    link?: { href?: string }
    metadata?: {
        title?: string
        year?: string
        category?: string
        label?: string
    }
}

type ProjectItemInput = ProjectItemFields & Partial<LegacyNestedProjectItem>

interface ProjectsGroup {
    items: ProjectItemFields[]
}

interface ScrollGroup {
    handoff: CornerHandoff
    lengthPerItem: number
    /** Share of each item's scroll where main stays full-width before handoff. */
    holdFraction: number
    handoffEase?: HandoffEaseBuyer | HandoffEase
}

interface MotionPolicy {
    prefersReduced: boolean
    isCanvas: boolean
}

interface MotionGroup {
    feel: MotionFeel
    smoothness?: number
    captionSpeed?: number
    entrance?: "none" | "tilt" | "fold"
}

interface LayoutGroup {
    activeInset: number
    /** Hero share of inner stage (remainder = thumbnail). */
    heroShare: number
    backgroundColor: string
}

/** @deprecated Use `layout.backgroundColor`. */
interface StageGroup {
    backgroundColor: string
}

interface MetadataElementStyle {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    fontOpticalSizing?: "auto" | "none"
    fontVariationSettings?: string
    textAlign?: "left" | "center" | "right"
    textTransform?: "uppercase" | "none" | "lowercase" | "capitalize"
    fontStyle?: "normal" | "italic"
    textDecoration?: "none" | "underline" | "line-through"
}

/** Caption placement + spacing. Overlay legibility is fixed in CAPTION_OVERLAY. */
interface CaptionGroup {
    show: boolean
    showYear: boolean
    showCategory: boolean
    paddingTop: number
    paddingBottom: number
    /** Extra horizontal inset from stage padding (inside overlay). */
    captionInset?: number
    accentColor?: string
}

interface TypographyGroup {
    fontSize: number
    typeScale?: number
    color: string
    captionFont?: MetadataElementStyle
    /** @deprecated Use `captionFont`. */
    titleFont?: MetadataElementStyle
    /** @deprecated Use `captionFont`. */
    metadataFont?: MetadataElementStyle
}

interface InteractionGroup {
    preset?: InteractionPreset
    cursorLabel?: string
    focusRing?: boolean
    customCursor: boolean
    cursorColor: string
    cursorTextColor: string
    cursorSize: number
    focusRingEnabled: boolean
    focusRingColor: string
    focusRingWidth: number
    focusRingOffset: number
}

/** Fixed overlay legibility: long soft scrim + frosted blur with gradient mask. */
const CAPTION_OVERLAY = {
    // Warmer off-black base for softer, more editorial feel
    scrimColor: "#1a1714",
    // Reduced peak opacity for subtler top presence (~0.35 vs 0.52)
    peakOpacity: 0.35,
    // Mid-tones pushed further down the band with more granular stops
    highMidOpacity: 0.20,
    midOpacity: 0.10,
    lightOpacity: 0.05,
    veryLightOpacity: 0.02,
    whisperOpacity: 0.005,
    backdropBlurPx: 18,
    /** Extra padding below text row inside the overlay band. */
    bandExtensionPx: 100,
    blendMode: "difference" as const,
    shadowY: 1,
    shadowBlur: 8,
    shadowOpacity: 0.5,
    /** Mask gradient stops for the blur layer - strongest under text, fading to zero over ~90% of band. */
    maskStop1: 0.12, // 100% opacity - at text
    maskStop2: 0.22, // 75% opacity
    maskStop3: 0.32, // 50% opacity
    maskStop4: 0.45, // 28% opacity
    maskStop5: 0.58, // 12% opacity
    maskStop6: 0.72, // 4% opacity
    maskTransparent: 0.88,
    frameColor: "#2A1F18",
    frameOpacity: 0.18,
    captionGap: 28,
    /** Shared caption row metrics — keeps title/year/category on one optical line. */
    rowLineHeight: 1.12,
    textShadow: true,
} as const

/** Fixed per-image polish — baked into the image layer. */
const IMAGE_POLISH = {
    radius: 0,
    saturation: 1.06,
    contrast: 1.04,
    shadowStrength: 0.22,
} as const

/** Hero top offset: no gap when caption overlays the image (metadataBarH === 0). */
function stageHeroTop(metadataBarH: number): number {
    return metadataBarH > 0 ? metadataBarH + 8 : 0
}

function stageHeroTopGap(metadataBarH: number): number {
    return metadataBarH > 0 ? 8 : 0
}

interface AccessibilityGroup {
    ariaLabel: string
}

export interface KernCornerProjectScrollerProps {
    projects?: Partial<ProjectsGroup>
    scroll?: Partial<ScrollGroup>
    motion?: Partial<MotionGroup>
    layout?: Partial<LayoutGroup>
    /** @deprecated Use `layout.backgroundColor`. */
    stage?: Partial<StageGroup>
    /** @deprecated Use `caption`. */
    metadata?: Partial<CaptionGroup>
    caption?: Partial<CaptionGroup>
    typography?: Partial<TypographyGroup>
    interaction?: Partial<InteractionGroup>
    accessibility?: Partial<AccessibilityGroup>
    style?: CSSProperties
}

interface ResolvedConfig {
    items: ScrollerItem[]
    scrollLengthPerItem: number
    holdFraction: number
    cornerHandoff: CornerHandoff
    captionSpring: SpringConfig
    scrubSpring: SpringConfig
    showMetadata: boolean
    backgroundColor: string
    activeInset: number
    heroShare: number
    metadataColor: string
    accentColor: string
    fontSize: number
    fontSizeTablet: number
    fontSizeMobile: number
    fontWeight: number
    letterSpacing: number
    lineHeight: number
    paddingTop: number
    paddingBottom: number
    textTransform: "uppercase" | "none"
    showYear: boolean
    showCategory: boolean
    captionInset: number
    captionFont?: MetadataElementStyle
    ariaLabel: string
    incomingEntrance: "none" | "tilt" | "fold"
    style?: CSSProperties
    interaction: InteractionGroup
    handoffEaseFn: (t: number) => number
}

interface Rect {
    left: number
    top: number
    width: number
    height: number
    opacity: number
}

interface SlideFrame {
    x: number
    y: number
    scale: number
    opacity: number
    rotateX: number
    rotateY: number
    transformOrigin: string
}

interface StageLayout {
    stageW: number
    stageH: number
    heroShare: number
    baseW: number
    baseH: number
}

interface SpringConfig {
    stiffness: number
    damping: number
    mass: number
    restDelta?: number
    restSpeed?: number
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

/** Scroll scrub — snappy flow, uniform segment response. */
const SCRUB_FLOW: SpringConfig = {
    stiffness: 56,
    damping: 28,
    mass: 1.05,
    restDelta: 0.0005,
    restSpeed: 0.005,
}

const SPRING_BASE: Record<
    MotionFeel,
    { caption: SpringConfig; scrub: SpringConfig }
> = {
    calm: {
        caption: { stiffness: 48, damping: 24, mass: 1.3 },
        scrub: {
            stiffness: 38,
            damping: 22,
            mass: 1.2,
            restDelta: 0.0004,
            restSpeed: 0.004,
        },
    },
    standard: {
        caption: { stiffness: 64, damping: 20, mass: 1.08 },
        scrub: SCRUB_FLOW,
    },
    snappy: {
        caption: { stiffness: 96, damping: 17, mass: 0.92 },
        scrub: {
            stiffness: 78,
            damping: 26,
            mass: 0.82,
            restDelta: 0.0008,
            restSpeed: 0.01,
        },
    },
    custom: {
        caption: { stiffness: 64, damping: 20, mass: 1.08 },
        scrub: SCRUB_FLOW,
    },
}

const SPRING_CURSOR: Record<"opacity" | "track" | "trackReduced", SpringConfig> = {
    opacity: { stiffness: 220, damping: 32, mass: 0.7 },
    track: { stiffness: 520, damping: 42, mass: 0.12 },
    trackReduced: { stiffness: 2000, damping: 120, mass: 0.01 },
}

const CURSOR_GLASS = {
    blurPx: 14,
    fillOpacity: 0.44,
    rimOpacity: 0.38,
    innerHighlight: "rgba(255,255,255,0.2)",
    saturate: 1.1,
} as const

function cursorGlassSurfaceStyle(
    fillColor: string,
    rimColor: string
): CSSProperties {
    const fill = `color-mix(in srgb, ${fillColor} ${Math.round(CURSOR_GLASS.fillOpacity * 100)}%, transparent)`
    const rim = `color-mix(in srgb, ${rimColor} ${Math.round(CURSOR_GLASS.rimOpacity * 100)}%, transparent)`
    const blur = `blur(${CURSOR_GLASS.blurPx}px) saturate(${CURSOR_GLASS.saturate})`
    return {
        background: fill,
        backdropFilter: blur,
        WebkitBackdropFilter: blur,
        border: `1px solid ${rim}`,
        boxShadow: `inset 0 1px 0 ${CURSOR_GLASS.innerHighlight}, 0 10px 28px color-mix(in srgb, ${fillColor} 22%, transparent)`,
    }
}

const ENTRANCE_TILT_ANGLE = 22
const ENTRANCE_FOLD_ANGLE = 28
const ENTRANCE_PERSPECTIVE = 1200
const ENTRANCE_INTENSITY = 80

const CAPTION_TYPO = {
    fontWeight: 500,
    letterSpacing: 0.12,
    lineHeight: 1.12,
    textTransform: "uppercase" as const,
}

const DEFAULT_ITEM_FIELDS: ProjectItemFields[] = [
    {
        title: "Vantage House",
        year: "2024",
        category: "Residential Architecture",
        image: "https://framerusercontent.com/images/hFgDQHaLRuU3crfEWhJ6w1lBuc.jpg",
        href: "https://framer.link/builtbykern",
    },
    {
        title: "Kōji Temple Annex",
        year: "2018",
        category: "Sacred Architecture",
        image: "https://framerusercontent.com/images/LwcWbOSuIPZaVmEykKf7xMRRPQ.png",
        href: "https://framer.link/builtbykern",
    },
    {
        title: "North Dock Lofts",
        year: "2022",
        category: "Industrial Adaptive Reuse",
        image: "https://framerusercontent.com/images/wKtslO8LVuU1kAVnt4CMRNFMtQ.png",
        href: "https://framer.link/builtbykern",
    },
    {
        title: "Aurora Thermal Spa",
        year: "2025",
        category: "Wellness Hospitality",
        image: "https://framerusercontent.com/images/PYWGNCQwe9ncyzqetMmUyZ8SXi4.png",
        href: "https://framer.link/builtbykern",
    },
    {
        title: "Linea Office Tower",
        year: "2020",
        category: "Commercial Workplace",
        image: "https://framerusercontent.com/images/DEknLQvJq6nyvS5bVfYainCSw.png",
        href: "https://framer.link/builtbykern",
    },
    {
        title: "Parallel Cinema",
        year: "2016",
        category: "Cultural Exhibition",
        image: "https://framerusercontent.com/images/KbKHAwRmH4iCM3ifKrRaMJO8pb4.png",
        href: "https://framer.link/builtbykern",
    },
]

const PROJECTS_DEFAULTS: ProjectsGroup = { items: DEFAULT_ITEM_FIELDS }
/** Global scroll runway modifier (all presets). */
const SCROLL_PACE_GLOBAL = 1

const SCROLL_DEFAULTS: ScrollGroup = {
    handoff: "cornerMorph",
    lengthPerItem: 170,
    holdFraction: 72,
    handoffEase: "standard",
}
const HANDOFF_EASE_OPTIONS: readonly HandoffEase[] = [
    "soft",
    "standard",
    "sharp",
    "power2InOut",
    "expoOut",
    "quartInOut",
    "editorial",
]

const MOTION_DEFAULTS: MotionGroup = {
    feel: "standard",
    smoothness: 0.58,
    captionSpeed: 1,
    entrance: "tilt",
}
const LAYOUT_DEFAULTS: LayoutGroup = {
    activeInset: 16,
    heroShare: 80,
    backgroundColor: "#F2ECE3",
}
const CAPTION_DEFAULTS: CaptionGroup = {
    show: true,
    paddingTop: 14,
    paddingBottom: 12,
    showYear: true,
    showCategory: true,
    captionInset: 0,
    accentColor: "#A86B42",
}

const TYPOGRAPHY_DEFAULTS: TypographyGroup = {
    fontSize: 16,
    typeScale: 1,
    color: "#F6F0E8",
    captionFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "0.12em",
        lineHeight: "1.12em",
        textTransform: "uppercase",
    },
}
const INTERACTION_DEFAULTS: InteractionGroup = {
    preset: "off",
    customCursor: false,
    cursorLabel: "View",
    cursorColor: "#A86B42",
    cursorTextColor: "#F6F0E8",
    cursorSize: 84,
    focusRingEnabled: true,
    focusRingColor: "rgba(255,255,255,0.85)",
    focusRingWidth: 2,
    focusRingOffset: 3,
}
const ACCESSIBILITY_DEFAULTS: AccessibilityGroup = {
    ariaLabel: "Project showcase",
}

// ─── Config resolver ───────────────────────────────────────────────────────────

function normalizeImageSrc(rawImage: unknown): string {
    if (typeof rawImage === "string") return rawImage
    if (rawImage && typeof rawImage === "object" && rawImage !== null && "src" in rawImage) {
        const srcValue = (rawImage as { src?: unknown }).src
        return typeof srcValue === "string" ? srcValue : ""
    }
    return ""
}

function isLegacyNestedProjectItem(raw: ProjectItemInput): boolean {
    return Boolean(raw.content || raw.media || raw.link || raw.metadata)
}

function normalizeProjectItem(raw: ProjectItemInput): ProjectItemFields {
    const hasFlatTitle =
        typeof raw.title === "string" && raw.title.trim().length > 0

    if (!hasFlatTitle && isLegacyNestedProjectItem(raw)) {
        const meta = raw.metadata
        const title =
            meta?.title?.trim() ||
            raw.title?.trim() ||
            raw.content?.title?.trim() ||
            "Project"
        const year =
            meta?.year?.trim() ||
            raw.year?.trim() ||
            raw.content?.year?.trim() ||
            "2024"
        const category =
            meta?.category?.trim() ||
            raw.category?.trim() ||
            raw.content?.category?.trim() ||
            "Web Design"
        const hrefRaw = raw.href ?? raw.link?.href ?? ""
        const href = typeof hrefRaw === "string" ? hrefRaw.trim() : ""
        const label = meta?.label?.trim() || raw.label?.trim()
        const image = normalizeImageSrc(raw.image ?? raw.media?.image)
        return {
            title,
            year,
            category,
            image,
            href: href.length > 0 ? href : undefined,
            label: label && label.length > 0 ? label : undefined,
        }
    }

    const href = raw.href?.trim()
    const label = raw.label?.trim()
    return {
        title: raw.title?.trim() || "Project",
        year: raw.year?.trim() || "2024",
        category: raw.category?.trim() || "Web Design",
        image: normalizeImageSrc(raw.image),
        href: href && href.length > 0 ? href : undefined,
        label: label && label.length > 0 ? label : undefined,
    }
}

function itemFromFields(raw: ProjectItemInput, index: number): ScrollerItem {
    const item = normalizeProjectItem(raw)

    return {
        id: `project-${index}`,
        image: item.image,
        title: item.title,
        year: item.year,
        category: item.category,
        href: item.href,
        meta: item.label ? { label: item.label } : undefined,
    }
}

function normalizeFeel(raw: MotionFeel | undefined): MotionFeel {
    if (raw === "calm" || raw === "standard" || raw === "snappy") return raw
    return MOTION_DEFAULTS.feel
}

function normalizeHandoffEase(
    raw: HandoffEaseBuyer | HandoffEase | undefined
): HandoffEase {
    if (!raw) return "power2InOut"
    if (raw === "soft") return "soft"
    if (raw === "standard") return "power2InOut"
    if (raw === "sharp") return "sharp"
    if (raw === "dramatic" || raw === "editorial") return "editorial"
    if (HANDOFF_EASE_OPTIONS.includes(raw)) return raw
    return "power2InOut"
}

function normalizeInteractionPreset(
    raw: InteractionPreset | "editorial" | undefined
): InteractionPreset {
    if (raw === "editorial") return "full"
    if (raw === "off" || raw === "minimal" || raw === "full") return raw
    return INTERACTION_DEFAULTS.preset ?? "off"
}

function resolveInteraction(
    input: Partial<InteractionGroup>,
    accentColor: string
): InteractionGroup {
    const preset = normalizeInteractionPreset(
        input.preset as InteractionPreset | "editorial" | undefined
    )
    const legacyCustom = input.customCursor
    const focusRingOn = input.focusRing ?? input.focusRingEnabled ?? true

    if (preset === "minimal") {
        return {
            preset: "minimal",
            cursorLabel: input.cursorLabel ?? INTERACTION_DEFAULTS.cursorLabel,
            focusRing: focusRingOn,
            customCursor: true,
            cursorColor: accentColor,
            cursorTextColor: INTERACTION_DEFAULTS.cursorTextColor,
            cursorSize: 64,
            focusRingEnabled: focusRingOn,
            focusRingColor: INTERACTION_DEFAULTS.focusRingColor,
            focusRingWidth: INTERACTION_DEFAULTS.focusRingWidth,
            focusRingOffset: INTERACTION_DEFAULTS.focusRingOffset,
        }
    }

    if (preset === "full") {
        return {
            preset: "full",
            cursorLabel: input.cursorLabel ?? INTERACTION_DEFAULTS.cursorLabel,
            focusRing: focusRingOn,
            customCursor: true,
            cursorColor: accentColor,
            cursorTextColor: INTERACTION_DEFAULTS.cursorTextColor,
            cursorSize: 84,
            focusRingEnabled: focusRingOn,
            focusRingColor: INTERACTION_DEFAULTS.focusRingColor,
            focusRingWidth: INTERACTION_DEFAULTS.focusRingWidth,
            focusRingOffset: INTERACTION_DEFAULTS.focusRingOffset,
        }
    }

    if (legacyCustom === true) {
        return {
            preset: "off",
            ...INTERACTION_DEFAULTS,
            ...input,
            customCursor: true,
            focusRingEnabled:
                input.focusRingEnabled ?? input.focusRing ?? true,
        }
    }

    return {
        preset: "off",
        ...INTERACTION_DEFAULTS,
        cursorLabel: input.cursorLabel ?? INTERACTION_DEFAULTS.cursorLabel,
        focusRing: focusRingOn,
        focusRingEnabled: focusRingOn,
        customCursor: false,
    }
}

type MotionLegacy = Partial<MotionGroup> & {
    handoffEase?: HandoffEase
    incomingEntrance?: "none" | "tilt" | "fold"
}

type TypographyLegacy = Partial<TypographyGroup> & {
    fontSizeTablet?: number
    fontSizeMobile?: number
    fontWeight?: number
    letterSpacing?: number
    lineHeight?: number
    textTransform?: "uppercase" | "none"
    rowFont?: MetadataElementStyle
    trackingRefinement?: number
    color?: string
}

function legacyTypographyColor(
    props: Partial<KernCornerProjectScrollerProps>
): Partial<TypographyGroup> {
    const legacy = { ...props.metadata, ...props.caption }
    if (typeof legacy.color === "string") return { color: legacy.color }
    return {}
}

function resolveConfig(
    props: Partial<KernCornerProjectScrollerProps>
): ResolvedConfig {
    const projects = { ...PROJECTS_DEFAULTS, ...props.projects }
    const scroll = { ...SCROLL_DEFAULTS, ...props.scroll }
    const motionRaw = props.motion as MotionLegacy | undefined
    const motion = { ...MOTION_DEFAULTS, ...motionRaw }
    const layout = {
        ...LAYOUT_DEFAULTS,
        ...props.layout,
        backgroundColor:
            props.layout?.backgroundColor ??
            props.stage?.backgroundColor ??
            LAYOUT_DEFAULTS.backgroundColor,
    }
    const caption = {
        ...CAPTION_DEFAULTS,
        ...props.metadata,
        ...props.caption,
    }
    const typographyRaw = {
        ...TYPOGRAPHY_DEFAULTS,
        ...legacyTypographyColor(props),
        ...props.typography,
    } as TypographyLegacy
    const typography: TypographyGroup = {
        fontSize: typographyRaw.fontSize ?? TYPOGRAPHY_DEFAULTS.fontSize,
        typeScale: typographyRaw.typeScale ?? TYPOGRAPHY_DEFAULTS.typeScale,
        color: typographyRaw.color ?? TYPOGRAPHY_DEFAULTS.color,
        captionFont:
            typographyRaw.captionFont ??
            typographyRaw.titleFont ??
            typographyRaw.metadataFont ??
            TYPOGRAPHY_DEFAULTS.captionFont,
    }
    const legacyStageAccent = (
        props.stage as { accentColor?: string } | undefined
    )?.accentColor
    const accentColor =
        caption.accentColor ??
        legacyStageAccent ??
        CAPTION_DEFAULTS.accentColor ??
        "#A86B42"
    const interaction = resolveInteraction(props.interaction ?? {}, accentColor)
    const accessibility = { ...ACCESSIBILITY_DEFAULTS, ...props.accessibility }
    const sourceItems =
        projects.items.length > 0 ? projects.items : PROJECTS_DEFAULTS.items
    const feel = normalizeFeel(motion.feel)
    const smoothness = clampRange(
        motion.smoothness ?? MOTION_DEFAULTS.smoothness ?? 0.68,
        0,
        1
    )
    const captionSpeed = clampRange(motion.captionSpeed ?? 1, 0.5, 2)

    const handoffEase =
        scroll.handoffEase ??
        motionRaw?.handoffEase ??
        SCROLL_DEFAULTS.handoffEase
    const handoffEaseNorm = normalizeHandoffEase(handoffEase)
    const scrollPace = handoffScrollPaceMultiplier(handoffEaseNorm)
    const smoothnessFloor =
        handoffEaseNorm === "editorial"
            ? 0.72
            : handoffEaseNorm === "sharp" || handoffEaseNorm === "quartInOut"
              ? 0.54
              : 0.58
    const effectiveSmoothness = clampRange(
        Math.max(smoothness, smoothnessFloor),
        0,
        1
    )
    const scrubSpring = getSpring("scrub", feel, {
        smoothness: effectiveSmoothness,
    })
    const captionSpring = getSpring("caption", feel, { captionSpeed })

    const typeScale = clampRange(typography.typeScale ?? 1, 0.85, 1.15)
    const baseFont = typography.fontSize
    const fontSize = Math.round(baseFont * typeScale)
    const fontSizeTablet = Math.round(
        (typographyRaw.fontSizeTablet ?? baseFont * 0.6875) * typeScale
    )
    const fontSizeMobile = Math.round(
        (typographyRaw.fontSizeMobile ?? baseFont * 0.625) * typeScale
    )

    return {
        items: sourceItems.map(itemFromFields),
        scrollLengthPerItem:
            scroll.lengthPerItem * scrollPace * SCROLL_PACE_GLOBAL,
        holdFraction: clampHoldFraction(scroll.holdFraction),
        cornerHandoff:
            scroll.handoff === "slideLeft" ? "slideLeft" : "cornerMorph",
        captionSpring,
        scrubSpring,
        showMetadata: caption.show,
        backgroundColor: layout.backgroundColor,
        activeInset: layout.activeInset,
        heroShare: layout.heroShare,
        metadataColor: typography.color,
        accentColor,
        fontSize,
        fontSizeTablet,
        fontSizeMobile,
        fontWeight: typographyRaw.fontWeight ?? CAPTION_TYPO.fontWeight,
        letterSpacing:
            typographyRaw.letterSpacing ?? CAPTION_TYPO.letterSpacing,
        lineHeight: typographyRaw.lineHeight ?? CAPTION_TYPO.lineHeight,
        paddingTop: caption.paddingTop,
        paddingBottom: caption.paddingBottom,
        textTransform:
            typographyRaw.textTransform ?? CAPTION_TYPO.textTransform,
        showYear: caption.showYear,
        showCategory: caption.showCategory,
        captionInset: caption.captionInset ?? 0,
        captionFont: typography.captionFont,
        ariaLabel: accessibility.ariaLabel,
        incomingEntrance:
            motion.entrance ?? motionRaw?.incomingEntrance ?? "tilt",
        style: props.style,
        interaction,
        handoffEaseFn: makeHandoffEase(handoffEaseNorm),
    }
}

// ─── Scroll geometry (pure) ────────────────────────────────────────────────────

function clamp01(v: number): number {
    return Math.min(1, Math.max(0, v))
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function clampRange(value: number, min: number, max: number): number {
    if (!Number.isFinite(value)) return min
    return Math.min(max, Math.max(min, value))
}

type SpringRole = "scrub" | "caption" | "cursorOpacity" | "cursorTrack"

function scaleSpring(
    spring: SpringConfig,
    factors: { stiffness?: number; damping?: number; mass?: number }
): SpringConfig {
    return {
        ...spring,
        stiffness: clampRange(
            spring.stiffness * (factors.stiffness ?? 1),
            20,
            300
        ),
        damping: clampRange(spring.damping * (factors.damping ?? 1), 8, 60),
        mass: clampRange(spring.mass * (factors.mass ?? 1), 0.5, 2),
    }
}

function getSpring(
    role: SpringRole,
    feel: MotionFeel,
    modifiers?: {
        smoothness?: number
        captionSpeed?: number
        prefersReduced?: boolean
    }
): SpringConfig {
    const base = SPRING_BASE[feel] ?? SPRING_BASE.standard
    if (role === "cursorOpacity") return SPRING_CURSOR.opacity
    if (role === "cursorTrack") {
        return modifiers?.prefersReduced
            ? SPRING_CURSOR.trackReduced
            : SPRING_CURSOR.track
    }

    if (role === "caption") {
        const captionSpeed = modifiers?.captionSpeed ?? 1
        return scaleSpring(base.caption, {
            stiffness: captionSpeed,
            damping: 0.9 + captionSpeed * 0.2,
            mass: 1 / captionSpeed,
        })
    }

    const smoothness = modifiers?.smoothness ?? 0.5
    const smoothnessDelta = smoothness - 0.5
    const scrub = scaleSpring(base.scrub, {
        stiffness: 1 - smoothnessDelta * 0.9,
        damping: 1 + smoothnessDelta * 0.8,
        mass: 1 + smoothnessDelta * 0.5,
    })

    return scrub
}

/** GSAP power2.inOut — fix.studio scrub curve. */
function easePower2InOut(t: number): number {
    const x = clamp01(t)
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
}

function easePower2Out(t: number): number {
    const x = clamp01(t)
    return 1 - (1 - x) * (1 - x)
}

function easePower2In(t: number): number {
    const x = clamp01(t)
    return x * x
}

/**
 * Uniform handoff — symmetric ease-in-out, snappy shoulders, fluid mid.
 * Same curve on every segment (no edge shortcuts).
 */
function easeHandoffFlow(t: number): number {
    const x = clamp01(t)
    const inOut = easePower2InOut(x)
    const punch = easeExpoOut(x)
    return inOut * 0.78 + punch * 0.22
}

function easeExpoOut(t: number): number {
    const x = clamp01(t)
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}

function easeQuartInOut(t: number): number {
    const x = clamp01(t)
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2
}

function easeHandoffDramatic(t: number): number {
    const x = clamp01(t)
    const edgeSpan = 0.12
    const progressLow = 0.12
    const progressHigh = 0.88

    if (x <= edgeSpan) {
        return progressLow * easePower2Out(x / edgeSpan)
    }
    if (x >= 1 - edgeSpan) {
        const local = (x - (1 - edgeSpan)) / edgeSpan
        return progressHigh + (1 - progressHigh) * easePower2In(local)
    }
    const midT = (x - edgeSpan) / (1 - 2 * edgeSpan)
    const midEased =
        midT < 0.5 ? 2 * midT * midT : 1 - Math.pow(-2 * midT + 2, 2) / 2
    return progressLow + (progressHigh - progressLow) * midEased
}

function handoffScrollPaceMultiplier(kind: HandoffEase): number {
    switch (kind) {
        case "editorial":
            return 1.75
        case "soft":
        case "expoOut":
            return 1.15
        case "sharp":
        case "quartInOut":
        case "power2InOut":
        case "standard":
            return 1
        default:
            return 1.1
    }
}

function makeHandoffEase(kind: HandoffEase): (t: number) => number {
    if (kind === "expoOut" || kind === "soft") return easeExpoOut
    if (kind === "quartInOut" || kind === "sharp") return easeQuartInOut
    if (kind === "editorial") return easeHandoffDramatic
    if (kind === "power2InOut" || kind === "standard") return easeHandoffFlow
    return easeHandoffFlow
}

function clampHoldFraction(percent: number): number {
    if (!Number.isFinite(percent)) return 0.45
    return Math.min(0.85, Math.max(0.15, percent / 100))
}

/** Uniform hold — same dwell on every segment. */
function holdForSegment(
    _seg: number,
    _count: number,
    holdFraction: number
): number {
    return clampHoldFraction(holdFraction)
}

/** Position + size only — opacity stays 1 (spatial handoff, no crossfade). */
function lerpRectMotion(a: Rect, b: Rect, t: number): Rect {
    return {
        left: lerp(a.left, b.left, t),
        top: lerp(a.top, b.top, t),
        width: lerp(a.width, b.width, t),
        height: lerp(a.height, b.height, t),
        opacity: 1,
    }
}

/** Collapsed anchor for queue enter (size 0, opacity 1). */
function collapsedAtAnchor(anchor: Rect): Rect {
    return {
        left: anchor.left + anchor.width * 0.5,
        top: anchor.top + anchor.height * 0.5,
        width: 0,
        height: 0,
        opacity: 1,
    }
}

function clampHeroShare(percent: number): number {
    if (!Number.isFinite(percent)) return 0.8
    // Allow 55% through 100% inclusive. At 100%, thumbnail size is zero.
    return Math.min(1.0, Math.max(0.55, percent / 100))
}

interface StageProportions {
    innerW: number
    innerH: number
    heroW: number
    heroH: number
    thumbW: number
    thumbH: number
    metadataBarH: number
}

/** Hero vs thumbnail split inside the stage (e.g. 80% hero, 20% thumb). */
function computeStageProportions(
    stageW: number,
    stageH: number,
    inset: number,
    heroSharePercent: number,
    metadataBarH: number
): StageProportions {
    const innerW = Math.max(stageW - inset * 2, 240)
    const innerH = Math.max(
        stageH - inset - metadataBarH - stageHeroTopGap(metadataBarH),
        240
    )
    const heroFrac = clampHeroShare(heroSharePercent)
    const thumbFrac = 1 - heroFrac
    return {
        innerW,
        innerH,
        heroW: innerW * heroFrac,
        heroH: innerH * heroFrac,
        thumbW: innerW * thumbFrac,
        thumbH: innerH * thumbFrac,
        metadataBarH,
    }
}

function getCornerRects(
    stageW: number,
    stageH: number,
    inset: number,
    heroSharePercent: number,
    metadataBarH: number
): { active: Rect; preview: Rect } {
    const { innerW, innerH } = computeStageProportions(
        stageW,
        stageH,
        inset,
        heroSharePercent,
        metadataBarH
    )

    // When heroShare is 100%, use full available space below metadata bar
    const heroFrac = clampHeroShare(heroSharePercent)
    const isFullHero = heroFrac >= 0.999
    const availableHeight = Math.max(
        stageH - inset - metadataBarH - stageHeroTopGap(metadataBarH),
        240
    )

    const active: Rect = {
        left: inset,
        top: stageHeroTop(metadataBarH),
        width: isFullHero ? innerW : innerW * heroFrac,
        height: isFullHero ? availableHeight : innerH * heroFrac,
        opacity: 1,
    }

    // When full hero, preview has zero size (no thumbnail)
    const preview: Rect = isFullHero
        ? {
              left: stageW,
              top: stageH,
              width: 0,
              height: 0,
              opacity: 0,
          }
        : {
              left: stageW - innerW * (1 - heroFrac) - inset,
              top: stageH - innerH * (1 - heroFrac) - inset,
              width: innerW * (1 - heroFrac),
              height: innerH * (1 - heroFrac),
              opacity: 1,
          }

    return { active, preview }
}

function thumbSize(
    layout: StageLayout,
    inset: number,
    metadataBarH: number
): { pW: number; pH: number } {
    const { thumbW, thumbH } = computeStageProportions(
        layout.stageW,
        layout.stageH,
        inset,
        layout.heroShare,
        metadataBarH
    )
    return { pW: thumbW, pH: thumbH }
}

/** Small thumbnail top-left (shrunken hero in corner morph). */
function thumbTopLeft(
    inset: number,
    pW: number,
    pH: number,
    metadataBarH: number
): Rect {
    return {
        left: inset,
        top: stageHeroTop(metadataBarH),
        width: pW,
        height: pH,
        opacity: 1,
    }
}

/** Hero slides off-screen left while the next image grows in. */
function exitLeftRect(active: Rect, stageW: number): Rect {
    return {
        left: -active.width - Math.max(stageW * 0.08, 48),
        top: active.top + active.height * 0.06,
        width: active.width * 0.7,
        height: active.height * 0.7,
        opacity: 0,
    }
}

/** Continuous playhead: item `i` is full hero when playhead === i. */
function playhead(progress: number, count: number): number {
    if (count <= 1) return 0
    return clamp01(progress) * (count - 1)
}

type ScrollSegmentMode = "hold" | "handoff"

interface ScrollSegment {
    playhead: number
    seg: number
    t: number
    hold: number
    mode: ScrollSegmentMode
    handoffEaseT: number
    outgoingIndex: number
    incomingIndex: number
    isLastSegment: boolean
}

/** Single scroll-segment seam — playhead, hold/handoff, eased progress. */
function readScrollSegment(
    progress: number,
    count: number,
    holdFraction: number,
    handoffEaseFn: (t: number) => number
): ScrollSegment {
    if (count <= 1) {
        return {
            playhead: 0,
            seg: 0,
            t: 0,
            hold: holdForSegment(0, count, holdFraction),
            mode: "hold",
            handoffEaseT: 0,
            outgoingIndex: 0,
            incomingIndex: 0,
            isLastSegment: true,
        }
    }

    const p = playhead(progress, count)
    const seg = Math.min(Math.floor(p), count - 1)
    const t = p - seg
    const hold = holdForSegment(seg, count, holdFraction)
    const isLastSegment = seg >= count - 1
    const isHandoff = !isLastSegment && t >= hold
    const handoffEaseT = isHandoff
        ? handoffEaseFn((t - hold) / Math.max(1 - hold, 0.001))
        : 0

    return {
        playhead: p,
        seg,
        t,
        hold,
        mode: isHandoff ? "handoff" : "hold",
        handoffEaseT,
        outgoingIndex: seg,
        incomingIndex: Math.min(seg + 1, count - 1),
        isLastSegment,
    }
}

function dominantIndexFromSegment(segment: ScrollSegment): number {
    if (segment.isLastSegment) return segment.seg
    if (segment.mode === "hold") return segment.outgoingIndex
    if (segment.handoffEaseT > 0.38) return segment.incomingIndex
    return segment.outgoingIndex
}

function rectToSlide(
    rect: Rect,
    baseW: number,
    baseH: number,
    transformOrigin: string
): SlideFrame {
    return {
        x: rect.left,
        y: rect.top,
        scale: Math.min(rect.width / baseW, rect.height / baseH),
        opacity: rect.opacity,
        rotateX: 0,
        rotateY: 0,
        transformOrigin,
    }
}

/**
 * fix.studio segment model (per transition item i → i+1):
 *   t ∈ [0, HOLD)     → item i full hero; item i+1 hidden
 *   t ∈ [HOLD, 1]     → item i exits; item i+1 grows BR → hero (ease in/out)
 */
function slideFrameAt(
    progress: number,
    itemCount: number,
    itemIndex: number,
    layout: StageLayout,
    inset: number,
    handoff: CornerHandoff,
    holdFraction: number,
    metadataBarH: number,
    incomingEntrance: "none" | "tilt" | "fold",
    handoffEaseFn: (t: number) => number
): SlideFrame {
    // Default transform origin is top left for items without rotation
    let transformOrigin = "top left"

    // Default rotation values
    let rotateX = 0
    let rotateY = 0

    if (itemCount < 1)
        return {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 0,
            rotateX,
            rotateY,
            transformOrigin,
        }

    const segment = readScrollSegment(
        progress,
        itemCount,
        holdFraction,
        handoffEaseFn
    )
    const { seg, t, hold, handoffEaseT } = segment

    const { active, preview } = getCornerRects(
        layout.stageW,
        layout.stageH,
        inset,
        layout.heroShare,
        metadataBarH
    )
    const { pW, pH } = thumbSize(layout, inset, metadataBarH)
    const enterThumb = preview
    const exitTarget =
        handoff === "cornerMorph"
            ? thumbTopLeft(inset, pW, pH, metadataBarH)
            : exitLeftRect(active, layout.stageW)

    // Scale max angles by entrance intensity (0-100)
    const intensityScale = clamp01(ENTRANCE_INTENSITY / 100)
    let rect: Rect

    if (itemCount === 1) {
        rect = active
    } else if (itemIndex < seg) {
        const pastRects = getCornerRects(
            layout.stageW,
            layout.stageH,
            inset,
            layout.heroShare,
            metadataBarH
        )
        const pastThumb = thumbSize(layout, inset, metadataBarH)
        const pastExit =
            handoff === "cornerMorph"
                ? thumbTopLeft(inset, pastThumb.pW, pastThumb.pH, metadataBarH)
                : exitLeftRect(pastRects.active, layout.stageW)
        rect =
            handoff === "cornerMorph" ? pastExit : collapsedAtAnchor(pastExit)
    } else if (itemIndex > seg + 1) {
        const futurePreview = getCornerRects(
            layout.stageW,
            layout.stageH,
            inset,
            layout.heroShare,
            metadataBarH
        ).preview
        rect = collapsedAtAnchor(futurePreview)
    } else if (itemIndex === seg) {
        // Exiting item - no rotation, transformOrigin stays "top left"
        if (seg >= itemCount - 1) {
            rect = active
        } else if (t < hold) {
            rect = active
        } else {
            rect = lerpRectMotion(active, exitTarget, handoffEaseT)
        }
    } else if (itemIndex === seg + 1) {
        // Incoming item - apply rotation and transform origin during handoff only
        const nextRects = getCornerRects(
            layout.stageW,
            layout.stageH,
            inset,
            layout.heroShare,
            metadataBarH
        )
        const nextActive = nextRects.active
        const nextEnter = nextRects.preview
        if (t < hold) {
            // During HOLD, show as corner thumbnail (visible and clickable when heroShare < 100%)
            rect = nextEnter
            // No rotation during hold, transformOrigin stays "top left"
        } else {
            rect = lerpRectMotion(nextEnter, nextActive, handoffEaseT)

            // Apply transform origin and rotation to incoming item during handoff only
            if (incomingEntrance === "tilt") {
                transformOrigin = "100% 100%"
                const maxAngle = ENTRANCE_TILT_ANGLE * intensityScale
                rotateY = maxAngle * (1 - handoffEaseT)
                rotateX = 0
            } else if (incomingEntrance === "fold") {
                // For fold: bottom center
                transformOrigin = "50% 100%"

                const maxAngle = ENTRANCE_FOLD_ANGLE * intensityScale
                // Animate from max angle down to 0 as handoff progresses
                rotateX = maxAngle * (1 - handoffEaseT)
                rotateY = 0
            }
            // For "none", transformOrigin stays "top left" and rotation stays 0
        }
    } else {
        rect = collapsedAtAnchor(enterThumb)
    }

    const frame = rectToSlide(rect, layout.baseW, layout.baseH, transformOrigin)
    return { ...frame, rotateX, rotateY, transformOrigin }
}

/** Incoming (next main) stays in front during handoff. */
function figureZIndex(
    progress: number,
    itemCount: number,
    itemIndex: number,
    holdFraction: number
): number {
    if (itemCount <= 1) return 40

    const { seg, mode } = readScrollSegment(
        progress,
        itemCount,
        holdFraction,
        () => 0
    )

    if (itemIndex < seg) return 12
    if (itemIndex > seg + 1) return 8

    if (seg >= itemCount - 1) {
        return itemIndex === itemCount - 1 ? 50 : 8
    }

    if (itemIndex === seg) {
        return mode === "hold" ? 50 : 28
    }
    if (itemIndex === seg + 1) {
        return mode === "hold" ? 8 : 50
    }

    return 10
}

/** Determine if a figure is actively animating during handoff phase. */
function figureIsAnimating(
    progress: number,
    itemCount: number,
    itemIndex: number,
    holdFraction: number
): boolean {
    if (itemCount <= 1) return false

    const { seg, mode } = readScrollSegment(
        progress,
        itemCount,
        holdFraction,
        () => 0
    )

    if (itemIndex === seg || itemIndex === seg + 1) {
        return mode === "handoff"
    }
    return false
}

function readStageLayout(
    stageW: number,
    stageH: number,
    inset: number,
    heroShare: number,
    metadataBarH: number
): StageLayout {
    const w = Math.max(stageW, 320)
    const h = Math.max(stageH, 400)
    const { active } = getCornerRects(w, h, inset, heroShare, metadataBarH)
    return {
        stageW: w,
        stageH: h,
        heroShare,
        baseW: active.width,
        baseH: active.height,
    }
}

function metaIndexAt(
    progress: number,
    count: number,
    holdFraction: number,
    handoffEaseFn: (t: number) => number
): number {
    return dominantIndexFromSegment(
        readScrollSegment(progress, count, holdFraction, handoffEaseFn)
    )
}

// ─── Layout hook ───────────────────────────────────────────────────────────────

function useStageLayout(
    stageRef: RefObject<HTMLDivElement | null>,
    inset: number,
    heroShare: number,
    metadataBarH: number
): [StageLayout, MotionValue<number>] {
    const layoutTick = useMotionValue(0)
    const [layout, setLayout] = useState<StageLayout>(() =>
        readStageLayout(1200, 700, inset, heroShare, metadataBarH)
    )

    const sync = useCallback(() => {
        const el = stageRef.current
        if (!el) return
        const w = el.offsetWidth
        const h = el.offsetHeight
        if (w < 2 || h < 2) return
        startTransition(() =>
            setLayout(readStageLayout(w, h, inset, heroShare, metadataBarH))
        )
        layoutTick.set(layoutTick.get() + 1)
    }, [heroShare, inset, layoutTick, stageRef, metadataBarH])

    useIsomorphicLayoutEffect(() => {
        sync()
        const el = stageRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => sync())
        ro.observe(el)
        return () => ro.disconnect()
    }, [sync, stageRef])

    return [layout, layoutTick]
}

function readProgress(latest: number | unknown): number {
    return typeof latest === "number" && Number.isFinite(latest) ? latest : 0
}

/** Measure an element's height (px) with ResizeObserver — robust vs vh/% in Framer. */
function useMeasuredWidth(
    ref: RefObject<HTMLDivElement | null>,
    fallback: number
): number {
    const [width, setWidth] = useState(fallback)

    useIsomorphicLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const read = () => {
            const w = el.clientWidth
            if (w > 2) {
                startTransition(() => setWidth(w))
            }
        }
        read()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(read)
        ro.observe(el)
        return () => ro.disconnect()
    }, [ref])

    return width
}

function computeContainerTextScale(width: number): number {
    const referenceWidth = 1200
    const rawScale = width / referenceWidth
    return clampRange(rawScale, 0.58, 1.15)
}

/** Caption size — flat tablet tier + width scale + mid-viewport shrink. */
function resolveCaptionFontSize(
    containerWidth: number,
    mobile: number,
    tablet: number,
    desktop: number
): number {
    let base: number
    if (containerWidth <= 640) {
        base = mobile
    } else if (containerWidth >= 1200) {
        base = desktop
    } else if (containerWidth <= 1024) {
        base = tablet
    } else {
        const t = (containerWidth - 1024) / (1200 - 1024)
        base = lerp(tablet, desktop, clamp01(t))
    }
    const scale = computeContainerTextScale(containerWidth)
    const midShrink = containerWidth < 1200 ? 0.9 : 1
    return Math.max(10, Math.round(base * scale * midShrink))
}

function useViewportHeight(fallback: number): number {
    const [height, setHeight] = useState(fallback)

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined") return
        const read = () => {
            const next = window.innerHeight
            if (next > 2) setHeight(next)
        }
        read()
        window.addEventListener("resize", read)
        return () => window.removeEventListener("resize", read)
    }, [])

    return height
}

function resolveResponsiveCaptionVisibility(
    _viewportWidth: number,
    _isCanvas: boolean,
    showYear: boolean,
    showCategory: boolean
): { showYear: boolean; showCategory: boolean } {
    return { showYear, showCategory }
}

type CaptionAlign = "left" | "center" | "right"

interface CaptionGridSlot {
    id: "title" | "year" | "category"
    column: number
    align: CaptionAlign
}

interface CaptionGridLayout {
    templateColumns: string
    slots: CaptionGridSlot[]
}

/** Map visible caption fields to grid columns — fill width with stable left/center/right roles. */
function buildCaptionGridLayout(
    showTitle: boolean,
    showYear: boolean,
    showCategory: boolean
): CaptionGridLayout | null {
    const count =
        Number(showTitle) + Number(showYear) + Number(showCategory)
    if (count === 0) return null

    if (count === 1) {
        if (showTitle) {
            return {
                templateColumns: "1fr",
                slots: [{ id: "title", column: 1, align: "left" }],
            }
        }
        if (showYear) {
            return {
                templateColumns: "1fr",
                slots: [{ id: "year", column: 1, align: "center" }],
            }
        }
        return {
            templateColumns: "1fr",
            slots: [{ id: "category", column: 1, align: "right" }],
        }
    }

    if (count === 2) {
        const pair = "1fr 1fr"
        if (showTitle && showYear) {
            return {
                templateColumns: pair,
                slots: [
                    { id: "title", column: 1, align: "left" },
                    { id: "year", column: 2, align: "right" },
                ],
            }
        }
        if (showTitle && showCategory) {
            return {
                templateColumns: pair,
                slots: [
                    { id: "title", column: 1, align: "left" },
                    { id: "category", column: 2, align: "right" },
                ],
            }
        }
        return {
            templateColumns: pair,
            slots: [
                { id: "year", column: 1, align: "left" },
                { id: "category", column: 2, align: "right" },
            ],
        }
    }

    return {
        templateColumns: "1fr 1fr 1fr",
        slots: [
            { id: "title", column: 1, align: "left" },
            { id: "year", column: 2, align: "center" },
            { id: "category", column: 3, align: "right" },
        ],
    }
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

interface ProjectFigureProps {
    item: ScrollerItem
    index: number
    itemCount: number
    scrollProgress: MotionValue<number>
    layoutTick: MotionValue<number>
    layout: StageLayout
    layoutRef: MutableRefObject<StageLayout>
    inset: number
    handoff: CornerHandoff
    holdFraction: number
    metadataBarH: number
    incomingEntrance: "none" | "tilt" | "fold"
    handoffEaseFn: (t: number) => number
    interaction: InteractionGroup
    customCursorActive: boolean
}

function ProjectFigure({
    item,
    index,
    itemCount,
    scrollProgress,
    layoutTick,
    layout,
    layoutRef,
    inset,
    handoff,
    holdFraction,
    metadataBarH,
    incomingEntrance,
    handoffEaseFn,
    interaction,
    customCursorActive,
}: ProjectFigureProps) {
    const linkFocusId = useId()
    const linkFocusClass = useMemo(
        () => `kern-cps-link-${linkFocusId.replace(/[^a-zA-Z0-9]/g, "")}`,
        [linkFocusId]
    )
    const frameAt = useCallback(
        (p: number) =>
            slideFrameAt(
                p,
                itemCount,
                index,
                layoutRef.current,
                inset,
                handoff,
                holdFraction,
                metadataBarH,
                incomingEntrance,
                handoffEaseFn
            ),
        [
            handoff,
            holdFraction,
            itemCount,
            index,
            layoutRef,
            inset,
            metadataBarH,
            incomingEntrance,
            handoffEaseFn,
        ]
    )

    const readFrame = useCallback(
        (p: number) => frameAt(readProgress(p)),
        [frameAt]
    )

    const x = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).x
    )
    const y = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).y
    )
    const scale = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).scale
    )
    const opacity = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).opacity
    )
    const rotateX = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).rotateX
    )
    const rotateY = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => readFrame(p as number).rotateY
    )
    const zIndex = useTransform([scrollProgress, layoutTick], ([p]) =>
        figureZIndex(readProgress(p as number), itemCount, index, holdFraction)
    )

    // Determine if figure is actively animating during handoff
    const isAnimating = useTransform([scrollProgress, layoutTick], ([p]) =>
        figureIsAnimating(
            readProgress(p as number),
            itemCount,
            index,
            holdFraction
        )
    )

    // Compute visibility state for pointer events: clicks enabled only when meaningfully visible
    const isMeaningfullyVisible = useTransform(
        [scrollProgress, layoutTick],
        ([p]) => {
            const progress = readProgress(p as number)
            
            // No href = never clickable
            if (!item.href || item.href.length === 0) return false
            
            // Check if we're in a visible state based on scroll progress
            if (itemCount <= 1) return true // Single item always clickable if visible

            const playheadVal = playhead(progress, itemCount)
            const seg = Math.min(Math.floor(playheadVal), itemCount - 1)
            const t = playheadVal - seg
            const hold = holdForSegment(seg, itemCount, holdFraction)
            
            // Determine visibility state
            const isIncoming = index === seg + 1
            const isOutgoing = index === seg
            const isPast = index < seg
            const isFuture = index > seg + 1
            
            // Past items: collapsed, not clickable
            if (isPast) return false
            
            // Future items: collapsed, not clickable
            if (isFuture) return false
            
            // Current item during HOLD: fully visible, clickable
            if (isOutgoing && t < hold) return true
            
            // Incoming item during HOLD: visible as corner thumbnail when heroShare < 100%, clickable
            if (isIncoming && t < hold) {
                const heroFrac = clampHeroShare(layout.heroShare)
                return heroFrac < 0.999 // Clickable when thumbnail is visible
            }
            
            // During handoff (t >= hold), check scale threshold
            if (t >= hold) {
                // Get current frame to check scale
                const frame = readFrame(progress)
                // Scale threshold: clickable if > 15% of full size
                const scaleThreshold = 0.15
                return frame.scale > scaleThreshold
            }
            
            return false
        }
    )
    const pointerEventsValue = useTransform(isMeaningfullyVisible, (visible) =>
        visible ? "auto" : "none"
    )
    const willChangeValue = useTransform(isAnimating, (animating) =>
        animating ? "transform" : "auto"
    )

    // Check if this project has a link
    const hasHref = item.href && item.href.length > 0
    const linkPointerEvents = "auto"
    const linkCursor = customCursorActive ? "none" : "pointer"

    const imageContent = item.image ? (
        <img
            src={item.image}
            alt={`${item.title} project`}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transform: "translateZ(0)",
                filter: `saturate(${IMAGE_POLISH.saturation}) contrast(${IMAGE_POLISH.contrast})`,
                borderRadius: IMAGE_POLISH.radius,
            }}
        />
    ) : (
        <div
            aria-hidden="true"
            style={{
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.06)",
                borderRadius: IMAGE_POLISH.radius,
            }}
        />
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: layout.baseW,
                height: layout.baseH,
                x,
                y,
                scale,
                opacity,
                rotateX,
                rotateY,
                transformOrigin: "top left",
                overflow: "hidden",
                zIndex,
                pointerEvents: pointerEventsValue,
                willChange: willChangeValue,
                backfaceVisibility: "hidden",
                borderRadius: IMAGE_POLISH.radius,
                boxShadow: `0px 40px 80px -40px rgba(0,0,0,${IMAGE_POLISH.shadowStrength})`,
            }}
        >
            {hasHref ? (
                <>
                    {interaction.focusRingEnabled ? (
                        <style>
                            {`.${linkFocusClass}:focus-visible{outline:${interaction.focusRingWidth}px solid ${interaction.focusRingColor};outline-offset:${interaction.focusRingOffset}px;}`}
                        </style>
                    ) : null}
                    <a
                        href={item.href}
                        aria-label={`View ${item.title} project`}
                        className={linkFocusClass}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            textDecoration: "none",
                            cursor: linkCursor,
                            pointerEvents: linkPointerEvents,
                            outline: interaction.focusRingEnabled ? undefined : "none",
                        }}
                    >
                        {imageContent}
                    </a>
                </>
            ) : (
                imageContent
            )}
        </motion.div>
    )
}

interface StageShellProps {
    config: ResolvedConfig
    containerWidth: number
    textScale: number
    motionPolicy: MotionPolicy
}

interface PinnedStageProps {
    config: ResolvedConfig
    containerWidth: number
    textScale: number
}

function PinnedStage({
    config,
    containerWidth,
    textScale,
}: PinnedStageProps) {
    const {
        items,
        scrollLengthPerItem,
        cornerHandoff,
        captionSpring,
        scrubSpring,
        showMetadata,
        backgroundColor,
        activeInset,
        heroShare,
        holdFraction,
        metadataColor,
        fontSize,
        ariaLabel,
        incomingEntrance,
        style,
        handoffEaseFn,
        interaction,
    } = config

    const scrollRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const [isTouchPointer, setIsTouchPointer] = useState(false)
    const [isCursorInside, setIsCursorInside] = useState(false)

    /** Overlay caption: hero uses full height (no reserved bar above images). */
    const layoutBarH = 0
    const captionOverlayTop = 0

    const layoutRef = useRef<StageLayout>(
        readStageLayout(1200, 700, activeInset, heroShare, layoutBarH)
    )
    const [layout, layoutTick] = useStageLayout(
        stageRef,
        activeInset,
        heroShare,
        layoutBarH
    )

    const customCursorEnabled =
        interaction.customCursor && !isTouchPointer
    const cursorSize = Math.max(28, interaction.cursorSize)
    const cursorLabelSize = Math.max(10, 12 * textScale)
    const cursorX = useMotionValue(0)
    const cursorY = useMotionValue(0)
    const cursorTrackSpring = getSpring("cursorTrack", "standard")
    const cursorXSpring = useSpring(cursorX, cursorTrackSpring)
    const cursorYSpring = useSpring(cursorY, cursorTrackSpring)
    const cursorOpacityTarget = useMotionValue(0)
    const cursorOpacity = useSpring(
        cursorOpacityTarget,
        getSpring("cursorOpacity", "standard")
    )

    const syncCursorFromPointer = useCallback(
        (clientX: number, clientY: number) => {
            const el = stageRef.current
            if (!el || !customCursorEnabled) return
            const rect = el.getBoundingClientRect()
            const half = cursorSize / 2
            cursorX.set(clientX - rect.left - half)
            cursorY.set(clientY - rect.top - half)
        },
        [customCursorEnabled, cursorSize, cursorX, cursorY]
    )

    useIsomorphicLayoutEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return
        const mq = window.matchMedia("(pointer: coarse)")
        const update = () => {
            startTransition(() => setIsTouchPointer(mq.matches))
        }
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    useIsomorphicLayoutEffect(() => {
        cursorOpacityTarget.set(customCursorEnabled && isCursorInside ? 1 : 0)
    }, [customCursorEnabled, isCursorInside, cursorOpacityTarget])

    const count = Math.max(items.length, 1)
    const viewportH = useViewportHeight(700)
    const perItem = Math.max(scrollLengthPerItem, 56) / 100
    const transitionCount = Math.max(count - 1, 0)
    const trackH = Math.max(
        Math.round(viewportH * (transitionCount * perItem + 1)),
        viewportH + 1
    )

    const rawId = useId()
    const hideScrollClass = `kern-cps-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`
    const rootStyle = useMemo(() => {
        const incoming = style ?? {}
        const {
            overflow: _overflow,
            ...safe
        } = incoming
        return safe
    }, [style])

    useIsomorphicLayoutEffect(() => {
        layoutRef.current = layout
        layoutTick.set(layoutTick.get() + 1)
    }, [layout, layoutTick])

    const { scrollYProgress } = useScroll({
        container: scrollRef,
        offset: ["start start", "end end"],
    })
    const springProgress = useSpring(scrollYProgress, {
        ...scrubSpring,
        restDelta: scrubSpring.restDelta ?? 0.00035,
        restSpeed: scrubSpring.restSpeed ?? 0.0035,
    })
    const scrubProgress = springProgress

    const [metaIndex, setMetaIndex] = useState(0)
    const metaRef = useRef(0)

    useMotionValueEvent(scrubProgress, "change", (p) => {
        const next = metaIndexAt(
            clamp01(p),
            count,
            config.holdFraction,
            config.handoffEaseFn
        )
        if (next !== metaRef.current) {
            metaRef.current = next
            startTransition(() => setMetaIndex(next))
        }
    })

    const activeMeta = items[metaIndex] ?? items[0]

    if (items.length < 1) {
        return (
            <div
                style={{
                    width: "100%",
                    minHeight: 400,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor,
                    color: metadataColor,
                    fontSize: Math.max(12, fontSize * textScale),
                }}
            >
                Add projects in Properties → Projects → Items
            </div>
        )
    }

    return (
        <div
            ref={scrollRef}
            className={hideScrollClass}
            role="region"
            aria-label={ariaLabel}
            style={{
                ...rootStyle,
                width: "100%",
                minHeight: 480,
                height: "100vh",
                maxHeight: "100vh",
                position: "relative",
                backgroundColor,
                boxSizing: "border-box",
                overflowY: "auto",
                overflowX: "hidden",
            }}
        >
            <style>{`.${hideScrollClass}{scrollbar-width:none;-ms-overflow-style:none}.${hideScrollClass}::-webkit-scrollbar{width:0;height:0;display:none}`}</style>

            <div
                style={{ width: "100%", height: trackH, position: "relative" }}
            >
                <div
                    ref={stageRef}
                    onPointerEnter={(event) => {
                        if (!customCursorEnabled) return
                        syncCursorFromPointer(event.clientX, event.clientY)
                        startTransition(() => setIsCursorInside(true))
                    }}
                    onPointerLeave={() => {
                        startTransition(() => setIsCursorInside(false))
                    }}
                    onPointerMove={(event) => {
                        if (!customCursorEnabled) return
                        syncCursorFromPointer(event.clientX, event.clientY)
                    }}
                    style={{
                        position: "sticky",
                        top: 0,
                        width: "100%",
                        height: viewportH,
                        overflow: "hidden",
                        backgroundColor,
                        perspective:
                            incomingEntrance !== "none"
                                ? `${ENTRANCE_PERSPECTIVE}px`
                                : undefined,
                        transformStyle:
                            incomingEntrance !== "none"
                                ? "preserve-3d"
                                : undefined,
                        cursor: customCursorEnabled && isCursorInside ? "none" : "auto",
                    }}
                >
                    {items.map((item, index) => (
                        <ProjectFigure
                            key={item.id}
                            item={item}
                            index={index}
                            itemCount={count}
                            scrollProgress={scrubProgress}
                            layoutTick={layoutTick}
                            layout={layout}
                            layoutRef={layoutRef}
                            inset={activeInset}
                            handoff={cornerHandoff}
                            holdFraction={holdFraction}
                            metadataBarH={layoutBarH}
                            incomingEntrance={config.incomingEntrance}
                            handoffEaseFn={handoffEaseFn}
                            interaction={interaction}
                            customCursorActive={
                                customCursorEnabled && isCursorInside
                            }
                        />
                    ))}

                    {showMetadata && activeMeta && (
                        <StageMetadataBar
                            items={items}
                            scrubProgress={scrubProgress}
                            count={count}
                            holdFraction={holdFraction}
                            handoffEaseFn={handoffEaseFn}
                            config={config}
                            captionSpring={captionSpring}
                            layoutBarTop={captionOverlayTop}
                            containerWidth={containerWidth}
                            textScale={textScale}
                        />
                    )}
                    {customCursorEnabled ? (
                        <motion.div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: cursorSize,
                                height: cursorSize,
                                borderRadius: "50%",
                                ...cursorGlassSurfaceStyle(
                                    interaction.cursorColor,
                                    interaction.cursorTextColor
                                ),
                                color: interaction.cursorTextColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: cursorLabelSize,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                fontWeight: 500,
                                pointerEvents: "none",
                                zIndex: 1200,
                                x: cursorXSpring,
                                y: cursorYSpring,
                                opacity: cursorOpacity,
                                willChange: "transform, opacity",
                            }}
                        >
                            {interaction.cursorLabel}
                        </motion.div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function CanvasPreview({
    config,
    containerWidth,
    textScale,
    motionPolicy,
}: StageShellProps) {
    const stageRef = useRef<HTMLDivElement>(null)
    const firstItem = config.items[0]

    if (!firstItem) {
        return (
            <div
                ref={stageRef}
                style={{
                    width: "100%",
                    minHeight: 520,
                    height: "min(100vh, 720px)",
                    position: "relative",
                    overflow: "hidden",
                    backgroundColor: config.backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: config.metadataColor,
                }}
            >
                Add projects in Properties → Projects → Items
            </div>
        )
    }

    return (
        <div
            ref={stageRef}
            style={{
                width: "100%",
                minHeight: 520,
                height: "min(100vh, 720px)",
                position: "relative",
                overflow: "hidden",
                backgroundColor: config.backgroundColor,
            }}
        >
            {firstItem.image ? (
                <img
                    src={firstItem.image}
                    alt={`${firstItem.title} project preview`}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        filter: `saturate(${IMAGE_POLISH.saturation}) contrast(${IMAGE_POLISH.contrast})`,
                        borderRadius: IMAGE_POLISH.radius,
                    }}
                />
            ) : (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.06)",
                        borderRadius: IMAGE_POLISH.radius,
                    }}
                />
            )}
            {config.showMetadata && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 999,
                    }}
                >
                    <CaptionRow
                        item={firstItem}
                        config={config}
                        containerWidth={containerWidth}
                        textScale={textScale}
                    />
                </div>
            )}
        </div>
    )
}

function ReducedList({
    config,
    containerWidth,
    textScale,
    motionPolicy,
}: StageShellProps) {
    const { isCanvas } = motionPolicy
    const responsiveVisibility = useMemo(
        () =>
            resolveResponsiveCaptionVisibility(
                containerWidth,
                isCanvas,
                config.showYear !== false,
                config.showCategory !== false
            ),
        [config.showCategory, config.showYear, isCanvas, containerWidth]
    )
    const reducedFontSize = resolveCaptionFontSize(
        containerWidth,
        config.fontSizeMobile,
        config.fontSizeTablet,
        config.fontSize
    )
    return (
        <ul
            style={{
                listStyle: "none",
                margin: 0,
                padding: 24,
                fontSize: reducedFontSize,
                lineHeight: 1.6,
            }}
        >
            {config.items.map((item) => {
                // Use metadata overrides in reduced list too
                const centerLabel = item.meta?.label || item.year
                const showYear = responsiveVisibility.showYear && centerLabel
                const showCategory =
                    responsiveVisibility.showCategory && item.category
                const text = showYear
                    ? `${item.title} ( ${centerLabel} )${showCategory ? ` ${item.category}` : ""}`
                    : item.title
                return (
                    <li key={item.id} style={{ marginBottom: 12 }}>
                        {item.href ? (
                            <a
                                href={item.href}
                                style={{ color: config.metadataColor }}
                            >
                                {text}
                            </a>
                        ) : (
                            <span style={{ color: config.metadataColor }}>
                                {text}
                            </span>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

interface CaptionRowProps {
    item: ScrollerItem
    config: ResolvedConfig
    inset?: number
    /** Handoff progress for driving opacity (0-1). When provided, drives text blend directly. */
    handoffProgress?: number
    /** Whether this is the incoming row (stagger in) or outgoing (uniform out). */
    isIncoming?: boolean
    /** When true, only render text content without blur/scrim layers. */
    textOnly?: boolean
    /** Optional href for the dominant project title link. When provided, title becomes clickable. */
    dominantHref?: string
    /** Optional runtime-responsive visibility for year/center content. */
    responsiveShowYear?: boolean
    /** Optional runtime-responsive visibility for category content. */
    responsiveShowCategory?: boolean
    containerWidth?: number
    textScale?: number
}

// ─── Caption overlay + typography (pure) ───────────────────────────────────

interface CaptionStyleInput {
    element: "title" | "year" | "category"
    config: ResolvedConfig
}

interface CaptionStyles {
    textShadow: string
    span: CSSProperties
}

function captionOverlayBackground(
    scrimColor: string,
    peakOpacity: number
): CSSProperties {
    const stop = (opacity: number) =>
        `color-mix(in srgb, ${scrimColor} ${clampRange(opacity, 0, 1) * 100}%, transparent)`
    const peak = clampRange(peakOpacity, 0, 1)
    const ratio = peak / Math.max(CAPTION_OVERLAY.peakOpacity, 0.0001)
    const highMid = clampRange(CAPTION_OVERLAY.highMidOpacity * ratio, 0, 1)
    const mid = clampRange(CAPTION_OVERLAY.midOpacity * ratio, 0, 1)
    const light = clampRange(CAPTION_OVERLAY.lightOpacity * ratio, 0, 1)
    const veryLight = clampRange(CAPTION_OVERLAY.veryLightOpacity * ratio, 0, 1)
    const whisper = clampRange(CAPTION_OVERLAY.whisperOpacity * ratio, 0, 1)
    // 8-stop gradient with ultra-long smooth falloff: strong at top, dissolves by ~88%
    return {
        background: `linear-gradient(180deg, 
            ${stop(peak)} 0%, 
            ${stop(peak)} ${CAPTION_OVERLAY.maskStop1 * 100}%, 
            ${stop(highMid)} ${CAPTION_OVERLAY.maskStop2 * 100}%, 
            ${stop(mid)} ${CAPTION_OVERLAY.maskStop3 * 100}%, 
            ${stop(light)} ${CAPTION_OVERLAY.maskStop4 * 100}%, 
            ${stop(veryLight)} ${CAPTION_OVERLAY.maskStop5 * 100}%, 
            ${stop(whisper)} ${CAPTION_OVERLAY.maskStop6 * 100}%, 
            transparent ${CAPTION_OVERLAY.maskTransparent * 100}%)`,
    }
}

function captionBlurOverlayStyle(blurPx: number): CSSProperties {
    // 7-stop vertical gradient mask matching scrim falloff: strong at top, ultra-gradual to transparent at ~88%
    const mask = `linear-gradient(to bottom, 
        rgba(0,0,0,1) 0%, 
        rgba(0,0,0,1) ${CAPTION_OVERLAY.maskStop1 * 100}%, 
        rgba(0,0,0,0.75) ${CAPTION_OVERLAY.maskStop2 * 100}%, 
        rgba(0,0,0,0.50) ${CAPTION_OVERLAY.maskStop3 * 100}%, 
        rgba(0,0,0,0.28) ${CAPTION_OVERLAY.maskStop4 * 100}%, 
        rgba(0,0,0,0.12) ${CAPTION_OVERLAY.maskStop5 * 100}%, 
        rgba(0,0,0,0.04) ${CAPTION_OVERLAY.maskStop6 * 100}%, 
        transparent ${CAPTION_OVERLAY.maskTransparent * 100}%)`
    return {
        position: "absolute",
        inset: 0,
        backdropFilter: `blur(${blurPx}px) saturate(1.05)`,
        WebkitBackdropFilter: `blur(${blurPx}px) saturate(1.05)`,
        maskImage: mask,
        WebkitMaskImage: mask,
        pointerEvents: "none",
    }
}

function captionOverlayTextShadow(): string {
    const hex = Math.round(CAPTION_OVERLAY.shadowOpacity * 255)
        .toString(16)
        .padStart(2, "0")
    return `0 ${CAPTION_OVERLAY.shadowY}px ${CAPTION_OVERLAY.shadowBlur}px #000000${hex}`
}

function buildCaptionStyles(input: CaptionStyleInput): CaptionStyles {
    const { element, config } = input
    const elementFont = config.captionFont
    const defaultElementFont = TYPOGRAPHY_DEFAULTS.captionFont
    const fontObj: MetadataElementStyle = {
        fontFamily:
            elementFont?.fontFamily ?? defaultElementFont?.fontFamily,
        fontWeight:
            elementFont?.fontWeight ?? defaultElementFont?.fontWeight,
        fontStyle:
            elementFont?.fontStyle ?? defaultElementFont?.fontStyle,
        fontSize:
            elementFont?.fontSize ?? defaultElementFont?.fontSize,
        letterSpacing:
            elementFont?.letterSpacing ?? defaultElementFont?.letterSpacing,
        lineHeight:
            elementFont?.lineHeight ?? defaultElementFont?.lineHeight,
        textTransform:
            elementFont?.textTransform ?? defaultElementFont?.textTransform,
        textDecoration:
            elementFont?.textDecoration ??
            defaultElementFont?.textDecoration,
    }
    const textAlign: CSSProperties["textAlign"] =
        element === "title" ? "left" : element === "year" ? "center" : "right"

    const letterSpacing =
        fontObj?.letterSpacing ?? `${config.letterSpacing}em`
    const lineHeight = fontObj?.lineHeight ?? config.lineHeight
    const fontWeight = fontObj?.fontWeight ?? config.fontWeight
    const textTransform = fontObj?.textTransform ?? config.textTransform

    return {
        textShadow: CAPTION_OVERLAY.textShadow
            ? captionOverlayTextShadow()
            : "none",
        span: {
            fontFamily: fontObj?.fontFamily,
            fontWeight,
            lineHeight,
            letterSpacing,
            textAlign,
            textTransform,
            fontStyle: fontObj?.fontStyle,
            textDecoration: fontObj?.textDecoration,
            color: config.metadataColor,
            mixBlendMode: CAPTION_OVERLAY.blendMode,
            opacity: 1,
        },
    }
}

function captionCellTextStyle(
    styles: CaptionStyles,
    captionFontSize: number,
    textAlign: CSSProperties["textAlign"]
): CSSProperties {
    return {
        ...styles.span,
        fontSize: captionFontSize,
        lineHeight: CAPTION_OVERLAY.rowLineHeight,
        textAlign,
        textShadow: styles.textShadow,
        display: "block",
        width: "100%",
        margin: 0,
        padding: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    }
}

function CaptionRow({
    item,
    config,
    inset = config.activeInset,
    handoffProgress,
    isIncoming,
    textOnly = false,
    dominantHref,
    responsiveShowYear,
    responsiveShowCategory,
    containerWidth = 1200,
    textScale = 1,
}: CaptionRowProps) {
    const titleFocusId = useId()
    const titleFocusClass = useMemo(
        () => `kern-cps-title-${titleFocusId.replace(/[^a-zA-Z0-9]/g, "")}`,
        [titleFocusId]
    )
    const fr = config.interaction
    const showYear = responsiveShowYear ?? (config.showYear !== false)
    const showCategory = responsiveShowCategory ?? (config.showCategory !== false)
    const horizontalInset = inset + (config.captionInset ?? 0)
    const centerContent = item.meta?.label ? item.meta.label : item.year

    const titleStyles = buildCaptionStyles({ element: "title", config })
    const yearStyles = buildCaptionStyles({ element: "year", config })
    const categoryStyles = buildCaptionStyles({ element: "category", config })
    const captionFontSize = resolveCaptionFontSize(
        containerWidth,
        config.fontSizeMobile,
        config.fontSizeTablet,
        config.fontSize
    )
    const captionRowMinHeight = Math.ceil(
        captionFontSize * CAPTION_OVERLAY.rowLineHeight
    )

    const hasHandoffProgress = handoffProgress !== undefined
    const progress = clamp01(handoffProgress ?? (isIncoming ? 1 : 0))
    const rowOpacity = hasHandoffProgress ? clamp01(progress / 0.88) : 1
    const rowTranslateY =
        isIncoming && hasHandoffProgress
            ? (1 - easePower2InOut(clamp01(progress / 0.7))) * -3
            : 0

    const cellMotionStyle: CSSProperties = {
        opacity: rowOpacity,
        transform: `translateY(${rowTranslateY}px)`,
        transition: hasHandoffProgress
            ? "opacity 100ms linear, transform 100ms linear"
            : undefined,
        willChange: hasHandoffProgress ? "opacity, transform" : undefined,
    }

    const showYearCell = showYear && Boolean(centerContent)
    const showCategoryCell =
        showCategory && Boolean(item.category?.trim())
    const showTitleCell = Boolean(item.title?.trim().length)

    const captionGrid = buildCaptionGridLayout(
        showTitleCell,
        showYearCell,
        showCategoryCell
    )
    const captionGap =
        containerWidth < 640
            ? Math.min(CAPTION_OVERLAY.captionGap, 14)
            : CAPTION_OVERLAY.captionGap

    const captionGridCell = (
        slot: CaptionGridSlot,
        child: ReactNode
    ): ReactNode => {
        const justifyContent =
            slot.align === "left"
                ? "flex-start"
                : slot.align === "center"
                  ? "center"
                  : "flex-end"
        return (
            <div
                key={slot.id}
                style={{
                    gridColumn: slot.column,
                    minWidth: 0,
                    minHeight: captionRowMinHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent,
                }}
            >
                <div style={{ minWidth: 0, width: "100%", maxWidth: "100%" }}>
                    {child}
                </div>
            </div>
        )
    }

    const titleTextStyle = captionCellTextStyle(
        titleStyles,
        captionFontSize,
        "left"
    )

    const titleContent = dominantHref ? (
        <>
            {fr.focusRingEnabled ? (
                <style>{`.${titleFocusClass}:focus-visible{outline:${fr.focusRingWidth}px solid ${fr.focusRingColor};outline-offset:${fr.focusRingOffset}px;}`}</style>
            ) : null}
            <a
                href={dominantHref}
                aria-label={`View ${item.title} project`}
                className={titleFocusClass}
                style={{
                    ...titleTextStyle,
                    textDecoration: "none",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    outline: fr.focusRingEnabled ? undefined : "none",
                }}
            >
                {item.title}
            </a>
        </>
    ) : (
        <span style={titleTextStyle}>{item.title}</span>
    )

    const gridCells = captionGrid
        ? captionGrid.slots.map((slot) => {
              if (slot.id === "title") {
                  return captionGridCell(slot, titleContent)
              }
              if (slot.id === "year") {
                  return captionGridCell(
                      slot,
                      <span
                          style={captionCellTextStyle(
                              yearStyles,
                              captionFontSize,
                              slot.align
                          )}
                      >
                          <span style={{ color: config.accentColor }}>
                              (
                          </span>
                          {centerContent}
                          <span style={{ color: config.accentColor }}>
                              )
                          </span>
                      </span>
                  )
              }
              return captionGridCell(
                  slot,
                  <span
                      style={captionCellTextStyle(
                          categoryStyles,
                          captionFontSize,
                          slot.align
                      )}
                  >
                      {item.category}
                  </span>
              )
          })
        : null

    // Text content layer - pointerEvents none on container, auto only on title link
    const textLayer = (
        <div
            style={{
                position: "relative",
                zIndex: 3,
                width: "100%",
                padding: `${config.paddingTop}px ${horizontalInset}px ${config.paddingBottom}px`,
                boxSizing: "border-box",
                pointerEvents: "none",
            }}
        >
            {captionGrid ? (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: captionGrid.templateColumns,
                        alignItems: "center",
                        gap: captionGap,
                        width: "100%",
                        minHeight: captionRowMinHeight,
                        padding: 0,
                        pointerEvents: "none",
                        ...cellMotionStyle,
                    }}
                >
                    {gridCells}
                </div>
            ) : null}
            <div
                aria-hidden="true"
                style={{
                    height: 1,
                    width: "100%",
                    background: CAPTION_OVERLAY.frameColor,
                    opacity: CAPTION_OVERLAY.frameOpacity,
                    marginTop: 6,
                    pointerEvents: "none",
                }}
            />
        </div>
    )

    // If textOnly, parent supplies blur/scrim via CaptionOverlayShell
    if (textOnly) {
        return textLayer
    }

    return <CaptionOverlayShell>{textLayer}</CaptionOverlayShell>
}

/** Compute fixed overlay band height from caption config */
function computeBandHeight(config: ResolvedConfig): number {
    // Text height based on font metrics
    const textHeight = config.fontSize * config.lineHeight
    // Total band height = padding top + text + padding bottom + extension
    return (
        config.paddingTop +
        textHeight +
        config.paddingBottom +
        CAPTION_OVERLAY.bandExtensionPx
    )
}

interface CaptionOverlayShellProps {
    children: ReactNode
    /** Fixed band height — scroll stage. Omit for inline/static preview. */
    height?: number
    blurPx?: number
    scrimColor?: string
    scrimOpacity?: number
    bandExtensionPx?: number
}

/** Blur + scrim shell — single overlay adapter for static preview and scroll band. */
function CaptionOverlayShell({
    children,
    height,
    blurPx = CAPTION_OVERLAY.backdropBlurPx,
    scrimColor = CAPTION_OVERLAY.scrimColor,
    scrimOpacity = CAPTION_OVERLAY.peakOpacity,
    bandExtensionPx = CAPTION_OVERLAY.bandExtensionPx,
}: CaptionOverlayShellProps) {
    const blurStyle = captionBlurOverlayStyle(blurPx)
    const scrimStyle = captionOverlayBackground(scrimColor, scrimOpacity)
    const overlayLayers = (
        <>
            <div
                style={{ ...blurStyle, position: "absolute", inset: 0, zIndex: 1 }}
                aria-hidden="true"
            />
            <div
                style={{
                    ...scrimStyle,
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                }}
                aria-hidden="true"
            />
        </>
    )

    if (height !== undefined) {
        return (
            <div
                style={{
                    position: "relative",
                    height,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                    }}
                    aria-hidden="true"
                >
                    {overlayLayers}
                </div>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 3,
                        height: height - bandExtensionPx,
                        display: "flex",
                        alignItems: "flex-start",
                    }}
                >
                    {children}
                </div>
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                paddingBottom: bandExtensionPx,
                boxSizing: "border-box",
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1,
                    pointerEvents: "none",
                }}
                aria-hidden="true"
            >
                {overlayLayers}
            </div>
            {children}
        </div>
    )
}

interface StageMetadataBarProps {
    items: ScrollerItem[]
    scrubProgress: MotionValue<number>
    count: number
    holdFraction: number
    handoffEaseFn: (t: number) => number
    config: ResolvedConfig
    captionSpring: SpringConfig
    layoutBarTop: number
    containerWidth: number
    textScale: number
}

function StageMetadataBar({
    items,
    scrubProgress,
    count,
    holdFraction,
    handoffEaseFn,
    config,
    captionSpring,
    layoutBarTop,
    containerWidth,
    textScale,
}: StageMetadataBarProps) {
    const responsiveVisibility = useMemo(
        () =>
            resolveResponsiveCaptionVisibility(
                containerWidth,
                false,
                config.showYear !== false,
                config.showCategory !== false
            ),
        [config.showCategory, config.showYear, containerWidth]
    )
    const [visualState, setVisualState] = useState<{
        mode: 'hold' | 'handoff'
        outgoingIndex: number
        incomingIndex: number
        handoffProgress: number
        dominantIndex: number
    }>({
        mode: 'hold',
        outgoingIndex: 0,
        incomingIndex: 0,
        handoffProgress: 0,
        dominantIndex: 0,
    })
    const visualStateRef = useRef(visualState)

    // Fixed band height computed from config - never changes during animation
    const bandHeight = useMemo(() => computeBandHeight(config), [config])

    useMotionValueEvent(scrubProgress, "change", (p) => {
        const segment = readScrollSegment(
            clamp01(p),
            count,
            holdFraction,
            handoffEaseFn
        )
        const roundedProgress =
            Math.round(segment.handoffEaseT * 1000) / 1000
        const prev = visualStateRef.current
        const changed =
            prev.mode !== segment.mode ||
            prev.outgoingIndex !== segment.outgoingIndex ||
            prev.incomingIndex !== segment.incomingIndex ||
            Math.round(prev.handoffProgress * 1000) / 1000 !== roundedProgress
        if (!changed) return
        const next = {
            mode: segment.mode,
            outgoingIndex: segment.outgoingIndex,
            incomingIndex: segment.incomingIndex,
            handoffProgress: segment.handoffEaseT,
            dominantIndex: dominantIndexFromSegment(segment),
        }
        visualStateRef.current = next
        startTransition(() => setVisualState(next))
    })

    const { mode, outgoingIndex, incomingIndex, handoffProgress, dominantIndex } =
        visualState
    const dominantHref = items[dominantIndex]?.href

    // Outgoing: stay at full opacity for first 10% of handoff, then fade out
    const outgoingOpacity = mode === 'handoff'
        ? 1 - handoffProgress
        : 1

    // Incoming base opacity follows handoff progress
    const incomingOpacity = mode === 'handoff'
        ? handoffProgress
        : 1

    return (
        <div
            style={{
                position: "absolute",
                top: layoutBarTop,
                left: 0,
                right: 0,
                zIndex: 999,
                pointerEvents: "none",
            }}
        >
            <CaptionOverlayShell height={bandHeight}>
                    {/* Outgoing caption - overlapping crossfade */}
                    {mode === 'handoff' && (
                        <motion.div
                            initial={false}
                            animate={{ opacity: outgoingOpacity }}
                            transition={captionSpring}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                            }}
                        >
                            <CaptionRow
                                item={items[outgoingIndex]}
                                config={config}
                                inset={config.activeInset}
                                handoffProgress={outgoingIndex === incomingIndex ? 1 : 1 - handoffProgress}
                                isIncoming={false}
                                textOnly={true}
                                dominantHref={dominantHref}
                                responsiveShowYear={responsiveVisibility.showYear}
                                responsiveShowCategory={responsiveVisibility.showCategory}
                                containerWidth={containerWidth}
                                textScale={textScale}
                            />
                        </motion.div>
                    )}

                    {/* Incoming caption - overlapping crossfade */}
                    {mode === 'handoff' && (
                        <motion.div
                            initial={false}
                            animate={{ opacity: incomingOpacity }}
                            transition={captionSpring}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                            }}
                        >
                            <CaptionRow
                                item={items[incomingIndex]}
                                config={config}
                                inset={config.activeInset}
                                handoffProgress={handoffProgress}
                                isIncoming={true}
                                textOnly={true}
                                dominantHref={dominantHref}
                                responsiveShowYear={responsiveVisibility.showYear}
                                responsiveShowCategory={responsiveVisibility.showCategory}
                                containerWidth={containerWidth}
                                textScale={textScale}
                            />
                        </motion.div>
                    )}

                    {/* Hold mode: single caption */}
                    {mode === 'hold' && (
                        <CaptionRow
                            item={items[outgoingIndex]}
                            config={config}
                            inset={config.activeInset}
                            textOnly={true}
                            dominantHref={dominantHref}
                            responsiveShowYear={responsiveVisibility.showYear}
                            responsiveShowCategory={responsiveVisibility.showCategory}
                            containerWidth={containerWidth}
                            textScale={textScale}
                        />
                    )}
            </CaptionOverlayShell>
        </div>
    )
}

// ─── Export ────────────────────────────────────────────────────────────────────

export default function Kern_CornerProjectScroller(
    props: Partial<KernCornerProjectScrollerProps>
) {
    const { style, ...restProps } = props
    const rootRef = useRef<HTMLDivElement>(null)
    const containerWidth = useMeasuredWidth(rootRef, 1200)
    const textScale = useMemo(
        () => computeContainerTextScale(containerWidth),
        [containerWidth]
    )
    const config = useMemo(
        () =>
            resolveConfig({
                ...Kern_CornerProjectScroller.defaultProps,
                ...restProps,
            }),
        [restProps]
    )

    const isCanvas = useIsOnFramerCanvas()
    const prefersReduced = useReducedMotion()
    const motionPolicy = useMemo<MotionPolicy>(
        () => ({
            prefersReduced: prefersReduced ?? false,
            isCanvas,
        }),
        [prefersReduced, isCanvas]
    )

    if (prefersReduced) {
        return (
            <div
                ref={rootRef}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: config.backgroundColor,
                    boxSizing: "border-box",
                    ...style,
                }}
            >
                <ReducedList
                    config={config}
                    containerWidth={containerWidth}
                    textScale={textScale}
                    motionPolicy={motionPolicy}
                />
            </div>
        )
    }

    if (isStaticRenderer() || isCanvas) {
        return (
            <div
                ref={rootRef}
                style={{ width: "100%", height: "100%", ...style }}
            >
                <CanvasPreview
                    config={config}
                    containerWidth={containerWidth}
                    textScale={textScale}
                    motionPolicy={motionPolicy}
                />
            </div>
        )
    }

    return (
        <div ref={rootRef} style={{ width: "100%", height: "100%", ...style }}>
            <PinnedStage
                config={config}
                containerWidth={containerWidth}
                textScale={textScale}
            />
        </div>
    )
}

Kern_CornerProjectScroller.displayName = "Kern_CornerProjectScroller"

Kern_CornerProjectScroller.defaultProps = {
    projects: PROJECTS_DEFAULTS,
    scroll: SCROLL_DEFAULTS,
    motion: MOTION_DEFAULTS,
    layout: LAYOUT_DEFAULTS,
    caption: CAPTION_DEFAULTS,
    typography: TYPOGRAPHY_DEFAULTS,
    interaction: INTERACTION_DEFAULTS,
    accessibility: ACCESSIBILITY_DEFAULTS,
}

function metadataHidden(props: KernCornerProjectScrollerProps): boolean {
    return props.caption?.show === false || props.metadata?.show === false
}

addPropertyControls(Kern_CornerProjectScroller, {
    projects: {
        type: ControlType.Object,
        title: "Projects",
        buttonTitle: "Projects",
        icon: "object",
        description: "Projects in scroll order.",
        controls: {
            items: {
                type: ControlType.Array,
                title: "Items",
                description: "Projects in scroll order. First item shows on load.",
                control: {
                    type: ControlType.Object,
                    controls: {
                        title: {
                            type: ControlType.String,
                            title: "Title",
                            defaultValue: "Project",
                            description: "Project name in the caption row.",
                        },
                        year: {
                            type: ControlType.String,
                            title: "Year",
                            defaultValue: "2024",
                            description: "Year or date shown in the center column.",
                        },
                        category: {
                            type: ControlType.String,
                            title: "Category",
                            defaultValue: "Web Design",
                            description: "Discipline or category on the right.",
                        },
                        image: {
                            type: ControlType.ResponsiveImage,
                            title: "Image",
                            description: "Hero image for this project.",
                        },
                        href: {
                            type: ControlType.Link,
                            title: "Link",
                            description: "Optional link when the project is clicked.",
                        },
                        label: {
                            type: ControlType.String,
                            title: "Center label",
                            placeholder: "Optional",
                            description:
                                "Replaces year in the caption center column (e.g. client name).",
                        },
                    },
                },
                defaultValue: DEFAULT_ITEM_FIELDS,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        buttonTitle: "Layout",
        icon: "object",
        description: "Stage size, padding, and backdrop.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: LAYOUT_DEFAULTS.backgroundColor,
                description:
                    "Stage color visible during transitions and behind images.",
            },
            activeInset: {
                type: ControlType.Number,
                title: "Stage padding",
                min: 0,
                max: 80,
                displayStepper: true,
                defaultValue: LAYOUT_DEFAULTS.activeInset,
                description: "Padding around the active hero inside the stage.",
            },
            heroShare: {
                type: ControlType.Number,
                title: "Hero size",
                min: 55,
                max: 100,
                step: 1,
                unit: "%",
                displayStepper: true,
                defaultValue: LAYOUT_DEFAULTS.heroShare,
                description:
                    "Hero vs corner preview (55–100%). At 100%, no thumbnail preview.",
            },
        },
    },
    scroll: {
        type: ControlType.Object,
        title: "Scroll",
        buttonTitle: "Scroll",
        icon: "interaction",
        description: "Pacing and handoff between projects.",
        controls: {
            handoff: {
                type: ControlType.Enum,
                title: "Handoff style",
                options: ["slideLeft", "cornerMorph"],
                optionTitles: ["Slide left", "Corner morph"],
                displaySegmentedControl: true,
                defaultValue: SCROLL_DEFAULTS.handoff,
                description:
                    "Corner morph: shrink to corner while next grows. Slide left: exit left, enter next.",
            },
            lengthPerItem: {
                type: ControlType.Number,
                title: "Scroll distance",
                unit: "vh",
                min: 80,
                max: 360,
                displayStepper: true,
                defaultValue: SCROLL_DEFAULTS.lengthPerItem,
                description:
                    "Viewport height per transition. Track = transitions × this + 1 viewport.",
            },
            holdFraction: {
                type: ControlType.Number,
                title: "Hold time",
                min: 15,
                max: 85,
                step: 1,
                unit: "%",
                displayStepper: true,
                defaultValue: SCROLL_DEFAULTS.holdFraction,
                description:
                    "How long each project stays full-bleed before handoff.",
            },
            handoffEase: {
                type: ControlType.Enum,
                title: "Handoff curve",
                options: ["soft", "standard", "sharp", "dramatic"],
                optionTitles: ["Soft", "Standard", "Sharp", "Dramatic"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: SCROLL_DEFAULTS.handoffEase,
                description:
                    "Handoff easing. Standard = uniform ease-in-out flow across all projects.",
            },
        },
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        buttonTitle: "Caption",
        icon: "object",
        description:
            "Visibility and spacing for title · year · category. Scrim and blur are built in.",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show caption",
                defaultValue: CAPTION_DEFAULTS.show,
                description: "Toggle the title · year · category overlay.",
            },
            showYear: {
                type: ControlType.Boolean,
                title: "Show year",
                defaultValue: CAPTION_DEFAULTS.showYear,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description:
                    "Center column on desktop; right column when category is hidden. All breakpoints.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
            showCategory: {
                type: ControlType.Boolean,
                title: "Show category",
                defaultValue: CAPTION_DEFAULTS.showCategory,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description:
                    "Right column. Respected on phone, tablet, and desktop.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
            paddingTop: {
                type: ControlType.Number,
                title: "Padding top",
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
                displayStepper: true,
                defaultValue: CAPTION_DEFAULTS.paddingTop,
                description: "Space above the caption text inside the overlay.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
            paddingBottom: {
                type: ControlType.Number,
                title: "Padding bottom",
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
                displayStepper: true,
                defaultValue: CAPTION_DEFAULTS.paddingBottom,
                description: "Space below the caption text inside the overlay.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
            captionInset: {
                type: ControlType.Number,
                title: "Side inset",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                displayStepper: true,
                defaultValue: CAPTION_DEFAULTS.captionInset,
                description: "Extra inset from the stage edge.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: CAPTION_DEFAULTS.accentColor,
                description: "Color for the parenthesis around the year.",
                hidden: (c: Partial<CaptionGroup>) => c.show === false,
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Caption type",
        buttonTitle: "Type",
        icon: "object",
        description: "Font, size, and color for title · year · category (shared).",
        hidden: metadataHidden,
        controls: {
            captionFont: {
                type: ControlType.Font,
                title: "Caption font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontSize: "16px",
                    variant: "Medium",
                    letterSpacing: "0.12em",
                    lineHeight: "1.12em",
                },
                description:
                    "Single font for the full caption row — family, weight, tracking, and case.",
            },
            color: {
                type: ControlType.Color,
                title: "Text color",
                defaultValue: TYPOGRAPHY_DEFAULTS.color,
                description: "Caption color (difference blend built in).",
            },
            fontSize: {
                type: ControlType.Number,
                title: "Base size",
                min: 12,
                max: 28,
                displayStepper: true,
                defaultValue: TYPOGRAPHY_DEFAULTS.fontSize,
                description:
                    "Desktop size. Tablet ~69%, mobile ~63% — scales down with viewport width.",
            },
            typeScale: {
                type: ControlType.Number,
                title: "Type scale",
                min: 0.85,
                max: 1.15,
                step: 0.01,
                defaultValue: TYPOGRAPHY_DEFAULTS.typeScale,
                description: "Uniform scale for all breakpoints.",
            },
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        buttonTitle: "Motion",
        icon: "interaction",
        description: "Scroll scrub feel and 3D entrance during handoff.",
        controls: {
            feel: {
                type: ControlType.Enum,
                title: "Feel preset",
                options: ["calm", "standard", "snappy"],
                optionTitles: ["Calm", "Standard", "Snappy"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: MOTION_DEFAULTS.feel,
                description:
                    "Scroll spring character. Calm: heavy lag. Standard: balanced. Snappy: tight follow.",
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: MOTION_DEFAULTS.smoothness,
                description: "Scroll lag on top of Feel. Higher = glidier.",
            },
            captionSpeed: {
                type: ControlType.Number,
                title: "Caption speed",
                min: 0.5,
                max: 2,
                step: 0.1,
                defaultValue: MOTION_DEFAULTS.captionSpeed,
                description: "Caption crossfade response.",
            },
            entrance: {
                type: ControlType.Enum,
                title: "3D entrance",
                options: ["none", "tilt", "fold"],
                optionTitles: ["None", "Tilt", "Fold"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: MOTION_DEFAULTS.entrance,
                description:
                    "Incoming image motion. None: flat. Tilt: Y-axis from corner. Fold: X-axis from bottom.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        buttonTitle: "Interaction",
        icon: "interaction",
        description: "Custom cursor and keyboard focus styling.",
        controls: {
            preset: {
                type: ControlType.Enum,
                title: "Cursor",
                options: ["off", "minimal", "full"],
                optionTitles: ["Off", "Minimal", "Full"],
                displaySegmentedControl: true,
                segmentedControlDirection: "vertical",
                defaultValue: INTERACTION_DEFAULTS.preset,
                description:
                    "Pointer style. Off: native. Minimal: small accent disk. Full: large accent disk.",
            },
            cursorLabel: {
                type: ControlType.String,
                title: "Cursor label",
                defaultValue: INTERACTION_DEFAULTS.cursorLabel,
                description: "Text inside the custom cursor disk.",
                hidden: (v: Partial<InteractionGroup>) =>
                    v.preset === "off" || v.preset === undefined,
            },
            focusRing: {
                type: ControlType.Boolean,
                title: "Focus ring",
                defaultValue: true,
                description: "Visible keyboard focus outline on links.",
                hidden: (v: Partial<InteractionGroup>) => v.preset === "off",
            },
        },
    },
    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        buttonTitle: "Accessibility",
        icon: "boolean",
        description:
            "Screen reader and accessibility settings for the component.",
        controls: {
            ariaLabel: {
                type: ControlType.String,
                title: "Aria label",
                defaultValue: ACCESSIBILITY_DEFAULTS.ariaLabel,
                description:
                    "Screen reader label for the project showcase region.",
            },
        },
    },
})
