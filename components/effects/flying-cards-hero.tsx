/**
 * Flying Cards Hero
 *
 * An original, fully animated hero section for Framer.
 *
 * How to use
 *   1. Drop the component on a page and set Width to Fill (1fr).
 *   2. Set Height to ~300vh — the scene pins while the page scrolls through
 *      it. (With a fixed height such as 100vh the scroll story is skipped
 *      and only the hero animation plays.)
 *   3. Add your images, edit the text, done.
 *
 * On load
 *   - Photo cards stream out from around the centre in every direction —
 *     blurred and colour-smeared at birth, sharp mid-flight, waving like
 *     paper as they fly past the viewer.
 *   - The headline rises into place line by line; an optional accent word
 *     ticks endlessly inside brackets. The paragraph fades up.
 *   - Hover any card and it does a smooth 3D flip (hero only — off once
 *     the page scrolls).
 *
 * On scroll
 *   Cards fly in one after another and join into a 3D ring (a rolodex-style
 *   cylinder) while the headline parts and fades away. Once formed, the
 *   ring turns only while the page is scrolling — nothing moves on its own.
 *   Scrolling back up plays everything in reverse.
 *
 * Text
 *   - Two titles: direction (side by side / stacked), order, position
 *     (top / center / bottom), gap, per-title alignment and width.
 *   - One paragraph: position, offset, alignment, width and placement
 *     (bottom of the screen or below the title).
 *   - Content Width caps all text on wide screens; Title Tag sets the
 *     heading level for SEO.
 *   - The headline auto-fits, so text is never cut off or overflows.
 *
 * Other details
 *   - Built-in poster artwork when no images are added (no network requests)
 *   - Responsive: Framer's default breakpoints (Desktop ≥ 1200, Tablet
 *     810–1199, Phone < 810) or your own, with per-device title/card scale
 *   - Seeded layout: same seed = same composition on every load
 *   - Static on the Framer canvas (scrub with "Canvas Preview")
 *   - Pauses when off-screen, respects prefers-reduced-motion
 *
 * Originality note: all code, motion design and default copy in this file
 * are original. No third-party code, assets, fonts, imagery or brand text
 * are included.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
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

import { useReducedMotion } from "framer-motion"
import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

type ImageSource = { src?: string; srcSet?: string; alt?: string }
type BlendMode = "difference" | "exclusion" | "normal"
/** "auto" = the title's natural side (Title 1 left, Title 2 right). */
type TextAlign = "auto" | "left" | "center" | "right"
/** Titles side by side or stacked. "auto" stacks on phones. */
type TitleDirection = "auto" | "horizontal" | "vertical"
type VerticalPosition = "top" | "center" | "bottom"
type HorizontalPosition = "left" | "center" | "right"
/** Paragraph at the bottom of the screen, or right below the title. */
type ParagraphVertical = "bottom" | "belowTitle"
/** HTML tag for the headline (only one H1 per page is best for SEO). */
type TitleTag = "h1" | "h2" | "h3" | "div"

interface FlyingCardsHeroProps {
    images: ImageSource[]
    cardCount: number
    flyCount: number
    cardSize: number
    cardRadius: number
    cardShadow: boolean
    speed: number
    depth: number
    spread: number
    spin: number
    depthBlur: number
    motionTrail: number
    centerGap: number
    hoverFlip: boolean
    seed: number
    scrollRing: boolean
    joinPoint: number
    ringSize: number
    ringGap: number
    ringTilt: number
    ringTwist: number
    ringSpeed: number
    scrollSpin: number
    smoothing: number
    previewProgress: number
    background: string
    showText: boolean
    titleLeft: string
    titleRight: string
    accentWord: string
    accentSpeed: number
    paragraph: string
    textTravel: number
    titleFont: CSSProperties
    titleTag: TitleTag
    paragraphFont: CSSProperties
    textColor: string
    blendMode: BlendMode
    padding: number
    titleDirection: TitleDirection
    titleReverse: boolean
    titlePosition: VerticalPosition
    titleGap: number
    titleLeftAlign: TextAlign
    titleRightAlign: TextAlign
    titleWidth: number
    paragraphPosition: HorizontalPosition
    paragraphOffset: number
    paragraphAlign: TextAlign
    paragraphWidth: number
    paragraphVertical: ParagraphVertical
    contentWidth: number
    breakpoints: Partial<BreakpointSettings>
    style?: CSSProperties
}

interface CardSpec {
    index: number
    /** Random 0–0.8 offset so fly-through start times are not perfectly even. */
    jitter: number
    x: number
    y: number
    phase: number
    order: number
    drift: number
    rotateX: number
    rotateY: number
    rotateZ: number
    spinZ: number
    aspect: number
}

interface SceneConfig {
    width: number
    height: number
    perspective: number
    depth: number
    spread: number
    spin: number
    depthBlur: number
    motionTrail: number
    centerGap: number
    cardSize: number
    cardCount: number
    flyCount: number
    joinPoint: number
    ringSize: number
    ringGap: number
    ringTilt: number
    ringTwist: number
    scrollSpin: number
}

interface LoopConfig extends SceneConfig {
    speed: number
    scrollRing: boolean
    ringSpeed: number
    smoothing: number
    textTravel: number
}

interface Pose {
    x: number
    y: number
    z: number
    rx: number
    ry: number
    rz: number
    /** Horizontal scale (and vertical, unless `scaleY` differs). */
    scale: number
    scaleY: number
    opacity: number
    blur: number
    /** 0–1 strength of the colour motion trail. */
    streak: number
    /** Screen-space direction of travel (unit vector). */
    dirX: number
    dirY: number
}

