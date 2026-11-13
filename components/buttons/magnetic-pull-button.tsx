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

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface SpringProps {
    stiffness: number
    damping: number
}

interface Props {
    text: string
    link: string
    newTab: boolean
    strength: number
    labelStrength: number
    range: number
    spring: Partial<SpringProps>
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

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function MagneticPullButton(props: Props) {
    const {
        text = "Hover me",
        link = "",
        newTab = false,
        strength = 0.4,
        labelStrength = 0.3,
        range = 60,
        font,
        color = "#FFFFFF",
        hoverColor = "#FFFFFF",
        background = "#111111",
        hoverBackground = "#7C5CFF",
        radius = 999,
        paddingX = 32,
        paddingY = 18,
        borderWidth = 0,
        borderColor = "#111111",
        style,
    } = props
    const spring: SpringProps = {
        stiffness: 150,
        damping: 15,
        ...props.spring,
    }

    const isStatic = useIsStaticRenderer()
    const wrapper = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const [inView, setInView] = useState(false)

    const targetX = useMotionValue(0)
    const targetY = useMotionValue(0)
    const x = useSpring(targetX, spring)
    const y = useSpring(targetY, spring)
    // 글자는 버튼보다 조금 더 움직여서 깊이감을 준다
    const labelX = useTransform(x, (value) => value * labelStrength)
    const labelY = useTransform(y, (value) => value * labelStrength)

    // 화면에 보이는 동안에만 포인터를 추적해서, 화면 밖 버튼이 불필요한 계산을 하지 않게 한다
    useEffect(() => {
        const element = wrapper.current
        if (isStatic || !element) return

        const observer = new IntersectionObserver(([entry]) =>
            setInView(entry.isIntersecting)
        )
        observer.observe(element)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !inView) return
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return

        const reset = () => {
            targetX.set(0)
            targetY.set(0)
        }
        const onMove = (event: PointerEvent) => {
            const element = wrapper.current
            if (!element || event.pointerType !== "mouse") return

            // wrapper는 움직이지 않으므로 버튼의 원래 자리를 기준으로 계산할 수 있다
            const rect = element.getBoundingClientRect()
            const inRange =
                event.clientX >= rect.left - range &&
                event.clientX <= rect.right + range &&
                event.clientY >= rect.top - range &&
                event.clientY <= rect.bottom + range
            if (!inRange) {
                reset()
                return
            }
            targetX.set(
                (event.clientX - (rect.left + rect.width / 2)) * strength
            )
            targetY.set(
                (event.clientY - (rect.top + rect.height / 2)) * strength
            )
        }

        window.addEventListener("pointermove", onMove)
        document.documentElement.addEventListener("pointerleave", reset)
        return () => {
            window.removeEventListener("pointermove", onMove)
            document.documentElement.removeEventListener("pointerleave", reset)
            reset()
        }
    }, [isStatic, inView, strength, range, targetX, targetY])

    const shared = {
        onPointerEnter: () => setHovered(true),
        onPointerLeave: () => setHovered(false),
        onFocus: () => setHovered(true),
        onBlur: () => setHovered(false),
        style: {
            x,
            y,
            fontFamily: "inherit",
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1,
            ...font,
            flex: "1 1 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
        },
    }

    const label = (
        <motion.span style={{ display: "block", x: labelX, y: labelY }}>
            {text}
        </motion.span>
    )

    return (
        <div ref={wrapper} style={{ ...style, display: "inline-flex" }}>
            {link ? (
                <motion.a
                    href={link}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    {...shared}
                >
                    {label}
                </motion.a>
            ) : (
                <motion.button type="button" {...shared}>
                    {label}
                </motion.button>
            )}
        </div>
    )
}

addPropertyControls(MagneticPullButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hover me",
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
    strength: {
        type: ControlType.Number,
        title: "Strength",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
    },
    labelStrength: {
        type: ControlType.Number,
        title: "Label Pull",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
    },
    range: {
        type: ControlType.Number,
        title: "Range",
        min: 0,
        max: 300,
        step: 5,
        unit: "px",
        defaultValue: 60,
    },
    spring: {
        type: ControlType.Object,
        title: "Spring",
        controls: {
            stiffness: {
                type: ControlType.Number,
                title: "Stiffness",
                min: 20,
                max: 600,
                step: 10,
                defaultValue: 150,
            },
            damping: {
                type: ControlType.Number,
                title: "Damping",
                min: 1,
                max: 60,
                step: 1,
                defaultValue: 15,
            },
        },
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
        defaultValue: 32,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 18,
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
