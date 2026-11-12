import { useState, useRef, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface HoverRevealFrameProps {
    children: React.ReactNode
    frameOpacity: number
    background: string
    radius: number
    startOpacity: number
    endOpacity: number
    style?: CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 */

export default function HoverRevealFrame(props: HoverRevealFrameProps) {
    const {
        children,
        frameOpacity,
        background,
        radius,
        startOpacity,
        endOpacity,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            startTransition(() => {
                setMousePosition({ x, y })
                setIsHovered(true)
            })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            startTransition(() => setMousePosition({ x, y }))
        }
    }

    const handleMouseLeave = () => {
        startTransition(() => setIsHovered(false))
    }

    const x = Math.round(mousePosition.x)
    const y = Math.round(mousePosition.y)
    const r = Math.max(0, Math.round(radius))
    const maskImage = isHovered
        ? `radial-gradient(circle ${r}px at ${x}px ${y}px, 
           rgba(0,0,0,${startOpacity}) 0px,
           rgba(0,0,0,${endOpacity}) ${r}px,
           rgba(0,0,0,${frameOpacity}) ${r + 1}px)`
        : `radial-gradient(circle 0px at ${x}px ${y}px,
           rgba(0,0,0,${startOpacity}) 0px,
           rgba(0,0,0,${frameOpacity}) 1px)`

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                minWidth: "200px",
                minHeight: "200px",
                position: "relative",
                background,
                overflow: "visible",
                cursor: "default",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "visible",
                    maskImage,
                    WebkitMaskImage: maskImage,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskClip: "border-box",
                    maskClip: "border-box",
                }}
            >
                {children}
            </div>
        </div>
    )
}

addPropertyControls(HoverRevealFrame, {
    children: {
        type: ControlType.Slot,
        title: "Content",
        maxCount: 1,
    },
    frameOpacity: {
        type: ControlType.Number,
        title: "Frame Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
    },
    startOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
    },
    endOpacity: {
        type: ControlType.Number,
        title: "End Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 150,
        min: 10,
        max: 500,
        step: 10,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        optional: true,
        description:
            "Follow the creator on [Twitter](https://x.com/Muhammad_maass)",
    },
})
