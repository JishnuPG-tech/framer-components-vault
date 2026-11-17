import { useRef, useEffect, useState, useMemo, useCallback } from "react"
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─── DEFAULTS ───────────────────────────────────────────────────
const DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
]

const DEFAULT_CAPTIONS = [
    "Mountains",
    "Valleys",
    "Forest",
    "Waterfall",
    "Meadow",
    "Canopy",
]

// ─── SPRING SETTINGS ────────────────────────────────────────────
const STIFFNESS = 60
const DAMPING = 12
const MASS = 1.5

// ─── SCROLL TRIGGER ─────────────────────────────────────────────
const END_OFFSET_PX = 100

// ─── TEXT FADE SETTINGS ─────────────────────────────────────────
const PEAK_ZONE = 100
const FADE_ZONE = 110
const MAX_BLUR = 4
const MOBILE_BREAKPOINT = 430

// ─── RESPONSIVE BREAKPOINTS ─────────────────────────────────────
function useResponsiveValues() {
    const [values, setValues] = useState(() => calculate())

    function calculate() {
        const w = typeof window !== "undefined" ? window.innerWidth : 1350

        if (w <= MOBILE_BREAKPOINT) {
            const r = 200,
                img = 80
            return {
                galleryHeight: r + img + 60,
                arcRadius: r,
                imageSize: img,
                captionGap: 4,
                isMobile: true,
            }
        } else if (w <= 810) {
            const r = 340,
                img = 120
            return {
                galleryHeight: r + img + 80,
                arcRadius: r,
                imageSize: img,
                captionGap: 6,
                isMobile: false,
            }
        } else {
            const r = 500,
                img = 160
            return {
                galleryHeight: r + img + 100,
                arcRadius: r,
                imageSize: img,
                captionGap: 8,
                isMobile: false,
            }
        }
    }

    useEffect(() => {
        const onResize = () => setValues(calculate())
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    return values
}

// ═══════════════════════════════════════════════════════════════
// CAPTION — purely presentational, no listeners of its own
// ═══════════════════════════════════════════════════════════════
function Caption({
    text,
    captionGap,
    captionColor,
    captionFont,
    opacity,
    blur,
    captionRef,
}: {
    text: string
    captionGap: number
    captionColor: string
    captionFont: any
    opacity: number
    blur: number
    captionRef: (el: HTMLDivElement | null) => void
}) {
    return (
        <div
            ref={captionRef}
            style={{
                marginTop: captionGap,
                textAlign: "center",
                color: captionColor,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
                opacity,
                filter: `blur(${blur}px)`,
                transition: "opacity 0.25s ease-out, filter 0.25s ease-out",
                ...captionFont,
            }}
        >
            {text}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function RotatingGallery(props: any) {
    const {
        image1 = DEFAULT_IMAGES[0],
        image2 = DEFAULT_IMAGES[1],
        image3 = DEFAULT_IMAGES[2],
        image4 = DEFAULT_IMAGES[3],
        image5 = DEFAULT_IMAGES[4],
        image6 = DEFAULT_IMAGES[5],
        imageCount = 6,
        caption1 = DEFAULT_CAPTIONS[0],
        caption2 = DEFAULT_CAPTIONS[1],
        caption3 = DEFAULT_CAPTIONS[2],
        caption4 = DEFAULT_CAPTIONS[3],
        caption5 = DEFAULT_CAPTIONS[4],
        caption6 = DEFAULT_CAPTIONS[5],
        captionColor = "#ffffff",
        captionFont,
        imageRadius = 0,
        backgroundColor = "#f5f5f5",
        style,
    } = props

    // ── Static renderer guard ──
    // Framer calls this in the editor canvas and during export.
    // When true, skip all scroll listeners, motion, and intervals.
    const isStatic = useIsStaticRenderer()

    const containerRef = useRef<HTMLDivElement>(null)
    const wheelRef = useRef<HTMLDivElement>(null)
    const scrollProgress = useMotionValue(0)
    const responsive = useResponsiveValues()

    const smoothProgress = useSpring(scrollProgress, {
        stiffness: STIFFNESS,
        damping: DAMPING,
        mass: MASS,
    })

    const rotate = useTransform(smoothProgress, (v) => v * 180)

    // ── Build ray data ──
    const rays = useMemo(() => {
        const allImages = [image1, image2, image3, image4, image5, image6]
        const allCaptions = [
            caption1,
            caption2,
            caption3,
            caption4,
            caption5,
            caption6,
        ]
        const count = Math.max(4, Math.min(6, imageCount))
        const images = allImages.slice(0, count)
        const captions = allCaptions.slice(0, count)
        const doubled = [...images, ...images]
        const doubledCaptions = [...captions, ...captions]
        const totalRays = doubled.length

        return doubled.map((src, i) => ({
            src,
            caption: doubledCaptions[i],
            angle: (360 / totalRays) * i,
        }))
    }, [
        image1,
        image2,
        image3,
        image4,
        image5,
        image6,
        caption1,
        caption2,
        caption3,
        caption4,
        caption5,
        caption6,
        imageCount,
    ])

    // ── Centralized caption fade state ──
    // One array of { opacity, blur } computed once per frame,
    // driven by a single scroll listener at the gallery level.
    const [captionFades, setCaptionFades] = useState<
        { opacity: number; blur: number }[]
    >(() => rays.map(() => ({ opacity: 0, blur: MAX_BLUR })))

    // Refs for each caption element — collected via callback refs
    const captionRefs = useRef<(HTMLDivElement | null)[]>([])
    const setCaptionRef = useCallback(
        (index: number) => (el: HTMLDivElement | null) => {
            captionRefs.current[index] = el
        },
        []
    )

    // ── Viewport visibility gate ──
    // Pause all scroll/resize work when the component is offscreen.
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isStatic) return

        const container = containerRef.current
        if (!container) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: "100px" }
        )
        observer.observe(container)
        return () => observer.disconnect()
    }, [isStatic])

    // ── Single scroll/resize listener ──
    // Handles both the rotation progress AND all caption fades.
    // Only active when the component is in the viewport.
    useEffect(() => {
        if (isStatic || !isVisible) return

        const container = containerRef.current
        if (!container) return

        const onUpdate = () => {
            // 1. Update scroll progress for rotation
            const rect = container.getBoundingClientRect()
            const vh = window.innerHeight
            const center = rect.top + rect.height / 2
            const totalDistance = vh - END_OFFSET_PX
            const distanceTravelled = vh - center
            const progress = Math.max(
                0,
                Math.min(1, distanceTravelled / totalDistance)
            )
            scrollProgress.set(progress)

            // 2. Compute caption fades using scoped ref (not document.querySelector)
            if (responsive.isMobile) return

            const wheel = wheelRef.current
            if (!wheel) return
            const wheelRect = wheel.getBoundingClientRect()
            const targetCenter =
                wheelRect.width > 0
                    ? wheelRect.left + wheelRect.width / 2
                    : window.innerWidth / 2

            const newFades = captionRefs.current.map((el) => {
                if (!el) return { opacity: 0, blur: MAX_BLUR }

                const cr = el.getBoundingClientRect()
                if (cr.width === 0) return { opacity: 0, blur: MAX_BLUR }

                const textCenter = cr.left + cr.width / 2
                const distance = Math.abs(textCenter - targetCenter)
                const totalZone = PEAK_ZONE + FADE_ZONE

                if (distance <= PEAK_ZONE) {
                    return { opacity: 1, blur: 0 }
                } else if (distance <= totalZone) {
                    const fadeProgress = (distance - PEAK_ZONE) / FADE_ZONE
                    return {
                        opacity: Math.cos((fadeProgress * Math.PI) / 2),
                        blur: fadeProgress * MAX_BLUR,
                    }
                }
                return { opacity: 0, blur: MAX_BLUR }
            })

            setCaptionFades(newFades)
        }

        window.addEventListener("scroll", onUpdate, { passive: true })
        window.addEventListener("resize", onUpdate, { passive: true })
        onUpdate()

        return () => {
            window.removeEventListener("scroll", onUpdate)
            window.removeEventListener("resize", onUpdate)
        }
    }, [isStatic, isVisible, scrollProgress, responsive.isMobile])

    const { galleryHeight, arcRadius, imageSize, captionGap, isMobile } =
        responsive
    const maskPx = arcRadius + imageSize

    // ── Static render: simplified snapshot, no animation ──
    if (isStatic) {
        return (
            <div
                style={{
                    ...style,
                    position: "relative",
                    width: "100%",
                    height: galleryHeight,
                    overflow: "hidden",
                    backgroundColor,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: maskPx,
                        overflow: "hidden",
                        WebkitMaskImage:
                            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
                        maskImage:
                            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: imageSize,
                            marginLeft: -arcRadius,
                            width: arcRadius * 2,
                            height: arcRadius * 2,
                            transformOrigin: "center center",
                        }}
                    >
                        {rays.map((ray, i) => {
                            const rad = ((ray.angle - 90) * Math.PI) / 180
                            const x =
                                arcRadius +
                                Math.cos(rad) * arcRadius -
                                imageSize / 2
                            const y =
                                arcRadius +
                                Math.sin(rad) * arcRadius -
                                imageSize / 2

                            // In static mode, show captions near the top
                            const isNearTop =
                                ray.angle <= 30 || ray.angle >= 330

                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        left: x,
                                        top: y,
                                        width: imageSize,
                                        transform: `rotate(${ray.angle}deg)`,
                                        transformOrigin: "center center",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: imageSize,
                                            height: imageSize,
                                            borderRadius: imageRadius,
                                            overflow: "hidden",
                                            boxShadow:
                                                "0 4px 20px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        <img
                                            src={ray.src}
                                            alt={ray.caption}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                            }}
                                        />
                                    </div>
                                    {!isMobile && (
                                        <div
                                            style={{
                                                marginTop: captionGap,
                                                textAlign: "center",
                                                color: captionColor,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                                whiteSpace: "nowrap",
                                                opacity: isNearTop ? 1 : 0,
                                                ...captionFont,
                                            }}
                                        >
                                            {ray.caption}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }

    // ── Live render: animated with scroll tracking ──
    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: galleryHeight,
                overflow: "hidden",
                backgroundColor,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: maskPx,
                    overflow: "hidden",
                    WebkitMaskImage:
                        "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
                    maskImage:
                        "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
                }}
            >
                <motion.div
                    ref={wheelRef}
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: imageSize,
                        marginLeft: -arcRadius,
                        width: arcRadius * 2,
                        height: arcRadius * 2,
                        rotate,
                        transformOrigin: "center center",
                    }}
                >
                    {rays.map((ray, i) => {
                        const rad = ((ray.angle - 90) * Math.PI) / 180
                        const x =
                            arcRadius +
                            Math.cos(rad) * arcRadius -
                            imageSize / 2
                        const y =
                            arcRadius +
                            Math.sin(rad) * arcRadius -
                            imageSize / 2

                        const fade = captionFades[i] || {
                            opacity: 0,
                            blur: MAX_BLUR,
                        }

                        return (
                            <div
                                key={i}
                                style={{
                                    position: "absolute",
                                    left: x,
                                    top: y,
                                    width: imageSize,
                                    transform: `rotate(${ray.angle}deg)`,
                                    transformOrigin: "center center",
                                }}
                            >
                                <div
                                    style={{
                                        width: imageSize,
                                        height: imageSize,
                                        borderRadius: imageRadius,
                                        overflow: "hidden",
                                        boxShadow:
                                            "0 4px 20px rgba(0,0,0,0.15)",
                                    }}
                                >
                                    <img
                                        src={ray.src}
                                        alt={ray.caption}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            display: "block",
                                        }}
                                    />
                                </div>
                                {!isMobile && (
                                    <Caption
                                        text={ray.caption}
                                        captionGap={captionGap}
                                        captionColor={captionColor}
                                        captionFont={captionFont}
                                        opacity={fade.opacity}
                                        blur={fade.blur}
                                        captionRef={setCaptionRef(i)}
                                    />
                                )}
                            </div>
                        )
                    })}
                </motion.div>
            </div>
        </div>
    )
}

