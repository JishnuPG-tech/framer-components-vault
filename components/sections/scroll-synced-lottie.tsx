// Get Started: https://www.framer.com/developers

import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useScroll, useMotionValue, animate } from "framer-motion"
import type { AnimationItem } from "lottie-web"

const SOURCE_TYPES = {
    URL: "URL",
    UPLOAD: "Upload",
} as const
const DEFAULT_LOTTIE_SRC = "https://misc.framerstatic.com/lottie/logo.json"
const CONTAINER_STYLE = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
}
const CANVAS_STYLE = {
    width: "100%",
    height: "100%",
}

const clamp = (min: number, max: number, v: number) =>
    Math.max(min, Math.min(max, v))

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 350
 */
export default function ScrollSyncedLottie(props) {
    const {
        sourceType,
        jsonUrl,
        jsonFile,
        offset = ["end end", "start start"],
        progressTransition,
    } = props

    const lottieData = sourceType === "URL" ? jsonUrl : jsonFile

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLDivElement | null>(null)
    const animationRef = useRef<AnimationItem | null>(null)
    const isReadyRef = useRef<boolean>(false)
    const lastProgressRef = useRef<number>(0)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: offset as ["end end", "start start"],
    })

    const smoothedProgress = useMotionValue(0)

    const goToNextFrame = () => {
        const anim = animationRef.current
        if (!anim) return
        const total = anim.totalFrames || 0
        anim.goToAndStop(
            clamp(0, total - 1, lastProgressRef.current * total),
            true
        )
    }

    useEffect(() => {
        let currentAnimation: any | null = null
        const unsub = scrollYProgress.on("change", (next) => {
            currentAnimation?.stop()
            currentAnimation = animate(
                smoothedProgress,
                next,
                progressTransition
            )
        })
        return () => {
            unsub()
            currentAnimation?.stop()
        }
    }, [scrollYProgress, progressTransition, smoothedProgress])

    useEffect(() => {
        const unsub = smoothedProgress.on("change", (v: number) => {
            lastProgressRef.current = clamp(0, 1, v)
            if (isReadyRef.current) {
                goToNextFrame()
            }
        })
        return () => unsub()
    }, [smoothedProgress])

    useEffect(() => {
        let currentAnimation: AnimationPlaybackControlsWithThen | null = null
        const unsub = scrollYProgress.on("change", (next) => {
            currentAnimation?.stop()
            currentAnimation = animate(
                smoothedProgress,
                next,
                progressTransition
            )
        })
        return () => {
            unsub()
            currentAnimation?.stop()
        }
    }, [scrollYProgress, progressTransition, smoothedProgress])

    useEffect(() => {
        const unsub = smoothedProgress.on("change", (v: number) => {
            lastProgressRef.current = clamp(0, 1, v)
            if (isReadyRef.current) {
                goToNextFrame()
            }
        })
        return () => unsub()
    }, [smoothedProgress])

    useEffect(() => {
        if (!canvasRef.current) return
        if (animationRef.current) {
            try {
                animationRef.current.destroy()
            } catch {}
            animationRef.current = null
        }
        if (!lottieData) return
        isReadyRef.current = false

        let isCancelled = false
        let anim: AnimationItem | null = null
        let onDOMLoaded: (() => void) | null = null

        ;(async () => {
            try {
                const { default: lottie } = await import("lottie-web")
                if (isCancelled || !canvasRef.current) return

                anim = lottie.loadAnimation({
                    container: canvasRef.current,
                    renderer: "svg",
                    loop: false,
                    autoplay: false,
                    rendererSettings: {
                        preserveAspectRatio: "xMidYMid slice",
                    },
                    path: lottieData,
                })

                animationRef.current = anim

                onDOMLoaded = () => {
                    if (isCancelled) return
                    isReadyRef.current = true
                    goToNextFrame()
                }

                anim.addEventListener("DOMLoaded", onDOMLoaded)
            } catch {}
        })()

        return () => {
            isCancelled = true
            if (anim && onDOMLoaded) {
                try {
                    anim.removeEventListener("DOMLoaded", onDOMLoaded)
                } catch {}
            }
            try {
                anim?.destroy()
            } catch {}
            animationRef.current = null
            isReadyRef.current = false
        }
    }, [lottieData])

    return (
        <div ref={containerRef} style={CONTAINER_STYLE}>
            <div ref={canvasRef} style={CANVAS_STYLE} />
        </div>
    )
}

addPropertyControls(ScrollSyncedLottie, {
    sourceType: {
        type: ControlType.SegmentedEnum,
        title: "Source",
        options: [SOURCE_TYPES.URL, SOURCE_TYPES.UPLOAD],
        optionTitles: ["URL", "Upload"],
        defaultValue: SOURCE_TYPES.URL,
        description:
            "This component is made for JSON files. [Lean more here](https://lottiefiles.com/what-is-lottie)",
    },
    jsonUrl: {
        type: ControlType.String,
        title: "URL",
        hidden: (p) => p.sourceType !== SOURCE_TYPES.URL,
        defaultValue: DEFAULT_LOTTIE_SRC,
    },
    jsonFile: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["json"],
        hidden: (p) => p.sourceType !== SOURCE_TYPES.UPLOAD,
    },
    transition: {
        type: ControlType.Transition,
        defaultValue: {
            type: "spring",
            stiffness: 400,
            damping: 20,
            mass: 3,
        },
    },
    offset: {
        type: ControlType.Array,
        title: "Offset",
        propertyControl: { type: ControlType.String },
        defaultValue: ["start end", "end start"],
        maxCount: 2,
        description: `offset describes intersections, points where the target and container meet. [Lean more here](https://motion.dev/docs/react-use-scroll#offset)`,
    },
})
