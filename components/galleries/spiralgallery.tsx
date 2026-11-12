// Spiral Gallery Component
// Replicates a spiral gallery with floating, rotating images and a central content area
import {
    useMemo,
    useEffect,
    useRef,
    useState,
    startTransition,
    type ReactNode,
    type CSSProperties,
} from "react"
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
 * SpiralPathProps
 * Props for SpiralPath component
 */
interface SpiralPathProps {
    group: "images" | "children"
    images: { src: string; alt: string }[]
    appearance: {
        backgroundColor: string
        blurAmount: number
        imageBorderRadius: number
        imageShadow: boolean
    }
    spiral: {
        spiralRadius: number
        spiralTurns: number
        spiralPosition: "left" | "center" | "right"
        spiralSpeed: number
    }
    imageSize: number
    sizingMode: "uniform" | "staggered"
    children?: ReactNode
    style?: CSSProperties
    fade: boolean
}

const defaultImages = [
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Image 1",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Image 2",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Image 3",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Image 4",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Image 5",
    },
    {
        src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        alt: "Image 6",
    },
    {
        src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        alt: "Image 7",
    },
    {
        src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        alt: "Image 8",
    },
    {
        src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
        alt: "Image 9",
    },
    {
        src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
        alt: "Image 10",
    },
]

