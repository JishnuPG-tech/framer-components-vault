// Created by 584.studio

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


type Props = {
    sourceType: "file" | "url"
    videoFile: string
    videoUrl: string
    scrollSpeed: number
    startAt: number
    endAt: number
    backgroundColor: string
}

export default function ScrollControlledVideo(props: Props) {
    const {
        sourceType,
        videoFile,
        videoUrl,
        scrollSpeed,
        startAt,
        endAt,
        backgroundColor,
    } = props

    const isStaticRenderer = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const videoRef = React.useRef<HTMLVideoElement | null>(null)
    const durationRef = React.useRef(0)
    const frameRef = React.useRef<number | null>(null)

    const [autoHeight, setAutoHeight] = React.useState("100vh")

    const videoSource = sourceType === "file" ? videoFile : videoUrl

    const mobileVideoSource = React.useMemo(() => {
        if (!videoSource) return ""

        const hashIndex = videoSource.indexOf("#")

        const baseSource =
            hashIndex >= 0 ? videoSource.slice(0, hashIndex) : videoSource

        return `${baseSource}#t=0.001`
    }, [videoSource])

    const clamp = (value: number, min: number, max: number) => {
        return Math.min(Math.max(value, min), max)
    }

    const updateHeight = React.useCallback(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        const duration = durationRef.current

        if (!duration || duration <= 0) {
            setAutoHeight("100vh")
            return
        }

        const viewportHeight = window.innerHeight || 0
        const scrollDistance = duration * scrollSpeed
        const calculatedHeight = viewportHeight + scrollDistance

        setAutoHeight(`${calculatedHeight}px`)
    }, [isStaticRenderer, scrollSpeed])

    const updateVideoTime = React.useCallback(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        const container = containerRef.current
        const video = videoRef.current

        if (!container || !video || !durationRef.current) return

        const rect = container.getBoundingClientRect()
        const viewportHeight = window.innerHeight

        const scrollableDistance = rect.height - viewportHeight

        if (scrollableDistance <= 0) return

        const rawProgress = -rect.top / scrollableDistance

        const progress = clamp(rawProgress, 0, 1)

        const startTime = (durationRef.current * startAt) / 100

        const endTime = (durationRef.current * endAt) / 100

        const targetTime = startTime + (endTime - startTime) * progress

        if (Math.abs(video.currentTime - targetTime) > 0.03) {
            try {
                video.currentTime = targetTime
            } catch {
                return
            }
        }
    }, [isStaticRenderer, startAt, endAt])

    React.useEffect(() => {
        if (isStaticRenderer || typeof window === "undefined") return

        const container = containerRef.current
        const video = videoRef.current

        if (!container || !video) return

        let isNearViewport = false
        let isScrollListening = false

        durationRef.current = 0
        setAutoHeight("100vh")

        const scheduleUpdate = () => {
            if (!isNearViewport) return
            if (frameRef.current !== null) return

            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = null
                updateVideoTime()
            })
        }

        const handleScroll = () => {
            scheduleUpdate()
        }

        const startScrollTracking = () => {
            if (isScrollListening) {
                scheduleUpdate()
                return
            }

            window.addEventListener("scroll", handleScroll, { passive: true })

            isScrollListening = true
            scheduleUpdate()
        }

        const stopScrollTracking = () => {
            if (isScrollListening) {
                window.removeEventListener("scroll", handleScroll)

                isScrollListening = false
            }

            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)

                frameRef.current = null
            }
        }

        const handleLoadedMetadata = () => {
            durationRef.current = video.duration || 0

            updateHeight()
            scheduleUpdate()
        }

        const handleResize = () => {
            updateHeight()
            scheduleUpdate()
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                isNearViewport = entry.isIntersecting

                if (isNearViewport) {
                    startScrollTracking()
                } else {
                    stopScrollTracking()
                }
            },
            {
                root: null,
                rootMargin: "100% 0px 100% 0px",
                threshold: 0,
            }
        )

        video.addEventListener("loadedmetadata", handleLoadedMetadata)

        window.addEventListener("resize", handleResize)

        observer.observe(container)

        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            handleLoadedMetadata()
        }

        return () => {
            observer.disconnect()

            video.removeEventListener("loadedmetadata", handleLoadedMetadata)

            window.removeEventListener("resize", handleResize)

            if (isScrollListening) {
                window.removeEventListener("scroll", handleScroll)
            }

            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)

                frameRef.current = null
            }
        }
    }, [isStaticRenderer, videoSource, updateHeight, updateVideoTime])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100vw",
                height: autoHeight,
                position: "relative",
                left: "50%",
                right: "50%",
                marginLeft: "-50vw",
                marginRight: "-50vw",
                backgroundColor,
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: 0,
                    width: "100vw",
                    height: "100vh",
                    overflow: "hidden",
                    backgroundColor,
                }}
            >
                {videoSource ? (
                    <video
                        key={videoSource}
                        ref={isStaticRenderer ? undefined : videoRef}
                        muted
                        playsInline
                        preload={isStaticRenderer ? "metadata" : "auto"}
                        controls={false}
                        style={{
                            width: "100vw",
                            height: "100vh",
                            display: "block",
                            objectFit: "cover",
                            objectPosition: "center center",
                        }}
                    >
                        <source
                            src={mobileVideoSource}
                            media="(hover: none) and (pointer: coarse)"
                        />

                        <source src={videoSource} />
                    </video>
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 14,
                            opacity: 0.5,
                            color: "#ffffff",
                        }}
                    >
                        Add a video file or URL
                    </div>
                )}
            </div>
        </div>
    )
}

ScrollControlledVideo.defaultProps = {
    sourceType: "file",
    videoFile: "",
    videoUrl: "",
    scrollSpeed: 500,
    startAt: 0,
    endAt: 100,
    backgroundColor: "#000000",
}

addPropertyControls(ScrollControlledVideo, {
    sourceType: {
        type: ControlType.Enum,
        title: "Source",
        options: ["file", "url"],
        optionTitles: ["File", "URL"],
    },

    videoFile: {
        type: ControlType.File,
        title: "Video File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        hidden: (props) => props.sourceType !== "file",
    },

    videoUrl: {
        type: ControlType.String,
        title: "Video URL",
        placeholder: "https://example.com/video.mp4",
        hidden: (props) => props.sourceType !== "url",
    },

    scrollSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 100,
        max: 1500,
        step: 50,
        defaultValue: 500,
    },

    startAt: {
        type: ControlType.Number,
        title: "Start %",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
    },

    endAt: {
        type: ControlType.Number,
        title: "End %",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
})
