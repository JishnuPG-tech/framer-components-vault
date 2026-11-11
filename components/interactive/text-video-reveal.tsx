import {
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useId,
    useMemo,
} from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

gsap.registerPlugin(ScrollTrigger)

type ButtonStyle = "filled" | "outline" | "ghost"
type TextTransform = "none" | "capitalize" | "uppercase" | "lowercase"

interface FontProps {
    fontFamily: string
    fontSize?: string | number
    fontWeight?: string | number
    letterSpacing?: number | string
    lineHeight?: number | string
    style?: string
}

interface ButtonFont {
    fontFamily: string
    fontWeight: number | string
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    fontStyle?: string
}

interface MainButtonSettings {
    buttonStyle?: ButtonStyle
    bgColor?: string
    font?: ButtonFont
    fontColor?: string
    hoverBgColor?: string
    hoverFontColor?: string
    buttonBorderColor?: string
    buttonHoverBorderColor?: string
    buttonBorderRadius?: number
    buttonPaddingX?: number
    buttonPaddingY?: number
    buttonTextTransform?: TextTransform

    // Legacy RevealSection keys kept for backwards compatibility.
    borderColor?: string
    hoverBorderColor?: string
    borderRadius?: number
    paddingX?: number
    paddingY?: number
    textTransform?: TextTransform
}

interface LayoutSettings {
    leftPosition?: number
    rightPosition?: number
    bottomPosition?: number
    leftMaxWidth?: number
    rightMaxWidth?: number
}

interface RevealSectionProps {
    video?: string
    videoUrl?: string
    videoSource?: "upload" | "url"
    poster: string
    posterAlt?: string
    maskText: string
    category: string
    heading: string
    paragraph: string
    buttonText: string
    buttonLink: string
    headerFont: FontProps
    maskFont: FontProps
    kickerFont: FontProps
    bodyFont: FontProps
    kickerColor: string
    headerColor: string
    bodyColor: string
    maskBackgroundColor: string
    containerBackgroundColor: string
    overlayBackground: string
    overlayOpacity: number
    kickerTextTransform: TextTransform
    headerTextTransform: TextTransform
    bodyTextTransform: TextTransform
    maskTextTransform: TextTransform
    mainButton?: MainButtonSettings
    layout?: LayoutSettings
}

function isExternalLink(link: string): boolean {
    return /^https?:\/\//i.test(link)
}

/**
 * Renders header copy with lightweight, nestable shortcodes.
 *
 * Supported syntax:
 *   [color=#ff4d4f]Colored text[/color]
 *   [i]Italic text[/i]
 *   [color=#ff4d4f][i]Colored italic text[/i][/color]
 *
 * Text outside shortcodes keeps the Header Color and Header Typography values.
 */
function renderStyledHeader(text: string): React.ReactNode[] {
    type HeaderStyle = React.CSSProperties

    const tokenPattern = /\[(\/?)(i|color)(?:=([^\]]+))?\]/gi
    const output: React.ReactNode[] = []
    const styleStack: HeaderStyle[] = [{}]

    let cursor = 0
    let tokenMatch: RegExpExecArray | null
    let keyIndex = 0

    const pushText = (value: string) => {
        if (!value) return

        const activeStyle = styleStack[styleStack.length - 1]

        if (Object.keys(activeStyle).length === 0) {
            output.push(value)
            return
        }

        output.push(
            <span key={`header-style-${keyIndex++}`} style={activeStyle}>
                {value}
            </span>
        )
    }

    while ((tokenMatch = tokenPattern.exec(text)) !== null) {
        pushText(text.slice(cursor, tokenMatch.index))

        const isClosingTag = tokenMatch[1] === "/"
        const tagName = tokenMatch[2].toLowerCase()
        const tagValue = tokenMatch[3]?.trim()

        if (isClosingTag) {
            if (styleStack.length > 1) {
                styleStack.pop()
            }
        } else {
            const currentStyle = styleStack[styleStack.length - 1]
            const nextStyle: HeaderStyle = { ...currentStyle }

            if (tagName === "i") {
                nextStyle.fontStyle = "italic"
            }

            if (tagName === "color" && tagValue) {
                nextStyle.color = tagValue
            }

            styleStack.push(nextStyle)
        }

        cursor = tokenPattern.lastIndex
    }

    pushText(text.slice(cursor))

    return output
}

