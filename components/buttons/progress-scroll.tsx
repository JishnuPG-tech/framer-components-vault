import { useEffect, useRef, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"

interface Props {
    activeColor: string
    defaultColor: string
    trackColor: string
    showOffset: number
    size: number
    strokeWidth: number
    position: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    margin: number
    barEnabled: boolean
    barPosition: "top" | "bottom"
    barHeight: number
    barColor: string
    barTrackColor: string
    barGlow: boolean
    glowEnabled: boolean
    glowColor: string
    glowBlur: number
    pulseOnComplete: boolean
    hoverScale: number
    entranceAnimation: "fade" | "scale" | "slide" | "bounce" | "pop" | "rotate"
    scrollEasing:
        | "linear"
        | "ease-out"
        | "ease-in-out"
        | "expo"
        | "cubic"
        | "bounce"
    showDirection: boolean
    scrollDuration: "300" | "600" | "1200" | "2000"
    contentMode: "progress" | "icon"
    iconType:
        | "arrow"
        | "chevron"
        | "double-chevron"
        | "home"
        | "rocket"
        | "custom"
    customIcon: string
    iconSize: number
    darkSections: string
    darkDefaultColor: string
    darkActiveColor: string
    darkTrackColor: string
    darkBarColor: string
}

function BuiltInIcon({
    type,
    size,
}: {
    type: "arrow" | "chevron" | "double-chevron" | "home" | "rocket"
    size: number
}) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        "aria-hidden": true,
    }

    switch (type) {
        case "chevron":
            return (
                <svg {...common}>
                    <path d="m18 15-6-6-6 6" />
                </svg>
            )
        case "double-chevron":
            return (
                <svg {...common}>
                    <path d="m18 17-6-6-6 6" />
                    <path d="m18 11-6-6-6 6" />
                </svg>
            )
        case "home":
            return (
                <svg {...common}>
                    <path d="m3 11 9-8 9 8" />
                    <path d="M5 10v10h14V10" />
                    <path d="M9 20v-6h6v6" />
                </svg>
            )
        case "rocket":
            return (
                <svg {...common}>
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.87 12.87 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.35 22.35 0 0 1-3.95 2Z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    <circle cx="16" cy="8" r="1" />
                </svg>
            )
        case "arrow":
        default:
            return (
                <svg {...common}>
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                </svg>
            )
    }
}

/**
 * INTEGRATED SCROLL PROGRESS (ROBUST FRAMER VERSION)
 * Fixed: Double-click issue, Layering issues (clickable anywhere),
 * and Interaction responsiveness.
 *
 * Scope: observes page/window scroll and checks only explicitly configured
 * section IDs via document.getElementById(). It does not inspect arbitrary elements.
 */
/**
 * @framerDisableUnlink
 */
