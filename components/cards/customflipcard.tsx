// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState } from "react"

interface FontStyle {
    family: string
    size: number
    weight: number
    color: string
    letterSpacing: number
    lineHeight: number
}
interface Props {
    flipTrigger: "click" | "hover"
    flipDuration: number
    borderRadiusMode: "all" | "custom"
    borderRadius: number
    borderRadiusTopLeft: number
    borderRadiusTopRight: number
    borderRadiusBottomRight: number
    borderRadiusBottomLeft: number
    frontFillColor: string
    frontFillImage: string
    showNumber: boolean
    numberText: string
    numberAlign: "flex-start" | "center" | "flex-end"
    numberStyle: FontStyle
    frontTitle: string
    frontTitleStyle: FontStyle
    frontTextAlign: "left" | "center" | "right"
    frontVerticalAlign: "flex-start" | "center" | "flex-end"
    frontPaddingMode: "all" | "custom"
    frontPadding: number
    frontPaddingTop: number
    frontPaddingRight: number
    frontPaddingBottom: number
    frontPaddingLeft: number
    showHint: boolean
    hintStyle: FontStyle
    backFillColor: string
    backFillImage: string
    backText: string
    backTextStyle: FontStyle
    backTextAlign: "left" | "center" | "right"
    backVerticalAlign: "flex-start" | "center" | "flex-end"
    backPaddingMode: "all" | "custom"
    backPadding: number
    backPaddingTop: number
    backPaddingRight: number
    backPaddingBottom: number
    backPaddingLeft: number
}

const F = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const DEF_FRONT: FontStyle = {
    family: F,
    size: 28,
    weight: 900,
    color: "#ffffff",
    letterSpacing: -0.01,
    lineHeight: 1.05,
}
const DEF_BACK: FontStyle = {
    family: F,
    size: 14,
    weight: 400,
    color: "#ffffff",
    letterSpacing: 0,
    lineHeight: 1.65,
}
const DEF_NUM: FontStyle = {
    family: F,
    size: 13,
    weight: 700,
    color: "#ffffff",
    letterSpacing: 0.05,
    lineHeight: 1,
}
const DEF_HINT: FontStyle = {
    family: F,
    size: 11,
    weight: 500,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.08,
    lineHeight: 1,
}

function fontCtrl(
    family: string,
    size: number,
    weight: number,
    color: string,
    lineHeight = 1.2
) {
    return {
        type: ControlType.Object,
        controls: {
            family: {
                type: ControlType.String,
                title: "Font Family",
                defaultValue: family,
            },
            size: {
                type: ControlType.Number,
                title: "Size (px)",
                defaultValue: size,
                min: 8,
                max: 120,
                step: 1,
                displayStepper: true,
            },
            weight: {
                type: ControlType.Enum,
                title: "Weight",
                defaultValue: weight,
                options: [100, 200, 300, 400, 500, 600, 700, 800, 900],
                optionTitles: [
                    "100",
                    "200",
                    "300",
                    "400",
                    "500",
                    "600",
                    "700",
                    "800",
                    "900",
                ],
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: color,
            },
            letterSpacing: {
                type: ControlType.Number,
                title: "Letter Spacing (em)",
                defaultValue: 0,
                min: -0.1,
                max: 1,
                step: 0.01,
                displayStepper: true,
            },
            lineHeight: {
                type: ControlType.Number,
                title: "Line Height",
                defaultValue: lineHeight,
                min: 0.8,
                max: 3,
                step: 0.05,
                displayStepper: true,
            },
        },
    }
}

