/**
 * Made with 💛 by Karim Saif
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
"use client"

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


type Effect =
    | "flame"
    | "venetian"
    | "curtain"
    | "hexagon"
    | "liquid"
    | "zoomsplit"
type Props = {
    images: string[]
    effect: Effect
    backgroundColor: string
    minSize: number
    maxSize: number
    spacing: number
    lifespan: number
    inDuration: number
    outDuration: number
    stagger: number
    rotation: number
    maxItems: number
    borderRadius: number
    speedInfluence: number
    disabled: boolean
    style?: React.CSSProperties
}
type Piece = {
    node: HTMLDivElement
    hidden: string
    shown: string
    delay: number
}
type Trail = {
    node: HTMLDivElement
    pieces: Piece[]
    effect: Effect
    angle: number
    expiry: number
    exiting: boolean
    timers: Set<number>
}

const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=500&q=80",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=500&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80",
]
const IN_EASE = "cubic-bezier(.07,.5,.5,1)"
const OUT_EASE = "cubic-bezier(.87,0,.13,1)"
const clamp = (n: number, a: number, b: number) =>
    Math.min(b, Math.max(a, Number.isFinite(n) ? n : a))

function createPieces(
    url: string,
    effect: Effect,
    duration: number,
    stagger: number
): Piece[] {
    const pieces: Piece[] = []
    const add = (hidden: string, shown: string, delay: number) => {
        const node = document.createElement("div")
        Object.assign(node.style, {
            position: "absolute",
            inset: "0",
            pointerEvents: "none",
            backgroundImage: `url(${JSON.stringify(url)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            clipPath: hidden,
            transition: `clip-path ${duration}ms ${OUT_EASE}`,
        })
        pieces.push({ node, hidden, shown, delay: Math.max(0, delay) })
    }
    if (effect === "venetian") {
        for (let i = 0; i < 12; i++) {
            const y = (i * 100) / 12,
                end = ((i + 1) * 100) / 12
            add(
                `polygon(0% ${y}%,100% ${y}%,100% ${y}%,0% ${y}%)`,
                `polygon(0% ${y}%,100% ${y}%,100% ${end}%,0% ${end}%)`,
                Math.abs(i - 5.5) * stagger * 0.16
            )
        }
    } else if (effect === "curtain") {
        for (let i = 0; i < 10; i++) {
            const x = i * 10,
                end = x + 10,
                mid = x + 5
            add(
                `polygon(${mid}% 0%,${mid}% 0%,${mid}% 100%,${mid}% 100%)`,
                `polygon(${x}% 0%,${end}% 0%,${end}% 100%,${x}% 100%)`,
                i * stagger * 0.1
            )
        }
    } else if (effect === "hexagon") {
        const hexes = [
            [50, 50, 25],
            [25, 25, 20],
            [75, 25, 20],
            [85, 50, 20],
            [75, 75, 20],
            [25, 75, 20],
            [15, 50, 20],
        ]
        hexes.forEach(([x, y, r], i) => {
            const points = Array.from({ length: 6 }, (_, k) => {
                const a = ((k * 60 - 30) * Math.PI) / 180
                return `${x + Math.cos(a) * r}% ${y + Math.sin(a) * r}%`
            }).join(",")
            add(
                `polygon(${Array(6).fill(`${x}% ${y}%`).join(",")})`,
                `polygon(${points})`,
                i * stagger * 0.15
            )
        })
    } else if (effect === "liquid") {
        const drops = [
            [25, 20, 27],
            [70, 15, 26],
            [45, 35, 32],
            [15, 55, 27],
            [80, 45, 30],
            [55, 70, 34],
            [30, 80, 26],
            [75, 75, 29],
        ]
        drops.forEach(([x, y, r], i) =>
            add(
                `circle(0% at ${x}% ${y}%)`,
                `circle(${r}% at ${x}% ${y}%)`,
                i * stagger * 0.12
            )
        )
    } else if (effect === "zoomsplit") {
        for (let row = 0; row < 3; row++)
            for (let col = 0; col < 3; col++) {
                const x = (col * 100) / 3,
                    y = (row * 100) / 3,
                    x2 = ((col + 1) * 100) / 3,
                    y2 = ((row + 1) * 100) / 3
                const cx = (x + x2) / 2,
                    cy = (y + y2) / 2
                add(
                    `polygon(${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%,${cx}% ${cy}%)`,
                    `polygon(${x}% ${y}%,${x2}% ${y}%,${x2}% ${y2}%,${x}% ${y2}%)`,
                    Math.hypot(col - 1, row - 1) * stagger * 0.5
                )
            }
    }
    return pieces
}

export default function KarimSaifImageTrailEffects(props: Props) {
    const {
        images = DEFAULT_IMAGES,
        effect = "flame",
        backgroundColor = "#111111",
        minSize = 120,
        maxSize = 240,
        spacing = 40,
        lifespan = 900,
        inDuration = 500,
        outDuration = 600,
        stagger = 50,
        rotation = 30,
        maxItems = 12,
        borderRadius = 4,
        speedInfluence = 1,
        disabled = false,
        style,
    } = props
    const staticRender = useIsStaticRenderer()
    const reducedMotion = useReducedMotion()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const configRef = React.useRef(props)
    configRef.current = props
    const validImages = React.useMemo(
        () =>
            (Array.isArray(images) ? images : []).filter(
                (v): v is string => typeof v === "string" && v.trim().length > 0
            ),
        [images]
    )
    const imageRef = React.useRef(validImages)
    imageRef.current = validImages
    const still = staticRender || Boolean(reducedMotion) || disabled

    React.useEffect(() => {
        if (typeof window === "undefined" || !validImages.length) return
        const preload: HTMLImageElement[] = []
        validImages.forEach((url) => {
            const img = new Image()
            img.decoding = "async"
            img.src = url
            preload.push(img)
        })
        return () => {
            preload.length = 0
        }
    }, [validImages])

    React.useEffect(() => {
        const root = rootRef.current
        if (
            !root ||
            still ||
            !validImages.length ||
            typeof window === "undefined"
        )
            return
        let disposed = false,
            inView = true,
            raf = 0,
            lastX = NaN,
            lastY = NaN,
            lastTime = 0,
            imageIndex = 0
        const trails: Trail[] = []
        const timers = new Set<number>()
        const schedule = (fn: () => void, ms: number, item?: Trail) => {
            if (disposed) return
            const id = window.setTimeout(
                () => {
                    timers.delete(id)
                    item?.timers.delete(id)
                    if (!disposed) fn()
                },
                Math.max(0, ms)
            )
            timers.add(id)
            item?.timers.add(id)
        }
        const cancelItemTimers = (item: Trail) => {
            item.timers.forEach((id) => {
                clearTimeout(id)
                timers.delete(id)
            })
            item.timers.clear()
        }
        const remove = (item: Trail) => {
            cancelItemTimers(item)
            const index = trails.indexOf(item)
            if (index >= 0) trails.splice(index, 1)
            item.node.remove()
        }
        const clear = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            trails.slice().forEach(remove)
            timers.forEach(clearTimeout)
            timers.clear()
            lastX = NaN
            lastY = NaN
            lastTime = 0
        }
        const exit = (item: Trail) => {
            if (item.exiting) return
            item.exiting = true
            cancelItemTimers(item)
            const duration = clamp(
                configRef.current.outDuration ?? 600,
                100,
                3000
            )
            item.node.style.transition = `transform ${duration}ms ${OUT_EASE},opacity ${duration}ms ease`
            if (item.effect === "flame") {
                item.node.style.transform = `translate(-50%,-50%) rotate(${item.angle + 360}deg) scale(0)`
            } else {
                item.node.style.transform = "translate(-50%,-50%) scale(.4)"
                item.pieces.forEach((piece) => {
                    piece.node.style.transition = `clip-path ${duration}ms ${OUT_EASE}`
                    schedule(
                        () => {
                            if (piece.node.isConnected)
                                piece.node.style.clipPath = piece.hidden
                        },
                        piece.delay,
                        item
                    )
                })
            }
            item.node.style.opacity = "0"
            const delay = item.pieces.reduce((m, p) => Math.max(m, p.delay), 0)
            schedule(() => remove(item), duration + delay + 100, item)
        }
        const tick = (now: number) => {
            raf = 0
            if (disposed || !inView || document.hidden) return
            trails.slice().forEach((item) => {
                if (!item.exiting && now >= item.expiry) exit(item)
            })
            if (trails.some((item) => !item.exiting))
                raf = requestAnimationFrame(tick)
        }
        const startTick = () => {
            if (!raf && !disposed && inView && !document.hidden)
                raf = requestAnimationFrame(tick)
        }
        const onMove = (event: PointerEvent) => {
            if (
                disposed ||
                !inView ||
                document.hidden ||
                event.pointerType === "touch"
            )
                return
            const rect = root.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            const x = event.clientX - rect.left,
                y = event.clientY - rect.top
            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                lastX = NaN
                return
            }
            const now = performance.now(),
                p = configRef.current
            const dist = Number.isFinite(lastX)
                ? Math.hypot(x - lastX, y - lastY)
                : Infinity
            if (dist < clamp(p.spacing ?? 40, 8, 200) || now - lastTime < 32)
                return
            const speed = Number.isFinite(dist)
                ? clamp(dist / Math.max(16, now - lastTime) / 2, 0, 1)
                : 0
            lastX = x
            lastY = y
            lastTime = now
            const urls = imageRef.current
            if (!urls.length) return
            const src = urls[imageIndex++ % urls.length]
            const lo = clamp(p.minSize ?? 120, 30, 500),
                hi = Math.max(lo, clamp(p.maxSize ?? 240, 30, 600))
            const size =
                lo +
                (hi - lo) *
                    clamp(speed * clamp(p.speedInfluence ?? 1, 0, 3), 0, 1)
            const currentEffect = p.effect ?? "flame"
            const angle =
                currentEffect === "flame"
                    ? (Math.random() - 0.5) *
                      clamp(p.rotation ?? 30, 0, 180) *
                      (1 + speed * 2)
                    : 0
            const duration = clamp(p.inDuration ?? 500, 100, 3000)
            const pieces = createPieces(
                src,
                currentEffect,
                duration,
                clamp(p.stagger ?? 50, 0, 200)
            )
            const node = document.createElement("div")
            Object.assign(node.style, {
                position: "absolute",
                left: `${x}px`,
                top: `${y}px`,
                width: `${size}px`,
                height: `${size}px`,
                pointerEvents: "none",
                overflow: "hidden",
                borderRadius: `${clamp(p.borderRadius ?? 4, 0, 100)}px`,
                transform: `translate(-50%,-50%) rotate(${angle}deg) scale(0)`,
                opacity: "1",
                transition: `transform ${duration}ms ${IN_EASE}`,
                willChange: "transform",
            })
            if (currentEffect === "flame") {
                node.style.backgroundImage = `url(${JSON.stringify(src)})`
                node.style.backgroundSize = "cover"
                node.style.backgroundPosition = "center"
            } else pieces.forEach((piece) => node.appendChild(piece.node))
            root.appendChild(node)
            const maxDelay = pieces.reduce(
                (m, piece) => Math.max(m, piece.delay),
                0
            )
            const item: Trail = {
                node,
                pieces,
                effect: currentEffect,
                angle,
                exiting: false,
                timers: new Set<number>(),
                expiry:
                    now +
                    duration +
                    maxDelay +
                    clamp(p.lifespan ?? 900, 100, 5000),
            }
            trails.push(item)
            const limit = Math.min(
                24,
                Math.round(clamp(p.maxItems ?? 12, 1, 40))
            )
            while (trails.length > limit) remove(trails[0])
            if (!node.isConnected) return
            node.getBoundingClientRect()
            node.style.transform = `translate(-50%,-50%) rotate(${angle}deg) scale(1)`
            pieces.forEach((piece) =>
                schedule(
                    () => {
                        if (piece.node.isConnected && !item.exiting)
                            piece.node.style.clipPath = piece.shown
                    },
                    piece.delay + 16,
                    item
                )
            )
            startTick()
        }
        const onLeave = () => {
            lastX = NaN
            lastY = NaN
        }
        const onVisibility = () => {
            if (document.hidden) clear()
        }
        const observer =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          inView = entries[0]?.isIntersecting ?? false
                          if (!inView) clear()
                      },
                      { threshold: 0 }
                  )
                : null
        observer?.observe(root)
        root.addEventListener("pointermove", onMove, { passive: true })
        root.addEventListener("pointerleave", onLeave)
        document.addEventListener("visibilitychange", onVisibility)
        return () => {
            disposed = true
            observer?.disconnect()
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            document.removeEventListener("visibilitychange", onVisibility)
            clear()
        }
    }, [still, validImages.length])

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                isolation: "isolate",
            }}
        >
            {still &&
                validImages.slice(0, 3).map((src, i) => (
                    <img
                        key={`${i}-${src}`}
                        src={src}
                        alt=""
                        draggable={false}
                        style={{
                            position: "absolute",
                            width: "min(32%,180px)",
                            aspectRatio: "1",
                            objectFit: "cover",
                            borderRadius,
                            left: `${38 + i * 12}%`,
                            top: `${42 + i * 7}%`,
                            transform: `translate(-50%,-50%) rotate(${(i - 1) * 14}deg)`,
                            pointerEvents: "none",
                            boxShadow: "0 12px 28px #0003",
                        }}
                    />
                ))}
        </div>
    )
}

KarimSaifImageTrailEffects.defaultProps = {
    images: DEFAULT_IMAGES,
    effect: "flame",
    backgroundColor: "#111111",
    minSize: 120,
    maxSize: 240,
    spacing: 40,
    lifespan: 900,
    inDuration: 500,
    outDuration: 600,
    stagger: 50,
    rotation: 30,
    maxItems: 12,
    borderRadius: 4,
    speedInfluence: 1,
    disabled: false,
}

addPropertyControls(KarimSaifImageTrailEffects, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description:
            "Upload up to 20 images that cycle through the cursor trail.",
        control: { type: ControlType.Image, title: "Image" },
        maxCount: 20,
        defaultValue: DEFAULT_IMAGES,
    },
    effect: {
        type: ControlType.Enum,
        title: "Effect",
        description: "Choose one of six cursor image reveal styles.",
        options: [
            "flame",
            "venetian",
            "curtain",
            "hexagon",
            "liquid",
            "zoomsplit",
        ],
        optionTitles: [
            "Flame",
            "Venetian",
            "Curtain",
            "Hexagon",
            "Liquid",
            "Zoom Split",
        ],
        defaultValue: "flame",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the interactive area.",
        defaultValue: "#111111",
    },
    minSize: {
        type: ControlType.Number,
        title: "Min Size",
        description: "Minimum image size at low cursor speed.",
        min: 30,
        max: 500,
        step: 1,
        unit: "px",
        defaultValue: 120,
    },
    maxSize: {
        type: ControlType.Number,
        title: "Max Size",
        description: "Maximum image size at high cursor speed.",
        min: 30,
        max: 600,
        step: 1,
        unit: "px",
        defaultValue: 240,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        description: "Minimum pointer travel between successive images.",
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 40,
    },
    lifespan: {
        type: ControlType.Number,
        title: "Hold Time",
        description: "Time each image stays after its reveal completes.",
        min: 100,
        max: 5000,
        step: 50,
        unit: "ms",
        defaultValue: 900,
    },
    inDuration: {
        type: ControlType.Number,
        title: "Reveal",
        description: "Duration of the entrance and fragment reveal animations.",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 500,
    },
    outDuration: {
        type: ControlType.Number,
        title: "Exit",
        description: "Duration of the image exit animation.",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 600,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Delay spacing between individual fragments.",
        min: 0,
        max: 200,
        step: 5,
        unit: "ms",
        defaultValue: 50,
        hidden: (p) => p.effect === "flame",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        description: "Random rotation intensity for Flame images.",
        min: 0,
        max: 180,
        step: 1,
        unit: "°",
        defaultValue: 30,
        hidden: (p) => p.effect !== "flame",
    },
    maxItems: {
        type: ControlType.Number,
        title: "Max Images",
        description:
            "Maximum simultaneously retained images; capped internally at 24 for performance.",
        min: 1,
        max: 24,
        step: 1,
        defaultValue: 12,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corners",
        description: "Corner radius for each trail image.",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 4,
    },
    speedInfluence: {
        type: ControlType.Number,
        title: "Speed Scale",
        description: "How much pointer speed affects image size.",
        min: 0,
        max: 3,
        step: 0.1,
        defaultValue: 1,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
        defaultValue: false,
    },
})
