// Circular 3D carousel with mouse pan, WebGL shaders, and cool effects
// Reference: https://framerusercontent.com/images/rmOOV8yjZ6oDUmwib7mNaANTwU.png
// @framerDisableUnlink
import { useRef, useEffect, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultImages = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Gradient 1 - Blue",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Gradient 2 - Purple",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Gradient 3 - Orange",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Gradient 4 - Yellow",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Gradient 5 - Green",
    },
]

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v))
}

/**
 * MakeCircularCrousel
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function MakeCircularCrousel(props) {
    let {
        images,
        radius = 320,
        itemWidth = 260,
        itemHeight = 160,
        perspective = 1200,
        rotationSpeed = 0.18,
        shaderEffect,
        tiltAngle = -18,
        style,
    } = props

    // If images is undefined or empty, use defaultImages
    if (!images || !Array.isArray(images) || images.length === 0) {
        images = defaultImages
    } else {
        // Fill up to 5 with defaults if any are missing
        images = images.map((img, i) => {
            if (!img || !img.src || !img.src.src) {
                return { ...defaultImages[i % defaultImages.length] }
            }
            return img
        })
    }

    const isStatic = useIsStaticRenderer()
    const [rotation, setRotation] = useState(0)
    const dragging = useRef(false)
    const lastX = useRef(0)
    const velocity = useRef(0)
    const raf = useRef(null)

    // -------- POINTER DRAG SYSTEM --------
    useEffect(() => {
        if (isStatic) return

        function onPointerDown(e) {
            dragging.current = true
            lastX.current = e.clientX
            e.target.setPointerCapture?.(e.pointerId)
        }

        function onPointerMove(e) {
            if (!dragging.current) return

            const dx = e.clientX - lastX.current
            lastX.current = e.clientX

            velocity.current = dx * 0.5
            setRotation((r) => r + dx * 0.5)
        }

        function onPointerUp() {
            dragging.current = false
        }

        window.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)

        return () => {
            window.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
        }
    }, [isStatic])

    // -------- INERTIA LOOP --------
    useEffect(() => {
        if (isStatic) return

        function animate() {
            if (!dragging.current && Math.abs(velocity.current) > 0.01) {
                setRotation((r) => r + velocity.current)
                velocity.current *= 0.94
            }

            raf.current = requestAnimationFrame(animate)
        }

        raf.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(raf.current)
    }, [isStatic])

    // -------- AUTO ROTATE --------
    useEffect(() => {
        if (isStatic) return

        function auto() {
            if (!dragging.current) {
                setRotation((r) => r + rotationSpeed)
            }
            raf.current = requestAnimationFrame(auto)
        }

        raf.current = requestAnimationFrame(auto)
        return () => cancelAnimationFrame(raf.current)
    }, [rotationSpeed, isStatic])

    // 3D transform for each item
    const N = images.length
    const angleStep = 360 / N

    // Shader effect: use CSS filter for now (blur, contrast, etc)
    const shaderStyle =
        shaderEffect === "blur"
            ? { filter: "blur(2px) brightness(1.1)" }
            : shaderEffect === "contrast"
              ? { filter: "contrast(1.3) saturate(1.2)" }
              : {}

    return (
        <div
            style={{
                ...style,
                width: "100%",
                height: "100%",
                perspective,
                overflow: "visible",
                position: "relative",
                cursor: dragging.current ? "grabbing" : "grab",
                userSelect: "none",
                touchAction: "none",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    transform: `rotateY(${rotation}deg)`,
                }}
            >
                {images.map((img, i) => {
                    const src = img.src?.src || img.src
                    const alt = img.alt || ""

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                width: itemWidth,
                                height: itemHeight,
                                marginLeft: -itemWidth / 2,
                                marginTop: -itemHeight / 2,
                                borderRadius: 18,
                                overflow: "hidden",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                                background: "#fff",
                                transform: `rotateY(${angleStep * i}deg) translateZ(${radius}px) rotateX(${tiltAngle}deg)`,
                                ...shaderStyle,
                            }}
                        >
                            <img
                                src={src}
                                alt={alt}
                                draggable={false}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(MakeCircularCrousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: {
            type: ControlType.Object,
            controls: {
                src: { type: ControlType.ResponsiveImage, title: "Image" },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
            },
        },
        defaultValue: defaultImages,
        maxCount: 12,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 320,
        min: 120,
        max: 800,
        step: 1,
        unit: "px",
    },
    itemWidth: {
        type: ControlType.Number,
        title: "Item Width",
        defaultValue: 260,
        min: 80,
        max: 400,
        step: 1,
        unit: "px",
    },
    itemHeight: {
        type: ControlType.Number,
        title: "Item Height",
        defaultValue: 160,
        min: 60,
        max: 300,
        step: 1,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1200,
        min: 400,
        max: 3000,
        step: 1,
        unit: "px",
    },
    rotationSpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        defaultValue: 0.18,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "deg/frame",
    },
    shaderEffect: {
        type: ControlType.Enum,
        title: "Shader FX",
        options: ["none", "blur", "contrast"],
        optionTitles: ["None", "Blur", "Contrast"],
        defaultValue: "none",
    },
    tiltAngle: {
        type: ControlType.Number,
        title: "Tilt Angle",
        defaultValue: -18,
        min: -90,
        max: 90,
        step: 1,
        unit: "deg",
    },
})
