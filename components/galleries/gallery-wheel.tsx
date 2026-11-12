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

import {
    motion,
    useMotionValue,
    useTransform,
    useAnimationFrame,
    MotionValue,
} from "framer-motion"

interface ImageItem {
    image?: string
    link?: string
}

interface Props {
    images: Array<string | ImageItem>
    links?: string[]

    responsive: boolean
    centerX: number
    centerY: number

    radius: number
    startAngle: number
    arc: number

    imageWidth: number
    imageHeight: number
    cornerRadius: number

    keepImagesUpright: boolean
    baseRotation: number
    rotationVariation: number

    radialVariation: number
    scaleVariation: number
    overlapScale: number

    seed: number

    autoRotate: boolean
    rotationSpeed: number
    direction: "clockwise" | "counterclockwise"

    hoverScale: number
    hoverDuration: number

    openLinksNewTab: boolean

    fit: "cover" | "contain"
    backgroundColor: string
    overflow: "visible" | "hidden"

    style?: React.CSSProperties
}

// ======================================================
// RESPONSIVE HELPERS
// ======================================================

function useElementSize(ref: React.RefObject<HTMLDivElement>) {
    const [size, setSize] = React.useState({
        width: 0,
        height: 0,
    })

    React.useEffect(() => {
        const element = ref.current
        if (!element) return

        const update = () => {
            const rect = element.getBoundingClientRect()

            setSize({
                width: Math.max(0, rect.width),
                height: Math.max(0, rect.height),
            })
        }

        update()

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver((entries) => {
                const entry = entries[0]
                if (!entry) return

                const { width, height } = entry.contentRect

                setSize({
                    width: Math.max(0, width),
                    height: Math.max(0, height),
                })
            })

            observer.observe(element)

            return () => observer.disconnect()
        }

        if (typeof window !== "undefined") {
            window.addEventListener("resize", update)

            return () => window.removeEventListener("resize", update)
        }
    }, [ref])

    return size
}

// ======================================================
// INDIVIDUAL WHEEL IMAGE
// ======================================================

interface WheelCardProps {
    src: string
    link?: string

    index: number

    wheelRotation: MotionValue<number>

    angle: number
    cardRadius: number

    imageWidth: number
    imageHeight: number
    cornerRadius: number

    keepImagesUpright: boolean
    staticCardRotation: number

    finalScale: number
    hoverScale: number
    hoverDuration: number

    depth: number

    fit: "cover" | "contain"

    openLinksNewTab: boolean
}

function WheelCard(props: WheelCardProps) {
    const {
        src,
        link,
        wheelRotation,
        angle,
        cardRadius,
        imageWidth,
        imageHeight,
        cornerRadius,
        keepImagesUpright,
        staticCardRotation,
        finalScale,
        hoverScale,
        hoverDuration,
        depth,
        fit,
        openLinksNewTab,
    } = props

    const [isHovered, setIsHovered] = React.useState(false)

    // ==================================================
    // POSITION AROUND THE WHEEL
    // ==================================================

    const positionTransform = useTransform(wheelRotation, (rotation) => {
        return `
            rotate(${angle + rotation}deg)
            translateY(${-cardRadius}px)
            translate(-50%, -50%)
        `
    })

    // ==================================================
    // KEEP IMAGE UPRIGHT
    // ==================================================

    const cardRotation = useTransform(wheelRotation, (rotation) => {
        if (keepImagesUpright) {
            return staticCardRotation - rotation
        }

        return staticCardRotation
    })

    // ==================================================
    // CARD
    // ==================================================

    return (
        <motion.div
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: imageWidth,
                height: imageHeight,
                zIndex: isHovered ? 100000 : depth,
                transform: positionTransform,
                transformOrigin: "0 0",
            }}
        >
            <motion.a
                href={link || undefined}
                target={link && openLinksNewTab ? "_blank" : undefined}
                rel={
                    link && openLinksNewTab ? "noopener noreferrer" : undefined
                }
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(event) => {
                    if (!link) {
                        event.preventDefault()
                    }
                }}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    borderRadius: cornerRadius,
                    overflow: "hidden",
                    rotate: cardRotation,
                    transformOrigin: "50% 50%",
                    textDecoration: "none",
                    cursor: link ? "pointer" : "default",
                    position: "relative",
                    willChange: "transform",
                }}
                animate={{
                    scale: isHovered ? finalScale * hoverScale : finalScale,
                }}
                transition={{
                    scale: {
                        duration: hoverDuration,
                        ease: [0.22, 1, 0.36, 1],
                    },
                }}
            >
                <img
                    src={src}
                    alt=""
                    draggable={false}
                    style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: fit,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            </motion.a>
        </motion.div>
    )
}

