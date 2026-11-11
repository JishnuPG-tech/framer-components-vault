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

import {
    animate,
    useInView,
    useMotionValue,
    type AnimationPlaybackControls,
} from "framer-motion"

// User request: Integrate the provided Etheral Shadow React component as a Framer code component in /components/ui with TypeScript and framer-motion, preserving API where feasible and exposing editable controls.

interface ResponsiveImage {
    src: string
    alt?: string
    srcSet?: string
}

interface AnimationConfig {
    preview?: boolean
    scale: number
    speed: number
    duration: number
}

interface NoiseConfig {
    opacity: number
    scale: number
}

interface MyComponentProps {
    type?: "preset" | "custom"
    presetIndex?: number
    customImage?: ResponsiveImage
    sizing?: "fill" | "stretch"
    color?: string
    color1?: string
    color2?: string
    color3?: string
    shadowOpacity?: number
    animation?: AnimationConfig
    noise?: NoiseConfig
    className?: string
    style?: React.CSSProperties
}

function mapRange(
    value: number,
    fromLow: number,
    fromHigh: number,
    toLow: number,
    toHigh: number
): number {
    if (fromLow === fromHigh) return toLow
    const percentage = (value - fromLow) / (fromHigh - fromLow)
    return toLow + percentage * (toHigh - toLow)
}

function useInstanceId(): string {
    const id = React.useId()
    return `shadowoverlay-${id.replace(/:/g, "")}`
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function EtheralShadow(props: MyComponentProps) {
    const {
        type = "preset",
        presetIndex = 0,
        customImage = {
            src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg",
            alt: "Gradient 1 - Blue",
        },
        sizing = "fill",
        color = "rgba(128, 128, 128, 1)",
        color1,
        color2 = "#7C3AED",
        color3 = "#06B6D4",
        shadowOpacity = 1,
        animation = { preview: false, scale: 50, speed: 50, duration: 6 },
        noise = { opacity: 0.25, scale: 1 },
        style,
        className,
    } = props

    const id = useInstanceId()
    const rootRef = React.useRef<HTMLDivElement>(null)
    const isInView = useInView(rootRef, { margin: "-10%" })
    const isStaticRenderer = useIsStaticRenderer()
    const feColorMatrixRef = React.useRef<SVGFEColorMatrixElement>(null)
    const hueRotateMotionValue = useMotionValue(180)
    const hueRotateAnimation = React.useRef<AnimationPlaybackControls | null>(null)

    const animationEnabled = React.useMemo(
        () =>
            Boolean(animation) &&
            animation.scale > 0 &&
            !animation.preview &&
            isInView &&
            !isStaticRenderer,
        [animation, isInView, isStaticRenderer]
    )

    const displacementScale = React.useMemo(
        () => mapRange(animation.scale, 1, 100, 20, 100),
        [animation.scale]
    )
    const animationDuration = React.useMemo(() => {
        const baseDuration = Math.max(0.2, animation.duration || 6)
        const speedFactor = mapRange(animation.speed, 1, 100, 2.2, 0.35)
        return baseDuration * speedFactor
    }, [animation.duration, animation.speed])

    const resolvedColor1 = color1 ?? color ?? "rgba(128, 128, 128, 1)"
    const resolvedShadowOpacity = Math.max(0, Math.min(1, shadowOpacity))
    const layeredShadowBackground = React.useMemo(
        () =>
            `radial-gradient(circle at 20% 25%, ${resolvedColor1} 0%, transparent 60%), radial-gradient(circle at 80% 30%, ${color2} 0%, transparent 58%), radial-gradient(circle at 50% 80%, ${color3} 0%, transparent 62%), linear-gradient(130deg, ${resolvedColor1} 0%, ${color2} 50%, ${color3} 100%)`,
        [resolvedColor1, color2, color3]
    )

    React.useEffect(() => {
        if (!feColorMatrixRef.current || !animationEnabled) return

        if (hueRotateAnimation.current) hueRotateAnimation.current.stop()
        hueRotateMotionValue.set(0)

        hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
            duration: animationDuration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            onUpdate: (value) => {
                if (feColorMatrixRef.current) {
                    feColorMatrixRef.current.setAttribute("values", String(value))
                }
            },
        })

        return () => {
            if (hueRotateAnimation.current) hueRotateAnimation.current.stop()
        }
    }, [animationDuration, animationEnabled, hueRotateMotionValue])

    const maskImageUrl =
        type === "custom" && customImage?.src
            ? customImage.src
            : "https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png"

    return (
        <div
            ref={rootRef}
            className={className}
            aria-hidden
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "100%",
                ...style,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: -displacementScale,
                    filter: animationEnabled ? `url(#${id}) blur(4px)` : "none",
                }}
            >
                {animationEnabled && (
                    <svg style={{ position: "absolute", width: 0, height: 0 }}>
                        <defs>
                            <filter id={id}>
                                <feTurbulence
                                    result="undulation"
                                    numOctaves={2}
                                    baseFrequency={`${mapRange(animation.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                                    seed={presetIndex}
                                    type="turbulence"
                                />
                                <feColorMatrix
                                    ref={feColorMatrixRef}
                                    in="undulation"
                                    type="hueRotate"
                                    values="180"
                                />
                                <feColorMatrix
                                    in="dist"
                                    result="circulation"
                                    type="matrix"
                                    values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                                />
                                <feDisplacementMap
                                    in="SourceGraphic"
                                    in2="circulation"
                                    scale={displacementScale}
                                    result="dist"
                                />
                                <feDisplacementMap
                                    in="dist"
                                    in2="undulation"
                                    scale={displacementScale}
                                    result="output"
                                />
                            </filter>
                        </defs>
                    </svg>
                )}
                <div
                    style={{
                        backgroundImage: layeredShadowBackground,
                        maskImage: `url('${maskImageUrl}')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        width: "100%",
                        height: "100%",
                        opacity: resolvedShadowOpacity,
                    }}
                />
            </div>

            {noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            'url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")',
                        backgroundSize: `${Math.max(1, noise.scale * 200)}px`,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2,
                    }}
                />
            )}
        </div>
    )
}

