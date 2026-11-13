// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useEffect, useState } from "react"

interface Orbit3DCarouselProps {
    items: React.ReactNode[]
    orientation: "horizontal" | "vertical"
    radius: number
    scrollSpeed: number
    baseTiltAngle: number
    mouseTiltIntensity: number
    touchSpeed: number
    cardScale: number
    dragSpeed: number
    showCursor: boolean
    cursorText: string
    cursorBgColor: string
    cursorTextColor: string
    cursorPadding: string
    cursorBorderRadius: number
    cursorFont: any
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 */
export default function Orbit3DCarousel(props: Orbit3DCarouselProps) {
    const {
        items = [],
        orientation = "horizontal",
        radius = 600,
        scrollSpeed = 0.04,
        baseTiltAngle = -12,
        mouseTiltIntensity = 10,
        touchSpeed = 0.25,
        cardScale = 1,
        dragSpeed = 0.2,
        showCursor = true,
        cursorText = "View",
        cursorBgColor = "#000000",
        cursorTextColor = "#FFFFFF",
        cursorPadding = "8px 16px",
        cursorBorderRadius = 100,
        cursorFont,
    } = props

    const itemCount = items.length
    const [rotation, setRotation] = useState(0)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [smoothMouse, setSmoothMouse] = useState({ x: 0, y: 0 })
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [smoothCursor, setSmoothCursor] = useState({ x: 0, y: 0 })
    const [showCustomCursor, setShowCustomCursor] = useState(false)
    const [cursorOpacity, setCursorOpacity] = useState(0)

    const momentumRef = useRef(0)
    const dragRef = useRef({ active: false, lastX: 0, lastY: 0 })
    const touchRef = useRef({ active: false, lastY: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const isScrollingRef = useRef(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            if (container.contains(e.target as Node)) {
                e.preventDefault()
                momentumRef.current += e.deltaY * scrollSpeed
                isScrollingRef.current = true
                setTimeout(() => {
                    isScrollingRef.current = false
                }, 100)
            }
        }

        container.addEventListener("wheel", handleWheel, { passive: false })
        return () => container.removeEventListener("wheel", handleWheel)
    }, [scrollSpeed])

    const handleWheel = (e: React.WheelEvent) => {
        // Don't preventDefault here - handled in useEffect
        momentumRef.current += e.deltaY * scrollSpeed
        isScrollingRef.current = true
        setTimeout(() => {
            isScrollingRef.current = false
        }, 100)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        dragRef.current.active = true
        dragRef.current.lastX = e.clientX
        dragRef.current.lastY = e.clientY
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current.active) return
        if (orientation === "horizontal") {
            const deltaX = e.clientX - dragRef.current.lastX
            dragRef.current.lastX = e.clientX
            setRotation((prev) => prev + deltaX * dragSpeed)
        } else {
            const deltaY = e.clientY - dragRef.current.lastY
            dragRef.current.lastY = e.clientY
            setRotation((prev) => prev + deltaY * dragSpeed)
        }
    }

