import { useRef, type CSSProperties } from "react"
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
    animate,
    type PanInfo,
} from "framer-motion"

interface GalleryImage {
    src: string
    srcSet?: string
    alt?: string
}

interface GalleryItem {
    image?: GalleryImage
    title?: string
}

interface CircleGalleryProps {
    items: GalleryItem[]
    radius: number
    itemWidth: number
    itemHeight: number
    imageRadius: string
    showCaptions: boolean
    captionFont: any
    captionColor: string
    throwResistance: number
    autoSpin: number
    enableDrag: boolean
    onItemClick?: () => void
    style?: CSSProperties
}

/**
 * Premium editorial default gallery.
 * Aesthetic mix of architecture, interiors,
 * landscapes, materials, and quiet compositions.
 */
const defaultItems: GalleryItem[] = [
    {
        image: {
            src: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85",
            alt: "Minimal warm interior",
        },
        title: "Quiet Spaces",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85",
            alt: "Minimal architectural interior",
        },
        title: "Soft Geometry",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=85",
            alt: "Modern white architecture",
        },
        title: "Pure Form",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85",
            alt: "Contemporary creative workspace",
        },
        title: "Still Matter",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85",
            alt: "Atmospheric landscape",
        },
        title: "After Light",
    },
    {
        image: {
            src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85",
            alt: "Modern concrete architecture",
        },
        title: "Between Forms",
    },
]

