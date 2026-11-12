import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ResponsiveImage = { src?: string; srcSet?: string; alt?: string }
type ImageProp = ResponsiveImage | string | null | undefined

interface Content {
    type: "image" | "video"
    image: ImageProp
    video: string
    videoUrl: string
    poster: ImageProp
    label: string
    fit: "cover" | "contain" | "fill"
    position: "center" | "top" | "bottom" | "left" | "right"
    zoom: number
}

interface Playback {
    autoplay: boolean
    loop: boolean
    muted: boolean
    controls: boolean
}

interface Screen {
    ratio: "modern" | "classic" | "square" | "custom"
    custom: number
    cutout: "island" | "notch" | "none"
    color: string
    homeBar: boolean
    barColor: string
    glare: boolean
    glareAmount: number
}

interface Frame {
    metallic: boolean
    color: string
    highlight: string
    bezel: number
    corner: number
}

interface Buttons {
    show: boolean
    action: boolean
    volume: boolean
    power: boolean
    color: string
    size: number
}

interface Shadow {
    enabled: boolean
    color: string
    blur: number
    offsetY: number
}

interface IPhoneMockProps {
    content: Partial<Content>
    playback: Partial<Playback>
    screen: Partial<Screen>
    frame: Partial<Frame>
    buttons: Partial<Buttons>
    shadow: Partial<Shadow>
    style?: CSSProperties
}

// Screen height ÷ screen width
const ASPECTS = {
    modern: 19.5 / 9, // iPhone X through 16, the real device ratio
    classic: 16 / 9, // flat 9:16 video canvas
    square: 4 / 3,
}

// Side buttons, as a fraction of device height
const BUTTONS = [
    { id: "action", side: "left", top: 0.142, length: 0.054 },
    { id: "volume", side: "left", top: 0.217, length: 0.088 },
    { id: "volume", side: "left", top: 0.325, length: 0.088 },
    { id: "power", side: "right", top: 0.237, length: 0.156 },
] as const

const DEFAULT_IMAGE: ResponsiveImage = {
    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
    alt: "",
}

// A group can arrive partially filled, so every group is merged over these
// before it is read. Image and file controls cannot carry a `defaultValue`,
// so their defaults only exist here.
const CONTENT: Content = {
    type: "image",
    image: DEFAULT_IMAGE,
    video: "",
    videoUrl: "",
    poster: undefined,
    label: "",
    fit: "cover",
    position: "center",
    zoom: 1,
}
const PLAYBACK: Playback = {
    autoplay: true,
    loop: true,
    muted: true,
    controls: false,
}
const SCREEN: Screen = {
    ratio: "modern",
    custom: 2.16,
    cutout: "island",
    color: "#000000",
    homeBar: true,
    barColor: "rgba(255,255,255,0.85)",
    glare: false,
    glareAmount: 0.09,
}
const FRAME: Frame = {
    metallic: true,
    color: "#2E2E32",
    highlight: "#8E8E96",
    bezel: 2.6,
    corner: 15,
}
const RAILS: Buttons = {
    show: true,
    action: true,
    volume: true,
    power: true,
    color: "#3A3A3F",
    size: 1,
}
const SHADOW: Shadow = {
    enabled: true,
    color: "rgba(0,0,0,0.35)",
    blur: 60,
    offsetY: 24,
}

// Framer's CSS typings predate container queries.
type RootStyle = CSSProperties & { containerType?: "size" | "normal" }

