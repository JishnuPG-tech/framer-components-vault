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


type Trigger = "hover" | "appear" | "both"

interface Props {
    text: string
    link: string
    newTab: boolean
    trigger: Trigger
    duration: number
    characters: string
    font: CSSProperties
    color: string
    hoverColor: string
    background: string
    hoverBackground: string
    radius: number
    paddingX: number
    paddingY: number
    borderWidth: number
    borderColor: string
    style?: CSSProperties
}

// 글자가 바뀌는 간격(ms). 매 프레임마다 바꾸면 너무 정신없어 보인다
const SHUFFLE_INTERVAL = 40

// 앞에서부터 revealed 글자까지는 원래 글자를, 나머지는 무작위 글자를 돌려준다
function scramble(text: string, revealed: number, characters: string) {
    let result = ""
    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (i < revealed || char === " " || !characters) {
            result += char
            continue
        }
        const random = characters[Math.floor(Math.random() * characters.length)]
        // 소문자 자리에는 소문자를 넣어야 글자 폭이 원래 글자와 비슷하게 유지된다
        result += char === char.toUpperCase() ? random : random.toLowerCase()
    }
    return result
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function TextScrambleHoverButton(props: Props) {
    const {
        text = "Get Started",
        link = "",
        newTab = false,
        trigger = "hover",
        duration = 0.6,
        characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*",
        font,
        color = "#FFFFFF",
        hoverColor = "#FFFFFF",
        background = "#111111",
        hoverBackground = "#7C5CFF",
        radius = 999,
        paddingX = 28,
        paddingY = 16,
        borderWidth = 0,
        borderColor = "#111111",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [display, setDisplay] = useState(text)
    const [hovered, setHovered] = useState(false)
    const frame = useRef(0)

    const play = () => {
        if (isStatic) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return

        cancelAnimationFrame(frame.current)
        const start = performance.now()
        let lastShuffle = 0
        const tick = (now: number) => {
            const progress = Math.min((now - start) / (duration * 1000), 1)
            if (progress === 1) {
                setDisplay(text)
                return
            }
            if (now - lastShuffle >= SHUFFLE_INTERVAL) {
                lastShuffle = now
                setDisplay(
                    scramble(
                        text,
                        Math.floor(progress * text.length),
                        characters
                    )
                )
            }
            frame.current = requestAnimationFrame(tick)
        }
        frame.current = requestAnimationFrame(tick)
    }

    useEffect(() => {
        setDisplay(text)
        if (trigger !== "hover") play()
        return () => cancelAnimationFrame(frame.current)
    }, [text, trigger])

    const onEnter = () => {
        setHovered(true)
        if (trigger !== "appear") play()
    }
    const onLeave = () => setHovered(false)

    const shared = {
        "aria-label": text,
        onPointerEnter: onEnter,
        onPointerLeave: onLeave,
        onFocus: onEnter,
        onBlur: onLeave,
        style: {
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1,
            ...font,
            ...style,
            position: "relative",
            display: "inline-grid",
            placeItems: "center",
            boxSizing: "border-box",
            margin: 0,
            padding: `${paddingY}px ${paddingX}px`,
            borderRadius: radius,
            border: borderWidth
                ? `${borderWidth}px solid ${borderColor}`
                : "none",
            background: hovered ? hoverBackground : background,
            color: hovered ? hoverColor : color,
            textDecoration: "none",
            whiteSpace: "nowrap",
            cursor: "pointer",
            transition: "background 0.2s ease, color 0.2s ease",
        } as CSSProperties,
    }

    // 보이지 않는 원래 글자가 크기를 잡고 섞이는 글자는 그 위에 겹쳐 그리므로, 버튼 폭이 흔들리지 않는다
    const content = (
        <>
            <span style={{ visibility: "hidden" }}>{text}</span>
            <span
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {display}
            </span>
        </>
    )

    return link ? (
        <a
            href={link}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            {...shared}
        >
            {content}
        </a>
    ) : (
        <button type="button" {...shared}>
            {content}
        </button>
    )
}

addPropertyControls(TextScrambleHoverButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Get Started",
    },
    link: {
        type: ControlType.Link,
        title: "Link",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: false,
        hidden: (props) => !props.link,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["hover", "appear", "both"],
        optionTitles: ["Hover", "Appear", "Both"],
        defaultValue: "hover",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
        defaultValue: 0.6,
    },
    characters: {
        type: ControlType.String,
        title: "Characters",
        defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 16,
            variant: "Medium",
            lineHeight: "1em",
        },
    },
    color: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    hoverColor: {
        type: ControlType.Color,
        title: "Hover Text",
        defaultValue: "#FFFFFF",
    },
    background: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "#111111",
    },
    hoverBackground: {
        type: ControlType.Color,
        title: "Hover Fill",
        defaultValue: "#7C5CFF",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 999,
        step: 1,
        defaultValue: 999,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 28,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 0,
        description: "Created by [Joviseo](https://joviseo.vercel.app)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#111111",
        hidden: (props) => !props.borderWidth,
    },
})
