import * as React from "react"
import { useRef, useCallback, useState, useEffect } from "react"
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    PanInfo,
} from "framer-motion"
// @ts-ignore
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
 * CIRCLE GALLERY FX (FIXED MOBILE SCROLL)
 */

const wrap = (min: number, max: number, v: number) => {
    const range = max - min
    return ((((v - min) % range) + range) % range) + min
}

const applyOpacity = (color: string, opacity: number) => {
    if (color.startsWith("#")) {
        const hex = color.replace("#", "")
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    if (color.startsWith("rgba")) {
        return color.replace(/[\d\.]+\)$/g, `${opacity})`)
    }
    if (color.startsWith("rgb")) {
        return color.replace(")", `, ${opacity})`).replace("rgb", "rgba")
    }
    return color
}

interface GalleryItem {
    mediaType?: "image" | "video"
    imageFile?: string
    videoFile?: string
    autoPlay?: boolean
    playOnHover?: boolean
    link?: string
    title?: string
    image?: string // legacy fallback
}

interface Props {
    items?: GalleryItem[]
    radius?: number
    itemWidth?: number
    itemHeight?: number
    sensitivity?: number
    stiffness?: number
    damping?: number
    mass?: number
    gap?: number
    magneticSnapping?: boolean
    backgroundColor?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    blurStrength?: number
    scaleStrength?: number
    parallaxStrength?: number
    shadowColor?: string
    shadowBlur?: number
    shadowOpacity?: number
    inactiveOpacity?: number
    captionSize?: number
    captionColor?: string
    captionWeight?: number
    captionLetterSpacing?: number
    captionGap?: number
    gradientIntensity?: number
    verticalOffset?: number
}

const DEFAULT_ITEMS: GalleryItem[] = [
    {
        mediaType: "image",
        imageFile:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
        title: "Editorial 01",
    },
    {
        mediaType: "image",
        imageFile:
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800",
        title: "Luxe Series",
    },
    {
        mediaType: "image",
        imageFile:
            "https://images.unsplash.com/photo-1529139513055-119797894c60?auto=format&fit=crop&q=80&w=800",
        title: "Urban Nomad",
    },
    {
        mediaType: "image",
        imageFile:
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800",
        title: "Minimalist",
    },
]

