// X-Ray Figma Cursor — Goodmotion
// Website: https://goodmotion.vercel.app/

import React, { useEffect, useRef, useState } from "react"
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


export interface XRayFigmaCursorProps {
    name?: string
    size?: number
    ease?: number
    hideDefaultCursor?: boolean
    style?: React.CSSProperties
    className?: string
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 150
 * @framerIntrinsicHeight 150
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function XRayFigmaCursor(props: XRayFigmaCursorProps) {
    const {
        name = "you",
        size = 22,
        ease = 0.34,
        hideDefaultCursor = true,
        style,
        className,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [mounted, setMounted] = useState(false)
    const [isDisabled, setIsDisabled] = useState(false)

    const cursorRef = useRef<HTMLDivElement>(null)

    // Inspect touch capability and prefers-reduced-motion accessibility
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hasFinePointer = window.matchMedia("(pointer: fine)").matches
            const prefersReduced = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
            const isCoarse = window.matchMedia("(pointer: coarse)").matches
            const hasTouch =
                typeof navigator !== "undefined" && navigator.maxTouchPoints > 0

            // Disable custom cursor on touch-only devices or when reduced motion is preferred
            const shouldDisable =
                prefersReduced || (!hasFinePointer && (isCoarse || hasTouch))
            setIsDisabled(shouldDisable)
        }
        setMounted(true)
    }, [])

    // Reference-counted style injection for global cursor hiding (Safe across Page Transitions)
    useEffect(() => {
        if (!mounted || isCanvas || isDisabled || !hideDefaultCursor) return

        const STYLE_ID = "goodmotion-xray-cursor-hide"
        const COUNT_ATTR = "data-goodmotion-cursor-count"

        const currentCount = parseInt(
            document.body.getAttribute(COUNT_ATTR) || "0",
            10
        )
        document.body.setAttribute(COUNT_ATTR, (currentCount + 1).toString())

        let styleEl = document.getElementById(
            STYLE_ID
        ) as HTMLStyleElement | null
        if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = STYLE_ID
            styleEl.textContent = `
                html, body, *, *::before, *::after {
                    cursor: none !important;
                }
                input, textarea, select, [contenteditable="true"], [contenteditable="true"] * {
                    cursor: auto !important;
                }
            `
            document.head.appendChild(styleEl)
        }

        return () => {
            const count =
                parseInt(document.body.getAttribute(COUNT_ATTR) || "1", 10) - 1
            if (count <= 0) {
                document.body.removeAttribute(COUNT_ATTR)
                const el = document.getElementById(STYLE_ID)
                if (el) el.remove()
            } else {
                document.body.setAttribute(COUNT_ATTR, count.toString())
            }
        }
    }, [mounted, isCanvas, isDisabled, hideDefaultCursor])

    // Smooth pointer tracking with battery hibernation and form evasion
    useEffect(() => {
        if (!mounted || isCanvas || isDisabled) return

        let mx = 0
        let my = 0
        let x = 0
        let y = 0
        let rafId = 0
        let isRunning = false
        let hasPositioned = false
        let isOverForm = false

        const updateVisibility = (visible: boolean) => {
            if (cursorRef.current) {
                cursorRef.current.style.opacity =
                    visible && !isOverForm ? "1" : "0"
            }
        }

        const loop = () => {
            const dx = mx - x
            const dy = my - y

            // Battery Hibernation: Stop the loop when cursor movement settles sub-pixel (< 0.1px)
            if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
                x = mx
                y = my
                if (cursorRef.current) {
                    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
                }
                isRunning = false
                return
            }

            x += dx * ease
            y += dy * ease

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
            }

            rafId = requestAnimationFrame(loop)
        }

        const wakeLoop = () => {
            if (!isRunning) {
                isRunning = true
                rafId = requestAnimationFrame(loop)
            }
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return

            mx = e.clientX
            my = e.clientY

            // Form Accessibility: Evade inputs to reveal native I-beam cursor
            const target = e.target as HTMLElement | null
            isOverForm = !!target?.closest?.(
                "input, textarea, select, [contenteditable='true']"
            )

            if (!hasPositioned) {
                // Snap instantly on first pointer move to eliminate jump from screen center
                x = mx
                y = my
                hasPositioned = true
                if (cursorRef.current) {
                    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
                }
                updateVisibility(true)
            } else {
                updateVisibility(true)
                wakeLoop()
            }
        }

        const handlePointerLeave = () => {
            updateVisibility(false)
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        document.addEventListener("mouseleave", handlePointerLeave)

        return () => {
            window.removeEventListener("pointermove", handlePointerMove)
            document.removeEventListener("mouseleave", handlePointerLeave)
            cancelAnimationFrame(rafId)
            isRunning = false
        }
    }, [mounted, isCanvas, isDisabled, ease])

    const shouldRenderCursor = mounted && !isCanvas && !isDisabled

    const cursorPortal = shouldRenderCursor ? (
        <div
            ref={cursorRef}
            aria-hidden="true"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 999999,
                pointerEvents: "none",
                mixBlendMode: "difference",
                opacity: 0,
                transition: "opacity 0.15s ease",
                willChange: "transform",
                display: "inline-flex",
                alignItems: "flex-start",
            }}
        >
            {/* Figma Pointer Arrow */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                style={{
                    display: "block",
                    flexShrink: 0,
                    overflow: "visible",
                }}
            >
                <path
                    d="M5 2l14 7-6 1.7L11 18z"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth={3.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>

            {/* Multiplayer Tag (~6px offset from arrow) */}
            {name && (
                <span
                    style={{
                        marginLeft: 1,
                        marginTop: Math.round(size * 0.55),
                        backgroundColor: "#FFFFFF",
                        color: "#000000",
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        padding: "4px 10px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        fontFamily:
                            "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                        letterSpacing: "-0.02em",
                        userSelect: "none",
                    }}
                >
                    {name}
                </span>
            )}
        </div>
    ) : null

    return (
        <div
            className={className}
            style={{
                position: "relative",
                // Live mode has 0x0 footprint to prevent disrupting layout flows
                width: isCanvas ? 150 : 0,
                height: isCanvas ? 150 : 0,
                overflow: isCanvas ? "hidden" : "visible",
                pointerEvents: isCanvas ? "auto" : "none",
                ...style,
            }}
        >
            {/* Framer Design Canvas Identifier Box (150x150px) */}
            {isCanvas && (
                <div
                    style={{
                        width: 150,
                        height: 150,
                        backgroundColor: "#111113",
                        border: "1px dashed rgba(255, 255, 255, 0.28)",
                        borderRadius: 16,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 12,
                        boxSizing: "border-box",
                        textAlign: "center",
                        userSelect: "none",
                        cursor: "default",
                        overflow: "hidden",
                        gap: 6,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 2,
                        }}
                    >
                        <svg
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                            style={{ overflow: "visible" }}
                        >
                            <path
                                d="M5 2l14 7-6 1.7L11 18z"
                                fill="#FFFFFF"
                                stroke="#FFFFFF"
                                strokeWidth={3.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    <span
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#FFFFFF",
                            lineHeight: 1.2,
                            fontFamily: "Inter, sans-serif",
                            letterSpacing: "-0.03em",
                        }}
                    >
                        X-Ray Figma Cursor
                    </span>

                    <span
                        style={{
                            fontSize: 9.5,
                            color: "rgba(255, 255, 255, 0.55)",
                            lineHeight: 1.25,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        Set Position: Absolute
                    </span>
                </div>
            )}

            {mounted && typeof document !== "undefined" && cursorPortal
                ? createPortal(cursorPortal, document.body)
                : null}
        </div>
    )
}

XRayFigmaCursor.displayName = "X-Ray Figma Cursor — Goodmotion"

addPropertyControls(XRayFigmaCursor, {
    name: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "you",
        placeholder: "Enter cursor label...",
    },
    size: {
        type: ControlType.Number,
        title: "Cursor Size",
        defaultValue: 22,
        min: 12,
        max: 48,
        step: 1,
        unit: "px",
    },
    ease: {
        type: ControlType.Number,
        title: "Smoothness",
        defaultValue: 0.34,
        min: 0.05,
        max: 1,
        step: 0.01,
        description: "1 = instant follow, lower = smoother lag.",
    },
    hideDefaultCursor: {
        type: ControlType.Boolean,
        title: "Hide Cursor",
        defaultValue: true,
    },
})
