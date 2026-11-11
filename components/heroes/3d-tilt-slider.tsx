// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useId, useMemo, type CSSProperties } from "react"

interface FontValue {
    fontSize?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
    fontWeight?: number | string
    fontFamily?: string
    fontStyle?: string
    textAlign?: "left" | "center" | "right"
}

interface ResponsiveImageValue {
    src?: string
    srcSet?: string
    alt?: string
}

interface TiltCarouselProps {
    image?: ResponsiveImageValue
    role: string
    name: string
    description: string

    roleFont: FontValue
    nameFont: FontValue
    descriptionFont: FontValue

    cardBackgroundColor: string
    textColor: string
    mutedTextColor: string
    borderColor: string

    contentPadding: number
    roleGroupGap: number
    nameDescriptionGap: number

    borderWidth: number
    cornerRadius: number
    cardWidth: number
    cardHeight: number

    duotoneEnabled: boolean
    duotoneShadow: string
    duotoneHighlight: string

    // Slider controls
    sliderAutoplay: boolean
    sliderAutoplaySpeed: number
    sliderMaxTilt: number
    sliderTiltStrength: number
    sliderDragSensitivity: number
    sliderMomentumStrength: number
    sliderMomentumFriction: number
    sliderPerspective: number
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

function hexToRgb(input: string): {
    r: number
    g: number
    b: number
} {
    const value = input.trim()

    if (value.startsWith("#")) {
        const hex = value.slice(1)

        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16),
            }
        }

        if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
            }
        }
    }

    const rgbMatch = value.match(
        /^rgba?\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)/i
    )

    if (rgbMatch) {
        return {
            r: clamp(Number(rgbMatch[1]), 0, 255),
            g: clamp(Number(rgbMatch[2]), 0, 255),
            b: clamp(Number(rgbMatch[3]), 0, 255),
        }
    }

    return { r: 0, g: 0, b: 0 }
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TiltCarousel(props: TiltCarouselProps) {
    const {
        image = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Team member portrait",
        },

        role = "Lead Strategist",
        name = "Mila Hart",
        description = "Connects audience insight with product positioning and launch rhythm.",

        roleFont = {
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "130%",
            letterSpacing: "0.12em",
        },

        nameFont = {
            fontSize: 28,
            fontWeight: 500,
            lineHeight: "108%",
            letterSpacing: "-0.02em",
        },

        descriptionFont = {
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "145%",
            letterSpacing: "0em",
        },

        cardBackgroundColor = "#13151A",
        textColor = "#F3F3F4",
        mutedTextColor = "#9CA0AA",
        borderColor = "rgba(255,255,255,0.12)",

        contentPadding = 16,
        roleGroupGap = 24,
        nameDescriptionGap = 16,

        borderWidth = 1,
        cornerRadius = 18,
        cardWidth = 280,
        cardHeight = 460,

        duotoneEnabled = false,
        duotoneShadow = "#1D3557",
        duotoneHighlight = "#F1FAEE",

        sliderAutoplay = true,
        sliderAutoplaySpeed = 40,
        sliderMaxTilt = 18,
        sliderTiltStrength = 1.6,
        sliderDragSensitivity = 1,
        sliderMomentumStrength = 1,
        sliderMomentumFriction = 0.94,
        sliderPerspective = 900,
    } = props

    const instanceId = useId().replace(/:/g, "")
    const filterId = `testimonialscard-duotone-${instanceId}`

    const shadowRgb = useMemo(() => {
        const { r, g, b } = hexToRgb(duotoneShadow)

        return {
            r: (r / 255).toFixed(4),
            g: (g / 255).toFixed(4),
            b: (b / 255).toFixed(4),
        }
    }, [duotoneShadow])

    const highlightRgb = useMemo(() => {
        const { r, g, b } = hexToRgb(duotoneHighlight)

        return {
            r: (r / 255).toFixed(4),
            g: (g / 255).toFixed(4),
            b: (b / 255).toFixed(4),
        }
    }, [duotoneHighlight])

    const cardStyle: CSSProperties = {
        position: "relative",
        width: cardWidth,
        height: cardHeight,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: cardBackgroundColor,
        color: textColor,
        borderRadius: cornerRadius,
        border: `${borderWidth}px solid ${borderColor}`,
        boxSizing: "border-box",
        flexShrink: 0,

        // Values read by the CMS slider override
        ["--team-autoplay" as any]: sliderAutoplay ? "1" : "0",
        ["--team-autoplay-speed" as any]: String(sliderAutoplaySpeed),
        ["--team-max-tilt" as any]: String(sliderMaxTilt),
        ["--team-tilt-strength" as any]: String(sliderTiltStrength),
        ["--team-drag-sensitivity" as any]: String(sliderDragSensitivity),
        ["--team-momentum-strength" as any]: String(sliderMomentumStrength),
        ["--team-momentum-friction" as any]: String(sliderMomentumFriction),
        ["--team-perspective" as any]: String(sliderPerspective),
    }

    return (
        <article style={cardStyle}>
            <svg
                width="0"
                height="0"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    pointerEvents: "none",
                }}
            >
                <defs>
                    <filter id={filterId} colorInterpolationFilters="sRGB">
                        <feColorMatrix
                            type="matrix"
                            values="
                                0.2126 0.7152 0.0722 0 0
                                0.2126 0.7152 0.0722 0 0
                                0.2126 0.7152 0.0722 0 0
                                0 0 0 1 0
                            "
                        />

                        <feComponentTransfer>
                            <feFuncR
                                type="table"
                                tableValues={`${shadowRgb.r} ${highlightRgb.r}`}
                            />

                            <feFuncG
                                type="table"
                                tableValues={`${shadowRgb.g} ${highlightRgb.g}`}
                            />

                            <feFuncB
                                type="table"
                                tableValues={`${shadowRgb.b} ${highlightRgb.b}`}
                            />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflow: "hidden",
                    backgroundColor: "#111111",
                }}
            >
                <img
                    src={image.src}
                    srcSet={image.srcSet}
                    alt={image.alt || name || ""}
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "block",
                        objectFit: "cover",
                        pointerEvents: "none",
                        filter: duotoneEnabled ? `url(#${filterId})` : "none",
                    }}
                />
            </div>

            <div
                style={{
                    padding: contentPadding,
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        ...roleFont,
                        color: mutedTextColor,
                        textTransform: "uppercase",
                        letterSpacing: roleFont.letterSpacing || "0.12em",
                        margin: 0,
                    }}
                >
                    {role}
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: nameDescriptionGap,
                        marginTop: roleGroupGap,
                    }}
                >
                    <div
                        style={{
                            ...nameFont,
                            color: textColor,
                            margin: 0,
                        }}
                    >
                        {name}
                    </div>

                    <div
                        style={{
                            ...descriptionFont,
                            color: mutedTextColor,
                            margin: 0,
                        }}
                    >
                        {description}
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 5,
                        marginTop: 16,
                    }}
                >
                    {[0, 1, 2].map((dotIndex) => (
                        <span
                            key={dotIndex}
                            style={{
                                width: 4,
                                height: 4,
                                display: "block",
                                borderRadius: "50%",
                                backgroundColor: mutedTextColor,
                                opacity: dotIndex === 2 ? 1 : 0.55,
                            }}
                        />
                    ))}
                </div>
            </div>
        </article>
    )
}

