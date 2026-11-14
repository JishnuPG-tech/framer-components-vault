import * as React from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left"
type Trigger = "hover" | "click"
type FontControl = {
    fontFamily?: string
    fontWeight?: number | string
    fontStyle?: string
}

interface FloatingPromoBubbleProps {
    position: Position
    trigger: Trigger
    font: FontControl
    bubbleLabel: string
    title: string
    description: string
    ctaLabel: string
    ctaHref: string
    backgroundColor: string
    accentColor: string
    textColor: string
    cornerRadius: number
    showCloseIcon: boolean
}

const offset = 24
const easing = "cubic-bezier(0.16, 1, 0.3, 1)"
const safeProtocols = ["http", "https", "mailto", "tel"]
const defaultProps: FloatingPromoBubbleProps = {
    position: "bottom-right",
    trigger: "hover",
    font: {
        fontFamily: "Inter",
        fontWeight: 400,
    },
    bubbleLabel: "New",
    title: "Get this component",
    description: "Drop a polished promo bubble into your Framer project.",
    ctaLabel: "View component",
    ctaHref: "https://framer.com",
    backgroundColor: "#111111",
    accentColor: "#5B8CFF",
    textColor: "#FFFFFF",
    cornerRadius: 16,
    showCloseIcon: true,
}

function getSafeHref(href: string) {
    const value = href.trim()

    if (!value) return "#"
    if (
        value.startsWith("/") ||
        value.startsWith("#") ||
        value.startsWith("./") ||
        value.startsWith("../")
    ) {
        return value
    }

    const protocolIndex = value.indexOf(":")

    if (protocolIndex === -1) return value

    const protocol = value.slice(0, protocolIndex).toLowerCase()

    return safeProtocols.includes(protocol) ? value : "#"
}

