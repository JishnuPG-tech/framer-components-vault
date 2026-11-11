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


// Proper default size for Framer Marketplace
// @framerIntrinsicWidth 800
// @framerIntrinsicHeight 600
// @framerSupportedLayoutWidth any
// @framerSupportedLayoutHeight any

/**
 * Animated Background Tool – Optimized for Marketplace
 * Uses useIsStaticRenderer to disable animations on Canvas & Export
 */

export default function AnimatedBackgroundTool(props: any) {
    const {
        effect = "Noise Gradient",
        color1 = "#3b82f6",
        color2 = "#a855f7",
        color3 = "#f472b6",
        animate = true,
    } = props

    // Disable all animations in static contexts (Canvas + Export)
    const isStaticRenderer = useIsStaticRenderer()
    const shouldAnimate = animate && !isStaticRenderer

    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        minWidth: "100px",
        minHeight: "100px",
    }

    let backgroundContent: React.ReactNode

    switch (effect) {
        case "Noise Gradient":
            backgroundContent = (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(135deg, ${color1}, ${color2}, ${color3}, ${color1}, ${color2}, ${color3})`,
                            backgroundSize: "500% 500%",
                            animation: shouldAnimate
                                ? "gradientShift 12s ease infinite"
                                : "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(circle at 50% 100%, ${color3} 12%, transparent 48%)`,
                            opacity: 0.38,
                            mixBlendMode: "screen",
                        }}
                    />
                    {/* SVG Noise – static when on canvas/export */}
                    <svg
                        style={{
                            position: "absolute",
                            inset: 0,
                            opacity: 0.28,
                            mixBlendMode: "overlay",
                        }}
                        width="100%"
                        height="100%"
                    >
                        <defs>
                            <filter
                                id="noise"
                                x="0%"
                                y="0%"
                                width="100%"
                                height="100%"
                            >
                                <feTurbulence
                                    type="fractalNoise"
                                    baseFrequency="0.85"
                                    numOctaves="4"
                                    seed="42"
                                >
                                    {shouldAnimate && (
                                        <animate
                                            attributeName="baseFrequency"
                                            values="0.85;0.65;0.95;0.75;0.85"
                                            dur="7s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </feTurbulence>
                                <feDisplacementMap
                                    in="SourceGraphic"
                                    scale="28"
                                >
                                    {shouldAnimate && (
                                        <animate
                                            attributeName="scale"
                                            values="28;38;22;32;28"
                                            dur="7s"
                                            repeatCount="indefinite"
                                        />
                                    )}
                                </feDisplacementMap>
                            </filter>
                        </defs>
                        <rect
                            width="100%"
                            height="100%"
                            filter="url(#noise)"
                            fill="#ffffff"
                        />
                    </svg>
                </>
            )
            break

        case "Lava/liquid Gradient":
            backgroundContent = (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "#0a0500",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "-5%",
                            top: "40%",
                            width: "120%",
                            height: "120%",
                            background: `radial-gradient(circle at 40% 45%, ${color1} 15%, ${color2} 50%, transparent 75%)`,
                            filter: "blur(65px)",
                            opacity: 0.82,
                            animation: shouldAnimate
                                ? "lavaBlob1 14s ease-in-out infinite"
                                : "none",
                            borderRadius: "50%",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: "-8%",
                            bottom: "5%",
                            width: "115%",
                            height: "115%",
                            background: `radial-gradient(circle at 60% 60%, ${color3} 20%, ${color2} 55%, transparent 80%)`,
                            filter: "blur(60px)",
                            opacity: 0.78,
                            animation: shouldAnimate
                                ? "lavaBlob2 17s ease-in-out infinite"
                                : "none",
                            borderRadius: "50%",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "15%",
                            top: "55%",
                            width: "85%",
                            height: "85%",
                            background: `radial-gradient(circle at 50% 50%, #fef08c 25%, ${color1} 60%, transparent 85%)`,
                            filter: "blur(75px)",
                            opacity: 0.68,
                            animation: shouldAnimate
                                ? "lavaBlob3 11s ease-in-out infinite"
                                : "none",
                            borderRadius: "50%",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "45%",
                            top: "48%",
                            width: "100%",
                            height: "100%",
                            background: `radial-gradient(circle at 35% 70%, ${color3} 12%, transparent 70%)`,
                            filter: "blur(52px)",
                            opacity: 0.72,
                            animation: shouldAnimate
                                ? "lavaBlob4 20s ease-in-out infinite"
                                : "none",
                            borderRadius: "50%",
                        }}
                    />
                </>
            )
            break

        case "Halo Gradient":
            backgroundContent = (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `radial-gradient(circle at 50% 100%, #1e1b4b 0%, #0f172a 70%)`,
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "12%",
                            top: "52%",
                            width: "80%",
                            height: "80%",
                            background: `radial-gradient(circle, ${color1} 20%, transparent 65%)`,
                            filter: "blur(80px)",
                            opacity: 0.68,
                            animation: shouldAnimate
                                ? "haloPulse1 9s ease-in-out infinite"
                                : "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            right: "10%",
                            bottom: "15%",
                            width: "70%",
                            height: "70%",
                            background: `radial-gradient(circle, ${color2} 16%, transparent 62%)`,
                            filter: "blur(75px)",
                            opacity: 0.62,
                            animation: shouldAnimate
                                ? "haloPulse2 12s ease-in-out infinite"
                                : "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "32%",
                            top: "48%",
                            width: "65%",
                            height: "65%",
                            background: `radial-gradient(circle, ${color3} 22%, transparent 68%)`,
                            filter: "blur(62px)",
                            opacity: 0.55,
                            animation: shouldAnimate
                                ? "haloPulse3 8s ease-in-out infinite"
                                : "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: "8%",
                            bottom: "22%",
                            width: "52%",
                            height: "52%",
                            background: `radial-gradient(circle, ${color1} 28%, transparent 72%)`,
                            filter: "blur(90px)",
                            opacity: 0.45,
                            animation: shouldAnimate
                                ? "haloPulse4 15s ease-in-out infinite"
                                : "none",
                        }}
                    />
                </>
            )
            break
    }

    return (
        <div style={containerStyle}>
            {backgroundContent}

            <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes lavaBlob1 {
          0%, 100% { transform: translate(0,0) scale(1.1) rotate(6deg); }
          50% { transform: translate(28%,18%) scale(0.85) rotate(-8deg); }
        }
        @keyframes lavaBlob2 {
          0%, 100% { transform: translate(0,0) scale(1.15); }
          50% { transform: translate(-32%,-22%) scale(0.8); }
        }
        @keyframes lavaBlob3 {
          0%, 100% { transform: translate(0,0) scale(0.9); }
          50% { transform: translate(35%,-28%) scale(1.25); }
        }
        @keyframes lavaBlob4 {
          0%, 100% { transform: translate(0,0) scale(1.05); }
          50% { transform: translate(-18%,38%) scale(0.82); }
        }

        @keyframes haloPulse1 {
          0%, 100% { transform: scale(0.8); opacity: 0.68; }
          50% { transform: scale(1.35); opacity: 0.92; }
        }
        @keyframes haloPulse2 {
          0%, 100% { transform: scale(0.85); opacity: 0.62; }
          50% { transform: scale(1.4); opacity: 0.88; }
        }
        @keyframes haloPulse3 {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(0.7); opacity: 0.82; }
        }
        @keyframes haloPulse4 {
          0%, 100% { transform: scale(0.9); opacity: 0.45; }
          50% { transform: scale(1.45); opacity: 0.75; }
        }
      `}</style>
        </div>
    )
}

AnimatedBackgroundTool.defaultProps = {
    effect: "Noise Gradient",
    color1: "#3b82f6",
    color2: "#a855f7",
    color3: "#f472b6",
    animate: true,
    width: 800,
    height: 600,
}

addPropertyControls(AnimatedBackgroundTool, {
    effect: {
        type: ControlType.Enum,
        options: ["Noise Gradient", "Lava/liquid Gradient", "Halo Gradient"],
        optionTitles: [
            "Noise Gradient",
            "Lava / Liquid Gradient",
            "Halo Gradient",
        ],
        title: "Effect",
        defaultValue: "Noise Gradient",
    },
    color1: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#3b82f6",
    },
    color2: {
        type: ControlType.Color,
        title: "Secondary Color",
        defaultValue: "#a855f7",
    },
    color3: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#f472b6",
    },
    animate: {
        type: ControlType.Boolean,
        title: "Animate Preview",
        defaultValue: true,
        description: "Turn off for static preview / export",
    },
})
