// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef } from "react"

// Google Fonts CSS import
const fontImport = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Indie+Flower&family=Nothing+You+Could+Do&family=Reenie+Beanie&family=Shadows+Into+Light&display=swap');
`

interface BadHandwritingProps {
    text: string
    fontSize: number
    color: string
    letterSpacing: number
    lineHeight: number
    fontWeight: number
    seed: number
    alignment: "left" | "center" | "right"
}

export default function BadHandwriting({
    text = "The quick brown fox jumps over the lazy dog.",
    fontSize = 48,
    color = "#000000",
    letterSpacing = 0,
    lineHeight = 1.2,
    fontWeight = 400,
    seed = 12,
    alignment = "left",
}: BadHandwritingProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Seeded random function
    function seededRandom(seedValue: number): number {
        let x = Math.sin(seedValue++) * 10000
        return x - Math.floor(x)
    }

    // Wrap each letter in a span with a random font
    function wrapLetters(str: string, element: HTMLElement, seedValue: number) {
        const fonts = [
            "Caveat",
            "Indie Flower",
            "Nothing You Could Do",
            "Reenie Beanie",
            "Shadows Into Light",
        ]

        // Some fonts don't render certain letters well
        const blacklist: { [key: string]: string[] } = {
            l: ["Nothing You Could Do"],
        }

        const lastUsed: { [key: string]: string } = {}
        element.innerHTML = ""

        let currentSeed = seedValue

        for (const char of str) {
            const span = document.createElement("span")

            // Handle spaces specially - don't apply font randomization
            if (char === " ") {
                span.textContent = " "
                span.style.display = "inline-block"
                span.style.whiteSpace = "pre"
                element.appendChild(span)
                currentSeed++
                continue
            }

            const lowerChar = char.toLowerCase()
            let availableFonts = fonts

            // Filter out blacklisted fonts for specific characters
            if (blacklist[lowerChar]) {
                availableFonts = fonts.filter(
                    (f) => !blacklist[lowerChar].includes(f)
                )
            }

            // Don't use the same font twice in a row for the same character
            if (lastUsed[lowerChar]) {
                availableFonts = availableFonts.filter(
                    (f) => f !== lastUsed[lowerChar]
                )
            }

            const fontIndex = Math.floor(
                seededRandom(currentSeed) * availableFonts.length
            )
            const font = availableFonts[fontIndex] || fonts[0]
            lastUsed[lowerChar] = font

            span.style.fontFamily = `"${font}", cursive`
            span.textContent = char
            element.appendChild(span)

            currentSeed++
        }
    }

    useEffect(() => {
        if (containerRef.current) {
            wrapLetters(text, containerRef.current, seed)
        }
    }, [text, seed])

    return (
        <>
            <style>{fontImport}</style>
            <div
                ref={containerRef}
                style={{
                    fontSize: `${fontSize}px`,
                    color: color,
                    letterSpacing: `${letterSpacing}px`,
                    lineHeight: lineHeight,
                    fontWeight: fontWeight,
                    textAlign: alignment,
                    width: "100%",
                    height: "auto",
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                }}
            />
        </>
    )
}

// Framer property controls
addPropertyControls(BadHandwriting, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "The quick brown fox jumps over the lazy dog.",
        displayTextArea: true,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 48,
        min: 12,
        max: 200,
        step: 1,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -5,
        max: 20,
        step: 0.5,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.2,
        min: 0.8,
        max: 3,
        step: 0.1,
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Font Weight",
        defaultValue: 400,
        min: 400,
        max: 700,
        step: 50,
        displayStepper: true,
        description: "Only affects Caveat font (other fonts are always 400)",
    },
    seed: {
        type: ControlType.Number,
        title: "Pattern",
        defaultValue: 12,
        min: 1,
        max: 10000,
        step: 1,
        displayStepper: true,
        description: "# means nothing. Change to get different random patterns",
    },
    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
})
