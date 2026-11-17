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

import { motion, useAnimation, useInView } from "framer-motion"

interface Props {
    // Text & font
    text: string
    textRepeat: number
    textSeparator: string
    textColor: string
    fontSize: number
    letterSpacing: number
    font: string | { fontFamily?: string; [key: string]: any }

    // Icon
    arrowColor: string
    arrowSize: number
    arrowBounce: number
    iconType:
        | "arrow"
        | "chevron"
        | "doubleChevron"
        | "mouse"
        | "circleArrow"
        | "custom"
        | "uploadedSvg"
    iconStrokeWidth: number
    customIcon: string
    uploadedSvg: string | { src: string } | undefined

    // Layout
    layout: "circularText" | "vertical" | "minimal" | "badge"
    size: number
    gap: number
    opacity: number
    textPosition: "top" | "bottom"

    // Badge
    badgeBackgroundColor: string
    badgeBorderColor: string
    badgeBorderWidth: number

    // Rotation
    rotationDuration: number
    scrollDirection: "down" | "up"
    scrollLinkMovement: boolean
    scrollLinkAmplitude: number
    hoverPause: boolean
    hoverReverse: boolean

    // Scroll-aware behaviour
    hideOnScroll: boolean
    hideAfterPx: number

    // Entrance animation
    entranceAnimation: "none" | "fadeIn" | "fadeUp" | "fadeDown" | "scale"
    entranceDelay: number
    entranceDuration: number

    // Click
    sectionId: string
    link: string
}
/**
 * @framerDisableUnlink
 */
