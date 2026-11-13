import { useState } from "react"
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


/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 */
export default function HoverRevealImage(props) {
    const {
        image,
        blurAmount,
        transitionDuration,
        transitionEasing,
        scaleOnHover,
        brightnessOnBlur,
        overlayColor,
        overlayOpacity,
        borderRadius,
        style,
    } = props

    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
                cursor: "pointer",
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            {/* Main Image */}
            <motion.img
                src={image.src || image}
                srcSet={image.srcSet}
                alt={image.alt || "Hover to reveal"}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${image.positionX || "50%"} ${image.positionY || "50%"}`,
                }}
                animate={{
                    filter: isHovered
                        ? "blur(0px) brightness(100%)"
                        : `blur(${blurAmount}px) brightness(${brightnessOnBlur}%)`,
                    scale: isHovered && scaleOnHover ? 1.05 : 1,
                }}
                transition={{
                    duration: transitionDuration,
                    ease: transitionEasing,
                }}
            />

            {/* Overlay */}
            {overlayOpacity > 0 && (
                <motion.div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: overlayColor,
                        pointerEvents: "none",
                    }}
                    animate={{
                        opacity: isHovered ? 0 : overlayOpacity / 100,
                    }}
                    transition={{
                        duration: transitionDuration,
                        ease: transitionEasing,
                    }}
                />
            )}
        </motion.div>
    )
}

HoverRevealImage.defaultProps = {
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    blurAmount: 20,
    transitionDuration: 0.5,
    transitionEasing: "easeInOut",
    scaleOnHover: true,
    brightnessOnBlur: 80,
    overlayColor: "#000000",
    overlayOpacity: 30,
    borderRadius: 0,
}

addPropertyControls(HoverRevealImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur Amount",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 20,
        unit: "px",
        displayStepper: true,
    },
    brightnessOnBlur: {
        type: ControlType.Number,
        title: "Brightness (Blur)",
        min: 0,
        max: 150,
        step: 5,
        defaultValue: 80,
        unit: "%",
        displayStepper: true,
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 30,
        unit: "%",
        displayStepper: true,
    },
    scaleOnHover: {
        type: ControlType.Boolean,
        title: "Scale on Hover",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Transition Speed",
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 0.5,
        unit: "s",
        displayStepper: true,
    },
    transitionEasing: {
        type: ControlType.Enum,
        title: "Easing",
        options: [
            "linear",
            "easeIn",
            "easeOut",
            "easeInOut",
            "circIn",
            "circOut",
            "circInOut",
            "backIn",
            "backOut",
            "backInOut",
        ],
        optionTitles: [
            "Linear",
            "Ease In",
            "Ease Out",
            "Ease In Out",
            "Circ In",
            "Circ Out",
            "Circ In Out",
            "Back In",
            "Back Out",
            "Back In Out",
        ],
        defaultValue: "easeInOut",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
        unit: "px",
        displayStepper: true,
    },
})
