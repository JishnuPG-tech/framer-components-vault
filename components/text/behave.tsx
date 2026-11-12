import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Props = {
    sentence: string
    behaveText: string

    font: React.CSSProperties
    fontSize: number
    letterSpacing: number
    lineHeight: number
    textColor: string
    behaveColor: string

    strength: number
    radius: number
    damping: number
    rotation: number

    clipOverflow: boolean
    alignment: "left" | "center" | "right"
}

export default function Behave(props: Props) {
    const isStatic = useIsStaticRenderer()
    const {
        sentence = "Design should {actor}.",
        behaveText = "misbehave",

        font = {
            fontFamily: "Inter",
            fontWeight: 500,
        },

        fontSize = 74,
        letterSpacing = -0.055,
        lineHeight = 0.92,
        textColor = "#F3F3F3",
        behaveColor = "#F3F3F3",

        strength = 14,
        radius = 250,
        damping = 0.075,
        rotation = 3.2,

        clipOverflow = false,
        alignment = "left",
    } = props

    // REFS
    const rootRef = React.useRef<HTMLDivElement>(null)
    const behaveRef = React.useRef<HTMLSpanElement>(null)

    const pointerTarget = React.useRef({
        x: 0,
        y: 0,
    })

    const pointerCurrent = React.useRef({
        x: 0,
        y: 0,
    })

    const frameRef = React.useRef<number | null>(null)

    const lastPointerRef = React.useRef({
        x: 0,
        y: 0,
        hasPointer: false,
    })

    const motionPropsRef = React.useRef({
        strength,
        radius,
        damping,
        rotation,
    })

    motionPropsRef.current = {
        strength,
        radius,
        damping,
        rotation,
    }

    const touchActive = React.useRef(false)

    // ANIMATION
    const animate = () => {
        if (isStatic) {
            frameRef.current = null
            return
        }

        const { strength, damping, rotation } = motionPropsRef.current

        const d = Math.max(0.01, Math.min(1, damping))

        const dx = pointerTarget.current.x - pointerCurrent.current.x
        const dy = pointerTarget.current.y - pointerCurrent.current.y

        pointerCurrent.current.x += dx * d
        pointerCurrent.current.y += dy * d

        const x = pointerCurrent.current.x
        const y = pointerCurrent.current.y

        if (behaveRef.current) {
            behaveRef.current.style.transform = `
            translate(
                ${-x * strength}px,
                ${-y * strength}px
            )
            rotate(${x * -rotation + y * rotation * 0.44}deg)
        `
        }

        const settled = Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001

        if (settled) {
            pointerCurrent.current.x = pointerTarget.current.x
            pointerCurrent.current.y = pointerTarget.current.y

            frameRef.current = null
            return
        }

        frameRef.current = requestAnimationFrame(animate)
    }

    const startAnimation = () => {
        if (isStatic) return
        if (frameRef.current !== null) return

        frameRef.current = requestAnimationFrame(animate)
    }

    // POINTER UPDATE
    const updatePointer = (clientX: number, clientY: number) => {
        if (!rootRef.current) return

        const { radius } = motionPropsRef.current

        const rect = rootRef.current.getBoundingClientRect()

        const nx = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1

        const ny = ((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1

        // Distance from pointer to this Behave instance
        const ox = Math.max(rect.left - clientX, 0, clientX - rect.right)
        const oy = Math.max(rect.top - clientY, 0, clientY - rect.bottom)
        const dist = Math.hypot(ox, oy)

        // Across radius
        const safeRadius = Math.max(1, radius)
        const influence = Math.max(0, 1 - dist / radius)

        pointerTarget.current.x = Math.max(-1, Math.min(1, nx)) * influence

        pointerTarget.current.y = Math.max(-1, Math.min(1, ny)) * influence

        startAnimation()
    }

    // MOUSE INPUT
    React.useEffect(() => {
        if (isStatic) return

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return

            lastPointerRef.current.x = e.clientX
            lastPointerRef.current.y = e.clientY
            lastPointerRef.current.hasPointer = true

            updatePointer(e.clientX, e.clientY)
        }

        window.addEventListener("pointermove", handlePointerMove)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
        }
    }, [isStatic])

    // SCROLL INPUT
    React.useEffect(() => {
        if (isStatic) return

        const handleScroll = () => {
            if (!lastPointerRef.current.hasPointer) return

            updatePointer(lastPointerRef.current.x, lastPointerRef.current.y)
        }

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        })

        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [isStatic])

    // ANIMATION CLEANUP
    React.useEffect(() => {
        if (isStatic && frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }

        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [isStatic])

    // RENDER

    const hasActor = sentence.includes("{actor}")
    const parts = hasActor ? sentence.split("{actor}") : [sentence + " ", ""]

    return (
        <div
            ref={rootRef}
            onPointerDown={(e) => {
                if (isStatic) return
                if (e.pointerType === "mouse") return

                touchActive.current = true
                updatePointer(e.clientX, e.clientY)
            }}
            onPointerMove={(e) => {
                if (isStatic) return
                if (e.pointerType === "mouse") return
                if (!touchActive.current) return

                updatePointer(e.clientX, e.clientY)
            }}
            onPointerUp={(e) => {
                if (isStatic) return
                if (e.pointerType === "mouse") return

                touchActive.current = false
            }}
            onPointerCancel={(e) => {
                if (isStatic) return
                if (e.pointerType === "mouse") return

                touchActive.current = false
            }}
            style={{
                width: "100%",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                ...font,

                color: textColor,
                fontSize: fontSize,
                letterSpacing: `${letterSpacing}em`,
                lineHeight: lineHeight,
            }}
        >
            <div
                style={{
                    width: "100%",
                    textAlign: alignment,
                }}
            >
                {parts[0]}

                <span
                    style={{
                        display: "inline-block",
                        overflow: clipOverflow ? "hidden" : "visible",
                    }}
                >
                    <span
                        ref={behaveRef}
                        style={{
                            display: "inline-block",
                            color: behaveColor,
                            transform: "translate(0px, 0px) rotate(0deg)",
                            willChange: isStatic ? "auto" : "transform",
                        }}
                    >
                        {behaveText}
                    </span>
                </span>

                {parts[1]}
            </div>
        </div>
    )
}