    const handleMouseUp = () => {
        dragRef.current.active = false
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            touchRef.current.active = true
            touchRef.current.lastY = e.touches[0].clientY
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchRef.current.active) return
        const touch = e.touches[0]
        const deltaY = touch.clientY - touchRef.current.lastY
        touchRef.current.lastY = touch.clientY
        setRotation((prev) => prev + deltaY * touchSpeed)
        e.preventDefault()
    }

    const handleTouchEnd = () => {
        touchRef.current.active = false
    }

    useEffect(() => {
        let frame: number
        const animate = () => {
            if (Math.abs(momentumRef.current) > 0.01) {
                setRotation((p) => p + momentumRef.current)
                momentumRef.current *= 0.9
            } else {
                momentumRef.current = 0
            }
            frame = requestAnimationFrame(animate)
        }
        animate()
        return () => cancelAnimationFrame(frame)
    }, [])

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = (e.clientY / window.innerHeight) * 2 - 1
            setMousePos({ x, y: -y })
            setCursorPosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [])

    useEffect(() => {
        let frame: number
        const animate = () => {
            setSmoothMouse((p) => ({
                x: p.x + (mousePos.x - p.x) * 0.07,
                y: p.y + (mousePos.y - p.y) * 0.07,
            }))
            frame = requestAnimationFrame(animate)
        }
        animate()
        return () => cancelAnimationFrame(frame)
    }, [mousePos.x, mousePos.y])

    // Smooth cursor interpolation
    useEffect(() => {
        let frame: number
        const animate = () => {
            setSmoothCursor((p) => ({
                x: p.x + (cursorPosition.x - p.x) * 0.15,
                y: p.y + (cursorPosition.y - p.y) * 0.15,
            }))
            frame = requestAnimationFrame(animate)
        }
        animate()
        return () => cancelAnimationFrame(frame)
    }, [cursorPosition.x, cursorPosition.y])

    // Smooth cursor opacity fade in/out
    useEffect(() => {
        let frame: number
        const targetOpacity = showCustomCursor ? 1 : 0
        const animate = () => {
            setCursorOpacity((current) => {
                const diff = targetOpacity - current
                if (Math.abs(diff) < 0.01) return targetOpacity
                return current + diff * 0.15
            })
            frame = requestAnimationFrame(animate)
        }
        animate()
        return () => cancelAnimationFrame(frame)
    }, [showCustomCursor])

    if (itemCount === 0) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#E8E6F0",
                    gap: 12,
                }}
            >
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <path
                        d="M24 4L29.09 18.26L44 19.27L32.45 28.97L35.82 43.73L24 35.77L12.18 43.73L15.55 28.97L4 19.27L18.91 18.26L24 4Z"
                        fill="#B4A6E8"
                    />
                </svg>
                <div
                    style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#9B8FD6",
                        textAlign: "center",
                    }}
                >
                    Connect to Content
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: "#B4A6E8",
                        textAlign: "center",
                        maxWidth: 240,
                        lineHeight: 1.4,
                    }}
                >
                    Add layers or components to make infinite auto-playing
                    slideshows.
                </div>
            </div>
        )
    }

    const rotationAxis = orientation === "horizontal" ? "rotateY" : "rotateX"
    const tiltAxis = orientation === "horizontal" ? "rotateX" : "rotateY"

    return (
        <>
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: 1400,
                    touchAction: "none",
                    userSelect: "none",
                    cursor:
                        showCursor && showCustomCursor
                            ? "none"
                            : dragRef.current.active
                              ? "grabbing"
                              : "grab",
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                    handleMouseUp()
                    setShowCustomCursor(false)
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    style={{
                        transformStyle: "preserve-3d",
                        transform: `${tiltAxis}(${baseTiltAngle + smoothMouse.y * mouseTiltIntensity}deg) ${orientation === "horizontal" ? `rotateY(${smoothMouse.x * mouseTiltIntensity}deg)` : `rotateX(${-smoothMouse.x * mouseTiltIntensity}deg)`}`,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {items.map((item, i) => {
                            const angle = rotation + (360 / itemCount) * i
                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        transformStyle: "preserve-3d",
                                        transform: `${rotationAxis}(${angle}deg) translateZ(${radius}px) scale(${cardScale})`,
                                    }}
                                    onMouseEnter={() => {
                                        if (
                                            showCursor &&
                                            !isScrollingRef.current
                                        )
                                            setShowCustomCursor(true)
                                    }}
                                    onMouseLeave={() =>
                                        setShowCustomCursor(false)
                                    }
                                >
                                    {item}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            {showCursor && !dragRef.current.active && (
                <div
                    style={{
                        position: "fixed",
                        left: smoothCursor.x,
                        top: smoothCursor.y,
                        transform: "translate(-50%, -50%)",
                        backgroundColor: cursorBgColor,
                        color: cursorTextColor,
                        padding: cursorPadding,
                        borderRadius: cursorBorderRadius,
                        pointerEvents: "none",
                        zIndex: 10000,
                        whiteSpace: "nowrap",
                        opacity: cursorOpacity,
                        transition: "opacity 0.2s ease-out",
                        ...cursorFont,
                    }}
                >
                    {cursorText}
                </div>
            )}
        </>
    )
}

Orbit3DCarousel.displayName = "Orbit 3D Carousel"

addPropertyControls(Orbit3DCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Connect frames or components to display in the carousel. Supports up to 10 items.",
        control: { type: ControlType.ComponentInstance },
        maxCount: 10,
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        description:
            "Direction of carousel rotation. Horizontal spins left/right, vertical spins up/down.",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        description:
            "Distance of items from the center. Larger values create a wider circle with more spacing between items.",
        min: 200,
        max: 1200,
        step: 50,
        defaultValue: 600,
        unit: "px",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Speed",
        description:
            "How fast the carousel rotates when scrolling with mouse wheel. Higher values = faster rotation.",
        min: 0.01,
        max: 0.3,
        step: 0.01,
        defaultValue: 0.04,
    },
    baseTiltAngle: {
        type: ControlType.Number,
        title: "Base Tilt",
        description:
            "Initial tilt angle of the carousel. Negative values tilt backward, positive tilt forward.",
        min: -45,
        max: 45,
        step: 1,
        defaultValue: -12,
        unit: "°",
    },
    mouseTiltIntensity: {
        type: ControlType.Number,
        title: "Mouse Tilt",
        description:
            "How much the carousel tilts in response to mouse movement. Set to 0 to disable mouse tilt effect.",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 10,
    },
    touchSpeed: {
        type: ControlType.Number,
        title: "Touch Speed",
        description:
            "How fast the carousel rotates when swiping on touch devices. Higher values = more sensitive touch control.",
        min: 0.05,
        max: 0.6,
        step: 0.05,
        defaultValue: 0.25,
    },
    cardScale: {
        type: ControlType.Number,
        title: "Card Scale",
        description:
            "Scale multiplier for all carousel items. Values above 1 enlarge items, below 1 shrink them.",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    dragSpeed: {
        type: ControlType.Number,
        title: "Drag Speed",
        description:
            "How fast the carousel rotates when dragging with mouse. Higher values = more responsive dragging.",
        min: 0.05,
        max: 0.6,
        step: 0.05,
        defaultValue: 0.2,
    },
    showCursor: {
        type: ControlType.Boolean,
        title: "Show Cursor",
        description:
            "Enable custom cursor on hover. Turn this on when carousel items are clickable or contain links to improve UX.",
        defaultValue: true,
    },
    cursorText: {
        type: ControlType.String,
        title: "Cursor Text",
        description:
            "Text displayed inside the custom cursor (e.g., 'View', 'Explore', 'Click').",
        defaultValue: "View",
        hidden: (p) => !p.showCursor,
    },
    cursorBgColor: {
        type: ControlType.Color,
        title: "Cursor BG",
        description: "Background color of the custom cursor.",
        defaultValue: "#000000",
        hidden: (p) => !p.showCursor,
    },
    cursorTextColor: {
        type: ControlType.Color,
        title: "Cursor Text",
        description: "Text color of the custom cursor.",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.showCursor,
    },
    cursorPadding: {
        type: ControlType.Padding,
        title: "Cursor Padding",
        description:
            "Internal spacing around the cursor text. Adjust for comfortable visual balance.",
        defaultValue: "8px 16px",
        hidden: (p) => !p.showCursor,
    },
    cursorBorderRadius: {
        type: ControlType.Number,
        title: "Cursor Radius",
        description:
            "Corner roundness of the cursor. Higher values create more rounded corners (pill shape at 100).",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 100,
        unit: "px",
        hidden: (p) => !p.showCursor,
    },
    cursorFont: {
        type: ControlType.Font,
        title: "Cursor Font",
        description:
            "Typography settings for the cursor text including font family, size, and weight.",
        controls: "extended",
        hidden: (p) => !p.showCursor,
    },
})
