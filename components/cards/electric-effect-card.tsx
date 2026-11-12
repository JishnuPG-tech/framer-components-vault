import React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Types ---
// fontSize / lineHeight / letterSpacing now live INSIDE each Font control
// (controls: "extended"), matching how Framer's native text layers work.
// No more separate "XFontSize" number props duplicating what the font
// control already gives you.

interface TypographyStyle {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    lineHeight?: number | string
    letterSpacing?: number | string
}

interface Props {
    badgeText: string
    title: string
    description: string
    badgeFont: TypographyStyle
    titleFont: TypographyStyle
    descriptionFont: TypographyStyle
    badgeColor: string
    titleColor: string
    descriptionColor: string
    textAlign: "left" | "center" | "right"
    contentSpacing: number
    electricColor: string
    enableGradientBorder: boolean
    gradientBorderColorA: string
    gradientBorderColorB: string
    gradientBorderAngle: number
    backgroundColor: string
    style?: React.CSSProperties
}

// Scales a designer-chosen px value down on narrow containers, but never
// above the value they actually set. Reference width matches the
// component's default canvas width (380), so at that width you get
// exactly what's dialed in, and it only shrinks from there.
function fluidSize(px: number | string | undefined, referenceWidth = 380) {
    if (typeof px !== "number") return px
    const cqw = +((px / referenceWidth) * 100).toFixed(2)
    const min = Math.max(10, Math.round(px * 0.55))
    return `clamp(${min}px, ${cqw}cqw, ${px}px)`
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

export default function ElectricCard(props: Props) {
    const {
        badgeText = "Dramatic",
        title = "Electric Border",
        description = "In case you'd like to emphasize something very dramatically.",
        badgeFont,
        titleFont,
        descriptionFont,
        badgeColor = "rgba(255, 255, 255, 0.8)",
        titleColor = "rgba(255, 255, 255, 0.98)",
        descriptionColor = "rgba(255, 255, 255, 0.6)",
        textAlign = "left",
        contentSpacing = 24,
        electricColor = "#dd8448",
        enableGradientBorder = false,
        gradientBorderColorA = "#dd8448",
        gradientBorderColorB = "#ffffff",
        gradientBorderAngle = 135,
        backgroundColor = "rgba(18, 18, 18, 1)",
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const badgeSize = fluidSize(badgeFont?.fontSize ?? 14)
    const titleSize = fluidSize(titleFont?.fontSize ?? 32)
    const descriptionSize = fluidSize(descriptionFont?.fontSize ?? 15)

    return (
        <main
            data-align={textAlign}
            data-filter={isStatic ? "off" : "on"}
            data-gradient-border={enableGradientBorder ? "on" : "off"}
            style={
                {
                    ...style,
                    width: style?.width || "100%",
                    height: style?.height || "100%",
                    position: "relative",
                    backgroundColor: backgroundColor,
                    containerType: "inline-size",
                    containerName: "electric-card",
                    "--electric-border-color": electricColor,
                    "--bg-color": backgroundColor,
                    "--content-gap": `${contentSpacing}px`,
                    "--gradient-border-a": gradientBorderColorA,
                    "--gradient-border-b": gradientBorderColorB,
                    "--gradient-border-angle": `${gradientBorderAngle}deg`,
                } as React.CSSProperties
            }
        >
            {/* Static stylesheet: nothing here is rebuilt per-render.
                Per-render values (align, filter on/off, colors, sizes)
                are passed through CSS custom properties / data attributes
                and inline styles instead of string-interpolated CSS, so
                this <style> block's content never changes identity. */}
            <style>{`
                :root {
                    --electric-light-color: oklch(from var(--electric-border-color) l c h);
                    --gradient-color: oklch(from var(--electric-border-color) 0.3 calc(c / 2) h / 0.4);
                }

                .svg-container {
                    position: absolute;
                    width: 0;
                    height: 0;
                    pointer-events: none;
                }

                .card-container {
                    padding: clamp(1px, 0.5cqw, 2px);
                    border-radius: clamp(14px, 6cqw, 24px);
                    position: relative;
                    width: 100%;
                    height: 100%;
                    min-height: inherit;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(-30deg, var(--gradient-color), transparent, var(--gradient-color)),
                                linear-gradient(to bottom, var(--bg-color), var(--bg-color));
                    box-sizing: border-box;
                }

                .inner-container {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }

                .border-outer {
                    border: 2px solid rgba(221, 132, 72, 0.5);
                    border-radius: clamp(14px, 6cqw, 24px);
                    width: 100%;
                    height: 100%;
                    padding-right: 4px;
                    padding-bottom: 4px;
                    box-sizing: border-box;
                }

                main[data-gradient-border="on"] .border-outer {
                    border-color: transparent;
                    border-image: linear-gradient(var(--gradient-border-angle), var(--gradient-border-a), var(--gradient-border-b)) 1;
                    opacity: 0.5;
                }

                .main-card {
                    width: 100%;
                    height: 100%;
                    border-radius: clamp(14px, 6cqw, 24px);
                    border: 2px solid var(--electric-border-color);
                    margin-top: -4px;
                    margin-left: -4px;
                    box-sizing: border-box;
                }

                main[data-gradient-border="on"] .main-card {
                    border-color: transparent;
                    border-image: linear-gradient(var(--gradient-border-angle), var(--gradient-border-a), var(--gradient-border-b)) 1;
                }

                main[data-filter="on"] .main-card {
                    filter: url(#turbulent-displace);
                }

                .glow-layer-1, .glow-layer-2, .overlay-1, .overlay-2, .background-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: clamp(14px, 6cqw, 24px);
                    pointer-events: none;
                }

                .glow-layer-1 {
                    border: 2px solid rgba(221, 132, 72, 0.6);
                    filter: blur(1px);
                }

                main[data-gradient-border="on"] .glow-layer-1 {
                    border-color: transparent;
                    border-image: linear-gradient(var(--gradient-border-angle), var(--gradient-border-a), var(--gradient-border-b)) 1;
                }

                .glow-layer-2 {
                    border: 2px solid var(--electric-light-color);
                    filter: blur(4px);
                }

                main[data-gradient-border="on"] .glow-layer-2 {
                    border-color: transparent;
                    border-image: linear-gradient(var(--gradient-border-angle), var(--gradient-border-a), var(--gradient-border-b)) 1;
                }

                .overlay-1, .overlay-2 {
                    opacity: 1;
                    mix-blend-mode: overlay;
                    transform: scale(1.05);
                    filter: blur(16px);
                    background: linear-gradient(-30deg, white, transparent 30%, transparent 70%, white);
                }

                .overlay-2 {
                    opacity: 0.5;
                }

                .background-glow {
                    filter: blur(32px);
                    transform: scale(1.05);
                    opacity: 0.3;
                    z-index: -1;
                    background: linear-gradient(-30deg, var(--electric-light-color), transparent, var(--electric-border-color));
                }

                main[data-gradient-border="on"] .background-glow {
                    background: linear-gradient(var(--gradient-border-angle), var(--gradient-border-a), transparent, var(--gradient-border-b));
                }

                .content-container {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    padding: clamp(16px, 6cqw, 36px);
                    gap: var(--content-gap);
                    text-align: var(--text-align);
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .content-top {
                    display: flex;
                    flex-direction: column;
                    align-items: var(--items-align);
                    gap: clamp(10px, 3cqw, 16px);
                    flex: 1;
                    min-height: 0;
                }

                .content-bottom {
                    display: flex;
                    flex-direction: column;
                    align-items: var(--items-align);
                }

                main[data-align="left"] { --text-align: left; --items-align: flex-start; }
                main[data-align="center"] { --text-align: center; --items-align: center; }
                main[data-align="right"] { --text-align: right; --items-align: flex-end; }

                .scrollbar-glass {
                    background: radial-gradient(47.2% 50% at 50.39% 88.37%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%), rgba(255, 255, 255, 0.04);
                    position: relative;
                    border-radius: 14px;
                    width: fit-content;
                    max-width: 100%;
                    padding: clamp(6px, 2cqw, 8px) clamp(10px, 3cqw, 16px);
                    text-transform: uppercase;
                    box-sizing: border-box;
                }

                .scrollbar-glass::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    padding: 1px;
                    background: linear-gradient(150deg, rgba(255, 255, 255, 0.48) 16.73%, rgba(255, 255, 255, 0.08) 30.2%, rgba(255, 255, 255, 0.08) 68.2%, rgba(255, 255, 255, 0.6) 81.89%);
                    border-radius: inherit;
                    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    mask-composite: xor;
                    -webkit-mask-composite: xor;
                    pointer-events: none;
                }

                .title {
                    margin-top: auto;
                    width: 100%;
                    word-break: break-word;
                    overflow-wrap: break-word;
                }

                .description {
                    width: 100%;
                    word-break: break-word;
                    overflow-wrap: break-word;
                }

                .divider {
                    border: none;
                    height: 1px;
                    background-color: currentColor;
                    opacity: 0.15;
                    mask-image: linear-gradient(to right, transparent, black, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black, transparent);
                    width: 100%;
                    flex-shrink: 0;
                }

                /* Container-query breakpoint: below this, tighten spacing
                   further so very small frames (e.g. mobile-width canvases)
                   still read cleanly instead of just scaling text down. */
                @container electric-card (max-width: 240px) {
                    .content-container { padding: 16px; gap: 12px; }
                }
            `}</style>

            {!isStatic && (
                <svg className="svg-container">
                    <defs>
                        <filter
                            id="turbulent-displace"
                            colorInterpolationFilters="sRGB"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                        >
                            <feTurbulence
                                type="turbulence"
                                baseFrequency="0.02"
                                numOctaves="10"
                                result="noise1"
                                seed="1"
                            />
                            <feOffset
                                in="noise1"
                                dx="0"
                                dy="0"
                                result="offsetNoise1"
                            >
                                <animate
                                    attributeName="dy"
                                    values="700; 0"
                                    dur="6s"
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </feOffset>

                            <feTurbulence
                                type="turbulence"
                                baseFrequency="0.02"
                                numOctaves="10"
                                result="noise2"
                                seed="1"
                            />
                            <feOffset
                                in="noise2"
                                dx="0"
                                dy="0"
                                result="offsetNoise2"
                            >
                                <animate
                                    attributeName="dy"
                                    values="0; -700"
                                    dur="6s"
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </feOffset>

                            <feTurbulence
                                type="turbulence"
                                baseFrequency="0.02"
                                numOctaves="10"
                                result="noise1"
                                seed="2"
                            />
                            <feOffset
                                in="noise1"
                                dx="0"
                                dy="0"
                                result="offsetNoise3"
                            >
                                <animate
                                    attributeName="dx"
                                    values="490; 0"
                                    dur="6s"
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </feOffset>

                            <feTurbulence
                                type="turbulence"
                                baseFrequency="0.02"
                                numOctaves="10"
                                result="noise2"
                                seed="2"
                            />
                            <feOffset
                                in="noise2"
                                dx="0"
                                dy="0"
                                result="offsetNoise4"
                            >
                                <animate
                                    attributeName="dx"
                                    values="0; -490"
                                    dur="6s"
                                    repeatCount="indefinite"
                                    calcMode="linear"
                                />
                            </feOffset>

                            <feComposite
                                in="offsetNoise1"
                                in2="offsetNoise2"
                                result="part1"
                            />
                            <feComposite
                                in="offsetNoise3"
                                in2="offsetNoise4"
                                result="part2"
                            />
                            <feBlend
                                in="part1"
                                in2="part2"
                                mode="color-dodge"
                                result="combinedNoise"
                            />

                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="combinedNoise"
                                scale="30"
                                xChannelSelector="R"
                                yChannelSelector="B"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            <div className="card-container">
                <div className="inner-container">
                    <div className="border-outer">
                        <div className="main-card"></div>
                    </div>
                    <div className="glow-layer-1"></div>
                    <div className="glow-layer-2"></div>
                </div>

                <div className="overlay-1"></div>
                <div className="overlay-2"></div>
                <div className="background-glow"></div>

                <div className="content-container">
                    <div className="content-top">
                        <div
                            className="scrollbar-glass"
                            style={{
                                ...badgeFont,
                                fontSize: badgeSize,
                                color: badgeColor,
                            }}
                        >
                            {badgeText}
                        </div>
                        <p
                            className="title"
                            style={{
                                ...titleFont,
                                fontSize: titleSize,
                                color: titleColor,
                            }}
                        >
                            {title}
                        </p>
                    </div>

                    <hr className="divider" />

                    <div className="content-bottom">
                        <p
                            className="description"
                            style={{
                                ...descriptionFont,
                                fontSize: descriptionSize,
                                color: descriptionColor,
                            }}
                        >
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}

ElectricCard.defaultProps = {
    width: 380,
    height: 500,
}

addPropertyControls(ElectricCard, {
    badgeText: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "Dramatic",
    },
    badgeFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Badge Typography",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 14,
        },
    },
    badgeColor: {
        type: ControlType.Color,
        title: "Badge Color",
        defaultValue: "rgba(255, 255, 255, 0.8)",
    },
    title: {
        type: ControlType.String,
        title: "Title Text",
        defaultValue: "Electric Border",
    },
    titleFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Title Typography",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontSize: 32,
        },
    },
    titleColor: {
        type: ControlType.Color,
        title: "Title Color",
        defaultValue: "rgba(255, 255, 255, 0.98)",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue:
            "In case you'd like to emphasize something very dramatically.",
        displayTextArea: true,
    },
    descriptionFont: {
        type: ControlType.Font,
        controls: "extended",
        title: "Description Typography",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 15,
        },
    },
    descriptionColor: {
        type: ControlType.Color,
        title: "Desc Color",
        defaultValue: "rgba(255, 255, 255, 0.6)",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        defaultValue: "left",
        options: ["left", "center", "right"],
        optionIcons: ["alignLeft", "alignCenter", "alignRight"],
        displayOptions: {
            type: "segmented",
        },
    },
    contentSpacing: {
        type: ControlType.Number,
        title: "Content Spacing",
        defaultValue: 24,
        min: 0,
        max: 100,
        step: 4,
    },
    electricColor: {
        type: ControlType.Color,
        title: "Electric Color",
        defaultValue: "#dd8448",
        hidden: (props) => props.enableGradientBorder === true,
    },
    enableGradientBorder: {
        type: ControlType.Boolean,
        title: "Gradient Border",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gradientBorderColorA: {
        type: ControlType.Color,
        title: "Gradient Start",
        defaultValue: "#dd8448",
        hidden: (props) => props.enableGradientBorder !== true,
    },
    gradientBorderColorB: {
        type: ControlType.Color,
        title: "Gradient End",
        defaultValue: "#ffffff",
        hidden: (props) => props.enableGradientBorder !== true,
    },
    gradientBorderAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 135,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        hidden: (props) => props.enableGradientBorder !== true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(18, 18, 18, 1)",
    },
})
