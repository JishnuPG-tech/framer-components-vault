import * as React from "react"
import { useEffect, useState, useRef } from "react"
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


export default function EditorialLoader(props) {
    const {
        imageSrc,
        initialWidth,
        initialHeight,
        animationSpeed,
        stageDelay,
        easingType,
        borderRadius,
        previewPhase,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const containerRef = useRef<HTMLDivElement>(null)

    const [mode, setMode] = useState<null | "skip" | "animate">(null)
    const [stage, setStage] = useState(0)

    useEffect(() => {
        if (isCanvas || !containerRef.current) return

        const navEntries = performance.getEntriesByType("navigation")
        const navType =
            navEntries.length > 0
                ? (navEntries[0] as PerformanceNavigationTiming).type
                : "navigate"

        const isHardLoad =
            navType === "reload" ||
            navType === "back_forward" ||
            navType === "navigate"

        if (!isHardLoad) {
            setMode("skip")
            return
        }

        let offsetTop = 0
        let el: HTMLElement | null = containerRef.current
        while (el) {
            offsetTop += el.offsetTop
            el = el.offsetParent as HTMLElement | null
        }
        const offsetBottom = offsetTop + containerRef.current.offsetHeight
        const restoredScrollY = window.scrollY
        const viewportBottom = restoredScrollY + window.innerHeight
        const inViewport =
            offsetTop < viewportBottom && offsetBottom > restoredScrollY

        if (!inViewport) {
            setMode("skip")
            return
        }

        if (window.history.scrollRestoration) {
            window.history.scrollRestoration = "manual"
        }
        window.scrollTo(0, 0)
        setMode("animate")

        const originalOverflow = document.body.style.overflow
        const originalGutter = document.documentElement.style.scrollbarGutter

        document.body.style.overflow = "hidden"
        document.documentElement.style.scrollbarGutter = "stable"

        const phase1Timer = setTimeout(() => {
            setStage(1)
        }, 50)

        const phase2Timer = setTimeout(
            () => {
                setStage(2)
            },
            50 + animationSpeed * 1000 + stageDelay * 1000
        )

        const totalDuration =
            50 +
            animationSpeed * 1000 +
            stageDelay * 1000 +
            animationSpeed * 1000

        const unlockTimer = setTimeout(() => {
            document.body.style.overflow = originalOverflow || "unset"
            document.documentElement.style.scrollbarGutter =
                originalGutter || "auto"
        }, totalDuration)

        return () => {
            clearTimeout(phase1Timer)
            clearTimeout(phase2Timer)
            clearTimeout(unlockTimer)
            document.body.style.overflow = originalOverflow || "unset"
            document.documentElement.style.scrollbarGutter =
                originalGutter || "auto"
        }
    }, [stageDelay, animationSpeed, isCanvas])

    const easings = {
        editorial: [0.76, 0, 0.24, 1],
        anticipate: [0.65, 0, 0.35, 1],
        linear: [0, 0, 1, 1],
    }

    const selectedEase = easings[easingType] || easings.editorial

    // Canvas preview: show whichever phase the user picked
    if (isCanvas) {
        const previewSize =
            previewPhase === "phase2"
                ? { width: `${initialWidth}px`, height: `${initialHeight}px` }
                : { width: "100%", height: "100%" }

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    background: "transparent",
                }}
            >
                <div
                    style={{
                        ...previewSize,
                        overflow: "hidden",
                        borderRadius: `${borderRadius}px`,
                        backgroundImage: `url(${imageSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            </div>
        )
    }

    // Still measuring
    if (mode === null) {
        return (
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        )
    }

    // Skipped — show fully expanded
    if (mode === "skip") {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "visible",
                    background: "transparent",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        borderRadius: `${borderRadius}px`,
                        backgroundImage: `url(${imageSrc})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            </div>
        )
    }

    const getSize = () => {
        if (stage === 0) return { width: "0px", height: "0px" }
        if (stage === 1)
            return { width: `${initialWidth}px`, height: `${initialHeight}px` }
        return { width: "100%", height: "100%" }
    }

    const { width, height } = getSize()

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "visible",
                background: "transparent",
            }}
        >
            <motion.div
                style={{
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: `${borderRadius}px`,
                    backgroundImage: `url(${imageSrc})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
                animate={{ width, height }}
                transition={{
                    duration: animationSpeed,
                    ease: selectedEase,
                }}
            />
        </div>
    )
}

addPropertyControls(EditorialLoader, {
    imageSrc: {
        type: ControlType.Image,
        title: "Hero Image",
    },
    previewPhase: {
        type: ControlType.Enum,
        title: "Preview Phase",
        defaultValue: "phase3",
        options: ["phase2", "phase3"],
        optionTitles: ["Phase 2 (thumbnail)", "Phase 3 (full)"],
        displaySegmentedControl: true,
    },
    initialWidth: {
        type: ControlType.Number,
        title: "Phase 2 Width",
        defaultValue: 200,
        min: 50,
        max: 2000,
        hidden: (props) => props.previewPhase !== "phase2",
    },
    initialHeight: {
        type: ControlType.Number,
        title: "Phase 2 Height",
        defaultValue: 140,
        min: 50,
        max: 2000,
        hidden: (props) => props.previewPhase !== "phase2",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 1.4,
        min: 0.2,
        max: 5,
        step: 0.1,
    },
    stageDelay: {
        type: ControlType.Number,
        title: "Hold Delay (s)",
        defaultValue: 0.6,
        min: 0,
        max: 3,
        step: 0.1,
    },
    easingType: {
        type: ControlType.Enum,
        title: "Ease Profile",
        defaultValue: "editorial",
        options: ["editorial", "anticipate", "linear"],
        optionTitles: ["Luxury Custom", "Balanced", "Linear"],
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corners (px)",
        defaultValue: 0,
        min: 0,
        max: 100,
    },
})
