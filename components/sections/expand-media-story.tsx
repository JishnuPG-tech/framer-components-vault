import * as React from "react"
import { createPortal } from "react-dom"
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
    AnimatePresence,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useInView,
    useSpring,
    useReducedMotion,
    useScroll,
    useTransform,
} from "framer-motion"

/**
 * Expand Story Scroll
 * A dynamic, sticky on-scroll editorial story for Framer.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */

type ResponsiveImage = {
    src?: string
    srcSet?: string
    alt?: string
}

type FloatingPosition =
    | "top-left"
    | "top-right"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "custom"

type FloatingBehavior = "static" | "drift" | "orbit" | "magnetic" | "wave"

type FloatingImageItem = {
    image: ResponsiveImage
    position: FloatingPosition
    size: number
    rotation: number
    x: number
    y: number
    behavior?: FloatingBehavior
    behaviorStrength?: number
    behaviorSpeed?: number
    openOnClick?: boolean
}

type FloatingLayout = {
    x: number
    y: number
    width: number
    aspectRatio: number
    rotate: number
    enterX: number
    enterY: number
    driftX: number
    driftY: number
    clearX: number
    clearY: number
    clearRotate: number
}

type StoryPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "center-left"
    | "center"
    | "center-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"

type StoryChapter = {
    eyebrow: string
    title: string
    body: string
    align: "left" | "right" | "center"
    position: StoryPosition
    showBackground: boolean
    backgroundColor: string
    backgroundTextColor: string
    backgroundPadding: number
    backgroundRadius: number
    backgroundShadow: string
    showBackgroundShadow: boolean
    backgroundRotation: number
}

type HeroMediaType = "image" | "video"

type Props = {
    style?: React.CSSProperties
    [key: string]: any
}

const defaultImages: ResponsiveImage[] = [
    {
        src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85",
        alt: "Beauty portrait",
    },
    {
        src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85",
        alt: "Editorial portrait",
    },
    {
        src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85",
        alt: "Botanical flowers",
    },
    {
        src: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85",
        alt: "Minimal architecture",
    },
    {
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
        alt: "Natural skin portrait",
    },
    {
        src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1000&q=85",
        alt: "Skincare products",
    },
]

const defaultDisplayFont: React.CSSProperties = {
    fontFamily: "Playfair Display, Georgia, serif",
    fontSize: "clamp(42px, 5.2vw, 86px)",
    fontWeight: 600,
    lineHeight: 0.9,
    letterSpacing: "-0.04em",
}

const defaultHeadingFont: React.CSSProperties = {
    fontFamily: "Playfair Display, Georgia, serif",
    fontSize: "clamp(40px, 5vw, 78px)",
    fontWeight: 600,
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
}

const defaultBodyFont: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.7,
    letterSpacing: "-0.01em",
}

const defaultEyebrowFont: React.CSSProperties = {
    fontFamily: "Inter, Arial, sans-serif",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "0.22em",
}

const defaultChapters: StoryChapter[] = [
    {
        eyebrow: "Chapter 01 · Awaken",
        title: "Begin with a gentler morning.",
        body: "Fresh botanical extracts meet the skin softly, lifting away the night without disturbing its natural balance.",
        align: "left",
        position: "bottom-left",
        showBackground: true,
        backgroundColor: "#FFFDF7",
        backgroundTextColor: "#201F1B",
        backgroundPadding: 28,
        backgroundRadius: 3,
        backgroundShadow: "0 24px 60px rgba(18,16,12,.24)",
        showBackgroundShadow: true,
        backgroundRotation: -2,
    },
    {
        eyebrow: "Chapter 02 · Restore",
        title: "Moisture returns, layer by layer.",
        body: "Weightless hydration settles in, helping skin feel calm, replenished, and ready to reflect the light.",
        align: "right",
        position: "top-right",
        showBackground: true,
        backgroundColor: "#FFFDF7",
        backgroundTextColor: "#201F1B",
        backgroundPadding: 28,
        backgroundRadius: 3,
        backgroundShadow: "0 24px 60px rgba(18,16,12,.24)",
        showBackgroundShadow: true,
        backgroundRotation: 2,
    },
    {
        eyebrow: "Chapter 03 · Protect",
        title: "Nature becomes your daily shield.",
        body: "Antioxidant-rich care supports the skin through changing seasons, busy days, and everything in between.",
        align: "left",
        position: "bottom-left",
        showBackground: true,
        backgroundColor: "#FFFDF7",
        backgroundTextColor: "#201F1B",
        backgroundPadding: 28,
        backgroundRadius: 3,
        backgroundShadow: "0 24px 60px rgba(18,16,12,.24)",
        showBackgroundShadow: true,
        backgroundRotation: -2,
    },
    {
        eyebrow: "Chapter 04 · Radiate",
        title: "Radiance that still feels like you.",
        body: "No heavy finish. No complicated ritual. Just healthy-looking luminosity inspired by nature.",
        align: "right",
        position: "top-right",
        showBackground: true,
        backgroundColor: "#FFFDF7",
        backgroundTextColor: "#201F1B",
        backgroundPadding: 28,
        backgroundRadius: 3,
        backgroundShadow: "0 24px 60px rgba(18,16,12,.24)",
        showBackgroundShadow: true,
        backgroundRotation: 2,
    },
]

const floatingPositionLayouts: Record<FloatingPosition, FloatingLayout> = {
    "top-left": {
        x: 9,
        y: 8,
        width: 16,
        aspectRatio: 0.82,
        rotate: -6,
        enterX: -90,
        enterY: -70,
        driftX: -14,
        driftY: 12,
        clearX: -82,
        clearY: -54,
        clearRotate: -10,
    },
    "top-right": {
        x: 72,
        y: 12,
        width: 20,
        aspectRatio: 1.5,
        rotate: 5,
        enterX: 100,
        enterY: -60,
        driftX: 16,
        driftY: -10,
        clearX: 86,
        clearY: -52,
        clearRotate: 9,
    },
    "middle-right": {
        x: 82,
        y: 49,
        width: 14,
        aspectRatio: 0.72,
        rotate: 4,
        enterX: 90,
        enterY: 30,
        driftX: -12,
        driftY: 12,
        clearX: 68,
        clearY: 46,
        clearRotate: 8,
    },
    "bottom-left": {
        x: 7,
        y: 65,
        width: 16,
        aspectRatio: 0.8,
        rotate: 5,
        enterX: -100,
        enterY: 80,
        driftX: 14,
        driftY: -10,
        clearX: -76,
        clearY: 48,
        clearRotate: 8,
    },
    "bottom-center": {
        x: 39,
        y: 72,
        width: 15,
        aspectRatio: 0.86,
        rotate: -4,
        enterX: 15,
        enterY: 105,
        driftX: -12,
        driftY: 14,
        clearX: -10,
        clearY: 66,
        clearRotate: -6,
    },
    "bottom-right": {
        x: 62,
        y: 68,
        width: 21,
        aspectRatio: 1.5,
        rotate: -5,
        enterX: 85,
        enterY: 75,
        driftX: 14,
        driftY: 10,
        clearX: 72,
        clearY: 52,
        clearRotate: -8,
    },
    custom: {
        x: 50,
        y: 50,
        width: 16,
        aspectRatio: 0.82,
        rotate: 0,
        enterX: 0,
        enterY: 80,
        driftX: 0,
        driftY: 0,
        clearX: 0,
        clearY: 60,
        clearRotate: 0,
    },
}

const defaultFloatingImages: FloatingImageItem[] = [
    {
        image: defaultImages[0],
        position: "top-left",
        size: 100,
        rotation: -6,
        x: 0,
        y: 0,
        behavior: "drift",
        behaviorStrength: 12,
        behaviorSpeed: 1,
        openOnClick: true,
    },
    {
        image: defaultImages[1],
        position: "top-right",
        size: 100,
        rotation: 5,
        x: 0,
        y: 0,
        behavior: "orbit",
        behaviorStrength: 10,
        behaviorSpeed: 0.85,
        openOnClick: true,
    },
    {
        image: defaultImages[2],
        position: "middle-right",
        size: 100,
        rotation: 4,
        x: 0,
        y: 0,
        behavior: "wave",
        behaviorStrength: 9,
        behaviorSpeed: 1.15,
        openOnClick: true,
    },
    {
        image: defaultImages[3],
        position: "bottom-left",
        size: 100,
        rotation: 5,
        x: 0,
        y: 0,
        behavior: "drift",
        behaviorStrength: 11,
        behaviorSpeed: 0.9,
        openOnClick: true,
    },
    {
        image: defaultImages[4],
        position: "bottom-center",
        size: 100,
        rotation: -4,
        x: 0,
        y: 0,
        behavior: "magnetic",
        behaviorStrength: 8,
        behaviorSpeed: 1,
        openOnClick: true,
    },
    {
        image: defaultImages[5],
        position: "bottom-right",
        size: 100,
        rotation: -5,
        x: 0,
        y: 0,
        behavior: "orbit",
        behaviorStrength: 10,
        behaviorSpeed: 1.05,
        openOnClick: true,
    },
]

function imageProps(image?: ResponsiveImage) {
    return {
        src: image?.src || "",
        srcSet: image?.srcSet,
        alt: image?.alt || "",
    }
}