/**
 * Spiral Gallery
 *
 * About this component: Displays a mesmerizing spiral pattern of images or Framer components, orbiting around a central area. Images smoothly rotate in 3D and fade for a sense of depth.
 *
 * Key features:
 * - Animated spiral rotation
 * - Full image or content slot support
 * - Adjustable spiral shape, image size, fade, blur, and more
 * - Modern styling with live preview/controller options
 *
 * Perfect for:
 * - Showcasing portfolios or product galleries
 * - Eye-catching hero image sections
 * - Creative interactive art and landing pages
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function SpiralPath(props: SpiralPathProps) {
    const {
        images = defaultImages,
        appearance = {
            backgroundColor: "#000000",
            blurAmount: 8,
            imageBorderRadius: 18,
            imageShadow: true,
        },
        spiral = {
            spiralRadius: 320,
            spiralTurns: 1.2,
            spiralPosition: "center",
            spiralSpeed: 10,
        },
        imageSize = 100,
        sizingMode = "uniform",
        children,
        group = "images",
        style,
        fade = true,
    } = props

    const backgroundColor = appearance.backgroundColor
    const blurAmount = appearance.blurAmount
    const imageBorderRadius = appearance.imageBorderRadius
    const imageShadow = appearance.imageShadow
    const spiralRadius = spiral.spiralRadius
    const spiralTurns = spiral.spiralTurns
    const spiralPosition = spiral.spiralPosition
    const spiralSpeed = spiral.spiralSpeed

    const isStatic = useIsStaticRenderer()
    const [angle, setAngle] = useState(0)
    const requestRef = useRef<number | null>(null)

    // Animate spiral rotation
    useEffect(() => {
        if (isStatic) return
        let last = performance.now()
        function animate(now: number) {
            const delta = now - last
            last = now
            // spiralSpeed is seconds per full rotation
            const speed =
                spiralSpeed > 0 ? (2 * Math.PI) / (spiralSpeed * 1000) : 0.0002
            startTransition(() => setAngle((a) => a + speed * delta))
            requestRef.current = requestAnimationFrame(animate)
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => {
            if (requestRef.current !== null)
                cancelAnimationFrame(requestRef.current)
        }
    }, [isStatic, spiralSpeed])

    // Spiral positions
    const spiralImages = useMemo(() => {
        const count = group === "images" ? images.length : 0
        const childrenArr =
            group === "children"
                ? children
                    ? Array.isArray(children)
                        ? children
                        : [children]
                    : []
                : []
        const total = Math.max(count, childrenArr.length)
        if (count === 0 && childrenArr.length === 0) return []
        const spiralArr = []
        // Start the spiral at t=0.5 so the bottom wraps up to the center
        for (let i = 0; i < total * 3; i++) {
            const imgIdx = i % count
            const childIdx = i % childrenArr.length
            // t=0 is bottom, t=1 is top; shift so t=0.5 is at the center
            const t =
                ((i + 0.5) / (total * 3) +
                    angle / (2 * Math.PI * spiralTurns) +
                    0.5) %
                1
            const theta = 2 * Math.PI * spiralTurns * t + angle
            let minScale = 0.5
            let maxScale = 1.1
            let scale = 1
            if (sizingMode === "staggered") {
                const t2 = Math.pow(t, 0.7)
                scale = minScale + (maxScale - minScale) * t2
            }
            const r = spiralRadius * (0.5 + t)
            const x = Math.cos(theta) * r
            const y = Math.sin(theta) * r
            // Improved fade logic: fade in at bottom, fade out at top, always in [0,1], no flicker at bottom
            let fadeVal = 1
            if (fade) {
                if (t < 0.12) {
                    // Use cubic ease for fade-in at bottom
                    fadeVal = Math.pow(t / 0.12, 3)
                } else if (t > 0.88) {
                    // Use cubic ease for fade-out at top
                    fadeVal = Math.pow((1 - t) / 0.12, 3)
                }
                fadeVal = Math.max(0, Math.min(1, fadeVal))
            }
            spiralArr.push({
                ...(count > 0 ? images[imgIdx] : {}),
                child: childrenArr.length > 0 ? childrenArr[childIdx] : null,
                x,
                y,
                scale,
                imgRotate: 0,
                t,
                fade: fadeVal,
            })
        }
        // Remove filter: always render all, but set opacity to 0 for fade==0 (prevents flicker)
        return spiralArr
    }, [
        images,
        angle,
        spiralRadius,
        spiralTurns,
        sizingMode,
        children,
        group,
        fade,
    ])

    // Spiral horizontal offset
    const spiralOffset = useMemo(() => {
        if (spiralPosition === "left") return -120
        if (spiralPosition === "right") return 120
        return 0
    }, [spiralPosition])

    // Center content
    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Spiral Images */}
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    transform: `translate(-50%, -50%) translateX(${spiralOffset}px)`,
                }}
            >
                {spiralImages.map((img, i) =>
                    img.child ? (
                        <div
                            key={"child-" + i}
                            style={{
                                position: "absolute",
                                left: `calc(50% + ${img.x}px - ${(imageSize * img.scale) / 2}px)`,
                                top: `calc(50% + ${img.y}px - ${(imageSize * img.scale) / 2}px)`,
                                width: imageSize * img.scale,
                                height: imageSize * img.scale,
                                borderRadius: imageBorderRadius,
                                boxShadow: imageShadow
                                    ? "0 4px 24px rgba(0,0,0,0.18)"
                                    : undefined,
                                filter:
                                    !isStatic && img.t < 0.33
                                        ? `blur(${(1 - img.t / 0.33) * blurAmount}px) brightness(${0.7 + 0.6 * img.t})`
                                        : !isStatic
                                          ? `brightness(${0.7 + 0.6 * img.t})`
                                          : undefined,
                                opacity: img.fade,
                                transition: isStatic
                                    ? "none"
                                    : "filter 0.2s, opacity 0.2s",
                                objectFit: "cover",
                                zIndex: Math.round(100 * img.scale),
                                pointerEvents: "auto",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                willChange: "filter, opacity, left, top",
                                visibility: img.fade > 0 ? "visible" : "hidden",
                            }}
                            draggable={false}
                        >
                            {img.child}
                        </div>
                    ) : (
                        <img
                            key={i}
                            src={img.src}
                            alt={img.alt}
                            style={{
                                position: "absolute",
                                left: `calc(50% + ${img.x}px - ${(imageSize * img.scale) / 2}px)`,
                                top: `calc(50% + ${img.y}px - ${(imageSize * img.scale) / 2}px)`,
                                width: imageSize * img.scale,
                                height: imageSize * img.scale,
                                borderRadius: imageBorderRadius,
                                boxShadow: imageShadow
                                    ? "0 4px 24px rgba(0,0,0,0.18)"
                                    : undefined,
                                filter:
                                    !isStatic && img.t < 0.33
                                        ? `blur(${(1 - img.t / 0.33) * blurAmount}px) brightness(${0.7 + 0.6 * img.t})`
                                        : !isStatic
                                          ? `brightness(${0.7 + 0.6 * img.t})`
                                          : undefined,
                                opacity: img.fade,
                                transition: isStatic
                                    ? "none"
                                    : "filter 0.2s, opacity 0.2s",
                                objectFit: "cover",
                                zIndex: Math.round(100 * img.scale),
                                pointerEvents: "auto",
                                willChange: "filter, opacity, left, top",
                                visibility: img.fade > 0 ? "visible" : "hidden",
                            }}
                            draggable={false}
                        />
                    )
                )}
            </div>
            {/* Central Content */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: 18,
                }}
            >
                {/* No children in center */}
            </div>
        </div>
    )
}

