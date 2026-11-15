import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Rang ke hisaab se text dark ya light khud chun leta hai
function readableOn(hex: string) {
    const h = (hex || "#000").replace("#", "")
    const full =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return lum > 0.6 ? "#1B1535" : "#FFFFFF"
}

/**
 * PopFAQ: colorful animated FAQ accordion for Framer
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function PopFAQ(props) {
    const {
        items,
        colors,
        allowMultiple,
        ink,
        paper,
        borderWidth,
        radius,
        gap,
        questionSize,
        answerSize,
        font,
    } = props

    const [open, setOpen] = useState<number[]>([0])
    const [hover, setHover] = useState<number | null>(null)

    const toggle = (i: number) => {
        setOpen((prev) => {
            if (prev.includes(i)) return prev.filter((x) => x !== i)
            return allowMultiple ? [...prev, i] : [i]
        })
    }

    const palette = colors && colors.length ? colors : ["#6C4CF1"]
    const shadow = 6

    return (
        <div
            style={{
                width: "100%",
                minWidth: 280,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                gap: gap,
                padding: shadow,
                boxSizing: "border-box",
                fontFamily: font?.fontFamily ?? "Inter, sans-serif",
            }}
        >
            {items.map((item, i) => {
                const color = palette[i % palette.length]
                const isOpen = open.includes(i)
                const isHover = hover === i
                const onColor = readableOn(color)
                const offset = isOpen ? shadow : isHover ? shadow - 2 : shadow

                return (
                    // Sirf page load par ek baar: cards ek ke baad ek upar aate hain
                    <motion.div
                        key={i}
                        initial={{ y: 24, rotate: i % 2 ? 1.5 : -1.5 }}
                        animate={{ y: 0, rotate: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 20,
                            delay: i * 0.08,
                        }}
                        style={{ position: "relative" }}
                    >
                        {/* Peeche wala rangeen "shadow" block */}
                        <motion.div
                            aria-hidden
                            animate={{
                                x: offset,
                                y: offset,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 26,
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                borderRadius: radius,
                                background: color,
                                border: `${borderWidth}px solid ${ink}`,
                            }}
                        />

                        {/* Asli card */}
                        <motion.div
                            onHoverStart={() => setHover(i)}
                            onHoverEnd={() => setHover(null)}
                            animate={{
                                x: isOpen ? 0 : isHover ? -2 : 0,
                                y: isOpen ? 0 : isHover ? -2 : 0,
                                backgroundColor: isOpen ? color : paper,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 28,
                            }}
                            style={{
                                position: "relative",
                                borderRadius: radius,
                                border: `${borderWidth}px solid ${ink}`,
                                overflow: "hidden",
                            }}
                        >
                            <button
                                onClick={() => toggle(i)}
                                aria-expanded={isOpen}
                                style={{
                                    all: "unset",
                                    boxSizing: "border-box",
                                    width: "100%",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    padding: "18px 20px",
                                    color: isOpen ? onColor : ink,
                                    fontSize: questionSize,
                                    fontWeight: 700,
                                    lineHeight: 1.35,
                                }}
                            >
                                <span style={{ flex: 1 }}>{item.question}</span>

                                {/* Icon: plus ghoom kar minus ban jata hai */}
                                <motion.span
                                    animate={{
                                        rotate: isOpen ? 180 : 0,
                                        backgroundColor: isOpen ? paper : color,
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 18,
                                    }}
                                    style={{
                                        flexShrink: 0,
                                        width: 36,
                                        height: 36,
                                        borderRadius: "50%",
                                        border: `${borderWidth}px solid ${ink}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        position: "relative",
                                    }}
                                >
                                    <span
                                        style={{
                                            position: "absolute",
                                            width: 14,
                                            height: 2.5,
                                            borderRadius: 2,
                                            background: ink,
                                        }}
                                    />
                                    <motion.span
                                        animate={{ scaleY: isOpen ? 0 : 1 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            position: "absolute",
                                            width: 2.5,
                                            height: 14,
                                            borderRadius: 2,
                                            background: ink,
                                        }}
                                    />
                                </motion.span>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        key="content"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            height: {
                                                type: "spring",
                                                stiffness: 260,
                                                damping: 28,
                                            },
                                            opacity: { duration: 0.2 },
                                        }}
                                        style={{ overflow: "hidden" }}
                                    >
                                        <motion.p
                                            initial={{ y: -8 }}
                                            animate={{ y: 0 }}
                                            exit={{ y: -8 }}
                                            transition={{ duration: 0.25 }}
                                            style={{
                                                margin: 0,
                                                padding: "0 20px 20px",
                                                maxWidth: 640,
                                                color: onColor,
                                                fontSize: answerSize,
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {item.answer}
                                        </motion.p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )
            })}
        </div>
    )
}

PopFAQ.defaultProps = {
    items: [
        {
            question: "Yeh product kya hai?",
            answer: "Yahan apne product ka short sa jawab likhein. Do teen lines kafi hain.",
        },
        {
            question: "Price kitni hai?",
            answer: "Plans ₨ 999 se start hote hain. Koi hidden charges nahi.",
        },
        {
            question: "Support kaise milega?",
            answer: "Aap email ya WhatsApp par humse rabta kar sakte hain. Hum 24 ghante mein reply karte hain.",
        },
        {
            question: "Kya main plan badal sakta hoon?",
            answer: "Ji haan, aap kisi bhi waqt upgrade ya downgrade kar sakte hain.",
        },
        {
            question: "Refund policy kya hai?",
            answer: "Pehle 7 din mein kisi bhi wajah se refund mil sakta hai.",
        },
    ],
    colors: ["#8B6CFF", "#FF7AB8", "#5CD6FF", "#FFD23F", "#7DF29B"],
    allowMultiple: false,
    ink: "#1B1535",
    paper: "#FFFDF8",
    borderWidth: 2.5,
    radius: 18,
    gap: 16,
    questionSize: 18,
    answerSize: 16,
}

addPropertyControls(PopFAQ, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                question: {
                    type: ControlType.String,
                    title: "Question",
                    defaultValue: "Sawal?",
                },
                answer: {
                    type: ControlType.String,
                    title: "Answer",
                    defaultValue: "Jawab",
                    displayTextArea: true,
                },
            },
        },
    },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
    },
    allowMultiple: {
        type: ControlType.Boolean,
        title: "Multiple Open",
        defaultValue: false,
    },
    font: { type: ControlType.Font, title: "Font", controls: "basic" },
    ink: { type: ControlType.Color, title: "Outline" },
    paper: { type: ControlType.Color, title: "Card BG" },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 6,
        step: 0.5,
        displayStepper: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 40,
        displayStepper: true,
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 4,
        max: 40,
        displayStepper: true,
    },
    questionSize: {
        type: ControlType.Number,
        title: "Q Size",
        min: 12,
        max: 32,
        displayStepper: true,
    },
    answerSize: {
        type: ControlType.Number,
        title: "A Size",
        min: 12,
        max: 28,
        displayStepper: true,
    },
})
