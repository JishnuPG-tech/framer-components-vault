// @framerDisableUnlink
// @framerSupportedLayoutWidth: any
// @framerSupportedLayoutHeight: auto
// @framerIntrinsicWidth: 1200
// @framerIntrinsicHeight: 800
//
// Marketplace single-tsx waiver (thermo L_FILE_SIZE): scroll+expand+ribbon
// engines stay in one buyer copy-paste file per FRAMER_TRUTH. Sections below.

/**
 * Kern_CurvyProjectShowcase — Framer Marketplace code component
 * Version: 4.70.0
 *
 * Horizontal ribbon project showcase with scroll snap and expand choreography.
 * Buyer panels: Projects, Scroll, Motion, Layout, Appearance,
 * Interaction, Typography.
 *
 * Single-file seams: computeRibbonSurface, ExpandSession, MotionPolicy,
 * KERN_SPRING_TABLE, ribbonSurfaceFromInputs, expandSceneFromInputs.
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
    AnimatePresence,
    motion as fm,
    useAnimationFrame,
    useInView,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"
import {
    startTransition,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent,
    type ReactNode,
} from "react"

const PALETTE = { bg: "#F5F0E8", panel: "#E8E4DD", ink: "18, 16, 14" } as const
const SCROLL_EASE = 0.082
const SNAP_DELAY_MS = 280
const WHEEL_IMMEDIATE = 0.48
const WHEEL_TAIL_SMOOTH = 0.7
const WHEEL_TAIL_DECAY = 0.72
const RELEASE_MOMENTUM = 2.55
const WHEEL_DELTA = 0.00065
const SCROLL_SENSITIVITY_MIN = 0.28
const SCROLL_SENSITIVITY_MAX = 0.72
const SNAP_PULL = 0.015
const SNAP_VELOCITY_GATE = 0.042
const SNAP_ZONE = 0.18
const SNAP_MAGNET_GAIN = 3.1
const SNAP_WAVE_ENGAGE_MAX = 0.42
const MOMENTUM_DECAY = 0.86
const MOMENTUM_MIN = 0.18
const IDLE_WHEEL_GATE = 0.001
const VELOCITY_EASE = 0.009
const VELOCITY_DECAY = 0.72
const VELOCITY_COAST_DECAY = 0.76
const MAX_SCROLL_VELOCITY = 0.2
const EXPAND_VELOCITY_GATE = 0.032
const EXPAND_SCROLL_LOCK = 0.03
const EXPAND_COLLAPSE_SCROLL_UNLOCK = 0.032
const EXPAND_VISUAL_DONE = 0.012
const EXPAND_VISUAL_SLOT_DONE = 0.012
const EXPAND_SLOT_RELEASE = 0.012
const EXPAND_COLLAPSE_TAIL_SPAN = 0.07
const EXPAND_SETTLE_EPS = 0.04
const EXPAND_MOTION_TAIL = 0.00008
const EXPAND_COLLAPSE_COOLDOWN_MS = 520
const EXPAND_AUTO_EXPAND_SETTLE = 0.018
const EXPAND_SPATIAL_POWER = 1.22
const EXPAND_NEIGHBOR_EXIT_SPAN = 0.34
const EXPAND_NEIGHBOR_STAGGER = 0.14
const KINETIC_GATE_RESTORE = 0.14
const KINETIC_GATE_MUTE = 0.3
const EXPAND_TEXT_THRESHOLD = 0.48
const EXPAND_SCRIM_THRESHOLD = 0.05
const EXPAND_NEIGHBOR_HIDE = 0.003
const EXPAND_WAVE_BYPASS = 0.006
const EXPAND_CLOSE_THRESHOLD = 0.12
const HERO_DIRECT_SCROLL_GATE = 0.042
const RIBBON_VIEW_ENTER_STRIDE = 0.48
const EXPAND_KINETIC_HOLD_MS = 420
const Z_RIBBON = 2
const Z_EXPAND_BACKDROP = 18
const Z_EXPAND_VEIL = 24
const Z_EXPAND_CARD = 30
const Z_SCRIM = 26
const Z_COPY = 5
const Z_COPY_EXPAND = 32
const Z_CURSOR = 42
const CLICK_DRAG_THRESHOLD = 10
const CURSOR_LABEL_OFFSET_DEFAULT = 10
const GRAIN_EDGE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

type KernSpringPreset =
    | "editorial"
    | "reveal"
    | "line"
    | "snap"
    | "expand"
    | "cursor"

interface KernSpringConfig {
    stiffness: number
    damping: number
    mass: number
    restDelta?: number
    restSpeed?: number
}

const KERN_SPRING_TABLE: Record<KernSpringPreset, KernSpringConfig> = {
    editorial: { stiffness: 90, damping: 18, mass: 1.1 },
    reveal: { stiffness: 128, damping: 22, mass: 0.92 },
    line: { stiffness: 168, damping: 26, mass: 0.95 },
    snap: { stiffness: 156, damping: 26, mass: 0.98 },
    expand: {
        stiffness: 560,
        damping: 62,
        mass: 0.38,
        restDelta: 0.004,
        restSpeed: 0.02,
    },
    cursor: { stiffness: 320, damping: 30, mass: 0.78 },
}

type KernSpringTransitionPreset = "editorial" | "reveal" | "line" | "snap"

function getSpring(preset: KernSpringPreset): KernSpringConfig {
    return KERN_SPRING_TABLE[preset]
}

function springTransition(preset: KernSpringTransitionPreset): {
    type: "spring"
    stiffness: number
    damping: number
    mass: number
} {
    const { stiffness, damping, mass } = getSpring(preset)
    return { type: "spring", stiffness, damping, mass }
}
type FramerImageInput =
    | string
    | { src?: string; url?: string; alt?: string; value?: string | { url?: string } }
    | null
    | undefined

const FRAMER_DEMO_IMAGE_URLS = [
    "https://framerusercontent.com/images/ABvw8qPzgql8LyBshkK4ZyJ6cE.jpeg",
    "https://framerusercontent.com/images/CKBg3wvBJD0TvLqSmWKkI9byIk.png",
    "https://framerusercontent.com/images/ncSt4ceVIiGesed0e5jsBzPgsfQ.jpeg",
    "https://framerusercontent.com/images/v5xm0qirgJNZlmbk26aCw9Q90oU.png",
    "https://framerusercontent.com/images/Y0osnfLWEVCRQ4F7WfEul43Hw.jpg",
    "https://framerusercontent.com/images/ZvYUrSCeM9EyherEg66z8553jtw.png",
    "https://framerusercontent.com/images/L7vemtjqtygl8Zdbk4OAQsEZI.png",
    "https://framerusercontent.com/images/Af9cMtnBdnTCVnVFhfCflPZE.jpeg",
] as const

interface ProjectItemInput {
    index?: string
    title?: string
    subtitle?: string
    description?: string
    tags?: string
    year?: string
    image?: FramerImageInput
}

interface ProjectItem {
    index: string
    title: string
    subtitle: string
    description: string
    tags: string
    year: string
    image: string
}

interface ScrollGroup {
    sensitivity: number
    snapDelay: number
    scrollEase: number
}

type ExpandFit = "cover" | "contain" | "stretch"

interface MotionGroup {
    intensity: number
    focusDepth: number
}

interface LayoutGroup {
    cardWidthPercent: number
    cardHeightPercent: number
    gapPercent: number
    borderRadius: number
    expandFit: ExpandFit
}

interface StyleGroup {
    backgroundColor: string
    blendUI: boolean
    showVignette: boolean
    showGrain: boolean
    perspective: number
}

interface InteractionGroup {
    showProjectCursor: boolean
    cursorLabelOffset: number
}

interface TypographyGroup {
    titleFont: CSSProperties
    metaFont: CSSProperties
    bodyFont: CSSProperties
    fontSizeTablet: number
    fontSizeMobile: number
}

interface KernCurvyProjectShowcaseProps {
    projects: ProjectItemInput[]
    scroll: ScrollGroup
    motion: MotionGroup
    layout: LayoutGroup
    appearance: StyleGroup
    interaction: InteractionGroup
    typography: TypographyGroup
    ariaLabel: string
    style?: CSSProperties
}

interface Props extends KernCurvyProjectShowcaseProps {}

// --- Ribbon math + surface Module ---

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n))
}

function scrollSensitivityNorm(value: number): number {
    return clamp(value, SCROLL_SENSITIVITY_MIN, SCROLL_SENSITIVITY_MAX)
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1)
    return t * t * (3 - 2 * t)
}

function frameLerp(
    current: number,
    target: number,
    ease: number,
    frameFactor: number
): number {
    const t = 1 - Math.pow(1 - clamp(ease, 0, 1), frameFactor)
    return current + (target - current) * t
}

function expandSpatialT(ep: number): number {
    const c = clamp(ep, 0, 1)
    return easeSmoothstep01(1 - Math.pow(1 - c, EXPAND_SPATIAL_POWER))
}

function expandSpatialMix(ep: number): number {
    return expandSpatialT(ep)
}

interface ExpandImageChoreo {
    frameSpatial: number
    innerScale: number
    thumbMix: number
    liftY: number
    blurPx: number
    brightness: number
    saturate: number
}

function expandImageChoreo(ep: number, _goal: number): ExpandImageChoreo {
    const c = clamp(ep, 0, 1)
    if (c < 0.0005) {
        return {
            frameSpatial: 0,
            innerScale: 1,
            thumbMix: 1,
            liftY: 0,
            blurPx: 0,
            brightness: 1,
            saturate: 1,
        }
    }
    const frameSpatial = expandSpatialT(c)
    return {
        frameSpatial,
        innerScale: 1,
        thumbMix: 1,
        liftY: 0,
        blurPx: 0,
        brightness: 1,
        saturate: 1,
    }
}

function expandNeighborPresence(ep: number): number {
    const fs = expandSpatialMix(ep)
    const hidden = clamp(fs / EXPAND_NEIGHBOR_EXIT_SPAN, 0, 1)
    return clamp(1 - easeSmoothstep01(hidden), 0, 1)
}

function expandNeighborLocalA(
    presence: number,
    centerDist: number
): number {
    const absence = 1 - presence
    if (centerDist <= 1.2) {
        return Math.pow(absence, 0.9)
    }
    const distort = 1 - Math.pow(1 - absence, 1.45)
    const stagger = clamp(centerDist / 2.6, 0, 1) * EXPAND_NEIGHBOR_STAGGER
    return clamp((distort - stagger) / (1 - EXPAND_NEIGHBOR_STAGGER), 0, 1)
}

function neighborChoreoHide(ep: number, centerDist: number): number {
    const presence = expandNeighborPresence(ep)
    const localA = expandNeighborLocalA(presence, centerDist)
    return Math.pow(localA, 0.56)
}

function expandSpringSettled(ep: number, goal: number): boolean {
    return Math.abs(goal - ep) < EXPAND_SETTLE_EPS
}

function expandNeighborsSettled(ep: number): boolean {
    return expandNeighborPresence(ep) > 0.92
}

function expandCollapseReady(ep: number, goal: number, collapseTail: number): boolean {
    return (
        goal < 0.05 &&
        ep < EXPAND_SLOT_RELEASE &&
        Math.abs(goal - ep) < EXPAND_SETTLE_EPS &&
        collapseTail > 0.94
    )
}

function expandCollapseTailMix(
    ep: number,
    goal: number,
    isSlot: boolean
): number {
    if (!isSlot || goal >= 0.05 || ep <= 0 || ep >= EXPAND_COLLAPSE_TAIL_SPAN) {
        return 0
    }
    return easeSmoothstep01(1 - ep / EXPAND_COLLAPSE_TAIL_SPAN)
}

function ribbonImgShellSuppress(
    ep: number,
    goal: number,
    isSlot: boolean,
    slot: number,
    collapseTail: number
): number {
    if (isSlot && slot >= 0) {
        if (goal > 0.05) return 1
        if (collapseTail > 0) return clamp(1 - collapseTail, 0, 1)
        if (ep > EXPAND_WAVE_BYPASS) return 1
        return 0
    }
    if (ep > EXPAND_WAVE_BYPASS && goal > 0.05) return 1
    return 0
}

function expandSlotShellScales(
    cfg: RibbonCardMotionConfig,
    frameSpatial: number
): { scaleX: number; scaleY: number } {
    const t = easeSmoothstep01(clamp(frameSpatial, 0, 1))
    if (cfg.expandFit === "stretch") {
        return {
            scaleX: lerp(1, cfg.expandSX, t),
            scaleY: lerp(1, cfg.expandSY, t),
        }
    }
    const uniform = lerp(
        1,
        expandTargetScale(cfg.expandSX, cfg.expandSY, cfg.expandFit),
        t
    )
    return { scaleX: uniform, scaleY: uniform }
}

function expandTargetScale(
    sx: number,
    sy: number,
    fit: ExpandFit
): number {
    switch (fit) {
        case "cover":
            return Math.max(sx, sy)
        case "contain":
            return Math.min(sx, sy)
        case "stretch":
            return 1
        default: {
            const never: never = fit
            return never
        }
    }
}

function easeOutExpo(t: number): number {
    const c = clamp(t, 0, 1)
    return c === 1 ? 1 : 1 - Math.pow(2, -10 * c)
}

function expandWaveMix(ep: number, _goal: number): number {
    const fs = expandSpatialMix(ep)
    return Math.pow(clamp(1 - fs, 0, 1), 1.38)
}

function expandInputLocked(
    isExpanded: boolean,
    ep: number,
    visualSlotOpen: boolean
): boolean {
    return (
        isExpanded ||
        visualSlotOpen ||
        ep > EXPAND_COLLAPSE_SCROLL_UNLOCK
    )
}

interface MotionPolicyInput {
    isCanvas: boolean
    isExportStatic: boolean
    prefersReduced: boolean
    isInView: boolean
    showProjectCursor: boolean
}

interface MotionPolicy {
    live: boolean
    visual: boolean
    cursor: boolean
    reduced: boolean
    canvas: boolean
    scrollPhysics: boolean
}

function buildMotionPolicy(input: MotionPolicyInput): MotionPolicy {
    const visual =
        !input.prefersReduced &&
        !input.isExportStatic &&
        (input.isCanvas || input.isInView)
    const live =
        !input.isCanvas &&
        !input.isExportStatic &&
        !input.prefersReduced &&
        input.isInView
    const cursor =
        input.showProjectCursor &&
        !input.prefersReduced &&
        (live || input.isCanvas)
    return {
        live,
        visual,
        cursor,
        reduced: input.prefersReduced,
        canvas: input.isCanvas,
        scrollPhysics: live || (input.isCanvas && visual),
    }
}

function fontFace(font: CSSProperties): CSSProperties {
    const { color, ...rest } = font
    void color
    return rest
}

interface RibbonHoverCursorProps {
    title?: string
    x: MotionValue<number>
    y: MotionValue<number>
    offset: number
    labelColor: string
    metaFont: CSSProperties
    blendUI: boolean
    visible: boolean
}

function ribbonCursorLabelStyle(
    metaFont: CSSProperties,
    labelColor: string,
    blendUI: boolean
): CSSProperties {
    return {
        ...fontFace(metaFont),
        color: labelColor,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        lineHeight: 1,
        textShadow: blendUI
            ? "none"
            : `0 1px 14px rgba(${PALETTE.ink}, 0.22)`,
    }
}

interface RibbonCursorShellProps {
    x: MotionValue<number>
    y: MotionValue<number>
    offset: number
    blendUI: boolean
    visible: boolean
    children: ReactNode
}

function RibbonCursorShell({
    x,
    y,
    offset,
    blendUI,
    visible,
    children,
}: RibbonCursorShellProps) {
    return (
        <fm.div
            aria-hidden
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.1 }}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                x,
                y,
                zIndex: Z_CURSOR,
                pointerEvents: "none",
                mixBlendMode: blendUI ? "difference" : "normal",
                willChange: "transform, opacity",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transform: `translate3d(${offset}px, ${offset}px, 0)`,
                    whiteSpace: "nowrap",
                }}
            >
                {children}
            </div>
        </fm.div>
    )
}

interface RibbonCloseCursorProps {
    x: MotionValue<number>
    y: MotionValue<number>
    offset: number
    labelColor: string
    metaFont: CSSProperties
    blendUI: boolean
    visible: boolean
}

function RibbonCloseCursor({
    x,
    y,
    offset,
    labelColor,
    metaFont,
    blendUI,
    visible,
}: RibbonCloseCursorProps) {
    return (
        <RibbonCursorShell
            x={x}
            y={y}
            offset={offset}
            blendUI={blendUI}
            visible={visible}
        >
            <span
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 9,
                    height: 9,
                    flexShrink: 0,
                }}
            >
                <svg
                    width="9"
                    height="9"
                    viewBox="0 0 9 9"
                    fill="none"
                    aria-hidden
                >
                    <path
                        d="M1.25 1.25L7.75 7.75M7.75 1.25L1.25 7.75"
                        stroke={labelColor}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                    />
                </svg>
            </span>
            <span style={ribbonCursorLabelStyle(metaFont, labelColor, blendUI)}>
                Close
            </span>
        </RibbonCursorShell>
    )
}

function RibbonHoverCursor({
    title,
    x,
    y,
    offset,
    labelColor,
    metaFont,
    blendUI,
    visible,
}: RibbonHoverCursorProps) {
    return (
        <RibbonCursorShell
            x={x}
            y={y}
            offset={offset}
            blendUI={blendUI}
            visible={visible}
        >
            <span
                style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: labelColor,
                    boxShadow: blendUI
                        ? "none"
                        : `0 0 0 1px rgba(${PALETTE.ink}, 0.08)`,
                    flexShrink: 0,
                }}
            />
            <AnimatePresence initial={false}>
                {title ? (
                    <fm.span
                        key={title}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                        style={ribbonCursorLabelStyle(
                            metaFont,
                            labelColor,
                            blendUI
                        )}
                    >
                        {title}
                    </fm.span>
                ) : null}
            </AnimatePresence>
        </RibbonCursorShell>
    )
}

function expandCursorActive(
    session: ExpandSession,
    ep: number,
    goal: number
): boolean {
    return (
        goal > 0.5 &&
        ep >= EXPAND_CLOSE_THRESHOLD &&
        expandSessionExpanded(session) &&
        !expandSessionCollapsing(session)
    )
}

function parseTags(raw: string): string[] {
    return raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
}

function resolveImageUrl(raw: FramerImageInput): string {
    if (typeof raw === "string") return raw.trim()
    if (!raw || typeof raw !== "object") return ""
    if (typeof raw.url === "string" && raw.url.trim()) return raw.url.trim()
    if (typeof raw.src === "string" && raw.src.trim()) return raw.src.trim()
    if (typeof raw.value === "string" && raw.value.trim()) return raw.value.trim()
    if (
        raw.value &&
        typeof raw.value === "object" &&
        typeof raw.value.url === "string" &&
        raw.value.url.trim()
    ) {
        return raw.value.url.trim()
    }
    return ""
}

function demoImageUrl(index: number): string {
    return (
        FRAMER_DEMO_IMAGE_URLS[index % FRAMER_DEMO_IMAGE_URLS.length] ??
        FRAMER_DEMO_IMAGE_URLS[0]
    )
}

function normalizeProject(raw: ProjectItemInput, i: number): ProjectItem {
    const image = resolveImageUrl(raw.image) || demoImageUrl(i)
    return {
        index: raw.index?.trim() || String(i + 1).padStart(2, "0"),
        title: raw.title?.trim() || "Project",
        subtitle: raw.subtitle?.trim() || "Category",
        description: raw.description?.trim() || "Short description.",
        tags: raw.tags?.trim() || "",
        year: raw.year?.trim() || "",
        image,
    }
}

function normalizeProjects(raw: ProjectItemInput[]): ProjectItem[] {
    if (raw.length === 0) return []
    return raw.map((item, i) => normalizeProject(item, i))
}

function wrapIndex(raw: number, count: number): number {
    return ((raw % count) + count) % count
}

function ribbonHeroIndex(count: number): number {
    if (count <= 1) return 0
    return Math.min(Math.round((count - 1) / 2), count - 1)
}

function preloadProjectImages(projects: ProjectItem[]): void {
    if (typeof Image === "undefined") return
    for (const project of projects) {
        const url = project.image
        if (!url) continue
        const img = new Image()
        img.decoding = "async"
        img.src = url
    }
}

function wrapScrollOffset(offset: number, totalW: number): number {
    if (totalW <= 0) return offset
    let wrapped = offset % totalW
    if (wrapped < 0) wrapped += totalW
    return wrapped
}

function ribbonWrappedLinearX(
    index: number,
    offset: number,
    stride: number,
    totalW: number
): number {
    if (totalW <= 0) return index * stride - offset
    const raw = index * stride - offset
    const half = totalW * 0.5
    return ((raw + half) % totalW + totalW) % totalW - half
}

function ribbonCardVerticalBand(
    stageHeight: number,
    cardHeight: number
): { min: number; max: number } {
    const center = stageHeight / 2
    const half = cardHeight * 0.63
    return { min: center - half, max: center + half }
}

function ribbonCardHitAtClient(
    clientX: number,
    clientY: number,
    stageLeft: number,
    stageTop: number,
    stageWidth: number,
    stageHeight: number,
    scroll: number,
    stride: number,
    cardWidth: number,
    cardHeight: number,
    count: number,
    totalW: number
): number {
    const localX = clientX - stageLeft
    const localY = clientY - stageTop
    const band = ribbonCardVerticalBand(stageHeight, cardHeight)
    if (localY < band.min || localY > band.max) return -1

    let bestIdx = -1
    let bestDist = Infinity

    for (let i = 0; i < count; i++) {
        const lx = ribbonWrappedLinearX(i, scroll, stride, totalW)
        const cardLeft = stageWidth / 2 + lx - cardWidth / 2
        const cardRight = cardLeft + cardWidth
        if (localX < cardLeft || localX > cardRight) continue
        const centerDist = Math.abs(localX - (cardLeft + cardWidth / 2))
        if (centerDist < bestDist) {
            bestDist = centerDist
            bestIdx = i
        }
    }

    return bestIdx
}

interface RibbonCardMotionConfig {
    index: number
    replica: number
    cardWidth: number
    cardHeight: number
    borderRadius: number
    stride: number
    totalW: number
    stageWidth: number
    stageHeight: number
    expandSX: number
    expandSY: number
    expandFit: ExpandFit
    intensity: number
    focusDepth: number
    canvasFill: boolean
    shouldAnimate: boolean
}

function ribbonViewLimit(
    stageWidth: number,
    cardWidth: number,
    canvasFill: boolean
): number {
    if (canvasFill) return stageWidth * 0.95 + cardWidth
    return stageWidth * 0.56 + cardWidth * 0.55
}

function ribbonViewCullMix(
    lx: number,
    viewLimit: number,
    stride: number
): { enterMix: number; hardCull: boolean } {
    const dist = Math.abs(lx)
    const enterBand = Math.max(stride * RIBBON_VIEW_ENTER_STRIDE, 1)
    const outer = viewLimit + enterBand
    if (dist > outer) {
        return { enterMix: 0, hardCull: true }
    }
    if (dist <= viewLimit) {
        return { enterMix: 1, hardCull: false }
    }
    const enterMix = clamp(1 - (dist - viewLimit) / enterBand, 0, 1)
    return { enterMix, hardCull: false }
}

function ribbonExpandWaveMuted(
    slot: number,
    ep: number,
    goal: number
): boolean {
    if (goal > 0.015) return true
    if (slot >= 0 && ep > EXPAND_COLLAPSE_TAIL_SPAN) return true
    if (ep > EXPAND_WAVE_BYPASS && goal > 0.05) return true
    return false
}

function ribbonIsSlotCard(
    slot: number,
    index: number,
    replica: number
): boolean {
    return slot === index && replica === 0
}

function ribbonExpandEngaged(
    ep: number,
    goal: number,
    activeSlot: number
): boolean {
    if (activeSlot >= 0) return true
    return goal > 0.5 && ep > 0.0001
}

function ribbonNeighborHidden(
    ep: number,
    goal: number,
    activeSlot: number,
    index: number,
    replica: number
): boolean {
    if (ribbonIsSlotCard(activeSlot, index, replica)) return false
    if (activeSlot >= 0) return false
    if (!ribbonExpandEngaged(ep, goal, activeSlot)) return false
    return true
}

function isAdjacentNeighbor(centerDist: number): boolean {
    return centerDist <= 1.15
}

function neighborExpandHide(ep: number, centerDist: number): number {
    if (isAdjacentNeighbor(centerDist)) {
        return clamp(ep / 0.075, 0, 1)
    }
    return neighborChoreoHide(ep, centerDist)
}

interface RibbonWaveSurface {
    rotateX: number
    rotateY: number
    rotateZ: number
    translateZ: number
    translateY: number
    scaleX: number
    scaleY: number
    skewX: number
    skewY: number
    filter: string
    imgScale: number
}

const RIBBON_WAVE_FLAT: RibbonWaveSurface = {
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    translateZ: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    filter: "none",
    imgScale: 1,
}

/** Proportional bowl wave on image container — edge→center, article stride fixed. */
const RIBBON_BOWL_EDGE_SCALE_X = 0.88
const RIBBON_BOWL_CENTER_SCALE_X = 1.06
const RIBBON_BOWL_EDGE_FRAME = 0.56
const RIBBON_BOWL_CENTER_FRAME = 1.26
const RIBBON_BOWL_EDGE_SCALE_Y = RIBBON_BOWL_EDGE_FRAME
const RIBBON_BOWL_CENTER_SCALE_Y = RIBBON_BOWL_CENTER_FRAME
const RIBBON_BOWL_LATERAL_ROT_Y = 5.6
const RIBBON_BOWL_PITCH_ROT_X = 4.4
const RIBBON_BOWL_DEPTH_Z = 14
const RIBBON_ARC_SCROLL_BOOST = 0.22
const RIBBON_ARC_HALF_STRIDES_MIN = 0.92
const RIBBON_ARC_HALF_STRIDES_MAX = 1.42
const RIBBON_ARC_VIEWPORT_STRIDE_RATIO = 0.34
const RIBBON_ARC_EDGE_FLOOR = 0.14
const RIBBON_ARC_BOWL_POWER = 0.68
const RIBBON_ARC_INTENSITY_REF = 28
const RIBBON_ARC_INTENSITY_MAX = 45
const RIBBON_WAVE_VEL_ON = 0.00035
const RIBBON_WAVE_VEL_FULL = 0.038
const RIBBON_WAVE_ENGAGE_ATTACK = 0.14
const RIBBON_WAVE_ENGAGE_RELEASE = 0.34
const RIBBON_WAVE_ENGAGE_IDLE_DECAY = 0.44
const RIBBON_CURVE_DIR = 1

