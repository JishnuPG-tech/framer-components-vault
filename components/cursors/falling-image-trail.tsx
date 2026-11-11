import { useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Inline gradient shapes so the component ships looking right before any
// images are chosen. No external request, and drawn on a transparent ground so
// each drop reads as a shape rather than a rectangle.
const shape = (from: string, to: string, body: string) =>
    "data:image/svg+xml," +
    encodeURIComponent(
        "<svg xmlns='http://www.w3.org/2000/svg' width='170' height='210' viewBox='0 0 170 210'>" +
            "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
            "<stop offset='0' stop-color='" +
            from +
            "'/><stop offset='1' stop-color='" +
            to +
            "'/></linearGradient></defs>" +
            body +
            "</svg>"
    )

const PLACEHOLDERS = [
    shape(
        "#FFD694",
        "#FF965C",
        "<rect x='12' y='22' width='146' height='166' rx='26' fill='url(#g)'/>"
    ),
    shape(
        "#FFA2A2",
        "#F06E84",
        "<circle cx='85' cy='105' r='74' fill='url(#g)'/>"
    ),
    shape(
        "#C6AAFF",
        "#9678F6",
        "<rect x='10' y='58' width='150' height='94' rx='47' fill='url(#g)'/>"
    ),
    shape(
        "#A0BCFF",
        "#6C8CF6",
        "<rect x='24' y='12' width='122' height='186' rx='18' fill='url(#g)'/>"
    ),
    shape(
        "#8AECD4",
        "#4EC8B2",
        "<circle cx='85' cy='105' r='58' fill='url(#g)'/>"
    ),
    shape(
        "#C6F096",
        "#96D65A",
        "<rect x='8' y='70' width='154' height='70' rx='35' fill='url(#g)'/>"
    ),
]

type ExitMode = "fall" | "fade"
type ImageValue = string | { src?: string; alt?: string }

interface ImageTrailProps {
    images: ImageValue[]
    imageWidth: number
    imageHeight: number
    cornerRadius: number
    spawnDistance: number
    trailLength: number
    exit: ExitMode
    duration: number
    spin: number
    bounce: number
}

/**
 * Image Trail - drops a run of images or shapes along the cursor's path. Each
 * one pops in, takes a random spin, then falls away off the bottom edge.
 *
 * Pointer handling is on the element itself, so nothing listens while the
 * cursor is elsewhere on the page. Drops reuse a fixed pool of nodes, and the
 * motion runs on the Web Animations API, so no animation library is needed.
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ImageTrail(props: ImageTrailProps) {
    const {
        images,
        imageWidth,
        imageHeight,
        cornerRadius,
        spawnDistance,
        trailLength,
        exit,
        duration,
        spin,
        bounce,
    } = props

    const isStatic = useIsStaticRenderer()
    const outerRefs = useRef<(HTMLDivElement | null)[]>([])
    const innerRefs = useRef<(HTMLDivElement | null)[]>([])
    const nextSlot = useRef(0)
    const lastPoint = useRef<{ x: number; y: number } | null>(null)
    const rectRef = useRef<DOMRect | null>(null)

    const chosen = (images || [])
        .map((value) => {
            if (!value) return null
            return typeof value === "string" ? value : value.src || null
        })
        .filter(Boolean) as string[]

    const sources = chosen.length > 0 ? chosen : PLACEHOLDERS

    const poolSize = Math.max(1, Math.min(trailLength, 24))
    const pool = Array.from({ length: poolSize })

    const onEnter = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return
        rectRef.current = event.currentTarget.getBoundingClientRect()
        lastPoint.current = null
    }

    const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return

        const rect =
            rectRef.current ||
            (rectRef.current = event.currentTarget.getBoundingClientRect())

        const x = event.clientX - rect.left
        const y = event.clientY - rect.top

        // Only drop once the cursor has travelled far enough.
        const previous = lastPoint.current
        if (previous) {
            const dx = x - previous.x
            const dy = y - previous.y
            if (Math.sqrt(dx * dx + dy * dy) < spawnDistance) return
        }
        lastPoint.current = { x, y }

        const index = nextSlot.current
        nextSlot.current = (index + 1) % poolSize
        const outer = outerRefs.current[index]
        const inner = innerRefs.current[index]
        if (!outer || !inner) return

        outer.style.left = `${x}px`
        outer.style.top = `${y}px`

        // A random turn, the way the reference effect does it.
        const turn = (Math.random() * 2 - 1) * spin
        const ms = duration * 1000

        // Overshoot on the way in, scaled by the bounce control.
        const over = 1 + 0.22 * bounce
        const under = 1 - 0.06 * bounce

        outer.getAnimations().forEach((a) => a.cancel())
        inner.getAnimations().forEach((a) => a.cancel())

        // The outer element carries the exit, so gravity can ease independently
        // of the pop-in running on the inner element at the same time.
        if (exit === "fall") {
            // Far enough to clear the bottom edge from wherever it landed.
            const drop = rect.height - y + imageHeight
            outer.animate(
                [
                    { transform: "translateY(0px)" },
                    { transform: `translateY(${drop}px)` },
                ],
                {
                    duration: ms,
                    easing: "cubic-bezier(0.36, 0, 0.66, -0.25)",
                    fill: "forwards",
                }
            )
        } else {
            outer.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: ms,
                easing: "cubic-bezier(0.4, 0, 1, 1)",
                fill: "forwards",
            })
        }

        inner.animate(
            [
                { opacity: 0, transform: "scale(0) rotate(0deg)", offset: 0 },
                {
                    opacity: 1,
                    transform: `scale(${over}) rotate(${turn * 0.12}deg)`,
                    offset: 0.16,
                },
                {
                    opacity: 1,
                    transform: `scale(${under}) rotate(${turn * 0.26}deg)`,
                    offset: 0.28,
                },
                {
                    opacity: 1,
                    transform: `scale(1) rotate(${turn}deg)`,
                    offset: 1,
                },
            ],
            { duration: ms, easing: "ease-out", fill: "forwards" }
        )
    }

    const onLeave = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStatic || event.pointerType !== "mouse") return
        rectRef.current = null
        lastPoint.current = null
    }

    return (
        <div
            onPointerEnter={onEnter}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {pool.map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        outerRefs.current[i] = el
                    }}
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: imageWidth,
                        height: imageHeight,
                        marginLeft: -imageWidth / 2,
                        marginTop: -imageHeight / 2,
                        pointerEvents: "none",
                        willChange: "transform",
                    }}
                >
                    <div
                        ref={(el) => {
                            innerRefs.current[i] = el
                        }}
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: cornerRadius,
                            overflow: "hidden",
                            opacity: 0,
                            willChange: "transform, opacity",
                            backgroundImage: `url("${sources[i % sources.length]}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />
                </div>
            ))}
        </div>
    )
}

ImageTrail.displayName = "Falling Image Trail"

addPropertyControls(ImageTrail, {
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Leave empty to use the built-in gradient shapes.",
        control: { type: ControlType.ResponsiveImage },
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 170,
        min: 20,
        max: 600,
        step: 5,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 210,
        min: 20,
        max: 600,
        step: 5,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        description: "Leave at 0 when using the built-in shapes.",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    spawnDistance: {
        type: ControlType.Number,
        title: "Spacing",
        description: "How far the cursor travels before the next drop.",
        defaultValue: 90,
        min: 10,
        max: 400,
        step: 5,
        unit: "px",
    },
    trailLength: {
        type: ControlType.Number,
        title: "Trail Length",
        description: "How many drops can be in flight at once.",
        defaultValue: 12,
        min: 1,
        max: 24,
        step: 1,
    },
    exit: {
        type: ControlType.Enum,
        title: "Exit",
        description:
            "Fall drops each one off the bottom edge. Fade leaves it in place.",
        defaultValue: "fall",
        options: ["fall", "fade"],
        optionTitles: ["Fall", "Fade"],
        displaySegmentedControl: true,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        description: "How long each drop lives, from pop-in to gone.",
        defaultValue: 1,
        min: 0.2,
        max: 4,
        step: 0.05,
        unit: "s",
    },
    spin: {
        type: ControlType.Number,
        title: "Spin",
        description: "Maximum random rotation, in degrees.",
        defaultValue: 360,
        min: 0,
        max: 720,
        step: 10,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        description: "Overshoot on the pop-in. 0 scales up cleanly.",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
})
