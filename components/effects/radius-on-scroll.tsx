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


const getWindowHeight = () =>
    typeof window !== "undefined" ? window.innerHeight : 1000

const getTriggerPosition = (trigger, elementTop, elementHeight) => {
    const windowHeight = getWindowHeight()
    switch (trigger) {
        case "enter-top":
            return elementTop - windowHeight
        case "enter-center":
            return elementTop + elementHeight / 2 - windowHeight
        case "enter-bottom":
            return elementTop + elementHeight - windowHeight
        case "exit-top":
            return elementTop
        case "exit-center":
            return elementTop + elementHeight / 2
        case "exit-bottom":
            return elementTop + elementHeight
        default:
            return elementTop - windowHeight
    }
}

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const lerp = (a, b, t) => a + (b - a) * t

function getFused4(props, baseKey, isUnifiedKey) {
    const val = props[baseKey] ?? 0
    if (!props[isUnifiedKey]) {
        return [val, val, val, val]
    }
    return [
        props[baseKey + "Top"] ?? 0,
        props[baseKey + "Right"] ?? 0,
        props[baseKey + "Bottom"] ?? 0,
        props[baseKey + "Left"] ?? 0,
    ]
}

/**
 * @framerDisableUnlink
 */
export default function RadiusOnScroll(props) {
    const {
        mediaType = "image",
        imageFile,
        videoSource = "url",
        videoFile,
        videoUrl = "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        Start = "enter-top",
        End = "exit-top",
        offset = 0,
        transformDistance = 100,
        width,
        height,
        playing = true,
        poster,
        startTime = 0,
        loop = true,
        showControls = "Hide",
        muted = true,
    } = props

    const containerRef = React.useRef(null)
    const wrapperRef = React.useRef(null)
    const mediaRef = React.useRef(null)
    const isEditor = RenderTarget.current() === RenderTarget.canvas

    const [progress, setProgress] = React.useState(0)
    const [wrapperSize, setWrapperSize] = React.useState({ w: 0, h: 0 })
    const [mediaNatural, setMediaNatural] = React.useState({ w: 0, h: 0 })

    const computeRange = React.useCallback(() => {
        if (!containerRef.current) return [0, 1]
        const rect = containerRef.current.getBoundingClientRect()
        const scrollTop =
            window.scrollY || document.documentElement.scrollTop || 0
        const elementTop = rect.top + scrollTop
        const elementHeight = rect.height
        let s = getTriggerPosition(Start, elementTop, elementHeight) + offset
        let e = getTriggerPosition(End, elementTop, elementHeight) + offset
        const dist = Math.abs(e - s)
        const adjusted = (dist * transformDistance) / 100
        const center = (s + e) / 2
        s = center - adjusted / 2
        e = center + adjusted / 2
        if (e <= s) e = s + 1
        return [s, e]
    }, [Start, End, offset, transformDistance])

    const latestProgressRef = React.useRef(progress)

    React.useEffect(() => {
        let rafId = null
        const tick = () => {
            const [s, e] = computeRange()
            const scrollTop =
                window.scrollY || document.documentElement.scrollTop || 0
            const raw = (scrollTop - s) / (e - s)
            const target = isEditor ? 0 : clamp01(raw)
            if (Math.abs(target - latestProgressRef.current) > 0.001) {
                latestProgressRef.current = target
                setProgress(target)
            }
            if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect()
                if (
                    rect.width !== wrapperSize.w ||
                    rect.height !== wrapperSize.h
                ) {
                    setWrapperSize({ w: rect.width, h: rect.height })
                }
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => {
            if (rafId != null) cancelAnimationFrame(rafId)
        }
    }, [computeRange, isEditor, wrapperSize.w, wrapperSize.h])

    const startRadiusArr = getFused4(props, "startRadius", "isRadiusUnified")
    const endRadiusArr = getFused4(props, "endRadius", "isEndRadiusUnified")
    const currentRadiusArr = startRadiusArr.map(
        (v, i) =>
            Math.round(lerp(v, endRadiusArr[i], progress) * 100000) / 100000
    )
    const borderRadiusStyle = currentRadiusArr.map((r) => `${r}px`).join(" ")

    const startPaddingArr = getFused4(props, "startPadding", "isPaddingUnified")
    const endPaddingArr = getFused4(props, "endPadding", "isEndPaddingUnified")
    const currentPaddingArr = startPaddingArr.map((v, i) =>
        lerp(v, endPaddingArr[i], progress)
    )
    const [pT, pR, pB, pL] = currentPaddingArr

    const getMediaLayout = () => {
        if (
            !wrapperSize.w ||
            !wrapperSize.h ||
            !mediaNatural.w ||
            !mediaNatural.h
        ) {
            return {
                mediaDisplaySize: {
                    w: wrapperSize.w || 0,
                    h: wrapperSize.h || 0,
                },
                mediaPosition: { x: 0, y: 0 },
            }
        }

        const scale = Math.max(
            wrapperSize.w / mediaNatural.w,
            wrapperSize.h / mediaNatural.h
        )

        const displayW = mediaNatural.w * scale
        const displayH = mediaNatural.h * scale

        const x = (wrapperSize.w - displayW) / 2
        const y = (wrapperSize.h - displayH) / 2

        return {
            mediaDisplaySize: { w: displayW, h: displayH },
            mediaPosition: { x, y },
        }
    }

    const { mediaDisplaySize, mediaPosition } = getMediaLayout()

    const mediaSrc =
        mediaType === "video"
            ? videoSource === "url"
                ? videoUrl
                : videoFile
            : typeof imageFile === "string"
              ? imageFile
              : imageFile?.src || ""

    const posterSrc =
        poster && typeof poster === "object" && "src" in poster
            ? poster.src
            : typeof poster === "string"
              ? poster
              : ""

    const getMediaContainerStyle = () => {
        return {
            position: "absolute",
            top: pT,
            right: pR,
            bottom: pB,
            left: pL,
            overflow: "hidden",
            width: `calc(100% - ${pL + pR}px)`,
            height: `calc(100% - ${pT + pB}px)`,
            borderRadius: "inherit",
        }
    }

    const mediaContainerStyle = getMediaContainerStyle()

    const computeMediaStyle = () => {
        const baseStyle: React.CSSProperties = {
            position: "absolute",
            display: "block",
            borderRadius: "inherit",
        }

        if (
            isEditor ||
            !wrapperSize.w ||
            !wrapperSize.h ||
            !mediaNatural.w ||
            !mediaNatural.h
        ) {
            return {
                ...baseStyle,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                height: "100%",
                objectFit: "cover",
            }
        }

        const containerW = wrapperSize.w - pL - pR
        const containerH = wrapperSize.h - pT - pB

        if (containerW <= 0 || containerH <= 0) {
            return {
                ...baseStyle,
                display: "none",
            }
        }

        const scale = Math.max(
            containerW / mediaNatural.w,
            containerH / mediaNatural.h
        )

        const scaledW = mediaNatural.w * scale
        const scaledH = mediaNatural.h * scale

        return {
            ...baseStyle,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: scaledW,
            height: scaledH,
            objectFit: "cover",
        }
    }

    const mediaStyle = computeMediaStyle()

    React.useEffect(() => {
        if (mediaType === "video" && mediaRef.current) {
            if (playing) mediaRef.current.play().catch(() => {})
            else mediaRef.current.pause()
        }
    }, [playing, mediaType])

    return (
        <Frame
            ref={containerRef}
            width={width}
            height={height}
            background=""
            style={{
                boxSizing: "border-box",
                overflow: "hidden",
                width: "100%",
                height: "100%",
                position: "relative",
                borderRadius: borderRadiusStyle,
            }}
        >
            <div
                ref={wrapperRef}
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    overflow: "hidden",
                    borderRadius: "inherit",
                }}
            >
                <div style={mediaContainerStyle as React.CSSProperties}>
                    {mediaType === "image" && mediaSrc && (
                        <img
                            ref={mediaRef}
                            src={mediaSrc}
                            alt={imageFile?.alt || ""}
                            onLoad={(e) =>
                                setMediaNatural({
                                    w: e.currentTarget.naturalWidth,
                                    h: e.currentTarget.naturalHeight,
                                })
                            }
                            draggable={false}
                            style={mediaStyle as React.CSSProperties}
                        />
                    )}
                    {mediaType === "video" && mediaSrc && (
                        <video
                            ref={mediaRef}
                            src={mediaSrc}
                            poster={posterSrc}
                            aria-label=""
                            onLoadedMetadata={(e) => {
                                const v = e.currentTarget
                                setMediaNatural({
                                    w: v.videoWidth,
                                    h: v.videoHeight,
                                })
                                if (startTime && v.duration) {
                                    v.currentTime = Math.min(
                                        (startTime / 100) * v.duration,
                                        v.duration
                                    )
                                }
                            }}
                            autoPlay={playing}
                            loop={loop}
                            muted={muted}
                            controls={showControls === "Show"}
                            playsInline
                            style={
                                {
                                    ...mediaStyle,
                                    background: "#000",
                                } as React.CSSProperties
                            }
                        />
                    )}
                </div>
            </div>
        </Frame>
    )
}

