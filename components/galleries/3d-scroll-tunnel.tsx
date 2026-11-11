import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


import { gsap } from "gsap"
import { useScroll } from "framer-motion"

export default function TunnelScroll(props) {
    const {
        images,

        layerGap,
        imagesPerLayer,

        radiusX,
        radiusY,

        scrollSpeed,
        smoothness,

        imageWidth,
        imageHeight,

        imageRadius,
        imageScale,

        perspective,

        fadeDistance,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef(null)

    const layersRef = React.useRef([])

    const target = React.useRef(0)

    const current = React.useRef(0)

    const { scrollYProgress } = useScroll({
        target: containerRef,

        offset: ["start start", "end end"],
    })

    // Scroll value

    React.useEffect(() => {
        if (isStatic) return

        const unsubscribe = scrollYProgress.on("change", (value) => {
            target.current = value * scrollSpeed
        })

        return unsubscribe
    }, [isStatic, scrollSpeed])

    // GSAP animation

    React.useEffect(() => {
        if (isStatic) return

        const animate = () => {
            current.current += (target.current - current.current) * smoothness

            layersRef.current.forEach((layer, index) => {
                if (!layer) return

                const z = -index * layerGap + current.current

                const opacity = Math.max(
                    0,

                    Math.min(
                        1,

                        1 - Math.abs(z) / fadeDistance
                    )
                )

                gsap.set(layer, {
                    z: z,

                    opacity: opacity,

                    force3D: true,
                })
            })
        }

        gsap.ticker.add(animate)

        return () => {
            gsap.ticker.remove(animate)
        }
    }, [isStatic, layerGap, smoothness, fadeDistance])

    // Static fallback

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",

                    height: "100%",

                    background: "#000",

                    display: "flex",

                    justifyContent: "center",

                    alignItems: "center",
                }}
            >
                {images?.[0] && (
                    <img
                        src={images[0]}
                        style={{
                            width: imageWidth,

                            height: imageHeight,

                            objectFit: "cover",

                            borderRadius: imageRadius,
                        }}
                    />
                )}
            </div>
        )
    }

    const layers = []

    const totalLayers = Math.ceil(images.length / imagesPerLayer)

    for (let i = 0; i < totalLayers; i++) {
        const items = []

        for (let j = 0; j < imagesPerLayer; j++) {
            const index = i * imagesPerLayer + j

            if (!images[index]) continue

            const angle = (j / imagesPerLayer) * Math.PI * 2 - Math.PI / 2

            const x = Math.cos(angle) * radiusX - imageWidth / 2

            const y = Math.sin(angle) * radiusY - imageHeight / 2

            items.push(
                <div
                    key={index}
                    style={{
                        position: "absolute",

                        width: imageWidth,

                        height: imageHeight,

                        left: x,

                        top: y,

                        transform: `scale(${imageScale})`,

                        overflow: "hidden",

                        borderRadius: imageRadius,

                        backfaceVisibility: "hidden",
                    }}
                >
                    <img
                        src={images[index]}
                        style={{
                            width: "100%",

                            height: "100%",

                            objectFit: "cover",

                            display: "block",
                        }}
                    />
                </div>
            )
        }

        layers.push(
            <div
                key={i}
                ref={(el) => {
                    layersRef.current[i] = el
                }}
                style={{
                    position: "absolute",

                    transformStyle: "preserve-3d",

                    willChange: "transform",
                }}
            >
                {items}
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                height: "300vh",

                position: "relative",
            }}
        >
            <div
                style={{
                    position: "sticky",

                    top: 0,

                    height: "100vh",

                    overflow: "hidden",

                    background: "#000",

                    perspective: perspective,

                    transform: "translateZ(0)",
                }}
            >
                <div
                    style={{
                        position: "absolute",

                        left: "50%",

                        top: "50%",

                        transform: "translate(-50%,-50%)",

                        transformStyle: "preserve-3d",
                    }}
                >
                    {layers}
                </div>
            </div>
        </div>
    )
}

addPropertyControls(
    TunnelScroll,

    {
        images: {
            type: ControlType.Array,

            title: "Images",

            control: {
                type: ControlType.Image,
            },
        },

        layerGap: {
            type: ControlType.Number,

            title: "Layer Gap",

            defaultValue: 2500,

            description: "Distance between each tunnel layer.",
        },

        imagesPerLayer: {
            type: ControlType.Number,

            title: "Images / Layer",

            defaultValue: 4,

            min: 2,

            max: 12,

            description: "Number of images in each circular layer.",
        },

        radiusX: {
            type: ControlType.Number,

            title: "Radius X",

            defaultValue: 400,

            description: "Horizontal image spread.",
        },

        radiusY: {
            type: ControlType.Number,

            title: "Radius Y",

            defaultValue: 280,

            description: "Vertical image spread.",
        },

        scrollSpeed: {
            type: ControlType.Number,

            title: "Scroll Speed",

            defaultValue: 7000,

            description: "Controls tunnel movement speed.",
        },

        smoothness: {
            type: ControlType.Number,

            title: "Smoothness",

            defaultValue: 0.08,

            min: 0.01,

            max: 0.3,

            step: 0.01,

            description: "Controls smooth inertia.",
        },

        imageWidth: {
            type: ControlType.Number,

            title: "Image Width",

            defaultValue: 180,
        },

        imageHeight: {
            type: ControlType.Number,

            title: "Image Height",

            defaultValue: 220,
        },

        imageScale: {
            type: ControlType.Number,

            title: "Image Scale",

            defaultValue: 1,

            min: 0.5,

            max: 3,
        },

        imageRadius: {
            type: ControlType.Number,

            title: "Border Radius",

            defaultValue: 0,
        },

        perspective: {
            type: ControlType.Number,

            title: "Perspective",

            defaultValue: 1200,

            description: "Controls 3D depth.",
        },

        fadeDistance: {
            type: ControlType.Number,

            title: "Fade Distance",

            defaultValue: 7000,

            description: "Controls image fade distance.",
        },
    }
)
