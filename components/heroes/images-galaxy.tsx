import { useCallback, useEffect, useId, useMemo, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import gsap from "gsap"

// ============================================================================
// PARTICLE ENGINE — restored to match Particles-0BM77DBr.js exactly.
// ============================================================================
// This block (particle data generation through the tick loop) is a direct
// port of the original reference. Nothing here is a new invention:
//
// - Initial distribution: x = random*95, y = random*100, cycling through the
//   original Z_OFFSETS/SPEED_MULTIPLIERS arrays. Particles start visible
//   inside the viewport, exactly like the original — there is no entrance
//   animation and no "start everyone outside" scheme.
// - Movement: vertical only, via translate3d(0, position, z). X is set once
//   at resize and never touched again.
// - Scroll: CONFIG.speed=0.15, ease=0.1, scrollMultiplier=0.05, matching the
//   original CONFIG object exactly. The Speed control is a pure multiplier
//   on top of the original 0.15 base (default 1x = identical to the
//   original's default appearance) — it does not replace the speed system.
//   Velocity is computed by diffing window.scrollY once per animation frame
//   (inside the gsap.ticker tick) rather than on native 'scroll' events —
//   this is a necessary substitute for the original's internal Scroll.listen
//   utility, which isn't available outside the original site, but it
//   preserves the same "direction follows the user's actual scroll" effect.
// - Z-depth: original Z_OFFSETS, and depth is expressed purely through
//   translate3d(...,z) inside a perspective + preserve-3d context — there is
//   no artificial z-index layering in the live path. This is what gives
//   particles genuine felt distance instead of sitting on one flat plane.
// - Opacity/depth: a separate overlay element per particle (matching the
//   original's own data-particles="overlay" structure) whose opacity is set
//   to 1 - data.opacity. The original's exact overlay color isn't present in
//   the JS (it would live in the site's own CSS, which we don't have) — as
//   the least-arbitrary choice, this overlay tints toward the component's
//   own Background Color control, so distant particles fade toward their
//   actual backdrop rather than toward an invented black/white. With the
//   default transparent background this has no visible effect until a
//   background color is set.
// - Scale: global CONFIG.scaleMin=0.5 / scaleMax=1.4 / scaleEase=0.25 for
//   every particle — no per-particle ranges, no user scale controls.
//   targetScale is derived from progress = clamp(particleTopY /
//   containerHeight, 0, 1), i.e. position within the visible viewport only,
//   exactly like the original (not an extended off-screen travel range).
// - Height: state.height is the particle's raw measured rendered height
//   (getBoundingClientRect), never multiplied by currentScale. Recycling
//   math is not scale-aware, matching the original.
// - Recycling trigger: bottomPos = position + top + height, checked against
//   +/- containerOffsetHeight, exactly like the original's isBefore/isAfter.
// - Recycling offset: extra -= containerHeight + containerOffsetHeight (up),
//   extra += containerHeight (down) — fixed values, not derived from scale,
//   height, opacity, or the edge gradient.
// - The edge gradient masks are purely visual (see JSX) and never feed into
//   any of the position/scale/recycling math above.
//
// Framer-only additions layered around this unmodified engine: images/image
// fit/border radius, text (blocks/font/color/transform/blend mode), particle
// count control, speed multiplier control, background/gradient color +
// size, and the useIsStaticRenderer() branch (no ticker/ResizeObserver/
// visibility listener when Framer needs a static snapshot).
//
// STACKING-CONTEXT FIX: the particles container below uses zIndex: -1 to
// match the original's -z-1 class, which sits BEHIND the images/overlays it
// contains but in front of whatever is behind the whole component. That only
// works safely when its parent establishes its own stacking context — the
// original's parent does. Our outer host div (rootRef) previously had no
// explicit z-index, so it did NOT establish a stacking context, and the
// negative z-index on the particles container escaped to the page's own
// stacking context instead of staying contained within this component —
// pushing the entire particles layer behind the page itself (invisible),
// while the text layer (which has its own explicit z-index) still rendered
// fine. Giving the outer host an explicit zIndex (see its style below) fixes
// this: any position + z-index combination on a positioned element
// establishes a stacking context for its children, containing the -1
// correctly within this component instead of letting it leak out.
// ============================================================================

interface TextBlock {
    text: string
    indent: number
}

interface ParticleDatum {
    x: number
    y: number
    speed: number
    z: number
    opacity: number
}

interface ParticleState {
    el: HTMLDivElement
    speed: number
    z: number
    opacity: number
    extra: number
    position: number
    currentScale: number
    top: number
    height: number
}

interface MyComponentProps {
    style?: React.CSSProperties
    images: Array<{ src?: string; srcSet?: string; alt?: string }>
    particleSize?: number
    imageAspectRatio?: "original" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16"
    particleCount?: number
    speed?: number
    borderRadius?: number
    backgroundColor?: string
    gradientColor?: string
    edgeGradientSize?: number
    textBlocks: TextBlock[]
    headingFont?: any
    textTransform?: "none" | "uppercase" | "lowercase" | "capitalize"
    textFont?: any
    textColor: string
    textBlendMode?:
        | "normal"
        | "multiply"
        | "screen"
        | "overlay"
        | "darken"
        | "lighten"
        | "color-dodge"
        | "color-burn"
        | "hard-light"
        | "soft-light"
        | "difference"
        | "exclusion"
        | "hue"
        | "saturation"
        | "color"
        | "luminosity"
    textZIndex?: number
    textZ?: number
}

const fallbackImages: Array<{ src?: string; srcSet?: string; alt?: string }> = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 6 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 7 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 8 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 9 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 10 - Green",
    },
]

