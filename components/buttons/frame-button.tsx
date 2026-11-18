import * as React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * @framerDisableUnlink
 */
export default function FrameButton(props) {
    const {
        text = "Explore Works",
        link = "",
        openInNewTab = false,
        showRightIcon = true,
        showLeftIcon = false,
        iconStyle = "arrow",
        showArrowRing = true,
        showBottomLine = false,
        lineColor = "#FFFFFF",
        hoverLineColor = "#FFFFFF",
        padding = "14px 26px",
        borderRadius = 30,
        gap = 10,
        borderWidth = 0,
        borderColor = "#FFFFFF",
        hoverBorderColor = "#FFFFFF",
        typography,
        textColor = "#FFFFFF",
        hoverTextColor = "#000000",
        bgColor = "#000000",
        hoverBgColor = "#FFFFFF",
        duration = 0.55,
        staggerAmount = 0.015,
        showTapFlash = true,
        tapScale = 0.96,
    } = props

    const characters = useMemo(() => text.split(""), [text])
    const ease = [0.16, 1, 0.3, 1] as [number, number, number, number]

    const fontSize = useMemo(() => {
        const rawSize = typography?.fontSize || "15px"
        const parsed = parseFloat(rawSize)
        return isNaN(parsed) ? 15 : parsed
    }, [typography?.fontSize])

    const iconSize = fontSize * 0.9
    const trackHeight = fontSize * 1.5

    // --- arrow presets: each returns just the inner SVG shapes (stroke/fill are
    // inherited from the wrapping <svg>). "Right" is the canonical drawing —
    // the left-side icon reuses the same glyph, mirrored with a CSS transform. ---
    const renderArrowGlyph = (style: string) => {
        switch (style) {
            case "chevron":
                return <polyline points="9 6 15 12 9 18"></polyline>
            case "arrowLong":
                return (
                    <>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <polyline points="15 5 22 12 15 19"></polyline>
                    </>
                )
            case "arrowDiagonal":
                return (
                    <>
                        <line x1="6" y1="18" x2="18" y2="6"></line>
                        <polyline points="8 6 18 6 18 16"></polyline>
                    </>
                )
            case "doubleChevron":
                return (
                    <>
                        <polyline points="6 6 12 12 6 18"></polyline>
                        <polyline points="12 6 18 12 12 18"></polyline>
                    </>
                )
            case "arrow":
            default:
                return (
                    <>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </>
                )
        }
    }

    const ArrowSvg = ({ mirrored }: { mirrored?: boolean }) => (
        <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                display: "block",
                transform: mirrored ? "scaleX(-1)" : undefined,
            }}
        >
            {renderArrowGlyph(iconStyle)}
        </svg>
    )

    // --- static renderer check: the Framer canvas thumbnail and image/PDF
    // exports render components once, with no interaction and no animation
    // loop. Running motion/whileHover/whileTap/setTimeout logic in that
    // context wastes canvas performance and can leave animations frozen
    // mid-transition in exports. When static, skip all of that and return a
    // plain, unanimated element showing the button's resting ("initial")
    // appearance — every hook below this point only matters for the live,
    // interactive render. ---
    const isStatic = useIsStaticRenderer()

    if (isStatic) {
        return (
            <a
                href={link || "#"}
                target={openInNewTab ? "_blank" : "_self"}
                rel={openInNewTab ? "noopener noreferrer" : ""}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: `${gap}px`,
                    padding: padding,
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: bgColor,
                    border: `${borderWidth}px solid ${borderColor}`,
                    textDecoration: "none",
                    overflow: "hidden",
                    color: textColor,
                    ...typography,
                    lineHeight: "1em",
                }}
            >
                {showLeftIcon && (
                    <div
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: `${iconSize * 1.8}px`,
                            height: `${iconSize * 1.8}px`,
                            color: textColor,
                        }}
                    >
                        <ArrowSvg mirrored={true} />
                    </div>
                )}

                <span>{text}</span>

                {showRightIcon && (
                    <div
                        aria-hidden="true"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: `${iconSize * 1.8}px`,
                            height: `${iconSize * 1.8}px`,
                            color: textColor,
                        }}
                    >
                        <ArrowSvg mirrored={false} />
                    </div>
                )}

                {showBottomLine && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "6px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "30%",
                            height: "2px",
                            borderRadius: "1px",
                            backgroundColor: lineColor,
                        }}
                    />
                )}
            </a>
        )
    }

    const routerApi: any = useRouter ? useRouter() : {}
    const { navigate, routes } = routerApi || {}

    const buttonRef = useRef<HTMLAnchorElement>(null)
    const flashTimeout = useRef<ReturnType<typeof setTimeout>>()
    const [isFlashing, setIsFlashing] = useState(false)

    // --- tap feedback: on touch devices there's no hover state to show the button
    // "activated", so a tap plays the same character-wave animation hover already
    // uses (same duration/stagger — nothing new to design), then releases back once
    // the wave has actually finished playing. Mouse/desktop is untouched — hover
    // already does the job there. ---
    const waveRuntime = duration + characters.length * staggerAmount + 0.15

    const triggerFlash = (event: any) => {
        if (!showTapFlash) return
        // A button with a link is about to navigate — the page transition itself
        // is the confirmation. Keeping the multi-element wave animation running
        // while the browser is mid-navigation is what made real link taps feel
        // like they "stuck" for a beat before actually leaving the page, so skip
        // it entirely here. It's still useful for a plain action button with no
        // link, which has no other way to show a tap registered.
        if (link) return
        const pointerType = event?.pointerType
        // Only fire for touch/pen taps — mouse clicks already get the hover state
        if (pointerType && pointerType !== "touch" && pointerType !== "pen") {
            return
        }
        if (flashTimeout.current) clearTimeout(flashTimeout.current)
        setIsFlashing(true)
        flashTimeout.current = setTimeout(() => {
            setIsFlashing(false)
        }, waveRuntime * 1000)
    }

    useEffect(() => {
        return () => {
            if (flashTimeout.current) clearTimeout(flashTimeout.current)
        }
    }, [])

    // --- icon block: the ring + glyph pairing used for both the left and right
    // arrow slots, so both sides always stay in sync on style, ring, and colors ---
    const renderIconBlock = (mirrored: boolean) => (
        <div
            aria-hidden="true"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                width: `${iconSize * 1.8}px`,
                height: `${iconSize * 1.8}px`,
            }}
        >
            {showArrowRing && (
                <motion.div
                    variants={ringVariants}
                    transition={{ duration: duration, ease: ease }}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: "50%",
                        borderWidth: "1.5px",
                        borderStyle: "solid",
                        pointerEvents: "none",
                    }}
                />
            )}

            <motion.div
                variants={iconVariants}
                transition={{ duration: duration, ease: ease }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    zIndex: 1,
                }}
            >
                <ArrowSvg mirrored={mirrored} />
            </motion.div>
        </div>
    )

    const buttonStyle = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: `${gap}px`,
        padding: padding,
        borderRadius: `${borderRadius}px`,
        backgroundColor: bgColor,
        border: `${borderWidth}px solid ${borderColor}`,
        textDecoration: "none",
        cursor: "pointer",
        outline: "none",
        overflow: "hidden",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        ...typography,
        lineHeight: "1em",
    }

    const containerVariants = {
        initial: { backgroundColor: bgColor, borderColor: borderColor },
        hover: { backgroundColor: hoverBgColor, borderColor: hoverBorderColor },
    }

    const iconVariants = {
        initial: { color: textColor },
        hover: { color: hoverTextColor },
    }

    const ringVariants = {
        initial: { scale: 0.6, opacity: 0, borderColor: textColor },
        hover: { scale: 1, opacity: 0.25, borderColor: hoverTextColor },
    }

    const lineVariants = {
        initial: { width: "30%", backgroundColor: lineColor },
        hover: { width: "100%", backgroundColor: hoverLineColor },
    }

    // --- scroll helper: polls for the target element until it exists, then scrolls ---
    const scrollToHashWithRetry = (hash: string) => {
        if (!hash) return
        let attempts = 0
        const maxAttempts = 40 // ~2s total at 50ms intervals
        const tryScroll = () => {
            const el = document.getElementById(hash)
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" })
            } else if (attempts < maxAttempts) {
                attempts++
                setTimeout(tryScroll, 50)
            }
        }
        tryScroll()
    }

    return (
        <motion.a
            ref={buttonRef}
            href={link || "#"}
            target={openInNewTab ? "_blank" : "_self"}
            rel={openInNewTab ? "noopener noreferrer" : ""}
            aria-label={text}
            style={buttonStyle}
            initial="initial"
            animate={isFlashing ? "hover" : "initial"}
            whileHover="hover"
            variants={containerVariants}
            transition={{ duration: duration, ease: ease }}
            whileTap={{
                scale: tapScale,
                transition: { duration: 0.12, ease: "easeOut" },
            }}
            onTapStart={triggerFlash}
            onClick={(e) => {
                if (!link) {
                    e.preventDefault()
                    return
                }

                try {
                    const hashIndex = link.indexOf("#")
                    const hasHash = hashIndex !== -1
                    const path = hasHash ? link.slice(0, hashIndex) : link
                    const hash = hasHash ? link.slice(hashIndex + 1) : ""

                    // Same-page hash link: let native anchor scrolling handle it (already works)
                    if (hasHash && path === "") {
                        return
                    }

                    // Cross-page link (with or without hash): match the PATH portion
                    // against route paths — this is the actual bug fix, since routes
                    // are stored without the hash and the old code compared the full
                    // "link" string (including "#section") against route.path.
                    const matchId =
                        routes &&
                        Object.keys(routes).find(
                            (id) => routes[id]?.path === path
                        )

                    if (matchId && navigate) {
                        e.preventDefault()
                        navigate(matchId)

                        if (hash) {
                            // New page needs a moment to mount before the target
                            // section exists in the DOM, so poll for it.
                            setTimeout(() => scrollToHashWithRetry(hash), 50)
                        }
                    }
                    // no match → fall through to native href (full page navigation)
                } catch {
                    // useRouter is undocumented — fallback to native href
                }
            }}
        >
            {showLeftIcon && renderIconBlock(true)}

            <div
                aria-hidden="true"
                style={{
                    display: "flex",
                    alignItems: "center",
                    height: `${trackHeight}px`,
                }}
            >
                {characters.map((char, index) => (
                    <span
                        key={index}
                        style={{
                            position: "relative",
                            display: "inline-flex",
                            alignItems: "center",
                            overflow: "hidden",
                            height: `${trackHeight}px`,
                            lineHeight: "1em",
                        }}
                    >
                        <motion.span
                            variants={{
                                initial: { y: 0 },
                                hover: { y: -trackHeight },
                            }}
                            transition={{
                                duration: duration,
                                ease: ease,
                                delay: index * staggerAmount,
                            }}
                            style={{
                                display: "inline-block",
                                lineHeight: "1em",
                                color: textColor,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>

                        <motion.span
                            variants={{
                                initial: { y: trackHeight },
                                hover: { y: 0 },
                            }}
                            transition={{
                                duration: duration,
                                ease: ease,
                                delay: index * staggerAmount,
                            }}
                            style={{
                                position: "absolute",
                                left: 0,
                                display: "inline-block",
                                lineHeight: "1em",
                                color: hoverTextColor,
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </motion.span>
                    </span>
                ))}
            </div>

            {showRightIcon && renderIconBlock(false)}

            {showBottomLine && (
                <motion.div
                    variants={lineVariants}
                    transition={{ duration: duration, ease: ease }}
                    style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "50%",
                        x: "-50%",
                        height: "2px",
                        borderRadius: "1px",
                    }}
                />
            )}
        </motion.a>
    )
}

addPropertyControls(FrameButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Explore Works",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    showRightIcon: {
        type: ControlType.Boolean,
        title: "Right Arrow",
        defaultValue: true,
    },
    showLeftIcon: {
        type: ControlType.Boolean,
        title: "Left Arrow",
        defaultValue: false,
    },
    iconStyle: {
        type: ControlType.Enum,
        title: "Icon Style",
        options: [
            "arrow",
            "chevron",
            "arrowLong",
            "arrowDiagonal",
            "doubleChevron",
        ],
        optionTitles: [
            "Straight Arrow",
            "Chevron",
            "Long Arrow",
            "Diagonal Arrow",
            "Double Chevron",
        ],
        defaultValue: "arrow",
        hidden: (props) => !props.showRightIcon && !props.showLeftIcon,
    },
    showArrowRing: {
        type: ControlType.Boolean,
        title: "Arrow Ring",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => !props.showRightIcon && !props.showLeftIcon,
    },
    showBottomLine: {
        type: ControlType.Boolean,
        title: "Bottom Line",
        defaultValue: false,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        group: "Padding & Radius",
        defaultValue: "14px 26px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        group: "Padding & Radius",
        min: 0,
        defaultValue: 30,
    },
    gap: {
        type: ControlType.Number,
        title: "Icon Spacing",
        group: "Padding & Radius",
        min: 0,
        defaultValue: 10,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        group: "Colors",
        defaultValue: "#FFFFFF",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Text Hover",
        group: "Colors",
        defaultValue: "#000000",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        group: "Colors",
        defaultValue: "#000000",
    },
    hoverBgColor: {
        type: ControlType.Color,
        title: "BG Hover",
        group: "Colors",
        defaultValue: "#FFFFFF",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Width",
        group: "Borders",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 0,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        group: "Borders",
        defaultValue: "#FFFFFF",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Border Hover",
        group: "Borders",
        defaultValue: "#FFFFFF",
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        group: "Line Settings",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showBottomLine,
    },
    hoverLineColor: {
        type: ControlType.Color,
        title: "Line Hover",
        group: "Line Settings",
        defaultValue: "#FFFFFF",
        hidden: (props) => !props.showBottomLine,
    },
    typography: {
        type: ControlType.Font,
        title: "Font Settings",
        group: "Typography",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "15px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
        },
    },
    duration: {
        type: ControlType.Number,
        title: "Speed (s)",
        group: "Motion",
        min: 0.1,
        step: 0.05,
        defaultValue: 0.55,
    },
    staggerAmount: {
        type: ControlType.Number,
        title: "Wave Delay",
        group: "Motion",
        min: 0,
        max: 0.1,
        step: 0.005,
        defaultValue: 0.015,
    },
    showTapFlash: {
        type: ControlType.Boolean,
        title: "Tap Animates",
        group: "Tap Feedback",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    tapScale: {
        type: ControlType.Number,
        title: "Press Scale",
        group: "Tap Feedback",
        min: 0.85,
        max: 1,
        step: 0.01,
        defaultValue: 0.96,
        description:
            "Get more Framer components at [Integry](https://integry.framer.ai/).",
    },
})
