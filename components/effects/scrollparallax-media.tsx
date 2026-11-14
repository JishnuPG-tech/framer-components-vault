import React, { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type MediaType = "image" | "video"
type OverlayInteraction = "auto" | "none"
type ScrollTrackingMode = "auto" | "section" | "page"

interface Props {
    mediaType: MediaType
    image: string
    video: string
    videoFallbackImage: string
    imageAlt: string

    borderRadius: number
    strength: number
    speed: number
    damping: number
    scrollTrackingMode: ScrollTrackingMode

    desktopOverlayContent?: React.ReactNode
    tabletOverlayContent?: React.ReactNode
    phoneOverlayContent?: React.ReactNode
    tabletBreakpoint: number
    mobileBreakpoint: number
    overlayPadding: number
    overlayInteraction: OverlayInteraction

    showOverlayBackground: boolean
    overlayBackground: string
    overlayOpacity: number

    style?: React.CSSProperties
    className?: string
}

const DEFAULT_IMAGE =
    "https://images.unsplash.com/photo-1757254315853-d08544159392?q=80&w=1600&auto=format&fit=crop"

function StaticMedia({
    source,
    imageAlt,
}: {
    source: string
    imageAlt: string
}) {
    return (
        <img
            src={source}
            alt={imageAlt}
            draggable={false}
            style={{
                position: "absolute",
                top: -2,
                right: -2,
                bottom: -2,
                left: -2,
                display: "block",
                width: "calc(100% + 4px)",
                height: "calc(100% + 4px)",
                minWidth: "calc(100% + 4px)",
                minHeight: "calc(100% + 4px)",
                objectFit: "cover",
                objectPosition: "center",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        />
    )
}

function useHasFixedAncestor(targetRef: React.RefObject<HTMLElement>): boolean {
    const [hasFixedAncestor, setHasFixedAncestor] = useState(false)

    useEffect(() => {
        const target = targetRef.current

        if (!target || typeof window === "undefined") return

        const update = () => {
            let element: HTMLElement | null = target

            while (element) {
                const computedStyle = window.getComputedStyle(element)

                if (computedStyle.position === "fixed") {
                    setHasFixedAncestor(true)
                    return
                }

                element = element.parentElement
            }

            setHasFixedAncestor(false)
        }

        update()

        const observer = new MutationObserver(update)

        observer.observe(document.documentElement, {
            attributes: true,
            childList: true,
            subtree: true,
            attributeFilter: ["class", "style"],
        })

        window.addEventListener("resize", update, {
            passive: true,
        })

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [targetRef])

    return hasFixedAncestor
}

function ActiveMedia({
    containerRef,
    mediaType,
    image,
    video,
    videoFallbackImage,
    imageAlt,
    strength,
    speed,
    damping,
    scrollTrackingMode,
}: {
    containerRef: React.RefObject<HTMLDivElement>
    mediaType: MediaType
    image: string
    video: string
    videoFallbackImage: string
    imageAlt: string
    strength: number
    speed: number
    damping: number
    scrollTrackingMode: ScrollTrackingMode
}) {
    const videoRef = useRef<HTMLVideoElement>(null)

    const videoInView = useInView(videoRef, {
        once: false,
        margin: "100px 0px",
    })

    useEffect(() => {
        const element = videoRef.current

        if (!element) return

        if (videoInView) {
            element.play().catch(() => {
                // Autoplay may be blocked by the browser.
            })
        } else {
            element.pause()
        }
    }, [videoInView])

    const hasFixedAncestor = useHasFixedAncestor(containerRef)

    const sectionScroll = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const pageScroll = useScroll()

    const usePageProgress =
        scrollTrackingMode === "page" ||
        (scrollTrackingMode === "auto" && hasFixedAncestor)

    const activeScrollProgress = usePageProgress
        ? pageScroll.scrollYProgress
        : sectionScroll.scrollYProgress

    const parallaxStrength = Math.abs(strength)

    const targetY = useTransform(
        activeScrollProgress,
        [0, 1],
        [-parallaxStrength, parallaxStrength],
        { clamp: true }
    )

    // Keep the smooth spring, then hard-clamp its output. A spring may briefly
    // overshoot its target when the scroll trigger activates in Framer Preview.
    const springY = useSpring(targetY, {
        stiffness: Math.max(1, speed),
        damping: Math.max(30, damping),
        mass: 0.8,
        restDelta: 0.001,
        restSpeed: 0.001,
    })

    const y = useTransform(springY, (value) =>
        Math.max(-parallaxStrength, Math.min(parallaxStrength, value))
    )

    // Always exceed the maximum clamped translation, with extra room for
    // fractional iframe sizes and GPU compositing in Framer Preview.
    const overscan = Math.ceil(parallaxStrength + 96)

    const mediaStyle = {
        position: "absolute" as const,

        top: -overscan,
        right: -4,
        bottom: -overscan,
        left: -4,

        display: "block",
        width: "calc(100% + 8px)",
        height: `calc(100% + ${overscan * 2}px)`,
        minWidth: "calc(100% + 8px)",
        minHeight: `calc(100% + ${overscan * 2}px)`,

        objectFit: "cover" as const,
        objectPosition: "center" as const,

        pointerEvents: "none" as const,
        userSelect: "none" as const,
        WebkitUserSelect: "none" as const,

        backfaceVisibility: "hidden" as const,
        WebkitBackfaceVisibility: "hidden" as const,
        willChange: "transform",
        transformOrigin: "50% 50%",

        // The small scale avoids one-pixel seams during GPU compositing.
        translateZ: 0,
        scale: 1.015,
        y,
    }

    if (mediaType === "video" && video) {
        return (
            <motion.video
                ref={videoRef}
                src={video}
                poster={videoFallbackImage || image}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden={!imageAlt}
                aria-label={imageAlt || undefined}
                style={mediaStyle}
            />
        )
    }

    return (
        <motion.img
            src={image}
            alt={imageAlt}
            draggable={false}
            style={mediaStyle}
        />
    )
}

/**
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 600
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ParallaxMedia({
    mediaType = "image",
    image = DEFAULT_IMAGE,
    video = "",
    videoFallbackImage = "",
    imageAlt = "",

    borderRadius = 24,
    strength = 120,
    speed = 80,
    damping = 20,
    scrollTrackingMode = "auto",

    desktopOverlayContent,
    tabletOverlayContent,
    phoneOverlayContent,
    tabletBreakpoint = 1024,
    mobileBreakpoint = 768,
    overlayPadding = 0,
    overlayInteraction = "auto",

    showOverlayBackground = true,
    overlayBackground = "radial-gradient(ellipse at center, rgba(23, 19, 16, 0.55) 0%, rgba(23, 19, 16, 0.85) 70%, rgba(23, 19, 16, 0.95) 100%), linear-gradient(180deg, rgba(23, 19, 16, 0.3) 0%, rgba(23, 19, 16, 0.7) 60%, rgba(0, 0, 0, 0.65) 100%)",
    overlayOpacity = 1,

    style,
    className,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const isStaticRenderer = useIsStaticRenderer()

    const [containerWidth, setContainerWidth] = useState<number | null>(null)

    useEffect(() => {
        const node = containerRef.current

        if (!node) return

        const updateWidth = () => {
            const bounds = node.getBoundingClientRect()
            setContainerWidth(bounds.width)
        }

        updateWidth()

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateWidth, {
                passive: true,
            })

            return () => {
                window.removeEventListener("resize", updateWidth)
            }
        }

        const observer = new ResizeObserver(() => {
            updateWidth()
        })

        observer.observe(node)

        return () => {
            observer.disconnect()
        }
    }, [])

    const safeMobileBreakpoint = Math.max(0, mobileBreakpoint)
    const safeTabletBreakpoint = Math.max(
        safeMobileBreakpoint,
        tabletBreakpoint
    )

    const isPhone =
        containerWidth !== null && containerWidth <= safeMobileBreakpoint

    const isTablet =
        containerWidth !== null &&
        containerWidth > safeMobileBreakpoint &&
        containerWidth <= safeTabletBreakpoint

    const resolvedOverlayContent = isPhone
        ? phoneOverlayContent || tabletOverlayContent || desktopOverlayContent
        : isTablet
          ? tabletOverlayContent || desktopOverlayContent || phoneOverlayContent
          : desktopOverlayContent || tabletOverlayContent || phoneOverlayContent

    const resolvedImage = image || DEFAULT_IMAGE

    const fallbackSource =
        mediaType === "video"
            ? videoFallbackImage || resolvedImage
            : resolvedImage

    const safeOverlayPadding = Math.max(0, overlayPadding)

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                ...style,

                // Preserve Framer's width and height values.
                // Do not replace them with 100%.
                position: style?.position ?? "relative",
                marginTop: -1,
                marginBottom: -1,
                height: "101%",
                minWidth: 0,
                minHeight: 0,

                display: "block",
                overflow: "hidden",
                borderRadius,
                isolation: "isolate",
                boxSizing: "border-box",
                // Do not introduce a black fallback band while Preview is
                // repainting the transformed media layer.
                backgroundColor: "transparent",

                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
            }}
        >
            {isStaticRenderer ? (
                <StaticMedia source={fallbackSource} imageAlt={imageAlt} />
            ) : (
                <ActiveMedia
                    containerRef={containerRef}
                    mediaType={mediaType}
                    image={resolvedImage}
                    video={video}
                    videoFallbackImage={videoFallbackImage}
                    imageAlt={imageAlt}
                    strength={strength}
                    speed={speed}
                    damping={damping}
                    scrollTrackingMode={scrollTrackingMode}
                />
            )}

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    borderRadius: "inherit",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.01)",
                    pointerEvents: "none",
                }}
            />

            {showOverlayBackground && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,

                        background: overlayBackground,
                        opacity: overlayOpacity,

                        pointerEvents: "none",
                    }}
                />
            )}

            {resolvedOverlayContent && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,

                        boxSizing: "border-box",
                        pointerEvents: overlayInteraction,
                    }}
                >
                    <div
                        style={{
                            // Inset creates an actual padded content region.
                            position: "absolute",
                            top: safeOverlayPadding,
                            right: safeOverlayPadding,
                            bottom: safeOverlayPadding,
                            left: safeOverlayPadding,

                            minWidth: 0,
                            minHeight: 0,

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",

                            boxSizing: "border-box",
                        }}
                    >
                        {resolvedOverlayContent}
                    </div>
                </div>
            )}
        </div>
    )
}

ParallaxMedia.defaultProps = {
    mediaType: "image",
    image: DEFAULT_IMAGE,
    video: "",
    videoFallbackImage: "",
    imageAlt: "",

    borderRadius: 24,
    strength: 120,
    speed: 80,
    damping: 20,
    scrollTrackingMode: "auto",

    desktopOverlayContent: null,
    tabletOverlayContent: null,
    phoneOverlayContent: null,
    tabletBreakpoint: 1024,
    mobileBreakpoint: 768,
    overlayPadding: 0,
    overlayInteraction: "auto",

    showOverlayBackground: true,
    overlayBackground:
        "radial-gradient(ellipse at center, rgba(23, 19, 16, 0.55) 0%, rgba(23, 19, 16, 0.85) 70%, rgba(23, 19, 16, 0.95) 100%), linear-gradient(180deg, rgba(23, 19, 16, 0.3) 0%, rgba(23, 19, 16, 0.7) 60%, rgba(0, 0, 0, 0.65) 100%)",
    overlayOpacity: 1,
}

addPropertyControls(ParallaxMedia, {
    mediaType: {
        type: ControlType.Enum,
        title: "Media",
        options: ["image", "video"],
        optionTitles: ["Image", "Video"],
        defaultValue: "image",
    },

    image: {
        type: ControlType.Image,
        title: "Image",
        hidden: (props: Props) => props.mediaType === "video",
    },

    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "ogg", "mov"],
        hidden: (props: Props) => props.mediaType !== "video",
    },

    videoFallbackImage: {
        type: ControlType.Image,
        title: "Poster",
        hidden: (props: Props) => props.mediaType !== "video",
    },

    imageAlt: {
        type: ControlType.String,
        title: "Alt Text",
        defaultValue: "",
    },

    desktopOverlayContent: {
        type: ControlType.ComponentInstance,
        title: "Desktop Content",
    },

    tabletOverlayContent: {
        type: ControlType.ComponentInstance,
        title: "Tablet Content",
    },

    phoneOverlayContent: {
        type: ControlType.ComponentInstance,
        title: "Phone Content",
    },

    tabletBreakpoint: {
        type: ControlType.Number,
        title: "Tablet Below",
        min: 600,
        max: 1600,
        step: 1,
        defaultValue: 1024,
        unit: "px",
        description:
            "Uses Tablet Content at widths above Phone Below and at or below this value.",
    },

    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Phone Below",
        min: 320,
        max: 1200,
        step: 1,
        defaultValue: 768,
        unit: "px",
    },

    overlayPadding: {
        type: ControlType.Number,
        title: "Content Padding",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
        unit: "px",
    },

    overlayInteraction: {
        type: ControlType.Enum,
        title: "Content Interaction",
        options: ["auto", "none"],
        optionTitles: ["Interactive", "Ignore Pointer"],
        defaultValue: "auto",
    },

    showOverlayBackground: {
        type: ControlType.Boolean,
        title: "Overlay",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    overlayBackground: {
        type: ControlType.String,
        title: "Background",
        defaultValue:
            "radial-gradient(ellipse at center, rgba(23, 19, 16, 0.55) 0%, rgba(23, 19, 16, 0.85) 70%, rgba(23, 19, 16, 0.95) 100%), linear-gradient(180deg, rgba(23, 19, 16, 0.3) 0%, rgba(23, 19, 16, 0.7) 60%, rgba(0, 0, 0, 0.65) 100%)",
        hidden: (props: Props) => !props.showOverlayBackground,
    },

    overlayOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        hidden: (props: Props) => !props.showOverlayBackground,
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 24,
        unit: "px",
    },

    scrollTrackingMode: {
        type: ControlType.Enum,
        title: "Scroll Tracking",
        options: ["auto", "section", "page"],
        optionTitles: ["Auto", "Section", "Page / Fixed"],
        defaultValue: "auto",
        description:
            "Auto uses page progress when the component or a parent is fixed. Otherwise, it tracks the component section.",
    },

    strength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 500,
        step: 5,
        defaultValue: 120,
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        min: 10,
        max: 300,
        step: 1,
        defaultValue: 80,
    },

    damping: {
        type: ControlType.Number,
        title: "Damping",
        min: 5,
        max: 100,
        step: 1,
        defaultValue: 20,
    },
})
