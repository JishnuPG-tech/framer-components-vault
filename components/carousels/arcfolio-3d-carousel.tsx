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

import { motion, useMotionValue } from "framer-motion"

// User request: Create a reusable "3D Snap Carousel" with depth-based horizontal items, snap drag/wheel/keyboard navigation, infinite looping, spring transitions, clickable side items, optional autoplay/arrows/corner brackets, responsive behavior, and array-based editable content/property controls.

interface CarouselItem {
    image: string
    title: string
    category: string
    caption: string
    link?: string
}

interface MyComponentProps {
    items: CarouselItem[]
    activeWidthRatio: number
    aspectRatio: number
    gap: number
    sideScaleMin: number
    sideOpacityMin: number
    sideBlurMax: number
    falloffDistance: number
    useTilt: boolean
    maxTiltDeg: number
    showFrame: boolean
    phoneMockup: boolean
    statusBar: boolean
    frameColor: string
    frameThickness: number
    background: string
    categoryColor: string
    titleColor: string
    captionColor: string
    categoryFont: any
    titleFont: any
    captionFont: any
    autoplay: boolean
    autoplayInterval: number
    showArrows: boolean
    style?: React.CSSProperties
}

const defaultItems: CarouselItem[] = [
    {
        image: "https://images.unsplash.com/photo-1783835518094-ad4f811d3c23?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
        title: "Golden Hour",
        category: "ARCHIVAL DESIGN",
        caption: "2026",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1620122303020-87ec826cf70d?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Midnight Archive",
        category: "PORTRAIT SERIES",
        caption: "2025",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1778351983798-f750f16bcff9?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
        title: "Interior Study",
        category: "OBJECT DESIGN",
        caption: "2024",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1598897516650-e4dc73d8e417?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Quiet Frame",
        category: "PORTRAIT SERIES",
        caption: "2024",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1783835518011-4db1346a1121?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=900",
        title: "Green Hour",
        category: "ARCHIVAL DESIGN",
        caption: "2023",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1536924430914-91f9e2041b83?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Hidden Gaze",
        category: "PORTRAIT SERIES",
        caption: "2023",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1638638977172-9f7169a77930?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Still Dark",
        category: "PORTRAIT SERIES",
        caption: "2022",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1656275925082-a1222ab189c7?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Adorned",
        category: "PORTRAIT SERIES",
        caption: "2022",
        link: "",
    },
    {
        image: "https://images.unsplash.com/photo-1567226028173-20eb319d0bac?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=600",
        title: "Field Notes",
        category: "PORTRAIT SERIES",
        caption: "2021",
        link: "",
    },
]

function mod(value: number, length: number): number {
    if (length <= 0) return 0
    return ((value % length) + length) % length
}

