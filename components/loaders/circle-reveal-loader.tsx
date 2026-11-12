// Circle Reveal Loader — Goodmotion
// Website: https://goodmotion.vercel.app/

import React, { useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
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

interface RippleRevealWaveProps {
    color1?: string
    color2?: string
    color3?: string
    duration?: number
    staggerOverlap?: number
    ease?: string
    previewInCanvas?: boolean
    style?: React.CSSProperties
    className?: string
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export function RippleRevealWave(props: RippleRevealWaveProps) {
    const {
        color1 = "#F5C225",
        color2 = "#F05C15",
        color3 = "#CE2518",
        duration = 0.85,
        staggerOverlap = 0.58,
        ease = "power3.inOut",
        previewInCanvas = false,
        style,
        className,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [isComplete, setIsComplete] = useState(false)
    const [mounted, setMounted] = useState(false)

    const panelRef = useRef<HTMLDivElement>(null)
    const layer1Ref = useRef<HTMLDivElement>(null)
    const layer2Ref = useRef<HTMLDivElement>(null)
    const layer3Ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Reset completion status when toggling preview in Framer Canvas
    useEffect(() => {
        if (isCanvas && previewInCanvas) {
            setIsComplete(false)
        }
    }, [isCanvas, previewInCanvas])

    useEffect(() => {
        if (!mounted) return
        if (isCanvas && !previewInCanvas) return

        // Respect system accessibility: reduced motion
        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (prefersReducedMotion) {
            setIsComplete(true)
            return
        }

        const panel = panelRef.current
        const l1 = layer1Ref.current
        const l2 = layer2Ref.current
        const l3 = layer3Ref.current

        if (!panel || !l1 || !l2 || !l3) return

        const w = window.innerWidth
        const h = window.innerHeight
        const maxRadius = Math.ceil(Math.hypot(w, h)) * 1.1

        gsap.set(l1, {
            clipPath: `circle(${maxRadius}px at 50% 0px)`,
            WebkitClipPath: `circle(${maxRadius}px at 50% 0px)`,
        })

        gsap.set([l2, l3], {
            clipPath: "circle(0px at 50% 0px)",
            WebkitClipPath: "circle(0px at 50% 0px)",
        })

        const initialMask =
            "radial-gradient(circle at 50% 0px, transparent 0px, #000 1px)"
        panel.style.maskImage = initialMask
        panel.style.webkitMaskImage = initialMask

        const tl = gsap.timeline({
            onComplete: () => {
                setIsComplete(true)
            },
        })

        tl.to(
            l2,
            {
                clipPath: `circle(${maxRadius}px at 50% 0px)`,
                WebkitClipPath: `circle(${maxRadius}px at 50% 0px)`,
                duration,
                ease,
            },
            0.05
        )

        tl.to(
            l3,
            {
                clipPath: `circle(${maxRadius}px at 50% 0px)`,
                WebkitClipPath: `circle(${maxRadius}px at 50% 0px)`,
                duration,
                ease,
            },
            `-=${staggerOverlap}`
        )

        const holeObj = { value: 0 }
        tl.to(
            holeObj,
            {
                value: maxRadius,
                duration,
                ease,
                onUpdate: () => {
                    const maskStr = `radial-gradient(circle at 50% 0px, transparent ${holeObj.value}px, #000 ${holeObj.value + 1}px)`
                    panel.style.maskImage = maskStr
                    panel.style.webkitMaskImage = maskStr
                },
            },
            `-=${staggerOverlap}`
        )

        return () => {
            tl.kill()
        }
    }, [
        mounted,
        isCanvas,
        previewInCanvas,
        color1,
        color2,
        color3,
        duration,
        staggerOverlap,
        ease,
    ])

    const overlayContent =
        mounted && (!isCanvas || previewInCanvas) && !isComplete ? (
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 999999,
                    pointerEvents: "none",
                    backgroundColor: "transparent",
                    overflow: "hidden",
                }}
            >
                <div
                    ref={panelRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        willChange: "mask-image, -webkit-mask-image",
                    }}
                >
                    <div
                        ref={layer1Ref}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: color1,
                            willChange: "clip-path, -webkit-clip-path",
                        }}
                    />
                    <div
                        ref={layer2Ref}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: color2,
                            clipPath: "circle(0px at 50% 0px)",
                            WebkitClipPath: "circle(0px at 50% 0px)",
                            willChange: "clip-path, -webkit-clip-path",
                        }}
                    />
                    <div
                        ref={layer3Ref}
                        style={{
                            position: "absolute",
                            inset: 0,
                            backgroundColor: color3,
                            clipPath: "circle(0px at 50% 0px)",
                            WebkitClipPath: "circle(0px at 50% 0px)",
                            willChange: "clip-path, -webkit-clip-path",
                        }}
                    />
                </div>
            </div>
        ) : null

    return (
        <div
            className={className}
            style={{
                position: "relative",
                width: 100,
                height: 100,
                ...style,
            }}
        >
            {isCanvas && (
                <div
                    style={{
                        width: 100,
                        height: 100,
                        backgroundColor: "#111113",
                        border: "1px dashed rgba(255, 255, 255, 0.25)",
                        borderRadius: 14,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 8,
                        boxSizing: "border-box",
                        textAlign: "center",
                        userSelect: "none",
                        cursor: "default",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`,
                            marginBottom: 6,
                            flexShrink: 0,
                        }}
                    />
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            lineHeight: 1.15,
                            fontFamily: "Inter, sans-serif",
                            letterSpacing: "-0.2px",
                        }}
                    >
                        Ripple Reveal
                    </span>
                    <span
                        style={{
                            fontSize: 7.5,
                            color: "rgba(255, 255, 255, 0.5)",
                            lineHeight: 1.1,
                            marginTop: 3,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        Set Position: Absolute
                    </span>
                </div>
            )}

            {mounted && typeof document !== "undefined" && overlayContent
                ? createPortal(overlayContent, document.body)
                : null}
        </div>
    )
}

RippleRevealWave.displayName = "Ripple Reveal Wave — Goodmotion"

export default RippleRevealWave

addPropertyControls(RippleRevealWave, {
    previewInCanvas: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        description:
            "Toggle to preview the ripple transition directly on the Framer canvas.",
    },
    color1: {
        type: ControlType.Color,
        title: "Color 1 (Base)",
        defaultValue: "#F5C225",
    },
    color2: {
        type: ControlType.Color,
        title: "Color 2 (Mid)",
        defaultValue: "#F05C15",
    },
    color3: {
        type: ControlType.Color,
        title: "Color 3 (Top)",
        defaultValue: "#CE2518",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration (s)",
        defaultValue: 0.85,
        min: 0.4,
        max: 2.5,
        step: 0.05,
        unit: "s",
        description: "Expansion duration of each concentric wave.",
    },
    staggerOverlap: {
        type: ControlType.Number,
        title: "Overlap (s)",
        defaultValue: 0.58,
        min: 0.2,
        max: 1.5,
        step: 0.02,
        unit: "s",
        description:
            "Timing offset between successive color layers and hole cutout.",
    },
    ease: {
        type: ControlType.Enum,
        title: "Easing",
        defaultValue: "power3.inOut",
        options: ["power3.inOut", "power2.inOut", "expo.out", "circ.out"],
        optionTitles: ["Power3 InOut", "Power2 InOut", "Expo Out", "Circ Out"],
    },
})
