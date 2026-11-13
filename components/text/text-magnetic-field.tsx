// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    CSSProperties,
} from "react"

// =============================================================================
// TYPES
// =============================================================================

type TextAlign = "left" | "center" | "right"
type FieldMode = "repel" | "attract" | "vortex"
type Theme =
    | "custom"
    | "plasma"
    | "arctic"
    | "solar"
    | "phantom"
    | "neon"
    | "monochrome"

interface ColorsConfig {
    textColor: string
    wakeColorA: string
    wakeColorB: string
}

interface FieldConfig {
    mode: FieldMode
    radius: number
    strength: number
    elasticity: number
    rotation: number
}

interface WakeConfig {
    enabled: boolean
    intensity: number
    decay: number
}

interface Props {
    text: string
    fontFamily?: {
        fontFamily?: string
        fontWeight?: number | string
    }
    fontSize: number
    letterSpacing: number
    lineHeight: number
    textAlign: TextAlign
    uppercase: boolean
    theme: Theme
    colors: ColorsConfig
    field: FieldConfig
    wake: WakeConfig
    idleAnimation: boolean
    style?: CSSProperties
}

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

interface ThemeValues {
    textColor: string
    wakeColorA: string
    wakeColorB: string
}

const THEMES: Record<Exclude<Theme, "custom">, ThemeValues> = {
    plasma: {
        textColor: "#E0E0FF",
        wakeColorA: "#A855F7",
        wakeColorB: "#EC4899",
    },
    arctic: {
        textColor: "#E0F2FE",
        wakeColorA: "#38BDF8",
        wakeColorB: "#67E8F9",
    },
    solar: {
        textColor: "#FFF7ED",
        wakeColorA: "#F97316",
        wakeColorB: "#FACC15",
    },
    phantom: {
        textColor: "#F1F5F9",
        wakeColorA: "#94A3B8",
        wakeColorB: "#CBD5E1",
    },
    neon: {
        textColor: "#F0FDF4",
        wakeColorA: "#22C55E",
        wakeColorB: "#06B6D4",
    },
    monochrome: {
        textColor: "#F5F5F5",
        wakeColorA: "#A3A3A3",
        wakeColorB: "#D4D4D4",
    },
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_FONT =
    "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif"

// =============================================================================
// COLOR UTILITIES
// =============================================================================

function parseColor(color: string): { r: number; g: number; b: number } | null {
    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i)
    if (hexMatch) {
        let hex = hexMatch[1]
        if (hex.length === 3)
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16),
        }
    }
    const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1]),
            g: parseInt(rgbMatch[2]),
            b: parseInt(rgbMatch[3]),
        }
    }
    return null
}

function lerpColor(colorA: string, colorB: string, t: number): string {
    const a = parseColor(colorA) || { r: 255, g: 255, b: 255 }
    const b = parseColor(colorB) || { r: 200, g: 200, b: 200 }
    const clamped = Math.max(0, Math.min(1, t))
    const r = Math.round(a.r + (b.r - a.r) * clamped)
    const g = Math.round(a.g + (b.g - a.g) * clamped)
    const bl = Math.round(a.b + (b.b - a.b) * clamped)
    return `rgb(${r}, ${g}, ${bl})`
}

// =============================================================================
// CHARACTER DATA
// =============================================================================

interface CharInfo {
    char: string
    isSpace: boolean
    waveIndex: number
    lineIndex: number
}

function buildCharData(lines: string[]): {
    charsByLine: CharInfo[][]
    totalNonSpace: number
} {
    let idx = 0
    const charsByLine = lines.map((line, lineIndex) =>
        line.split("").map((char) => {
            if (char === " ")
                return { char, isSpace: true, waveIndex: -1, lineIndex }
            const info: CharInfo = {
                char,
                isSpace: false,
                waveIndex: idx,
                lineIndex,
            }
            idx++
            return info
        })
    )
    return { charsByLine, totalNonSpace: idx }
}

// =============================================================================
// MAGNETIC FIELD ENGINE
// =============================================================================

interface MagneticResult {
    dx: number
    dy: number
    rotate: number
    scale: number
    proximity: number // 0 = far, 1 = directly on cursor
}

