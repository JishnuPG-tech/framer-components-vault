import React, { useState } from "react"

// Setting about flitch effect
export default function GlitchJT({
    text = "GlitchEffect",
    fontSize = 48,
    fontWeight = "bold",
    textColor = "#222222",
    redGlitchColor = "#ff0040",
    blueGlitchColor = "#00ffff",
    greenGlitchColor = "#00ff41",
    hoverTextShadowColor = "#ffffff",
    glitchOpacity = 70,
    blurIntensity = 1,
    animationSpeed = "normal",
    interferenceLines = true,
    glitchIntensity = "medium",
}) {
    const [isHovered, setIsHovered] = useState(false)

    // Glitch Intensy settings
    const intensitySettings = {
        low: { displacement: 1, skew: 0.5, blur: 0.5 },
        medium: { displacement: 2, skew: 1, blur: 1 },
        high: { displacement: 4, skew: 2, blur: 1.5 },
    }

    // Animation speed settings
    const speedSettings = {
        slow: { red: "0.6s", blue: "0.8s", green: "1s", interference: "0.4s" },
        normal: {
            red: "0.3s",
            blue: "0.4s",
            green: "0.5s",
            interference: "0.2s",
        },
        fast: {
            red: "0.15s",
            blue: "0.2s",
            green: "0.25s",
            interference: "0.1s",
        },
    }

    const currentIntensity =
        intensitySettings[glitchIntensity] || intensitySettings.medium
    const currentSpeed = speedSettings[animationSpeed] || speedSettings.normal

    const baseTextStyle = {
        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        color: textColor,
        margin: 0,
        padding: 0,
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
        cursor: "pointer",
    }

    return (
        <>
            <style>
                {`
          @keyframes glitchRed {
            0% { transform: translate(-${currentIntensity.displacement}px, 0px) skew(0deg); }
            20% { transform: translate(-${currentIntensity.displacement * 1.5}px, 1px) skew(${currentIntensity.skew}deg); }
            40% { transform: translate(-${currentIntensity.displacement * 0.5}px, -1px) skew(-${currentIntensity.skew}deg); }
            60% { transform: translate(-${currentIntensity.displacement * 2}px, 0px) skew(${currentIntensity.skew * 2}deg); }
            80% { transform: translate(-${currentIntensity.displacement}px, 1px) skew(-${currentIntensity.skew * 2}deg); }
            100% { transform: translate(-${currentIntensity.displacement * 1.5}px, 0px) skew(0deg); }
          }

          @keyframes glitchBlue {
            0% { transform: translate(${currentIntensity.displacement}px, 0px) skew(0deg); }
            25% { transform: translate(${currentIntensity.displacement * 1.5}px, -1px) skew(-${currentIntensity.skew}deg); }
            50% { transform: translate(${currentIntensity.displacement * 0.5}px, 1px) skew(${currentIntensity.skew}deg); }
            75% { transform: translate(${currentIntensity.displacement * 2}px, 0px) skew(-${currentIntensity.skew * 2}deg); }
            100% { transform: translate(${currentIntensity.displacement}px, -1px) skew(${currentIntensity.skew * 2}deg); }
          }

          @keyframes glitchGreen {
            0% { transform: translate(0px, -1px) scale(1.01); }
            33% { transform: translate(1px, 0px) scale(0.99); }
            66% { transform: translate(-1px, 1px) scale(1.02); }
            100% { transform: translate(0px, -1px) scale(1.01); }
          }

          @keyframes interference {
            0% { transform: translateY(0px); opacity: 0.3; }
            50% { transform: translateY(-2px); opacity: 0.1; }
            100% { transform: translateY(2px); opacity: 0.3; }
          }

          @keyframes textPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.9; }
          }
        `}
            </style>

            <div
                style={{
                    position: "relative",
                    display: "inline-block",
                    lineHeight: 1,
                }}
            >
                {/* Main text */}
                <h1
                    style={{
                        ...baseTextStyle,
                        position: "relative",
                        zIndex: 10,
                        filter: isHovered
                            ? `blur(${blurIntensity * 0.5}px) contrast(1.2)`
                            : "none",
                        textShadow: isHovered
                            ? `0 0 10px ${hoverTextShadowColor}80`
                            : "none",
                        animation: isHovered
                            ? `textPulse ${currentSpeed.red} infinite ease-in-out`
                            : "none",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    {text}
                </h1>

                {/* Layers of glitch effect - only hover */}
                {isHovered && (
                    <>
                        {/* Red layer */}
                        <h1
                            style={{
                                ...baseTextStyle,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 0,
                                color: redGlitchColor,
                                opacity: glitchOpacity / 100,
                                pointerEvents: "none",
                                filter: `blur(${blurIntensity * currentIntensity.blur}px)`,
                                animation: `glitchRed ${currentSpeed.red} infinite linear alternate`,
                            }}
                        >
                            {text}
                        </h1>

                        {/* Blue layer */}
                        <h1
                            style={{
                                ...baseTextStyle,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 0,
                                color: blueGlitchColor,
                                opacity: glitchOpacity / 100,
                                pointerEvents: "none",
                                filter: `blur(${blurIntensity * currentIntensity.blur}px)`,
                                animation: `glitchBlue ${currentSpeed.blue} infinite linear alternate-reverse`,
                            }}
                        >
                            {text}
                        </h1>

                        {/* Green layer */}
                        <h1
                            style={{
                                ...baseTextStyle,
                                position: "absolute",
                                top: 0,
                                left: 0,
                                zIndex: 0,
                                color: greenGlitchColor,
                                opacity: (glitchOpacity / 100) * 0.6,
                                pointerEvents: "none",
                                filter: `blur(${blurIntensity * currentIntensity.blur * 2}px)`,
                                animation: `glitchGreen ${currentSpeed.green} infinite linear alternate`,
                            }}
                        >
                            {text}
                        </h1>

                        {/* Interference lines */}
                        {interferenceLines && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 20,
                                    pointerEvents: "none",
                                    opacity: 0.3,
                                    background: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(255,255,255,0.1) 2px,
                    rgba(255,255,255,0.1) 4px
                  )`,
                                    animation: `interference ${currentSpeed.interference} infinite linear`,
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        </>
    )
}
