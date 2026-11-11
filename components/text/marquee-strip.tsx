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
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

type Props = {
    items: string
    speed: number
    direction: "left" | "right"
    gap: number
    paddingX: number
    paddingY: number
    background: string
    color: string
    opacity: number
    fontFamily: string
    font: React.CSSProperties
    pauseOnHover: boolean
    fadeEdges: boolean
    fadeSize: number
    uppercase: boolean
    style?: React.CSSProperties
}

export default function LogoMarquee(props: Props) {
    const {
        items,
        speed,
        direction,
        gap,
        paddingX,
        paddingY,
        background,
        color,
        opacity,
        fontFamily,
        font,
        pauseOnHover,
        fadeEdges,
        fadeSize,
        uppercase,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const list = React.useMemo(() => {
        return items
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
    }, [items])

    const marqueeItems =
        list.length > 0
            ? list
            : ["Axon", "Jetstar", "Expedia", "Qantas", "Alitalia"]

    const duration = Math.max(4, speed)

    const sectionStyle: React.CSSProperties = {
        ...style,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background,
        display: "flex",
        alignItems: "center",
        padding: `${paddingY}px ${paddingX}px`,
        boxSizing: "border-box",
        WebkitMaskImage: fadeEdges
            ? `linear-gradient(to right, transparent 0, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent 100%)`
            : undefined,
        maskImage: fadeEdges
            ? `linear-gradient(to right, transparent 0, black ${fadeSize}px, black calc(100% - ${fadeSize}px), transparent 100%)`
            : undefined,
    }

    if (isStatic) {
        return (
            <section style={sectionStyle}>
                <LogoGroup
                    items={marqueeItems}
                    gap={gap}
                    color={color}
                    opacity={opacity}
                    fontFamily={fontFamily}
                    font={font}
                    uppercase={uppercase}
                />
            </section>
        )
    }

    return (
        <section style={sectionStyle}>
            <style>{`
                @keyframes logoMarqueeLeft {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }

                @keyframes logoMarqueeRight {
                    from {
                        transform: translateX(-50%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                .logo-marquee-track:hover {
                    animation-play-state: ${pauseOnHover ? "paused" : "running"};
                }
            `}</style>

            <div
                className="logo-marquee-track"
                style={{
                    display: "flex",
                    width: "max-content",
                    flexShrink: 0,
                    animationName:
                        direction === "left"
                            ? "logoMarqueeLeft"
                            : "logoMarqueeRight",
                    animationDuration: `${duration}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    willChange: "transform",
                }}
            >
                <LogoGroup
                    items={marqueeItems}
                    gap={gap}
                    color={color}
                    opacity={opacity}
                    fontFamily={fontFamily}
                    font={font}
                    uppercase={uppercase}
                />

                <LogoGroup
                    items={marqueeItems}
                    gap={gap}
                    color={color}
                    opacity={opacity}
                    fontFamily={fontFamily}
                    font={font}
                    uppercase={uppercase}
                    ariaHidden
                />
            </div>
        </section>
    )
}

function LogoGroup({
    items,
    gap,
    color,
    opacity,
    fontFamily,
    font,
    uppercase,
    ariaHidden,
}: {
    items: string[]
    gap: number
    color: string
    opacity: number
    fontFamily: string
    font: React.CSSProperties
    uppercase: boolean
    ariaHidden?: boolean
}) {
    return (
        <div
            aria-hidden={ariaHidden}
            style={{
                display: "flex",
                alignItems: "center",
                gap,
                paddingRight: gap,
                flex: "0 0 auto",
            }}
        >
            {items.map((item, index) => (
                <div
                    key={`${item}-${index}`}
                    style={{
                        flex: "0 0 auto",
                        whiteSpace: "nowrap",
                        color,
                        opacity,
                        fontFamily,
                        textTransform: uppercase ? "uppercase" : "none",
                        lineHeight: 1,
                        ...font,
                    }}
                >
                    {item}
                </div>
            ))}
        </div>
    )
}

addPropertyControls(LogoMarquee, {
    items: {
        type: ControlType.String,
        title: "Content",
        defaultValue: "Axon, Jetstar, Expedia, Qantas, Alitalia",
        displayTextArea: true,
    },

    speed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 24,
        min: 4,
        max: 80,
        step: 1,
        unit: "s",
    },

    direction: {
        type: ControlType.Enum,
        title: "Direction",
        defaultValue: "left",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
    },

    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 120,
        min: 20,
        max: 320,
        step: 1,
    },

    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 22,
        min: 0,
        max: 160,
        step: 1,
    },

    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 28,
        min: 0,
        max: 120,
        step: 1,
    },

    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },

    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#7A7A7A",
    },

    opacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0.1,
        max: 1,
        step: 0.05,
    },

    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },

    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "-0.03em",
        },
        controls: "extended",
    },

    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pause Hover",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    fadeEdges: {
        type: ControlType.Boolean,
        title: "Fade Edges",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },

    fadeSize: {
        type: ControlType.Number,
        title: "Fade Size",
        defaultValue: 70,
        min: 20,
        max: 240,
        step: 1,
        hidden: (props) => !props.fadeEdges,
    },

    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