function computeMagnetic(
    charX: number,
    charY: number,
    mouseX: number,
    mouseY: number,
    radius: number,
    strength: number,
    rotationAmount: number,
    mode: FieldMode
): MagneticResult {
    const distX = charX - mouseX
    const distY = charY - mouseY
    const dist = Math.sqrt(distX * distX + distY * distY)

    if (dist > radius || dist < 0.01) {
        return { dx: 0, dy: 0, rotate: 0, scale: 1, proximity: 0 }
    }

    // Smooth falloff using cubic ease
    const normalizedDist = dist / radius
    const falloff = 1 - normalizedDist * normalizedDist * normalizedDist
    const proximity = falloff

    // Direction from mouse to character (unit vector)
    const dirX = distX / dist
    const dirY = distY / dist

    let dx = 0
    let dy = 0
    let rotate = 0

    switch (mode) {
        case "repel": {
            // Characters push away from cursor
            const force = falloff * strength
            dx = dirX * force
            dy = dirY * force
            rotate = dirX * falloff * rotationAmount * 0.5
            break
        }
        case "attract": {
            // Characters pull toward cursor
            const force = falloff * strength * 0.6
            dx = -dirX * force
            dy = -dirY * force
            rotate = -dirX * falloff * rotationAmount * 0.4
            break
        }
        case "vortex": {
            // Characters swirl around cursor (perpendicular force)
            const force = falloff * strength * 0.8
            // Perpendicular direction for circular motion
            const perpX = -dirY
            const perpY = dirX
            dx = perpX * force + dirX * force * 0.15 // Slight outward push
            dy = perpY * force + dirY * force * 0.15
            rotate =
                Math.atan2(perpY, perpX) *
                (180 / Math.PI) *
                falloff *
                (rotationAmount / 20)
            break
        }
    }

    // Scale — characters slightly enlarge when close to cursor field
    const scale = 1 + falloff * 0.08

    return { dx, dy, rotate, scale: Math.min(1.12, scale), proximity }
}

// =============================================================================
// IDLE BREATHING ENGINE
// =============================================================================

function computeIdleBreathing(
    charIndex: number,
    totalChars: number,
    time: number
): { y: number; scale: number } {
    const normalizedIndex = totalChars > 1 ? charIndex / (totalChars - 1) : 0.5

    // Multi-frequency breathing with staggered phase per character
    const wave1 = Math.sin(time * 0.8 + normalizedIndex * Math.PI * 2.5) * 0.55
    const wave2 =
        Math.sin(time * 1.4 + normalizedIndex * Math.PI * 4 + 1.5) * 0.25
    const wave3 = Math.sin(time * 0.45 + charIndex * 0.3 + 2.8) * 0.2
    const combined = wave1 + wave2 + wave3

    return {
        y: combined * 4, // Visible vertical oscillation (~±4px)
        scale: 1 + combined * 0.015, // Subtle pulse (~±1.5%)
    }
}

// =============================================================================
// CANVAS PREVIEW
// =============================================================================

