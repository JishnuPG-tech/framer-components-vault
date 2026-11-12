// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import {
    useState,
    startTransition,
    useEffect,
    useMemo,
    useRef,
    useCallback,
    type CSSProperties,
} from "react"

declare global {
    interface Window {
        YT?: any
        onYouTubeIframeAPIReady?: () => void
    }
}

let youtubeIframeApiPromise: Promise<any> | null = null

const loadYouTubeIframeAPI = (): Promise<any | null> => {
    if (typeof window === "undefined") return Promise.resolve(null)
    if (window.YT?.Player) return Promise.resolve(window.YT)
    if (youtubeIframeApiPromise) return youtubeIframeApiPromise

    youtubeIframeApiPromise = new Promise((resolve) => {
        const existingScript = document.querySelector(
            'script[src="https://www.youtube.com/iframe_api"]'
        ) as HTMLScriptElement | null

        const resolveIfReady = () => {
            if (window.YT?.Player) resolve(window.YT)
        }

        const previousReady = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousReady === "function") previousReady()
            resolveIfReady()
        }

        if (existingScript) {
            resolveIfReady()
            return
        }

        const script = document.createElement("script")
        script.src = "https://www.youtube.com/iframe_api"
        script.async = true
        script.onload = resolveIfReady
        document.head.appendChild(script)
    })

    return youtubeIframeApiPromise
}

const extractVideoId = (url: string) => {
    if (!url) return null
    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
}

const isShorts = (url: string) => !!url && url.includes("/shorts/")

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 360
 */