/** How far through each scroll stage we are (0–1 each). */
interface Stages {
    ring: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Seconds for one card to travel from the circle to off-screen at speed 1. */
const CYCLE_SECONDS = 12
/** Seconds for the load-in intro. */
const INTRO_SECONDS = 1.6
/** Seconds for one hover flip. */
const FLIP_SECONDS = 0.9
/** Hover flip only works until the scroll story passes this point (0–1). */
const FLIP_SCROLL_LIMIT = 0.01
/**
 * Auto-fit: below this fraction of its size the headline may also wrap
 * lines. If it still does not fit it keeps shrinking, down to
 * `LAST_RESORT_FIT_SCALE`, so text is never cut off — even with extreme
 * settings.
 */
const MIN_FIT_SCALE = 0.5
const LAST_RESORT_FIT_SCALE = 0.25
const CARD_ASPECTS = [1, 0.75, 1.33, 0.8, 1.25, 1]

/** Colour sets for the built-in poster artwork: [background, accent, ink]. */
const POSTER_PALETTES = [
    ["#b3241f", "#f2efe9", "#111111"],
    ["#2f7fc1", "#f5f5f5", "#121212"],
    ["#f2efe9", "#c8261f", "#111111"],
    ["#141414", "#e2582a", "#f5f5f5"],
    ["#e8e4dc", "#2f7fc1", "#141414"],
    ["#8f1c18", "#f2d9c4", "#121212"],
    ["#d9d4cb", "#c8261f", "#1d1d1d"],
    ["#1b3f6b", "#f0b13a", "#f5f5f5"],
    ["#f4f1ea", "#e2582a", "#202020"],
    ["#2b2b2b", "#d63a2f", "#efefef"],
    ["#5aa3d8", "#ffffff", "#101010"],
    ["#c93a2c", "#f4efe6", "#151515"],
]

/**
 * Original, self-contained poster artwork (inline SVG) used until the user
 * adds their own images — no network requests and no third-party imagery.
 */
function makePoster(index: number): ImageSource {
    const [bg, accent, ink] = POSTER_PALETTES[index % POSTER_PALETTES.length]
    const cx = 150 + ((index * 37) % 60) - 30
    const shapes = [
        `<rect x='30' y='60' width='170' height='150' fill='${accent}'/>`,
        `<rect x='0' y='300' width='300' height='100' fill='${accent}'/>`,
        `<circle cx='210' cy='110' r='80' fill='${accent}'/>`,
        `<polygon points='0,400 300,180 300,400' fill='${accent}'/>`,
    ]
    const lineWidth = 60 + ((index * 13) % 120)
    const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400' viewBox='0 0 300 400'>` +
        `<rect width='300' height='400' fill='${bg}'/>` +
        shapes[index % shapes.length] +
        `<rect x='20' y='22' width='${lineWidth}' height='6' fill='${ink}'/>` +
        `<rect x='20' y='34' width='${Math.round(lineWidth * 0.6)}' height='6' fill='${ink}'/>` +
        `<circle cx='${cx}' cy='170' r='22' fill='${ink}'/>` +
        `<path d='M${cx - 20} 190 L${cx + 20} 190 L${cx + 70} 340 L${cx - 70} 340 Z' fill='${ink}'/>` +
        `</svg>`
    return {
        src: "data:image/svg+xml;utf8," + encodeURIComponent(svg),
        alt: "",
    }
}

/** Built-in artwork shown until the user adds their own images. */
const DEFAULT_IMAGES: ImageSource[] = Array.from({ length: 12 }, (_, index) =>
    makePoster(index)
)

const FALLBACK_GRADIENTS = [
    "linear-gradient(135deg, #ff3b30 0%, #7a0b0b 100%)",
    "linear-gradient(160deg, #1d4ed8 0%, #93c5fd 100%)",
    "linear-gradient(200deg, #111111 0%, #555555 100%)",
    "linear-gradient(120deg, #f59e0b 0%, #b45309 100%)",
    "linear-gradient(145deg, #e5e7eb 0%, #9ca3af 100%)",
    "linear-gradient(180deg, #0ea5e9 0%, #f97316 100%)",
]

/**
 * Ghost copies of the image that trail behind each card, giving a
 * long-exposure / chromatic smear look. `offset` is a fraction of the trail
 * length; `tint` colourises the copy.
 */
const TRAIL_GHOSTS = [
    {
        offset: 1,
        opacity: 0.35,
        tint: "sepia(1) saturate(6) hue-rotate(175deg)",
    }, // cool
    { offset: 0.66, opacity: 0.45, tint: "saturate(1.6)" }, // neutral smear
    {
        offset: 0.33,
        opacity: 0.6,
        tint: "sepia(1) saturate(7) hue-rotate(-20deg)",
    }, // warm
]

type Breakpoint = "desktop" | "tablet" | "mobile"

interface BreakpointSettings {
    /** "framer" = Framer's default breakpoints, "custom" = your own widths. */
    mode: "framer" | "custom"
    /** Widths below this use the Tablet layout (custom mode). */
    tabletBelow: number
    /** Widths below this use the Phone layout (custom mode). */
    phoneBelow: number
    tabletTitleScale: number
    phoneTitleScale: number
    tabletCardScale: number
    phoneCardScale: number
    /** Stack the two titles on phones (otherwise side by side). */
    phoneStackTitles: boolean
}

/** Framer's default breakpoints: Desktop ≥ 1200, Tablet 810–1199, Phone < 810. */
const FRAMER_BREAKPOINTS = { tabletBelow: 1200, phoneBelow: 810 }

const DEFAULT_BREAKPOINTS: BreakpointSettings = {
    mode: "framer",
    tabletBelow: FRAMER_BREAKPOINTS.tabletBelow,
    phoneBelow: FRAMER_BREAKPOINTS.phoneBelow,
    tabletTitleScale: 1,
    phoneTitleScale: 1,
    tabletCardScale: 1,
    phoneCardScale: 1,
    phoneStackTitles: true,
}

/** Merges the user's settings with the defaults and applies the mode. */
function resolveBreakpoints(
    value?: Partial<BreakpointSettings>
): BreakpointSettings {
    const merged = { ...DEFAULT_BREAKPOINTS, ...(value ?? {}) }
    if (merged.mode !== "custom") {
        return { ...merged, ...FRAMER_BREAKPOINTS }
    }
    // Keep the phone breakpoint below the tablet one.
    const tabletBelow = Math.max(1, merged.tabletBelow)
    const phoneBelow = Math.min(Math.max(1, merged.phoneBelow), tabletBelow)
    return { ...merged, tabletBelow, phoneBelow }
}

/** Breakpoints follow the component's own width (matches Framer's page breakpoints). */
function getBreakpoint(
    width: number,
    settings: BreakpointSettings
): Breakpoint {
    if (width < settings.phoneBelow) return "mobile"
    if (width < settings.tabletBelow) return "tablet"
    return "desktop"
}

/** Reads a font size from Framer's font control (number, "128px" or "8rem"). */
function toPx(value: unknown, fallback: number) {
    if (typeof value === "number" && isFinite(value)) return value
    if (typeof value === "string") {
        const parsed = parseFloat(value)
        if (isFinite(parsed)) {
            const unit = value.trim().toLowerCase()
            if (unit.endsWith("rem") || unit.endsWith("em")) return parsed * 16
            return parsed
        }
    }
    return fallback
}

/** Keyframes shared by the text animations. */
const KEYFRAMES_CSS = `
@keyframes fch-rise { from { transform: translateY(105%); } to { transform: translateY(0); } }
@keyframes fch-fade-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fch-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
`

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)"

/** useLayoutEffect in the browser, useEffect on the server (no SSR warning). */
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * Extra room inside every clipping mask so tight line heights (e.g. 0.9em),
 * descenders (g, y, p), ascenders/accents and negative letter spacing are
 * never cut off. The negative margins cancel it out, so layout is unchanged.
 */
const MASK_ROOM = { top: "0.3em", bottom: "0.4em", side: "0.12em" }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (from: number, to: number, amount: number) =>
    from + (to - from) * amount
const toRadians = (degrees: number) => (degrees * Math.PI) / 180
const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/** Rotates `from` toward `to` the short way round (avoids wild spins). */
function lerpAngle(from: number, to: number, amount: number) {
    const difference = ((((to - from) % 360) + 540) % 360) - 180
    return from + difference * amount
}

/** Blends every field of two poses (angles the short way round). */
function blendPoses(from: Pose, to: Pose, t: number): Pose {
    return {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
        z: lerp(from.z, to.z, t),
        rx: lerpAngle(from.rx, to.rx, t),
        ry: lerpAngle(from.ry, to.ry, t),
        rz: lerpAngle(from.rz, to.rz, t),
        scale: lerp(from.scale, to.scale, t),
        scaleY: lerp(from.scaleY, to.scaleY, t),
        opacity: lerp(from.opacity, to.opacity, t),
        blur: lerp(from.blur, to.blur, t),
        streak: lerp(from.streak, to.streak, t),
        dirX: from.dirX,
        dirY: from.dirY,
    }
}