export default function ScrollIndicator(props: Props) {
    const {
        text,
        textRepeat,
        textSeparator,
        textColor,
        fontSize,
        letterSpacing,
        font,
        arrowColor,
        arrowSize,
        arrowBounce,
        iconType,
        iconStrokeWidth,
        customIcon,
        uploadedSvg,
        layout,
        size,
        gap,
        opacity,
        textPosition,
        badgeBackgroundColor,
        badgeBorderColor,
        badgeBorderWidth,
        rotationDuration,
        scrollDirection,
        scrollLinkMovement,
        scrollLinkAmplitude,
        hoverPause,
        hoverReverse,
        hideOnScroll,
        hideAfterPx,
        entranceAnimation,
        entranceDelay,
        entranceDuration,
        sectionId,
        link,
    } = props

    const pathId = React.useId()
    // Sanitized variant of pathId for use as a CSS class selector — useId()
    // can emit characters like ":" which are invalid/unescaped in selectors.
    const safeId = pathId.replace(/[^a-zA-Z0-9]/g, "")
    const isStatic = useIsStaticRenderer()
    const rotationControls = useAnimation()

    // ── Viewport visibility ───────────────────────────────────────────────────
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(wrapperRef, { amount: 0.1 })
    const shouldAnimate = !isStatic && isInView

    // ── Derived values ────────────────────────────────────────────────────────
    const fontFamilyValue =
        typeof font === "string" ? font : font?.fontFamily || "Inter"
    const isUp = scrollDirection === "up"

    const repeatedText = React.useMemo(() => {
        const segment = `${text} ${textSeparator} `
        return Array(Math.max(1, textRepeat)).fill(segment).join("")
    }, [text, textSeparator, textRepeat])

    // ── Hover state ───────────────────────────────────────────────────────────
    const [isHovered, setIsHovered] = React.useState(false)

    // ── Scroll-aware visibility ───────────────────────────────────────────────
    const [scrolledPast, setScrolledPast] = React.useState(false)

    React.useEffect(() => {
        if (!hideOnScroll || typeof window === "undefined") return

        const onScroll = () => {
            setScrolledPast(window.scrollY > hideAfterPx)
        }

        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [hideOnScroll, hideAfterPx])

    // ── Rotation animation ────────────────────────────────────────────────────
    React.useEffect(() => {
        if (isStatic) return

        if (!isInView) {
            rotationControls.stop()
            return
        }

        const baseDir = isUp ? -1 : 1
        const dir = hoverReverse && isHovered ? -baseDir : baseDir

        if (hoverPause && isHovered) {
            rotationControls.stop()
        } else {
            rotationControls.start({
                rotate: [null, dir * 360],
                transition: {
                    duration: rotationDuration,
                    repeat: Infinity,
                    ease: "linear",
                },
            })
        }
    }, [
        isHovered,
        hoverPause,
        hoverReverse,
        isUp,
        rotationDuration,
        isStatic,
        rotationControls,
        isInView,
    ])

    // ── Entrance animation variants ───────────────────────────────────────────
    const entranceVariants: Record<
        string,
        { hidden: object; visible: object }
    > = {
        none: {
            hidden: { opacity: 1, y: 0, scale: 1 },
            visible: { opacity: 1, y: 0, scale: 1 },
        },
        fadeIn: {
            hidden: { opacity: 0 },
            visible: { opacity: opacity },
        },
        fadeUp: {
            hidden: { opacity: 0, y: 24 },
            visible: { opacity: opacity, y: 0 },
        },
        fadeDown: {
            hidden: { opacity: 0, y: -24 },
            visible: { opacity: opacity, y: 0 },
        },
        scale: {
            hidden: { opacity: 0, scale: 0.6 },
            visible: { opacity: opacity, scale: 1 },
        },
    }

    const chosen = entranceVariants[entranceAnimation] ?? entranceVariants.none

    // ── Click / keyboard ──────────────────────────────────────────────────────
    const handleClick = (event?: React.MouseEvent<HTMLElement>) => {
        event?.preventDefault()

        if (typeof window === "undefined" || typeof document === "undefined")
            return

        const cleanId = sectionId.trim().replace(/^#/, "")
        const topAliases = ["top", "first-section", "home"]

        // For an upward indicator, these values always mean the absolute
        // beginning of the page. This also works when the first Framer
        // section does not expose a usable DOM id.
        if (isUp && (!cleanId || topAliases.includes(cleanId.toLowerCase()))) {
            window.scrollTo({ top: 0, behavior: "smooth" })
            return
        }

        const target = cleanId ? document.getElementById(cleanId) : null

        if (target) {
            const targetTop =
                target.getBoundingClientRect().top + window.scrollY

            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: "smooth",
            })
            return
        }

        // Safe fallback for a scroll-up indicator when Framer cannot find
        // the configured section id.
        if (isUp) {
            window.scrollTo({ top: 0, behavior: "smooth" })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
        }
    }

    // ── Icon renderer ─────────────────────────────────────────────────────────
    const renderIcon = () => {
        switch (iconType) {
            case "chevron":
                return (
                    <svg
                        width={arrowSize}
                        height={arrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isUp ? "rotate(180deg)" : undefined,
                        }}
                    >
                        <path
                            d="M5 9l7 7 7-7"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )

            case "doubleChevron":
                return (
                    <svg
                        width={arrowSize}
                        height={arrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isUp ? "rotate(180deg)" : undefined,
                        }}
                    >
                        <path
                            d="M5 6l7 7 7-7"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M5 13l7 7 7-7"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )

            case "mouse":
                return (
                    <svg
                        width={arrowSize}
                        height={arrowSize * 1.6}
                        viewBox="0 0 24 38"
                        fill="none"
                        style={{
                            transform: isUp ? "rotate(180deg)" : undefined,
                        }}
                    >
                        <rect
                            x="1"
                            y="1"
                            width="22"
                            height="36"
                            rx="11"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                        />
                        <motion.rect
                            animate={
                                shouldAnimate
                                    ? { y: [6, 14, 6], opacity: [1, 0, 1] }
                                    : undefined
                            }
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            x="10"
                            y="6"
                            width="4"
                            height="8"
                            rx="2"
                            fill={arrowColor}
                        />
                    </svg>
                )

            case "circleArrow":
                return (
                    <svg
                        width={arrowSize}
                        height={arrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{
                            transform: isUp ? "rotate(180deg)" : undefined,
                        }}
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10.5"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                        />
                        <path
                            d="M8 11l4 4 4-4"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M12 7v8"
                            stroke={arrowColor}
                            strokeWidth={iconStrokeWidth}
                            strokeLinecap="round"
                        />
                    </svg>
                )

            case "uploadedSvg": {
                const svgSrc =
                    typeof uploadedSvg === "string"
                        ? uploadedSvg
                        : uploadedSvg?.src
                if (!svgSrc) return null

                return (
                    <div
                        style={{
                            width: arrowSize,
                            height: arrowSize,
                            position: "relative",
                            transform: isUp ? "rotate(180deg)" : undefined,
                        }}
                    >
                        <style>{`
                            .mask-fallback-${safeId} { display: none; }
                            @supports not (
                                (-webkit-mask-image: none) or (mask-image: none)
                            ) {
                                .mask-fallback-${safeId} { display: block; }
                                .mask-primary-${safeId} { display: none; }
                            }
                        `}</style>
                        <div
                            className={`mask-primary-${safeId}`}
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: arrowColor,
                                WebkitMaskImage: `url(${svgSrc})`,
                                maskImage: `url(${svgSrc})`,
                                WebkitMaskRepeat: "no-repeat",
                                maskRepeat: "no-repeat",
                                WebkitMaskSize: "contain",
                                maskSize: "contain",
                                WebkitMaskPosition: "center",
                                maskPosition: "center",
                            }}
                        />
                        <img
                            className={`mask-fallback-${safeId}`}
                            src={svgSrc}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                )
            }

            case "custom":
                return (
                    <span
                        style={{
                            fontSize: arrowSize,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: arrowColor,
                        }}
                    >
                        {customIcon}
                    </span>
                )

            case "arrow":
            default:
                return (
                    <span
                        style={{
                            fontSize: arrowSize,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: arrowColor,
                        }}
                    >
                        {isUp ? "↑" : "↓"}
                    </span>
                )
        }
    }

    // ── Bouncing icon wrapper ─────────────────────────────────────────────────
    const bounceY = isUp ? [0, -arrowBounce, 0] : [0, arrowBounce, 0]

    const bouncingIcon = (
        <motion.div
            animate={shouldAnimate ? { y: bounceY } : undefined}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                userSelect: "none",
            }}
        >
            {renderIcon()}
        </motion.div>
    )

    // ── Link & Click logic ────────────────────────────────────────────────────
    const hasLink = Boolean(link)
    const hasSection = Boolean(sectionId)
    const isClickable = hasLink || hasSection

    const cleanSectionId = sectionId.trim().replace(/^#/, "")
    const isTopTarget =
        isUp &&
        (!cleanSectionId ||
            ["top", "first-section", "home"].includes(
                cleanSectionId.toLowerCase()
            ))

    const href = hasLink
        ? link
        : hasSection && !isTopTarget
          ? `#${cleanSectionId}`
          : undefined

    // SVG text and icon-only content are not consistently exposed as an
    // accessible name for links. Give the interactive wrapper an explicit,
    // human-readable label without changing the visual design.
    const accessibleLabel = isUp
        ? "Scroll to top"
        : text?.trim()
          ? text.trim()
          : "Scroll down"

    // ── Shared outer wrapper (entrance + scroll-hide + hover events) ──────────
    const outerStyle: React.CSSProperties = {
        cursor: isClickable ? "pointer" : "default",
        opacity: entranceAnimation === "none" ? opacity : undefined,
        // Once faded out for scroll, also stop intercepting clicks/keys.
        pointerEvents: scrolledPast ? "none" : undefined,
        textDecoration: "none", // Prevents underline on <a> tags
        display: isClickable ? "block" : undefined, // Keeps <a> tag behaving like a block <div>
    }

    const wrapWithEntrance = (children: React.ReactNode) => {
        // Use motion.a if clickable, otherwise fallback to motion.div
        const Component: any = isClickable ? motion.a : motion.div

        return (
            <Component
                ref={wrapperRef}
                href={href}
                aria-label={isClickable ? accessibleLabel : undefined}
                initial={isStatic ? false : "hidden"}
                animate={scrolledPast ? "hiddenOnScroll" : "visible"}
                variants={{
                    ...chosen,
                    hiddenOnScroll: {
                        opacity: 0,
                        transition: { duration: 0.4, ease: "easeOut" },
                    },
                }}
                transition={{
                    duration: entranceDuration,
                    delay: entranceDelay,
                    ease: "easeOut",
                }}
                onClick={hasSection ? handleClick : undefined}
                onKeyDown={hasSection ? handleKeyDown : undefined}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                role={isClickable && !hasLink ? "button" : undefined}
                tabIndex={isClickable ? 0 : -1}
                style={outerStyle}
            >
                {children}
            </Component>
        )
    }

    // ── Layouts ───────────────────────────────────────────────────────────────
    if (layout === "minimal") {
        return wrapWithEntrance(
            <div
                style={{
                    width: size,
                    height: size,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {bouncingIcon}
            </div>
        )
    }

    if (layout === "vertical") {
        return wrapWithEntrance(
            <div
                style={{
                    width: size,
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap,
                }}
            >
                {textPosition === "top" && text && (
                    <span
                        style={{
                            fontFamily: fontFamilyValue,
                            fontSize,
                            letterSpacing,
                            textTransform: "uppercase",
                            color: textColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text}
                    </span>
                )}

                {bouncingIcon}

                {textPosition === "bottom" && text && (
                    <span
                        style={{
                            fontFamily: fontFamilyValue,
                            fontSize,
                            letterSpacing,
                            textTransform: "uppercase",
                            color: textColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text}
                    </span>
                )}
            </div>
        )
    }

    if (layout === "badge") {
        return wrapWithEntrance(
            <div
                style={{
                    width: size,
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap,
                }}
            >
                {textPosition === "top" && text && (
                    <span
                        style={{
                            fontFamily: fontFamilyValue,
                            fontSize,
                            letterSpacing,
                            textTransform: "uppercase",
                            color: textColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text}
                    </span>
                )}

                <motion.div
                    animate={shouldAnimate ? { y: bounceY } : undefined}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    style={{
                        width: arrowSize * 2.2,
                        height: arrowSize * 2.2,
                        borderRadius: "50%",
                        backgroundColor: badgeBackgroundColor,
                        border: `${badgeBorderWidth}px solid ${badgeBorderColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                >
                    {renderIcon()}
                </motion.div>

                {textPosition === "bottom" && text && (
                    <span
                        style={{
                            fontFamily: fontFamilyValue,
                            fontSize,
                            letterSpacing,
                            textTransform: "uppercase",
                            color: textColor,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {text}
                    </span>
                )}
            </div>
        )
    }

    // ── circularText (default) ────────────────────────────────────────────────
    const linkMovementAnimate = shouldAnimate
        ? {
              ...(scrollLinkMovement && {
                  y: [0, (isUp ? -1 : 1) * scrollLinkAmplitude, 0],
              }),
          }
        : undefined

    const linkMovementTransition = scrollLinkMovement
        ? { y: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }
        : {}

    return wrapWithEntrance(
        <div
            style={{
                width: size,
                height: size,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "visible",
            }}
        >
            {/* Rotating text ring — driven by useAnimation for hover pause/reverse */}
            <motion.svg
                viewBox="0 0 200 200"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
                animate={isStatic ? undefined : rotationControls}
            >
                <path
                    id={pathId}
                    d="M 100,100 m -75,0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
                    fill="none"
                />
                <text
                    style={{
                        fontFamily: fontFamilyValue,
                        fontSize,
                        letterSpacing,
                        textTransform: "uppercase",
                        fill: textColor,
                    }}
                >
                    <textPath href={`#${pathId}`} startOffset="0%">
                        {repeatedText}
                    </textPath>
                </text>
            </motion.svg>

            {/* Centre icon with optional scroll-link drift */}
            <motion.div
                animate={linkMovementAnimate}
                transition={linkMovementTransition}
                style={{ position: "absolute" }}
            >
                {bouncingIcon}
            </motion.div>
        </div>
    )
}

// ── Defaults ──────────────────────────────────────────────────────────────────
ScrollIndicator.defaultProps = {
    text: "SCROLL DOWN",
    textRepeat: 3,
    textSeparator: "•",
    textColor: "#000000",
    fontSize: 16,
    letterSpacing: 2,
    font: "Inter",
    arrowColor: "#000000",
    arrowSize: 32,
    arrowBounce: 10,
    iconType: "arrow",
    iconStrokeWidth: 2,
    customIcon: "↓",
    uploadedSvg: undefined,
    layout: "circularText",
    size: 200,
    gap: 12,
    opacity: 1,
    textPosition: "bottom",
    badgeBackgroundColor: "#F2F2F2",
    badgeBorderColor: "#000000",
    badgeBorderWidth: 0,
    rotationDuration: 10,
    scrollDirection: "down",
    scrollLinkMovement: true,
    scrollLinkAmplitude: 8,
    hoverPause: true,
    hoverReverse: false,
    hideOnScroll: false,
    hideAfterPx: 120,
    entranceAnimation: "fadeUp",
    entranceDelay: 0.4,
    entranceDuration: 0.7,
    sectionId: "",
    link: "",
}

// ── Property controls ─────────────────────────────────────────────────────────
addPropertyControls(ScrollIndicator, {
    // ── Layout ────────────────────────────────────────────────────────────────
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["circularText", "vertical", "minimal", "badge"],
        optionTitles: [
            "Circular Text",
            "Vertical Stack",
            "Minimal (Icon Only)",
            "Badge",
        ],
    },

    scrollDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["down", "up"],
        optionTitles: ["Scroll Down", "Scroll Up"],
        displaySegmentedControl: true,
    },

    size: {
        type: ControlType.Number,
        title: "Size",
        min: 100,
        max: 600,
        unit: "px",
    },

    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.05,
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 60,
        unit: "px",
        hidden: (props) =>
            props.layout !== "vertical" && props.layout !== "badge",
    },

    textPosition: {
        type: ControlType.Enum,
        title: "Text Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
        hidden: (props) =>
            props.layout !== "vertical" && props.layout !== "badge",
    },

    // ── Text ──────────────────────────────────────────────────────────────────
    text: {
        type: ControlType.String,
        title: "Text",
        hidden: (props) => props.layout === "minimal",
    },

    textRepeat: {
        type: ControlType.Number,
        title: "Repeat",
        min: 1,
        max: 10,
        step: 1,
        description: "How many times the text segment repeats around the ring.",
        hidden: (props) => props.layout !== "circularText",
    },

    textSeparator: {
        type: ControlType.String,
        title: "Separator",
        placeholder: "•",
        hidden: (props) => props.layout !== "circularText",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text Color",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        min: 8,
        max: 60,
        unit: "px",
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 0,
        max: 20,
    },

    // ── Icon ──────────────────────────────────────────────────────────────────
    iconType: {
        type: ControlType.Enum,
        title: "Icon Style",
        options: [
            "arrow",
            "chevron",
            "doubleChevron",
            "mouse",
            "circleArrow",
            "custom",
            "uploadedSvg",
        ],
        optionTitles: [
            "Arrow",
            "Chevron",
            "Double Chevron",
            "Mouse",
            "Circle Arrow",
            "Custom Text",
            "Upload SVG",
        ],
    },

    customIcon: {
        type: ControlType.String,
        title: "Custom Icon",
        placeholder: "↓",
        hidden: (props) => props.iconType !== "custom",
    },

    uploadedSvg: {
        type: ControlType.File,
        title: "SVG File",
        allowedFileTypes: ["svg"],
        hidden: (props) => props.iconType !== "uploadedSvg",
    },

    iconStrokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 1,
        max: 6,
        step: 0.5,
        hidden: (props) =>
            props.iconType === "arrow" ||
            props.iconType === "custom" ||
            props.iconType === "uploadedSvg",
    },

    arrowColor: {
        type: ControlType.Color,
        title: "Icon Color",
    },

    arrowSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 100,
        unit: "px",
    },

    arrowBounce: {
        type: ControlType.Number,
        title: "Bounce",
        min: 0,
        max: 50,
        unit: "px",
    },

    // ── Badge ─────────────────────────────────────────────────────────────────
    badgeBackgroundColor: {
        type: ControlType.Color,
        title: "Badge Background",
        hidden: (props) => props.layout !== "badge",
    },

    badgeBorderColor: {
        type: ControlType.Color,
        title: "Badge Border",
        hidden: (props) => props.layout !== "badge",
    },

    badgeBorderWidth: {
        type: ControlType.Number,
        title: "Badge Border Width",
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
        hidden: (props) => props.layout !== "badge",
    },

    // ── Rotation & hover ──────────────────────────────────────────────────────
    rotationDuration: {
        type: ControlType.Number,
        title: "Rotation Speed",
        min: 1,
        max: 60,
        step: 1,
        unit: "s",
        hidden: (props) => props.layout !== "circularText",
    },

    hoverPause: {
        type: ControlType.Boolean,
        title: "Pause on Hover",
        defaultValue: true,
        hidden: (props) => props.layout !== "circularText",
    },

    hoverReverse: {
        type: ControlType.Boolean,
        title: "Reverse on Hover",
        defaultValue: false,
        hidden: (props) => props.layout !== "circularText",
    },

    // ── Scroll-link movement ──────────────────────────────────────────────────
    scrollLinkMovement: {
        type: ControlType.Boolean,
        title: "Link Movement",
        defaultValue: true,
        hidden: (props) => props.layout !== "circularText",
    },

    scrollLinkAmplitude: {
        type: ControlType.Number,
        title: "Movement Amount",
        min: 2,
        max: 30,
        step: 1,
        unit: "px",
        hidden: (props) =>
            props.layout !== "circularText" || !props.scrollLinkMovement,
    },

    // ── Scroll-aware hide ─────────────────────────────────────────────────────
    hideOnScroll: {
        type: ControlType.Boolean,
        title: "Hide on Scroll",
        defaultValue: false,
        description: "Fades out once the user scrolls past a threshold.",
    },

    hideAfterPx: {
        type: ControlType.Number,
        title: "Hide After",
        min: 0,
        max: 2000,
        step: 10,
        unit: "px",
        hidden: (props) => !props.hideOnScroll,
    },

    // ── Entrance animation ────────────────────────────────────────────────────
    entranceAnimation: {
        type: ControlType.Enum,
        title: "Entrance",
        options: ["none", "fadeIn", "fadeUp", "fadeDown", "scale"],
        optionTitles: ["None", "Fade In", "Fade Up", "Fade Down", "Scale"],
    },

    entranceDelay: {
        type: ControlType.Number,
        title: "Entrance Delay",
        min: 0,
        max: 5,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.entranceAnimation === "none",
    },

    entranceDuration: {
        type: ControlType.Number,
        title: "Entrance Duration",
        min: 0.1,
        max: 3,
        step: 0.1,
        unit: "s",
        hidden: (props) => props.entranceAnimation === "none",
    },

    // ── Click target ──────────────────────────────────────────────────────────
    sectionId: {
        type: ControlType.String,
        title: "Scroll To",
        placeholder: "#section-id",
        description:
            "ID of the section to scroll to on click (e.g. #section or section).",
    },

    link: {
        type: ControlType.Link,
        title: "Link",
        description: "URL to navigate to when clicked.",
    },
})