function easeSmoothstep01(x: number): number {
    const t = clamp(x, 0, 1)
    return t * t * (3 - 2 * t)
}

function ribbonWaveScrollFade(engage: number): number {
    const gate = smoothstep(RIBBON_WAVE_VEL_ON, RIBBON_WAVE_VEL_FULL, engage)
    return easeSmoothstep01(gate)
}

function ribbonWaveScrollAccent(scrollFade: number, bowl: number): number {
    return 1 + scrollFade * RIBBON_ARC_SCROLL_BOOST * bowl
}

function ribbonIntensityMix(intensity: number): number {
    return clamp(
        intensity / RIBBON_ARC_INTENSITY_REF,
        0,
        RIBBON_ARC_INTENSITY_MAX / RIBBON_ARC_INTENSITY_REF
    )
}

function ribbonWaveMotionWeight(
    intensity: number,
    km: number
): number {
    return ribbonIntensityMix(intensity) * km
}

function ribbonArcHalfSpan(cfg: RibbonCardMotionConfig): number {
    const unit = Math.max(cfg.stride, 1)
    const viewLimit = ribbonViewLimit(
        cfg.stageWidth,
        cfg.cardWidth,
        cfg.canvasFill
    )
    const visibleCards = Math.max(1.25, (viewLimit * 2) / unit)
    const halfStrides = clamp(
        visibleCards * RIBBON_ARC_VIEWPORT_STRIDE_RATIO,
        RIBBON_ARC_HALF_STRIDES_MIN,
        RIBBON_ARC_HALF_STRIDES_MAX
    )
    return unit * halfStrides
}

function ribbonArcNorm(
    lx: number,
    cfg: RibbonCardMotionConfig
): number {
    const halfSpan = ribbonArcHalfSpan(cfg)
    return clamp(lx / halfSpan, -1, 1)
}

