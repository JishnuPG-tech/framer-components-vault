import { Fragment, useEffect, useRef, useState, startTransition, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Vertical strips per tile: each one is a flat facet of the cylinder.
const SLICES = 16
// Camera distance from the screen, as a multiple of the cylinder's radius.
const CAMERA = 1.6
// A tile is never wider than this share of the component's width.
const MAX_WIDTH = 55
// Overlap between neighbouring strips, in px.
const BLEED = 2

const DEFAULT_IMAGES = [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient 1" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient 2" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient 3" },
    { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient 4" },
    { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient 5" },
]

// Cylinder radius, as a share of the width, that puts the frame's edge `bend` radians round the arc.
function arc(bend: number) {
    return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend))
}

function measure(width: number, height: number, tile: number, aspect: number, gap: number, bend: number) {
    const h = Math.min((tile / 100) * height, ((MAX_WIDTH / 100) * width) / aspect)
    const radius = width * arc(bend)
    if (!(h > 0) || !(radius > 0)) return { columns: 2, sweep: 0, unit: 0, limit: 0 }
    const deg = (rad: number) => (rad * 180) / Math.PI
    const unit = deg(h / radius)
    const pitch = (aspect + gap / 100) * unit
    const limit = deg(bend) + (aspect * unit) / 2
    const columns = Math.min(60, Math.max(2, Math.ceil((2 * limit) / pitch)))
    const round = (n: number) => +n.toFixed(4)
    const sweep = round((columns * pitch) / 2)
    return { columns, sweep, unit: round(unit), limit: round(Math.min(sweep, limit)) }
}

type Layout = ReturnType<typeof measure>

interface ImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface PanoramaCarouselProps {
    items: { image?: ImageValue | null }[]
    speed: number
    direction: "left" | "right"
    autoplay: boolean
    pauseOnHover: boolean
    draggable: boolean
    momentum: number
    scrollEffect: boolean
    scrollBoost: number
    scrollMode: "direction" | "scroll"
    tileHeight: number
    aspectRatio: number
    gap: number
    radius: number | string
    axis: number
    curve: number
    fade: number
    placeholder: string
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PanoramaCarousel(props: PanoramaCarouselProps) {
    const {
        items = [],
        speed = 4,
        direction = "left",
        autoplay = true,
        pauseOnHover = false,
        draggable = false,
        momentum = 0.5,
        scrollEffect = false,
        scrollBoost = 1,
        scrollMode = "direction",
        tileHeight = 30,
        aspectRatio = 1.78,
        gap = 6,
        radius = "12px",
        axis = 50,
        curve = 80,
        fade = 12,
        placeholder = "rgba(128, 128, 128, 0.15)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180
    const reverse = direction === "right"

    const list: PanoramaCarouselProps["items"] = items.length ? items : DEFAULT_IMAGES.map(() => ({}))
    const images: ImageValue[] = list.map((item, i) =>
        item?.image?.src ? item.image : DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]
    )
    const srcKey = images.map((img) => img.src).join("|")

    const [layout, setLayout] = useState<Layout | null>(null)
    // How many times each tile has wrapped round the loop. Picks the image it shows.
    const [laps, setLaps] = useState<number[]>([])
    const [inView, setInView] = useState(true)

    const tileEls = useRef<(HTMLDivElement | null)[]>([])
    const anims = useRef<Animation[]>([])
    // Logical time of the loop in ms, carried over whenever the animations are rebuilt.
    const clock = useRef({ base: 0, time: 0 })
    const lapsRef = useRef<number[]>([])
    const tilePx = useRef(0)
    const flags = useRef({ inView: true, hovered: false, dragging: false, coasting: false, reduced: false, autoplay })

    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            tilePx.current = Math.min((tileHeight / 100) * height, ((MAX_WIDTH / 100) * width) / aspectRatio)
            const next = measure(width, height, tileHeight, aspectRatio, gap, bend)
            startTransition(() =>
                setLayout((prev) =>
                    prev?.columns === next.columns && prev.sweep === next.sweep && prev.unit === next.unit
                        ? prev
                        : next
                )
            )
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [tileHeight, aspectRatio, gap, bend])

    useEffect(() => {
        if (isStatic) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(([entry]) => startTransition(() => setInView(entry.isIntersecting)), {
            threshold: 0.01,
        })
        io.observe(el)
        return () => io.disconnect()
    }, [isStatic])

    // Fetch every image up front, a tile picks up its next one just before it comes back into view.
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        for (const img of images) if (img.src) new window.Image().src = img.src
    }, [srcKey, isStatic])

    const { columns, sweep, unit, limit } = layout ?? measure(1200, 560, tileHeight, aspectRatio, gap, bend)

    // Every length is a multiple of the tile's height.
    const u = (n: number) =>
        `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(MAX_WIDTH / aspectRatio).toFixed(4)}cqw))`

    const r = 100 * arc(bend)
    const radiusCq = `${+r.toFixed(3)}cqw`
    const turn = (deg: number) => `translateZ(${radiusCq}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radiusCq})`

    // Share of the loop, at each end, where a tile is wholly off-screen and hidden.
    const hide = Math.max(0, (sweep - limit) / (2 * sweep || 1))
    // Framer's radius control gives "12px" or "tl tr br bl"; older instances stored a plain number.
    const corners = (() => {
        const parts = String(radius)
            .trim()
            .split(/\s+/)
            .map((p) => parseFloat(p) || 0)
        const [tl = 0, tr = tl, br = tl, bl = tr] = parts
        return { tl, tr, br, bl }
    })()

    const share = aspectRatio / SLICES
    const durMs = columns * speed * 1000
    const stepMs = speed * 1000

    // Auto-scroll speed, 0 to 1. Pauses and restarts ease the speed instead of cutting it, so a hover or the end
    // of a drag hands over smoothly. Only a hand on the row stops it dead; off-screen it truly pauses.
    const rate = useRef({ value: autoplay ? 1 : 0, raf: 0 })
    const setRate = (v: number) => {
        rate.current.value = v
        for (const a of anims.current) a.playbackRate = v
    }
    const syncPlay = () => {
        const f = flags.current
        const r = rate.current
        cancelAnimationFrame(r.raf)
        r.raf = 0
        if (!f.inView) {
            for (const a of anims.current) a.pause()
            return
        }
        for (const a of anims.current) if (a.playState !== "running") a.play()
        if (f.dragging) return setRate(0)
        const target = f.autoplay && !f.hovered && !f.reduced ? 1 : 0
        let last = performance.now()
        const ease = () => {
            const now = performance.now()
            const k = 1 - Math.exp(-(now - last) / 280)
            last = now
            const v = r.value + (target - r.value) * k
            if (Math.abs(target - v) < 0.005) {
                setRate(target)
                r.raf = 0
            } else {
                setRate(v)
                r.raf = requestAnimationFrame(ease)
            }
        }
        if (r.value !== target) r.raf = requestAnimationFrame(ease)
        else setRate(target)
    }

    // One animation per tile, all on the same clock: tile t runs t steps ahead. Rebuilt when the loop changes,
    // starting from the time the previous build had reached, so nothing jumps.
    useEffect(() => {
        if (isStatic || !(sweep > 0)) return
        const els = tileEls.current.slice(0, columns)
        if (els.length < columns || els.some((el) => !el || typeof el.animate !== "function")) return
        flags.current.reduced =
            typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

        const at = (o: number) => turn(-sweep + 2 * sweep * o)
        const e = 0.00001
        const stops: [number, string][] = [
            [0, "hidden"],
            [hide, "hidden"],
            [Math.min(hide + e, 0.5), "visible"],
            [Math.max(1 - hide - e, 0.5), "visible"],
            [1 - hide, "hidden"],
            [1, "hidden"],
        ]
        const frames = stops.map(([offset, visibility]) => ({ offset, transform: at(offset), visibility }))
        // A large base keeps currentTime positive however far back the row is dragged.
        const base = durMs * 10000
        clock.current.base = base
        anims.current = els.map((el, t) => {
            const a = el!.animate(frames, {
                duration: durMs,
                iterations: Infinity,
                easing: "linear",
                direction: reverse ? "reverse" : "normal",
            })
            a.currentTime = base + clock.current.time + t * stepMs
            a.playbackRate = rate.current.value
            return a
        })
        syncPlay()

        return () => {
            const lead = anims.current[0]
            if (lead) clock.current.time = Number(lead.currentTime ?? 0) - clock.current.base
            for (const a of anims.current) a.cancel()
            anims.current = []
        }
    }, [isStatic, columns, durMs, stepMs, reverse, sweep, hide, radiusCq])

    useEffect(() => {
        flags.current.inView = inView
        syncPlay()
    }, [inView])

    useEffect(() => {
        flags.current.autoplay = autoplay
        syncPlay()
    }, [autoplay])

    useEffect(() => () => cancelAnimationFrame(rate.current.raf), [])

    // Follows each tile's position to hand it its next image when it wraps, out of sight, in either direction.
    useEffect(() => {
        if (isStatic || !inView) return
        let raf = 0
        const loop = () => {
            const list = anims.current
            if (list.length) {
                const base = clock.current.base
                const next = list.map((a) => Math.floor((Number(a.currentTime ?? 0) - base) / durMs))
                const prev = lapsRef.current
                if (next.length !== prev.length || next.some((v, i) => v !== prev[i])) {
                    lapsRef.current = next
                    startTransition(() => setLaps(next))
                }
            }
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, inView, durMs])

    // Moves the whole row by dx screen pixels, measured at the centre of the arc.
    const shift = (dx: number) => {
        const pitchPx = (aspectRatio + gap / 100) * tilePx.current
        if (!(pitchPx > 0)) return
        const ms = ((reverse ? dx : -dx) * stepMs) / pitchPx
        for (const a of anims.current) a.currentTime = Number(a.currentTime ?? 0) + ms
    }

    // Page scroll pushes the row like a drag: down along the set direction, up against it. The push is eased
    // over a few frames so wheel steps glide instead of jumping; the auto-scroll carries on underneath.
    useEffect(() => {
        if (isStatic || !scrollEffect || typeof window === "undefined") return
        let y = window.scrollY
        let pending = 0
        let raf = 0
        const glide = () => {
            const step = pending * 0.18
            pending -= step
            shift(reverse ? step : -step)
            if (Math.abs(pending) > 0.5) raf = requestAnimationFrame(glide)
            else {
                shift(reverse ? pending : -pending)
                pending = 0
                raf = 0
            }
        }
        const onScroll = () => {
            const next = window.scrollY
            const dy = next - y
            y = next
            if (!dy || !flags.current.inView) return
            pending += (scrollMode === "scroll" ? dy : Math.abs(dy)) * scrollBoost
            if (!raf) raf = requestAnimationFrame(glide)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("scroll", onScroll)
            cancelAnimationFrame(raf)
        }
    }, [isStatic, scrollEffect, scrollBoost, scrollMode, reverse, aspectRatio, gap, stepMs])

    const drag = useRef({ id: -1, x: 0, t: 0, v: 0, raf: 0 })

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!draggable || isStatic || (e.pointerType === "mouse" && e.button !== 0)) return
        const d = drag.current
        cancelAnimationFrame(d.raf)
        d.id = e.pointerId
        d.x = e.clientX
        d.t = performance.now()
        d.v = 0
        flags.current.dragging = true
        flags.current.coasting = false
        syncPlay()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        e.currentTarget.style.cursor = "grabbing"
    }

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!flags.current.dragging || e.pointerId !== d.id) return
        const now = performance.now()
        const dx = e.clientX - d.x
        const dt = Math.max(1, now - d.t)
        shift(dx)
        d.v = 0.8 * d.v + 0.2 * (dx / dt)
        d.x = e.clientX
        d.t = now
    }

    const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = drag.current
        if (!flags.current.dragging || e.pointerId !== d.id) return
        flags.current.dragging = false
        d.id = -1
        e.currentTarget.style.cursor = "grab"
        // The auto-scroll eases back in straight away; a throw glides on top of it and fades into it.
        syncPlay()
        // A pause before letting go means no throw.
        let v = performance.now() - d.t > 80 ? 0 : d.v
        if (momentum > 0 && Math.abs(v) > 0.05) {
            flags.current.coasting = true
            const friction = 0.86 + 0.12 * Math.min(1, momentum)
            let last = performance.now()
            const coast = () => {
                const now = performance.now()
                const dt = now - last
                last = now
                shift(v * dt)
                v *= Math.pow(friction, dt / 16.67)
                if (Math.abs(v) > 0.01 && flags.current.coasting) d.raf = requestAnimationFrame(coast)
                else flags.current.coasting = false
            }
            d.raf = requestAnimationFrame(coast)
        }
    }

    useEffect(() => () => cancelAnimationFrame(drag.current.raf), [])

    const onPointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!pauseOnHover || e.pointerType !== "mouse") return
        flags.current.hovered = true
        syncPlay()
    }

    const onPointerLeave = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!flags.current.hovered) return
        flags.current.hovered = false
        syncPlay()
    }

    useEffect(() => {
        if (!pauseOnHover && flags.current.hovered) {
            flags.current.hovered = false
            syncPlay()
        }
    }, [pauseOnHover])

    const live = !isStatic
    const canDrag = live && draggable
    // Fully transparent for the last 2px on each side, so a scaled canvas can't leave an unmasked pixel column.
    const mask = `linear-gradient(90deg,transparent 2px,#000 ${fade}%,#000 ${100 - fade}%,transparent calc(100% - 2px))`

    return (
        <div
            ref={ref}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                containerType: "size",
                cursor: canDrag ? "grab" : undefined,
                // Vertical swipes still scroll the page, horizontal ones drag the row.
                touchAction: canDrag ? "pan-y" : undefined,
                userSelect: canDrag ? "none" : undefined,
                WebkitUserSelect: canDrag ? "none" : undefined,
            } as CSSProperties}
            onPointerDown={canDrag ? onPointerDown : undefined}
            onPointerMove={canDrag ? onPointerMove : undefined}
            onPointerUp={canDrag ? onPointerUp : undefined}
            onPointerCancel={canDrag ? onPointerUp : undefined}
            onPointerEnter={live && pauseOnHover ? onPointerEnter : undefined}
            onPointerLeave={live && pauseOnHover ? onPointerLeave : undefined}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    opacity: layout || isStatic ? 1 : 0,
                    transition: isStatic ? "none" : "opacity 0.5s ease",
                    perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
                    perspectiveOrigin: `50% ${axis}%`,
                    maskImage: mask,
                    WebkitMaskImage: mask,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskSize: "100% 100%",
                    WebkitMaskSize: "100% 100%",
                }}
            >
                {Array.from({ length: columns }, (_, t) => {
                    // Numbers tiles in the order they come on screen.
                    const first = reverse ? t : columns - 1 - t
                    const n = Math.max(images.length, 1)
                    const img = images[((((laps[t] ?? 0) * columns + first) % n) + n) % n]

                    // `base` is where the strips' common centre sits: the tile's own box when nested, or the tile's
                    // centre in the band when laid flat. Each strip is turned round the axis by `offset` more degrees.
                    const strips = (base: string, offset: number) =>
                        Array.from({ length: SLICES }, (_, k) => {
                            const isFirst = k === 0
                            const isLast = k === SLICES - 1
                            return (
                                <div
                                    key={k}
                                    style={{
                                        position: "absolute",
                                        top: isStatic ? `calc(${axis}% - ${u(0.5)})` : 0,
                                        overflow: "hidden",
                                        background: placeholder,
                                        borderTopLeftRadius: isFirst ? corners.tl : 0,
                                        borderBottomLeftRadius: isFirst ? corners.bl : 0,
                                        borderTopRightRadius: isLast ? corners.tr : 0,
                                        borderBottomRightRadius: isLast ? corners.br : 0,
                                        // Inner edges reach BLEED px under the neighbouring facets, so no hairline opens between them.
                                        left: `calc(${base} - ${isFirst ? 0 : BLEED}px)`,
                                        width: `calc(${u(share)} + ${(isFirst ? 0 : BLEED) + (isLast ? 0 : BLEED)}px)`,
                                        height: u(1),
                                        transform: turn(offset + (aspectRatio / 2 - (k + 0.5) * share) * unit),
                                    }}
                                >
                                    {img?.src ? (
                                        <img
                                            src={img.src}
                                            alt={isFirst ? img.alt ?? "" : ""}
                                            draggable={false}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                maxWidth: "none",
                                                objectFit: "cover",
                                                left: `calc(${u(-k * share)} + ${isFirst ? 0 : BLEED}px)`,
                                                width: u(aspectRatio),
                                                height: u(1),
                                            }}
                                        />
                                    ) : null}
                                </div>
                            )
                        })

                    // Static: no tile wrapper and no preserve-3d, every strip sits flat in the band with its full
                    // angle. Same picture, but the canvas has no 3D sorting to get wrong.
                    if (isStatic) {
                        const p = t / columns
                        const angle = reverse ? sweep - 2 * sweep * p : -sweep + 2 * sweep * p
                        if (Math.abs(angle) > limit) return null
                        return <Fragment key={t}>{strips(`50% - ${u(share / 2)}`, angle)}</Fragment>
                    }

                    return (
                        <div
                            key={t}
                            ref={(el) => {
                                tileEls.current[t] = el
                            }}
                            style={{
                                position: "absolute",
                                left: `calc(50% - ${u(aspectRatio / 2)})`,
                                top: `calc(${axis}% - ${u(0.5)})`,
                                width: u(aspectRatio),
                                height: u(1),
                                transformStyle: "preserve-3d",
                                // Hidden until its animation takes over.
                                visibility: "hidden",
                            }}
                        >
                            {strips(u((aspectRatio - share) / 2), 0)}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

PanoramaCarousel.displayName = "Panorama Carousel"

addPropertyControls(PanoramaCarousel, {
    items: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: [{}, {}, {}, {}, {}],
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    speed: {
        type: ControlType.Number,
        title: "Duration",
        description: "Seconds for the row to advance by one image.",
        defaultValue: 4,
        min: 0.5,
        max: 20,
        step: 0.1,
        unit: "s",
        hidden: (p: Partial<PanoramaCarouselProps>) => p.autoplay === false,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Hover Pause",
        defaultValue: false,
        hidden: (p: Partial<PanoramaCarouselProps>) => p.autoplay === false,
    },
    draggable: {
        type: ControlType.Boolean,
        title: "Draggable",
        defaultValue: false,
    },
    momentum: {
        type: ControlType.Number,
        title: "Momentum",
        description: "How far the row keeps gliding after a throw.",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p: Partial<PanoramaCarouselProps>) => !p.draggable,
    },
    scrollEffect: {
        type: ControlType.Boolean,
        title: "Scroll Effect",
        description: "Scrolling the page pushes the row forward.",
        defaultValue: false,
    },
    scrollMode: {
        type: ControlType.Enum,
        title: "Push",
        description: "Always along Direction, or following the scroll (up reverses).",
        options: ["direction", "scroll"],
        optionTitles: ["Direction", "Scroll"],
        defaultValue: "direction",
        displaySegmentedControl: true,
        hidden: (p: Partial<PanoramaCarouselProps>) => !p.scrollEffect,
    },
    scrollBoost: {
        type: ControlType.Number,
        title: "Strength",
        description: "How far the row moves per pixel scrolled.",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        hidden: (p: Partial<PanoramaCarouselProps>) => !p.scrollEffect,
    },
    curve: {
        type: ControlType.Number,
        title: "Curve",
        description: "How hard the ends bend toward the viewer.",
        defaultValue: 80,
        min: 5,
        max: 85,
        step: 1,
        unit: "°",
    },
    tileHeight: {
        type: ControlType.Number,
        title: "Size",
        description: "Image height, as a share of the component’s height.",
        defaultValue: 30,
        min: 5,
        max: 100,
        step: 1,
        unit: "%",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Ratio",
        description: "Image width divided by height (1.78 = 16:9).",
        defaultValue: 1.78,
        min: 0.4,
        max: 3,
        step: 0.01,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        description: "Space between images, as a share of their height.",
        defaultValue: 6,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "12px",
    },
    axis: {
        type: ControlType.Number,
        title: "Vertical Pos.",
        description: "Vertical centre of the row.",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    fade: {
        type: ControlType.Number,
        title: "Edge Fade",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "%",
    },
    placeholder: {
        type: ControlType.Color,
        title: "Placeholder",
        defaultValue: "rgba(128, 128, 128, 0.15)",
    },
})
