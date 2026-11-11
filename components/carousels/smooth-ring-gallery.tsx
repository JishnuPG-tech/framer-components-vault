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


type ImageValue = { src?: string; alt?: string } | string
type Quality = "lite" | "balanced" | "ultra"
type Grade = "none" | "luxury" | "cinematic" | "warm" | "mono" | "neon"
type Mask = "rounded" | "circle" | "arch" | "ticket"
type Texture = "none" | "grain" | "paper" | "scanlines"

type MediaItem = {
    image?: ImageValue
    title?: string
    link?: string
    openInNewTab?: boolean
}

type ShadowSettings = {
    enabled?: boolean
    color?: string
    opacity?: number
    x?: number
    y?: number
    blur?: number
    spread?: number
}

type OverlaySettings = {
    enabled?: boolean
    topColor?: string
    topOpacity?: number
    bottomColor?: string
    bottomOpacity?: number
    angle?: number
    middle?: number
}

type VignetteSettings = {
    enabled?: boolean
    color?: string
    opacity?: number
    innerSize?: number
    outerSize?: number
    x?: number
    y?: number
}

type BorderSettings = {
    enabled?: boolean
    color?: string
    opacity?: number
    width?: number
}

type DepthBlurSettings = {
    enabled?: boolean
    amount?: number
    maxBlur?: number
}

type HoverSettings = {
    enabled?: boolean
    lift?: number
    scale?: number
    duration?: number
}

type ShineSettings = {
    enabled?: boolean
    color?: string
    opacity?: number
    angle?: number
    width?: number
    travel?: number
    duration?: number
}

type FogSettings = {
    enabled?: boolean
    color?: string
    opacity?: number
    start?: number
}

type DistortionSettings = {
    enabled?: boolean
    intensity?: number
    hoverIntensity?: number
    scale?: number
    skew?: number
    rotate?: number
    duration?: number
}

type ParallaxTiltSettings = {
    enabled?: boolean
    centerOnly?: boolean
    tilt?: number
    imageMove?: number
    scale?: number
    perspective?: number
    smoothness?: number
    returnSmoothness?: number
    glowOpacity?: number
}

type PyramidSettings = {
    enabled?: boolean
    strength?: number
    lift?: number
    scaleBoost?: number
    opacityBoost?: number
}

type Glass3DSettings = {
    enabled?: boolean
    thickness?: number
    layers?: number
    tint?: string
    edgeOpacity?: number
    faceOpacity?: number
    backOpacity?: number
    blur?: number
    strokeOpacity?: number
    bevel?: number
    highlightOpacity?: number
}

type TextureSettings = {
    type?: Texture
    opacity?: number
}

type ViewProps = {
    quality?: Quality
}

type LayoutProps = {
    cardWidth?: number
    cardHeight?: number
    x?: number
    y?: number
    scale?: number
    perspective?: number
    responsive?: boolean
}

type MotionProps = {
    autoplay?: boolean
    speed?: number
    smoothness?: number
    pauseOnHover?: boolean
    drag?: boolean
    dragPower?: number
    wheel?: boolean
    wheelPower?: number
    snap?: boolean
    clickToFocus?: boolean
}

type RingProps = {
    radius?: number
    depth?: number
    tilt?: number
    rotateCards?: boolean
    activeScale?: number
    safeSpacing?: boolean
    pyramid?: PyramidSettings
}

type LookProps = {
    background?: string
    radius?: number
    objectFit?: "cover" | "contain"
    shadow?: ShadowSettings | boolean
    overlay?: OverlaySettings | boolean
    vignette?: VignetteSettings | boolean
    border?: BorderSettings | boolean
    glass3D?: Glass3DSettings | boolean
}

type EffectsProps = {
    grade?: Grade
    depthBlur?: DepthBlurSettings | boolean
    inactiveDim?: number
    hover?: HoverSettings | boolean
    shine?: ShineSettings | boolean
    fog?: FogSettings | boolean
    distortion?: DistortionSettings | boolean
    parallaxTilt?: ParallaxTiltSettings | boolean
    texture?: TextureSettings
    mask?: Mask
}

type CaptionProps = {
    showTitle?: boolean
    showNumber?: boolean
    titleFont?: React.CSSProperties
    numberFont?: React.CSSProperties
    color?: string
    shadow?: ShadowSettings | boolean
}

type Props = {
    items?: MediaItem[]
    view?: ViewProps
    layout?: LayoutProps
    motion?: MotionProps
    ring?: RingProps
    look?: LookProps
    effects?: EffectsProps
    caption?: CaptionProps
}

const defaultItems: MediaItem[] = [
    {
        title: "Paris",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern city building",
        },
    },
    {
        title: "Warsaw",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern luxury house",
        },
    },
    {
        title: "Madrid",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
            alt: "Architecture detail",
        },
    },
    {
        title: "Sydney",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern home",
        },
    },
    {
        title: "Istanbul",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
            alt: "House with pool",
        },
    },
    {
        title: "Prague",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            alt: "Luxury home exterior",
        },
    },
    {
        title: "Munich",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=80",
            alt: "Interior architecture",
        },
    },
    {
        title: "Venice",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern interior",
        },
    },
    {
        title: "Oslo",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
            alt: "Modern house design",
        },
    },
    {
        title: "London",
        link: "",
        openInNewTab: false,
        image: {
            src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=80",
            alt: "Premium architecture",
        },
    },
]

const defaults = {
    view: {
        quality: "balanced" as Quality,
    },
    layout: {
        cardWidth: 260,
        cardHeight: 360,
        x: 0,
        y: 0,
        scale: 1,
        perspective: 1600,
        responsive: true,
    },
    motion: {
        autoplay: false,
        speed: 0.18,
        smoothness: 0.12,
        pauseOnHover: true,
        drag: true,
        dragPower: 0.0085,
        wheel: true,
        wheelPower: 0.0018,
        snap: false,
        clickToFocus: true,
    },
    ring: {
        radius: 420,
        depth: 420,
        tilt: 0.38,
        rotateCards: true,
        activeScale: 1.06,
        safeSpacing: true,
        pyramid: {
            enabled: true,
            strength: 0.35,
            lift: 42,
            scaleBoost: 0.08,
            opacityBoost: 0.14,
        } as PyramidSettings,
    },
    look: {
        background: "#07000d",
        radius: 18,
        objectFit: "cover" as "cover" | "contain",
        shadow: {
            enabled: true,
            color: "#000000",
            opacity: 0.5,
            x: 0,
            y: 26,
            blur: 70,
            spread: 12,
        } as ShadowSettings,
        overlay: {
            enabled: true,
            topColor: "#000000",
            topOpacity: 0.28,
            bottomColor: "#000000",
            bottomOpacity: 0.44,
            angle: 180,
            middle: 44,
        } as OverlaySettings,
        vignette: {
            enabled: true,
            color: "#000000",
            opacity: 0.62,
            innerSize: 34,
            outerSize: 100,
            x: 50,
            y: 50,
        } as VignetteSettings,
        border: {
            enabled: false,
            color: "#FFFFFF",
            opacity: 0.18,
            width: 1,
        } as BorderSettings,
        glass3D: {
            enabled: true,
            thickness: 22,
            layers: 8,
            tint: "#d9f3ff",
            edgeOpacity: 0.16,
            faceOpacity: 0.08,
            backOpacity: 0.12,
            blur: 0.8,
            strokeOpacity: 0.22,
            bevel: 1,
            highlightOpacity: 0.22,
        } as Glass3DSettings,
    },
    effects: {
        grade: "cinematic" as Grade,
        depthBlur: {
            enabled: false,
            amount: 0.22,
            maxBlur: 14,
        } as DepthBlurSettings,
        inactiveDim: 0.18,
        hover: {
            enabled: true,
            lift: -10,
            scale: 1.018,
            duration: 0.55,
        } as HoverSettings,
        shine: {
            enabled: true,
            color: "#FFFFFF",
            opacity: 0.1,
            angle: 120,
            width: 18,
            travel: 55,
            duration: 0.8,
        } as ShineSettings,
        fog: {
            enabled: false,
            color: "#FFFFFF",
            opacity: 0.12,
            start: 0.15,
        } as FogSettings,
        distortion: {
            enabled: true,
            intensity: 0.45,
            hoverIntensity: 0.8,
            scale: 1.03,
            skew: 1.2,
            rotate: 0.6,
            duration: 0.7,
        } as DistortionSettings,
        parallaxTilt: {
            enabled: true,
            centerOnly: false,
            tilt: 10,
            imageMove: 16,
            scale: 1.025,
            perspective: 900,
            smoothness: 0.22,
            returnSmoothness: 0.14,
            glowOpacity: 0.18,
        } as ParallaxTiltSettings,
        texture: {
            type: "none" as Texture,
            opacity: 0.13,
        } as TextureSettings,
        mask: "rounded" as Mask,
    },
    caption: {
        showTitle: true,
        showNumber: true,
        titleFont: {
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.04em",
        } as React.CSSProperties,
        numberFont: {
            fontSize: 76,
            fontWeight: 400,
            letterSpacing: "-0.08em",
        } as React.CSSProperties,
        color: "#FFFFFF",
        shadow: {
            enabled: true,
            color: "#000000",
            opacity: 0.45,
            x: 0,
            y: 6,
            blur: 22,
            spread: 0,
        } as ShadowSettings,
    },
}