function ribbonArcSurfaceMix(
    lx: number,
    cfg: RibbonCardMotionConfig
): number {
    const t = ribbonArcNorm(lx, cfg)
    const arc = Math.cos(t * Math.PI * 0.5)
    const bowl = Math.pow(Math.max(0, arc), RIBBON_ARC_BOWL_POWER)
    const mixed = lerp(RIBBON_ARC_EDGE_FLOOR, 1, bowl)
    return easeSmoothstep01(mixed)
}

function ribbonWaveVisibleStrideSteps(cfg: RibbonCardMotionConfig): number {
    const halfSpan = ribbonArcHalfSpan(cfg)
    const unit = Math.max(cfg.stride, 1)
    return clamp(halfSpan / unit, 2.2, 4.2)
}

function ribbonWaveScaleYAtStride(slot: number, maxSteps: number): number {
    const u = clamp(slot / maxSteps, 0, 1)
    const ratio = RIBBON_BOWL_EDGE_SCALE_Y / RIBBON_BOWL_CENTER_SCALE_Y
    return RIBBON_BOWL_CENTER_SCALE_Y * Math.pow(ratio, u)
}

function ribbonWaveScaleXAtStride(slot: number, maxSteps: number): number {
    const u = clamp(slot / maxSteps, 0, 1)
    const ratio = RIBBON_BOWL_EDGE_SCALE_X / RIBBON_BOWL_CENTER_SCALE_X
    return RIBBON_BOWL_CENTER_SCALE_X * Math.pow(ratio, u)
}

/** Geometric stride tiers — same % height drop per card step. */
function ribbonWaveStrideScaleY(
    lx: number,
    cfg: RibbonCardMotionConfig
): number {
    const unit = Math.max(cfg.stride, 1)
    const dist = Math.abs(lx) / unit
    const maxSteps = ribbonWaveVisibleStrideSteps(cfg)
    const steps = clamp(dist, 0, maxSteps)
    const i0 = Math.floor(steps)
    const frac = easeSmoothstep01(steps - i0)
    const i1 = Math.min(i0 + 1, Math.ceil(maxSteps))
    return lerp(
        ribbonWaveScaleYAtStride(i0, maxSteps),
        ribbonWaveScaleYAtStride(i1, maxSteps),
        frac
    )
}

function ribbonWaveStrideScaleX(
    lx: number,
    cfg: RibbonCardMotionConfig
): number {
    const unit = Math.max(cfg.stride, 1)
    const dist = Math.abs(lx) / unit
    const maxSteps = ribbonWaveVisibleStrideSteps(cfg)
    const steps = clamp(dist, 0, maxSteps)
    const i0 = Math.floor(steps)
    const frac = easeSmoothstep01(steps - i0)
    const i1 = Math.min(i0 + 1, Math.ceil(maxSteps))
    return lerp(
        ribbonWaveScaleXAtStride(i0, maxSteps),
        ribbonWaveScaleXAtStride(i1, maxSteps),
        frac
    )
}

function ribbonWaveArcProportion(
    lx: number,
    cfg: RibbonCardMotionConfig
): number {
    const norm = ribbonArcNorm(lx, cfg)
    const radial = 1 - Math.abs(norm)
    const a = easeSmoothstep01(radial)
    const b = easeSmoothstep01(a)
    return easeSmoothstep01(b)
}

function ribbonWaveProportionalScales(
    lx: number,
    cfg: RibbonCardMotionConfig
): { scaleX: number; scaleY: number } {
    const spread = ribbonWaveScaleSpread(cfg)
    const targetY = ribbonWaveStrideScaleY(lx, cfg)
    const targetX = ribbonWaveStrideScaleX(lx, cfg)
    return {
        scaleX: lerp(1, targetX, spread),
        scaleY: lerp(1, targetY, spread),
    }
}

function ribbonWaveScaleSpread(cfg: RibbonCardMotionConfig): number {
    return clamp(cfg.focusDepth * ribbonIntensityMix(cfg.intensity), 0, 1)
}

/** Concave arc + proportional container scales; tilt/Z scroll-accented. */
function ribbonConcaveWaveSurface(
    cfg: RibbonCardMotionConfig,
    lx: number,
    km: number,
    waveEngage: number
): RibbonWaveSurface {
    if (cfg.intensity <= 0 || cfg.focusDepth <= 0) {
        return RIBBON_WAVE_FLAT
    }

    const bowl = ribbonArcSurfaceMix(lx, cfg)
    const norm = ribbonArcNorm(lx, cfg)
    const { scaleX, scaleY } = ribbonWaveProportionalScales(lx, cfg)
    const waveT = ribbonWaveArcProportion(lx, cfg)

    if (km <= 0) {
        return {
            ...RIBBON_WAVE_FLAT,
            scaleX,
            scaleY,
        }
    }

    const scrollFade = ribbonWaveScrollFade(waveEngage)
    const arcWeight = ribbonWaveMotionWeight(cfg.intensity, km) * cfg.focusDepth
    const motionStrength = arcWeight * ribbonWaveScrollAccent(scrollFade, bowl)
    const restKinetic = ribbonIntensityMix(cfg.intensity) * cfg.focusDepth * 0.2
    const kineticMix = cfg.canvasFill
        ? 1
        : Math.max(restKinetic, scrollFade)
    const frameSpan = RIBBON_BOWL_CENTER_FRAME - RIBBON_BOWL_EDGE_FRAME
    const unity = clamp(
        frameSpan > 0.001
            ? (scaleY - RIBBON_BOWL_EDGE_FRAME) / frameSpan
            : waveT,
        0,
        1.12
    )

    return {
        rotateX:
            unity *
            RIBBON_BOWL_PITCH_ROT_X *
            RIBBON_CURVE_DIR *
            motionStrength *
            kineticMix,
        rotateY:
            norm *
            waveT *
            RIBBON_BOWL_LATERAL_ROT_Y *
            motionStrength *
            RIBBON_CURVE_DIR *
            kineticMix,
        rotateZ:
            norm * waveT * 0.42 * motionStrength * RIBBON_CURVE_DIR * kineticMix,
        translateZ: waveT * motionStrength * RIBBON_BOWL_DEPTH_Z * kineticMix,
        translateY: 0,
        scaleX,
        scaleY,
        skewX: 0,
        skewY: 0,
        filter: "none",
        imgScale: 1,
    }
}

type ExpandPhase = "ribbon" | "expanding" | "collapsing"

interface ExpandSession {
    phase: ExpandPhase
    slot: number
}

const RIBBON_EXPAND_SESSION: ExpandSession = { phase: "ribbon", slot: -1 }

function expandSessionExpanded(session: ExpandSession): boolean {
    return session.phase === "expanding"
}

function expandSessionCollapsing(session: ExpandSession): boolean {
    return session.phase === "collapsing"
}

function expandIsVisuallyOpen(
    session: ExpandSession,
    ep: number,
    goal: number,
    visualSlot: number
): boolean {
    return (
        expandSessionExpanded(session) ||
        expandSessionCollapsing(session) ||
        visualSlot >= 0 ||
        goal > 0.05 ||
        ep > 0.045
    )
}

function expandAutoExpandBlocked(
    session: ExpandSession,
    ep: number,
    goal: number,
    visualSlot: number,
    lastCollapseMs: number,
    now: number
): boolean {
    if (expandSessionExpanded(session) || expandSessionCollapsing(session)) {
        return true
    }
    if (expandIsVisuallyOpen(session, ep, goal, visualSlot)) return true
    if (visualSlot >= 0) return true
    if (ep > EXPAND_AUTO_EXPAND_SETTLE || goal > EXPAND_AUTO_EXPAND_SETTLE) {
        return true
    }
    if (now - lastCollapseMs < EXPAND_COLLAPSE_COOLDOWN_MS) return true
    return false
}

function expandSessionScrollLocked(
    session: ExpandSession,
    _ep: number
): boolean {
    return (
        session.phase === "expanding" || session.phase === "collapsing"
    )
}

interface ExpandScene {
    slot: number
    ep: number
    goal: number
    choreo: ExpandImageChoreo
}

function readExpandScene(
    slotRaw: number,
    ep: number,
    goal: number
): ExpandScene {
    const slot = slotRaw < 0 ? -1 : Math.round(slotRaw)
    return { slot, ep, goal, choreo: expandImageChoreo(ep, goal) }
}

interface ExpandSceneCache {
    sig: string
    scene: ExpandScene
}

function expandSceneFromInputs(
    slotRaw: number,
    ep: number,
    goal: number,
    cache: { current: ExpandSceneCache | null }
): ExpandScene {
    const sig = `${slotRaw}|${ep}|${goal}`
    if (cache.current?.sig === sig) return cache.current.scene
    const scene = readExpandScene(slotRaw, ep, goal)
    cache.current = { sig, scene }
    return scene
}

function expandScrimOpacityFromScene(scene: ExpandScene): number {
    const fs = scene.choreo.frameSpatial
    if (fs < EXPAND_SCRIM_THRESHOLD + 0.06) return 0
    const raw = clamp(
        (fs - (EXPAND_SCRIM_THRESHOLD + 0.06)) /
            (1 - EXPAND_SCRIM_THRESHOLD - 0.06),
        0,
        1
    )
    return easeSmoothstep01(raw)
}

function expandBackdropOpacityFromScene(scene: ExpandScene): number {
    if (scene.slot < 0 || scene.ep < 0.006) return 0
    return lerp(0, 0.82, easeSmoothstep01(scene.choreo.frameSpatial))
}

function ribbonLayerOpacityFromScene(_scene: ExpandScene): number {
    return 1
}

function ribbonTiltXFromScene(_scene: ExpandScene): number {
    return 0
}

function ribbonBreathFromScene(_scene: ExpandScene): number {
    return 1
}

function expandVeilOpacityFromScene(_scene: ExpandScene): number {
    return 0
}

function expandVeilScaleFromScene(scene: ExpandScene): number {
    if (scene.slot < 0) return 1.18
    return scene.choreo.innerScale
}

function expandVeilYFromScene(scene: ExpandScene, stageHeight: number): number {
    if (scene.slot < 0) return 0
    return scene.choreo.liftY * stageHeight * 0.14
}

function expandVeilFilterFromScene(scene: ExpandScene): string {
    if (scene.slot < 0) return "blur(6px) saturate(0.86) brightness(0.88)"
    const ch = scene.choreo
    return `blur(${ch.blurPx}px) saturate(${ch.saturate}) brightness(${ch.brightness})`
}

function ribbonCardDepthLive(
    centerDist: number,
    km: number,
    spatial: number,
    isSlot: boolean
): number {
    if (km <= 0 && spatial <= 0) return 0
    if (isSlot && spatial > 0.02) return 1
    return centerDist < 0.98 ? 1 : 0
}

function ribbonCardBoxShadow(mix: number): string {
    if (mix <= 0.02) return "none"
    const lift = mix * mix
    return `0 ${Math.round(18 * lift)}px ${Math.round(48 * lift)}px rgba(${PALETTE.ink}, ${0.14 * lift}), 0 ${Math.round(42 * lift)}px ${Math.round(96 * lift)}px rgba(${PALETTE.ink}, ${0.1 * lift})`
}

interface RibbonCardPolicy {
    suppressed: number
    edgeFade: number
    enterMix: number
}

function ribbonCardPolicy(
    lx: number,
    centerDist: number,
    cfg: RibbonCardMotionConfig,
    ep: number,
    goal: number,
    slot: number,
    isSlot: boolean
): RibbonCardPolicy | null {
    if (ribbonNeighborHidden(ep, goal, slot, cfg.index, cfg.replica)) {
        return null
    }

    const expandHideNeighbors =
        slot >= 0 &&
        !isSlot &&
        (goal > 0.008 || ep > EXPAND_NEIGHBOR_HIDE)
    if (expandHideNeighbors) {
        return { suppressed: 1, edgeFade: 0, enterMix: 0 }
    }

    const viewLimit = ribbonViewLimit(
        cfg.stageWidth,
        cfg.cardWidth,
        cfg.canvasFill
    )
    const cull = ribbonViewCullMix(lx, viewLimit, cfg.stride)
    if (cull.hardCull) {
        return { suppressed: 1, edgeFade: 0, enterMix: 0 }
    }
    const focusFade = 1 - clamp((centerDist - 2.4) / 0.8, 0, 1)
    return {
        suppressed: 0,
        edgeFade: focusFade,
        enterMix: cull.enterMix,
    }
}

interface RibbonSurface {
    left: number
    scaleX: number
    scaleY: number
    rotateX: number
    rotateY: number
    rotateZ: number
    skewX: number
    skewY: number
    repelX: number
    cardY: number
    cardZ: number
    opacity: number
    zIndex: number
    borderRadius: number
    imgY: number
    imgScale: number
    imgUndistortY: number
    imgFrameHeight: number
    imageFilter: string
    focusGlow: number
    thumbOpacity: number
    suppressed: number
    shadowMix: number
    depthLive: number
}

function emptyRibbonSurface(
    cfg: RibbonCardMotionConfig,
    lx: number
): RibbonSurface {
    return {
        left: cfg.stageWidth / 2 + lx - cfg.cardWidth / 2,
        scaleX: 1,
        scaleY: 1,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        skewX: 0,
        skewY: 0,
        repelX: 0,
        cardY: 0,
        cardZ: 0,
        opacity: 0,
        zIndex: -1,
        borderRadius: cfg.borderRadius,
        imgY: 0,
        imgScale: 1,
        imgUndistortY: 1,
        imgFrameHeight: 1,
        imageFilter: "none",
        focusGlow: 0,
        thumbOpacity: 0,
        suppressed: 1,
        shadowMix: 0,
        depthLive: 0,
    }
}

