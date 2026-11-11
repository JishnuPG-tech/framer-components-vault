// Instructions: Convert the provided FlipType hover-split animation into a Framer component following Framer component rules (no external cn/tailwind), with property controls and safe SSR behavior.
import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type FlipTypeProps = {
    text: string
    uppercase: boolean
    textColor: string
    cursor: string
    letterGap: number
    durationMs: number

    activeShift: number
    neighbor1Shift: number
    neighbor2Shift: number

    font: any
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function FlipType(props: FlipTypeProps) {
    const {
        text = "ANIMATA",
        uppercase = true,
        textColor = "#FFBB00",
        cursor = "pointer",
        letterGap = 0,
        durationMs = 300,
        activeShift = 20,
        neighbor1Shift = 12,
        neighbor2Shift = 4,
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const timeoutRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (typeof window === "undefined") return
            if (timeoutRef.current != null)
                window.clearTimeout(timeoutRef.current)
        }
    }, [])

    const displayText = useMemo(() => {
        const t = text ?? ""
        return uppercase ? t.toUpperCase() : t
    }, [text, uppercase])

    const chars = useMemo(() => Array.from(displayText), [displayText])

    const isFixedWidth = !!style && style.width === "100%"
    const isFixedHeight = !!style && style.height === "100%"

    const resolvedCursor = useMemo(() => cursor || "default", [cursor])

    const clearPendingTimeout = useCallback(() => {
        if (typeof window === "undefined") return
        if (timeoutRef.current != null) {
            window.clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }, [])

    const scheduleDeactivate = useCallback(() => {
        if (typeof window === "undefined") return
        clearPendingTimeout()
        timeoutRef.current = window.setTimeout(() => {
            startTransition(() => setActiveIndex(null))
        }, 60)
    }, [clearPendingTimeout])

    const onEnterLetter = useCallback(
        (index: number) => {
            if (isStatic) return
            clearPendingTimeout()
            startTransition(() => setActiveIndex(index))
        },
        [clearPendingTimeout, isStatic]
    )

    const onLeaveLetter = useCallback(() => {
        if (isStatic) return
        scheduleDeactivate()
    }, [isStatic, scheduleDeactivate])

    const shiftForIndex = useCallback(
        (index: number) => {
            if (activeIndex == null) return 0
            const d = Math.abs(index - activeIndex)
            if (d === 0) return activeShift
            if (d === 1) return neighbor1Shift
            if (d === 2) return neighbor2Shift
            return 0
        },
        [activeIndex, activeShift, neighbor1Shift, neighbor2Shift]
    )

    const rootStyle: CSSProperties = useMemo(
        () => ({
            ...style,
            position: "relative",
            display: "inline-block",
            width: isFixedWidth ? "100%" : "max-content",
            height: isFixedHeight ? "100%" : "auto",
            color: textColor,
            cursor: resolvedCursor,
            userSelect: "none",
            lineHeight: "1em",
            ...font,
        }),
        [font, isFixedHeight, isFixedWidth, resolvedCursor, style, textColor]
    )

    const overlayStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "stretch",
            height: "100%",
            width: "100%",
            pointerEvents: isStatic ? "none" : "auto",
        }),
        [isStatic]
    )

    const letterContainerStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            display: "inline-flex",
            flexDirection: "column",
            height: "1em",
            lineHeight: "1em",
            marginRight: letterGap ? `${letterGap}px` : undefined,
            pointerEvents: isStatic ? "none" : "auto",
        }),
        [isStatic, letterGap]
    )

    const halfStyleBase: CSSProperties = useMemo(
        () => ({
            display: "block",
            height: "50%",
            overflow: "hidden",
            lineHeight: "1em",
            whiteSpace: "pre",
            willChange: "transform",
            transitionProperty: "transform",
            transitionDuration: `${Math.max(0, durationMs)}ms`,
            transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        }),
        [durationMs]
    )

    const bottomInnerStyle: CSSProperties = useMemo(
        () => ({
            display: "inline-block",
            transform: "translateY(-50%)",
            lineHeight: "1em",
            whiteSpace: "pre",
            pointerEvents: "none",
        }),
        []
    )

    return (
        <div style={rootStyle} aria-label={displayText}>
            <div
                style={{
                    visibility: "hidden",
                    lineHeight: "1em",
                    whiteSpace: "pre",
                    width: "max-content",
                }}
            >
                {displayText}
            </div>

            <div style={overlayStyle} aria-hidden>
                {chars.map((ch, index) => {
                    const shift = shiftForIndex(index)

                    const topTransform = shift
                        ? `translateY(-${shift}px)`
                        : "translateY(0px)"
                    const bottomTransform = shift
                        ? `translateY(${shift}px)`
                        : "translateY(0px)"

                    return (
                        <div
                            key={`${ch}-${index}`}
                            role="presentation"
                            style={letterContainerStyle}
                            onMouseEnter={
                                isStatic
                                    ? undefined
                                    : () => onEnterLetter(index)
                            }
                            onMouseLeave={isStatic ? undefined : onLeaveLetter}
                        >
                            <span
                                style={{
                                    ...halfStyleBase,
                                    transform: topTransform,
                                }}
                            >
                                {ch}
                            </span>

                            <span
                                style={{
                                    ...halfStyleBase,
                                    transform: bottomTransform,
                                }}
                            >
                                <span style={bottomInnerStyle}>{ch}</span>
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

addPropertyControls(FlipType, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "ANIMATA",
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFBB00",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "80px",
            variant: "Black",
            letterSpacing: "-0.04em",
            lineHeight: "1em",
        },
    },
    durationMs: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 300,
        min: 0,
        max: 2000,
        step: 10,
        unit: "ms",
    },
    activeShift: {
        type: ControlType.Number,
        title: "Active Shift",
        defaultValue: 20,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    neighbor1Shift: {
        type: ControlType.Number,
        title: "Neighbor 1",
        defaultValue: 12,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    neighbor2Shift: {
        type: ControlType.Number,
        title: "Neighbor 2",
        defaultValue: 4,
        min: 0,
        max: 120,
        step: 1,
        unit: "px",
    },
    letterGap: {
        type: ControlType.Number,
        title: "Letter Gap",
        defaultValue: 0,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cursor: {
        type: ControlType.Cursor,
        title: "Cursor",
        defaultValue: "pointer",
    },
})
