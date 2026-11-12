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

import { motion } from "framer-motion"

type Props = {
    front: ComponentInstance
    back: ComponentInstance
    flipOn: "hover" | "click"
    axis: "Y" | "X"
    transition: any
    inverted: boolean
}

export default function Flip3D(props: Props) {
    const { front, back, flipOn, axis, transition, inverted } = props
    const [flipped, setFlipped] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ width: 0, height: 0 })

    // Measure the front component's size for auto sizing
    React.useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            setSize({ width: rect.width, height: rect.height })
        }
    }, [front])

    const handleClick = () => {
        if (flipOn === "click") setFlipped(!flipped)
    }

    const handleMouseEnter = () => {
        if (flipOn === "hover") setFlipped(true)
    }

    const handleMouseLeave = () => {
        if (flipOn === "hover") setFlipped(false)
    }

    // Compute rotation with inversion
    const rotateFront = inverted ? (flipped ? -180 : 0) : flipped ? 180 : 0
    const rotateBack = inverted ? (flipped ? -360 : -180) : flipped ? 360 : 180

    return (
        <div
            ref={containerRef}
            style={{
                width: "auto",
                height: "auto",
                perspective: 1200,
                display: "inline-block",
                position: "relative",
            }}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                style={{
                    width: "auto",
                    height: "auto",
                    position: "relative",
                    transformStyle: "preserve-3d",
                }}
            >
                {/* Front */}
                <motion.div
                    animate={{
                        rotateY: axis === "Y" ? rotateFront : 0,
                        rotateX: axis === "X" ? rotateFront : 0,
                    }}
                    transition={transition}
                    style={{
                        width: "auto",
                        height: "auto",
                        backfaceVisibility: "hidden",
                        transformOrigin: "center center",
                    }}
                >
                    {front}
                </motion.div>

                {/* Back */}
                <motion.div
                    initial={{
                        rotateY: axis === "Y" ? (inverted ? -180 : 180) : 0,
                        rotateX: axis === "X" ? (inverted ? -180 : 180) : 0,
                    }}
                    animate={{
                        rotateY: axis === "Y" ? rotateBack : 0,
                        rotateX: axis === "X" ? rotateBack : 0,
                    }}
                    transition={transition}
                    style={{
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transformOrigin: "center center",
                    }}
                >
                    {back}
                </motion.div>
            </motion.div>
        </div>
    )
}

addPropertyControls(Flip3D, {
    front: { type: ControlType.ComponentInstance, title: "Front" },
    back: { type: ControlType.ComponentInstance, title: "Back" },
    flipOn: {
        type: ControlType.Enum,
        options: ["hover", "click"],
        optionTitles: ["Hover", "Click"],
        defaultValue: "hover",
    },
    axis: {
        type: ControlType.Enum,
        options: ["Y", "X"],
        optionTitles: ["Y‑Axis", "X‑Axis"],
        defaultValue: "Y",
    },
    inverted: {
        type: ControlType.Boolean,
        title: "Invert Flip",
        defaultValue: false,
    },
    transition: {
        type: ControlType.Transition,
        defaultValue: { type: "tween", duration: 0.8, ease: "easeOut" },
    },
})
