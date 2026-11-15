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


type RatioPreset = "portrait" | "landscape" | "square" | "wide"
type BlendPreset = "normal" | "difference" | "lighter"

type ResponsiveImage =
    | string
    | {
          src?: string
          srcSet?: string
          alt?: string
      }

interface GalleryItem {
    image?: ResponsiveImage
    alt?: string
    link?: string
}

interface Props {
    items: GalleryItem[]
    ratio: RatioPreset
    cardWidth: number
    gap: number
    radius: number
    background: string
    showMarquee: boolean
    marquee: string
    separator: string
    marqueeColor: string
    marqueeSize: number
    blend: BlendPreset
    fineTune: boolean
    intensity: number
    depth: number
    spread: number
    perspective: number
    mobileEffect: number
    blurStrength: number
    saturationLoss: number
    velocitySensitivity: number
    topSpace: number
    bottomSpace: number
    vignette: number
    seed: number
    respectReducedMotion: boolean
    openInNewTab: boolean
    galleryLabel: string
    style?: React.CSSProperties
}

const PLACEHOLDERS = [
    "linear-gradient(135deg, #ce604a 0%, #5d1827 46%, #151016 100%)",
    "linear-gradient(145deg, #d8c591 0%, #79714c 42%, #20271f 100%)",
    "linear-gradient(125deg, #9eb7b7 0%, #45666d 48%, #101d24 100%)",
    "linear-gradient(155deg, #d5a48d 0%, #854f57 48%, #241927 100%)",
    "linear-gradient(135deg, #b0a2cf 0%, #4d426d 52%, #161526 100%)",
    "linear-gradient(145deg, #e4c2a4 0%, #87664d 47%, #241d19 100%)",
    "linear-gradient(120deg, #98b891 0%, #3d644a 50%, #14201c 100%)",
    "linear-gradient(150deg, #b8c9d8 0%, #526f8d 45%, #17202d 100%)",
    "linear-gradient(135deg, #d0a4b7 0%, #79445c 48%, #271522 100%)",
    "linear-gradient(150deg, #d8d0bd 0%, #777064 48%, #242321 100%)",
]

const DEFAULT_ITEMS: GalleryItem[] = Array.from({ length: 10 }, (_, index) => ({
    alt: `Gallery image ${index + 1}`,
}))

const RATIOS: Record<RatioPreset, string> = {
    portrait: "4 / 5",
    landscape: "14 / 9",
    square: "1 / 1",
    wide: "16 / 9",
}

const BLENDS: Record<BlendPreset, React.CSSProperties["mixBlendMode"]> = {
    normal: "normal",
    difference: "difference",
    lighter: "plus-lighter" as React.CSSProperties["mixBlendMode"],
}

const clamp = (value: number, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value))

const lerp = (from: number, to: number, amount: number) =>
    from + (to - from) * amount

function seededUnit(seed: number, index: number, channel: number) {
    let value = (seed | 0) ^ Math.imul(index + 1, 0x9e3779b1) ^ channel
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad)
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
    return ((value ^ (value >>> 15)) >>> 0) / 4294967295
}

function seededRange(
    seed: number,
    index: number,
    channel: number,
    min: number,
    max: number
) {
    return lerp(min, max, seededUnit(seed, index, channel))
}

function resolveImage(image?: ResponsiveImage) {
    if (typeof image === "string") return { src: image, srcSet: undefined }
    return { src: image?.src || "", srcSet: image?.srcSet }
}

function repeatedMarquee(text: string, separator: string) {
    const clean = text.trim() || "ROTATING GALLERY"
    const parts = clean
        .split(/\r?\n|\s*\|\s*/)
        .map((part) => part.trim())
        .filter(Boolean)
    const source = parts.length ? parts : [clean]
    return Array.from({ length: Math.max(8, source.length * 4) }, (_, index) =>
        index % 2 === 0
            ? source[Math.floor(index / 2) % source.length]
            : separator || "/"
    )
}