function shouldOpenInNewTab(href: string) {
    const value = href.toLowerCase()

    return value.startsWith("http://") || value.startsWith("https://")
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingPromoBubble(
    rawProps: Partial<FloatingPromoBubbleProps> = {}
) {
    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const {
        position = defaultProps.position,
        trigger = defaultProps.trigger,
        font: rawFont = defaultProps.font,
        bubbleLabel = defaultProps.bubbleLabel,
        title = defaultProps.title,
        description = defaultProps.description,
        ctaLabel = defaultProps.ctaLabel,
        ctaHref = defaultProps.ctaHref,
        backgroundColor = defaultProps.backgroundColor,
        accentColor = defaultProps.accentColor,
        textColor = defaultProps.textColor,
        cornerRadius = defaultProps.cornerRadius,
        showCloseIcon = defaultProps.showCloseIcon,
    } = rawProps
    const font = { ...defaultProps.font, ...rawFont }

    const [isOpen, setIsOpen] = React.useState(false)
    const [isBubbleFocused, setIsBubbleFocused] = React.useState(false)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const bubbleRef = React.useRef<HTMLButtonElement>(null)
    const cardId = React.useId()
    const titleId = React.useId()
    const descriptionId = React.useId()

    const isTop = position.includes("top")
    const isLeft = position.includes("left")
    const safeCtaHref = getSafeHref(ctaHref)
    const opensInNewTab = shouldOpenInNewTab(safeCtaHref)
    const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const shouldAnimate = !isStatic && !prefersReducedMotion
    const closedCardOffset = isTop ? -10 : 10
    const motionTransition = shouldAnimate
        ? `opacity 220ms ${easing}, transform 220ms ${easing}, visibility 220ms linear`
        : "none"
    const bubbleTransition = shouldAnimate
        ? `transform 180ms ${easing}, box-shadow 180ms ${easing}`
        : "none"

    const close = React.useCallback((restoreFocus = false) => {
        setIsOpen(false)

        if (restoreFocus) {
            bubbleRef.current?.focus()
        }
    }, [])

    React.useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null

            if (target && rootRef.current?.contains(target)) return

            close(false)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                const activeElement = document.activeElement
                const shouldRestoreFocus = Boolean(
                    activeElement && rootRef.current?.contains(activeElement)
                )

                close(shouldRestoreFocus)
            }
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [close, isOpen])

    const shouldHoverOpen = (event: React.PointerEvent) => {
        return trigger === "hover" && event.pointerType === "mouse"
    }

    const toggleOpen = () => {
        setIsOpen((current) => !current)
    }

    const handleBubbleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()

        if (trigger === "click") {
            toggleOpen()
            return
        }

        // Touch and pen devices do not have reliable hover, so tapping toggles.
        const canHover =
            typeof window !== "undefined" &&
            window.matchMedia?.("(hover: hover) and (pointer: fine)").matches

        if (!canHover) {
            toggleOpen()
        }
    }

    const handleBubbleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            event.stopPropagation()
            toggleOpen()
        }

        if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            close()
        }
    }

    const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            close(true)
        }
    }

    const rootStyle: React.CSSProperties = {
        position: "fixed",
        zIndex: 9999,
        top: isTop ? offset : undefined,
        bottom: isTop ? undefined : offset,
        left: isLeft ? offset : undefined,
        right: isLeft ? undefined : offset,
        pointerEvents: isOpen ? "auto" : "none",
        display: "flex",
        flexDirection: isTop ? "column" : "column-reverse",
        alignItems: isLeft ? "flex-start" : "flex-end",
        gap: 10,
        fontFamily:
            font.fontFamily ||
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: font.fontWeight,
        fontStyle: font.fontStyle,
    }

    const bubbleStyle: React.CSSProperties = {
        pointerEvents: "auto",
        appearance: "none",
        border: "none",
        cursor: "pointer",
        minWidth: 54,
        maxWidth: "min(160px, calc(100vw - 48px))",
        height: 42,
        boxSizing: "border-box",
        borderRadius: 999,
        padding: bubbleLabel.length > 2 ? "0 16px" : "0 14px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        color: textColor,
        backgroundColor: accentColor,
        boxShadow: isBubbleFocused
            ? "0 0 0 3px rgba(255, 255, 255, 0.85), 0 10px 28px rgba(0, 0, 0, 0.22)"
            : "0 10px 28px rgba(0, 0, 0, 0.22)",
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        transition: bubbleTransition,
        transform: shouldAnimate && isOpen ? "scale(0.96)" : "none",
        outline: "none",
        willChange: shouldAnimate ? "transform, box-shadow" : undefined,
        WebkitTapHighlightColor: "transparent",
    }

    const cardStyle: React.CSSProperties = {
        pointerEvents: isOpen ? "auto" : "none",
        width: 260,
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
        borderRadius: Math.max(0, cornerRadius),
        padding: 16,
        color: textColor,
        backgroundColor,
        boxShadow: "0 18px 55px rgba(0, 0, 0, 0.24)",
        opacity: isOpen ? 1 : 0,
        transform: shouldAnimate
            ? isOpen
                ? "translate3d(0, 0, 0) scale(1)"
                : `translate3d(0, ${closedCardOffset}px, 0) scale(0.96)`
            : "none",
        transition: motionTransition,
        visibility: isOpen ? "visible" : "hidden",
        willChange: shouldAnimate ? "opacity, transform" : undefined,
        transformOrigin: `${isLeft ? "left" : "right"} ${
            isTop ? "top" : "bottom"
        }`,
    }

    return (
        <div
            ref={rootRef}
            style={rootStyle}
            onPointerEnter={(event) => {
                if (shouldHoverOpen(event)) setIsOpen(true)
            }}
            onPointerLeave={(event) => {
                if (shouldHoverOpen(event)) {
                    const activeElement = document.activeElement
                    const shouldRestoreFocus = Boolean(
                        activeElement &&
                            rootRef.current?.contains(activeElement)
                    )

                    close(shouldRestoreFocus)
                }
            }}
        >
            <button
                ref={bubbleRef}
                type="button"
                aria-controls={cardId}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-label={isOpen ? "Close promotion" : "Open promotion"}
                style={bubbleStyle}
                onPointerEnter={(event) => {
                    if (shouldHoverOpen(event)) setIsOpen(true)
                }}
                onClick={handleBubbleClick}
                onKeyDown={handleBubbleKeyDown}
                onFocus={() => setIsBubbleFocused(true)}
                onBlur={() => setIsBubbleFocused(false)}
            >
                {bubbleLabel}
            </button>

            <div
                id={cardId}
                role="dialog"
                aria-modal="false"
                aria-hidden={!isOpen}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                style={cardStyle}
                onKeyDown={handleCardKeyDown}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                    }}
                >
                    <h3
                        id={titleId}
                        style={{
                            margin: 0,
                            color: textColor,
                            fontSize: 16,
                            lineHeight: 1.25,
                            fontWeight: 800,
                            letterSpacing: 0,
                            overflowWrap: "break-word",
                        }}
                    >
                        {title}
                    </h3>

                    {showCloseIcon && (
                        <button
                            type="button"
                            aria-label="Close promotion"
                            onClick={() => close(true)}
                            style={{
                                appearance: "none",
                                border: "none",
                                cursor: "pointer",
                                flex: "0 0 28px",
                                width: 28,
                                height: 28,
                                borderRadius: Math.min(999, cornerRadius),
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "inherit",
                                color: textColor,
                                backgroundColor: "rgba(127, 127, 127, 0.14)",
                                fontSize: 20,
                                lineHeight: 1,
                                padding: 0,
                            }}
                        >
                            {"\u00d7"}
                        </button>
                    )}
                </div>

                <p
                    id={descriptionId}
                    style={{
                        margin: "0 0 14px",
                        color: textColor,
                        opacity: 0.78,
                        fontSize: 14,
                        lineHeight: 1.45,
                        letterSpacing: 0,
                        overflowWrap: "break-word",
                    }}
                >
                    {description}
                </p>

                <a
                    href={safeCtaHref}
                    target={opensInNewTab ? "_blank" : undefined}
                    rel={opensInNewTab ? "noopener noreferrer" : undefined}
                    style={{
                        minHeight: 40,
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        borderRadius: Math.max(0, cornerRadius * 0.72),
                        padding: "0 14px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "inherit",
                        color: textColor,
                        backgroundColor: accentColor,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 800,
                        lineHeight: 1.15,
                        letterSpacing: 0,
                        textAlign: "center",
                        overflowWrap: "break-word",
                    }}
                >
                    {ctaLabel}
                </a>
            </div>
        </div>
    )
}

Object.assign(FloatingPromoBubble, { defaultProps })

addPropertyControls(FloatingPromoBubble, {
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom-right", "bottom-left", "top-right", "top-left"],
        optionTitles: ["Bottom Right", "Bottom Left", "Top Right", "Top Left"],
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: defaultProps.font,
    },
    bubbleLabel: {
        type: ControlType.String,
        title: "Bubble",
        defaultValue: "New",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Get this component",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Drop a polished promo bubble into your Framer project.",
        displayTextArea: true,
    },
    ctaLabel: {
        type: ControlType.String,
        title: "CTA Label",
        defaultValue: "View component",
    },
    ctaHref: {
        type: ControlType.String,
        title: "CTA Href",
        defaultValue: "https://framer.com",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#5B8CFF",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        displayStepper: true,
    },
    showCloseIcon: {
        type: ControlType.Boolean,
        title: "Close",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
})