function wrappedDistance(index: number, active: number, length: number): number {
    if (length <= 1) return 0
    const direct = index - active
    const wrapPositive = direct + length
    const wrapNegative = direct - length
    const candidates = [direct, wrapPositive, wrapNegative]
    return candidates.reduce((best, current) => (Math.abs(current) < Math.abs(best) ? current : best))
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function ThreeDSnapCarousel(props: MyComponentProps) {
    const {
        items = defaultItems,
        activeWidthRatio = 0.42,
        aspectRatio = 1.35,
        gap = 26,
        sideScaleMin = 0.58,
        sideOpacityMin = 0.24,
        sideBlurMax = 8,
        falloffDistance = 3,
        useTilt = true,
        maxTiltDeg = 18,
        showFrame = true,
        phoneMockup = true,
        statusBar = true,
        frameColor = "#000000",
        frameThickness = 12,
        background = "rgba(0,0,0,0)",
        categoryColor = "#CCCCCC",
        titleColor = "#000000",
        captionColor = "#CCCCCC",
        categoryFont,
        titleFont,
        captionFont,
        autoplay = false,
        autoplayInterval = 2600,
        showArrows = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const wheelAccumRef = React.useRef(0)
    const [containerWidth, setContainerWidth] = React.useState(800)
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const dragOffset = useMotionValue(0)
    const count = Math.max(1, items.length)

    const setRelativeIndex = React.useCallback((delta: number) => {
        React.startTransition(() => setActiveIndex((prev) => prev + delta))
    }, [])

    const setNearestTarget = React.useCallback(
        (itemIndex: number) => {
            const activeReal = mod(activeIndex, count)
            const distance = wrappedDistance(itemIndex, activeReal, count)
            React.startTransition(() => setActiveIndex((prev) => prev + distance))
        },
        [activeIndex, count]
    )

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const element = containerRef.current
        if (!element) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width
            if (!width) return
            React.startTransition(() => setContainerWidth(width))
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        if (isStatic || !autoplay || count <= 1) return
        const id = window.setInterval(() => {
            React.startTransition(() => setActiveIndex((prev) => prev + 1))
        }, Math.max(900, autoplayInterval))
        return () => window.clearInterval(id)
    }, [autoplay, autoplayInterval, count, isStatic])

    const activeRealIndex = React.useMemo(() => mod(activeIndex, count), [activeIndex, count])
    const activeItem = items[activeRealIndex] ?? defaultItems[0]
    const activeWidth = Math.max(140, containerWidth * activeWidthRatio)
    const activeHeight = activeWidth / Math.max(0.2, aspectRatio)
    const step = activeWidth + gap

    const onWheel = React.useCallback(
        (event: React.WheelEvent<HTMLDivElement>) => {
            if (isStatic || count <= 1) return
            const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
            wheelAccumRef.current += delta
            if (Math.abs(wheelAccumRef.current) > 52) {
                const direction = wheelAccumRef.current > 0 ? 1 : -1
                setRelativeIndex(direction)
                wheelAccumRef.current = 0
            }
        },
        [count, isStatic, setRelativeIndex]
    )

    const onKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (!isFocused && !isHovered) return
            if (event.key === "ArrowRight") {
                event.preventDefault()
                setRelativeIndex(1)
            } else if (event.key === "ArrowLeft") {
                event.preventDefault()
                setRelativeIndex(-1)
            }
        },
        [isFocused, isHovered, setRelativeIndex]
    )

    const dragEnabled = !isStatic && count > 1

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onWheel={onWheel}
            onKeyDown={onKeyDown}
            onMouseEnter={() => React.startTransition(() => setIsHovered(true))}
            onMouseLeave={() => React.startTransition(() => setIsHovered(false))}
            onFocus={() => React.startTransition(() => setIsFocused(true))}
            onBlur={() => React.startTransition(() => setIsFocused(false))}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                outline: "none",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    width: "max-content",
                    minWidth: "max-content",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        color: categoryColor,
                        textTransform: "uppercase",
                        ...categoryFont,
                    }}
                >
                    {activeItem?.category}
                </div>
                <div style={{ color: titleColor, marginTop: 4, ...titleFont }}>{activeItem?.title}</div>
            </div>

            <motion.div
                drag={dragEnabled ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDragStart={() => dragOffset.set(0)}
                onDrag={(_, info) => dragOffset.set(info.offset.x)}
                onDragEnd={(_, info) => {
                    const velocity = info.velocity.x
                    const projected = info.offset.x + velocity * 0.12
                    const moved = Math.round(-projected / Math.max(step, 1))
                    const clamped = Math.max(-3, Math.min(3, moved))
                    if (clamped !== 0) setRelativeIndex(clamped)
                    dragOffset.set(0)
                }}
                style={{
                    position: "absolute",
                    inset: 0,
                    cursor: dragEnabled ? "grab" : "default",
                }}
            >
                {items.map((item, i) => {
                    const d = wrappedDistance(i, activeRealIndex, count)
                    const absD = Math.abs(d)
                    const t = Math.min(absD / Math.max(1, falloffDistance), 1)
                    const scale = 1 - (1 - sideScaleMin) * t
                    const opacity = 1 - (1 - sideOpacityMin) * t
                    const blur = sideBlurMax * t
                    const rotateY = useTilt ? -Math.sign(d) * maxTiltDeg * t : 0
                    const x = d * step
                    const isActive = d === 0
                    const usePhoneShell = phoneMockup && isActive
                    const phoneBezel = Math.max(6, frameThickness)
                    const outerRadius = Math.max(20, activeWidth * 0.18)
                    const innerRadius = Math.max(14, outerRadius - phoneBezel * 0.75)
                    const shellInset = Math.max(3, phoneBezel * 0.32)

                    const content = (
                        <img
                            src={item.image}
                            alt={item.title || ""}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    )

                    return (
                        <motion.div
                            key={`${item.title}-${i}`}
                            animate={{
                                x,
                                scale,
                                opacity,
                                filter: `blur(${blur}px)`,
                                rotateY,
                                zIndex: 200 - absD,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 280,
                                damping: 28,
                                mass: 0.85,
                            }}
                            onClick={() => setNearestTarget(i)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: activeWidth,
                                height: activeHeight,
                                transformStyle: "preserve-3d",
                                transformPerspective: 1100,
                                translateX: "-50%",
                                translateY: "-50%",
                                borderRadius: usePhoneShell ? outerRadius : 10,
                                overflow: "visible",
                                pointerEvents: "auto",
                                cursor: isActive ? "default" : "pointer",
                                background: usePhoneShell ? frameColor : "#F5F5F5",
                            }}
                        >
                            {usePhoneShell ? (
                                <>
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: shellInset,
                                            borderRadius: innerRadius,
                                            overflow: "hidden",
                                            background: "#000000",
                                        }}
                                    >
                                        {item.link ? (
                                            <a
                                                href={item.link}
                                                style={{ display: "block", width: "100%", height: "100%" }}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {content}
                                            </a>
                                        ) : (
                                            content
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            position: "absolute",
                                            right: -2,
                                            top: "34%",
                                            width: Math.max(2, phoneBezel * 0.18),
                                            height: Math.max(26, activeHeight * 0.18),
                                            borderRadius: 999,
                                            background: frameColor,
                                            pointerEvents: "none",
                                            opacity: 0.8,
                                        }}
                                    />

                                    {statusBar && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: Math.max(shellInset + 5, phoneBezel * 0.5),
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                width: Math.max(activeWidth * 0.24, 70),
                                                height: Math.max(activeHeight * 0.05, 16),
                                                borderRadius: 999,
                                                background: frameColor,
                                                boxShadow: "0 1px 2px rgba(0,0,0,0.35)",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                </>
                            ) : item.link ? (
                                <a
                                    href={item.link}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        height: "100%",
                                        borderRadius: 10,
                                        overflow: "hidden",
                                    }}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {content}
                                </a>
                            ) : (
                                <div style={{ width: "100%", height: "100%", borderRadius: 10, overflow: "hidden" }}>
                                    {content}
                                </div>
                            )}

                            {showFrame && isActive && !phoneMockup && (
                                <>
                                    {[
                                        { top: 8, left: 8, bt: true, bl: true, br: false, bb: false },
                                        { top: 8, right: 8, bt: true, bl: false, br: true, bb: false },
                                        { bottom: 8, left: 8, bt: false, bl: true, br: false, bb: true },
                                        { bottom: 8, right: 8, bt: false, bl: false, br: true, bb: true },
                                    ].map((corner, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                position: "absolute",
                                                width: 20,
                                                height: 20,
                                                top: corner.top,
                                                right: corner.right,
                                                bottom: corner.bottom,
                                                left: corner.left,
                                                borderColor: frameColor,
                                                borderStyle: "solid",
                                                borderTopWidth: corner.bt ? frameThickness : 0,
                                                borderRightWidth: corner.br ? frameThickness : 0,
                                                borderBottomWidth: corner.bb ? frameThickness : 0,
                                                borderLeftWidth: corner.bl ? frameThickness : 0,
                                                pointerEvents: "none",
                                            }}
                                        />
                                    ))}
                                </>
                            )}
                        </motion.div>
                    )
                })}
            </motion.div>

            <div
                style={{
                    position: "absolute",
                    bottom: 14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                    width: "max-content",
                    minWidth: "max-content",
                    pointerEvents: "none",
                    color: captionColor,
                    ...captionFont,
                }}
            >
                {activeItem?.caption}
            </div>

            {showArrows && count > 1 && (
                <>
                    <button
                        aria-label="Previous item"
                        onClick={() => setRelativeIndex(-1)}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            border: "1px solid #EEEEEE",
                            background: "#FFFFFF",
                            color: "#000000",
                            cursor: "pointer",
                        }}
                    >
                        ‹
                    </button>
                    <button
                        aria-label="Next item"
                        onClick={() => setRelativeIndex(1)}
                        style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            border: "1px solid #EEEEEE",
                            background: "#FFFFFF",
                            color: "#000000",
                            cursor: "pointer",
                        }}
                    >
                        ›
                    </button>
                </>
            )}
        </div>
    )
}