const ARROW_SVG = (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
    >
        <path
            d="M7 17L17 7M17 7H7M17 7V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)
/**
 * @framerDisableUnlink
 */
export default function RevealSection(props: RevealSectionProps) {
    const {
        video,
        videoUrl,
        videoSource = "upload",
        poster,
        posterAlt,
        maskText,
        category,
        heading,
        paragraph,
        buttonText,
        buttonLink,
        headerFont,
        maskFont,
        kickerFont,
        bodyFont,
        kickerColor,
        headerColor,
        bodyColor,
        maskBackgroundColor,
        containerBackgroundColor,
        overlayBackground,
        overlayOpacity,
        kickerTextTransform,
        headerTextTransform,
        bodyTextTransform,
        maskTextTransform,
        mainButton = {},
        layout = {},
    } = props

    const uniqueId = useId().replace(/:/g, "")
    const scope = `reveal-${uniqueId}`
    const maskId = `mask-${uniqueId}`

    const containerRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<SVGTextElement>(null)
    const maskLayerRef = useRef<HTMLDivElement>(null)
    const leftContentRef = useRef<HTMLDivElement>(null)
    const rightContentRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoSrc = videoSource === "url" ? videoUrl : video
    const timelineRef = useRef<gsap.core.Timeline | null>(null)

    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(false)
    const [shouldLoadVideo, setShouldLoadVideo] = useState(false)

    const {
        buttonStyle = "filled",
        bgColor = "#ffffff",
        font: buttonFont = {
            fontFamily: "inherit",
            fontWeight: 600,
            fontSize: "13px",
            letterSpacing: "0.15em",
            lineHeight: "1em",
        },
        fontColor = "#000000",
        hoverBgColor = "rgba(255, 255, 255, 0.85)",
        hoverFontColor = "#000000",
        buttonBorderColor,
        buttonHoverBorderColor,
        buttonBorderRadius,
        buttonPaddingX,
        buttonPaddingY,
        buttonTextTransform,
        // Read old RevealSection values when an existing instance still uses them.
        borderColor: legacyBorderColor,
        hoverBorderColor: legacyHoverBorderColor,
        borderRadius: legacyBorderRadius,
        paddingX: legacyPaddingX,
        paddingY: legacyPaddingY,
        textTransform: legacyTextTransform,
    } = mainButton

    const borderColor = buttonBorderColor ?? legacyBorderColor ?? "#ffffff"
    const hoverBorderColor =
        buttonHoverBorderColor ?? legacyHoverBorderColor ?? "#ffffff"
    const borderRadius = buttonBorderRadius ?? legacyBorderRadius ?? 100
    const paddingX = buttonPaddingX ?? legacyPaddingX ?? 28
    const paddingY = buttonPaddingY ?? legacyPaddingY ?? 14
    const textTransform =
        buttonTextTransform ?? legacyTextTransform ?? "uppercase"

    const {
        leftPosition = 8,
        rightPosition = 8,
        bottomPosition = 12,
        leftMaxWidth = 500,
        rightMaxWidth = 400,
    } = layout

    const scopedCSS = useMemo(() => {
        return getScopedCSS(
            scope,
            leftPosition,
            rightPosition,
            bottomPosition,
            leftMaxWidth,
            rightMaxWidth
        )
    }, [
        scope,
        leftPosition,
        rightPosition,
        bottomPosition,
        leftMaxWidth,
        rightMaxWidth,
    ])

    useEffect(() => {
        if (isStatic || !containerRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)

                // Load the source only once this specific breakpoint instance
                // is close to the viewport. Framer may render hidden copies for
                // Desktop, Tablet, and Phone, but display:none copies will not
                // intersect and therefore will never receive the video URL.
                if (entry.isIntersecting) {
                    setShouldLoadVideo(true)
                }
            },
            { threshold: 0, rootMargin: "100px" }
        )

        observer.observe(containerRef.current)

        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !shouldLoadVideo || !videoRef.current) return

        const videoElement = videoRef.current

        const handleCanPlay = () => {
            if (isInView) {
                videoElement.play().catch(() => {})
            }
        }

        videoElement.addEventListener("canplay", handleCanPlay)

        // The source is assigned lazily, so explicitly initialize it once.
        // This runs only after the visible breakpoint instance intersects.
        if (videoElement.readyState === HTMLMediaElement.HAVE_NOTHING) {
            videoElement.load()
        }

        if (isInView) {
            if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                videoElement.play().catch(() => {})
            }
        } else {
            videoElement.pause()
        }

        return () => {
            videoElement.removeEventListener("canplay", handleCanPlay)
        }
    }, [isInView, isStatic, shouldLoadVideo])

    useEffect(() => {
        return () => {
            const videoElement = videoRef.current

            if (videoElement) {
                videoElement.pause()
                videoElement.removeAttribute("src")
            }
        }
    }, [])

    useLayoutEffect(() => {
        if (isStatic || !containerRef.current || !textRef.current) return

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1,
                },
            })
            timelineRef.current = tl

            tl.fromTo(
                textRef.current,
                { scale: 1 },
                {
                    scale: 160,
                    transformOrigin: "50% 50%",
                    duration: 0.75,
                    ease: "none",
                },
                0
            )

            if (maskLayerRef.current) {
                tl.fromTo(
                    maskLayerRef.current,
                    { opacity: 1 },
                    { opacity: 0, duration: 0.05, ease: "none" },
                    0.7
                )
            }

            const contentRefs = [
                leftContentRef.current,
                rightContentRef.current,
            ].filter(Boolean)
            if (contentRefs.length > 0) {
                tl.fromTo(
                    contentRefs,
                    { opacity: 0, y: 40 },
                    { opacity: 1, y: 0, duration: 0.25, ease: "none" },
                    0.75
                )
            }
        }, containerRef)

        return () => {
            timelineRef.current?.scrollTrigger?.kill()
            timelineRef.current?.kill()
            timelineRef.current = null
            ctx.revert()
        }
    }, [isStatic, maskText])

    const renderButton = () => {
        if (!buttonText || !buttonLink) return null

        const isFilled = buttonStyle === "filled"
        const isOutline = buttonStyle === "outline"
        const isGhost = buttonStyle === "ghost"
        const external = isExternalLink(buttonLink)
        const linkSafetyProps = external
            ? { target: "_blank" as const, rel: "noopener noreferrer" }
            : {}

        const baseStyle: React.CSSProperties = {
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            paddingTop: isGhost ? 0 : paddingY,
            paddingRight: isGhost ? 6 : paddingX,
            paddingBottom: isGhost ? 15 : paddingY,
            paddingLeft: isGhost ? 6 : paddingX,
            background: isFilled ? bgColor : "transparent",
            border: isOutline ? `1px solid ${borderColor}` : "none",
            borderRadius: borderRadius + "px",
            textDecoration: "none",
            fontSize: buttonFont?.fontSize ?? "13px",
            fontWeight: buttonFont?.fontWeight ?? 600,
            letterSpacing: buttonFont?.letterSpacing ?? "0.15em",
            lineHeight: buttonFont?.lineHeight ?? "1em",
            textTransform,
            color: fontColor,
            cursor: "pointer",
            overflow: "hidden",
            pointerEvents: "auto",
            fontFamily: buttonFont?.fontFamily ?? "inherit",
            fontStyle: buttonFont?.fontStyle,
            userSelect: "none",
            WebkitUserSelect: "none",
        }

        if (isStatic) {
            return (
                <a
                    href={buttonLink}
                    aria-label={buttonText}
                    style={baseStyle}
                    {...linkSafetyProps}
                >
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span>{buttonText}</span>
                        {ARROW_SVG}
                    </span>
                </a>
            )
        }

        if (isFilled) {
            return (
                <motion.a
                    href={buttonLink}
                    aria-label={buttonText}
                    {...linkSafetyProps}
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    style={{
                        ...baseStyle,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        isolation: "isolate",
                    }}
                >
                    <motion.div
                        variants={{ rest: { scaleX: 0 }, hover: { scaleX: 1 } }}
                        transition={{
                            duration: 0.38,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: hoverBgColor,
                            borderRadius: borderRadius + "px",
                            originX: 0,
                            zIndex: -1,
                        }}
                        aria-hidden="true"
                    />
                    <motion.span
                        variants={{
                            rest: { color: fontColor },
                            hover: { color: hoverFontColor },
                        }}
                        transition={{ duration: 0.22 }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span>{buttonText}</span>
                        <motion.div
                            variants={{
                                rest: { x: 0, y: 0, rotate: 0 },
                                hover: { x: 4, y: -4, rotate: -45 },
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ display: "flex", alignItems: "center" }}
                            aria-hidden="true"
                        >
                            {ARROW_SVG}
                        </motion.div>
                    </motion.span>
                </motion.a>
            )
        }

        if (isOutline) {
            return (
                <motion.a
                    href={buttonLink}
                    aria-label={buttonText}
                    {...linkSafetyProps}
                    whileHover="hover"
                    initial="rest"
                    animate="rest"
                    variants={{
                        rest: { borderColor },
                        hover: { borderColor: hoverBorderColor },
                    }}
                    transition={{ duration: 0.25 }}
                    style={{
                        ...baseStyle,
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        isolation: "isolate",
                    }}
                >
                    <motion.div
                        variants={{
                            rest: { opacity: 0 },
                            hover: { opacity: 0.1 },
                        }}
                        transition={{ duration: 0.25 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: hoverBgColor,
                            borderRadius: borderRadius + "px",
                            zIndex: -1,
                        }}
                        aria-hidden="true"
                    />
                    <motion.span
                        variants={{
                            rest: { x: 0, color: fontColor },
                            hover: { x: 3, color: hoverFontColor },
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                        }}
                        style={{
                            position: "relative",
                            zIndex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span>{buttonText}</span>
                        <motion.div
                            variants={{
                                rest: { x: 0, y: 0, rotate: 0 },
                                hover: { x: 4, y: -4, rotate: -45 },
                            }}
                            transition={{
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={{ display: "flex", alignItems: "center" }}
                            aria-hidden="true"
                        >
                            {ARROW_SVG}
                        </motion.div>
                    </motion.span>
                </motion.a>
            )
        }

        return (
            <motion.a
                href={buttonLink}
                aria-label={buttonText}
                {...linkSafetyProps}
                whileHover="hover"
                initial="rest"
                animate="rest"
                style={{ ...baseStyle, gap: 6, border: "none" }}
            >
                <motion.span
                    style={{ position: "relative" }}
                    variants={{
                        rest: { color: fontColor },
                        hover: { color: hoverFontColor },
                    }}
                >
                    {buttonText}
                    <motion.span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            bottom: -2,
                            left: 0,
                            height: 1.5,
                            background: "currentColor",
                            borderRadius: 2,
                            originX: 0,
                            width: "100%",
                        }}
                        variants={{
                            rest: { scaleX: 0, opacity: 0.6 },
                            hover: { scaleX: 1, opacity: 1 },
                        }}
                        transition={{
                            type: "tween",
                            ease: [0.22, 1, 0.36, 1],
                            duration: 0.32,
                        }}
                    />
                </motion.span>
                <motion.div
                    aria-hidden="true"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        width: 16,
                        height: 16,
                        position: "relative",
                    }}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            display: "flex",
                            color: fontColor,
                        }}
                        variants={{
                            rest: { x: 0, y: 0, opacity: 1 },
                            hover: { x: 10, y: -10, opacity: 0 },
                        }}
                        transition={{
                            duration: 0.26,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {ARROW_SVG}
                    </motion.div>
                    <motion.div
                        style={{
                            position: "absolute",
                            display: "flex",
                            color: hoverFontColor,
                        }}
                        variants={{
                            rest: { x: -10, y: 10, opacity: 0 },
                            hover: { x: 0, y: 0, opacity: 1 },
                        }}
                        transition={{
                            duration: 0.26,
                            ease: [0.22, 1, 0.36, 1],
                            delay: 0.05,
                        }}
                    >
                        {ARROW_SVG}
                    </motion.div>
                </motion.div>
            </motion.a>
        )
    }

    const renderVideo = () => {
        if (isStatic) {
            return poster ? (
                <img
                    src={poster}
                    alt={posterAlt || ""}
                    aria-hidden={!posterAlt}
                />
            ) : (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        background: maskBackgroundColor || "#050202",
                    }}
                    aria-hidden="true"
                />
            )
        }

        return (
            <video
                ref={videoRef}
                src={shouldLoadVideo ? videoSrc : undefined}
                poster={poster}
                loop
                muted
                playsInline
                preload="none"
                aria-hidden="true"
                tabIndex={-1}
            />
        )
    }

    return (
        <div
            ref={containerRef}
            style={{
                ...containerStyles,
                backgroundColor: containerBackgroundColor || "#050202",
            }}
        >
            <style>{scopedCSS}</style>

            <div className={`${scope}-inner`}>
                <div className={`${scope}-video-container`}>
                    {renderVideo()}
                    <div
                        className={`${scope}-video-overlay`}
                        style={{
                            background: overlayBackground,
                            opacity: overlayOpacity,
                        }}
                    />
                </div>

                <div ref={maskLayerRef} className={`${scope}-svg-mask-layer`}>
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid slice"
                        width="100%"
                        height="100%"
                        style={{
                            display: "block",
                            overflow: "hidden",
                        }}
                    >
                        <defs>
                            <mask id={maskId}>
                                <rect width="100" height="100" fill="#ffffff" />
                                <text
                                    ref={textRef}
                                    x="50%"
                                    y="52%"
                                    dominantBaseline="middle"
                                    textAnchor="middle"
                                    fill="#000000"
                                    style={{
                                        fontFamily:
                                            maskFont?.fontFamily ||
                                            "sans-serif",
                                        fontWeight:
                                            maskFont?.fontWeight || "900",
                                        fontSize:
                                            (maskFont?.fontSize as string) ??
                                            "8px",
                                        letterSpacing: maskFont?.letterSpacing,
                                        fontStyle: maskFont?.style,
                                        textTransform: maskTextTransform,
                                        transformOrigin: "50% 50%",
                                    }}
                                >
                                    {maskText}
                                </text>
                            </mask>
                        </defs>
                        <rect
                            x="-1"
                            y="-1"
                            width="102"
                            height="102"
                            fill={maskBackgroundColor || "#050202"}
                            mask={`url(#${maskId})`}
                        />
                    </svg>
                </div>

                <div
                    ref={leftContentRef}
                    className={`${scope}-ui-content ${scope}-left-side`}
                >
                    <span
                        className={`${scope}-category`}
                        style={{
                            fontFamily: kickerFont?.fontFamily || "inherit",
                            fontWeight: kickerFont?.fontWeight || "600",
                            fontSize: kickerFont?.fontSize,
                            letterSpacing: kickerFont?.letterSpacing,
                            lineHeight: kickerFont?.lineHeight,
                            fontStyle: kickerFont?.style,
                            textTransform: kickerTextTransform,
                            color: kickerColor,
                        }}
                    >
                        {category}
                    </span>
                    <h2
                        style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: headerFont?.fontFamily || "inherit",
                            fontWeight: headerFont?.fontWeight || "800",
                            fontSize: headerFont?.fontSize,
                            letterSpacing: headerFont?.letterSpacing,
                            lineHeight: headerFont?.lineHeight,
                            fontStyle: headerFont?.style,
                            textTransform: headerTextTransform,
                            color: headerColor,
                        }}
                    >
                        {renderStyledHeader(heading)}
                    </h2>
                </div>

                <div
                    ref={rightContentRef}
                    className={`${scope}-ui-content ${scope}-right-side`}
                >
                    <p
                        style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: bodyFont?.fontFamily || "inherit",
                            fontWeight: bodyFont?.fontWeight || "300",
                            fontSize: bodyFont?.fontSize,
                            letterSpacing: bodyFont?.letterSpacing,
                            lineHeight: bodyFont?.lineHeight,
                            fontStyle: bodyFont?.style,
                            textTransform: bodyTextTransform,
                            color: bodyColor,
                        }}
                    >
                        {paragraph}
                    </p>
                    {renderButton()}
                </div>
            </div>
        </div>
    )
}

