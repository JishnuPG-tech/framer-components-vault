// Word Magnet - Words repel from cursor slightly, then snap back with letters staying intact
// Look: Words repel from the cursor slightly, then snap back—letters stay intact.
// Use for: Playful landing pages.
// Props: radius, force, damping, returnDelay
// Perf/A11y: Pointer-event throttling; disable on mobile if jittery.

import {
    useEffect,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useSpring, useMotionValue } from "framer-motion"

interface WordMagnetCBProps {
    text: string
    radius: number
    force: number
    damping: number
    returnDelay: number
    textColor: string
    font: CSSProperties
    disableOnMobile: boolean
    overflow: "visible" | "hidden" | "scroll" | "auto"
    style?: CSSProperties
}

/**
 * Word Magnet
 *
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 245
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function WordMagnetCB(props: WordMagnetCBProps) {
    const {
        text = "Hover over these words and watch them dance",
        radius = 120,
        force = 0.3,
        damping = 15,
        returnDelay = 200,
        textColor = "#000000",
        font,
        disableOnMobile = true,
        overflow = "hidden",
        style,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const [words, setWords] = useState<string[]>([])
    const [isMobile, setIsMobile] = useState(false)
    const isStatic = useIsStaticRenderer()
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const lastMoveTime = useRef(0)
    const throttleDelay = 16 // ~60fps

    // Detect layout mode
    const isFixedWidth = style?.width === "100%"
    const isFixedHeight = style?.height === "100%"

    useEffect(() => {
        if (typeof window !== "undefined") {
            const checkMobile = () => {
                startTransition(() => {
                    setIsMobile(
                        window.innerWidth < 768 || "ontouchstart" in window
                    )
                })
            }
            checkMobile()
            window.addEventListener("resize", checkMobile)
            return () => window.removeEventListener("resize", checkMobile)
        }
    }, [])

    useEffect(() => {
        startTransition(() => {
            setWords(text.split(" ").filter((word) => word.length > 0))
        })
    }, [text])

    useEffect(() => {
        if (isStatic || (disableOnMobile && isMobile)) return

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now()
            if (now - lastMoveTime.current < throttleDelay) return
            lastMoveTime.current = now

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                mouseX.set(e.clientX - rect.left)
                mouseY.set(e.clientY - rect.top)
            }
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [mouseX, mouseY, isStatic, isMobile, disableOnMobile])

    const isDisabled = isStatic || (disableOnMobile && isMobile)

    return (
        <div
            ref={containerRef}
            style={{
                ...style,
                position: "relative",
                width: isFixedWidth ? "100%" : "max-content",
                height: isFixedHeight ? "100%" : "max-content",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5em",
                overflow,
                ...font,
                color: textColor,
            }}
        >
            {words.map((word, index) => (
                <Word
                    key={`${word}-${index}`}
                    word={word}
                    mouseX={mouseX}
                    mouseY={mouseY}
                    radius={radius}
                    force={force}
                    damping={damping}
                    returnDelay={returnDelay}
                    disabled={isDisabled}
                />
            ))}
        </div>
    )
}

interface WordProps {
    word: string
    mouseX: any
    mouseY: any
    radius: number
    force: number
    damping: number
    returnDelay: number
    disabled: boolean
}

function Word({
    word,
    mouseX,
    mouseY,
    radius,
    force,
    damping,
    returnDelay,
    disabled,
}: WordProps) {
    const wordRef = useRef<HTMLSpanElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const returnTimeout = useRef<number | null>(null)

    const x = useSpring(0, { damping, stiffness: 200 })
    const y = useSpring(0, { damping, stiffness: 200 })

    useEffect(() => {
        if (disabled) return

        const unsubscribeX = mouseX.on("change", (latest: number) => {
            if (!wordRef.current) return

            const rect = wordRef.current.getBoundingClientRect()
            const wordCenterX =
                rect.left +
                rect.width / 2 -
                (wordRef.current.offsetParent?.getBoundingClientRect().left ||
                    0)
            const wordCenterY =
                rect.top +
                rect.height / 2 -
                (wordRef.current.offsetParent?.getBoundingClientRect().top || 0)

            const currentMouseY = mouseY.get()
            const dx = wordCenterX - latest
            const dy = wordCenterY - currentMouseY
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < radius) {
                const angle = Math.atan2(dy, dx)
                const repelForce = ((radius - distance) / radius) * force * 100
                const offsetX = Math.cos(angle) * repelForce
                const offsetY = Math.sin(angle) * repelForce

                x.set(offsetX)
                y.set(offsetY)

                if (returnTimeout.current !== null) {
                    clearTimeout(returnTimeout.current)
                }

                returnTimeout.current = window.setTimeout(() => {
                    x.set(0)
                    y.set(0)
                }, returnDelay)
            }
        })

        const unsubscribeY = mouseY.on("change", () => {
            mouseX.get() // Trigger the X listener
        })

        return () => {
            unsubscribeX()
            unsubscribeY()
            if (returnTimeout.current !== null) {
                clearTimeout(returnTimeout.current)
            }
        }
    }, [mouseX, mouseY, radius, force, x, y, returnDelay, disabled])

    if (disabled) {
        return <span style={{ whiteSpace: "nowrap" }}>{word}</span>
    }

    return (
        <motion.span
            ref={wordRef}
            style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                x,
                y,
            }}
        >
            {word}
        </motion.span>
    )
}

addPropertyControls(WordMagnetCB, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue:
            'Lorem Ipsum is a type of placeholder text commonly used in the design and publishing industries. It is derived from a work by the Roman statesman and philosopher Cicero, specifically from "De finibus bonorum et malorum," and has been altered to create nonsensical Latin phrases.',
        displayTextArea: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 130,
        min: 50,
        max: 300,
        step: 10,
        unit: "px",
    },
    force: {
        type: ControlType.Number,
        title: "Force",
        defaultValue: 0.45,
        min: 0.1,
        max: 1,
        step: 0.05,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 28,
        min: 5,
        max: 50,
        step: 1,
    },
    returnDelay: {
        type: ControlType.Number,
        title: "Return Delay",
        defaultValue: 400,
        min: 0,
        max: 1000,
        step: 50,
        unit: "ms",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "32px",
            variant: "Semibold",
            letterSpacing: "-0.03em",
            lineHeight: "1.2em",
        },
    },
    overflow: {
        type: ControlType.Enum,
        title: "Overflow",
        options: ["visible", "hidden", "scroll", "auto"],
        optionTitles: ["Visible", "Hidden", "Scroll", "Auto"],
        defaultValue: "visible",
        displaySegmentedControl: false,
    },
    disableOnMobile: {
        type: ControlType.Boolean,
        title: "Disable on Mobile",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