export default function CircleGallery(props: Props) {
    const {
        items = DEFAULT_ITEMS,
        radius = 1600,
        itemWidth = 320,
        itemHeight = 440,
        sensitivity = 0.5,
        stiffness = 50,
        damping = 25,
        mass = 1,
        gap = 40,
        magneticSnapping = true,
        backgroundColor = "#000000",
        borderRadius = 32,
        borderWidth = 0,
        borderColor = "rgba(255,255,255,0.1)",
        blurStrength = 10,
        scaleStrength = 1.15,
        parallaxStrength = 12,
        shadowColor = "#000000",
        shadowBlur = 40,
        shadowOpacity = 0.8,
        inactiveOpacity = 0.4,
        captionSize = 18,
        captionColor = "#ffffff",
        captionWeight = 600,
        captionLetterSpacing = -0.02,
        captionGap = 20,
        gradientIntensity = 0.6,
        verticalOffset = -10,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const rawRotation = useMotionValue(0)
    const rotation = useSpring(rawRotation, { stiffness, damping, mass })

    const totalRange = items.length * gap
    const halfRange = totalRange / 2

    // --- Logic Fix: Handle Pan only when horizontal ---
    const isHorizontalPan = useRef(false)

    const handlePanStart = (_: any, info: PanInfo) => {
        // Determine if the user is swiping mostly left/right or up/down
        isHorizontalPan.current =
            Math.abs(info.delta.x) > Math.abs(info.delta.y)
    }

    const handlePan = useCallback(
        (_: any, info: PanInfo) => {
            if (isHorizontalPan.current) {
                rawRotation.set(rawRotation.get() + info.delta.x * sensitivity)
            }
        },
        [sensitivity]
    )

    const handlePanEnd = useCallback(
        (_: any, info: PanInfo) => {
            if (!magneticSnapping || !isHorizontalPan.current) return

            const current = rawRotation.get()
            const velocity = info.velocity.x * sensitivity * 0.1
            const target = Math.round((current + velocity) / gap) * gap
            rawRotation.set(target)
        },
        [magneticSnapping, gap, sensitivity]
    )

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY * 0.1 * sensitivity
        const nextValue = rawRotation.get() - delta
        rawRotation.set(nextValue)

        if (magneticSnapping) {
            clearTimeout((window as any).wheelSnapTimeout)
            ;(window as any).wheelSnapTimeout = setTimeout(() => {
                rawRotation.set(Math.round(rawRotation.get() / gap) * gap)
            }, 150)
        }
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "default", // Strictly forced default cursor
                position: "relative",
                userSelect: "none",
                WebkitUserSelect: "none",
                /* FIXED: Allow vertical scrolling but capture horizontal */
                touchAction: "pan-y",
                WebkitTapHighlightColor: "transparent",
            }}
            onWheel={handleWheel}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, transparent 80%)`,
                    opacity: gradientIntensity,
                }}
            />

            <motion.div
                ref={containerRef}
                onPanStart={handlePanStart}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: `translateY(${verticalOffset}%)`,
                        width: 0,
                        height: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {items.map((item, idx) => (
                        <GalleryItemView
                            key={`${idx}-${item.title}`}
                            item={item}
                            index={idx}
                            scrollRotation={rotation}
                            radius={radius}
                            width={itemWidth}
                            height={itemHeight}
                            gap={gap}
                            halfRange={halfRange}
                            borderRadius={borderRadius}
                            borderWidth={borderWidth}
                            borderColor={borderColor}
                            blurStrength={blurStrength}
                            scaleStrength={scaleStrength}
                            parallaxStrength={parallaxStrength}
                            shadowColor={shadowColor}
                            shadowBlur={shadowBlur}
                            shadowOpacity={shadowOpacity}
                            inactiveOpacity={inactiveOpacity}
                            captionSize={captionSize}
                            captionColor={captionColor}
                            captionWeight={captionWeight}
                            captionLetterSpacing={captionLetterSpacing}
                            captionGap={captionGap}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

const GalleryItemView = (props: any) => {
    const {
        item,
        index,
        scrollRotation,
        radius,
        width,
        height,
        gap,
        halfRange,
        borderRadius,
        borderWidth,
        borderColor,
        blurStrength,
        scaleStrength,
        parallaxStrength,
        shadowColor,
        shadowBlur,
        shadowOpacity,
        inactiveOpacity,
        captionSize,
        captionColor,
        captionWeight,
        captionLetterSpacing,
        captionGap,
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)
    const [isHovered, setHovered] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const isVideo = item.mediaType === "video"
    const mediaSrc = isVideo ? item.videoFile : item.imageFile || item.image
    const posterSrc = isVideo ? item.imageFile || item.image : undefined

    useEffect(() => {
        const vid = videoRef.current
        if (isVideo && vid && !isCanvas) {
            if (item.autoPlay) {
                vid.play().catch(() => {})
            } else if (item.playOnHover) {
                if (isHovered) {
                    vid.play().catch(() => {})
                } else {
                    vid.pause()
                    vid.currentTime = 0
                }
            }
        }
    }, [isHovered, item, isCanvas, isVideo])

    const initialAngle = index * gap
    const itemAngle = useTransform(scrollRotation, (r: number) =>
        wrap(-halfRange, halfRange, initialAngle + r)
    )

    const x = useTransform(
        itemAngle,
        (a) => Math.sin((a * Math.PI) / 180) * radius
    )
    const y = useTransform(
        itemAngle,
        (a) => (1 - Math.cos((a * Math.PI) / 180)) * radius
    )
    const rotate = useTransform(itemAngle, (a) => a)
    const opacity = useTransform(
        itemAngle,
        [-60, -30, 0, 30, 60],
        [0, inactiveOpacity, 1, inactiveOpacity, 0]
    )
    const scale = useTransform(
        itemAngle,
        [-45, 0, 45],
        [0.8, scaleStrength, 0.8]
    )
    const blurValue = useTransform(
        itemAngle,
        [-40, 0, 40],
        [blurStrength, 0, blurStrength]
    )
    const filter = useTransform(blurValue, (b) => `blur(${b}px)`)
    const zIndex = useTransform(opacity, (o) => Math.round(o * 100))
    const imgX = useTransform(
        itemAngle,
        [-45, 45],
        [`-${parallaxStrength}%`, `${parallaxStrength}%`]
    )

    const finalShadowColor = applyOpacity(shadowColor, shadowOpacity)

    const CardContent = (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: width,
                    height: height,
                    borderRadius: borderRadius,
                    overflow: "hidden",
                    background: "transparent",
                    border:
                        borderWidth > 0
                            ? `${borderWidth}px solid ${borderColor}`
                            : "none",
                    boxShadow:
                        shadowOpacity > 0
                            ? `0 40px ${shadowBlur}px -20px ${finalShadowColor}`
                            : "none",
                }}
            >
                {isVideo ? (
                    <motion.video
                        ref={videoRef}
                        src={mediaSrc}
                        poster={posterSrc}
                        muted
                        loop
                        playsInline
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "160%",
                            height: "100%",
                            left: "-30%",
                            objectFit: "cover",
                            x: imgX,
                            pointerEvents: "none",
                        }}
                    />
                ) : (
                    <motion.img
                        src={mediaSrc}
                        alt={item.title}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "160%",
                            height: "100%",
                            left: "-30%",
                            objectFit: "cover",
                            x: imgX,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>

            {item.title && (
                <div
                    style={{
                        marginTop: captionGap,
                        width: "100%",
                        textAlign: "center",
                        pointerEvents: "none",
                    }}
                >
                    <motion.span
                        style={{
                            display: "block",
                            color: captionColor,
                            fontSize: captionSize,
                            fontWeight: captionWeight,
                            letterSpacing: `${captionLetterSpacing}em`,
                            opacity: useTransform(
                                itemAngle,
                                [-20, 0, 20],
                                [0, 1, 0]
                            ),
                            y: useTransform(
                                itemAngle,
                                [-10, 0, 10],
                                [10, 0, 10]
                            ),
                        }}
                    >
                        {item.title}
                    </motion.span>
                </div>
            )}
        </div>
    )

    return (
        <motion.div
            onMouseEnter={() => !isCanvas && setHovered(true)}
            onMouseLeave={() => !isCanvas && setHovered(false)}
            style={{
                position: "absolute",
                x,
                y,
                rotate,
                opacity,
                scale,
                filter,
                zIndex,
                width,
                height: height + 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                userSelect: "none",
            }}
        >
            {item.link ? (
                <Link
                    href={item.link}
                    style={{
                        display: "contents",
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {CardContent}
                </Link>
            ) : (
                CardContent
            )}
        </motion.div>
    )
}

// --- Framer Canvas Controls ---
// @ts-ignore
if (addPropertyControls) {
    addPropertyControls(CircleGallery, {
        items: {
            type: ControlType.Array,
            title: "Gallery Items",
            description:
                "Add items to your gallery. Uses the Image/Poster field as the UI thumbnail.",
            control: {
                type: ControlType.Object,
                controls: {
                    mediaType: {
                        type: ControlType.Enum,
                        title: "Type",
                        options: ["image", "video"],
                        defaultValue: "image",
                        description:
                            "Select whether this card displays a static image or a video.",
                    },
                    imageFile: {
                        type: ControlType.Image,
                        title: "Image / Poster",
                    },
                    videoFile: {
                        type: ControlType.File,
                        title: "Video File",
                        allowedFileTypes: ["mp4", "mov", "webm"],
                        hidden: (p) => p.mediaType !== "video",
                    },
                    autoPlay: {
                        type: ControlType.Boolean,
                        title: "Auto Play",
                        defaultValue: true,
                        hidden: (p) => p.mediaType !== "video",
                    },
                    playOnHover: {
                        type: ControlType.Boolean,
                        title: "Play on Hover",
                        defaultValue: false,
                        description: "Only plays the video when hovered.",
                        hidden: (p) =>
                            p.mediaType !== "video" || p.autoPlay === true,
                    },
                    title: {
                        type: ControlType.String,
                        title: "Label",
                        description:
                            "The text caption appearing below the media.",
                    },
                    // link: {
                    //     type: ControlType.Link,
                    //     title: "Link",
                    //     description:
                    //         "Optional URL to navigate to when the card is clicked.",
                    // },
                },
            },
            defaultValue: DEFAULT_ITEMS,
        },
        magneticSnapping: {
            type: ControlType.Boolean,
            title: "Magnetic Snap",
            defaultValue: true,
            description:
                "Forces the carousel to perfectly align to the center item when scrolling stops.",
        },
        sensitivity: {
            type: ControlType.Number,
            title: "Sensitivity",
            min: 0.1,
            max: 3,
            step: 0.1,
            defaultValue: 0.5,
            description:
                "How aggressively the carousel responds to dragging or swiping.",
        },
        stiffness: {
            type: ControlType.Number,
            title: "Snap Stiffness",
            min: 1,
            max: 800,
            step: 10,
            defaultValue: 50,
            description:
                "The rigidity of the spring physics when snapping into place.",
        },
        damping: {
            type: ControlType.Number,
            title: "Snap Damping",
            min: 1,
            max: 100,
            step: 1,
            defaultValue: 25,
            description:
                "The friction applied to the spring physics (higher means less bouncing).",
        },
        mass: {
            type: ControlType.Number,
            title: "Mass",
            min: 0.1,
            max: 10,
            step: 0.1,
            defaultValue: 1,
            description: "The weight of the spring physics.",
        },
        radius: {
            type: ControlType.Number,
            title: "Circle Radius",
            min: 500,
            max: 3000,
            step: 10,
            defaultValue: 1600,
            description:
                "The width of the invisible circle guiding the rotation path.",
        },
        gap: {
            type: ControlType.Number,
            title: "Angle Gap",
            min: 10,
            max: 90,
            step: 1,
            defaultValue: 40,
            description: "The physical degree of separation between each item.",
        },
        itemWidth: {
            type: ControlType.Number,
            title: "Card Width",
            min: 100,
            max: 800,
            step: 10,
            defaultValue: 320,
            description: "The width of the individual gallery cards.",
        },
        itemHeight: {
            type: ControlType.Number,
            title: "Card Height",
            min: 100,
            max: 1000,
            step: 10,
            defaultValue: 440,
            description: "The height of the individual gallery cards.",
        },
        verticalOffset: {
            type: ControlType.Number,
            title: "Center Y (%)",
            min: -50,
            max: 50,
            step: 1,
            defaultValue: -10,
            description:
                "Vertical positioning offset for the entire component.",
        },
        backgroundColor: {
            type: ControlType.Color,
            title: "Scene Color",
            defaultValue: "#000000",
            description: "The global background color behind the carousel.",
        },
        gradientIntensity: {
            type: ControlType.Number,
            title: "Scene Light",
            min: 0,
            max: 1,
            step: 0.1,
            defaultValue: 0.6,
            description:
                "Intensity of the subtle radial glow behind the center item.",
        },
        borderRadius: {
            type: ControlType.Number,
            title: "Corner Radius",
            min: 0,
            max: 200,
            step: 1,
            defaultValue: 32,
            description: "Rounds the corners of the cards.",
        },
        borderWidth: {
            type: ControlType.Number,
            title: "Border Width",
            min: 0,
            max: 10,
            step: 1,
            defaultValue: 0,
            description: "Thickness of the border around each card.",
        },
        borderColor: {
            type: ControlType.Color,
            title: "Border Color",
            defaultValue: "rgba(255,255,255,0.1)",
            description: "Color of the border around each card.",
        },
        shadowColor: {
            type: ControlType.Color,
            title: "Shadow Color",
            defaultValue: "#000000",
            description: "The color of the drop shadow under the cards.",
        },
        shadowOpacity: {
            type: ControlType.Number,
            title: "Shadow Intensity",
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.8,
            description: "The transparency of the drop shadow.",
        },
        shadowBlur: {
            type: ControlType.Number,
            title: "Shadow Blur",
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 40,
            description: "How spread out and soft the shadow is.",
        },
        inactiveOpacity: {
            type: ControlType.Number,
            title: "Side Opacity",
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.4,
            description:
                "Transparency of the items when they move away from the center.",
        },
        blurStrength: {
            type: ControlType.Number,
            title: "Blur Strength",
            min: 0,
            max: 50,
            step: 1,
            defaultValue: 10,
            description:
                "How blurry the side items become as they rotate away.",
        },
        scaleStrength: {
            type: ControlType.Number,
            title: "Focus Scale",
            min: 1,
            max: 2,
            step: 0.05,
            defaultValue: 1.15,
            description: "How much the center item magnifies.",
        },
        parallaxStrength: {
            type: ControlType.Number,
            title: "Parallax",
            min: 0,
            max: 50,
            step: 1,
            defaultValue: 12,
            description:
                "Intensity of the internal image shifting as the card rotates.",
        },
        captionSize: {
            type: ControlType.Number,
            title: "Text Size",
            min: 10,
            max: 80,
            step: 1,
            defaultValue: 18,
            description: "Font size for the label.",
        },
        captionColor: {
            type: ControlType.Color,
            title: "Text Color",
            defaultValue: "#ffffff",
            description: "Color of the label text.",
        },
        captionWeight: {
            type: ControlType.Enum,
            title: "Weight",
            options: [300, 400, 500, 600, 700, 800, 900],
            defaultValue: 600,
            description: "Font thickness for the label.",
        },
        captionLetterSpacing: {
            type: ControlType.Number,
            title: "Letter Spacing",
            min: -0.1,
            max: 0.5,
            step: 0.01,
            defaultValue: -0.02,
            description: "Spacing between the characters of the label.",
        },
        captionGap: {
            type: ControlType.Number,
            title: "Text Gap",
            min: 0,
            max: 150,
            step: 1,
            defaultValue: 20,
            description:
                "Distance between the bottom of the card and the label.",
        },
    })
}
