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


type Props = {
    size: number
    segments: number
    duration: number
    activeColor: string
    inactiveColor: string
    barLength: number
    barWidth: number
}

export default function LoadingSpokesBounce({
    size = 200,
    segments = 24,
    duration = 4000,
    activeColor = "#3AF726",
    inactiveColor = "#ffffff",
    barLength = 18,
    barWidth = 8,
}: Props) {
    const [progress, setProgress] = React.useState(0)
    const [activated, setActivated] = React.useState<boolean[]>(() =>
        Array(segments).fill(false)
    )

    // tăng % 0 → 100 theo duration
    React.useEffect(() => {
        let current = 0
        const stepMs = Math.max(10, Math.floor(duration / 100))
        const id = setInterval(() => {
            current = Math.min(100, current + 1)
            setProgress(current)

            // kích hoạt tia mới
            const activeSpokes = Math.round((current / 100) * segments)
            setActivated((prev) =>
                prev.map((v, i) => (i < activeSpokes ? true : v))
            )

            if (current >= 100) clearInterval(id)
        }, stepMs)
        return () => clearInterval(id)
    }, [duration, segments])

    const cx = size / 2
    const cy = size / 2
    const outerR = size / 2 - 12
    const angleStep = 360 / segments

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`}>
                {Array.from({ length: segments }).map((_, i) => {
                    const angle = -0 + i * angleStep
                    const isActive = activated[i]

                    return (
                        <g key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
                            <motion.rect
                                x={cx - barWidth / 2}
                                y={cy - outerR}
                                width={barWidth}
                                height={barLength}
                                rx={barWidth / 2}
                                ry={barWidth / 2}
                                style={{ transformOrigin: "50% 100%" }}
                                initial={{ fill: inactiveColor, scaleY: 1 }}
                                animate={
                                    isActive
                                        ? {
                                              fill: activeColor,
                                              scaleY: [1, 1.8, 1],
                                          }
                                        : { fill: inactiveColor, scaleY: 1 }
                                }
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                        </g>
                    )
                })}
            </svg>

            {/* số % ở giữa */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.round(size * 0.32),
                    fontWeight: 700,
                    color:
                        activated.filter(Boolean).length === segments
                            ? activeColor
                            : "#ffffff",
                    lineHeight: 1,
                    userSelect: "none",
                }}
            >
                {progress}%
            </div>
        </div>
    )
}

addPropertyControls(LoadingSpokesBounce, {
    size: {
        type: ControlType.Number,
        title: "Base Size",
        defaultValue: 200,
        min: 120,
        max: 600,
        unit: "px",
    },
    segments: {
        type: ControlType.Number,
        title: "Segments",
        defaultValue: 24,
        min: 8,
        max: 60,
        step: 1,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (ms)",
        defaultValue: 4000,
        min: 500,
        max: 20000,
        step: 100,
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#3AF726",
    },
    inactiveColor: {
        type: ControlType.Color,
        title: "Inactive",
        defaultValue: "#ffffff",
    },
    barLength: {
        type: ControlType.Number,
        title: "Bar Length",
        defaultValue: 18,
        min: 8,
        max: 40,
        step: 1,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 8,
        min: 2,
        max: 18,
        step: 1,
    },
})
