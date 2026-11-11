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
    animate,
    motion,
    useMotionValue,
    useTransform,
    type MotionValue,
} from "framer-motion"
import {
    startTransition,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
} from "react"

interface SlideImage {
    src: string
    srcSet?: string
    alt?: string
}

interface CarouselPreloaderProps {
    images: SlideImage[]
    mainImage: number
    slideWidth: number
    gap: number
    shape: "convex" | "concave" | "flat"
    amount: number
    direction: "leftToRight" | "rightToLeft"
    expandStyle: "flow" | "fade"
    slideDuration: number
    pauseDuration: number
    expandDuration: number
    backgroundColor: string
    borderRadius: number
    loop: boolean
    onComplete?: () => void
    style?: CSSProperties
}

type Phase = "slide" | "expand"

const defaultImages: SlideImage[] = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5",
    },
]

const easeInOut = [0.65, 0, 0.35, 1] as const
const ratio = 9 / 16
const degrees = 180 / Math.PI

/** Convex bows toward the viewer, concave away from it, flat not at all. */
const shapeDirection = { convex: -1, concave: 1, flat: 0 }

interface Point {
    x: number
    z: number
}

/**
 * Maps a flat horizontal coordinate `u` (relative to the frame center) onto the
 * curved surface: an arc of radius `radius` across the visible half-width,
 * carried on along its tangent past the edges so the surface never folds back.
 */
function project(
    u: number,
    half: number,
    radius: number,
    limit: number,
    direction: number
): Point {
    if (direction === 0 || limit < 1e-4 || radius <= 0) return { x: u, z: 0 }

    const side = u < 0 ? -1 : 1
    const magnitude = Math.abs(u)
    let x: number
    let depth: number

    if (magnitude <= half) {
        const angle = magnitude / radius
        x = radius * Math.sin(angle)
        depth = radius * (1 - Math.cos(angle))
    } else {
        // Straight tangent extension past the edge of the frame.
        const overshoot = magnitude - half
        x = radius * Math.sin(limit) + overshoot * Math.cos(limit)
        depth = radius * (1 - Math.cos(limit)) + overshoot * Math.sin(limit)
    }

    return {
        x: side * x,
        // Concave advances toward the camera, so cap the depth well short of
        // the perspective origin to avoid a magnification blow-up off-screen.
        z: direction * Math.min(depth, half),
    }
}

interface StripProps {
    image: SlideImage
    slot: number
    segments: number
    slideIndex: number
    heroIndex: number
    step: number
    width: number
    height: number
    half: number
    limit: number
    direction: number
    borderRadius: number
    x: MotionValue<number>
    heroWidth: MotionValue<number>
    heroHeight: MotionValue<number>
    flatten: MotionValue<number>
}

/**
 * One vertical slice of a slide. Each slice spans exactly between its two
 * projected edge points, so neighbouring slices share endpoints and the slide
 * reads as one continuous curved sheet with no seams or gaps.
 */