export default function YouTubePlayer(props: any) {
    const {
        videoUrl,
        borderRadius,
        border,
        shadow,
        customThumbnail,
        useCustomThumbnail,
        customPlayIcon,
        useCustomPlayIcon,
        iconSize,
        iconPosition,
        overlayOpacity,
        aspectRatio,
        accentColor,
        autoplay,
        loop,
        showCaptions,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [isPlaying, setIsPlaying] = useState(!isStatic && autoplay)
    const [thumbnailError, setThumbnailError] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement | null>(null)
    const ytPlayerRef = useRef<any>(null)

    const videoId = extractVideoId(videoUrl)
    const shorts = isShorts(videoUrl ?? "")
    const iframeId = useMemo(
        () =>
            `youtube-player-${videoId ?? "video"}-${Math.random().toString(36).slice(2, 9)}`,
        [videoId]
    )

    const resolvedRatio =
        aspectRatio === "auto"
            ? shorts
                ? "9/16"
                : "16/9"
            : aspectRatio === "none"
              ? null
              : aspectRatio.replace(":", "/")

    const embedUrl = useMemo(() => {
        if (!videoId) return ""

        const params: string[] = [
            "autoplay=1",
            `cc_load_policy=${showCaptions ? 1 : 0}`,
        ]
        if (loop) {
            params.push("loop=1", `playlist=${videoId}`)
        }

        if (!showCaptions) {
            params.push("enablejsapi=1")
            if (typeof window !== "undefined" && window.location?.origin) {
                params.push(
                    `origin=${encodeURIComponent(window.location.origin)}`
                )
            }
        }

        return `https://www.youtube.com/embed/${videoId}?${params.join("&")}`
    }, [videoId, showCaptions, loop])

    const thumbnailSrc =
        useCustomThumbnail && customThumbnail?.src ? customThumbnail.src : null

    const customPlayIconSrc =
        useCustomPlayIcon && customPlayIcon?.src ? customPlayIcon.src : null

    const iconPositionStyle: CSSProperties =
        iconPosition === "bottomLeft"
            ? { position: "absolute", bottom: 16, left: 16 }
            : {
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
              }

    const wrapperStyle: CSSProperties = {
        width: "100%",
        height: "100%",
        ...style,
        minWidth: 160,
        minHeight: 90,
        borderRadius: borderRadius,
        overflow: "hidden",
        backgroundColor: "#000",
        boxShadow: shadow,
        ...border,
        // Safari fixes to ensure iframe strictly respects border-radius
        transform: "translateZ(0)",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
    }

    if (
        wrapperStyle.position !== "absolute" &&
        wrapperStyle.position !== "fixed"
    ) {
        wrapperStyle.position = "relative"
    }

    if (aspectRatio !== "none" && resolvedRatio) {
        wrapperStyle.aspectRatio = resolvedRatio
        wrapperStyle.height = "auto"
    }

    const innerStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
    }

    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : ""

    const fallbackThumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : ""

    const handlePlay = () => {
        if (isStatic) return
        startTransition(() => setIsPlaying(true))
    }

    const handleThumbnailError = () => {
        if (!thumbnailError) {
            startTransition(() => setThumbnailError(true))
        }
    }

    const disableCaptions = useCallback((player: any) => {
        if (!player) return
        try {
            player.unloadModule?.("captions")
        } catch (error) {}
        try {
            player.unloadModule?.("cc")
        } catch (error) {}
        try {
            player.setOption?.("captions", "track", {})
        } catch (error) {}
        try {
            player.setOption?.("cc", "track", {})
        } catch (error) {}
    }, [])

    useEffect(() => {
        // Never run iframe API logic in static/canvas context
        if (isStatic) return
        if (!isPlaying || showCaptions || !videoId) return
        if (typeof window === "undefined") return

        let isMounted = true

        const setupPlayer = async () => {
            const YT = await loadYouTubeIframeAPI()
            if (!isMounted || !YT?.Player || !iframeRef.current) return

            ytPlayerRef.current?.destroy?.()
            ytPlayerRef.current = new YT.Player(iframeRef.current, {
                events: {
                    onReady: (event: any) => {
                        disableCaptions(event?.target)
                    },
                    onApiChange: (event: any) => {
                        disableCaptions(event?.target)
                    },
                },
            })
        }

        setupPlayer()

        return () => {
            isMounted = false
            ytPlayerRef.current?.destroy?.()
            ytPlayerRef.current = null
        }
    }, [isStatic, isPlaying, showCaptions, videoId, disableCaptions])

    const effectiveThumbnailUrl = thumbnailError
        ? fallbackThumbnailUrl
        : thumbnailUrl

    if (!videoId) {
        return (
            <div style={wrapperStyle}>
                <div style={innerStyle}>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 10,
                            borderRadius: "inherit",
                        }}
                    >
                        <svg width={48} height={34} viewBox="0 0 68 48">
                            <path
                                d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                                fill={accentColor}
                                opacity={0.4}
                            />
                            <path
                                d="M45 24 27 14 27 34"
                                fill="#FFFFFF"
                                opacity={0.4}
                            />
                        </svg>
                        <span
                            style={{
                                color: "rgba(255,255,255,0.3)",
                                fontSize: 12,
                                fontWeight: 500,
                                fontFamily: "sans-serif",
                            }}
                        >
                            Paste a valid YouTube URL
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    // Static renderer: show thumbnail + play icon, no iframe, no effects
    if (isStatic) {
        const staticThumbnail =
            thumbnailSrc ||
            `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

        return (
            <div style={wrapperStyle}>
                <div style={innerStyle}>
                    <img
                        src={staticThumbnail}
                        alt="Video thumbnail"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                            borderRadius: "inherit",
                        }}
                    />
                    <div
                        style={{
                            width: iconSize,
                            height: iconSize,
                            zIndex: 2,
                            ...iconPositionStyle,
                        }}
                    >
                        {customPlayIconSrc ? (
                            <img
                                src={customPlayIconSrc}
                                alt="Play"
                                style={{ width: "100%", height: "auto" }}
                            />
                        ) : (
                            <svg viewBox="0 0 68 48" width="100%" height="100%">
                                <path
                                    d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                                    fill={accentColor}
                                />
                                <path d="M45 24 27 14 27 34" fill="#FFFFFF" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={wrapperStyle}>
            <div style={innerStyle}>
                {isPlaying ? (
                    <iframe
                        id={iframeId}
                        ref={iframeRef}
                        src={embedUrl}
                        title="YouTube Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            border: "none",
                            borderRadius: "inherit",
                        }}
                    />
                ) : (
                    <div
                        onClick={handlePlay}
                        style={{
                            position: "absolute",
                            inset: 0,
                            cursor: "pointer",
                            borderRadius: "inherit",
                        }}
                    >
                        <img
                            src={thumbnailSrc || effectiveThumbnailUrl}
                            alt="Video thumbnail"
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "inherit",
                            }}
                            onError={handleThumbnailError}
                        />

                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
                                borderRadius: "inherit",
                            }}
                        />

                        <div
                            style={{
                                width: iconSize,
                                height: iconSize,
                                zIndex: 2,
                                ...iconPositionStyle,
                            }}
                        >
                            {customPlayIconSrc ? (
                                <img
                                    src={customPlayIconSrc}
                                    alt="Play"
                                    style={{ width: "100%", height: "auto" }}
                                />
                            ) : (
                                <svg
                                    viewBox="0 0 68 48"
                                    width="100%"
                                    height="100%"
                                >
                                    <path
                                        d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                                        fill={accentColor}
                                    />
                                    <path
                                        d="M45 24 27 14 27 34"
                                        fill="#FFFFFF"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(YouTubePlayer, {
    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        defaultValue: "https://youtu.be/BHACKCNDMW8?si=5pTVqTfGeVFnU0Wt",
        placeholder: "https://youtu.be/...",
        description: "Regular, Shorts, or embed URLs all work.",
    },
    aspectRatio: {
        type: ControlType.Enum,
        title: "Aspect Ratio",
        options: ["9:16", "16:9", "4:5", "1:1", "auto", "none"],
        optionTitles: [
            "9:16 — Shorts",
            "16:9 — Landscape",
            "4:5 — Portrait",
            "1:1 — Square",
            "Auto (detect from URL)",
            "None (free resize)",
        ],
        defaultValue: "auto",
        description:
            "Constrains the component to the selected ratio when resizing. Make the width fixed to resize while keeping the aspect ratio. Select 'None' to resize freely without ratio constraint.",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    border: {
        type: ControlType.Border,
        title: "Border",
        optional: true,
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    showCaptions: {
        type: ControlType.Boolean,
        title: "Show Captions",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        description: "Scrim darkness over the thumbnail.",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Play Color",
        defaultValue: "#FF0000",
    },
    useCustomPlayIcon: {
        type: ControlType.Boolean,
        title: "Custom Play Button",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Play Button Pos.",
        options: ["center", "bottomLeft"],
        optionTitles: ["Center", "Bottom Left"],
        defaultValue: "center",
        displaySegmentedControl: true,
        description:
            "The play button will be replaced by the YouTube player when the video starts.",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Play Button Size",
        defaultValue: 60,
        min: 20,
        max: 150,
        unit: "px",
        displayStepper: true,
    },
    customPlayIcon: {
        type: ControlType.ResponsiveImage,
        title: "Play Button Image",
        hidden: (props) => !props.useCustomPlayIcon,
    },
    useCustomThumbnail: {
        type: ControlType.Boolean,
        title: "Custom Thumbnail",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    customThumbnail: {
        type: ControlType.ResponsiveImage,
        title: "Thumbnail Image",
        hidden: (props) => !props.useCustomThumbnail,
        description: "Replaces the auto-fetched YouTube thumbnail.",
    },
})
