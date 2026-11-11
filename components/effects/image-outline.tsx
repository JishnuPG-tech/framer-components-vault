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


type ObjectFitMode = "contain" | "cover" | "fill" | "none" | "scale-down"
type ShadowMode = "Full" | "Horizontal" | "Vertical" | "Custom"

interface ImageSettings {
    src?: string
    alt: string
    fit: ObjectFitMode
}

interface ShadowSettings {
    mode: ShadowMode
    color: string
    opacity: number
    blur: number
    spread: number
    offsetX: number
    offsetY: number
}

interface EdgeSettings {
    top: boolean
    right: boolean
    bottom: boolean
    left: boolean
}

interface ImageOutlineProps {
    image: ImageSettings
    shadow: ShadowSettings
    customEdges: EdgeSettings
    src?: string
    alt?: string
    fit?: ObjectFitMode
    shadowColor?: string
    shadowOpacity?: number
    blur?: number
    spread?: number
    offsetX?: number
    offsetY?: number
    shadowMode?: ShadowMode
    showTop?: boolean
    showRight?: boolean
    showBottom?: boolean
    showLeft?: boolean
}

const defaultImage: ImageSettings = {
    src: "",
    alt: "Shadow image",
    fit: "contain",
}

const defaultShadow: ShadowSettings = {
    mode: "Full",
    color: "#45ABFF",
    opacity: 1,
    blur: 0,
    spread: 2,
    offsetX: 0,
    offsetY: 0,
}

const defaultCustomEdges: EdgeSettings = {
    top: true,
    right: true,
    bottom: true,
    left: true,
}

