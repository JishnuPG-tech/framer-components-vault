import { motion } from "framer-motion"
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
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 200
 * @framerInstrisicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FallingLights(props) {
    const {
        color,
        backgroundColor,
        duration,
        blurIntensity,
        density,
        angle,
        streakWidth,
        streakHeight,
    } = props

    const generateBackgroundImage = () => {
        const patterns = [
            // Row 1
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 235px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 235px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 117.5px, ${color} 100%, transparent 150%)`,
            // Row 2
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 252px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 252px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 126px, ${color} 100%, transparent 150%)`,
            // Row 3
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 150px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 150px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 75px, ${color} 100%, transparent 150%)`,
            // Row 4
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 253px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 253px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 126.5px, ${color} 100%, transparent 150%)`,
            // Row 5
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 204px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 204px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 102px, ${color} 100%, transparent 150%)`,
            // Row 6
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 134px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 134px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 67px, ${color} 100%, transparent 150%)`,
            // Row 7
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 179px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 179px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 89.5px, ${color} 100%, transparent 150%)`,
            // Row 8
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 299px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 299px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 149.5px, ${color} 100%, transparent 150%)`,
            // Row 9
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 215px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 215px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 107.5px, ${color} 100%, transparent 150%)`,
            // Row 10
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 281px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 281px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 140.5px, ${color} 100%, transparent 150%)`,
            // Row 11
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 158px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 158px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 79px, ${color} 100%, transparent 150%)`,
            // Row 12
            `radial-gradient(${streakWidth}px ${streakHeight}px at 0px 210px, ${color} 0%, transparent 100%)`,
            `radial-gradient(${streakWidth}px ${streakHeight}px at 300px 210px, ${color} 0%, transparent 100%)`,
            `radial-gradient(3px 3px at 150px 105px, ${color} 100%, transparent 150%)`,
        ]

        return patterns.join(", ")
    }

    const backgroundSizes = useMemo(() => {
        return [
            "300px 235px",
            "300px 235px",
            "300px 235px",
            "300px 252px",
            "300px 252px",
            "300px 252px",
            "300px 150px",
            "300px 150px",
            "300px 150px",
            "300px 253px",
            "300px 253px",
            "300px 253px",
            "300px 204px",
            "300px 204px",
            "300px 204px",
            "300px 134px",
            "300px 134px",
            "300px 134px",
            "300px 179px",
            "300px 179px",
            "300px 179px",
            "300px 299px",
            "300px 299px",
            "300px 299px",
            "300px 215px",
            "300px 215px",
            "300px 215px",
            "300px 281px",
            "300px 281px",
            "300px 281px",
            "300px 158px",
            "300px 158px",
            "300px 158px",
            "300px 210px",
            "300px 210px",
        ].join(", ")
    }, [])

    const startPositions =
        "0px 220px, 3px 220px, 151.5px 337.5px, 25px 24px, 28px 24px, 176.5px 150px, 50px 16px, 53px 16px, 201.5px 91px, 75px 224px, 78px 224px, 226.5px 230.5px, 100px 19px, 103px 19px, 251.5px 121px, 125px 120px, 128px 120px, 276.5px 187px, 150px 31px, 153px 31px, 301.5px 120.5px, 175px 235px, 178px 235px, 326.5px 384.5px, 200px 121px, 203px 121px, 351.5px 228.5px, 225px 224px, 228px 224px, 376.5px 364.5px, 250px 26px, 253px 26px, 401.5px 105px, 275px 75px, 278px 75px, 426.5px 180px"

    const endPositions =
        "0px 6800px, 3px 6800px, 151.5px 6917.5px, 25px 13632px, 28px 13632px, 176.5px 13758px, 50px 5416px, 53px 5416px, 201.5px 5491px, 75px 17175px, 78px 17175px, 226.5px 17301.5px, 100px 5119px, 103px 5119px, 251.5px 5221px, 125px 8428px, 128px 8428px, 276.5px 8495px, 150px 9876px, 153px 9876px, 301.5px 9965.5px, 175px 13391px, 178px 13391px, 326.5px 13540.5px, 200px 14741px, 203px 14741px, 351.5px 14848.5px, 225px 18770px, 228px 18770px, 376.5px 18910.5px, 250px 5082px, 253px 5082px, 401.5px 5161px, 275px 6375px, 278px 6375px, 426.5px 6480px"

    const getAnimationPositions = () => {
        // Convert angle to radians (0° = down, 90° = right, 180° = up, 270° = left)
        const radians = (angle * Math.PI) / 180
        const distance = 20000 // Base distance for animation

        // Calculate x and y offsets based on angle
        // Note: y-axis is inverted in CSS (positive = down), so we negate yOffset
        let xOffset, yOffset

        // Handle specific angles as special cases
        if (angle === 180) {
            // Move upward
            xOffset = 0
            yOffset = -distance
        } else if (angle === 360 || angle === 0) {
            // Move downward
            xOffset = 0
            yOffset = distance
        } else {
            // General calculation for other angles
            xOffset = Math.sin(radians) * distance
            yOffset = Math.cos(radians) * distance
        }

        // Parse start positions
        const startPosArray = startPositions.split(", ").map((pos) => {
            const [x, y] = pos.split(" ").map((v) => parseFloat(v))
            return { x, y }
        })

        // Calculate end positions by adding offsets with random variations
        const endPosArray = startPosArray.map((pos, index) => {
            // Add random variation to distance (between 0.7x and 1.3x)
            const seed = (index * 137.508) % 1 // Pseudo-random based on index
            const randomFactor = 0.7 + seed * 0.6
            return `${pos.x + xOffset * randomFactor}px ${pos.y + yOffset * randomFactor}px`
        })

        return {
            start: startPositions,
            end: endPosArray.join(", "),
        }
    }

    const animationPositions = useMemo(() => getAnimationPositions(), [angle])

    // Generate random duration multipliers for each streak (between 0.8x and 1.2x)
    const getRandomDurations = () => {
        const numStreaks = 36 // Total number of radial gradients
        return Array.from({ length: numStreaks }, (_, i) => {
            const seed = (i * 137.508) % 1
            return duration * (0.8 + seed * 0.4)
        })
    }

    const overlayStyle = useMemo(
        () => ({
            position: "absolute" as const,
            inset: 0,
            zIndex: 1,
            ...(blurIntensity > 0 && {
                backdropFilter: `blur(${blurIntensity}px)`,
            }),
            backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent ${2 * density}px, ${backgroundColor} ${2.5 * density}px)`,
            backgroundSize: `${8 * density}px ${8 * density}px`,
        }),
        [blurIntensity, density, backgroundColor]
    )

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                padding: "4px",
            }}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    zIndex: 0,
                    backgroundColor,
                    backgroundImage: generateBackgroundImage(),
                    backgroundSize: backgroundSizes,
                    willChange: "transform",
                    backgroundPosition: animationPositions.start,
                }}
                animate={{
                    backgroundPosition: animationPositions.end,
                }}
                transition={{
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                }}
            />
            {blurIntensity > 0 || density !== 1 ? (
                <div style={overlayStyle} />
            ) : null}
        </div>
    )
}

FallingLights.displayName = "Falling Lights"

addPropertyControls(FallingLights, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    color: {
        type: ControlType.Color,
        title: "Streak Color",
        defaultValue: "#ffffff",
    },
    streakWidth: {
        type: ControlType.Number,
        title: "Streak Width",
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 20,
        unit: "px",
        displayStepper: false,
    },
    streakHeight: {
        type: ControlType.Number,
        title: "Streak Height",
        min: 10,
        max: 500,
        step: 10,
        defaultValue: 50,
        unit: "px",
        displayStepper: false,
    },
    angle: {
        type: ControlType.Number,
        title: "Angle",
        min: 0,
        max: 360,
        step: 1,
        defaultValue: 0,
        unit: "°",
        displayStepper: false,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 10,
        max: 300,
        step: 10,
        defaultValue: 200,
        unit: "s",
        displayStepper: true,
        description: "Larger the value, slower the effect.",
    },
    blurIntensity: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 50,
        step: 1,
        defaultValue: 12,
        unit: "px",
        displayStepper: true,
    },
    density: {
        type: ControlType.Number,
        title: "Density",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 2,
        displayStepper: true,
        description:
            "[Click here](https://tinyurl.com/avirallakhanpaul) to get more exciting components!",
    },
})