const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value))

const num = (value: number | undefined, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback

function merge<T extends object>(base: T, value?: Partial<T>): T {
    return { ...base, ...(value || {}) }
}

function normalizeSettings<T extends { enabled?: boolean }>(
    base: T,
    value: T | boolean | undefined
): T {
    if (typeof value === "boolean") return { ...base, enabled: value }
    if (value && typeof value === "object") return { ...base, ...value }
    return base
}

function alphaColor(color = "#000000", opacity = 1) {
    const alpha = clamp(opacity, 0, 1)
    const trimmed = color.trim()

    if (trimmed === "transparent") return "transparent"

    if (trimmed.startsWith("#")) {
        let hex = trimmed.slice(1)

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map((char) => char + char)
                .join("")
        }

        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16)
            const g = parseInt(hex.slice(2, 4), 16)
            const b = parseInt(hex.slice(4, 6), 16)
            return `rgba(${r}, ${g}, ${b}, ${alpha})`
        }
    }

    if (trimmed.startsWith("rgb(")) {
        return trimmed.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
    }

    if (trimmed.startsWith("rgba(")) {
        const values = trimmed
            .replace("rgba(", "")
            .replace(")", "")
            .split(",")
            .map((value) => value.trim())

        if (values.length >= 3) {
            return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`
        }
    }

    return trimmed
}

function boxShadowCss(shadow: ShadowSettings, boost = 1) {
    if (!shadow.enabled) return "none"

    return `${num(shadow.x, 0)}px ${num(shadow.y, 0)}px ${num(
        shadow.blur,
        40
    )}px ${num(shadow.spread, 0)}px ${alphaColor(
        shadow.color,
        num(shadow.opacity, 0.4) * boost
    )}`
}

function textShadowCss(shadow: ShadowSettings) {
    if (!shadow.enabled) return "none"

    return `${num(shadow.x, 0)}px ${num(shadow.y, 0)}px ${num(
        shadow.blur,
        20
    )}px ${alphaColor(shadow.color, num(shadow.opacity, 0.4))}`
}

const getSrc = (value?: ImageValue) =>
    !value ? "" : typeof value === "string" ? value : value.src || ""

const getLink = (value?: string) =>
    typeof value === "string" ? value.trim() : ""

const fallbackBackground = (index: number) =>
    `linear-gradient(135deg, hsl(${index * 38}, 76%, 54%), hsl(${
        index * 38 + 90
    }, 76%, 24%))`

const wrapDelta = (index: number, progress: number, total: number) => {
    if (total <= 1) return 0

    let delta = index - progress
    delta = ((delta + total / 2) % total) - total / 2

    if (delta < -total / 2) delta += total
    return delta
}

function filterForGrade(grade: Grade) {
    if (grade === "luxury")
        return "saturate(1.12) contrast(1.06) brightness(1.04)"
    if (grade === "cinematic")
        return "saturate(0.86) contrast(1.18) brightness(0.92)"
    if (grade === "warm") return "sepia(0.16) saturate(1.18) contrast(1.04)"
    if (grade === "mono") return "grayscale(1) contrast(1.14)"
    if (grade === "neon")
        return "saturate(1.55) contrast(1.12) hue-rotate(12deg)"
    return "none"
}

function gradeOverlay(grade: Grade) {
    if (grade === "luxury")
        return "linear-gradient(135deg, rgba(255,255,255,.16), rgba(190,160,255,.08), transparent)"
    if (grade === "cinematic")
        return "linear-gradient(180deg, rgba(0,0,0,.24), transparent 42%, rgba(0,0,0,.24))"
    if (grade === "warm")
        return "linear-gradient(135deg, rgba(255,170,90,.16), transparent 55%)"
    if (grade === "neon")
        return "linear-gradient(135deg, rgba(0,255,255,.15), transparent 45%, rgba(255,0,190,.14))"
    return ""
}

function textureStyle(
    settings: TextureSettings,
    qualityScale: number
): React.CSSProperties {
    const type = settings.type || "none"
    const opacity = num(settings.opacity, 0) * qualityScale

    if (type === "none" || opacity <= 0) return { display: "none" }

    if (type === "scanlines") {
        return {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity,
            background:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,.16) 0px, rgba(255,255,255,.16) 1px, transparent 1px, transparent 5px)",
            mixBlendMode: "overlay",
        }
    }

    if (type === "paper") {
        return {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity,
            background:
                "radial-gradient(circle at 20% 30%, rgba(255,255,255,.32) 0 1px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(255,255,255,.22) 0 1px, transparent 1px)",
            backgroundSize: "18px 18px, 24px 24px",
            mixBlendMode: "soft-light",
        }
    }

    return {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        background:
            "radial-gradient(circle at 25% 25%, rgba(255,255,255,.3) 0 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(0,0,0,.3) 0 1px, transparent 1px)",
        backgroundSize: "3px 3px, 4px 4px",
        mixBlendMode: "overlay",
    }
}

function maskStyle(mask: Mask, radius: number): React.CSSProperties {
    if (mask === "circle") return { borderRadius: 9999 }

    if (mask === "arch") {
        return {
            borderRadius: `${radius}px ${radius}px 999px 999px`,
        }
    }

    if (mask === "ticket") {
        return {
            borderRadius: radius,
            clipPath:
                "polygon(0 0, 100% 0, 100% 42%, 96% 50%, 100% 58%, 100% 100%, 0 100%, 0 58%, 4% 50%, 0 42%)",
        }
    }

    return { borderRadius: radius }
}

export default function SmoothRingGallery(props: Props) {
    const isStatic = useIsStaticRenderer()

    const view = merge(defaults.view, props.view)
    const layout = merge(defaults.layout, props.layout)
    const motion = merge(defaults.motion, props.motion)

    const rawRing = merge(defaults.ring, props.ring)
    const ring = {
        ...rawRing,
        pyramid: merge(defaults.ring.pyramid, rawRing.pyramid),
    }

    const rawLook = merge(defaults.look, props.look)
    const look = {
        ...rawLook,
        shadow: normalizeSettings(defaults.look.shadow, rawLook.shadow),
        overlay: normalizeSettings(defaults.look.overlay, rawLook.overlay),
        vignette: normalizeSettings(defaults.look.vignette, rawLook.vignette),
        border: normalizeSettings(defaults.look.border, rawLook.border),
        glass3D: normalizeSettings(defaults.look.glass3D, rawLook.glass3D),
    }

    const rawEffects = merge(defaults.effects, props.effects)
    const effects = {
        ...rawEffects,
        depthBlur: normalizeSettings(
            defaults.effects.depthBlur,
            rawEffects.depthBlur
        ),
        hover: normalizeSettings(defaults.effects.hover, rawEffects.hover),
        shine: normalizeSettings(defaults.effects.shine, rawEffects.shine),
        fog: normalizeSettings(defaults.effects.fog, rawEffects.fog),
        distortion: normalizeSettings(
            defaults.effects.distortion,
            rawEffects.distortion
        ),
        parallaxTilt: normalizeSettings(
            defaults.effects.parallaxTilt,
            rawEffects.parallaxTilt
        ),
        texture: merge(defaults.effects.texture, rawEffects.texture),
    }

    const rawCaption = merge(defaults.caption, props.caption)
    const caption = {
        ...rawCaption,
        shadow: normalizeSettings(defaults.caption.shadow, rawCaption.shadow),
    }

    const slides = props.items?.length ? props.items : defaultItems
    const total = Math.max(1, slides.length)

    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const frame = React.useRef<number | null>(null)
    const lastTime = React.useRef<number | null>(null)
    const target = React.useRef(0)
    const current = React.useRef(0)
    const hovering = React.useRef(false)

    const pointer = React.useRef({
        active: false,
        x: 0,
        moved: 0,
    })

    const targetTilt = React.useRef({
        index: -1,
        x: 0,
        y: 0,
        strength: 0,
        active: false,
    })

    const currentTilt = React.useRef({
        index: -1,
        x: 0,
        y: 0,
        strength: 0,
    })

    const [progress, setProgress] = React.useState(0)
    const [hovered, setHovered] = React.useState<number | null>(null)
    const [width, setWidth] = React.useState(900)
    const [renderTilt, setRenderTilt] = React.useState({
        index: -1,
        x: 0,
        y: 0,
        strength: 0,
    })

    React.useEffect(() => {
        const node = rootRef.current
        if (!node || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(([entry]) => {
            setWidth(entry.contentRect.width || 900)
        })

        observer.observe(node)

        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (isStatic) {
            target.current = 0
            current.current = 0
            setProgress(0)
            return
        }

        lastTime.current = null

        const tick = (time: number) => {
            const previous = lastTime.current ?? time
            const dt = Math.min(0.05, (time - previous) / 1000)
            lastTime.current = time

            const paused =
                motion.pauseOnHover &&
                hovering.current &&
                !pointer.current.active

            if (motion.autoplay && !paused) {
                target.current += motion.speed * dt
            }

            if (
                motion.snap &&
                !pointer.current.active &&
                !motion.autoplay &&
                Math.abs(target.current - Math.round(target.current)) > 0.001
            ) {
                target.current +=
                    (Math.round(target.current) - target.current) * 0.05
            }

            const carouselEase = clamp(motion.smoothness, 0.035, 0.38)
            const carouselFrameEase = 1 - Math.pow(1 - carouselEase, dt * 60)

            current.current +=
                (target.current - current.current) * carouselFrameEase

            if (Math.abs(current.current - target.current) < 0.0001) {
                current.current = target.current
            }

            const tiltTarget = targetTilt.current

            if (
                tiltTarget.active &&
                currentTilt.current.index !== tiltTarget.index
            ) {
                currentTilt.current.index = tiltTarget.index
                currentTilt.current.x = tiltTarget.x
                currentTilt.current.y = tiltTarget.y
                currentTilt.current.strength = 0
            }

            if (
                tiltTarget.index >= 0 ||
                currentTilt.current.index >= 0 ||
                currentTilt.current.strength > 0.001
            ) {
                const tiltEase = tiltTarget.active
                    ? clamp(num(effects.parallaxTilt.smoothness, 0.22), 0.01, 1)
                    : clamp(
                          num(effects.parallaxTilt.returnSmoothness, 0.14),
                          0.01,
                          1
                      )

                const tiltFrameEase = 1 - Math.pow(1 - tiltEase, dt * 60)

                currentTilt.current.x +=
                    (tiltTarget.x - currentTilt.current.x) * tiltFrameEase
                currentTilt.current.y +=
                    (tiltTarget.y - currentTilt.current.y) * tiltFrameEase
                currentTilt.current.strength +=
                    (tiltTarget.strength - currentTilt.current.strength) *
                    tiltFrameEase

                if (
                    !tiltTarget.active &&
                    currentTilt.current.strength < 0.001 &&
                    Math.abs(currentTilt.current.x) < 0.001 &&
                    Math.abs(currentTilt.current.y) < 0.001
                ) {
                    currentTilt.current.index = -1
                    currentTilt.current.x = 0
                    currentTilt.current.y = 0
                    currentTilt.current.strength = 0
                    targetTilt.current.index = -1
                }

                setRenderTilt({
                    index: currentTilt.current.index,
                    x: currentTilt.current.x,
                    y: currentTilt.current.y,
                    strength: currentTilt.current.strength,
                })
            }

            setProgress(current.current)
            frame.current = requestAnimationFrame(tick)
        }

        frame.current = requestAnimationFrame(tick)

        return () => {
            if (frame.current) cancelAnimationFrame(frame.current)
        }
    }, [
        isStatic,
        motion.autoplay,
        motion.speed,
        motion.smoothness,
        motion.pauseOnHover,
        motion.snap,
        effects.parallaxTilt.smoothness,
        effects.parallaxTilt.returnSmoothness,
    ])

    const responsiveScale =
        layout.responsive && width < 760 ? clamp(width / 900, 0.62, 1) : 1

    const cardWidth = Math.max(40, layout.cardWidth * responsiveScale)
    const cardHeight = Math.max(40, layout.cardHeight * responsiveScale)

    const orbitRadius = ring.safeSpacing
        ? Math.max(ring.radius * responsiveScale, cardWidth * 1.42)
        : ring.radius * responsiveScale

    const orbitDepth = ring.safeSpacing
        ? Math.max(ring.depth * responsiveScale, cardWidth * 1.05)
        : ring.depth * responsiveScale

    const qualityScale =
        view.quality === "lite" ? 0.6 : view.quality === "ultra" ? 1.18 : 1

    const moveTarget = (amount: number) => {
        target.current += amount
    }

    const resetTilt = () => {
        targetTilt.current = {
            index: targetTilt.current.index,
            x: 0,
            y: 0,
            strength: 0,
            active: false,
        }
    }

    const navigateToLink = (link: string, newTab?: boolean) => {
        if (!link || typeof window === "undefined") return

        if (newTab) {
            window.open(link, "_blank", "noopener,noreferrer")
            return
        }

        window.location.href = link
    }

    const shouldIgnoreDrag = (targetElement: EventTarget | null) => {
        if (!(targetElement instanceof HTMLElement)) return false
        return Boolean(targetElement.closest("[data-ring-link='true']"))
    }

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || !motion.drag || shouldIgnoreDrag(event.target)) return

        pointer.current = {
            active: true,
            x: event.clientX,
            moved: 0,
        }

        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || !motion.drag || !pointer.current.active) return

        const dx = event.clientX - pointer.current.x
        pointer.current.x = event.clientX
        pointer.current.moved += Math.abs(dx)

        moveTarget(-dx * motion.dragPower)
    }

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        pointer.current.active = false

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        if (!isStatic && motion.snap) {
            target.current = Math.round(target.current)
        }
    }

    const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        if (isStatic || !motion.wheel) return

        event.preventDefault()

        const wheelDelta =
            Math.abs(event.deltaX) > Math.abs(event.deltaY)
                ? event.deltaX
                : event.deltaY

        moveTarget(wheelDelta * motion.wheelPower)
    }

    const focusItem = (index: number) => {
        if (isStatic || !motion.clickToFocus) return
        if (pointer.current.moved > 8) return

        const delta = wrapDelta(index, current.current, total)
        target.current = current.current + delta
    }

    const updateTiltFromPointer = (
        clientX: number,
        clientY: number,
        element: HTMLElement,
        index: number,
        isMain: boolean
    ) => {
        if (!effects.parallaxTilt.enabled || pointer.current.active) return
        if (effects.parallaxTilt.centerOnly && !isMain) return

        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        const x = ((clientX - rect.left) / rect.width - 0.5) * 2
        const y = ((clientY - rect.top) / rect.height - 0.5) * 2

        targetTilt.current = {
            index,
            x: clamp(x, -1, 1),
            y: clamp(y, -1, 1),
            strength: 1,
            active: true,
        }
    }

    const handleInteractionEnter = (
        event: React.PointerEvent<HTMLElement>,
        index: number,
        isMain: boolean
    ) => {
        setHovered(index)
        updateTiltFromPointer(
            event.clientX,
            event.clientY,
            event.currentTarget,
            index,
            isMain
        )
    }

    const handleInteractionMove = (
        event: React.PointerEvent<HTMLElement>,
        index: number,
        isMain: boolean
    ) => {
        updateTiltFromPointer(
            event.clientX,
            event.clientY,
            event.currentTarget,
            index,
            isMain
        )
    }

    const handleInteractionLeave = () => {
        setHovered(null)
        resetTilt()
    }

    const handleClick = (
        index: number,
        link: string,
        openInNewTab: boolean | undefined,
        isMain: boolean
    ) => {
        if (pointer.current.moved > 8) return

        if (isMain && link) {
            navigateToLink(link, openInNewTab)
            return
        }

        focusItem(index)
    }

    const getItemLayout = (index: number) => {
        if (total === 1) {
            return {
                transform: "translate3d(0px, 0px, 0px) scale(1)",
                opacity: 1,
                distance: 0,
                frontness: 1,
                active: 1,
                delta: 0,
                zIndex: 10000,
            }
        }

        const delta = wrapDelta(index, progress, total)
        const angle = (delta / total) * Math.PI * 2
        const angleDeg = (angle * 180) / Math.PI

        const x = Math.sin(angle) * orbitRadius
        const y = Math.cos(angle) * orbitRadius * ring.tilt
        const z = Math.cos(angle) * orbitDepth - orbitDepth

        const frontness = clamp((z + orbitDepth * 2) / (orbitDepth * 2), 0, 1)
        const active = clamp(1 - Math.abs(delta), 0, 1)

        const pyramidPower = ring.pyramid.enabled
            ? active * num(ring.pyramid.strength, 0.35)
            : 0

        const pyramidY = ring.pyramid.enabled
            ? -pyramidPower * num(ring.pyramid.lift, 42)
            : 0

        const activeBoost = active * (ring.activeScale - 1)
        const pyramidScale = ring.pyramid.enabled
            ? pyramidPower * num(ring.pyramid.scaleBoost, 0.08)
            : 0

        const scale = clamp(
            0.48 + frontness * 0.5 + activeBoost + pyramidScale,
            0.25,
            1.22
        )

        const opacity = clamp(
            0.1 +
                frontness * 1.12 +
                (ring.pyramid.enabled
                    ? active * num(ring.pyramid.opacityBoost, 0.14)
                    : 0),
            0,
            1
        )

        const rotateY = ring.rotateCards ? -angleDeg * 0.34 : 0
        const rotateX = ring.rotateCards ? -ring.tilt * 18 : 0
        const rotateZ = ring.rotateCards ? delta * -5 : 0

        return {
            transform: `translate3d(${x}px, ${
                y + pyramidY
            }px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
            opacity,
            distance: 1 - frontness,
            frontness,
            active,
            delta,
            zIndex: Math.round(10000 + frontness * 1000 + active * 500),
        }
    }

    const globalGradeOverlay = gradeOverlay(effects.grade)

    return (
        <div
            ref={rootRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onMouseEnter={() => {
                hovering.current = true
            }}
            onMouseLeave={() => {
                hovering.current = false
                pointer.current.active = false
                setHovered(null)
                resetTilt()
            }}
            onWheel={onWheel}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 360,
                minHeight: 420,
                position: "relative",
                overflow: "hidden",
                background: look.background || "transparent",
                borderRadius: "inherit",
                perspective: layout.perspective,
                userSelect: "none",
                touchAction: motion.drag ? "none" : "auto",
                cursor: motion.drag ? "grab" : "auto",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transformStyle: "preserve-3d",
                    transform: `translate3d(${layout.x}px, ${layout.y}px, 0) rotateX(42deg) scale(${
                        layout.scale * responsiveScale
                    })`,
                }}
            >
                {slides.map((item, index) => {
                    const fallback = defaultItems[index % defaultItems.length]
                    const src = getSrc(item.image) || getSrc(fallback.image)
                    const label = item.title || fallback.title || "Media"
                    const link = getLink(item.link)
                    const alt =
                        typeof item.image === "object"
                            ? item.image?.alt || label
                            : label

                    const itemLayout = getItemLayout(index)
                    const isHovered = hovered === index
                    const isMain = itemLayout.active > 0.55 || total === 1
                    const hasMainLink = isMain && link.length > 0

                    const tiltStrength =
                        effects.parallaxTilt.enabled &&
                        renderTilt.index === index &&
                        (!effects.parallaxTilt.centerOnly || isMain)
                            ? clamp(renderTilt.strength, 0, 1)
                            : 0

                    const tiltAmount = num(effects.parallaxTilt.tilt, 10)
                    const tiltX = -renderTilt.y * tiltAmount * tiltStrength
                    const tiltY = renderTilt.x * tiltAmount * tiltStrength

                    const imageMove = num(effects.parallaxTilt.imageMove, 16)
                    const imageMoveX = renderTilt.x * imageMove * tiltStrength
                    const imageMoveY = renderTilt.y * imageMove * tiltStrength

                    const parallaxScale =
                        1 +
                        (num(effects.parallaxTilt.scale, 1.025) - 1) *
                            tiltStrength

                    const hoverLiftStrength = effects.parallaxTilt.enabled
                        ? tiltStrength
                        : isHovered
                          ? 1
                          : 0

                    const hoverTranslateY = effects.hover.enabled
                        ? num(effects.hover.lift, -10) * hoverLiftStrength
                        : 0

                    const hoverScale = effects.hover.enabled
                        ? 1 +
                          (num(effects.hover.scale, 1.018) - 1) *
                              hoverLiftStrength
                        : 1

                    const dim =
                        effects.inactiveDim > 0
                            ? clamp(
                                  1 - itemLayout.distance * effects.inactiveDim,
                                  0.32,
                                  1
                              )
                            : 1

                    const blur =
                        effects.depthBlur.enabled && view.quality !== "lite"
                            ? clamp(
                                  itemLayout.distance *
                                      num(effects.depthBlur.amount, 0.22) *
                                      qualityScale *
                                      7,
                                  0,
                                  num(effects.depthBlur.maxBlur, 14)
                              )
                            : 0

                    const fogOpacity =
                        effects.fog.enabled &&
                        itemLayout.distance > num(effects.fog.start, 0.15)
                            ? clamp(
                                  itemLayout.distance *
                                      num(effects.fog.opacity, 0.12),
                                  0,
                                  0.75
                              )
                            : 0

                    const hoverDistortStrength = effects.parallaxTilt.enabled
                        ? tiltStrength
                        : isHovered
                          ? 1
                          : 0

                    const distortionPower = effects.distortion.enabled
                        ? itemLayout.active *
                              num(effects.distortion.intensity, 0.45) +
                          hoverDistortStrength *
                              num(effects.distortion.hoverIntensity, 0.8)
                        : 0

                    const imageScale =
                        parallaxScale +
                        distortionPower *
                            (num(effects.distortion.scale, 1.03) - 1)

                    const direction =
                        itemLayout.delta === 0 ? 1 : Math.sign(itemLayout.delta)

                    const imageSkew =
                        distortionPower *
                        num(effects.distortion.skew, 1.2) *
                        direction

                    const imageRotate =
                        distortionPower *
                        num(effects.distortion.rotate, 0.6) *
                        direction

                    const glassEnabled = !!look.glass3D.enabled
                    const glassThickness = glassEnabled
                        ? num(look.glass3D.thickness, 22)
                        : 0
                    const glassLayers = Math.max(
                        1,
                        Math.round(num(look.glass3D.layers, 8))
                    )
                    const glassStep =
                        glassThickness > 0 ? glassThickness / glassLayers : 0
                    const frontZ = glassThickness / 2
                    const backZ = -glassThickness / 2
                    const radius = num(look.radius, 18)
                    const bevel = num(look.glass3D.bevel, 1)

                    const interactionStyle: React.CSSProperties = {
                        position: "absolute",
                        inset: 0,
                        zIndex: 999,
                        display: "block",
                        transform: `translateZ(${frontZ + 8}px)`,
                        cursor: hasMainLink
                            ? "pointer"
                            : motion.clickToFocus
                              ? "pointer"
                              : "grab",
                        touchAction: "manipulation",
                        background: "transparent",
                        ...maskStyle(effects.mask, radius),
                    }

                    const interactionHandlers = {
                        onPointerEnter: (
                            event: React.PointerEvent<HTMLElement>
                        ) => handleInteractionEnter(event, index, isMain),
                        onPointerMove: (
                            event: React.PointerEvent<HTMLElement>
                        ) => handleInteractionMove(event, index, isMain),
                        onPointerLeave: handleInteractionLeave,
                        onClick: (event: React.MouseEvent<HTMLElement>) => {
                            if (pointer.current.moved > 8) {
                                event.preventDefault()
                                return
                            }

                            event.stopPropagation()
                            handleClick(index, link, item.openInNewTab, isMain)
                        },
                    }

                    return (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                width: cardWidth,
                                height: cardHeight,
                                transform: itemLayout.transform,
                                opacity: itemLayout.opacity * dim,
                                zIndex: itemLayout.zIndex,
                                filter: `blur(${blur}px)`,
                                pointerEvents:
                                    itemLayout.opacity > 0.18 ? "auto" : "none",
                                willChange: isStatic
                                    ? "auto"
                                    : "transform, opacity, filter",
                                transformStyle: "preserve-3d",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    transformStyle: "preserve-3d",
                                    transform: `perspective(${num(
                                        effects.parallaxTilt.perspective,
                                        900
                                    )}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(${hoverTranslateY}px) scale(${hoverScale})`,
                                    willChange:
                                        effects.parallaxTilt.enabled ||
                                        effects.hover.enabled
                                            ? "transform"
                                            : "auto",
                                }}
                            >
                                {glassEnabled && (
                                    <>
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                transform: `translateZ(${backZ}px)`,
                                                background: alphaColor(
                                                    look.glass3D.tint,
                                                    num(
                                                        look.glass3D
                                                            .backOpacity,
                                                        0.12
                                                    )
                                                ),
                                                border: `1px solid ${alphaColor(
                                                    "#ffffff",
                                                    num(
                                                        look.glass3D
                                                            .strokeOpacity,
                                                        0.22
                                                    ) * 0.8
                                                )}`,
                                                filter: `blur(${num(
                                                    look.glass3D.blur,
                                                    0.8
                                                )}px)`,
                                                backfaceVisibility: "hidden",
                                                pointerEvents: "none",
                                                ...maskStyle(
                                                    effects.mask,
                                                    radius + bevel
                                                ),
                                            }}
                                        />

                                        {Array.from(
                                            { length: glassLayers },
                                            (_, layerIndex) => {
                                                const z =
                                                    backZ +
                                                    glassStep * (layerIndex + 1)
                                                const depthFade =
                                                    (layerIndex + 1) /
                                                    glassLayers

                                                return (
                                                    <div
                                                        key={layerIndex}
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            inset: 0,
                                                            transform: `translateZ(${z}px)`,
                                                            background:
                                                                alphaColor(
                                                                    look.glass3D
                                                                        .tint,
                                                                    num(
                                                                        look
                                                                            .glass3D
                                                                            .edgeOpacity,
                                                                        0.16
                                                                    ) *
                                                                        depthFade
                                                                ),
                                                            border: `1px solid ${alphaColor(
                                                                "#ffffff",
                                                                num(
                                                                    look.glass3D
                                                                        .strokeOpacity,
                                                                    0.22
                                                                ) * 0.45
                                                            )}`,
                                                            filter: `blur(${num(
                                                                look.glass3D
                                                                    .blur,
                                                                0.8
                                                            )}px)`,
                                                            pointerEvents:
                                                                "none",
                                                            backfaceVisibility:
                                                                "hidden",
                                                            ...maskStyle(
                                                                effects.mask,
                                                                radius + bevel
                                                            ),
                                                        }}
                                                    />
                                                )
                                            }
                                        )}
                                    </>
                                )}

                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        transform: `translateZ(${frontZ}px)`,
                                        overflow: "hidden",
                                        background: src
                                            ? "transparent"
                                            : fallbackBackground(index),
                                        boxShadow: boxShadowCss(
                                            look.shadow,
                                            isHovered ? 1.12 : 1
                                        ),
                                        border: look.border.enabled
                                            ? `${num(
                                                  look.border.width,
                                                  1
                                              )}px solid ${alphaColor(
                                                  look.border.color,
                                                  num(look.border.opacity, 0.18)
                                              )}`
                                            : "none",
                                        backfaceVisibility: "hidden",
                                        ...maskStyle(effects.mask, radius),
                                    }}
                                >
                                    {src ? (
                                        <img
                                            src={src}
                                            alt={alt}
                                            draggable={false}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                                objectFit: look.objectFit,
                                                filter: filterForGrade(
                                                    effects.grade
                                                ),
                                                pointerEvents: "none",
                                                transform: `translate3d(${imageMoveX}px, ${imageMoveY}px, 0) scale(${imageScale}) skewX(${imageSkew}deg) rotate(${imageRotate}deg)`,
                                                willChange:
                                                    effects.parallaxTilt
                                                        .enabled ||
                                                    effects.distortion.enabled
                                                        ? "transform"
                                                        : "auto",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                background:
                                                    fallbackBackground(index),
                                                transform: `translate3d(${imageMoveX}px, ${imageMoveY}px, 0) scale(${imageScale}) skewX(${imageSkew}deg) rotate(${imageRotate}deg)`,
                                            }}
                                        />
                                    )}

                                    {effects.parallaxTilt.enabled &&
                                        tiltStrength > 0.001 && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    pointerEvents: "none",
                                                    opacity: tiltStrength,
                                                    background: `radial-gradient(circle at ${
                                                        (renderTilt.x + 1) * 50
                                                    }% ${
                                                        (renderTilt.y + 1) * 50
                                                    }%, ${alphaColor(
                                                        "#ffffff",
                                                        num(
                                                            effects.parallaxTilt
                                                                .glowOpacity,
                                                            0.18
                                                        )
                                                    )}, transparent 42%)`,
                                                    mixBlendMode: "screen",
                                                }}
                                            />
                                        )}

                                    {look.overlay.enabled && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                background: `linear-gradient(${num(
                                                    look.overlay.angle,
                                                    180
                                                )}deg, ${alphaColor(
                                                    look.overlay.topColor,
                                                    num(
                                                        look.overlay.topOpacity,
                                                        0.28
                                                    )
                                                )} 0%, rgba(0,0,0,0) ${num(
                                                    look.overlay.middle,
                                                    44
                                                )}%, ${alphaColor(
                                                    look.overlay.bottomColor,
                                                    num(
                                                        look.overlay
                                                            .bottomOpacity,
                                                        0.44
                                                    )
                                                )} 100%)`,
                                            }}
                                        />
                                    )}

                                    {globalGradeOverlay && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                background: globalGradeOverlay,
                                                mixBlendMode: "overlay",
                                            }}
                                        />
                                    )}

                                    {effects.fog.enabled && fogOpacity > 0 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                inset: 0,
                                                pointerEvents: "none",
                                                background:
                                                    effects.fog.color ||
                                                    "#FFFFFF",
                                                opacity: fogOpacity,
                                            }}
                                        />
                                    )}

                                    {glassEnabled && (
                                        <>
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    pointerEvents: "none",
                                                    background: alphaColor(
                                                        look.glass3D.tint,
                                                        num(
                                                            look.glass3D
                                                                .faceOpacity,
                                                            0.08
                                                        )
                                                    ),
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    pointerEvents: "none",
                                                    border: `1px solid ${alphaColor(
                                                        "#ffffff",
                                                        num(
                                                            look.glass3D
                                                                .strokeOpacity,
                                                            0.22
                                                        )
                                                    )}`,
                                                    boxShadow:
                                                        "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.05)",
                                                    ...maskStyle(
                                                        effects.mask,
                                                        radius
                                                    ),
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    pointerEvents: "none",
                                                    background: `linear-gradient(135deg, ${alphaColor(
                                                        "#ffffff",
                                                        num(
                                                            look.glass3D
                                                                .highlightOpacity,
                                                            0.22
                                                        )
                                                    )} 0%, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0) 42%)`,
                                                    mixBlendMode: "screen",
                                                }}
                                            />
                                        </>
                                    )}

                                    {effects.shine.enabled &&
                                        view.quality !== "lite" && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    pointerEvents: "none",
                                                    opacity: num(
                                                        effects.shine.opacity,
                                                        0.1
                                                    ),
                                                    background: `linear-gradient(${num(
                                                        effects.shine.angle,
                                                        120
                                                    )}deg, transparent 0%, ${alphaColor(
                                                        effects.shine.color,
                                                        1
                                                    )} ${num(
                                                        effects.shine.width,
                                                        18
                                                    )}%, transparent ${
                                                        num(
                                                            effects.shine.width,
                                                            18
                                                        ) * 2
                                                    }%)`,
                                                    transform: isHovered
                                                        ? `translateX(${num(
                                                              effects.shine
                                                                  .travel,
                                                              55
                                                          )}%)`
                                                        : `translateX(-${num(
                                                              effects.shine
                                                                  .travel,
                                                              55
                                                          )}%)`,
                                                    transition: `transform ${num(
                                                        effects.shine.duration,
                                                        0.8
                                                    )}s cubic-bezier(0, 0.02, 0, 1)`,
                                                }}
                                            />
                                        )}

                                    {caption.showNumber && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                zIndex: 3,
                                                top: 12,
                                                left: 18,
                                                color: caption.color,
                                                lineHeight: 1,
                                                pointerEvents: "none",
                                                opacity: 0.86,
                                                textShadow: textShadowCss(
                                                    caption.shadow
                                                ),
                                                ...caption.numberFont,
                                            }}
                                        >
                                            {String(index + 1).padStart(2, "0")}
                                        </div>
                                    )}

                                    {caption.showTitle && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                zIndex: 3,
                                                bottom: 20,
                                                left: 20,
                                                right: 20,
                                                color: caption.color,
                                                lineHeight: 1,
                                                pointerEvents: "none",
                                                textShadow: textShadowCss(
                                                    caption.shadow
                                                ),
                                                ...caption.titleFont,
                                            }}
                                        >
                                            {label}
                                        </div>
                                    )}

                                    <div
                                        style={textureStyle(
                                            effects.texture,
                                            qualityScale
                                        )}
                                    />
                                </div>

                                {hasMainLink ? (
                                    <a
                                        {...interactionHandlers}
                                        data-ring-link="true"
                                        href={link}
                                        target={
                                            item.openInNewTab
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            item.openInNewTab
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        aria-label={label}
                                        style={interactionStyle}
                                    />
                                ) : (
                                    <div
                                        {...interactionHandlers}
                                        style={interactionStyle}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {look.vignette.enabled && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 80000,
                        pointerEvents: "none",
                        background: `radial-gradient(circle at ${num(
                            look.vignette.x,
                            50
                        )}% ${num(look.vignette.y, 50)}%, transparent ${num(
                            look.vignette.innerSize,
                            34
                        )}%, ${alphaColor(
                            look.vignette.color,
                            num(look.vignette.opacity, 0.62)
                        )} ${num(look.vignette.outerSize, 100)}%)`,
                    }}
                />
            )}
        </div>
    )
}

