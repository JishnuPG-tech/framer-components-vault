// Card Flip component with 3D flip animation on hover
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useState, type CSSProperties } from "react"

interface CardFlipProps {
    title: string
    subtitle: string
    description: string
    features: string[]
    backgroundColor: string
    textColor: string
    accentColor: string
    titleFont: CSSProperties
    subtitleFont: CSSProperties
    descriptionFont: CSSProperties
    featureFont: CSSProperties
    buttonFont: CSSProperties
    animationContainerSize: number
    animationCircleSize: number
    buttonBgGradientStart: string
    buttonBgGradientEnd: string
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function CardFlip(props: CardFlipProps) {
    const {
        title,
        subtitle,
        description,
        features,
        backgroundColor,
        textColor,
        accentColor,
        titleFont,
        subtitleFont,
        descriptionFont,
        featureFont,
        buttonFont,
        animationContainerSize,
        animationCircleSize,
        buttonBgGradientStart,
        buttonBgGradientEnd,
        style,
    } = props

    const [isFlipped, setIsFlipped] = useState(false)

    return (
        <div
            style={{
                perspective: "2000px",
                ...style,
            }}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <div
                style={{
                    display: "grid",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.7s",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
            >
                {/* Front of card */}
                <div
                    style={{
                        gridRow: 1,
                        gridColumn: 1,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(0deg)",
                        overflow: "hidden",
                        borderRadius: "16px",
                        background: backgroundColor,
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        boxShadow: isFlipped
                            ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                            : "0 10px 25px rgba(0, 0, 0, 0.15)",
                        transition: "all 0.7s, opacity 0.7s",
                        opacity: isFlipped ? 0 : 1,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            position: "relative",
                            overflow: "hidden",
                            background: `linear-gradient(to bottom, ${backgroundColor}, ${backgroundColor})`,
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "center",
                            paddingTop: "96px",
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                height: `${animationContainerSize}px`,
                                width: `${animationContainerSize * 2}px`,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: "absolute",
                                        height: `${animationCircleSize}px`,
                                        width: `${animationCircleSize}px`,
                                        borderRadius: "140px",
                                        animation: `scale 3s linear infinite`,
                                        animationDelay: `${i * 0.3}s`,
                                        opacity: 0,
                                        boxShadow: `0 0 50px ${accentColor}80`,
                                        background: accentColor,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: "20px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "6px",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        transition:
                                            "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                                        transform: isFlipped
                                            ? "translateY(-4px)"
                                            : "translateY(0)",
                                        ...titleFont,
                                    }}
                                >
                                    {title}
                                </h3>
                                <p
                                    style={{
                                        margin: 0,
                                        color: textColor,
                                        opacity: 0.7,
                                        transition:
                                            "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) 50ms",
                                        transform: isFlipped
                                            ? "translateY(-4px)"
                                            : "translateY(0)",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                        ...subtitleFont,
                                    }}
                                >
                                    {subtitle}
                                </p>
                            </div>
                            <div style={{ position: "relative" }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: "-8px",
                                        borderRadius: "8px",
                                        background: `linear-gradient(to bottom right, ${accentColor}33, ${accentColor}1A, transparent)`,
                                        transition: "opacity 0.3s",
                                    }}
                                />
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        position: "relative",
                                        zIndex: 10,
                                        transition: "transform 0.3s",
                                        transform: isFlipped
                                            ? "rotate(-12deg) scale(1.1)"
                                            : "rotate(0deg) scale(1)",
                                    }}
                                >
                                    <title>Flip card</title>
                                    <path d="M1 4v6h6" />
                                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back of card */}
                <div
                    style={{
                        gridRow: 1,
                        gridColumn: 1,
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        borderRadius: "16px",
                        padding: "24px",
                        background: backgroundColor,
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        boxShadow: isFlipped
                            ? "0 10px 25px rgba(0, 0, 0, 0.15)"
                            : "0 1px 3px rgba(0, 0, 0, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        transition: "all 0.7s, opacity 0.7s",
                        opacity: isFlipped ? 1 : 0,
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: "24px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: textColor,
                                    transition:
                                        "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                                    transform: isFlipped
                                        ? "translateY(-2px)"
                                        : "translateY(0)",
                                    ...titleFont,
                                }}
                            >
                                {title}
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    color: textColor,
                                    opacity: 0.7,
                                    transition:
                                        "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                                    transform: isFlipped
                                        ? "translateY(-2px)"
                                        : "translateY(0)",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    ...descriptionFont,
                                }}
                            >
                                {description}
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            {features.map((feature, index) => (
                                <div
                                    key={feature}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: textColor,
                                        transition: "all 0.5s",
                                        transform: isFlipped
                                            ? "translateX(0)"
                                            : "translateX(-10px)",
                                        opacity: isFlipped ? 1 : 0,
                                        transitionDelay: `${index * 100 + 200}ms`,
                                        ...featureFont,
                                    }}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={accentColor}
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <title>Feature indicator</title>
                                        <path d="M5 12h14m-7-7l7 7-7 7" />
                                    </svg>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: "24px",
                            borderTop: "1px solid rgba(0, 0, 0, 0.1)",
                            paddingTop: "24px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                margin: "-12px",
                                borderRadius: "12px",
                                padding: "12px",
                                transition: "all 0.3s",
                                background: "transparent",
                                cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `linear-gradient(to right, ${buttonBgGradientStart}, ${buttonBgGradientEnd})`
                                e.currentTarget.style.transform = "scale(1.02)"
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent"
                                e.currentTarget.style.transform = "scale(1)"
                            }}
                        >
                            <span
                                style={{
                                    color: textColor,
                                    transition: "color 0.3s",
                                    ...buttonFont,
                                }}
                            >
                                Start today
                            </span>
                            <div style={{ position: "relative" }}>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={accentColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                        position: "relative",
                                        zIndex: 10,
                                        transition: "all 0.3s",
                                    }}
                                >
                                    <title>Start</title>
                                    <path d="M5 12h14m-7-7l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes scale {
                        0% {
                            transform: scale(2);
                            opacity: 0;
                        }
                        50% {
                            transform: translate(0px, -5px) scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: translate(0px, 5px) scale(0.1);
                            opacity: 0;
                        }
                    }
                `}
            </style>
        </div>
    )
}

addPropertyControls(CardFlip, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Design Systems",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Explore the fundamentals",
    },
    description: {
        type: ControlType.String,
        title: "Description",
        defaultValue: "Dive deep into the world of modern UI/UX design.",
        displayTextArea: true,
    },
    features: {
        type: ControlType.Array,
        title: "Features",
        control: {
            type: ControlType.String,
        },
        defaultValue: ["UI/UX", "Modern Design", "Tailwind CSS", "Kokonut UI"],
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fff",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#E80000",
    },
    buttonBgGradientStart: {
        type: ControlType.Color,
        title: "Button BG Start",
        defaultValue: "#E8000040",
    },
    buttonBgGradientEnd: {
        type: ControlType.Color,
        title: "Button BG End",
        defaultValue: "#E8000020",
    },
    animationCircleSize: {
        type: ControlType.Number,
        title: "Animation Circle Size",
        defaultValue: 50,
        min: 20,
        max: 150,
        step: 5,
        unit: "px",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Semibold",
            letterSpacing: "-0.02em",
            lineHeight: "1.2em",
        },
    },
    subtitleFont: {
        type: ControlType.Font,
        title: "Subtitle Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    descriptionFont: {
        type: ControlType.Font,
        title: "Description Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    featureFont: {
        type: ControlType.Font,
        title: "Feature Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1.3em",
        },
    },
    buttonFont: {
        type: ControlType.Font,
        title: "Button Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "14px",
            variant: "Medium",
            letterSpacing: "-0.01em",
            lineHeight: "1em",
        },
    },
})
