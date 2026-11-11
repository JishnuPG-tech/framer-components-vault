import { useRef } from "react"
import {
    motion,
    useScroll,
    useTransform,
    useReducedMotion,
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


/**
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function TrueParallaxImage(props) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        },
        altText = "True Parallax Image",
        radius = 12,
        intensity = 20,
        reverse = false,
        style,
    } = props

    const containerRef = useRef(null)
    const prefersReducedMotion = useReducedMotion()
    const isStatic = useIsStaticRenderer()

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const yTransform = useTransform(
        scrollYProgress,
        [0, 1],
        reverse
            ? [`${intensity}%`, `-${intensity}%`]
            : [`-${intensity}%`, `${intensity}%`]
    )

    const y = prefersReducedMotion || isStatic ? 0 : yTransform

    // Render static fallback for canvas/export
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: radius,
                    backgroundColor: "transparent",
                }}
            >
                <img
                    src={image?.src}
                    srcSet={image?.srcSet}
                    alt={altText || image?.alt}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                backgroundColor: "transparent",
            }}
        >
            <motion.div
                style={{
                    width: "100%",
                    height: "100%",
                    y,
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            >
                <img
                    src={image?.src}
                    srcSet={image?.srcSet}
                    alt={altText || image?.alt}
                    style={{
                        position: "absolute",
                        top: prefersReducedMotion ? "0%" : `-${intensity}%`,
                        left: 0,
                        right: 0,
                        width: "100%",
                        height: prefersReducedMotion
                            ? "100%"
                            : `${100 + intensity * 2}%`,
                        objectFit: "cover",
                    }}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(TrueParallaxImage, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        defaultValue: 0,
    },
    intensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 100,
        defaultValue: 20,
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    altText: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "True Parallax Image",
        description:
            "Crafted by [Shouvik Biswas](https://dub.sh/framer-components)",
    },
})

TrueParallaxImage.displayName = "True Parallax Image"