function CanvasPreview({
    charsByLine,
    totalNonSpace,
    fontFamily,
    fontWeight,
    fontSize,
    letterSpacing,
    lineHeight,
    justifyContent,
    textColor,
    wakeColorA,
    wakeColorB,
    strength,
    spaceWidth,
    style,
}: {
    charsByLine: CharInfo[][]
    totalNonSpace: number
    fontFamily: string
    fontWeight: number | string
    fontSize: number
    letterSpacing: number
    lineHeight: number
    justifyContent: string
    textColor: string
    wakeColorA: string
    wakeColorB: string
    strength: number
    spaceWidth: number
    style?: CSSProperties
}) {
    // Simulate a cursor position hovering near center-left
    // with a few characters displaced for visual feedback
    const fakeCursorProgress = 0.35

    return (
        <div
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                    justifyContent === "center"
                        ? "center"
                        : justifyContent === "flex-end"
                          ? "flex-end"
                          : "flex-start",
                overflow: "visible",
            }}
        >
            {charsByLine.map((lineChars, lineIdx) => (
                <div
                    key={lineIdx}
                    style={{
                        display: "flex",
                        justifyContent,
                        alignItems: "baseline",
                        lineHeight,
                    }}
                >
                    {lineChars.map((ci, i) => {
                        if (ci.isSpace) {
                            return (
                                <span
                                    key={i}
                                    style={{
                                        display: "inline-block",
                                        width: spaceWidth,
                                    }}
                                />
                            )
                        }

                        // Simulate magnetic displacement for preview
                        const normalizedIdx =
                            totalNonSpace > 1
                                ? ci.waveIndex / (totalNonSpace - 1)
                                : 0.5
                        const distFromFake = Math.abs(
                            normalizedIdx - fakeCursorProgress
                        )
                        const influence = Math.max(0, 1 - distFromFake * 4)
                        const cubicInfluence =
                            influence * influence * (3 - 2 * influence)

                        const dx = cubicInfluence * strength * 0.3
                        const dy = -cubicInfluence * strength * 0.1
                        const wakeT = cubicInfluence

                        const charColor =
                            wakeT > 0.1
                                ? lerpColor(textColor, wakeColorA, wakeT * 0.8)
                                : textColor

                        const glowOpacity = cubicInfluence * 0.6
                        const textShadow =
                            glowOpacity > 0.05
                                ? `0 0 ${8 * glowOpacity}px ${wakeColorA}${Math.round(
                                      glowOpacity * 100
                                  )
                                      .toString(16)
                                      .padStart(
                                          2,
                                          "0"
                                      )}, 0 0 ${16 * glowOpacity}px ${wakeColorB}${Math.round(
                                      glowOpacity * 50
                                  )
                                      .toString(16)
                                      .padStart(2, "0")}`
                                : "none"

                        return (
                            <span
                                key={i}
                                style={{
                                    display: "inline-block",
                                    fontFamily,
                                    fontWeight: fontWeight as any,
                                    fontSize,
                                    letterSpacing: `${letterSpacing}px`,
                                    lineHeight,
                                    color: charColor,
                                    transform: `translate(${dx}px, ${dy}px) scale(${1 + cubicInfluence * 0.05})`,
                                    textShadow,
                                    willChange: "transform",
                                }}
                            >
                                {ci.char}
                            </span>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Text Magnetic Field
 *
 * Characters react to cursor proximity with elastic push/pull distortion,
 * scaling, rotation, and a flowing color wake that trails the cursor.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function TextMagneticField(props: Props) {
    const {
        text = "MAGNETIC\nFIELD",
        fontFamily: fontFamilyProp,
        fontSize = 96,
        letterSpacing = -2,
        lineHeight = 0.95,
        textAlign = "center",
        uppercase = true,
        theme = "custom",
        colors = {} as ColorsConfig,
        field = {} as FieldConfig,
        wake = {} as WakeConfig,
        idleAnimation = true,
        style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isStatic = useIsStaticRenderer()

    // ── Resolve theme vs custom ──────────────────────────────────────
    const tv = theme !== "custom" ? THEMES[theme] : null
    const textColor = tv?.textColor ?? colors.textColor ?? "#E0E0FF"
    const wakeColorA = tv?.wakeColorA ?? colors.wakeColorA ?? "#A855F7"
    const wakeColorB = tv?.wakeColorB ?? colors.wakeColorB ?? "#EC4899"

    // Field values
    const fieldMode = field.mode ?? "repel"
    const fieldRadius = field.radius ?? 150
    const fieldStrength = field.strength ?? 25
    const fieldElasticity = field.elasticity ?? 0.12
    const fieldRotation = field.rotation ?? 8

    // Wake values
    const wakeEnabled = wake.enabled ?? true
    const wakeIntensity = wake.intensity ?? 0.8
    const wakeDecay = wake.decay ?? 0.92

    // ── Font ──────────────────────────────────────────────────────────
    const fontFamily = fontFamilyProp?.fontFamily
        ? `${fontFamilyProp.fontFamily}, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
        : DEFAULT_FONT
    const fontWeight = fontFamilyProp?.fontWeight || 700

    // ── Process text ─────────────────────────────────────────────────
    const displayText = uppercase ? text.toUpperCase() : text
    const lines = useMemo(() => displayText.split("\n"), [displayText])
    const { charsByLine, totalNonSpace } = useMemo(
        () => buildCharData(lines),
        [lines]
    )

    const spaceWidth = fontSize * 0.3

    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    // ── Refs for animation ───────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const charRefsMap = useRef<Map<number, HTMLSpanElement>>(new Map())
    const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
        x: -9999,
        y: -9999,
        active: false,
    })
    const wakeTrailRef = useRef<Float32Array>(new Float32Array(totalNonSpace))
    const rafRef = useRef<number | null>(null)
    const timeRef = useRef(0)
    const lastTsRef = useRef<number | null>(null)

    // ── Visibility tracking (IntersectionObserver) ───────────────────
    const [isInView, setIsInView] = useState(false)

    // ── Character position cache ─────────────────────────────────────
    const positionCacheRef = useRef<Map<number, { cx: number; cy: number }>>(
        new Map()
    )
    const cacheInvalidatedRef = useRef(true)

    // Per-character current positions (for elastic lerping)
    const currentPositions = useRef<
        { dx: number; dy: number; rotate: number; scale: number }[]
    >(
        Array.from({ length: totalNonSpace }, () => ({
            dx: 0,
            dy: 0,
            rotate: 0,
            scale: 1,
        }))
    )

    // Reset refs when totalNonSpace changes
    useEffect(() => {
        wakeTrailRef.current = new Float32Array(totalNonSpace)
        currentPositions.current = Array.from(
            { length: totalNonSpace },
            () => ({
                dx: 0,
                dy: 0,
                rotate: 0,
                scale: 1,
            })
        )
        positionCacheRef.current.clear()
        cacheInvalidatedRef.current = true
    }, [totalNonSpace])

    // ── IntersectionObserver: pause animation when offscreen ─────────
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // ── Invalidate position cache on scroll / resize ─────────────────
    useEffect(() => {
        if (isStatic || !isInView) return
        const invalidate = () => {
            cacheInvalidatedRef.current = true
        }
        window.addEventListener("resize", invalidate)
        window.addEventListener("scroll", invalidate, true)
        return () => {
            window.removeEventListener("resize", invalidate)
            window.removeEventListener("scroll", invalidate, true)
        }
    }, [isStatic, isInView])

    // ── Mouse handlers ───────────────────────────────────────────────
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            active: true,
        }
    }, [])

    const handleMouseLeave = useCallback(() => {
        mouseRef.current = {
            ...mouseRef.current,
            active: false,
        }
    }, [])

    // ── Register character ref ───────────────────────────────────────
    const setCharRef = useCallback(
        (waveIndex: number, el: HTMLSpanElement | null) => {
            if (el) {
                charRefsMap.current.set(waveIndex, el)
            } else {
                charRefsMap.current.delete(waveIndex)
            }
        },
        []
    )

    // ── Animation loop ───────────────────────────────────────────────
    const animate = useCallback(
        (ts: number) => {
            if (lastTsRef.current === null) lastTsRef.current = ts
            const dt = (ts - lastTsRef.current) / 1000
            lastTsRef.current = ts
            timeRef.current += dt

            const container = containerRef.current
            if (!container) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            const mouse = mouseRef.current
            const wakeTrail = wakeTrailRef.current
            const positions = currentPositions.current
            const elasticity = fieldElasticity
            const time = timeRef.current

            // Rebuild position cache if invalidated (resize / scroll / first frame)
            const cache = positionCacheRef.current
            if (cacheInvalidatedRef.current) {
                const containerRect = container.getBoundingClientRect()
                charRefsMap.current.forEach((el, idx) => {
                    const r = el.getBoundingClientRect()
                    cache.set(idx, {
                        cx: r.left - containerRect.left + r.width / 2,
                        cy: r.top - containerRect.top + r.height / 2,
                    })
                })
                cacheInvalidatedRef.current = false
            }

            charRefsMap.current.forEach((el, waveIndex) => {
                if (waveIndex >= totalNonSpace) return

                // Use cached character center position
                const cached = cache.get(waveIndex)
                if (!cached) return
                const charCenterX = cached.cx
                const charCenterY = cached.cy

                // Compute magnetic field effect
                let target: MagneticResult = {
                    dx: 0,
                    dy: 0,
                    rotate: 0,
                    scale: 1,
                    proximity: 0,
                }

                if (mouse.active) {
                    target = computeMagnetic(
                        charCenterX,
                        charCenterY,
                        mouse.x,
                        mouse.y,
                        fieldRadius,
                        fieldStrength,
                        fieldRotation,
                        fieldMode
                    )
                }

                // Idle breathing when mouse is not affecting this character
                let idleY = 0
                let idleScale = 1
                const isIdle = idleAnimation && target.proximity < 0.05
                if (isIdle) {
                    const breathing = computeIdleBreathing(
                        waveIndex,
                        totalNonSpace,
                        time
                    )
                    idleY = breathing.y
                    idleScale = breathing.scale
                }

                // Elastic lerp toward target position
                // Use higher lerp rate for idle breathing so it follows the wave closely
                const pos = positions[waveIndex]
                const targetDx = target.dx
                const targetDy = target.dy + idleY
                const targetRotate = target.rotate
                const targetScale =
                    target.proximity > 0.05 ? target.scale : idleScale

                const lerpRate = isIdle
                    ? Math.min(0.25, elasticity * 3)
                    : elasticity
                pos.dx += (targetDx - pos.dx) * lerpRate
                pos.dy += (targetDy - pos.dy) * lerpRate
                pos.rotate += (targetRotate - pos.rotate) * lerpRate
                pos.scale += (targetScale - pos.scale) * lerpRate

                // Update wake trail
                if (wakeEnabled) {
                    const currentWake = wakeTrail[waveIndex]
                    const targetWake = target.proximity * wakeIntensity
                    wakeTrail[waveIndex] = Math.max(
                        currentWake * wakeDecay,
                        targetWake
                    )
                }

                // Apply transform via DOM
                const wake = wakeTrail[waveIndex]

                // Color interpolation for wake
                let color = textColor
                if (wakeEnabled && wake > 0.02) {
                    const wakeProgress = Math.min(1, wake)
                    const midColor = lerpColor(
                        textColor,
                        wakeColorA,
                        wakeProgress * 0.9
                    )
                    color = lerpColor(midColor, wakeColorB, wakeProgress * 0.4)
                }

                // Glow for characters in the field
                let textShadow = "none"
                if (wakeEnabled && wake > 0.05) {
                    const glowSize = wake * 12
                    const glowOpacity = wake * 0.6
                    textShadow = `0 0 ${glowSize}px ${wakeColorA}${Math.round(
                        glowOpacity * 255
                    )
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )}, 0 0 ${glowSize * 2}px ${wakeColorB}${Math.round(
                        glowOpacity * 100
                    )
                        .toString(16)
                        .padStart(2, "0")}`
                }

                el.style.transform = `translate(${pos.dx}px, ${pos.dy}px) rotate(${pos.rotate}deg) scale(${pos.scale})`
                el.style.color = color
                el.style.textShadow = textShadow
            })

            rafRef.current = requestAnimationFrame(animate)
        },
        [
            totalNonSpace,
            fieldRadius,
            fieldStrength,
            fieldRotation,
            fieldMode,
            fieldElasticity,
            wakeEnabled,
            wakeIntensity,
            wakeDecay,
            textColor,
            wakeColorA,
            wakeColorB,
            idleAnimation,
        ]
    )

    useEffect(() => {
        if (isStatic || !isInView) return
        lastTsRef.current = null
        cacheInvalidatedRef.current = true
        rafRef.current = requestAnimationFrame(animate)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [animate, isStatic, isInView])

    // ── Static / canvas preview ────────────────────────────────────────
    if (isStatic || isCanvas) {
        return (
            <CanvasPreview
                charsByLine={charsByLine}
                totalNonSpace={totalNonSpace}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                fontSize={fontSize}
                letterSpacing={letterSpacing}
                lineHeight={lineHeight}
                justifyContent={justifyContent}
                textColor={textColor}
                wakeColorA={wakeColorA}
                wakeColorB={wakeColorB}
                strength={fieldStrength}
                spaceWidth={spaceWidth}
                style={style}
            />
        )
    }

    // ── Live render ──────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                ...style,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems:
                    justifyContent === "center"
                        ? "center"
                        : justifyContent === "flex-end"
                          ? "flex-end"
                          : "flex-start",
                overflow: "visible",
                isolation: "isolate",
                zIndex: 0,
                cursor: "default",
                position: "relative",
            }}
        >
            {charsByLine.map((lineChars, lineIdx) => (
                <div
                    key={lineIdx}
                    style={{
                        display: "flex",
                        justifyContent,
                        alignItems: "baseline",
                        lineHeight,
                    }}
                >
                    {lineChars.map((ci, i) => {
                        if (ci.isSpace) {
                            return (
                                <span
                                    key={i}
                                    style={{
                                        display: "inline-block",
                                        width: spaceWidth,
                                    }}
                                />
                            )
                        }

                        return (
                            <span
                                key={i}
                                ref={(el) => setCharRef(ci.waveIndex, el)}
                                style={{
                                    display: "inline-block",
                                    fontFamily,
                                    fontWeight: fontWeight as any,
                                    fontSize,
                                    letterSpacing: `${letterSpacing}px`,
                                    lineHeight,
                                    color: textColor,
                                    willChange: "transform, color, text-shadow",
                                    transition: "none",
                                }}
                            >
                                {ci.char}
                            </span>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

TextMagneticField.displayName = "Text Magnetic Field"

// =============================================================================
// DEFAULT PROPS
// =============================================================================

TextMagneticField.defaultProps = {
    text: "MAGNETIC\nFIELD",
    fontSize: 96,
    letterSpacing: -2,
    lineHeight: 0.95,
    textAlign: "center",
    uppercase: true,
    theme: "custom",
    colors: {
        textColor: "#E0E0FF",
        wakeColorA: "#A855F7",
        wakeColorB: "#EC4899",
    },
    field: {
        mode: "repel",
        radius: 150,
        strength: 25,
        elasticity: 0.12,
        rotation: 8,
    },
    wake: {
        enabled: true,
        intensity: 0.8,
        decay: 0.92,
    },
    idleAnimation: true,
}

// =============================================================================
// PROPERTY CONTROLS
// =============================================================================

addPropertyControls(TextMagneticField, {
    // ═══════════════════════════════════════════════════════════════════════
    // ESSENTIAL CONTROLS (Always Visible)
    // ═══════════════════════════════════════════════════════════════════════
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "MAGNETIC\nFIELD",
        displayTextArea: true,
        description: "Use line breaks to split into multiple lines",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 96,
        min: 20,
        max: 300,
        step: 2,
        unit: "px",
        displayStepper: true,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -2,
        min: -20,
        max: 40,
        step: 0.5,
        unit: "px",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 0.95,
        min: 0.5,
        max: 2,
        step: 0.05,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Alignment",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "center",
        displaySegmentedControl: true,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: " ",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // THEME
    // ═══════════════════════════════════════════════════════════════════════
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: [
            "custom",
            "plasma",
            "arctic",
            "solar",
            "phantom",
            "neon",
            "monochrome",
        ],
        optionTitles: [
            "Custom",
            "🔮 Plasma",
            "❄️ Arctic",
            "☀️ Solar",
            "👻 Phantom",
            "⚡ Neon",
            "◻️ Mono",
        ],
        defaultValue: "custom",
        description: "Choose a theme or customize colors below",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COLORS (Collapsible, hidden when preset selected)
    // ═══════════════════════════════════════════════════════════════════════
    colors: {
        type: ControlType.Object,
        title: "Colors",
        icon: "color",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: "#E0E0FF",
            },
            wakeColorA: {
                type: ControlType.Color,
                title: "Wake Primary",
                defaultValue: "#A855F7",
                description: "Primary color of the cursor wake effect",
            },
            wakeColorB: {
                type: ControlType.Color,
                title: "Wake Secondary",
                defaultValue: "#EC4899",
                description: "Secondary color that blends with the wake",
            },
        },
        hidden: (props: Props) => props.theme !== "custom",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // FIELD (Collapsible)
    // ═══════════════════════════════════════════════════════════════════════
    field: {
        type: ControlType.Object,
        title: "Magnetic Field",
        icon: "effect",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Mode",
                options: ["repel", "attract", "vortex"],
                optionTitles: ["Repel", "Attract", "Vortex"],
                defaultValue: "repel",
                description:
                    "Repel pushes away, Attract pulls in, Vortex swirls around cursor",
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 150,
                min: 50,
                max: 400,
                step: 10,
                unit: "px",
                description: "How far from the cursor characters are affected",
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                defaultValue: 25,
                min: 5,
                max: 80,
                step: 1,
                unit: "px",
                description: "Maximum displacement distance",
            },
            elasticity: {
                type: ControlType.Number,
                title: "Elasticity",
                defaultValue: 0.12,
                min: 0.02,
                max: 0.5,
                step: 0.02,
                description: "Spring-back speed (lower = more elastic/bouncy)",
            },
            rotation: {
                type: ControlType.Number,
                title: "Rotation",
                defaultValue: 8,
                min: 0,
                max: 30,
                step: 1,
                unit: "°",
                description: "Maximum character rotation in the field",
            },
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WAKE (Collapsible)
    // ═══════════════════════════════════════════════════════════════════════
    wake: {
        type: ControlType.Object,
        title: "Color Wake",
        icon: "color",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Color trail that follows cursor through text",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 0.8,
                min: 0.1,
                max: 1,
                step: 0.05,
                description: "How vivid the color wake appears",
            },
            decay: {
                type: ControlType.Number,
                title: "Decay",
                defaultValue: 0.92,
                min: 0.8,
                max: 0.99,
                step: 0.01,
                description:
                    "How slowly the wake fades (higher = longer trail)",
            },
        },
        description: " ",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // IDLE ANIMATION (standalone toggle)
    // ═══════════════════════════════════════════════════════════════════════
    idleAnimation: {
        type: ControlType.Boolean,
        title: "Idle Breathing",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Gentle breathing motion when cursor is away from text",
    },
})
