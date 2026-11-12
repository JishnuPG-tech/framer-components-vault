import * as React from "react"
import { useInView, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface VortexGlassProps {
    responsiveScale: boolean
    baseWidth: number
    backgroundColor: string
    backgroundImage: string
    backgroundFit: "cover" | "contain" | "fill"
    backgroundOpacity: number
    lineColor: string
    lineGlassStyle: boolean
    lineCount: number
    innerRadius: number
    outerRadius: number
    swirlAngle: number
    spinDirection: "right" | "left"
    spinDuration: number
    lineWidth: number
    lineHeight: number
    coneHeight: number
    discTilt: number
    discScale: number
    discOffsetY: number
    showCard: boolean
    fullGlassCard: boolean
    enableCardHover: boolean
    cardLink: string
    openInNewTab: boolean
    cardSize: number
    cardOffsetY: number
    cardRotateX: number
    cardTiltZ: number
    cardColor: string
    glassOpacity: number
    glassBlur: number
    customIcon: string
    tintCustomIcon: boolean
    iconColor: string
    floatRange: number
    floatDuration: number
    style?: React.CSSProperties
}

const FRAMER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black"><path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z"/></svg>`
const FRAMER_MASK_URL = `data:image/svg+xml;utf8,${encodeURIComponent(FRAMER_SVG)}`

const SAFE_DATA_IMAGE_REGEX =
    /^data:image\/(png|jpeg|jpg|webp|gif|avif|svg\+xml);/i

function sanitizeImageUrl(url: string | undefined): string {
    if (!url || typeof url !== "string") return ""
    const trimmed = url.trim()
    if (!trimmed) return ""

    if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) {
        if (/script|javascript:|on\w+=/i.test(trimmed)) return ""
        return trimmed
    }

    try {
        const parsed = new URL(
            trimmed,
            typeof window !== "undefined"
                ? window.location.origin
                : "https://framer.com"
        )
        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:" ||
            parsed.protocol === "blob:"
        ) {
            return trimmed
        }
    } catch {
        return ""
    }

    return ""
}

function sanitizeLinkUrl(url: string | undefined): string {
    if (!url || typeof url !== "string") return ""
    const trimmed = url.trim()
    if (!trimmed) return ""

    if (
        trimmed.startsWith("/") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("./")
    ) {
        return trimmed
    }

    try {
        const parsed = new URL(
            trimmed,
            typeof window !== "undefined"
                ? window.location.origin
                : "https://framer.com"
        )
        if (
            parsed.protocol === "https:" ||
            parsed.protocol === "http:" ||
            parsed.protocol === "mailto:" ||
            parsed.protocol === "tel:"
        ) {
            return trimmed
        }
    } catch {
        return ""
    }

    return ""
}

function renderIcon(safeIconUrl: string, tintCustom: boolean, color: string) {
    if (safeIconUrl) {
        if (!tintCustom) {
            return (
                <img
                    src={safeIconUrl}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            )
        }
        return (
            <div
                aria-hidden="true"
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: color,
                    WebkitMaskImage: `url("${safeIconUrl}")`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: `url("${safeIconUrl}")`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                }}
            />
        )
    }

    return (
        <div
            aria-hidden="true"
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: color,
                WebkitMaskImage: `url("${FRAMER_MASK_URL}")`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url("${FRAMER_MASK_URL}")`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
            }}
        />
    )
}

interface BarFace {
    type: "sideL" | "sideR" | "endIn" | "endOut" | "top"
    points: string
    z: number
}