function computeRibbonSurface(
    cfg: RibbonCardMotionConfig,
    scroll: number,
    ep: number,
    goal: number,
    waveEngage: number,
    slot: number
): RibbonSurface {
    const lx = ribbonWrappedLinearX(
        cfg.index,
        scroll,
        cfg.stride,
        cfg.totalW
    )
    const centerDist = Math.abs(lx) / cfg.stride
    const isSlot = ribbonIsSlotCard(slot, cfg.index, cfg.replica)
    const imgChoreo = isSlot ? expandImageChoreo(ep, goal) : null
    const spatial = imgChoreo ? imgChoreo.frameSpatial : 0
    const policy = ribbonCardPolicy(
        lx,
        centerDist,
        cfg,
        ep,
        goal,
        slot,
        isSlot
    )
    if (policy === null || policy.suppressed > 0) {
        return emptyRibbonSurface(cfg, lx)
    }

    const enterMix = policy.enterMix
    const expandWaveMixVal = expandWaveMix(ep, goal)
    const collapseTail = isSlot ? expandCollapseTailMix(ep, goal, true) : 0
    const expandActive =
        ribbonExpandWaveMuted(slot, ep, goal) && collapseTail <= 0
    const km = expandActive ? 0 : expandWaveMixVal
    const neighborHide = !isSlot ? neighborExpandHide(ep, centerDist) : 0

    const waveActive = cfg.intensity > 0
    let skewX = 0
    let skewY = 0

    let repelX = 0

    const falloff = Math.min(centerDist, 2.2) * 0.13 * cfg.focusDepth
    const focusOpacity = lerp(clamp(1 - falloff, 0.72, 1), 1, spatial)
    let opacity = focusOpacity * policy.edgeFade * enterMix
    if (isSlot) {
        opacity = Math.max(opacity, 0.98)
    }

    const focusGlow = lerp(
        0.08 + (1 - clamp(centerDist, 0, 1)) * 0.26,
        0.34,
        spatial
    )

    const baseScaleX =
        isSlot && imgChoreo
            ? expandSlotShellScales(cfg, imgChoreo.frameSpatial).scaleX
            : 1
    const baseScaleY =
        isSlot && imgChoreo
            ? expandSlotShellScales(cfg, imgChoreo.frameSpatial).scaleY
            : 1

    let outScaleX = baseScaleX
    let outScaleY = baseScaleY
    let outRotateX = 0
    let outRotateY = 0
    let outRotateZ = 0
    let outCardZ = 0
    let outCardY = 0
    let outRepelX = repelX
    let outOpacity = opacity
    let outImgY = 0
    let outImageFilter = "none"
    let outSkewX = skewX
    let outSkewY = skewY

    const slotImgScale = imgChoreo ? imgChoreo.innerScale : 1.04
    const slotThumbMix = imgChoreo ? imgChoreo.thumbMix : 1

    const expandChoreo = slot >= 0 && ep > EXPAND_NEIGHBOR_HIDE
    if (!isSlot) {
        const hide = easeSmoothstep01(neighborHide)
        const dir = Math.sign(lx) || 1
        const nearRepel = clamp(centerDist / 1.15, 0.62, 1)
        const expandRotate = dir * lerp(8, 14, clamp(centerDist / 2.4, 0, 1))
        outScaleX *= lerp(1, 0.76, hide)
        outScaleY *= lerp(1, 0.76, hide)
        outRotateY = expandRotate * hide
        outRepelX = dir * hide * cfg.stride * 0.18 * nearRepel
        outOpacity *= lerp(1, 0, hide)
        outSkewX *= lerp(1, 0, hide)
        outSkewY *= lerp(1, 0, hide)
        outImageFilter = "none"
    }

    if (expandChoreo && isSlot && imgChoreo) {
        const neutral = easeSmoothstep01(imgChoreo.frameSpatial)
        outRotateX = lerp(outRotateX, 0, neutral)
        outRotateY = lerp(outRotateY, 0, neutral)
        outRotateZ = lerp(outRotateZ, 0, neutral)
        outCardZ = lerp(outCardZ, 0, neutral)
        outSkewX = lerp(skewX, 0, neutral)
        outSkewY = lerp(skewY, 0, neutral)
        outRepelX = 0
        outImgY = imgChoreo.liftY * cfg.stageHeight
        outImageFilter = "none"
    }

    const distortion =
        expandActive || cfg.intensity <= 0
            ? RIBBON_WAVE_FLAT
            : ribbonConcaveWaveSurface(cfg, lx, km, waveEngage)

    skewY = distortion.skewY

    if (waveActive && ((!isSlot && !expandActive) || collapseTail > 0)) {
        const arcSpatial = ribbonArcSurfaceMix(lx, cfg)
        const waveMix =
            ribbonWaveMotionWeight(cfg.intensity, km) * cfg.focusDepth
        const scrollFade = ribbonWaveScrollFade(waveEngage)
        const kineticMix = cfg.canvasFill
            ? 1
            : Math.max(
                  ribbonIntensityMix(cfg.intensity) * cfg.focusDepth * 0.2,
                  scrollFade
              )
        const bowlWeight = arcSpatial * waveMix * kineticMix
        if (!isSlot) {
            opacity *= lerp(0.86, 1, bowlWeight)
            outScaleX *= distortion.scaleX
            outScaleY *= distortion.scaleY
        } else {
            const tail = collapseTail
            outScaleX = lerp(outScaleX, distortion.scaleX, tail)
            outScaleY = lerp(outScaleY, distortion.scaleY, tail)
            outRotateX = lerp(outRotateX, distortion.rotateX, tail)
            outRotateY = lerp(outRotateY, distortion.rotateY, tail)
            outRotateZ = lerp(outRotateZ, distortion.rotateZ, tail)
            outSkewX = lerp(outSkewX, distortion.skewX, tail)
            outSkewY = lerp(outSkewY, distortion.skewY, tail)
            outCardY = lerp(outCardY, distortion.translateY, tail)
            outCardZ = lerp(outCardZ, distortion.translateZ, tail)
            outImgY = lerp(outImgY, 0, tail)
        }
    }

    const distortionMerged = isSlot && collapseTail > 0
    const shellSuppress = ribbonImgShellSuppress(
        ep,
        goal,
        isSlot,
        slot,
        collapseTail
    )
    const undistortTarget = outScaleY > 1.001 ? 1 / outScaleY : 1
    const imgUndistortY = lerp(undistortTarget, 1, shellSuppress)
    const imgInnerScale = lerp(1, slotImgScale, shellSuppress)
    const shadowMix = isSlot ? spatial : 0
    const depthLive = ribbonCardDepthLive(centerDist, km, spatial, isSlot)

    return {
        left:
            cfg.stageWidth / 2 +
            lerp(lx, 0, spatial) +
            outRepelX -
            cfg.cardWidth / 2,
        scaleX: outScaleX,
        scaleY: outScaleY,
        rotateX: outRotateX + (distortionMerged ? 0 : distortion.rotateX),
        rotateY: outRotateY + (distortionMerged ? 0 : distortion.rotateY),
        rotateZ: outRotateZ + (distortionMerged ? 0 : distortion.rotateZ),
        skewX: outSkewX + (distortionMerged ? 0 : distortion.skewX),
        skewY: outSkewY + (distortionMerged ? 0 : distortion.skewY),
        repelX: 0,
        cardY: outCardY + (distortionMerged ? 0 : distortion.translateY),
        cardZ: outCardZ + (distortionMerged ? 0 : distortion.translateZ),
        opacity: outOpacity,
        zIndex: isSlot
            ? Math.round(lerp(1, Z_EXPAND_CARD, spatial))
            : 1,
        borderRadius: isSlot ? lerp(cfg.borderRadius, 0, spatial) : cfg.borderRadius,
        imgY: outImgY,
        imgScale: isSlot ? imgInnerScale : 1,
        imgUndistortY,
        imgFrameHeight: 1,
        imageFilter: outImageFilter,
        focusGlow,
        thumbOpacity: isSlot ? slotThumbMix : 1,
        suppressed: 0,
        shadowMix,
        depthLive,
    }
}

function demoProject(
    index: string,
    title: string,
    subtitle: string,
    description: string,
    tags: string,
    year: string,
    image: string
): ProjectItem {
    return {
        index,
        title,
        subtitle,
        description,
        tags,
        year,
        image,
    }
}

const DEMO_PROJECT_SEEDS = [
    [
        "01",
        "Meridian",
        "Brand Systems",
        "Identity and motion language for a spatial design studio. Grid, type, and kinetic mark.",
        "Branding, Motion, Print",
        "2024",
        FRAMER_DEMO_IMAGE_URLS[0],
    ],
    [
        "02",
        "Solace",
        "Digital Experience",
        "Immersive launch site for a fragrance house. Scroll narrative and product reveal.",
        "Creative Dev, UX, Motion",
        "2024",
        FRAMER_DEMO_IMAGE_URLS[1],
    ],
    [
        "03",
        "Stratum",
        "Visual Direction",
        "Campaign world for an independent label. Material texture meets digital craft.",
        "Art Direction, Campaign, 3D",
        "2023",
        FRAMER_DEMO_IMAGE_URLS[2],
    ],
    [
        "04",
        "Pulse",
        "Installation",
        "Generative visuals for a festival stage. Audio-reactive color fields.",
        "Installation, Generative, Audio",
        "2023",
        FRAMER_DEMO_IMAGE_URLS[3],
    ],
    [
        "05",
        "Crest",
        "Product Identity",
        "Packaging and mark for a hardware startup. Engineered restraint.",
        "Product, Packaging, Identity",
        "2023",
        FRAMER_DEMO_IMAGE_URLS[4],
    ],
    [
        "06",
        "Liminal",
        "Web & Motion",
        "Case-study platform for a creative studio. Scroll-driven storytelling.",
        "Web, Motion, Dev",
        "2024",
        FRAMER_DEMO_IMAGE_URLS[5],
    ],
    [
        "07",
        "Obsidian",
        "Campaign",
        "Editorial campaign for a skincare brand. Contrast, type, and motion.",
        "Campaign, Photo, Typography",
        "2024",
        FRAMER_DEMO_IMAGE_URLS[6],
    ],
    [
        "08",
        "Drift",
        "Spatial UI",
        "Concept interface for a music product. Physics-led navigation.",
        "3D, UI/UX, Audio",
        "2024",
        FRAMER_DEMO_IMAGE_URLS[7],
    ],
] as const

const PROJECT_DEFAULTS: ProjectItem[] = DEMO_PROJECT_SEEDS.map(
    ([index, title, subtitle, description, tags, year, image]) =>
        demoProject(
            index,
            title,
            subtitle,
            description,
            tags,
            year,
            image
        )
)

const SCROLL_DEFAULTS: ScrollGroup = {
    sensitivity: 0.45,
    snapDelay: SNAP_DELAY_MS,
    scrollEase: SCROLL_EASE,
}
const MOTION_DEFAULTS: MotionGroup = {
    intensity: 28,
    focusDepth: 1,
}
const LAYOUT_DEFAULTS: LayoutGroup = {
    cardWidthPercent: 28,
    cardHeightPercent: 54,
    gapPercent: 6,
    borderRadius: 2,
    expandFit: "cover",
}
const STYLE_DEFAULTS: StyleGroup = {
    backgroundColor: PALETTE.bg,
    blendUI: true,
    showVignette: true,
    showGrain: false,
    perspective: 1400,
}
const INTERACTION_DEFAULTS: InteractionGroup = {
    showProjectCursor: true,
    cursorLabelOffset: CURSOR_LABEL_OFFSET_DEFAULT,
}
const TYPOGRAPHY_DEFAULTS: TypographyGroup = {
    titleFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 500,
        letterSpacing: "-0.04em",
        lineHeight: "0.9em",
    },
    metaFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
    },
    bodyFont: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 300,
        lineHeight: "1.12em",
        letterSpacing: "-0.01em",
    },
    fontSizeTablet: 68,
    fontSizeMobile: 46,
}

