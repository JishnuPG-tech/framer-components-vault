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

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export type Mode = "Start Trigger" | "Disappear"

type Props = {
    width?: number | string
    height?: number | string
    image?: any
    mode: Mode
    triggerId: string
    duration: number
    ease: string
    delay: number
    scaleStart: number
    radius: number
    objectFit: "cover" | "contain" | "fill" | "none" | "scale-down"
}

export default function ScrollClipImage(props: Props) {
    const {
        width = "100%",
        height = "100%",
        image,
        mode = "Start Trigger",

        triggerId = "#sec",

        duration = 0.8,
        ease = "power2.out",
        delay = 0,

        scaleStart = 1.0,

        radius = 16,
        objectFit = "cover",
    } = props

    const wrapRef = React.useRef<HTMLDivElement>(null)
    const imgRef = React.useRef<HTMLImageElement>(null)

    React.useLayoutEffect(() => {
        const el = imgRef.current
        if (!el) return

        const ctx = gsap.context(() => {
            gsap.set(el, {
                opacity: 1,
                background: "transparent",
                willChange: "clip-path, transform",
                scale: scaleStart ?? 1.0,
            })

            if (mode === "Start Trigger") {
                const normalized =
                    (triggerId || "").trim().length > 0
                        ? (triggerId || "").trim().startsWith("#")
                            ? (triggerId || "").trim()
                            : `#${(triggerId || "").trim()}`
                        : ""

                const triggerEl =
                    (normalized
                        ? (document.querySelector(
                              normalized
                          ) as HTMLElement | null)
                        : null) || (wrapRef.current as HTMLElement)

                gsap.fromTo(
                    el,
                    { clipPath: "inset(0 0 0% 0)" },
                    {
                        clipPath: "inset(0 0 100% 0)",
                        scale: 1.0,
                        ease: "none",
                        immediateRender: false,
                        scrollTrigger: {
                            trigger: triggerEl,
                            start: "top bottom",
                            end: "bottom bottom",
                            scrub: true,
                            invalidateOnRefresh: true,
                        },
                    }
                )
            } else {
                gsap.fromTo(
                    el,
                    { clipPath: "inset(0 0 0% 0)" },
                    {
                        clipPath: "inset(0 0 100% 0)",
                        scale: 1.0,
                        duration: Math.max(0, duration ?? 0.8),
                        ease: ease || "power2.out",
                        delay: Math.max(0, delay ?? 0),
                        immediateRender: false,
                    }
                )
            }
        }, wrapRef)

        return () => ctx.revert()
    }, [mode, triggerId, duration, ease, delay, scaleStart])

    const src = (image && (image.src || image)) || undefined

    return (
        <div
            ref={wrapRef}
            style={{
                width,
                height,
                position: "relative",
                overflow: "hidden",
                borderRadius: radius,
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {src ? (
                <img
                    ref={imgRef}
                    src={src}
                    alt="GSAP Reveal"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: objectFit,
                        display: "block",
                        background: "transparent",
                    }}
                />
            ) : (
                <Placeholder />
            )}
        </div>
    )
}

function Placeholder() {
    return (
        <div
            style={{
                color: "#999",
                fontSize: 14,
                textAlign: "center",
                padding: 16,
                lineHeight: 1.4,
                background: "transparent",
            }}
        >
            Upload an image in the right-side Properties panel.
            <br />
            Modes:
            <br />• Start Trigger — show first, clip from bottom→up while
            scrolling (scrub).
            <br />• Disappear — on mount, hide bottom→up with duration, ease &
            delay.
            <br />
            Scale: set initial value (default 1.0), tween to 1.0 automatically.
        </div>
    )
}

addPropertyControls(ScrollClipImage, {
    image: {
        type: ControlType.Image,
        title: "Upload image",
    },

    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Start Trigger", "Disappear"],
        optionTitles: ["Start Trigger", "Disappear"],
        defaultValue: "Start Trigger",
        description:
            "Choose how the component works (Start Trigger or Disappear).",
    },

    triggerId: {
        type: ControlType.String,
        title: "Section ID",
        placeholder: "#sectionId",
        defaultValue: "#sec",
        description:
            "Use the frame’s scroll section (#...) to define the start and end triggers.",
        hidden: (props: Props) => props.mode !== "Start Trigger",
    },

    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0,
        max: 10,
        step: 0.05,
        hidden: (props: Props) => props.mode !== "Disappear",
    },
    ease: {
        type: ControlType.Enum,
        title: "Ease",
        options: [
            "power1.inOut",
            "power1.out",
            "power2.out",
            "power3.out",
            "expo.out",
            "circ.out",
            "linear",
        ],
        optionTitles: [
            "power1.inOut",
            "power1.out",
            "power2.out",
            "power3.out",
            "expo.out",
            "circ.out",
            "linear",
        ],
        defaultValue: "power2.out",
        hidden: (props: Props) => props.mode !== "Disappear",
    },
    delay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 0.05,
        hidden: (props: Props) => props.mode !== "Disappear",
    },

    scaleStart: {
        type: ControlType.Number,
        title: "Scale (set)",
        defaultValue: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.01,
        displayStepper: true,
    },

    objectFit: {
        type: ControlType.Enum,
        title: "Image Fit",
        options: ["cover", "contain", "fill", "none", "scale-down"],
        optionTitles: ["cover", "contain", "fill", "none", "scale-down"],
        defaultValue: "cover",
    },
    radius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 16,
        min: 0,
        max: 64,
        unit: "px",
    },
})
