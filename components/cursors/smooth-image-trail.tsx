import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Create a Framer code component named "Image Tracer" that acts as a full-size transparent pass-through overlay, listens to mousemove on window, spawns image stickers along cursor path with spacing, random size/rotation, fades/shrinks and removes them with a shared animation loop, caps max rendered stickers FIFO, has no text, hides overflow, and exposes 10 image slots plus styling/behavior controls in the Framer sidebar.

type ImageValue = { src?: string; srcSet?: string; alt?: string } | undefined

interface Sticker {
    id: number
    x: number
    y: number
    createdAt: number
    size: number
    rotation: number
    src: string
    alt: string
}

interface MyComponentProps {
    image1?: ImageValue
    image2?: ImageValue
    image3?: ImageValue
    image4?: ImageValue
    image5?: ImageValue
    image6?: ImageValue
    image7?: ImageValue
    image8?: ImageValue
    image9?: ImageValue
    image10?: ImageValue
    backgroundColor: string
    imageScale: number
    sizeRandomness: number
    rotationRandomness: number
    trailSpacing: number
    fadeOutDuration: number
    maxImagesOnScreen: number
    imageOpacity: number
    imageBorderRadius: number
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function SmoothImageCursor(props: MyComponentProps) {
    const {
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
        backgroundColor,
        imageScale,
        sizeRandomness,
        rotationRandomness,
        trailSpacing,
        fadeOutDuration,
        maxImagesOnScreen,
        imageOpacity,
        imageBorderRadius,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement | null>(null)
    const stickersRef = useRef<Sticker[]>([])
    const rafRef = useRef<number | null>(null)
    const lastSpawnRef = useRef<{ x: number; y: number } | null>(null)
    const idRef = useRef(0)
    const imageIndexRef = useRef(0)
    const [, setRenderTick] = useState(0)

    const imagePool = useMemo(() => {
        const entries = [
            image1,
            image2,
            image3,
            image4,
            image5,
            image6,
            image7,
            image8,
            image9,
            image10,
        ]
        return entries
            .map((item) => ({ src: item?.src ?? "", alt: item?.alt ?? "" }))
            .filter((item) => item.src.length > 0)
    }, [
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        image7,
        image8,
        image9,
        image10,
    ])

    const triggerRender = useCallback(() => {
        startTransition(() => {
            setRenderTick((value) => value + 1)
        })
    }, [])

    const spawnSticker = useCallback(
        (clientX: number, clientY: number) => {
            const node = containerRef.current
            if (!node || imagePool.length === 0) return

            const rect = node.getBoundingClientRect()
            const inside =
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom

            if (!inside) {
                lastSpawnRef.current = null
                return
            }

            const last = lastSpawnRef.current
            if (last) {
                const dx = clientX - last.x
                const dy = clientY - last.y
                const distance = Math.hypot(dx, dy)
                if (distance < Math.max(1, trailSpacing)) return
            }

            const chosen = imagePool[imageIndexRef.current % imagePool.length]
            imageIndexRef.current += 1

            const randomUnit = Math.random() * 2 - 1
            const randomizedSize = Math.max(
                1,
                imageScale * (1 + randomUnit * sizeRandomness)
            )
            const randomizedRotation =
                (Math.random() * 2 - 1) * rotationRandomness

            const sticker: Sticker = {
                id: idRef.current++,
                x: clientX - rect.left,
                y: clientY - rect.top,
                createdAt: performance.now(),
                size: randomizedSize,
                rotation: randomizedRotation,
                src: chosen.src,
                alt: chosen.alt || "",
            }

            const next = [...stickersRef.current, sticker]
            const cap = Math.max(1, Math.round(maxImagesOnScreen))
            if (next.length > cap) {
                stickersRef.current = next.slice(next.length - cap)
            } else {
                stickersRef.current = next
            }

            lastSpawnRef.current = { x: clientX, y: clientY }
            triggerRender()
        },
        [
            imagePool,
            imageScale,
            maxImagesOnScreen,
            rotationRandomness,
            sizeRandomness,
            trailSpacing,
            triggerRender,
        ]
    )

    useEffect(() => {
        if (isStaticRenderer) return
        if (typeof window === "undefined") return

        const onMouseMove = (event: MouseEvent) => {
            spawnSticker(event.clientX, event.clientY)
        }

        window.addEventListener("mousemove", onMouseMove, { passive: true })
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
        }
    }, [isStaticRenderer, spawnSticker])

    useEffect(() => {
        if (isStaticRenderer) return
        if (typeof window === "undefined") return

        const tick = () => {
            const now = performance.now()
            const lifeMs = Math.max(50, fadeOutDuration * 1000)
            const prevLength = stickersRef.current.length
            const alive = stickersRef.current.filter(
                (item) => now - item.createdAt < lifeMs
            )
            const hadAny = prevLength > 0

            if (alive.length !== prevLength) {
                stickersRef.current = alive
            }
            if (hadAny || alive.length > 0) triggerRender()

            rafRef.current = window.requestAnimationFrame(tick)
        }

        const startLoop = () => {
            if (rafRef.current !== null) return
            rafRef.current = window.requestAnimationFrame(tick)
        }

        const stopLoop = () => {
            if (rafRef.current !== null) {
                window.cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        const node = containerRef.current
        let observer: IntersectionObserver | null = null

        if (
            node &&
            typeof window.IntersectionObserver !== "undefined"
        ) {
            observer = new window.IntersectionObserver(
                (entries) => {
                    const entry = entries[0]
                    if (!entry) return
                    if (entry.isIntersecting) {
                        startLoop()
                    } else {
                        stopLoop()
                    }
                },
                { threshold: 0, rootMargin: "32px" }
            )
            observer.observe(node)
        } else {
            startLoop()
        }

        return () => {
            if (observer) observer.disconnect()
            stopLoop()
        }
    }, [fadeOutDuration, isStaticRenderer, triggerRender])

    const now =
        typeof performance !== "undefined" ? performance.now() : Date.now()
    const durationMs = Math.max(50, fadeOutDuration * 1000)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: backgroundColor,
                pointerEvents: "none",
            }}
        >
            {stickersRef.current.map((sticker) => {
                const age = now - sticker.createdAt
                const progress = Math.max(0, Math.min(1, age / durationMs))
                const currentOpacity = imageOpacity * (1 - progress)
                const currentScale = 1 - progress * 0.45
                return (
                    <div
                        key={sticker.id}
                        style={{
                            position: "absolute",
                            left: sticker.x,
                            top: sticker.y,
                            width: sticker.size,
                            height: sticker.size,
                            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${currentScale})`,
                            transformOrigin: "center",
                            opacity: currentOpacity,
                            willChange: "transform, opacity",
                            pointerEvents: "none",
                        }}
                    >
                        <img
                            src={sticker.src}
                            alt={sticker.alt}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: imageBorderRadius,
                                display: "block",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(SmoothImageCursor, {
    image1: { type: ControlType.ResponsiveImage, title: "Image 1" },
    image2: { type: ControlType.ResponsiveImage, title: "Image 2" },
    image3: { type: ControlType.ResponsiveImage, title: "Image 3" },
    image4: { type: ControlType.ResponsiveImage, title: "Image 4" },
    image5: { type: ControlType.ResponsiveImage, title: "Image 5" },
    image6: { type: ControlType.ResponsiveImage, title: "Image 6" },
    image7: { type: ControlType.ResponsiveImage, title: "Image 7" },
    image8: { type: ControlType.ResponsiveImage, title: "Image 8" },
    image9: { type: ControlType.ResponsiveImage, title: "Image 9" },
    image10: { type: ControlType.ResponsiveImage, title: "Image 10" },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "rgba(0,0,0,0)",
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image Scale",
        defaultValue: 60,
        min: 10,
        max: 300,
        step: 1,
    },
    sizeRandomness: {
        type: ControlType.Number,
        title: "Size Randomness",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.01,
    },
    rotationRandomness: {
        type: ControlType.Number,
        title: "Rotation Randomness",
        defaultValue: 30,
        min: 0,
        max: 180,
        step: 1,
        unit: "deg",
    },
    trailSpacing: {
        type: ControlType.Number,
        title: "Trail Spacing",
        defaultValue: 40,
        min: 1,
        max: 300,
        step: 1,
    },
    fadeOutDuration: {
        type: ControlType.Number,
        title: "Fade-out Duration (s)",
        defaultValue: 0.8,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    maxImagesOnScreen: {
        type: ControlType.Number,
        title: "Max Images On Screen",
        defaultValue: 20,
        min: 1,
        max: 100,
        step: 1,
    },
    imageOpacity: {
        type: ControlType.Number,
        title: "Image Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    imageBorderRadius: {
        type: ControlType.Number,
        title: "Image Border Radius",
        defaultValue: 8,
        min: 0,
        max: 200,
        step: 1,
    },
})
