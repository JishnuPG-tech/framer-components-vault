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


interface PhoneMockupProps {
    model: "island" | "notch" | "android" | "minimal"
    orientation: "portrait" | "landscape"
    mediaType: "image" | "video"
    image?: { src: string; srcSet?: string; alt?: string }
    video?: string
    poster?: { src: string; srcSet?: string; alt?: string }
    fit: "cover" | "contain"
    positionX: number
    positionY: number
    frameColor: string
    bezelColor: string
    screenColor: string
    bezel: number
    hardware: boolean
    homeBar: boolean
    homeColor: string
    reflection: number
    scale: number
    rotation: number
    shadow: string
    autoplay: boolean
    loop: boolean
    controls: boolean
    muted: boolean
    videoLabel: string
    style?: React.CSSProperties
}

const devices = {
    island: { width: 360, height: 744, radius: 54 },
    notch: { width: 360, height: 736, radius: 48 },
    android: { width: 360, height: 770, radius: 34 },
    minimal: { width: 360, height: 736, radius: 38 },
}

const absolute: React.CSSProperties = {
    position: "absolute",
    boxSizing: "border-box",
}

const fallbackBackground =
    "radial-gradient(ellipse at 15% 15%, #fde5ce 0%, transparent 48%)," +
    "radial-gradient(ellipse at 90% 65%, #c5b6f7 0%, transparent 52%)," +
    "linear-gradient(155deg, #edabac, #a18ad0 55%, #555e98)"

