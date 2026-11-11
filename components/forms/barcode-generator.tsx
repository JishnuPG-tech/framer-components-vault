// Random barcode generator that fills a frame horizontally or vertically with configurable colors
import { useState, useEffect, useMemo, startTransition, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface BarcodeGeneratorProps {
    orientation: "horizontal" | "vertical"
    barColor: string
    backgroundColor: string
    barCount: number
    randomize: boolean
    interval: number
    barcodeValue: string
    style?: CSSProperties
}

/**
 * Random Barcode Generator
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function BarcodeGenerator(props: BarcodeGeneratorProps) {
    const {
        orientation = "horizontal",
        barColor = "#000000",
        backgroundColor = "#FFFFFF",
        barCount = 50,
        randomize = false,
        interval = 2,
        barcodeValue = "",
    } = props

    const [seed, setSeed] = useState(() => Math.random())

    useEffect(() => {
        if (randomize) {
            const intervalId = setInterval(() => {
                startTransition(() => setSeed(Math.random()))
            }, interval * 1000)
            return () => clearInterval(intervalId)
        }
    }, [randomize, interval])

    const bars = useMemo(() => {
        // If barcodeValue is provided, convert string to barcode pattern
        if (barcodeValue && barcodeValue.trim().length > 0) {
            // Code 128 encoding patterns (each character is 11 modules: 3 bars and 3 spaces)
            const CODE128 = [
                "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
                "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
                "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
                "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
                "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
                "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
                "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
                "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
                "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
                "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
                "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
                "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
                "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
                "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
                "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
                "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
                "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
                "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
                "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
                "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
                "10111101110", "11101011110", "11110101110", "11010000100", "11010010000",
                "11010011100", "11000111010"
            ]
            
            const START_B = 104
            const STOP = 106
            
            // Convert string to Code 128B encoding
            const encodeChar = (char: string): number => {
                const code = char.charCodeAt(0)
                if (code >= 32 && code <= 127) {
                    return code - 32
                }
                return 0 // Default to space for invalid characters
            }
            
            const values: number[] = [START_B]
            let checksum = START_B
            
            for (let i = 0; i < barcodeValue.length; i++) {
                const value = encodeChar(barcodeValue[i])
                values.push(value)
                checksum += value * (i + 1)
            }
            
            // Add checksum
            values.push(checksum % 103)
            values.push(STOP)
            
            // Convert to bar pattern - each module is width 1
            const modules: number[] = []
            
            // Quiet zone (10 modules minimum for Code 128)
            for (let i = 0; i < 10; i++) {
                modules.push(0) // 0 = space/background
            }
            
            for (const value of values) {
                const pattern = value === STOP ? "1100011101011" : CODE128[value]
                for (let i = 0; i < pattern.length; i++) {
                    modules.push(pattern[i] === '1' ? 1 : 0) // 1 = bar, 0 = space
                }
            }
            
            // Quiet zone (right/bottom)
            for (let i = 0; i < 10; i++) {
                modules.push(0)
            }
            
            // Convert modules to bars (combine consecutive modules of same type)
            const result: { width: number; isBar: boolean }[] = []
            let currentType = modules[0]
            let currentWidth = 1
            
            for (let i = 1; i < modules.length; i++) {
                if (modules[i] === currentType) {
                    currentWidth++
                } else {
                    result.push({
                        width: currentWidth,
                        isBar: currentType === 1,
                    })
                    currentType = modules[i]
                    currentWidth = 1
                }
            }
            
            // Push the last segment
            result.push({
                width: currentWidth,
                isBar: currentType === 1,
            })
            
            return result
        }
        
        // Original random generation logic
        const random = (s: number) => {
            const x = Math.sin(s) * 10000
            return x - Math.floor(x)
        }

        const result: { width: number; isBar: boolean }[] = []
        for (let i = 0; i < barCount; i++) {
            result.push({
                width: random(seed + i),
                isBar: random(seed + i + 1000) > 0.5,
            })
        }
        return result
    }, [seed, barCount, barcodeValue])

    const isHorizontal = orientation === "horizontal"
    
    // Calculate total modules for proper scaling
    const totalModules = useMemo(() => {
        return bars.reduce((sum, bar) => sum + bar.width, 0)
    }, [bars])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                backgroundColor,
                display: "flex",
                flexDirection: isHorizontal ? "row" : "column",
                alignItems: "stretch",
                overflow: "hidden",
            }}
        >
            {bars.map((bar, index) => {
                const percentage = (bar.width / totalModules) * 100
                return (
                    <div
                        key={index}
                        style={{
                            backgroundColor: bar.isBar ? barColor : backgroundColor,
                            [isHorizontal ? "width" : "height"]: `${percentage}%`,
                            [isHorizontal ? "height" : "width"]: "100%",
                        }}
                    />
                )
            })}
        </div>
    )
}

addPropertyControls(BarcodeGenerator, {
    barcodeValue: {
        type: ControlType.String,
        title: "Value",
        description: "Entering barcode value will disable 'Bar Count' and 'Auto Randomize' attributes",
        defaultValue: "",
        placeholder: "Enter text...",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
        displaySegmentedControl: true,
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#000000",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    barCount: {
        type: ControlType.Number,
        title: "Bar Count",
        defaultValue: 50,
        min: 10,
        max: 500,
        step: 1,
        hidden: ({ barcodeValue }) => barcodeValue && barcodeValue.trim().length > 0,
    },
    randomize: {
        type: ControlType.Boolean,
        title: "Auto Randomize",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: ({ barcodeValue }) => barcodeValue && barcodeValue.trim().length > 0,
    },
    interval: {
        type: ControlType.Number,
        title: "Interval",
        defaultValue: 2,
        min: 0.1,
        max: 10,
        step: 0.1,
        unit: "s",
        hidden: ({ randomize, barcodeValue }) => !randomize || (barcodeValue && barcodeValue.trim().length > 0),
    },
})

BarcodeGenerator.displayName = "Barcode Generator"