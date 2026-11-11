import * as React from "react"
import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ResponsiveSettings = {
    titleSize: number
    finalTitleSize: number
    subtextSize: number
    finalSubtextSize: number
    maxWidth: number
    horizontal: "left" | "center" | "right"
    vertical: "top" | "center" | "bottom"
    inset: number
}

interface ButtonFont {
    fontSize?: number
    fontFamily?: string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    textAlign?: "left" | "center" | "right" | "justify"
    [key: string]: any
}

interface HeroProps {
    image: any
    title: string
    subtext: string

    titleFont: any
    subtextFont: any

    titleColor: string
    subtextColor: string

    trigger: "load" | "viewport"

    delay: number
    stagger: number
    blur: number
    revealDuration: number
    moveDuration: number

    revealAngle: number
    imageScale: number
    imagePosition: string

    maskEnabled: boolean
    maskOpacity: number
    maskBlur: number

    desktop: ResponsiveSettings
    tablet: ResponsiveSettings
    mobile: ResponsiveSettings

    tabletBreakpoint: number
    mobileBreakpoint: number

    parallaxEnabled: boolean
    parallaxAmount: number

    reducedMotion: boolean

    backgroundColor: string
    radius: any

    showButton: boolean
    buttonText: string
    buttonLink: string
    buttonFont: ButtonFont
    buttonTextColor: string
    buttonBackgroundColor: string
    buttonBorderColor: string
    buttonBorderWidth: number
    buttonRadius: number
    buttonPadding: string

    textGap: number
    buttonSizing: "fit" | "fill" | "fixed"
    buttonFixedWidth: number

    content?: {
        image?: any
        title?: string
        subtext?: string
    }

    typography?: {
        titleFont?: any
        subtextFont?: any
    }

    colors?: {
        titleColor?: string
        subtextColor?: string
        backgroundColor?: string
    }

    animation?: {
        trigger?: "load" | "viewport"
        delay?: number
        stagger?: number
        blur?: number
        revealDuration?: number
        moveDuration?: number
    }

    imageSettings?: {
        revealAngle?: number
        imageScale?: number
        imagePosition?: string
    }

    mask?: {
        maskEnabled?: boolean
        maskOpacity?: number
        maskBlur?: number
    }

    layout?: {
        desktop?: ResponsiveSettings
        tablet?: ResponsiveSettings
        mobile?: ResponsiveSettings
        radius?: any
        textGap?: number
    }

    responsive?: {
        tabletBreakpoint?: number
        mobileBreakpoint?: number
    }

    parallax?: {
        parallaxEnabled?: boolean
        parallaxAmount?: number
    }

    button?: {
        showButton?: boolean
        buttonText?: string
        buttonLink?: string
        buttonFont?: ButtonFont
        buttonTextColor?: string
        buttonBackgroundColor?: string
        buttonBorderColor?: string
        buttonBorderWidth?: number
        buttonRadius?: number
        buttonPadding?: string
        buttonSizing?: "fit" | "fill" | "fixed"
        buttonFixedWidth?: number
    }

    accessibility?: {
        reducedMotion?: boolean
    }

    style?: React.CSSProperties
}

/* =========================================================
   HELPERS
========================================================= */

function getWords(value: string) {
    return value.trim().split(/\s+/).filter(Boolean)
}

function getResponsive(
    width: number,
    desktop: ResponsiveSettings,
    tablet: ResponsiveSettings,
    mobile: ResponsiveSettings,
    tabletBreakpoint: number,
    mobileBreakpoint: number
) {
    if (width < mobileBreakpoint) {
        return mobile
    }

    if (width < tabletBreakpoint) {
        return tablet
    }

    return desktop
}

function getRevealPolygon(angle: number) {
    const radians = (angle * Math.PI) / 180

    const width = 8
    const height = 8

    const points = [
        [-width / 2, -height / 2],
        [width / 2, -height / 2],
        [width / 2, height / 2],
        [-width / 2, height / 2],
    ]

    const rotated = points.map(([x, y]) => {
        const rx = x * Math.cos(radians) - y * Math.sin(radians)
        const ry = x * Math.sin(radians) + y * Math.cos(radians)

        return [50 + rx, 50 + ry]
    })

    return `polygon(${rotated.map(([x, y]) => `${x}% ${y}%`).join(", ")})`
}

function normalizeLink(link: string) {
    if (!link) return ""

    const value = String(link).trim()

    if (!value) return ""

    if (
        value.startsWith("/") ||
        value.startsWith("#") ||
        value.startsWith("mailto:") ||
        value.startsWith("tel:") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value
    }

    return `/${value}`
}

/* =========================================================
   DEFAULT RESPONSIVE SETTINGS
========================================================= */

const DEFAULT_DESKTOP: ResponsiveSettings = {
    titleSize: 88,
    finalTitleSize: 64,
    subtextSize: 20,
    finalSubtextSize: 18,
    maxWidth: 900,
    horizontal: "left",
    vertical: "bottom",
    inset: 60,
}

const DEFAULT_TABLET: ResponsiveSettings = {
    titleSize: 64,
    finalTitleSize: 48,
    subtextSize: 18,
    finalSubtextSize: 16,
    maxWidth: 720,
    horizontal: "left",
    vertical: "bottom",
    inset: 40,
}

const DEFAULT_MOBILE: ResponsiveSettings = {
    titleSize: 42,
    finalTitleSize: 34,
    subtextSize: 16,
    finalSubtextSize: 14,
    maxWidth: 500,
    horizontal: "left",
    vertical: "bottom",
    inset: 24,
}