/**
 * Phone Mockup
 *
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 744
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PhoneMockup(props: PhoneMockupProps) {
    const {
        model = "island",
        orientation = "portrait",
        mediaType = "image",
        image,
        video = "",
        poster,
        fit = "cover",
        positionX = 50,
        positionY = 50,
        frameColor = "#B9B5AE",
        bezelColor = "#101010",
        screenColor = "#17171B",
        bezel = 10,
        hardware = true,
        homeBar = true,
        homeColor = "#FFFFFF",
        reflection = 12,
        scale = 94,
        rotation = 0,
        shadow = "0px 24px 48px rgba(0, 0, 0, 0.22)",
        autoplay = true,
        loop = true,
        controls = false,
        muted = true,
        videoLabel = "Phone screen video",
        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const isStatic = useIsStaticRenderer()
    const [size, setSize] = React.useState({ width: 360, height: 744 })
    const [inView, setInView] = React.useState(false)
    const [reducedMotion, setReducedMotion] = React.useState(false)
    const [failedSource, setFailedSource] = React.useState("")

    const preset = devices[model] || devices.island
    const landscape = orientation === "landscape"
    const width = landscape ? preset.height : preset.width
    const height = landscape ? preset.width : preset.height
    const radius = preset.radius
    const inset = Math.max(5, Math.min(22, bezel))
    const screenRadius = Math.max(8, radius - inset)
    const angle = (rotation * Math.PI) / 180
    const boundsWidth =
        Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle))
    const boundsHeight =
        Math.abs(height * Math.cos(angle)) + Math.abs(width * Math.sin(angle))
    const zoom =
        Math.min(size.width / boundsWidth, size.height / boundsHeight) *
        (scale / 100)

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || typeof window === "undefined") return

        function measure() {
            if (!root) return
            const next = {
                width: root.clientWidth,
                height: root.clientHeight,
            }
            setSize((previous) =>
                previous.width === next.width && previous.height === next.height
                    ? previous
                    : next
            )
        }

        measure()
        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", measure)
            return () => window.removeEventListener("resize", measure)
        }

        const observer = new ResizeObserver(measure)
        observer.observe(root)
        return () => observer.disconnect()
    }, [])

    React.useEffect(() => {
        const root = rootRef.current
        if (!root || isStatic || typeof window === "undefined") return

        const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
        const updatePreference = () => setReducedMotion(preference.matches)

        updatePreference()
        preference.addEventListener("change", updatePreference)

        let observer: IntersectionObserver | undefined
        if (typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(([entry]) => {
                setInView(entry.isIntersecting)
            })
            observer.observe(root)
        } else {
            setInView(true)
        }

        return () => {
            observer?.disconnect()
            preference.removeEventListener("change", updatePreference)
        }
    }, [isStatic])

    React.useEffect(() => {
        const element = videoRef.current
        if (!element || mediaType !== "video") return

        if (isStatic || !inView) {
            element.pause()
        } else if (autoplay && !reducedMotion) {
            element.play().catch(() => {
                // Native controls remain available if autoplay is blocked.
            })
        }

        return () => element.pause()
    }, [mediaType, video, autoplay, reducedMotion, inView, isStatic])

    const source = mediaType === "video" ? video : image?.src || ""
    const failed = Boolean(source && failedSource === source)
    const showImage = mediaType === "image" && image?.src && !failed
    const showVideo = mediaType === "video" && video && !failed
    const nativeControls = controls || !autoplay || !muted || reducedMotion

    const mediaStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: fit,
        objectPosition: `${positionX}% ${positionY}%`,
    }

    // Positions device hardware on the top edge, or left in landscape.
    function cutoutStyle(w: number, h: number, offset: number) {
        return {
            ...absolute,
            width: w,
            height: h,
            left: landscape ? offset : "50%",
            top: landscape ? "50%" : offset,
            transform: landscape
                ? "translate(-50%, -50%) rotate(-90deg)"
                : "translateX(-50%)",
            background: bezelColor,
            pointerEvents: "none",
            zIndex: 3,
        } as React.CSSProperties
    }

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",
                ...style,
                position: "relative",
                display: "grid",
                placeItems: "center",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width,
                    height,
                    flexShrink: 0,
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                }}
            >
                {hardware && model !== "minimal" && (
                    <div
                        aria-hidden="true"
                        style={{
                            ...absolute,
                            inset: 0,
                            pointerEvents: "none",
                        }}
                    >
                        {[0, 1, 2].map((button) => (
                            <div
                                key={button}
                                style={{
                                    ...absolute,
                                    background: frameColor,
                                    borderRadius: 3,
                                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.2)",
                                    ...(landscape
                                        ? {
                                              height: 4,
                                              width: button === 0 ? 26 : 48,
                                              top: -3,
                                              left: 110 + button * 63,
                                          }
                                        : {
                                              width: 4,
                                              height: button === 0 ? 26 : 48,
                                              left: -3,
                                              top: 110 + button * 63,
                                          }),
                                }}
                            />
                        ))}
                        <div
                            style={{
                                ...absolute,
                                background: frameColor,
                                borderRadius: 3,
                                ...(landscape
                                    ? {
                                          bottom: -3,
                                          left: 185,
                                          width: 70,
                                          height: 4,
                                      }
                                    : {
                                          right: -3,
                                          top: 185,
                                          width: 4,
                                          height: 70,
                                      }),
                            }}
                        />
                    </div>
                )}

                <div
                    style={{
                        ...absolute,
                        inset: 0,
                        borderRadius: radius,
                        background: frameColor,
                        boxShadow: shadow,
                    }}
                >
                    <div
                        aria-hidden="true"
                        style={{
                            ...absolute,
                            inset: 0,
                            borderRadius: "inherit",
                            pointerEvents: "none",
                            boxShadow:
                                "inset 0 0 0 1px rgba(255,255,255,.5), " +
                                "inset 0 0 0 3px rgba(0,0,0,.22)",
                        }}
                    />
                    <div
                        style={{
                            ...absolute,
                            inset: 4,
                            borderRadius: radius - 4,
                            background: bezelColor,
                        }}
                    />

                    <div
                        style={{
                            ...absolute,
                            inset,
                            borderRadius: screenRadius,
                            overflow: "hidden",
                            isolation: "isolate",
                            background: screenColor,
                        }}
                    >
                        {!showImage && !showVideo && (
                            <div
                                role="img"
                                aria-label={
                                    failed
                                        ? "Media unavailable"
                                        : "Gradient screen placeholder"
                                }
                                style={{
                                    ...absolute,
                                    inset: 0,
                                    background: fallbackBackground,
                                }}
                            />
                        )}

                        {showImage && (
                            <img
                                src={image!.src}
                                srcSet={image!.srcSet}
                                alt={image!.alt || ""}
                                draggable={false}
                                decoding="async"
                                onError={() => setFailedSource(source)}
                                style={mediaStyle}
                            />
                        )}

                        {showVideo &&
                            (isStatic ? (
                                poster?.src ? (
                                    <img
                                        src={poster.src}
                                        srcSet={poster.srcSet}
                                        alt={poster.alt || videoLabel}
                                        style={mediaStyle}
                                    />
                                ) : (
                                    <div
                                        role="img"
                                        aria-label="Video preview. Play in site preview."
                                        style={{
                                            ...absolute,
                                            inset: 0,
                                            background: fallbackBackground,
                                            display: "grid",
                                            placeItems: "center",
                                        }}
                                    >
                                        <svg
                                            width="64"
                                            height="64"
                                            viewBox="0 0 64 64"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx="32"
                                                cy="32"
                                                r="31"
                                                fill="rgba(0,0,0,.3)"
                                            />
                                            <path
                                                d="M26 20L46 32L26 44Z"
                                                fill="white"
                                            />
                                        </svg>
                                    </div>
                                )
                            ) : (
                                <video
                                    key={video}
                                    ref={videoRef}
                                    src={video}
                                    poster={poster?.src}
                                    aria-label={videoLabel}
                                    playsInline
                                    muted={muted}
                                    loop={loop}
                                    controls={nativeControls}
                                    preload="metadata"
                                    onError={() => setFailedSource(source)}
                                    style={mediaStyle}
                                />
                            ))}

                        {hardware && model === "island" && (
                            <div
                                aria-hidden="true"
                                style={{
                                    ...cutoutStyle(100, 28, 12),
                                    borderRadius: 24,
                                }}
                            />
                        )}

                        {hardware && model === "notch" && (
                            <div
                                aria-hidden="true"
                                style={{
                                    ...cutoutStyle(
                                        156,
                                        30,
                                        landscape ? 12 : -2
                                    ),
                                    borderRadius: "0 0 22px 22px",
                                }}
                            />
                        )}

                        {hardware && model === "android" && (
                            <div
                                aria-hidden="true"
                                style={{
                                    ...cutoutStyle(13, 13, 13),
                                    borderRadius: "50%",
                                    boxShadow: "0 0 0 3px rgba(0,0,0,.14)",
                                }}
                            />
                        )}

                        {homeBar &&
                            !(showVideo && nativeControls && !isStatic) && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        ...absolute,
                                        width: landscape ? 5 : 112,
                                        height: landscape ? 112 : 5,
                                        right: landscape ? 10 : undefined,
                                        left: landscape ? undefined : "50%",
                                        top: landscape ? "50%" : undefined,
                                        bottom: landscape ? undefined : 10,
                                        transform: landscape
                                            ? "translateY(-50%)"
                                            : "translateX(-50%)",
                                        borderRadius: 10,
                                        background: homeColor,
                                        pointerEvents: "none",
                                        zIndex: 4,
                                    }}
                                />
                            )}

                        {reflection > 0 && (
                            <div
                                aria-hidden="true"
                                style={{
                                    ...absolute,
                                    inset: 0,
                                    pointerEvents: "none",
                                    zIndex: 5,
                                    opacity: reflection / 100,
                                    background:
                                        "linear-gradient(125deg, " +
                                        "rgba(255,255,255,.8), " +
                                        "transparent 42%, transparent 70%, " +
                                        "rgba(255,255,255,.15))",
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(PhoneMockup, {
    model: {
        type: ControlType.Enum,
        title: "Phone",
        options: ["island", "notch", "android", "minimal"],
        optionTitles: [
            "iPhone · Island",
            "iPhone · Notch",
            "Android",
            "Minimal",
        ],
        defaultValue: "island",
        description: "Stylized device presets.",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["portrait", "landscape"],
        optionTitles: ["Portrait", "Landscape"],
        defaultValue: "portrait",
        displaySegmentedControl: true,
    },
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
        displaySegmentedControl: true,
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Screenshot",
        hidden: (props) => props.mediaType === "video",
    },
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm"],
        hidden: (props) => props.mediaType !== "video",
    },
    poster: {
        type: ControlType.ResponsiveImage,
        title: "Poster",
        description: "Shown on the canvas and before the video plays.",
        hidden: (props) => props.mediaType !== "video",
    },
    fit: {
        type: ControlType.Enum,
        title: "Screen Fit",
        options: ["cover", "contain"],
        optionTitles: ["Fill", "Fit"],
        defaultValue: "cover",
        displaySegmentedControl: true,
        description:
            "Fill crops the media. Fit shows the entire image or video.",
    },
    positionX: {
        type: ControlType.Number,
        title: "Position X",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    positionY: {
        type: ControlType.Number,
        title: "Position Y",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    scale: {
        type: ControlType.Number,
        title: "Phone Size",
        defaultValue: 94,
        min: 20,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "Phone size within the layer. Resize the layer using Width and Height.",
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: -45,
        max: 45,
        step: 1,
        unit: "°",
    },
    frameColor: {
        type: ControlType.Color,
        title: "Frame",
        defaultValue: "#B9B5AE",
    },
    bezelColor: {
        type: ControlType.Color,
        title: "Bezel",
        defaultValue: "#101010",
    },
    screenColor: {
        type: ControlType.Color,
        title: "Screen",
        defaultValue: "#17171B",
        description: "Background visible around media when Screen Fit is Fit.",
    },
    bezel: {
        type: ControlType.Number,
        title: "Bezel Size",
        defaultValue: 10,
        min: 5,
        max: 22,
        step: 1,
    },
    hardware: {
        type: ControlType.Boolean,
        title: "Hardware",
        defaultValue: true,
        description: "Show camera cutout and side buttons.",
        hidden: (props) => props.model === "minimal",
    },
    homeBar: {
        type: ControlType.Boolean,
        title: "Home Bar",
        defaultValue: true,
    },
    homeColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.homeBar,
    },
    reflection: {
        type: ControlType.Number,
        title: "Reflection",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "%",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 24px 48px rgba(0, 0, 0, 0.22)",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        hidden: (props) => props.mediaType !== "video",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        hidden: (props) => props.mediaType !== "video",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        description: "Keep enabled for reliable autoplay.",
        hidden: (props) => props.mediaType !== "video",
    },
    controls: {
        type: ControlType.Boolean,
        title: "Video Controls",
        defaultValue: false,
        description:
            "Also shown when autoplay is off, audio is on, or reduced motion is enabled.",
        hidden: (props) => props.mediaType !== "video",
    },
    videoLabel: {
        type: ControlType.String,
        title: "Video Label",
        defaultValue: "Phone screen video",
        hidden: (props) => props.mediaType !== "video",
    },
})