export default function Kern_CurvyProjectShowcase(
    props: Partial<Props>
) {
    const {
        projects: projectsInput = PROJECT_DEFAULTS,
        scroll: scrollGroup = SCROLL_DEFAULTS,
        motion: motionInput = MOTION_DEFAULTS,
        layout: layoutInput = LAYOUT_DEFAULTS,
        appearance: appearanceGroup = STYLE_DEFAULTS,
        interaction: interactionGroup = INTERACTION_DEFAULTS,
        typography = TYPOGRAPHY_DEFAULTS,
        ariaLabel = "Project showcase",
        style: cssStyle,
    } = props

    const motionGroup = useMemo(() => {
        const merged = {
            ...MOTION_DEFAULTS,
            ...motionInput,
        } as Partial<MotionGroup> & {
            scrollDistortion?: number
            scrollWave?: number
        }
        const legacyWave =
            merged.scrollWave ?? merged.scrollDistortion ?? undefined
        const hasExplicitIntensity =
            motionInput !== undefined &&
            typeof motionInput.intensity === "number"
        const intensityFromLegacy =
            !hasExplicitIntensity && legacyWave !== undefined
                ? clamp(legacyWave * 7, 0, 14)
                : undefined
        return {
            intensity: clamp(
                merged.intensity ??
                    intensityFromLegacy ??
                    MOTION_DEFAULTS.intensity,
                0,
                45
            ),
            focusDepth: clamp(
                merged.focusDepth ?? MOTION_DEFAULTS.focusDepth,
                0,
                1
            ),
        }
    }, [motionInput])

    const scrollCfg = useMemo(
        () => ({
            sensitivity: scrollSensitivityNorm(
                scrollGroup.sensitivity ?? SCROLL_DEFAULTS.sensitivity
            ),
            snapDelay: clamp(
                scrollGroup.snapDelay ?? SCROLL_DEFAULTS.snapDelay,
                120,
                800
            ),
            scrollEase: clamp(
                scrollGroup.scrollEase ?? SCROLL_DEFAULTS.scrollEase,
                0.06,
                0.35
            ),
        }),
        [scrollGroup]
    )

    const interactionResolved = useMemo(
        () => ({
            ...INTERACTION_DEFAULTS,
            ...interactionGroup,
            showProjectCursor:
                interactionGroup.showProjectCursor === true,
            cursorLabelOffset: clamp(
                interactionGroup.cursorLabelOffset ??
                    INTERACTION_DEFAULTS.cursorLabelOffset,
                4,
                40
            ),
        }),
        [interactionGroup]
    )

    const typographyResolved = useMemo(
        () => ({
            ...TYPOGRAPHY_DEFAULTS,
            ...typography,
            fontSizeTablet: clamp(
                typography.fontSizeTablet ?? TYPOGRAPHY_DEFAULTS.fontSizeTablet,
                36,
                96
            ),
            fontSizeMobile: clamp(
                typography.fontSizeMobile ?? TYPOGRAPHY_DEFAULTS.fontSizeMobile,
                28,
                64
            ),
        }),
        [typography]
    )

    const appearanceResolved = useMemo(() => {
        const merged = { ...STYLE_DEFAULTS, ...appearanceGroup }
        return {
            ...merged,
            perspective: clamp(
                merged.perspective ?? STYLE_DEFAULTS.perspective,
                800,
                2400
            ),
        }
    }, [appearanceGroup])

    const layoutGroup = useMemo(() => {
        const merged = { ...LAYOUT_DEFAULTS, ...layoutInput }
        return {
            ...merged,
            cardWidthPercent: clamp(merged.cardWidthPercent, 18, 42),
            cardHeightPercent: clamp(merged.cardHeightPercent, 28, 80),
            gapPercent: clamp(merged.gapPercent, 2, 12),
            borderRadius: clamp(merged.borderRadius, 0, 24),
            expandFit:
                (merged.expandFit === "contain" ||
                merged.expandFit === "stretch"
                    ? merged.expandFit
                    : "cover") as ExpandFit,
        }
    }, [layoutInput])

    const projects = useMemo(
        () => normalizeProjects(projectsInput),
        [projectsInput]
    )

    const isCanvas = useIsOnFramerCanvas()
    const isStaticRenderer = useIsStaticRenderer()
    const prefersReduced = useReducedMotion()
    const stageRef = useRef<HTMLDivElement | null>(null)
    const isInView = useInView(stageRef, { amount: 0.01 })
    const motionPolicy = useMemo(
        () =>
            buildMotionPolicy({
                isCanvas: isCanvas === true,
                isExportStatic: isStaticRenderer === true && isCanvas !== true,
                prefersReduced: prefersReduced === true,
                isInView: isInView === true,
                showProjectCursor: interactionResolved.showProjectCursor,
            }),
        [
            isCanvas,
            isStaticRenderer,
            prefersReduced,
            isInView,
            interactionResolved.showProjectCursor,
        ]
    )
    const count = Math.max(projects.length, 1)
    const [stageWidth, setStageWidth] = useState(1200)
    const [stageHeight, setStageHeight] = useState(800)
    const [isMobile, setIsMobile] = useState(false)

    useLayoutEffect(() => {
        const node = stageRef.current
        if (!node) return
        const measure = () => {
            const rect = node.getBoundingClientRect()
            if (rect.width > 0) {
                startTransition(() => {
                    setStageWidth(rect.width)
                    setStageHeight(rect.height)
                    setIsMobile(rect.width < 600)
                })
            }
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(node)
        return () => ro.disconnect()
    }, [])

    const widthFactor = isMobile ? 0.72 : layoutGroup.cardWidthPercent / 100
    const heightFactor = layoutGroup.cardHeightPercent / 100
    const cardWidth = stageWidth * widthFactor
    const cardHeight = stageHeight * heightFactor
    const gap = stageWidth * (layoutGroup.gapPercent / 100)
    const stride = cardWidth + gap
    const totalW = stride * count
    const expandSX = stageWidth / cardWidth
    const expandSY = stageHeight / cardHeight

    const heroIndex = useMemo(() => ribbonHeroIndex(count), [count])
    const heroScrollSnap = heroIndex * stride

    const scrollOffset = useMotionValue(heroScrollSnap)
    const rawInputDelta = useRef(0)
    const scrollVelocityNorm = useMotionValue(0)
    const expandTarget = useMotionValue(0)
    const expandProgress = useSpring(expandTarget, getSpring("expand"))
    const ribbonWaveEngageMv = useMotionValue(0)
    const expandSlotMv = useMotionValue(-1)
    const expandVisualSlotMv = useMotionValue(-1)

    const [currentSlide, setCurrentSlide] = useState(heroIndex)
    const [copyVisible, setCopyVisible] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [veilSlot, setVeilSlot] = useState(-1)
    const [hoverProjectIndex, setHoverProjectIndex] = useState(-1)
    const [closeCursorActive, setCloseCursorActive] = useState(false)
    const [cursorOnStage, setCursorOnStage] = useState(false)
    const [ribbonCursorBlocked, setRibbonCursorBlocked] = useState(false)

    const cursorPointerX = useMotionValue(0)
    const cursorPointerY = useMotionValue(0)
    const cursorX = useSpring(cursorPointerX, getSpring("cursor"))
    const cursorY = useSpring(cursorPointerY, getSpring("cursor"))

    const clearRibbonHover = useCallback(() => {
        setHoverProjectIndex(-1)
    }, [])

    const ribbonHitAtClient = useCallback(
        (clientX: number, clientY: number): number => {
            const node = stageRef.current
            if (!node) return -1
            const rect = node.getBoundingClientRect()
            return ribbonCardHitAtClient(
                clientX,
                clientY,
                rect.left,
                rect.top,
                stageWidth,
                stageHeight,
                scrollOffset.get(),
                stride,
                cardWidth,
                cardHeight,
                count,
                totalW
            )
        },
        [
            cardHeight,
            cardWidth,
            count,
            scrollOffset,
            stageHeight,
            stageWidth,
            stride,
            totalW,
        ]
    )

    const syncRibbonHover = useCallback(
        (clientX: number, clientY: number) => {
            if (isDragging || touchActive.current) return
            const ep = expandProgress.get()
            const goal = expandTarget.get()
            const session = expandSessionRef.current
            if (
                expandCursorActive(session, ep, goal) ||
                expandSessionExpanded(session) ||
                expandSessionCollapsing(session) ||
                ep > EXPAND_SCROLL_LOCK
            ) {
                clearRibbonHover()
                return
            }
            setHoverProjectIndex(ribbonHitAtClient(clientX, clientY))
        },
        [
            clearRibbonHover,
            expandProgress,
            expandTarget,
            isDragging,
            ribbonHitAtClient,
        ]
    )

    const updateCustomCursor = useCallback(
        (clientX: number, clientY: number) => {
            if (!motionPolicy.cursor || isDragging || touchActive.current) {
                setCloseCursorActive(false)
                clearRibbonHover()
                return
            }

            setCursorOnStage(true)

            const node = stageRef.current
            if (!node) return
            const rect = node.getBoundingClientRect()
            cursorPointerX.set(clientX - rect.left)
            cursorPointerY.set(clientY - rect.top)

            const ep = expandProgress.get()
            const goal = expandTarget.get()
            const session = expandSessionRef.current

            if (expandCursorActive(session, ep, goal)) {
                setCloseCursorActive(true)
                setRibbonCursorBlocked(true)
                clearRibbonHover()
                return
            }

            setCloseCursorActive(false)

            if (
                expandSessionExpanded(session) ||
                expandSessionCollapsing(session) ||
                ep > EXPAND_SCROLL_LOCK
            ) {
                setRibbonCursorBlocked(true)
                clearRibbonHover()
                return
            }

            setRibbonCursorBlocked(false)
            syncRibbonHover(clientX, clientY)
        },
        [
            clearRibbonHover,
            motionPolicy.cursor,
            cursorPointerX,
            cursorPointerY,
            expandProgress,
            expandTarget,
            isDragging,
            syncRibbonHover,
        ]
    )

    useMotionValueEvent(expandProgress, "change", (ep) => {
        if (!motionPolicy.cursor) return
        const goal = expandTarget.get()
        const session = expandSessionRef.current
        const closeActive = expandCursorActive(session, ep, goal)
        setCloseCursorActive(closeActive)
        if (closeActive) {
            setRibbonCursorBlocked(true)
            clearRibbonHover()
            return
        }
        if (
            expandSessionExpanded(session) ||
            expandSessionCollapsing(session) ||
            ep > EXPAND_SCROLL_LOCK
        ) {
            setRibbonCursorBlocked(true)
            return
        }
        setRibbonCursorBlocked(false)
    })

    useMotionValueEvent(expandTarget, "change", (goal) => {
        if (!motionPolicy.cursor) return
        const ep = expandProgress.get()
        const session = expandSessionRef.current
        const closeActive = expandCursorActive(session, ep, goal)
        setCloseCursorActive(closeActive)
        if (closeActive) setRibbonCursorBlocked(true)
    })

    const expandSessionRef = useRef<ExpandSession>(RIBBON_EXPAND_SESSION)
    const pendingExpandRef = useRef(-1)
    const ribbonSlideRef = useRef(heroIndex)
    const pendingScrollDelta = useRef(0)
    const dragLastX = useRef(0)
    const touchActive = useRef(false)
    const isPointerDown = useRef(false)
    const ribbonEngagedRef = useRef(false)
    const expandCollapseEpFloorRef = useRef(1)
    const pointerDownX = useRef(0)
    const pointerDownY = useRef(0)
    const dragDistance = useRef(0)
    const wheelBuffer = useRef(0)
    const scrollMomentum = useRef(0)
    const releaseVelocity = useRef(0)
    const prevScrollFrame = useRef(heroScrollSnap)
    const lastFrameTime = useRef<number | null>(null)
    const lastInputAt = useRef(
        typeof performance !== "undefined" ? performance.now() : 0
    )
    const lastCollapseAt = useRef(0)
    const blockClickExpandRef = useRef(false)
    const activePointerIdRef = useRef<number | null>(null)

    const releaseStagePointer = useCallback((e: PointerEvent<HTMLElement>) => {
        const id = activePointerIdRef.current
        if (id === null) return
        if (e.currentTarget.hasPointerCapture(id)) {
            e.currentTarget.releasePointerCapture(id)
        }
        activePointerIdRef.current = null
    }, [])
    const bootSettledRef = useRef(false)

    useLayoutEffect(() => {
        if (stride <= 0 || count < 1) {
            bootSettledRef.current = false
            return
        }
        const bootHero = ribbonHeroIndex(count)
        const snapped = bootHero * stride
        scrollOffset.set(snapped)
        prevScrollFrame.current = snapped
        ribbonSlideRef.current = wrapIndex(bootHero, count)
        lastInputAt.current = performance.now()
        startTransition(() => setCurrentSlide(bootHero))
        bootSettledRef.current = true
    }, [stride, count, scrollOffset])

    useEffect(() => {
        preloadProjectImages(projects)
    }, [projects])

    useMotionValueEvent(expandVisualSlotMv, "change", (slot) => {
        setVeilSlot(slot < 0 ? -1 : Math.round(slot))
    })

    const touchScrollOffset = useCallback(() => {
        lastInputAt.current = performance.now()
        ribbonEngagedRef.current = true
    }, [])

    useEffect(() => {
        if (!motionPolicy.live) return
        lastInputAt.current = performance.now()
    }, [motionPolicy.live])

    const hideCopy = useCallback(() => {
        setCopyVisible((v) => (v ? false : v))
    }, [])

    const finishExpandRibbon = useCallback(() => {
        const ep = expandProgress.get()
        const goal = expandTarget.get()
        const visualSlot = expandVisualSlotMv.get()

        if (
            expandSessionRef.current.phase === "ribbon" &&
            visualSlot < 0 &&
            ep < 0.02 &&
            goal < 0.02
        ) {
            return
        }

        if (
            visualSlot >= 0 &&
            goal < 0.05 &&
            ep > EXPAND_SLOT_RELEASE
        ) {
            expandSessionRef.current = {
                phase: "collapsing",
                slot: visualSlot,
            }
            expandTarget.set(0)
            pendingExpandRef.current = -1
            lastCollapseAt.current = performance.now()
            ribbonEngagedRef.current = false
            return
        }

        expandSessionRef.current = RIBBON_EXPAND_SESSION
        expandSlotMv.set(-1)
        expandVisualSlotMv.set(-1)
        expandTarget.set(0)
        if (ep > 0.004) {
            expandProgress.set(0)
        }
        pendingExpandRef.current = -1
        pendingScrollDelta.current = 0
        scrollVelocityNorm.set(0)
        wheelBuffer.current = 0
        scrollMomentum.current = 0
        lastCollapseAt.current = performance.now()
        ribbonEngagedRef.current = false
        expandCollapseEpFloorRef.current = 1
        setCloseCursorActive(false)
        startTransition(() => {
            setRibbonCursorBlocked(false)
            setCopyVisible(false)
        })
    }, [
        expandProgress,
        expandSlotMv,
        expandTarget,
        expandVisualSlotMv,
        scrollVelocityNorm,
    ])

    const collapseExpand = useCallback(() => {
        const session = expandSessionRef.current
        const ep = expandProgress.get()
        const goal = expandTarget.get()
        const visualSlot = expandVisualSlotMv.get()

        if (!expandIsVisuallyOpen(session, ep, goal, visualSlot)) {
            return
        }

        const idx =
            session.slot >= 0
                ? session.slot
                : visualSlot >= 0
                  ? visualSlot
                  : -1
        if (idx >= 0) {
            const snapped = idx * stride
            scrollOffset.set(snapped)
            prevScrollFrame.current = snapped
        }
        lastCollapseAt.current = performance.now()
        pendingExpandRef.current = -1

        if (goal < 0.05 || expandSessionCollapsing(session)) {
            if (ep > EXPAND_SLOT_RELEASE && visualSlot >= 0) {
                expandSessionRef.current = { phase: "collapsing", slot: idx }
                expandTarget.set(0)
                lastCollapseAt.current = performance.now()
                pendingExpandRef.current = -1
                return
            }
            finishExpandRibbon()
            return
        }

        scrollVelocityNorm.set(0)
        wheelBuffer.current = 0
        scrollMomentum.current = 0
        releaseVelocity.current = 0
        setCloseCursorActive(false)
        expandSessionRef.current = { phase: "collapsing", slot: idx }
        expandCollapseEpFloorRef.current = ep
        expandTarget.set(0)
        startTransition(() => setCopyVisible(false))
    }, [
        expandProgress,
        expandTarget,
        expandVisualSlotMv,
        finishExpandRibbon,
        scrollOffset,
        scrollVelocityNorm,
        stride,
    ])

    const revealSlide = useCallback((idx: number) => {
        expandSessionRef.current = {
            phase: expandSessionRef.current.phase,
            slot: idx,
        }
        expandSlotMv.set(idx)
        expandVisualSlotMv.set(idx)
        startTransition(() => setCurrentSlide(idx))
    }, [expandSlotMv, expandVisualSlotMv])

    useMotionValueEvent(expandProgress, "change", (latest) => {
        if (!motionPolicy.visual) return
        const goal = expandTarget.get()
        const session = expandSessionRef.current
        const visualSlot = expandVisualSlotMv.get()

        if (expandSessionCollapsing(session) && goal < 0.05) {
            const floor = expandCollapseEpFloorRef.current
            if (latest > floor + 0.0015) {
                expandProgress.set(floor)
                return
            }
            if (latest < floor) {
                expandCollapseEpFloorRef.current = latest
            }
        } else if (goal > 0.5) {
            expandCollapseEpFloorRef.current = latest
        }

        if (
            expandSessionExpanded(session) &&
            latest >= EXPAND_TEXT_THRESHOLD
        ) {
            setCopyVisible((v) => (v ? v : true))
        }
        if (latest < 0.05) {
            setCopyVisible((v) => (v ? false : v))
        }

        if (
            visualSlot >= 0 &&
            goal < 0.05 &&
            latest < EXPAND_VISUAL_DONE &&
            expandCollapseReady(
                latest,
                goal,
                expandCollapseTailMix(latest, goal, true)
            ) &&
            (expandSessionCollapsing(session) || session.phase === "ribbon")
        ) {
            finishExpandRibbon()
        }
    })

    const activateExpand = useCallback(
        (idx: number) => {
            if (
                expandSessionExpanded(expandSessionRef.current) ||
                expandProgress.get() > EXPAND_SCROLL_LOCK ||
                expandSessionCollapsing(expandSessionRef.current)
            )
                return
            const snapped = idx * stride
            scrollOffset.set(snapped)
            expandSessionRef.current = { phase: "expanding", slot: idx }
            clearRibbonHover()
            setCloseCursorActive(false)
            setRibbonCursorBlocked(true)
            revealSlide(idx)
            pendingExpandRef.current = -1
            expandCollapseEpFloorRef.current = 0
            ribbonWaveEngageMv.set(0)
            expandTarget.set(1)
        },
        [
            clearRibbonHover,
            expandProgress,
            expandTarget,
            revealSlide,
            scrollOffset,
            stride,
        ]
    )

    const addScrollDelta = useCallback(
        (delta: number) => {
            if (!motionPolicy.visual) return
            const session = expandSessionRef.current
            if (
                expandInputLocked(
                    expandSessionExpanded(session),
                    expandProgress.get(),
                    expandVisualSlotMv.get() >= 0
                )
            )
                return
            touchScrollOffset()
            scrollOffset.set(scrollOffset.get() + delta)
            scrollMomentum.current = delta
            releaseVelocity.current = delta
            rawInputDelta.current += Math.abs(delta) / stageWidth
            hideCopy()
        },
        [
            expandProgress,
            expandVisualSlotMv,
            hideCopy,
            scrollOffset,
            motionPolicy.visual,
            stageWidth,
            touchScrollOffset,
        ]
    )

    const queueScrollAfterCollapse = useCallback(
        (delta: number) => {
            pendingScrollDelta.current += delta
            const session = expandSessionRef.current
            if (
                expandIsVisuallyOpen(
                    session,
                    expandProgress.get(),
                    expandTarget.get(),
                    expandVisualSlotMv.get()
                ) &&
                !expandSessionCollapsing(session)
            ) {
                collapseExpand()
            }
        },
        [collapseExpand, expandProgress, expandTarget, expandVisualSlotMv]
    )

    useEffect(() => {
        if (!motionPolicy.visual || typeof window === "undefined") return
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return
            if (
                !expandIsVisuallyOpen(
                    expandSessionRef.current,
                    expandProgress.get(),
                    expandTarget.get(),
                    expandVisualSlotMv.get()
                )
            ) {
                return
            }
            event.preventDefault()
            collapseExpand()
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [
        motionPolicy.visual,
        collapseExpand,
        expandProgress,
        expandTarget,
        expandVisualSlotMv,
    ])

    const motionPolicyRef = useRef(motionPolicy)
    motionPolicyRef.current = motionPolicy

    useAnimationFrame((time) => {
        if (!motionPolicyRef.current.visual) return

        const dt =
            lastFrameTime.current === null
                ? 16.67
                : Math.min(time - lastFrameTime.current, 34)
        lastFrameTime.current = time
        const frameFactor = dt / 16.67

        const expandGoal = expandTarget.get()
        const ep = expandProgress.get()

        const scrollLocked = expandSessionScrollLocked(
            expandSessionRef.current,
            ep
        )

        const scrollPhysicsLive =
            motionPolicyRef.current.scrollPhysics && !scrollLocked

        if (scrollPhysicsLive) {
            const wheelEase =
                0.42 + scrollCfg.scrollEase * 1.35
            const snapStrength =
                SNAP_PULL * (0.65 + scrollCfg.scrollEase * 2)

            if (
                !isPointerDown.current &&
                !touchActive.current &&
                Math.abs(scrollMomentum.current) > MOMENTUM_MIN
            ) {
                const mom = scrollMomentum.current
                scrollOffset.set(scrollOffset.get() + mom)
                scrollMomentum.current =
                    mom * Math.pow(MOMENTUM_DECAY, frameFactor)
                lastInputAt.current = performance.now()
                rawInputDelta.current += Math.abs(mom) / stageWidth
            }

            const wheelStep = wheelBuffer.current
            if (Math.abs(wheelStep) > 0.01) {
                lastInputAt.current = performance.now()
                const applied = wheelStep * WHEEL_TAIL_SMOOTH * wheelEase
                wheelBuffer.current = wheelStep * WHEEL_TAIL_DECAY
                scrollOffset.set(scrollOffset.get() + applied)
                scrollMomentum.current += applied * 0.22
                rawInputDelta.current += Math.abs(applied) / stageWidth
            }

            const dragging = isPointerDown.current || touchActive.current
            const vel = scrollVelocityNorm.get()
            const idleMs = performance.now() - lastInputAt.current
            const wheelIdle = Math.abs(wheelBuffer.current) < IDLE_WHEEL_GATE
            const magnetReady =
                bootSettledRef.current &&
                !dragging &&
                wheelIdle &&
                idleMs > scrollCfg.snapDelay &&
                vel < SNAP_VELOCITY_GATE

            if (magnetReady) {
                const offsetNow = scrollOffset.get()
                const snapPoint = Math.round(offsetNow / stride) * stride
                const dist = snapPoint - offsetNow
                const distNorm = Math.abs(dist) / Math.max(stride, 1)
                const waveEngageSnap = ribbonWaveEngageMv.get()
                const snapWaveGate = clamp(
                    1 - waveEngageSnap / SNAP_WAVE_ENGAGE_MAX,
                    0,
                    1
                )

                if (
                    snapWaveGate > 0.02 &&
                    distNorm < SNAP_ZONE &&
                    distNorm > 0.0008
                ) {
                    const proximity = 1 - distNorm / SNAP_ZONE
                    const pull =
                        dist *
                        snapStrength *
                        proximity *
                        frameFactor *
                        SNAP_MAGNET_GAIN *
                        snapWaveGate
                    scrollOffset.set(offsetNow + pull)
                }

                if (
                    ribbonEngagedRef.current &&
                    !expandAutoExpandBlocked(
                        expandSessionRef.current,
                        ep,
                        expandGoal,
                        expandVisualSlotMv.get(),
                        lastCollapseAt.current,
                        performance.now()
                    ) &&
                    distNorm < 0.04 &&
                    vel < SNAP_VELOCITY_GATE * 0.55
                ) {
                    pendingExpandRef.current = wrapIndex(
                        Math.round(snapPoint / stride),
                        count
                    )
                } else if (
                    expandAutoExpandBlocked(
                        expandSessionRef.current,
                        ep,
                        expandGoal,
                        expandVisualSlotMv.get(),
                        lastCollapseAt.current,
                        performance.now()
                    ) ||
                    distNorm > 0.1 ||
                    vel > SNAP_VELOCITY_GATE
                ) {
                    pendingExpandRef.current = -1
                }
            }
        }

        if (!scrollLocked && totalW > 0) {
            const offsetNow = scrollOffset.get()
            if (Math.abs(offsetNow) > totalW * 48) {
                const wrapped = wrapScrollOffset(offsetNow, totalW)
                const shift = wrapped - offsetNow
                scrollOffset.set(wrapped)
                prevScrollFrame.current += shift
            }
        }

        const next = scrollOffset.get()
        const ribbonSlide = wrapIndex(Math.round(next / stride), count)
        if (ribbonSlide !== ribbonSlideRef.current) {
            ribbonSlideRef.current = ribbonSlide
        }

        const pending = pendingExpandRef.current
        const visualSlotNow = expandVisualSlotMv.get()
        const collapseReady =
            expandSessionCollapsing(expandSessionRef.current) &&
            expandCollapseReady(
                ep,
                expandGoal,
                expandCollapseTailMix(ep, expandGoal, visualSlotNow >= 0)
            )

        if (collapseReady) {
            const queued = pendingScrollDelta.current
            pendingScrollDelta.current = 0
            pendingExpandRef.current = -1
            expandCollapseEpFloorRef.current = ep
            finishExpandRibbon()
            prevScrollFrame.current = scrollOffset.get()
            if (Math.abs(queued) > 0.001) {
                touchScrollOffset()
                const nextQueued = scrollOffset.get() + queued
                scrollOffset.set(nextQueued)
                prevScrollFrame.current = nextQueued
                rawInputDelta.current += Math.abs(queued) / stageWidth
                hideCopy()
            }
        } else if (
            pending !== -1 &&
            !scrollLocked &&
            !expandAutoExpandBlocked(
                expandSessionRef.current,
                ep,
                expandGoal,
                visualSlotNow,
                lastCollapseAt.current,
                performance.now()
            ) &&
            scrollVelocityNorm.get() < EXPAND_VELOCITY_GATE &&
            !isPointerDown.current &&
            !touchActive.current
        ) {
            expandSessionRef.current = { phase: "expanding", slot: pending }
            pendingExpandRef.current = -1
            expandCollapseEpFloorRef.current = ep
            scrollOffset.set(pending * stride)
            revealSlide(pending)
            expandTarget.set(1)
        }

        const frameDelta = (next - prevScrollFrame.current) / stageWidth
        prevScrollFrame.current = next
        const rawNorm = clamp(
            Math.max(
                Math.abs(frameDelta) * 4.5,
                rawInputDelta.current / MAX_SCROLL_VELOCITY
            ),
            0,
            1
        )
        const expandEngaged =
            expandSessionExpanded(expandSessionRef.current) ||
            expandSessionCollapsing(expandSessionRef.current)
        const engageTarget = expandEngaged
            ? 0
            : Math.max(
                  rawNorm,
                  Math.abs(frameDelta) * 6.2,
                  rawInputDelta.current / MAX_SCROLL_VELOCITY
              )
        let waveEngage = ribbonWaveEngageMv.get()
        const engageEase =
            engageTarget > waveEngage
                ? RIBBON_WAVE_ENGAGE_ATTACK
                : RIBBON_WAVE_ENGAGE_RELEASE
        waveEngage = frameLerp(
            waveEngage,
            engageTarget,
            engageEase,
            frameFactor
        )
        if (
            engageTarget < 0.004 &&
            !isPointerDown.current &&
            !touchActive.current
        ) {
            waveEngage *= Math.pow(RIBBON_WAVE_ENGAGE_IDLE_DECAY, frameFactor)
        }
        ribbonWaveEngageMv.set(waveEngage)

        let vel = scrollVelocityNorm.get()
        vel = frameLerp(vel, rawNorm, VELOCITY_EASE, frameFactor)
        if (
            !isPointerDown.current &&
            !touchActive.current &&
            rawNorm < 0.022
        ) {
            vel *= Math.pow(VELOCITY_DECAY, frameFactor)
        } else if (
            !isPointerDown.current &&
            !touchActive.current &&
            rawNorm < vel * 0.95
        ) {
            vel *= Math.pow(VELOCITY_COAST_DECAY, frameFactor)
        }
        scrollVelocityNorm.set(vel)
        rawInputDelta.current = 0

        if (
            expandSessionRef.current.phase === "ribbon" &&
            expandGoal < 0.04 &&
            ep > 0.06 &&
            expandVisualSlotMv.get() < 0
        ) {
            expandProgress.set(0)
            expandTarget.set(0)
        }

        if (
            expandSessionExpanded(expandSessionRef.current) ||
            expandSessionCollapsing(expandSessionRef.current)
        ) {
            scrollVelocityNorm.set(0)
        }
    })

    const expandSceneCacheRef = useRef<ExpandSceneCache | null>(null)
    const readExpandChoreo = (
        slotRaw: number,
        ep: number,
        goal: number
    ): ExpandScene =>
        expandSceneFromInputs(slotRaw, ep, goal, expandSceneCacheRef)

    const expandScrimOpacity = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandScrimOpacityFromScene(readExpandChoreo(slot, ep, goal))
    )
    const expandBackdropOpacity = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandBackdropOpacityFromScene(readExpandChoreo(slot, ep, goal))
    )
    const ribbonLayerOpacity = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            ribbonLayerOpacityFromScene(readExpandChoreo(slot, ep, goal))
    )
    const ribbonLayerVisibility = useTransform(ribbonLayerOpacity, (o) =>
        o < 0.04 ? "hidden" : "visible"
    )
    const ribbonTiltX = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            ribbonTiltXFromScene(readExpandChoreo(slot, ep, goal))
    )
    const ribbonBreath = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            ribbonBreathFromScene(readExpandChoreo(slot, ep, goal))
    )
    const expandVeilOpacity = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandVeilOpacityFromScene(readExpandChoreo(slot, ep, goal))
    )
    const expandVeilScale = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandVeilScaleFromScene(readExpandChoreo(slot, ep, goal))
    )
    const expandVeilY = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandVeilYFromScene(readExpandChoreo(slot, ep, goal), stageHeight)
    )
    const expandVeilFilter = useTransform(
        [expandVisualSlotMv, expandProgress, expandTarget],
        ([slot, ep, goal]: number[]) =>
            expandVeilFilterFromScene(readExpandChoreo(slot, ep, goal))
    )
    const veilHero =
        veilSlot >= 0 ? (projects[veilSlot] ?? projects[0]) : projects[0]
    const copyLayerZ = useTransform([expandProgress, expandTarget], ([ep]: number[]) =>
        Math.round(lerp(Z_COPY, Z_COPY_EXPAND, expandSpatialT(ep as number)))
    )

    const uiColor = appearanceGroup.blendUI ? "#ffffff" : "#141210"
    const inset = isMobile ? 24 : 52
    const activeProject = projects[currentSlide] ?? projects[0]
    const ribbonWaveLive = motionGroup.intensity > 0
    const ribbonDepthLive =
        ribbonWaveLive && (motionPolicy.live || motionPolicy.canvas)

    const cardMotionCfg = useCallback(
        (index: number): RibbonCardMotionConfig => ({
            index,
            replica: 0,
            cardWidth,
            cardHeight,
            borderRadius: layoutGroup.borderRadius,
            stride,
            totalW,
            stageWidth,
            stageHeight,
            expandSX,
            expandSY,
            expandFit: layoutGroup.expandFit as ExpandFit,
            intensity: motionGroup.intensity,
            focusDepth: motionGroup.focusDepth,
            canvasFill: isCanvas,
            shouldAnimate: motionPolicy.visual,
        }),
        [
            cardWidth,
            cardHeight,
            layoutGroup.borderRadius,
            layoutGroup.expandFit,
            motionGroup,
            isCanvas,
            motionPolicy.visual,
            stageWidth,
            stageHeight,
            stride,
            totalW,
            expandSX,
            expandSY,
        ]
    )

    const ribbonCardSeam = {
        scrollCurrent: scrollOffset,
        expandProgress,
        expandTarget,
        ribbonWaveEngageMv: ribbonWaveEngageMv,
        expandSlotMv,
        expandVisualSlotMv,
    } as const

    const hoverProject =
        hoverProjectIndex >= 0
            ? (projects[hoverProjectIndex] ?? null)
            : null

    const ribbonCursorVisible =
        motionPolicy.cursor &&
        cursorOnStage &&
        hoverProjectIndex >= 0 &&
        !isDragging &&
        !closeCursorActive &&
        !ribbonCursorBlocked

    const handlePointerDown = useCallback(() => {
        hideCopy()
    }, [hideCopy])

    if (projects.length === 0 && isCanvas) {
        return (
            <div
                style={{
                    padding: 40,
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    color: "#6B6560",
                    fontFamily: "Inter, sans-serif",
                    ...cssStyle,
                }}
            >
                Add projects in Property Controls
            </div>
        )
    }

    if (motionPolicy.reduced) {
        return (
            <section
                role="region"
                aria-label={ariaLabel}
                style={{
                    width: "100%",
                    height: "100%",
                    padding: 24,
                    backgroundColor: appearanceGroup.backgroundColor,
                    ...cssStyle,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 16,
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                    }}
                >
                    {projects.map((proj, i) => (
                        <article
                            key={`${proj.index}-${i}`}
                            style={{
                                flex: "0 0 min(72vw, 360px)",
                                borderRadius: layoutGroup.borderRadius,
                                overflow: "hidden",
                                scrollSnapAlign: "start",
                            }}
                        >
                            <img
                                src={proj.image}
                                alt={proj.title}
                                style={{
                                    width: "100%",
                                    aspectRatio: "4/5",
                                    objectFit: "cover",
                                }}
                            />
                        </article>
                    ))}
                </div>
            </section>
        )
    }

    return (
        <section
            ref={stageRef}
            role="region"
            aria-label={ariaLabel}
            onWheel={(e) => {
                if (!motionPolicy.visual) return
                e.preventDefault()
                const delta =
                    (e.deltaY + e.deltaX * 0.35) *
                    WHEEL_DELTA *
                    (stageWidth / 6) *
                    scrollCfg.sensitivity
                if (
                    expandInputLocked(
                        expandSessionExpanded(expandSessionRef.current),
                        expandProgress.get(),
                        expandVisualSlotMv.get() >= 0
                    )
                ) {
                    if (
                        expandSessionExpanded(expandSessionRef.current) ||
                        expandVisualSlotMv.get() >= 0
                    )
                        queueScrollAfterCollapse(delta)
                    return
                }
                const immediate = delta * WHEEL_IMMEDIATE
                wheelBuffer.current += delta * (1 - WHEEL_IMMEDIATE)
                scrollOffset.set(scrollOffset.get() + immediate)
                scrollMomentum.current += immediate * 0.18
                rawInputDelta.current += Math.abs(immediate) / stageWidth
                touchScrollOffset()
                hideCopy()
            }}
            onPointerDown={(e) => {
                if (!motionPolicy.visual) return
                if (
                    expandIsVisuallyOpen(
                        expandSessionRef.current,
                        expandProgress.get(),
                        expandTarget.get(),
                        expandVisualSlotMv.get()
                    )
                ) {
                    blockClickExpandRef.current = true
                    collapseExpand()
                    return
                }
                if (ribbonHitAtClient(e.clientX, e.clientY) < 0) return
                activePointerIdRef.current = e.pointerId
                e.currentTarget.setPointerCapture(e.pointerId)
                touchScrollOffset()
                scrollMomentum.current = 0
                isPointerDown.current = true
                pointerDownX.current = e.clientX
                pointerDownY.current = e.clientY
                dragDistance.current = 0
                touchActive.current = e.pointerType === "touch"
                setIsDragging(true)
                dragLastX.current = e.clientX
                handlePointerDown()
            }}
            onPointerMove={(e) => {
                if (motionPolicy.cursor) {
                    updateCustomCursor(e.clientX, e.clientY)
                } else if (motionPolicy.visual && motionPolicy.live) {
                    syncRibbonHover(e.clientX, e.clientY)
                }
                if (!motionPolicy.visual || !isPointerDown.current) return
                dragDistance.current += Math.abs(e.clientX - dragLastX.current)
                const dx = e.clientX - dragLastX.current
                dragLastX.current = e.clientX
                const mul = e.pointerType === "touch" ? 1.65 : 1.08
                const delta = -dx * mul * scrollCfg.sensitivity
                if (
                    expandInputLocked(
                        expandSessionExpanded(expandSessionRef.current),
                        expandProgress.get(),
                        expandVisualSlotMv.get() >= 0
                    )
                ) {
                    if (
                        expandSessionExpanded(expandSessionRef.current) ||
                        expandVisualSlotMv.get() >= 0
                    )
                        queueScrollAfterCollapse(delta)
                    return
                }
                hideCopy()
                addScrollDelta(delta)
            }}
            onPointerUp={(e) => {
                releaseStagePointer(e)
                if (e.pointerType === "touch") touchActive.current = false
                isPointerDown.current = false
                setIsDragging(false)
                const moved =
                    Math.abs(e.clientX - pointerDownX.current) +
                    Math.abs(e.clientY - pointerDownY.current)
                const isClick =
                    moved < CLICK_DRAG_THRESHOLD &&
                    dragDistance.current < CLICK_DRAG_THRESHOLD
                const releaseImpulse = releaseVelocity.current
                if (
                    isClick &&
                    motionPolicy.visual &&
                    !blockClickExpandRef.current &&
                    !expandSessionExpanded(expandSessionRef.current) &&
                    !expandSessionCollapsing(expandSessionRef.current)
                ) {
                    const idx = ribbonHitAtClient(e.clientX, e.clientY)
                    if (idx >= 0) {
                        ribbonEngagedRef.current = true
                        activateExpand(idx)
                    }
                } else if (
                    !isClick &&
                    Math.abs(releaseImpulse) > 0.5 &&
                    !expandSessionExpanded(expandSessionRef.current) &&
                    !expandSessionCollapsing(expandSessionRef.current)
                ) {
                    scrollMomentum.current +=
                        releaseImpulse * RELEASE_MOMENTUM
                    touchScrollOffset()
                }
                blockClickExpandRef.current = false
                releaseVelocity.current = 0
            }}
            onPointerLeave={() => {
                touchActive.current = false
                isPointerDown.current = false
                activePointerIdRef.current = null
                setIsDragging(false)
                setCursorOnStage(false)
                setCloseCursorActive(false)
                setRibbonCursorBlocked(false)
                clearRibbonHover()
            }}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: appearanceGroup.backgroundColor,
                touchAction: isDragging ? "none" : "pan-y",
                cursor:
                    motionPolicy.cursor &&
                    !isDragging &&
                    (ribbonCursorVisible || closeCursorActive)
                        ? "none"
                        : motionPolicy.live
                          ? isDragging
                              ? "grabbing"
                              : hoverProjectIndex >= 0
                                ? "grab"
                                : "default"
                          : "default",
                ...cssStyle,
            }}
        >
            {appearanceGroup.showVignette && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                        background: `radial-gradient(ellipse 82% 72% at 50% 50%, transparent 48%, rgba(${PALETTE.ink}, 0.22) 100%)`,
                    }}
                />
            )}

            {appearanceGroup.showGrain && motionPolicy.visual && (
                <fm.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        pointerEvents: "none",
                        opacity: 0.045,
                        backgroundImage: GRAIN_EDGE,
                        backgroundSize: "220px 220px",
                        mixBlendMode: "multiply",
                    }}
                />
            )}

            <fm.div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: Z_RIBBON,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective:
                        veilSlot >= 0 || ribbonDepthLive
                            ? appearanceResolved.perspective
                            : "none",
                    perspectiveOrigin: "50% 55%",
                    transformStyle:
                        veilSlot >= 0 || ribbonDepthLive
                            ? "preserve-3d"
                            : "flat",
                    opacity: ribbonLayerOpacity,
                    visibility: ribbonLayerVisibility,
                    rotateX: ribbonTiltX,
                    scale: ribbonBreath,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: cardHeight,
                        flexShrink: 0,
                        transformStyle: ribbonDepthLive ? "preserve-3d" : "flat",
                    }}
                >
                    {projects.map((project, index) => (
                            <RibbonCard
                                key={project.index}
                                project={project}
                                motionCfg={cardMotionCfg(index)}
                                {...ribbonCardSeam}
                            />
                        ))}
                </div>
            </fm.div>

            {veilSlot >= 0 && (
                <fm.div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: Z_EXPAND_VEIL,
                        opacity: expandVeilOpacity,
                        pointerEvents: "none",
                        overflow: "hidden",
                        backgroundColor: appearanceGroup.backgroundColor,
                    }}
                >
                    <fm.div
                        style={{
                            position: "absolute",
                            inset: "-5%",
                            y: expandVeilY,
                            scale: expandVeilScale,
                            filter: expandVeilFilter,
                        }}
                    >
                        <img
                            src={veilHero.image}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: "center center",
                                display: "block",
                            }}
                        />
                    </fm.div>
                </fm.div>
            )}

            <fm.div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: Z_EXPAND_BACKDROP,
                    pointerEvents: "none",
                    opacity: expandBackdropOpacity,
                    backgroundColor: appearanceGroup.backgroundColor,
                }}
            />

            <fm.div
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "46%",
                    zIndex: Z_SCRIM,
                    pointerEvents: "none",
                    opacity: expandScrimOpacity,
                    background: `linear-gradient(to top, rgba(${PALETTE.ink}, 0.96) 0%, rgba(${PALETTE.ink}, 0.72) 52%, transparent 100%)`,
                }}
            />

            {copyVisible && (
                <fm.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: copyLayerZ,
                        pointerEvents: "none",
                        mixBlendMode: appearanceGroup.blendUI
                            ? "difference"
                            : "normal",
                        color: uiColor,
                    }}
                >
                    <AnimatePresence mode="wait">
                        <ProjectSlide
                            key={activeProject.index}
                            project={activeProject}
                            typography={typographyResolved}
                            color={uiColor}
                            visible
                            inset={inset}
                            isMobile={isMobile}
                        />
                    </AnimatePresence>
                </fm.div>
            )}

            {motionPolicy.cursor && ribbonCursorVisible && (
                <RibbonHoverCursor
                    title={hoverProject?.title}
                    x={cursorX}
                    y={cursorY}
                    offset={interactionResolved.cursorLabelOffset}
                    labelColor={uiColor}
                    metaFont={typographyResolved.metaFont}
                    blendUI={appearanceGroup.blendUI}
                    visible
                />
            )}

            {motionPolicy.cursor && closeCursorActive && (
                <RibbonCloseCursor
                    x={cursorX}
                    y={cursorY}
                    offset={interactionResolved.cursorLabelOffset}
                    labelColor={uiColor}
                    metaFont={typographyResolved.metaFont}
                    blendUI={appearanceGroup.blendUI}
                    visible={!isDragging}
                />
            )}
        </section>
    )
}