/* =========================================================
   COMPONENT
========================================================= */

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export function HeroAnimation(props: HeroProps) {
    /* =====================================================
       STATIC RENDERER
    ===================================================== */

    const isStaticRenderer = useIsStaticRenderer()

    /* =====================================================
       RESOLVE FRAMER OBJECT CONTROLS
    ===================================================== */

    const content = props.content || {}
    const typography = props.typography || {}
    const colors = props.colors || {}
    const animation = props.animation || {}
    const imageSettings = props.imageSettings || {}
    const mask = props.mask || {}
    const layout = props.layout || {}
    const responsiveSettings = props.responsive || {}
    const parallax = props.parallax || {}
    const button = props.button || {}
    const accessibility = props.accessibility || {}

    /* =====================================================
       CONTENT
    ===================================================== */

    const image = content.image ?? props.image
    const title = content.title ?? props.title ?? ""
    const subtext = content.subtext ?? props.subtext ?? ""

    /* =====================================================
       TYPOGRAPHY
    ===================================================== */

    const titleFont = typography.titleFont ?? props.titleFont ?? {}
    const subtextFont = typography.subtextFont ?? props.subtextFont ?? {}

    /* =====================================================
       COLORS
    ===================================================== */

    const titleColor = colors.titleColor ?? props.titleColor ?? "#FFFFFF"

    const subtextColor =
        colors.subtextColor ?? props.subtextColor ?? "rgba(255,255,255,0.82)"

    const backgroundColor =
        colors.backgroundColor ?? props.backgroundColor ?? "#111111"

    /* =====================================================
       ANIMATION
    ===================================================== */

    const trigger = animation.trigger ?? props.trigger ?? "load"

    const delay = animation.delay ?? props.delay ?? 0.35

    const stagger = animation.stagger ?? props.stagger ?? 0.08

    const blur = animation.blur ?? props.blur ?? 14

    const revealDuration =
        animation.revealDuration ?? props.revealDuration ?? 1.35

    const moveDuration = animation.moveDuration ?? props.moveDuration ?? 1.15

    /* =====================================================
       IMAGE
    ===================================================== */

    const revealAngle = imageSettings.revealAngle ?? props.revealAngle ?? -8

    const imageScale = imageSettings.imageScale ?? props.imageScale ?? 1.18

    const imagePosition =
        imageSettings.imagePosition ?? props.imagePosition ?? "center center"

    /* =====================================================
       MASK
    ===================================================== */

    const maskEnabled = mask.maskEnabled ?? props.maskEnabled ?? true

    const maskOpacity = mask.maskOpacity ?? props.maskOpacity ?? 0.24

    const maskBlur = mask.maskBlur ?? props.maskBlur ?? 55

    /* =====================================================
       RESPONSIVE LAYOUT
    ===================================================== */

    const desktop = layout.desktop ?? props.desktop ?? DEFAULT_DESKTOP

    const tablet = layout.tablet ?? props.tablet ?? DEFAULT_TABLET

    const mobile = layout.mobile ?? props.mobile ?? DEFAULT_MOBILE

    const radius = layout.radius ?? props.radius ?? "0px"

    const textGap = layout.textGap ?? props.textGap ?? 16

    /* =====================================================
       BREAKPOINTS
    ===================================================== */

    const tabletBreakpoint =
        responsiveSettings.tabletBreakpoint ?? props.tabletBreakpoint ?? 1024

    const mobileBreakpoint =
        responsiveSettings.mobileBreakpoint ?? props.mobileBreakpoint ?? 768

    /* =====================================================
       PARALLAX
    ===================================================== */

    const parallaxEnabled =
        parallax.parallaxEnabled ?? props.parallaxEnabled ?? true

    const parallaxAmount = parallax.parallaxAmount ?? props.parallaxAmount ?? 18

    /* =====================================================
       ACCESSIBILITY
    ===================================================== */

    const reducedMotion =
        accessibility.reducedMotion ?? props.reducedMotion ?? true

    const prefersReducedMotion = useReducedMotion()

    const shouldReduceMotion =
        isStaticRenderer || (reducedMotion && prefersReducedMotion === true)

    /* =====================================================
       BUTTON
    ===================================================== */

    const showButton = button.showButton ?? props.showButton ?? true

    const buttonText = button.buttonText ?? props.buttonText ?? "Explore"

    const buttonLink = button.buttonLink ?? props.buttonLink ?? "/"

    const buttonFont = button.buttonFont ?? props.buttonFont ?? {}

    const buttonTextColor =
        button.buttonTextColor ?? props.buttonTextColor ?? "#111111"

    const buttonBackgroundColor =
        button.buttonBackgroundColor ?? props.buttonBackgroundColor ?? "#FFFFFF"

    const buttonBorderColor =
        button.buttonBorderColor ?? props.buttonBorderColor ?? "#FFFFFF"

    const buttonBorderWidth =
        button.buttonBorderWidth ?? props.buttonBorderWidth ?? 0

    const buttonRadius = button.buttonRadius ?? props.buttonRadius ?? 999

    const buttonPadding =
        button.buttonPadding ?? props.buttonPadding ?? "14px 22px"

    const buttonSizing = button.buttonSizing ?? props.buttonSizing ?? "fit"

    const buttonFixedWidth =
        button.buttonFixedWidth ?? props.buttonFixedWidth ?? 180

    /* =====================================================
       REFS
    ===================================================== */

    const rootRef = React.useRef<HTMLDivElement>(null)

    /* =====================================================
       STATE
    ===================================================== */

    const [width, setWidth] = React.useState(1200)

    const [started, setStarted] = React.useState(isStaticRenderer)

    const [revealStarted, setRevealStarted] = React.useState(isStaticRenderer)

    const [introComplete, setIntroComplete] = React.useState(isStaticRenderer)

    /* =====================================================
       SIZE
    ===================================================== */

    React.useLayoutEffect(() => {
        const element = rootRef.current

        if (!element) return

        const update = () => {
            const nextWidth = element.getBoundingClientRect().width

            if (nextWidth > 0) {
                setWidth((previousWidth) =>
                    previousWidth === nextWidth ? previousWidth : nextWidth
                )
            }
        }

        update()

        if (typeof ResizeObserver === "undefined") {
            return
        }

        const observer = new ResizeObserver(update)

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [])

    /* =====================================================
       STATIC RENDERER STATE
    ===================================================== */

    React.useEffect(() => {
        if (!isStaticRenderer) return

        setStarted(true)
        setRevealStarted(true)
        setIntroComplete(true)
    }, [isStaticRenderer])

    /* =====================================================
       RESPONSIVE
    ===================================================== */

    const responsive = React.useMemo(
        () =>
            getResponsive(
                width,
                desktop,
                tablet,
                mobile,
                tabletBreakpoint,
                mobileBreakpoint
            ),
        [width, desktop, tablet, mobile, tabletBreakpoint, mobileBreakpoint]
    )

    /* =====================================================
       WORDS
    ===================================================== */

    const words = React.useMemo(() => getWords(title), [title])

    const staggerDuration = Math.max(0, words.length - 1) * stagger

    /* =====================================================
       TIMELINE
    ===================================================== */

    const titleDuration = 0.65

    const subtextDelay = 0.35

    const subtextDuration = 0.55

    const revealDelay =
        titleDuration + staggerDuration + subtextDelay + subtextDuration

    const titleScale =
        responsive.titleSize > 0
            ? responsive.finalTitleSize / responsive.titleSize
            : 1

    const subtextScale =
        responsive.subtextSize > 0
            ? responsive.finalSubtextSize / responsive.subtextSize
            : 1

    /* =====================================================
       MASTER START
    ===================================================== */

    React.useEffect(() => {
        if (isStaticRenderer) {
            return
        }

        let timer: number | undefined

        setStarted(false)
        setRevealStarted(false)
        setIntroComplete(false)

        const startAnimation = () => {
            if (timer !== undefined) {
                window.clearTimeout(timer)
            }

            timer = window.setTimeout(
                () => {
                    setStarted(true)
                },
                Math.max(0, delay) * 1000
            )
        }

        if (shouldReduceMotion) {
            setStarted(true)
            setRevealStarted(true)
            setIntroComplete(true)

            return () => {
                if (timer !== undefined) {
                    window.clearTimeout(timer)
                }
            }
        }

        if (trigger === "load") {
            startAnimation()

            return () => {
                if (timer !== undefined) {
                    window.clearTimeout(timer)
                }
            }
        }

        const element = rootRef.current

        if (!element) return

        let observer: IntersectionObserver | undefined

        if (typeof IntersectionObserver === "undefined") {
            startAnimation()

            return () => {
                if (timer !== undefined) {
                    window.clearTimeout(timer)
                }
            }
        }

        observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                if (!entry?.isIntersecting) {
                    return
                }

                observer?.disconnect()
                observer = undefined

                startAnimation()
            },
            {
                threshold: 0.2,
            }
        )

        observer.observe(element)

        return () => {
            observer?.disconnect()

            if (timer !== undefined) {
                window.clearTimeout(timer)
            }
        }
    }, [trigger, delay, shouldReduceMotion, isStaticRenderer])

    /* =====================================================
       REVEAL TIMELINE
    ===================================================== */

    React.useEffect(() => {
        if (isStaticRenderer) {
            return
        }

        if (!started) {
            setRevealStarted(false)
            setIntroComplete(false)

            return
        }

        if (shouldReduceMotion) {
            setRevealStarted(true)
            setIntroComplete(true)

            return
        }

        let revealTimer: number | undefined

        let completeTimer: number | undefined

        revealTimer = window.setTimeout(
            () => {
                setRevealStarted(true)
            },
            Math.max(0, revealDelay) * 1000
        )

        const finalAnimationDuration = Math.max(revealDuration, moveDuration)

        completeTimer = window.setTimeout(
            () => {
                setIntroComplete(true)
            },
            (Math.max(0, revealDelay) + finalAnimationDuration) * 1000
        )

        return () => {
            if (revealTimer !== undefined) {
                window.clearTimeout(revealTimer)
            }

            if (completeTimer !== undefined) {
                window.clearTimeout(completeTimer)
            }
        }
    }, [
        started,
        shouldReduceMotion,
        revealDelay,
        revealDuration,
        moveDuration,
        isStaticRenderer,
    ])

    /* =====================================================
       PARALLAX
    ===================================================== */

    const { scrollYProgress } = useScroll({
        target: rootRef,
        offset: ["start end", "end start"],
    })

    const rawParallax = useTransform(
        scrollYProgress,
        [0, 1],
        [-parallaxAmount, parallaxAmount]
    )

    const smoothParallax = useSpring(rawParallax, {
        stiffness: 90,
        damping: 28,
        mass: 0.45,
    })

    const imageY =
        !isStaticRenderer &&
        parallaxEnabled &&
        introComplete &&
        !shouldReduceMotion
            ? smoothParallax
            : 0

    /* =====================================================
       POSITION
    ===================================================== */

    const initialContent = {
        left: "50%",
        top: "50%",
        right: "auto",
        bottom: "auto",
        x: "-50%",
        y: "-50%",
    }

    const finalContent = {
        left:
            responsive.horizontal === "left"
                ? `${responsive.inset}px`
                : responsive.horizontal === "center"
                  ? "50%"
                  : "auto",

        right:
            responsive.horizontal === "right"
                ? `${responsive.inset}px`
                : "auto",

        top:
            responsive.vertical === "top"
                ? `${responsive.inset}px`
                : responsive.vertical === "center"
                  ? "50%"
                  : "auto",

        bottom:
            responsive.vertical === "bottom" ? `${responsive.inset}px` : "auto",

        x: responsive.horizontal === "center" ? "-50%" : "0%",

        y: responsive.vertical === "center" ? "-50%" : "0%",
    }

    /* =====================================================
       IMAGE CLIP
    ===================================================== */

    const initialClip = getRevealPolygon(revealAngle)

    const fullClip = "polygon(0% 0%,100% 0%,100% 100%,0% 100%)"

    /* =====================================================
       LINK
    ===================================================== */

    const resolvedButtonLink = normalizeLink(buttonLink)

    /* =====================================================
       TITLE ALIGNMENT
    ===================================================== */

    const titleAlignment =
        titleFont?.textAlign === "center"
            ? "center"
            : titleFont?.textAlign === "right"
              ? "right"
              : "left"

    const titleTransformOrigin =
        titleAlignment === "center"
            ? "center center"
            : titleAlignment === "right"
              ? "right center"
              : "left center"

    const buttonAlignment =
        titleAlignment === "center"
            ? "center"
            : titleAlignment === "right"
              ? "flex-end"
              : "flex-start"

    /* =====================================================
       BUTTON SIZING
    ===================================================== */

    const buttonWidth =
        buttonSizing === "fill"
            ? "100%"
            : buttonSizing === "fixed"
              ? `${buttonFixedWidth}px`
              : "auto"

    /* =====================================================
       STATIC / DYNAMIC VISUAL STATES
    ===================================================== */

    const imageRevealState = isStaticRenderer || revealStarted

    const contentRevealState = isStaticRenderer || revealStarted

    const titleStartedState = isStaticRenderer || started

    const introCompleteState = isStaticRenderer || introComplete

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div
            ref={rootRef}
            style={{
                width: "100%",
                height: "100%",

                minWidth: 1,
                minHeight: 1,

                position: "relative",

                overflow: "hidden",

                backgroundColor,

                borderRadius: radius,

                isolation: "isolate",

                ...props.style,
            }}
        >
            {/* =================================================
                IMAGE
            ================================================= */}

            <motion.div
                initial={
                    isStaticRenderer
                        ? {
                              opacity: 1,
                              clipPath: fullClip,
                          }
                        : {
                              opacity: 0,
                              clipPath: initialClip,
                          }
                }
                animate={
                    imageRevealState
                        ? {
                              opacity: 1,
                              clipPath: fullClip,
                          }
                        : {
                              opacity: 0,
                              clipPath: initialClip,
                          }
                }
                transition={{
                    opacity: {
                        duration:
                            isStaticRenderer || shouldReduceMotion
                                ? 0
                                : revealDuration,
                    },

                    clipPath: {
                        duration:
                            isStaticRenderer || shouldReduceMotion
                                ? 0
                                : revealDuration,

                        ease: [0.16, 1, 0.3, 1],
                    },
                }}
                style={{
                    position: "absolute",

                    inset: 0,

                    zIndex: 0,

                    overflow: "hidden",
                }}
            >
                {image?.src ? (
                    <motion.img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        draggable={false}
                        initial={{
                            scale:
                                isStaticRenderer || shouldReduceMotion
                                    ? 1
                                    : imageScale,
                        }}
                        animate={{
                            scale: imageRevealState ? 1 : imageScale,
                        }}
                        transition={{
                            duration:
                                isStaticRenderer || shouldReduceMotion
                                    ? 0
                                    : revealDuration,

                            ease: [0.16, 1, 0.3, 1],
                        }}
                        style={{
                            position: "absolute",

                            inset: 0,

                            width: "100%",
                            height: "100%",

                            maxWidth: "none",

                            objectFit: "cover",

                            objectPosition: imagePosition,

                            display: "block",

                            y: imageY,

                            userSelect: "none",
                        }}
                    />
                ) : null}
            </motion.div>

            {/* =================================================
                CONTRAST MASK
            ================================================= */}

            {maskEnabled && (
                <motion.div
                    initial={
                        isStaticRenderer
                            ? {
                                  opacity: maskOpacity,
                                  scale: 1,
                              }
                            : {
                                  opacity: 0,
                                  scale: 0.85,
                              }
                    }
                    animate={
                        imageRevealState
                            ? {
                                  opacity: maskOpacity,
                                  scale: 1,
                              }
                            : {
                                  opacity: 0,
                                  scale: 0.85,
                              }
                    }
                    transition={{
                        duration:
                            isStaticRenderer || shouldReduceMotion
                                ? 0
                                : revealDuration,

                        ease: [0.16, 1, 0.3, 1],
                    }}
                    style={{
                        position: "absolute",

                        left: finalContent.left,

                        right: finalContent.right,

                        top: finalContent.top,

                        bottom: finalContent.bottom,

                        width: responsive.maxWidth,

                        height: responsive.titleSize * 2.6,

                        x: finalContent.x,

                        y: finalContent.y,

                        background: "#000000",

                        filter: `blur(${maskBlur}px)`,

                        borderRadius: 9999,

                        pointerEvents: "none",

                        zIndex: 1,
                    }}
                />
            )}

            {/* =================================================
                CONTENT
            ================================================= */}

            <motion.div
                initial={isStaticRenderer ? finalContent : initialContent}
                animate={contentRevealState ? finalContent : initialContent}
                transition={{
                    duration:
                        isStaticRenderer || shouldReduceMotion
                            ? 0
                            : moveDuration,

                    ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                    position: "absolute",

                    zIndex: 2,

                    width: responsive.maxWidth,

                    maxWidth: "calc(100% - 48px)",

                    display: "flex",

                    flexDirection: "column",

                    gap: textGap,

                    overflow: "visible",

                    pointerEvents: "none",
                }}
            >
                {/* =================================================
                    TITLE
                ================================================= */}

                <motion.div
                    initial={{
                        scale: isStaticRenderer ? titleScale : 1,
                    }}
                    animate={{
                        scale: imageRevealState ? titleScale : 1,
                    }}
                    transition={{
                        scale: {
                            delay:
                                isStaticRenderer || shouldReduceMotion
                                    ? 0
                                    : titleDuration + staggerDuration,

                            duration:
                                isStaticRenderer || shouldReduceMotion
                                    ? 0
                                    : moveDuration,

                            ease: [0.16, 1, 0.3, 1],
                        },
                    }}
                    style={{
                        width: "100%",

                        display: "flex",

                        flexWrap: "wrap",

                        alignItems: "baseline",

                        justifyContent:
                            titleAlignment === "center"
                                ? "center"
                                : titleAlignment === "right"
                                  ? "flex-end"
                                  : "flex-start",

                        overflow: "visible",

                        fontKerning: "normal",

                        textRendering: "optimizeLegibility",

                        fontSize: responsive.titleSize,

                        lineHeight: titleFont?.lineHeight,

                        letterSpacing: titleFont?.letterSpacing,

                        transformOrigin: titleTransformOrigin,

                        willChange: isStaticRenderer ? "auto" : "transform",
                    }}
                >
                    {words.map((word, index) => (
                        <motion.span
                            key={`${word}-${index}`}
                            initial={
                                isStaticRenderer
                                    ? {
                                          opacity: 1,
                                          y: 0,
                                          filter: "blur(0px)",
                                          scale: 1,
                                      }
                                    : {
                                          opacity: 0,
                                          y: shouldReduceMotion ? 0 : 30,
                                          filter: shouldReduceMotion
                                              ? "blur(0px)"
                                              : `blur(${blur}px)`,
                                          scale: shouldReduceMotion ? 1 : 0.985,
                                      }
                            }
                            animate={{
                                opacity: titleStartedState ? 1 : 0,

                                y: titleStartedState
                                    ? 0
                                    : shouldReduceMotion
                                      ? 0
                                      : 30,

                                filter: titleStartedState
                                    ? "blur(0px)"
                                    : shouldReduceMotion
                                      ? "blur(0px)"
                                      : `blur(${blur}px)`,

                                scale: titleStartedState
                                    ? 1
                                    : shouldReduceMotion
                                      ? 1
                                      : 0.985,
                            }}
                            transition={{
                                delay:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : index * stagger,

                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : titleDuration,

                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{
                                ...titleFont,

                                fontSize: "inherit",

                                lineHeight: titleFont?.lineHeight,

                                letterSpacing: titleFont?.letterSpacing,

                                color: titleColor,

                                display: "block",

                                flex: "0 0 auto",

                                marginRight:
                                    index < words.length - 1 ? "0.28em" : "0",

                                whiteSpace: "nowrap",

                                fontKerning: "normal",

                                textRendering: "optimizeLegibility",

                                willChange: isStaticRenderer
                                    ? "auto"
                                    : "transform, filter, opacity",

                                backfaceVisibility: "hidden",

                                WebkitFontSmoothing: "antialiased",
                            }}
                        >
                            {word}
                        </motion.span>
                    ))}
                </motion.div>

                {/* =================================================
                    SUBTEXT
                ================================================= */}

                {subtext ? (
                    <motion.div
                        initial={
                            isStaticRenderer
                                ? {
                                      opacity: 1,
                                      y: 0,
                                      filter: "blur(0px)",
                                      scale: subtextScale,
                                  }
                                : {
                                      opacity: 0,
                                      y: shouldReduceMotion ? 0 : 18,
                                      filter: shouldReduceMotion
                                          ? "blur(0px)"
                                          : "blur(8px)",
                                      scale: 1,
                                  }
                        }
                        animate={{
                            opacity: titleStartedState ? 1 : 0,

                            y: titleStartedState
                                ? 0
                                : shouldReduceMotion
                                  ? 0
                                  : 18,

                            filter: titleStartedState
                                ? "blur(0px)"
                                : shouldReduceMotion
                                  ? "blur(0px)"
                                  : "blur(8px)",

                            scale: imageRevealState ? subtextScale : 1,
                        }}
                        transition={{
                            opacity: {
                                delay:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : titleDuration +
                                          staggerDuration +
                                          subtextDelay,

                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : subtextDuration,

                                ease: [0.22, 1, 0.36, 1],
                            },

                            y: {
                                delay:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : titleDuration +
                                          staggerDuration +
                                          subtextDelay,

                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : subtextDuration,

                                ease: [0.22, 1, 0.36, 1],
                            },

                            filter: {
                                delay:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : titleDuration +
                                          staggerDuration +
                                          subtextDelay,

                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : subtextDuration,

                                ease: [0.22, 1, 0.36, 1],
                            },

                            scale: {
                                delay: 0,

                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : moveDuration,

                                ease: [0.16, 1, 0.3, 1],
                            },
                        }}
                        style={{
                            ...subtextFont,

                            fontSize: responsive.subtextSize,

                            width: "100%",

                            color: subtextColor,

                            fontKerning: "normal",

                            textRendering: "optimizeLegibility",

                            transformOrigin: titleTransformOrigin,

                            willChange: isStaticRenderer
                                ? "auto"
                                : "transform, filter, opacity",

                            backfaceVisibility: "hidden",

                            WebkitFontSmoothing: "antialiased",
                        }}
                    >
                        {subtext}
                    </motion.div>
                ) : null}

                {/* =================================================
                    BUTTON
                ================================================= */}

                {showButton && buttonText && resolvedButtonLink && (
                    <motion.div
                        initial={
                            isStaticRenderer
                                ? {
                                      opacity: 1,
                                      y: 0,
                                      filter: "blur(0px)",
                                  }
                                : {
                                      opacity: 0,
                                      y: shouldReduceMotion ? 0 : 14,
                                      filter: shouldReduceMotion
                                          ? "blur(0px)"
                                          : "blur(8px)",
                                  }
                        }
                        animate={
                            introCompleteState
                                ? {
                                      opacity: 1,
                                      y: 0,
                                      filter: "blur(0px)",
                                  }
                                : {
                                      opacity: 0,
                                      y: shouldReduceMotion ? 0 : 14,
                                      filter: shouldReduceMotion
                                          ? "blur(0px)"
                                          : "blur(8px)",
                                  }
                        }
                        transition={{
                            opacity: {
                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : 0.7,

                                ease: [0.22, 1, 0.36, 1],
                            },

                            y: {
                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : 0.8,

                                ease: [0.16, 1, 0.3, 1],
                            },

                            filter: {
                                duration:
                                    isStaticRenderer || shouldReduceMotion
                                        ? 0
                                        : 0.7,

                                ease: [0.22, 1, 0.36, 1],
                            },
                        }}
                        style={{
                            width: "100%",

                            display: "flex",

                            justifyContent: buttonAlignment,

                            pointerEvents: introCompleteState ? "auto" : "none",

                            willChange: isStaticRenderer
                                ? "auto"
                                : "transform, opacity, filter",
                        }}
                    >
                        <a
                            href={resolvedButtonLink}
                            aria-label={buttonText}
                            style={{
                                ...buttonFont,

                                display: "inline-flex",

                                alignItems: "center",

                                justifyContent: "center",

                                width: buttonWidth,

                                padding: buttonPadding,

                                color: buttonTextColor,

                                backgroundColor: buttonBackgroundColor,

                                border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,

                                borderRadius: buttonRadius,

                                textDecoration: "none",

                                boxSizing: "border-box",

                                cursor: "pointer",

                                whiteSpace: "nowrap",

                                userSelect: "none",

                                WebkitTapHighlightColor: "transparent",

                                transition:
                                    "transform 180ms ease, opacity 180ms ease",

                                touchAction: "manipulation",
                            }}
                            onMouseEnter={(event) => {
                                if (isStaticRenderer) return

                                event.currentTarget.style.transform =
                                    "translateY(-1px)"
                            }}
                            onMouseLeave={(event) => {
                                if (isStaticRenderer) return

                                event.currentTarget.style.transform =
                                    "translateY(0)"
                            }}
                        >
                            {buttonText}
                        </a>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}

/* =========================================================
   DEFAULT PROPS
========================================================= */

HeroAnimation.defaultProps = {
    content: {
        image: {
            src: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=2400&q=85",
        },

        title: "Create something meaningful",

        subtext:
            "A cinematic hero experience with depth, movement and a quiet sense of focus.",
    },

    typography: {
        titleFont: {
            fontSize: 88,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.03em",
            textAlign: "left",
        },

        subtextFont: {
            fontSize: 20,
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            lineHeight: 1.4,
            letterSpacing: "0em",
            textAlign: "left",
        },
    },

    colors: {
        titleColor: "#FFFFFF",
        subtextColor: "rgba(255,255,255,0.82)",
        backgroundColor: "#111111",
    },

    animation: {
        trigger: "load",
        delay: 0.35,
        stagger: 0.08,
        blur: 14,
        revealDuration: 1.35,
        moveDuration: 1.15,
    },

    imageSettings: {
        revealAngle: -8,
        imageScale: 1.18,
        imagePosition: "center center",
    },

    mask: {
        maskEnabled: true,
        maskOpacity: 0.24,
        maskBlur: 55,
    },

    layout: {
        desktop: DEFAULT_DESKTOP,
        tablet: DEFAULT_TABLET,
        mobile: DEFAULT_MOBILE,
        radius: "0px",
        textGap: 16,
    },

    responsive: {
        tabletBreakpoint: 1024,
        mobileBreakpoint: 768,
    },

    parallax: {
        parallaxEnabled: true,
        parallaxAmount: 18,
    },

    button: {
        showButton: true,

        buttonText: "Explore",

        buttonLink: "/",

        buttonFont: {
            fontSize: 16,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            lineHeight: 1,
            letterSpacing: "0em",
            textAlign: "center",
        },

        buttonTextColor: "#111111",

        buttonBackgroundColor: "#FFFFFF",

        buttonBorderColor: "#FFFFFF",

        buttonBorderWidth: 0,

        buttonRadius: 999,

        buttonPadding: "14px 22px",

        buttonSizing: "fit",

        buttonFixedWidth: 180,
    },

    accessibility: {
        reducedMotion: true,
    },
}

/* =========================================================
   PROPERTY CONTROLS
========================================================= */

addPropertyControls(HeroAnimation, {
    content: {
        type: ControlType.Object,
        title: "Content",
        icon: "object",

        controls: {
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
            },

            title: {
                type: ControlType.String,
                title: "Title",
                defaultValue: "Create something meaningful",
                displayTextArea: true,
            },

            subtext: {
                type: ControlType.String,
                title: "Body",
                defaultValue:
                    "A cinematic hero experience with depth, movement and a quiet sense of focus.",
                displayTextArea: true,
            },
        },
    },

    typography: {
        type: ControlType.Object,
        title: "Typography",
        icon: "object",

        controls: {
            titleFont: {
                type: ControlType.Font,
                title: "Title",

                defaultValue: {
                    fontSize: 88,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    lineHeight: 0.98,
                    letterSpacing: "-0.03em",
                    textAlign: "left",
                },

                defaultFontType: "sans-serif",
                controls: "extended",
            },

            subtextFont: {
                type: ControlType.Font,
                title: "Body",

                defaultValue: {
                    fontSize: 20,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 400,
                    lineHeight: 1.4,
                    letterSpacing: "0em",
                    textAlign: "left",
                },

                defaultFontType: "sans-serif",
                controls: "extended",
            },
        },
    },

    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",

        controls: {
            titleColor: {
                type: ControlType.Color,
                title: "Title",
                defaultValue: "#FFFFFF",
            },

            subtextColor: {
                type: ControlType.Color,
                title: "Body",
                defaultValue: "rgba(255,255,255,0.82)",
            },

            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#111111",
            },
        },
    },

    animation: {
        type: ControlType.Object,
        title: "Animation",
        icon: "effect",

        controls: {
            trigger: {
                type: ControlType.Enum,
                title: "Start",
                options: ["load", "viewport"],
                optionTitles: ["On Load", "In View"],
                defaultValue: "load",
                displaySegmentedControl: true,
            },

            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 0.35,
                min: 0,
                max: 10,
                step: 0.05,
                unit: "s",
            },

            stagger: {
                type: ControlType.Number,
                title: "Stagger",
                defaultValue: 0.08,
                min: 0,
                max: 0.3,
                step: 0.01,
                unit: "s",
            },

            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 14,
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
            },

            revealDuration: {
                type: ControlType.Number,
                title: "Reveal",
                defaultValue: 1.35,
                min: 0.3,
                max: 3,
                step: 0.05,
                unit: "s",
            },

            moveDuration: {
                type: ControlType.Number,
                title: "Movement",
                defaultValue: 1.15,
                min: 0.3,
                max: 3,
                step: 0.05,
                unit: "s",
            },
        },
    },

    imageSettings: {
        type: ControlType.Object,
        title: "Image",
        icon: "object",

        controls: {
            revealAngle: {
                type: ControlType.Number,
                title: "Reveal Angle",
                defaultValue: -8,
                min: -30,
                max: 30,
                step: 1,
                unit: "°",
            },

            imageScale: {
                type: ControlType.Number,
                title: "Start Scale",
                defaultValue: 1.18,
                min: 1,
                max: 1.5,
                step: 0.01,
            },

            imagePosition: {
                type: ControlType.String,
                title: "Position",
                defaultValue: "center center",
            },
        },
    },

    mask: {
        type: ControlType.Object,
        title: "Mask",
        icon: "effect",

        controls: {
            maskEnabled: {
                type: ControlType.Boolean,
                title: "Contrast",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },

            maskOpacity: {
                type: ControlType.Number,
                title: "Opacity",
                defaultValue: 0.24,
                min: 0,
                max: 0.8,
                step: 0.01,

                hidden: (props) => props.mask?.maskEnabled === false,
            },

            maskBlur: {
                type: ControlType.Number,
                title: "Softness",
                defaultValue: 55,
                min: 0,
                max: 120,
                step: 1,
                unit: "px",

                hidden: (props) => props.mask?.maskEnabled === false,
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        icon: "object",

        controls: {
            desktop: {
                type: ControlType.Object,
                title: "Desktop",

                controls: {
                    horizontal: {
                        type: ControlType.Enum,
                        title: "Horizontal",
                        options: ["left", "center", "right"],
                        optionTitles: ["Left", "Center", "Right"],
                        defaultValue: "left",
                        displaySegmentedControl: true,
                    },

                    vertical: {
                        type: ControlType.Enum,
                        title: "Vertical",
                        options: ["top", "center", "bottom"],
                        optionTitles: ["Top", "Center", "Bottom"],
                        defaultValue: "bottom",
                        displaySegmentedControl: true,
                    },

                    inset: {
                        type: ControlType.Number,
                        title: "Inset",
                        defaultValue: 60,
                        min: 0,
                        max: 200,
                        step: 1,
                        unit: "px",
                    },

                    maxWidth: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 900,
                        min: 280,
                        max: 1200,
                        step: 10,
                        unit: "px",
                    },

                    titleSize: {
                        type: ControlType.Number,
                        title: "Title Start",
                        defaultValue: 88,
                        min: 24,
                        max: 160,
                        step: 1,
                        unit: "px",
                    },

                    finalTitleSize: {
                        type: ControlType.Number,
                        title: "Title End",
                        defaultValue: 64,
                        min: 18,
                        max: 160,
                        step: 1,
                        unit: "px",
                    },

                    subtextSize: {
                        type: ControlType.Number,
                        title: "Body Start",
                        defaultValue: 20,
                        min: 12,
                        max: 40,
                        step: 1,
                        unit: "px",
                    },

                    finalSubtextSize: {
                        type: ControlType.Number,
                        title: "Body End",
                        defaultValue: 18,
                        min: 10,
                        max: 40,
                        step: 1,
                        unit: "px",
                    },
                },
            },

            tablet: {
                type: ControlType.Object,
                title: "Tablet",

                controls: {
                    horizontal: {
                        type: ControlType.Enum,
                        title: "Horizontal",
                        options: ["left", "center", "right"],
                        optionTitles: ["Left", "Center", "Right"],
                        defaultValue: "left",
                        displaySegmentedControl: true,
                    },

                    vertical: {
                        type: ControlType.Enum,
                        title: "Vertical",
                        options: ["top", "center", "bottom"],
                        optionTitles: ["Top", "Center", "Bottom"],
                        defaultValue: "bottom",
                        displaySegmentedControl: true,
                    },

                    inset: {
                        type: ControlType.Number,
                        title: "Inset",
                        defaultValue: 40,
                        min: 0,
                        max: 160,
                        step: 1,
                        unit: "px",
                    },

                    maxWidth: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 720,
                        min: 240,
                        max: 900,
                        step: 10,
                        unit: "px",
                    },

                    titleSize: {
                        type: ControlType.Number,
                        title: "Title Start",
                        defaultValue: 64,
                        min: 20,
                        max: 110,
                        step: 1,
                        unit: "px",
                    },

                    finalTitleSize: {
                        type: ControlType.Number,
                        title: "Title End",
                        defaultValue: 48,
                        min: 18,
                        max: 110,
                        step: 1,
                        unit: "px",
                    },

                    subtextSize: {
                        type: ControlType.Number,
                        title: "Body Start",
                        defaultValue: 18,
                        min: 12,
                        max: 32,
                        step: 1,
                        unit: "px",
                    },

                    finalSubtextSize: {
                        type: ControlType.Number,
                        title: "Body End",
                        defaultValue: 16,
                        min: 10,
                        max: 32,
                        step: 1,
                        unit: "px",
                    },
                },
            },

            mobile: {
                type: ControlType.Object,
                title: "Mobile",

                controls: {
                    horizontal: {
                        type: ControlType.Enum,
                        title: "Horizontal",
                        options: ["left", "center", "right"],
                        optionTitles: ["Left", "Center", "Right"],
                        defaultValue: "left",
                        displaySegmentedControl: true,
                    },

                    vertical: {
                        type: ControlType.Enum,
                        title: "Vertical",
                        options: ["top", "center", "bottom"],
                        optionTitles: ["Top", "Center", "Bottom"],
                        defaultValue: "bottom",
                        displaySegmentedControl: true,
                    },

                    inset: {
                        type: ControlType.Number,
                        title: "Inset",
                        defaultValue: 24,
                        min: 0,
                        max: 120,
                        step: 1,
                        unit: "px",
                    },

                    maxWidth: {
                        type: ControlType.Number,
                        title: "Width",
                        defaultValue: 500,
                        min: 180,
                        max: 600,
                        step: 10,
                        unit: "px",
                    },

                    titleSize: {
                        type: ControlType.Number,
                        title: "Title Start",
                        defaultValue: 42,
                        min: 18,
                        max: 72,
                        step: 1,
                        unit: "px",
                    },

                    finalTitleSize: {
                        type: ControlType.Number,
                        title: "Title End",
                        defaultValue: 34,
                        min: 16,
                        max: 72,
                        step: 1,
                        unit: "px",
                    },

                    subtextSize: {
                        type: ControlType.Number,
                        title: "Body Start",
                        defaultValue: 16,
                        min: 11,
                        max: 28,
                        step: 1,
                        unit: "px",
                    },

                    finalSubtextSize: {
                        type: ControlType.Number,
                        title: "Body End",
                        defaultValue: 14,
                        min: 9,
                        max: 28,
                        step: 1,
                        unit: "px",
                    },
                },
            },

            textGap: {
                type: ControlType.Number,
                title: "Text Gap",
                defaultValue: 16,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
            },

            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "0px",
            },
        },
    },

    responsive: {
        type: ControlType.Object,
        title: "Responsive",
        icon: "object",

        controls: {
            tabletBreakpoint: {
                type: ControlType.Number,
                title: "Tablet <",
                defaultValue: 1024,
                min: 800,
                max: 1400,
                step: 10,
                unit: "px",
            },

            mobileBreakpoint: {
                type: ControlType.Number,
                title: "Mobile <",
                defaultValue: 768,
                min: 480,
                max: 900,
                step: 10,
                unit: "px",
            },
        },
    },

    parallax: {
        type: ControlType.Object,
        title: "Parallax",
        icon: "effect",

        controls: {
            parallaxEnabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },

            parallaxAmount: {
                type: ControlType.Number,
                title: "Amount",
                defaultValue: 18,
                min: 0,
                max: 60,
                step: 1,
                unit: "px",

                hidden: (props) => props.parallax?.parallaxEnabled === false,
            },
        },
    },

    button: {
        type: ControlType.Object,
        title: "Button",
        icon: "interact",

        controls: {
            showButton: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
            },

            buttonText: {
                type: ControlType.String,
                title: "Text",
                defaultValue: "Explore",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonLink: {
                type: ControlType.Link,
                title: "Link",
                defaultValue: "/",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "14px 22px",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonRadius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 999,
                min: 0,
                max: 100,
                step: 1,
                unit: "px",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonBorderWidth: {
                type: ControlType.Number,
                title: "Border Width",
                defaultValue: 0,
                min: 0,
                max: 8,
                step: 1,
                unit: "px",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonFont: {
                type: ControlType.Font,
                title: "Font",

                defaultValue: {
                    fontSize: 16,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    lineHeight: 1,
                    letterSpacing: "0em",
                    textAlign: "center",
                },

                defaultFontType: "sans-serif",
                controls: "extended",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonTextColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#111111",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonBackgroundColor: {
                type: ControlType.Color,
                title: "Fill",
                defaultValue: "#FFFFFF",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonBorderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#FFFFFF",

                hidden: (props) => props.button?.showButton === false,
            },

            buttonSizing: {
                type: ControlType.Enum,
                title: "Sizing",

                options: ["fit", "fill", "fixed"],

                optionTitles: ["Fit", "Fill", "Fixed"],

                defaultValue: "fit",

                displaySegmentedControl: true,

                hidden: (props) => props.button?.showButton === false,
            },

            buttonFixedWidth: {
                type: ControlType.Number,
                title: "Fixed Width",
                defaultValue: 180,
                min: 40,
                max: 1000,
                step: 1,
                unit: "px",

                hidden: (props) =>
                    props.button?.showButton === false ||
                    props.button?.buttonSizing !== "fixed",
            },
        },
    },

    accessibility: {
        type: ControlType.Object,
        title: "Accessibility",
        icon: "object",

        controls: {
            reducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                enabledTitle: "Respect",
                disabledTitle: "Ignore",
            },
        },
    },
})
