// Text animation with two randomly mixed fonts per character, looping
import { useEffect, useState, useMemo, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface DualFontAnimationProps {
    text: string
    font1: any
    font2: any
    color: string
    animationSpeed: number
    useSameSize: boolean
    unifiedSize: number
    style?: React.CSSProperties
}

/**
 * Dual Font Animation
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function DualFontAnimation(props: DualFontAnimationProps) {
    const {
        text,
        font1,
        font2,
        color,
        animationSpeed,
        useSameSize,
        unifiedSize,
    } = props

    const isStatic = useIsStaticRenderer()
    const [fontStates, setFontStates] = useState<boolean[]>([])

    const chars = useMemo(() => text.split(""), [text])

    useEffect(() => {
        if (isStatic) {
            setFontStates(chars.map(() => Math.random() > 0.5))
            return
        }

        const initialStates = chars.map(() => Math.random() > 0.5)
        startTransition(() => setFontStates(initialStates))

        const interval = setInterval(() => {
            startTransition(() => {
                setFontStates(chars.map(() => Math.random() > 0.5))
            })
        }, animationSpeed)

        return () => clearInterval(interval)
    }, [chars, animationSpeed, isStatic])

    return (
        <div
            style={{
                display: "inline-flex",
                flexWrap: "wrap",
                color,
                width: "max-content",
            }}
        >
            {chars.map((char, index) => {
                const useFont1 = fontStates[index]
                const currentFont = useFont1 ? font1 : font2

                return (
                    <span
                        key={index}
                        style={{
                            ...currentFont,
                            ...(useSameSize && { fontSize: unifiedSize }),
                            whiteSpace: char === " " ? "pre" : "normal",
                        }}
                    >
                        {char}
                    </span>
                )
            })}
        </div>
    )
}

addPropertyControls(DualFontAnimation, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Dual Fonts",
    },
    useSameSize: {
        type: ControlType.Boolean,
        title: "Same Size",
        defaultValue: true,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    unifiedSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 320,
        min: 8,
        max: 1000,
        step: 1,
        unit: "px",
        hidden: ({ useSameSize }) => !useSameSize,
    },
    font1: {
        type: ControlType.Font,
        title: "Font 1",
        defaultValue: {
            fontSize: "40px",
            variant: "Bold",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    font2: {
        type: ControlType.Font,
        title: "Font 2",
        defaultValue: {
            fontSize: "40px",
            variant: "Regular",
            letterSpacing: "0em",
            lineHeight: "1em",
        },
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 300,
        min: 100,
        max: 2000,
        step: 100,
        unit: "ms",
    },
})