function alphaColor(color: string, opacity: number) {
    if (color.startsWith("rgba(") || color.startsWith("hsla(")) return color

    if (color.startsWith("rgb(")) {
        const [r, g, b] = color
            .replace("rgb(", "")
            .replace(")", "")
            .split(",")
            .map((value) => value.trim())
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    let hex = color.replace("#", "")
    if (hex.length === 3) {
        hex = hex
            .split("")
            .map((char) => char + char)
            .join("")
    }

    if (hex.length !== 6) return color

    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)

    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

function resolveProps(inputProps: Partial<ImageOutlineProps>) {
    const image = {
        ...defaultImage,
        ...inputProps.image,
        src: inputProps.image?.src ?? inputProps.src ?? defaultImage.src,
        alt: inputProps.image?.alt ?? inputProps.alt ?? defaultImage.alt,
        fit: inputProps.image?.fit ?? inputProps.fit ?? defaultImage.fit,
    }

    const shadow = {
        ...defaultShadow,
        ...inputProps.shadow,
        mode:
            inputProps.shadow?.mode ??
            inputProps.shadowMode ??
            defaultShadow.mode,
        color:
            inputProps.shadow?.color ??
            inputProps.shadowColor ??
            defaultShadow.color,
        opacity:
            inputProps.shadow?.opacity ??
            inputProps.shadowOpacity ??
            defaultShadow.opacity,
        blur: inputProps.shadow?.blur ?? inputProps.blur ?? defaultShadow.blur,
        spread:
            inputProps.shadow?.spread ??
            inputProps.spread ??
            defaultShadow.spread,
        offsetX:
            inputProps.shadow?.offsetX ??
            inputProps.offsetX ??
            defaultShadow.offsetX,
        offsetY:
            inputProps.shadow?.offsetY ??
            inputProps.offsetY ??
            defaultShadow.offsetY,
    }

    const customEdges = {
        ...defaultCustomEdges,
        ...inputProps.customEdges,
        top:
            inputProps.customEdges?.top ??
            inputProps.showTop ??
            defaultCustomEdges.top,
        right:
            inputProps.customEdges?.right ??
            inputProps.showRight ??
            defaultCustomEdges.right,
        bottom:
            inputProps.customEdges?.bottom ??
            inputProps.showBottom ??
            defaultCustomEdges.bottom,
        left:
            inputProps.customEdges?.left ??
            inputProps.showLeft ??
            defaultCustomEdges.left,
    }

    return { image, shadow, customEdges }
}

function buildShadow(shadow: ShadowSettings, customEdges: EdgeSettings) {
    const color = alphaColor(shadow.color, shadow.opacity)
    const blur = Math.max(0, shadow.blur)
    const spread = Math.max(0, shadow.spread)
    const shadowParts: string[] = []

    const top = `drop-shadow(${shadow.offsetX}px ${shadow.offsetY - spread}px ${blur}px ${color})`
    const right = `drop-shadow(${shadow.offsetX + spread}px ${shadow.offsetY}px ${blur}px ${color})`
    const bottom = `drop-shadow(${shadow.offsetX}px ${shadow.offsetY + spread}px ${blur}px ${color})`
    const left = `drop-shadow(${shadow.offsetX - spread}px ${shadow.offsetY}px ${blur}px ${color})`

    if (shadow.mode === "Full" || shadow.mode === "Vertical") {
        shadowParts.push(top, bottom)
    }

    if (shadow.mode === "Full" || shadow.mode === "Horizontal") {
        shadowParts.push(left, right)
    }

    if (shadow.mode === "Custom") {
        if (customEdges.top) shadowParts.push(top)
        if (customEdges.right) shadowParts.push(right)
        if (customEdges.bottom) shadowParts.push(bottom)
        if (customEdges.left) shadowParts.push(left)
    }

    if (shadowParts.length === 0) {
        shadowParts.push(
            `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${blur}px ${color})`
        )
    }

    return shadowParts.join(" ")
}

/**
 * ImageOutline
 * Adds directional drop-shadow outlines around transparent images.
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 320
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function ImageOutline(inputProps: Partial<ImageOutlineProps>) {
    const { image, shadow, customEdges } = resolveProps(inputProps)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                overflow: "visible",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    filter: buildShadow(shadow, customEdges),
                }}
            >
                {image.src ? (
                    <img
                        src={image.src}
                        alt={image.alt}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: image.fit,
                            display: "block",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            padding: 16,
                            textAlign: "center",
                            fontFamily: "Inter, sans-serif",
                            fontSize: 14,
                            color: "rgba(0, 0, 0, 0.45)",
                            background: "rgba(0, 0, 0, 0.06)",
                            border: "1px dashed rgba(0, 0, 0, 0.14)",
                            borderRadius: 12,
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 600,
                                color: "rgba(0, 0, 0, 0.7)",
                            }}
                        >
                            Upload transparent image
                        </div>
                        <div>
                            Use a PNG or transparent image for the best shadow
                            result.
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

ImageOutline.defaultProps = {
    width: 320,
    height: 320,
    image: defaultImage,
    shadow: defaultShadow,
    customEdges: defaultCustomEdges,
    src: defaultImage.src,
    alt: defaultImage.alt,
    fit: defaultImage.fit,
    shadowColor: defaultShadow.color,
    shadowOpacity: defaultShadow.opacity,
    blur: defaultShadow.blur,
    spread: defaultShadow.spread,
    offsetX: defaultShadow.offsetX,
    offsetY: defaultShadow.offsetY,
    shadowMode: defaultShadow.mode,
    showTop: defaultCustomEdges.top,
    showRight: defaultCustomEdges.right,
    showBottom: defaultCustomEdges.bottom,
    showLeft: defaultCustomEdges.left,
}

addPropertyControls(ImageOutline, {
    image: {
        type: ControlType.Object,
        title: "Image",
        controls: {
            src: { type: ControlType.Image, title: "Source" },
            alt: { type: ControlType.String, title: "Alt" },
            fit: {
                type: ControlType.Enum,
                title: "Fit",
                options: ["contain", "cover", "fill", "none", "scale-down"],
                optionTitles: [
                    "Contain",
                    "Cover",
                    "Fill",
                    "None",
                    "Scale Down",
                ],
            },
        },
    },
    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["Full", "Horizontal", "Vertical", "Custom"],
                optionTitles: ["Full", "Horizontal", "Vertical", "Custom"],
            },
            color: { type: ControlType.Color, title: "Color" },
            opacity: {
                type: ControlType.Number,
                title: "Density",
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 80,
                unit: "px",
                step: 1,
            },
            spread: {
                type: ControlType.Number,
                title: "Spread",
                min: 0,
                max: 60,
                unit: "px",
                step: 1,
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                min: -60,
                max: 60,
                unit: "px",
                step: 1,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                min: -60,
                max: 60,
                unit: "px",
                step: 1,
            },
        },
    },
    customEdges: {
        type: ControlType.Object,
        title: "Custom Edges",
        hidden(props) {
            return props.shadow?.mode !== "Custom"
        },
        controls: {
            top: {
                type: ControlType.Boolean,
                title: "Top",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            right: {
                type: ControlType.Boolean,
                title: "Right",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            bottom: {
                type: ControlType.Boolean,
                title: "Bottom",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            left: {
                type: ControlType.Boolean,
                title: "Left",
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
})
