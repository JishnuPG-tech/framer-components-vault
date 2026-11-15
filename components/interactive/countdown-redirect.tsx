import { startTransition, useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// User request: Create a new Framer React code component named CountdownRedirect with real-time countdown, redirect on zero, editable controls, accessibility, and robust runtime behavior.

interface MyComponentProps {
    durationSeconds: number
    destination: any
    autoStart: boolean
    textColor: string
    font: any
    alignment: "left" | "center" | "right"
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function CountdownRedirect(props: MyComponentProps) {
    const {
        durationSeconds,
        destination,
        autoStart,
        textColor,
        font,
        alignment,
    } = props

    const isStatic = useIsStaticRenderer()
    const safeDuration = Math.max(0, Math.floor(durationSeconds || 0))
    const [remainingSeconds, setRemainingSeconds] = useState(safeDuration)
    const targetTimeRef = useRef<number | null>(null)
    const redirectedRef = useRef(false)

    useEffect(() => {
        redirectedRef.current = false
        targetTimeRef.current = autoStart
            ? Date.now() + safeDuration * 1000
            : null
        startTransition(() => setRemainingSeconds(safeDuration))
    }, [safeDuration, autoStart, destination])

    useEffect(() => {
        if (!autoStart || isStatic) return
        if (typeof window === "undefined") return

        const tick = () => {
            const target = targetTimeRef.current
            if (target === null) return

            const next = Math.max(0, Math.ceil((target - Date.now()) / 1000))
            startTransition(() => {
                setRemainingSeconds((prev) => (prev === next ? prev : next))
            })
        }

        tick()
        const interval = window.setInterval(tick, 250)
        return () => window.clearInterval(interval)
    }, [autoStart, isStatic])

    useEffect(() => {
        if (!autoStart || isStatic) return
        if (remainingSeconds > 0 || redirectedRef.current) return
        if (typeof window !== "undefined" && destination) {
            redirectedRef.current = true
            window.open(destination, "_self")
        }
    }, [remainingSeconds, destination, autoStart, isStatic])

    const seconds = String(remainingSeconds).padStart(2, "0")

    const justifyContent =
        alignment === "left"
            ? "flex-start"
            : alignment === "right"
              ? "flex-end"
              : "center"

    return (
        <div
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Countdown: ${remainingSeconds} seconds remaining`}
            style={{
                position: "relative",
                width: "max-content",
                minWidth: "max-content",
                display: "flex",
                alignItems: "center",
                justifyContent,
                padding: 8,
            }}
        >
            <span
                style={{
                    ...font,
                    color: textColor,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {seconds}
            </span>
        </div>
    )
}

addPropertyControls(CountdownRedirect, {
    durationSeconds: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 30,
        min: 0,
        step: 1,
    },
    destination: {
        type: ControlType.Link,
        title: "Destination",
    },
    autoStart: {
        type: ControlType.Boolean,
        title: "Auto Start",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 64,
            fontWeight: 700,
        } as any,
    },
    alignment: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
})