function FloatingCard({
    image,
    layout,
    progress,
    reduced,
    cardRadius,
    showCardShadow,
    cardShadow,
    imagePosition,
    isCanvas,
    customX,
    customY,
    enableHoverParallax,
    hoverParallaxStrength,
    disableHoverEffects,
    maskStyle,
    behavior,
    behaviorStrength,
    behaviorSpeed,
    openOnClick,
    startVisible,
    viewportEntered,
    cardIndex,
    onOpen,
}: {
    image: ResponsiveImage
    layout: FloatingLayout
    progress: any
    reduced: boolean | null
    cardRadius: number
    showCardShadow: boolean
    cardShadow: string
    imagePosition: string
    isCanvas: boolean
    customX: number
    customY: number
    enableHoverParallax: boolean
    hoverParallaxStrength: number
    disableHoverEffects: boolean
    maskStyle: React.CSSProperties
    behavior: FloatingBehavior
    behaviorStrength: number
    behaviorSpeed: number
    openOnClick: boolean
    startVisible: boolean
    viewportEntered: boolean
    cardIndex: number
    onOpen?: (origin: DOMRect) => void
}) {
    const times = [0, 0.075, 0.17, 0.255, 0.34, 0.42]

    const x = useTransform(
        progress,
        times,
        reduced
            ? [0, 0, 0, 0, 0, 0]
            : startVisible
              ? [
                    0,
                    0,
                    layout.driftX,
                    layout.driftX,
                    layout.clearX,
                    layout.clearX,
                ]
              : [
                    layout.enterX,
                    0,
                    layout.driftX,
                    layout.driftX,
                    layout.clearX,
                    layout.clearX,
                ]
    )

    const y = useTransform(
        progress,
        times,
        reduced
            ? [0, 0, 0, 0, 0, 0]
            : startVisible
              ? [
                    0,
                    0,
                    layout.driftY,
                    layout.driftY,
                    layout.clearY,
                    layout.clearY,
                ]
              : [
                    layout.enterY,
                    0,
                    layout.driftY,
                    layout.driftY,
                    layout.clearY,
                    layout.clearY,
                ]
    )

    const rotate = useTransform(
        progress,
        times,
        reduced
            ? [
                  layout.rotate,
                  layout.rotate,
                  layout.rotate,
                  layout.rotate,
                  layout.rotate,
                  layout.rotate,
              ]
            : startVisible
              ? [
                    layout.rotate,
                    layout.rotate,
                    layout.rotate * 1.25,
                    layout.rotate * 1.25,
                    layout.clearRotate,
                    layout.clearRotate,
                ]
              : [
                    layout.rotate * 2.4,
                    layout.rotate,
                    layout.rotate * 1.25,
                    layout.rotate * 1.25,
                    layout.clearRotate,
                    layout.clearRotate,
                ]
    )

    const scale = useTransform(
        progress,
        times,
        reduced
            ? [1, 1, 1, 1, 1, 1]
            : startVisible
              ? [1, 1, 1.04, 1.04, 0.92, 0.82]
              : [0.72, 1, 1.04, 1.04, 0.92, 0.82]
    )

    const opacity = useTransform(
        progress,
        [0, 0.055, 0.3, 0.37, 0.43],
        reduced
            ? [1, 1, 1, 1, 1]
            : startVisible
              ? [1, 1, 1, 0.35, 0]
              : [0, 1, 1, 0.35, 0]
    )

    const imageScale = useTransform(
        progress,
        [0, 0.09, 0.25, 0.42],
        reduced ? [1.06, 1.06, 1.06, 1.06] : [1.12, 1.06, 1.08, 1.04]
    )

    // A distinct, staggered viewport entrance used only in Start Visible mode.
    // Scroll-linked transforms remain active and are composed with this reveal.
    const revealTarget = useMotionValue(!startVisible || reduced ? 1 : 0)
    const reveal = useSpring(revealTarget, {
        stiffness: 105,
        damping: 18,
        mass: 0.9,
    })

    React.useEffect(() => {
        if (!startVisible || reduced) {
            revealTarget.set(1)
            return
        }

        if (!viewportEntered) {
            revealTarget.set(0)
            return
        }

        // Delay each card so the entrance is visible even when mounted
        // inside the viewport on the first frame.
        const timer = window.setTimeout(
            () => revealTarget.set(1),
            120 + cardIndex * 95
        )

        return () => window.clearTimeout(timer)
    }, [startVisible, reduced, viewportEntered, cardIndex, revealTarget])

    const revealedOpacity = useTransform(
        [opacity, reveal],
        ([scrollOpacity, revealAmount]) =>
            Number(scrollOpacity) * (startVisible ? Number(revealAmount) : 1)
    )
    const revealedScale = useTransform(
        [scale, reveal],
        ([scrollScale, revealAmount]) =>
            Number(scrollScale) *
            (startVisible ? 0.78 + Number(revealAmount) * 0.22 : 1)
    )
    const revealOffsetX = useTransform(
        reveal,
        [0, 1],
        [layout.enterX * 0.32, 0]
    )
    const revealOffsetY = useTransform(
        reveal,
        [0, 1],
        [layout.enterY * 0.32 + 24, 0]
    )

    const animatedX = useTransform(
        [x, revealOffsetX],
        ([scrollX, entranceX]) =>
            Number(scrollX) + customX + (startVisible ? Number(entranceX) : 0)
    )
    const animatedY = useTransform(
        [y, revealOffsetY],
        ([scrollY, entranceY]) =>
            Number(scrollY) + customY + (startVisible ? Number(entranceY) : 0)
    )

    const hoverX = useMotionValue(0)
    const hoverY = useMotionValue(0)
    const hoverRotateX = useMotionValue(0)
    const hoverRotateY = useMotionValue(0)
    const hoverScale = useMotionValue(1)

    const springConfig = { stiffness: 220, damping: 24, mass: 0.7 }
    const parallaxX = useSpring(hoverX, springConfig)
    const parallaxY = useSpring(hoverY, springConfig)
    const parallaxRotateX = useSpring(hoverRotateX, springConfig)
    const parallaxRotateY = useSpring(hoverRotateY, springConfig)
    const parallaxScale = useSpring(hoverScale, springConfig)

    const hoverEnabled =
        (enableHoverParallax || behavior === "magnetic") &&
        !disableHoverEffects &&
        !reduced
    const isClickable = openOnClick && !disableHoverEffects && Boolean(onOpen)

    const resetHover = () => {
        hoverX.set(0)
        hoverY.set(0)
        hoverRotateX.set(0)
        hoverRotateY.set(0)
        hoverScale.set(1)
    }

    const handlePointerEnter = () => {
        if (!hoverEnabled) return
        hoverScale.set(1.035)
    }

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!hoverEnabled) return

        const rect = event.currentTarget.getBoundingClientRect()
        const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
        const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
        const strength = Math.max(0, hoverParallaxStrength ?? 14)

        hoverX.set(normalizedX * strength)
        hoverY.set(normalizedY * strength)
        hoverRotateX.set(normalizedY * -strength * 0.35)
        hoverRotateY.set(normalizedX * strength * 0.35)
    }

    const behaviorAmount = Math.max(0, behaviorStrength ?? 12)
    const behaviorDuration = Math.max(
        1.5,
        10 / Math.max(0.25, behaviorSpeed ?? 1)
    )
    const behaviorAnimation =
        disableHoverEffects ||
        reduced ||
        behavior === "static" ||
        behavior === "magnetic"
            ? undefined
            : behavior === "orbit"
              ? {
                    x: [0, behaviorAmount, 0, -behaviorAmount, 0],
                    y: [
                        -behaviorAmount * 0.45,
                        0,
                        behaviorAmount * 0.45,
                        0,
                        -behaviorAmount * 0.45,
                    ],
                    rotateZ: [0, 1.5, 0, -1.5, 0],
                }
              : behavior === "wave"
                ? {
                      y: [0, -behaviorAmount, 0, behaviorAmount, 0],
                      rotateZ: [0, -2, 0, 2, 0],
                  }
                : {
                      x: [0, behaviorAmount * 0.7, -behaviorAmount * 0.45, 0],
                      y: [0, -behaviorAmount * 0.6, behaviorAmount * 0.5, 0],
                  }

    return (
        <motion.div
            style={{
                position: "absolute",
                left: `${layout.x}%`,
                top: `${layout.y}%`,
                width: `${layout.width}%`,
                aspectRatio: layout.aspectRatio,
                overflow: "visible",
                x: isCanvas && !startVisible ? customX : animatedX,
                y: isCanvas && !startVisible ? customY : animatedY,
                rotate: isCanvas ? layout.rotate : rotate,
                scale: isCanvas && !startVisible ? 1 : revealedScale,
                opacity: isCanvas && !startVisible ? 1 : revealedOpacity,
                transformOrigin: "50% 50%",
                backfaceVisibility: "hidden",
                willChange: "transform, opacity",
                pointerEvents: hoverEnabled || isClickable ? "auto" : "none",
                cursor: isClickable
                    ? "zoom-in"
                    : hoverEnabled
                      ? "default"
                      : "inherit",
                perspective: 900,
                zIndex: 1,
            }}
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerLeave={resetHover}
            onPointerCancel={resetHover}
            onClick={
                isClickable
                    ? (event) =>
                          onOpen?.(event.currentTarget.getBoundingClientRect())
                    : undefined
            }
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : undefined}
            aria-label={
                isClickable ? `Open ${image.alt || "image"}` : undefined
            }
            onKeyDown={(event) => {
                if (
                    isClickable &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault()
                    onOpen?.(event.currentTarget.getBoundingClientRect())
                }
            }}
        >
            <motion.div
                animate={behaviorAnimation}
                transition={
                    behaviorAnimation
                        ? {
                              duration: behaviorDuration,
                              repeat: Infinity,
                              ease: "easeInOut",
                          }
                        : undefined
                }
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    ...maskStyle,
                    boxShadow: showCardShadow ? cardShadow : "none",
                    x: parallaxX,
                    y: parallaxY,
                    rotateX: parallaxRotateX,
                    rotateY: parallaxRotateY,
                    scale: parallaxScale,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    transformOrigin: "50% 50%",
                }}
            >
                <motion.img
                    {...imageProps(image)}
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: imagePosition,
                        display: "block",
                        scale: imageScale,
                        pointerEvents: "none",
                        userSelect: "none",
                        WebkitUserDrag: "none",
                        WebkitUserSelect: "none",
                    }}
                />
            </motion.div>
        </motion.div>
    )
}

function rangeForChapter(
    index: number,
    total: number,
    intro: number,
    fadeAmount: number,
    readTime: number,
    crossfadeAmount: number
) {
    const available = Math.max(0.05, 1 - intro)
    const segment = available / Math.max(1, total)

    const crossfade = Math.min(
        segment * 0.22,
        Math.max(0, crossfadeAmount) * segment
    )

    const start = intro + index * segment - (index > 0 ? crossfade : 0)

    const end =
        intro + (index + 1) * segment + (index < total - 1 ? crossfade : 0)

    const duration = Math.max(0.001, end - start)

    const fade = Math.min(
        duration * 0.22,
        Math.max(0.01, fadeAmount) * duration
    )

    const preferredRead = Math.max(0.5, Math.min(0.9, readTime)) * duration
    const holdStart = Math.min(end - fade, start + fade)

    const holdEnd = Math.max(
        holdStart,
        Math.min(end - fade, holdStart + preferredRead)
    )

    return {
        opacity: [start, holdStart, holdEnd, end],
        y: [start, holdStart, holdEnd, end],
    }
}