addPropertyControls(RadiusOnScroll, {
    mediaType: {
        type: ControlType.SegmentedEnum,
        title: "Type",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },
    imageFile: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (p) => p.mediaType !== "image",
    },
    videoSource: {
        type: ControlType.SegmentedEnum,
        title: "Source",
        options: ["url", "upload"],
        optionTitles: ["URL", "Upload"],
        defaultValue: "url",
        hidden: (p) => p.mediaType !== "video",
    },
    videoUrl: {
        type: ControlType.String,
        title: "URL",
        defaultValue:
            "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
        hidden: (p) => p.mediaType !== "video" || p.videoSource !== "url",
    },
    videoFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["mp4", "mov", "webm"],
        hidden: (p) => p.mediaType !== "video" || p.videoSource !== "upload",
    },
    playing: {
        type: ControlType.Boolean,
        title: "Playing",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => p.mediaType !== "video",
    },
    poster: {
        type: ControlType.Image,
        title: "Poster",
        hidden: (p) => p.mediaType !== "video",
    },
    startTime: {
        type: ControlType.Number,
        title: "Start Time",
        defaultValue: 0,
        unit: "%",
        min: 0,
        max: 100,
        step: 1,
        hidden: (p) => p.mediaType !== "video",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => p.mediaType !== "video",
    },
    showControls: {
        type: ControlType.SegmentedEnum,
        title: "Controls",
        options: ["Show", "Hide"],
        optionTitles: ["Show", "Hide"],
        defaultValue: "Hide",
        hidden: (p) => p.mediaType !== "video",
    },
    muted: {
        type: ControlType.Boolean,
        title: "Muted",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (p) => p.mediaType !== "video",
    },
    startRadius: {
        type: ControlType.FusedNumber,
        title: "Start Radius",
        defaultValue: 0,
        toggleKey: "isRadiusUnified",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "startRadiusTop",
            "startRadiusRight",
            "startRadiusBottom",
            "startRadiusLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    endRadius: {
        type: ControlType.FusedNumber,
        title: "End Radius",
        defaultValue: 48,
        toggleKey: "isEndRadiusUnified",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "endRadiusTop",
            "endRadiusRight",
            "endRadiusBottom",
            "endRadiusLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    startPadding: {
        type: ControlType.FusedNumber,
        title: "Start Padding",
        defaultValue: 0,
        toggleKey: "isPaddingUnified",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "startPaddingTop",
            "startPaddingRight",
            "startPaddingBottom",
            "startPaddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    endPadding: {
        type: ControlType.FusedNumber,
        title: "End Padding",
        defaultValue: 48,
        toggleKey: "isEndPaddingUnified",
        toggleTitles: ["All", "Each"],
        valueKeys: [
            "endPaddingTop",
            "endPaddingRight",
            "endPaddingBottom",
            "endPaddingLeft",
        ],
        valueLabels: ["T", "R", "B", "L"],
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    Start: {
        type: ControlType.Enum,
        title: "Start at",
        defaultValue: "enter-bottom",
        options: [
            "enter-top",
            "enter-center",
            "enter-bottom",
            "exit-top",
            "exit-center",
            "exit-bottom",
        ],
        optionTitles: [
            "Top Enters View",
            "Center Enters View",
            "Bottom Enters View",
            "Top Leaves View",
            "Center Leaves View",
            "Bottom Leaves View",
        ],
    },
    End: {
        type: ControlType.Enum,
        title: "End at",
        defaultValue: "exit-center",
        options: [
            "enter-top",
            "enter-center",
            "enter-bottom",
            "exit-top",
            "exit-center",
            "exit-bottom",
        ],
        optionTitles: [
            "Top Enters View",
            "Center Enters View",
            "Bottom Enters View",
            "Top Leaves View",
            "Center Leaves View",
            "Bottom Leaves View",
        ],
    },
    offset: {
        type: ControlType.Number,
        title: "Offset Y",
        defaultValue: 0,
        step: 10,
        max: 1000,
    },
    transformDistance: {
        type: ControlType.Number,
        title: "Transform Distance",
        defaultValue: 100,
        unit: "%",
        step: 10,
        min: 0,
        max: 1000,
    },
})