interface BarItem {
    id: number
    depthKey: number
    faces: BarFace[]
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 */
export default function VortexGlass(props: VortexGlassProps) {
    const {
        responsiveScale = true,
        baseWidth = 1200,
        backgroundColor = "#08080A",
        backgroundImage = "",
        backgroundFit = "cover",
        backgroundOpacity = 100,
        lineColor = "#FFFFFF",
        lineGlassStyle = true,
        lineCount = 50,
        innerRadius = 106,
        outerRadius = 420,
        swirlAngle = 0,
        spinDirection = "left",
        spinDuration = 28,
        lineWidth = 1,
        lineHeight = 9,
        coneHeight = 45,
        discTilt = 76,
        discScale = 1.8,
        discOffsetY = 175,
        showCard = true,
        fullGlassCard = true,
        enableCardHover = true,
        cardLink = "",
        openInNewTab = true,
        cardSize = 196,
        cardOffsetY = -70,
        cardRotateX = 0,
        cardTiltZ = 24,
        cardColor = "#1D63FF",
        glassOpacity = 22,
        glassBlur = 16,
        customIcon = "",
        tintCustomIcon = false,
        iconColor = "#FFFFFF",
        floatRange = 14,
        floatDuration = 3.8,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const containerRef = React.useRef<HTMLDivElement>(null)
    const barsGroupRef = React.useRef<SVGGElement>(null)
    const inViewFromHook = useInView(containerRef, { margin: "50px" })
    const [isIntersecting, setIsIntersecting] = React.useState(true)
    const [hovered, setHovered] = React.useState(false)
    const [focused, setFocused] = React.useState(false)
    const [autoRatio, setAutoRatio] = React.useState(1)

    const angleRef = React.useRef(0)

    const rawId = React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const topFillGradId = `vortex-top-${rawId}`
    const sideLFillGradId = `vortex-sidel-${rawId}`
    const sideRFillGradId = `vortex-sider-${rawId}`
    const rimStrokeGradId = `vortex-rim-${rawId}`
    const focusScopeClass = `vortex-card-link-${rawId}`

    React.useEffect(() => {
        if (isStatic || typeof IntersectionObserver === "undefined") return
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => setIsIntersecting(entry.isIntersecting),
            { rootMargin: "50px 0px 50px 0px", threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return

        const updateSize = () => {
            const w = el.clientWidth
            if (w > 0) {
                setAutoRatio(w / Math.max(320, baseWidth))
            }
        }

        updateSize()

        if (typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver(updateSize)
            ro.observe(el)
            return () => ro.disconnect()
        } else {
            window.addEventListener("resize", updateSize)
            return () => window.removeEventListener("resize", updateSize)
        }
    }, [baseWidth, isStatic])

    const isInView = isStatic ? true : inViewFromHook && isIntersecting
    const shouldAnimate = !isStatic && isInView && !prefersReducedMotion
    const dirSign = spinDirection === "right" ? 1 : -1

    const safeBgImage = React.useMemo(
        () => sanitizeImageUrl(backgroundImage),
        [backgroundImage]
    )
    const safeCustomIcon = React.useMemo(
        () => sanitizeImageUrl(customIcon),
        [customIcon]
    )
    const safeCardLink = React.useMemo(
        () => (enableCardHover ? sanitizeLinkUrl(cardLink) : ""),
        [enableCardHover, cardLink]
    )

    const isInteractive = Boolean(enableCardHover && safeCardLink)
    const isCardActive =
        isInteractive &&
        !isStatic &&
        !prefersReducedMotion &&
        (hovered || focused)

    const buildBarsData = React.useCallback(
        (currentAngle: number): BarItem[] => {
            const count = Math.max(8, Math.min(140, lineCount))
            const signedSwirlRad = (dirSign * swirlAngle * Math.PI) / 180
            const tiltRad = (discTilt * Math.PI) / 180
            const cosT = Math.cos(tiltRad)
            const sinT = Math.sin(tiltRad)
            const cx = 400
            const cy = 400
            const fov = 950

            const halfWOut = Math.max(0.4, lineWidth / 2)
            const innerScaleRatio = Math.max(
                0.22,
                Math.min(0.65, innerRadius / Math.max(1, outerRadius))
            )
            const halfWIn = Math.max(0.25, halfWOut * innerScaleRatio)
            const hOut = Math.max(0, lineHeight)
            const hIn = Math.max(0, lineHeight * innerScaleRatio)

            const project = (x: number, y: number, z: number) => {
                const yr = y * cosT - z * sinT
                const zr = y * sinT + z * cosT
                const s = fov / Math.max(220, fov - zr)
                return {
                    px: cx + x * s,
                    py: cy + yr * s,
                    zr,
                }
            }

            const fmtQuad = (
                a: { px: number; py: number },
                b: { px: number; py: number },
                c: { px: number; py: number },
                d: { px: number; py: number }
            ) =>
                `${a.px.toFixed(1)},${a.py.toFixed(1)} ${b.px.toFixed(1)},${b.py.toFixed(1)} ${c.px.toFixed(1)},${c.py.toFixed(1)} ${d.px.toFixed(1)},${d.py.toFixed(1)}`

            const result: BarItem[] = []

            for (let i = 0; i < count; i++) {
                const theta1 = (i / count) * Math.PI * 2 + currentAngle
                const theta2 = theta1 + signedSwirlRad

                const x1 = innerRadius * Math.cos(theta1)
                const y1 = innerRadius * Math.sin(theta1)
                const z1 = coneHeight

                const x2 = outerRadius * Math.cos(theta2)
                const y2 = outerRadius * Math.sin(theta2)
                const z2 = 0

                const dx = x2 - x1
                const dy = y2 - y1
                const len = Math.hypot(dx, dy) || 1
                const nx = -dy / len
                const ny = dx / len

                const t1L = project(x1 + nx * halfWIn, y1 + ny * halfWIn, z1)
                const t1R = project(x1 - nx * halfWIn, y1 - ny * halfWIn, z1)
                const t2R = project(x2 - nx * halfWOut, y2 - ny * halfWOut, z2)
                const t2L = project(x2 + nx * halfWOut, y2 + ny * halfWOut, z2)

                const t1C = project(x1, y1, z1)
                const t2C = project(x2, y2, z2)

                const faces: BarFace[] = []

                if (hOut > 0.1) {
                    const b1L = project(
                        x1 + nx * halfWIn,
                        y1 + ny * halfWIn,
                        z1 - hIn
                    )
                    const b1R = project(
                        x1 - nx * halfWIn,
                        y1 - ny * halfWIn,
                        z1 - hIn
                    )
                    const b2R = project(
                        x2 - nx * halfWOut,
                        y2 - ny * halfWOut,
                        z2 - hOut
                    )
                    const b2L = project(
                        x2 + nx * halfWOut,
                        y2 + ny * halfWOut,
                        z2 - hOut
                    )

                    faces.push(
                        {
                            type: "sideL",
                            points: fmtQuad(t1L, t2L, b2L, b1L),
                            z: (t1L.zr + t2L.zr + b2L.zr + b1L.zr) * 0.25,
                        },
                        {
                            type: "sideR",
                            points: fmtQuad(t1R, t2R, b2R, b1R),
                            z: (t1R.zr + t2R.zr + b2R.zr + b1R.zr) * 0.25,
                        },
                        {
                            type: "endIn",
                            points: fmtQuad(t1L, t1R, b1R, b1L),
                            z: (t1L.zr + t1R.zr + b1R.zr + b1L.zr) * 0.25,
                        },
                        {
                            type: "endOut",
                            points: fmtQuad(t2R, t2L, b2L, b2R),
                            z: (t2R.zr + t2L.zr + b2L.zr + b2R.zr) * 0.25,
                        }
                    )
                    faces.sort((a, b) => a.z - b.z)
                }

                faces.push({
                    type: "top",
                    points: fmtQuad(t1L, t2L, t2R, t1R),
                    z: (t1L.zr + t2L.zr + t2R.zr + t1R.zr) * 0.25 + 1000,
                })

                const depthKey = (t1C.zr + t2C.zr) * 0.5

                result.push({
                    id: i,
                    depthKey,
                    faces,
                })
            }

            result.sort((a, b) => a.depthKey - b.depthKey)
            return result
        },
        [
            lineCount,
            innerRadius,
            outerRadius,
            swirlAngle,
            dirSign,
            lineWidth,
            lineHeight,
            coneHeight,
            discTilt,
        ]
    )

    const initialBars = React.useMemo(
        () => buildBarsData(angleRef.current),
        [buildBarsData]
    )

    React.useEffect(() => {
        if (!shouldAnimate || spinDuration <= 0) return
        const groupEl = barsGroupRef.current
        if (!groupEl) return

        let frameId = 0
        let lastTime = 0

        const fillForFace = (type: BarFace["type"]) =>
            type === "top"
                ? `url(#${topFillGradId})`
                : type === "sideL" || type === "endOut"
                  ? `url(#${sideLFillGradId})`
                  : `url(#${sideRFillGradId})`

        const strokeVal = (fillUrl: string) =>
            lineGlassStyle ? `url(#${rimStrokeGradId})` : fillUrl

        const tick = (now: number) => {
            if (lastTime === 0) lastTime = now
            const dt = Math.min(0.06, (now - lastTime) / 1000)
            lastTime = now

            const baseSpeed = dirSign * ((Math.PI * 2) / spinDuration)
            angleRef.current =
                (angleRef.current + baseSpeed * dt) % (Math.PI * 2)

            const updatedBars = buildBarsData(angleRef.current)
            const children = groupEl.children

            for (let bIdx = 0; bIdx < updatedBars.length; bIdx++) {
                const barGroup = children[bIdx]
                if (!barGroup) continue
                const barData = updatedBars[bIdx]
                const polyNodes = barGroup.children
                for (let fIdx = 0; fIdx < barData.faces.length; fIdx++) {
                    const poly = polyNodes[fIdx]
                    if (!poly) continue
                    const face = barData.faces[fIdx]
                    const fUrl = fillForFace(face.type)
                    poly.setAttribute("points", face.points)
                    poly.setAttribute("fill", fUrl)
                    poly.setAttribute("stroke", strokeVal(fUrl))
                }
            }

            frameId = requestAnimationFrame(tick)
        }

        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [
        shouldAnimate,
        spinDuration,
        dirSign,
        buildBarsData,
        lineGlassStyle,
        topFillGradId,
        sideLFillGradId,
        sideRFillGradId,
        rimStrokeGradId,
    ])

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLElement>) => {
            if (!isInteractive || isStatic) return
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                window.open(
                    safeCardLink,
                    openInNewTab ? "_blank" : "_self",
                    "noopener,noreferrer"
                )
            }
        },
        [isInteractive, safeCardLink, openInNewTab, isStatic]
    )

    const outerRadiusPx = Math.round(cardSize * 0.27)
    const innerRadiusPx = Math.round(cardSize * 0.22)
    const glassAlpha = (glassOpacity / 100).toFixed(2)
    const tiltRad = (discTilt * Math.PI) / 180
    const holeCenterShiftY = -coneHeight * Math.sin(tiltRad) * discScale
    const currentScale = isCardActive ? 1.07 : 1
    const stageScale = responsiveScale ? autoRatio : 1

    const cardNode = (
        <div
            onMouseEnter={() => isInteractive && !isStatic && setHovered(true)}
            onMouseLeave={() => isInteractive && !isStatic && setHovered(false)}
            style={{
                width: cardSize,
                height: cardSize,
                position: "relative",
                transformStyle: "preserve-3d",
                transform: `perspective(1000px) rotateX(${cardRotateX}deg) rotateZ(${cardTiltZ}deg) scale(${currentScale})`,
                transition:
                    !isStatic && isInteractive && !prefersReducedMotion
                        ? "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)"
                        : "none",
                cursor: isInteractive ? "pointer" : "default",
            }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: outerRadiusPx,
                    backgroundColor: `rgba(255, 255, 255, ${(glassOpacity * 0.005).toFixed(3)})`,
                    backgroundImage:
                        "linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.45) 100%)",
                    boxShadow:
                        "0 28px 50px rgba(0, 0, 0, 0.7), inset 0 0 0 1.5px rgba(255, 255, 255, 0.35)",
                    transform: "translate3d(4px, 8px, -14px)",
                    pointerEvents: "none",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            />

            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: outerRadiusPx,
                    backgroundColor: `rgba(255, 255, 255, ${(glassOpacity * 0.007).toFixed(3)})`,
                    backgroundImage:
                        "linear-gradient(145deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 55%, rgba(148,163,184,0.28) 100%)",
                    transform: "translate3d(2px, 4px, -7px)",
                    pointerEvents: "none",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            />

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: outerRadiusPx,
                    backgroundColor: `rgba(255, 255, 255, ${glassAlpha})`,
                    backdropFilter: `blur(${glassBlur}px) saturate(160%)`,
                    WebkitBackdropFilter: `blur(${glassBlur}px) saturate(160%)`,
                    backgroundImage:
                        "radial-gradient(circle at 20% 16%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.24) 38%, rgba(255,255,255,0) 68%), linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.24) 44%, rgba(255,255,255,0.08) 68%, rgba(255,255,255,0.4) 100%)",
                    boxShadow:
                        "inset 0 0 0 1.5px rgba(255, 255, 255, 0.88), inset 3px 4px 12px rgba(255, 255, 255, 0.7), inset -3px -4px 12px rgba(15, 23, 42, 0.22)",
                    padding: fullGlassCard
                        ? Math.round(cardSize * 0.28)
                        : Math.round(cardSize * 0.135),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    transform: "translate3d(0, 0, 0)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                {fullGlassCard ? (
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1,
                        }}
                    >
                        {renderIcon(safeCustomIcon, tintCustomIcon, iconColor)}
                    </div>
                ) : (
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            borderRadius: innerRadiusPx,
                            backgroundColor: cardColor,
                            backgroundImage:
                                "radial-gradient(circle at 28% 22%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0) 58%), linear-gradient(145deg, rgba(255,255,255,0.24) 0%, rgba(0,0,0,0.26) 100%)",
                            boxShadow:
                                "0 8px 18px rgba(0, 0, 0, 0.36), inset 2px 2px 5px rgba(255, 255, 255, 0.65), inset -2px -3px 6px rgba(0, 0, 0, 0.32)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: Math.round(cardSize * 0.2),
                            zIndex: 1,
                        }}
                    >
                        {renderIcon(safeCustomIcon, tintCustomIcon, iconColor)}
                    </div>
                )}

                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: outerRadiusPx,
                        background:
                            "linear-gradient(152deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 28%, rgba(255,255,255,0) 54%)",
                        pointerEvents: "none",
                        zIndex: 2,
                    }}
                />
            </div>
        </div>
    )

    return (
        <div
            ref={containerRef}
            role="region"
            aria-label="3D Vortex Glass Showcase"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: backgroundColor,
                perspective: "1200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
                ["--vh-float-neg" as string]: `${-floatRange}px`,
                ["--vh-float-pos" as string]: `${floatRange}px`,
                ...style,
            }}
        >
            <style>{`
                @keyframes vh-float {
                    0%, 100% { transform: translate3d(0, var(--vh-float-neg, -14px), 0); }
                    50% { transform: translate3d(0, var(--vh-float-pos, 14px), 0); }
                }
                @keyframes vh-shadow-pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(0.88); opacity: 0.6; }
                    50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.32; }
                }
                .${focusScopeClass}:focus-visible {
                    outline: 3px solid #FFFFFF;
                    outline-offset: 8px;
                    border-radius: ${outerRadiusPx}px;
                }
            `}</style>

            {safeBgImage && (
                <img
                    src={safeBgImage}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: backgroundFit,
                        opacity: backgroundOpacity / 100,
                        pointerEvents: "none",
                        zIndex: 1,
                    }}
                />
            )}

            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transform: `scale(${stageScale})`,
                    transformStyle: "preserve-3d",
                    zIndex: 3,
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: discOffsetY,
                        width: 800,
                        height: 800,
                        marginLeft: -400,
                        marginTop: -400,
                        transform: `scale(${discScale})`,
                        pointerEvents: "none",
                        zIndex: 3,
                    }}
                >
                    <svg
                        viewBox="0 0 800 800"
                        width="100%"
                        height="100%"
                        style={{
                            overflow: "visible",
                            display: "block",
                            pointerEvents: "none",
                        }}
                    >
                        <defs>
                            <radialGradient
                                id={topFillGradId}
                                cx="400"
                                cy="400"
                                r={outerRadius}
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.18" : "0.3"
                                    }
                                />
                                <stop
                                    offset="50%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.58" : "0.82"
                                    }
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#FFFFFF"
                                    stopOpacity={lineGlassStyle ? "0.95" : "1"}
                                />
                            </radialGradient>

                            <radialGradient
                                id={sideLFillGradId}
                                cx="400"
                                cy="400"
                                r={outerRadius}
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.06" : "0.14"
                                    }
                                />
                                <stop
                                    offset="55%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.32" : "0.5"
                                    }
                                />
                                <stop
                                    offset="100%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.58" : "0.75"
                                    }
                                />
                            </radialGradient>

                            <radialGradient
                                id={sideRFillGradId}
                                cx="400"
                                cy="400"
                                r={outerRadius}
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop
                                    offset="0%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.04" : "0.09"
                                    }
                                />
                                <stop
                                    offset="55%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.2" : "0.35"
                                    }
                                />
                                <stop
                                    offset="100%"
                                    stopColor={lineColor}
                                    stopOpacity={
                                        lineGlassStyle ? "0.42" : "0.58"
                                    }
                                />
                            </radialGradient>

                            <radialGradient
                                id={rimStrokeGradId}
                                cx="400"
                                cy="400"
                                r={outerRadius}
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#FFFFFF"
                                    stopOpacity="0.15"
                                />
                                <stop
                                    offset="55%"
                                    stopColor="#FFFFFF"
                                    stopOpacity="0.65"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#FFFFFF"
                                    stopOpacity="0.98"
                                />
                            </radialGradient>
                        </defs>

                        <g ref={barsGroupRef}>
                            {initialBars.map((bar) => (
                                <g key={bar.id}>
                                    {bar.faces.map((face, fIdx) => {
                                        const fillUrl =
                                            face.type === "top"
                                                ? `url(#${topFillGradId})`
                                                : face.type === "sideL" ||
                                                    face.type === "endOut"
                                                  ? `url(#${sideLFillGradId})`
                                                  : `url(#${sideRFillGradId})`
                                        return (
                                            <polygon
                                                key={fIdx}
                                                points={face.points}
                                                fill={fillUrl}
                                                stroke={
                                                    lineGlassStyle
                                                        ? `url(#${rimStrokeGradId})`
                                                        : fillUrl
                                                }
                                                strokeWidth={
                                                    lineGlassStyle ? 0.5 : 0.3
                                                }
                                                strokeLinejoin="round"
                                            />
                                        )
                                    })}
                                </g>
                            ))}
                        </g>
                    </svg>
                </div>

                {showCard && (
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: discOffsetY + holeCenterShiftY,
                            width: innerRadius * 2 * discScale,
                            height:
                                innerRadius *
                                2 *
                                Math.max(0.25, Math.cos(tiltRad)) *
                                discScale,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 48%, rgba(0,0,0,0) 74%)",
                            pointerEvents: "none",
                            zIndex: 4,
                            animation: shouldAnimate
                                ? `vh-shadow-pulse ${floatDuration}s ease-in-out infinite`
                                : "none",
                            animationPlayState: isCardActive
                                ? "paused"
                                : "running",
                            transform: "translate(-50%, -50%)",
                        }}
                    />
                )}

                {showCard && (
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            top: cardOffsetY,
                            marginLeft: -cardSize / 2,
                            marginTop: -cardSize / 2,
                            transformStyle: "preserve-3d",
                            zIndex: 10,
                        }}
                    >
                        <div
                            style={{
                                transformStyle: "preserve-3d",
                                willChange: shouldAnimate
                                    ? "transform"
                                    : undefined,
                                animation:
                                    shouldAnimate && floatRange > 0
                                        ? `vh-float ${floatDuration}s ease-in-out infinite`
                                        : "none",
                                animationPlayState: isCardActive
                                    ? "paused"
                                    : "running",
                            }}
                        >
                            {isInteractive ? (
                                <a
                                    href={safeCardLink}
                                    target={openInNewTab ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className={focusScopeClass}
                                    tabIndex={isStatic ? -1 : 0}
                                    aria-label="Open Featured Brand Link"
                                    onFocus={() =>
                                        !isStatic && setFocused(true)
                                    }
                                    onBlur={() =>
                                        !isStatic && setFocused(false)
                                    }
                                    onKeyDown={handleKeyDown}
                                    style={{
                                        display: "block",
                                        textDecoration: "none",
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    {cardNode}
                                </a>
                            ) : (
                                <div
                                    role="img"
                                    aria-label="Featured Glass Brand Card"
                                    style={{ transformStyle: "preserve-3d" }}
                                >
                                    {cardNode}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

addPropertyControls(VortexGlass, {
    responsiveScale: {
        type: ControlType.Boolean,
        title: "Responsive",
        defaultValue: true,
    },
    baseWidth: {
        type: ControlType.Number,
        title: "Canvas Width",
        min: 600,
        max: 1920,
        step: 10,
        defaultValue: 1200,
        unit: "px",
        hidden: (props) => !props.responsiveScale,
    },
    backgroundImage: {
        type: ControlType.Image,
        title: "Bg Image",
    },
    backgroundFit: {
        type: ControlType.Enum,
        title: "Bg Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        hidden: (props) => !props.backgroundImage,
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "Bg Opacity",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 100,
        unit: "%",
        hidden: (props) => !props.backgroundImage,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Canvas Bg",
        defaultValue: "#08080A",
    },
    showCard: {
        type: ControlType.Boolean,
        title: "Show Card",
        defaultValue: true,
    },
    fullGlassCard: {
        type: ControlType.Boolean,
        title: "Full Glass Card",
        defaultValue: true,
        hidden: (props) => !props.showCard,
    },
    enableCardHover: {
        type: ControlType.Boolean,
        title: "Card Hover",
        defaultValue: true,
        hidden: (props) => !props.showCard,
    },
    cardLink: {
        type: ControlType.String,
        title: "Card Link",
        defaultValue: "",
        hidden: (props) => !props.showCard || !props.enableCardHover,
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: true,
        hidden: (props) =>
            !props.showCard || !props.enableCardHover || !props.cardLink,
    },
    customIcon: {
        type: ControlType.Image,
        title: "Upload Logo",
        hidden: (props) => !props.showCard,
    },
    tintCustomIcon: {
        type: ControlType.Boolean,
        title: "Tint Upload",
        defaultValue: false,
        hidden: (props) => !props.showCard || !props.customIcon,
    },
    cardColor: {
        type: ControlType.Color,
        title: "Core Color",
        defaultValue: "#1D63FF",
        hidden: (props) => !props.showCard || props.fullGlassCard,
    },
    iconColor: {
        type: ControlType.Color,
        title: "Logo Color",
        defaultValue: "#FFFFFF",
        hidden: (props) =>
            !props.showCard ||
            (Boolean(props.customIcon) && !props.tintCustomIcon),
    },
    glassOpacity: {
        type: ControlType.Number,
        title: "Glass Frost",
        min: 5,
        max: 75,
        step: 1,
        defaultValue: 22,
        unit: "%",
        hidden: (props) => !props.showCard,
    },
    glassBlur: {
        type: ControlType.Number,
        title: "Glass Blur",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 16,
        unit: "px",
        hidden: (props) => !props.showCard,
    },
    cardSize: {
        type: ControlType.Number,
        title: "Card Size",
        min: 90,
        max: 280,
        step: 2,
        defaultValue: 196,
        unit: "px",
        hidden: (props) => !props.showCard,
    },
    cardOffsetY: {
        type: ControlType.Number,
        title: "Card Pos Y",
        min: -250,
        max: 250,
        step: 2,
        defaultValue: -70,
        unit: "px",
        hidden: (props) => !props.showCard,
    },
    cardRotateX: {
        type: ControlType.Number,
        title: "Card Pitch X",
        min: -35,
        max: 45,
        step: 1,
        defaultValue: 0,
        unit: "deg",
        hidden: (props) => !props.showCard,
    },
    cardTiltZ: {
        type: ControlType.Number,
        title: "Card Tilt Z",
        min: -45,
        max: 45,
        step: 1,
        defaultValue: 24,
        unit: "deg",
        hidden: (props) => !props.showCard,
    },
    floatRange: {
        type: ControlType.Number,
        title: "Float Range",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 14,
        unit: "px",
        hidden: (props) => !props.showCard,
    },
    floatDuration: {
        type: ControlType.Number,
        title: "Float Speed",
        min: 1.5,
        max: 8,
        step: 0.1,
        defaultValue: 3.8,
        unit: "s",
        hidden: (props) => !props.showCard,
    },
    lineGlassStyle: {
        type: ControlType.Boolean,
        title: "Glass Lines",
        defaultValue: true,
    },
    lineColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "#FFFFFF",
    },
    lineCount: {
        type: ControlType.Number,
        title: "Line Count",
        min: 12,
        max: 120,
        step: 2,
        defaultValue: 50,
    },
    lineWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 1,
        max: 18,
        step: 0.5,
        defaultValue: 1,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        min: 0,
        max: 80,
        step: 1,
        defaultValue: 9,
        unit: "px",
    },
    spinDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["right", "left"],
        optionTitles: ["Right", "Left"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    swirlAngle: {
        type: ControlType.Number,
        title: "Swirl Angle",
        min: 0,
        max: 140,
        step: 1,
        defaultValue: 0,
        unit: "deg",
    },
    spinDuration: {
        type: ControlType.Number,
        title: "Spin Speed",
        min: 0,
        max: 90,
        step: 1,
        defaultValue: 28,
        unit: "s",
    },
    coneHeight: {
        type: ControlType.Number,
        title: "Center Cone",
        min: -220,
        max: 220,
        step: 5,
        defaultValue: 45,
        unit: "px",
    },
    innerRadius: {
        type: ControlType.Number,
        title: "Hole Radius",
        min: 20,
        max: 220,
        step: 2,
        defaultValue: 106,
        unit: "px",
    },
    outerRadius: {
        type: ControlType.Number,
        title: "Disc Radius",
        min: 180,
        max: 420,
        step: 5,
        defaultValue: 420,
        unit: "px",
    },
    discTilt: {
        type: ControlType.Number,
        title: "Disc Tilt",
        min: 0,
        max: 82,
        step: 1,
        defaultValue: 76,
        unit: "deg",
    },
    discScale: {
        type: ControlType.Number,
        title: "Disc Scale",
        min: 0.5,
        max: 1.8,
        step: 0.05,
        defaultValue: 1.8,
    },
    discOffsetY: {
        type: ControlType.Number,
        title: "Disc Pos Y",
        min: -200,
        max: 320,
        step: 5,
        defaultValue: 175,
        unit: "px",
    },
})
