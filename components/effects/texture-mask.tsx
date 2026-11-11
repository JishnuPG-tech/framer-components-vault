// Mask component with different shapes, layer blur, texture image, and fade control
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface MaskComponentProps {
    textureImage: { src: string; alt?: string }
    maskBlur: number
    maskColor: string
    maskSize: number
    maskPosition: string
    maskRepeat: string
    opacity: number
    blendMode: string
    rotation: number
    backgroundColor: string
}

/**
 * Texture Mask
 * 
 * A component that applies texture-based masking effects with blur and color controls.
 * Perfect for creating organic shapes, noise patterns, and artistic visual effects.
 * 
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 400
 * 
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function TextureMask(props: MaskComponentProps) {
    const {
        textureImage = {
            src: "https://framerusercontent.com/images/6vlBa5mSNDfbPsjLVxXM8MEgg.png",
            alt: "Texture Pattern",
        },
        maskBlur = 40,
        maskColor = "#FFFFFF",
        maskSize = 600,
        maskPosition = "center",
        maskRepeat = "repeat",
        opacity = 1,
        blendMode = "normal",
        rotation = 0,
        backgroundColor = "rgba(0, 0, 0, 0)",
    } = props

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: backgroundColor,
            }}
            aria-label={textureImage.alt || "Texture mask effect"}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: maskColor,
                    WebkitMaskImage: `url("${textureImage.src}")`,
                    maskImage: `url("${textureImage.src}")`,
                    WebkitMaskSize: `${maskSize}px`,
                    maskSize: `${maskSize}px`,
                    WebkitMaskPosition: maskPosition,
                    maskPosition: maskPosition,
                    WebkitMaskRepeat: maskRepeat,
                    maskRepeat: maskRepeat,
                    filter: `blur(${maskBlur}px)`,
                    opacity: opacity,
                    mixBlendMode: blendMode as any,
                    transform: `rotate(${rotation}deg)`,
                }}
            />
        </div>
    )
}

addPropertyControls(TextureMask, {
    textureImage: {
        type: ControlType.ResponsiveImage,
        title: "Texture",
    },
    maskColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FFFFFF",
    },
    maskBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 40,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
    },
    maskSize: {
        type: ControlType.Number,
        title: "Pattern Size",
        defaultValue: 600,
        min: 50,
        max: 2000,
        step: 10,
        unit: "px",
    },
    maskPosition: {
        type: ControlType.Enum,
        title: "Position",
        defaultValue: "center",
        options: ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"],
        optionTitles: ["Center", "Top", "Bottom", "Left", "Right", "Top Left", "Top Right", "Bottom Left", "Bottom Right"],
    },
    maskRepeat: {
        type: ControlType.Enum,
        title: "Repeat",
        defaultValue: "repeat",
        options: ["repeat", "no-repeat", "repeat-x", "repeat-y", "space", "round"],
        optionTitles: ["Repeat", "No Repeat", "Repeat X", "Repeat Y", "Space", "Round"],
    },
    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.01,
    },
    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: "°",
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "normal",
        options: ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity"],
        optionTitles: ["Normal", "Multiply", "Screen", "Overlay", "Darken", "Lighten", "Color Dodge", "Color Burn", "Hard Light", "Soft Light", "Difference", "Exclusion", "Hue", "Saturation", "Color", "Luminosity"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
})