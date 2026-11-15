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


function getTriggerPoint(trigger: string): number {
    switch (trigger) {
        case "top":
            return 0.15
        case "bottom":
            return 0.85
        case "middle":
        default:
            return 0.5
    }
}

/**
 * Animated donut / circular progress chart. The ring fills from 0 to the
 * target percentage while the number inside counts up in sync, triggered
 * by scroll position (top / middle / bottom of viewport) or immediately
 * on appear. Typography uses Framer's native extended Font control —
 * pick any font available in this project and set the size freely.
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function Ringly(props: {
    percentage: number
    size: number
    strokeWidth: number
    baseColor: string
    progressColor: string
    font: React.CSSProperties
    textColor: string
    showPercentSign: boolean
    duration: number
    delay: number
    trigger: string
    repeat: boolean
}) {
    const {
        percentage = 50,
        size = 160,
        strokeWidth = 16,
        baseColor = "#000000",
        progressColor = "rgb(255, 174, 87)",
        font,
        textColor = "#FFFFFF",
        showPercentSign = true,
        duration = 1.5,
        delay = 0,
        trigger = "middle",
        repeat = false,
    } = props

    const isStatic = useIsStaticRenderer()

    const containerRef = React.useRef<HTMLDivElement>(null)
    const hasAnimated = React.useRef(false)
    const rafRef = React.useRef<number | null>(null)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    // In a static context (canvas thumbnail, export, PDF/image render) skip
    // the animation entirely and just show the final target value.
    const [progress, setProgress] = React.useState(isStatic ? percentage : 0)

    const radius = Math.max((size - strokeWidth) / 2, 1)
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference * (1 - progress / 100)

    const runAnimation = React.useCallback(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)

        timeoutRef.current = setTimeout(
            () => {
                const start = performance.now()
                const durMs = Math.max(duration, 0.01) * 1000

                const tick = (now: number) => {
                    const elapsed = now - start
                    const t = Math.min(elapsed / durMs, 1)
                    const eased = 1 - Math.pow(1 - t, 3)
                    setProgress(eased * percentage)
                    if (t < 1) {
                        rafRef.current = requestAnimationFrame(tick)
                    }
                }
                rafRef.current = requestAnimationFrame(tick)
            },
            Math.max(delay, 0) * 1000
        )
    }, [duration, delay, percentage])

    React.useEffect(() => {
        // Static contexts (canvas, export, image render) never animate —
        // just keep the ring pinned at the target percentage and skip
        // scroll listeners / rAF loops entirely.
        if (isStatic) {
            setProgress(percentage)
            return
        }

        const node = containerRef.current
        if (!node) return

        if (trigger === "onAppear") {
            if (!hasAnimated.current) {
                hasAnimated.current = true
                setProgress(0)
                runAnimation()
            }
            return
        }

        let ticking = false
        const triggerFraction = getTriggerPoint(trigger)

        const check = () => {
            ticking = false
            const rect = node.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const triggerY = vh * triggerFraction

            const crossed = rect.top <= triggerY && rect.bottom > 0

            if (crossed) {
                if (!hasAnimated.current) {
                    hasAnimated.current = true
                    setProgress(0)
                    runAnimation()
                }
            } else if (repeat) {
                hasAnimated.current = false
            }
        }

        const onScroll = () => {
            if (!ticking) {
                ticking = true
                requestAnimationFrame(check)
            }
        }

        check()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [isStatic, trigger, repeat, runAnimation, percentage])

    const displayValue = Math.round(progress)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: size,
                height: size,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ transform: "rotate(-90deg)" }}
            >
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={baseColor}
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={progressColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                />
            </svg>
            <div
                style={{
                    position: "absolute",
                    ...font,
                    color: textColor,
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                }}
            >
                {displayValue}
                {showPercentSign ? "%" : ""}
            </div>
        </div>
    )
}

addPropertyControls(Ringly, {
    percentage: {
        type: ControlType.Number,
        title: "Percentage",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
    },
    showPercentSign: {
        type: ControlType.Boolean,
        title: "Show % Sign",
        defaultValue: true,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 160,
        min: 40,
        max: 800,
        step: 1,
        description: "Diameter of the donut chart, in pixels.",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 16,
        min: 1,
        max: 100,
        step: 1,
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base Color",
        defaultValue: "#000000",
        description: "The background track color of the ring.",
    },
    progressColor: {
        type: ControlType.Color,
        title: "Progress Color",
        defaultValue: "rgb(255, 174, 87)",
    },
    textColor: {
        type: ControlType.Color,
        title: "Number Color",
        defaultValue: "#FFFFFF",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        controls: "extended",
        displayFontSize: true,
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 32,
            lineHeight: "1.2em",
            variant: "Medium",
        },
        description:
            "Pick any font available in this project, and set the size directly here.",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 1.5,
        min: 0.1,
        max: 10,
        step: 0.1,
    },
    delay: {
        type: ControlType.Number,
        title: "Delay (s)",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.1,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger When",
        options: ["onAppear", "top", "middle", "bottom"],
        optionTitles: [
            "On Appear (immediately)",
            "Reaches Top of viewport",
            "Reaches Middle of viewport",
            "Reaches Bottom of viewport",
        ],
        defaultValue: "middle",
        description:
            '"On Appear" starts as soon as this layer mounts. The others fire once this layer\'s top crosses that point in the viewport while scrolling.',
    },
    repeat: {
        type: ControlType.Boolean,
        title: "Replay Each Time",
        defaultValue: false,
        description:
            'If on, resets and replays every time it re-enters view (ignored when Trigger is "On Appear"). If off, animates once only.',
    },
})
