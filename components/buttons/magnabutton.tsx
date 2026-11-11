import { useRef, useEffect, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface FontStyle {
    fontSize?: string
    fontWeight?: number | string
    fontFamily?: string
    fontStyle?: string
    letterSpacing?: string
    lineHeight?: string
    textAlign?: "left" | "center" | "right"
    variant?: string
}

interface MagnaButtonProps {
    label: string
    radius: number
    strength: number
    background: string
    textColor: string
    borderRadius: number
    font: FontStyle
    padding: string
    textTransform: "none" | "uppercase" | "lowercase" | "capitalize"
    link: { href: string; target?: string; url?: string } | string
    openInNewTab: boolean
    onClick?: () => void
    iconSize: number
    customIcon: string
    ariaLabel: string
    iconPosition: "left" | "right"
    iconGap: number
}

export default function MagnaButton(props: MagnaButtonProps) {
    const {
        label = "Click Me",
        link,
        openInNewTab = false,
        radius = 120,
        strength = 0.4,
        background = "#000000",
        textColor = "#FFFFFF",
        borderRadius = 8,
        font = {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
        padding = "12px 24px",
        textTransform = "none",
        onClick,
        iconSize = 16,
        customIcon = "",
        ariaLabel = "",
        iconPosition = "left",
        iconGap = 8,
    } = props

    const buttonRef = useRef<HTMLButtonElement>(null)
    const anchorRef = useRef<HTMLAnchorElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const clickScale = useMotionValue(1)
    const isHovered = useRef(false)
    const isVisible = useRef(true)
    const isStatic = useIsStaticRenderer()
    const timeoutRef = useRef<number | null>(null)

    const springX = useSpring(x, { stiffness: 150, damping: 15 })
    const springY = useSpring(y, { stiffness: 150, damping: 15 })
    const springClickScale = useSpring(clickScale, {
        stiffness: 400,
        damping: 20,
    })

    const handleMouseMove = useCallback(
        (event: PointerEvent) => {
            if (!isHovered.current || !isVisible.current) return

            const currentRef = anchorRef.current || buttonRef.current
            if (!currentRef) return

            const rect = currentRef.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const distanceX = event.clientX - centerX
            const distanceY = event.clientY - centerY
            const distance = Math.sqrt(
                distanceX * distanceX + distanceY * distanceY
            )

            if (distance < radius) {
                const magnetX = distanceX * strength
                const magnetY = distanceY * strength
                x.set(magnetX)
                y.set(magnetY)
            } else {
                x.set(0)
                y.set(0)
            }
        },
        [radius, strength, x, y]
    )

    const handleMouseEnter = useCallback(() => {
        isHovered.current = true
        const currentRef = anchorRef.current || buttonRef.current
        if (currentRef && isVisible.current) {
            currentRef.addEventListener("pointermove", handleMouseMove as any)
        }
    }, [handleMouseMove])

    const handleMouseLeave = useCallback(() => {
        isHovered.current = false
        x.set(0)
        y.set(0)
        const currentRef = anchorRef.current || buttonRef.current
        if (currentRef) {
            currentRef.removeEventListener(
                "pointermove",
                handleMouseMove as any
            )
        }
    }, [x, y, handleMouseMove])

    const handleClick = useCallback(() => {
        // Clear any existing timeout
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
        }

        clickScale.set(0.92)
        timeoutRef.current = window.setTimeout(() => {
            clickScale.set(1)
            timeoutRef.current = null
        }, 100)
        if (onClick) {
            onClick()
        }
    }, [clickScale, onClick])

    const getHref = (
        linkValue:
            | { href: string; target?: string; url?: string }
            | string
            | undefined
    ): string => {
        if (!linkValue) return ""
        if (typeof linkValue === "string") {
            // If it's a string, ensure external links have protocol
            if (
                linkValue &&
                !linkValue.startsWith("http") &&
                !linkValue.startsWith("/") &&
                !linkValue.startsWith("#")
            ) {
                return "https://" + linkValue
            }
            return linkValue
        }
        // Handle Framer Link object - it might have href, url, or webUrl
        const url = linkValue.href || linkValue.url || ""
        return url
    }

    const getTarget = (): string | undefined => {
        if (!link) return undefined
        if (openInNewTab) return "_blank"
        if (typeof link === "object" && link.target) return link.target
        return undefined
    }

    useEffect(() => {
        if (isStatic) return

        const currentRef = anchorRef.current || buttonRef.current
        if (!currentRef) return

        // Set up IntersectionObserver to track visibility
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisible.current = entry.isIntersecting

                    // If element goes offscreen while hovered, clean up listener
                    if (!entry.isIntersecting && isHovered.current) {
                        currentRef.removeEventListener(
                            "pointermove",
                            handleMouseMove as any
                        )
                        x.set(0)
                        y.set(0)
                    }
                    // If element comes back onscreen while hovered, re-attach listener
                    else if (entry.isIntersecting && isHovered.current) {
                        currentRef.addEventListener(
                            "pointermove",
                            handleMouseMove as any
                        )
                    }
                })
            },
            { threshold: 0 }
        )

        observer.observe(currentRef)

        return () => {
            observer.disconnect()
            currentRef.removeEventListener(
                "pointermove",
                handleMouseMove as any
            )
            // Clean up timeout on unmount
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [handleMouseMove, isStatic, x, y])

    const hasCustomIcon = customIcon && customIcon.trim() !== ""

    const renderIcon = () => {
        if (hasCustomIcon) {
            return (
                <img
                    src={customIcon}
                    alt=""
                    style={{
                        width: iconSize,
                        height: iconSize,
                        objectFit: "contain",
                    }}
                />
            )
        }
        return null
    }

    const buttonContent = (
        <>
            {hasCustomIcon && iconPosition === "left" && (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: iconSize,
                        height: iconSize,
                        marginRight: iconGap,
                    }}
                >
                    {renderIcon()}
                </span>
            )}
            <span style={{ textTransform }}>{label}</span>
            {hasCustomIcon && iconPosition === "right" && (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: iconSize,
                        height: iconSize,
                        marginLeft: iconGap,
                    }}
                >
                    {renderIcon()}
                </span>
            )}
        </>
    )

    const commonStyles = {
        backgroundColor: background,
        color: textColor,
        borderRadius: borderRadius,
        padding: padding,
        border: "none",
        cursor: "pointer",
        fontSize: font.fontSize,
        fontWeight: font.fontWeight,
        fontFamily: font.fontFamily,
        fontStyle: font.fontStyle,
        letterSpacing: font.letterSpacing,
        lineHeight: font.lineHeight,
        textAlign: font.textAlign,
        position: "relative" as const,
        willChange: "transform",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        ...(isStatic ? { transform: "none" } : {}),
    }

    const motionProps = isStatic
        ? {}
        : {
              style: {
                  ...commonStyles,
                  x: springX,
                  y: springY,
                  scale: springClickScale,
              },
              onMouseEnter: handleMouseEnter,
              onMouseLeave: handleMouseLeave,
          }

    const staticProps = isStatic
        ? {
              style: commonStyles,
          }
        : {}

    if (link && getHref(link)) {
        const href = getHref(link)
        const target = getTarget()
        return (
            <motion.a
                ref={anchorRef}
                href={href}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
                onClick={handleClick}
                aria-label={ariaLabel || label}
                {...(isStatic ? staticProps : motionProps)}
            >
                {buttonContent}
            </motion.a>
        )
    }

    return (
        <motion.button
            ref={buttonRef}
            onClick={handleClick}
            aria-label={ariaLabel || label}
            {...(isStatic ? staticProps : motionProps)}
        >
            {buttonContent}
        </motion.button>
    )
}

addPropertyControls(MagnaButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Click Me",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "",
        placeholder: "Descriptive label for screen readers...",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ link }) => !link,
    },
    radius: {
        type: ControlType.Number,
        title: "Magnetic Radius",
        defaultValue: 120,
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
    },
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 0.4,
        min: 0,
        max: 1,
        step: 0.01,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#FFFFFF",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 24px",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Text Transform",
        options: ["none", "uppercase", "lowercase", "capitalize"],
        optionTitles: ["None", "Uppercase", "Lowercase", "Capitalize"],
        defaultValue: "none",
    },
    customIcon: {
        type: ControlType.File,
        title: "Icon",
        allowedFileTypes: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: ({ customIcon }) => !customIcon,
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 16,
        min: 8,
        max: 64,
        step: 1,
        unit: "px",
        hidden: ({ customIcon }) => !customIcon,
    },
    iconGap: {
        type: ControlType.Number,
        title: "Icon Gap",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        unit: "px",
        hidden: ({ customIcon }) => !customIcon,
    },
    onClick: {
        type: ControlType.EventHandler,
        title: "On Click",
    },
})
