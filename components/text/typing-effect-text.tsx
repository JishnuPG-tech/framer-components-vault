import { useEffect, useRef, useState, type CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion } from "framer-motion"

type Tag = "h1" | "h2" | "h3" | "p" | "span"
type Align = "left" | "center" | "right"

interface CursorProps {
    visible: boolean
    character: string
    color: string
    blink: boolean
}

interface Props {
    prefix: string
    phrases: string[]
    tag: Tag
    typeSpeed: number
    deleteSpeed: number
    pause: number
    loop: boolean
    reserve: boolean
    align: Align
    cursor: Partial<CursorProps>
    font: CSSProperties
    color: string
    typedColor: string
    style?: CSSProperties
}

const JUSTIFY: Record<Align, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
}

// 한 문구를 다 지운 뒤 다음 문구를 치기 전까지 쉬는 시간(ms)
const NEXT_DELAY = 250

// 화면에는 보이지 않지만 스크린 리더는 읽을 수 있는 글자용 스타일
const VISUALLY_HIDDEN: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TypingLoopText(props: Props) {
    const {
        prefix = "We design ",
        phrases = ["websites.", "brands.", "products."],
        tag: Tag = "h2",
        typeSpeed = 70,
        deleteSpeed = 40,
        pause = 1.5,
        loop = true,
        reserve = true,
        align = "left",
        font,
        color = "#111111",
        typedColor = "#7C5CFF",
        style,
    } = props
    const cursor: CursorProps = {
        visible: true,
        character: "|",
        color: "#7C5CFF",
        blink: true,
        ...props.cursor,
    }

    const isStatic = useIsStaticRenderer()
    // 이모지처럼 두 칸을 차지하는 글자가 반으로 잘리지 않게 글자 단위로 나눈다
    const list = phrases.filter(Boolean).map((phrase) => Array.from(phrase))
    const phrasesKey = phrases.join("\n")
    const longest = list.reduce(
        (result, phrase) => (phrase.length > result.length ? phrase : result),
        []
    )

    const root = useRef<HTMLElement | null>(null)
    const [started, setStarted] = useState(false)
    const [index, setIndex] = useState(0)
    const [count, setCount] = useState(0)
    const [deleting, setDeleting] = useState(false)
    const [still, setStill] = useState(isStatic)

    // 화면에 보일 때부터 치기 시작한다
    useEffect(() => {
        if (isStatic) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setStill(true)
            return
        }
        const element = root.current
        if (!element) return

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setStarted(true)
                observer.disconnect()
            }
        })
        observer.observe(element)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        setIndex(0)
        setCount(0)
        setDeleting(false)
    }, [phrasesKey])

    useEffect(() => {
        if (still || !started || list.length === 0) return

        const phrase = list[index % list.length]
        let delay = typeSpeed
        let next = () => setCount(count + 1)
        if (!deleting && count >= phrase.length) {
            if (!loop && index >= list.length - 1) return
            delay = pause * 1000
            next = () => setDeleting(true)
        } else if (deleting && count > 0) {
            delay = deleteSpeed
            next = () => setCount(count - 1)
        } else if (deleting) {
            delay = NEXT_DELAY
            next = () => {
                setDeleting(false)
                setIndex((index + 1) % list.length)
            }
        }

        const timer = setTimeout(next, delay)
        return () => clearTimeout(timer)
    }, [
        still,
        started,
        index,
        count,
        deleting,
        phrasesKey,
        typeSpeed,
        deleteSpeed,
        pause,
        loop,
    ])

    const current = list.length ? list[index % list.length] : []
    const typed = still ? current.join("") : current.slice(0, count).join("")

    const cursorElement = cursor.visible && (
        <motion.span
            aria-hidden="true"
            style={{ color: cursor.color }}
            animate={{ opacity: cursor.blink && !isStatic ? [1, 1, 0, 0] : 1 }}
            transition={{
                duration: 1,
                times: [0, 0.5, 0.5, 1],
                repeat: Infinity,
                ease: "linear",
            }}
        >
            {cursor.character}
        </motion.span>
    )

    const line = (
        <>
            {prefix}
            <span style={{ color: typedColor }}>{typed}</span>
            {cursorElement}
        </>
    )

    return (
        <Tag
            ref={(element: HTMLElement | null) => {
                root.current = element
            }}
            style={{
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 1.2,
                ...font,
                ...style,
                position: "relative",
                display: "inline-block",
                margin: 0,
                color,
                whiteSpace: "pre",
            }}
        >
            {/* 한 글자씩 바뀌는 글자는 스크린 리더에 숨기고, 완성된 문구를 대신 읽게 한다 */}
            <span style={VISUALLY_HIDDEN}>
                {prefix}
                {current.join("")}
            </span>
            {reserve ? (
                <>
                    {/* 보이지 않는 가장 긴 문구가 자리를 잡아주므로, 글자가 쳐지는 동안 주변 레이아웃이 밀리지 않는다 */}
                    <span aria-hidden="true" style={{ visibility: "hidden" }}>
                        {prefix}
                        {longest.join("")}
                        {cursor.visible && cursor.character}
                    </span>
                    <span
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            justifyContent: JUSTIFY[align],
                        }}
                    >
                        <span>{line}</span>
                    </span>
                </>
            ) : (
                <span aria-hidden="true">{line}</span>
            )}
        </Tag>
    )
}

addPropertyControls(TypingLoopText, {
    prefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "We design ",
    },
    phrases: {
        type: ControlType.Array,
        title: "Phrases",
        control: { type: ControlType.String },
        defaultValue: ["websites.", "brands.", "products."],
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["h1", "h2", "h3", "p", "span"],
        optionTitles: ["H1", "H2", "H3", "P", "Span"],
        defaultValue: "h2",
    },
    typeSpeed: {
        type: ControlType.Number,
        title: "Type Speed",
        min: 10,
        max: 300,
        step: 5,
        unit: "ms",
        defaultValue: 70,
    },
    deleteSpeed: {
        type: ControlType.Number,
        title: "Delete Speed",
        min: 10,
        max: 300,
        step: 5,
        unit: "ms",
        defaultValue: 40,
    },
    pause: {
        type: ControlType.Number,
        title: "Pause",
        min: 0.2,
        max: 10,
        step: 0.1,
        unit: "s",
        defaultValue: 1.5,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    reserve: {
        type: ControlType.Boolean,
        title: "Reserve Width",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        hidden: (props) => !props.reserve,
    },
    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        controls: {
            visible: {
                type: ControlType.Boolean,
                title: "Visible",
                enabledTitle: "Show",
                disabledTitle: "Hide",
                defaultValue: true,
            },
            character: {
                type: ControlType.String,
                title: "Character",
                defaultValue: "|",
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "#7C5CFF",
            },
            blink: {
                type: ControlType.Boolean,
                title: "Blink",
                enabledTitle: "Yes",
                disabledTitle: "No",
                defaultValue: true,
            },
        },
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 40,
            variant: "Semibold",
            lineHeight: "1.2em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#111111",
    },
    typedColor: {
        type: ControlType.Color,
        title: "Typed Text",
        defaultValue: "#7C5CFF",
        description: "Created by [Joviseo](https://joviseo.vercel.app)",
    },
})
