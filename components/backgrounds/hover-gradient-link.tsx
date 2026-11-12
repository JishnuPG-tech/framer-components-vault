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
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"

type Props = {
    text: string
    font: any
    color: string
    hoverTextColor: string
    gradientFrom: string
    gradientTo: string
    gradientStopCount: 2 | 3 | 4
    gradient3: string
    gradient4: string
    animationDuration: number
    highlightHeightPercent: number
    gradientPositionTop: boolean
    padding: string
    borderRadius: number
    previewHover: boolean
    finishAnimation: boolean
    lockDuringAnimation: boolean
    textReturnLead: number
    link: string
    openInNewTab: boolean
    style?: CSSProperties
}

/**
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 90
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function HoverGradientLink(props: Props) {
    const {
        text,
        font,
        color,
        hoverTextColor,
        gradientFrom,
        gradientTo,
        gradientStopCount,
        gradient3,
        gradient4,
        animationDuration,
        highlightHeightPercent,
        gradientPositionTop,
        padding,
        borderRadius,
        previewHover,
        finishAnimation,
        lockDuringAnimation,
        textReturnLead,
        link,
        openInNewTab,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [hovered, setHovered] = useState(false)
    const [animating, setAnimating] = useState(false)
    const [animNonce, setAnimNonce] = useState(0)
    const [textHold, setTextHold] = useState(false)
    const textHoldTimeoutRef = useRef<number | null>(null)

    const effectiveHovered = isStatic
        ? previewHover
        : hovered || (finishAnimation && animating)
    const effectiveTextHovered = isStatic
        ? previewHover
        : hovered || (finishAnimation && animating && textHold)

    const durationMs = useMemo(() => {
        const s = Number.isFinite(animationDuration) ? animationDuration : 1
        return Math.max(0, s) * 1000
    }, [animationDuration])

    const heightPct = useMemo(() => {
        const v = Number.isFinite(highlightHeightPercent)
            ? highlightHeightPercent
            : 80
        return Math.max(0, Math.min(100, v))
    }, [highlightHeightPercent])

    const clearTextHoldTimeout = useCallback(() => {
        if (textHoldTimeoutRef.current == null) return
        if (typeof window !== "undefined") {
            window.clearTimeout(textHoldTimeoutRef.current)
        }
        textHoldTimeoutRef.current = null
    }, [])

    const startTextHold = useCallback(() => {
        if (isStatic) return
        clearTextHoldTimeout()

        const leadMs =
            Math.max(0, Number.isFinite(textReturnLead) ? textReturnLead : 0) *
            1000
        const holdMs = Math.max(0, durationMs - leadMs)

        startTransition(() => setTextHold(true))

        if (typeof window !== "undefined" && holdMs > 0) {
            textHoldTimeoutRef.current = window.setTimeout(() => {
                startTransition(() => setTextHold(false))
                textHoldTimeoutRef.current = null
            }, holdMs)
        } else {
            startTransition(() => setTextHold(false))
        }
    }, [clearTextHoldTimeout, durationMs, isStatic, textReturnLead])

    useEffect(() => {
        return () => {
            clearTextHoldTimeout()
        }
    }, [clearTextHoldTimeout])

    const onMouseEnter = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setHovered(true)
            if (lockDuringAnimation && animating) return
            setAnimating(true)
            setAnimNonce((n) => n + 1)
        })
        if (!(lockDuringAnimation && animating)) startTextHold()
    }, [animating, isStatic, lockDuringAnimation, startTextHold])

    const onMouseLeave = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setHovered(false)
            if (!finishAnimation) setAnimating(false)
        })
    }, [finishAnimation, isStatic])

    const onFocus = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setHovered(true)
            if (lockDuringAnimation && animating) return
            setAnimating(true)
            setAnimNonce((n) => n + 1)
        })
        if (!(lockDuringAnimation && animating)) startTextHold()
    }, [animating, isStatic, lockDuringAnimation, startTextHold])

    const onBlur = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setHovered(false)
            if (!finishAnimation) setAnimating(false)
        })
    }, [finishAnimation, isStatic])

    const highlightStyle = useMemo<CSSProperties>(() => {
        const stopCount = gradientStopCount ?? 2
        const g1 = gradientFrom
        const g2 = gradientTo
        const g3 = gradient3 ?? gradientFrom
        const g4 = gradient4 ?? gradientTo

        const background =
            stopCount === 4
                ? `linear-gradient(to right, ${g1} 0%, ${g3} 33%, ${g4} 66%, ${g2} 100%)`
                : stopCount === 3
                  ? `linear-gradient(to right, ${g1} 0%, ${g3} 50%, ${g2} 100%)`
                  : `linear-gradient(to right, ${g1} 0%, ${g2} 100%)`

        const base: CSSProperties = {
            position: "absolute",
            top: gradientPositionTop ? 0 : "auto",
            bottom: gradientPositionTop ? "auto" : 0,
            left: 0,
            width: 0,
            height: `${heightPct}%`,
            background,
            zIndex: -1,
            borderRadius,
            pointerEvents: "none",
        }

        if (effectiveHovered) {
            // In Canvas/Export (static renderer) we can't rely on hover or CSS animations,
            // so show the highlight as a static filled background.
            if (isStatic) {
                base.width = "100%"
                base.left = 0
            } else if (durationMs > 0) {
                base.animationName = "framerHoverSweep"
                base.animationDuration = `${durationMs}ms`
                base.animationTimingFunction = "ease-in-out"
            }
        }

        return base
    }, [
        borderRadius,
        durationMs,
        effectiveHovered,
        gradientFrom,
        gradientTo,
        gradient3,
        gradient4,
        gradientStopCount,
        heightPct,
        isStatic,
        gradientPositionTop,
    ])

    const onHighlightAnimationEnd = useCallback(() => {
        if (isStatic) return
        startTransition(() => {
            setAnimating(false)
            setTextHold(false)
        })
    }, [isStatic])

    const containerStyle = useMemo<CSSProperties>(() => {
        const isFixedWidth = !!style && style.width === "100%"
        const isFixedHeight = !!style && style.height === "100%"

        return {
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            ...(isFixedWidth ? { width: "100%" } : { width: "max-content" }),
            ...(isFixedHeight ? { height: "100%" } : { height: "max-content" }),
            ...style,
        }
    }, [style])

    const textWrapStyle = useMemo<CSSProperties>(() => {
        return {
            position: "relative",
            display: "inline-block",
            overflow: "hidden",
            padding,
            cursor: isStatic ? "default" : "pointer",
            transition: "color 400ms ease",
            color: effectiveTextHovered ? hoverTextColor : color,
            zIndex: 0,
            ...font,
        }
    }, [color, effectiveTextHovered, font, hoverTextColor, isStatic, padding])

    const linkProps = useMemo(() => {
        const href = typeof link === "string" ? link.trim() : ""
        if (!href) return null
        return {
            href,
            target: openInNewTab ? "_blank" : undefined,
            rel: openInNewTab ? "noreferrer noopener" : undefined,
        }
    }, [link, openInNewTab])

    const AnchorOrSpan: any = linkProps ? "a" : "span"

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes framerHoverSweep {
                    0% { width: 0; left: 0; }
                    50% { width: 100%; }
                    100% { left: 100%; }
                }
            `}</style>

            <AnchorOrSpan
                {...(linkProps ?? {})}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    color: "inherit",
                }}
                aria-label={linkProps ? `Link: ${text}` : undefined}
            >
                <span
                    role="text"
                    aria-label={text}
                    style={textWrapStyle}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    tabIndex={isStatic ? -1 : 0}
                >
                    <span
                        key={animNonce}
                        aria-hidden="true"
                        style={highlightStyle}
                        onAnimationEnd={onHighlightAnimationEnd}
                    />
                    <span
                        style={{
                            position: "relative",
                            display: "inline-block",
                            minWidth: "max-content",
                        }}
                    >
                        {text}
                    </span>
                </span>
            </AnchorOrSpan>
        </div>
    )
}

addPropertyControls(HoverGradientLink, {
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: ({ link }) => !link || String(link).trim().length === 0,
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "About",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "64px",
            variant: "Black",
            letterSpacing: "0.5rem",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#303030",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Color",
        defaultValue: "#FFFFFF",
    },
    gradientStopCount: {
        type: ControlType.Enum,
        title: "Gradient Colors",
        options: [2, 3, 4],
        optionTitles: ["2", "3", "4"],
        defaultValue: 2,
        displaySegmentedControl: true,
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient First",
        defaultValue: "#2a0a59",
    },
    gradient3: {
        type: ControlType.Color,
        title: "Gradient",
        defaultValue: "#8855FF",
        hidden: ({ gradientStopCount }) => gradientStopCount === 2,
    },
    gradient4: {
        type: ControlType.Color,
        title: "Gradient",
        defaultValue: "#FFBB00",
        hidden: ({ gradientStopCount }) => gradientStopCount !== 4,
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#ff7b00",
    },
    highlightHeightPercent: {
        type: ControlType.Number,
        title: "Gradient Height",
        defaultValue: 100,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    gradientPositionTop: {
        type: ControlType.Boolean,
        title: "Gradient Position",
        defaultValue: true,
        enabledTitle: "Top",
        disabledTitle: "Bottom",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.05,
        unit: "s",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "5px 15px 5px 15px",
    },
    previewHover: {
        type: ControlType.Boolean,
        title: "Preview Hover",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    finishAnimation: {
        type: ControlType.Boolean,
        title: "Finish Sweep",
        defaultValue: false,
        enabledTitle: "Finish",
        disabledTitle: "Stop",
    },
    lockDuringAnimation: {
        type: ControlType.Boolean,
        title: "While Running",
        defaultValue: true,
        enabledTitle: "Lock",
        disabledTitle: "Restart",
        hidden: ({ finishAnimation }) => !finishAnimation,
    },
    textReturnLead: {
        type: ControlType.Number,
        title: "Text Return Lead",
        defaultValue: 0.2,
        min: 0,
        max: 1,
        step: 0.05,
        unit: "s",
        hidden: ({ finishAnimation }) => !finishAnimation,
    },
})

HoverGradientLink.displayName = "Hover Gradient Link"
