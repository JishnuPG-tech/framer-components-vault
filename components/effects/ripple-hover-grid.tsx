// User request: 3D Mosaic Grid with flip animation on hover - tiles flip from center outward in a ripple effect
import { startTransition, useState, useRef, useCallback, useMemo, memo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useInView } from "framer-motion"

interface ResponsiveImage {
    src: string
    alt?: string
    srcSet?: string
}

interface MosaicGridProps {
    gridColumns: number
    gridRows: number
    tileSize: number
    frontImage: ResponsiveImage
    backImage: ResponsiveImage
    breathingIntensity: number
    breathingSpeed: number
    rippleSpeed: number
    rotationDuration: number
    gap: number
    enableShadows: boolean
    perspectiveDepth: number
    backgroundColor: string
}

interface MosaicTileProps {
    col: number
    row: number
    tileSize: number
    imageWidth: number
    imageHeight: number
    frontImage: string
    backImage: string
    frontAlt?: string
    backAlt?: string
    frontSrcSet?: string
    backSrcSet?: string
    gap: number
    enableShadows: boolean
    isFlipped: boolean
    flippedDelay: number
    breathingIntensity: number
    breathingSpeed: number
    rotationDuration: number
    shouldAnimate: boolean
    index: number
}

const MosaicTile = memo<MosaicTileProps>(
    ({
        index,
        col,
        row,
        tileSize,
        imageWidth,
        imageHeight,
        frontImage,
        backImage,
        frontAlt = "",
        backAlt = "",
        frontSrcSet,
        backSrcSet,
        gap,
        enableShadows,
        isFlipped,
        flippedDelay,
        breathingIntensity,
        breathingSpeed,
        rotationDuration,
        shouldAnimate,
    }) => {
        const offsetX = col * (tileSize + gap)
        const offsetY = row * (tileSize + gap)

        const imgOffsetX = -col * (tileSize + gap)
        const imgOffsetY = -row * (tileSize + gap)

        const shadowStyle = enableShadows
            ? "0 8px 16px rgba(0, 0, 0, 0.3)"
            : "none"

        return (
            <motion.div
                style={{
                    width: tileSize,
                    height: tileSize,
                    position: "absolute",
                    left: offsetX,
                    top: offsetY,
                    perspective: "1000px",
                }}
                animate={
                    shouldAnimate
                        ? {
                              z: Math.sin(index * 0.5) * breathingIntensity,
                          }
                        : {}
                }
                transition={{
                    duration: breathingSpeed,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                }}
            >
                <motion.div
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        transformStyle: "preserve-3d",
                    }}
                    animate={
                        shouldAnimate
                            ? {
                                  rotateY: isFlipped ? 180 : 0,
                              }
                            : {}
                    }
                    transition={{
                        duration: rotationDuration,
                        delay: flippedDelay,
                        ease: "easeInOut",
                    }}
                >
                    {/* Front face */}
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={frontImage}
                            srcSet={frontSrcSet}
                            alt={frontAlt}
                            style={{
                                width: imageWidth,
                                height: imageHeight,
                                position: "absolute",
                                left: imgOffsetX,
                                top: imgOffsetY,
                                objectFit: "cover",
                                display: "block",
                                pointerEvents: "none",
                            }}
                        />
                    </div>

                    {/* Back face */}
                    <div
                        style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={backImage}
                            srcSet={backSrcSet}
                            alt={backAlt}
                            style={{
                                width: imageWidth,
                                height: imageHeight,
                                position: "absolute",
                                left: imgOffsetX,
                                top: imgOffsetY,
                                objectFit: "cover",
                                display: "block",
                                pointerEvents: "none",
                                transform: "scaleX(-1)",
                            }}
                        />
                    </div>
                </motion.div>
            </motion.div>
        )
    },
    (prevProps, nextProps) => {
        return (
            prevProps.isFlipped === nextProps.isFlipped &&
            prevProps.flippedDelay === nextProps.flippedDelay &&
            prevProps.shouldAnimate === nextProps.shouldAnimate &&
            prevProps.tileSize === nextProps.tileSize &&
            prevProps.gap === nextProps.gap &&
            prevProps.frontImage === nextProps.frontImage &&
            prevProps.backImage === nextProps.backImage &&
            prevProps.frontSrcSet === nextProps.frontSrcSet &&
            prevProps.backSrcSet === nextProps.backSrcSet &&
            prevProps.enableShadows === nextProps.enableShadows &&
            prevProps.breathingIntensity === nextProps.breathingIntensity &&
            prevProps.breathingSpeed === nextProps.breathingSpeed &&
            prevProps.rotationDuration === nextProps.rotationDuration
        )
    }
)

MosaicTile.displayName = "MosaicTile"

