// User request: Update InteractiveSpotlight.tsx to expose controls for Lamp Image/Width/Height, Light Radius/Color, Ambient Darkness, Feather Amount, Cone Width, Cone Opacity, Mouse Smoothness, Light Intensity, Enable Bloom, Enable Idle Animation, Shadow Strength, and Blend Mode while preserving performance architecture and backward compatibility.
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useMemo, useRef } from "react"

interface MyComponentProps {
    lampImage?: { src?: string; srcSet?: string; alt?: string } | string
    lampWidth: number
    lampHeight: number
    ambientDarkness: number
    lightColor: string
    lightRadius: number
    featherAmount: number
    coneWidth: number
    lightIntensity: number
    coneOpacity: number
    mouseSmoothness: number
    enableBloom: boolean
    enableIdleAnimation: boolean
    shadowStrength: number
    blendMode: "screen" | "plus-lighter" | "overlay" | "normal"
    blurAmount?: number
    bloomStrength?: number
    idleFloatAmount?: number
    idleFloatSpeed?: number
    lampDrop: number
    stickyLamp: boolean
    stickyTop: number
    viewportTracking: boolean
    overlayOnly: boolean
    lampOnTop: boolean
    lampZIndex: number
    touchMode: "auto-sweep" | "center" | "off"
    spotlightLayer: "behind" | "forward"
    minHeight: number
    // Backward compatibility
    overlayOpacity?: number
    spotlightSize?: number
    feather?: number
    interpolation?: number
    lampSize?: number
    edgeFeather?: number
    coneAngle?: number
    mouseSmoothing?: number
    bloom?: boolean
    idleFloating?: boolean
}