function Strip(props: StripProps) {
    const {
        image,
        slot,
        segments,
        slideIndex,
        heroIndex,
        step,
        width,
        height,
        half,
        limit,
        direction,
        borderRadius,
        x,
        heroWidth,
        heroHeight,
        flatten,
    } = props

    const isHero = slideIndex === heroIndex

    const slideHeight = useTransform(heroHeight, (main) =>
        isHero ? main : height
    )

    // Project the strip's two edge points onto the surface. Kept as a plain
    // helper (not a hook) so each style value can derive from it and every
    // useTransform still returns a primitive.
    const solve = (offset: number, main: number, curl: number) => {
        const slide = isHero ? main : width
        const before =
            slideIndex <= heroIndex
                ? slideIndex * step
                : slideIndex * step + (main - width)
        const strip = slide / segments
        const originLeft = offset + before - half
        const uLeft = originLeft + slot * strip
        const uRight = uLeft + strip

        const angle = Math.max(limit * curl, 0)
        const radius = angle > 1e-4 ? half / angle : 0
        const left = project(uLeft, half, radius, angle, direction)
        const right = project(uRight, half, radius, angle, direction)

        const dx = right.x - left.x
        const dz = right.z - left.z
        const chord = Math.max(Math.hypot(dx, dz), 0.001)
        return {
            midX: (left.x + right.x) / 2,
            midZ: (left.z + right.z) / 2,
            rotate: Math.atan2(-dz, dx) * degrees,
            chord,
            strip,
            slide,
            // Map the flat strip slice into the (foreshortened) chord window.
            scale: chord / strip,
        }
    }

    const transform = useTransform(
        [x, heroWidth, flatten],
        ([offset, main, curl]: number[]) => {
            const s = solve(offset, main, curl)
            return `translate(-50%, -50%) translateX(${s.midX}px) translateZ(${s.midZ}px) rotateY(${s.rotate}deg)`
        }
    )
    // Bleed a pixel over each join so seams never show a hairline.
    const paintedWidth = useTransform(
        [x, heroWidth, flatten],
        ([offset, main, curl]: number[]) => solve(offset, main, curl).chord + 1
    )
    const imgWidth = useTransform(
        [x, heroWidth, flatten],
        ([offset, main, curl]: number[]) => {
            const s = solve(offset, main, curl)
            return s.slide * s.scale
        }
    )
    const imgLeft = useTransform(
        [x, heroWidth, flatten],
        ([offset, main, curl]: number[]) => {
            const s = solve(offset, main, curl)
            return -slot * s.strip * s.scale - 0.5
        }
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: paintedWidth,
                height: slideHeight,
                overflow: "hidden",
                transform,
                willChange: "transform",
                backfaceVisibility: "hidden",
            }}
        >
            <motion.img
                src={image?.src}
                srcSet={image?.srcSet}
                alt=""
                draggable={false}
                style={{
                    position: "absolute",
                    top: 0,
                    left: imgLeft,
                    width: imgWidth,
                    height: slideHeight,
                    maxWidth: "none",
                    objectFit: "cover",
                    borderRadius,
                }}
            />
        </motion.div>
    )
}