export default function CustomTurnCard(props: Props) {
    const {
        flipTrigger = "click" as "click" | "hover",
        flipDuration = 0.55,
        borderRadiusMode = "all" as "all" | "custom",
        borderRadius = 12,
        borderRadiusTopLeft = 12,
        borderRadiusTopRight = 12,
        borderRadiusBottomRight = 12,
        borderRadiusBottomLeft = 12,
        frontFillColor = "#1a1a1a",
        frontFillImage = "",
        showNumber = false,
        numberText = "01",
        numberAlign = "flex-start" as "flex-start" | "center" | "flex-end",
        numberStyle = DEF_NUM,
        frontTitle = "NO NETWORK",
        frontTitleStyle = DEF_FRONT,
        frontTextAlign = "left" as "left" | "center" | "right",
        frontVerticalAlign = "flex-end" as "flex-start" | "center" | "flex-end",
        frontPaddingMode = "all" as "all" | "custom",
        frontPadding = 28,
        frontPaddingTop = 28,
        frontPaddingRight = 28,
        frontPaddingBottom = 28,
        frontPaddingLeft = 28,
        showHint = true,
        hintStyle = DEF_HINT,
        backFillColor = "#111111",
        backFillImage = "",
        backText = "You don't know who to ask.",
        backTextStyle = DEF_BACK,
        backTextAlign = "left" as "left" | "center" | "right",
        backVerticalAlign = "center" as "flex-start" | "center" | "flex-end",
        backPaddingMode = "all" as "all" | "custom",
        backPadding = 28,
        backPaddingTop = 28,
        backPaddingRight = 28,
        backPaddingBottom = 28,
        backPaddingLeft = 28,
    } = props

    const [flipped, setFlipped] = useState(false)
    const isStatic = useIsStaticRenderer()

    const radius =
        borderRadiusMode === "all"
            ? `${borderRadius}px`
            : `${borderRadiusTopLeft}px ${borderRadiusTopRight}px ${borderRadiusBottomRight}px ${borderRadiusBottomLeft}px`

    const clipPath =
        borderRadiusMode === "all"
            ? `inset(0 round ${borderRadius}px)`
            : `inset(0 round ${borderRadiusTopLeft}px ${borderRadiusTopRight}px ${borderRadiusBottomRight}px ${borderRadiusBottomLeft}px)`

    const clipPathBack =
        borderRadiusMode === "all"
            ? `inset(0 round ${borderRadius}px)`
            : `inset(0 round ${borderRadiusTopRight}px ${borderRadiusTopLeft}px ${borderRadiusBottomLeft}px ${borderRadiusBottomRight}px)`

    const fPT = frontPaddingMode === "all" ? frontPadding : frontPaddingTop
    const fPR = frontPaddingMode === "all" ? frontPadding : frontPaddingRight
    const fPB = frontPaddingMode === "all" ? frontPadding : frontPaddingBottom
    const fPL = frontPaddingMode === "all" ? frontPadding : frontPaddingLeft
    const bPT = backPaddingMode === "all" ? backPadding : backPaddingTop
    const bPR = backPaddingMode === "all" ? backPadding : backPaddingRight
    const bPB = backPaddingMode === "all" ? backPadding : backPaddingBottom
    const bPL = backPaddingMode === "all" ? backPadding : backPaddingLeft

    const dur = `${flipDuration}s`
    const ease = "cubic-bezier(0.645,0.045,0.355,1)"
    const absInset: React.CSSProperties = { position: "absolute", inset: 0 }

    const frontFace = (
        <div
            style={{
                ...absInset,
                clipPath,
                WebkitClipPath: clipPath,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                background: frontFillColor,
            }}
        >
            {frontFillImage ? (
                <img
                    src={frontFillImage}
                    style={{
                        ...absInset,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                    alt=""
                />
            ) : null}
            <div
                style={{
                    ...absInset,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: frontVerticalAlign,
                    paddingTop: fPT,
                    paddingRight: fPR,
                    paddingBottom: fPB,
                    paddingLeft: fPL,
                    boxSizing: "border-box",
                }}
            >
                {showNumber && numberText ? (
                    <div
                        style={{
                            position: "absolute",
                            top: fPT,
                            left: fPL,
                            right: fPR,
                            display: "flex",
                            justifyContent: numberAlign,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontFamily: numberStyle.family,
                                fontSize: numberStyle.size,
                                fontWeight: numberStyle.weight,
                                color: numberStyle.color,
                                letterSpacing: `${numberStyle.letterSpacing}em`,
                                lineHeight: numberStyle.lineHeight,
                            }}
                        >
                            {numberText}
                        </p>
                    </div>
                ) : null}
                {frontTitle ? (
                    <p
                        style={{
                            margin: 0,
                            width: "100%",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            fontFamily: frontTitleStyle.family,
                            fontSize: frontTitleStyle.size,
                            fontWeight: frontTitleStyle.weight,
                            color: frontTitleStyle.color,
                            letterSpacing: `${frontTitleStyle.letterSpacing}em`,
                            lineHeight: frontTitleStyle.lineHeight,
                            textAlign: frontTextAlign,
                            textTransform: "uppercase",
                            marginTop:
                                showNumber &&
                                frontVerticalAlign === "flex-start"
                                    ? `${numberStyle.size * 1.5 + 8}px`
                                    : 0,
                        }}
                    >
                        {frontTitle}
                    </p>
                ) : null}
                {showHint && !isStatic ? (
                    <p
                        style={{
                            position: "absolute",
                            bottom: 10,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            margin: 0,
                            pointerEvents: "none",
                            fontFamily: hintStyle.family,
                            fontSize: hintStyle.size,
                            fontWeight: hintStyle.weight,
                            color: hintStyle.color,
                            letterSpacing: `${hintStyle.letterSpacing}em`,
                            lineHeight: hintStyle.lineHeight,
                            textTransform: "uppercase",
                        }}
                    >
                        {flipTrigger === "click"
                            ? "Click to flip"
                            : "Hover to flip"}
                    </p>
                ) : null}
            </div>
        </div>
    )

    // Static rendering context (Framer canvas / export): render only the front
    // face, no 3D transforms, no interaction — avoids editor performance issues
    // and export artifacts from the flip animation.
    if (isStatic) {
        return (
            <div
                style={{ width: "100%", height: "100%", position: "relative" }}
            >
                {frontFace}
            </div>
        )
    }

    return (
        <div
            onClick={
                flipTrigger === "click"
                    ? () => setFlipped((f) => !f)
                    : undefined
            }
            onMouseEnter={
                flipTrigger === "hover" ? () => setFlipped(true) : undefined
            }
            onMouseLeave={
                flipTrigger === "hover" ? () => setFlipped(false) : undefined
            }
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                cursor: flipTrigger === "click" ? "pointer" : "default",
                perspective: 1200,
            }}
        >
            <div
                style={{
                    ...absInset,
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                    transition: `transform ${dur} ${ease}`,
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* ── FRONT ── */}
                {frontFace}

                {/* ── BACK ── */}
                <div
                    style={{
                        ...absInset,
                        clipPath: clipPathBack,
                        WebkitClipPath: clipPathBack,
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        background: backFillColor,
                        transform: "rotateY(180deg)",
                    }}
                >
                    {backFillImage ? (
                        <img
                            src={backFillImage}
                            style={{
                                ...absInset,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                            alt=""
                        />
                    ) : null}
                    <div
                        style={{
                            ...absInset,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: backVerticalAlign,
                            paddingTop: bPT,
                            paddingRight: bPR,
                            paddingBottom: bPB,
                            paddingLeft: bPL,
                            boxSizing: "border-box",
                        }}
                    >
                        {backText ? (
                            <p
                                style={{
                                    margin: 0,
                                    width: "100%",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    fontFamily: backTextStyle.family,
                                    fontSize: backTextStyle.size,
                                    fontWeight: backTextStyle.weight,
                                    color: backTextStyle.color,
                                    letterSpacing: `${backTextStyle.letterSpacing}em`,
                                    lineHeight: backTextStyle.lineHeight,
                                    textAlign: backTextAlign,
                                }}
                            >
                                {backText}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

addPropertyControls(CustomTurnCard, {
    flipTrigger: {
        type: ControlType.Enum,
        title: "Flip Trigger",
        defaultValue: "click",
        options: ["click", "hover"],
        optionTitles: ["Click", "Hover"],
        displaySegmentedControl: true,
    },
    flipDuration: {
        type: ControlType.Number,
        title: "Flip Duration (s)",
        defaultValue: 0.55,
        min: 0.1,
        max: 2,
        step: 0.05,
        displayStepper: true,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Show Hint",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    hintStyle: {
        ...fontCtrl(F, 11, 500, "rgba(255,255,255,0.45)", 1),
        title: "Hint Font",
        hidden: (props) => !props.showHint,
    },
    borderRadiusMode: {
        type: ControlType.Enum,
        title: "Radius",
        defaultValue: "all",
        options: ["all", "custom"],
        optionTitles: ["All Corners", "Per Corner"],
        displaySegmentedControl: true,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "All Corners",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.borderRadiusMode !== "all",
    },
    borderRadiusTopLeft: {
        type: ControlType.Number,
        title: "Top Left",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.borderRadiusMode !== "custom",
    },
    borderRadiusTopRight: {
        type: ControlType.Number,
        title: "Top Right",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.borderRadiusMode !== "custom",
    },
    borderRadiusBottomRight: {
        type: ControlType.Number,
        title: "Bottom Right",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.borderRadiusMode !== "custom",
    },
    borderRadiusBottomLeft: {
        type: ControlType.Number,
        title: "Bottom Left",
        defaultValue: 12,
        min: 0,
        max: 200,
        step: 1,
        displayStepper: true,
        hidden: (props) => props.borderRadiusMode !== "custom",
    },
    frontFillColor: {
        type: ControlType.Color,
        title: "Front Color",
        defaultValue: "#1a1a1a",
    },
    frontFillImage: { type: ControlType.Image, title: "Front Image" },
    showNumber: {
        type: ControlType.Boolean,
        title: "Title Badge",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    numberText: {
        type: ControlType.String,
        title: "Title Text",
        defaultValue: "01",
        hidden: (props) => !props.showNumber,
    },
    numberAlign: {
        type: ControlType.Enum,
        title: "Title Align",
        defaultValue: "flex-start",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
        hidden: (props) => !props.showNumber,
    },
    numberStyle: {
        ...fontCtrl(F, 13, 700, "#ffffff", 1),
        title: "Title Font",
        hidden: (props) => !props.showNumber,
    },
    frontTitle: {
        type: ControlType.String,
        title: "Front Title",
        defaultValue: "NO NETWORK",
        displayTextArea: true,
    },
    frontTitleStyle: {
        ...fontCtrl(F, 28, 900, "#ffffff", 1.05),
        title: "Front Font",
    },
    frontTextAlign: {
        type: ControlType.Enum,
        title: "Front Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    frontVerticalAlign: {
        type: ControlType.Enum,
        title: "Front Vertical",
        defaultValue: "flex-end",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Middle", "Bottom"],
        displaySegmentedControl: true,
    },
    frontPaddingMode: {
        type: ControlType.Enum,
        title: "Front Padding",
        defaultValue: "all",
        options: ["all", "custom"],
        optionTitles: ["All Sides", "Per Side"],
        displaySegmentedControl: true,
    },
    frontPadding: {
        type: ControlType.Number,
        title: "All Sides",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.frontPaddingMode !== "all",
    },
    frontPaddingTop: {
        type: ControlType.Number,
        title: "Top",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.frontPaddingMode !== "custom",
    },
    frontPaddingRight: {
        type: ControlType.Number,
        title: "Right",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.frontPaddingMode !== "custom",
    },
    frontPaddingBottom: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.frontPaddingMode !== "custom",
    },
    frontPaddingLeft: {
        type: ControlType.Number,
        title: "Left",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.frontPaddingMode !== "custom",
    },
    backFillColor: {
        type: ControlType.Color,
        title: "Back Color",
        defaultValue: "#111111",
    },
    backFillImage: { type: ControlType.Image, title: "Back Image" },
    backText: {
        type: ControlType.String,
        title: "Back Text",
        defaultValue: "You don't know who to ask.",
        displayTextArea: true,
    },
    backTextStyle: {
        ...fontCtrl(F, 14, 400, "#ffffff", 1.65),
        title: "Back Font",
    },
    backTextAlign: {
        type: ControlType.Enum,
        title: "Back Align",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    backVerticalAlign: {
        type: ControlType.Enum,
        title: "Back Vertical",
        defaultValue: "center",
        options: ["flex-start", "center", "flex-end"],
        optionTitles: ["Top", "Middle", "Bottom"],
        displaySegmentedControl: true,
    },
    backPaddingMode: {
        type: ControlType.Enum,
        title: "Back Padding",
        defaultValue: "all",
        options: ["all", "custom"],
        optionTitles: ["All Sides", "Per Side"],
        displaySegmentedControl: true,
    },
    backPadding: {
        type: ControlType.Number,
        title: "All Sides",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.backPaddingMode !== "all",
    },
    backPaddingTop: {
        type: ControlType.Number,
        title: "Top",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.backPaddingMode !== "custom",
    },
    backPaddingRight: {
        type: ControlType.Number,
        title: "Right",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.backPaddingMode !== "custom",
    },
    backPaddingBottom: {
        type: ControlType.Number,
        title: "Bottom",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.backPaddingMode !== "custom",
    },
    backPaddingLeft: {
        type: ControlType.Number,
        title: "Left",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => props.backPaddingMode !== "custom",
    },
})