TiltCarousel.displayName = "Tilt Carousel"

addPropertyControls(TiltCarousel, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },

    role: {
        type: ControlType.String,
        title: "Role",
        defaultValue: "Lead Strategist",
    },

    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "Mila Hart",
    },

    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Connects audience insight with product positioning and launch rhythm.",
    },

    roleFont: {
        type: ControlType.Font,
        title: "Role Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 12,
            fontWeight: 500,
            lineHeight: "130%",
            letterSpacing: "0.12em",
        },
    },

    nameFont: {
        type: ControlType.Font,
        title: "Name Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 28,
            fontWeight: 500,
            lineHeight: "108%",
            letterSpacing: "-0.02em",
        },
    },

    descriptionFont: {
        type: ControlType.Font,
        title: "Description",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            fontWeight: 400,
            lineHeight: "145%",
            letterSpacing: "0em",
        },
    },

    cardBackgroundColor: {
        type: ControlType.Color,
        title: "Card BG",
        defaultValue: "#13151A",
    },

    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F3F3F4",
    },

    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted",
        defaultValue: "#9CA0AA",
    },

    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255,255,255,0.12)",
    },

    contentPadding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },

    roleGroupGap: {
        type: ControlType.Number,
        title: "Role Gap",
        defaultValue: 24,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },

    nameDescriptionGap: {
        type: ControlType.Number,
        title: "Name Gap",
        defaultValue: 16,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },

    borderWidth: {
        type: ControlType.Number,
        title: "Border W",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
    },

    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 18,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
    },

    cardWidth: {
        type: ControlType.Number,
        title: "Card Width",
        defaultValue: 280,
        min: 180,
        max: 600,
        step: 1,
        unit: "px",
    },

    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        defaultValue: 460,
        min: 240,
        max: 900,
        step: 1,
        unit: "px",
    },

    duotoneEnabled: {
        type: ControlType.Boolean,
        title: "Duotone",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    duotoneShadow: {
        type: ControlType.Color,
        title: "Duo Shadow",
        defaultValue: "#1D3557",
        hidden: (props: TiltCarouselProps) => !props.duotoneEnabled,
    },

    duotoneHighlight: {
        type: ControlType.Color,
        title: "Duo Highlight",
        defaultValue: "#F1FAEE",
        hidden: (props: TiltCarouselProps) => !props.duotoneEnabled,
    },

    // Slider animation controls

    sliderAutoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },

    sliderAutoplaySpeed: {
        type: ControlType.Number,
        title: "Auto Speed",
        defaultValue: 40,
        min: 0,
        max: 300,
        step: 1,
        unit: "px/s",
        hidden: (props: TiltCarouselProps) => !props.sliderAutoplay,
    },

    sliderMaxTilt: {
        type: ControlType.Number,
        title: "Max Tilt",
        defaultValue: 18,
        min: 0,
        max: 35,
        step: 1,
        unit: "°",
    },

    sliderTiltStrength: {
        type: ControlType.Number,
        title: "Tilt Strength",
        defaultValue: 1.6,
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },

    sliderDragSensitivity: {
        type: ControlType.Number,
        title: "Drag",
        defaultValue: 1,
        min: 0.2,
        max: 2.5,
        step: 0.05,
        displayStepper: true,
    },

    sliderMomentumStrength: {
        type: ControlType.Number,
        title: "Momentum",
        defaultValue: 1,
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },

    sliderMomentumFriction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 0.94,
        min: 0.8,
        max: 0.99,
        step: 0.01,
        displayStepper: true,
    },

    sliderPerspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 900,
        min: 300,
        max: 2000,
        step: 50,
        unit: "px",
    },
})
