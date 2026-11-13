/**
 * Made with 💛 by Karim Saif
 * Created and customized for Framer by Karim Saif
 *
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 1000
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

"use client"

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

import { useInView } from "framer-motion"

type AnimationTrigger = "onLoad" | "inView" | "scroll"
type Easing = "easeOut" | "easeInOut" | "linear"

interface LineGradient {
    enabled: boolean
    start: string
    middle: string
    end: string
    angle: number
}

interface RibbonPlacement {
    x: number
    y: number
    rotation: number
    scale: number
}

interface Props {
    pathSource: "preset" | "custom"

    customLine1?: React.ReactNode
    customLine2?: React.ReactNode
    customLine3?: React.ReactNode
    customLine4?: React.ReactNode
    customLine5?: React.ReactNode
    customLine6?: React.ReactNode

    background: string

    grain: boolean
    grainAmount: number
    grainSize: number

    red: string
    blue: string
    pink: string
    line4Color: string
    green: string
    gold: string

    line1Gradient: LineGradient
    line2Gradient: LineGradient
    line3Gradient: LineGradient
    line4Gradient: LineGradient
    line5Gradient: LineGradient
    line6Gradient: LineGradient

    strokeWidth: number
    lineCount: number

    redPlacement: RibbonPlacement
    bluePlacement: RibbonPlacement
    pinkTopPlacement: RibbonPlacement
    pinkSidePlacement: RibbonPlacement
    greenPlacement: RibbonPlacement
    goldPlacement: RibbonPlacement

    animate: boolean
    animationTrigger: AnimationTrigger
    inViewAmount: number
    playOnce: boolean

    scrollStart: number
    scrollEnd: number
    scrollStagger: number
    scrollReverse: boolean

    duration: number
    startDelay: number
    stagger: number
    easing: Easing

    rounded: boolean

    style?: React.CSSProperties
}

interface Ribbon {
    path: string
    color: string
}

const DEFAULT_PLACEMENT: RibbonPlacement = {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
}

const DEFAULT_GRADIENTS: LineGradient[] = [
    {
        enabled: false,
        start: "#5E2BFF",
        middle: "#007AFF",
        end: "#00C7BE",
        angle: 0,
    },
    {
        enabled: false,
        start: "#0066FF",
        middle: "#00C7BE",
        end: "#34C759",
        angle: 20,
    },
    {
        enabled: false,
        start: "#BF5AF2",
        middle: "#FF2D55",
        end: "#FF9500",
        angle: 35,
    },
    {
        enabled: false,
        start: "#FF00A8",
        middle: "#FF375F",
        end: "#FF9F0A",
        angle: -25,
    },
    {
        enabled: false,
        start: "#00C7BE",
        middle: "#30D158",
        end: "#D7FF00",
        angle: 15,
    },
    {
        enabled: false,
        start: "#FF9500",
        middle: "#FFCC00",
        end: "#D7FF00",
        angle: -20,
    },
]

const RIBBONS: Ribbon[] = [
    {
        path: "M -95 322 C 4 366, 88 313, 116 264 C 140 222, 116 151, 74 154 C 24 158, 29 246, 91 270 C 168 300, 208 260, 214 176 C 225 40, 280 5, 390 -34",
        color: "#F4513B",
    },
    {
        path: "M 93 -102 C 131 74, 236 151, 355 147 C 474 143, 526 59, 573 -76",
        color: "#565DB3",
    },
    {
        path: "M 451 -88 C 406 20, 427 75, 507 91 C 591 108, 529 163, 542 226 C 551 270, 584 291, 650 288",
        color: "#CB74B4",
    },
    {
        path: "M -92 401 C -10 391, 83 394, 92 462 C 98 507, 56 540, -52 540",
        color: "#CB74B4",
    },
    {
        path: "M -72 742 C 27 778, 49 638, 106 672 C 151 699, 82 772, 181 790 C 308 813, 250 864, 181 900 C 123 931, 160 982, 230 1047",
        color: "#C8BC4E",
    },
    {
        path: "M 668 722 C 579 523, 449 541, 436 674 C 426 785, 520 842, 445 924 C 382 994, 295 927, 176 953 C 132 963, 113 1004, 126 1062",
        color: "#F4AC28",
    },
]

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function easingToCSS(easing: Easing): string {
    switch (easing) {
        case "linear":
            return "linear"

        case "easeInOut":
            return "cubic-bezier(0.65, 0, 0.35, 1)"

        default:
            return "cubic-bezier(0.16, 1, 0.3, 1)"
    }
}

function safeId(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, "")
}

function getGradientId(componentId: string, index: number): string {
    return `karimSaifRibbonGradient-${componentId}-${index}`
}

function getAnimationName(componentId: string, index: number): string {
    return `karimSaifRibbonAnimation-${componentId}-${index}`
}

function createGrainDataURL(amount: number, size: number): string {
    const safeAmount = clamp(amount, 0, 1)
    const safeSize = Math.max(8, Math.round(size))

    const circles: string[] = []

    for (let i = 0; i < 220; i++) {
        const x = (i * 47.13) % safeSize

        const y = (i * 91.73) % safeSize

        const opacity = safeAmount * (0.25 + (((i * 17) % 100) / 100) * 0.75)

        circles.push(
            `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(
                2
            )}" r="0.6" fill="white" opacity="${opacity.toFixed(3)}"/>`
        )
    }

    const svg = `
<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${safeSize}"
    height="${safeSize}"
    viewBox="0 0 ${safeSize} ${safeSize}"
>
    ${circles.join("")}
</svg>
`

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function PlacementControl(title: string, hidden?: (props: Props) => boolean) {
    return {
        type: ControlType.Object,
        title,
        hidden,
        controls: {
            x: {
                type: ControlType.Number,
                title: "X",
                min: -500,
                max: 500,
                step: 1,
                defaultValue: 0,
                description: "Moves the ribbon horizontally.",
            },
            y: {
                type: ControlType.Number,
                title: "Y",
                min: -800,
                max: 800,
                step: 1,
                defaultValue: 0,
                description: "Moves the ribbon vertically.",
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                min: -180,
                max: 180,
                step: 1,
                defaultValue: 0,
                unit: "°",
                description: "Rotates the ribbon around the center.",
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.1,
                max: 3,
                step: 0.01,
                defaultValue: 1,
                description: "Scales the individual ribbon.",
            },
        },
    }
}

function GradientControl(title: string, hidden?: (props: Props) => boolean) {
    return {
        type: ControlType.Object,
        title,
        hidden,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                description:
                    "Enables the three-color gradient for this ribbon.",
            },
            start: {
                type: ControlType.Color,
                title: "Start",
                defaultValue: "#5E2BFF",
                description: "Gradient starting color.",
            },
            middle: {
                type: ControlType.Color,
                title: "Middle",
                defaultValue: "#007AFF",
                description: "Gradient middle color.",
            },
            end: {
                type: ControlType.Color,
                title: "End",
                defaultValue: "#00C7BE",
                description: "Gradient ending color.",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: -180,
                max: 180,
                step: 1,
                defaultValue: 0,
                unit: "°",
                description: "Rotates the direction of the gradient.",
            },
        },
    }
}

function RibbonGradient({
    id,
    gradient,
}: {
    id: string
    gradient: LineGradient
}) {
    const radians = (gradient.angle * Math.PI) / 180

    const x1 = 50 - Math.cos(radians) * 50

    const y1 = 50 - Math.sin(radians) * 50

    const x2 = 50 + Math.cos(radians) * 50

    const y2 = 50 + Math.sin(radians) * 50

    return (
        <linearGradient
            id={id}
            x1={`${x1}%`}
            y1={`${y1}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
        >
            <stop offset="0%" stopColor={gradient.start} />

            <stop offset="50%" stopColor={gradient.middle} />

            <stop offset="100%" stopColor={gradient.end} />
        </linearGradient>
    )
}

interface RibbonPathProps {
    ribbon: Ribbon
    color: string
    gradient: LineGradient
    placement: RibbonPlacement
    strokeWidth: number
    rounded: boolean
    animationEnabled: boolean
    shouldPlay: boolean
    duration: number
    delay: number
    easing: Easing
    gradientId: string
    animationName: string
    pathRef: (element: SVGPathElement | null) => void
}

function RibbonPath({
    ribbon,
    color,
    gradient,
    placement,
    strokeWidth,
    rounded,
    animationEnabled,
    shouldPlay,
    duration,
    delay,
    easing,
    gradientId,
    animationName,
    pathRef,
}: RibbonPathProps) {
    const transform = [
        `translate(${placement.x} ${placement.y})`,
        "translate(300 500)",
        `rotate(${placement.rotation})`,
        `scale(${placement.scale})`,
        "translate(-300 -500)",
    ].join(" ")

    const shouldAnimate = animationEnabled && shouldPlay

    return (
        <path
            ref={pathRef}
            d={ribbon.path}
            transform={transform}
            pathLength={1}
            fill="none"
            stroke={gradient.enabled ? `url(#${gradientId})` : color}
            strokeWidth={strokeWidth}
            strokeLinecap={rounded ? "round" : "butt"}
            strokeLinejoin={rounded ? "round" : "miter"}
            strokeDasharray={animationEnabled ? "1" : undefined}
            strokeDashoffset={animationEnabled ? 1 : 0}
            style={
                shouldAnimate
                    ? {
                          animationName: animationName,
                          animationDuration: `${Math.max(0.1, duration)}s`,
                          animationTimingFunction: easingToCSS(easing),
                          animationDelay: `${Math.max(0, delay)}s`,
                          animationIterationCount: 1,
                          animationFillMode: "forwards",
                      }
                    : undefined
            }
        />
    )
}

export default function KarimSaifAnimatedRibbons(props: Props) {
    const {
        pathSource = "preset",

        customLine1,
        customLine2,
        customLine3,
        customLine4,
        customLine5,
        customLine6,

        background = "#F5F5F5",

        grain = false,
        grainAmount = 0.12,
        grainSize = 80,

        red = "#F4513B",
        blue = "#565DB3",
        pink = "#CB74B4",
        line4Color = "#CB74B4",
        green = "#C8BC4E",
        gold = "#F4AC28",

        line1Gradient = DEFAULT_GRADIENTS[0],
        line2Gradient = DEFAULT_GRADIENTS[1],
        line3Gradient = DEFAULT_GRADIENTS[2],
        line4Gradient = DEFAULT_GRADIENTS[3],
        line5Gradient = DEFAULT_GRADIENTS[4],
        line6Gradient = DEFAULT_GRADIENTS[5],

        strokeWidth = 3,
        lineCount = 6,

        redPlacement = DEFAULT_PLACEMENT,
        bluePlacement = DEFAULT_PLACEMENT,
        pinkTopPlacement = DEFAULT_PLACEMENT,
        pinkSidePlacement = DEFAULT_PLACEMENT,
        greenPlacement = DEFAULT_PLACEMENT,
        goldPlacement = DEFAULT_PLACEMENT,

        animate = true,
        animationTrigger = "onLoad",
        inViewAmount = 20,
        playOnce = true,

        scrollStart = 0,
        scrollEnd = 100,
        scrollStagger = 0,
        scrollReverse = false,

        duration = 1.8,
        startDelay = 0,
        stagger = 0.12,
        easing = "easeOut",

        rounded = true,

        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement | null>(null)

    const pathRefs = React.useRef<Array<SVGPathElement | null>>([])

    const isStaticRenderer = useIsStaticRenderer()

    const reducedMotion = useReducedMotion()

    const inView = useInView(rootRef, {
        amount: clamp(inViewAmount / 100, 0.01, 1),
        once: playOnce,
    })

    const componentId = safeId(React.useId())

    const count = clamp(Math.round(lineCount), 1, 6)

    const colors = React.useMemo(
        () => [red, blue, pink, line4Color, green, gold],
        [red, blue, pink, line4Color, green, gold]
    )

    const gradients = React.useMemo(
        () => [
            line1Gradient,
            line2Gradient,
            line3Gradient,
            line4Gradient,
            line5Gradient,
            line6Gradient,
        ],
        [
            line1Gradient,
            line2Gradient,
            line3Gradient,
            line4Gradient,
            line5Gradient,
            line6Gradient,
        ]
    )

    const placements = React.useMemo(
        () => [
            redPlacement,
            bluePlacement,
            pinkTopPlacement,
            pinkSidePlacement,
            greenPlacement,
            goldPlacement,
        ],
        [
            redPlacement,
            bluePlacement,
            pinkTopPlacement,
            pinkSidePlacement,
            greenPlacement,
            goldPlacement,
        ]
    )

    const customLines = [
        customLine1,
        customLine2,
        customLine3,
        customLine4,
        customLine5,
        customLine6,
    ]

    const animationEnabled = animate && !isStaticRenderer && !reducedMotion

    const shouldPlay =
        animationEnabled &&
        animationTrigger !== "scroll" &&
        (animationTrigger === "onLoad" || inView)

    const grainImage = React.useMemo(() => {
        if (!grain) {
            return undefined
        }

        return createGrainDataURL(grainAmount, grainSize)
    }, [grain, grainAmount, grainSize])

    React.useEffect(() => {
        if (!animationEnabled || animationTrigger !== "scroll") {
            return
        }

        let frame = 0
        let disposed = false

        const update = () => {
            frame = 0

            if (disposed) {
                return
            }

            const element = rootRef.current

            if (!element) {
                return
            }

            const rect = element.getBoundingClientRect()

            const viewportHeight = window.innerHeight

            const start = clamp(scrollStart / 100, 0, 1)

            const end = clamp(scrollEnd / 100, 0, 1)

            const range = Math.max(0.001, end - start)

            const elementStart = rect.top + rect.height * start

            const elementEnd = rect.top + rect.height * (start + range)

            const distance = Math.max(
                1,
                elementEnd - elementStart + viewportHeight
            )

            const rawProgress = (viewportHeight - elementStart) / distance

            const progress = clamp(rawProgress, 0, 1)

            for (let index = 0; index < count; index++) {
                const path = pathRefs.current[index]

                if (!path) {
                    continue
                }

                const staggerAmount = clamp(
                    (scrollStagger / 100) * index,
                    0,
                    0.95
                )

                const available = Math.max(0.001, 1 - staggerAmount)

                let lineProgress = clamp(
                    (progress - staggerAmount) / available,
                    0,
                    1
                )

                if (scrollReverse) {
                    lineProgress = 1 - lineProgress
                }

                path.style.strokeDasharray = "1"

                path.style.strokeDashoffset = String(
                    clamp(1 - lineProgress, 0, 1)
                )
            }
        }

        const requestUpdate = () => {
            if (frame !== 0) {
                return
            }

            frame = window.requestAnimationFrame(update)
        }

        const handleScroll = () => {
            requestUpdate()
        }

        const handleResize = () => {
            requestUpdate()
        }

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        })

        window.addEventListener("resize", handleResize)

        requestUpdate()

        return () => {
            disposed = true

            if (frame !== 0) {
                window.cancelAnimationFrame(frame)
            }

            window.removeEventListener("scroll", handleScroll)

            window.removeEventListener("resize", handleResize)
        }
    }, [
        animationEnabled,
        animationTrigger,
        count,
        scrollStart,
        scrollEnd,
        scrollStagger,
        scrollReverse,
    ])

    const keyframes = React.useMemo(() => {
        if (!animationEnabled) {
            return ""
        }

        return RIBBONS.slice(0, count)
            .map((_, index) => {
                const animationName = getAnimationName(componentId, index)

                return `
@keyframes ${animationName} {
    0% {
        stroke-dashoffset: 1;
    }

    100% {
        stroke-dashoffset: 0;
    }
}
`
            })
            .join("\n")
    }, [animationEnabled, componentId, count])

    const renderGradients = () => {
        return gradients.slice(0, count).map((gradient, index) => {
            if (!gradient || !gradient.enabled) {
                return null
            }

            return (
                <RibbonGradient
                    key={`gradient-${index}`}
                    id={getGradientId(componentId, index)}
                    gradient={gradient}
                />
            )
        })
    }

    const renderRibbons = () => {
        return RIBBONS.slice(0, count).map((ribbon, index) => {
            const gradient = gradients[index] || DEFAULT_GRADIENTS[index]

            const placement = placements[index] || DEFAULT_PLACEMENT

            const color = colors[index] || ribbon.color

            const gradientId = getGradientId(componentId, index)

            const animationName = getAnimationName(componentId, index)

            return (
                <RibbonPath
                    key={`ribbon-${index}`}
                    ribbon={ribbon}
                    color={color}
                    gradient={gradient}
                    placement={placement}
                    strokeWidth={Math.max(0.1, strokeWidth)}
                    rounded={rounded}
                    animationEnabled={animationEnabled}
                    shouldPlay={shouldPlay}
                    duration={duration}
                    delay={startDelay + index * stagger}
                    easing={easing}
                    gradientId={gradientId}
                    animationName={animationName}
                    pathRef={(element) => {
                        pathRefs.current[index] = element
                    }}
                />
            )
        })
    }

    const renderCustomLines = () => {
        return customLines
            .slice(0, count)
            .map((line, index) => (
                <React.Fragment key={`custom-line-${index}`}>
                    {line}
                </React.Fragment>
            ))
    }

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                background,
                ...style,
            }}
        >
            {grain && grainImage && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                        backgroundImage: grainImage,
                        backgroundRepeat: "repeat",
                        backgroundSize: `${Math.max(
                            8,
                            Math.round(grainSize)
                        )}px ${Math.max(8, Math.round(grainSize))}px`,
                    }}
                />
            )}

            {pathSource === "custom" ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                    }}
                >
                    {renderCustomLines()}
                </div>
            ) : (
                <>
                    {keyframes && <style>{keyframes}</style>}

                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 600 1000"
                        preserveAspectRatio="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            display: "block",
                            overflow: "visible",
                            zIndex: 1,
                        }}
                    >
                        <defs>{renderGradients()}</defs>

                        {renderRibbons()}
                    </svg>
                </>
            )}
        </div>
    )
}

KarimSaifAnimatedRibbons.displayName = "Karim Saif Animated Ribbons"

addPropertyControls(KarimSaifAnimatedRibbons, {
    pathSource: {
        type: ControlType.Enum,
        title: "Source",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom"],
        defaultValue: "preset",
        displaySegmentedControl: true,
        description:
            "Selects the built-in ribbon artwork or custom Framer layers.",
    },

    customLine1: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 1",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 1,
        description: "Framer component used as custom line 1.",
    },

    customLine2: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 2",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 2,
        description: "Framer component used as custom line 2.",
    },

    customLine3: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 3",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 3,
        description: "Framer component used as custom line 3.",
    },

    customLine4: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 4",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 4,
        description: "Framer component used as custom line 4.",
    },

    customLine5: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 5",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 5,
        description: "Framer component used as custom line 5.",
    },

    customLine6: {
        type: ControlType.ComponentInstance,
        title: "Custom Line 6",
        hidden: (props) => props.pathSource !== "custom" || props.lineCount < 6,
        description: "Framer component used as custom line 6.",
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#F5F5F5",
        description: "Sets the background color of the component.",
    },

    grain: {
        type: ControlType.Boolean,
        title: "Grain",
        defaultValue: false,
        description: "Adds a procedural film-grain texture.",
    },

    grainAmount: {
        type: ControlType.Number,
        title: "Grain Amount",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.12,
        hidden: (props) => !props.grain,
        description: "Controls the intensity of the grain texture.",
    },

    grainSize: {
        type: ControlType.Number,
        title: "Grain Size",
        min: 8,
        max: 200,
        step: 1,
        defaultValue: 80,
        hidden: (props) => !props.grain,
        description: "Controls the size of the procedural grain pattern.",
    },

    lineCount: {
        type: ControlType.Number,
        title: "Line Count",
        min: 1,
        max: 6,
        step: 1,
        defaultValue: 6,
        description: "Controls how many ribbon paths are displayed.",
    },

    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 3,
        unit: "px",
        description: "Controls the thickness of every ribbon.",
    },

    red: {
        type: ControlType.Color,
        title: "Line 1 Color",
        defaultValue: "#F4513B",
        description:
            "Solid color of the first ribbon when its gradient is disabled.",
    },

    blue: {
        type: ControlType.Color,
        title: "Line 2 Color",
        defaultValue: "#565DB3",
        description:
            "Solid color of the second ribbon when its gradient is disabled.",
    },

    pink: {
        type: ControlType.Color,
        title: "Line 3 Color",
        defaultValue: "#CB74B4",
        description:
            "Solid color of the third ribbon when its gradient is disabled.",
    },

    line4Color: {
        type: ControlType.Color,
        title: "Line 4 Color",
        defaultValue: "#CB74B4",
        description:
            "Solid color of the fourth ribbon when its gradient is disabled.",
    },

    green: {
        type: ControlType.Color,
        title: "Line 5 Color",
        defaultValue: "#C8BC4E",
        description:
            "Solid color of the fifth ribbon when its gradient is disabled.",
    },

    gold: {
        type: ControlType.Color,
        title: "Line 6 Color",
        defaultValue: "#F4AC28",
        description:
            "Solid color of the sixth ribbon when its gradient is disabled.",
    },

    line1Gradient: GradientControl(
        "Line 1 Gradient",
        (props) => props.lineCount < 1
    ),

    line2Gradient: GradientControl(
        "Line 2 Gradient",
        (props) => props.lineCount < 2
    ),

    line3Gradient: GradientControl(
        "Line 3 Gradient",
        (props) => props.lineCount < 3
    ),

    line4Gradient: GradientControl(
        "Line 4 Gradient",
        (props) => props.lineCount < 4
    ),

    line5Gradient: GradientControl(
        "Line 5 Gradient",
        (props) => props.lineCount < 5
    ),

    line6Gradient: GradientControl(
        "Line 6 Gradient",
        (props) => props.lineCount < 6
    ),

    redPlacement: PlacementControl(
        "Line 1 Placement",
        (props) => props.lineCount < 1
    ),

    bluePlacement: PlacementControl(
        "Line 2 Placement",
        (props) => props.lineCount < 2
    ),

    pinkTopPlacement: PlacementControl(
        "Line 3 Placement",
        (props) => props.lineCount < 3
    ),

    pinkSidePlacement: PlacementControl(
        "Line 4 Placement",
        (props) => props.lineCount < 4
    ),

    greenPlacement: PlacementControl(
        "Line 5 Placement",
        (props) => props.lineCount < 5
    ),

    goldPlacement: PlacementControl(
        "Line 6 Placement",
        (props) => props.lineCount < 6
    ),

    animate: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
        description: "Enables the ribbon drawing animation.",
    },

    animationTrigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onLoad", "inView", "scroll"],
        optionTitles: ["On Load", "In View", "Scroll"],
        defaultValue: "onLoad",
        displaySegmentedControl: true,
        hidden: (props) => !props.animate,
        description: "Controls what starts the ribbon animation.",
    },

    inViewAmount: {
        type: ControlType.Number,
        title: "In View Amount",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 20,
        unit: "%",
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "inView",
        description:
            "Controls how much of the component must enter the viewport before animation begins.",
    },

    playOnce: {
        type: ControlType.Boolean,
        title: "Play Once",
        defaultValue: true,
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "inView",
        description:
            "Prevents the in-view animation from replaying after the first activation.",
    },

    scrollStart: {
        type: ControlType.Number,
        title: "Scroll Start",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
        unit: "%",
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "scroll",
        description: "Defines where the scroll animation begins.",
    },

    scrollEnd: {
        type: ControlType.Number,
        title: "Scroll End",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "%",
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "scroll",
        description: "Defines where the scroll animation finishes.",
    },

    scrollStagger: {
        type: ControlType.Number,
        title: "Scroll Stagger",
        min: 0,
        max: 95,
        step: 1,
        defaultValue: 0,
        unit: "%",
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "scroll",
        description:
            "Offsets each ribbon's progress to create a staggered scroll effect.",
    },

    scrollReverse: {
        type: ControlType.Boolean,
        title: "Reverse Scroll",
        defaultValue: false,
        hidden: (props) =>
            !props.animate || props.animationTrigger !== "scroll",
        description: "Reverses the direction of the scroll-driven drawing.",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.1,
        max: 10,
        step: 0.1,
        defaultValue: 1.8,
        unit: "s",
        hidden: (props) =>
            !props.animate || props.animationTrigger === "scroll",
        description: "Controls the duration of each ribbon animation.",
    },

    startDelay: {
        type: ControlType.Number,
        title: "Start Delay",
        min: 0,
        max: 10,
        step: 0.05,
        defaultValue: 0,
        unit: "s",
        hidden: (props) =>
            !props.animate || props.animationTrigger === "scroll",
        description: "Adds a delay before the first ribbon starts.",
    },

    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        min: 0,
        max: 2,
        step: 0.01,
        defaultValue: 0.12,
        unit: "s",
        hidden: (props) =>
            !props.animate || props.animationTrigger === "scroll",
        description: "Controls the delay between each ribbon.",
    },

    easing: {
        type: ControlType.Enum,
        title: "Easing",
        options: ["easeOut", "easeInOut", "linear"],
        optionTitles: ["Ease Out", "Ease In Out", "Linear"],
        defaultValue: "easeOut",
        hidden: (props) =>
            !props.animate || props.animationTrigger === "scroll",
        description:
            "Controls the easing curve of the ribbon drawing animation.",
    },

    rounded: {
        type: ControlType.Boolean,
        title: "Rounded",
        defaultValue: true,
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
