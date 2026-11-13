// WindChime.tsx
import * as React from "react"
import { useRef, useState } from "react"
import {
    motion,
    useAnimationFrame,
    useMotionValue,
    useTransform,
    MotionValue,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export interface ChimeItem {
    id?: string
    image?: {
        src?: string
        alt?: string
        srcSet?: string
        positionX?: string
        positionY?: string
    }
    hangerLength?: number
}

interface Props {
    chimes: ChimeItem[]
    globalSettings: {
        imageWidth: number
        imageHeight: number
        spacing: number
        showImageBorder: boolean
        imageBorderRadius: number
    }
    stringSettings: {
        hangerColor: string
        hangerThickness: number
    }
    railSettings: {
        railColor: string
        railThickness: number
        railWidth: number
    }
    animationSettings: {
        ambientSwing: boolean
        ambientIntensity: number
        dragElasticity: number
    }
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 600
 */
export default function WindChime(props: Props) {
    const {
        chimes = [],
        globalSettings,
        stringSettings,
        railSettings,
        animationSettings,
        style = {},
    } = props

    const {
        imageWidth,
        imageHeight,
        spacing,
        showImageBorder,
        imageBorderRadius,
    } = globalSettings

    const { hangerColor, hangerThickness } = stringSettings
    const { railColor, railThickness, railWidth } = railSettings
    const { ambientSwing, ambientIntensity, dragElasticity } = animationSettings

    const swingTime = useMotionValue(0)

    useAnimationFrame((time) => {
        if (ambientSwing) {
            swingTime.set(time * 0.001)
        }
    })

    const totalWidth =
        imageWidth * chimes.length + spacing * (chimes.length - 1)
    const containerWidth = Math.max(totalWidth, railWidth)

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 40,
                paddingBottom: 40,
                boxSizing: "border-box",
                position: "relative",
                ...style,
            }}
        >
            {/* Mounting Rail */}
            <div
                style={{
                    width: railWidth,
                    height: railThickness,
                    backgroundColor: railColor,
                    borderRadius: railThickness / 2,
                    marginBottom: 16,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
            />

            {/* Chimes Container */}
            <div
                style={{
                    display: "flex",
                    gap: spacing,
                    justifyContent: "center",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                {chimes.length === 0 &&
                RenderTarget.current() === RenderTarget.canvas ? (
                    <div
                        style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#999",
                            fontSize: "14px",
                            border: "2px dashed #ccc",
                            borderRadius: "8px",
                        }}
                    >
                        Add chimes using the "Chimes" property
                    </div>
                ) : (
                    chimes.map((chime, index) => {
                        const swingPhase = (index / chimes.length) * Math.PI * 2

                        return (
                            <WindChimeItem
                                key={chime.id || `chime-${index}`}
                                chime={chime}
                                swingTime={swingTime}
                                swingPhase={swingPhase}
                                ambientSwing={ambientSwing}
                                ambientIntensity={ambientIntensity}
                                dragElasticity={dragElasticity}
                                imageWidth={imageWidth}
                                imageHeight={imageHeight}
                                hangerThickness={hangerThickness}
                                hangerColor={hangerColor}
                                imageBorderRadius={imageBorderRadius}
                                showImageBorder={showImageBorder}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}

// Individual Wind Chime Item Component
const WindChimeItem = React.memo(
    ({
        chime,
        swingTime,
        swingPhase,
        ambientSwing,
        ambientIntensity,
        dragElasticity,
        imageWidth,
        imageHeight,
        hangerThickness,
        hangerColor,
        imageBorderRadius,
        showImageBorder,
    }: {
        chime: ChimeItem
        swingTime: MotionValue<number>
        swingPhase: number
        ambientSwing: boolean
        ambientIntensity: number
        dragElasticity: number
        imageWidth: number
        imageHeight: number
        hangerThickness: number
        hangerColor: string
        imageBorderRadius: number
        showImageBorder: boolean
    }) => {
        const [isDragging, setIsDragging] = useState(false)
        const y = useMotionValue(0)
        const x = useMotionValue(0)

        // Ambient swing rotation
        const ambientRotate = useTransform(swingTime, (time: number) => {
            if (!ambientSwing || isDragging) return 0
            return Math.sin(time * 0.6 + swingPhase) * ambientIntensity * 4
        })

        // Drag-based rotation
        const dragRotate = useTransform(x, [-100, 0, 100], [-15, 0, 15])

        // String stretching based on drag distance
        const stringStretch = useTransform(y, (value) => {
            return Math.max(0, value * 0.5)
        })

        // Combine rotations
        const rotate = useTransform(() => {
            const ambient = ambientRotate.get()
            const drag = dragRotate.get()
            return isDragging ? drag : ambient
        }, [ambientRotate, dragRotate])

        return (
            <div
                style={{
                    width: imageWidth,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                {/* Vertical string - stretches with drag */}
                <motion.div
                    style={{
                        width: hangerThickness,
                        height: chime.hangerLength || 150,
                        backgroundColor: hangerColor,
                        marginBottom: 0,
                        scaleY: useTransform(
                            stringStretch,
                            (stretch) =>
                                1 + stretch / (chime.hangerLength || 150)
                        ),
                        transformOrigin: "top center",
                    }}
                />

                <motion.div
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={dragElasticity}
                    dragTransition={{
                        power: 0.2,
                        timeConstant: 200,
                        bounceStiffness: 100,
                        bounceDamping: 10,
                    }}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => {
                        setIsDragging(false)
                        x.set(0)
                        y.set(0)
                    }}
                    style={{
                        x,
                        y,
                        rotate,
                        transformOrigin: "top center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        cursor: isDragging ? "grabbing" : "grab",
                    }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    {/* Horizontal connector */}
                    <div
                        style={{
                            width: Math.min(imageWidth * 0.3, 50),
                            height: hangerThickness,
                            backgroundColor: hangerColor,
                            marginBottom: 8,
                            borderRadius: hangerThickness / 2,
                        }}
                    />

                    {/* Image */}
                    {chime.image?.src ? (
                        <img
                            src={chime.image.src}
                            srcSet={chime.image.srcSet}
                            alt={chime.image.alt || "wind chime"}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: imageHeight,
                                objectFit: "cover",
                                objectPosition: `${chime.image.positionX || "50%"} ${chime.image.positionY || "50%"}`,
                                borderRadius: imageBorderRadius,
                                border: showImageBorder
                                    ? "1px solid rgba(0,0,0,0.1)"
                                    : "none",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                display: "block",
                                userSelect: "none",
                                pointerEvents: "none",
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "100%",
                                height: imageHeight,
                                background:
                                    "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                                borderRadius: imageBorderRadius,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                fontSize: Math.min(imageWidth * 0.1, 16),
                                border: "2px dashed #ccc",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            }}
                        >
                            {RenderTarget.current() === RenderTarget.canvas
                                ? "Add Image"
                                : ""}
                        </div>
                    )}
                </motion.div>
            </div>
        )
    }
)

// Default props
WindChime.defaultProps = {
    chimes: [
        { id: "chime-1", hangerLength: 120 },
        { id: "chime-2", hangerLength: 180 },
        { id: "chime-3", hangerLength: 150 },
    ],
    globalSettings: {
        imageWidth: 140,
        imageHeight: 200,
        spacing: 60,
        showImageBorder: true,
        imageBorderRadius: 8,
    },
    stringSettings: {
        hangerColor: "#8B7355",
        hangerThickness: 2,
    },
    railSettings: {
        railColor: "#654321",
        railThickness: 8,
        railWidth: 400,
    },
    animationSettings: {
        ambientSwing: true,
        ambientIntensity: 0.4,
        dragElasticity: 0.3,
    },
}

// Property controls with organized grouping
addPropertyControls(WindChime, {
    chimes: {
        type: ControlType.Array,
        title: "Chimes",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                hangerLength: {
                    type: ControlType.Number,
                    title: "String Length",
                    min: 40,
                    max: 400,
                    defaultValue: 150,
                    unit: "px",
                    displayStepper: true,
                },
            },
        },
        defaultValue: WindChime.defaultProps.chimes,
        maxCount: 20,
    },
    globalSettings: {
        type: ControlType.Object,
        title: "Global Settings",
        controls: {
            imageWidth: {
                type: ControlType.Number,
                title: "Image Width",
                min: 60,
                max: 400,
                defaultValue: 140,
                unit: "px",
                displayStepper: true,
            },
            imageHeight: {
                type: ControlType.Number,
                title: "Image Height",
                min: 60,
                max: 600,
                defaultValue: 200,
                unit: "px",
                displayStepper: true,
            },
            spacing: {
                type: ControlType.Number,
                title: "Chime Spacing",
                min: 20,
                max: 200,
                defaultValue: 60,
                unit: "px",
                displayStepper: true,
            },
            showImageBorder: {
                type: ControlType.Boolean,
                title: "Show Border",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
            imageBorderRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 128,
                defaultValue: 8,
                unit: "px",
                displayStepper: true,
            },
        },
        buttonTitle: "Configure Images",
    },
    stringSettings: {
        type: ControlType.Object,
        title: "String Settings",
        controls: {
            hangerColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#8B7355",
            },
            hangerThickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 1,
                max: 8,
                defaultValue: 2,
                unit: "px",
                displayStepper: true,
            },
        },
        buttonTitle: "Configure Strings",
    },
    railSettings: {
        type: ControlType.Object,
        title: "Rail Settings",
        controls: {
            railColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#654321",
            },
            railThickness: {
                type: ControlType.Number,
                title: "Thickness",
                min: 2,
                max: 20,
                defaultValue: 8,
                unit: "px",
                displayStepper: true,
            },
            railWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 200,
                max: 800,
                defaultValue: 400,
                unit: "px",
                displayStepper: true,
            },
        },
        buttonTitle: "Configure Rail",
    },
    animationSettings: {
        type: ControlType.Object,
        title: "Animation Settings",
        controls: {
            ambientSwing: {
                type: ControlType.Boolean,
                title: "Ambient Swing",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            ambientIntensity: {
                type: ControlType.Number,
                title: "Swing Intensity",
                min: 0,
                max: 2,
                step: 0.1,
                defaultValue: 0.4,
            },
            dragElasticity: {
                type: ControlType.Number,
                title: "Drag Elasticity",
                min: 0.1,
                max: 1,
                step: 0.05,
                defaultValue: 0.3,
            },
        },
        buttonTitle: "Configure Animation",
    },
})