function adaptiveOverlayGradient(
    position: StoryPosition,
    darkness: number,
    radius: number,
    feather: number
) {
    const alpha = Math.max(0, Math.min(1, darkness))
    const inner = Math.max(8, Math.min(65, radius))
    const outer = Math.max(inner + 10, Math.min(100, inner + feather))
    const strong = `rgba(0,0,0,${alpha})`
    const medium = `rgba(0,0,0,${alpha * 0.68})`
    const clear = "rgba(0,0,0,0)"

    switch (position) {
        case "top-left":
            return `radial-gradient(circle at 18% 18%, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "top-center":
            return `linear-gradient(180deg, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "top-right":
            return `radial-gradient(circle at 82% 18%, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "center-left":
            return `linear-gradient(90deg, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "center":
            return `radial-gradient(circle at 50% 50%, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "center-right":
            return `linear-gradient(270deg, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "bottom-left":
            return `radial-gradient(circle at 18% 82%, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "bottom-center":
            return `linear-gradient(0deg, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`

        case "bottom-right":
        default:
            return `radial-gradient(circle at 82% 82%, ${strong} 0%, ${medium} ${inner}%, ${clear} ${outer}%)`
    }
}

function AdaptiveStoryOverlay({
    chapter,
    index,
    total,
    progress,
    introDuration,
    chapterOverlap,
    storyReadTime,
    storyCrossfade,
    darkness,
    radius,
    feather,
    isCanvas,
}: {
    chapter: StoryChapter
    index: number
    total: number
    progress: any
    introDuration: number
    chapterOverlap: number
    storyReadTime: number
    storyCrossfade: number
    darkness: number
    radius: number
    feather: number
    isCanvas: boolean
}) {
    const reduced = useReducedMotion()

    const ranges = rangeForChapter(
        index,
        total,
        introDuration,
        chapterOverlap,
        storyReadTime,
        storyCrossfade
    )

    const opacity = useTransform(
        progress,
        ranges.opacity,
        isCanvas
            ? index === 0
                ? [1, 1, 1, 1]
                : [0, 0, 0, 0]
            : reduced
              ? [1, 1, 1, 1]
              : [0, 1, 1, 0]
    )

    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                opacity,
                background: adaptiveOverlayGradient(
                    chapter.position || "bottom-left",
                    darkness,
                    radius,
                    feather
                ),
                pointerEvents: "none",
            }}
        />
    )
}

function Chapter({
    chapter,
    index,
    total,
    progress,
    introDuration,
    chapterOverlap,
    storyReadTime,
    storyCrossfade,
    storyMotion,
    contentWidth,
    contentInset,
    verticalPosition,
    headingFont,
    bodyFont,
    eyebrowFont,
    headingColor,
    bodyColor,
    eyebrowColor,
    showTextShadow,
    textShadow,
}: {
    chapter: StoryChapter
    index: number
    total: number
    progress: any
    introDuration: number
    chapterOverlap: number
    storyReadTime: number
    storyCrossfade: number
    storyMotion: number
    contentWidth: number
    contentInset: number
    verticalPosition: Props["verticalPosition"]
    headingFont: React.CSSProperties
    bodyFont: React.CSSProperties
    eyebrowFont: React.CSSProperties
    headingColor: string
    bodyColor: string
    eyebrowColor: string
    showTextShadow: boolean
    textShadow: string
}) {
    const reduced = useReducedMotion()

    const ranges = rangeForChapter(
        index,
        total,
        introDuration,
        chapterOverlap,
        storyReadTime,
        storyCrossfade
    )

    const motionAmount = Math.max(0, Math.min(40, storyMotion ?? 10))

    const opacity = useTransform(
        progress,
        ranges.opacity,
        reduced ? [1, 1, 1, 1] : [0, 1, 1, 0]
    )

    const y = useTransform(
        progress,
        ranges.y,
        reduced ? [0, 0, 0, 0] : [motionAmount, 0, 0, -motionAmount * 0.65]
    )

    const position =
        chapter.position ||
        (verticalPosition === "top"
            ? chapter.align === "right"
                ? "top-right"
                : chapter.align === "center"
                  ? "top-center"
                  : "top-left"
            : verticalPosition === "center"
              ? chapter.align === "right"
                  ? "center-right"
                  : chapter.align === "center"
                    ? "center"
                    : "center-left"
              : chapter.align === "right"
                ? "bottom-right"
                : chapter.align === "center"
                  ? "bottom-center"
                  : "bottom-left")

    const [verticalKey, horizontalKey] =
        position === "center"
            ? ["center", "center"]
            : (position.split("-") as [
                  "top" | "center" | "bottom",
                  "left" | "center" | "right",
              ])

    const horizontal: React.CSSProperties =
        horizontalKey === "right"
            ? { right: contentInset }
            : horizontalKey === "center"
              ? {
                    left: 0,
                    right: 0,
                    marginLeft: "auto",
                    marginRight: "auto",
                }
              : { left: contentInset }

    const vertical: React.CSSProperties =
        verticalKey === "top"
            ? { top: "12%" }
            : verticalKey === "center"
              ? {
                    top: 0,
                    bottom: 0,
                    marginTop: "auto",
                    marginBottom: "auto",
                    height: "fit-content",
                }
              : { bottom: "11%" }

    const hasBackground = chapter.showBackground !== false
    const textAlign = chapter.align || "left"

    const chapterAlignItems =
        textAlign === "right"
            ? "flex-end"
            : textAlign === "center"
              ? "center"
              : "flex-start"

    const storyContentStyle: React.CSSProperties = hasBackground
        ? {
              position: "relative",
              width: "fit-content",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: chapterAlignItems,
              textAlign,
              padding: `${chapter.backgroundPadding ?? 28}px`,
              paddingBottom: `${(chapter.backgroundPadding ?? 28) + 14}px`,
              color: chapter.backgroundTextColor || "#201F1B",
              background: chapter.backgroundColor || "#FFFDF7",
              border: "1px solid rgba(33,29,22,.10)",
              borderRadius: chapter.backgroundRadius ?? 3,
              boxShadow:
                  chapter.showBackgroundShadow !== false
                      ? chapter.backgroundShadow ||
                        "0 24px 60px rgba(18,16,12,.24)"
                      : "none",
              transform: `rotate(${chapter.backgroundRotation ?? 0}deg)`,
              transformOrigin: "center",
              textShadow: "none",
              overflow: "hidden",
          }
        : {
              width: "fit-content",
              maxWidth: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: chapterAlignItems,
          }

    return (
        <motion.article
            style={{
                position: "absolute",
                width: `min(${contentWidth}px, calc(100% - ${
                    contentInset * 2
                }px))`,
                display: "flex",
                flexDirection: "column",
                opacity,
                y,
                textShadow:
                    hasBackground || !showTextShadow ? "none" : textShadow,
                pointerEvents: "none",
                zIndex: 20,
                ...horizontal,
                ...vertical,
            }}
        >
            <div style={storyContentStyle}>
                <p
                    style={{
                        position: "relative",
                        margin: "0 0 10px",
                        textTransform: "uppercase",
                        ...eyebrowFont,
                        color: hasBackground
                            ? chapter.backgroundTextColor || "#201F1B"
                            : eyebrowColor,
                    }}
                >
                    {chapter.eyebrow}
                </p>

                <h3
                    style={{
                        position: "relative",
                        margin: 0,
                        maxWidth: "12ch",
                        ...headingFont,
                        color: hasBackground
                            ? chapter.backgroundTextColor || "#201F1B"
                            : headingColor,
                    }}
                >
                    {chapter.title}
                </h3>

                <p
                    style={{
                        position: "relative",
                        margin: "18px 0 0",
                        maxWidth: "44ch",
                        opacity: 0.84,
                        ...bodyFont,
                        color: hasBackground
                            ? chapter.backgroundTextColor || "#201F1B"
                            : bodyColor,
                    }}
                >
                    {chapter.body}
                </p>
            </div>
        </motion.article>
    )
}

export default function ExpandMediaStory(props: Props) {
    const { style } = props

    // Grouped controls with legacy top-level fallbacks for existing instances.
    const content = (props as any).content || {}
    const media = (props as any).media || {}
    const collage = (props as any).collage || {}
    const story = (props as any).story || {}
    const appearance = (props as any).appearance || {}
    const overlay = (props as any).overlay || {}
    const shadows = (props as any).shadows || {}
    const typography = (props as any).typography || {}
    const premium = (props as any).premium || {}

    const brandFirst = content.brandFirst ?? (props as any).brandFirst
    const brandSecond = content.brandSecond ?? (props as any).brandSecond
    const chapters = content.chapters ?? (props as any).chapters
    const heroMediaType = media.heroMediaType ?? (props as any).heroMediaType
    const heroImage = media.heroImage ?? (props as any).heroImage
    const heroVideo = media.heroVideo ?? (props as any).heroVideo
    const heroVideoPoster =
        media.heroVideoPoster ?? (props as any).heroVideoPoster
    const heroVideoAutoplay =
        media.heroVideoAutoplay ?? (props as any).heroVideoAutoplay
    const heroVideoLoop = media.heroVideoLoop ?? (props as any).heroVideoLoop
    const heroVideoMuted = media.heroVideoMuted ?? (props as any).heroVideoMuted
    const heroVideoScrollScrub =
        media.heroVideoScrollScrub ?? (props as any).heroVideoScrollScrub
    const heroVideoScrubStart =
        media.heroVideoScrubStart ?? (props as any).heroVideoScrubStart
    const heroVideoScrubEnd =
        media.heroVideoScrubEnd ?? (props as any).heroVideoScrubEnd
    const heroVideoScrubSmoothness =
        media.heroVideoScrubSmoothness ??
        (props as any).heroVideoScrubSmoothness
    const heroVideoScrubFps =
        media.heroVideoScrubFps ?? (props as any).heroVideoScrubFps
    const showCollage = collage.showCollage ?? (props as any).showCollage
    const showFloatingOnCanvas =
        collage.showFloatingOnCanvas ?? (props as any).showFloatingOnCanvas
    const startCollageAndTextVisible =
        collage.startCollageAndTextVisible ??
        (props as any).startCollageAndTextVisible ??
        false
    const floatingImages =
        collage.floatingImages ?? (props as any).floatingImages
    const enableHoverParallax =
        collage.enableHoverParallax ??
        (props as any).enableHoverParallax ??
        true
    const hoverParallaxStrength =
        collage.hoverParallaxStrength ??
        (props as any).hoverParallaxStrength ??
        14
    const enableImageLightbox = collage.enableImageLightbox ?? true
    const scrollLength = story.scrollLength ?? (props as any).scrollLength
    const introDuration = story.introDuration ?? (props as any).introDuration
    const chapterOverlap = story.chapterOverlap ?? (props as any).chapterOverlap
    const storyReadTime = story.storyReadTime ?? (props as any).storyReadTime
    const storyCrossfade = story.storyCrossfade ?? (props as any).storyCrossfade
    const storyMotion = story.storyMotion ?? (props as any).storyMotion
    const contentWidth = story.contentWidth ?? (props as any).contentWidth
    const contentInset = story.contentInset ?? (props as any).contentInset
    const verticalPosition =
        story.verticalPosition ?? (props as any).verticalPosition
    const stageColor = appearance.stageColor ?? (props as any).stageColor
    const textColor = appearance.textColor ?? (props as any).textColor
    const heroTextColor =
        appearance.heroTextColor ?? (props as any).heroTextColor
    const cardRadius = appearance.cardRadius ?? (props as any).cardRadius
    const imagePosition =
        appearance.imagePosition ?? (props as any).imagePosition
    const showMediaOverlay =
        overlay.showMediaOverlay ?? (props as any).showMediaOverlay
    const mediaOverlayStyle =
        overlay.mediaOverlayStyle ?? (props as any).mediaOverlayStyle
    const overlayColor = overlay.overlayColor ?? (props as any).overlayColor
    const overlaySecondaryColor =
        overlay.overlaySecondaryColor ?? (props as any).overlaySecondaryColor
    const overlayDirection =
        overlay.overlayDirection ?? (props as any).overlayDirection
    const overlayOpacity =
        overlay.overlayOpacity ?? (props as any).overlayOpacity
    const adaptiveOverlayDarkness =
        overlay.adaptiveOverlayDarkness ??
        (props as any).adaptiveOverlayDarkness
    const adaptiveOverlayRadius =
        overlay.adaptiveOverlayRadius ?? (props as any).adaptiveOverlayRadius
    const adaptiveOverlayFeather =
        overlay.adaptiveOverlayFeather ?? (props as any).adaptiveOverlayFeather
    const showCardShadow =
        shadows.showCardShadow ?? (props as any).showCardShadow
    const cardShadow = shadows.cardShadow ?? (props as any).cardShadow
    const showHeroShadow =
        shadows.showHeroShadow ?? (props as any).showHeroShadow
    const heroShadow = shadows.heroShadow ?? (props as any).heroShadow
    const showTextShadow =
        shadows.showTextShadow ?? (props as any).showTextShadow
    const textShadow = shadows.textShadow ?? (props as any).textShadow
    const displayFont = typography.displayFont ?? (props as any).displayFont
    const headingFont = typography.headingFont ?? (props as any).headingFont
    const bodyFont = typography.bodyFont ?? (props as any).bodyFont
    const eyebrowFont = typography.eyebrowFont ?? (props as any).eyebrowFont
    const displayColor =
        typography.displayColor ?? (props as any).displayColor ?? heroTextColor
    const headingColor =
        typography.headingColor ?? (props as any).headingColor ?? textColor
    const bodyColor =
        typography.bodyColor ?? (props as any).bodyColor ?? textColor
    const eyebrowColor =
        typography.eyebrowColor ?? (props as any).eyebrowColor ?? textColor
    const imageMask = premium.imageMask ?? "rounded"
    const showPager = premium.showPager ?? premium.showChapterDots ?? true
    const showScrollHint = premium.showScrollHint ?? true
    const scrollHintText = premium.scrollHintText ?? "Scroll to explore"
    const scrollHintFont = premium.scrollHintFont ?? {
        fontFamily: "Inter, Arial, sans-serif",
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: "0.16em",
    }
    const scrollHintTextColor = premium.scrollHintTextColor ?? textColor
    const scrollHintArrow = premium.scrollHintArrow ?? "↓"
    const scrollHintArrowColor =
        premium.scrollHintArrowColor ?? scrollHintTextColor
    const scrollHintArrowSize = premium.scrollHintArrowSize ?? 16
    const scrollHintBottom = premium.scrollHintBottom ?? 26
    const scrollHintGap = premium.scrollHintGap ?? 7
    const scrollHintOpacityAmount = Math.max(
        0,
        Math.min(1, premium.scrollHintOpacity ?? 0.86)
    )
    const scrollHintUppercase = premium.scrollHintUppercase ?? true
    const scrollHintAnimate = premium.scrollHintAnimate ?? true
    const scrollHintAnimationDistance = premium.scrollHintAnimationDistance ?? 5
    const scrollHintAnimationDuration =
        premium.scrollHintAnimationDuration ?? 1.6

    const rootRef = React.useRef<HTMLDivElement>(null)
    const heroMediaRef = React.useRef<HTMLDivElement>(null)
    const heroVideoRef = React.useRef<HTMLVideoElement>(null)
    const heroVideoDurationRef = React.useRef(0)
    const scrubTargetRef = React.useRef(0)
    const scrubCurrentRef = React.useRef(0)
    const scrubRafRef = React.useRef<number | null>(null)
    const [activeChapterIndex, setActiveChapterIndex] = React.useState(0)
    const [isExpandedMediaFull, setIsExpandedMediaFull] = React.useState(false)
    const [isPageVisible, setIsPageVisible] = React.useState(() =>
        typeof document === "undefined"
            ? true
            : document.visibilityState === "visible"
    )
    const [selectedFloatingItem, setSelectedFloatingItem] =
        React.useState<FloatingImageItem | null>(null)
    const [lightboxOrigin, setLightboxOrigin] = React.useState<DOMRect | null>(
        null
    )
    const [lightboxZoom, setLightboxZoom] = React.useState(1)
    const lightboxX = useMotionValue(0)
    const lightboxY = useMotionValue(0)

    const getLightboxOriginTransform = React.useCallback(() => {
        if (!lightboxOrigin || typeof window === "undefined") {
            return {
                x: 0,
                y: 14,
                scaleX: 0.985,
                scaleY: 0.985,
                borderRadius: 22,
            }
        }

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const targetWidth = Math.min(viewportWidth * 0.94, 1280)
        const targetHeight = Math.min(viewportHeight * 0.88, 900)
        const originCenterX = lightboxOrigin.left + lightboxOrigin.width / 2
        const originCenterY = lightboxOrigin.top + lightboxOrigin.height / 2

        return {
            x: originCenterX - viewportWidth / 2,
            y: originCenterY - viewportHeight / 2,
            scaleX: Math.max(0.02, lightboxOrigin.width / targetWidth),
            scaleY: Math.max(0.02, lightboxOrigin.height / targetHeight),
            borderRadius: cardRadius,
        }
    }, [lightboxOrigin, cardRadius])

    const reduced = useReducedMotion()
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStaticRenderer = useIsStaticRenderer()
    const disableAnimations = isCanvas || isStaticRenderer
    const isInViewport = useInView(rootRef, {
        once: true,
        amount: 0.08,
        margin: "0px 0px -8% 0px",
    })
    const isHeroMediaVisible = useInView(heroMediaRef, {
        amount: 0.05,
        margin: "0px",
    })

    const maskStyle: React.CSSProperties =
        imageMask === "circle"
            ? { borderRadius: "50%" }
            : imageMask === "arch"
              ? { borderRadius: "50% 50% 10% 10% / 35% 35% 10% 10%" }
              : imageMask === "diamond"
                ? { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }
                : imageMask === "organic"
                  ? { borderRadius: "42% 58% 63% 37% / 45% 38% 62% 55%" }
                  : imageMask === "square"
                    ? { borderRadius: 0 }
                    : { borderRadius: cardRadius }

    React.useEffect(() => {
        lightboxX.set(0)
        lightboxY.set(0)
        setLightboxZoom(1)
    }, [selectedFloatingItem, lightboxX, lightboxY])

    React.useEffect(() => {
        if (typeof document === "undefined") return

        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === "visible")
        }

        handleVisibilityChange()
        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )
        }
    }, [])

    React.useLayoutEffect(() => {
        if (!selectedFloatingItem || isCanvas || isStaticRenderer) return

        const html = document.documentElement
        const body = document.body
        const scrollbarWidth = window.innerWidth - html.clientWidth

        const previousHtmlOverflow = html.style.overflow
        const previousHtmlOverscroll = html.style.overscrollBehavior
        const previousBodyOverflow = body.style.overflow
        const previousBodyPaddingRight = body.style.paddingRight
        const previousBodyOverscroll = body.style.overscrollBehavior

        html.style.overflow = "hidden"
        html.style.overscrollBehavior = "none"
        body.style.overflow = "hidden"
        body.style.overscrollBehavior = "none"

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSelectedFloatingItem(null)
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            html.style.overflow = previousHtmlOverflow
            html.style.overscrollBehavior = previousHtmlOverscroll
            body.style.overflow = previousBodyOverflow
            body.style.paddingRight = previousBodyPaddingRight
            body.style.overscrollBehavior = previousBodyOverscroll
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [selectedFloatingItem, isCanvas, isStaticRenderer])

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: ["start start", "end end"],
    })

    const safeIntroDuration = Math.min(0.9, Math.max(0.62, introDuration))

    /**
     * Normal title animation when the collage is enabled.
     */
    const titleOpacity = useTransform(
        scrollYProgress,
        [0, 0.055, 0.29, 0.36, 0.43],
        reduced ? [1, 1, 1, 1, 1] : [0, 1, 1, 0.4, 0]
    )

    /**
     * When the collage is disabled, begin fully visible.
     * The title still fades out when the hero expands.
     */
    const titleOpacityInitiallyVisible = useTransform(
        scrollYProgress,
        [0, 0.29, 0.36, 0.43],
        reduced ? [1, 1, 1, 1] : [1, 1, 0.4, 0]
    )

    const titleOpacityWithoutCollage = useTransform(
        scrollYProgress,
        [0, 0.29, 0.36, 0.43],
        reduced ? [1, 1, 1, 1] : [1, 1, 0.4, 0]
    )

    const titleY = useTransform(
        scrollYProgress,
        [0, 0.075],
        reduced || startCollageAndTextVisible ? [0, 0] : [20, 0]
    )

    const titleScale = useTransform(scrollYProgress, [0.29, 0.43], [1, 0.94])

    const firstX = useTransform(scrollYProgress, [0.17, 0.31], [0, -230])

    const secondX = useTransform(scrollYProgress, [0.17, 0.31], [0, 230])

    const heroOpacity = useTransform(
        scrollYProgress,
        [0.17, 0.25, 1],
        reduced ? [1, 1, 1] : [0, 1, 1]
    )

    const heroWidth = useTransform(
        scrollYProgress,
        [0.17, 0.3, 0.42, 0.53],
        ["28%", "28%", "72%", "100%"]
    )

    const heroHeight = useTransform(
        scrollYProgress,
        [0.17, 0.42, 0.53],
        ["56%", "56%", "100%"]
    )

    const heroRadius = useTransform(
        scrollYProgress,
        [0.17, 0.42, 0.53],
        [18, 22, 0]
    )

    const heroScale = useTransform(
        scrollYProgress,
        [0.17, 0.25],
        reduced ? [1, 1] : [0.72, 1]
    )

    const heroImageScale = useTransform(
        scrollYProgress,
        [0.17, 0.25, 0.42, 0.53, 0.64],
        reduced ? [1.06, 1.06, 1.06, 1.06, 1.06] : [1.08, 1.04, 1.1, 1.06, 1.06]
    )

    const heroImageY = useTransform(scrollYProgress, [0.3, 0.53], [0, -6])

    const stageBackground = useTransform(
        scrollYProgress,
        [0.47, 0.56],
        [stageColor, "#A9C0CC"]
    )

    const scrollHintOpacity = useTransform(
        scrollYProgress,
        [0, 0.08],
        [scrollHintOpacityAmount, 0]
    )

    const storyStart = safeIntroDuration

    const safeChapters = chapters?.length ? chapters : defaultChapters

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        const expandedMediaFull = latest >= 0.53
        setIsExpandedMediaFull((current) =>
            current === expandedMediaFull ? current : expandedMediaFull
        )

        if (safeChapters.length <= 1) {
            if (activeChapterIndex !== 0) setActiveChapterIndex(0)
            return
        }

        const chapterProgress = Math.max(
            0,
            Math.min(
                0.999999,
                (latest - safeIntroDuration) /
                    Math.max(0.001, 1 - safeIntroDuration)
            )
        )
        const nextIndex = Math.min(
            safeChapters.length - 1,
            Math.floor(chapterProgress * safeChapters.length)
        )

        setActiveChapterIndex((current) =>
            current === nextIndex ? current : nextIndex
        )
    })

    const scrollToChapter = React.useCallback(
        (index: number) => {
            const root = rootRef.current
            if (!root || typeof window === "undefined") return

            const boundedIndex = Math.max(
                0,
                Math.min(safeChapters.length - 1, index)
            )
            const chapterCenter =
                safeIntroDuration +
                ((boundedIndex + 0.5) / Math.max(1, safeChapters.length)) *
                    (1 - safeIntroDuration)
            const rect = root.getBoundingClientRect()
            const rootTop = window.scrollY + rect.top
            const scrollableDistance = Math.max(
                0,
                root.offsetHeight - window.innerHeight
            )

            window.scrollTo({
                top: rootTop + chapterCenter * scrollableDistance,
                behavior: reduced ? "auto" : "smooth",
            })
        },
        [safeChapters.length, safeIntroDuration, reduced]
    )

    const safeFloatingImages = floatingImages?.length
        ? floatingImages
        : defaultFloatingImages

    const resolvedHeroMediaType: HeroMediaType = heroMediaType || "image"

    const resolvedOverlayBackground =
        mediaOverlayStyle === "gradient"
            ? `linear-gradient(${
                  overlayDirection ?? 90
              }deg, ${overlayColor}, ${overlaySecondaryColor})`
            : overlayColor

    const scrubStart = Math.max(0, Math.min(0.98, heroVideoScrubStart ?? 0.17))

    const scrubEnd = Math.max(
        scrubStart + 0.01,
        Math.min(1, heroVideoScrubEnd ?? 1)
    )

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (
            disableAnimations ||
            resolvedHeroMediaType !== "video" ||
            !heroVideoScrollScrub
        ) {
            return
        }

        const video = heroVideoRef.current

        const duration = heroVideoDurationRef.current || video?.duration || 0

        if (!video || !Number.isFinite(duration) || duration <= 0) {
            return
        }

        const normalized = Math.max(
            0,
            Math.min(1, (latest - scrubStart) / (scrubEnd - scrubStart))
        )

        scrubTargetRef.current = normalized * duration
    })

    React.useEffect(() => {
        const shouldRunScrubLoop =
            !disableAnimations &&
            resolvedHeroMediaType === "video" &&
            Boolean(heroVideoScrollScrub) &&
            isHeroMediaVisible &&
            isPageVisible

        const stopScrubLoop = () => {
            if (scrubRafRef.current !== null) {
                cancelAnimationFrame(scrubRafRef.current)
                scrubRafRef.current = null
            }
        }

        if (!shouldRunScrubLoop) {
            stopScrubLoop()
            return
        }

        const smoothness = Math.max(
            0.02,
            Math.min(1, heroVideoScrubSmoothness ?? 0.12)
        )
        const fps = Math.max(15, Math.min(60, heroVideoScrubFps ?? 60))
        const frameInterval = 1000 / fps
        let previousTimestamp = 0
        let cancelled = false

        const update = (timestamp: number) => {
            if (cancelled) return

            const video = heroVideoRef.current
            const duration =
                heroVideoDurationRef.current || video?.duration || 0

            if (video && Number.isFinite(duration) && duration > 0) {
                if (!video.paused) video.pause()

                if (timestamp - previousTimestamp >= frameInterval) {
                    previousTimestamp = timestamp

                    const target = scrubTargetRef.current
                    const current = scrubCurrentRef.current
                    const next = current + (target - current) * smoothness

                    scrubCurrentRef.current =
                        Math.abs(target - next) < 0.001 ? target : next

                    if (
                        Math.abs(video.currentTime - scrubCurrentRef.current) >
                            0.02 &&
                        !video.seeking
                    ) {
                        try {
                            video.currentTime = Math.max(
                                0,
                                Math.min(duration, scrubCurrentRef.current)
                            )
                        } catch {}
                    }
                }
            }

            scrubRafRef.current = requestAnimationFrame(update)
        }

        scrubRafRef.current = requestAnimationFrame(update)

        return () => {
            cancelled = true
            stopScrubLoop()
        }
    }, [
        disableAnimations,
        resolvedHeroMediaType,
        heroVideoScrollScrub,
        heroVideoScrubSmoothness,
        heroVideoScrubFps,
        isHeroMediaVisible,
        isPageVisible,
    ])

    const resolvedDisplayFont: React.CSSProperties = {
        ...defaultDisplayFont,
        ...(displayFont || {}),
    }

    const resolvedHeadingFont: React.CSSProperties = {
        ...defaultHeadingFont,
        ...(headingFont || {}),
    }

    const resolvedBodyFont: React.CSSProperties = {
        ...defaultBodyFont,
        ...(bodyFont || {}),
    }

    const resolvedEyebrowFont: React.CSSProperties = {
        ...defaultEyebrowFont,
        ...(eyebrowFont || {}),
    }

    // Canvas and export/static rendering must not render the animated tree.
    // Use a deterministic image-based preview with no autoplay, looping,
    // scroll-linked motion, hover effects, or infinite animations.
    if (disableAnimations) {
        const staticImage =
            resolvedHeroMediaType === "image"
                ? heroImage
                : heroVideoPoster?.src
                  ? heroVideoPoster
                  : heroImage

        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    minHeight: 600,
                    overflow: "hidden",
                    isolation: "isolate",
                    background: stageColor,
                    color: heroTextColor,
                    ...style,
                }}
            >
                <img
                    {...imageProps(staticImage)}
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: imagePosition,
                        display: "block",
                        userSelect: "none",
                    }}
                />

                {showMediaOverlay && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                mediaOverlayStyle === "adaptive"
                                    ? adaptiveOverlayGradient(
                                          safeChapters[0]?.position ||
                                              "bottom-left",
                                          adaptiveOverlayDarkness,
                                          adaptiveOverlayRadius,
                                          adaptiveOverlayFeather
                                      )
                                    : resolvedOverlayBackground,
                            opacity:
                                mediaOverlayStyle === "adaptive"
                                    ? 1
                                    : overlayOpacity,
                            pointerEvents: "none",
                        }}
                    />
                )}

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "min(90%, 1100px)",
                        textAlign: "center",
                        zIndex: 2,
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            ...resolvedDisplayFont,
                            color: displayColor,
                        }}
                    >
                        {brandFirst} {brandSecond}
                    </h2>
                </div>
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: isCanvas ? "100%" : `${scrollLength}vh`,
                minHeight: isCanvas ? 720 : undefined,
                color: textColor,
                ...style,
            }}
        >
            <motion.div
                style={{
                    position: isCanvas ? "relative" : "sticky",
                    top: 0,
                    width: "100%",
                    height: isCanvas ? "100%" : "100vh",
                    minHeight: 600,
                    overflow: "hidden",
                    isolation: "isolate",
                    background: isCanvas ? stageColor : stageBackground,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(circle at 50% 46%, rgba(255,255,255,.14), transparent 36%)",
                        pointerEvents: "none",
                    }}
                />

                {showCollage && (!isCanvas || showFloatingOnCanvas) && (
                    <motion.div
                        style={{
                            position: "absolute",
                            zIndex: isCanvas ? 30 : 5,
                            left: "50%",
                            top: "50%",
                            width: "min(88vw, 1180px)",
                            height: "min(78vh, 760px)",
                            x: "-50%",
                            y: "-50%",
                            transformStyle: "preserve-3d",
                            pointerEvents: "none",
                        }}
                    >
                        {safeFloatingImages.map((item, index) => {
                            const fallback =
                                defaultFloatingImages[
                                    index % defaultFloatingImages.length
                                ]
                            const position = item?.position || fallback.position

                            const isCustom = position === "custom"

                            const preset = isCustom
                                ? {
                                      ...floatingPositionLayouts["top-left"],
                                      x: 50,
                                      y: 50,
                                  }
                                : floatingPositionLayouts[position]

                            const size = Math.max(
                                40,
                                Math.min(
                                    300,
                                    item?.size ?? fallback.size ?? 100
                                )
                            )

                            const rotation =
                                item?.rotation ??
                                fallback.rotation ??
                                preset.rotate
                            const behavior: FloatingBehavior =
                                item?.behavior || "drift"

                            const coordinateX = isCustom ? (item?.x ?? 0) : 0

                            const coordinateY = isCustom ? (item?.y ?? 0) : 0

                            const layout: FloatingLayout = {
                                ...preset,
                                width: preset.width * (size / 100),
                                rotate: rotation,
                                clearRotate:
                                    rotation +
                                    (preset.clearRotate - preset.rotate),
                            }

                            return (
                                <FloatingCard
                                    key={`${item?.image?.src}-${position}-${size}-${rotation}-${index}`}
                                    image={
                                        item?.image ||
                                        defaultImages[
                                            index % defaultImages.length
                                        ]
                                    }
                                    layout={layout}
                                    progress={scrollYProgress}
                                    reduced={reduced}
                                    cardRadius={cardRadius}
                                    showCardShadow={showCardShadow}
                                    cardShadow={cardShadow}
                                    imagePosition={imagePosition}
                                    isCanvas={isCanvas}
                                    customX={coordinateX}
                                    customY={coordinateY}
                                    enableHoverParallax={enableHoverParallax}
                                    hoverParallaxStrength={
                                        hoverParallaxStrength
                                    }
                                    disableHoverEffects={
                                        isCanvas || isStaticRenderer
                                    }
                                    maskStyle={maskStyle}
                                    behavior={behavior}
                                    behaviorStrength={
                                        item?.behaviorStrength ?? 12
                                    }
                                    behaviorSpeed={item?.behaviorSpeed ?? 1}
                                    openOnClick={
                                        enableImageLightbox &&
                                        item?.openOnClick !== false
                                    }
                                    startVisible={startCollageAndTextVisible}
                                    viewportEntered={isCanvas || isInViewport}
                                    cardIndex={index}
                                    onOpen={(origin) => {
                                        setLightboxOrigin(origin)
                                        setSelectedFloatingItem({
                                            ...item,
                                            image:
                                                item?.image ||
                                                defaultImages[
                                                    index % defaultImages.length
                                                ],
                                        })
                                    }}
                                />
                            )
                        })}
                    </motion.div>
                )}

                <motion.h2
                    style={{
                        position: "absolute",
                        zIndex: 8,
                        left: "50%",
                        top: "50%",
                        x: "-50%",
                        y: isCanvas ? "-50%" : titleY,
                        translateY: "-50%",
                        scale: isCanvas ? 1 : titleScale,
                        margin: 0,
                        whiteSpace: "nowrap",
                        opacity: isCanvas
                            ? 1
                            : startCollageAndTextVisible
                              ? titleOpacityInitiallyVisible
                              : showCollage
                                ? titleOpacity
                                : titleOpacityWithoutCollage,
                        textAlign: "center",
                        ...resolvedDisplayFont,
                        color: displayColor,
                    }}
                >
                    <motion.span
                        style={{
                            display: "inline-block",
                            x: firstX,
                        }}
                    >
                        {brandFirst}
                    </motion.span>{" "}
                    <motion.span
                        style={{
                            display: "inline-block",
                            x: secondX,
                        }}
                    >
                        {brandSecond}
                    </motion.span>
                </motion.h2>

                {(!isCanvas || !showFloatingOnCanvas) && (
                    <motion.div
                        ref={heroMediaRef}
                        style={{
                            position: "absolute",
                            zIndex: 15,
                            inset: 0,
                            margin: "auto",
                            width: isCanvas ? "100%" : heroWidth,
                            height: isCanvas ? "100%" : heroHeight,
                            maxWidth: "100%",
                            opacity: isCanvas ? 1 : heroOpacity,
                            scale: isCanvas ? 1 : heroScale,
                            borderRadius: isCanvas ? 0 : heroRadius,
                            overflow: "hidden",
                            boxShadow: showHeroShadow ? heroShadow : "none",
                            color: heroTextColor,
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 0,
                                scale: isCanvas ? 1.06 : heroImageScale,
                                y: isCanvas ? 0 : heroImageY,
                                transformOrigin: "50% 50%",
                                backfaceVisibility: "hidden",
                                willChange: "transform",
                                overflow: "hidden",
                            }}
                        >
                            {resolvedHeroMediaType === "video" && heroVideo ? (
                                <video
                                    ref={heroVideoRef}
                                    src={heroVideo}
                                    poster={
                                        heroVideoPoster?.src || heroImage?.src
                                    }
                                    autoPlay={
                                        heroVideoAutoplay &&
                                        !heroVideoScrollScrub &&
                                        !disableAnimations
                                    }
                                    loop={
                                        heroVideoLoop && !heroVideoScrollScrub
                                    }
                                    muted={
                                        heroVideoMuted ||
                                        heroVideoAutoplay ||
                                        heroVideoScrollScrub
                                    }
                                    controls={
                                        !heroVideoAutoplay &&
                                        !heroVideoScrollScrub
                                    }
                                    playsInline
                                    preload={
                                        heroVideoScrollScrub
                                            ? "auto"
                                            : "metadata"
                                    }
                                    onLoadedMetadata={(event) => {
                                        heroVideoDurationRef.current =
                                            event.currentTarget.duration || 0

                                        if (heroVideoScrollScrub) {
                                            event.currentTarget.pause()
                                            scrubTargetRef.current = 0
                                            scrubCurrentRef.current = 0

                                            try {
                                                event.currentTarget.currentTime = 0
                                            } catch {}
                                        }
                                    }}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: imagePosition,
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <motion.img
                                    {...imageProps(heroImage)}
                                    draggable={false}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        objectPosition: imagePosition,
                                        display: "block",
                                    }}
                                />
                            )}
                        </motion.div>

                        {showMediaOverlay &&
                            mediaOverlayStyle !== "adaptive" && (
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        zIndex: 10,
                                        background: resolvedOverlayBackground,
                                        opacity: overlayOpacity,
                                        pointerEvents: "none",
                                    }}
                                />
                            )}

                        {showMediaOverlay &&
                            mediaOverlayStyle === "adaptive" &&
                            safeChapters.map((chapter, index) => (
                                <AdaptiveStoryOverlay
                                    key={`adaptive-overlay-${chapter.title}-${index}`}
                                    chapter={chapter}
                                    index={index}
                                    total={safeChapters.length}
                                    progress={scrollYProgress}
                                    introDuration={storyStart}
                                    chapterOverlap={chapterOverlap}
                                    storyReadTime={storyReadTime}
                                    storyCrossfade={storyCrossfade}
                                    darkness={adaptiveOverlayDarkness}
                                    radius={adaptiveOverlayRadius}
                                    feather={adaptiveOverlayFeather}
                                    isCanvas={isCanvas}
                                />
                            ))}

                        {!isCanvas &&
                            safeChapters.map((chapter, index) => (
                                <Chapter
                                    key={`${chapter.title}-${index}`}
                                    chapter={chapter}
                                    index={index}
                                    total={safeChapters.length}
                                    progress={scrollYProgress}
                                    introDuration={storyStart}
                                    chapterOverlap={chapterOverlap}
                                    storyReadTime={storyReadTime}
                                    storyCrossfade={storyCrossfade}
                                    storyMotion={storyMotion}
                                    contentWidth={contentWidth}
                                    contentInset={contentInset}
                                    verticalPosition={verticalPosition}
                                    headingFont={resolvedHeadingFont}
                                    bodyFont={resolvedBodyFont}
                                    eyebrowFont={resolvedEyebrowFont}
                                    headingColor={headingColor}
                                    bodyColor={bodyColor}
                                    eyebrowColor={eyebrowColor}
                                    showTextShadow={showTextShadow}
                                    textShadow={textShadow}
                                />
                            ))}
                    </motion.div>
                )}

                {showPager &&
                    !isCanvas &&
                    isExpandedMediaFull &&
                    safeChapters.length > 1 && (
                        <nav
                            aria-label="Story chapters"
                            style={{
                                position: "absolute",
                                right: 22,
                                top: "50%",
                                transform: "translateY(-50%)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 9,
                                zIndex: 65,
                                pointerEvents: "auto",
                            }}
                        >
                            {safeChapters.map((chapter, index) => {
                                const isActive = index === activeChapterIndex

                                return (
                                    <button
                                        key={`chapter-dot-${index}`}
                                        type="button"
                                        title={chapter.title}
                                        aria-label={`Go to chapter ${index + 1}: ${chapter.title}`}
                                        aria-current={
                                            isActive ? "step" : undefined
                                        }
                                        onClick={() => scrollToChapter(index)}
                                        style={{
                                            width: 18,
                                            height: 18,
                                            padding: 0,
                                            border: 0,
                                            background: "transparent",
                                            display: "grid",
                                            placeItems: "center",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <motion.span
                                            animate={
                                                disableAnimations
                                                    ? undefined
                                                    : {
                                                          scale: isActive
                                                              ? 1.45
                                                              : 1,
                                                          opacity: isActive
                                                              ? 1
                                                              : 0.42,
                                                      }
                                            }
                                            transition={{
                                                duration: 0.22,
                                                ease: "easeOut",
                                            }}
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: "#FFFFFF",
                                                opacity: isActive ? 1 : 0.42,
                                                transform: isActive
                                                    ? "scale(1.45)"
                                                    : "scale(1)",
                                                boxShadow: isActive
                                                    ? "0 0 0 4px rgba(255,255,255,.22)"
                                                    : "0 0 0 1px rgba(0,0,0,.12)",
                                                display: "block",
                                            }}
                                        />
                                    </button>
                                )
                            })}
                        </nav>
                    )}

                {showScrollHint && !isCanvas && (
                    <motion.div
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: scrollHintBottom,
                            x: "-50%",
                            zIndex: 55,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: scrollHintGap,
                            color: scrollHintTextColor,
                            opacity: scrollHintOpacity,
                            pointerEvents: "none",
                            textTransform: scrollHintUppercase
                                ? "uppercase"
                                : "none",
                            ...scrollHintFont,
                        }}
                    >
                        <span>{scrollHintText}</span>
                        <motion.span
                            animate={
                                scrollHintAnimate && !disableAnimations
                                    ? {
                                          y: [
                                              0,
                                              scrollHintAnimationDistance,
                                              0,
                                          ],
                                      }
                                    : undefined
                            }
                            transition={
                                scrollHintAnimate && !disableAnimations
                                    ? {
                                          duration: Math.max(
                                              0.2,
                                              scrollHintAnimationDuration
                                          ),
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                      }
                                    : undefined
                            }
                            style={{
                                fontSize: scrollHintArrowSize,
                                color: scrollHintArrowColor,
                                lineHeight: 1,
                            }}
                        >
                            {scrollHintArrow}
                        </motion.span>
                    </motion.div>
                )}
            </motion.div>

            {typeof document !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {enableImageLightbox &&
                            selectedFloatingItem &&
                            !isCanvas &&
                            !isStaticRenderer && (
                                <motion.div
                                    key="floating-image-lightbox"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: reduced ? 0 : 0.24,
                                        ease: "easeOut",
                                    }}
                                    onMouseDown={(event) => {
                                        if (
                                            event.target === event.currentTarget
                                        ) {
                                            setSelectedFloatingItem(null)
                                        }
                                    }}
                                    onWheel={(event) => event.preventDefault()}
                                    onTouchMove={(event) =>
                                        event.preventDefault()
                                    }
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label={
                                        selectedFloatingItem.image?.alt ||
                                        "Image preview"
                                    }
                                    style={{
                                        position: "fixed",
                                        inset: 0,
                                        width: "100vw",
                                        height: "100dvh",
                                        zIndex: 2147483647,
                                        display: "grid",
                                        placeItems: "center",
                                        padding: "clamp(16px, 3vw, 40px)",
                                        overflow: "hidden",
                                        overscrollBehavior: "none",
                                        touchAction: "none",
                                        background: "rgba(8, 8, 10, .86)",
                                        backdropFilter: "blur(18px)",
                                        WebkitBackdropFilter: "blur(18px)",
                                    }}
                                >
                                    <motion.div
                                        initial={
                                            reduced
                                                ? { opacity: 0 }
                                                : {
                                                      opacity: 0.72,
                                                      ...getLightboxOriginTransform(),
                                                  }
                                        }
                                        animate={{
                                            opacity: 1,
                                            x: 0,
                                            y: 0,
                                            scaleX: 1,
                                            scaleY: 1,
                                            borderRadius: 22,
                                        }}
                                        exit={
                                            reduced
                                                ? { opacity: 0 }
                                                : {
                                                      opacity: 0,
                                                      ...getLightboxOriginTransform(),
                                                  }
                                        }
                                        transition={{
                                            duration: reduced ? 0 : 0.5,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                        style={{
                                            position: "relative",
                                            width: "min(94vw, 1280px)",
                                            height: "min(88dvh, 900px)",
                                            display: "grid",
                                            placeItems: "center",
                                            overflow: "hidden",
                                            borderRadius: 22,
                                            background: "rgba(15,15,17,.96)",
                                            boxShadow:
                                                "0 40px 120px rgba(0,0,0,.5)",
                                            transformOrigin: "50% 50%",
                                            willChange: "transform, opacity",
                                        }}
                                    >
                                        <motion.img
                                            {...imageProps(
                                                selectedFloatingItem.image
                                            )}
                                            draggable={false}
                                            drag={lightboxZoom > 1}
                                            dragMomentum={false}
                                            dragElastic={0.08}
                                            onDoubleClick={() => {
                                                if (lightboxZoom > 1) {
                                                    setLightboxZoom(1)
                                                    lightboxX.set(0)
                                                    lightboxY.set(0)
                                                } else {
                                                    setLightboxZoom(2)
                                                }
                                            }}
                                            onWheel={(event) => {
                                                event.preventDefault()
                                                event.stopPropagation()
                                                const nextZoom = Math.max(
                                                    1,
                                                    Math.min(
                                                        4,
                                                        lightboxZoom -
                                                            event.deltaY * 0.002
                                                    )
                                                )
                                                setLightboxZoom(nextZoom)
                                                if (nextZoom === 1) {
                                                    lightboxX.set(0)
                                                    lightboxY.set(0)
                                                }
                                            }}
                                            initial={
                                                reduced
                                                    ? { opacity: 0 }
                                                    : {
                                                          opacity: 0,
                                                          scale: 1.015,
                                                      }
                                            }
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{
                                                duration: reduced ? 0 : 0.42,
                                                ease: [0.22, 1, 0.36, 1],
                                            }}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                objectPosition: imagePosition,
                                                display: "block",
                                                userSelect: "none",
                                                WebkitUserDrag: "none",
                                                x: lightboxX,
                                                y: lightboxY,
                                                scale: lightboxZoom,
                                                cursor:
                                                    lightboxZoom > 1
                                                        ? "grab"
                                                        : "zoom-in",
                                                touchAction: "none",
                                                willChange: "transform",
                                            }}
                                            whileDrag={{ cursor: "grabbing" }}
                                        />

                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 16,
                                                bottom: 16,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                zIndex: 3,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                aria-label="Zoom out"
                                                onClick={() => {
                                                    const nextZoom = Math.max(
                                                        1,
                                                        lightboxZoom - 0.5
                                                    )
                                                    setLightboxZoom(nextZoom)
                                                    if (nextZoom === 1) {
                                                        lightboxX.set(0)
                                                        lightboxY.set(0)
                                                    }
                                                }}
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    border: "1px solid rgba(255,255,255,.18)",
                                                    background:
                                                        "rgba(10,10,12,.56)",
                                                    color: "white",
                                                    fontSize: 22,
                                                    cursor: "pointer",
                                                    backdropFilter:
                                                        "blur(12px)",
                                                }}
                                            >
                                                −
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Reset zoom"
                                                onClick={() => {
                                                    setLightboxZoom(1)
                                                    lightboxX.set(0)
                                                    lightboxY.set(0)
                                                }}
                                                style={{
                                                    minWidth: 58,
                                                    height: 40,
                                                    padding: "0 12px",
                                                    borderRadius: 999,
                                                    border: "1px solid rgba(255,255,255,.18)",
                                                    background:
                                                        "rgba(10,10,12,.56)",
                                                    color: "white",
                                                    fontSize: 12,
                                                    cursor: "pointer",
                                                    backdropFilter:
                                                        "blur(12px)",
                                                }}
                                            >
                                                {Math.round(lightboxZoom * 100)}
                                                %
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Zoom in"
                                                onClick={() =>
                                                    setLightboxZoom((value) =>
                                                        Math.min(4, value + 0.5)
                                                    )
                                                }
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    border: "1px solid rgba(255,255,255,.18)",
                                                    background:
                                                        "rgba(10,10,12,.56)",
                                                    color: "white",
                                                    fontSize: 22,
                                                    cursor: "pointer",
                                                    backdropFilter:
                                                        "blur(12px)",
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            aria-label="Close image preview"
                                            onClick={() =>
                                                setSelectedFloatingItem(null)
                                            }
                                            style={{
                                                position: "absolute",
                                                top: 16,
                                                right: 16,
                                                width: 42,
                                                height: 42,
                                                display: "grid",
                                                placeItems: "center",
                                                border: "1px solid rgba(255,255,255,.18)",
                                                borderRadius: "50%",
                                                background:
                                                    "rgba(15,15,17,.62)",
                                                color: "#FFFFFF",
                                                fontSize: 24,
                                                lineHeight: 1,
                                                cursor: "pointer",
                                                boxShadow:
                                                    "0 8px 30px rgba(0,0,0,.28)",
                                                backdropFilter: "blur(12px)",
                                                WebkitBackdropFilter:
                                                    "blur(12px)",
                                            }}
                                        >
                                            ×
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    )
}

ExpandMediaStory.defaultProps = {
    content: {
        brandFirst: "Aurora",
        brandSecond: "Beauty",
        chapters: defaultChapters,
    },
    media: {
        heroMediaType: "image",
        heroImage: {
            src: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=90",
            alt: "Radiant skincare story",
        },
        heroVideo: "",
        heroVideoPoster: {
            src: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1800&q=90",
            alt: "Video poster",
        },
        heroVideoAutoplay: true,
        heroVideoLoop: true,
        heroVideoMuted: true,
        heroVideoScrollScrub: false,
        heroVideoScrubStart: 0.17,
        heroVideoScrubEnd: 1,
        heroVideoScrubSmoothness: 0.12,
        heroVideoScrubFps: 60,
    },
    collage: {
        showCollage: true,
        startCollageAndTextVisible: false,
        showFloatingOnCanvas: true,
        enableHoverParallax: true,
        hoverParallaxStrength: 14,
        enableImageLightbox: true,
        floatingImages: defaultFloatingImages,
    },
    story: {
        scrollLength: 1100,
        introDuration: 0.64,
        chapterOverlap: 0.12,
        storyReadTime: 0.75,
        storyCrossfade: 0.1,
        storyMotion: 10,
        contentWidth: 540,
        contentInset: 64,
        verticalPosition: "bottom",
    },
    appearance: {
        stageColor: "#F7F6F3",
        textColor: "#1F211D",
        heroTextColor: "#FFFDF8",
        cardRadius: 10,
        imagePosition: "center center",
    },
    overlay: {
        showMediaOverlay: true,
        mediaOverlayStyle: "adaptive",
        overlayColor: "#000000",
        overlaySecondaryColor: "rgba(0,0,0,0.08)",
        overlayDirection: 90,
        overlayOpacity: 0.28,
        adaptiveOverlayDarkness: 0.68,
        adaptiveOverlayRadius: 28,
        adaptiveOverlayFeather: 52,
    },
    shadows: {
        showCardShadow: true,
        cardShadow: "0 22px 55px rgba(25,22,15,.18)",
        showHeroShadow: true,
        heroShadow: "0 35px 90px rgba(20,18,14,.16)",
        showTextShadow: true,
        textShadow: "0 2px 28px rgba(0,0,0,.3)",
    },
    premium: {
        imageMask: "rounded",
        showPager: true,
        showScrollHint: true,
        scrollHintText: "Scroll to explore",
        scrollHintFont: {
            fontFamily: "Inter, Arial, sans-serif",
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "0.16em",
        },
        scrollHintTextColor: "#FFFFFF",
        scrollHintArrow: "↓",
        scrollHintArrowColor: "#FFFFFF",
        scrollHintArrowSize: 16,
        scrollHintBottom: 26,
        scrollHintGap: 7,
        scrollHintOpacity: 0.86,
        scrollHintUppercase: true,
        scrollHintAnimate: true,
        scrollHintAnimationDistance: 5,
        scrollHintAnimationDuration: 1.6,
    },
    typography: {
        displayFont: defaultDisplayFont,
        headingFont: defaultHeadingFont,
        bodyFont: defaultBodyFont,
        eyebrowFont: defaultEyebrowFont,
        displayColor: "#FFFFFF",
        headingColor: "#201F1B",
        bodyColor: "#201F1B",
        eyebrowColor: "#6B6B6B",
    },
}

addPropertyControls(ExpandMediaStory, {
    content: {
        type: ControlType.Object,
        title: "Content",
        controls: {
            brandFirst: {
                type: ControlType.String,
                title: "Brand 1",
                defaultValue: "Aurora",
            },
            brandSecond: {
                type: ControlType.String,
                title: "Brand 2",
                defaultValue: "Beauty",
            },
            chapters: {
                type: ControlType.Array,
                title: "Chapters",
                maxCount: 10,
                control: {
                    type: ControlType.Object,
                    controls: {
                        eyebrow: {
                            type: ControlType.String,
                            title: "Eyebrow",
                            defaultValue: "Chapter 01",
                        },
                        title: {
                            type: ControlType.String,
                            title: "Title",
                            defaultValue: "Your story title",
                            displayTextArea: true,
                        },
                        body: {
                            type: ControlType.String,
                            title: "Body",
                            defaultValue: "Add the chapter description.",
                            displayTextArea: true,
                        },
                        align: {
                            type: ControlType.Enum,
                            title: "Text Align",
                            options: ["left", "center", "right"],
                            optionTitles: ["Left", "Center", "Right"],
                            displaySegmentedControl: true,
                            defaultValue: "left",
                        },
                        position: {
                            type: ControlType.Enum,
                            title: "Position",
                            options: [
                                "top-left",
                                "top-center",
                                "top-right",
                                "center-left",
                                "center",
                                "center-right",
                                "bottom-left",
                                "bottom-center",
                                "bottom-right",
                            ],
                            optionTitles: [
                                "Top Left",
                                "Top Center",
                                "Top Right",
                                "Center Left",
                                "Center",
                                "Center Right",
                                "Bottom Left",
                                "Bottom Center",
                                "Bottom Right",
                            ],
                            defaultValue: "bottom-left",
                        },
                        showBackground: {
                            type: ControlType.Boolean,
                            title: "Background",
                            enabledTitle: "Show",
                            disabledTitle: "Hide",
                            defaultValue: true,
                        },
                        backgroundColor: {
                            type: ControlType.Color,
                            title: "Background Color",
                            defaultValue: "#FFFDF7",
                            hidden: (item) => !item.showBackground,
                        },
                        backgroundTextColor: {
                            type: ControlType.Color,
                            title: "Text Color",
                            defaultValue: "#201F1B",
                            hidden: (item) => !item.showBackground,
                        },
                        backgroundPadding: {
                            type: ControlType.Number,
                            title: "Padding",
                            min: 12,
                            max: 72,
                            step: 2,
                            unit: "px",
                            defaultValue: 28,
                            hidden: (item) => !item.showBackground,
                        },
                        backgroundRadius: {
                            type: ControlType.Number,
                            title: "Radius",
                            min: 0,
                            max: 32,
                            step: 1,
                            unit: "px",
                            defaultValue: 3,
                            hidden: (item) => !item.showBackground,
                        },
                        backgroundRotation: {
                            type: ControlType.Number,
                            title: "Rotation",
                            min: -10,
                            max: 10,
                            step: 0.5,
                            unit: "°",
                            defaultValue: 0,
                            hidden: (item) => !item.showBackground,
                        },
                        showBackgroundShadow: {
                            type: ControlType.Boolean,
                            title: "Shadow",
                            defaultValue: true,
                            hidden: (item) => !item.showBackground,
                        },
                        backgroundShadow: {
                            type: ControlType.String,
                            title: "Shadow Style",
                            defaultValue: "0 24px 60px rgba(18,16,12,.24)",
                            hidden: (item) =>
                                !item.showBackground ||
                                item.showBackgroundShadow === false,
                        },
                    },
                },
                defaultValue: defaultChapters,
            },
        },
    },
    media: {
        type: ControlType.Object,
        title: "Hero Media",
        controls: {
            heroMediaType: {
                type: ControlType.Enum,
                title: "Expanded Media",
                options: ["image", "video"],
                optionTitles: ["Image", "Video Upload"],
                defaultValue: "image",
            },
            heroImage: {
                type: ControlType.ResponsiveImage,
                title: "Hero Image",
                hidden: (props) => props.heroMediaType !== "image",
            },
            heroVideo: {
                type: ControlType.File,
                title: "Video",
                allowedFileTypes: ["mp4", "webm", "mov"],
                hidden: (props) => props.heroMediaType !== "video",
            },
            heroVideoPoster: {
                type: ControlType.ResponsiveImage,
                title: "Poster",
                hidden: (props) => props.heroMediaType === "image",
            },
            heroVideoAutoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: true,
                hidden: (props) => props.heroMediaType !== "video",
            },
            heroVideoLoop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                hidden: (props) => props.heroMediaType !== "video",
            },
            heroVideoMuted: {
                type: ControlType.Boolean,
                title: "Muted",
                defaultValue: true,
                hidden: (props) => props.heroMediaType !== "video",
            },
            heroVideoScrollScrub: {
                type: ControlType.Boolean,
                title: "Scroll Scrub",
                defaultValue: false,
                hidden: (props) => props.heroMediaType !== "video",
            },
            heroVideoScrubStart: {
                type: ControlType.Number,
                title: "Scrub Start",
                min: 0,
                max: 0.95,
                step: 0.01,
                defaultValue: 0.17,
                hidden: (props) =>
                    props.heroMediaType !== "video" ||
                    !props.heroVideoScrollScrub,
            },
            heroVideoScrubEnd: {
                type: ControlType.Number,
                title: "Scrub End",
                min: 0.05,
                max: 1,
                step: 0.01,
                defaultValue: 1,
                hidden: (props) =>
                    props.heroMediaType !== "video" ||
                    !props.heroVideoScrollScrub,
            },
            heroVideoScrubSmoothness: {
                type: ControlType.Number,
                title: "Smoothness",
                min: 0.02,
                max: 1,
                step: 0.01,
                defaultValue: 0.12,
                hidden: (props) =>
                    props.heroMediaType !== "video" ||
                    !props.heroVideoScrollScrub,
            },
            heroVideoScrubFps: {
                type: ControlType.Enum,
                title: "Scrub FPS",
                options: [30, 60],
                optionTitles: ["30 FPS", "60 FPS"],
                defaultValue: 60,
                displaySegmentedControl: true,
                hidden: (props) =>
                    props.heroMediaType !== "video" ||
                    !props.heroVideoScrollScrub,
            },
        },
    },
    collage: {
        type: ControlType.Object,
        title: "Floating Collage",
        controls: {
            showCollage: {
                type: ControlType.Boolean,
                title: "Collage",
                defaultValue: true,
            },
            startCollageAndTextVisible: {
                type: ControlType.Boolean,
                title: "Start Visible",
                enabledTitle: "Visible",
                disabledTitle: "Animate In",
                defaultValue: false,
                hidden: (props) => !props.showCollage,
            },
            showFloatingOnCanvas: {
                type: ControlType.Boolean,
                title: "Canvas Floats",
                defaultValue: true,
                hidden: (props) => !props.showCollage,
            },
            enableHoverParallax: {
                type: ControlType.Boolean,
                title: "Hover Parallax",
                defaultValue: true,
                hidden: (props) => !props.showCollage,
            },
            enableImageLightbox: {
                type: ControlType.Boolean,
                title: "Image Overlay",
                defaultValue: true,
                hidden: (props) => !props.showCollage,
            },
            hoverParallaxStrength: {
                type: ControlType.Number,
                title: "Parallax Strength",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 14,
                hidden: (props) =>
                    !props.showCollage || !props.enableHoverParallax,
            },
            floatingImages: {
                type: ControlType.Array,
                title: "Floating Images",
                defaultValue: defaultFloatingImages,
                control: {
                    type: ControlType.Object,
                    controls: {
                        image: {
                            type: ControlType.ResponsiveImage,
                            title: "Image",
                        },
                        openOnClick: {
                            type: ControlType.Boolean,
                            title: "Open Overlay",
                            defaultValue: true,
                        },
                        behavior: {
                            type: ControlType.Enum,
                            title: "Behavior",
                            options: [
                                "static",
                                "drift",
                                "orbit",
                                "magnetic",
                                "wave",
                            ],
                            optionTitles: [
                                "Static",
                                "Drift",
                                "Orbit",
                                "Magnetic",
                                "Wave",
                            ],
                            defaultValue: "drift",
                        },
                        behaviorStrength: {
                            type: ControlType.Number,
                            title: "Motion Amount",
                            min: 0,
                            max: 40,
                            step: 1,
                            unit: "px",
                            defaultValue: 12,
                            hidden: (item) =>
                                item.behavior === "static" ||
                                item.behavior === "magnetic",
                        },
                        behaviorSpeed: {
                            type: ControlType.Number,
                            title: "Motion Speed",
                            min: 0.25,
                            max: 3,
                            step: 0.05,
                            defaultValue: 1,
                            hidden: (item) =>
                                item.behavior === "static" ||
                                item.behavior === "magnetic",
                        },
                        position: {
                            type: ControlType.Enum,
                            title: "Position",
                            options: [
                                "top-left",
                                "top-right",
                                "middle-right",
                                "bottom-left",
                                "bottom-center",
                                "bottom-right",
                                "custom",
                            ],
                            optionTitles: [
                                "Top Left",
                                "Top Right",
                                "Middle Right",
                                "Bottom Left",
                                "Bottom Center",
                                "Bottom Right",
                                "Custom",
                            ],
                            defaultValue: "top-left",
                        },
                        size: {
                            type: ControlType.Number,
                            title: "Size",
                            min: 40,
                            max: 300,
                            step: 5,
                            unit: "%",
                            defaultValue: 100,
                        },
                        rotation: {
                            type: ControlType.Number,
                            title: "Rotation",
                            min: -45,
                            max: 45,
                            step: 1,
                            unit: "°",
                            defaultValue: 0,
                        },
                        x: {
                            type: ControlType.Number,
                            title: "X",
                            min: -600,
                            max: 600,
                            step: 1,
                            unit: "px",
                            defaultValue: 0,
                            hidden: (item) => item.position !== "custom",
                        },
                        y: {
                            type: ControlType.Number,
                            title: "Y",
                            min: -500,
                            max: 500,
                            step: 1,
                            unit: "px",
                            defaultValue: 0,
                            hidden: (item) => item.position !== "custom",
                        },
                    },
                },
            },
        },
    },
    story: {
        type: ControlType.Object,
        title: "Story & Layout",
        controls: {
            scrollLength: {
                type: ControlType.Number,
                title: "Scroll",
                min: 300,
                max: 1800,
                step: 50,
                unit: "vh",
                defaultValue: 1100,
            },
            introDuration: {
                type: ControlType.Number,
                title: "Intro End",
                min: 0.62,
                max: 0.85,
                step: 0.01,
                defaultValue: 0.64,
            },
            chapterOverlap: {
                type: ControlType.Number,
                title: "Fade Time",
                min: 0.05,
                max: 0.22,
                step: 0.01,
                defaultValue: 0.12,
            },
            storyReadTime: {
                type: ControlType.Number,
                title: "Read Time",
                min: 0.5,
                max: 0.9,
                step: 0.05,
                defaultValue: 0.75,
            },
            storyCrossfade: {
                type: ControlType.Number,
                title: "Crossfade",
                min: 0,
                max: 0.2,
                step: 0.01,
                defaultValue: 0.1,
            },
            storyMotion: {
                type: ControlType.Number,
                title: "Text Motion",
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            contentWidth: {
                type: ControlType.Number,
                title: "Text Width",
                min: 260,
                max: 900,
                step: 10,
                unit: "px",
                defaultValue: 540,
            },
            contentInset: {
                type: ControlType.Number,
                title: "Text Inset",
                min: 16,
                max: 180,
                step: 4,
                unit: "px",
                defaultValue: 64,
            },
            verticalPosition: {
                type: ControlType.Enum,
                title: "Text Y",
                options: ["top", "center", "bottom"],
                optionTitles: ["Top", "Center", "Bottom"],
                displaySegmentedControl: true,
                defaultValue: "bottom",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            stageColor: {
                type: ControlType.Color,
                title: "Stage",
                defaultValue: "#F7F6F3",
            },
            textColor: {
                type: ControlType.Color,
                title: "Stage Text",
                defaultValue: "#1F211D",
            },
            heroTextColor: {
                type: ControlType.Color,
                title: "Hero Text",
                defaultValue: "#FFFDF8",
            },
            cardRadius: {
                type: ControlType.Number,
                title: "Card Radius",
                min: 0,
                max: 48,
                step: 1,
                unit: "px",
                defaultValue: 10,
            },
            imagePosition: {
                type: ControlType.String,
                title: "Image Focus",
                defaultValue: "center center",
            },
        },
    },
    overlay: {
        type: ControlType.Object,
        title: "Media Overlay",
        controls: {
            showMediaOverlay: {
                type: ControlType.Boolean,
                title: "Media Overlay",
                defaultValue: true,
            },
            mediaOverlayStyle: {
                type: ControlType.Enum,
                title: "Overlay Style",
                options: ["solid", "gradient", "adaptive"],
                optionTitles: ["Solid", "Gradient", "Adaptive"],
                displaySegmentedControl: true,
                defaultValue: "adaptive",
                hidden: (props) => !props.showMediaOverlay,
            },
            overlayColor: {
                type: ControlType.Color,
                title: "Overlay Color",
                defaultValue: "#000000",
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle === "adaptive",
            },
            overlaySecondaryColor: {
                type: ControlType.Color,
                title: "Second Color",
                defaultValue: "rgba(0,0,0,0.08)",
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle !== "gradient",
            },
            overlayDirection: {
                type: ControlType.Number,
                title: "Direction",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: 90,
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle !== "gradient",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Overlay Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.28,
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle === "adaptive",
            },
            adaptiveOverlayDarkness: {
                type: ControlType.Number,
                title: "Darkness",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.68,
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle !== "adaptive",
            },
            adaptiveOverlayRadius: {
                type: ControlType.Number,
                title: "Focus Radius",
                min: 8,
                max: 65,
                step: 1,
                unit: "%",
                defaultValue: 28,
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle !== "adaptive",
            },
            adaptiveOverlayFeather: {
                type: ControlType.Number,
                title: "Feather",
                min: 12,
                max: 72,
                step: 1,
                unit: "%",
                defaultValue: 52,
                hidden: (props) =>
                    !props.showMediaOverlay ||
                    props.mediaOverlayStyle !== "adaptive",
            },
        },
    },
    shadows: {
        type: ControlType.Object,
        title: "Shadows",
        controls: {
            showCardShadow: {
                type: ControlType.Boolean,
                title: "Card Shadow",
                defaultValue: true,
            },
            cardShadow: {
                type: ControlType.String,
                title: "Card Shadow Style",
                defaultValue: "0 22px 55px rgba(25,22,15,.18)",
                hidden: (props) => !props.showCardShadow,
            },
            showHeroShadow: {
                type: ControlType.Boolean,
                title: "Hero Shadow",
                defaultValue: true,
            },
            heroShadow: {
                type: ControlType.String,
                title: "Hero Shadow Style",
                defaultValue: "0 35px 90px rgba(20,18,14,.16)",
                hidden: (props) => !props.showHeroShadow,
            },
            showTextShadow: {
                type: ControlType.Boolean,
                title: "Text Shadow",
                defaultValue: true,
            },
            textShadow: {
                type: ControlType.String,
                title: "Text Shadow Style",
                defaultValue: "0 2px 28px rgba(0,0,0,.3)",
                hidden: (props) => !props.showTextShadow,
            },
        },
    },
    premium: {
        type: ControlType.Object,
        title: "Premium Effects",
        controls: {
            imageMask: {
                type: ControlType.Enum,
                title: "Image Mask",
                options: [
                    "rounded",
                    "square",
                    "circle",
                    "arch",
                    "diamond",
                    "organic",
                ],
                optionTitles: [
                    "Rounded",
                    "Square",
                    "Circle",
                    "Arch",
                    "Diamond",
                    "Organic",
                ],
                defaultValue: "rounded",
            },
            showPager: {
                type: ControlType.Boolean,
                title: "Chapter Pager",
                defaultValue: true,
            },
            showScrollHint: {
                type: ControlType.Boolean,
                title: "Scroll Hint",
                defaultValue: true,
            },
            scrollHintText: {
                type: ControlType.String,
                title: "Hint Text",
                defaultValue: "Scroll to explore",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintFont: {
                type: ControlType.Font,
                title: "Hint Font",
                defaultValue: {
                    fontFamily: "Inter, Arial, sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    letterSpacing: "0.16em",
                },
                defaultFontType: "sans-serif",
                defaultFontSize: "10px",
                displayTextAlignment: false,
                displayFontSize: true,
                controls: "extended",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "#FFFFFF",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintArrow: {
                type: ControlType.String,
                title: "Arrow",
                defaultValue: "↓",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintArrowColor: {
                type: ControlType.Color,
                title: "Arrow Color",
                defaultValue: "#FFFFFF",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintArrowSize: {
                type: ControlType.Number,
                title: "Arrow Size",
                defaultValue: 16,
                min: 8,
                max: 64,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintBottom: {
                type: ControlType.Number,
                title: "Bottom",
                defaultValue: 26,
                min: 0,
                max: 240,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintGap: {
                type: ControlType.Number,
                title: "Text Gap",
                defaultValue: 7,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintOpacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.86,
                min: 0,
                max: 1,
                step: 0.05,
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintUppercase: {
                type: ControlType.Boolean,
                title: "Uppercase",
                defaultValue: true,
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintAnimate: {
                type: ControlType.Boolean,
                title: "Animate Arrow",
                defaultValue: true,
                hidden: (p) => !p.showScrollHint,
            },
            scrollHintAnimationDistance: {
                type: ControlType.Number,
                title: "Move Distance",
                defaultValue: 5,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
                hidden: (p) => !p.showScrollHint || !p.scrollHintAnimate,
            },
            scrollHintAnimationDuration: {
                type: ControlType.Number,
                title: "Move Speed",
                defaultValue: 1.6,
                min: 0.2,
                max: 8,
                step: 0.1,
                unit: "s",
                hidden: (p) => !p.showScrollHint || !p.scrollHintAnimate,
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Typography",
        controls: {
            displayFont: {
                type: ControlType.Font,
                title: "Brand Type",
                defaultValue: defaultDisplayFont,
                defaultFontType: "serif",
                defaultFontSize: "72px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            headingFont: {
                type: ControlType.Font,
                title: "Heading Type",
                defaultValue: defaultHeadingFont,
                defaultFontType: "serif",
                defaultFontSize: "64px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            bodyFont: {
                type: ControlType.Font,
                title: "Body Type",
                defaultValue: defaultBodyFont,
                defaultFontType: "sans-serif",
                defaultFontSize: "16px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            eyebrowFont: {
                type: ControlType.Font,
                title: "Label Type",
                defaultValue: defaultEyebrowFont,
                defaultFontType: "sans-serif",
                defaultFontSize: "10px",
                displayTextAlignment: true,
                displayFontSize: true,
                controls: "extended",
            },
            displayColor: {
                type: ControlType.Color,
                title: "Brand Color",
                defaultValue: "#FFFFFF",
            },
            headingColor: {
                type: ControlType.Color,
                title: "Heading Color",
                defaultValue: "#201F1B",
            },
            bodyColor: {
                type: ControlType.Color,
                title: "Body Color",
                defaultValue: "#201F1B",
            },
            eyebrowColor: {
                type: ControlType.Color,
                title: "Label Color",
                defaultValue: "#6B6B6B",
            },
        },
    },
})