interface RibbonSurfaceCache {
    sig: string
    surface: RibbonSurface
}

function ribbonSurfaceFromInputs(
    motionCfg: RibbonCardMotionConfig,
    vals: number[],
    cache: { current: RibbonSurfaceCache | null }
): RibbonSurface {
    const sig = `${vals[0]}|${vals[1]}|${vals[2]}|${vals[3]}|${vals[4]}`
    if (cache.current?.sig === sig) return cache.current.surface
    const slotRaw = vals[4]
    const slot = slotRaw < 0 ? -1 : Math.round(slotRaw)
    const surface = computeRibbonSurface(
        motionCfg,
        vals[0],
        vals[1],
        vals[2],
        vals[3],
        slot
    )
    cache.current = { sig, surface }
    return surface
}

function RibbonCard({
    project,
    motionCfg,
    scrollCurrent,
    expandProgress,
    expandTarget,
    ribbonWaveEngageMv,
    expandVisualSlotMv,
}: {
    project: ProjectItem
    motionCfg: RibbonCardMotionConfig
    scrollCurrent: MotionValue<number>
    expandProgress: MotionValue<number>
    expandTarget: MotionValue<number>
    ribbonWaveEngageMv: MotionValue<number>
    expandVisualSlotMv: MotionValue<number>
}) {
    const { shouldAnimate, canvasFill, cardWidth, cardHeight } = motionCfg

    const surfaceCache = useRef<RibbonSurfaceCache | null>(null)
    const readSurfaceAt = (
        scroll: number,
        ep: number,
        goal: number,
        waveEngage: number,
        slotRaw: number
    ): RibbonSurface =>
        ribbonSurfaceFromInputs(
            motionCfg,
            [scroll, ep, goal, waveEngage, slotRaw],
            surfaceCache
        )

    const ribbonMotionInputs = [
        scrollCurrent,
        expandProgress,
        expandTarget,
        ribbonWaveEngageMv,
        expandVisualSlotMv,
    ]

    const left = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).left
    )
    const cardScaleX = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).scaleX
    )
    const cardScaleY = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).scaleY
    )
    const cardRotateX = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).rotateX
    )
    const cardRotateY = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).rotateY
    )
    const cardRotateZ = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).rotateZ
    )
    const repelX = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).repelX
    )
    const cardY = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).cardY
    )
    const cardZ = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).cardZ
    )
    const zIndex = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).zIndex
    )
    const radius = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).borderRadius
    )
    const imgExpandScaleOut = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).imgScale
    )
    const imgShellUndistortY = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).imgUndistortY
    )
    const imageFilter = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).imageFilter
    )
    const thumbOpacity = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).thumbOpacity
    )
    const suppressed = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).suppressed
    )
    const cardDepthLive = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) =>
        readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw).depthLive
    )
    const renderOpacity = useTransform(ribbonMotionInputs, ([scroll, ep, goal, waveEngage, slotRaw]: number[]) => {
        const surface = readSurfaceAt(scroll, ep, goal, waveEngage, slotRaw)
        return surface.suppressed > 0.5 ? 0 : surface.opacity
    })

    const cardTransformStyle = useTransform(cardDepthLive, (live: number) =>
        live > 0.5 ? "preserve-3d" : "flat"
    )

    const waveLive =
        motionCfg.intensity > 0 && (shouldAnimate || canvasFill)

    const cardVisibility = useTransform(suppressed, (hide: number) =>
        hide > 0.5 ? "hidden" : "visible"
    )

    return (
        <fm.article
            style={{
                position: "absolute",
                top: "50%",
                left,
                y: shouldAnimate ? cardY : undefined,
                x: shouldAnimate ? repelX : undefined,
                z: shouldAnimate ? cardZ : undefined,
                width: cardWidth,
                height: cardHeight,
                marginTop: -cardHeight / 2,
                borderRadius: radius,
                overflow: "hidden",
                scaleX: shouldAnimate ? cardScaleX : 1,
                scaleY: shouldAnimate ? cardScaleY : 1,
                rotateX: shouldAnimate ? cardRotateX : undefined,
                rotateY: shouldAnimate ? cardRotateY : undefined,
                rotateZ: shouldAnimate ? cardRotateZ : undefined,
                opacity: shouldAnimate ? renderOpacity : 1,
                zIndex,
                transformOrigin: "center center",
                transformStyle: shouldAnimate ? cardTransformStyle : "flat",
                WebkitTransformStyle: shouldAnimate ? cardTransformStyle : "flat",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                visibility: shouldAnimate ? cardVisibility : "visible",
                pointerEvents: "none",
                willChange: waveLive ? "transform, opacity" : undefined,
                boxShadow: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    borderRadius: "inherit",
                    isolation: "isolate",
                }}
            >
                <fm.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        scaleY: shouldAnimate ? imgShellUndistortY : 1,
                        transformOrigin: "center center",
                        overflow: "hidden",
                        borderRadius: "inherit",
                        filter: shouldAnimate ? imageFilter : undefined,
                        opacity: shouldAnimate ? thumbOpacity : 1,
                    }}
                >
                    <fm.img
                        src={project.image}
                        alt={project.title}
                        loading="eager"
                        decoding="async"
                        draggable={false}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            minWidth: "100%",
                            minHeight: "100%",
                            objectFit: "cover",
                            objectPosition: "center center",
                            display: "block",
                            pointerEvents: "none",
                            userSelect: "none",
                            scale: shouldAnimate ? imgExpandScaleOut : 1,
                            transformOrigin: "center center",
                            opacity: shouldAnimate ? undefined : 1,
                        }}
                    />
                </fm.div>
            </div>
        </fm.article>
    )
}

