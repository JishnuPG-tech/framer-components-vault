import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as PhosphorIcons from "phosphor-react"

// Utility function to convert Framer's color picker output (HEX/RGB) into clean RGB values
const extractRGB = (colorStr: string) => {
    if (colorStr.startsWith("rgb")) {
        // Hata buradaydı: document.match yerine colorStr.match olarak düzeltildi
        const match = colorStr.match(/\d+,\s*\d+,\s*\d+/)
        return match ? match[0] : "255, 255, 255"
    }
    const hex = colorStr.replace("#", "")
    if (hex.length === 6) {
        return `${parseInt(hex.substring(0, 2), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${parseInt(hex.substring(4, 6), 16)}`
    }
    return "255, 255, 255"
}

export default function PremiumGlowCards(props) {
    const {
        cardItems,
        cardSize,
        horizontalGap,
        verticalGap,
        paddingX,
        paddingY,
        glowStrength,
        glowSize,
        transparentFill,
        baseStrokeWidth,
        baseStrokeOpacity,
        baseGlowRadius,
        baseGlowOpacity,
        iconOpacity,
        subtitleFont,
        subtitleFontSize,
        titleFont,
        titleFontSize,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)

    // Global Mouse Tracking
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const cards = containerRef.current.querySelectorAll(
            ".card"
        ) as NodeListOf<HTMLElement>

        cards.forEach((card) => {
            const rect = card.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            card.style.setProperty("--mouse-x", `${x}px`)
            card.style.setProperty("--mouse-y", `${y}px`)
        })
    }

    useEffect(() => {
        if (!containerRef.current) return

        const cards = containerRef.current.querySelectorAll(
            ".card"
        ) as NodeListOf<HTMLElement>
        const speed = 0.0003
        let animationFrameId: number

        const animateBlobs = () => {
            const time = performance.now() * speed

            cards.forEach((card, index) => {
                const blob = card.querySelector(".card-blob") as HTMLElement
                const blob2 = card.querySelector(".card-blob2") as HTMLElement
                if (!blob || !blob2) return

                const W = card.offsetWidth
                const H = card.offsetHeight
                const offset1 = index * 2.5
                const offset2 = index * 1.8

                const b1x =
                    W / 2 +
                    Math.sin(time + offset1) * (W * 0.25) -
                    blob.offsetWidth / 2
                const b1y =
                    H / 2 +
                    Math.cos(time * 0.8 + offset1) * (H * 0.25) -
                    blob.offsetHeight / 2

                const b2x =
                    W / 2 +
                    Math.cos(time * 1.2 + offset2) * (W * 0.3) -
                    blob2.offsetWidth / 2
                const b2y =
                    H / 2 +
                    Math.sin(time * 0.9 + offset2) * (H * 0.3) -
                    blob2.offsetHeight / 2

                blob.style.transform = `translate(${b1x}px, ${b1y}px)`
                blob2.style.transform = `translate(${b2x}px, ${b2y}px)`
            })

            animationFrameId = requestAnimationFrame(animateBlobs)
        }

        animateBlobs()

        return () => {
            cancelAnimationFrame(animationFrameId)
        }
    }, [cardItems])

    const sceneStyle = {
        "--gap-x": `${horizontalGap}px`,
        "--gap-y": `${verticalGap}px`,
        "--pad-x": `${paddingX}px`,
        "--pad-y": `${paddingY}px`,
        "--stroke-glow-strength": glowStrength.toString(),
        "--stroke-glow-size": `${glowSize}px`,
        "--card-size": `${cardSize}px`,
        "--bg-opacity": transparentFill.toString(),
        "--base-stroke-width": `${baseStrokeWidth}px`,
        "--base-stroke-opacity": baseStrokeOpacity.toString(),
        "--base-glow-radius": `${baseGlowRadius}px`,
        "--base-glow-opacity": baseGlowOpacity.toString(),
        "--icon-opacity": iconOpacity.toString(),
        "--subtitle-font": `"${subtitleFont}", sans-serif`,
        "--subtitle-size": `${subtitleFontSize}px`,
        "--title-font": `"${titleFont}", sans-serif`,
        "--title-size": `${titleFontSize}px`,
    } as React.CSSProperties

    const topRowCards = cardItems.filter((item) => item.row === "Top")
    const bottomRowCards = cardItems.filter((item) => item.row === "Bottom")

    const renderIcon = (iconName: string) => {
        const IconComponent = PhosphorIcons[iconName] || PhosphorIcons.Circle
        return <IconComponent size="100%" weight="light" color="currentColor" />
    }

    // Dynamically generate the Google Fonts import URL based on panel selections
    const dynamicFontImport = `@import url('https://fonts.googleapis.com/css2?family=${subtitleFont.replace(/ /g, "+")}&family=${titleFont.replace(/ /g, "+")}&display=swap');`

    return (
        <div
            ref={containerRef}
            className="scene-wrapper"
            onMouseMove={handleMouseMove}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <style>{`
                ${dynamicFontImport}

                .scene-wrapper {
                    padding: 20px;
                }

                .scene { 
                    display: flex; 
                    flex-direction: column;
                    gap: var(--gap-y); 
                    width: 100%; 
                    align-items: center; 
                }

                .card-row {
                    display: flex;
                    gap: var(--gap-x);
                    justify-content: center;
                    flex-wrap: wrap; 
                    width: 100%;
                }
                
                .card { 
                    position: relative; 
                    width: var(--card-size); 
                    height: var(--card-size);
                    border-radius: 22px; 
                    overflow: hidden; 
                    cursor: pointer; 
                    isolation: isolate; 
                    border: var(--base-stroke-width) solid rgba(255, 255, 255, var(--base-stroke-opacity));
                    box-shadow: 0 0 var(--base-glow-radius) rgba(255, 255, 255, var(--base-glow-opacity));
                    transition: filter 0.5s ease, transform 0.4s ease;
                }

                .scene:has(.card:hover) .card:not(:hover) {
                    filter: saturate(0.1) brightness(0.4) opacity(0.85);
                }
                .card:hover {
                    filter: saturate(1.2) brightness(1.1);
                }
                
                .card-base { 
                    position: absolute; 
                    inset: 0; 
                    border-radius: 22px; 
                    z-index: 0; 
                    background: linear-gradient(160deg, rgba(var(--color), 0.18) 0%, rgba(3,3,10, var(--bg-opacity)) 100%); 
                }
                
                .card-blob { position: absolute; top: 0; left: 0; width: 75%; height: 75%; border-radius: 50%; z-index: 1; pointer-events: none; filter: blur(35px); will-change: transform; background: radial-gradient(circle, rgba(var(--color),0.85) 0%, rgba(var(--color),0.3) 60%, transparent 80%); }
                .card-blob2 { position: absolute; top: 0; left: 0; width: 55%; height: 55%; border-radius: 50%; z-index: 1; pointer-events: none; filter: blur(25px); opacity: 0.9; will-change: transform; background: radial-gradient(circle, rgba(var(--color),0.75) 0%, transparent 70%); }
                
                .card-is { position: absolute; inset: 0; border-radius: 22px; pointer-events: none; }
                .card-is1 { z-index: 3; box-shadow: inset 0 -70px 55px -25px rgba(var(--color),0.4); }
                .card-is2 { z-index: 4; box-shadow: inset 0 -35px 25px -6px rgba(var(--color),0.2); }
                .card-is3 { z-index: 5; mix-blend-mode: plus-lighter; box-shadow: inset 0 -18px 18px -5px rgba(255,255,255,0.1); }
                
                .hover-layer { position: absolute; inset: 0; border-radius: 22px; z-index: 9; pointer-events: none; opacity: 0; transition: opacity 0.5s ease; }
                
                .scene-wrapper:hover .hover-layer { opacity: 1; }
                
                .hover-border { 
                    position: absolute; inset: 0; border-radius: 22px; padding: 1.5px; 
                    background: radial-gradient(var(--stroke-glow-size) circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--color), var(--stroke-glow-strength)), transparent 45%); 
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; 
                }
                
                .hover-fill { position: absolute; inset: 0; border-radius: 22px; background: radial-gradient(350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--color), 0.04), transparent 60%); }
                
                .card-icon-container {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 5;
                    pointer-events: none;
                    padding: 25%;
                    color: rgba(255, 255, 255, var(--icon-opacity));
                }

                .card-top-text {
                    position: absolute;
                    top: var(--pad-y);
                    left: var(--pad-x);
                    z-index: 10;
                    pointer-events: none;
                    font-family: var(--subtitle-font);
                    font-size: var(--subtitle-size);
                    font-weight: 500;
                    letter-spacing: 0px; 
                    color: rgba(255, 255, 255, 0.45);
                    line-height: 1;
                    text-align: left;
                }

                .card-text { 
                    position: absolute; 
                    bottom: var(--pad-y); 
                    left: var(--pad-x); 
                    z-index: 10; 
                    pointer-events: none; 
                    font-family: var(--title-font);
                    font-size: var(--title-size);
                    letter-spacing: 0px; 
                    color: rgba(255, 255, 255, 0.95);
                    line-height: 1;
                    text-align: left;
                }
            `}</style>

            <div className="scene" style={sceneStyle}>
                {/* Top Row */}
                {topRowCards.length > 0 && (
                    <div className="card-row">
                        {topRowCards.map((item, index) => (
                            <div
                                className="card"
                                key={`top-${index}`}
                                style={
                                    {
                                        "--color": extractRGB(item.color),
                                    } as React.CSSProperties
                                }
                            >
                                <div className="card-base"></div>
                                <div className="card-blob"></div>
                                <div className="card-blob2"></div>
                                <div className="card-is card-is1"></div>
                                <div className="card-is card-is2"></div>
                                <div className="card-is card-is3"></div>
                                <div className="card-icon-container">
                                    {renderIcon(item.iconName)}
                                </div>
                                <div className="hover-layer">
                                    <div className="hover-fill"></div>
                                    <div className="hover-border"></div>
                                </div>
                                <div className="card-top-text">
                                    {item.topText}
                                </div>
                                <div className="card-text">{item.text}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom Row */}
                {bottomRowCards.length > 0 && (
                    <div className="card-row">
                        {bottomRowCards.map((item, index) => (
                            <div
                                className="card"
                                key={`bottom-${index}`}
                                style={
                                    {
                                        "--color": extractRGB(item.color),
                                    } as React.CSSProperties
                                }
                            >
                                <div className="card-base"></div>
                                <div className="card-blob"></div>
                                <div className="card-blob2"></div>
                                <div className="card-is card-is1"></div>
                                <div className="card-is card-is2"></div>
                                <div className="card-is card-is3"></div>
                                <div className="card-icon-container">
                                    {renderIcon(item.iconName)}
                                </div>
                                <div className="hover-layer">
                                    <div className="hover-fill"></div>
                                    <div className="hover-border"></div>
                                </div>
                                <div className="card-top-text">
                                    {item.topText}
                                </div>
                                <div className="card-text">{item.text}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ----------------------------------------------------
// FRAMER PROPERTY CONTROLS (RIGHT PANEL)
// ----------------------------------------------------
addPropertyControls(PremiumGlowCards, {
    cardItems: {
        type: ControlType.Array,
        title: "Cards (Add/Remove)",
        control: {
            type: ControlType.Object,
            controls: {
                topText: {
                    type: ControlType.String,
                    title: "Top Text (Subtitle)",
                    defaultValue: "CREATIVE",
                },
                text: {
                    type: ControlType.String,
                    title: "Bottom Text (Title)",
                    defaultValue: "UI UX",
                },
                iconName: {
                    type: ControlType.String,
                    title: "Phosphor Icon Name",
                    defaultValue: "PenNib",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#FF5A00",
                },
                row: {
                    type: ControlType.Enum,
                    title: "Row Position",
                    options: ["Top", "Bottom"],
                    optionTitles: ["Top Row", "Bottom Row"],
                    defaultValue: "Top",
                },
            },
        },
        defaultValue: [
            {
                topText: "CREATIVE",
                text: "UI UX",
                iconName: "PenNib",
                color: "#FF5A00",
                row: "Top",
            },
            {
                topText: "PRODUCTION",
                text: "PHOTOGRAPHY",
                iconName: "Camera",
                color: "#FF006E",
                row: "Bottom",
            },
            {
                topText: "ENGINEERING",
                text: "DEVELOPMENT",
                iconName: "Code",
                color: "#8200FF",
                row: "Top",
            },
            {
                topText: "STRATEGY",
                text: "BRANDING",
                iconName: "ChartLineUp",
                color: "#C3FF00",
                row: "Bottom",
            },
        ],
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size (px)",
        defaultValue: 240,
        min: 120,
        max: 600,
        step: 10,
        displayStepper: true,
    },
    horizontalGap: {
        type: ControlType.Number,
        title: "Horizontal Gap (px)",
        defaultValue: 15,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    verticalGap: {
        type: ControlType.Number,
        title: "Vertical Gap (px)",
        defaultValue: 15,
        min: 0,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Horizontal Padding",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Vertical Padding",
        defaultValue: 22,
        min: 0,
        max: 80,
        step: 1,
    },
    subtitleFont: {
        type: ControlType.String,
        title: "Subtitle Font Family",
        defaultValue: "Space Grotesk",
    },
    subtitleFontSize: {
        type: ControlType.Number,
        title: "Subtitle Font Size (px)",
        defaultValue: 14,
        min: 10,
        max: 36,
        step: 1,
    },
    titleFont: {
        type: ControlType.String,
        title: "Title Font Family",
        defaultValue: "Bebas Neue",
    },
    titleFontSize: {
        type: ControlType.Number,
        title: "Title Font Size (px)",
        defaultValue: 36,
        min: 16,
        max: 72,
        step: 1,
    },
    transparentFill: {
        type: ControlType.Number,
        title: "Dark Background Fill",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    iconOpacity: {
        type: ControlType.Number,
        title: "Center Icon Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
    },
    glowStrength: {
        type: ControlType.Number,
        title: "Cursor Border Strength",
        defaultValue: 0.9,
        min: 0.1,
        max: 1.5,
        step: 0.1,
        displayStepper: true,
    },
    glowSize: {
        type: ControlType.Number,
        title: "Proximity Radius (px)",
        defaultValue: 350,
        min: 100,
        max: 800,
        step: 10,
    },
    baseStrokeWidth: {
        type: ControlType.Number,
        title: "Base Stroke Width",
        defaultValue: 1,
        min: 0,
        max: 5,
        step: 1,
    },
    baseStrokeOpacity: {
        type: ControlType.Number,
        title: "Base Stroke Opacity",
        defaultValue: 0.25,
        min: 0,
        max: 1,
        step: 0.05,
    },
    baseGlowRadius: {
        type: ControlType.Number,
        title: "Base Glow Radius (px)",
        defaultValue: 8,
        min: 0,
        max: 50,
        step: 1,
    },
    baseGlowOpacity: {
        type: ControlType.Number,
        title: "Base Glow Opacity",
        defaultValue: 0.15,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