/** Small deterministic PRNG so layouts match between server and client. */
function createRandom(seed: number) {
    let state = seed | 0
    return () => {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function createCards(count: number, seed: number): CardSpec[] {
    const random = createRandom(seed)
    return Array.from({ length: count }, (_, index) => {
        // Golden angle: directions spread evenly round the full circle.
        const angle = index * 2.39996 + (random() - 0.5) * 0.6
        const radius = 0.2 + random() * 0.9
        return {
            index,
            jitter: random() * 0.8,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius * 0.8,
            phase: (index + random() * 0.8) / count,
            // Order in which cards join the ring while scrolling.
            order: random(),
            drift: 0.2 + random() * 0.8,
            rotateX: random() * 60 - 30,
            rotateY: random() * 90 - 45,
            rotateZ: random() * 40 - 20,
            spinZ: (random() - 0.5) * 30,
            aspect: CARD_ASPECTS[Math.floor(random() * CARD_ASPECTS.length)],
        }
    })
}

/** Uniform portrait size used in the ring. */
function getStackScale(
    card: CardSpec,
    config: SceneConfig,
    widthFactor: number,
    heightFactor: number
) {
    const baseWidth = config.cardSize * Math.sqrt(card.aspect)
    const baseHeight = config.cardSize / Math.sqrt(card.aspect)
    return {
        width: config.cardSize * widthFactor * config.ringSize,
        scale: (config.cardSize * widthFactor * config.ringSize) / baseWidth,
        scaleY: (config.cardSize * heightFactor * config.ringSize) / baseHeight,
    }
}

// ─── Poses ───────────────────────────────────────────────────────────────────

/**
 * Fly-through pose at time `time` (seconds, speed-scaled).
 * Cards are born around an empty centre — soft, blurred and colour-smeared —
 * then fly outward in every direction, sharpening as they travel and waving
 * like paper, until they leave the screen. Loops forever.
 *
 * Positions are planned in screen space (so the birth circle is a true
 * circle on screen) and converted back to 3D using the card's depth.
 */
function getFlyPose(card: CardSpec, time: number, config: SceneConfig): Pose {
    // Cards beyond `flyCount` only appear in the ring: they wait just above
    // the top edge and swoop down when the ring forms.
    if (card.index >= config.flyCount) return getParkedPose(card, time, config)

    const start = (card.index + card.jitter) / Math.max(1, config.flyCount)
    const progress = (((start + time / CYCLE_SECONDS) % 1) + 1) % 1

    // Depth: a little behind the screen → slightly in front of it, so cards
    // grow as they travel outward.
    const z = lerp(-config.depth * 0.6, config.perspective * 0.3, progress)
    const depthScale = config.perspective / Math.max(1, config.perspective - z)

    const angle = Math.atan2(card.y, card.x)
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)

    // On-screen distance from centre: starts on the circle (leaving the centre
    // empty) and accelerates out past the corners of the screen.
    const halfMin = Math.min(config.width, config.height) / 2
    const halfDiagonal = Math.hypot(config.width, config.height) / 2
    const startRadius = config.centerGap * halfMin * (0.85 + card.drift * 0.3)
    const endRadius = halfDiagonal * config.spread * (1.0 + card.drift * 0.25)
    const screenRadius = lerp(startRadius, endRadius, Math.pow(progress, 1.25))

    // Sideways wave so paths curve slightly instead of being straight lines.
    const wave =
        Math.sin(progress * Math.PI * 2 + card.phase * 9) * 28 * progress
    const screenX = dirX * screenRadius - dirY * wave
    const screenY = dirY * screenRadius + dirX * wave

    // Paper-like flutter instead of a constant spin.
    const flutter = time * 1.6 + card.phase * 20

    // Focus: blurred + smeared at birth, sharp mid-flight, soft at exit.
    const birth = clamp01((0.3 - progress) / 0.3)
    const exit = clamp01((progress - 0.7) / 0.3)

    return {
        x: screenX / depthScale,
        y: screenY / depthScale,
        z,
        rx: (card.rotateX + Math.sin(flutter) * 28) * config.spin,
        ry: (card.rotateY + Math.cos(flutter * 0.8) * 38) * config.spin,
        rz: (card.rotateZ + card.spinZ * time * 0.6) * config.spin,
        scale: 1,
        scaleY: 1,
        opacity: Math.min(
            clamp01(progress / 0.1),
            clamp01((1 - progress) / 0.04)
        ),
        blur: config.depthBlur * (Math.pow(birth, 1.3) + exit * exit * 0.5),
        streak: Math.max(Math.pow(birth, 1.1), Math.pow(exit, 1.5) * 0.8),
        dirX,
        dirY,
    }
}

/** Off-screen waiting spot (above the top edge) for ring-only cards. */
function getParkedPose(
    card: CardSpec,
    time: number,
    config: SceneConfig
): Pose {
    const z = lerp(-config.depth * 0.4, 0, card.phase)
    const depthScale = config.perspective / Math.max(1, config.perspective - z)
    const screenX = card.x * config.width * 0.45
    const screenY = -(
        config.height / 2 +
        config.cardSize * 1.2 +
        card.drift * 160
    )
    const flutter = time * 1.6 + card.phase * 20

    return {
        x: screenX / depthScale,
        y: screenY / depthScale,
        z,
        rx: (card.rotateX + Math.sin(flutter) * 28) * config.spin,
        ry: (card.rotateY + Math.cos(flutter * 0.8) * 38) * config.spin,
        rz: card.rotateZ * config.spin,
        scale: 1,
        scaleY: 1,
        opacity: 1,
        blur: 0,
        streak: 0,
        dirX: 0,
        dirY: 1,
    }
}

/**
 * Ring pose: cards stand round a hollow vertical core — a rolodex-style
 * cylinder viewed slightly from above, each card turned like a turbine
 * blade so faces show all the way round.
 */
function getRingPose(
    card: CardSpec,
    ringAngle: number,
    config: SceneConfig
): Pose {
    const count = Math.max(1, config.cardCount)
    const angle = (card.index / count) * 360 + ringAngle
    const size = getStackScale(card, config, 0.78, 1.15)

    const radius = config.ringGap + size.width / 2
    const localX = Math.cos(toRadians(angle)) * radius
    const localZ = -Math.sin(toRadians(angle)) * radius

    // Tilt the whole ring toward the camera.
    const tilt = config.ringTilt
    const cos = Math.cos(toRadians(tilt))
    const sin = Math.sin(toRadians(tilt))
    const backness = clamp01(-localZ / Math.max(1, radius))

    return {
        x: localX,
        y: -localZ * sin,
        z: localZ * cos,
        rx: tilt,
        ry: angle + config.ringTwist,
        rz: 0,
        scale: size.scale,
        scaleY: size.scaleY,
        opacity: 1,
        blur: config.depthBlur * 0.2 * backness,
        streak: 0,
        dirX: 0,
        dirY: 0,
    }
}

/** Per-card progress through a stage, staggered so cards move in turn. */
function staggered(amount: number, order: number, stagger = 0.45) {
    return clamp01((amount - order * stagger) / (1 - stagger))
}

/** Full pose for one card: fly-through → ring (the final state). */
function getCardPose(
    card: CardSpec,
    stages: Stages,
    flyTime: number,
    ringAngle: number,
    config: SceneConfig
): Pose {
    const fly = getFlyPose(card, flyTime, config)
    if (stages.ring <= 0) return fly

    // Stage 1: fly-through → ring.
    const ringLocal = staggered(stages.ring, card.order)
    let pose = fly
    if (ringLocal > 0) {
        const ring = getRingPose(card, ringAngle, config)
        if (ringLocal >= 1) {
            pose = ring
        } else {
            const t = easeInOutCubic(ringLocal)
            const inFlight = Math.sin(ringLocal * Math.PI)
            pose = blendPoses(fly, ring, t)
            // Swoop slightly toward the camera mid-flight for a smooth arc.
            pose.z += inFlight * config.perspective * 0.04
            pose.blur += inFlight * config.depthBlur * 0.2
            // Fade in quickly so cards that were out of view don't pop.
            pose.opacity = lerp(fly.opacity, 1, clamp01(ringLocal * 3))
        }
    }

    return pose
}

/** Hover flip: a full 3D turn with a small lift, eased in and out. */
function applyFlip(pose: Pose, flipProgress: number): Pose {
    if (flipProgress <= 0 || flipProgress >= 1) return pose
    const eased = easeInOutCubic(flipProgress)
    const lift = 1 + Math.sin(flipProgress * Math.PI) * 0.14
    return {
        ...pose,
        ry: pose.ry + eased * 360,
        z: pose.z + Math.sin(flipProgress * Math.PI) * 60,
        scale: pose.scale * lift,
        scaleY: pose.scaleY * lift,
        blur: pose.blur * (1 - Math.sin(flipProgress * Math.PI) * 0.6),
    }
}

// ─── Styling ─────────────────────────────────────────────────────────────────

/**
 * Turns a pose into styles for the card wrapper.
 * - The wrapper is positioned, then rotated to face its direction of travel,
 *   so trail ghosts only ever need to shift along its local X axis.
 * - The 3D rotation (`--fch-inner`) first undoes that in-plane rotation, so
 *   the card itself still looks unrotated.
 * - All cards share ONE 3D space (preserve-3d). Blur and opacity would
 *   flatten it if set on the wrapper, so they travel as CSS variables to the
 *   card faces.
 */
function formatPose(pose: Pose, config: SceneConfig) {
    const travelAngle =
        pose.dirX === 0 && pose.dirY === 0
            ? 0
            : (Math.atan2(pose.dirY, pose.dirX) * 180) / Math.PI
    const trail = pose.streak * config.motionTrail * config.cardSize * 0.55

    return {
        outer: `translate3d(${pose.x.toFixed(1)}px, ${pose.y.toFixed(1)}px, ${pose.z.toFixed(1)}px) rotate(${travelAngle.toFixed(2)}deg) scale(${pose.scale.toFixed(3)}, ${pose.scaleY.toFixed(3)})`,
        inner: `rotate(${(-travelAngle).toFixed(2)}deg) rotateX(${pose.rx.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg) rotateZ(${pose.rz.toFixed(2)}deg)`,
        trail: `${trail.toFixed(1)}px`,
        trailOpacity: (trail > 1 ? clamp01(pose.streak * 1.4) : 0).toFixed(3),
        opacity: clamp01(pose.opacity).toFixed(3),
        // Always a valid filter function so it can be chained in CSS.
        filter: `blur(${Math.max(0, pose.blur).toFixed(1)}px)`,
    }
}

type CardStyle = ReturnType<typeof formatPose>

function applyCardStyle(node: HTMLElement, style: CardStyle) {
    node.style.transform = style.outer
    node.style.setProperty("--fch-inner", style.inner)
    node.style.setProperty("--fch-trail", style.trail)
    node.style.setProperty("--fch-trail-opacity", style.trailOpacity)
    node.style.setProperty("--fch-opacity", style.opacity)
    node.style.setProperty("--fch-filter", style.filter)
}

// ─── Scroll ──────────────────────────────────────────────────────────────────

/**
 * 0 → 1 scroll progress of the section, starting at 0 at the top of the page.
 * Taller than the viewport: progress runs while the scene is pinned.
 */
function getScrollProgress(element: HTMLElement) {
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight || 1
    const distance =
        rect.height > viewportHeight + 1
            ? rect.height - viewportHeight
            : rect.height * 0.6
    return clamp01(-rect.top / Math.max(1, distance))
}

/**
 * Scroll stage: the ring rises 0 → 1 from the top of the scroll to
 * `joinPoint`, then holds — the ring is the final state.
 */
function getStages(
    progress: number,
    config: Pick<SceneConfig, "joinPoint">
): Stages {
    const joinPoint = Math.max(0.05, config.joinPoint)
    return { ring: clamp01(progress / joinPoint) }
}

/**
 * Ring turn driven by scrolling: the ring rotates with the scroll for the
 * whole section (forward when scrolling down, back when scrolling up) and
 * stands still whenever the page is not scrolling.
 */
function getScrollTurn(
    progress: number,
    config: Pick<SceneConfig, "scrollSpin">
) {
    return clamp01(progress) * config.scrollSpin
}

// ─── Text pieces ─────────────────────────────────────────────────────────────

/**
 * A word in brackets that scrolls endlessly inside a window the width of
 * the word itself.
 */
function AccentMarquee(props: {
    word: string
    duration: number
    animate: boolean
}) {
    const { word, duration, animate } = props
    const gap = "0.3em"
    return (
        <span style={{ whiteSpace: "nowrap" }}>
            (
            <span
                data-fch-marquee=""
                data-fch-mask=""
                style={{
                    position: "relative",
                    // inline-flex keeps the window on the text baseline even
                    // though it clips (an inline-block would sit on its bottom edge).
                    display: "inline-flex",
                    overflow: "hidden",
                    verticalAlign: "baseline",
                    paddingTop: MASK_ROOM.top,
                    paddingBottom: MASK_ROOM.bottom,
                    marginTop: `-${MASK_ROOM.top}`,
                    marginBottom: `-${MASK_ROOM.bottom}`,
                    paddingRight: gap,
                }}
            >
                {/* Transparent copy sets the window's size and is the one
                    screen readers announce (the moving copies are hidden). */}
                <span style={{ opacity: 0 }}>{word}</span>
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        // Same top room as the window so both copies line up.
                        paddingTop: MASK_ROOM.top,
                        display: "flex",
                        animation: animate
                            ? `fch-marquee ${Math.max(0.5, duration)}s linear infinite`
                            : undefined,
                    }}
                >
                    <span style={{ paddingRight: gap }}>{word}</span>
                    <span style={{ paddingRight: gap }}>{word}</span>
                </span>
            </span>
            )
        </span>
    )
}