function ProjectSlide({
    project,
    typography,
    color,
    visible,
    inset,
    isMobile,
}: {
    project: ProjectItem
    typography: TypographyGroup
    color: string
    visible: boolean
    inset: number
    isMobile: boolean
}) {
    const tags = parseTags(project.tags)
    const chars = Array.from(project.title)

    return (
        <fm.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: `0 ${inset}px ${isMobile ? 72 : 100}px`,
                textShadow: `0 2px 28px rgba(${PALETTE.ink}, 0.42)`,
            }}
        >
            <fm.p
                style={{
                    margin: "0 0 12px",
                    ...fontFace(typography.metaFont),
                    opacity: 0.35,
                }}
                animate={{ opacity: visible ? 0.35 : 0, y: visible ? 0 : -6 }}
                transition={{ ...springTransition("snap"), delay: visible ? 0.06 : 0 }}
            >
                <span>{project.index} —</span>{" "}
                <span style={{ opacity: 0.7 }}>{project.year}</span>
            </fm.p>

            <h2
                aria-label={project.title}
                style={{
                    margin: 0,
                    maxWidth: "min(11ch, 92%)",
                    fontSize: isMobile
                        ? `clamp(${typography.fontSizeMobile}px, 10vw, 56px)`
                        : `clamp(${typography.fontSizeTablet}px, 7.8vw, 118px)`,
                    fontWeight: 500,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    fontFamily: typography.titleFont.fontFamily,
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={`${project.index}-c-${i}`}
                        aria-hidden
                        style={{
                            display: "inline-block",
                            overflow: "hidden",
                            paddingBottom: 6,
                        }}
                    >
                        <fm.span
                            style={{ display: "inline-block", color }}
                            initial={false}
                            animate={visible ? { y: "0%" } : { y: "108%" }}
                            transition={{
                                ...springTransition("reveal"),
                                delay: visible
                                    ? 0.06 + i * 0.016
                                    : (chars.length - 1 - i) * 0.01,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </fm.span>
                    </span>
                ))}
            </h2>

            <div style={{ overflow: "hidden", marginTop: 16 }}>
                <fm.p
                    style={{
                        margin: 0,
                        ...fontFace(typography.metaFont),
                        opacity: 0.55,
                        fontSize: 14,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                    initial={false}
                    animate={
                        visible
                            ? { y: 0, opacity: 0.55 }
                            : { y: 28, opacity: 0 }
                    }
                    transition={{ ...springTransition("line"), delay: visible ? 0.22 : 0 }}
                >
                    {project.subtitle}
                </fm.p>
            </div>

            {!isMobile && (
                <div style={{ overflow: "hidden", marginTop: 20 }}>
                    <fm.p
                        style={{
                            margin: "0 0 36px",
                            maxWidth: "38ch",
                            fontSize: "clamp(1.15rem, 1.65rem, 1.75rem)",
                            ...fontFace(typography.bodyFont),
                            opacity: 0.82,
                        }}
                        initial={false}
                        animate={
                            visible
                                ? { y: 0, opacity: 0.82 }
                                : { y: 22, opacity: 0 }
                        }
                        transition={{
                            ...springTransition("editorial"),
                            delay: visible ? 0.48 : 0,
                        }}
                    >
                        {project.description}
                    </fm.p>
                </div>
            )}

            <fm.div
                style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: isMobile ? "100%" : 640 }}
                initial={false}
                animate={visible ? "show" : "hidden"}
            >
                {tags.map((tag, i) => (
                    <fm.span
                        key={`${project.index}-${tag}`}
                        variants={{
                            hidden: { opacity: 0, y: 10 },
                            show: { opacity: 0.72, y: 0 },
                        }}
                        transition={{
                            ...springTransition("line"),
                            delay: visible ? 0.58 + i * 0.05 : 0,
                        }}
                        style={{
                            ...fontFace(typography.metaFont),
                            fontSize: 10,
                            padding: "6px 14px",
                            border: `1px solid ${color}66`,
                            borderRadius: 999,
                            backdropFilter: "blur(2px)",
                        }}
                    >
                        {tag}
                    </fm.span>
                ))}
            </fm.div>
        </fm.div>
    )
}

