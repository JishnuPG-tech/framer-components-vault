// 3D Flip Card component with customizable animation properties and slots for front/back content
import { useState, useEffect, startTransition, useCallback, useMemo, type CSSProperties } from "react"
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


interface FlipCardProps {
    frontContent: React.ReactNode
    backContent: React.ReactNode
    flipDirection: "horizontal" | "vertical"
    flipTrigger: "hover" | "click"
    animationDuration: number
    easingFunction: "linear" | "easeIn" | "easeOut" | "easeInOut" | "backIn" | "backOut" | "backInOut" | "bounceIn" | "bounceOut" | "bounceInOut"
    perspective: number
    backgroundColor: string
    borderRadius: number
    shadow: boolean
    autoFlip: boolean
    autoFlipInterval: number
    style?: CSSProperties
}

/**
 * 3D Flip Card component with customizable animation properties
 * Supports front and back content slots with various flip animations
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FlipCard(props: FlipCardProps) {
    const {
        frontContent,
        backContent,
        flipDirection = "horizontal",
        flipTrigger = "hover",
        animationDuration = 0.6,
        easingFunction = "easeInOut",
        perspective = 1000,
        backgroundColor = "#FFFFFF",
        borderRadius = 12,
        shadow = true,
        autoFlip = false,
        autoFlipInterval = 3,
        style,
    } = props

    const [isFlipped, setIsFlipped] = useState(false)

    const handleFlip = useCallback(() => {
        if (flipTrigger === "click") {
            startTransition(() => setIsFlipped(prev => !prev))
        }
    }, [flipTrigger])

    const handleMouseEnter = useCallback(() => {
        if (flipTrigger === "hover") {
            startTransition(() => setIsFlipped(true))
        }
    }, [flipTrigger])

    const handleMouseLeave = useCallback(() => {
        if (flipTrigger === "hover") {
            startTransition(() => setIsFlipped(false))
        }
    }, [flipTrigger])

    // Auto flip effect
    useEffect(() => {
        if (autoFlip && flipTrigger === "click") {
            const interval = setInterval(() => {
                startTransition(() => setIsFlipped(prev => !prev))
            }, autoFlipInterval * 1000)
            return () => clearInterval(interval)
        }
    }, [autoFlip, autoFlipInterval, flipTrigger])

    const isHorizontal = flipDirection === "horizontal"
    const rotateAxis = isHorizontal ? "rotateY" : "rotateX"
    
    const animations = useMemo(() => {
        const frontRotation = isFlipped ? (isHorizontal ? -180 : -180) : 0
        const backRotation = isFlipped ? 0 : (isHorizontal ? 180 : 180)
        
        return {
            front: { [rotateAxis]: frontRotation },
            back: { [rotateAxis]: backRotation }
        }
    }, [isFlipped, isHorizontal, rotateAxis])

    const transition = useMemo(() => ({
        duration: animationDuration,
        ease: easingFunction,
    }), [animationDuration, easingFunction])

    const cardStyle: CSSProperties = useMemo(() => ({
        ...style,
        width: style?.width || "100%",
        height: style?.height || "100%",
        minWidth: "5px",
        minHeight: "5px",
        position: "relative",
        perspective: `${perspective}px`,
        cursor: flipTrigger === "click" ? "pointer" : "default",
        transformStyle: "preserve-3d",
    }), [style, perspective, flipTrigger])

    const faceStyle: CSSProperties = useMemo(() => ({
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        backgroundColor,
        borderRadius: `${borderRadius}px`,
        boxShadow: shadow ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        overflow: "hidden",
        willChange: "transform",
    }), [backgroundColor, borderRadius, shadow])

    const contentStyle: CSSProperties = useMemo(() => ({
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 auto",
        minWidth: 0,
        minHeight: 0,
    }), [])

    const backFaceInitialStyle = useMemo(() => ({
        ...faceStyle,
        transform: isHorizontal ? "rotateY(180deg)" : "rotateX(180deg)",
    }), [faceStyle, isHorizontal])

    return (
        <div
            style={cardStyle}
            onClick={handleFlip}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Front Face */}
            <motion.div
                style={faceStyle}
                animate={animations.front}
                transition={transition}
                initial={false}
            >
                <div style={contentStyle}>
                    {frontContent}
                </div>
            </motion.div>

            {/* Back Face */}
            <motion.div
                style={backFaceInitialStyle}
                animate={animations.back}
                transition={transition}
                initial={false}
            >
                <div style={contentStyle}>
                    {backContent}
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(FlipCard, {
    frontContent: {
        type: ControlType.Slot,
        title: "Front Content",
    },
    backContent: {
        type: ControlType.Slot,
        title: "Back Content",
    },
    flipDirection: {
        type: ControlType.Enum,
        title: "Flip Direction",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    flipTrigger: {
        type: ControlType.Enum,
        title: "Flip Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
        displaySegmentedControl: true,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Duration",
        defaultValue: 0.6,
        min: 0.1,
        max: 2,
        step: 0.1,
        unit: "s",
    },
    easingFunction: {
        type: ControlType.Enum,
        title: "Easing Function",
        options: ["linear", "easeIn", "easeOut", "easeInOut", "backIn", "backOut", "backInOut", "bounceIn", "bounceOut", "bounceInOut"],
        optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In Out", "Back In", "Back Out", "Back In Out", "Bounce In", "Bounce Out", "Bounce In Out"],
        defaultValue: "easeInOut",
    },
    perspective: {
        type: ControlType.Number,
        title: "3D Perspective",
        defaultValue: 1000,
        min: 500,
        max: 2000,
        step: 50,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    autoFlip: {
        type: ControlType.Boolean,
        title: "Auto Flip",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ flipTrigger }) => flipTrigger === "hover",
    },
    autoFlipInterval: {
        type: ControlType.Number,
        title: "Auto Flip Interval",
        defaultValue: 3,
        min: 1,
        max: 10,
        step: 0.5,
        unit: "s",
        hidden: ({ autoFlip, flipTrigger }) => !autoFlip || flipTrigger === "hover",
    },
})