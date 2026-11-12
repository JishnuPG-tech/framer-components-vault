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
type CardSizeMode = "width" | "height"
type BlendPreset = "normal" | "difference" | "lighter"
type CardBlendPreset = "normal" | "multiply" | "screen" | "overlay" | "lighten"
type SceneTransition = "fade" | "cut"
type SceneWidthMode = "frame" | "viewport"
type ResponsiveFormat = "desktop" | "tablet" | "phone"

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

    scenes?: React.ReactNode[]
    scenesTablet?: React.ReactNode[]
    scenesPhone?: React.ReactNode[]
    responsiveScenes: boolean
    customBreakpoints: boolean
    phoneMaxWidth: number
    tabletMaxWidth: number
    sceneTransition: SceneTransition
    sceneOverlay: string
    sceneHeight: number
    sceneWidthMode: SceneWidthMode

    ratio: RatioPreset
    cardSizeMode: CardSizeMode
    responsiveCards: boolean
    cardWidth: number
    cardWidthTablet: number
    cardWidthPhone: number
    cardHeight: number
    cardHeightTablet: number
    cardHeightPhone: number
    cardOffsetX: number
    cardOffsetY: number
    cardOffsetXTablet: number
    cardOffsetYTablet: number
    cardOffsetXPhone: number
    cardOffsetYPhone: number
    gap: number
    radius: number
    background: string
    cardBackground: string
    showCardBorder: boolean
    cardBorderColor: string
    cardBorderWidth: number
    cardShade: boolean
    cardShadeColor: string
    cardShadeDepth: number
    cardBlend: CardBlendPreset
    cardShadow: boolean
    cardShadowColor: string
    cardShadowX: number
    cardShadowY: number
    cardShadowBlur: number
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

const EMPTY_SCENES: React.ReactNode[] = []

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

const CARD_BLENDS: Record<
    CardBlendPreset,
    React.CSSProperties["mixBlendMode"]
> = {
    normal: "normal",
    multiply: "multiply",
    screen: "screen",
    overlay: "overlay",
    lighten: "lighten",
}

const clamp = (value: number, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value))

const lerp = (from: number, to: number, amount: number) =>
    from + (to - from) * amount

const easeInOut = (value: number) =>
    value < 0.5 ? 2 * value * value : -1 + (4 - 2 * value) * value

const DEFAULT_PHONE_MAX = 809
const DEFAULT_TABLET_MAX = 1439

function getResponsiveFormat(
    width: number,
    phoneMax: number,
    tabletMax: number
): ResponsiveFormat {
    const safePhoneMax = Math.max(240, phoneMax)
    const safeTabletMax = Math.max(safePhoneMax + 1, tabletMax)

    if (width <= safePhoneMax) return "phone"
    if (width <= safeTabletMax) return "tablet"
    return "desktop"
}

function resolveResponsiveScene(
    desktop: React.ReactNode | undefined,
    tablet: React.ReactNode | undefined,
    phone: React.ReactNode | undefined,
    format: ResponsiveFormat,
    enabled: boolean
) {
    if (!enabled) return desktop
    if (format === "phone") return phone ?? tablet ?? desktop
    if (format === "tablet") return tablet ?? desktop
    return desktop
}

function resolveResponsiveNumber(
    desktop: number,
    tablet: number,
    phone: number,
    format: ResponsiveFormat,
    enabled: boolean
) {
    if (!enabled) return desktop
    if (format === "phone") return phone
    if (format === "tablet") return tablet
    return desktop
}

function fillSceneNode(node: React.ReactNode) {
    return React.Children.map(node, (child) => {
        if (!React.isValidElement(child)) return child

        const childProps = child.props as { style?: React.CSSProperties }

        return React.cloneElement(child as React.ReactElement<any>, {
            style: {
                ...childProps.style,
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                maxWidth: "none",
                maxHeight: "none",
            },
        })
    })
}

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
    const clean = text.trim()
    if (!clean) return []
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

