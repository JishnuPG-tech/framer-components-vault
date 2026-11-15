// Karim Saif
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


const MASK_LAYER_COUNT = 10

type Props = {
    images: string[]
    imageSize: number
    maskColor: string
    mouseThreshold: number
    desktopBreakpoint: number
    imageLifespan: number
    inDuration: number
    outDuration: number
    slideDuration: number
    staggerIn: number
    staggerOut: number
    enableOnCanvas: boolean
    style?: React.CSSProperties
}

type TrailEntry = {
    element: HTMLDivElement
    imageLayers: HTMLDivElement[]
    maskLayers: HTMLDivElement[]
    removeTime: number
}

const EASING = "cubic-bezier(0.87, 0, 0.13, 1)"
const SLIDE_EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b

export default function CursorTrailRevealKarimSaif(props: Props) {
    const {
        images,
        imageSize,
        maskColor,
        mouseThreshold,
        desktopBreakpoint,
        imageLifespan,
        inDuration,
        outDuration,
        slideDuration,
        staggerIn,
        staggerOut,
        enableOnCanvas,
        style,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const active = !isCanvas || enableOnCanvas
    const validImages = (images || []).filter(Boolean)

    React.useEffect(() => {
        for (const src of validImages) {
            const img = new Image()
            img.src = src
        }
    }, [validImages.join("|")])

    React.useEffect(() => {
        const container = containerRef.current
        if (!container || !active || validImages.length === 0) return

        const timeouts: number[] = []
        const trail: TrailEntry[] = []
        let frame: number | null = null
        let imageIndex = 0
        let mouse = { x: 0, y: 0 }
        let lastMouse = { x: 0, y: 0 }
        let smooth = { x: 0, y: 0 }
        let isDesktop = false
        let removeMouseListener: (() => void) | null = null

        const half = imageSize / 2

        const schedule = (callback: () => void, delay: number) => {
            const id = window.setTimeout(() => {
                const i = timeouts.indexOf(id)
                if (i !== -1) timeouts.splice(i, 1)
                callback()
            }, delay)
            timeouts.push(id)
        }

        const checkDesktop = () =>
            window.innerWidth > desktopBreakpoint ||
            window.matchMedia("(pointer: fine)").matches

        const insideContainer = (x: number, y: number) => {
            const rect = container.getBoundingClientRect()
            return (
                x >= rect.left &&
                x <= rect.right &&
                y >= rect.top &&
                y <= rect.bottom
            )
        }

        const createImage = () => {
            const wrapper = document.createElement("div")
            wrapper.style.position = "absolute"
            wrapper.style.pointerEvents = "none"
            wrapper.style.overflow = "hidden"
            wrapper.style.width = `${imageSize}px`
            wrapper.style.height = `${imageSize}px`

            const src = validImages[imageIndex] ?? validImages[0]
            imageIndex = (imageIndex + 1) % validImages.length

            const rect = container.getBoundingClientRect()
            const startX = smooth.x - rect.left - half
            const startY = smooth.y - rect.top - half
            const targetX = mouse.x - rect.left - half
            const targetY = mouse.y - rect.top - half

            wrapper.style.left = "0px"
            wrapper.style.top = "0px"
            wrapper.style.willChange = "transform"
            wrapper.style.transform = `translate3d(${startX}px, ${startY}px, 0)`
            wrapper.style.transition = `transform ${slideDuration}ms ${SLIDE_EASING}`

            const maskLayers: HTMLDivElement[] = []
            const imageLayers: HTMLDivElement[] = []

            for (let i = 0; i < MASK_LAYER_COUNT; i++) {
                const layer = document.createElement("div")
                layer.style.position = "absolute"
                layer.style.inset = "0"
                layer.style.willChange = "clip-path"
                layer.style.backgroundColor = maskColor

                const imageLayer = document.createElement("div")
                imageLayer.style.position = "absolute"
                imageLayer.style.inset = "0"
                imageLayer.style.backgroundSize = "cover"
                imageLayer.style.backgroundPosition = "center"
                imageLayer.style.backgroundImage = `url("${src}")`

                const stripStart = i * 10
                const stripEnd = (i + 1) * 10

                layer.style.clipPath = `polygon(50% ${stripStart}%, 50% ${stripStart}%, 50% ${stripEnd}%, 50% ${stripEnd}%)`
                layer.style.transition = `clip-path ${inDuration}ms ${EASING}`
                layer.style.transform = "translateZ(0)"
                layer.style.backfaceVisibility = "hidden"

                layer.appendChild(imageLayer)
                wrapper.appendChild(layer)
                maskLayers.push(layer)
                imageLayers.push(imageLayer)
            }

            container.appendChild(wrapper)

            requestAnimationFrame(() => {
                wrapper.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`

                maskLayers.forEach((layer, i) => {
                    const stripStart = i * 10
                    const stripEnd = (i + 1) * 10
                    const delay = Math.abs(i - 4.5) * staggerIn

                    schedule(() => {
                        layer.style.clipPath = `polygon(0% ${stripStart}%, 100% ${stripStart}%, 100% ${stripEnd}%, 0% ${stripEnd}%)`
                    }, delay)
                })
            })

            trail.push({
                element: wrapper,
                maskLayers,
                imageLayers,
                removeTime: Date.now() + imageLifespan,
            })
        }

        const removeOld = () => {
            if (trail.length === 0) return
            const oldest = trail[0]
            if (!oldest || Date.now() < oldest.removeTime) return

            const entry = trail.shift()
            if (!entry) return

            entry.maskLayers.forEach((layer, i) => {
                const stripStart = i * 10
                const stripEnd = (i + 1) * 10
                const delay = (4.5 - Math.abs(i - 4.5)) * staggerOut

                layer.style.transition = `clip-path ${outDuration}ms ${EASING}`

                schedule(() => {
                    layer.style.clipPath = `polygon(50% ${stripStart}%, 50% ${stripStart}%, 50% ${stripEnd}%, 50% ${stripEnd}%)`
                }, delay)
            })

            for (const imageLayer of entry.imageLayers) {
                imageLayer.style.transition = `opacity ${outDuration}ms ${EASING}`
                imageLayer.style.opacity = "0.25"
            }

            schedule(() => {
                entry.element.remove()
            }, outDuration + 112)
        }

        const render = () => {
            if (!isDesktop) return

            const distance = Math.hypot(
                mouse.x - lastMouse.x,
                mouse.y - lastMouse.y
            )

            smooth.x = lerp(smooth.x || mouse.x, mouse.x, 0.1)
            smooth.y = lerp(smooth.y || mouse.y, mouse.y, 0.1)

            if (
                distance > mouseThreshold &&
                insideContainer(mouse.x, mouse.y)
            ) {
                createImage()
                lastMouse = { ...mouse }
            }

            removeOld()
            frame = requestAnimationFrame(render)
        }

        const start = (): (() => void) | null => {
            if (!isDesktop) return null

            const onMove = (event: MouseEvent) => {
                mouse = { x: event.clientX, y: event.clientY }
            }

            document.addEventListener("mousemove", onMove)
            frame = requestAnimationFrame(render)

            return () => document.removeEventListener("mousemove", onMove)
        }

        const stop = () => {
            if (frame !== null) {
                cancelAnimationFrame(frame)
                frame = null
            }
            for (const id of timeouts) clearTimeout(id)
            timeouts.length = 0
            for (const item of trail) item.element.remove()
            trail.length = 0
        }

        const onResize = () => {
            isDesktop = checkDesktop()

            if (!isDesktop) {
                stop()
                removeMouseListener?.()
                removeMouseListener = null
            } else if (removeMouseListener === null) {
                removeMouseListener = start()
            }
        }

        isDesktop = checkDesktop()
        window.addEventListener("resize", onResize)

        if (isDesktop) removeMouseListener = start()

        return () => {
            stop()
            removeMouseListener?.()
            window.removeEventListener("resize", onResize)
        }
    }, [
        active,
        validImages.join("|"),
        imageSize,
        maskColor,
        mouseThreshold,
        desktopBreakpoint,
        imageLifespan,
        inDuration,
        outDuration,
        slideDuration,
        staggerIn,
        staggerOut,
    ])

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
            }}
        />
    )
}

CursorTrailRevealKarimSaif.displayName = "Cursor Trail Reveal by Karim Saif"

CursorTrailRevealKarimSaif.defaultProps = {
    images: [
        "https://picsum.photos/seed/karimsaif1/600/600",
        "https://picsum.photos/seed/karimsaif2/600/600",
        "https://picsum.photos/seed/karimsaif3/600/600",
        "https://picsum.photos/seed/karimsaif4/600/600",
        "https://picsum.photos/seed/karimsaif5/600/600",
    ],
    imageSize: 175,
    maskColor: "#1a1a1a",
    mouseThreshold: 150,
    desktopBreakpoint: 1000,
    imageLifespan: 1000,
    inDuration: 750,
    outDuration: 1000,
    slideDuration: 1000,
    staggerIn: 100,
    staggerOut: 25,
    enableOnCanvas: false,
}

addPropertyControls(CursorTrailRevealKarimSaif, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        defaultValue: CursorTrailRevealKarimSaif.defaultProps.images,
        description:
            "Images shown one after another as the cursor moves. Add, remove or reorder them to change the trail.",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 40,
        max: 600,
        step: 5,
        unit: "px",
        defaultValue: 175,
        description: "Width and height of each square trail image, in pixels.",
    },
    maskColor: {
        type: ControlType.Color,
        title: "Mask Color",
        defaultValue: "#1a1a1a",
        description:
            "Color of the strips that sweep across each image during the reveal animation.",
    },
    mouseThreshold: {
        type: ControlType.Number,
        title: "Distance",
        min: 20,
        max: 500,
        step: 5,
        unit: "px",
        defaultValue: 150,
        description:
            "How far the cursor must travel before the next image appears. Lower values create a denser trail.",
    },
    desktopBreakpoint: {
        type: ControlType.Number,
        title: "Breakpoint",
        min: 320,
        max: 2000,
        step: 10,
        unit: "px",
        defaultValue: 1000,
        description:
            "Screen width above which the trail is active. Devices with a fine pointer such as a mouse also activate it.",
    },
    imageLifespan: {
        type: ControlType.Number,
        title: "Lifespan",
        min: 100,
        max: 5000,
        step: 50,
        unit: "ms",
        defaultValue: 1000,
        description:
            "How long each image stays visible before it starts to disappear.",
    },
    inDuration: {
        type: ControlType.Number,
        title: "Reveal Time",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 750,
        description:
            "Duration of the reveal animation for each strip when an image appears.",
    },
    outDuration: {
        type: ControlType.Number,
        title: "Hide Time",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 1000,
        description: "Duration of the hide animation when an image disappears.",
    },
    slideDuration: {
        type: ControlType.Number,
        title: "Slide Time",
        min: 100,
        max: 3000,
        step: 50,
        unit: "ms",
        defaultValue: 1000,
        description:
            "How long each image takes to glide from the smoothed cursor position to its final spot.",
    },
    staggerIn: {
        type: ControlType.Number,
        title: "Stagger In",
        min: 0,
        max: 300,
        step: 5,
        unit: "ms",
        defaultValue: 100,
        description:
            "Delay between each strip during the reveal, starting from the middle strips outward.",
    },
    staggerOut: {
        type: ControlType.Number,
        title: "Stagger Out",
        min: 0,
        max: 300,
        step: 5,
        unit: "ms",
        defaultValue: 25,
        description:
            "Delay between each strip during the hide animation, starting from the outer strips inward.",
    },
    enableOnCanvas: {
        type: ControlType.Boolean,
        title: "On Canvas",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        description:
            "Made with 💛 by [@karimsaif](https://x.com/karimsaif0) · Built with [Framer](https://framer.link/karimsaif0)",
    },
})
