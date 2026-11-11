/**
 * User request: Inspect and fix the existing Framer Shape Divider so it reliably renders in canvas and preview/live, preserving display name and existing controls compatibility.
 */
/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */

import { useId, useMemo, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type ShapeName =
    | "wave"
    | "waveSteep"
    | "curve"
    | "curveAsymmetrical"
    | "tilt"
    | "triangle"
    | "triangleAsymmetrical"
    | "arrow"
    | "split"
    | "zigzag"
    | "zigzagFine"
    | "clouds"
    | "mountains"
    | "book"
    | "arc"
    | "bell"
    | "roundedStep"
    | "stairs"

type Position = "top" | "bottom"
type ShadowStrength = "none" | "subtle" | "strong"
type FillType = "color" | "image"
type ImageFit = "cover" | "contain"

interface MyComponentProps {
    shape?: string
    fill?: string
    fillType?: string
    color?: string
    image?: { src: string; srcSet?: string; alt?: string }
    imageFit?: string
    tintColor?: string
    imageOverlayColor?: string
    tintOpacity?: number | string
    imageOverlayOpacity?: number | string
    height?: number | string
    position?: string
    flip?: boolean | string
    flipHorizontal?: boolean | string
    opacity?: number | string
    shadow?: string
    style?: CSSProperties
}

// Each shape is a single SVG path on a 1200x120 viewBox. The bottom edge
// (y=120) is always flat — that edge merges into the section it's attached
// to, while the drawn top edge becomes the visible divider line.
const SHAPES: Record<ShapeName, string> = {
    wave: "M0,40 C300,100 900,0 1200,40 L1200,120 L0,120 Z",
    waveSteep: "M0,20 C400,120 800,0 1200,60 L1200,120 L0,120 Z",
    curve: "M0,100 Q600,0 1200,100 L1200,120 L0,120 Z",
    curveAsymmetrical: "M0,20 Q900,120 1200,40 L1200,120 L0,120 Z",
    tilt: "M0,0 L1200,120 L0,120 Z",
    triangle: "M600,0 L1200,120 L0,120 Z",
    triangleAsymmetrical: "M0,120 L1000,0 L1200,120 Z",
    arrow: "M0,120 L550,0 L600,30 L650,0 L1200,120 Z",
    split: "M0,0 L600,120 L1200,0 L1200,120 L0,120 Z",
    zigzag: "M0,60 L150,20 L300,60 L450,20 L600,60 L750,20 L900,60 L1050,20 L1200,60 L1200,120 L0,120 Z",
    zigzagFine:
        "M0,80 L100,40 L200,80 L300,40 L400,80 L500,40 L600,80 L700,40 L800,80 L900,40 L1000,80 L1100,40 L1200,80 L1200,120 L0,120 Z",
    clouds: "M0,80 Q75,40 150,80 Q225,40 300,80 Q375,40 450,80 Q525,40 600,80 Q675,40 750,80 Q825,40 900,80 Q975,40 1050,80 Q1125,40 1200,80 L1200,120 L0,120 Z",
    mountains:
        "M0,120 L150,30 L300,120 L450,15 L600,120 L750,35 L900,120 L1050,20 L1200,120 Z",
    book: "M0,30 C300,0 300,110 600,90 C900,70 900,10 1200,30 L1200,120 L0,120 Z",
    arc: "M0,120 Q600,-20 1200,120 Z",
    bell: "M0,120 C0,40 1200,40 1200,120 Z",
    roundedStep:
        "M0,60 L500,60 Q550,60 550,10 L650,10 Q700,10 700,60 L1200,60 L1200,120 L0,120 Z",
    stairs: "M0,120 L0,90 L200,90 L200,60 L400,60 L400,30 L600,30 L600,0 L1200,0 L1200,120 Z",
}

function toKey(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[\s_()\-]+/g, "")
}

function toNumber(
    value: unknown,
    fallback: number,
    min?: number,
    max?: number
): number {
    const parsed = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(parsed)) return fallback
    if (typeof min === "number" && parsed < min) return min
    if (typeof max === "number" && parsed > max) return max
    return parsed
}

function toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === "boolean") return value
    const key = toKey(value)
    if (key === "true" || key === "1" || key === "yes" || key === "on")
        return true
    if (key === "false" || key === "0" || key === "no" || key === "off")
        return false
    return fallback
}

function normalizeShape(value: unknown): ShapeName {
    const key = toKey(value)
    const map: Record<string, ShapeName> = {
        wave: "wave",
        wavesteep: "waveSteep",
        curve: "curve",
        curveasymmetrical: "curveAsymmetrical",
        tilt: "tilt",
        triangle: "triangle",
        triangleasymmetrical: "triangleAsymmetrical",
        arrow: "arrow",
        split: "split",
        zigzag: "zigzag",
        zigzagfine: "zigzagFine",
        clouds: "clouds",
        mountains: "mountains",
        book: "book",
        arc: "arc",
        bell: "bell",
        roundedstep: "roundedStep",
        stairs: "stairs",
    }
    return map[key] ?? "wave"
}

function normalizeFill(value: unknown): FillType {
    return toKey(value) === "image" ? "image" : "color"
}

function normalizeImageFit(value: unknown): ImageFit {
    return toKey(value) === "contain" ? "contain" : "cover"
}

function normalizePosition(value: unknown): Position {
    return toKey(value) === "top" ? "top" : "bottom"
}

function normalizeShadow(value: unknown): ShadowStrength {
    const key = toKey(value)
    if (key === "subtle") return "subtle"
    if (key === "strong") return "strong"
    return "none"
}

export default function ShapeDivider(props: MyComponentProps) {
    const {
        color = "#F5F4F1",
        image,
        style,
    } = props

    // Stable SSR-safe per-instance id so the <clipPath> doesn't collide if
    // multiple Shape Divider instances (with image fill) are on the same page.
    const reactId = useId()
    const clipId = useMemo(
        () => `sd-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}-clip`,
        [reactId]
    )

    const normalizedShape = normalizeShape(props.shape)
    const normalizedFill = normalizeFill(props.fill ?? props.fillType)
    const normalizedImageFit = normalizeImageFit(props.imageFit)
    const normalizedTintColor = props.tintColor ?? props.imageOverlayColor ?? "#000000"
    const normalizedTintOpacity = toNumber(
        props.tintOpacity ?? props.imageOverlayOpacity,
        0,
        0,
        1
    )
    const normalizedHeight = toNumber(props.height, 80, 1)
    const normalizedPosition = normalizePosition(props.position)
    const normalizedFlip = toBoolean(props.flip ?? props.flipHorizontal, false)
    const normalizedOpacity = toNumber(props.opacity, 1, 0, 1)
    const normalizedShadow = normalizeShadow(props.shadow)

    // The shapes are drawn for the "bottom of a section" orientation
    // (flat edge down). For "top", flip vertically so the flat edge sits
    // against the section's top edge instead.
    const transforms: string[] = []
    if (normalizedPosition === "top") transforms.push("scaleY(-1)")
    if (normalizedFlip) transforms.push("scaleX(-1)")
    const transformValue = transforms.length ? transforms.join(" ") : undefined
    const shapePath = SHAPES[normalizedShape] ?? SHAPES.wave

    // A negative Y offset casts the shadow toward the shape's drawn edge,
    // away from its flat edge — this reads correctly whether or not the
    // element is flipped, since the filter is applied before the transform.
    const shadowFilter =
        normalizedShadow === "subtle"
            ? "drop-shadow(0 -4px 10px rgba(0, 0, 0, 0.06))"
            : normalizedShadow === "strong"
              ? "drop-shadow(0 -8px 20px rgba(0, 0, 0, 0.16))"
              : undefined

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: normalizedHeight,
                pointerEvents: "none",
                overflow: "visible",
                transform: transformValue,
                transformOrigin: "center",
                filter: shadowFilter,
                ...style,
            }}
        >
            <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                style={{ display: "block", width: "100%", height: "100%" }}
            >
                {normalizedFill === "image" && image?.src ? (
                    <>
                        <defs>
                            <clipPath
                                id={clipId}
                                clipPathUnits="userSpaceOnUse"
                            >
                                <path d={shapePath} />
                            </clipPath>
                        </defs>
                        <g clipPath={`url(#${clipId})`} opacity={normalizedOpacity}>
                            <image
                                href={image.src}
                                xlinkHref={image.src}
                                x="0"
                                y="0"
                                width="1200"
                                height="120"
                                preserveAspectRatio={
                                    normalizedImageFit === "contain"
                                        ? "xMidYMid meet"
                                        : "xMidYMid slice"
                                }
                            />
                            {normalizedTintOpacity > 0 && (
                                <rect
                                    x="0"
                                    y="0"
                                    width="1200"
                                    height="120"
                                    fill={normalizedTintColor}
                                    opacity={normalizedTintOpacity}
                                />
                            )}
                        </g>
                    </>
                ) : (
                    <path d={shapePath} fill={color} opacity={normalizedOpacity} />
                )}
            </svg>
        </div>
    )
}

