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


// Requested behavior: hidden image by default, reveal with a feathered torch spotlight on hover,
// spotlight follows pointer, resets when leaving, with tunable image/radius/softness/hidden color/smoothing/border radius controls.

interface MyComponentProps {
    image?: { src?: string; srcSet?: string; alt?: string }
    torchRadius: number
    edgeSoftness: number
    hiddenColor: string
    smoothing: number
    radius: number
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TorchReveal(props: MyComponentProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        torchRadius,
        edgeSoftness,
        hiddenColor,
        smoothing,
        radius,
    } = props

    const isStaticRenderer = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const rafRef = React.useRef<number | null>(null)
    const targetRef = React.useRef({ x: 0, y: 0 })
    const currentRef = React.useRef({ x: 0, y: 0 })

    const [isHovering, setIsHovering] = React.useState(false)
    const [cursor, setCursor] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return

            targetRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
            }

            if (!isHovering) {
                React.startTransition(() => setIsHovering(true))
            }
        },
        [isHovering]
    )

    const handleMouseLeave = React.useCallback(() => {
        React.startTransition(() => setIsHovering(false))
    }, [])

    React.useEffect(() => {
        if (isStaticRenderer) return

        const animate = () => {
            const t = Math.max(0, Math.min(1, smoothing))
            const current = currentRef.current
            const target = targetRef.current
            const nextX = current.x + (target.x - current.x) * t
            const nextY = current.y + (target.y - current.y) * t

            currentRef.current = { x: nextX, y: nextY }

            React.startTransition(() => {
                setCursor({ x: nextX, y: nextY })
            })

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
        }
    }, [smoothing, isStaticRenderer])

    const maskImage = React.useMemo(() => {
        if (!isHovering || isStaticRenderer) {
            return "radial-gradient(circle 0px at 50% 50%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 100%)"
        }

        const hardStop = Math.max(1, torchRadius)
        const featherStop = hardStop + Math.max(1, edgeSoftness)
        return `radial-gradient(circle ${featherStop}px at ${cursor.x}px ${cursor.y}px, rgba(255,255,255,1) 0px, rgba(255,255,255,1) ${hardStop}px, rgba(255,255,255,0) ${featherStop}px)`
    }, [isHovering, isStaticRenderer, torchRadius, edgeSoftness, cursor.x, cursor.y])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            role="img"
            aria-label="Torch reveal image"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                backgroundColor: hiddenColor,
                cursor: "none",
            }}
        >
            <img
                {...image}
                alt={image.alt ?? "Torch reveal image"}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    WebkitMaskImage: maskImage,
                    maskImage: maskImage,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskSize: "100% 100%",
                    maskSize: "100% 100%",
                }}
            />
        </div>
    )
}

addPropertyControls(TorchReveal, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    torchRadius: {
        type: ControlType.Number,
        title: "Torch Radius",
        defaultValue: 150,
        min: 20,
        max: 500,
        unit: "px",
        step: 1,
    },
    edgeSoftness: {
        type: ControlType.Number,
        title: "Edge Softness",
        defaultValue: 80,
        min: 1,
        max: 300,
        unit: "px",
        step: 1,
    },
    hiddenColor: {
        type: ControlType.Color,
        title: "Hidden Color",
        defaultValue: "#000000",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.01,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 200,
        unit: "px",
        step: 1,
    },
})
