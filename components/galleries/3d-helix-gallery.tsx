import React, { useState, useEffect, useRef, useMemo, memo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */

// --- Fallback Items ---
const FALLBACK_ITEMS = [
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_10.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_11.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_12.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_13.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_14.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_15.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_16.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_17.webp",
    },
    {
        type: "image",
        image: "https://d3kuxj311ts9a8.cloudfront.net/Framer/Images/styled/styled_image_18.webp",
    },
]

// --- Sub-Component: SpiralCard ---
const SpiralCard = memo(
    ({
        item,
        index,
        totalItems,
        radius,
        spiralHeight,
        rotations,
        borderRadius,
        itemWidth,
        itemHeight,
        grayscaleInactive,
        activeSaturate,
        isHovered,
        hoverEnabled,
        onHover,
        onLeave,
        isCanvas,
    }: any) => {
        const videoRef = useRef<HTMLVideoElement>(null)

        const angleStep = (Math.PI * 2 * rotations) / totalItems
        const baseAngle = angleStep * index
        const y = (index - totalItems / 2) * (spiralHeight / totalItems)

        useEffect(() => {
            const vid = videoRef.current
            if (item?.type === "video" && vid && !isCanvas) {
                if (item.autoPlay) {
                    vid.play().catch(() => {})
                } else if (item.playOnHover && hoverEnabled) {
                    if (isHovered) {
                        vid.play().catch(() => {})
                    } else {
                        vid.pause()
                        vid.currentTime = 0
                    }
                }
            }
        }, [isHovered, item, hoverEnabled, isCanvas])

        const isVideo = item.type === "video"
        const mediaSrc = isVideo ? item.video : item.image
        const posterSrc = isVideo ? item.image : undefined

        if (!mediaSrc && !posterSrc) return null

        const Content = (
            <div
                onMouseEnter={() => !isCanvas && hoverEnabled && onHover(index)}
                onMouseLeave={() => !isCanvas && hoverEnabled && onLeave()}
                style={{
                    position: "absolute",
                    width: `${itemWidth}px`,
                    height: `${itemHeight}px`,
                    left: `50%`,
                    top: `50%`,
                    marginLeft: `-${itemWidth / 2}px`,
                    marginTop: `-${itemHeight / 2}px`,
                    transformStyle: "preserve-3d",
                    transform: `
                        rotateY(calc(${baseAngle}rad + var(--scroll-offset, 0rad))) 
                        translateZ(${radius}px) 
                        translateY(${y}px)
                        scale(${isHovered && hoverEnabled && !isCanvas ? 1.1 : 1})
                    `,
                    transition: `transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.6s ease`,
                    zIndex: 1,
                    cursor: "default",
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    backgroundColor: "#111",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                    }}
                >
                    {!isVideo ? (
                        <img
                            src={mediaSrc}
                            alt=""
                            draggable="false"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter:
                                    isHovered && hoverEnabled && !isCanvas
                                        ? `grayscale(0%) saturate(${activeSaturate})`
                                        : grayscaleInactive
                                          ? "grayscale(100%)"
                                          : "none",
                            }}
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            src={mediaSrc}
                            poster={posterSrc}
                            muted
                            loop
                            playsInline
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter:
                                    isHovered && hoverEnabled && !isCanvas
                                        ? `grayscale(0%) saturate(${activeSaturate})`
                                        : grayscaleInactive
                                          ? "grayscale(100%)"
                                          : "none",
                            }}
                        />
                    )}
                </div>
            </div>
        )

        if (item.link) {
            return <Link href={item.link}>{Content}</Link>
        }

        return Content
    }
)