function getScopedCSS(
    scope: string,
    leftPos: number,
    rightPos: number,
    bottomPos: number,
    leftMaxW: number,
    rightMaxW: number
): string {
    return `
    .${scope}-inner {
      position: sticky;
      top: 0;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      isolation: isolate;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    /*
      Framer Marketplace renders the site inside an iframe whose viewport can
      resolve to fractional CSS pixels. Bleeding these visual layers past the
      component edge prevents a 1px seam from appearing on the right/top edge.
    */
    .${scope}-video-container {
      position: absolute;
      top: -2px;
      right: -2px;
      bottom: -2px;
      left: -2px;
      width: auto;
      height: auto;
      z-index: 1;
      overflow: hidden;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    .${scope}-video-container video,
    .${scope}-video-container img,
    .${scope}-video-container div {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    .${scope}-video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
    }

    .${scope}-svg-mask-layer {
      position: absolute;
      top: -2px;
      right: -2px;
      bottom: -2px;
      left: -2px;
      width: auto;
      height: auto;
      z-index: 3;
      pointer-events: none;
      overflow: hidden;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    .${scope}-svg-mask-layer svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .${scope}-ui-content {
      position: absolute;
      z-index: 4;
      color: #ffffff;
    }

    .${scope}-left-side {
      left: ${leftPos}%;
      bottom: ${bottomPos}%;
      max-width: ${leftMaxW}px;
    }

    .${scope}-category {
      display: inline-block;
      padding: 6px 0;
    }

    .${scope}-left-side h2 {
      font-size: clamp(2rem, 4vw, 3.2rem);
      line-height: 1.1;
      margin-top: 8px;
    }

    .${scope}-right-side {
      right: ${rightPos}%;
      bottom: ${bottomPos}%;
      max-width: ${rightMaxW}px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .${scope}-right-side p {
      line-height: 1.6;
      font-size: 1.05rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .${scope}-inner {
        flex-direction: column;
        justify-content: flex-end;
        align-items: stretch;
        padding: 6vh 5%;
      }

      .${scope}-ui-content {
        position: relative !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        top: auto !important;
        max-width: 100% !important;
        width: 100%;
      }

      .${scope}-left-side { margin-bottom: 16px; }
      .${scope}-left-side h2 { font-size: clamp(1.5rem, 5vw, 2.2rem); }
      .${scope}-right-side p { font-size: 0.95rem; }
    }
`
}