RotatingGallery.displayName = "Rotating Gallery"

// ═══════════════════════════════════════════════════════════════
// PROPERTY CONTROLS
// ═══════════════════════════════════════════════════════════════
addPropertyControls(RotatingGallery, {
    imageCount: {
        type: ControlType.Number,
        title: "Image Count",
        defaultValue: 6,
        min: 4,
        max: 6,
        step: 1,
        description: "Unique images (duplicated to fill the circle)",
    },
    image1: { type: ControlType.Image, title: "Image 1" },
    caption1: {
        type: ControlType.String,
        title: "Caption 1",
        defaultValue: "Mountains",
    },
    image2: { type: ControlType.Image, title: "Image 2" },
    caption2: {
        type: ControlType.String,
        title: "Caption 2",
        defaultValue: "Valleys",
    },
    image3: { type: ControlType.Image, title: "Image 3" },
    caption3: {
        type: ControlType.String,
        title: "Caption 3",
        defaultValue: "Forest",
    },
    image4: { type: ControlType.Image, title: "Image 4" },
    caption4: {
        type: ControlType.String,
        title: "Caption 4",
        defaultValue: "Waterfall",
    },
    image5: {
        type: ControlType.Image,
        title: "Image 5",
        hidden: (props: any) => props.imageCount < 5,
    },
    caption5: {
        type: ControlType.String,
        title: "Caption 5",
        defaultValue: "Meadow",
        hidden: (props: any) => props.imageCount < 5,
    },
    image6: {
        type: ControlType.Image,
        title: "Image 6",
        hidden: (props: any) => props.imageCount < 6,
    },
    caption6: {
        type: ControlType.String,
        title: "Caption 6",
        defaultValue: "Canopy",
        hidden: (props: any) => props.imageCount < 6,
    },
    imageRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        description: "Border radius on image cards (0 = sharp corners)",
    },
    captionColor: {
        type: ControlType.Color,
        title: "Caption Color",
        defaultValue: "#ffffff",
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        controls: "extended",
        displayFontSize: true,
        defaultValue: {
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "1.2em",
        },
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#f5f5f5",
    },
})
