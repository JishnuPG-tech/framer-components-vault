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


// User request: Create a self-contained "Mouse Fill Button" Framer component with mouse-point radial fill on enter/leave, character-by-character text transitions, no external dependencies, and full property controls for styling and animation.

interface MyComponentProps {
    defaultText: string
    hoverText: string
    backgroundColor: string
    hoverColor: string
    textColor: string
    shadowColor: string
    hoverShadowColor: string
    pressedShadowColor: string
    horizontalPadding: number
    verticalPadding: number
    borderRadius: number
    fontSize: number
    fontWeight: number
    fontFamily: {
        fontFamily?: string
    }
    style?: React.CSSProperties
}

interface FillCircle {
    id: number
    x: number
    y: number
    radius: number
    expanded: boolean
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RipplerButton(props: MyComponentProps) {
    const {
        defaultText,
        hoverText,
        backgroundColor,
        hoverColor,
        textColor,
        shadowColor,
        hoverShadowColor,
        pressedShadowColor,
        horizontalPadding,
        verticalPadding,
        borderRadius,
        fontSize,
        fontWeight,
        fontFamily,
        style,
    } = props
    const duration = 0.55
    const stagger = 0.03
    const liftAmount = 18
    const pressedScale = 0.97
    const pressedYOffset = 2
    const isStatic = useIsStaticRenderer()

    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const cleanupTimerRef = React.useRef<number | null>(null)
    const idCounterRef = React.useRef(0)

    const [isHovered, setIsHovered] = React.useState(false)
    const [isPressed, setIsPressed] = React.useState(false)
    const [hoverCircle, setHoverCircle] = React.useState<FillCircle | null>(null)
    const [leaveCircle, setLeaveCircle] = React.useState<FillCircle | null>(null)

    const defaultChars = React.useMemo(() => defaultText.split(""), [defaultText])
    const hoverChars = React.useMemo(() => hoverText.split(""), [hoverText])

    const getRelativePositionAndRadius = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            const distances = [
                Math.hypot(x, y),
                Math.hypot(rect.width - x, y),
                Math.hypot(x, rect.height - y),
                Math.hypot(rect.width - x, rect.height - y),
            ]
            const radius = Math.max(...distances) + 2
            return { x, y, radius }
        },
        []
    )

    const clearCleanupTimer = React.useCallback(() => {
        if (cleanupTimerRef.current !== null && typeof window !== "undefined") {
            window.clearTimeout(cleanupTimerRef.current)
            cleanupTimerRef.current = null
        }
    }, [])

    const handleMouseEnter = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (isStatic) return
            clearCleanupTimer()

            const { x, y, radius } = getRelativePositionAndRadius(event)
            const id = idCounterRef.current + 1
            idCounterRef.current = id
            React.startTransition(() => {
                setIsHovered(true)
                setLeaveCircle(null)
                setHoverCircle({ id, x, y, radius, expanded: false })
            })
        },
        [clearCleanupTimer, getRelativePositionAndRadius, isStatic]
    )

    const handleMouseLeave = React.useCallback(
        (event: React.MouseEvent<HTMLButtonElement>) => {
            if (isStatic) return
            clearCleanupTimer()

            const { x, y, radius } = getRelativePositionAndRadius(event)
            const id = idCounterRef.current + 1
            idCounterRef.current = id
            React.startTransition(() => {
                setIsHovered(false)
                setLeaveCircle({ id, x, y, radius, expanded: false })
            })

            if (typeof window !== "undefined") {
                cleanupTimerRef.current = window.setTimeout(() => {
                    React.startTransition(() => {
                        setHoverCircle(null)
                        setLeaveCircle(null)
                    })
                    cleanupTimerRef.current = null
                }, duration * 1000)
            }
        },
        [clearCleanupTimer, duration, getRelativePositionAndRadius, isStatic]
    )

    const handlePointerDown = React.useCallback(() => {
        if (isStatic) return
        React.startTransition(() => {
            setIsPressed(true)
        })
    }, [isStatic])

    const releasePressedState = React.useCallback(() => {
        if (isStatic) return
        React.startTransition(() => {
            setIsPressed(false)
        })
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic || !hoverCircle || typeof window === "undefined") return
        const frameId = window.requestAnimationFrame(() => {
            React.startTransition(() => {
                setHoverCircle((prev) => (prev && prev.id === hoverCircle.id ? { ...prev, expanded: true } : prev))
            })
        })
        return () => window.cancelAnimationFrame(frameId)
    }, [hoverCircle?.id, isStatic])

    React.useEffect(() => {
        if (isStatic || !leaveCircle || typeof window === "undefined") return
        const frameId = window.requestAnimationFrame(() => {
            React.startTransition(() => {
                setLeaveCircle((prev) => (prev && prev.id === leaveCircle.id ? { ...prev, expanded: true } : prev))
            })
        })
        return () => window.cancelAnimationFrame(frameId)
    }, [leaveCircle?.id, isStatic])

    React.useEffect(() => {
        if (isStatic) return
        return () => {
            clearCleanupTimer()
        }
    }, [clearCleanupTimer, isStatic])

    React.useEffect(() => {
        if (!isStatic) return
        React.startTransition(() => {
            setIsHovered(false)
            setIsPressed(false)
            setHoverCircle(null)
            setLeaveCircle(null)
        })
        clearCleanupTimer()
    }, [clearCleanupTimer, isStatic])

    const interactiveHovered = isStatic ? false : isHovered
    const interactivePressed = isStatic ? false : isPressed
    const boxShadowValue = interactivePressed
        ? `0 ${Math.max(4, pressedYOffset + 3)}px 12px ${pressedShadowColor}`
        : interactiveHovered
          ? `0 10px 24px ${hoverShadowColor}`
          : `0 10px 24px ${shadowColor}`
    const buttonTransform = interactivePressed ? `translateY(${pressedYOffset}px) scale(${pressedScale})` : "translateY(0px) scale(1)"
    const combinedTransform = style?.transform ? `${buttonTransform} ${style.transform}` : buttonTransform
    const resolvedFontFamily = React.useMemo(
        () =>
            fontFamily?.fontFamily ??
            'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        [fontFamily]
    )
    const hasIncomingWidth = style?.width !== undefined
    const hasIncomingHeight = style?.height !== undefined

    return (
        <button
            ref={buttonRef}
            type="button"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={releasePressedState}
            onPointerCancel={releasePressedState}
            onPointerLeave={releasePressedState}
            style={{
                position: "relative",
                ...style,
                width: hasIncomingWidth ? style?.width : "auto",
                height: hasIncomingHeight ? style?.height : "auto",
                border: "none",
                outline: "none",
                borderRadius,
                backgroundColor,
                color: textColor,
                cursor: "pointer",
                overflow: "hidden",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: resolvedFontFamily,
                fontSize,
                fontWeight,
                boxShadow: boxShadowValue,
                transform: combinedTransform,
                transition: isStatic
                    ? "none"
                    : `box-shadow ${interactivePressed ? 0.14 : duration}s ${interactivePressed ? "cubic-bezier(0.2, 0.9, 0.3, 1)" : "ease"}, transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1)`,
                padding: `${verticalPadding}px ${horizontalPadding}px`,
                userSelect: "none",
                touchAction: "manipulation",
            }}
            aria-label={interactiveHovered ? hoverText : defaultText}
        >
            {!isStatic && hoverCircle && (
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: hoverCircle.x - hoverCircle.radius,
                        top: hoverCircle.y - hoverCircle.radius,
                        width: hoverCircle.radius * 2,
                        height: hoverCircle.radius * 2,
                        borderRadius: "50%",
                        backgroundColor: hoverColor,
                        transform: `scale(${hoverCircle.expanded ? 1 : 0})`,
                        transformOrigin: "center",
                        transition: `transform ${duration}s ease-out`,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            {!isStatic && leaveCircle && (
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        left: leaveCircle.x - leaveCircle.radius,
                        top: leaveCircle.y - leaveCircle.radius,
                        width: leaveCircle.radius * 2,
                        height: leaveCircle.radius * 2,
                        borderRadius: "50%",
                        backgroundColor,
                        transform: `scale(${leaveCircle.expanded ? 1 : 0})`,
                        transformOrigin: "center",
                        transition: `transform ${duration}s ease-out`,
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            )}

            {isStatic ? (
                <span
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "max-content",
                        lineHeight: 1,
                        whiteSpace: "pre",
                    }}
                >
                    {defaultText}
                </span>
            ) : (
                <span
                    aria-hidden
                    style={{
                        position: "relative",
                        zIndex: 3,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "max-content",
                        lineHeight: 1,
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            display: "inline-flex",
                            whiteSpace: "pre",
                        }}
                    >
                        {defaultChars.map((char, index) => (
                            <span
                                key={`default-${index}`}
                                style={{
                                    display: "inline-block",
                                    transform: interactiveHovered ? `translateY(-${liftAmount}px)` : "translateY(0px)",
                                    opacity: interactiveHovered ? 0 : 1,
                                    transitionProperty: "transform, opacity",
                                    transitionDuration: `${duration}s`,
                                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                                    transitionDelay: `${interactiveHovered ? index * stagger : (defaultChars.length - 1 - index) * stagger}s`,
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        ))}
                    </span>

                    <span
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            display: "inline-flex",
                            whiteSpace: "pre",
                        }}
                    >
                        {hoverChars.map((char, index) => (
                            <span
                                key={`hover-${index}`}
                                style={{
                                    display: "inline-block",
                                    transform: interactiveHovered ? "translateY(0px)" : `translateY(${liftAmount}px)`,
                                    opacity: interactiveHovered ? 1 : 0,
                                    transitionProperty: "transform, opacity",
                                    transitionDuration: `${duration}s`,
                                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                                    transitionDelay: `${interactiveHovered ? index * stagger : (hoverChars.length - 1 - index) * stagger}s`,
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </span>
                        ))}
                    </span>

                    <span style={{ visibility: "hidden", whiteSpace: "pre" }}>
                        {defaultText.length >= hoverText.length ? defaultText : hoverText}
                    </span>
                </span>
            )}
        </button>
    )
}

addPropertyControls(RipplerButton, {
    defaultText: {
        type: ControlType.String,
        title: "Default Text",
        defaultValue: "Hover",
    },
    hoverText: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "Click",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#27272A",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#EC4899",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow",
        defaultValue: "rgba(39, 39, 42, 0.35)",
    },
    hoverShadowColor: {
        type: ControlType.Color,
        title: "Hover Shadow",
        defaultValue: "rgba(236, 72, 153, 0.45)",
    },
    pressedShadowColor: {
        type: ControlType.Color,
        title: "Pressed Shadow",
        defaultValue: "rgba(39, 39, 42, 0.2)",
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "H Padding",
        defaultValue: 32,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "V Padding",
        defaultValue: 18,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 16,
        min: 10,
        max: 36,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        defaultValue: 500,
        min: 100,
        max: 900,
        step: 100,
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font Family",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "16px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})