SmoothRingGallery.defaultProps = {
    width: 900,
    height: 560,
    items: defaultItems,
    view: defaults.view,
    layout: defaults.layout,
    motion: defaults.motion,
    ring: defaults.ring,
    look: defaults.look,
    effects: defaults.effects,
    caption: defaults.caption,
}

addPropertyControls(SmoothRingGallery, {
    items: {
        type: ControlType.Array,
        title: "Media",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Media",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                },
            },
        },
        defaultValue: defaultItems,
    },
    view: {
        type: ControlType.Object,
        title: "View",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["lite", "balanced", "ultra"],
                optionTitles: ["Lite", "Balanced", "Ultra"],
                defaultValue: "balanced",
            },
        },
        defaultValue: defaults.view,
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardWidth: {
                type: ControlType.Number,
                title: "Card Width",
                min: 100,
                max: 700,
                defaultValue: 260,
            },
            cardHeight: {
                type: ControlType.Number,
                title: "Card Height",
                min: 120,
                max: 800,
                defaultValue: 360,
            },
            x: {
                type: ControlType.Number,
                title: "X",
                min: -1000,
                max: 1000,
                defaultValue: 0,
            },
            y: {
                type: ControlType.Number,
                title: "Y",
                min: -1000,
                max: 1000,
                defaultValue: 0,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.25,
                max: 2,
                step: 0.01,
                defaultValue: 1,
            },
            perspective: {
                type: ControlType.Number,
                title: "Perspective",
                min: 500,
                max: 4000,
                step: 10,
                defaultValue: 1600,
            },
            responsive: {
                type: ControlType.Boolean,
                title: "Responsive",
                defaultValue: true,
            },
        },
        defaultValue: defaults.layout,
    },
    ring: {
        type: ControlType.Object,
        title: "Ring",
        controls: {
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 120,
                max: 1200,
                defaultValue: 420,
            },
            depth: {
                type: ControlType.Number,
                title: "Depth",
                min: 100,
                max: 1400,
                defaultValue: 420,
            },
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.38,
            },
            rotateCards: {
                type: ControlType.Boolean,
                title: "Rotate Cards",
                defaultValue: true,
            },
            activeScale: {
                type: ControlType.Number,
                title: "Active Scale",
                min: 1,
                max: 1.3,
                step: 0.01,
                defaultValue: 1.06,
            },
            safeSpacing: {
                type: ControlType.Boolean,
                title: "Safe Spacing",
                defaultValue: true,
            },
            pyramid: {
                type: ControlType.Object,
                title: "Pyramid Depth",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    strength: {
                        type: ControlType.Number,
                        title: "Strength",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.35,
                    },
                    lift: {
                        type: ControlType.Number,
                        title: "Lift",
                        min: 0,
                        max: 160,
                        defaultValue: 42,
                    },
                    scaleBoost: {
                        type: ControlType.Number,
                        title: "Scale Boost",
                        min: 0,
                        max: 0.3,
                        step: 0.01,
                        defaultValue: 0.08,
                    },
                    opacityBoost: {
                        type: ControlType.Number,
                        title: "Opacity Boost",
                        min: 0,
                        max: 0.5,
                        step: 0.01,
                        defaultValue: 0.14,
                    },
                },
                defaultValue: defaults.ring.pyramid,
            },
        },
        defaultValue: defaults.ring,
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: false,
            },
            speed: {
                type: ControlType.Number,
                title: "Auto Speed",
                min: -1,
                max: 1,
                step: 0.01,
                defaultValue: 0.18,
            },
            smoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0.035,
                max: 0.38,
                step: 0.005,
                defaultValue: 0.12,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause Hover",
                defaultValue: true,
            },
            drag: {
                type: ControlType.Boolean,
                title: "Drag",
                defaultValue: true,
            },
            dragPower: {
                type: ControlType.Number,
                title: "Drag Power",
                min: 0.001,
                max: 0.03,
                step: 0.0005,
                defaultValue: 0.0085,
            },
            wheel: {
                type: ControlType.Boolean,
                title: "Wheel",
                defaultValue: true,
            },
            wheelPower: {
                type: ControlType.Number,
                title: "Wheel Power",
                min: 0.0002,
                max: 0.008,
                step: 0.0001,
                defaultValue: 0.0018,
            },
            snap: {
                type: ControlType.Boolean,
                title: "Snap",
                defaultValue: false,
            },
            clickToFocus: {
                type: ControlType.Boolean,
                title: "Click Focus",
                defaultValue: true,
            },
        },
        defaultValue: defaults.motion,
    },
    look: {
        type: ControlType.Object,
        title: "Look",
        controls: {
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#07000d",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 100,
                defaultValue: 18,
            },
            objectFit: {
                type: ControlType.Enum,
                title: "Image Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover", "Contain"],
                defaultValue: "cover",
            },
            glass3D: {
                type: ControlType.Object,
                title: "Glass 3D",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    thickness: {
                        type: ControlType.Number,
                        title: "Thickness",
                        min: 0,
                        max: 80,
                        defaultValue: 22,
                    },
                    layers: {
                        type: ControlType.Number,
                        title: "Layers",
                        min: 1,
                        max: 20,
                        step: 1,
                        defaultValue: 8,
                    },
                    tint: {
                        type: ControlType.Color,
                        title: "Tint",
                        defaultValue: "#d9f3ff",
                    },
                    edgeOpacity: {
                        type: ControlType.Number,
                        title: "Edge Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.16,
                    },
                    faceOpacity: {
                        type: ControlType.Number,
                        title: "Face Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.08,
                    },
                    backOpacity: {
                        type: ControlType.Number,
                        title: "Back Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.12,
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        min: 0,
                        max: 8,
                        step: 0.1,
                        defaultValue: 0.8,
                    },
                    strokeOpacity: {
                        type: ControlType.Number,
                        title: "Stroke",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.22,
                    },
                    bevel: {
                        type: ControlType.Number,
                        title: "Bevel",
                        min: 0,
                        max: 10,
                        step: 0.1,
                        defaultValue: 1,
                    },
                    highlightOpacity: {
                        type: ControlType.Number,
                        title: "Highlight",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.22,
                    },
                },
                defaultValue: defaults.look.glass3D,
            },
            shadow: {
                type: ControlType.Object,
                title: "Shadow",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#000000",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.5,
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        min: -100,
                        max: 100,
                        defaultValue: 0,
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        min: -100,
                        max: 150,
                        defaultValue: 26,
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        min: 0,
                        max: 200,
                        defaultValue: 70,
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        min: -60,
                        max: 80,
                        defaultValue: 12,
                    },
                },
                defaultValue: defaults.look.shadow,
            },
            overlay: {
                type: ControlType.Object,
                title: "Overlay",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    topColor: {
                        type: ControlType.Color,
                        title: "Top Color",
                        defaultValue: "#000000",
                    },
                    topOpacity: {
                        type: ControlType.Number,
                        title: "Top Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.28,
                    },
                    bottomColor: {
                        type: ControlType.Color,
                        title: "Bottom Color",
                        defaultValue: "#000000",
                    },
                    bottomOpacity: {
                        type: ControlType.Number,
                        title: "Bottom Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.44,
                    },
                    angle: {
                        type: ControlType.Number,
                        title: "Angle",
                        min: 0,
                        max: 360,
                        defaultValue: 180,
                    },
                    middle: {
                        type: ControlType.Number,
                        title: "Middle",
                        min: 0,
                        max: 100,
                        defaultValue: 44,
                    },
                },
                defaultValue: defaults.look.overlay,
            },
            vignette: {
                type: ControlType.Object,
                title: "Vignette",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#000000",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.62,
                    },
                    innerSize: {
                        type: ControlType.Number,
                        title: "Inner",
                        min: 0,
                        max: 100,
                        defaultValue: 34,
                    },
                    outerSize: {
                        type: ControlType.Number,
                        title: "Outer",
                        min: 0,
                        max: 160,
                        defaultValue: 100,
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        min: 0,
                        max: 100,
                        defaultValue: 50,
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        min: 0,
                        max: 100,
                        defaultValue: 50,
                    },
                },
                defaultValue: defaults.look.vignette,
            },
            border: {
                type: ControlType.Object,
                title: "Border",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: false,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#FFFFFF",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.18,
                    },
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        min: 0,
                        max: 12,
                        step: 1,
                        defaultValue: 1,
                    },
                },
                defaultValue: defaults.look.border,
            },
        },
        defaultValue: defaults.look,
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            grade: {
                type: ControlType.Enum,
                title: "Grade",
                options: [
                    "none",
                    "luxury",
                    "cinematic",
                    "warm",
                    "mono",
                    "neon",
                ],
                optionTitles: [
                    "None",
                    "Luxury",
                    "Cinematic",
                    "Warm",
                    "Mono",
                    "Neon",
                ],
                defaultValue: "cinematic",
            },
            parallaxTilt: {
                type: ControlType.Object,
                title: "Parallax Tilt",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    centerOnly: {
                        type: ControlType.Boolean,
                        title: "Center Only",
                        defaultValue: false,
                    },
                    tilt: {
                        type: ControlType.Number,
                        title: "Tilt",
                        min: 0,
                        max: 30,
                        step: 0.1,
                        defaultValue: 10,
                    },
                    imageMove: {
                        type: ControlType.Number,
                        title: "Image Move",
                        min: 0,
                        max: 60,
                        step: 1,
                        defaultValue: 16,
                    },
                    scale: {
                        type: ControlType.Number,
                        title: "Image Scale",
                        min: 1,
                        max: 1.2,
                        step: 0.001,
                        defaultValue: 1.025,
                    },
                    perspective: {
                        type: ControlType.Number,
                        title: "Perspective",
                        min: 300,
                        max: 2000,
                        step: 10,
                        defaultValue: 900,
                    },
                    smoothness: {
                        type: ControlType.Number,
                        title: "Follow Smooth",
                        min: 0.01,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.22,
                    },
                    returnSmoothness: {
                        type: ControlType.Number,
                        title: "Return Smooth",
                        min: 0.01,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.14,
                    },
                    glowOpacity: {
                        type: ControlType.Number,
                        title: "Glow",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.18,
                    },
                },
                defaultValue: defaults.effects.parallaxTilt,
            },
            depthBlur: {
                type: ControlType.Object,
                title: "Depth Blur",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: false,
                    },
                    amount: {
                        type: ControlType.Number,
                        title: "Amount",
                        min: 0,
                        max: 4,
                        step: 0.05,
                        defaultValue: 0.22,
                    },
                    maxBlur: {
                        type: ControlType.Number,
                        title: "Max Blur",
                        min: 0,
                        max: 40,
                        defaultValue: 14,
                    },
                },
                defaultValue: defaults.effects.depthBlur,
            },
            inactiveDim: {
                type: ControlType.Number,
                title: "Depth Dim",
                min: 0,
                max: 0.5,
                step: 0.01,
                defaultValue: 0.18,
            },
            hover: {
                type: ControlType.Object,
                title: "Hover Lift",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    lift: {
                        type: ControlType.Number,
                        title: "Lift",
                        min: -80,
                        max: 80,
                        defaultValue: -10,
                    },
                    scale: {
                        type: ControlType.Number,
                        title: "Scale",
                        min: 0.8,
                        max: 1.3,
                        step: 0.001,
                        defaultValue: 1.018,
                    },
                    duration: {
                        type: ControlType.Number,
                        title: "Duration",
                        min: 0,
                        max: 2,
                        step: 0.01,
                        defaultValue: 0.55,
                    },
                },
                defaultValue: defaults.effects.hover,
            },
            shine: {
                type: ControlType.Object,
                title: "Shine",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#FFFFFF",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.1,
                    },
                    angle: {
                        type: ControlType.Number,
                        title: "Angle",
                        min: 0,
                        max: 360,
                        defaultValue: 120,
                    },
                    width: {
                        type: ControlType.Number,
                        title: "Width",
                        min: 1,
                        max: 80,
                        defaultValue: 18,
                    },
                    travel: {
                        type: ControlType.Number,
                        title: "Travel",
                        min: 10,
                        max: 140,
                        defaultValue: 55,
                    },
                    duration: {
                        type: ControlType.Number,
                        title: "Duration",
                        min: 0,
                        max: 3,
                        step: 0.01,
                        defaultValue: 0.8,
                    },
                },
                defaultValue: defaults.effects.shine,
            },
            fog: {
                type: ControlType.Object,
                title: "Depth Fog",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: false,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#FFFFFF",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.12,
                    },
                    start: {
                        type: ControlType.Number,
                        title: "Start",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.15,
                    },
                },
                defaultValue: defaults.effects.fog,
            },
            distortion: {
                type: ControlType.Object,
                title: "Image Distort",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    intensity: {
                        type: ControlType.Number,
                        title: "Active Power",
                        min: 0,
                        max: 2,
                        step: 0.01,
                        defaultValue: 0.45,
                    },
                    hoverIntensity: {
                        type: ControlType.Number,
                        title: "Hover Power",
                        min: 0,
                        max: 2,
                        step: 0.01,
                        defaultValue: 0.8,
                    },
                    scale: {
                        type: ControlType.Number,
                        title: "Scale",
                        min: 1,
                        max: 1.25,
                        step: 0.001,
                        defaultValue: 1.03,
                    },
                    skew: {
                        type: ControlType.Number,
                        title: "Skew",
                        min: -10,
                        max: 10,
                        step: 0.1,
                        defaultValue: 1.2,
                    },
                    rotate: {
                        type: ControlType.Number,
                        title: "Rotate",
                        min: -8,
                        max: 8,
                        step: 0.1,
                        defaultValue: 0.6,
                    },
                    duration: {
                        type: ControlType.Number,
                        title: "Duration",
                        min: 0,
                        max: 3,
                        step: 0.01,
                        defaultValue: 0.7,
                    },
                },
                defaultValue: defaults.effects.distortion,
            },
            texture: {
                type: ControlType.Object,
                title: "Texture",
                controls: {
                    type: {
                        type: ControlType.Enum,
                        title: "Type",
                        options: ["none", "grain", "paper", "scanlines"],
                        optionTitles: ["None", "Grain", "Paper", "Scanlines"],
                        defaultValue: "none",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 0.5,
                        step: 0.01,
                        defaultValue: 0.13,
                    },
                },
                defaultValue: defaults.effects.texture,
            },
            mask: {
                type: ControlType.Enum,
                title: "Mask",
                options: ["rounded", "circle", "arch", "ticket"],
                optionTitles: ["Rounded", "Circle", "Arch", "Ticket"],
                defaultValue: "rounded",
            },
        },
        defaultValue: defaults.effects,
    },
    caption: {
        type: ControlType.Object,
        title: "Caption",
        controls: {
            showTitle: {
                type: ControlType.Boolean,
                title: "Title",
                defaultValue: true,
            },
            showNumber: {
                type: ControlType.Boolean,
                title: "Number",
                defaultValue: true,
            },
            titleFont: {
                type: ControlType.Font,
                title: "Title Font",
                controls: "extended",
                defaultValue: defaults.caption.titleFont,
            },
            numberFont: {
                type: ControlType.Font,
                title: "Number Font",
                controls: "extended",
                defaultValue: defaults.caption.numberFont,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#FFFFFF",
            },
            shadow: {
                type: ControlType.Object,
                title: "Text Shadow",
                controls: {
                    enabled: {
                        type: ControlType.Boolean,
                        title: "Show",
                        defaultValue: true,
                    },
                    color: {
                        type: ControlType.Color,
                        title: "Color",
                        defaultValue: "#000000",
                    },
                    opacity: {
                        type: ControlType.Number,
                        title: "Opacity",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        defaultValue: 0.45,
                    },
                    x: {
                        type: ControlType.Number,
                        title: "X",
                        min: -80,
                        max: 80,
                        defaultValue: 0,
                    },
                    y: {
                        type: ControlType.Number,
                        title: "Y",
                        min: -80,
                        max: 80,
                        defaultValue: 6,
                    },
                    blur: {
                        type: ControlType.Number,
                        title: "Blur",
                        min: 0,
                        max: 120,
                        defaultValue: 22,
                    },
                    spread: {
                        type: ControlType.Number,
                        title: "Spread",
                        min: -40,
                        max: 40,
                        defaultValue: 0,
                    },
                },
                defaultValue: defaults.caption.shadow,
            },
        },
        defaultValue: defaults.caption,
    },
})
