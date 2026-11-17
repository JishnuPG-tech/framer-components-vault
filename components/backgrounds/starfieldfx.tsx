// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useMemo, CSSProperties } from "react"

// Seeded random number generator for consistent star positions
function seededRandom(seed: number): () => number {
    let state = seed
    return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff
        return state / 0x7fffffff
    }
}

// Generate star positions with seeded randomness
function generateStars(
    count: number,
    seed: number,
    areaWidth: number,
    areaHeight: number,
    color: string
): string {
    const random = seededRandom(seed)
    const shadows: string[] = []
    for (let i = 0; i < count; i++) {
        const x = Math.floor(random() * areaWidth)
        const y = Math.floor(random() * areaHeight)
        shadows.push(`${x}px ${y}px ${color}`)
    }
    return shadows.join(", ")
}

interface Props {
    // Background
    backgroundColor: string
    gradientColor: string

    // Stars
    starColor: string
    starDensity: number

    // Animation
    animationSpeed: number

    // Layers
    showLayer1: boolean
    showLayer2: boolean
    showLayer3: boolean

    // Advanced
    seed: number
}

/**
 * Starfield Pattern — An immersive animated starfield with parallax layers
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 400
 */
export default function StarfieldPattern(props: Props) {
    const {
        backgroundColor = "#090a0f",
        gradientColor = "#1b2735",
        starColor = "#ffffff",
        starDensity = 1,
        animationSpeed = 1,
        showLayer1 = true,
        showLayer2 = true,
        showLayer3 = true,
        seed = 42,
    } = props

    // Calculate star counts based on density
    const layer1Count = Math.round(700 * starDensity)
    const layer2Count = Math.round(200 * starDensity)
    const layer3Count = Math.round(100 * starDensity)

    // Memoize star shadow strings for performance
    const layer1Shadows = useMemo(
        () => generateStars(layer1Count, seed, 2000, 2000, starColor),
        [layer1Count, seed, starColor]
    )
    const layer2Shadows = useMemo(
        () => generateStars(layer2Count, seed + 1000, 2000, 2000, starColor),
        [layer2Count, seed, starColor]
    )
    const layer3Shadows = useMemo(
        () => generateStars(layer3Count, seed + 2000, 2000, 2000, starColor),
        [layer3Count, seed, starColor]
    )

    // Calculate animation durations based on speed
    const layer1Duration = 50 / animationSpeed
    const layer2Duration = 100 / animationSpeed
    const layer3Duration = 150 / animationSpeed

    // Keyframes as inline styles with CSS animation
    const keyframesStyle = `
        @keyframes starfieldScroll {
            from { transform: translateY(0px); }
            to { transform: translateY(-2000px); }
        }
    `

    const containerStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        height: "100%",
        background: `radial-gradient(ellipse at bottom, ${gradientColor} 0%, ${backgroundColor} 100%)`,
        overflow: "hidden",
    }

    const starBaseStyle: CSSProperties = {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "transparent",
    }

    const layer1Style: CSSProperties = {
        ...starBaseStyle,
        width: 1,
        height: 1,
        boxShadow: layer1Shadows,
        animation: `starfieldScroll ${layer1Duration}s linear infinite`,
    }

    const layer2Style: CSSProperties = {
        ...starBaseStyle,
        width: 2,
        height: 2,
        boxShadow: layer2Shadows,
        animation: `starfieldScroll ${layer2Duration}s linear infinite`,
    }

    const layer3Style: CSSProperties = {
        ...starBaseStyle,
        width: 3,
        height: 3,
        boxShadow: layer3Shadows,
        animation: `starfieldScroll ${layer3Duration}s linear infinite`,
    }

    // After pseudo-element simulation with offset
    const layer1AfterStyle: CSSProperties = {
        ...starBaseStyle,
        top: 2000,
        width: 1,
        height: 1,
        boxShadow: layer1Shadows,
        animation: `starfieldScroll ${layer1Duration}s linear infinite`,
    }

    const layer2AfterStyle: CSSProperties = {
        ...starBaseStyle,
        top: 2000,
        width: 2,
        height: 2,
        boxShadow: layer2Shadows,
        animation: `starfieldScroll ${layer2Duration}s linear infinite`,
    }

    const layer3AfterStyle: CSSProperties = {
        ...starBaseStyle,
        top: 2000,
        width: 3,
        height: 3,
        boxShadow: layer3Shadows,
        animation: `starfieldScroll ${layer3Duration}s linear infinite`,
    }

    return (
        <div style={containerStyle}>
            <style>{keyframesStyle}</style>

            {showLayer1 && (
                <>
                    <div style={layer1Style} />
                    <div style={layer1AfterStyle} />
                </>
            )}

            {showLayer2 && (
                <>
                    <div style={layer2Style} />
                    <div style={layer2AfterStyle} />
                </>
            )}

            {showLayer3 && (
                <>
                    <div style={layer3Style} />
                    <div style={layer3AfterStyle} />
                </>
            )}
        </div>
    )
}

addPropertyControls(StarfieldPattern, {
    // Background Section
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#090a0f",
    },
    gradientColor: {
        type: ControlType.Color,
        title: "Gradient",
        defaultValue: "#1b2735",
    },

    // Stars Section
    starColor: {
        type: ControlType.Color,
        title: "Star Color",
        defaultValue: "#ffffff",
    },
    starDensity: {
        type: ControlType.Number,
        title: "Density",
        defaultValue: 1,
        min: 0.1,
        max: 2,
        step: 0.1,
        displayStepper: true,
    },

    // Animation Section
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },

    // Layers Section
    showLayer1: {
        type: ControlType.Boolean,
        title: "Small Stars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showLayer2: {
        type: ControlType.Boolean,
        title: "Medium Stars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    showLayer3: {
        type: ControlType.Boolean,
        title: "Large Stars",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    // Advanced Section
    seed: {
        type: ControlType.Number,
        title: "Random Seed",
        defaultValue: 42,
        min: 1,
        max: 9999,
        step: 1,
    },
})
