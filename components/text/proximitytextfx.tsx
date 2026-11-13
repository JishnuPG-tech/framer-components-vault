// Variable Proximity Text - Wrapped version
import { useRef, useEffect, useMemo, type CSSProperties } from "react"
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


function useAnimationFrame(callback: () => void) {
    useEffect(() => {
        let frameId: number
        const loop = () => {
            callback()
            frameId = requestAnimationFrame(loop)
        }
        frameId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frameId)
    }, [callback])
}

function useMousePositionRef() {
    const positionRef = useRef({ x: 0, y: 0 })
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            positionRef.current = { x: e.clientX, y: e.clientY }
        }
        const handleTouchMove = (e: TouchEvent) => {
            const t = e.touches[0]
            if (t) positionRef.current = { x: t.clientX, y: t.clientY }
        }
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("touchmove", handleTouchMove)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("touchmove", handleTouchMove)
        }
    }, [])
    return positionRef
}

function VariableProximity(props) {
    const {
        label,
        weightFrom,
        weightTo,
        opszFrom,
        opszTo,
        radius,
        falloff,
        font,
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
    const mousePositionRef = useMousePositionRef()
    const lastPos = useRef({ x: null, y: null })

    const fromSettings = useMemo(
        () => `'wght' ${weightFrom}, 'opsz' ${opszFrom}`,
        [weightFrom, opszFrom]
    )
    const toSettings = useMemo(
        () => `'wght' ${weightTo}, 'opsz' ${opszTo}`,
        [weightTo, opszTo]
    )

    const parsedSettings = [
        { axis: "wght", fromValue: weightFrom, toValue: weightTo },
        { axis: "opsz", fromValue: opszFrom, toValue: opszTo },
    ]

    const calculateDistance = (x1, y1, x2, y2) =>
        Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

    const calculateFalloff = (distance) => {
        const norm = Math.min(Math.max(1 - distance / radius, 0), 1)
        switch (falloff) {
            case "exponential":
                return norm ** 2
            case "gaussian":
                return Math.exp(-((distance / (radius / 2)) ** 2) / 2)
            default:
                return norm
        }
    }

    useAnimationFrame(() => {
        const { x, y } = mousePositionRef.current
        if (x === lastPos.current.x && y === lastPos.current.y) return
        lastPos.current = { x, y }

        const containerRect = containerRef.current?.getBoundingClientRect()
        if (!containerRect) return

        letterRefs.current.forEach((ref) => {
            if (!ref) return
            const rect = ref.getBoundingClientRect()
            const dist = calculateDistance(
                x,
                y,
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            )
            if (dist >= radius) {
                ref.style.fontVariationSettings = fromSettings
                return
            }
            const f = calculateFalloff(dist)
            const newSettings = parsedSettings
                .map(({ axis, fromValue, toValue }) => {
                    const val = fromValue + (toValue - fromValue) * f
                    return `'${axis}' ${val}`
                })
                .join(", ")
            ref.style.fontVariationSettings = newSettings
        })
    })

    let i = 0

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <link
                href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap"
                rel="stylesheet"
            />
            <div
                style={{
                    width: "100%",
                    fontFamily: '"Roboto Flex", sans-serif',
                    fontSize: font?.fontSize,
                    letterSpacing: font?.letterSpacing,
                    lineHeight: font?.lineHeight,
                    textAlign: font?.textAlign,
                    color: font?.color,
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                }}
            >
                {label.split("").map((char, idx) => (
                    <motion.span
                        key={idx}
                        ref={(el) => (letterRefs.current[idx] = el)}
                        style={{
                            display: char === " " ? "inline" : "inline-block",
                            fontVariationSettings: fromSettings,
                        }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </motion.span>
                ))}
            </div>
        </div>
    )
}

// --- Framer Controls ---
addPropertyControls(VariableProximity, {
    label: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            "Hover over me to see interactive variable font animation that wraps nicely across lines.",
        displayTextArea: true,
    },
    weightFrom: {
        type: ControlType.Number,
        title: "Weight From",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 10,
    },
    weightTo: {
        type: ControlType.Number,
        title: "Weight To",
        defaultValue: 1000,
        min: 100,
        max: 1000,
        step: 10,
    },
    opszFrom: {
        type: ControlType.Number,
        title: "Optical Size From",
        defaultValue: 9,
        min: 8,
        max: 144,
        step: 1,
    },
    opszTo: {
        type: ControlType.Number,
        title: "Optical Size To",
        defaultValue: 40,
        min: 8,
        max: 144,
        step: 1,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 100,
        min: 10,
        max: 500,
        step: 10,
        unit: "px",
    },
    falloff: {
        type: ControlType.Enum,
        title: "Falloff Type",
        options: ["linear", "exponential", "gaussian"],
        optionTitles: ["Linear", "Exponential", "Gaussian"],
        defaultValue: "linear",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Regular",
            letterSpacing: "-0.01em",
            lineHeight: "1.2em",
            textAlign: "center",
        },
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})

export default VariableProximity
