// Instructions: Create a Framer component that follows the Framer component rules and achieves the user's goal: 3D Curve Carousel displays images and videos in a rotating curved 3D layout with drag, momentum, autoplay, and CMS/external links. Includes edge fade and customizable card sizing, radius, perspective, media fit, and video autoplay/loop.
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

import {
    motion,
    useInView,
    useMotionTemplate,
    useMotionValue,
    useTransform,
} from "framer-motion"

type MediaType = "image" | "video"
type Direction = "left" | "right"
type ObjectFit = "cover" | "contain"

type ResponsiveImage = { src: string; srcSet?: string; alt?: string }

type CarouselItem = {
    type: MediaType
    image?: ResponsiveImage
    video?: string
    poster?: ResponsiveImage
    alt?: string
    link?: string
}

type Props = {
    items: CarouselItem[]

    autoplay: boolean
    speed: number
    direction: Direction
    pauseOnHover: boolean

    draggable: boolean
    dragSensitivity: number
    momentum: boolean
    momentumFriction: number

    radius: number
    perspective: number
    ringTiltX: number
    ringTiltY: number

    cardWidth: number
    aspectRatio: number
    cardRadius: number
    cardBorder: boolean
    borderColor: string
    borderWidth: number
    shadow: string

    mediaFit: ObjectFit
    background: string

    edgeFade: boolean
    edgeFadeSize: number
    edgeFadeColor: string

    videoAutoplay: boolean
    videoMuted: boolean
    videoLoop: boolean
    videoControls: boolean

    openLinksInNewTab: boolean

    style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function wrapAngleDeg(angle: number) {
    let a = angle % 360
    if (a < 0) a += 360
    return a
}

/**
 * 3D Curve Carousel
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 420
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CurveCarousel3D(props: Props) {
    const isStatic = useIsStaticRenderer()

    const {
        items = [
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                alt: "Gradient 5 - Green",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                alt: "Gradient 4 - Yellow",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                alt: "Gradient 3 - Orange",
                link: "",
            },
            {
                type: "video",
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                poster: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                alt: "Sample video",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                alt: "Gradient 1 - Blue",
                link: "",
            },
        ],

        autoplay = true,
        speed = 18,
        direction = "left",
        pauseOnHover = true,

        draggable = true,
        dragSensitivity = 0.18,
        momentum = true,
        momentumFriction = 2.4,

        radius = 380,
        perspective = 1100,
        ringTiltX = 0,
        ringTiltY = 0,

        cardWidth = 260,
        aspectRatio = 16 / 10,
        cardRadius = 16,
        cardBorder = false,
        borderColor = "#EEEEEE",
        borderWidth = 1,
        shadow = "0 10px 40px rgba(0,0,0,0.14)",

        mediaFit = "cover",
        background = "#FFFFFF",

        edgeFade = true,
        edgeFadeSize = 90,
        edgeFadeColor = "#FFFFFF",

        videoAutoplay = true,
        videoMuted = true,
        videoLoop = true,
        videoControls = false,

        openLinksInNewTab = false,
    } = props

    const safeItems = React.useMemo(() => {
        const fallbackImageA: ResponsiveImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Gradient 5 - Green",
        }
        const fallbackImageB: ResponsiveImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        }
        const fallbackPoster: ResponsiveImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Gradient 2 - Purple",
        }
        const fallbackVideo =
            "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4"

        const arr = (items ?? []).filter(Boolean)
        if (arr.length === 0) {
            return [
                {
                    type: "image" as const,
                    image: fallbackImageA,
                    alt: fallbackImageA.alt,
                    link: "",
                },
                {
                    type: "image" as const,
                    image: fallbackImageB,
                    alt: fallbackImageB.alt,
                    link: "",
                },
            ]
        }

        return arr.map((it, idx) => {
            const type: MediaType = it?.type === "video" ? "video" : "image"

            if (type === "video") {
                return {
                    type,
                    video: it.video || fallbackVideo,
                    poster: it.poster?.src ? it.poster : fallbackPoster,
                    alt: it.alt || it.poster?.alt || "Video",
                    link: it.link || "",
                } satisfies CarouselItem
            }

            const img = it.image?.src
                ? it.image
                : idx % 2 === 0
                  ? fallbackImageA
                  : fallbackImageB

            return {
                type,
                image: img,
                alt: it.alt || img.alt || "Image",
                link: it.link || "",
            } satisfies CarouselItem
        })
    }, [items])

    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const isInView = useInView(containerRef, { amount: 0.2 })
    const isAnimating = !isStatic && isInView

    const rotation = useMotionValue(0) // degrees
    const velocityRef = React.useRef(0) // degrees per second
    const draggingRef = React.useRef(false)
    const hoverRef = React.useRef(false)
    const pointerIdRef = React.useRef<number | null>(null)
    const lastXRef = React.useRef(0)
    const lastTRef = React.useRef(0)

    const dirSign = direction === "left" ? 1 : -1
    const cardHeight = Math.max(1, cardWidth / Math.max(0.05, aspectRatio))
    const count = safeItems.length
    const step = count > 0 ? 360 / count : 360

    const ringTransform = useMotionTemplate`rotateX(${ringTiltX}deg) rotateY(${ringTiltY}deg)`

    const stopMomentum = React.useCallback(() => {
        velocityRef.current = 0
    }, [])

    const beginDrag = React.useCallback(
        (clientX: number) => {
            draggingRef.current = true
            stopMomentum()
            lastXRef.current = clientX
            lastTRef.current =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
        },
        [stopMomentum]
    )

    const moveDrag = React.useCallback(
        (clientX: number) => {
            if (!draggingRef.current) return

            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            const dx = clientX - lastXRef.current
            const dtMs = Math.max(1, now - lastTRef.current)
            lastXRef.current = clientX
            lastTRef.current = now

            const dDeg = dx * dragSensitivity
            rotation.set(rotation.get() + dDeg)

            const v = dDeg / (dtMs / 1000) || 0
            velocityRef.current = clamp(v, -540, 540)
        },
        [dragSensitivity, rotation]
    )

    const endDrag = React.useCallback(() => {
        draggingRef.current = false
        if (!momentum) {
            stopMomentum()
            return
        }
        // keep velocityRef.current; it will decay in RAF loop
    }, [momentum, stopMomentum])

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggable || isStatic) return
            if (!e.isPrimary) return

            try {
                ;(e.currentTarget as HTMLDivElement).setPointerCapture(
                    e.pointerId
                )
            } catch {
                // ignore
            }

            pointerIdRef.current = e.pointerId
            beginDrag(e.clientX)
        },
        [beginDrag, draggable, isStatic]
    )

    const onPointerMove = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggable || isStatic) return
            if (pointerIdRef.current === null) return
            if (e.pointerId !== pointerIdRef.current) return
            moveDrag(e.clientX)
        },
        [draggable, isStatic, moveDrag]
    )

    const onPointerUpOrCancel = React.useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggable || isStatic) return
            if (pointerIdRef.current === null) return
            if (e.pointerId !== pointerIdRef.current) return
            pointerIdRef.current = null
            endDrag()
        },
        [draggable, endDrag, isStatic]
    )

    const onMouseEnter = React.useCallback(() => {
        hoverRef.current = true
    }, [])
    const onMouseLeave = React.useCallback(() => {
        hoverRef.current = false
    }, [])

    React.useEffect(() => {
        if (!isAnimating) return

        let raf = 0
        let last =
            typeof performance !== "undefined" ? performance.now() : Date.now()

        const loop = () => {
            raf = requestAnimationFrame(loop)
            const now =
                typeof performance !== "undefined"
                    ? performance.now()
                    : Date.now()
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
            last = now

            const pausedByHover = pauseOnHover && hoverRef.current
            if (pausedByHover) return

            let d = 0

            if (autoplay && !draggingRef.current) {
                d += dirSign * speed * dt
            }

            if (momentum && !draggingRef.current) {
                const v = velocityRef.current
                if (Math.abs(v) > 0.001) {
                    d += v * dt
                    const decay = Math.exp(-momentumFriction * dt)
                    velocityRef.current = v * decay
                    if (Math.abs(velocityRef.current) < 0.02)
                        velocityRef.current = 0
                }
            } else if (!momentum) {
                velocityRef.current = 0
            }

            if (d !== 0) rotation.set(rotation.get() + d)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [
        isAnimating,
        autoplay,
        speed,
        dirSign,
        pauseOnHover,
        momentum,
        momentumFriction,
        rotation,
    ])

    const outerStyle: React.CSSProperties = React.useMemo(
        () => ({
            ...props.style,
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background,
            touchAction: draggable ? "pan-y" : "auto",
            userSelect: "none",
        }),
        [props.style, background, draggable]
    )

    const stageStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            perspective: `${perspective}px`,
        }),
        [perspective]
    )

    const ringBaseStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            display: "grid",
            placeItems: "center",
        }),
        []
    )

    const fadeLeftStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: edgeFadeSize,
            pointerEvents: "none",
            background: `linear-gradient(to right, ${edgeFadeColor} 0%, rgba(255,255,255,0) 100%)`,
            mixBlendMode: "normal",
            zIndex: 5,
        }),
        [edgeFadeSize, edgeFadeColor]
    )

    const fadeRightStyle: React.CSSProperties = React.useMemo(
        () => ({
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: edgeFadeSize,
            pointerEvents: "none",
            background: `linear-gradient(to left, ${edgeFadeColor} 0%, rgba(255,255,255,0) 100%)`,
            mixBlendMode: "normal",
            zIndex: 5,
        }),
        [edgeFadeSize, edgeFadeColor]
    )

    return (
        <div
            ref={containerRef}
            style={outerStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            onMouseEnter={pauseOnHover ? onMouseEnter : undefined}
            onMouseLeave={pauseOnHover ? onMouseLeave : undefined}
            role={draggable ? "application" : undefined}
            aria-label="3D media carousel"
        >
            <div style={stageStyle}>
                <motion.div
                    style={{ ...ringBaseStyle, transform: ringTransform }}
                >
                    {safeItems.map((item, i) => {
                        const base = i * step
                        const itemRot = useTransform(rotation, (r) =>
                            wrapAngleDeg(r + base)
                        )
                        const facing = useTransform(itemRot, (deg) => {
                            // 0deg means facing viewer (front). We want signed-ish distance from front.
                            const a = ((deg + 180) % 360) - 180
                            return clamp(1 - Math.abs(a) / 140, 0.25, 1)
                        })

                        const opacity = useTransform(facing, (v) =>
                            clamp(0.2 + v * 0.8, 0.2, 1)
                        )
                        const scale = useTransform(
                            facing,
                            (v) => 0.86 + v * 0.16
                        )

                        const transform = useMotionTemplate`rotateY(${itemRot}deg) translateZ(${radius}px)`

                        const cardShellStyle: React.CSSProperties = {
                            position: "absolute",
                            width: `${cardWidth}px`,
                            height: `${cardHeight}px`,
                            borderRadius: `${cardRadius}px`,
                            overflow: "hidden",
                            boxShadow: shadow,
                            border: cardBorder
                                ? `${borderWidth}px solid ${borderColor}`
                                : "none",
                            background: "#F5F5F5",
                            transformStyle: "preserve-3d",
                            WebkitTapHighlightColor: "transparent",
                        }

                        const mediaStyle: React.CSSProperties = {
                            width: "100%",
                            height: "100%",
                            objectFit: mediaFit,
                            display: "block",
                        }

                        const content = (() => {
                            if (item.type === "video") {
                                if (isStatic) {
                                    const poster = item.poster?.src
                                    if (poster) {
                                        return (
                                            <img
                                                src={poster}
                                                srcSet={item.poster?.srcSet}
                                                alt={item.alt || ""}
                                                style={mediaStyle}
                                            />
                                        )
                                    }
                                    return (
                                        <div
                                            aria-label={item.alt || "Video"}
                                            role="img"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                background:
                                                    "linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.08) 100%)",
                                            }}
                                        />
                                    )
                                }

                                return (
                                    <video
                                        src={item.video}
                                        poster={item.poster?.src}
                                        playsInline
                                        muted={videoMuted}
                                        loop={videoLoop}
                                        autoPlay={videoAutoplay}
                                        controls={videoControls}
                                        preload="metadata"
                                        style={mediaStyle}
                                        aria-label={item.alt || "Video"}
                                    />
                                )
                            }

                            const img = item.image
                            if (img?.src) {
                                return (
                                    <img
                                        src={img.src}
                                        srcSet={img.srcSet}
                                        alt={item.alt || img.alt || ""}
                                        style={mediaStyle}
                                    />
                                )
                            }

                            return (
                                <div
                                    aria-label={item.alt || "Image"}
                                    role="img"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        background:
                                            "linear-gradient(135deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.08) 100%)",
                                    }}
                                />
                            )
                        })()

                        const commonInteractiveStyle: React.CSSProperties = {
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "block",
                            color: "inherit",
                            textDecoration: "none",
                            cursor: item.link
                                ? "pointer"
                                : draggable
                                  ? "grab"
                                  : "default",
                        }

                        return (
                            <motion.div
                                key={`${item.type}-${i}`}
                                style={{
                                    transform,
                                    opacity,
                                    scale,
                                    willChange: "transform",
                                }}
                                aria-hidden={false}
                            >
                                <div style={cardShellStyle}>
                                    {item.link ? (
                                        <a
                                            href={item.link}
                                            style={commonInteractiveStyle}
                                            target={
                                                openLinksInNewTab
                                                    ? "_blank"
                                                    : undefined
                                            }
                                            rel={
                                                openLinksInNewTab
                                                    ? "noreferrer noopener"
                                                    : undefined
                                            }
                                            aria-label={item.alt || "Open link"}
                                            onPointerDown={(e) => {
                                                // allow drag to start even on links
                                                if (!draggable || isStatic)
                                                    return
                                                if (!e.isPrimary) return
                                                pointerIdRef.current =
                                                    e.pointerId
                                                beginDrag(e.clientX)
                                            }}
                                            onPointerMove={(e) => {
                                                if (!draggable || isStatic)
                                                    return
                                                if (
                                                    pointerIdRef.current ===
                                                    null
                                                )
                                                    return
                                                if (
                                                    e.pointerId !==
                                                    pointerIdRef.current
                                                )
                                                    return
                                                moveDrag(e.clientX)
                                            }}
                                            onPointerUp={(e) => {
                                                if (!draggable || isStatic)
                                                    return
                                                if (
                                                    pointerIdRef.current ===
                                                    null
                                                )
                                                    return
                                                if (
                                                    e.pointerId !==
                                                    pointerIdRef.current
                                                )
                                                    return
                                                pointerIdRef.current = null
                                                endDrag()
                                            }}
                                            onPointerCancel={(e) => {
                                                if (!draggable || isStatic)
                                                    return
                                                if (
                                                    pointerIdRef.current ===
                                                    null
                                                )
                                                    return
                                                if (
                                                    e.pointerId !==
                                                    pointerIdRef.current
                                                )
                                                    return
                                                pointerIdRef.current = null
                                                endDrag()
                                            }}
                                        >
                                            {content}
                                        </a>
                                    ) : (
                                        <div
                                            style={commonInteractiveStyle}
                                            aria-label={item.alt || "Media"}
                                        >
                                            {content}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>

            {edgeFade && (
                <>
                    <div style={fadeLeftStyle} aria-hidden />
                    <div style={fadeRightStyle} aria-hidden />
                </>
            )}
        </div>
    )
}

addPropertyControls(CurveCarousel3D, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 24,
        defaultValue: [
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
                    alt: "Gradient 5 - Green",
                },
                alt: "Gradient 5 - Green",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg",
                    alt: "Gradient 4 - Yellow",
                },
                alt: "Gradient 4 - Yellow",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg",
                    alt: "Gradient 3 - Orange",
                },
                alt: "Gradient 3 - Orange",
                link: "",
            },
            {
                type: "video",
                video: "https://framerusercontent.com/assets/MLWPbW1dUQawJLhhun3dBwpgJak.mp4",
                poster: {
                    src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
                    alt: "Gradient 2 - Purple",
                },
                alt: "Sample video",
                link: "",
            },
            {
                type: "image",
                image: {
                    src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
                    alt: "Gradient 1 - Blue",
                },
                alt: "Gradient 1 - Blue",
                link: "",
            },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                type: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (p) => p.type !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov"],
                    hidden: (p) => p.type !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster",
                    hidden: (p) => p.type !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt",
                    defaultValue: "",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                    defaultValue: "",
                },
            },
        },
    },

    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 18,
        min: 0,
        max: 120,
        step: 0.5,
        unit: "deg/s",
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    draggable: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    dragSensitivity: {
        type: ControlType.Number,
        title: "Drag Sens.",
        defaultValue: 0.18,
        min: 0.02,
        max: 1,
        step: 0.01,
    },
    momentum: {
        type: ControlType.Boolean,
        title: "Momentum",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    momentumFriction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 2.4,
        min: 0.2,
        max: 12,
        step: 0.1,
        hidden: (p) => !p.momentum,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 380,
        min: 120,
        max: 1200,
        step: 5,
        unit: "px",
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1100,
        min: 300,
        max: 2600,
        step: 10,
        unit: "px",
    },
    ringTiltX: {
        type: ControlType.Number,
        title: "Tilt X",
        defaultValue: 0,
        min: -35,
        max: 35,
        step: 1,
        unit: "deg",
    },
    ringTiltY: {
        type: ControlType.Number,
        title: "Tilt Y",
        defaultValue: 0,
        min: -35,
        max: 35,
        step: 1,
        unit: "deg",
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card W",
        defaultValue: 260,
        min: 120,
        max: 520,
        step: 1,
        unit: "px",
    },
    aspectRatio: {
        type: ControlType.Number,
        title: "Aspect",
        defaultValue: 1.6,
        min: 0.6,
        max: 3,
        step: 0.01,
    },
    cardRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },

    cardBorder: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "#EEEEEE",
        hidden: (p) => !p.cardBorder,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        defaultValue: 1,
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
        hidden: (p) => !p.cardBorder,
    },

    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 10px 40px rgba(0,0,0,0.14)",
    },

    mediaFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    edgeFade: {
        type: ControlType.Boolean,
        title: "Edge Fade",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    edgeFadeSize: {
        type: ControlType.Number,
        title: "Fade Size",
        defaultValue: 90,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        hidden: (p) => !p.edgeFade,
    },
    edgeFadeColor: {
        type: ControlType.Color,
        title: "Fade Color",
        defaultValue: "#FFFFFF",
        hidden: (p) => !p.edgeFade,
    },

    videoAutoplay: {
        type: ControlType.Boolean,
        title: "Vid Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    videoMuted: {
        type: ControlType.Boolean,
        title: "Vid Muted",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    videoLoop: {
        type: ControlType.Boolean,
        title: "Vid Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    videoControls: {
        type: ControlType.Boolean,
        title: "Vid Controls",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    openLinksInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