// ======================================================
// KINETIC WHEEL GALLERY
// ======================================================

/**
 * KINETIC WHEEL GALLERY
 *
 * Features:
 * - Continuous auto rotation
 * - Pause on wheel hover
 * - Smooth continuous motion
 * - Individual image links
 * - Image hover scaling
 * - Upright image option
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 700
 */

export default function KineticWheelGallery(props: Props) {
    const {
        images,
        links,

        responsive,
        centerX,
        centerY,

        radius,
        startAngle,
        arc,

        imageWidth,
        imageHeight,
        cornerRadius,

        keepImagesUpright,
        baseRotation,
        rotationVariation,

        radialVariation,
        scaleVariation,
        overlapScale,

        seed,

        autoRotate,
        rotationSpeed,
        direction,

        hoverScale,
        hoverDuration,

        openLinksNewTab,

        fit,
        backgroundColor,
        overflow,

        style,
    } = props

    // ==================================================
    // RESPONSIVE FRAME SCALE
    // ==================================================

    const rootRef = React.useRef<HTMLDivElement>(null)

    const { width: frameWidth, height: frameHeight } = useElementSize(rootRef)

    const isStaticRenderer = useIsStaticRenderer()

    const responsiveScale = React.useMemo(() => {
        if (!responsive || frameWidth <= 0 || frameHeight <= 0) {
            return 1
        }

        const maxCardScale =
            Math.max(0.01, overlapScale) *
            (1 + Math.max(0, scaleVariation) / 100) *
            Math.max(1, hoverScale)

        const maxCardExtent = Math.hypot(imageWidth, imageHeight) * maxCardScale

        const maxWheelRadius =
            Math.max(0, radius) + Math.max(0, Math.abs(radialVariation))

        const naturalDiameter = Math.max(1, maxWheelRadius * 2 + maxCardExtent)

        const centerXPx = frameWidth * (centerX / 100)
        const centerYPx = frameHeight * (centerY / 100)

        const availableWidth = Math.max(
            1,
            2 * Math.min(centerXPx, frameWidth - centerXPx)
        )

        const availableHeight = Math.max(
            1,
            2 * Math.min(centerYPx, frameHeight - centerYPx)
        )

        return Math.min(
            availableWidth / naturalDiameter,
            availableHeight / naturalDiameter
        )
    }, [
        responsive,
        frameWidth,
        frameHeight,
        centerX,
        centerY,
        radius,
        radialVariation,
        imageWidth,
        imageHeight,
        overlapScale,
        scaleVariation,
        hoverScale,
    ])

    const effectiveRadius = radius * responsiveScale
    const effectiveImageWidth = imageWidth * responsiveScale
    const effectiveImageHeight = imageHeight * responsiveScale
    const effectiveCornerRadius = cornerRadius * responsiveScale
    const effectiveRadialVariation = radialVariation * responsiveScale

    // ==================================================
    // VALID IMAGES
    // ==================================================

    const validImages = (images || [])
        .map((item, index) => {
            if (typeof item === "string") {
                return {
                    src: item,
                    link: links?.[index] || "",
                }
            }

            return {
                src: item?.image || "",
                link: item?.link || "",
            }
        })
        .filter((item) => Boolean(item.src))

    const count = validImages.length

    // ==================================================
    // WHEEL HOVER
    // ==================================================

    const [isWheelHovered, setIsWheelHovered] = React.useState(false)

    // ==================================================
    // LIVE WHEEL ROTATION
    // ==================================================

    const wheelRotation = useMotionValue(0)

    // ==================================================
    // AUTO ROTATION
    // ==================================================

    useAnimationFrame((_time, delta) => {
        if (isStaticRenderer || !autoRotate || isWheelHovered) {
            return
        }

        const safeDuration = Math.max(0.1, rotationSpeed)

        const degreesPerMs = 360 / (safeDuration * 1000)

        const directionMultiplier = direction === "clockwise" ? 1 : -1

        const movement = delta * degreesPerMs * directionMultiplier

        let nextRotation = wheelRotation.get() + movement

        if (Math.abs(nextRotation) > 36000) {
            nextRotation %= 360
        }

        wheelRotation.set(nextRotation)
    })

    // ==================================================
    // RANDOM GENERATOR
    // ==================================================

    const random = React.useCallback(
        (index: number, salt: number) => {
            const x =
                Math.sin(
                    (index + 1) * 12.9898 + (seed + 1) * 78.233 + salt * 37.719
                ) * 43758.5453

            return x - Math.floor(x)
        },
        [seed]
    )

    const signedRandom = (index: number, salt: number) =>
        random(index, salt) * 2 - 1

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow,
                backgroundColor,
            }}
            onMouseEnter={() => setIsWheelHovered(true)}
            onMouseLeave={() => setIsWheelHovered(false)}
        >
            <div
                style={{
                    position: "absolute",
                    left: `${centerX}%`,
                    top: `${centerY}%`,
                    width: 0,
                    height: 0,
                    transformOrigin: "0 0",
                }}
            >
                {validImages.map((item, index) => {
                    const { src, link } = item

                    // -----------------------------
                    // WHEEL DISTRIBUTION
                    // -----------------------------

                    const isFullCircle = Math.abs(arc) >= 359.999

                    const divisor =
                        count <= 1 ? 1 : isFullCircle ? count : count - 1

                    const angleStep = count <= 1 ? 0 : arc / divisor

                    const angle = startAngle + angleStep * index

                    // -----------------------------
                    // RANDOM RADIUS
                    // -----------------------------

                    const radiusOffset =
                        signedRandom(index, 1) * effectiveRadialVariation

                    const cardRadius = Math.max(
                        0,
                        effectiveRadius + radiusOffset
                    )

                    // -----------------------------
                    // RANDOM ROTATION
                    // -----------------------------

                    const randomRotation =
                        signedRandom(index, 2) * rotationVariation

                    // -----------------------------
                    // RANDOM SCALE
                    // -----------------------------

                    const randomScale =
                        1 + signedRandom(index, 3) * (scaleVariation / 100)

                    const finalScale = randomScale * overlapScale

                    // -----------------------------
                    // CARD ORIENTATION
                    // -----------------------------

                    const staticCardRotation =
                        (keepImagesUpright ? -angle : 0) +
                        baseRotation +
                        randomRotation

                    // -----------------------------
                    // DEPTH
                    // -----------------------------

                    const depth = index % 2 === 0 ? 1000 + index : 500 + index

                    return (
                        <WheelCard
                            key={`${src}-${index}`}
                            src={src}
                            link={link}
                            index={index}
                            wheelRotation={wheelRotation}
                            angle={angle}
                            cardRadius={cardRadius}
                            imageWidth={effectiveImageWidth}
                            imageHeight={effectiveImageHeight}
                            cornerRadius={effectiveCornerRadius}
                            keepImagesUpright={keepImagesUpright}
                            staticCardRotation={staticCardRotation}
                            finalScale={finalScale}
                            hoverScale={hoverScale}
                            hoverDuration={hoverDuration}
                            depth={depth}
                            fit={fit}
                            openLinksNewTab={openLinksNewTab}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// ======================================================
// DEFAULT PROPS
// ======================================================

KineticWheelGallery.defaultProps = {
    images: [],
    links: [],

    responsive: true,

    centerX: 50,
    centerY: 50,

    radius: 420,

    startAngle: 0,

    arc: 360,

    imageWidth: 220,
    imageHeight: 145,

    cornerRadius: 0,

    keepImagesUpright: true,

    baseRotation: 0,

    rotationVariation: 10,

    radialVariation: 20,

    scaleVariation: 6,

    overlapScale: 1.1,

    seed: 4,

    autoRotate: true,

    rotationSpeed: 25,

    direction: "clockwise",

    hoverScale: 1.1,

    hoverDuration: 0.2,

    openLinksNewTab: false,

    fit: "cover",

    backgroundColor: "transparent",

    overflow: "visible",
}

// ======================================================
// PROPERTY CONTROLS
// ======================================================

addPropertyControls(KineticWheelGallery, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 60,

        control: {
            type: ControlType.Object,

            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },

                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
    },

    responsive: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    centerX: {
        type: ControlType.Number,
        title: "Center X",
        defaultValue: 50,
        min: -100,
        max: 200,
        step: 1,
        unit: "%",
    },

    centerY: {
        type: ControlType.Number,
        title: "Center Y",
        defaultValue: 50,
        min: -100,
        max: 200,
        step: 1,
        unit: "%",
    },

    radius: {
        type: ControlType.Number,
        title: "Wheel Radius",
        min: 50,
        max: 2000,
        step: 1,
        unit: "px",
    },

    startAngle: {
        type: ControlType.Number,
        title: "Start Angle",
        min: -360,
        max: 360,
        step: 1,
        unit: "°",
    },

    arc: {
        type: ControlType.Number,
        title: "Arc",
        min: -720,
        max: 720,
        step: 1,
        unit: "°",
    },

    imageWidth: {
        type: ControlType.Number,
        title: "Image W",
        min: 20,
        max: 1000,
        step: 1,
        unit: "px",
    },

    imageHeight: {
        type: ControlType.Number,
        title: "Image H",
        min: 20,
        max: 1000,
        step: 1,
        unit: "px",
    },

    overlapScale: {
        type: ControlType.Number,
        title: "Overlap",
        min: 0.5,
        max: 2,
        step: 0.01,
    },

    cornerRadius: {
        type: ControlType.Number,
        title: "Corners",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },

    keepImagesUpright: {
        type: ControlType.Boolean,
        title: "Keep Upright",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    baseRotation: {
        type: ControlType.Number,
        title: "Base Tilt",
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },

    rotationVariation: {
        type: ControlType.Number,
        title: "Tilt Variation",
        min: 0,
        max: 60,
        step: 1,
        unit: "°",
    },

    radialVariation: {
        type: ControlType.Number,
        title: "Radius Variation",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },

    scaleVariation: {
        type: ControlType.Number,
        title: "Scale Variation",
        min: 0,
        max: 30,
        step: 1,
        unit: "%",
    },

    seed: {
        type: ControlType.Number,
        title: "Layout Seed",
        min: 0,
        max: 100,
        step: 1,
    },

    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    rotationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 2,
        max: 120,
        step: 1,
        unit: "s",
        hidden: (props) => !props.autoRotate,
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["clockwise", "counterclockwise"],
        optionTitles: ["Clockwise", "Counter"],
        hidden: (props) => !props.autoRotate,
    },

    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.5,
        step: 0.01,
    },

    hoverDuration: {
        type: ControlType.Number,
        title: "Hover Speed",
        min: 0.05,
        max: 1,
        step: 0.05,
        unit: "s",
    },

    openLinksNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
    },

    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["visible", "hidden"],
        optionTitles: ["Visible", "Hidden"],
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
    },
})