// Original CONFIG object, restored exactly — including scaleMin/scaleMax,
// which are once again global for every particle (no per-particle ranges).
const CONFIG = {
    speed: 0.15,
    ease: 0.1,
    scaleEase: 0.25,
    scrollMultiplier: 0.05,
    scaleMin: 0.5,
    scaleMax: 1.4,
}

const Z_OFFSETS = [-200, -150, -100, -50, 0, 50, 100, 150, 200]
const SPEED_MULTIPLIERS = [0.8, 0.9, 1, 1.1, 1.2]
const DEFAULT_PARTICLE_COUNT = 32
const DEFAULT_PARTICLE_SIZE = 104 // matches the original's fixed 104px square frame
const MOBILE_PARTICLE_SIZE = 50 // matches the original's mobile-breakpoint frame size

// Image Aspect Ratio control -> actual CSS aspect-ratio value for the image
// element itself. This is independent of the particle frame, which is
// always a fixed square (see DEFAULT_PARTICLE_SIZE / particleSize below) —
// the frame's size and the image's shape inside it are two separate
// concepts. "1:1" is the default, which reproduces the original's look
// (image fills the square frame edge-to-edge).
const IMAGE_ASPECT_RATIO_VALUES: Record<string, string> = {
    "1:1": "1 / 1",
    "4:3": "4 / 3",
    "3:4": "3 / 4",
    "16:9": "16 / 9",
    "9:16": "9 / 16",
}

const BLEND_MODE_VALUES = new Set([
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
])

function lerp(start: number, end: number, amount: number) {
    return (1 - amount) * start + amount * end
}

function resolveBlendMode(value: unknown): React.CSSProperties["mixBlendMode"] {
    const normalized = String(value ?? "normal")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
    return BLEND_MODE_VALUES.has(normalized)
        ? (normalized as React.CSSProperties["mixBlendMode"])
        : "normal"
}