function hexToRgba(color: string, alpha: number): string {
    const safeAlpha = Math.max(0, Math.min(1, alpha))
    if (color.startsWith("rgba")) return color.replace(/rgba\(([^)]+),[^)]+\)/, `rgba($1, ${safeAlpha})`)
    if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${safeAlpha})`)
    if (color.startsWith("#")) {
        const hex = color.replace("#", "")
        const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
        const parsed = parseInt(full, 16)
        if (!Number.isNaN(parsed) && full.length === 6) {
            const r = (parsed >> 16) & 255
            const g = (parsed >> 8) & 255
            const b = parsed & 255
            return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`
        }
    }
    return `rgba(255, 220, 160, ${safeAlpha})`
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function InteractiveSpotlight(props: MyComponentProps) {
    const {
        lampImage,
        lampWidth = props.lampSize ?? 74,
        lampHeight = (props.lampSize ?? 74) * 0.6,
        ambientDarkness = props.overlayOpacity ?? 0.62,
        lightColor = "#FFD9A3",
        lightRadius = props.spotlightSize ?? 360,
        featherAmount = props.edgeFeather ?? props.feather ?? 52,
        coneWidth = props.coneAngle ? Math.max(0.4, Math.min(2.2, props.coneAngle / 30)) : 1,
        lightIntensity = 0.78,
        coneOpacity = 0.34,
        mouseSmoothness = props.mouseSmoothing ?? Math.max(
            0,
            Math.min(100, props.interpolation ? 100 - (props.interpolation - 0.01) * (100 / 0.34) : 42)
        ),
        enableBloom = props.bloom ?? true,
        enableIdleAnimation = props.idleFloating ?? false,
        shadowStrength = 0.55,
        blendMode = "screen",
        blurAmount = 8,
        bloomStrength = 0.45,
        idleFloatAmount = 14,
        idleFloatSpeed = 0.6,
        lampDrop = 32,
        stickyLamp = true,
        stickyTop = 0,
        viewportTracking = true,
        overlayOnly = false,
        lampOnTop = true,
        lampZIndex = 20,
        touchMode = "auto-sweep",
        spotlightLayer = "behind",
        minHeight = 520,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const cableRef = useRef<HTMLDivElement | null>(null)
    const lampGroupRef = useRef<HTMLDivElement | null>(null)
    const portalCableRef = useRef<HTMLDivElement | null>(null)
    const portalLampGroupRef = useRef<HTMLDivElement | null>(null)
    const portalConeRef = useRef<HTMLDivElement | null>(null)
    const portalSpotlightRef = useRef<HTMLDivElement | null>(null)
    const portalBloomRef = useRef<HTMLDivElement | null>(null)
    const spotlightRef = useRef<HTMLDivElement | null>(null)
    const bloomRef = useRef<HTMLDivElement | null>(null)
    const coneRef = useRef<HTMLDivElement | null>(null)
    const frameRef = useRef<number | null>(null)

    const targetRef = useRef({ x: 0, y: 0 })
    const currentRef = useRef({ x: 0, y: 0 })
    const sizeRef = useRef({ width: 0, height: 0 })
    const rectLeftRef = useRef(0)
    const rectTopRef = useRef(0)
    const initializedRef = useRef(false)
    const lastPointerMoveRef = useRef(0)
    const idleStartRef = useRef(0)
    const idleBaseRef = useRef({ x: 0, y: 0 })
    const idleActiveRef = useRef(false)
    const coarsePointerRef = useRef(false)

    const isStaticRenderer = useIsStaticRenderer()

    const safeIntensity = useMemo(() => Math.max(0, Math.min(1, lightIntensity)), [lightIntensity])
    const safeFeather = useMemo(() => Math.max(0, Math.min(100, featherAmount)), [featherAmount])
    const safeBlur = useMemo(() => Math.max(0, blurAmount), [blurAmount])
    const safeDarkness = useMemo(() => Math.max(0, Math.min(1, ambientDarkness)), [ambientDarkness])
    const safeBloom = useMemo(() => Math.max(0, Math.min(1, bloomStrength)), [bloomStrength])
    const safeConeWidth = useMemo(() => Math.max(0.35, Math.min(2.5, coneWidth)), [coneWidth])
    const safeShadow = useMemo(() => Math.max(0, Math.min(1, shadowStrength)), [shadowStrength])
    const lampRim = useMemo(() => Math.max(1, lampHeight * 0.035), [lampHeight])
    const lampInnerInset = useMemo(() => Math.max(2, lampHeight * 0.12), [lampHeight])
    const lampGlossHeight = useMemo(() => Math.max(3, lampHeight * 0.22), [lampHeight])
    const lampLipHeight = useMemo(() => Math.max(3, lampHeight * 0.14), [lampHeight])
    const lampBulbSize = useMemo(() => Math.max(5, Math.min(lampWidth, lampHeight) * 0.18), [lampWidth, lampHeight])

    const lampImageSrc = useMemo(() => {
        if (typeof lampImage === "string") return lampImage
        return lampImage?.src
    }, [lampImage])
    const forwardLampActive = lampOnTop && !isStaticRenderer
    const forwardSpotlightActive = spotlightLayer === "forward" && !isStaticRenderer

    const spotlightInner = useMemo(() => hexToRgba(lightColor, 0.58 * safeIntensity), [lightColor, safeIntensity])
    const spotlightMid = useMemo(() => hexToRgba(lightColor, 0.26 * safeIntensity), [lightColor, safeIntensity])
    const spotlightOuter = useMemo(() => hexToRgba(lightColor, 0.07 * safeIntensity), [lightColor, safeIntensity])
    const coneTop = useMemo(
        () => hexToRgba(lightColor, coneOpacity * safeIntensity * 0.8),
        [lightColor, coneOpacity, safeIntensity]
    )
    const coneBottom = useMemo(
        () => hexToRgba(lightColor, coneOpacity * safeIntensity * 0.02),
        [lightColor, coneOpacity, safeIntensity]
    )
    const renderFallbackLamp = useCallback(() => {
        return (
            <div
                style={{
                    width: lampWidth,
                    height: lampHeight,
                    borderRadius: "50% 50% 44% 44%",
                    background:
                        "radial-gradient(125% 95% at 50% 18%, rgba(255,255,255,0.99) 0%, rgba(248,250,253,0.98) 34%, rgba(232,238,245,0.98) 68%, rgba(203,214,226,0.98) 100%)",
                    border: `${lampRim}px solid rgba(196, 207, 221, 0.95)`,
                    boxShadow: `0 ${Math.max(4, lampHeight * 0.08)}px ${Math.max(10, lampHeight * 0.2)}px rgba(255,255,255,0.26), 0 ${Math.max(
                        8,
                        lampHeight * 0.16
                    )}px ${Math.max(20, lampHeight * 0.42)}px rgba(0,0,0,${
                        0.22 + safeShadow * 0.25
                    }), inset 0 1px 0 rgba(255,255,255,0.96), inset 0 -${Math.max(7, lampHeight * 0.18)}px ${Math.max(
                        16,
                        lampHeight * 0.34
                    )}px rgba(116,132,150,0.32)`,
                    pointerEvents: "none",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        left: lampInnerInset,
                        right: lampInnerInset,
                        top: lampInnerInset * 0.5,
                        height: lampGlossHeight,
                        borderRadius: 999,
                        background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.02))",
                        filter: "blur(0.2px)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: Math.max(2, lampInnerInset * 0.7),
                        top: Math.max(2, lampInnerInset * 1.05),
                        width: Math.max(8, lampWidth * 0.2),
                        height: Math.max(8, lampHeight * 0.42),
                        borderRadius: "999px",
                        background: "linear-gradient(90deg, rgba(255,255,255,0.46), rgba(255,255,255,0.02))",
                        opacity: 0.75,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        right: Math.max(2, lampInnerInset * 0.75),
                        top: Math.max(3, lampInnerInset * 1.2),
                        width: Math.max(8, lampWidth * 0.19),
                        height: Math.max(8, lampHeight * 0.48),
                        borderRadius: "999px",
                        background: "linear-gradient(270deg, rgba(137,152,169,0.26), rgba(207,217,229,0.02))",
                        opacity: 0.6,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: Math.max(1, lampHeight * 0.02),
                        width: lampWidth * 0.62,
                        height: lampLipHeight,
                        transform: "translateX(-50%)",
                        borderRadius: "0 0 999px 999px",
                        background:
                            "linear-gradient(180deg, rgba(137,151,169,0.6) 0%, rgba(102,118,138,0.55) 42%, rgba(224,232,241,0.82) 100%)",
                        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 1px ${Math.max(
                            4,
                            lampLipHeight * 1.4
                        )}px rgba(0,0,0,0.15)`,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: Math.max(2, lampHeight * 0.08),
                        width: lampBulbSize,
                        height: lampBulbSize,
                        transform: "translateX(-50%)",
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle at 50% 35%, rgba(255,251,235,1) 0%, rgba(255,232,181,0.92) 45%, rgba(255,197,120,0.24) 100%)",
                        boxShadow: `0 0 ${Math.max(10, lampBulbSize * 1.5)}px rgba(255,223,160,0.68), 0 0 ${Math.max(
                            18,
                            lampBulbSize * 2.3
                        )}px rgba(255,223,160,0.35)`,
                        opacity: 0.95,
                    }}
                />
            </div>
        )
    }, [lampWidth, lampHeight, lampRim, lampInnerInset, lampGlossHeight, lampLipHeight, lampBulbSize, safeShadow])

    const setInitialTarget = useCallback(() => {
        const { width, height } = sizeRef.current
        const x = width * 0.5
        const y = height * 0.72
        targetRef.current.x = x
        targetRef.current.y = y
        if (!initializedRef.current) {
            currentRef.current.x = x
            currentRef.current.y = y
            initializedRef.current = true
        }
    }, [])

    const updateBounds = useCallback(() => {
        const el = containerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        sizeRef.current.width = rect.width
        sizeRef.current.height = rect.height
        rectLeftRef.current = rect.left
        rectTopRef.current = rect.top
        if (!initializedRef.current) setInitialTarget()
    }, [setInitialTarget])

    const updateTargetFromEvent = useCallback(
        (clientX: number, clientY: number) => {
            const el = containerRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const localX = clientX - rect.left
            const localY = clientY - rect.top
            const x = Math.max(0, Math.min(rect.width, localX))
            const y = viewportTracking ? localY : Math.max(0, Math.min(rect.height, localY))
            targetRef.current.x = x
            targetRef.current.y = y
            if (typeof window !== "undefined") {
                const now = window.performance.now()
                lastPointerMoveRef.current = now
                idleActiveRef.current = false
                idleStartRef.current = now
            }
        },
        [viewportTracking]
    )

    useEffect(() => {
        if (typeof window === "undefined") return
        lastPointerMoveRef.current = window.performance.now()
        idleStartRef.current = lastPointerMoveRef.current
        updateBounds()

        const onResize = () => {
            updateBounds()
            setInitialTarget()
        }

        const onScroll = () => {
            updateBounds()
        }

        window.addEventListener("resize", onResize)
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => {
            window.removeEventListener("resize", onResize)
            window.removeEventListener("scroll", onScroll)
        }
    }, [setInitialTarget, updateBounds])

    useEffect(() => {
        if (typeof window === "undefined") return
        const media = window.matchMedia("(pointer: coarse)")
        const updateCoarse = () => {
            coarsePointerRef.current = media.matches || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0)
        }
        updateCoarse()
        if (typeof media.addEventListener === "function") {
            media.addEventListener("change", updateCoarse)
            return () => media.removeEventListener("change", updateCoarse)
        }
        media.addListener(updateCoarse)
        return () => media.removeListener(updateCoarse)
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isStaticRenderer) return

        const onWindowPointerMove = (event: PointerEvent) => {
            updateTargetFromEvent(event.clientX, event.clientY)
        }

        const onWindowPointerDown = (event: PointerEvent) => {
            updateTargetFromEvent(event.clientX, event.clientY)
        }

        window.addEventListener("pointermove", onWindowPointerMove, { passive: true })
        window.addEventListener("pointerdown", onWindowPointerDown, { passive: true })

        const animate = () => {
            const spotlight = forwardSpotlightActive ? portalSpotlightRef.current : spotlightRef.current
            const bloomEl = forwardSpotlightActive ? portalBloomRef.current : bloomRef.current
            const cone = forwardSpotlightActive ? portalConeRef.current : coneRef.current
            const cableEl = forwardLampActive ? portalCableRef.current : cableRef.current
            const lampGroup = forwardLampActive ? portalLampGroupRef.current : lampGroupRef.current
            const containerEl = containerRef.current
            if (containerEl) {
                const rect = containerEl.getBoundingClientRect()
                sizeRef.current.width = rect.width
                sizeRef.current.height = rect.height
                rectLeftRef.current = rect.left
                rectTopRef.current = rect.top
            }
            const { width, height } = sizeRef.current
            if (!spotlight || !cone || !bloomEl || width <= 0 || height <= 0) {
                frameRef.current = window.requestAnimationFrame(animate)
                return
            }

            const now = window.performance.now()
            const idleDelay = 750
            const smoothing = Math.max(0, Math.min(100, mouseSmoothness))
            const t = 0.36 - (smoothing / 100) * 0.32

            if (enableIdleAnimation && now - lastPointerMoveRef.current > idleDelay) {
                if (!idleActiveRef.current) {
                    idleActiveRef.current = true
                    idleStartRef.current = now
                    idleBaseRef.current.x = targetRef.current.x
                    idleBaseRef.current.y = targetRef.current.y
                }
                const elapsed = (now - idleStartRef.current) / 1000
                const floatAmp = Math.max(0, idleFloatAmount)
                const floatSpeed = Math.max(0.05, idleFloatSpeed)
                const idleX = idleBaseRef.current.x + Math.sin(elapsed * floatSpeed * 1.73) * floatAmp
                const idleY = idleBaseRef.current.y + Math.cos(elapsed * floatSpeed * 1.29) * floatAmp * 0.65
                targetRef.current.x = Math.max(0, Math.min(width, idleX))
                targetRef.current.y = Math.max(0, Math.min(height, idleY))
            }

            const hasRecentPointer = now - lastPointerMoveRef.current < 1200
            if (coarsePointerRef.current && !hasRecentPointer) {
                if (touchMode === "auto-sweep") {
                    const tSweep = now * 0.00035
                    const sweepX = width * 0.5 + Math.sin(tSweep) * width * 0.22
                    const sweepY = height * 0.62 + Math.cos(tSweep * 0.83) * height * 0.08
                    targetRef.current.x = Math.max(0, Math.min(width, sweepX))
                    targetRef.current.y = sweepY
                } else if (touchMode === "center") {
                    targetRef.current.x = width * 0.5
                    targetRef.current.y = viewportTracking
                        ? window.innerHeight * 0.62 - rectTopRef.current
                        : height * 0.62
                }
            }

            currentRef.current.x += (targetRef.current.x - currentRef.current.x) * t
            currentRef.current.y += (targetRef.current.y - currentRef.current.y) * t

            const x = currentRef.current.x
            const y = currentRef.current.y
            const rectLeft = rectLeftRef.current
            const rectTop = rectTopRef.current
            const xForLayer = forwardSpotlightActive ? x + rectLeft : x
            const yForLayer = forwardSpotlightActive ? y + rectTop : y

            const spotW = lightRadius
            const spotH = lightRadius * 0.95
            spotlight.style.width = `${spotW}px`
            spotlight.style.height = `${spotH}px`
            spotlight.style.transform = `translate3d(${xForLayer - spotW / 2}px, ${yForLayer - spotH / 2}px, 0)`
            spotlight.style.opacity = `${0.72 + safeIntensity * 0.28}`

            bloomEl.style.width = `${spotW * 1.08}px`
            bloomEl.style.height = `${spotH * 1.08}px`
            bloomEl.style.transform = `translate3d(${xForLayer - (spotW * 1.08) / 2}px, ${yForLayer - (spotH * 1.08) / 2}px, 0)`
            bloomEl.style.opacity = enableBloom ? `${safeBloom * safeIntensity}` : "0"

            const lampBaseTop = lampDrop - lampHeight * 0.3
            const stickyLocalTop = stickyTop - rectTopRef.current
            const maxLampTop = Math.max(lampBaseTop, height - lampHeight)
            const lampVisualTop = stickyLamp
                ? viewportTracking
                    ? Math.max(lampBaseTop, stickyLocalTop)
                    : Math.max(lampBaseTop, Math.min(maxLampTop, stickyLocalTop))
                : lampBaseTop

            const lampTopForLayer = forwardLampActive ? lampVisualTop + rectTop : lampVisualTop
            if (cableEl) cableEl.style.height = `${Math.max(0, lampTopForLayer)}px`
            if (lampGroup) lampGroup.style.transform = `translate3d(-50%, ${lampTopForLayer}px, 0)`
            const viewportLampTop = lampVisualTop + rectTopRef.current

            let viewportLampX = rectLeft + width * 0.5
            let viewportLampY = lampVisualTop + lampHeight + rectTop
            if (forwardLampActive && lampGroup) {
                const portalRect = lampGroup.getBoundingClientRect()
                if (portalRect.width > 0 && portalRect.height > 0) {
                    viewportLampX = portalRect.left + portalRect.width * 0.5
                    viewportLampY = portalRect.top + lampHeight
                } else {
                    viewportLampX = window.innerWidth * 0.5
                    viewportLampY = viewportLampTop + lampHeight
                }
            }
            const lampX = forwardLampActive ? viewportLampX - rectLeft : width * 0.5
            const lampY = forwardLampActive ? viewportLampY - rectTop : lampVisualTop + lampHeight
            const lampXForLayer = forwardSpotlightActive ? viewportLampX : lampX
            const lampYForLayer = forwardSpotlightActive ? viewportLampY : lampY
            const dx = x - lampX
            const dy = y - lampY
            const distance = Math.max(1, Math.hypot(dx, dy))
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI
            const baseWidth = Math.max(40, distance * 0.65 * safeConeWidth)

            cone.style.width = `${baseWidth}px`
            cone.style.height = `${distance}px`
            cone.style.left = `${lampXForLayer}px`
            cone.style.top = `${lampYForLayer}px`
            cone.style.transform = `translateX(-50%) rotate(${angle - 90}deg)`
            cone.style.opacity = `${0.55 + safeIntensity * 0.45}`

            frameRef.current = window.requestAnimationFrame(animate)
        }

        frameRef.current = window.requestAnimationFrame(animate)
        return () => {
            window.removeEventListener("pointermove", onWindowPointerMove)
            window.removeEventListener("pointerdown", onWindowPointerDown)
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [
        mouseSmoothness,
        lightRadius,
        lampDrop,
        lampHeight,
        stickyLamp,
        stickyTop,
        viewportTracking,
        safeConeWidth,
        enableIdleAnimation,
        idleFloatAmount,
        idleFloatSpeed,
        isStaticRenderer,
        enableBloom,
        safeBloom,
        safeIntensity,
        forwardLampActive,
        forwardSpotlightActive,
        touchMode,
        updateTargetFromEvent,
    ])

    return (
        <>
            <section
            ref={containerRef}
            role="presentation"
            onPointerMove={(event) => updateTargetFromEvent(event.clientX, event.clientY)}
            onPointerDown={(event) => updateTargetFromEvent(event.clientX, event.clientY)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight,
                overflow: "hidden",
                background: overlayOnly ? "transparent" : "#0D0F14",
                touchAction: "none",
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    background: overlayOnly
                        ? "transparent"
                        : `linear-gradient(180deg, rgba(0,0,0,${Math.min(1, safeDarkness + 0.1)}) 0%, rgba(0,0,0,${safeDarkness}) 100%)`,
                    pointerEvents: "none",
                }}
            />

            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                    zIndex: forwardSpotlightActive ? Math.max(1, lampZIndex - 1) : 2,
                }}
            >
                <div
                    ref={coneRef}
                    style={{
                        position: "absolute",
                        transformOrigin: "50% 0%",
                        clipPath: "polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)",
                        background: `linear-gradient(180deg, ${coneTop} 0%, ${coneBottom} 80%, rgba(0,0,0,0) 100%)`,
                        filter: `blur(${Math.max(0.8, safeBlur * 0.4)}px)`,
                        mixBlendMode: blendMode,
                        opacity: isStaticRenderer ? 0.85 : 1,
                        width: isStaticRenderer
                            ? Math.max(
                                  40,
                                  Math.max(1, minHeight * 0.72 - (lampDrop - lampHeight * 0.3 + lampHeight)) *
                                      0.65 *
                                      safeConeWidth
                              )
                            : undefined,
                        height: isStaticRenderer
                            ? Math.max(1, minHeight * 0.72 - (lampDrop - lampHeight * 0.3 + lampHeight))
                            : undefined,
                        left: isStaticRenderer ? "50%" : undefined,
                        top: isStaticRenderer ? lampDrop - lampHeight * 0.3 + lampHeight : undefined,
                        transform: isStaticRenderer ? "translateX(-50%) rotate(0deg)" : undefined,
                        willChange: "transform, width, height, left, top, opacity",
                        pointerEvents: "none",
                        display: forwardSpotlightActive ? "none" : "block",
                    }}
                />
                <div
                    ref={spotlightRef}
                    style={{
                        position: "absolute",
                        borderRadius: "999px",
                        background: `radial-gradient(circle, ${spotlightInner} 0%, ${spotlightMid} ${Math.max(
                            35,
                            100 - safeFeather
                        )}%, ${spotlightOuter} 72%, rgba(0,0,0,0) 100%)`,
                        filter: `blur(${safeBlur * 0.5}px)`,
                        mixBlendMode: blendMode,
                        boxShadow: `0 0 ${Math.max(18, lightRadius * 0.22 * (0.5 + safeIntensity * 0.6 + safeShadow * 0.7))}px ${hexToRgba(
                            lightColor,
                            0.12 * safeIntensity + safeShadow * 0.26
                        )}`,
                        transform: isStaticRenderer
                            ? "translate3d(-50%, -50%, 0)"
                            : "translate3d(-9999px, -9999px, 0)",
                        left: isStaticRenderer ? "50%" : undefined,
                        top: isStaticRenderer ? "72%" : undefined,
                        width: isStaticRenderer ? lightRadius : undefined,
                        height: isStaticRenderer ? lightRadius * 0.95 : undefined,
                        willChange: "transform, width, height, opacity",
                        pointerEvents: "none",
                        display: forwardSpotlightActive ? "none" : "block",
                    }}
                />
                <div
                    ref={bloomRef}
                    style={{
                        position: "absolute",
                        borderRadius: "999px",
                        background: `radial-gradient(circle, ${hexToRgba(lightColor, 0.3)} 0%, ${hexToRgba(
                            lightColor,
                            0.12
                        )} 45%, rgba(0,0,0,0) 75%)`,
                        filter: `blur(${Math.max(2, safeBlur * 1.05)}px)`,
                        mixBlendMode: blendMode,
                        opacity: enableBloom ? safeBloom * safeIntensity * (0.6 + safeShadow * 0.8) : 0,
                        transform: isStaticRenderer
                            ? "translate3d(-50%, -50%, 0)"
                            : "translate3d(-9999px, -9999px, 0)",
                        left: isStaticRenderer ? "50%" : undefined,
                        top: isStaticRenderer ? "72%" : undefined,
                        width: isStaticRenderer ? lightRadius * 1.08 : undefined,
                        height: isStaticRenderer ? lightRadius * 1.08 * 0.95 : undefined,
                        pointerEvents: "none",
                        display: forwardSpotlightActive ? "none" : "block",
                    }}
                />
            </div>

            <div
                ref={cableRef}
                aria-hidden
                style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: "translateX(-50%)",
                    width: lampWidth * 0.22,
                    height: lampDrop - lampHeight * 0.3,
                    background: "linear-gradient(180deg, rgba(70,70,70,0.9), rgba(30,30,30,0.95))",
                    borderRadius: 999,
                    boxShadow: "0 0 1px rgba(255,255,255,0.2)",
                    pointerEvents: "none",
                    display: forwardLampActive ? "none" : "block",
                }}
            />
            <div
                ref={lampGroupRef}
                aria-hidden
                style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: `translate3d(-50%, ${lampDrop - lampHeight * 0.3}px, 0)`,
                    pointerEvents: "none",
                    willChange: "transform",
                    display: forwardLampActive ? "none" : "block",
                }}
            >
                {lampImageSrc ? (
                    <img
                        src={lampImageSrc}
                        srcSet={typeof lampImage === "object" ? lampImage?.srcSet : undefined}
                        alt={typeof lampImage === "object" && lampImage?.alt ? lampImage.alt : ""}
                        style={{
                            width: lampWidth,
                            height: lampHeight,
                            objectFit: "contain",
                            pointerEvents: "none",
                            filter: `drop-shadow(0 ${6 + safeShadow * 10}px ${8 + safeShadow * 20}px rgba(0,0,0,${0.35 + safeShadow * 0.5}))`,
                        }}
                    />
                ) : (
                    renderFallbackLamp()
                )}

                <div
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: lampHeight * 0.76,
                        transform: "translateX(-50%)",
                        width: lampWidth * 0.26,
                        height: lampHeight * 0.2,
                        borderRadius: "0 0 12px 12px",
                        background: `radial-gradient(circle at 50% 0%, ${hexToRgba(lightColor, 0.9)}, ${hexToRgba(lightColor, 0.2)} 70%, rgba(0,0,0,0) 100%)`,
                        filter: `blur(${2 + safeShadow * 3}px)`,
                        pointerEvents: "none",
                    }}
                />
            </div>
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: lampZIndex,
                        display: forwardLampActive ? "block" : "none",
                    }}
                >
                    <div
                        ref={portalCableRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            transform: "translateX(-50%)",
                            width: lampWidth * 0.22,
                            height: lampDrop - lampHeight * 0.3,
                            background: "linear-gradient(180deg, rgba(70,70,70,0.9), rgba(30,30,30,0.95))",
                            borderRadius: 999,
                            boxShadow: "0 0 1px rgba(255,255,255,0.2)",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        ref={portalLampGroupRef}
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: 0,
                            transform: `translate3d(-50%, ${lampDrop - lampHeight * 0.3}px, 0)`,
                            pointerEvents: "none",
                            willChange: "transform",
                        }}
                    >
                        {lampImageSrc ? (
                            <img
                                src={lampImageSrc}
                                srcSet={typeof lampImage === "object" ? lampImage?.srcSet : undefined}
                                alt={typeof lampImage === "object" && lampImage?.alt ? lampImage.alt : ""}
                                style={{
                                    width: lampWidth,
                                    height: lampHeight,
                                    objectFit: "contain",
                                    pointerEvents: "none",
                                    filter: `drop-shadow(0 ${6 + safeShadow * 10}px ${8 + safeShadow * 20}px rgba(0,0,0,${0.35 + safeShadow * 0.5}))`,
                                }}
                            />
                        ) : (
                            renderFallbackLamp()
                        )}

                        <div
                            style={{
                                position: "absolute",
                                left: "50%",
                                top: lampHeight * 0.76,
                                transform: "translateX(-50%)",
                                width: lampWidth * 0.26,
                                height: lampHeight * 0.2,
                                borderRadius: "0 0 12px 12px",
                                background: `radial-gradient(circle at 50% 0%, ${hexToRgba(lightColor, 0.9)}, ${hexToRgba(lightColor, 0.2)} 70%, rgba(0,0,0,0) 100%)`,
                                filter: `blur(${2 + safeShadow * 3}px)`,
                                pointerEvents: "none",
                            }}
                        />
                    </div>
                </div>
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: Math.max(1, lampZIndex - 1),
                        display: forwardSpotlightActive ? "block" : "none",
                    }}
                >
                    <div
                        ref={portalConeRef}
                        style={{
                            position: "absolute",
                            transformOrigin: "50% 0%",
                            clipPath: "polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)",
                            background: `linear-gradient(180deg, ${coneTop} 0%, ${coneBottom} 80%, rgba(0,0,0,0) 100%)`,
                            filter: `blur(${Math.max(0.8, safeBlur * 0.4)}px)`,
                            mixBlendMode: blendMode,
                            willChange: "transform, width, height, left, top, opacity",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        ref={portalSpotlightRef}
                        style={{
                            position: "absolute",
                            borderRadius: "999px",
                            background: `radial-gradient(circle, ${spotlightInner} 0%, ${spotlightMid} ${Math.max(
                                35,
                                100 - safeFeather
                            )}%, ${spotlightOuter} 72%, rgba(0,0,0,0) 100%)`,
                            filter: `blur(${safeBlur * 0.5}px)`,
                            mixBlendMode: blendMode,
                            boxShadow: `0 0 ${Math.max(
                                18,
                                lightRadius * 0.22 * (0.5 + safeIntensity * 0.6 + safeShadow * 0.7)
                            )}px ${hexToRgba(lightColor, 0.12 * safeIntensity + safeShadow * 0.26)}`,
                            pointerEvents: "none",
                            willChange: "transform, width, height, opacity",
                        }}
                    />
                    <div
                        ref={portalBloomRef}
                        style={{
                            position: "absolute",
                            borderRadius: "999px",
                            background: `radial-gradient(circle, ${hexToRgba(lightColor, 0.3)} 0%, ${hexToRgba(
                                lightColor,
                                0.12
                            )} 45%, rgba(0,0,0,0) 75%)`,
                            filter: `blur(${Math.max(2, safeBlur * 1.05)}px)`,
                            mixBlendMode: blendMode,
                            pointerEvents: "none",
                        }}
                    />
                </div>
            </section>
        </>
    )
}

InteractiveSpotlight.displayName = "Interactive Spotlight"

addPropertyControls(InteractiveSpotlight, {
    lampImage: {
        type: ControlType.ResponsiveImage,
        title: "Lamp Image",
    },
    lampWidth: {
        type: ControlType.Number,
        title: "Lamp Width",
        defaultValue: 74,
        min: 24,
        max: 360,
        step: 1,
        unit: "px",
    },
    lampHeight: {
        type: ControlType.Number,
        title: "Lamp Height",
        defaultValue: 44,
        min: 16,
        max: 260,
        step: 1,
        unit: "px",
    },
    ambientDarkness: {
        type: ControlType.Number,
        title: "Ambient Darkness",
        defaultValue: 0.62,
        min: 0,
        max: 1,
        step: 0.01,
    },
    overlayOnly: {
        type: ControlType.Boolean,
        title: "Overlay Only",
        defaultValue: false,
    },
    lightColor: {
        type: ControlType.Color,
        title: "Light",
        defaultValue: "#FFD9A3",
    },
    lightRadius: {
        type: ControlType.Number,
        title: "Light Radius",
        defaultValue: 360,
        min: 120,
        max: 900,
        step: 1,
    },
    featherAmount: {
        type: ControlType.Number,
        title: "Feather Amount",
        defaultValue: 52,
        min: 0,
        max: 100,
        step: 1,
    },
    coneWidth: {
        type: ControlType.Number,
        title: "Cone Width",
        defaultValue: 1,
        min: 0.35,
        max: 2.5,
        step: 0.01,
    },
    coneOpacity: {
        type: ControlType.Number,
        title: "Cone Opacity",
        defaultValue: 0.34,
        min: 0,
        max: 1,
        step: 0.01,
    },
    mouseSmoothness: {
        type: ControlType.Number,
        title: "Mouse Smoothness",
        defaultValue: 42,
        min: 0,
        max: 100,
        step: 1,
    },
    lightIntensity: {
        type: ControlType.Number,
        title: "Light Intensity",
        defaultValue: 0.78,
        min: 0,
        max: 1,
        step: 0.01,
    },
    enableBloom: {
        type: ControlType.Boolean,
        title: "Enable Bloom",
        defaultValue: true,
    },
    enableIdleAnimation: {
        type: ControlType.Boolean,
        title: "Enable Idle Animation",
        defaultValue: false,
    },
    shadowStrength: {
        type: ControlType.Number,
        title: "Shadow Strength",
        defaultValue: 0.55,
        min: 0,
        max: 1,
        step: 0.01,
    },
    stickyLamp: {
        type: ControlType.Boolean,
        title: "Sticky Lamp",
        defaultValue: true,
    },
    stickyTop: {
        type: ControlType.Number,
        title: "Sticky Top",
        defaultValue: 0,
        min: 0,
        max: 240,
        step: 1,
        unit: "px",
        hidden: (props) => !props.stickyLamp,
    },
    viewportTracking: {
        type: ControlType.Boolean,
        title: "Viewport Tracking",
        defaultValue: true,
    },
    touchMode: {
        type: ControlType.Enum,
        title: "Touch Mode",
        defaultValue: "auto-sweep",
        options: ["auto-sweep", "center", "off"],
        optionTitles: ["Auto Sweep", "Center", "Off"],
    },
    spotlightLayer: {
        type: ControlType.Enum,
        title: "Spotlight",
        defaultValue: "behind",
        options: ["behind", "forward"],
        optionTitles: ["Behind", "Forward"],
    },
    lampOnTop: {
        type: ControlType.Boolean,
        title: "Lamp On Top",
        defaultValue: true,
    },
    lampZIndex: {
        type: ControlType.Number,
        title: "Lamp Z",
        defaultValue: 20,
        min: 1,
        max: 999,
        step: 1,
        hidden: (props) => !props.lampOnTop,
    },
    blendMode: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "screen",
        options: ["screen", "plus-lighter", "overlay", "normal"],
        optionTitles: ["Screen", "Plus Lighter", "Overlay", "Normal"],
    },
    minHeight: {
        type: ControlType.Number,
        title: "Min Height",
        defaultValue: 520,
        min: 240,
        max: 1400,
        step: 10,
        unit: "px",
    },
})