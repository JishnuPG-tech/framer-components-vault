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


/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

export default function MasterGrid(props: Partial<FrameProps> & any) {
    const {
        columns,
        gutter,
        margin,
        color,
        opacity,
        showCenterLine,
        backgroundVisible,
        showGoldenRatio,
        goldenMode,
        showBaseline,
        baselineStep,
        showRuleOfThirds,
        thirdsMode,
        showSafeArea,
        safeInsetX,
        safeInsetY,
        showContainerOutline,
        containerWidth,
        containerRadius,
        ...rest
    } = props

    const safeColumns = Math.max(1, Math.floor(columns))
    const numericHeight =
        typeof props.height === "number" && props.height > 0
            ? props.height
            : 800

    const baselineSpacing = Math.max(2, baselineStep || 8)
    const baselineCount = Math.ceil(numericHeight / baselineSpacing)

    return (
        <div
            {...rest}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: backgroundVisible
                    ? "rgba(0,0,0,0.03)"
                    : "transparent",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        paddingLeft: margin,
                        paddingRight: margin,
                        display: "grid",
                        gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))`,
                        columnGap: gutter,
                        boxSizing: "border-box",
                    }}
                >
                    {Array.from({ length: safeColumns }).map((_, index) => (
                        <div
                            key={index}
                            style={{
                                background: color,
                                opacity: opacity,
                                borderRadius: 2,
                                height: "100%",
                            }}
                        />
                    ))}
                </div>
            </div>

            {showBaseline &&
                Array.from({ length: baselineCount }).map((_, i) => (
                    <div
                        key={`baseline-${i}`}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            top: i * baselineSpacing,
                            height: 1,
                            background: color,
                            opacity: 0.12,
                            pointerEvents: "none",
                        }}
                    />
                ))}

            {showCenterLine && (
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: 0,
                        bottom: 0,
                        width: 1,
                        background: color,
                        opacity: Math.min(1, opacity + 0.15),
                        transform: "translateX(-0.5px)",
                        pointerEvents: "none",
                    }}
                />
            )}

            {showGoldenRatio && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "38.2%",
                            width: 1,
                            background: color,
                            opacity: opacity + 0.25,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "61.8%",
                            width: 1,
                            background: color,
                            opacity: opacity + 0.25,
                            pointerEvents: "none",
                        }}
                    />
                    {goldenMode !== "vertical" && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "38.2%",
                                    height: 1,
                                    background: color,
                                    opacity: opacity + 0.25,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "61.8%",
                                    height: 1,
                                    background: color,
                                    opacity: opacity + 0.25,
                                    pointerEvents: "none",
                                }}
                            />
                        </>
                    )}
                </>
            )}

            {showRuleOfThirds && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "33.333%",
                            width: 1,
                            background: color,
                            opacity: 0.2,
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: "66.666%",
                            width: 1,
                            background: color,
                            opacity: 0.2,
                            pointerEvents: "none",
                        }}
                    />
                    {thirdsMode !== "vertical" && (
                        <>
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "33.333%",
                                    height: 1,
                                    background: color,
                                    opacity: 0.2,
                                    pointerEvents: "none",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    top: "66.666%",
                                    height: 1,
                                    background: color,
                                    opacity: 0.2,
                                    pointerEvents: "none",
                                }}
                            />
                        </>
                    )}
                </>
            )}

            {showSafeArea && (
                <div
                    style={{
                        position: "absolute",
                        top: safeInsetY,
                        bottom: safeInsetY,
                        left: safeInsetX,
                        right: safeInsetX,
                        borderRadius: 24,
                        borderStyle: "dashed",
                        borderWidth: 1,
                        borderColor: color,
                        opacity: 0.35,
                        pointerEvents: "none",
                    }}
                />
            )}

            {showContainerOutline && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "100%",
                        maxWidth: containerWidth,
                        borderRadius: containerRadius,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: color,
                        opacity: 0.3,
                        pointerEvents: "none",
                    }}
                />
            )}
        </div>
    )
}

MasterGrid.defaultProps = {
    width: 1200,
    height: 800,
    columns: 12,
    gutter: 16,
    margin: 80,
    color: "rgba(0,123,255,1)",
    opacity: 0.08,
    showCenterLine: false,
    backgroundVisible: false,
    showGoldenRatio: false,
    goldenMode: "both",
    showBaseline: false,
    baselineStep: 8,
    showRuleOfThirds: false,
    thirdsMode: "both",
    showSafeArea: false,
    safeInsetX: 24,
    safeInsetY: 24,
    showContainerOutline: false,
    containerWidth: 1200,
    containerRadius: 16,
}

addPropertyControls(MasterGrid, {
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 1,
        max: 24,
        defaultValue: 12,
    },
    gutter: {
        type: ControlType.Number,
        title: "Gutter",
        min: 0,
        max: 200,
        defaultValue: 16,
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        min: 0,
        max: 2000,
        defaultValue: 80,
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "rgba(0,123,255,1)",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: 0.08,
    },
    showCenterLine: {
        type: ControlType.Boolean,
        title: "Center Line",
        defaultValue: false,
    },
    backgroundVisible: {
        type: ControlType.Boolean,
        title: "BG Tint",
        defaultValue: false,
    },
    showGoldenRatio: {
        type: ControlType.Boolean,
        title: "Golden Grid",
        defaultValue: false,
    },
    goldenMode: {
        type: ControlType.Enum,
        title: "Golden Mode",
        options: ["vertical", "both"],
        optionTitles: ["Vertical Only", "Vertical + Horizontal"],
        hidden: (props) => !props.showGoldenRatio,
        defaultValue: "both",
    },
    showBaseline: {
        type: ControlType.Boolean,
        title: "Baseline Grid",
        defaultValue: false,
    },
    baselineStep: {
        type: ControlType.Number,
        title: "Baseline Step",
        min: 2,
        max: 40,
        step: 2,
        hidden: (props) => !props.showBaseline,
        defaultValue: 8,
    },
    showRuleOfThirds: {
        type: ControlType.Boolean,
        title: "Thirds Grid",
        defaultValue: false,
    },
    thirdsMode: {
        type: ControlType.Enum,
        title: "Thirds Mode",
        options: ["vertical", "both"],
        optionTitles: ["Vertical Only", "Vertical + Horizontal"],
        hidden: (props) => !props.showRuleOfThirds,
        defaultValue: "both",
    },
    showSafeArea: {
        type: ControlType.Boolean,
        title: "Safe Area",
        defaultValue: false,
    },
    safeInsetX: {
        type: ControlType.Number,
        title: "Safe X",
        min: 0,
        max: 200,
        defaultValue: 24,
        hidden: (props) => !props.showSafeArea,
    },
    safeInsetY: {
        type: ControlType.Number,
        title: "Safe Y",
        min: 0,
        max: 200,
        defaultValue: 24,
        hidden: (props) => !props.showSafeArea,
    },
    showContainerOutline: {
        type: ControlType.Boolean,
        title: "Container",
        defaultValue: false,
    },
    containerWidth: {
        type: ControlType.Number,
        title: "Width",
        min: 200,
        max: 2400,
        defaultValue: 1200,
        hidden: (props) => !props.showContainerOutline,
    },
    containerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 120,
        defaultValue: 16,
        hidden: (props) => !props.showContainerOutline,
    },
})