/**
 * One headline line that rises into view from behind a mask on load.
 */
function RevealLine(props: {
    children: ReactNode
    delay: number
    animate: boolean
    /** Allow the line to wrap (only as a last resort when auto-fit is at its minimum). */
    wrap?: boolean
}) {
    const { children, delay, animate, wrap = false } = props
    return (
        <span
            data-fch-mask=""
            style={{
                display: "block",
                overflow: "hidden",
                // Room for descenders / overhanging letters (see MASK_ROOM).
                padding: `${MASK_ROOM.top} ${MASK_ROOM.side} ${MASK_ROOM.bottom}`,
                margin: `-${MASK_ROOM.top} -${MASK_ROOM.side} -${MASK_ROOM.bottom}`,
            }}
        >
            <span
                style={{
                    display: "block",
                    whiteSpace: wrap ? "normal" : "nowrap",
                    animation: animate
                        ? `fch-rise 1.1s ${EASE_OUT} ${delay.toFixed(2)}s both`
                        : undefined,
                }}
            >
                {children}
            </span>
        </span>
    )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FlyingCardsHero(
    rawProps: Partial<FlyingCardsHeroProps>
) {
    const props = withDefaults(rawProps)
    const {
        images,
        cardCount,
        flyCount,
        cardSize,
        cardRadius,
        cardShadow,
        speed,
        depth,
        spread,
        spin,
        depthBlur,
        motionTrail,
        centerGap,
        hoverFlip,
        seed,
        scrollRing,
        joinPoint,
        ringSize,
        ringGap,
        ringTilt,
        ringTwist,
        ringSpeed,
        scrollSpin,
        smoothing,
        previewProgress,
        background,
        showText,
        titleLeft,
        titleRight,
        accentWord,
        accentSpeed,
        paragraph,
        textTravel,
        titleFont,
        titleTag,
        paragraphFont,
        textColor,
        blendMode,
        padding,
        titleDirection,
        titleReverse,
        titlePosition,
        titleGap,
        titleLeftAlign,
        titleRightAlign,
        titleWidth,
        paragraphPosition,
        paragraphOffset,
        paragraphAlign,
        paragraphWidth,
        paragraphVertical,
        contentWidth,
        breakpoints,
        style,
    } = props

    // Canvas, thumbnails and exports show a still frame.
    const renderTarget = RenderTarget.current()
    const isCanvas =
        renderTarget === RenderTarget.canvas ||
        renderTarget === RenderTarget.thumbnail ||
        renderTarget === RenderTarget.export
    const prefersReducedMotion = useReducedMotion()
    const isStatic = isCanvas || !!prefersReducedMotion
    const animateText = !isStatic

    const rootRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLDivElement | null)[]>([])
    const textRef = useRef<HTMLDivElement>(null)
    const titleLeftRef = useRef<HTMLSpanElement>(null)
    const titleRightRef = useRef<HTMLSpanElement>(null)

    const flyTimeRef = useRef(0)
    const clockRef = useRef(0)
    const introRef = useRef(isStatic ? 1 : 0)
    const ringAngleRef = useRef(0)
    const progressRef = useRef(0)
    /** Latest scroll progress — hover flips only work at the very top. */
    const scrolledRef = useRef(0)
    /** Whether cards currently accept hover (only before scrolling). */
    const interactiveRef = useRef(true)
    /** Clock time each card's hover flip started (-1 = not flipping). */
    const flipStartRef = useRef<number[]>([])
    const [size, setSize] = useState({ width: 1200, height: 800 })

    const cards = useMemo(() => createCards(cardCount, seed), [cardCount, seed])
    const perspective = Math.max(size.width, size.height) * 0.9

    // Responsive sizing — everything follows the component's own width.
    const bp = resolveBreakpoints(breakpoints)
    const breakpoint = getBreakpoint(size.width, bp)
    const isMobile = breakpoint === "mobile"
    const deviceCardScale =
        breakpoint === "mobile"
            ? bp.phoneCardScale
            : breakpoint === "tablet"
              ? bp.tabletCardScale
              : 1
    const deviceTitleScale =
        breakpoint === "mobile"
            ? bp.phoneTitleScale
            : breakpoint === "tablet"
              ? bp.tabletTitleScale
              : 1
    const sceneScale =
        Math.min(1, Math.max(0.5, size.width / 1200)) *
        Math.max(0.1, deviceCardScale)
    const effectiveCardSize = cardSize * sceneScale
    const effectiveRingGap = ringGap * sceneScale

    // Latest settings for the animation loop, without restarting it.
    const configRef = useRef({} as LoopConfig)
    configRef.current = {
        width: size.width,
        height: size.height,
        perspective,
        depth,
        spread,
        spin,
        depthBlur,
        motionTrail,
        centerGap,
        cardSize: effectiveCardSize,
        cardCount,
        flyCount,
        joinPoint,
        ringSize,
        ringGap: effectiveRingGap,
        ringTilt,
        ringTwist,
        scrollSpin,
        speed,
        scrollRing,
        ringSpeed,
        smoothing,
        textTravel,
    }

    // On the canvas, scrub the scroll state with "Canvas Preview".
    if (isCanvas) progressRef.current = scrollRing ? previewProgress : 0

    // Track the visible stage size.
    useEffect(() => {
        const element = stageRef.current
        if (!element) return
        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) setSize({ width, height })
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    // Animation loop — writes styles directly to avoid React re-renders.
    useEffect(() => {
        if (isStatic) return
        const root = rootRef.current
        if (!root) return

        let frame = 0
        let lastTime = performance.now()
        let isVisible = true

        // Jump straight to the current scroll position (e.g. reload mid-page).
        if (configRef.current.scrollRing)
            progressRef.current = getScrollProgress(root)

        const tick = (now: number) => {
            frame = 0
            if (!isVisible) return
            const delta = Math.max(0, Math.min((now - lastTime) / 1000, 0.05))
            lastTime = now
            const config = configRef.current

            clockRef.current += delta
            introRef.current = clamp01(introRef.current + delta / INTRO_SECONDS)
            const clock = clockRef.current
            const intro = introRef.current

            // Smoothed scroll progress — this is what makes the stages glide.
            const target = config.scrollRing ? getScrollProgress(root) : 0
            const follow =
                1 - Math.pow(1 - clamp01(config.smoothing), delta * 60)
            progressRef.current += (target - progressRef.current) * follow
            const stages = getStages(progressRef.current, config)
            scrolledRef.current = progressRef.current

            // Fly-through eases to a stop as soon as cards start joining, so no
            // card wraps from back to front mid-join.
            const flyFactor = 1 - clamp01(stages.ring / 0.15)
            flyTimeRef.current += delta * config.speed * flyFactor

            // The ring turns while it forms and eases to a complete stop once
            // it is finished — after that nothing animates any more.
            ringAngleRef.current +=
                delta * config.ringSpeed * (1 - easeInOutCubic(stages.ring))
            const ringAngle =
                ringAngleRef.current +
                getScrollTurn(progressRef.current, config)

            const flips = flipStartRef.current
            for (let i = 0; i < cards.length; i++) {
                const node = cardRefs.current[i]
                if (!node) continue
                let pose = getCardPose(
                    cards[i],
                    stages,
                    flyTimeRef.current,
                    ringAngle,
                    config
                )

                // Load-in: cards fade in one after another.
                const introCard = easeOutCubic(
                    clamp01((intro - cards[i].jitter * 0.5) / 0.6)
                )
                if (introCard < 1)
                    pose = { ...pose, opacity: pose.opacity * introCard }

                // Hover flip — only in the hero at the top. Cancelled as soon as
                // the page scrolls, so the ring is never disturbed.
                const flipStart = flips[i] ?? -1
                if (flipStart >= 0 && progressRef.current > FLIP_SCROLL_LIMIT) {
                    flips[i] = -1
                } else if (flipStart >= 0) {
                    const flipProgress = (clock - flipStart) / FLIP_SECONDS
                    if (flipProgress >= 1) flips[i] = -1
                    else pose = applyFlip(pose, flipProgress)
                }

                applyCardStyle(node, formatPose(pose, config))
            }

            // Cards only react to the cursor in the hero, before any scrolling.
            const interactive = progressRef.current <= FLIP_SCROLL_LIMIT
            if (interactive !== interactiveRef.current) {
                interactiveRef.current = interactive
                for (const node of cardRefs.current) {
                    if (!node) continue
                    node.style.pointerEvents = interactive ? "auto" : "none"
                    node.style.cursor = interactive ? "pointer" : "default"
                }
            }

            // Headline parts and fades as the ring forms, and stays hidden.
            const textAmount = easeInOutCubic(stages.ring)
            if (textRef.current) {
                textRef.current.style.opacity = (1 - textAmount).toFixed(3)
            }
            if (titleLeftRef.current) {
                titleLeftRef.current.style.transform = `translate3d(${(-textAmount * config.textTravel).toFixed(1)}px, 0, 0)`
            }
            if (titleRightRef.current) {
                titleRightRef.current.style.transform = `translate3d(${(textAmount * config.textTravel).toFixed(1)}px, 0, 0)`
            }

            frame = requestAnimationFrame(tick)
        }

        const visibilityObserver = new IntersectionObserver(([entry]) => {
            isVisible = entry.isIntersecting
            if (isVisible && !frame) {
                lastTime = performance.now()
                frame = requestAnimationFrame(tick)
            }
        })
        visibilityObserver.observe(root)
        frame = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(frame)
            visibilityObserver.disconnect()
        }
    }, [isStatic, cards])

    const startFlip = (index: number) => {
        if (scrolledRef.current > FLIP_SCROLL_LIMIT) return // hero only
        const flips = flipStartRef.current
        if ((flips[index] ?? -1) >= 0) return // already flipping
        flips[index] = clockRef.current
    }

    const userImages = (images ?? []).filter((image) => image?.src)
    const sourceImages = userImages.length > 0 ? userImages : DEFAULT_IMAGES

    // Initial (and canvas) render state.
    const renderStages = getStages(progressRef.current, configRef.current)
    const renderTextAmount = easeInOutCubic(renderStages.ring)
    const renderRingAngle =
        ringAngleRef.current +
        getScrollTurn(progressRef.current, configRef.current)
    const pad = Math.round(Math.min(padding, Math.max(16, size.width * 0.05)))

    // ── Title layout ──
    // Direction: side by side or stacked. "auto" stacks on phones (see the
    // Breakpoints → Phone Titles setting) and sits side by side elsewhere.
    const horizontalTitles =
        titleDirection === "horizontal" ||
        (titleDirection !== "vertical" && !(isMobile && bp.phoneStackTitles))
    // The gap shrinks with the screen and never takes more than 15% of it.
    const titleGapPx = Math.round(
        Math.min(
            Math.max(0, titleGap ?? 24) * Math.min(1, size.width / 1200),
            size.width * 0.15
        )
    )
    const titlePos: VerticalPosition = titlePosition || "top"
    // Headline scales with both width and height, so it fits on wide,
    // narrow and short (e.g. landscape phone) screens alike.
    const titleScale = Math.min(1, size.width / 1280, size.height / 880)
    const baseTitleSize =
        toPx(titleFont?.fontSize, 128) *
        Math.max(0.3, titleScale) *
        Math.max(0.1, deviceTitleScale)
    const pickAlign = (
        value: TextAlign | undefined,
        auto: Exclude<TextAlign, "auto">
    ) => (!value || value === "auto" ? auto : value)
    const leftAlign = pickAlign(titleLeftAlign, "left")
    const rightAlign = pickAlign(titleRightAlign, "right")
    const safeTitleWidth = Math.min(100, Math.max(10, titleWidth || 50))
    // Each title gets a fixed box so its alignment inside the box is visible.
    const titleBoxWidth = horizontalTitles
        ? `calc(${safeTitleWidth}% - ${titleGapPx / 2}px)`
        : "100%"

    // ── Paragraph layout ──
    const paragraphText = paragraph ?? ""
    const paragraphSize = Math.max(
        13,
        Math.round(toPx(paragraphFont?.fontSize, 18) * (isMobile ? 0.9 : 1))
    )
    const paragraphPos: HorizontalPosition = paragraphPosition || "left"
    // Offset from the chosen side: full on desktop, half on tablet, none on phone.
    const deviceOffset =
        breakpoint === "mobile" ? 0 : breakpoint === "tablet" ? 0.5 : 1
    const offsetPct =
        paragraphPos === "center"
            ? 0
            : Math.min(80, Math.max(0, paragraphOffset ?? 0)) * deviceOffset
    const paragraphTextAlign = pickAlign(paragraphAlign, paragraphPos)
    const paragraphSelf =
        paragraphPos === "center"
            ? "center"
            : paragraphPos === "right"
              ? "flex-end"
              : "flex-start"
    const safeParagraphWidth = Math.max(80, paragraphWidth || 360)
    const paragraphBelowTitle = paragraphVertical === "belowTitle"

    // Optional max width for all text, centred on wide screens.
    const sidePadding =
        contentWidth > 0
            ? `max(${pad}px, calc((100% - ${contentWidth}px) / 2))`
            : `${pad}px`

    // Auto-fit: if the text does not fit the screen (long titles, long words,
    // short screens) the headline shrinks step by step until it does.
    const fitKey = [
        size.width,
        size.height,
        titleLeft,
        titleRight,
        accentWord,
        paragraphText,
        padding,
        JSON.stringify(titleFont ?? {}),
        JSON.stringify(paragraphFont ?? {}),
        JSON.stringify(bp),
        titleDirection,
        titleReverse,
        titlePosition,
        titleGap,
        titleLeftAlign,
        titleRightAlign,
        titleWidth,
        paragraphPosition,
        paragraphOffset,
        paragraphAlign,
        paragraphWidth,
        paragraphVertical,
        contentWidth,
    ].join("§")
    const [fit, setFit] = useState({ key: "", scale: 1 })
    const fitScale = fit.key === fitKey ? fit.scale : 1
    const titleSize = Math.max(12, Math.round(baseTitleSize * fitScale))
    /** Lines may wrap from here on. */
    const atMinFit = fitScale <= MIN_FIT_SCALE + 0.001
    const atLastResort = fitScale <= LAST_RESORT_FIT_SCALE + 0.001
    useIsomorphicLayoutEffect(() => {
        const overlay = textRef.current
        if (!overlay) {
            if (fit.key !== fitKey) setFit({ key: fitKey, scale: 1 })
            return
        }
        const tooTall = overlay.scrollHeight > overlay.clientHeight + 1
        // Measure each headline line mask (they include room for overhanging
        // letters). The ticking accent word overflows its window on purpose,
        // so it is skipped.
        const tooWide = Array.from(
            overlay.querySelectorAll("[data-fch-mask]:not([data-fch-marquee])")
        ).some((el) => el.scrollWidth > el.clientWidth + 1)
        // Title boxes grow to fit their words, so also check they stay inside
        // the heading. Layout offsets ignore the scroll "part" transforms.
        const heading = overlay.querySelector<HTMLElement>("[data-fch-title]")
        const outside =
            !!heading &&
            [titleLeftRef.current, titleRightRef.current].some(
                (el) =>
                    !!el &&
                    (el.offsetLeft < heading.offsetLeft - 1 ||
                        el.offsetLeft + el.offsetWidth >
                            heading.offsetLeft + heading.offsetWidth + 1)
            )
        if ((tooTall || tooWide || outside) && !atLastResort) {
            // Pause at MIN_FIT_SCALE (wrapping kicks in), then continue if needed.
            const next = fitScale * 0.9
            setFit({
                key: fitKey,
                scale:
                    fitScale > MIN_FIT_SCALE + 0.001
                        ? Math.max(MIN_FIT_SCALE, next)
                        : Math.max(LAST_RESORT_FIT_SCALE, next),
            })
        } else if (fit.key !== fitKey) {
            setFit({ key: fitKey, scale: fitScale })
        }
    })
    const canFlip =
        hoverFlip && !isStatic && progressRef.current <= FLIP_SCROLL_LIMIT

    const leftLines = titleLeft ? titleLeft.split("\n") : []
    const rightLines = titleRight ? titleRight.split("\n") : []
    if (accentWord && rightLines.length === 0) rightLines.push("")
    const Heading = (titleTag || "h1") as "h1"

    return (
        <div
            ref={rootRef}
            data-fch-breakpoint={breakpoint}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background,
                // `clip` (not `hidden`) so the sticky stage can still pin.
                overflow: "clip",
            }}
        >
            <style>{KEYFRAMES_CSS}</style>

            {/* Pinned stage: sticks to the viewport while the section scrolls */}
            <div
                ref={stageRef}
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100%",
                    height: "100vh",
                    maxHeight: "100%",
                    overflow: "hidden",
                    background,
                    isolation: "isolate",
                }}
            >
                {/* 3D card field */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        perspective: `${perspective}px`,
                        perspectiveOrigin: "50% 50%",
                        // One shared 3D space: the browser depth-sorts cards.
                        transformStyle: "preserve-3d",
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                >
                    {cards.map((card, index) => {
                        const width = effectiveCardSize * Math.sqrt(card.aspect)
                        const height =
                            effectiveCardSize / Math.sqrt(card.aspect)
                        let renderPose = getCardPose(
                            card,
                            renderStages,
                            flyTimeRef.current,
                            renderRingAngle,
                            configRef.current
                        )
                        if (!isStatic && introRef.current < 1) {
                            renderPose = { ...renderPose, opacity: 0 }
                        }
                        const frame = formatPose(renderPose, configRef.current)
                        const image = sourceImages[index % sourceImages.length]

                        // One card face (image on a gradient fallback), rotated
                        // in 3D via `--fch-inner`. Blur/opacity live here (not
                        // on the wrapper) so the shared 3D space is never
                        // flattened.
                        const renderFace = (extraStyle?: CSSProperties) => (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: cardRadius,
                                    overflow: "hidden",
                                    // Gradient shows while the photo loads or if it fails.
                                    background:
                                        FALLBACK_GRADIENTS[
                                            index % FALLBACK_GRADIENTS.length
                                        ],
                                    transform: "var(--fch-inner)",
                                    opacity: "var(--fch-opacity, 1)",
                                    filter: "var(--fch-filter, none)",
                                    willChange: "transform, opacity, filter",
                                    ...extraStyle,
                                }}
                            >
                                {image?.src && (
                                    <img
                                        src={image.src}
                                        srcSet={image.srcSet}
                                        sizes={`${Math.round(effectiveCardSize * 2)}px`}
                                        alt={image.alt ?? ""}
                                        draggable={false}
                                        loading="lazy"
                                        onError={(event) => {
                                            event.currentTarget.style.display =
                                                "none"
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                )}
                            </div>
                        )

                        return (
                            <div
                                key={index}
                                data-fch-card=""
                                ref={(node) => {
                                    cardRefs.current[index] = node
                                }}
                                onPointerEnter={
                                    hoverFlip && !isStatic
                                        ? () => startFlip(index)
                                        : undefined
                                }
                                style={
                                    {
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        width,
                                        height,
                                        marginLeft: -width / 2,
                                        marginTop: -height / 2,
                                        transformStyle: "preserve-3d",
                                        willChange: "transform",
                                        transform: frame.outer,
                                        pointerEvents: canFlip
                                            ? "auto"
                                            : "none",
                                        cursor: canFlip ? "pointer" : undefined,
                                        "--fch-inner": frame.inner,
                                        "--fch-trail": frame.trail,
                                        "--fch-trail-opacity":
                                            frame.trailOpacity,
                                        "--fch-opacity": frame.opacity,
                                        "--fch-filter": frame.filter,
                                    } as CSSProperties
                                }
                            >
                                {/* Motion-trail ghosts (behind the card) */}
                                {motionTrail > 0 &&
                                    TRAIL_GHOSTS.map((ghost, ghostIndex) => (
                                        <div
                                            key={ghostIndex}
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                transformStyle: "preserve-3d",
                                                // Slightly behind the card so they never z-fight.
                                                transform: `translate3d(calc(var(--fch-trail, 0px) * -${ghost.offset}), 0, -${ghostIndex + 1}px)`,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            {renderFace({
                                                opacity: `calc(var(--fch-trail-opacity, 0) * var(--fch-opacity, 1) * ${ghost.opacity})`,
                                                filter: `${ghost.tint} blur(${(2 + ghost.offset * 4).toFixed(0)}px) var(--fch-filter, blur(0px))`,
                                            })}
                                        </div>
                                    ))}

                                {/* The card itself */}
                                {renderFace({
                                    boxShadow: cardShadow
                                        ? "0 20px 50px rgba(0,0,0,0.25)"
                                        : "none",
                                })}
                            </div>
                        )
                    })}
                </div>

                {/* Headline overlay */}
                {showText && (
                    <div
                        ref={textRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 2,
                            padding: pad,
                            // At the top the headline keeps clear of a site header.
                            paddingTop:
                                titlePos === "top"
                                    ? `max(${pad}px, ${isMobile ? 14 : 10}%)`
                                    : pad,
                            paddingBottom: `max(${pad}px, 4%)`,
                            paddingLeft: sidePadding,
                            paddingRight: sidePadding,
                            display: "flex",
                            flexDirection: "column",
                            color: textColor,
                            mixBlendMode: blendMode,
                            pointerEvents: "none",
                            overflow: "hidden",
                            opacity: 1 - renderTextAmount,
                        }}
                    >
                        {/* Spacers place the title top / center / bottom. */}
                        {titlePos !== "top" && (
                            <div
                                aria-hidden
                                style={{ flex: "1 1 0", minHeight: 0 }}
                            />
                        )}
                        {(leftLines.length > 0 || rightLines.length > 0) && (
                            <Heading
                                data-fch-title=""
                                style={{
                                    margin: 0,
                                    // Neutralise browser heading styles; the Title Font decides.
                                    fontSize: "inherit",
                                    fontWeight: "inherit",
                                    display: "flex",
                                    flexDirection: horizontalTitles
                                        ? titleReverse
                                            ? "row-reverse"
                                            : "row"
                                        : titleReverse
                                          ? "column-reverse"
                                          : "column",
                                    justifyContent: "space-between",
                                    alignItems: horizontalTitles
                                        ? "flex-start"
                                        : "stretch",
                                    gap: titleGapPx,
                                    minWidth: 0,
                                    flexShrink: 0,
                                }}
                            >
                                {leftLines.length > 0 && (
                                    <span
                                        ref={titleLeftRef}
                                        style={{
                                            ...titleFont,
                                            fontSize: titleSize,
                                            display: "block",
                                            width: titleBoxWidth,
                                            maxWidth: "100%",
                                            minWidth: "min-content", // grows to fit its words; auto-fit keeps it on screen
                                            // Words only break as a last resort (at minimum fit size).
                                            overflowWrap: atMinFit
                                                ? "break-word"
                                                : "normal",
                                            textAlign: leftAlign,
                                            willChange: "transform",
                                            transform: `translate3d(${-renderTextAmount * textTravel}px, 0, 0)`,
                                        }}
                                    >
                                        {leftLines.map((line, lineIndex) => (
                                            <RevealLine
                                                key={lineIndex}
                                                wrap={atMinFit}
                                                delay={0.15 + lineIndex * 0.1}
                                                animate={animateText}
                                            >
                                                {line || " "}
                                            </RevealLine>
                                        ))}
                                    </span>
                                )}
                                {rightLines.length > 0 && (
                                    <span
                                        ref={titleRightRef}
                                        style={{
                                            ...titleFont,
                                            fontSize: titleSize,
                                            display: "block",
                                            width: titleBoxWidth,
                                            maxWidth: "100%",
                                            minWidth: "min-content",
                                            overflowWrap: atMinFit
                                                ? "break-word"
                                                : "normal",
                                            textAlign: rightAlign,
                                            willChange: "transform",
                                            transform: `translate3d(${renderTextAmount * textTravel}px, 0, 0)`,
                                        }}
                                    >
                                        {rightLines.map((line, lineIndex) => {
                                            const isLast =
                                                lineIndex ===
                                                rightLines.length - 1
                                            return (
                                                <RevealLine
                                                    key={lineIndex}
                                                    wrap={atMinFit}
                                                    delay={
                                                        0.3 + lineIndex * 0.1
                                                    }
                                                    animate={animateText}
                                                >
                                                    {line}
                                                    {isLast && accentWord && (
                                                        <>
                                                            {line ? " " : ""}
                                                            <AccentMarquee
                                                                word={
                                                                    accentWord
                                                                }
                                                                duration={
                                                                    accentSpeed
                                                                }
                                                                animate={
                                                                    !prefersReducedMotion
                                                                }
                                                            />
                                                        </>
                                                    )}
                                                </RevealLine>
                                            )
                                        })}
                                    </span>
                                )}
                            </Heading>
                        )}
                        {/* Pushes a bottom paragraph down (not needed when the title is at the bottom). */}
                        {paragraphText &&
                            !paragraphBelowTitle &&
                            titlePos !== "bottom" && (
                                <div
                                    aria-hidden
                                    style={{ flex: "1 1 0", minHeight: 0 }}
                                />
                            )}
                        {paragraphText && (
                            <p
                                style={{
                                    ...paragraphFont,
                                    fontSize: paragraphSize,
                                    margin: 0,
                                    marginTop: Math.round(
                                        Math.min(
                                            48,
                                            Math.max(16, titleGapPx * 0.75)
                                        )
                                    ),
                                    alignSelf: paragraphSelf,
                                    marginLeft:
                                        paragraphPos === "left"
                                            ? `${offsetPct}%`
                                            : undefined,
                                    marginRight:
                                        paragraphPos === "right"
                                            ? `${offsetPct}%`
                                            : undefined,
                                    maxWidth: `min(${safeParagraphWidth}px, calc(100% - ${offsetPct}%))`,
                                    textAlign: paragraphTextAlign,
                                    whiteSpace: "pre-line",
                                    overflowWrap: "break-word",
                                    flexShrink: 0,
                                }}
                            >
                                <span
                                    style={{
                                        display: "block",
                                        animation: animateText
                                            ? `fch-fade-up 0.9s ${EASE_OUT} 0.7s both`
                                            : undefined,
                                    }}
                                >
                                    {paragraphText}
                                </span>
                            </p>
                        )}
                        {/* Balances the layout below a top / centred title. */}
                        {(paragraphBelowTitle || !paragraphText) &&
                            titlePos !== "bottom" && (
                                <div
                                    aria-hidden
                                    style={{ flex: "1 1 0", minHeight: 0 }}
                                />
                            )}
                    </div>
                )}
            </div>
        </div>
    )
}

