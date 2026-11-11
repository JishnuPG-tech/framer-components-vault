// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo } from "react"

/**
 * Geometric Loader — A mesmerizing animated loader with morphing geometric shapes
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 */
export default function GeometricLoader(props: Props) {
    const {
        size,
        primaryColor,
        secondaryColor,
        animationDuration,
        glowIntensity,
        enableColorCycle,
    } = props

    const uniqueId = useMemo(
        () => `clip-${Math.random().toString(36).substr(2, 9)}`,
        []
    )

    const colors = useMemo(() => {
        const primary = primaryColor
        const secondary = secondaryColor
        return {
            one: primary,
            two: secondary,
            three: `${primary}80`,
            four: `${secondary}80`,
            five: `${primary}40`,
        }
    }, [primaryColor, secondaryColor])

    const containerStyle: React.CSSProperties = useMemo(
        () => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
        }),
        []
    )

    const loaderStyle: React.CSSProperties = useMemo(
        () => ({
            position: "relative" as const,
            borderRadius: "50%",
            transform: `scale(${size / 100})`,
            boxShadow: `0 0 ${25 * glowIntensity}px 0 ${colors.three}, 0 ${20 * glowIntensity}px ${50 * glowIntensity}px 0 ${colors.four}`,
            animation: enableColorCycle
                ? `colorize ${animationDuration * 3}s ease-in-out infinite`
                : "none",
        }),
        [size, glowIntensity, colors, enableColorCycle, animationDuration]
    )

    const beforeStyle: React.CSSProperties = useMemo(
        () => ({
            content: '""',
            position: "absolute" as const,
            top: 0,
            left: 0,
            width: 100,
            height: 100,
            borderRadius: "50%",
            borderTop: `solid 1px ${colors.one}`,
            borderBottom: `solid 1px ${colors.two}`,
            background: `linear-gradient(180deg, ${colors.five}, ${colors.four})`,
            boxShadow: `inset 0 10px 10px 0 ${colors.three}, inset 0 -10px 10px 0 ${colors.four}`,
        }),
        [colors]
    )

    const boxStyle: React.CSSProperties = useMemo(
        () => ({
            width: 100,
            height: 100,
            background: `linear-gradient(180deg, ${colors.one} 30%, ${colors.two} 70%)`,
            mask: `url(#${uniqueId})`,
            WebkitMask: `url(#${uniqueId})`,
        }),
        [colors, uniqueId]
    )

    const svgStyle: React.CSSProperties = useMemo(
        () => ({
            position: "absolute" as const,
        }),
        []
    )

    const keyframes = useMemo(
        () => `
        @keyframes rotation {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes roundness {
            0% { filter: contrast(15); }
            20% { filter: contrast(3); }
            40% { filter: contrast(3); }
            60% { filter: contrast(15); }
            100% { filter: contrast(15); }
        }
        @keyframes colorize {
            0% { filter: hue-rotate(0deg); }
            20% { filter: hue-rotate(-30deg); }
            40% { filter: hue-rotate(-60deg); }
            60% { filter: hue-rotate(-90deg); }
            80% { filter: hue-rotate(-45deg); }
            100% { filter: hue-rotate(0deg); }
        }
    `,
        []
    )

    const polygonStyles = useMemo(() => {
        const duration = animationDuration
        return [
            {
                transformOrigin: "75% 25%",
                transform: "rotate(90deg)",
                filter: "blur(7px)",
            },
            {
                transformOrigin: "50% 50%",
                animation: `rotation ${duration}s linear infinite reverse`,
                filter: "blur(7px)",
            },
            {
                transformOrigin: "50% 60%",
                animation: `rotation ${duration}s linear infinite`,
                animationDelay: `${-duration / 3}s`,
                filter: "blur(7px)",
            },
            {
                transformOrigin: "40% 40%",
                animation: `rotation ${duration}s linear infinite reverse`,
                filter: "blur(7px)",
            },
            {
                transformOrigin: "40% 40%",
                animation: `rotation ${duration}s linear infinite reverse`,
                animationDelay: `${-duration / 2}s`,
                filter: "blur(7px)",
            },
            {
                transformOrigin: "60% 40%",
                animation: `rotation ${duration}s linear infinite`,
                filter: "blur(7px)",
            },
            {
                transformOrigin: "60% 40%",
                animation: `rotation ${duration}s linear infinite`,
                animationDelay: `${-duration / 1.5}s`,
                filter: "blur(7px)",
            },
        ]
    }, [animationDuration])

    const maskStyle: React.CSSProperties = useMemo(
        () => ({
            filter: "contrast(15)",
            animation: `roundness ${animationDuration / 2}s linear infinite`,
        }),
        [animationDuration]
    )

    return (
        <div style={containerStyle}>
            <style>{keyframes}</style>
            <div style={loaderStyle}>
                <svg
                    width={100}
                    height={100}
                    viewBox="0 0 100 100"
                    style={svgStyle}
                >
                    <defs>
                        <mask id={uniqueId} style={maskStyle}>
                            <polygon
                                points="0,0 100,0 100,100 0,100"
                                fill="black"
                                style={polygonStyles[0]}
                            />
                            <polygon
                                points="25,25 75,25 50,75"
                                fill="white"
                                style={polygonStyles[1]}
                            />
                            <polygon
                                points="50,25 75,75 25,75"
                                fill="white"
                                style={polygonStyles[2]}
                            />
                            <polygon
                                points="35,35 65,35 50,65"
                                fill="white"
                                style={polygonStyles[3]}
                            />
                            <polygon
                                points="35,35 65,35 50,65"
                                fill="white"
                                style={polygonStyles[4]}
                            />
                            <polygon
                                points="35,35 65,35 50,65"
                                fill="white"
                                style={polygonStyles[5]}
                            />
                            <polygon
                                points="35,35 65,35 50,65"
                                fill="white"
                                style={polygonStyles[6]}
                            />
                        </mask>
                    </defs>
                </svg>
                <div style={beforeStyle} />
                <div style={boxStyle} />
            </div>
        </div>
    )
}

interface Props {
    size: number
    primaryColor: string
    secondaryColor: string
    animationDuration: number
    glowIntensity: number
    enableColorCycle: boolean
}

GeometricLoader.defaultProps = {
    size: 100,
    primaryColor: "#ffbf48",
    secondaryColor: "#be4a1d",
    animationDuration: 2,
    glowIntensity: 1,
    enableColorCycle: true,
}

addPropertyControls(GeometricLoader, {
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#ffbf48",
    },
    secondaryColor: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#be4a1d",
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 100,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Animation Speed",
        defaultValue: 2,
        min: 0.5,
        max: 5,
        step: 0.5,
        unit: "s",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 1,
        min: 0,
        max: 2,
        step: 0.1,
    },
    enableColorCycle: {
        type: ControlType.Boolean,
        title: "Color Cycle",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
