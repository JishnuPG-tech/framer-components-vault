// Multi-layout infinite scrolling gallery with circular, isometric, and classic modes
import { useEffect, useRef, useState, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface MediaItem {
    type: "image" | "video"
    src: string
    alt?: string
    link?: string
    openInNewTab?: boolean
}

interface SectionConfig {
    speed: number
    direction: number
    scale: number
    density: number
    offset: number
}

interface MultiLayoutGalleryProps {
    layoutMode: "circular" | "isometric" | "classic"
    // Media
    media: MediaItem[]
    itemLink: string
    openInNewTab: boolean
    // Circular settings
    circularRings: number
    circularGap: number
    circularGlobalSpeed: number
    circularSections: SectionConfig[]
    // Isometric settings
    isometricAngle: number
    isometricOrientation: "vertical" | "horizontal"
    isometricColumns: number
    isometricSpeed: number
    isometricDirection: number
    // Classic settings
    classicOrientation: "vertical" | "horizontal"
    classicColumns: number
    classicGap: number
    classicSections: SectionConfig[]
    // Shared settings
    autoplay: boolean
    hoverSpeedMultiplier: number
    scrollInteraction: boolean
    mediaSize: number
    mediaGap: number
    responsiveScaling: boolean
    style?: CSSProperties
}

/**
 * Multi-Layout Infinite Scrolling Gallery
 * 
 * Three distinct layout modes: Circular orbits, Isometric grid, and Classic columns
 * 
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function MultiLayoutGallery(props: MultiLayoutGalleryProps) {
    const {
        layoutMode = "circular",
        media = [
            { type: "image", src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { type: "image", src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { type: "image", src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { type: "image", src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { type: "image", src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
        ],
        itemLink = "",
        openInNewTab = false,
        circularRings = 3,
        circularGap = 80,
        circularGlobalSpeed = 1,
        circularSections = [],
        isometricAngle = 30,
        isometricOrientation = "vertical",
        isometricColumns = 4,
        isometricSpeed = 1,
        isometricDirection = 1,
        classicOrientation = "vertical",
        classicColumns = 3,
        classicGap = 20,
        classicSections = [],
        autoplay = true,
        hoverSpeedMultiplier = 0.3,
        scrollInteraction = true,
        mediaSize = 200,
        mediaGap = 20,
        responsiveScaling = true,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)
    const scrollY = useMotionValue(0)
    const isStatic = useIsStaticRenderer()
    
    // Get container dimensions for responsive centering
    const [containerSize, setContainerSize] = useState({ width: 800, height: 800 })
    
    // Calculate responsive scale factor based on viewport
    const responsiveScale = useMemo(() => {
        if (!responsiveScaling) return 1
        
        const minDimension = Math.min(containerSize.width, containerSize.height)
        
        // Mobile: < 768px
        if (minDimension < 768) {
            return Math.max(0.4, minDimension / 800)
        }
        // Tablet: 768px - 1024px
        if (minDimension < 1024) {
            return Math.max(0.6, minDimension / 1000)
        }
        // Desktop: >= 1024px
        return 1
    }, [containerSize, responsiveScaling])
    
    // Responsive media size and gap
    const responsiveMediaSize = useMemo(() => {
        return Math.max(50, mediaSize * responsiveScale)
    }, [mediaSize, responsiveScale])
    
    const responsiveMediaGap = useMemo(() => {
        return Math.max(10, mediaGap * responsiveScale)
    }, [mediaGap, responsiveScale])
    
    // Responsive circular gap
    const responsiveCircularGap = useMemo(() => {
        return Math.max(40, circularGap * responsiveScale)
    }, [circularGap, responsiveScale])
    
    // Responsive column count for mobile
    const responsiveColumns = useMemo(() => {
        const minDimension = Math.min(containerSize.width, containerSize.height)
        
        if (layoutMode === "circular") return circularRings
        
        const baseColumns = layoutMode === "isometric" ? isometricColumns : classicColumns
        
        // Mobile: reduce columns
        if (minDimension < 768) {
            return Math.max(1, Math.min(baseColumns, 2))
        }
        // Tablet: moderate reduction
        if (minDimension < 1024) {
            return Math.max(2, Math.min(baseColumns, 4))
        }
        
        return baseColumns
    }, [containerSize, layoutMode, circularRings, isometricColumns, classicColumns])
    
    useEffect(() => {
        if (!containerRef.current) return
        
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                startTransition(() => setContainerSize({ width: rect.width, height: rect.height }))
            }
        }
        
        updateSize()
        
        if (typeof window !== "undefined") {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [])

    // Handle scroll interaction
    useEffect(() => {
        if (isStatic || !scrollInteraction) return

        const handleScroll = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                const scrollProgress = -rect.top / (rect.height + window.innerHeight)
                scrollY.set(scrollProgress * 1000)
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("scroll", handleScroll)
            return () => window.removeEventListener("scroll", handleScroll)
        }
    }, [scrollInteraction, isStatic, scrollY])
    
    // Touch event handlers for mobile
    const handleTouchStart = () => {
        startTransition(() => setIsHovered(true))
    }
    
    const handleTouchEnd = () => {
        startTransition(() => setIsHovered(false))
    }

    const renderCircularLayout = () => {
        const rings = Math.min(Math.max(1, responsiveColumns), 7)
        const centerX = containerSize.width / 2
        const centerY = containerSize.height / 2

        return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {Array.from({ length: rings }).map((_, ringIndex) => {
                    const sectionConfig = circularSections[ringIndex] || {
                        speed: circularGlobalSpeed,
                        direction: 1,
                        scale: 1,
                        density: 1,
                        offset: 0,
                    }

                    const radius = (ringIndex + 1) * responsiveCircularGap
                    const itemsInRing = Math.ceil(media.length * sectionConfig.density)
                    const duplicatedMedia = Array.from({ length: itemsInRing }, (_, i) => media[i % media.length])

                    return (
                        <CircularRing
                            key={ringIndex}
                            media={duplicatedMedia}
                            radius={radius}
                            centerX={centerX}
                            centerY={centerY}
                            speed={sectionConfig.speed * (isHovered ? hoverSpeedMultiplier : 1)}
                            direction={sectionConfig.direction}
                            scale={sectionConfig.scale * responsiveScale}
                            offset={sectionConfig.offset}
                            mediaSize={responsiveMediaSize}
                            autoplay={autoplay}
                            isStatic={isStatic}
                            scrollOffset={scrollInteraction ? scrollY : undefined}
                            itemLink={itemLink}
                            openInNewTab={openInNewTab}
                        />
                    )
                })}
            </div>
        )
    }

    const renderIsometricLayout = () => {
        const columns = Math.min(Math.max(1, responsiveColumns), 7)
        const isVertical = isometricOrientation === "vertical"

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: isVertical ? "row" : "column",
                    gap: `${responsiveMediaGap}px`,
                    transform: `perspective(1000px) rotate${isVertical ? "X" : "Y"}(${isometricAngle}deg)`,
                    transformStyle: "preserve-3d",
                }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => (
                    <IsometricColumn
                        key={colIndex}
                        media={media}
                        speed={isometricSpeed * (isHovered ? hoverSpeedMultiplier : 1)}
                        direction={isometricDirection}
                        mediaSize={responsiveMediaSize}
                        mediaGap={responsiveMediaGap}
                        autoplay={autoplay}
                        isStatic={isStatic}
                        scrollOffset={scrollInteraction ? scrollY : undefined}
                        columnIndex={colIndex}
                        itemLink={itemLink}
                        openInNewTab={openInNewTab}
                    />
                ))}
            </div>
        )
    }

    const renderClassicLayout = () => {
        const columns = Math.min(Math.max(1, responsiveColumns), 7)
        const isVertical = classicOrientation === "vertical"
        const responsiveClassicGap = Math.max(10, classicGap * responsiveScale)

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: isVertical ? "row" : "column",
                    gap: `${responsiveClassicGap}px`,
                }}
            >
                {Array.from({ length: columns }).map((_, colIndex) => {
                    const sectionConfig = classicSections[colIndex] || {
                        speed: 1,
                        direction: 1,
                        scale: 1,
                        density: 1,
                        offset: 0,
                    }

                    return (
                        <ClassicColumn
                            key={colIndex}
                            media={media}
                            speed={sectionConfig.speed * (isHovered ? hoverSpeedMultiplier : 1)}
                            direction={sectionConfig.direction}
                            mediaSize={responsiveMediaSize}
                            mediaGap={responsiveMediaGap}
                            autoplay={autoplay}
                            isStatic={isStatic}
                            scrollOffset={scrollInteraction ? scrollY : undefined}
                            isVertical={isVertical}
                            offset={sectionConfig.offset * responsiveScale}
                            itemLink={itemLink}
                            openInNewTab={openInNewTab}
                        />
                    )
                })}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...props.style,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                touchAction: "pan-y",
            }}
            onMouseEnter={() => startTransition(() => setIsHovered(true))}
            onMouseLeave={() => startTransition(() => setIsHovered(false))}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {layoutMode === "circular" && renderCircularLayout()}
            {layoutMode === "isometric" && renderIsometricLayout()}
            {layoutMode === "classic" && renderClassicLayout()}
        </div>
    )
}

// Circular Ring Component
function CircularRing({
    media,
    radius,
    centerX,
    centerY,
    speed,
    direction,
    scale,
    offset,
    mediaSize,
    autoplay,
    isStatic,
    scrollOffset,
    itemLink,
    openInNewTab,
}: {
    media: MediaItem[]
    radius: number
    centerX: number
    centerY: number
    speed: number
    direction: number
    scale: number
    offset: number
    mediaSize: number
    autoplay: boolean
    isStatic: boolean
    scrollOffset?: { get: () => number }
    itemLink: string
    openInNewTab: boolean
}) {
    const [rotation, setRotation] = useState(offset)

    useEffect(() => {
        if (isStatic || !autoplay) return

        let animationFrame: number
        let lastTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const delta = (now - lastTime) / 1000
            lastTime = now

            startTransition(() => {
                setRotation((prev) => prev + speed * direction * delta * 10)
            })
            animationFrame = requestAnimFrame(animate)
        }

        animationFrame = requestAnimFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [speed, direction, autoplay, isStatic])

    const finalRotation = scrollOffset ? rotation + scrollOffset.get() * speed : rotation

    return (
        <>
            {media.map((item, index) => {
                const angle = (index / media.length) * Math.PI * 2 + (finalRotation * Math.PI) / 180
                const x = centerX + Math.cos(angle) * radius
                const y = centerY + Math.sin(angle) * radius

                return (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            left: x,
                            top: y,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                            width: mediaSize,
                            height: mediaSize,
                        }}
                    >
                        <MediaElement item={item} size={mediaSize} itemLink={itemLink} openInNewTab={openInNewTab} />
                    </div>
                )
            })}
        </>
    )
}

// Isometric Column Component
function IsometricColumn({
    media,
    speed,
    direction,
    mediaSize,
    mediaGap,
    autoplay,
    isStatic,
    scrollOffset,
    columnIndex,
    itemLink,
    openInNewTab,
}: {
    media: MediaItem[]
    speed: number
    direction: number
    mediaSize: number
    mediaGap: number
    autoplay: boolean
    isStatic: boolean
    scrollOffset?: { get: () => number }
    columnIndex: number
    itemLink: string
    openInNewTab: boolean
}) {
    const [offset, setOffset] = useState(columnIndex * 100)

    useEffect(() => {
        if (isStatic || !autoplay) return

        let animationFrame: number
        let lastTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const delta = (now - lastTime) / 1000
            lastTime = now

            startTransition(() => {
                setOffset((prev) => prev + speed * direction * delta * 50)
            })
            animationFrame = requestAnimFrame(animate)
        }

        animationFrame = requestAnimFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [speed, direction, autoplay, isStatic])

    const finalOffset = scrollOffset ? offset + scrollOffset.get() * speed : offset
    const totalHeight = media.length * (mediaSize + mediaGap)

    return (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${-finalOffset % totalHeight}px)`,
                }}
            >
                {[...media, ...media, ...media].map((item, index) => (
                    <div
                        key={index}
                        style={{
                            marginBottom: mediaGap,
                            width: "100%",
                            height: mediaSize,
                        }}
                    >
                        <MediaElement item={item} size={mediaSize} itemLink={itemLink} openInNewTab={openInNewTab} />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Classic Column Component
function ClassicColumn({
    media,
    speed,
    direction,
    mediaSize,
    mediaGap,
    autoplay,
    isStatic,
    scrollOffset,
    isVertical,
    offset: initialOffset,
    itemLink,
    openInNewTab,
}: {
    media: MediaItem[]
    speed: number
    direction: number
    mediaSize: number
    mediaGap: number
    autoplay: boolean
    isStatic: boolean
    scrollOffset?: { get: () => number }
    isVertical: boolean
    offset: number
    itemLink: string
    openInNewTab: boolean
}) {
    const [offset, setOffset] = useState(initialOffset)

    useEffect(() => {
        if (isStatic || !autoplay) return

        let animationFrame: number
        let lastTime = Date.now()

        const animate = () => {
            const now = Date.now()
            const delta = (now - lastTime) / 1000
            lastTime = now

            startTransition(() => {
                setOffset((prev) => prev + speed * direction * delta * 50)
            })
            animationFrame = requestAnimFrame(animate)
        }

        animationFrame = requestAnimFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [speed, direction, autoplay, isStatic])

    const finalOffset = scrollOffset ? offset + scrollOffset.get() * speed : offset
    const totalSize = media.length * (mediaSize + mediaGap)

    return (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: isVertical
                        ? `translateY(${-finalOffset % totalSize}px)`
                        : `translateX(${-finalOffset % totalSize}px)`,
                    display: "flex",
                    flexDirection: isVertical ? "column" : "row",
                    gap: `${mediaGap}px`,
                }}
            >
                {[...media, ...media, ...media].map((item, index) => (
                    <div
                        key={index}
                        style={{
                            width: isVertical ? "100%" : mediaSize,
                            height: isVertical ? mediaSize : "100%",
                            flexShrink: 0,
                        }}
                    >
                        <MediaElement item={item} size={mediaSize} itemLink={itemLink} openInNewTab={openInNewTab} />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Media Element Component
function MediaElement({
    item,
    size,
    itemLink,
    openInNewTab,
}: {
    item: MediaItem
    size: number
    itemLink: string
    openInNewTab: boolean
}) {
    const resolvedLink = item.link ?? itemLink
    const resolvedNewTab = item.openInNewTab ?? openInNewTab

    const wrap = (node: React.ReactNode) => {
        if (!resolvedLink) return node

        const target = resolvedNewTab ? "_blank" : undefined
        const rel = resolvedNewTab ? "noopener noreferrer" : undefined

        return (
            <a
                href={resolvedLink}
                target={target}
                rel={rel}
                style={{ display: "block", width: "100%", height: "100%" }}
                aria-label={item.alt || "Gallery item"}
            >
                {node}
            </a>
        )
    }

    if (item.type === "video") {
        return wrap(
            <video
                src={item.src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 8,
                }}
                autoPlay
                loop
                muted
                playsInline
            />
        )
    }

    return wrap(
        <img
            src={item.src}
            alt={item.alt || "Gallery image"}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
            }}
        />
    )
}

// RequestAnimationFrame polyfill
const requestAnimFrame =
    typeof window !== "undefined"
        ? window.requestAnimationFrame ||
          function (callback) {
              return window.setTimeout(callback, 1000 / 60)
          }
        : (callback) => setTimeout(callback, 1000 / 60)

addPropertyControls(MultiLayoutGallery, {
    layoutMode: {
        type: ControlType.Enum,
        title: "Layout Mode",
        options: ["circular", "isometric", "classic"],
        optionTitles: ["Circular", "Isometric", "Classic"],
        defaultValue: "circular",
        displaySegmentedControl: true,
    },
    media: {
        type: ControlType.Array,
        title: "Media",
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                src: {
                    type: ControlType.File,
                    title: "Upload File",
                    allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg", "mp4", "webm", "mov"],
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "Media item",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
                openInNewTab: {
                    type: ControlType.Boolean,
                    title: "New Tab",
                    defaultValue: false,
                    enabledTitle: "Yes",
                    disabledTitle: "No",
                    hidden: ({ link }) => !link,
                },
            },
        },
        defaultValue: [
            { type: "image", src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Image 1" },
            { type: "image", src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Image 2" },
            { type: "image", src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Image 3" },
            { type: "image", src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Image 4" },
            { type: "image", src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Image 5" },
        ],
    },
    itemLink: {
        type: ControlType.Link,
        title: "Item Link",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ itemLink }) => !itemLink,
    },
    // Circular settings
    circularRings: {
        type: ControlType.Number,
        title: "Rings",
        defaultValue: 3,
        min: 1,
        max: 7,
        step: 1,
        hidden: ({ layoutMode }) => layoutMode !== "circular",
    },
    circularGap: {
        type: ControlType.Number,
        title: "Ring Gap",
        defaultValue: 80,
        min: 40,
        max: 200,
        step: 10,
        unit: "px",
        hidden: ({ layoutMode }) => layoutMode !== "circular",
    },
    circularGlobalSpeed: {
        type: ControlType.Number,
        title: "Global Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: ({ layoutMode }) => layoutMode !== "circular",
    },
    circularSections: {
        type: ControlType.Array,
        title: "Ring Settings",
        control: {
            type: ControlType.Object,
            controls: {
                speed: {
                    type: ControlType.Number,
                    title: "Speed",
                    defaultValue: 1,
                    min: 0,
                    max: 5,
                    step: 0.1,
                },
                direction: {
                    type: ControlType.Enum,
                    title: "Direction",
                    options: [1, -1],
                    optionTitles: ["Clockwise", "Counter"],
                    defaultValue: 1,
                },
                scale: {
                    type: ControlType.Number,
                    title: "Scale",
                    defaultValue: 1,
                    min: 0.5,
                    max: 2,
                    step: 0.1,
                },
                density: {
                    type: ControlType.Number,
                    title: "Density",
                    defaultValue: 1,
                    min: 0.5,
                    max: 3,
                    step: 0.5,
                },
                offset: {
                    type: ControlType.Number,
                    title: "Offset",
                    defaultValue: 0,
                    min: 0,
                    max: 360,
                    step: 15,
                    unit: "°",
                },
            },
        },
        defaultValue: [
            { speed: 1, direction: 1, scale: 1, density: 1, offset: 0 },
            { speed: 0.8, direction: -1, scale: 0.9, density: 1.5, offset: 45 },
            { speed: 1.2, direction: 1, scale: 0.8, density: 2, offset: 90 },
        ],
        hidden: ({ layoutMode }) => layoutMode !== "circular",
    },
    // Isometric settings
    isometricAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: 30,
        min: -45,
        max: 45,
        step: 5,
        unit: "°",
        hidden: ({ layoutMode }) => layoutMode !== "isometric",
    },
    isometricOrientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
        hidden: ({ layoutMode }) => layoutMode !== "isometric",
    },
    isometricColumns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 4,
        min: 1,
        max: 7,
        step: 1,
        hidden: ({ layoutMode }) => layoutMode !== "isometric",
    },
    isometricSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 0.1,
        hidden: ({ layoutMode }) => layoutMode !== "isometric",
    },
    isometricDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: [1, -1],
        optionTitles: ["Forward", "Backward"],
        defaultValue: 1,
        displaySegmentedControl: true,
        hidden: ({ layoutMode }) => layoutMode !== "isometric",
    },
    // Classic settings
    classicOrientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
        hidden: ({ layoutMode }) => layoutMode !== "classic",
    },
    classicColumns: {
        type: ControlType.Number,
        title: "Columns",
        defaultValue: 3,
        min: 1,
        max: 7,
        step: 1,
        hidden: ({ layoutMode }) => layoutMode !== "classic",
    },
    classicGap: {
        type: ControlType.Number,
        title: "Column Gap",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
        hidden: ({ layoutMode }) => layoutMode !== "classic",
    },
    classicSections: {
        type: ControlType.Array,
        title: "Column Settings",
        control: {
            type: ControlType.Object,
            controls: {
                speed: {
                    type: ControlType.Number,
                    title: "Speed",
                    defaultValue: 1,
                    min: 0,
                    max: 5,
                    step: 0.1,
                },
                direction: {
                    type: ControlType.Enum,
                    title: "Direction",
                    options: [1, -1],
                    optionTitles: ["Forward", "Backward"],
                    defaultValue: 1,
                },
                offset: {
                    type: ControlType.Number,
                    title: "Offset",
                    defaultValue: 0,
                    min: 0,
                    max: 500,
                    step: 50,
                    unit: "px",
                },
            },
        },
        defaultValue: [
            { speed: 1, direction: 1, offset: 0 },
            { speed: 0.7, direction: -1, offset: 100 },
            { speed: 1.3, direction: 1, offset: 200 },
        ],
        hidden: ({ layoutMode }) => layoutMode !== "classic",
    },
    // Shared settings
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hoverSpeedMultiplier: {
        type: ControlType.Number,
        title: "Hover Speed",
        defaultValue: 0.3,
        min: 0,
        max: 2,
        step: 0.1,
    },
    scrollInteraction: {
        type: ControlType.Boolean,
        title: "Scroll Interaction",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    mediaSize: {
        type: ControlType.Number,
        title: "Media Size",
        defaultValue: 200,
        min: 50,
        max: 400,
        step: 10,
        unit: "px",
    },
    mediaGap: {
        type: ControlType.Number,
        title: "Media Gap",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 5,
        unit: "px",
    },
    responsiveScaling: {
        type: ControlType.Boolean,
        title: "Responsive Scaling",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
