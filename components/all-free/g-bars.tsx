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


// User request: create a reusable Framer React/TypeScript Gradient Bars Background component (shadcn-style source adapted for Framer), keep typed editable props (numBars, gradientFrom, gradientTo, animationDuration, backgroundColor, children), avoid external images, and expose practical property controls for canvas editing.

interface GradientBarsProps {
    numBars: number
    barWidth: number
    barHeight: number
    barDirection: "Y Axis" | "X Axis"
    gradientFrom: string
    gradientTo: string
    animationDuration: number
    animationEnabled: boolean
    animationMode: "Pulse" | "Float" | "Wave" | "None"
    animationIntensity: number
    stagger: number
    backgroundColor: string
    children?: React.ReactNode
}

interface MyComponentProps extends GradientBarsProps {
    centerCopy: string
}

function GradientBars(props: GradientBarsProps) {
    const {
        numBars,
        barWidth,
        barHeight,
        barDirection,
        gradientFrom,
        gradientTo,
        animationDuration,
        animationEnabled,
        animationMode,
        animationIntensity,
        stagger,
        backgroundColor,
        children,
    } = props

    // Detects the Framer canvas and export/static-rendering contexts.
    // Animations must be disabled in those contexts to avoid perf issues
    // in the editor and visual artifacts in exports.
    const isStatic = useIsStaticRenderer()

    const bars = React.useMemo(() => {
        const safeCount = Math.max(1, Math.floor(numBars))
        const safeBarWidth = Math.max(1, Math.min(1000, barWidth))
        const safeBarHeight = Math.max(1, Math.min(1000, barHeight))
        const clampedIntensity = Math.max(0, Math.min(100, animationIntensity))
        const intensityFactor = clampedIntensity / 100
        // Force animations off whenever we're in a static render context
        // (canvas thumbnail, PNG/PDF export, etc.)
        const shouldAnimate =
            !isStatic && animationEnabled && animationMode !== "None"
        const isYAxis = barDirection === "Y Axis"

        const translatePercent = 4 + intensityFactor * 26
        const pulseScale = 1 + intensityFactor * 0.35
        const minOpacity = 0.15 + (1 - intensityFactor) * 0.35
        const maxOpacity = Math.min(1, 0.35 + intensityFactor * 0.65)

        const keyframeName = isYAxis
            ? animationMode === "Pulse"
                ? "framerGradientBarsPulseY"
                : animationMode === "Wave"
                  ? "framerGradientBarsWaveY"
                  : "framerGradientBarsFloatY"
            : animationMode === "Pulse"
              ? "framerGradientBarsPulseX"
              : animationMode === "Wave"
                ? "framerGradientBarsWaveX"
                : "framerGradientBarsFloatX"

        return Array.from({ length: safeCount }, (_, index) => {
            const delay = stagger * index
            const baseOpacity = 0.25 + (index / safeCount) * 0.5
            // In static contexts, freeze each bar at a representative,
            // pleasant-looking opacity/scale instead of an animated one.
            const staticOpacity = Math.min(
                1,
                Math.max(baseOpacity, (minOpacity + maxOpacity) / 2)
            )

            return (
                <div
                    key={`bar-${index}`}
                    style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        flexBasis: isYAxis
                            ? `${safeBarWidth}px`
                            : `${safeBarHeight}px`,
                        minWidth: isYAxis ? `${safeBarWidth}px` : undefined,
                        minHeight: isYAxis ? undefined : `${safeBarHeight}px`,
                        height: isYAxis
                            ? `min(100%, ${safeBarHeight}px)`
                            : `${safeBarHeight}px`,
                        width: isYAxis
                            ? `${safeBarWidth}px`
                            : `min(100%, ${safeBarWidth}px)`,
                        background: `linear-gradient(${isYAxis ? "180deg" : "90deg"}, ${gradientFrom}, ${gradientTo})`,
                        opacity: shouldAnimate ? baseOpacity : staticOpacity,
                        transformOrigin: isYAxis
                            ? "center center"
                            : "center center",
                        animationName: shouldAnimate ? keyframeName : "none",
                        animationDuration: shouldAnimate
                            ? `${animationDuration}s`
                            : undefined,
                        animationDelay: shouldAnimate ? `${delay}s` : undefined,
                        animationIterationCount: shouldAnimate
                            ? "infinite"
                            : undefined,
                        animationTimingFunction: shouldAnimate
                            ? "ease-in-out"
                            : undefined,
                        animationPlayState: shouldAnimate
                            ? "running"
                            : "paused",
                        willChange: shouldAnimate
                            ? "transform, opacity"
                            : undefined,
                        ["--gb-translate" as string]: `${translatePercent}%`,
                        ["--gb-pulse-scale" as string]: `${pulseScale}`,
                        ["--gb-min-opacity" as string]: `${minOpacity}`,
                        ["--gb-max-opacity" as string]: `${maxOpacity}`,
                    }}
                />
            )
        })
    }, [
        animationDuration,
        animationEnabled,
        animationIntensity,
        animationMode,
        gradientFrom,
        gradientTo,
        numBars,
        barDirection,
        barWidth,
        barHeight,
        stagger,
        isStatic,
    ])

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {/* Keyframes are only needed when we might animate; harmless to
                keep mounted, but we never assign them as animation-name
                when isStatic is true (see shouldAnimate above). */}
            {!isStatic && (
                <style>{`
                    @keyframes framerGradientBarsFloatY {
                        0% { transform: translateY(var(--gb-translate)); opacity: var(--gb-min-opacity); }
                        50% { transform: translateY(calc(var(--gb-translate) * -1)); opacity: var(--gb-max-opacity); }
                        100% { transform: translateY(var(--gb-translate)); opacity: var(--gb-min-opacity); }
                    }
                    @keyframes framerGradientBarsPulseY {
                        0% { transform: scaleY(1); opacity: var(--gb-min-opacity); }
                        50% { transform: scaleY(var(--gb-pulse-scale)); opacity: var(--gb-max-opacity); }
                        100% { transform: scaleY(1); opacity: var(--gb-min-opacity); }
                    }
                    @keyframes framerGradientBarsWaveY {
                        0% { transform: translateY(var(--gb-translate)) scaleY(1); opacity: var(--gb-min-opacity); }
                        50% { transform: translateY(calc(var(--gb-translate) * -1)) scaleY(var(--gb-pulse-scale)); opacity: var(--gb-max-opacity); }
                        100% { transform: translateY(var(--gb-translate)) scaleY(1); opacity: var(--gb-min-opacity); }
                    }
                    @keyframes framerGradientBarsFloatX {
                        0% { transform: translateX(var(--gb-translate)); opacity: var(--gb-min-opacity); }
                        50% { transform: translateX(calc(var(--gb-translate) * -1)); opacity: var(--gb-max-opacity); }
                        100% { transform: translateX(var(--gb-translate)); opacity: var(--gb-min-opacity); }
                    }
                    @keyframes framerGradientBarsPulseX {
                        0% { transform: scaleX(1); opacity: var(--gb-min-opacity); }
                        50% { transform: scaleX(var(--gb-pulse-scale)); opacity: var(--gb-max-opacity); }
                        100% { transform: scaleX(1); opacity: var(--gb-min-opacity); }
                    }
                    @keyframes framerGradientBarsWaveX {
                        0% { transform: translateX(var(--gb-translate)) scaleX(1); opacity: var(--gb-min-opacity); }
                        50% { transform: translateX(calc(var(--gb-translate) * -1)) scaleX(var(--gb-pulse-scale)); opacity: var(--gb-max-opacity); }
                        100% { transform: translateX(var(--gb-translate)) scaleX(1); opacity: var(--gb-min-opacity); }
                    }
                `}</style>
            )}

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: barDirection === "Y Axis" ? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    padding: 6,
                }}
            >
                {bars}
            </div>

            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    padding: "20px",
                }}
            >
                {children}
            </div>
        </div>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Component(props: MyComponentProps) {
    const {
        numBars,
        barWidth,
        barHeight,
        barDirection,
        gradientFrom,
        gradientTo,
        animationDuration,
        animationEnabled,
        animationMode,
        animationIntensity,
        stagger,
        backgroundColor,
        children,
        centerCopy,
    } = props

    const content = React.useMemo(() => {
        if (children) return children
        return (
            <div
                style={{
                    minWidth: "max-content",
                    color: "#FFFFFF",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                }}
            >
                {centerCopy}
            </div>
        )
    }, [centerCopy, children])

    return (
        <GradientBars
            numBars={numBars}
            barWidth={barWidth}
            barHeight={barHeight}
            barDirection={barDirection}
            gradientFrom={gradientFrom}
            gradientTo={gradientTo}
            animationDuration={animationDuration}
            animationEnabled={animationEnabled}
            animationMode={animationMode}
            animationIntensity={animationIntensity}
            stagger={stagger}
            backgroundColor={backgroundColor}
        >
            {content}
        </GradientBars>
    )
}

