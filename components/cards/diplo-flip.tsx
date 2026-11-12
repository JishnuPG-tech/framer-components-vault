// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, type Transition } from "framer-motion"
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
    type KeyboardEvent,
} from "react"

type FramerImage = {
    src: string
    srcSet?: string
    alt?: string
}

type Props = {
    frontImage?: FramerImage
    backImage?: FramerImage
    trigger: boolean
    transition: Transition
    borderRadius: string
    shadow: string
    perspective: number
    style?: CSSProperties
}

/** @framerSupportedLayoutWidth
 * @framerSupportedLayoutHeight
 */
export default function DiploFlip(props: Props) {
    const {
        frontImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Front",
        },
        backImage = {
            src: "https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg",
            alt: "Back",
        },
        trigger = false,
        transition = {
            type: "tween",
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
        },
        borderRadius = "16px",
        shadow = "0 12px 30px rgba(0,0,0,0.12)",
        perspective = 1000,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const ref = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(true)

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const el = ref.current
        if (!el) return

        if (typeof IntersectionObserver === "undefined") {
            startTransition(() => setInView(true))
            return
        }

        const obs = new IntersectionObserver(
            (entries) => {
                const next = entries[0]?.isIntersecting ?? true
                startTransition(() => setInView(next))
            },
            { root: null, rootMargin: "-10% 0px -10% 0px", threshold: 0.2 }
        )

        obs.observe(el)
        return () => obs.disconnect()
    }, [isStatic])

    const [flipped, setFlipped] = useState(false)

    const canAnimate = !isStatic && inView

    const handleToggle = useCallback(() => {
        startTransition(() => setFlipped((v) => !v))
    }, [])

    const handleShowBack = useCallback(() => {
        startTransition(() => setFlipped(true))
    }, [])

    const handleShowFront = useCallback(() => {
        startTransition(() => setFlipped(false))
    }, [])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (trigger) return
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                handleToggle()
            }
        },
        [handleToggle, trigger]
    )

    const interactiveHandlers = useMemo(() => {
        if (isStatic) return {}

        if (trigger) {
            return {
                onMouseEnter: handleShowBack,
                onMouseLeave: handleShowFront,
                onFocus: handleShowBack,
                onBlur: handleShowFront,
            }
        }

        return {
            onClick: handleToggle,
            onKeyDown: handleKeyDown,
        }
    }, [
        handleKeyDown,
        handleShowBack,
        handleShowFront,
        handleToggle,
        isStatic,
        trigger,
    ])

    const rootStyle: CSSProperties = useMemo(
        () => ({
            position: "relative",
            width: "100%",
            height: "100%",
            perspective: `${Math.max(1, perspective)}px`,
            borderRadius,
            boxShadow: shadow,
            outline: "none",
            ...style,
        }),
        [borderRadius, perspective, shadow, style]
    )

    const commonFaceStyle: CSSProperties = useMemo(
        () => ({
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            borderRadius,
            overflow: "hidden",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
        }),
        [borderRadius]
    )

    const imgStyle: CSSProperties = useMemo(
        () => ({
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
        }),
        []
    )

    const rotationY = canAnimate ? (flipped ? 180 : 0) : 0

    if (RenderTarget.current() === RenderTarget.thumbnail) return null

    return (
        <div
            ref={ref}
            style={rootStyle}
            tabIndex={0}
            role={!trigger ? "button" : "group"}
            aria-label={!trigger ? "Flip card" : "Flipping card"}
            {...interactiveHandlers}
        >
            <motion.div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    borderRadius,
                }}
                animate={canAnimate ? { rotateY: rotationY } : { rotateY: 0 }}
                transition={transition}
            >
                <div style={commonFaceStyle} aria-hidden={flipped}>
                    <img
                        src={frontImage.src}
                        srcSet={frontImage.srcSet}
                        alt={frontImage.alt ?? ""}
                        style={imgStyle}
                        draggable={false}
                    />
                </div>

                <div
                    style={{
                        ...commonFaceStyle,
                        transform: "rotateY(180deg)",
                    }}
                    aria-hidden={!flipped}
                >
                    <img
                        src={backImage.src}
                        srcSet={backImage.srcSet}
                        alt={backImage.alt ?? ""}
                        style={imgStyle}
                        draggable={false}
                    />
                </div>
            </motion.div>
        </div>
    )
}

addPropertyControls(DiploFlip, {
    frontImage: {
        type: ControlType.ResponsiveImage,
        title: "Front",
    },
    backImage: {
        type: ControlType.ResponsiveImage,
        title: "Back",
    },
    trigger: {
        type: ControlType.Boolean,
        title: "Trigger",
        defaultValue: false,
        disabledTitle: "Click",
        enabledTitle: "Hover",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: {
            type: "tween",
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
        },
    },
    perspective: {
        type: ControlType.Number,
        title: "Perspective",
        defaultValue: 1000,
        min: 200,
        max: 3000,
        step: 50,
        unit: "px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "16px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0 12px 30px rgba(0,0,0,0.12)",
    },
})
