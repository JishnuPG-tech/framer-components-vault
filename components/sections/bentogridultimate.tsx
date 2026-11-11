import { useMemo, type CSSProperties } from "react"
import { motion, useInView } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useRef, useState, useEffect } from "react"

// Default images for tiles
const defaultImages = [
    { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Gradient Blue" },
    { src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg", alt: "Gradient Purple" },
    { src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg", alt: "Gradient Orange" },
    { src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg", alt: "Gradient Yellow" },
    { src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg", alt: "Gradient Green" },
    { src: "https://framerusercontent.com/images/Pcm1tX8m1NFml6BzXz15P7GI.jpg", alt: "Gradient Pink" },
]

type TileSize = "1x1" | "2x1" | "1x2" | "2x2"

interface TileData {
    id?: string
    size: TileSize
    title: string
    label: string
    description: string
    image?: { src: string; alt: string }
    backgroundColor?: string
    titleColor?: string
    labelColor?: string
    descriptionColor?: string
    labelBackgroundColor?: string
    hasImage?: boolean
    overlayOpacity?: number
    link?: string
    linkTarget?: "_blank" | "_self"
    onClick?: () => void
}

interface ProcessedTile {
    id: string
    size: TileSize
    title: string
    label: string
    description: string
    image?: { src: string; alt: string }
    backgroundColor: string
    titleColor: string
    labelColor: string
    descriptionColor: string
    labelBackgroundColor: string
    hasImage: boolean
    overlayOpacity: number
    link?: string
    linkTarget: "_blank" | "_self"
    onClick?: () => void
}

interface BentoGridProps {
    tiles: TileData[]
    gap: number
    borderRadius: number
    maxWidth: number
    enableAnimation: boolean
    animationDelay: number
    animationDuration: number
    hoverScale: number
    hoverBrightness: number
    mobileBreakpoint: number
    tabletBreakpoint: number
    titleFont: any
    labelFont: any
    descriptionFont: any
    padding: string
    useViewportHeight: boolean
    viewportHeightPercentage: number
    style?: CSSProperties
}

// Default tile configuration without image/color fields
const defaultTileConfigs: Omit<TileData, 'id' | 'image' | 'backgroundColor' | 'titleColor' | 'labelColor' | 'descriptionColor' | 'labelBackgroundColor'>[] = [
    { size: "2x2", title: "Feature One", label: "New", description: "Discover the amazing capabilities of our platform", hasImage: true, overlayOpacity: 0.3, link: "", linkTarget: "_self" },
    { size: "1x1", title: "Fast", label: "", description: "Lightning speed", hasImage: true, overlayOpacity: 0.2, link: "", linkTarget: "_self" },
    { size: "1x1", title: "Secure", label: "", description: "Enterprise grade", hasImage: true, overlayOpacity: 0.2, link: "", linkTarget: "_self" },
    { size: "2x1", title: "Collaboration", label: "Popular", description: "Work together seamlessly with your team", hasImage: true, overlayOpacity: 0.35, link: "", linkTarget: "_self" },
    { size: "1x2", title: "Analytics", label: "", description: "Deep insights into your data", hasImage: true, overlayOpacity: 0.3, link: "", linkTarget: "_self" },
    { size: "1x1", title: "Mobile", label: "", description: "On the go", hasImage: true, overlayOpacity: 0.2, link: "", linkTarget: "_self" },
    { size: "1x1", title: "Cloud", label: "", description: "Always available", hasImage: true, overlayOpacity: 0.2, link: "", linkTarget: "_self" },
]

// Build full default tiles with all required fields
const buildDefaultTiles = (): TileData[] => {
    return defaultTileConfigs.map((config, index) => ({
        ...config,
        id: `tile-${index}`,
        image: defaultImages[index % defaultImages.length],
        backgroundColor: "#F5F5F7",
        titleColor: "#FFFFFF",
        labelColor: "#000000",
        descriptionColor: "#FFFFFF",
        labelBackgroundColor: "#FFFFFF",
    }))
}

/**
 * Bento Grid
 * 
 * An asymmetric tile gallery inspired by Apple's product pages.
 * Features mixed tile sizes, hover animations, and responsive layouts.
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function BentoGrid(props: BentoGridProps) {
    const {
        tiles: inputTiles,
        gap = 16,
        borderRadius = 16,
        maxWidth = 1200,
        enableAnimation = true,
        animationDelay = 0.1,
        animationDuration = 0.6,
        hoverScale = 1.02,
        hoverBrightness = 1.1,
        mobileBreakpoint = 640,
        tabletBreakpoint = 1024,
        titleFont,
        labelFont,
        descriptionFont,
        padding = "0px",
        useViewportHeight = false,
        viewportHeightPercentage = 100,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const isInView = useInView(containerRef, { once: true, amount: 0.1 })
    const isStatic = useIsStaticRenderer()
    const [windowWidth, setWindowWidth] = useState(1200)

    // Handle window resize for responsive calculations
    useEffect(() => {
        if (typeof window === "undefined") return
        
        const handleResize = () => {
            setWindowWidth(window.innerWidth)
        }
        
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Process tiles with defaults
    const processedTiles: ProcessedTile[] = useMemo(() => {
        const tilesToProcess = inputTiles && inputTiles.length > 0 ? inputTiles : buildDefaultTiles()
        
        return tilesToProcess.slice(0, 9).map((tile, index) => ({
            id: tile.id || `tile-${index}`,
            size: tile.size || "1x1",
            title: tile.title || "",
            label: tile.label || "",
            description: tile.description || "",
            image: tile.hasImage !== false 
                ? (tile.image || defaultImages[index % defaultImages.length])
                : undefined,
            backgroundColor: tile.backgroundColor || "#F5F5F7",
            titleColor: tile.titleColor || "#FFFFFF",
            labelColor: tile.labelColor || "#000000",
            descriptionColor: tile.descriptionColor || "#FFFFFF",
            labelBackgroundColor: tile.labelBackgroundColor || "#FFFFFF",
            hasImage: tile.hasImage !== false,
            overlayOpacity: tile.overlayOpacity ?? 0.3,
            link: tile.link || "",
            linkTarget: tile.linkTarget || "_self",
            onClick: tile.onClick,
        }))
    }, [inputTiles])

    const getTileGridStyles = (size: TileSize): CSSProperties => {
        const isMobile = windowWidth < mobileBreakpoint
        const isTablet = windowWidth < tabletBreakpoint && windowWidth >= mobileBreakpoint
        
        if (isMobile) {
            return { gridColumn: "span 1", gridRow: "span 1", aspectRatio: "16/9" }
        }
        
        if (isTablet) {
            // On tablet, simplify layout
            if (size === "2x2" || size === "2x1") {
                return { gridColumn: "span 2", gridRow: "span 1", aspectRatio: "2/1" }
            }
            if (size === "1x2") {
                return { gridColumn: "span 1", gridRow: "span 2", aspectRatio: "1/2" }
            }
            return { gridColumn: "span 1", gridRow: "span 1", aspectRatio: "1/1" }
        }

        // Desktop layout
        switch (size) {
            case "2x2":
                return { gridColumn: "span 2", gridRow: "span 2", aspectRatio: "1/1" }
            case "2x1":
                return { gridColumn: "span 2", gridRow: "span 1", aspectRatio: "2/1" }
            case "1x2":
                return { gridColumn: "span 1", gridRow: "span 2", aspectRatio: "1/2" }
            case "1x1":
            default:
                return { gridColumn: "span 1", gridRow: "span 1", aspectRatio: "1/1" }
        }
    }

    const containerStyles: CSSProperties = {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: `${gap}px`,
        width: "100%",
        margin: "0 auto",
        padding: padding,
        boxSizing: "border-box",
        ...(useViewportHeight && { height: `${viewportHeightPercentage}vh` }),
        ...style,
    }

    // Responsive grid styles using media queries via CSS
    const responsiveStyles = `
        @media (max-width: ${tabletBreakpoint - 1}px) {
            .bento-grid {
                grid-template-columns: repeat(2, 1fr) !important;
            }
            .bento-tile-2x2, .bento-tile-2x1 {
                grid-column: span 2 !important;
                aspect-ratio: 2/1 !important;
            }
            .bento-tile-1x2 {
                grid-row: span 2 !important;
                aspect-ratio: 1/2 !important;
            }
        }
        @media (max-width: ${mobileBreakpoint - 1}px) {
            .bento-grid {
                grid-template-columns: 1fr !important;
            }
            .bento-tile-2x2, .bento-tile-2x1, .bento-tile-1x2, .bento-tile-1x1 {
                grid-column: span 1 !important;
                grid-row: span 1 !important;
                aspect-ratio: 16/9 !important;
            }
        }
    `

    return (
        <>
            <style>{responsiveStyles}</style>
            <div ref={containerRef} className="bento-grid" style={containerStyles}>
                {processedTiles.map((tile, index) => {
                    const tileClass = `bento-tile-${tile.size}`
                    const shouldAnimate = enableAnimation && !isStatic && isInView
                    
                    const handleTileClick = (e: React.MouseEvent) => {
                        // If there's a custom onClick handler, call it
                        if (tile.onClick) {
                            e.preventDefault()
                            tile.onClick()
                            return
                        }
                        
                        // If there's a link, handle navigation
                        if (tile.link) {
                            if (tile.linkTarget === "_blank") {
                                e.preventDefault()
                                if (typeof window !== "undefined") {
                                    window.open(tile.link, "_blank", "noopener,noreferrer")
                                }
                            }
                            // For _self, let the default anchor behavior handle it
                        }
                    }
                    
                    const TileWrapper = tile.link && !tile.onClick ? "a" : "div"
                    const wrapperProps = tile.link && !tile.onClick ? {
                        href: tile.link,
                        target: tile.linkTarget,
                        rel: tile.linkTarget === "_blank" ? "noopener noreferrer" : undefined,
                        onClick: handleTileClick,
                    } : {
                        onClick: tile.onClick || (tile.link ? handleTileClick : undefined),
                    }
                    
                    return (
                        <motion.div
                            key={tile.id}
                            className={tileClass}
                            style={{
                                position: "relative",
                                borderRadius: `${borderRadius}px`,
                                overflow: "hidden",
                                ...getTileGridStyles(tile.size),
                            }}
                            initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
                            animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                            transition={{
                                duration: animationDuration,
                                delay: index * animationDelay,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            whileHover={!isStatic ? { 
                                scale: hoverScale,
                                filter: `brightness(${hoverBrightness})`,
                            } : undefined}
                        >
                            <TileWrapper
                                {...wrapperProps}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    cursor: (tile.link || tile.onClick) ? "pointer" : "default",
                                    textDecoration: "none",
                                    color: "inherit",
                                    display: "block",
                                    backgroundColor: tile.hasImage ? undefined : tile.backgroundColor,
                                }}
                            >
                                {/* Background Image */}
                                {tile.hasImage && tile.image && (
                                    <img
                                        src={tile.image.src}
                                        alt={tile.image.alt}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                                
                                {/* Overlay */}
                                {tile.hasImage && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: `rgba(0, 0, 0, ${tile.overlayOpacity})`,
                                        }}
                                    />
                                )}
                                
                                {/* Content */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                        padding: "24px",
                                        boxSizing: "border-box",
                                        zIndex: 2,
                                    }}
                                >
                                    {/* Label */}
                                    {tile.label && (
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 10px",
                                                borderRadius: "100px",
                                                backgroundColor: tile.labelBackgroundColor,
                                                color: tile.labelColor,
                                                marginBottom: "8px",
                                                width: "fit-content",
                                                ...labelFont,
                                            }}
                                        >
                                            {tile.label}
                                        </span>
                                    )}
                                    
                                    {/* Title */}
                                    {tile.title && (
                                        <h3
                                            style={{
                                                margin: 0,
                                                marginBottom: tile.description ? "8px" : 0,
                                                color: tile.titleColor,
                                                ...titleFont,
                                            }}
                                        >
                                            {tile.title}
                                        </h3>
                                    )}
                                    
                                    {/* Description */}
                                    {tile.description && (
                                        <p
                                            style={{
                                                margin: 0,
                                                color: tile.descriptionColor,
                                                opacity: 0.9,
                                                ...descriptionFont,
                                            }}
                                        >
                                            {tile.description}
                                        </p>
                                    )}
                                </div>
                            </TileWrapper>
                        </motion.div>
                    )
                })}
            </div>
        </>
    )
}

