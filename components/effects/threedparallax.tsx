import * as React from "react"
import { useState, useRef, useMemo } from "react"
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function ThreeDParallax(props) {
    const {
        imageSrc,
        maxRotation,
        perspective,
        popOutDepth,
        radius,
        parallaxIntensity,
        parallaxZDepth,
        backgroundColor,
        isBackgroundEnabled,
        imagePadding,

        // ⭐ NEW: shadows array
        shadows,

        width,
        height,
    } = props

    const [rotation, setRotation] = useState({ x: 0, y: 0 })
    const elementRef = useRef(null)

    const handleMouseMove = (e) => {
        if (!elementRef.current) return

        const bounds = e.currentTarget.getBoundingClientRect()
        const mouseX = e.clientX - bounds.left
        const mouseY = e.clientY - bounds.top

        const normalizedX = (mouseX / bounds.width) * 2 - 1
        const normalizedY = (mouseY / bounds.height) * 2 - 1

        setRotation({
            x: normalizedY * -maxRotation,
            y: normalizedX * maxRotation,
        })
    }

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 })
    }

    const currentBackgroundColor = isBackgroundEnabled
        ? backgroundColor || "#00000000"
        : "#00000000"

    // ⭐ CALCULATE SHADOW: Combine ALL shadows from the array
    const combinedShadow = useMemo(() => {
        if (!shadows || shadows.length === 0) {
            return "none"
        }

        return shadows
            .map((shadow) => {
                // Logic for a single shadow item
                const positionPrefix =
                    shadow.position === "inset" ? "inset " : ""

                // Format: [position] [x] [y] [blur] [spread] [color]
                return `${positionPrefix}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`.trim()
            })
            .join(", ") // Join multiple shadows with a comma and space
    }, [shadows])
    // ⭐

    // 1. Outer wrapper style: Defines the 3D scene.
    const wrapperStyle = useMemo(
        () => ({
            width: width || "100%",
            height: height || "100%",
            position: "relative",
            overflow: "visible",
            perspective: `${perspective}px`,
            perspectiveOrigin: "50% 50%",
            borderRadius: radius,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }),
        [width, height, perspective, radius]
    )

    // 2. Tilt Container style: Applies all the movement.
    const tiltContainerStyle = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "visible",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(${popOutDepth}px)`,
            transition: "transform 0.4s ease-out",
            willChange: "transform",
            transformOrigin: "center center",
            borderRadius: radius,
        }),
        [rotation, popOutDepth, radius]
    )

    // 3. Background Layer Style (Shadow applied here)
    const backgroundStyle = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            transform: "translateZ(-1px)",

            backgroundColor: currentBackgroundColor,
            borderRadius: radius,
            backfaceVisibility: "hidden",

            // Apply the combined CSS shadow string
            boxShadow: combinedShadow,
        }),
        [currentBackgroundColor, radius, combinedShadow]
    )

    // 4. Image Layer Style (Ensuring NO Shadow is applied here)
    const imageLayerStyle = useMemo(() => {
        const shiftX = rotation.y * parallaxIntensity
        const shiftY = rotation.x * parallaxIntensity

        return {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,

            padding: `${imagePadding}px`,
            boxSizing: "border-box",

            transform: `translateX(${-shiftX}px) translateY(${-shiftY}px) translateZ(${parallaxZDepth}px)`,
            transition: "transform 0.4s ease-out",
            willChange: "transform",

            borderRadius: "0px",
            overflow: "hidden",
            backfaceVisibility: "hidden",

            boxShadow: "none",
        }
    }, [rotation, parallaxIntensity, parallaxZDepth, imagePadding])

    // Image Style remains the same
    const imageStyle = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            borderRadius: "0px",
        }),
        []
    )

    // Error/Placeholder remains the same
    if (!imageSrc) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    border: "1px dashed #000000",
                    color: "#000000",
                    textAlign: "center",
                    padding: 20,
                    minWidth: "100px",
                    minHeight: "100px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius,
                    backgroundColor: currentBackgroundColor || "#F0F0F0",
                }}
            >
                Please upload an image
            </div>
        )
    }

    return (
        <div
            ref={elementRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={wrapperStyle}
        >
            <div style={tiltContainerStyle}>
                {/* 3. Background Layer (Shadow applied here) */}
                <div style={backgroundStyle} />

                {/* 4. Image Layer */}
                <div style={imageLayerStyle}>
                    <img
                        src={imageSrc}
                        alt="Pop-out Tilt Image"
                        style={imageStyle}
                    />
                </div>
            </div>
        </div>
    )
}

// Framer Property Controls
addPropertyControls(ThreeDParallax, {
    // --- BASIC CONTROLS ---
    imageSrc: {
        type: ControlType.Image,
        title: "Image Source",
        defaultValue:
            "https://framerusercontent.com/images/kQ3L5Rk3L5pY1R8g9e7rS7zDk.jpg",
    },
    // ... (rest of the basic controls)
    imagePadding: {
        type: ControlType.Number,
        title: "Image Padding (px)",
        defaultValue: 16,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
        tooltip: "Adds space around the image, revealing the background.",
    },
    isBackgroundEnabled: {
        type: ControlType.Boolean,
        title: "Enable BG Color",
        defaultValue: true,
        toggle: true,
        tooltip: "Toggle the solid background color behind the tilting image.",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        defaultValue: "#E0E0E0",
        tooltip: "The solid color background that tilts along with the image.",
    },
    popOutDepth: {
        type: ControlType.Number,
        title: "Pop Out Depth (px)",
        defaultValue: 60,
        min: 0,
        max: 200,
        step: 10,
        unit: "px",
        tooltip:
            "Pushes the entire tilting element forward in the 3D scene (Z-axis).",
    },
    parallaxIntensity: {
        type: ControlType.Number,
        title: "Parallax XY Intensity",
        defaultValue: 0.5,
        min: 0,
        max: 2,
        step: 0.1,
        tooltip:
            "The magnitude of the image shift against the tilt (X, Y axes).",
    },
    parallaxZDepth: {
        type: ControlType.Number,
        title: "Parallax Z-Depth (px)",
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 10,
        unit: "px",
        tooltip:
            "Moves the image closer (+) or further (-) from the background layer, enhancing depth.",
    },
    maxRotation: {
        type: ControlType.Number,
        title: "Max Rotation (°)",
        defaultValue: 10,
        min: 1,
        max: 45,
        step: 1,
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective (px)",
        defaultValue: 300,
        min: 100,
        max: 2000,
        step: 50,
        tooltip:
            "The depth of the 3D space. Lower value results in a more dramatic effect.",
    },
    radius: {
        type: ControlType.Number,
        title: "Border Radius (px)",
        defaultValue: 8,
        min: 0,
        max: 50,
        unit: "px",
        tooltip: "Rounds the corners of the component.",
    },

    // --- MULTI-SHADOW ARRAY CONTROL (Replaces all previous shadow controls) ---
    shadows: {
        type: ControlType.Array,
        title: "Shadows",
        propertyControl: {
            type: ControlType.Object,
            title: "Shadow", // Title for each collapsed item
            controls: {
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "rgba(0, 0, 0, 0.3)",
                },
                position: {
                    type: ControlType.SegmentedEnum,
                    title: "Position",
                    options: ["outside", "inset"],
                    optionTitles: ["Outside", "Inside"],
                    defaultValue: "outside",
                },
                x: {
                    type: ControlType.Number,
                    title: "X Offset (px)",
                    defaultValue: 0,
                    min: -50,
                    max: 50,
                    unit: "px",
                },
                y: {
                    type: ControlType.Number,
                    title: "Y Offset (px)",
                    defaultValue: 10,
                    min: -50,
                    max: 50,
                    unit: "px",
                },
                blur: {
                    type: ControlType.Number,
                    title: "Blur (px)",
                    defaultValue: 20,
                    min: 0,
                    max: 100,
                    unit: "px",
                },
                spread: {
                    type: ControlType.Number,
                    title: "Spread (px)",
                    defaultValue: 0,
                    min: -50,
                    max: 50,
                    unit: "px",
                },
            },
        },
        defaultValue: [
            {
                // Default value is one shadow
                color: "rgba(0, 0, 0, 0.3)",
                position: "outside",
                x: 0,
                y: 10,
                blur: 20,
                spread: 0,
            },
        ],
    },
    // ---
})