const containerStyles: React.CSSProperties = {
    height: "300dvh",
    position: "relative",
    width: "100%",
}

addPropertyControls(RevealSection, {
    videoSource: {
        type: ControlType.Enum,
        title: "Choose Video Source",
        options: ["upload", "url"],
        optionTitles: ["Upload", "URL"],
        defaultValue: "upload",
        description:
            "Use an uploaded file or paste a direct link to an MP4/WebM video.",
    },
    video: {
        type: ControlType.File,
        title: "Upload Video File",
        allowedFileTypes: ["mp4", "webm", "mov"],
        description: "Choose a video file from your computer.",
        hidden: (props: any) => (props.videoSource ?? "upload") !== "upload",
    },
    videoUrl: {
        type: ControlType.String,
        title: "Video Web Address",
        placeholder: "https://example.com/video.mp4",
        description:
            "Paste a direct link to a video file. YouTube and Vimeo pages are not supported.",
        hidden: (props: any) => (props.videoSource ?? "upload") !== "url",
    },
    poster: {
        type: ControlType.Image,
        title: "Poster Image",
    },
    posterAlt: {
        type: ControlType.String,
        title: "Image Description",
        defaultValue: "",
    },
    maskText: {
        type: ControlType.String,
        title: "Reveal Text",
        defaultValue: "DESIGN",
    },
    category: {
        type: ControlType.String,
        title: "Small Label",
        defaultValue: "CONCEPT LAB",
    },
    heading: {
        type: ControlType.String,
        title: "Main Heading",
        defaultValue: "Form meets function.\nBuilt to inspire.",
        displayTextArea: true,
    },
    paragraph: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "A masterpiece of spatial engineering, featuring sustainable materials and structures that seamlessly blend inside environments with modern architecture.",
        displayTextArea: true,
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Label",
        defaultValue: "Explore Project",
    },
    buttonLink: {
        type: ControlType.Link,
        title: "Button Destination",
    },
    kickerFont: {
        type: ControlType.Font,
        title: "Small Label Style",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 600,
            letterSpacing: 3,
        },
    },
    kickerTextTransform: {
        type: ControlType.Enum,
        title: "Small Label Letter Case",
        options: ["none", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
        defaultValue: "uppercase",
    },
    headerFont: {
        type: ControlType.Font,
        title: "Main Heading Style",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 800,
        },
    },
    headerTextTransform: {
        type: ControlType.Enum,
        title: "Main Heading Letter Case",
        options: ["none", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
        defaultValue: "none",
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Description Style",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 300,
        },
    },
    bodyTextTransform: {
        type: ControlType.Enum,
        title: "Description Letter Case",
        options: ["none", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
        defaultValue: "none",
    },
    maskFont: {
        type: ControlType.Font,
        title: "Reveal Text Style",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 900,
        },
    },
    maskTextTransform: {
        type: ControlType.Enum,
        title: "Reveal Text Letter Case",
        options: ["none", "capitalize", "uppercase", "lowercase"],
        optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
        defaultValue: "none",
    },
    kickerColor: {
        type: ControlType.Color,
        title: "Small Label Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
    },
    headerColor: {
        type: ControlType.Color,
        title: "Main Heading Color",
        defaultValue: "#ffffff",
    },
    bodyColor: {
        type: ControlType.Color,
        title: "Description Color",
        defaultValue: "rgba(255, 255, 255, 0.85)",
    },
    maskBackgroundColor: {
        type: ControlType.Color,
        title: "Reveal Background Color",
        defaultValue: "#050202",
    },
    containerBackgroundColor: {
        type: ControlType.Color,
        title: "Section Background Color",
        defaultValue: "#050202",
    },
    overlayBackground: {
        type: ControlType.String,
        title: "Video Overlay",
        defaultValue:
            "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Video Overlay Strength",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.65,
    },
    layout: {
        type: ControlType.Object,
        title: "Content Positioning",
        controls: {
            leftPosition: {
                type: ControlType.Number,
                title: "Left Content Position",
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 8,
            },
            rightPosition: {
                type: ControlType.Number,
                title: "Right Content Position",
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 8,
            },
            bottomPosition: {
                type: ControlType.Number,
                title: "Content Bottom Spacing",
                min: 0,
                max: 50,
                step: 1,
                unit: "%",
                defaultValue: 12,
            },
            leftMaxWidth: {
                type: ControlType.Number,
                title: "Left Content Width",
                min: 200,
                max: 1000,
                step: 10,
                unit: "px",
                defaultValue: 500,
            },
            rightMaxWidth: {
                type: ControlType.Number,
                title: "Right Content Width",
                min: 200,
                max: 1000,
                step: 10,
                unit: "px",
                defaultValue: 400,
            },
        },
    },
    mainButton: {
        type: ControlType.Object,
        title: "Call-to-Action Button",
        controls: {
            buttonStyle: {
                type: ControlType.Enum,
                title: "Button Appearance",
                options: ["filled", "outline", "ghost"],
                optionTitles: ["Filled", "Outline", "Ghost"],
                defaultValue: "filled",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Button Color",
                defaultValue: "#ffffff",
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") !== "filled",
            },
            font: {
                type: ControlType.Font,
                title: "Button Text Style",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: "13px",
                    letterSpacing: "0.15em",
                    lineHeight: "1em",
                },
            },
            fontColor: {
                type: ControlType.Color,
                title: "Button Text Color",
                defaultValue: "#000000",
            },
            hoverBgColor: {
                type: ControlType.Color,
                title: "Hover Fill Color",
                defaultValue: "rgba(255, 255, 255, 0.85)",
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") === "ghost",
            },
            hoverFontColor: {
                type: ControlType.Color,
                title: "Hover Text Color",
                defaultValue: "#000000",
            },
            buttonBorderColor: {
                type: ControlType.Color,
                title: "Button Border Color",
                defaultValue: "#ffffff",
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") !== "outline",
            },
            buttonHoverBorderColor: {
                type: ControlType.Color,
                title: "Hover Border Color",
                defaultValue: "#ffffff",
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") !== "outline",
            },
            buttonBorderRadius: {
                type: ControlType.Number,
                title: "Roundness",
                min: 0,
                max: 100,
                step: 1,
                unit: "px",
                defaultValue: 100,
            },
            buttonPaddingX: {
                type: ControlType.Number,
                title: "Side Padding",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 28,
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") === "ghost",
            },
            buttonPaddingY: {
                type: ControlType.Number,
                title: "Top and Bottom Padding",
                min: 0,
                max: 60,
                step: 1,
                unit: "px",
                defaultValue: 14,
                hidden: (props: any) =>
                    (props.buttonStyle ?? "filled") === "ghost",
            },
            buttonTextTransform: {
                type: ControlType.Enum,
                title: "Button Letter Case",
                options: ["none", "capitalize", "uppercase", "lowercase"],
                optionTitles: ["None", "Capitalize", "Uppercase", "Lowercase"],
                defaultValue: "uppercase",
            },
        },
    },
})