function softRotateTransform(
    progress: number,
    index: number,
    seed: number,
    intensity: number,
    depth: number
) {
    const p = clamp(progress)
    const wave = Math.sin(p * Math.PI)
    const baseX = seededRange(seed, index, 11, 70, 120) * intensity
    const baseY = seededRange(seed, index, 12, -20, 20) * intensity
    const baseZ = seededRange(seed, index, 13, -20, 20) * intensity
    const rx = lerp(baseX, -baseX, p)
    const ry = lerp(baseY, -baseY, p)
    const rz = lerp(baseZ, -baseZ, p)
    const z = -wave * depth * 0.18

    return `translate3d(0, 0, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`
}

/**
 * A dependency-free soft 3D rotation gallery driven by page scroll.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function RotatingScrollGallery(props: Props) {
    const {
        items = DEFAULT_ITEMS,

        scenes = EMPTY_SCENES,
        scenesTablet = EMPTY_SCENES,
        scenesPhone = EMPTY_SCENES,
        responsiveScenes = true,
        customBreakpoints = false,
        phoneMaxWidth = DEFAULT_PHONE_MAX,
        tabletMaxWidth = DEFAULT_TABLET_MAX,
        sceneTransition = "fade",
        sceneOverlay = "rgba(0,0,0,0)",
        sceneHeight = 100,
        sceneWidthMode = "viewport",

        ratio = "portrait",
        cardSizeMode = "width",
        responsiveCards = true,
        cardWidth = 520,
        cardWidthTablet = 460,
        cardWidthPhone = 340,
        cardHeight = 100,
        cardHeightTablet = 100,
        cardHeightPhone = 90,
        cardOffsetX = 0,
        cardOffsetY = 0,
        cardOffsetXTablet = 0,
        cardOffsetYTablet = 0,
        cardOffsetXPhone = 0,
        cardOffsetYPhone = 0,
        gap = -52,
        radius = 0,
        background = "#141414",
        cardBackground = "rgba(0,0,0,0)",
        showCardBorder = true,
        cardBorderColor = "rgba(255,255,255,.09)",
        cardBorderWidth = 1,
        cardShade = true,
        cardShadeColor = "rgba(0,0,0,.14)",
        cardShadeDepth = 40,
        cardBlend = "normal",
        cardShadow = false,
        cardShadowColor = "rgba(0,0,0,.35)",
        cardShadowX = 0,
        cardShadowY = 28,
        cardShadowBlur = 60,
        showMarquee = true,
        marquee = "FRAMER | CREATIVE CODE | SCROLL GALLERY",
        separator = "/",
        marqueeColor = "#BEAF6E",
        marqueeSize = 104,
        blend = "difference",
        intensity = 1,
        depth = 760,
        spread = 20,
        perspective = 900,
        mobileEffect = 0.72,
        topSpace = 25,
        bottomSpace = 35,
        vignette = 0.55,
        seed = 17,
        respectReducedMotion = true,
        openInNewTab = false,
        galleryLabel = "Animated image gallery",
        style,
    } = props

    const staticRenderer = useIsStaticRenderer()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const instanceId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const rootRef = React.useRef<HTMLDivElement>(null)
    const cardRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const wrapRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const sceneRefs = React.useRef<Array<HTMLDivElement | null>>([])
    const trackRef = React.useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = React.useState(1440)
    const [viewportWidth, setViewportWidth] = React.useState(1440)
    const visibleItems = items?.length ? items : DEFAULT_ITEMS

    const effectivePhoneMax = customBreakpoints
        ? phoneMaxWidth
        : DEFAULT_PHONE_MAX
    const effectiveTabletMax = customBreakpoints
        ? tabletMaxWidth
        : DEFAULT_TABLET_MAX
    const responsiveFormat = getResponsiveFormat(
        isCanvas ? containerWidth : viewportWidth,
        effectivePhoneMax,
        effectiveTabletMax
    )

    const effectiveCardWidth = resolveResponsiveNumber(
        cardWidth,
        cardWidthTablet,
        cardWidthPhone,
        responsiveFormat,
        responsiveCards
    )
    const effectiveCardHeight = resolveResponsiveNumber(
        cardHeight,
        cardHeightTablet,
        cardHeightPhone,
        responsiveFormat,
        responsiveCards
    )
    const effectiveCardOffsetX = resolveResponsiveNumber(
        cardOffsetX,
        cardOffsetXTablet,
        cardOffsetXPhone,
        responsiveFormat,
        responsiveCards
    )
    const effectiveCardOffsetY = resolveResponsiveNumber(
        cardOffsetY,
        cardOffsetYTablet,
        cardOffsetYPhone,
        responsiveFormat,
        responsiveCards
    )

    const resolvedScenes = React.useMemo(
        () =>
            visibleItems.map((_, index) =>
                resolveResponsiveScene(
                    scenes[index],
                    scenesTablet[index],
                    scenesPhone[index],
                    responsiveFormat,
                    responsiveScenes
                )
            ),
        [
            visibleItems.length,
            scenes,
            scenesTablet,
            scenesPhone,
            responsiveFormat,
            responsiveScenes,
        ]
    )

    const hasScenes = resolvedScenes.some((scene) => scene != null)
    const marqueeParts = React.useMemo(
        () => repeatedMarquee(marquee, separator),
        [marquee, separator]
    )

    React.useLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return

        const measure = () => {
            const width = root.getBoundingClientRect().width
            if (width > 0) setContainerWidth(width)
        }

        measure()

        if (typeof ResizeObserver === "undefined") return
        const observer = new ResizeObserver(measure)
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const measure = () => {
            const visual = window.visualViewport
            setViewportWidth(Math.max(1, visual?.width ?? window.innerWidth))
        }

        measure()
        window.addEventListener("resize", measure)
        window.visualViewport?.addEventListener("resize", measure)

        return () => {
            window.removeEventListener("resize", measure)
            window.visualViewport?.removeEventListener("resize", measure)
        }
    }, [])

    React.useLayoutEffect(() => {
        if (staticRenderer || typeof window === "undefined") return

        const root = rootRef.current
        if (!root) return

        let frame = 0
        let destroyed = false
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
            wrapRefs.current.forEach((wrap) => {
                if (!wrap) return
                wrap.style.transform = `translate3d(${effectiveCardOffsetX}vw, ${effectiveCardOffsetY}vh, 0)`
            })
        }

        const updateSceneLayers = (
            viewportHeight: number,
            reduced: boolean
        ) => {
            if (!hasScenes || resolvedScenes.length === 0) return

            const viewportCenter = viewportHeight * 0.5
            const centers = visibleItems.map((_, index) => {
                const wrap = wrapRefs.current[index]
                if (!wrap) return Number.POSITIVE_INFINITY
                const rect = wrap.getBoundingClientRect()
                return rect.top + rect.height * 0.5
            })

            let sceneProgress = 0
            const lastIndex = Math.max(0, centers.length - 1)

            if (centers.length > 1) {
                if (viewportCenter <= centers[0]) {
                    sceneProgress = 0
                } else if (viewportCenter >= centers[lastIndex]) {
                    sceneProgress = lastIndex
                } else {
                    for (let index = 0; index < lastIndex; index += 1) {
                        const from = centers[index]
                        const to = centers[index + 1]

                        if (viewportCenter >= from && viewportCenter <= to) {
                            const local = clamp(
                                (viewportCenter - from) / Math.max(to - from, 1)
                            )
                            sceneProgress = index + easeInOut(local)
                            break
                        }
                    }
                }
            }

            const cut = reduced || sceneTransition === "cut"
            const activeIndex = Math.min(
                lastIndex,
                Math.max(0, Math.round(sceneProgress))
            )
            const lowerIndex = Math.floor(sceneProgress)
            const upperIndex = Math.min(lastIndex, Math.ceil(sceneProgress))
            const local = sceneProgress - lowerIndex

            sceneRefs.current.forEach((layer, index) => {
                if (!layer) return

                const opacity = cut
                    ? index === activeIndex
                        ? 1
                        : 0
                    : index === lowerIndex
                      ? 1 - local
                      : index === upperIndex
                        ? local
                        : 0

                layer.style.opacity = `${opacity}`
                layer.style.visibility = opacity <= 0.001 ? "hidden" : "visible"
            })
        }

        const update = () => {
            frame = 0
            if (destroyed || !inView) return

            const reduced = respectReducedMotion && systemReduced.matches
            const viewportHeight = Math.max(window.innerHeight, 1)
            const rootWidth = Math.max(root.clientWidth, 1)
            const compact = rootWidth <= 640
            const responsiveEffect = compact ? mobileEffect : 1
            const appliedIntensity = intensity * responsiveEffect
            const appliedDepth = depth * responsiveEffect
            const appliedSpread = spread * (compact ? 0.55 : 1)

            if (reduced) {
                resetTransforms()
            } else {
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
                    const transform = softRotateTransform(
                        progress,
                        index,
                        seed,
                        appliedIntensity,
                        appliedDepth
                    )

                    const angle = index * 0.45
                    const amplitude = rootWidth * (appliedSpread / 100)
                    wrap.style.transform = `translate3d(calc(${Math.sin(angle) * amplitude}px + ${effectiveCardOffsetX}vw), ${effectiveCardOffsetY}vh, 0)`
                    card.style.transform = transform
                    card.style.filter = "none"
                })
            }

            updateSceneLayers(viewportHeight, reduced)

            const rootRect = root.getBoundingClientRect()
            const track = trackRef.current
            if (track && !reduced) {
                const rootProgress = clamp(
                    (viewportHeight - rootRect.top) /
                        Math.max(viewportHeight + rootRect.height, 1)
                )
                const from = rootWidth
                const to = -track.scrollWidth
                track.style.transform = `translate3d(${lerp(from, to, rootProgress)}px, 0, 0)`
            }
        }

        const schedule = () => {
            if (!inView || destroyed) return
            if (!frame) frame = window.requestAnimationFrame(update)
        }

        const onScroll = () => {
            schedule()
        }

        const intersectionObserver =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      ([entry]) => {
                          inView = entry.isIntersecting

                          if (inView) {
                              schedule()
                          } else {
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
        seed,
        respectReducedMotion,
        visibleItems.length,
        showMarquee,
        marquee,
        separator,
        cardSizeMode,
        effectiveCardWidth,
        effectiveCardHeight,
        effectiveCardOffsetX,
        effectiveCardOffsetY,
        gap,
        ratio,
        perspective,
        hasScenes,
        resolvedScenes,
        sceneTransition,
    ])

    const scopedClass = `rsg-${instanceId}`
    const mobileGap = Math.max(-72, gap * 0.68)
    const rootStyle = {
        ...style,
        "--rsg-card-width": `${effectiveCardWidth}px`,
        "--rsg-mobile-card-width": `${responsiveCards ? effectiveCardWidth : Math.min(cardWidth, 420)}px`,
        "--rsg-card-height": `${effectiveCardHeight}vh`,
        "--rsg-gap": `${gap}px`,
        "--rsg-mobile-gap": `${mobileGap}px`,
        "--rsg-radius": `${radius}px`,
        "--rsg-perspective": `${perspective}px`,
        "--rsg-scene-height": `${sceneHeight}vh`,
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
                .${scopedClass} .rsg-scenes-pin {
                    position: sticky;
                    top: 0;
                    z-index: 0;
                    width: ${sceneWidthMode === "viewport" ? "100vw" : "100%"};
                    ${sceneWidthMode === "viewport" ? "margin-left: calc(50% - 50vw);" : ""}
                    height: var(--rsg-scene-height);
                    margin-bottom: calc(var(--rsg-scene-height) * -1);
                    overflow: hidden;
                    background: ${background};
                    pointer-events: none;
                }
                .${scopedClass} .rsg-scene {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    visibility: hidden;
                    will-change: opacity;
                }
                .${scopedClass} .rsg-scene-overlay {
                    position: absolute;
                    inset: 0;
                    z-index: 2;
                    background: ${sceneOverlay};
                    pointer-events: none;
                }
                .${scopedClass} .rsg-vignette {
                    position: sticky;
                    top: 0;
                    z-index: 5;
                    width: ${sceneWidthMode === "viewport" ? "100vw" : "100%"};
                    ${sceneWidthMode === "viewport" ? "margin-left: calc(50% - 50vw);" : ""}
                    height: var(--rsg-scene-height);
                    margin-bottom: calc(var(--rsg-scene-height) * -1);
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
                    ${
                        cardSizeMode === "height"
                            ? `height: var(--rsg-card-height);
                    width: auto;
                    aspect-ratio: ${RATIOS[ratio]};
                    max-width: none;`
                            : `width: min(var(--rsg-card-width), calc(100% - 40px));
                    height: auto;`
                    }
                    margin-bottom: var(--rsg-gap);
                    perspective: var(--rsg-perspective);
                    transform-style: preserve-3d;
                    will-change: transform;
                    filter: ${cardShadow ? `drop-shadow(${cardShadowX}px ${cardShadowY}px ${cardShadowBlur}px ${cardShadowColor})` : "none"};
                }
                .${scopedClass} .rsg-wrap:last-child {
                    margin-bottom: 0;
                }
                .${scopedClass} .rsg-card,
                .${scopedClass} .rsg-card-link {
                    position: relative;
                    display: block;
                    width: 100%;
                    height: 100%;
                    aspect-ratio: ${RATIOS[ratio]};
                    border-radius: var(--rsg-radius);
                    overflow: hidden;
                    transform-style: preserve-3d;
                    backface-visibility: visible;
                    will-change: transform, filter;
                    mix-blend-mode: ${CARD_BLENDS[cardBlend]};
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
                    box-shadow: ${
                        [
                            showCardBorder
                                ? `inset 0 0 0 ${Math.max(0, cardBorderWidth)}px ${cardBorderColor}`
                                : "",
                            cardShade
                                ? `inset 0 -${Math.max(0, cardShadeDepth)}px ${Math.max(0, cardShadeDepth) * 2}px ${cardShadeColor}`
                                : "",
                        ]
                            .filter(Boolean)
                            .join(", ") || "none"
                    };
                    pointer-events: none;
                }
                @container (max-width: 640px) {
                    .${scopedClass} .rsg-wrap {
                        ${
                            cardSizeMode === "height"
                                ? `height: var(--rsg-card-height);
                        width: auto;
                        aspect-ratio: ${RATIOS[ratio]};`
                                : `width: min(var(--rsg-mobile-card-width), calc(100% - 24px));`
                        }
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

            {hasScenes && (
                <div className="rsg-scenes-pin" aria-hidden="true">
                    {resolvedScenes.map((scene, index) => (
                        <div
                            key={`scene-${index}`}
                            ref={(node) => {
                                sceneRefs.current[index] = node
                            }}
                            className="rsg-scene"
                            style={{
                                zIndex: 1,
                                opacity: index === 0 ? 1 : 0,
                                visibility: index === 0 ? "visible" : "hidden",
                            }}
                        >
                            {scene ? fillSceneNode(scene) : null}
                        </div>
                    ))}
                    {sceneOverlay !== "rgba(0,0,0,0)" && (
                        <div className="rsg-scene-overlay" />
                    )}
                </div>
            )}

            {vignette > 0 && (
                <div
                    className="rsg-vignette"
                    aria-hidden="true"
                    style={{
                        background: `radial-gradient(circle at center, rgba(0,0,0,0) 12%, rgba(0,0,0,${clamp(vignette, 0, 1)}) 100%)`,
                    }}
                />
            )}

            {showMarquee && marqueeParts.length > 0 && (
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
                            ? cardBackground
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
                                transform: `translate3d(calc(${Math.sin(index * 0.45) * spread * 1.5}% + ${effectiveCardOffsetX}vw), ${effectiveCardOffsetY}vh, 0)`,
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
    scenes: [],
    scenesTablet: [],
    scenesPhone: [],
    responsiveScenes: true,
    customBreakpoints: false,
    phoneMaxWidth: DEFAULT_PHONE_MAX,
    tabletMaxWidth: DEFAULT_TABLET_MAX,
    sceneTransition: "fade",
    sceneOverlay: "rgba(0,0,0,0)",
    sceneHeight: 100,
    sceneWidthMode: "viewport",
    ratio: "portrait",
    cardSizeMode: "width",
    responsiveCards: true,
    cardWidth: 520,
    cardWidthTablet: 460,
    cardWidthPhone: 340,
    cardHeight: 100,
    cardHeightTablet: 100,
    cardHeightPhone: 90,
    cardOffsetX: 0,
    cardOffsetY: 0,
    cardOffsetXTablet: 0,
    cardOffsetYTablet: 0,
    cardOffsetXPhone: 0,
    cardOffsetYPhone: 0,
    gap: -52,
    radius: 0,
    background: "#141414",
    cardBackground: "rgba(0,0,0,0)",
    showCardBorder: true,
    cardBorderColor: "rgba(255,255,255,.09)",
    cardBorderWidth: 1,
    cardShade: true,
    cardShadeColor: "rgba(0,0,0,.14)",
    cardShadeDepth: 40,
    cardBlend: "normal",
    cardShadow: false,
    cardShadowColor: "rgba(0,0,0,.35)",
    cardShadowX: 0,
    cardShadowY: 28,
    cardShadowBlur: 60,
    showMarquee: true,
    marquee: "FRAMER | CREATIVE CODE | SCROLL GALLERY",
    separator: "/",
    marqueeColor: "#BEAF6E",
    marqueeSize: 104,
    blend: "difference",
    fineTune: false,
    intensity: 1,
    depth: 760,
    spread: 20,
    perspective: 900,
    mobileEffect: 0.72,
    topSpace: 25,
    bottomSpace: 35,
    vignette: 0.55,
    seed: 17,
    respectReducedMotion: true,
    openInNewTab: false,
    galleryLabel: "Animated image gallery",
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
    scenes: {
        type: ControlType.Array,
        title: "Backgrounds",
        maxCount: 30,
        control: {
            type: ControlType.ComponentInstance,
        },
        defaultValue: [],
        description:
            "Background 1 follows Image 1, Background 2 follows Image 2, and so on.",
    },
    responsiveScenes: {
        type: ControlType.Boolean,
        title: "Responsive BG",
        defaultValue: true,
        enabledTitle: "Separate",
        disabledTitle: "Shared",
    },
    scenesTablet: {
        type: ControlType.Array,
        title: "BG · Tablet",
        maxCount: 30,
        control: {
            type: ControlType.ComponentInstance,
        },
        defaultValue: [],
        hidden: (props) => !props.responsiveScenes,
    },
    scenesPhone: {
        type: ControlType.Array,
        title: "BG · Phone",
        maxCount: 30,
        control: {
            type: ControlType.ComponentInstance,
        },
        defaultValue: [],
        hidden: (props) => !props.responsiveScenes,
    },
    customBreakpoints: {
        type: ControlType.Boolean,
        title: "Custom Widths",
        defaultValue: false,
        hidden: (props) => !props.responsiveScenes && !props.responsiveCards,
    },
    phoneMaxWidth: {
        type: ControlType.Number,
        title: "Phone Max",
        defaultValue: DEFAULT_PHONE_MAX,
        min: 320,
        max: 1200,
        step: 1,
        unit: "px",
        hidden: (props) =>
            (!props.responsiveScenes && !props.responsiveCards) ||
            !props.customBreakpoints,
    },
    tabletMaxWidth: {
        type: ControlType.Number,
        title: "Tablet Max",
        defaultValue: DEFAULT_TABLET_MAX,
        min: 600,
        max: 2200,
        step: 1,
        unit: "px",
        hidden: (props) =>
            (!props.responsiveScenes && !props.responsiveCards) ||
            !props.customBreakpoints,
    },
    sceneTransition: {
        type: ControlType.Enum,
        title: "BG Change",
        options: ["fade", "cut"],
        optionTitles: ["Fade", "Cut"],
        defaultValue: "fade",
        displaySegmentedControl: true,
    },
    sceneOverlay: {
        type: ControlType.Color,
        title: "BG Overlay",
        defaultValue: "rgba(0,0,0,0)",
    },
    sceneHeight: {
        type: ControlType.Number,
        title: "BG Height",
        min: 20,
        max: 150,
        step: 1,
        unit: "vh",
        defaultValue: 100,
        description:
            "Height of the sticky background stage. Use 100vh for a full-screen background.",
    },
    sceneWidthMode: {
        type: ControlType.Enum,
        title: "BG Width",
        options: ["viewport", "frame"],
        optionTitles: ["Viewport", "Frame"],
        displaySegmentedControl: true,
        defaultValue: "viewport",
        description:
            "Viewport stretches backgrounds across the full browser width, even when the component sits inside a narrower Framer frame.",
    },
    ratio: {
        type: ControlType.Enum,
        title: "Ratio",
        options: ["portrait", "landscape", "square", "wide"],
        optionTitles: ["4:5", "14:9", "1:1", "16:9"],
        displaySegmentedControl: true,
        defaultValue: "portrait",
    },
    cardSizeMode: {
        type: ControlType.Enum,
        title: "Card Size",
        options: ["width", "height"],
        optionTitles: ["Width", "Height"],
        displaySegmentedControl: true,
        defaultValue: "width",
        description:
            "Width uses a fixed pixel width. Height uses viewport height and calculates width from the selected ratio.",
    },
    responsiveCards: {
        type: ControlType.Boolean,
        title: "Responsive Card",
        enabledTitle: "Separate",
        disabledTitle: "Shared",
        defaultValue: true,
        description:
            "Use separate size and position values for Desktop, Tablet, and Phone.",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 180,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 520,
        hidden: (props) => props.cardSizeMode === "height",
    },
    cardWidthTablet: {
        type: ControlType.Number,
        title: "Width · Tablet",
        min: 120,
        max: 1600,
        step: 10,
        unit: "px",
        defaultValue: 460,
        hidden: (props) =>
            props.cardSizeMode === "height" || !props.responsiveCards,
    },
    cardWidthPhone: {
        type: ControlType.Number,
        title: "Width · Phone",
        min: 100,
        max: 1000,
        step: 10,
        unit: "px",
        defaultValue: 340,
        hidden: (props) =>
            props.cardSizeMode === "height" || !props.responsiveCards,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 20,
        max: 150,
        step: 1,
        unit: "vh",
        defaultValue: 100,
        hidden: (props) => props.cardSizeMode !== "height",
        description:
            "Use 100vh to make each card as tall as the viewport. Width is calculated from Ratio.",
    },
    cardHeightTablet: {
        type: ControlType.Number,
        title: "Height · Tablet",
        min: 20,
        max: 180,
        step: 1,
        unit: "vh",
        defaultValue: 100,
        hidden: (props) =>
            props.cardSizeMode !== "height" || !props.responsiveCards,
    },
    cardHeightPhone: {
        type: ControlType.Number,
        title: "Height · Phone",
        min: 20,
        max: 180,
        step: 1,
        unit: "vh",
        defaultValue: 90,
        hidden: (props) =>
            props.cardSizeMode !== "height" || !props.responsiveCards,
    },
    cardOffsetX: {
        type: ControlType.Number,
        title: "Card X",
        min: -60,
        max: 60,
        step: 1,
        unit: "vw",
        defaultValue: 0,
    },
    cardOffsetY: {
        type: ControlType.Number,
        title: "Card Y",
        min: -60,
        max: 60,
        step: 1,
        unit: "vh",
        defaultValue: 0,
    },
    cardOffsetXTablet: {
        type: ControlType.Number,
        title: "X · Tablet",
        min: -60,
        max: 60,
        step: 1,
        unit: "vw",
        defaultValue: 0,
        hidden: (props) => !props.responsiveCards,
    },
    cardOffsetYTablet: {
        type: ControlType.Number,
        title: "Y · Tablet",
        min: -60,
        max: 60,
        step: 1,
        unit: "vh",
        defaultValue: 0,
        hidden: (props) => !props.responsiveCards,
    },
    cardOffsetXPhone: {
        type: ControlType.Number,
        title: "X · Phone",
        min: -60,
        max: 60,
        step: 1,
        unit: "vw",
        defaultValue: 0,
        hidden: (props) => !props.responsiveCards,
    },
    cardOffsetYPhone: {
        type: ControlType.Number,
        title: "Y · Phone",
        min: -60,
        max: 60,
        step: 1,
        unit: "vh",
        defaultValue: 0,
        hidden: (props) => !props.responsiveCards,
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
        title: "Section BG",
        defaultValue: "#141414",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "rgba(0,0,0,0)",
    },
    showCardBorder: {
        type: ControlType.Boolean,
        title: "Card Border",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    cardBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "rgba(255,255,255,.09)",
        hidden: (props) => !props.showCardBorder,
    },
    cardBorderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
        defaultValue: 1,
        hidden: (props) => !props.showCardBorder,
    },
    cardShade: {
        type: ControlType.Boolean,
        title: "Card Shade",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    cardShadeColor: {
        type: ControlType.Color,
        title: "Shade Color",
        defaultValue: "rgba(0,0,0,.14)",
        hidden: (props) => !props.cardShade,
    },
    cardShadeDepth: {
        type: ControlType.Number,
        title: "Shade Depth",
        min: 0,
        max: 160,
        step: 2,
        unit: "px",
        defaultValue: 40,
        hidden: (props) => !props.cardShade,
    },
    cardBlend: {
        type: ControlType.Enum,
        title: "Card Blend",
        options: ["normal", "multiply", "screen", "overlay", "lighten"],
        optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Lighten"],
        defaultValue: "normal",
    },
    cardShadow: {
        type: ControlType.Boolean,
        title: "Card Shadow",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: false,
    },
    cardShadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "rgba(0,0,0,.35)",
        hidden: (props) => !props.cardShadow,
    },
    cardShadowX: {
        type: ControlType.Number,
        title: "Shadow X",
        min: -120,
        max: 120,
        step: 1,
        unit: "px",
        defaultValue: 0,
        hidden: (props) => !props.cardShadow,
    },
    cardShadowY: {
        type: ControlType.Number,
        title: "Shadow Y",
        min: -120,
        max: 160,
        step: 1,
        unit: "px",
        defaultValue: 28,
        hidden: (props) => !props.cardShadow,
    },
    cardShadowBlur: {
        type: ControlType.Number,
        title: "Shadow Blur",
        min: 0,
        max: 240,
        step: 2,
        unit: "px",
        defaultValue: 60,
        hidden: (props) => !props.cardShadow,
    },
    showMarquee: {
        type: ControlType.Boolean,
        title: "Show Marquee",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    marquee: {
        type: ControlType.String,
        title: "Marquee Text",
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
        max: 1400,
        step: 20,
        unit: "px",
        defaultValue: 760,
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
        defaultValue: "Animated image gallery",
        hidden: (props) => !props.fineTune,
    },
})
