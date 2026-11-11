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

import { motion } from "framer-motion"

// Instructions: give shadow property to the knob alone, and ensure the shadow option is visible in the properties panel

type IndustrialToggleProps = {
    isOn: boolean
    onUrl: string
    offUrl: string
    knobShadow: string
    onBackground: string
    offBackground: string
    dotOnColor: string
    dotOffColor: string
    style?: React.CSSProperties
}

/**
 * Industrial Toggle
 *
 * @framerIntrinsicWidth 48
 * @framerIntrinsicHeight 32
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function IndustrialToggle(props: IndustrialToggleProps) {
    const {
        isOn: isOnProp = false,
        onUrl = "",
        offUrl = "",
        knobShadow =
            "0 10px 20px rgba(0,0,0,0.22), 0 3px 6px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.8), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -4px 6px rgba(0,0,0,0.22)",
        onBackground = "#FF0000",
        offBackground = "#EDEDED",
        dotOnColor = "#FF0000",
        dotOffColor = "#FF0000",
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ width: 48, height: 32 })

    const [isOn, setIsOn] = React.useState(isOnProp)

    React.useEffect(() => {
        React.startTransition(() => setIsOn(isOnProp))
    }, [isOnProp])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const el = containerRef.current
        if (!el) return

        const clamp = (v: number) => Math.max(5, Math.round(v || 0))

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return
            const { width, height } = entry.contentRect
            React.startTransition(() => setSize({ width: clamp(width), height: clamp(height) }))
        })

        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { pad, knobSize, travel, knobTop, knobLeft, radius, safeWidth, safeHeight } = React.useMemo(() => {
        const safeHeight = Math.max(5, size.height)
        const safeWidth = Math.max(5, size.width)

        const pad = Math.max(2, Math.round(safeHeight * (4 / 36)))
        const knobSize = Math.max(10, safeHeight - pad * 2)
        const travel = Math.max(0, safeWidth - pad * 2 - knobSize)

        return {
            safeWidth,
            safeHeight,
            pad,
            knobSize,
            travel,
            knobTop: pad,
            knobLeft: pad,
            radius: Math.max(1, safeHeight / 2),
        }
    }, [size.height, size.width])

    const dotColor = isOn ? dotOnColor : dotOffColor

    const handleToggle = React.useCallback(() => {
        const next = !isOn
        React.startTransition(() => setIsOn(next))

        if (typeof window !== "undefined") {
            const targetUrl = next ? onUrl : offUrl
            if (targetUrl) window.location.href = targetUrl
        }
    }, [isOn, onUrl, offUrl])

    return (
        <div
            ref={containerRef}
            onClick={handleToggle}
            style={{
                ...props.style,
                width: "100%",
                height: "100%",
                minWidth: 5,
                minHeight: 5,
                borderRadius: radius,
                background: isOn ? onBackground : offBackground,
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                boxShadow: "none",
                transition: "background 0.3s ease",
                fontFamily: "sans-serif",
            }}
            role="switch"
            aria-checked={isOn}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleToggle()
                }
            }}
        >
            {/* Metallic Knob */}
            <motion.div
                animate={{ x: isOn ? travel : 0, rotate: isOn ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                    position: "absolute",
                    top: knobTop,
                    left: knobLeft,
                    width: knobSize,
                    height: knobSize,
                    borderRadius: "50%",
                    background:
                        "conic-gradient(#D9D9D9 0%, #A6A6A6 13%, #D9D9D9 25%, #808080 38%, #D9D9D9 50%, #767676 63%, #D9D9D9 75%, #747474 88%, #D9D9D9 100%)",
                    boxShadow: knobShadow,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Indicator Dot */}
                <div
                    style={{
                        width: Math.max(3, Math.round(knobSize * (5 / 28))),
                        height: Math.max(3, Math.round(knobSize * (5 / 28))),
                        borderRadius: "50%",
                        background: dotColor,
                        boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)",
                    }}
                />
            </motion.div>
        </div>
    )
}

addPropertyControls(IndustrialToggle, {
    isOn: {
        type: ControlType.Boolean,
        title: "On",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    onUrl: {
        type: ControlType.Link,
        title: "On URL",
        defaultValue: "",
    },
    offUrl: {
        type: ControlType.Link,
        title: "Off URL",
        defaultValue: "",
    },
    onBackground: {
        type: ControlType.Color,
        title: "On BG",
        defaultValue: "#FF0000",
    },
    offBackground: {
        type: ControlType.Color,
        title: "Off BG",
        defaultValue: "#EDEDED",
    },
    dotOnColor: {
        type: ControlType.Color,
        title: "Dot (On)",
        defaultValue: "#FF0000",
    },
    dotOffColor: {
        type: ControlType.Color,
        title: "Dot (Off)",
        defaultValue: "#FF0000",
    },
    knobShadow: {
        type: ControlType.BoxShadow,
        title: "Knob Shadow",
        defaultValue:
            "0 10px 20px rgba(0,0,0,0.22), 0 3px 6px rgba(0,0,0,0.16), 0 1px 0 rgba(255,255,255,0.8), inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -4px 6px rgba(0,0,0,0.22)",
    },
})
