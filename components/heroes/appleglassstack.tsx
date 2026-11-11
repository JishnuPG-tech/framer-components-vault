// Apple liquid glass style boxes with title, body copy, optional background image, and animated hover effect with shine pass-through

import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, startTransition, type CSSProperties } from "react"

interface GlassBoxItem {
    title: string
    body: string
    backgroundImage?: {
        src: string
        alt: string
    }
}

interface AppleGlassStackProps {
    items: GlassBoxItem[]
    direction: "vertical" | "horizontal"
    gap: number
    backgroundColor: string
    glassOpacity: number
    borderRadius: number
    padding: number
    titleFont: CSSProperties
    bodyFont: CSSProperties
    titleColor: string
    bodyColor: string
    hoverLift: number
    containerPadding: number
    allowOverflow: boolean
    backgroundBlur: number
    strokeSize: number
    strokeColor: string
    shineColor: string
    boxWidth: number
    boxHeight: number
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function AppleGlassStack(props: AppleGlassStackProps) {
    const {
        items,
        direction,
        gap,
        backgroundColor,
        glassOpacity,
        borderRadius,
        padding,
        titleFont,
        bodyFont,
        titleColor,
        bodyColor,
        hoverLift,
        containerPadding,
        allowOverflow,
        backgroundBlur,
        style,
    } = props

    return (
        <div
            style={{
                ...style,
                display: "flex",
                flexDirection: direction === "vertical" ? "column" : "row",
                gap: `${gap}px`,
                width: "100%",
                height: "100%",
                overflow: allowOverflow ? "visible" : "hidden",
                padding: `${containerPadding}px`,
                boxSizing: "border-box",
            }}
        >
            {items.map((item, index) => (
                <GlassBox
                    key={index}
                    item={item}
                    backgroundColor={backgroundColor}
                    glassOpacity={glassOpacity}
                    borderRadius={borderRadius}
                    padding={padding}
                    titleFont={titleFont}
                    bodyFont={bodyFont}
                    titleColor={titleColor}
                    bodyColor={bodyColor}
                    hoverLift={hoverLift}
                    backgroundBlur={backgroundBlur}
                    strokeSize={props.strokeSize}
                    strokeColor={props.strokeColor}
                    shineColor={props.shineColor}
                    boxWidth={props.boxWidth}
                    boxHeight={props.boxHeight}
                />
            ))}
        </div>
    )
}

interface GlassBoxProps {
    item: GlassBoxItem
    backgroundColor: string
    glassOpacity: number
    borderRadius: number
    padding: number
    titleFont: CSSProperties
    bodyFont: CSSProperties
    titleColor: string
    bodyColor: string
    hoverLift: number
    backgroundBlur: number
    strokeSize: number
    strokeColor: string
    shineColor: string
    boxWidth: number
    boxHeight: number
}

function GlassBox(props: GlassBoxProps) {
    const {
        item,
        backgroundColor,
        glassOpacity,
        borderRadius,
        padding,
        titleFont,
        bodyFont,
        titleColor,
        bodyColor,
        hoverLift,
        backgroundBlur,
        strokeSize,
        strokeColor,
        shineColor,
        boxWidth,
        boxHeight,
    } = props

    const [isHovered, setIsHovered] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        startTransition(() => setMousePosition({ x, y }))
    }

    const handleMouseLeave = () => {
        startTransition(() => {
            setIsHovered(false)
            setMousePosition({ x: 0, y: 0 })
        })
    }

    return (
        <div
            style={{
                perspective: "1000px",
                width: "100%",
            }}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: `${boxWidth}px`,
                    minHeight: `${boxHeight}px`,
                    borderRadius: `${borderRadius}px`,
                    overflow: "hidden",
                    cursor: "pointer",
                    backdropFilter: `blur(${backgroundBlur}px)`,
                    WebkitBackdropFilter: `blur(${backgroundBlur}px)`,
                    transformStyle: "preserve-3d",
                }}
                onMouseEnter={() => startTransition(() => setIsHovered(true))}
                onMouseLeave={handleMouseLeave}
                onMouseMove={handleMouseMove}
                animate={{
                    y: isHovered ? -hoverLift : 0,
                    x: isHovered ? mousePosition.x * 10 : 0,
                    scale: isHovered ? 1.02 : 1,
                }}
                transition={{
                    duration: 0.3,
                    ease: "easeOut",
                }}
            >
                {/* Background Image with Blur */}
                {item.backgroundImage && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${item.backgroundImage.src})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            zIndex: 0,
                        }}
                        role="img"
                        aria-label={item.backgroundImage.alt}
                    />
                )}

                {/* Glass Effect Layer */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: backgroundColor,
                        opacity: glassOpacity,
                        borderRadius: `${borderRadius}px`,
                        zIndex: 1,
                    }}
                />

                {/* Shine Effect */}
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(90deg, transparent 0%, ${shineColor} 49.5%, ${shineColor} 50%, ${shineColor} 50.5%, transparent 100%)`,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                    initial={{ x: "-100%" }}
                    animate={{
                        x: isHovered ? "100%" : "-100%",
                    }}
                    transition={{
                        duration: 0.8,
                        ease: [0.25, 0.1, 0.25, 1],
                    }}
                />

                {/* Border */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        border: `${strokeSize}px solid ${strokeColor}`,
                        borderRadius: `${borderRadius}px`,
                        zIndex: 2,
                        pointerEvents: "none",
                    }}
                />

                {/* Content */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 3,
                        padding: `${padding}px`,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        minHeight: `${boxHeight}px`,
                        gap: "12px",
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            color: titleColor,
                            ...titleFont,
                        }}
                    >
                        {item.title}
                    </h3>
                    <p
                        style={{
                            margin: 0,
                            color: bodyColor,
                            ...bodyFont,
                        }}
                    >
                        {item.body}
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(AppleGlassStack, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Glass Box",
                },
                body: {
                    type: ControlType.String,
                    title: "Body",
                    defaultValue: "Beautiful liquid glass effect with smooth animations",
                    displayTextArea: true,
                },
                backgroundImage: {
                    type: ControlType.ResponsiveImage,
                    title: "Background Image",
                },
            },
        },
        defaultValue: [
            {
                title: "Innovation",
                body: "Experience the future of design with liquid glass aesthetics",
            },
            {
                title: "Performance",
                body: "Smooth animations and seamless interactions",
            },
            {
                title: "Design",
                body: "Beautiful glassmorphism inspired by Apple's design language",
            },
        ],
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
        displaySegmentedControl: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    containerPadding: {
        type: ControlType.Number,
        title: "Container Padding",
        defaultValue: 20,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    allowOverflow: {
        type: ControlType.Boolean,
        title: "Allow Overflow",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Glass Color",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Opacity",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 24,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "#FFFFFF",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Body Color",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    hoverLift: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
    },
    backgroundBlur: {
        type: ControlType.Number,
        title: "Background Blur",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    strokeSize: {
        type: ControlType.Number,
        title: "Stroke Size",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "rgba(255, 255, 255, 0.18)",
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "rgba(255, 255, 255, 0.25)",
    },
    boxWidth: {
        type: ControlType.Number,
        title: "Box Width",
        defaultValue: 300,
        min: 100,
        max: 1000,
        step: 10,
        unit: "px",
    },
    boxHeight: {
        type: ControlType.Number,
        title: "Box Height",
        defaultValue: 200,
        min: 100,
        max: 800,
        step: 10,
        unit: "px",
    },
})