// --- Main Component ---
export default function PerspectiveSpiralGallery(props) {
    const {
        items = [],
        radius = 520,
        spiralHeight = 817,
        rotations = 2.4,
        itemWidth = 174,
        itemHeight = 222,
        borderRadius = 12,
        perspective = 1500,
        autoRotateSpeed = 0.05,
        friction = 0.96,
        dragSensitivity = 0.01,
        enableDrag = true,
        enableHover = false,
        enableTilt = false,
        enableScroll = true,
        scrollSpeed = 0.002,
        grayscaleInactive = false,
        activeSaturate = 1.2,
        style,
    } = props

    // Apply established pattern
    const activeItems = !items || items.length === 0 ? FALLBACK_ITEMS : items

    const resolvedWidth =
        style?.width && style.width !== "100%" && style.width !== "auto"
            ? style.width
            : 800

    const resolvedHeight =
        style?.height && style.height !== "100%" && style.height !== "auto"
            ? style.height
            : 800

    const containerRef = useRef<HTMLDivElement>(null)
    const [hoverIndex, setHoverIndex] = useState<number>(-1)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)

    const scrollOffsetRef = useRef(0)
    const velocityRef = useRef(0)
    const lastDragX = useRef(0)
    const lastScrollY = useRef(0)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        let lastTime = performance.now()
        let frameId: number

        const update = (time: number) => {
            const dt = Math.min(time - lastTime, 60) / 16
            lastTime = time

            if (!isDragging) {
                velocityRef.current *= Math.pow(friction, dt)
                if (Math.abs(velocityRef.current) < 0.0001)
                    velocityRef.current = 0
                scrollOffsetRef.current +=
                    (velocityRef.current + autoRotateSpeed * 0.1) * dt
            }

            if (containerRef.current) {
                containerRef.current.style.setProperty(
                    "--scroll-offset",
                    `${scrollOffsetRef.current}rad`
                )
            }
            frameId = requestAnimationFrame(update)
        }

        frameId = requestAnimationFrame(update)
        return () => cancelAnimationFrame(frameId)
    }, [isDragging, friction, autoRotateSpeed])

    useEffect(() => {
        if (!enableScroll) return
        const handleScroll = () => {
            const diff = window.scrollY - lastScrollY.current
            scrollOffsetRef.current += diff * scrollSpeed
            lastScrollY.current = window.scrollY
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [enableScroll, scrollSpeed])

    const handleStart = (e: any) => {
        if (!enableDrag) return
        setIsDragging(true)
        lastDragX.current = e.touches ? e.touches[0].clientX : e.clientX
        velocityRef.current = 0
    }

    const handleMove = (e: any) => {
        const x = e.touches ? e.touches[0].clientX : e.clientX
        const y = e.touches ? e.touches[0].clientY : e.clientY

        if (enableTilt) {
            setMousePos({
                x: (x / window.innerWidth - 0.5) * 2,
                y: (y / window.innerHeight - 0.5) * 2,
            })
        }

        if (isDragging && enableDrag) {
            const deltaX = x - lastDragX.current
            const angleDelta = deltaX * dragSensitivity
            scrollOffsetRef.current += angleDelta
            velocityRef.current = angleDelta
            lastDragX.current = x
        }
    }

    const spiralItems = useMemo(() => {
        if (activeItems.length === 0) return []
        let list = [...activeItems]
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 600
        const minCount = isMobile ? 16 : 28
        while (list.length < minCount) {
            list = [...list, ...activeItems]
        }
        return list
    }, [activeItems])

    return (
        <div
            style={{
                width: resolvedWidth,
                height: resolvedHeight,
                ...style,
                position: "relative",
            }}
        >
            <div
                ref={containerRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => {
                    setIsDragging(false)
                    setMousePos({ x: 0, y: 0 })
                }}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={() => setIsDragging(false)}
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    perspective: `${perspective}px`,
                    touchAction: "pan-y",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    cursor: "default",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        transform: `rotateX(${-mousePos.y * 10}deg) rotateY(${mousePos.x * 6}deg)`,
                        transition: "transform 0.5s ease-out",
                        willChange: "transform",
                    }}
                >
                    {spiralItems.map((item, i) => (
                        <SpiralCard
                            key={`${i}`}
                            item={item}
                            index={i}
                            totalItems={spiralItems.length}
                            radius={radius}
                            spiralHeight={spiralHeight}
                            rotations={rotations}
                            itemWidth={itemWidth}
                            itemHeight={itemHeight}
                            borderRadius={borderRadius}
                            grayscaleInactive={grayscaleInactive}
                            activeSaturate={activeSaturate}
                            isHovered={hoverIndex === i}
                            hoverEnabled={enableHover}
                            onHover={setHoverIndex}
                            onLeave={() => setHoverIndex(-1)}
                            isCanvas={isCanvas}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

PerspectiveSpiralGallery.defaultProps = {
    items: [],
    radius: 520,
    spiralHeight: 817,
    rotations: 2.4,
    itemWidth: 174,
    itemHeight: 222,
    borderRadius: 12,
    perspective: 1500,
    autoRotateSpeed: 0.01,
    friction: 0.96,
    dragSensitivity: 0.005,
    enableDrag: true,
    enableHover: false,
    enableTilt: false,
    enableScroll: true,
    scrollSpeed: 0.002,
    grayscaleInactive: false,
    activeSaturate: 1.2,
}

addPropertyControls(PerspectiveSpiralGallery, {
    items: {
        type: ControlType.Array,
        title: "Collection",
        description:
            "Add media items to the 3D spiral. Uses the Image/Poster field as the UI thumbnail.",
        defaultValue: [],
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    options: ["image", "video"],
                    title: "Type",
                    defaultValue: "image",
                    description:
                        "Select whether this card displays a static image or a video.",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image / Poster",
                },
                video: {
                    type: ControlType.File,
                    allowedFileTypes: ["mp4", "mov", "webm"],
                    title: "Video File",
                    hidden: (p) => p.type !== "video",
                },
                autoPlay: {
                    type: ControlType.Boolean,
                    title: "Auto Play",
                    defaultValue: true,
                    hidden: (p) => p.type !== "video",
                },
                playOnHover: {
                    type: ControlType.Boolean,
                    title: "Play on Hover",
                    defaultValue: false,
                    description:
                        "Only plays the video when the user hovers over the card.",
                    hidden: (p) => p.type !== "video" || p.autoPlay === true,
                },
            },
        },
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 100,
        description: "Rounds the corners of the cards.",
    },
    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        description: "Allow users to spin the spiral by clicking and dragging.",
    },
    enableHover: {
        type: ControlType.Boolean,
        title: "Enable Hover",
        description:
            "Activates scale and color transitions when hovering over cards.",
    },
    enableTilt: {
        type: ControlType.Boolean,
        title: "Enable 3D Tilt",
        description:
            "Tilts the entire spiral based on the user's mouse position.",
    },
    enableScroll: {
        type: ControlType.Boolean,
        title: "Enable Scroll",
        description:
            "Spins the spiral based on the vertical scroll of the webpage.",
    },
    scrollSpeed: {
        type: ControlType.Number,
        title: "Scroll Sens.",
        min: 0,
        max: 0.05,
        step: 0.001,
        hidden: (p) => !p.enableScroll,
        description: "How much page scrolling rotates the spiral.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 100,
        max: 2000,
        description: "The width of the overall circle spacing the items.",
    },
    spiralHeight: {
        type: ControlType.Number,
        title: "Helix Height",
        min: 200,
        max: 8000,
        description:
            "The total vertical height stretching from the first card to the last.",
    },
    rotations: {
        type: ControlType.Number,
        title: "Total Loops",
        min: 0.5,
        max: 15,
        step: 0.1,
        description: "How many full 360-degree loops the spiral makes.",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Card Width",
        min: 50,
        max: 1000,
        description: "The width of each individual card.",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 50,
        max: 1200,
        description: "The height of each individual card.",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        min: 500,
        max: 6000,
        description:
            "3D perspective depth. Lower numbers create extreme distortion.",
    },
    autoRotateSpeed: {
        type: ControlType.Number,
        title: "Base Drift",
        min: -1,
        max: 1,
        step: 0.01,
        description:
            "Constant automatic spinning speed. Use 0 to keep it still.",
    },
    grayscaleInactive: {
        type: ControlType.Boolean,
        title: "B&W Inactive",
        description: "Turns non-hovered cards black and white.",
    },
})