addPropertyControls(ThreeDSnapCarousel, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image" },
                title: { type: ControlType.String, title: "Title", defaultValue: "Carousel Item" },
                category: { type: ControlType.String, title: "Category", defaultValue: "CATEGORY" },
                caption: { type: ControlType.String, title: "Caption", defaultValue: "2026" },
                link: { type: ControlType.String, title: "Link", defaultValue: "" },
            },
        },
        defaultValue: defaultItems,
        maxCount: 12,
    },
    activeWidthRatio: {
        type: ControlType.Number,
        title: "Active Width",
        defaultValue: 0.42,
        min: 0.2,
        max: 0.9,
        step: 0.01,
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect",
        defaultValue: 1.35,
        min: 0.5,
        max: 2.4,
        step: 0.01,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 26,
        min: 0,
        max: 120,
        step: 1,
    },
    sideScaleMin: {
        type: ControlType.Number,
        title: "Side Scale",
        defaultValue: 0.58,
        min: 0.2,
        max: 1,
        step: 0.01,
    },
    sideOpacityMin: {
        type: ControlType.Number,
        title: "Side Opacity",
        defaultValue: 0.24,
        min: 0,
        max: 1,
        step: 0.01,
    },
    sideBlurMax: {
        type: ControlType.Number,
        title: "Max Blur",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 0.5,
    },
    falloffDistance: {
        type: ControlType.Number,
        title: "Falloff",
        defaultValue: 3,
        min: 1,
        max: 8,
        step: 1,
    },
    useTilt: {
        type: ControlType.Boolean,
        title: "3D Tilt",
        defaultValue: true,
    },
    maxTiltDeg: {
        type: ControlType.Number,
        title: "Tilt °",
        defaultValue: 18,
        min: 0,
        max: 45,
        step: 1,
        hidden: (props) => !props.useTilt,
    },
    showFrame: {
        type: ControlType.Boolean,
        title: "Frame",
        defaultValue: true,
    },
    phoneMockup: {
        type: ControlType.Boolean,
        title: "Phone Mockup",
        defaultValue: true,
    },
    statusBar: {
        type: ControlType.Boolean,
        title: "Show Status Bar/Notch",
        defaultValue: true,
        hidden: (props) => !props.phoneMockup,
    },
    frameColor: {
        type: ControlType.Color,
        title: "Frame Color",
        defaultValue: "#000000",
        hidden: (props) => !props.showFrame && !props.phoneMockup,
    },
    frameThickness: {
        type: ControlType.Number,
        title: "Frame W",
        defaultValue: 12,
        min: 1,
        max: 28,
        step: 1,
        hidden: (props) => !props.showFrame && !props.phoneMockup,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
    },
    categoryColor: {
        type: ControlType.Color,
        title: "Category",
        defaultValue: "#CCCCCC",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title",
        defaultValue: "#000000",
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption",
        defaultValue: "#CCCCCC",
    },
    categoryFont: {
        type: ControlType.Font,
        title: "Category Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            variant: "Medium",
            letterSpacing: "0.08em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
            textAlign: "center",
        },
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 13,
            variant: "Medium",
            letterSpacing: "0.02em",
            lineHeight: "1em",
            textAlign: "center",
        },
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
    },
    autoplayInterval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 2600,
        min: 900,
        max: 8000,
        step: 100,
        unit: "ms",
        hidden: (props) => !props.autoplay,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
})