function velocityBlurTransform(
    progress: number,
    index: number,
    seed: number,
    intensity: number,
    depth: number
) {
    const p = clamp(progress)
    const baseX = seededRange(seed, index, 21, -10, 10) * intensity
    const baseY = seededRange(seed, index, 22, 200, 290) * intensity
    const baseZ = seededRange(seed, index, 23, -10, 10) * intensity
    const rx = lerp(baseX, -baseX, p)
    const ry = lerp(baseY, -baseY, p)
    const rz = lerp(baseZ, -baseZ, p)
    const z = Math.sin(p * Math.PI) * -depth

    return `translate3d(0, 0, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
}

/**
 * A dependency-free Velocity Blur 3D gallery driven by page scroll.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function RotatingScrollGallery(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        ratio = "portrait",
        cardWidth = 520,
        gap = -52,
        radius = 0,
        background = "#141414",
        showMarquee = true,
        marquee = "FRAMER | CREATIVE CODE | SCROLL GALLERY",
        separator = "/",
        marqueeColor = "#BEAF6E",
        marqueeSize = 104,
        blend = "difference",
        intensity = 1,
        depth = 150,
        spread = 20,
        perspective = 900,
        mobileEffect = 0.72,
        blurStrength = 15,
        saturationLoss = 1,
        velocitySensitivity = 1800,
        topSpace = 25,
        bottomSpace = 35,
        vignette = 0.55,
        seed = 17,
        respectReducedMotion = true,
        openInNewTab = false,
        galleryLabel = "Velocity blur image gallery",
        style,
    } = props

    const staticRenderer = useIsStaticRenderer()
    const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const wrapRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const trackRef = React.useRef<HTMLDivElement>(null)
    const visibleItems = items?.length ? items : DEFAULT_ITEMS
    const marqueeParts = React.useMemo(
        () => repeatedMarquee(marquee, separator),
        [marquee, separator]
    )

    React.useLayoutEffect(() => {
        if (staticRenderer || typeof window === "undefined") return

        const root = rootRef.current
        if (!root) return

        let frame = 0
        let destroyed = false
        let lastScrollY = window.scrollY
        let lastScrollTime = performance.now()
        let lastFrameTime = lastScrollTime
        let targetVelocity = 0
        let renderedVelocity = 0
        const initialRect = root.getBoundingClientRect()
        let inView =
            initialRect.bottom >= -window.innerHeight * 0.2 &&
            initialRect.top <= window.innerHeight * 1.2

        const systemReduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const resetTransforms = () => {
            cardRefs.current.forEach((card) => {
                if (!card) return
                card.style.transform = "translate3d(0,0,0)"
                card.style.filter = "none"
            })
        }

        const update = (time = performance.now()) => {
            frame = 0
            if (destroyed || !inView) return

            const reduced = respectReducedMotion && systemReduced.matches
            if (reduced) {
                targetVelocity = 0
                renderedVelocity = 0
                resetTransforms()
                return
            }

            const frameDelta = clamp(time - lastFrameTime, 8, 64)
            lastFrameTime = time

            if (time - lastScrollTime > 34) {
                targetVelocity *= Math.pow(0.72, frameDelta / 16.667)
            }

            const velocityEase = 1 - Math.pow(0.5, frameDelta / 16.667)
            renderedVelocity = lerp(
                renderedVelocity,
                targetVelocity,
                velocityEase
            )

            if (targetVelocity < 0.001) targetVelocity = 0
            if (renderedVelocity < 0.001) renderedVelocity = 0

            const viewportHeight = Math.max(window.innerHeight, 1)
            const rootWidth = Math.max(root.clientWidth, 1)
            const compact = rootWidth <= 640
            const responsiveEffect = compact ? mobileEffect : 1
            const appliedIntensity = intensity * responsiveEffect
            const appliedDepth = depth * responsiveEffect
            const appliedSpread = spread * (compact ? 0.55 : 1)
            const appliedBlur =
                renderedVelocity * blurStrength * responsiveEffect
            const appliedSaturation = clamp(
                1 - renderedVelocity * saturationLoss,
                0,
                1
            )
            const velocityFilter =
                appliedBlur < 0.03 && appliedSaturation > 0.999
                    ? "none"
                    : `blur(${appliedBlur.toFixed(2)}px) saturate(${appliedSaturation.toFixed(3)})`

            visibleItems.forEach((_, index) => {
                const card = cardRefs.current[index]
                const wrap = wrapRefs.current[index]
                if (!card || !wrap) return

                const rect = wrap.getBoundingClientRect()
                const startTop = viewportHeight * 1.2
                const endTop = -rect.height - viewportHeight * 0.2
                const progress = clamp(
                    (startTop - rect.top) / Math.max(startTop - endTop, 1)
                )
                const transform = velocityBlurTransform(
                    progress,
                    index,
                    seed,
                    appliedIntensity,
                    appliedDepth
                )

                const angle = index * 0.45
                const amplitude = rootWidth * (appliedSpread / 100)
                wrap.style.transform = `translate3d(${Math.sin(angle) * amplitude}px, 0, 0)`
                card.style.transform = transform
                card.style.filter = velocityFilter
            })

            const rootRect = root.getBoundingClientRect()
            const track = trackRef.current
            if (track) {
                const rootProgress = clamp(
                    (viewportHeight - rootRect.top) /
                        Math.max(viewportHeight + rootRect.height, 1)
                )
                const from = rootWidth
                const to = -track.scrollWidth
                track.style.transform = `translate3d(${lerp(from, to, rootProgress)}px, 0, 0)`
            }

            if (targetVelocity > 0 || renderedVelocity > 0) schedule()
        }

        const schedule = () => {
            if (!inView || destroyed) return
            if (!frame) frame = window.requestAnimationFrame(update)
        }

        const onScroll = () => {
            const now = performance.now()
            const nextScrollY = window.scrollY
            const elapsed = Math.max(now - lastScrollTime, 12)
            const pixelsPerSecond =
                (Math.abs(nextScrollY - lastScrollY) / elapsed) * 1000

            targetVelocity = Math.max(
                targetVelocity,
                clamp(pixelsPerSecond / Math.max(velocitySensitivity, 1))
            )
            lastScrollY = nextScrollY
            lastScrollTime = now
            schedule()
        }

        const intersectionObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      ([entry]) => {
                          inView = entry.isIntersecting

                          if (inView) {
                              lastScrollY = window.scrollY
                              lastScrollTime = performance.now()
                              schedule()
                          } else {
                              targetVelocity = 0
                              renderedVelocity = 0
                              if (frame) {
                                  window.cancelAnimationFrame(frame)
                                  frame = 0
                              }
                          }
                      },
                      {
                          root: null,
                          rootMargin: "20% 0px 20% 0px",
                          threshold: 0,
                      }
                  )
                : null

        const resizeObserver = new ResizeObserver(schedule)
        intersectionObserver?.observe(root)
        resizeObserver.observe(root)
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", schedule, { passive: true })
        systemReduced.addEventListener?.("change", schedule)
        update()

        return () => {
            destroyed = true
            if (frame) window.cancelAnimationFrame(frame)
            intersectionObserver?.disconnect()
            resizeObserver.disconnect()
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", schedule)
            systemReduced.removeEventListener?.("change", schedule)
        }
    }, [
        staticRenderer,
        intensity,
        depth,
        spread,
        mobileEffect,
        blurStrength,
        saturationLoss,
        velocitySensitivity,
        seed,
        respectReducedMotion,
        visibleItems.length,
        showMarquee,
        marquee,
        separator,
        cardWidth,
        gap,
        ratio,
        perspective,
    ])

    const scopedClass = `rsg-${instanceId}`
    const mobileGap = Math.max(-72, gap * 0.68)
    const rootStyle = {
        ...style,
        "--rsg-card-width": `${cardWidth}px`,
        "--rsg-mobile-card-width": `${Math.min(cardWidth, 420)}px`,
        "--rsg-gap": `${gap}px`,
        "--rsg-mobile-gap": `${mobileGap}px`,
        "--rsg-radius": `${radius}px`,
        "--rsg-perspective": `${perspective}px`,
        "--rsg-top": `${topSpace}vh`,
        "--rsg-bottom": `${bottomSpace}vh`,
        "--rsg-marquee-size": `${marqueeSize}px`,
        width: "100%",
        position: "relative",
        background,
        isolation: "isolate",
        containerType: "inline-size",
    } as React.CSSProperties

    return (
        <div
            ref={rootRef}
            className={scopedClass}
            style={rootStyle}
            role="region"
            aria-label={galleryLabel}
        >
            <style>{`
                .${scopedClass} {
                    box-sizing: border-box;
                    color: white;
                }
                .${scopedClass} *, .${scopedClass} *::before, .${scopedClass} *::after {
                    box-sizing: border-box;
                }
                .${scopedClass} .rsg-vignette {
                    position: sticky;
                    top: 0;
                    z-index: 5;
                    height: 100vh;
                    margin-bottom: -100vh;
                    pointer-events: none;
                }
                .${scopedClass} .rsg-marquee-pin {
                    position: sticky;
                    top: 50vh;
                    z-index: 4;
                    height: 0;
                    transform: translateY(-50%);
                    pointer-events: none;
                }
                .${scopedClass} .rsg-marquee-window {
                    width: 100%;
                    overflow: hidden;
                }
                .${scopedClass} .rsg-marquee-track {
                    display: flex;
                    align-items: center;
                    width: max-content;
                    gap: clamp(20px, 3vw, 48px);
                    will-change: transform;
                }
                .${scopedClass} .rsg-marquee-track span {
                    flex: none;
                    color: ${marqueeColor};
                    font: 800 clamp(32px, 9vw, var(--rsg-marquee-size)) / .86 Arial, Helvetica, sans-serif;
                    letter-spacing: -.055em;
                    text-transform: uppercase;
                    white-space: nowrap;
                }
                .${scopedClass} .rsg-gallery {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    padding-top: var(--rsg-top);
                    padding-bottom: var(--rsg-bottom);
                    overflow: clip;
                }
                .${scopedClass} .rsg-wrap {
                    width: min(var(--rsg-card-width), calc(100% - 40px));
                    margin-bottom: var(--rsg-gap);
                    perspective: var(--rsg-perspective);
                    transform-style: preserve-3d;
                    will-change: transform;
                }
                .${scopedClass} .rsg-wrap:last-child {
                    margin-bottom: 0;
                }
                .${scopedClass} .rsg-card,
                .${scopedClass} .rsg-card-link {
                    position: relative;
                    display: block;
                    width: 100%;
                    aspect-ratio: ${RATIOS[ratio]};
                    border-radius: var(--rsg-radius);
                    overflow: hidden;
                    transform-style: preserve-3d;
                    backface-visibility: visible;
                    will-change: transform, filter;
                }
                .${scopedClass} .rsg-card-link {
                    color: inherit;
                    text-decoration: none;
                }
                .${scopedClass} .rsg-media {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    pointer-events: none;
                    -webkit-user-drag: none;
                    user-select: none;
                }
                .${scopedClass} .rsg-card::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    box-shadow: inset 0 0 0 1px rgba(255,255,255,.09), inset 0 -40px 80px rgba(0,0,0,.14);
                    pointer-events: none;
                }
                @container (max-width: 640px) {
                    .${scopedClass} .rsg-wrap {
                        width: min(var(--rsg-mobile-card-width), calc(100% - 24px));
                        margin-bottom: var(--rsg-mobile-gap);
                        perspective: calc(var(--rsg-perspective) * .82);
                    }
                    .${scopedClass} .rsg-marquee-track span {
                        font-size: clamp(28px, 15vw, calc(var(--rsg-marquee-size) * .7));
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .${scopedClass} .rsg-card,
                    .${scopedClass} .rsg-wrap,
                    .${scopedClass} .rsg-marquee-track {
                        will-change: auto;
                    }
                }
            `}</style>

            {vignette > 0 && (
                <div
                    className="rsg-vignette"
                    aria-hidden="true"
                    style={{
                        background: `radial-gradient(circle at center, rgba(0,0,0,0) 12%, rgba(0,0,0,${clamp(vignette, 0, 1)}) 100%)`,
                    }}
                />
            )}

            {showMarquee && (
                <div className="rsg-marquee-pin" aria-hidden="true">
                    <div
                        className="rsg-marquee-window"
                        style={{ mixBlendMode: BLENDS[blend] }}
                    >
                        <div ref={trackRef} className="rsg-marquee-track">
                            {marqueeParts.map((part, index) => (
                                <span key={`${part}-${index}`}>{part}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="rsg-gallery">
                {visibleItems.map((item, index) => {
                    const image = resolveImage(item.image)
                    const media = (
                        <>
                            {image.src && (
                                <img
                                    className="rsg-media"
                                    src={image.src}
                                    srcSet={image.srcSet}
                                    alt={
                                        item.alt || `Gallery image ${index + 1}`
                                    }
                                    loading={index < 2 ? "eager" : "lazy"}
                                    decoding="async"
                                    draggable={false}
                                />
                            )}
                        </>
                    )

                    const cardStyle: React.CSSProperties = {
                        background: image.src
                            ? background
                            : PLACEHOLDERS[index % PLACEHOLDERS.length],
                    }

                    return (
                        <div
                            key={index}
                            ref={(node) => {
                                wrapRefs.current[index] = node
                            }}
                            className="rsg-wrap"
                            style={{
                                transform: `translate3d(${Math.sin(index * 0.45) * spread * 1.5}%, 0, 0)`,
                            }}
                        >
                            {item.link ? (
                                <a
                                    ref={(node) => {
                                        cardRefs.current[index] = node
                                    }}
                                    className="rsg-card rsg-card-link"
                                    style={cardStyle}
                                    href={item.link}
                                    target={openInNewTab ? "_blank" : undefined}
                                    rel={
                                        openInNewTab
                                            ? "noreferrer noopener"
                                            : undefined
                                    }
                                    aria-label={
                                        item.alt ||
                                        `Open gallery item ${index + 1}`
                                    }
                                >
                                    {media}
                                </a>
                            ) : (
                                <div
                                    ref={(node) => {
                                        cardRefs.current[index] = node
                                    }}
                                    className="rsg-card"
                                    style={cardStyle}
                                >
                                    {media}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

RotatingScrollGallery.defaultProps = {
    items: DEFAULT_ITEMS,
    ratio: "portrait",
    cardWidth: 520,
    gap: -52,
    radius: 0,
    background: "#141414",
    showMarquee: true,
    marquee: "FRAMER | CREATIVE CODE | SCROLL GALLERY",
    separator: "/",
    marqueeColor: "#BEAF6E",
    marqueeSize: 104,
    blend: "difference",
    fineTune: false,
    intensity: 1,
    depth: 150,
    spread: 20,
    perspective: 900,
    mobileEffect: 0.72,
    blurStrength: 15,
    saturationLoss: 1,
    velocitySensitivity: 1800,
    topSpace: 25,
    bottomSpace: 35,
    vignette: 0.55,
    seed: 17,
    respectReducedMotion: true,
    openInNewTab: false,
    galleryLabel: "Velocity blur image gallery",
}

addPropertyControls(RotatingScrollGallery, {
    items: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 30,
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    placeholder: "Describe the image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    ratio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ["portrait", "landscape", "square", "wide"],
        optionTitles: ["4:5", "14:9", "1:1", "16:9"],
        displaySegmentedControl: true,
        defaultValue: "portrait",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 180,
        max: 1000,
        step: 10,
        unit: "px",
        defaultValue: 520,
    },
    gap: {
        type: ControlType.Number,
        title: "Card Gap",
        min: -180,
        max: 240,
        step: 4,
        unit: "px",
        defaultValue: -52,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#141414",
    },
    showMarquee: {
        type: ControlType.Boolean,
        title: "Marquee",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    marquee: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue: "FRAMER | CREATIVE CODE | SCROLL GALLERY",
        hidden: (props) => !props.showMarquee,
    },
    separator: {
        type: ControlType.String,
        title: "Separator",
        defaultValue: "/",
        hidden: (props) => !props.showMarquee,
    },
    marqueeColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#BEAF6E",
        hidden: (props) => !props.showMarquee,
    },
    marqueeSize: {
        type: ControlType.Number,
        title: "Text Size",
        min: 28,
        max: 240,
        step: 2,
        unit: "px",
        defaultValue: 104,
        hidden: (props) => !props.showMarquee,
    },
    blend: {
        type: ControlType.Enum,
        title: "Text Blend",
        options: ["normal", "difference", "lighter"],
        optionTitles: ["Normal", "Difference", "Plus Lighter"],
        defaultValue: "difference",
        hidden: (props) => !props.showMarquee,
    },
    fineTune: {
        type: ControlType.Boolean,
        title: "Fine Tune",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: false,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 1.8,
        step: 0.05,
        defaultValue: 1,
        hidden: (props) => !props.fineTune,
    },
    depth: {
        type: ControlType.Number,
        title: "3D Depth",
        min: 0,
        max: 600,
        step: 10,
        unit: "px",
        defaultValue: 150,
        hidden: (props) => !props.fineTune,
    },
    spread: {
        type: ControlType.Number,
        title: "Side Spread",
        min: 0,
        max: 32,
        step: 1,
        unit: "%",
        defaultValue: 20,
        hidden: (props) => !props.fineTune,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 300,
        max: 2000,
        step: 50,
        unit: "px",
        defaultValue: 900,
        hidden: (props) => !props.fineTune,
    },
    mobileEffect: {
        type: ControlType.Number,
        title: "Mobile FX",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.72,
        hidden: (props) => !props.fineTune,
    },
    blurStrength: {
        type: ControlType.Number,
        title: "Motion Blur",
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        defaultValue: 15,
        hidden: (props) => !props.fineTune,
    },
    saturationLoss: {
        type: ControlType.Number,
        title: "Color Drain",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden: (props) => !props.fineTune,
    },
    velocitySensitivity: {
        type: ControlType.Number,
        title: "Blur Speed",
        min: 400,
        max: 4000,
        step: 100,
        unit: "px/s",
        defaultValue: 1800,
        hidden: (props) => !props.fineTune,
    },
    topSpace: {
        type: ControlType.Number,
        title: "Top Space",
        min: 0,
        max: 100,
        step: 5,
        unit: "vh",
        defaultValue: 25,
        hidden: (props) => !props.fineTune,
    },
    bottomSpace: {
        type: ControlType.Number,
        title: "Bottom Space",
        min: 0,
        max: 120,
        step: 5,
        unit: "vh",
        defaultValue: 35,
        hidden: (props) => !props.fineTune,
    },
    vignette: {
        type: ControlType.Number,
        title: "Vignette",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        hidden: (props) => !props.fineTune,
    },
    seed: {
        type: ControlType.Number,
        title: "Variation",
        min: 1,
        max: 999,
        step: 1,
        defaultValue: 17,
        hidden: (props) => !props.fineTune,
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduce Motion",
        defaultValue: true,
        hidden: (props) => !props.fineTune,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        hidden: (props) => !props.fineTune,
    },
    galleryLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "Velocity blur image gallery",
        hidden: (props) => !props.fineTune,
    },
})