addPropertyControls(SpiralPath, {
    group: {
        type: ControlType.Enum,
        title: "Group",
        options: ["images", "children"],
        optionTitles: ["Images", "Children"],
        defaultValue: "images",
        displaySegmentedControl: true,
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        description: "Array of images to display in the spiral gallery.",
        control: {
            type: ControlType.Object,
            controls: {
                src: {
                    type: ControlType.String,
                    title: "Image URL",
                    defaultValue: defaultImages[0].src,
                    description: "Image source URL.",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "Image",
                    description: "Alternative text for the image.",
                },
            },
        },
        defaultValue: defaultImages,
        maxCount: 20,
        hidden: (props) => props.group !== "images",
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                description: "Background color of the gallery.",
                defaultValue: "#000000",
            },
            blurAmount: {
                type: ControlType.Number,
                title: "Blur Max",
                description: "Maximum blur applied to images for depth effect.",
                defaultValue: 8,
                min: 0,
                max: 24,
                step: 1,
            },
            imageBorderRadius: {
                type: ControlType.Number,
                title: "Image Radius",
                description: "Border radius for images.",
                defaultValue: 18,
                min: 0,
                max: 40,
                step: 1,
            },
            imageShadow: {
                type: ControlType.Boolean,
                title: "Image Shadow",
                description: "Show or hide shadow under images.",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },
        },
    },
    spiral: {
        type: ControlType.Object,
        title: "Spiral",
        controls: {
            spiralRadius: {
                type: ControlType.Number,
                title: "Spiral Radius",
                description: "Base radius of the spiral path.",
                defaultValue: 320,
                min: 80,
                max: 600,
                step: 1,
            },
            spiralTurns: {
                type: ControlType.Number,
                title: "Spiral Turns",
                description: "Number of turns in the spiral.",
                defaultValue: 1.2,
                min: 0.5,
                max: 3,
                step: 0.01,
            },
            spiralPosition: {
                type: ControlType.Enum,
                title: "Spiral Position",
                description: "Horizontal alignment of the spiral.",
                options: ["left", "center", "right"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "center",
                displaySegmentedControl: true,
            },
            spiralSpeed: {
                type: ControlType.Number,
                title: "Spiral Speed (sec)",
                description:
                    "Time in seconds for a full spiral rotation (lower = faster)",
                defaultValue: 10,
                min: 2,
                max: 60,
                step: 1,
            },
        },
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        description: "Diameter of each image in pixels.",
        defaultValue: 100,
        min: 40,
        max: 180,
        step: 1,
    },
    sizingMode: {
        type: ControlType.Enum,
        title: "Sizing Mode",
        description: "Choose between uniform or staggered image sizing.",
        options: ["uniform", "staggered"],
        optionTitles: ["Uniform", "Staggered"],
        defaultValue: "uniform",
        displaySegmentedControl: true,
    },
    children: {
        type: ControlType.Slot,
        title: "Children",
        description: "Add Framer components to the spiral.",
        maxCount: 8,
        hidden: (props) => props.group !== "children",
    },
    fade: {
        type: ControlType.Boolean,
        title: "Fade Images",
        description:
            "More components at [8ighty8 Studio](https://8ighty8studio.lemonsqueezy.com)",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