// Original generateParticleData, restored exactly (x/y/speed/z/opacity —
// no scale fields).
function generateParticleData(count: number): ParticleDatum[] {
    return Array.from({ length: count }, (_, index) => {
        const z = Z_OFFSETS[index % Z_OFFSETS.length]
        const opacity = z < 0 ? Math.max(0.5, 1 + z / 250) : 1
        return {
            x: Math.floor(Math.random() * 95),
            y: Math.floor(Math.random() * 100),
            speed: SPEED_MULTIPLIERS[index % SPEED_MULTIPLIERS.length],
            z,
            opacity,
        }
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 810
 */
// @framerDisableUnlink
export default function ImageGalaxy(props: MyComponentProps) {
    const {
        style,
        images = fallbackImages,
        particleSize = DEFAULT_PARTICLE_SIZE,
        imageAspectRatio = "original",
        particleCount = DEFAULT_PARTICLE_COUNT,
        speed = 1,
        borderRadius = 10,
        backgroundColor = "rgba(255, 255, 255, 0)",
        gradientColor,
        edgeGradientSize = 10,
        textBlocks,
        headingFont,
        textTransform = "none",
        textFont,
        textColor,
        textBlendMode = "normal",
        textZIndex,
        textZ,
    } = props

    // Gradient Color defaults to whatever Background Color is currently set
    // to, but can be changed independently — see the `optional` gradientColor
    // control below, which leaves the prop undefined until explicitly set.
    const resolvedGradientColor = gradientColor || backgroundColor

    // Particle frame is always square — width in px, clamped to a sane
    // minimum. Height is never set explicitly; aspect-ratio: 1/1 on the
    // frame (see JSX) derives it, so the frame stays square at any size.
    const resolvedParticleSize = Math.max(8, particleSize)
    // Maps the Image Aspect Ratio control to an actual CSS value, falling
    // back to square (matching the frame, and the original's look) for any
    // unrecognized value.
    const resolvedImageAspectRatio =
        IMAGE_ASPECT_RATIO_VALUES[imageAspectRatio] || "1 / 1"

    const rootRef = useRef<HTMLDivElement | null>(null)
    // The original measures containerHeight/top/etc. against the inner
    // data-particles="container" element — top:-25%, height:150% of the
    // outer host, not the outer host's own bounds. This ref is that inner
    // measurement target, kept separate from rootRef (which stays the
    // outer host — owns background color and the Edge Gradient masks,
    // matching the original's separate .c-standout-image-galaxy_overlay
    // sitting outside <c-particles>).
    const particlesContainerRef = useRef<HTMLDivElement | null>(null)
    const particleElsRef = useRef<HTMLDivElement[]>([])
    const overlayElsRef = useRef<HTMLDivElement[]>([])
    // Caches each particle's actual loaded-image aspect ratio (e.g.
    // "400 / 267"), used only when Image Aspect Ratio is set to "Original".
    // Populated in handleImageLoad below since natural dimensions aren't
    // known until the image has actually loaded.
    const naturalImageRatioRef = useRef<(string | null)[]>([])
    const particleStatesRef = useRef<ParticleState[]>([])
    const particleDataRef = useRef<ParticleDatum[]>([])

    const targetRef = useRef(0)
    const currentRef = useRef(0)
    const lastRef = useRef(0)
    const directionSignRef = useRef(1)
    const directionRef = useRef<"down" | "up">("down")
    const lastScrollYRef = useRef(0)
    const containerHeightRef = useRef(810)
    const containerOffsetHeightRef = useRef(81)
    const isDocumentVisibleRef = useRef(true)

    const isStaticRenderer = useIsStaticRenderer()
    // Scopes the frame-size media query below to this specific instance,
    // so multiple Image Galaxy components on the same page don't clobber
    // each other's width rules.
    const instanceId = useId()

    const safeImages = useMemo(() => {
        const valid = (images || [])
            .slice(0, 24)
            .filter((img) => img && img.src)
        return valid.length > 0 ? valid : fallbackImages
    }, [images])

    const resolvedParticleCount = Math.max(
        8,
        Math.min(64, Math.floor(particleCount))
    )

    // Particle data is fixed like the original's module-level PARTICLE_DATA —
    // only regenerated if particleCount itself changes, never on resize.
    if (particleDataRef.current.length !== resolvedParticleCount) {
        particleDataRef.current = generateParticleData(resolvedParticleCount)
    }

    const resolvedBlocks = useMemo(
        () =>
            (textBlocks || []).length
                ? textBlocks
                : [
                      { text: "A portfolio", indent: 0 },
                      { text: "built for every", indent: 68 },
                      { text: "step.", indent: 126 },
                  ],
        [textBlocks]
    )

    const resolvedFont = headingFont ?? textFont ?? {}
    const resolvedTextZ = textZIndex ?? textZ ?? 3
    const resolvedTextBlendMode = useMemo(
        () => resolveBlendMode(textBlendMode),
        [textBlendMode]
    )

    // Original onResize, restored exactly: sets left/top/overlay-opacity
    // once, resets extra/position/currentScale, measures raw height, resets
    // the scroll accumulator. Measured against the inner particles
    // container (see particlesContainerRef above), not the outer host.
    const measureParticles = useCallback(() => {
        const container = particlesContainerRef.current
        if (!container) return
        const rootRect = container.getBoundingClientRect()
        const containerHeight = Math.max(1, rootRect.height)
        containerHeightRef.current = containerHeight
        containerOffsetHeightRef.current = containerHeight * 0.1
        const isMobile = rootRect.width < 700
        const data = particleDataRef.current

        const states: ParticleState[] = []
        for (let i = 0; i < data.length; i++) {
            const el = particleElsRef.current[i]
            if (!el) continue
            const d = data[i]
            const overlay = overlayElsRef.current[i]
            if (overlay) overlay.style.opacity = `${1 - d.opacity}`

            const posX = isMobile ? (i % 4) * 25 + (d.x % 20) : d.x
            el.style.left = `${posX}%`
            el.style.top = `${d.y}%`
            el.style.transform = "translate3d(0, 0px, 0)"

            const rect = el.getBoundingClientRect()
            const top = rect.top - rootRect.top

            states.push({
                el,
                speed: d.speed,
                z: d.z,
                opacity: d.opacity,
                extra: 0,
                position: 0,
                currentScale: 1,
                top,
                height: rect.height,
            })
        }
        particleStatesRef.current = states

        targetRef.current = 0
        currentRef.current = 0
        lastRef.current = 0
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer) return
        measureParticles()
        const root = rootRef.current
        if (!root) return
        const observer = new ResizeObserver(() => measureParticles())
        observer.observe(root)
        const onResize = () => measureParticles()
        window.addEventListener("resize", onResize, { passive: true })
        return () => {
            observer.disconnect()
            window.removeEventListener("resize", onResize)
        }
    }, [
        measureParticles,
        safeImages,
        resolvedParticleSize,
        resolvedImageAspectRatio,
        resolvedParticleCount,
        isStaticRenderer,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer) return
        isDocumentVisibleRef.current = document.visibilityState !== "hidden"
        lastScrollYRef.current = window.scrollY || 0

        // Original onUpdate, restored exactly.
        const tick = (_time: number, deltaTime: number) => {
            // Substitute for the original's Scroll.listen (that internal
            // utility isn't available outside the original site) — velocity
            // is computed once per frame instead of per native scroll event,
            // but feeds into target/direction exactly as bindEvents' Scroll
            // callback does.
            const y = window.scrollY || 0
            const velocity = y - lastScrollYRef.current
            lastScrollYRef.current = y
            if (velocity !== 0) {
                targetRef.current += velocity * CONFIG.scrollMultiplier
                directionSignRef.current = Math.sign(velocity)
            }

            targetRef.current +=
                CONFIG.speed * speed * deltaTime * directionSignRef.current
            currentRef.current = lerp(
                currentRef.current,
                targetRef.current,
                CONFIG.ease
            )
            directionRef.current =
                currentRef.current < lastRef.current ? "down" : "up"

            const containerHeight = containerHeightRef.current
            const containerOffsetHeight = containerOffsetHeightRef.current
            const states = particleStatesRef.current

            for (let i = 0; i < states.length; i++) {
                const state = states[i]
                state.position = -currentRef.current * state.speed - state.extra
                const bottomPos = state.position + state.top + state.height

                const isBefore = bottomPos < -containerOffsetHeight
                const isAfter =
                    bottomPos > containerHeight + containerOffsetHeight

                if (directionRef.current === "up" && isBefore) {
                    state.extra =
                        state.extra - containerHeight - containerOffsetHeight
                }
                if (directionRef.current === "down" && isAfter) {
                    state.extra = state.extra + containerHeight
                }

                const particleTopY = state.position + state.top
                const progress = Math.max(
                    0,
                    Math.min(1, particleTopY / containerHeight)
                )
                const targetScale =
                    CONFIG.scaleMin +
                    progress * (CONFIG.scaleMax - CONFIG.scaleMin)
                state.currentScale = lerp(
                    state.currentScale,
                    targetScale,
                    CONFIG.scaleEase
                )

                state.el.style.transform = `translate3d(0, ${state.position}px, ${state.z}px) scale(${state.currentScale})`
            }
            lastRef.current = currentRef.current
        }

        const start = () => {
            if (!isDocumentVisibleRef.current) return
            gsap.ticker.add(tick)
        }
        const stop = () => {
            gsap.ticker.remove(tick)
        }
        const onVisibilityChange = () => {
            const visible = document.visibilityState !== "hidden"
            isDocumentVisibleRef.current = visible
            if (!visible) stop()
            else start()
        }
        document.addEventListener("visibilitychange", onVisibilityChange)
        start()
        return () => {
            document.removeEventListener("visibilitychange", onVisibilityChange)
            stop()
        }
    }, [isStaticRenderer, speed])

    // Particle frame size is fixed (Particle Size control / mobile
    // breakpoint) and is completely independent of image shape. Image shape
    // itself comes from the Image Aspect Ratio control: for the fixed
    // presets this is a static value (see IMAGE_ASPECT_RATIO_VALUES), but
    // "Original" needs each image's own natural dimensions, which are only
    // knowable once the image has actually loaded — so that one case is
    // applied here, directly to the loaded <img> element.
    const handleImageLoad = useCallback(
        (index: number) => (e: React.SyntheticEvent<HTMLImageElement>) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) {
                const naturalRatio = `${img.naturalWidth} / ${img.naturalHeight}`
                naturalImageRatioRef.current[index] = naturalRatio
                if (imageAspectRatio === "original") {
                    img.style.aspectRatio = naturalRatio
                }
            }
            if (!isStaticRenderer) {
                measureParticles()
            }
        },
        [measureParticles, isStaticRenderer, imageAspectRatio]
    )

    // Re-applies image aspect ratio to already-loaded images when the
    // control itself changes (handleImageLoad only fires once, on each
    // image's own load event). Only touches the <img>'s aspect-ratio style
    // — frame size, position, movement, scale, depth, opacity, and
    // recycling are untouched.
    useEffect(() => {
        const frames = particleElsRef.current
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i]
            if (!frame) continue
            const imgEl = frame.querySelector("img")
            if (!imgEl) continue
            const ratio =
                imageAspectRatio === "original"
                    ? naturalImageRatioRef.current[i] || "1 / 1"
                    : resolvedImageAspectRatio
            ;(imgEl as HTMLImageElement).style.aspectRatio = ratio
        }
        if (!isStaticRenderer) {
            measureParticles()
        }
    }, [
        imageAspectRatio,
        resolvedImageAspectRatio,
        measureParticles,
        isStaticRenderer,
    ])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                userSelect: "none",
                WebkitUserSelect: "none",
                backgroundColor,
                // Establishes a stacking context for this component, so the
                // particles container's zIndex: -1 (below) is contained
                // within this host instead of escaping to the page's own
                // stacking context. Any positioned element with an explicit
                // z-index does this — 0 keeps this host at its natural
                // paint order relative to page siblings while still
                // containing its own children's z-index values.
                zIndex: 0,
                ...style,
            }}
        >
            {/* Frame width follows the real site's own mechanism: a plain
                mobile-first CSS media query (min-width: 768px, viewport-
                based), not a JS/container-width computation. This is
                separate from the isMobile flag used inside measureParticles
                below, which only ever drove X-position column layout in the
                original reference and still does here — sizing and X-layout
                are two independently-breakpointed concerns in the real
                site, and this keeps them that way. */}
            <style>{`
                [data-particle-frame="${instanceId}"] {
                    width: ${MOBILE_PARTICLE_SIZE}px;
                }
                @media (min-width: 768px) {
                    [data-particle-frame="${instanceId}"] {
                        width: ${resolvedParticleSize}px;
                    }
                }
            `}</style>
            <div
                ref={particlesContainerRef}
                aria-hidden
                style={{
                    position: "absolute",
                    top: "-25%",
                    left: 0,
                    width: "100%",
                    height: "150%",
                    perspective: "800px",
                    transformStyle: "preserve-3d",
                    pointerEvents: "none",
                    zIndex: -1,
                }}
            >
                {Array.from({ length: resolvedParticleCount }).map((_, i) => {
                    const img = safeImages[i % safeImages.length]
                    const datum = particleDataRef.current[i]
                    // "Original" uses each particle's own cached natural
                    // ratio once its image has loaded (falls back to square
                    // until then); every other option uses the same fixed
                    // mapped value for all particles.
                    const imgAspectRatio =
                        imageAspectRatio === "original"
                            ? naturalImageRatioRef.current[i] || "1 / 1"
                            : resolvedImageAspectRatio
                    return (
                        <div
                            key={`particle-${i}`}
                            ref={(el) => {
                                if (el) particleElsRef.current[i] = el
                            }}
                            data-particle-frame={instanceId}
                            style={{
                                position: "absolute",
                                left:
                                    isStaticRenderer && datum
                                        ? `${datum.x}%`
                                        : "0%",
                                top:
                                    isStaticRenderer && datum
                                        ? `${datum.y}%`
                                        : "0%",
                                height: "auto",
                                aspectRatio: "1 / 1",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 1,
                                willChange: "transform",
                                borderRadius: `${borderRadius}px`,
                                overflow: "hidden",
                                ...(isStaticRenderer && datum
                                    ? {
                                          transform: `translate3d(0, 0px, ${datum.z}px) scale(1)`,
                                      }
                                    : {}),
                            }}
                        >
                            {img?.src ? (
                                <img
                                    src={img.src}
                                    srcSet={img.srcSet}
                                    alt={img.alt || ""}
                                    draggable={false}
                                    onDragStart={(event) =>
                                        event.preventDefault()
                                    }
                                    onLoad={handleImageLoad(i)}
                                    style={
                                        {
                                            width: "100%",
                                            height: "auto",
                                            aspectRatio: imgAspectRatio,
                                            objectFit: "cover",
                                            display: "block",
                                            userSelect: "none",
                                            WebkitUserSelect: "none",
                                            WebkitUserDrag: "none",
                                        } as React.CSSProperties
                                    }
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "auto",
                                        aspectRatio: imgAspectRatio,
                                        background:
                                            "linear-gradient(135deg,#dadada,#f5f5f5)",
                                    }}
                                />
                            )}
                            <div
                                ref={(el) => {
                                    if (el) overlayElsRef.current[i] = el
                                }}
                                aria-hidden
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "#ffffff",
                                    opacity: datum ? 1 - datum.opacity : 0,
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: `${edgeGradientSize}vh`,
                    background: `linear-gradient(to bottom, ${resolvedGradientColor} 0%, transparent 100%)`,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: `${edgeGradientSize}vh`,
                    background: `linear-gradient(to top, ${resolvedGradientColor} 0%, transparent 100%)`,
                    pointerEvents: "none",
                    zIndex: 2,
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: resolvedTextZ,
                    color: textColor,
                    mixBlendMode: resolvedTextBlendMode,
                    pointerEvents: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                    }}
                >
                    {resolvedBlocks.map((line, lineIndex) => (
                        <div
                            key={`line-${lineIndex}`}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                textAlign: "center",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    transform: `translateX(${line.indent || 0}px)`,
                                    fontSize: resolvedFont.fontSize,
                                    lineHeight: resolvedFont.lineHeight,
                                    letterSpacing: resolvedFont.letterSpacing,
                                    fontWeight: resolvedFont.fontWeight,
                                    fontStyle: resolvedFont.fontStyle,
                                    fontFamily: resolvedFont.fontFamily,
                                    textAlign: "center",
                                    textTransform,
                                }}
                            >
                                {line.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

ImageGalaxy.displayName = "Images Galaxy"

addPropertyControls(ImageGalaxy, {
    textBlocks: {
        type: ControlType.Array,
        title: "Text Blocks",
        defaultValue: [
            { text: "Some moments", indent: -67 },
            { text: "only happens", indent: 100 },
            { text: "once.", indent: 192 },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                text: {
                    type: ControlType.String,
                    title: "Text",
                    defaultValue: "Line",
                },
                indent: {
                    type: ControlType.Number,
                    title: "Indent",
                    defaultValue: 0,
                    min: -300,
                    max: 500,
                    step: 1,
                },
            },
        },
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 24,
        defaultValue: fallbackImages,
        control: { type: ControlType.ResponsiveImage },
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particles",
        defaultValue: 32,
        min: 8,
        max: 64,
        step: 1,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    gradientColor: {
        type: ControlType.Color,
        title: "Gradient Color",
        defaultValue: "#FFFFFF",
        optional: true,
    },
    edgeGradientSize: {
        type: ControlType.Number,
        title: "Edge Gradient Size",
        defaultValue: 10,
        min: 0,
        max: 50,
        step: 1,
        unit: "vh",
    },
    headingFont: {
        type: ControlType.Font,
        title: "Text Font",
        defaultValue: {
            fontFamily: "Work Sans",
            fontSize: "100px",
            variant: "Extra Bold",
            letterSpacing: "-0.07em",
            lineHeight: "0.8em",
            textAlign: "center",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Text Transform",
        defaultValue: "capitalize",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
    },
    textBlendMode: {
        type: ControlType.Enum,
        title: "Text Blend Mode",
        defaultValue: "normal",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Overlay",
            "Darken",
            "Lighten",
            "Color Dodge",
            "Color Burn",
            "Hard Light",
            "Soft Light",
            "Difference",
            "Exclusion",
            "Hue",
            "Saturation",
            "Color",
            "Luminosity",
        ],
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    textZIndex: {
        type: ControlType.Number,
        title: "Text Z",
        defaultValue: 8,
        min: 1,
        max: 20,
        step: 1,
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 0.5,
        min: 0.1,
        max: 3,
        step: 0.1,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 120,
        min: 20,
        max: 400,
        step: 1,
        unit: "px",
    },
    imageAspectRatio: {
        type: ControlType.Enum,
        title: "Image Aspect Ratio",
        defaultValue: "original",
        options: ["original", "1:1", "4:3", "3:4", "16:9", "9:16"],
        optionTitles: [
            "Original",
            "Square (1:1)",
            "Landscape (4:3)",
            "Portrait (3:4)",
            "Wide (16:9)",
            "Tall (9:16)",
        ],
    },
})