function str(
    title: string,
    defaultValue: string,
    description?: string,
    displayTextArea?: boolean
) {
    return {
        type: ControlType.String,
        title,
        defaultValue,
        ...(description ? { description } : {}),
        ...(displayTextArea ? { displayTextArea: true } : {}),
    } as {
        type: typeof ControlType.String
        title: string
        defaultValue: string
        description?: string
        displayTextArea?: boolean
    }
}

function img(title: string, description: string) {
    return {
        type: ControlType.ResponsiveImage,
        title,
        description,
    } as {
        type: typeof ControlType.ResponsiveImage
        title: string
        description: string
    }
}

const PROJECT_CTRL = {
    index: str(
        "Index",
        "",
        "Optional counter (01, 02…). Auto-numbered from list order if empty."
    ),
    title: str(
        "Title",
        "Project",
        "Project name. Shown on expand + hover cursor label."
    ),
    subtitle: str(
        "Subtitle",
        "Category",
        "Category line under the title in expand view."
    ),
    description: str(
        "Description",
        "Short description.",
        "Body copy revealed when a project expands.",
        true
    ),
    tags: str(
        "Tags",
        "Branding, Motion",
        "Comma-separated chips in expand view. Map CMS text field."
    ),
    year: str("Year", "2024", "Year shown in expand meta row."),
    image: img(
        "Image",
        "Ribbon thumbnail + expand hero. Bind CMS Image field."
    ),
}

function num(
    title: string,
    min: number,
    max: number,
    step: number,
    defaultValue: number,
    unit?: string,
    description?: string
) {
    return {
        type: ControlType.Number,
        title,
        min,
        max,
        step,
        defaultValue,
        ...(unit ? { unit } : {}),
        ...(description ? { description } : {}),
    } as {
        type: typeof ControlType.Number
        title: string
        min: number
        max: number
        step: number
        defaultValue: number
        unit?: string
        description?: string
    }
}

function bool(title: string, defaultValue: boolean, description?: string) {
    return {
        type: ControlType.Boolean,
        title,
        defaultValue,
        ...(description ? { description } : {}),
    } as {
        type: typeof ControlType.Boolean
        title: string
        defaultValue: boolean
        description?: string
    }
}

addPropertyControls(Kern_CurvyProjectShowcase, {
    projects: {
        type: ControlType.Array,
        title: "Projects",
        description:
            "CMS list or manual entries. Each item = one ribbon card + expand story.",
        control: { type: ControlType.Object, controls: PROJECT_CTRL },
        defaultValue: PROJECT_DEFAULTS,
    },
    scroll: {
        type: ControlType.Object,
        title: "Scroll",
        description: "Ribbon physics — wheel, drag, idle snap.",
        controls: {
            sensitivity: num(
                "Speed",
                SCROLL_SENSITIVITY_MIN,
                SCROLL_SENSITIVITY_MAX,
                0.02,
                SCROLL_DEFAULTS.sensitivity,
                undefined,
                "Wheel + drag distance. Higher = faster ribbon travel."
            ),
            snapDelay: num(
                "Idle Magnet",
                120,
                800,
                20,
                SCROLL_DEFAULTS.snapDelay,
                "ms",
                "Ms without input before snap magnet pulls to nearest card."
            ),
            scrollEase: num(
                "Ease",
                0.06,
                0.35,
                0.01,
                SCROLL_DEFAULTS.scrollEase,
                undefined,
                "Snap pull strength + wheel tail smoothing. Higher = tighter settle."
            ),
        },
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        description: "Concave bowl wave on the ribbon. 0 = flat scroll only.",
        controls: {
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: MOTION_DEFAULTS.intensity,
                min: 0,
                max: 45,
                step: 3,
                unit: "%",
                displayStepper: true,
                description:
                    "Bowl arc height + scroll kinetic. 0 = flat ribbon. 28 ≈ full arc; up to 45 adds headroom.",
            },
            focusDepth: {
                type: ControlType.Number,
                title: "Focus Depth",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: MOTION_DEFAULTS.focusDepth,
                description:
                    "Arc mix multiplier. 0 = off. Scales bowl peak, side fade, and 3D tilt strength.",
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        description: "Ribbon card sizing + expand image fit.",
        controls: {
            cardWidthPercent: num(
                "Card Width",
                18,
                42,
                1,
                LAYOUT_DEFAULTS.cardWidthPercent,
                "%",
                "Each card width as % of stage width."
            ),
            cardHeightPercent: num(
                "Card Height",
                28,
                80,
                1,
                LAYOUT_DEFAULTS.cardHeightPercent,
                "%",
                "Card height as % of stage height."
            ),
            gapPercent: num(
                "Gap",
                2,
                12,
                1,
                LAYOUT_DEFAULTS.gapPercent,
                "%",
                "Space between cards as % of stage width."
            ),
            borderRadius: num(
                "Radius",
                0,
                24,
                1,
                LAYOUT_DEFAULTS.borderRadius,
                "px",
                "Corner radius on ribbon cards. Animates to 0 on expand."
            ),
            expandFit: {
                type: ControlType.Enum,
                title: "Expand Fit",
                options: ["cover", "contain", "stretch"],
                optionTitles: ["Cover", "Contain", "Stretch"],
                defaultValue: LAYOUT_DEFAULTS.expandFit,
                displaySegmentedControl: true,
                description:
                    "How the image fills the stage during expand choreography.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        description: "Stage surface, depth camera, editorial overlays.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: STYLE_DEFAULTS.backgroundColor,
                description: "Stage fill behind ribbon and expand layers.",
            },
            blendUI: bool(
                "Difference UI",
                STYLE_DEFAULTS.blendUI,
                "Difference blend on expand copy + cursors. Best on light backgrounds."
            ),
            showVignette: bool(
                "Vignette",
                STYLE_DEFAULTS.showVignette,
                "Soft radial darkening at stage edges."
            ),
            showGrain: bool(
                "Stage Grain",
                STYLE_DEFAULTS.showGrain,
                "Subtle paper grain texture over the stage."
            ),
            perspective: num(
                "Perspective",
                800,
                2400,
                50,
                STYLE_DEFAULTS.perspective,
                "px",
                "3D camera distance during bowl wave + expand. Lower = more depth."
            ),
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description: "Pointer affordances — hover cursor + click-to-expand.",
        controls: {
            showProjectCursor: bool(
                "Project Cursor",
                INTERACTION_DEFAULTS.showProjectCursor,
                "Custom cursor with project title when hovering a card."
            ),
            cursorLabelOffset: num(
                "Cursor Offset",
                4,
                40,
                1,
                INTERACTION_DEFAULTS.cursorLabelOffset,
                "px",
                "Distance from pointer to cursor dot + label."
            ),
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        description: "Expand view type scale + font tokens.",
        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title",
                controls: "extended",
                description: "Large display title on expand.",
            },
            metaFont: {
                type: ControlType.Font,
                title: "Meta",
                controls: "extended",
                description: "Index, year, subtitle, tags, cursor label.",
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body",
                controls: "extended",
                description: "Description paragraph on expand.",
            },
            fontSizeTablet: num(
                "Title Tablet",
                36,
                96,
                2,
                TYPOGRAPHY_DEFAULTS.fontSizeTablet,
                "px",
                "Desktop/tablet title size cap (clamp scales down)."
            ),
            fontSizeMobile: num(
                "Title Mobile",
                28,
                64,
                2,
                TYPOGRAPHY_DEFAULTS.fontSizeMobile,
                "px",
                "Mobile title size cap (clamp scales down)."
            ),
        },
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "Project showcase",
        description: "Accessible name for the showcase region (screen readers).",
    },
})