ShapeDivider.displayName = "Shape Divider"

addPropertyControls(ShapeDivider, {
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "Wave",
        options: [
            "Wave",
            "Wave (steep)",
            "Curve",
            "Curve (asymmetrical)",
            "Tilt",
            "Triangle",
            "Triangle (asymmetrical)",
            "Arrow",
            "Split",
            "Zigzag",
            "Zigzag (fine)",
            "Clouds",
            "Mountains",
            "Book",
            "Arc",
            "Bell",
            "Rounded Step",
            "Stairs",
        ],
        optionTitles: [
            "Wave",
            "Wave (steep)",
            "Curve",
            "Curve (asymmetrical)",
            "Tilt",
            "Triangle",
            "Triangle (asymmetrical)",
            "Arrow",
            "Split",
            "Zigzag",
            "Zigzag (fine)",
            "Clouds",
            "Mountains",
            "Book",
            "Arc",
            "Bell",
            "Rounded Step",
            "Stairs",
        ],
    },
    fill: {
        type: ControlType.Enum,
        title: "Fill",
        defaultValue: "Color",
        options: ["Color", "Image"],
        optionTitles: ["Color", "Image"],
        description:
            "Color: a flat fill, usually matching the section behind this divider. Image: the shape is cropped from a photo, like a wave-shaped image transition.",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#F5F4F1",
        description:
            "Usually matches the background of the section behind this divider, so it appears to cut into the section it's placed in.",
        hidden: (props: MyComponentProps) =>
            normalizeFill(props.fill ?? props.fillType) !== "color",
    },
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
        hidden: (props: MyComponentProps) =>
            normalizeFill(props.fill ?? props.fillType) !== "image",
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        defaultValue: "Cover",
        options: ["Cover", "Contain"],
        optionTitles: ["Cover", "Contain"],
        displaySegmentedControl: true,
        hidden: (props: MyComponentProps) =>
            normalizeFill(props.fill ?? props.fillType) !== "image",
    },
    tintColor: {
        type: ControlType.Color,
        title: "Tint Color",
        defaultValue: "#000000",
        description:
            "Darkens or tints the image, useful if you're placing text or other elements over it.",
        hidden: (props: MyComponentProps) =>
            normalizeFill(props.fill ?? props.fillType) !== "image",
    },
    tintOpacity: {
        type: ControlType.Number,
        title: "Tint Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        hidden: (props: MyComponentProps) =>
            normalizeFill(props.fill ?? props.fillType) !== "image",
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 80,
        min: 10,
        max: 400,
        step: 1,
        displayStepper: true,
        unit: "px",
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "Bottom",
        options: ["Top", "Bottom"],
        optionTitles: ["Top", "Bottom"],
        displaySegmentedControl: true,
        description:
            "Flips the shape to face the correct direction. Place this component as a layer at the top or bottom of your section's layer stack — it sits in normal document flow, not floating on top of other content.",
    },
    flip: {
        type: ControlType.Boolean,
        title: "Flip",
        defaultValue: false,
        enabledTitle: "Flipped",
        disabledTitle: "Normal",
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
        description:
            "Lower this and stack a second divider for a layered, parallax-style depth effect.",
    },
    shadow: {
        type: ControlType.Enum,
        title: "Shadow",
        defaultValue: "None",
        options: ["None", "Subtle", "Strong"],
        optionTitles: ["None", "Subtle", "Strong"],
        description:
            "Adds a soft drop shadow along the shape's edge for a 'lifted' look.",
    },
})