/**
 * Carousel Preloader
 *
 * Sweeps a row of 16:9 images end to end along a convex, concave, or flat
 * surface, then expands the main image to full screen.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 675
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CarouselPreloader(props: CarouselPreloaderProps) {
    const {
        images,
        mainImage = 4,
        slideWidth = 560,
        gap = 100,
        shape = "convex",
        amount = 45,
        direction = "leftToRight",
        expandStyle = "flow",
        slideDuration = 2.2,
        pauseDuration = 1,
        expandDuration = 1.1,
        backgroundColor = "#FFFFFF",
        borderRadius = 0,
        loop = false,
        onComplete,
        style,
    } = props

    const slides = images && images.length > 0 ? images : defaultImages
    const heroIndex = Math.min(
        Math.max(Math.round(mainImage) - 1, 0),
        slides.length - 1
    )

    const containerRef = useRef<HTMLDivElement>(null)
    const [size, setSize] = useState({ width: 0, height: 0 })
    const [phase, setPhase] = useState<Phase>("slide")
    const [runId, setRunId] = useState(0)
    const isStatic = useIsStaticRenderer()

    useLayoutEffect(() => {
        const element = containerRef.current
        if (!element || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            startTransition(() => setSize({ width, height }))
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const ready = size.width > 0 && size.height > 0

    // Fit the 16:9 slide inside the container without touching the edges.
    const width = Math.max(
        1,
        Math.min(slideWidth, size.width * 0.9, (size.height * 0.9) / ratio)
    )
    const height = width * ratio
    const step = width + gap
    const trackWidth = slides.length * width + (slides.length - 1) * gap

    // Track offsets: hero centered at rest, and hero centered once expanded.
    const restX = size.width / 2 - (heroIndex * step + width / 2)
    const expandedX = -heroIndex * step
    const startX = direction === "leftToRight" ? -trackWidth : size.width

    const surface = shapeDirection[shape] ?? 0
    const limit = (Math.max(amount, 0) * Math.PI) / 180
    // Slice more finely for a deeper curve; a flat surface needs no slicing.
    const segments =
        surface === 0 || limit < 1e-4
            ? 1
            : Math.max(6, Math.min(24, Math.round(amount / 3)))

    const x = useMotionValue(0)
    const heroWidth = useMotionValue(width)
    const heroHeight = useMotionValue(height)
    const flatten = useMotionValue(1)

    useEffect(() => {
        if (!ready) return

        x.set(isStatic ? restX : startX)
        heroWidth.set(width)
        heroHeight.set(height)
        flatten.set(1)
        startTransition(() => setPhase("slide"))

        if (isStatic) return

        const timers: ReturnType<typeof setTimeout>[] = []
        const expand = () => {
            startTransition(() => setPhase("expand"))
            const transition = { duration: expandDuration, ease: easeInOut }
            animate(x, expandedX, transition)
            animate(heroWidth, size.width, transition)
            animate(heroHeight, size.height, transition)
            // Relax the curve as the main image takes over, so it lands flat
            // and square against the frame.
            animate(flatten, 0, transition)
            timers.push(
                setTimeout(() => {
                    onComplete?.()
                    if (loop) startTransition(() => setRunId((id) => id + 1))
                }, expandDuration * 1000)
            )
        }

        const slide = animate(x, restX, {
            duration: slideDuration,
            ease: easeInOut,
            onComplete: () => {
                timers.push(setTimeout(expand, pauseDuration * 1000))
            },
        })

        return () => {
            slide.stop()
            timers.forEach(clearTimeout)
        }
    }, [
        runId,
        ready,
        isStatic,
        size.width,
        size.height,
        restX,
        startX,
        expandedX,
        width,
        height,
        slideDuration,
        pauseDuration,
        expandDuration,
        loop,
        onComplete,
    ])

    const hero = slides[heroIndex]
    const fading = expandStyle === "fade" && phase === "expand"

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                backgroundColor,
                perspective: size.width || undefined,
                perspectiveOrigin: "50% 50%",
            }}
            role="img"
            aria-label={hero?.alt || "Loading"}
        >
            {ready && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        transformStyle: "preserve-3d",
                    }}
                >
                    {slides.map((image, slideIndex) => (
                        <motion.div
                            key={slideIndex}
                            style={{
                                position: "absolute",
                                inset: 0,
                                transformStyle: "preserve-3d",
                            }}
                            animate={{
                                opacity:
                                    fading && slideIndex !== heroIndex ? 0 : 1,
                            }}
                            transition={{
                                duration: expandDuration * 0.6,
                                ease: "easeOut",
                            }}
                        >
                            {Array.from({ length: segments }, (_, slot) => (
                                <Strip
                                    key={slot}
                                    image={image}
                                    slot={slot}
                                    segments={segments}
                                    slideIndex={slideIndex}
                                    heroIndex={heroIndex}
                                    step={step}
                                    width={width}
                                    height={height}
                                    half={size.width / 2}
                                    limit={limit}
                                    direction={surface}
                                    borderRadius={borderRadius}
                                    x={x}
                                    heroWidth={heroWidth}
                                    heroHeight={heroHeight}
                                    flatten={flatten}
                                />
                            ))}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}

addPropertyControls(CarouselPreloader, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        defaultValue: defaultImages,
        maxCount: 12,
    },
    mainImage: {
        type: ControlType.Number,
        title: "Main Image",
        description: "The image that expands to full screen.",
        defaultValue: 4,
        min: 1,
        max: 12,
        step: 1,
        displayStepper: true,
    },
    slideWidth: {
        type: ControlType.Number,
        title: "Slide Width",
        defaultValue: 560,
        min: 100,
        max: 1600,
        step: 10,
        unit: "px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 100,
        min: 0,
        max: 400,
        step: 4,
        unit: "px",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        description:
            "Convex bows the row toward you, concave wraps it around you.",
        defaultValue: "convex",
        options: ["convex", "concave", "flat"],
        optionTitles: ["Convex", "Concave", "Flat"],
        displaySegmentedControl: true,
    },
    amount: {
        type: ControlType.Number,
        title: "Amount",
        description: "How strongly the row curves.",
        defaultValue: 45,
        min: 0,
        max: 90,
        step: 1,
        unit: "°",
        hidden: ({ shape }) => shape === "flat",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "leftToRight",
        options: ["leftToRight", "rightToLeft"],
        optionTitles: ["Left to Right", "Right to Left"],
        displaySegmentedControl: true,
    },
    expandStyle: {
        type: ControlType.Enum,
        title: "Expand",
        description:
            "Flow pushes the other slides aside, Fade dissolves them away.",
        defaultValue: "flow",
        options: ["flow", "fade"],
        optionTitles: ["Flow", "Fade"],
        displaySegmentedControl: true,
    },
    slideDuration: {
        type: ControlType.Number,
        title: "Slide Time",
        defaultValue: 2.2,
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
    },
    pauseDuration: {
        type: ControlType.Number,
        title: "Pause Time",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    expandDuration: {
        type: ControlType.Number,
        title: "Expand Time",
        defaultValue: 1.1,
        min: 0.2,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
    },
    onComplete: {
        type: ControlType.EventHandler,
        title: "On Complete",
    },
})