/**
 * @framerIntrinsicWidth 840
 * @framerIntrinsicHeight 840
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function MosaicGrid3D(props: MosaicGridProps & { style?: CSSProperties }) {
    const {
        gridColumns = 10,
        gridRows = 10,
        tileSize = 80,
        frontImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Front image",
        },
        backImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Back image",
        },
        breathingIntensity = 15,
        breathingSpeed = 2,
        rippleSpeed = 0.6,
        rotationDuration = 0.8,
        gap = 4,
        enableShadows = true,
        perspectiveDepth = 1000,
        backgroundColor = "#0a0a0a",
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const isStatic = useIsStaticRenderer()
    const ref = useRef(null)
    const isInView = useInView(ref)

    // Detect if width/height are set to 100% (Fill/Relative mode)
    const isWidthFill = style?.width === "100%"
    const isHeightFill = style?.height === "100%"

    // Calculate actual tile size based on container dimensions
    const actualTileSize = useMemo(() => {
        if (isWidthFill && style?.width) {
            // Parse container width and calculate tile size
            const containerWidth = typeof style.width === "string" && style.width !== "100%" 
                ? parseFloat(style.width) 
                : null
            
            if (containerWidth) {
                return Math.floor((containerWidth - (gridColumns - 1) * gap) / gridColumns)
            }
        }
        return tileSize
    }, [isWidthFill, style?.width, gridColumns, gap, tileSize])

    const imageWidth = actualTileSize * gridColumns + (gridColumns - 1) * gap
    const imageHeight = actualTileSize * gridRows + (gridRows - 1) * gap
    const gridWidth = gridColumns * actualTileSize + (gridColumns - 1) * gap
    const gridHeight = gridRows * actualTileSize + (gridRows - 1) * gap

    const rippleParams = useMemo(() => {
        const gridCenterX = gridWidth / 2
        const gridCenterY = gridHeight / 2
        const maxDistance = Math.sqrt(gridCenterX ** 2 + gridCenterY ** 2)
        return { gridCenterX, gridCenterY, maxDistance }
    }, [gridWidth, gridHeight])

    const calculateDelay = useCallback(
        (col: number, row: number): number => {
            if (!isHovered) return 0
            const { gridCenterX, gridCenterY, maxDistance } = rippleParams
            const tileCenterX = col * (actualTileSize + gap) + actualTileSize / 2
            const tileCenterY = row * (actualTileSize + gap) + actualTileSize / 2
            const distance = Math.sqrt(
                (tileCenterX - gridCenterX) ** 2 +
                    (tileCenterY - gridCenterY) ** 2
            )
            return (distance / maxDistance) * rippleSpeed
        },
        [rippleParams, actualTileSize, gap, rippleSpeed, isHovered]
    )

    const handleMouseEnter = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsHovered(true))
    }, [isStatic])

    const handleMouseLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => setIsHovered(false))
    }, [isStatic])

    const shouldAnimate = !isStatic && isInView

    const tiles = useMemo(() => {
        return Array.from({ length: gridColumns * gridRows }).map(
            (_, index) => {
                const col = index % gridColumns
                const row = Math.floor(index / gridColumns)

                return (
                    <MosaicTile
                        key={`${col}-${row}`}
                        index={index}
                        col={col}
                        row={row}
                        tileSize={actualTileSize}
                        imageWidth={imageWidth}
                        imageHeight={imageHeight}
                        frontImage={frontImage.src}
                        backImage={backImage.src}
                        frontAlt={frontImage.alt}
                        backAlt={backImage.alt}
                        frontSrcSet={frontImage.srcSet}
                        backSrcSet={backImage.srcSet}
                        gap={gap}
                        enableShadows={enableShadows}
                        isFlipped={isHovered}
                        flippedDelay={calculateDelay(col, row)}
                        breathingIntensity={breathingIntensity}
                        breathingSpeed={breathingSpeed}
                        rotationDuration={rotationDuration}
                        shouldAnimate={shouldAnimate}
                    />
                )
            }
        )
    }, [
        gridColumns,
        gridRows,
        actualTileSize,
        imageWidth,
        imageHeight,
        frontImage,
        backImage,
        gap,
        enableShadows,
        isHovered,
        calculateDelay,
        breathingIntensity,
        breathingSpeed,
        rotationDuration,
        shouldAnimate,
    ])

    return (
        <motion.div
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                width: isWidthFill ? "100%" : gridWidth,
                height: isHeightFill ? "100%" : gridHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: backgroundColor,
                overflow: "hidden",
                perspective: `${perspectiveDepth}px`,
                position: "relative",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: gridWidth,
                    height: gridHeight,
                }}
            >
                {tiles}
            </div>
        </motion.div>
    )
}

export default MosaicGrid3D

addPropertyControls(MosaicGrid3D, {
    gridColumns: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 3,
        max: 20,
        step: 1,
        title: "Grid Columns",
    },
    gridRows: {
        type: ControlType.Number,
        defaultValue: 10,
        min: 3,
        max: 20,
        step: 1,
        title: "Grid Rows",
    },
    tileSize: {
        type: ControlType.Number,
        defaultValue: 80,
        min: 30,
        max: 200,
        step: 10,
        title: "Tile Size",
        unit: "px",
    },
    frontImage: {
        type: ControlType.ResponsiveImage,
        title: "Front Image",
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back Image",
    },
    backgroundColor: {
        type: ControlType.Color,
        defaultValue: "#0a0a0a",
        title: "Background Color",
    },
    breathingIntensity: {
        type: ControlType.Number,
        defaultValue: 15,
        min: 0,
        max: 50,
        step: 5,
        title: "Breathing Intensity",
    },
    breathingSpeed: {
        type: ControlType.Number,
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        title: "Breathing Speed",
        unit: "s",
    },
    rippleSpeed: {
        type: ControlType.Number,
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        title: "Ripple Speed",
    },
    rotationDuration: {
        type: ControlType.Number,
        defaultValue: 0.8,
        min: 0.3,
        max: 2,
        step: 0.1,
        title: "Rotation Duration",
        unit: "s",
    },
    gap: {
        type: ControlType.Number,
        defaultValue: 4,
        min: 0,
        max: 20,
        step: 1,
        title: "Tile Gap",
        unit: "px",
    },
    perspectiveDepth: {
        type: ControlType.Number,
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 100,
        title: "3D Perspective Depth",
    },
    enableShadows: {
        type: ControlType.Boolean,
        defaultValue: true,
        title: "Enable Tile Shadows",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