function readImage(value: ImageProp) {
    if (!value) return { src: undefined, srcSet: undefined, alt: "" }
    if (typeof value === "string")
        return { src: value, srcSet: undefined, alt: "" }
    return { src: value.src, srcSet: value.srcSet, alt: value.alt ?? "" }
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function round(n: number) {
    return Math.round(n * 1000) / 1000
}

/**
 * iPhone Mock
 *
 * A device frame with a locked screen ratio. Every dimension is a ratio of the
 * device width, expressed in CSS, so the frame is correct at any size without
 * measuring the DOM — which also means it renders the same on the canvas, in
 * thumbnails and in static exports as it does on a published site.
 *
 * @framerIntrinsicWidth 300
 * @framerIntrinsicHeight 650
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function IPhoneMock(props: IPhoneMockProps) {
    const { style } = props
    const content = { ...CONTENT, ...props.content }
    const playback = { ...PLAYBACK, ...props.playback }
    const screen = { ...SCREEN, ...props.screen }
    const frame = { ...FRAME, ...props.frame }
    const rails = { ...RAILS, ...props.buttons }
    const shadow = { ...SHADOW, ...props.shadow }

    const isStatic = useIsStaticRenderer()

    // Read once, during render. Not a subscription, so it is safe on the
    // canvas and during export, where no effects run.
    const [reduceMotion] = useState(
        () =>
            typeof window !== "undefined" &&
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    )

    const screenRatio =
        screen.ratio === "custom"
            ? clamp(screen.custom, 1, 3)
            : (ASPECTS[screen.ratio] ?? ASPECTS.modern)

    // Every ratio below is relative to the device WIDTH, which is what CSS
    // percentages resolve against for padding, margin, left and right.
    const f = clamp(frame.bezel / 100, 0.005, 0.15) // bezel ÷ device width
    const deviceRatio = (1 - 2 * f) * screenRatio + 2 * f // height ÷ width
    const screenW = 1 - 2 * f // screen width ÷ device width
    const screenH = deviceRatio - 2 * f // screen height ÷ device width

    // A percentage border-radius is an ellipse: the first value resolves
    // against width, the second against height. Splitting them on the slash
    // keeps the corner circular at every size.
    const outerR = clamp(frame.corner, 0, 30) / 100
    const innerR = Math.max(outerR - f, 0.004)
    const outerRadius = `${round(outerR * 100)}% / ${round((outerR / deviceRatio) * 100)}%`
    const innerRadius = `${round((innerR / screenW) * 100)}% / ${round((innerR / screenH) * 100)}%`

    const t = 0.01 * clamp(rails.size, 0.4, 2) // button thickness ÷ device width
    const thickness = `max(1.5px, ${round(t * 100)}%)`

    // The screen is inset by one bezel on every side. Left and right resolve
    // against the device width, top and bottom against its height, so the two
    // pairs need different percentages to come out the same number of pixels.
    const inset = `${round((f / deviceRatio) * 100)}% ${round(f * 100)}%`

    // Which axes did Framer actually give us? Fill and fixed sizes are both
    // definite; Fit arrives as "auto" or missing.
    const definite = (v: string | number | undefined) =>
        v !== undefined && v !== "auto"
    const hasWidth = definite(style?.width as string | number | undefined)
    const hasHeight = definite(style?.height as string | number | undefined)

    // With both axes definite we can fit the device inside the box in pure CSS:
    // container units let the width depend on the container's height, which no
    // plain percentage can do. Everything else falls out of the aspect ratio.
    const bounded = hasWidth && hasHeight
    const deviceSize: CSSProperties = bounded
        ? {
              width: `min(100cqw, calc(100cqh / ${round(deviceRatio)}))`,
              aspectRatio: `1 / ${round(deviceRatio)}`,
          }
        : hasHeight
          ? {
                height: "100%",
                width: "auto",
                aspectRatio: `1 / ${round(deviceRatio)}`,
            }
          : {
                width: hasWidth ? "100%" : 300,
                aspectRatio: `1 / ${round(deviceRatio)}`,
            }

    const {
        src: imgSrc,
        srcSet: imgSrcSet,
        alt: imgAlt,
    } = readImage(content.image)
    const { src: posterSrc } = readImage(content.poster)
    const videoSrc = (content.videoUrl || "").trim() || content.video || ""
    const isVideo = content.type === "video"
    const hasMedia = isVideo ? Boolean(videoSrc) : Boolean(imgSrc)

    const frameBackground = frame.metallic
        ? `linear-gradient(150deg, ${frame.highlight} 0%, ${frame.color} 22%, ${frame.color} 52%, ${frame.highlight} 68%, ${frame.color} 86%)`
        : frame.color

    const visibleButtons = rails.show
        ? BUTTONS.filter((btn) =>
              btn.id === "action"
                  ? rails.action
                  : btn.id === "volume"
                    ? rails.volume
                    : rails.power,
          )
        : []

    // A looping autoplay video that keeps decoding after the visitor has
    // scrolled past costs CPU and battery for something nobody can see, so
    // playback is tied to the mock actually being in the viewport. Only wired
    // up off the static renderer, which has no playback to manage.
    const rootRef = useRef<HTMLDivElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    // Any of these remounts the <video>, so the observer is rebuilt with it.
    const videoKey = `${videoSrc}-${playback.autoplay}-${playback.loop}-${playback.muted}-${playback.controls}-${isStatic}`

    useEffect(() => {
        if (isStatic || !isVideo || !videoSrc) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return

        // Only ever resume what this observer paused, so scrolling back to a
        // video the visitor paused by hand does not start it playing again.
        let pausedHere = false
        const observer = new IntersectionObserver(
            (entries) => {
                const video = videoRef.current
                const entry = entries[entries.length - 1]
                if (!video || !entry) return
                if (entry.isIntersecting) {
                    if (!pausedHere) return
                    pausedHere = false
                    const resumed = video.play()
                    if (resumed && typeof resumed.catch === "function") {
                        resumed.catch(() => {})
                    }
                } else if (!video.paused) {
                    pausedHere = true
                    video.pause()
                }
            },
            { threshold: 0 },
        )
        observer.observe(root)
        return () => observer.disconnect()
    }, [isStatic, isVideo, videoSrc, videoKey])

    const mediaStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: content.fit,
        objectPosition: content.position,
        transform: `scale(${clamp(content.zoom, 1, 2)})`,
        display: "block",
        border: "none",
        willChange: "auto",
    }

    const rootStyle: RootStyle = {
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
        overflow: "visible",
        containerType: bounded ? "size" : "normal",
    }

    return (
        <div ref={rootRef} style={rootStyle}>
            {/* Device */}
            <div
                style={{
                    ...deviceSize,
                    position: "relative",
                    flexShrink: 0,
                    borderRadius: outerRadius,
                    background: frameBackground,
                    boxShadow: [
                        shadow.enabled
                            ? `0 ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
                            : null,
                        "inset 0 0 0 0.75px rgba(255,255,255,0.22)",
                    ]
                        .filter(Boolean)
                        .join(", "),
                }}
            >
                {/* Side buttons */}
                {visibleButtons.map((btn, i) => {
                    const isLeft = btn.side === "left"
                    const rx = 45
                    const ry = round((rx * t) / (btn.length * deviceRatio))
                    return (
                        <div
                            key={`${btn.id}-${i}`}
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: `${round(btn.top * 100)}%`,
                                height: `${round(btn.length * 100)}%`,
                                width: thickness,
                                left: isLeft
                                    ? `calc(${thickness} * -0.7)`
                                    : undefined,
                                right: isLeft
                                    ? undefined
                                    : `calc(${thickness} * -0.7)`,
                                background: rails.color,
                                borderRadius: isLeft
                                    ? `${rx}% 0 0 ${rx}% / ${ry}% 0 0 ${ry}%`
                                    : `0 ${rx}% ${rx}% 0 / 0 ${ry}% ${ry}% 0`,
                                boxShadow: "inset 0 0 2px rgba(0,0,0,0.35)",
                            }}
                        />
                    )
                })}

                {/* Screen */}
                <div
                    style={{
                        position: "absolute",
                        inset,
                        borderRadius: innerRadius,
                        overflow: "hidden",
                        background: hasMedia
                            ? screen.color
                            : `linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 55%), ${screen.color}`,
                        isolation: "isolate",
                    }}
                >
                    {isVideo
                        ? videoSrc && (
                              <video
                                  key={videoKey}
                                  ref={videoRef}
                                  src={videoSrc}
                                  poster={posterSrc}
                                  autoPlay={
                                      !isStatic &&
                                      !reduceMotion &&
                                      playback.autoplay
                                  }
                                  loop={playback.loop}
                                  muted={playback.muted}
                                  controls={!isStatic && playback.controls}
                                  playsInline
                                  preload="auto"
                                  aria-label={content.label || undefined}
                                  style={mediaStyle}
                              />
                          )
                        : imgSrc && (
                              <img
                                  src={imgSrc}
                                  srcSet={imgSrcSet}
                                  alt={content.label || imgAlt}
                                  draggable={false}
                                  style={mediaStyle}
                              />
                          )}

                    {/* Dynamic Island */}
                    {screen.cutout === "island" && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                marginTop: "2.8%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "31.5%",
                                aspectRatio: `${round(1 / 0.29)}`,
                                borderRadius: 9999,
                                background: "#000",
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: "28%",
                                    right: "8.12%",
                                    height: "44%",
                                    aspectRatio: "1",
                                    borderRadius: "50%",
                                    background:
                                        "radial-gradient(circle at 35% 30%, #2b2f3a 0%, #0b0d12 70%)",
                                }}
                            />
                        </div>
                    )}

                    {/* Notch */}
                    {screen.cutout === "notch" && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "55%",
                                aspectRatio: `${round(0.55 / 0.078)}`,
                                background: "#000",
                                borderRadius: "0 0 7.8% 7.8% / 0 0 55% 55%",
                            }}
                        />
                    )}

                    {/* Home indicator */}
                    {screen.homeBar && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                bottom: 0,
                                marginBottom: "2.2%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: "35%",
                                aspectRatio: `${round(0.35 / 0.0135)}`,
                                minHeight: 2,
                                borderRadius: 9999,
                                background: screen.barColor,
                            }}
                        />
                    )}

                    {/* Glare */}
                    {screen.glare && (
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                inset: 0,
                                pointerEvents: "none",
                                background: `linear-gradient(115deg, rgba(255,255,255,${screen.glareAmount}) 0%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,255,255,${screen.glareAmount * 0.4}) 100%)`,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

IPhoneMock.displayName = "iPhone Mock"

addPropertyControls(IPhoneMock, {
    content: {
        type: ControlType.Object,
        title: "Content",
        icon: "object",
        buttonTitle: "Media",
        defaultValue: {
            type: "image",
            videoUrl: "",
            label: "",
            fit: "cover",
            position: "center",
            zoom: 1,
        },
        controls: {
            type: {
                type: ControlType.Enum,
                title: "Show",
                options: ["image", "video"],
                optionTitles: ["Image", "Video"],
                displaySegmentedControl: true,
                defaultValue: "image",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: (p: Partial<Content>) => p.type === "video",
            },
            video: {
                type: ControlType.File,
                title: "Video file",
                allowedFileTypes: ["mp4", "webm", "ogg", "mov"],
                hidden: (p: Partial<Content>) => p.type !== "video",
            },
            videoUrl: {
                type: ControlType.String,
                title: "Video link",
                defaultValue: "",
                placeholder: "https://…mp4",
                description: "Used instead of the file above when filled in",
                hidden: (p: Partial<Content>) => p.type !== "video",
            },
            poster: {
                type: ControlType.ResponsiveImage,
                title: "Still frame",
                description: "Shown before the video plays, and in exports",
                hidden: (p: Partial<Content>) => p.type !== "video",
            },
            label: {
                type: ControlType.String,
                title: "Describe it",
                defaultValue: "",
                placeholder: "A misty mountain range",
                description:
                    "Read aloud by screen readers. Say what is on the screen.",
            },
            fit: {
                type: ControlType.Enum,
                title: "Fill screen",
                options: ["cover", "contain", "fill"],
                optionTitles: ["Crop to fit", "Show all", "Stretch"],
                defaultValue: "cover",
            },
            position: {
                type: ControlType.Enum,
                title: "Focus on",
                options: ["center", "top", "bottom", "left", "right"],
                optionTitles: ["Centre", "Top", "Bottom", "Left", "Right"],
                defaultValue: "center",
                hidden: (p: Partial<Content>) => p.fit === "fill",
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                min: 1,
                max: 2,
                step: 0.01,
                defaultValue: 1,
                displayStepper: false,
            },
        },
    },
    playback: {
        type: ControlType.Object,
        title: "Playback",
        icon: "interaction",
        buttonTitle: "Video",
        defaultValue: {
            autoplay: true,
            loop: true,
            muted: true,
            controls: false,
        },
        hidden: (p: Partial<IPhoneMockProps>) => p.content?.type !== "video",
        controls: {
            autoplay: {
                type: ControlType.Boolean,
                title: "Play on load",
                defaultValue: true,
                description:
                    "Skipped for visitors who ask for less motion in their system settings",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Repeat",
                defaultValue: true,
            },
            muted: {
                type: ControlType.Boolean,
                title: "Mute",
                defaultValue: true,
                description: "Browsers only autoplay muted video",
            },
            controls: {
                type: ControlType.Boolean,
                title: "Show controls",
                defaultValue: false,
            },
        },
    },
    screen: {
        type: ControlType.Object,
        title: "Screen",
        icon: "object",
        buttonTitle: "Screen",
        defaultValue: {
            ratio: "modern",
            custom: 2.16,
            cutout: "island",
            color: "#000000",
            homeBar: true,
            barColor: "rgba(255,255,255,0.85)",
            glare: false,
            glareAmount: 0.09,
        },
        controls: {
            ratio: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["modern", "classic", "square", "custom"],
                optionTitles: [
                    "iPhone (9:19.5)",
                    "Video (9:16)",
                    "Squarer (3:4)",
                    "Custom",
                ],
                defaultValue: "modern",
            },
            custom: {
                type: ControlType.Number,
                title: "Tall by",
                min: 1,
                max: 3,
                step: 0.01,
                defaultValue: 2.16,
                displayStepper: false,
                description: "2 means twice as tall as it is wide",
                hidden: (p: Partial<Screen>) => p.ratio !== "custom",
            },
            cutout: {
                type: ControlType.Enum,
                title: "Camera",
                options: ["island", "notch", "none"],
                optionTitles: ["Island", "Notch", "None"],
                displaySegmentedControl: true,
                defaultValue: "island",
            },
            color: {
                type: ControlType.Color,
                title: "Behind media",
                defaultValue: "#000000",
            },
            homeBar: {
                type: ControlType.Boolean,
                title: "Home bar",
                defaultValue: true,
            },
            barColor: {
                type: ControlType.Color,
                title: "Bar colour",
                defaultValue: "rgba(255,255,255,0.85)",
                hidden: (p: Partial<Screen>) => !p.homeBar,
            },
            glare: {
                type: ControlType.Boolean,
                title: "Glass glare",
                defaultValue: false,
            },
            glareAmount: {
                type: ControlType.Number,
                title: "Glare strength",
                min: 0,
                max: 0.4,
                step: 0.01,
                defaultValue: 0.09,
                hidden: (p: Partial<Screen>) => !p.glare,
            },
        },
    },
    frame: {
        type: ControlType.Object,
        title: "Frame",
        icon: "color",
        buttonTitle: "Frame",
        defaultValue: {
            metallic: true,
            color: "#2E2E32",
            highlight: "#8E8E96",
            bezel: 2.6,
            corner: 15,
        },
        controls: {
            color: {
                type: ControlType.Color,
                title: "Colour",
                defaultValue: "#2E2E32",
            },
            metallic: {
                type: ControlType.Boolean,
                title: "Brushed metal",
                defaultValue: true,
            },
            highlight: {
                type: ControlType.Color,
                title: "Metal sheen",
                defaultValue: "#8E8E96",
                hidden: (p: Partial<Frame>) => !p.metallic,
            },
            bezel: {
                type: ControlType.Number,
                title: "Border width",
                min: 0.5,
                max: 12,
                step: 0.1,
                unit: "%",
                defaultValue: 2.6,
            },
            corner: {
                type: ControlType.Number,
                title: "Roundness",
                min: 0,
                max: 30,
                step: 0.5,
                unit: "%",
                defaultValue: 15,
            },
        },
    },
    buttons: {
        type: ControlType.Object,
        title: "Buttons",
        icon: "object",
        buttonTitle: "Buttons",
        defaultValue: {
            show: true,
            action: true,
            volume: true,
            power: true,
            color: "#3A3A3F",
            size: 1,
        },
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Side buttons",
                defaultValue: true,
            },
            action: {
                type: ControlType.Boolean,
                title: "Action",
                defaultValue: true,
                hidden: (p: Partial<Buttons>) => !p.show,
            },
            volume: {
                type: ControlType.Boolean,
                title: "Volume",
                defaultValue: true,
                hidden: (p: Partial<Buttons>) => !p.show,
            },
            power: {
                type: ControlType.Boolean,
                title: "Power",
                defaultValue: true,
                hidden: (p: Partial<Buttons>) => !p.show,
            },
            color: {
                type: ControlType.Color,
                title: "Colour",
                defaultValue: "#3A3A3F",
                hidden: (p: Partial<Buttons>) => !p.show,
            },
            size: {
                type: ControlType.Number,
                title: "Thickness",
                min: 0.4,
                max: 2,
                step: 0.05,
                defaultValue: 1,
                displayStepper: false,
                hidden: (p: Partial<Buttons>) => !p.show,
            },
        },
    },
    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        icon: "effect",
        buttonTitle: "Shadow",
        defaultValue: {
            enabled: true,
            color: "rgba(0,0,0,0.35)",
            blur: 60,
            offsetY: 24,
        },
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Drop shadow",
                defaultValue: true,
            },
            color: {
                type: ControlType.Color,
                title: "Colour",
                defaultValue: "rgba(0,0,0,0.35)",
                hidden: (p: Partial<Shadow>) => !p.enabled,
            },
            blur: {
                type: ControlType.Number,
                title: "Softness",
                min: 0,
                max: 200,
                step: 1,
                defaultValue: 60,
                hidden: (p: Partial<Shadow>) => !p.enabled,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Drop",
                min: -100,
                max: 100,
                step: 1,
                defaultValue: 24,
                hidden: (p: Partial<Shadow>) => !p.enabled,
            },
        },
    },
})