addPropertyControls(Component, {
    numBars: {
        type: ControlType.Number,
        title: "Bars",
        defaultValue: 16,
        min: 1,
        max: 80,
        step: 1,
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        defaultValue: 4,
        min: 1,
        max: 1000,
        step: 1,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        defaultValue: 200,
        min: 1,
        max: 1000,
        step: 1,
    },
    barDirection: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "Y Axis",
        options: ["Y Axis", "X Axis"],
        optionTitles: ["Y Axis", "X Axis"],
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "From",
        defaultValue: "#7C3AED",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "To",
        defaultValue: "#06B6D4",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 5,
        min: 1,
        max: 20,
        unit: "s",
        step: 0.5,
    },
    animationEnabled: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: true,
    },
    animationMode: {
        type: ControlType.Enum,
        title: "Mode",
        defaultValue: "Float",
        options: ["Pulse", "Float", "Wave", "None"],
        optionTitles: ["Pulse", "Float", "Wave", "None"],
    },
    animationIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        defaultValue: 0.08,
        min: 0,
        max: 2,
        step: 0.01,
        unit: "s",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0B0B0F",
    },
    centerCopy: {
        type: ControlType.String,
        title: "Center Copy",
        defaultValue: "Gradient Bars",
    },
    children: {
        type: ControlType.Slot,
        title: "Content",
    },
})