FlyingCardsHero.displayName = "Flying Cards Hero"

/** Fills in any missing (undefined) prop with its default. */
function withDefaults(
    props: Partial<FlyingCardsHeroProps>
): FlyingCardsHeroProps {
    const merged: Record<string, unknown> = { ...DEFAULT_PROPS }
    for (const key of Object.keys(props)) {
        const value = (props as Record<string, unknown>)[key]
        if (value !== undefined) merged[key] = value
    }
    return merged as unknown as FlyingCardsHeroProps
}

// Defaults live here instead of `defaultProps` (deprecated for function
// components in React 18.3+). Keep in sync with the property controls below.
const DEFAULT_PROPS: Omit<FlyingCardsHeroProps, "style"> = {
    images: [],
    cardCount: 36,
    flyCount: 18,
    cardSize: 150,
    cardRadius: 2,
    cardShadow: false,
    speed: 1,
    depth: 2400,
    spread: 1,
    spin: 1,
    depthBlur: 16,
    motionTrail: 1.5,
    centerGap: 0.22,
    hoverFlip: true,
    seed: 7,
    scrollRing: true,
    joinPoint: 0.7,
    ringSize: 1.2,
    ringGap: 120,
    ringTilt: -14,
    ringTwist: 35,
    ringSpeed: 24,
    scrollSpin: 300,
    smoothing: 0.08,
    previewProgress: 0,
    background: "#F4F4F6",
    showText: true,
    titleLeft: "Ideas\nin flight",
    titleRight: "Watch them\ncome",
    accentWord: "alive",
    accentSpeed: 4,
    paragraph:
        "Every image you drop in takes flight —\norbiting, gathering and landing\nin one smooth story.",
    textTravel: 200,
    titleFont: {
        fontSize: 128,
        fontWeight: 500,
        letterSpacing: "-0.05em",
        lineHeight: "0.9em",
    },
    titleTag: "h1",
    paragraphFont: {
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        lineHeight: "1.2em",
    },
    textColor: "#FFFFFF",
    blendMode: "difference",
    padding: 48,
    titleDirection: "auto",
    titleReverse: false,
    titlePosition: "top",
    titleGap: 24,
    titleLeftAlign: "auto",
    titleRightAlign: "auto",
    titleWidth: 50,
    paragraphPosition: "left",
    paragraphOffset: 30,
    paragraphAlign: "auto",
    paragraphWidth: 360,
    paragraphVertical: "bottom",
    contentWidth: 0,
    breakpoints: DEFAULT_BREAKPOINTS,
}

