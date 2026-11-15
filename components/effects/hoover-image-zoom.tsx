// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, useRef } from "react"
import {
    borderProp,
    Border,
} from "https://framer.com/m/Framestack-SOWL.js@uaBGH0RSxo4YBCxquaGO"
import { motion } from "framer-motion"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 *
 * @framerDisableUnlink
 *
 */
export default function ImageZoom(props) {
    const { action } = props
    const [zoom, setZoom] = useState(false)
    const [origin, setOrigin] = useState([50, 50])
    const imgRef = useRef(null)

    const updateOrigin = (e) => {
        const { left, top, width, height } =
            imgRef.current.getBoundingClientRect()
        let x = ((e.clientX - left) / width) * 100
        let y = ((e.clientY - top) / height) * 100
        x = Math.max(0, Math.min(100, x))
        y = Math.max(0, Math.min(100, y))
        setOrigin([x, y])
    }

    const handleMouseEnter = () => {
        if (action == "hover") {
            setZoom(true)
        }
    }

    const handleMouseLeave = () => {
        if (action == "hover") {
            setZoom(false)
        }
    }

    const handleMouseUp = (e) => {
        if (action == "press") {
            setZoom(false)
            updateOrigin(e)
            document.removeEventListener("mousemove", updateOrigin)
            document.removeEventListener("mouseup", handleMouseUp)
        }
    }

    const handleMouseDown = (e) => {
        if (action == "press") {
            setZoom(true)
            updateOrigin(e)
            document.addEventListener("mousemove", updateOrigin)
            document.addEventListener("mouseup", handleMouseUp)
        }
    }

    const handleMouseMove = (e) => {
        if (zoom && action == "hover") {
            updateOrigin(e)
        }
    }

    const preventDragHandler = (e) => {
        e.preventDefault()
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onDragStart={preventDragHandler}
            style={{
                borderRadius: props.radius,
                boxShadow: props.shadows,
                overflow: "hidden",
                position: "relative",
                backgroundColor: props.background,
                ...props.style,
            }}
        >
            <motion.img
                ref={imgRef}
                src={props.image?.src}
                alt={props.image?.alt}
                initial={{ scale: 1 }}
                animate={{ scale: zoom ? props.zoomLevel : 1 }}
                draggable="false"
                style={{
                    transformOrigin: `${origin[0]}% ${origin[1]}%`,
                    width: "100%",
                    height: "100%",
                    objectFit: props.sizing,
                    userSelect: "none",
                }}
                transition={props.transition}
            />
            <Border {...props.border} radius={props.radius} />
        </div>
    )
}

ImageZoom.displayName = "Image Zoom"

addPropertyControls(ImageZoom, {
    image: {
        type: ControlType.ResponsiveImage,
        description: "Upload Image",
    },
    sizing: {
        type: ControlType.Enum,
        defaultValue: "cover",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Fill", "Fit", "Stretch"],
        description: "Set the image fill",
    },
    zoomLevel: {
        type: ControlType.Number,
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 0.01,
        unit: "x",
        title: "Zoom",
        description: "Set your zoom level",
    },
    action: {
        type: ControlType.Enum,
        options: ["hover", "press"],
        optionTitles: ["Hover", "Press"],
        displaySegmentedControl: true,
        title: "Zoom On",
        description: "Set the type of interaction for zoom effect",
    },
    radius: {
        type: ControlType.BorderRadius,
        description: "Configure your radius settings",
    },
    border: borderProp({}),
    shadows: {
        type: ControlType.BoxShadow,
        description: "Configure your shadhow settings",
    },
    background: {
        type: ControlType.Color,
        optional: true,
        description: "Set your fallback bg",
    },
    transition: {
        type: ControlType.Transition,
        defaultValue: {
            type: "spring",
            duration: 0.5,
            bounce: 0,
        },
        description:
            "Choose animation style \n \n Made with 🖤 for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works/)",
    },
})
