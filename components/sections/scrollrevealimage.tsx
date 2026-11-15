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

import { useRef } from "react"

/**
 * SCROLL REVEAL — Clip-path Image Wipe
 * - Every image on the page reveals on scroll using:
 *   clip-path: inset(100% 0 0 0) → clip-path: inset(0% 0 0 0)
 * - This creates a bottom-to-top wipe reveal effect
 * - Duration: 1.1s
 * - Easing: cubic-bezier(0.76, 0, 0.24, 1)
 * - Trigger: when element enters viewport (threshold: 0.15)
 * - Add 0.1s delay per card in a grid (stagger effect)
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ScrollRevealImage(props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Placeholder Image",
        },
        duration = 1.1,
        delay = 0,
        stagger = false,
        staggerDelay = 0.1,
        index = 0,
        threshold = 0.15,
        direction = "bottom-up",
        overlayColor = "#f5f5f5",
        showOverlay = false,
        link,
        hoverEffect = false,
        hoverScale = 1.05,
        showCaption = false,
        caption = "Image Caption",
        captionFont = {
            fontSize: "16px",
            variant: "Medium",
            textAlign: "left",
        },
        captionColor = "#ffffff",
        captionBackgroundColor = "rgba(0,0,0,0.5)",
        captionPadding = 16,
    } = props

    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, amount: threshold })

    const finalDelay = delay + (stagger ? index * staggerDelay : 0)

    // Define clip-path values based on direction
    const getClipPath = (isHidden) => {
        if (!isHidden) return "inset(0% 0% 0% 0%)"

        switch (direction) {
            case "bottom-up":
                return "inset(100% 0% 0% 0%)"
            case "top-down":
                return "inset(0% 0% 100% 0%)"
            case "left-right":
                return "inset(0% 100% 0% 0%)"
            case "right-left":
                return "inset(0% 0% 0% 100%)"
            default:
                return "inset(100% 0% 0% 0%)"
        }
    }

    const imgElement = (
        <motion.img
            src={image.src}
            srcSet={image.srcSet}
            alt={image.alt}
            variants={{
                hover: { scale: hoverScale },
            }}
            transition={{ duration: 0.3 }}
            style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
            }}
        />
    )

    const captionElement = showCaption && (
        <div
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                backgroundColor: captionBackgroundColor,
                color: captionColor,
                padding: captionPadding,
                ...captionFont,
            }}
        >
            {caption}
        </div>
    )

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: showOverlay ? overlayColor : "transparent",
            }}
        >
            <motion.div
                initial={{ clipPath: getClipPath(true) }}
                animate={{ clipPath: isInView ? getClipPath(false) : getClipPath(true) }}
                whileHover={hoverEffect ? "hover" : undefined}
                transition={{
                    duration: duration,
                    ease: [0.76, 0, 0.24, 1],
                    delay: finalDelay,
                }}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                {link ? (
                    <a
                        href={link}
                        style={{
                            display: "block",
                            width: "100%",
                            height: "100%",
                            cursor: "pointer",
                            position: "relative",
                            textDecoration: "none",
                        }}
                    >
                        {imgElement}
                        {captionElement}
                    </a>
                ) : (
                    <>
                        {imgElement}
                        {captionElement}
                    </>
                )}
            </motion.div>
        </div>
    )
}

addPropertyControls(ScrollRevealImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    showCaption: {
        type: ControlType.Boolean,
        title: "Caption",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    caption: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Image Caption",
        hidden: (props) => !props.showCaption,
    },
    captionFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            textAlign: "left",
        },
        hidden: (props) => !props.showCaption,
    },
    captionColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
        hidden: (props) => !props.showCaption,
    },
    captionBackgroundColor: {
        type: ControlType.Color,
        title: "Bg Color",
        defaultValue: "rgba(0,0,0,0.5)",
        hidden: (props) => !props.showCaption,
    },
    captionPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        hidden: (props) => !props.showCaption,
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover",
        defaultValue: false,
        enabledTitle: "Scale",
        disabledTitle: "None",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Scale",
        defaultValue: 1.05,
        min: 1,
        max: 1.5,
        step: 0.01,
        hidden: (props) => !props.hoverEffect,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["bottom-up", "top-down", "left-right", "right-left"],
        optionTitles: ["Bottom Up", "Top Down", "Left to Right", "Right to Left"],
        defaultValue: "bottom-up",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1.1,
        min: 0.1,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Boolean,
        title: "Stagger",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Per Item",
        defaultValue: 0.1,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
        hidden: (props) => !props.stagger,
    },
    index: {
        type: ControlType.Number,
        title: "Index",
        defaultValue: 0,
        min: 0,
        step: 1,
        displayStepper: true,
        hidden: (props) => !props.stagger,
    },
    threshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    showOverlay: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#f5f5f5",
        hidden: (props) => !props.showOverlay,
    },
})