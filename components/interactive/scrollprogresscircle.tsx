// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useState } from "react"

export default function ScrollProgressCircle({
    size = 200,
    strokeColor = "black",
    baseColor = "red",
    remainingColor = "blue",
    strokeWidth = 15,
    useSectionScroll = false,
    startSection = "#start",
    endSection = "#end",
}) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            if (useSectionScroll) {
                const startElem = document.querySelector(startSection)
                const endElem = document.querySelector(endSection)
                if (startElem && endElem) {
                    const startPos =
                        startElem.getBoundingClientRect().top + window.scrollY
                    const endPos =
                        endElem.getBoundingClientRect().top + window.scrollY
                    const scrollTop = window.scrollY
                    const sectionHeight = endPos - startPos
                    const clampedProgress =
                        Math.max(
                            0,
                            Math.min(1, (scrollTop - startPos) / sectionHeight)
                        ) * 100
                    setProgress(clampedProgress)
                }
            } else {
                const scrollTop = window.scrollY
                const docHeight =
                    document.documentElement.scrollHeight - window.innerHeight
                const scrollProgress =
                    docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
                setProgress(scrollProgress)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [useSectionScroll, startSection, endSection])

    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Base Circle */}
            <circle cx={size / 2} cy={size / 2} r={radius} fill={baseColor} />

            {/* Remaining Progress Path */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={remainingColor}
                strokeWidth={strokeWidth}
                fill="none"
            />

            {/* Progress Path */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </svg>
    )
}

addPropertyControls(ScrollProgressCircle, {
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 10,
        max: 500,
        step: 1,
        defaultValue: 50,
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Fill",
    },
    baseColor: {
        type: ControlType.Color,
        title: "Base",
    },
    remainingColor: {
        type: ControlType.Color,
        title: "Remaining",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 10,
    },
    useSectionScroll: {
        type: ControlType.Boolean,
        title: "Use #Section",
        defaultValue: false,
    },
    startSection: {
        type: ControlType.String,
        title: "#Start Section",
        defaultValue: "#startscroll",
    },
    endSection: {
        type: ControlType.String,
        title: "#End Section",
        defaultValue: "#endscroll",
    },
})