addPropertyControls(BentoGrid, {
    tiles: {
        type: ControlType.Array,
        title: "Tiles",
        maxCount: 9,
        control: {
            type: ControlType.Object,
            controls: {
                size: {
                    type: ControlType.Enum,
                    title: "Size",
                    options: ["1x1", "2x1", "1x2", "2x2"],
                    optionTitles: ["Small (1×1)", "Wide (2×1)", "Tall (1×2)", "Large (2×2)"],
                    defaultValue: "1x1",
                    displaySegmentedControl: true,
                },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Tile Title",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "",
                    placeholder: "Optional badge text",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    defaultValue: "",
                    placeholder: "Optional description",
                    displayTextArea: true,
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
                linkTarget: {
                    type: ControlType.Enum,
                    title: "Target",
                    options: ["_self", "_blank"],
                    optionTitles: ["Same Tab", "New Tab"],
                    defaultValue: "_self",
                    displaySegmentedControl: true,
                    hidden: ({ link }) => !link,
                },
                hasImage: {
                    type: ControlType.Boolean,
                    title: "Use Image",
                    defaultValue: true,
                    enabledTitle: "Image",
                    disabledTitle: "Color",
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: ({ hasImage }) => hasImage === false,
                },
                backgroundColor: {
                    type: ControlType.Color,
                    title: "Background",
                    defaultValue: "#F5F5F7",
                    hidden: ({ hasImage }) => hasImage !== false,
                },
                overlayOpacity: {
                    type: ControlType.Number,
                    title: "Overlay",
                    defaultValue: 0.3,
                    min: 0,
                    max: 1,
                    step: 0.05,
                    hidden: ({ hasImage }) => hasImage === false,
                },
                titleColor: {
                    type: ControlType.Color,
                    title: "Title Color",
                    defaultValue: "#FFFFFF",
                },
                labelColor: {
                    type: ControlType.Color,
                    title: "Label Color",
                    defaultValue: "#000000",
                },
                labelBackgroundColor: {
                    type: ControlType.Color,
                    title: "Label BG",
                    defaultValue: "#FFFFFF",
                },
                descriptionColor: {
                    type: ControlType.Color,
                    title: "Description Color",
                    defaultValue: "#FFFFFF",
                },
            },
        },
        defaultValue: buildDefaultTiles(),
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "0px",
    },
    useViewportHeight: {
        type: ControlType.Boolean,
        title: "Viewport Height",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    viewportHeightPercentage: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 100,
        min: 10,
        max: 200,
        step: 5,
        unit: "vh",
        hidden: ({ useViewportHeight }) => !useViewportHeight,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 4,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 2,
        unit: "px",
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 1200,
        min: 400,
        max: 2400,
        step: 50,
        unit: "px",
    },
    enableAnimation: {
        type: ControlType.Boolean,
        title: "Animation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    animationDelay: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.1,
        min: 0,
        max: 0.5,
        step: 0.05,
        unit: "s",
        hidden: ({ enableAnimation }) => !enableAnimation,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.02,
        min: 1,
        max: 1.1,
        step: 0.01,
    },
    hoverBrightness: {
        type: ControlType.Number,
        title: "Hover Brightness",
        defaultValue: 1.1,
        min: 1,
        max: 1.3,
        step: 0.05,
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Breakpoint",
        defaultValue: 640,
        min: 320,
        max: 768,
        step: 16,
        unit: "px",
    },
    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Breakpoint",
        defaultValue: 1024,
        min: 768,
        max: 1280,
        step: 16,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "24px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "12px",
            variant: "Semibold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1.4em",
        },
    },
})

BentoGrid.displayName = "Bento Grid"
