// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, type CSSProperties } from "react"

interface CardImage {
    src: string
    srcSet?: string
    alt?: string
}

interface CardItem {
    image: CardImage
    title: string
    link?: string
    newTab?: boolean
}

interface CardCarouselProps {
    items: CardItem[]
    radius: number
    spacing: number
    cardWidth: number
    cardHeight: number
    arcOffset: number
    sensitivity: number
    tiltAmount: number
    eyebrow: string
    heading: string
    titleFont: any
    numberFont: any
    eyebrowFont: any
    headingFont: any
    textColor: string
    mutedColor: string
    background: string
    style?: CSSProperties
}

const DEFAULT_ITEMS: CardItem[] = [
    { image: { src: "https://images.unsplash.com/photo-1646038572815-43fe759e459b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Violet Frequencies" }, title: "Violet Frequencies" },
    { image: { src: "https://images.unsplash.com/photo-1579546928937-641f7ac9bced?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Chartreuse Signal" }, title: "Chartreuse Signal" },
    { image: { src: "https://images.unsplash.com/photo-1582583077359-9b1c0eb3fbfc?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Pistil Bloom" }, title: "Pistil Bloom" },
    { image: { src: "https://images.unsplash.com/photo-1527017895487-3ac53c0f03fa?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Marigold Riot" }, title: "Marigold Riot" },
    { image: { src: "https://images.unsplash.com/photo-1617690032703-f991ed0e0ee6?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Neon Muse" }, title: "Neon Muse" },
    { image: { src: "https://images.unsplash.com/photo-1747640731141-7d81ade721bd?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Dressed in Color" }, title: "Dressed in Color" },
    { image: { src: "https://images.unsplash.com/photo-1541702467897-41915a07d3a7?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Rain & Neon" }, title: "Rain & Neon" },
    { image: { src: "https://images.unsplash.com/photo-1534270804882-6b5048b1c1fc?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "After Hours" }, title: "After Hours" },
    { image: { src: "https://images.unsplash.com/photo-1604893818324-193544f110fd?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Liquid Aurora" }, title: "Liquid Aurora" },
    { image: { src: "https://images.unsplash.com/photo-1637416067365-2b5e7e8fe8fa?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Iridescent Drift" }, title: "Iridescent Drift" },
    { image: { src: "https://images.unsplash.com/photo-1713999212351-78f54ee46d9e?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Sunlit Facades" }, title: "Sunlit Facades" },
    { image: { src: "https://images.unsplash.com/photo-1620217310705-ea0af48e8158?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=500", alt: "Citrus Nocturne" }, title: "Citrus Nocturne" },
]

// Tile the wheel by the total card span so it loops seamlessly with no gap.
function wrapAngle(deg: number, period: number): number {
    const half = period / 2
    let a = deg % period
    if (a < -half) a += period
    if (a >= half) a -= period
    return a
}

function pad3(n: number): string {
    return String(n).padStart(3, "0")
}

function cardTransform(theta: number, tilt: number, radius: number): string {
    const rad = (theta * Math.PI) / 180
    const x = radius * Math.sin(rad)
    const y = -radius * Math.cos(rad)
    return `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) rotateZ(${theta}deg) rotateY(${tilt}deg)`
}

function cardOpacity(theta: number, fadeStart: number, fadeEnd: number): number {
    const t = Math.abs(theta)
    if (t <= fadeStart) return 1
    if (t >= fadeEnd) return 0
    return 1 - (t - fadeStart) / (fadeEnd - fadeStart)
}

// Resolve a link value to a safe href. Internal paths ("/about"), anchors
// ("#id"), and values with a scheme ("https:", "mailto:", "tel:") pass through.
// Bare domains like "www.vish.design" get "https://" so they aren't treated
// as a relative path.
function resolveHref(link: unknown): string | undefined {
    let href: string | undefined
    if (typeof link === "string") href = link
    else if (link && typeof link === "object")
        href = (link as any).href || (link as any).url
    if (!href) return undefined
    href = href.trim()
    if (!href) return undefined
    if (/^(\/|#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(href)) return href
    return "https://" + href
}

/**
 * Card Carousel
 *
 * A draggable arc of cards that loops infinitely (360°) and tilts in 3D while
 * dragging — dragging right tilts the cards one way, dragging left the other.
 * Each card can link to a page or URL. Motion is smoothed with a lightweight
 * requestAnimationFrame loop (no external dependencies).
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 760
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ArcCardCarousel(props: CardCarouselProps) {
    const {
        items = DEFAULT_ITEMS,
        radius = 1450,
        spacing = 10,
        cardWidth = 250,
        cardHeight = 372,
        arcOffset = 230,
        sensitivity = 1,
        tiltAmount = 20,
        eyebrow = "CARD CAROUSEL / DRAG TO EXPLORE",
        heading = "Move through Movements",
        titleFont,
        numberFont,
        eyebrowFont,
        headingFont,
        textColor = "#0f172a",
        mutedColor = "#9ca3af",
        background = "#ffffff",
        style,
    } = props

    const list = items && items.length > 0 ? items : DEFAULT_ITEMS
    const count = list.length
    const period = count * spacing
    const half = period / 2
    const fadeEnd = Math.min(88, half - 3)
    const fadeStart = Math.max(10, fadeEnd - 16)

    const containerRef = useRef<HTMLDivElement | null>(null)
    const cardRefs = useRef<Array<HTMLDivElement | null>>([])

    // Animated proxies (wheel rotation + shared 3D tilt).
    const rotProxy = useRef({ r: 0 })
    const tiltProxy = useRef({ t: 0 })

    // Disable all animation / pointer effects in static contexts
    // (Framer canvas + export). We still render the arc as a static preview.
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const render = () => {
            const rot = rotProxy.current.r
            const tlt = tiltProxy.current.t
            for (let i = 0; i < count; i++) {
                const el = cardRefs.current[i]
                if (!el) continue
                const theta = wrapAngle(i * spacing - rot, period)
                el.style.transform = cardTransform(theta, tlt, radius)
                el.style.opacity = String(cardOpacity(theta, fadeStart, fadeEnd))
                el.style.zIndex = String(Math.round(1000 - Math.abs(theta)))
            }
        }

        render()
        if (isStatic) return

        // Lightweight rAF tween engine (no external deps, so the module's
        // default export builds cleanly for export / SSG).
        interface Tween {
            from: number
            to: number
            start: number
            dur: number
        }
        let raf: number | null = null
        let rotTween: Tween | null = null
        let tiltTween: Tween | null = null

        const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3)

        const frame = (now: number) => {
            raf = null
            let active = false
            if (rotTween) {
                const p = Math.min(1, (now - rotTween.start) / rotTween.dur)
                rotProxy.current.r =
                    rotTween.from + (rotTween.to - rotTween.from) * easeOutCubic(p)
                if (p >= 1) rotTween = null
                else active = true
            }
            if (tiltTween) {
                const p = Math.min(1, (now - tiltTween.start) / tiltTween.dur)
                tiltProxy.current.t =
                    tiltTween.from +
                    (tiltTween.to - tiltTween.from) * easeOutCubic(p)
                if (p >= 1) tiltTween = null
                else active = true
            }
            render()
            if (active) raf = requestAnimationFrame(frame)
        }
        const ensureFrame = () => {
            if (raf == null) raf = requestAnimationFrame(frame)
        }

        // Drag state
        let dragging = false
        let lastX = 0
        let lastT = 0
        let downX = 0
        let dragMoved = false // true once it's a real drag (suppress link nav)
        let velocity = 0 // deg / second
        let dir = 0
        let target = rotProxy.current.r // accumulated wheel rotation target

        const setTilt = (value: number) => {
            tiltTween = {
                from: tiltProxy.current.t,
                to: value,
                start: performance.now(),
                dur: 550,
            }
            ensureFrame()
        }

        const onDown = (e: PointerEvent) => {
            dragging = true
            lastX = e.clientX
            downX = e.clientX
            dragMoved = false
            lastT = performance.now()
            velocity = 0
            dir = 0
            rotTween = null // cancel any in-flight snap
            target = rotProxy.current.r
            container.style.cursor = "grabbing"
        }

        const onMove = (e: PointerEvent) => {
            if (!dragging) return
            const now = performance.now()
            const dx = e.clientX - lastX
            const dt = Math.max(now - lastT, 1)

            // Once moved past a small threshold, treat it as a drag (not a tap)
            if (Math.abs(e.clientX - downX) > 6) dragMoved = true

            // Direction-aware 3D tilt: drag right -> +tiltAmount, left -> -tiltAmount
            if (Math.abs(dx) > 1.5) {
                const newDir = dx > 0 ? 1 : -1
                if (newDir !== dir) {
                    dir = newDir
                    setTilt(dir * tiltAmount)
                }
            }

            // Pixels dragged at the arc -> degrees of wheel rotation.
            // Free 1:1 follow while held (no easing) so it tracks the cursor.
            const dDeg = -(dx / radius) * (180 / Math.PI) * sensitivity
            target += dDeg
            const instV = dDeg / (dt / 1000)
            velocity = velocity * 0.6 + instV * 0.4

            rotProxy.current.r = target
            render()

            lastX = e.clientX
            lastT = now
        }

        const onUp = (e: PointerEvent) => {
            if (!dragging) return
            dragging = false
            dir = 0
            container.style.cursor = "grab"
            setTilt(0)

            // Snap to the nearest card slot, nudged by fling velocity (capped
            // at one card) so a quick drag advances one card and stops there.
            const bias = Math.max(-spacing, Math.min(spacing, velocity * 0.08))
            const snapped = Math.round((target + bias) / spacing) * spacing
            target = snapped
            rotTween = {
                from: rotProxy.current.r,
                to: snapped,
                start: performance.now(),
                dur: 600,
            }
            ensureFrame()
        }

        // Block link navigation when the pointer was dragged (not tapped).
        const onClick = (e: MouseEvent) => {
            if (dragMoved) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        container.style.cursor = "grab"
        container.addEventListener("pointerdown", onDown)
        container.addEventListener("click", onClick, true)
        window.addEventListener("pointermove", onMove)
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)

        return () => {
            container.removeEventListener("pointerdown", onDown)
            container.removeEventListener("click", onClick, true)
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
            if (raf != null) cancelAnimationFrame(raf)
        }
    }, [
        count,
        spacing,
        period,
        radius,
        fadeStart,
        fadeEnd,
        sensitivity,
        tiltAmount,
        isStatic,
    ])

    const centerTop = arcOffset + radius

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 320,
                minHeight: 480,
                overflow: "hidden",
                background,
                perspective: 1400,
                touchAction: "pan-y",
                cursor: isStatic ? "default" : "grab",
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: centerTop,
                    width: 0,
                    height: 0,
                    transformStyle: "preserve-3d",
                }}
            >
                {list.map((item, i) => {
                    const theta0 = wrapAngle(i * spacing, period)
                    return (
                        <div
                            key={i}
                            ref={(el) => {
                                cardRefs.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: cardWidth,
                                height: cardHeight,
                                transform: cardTransform(theta0, 0, radius),
                                opacity: cardOpacity(theta0, fadeStart, fadeEnd),
                                zIndex: Math.round(1000 - Math.abs(theta0)),
                                transformStyle: "preserve-3d",
                                willChange: "transform, opacity",
                                backfaceVisibility: "hidden",
                            }}
                        >
                            <a
                                href={resolveHref(item.link)}
                                target={item.newTab ? "_blank" : undefined}
                                rel={
                                    item.newTab
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                draggable={false}
                                aria-label={item.title}
                                style={{
                                    display: "block",
                                    textDecoration: "none",
                                    color: "inherit",
                                    cursor: "inherit",
                                }}
                            >
                            <div
                                style={{
                                    width: "100%",
                                    height: cardHeight - 34,
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    backgroundColor: "#eee",
                                    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
                                }}
                            >
                                <img
                                    src={item.image?.src}
                                    srcSet={item.image?.srcSet}
                                    alt={item.image?.alt ?? item.title}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "baseline",
                                    justifyContent: "space-between",
                                    marginTop: 12,
                                    gap: 8,
                                }}
                            >
                                <span
                                    style={{
                                        color: textColor,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        ...titleFont,
                                    }}
                                >
                                    {item.title}
                                </span>
                                <span style={{ color: mutedColor, ...numberFont }}>
                                    {pad3(i + 1)}
                                </span>
                            </div>
                            </a>
                        </div>
                    )
                })}
            </div>

            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 40,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    pointerEvents: "none",
                    textAlign: "center",
                }}
            >
                <span style={{ color: mutedColor, ...eyebrowFont }}>{eyebrow}</span>
                <span style={{ color: textColor, ...headingFont }}>{heading}</span>
            </div>
        </div>
    )
}

addPropertyControls(ArcCardCarousel, {
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Untitled",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                newTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    hidden: (itemProps: any) => !itemProps.link,
                },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 1450,
        min: 600,
        max: 3000,
        step: 10,
        unit: "px",
    },
    spacing: {
        type: ControlType.Number,
        title: "Card Spacing",
        defaultValue: 10,
        min: 4,
        max: 30,
        step: 0.5,
        unit: "°",
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 250,
        min: 120,
        max: 420,
        unit: "px",
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 372,
        min: 160,
        max: 620,
        unit: "px",
    },
    arcOffset: {
        type: ControlType.Number,
        title: "Arc Offset",
        defaultValue: 230,
        min: 0,
        max: 800,
        unit: "px",
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Drag Speed",
        defaultValue: 1,
        min: 0.2,
        max: 3,
        step: 0.1,
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "3D Tilt (Y)",
        description: "Drag right tilts +, drag left tilts −",
        defaultValue: 20,
        min: 0,
        max: 60,
        unit: "°",
    },
    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "CARD CAROUSEL / DRAG TO EXPLORE",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Move through Movements",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    numberFont: {
        type: ControlType.Font,
        title: "Number Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "13px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.2em",
        },
    },
    eyebrowFont: {
        type: ControlType.Font,
        title: "Eyebrow Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Medium",
            letterSpacing: "0.08em",
            lineHeight: "1em",
        },
    },
    headingFont: {
        type: ControlType.Font,
        title: "Heading Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "26px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#0f172a",
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#9ca3af",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
})