addPropertyControls(EtheralShadow, {
    type: {
        type: ControlType.Enum,
        title: "Mask Type",
        options: ["preset", "custom"],
        optionTitles: ["Preset", "Custom"],
        defaultValue: "preset",
    },
    presetIndex: {
        type: ControlType.Number,
        title: "Seed",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    customImage: {
        type: ControlType.ResponsiveImage,
        title: "Custom Mask",
    },
    sizing: {
        type: ControlType.Enum,
        title: "Sizing",
        options: ["fill", "stretch"],
        optionTitles: ["Fill", "Stretch"],
        defaultValue: "fill",
    },
    color: {
        type: ControlType.Color,
        title: "Legacy",
        defaultValue: "rgba(128, 128, 128, 1)",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "rgba(128, 128, 128, 1)",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#7C3AED",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3",
        defaultValue: "#06B6D4",
    },
    shadowOpacity: {
        type: ControlType.Number,
        title: "Shadow Opacity",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 1,
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        defaultValue: { preview: false, scale: 50, speed: 50, duration: 6 },
        controls: {
            preview: {
                type: ControlType.Boolean,
                title: "Preview",
                defaultValue: false,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0,
                max: 100,
                step: 1,
                defaultValue: 50,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 1,
                max: 100,
                step: 1,
                defaultValue: 50,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 20,
                step: 0.1,
                defaultValue: 6,
            },
        },
    },
    noise: {
        type: ControlType.Object,
        title: "Noise",
        defaultValue: { opacity: 0.25, scale: 1 },
        controls: {
            opacity: {
                type: ControlType.Number,
                title: "Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 0.25,
            },
            scale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.1,
                max: 4,
                step: 0.1,
                defaultValue: 1,
            },
        },
    },
    className: {
        type: ControlType.String,
        title: "Class",
        defaultValue: "",
    },
})