/**
 * Circle Gallery
 * -----------------------------------------------------------------------
 * A draggable circular carousel with inertia and 3D perspective.
 *
 * Drag left or right to spin the ring. Release to let it coast
 * naturally to a stop.
 *
 * Static renderer support is included so Framer can render
 * a stable preview without continuous animation.
 *
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CircleGallery(props: CircleGalleryProps) {
    const {
        items: rawItems = defaultItems,
        radius = 260,
        itemWidth = 200,
        itemHeight = 280,
        imageRadius = "16px",
        showCaptions = true,
        captionFont,
        captionColor = "#111111",
        throwResistance = 0.35,
        autoSpin = 0,
        enableDrag = true,
        onItemClick,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const rotation = useMotionValue(0)

    const isDragging = useRef(false)

    /**
     * Framer's Array/Object property control can sometimes persist
     * the object without its nested ResponsiveImage value.
     *
     * If an item has no image, automatically use the matching
     * aesthetic default image for that position.
     */
    const items =
        rawItems && rawItems.length
            ? rawItems.map((item, i) => ({
                  ...item,
                  image: item.image?.src
                      ? item.image
                      : defaultItems[i % defaultItems.length]?.image,
                  title:
                      item.title ||
                      defaultItems[i % defaultItems.length]?.title ||
                      "Untitled",
              }))
            : defaultItems

    const count = Math.max(items.length, 1)

    const step = 360 / count

    /**
     * Automatic rotation.
     *
     * Disabled in Framer's static renderer and while dragging.
     */
    useAnimationFrame((_time, delta) => {
        if (isStatic || isDragging.current || !autoSpin) return

        rotation.set(rotation.get() + (autoSpin * delta) / 1000)
    })

    function handleDragStart() {
        isDragging.current = true
    }

    function handleDragEnd(
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) {
        isDragging.current = false

        const power = Math.max(0.05, 1 - throwResistance)

        animate(rotation, rotation.get() + info.velocity.x * power * 0.1, {
            type: "inertia",
            power,
            timeConstant: 280,
            restDelta: 0.5,
        })
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                overflow: "hidden",
                ...style,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    perspective: 1600,
                }}
            >
                <motion.div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                        cursor: enableDrag && !isStatic ? "grab" : "default",
                    }}
                    drag={enableDrag && !isStatic ? "x" : false}
                    dragElastic={0.15}
                    dragMomentum={false}
                    dragConstraints={{
                        left: 0,
                        right: 0,
                    }}
                    onDragStart={handleDragStart}
                    onDrag={(_, info) => {
                        rotation.set(rotation.get() + info.delta.x / 3)
                    }}
                    onDragEnd={handleDragEnd}
                >
                    {items.map((item, index) => (
                        <GalleryCard
                            key={index}
                            item={item}
                            angle={index * step}
                            rotation={rotation}
                            radius={radius}
                            width={itemWidth}
                            height={itemHeight}
                            imageRadius={imageRadius}
                            showCaption={showCaptions}
                            captionFont={captionFont}
                            captionColor={captionColor}
                            onItemClick={onItemClick}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

function GalleryCard({
    item,
    angle,
    rotation,
    radius,
    width,
    height,
    imageRadius,
    showCaption,
    captionFont,
    captionColor,
    onItemClick,
}: {
    item: GalleryItem
    angle: number
    rotation: ReturnType<typeof useMotionValue<number>>
    radius: number
    width: number
    height: number
    imageRadius: string
    showCaption: boolean
    captionFont: any
    captionColor: string
    onItemClick?: () => void
}) {
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const x = useTransform(rotation, (r) => Math.sin(toRad(angle + r)) * radius)

    const z = useTransform(rotation, (r) => Math.cos(toRad(angle + r)) * radius)

    const rotateY = useTransform(rotation, (r) => -(angle + r))

    const scale = useTransform(
        z,
        (zVal) => 0.6 + 0.4 * ((zVal + radius) / (2 * radius))
    )

    const opacity = useTransform(
        z,
        (zVal) => 0.4 + 0.6 * ((zVal + radius) / (2 * radius))
    )

    const image = item.image

    const title = item.title

    return (
        <motion.div
            onClick={() => onItemClick?.()}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -width / 2,
                marginTop: -height / 2,
                width,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,

                x,
                z,
                rotateY,
                scale,
                opacity,

                transformStyle: "preserve-3d",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width,
                    height,
                    borderRadius: imageRadius,
                    overflow: "hidden",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
                    background: "#e9e6e1",
                    flexShrink: 0,
                }}
            >
                {image?.src && (
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || title || ""}
                        draggable={false}
                        loading="lazy"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    />
                )}

                {/* Subtle image overlay */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.12))",
                        pointerEvents: "none",
                    }}
                />
            </div>

            {showCaption && title && (
                <span
                    style={{
                        textAlign: "center",
                        color: captionColor,
                        whiteSpace: "nowrap",
                        ...captionFont,
                    }}
                >
                    {title}
                </span>
            )}
        </motion.div>
    )
}

addPropertyControls(CircleGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                },
                title: {
                    type: ControlType.String,
                    defaultValue: "Quiet Spaces",
                },
            },
        },
        defaultValue: defaultItems,
        maxCount: 12,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 260,
        min: 80,
        max: 500,
        step: 1,
        unit: "px",
    },

    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        defaultValue: 200,
        min: 80,
        max: 400,
        step: 1,
        unit: "px",
    },

    itemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        defaultValue: 280,
        min: 80,
        max: 500,
        step: 1,
        unit: "px",
    },

    imageRadius: {
        type: ControlType.BorderRadius,
        title: "Image Radius",
        defaultValue: "16px",
    },

    showCaptions: {
        type: ControlType.Boolean,
        title: "Captions",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
        hidden: (props) => !props.showCaptions,
    },

    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#111111",
        hidden: (props) => !props.showCaptions,
    },

    throwResistance: {
        type: ControlType.Number,
        title: "Throw Resistance",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.01,
    },

    autoSpin: {
        type: ControlType.Number,
        title: "Auto Spin",
        defaultValue: 0,
        min: -60,
        max: 60,
        step: 1,
        unit: "deg/s",
    },

    enableDrag: {
        type: ControlType.Boolean,
        title: "Enable Drag",
        defaultValue: true,
    },

    onItemClick: {
        type: ControlType.EventHandler,
        title: "Item Click",
    },
})
