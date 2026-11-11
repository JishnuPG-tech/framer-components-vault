"use client"

// Googly Eyes Cursor — Goodmotion
// Website: https://goodmotion.vercel.app/
// Dependencies: npm i gsap @gsap/react

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

import gsap from "gsap"

interface GooglyEyesCursorProps {
    accentColor?: string
    hideDefaultCursor?: boolean
    style?: React.CSSProperties
    className?: string
}

/**
 * @framerDisableUnlink
 */
export default function GooglyEyesCursor({
    accentColor = "#E53935",
    hideDefaultCursor = true,
    style,
    className,
}: GooglyEyesCursorProps) {
    // Fixed layout dimensions and constraints
    const eyeWidth = 26
    const eyeHeight = 36
    const eyeSpacing = 4
    const borderWidth = 2
    const backgroundColor = "#FFFFFF"
    const followSpeed = 0.05
    const gazeIntensity = 1.0

    const cursorRef = useRef<HTMLDivElement>(null)
    const eyeLeftRef = useRef<HTMLDivElement>(null)
    const eyeRightRef = useRef<HTMLDivElement>(null)
    const pupilLeftRef = useRef<HTMLDivElement>(null)
    const pupilRightRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLDivElement>(null)

    const prevMousePos = useRef({ x: 0, y: 0 })
    const isBlinkingRef = useRef(false)
    const currentAngleRef = useRef<number>(Math.PI / 2)

    const [mounted, setMounted] = useState(false)
    const [isPointerDevice, setIsPointerDevice] = useState(false)

    // Framer Canvas detection (Safe check)
    const isCanvas =
        typeof RenderTarget !== "undefined" &&
        RenderTarget.current() === RenderTarget.canvas

    // Check hardware pointer capabilities and reduced motion
    useEffect(() => {
        setMounted(true)
        if (typeof window === "undefined") return

        const hasFinePointer = window.matchMedia("(pointer: fine)").matches
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        if (hasFinePointer && !prefersReducedMotion) {
            setIsPointerDevice(true)
        }
    }, [])

    useEffect(() => {
        if (
            !mounted ||
            !isPointerDevice ||
            isCanvas ||
            typeof window === "undefined"
        )
            return

        const cursor = cursorRef.current
        const eyeLeft = eyeLeftRef.current
        const eyeRight = eyeRightRef.current
        const pupilLeft = pupilLeftRef.current
        const pupilRight = pupilRightRef.current
        const badge = badgeRef.current

        if (
            !cursor ||
            !eyeLeft ||
            !eyeRight ||
            !pupilLeft ||
            !pupilRight ||
            !badge
        )
            return

        // 1. Reference-counted style injection with Form Field accessibility
        const styleId = "gm-googly-cursor-override"
        let isStyleInjected = false

        if (hideDefaultCursor) {
            const currentCount = Number(
                document.body.getAttribute("data-gm-googly-cursor-count") || "0"
            )
            document.body.setAttribute(
                "data-gm-googly-cursor-count",
                String(currentCount + 1)
            )
            isStyleInjected = true

            let styleTag = document.getElementById(
                styleId
            ) as HTMLStyleElement | null
            if (!styleTag) {
                styleTag = document.createElement("style")
                styleTag.id = styleId
                styleTag.innerHTML = `
                    html, body, *, *::before, *::after {
                        cursor: none !important;
                    }
                    input, textarea, select, [contenteditable], [contenteditable] * {
                        cursor: text !important;
                    }
                    select, option {
                        cursor: pointer !important;
                    }
                `
                document.head.appendChild(styleTag)
            }
        }

        // 2. Initial state setup
        const pupilSize = eyeWidth * 0.44
        const maxRadiusX =
            (eyeWidth / 2 - pupilSize / 2 - borderWidth) * gazeIntensity
        const maxRadiusY =
            (eyeHeight / 2 - pupilSize / 2 - borderWidth) * gazeIntensity

        const initX = Math.cos(currentAngleRef.current) * maxRadiusX
        const initY = Math.sin(currentAngleRef.current) * maxRadiusY

        gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 })
        gsap.set(badge, { opacity: 0, scale: 0.8, x: 10 })
        gsap.set([pupilLeft, pupilRight], { x: initX, y: initY })

        const xTo = gsap.quickTo(cursor, "x", {
            duration: followSpeed,
            ease: "power2.out",
        })
        const yTo = gsap.quickTo(cursor, "y", {
            duration: followSpeed,
            ease: "power2.out",
        })

        // 3. Eye blink animation with battery hibernation
        let isWindowActive = true
        let hasMoved = false

        const triggerBlink = () => {
            if (
                isBlinkingRef.current ||
                !isWindowActive ||
                !hasMoved ||
                document.hidden
            )
                return
            isBlinkingRef.current = true

            gsap.timeline({
                onComplete: () => {
                    isBlinkingRef.current = false
                },
            })
                .to([eyeLeft, eyeRight], {
                    scaleY: 0.05,
                    duration: 0.14,
                    ease: "power2.inOut",
                    transformOrigin: "center center",
                })
                .to([eyeLeft, eyeRight], {
                    scaleY: 1,
                    duration: 0.2,
                    ease: "power2.out",
                })
        }

        const blinkInterval = setInterval(triggerBlink, 2600)
        const handleMouseDown = () => triggerBlink()

        const updatePupilAngle = (
            targetAngle: number,
            duration: number = 0.28
        ) => {
            currentAngleRef.current = targetAngle
            const targetX = Math.cos(targetAngle) * maxRadiusX
            const targetY = Math.sin(targetAngle) * maxRadiusY

            gsap.to([pupilLeft, pupilRight], {
                x: targetX,
                y: targetY,
                duration: duration,
                ease: "power2.out",
                overwrite: "auto",
            })
        }

        // 4. Pointer interactions with strict touch hygiene
        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            isWindowActive = true

            const mouseX = e.clientX
            const mouseY = e.clientY

            if (!hasMoved) {
                gsap.set(cursor, { x: mouseX, y: mouseY, opacity: 1 })
                hasMoved = true
                prevMousePos.current = { x: mouseX, y: mouseY }
                return
            } else {
                xTo(mouseX)
                yTo(mouseY)
            }

            const deltaX = mouseX - prevMousePos.current.x
            const deltaY = mouseY - prevMousePos.current.y
            const dist = Math.hypot(deltaX, deltaY)

            if (dist > 2) {
                prevMousePos.current = { x: mouseX, y: mouseY }
                const angle = Math.atan2(deltaY, deltaX)
                updatePupilAngle(angle, 0.25)
            }

            const targetEl = e.target as HTMLElement | null
            const isClickable = targetEl?.closest?.(
                "a, button, [role='button'], input, textarea, select"
            )

            if (isClickable) {
                gsap.to(badge, {
                    opacity: 1,
                    scale: 1,
                    x: 14,
                    duration: 0.2,
                    ease: "power2.out",
                    overwrite: "auto",
                })
            } else {
                gsap.to(badge, {
                    opacity: 0,
                    scale: 0.8,
                    x: 10,
                    duration: 0.2,
                    ease: "power2.out",
                    overwrite: "auto",
                })
            }
        }

        // Scroll reactivity
        let lastScroll = window.scrollY
        const handleScroll = () => {
            const currentScroll = window.scrollY
            const delta = currentScroll - lastScroll
            lastScroll = currentScroll

            if (Math.abs(delta) > 1) {
                const isLeftSide = Math.cos(currentAngleRef.current) < 0
                if (delta > 0) {
                    updatePupilAngle(Math.PI / 2, 0.35)
                } else {
                    const topAngle = isLeftSide
                        ? -Math.PI * 0.75
                        : -Math.PI * 0.25
                    updatePupilAngle(topAngle, 0.35)
                }
            }
        }

        const handleMouseLeave = () => {
            isWindowActive = false
            gsap.to(cursor, { opacity: 0, duration: 0.2 })
            hasMoved = false
        }

        const handleMouseEnter = () => {
            isWindowActive = true
            if (hasMoved) {
                gsap.to(cursor, { opacity: 1, duration: 0.2 })
            }
        }

        const handleVisibilityChange = () => {
            if (document.hidden) {
                isWindowActive = false
            }
        }

        window.addEventListener("pointermove", handlePointerMove, {
            passive: true,
        })
        window.addEventListener("mousedown", handleMouseDown)
        window.addEventListener("scroll", handleScroll, { passive: true })
        document.addEventListener("mouseleave", handleMouseLeave)
        document.addEventListener("mouseenter", handleMouseEnter)
        document.addEventListener("visibilitychange", handleVisibilityChange)

        // 5. Complete Cleanup
        return () => {
            clearInterval(blinkInterval)
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("mousedown", handleMouseDown)
            window.removeEventListener("scroll", handleScroll)
            document.removeEventListener("mouseleave", handleMouseLeave)
            document.removeEventListener("mouseenter", handleMouseEnter)
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )

            // Kill all running tweens to prevent memory leaks
            gsap.killTweensOf([
                cursor,
                eyeLeft,
                eyeRight,
                pupilLeft,
                pupilRight,
                badge,
            ])

            // Clean up style tag via Reference Counting
            if (isStyleInjected) {
                const remainingCount =
                    Number(
                        document.body.getAttribute(
                            "data-gm-googly-cursor-count"
                        ) || "1"
                    ) - 1
                if (remainingCount <= 0) {
                    document.body.removeAttribute("data-gm-googly-cursor-count")
                    const elToRemove = document.getElementById(styleId)
                    if (elToRemove && elToRemove.parentNode) {
                        elToRemove.parentNode.removeChild(elToRemove)
                    }
                } else {
                    document.body.setAttribute(
                        "data-gm-googly-cursor-count",
                        String(remainingCount)
                    )
                }
            }
        }
    }, [mounted, isPointerDevice, isCanvas, accentColor, hideDefaultCursor])

    const pupilSize = eyeWidth * 0.44
    const highlightSize = pupilSize * 0.32

    // Canvas placeholder card for Framer design editor
    if (isCanvas) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    minWidth: 160,
                    minHeight: 160,
                    border: `1.5px dashed ${accentColor}`,
                    borderRadius: "16px",
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    boxSizing: "border-box",
                    userSelect: "none",
                    ...style,
                }}
                className={className}
            >
                <div
                    style={{
                        display: "flex",
                        gap: `${eyeSpacing}px`,
                        marginBottom: "12px",
                    }}
                >
                    <div
                        style={{
                            width: `${eyeWidth * 0.85}px`,
                            height: `${eyeHeight * 0.85}px`,
                            borderRadius: "50% / 50%",
                            backgroundColor: backgroundColor,
                            border: `${borderWidth}px solid ${accentColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: `${pupilSize * 0.85}px`,
                                height: `${pupilSize * 0.85}px`,
                                borderRadius: "50%",
                                backgroundColor: accentColor,
                                position: "relative",
                                transform: `translateY(${(eyeHeight / 2 - pupilSize / 2 - borderWidth) * 0.9}px)`,
                            }}
                        >
                            <div
                                style={{
                                    width: `${highlightSize * 0.85}px`,
                                    height: `${highlightSize * 0.85}px`,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                }}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            width: `${eyeWidth * 0.85}px`,
                            height: `${eyeHeight * 0.85}px`,
                            borderRadius: "50% / 50%",
                            backgroundColor: backgroundColor,
                            border: `${borderWidth}px solid ${accentColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: `${pupilSize * 0.85}px`,
                                height: `${pupilSize * 0.85}px`,
                                borderRadius: "50%",
                                backgroundColor: accentColor,
                                position: "relative",
                                transform: `translateY(${(eyeHeight / 2 - pupilSize / 2 - borderWidth) * 0.9}px)`,
                            }}
                        >
                            <div
                                style={{
                                    width: `${highlightSize * 0.85}px`,
                                    height: `${highlightSize * 0.85}px`,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFFFFF",
                                    position: "absolute",
                                    top: "2px",
                                    right: "2px",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#111111",
                        lineHeight: 1.3,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontFamily:
                            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                >
                    Googly Eyes Cursor
                </div>

                <div
                    style={{
                        fontSize: "10px",
                        color: "#666666",
                        marginTop: "8px",
                        lineHeight: 1.4,
                        fontWeight: 500,
                        fontFamily:
                            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    }}
                >
                    Drop anywhere on the page. Bring to top layer.
                </div>
            </div>
        )
    }

    if (!mounted || !isPointerDevice) return null

    // Render interactive cursor directly into body on Live/Preview
    return typeof document !== "undefined"
        ? createPortal(
              <div
                  ref={cursorRef}
                  style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      zIndex: 2147483647,
                      pointerEvents: "none",
                      display: "flex",
                      alignItems: "center",
                      userSelect: "none",
                      willChange: "transform",
                  }}
              >
                  <div
                      style={{
                          display: "flex",
                          alignItems: "center",
                          gap: `${eyeSpacing}px`,
                      }}
                  >
                      {/* Left eye */}
                      <div
                          ref={eyeLeftRef}
                          style={{
                              width: `${eyeWidth}px`,
                              height: `${eyeHeight}px`,
                              borderRadius: "50% / 50%",
                              backgroundColor: backgroundColor,
                              border: `${borderWidth}px solid ${accentColor}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              overflow: "hidden",
                          }}
                      >
                          <div
                              ref={pupilLeftRef}
                              style={{
                                  width: `${pupilSize}px`,
                                  height: `${pupilSize}px`,
                                  borderRadius: "50%",
                                  backgroundColor: accentColor,
                                  position: "absolute",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "flex-end",
                                  padding: "2px",
                              }}
                          >
                              <div
                                  style={{
                                      width: `${highlightSize}px`,
                                      height: `${highlightSize}px`,
                                      borderRadius: "50%",
                                      backgroundColor: "#FFFFFF",
                                  }}
                              />
                          </div>
                      </div>

                      {/* Right eye */}
                      <div
                          ref={eyeRightRef}
                          style={{
                              width: `${eyeWidth}px`,
                              height: `${eyeHeight}px`,
                              borderRadius: "50% / 50%",
                              backgroundColor: backgroundColor,
                              border: `${borderWidth}px solid ${accentColor}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              position: "relative",
                              overflow: "hidden",
                          }}
                      >
                          <div
                              ref={pupilRightRef}
                              style={{
                                  width: `${pupilSize}px`,
                                  height: `${pupilSize}px`,
                                  borderRadius: "50%",
                                  backgroundColor: accentColor,
                                  position: "absolute",
                                  display: "flex",
                                  alignItems: "flex-start",
                                  justifyContent: "flex-end",
                                  padding: "2px",
                              }}
                          >
                              <div
                                  style={{
                                      width: `${highlightSize}px`,
                                      height: `${highlightSize}px`,
                                      borderRadius: "50%",
                                      backgroundColor: "#FFFFFF",
                                  }}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Click badge for clickable targets */}
                  <div
                      ref={badgeRef}
                      style={{
                          backgroundColor: accentColor,
                          border: `1.5px solid ${accentColor}`,
                          borderRadius: "9999px",
                          padding: "5px 8px",
                          fontSize: "14px",
                          fontWeight: 600,
                          lineHeight: 1,
                          color: "#FFFFFF",
                          letterSpacing: "0.02em",
                          whiteSpace: "nowrap",
                          pointerEvents: "none",
                          fontFamily:
                              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                      }}
                  >
                      click
                  </div>
              </div>,
              document.body
          )
        : null
}

GooglyEyesCursor.defaultProps = {
    width: 200,
    height: 200,
}

// Framer Property Controls GUI
addPropertyControls(GooglyEyesCursor, {
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#E53935",
    },
    hideDefaultCursor: {
        type: ControlType.Boolean,
        title: "Hide Cursor",
        defaultValue: true,
    },
})