export default function ScrollProgressEnhanced({
    activeColor = "#10b981",
    defaultColor = "#3b82f6",
    trackColor = "#e2e8f0",
    showOffset = 200,
    size = 60,
    strokeWidth = 4,
    position = "bottom-right",
    margin = 24,
    barEnabled = true,
    barPosition = "top",
    barHeight = 4,
    barColor = "#3b82f6",
    barTrackColor = "transparent",
    barGlow = true,
    glowEnabled = true,
    glowColor = activeColor,
    glowBlur = 3,
    pulseOnComplete = true,
    hoverScale = 1.15,
    entranceAnimation = "pop",
    scrollEasing = "expo",
    showDirection = true,
    scrollDuration = "1200",
    contentMode = "progress",
    iconType = "arrow",
    customIcon = "",
    iconSize = 22,
    darkSections = "services",
    darkDefaultColor = "#ffffff",
    darkActiveColor = "#34d399",
    darkTrackColor = "#ffffff",
    darkBarColor = "#ffffff",
}: Props) {
    const isStatic = useIsStaticRenderer()

    const btnRef = useRef<HTMLButtonElement>(null)
    const arcRef = useRef<SVGCircleElement>(null)
    const trackRef = useRef<SVGCircleElement>(null)
    const labelRef = useRef<HTMLSpanElement>(null)
    const iconRef = useRef<HTMLSpanElement>(null)
    const barFillRef = useRef<HTMLDivElement>(null)
    const barGlowRef = useRef<HTMLDivElement>(null)

    const prevCompleteRef = useRef(false)
    const prevVisibleRef = useRef(false)
    const isDarkSectionRef = useRef(false)
    const pulseRef = useRef<gsap.core.Tween | null>(null)
    const isHoveringRef = useRef(false)
    const isScrollingRef = useRef(false)
    const isVisibleRef = useRef(true)
    const lastScrollTopRef = useRef(0)
    const scrollDirectionRef = useRef<"up" | "down" | null>(null)
    const directionIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    )

    // RAF id for the scroll-driven progress update loop
    const rafRef = useRef<number | null>(null)
    // RAF id for the smooth "scroll to top" animation loop
    const scrollAnimRafRef = useRef<number | null>(null)

    const radius = size / 2 - strokeWidth - 2
    const circumference = useMemo(() => 2 * Math.PI * radius, [radius])
    const cx = size / 2
    const cy = size / 2
    const glowId = useMemo(
        () => `glow-${Math.random().toString(36).substr(2, 9)}`,
        []
    )

    const positionStyle: React.CSSProperties = {
        position: "fixed",
        ...(position === "bottom-right" && { bottom: margin, right: margin }),
        ...(position === "bottom-left" && { bottom: margin, left: margin }),
        ...(position === "top-right" && { top: margin, right: margin }),
        ...(position === "top-left" && { top: margin, left: margin }),
    }

    const darkSectionIds = useMemo(
        () =>
            new Set(
                darkSections
                    .split(",")
                    .map((value) => value.trim().replace(/^#/, ""))
                    .filter(Boolean)
            ),
        [darkSections]
    )

    const getEntranceState = useCallback(
        (visible: boolean): gsap.TweenVars => {
            if (!visible) {
                switch (entranceAnimation) {
                    case "scale":
                        return { opacity: 0, scale: 0.6 }
                    case "slide":
                        return { opacity: 0, y: 32 }
                    case "bounce":
                        return { opacity: 0, y: 40, scale: 0.9 }
                    case "pop":
                        return { opacity: 0, scale: 0.72, y: 12 }
                    case "rotate":
                        return { opacity: 0, scale: 0.8, rotation: -180 }
                    case "fade":
                    default:
                        return { opacity: 0 }
                }
            }

            switch (entranceAnimation) {
                case "bounce":
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "bounce.out",
                    }
                case "pop":
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "back.out(1.8)",
                    }
                case "rotate":
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "back.out(1.4)",
                    }
                case "scale":
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "power2.out",
                    }
                case "slide":
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "power3.out",
                    }
                case "fade":
                default:
                    return {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotation: 0,
                        ease: "power1.out",
                    }
            }
        },
        [entranceAnimation]
    )

    const applyScrollEasing = useCallback(
        (t: number) => {
            switch (scrollEasing) {
                case "linear":
                    return t
                case "ease-out":
                    return 1 - Math.pow(1 - t, 3)
                case "ease-in-out":
                    return t < 0.5
                        ? 4 * t * t * t
                        : 1 - Math.pow(-2 * t + 2, 3) / 2
                case "cubic":
                    return t * t * (3 - 2 * t)
                case "bounce": {
                    const n1 = 7.5625
                    const d1 = 2.75
                    if (t < 1 / d1) return n1 * t * t
                    if (t < 2 / d1) {
                        const x = t - 1.5 / d1
                        return n1 * x * x + 0.75
                    }
                    if (t < 2.5 / d1) {
                        const x = t - 2.25 / d1
                        return n1 * x * x + 0.9375
                    }
                    const x = t - 2.625 / d1
                    return n1 * x * x + 0.984375
                }
                case "expo":
                default:
                    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
            }
        },
        [scrollEasing]
    )

    const updateProgress = useCallback(() => {
        if (
            !arcRef.current ||
            !labelRef.current ||
            !iconRef.current ||
            !btnRef.current
        )
            return

        const scrollTop = window.scrollY || document.documentElement.scrollTop
        const totalHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight
        const p = totalHeight > 0 ? Math.min(scrollTop / totalHeight, 1) : 0

        const pct = Math.round(p * 100)
        const complete = pct >= 100
        const offset = circumference - p * circumference

        const rect = btnRef.current.getBoundingClientRect()
        const probeY = Math.min(
            window.innerHeight - 1,
            Math.max(0, rect.top + rect.height / 2)
        )

        const isDarkSection = Array.from(darkSectionIds).some((id) => {
            const section = document.getElementById(id)
            if (!section) return false
            const sectionRect = section.getBoundingClientRect()
            return sectionRect.top <= probeY && sectionRect.bottom > probeY
        })
        isDarkSectionRef.current = isDarkSection

        const currentDefaultColor = isDarkSection
            ? darkDefaultColor
            : defaultColor
        const currentActiveColor = isDarkSection ? darkActiveColor : activeColor
        const currentTrackColor = isDarkSection ? darkTrackColor : trackColor
        const currentBarColor = isDarkSection ? darkBarColor : barColor
        const color = complete ? currentActiveColor : currentDefaultColor

        gsap.set(arcRef.current, { strokeDashoffset: offset })
        if (trackRef.current) {
            gsap.to(trackRef.current, {
                stroke: currentTrackColor,
                duration: 0.25,
                overwrite: "auto",
            })
        }
        gsap.to(arcRef.current, {
            stroke: color,
            duration: 0.3,
            overwrite: "auto",
        })
        arcRef.current.setAttribute(
            "filter",
            complete && glowEnabled ? `url(#${glowId})` : ""
        )

        const directionLabel =
            showDirection && scrollDirectionRef.current
                ? scrollDirectionRef.current === "down"
                    ? "↓"
                    : "↑"
                : null

        const directionIsVisible =
            Boolean(directionLabel) && !isScrollingRef.current
        const showIcon = contentMode === "icon" && !directionIsVisible

        labelRef.current.textContent = directionIsVisible
            ? directionLabel
            : contentMode === "progress"
              ? isScrollingRef.current || complete
                  ? "↑"
                  : `${pct}%`
              : ""

        gsap.set(iconRef.current, {
            display: showIcon ? "flex" : "none",
            color,
        })
        gsap.set(labelRef.current, { display: showIcon ? "none" : "block" })
        gsap.to(labelRef.current, {
            color,
            fontSize:
                directionIsVisible || complete
                    ? Math.round(size * 0.37)
                    : Math.round(size * 0.2),
            duration: 0.2,
            overwrite: "auto",
        })

        if (complete !== prevCompleteRef.current) {
            prevCompleteRef.current = complete
            if (complete && pulseOnComplete) {
                pulseRef.current?.kill()
                gsap.timeline()
                    .to(btnRef.current, {
                        scale: 1.3,
                        duration: 0.25,
                        ease: "power2.out",
                    })
                    .to(btnRef.current, {
                        scale: isHoveringRef.current ? hoverScale : 1.08,
                        duration: 0.4,
                        ease: "elastic.out(1, 0.5)",
                    })

                pulseRef.current = gsap.to(arcRef.current, {
                    opacity: 0.4,
                    duration: 0.8,
                    ease: "sine.inOut",
                    yoyo: true,
                    repeat: -1,
                })
            } else {
                pulseRef.current?.kill()
                pulseRef.current = null
                gsap.to(arcRef.current, { opacity: 1, duration: 0.3 })
                if (!isHoveringRef.current) {
                    gsap.to(btnRef.current, {
                        scale: 1,
                        duration: 0.4,
                        overwrite: "auto",
                    })
                }
            }
        }

        // CRITICAL FIX: Visibility and Pointer Events
        const shouldShow = scrollTop >= showOffset
        if (shouldShow !== prevVisibleRef.current) {
            prevVisibleRef.current = shouldShow
            const entranceState = getEntranceState(shouldShow)
            gsap.to(btnRef.current, {
                ...entranceState,
                duration: shouldShow ? 0.55 : 0.3,
                ease: shouldShow ? entranceState.ease : "power2.in",
                overwrite: "auto",
                onStart: () => {
                    if (btnRef.current) {
                        btnRef.current.style.visibility = "visible"
                        btnRef.current.style.pointerEvents = shouldShow
                            ? "auto"
                            : "none"
                    }
                },
                onComplete: () => {
                    if (btnRef.current && !shouldShow) {
                        btnRef.current.style.visibility = "hidden"
                    }
                },
            })
        }

        if (barFillRef.current && barEnabled) {
            gsap.set(barFillRef.current, {
                width: `${p * 100}%`,
                backgroundColor: currentBarColor,
            })
            if (barGlowRef.current && barGlow) {
                gsap.set(barGlowRef.current, {
                    opacity: p,
                    backgroundColor: currentBarColor,
                })
            }
        }
    }, [
        activeColor,
        defaultColor,
        trackColor,
        barColor,
        darkSectionIds,
        darkDefaultColor,
        darkActiveColor,
        darkTrackColor,
        darkBarColor,
        circumference,
        showOffset,
        size,
        glowId,
        barEnabled,
        barGlow,
        pulseOnComplete,
        hoverScale,
        showDirection,
        contentMode,
        getEntranceState,
    ])

    useEffect(() => {
        // Don't animate, attach listeners, or run RAF loops during
        // Framer's static rendering (canvas export / static publish pass).
        if (isStatic) return
        if (!arcRef.current) return

        gsap.set(arcRef.current, {
            strokeDasharray: circumference,
            strokeDashoffset: circumference,
            rotation: -90,
            transformOrigin: "50% 50%",
        })

        // Initial hidden state based on the selected entrance animation.
        gsap.set(btnRef.current, {
            ...getEntranceState(false),
            visibility: "hidden",
            pointerEvents: "none",
        })

        const handleScroll = () => {
            const currentScrollTop =
                window.scrollY || document.documentElement.scrollTop

            if (showDirection && !isScrollingRef.current) {
                const delta = currentScrollTop - lastScrollTopRef.current
                if (Math.abs(delta) > 1) {
                    scrollDirectionRef.current = delta > 0 ? "down" : "up"
                    if (directionIdleTimerRef.current) {
                        clearTimeout(directionIdleTimerRef.current)
                    }
                    directionIdleTimerRef.current = setTimeout(() => {
                        scrollDirectionRef.current = null
                        updateProgress()
                    }, 700)
                }
            }
            lastScrollTopRef.current = Math.max(0, currentScrollTop)

            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }

            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null
                updateProgress()
            })
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting
                isVisibleRef.current = visible

                if (!visible) {
                    if (scrollAnimRafRef.current !== null) {
                        cancelAnimationFrame(scrollAnimRafRef.current)
                        scrollAnimRafRef.current = null
                    }
                    isScrollingRef.current = false
                }
            },
            { threshold: 0 }
        )

        if (btnRef.current) {
            observer.observe(btnRef.current)
        }

        window.addEventListener("scroll", handleScroll, {
            capture: true,
        })
        handleScroll()
        const timer = setTimeout(handleScroll, 100)
        window.addEventListener("resize", handleScroll)

        return () => {
            observer.disconnect()
            window.removeEventListener("scroll", handleScroll, {
                capture: true,
            })
            window.removeEventListener("resize", handleScroll)
            clearTimeout(timer)

            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            if (scrollAnimRafRef.current !== null) {
                cancelAnimationFrame(scrollAnimRafRef.current)
                scrollAnimRafRef.current = null
            }

            if (directionIdleTimerRef.current) {
                clearTimeout(directionIdleTimerRef.current)
                directionIdleTimerRef.current = null
            }

            pulseRef.current?.kill()
        }
    }, [
        circumference,
        updateProgress,
        isStatic,
        showDirection,
        getEntranceState,
    ])

    const handleScrollToTop = useCallback(
        (e: React.PointerEvent | React.MouseEvent) => {
            e.preventDefault()
            e.stopPropagation()

            if (!isVisibleRef.current) return
            if (isScrollingRef.current) return
            isScrollingRef.current = true

            gsap.timeline()
                .to(btnRef.current, {
                    scale: 0.88,
                    duration: 0.12,
                    ease: "power2.out",
                })
                .to(btnRef.current, {
                    scale: isHoveringRef.current ? hoverScale : 1,
                    duration: 0.4,
                    ease: "back.out(2)",
                })

            gsap.to(arcRef.current, {
                rotation: "+=360",
                duration: 1,
                ease: "power3.inOut",
                transformOrigin: "50% 50%",
            })

            const start = window.scrollY || document.documentElement.scrollTop

            const duration = Math.max(0, Number(scrollDuration))
            const startTime = performance.now()

            const animate = (now: number) => {
                if (!isVisibleRef.current) {
                    scrollAnimRafRef.current = null
                    isScrollingRef.current = false
                    return
                }

                const elapsed = now - startTime
                const progress =
                    duration === 0 ? 1 : Math.min(elapsed / duration, 1)

                const eased = applyScrollEasing(progress)
                const value = start * (1 - eased)

                window.scrollTo(0, value)

                if (progress < 1) {
                    scrollAnimRafRef.current = requestAnimationFrame(animate)
                } else {
                    scrollAnimRafRef.current = null
                    isScrollingRef.current = false
                }
            }

            if (scrollAnimRafRef.current !== null) {
                cancelAnimationFrame(scrollAnimRafRef.current)
            }
            scrollAnimRafRef.current = requestAnimationFrame(animate)
        },
        [hoverScale, scrollDuration, applyScrollEasing]
    )

    // Static fallback: no listeners, no GSAP, no RAF — just a representative
    // visual so the component looks reasonable on the canvas / in static export.
    if (isStatic) {
        const staticOffset = circumference * 0.35

        return (
            <>
                {barEnabled && (
                    <div
                        style={{
                            position: "fixed",
                            ...(barPosition === "top"
                                ? { top: 0 }
                                : { bottom: 0 }),
                            left: 0,
                            width: "100%",
                            height: barHeight,
                            background: barTrackColor,
                            zIndex: 2147483646,
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                width: "65%",
                                background: barColor,
                            }}
                        />
                    </div>
                )}
                <div
                    style={{
                        ...positionStyle,
                        zIndex: 2147483647,
                        width: size,
                        height: size,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <svg
                        width={size}
                        height={size}
                        style={{ display: "block" }}
                    >
                        <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={trackColor}
                            strokeWidth={strokeWidth}
                            opacity={0.2}
                        />
                        <circle
                            cx={cx}
                            cy={cy}
                            r={radius}
                            fill="none"
                            stroke={defaultColor}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={staticOffset}
                            transform={`rotate(-90 ${cx} ${cy})`}
                        />
                    </svg>
                    {contentMode === "icon" ? (
                        <span
                            style={{
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: defaultColor,
                                pointerEvents: "none",
                            }}
                        >
                            {iconType === "custom" && customIcon ? (
                                <img
                                    src={customIcon}
                                    alt=""
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                        objectFit: "contain",
                                    }}
                                />
                            ) : (
                                <BuiltInIcon
                                    type={
                                        iconType === "custom"
                                            ? "arrow"
                                            : iconType
                                    }
                                    size={iconSize}
                                />
                            )}
                        </span>
                    ) : (
                        <span
                            style={{
                                position: "absolute",
                                fontWeight: 600,
                                fontFamily: "sans-serif",
                                fontSize: Math.round(size * 0.2),
                                color: defaultColor,
                                userSelect: "none",
                            }}
                        >
                            65%
                        </span>
                    )}
                </div>
            </>
        )
    }

    return (
        <>
            {/* Progress Bar - Ultra High Z-Index */}
            {barEnabled && (
                <div
                    style={{
                        position: "fixed",
                        ...(barPosition === "top" ? { top: 0 } : { bottom: 0 }),
                        left: 0,
                        width: "100%",
                        height: barHeight,
                        background: barTrackColor,
                        zIndex: 2147483646, // Max z-index - 1
                        overflow: "visible",
                        pointerEvents: "none", // Allow clicks to pass through
                    }}
                >
                    <div
                        ref={barFillRef}
                        style={{
                            height: "100%",
                            width: "0%",
                            background: barColor,
                            position: "relative",
                        }}
                    >
                        {barGlow && (
                            <div
                                ref={barGlowRef}
                                style={{
                                    position: "absolute",
                                    right: -barHeight * 2,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: barHeight * 4,
                                    height: barHeight * 4,
                                    borderRadius: "50%",
                                    background: barColor,
                                    opacity: 0,
                                    filter: `blur(${barHeight * 1.5}px)`,
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Circular Button - Absolute Maximum Z-Index */}
            <button
                ref={btnRef}
                onPointerDown={handleScrollToTop} // INSTANT RESPONSE
                onMouseEnter={() => {
                    isHoveringRef.current = true
                    gsap.to(btnRef.current, {
                        scale: hoverScale,
                        duration: 0.3,
                        ease: "back.out(2)",
                        overwrite: "auto",
                    })
                }}
                onMouseLeave={() => {
                    isHoveringRef.current = false
                    gsap.to(btnRef.current, {
                        scale: prevCompleteRef.current ? 1.08 : 1,
                        duration: 0.4,
                        overwrite: "auto",
                    })
                }}
                aria-label="Back to top"
                style={{
                    ...positionStyle,
                    zIndex: 2147483647, // MAXIMUM Z-INDEX
                    width: size,
                    height: size,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: 0,
                    visibility: "hidden",
                    pointerEvents: "none",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "none",
                }}
            >
                <svg
                    width={size}
                    height={size}
                    style={{ display: "block", pointerEvents: "none" }}
                >
                    <defs>
                        <filter
                            id={glowId}
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                        >
                            <feGaussianBlur
                                stdDeviation={glowBlur}
                                result="coloredBlur"
                            />
                            <feMerge>
                                <feFlood
                                    floodColor={glowColor}
                                    result="flood"
                                />
                                <feComposite
                                    in="flood"
                                    in2="coloredBlur"
                                    operator="in"
                                    result="coloredGlow"
                                />
                                <feMergeNode in="coloredGlow" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    <circle
                        ref={trackRef}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={trackColor}
                        strokeWidth={strokeWidth}
                        opacity={0.2}
                    />
                    <circle
                        ref={arcRef}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill="none"
                        stroke={defaultColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                </svg>
                <span
                    ref={iconRef}
                    style={{
                        position: "absolute",
                        display: contentMode === "icon" ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "center",
                        color: defaultColor,
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    {iconType === "custom" && customIcon ? (
                        <img
                            src={customIcon}
                            alt=""
                            style={{
                                width: iconSize,
                                height: iconSize,
                                objectFit: "contain",
                            }}
                        />
                    ) : (
                        <BuiltInIcon
                            type={iconType === "custom" ? "arrow" : iconType}
                            size={iconSize}
                        />
                    )}
                </span>
                <span
                    ref={labelRef}
                    style={{
                        position: "absolute",
                        fontWeight: "600",
                        fontFamily: "sans-serif",
                        userSelect: "none",
                        pointerEvents: "none",
                    }}
                >
                    0%
                </span>
            </button>
        </>
    )
}

ScrollProgressEnhanced.displayName = "Scroll Progress Enhanced"

addPropertyControls(ScrollProgressEnhanced, {
    activeColor: {
        type: ControlType.Color,
        title: "Active Color",
        defaultValue: "#10b981",
    },
    defaultColor: {
        type: ControlType.Color,
        title: "Default Color",
        defaultValue: "#3b82f6",
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "#e2e8f0",
    },
    showOffset: {
        type: ControlType.Number,
        title: "Show After",
        min: 0,
        max: 1000,
        defaultValue: 200,
    },
    size: {
        type: ControlType.Number,
        title: "Size",
        min: 40,
        max: 120,
        defaultValue: 60,
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        min: 2,
        max: 10,
        defaultValue: 4,
    },
    position: {
        type: ControlType.Enum,
        title: "Position",
        options: ["bottom-right", "bottom-left", "top-right", "top-left"],
        defaultValue: "bottom-right",
    },
    margin: {
        type: ControlType.Number,
        title: "Margin",
        min: 0,
        max: 80,
        defaultValue: 24,
    },
    pulseOnComplete: {
        type: ControlType.Boolean,
        title: "Pulse on 100%",
        defaultValue: true,
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.5,
        step: 0.05,
        defaultValue: 1.15,
    },
    entranceAnimation: {
        type: ControlType.Enum,
        title: "Entrance Animation",
        options: ["fade", "scale", "slide", "bounce", "pop", "rotate"],
        optionTitles: ["Fade", "Scale", "Slide", "Bounce", "Pop", "Rotate"],
        defaultValue: "pop",
    },
    scrollEasing: {
        type: ControlType.Enum,
        title: "Scroll Easing",
        options: [
            "linear",
            "ease-out",
            "ease-in-out",
            "expo",
            "cubic",
            "bounce",
        ],
        optionTitles: [
            "Linear",
            "Ease Out",
            "Ease In Out",
            "Expo",
            "Cubic",
            "Bounce",
        ],
        defaultValue: "expo",
    },
    showDirection: {
        type: ControlType.Boolean,
        title: "Show Direction",
        defaultValue: true,
    },
    scrollDuration: {
        type: ControlType.Enum,
        title: "Scroll Duration",
        options: ["300", "600", "1200", "2000"],
        optionTitles: ["300 ms", "600 ms", "1200 ms", "2000 ms"],
        defaultValue: "1200",
    },
    contentMode: {
        type: ControlType.Enum,
        title: "Button Content",
        options: ["progress", "icon"],
        optionTitles: ["Progress", "Icon"],
        defaultValue: "progress",
    },
    iconType: {
        type: ControlType.Enum,
        title: "Icon",
        options: [
            "arrow",
            "chevron",
            "double-chevron",
            "home",
            "rocket",
            "custom",
        ],
        optionTitles: [
            "Arrow",
            "Chevron",
            "Double Chevron",
            "Home",
            "Rocket",
            "Custom SVG",
        ],
        defaultValue: "arrow",
        hidden: (props) => props.contentMode !== "icon",
    },
    customIcon: {
        type: ControlType.File,
        title: "SVG Upload",
        allowedFileTypes: ["svg"],
        hidden: (props) =>
            props.contentMode !== "icon" || props.iconType !== "custom",
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        min: 10,
        max: 64,
        step: 1,
        defaultValue: 22,
        hidden: (props) => props.contentMode !== "icon",
    },
    barEnabled: {
        type: ControlType.Boolean,
        title: "Progress Bar",
        defaultValue: true,
    },
    barPosition: {
        type: ControlType.Enum,
        title: "Bar Position",
        options: ["top", "bottom"],
        defaultValue: "top",
        hidden: (props) => !props.barEnabled,
    },
    barHeight: {
        type: ControlType.Number,
        title: "Bar Height",
        min: 1,
        max: 20,
        defaultValue: 4,
        hidden: (props) => !props.barEnabled,
    },
    barColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#3b82f6",
        hidden: (props) => !props.barEnabled,
    },
    barTrackColor: {
        type: ControlType.Color,
        title: "Bar Track",
        defaultValue: "transparent",
        hidden: (props) => !props.barEnabled,
    },
    barGlow: {
        type: ControlType.Boolean,
        title: "Bar Glow Tip",
        defaultValue: true,
        hidden: (props) => !props.barEnabled,
    },
    glowEnabled: {
        type: ControlType.Boolean,
        title: "Circle Glow",
        defaultValue: true,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#10b981",
        hidden: (props) => !props.glowEnabled,
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Glow Blur",
        min: 0,
        max: 20,
        defaultValue: 3,
        hidden: (props) => !props.glowEnabled,
    },
    darkSections: {
        type: ControlType.String,
        title: "Dark Sections",
        description: "Comma-separated section IDs",
        defaultValue: "services",
    },
    darkDefaultColor: {
        type: ControlType.Color,
        title: "Dark Default",
        defaultValue: "#ffffff",
    },
    darkActiveColor: {
        type: ControlType.Color,
        title: "Dark Active",
        defaultValue: "#34d399",
    },
    darkTrackColor: {
        type: ControlType.Color,
        title: "Dark Track",
        defaultValue: "#ffffff",
    },
    darkBarColor: {
        type: ControlType.Color,
        title: "Dark Bar",
        defaultValue: "#ffffff",
        hidden: (props) => !props.barEnabled,
    },
})
