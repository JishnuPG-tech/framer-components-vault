import { useRef, useEffect, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const defaultItems = [
    {
        mediaType: "image",
        image: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
        text: "Image 1",
    },
    {
        mediaType: "image",
        image: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
        text: "Image 2",
    },
    {
        mediaType: "image",
        image: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
        text: "Image 3",
    },
]

function getMediaSrc(item) {
    if (item.mediaType === "image") return item.image
    if (item.mediaType === "video") {
        if (item.videoSource === "url") return item.videoUrl
        if (item.videoSource === "upload") return item.videoUpload
    }
    return null
}

/**
 * Rotating Gallery Orbit
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 * @framerDisableUnlink
 */

export default function CircularGallery(props) {
    const {
        items = defaultItems,
        orbitDiameter = 300,
        imageBorderRadius = 16,
        imageWidth = 80,
        imageHeight = 80,
        imageLayout = "cover",
        animationSpeed = 8,
        transitionType = "easeInOut",
        repeat = true,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [progress, setProgress] = useState(0)
    const requestRef = useRef(null)
    const lastTimestamp = useRef(null)
    const [playing, setPlaying] = useState(true)
    const duration = Math.max(0.5, animationSpeed)
    const ease = transitionType === "easeInOut"
    const shouldRepeat = repeat
    const n = items.length

    // Animation loop
    useEffect(() => {
        if (isStatic || n === 0) return
        setPlaying(true)
        function animate(ts) {
            if (!lastTimestamp.current) lastTimestamp.current = ts
            const delta = (ts - lastTimestamp.current) / 1000
            lastTimestamp.current = ts
            startTransition(() => {
                setProgress((prev) => {
                    let next = prev + delta / duration
                    if (next >= 1) {
                        if (shouldRepeat) next = next % 1
                        else {
                            setPlaying(false)
                            return 1
                        }
                    }
                    return next
                })
            })
            if (playing && (shouldRepeat || progress < 1)) {
                requestRef.current = requestAnimationFrame(animate)
            }
        }
        requestRef.current = requestAnimationFrame(animate)
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            lastTimestamp.current = null
        }
        // eslint-disable-next-line
    }, [duration, shouldRepeat, n, isStatic])

    // Easing function
    function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2
    }
    const easedProgress = ease ? easeInOutSine(progress) : progress

    // Centered orbit
    const containerStyle = {
        ...style,
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        background: "transparent",
    }
    const orbitRadius = orbitDiameter / 2
    const center = useMemo(() => ({ x: 0.5, y: 0.5 }), [])

    // If no items, show empty state
    if (!items || items.length === 0) {
        return (
            <div
                style={{
                    ...containerStyle,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <span style={{ color: "#888", fontSize: 18, fontWeight: 500 }}>
                    Please add images.
                </span>
            </div>
        )
    }

    // Render items on orbit
    return (
        <div style={containerStyle}>
            {items.map((item, i) => {
                const angle =
                    (2 * Math.PI * i) / n + 2 * Math.PI * easedProgress
                const x = Math.cos(angle) * orbitRadius
                const y = Math.sin(angle) * orbitRadius
                const left = `calc(50% + ${x}px - ${imageWidth / 2}px)`
                const top = `calc(50% + ${y}px - ${imageHeight / 2}px)`
                const src = getMediaSrc(item)
                if (!src) return null
                if (item.mediaType === "image") {
                    return (
                        <img
                            key={i}
                            src={src}
                            alt={item.text || `Image ${i + 1}`}
                            style={{
                                position: "absolute",
                                left,
                                top,
                                width: imageWidth,
                                height: imageHeight,
                                objectFit: imageLayout,
                                borderRadius: imageBorderRadius,
                                background: "#eee",
                                userSelect: "none",
                                pointerEvents: "auto",
                                boxShadow: "none",
                            }}
                            draggable={false}
                        />
                    )
                } else if (item.mediaType === "video" && src) {
                    return (
                        <video
                            key={i}
                            src={src}
                            style={{
                                position: "absolute",
                                left,
                                top,
                                width: imageWidth,
                                height: imageHeight,
                                objectFit: imageLayout,
                                borderRadius: imageBorderRadius,
                                background: "#eee",
                                userSelect: "none",
                                pointerEvents: "auto",
                                boxShadow: "none",
                            }}
                            autoPlay
                            loop={shouldRepeat}
                            muted
                            playsInline
                        />
                    )
                }
                return null
            })}
        </div>
    )
}

addPropertyControls(CircularGallery, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            itemTitle: (item) => {
                const mediaType = item?.mediaType || "image"
            },
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Media Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    description: "Choose the type of media for this item",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    hidden: (props) => props.mediaType !== "image",
                },
                videoSource: {
                    type: ControlType.Enum,
                    title: "Video Source",
                    options: ["url", "upload"],
                    optionTitles: ["URL", "Upload"],
                    defaultValue: "url",
                    hidden: (props) => props.mediaType !== "video",
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://example.com/video.mp4",
                    hidden: (props) =>
                        props.mediaType !== "video" ||
                        props.videoSource !== "url",
                },
                videoUpload: {
                    type: ControlType.File,
                    title: "Upload Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    description:
                        "Upload a video file (MP4, WebM, MOV). Note: Large video files may cause loading delays.",
                    hidden: (props) =>
                        props.mediaType !== "video" ||
                        props.videoSource !== "upload",
                },
            },
        },
        defaultValue: defaultItems,
    },
    orbitDiameter: {
        type: ControlType.Number,
        title: "Orbit Diameter",
        defaultValue: 300,
        min: 80,
        max: 1200,
        step: 1,
        unit: "px",
    },
    imageBorderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    imageWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 80,
        min: 20,
        max: 400,
        step: 1,
        unit: "px",
    },
    imageHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 80,
        min: 20,
        max: 400,
        step: 1,
        unit: "px",
    },
    imageLayout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 8,
        min: 0.5,
        max: 30,
        step: 0.1,
        unit: "s",
        description: "Time for one full rotation (seconds)",
    },
    transitionType: {
        type: ControlType.Enum,
        title: "Transition",
        options: ["easeInOut", "linear"],
        optionTitles: ["Ease In Out", "Linear"],
        defaultValue: "easeInOut",
        displaySegmentedControl: true,
    },
    repeat: {
        type: ControlType.Boolean,
        title: "Repeat",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        description:
            "Explore more components at [THE DESIGN FUTURIST](https://thedesignfuturist.zip)",
    },
})