// ─── Property Controls ───────────────────────────────────────────────────────

const ringHidden = (props: Partial<FlyingCardsHeroProps>) => !props.scrollRing
const textHidden = (props: Partial<FlyingCardsHeroProps>) => !props.showText
const paragraphHidden = (props: Partial<FlyingCardsHeroProps>) =>
    !props.showText || !props.paragraph

addPropertyControls(FlyingCardsHero, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 24,
        control: { type: ControlType.ResponsiveImage },
        description: "Leave empty to use the built-in poster artwork.",
    },
    cardCount: {
        type: ControlType.Number,
        title: "Cards",
        min: 4,
        max: 40,
        step: 1,
        displayStepper: true,
        defaultValue: 36,
        description: "Total cards — all of them form the ring.",
    },
    flyCount: {
        type: ControlType.Number,
        title: "Fly Cards",
        min: 2,
        max: 40,
        step: 1,
        displayStepper: true,
        defaultValue: 18,
        description:
            "How many cards fly around at the top. The rest swoop in for the ring.",
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        min: 60,
        max: 400,
        step: 5,
        unit: "px",
        defaultValue: 150,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 60,
        unit: "px",
        defaultValue: 2,
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
    },
    hoverFlip: {
        type: ControlType.Boolean,
        title: "Hover Flip",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Cards flip on hover in the hero only — switched off as soon as the page scrolls.",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0,
        max: 4,
        step: 0.05,
        defaultValue: 1,
    },
    depth: {
        type: ControlType.Number,
        title: "Depth",
        min: 500,
        max: 6000,
        step: 100,
        defaultValue: 2400,
    },
    spread: {
        type: ControlType.Number,
        title: "Spread",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    spin: {
        type: ControlType.Number,
        title: "Flutter",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1,
    },
    depthBlur: {
        type: ControlType.Number,
        title: "Depth Blur",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 16,
    },
    motionTrail: {
        type: ControlType.Number,
        title: "Motion Trail",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 1.5,
        description:
            "Long-exposure colour smear behind cards as they fly out. 0 turns it off (fastest).",
    },
    centerGap: {
        type: ControlType.Number,
        title: "Center Gap",
        min: 0,
        max: 0.9,
        step: 0.01,
        defaultValue: 0.22,
        description:
            "Size of the empty space in the middle that cards fly out from.",
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        min: 1,
        max: 999,
        step: 1,
        displayStepper: true,
        defaultValue: 7,
        description: "Change to shuffle the layout.",
    },
    scrollRing: {
        type: ControlType.Boolean,
        title: "Scroll Story",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "On scroll the cards join a rotating ring — the section's final state. Set height to ~300vh so the scene pins.",
    },
    joinPoint: {
        type: ControlType.Number,
        title: "Ring At",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
        description:
            "Point in the scroll (0–1) where the ring is complete. After that, scrolling turns the finished ring.",
        hidden: ringHidden,
    },
    ringSize: {
        type: ControlType.Number,
        title: "Ring Size",
        min: 0.5,
        max: 3,
        step: 0.05,
        defaultValue: 1.2,
        hidden: ringHidden,
    },
    ringGap: {
        type: ControlType.Number,
        title: "Ring Gap",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 120,
        description: "Radius of the hollow core the cards stand around.",
        hidden: ringHidden,
    },
    ringTilt: {
        type: ControlType.Number,
        title: "Ring Tilt",
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
        defaultValue: -14,
        hidden: ringHidden,
    },
    ringTwist: {
        type: ControlType.Number,
        title: "Ring Twist",
        min: -90,
        max: 90,
        step: 1,
        unit: "°",
        defaultValue: 35,
        description:
            "Turns each card off the spoke direction, like turbine blades.",
        hidden: ringHidden,
    },
    ringSpeed: {
        type: ControlType.Number,
        title: "Ring Speed",
        min: -180,
        max: 180,
        step: 1,
        unit: "°/s",
        defaultValue: 24,
        description:
            "How fast the ring turns while it forms (it stops once finished). Negative reverses direction.",
        hidden: ringHidden,
    },
    scrollSpin: {
        type: ControlType.Number,
        title: "Scroll Spin",
        min: 0,
        max: 1080,
        step: 10,
        unit: "°",
        defaultValue: 300,
        description:
            "How far the ring turns over the whole scroll. It only moves while you scroll.",
        hidden: ringHidden,
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.01,
        defaultValue: 0.08,
        description: "Lower = smoother, floatier scroll.",
        hidden: ringHidden,
    },
    previewProgress: {
        type: ControlType.Number,
        title: "Canvas Preview",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0,
        description: "Scrub the scroll story on the canvas only.",
        hidden: ringHidden,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F4F4F6",
    },
    showText: {
        type: ControlType.Boolean,
        title: "Text",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    // ── Title ──
    titleLeft: {
        type: ControlType.String,
        title: "Title 1",
        displayTextArea: true,
        defaultValue: "Ideas\nin flight",
        description: "Press Enter for a new line.",
        hidden: textHidden,
    },
    titleRight: {
        type: ControlType.String,
        title: "Title 2",
        displayTextArea: true,
        defaultValue: "Watch them\ncome",
        hidden: textHidden,
    },
    accentWord: {
        type: ControlType.String,
        title: "Accent Word",
        defaultValue: "alive",
        description:
            "Shown in brackets after Title 2, scrolling like a ticker. Leave empty to hide.",
        hidden: textHidden,
    },
    accentSpeed: {
        type: ControlType.Number,
        title: "Accent Speed",
        min: 0.5,
        max: 20,
        step: 0.5,
        unit: "s",
        defaultValue: 4,
        description: "Seconds per loop.",
        hidden: (props: Partial<FlyingCardsHeroProps>) =>
            !props.showText || !props.accentWord,
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 128,
            variant: "Medium",
            letterSpacing: "-0.05em",
            lineHeight: "0.9em",
        },
        hidden: textHidden,
    },
    titleTag: {
        type: ControlType.Enum,
        title: "Title Tag",
        options: ["h1", "h2", "h3", "div"],
        optionTitles: ["H1", "H2", "H3", "Div"],
        displaySegmentedControl: true,
        defaultValue: "h1",
        description: "Use H1 once per page for SEO.",
        hidden: textHidden,
    },
    titleDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["auto", "horizontal", "vertical"],
        optionTitles: ["Auto", "Horizontal", "Vertical"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description:
            "Titles side by side (Horizontal) or stacked (Vertical). Auto stacks on phones.",
        hidden: textHidden,
    },
    titleReverse: {
        type: ControlType.Boolean,
        title: "Order",
        defaultValue: false,
        enabledTitle: "Reversed",
        disabledTitle: "Normal",
        description: "Swap Title 1 and Title 2.",
        hidden: textHidden,
    },
    titlePosition: {
        type: ControlType.Enum,
        title: "Title Position",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
        defaultValue: "top",
        hidden: textHidden,
    },
    titleGap: {
        type: ControlType.Number,
        title: "Title Gap",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 24,
        description: "Space between the two titles.",
        hidden: textHidden,
    },
    titleLeftAlign: {
        type: ControlType.Enum,
        title: "Title 1 Align",
        options: ["auto", "left", "center", "right"],
        optionTitles: ["Auto", "Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description: "Auto = left.",
        hidden: textHidden,
    },
    titleRightAlign: {
        type: ControlType.Enum,
        title: "Title 2 Align",
        options: ["auto", "left", "center", "right"],
        optionTitles: ["Auto", "Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description: "Auto = right.",
        hidden: textHidden,
    },
    titleWidth: {
        type: ControlType.Number,
        title: "Title Width",
        min: 10,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 50,
        description: "Width of each title when they sit side by side.",
        hidden: (props: Partial<FlyingCardsHeroProps>) =>
            !props.showText || props.titleDirection === "vertical",
    },

    // ── Paragraph ──
    paragraph: {
        type: ControlType.String,
        title: "Paragraph",
        displayTextArea: true,
        defaultValue:
            "Every image you drop in takes flight —\norbiting, gathering and landing\nin one smooth story.",
        description: "Press Enter for a new line. Leave empty to hide.",
        hidden: textHidden,
    },
    paragraphFont: {
        type: ControlType.Font,
        title: "Paragraph Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
        hidden: paragraphHidden,
    },
    paragraphPosition: {
        type: ControlType.Enum,
        title: "Paragraph Position",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "left",
        hidden: paragraphHidden,
    },
    paragraphOffset: {
        type: ControlType.Number,
        title: "Paragraph Offset",
        min: 0,
        max: 80,
        step: 0.5,
        unit: "%",
        defaultValue: 30,
        description:
            "Distance from the chosen side. Full on desktop, half on tablet, none on phone.",
        hidden: (props: Partial<FlyingCardsHeroProps>) =>
            paragraphHidden(props) || props.paragraphPosition === "center",
    },
    paragraphAlign: {
        type: ControlType.Enum,
        title: "Paragraph Align",
        options: ["auto", "left", "center", "right"],
        optionTitles: ["Auto", "Left", "Center", "Right"],
        displaySegmentedControl: true,
        defaultValue: "auto",
        description: "Text alignment. Auto follows the position.",
        hidden: paragraphHidden,
    },
    paragraphWidth: {
        type: ControlType.Number,
        title: "Paragraph Width",
        min: 120,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 360,
        hidden: paragraphHidden,
    },
    paragraphVertical: {
        type: ControlType.Enum,
        title: "Paragraph Placement",
        options: ["bottom", "belowTitle"],
        optionTitles: ["Bottom", "Below Title"],
        displaySegmentedControl: true,
        defaultValue: "bottom",
        hidden: paragraphHidden,
    },

    // ── Text style & spacing ──
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
        hidden: textHidden,
        description:
            "White + Difference reads black on light backgrounds and inverts over images.",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend",
        options: ["difference", "exclusion", "normal"],
        optionTitles: ["Difference", "Exclusion", "Normal"],
        defaultValue: "difference",
        hidden: textHidden,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 200,
        unit: "px",
        defaultValue: 48,
        hidden: textHidden,
    },
    contentWidth: {
        type: ControlType.Number,
        title: "Content Width",
        min: 0,
        max: 2400,
        step: 10,
        unit: "px",
        defaultValue: 0,
        description:
            "Max width of all text, centred on wide screens. 0 = full width.",
        hidden: textHidden,
    },
    textTravel: {
        type: ControlType.Number,
        title: "Text Travel",
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 200,
        description: "How far the headlines slide apart as the ring forms.",
        hidden: (props: Partial<FlyingCardsHeroProps>) =>
            !props.showText || !props.scrollRing,
    },
    breakpoints: {
        type: ControlType.Object,
        title: "Breakpoints",
        description:
            "Framer: Desktop ≥ 1200, Tablet 810–1199, Phone < 810. Choose Custom to set your own.",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["framer", "custom"],
                optionTitles: ["Framer", "Custom"],
                displaySegmentedControl: true,
                defaultValue: "framer",
            },
            tabletBelow: {
                type: ControlType.Number,
                title: "Tablet Below",
                min: 320,
                max: 2400,
                step: 1,
                unit: "px",
                defaultValue: 1200,
                hidden: (props: Partial<BreakpointSettings>) =>
                    props.mode !== "custom",
            },
            phoneBelow: {
                type: ControlType.Number,
                title: "Phone Below",
                min: 240,
                max: 2000,
                step: 1,
                unit: "px",
                defaultValue: 810,
                hidden: (props: Partial<BreakpointSettings>) =>
                    props.mode !== "custom",
            },
            tabletTitleScale: {
                type: ControlType.Number,
                title: "Tablet Title",
                min: 0.3,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            phoneTitleScale: {
                type: ControlType.Number,
                title: "Phone Title",
                min: 0.3,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            tabletCardScale: {
                type: ControlType.Number,
                title: "Tablet Cards",
                min: 0.3,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            phoneCardScale: {
                type: ControlType.Number,
                title: "Phone Cards",
                min: 0.3,
                max: 2,
                step: 0.05,
                defaultValue: 1,
            },
            phoneStackTitles: {
                type: ControlType.Boolean,
                title: "Phone Titles",
                description: "Used when Direction is Auto.",
                defaultValue: true,
                enabledTitle: "Stack",
                disabledTitle: "Side",
            },
        },
    },
})
