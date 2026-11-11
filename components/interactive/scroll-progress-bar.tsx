// ScrollProgressBar.tsx
// @framerSupportedLayoutWidth auto
// @framerSupportedLayoutHeight auto

import * as React from "react"
import { motion, useMotionValue } from "framer-motion"
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
    thickness: number
    color: string
    orientation: "horizontal" | "vertical"
    hPosition: "top" | "bottom"
    vPosition: "left" | "right"
}

export default function ScrollProgressBar({
    thickness,
    color,
    orientation,
    hPosition,
    vPosition,
}: Props) {
    const progress = useMotionValue(0)

    React.useEffect(() => {
        const update = () => {
            const doc = document.documentElement
            const body = document.body

            const scrollHeight = Math.max(
                body.scrollHeight,
                doc.scrollHeight,
                body.offsetHeight,
                doc.offsetHeight,
                body.clientHeight,
                doc.clientHeight
            )
            const viewport = doc.clientHeight
            const max = Math.max(scrollHeight - viewport, 1)
            const y = window.pageYOffset || doc.scrollTop || body.scrollTop || 0

            progress.set(Math.min(Math.max(y / max, 0), 1))
        }

        update()
        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)
        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [progress])

    const t = Math.max(thickness, 1)

    // Container style (fixed, full-page)
    const container: React.CSSProperties = {
        position: "fixed",
        zIndex: 9999,
        pointerEvents: "none",
    }
    let barStyle: React.CSSProperties

    if (orientation === "horizontal") {
        Object.assign(container, {
            left: 0,
            right: 0,
            height: t,
            top: hPosition === "top" ? 0 : undefined,
            bottom: hPosition === "bottom" ? 0 : undefined,
        })
        barStyle = {
            height: "100%",
            width: "100%",
            background: color,
            scaleX: progress,
            transformOrigin: "0% 50%",
            willChange: "transform",
        }
    } else {
        Object.assign(container, {
            top: 0,
            bottom: 0,
            width: t,
            left: vPosition === "left" ? 0 : undefined,
            right: vPosition === "right" ? 0 : undefined,
        })
        barStyle = {
            width: "100%",
            height: "100%",
            background: color,
            scaleY: progress,
            transformOrigin: "50% 0%",
            willChange: "transform",
        }
    }

    return (
        <div style={container}>
            <motion.div style={barStyle} />
        </div>
    )
}

addPropertyControls(ScrollProgressBar, {
    thickness: {
        type: ControlType.Number,
        title: "Thickness",
        defaultValue: 3,
        min: 1,
        max: 40,
        unit: "px",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#FF1212",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Orientation",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    hPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        hidden: (p: any) => p.orientation !== "horizontal",
    },
    vPosition: {
        type: ControlType.Enum,
        title: "Position",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "left",
        hidden: (p: any) => p.orientation !== "vertical",
    },
})