// PROPERTY CONTROLS
addPropertyControls(Behave, {
    // CONTENT
    sentence: {
        type: ControlType.String,
        title: "Sentence",
        defaultValue: "Design should {actor}.",
        description: "Use {actor} where the Actor should appear.",
    },

    behaveText: {
        type: ControlType.String,
        title: "Actor",
        defaultValue: "misbehave",
    },

    // TYPE
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },

    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 74,
        min: 12,
        max: 160,
        step: 1,
    },

    letterSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: -0.055,
        min: -0.1,
        max: 0.2,
        step: 0.005,
    },

    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 0.92,
        min: 0.7,
        max: 2,
        step: 0.05,
    },

    alignment: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },

    // COLOR
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#F3F3F3",
    },

    behaveColor: {
        type: ControlType.Color,
        title: "Behave Color",
        defaultValue: "#F3F3F3",
    },

    // BEHAVIOR
    strength: {
        type: ControlType.Number,
        title: "Strength",
        defaultValue: 14,
        min: 0,
        max: 40,
        step: 1,
    },

    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 250,
        min: 100,
        max: 1600,
        step: 50,
    },

    damping: {
        type: ControlType.Number,
        title: "Response",
        defaultValue: 0.075,
        min: 0.01,
        max: 0.3,
        step: 0.005,
    },

    rotation: {
        type: ControlType.Number,
        title: "Rotation",
        defaultValue: 3.2,
        min: 0,
        max: 15,
        step: 0.1,
    },

    // LAYOUT
    clipOverflow: {
        type: ControlType.Boolean,
        title: "Clip",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
})
