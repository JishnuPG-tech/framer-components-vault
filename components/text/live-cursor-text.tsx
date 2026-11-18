import * as React from "react"
import { useRef, useEffect, useCallback, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ============================================================================
// URL NORMALIZATION HELPER (RULE 17: PERFECT FRAMER LINK HANDLING)
// ============================================================================
function normalizeUrl(rawUrl?: string): string | undefined {
    if (!rawUrl || typeof rawUrl !== "string") return undefined
    const trimmed = rawUrl.trim()
    if (!trimmed) return undefined

    const lower = trimmed.toLowerCase()
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:")
    ) {
        return undefined
    }

    if (
        lower.startsWith("http://") ||
        lower.startsWith("https://") ||
        lower.startsWith("mailto:") ||
        lower.startsWith("tel:") ||
        trimmed.startsWith("/") ||
        trimmed.startsWith("#")
    ) {
        return trimmed
    }

    if (lower.startsWith("www.")) {
        return `https://${trimmed}`
    }

    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
        return `https://${trimmed}`
    }

    return trimmed
}

// ============================================================================
// GSAP & LOTTIE GRADE EASING FUNCTIONS
// ============================================================================
function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v
}

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

function remap01(t: number, start: number, end: number): number {
    if (end <= start) return t >= end ? 1 : 0
    return clamp01((t - start) / (end - start))
}

function gsapPower3Out(t: number): number {
    const p = clamp01(t)
    const inv = 1 - p
    return 1 - inv * inv * inv
}

function gsapExpoOut(t: number): number {
    const p = clamp01(t)
    return p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
}

function gsapBackOut(t: number, overshoot = 1.70158): number {
    const p = clamp01(t)
    const c1 = overshoot
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}

function gsapPower3InOut(t: number): number {
    const p = clamp01(t)
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
}

interface Vec2 {
    x: number
    y: number
}

function evalCubicBezier(
    p0: Vec2,
    p1: Vec2,
    p2: Vec2,
    p3: Vec2,
    t: number
): Vec2 {
    const u = 1 - t
    const tt = t * t
    const uu = u * u
    const uuu = uu * u
    const ttt = tt * t

    return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
    }
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
type CursorEffectType =
    | "selectBox"
    | "highlightSweep"
    | "underlineDraw"
    | "dimensionRule"
    | "nudgeTap"
    | "floatingCursor"

type TextReactionType = "subtlePop" | "colorAccent" | "tiltWithBox" | "none"
type PlacementModeType = "auto" | "percent" | "word" | "chars"
type LaneType = "auto" | "top" | "bottom" | "right"

interface CursorConfig {
    enabled?: boolean
    name: string
    color: string
    textColor?: string
    effectType: CursorEffectType
    textReaction?: TextReactionType
    placementMode?: PlacementModeType
    targetPosition?: number
    targetSpan?: number
    lane?: LaneType
    boxRotation?: number
    useCustomEffectColor?: boolean
    offsetX?: number
    offsetY?: number
}

interface CharBox {
    index: number
    ch: string
    isSpace: boolean
    wordIndex: number
    left: number
    top: number
    right: number
    bottom: number
    width: number
    height: number
    centerX: number
    centerY: number
}

interface WordSpanInfo {
    wordIndex: number
    startChar: number
    endChar: number
    length: number
    text: string
}

interface ResolvedTargetMetrics {
    cursorIndex: number
    config: CursorConfig
    startChar: number
    endChar: number
    left: number
    top: number
    width: number
    height: number
    right: number
    bottom: number
    centerX: number
    centerY: number
    resolvedLane: "top" | "bottom" | "right"
    effectColor: string
    rotation: number
    entryStart: Vec2
    dragStart: Vec2
    dragEnd: Vec2
    finalPos: Vec2
    winStart: number
    winDragStart: number
    winDragEnd: number
    winSettleEnd: number
}

const DEFAULT_CURSORS: CursorConfig[] = [{"enabled":true,"name":"Dhruv A","color":"rgb(123, 43, 249)","textColor":"rgb(255, 255, 255)","effectType":"selectBox","textReaction":"subtlePop","placementMode":"auto","targetPosition":18,"targetSpan":2,"lane":"top","boxRotation":-6,"useCustomEffectColor":false,"offsetX":0,"offsetY":0},{"enabled":true,"name":"Zaria Z","color":"rgb(250, 40, 160)","textColor":"rgb(255, 255, 255)","effectType":"nudgeTap","textReaction":"subtlePop","placementMode":"auto","targetPosition":50,"targetSpan":2,"lane":"bottom","boxRotation":0,"useCustomEffectColor":true,"offsetX":0,"offsetY":0},{"enabled":true,"name":"Marcus L","color":"rgb(9, 184, 80)","textColor":"rgb(255, 255, 255)","effectType":"selectBox","textReaction":"subtlePop","placementMode":"auto","targetPosition":88,"targetSpan":1,"lane":"right","boxRotation":0,"useCustomEffectColor":false,"offsetX":0,"offsetY":0}]

const EXTRA_AUTO_CURSORS: CursorConfig[] = [
    {
        enabled: true,
        name: "Elena R",
        color: "#FF6B00",
        textColor: "#FFFFFF",
        effectType: "highlightSweep",
        textReaction: "colorAccent",
        placementMode: "auto",
        targetPosition: 35,
        targetSpan: 5,
        lane: "top",
        boxRotation: 0,
        useCustomEffectColor: true,
        offsetX: 0,
        offsetY: 0,
    },
    {
        enabled: true,
        name: "Kai T",
        color: "#0066FF",
        textColor: "#FFFFFF",
        effectType: "underlineDraw",
        textReaction: "subtlePop",
        placementMode: "auto",
        targetPosition: 70,
        targetSpan: 6,
        lane: "bottom",
        boxRotation: 0,
        useCustomEffectColor: true,
        offsetX: 0,
        offsetY: 0,
    },
]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 920
 * @framerIntrinsicHeight 360
 * @framerDisableUnlink
 */
export default function CollaborativeTextReveal(incomingProps: any) {
    // ========================================================================
    // STEP 1: INTERCEPT & FLATTEN PROPS (RULE 9)
    // ========================================================================
    const props = {
        ...incomingProps,
        ...(incomingProps.typography || {}),
        ...(incomingProps.animation || {}),
        ...(incomingProps.boxStyleGroup || {}),
        ...(incomingProps.interaction || {}),
    }

    const {
        livePreview = true,
        text = "Introducing",
        font = {
            fontSize: "88px",
            variant: "Regular",
            letterSpacing: "-0.03em",
            lineHeight: "1.15em",
            textAlign: "center",
        },
        cursors = DEFAULT_CURSORS,
        // Typography & Layout
        textColor = "#000000",
        backgroundColor = "rgba(255, 255, 255, 0)",
        scaleWithText = true,
        badgeScale = 100,
        autoAddOnLongText = false,
        paddingX = 44,
        paddingY = 44,
        // Animation
        triggerMode = "appear",
        textAnimationStyle = "drawAndSpring",
        duration = 2.1,
        delay = 0.1,
        stagger = 28,
        springOvershoot = 120,
        showMotionTrails = true,
        idleMotion = true,
        idleIntensity = 100,
        loopAnimation = false,
        loopDelay = 3.0,
        // Global Box & Effect Styling
        boxColor = "#1890FF",
        boxStrokeWidth = 2,
        handleSize = 8,
        highlightOpacity = 18,
        // Interaction & Link
        interactiveHover = true,
        replayOnClick = false,
        link = "",
        openInNewTab = false,
    } = props

    // ========================================================================
    // STATIC RENDERER & ANIMATION GATING (RULE 12)
    // ========================================================================
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (livePreview ?? true)

    // ========================================================================
    // PARSE TEXT INTO WORDS & CHARACTER TOKENS (NATURAL WORD WRAPPING)
    // ========================================================================
    const safeText =
        typeof text === "string" && text.length > 0 ? text : "Introducing"

    const parsedText = useMemo(() => {
        const tokens: Array<{
            type: "word" | "space" | "newline"
            wordIndex: number
            chars: Array<{ ch: string; globalIndex: number }>
        }> = []
        const words: WordSpanInfo[] = []
        const flatChars: Array<{
            ch: string
            isSpace: boolean
            wordIndex: number
        }> = []

        const rawSegments = safeText.split(/(\s+)/)
        let globalIdx = 0
        let currentWordIdx = 0

        for (const seg of rawSegments) {
            if (!seg) continue
            const isWhitespace = /^\s+$/.test(seg)
            const segChars = Array.from(seg)

            if (isWhitespace) {
                for (const ch of segChars) {
                    if (ch === "\n") {
                        tokens.push({
                            type: "newline",
                            wordIndex: -1,
                            chars: [{ ch, globalIndex: globalIdx }],
                        })
                    } else {
                        tokens.push({
                            type: "space",
                            wordIndex: -1,
                            chars: [{ ch: "\u00A0", globalIndex: globalIdx }],
                        })
                    }
                    flatChars.push({ ch, isSpace: true, wordIndex: -1 })
                    globalIdx++
                }
            } else {
                const startChar = globalIdx
                const wordChars: Array<{ ch: string; globalIndex: number }> = []
                for (const ch of segChars) {
                    wordChars.push({ ch, globalIndex: globalIdx })
                    flatChars.push({
                        ch,
                        isSpace: false,
                        wordIndex: currentWordIdx,
                    })
                    globalIdx++
                }
                const endChar = globalIdx - 1
                words.push({
                    wordIndex: currentWordIdx,
                    startChar,
                    endChar,
                    length: endChar - startChar + 1,
                    text: seg,
                })
                tokens.push({
                    type: "word",
                    wordIndex: currentWordIdx,
                    chars: wordChars,
                })
                currentWordIdx++
            }
        }

        return { tokens, words, flatChars, totalChars: globalIdx }
    }, [safeText])

    // Build active cursor list (supporting unlimited user array + optional long-text expansion)
    const activeCursors = useMemo(() => {
        const baseList =
            Array.isArray(cursors) && cursors.length > 0
                ? cursors.filter((c) => c && c.enabled !== false)
                : DEFAULT_CURSORS

        if (
            autoAddOnLongText &&
            parsedText.totalChars > 42 &&
            baseList.length <= 3
        ) {
            const combined = [...baseList]
            combined.splice(1, 0, EXTRA_AUTO_CURSORS[0])
            if (parsedText.totalChars > 72) {
                combined.splice(3, 0, EXTRA_AUTO_CURSORS[1])
            }
            return combined
        }
        return baseList
    }, [cursors, autoAddOnLongText, parsedText.totalChars])

    const normalizedHref = useMemo(() => normalizeUrl(link), [link])

    // ========================================================================
    // REFS (BYPASS REACT STATE FOR 60FPS ANIMATION - RULE 6)
    // ========================================================================
    const mountRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const charLayoutRefs = useRef<(HTMLSpanElement | null)[]>([])
    const charAnimRefs = useRef<(HTMLSpanElement | null)[]>([])
    const charStrokeRefs = useRef<(HTMLSpanElement | null)[]>([])

    // Dynamic Cursor & Effect Element Refs
    const effectGroupRefs = useRef<(HTMLDivElement | null)[]>([])
    const effectSvgRectRefs = useRef<(SVGRectElement | null)[]>([])
    const effectFillRefs = useRef<(HTMLDivElement | null)[]>([])
    const effectPathRefs = useRef<(SVGPathElement | null)[]>([])
    const effectSpecLabelRefs = useRef<(HTMLDivElement | null)[]>([])
    const effectHandlesRefs = useRef<Array<Array<HTMLDivElement | null>>>([])

    const cursorOuterRefs = useRef<(HTMLDivElement | null)[]>([])
    const cursorInnerRefs = useRef<(HTMLDivElement | null)[]>([])
    const cursorRippleRefs = useRef<(HTMLDivElement | null)[]>([])
    const trailPathRefs = useRef<(SVGPathElement | null)[]>([])

    // Runtime Refs
    const isIntersectingRef = useRef<boolean>(true)
    const hasTriggeredAppearRef = useRef<boolean>(false)
    const animStartTimeRef = useRef<number | null>(null)
    const pointerRef = useRef({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        downX: 0,
        downY: 0,
        isDragging: false,
    })

    const layoutMetricsRef = useRef<{
        chars: CharBox[]
        wordLeft: number
        wordTop: number
        wordRight: number
        wordBottom: number
        wordWidth: number
        wordHeight: number
        lineHeightPx: number
        uiScale: number
        handlePx: number
        targets: ResolvedTargetMetrics[]
    } | null>(null)

    // ========================================================================
    // SMART AUTO-BALANCED MEASUREMENT & TARGET RESOLUTION ENGINE
    // ========================================================================
    const measureLayout = useCallback(() => {
        const stageEl = stageRef.current
        if (!stageEl) return

        const stageRect = stageEl.getBoundingClientRect()
        if (stageRect.width === 0 || stageRect.height === 0) return

        const zoomX =
            stageEl.offsetWidth > 0 ? stageRect.width / stageEl.offsetWidth : 1
        const zoomY =
            stageEl.offsetHeight > 0
                ? stageEl.height
                    ? stageRect.height / stageEl.offsetHeight
                    : 1
                : 1

        const charBoxes: CharBox[] = []
        let minLeft = Infinity
        let minTop = Infinity
        let maxRight = -Infinity
        let maxBottom = -Infinity

        for (let i = 0; i < parsedText.totalChars; i++) {
            const el = charLayoutRefs.current[i]
            const meta = parsedText.flatChars[i]
            if (!el || !meta) continue

            const r = el.getBoundingClientRect()
            const left = (r.left - stageRect.left) / zoomX
            const top = (r.top - stageRect.top) / zoomY
            const width = r.width / zoomX
            const height = r.height / zoomY
            const right = left + width
            const bottom = top + height

            if (!meta.isSpace) {
                if (left < minLeft) minLeft = left
                if (top < minTop) minTop = top
                if (right > maxRight) maxRight = right
                if (bottom > maxBottom) maxBottom = bottom
            }

            charBoxes.push({
                index: i,
                ch: meta.ch,
                isSpace: meta.isSpace,
                wordIndex: meta.wordIndex,
                left,
                top,
                right,
                bottom,
                width,
                height,
                centerX: left + width * 0.5,
                centerY: top + height * 0.5,
            })
        }

        if (charBoxes.length === 0) return
        if (!isFinite(minLeft)) {
            minLeft = charBoxes[0].left
            minTop = charBoxes[0].top
            maxRight = charBoxes[charBoxes.length - 1].right
            maxBottom = charBoxes[charBoxes.length - 1].bottom
        }

        const count = charBoxes.length
        const H = charBoxes[0].height || 88

        // Damped UI scale so badges remain crisp on smaller/long-sentence text
        const rawRatio = H / 88
        const dampedScale = scaleWithText
            ? clamp(Math.pow(rawRatio, 0.42), 0.64, 1.35)
            : 1
        const uiScale = dampedScale * Math.max(0.3, badgeScale / 100)
        const handlePx = clamp(
            Math.round(handleSize * Math.pow(rawRatio, 0.32)),
            5,
            14
        )

        const words = parsedText.words
        const isSingleWord = words.length <= 1
        const cursorCount = activeCursors.length
        const resolvedTargets: ResolvedTargetMetrics[] = []
        const usedWordIndices = new Set<number>()

        for (let k = 0; k < cursorCount; k++) {
            const cfg = activeCursors[k]
            const mode = cfg.placementMode || "auto"
            let sIdx = 0
            let eIdx = 0

            if (mode === "chars") {
                sIdx = clamp(Math.floor(cfg.targetPosition ?? 0), 0, count - 1)
                const span = Math.max(1, Math.floor(cfg.targetSpan ?? 2))
                eIdx = clamp(sIdx + span - 1, sIdx, count - 1)
            } else if (mode === "word" && words.length > 0) {
                const wIdx = clamp(
                    Math.floor((cfg.targetPosition ?? 1) - 1),
                    0,
                    words.length - 1
                )
                const w = words[wIdx]
                sIdx = w.startChar
                eIdx = w.endChar
            } else if (mode === "percent") {
                const pct = clamp(cfg.targetPosition ?? 50, 0, 100) / 100
                const centerChar = clamp(
                    Math.round(pct * (count - 1)),
                    0,
                    count - 1
                )
                const span = Math.max(1, Math.floor(cfg.targetSpan ?? 3))
                sIdx = clamp(
                    centerChar - Math.floor((span - 1) / 2),
                    0,
                    count - 1
                )
                eIdx = clamp(sIdx + span - 1, sIdx, count - 1)
            } else {
                // ============================================================
                // SMART AUTO-BALANCE MODE (WORKS FOR 1 WORD OR 30 WORDS!)
                // ============================================================
                if (isSingleWord) {
                    // Single word (e.g., "Introducing")
                    if (cursorCount === 3 && count >= 8) {
                        if (k === 0) {
                            sIdx = Math.min(count - 1, Math.round(count * 0.18))
                            eIdx = Math.min(count - 1, sIdx + 1)
                        } else if (k === 1) {
                            sIdx = Math.min(count - 1, Math.round(count * 0.42))
                            eIdx = Math.min(count - 1, sIdx + 1)
                        } else {
                            sIdx = count - 1
                            eIdx = count - 1
                        }
                    } else {
                        const frac =
                            cursorCount === 1
                                ? 0.5
                                : 0.16 + (k / (cursorCount - 1)) * 0.78
                        const center = clamp(
                            Math.round(frac * (count - 1)),
                            0,
                            count - 1
                        )
                        const span =
                            k === cursorCount - 1 && count > 4
                                ? 1
                                : Math.max(
                                      1,
                                      Math.min(3, Math.round(count * 0.18))
                                  )
                        sIdx = clamp(center, 0, count - 1)
                        eIdx = clamp(sIdx + span - 1, sIdx, count - 1)
                    }
                } else {
                    // Multi-word phrase or long sentence: distribute evenly across words!
                    const zoneFrac =
                        cursorCount === 1 ? 0.5 : (k + 0.5) / cursorCount
                    const idealChar = zoneFrac * (count - 1)

                    // Find the best word near idealChar (preferring words >= 3 chars not yet used)
                    let bestWord = words[0]
                    let bestScore = Infinity
                    for (const w of words) {
                        const wCenter = (w.startChar + w.endChar) * 0.5
                        const dist = Math.abs(wCenter - idealChar)
                        const shortPenalty = w.length < 3 ? count * 0.18 : 0
                        const usedPenalty = usedWordIndices.has(w.wordIndex)
                            ? count * 0.35
                            : 0
                        const score = dist + shortPenalty + usedPenalty
                        if (score < bestScore) {
                            bestScore = score
                            bestWord = w
                        }
                    }
                    usedWordIndices.add(bestWord.wordIndex)

                    // Frame either the full word or a balanced 3-6 char stem inside that word
                    if (
                        cfg.effectType === "highlightSweep" ||
                        cfg.effectType === "underlineDraw" ||
                        cfg.effectType === "dimensionRule" ||
                        bestWord.length <= 6
                    ) {
                        sIdx = bestWord.startChar
                        eIdx = bestWord.endChar
                    } else {
                        const targetLen = clamp(
                            Math.round(bestWord.length * 0.5),
                            3,
                            6
                        )
                        const offsetInWord =
                            k % 2 === 0
                                ? Math.min(2, bestWord.length - targetLen)
                                : Math.max(0, bestWord.length - targetLen)
                        sIdx = bestWord.startChar + offsetInWord
                        eIdx = Math.min(bestWord.endChar, sIdx + targetLen - 1)
                    }
                }
            }

            // Ensure start..end stay on the same visual line (never stretch across line wraps)
            const firstBox = charBoxes[sIdx]
            let bLeft = Infinity
            let bTop = Infinity
            let bRight = -Infinity
            let bBottom = -Infinity
            let actualEnd = sIdx

            for (let i = sIdx; i <= eIdx; i++) {
                const c = charBoxes[i]
                if (!c) continue
                if (
                    i > sIdx &&
                    Math.abs(c.centerY - firstBox.centerY) > H * 0.55
                ) {
                    break
                }
                actualEnd = i
                if (c.left < bLeft) bLeft = c.left
                if (c.top < bTop) bTop = c.top
                if (c.right > bRight) bRight = c.right
                if (c.bottom > bBottom) bBottom = c.bottom
            }

            const rawH = bBottom - bTop || H
            const isTailChar =
                isSingleWord && actualEnd === count - 1 && sIdx === count - 1
            const padX = isTailChar ? H * 0.1 : H * 0.045
            const boxLeft = bLeft - padX
            const boxRight = bRight + padX
            const boxTop = bTop + rawH * (isTailChar ? 0.06 : 0.04)
            const boxBottom =
                bTop + rawH * (isTailChar || !isSingleWord ? 0.94 : 0.85)
            const boxWidth = Math.max(14, boxRight - boxLeft)
            const boxHeight = Math.max(14, boxBottom - boxTop)

            // Resolve Lane (alternating top/bottom on long text so badges never collide)
            let resolvedLane: "top" | "bottom" | "right" = "top"
            if (cfg.lane && cfg.lane !== "auto") {
                if (
                    cfg.lane === "right" &&
                    !isSingleWord &&
                    k < cursorCount - 1
                ) {
                    resolvedLane = k % 2 === 0 ? "top" : "bottom"
                } else {
                    resolvedLane = cfg.lane
                }
            } else {
                if (isSingleWord && k === cursorCount - 1 && cursorCount >= 3) {
                    resolvedLane = "right"
                } else {
                    resolvedLane = k % 2 === 0 ? "top" : "bottom"
                }
            }

            // Compute balanced final cursor resting position using uiScale
            const offX = cfg.offsetX ?? 0
            const offY = cfg.offsetY ?? 0
            let finalPos: Vec2
            let entryStart: Vec2
            let dragStart: Vec2
            let dragEnd: Vec2

            if (
                cfg.effectType === "underlineDraw" ||
                cfg.effectType === "dimensionRule"
            ) {
                const lineY =
                    cfg.effectType === "dimensionRule" && resolvedLane === "top"
                        ? boxTop - 8 * uiScale
                        : boxBottom + 3 * uiScale
                dragStart = { x: boxLeft, y: lineY }
                dragEnd = { x: boxRight, y: lineY }
                finalPos =
                    resolvedLane === "top"
                        ? {
                              x: boxRight - 10 * uiScale + offX,
                              y: boxTop - 26 * uiScale + offY,
                          }
                        : {
                              x: boxRight - 8 * uiScale + offX,
                              y: boxBottom + 6 * uiScale + offY,
                          }
                entryStart = {
                    x: boxLeft - 95 * uiScale,
                    y:
                        resolvedLane === "top"
                            ? boxTop - 80 * uiScale
                            : boxBottom + 80 * uiScale,
                }
            } else if (cfg.effectType === "highlightSweep") {
                const midY = boxTop + boxHeight * 0.5
                dragStart = { x: boxLeft, y: midY }
                dragEnd = { x: boxRight, y: midY }
                finalPos =
                    resolvedLane === "bottom"
                        ? {
                              x: boxRight - 12 * uiScale + offX,
                              y: boxBottom + 6 * uiScale + offY,
                          }
                        : {
                              x: boxRight - 14 * uiScale + offX,
                              y: boxTop - 22 * uiScale + offY,
                          }
                entryStart = {
                    x: boxLeft - 100 * uiScale,
                    y:
                        resolvedLane === "bottom"
                            ? boxBottom + 85 * uiScale
                            : boxTop - 85 * uiScale,
                }
            } else if (
                cfg.effectType === "nudgeTap" ||
                cfg.effectType === "floatingCursor"
            ) {
                const tapPt: Vec2 =
                    resolvedLane === "top"
                        ? {
                              x: boxLeft + boxWidth * 0.55,
                              y: boxTop + boxHeight * 0.18,
                          }
                        : {
                              x: boxLeft + boxWidth * 0.52,
                              y: boxBottom - boxHeight * 0.12,
                          }
                dragStart = tapPt
                dragEnd = tapPt
                finalPos =
                    resolvedLane === "top"
                        ? {
                              x: tapPt.x + 6 * uiScale + offX,
                              y: boxTop - 24 * uiScale + offY,
                          }
                        : {
                              x: tapPt.x + 8 * uiScale + offX,
                              y: boxBottom + 4 * uiScale + offY,
                          }
                entryStart = {
                    x: tapPt.x - 95 * uiScale,
                    y:
                        resolvedLane === "top"
                            ? boxTop - 90 * uiScale
                            : boxBottom + 90 * uiScale,
                }
            } else {
                // selectBox (default)
                dragStart = { x: boxLeft, y: boxTop }
                dragEnd = { x: boxLeft + boxWidth, y: boxTop + boxHeight }

                if (resolvedLane === "right") {
                    finalPos = {
                        x: boxRight - 22 * uiScale + offX,
                        y: boxTop + 9 * uiScale + offY,
                    }
                    entryStart = {
                        x: boxRight + 105 * uiScale,
                        y: boxBottom + 70 * uiScale,
                    }
                } else if (resolvedLane === "bottom") {
                    finalPos = {
                        x: boxRight - 14 * uiScale + offX,
                        y: boxBottom + 6 * uiScale + offY,
                    }
                    entryStart = {
                        x: boxLeft - 90 * uiScale,
                        y: boxBottom + 85 * uiScale,
                    }
                } else {
                    // top lane
                    finalPos = {
                        x: boxRight - 12 * uiScale + offX,
                        y: boxTop - 20 * uiScale + offY,
                    }
                    entryStart = {
                        x: boxLeft - 100 * uiScale,
                        y: boxTop - 80 * uiScale,
                    }
                }
            }

            // Stagger timeline windows across cursors from left to right
            const staggerOrder = cursorCount > 1 ? k / (cursorCount - 1) : 0
            const winStart = 0.08 + staggerOrder * 0.22
            const winDragStart = winStart + 0.24
            const winDragEnd = winDragStart + 0.28
            const winSettleEnd = Math.min(0.98, winDragEnd + 0.22)

            resolvedTargets.push({
                cursorIndex: k,
                config: cfg,
                startChar: sIdx,
                endChar: actualEnd,
                left: boxLeft,
                top: boxTop,
                width: boxWidth,
                height: boxHeight,
                right: boxRight,
                bottom: boxBottom,
                centerX: boxLeft + boxWidth * 0.5,
                centerY: boxTop + boxHeight * 0.5,
                resolvedLane,
                effectColor: cfg.useCustomEffectColor ? cfg.color : boxColor,
                rotation: cfg.boxRotation ?? 0,
                entryStart,
                dragStart,
                dragEnd,
                finalPos,
                winStart,
                winDragStart,
                winDragEnd,
                winSettleEnd,
            })
        }

        layoutMetricsRef.current = {
            chars: charBoxes,
            wordLeft: minLeft,
            wordTop: minTop,
            wordRight: maxRight,
            wordBottom: maxBottom,
            wordWidth: Math.max(1, maxRight - minLeft),
            wordHeight: Math.max(1, maxBottom - minTop),
            lineHeightPx: H,
            uiScale,
            handlePx,
            targets: resolvedTargets,
        }
    }, [
        parsedText,
        activeCursors,
        scaleWithText,
        badgeScale,
        handleSize,
        boxColor,
    ])

    // ========================================================================
    // CORE 60FPS FRAME RENDERER (GSAP & LOTTIE CHOREOGRAPHY)
    // ========================================================================
    const renderFrame = useCallback(
        (nowMs: number, forceFinalState = false) => {
            if (!layoutMetricsRef.current) {
                measureLayout()
            }
            const m = layoutMetricsRef.current
            if (!m) return

            const totalDurSec = Math.max(0.3, duration)
            const delaySec = Math.max(0, delay)
            const overshootVal = 1.70158 * (springOvershoot / 100)

            let elapsedSec = totalDurSec
            let progress = 1

            if (!forceFinalState && shouldAnimate) {
                if (animStartTimeRef.current === null) {
                    animStartTimeRef.current = nowMs
                }
                const rawElapsed =
                    (nowMs - animStartTimeRef.current) / 1000 - delaySec

                if (rawElapsed < 0) {
                    elapsedSec = 0
                    progress = 0
                } else {
                    elapsedSec = rawElapsed
                    progress = clamp01(rawElapsed / totalDurSec)

                    if (
                        loopAnimation &&
                        rawElapsed >= totalDurSec + Math.max(0.3, loopDelay)
                    ) {
                        animStartTimeRef.current = nowMs
                        elapsedSec = 0
                        progress = 0
                    }
                }
            }

            // Mouse hover parallax smoothing (bypassed in static mode per Rule 12)
            const ptr = pointerRef.current
            if (!shouldAnimate || forceFinalState) {
                ptr.x = ptr.targetX
                ptr.y = ptr.targetY
            } else {
                ptr.x += (ptr.targetX - ptr.x) * 0.12
                ptr.y += (ptr.targetY - ptr.y) * 0.12
            }

            const H = m.lineHeightPx
            const uScale = m.uiScale
            const charCount = m.chars.length

            // Precompute per-character interactive reactions from cursors
            const charNudgeY = new Float32Array(charCount)
            const charRotDeg = new Float32Array(charCount)
            const charScaleMul = new Float32Array(charCount)
            const charAccentColor: Array<string | null> = new Array(
                charCount
            ).fill(null)
            for (let i = 0; i < charCount; i++) {
                charScaleMul[i] = 1
            }

            for (const tgt of m.targets) {
                const reaction = tgt.config.textReaction || "subtlePop"
                const actT = remap01(
                    progress,
                    tgt.winDragStart + 0.05,
                    tgt.winSettleEnd
                )

                if (
                    reaction === "subtlePop" &&
                    progress < 1 &&
                    !forceFinalState
                ) {
                    const pulse =
                        actT > 0 && actT < 1 ? Math.sin(actT * Math.PI) : 0
                    for (
                        let cIdx = tgt.startChar;
                        cIdx <= tgt.endChar;
                        cIdx++
                    ) {
                        charNudgeY[cIdx] += -pulse * H * 0.055
                        charScaleMul[cIdx] += pulse * 0.06
                    }
                } else if (reaction === "colorAccent") {
                    const colorActive =
                        forceFinalState || progress >= tgt.winDragStart + 0.12
                    if (colorActive) {
                        for (
                            let cIdx = tgt.startChar;
                            cIdx <= tgt.endChar;
                            cIdx++
                        ) {
                            charAccentColor[cIdx] = tgt.config.color
                        }
                    }
                } else if (reaction === "tiltWithBox") {
                    const rotP = forceFinalState
                        ? 1
                        : gsapBackOut(
                              remap01(
                                  progress,
                                  tgt.winDragEnd,
                                  tgt.winSettleEnd
                              ),
                              overshootVal
                          )
                    const deg = (tgt.rotation || -4) * rotP * 0.65
                    for (
                        let cIdx = tgt.startChar;
                        cIdx <= tgt.endChar;
                        cIdx++
                    ) {
                        charRotDeg[cIdx] += deg
                    }
                }
            }

            // ================================================================
            // 1. ANIMATE INDIVIDUAL CHARACTERS (BALANCED WAVE FOR ANY LENGTH)
            // ================================================================
            const charWindowSec = clamp(totalDurSec * 0.42, 0.28, 0.9)
            const maxWaveSpanSec = Math.min(
                totalDurSec * 0.46,
                charCount * (Math.max(0, stagger) / 1000)
            )
            const perCharStep =
                charCount > 1 ? maxWaveSpanSec / (charCount - 1) : 0

            for (let i = 0; i < charCount; i++) {
                const animEl = charAnimRefs.current[i]
                const strokeEl = charStrokeRefs.current[i]
                if (!animEl) continue

                const accentCol = charAccentColor[i]
                animEl.style.color = accentCol || textColor

                if (progress >= 1 || forceFinalState) {
                    const extraRot = charRotDeg[i]
                    animEl.style.opacity = "1"
                    animEl.style.transform =
                        extraRot !== 0
                            ? `translate3d(0px, 0px, 0px) rotate(${extraRot.toFixed(2)}deg)`
                            : "translate3d(0px, 0px, 0px) scale(1) rotate(0deg)"
                    animEl.style.clipPath = "none"
                    if (strokeEl) strokeEl.style.opacity = "0"
                    continue
                }

                const cStart = i * perCharStep
                const localT = clamp01(
                    (elapsedSec - cStart) / Math.max(0.15, charWindowSec)
                )
                const reactY = charNudgeY[i]
                const reactScale = charScaleMul[i]
                const reactRot = charRotDeg[i]

                if (textAnimationStyle === "drawAndSpring") {
                    const springP = gsapBackOut(localT, overshootVal)
                    const easeP = gsapPower3Out(localT)
                    const yOff = (1 - springP) * (H * 0.34) + reactY
                    const sc = (0.74 + 0.26 * springP) * reactScale
                    const rot = (1 - springP) * -7 + reactRot
                    const fillClipTop = Math.round(
                        (1 - clamp01((localT - 0.16) / 0.72)) * 100
                    )

                    animEl.style.opacity = `${clamp01(localT * 2.6)}`
                    animEl.style.transform = `translate3d(0px, ${yOff.toFixed(2)}px, 0px) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`
                    animEl.style.clipPath =
                        fillClipTop > 0
                            ? `inset(${fillClipTop}% -15% -15% -15%)`
                            : "none"

                    if (strokeEl) {
                        const strokeOpacity =
                            localT < 0.02
                                ? 0
                                : localT < 0.55
                                  ? clamp01(localT * 4)
                                  : clamp01(1 - (localT - 0.55) / 0.42)
                        const strokeClipRight = Math.round((1 - easeP) * 100)
                        strokeEl.style.opacity = `${strokeOpacity.toFixed(3)}`
                        strokeEl.style.transform = animEl.style.transform
                        strokeEl.style.clipPath = `inset(-15% ${strokeClipRight}% -15% -15%)`
                    }
                } else if (textAnimationStyle === "gsapSplitSpring") {
                    const springP = gsapBackOut(localT, overshootVal * 1.15)
                    const yOff = (1 - springP) * (H * 0.48) + reactY
                    const sc = (0.52 + 0.48 * springP) * reactScale
                    const rot =
                        (1 - springP) * (i % 2 === 0 ? -10 : 10) + reactRot

                    animEl.style.opacity = `${clamp01(localT * 2.2)}`
                    animEl.style.transform = `translate3d(0px, ${yOff.toFixed(2)}px, 0px) scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`
                    animEl.style.clipPath = "none"
                    if (strokeEl) strokeEl.style.opacity = "0"
                } else if (textAnimationStyle === "strokeLineDraw") {
                    const drawP = gsapPower3Out(remap01(localT, 0, 0.65))
                    const fillP = gsapPower3InOut(remap01(localT, 0.35, 1.0))

                    animEl.style.opacity = `${fillP.toFixed(3)}`
                    animEl.style.transform = `translate3d(0px, ${reactY.toFixed(2)}px, 0px) scale(${reactScale.toFixed(3)}) rotate(${reactRot.toFixed(2)}deg)`
                    animEl.style.clipPath = `inset(0% ${Math.round((1 - fillP) * 100)}% 0% 0%)`

                    if (strokeEl) {
                        const strokeFade = clamp01(1.15 - fillP)
                        strokeEl.style.opacity = `${(drawP * strokeFade).toFixed(3)}`
                        strokeEl.style.transform = animEl.style.transform
                        strokeEl.style.clipPath = `inset(-15% ${Math.round((1 - drawP) * 100)}% -15% -15%)`
                    }
                } else {
                    const vis = localT > 0.08 ? 1 : 0
                    const pop = gsapBackOut(localT, overshootVal * 0.8)
                    const yOff = (1 - pop) * (H * 0.12) + reactY
                    animEl.style.opacity = `${vis}`
                    animEl.style.transform = `translate3d(0px, ${yOff.toFixed(2)}px, 0px) scale(${((0.9 + 0.1 * pop) * reactScale).toFixed(3)}) rotate(${reactRot.toFixed(2)}deg)`
                    animEl.style.clipPath = "none"
                    if (strokeEl) strokeEl.style.opacity = "0"
                }
            }

            // ================================================================
            // 2. ANIMATE EACH CURSOR & ITS VECTOR EFFECT (6 EFFECT TYPES)
            // ================================================================
            const idleAmp =
                shouldAnimate &&
                !forceFinalState &&
                idleMotion &&
                progress >= 0.94
                    ? (idleIntensity / 100) * 3.2 * uScale
                    : 0
            const tSec = nowMs * 0.001

            for (let k = 0; k < m.targets.length; k++) {
                const tgt = m.targets[k]
                const effType = tgt.config.effectType || "selectBox"

                const dragT = forceFinalState
                    ? 1
                    : gsapExpoOut(
                          remap01(progress, tgt.winDragStart, tgt.winDragEnd)
                      )
                const settleT = forceFinalState
                    ? 1
                    : gsapBackOut(
                          remap01(progress, tgt.winDragEnd, tgt.winSettleEnd),
                          overshootVal
                      )

                const groupEl = effectGroupRefs.current[k]
                const rectEl = effectSvgRectRefs.current[k]
                const fillEl = effectFillRefs.current[k]
                const pathEl = effectPathRefs.current[k]
                const specLabelEl = effectSpecLabelRefs.current[k]
                const handlesArr = effectHandlesRefs.current[k] || []

                const effectVisible =
                    forceFinalState || progress >= tgt.winDragStart - 0.02

                if (groupEl) {
                    groupEl.style.opacity = effectVisible ? "1" : "0"
                    groupEl.style.left = `${tgt.left.toFixed(2)}px`
                    groupEl.style.top = `${tgt.top.toFixed(2)}px`

                    if (effType === "selectBox") {
                        const curW = tgt.width * dragT
                        const curH = tgt.height * dragT
                        const curRot =
                            tgt.rotation * settleT +
                            (interactiveHover
                                ? (k % 2 === 0 ? 1 : -1) * ptr.x * 1.4
                                : 0)
                        groupEl.style.width = `${curW.toFixed(2)}px`
                        groupEl.style.height = `${curH.toFixed(2)}px`
                        groupEl.style.transformOrigin = "50% 50%"
                        groupEl.style.transform = `rotate(${curRot.toFixed(2)}deg)`
                    } else if (effType === "highlightSweep") {
                        const curW = tgt.width * dragT
                        groupEl.style.width = `${curW.toFixed(2)}px`
                        groupEl.style.height = `${tgt.height.toFixed(2)}px`
                        groupEl.style.transform = "none"
                    } else {
                        groupEl.style.width = `${tgt.width.toFixed(2)}px`
                        groupEl.style.height = `${tgt.height.toFixed(2)}px`
                        groupEl.style.transform = "none"
                    }
                }

                // Effect-specific SVG / Fill / Handle updates
                if (effType === "selectBox") {
                    if (rectEl) {
                        const perim = 2 * (tgt.width + tgt.height)
                        const dashOff = perim * (1 - dragT)
                        rectEl.setAttribute(
                            "stroke-dasharray",
                            `${perim.toFixed(1)}`
                        )
                        rectEl.setAttribute(
                            "stroke-dashoffset",
                            `${dashOff.toFixed(1)}`
                        )
                    }
                    if (fillEl) {
                        const flash =
                            !forceFinalState &&
                            progress > tgt.winDragStart &&
                            progress < tgt.winSettleEnd
                                ? Math.sin(
                                      remap01(
                                          progress,
                                          tgt.winDragStart,
                                          tgt.winSettleEnd
                                      ) * Math.PI
                                  ) * 0.12
                                : 0
                        fillEl.style.opacity = `${flash.toFixed(3)}`
                    }
                    for (let h = 0; h < 4; h++) {
                        const hEl = handlesArr[h]
                        if (!hEl) continue
                        const hStart = tgt.winDragStart + 0.12 + h * 0.03
                        const hScale = forceFinalState
                            ? 1
                            : gsapBackOut(
                                  remap01(progress, hStart, hStart + 0.15),
                                  2.5
                              )
                        hEl.style.width = `${m.handlePx}px`
                        hEl.style.height = `${m.handlePx}px`
                        hEl.style.transform = `translate(-50%, -50%) scale(${hScale.toFixed(3)})`
                    }
                } else if (effType === "highlightSweep") {
                    if (fillEl) {
                        fillEl.style.opacity = `${(
                            (highlightOpacity / 100) *
                            clamp01(dragT * 1.4)
                        ).toFixed(3)}`
                    }
                    // Left & Right highlight bracket stems
                    for (let h = 0; h < 2; h++) {
                        const hEl = handlesArr[h]
                        if (!hEl) continue
                        const hScale = forceFinalState
                            ? 1
                            : gsapBackOut(
                                  remap01(
                                      progress,
                                      tgt.winDragStart + h * 0.14,
                                      tgt.winDragEnd + h * 0.1
                                  ),
                                  2.2
                              )
                        hEl.style.transform = `scaleY(${hScale.toFixed(3)})`
                    }
                } else if (effType === "underlineDraw") {
                    if (pathEl) {
                        const w = tgt.width
                        const y = tgt.height + 2 * uScale
                        const curveAmp = Math.min(6 * uScale, w * 0.06)
                        const d = `M 0 ${y.toFixed(1)} Q ${(w * 0.25).toFixed(1)} ${(y - curveAmp).toFixed(1)}, ${(w * 0.5).toFixed(1)} ${y.toFixed(1)} T ${w.toFixed(1)} ${(y - curveAmp * 0.4).toFixed(1)}`
                        pathEl.setAttribute("d", d)
                        const len = w * 1.08
                        pathEl.setAttribute(
                            "stroke-dasharray",
                            `${len.toFixed(1)}`
                        )
                        pathEl.setAttribute(
                            "stroke-dashoffset",
                            `${(len * (1 - dragT)).toFixed(1)}`
                        )
                    }
                } else if (effType === "dimensionRule") {
                    if (pathEl) {
                        const w = tgt.width * dragT
                        const y =
                            tgt.resolvedLane === "top"
                                ? -6 * uScale
                                : tgt.height + 6 * uScale
                        const tick = 5 * uScale
                        const d = `M 0 ${(y - tick).toFixed(1)} L 0 ${(y + tick).toFixed(1)} M 0 ${y.toFixed(1)} L ${w.toFixed(1)} ${y.toFixed(1)} M ${w.toFixed(1)} ${(y - tick).toFixed(1)} L ${w.toFixed(1)} ${(y + tick).toFixed(1)}`
                        pathEl.setAttribute("d", d)
                    }
                    if (specLabelEl) {
                        const curPx = Math.round(tgt.width * dragT)
                        specLabelEl.textContent = `${curPx}px`
                        specLabelEl.style.opacity = `${clamp01((dragT - 0.2) * 1.5).toFixed(2)}`
                        specLabelEl.style.transform = `translate(-50%, -50%) scale(${(0.75 + 0.25 * uScale).toFixed(2)})`
                    }
                } else if (effType === "nudgeTap") {
                    if (pathEl) {
                        const w = tgt.width
                        const y = tgt.resolvedLane === "top" ? 0 : tgt.height
                        const d = `M ${(-w * 0.2).toFixed(1)} ${y.toFixed(1)} L ${(w * 1.2).toFixed(1)} ${y.toFixed(1)}`
                        pathEl.setAttribute("d", d)
                        const guideAlpha =
                            !forceFinalState &&
                            progress > tgt.winDragStart - 0.04 &&
                            progress < tgt.winSettleEnd
                                ? Math.sin(
                                      remap01(
                                          progress,
                                          tgt.winDragStart - 0.04,
                                          tgt.winSettleEnd
                                      ) * Math.PI
                                  ) * 0.65
                                : 0
                        pathEl.style.opacity = `${guideAlpha.toFixed(3)}`
                    }
                }

                // ============================================================
                // 3. ANIMATE CURSOR POSITION ALONG BEZIER FLIGHT PATH
                // ============================================================
                let cPos: Vec2 = tgt.finalPos
                let cScale = 1

                if (!forceFinalState && progress < tgt.winSettleEnd) {
                    if (progress < tgt.winDragStart) {
                        const p = gsapPower3Out(
                            remap01(progress, tgt.winStart, tgt.winDragStart)
                        )
                        const ctrl1: Vec2 = {
                            x:
                                tgt.entryStart.x +
                                (tgt.dragStart.x - tgt.entryStart.x) * 0.35,
                            y: tgt.entryStart.y - 25 * uScale,
                        }
                        const ctrl2: Vec2 = {
                            x:
                                tgt.entryStart.x +
                                (tgt.dragStart.x - tgt.entryStart.x) * 0.75,
                            y: tgt.dragStart.y - 18 * uScale,
                        }
                        cPos = evalCubicBezier(
                            tgt.entryStart,
                            ctrl1,
                            ctrl2,
                            tgt.dragStart,
                            p
                        )
                        cScale = gsapBackOut(
                            remap01(
                                progress,
                                tgt.winStart,
                                tgt.winStart + 0.16
                            ),
                            1.75
                        )
                    } else if (progress < tgt.winDragEnd) {
                        cPos = {
                            x:
                                tgt.dragStart.x +
                                (tgt.dragEnd.x - tgt.dragStart.x) * dragT,
                            y:
                                tgt.dragStart.y +
                                (tgt.dragEnd.y - tgt.dragStart.y) * dragT,
                        }
                        cScale = 0.92
                    } else {
                        const p = settleT
                        const ctrl1: Vec2 = {
                            x: tgt.dragEnd.x + 18 * uScale,
                            y: (tgt.dragEnd.y + tgt.finalPos.y) * 0.5,
                        }
                        const ctrl2: Vec2 = {
                            x: tgt.finalPos.x + 8 * uScale,
                            y: tgt.finalPos.y,
                        }
                        cPos = evalCubicBezier(
                            tgt.dragEnd,
                            ctrl1,
                            ctrl2,
                            tgt.finalPos,
                            clamp01(p)
                        )
                        cScale = 0.92 + 0.08 * clamp01(p)
                    }
                }

                const phaseSeed = k * 1.85 + 0.5
                const idleX =
                    Math.sin(tSec * (1.45 + (k % 3) * 0.18) + phaseSeed) *
                        idleAmp +
                    (interactiveHover
                        ? (k % 2 === 0 ? 1 : -1) * ptr.x * 9 * uScale
                        : 0)
                const idleY =
                    Math.cos(tSec * (1.25 + (k % 2) * 0.22) + phaseSeed) *
                        idleAmp +
                    (interactiveHover
                        ? (k % 2 === 0 ? 1 : -1) * ptr.y * 8 * uScale
                        : 0)

                const cOuter = cursorOuterRefs.current[k]
                const cInner = cursorInnerRefs.current[k]
                const cRipple = cursorRippleRefs.current[k]

                if (cOuter && cInner) {
                    const cAlpha = forceFinalState
                        ? 1
                        : clamp01(
                              remap01(
                                  progress,
                                  tgt.winStart,
                                  tgt.winStart + 0.12
                              )
                          )
                    cOuter.style.opacity = `${cAlpha.toFixed(3)}`
                    cOuter.style.transform = `translate3d(${(cPos.x + idleX).toFixed(2)}px, ${(cPos.y + idleY).toFixed(2)}px, 0px)`
                    cInner.style.transform = `scale(${(uScale * cScale).toFixed(3)})`
                }

                if (cRipple) {
                    const rT = remap01(
                        progress,
                        tgt.winDragEnd - 0.04,
                        tgt.winDragEnd + 0.18
                    )
                    const rAlpha =
                        !forceFinalState && rT > 0 && rT < 1
                            ? (1 - rT) * 0.7
                            : 0
                    cRipple.style.opacity = `${rAlpha.toFixed(3)}`
                    cRipple.style.transform = `translate(-50%, -50%) scale(${(0.3 + rT * 2.3).toFixed(2)})`
                }

                // Lottie Motion Trail Path
                const trailEl = trailPathRefs.current[k]
                if (trailEl) {
                    if (
                        !showMotionTrails ||
                        forceFinalState ||
                        progress >= tgt.winSettleEnd
                    ) {
                        trailEl.style.opacity = "0"
                    } else {
                        const c1x =
                            tgt.entryStart.x +
                            (tgt.dragStart.x - tgt.entryStart.x) * 0.35
                        const c1y = tgt.entryStart.y - 25 * uScale
                        const c2x =
                            tgt.entryStart.x +
                            (tgt.dragStart.x - tgt.entryStart.x) * 0.75
                        const c2y = tgt.dragStart.y - 18 * uScale
                        const dTrail = `M ${tgt.entryStart.x.toFixed(1)} ${tgt.entryStart.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${tgt.dragStart.x.toFixed(1)} ${tgt.dragStart.y.toFixed(1)}`
                        trailEl.setAttribute("d", dTrail)
                        const trailFade =
                            progress < tgt.winDragStart
                                ? remap01(
                                      progress,
                                      tgt.winStart,
                                      tgt.winDragStart
                                  ) * 0.45
                                : (1 -
                                      remap01(
                                          progress,
                                          tgt.winDragStart,
                                          tgt.winDragEnd + 0.12
                                      )) *
                                  0.45
                        trailEl.style.opacity = `${Math.max(0, trailFade).toFixed(3)}`
                    }
                }
            }
        },
        [
            measureLayout,
            duration,
            delay,
            stagger,
            springOvershoot,
            shouldAnimate,
            loopAnimation,
            loopDelay,
            textColor,
            textAnimationStyle,
            highlightOpacity,
            showMotionTrails,
            idleMotion,
            idleIntensity,
            interactiveHover,
        ]
    )

    // ========================================================================
    // LIFECYCLE: RESIZE OBSERVER, INTERSECTION OBSERVER & RAF LOOP
    // ========================================================================
    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let frameId = 0

        const handleResize = () => {
            measureLayout()
            renderFrame(performance.now(), !shouldAnimate)
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)
        if (stageRef.current) {
            resizeObserver.observe(stageRef.current)
        }

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (!entry) return
                isIntersectingRef.current = entry.isIntersecting

                if (
                    entry.isIntersecting &&
                    triggerMode === "appear" &&
                    !hasTriggeredAppearRef.current
                ) {
                    hasTriggeredAppearRef.current = true
                    animStartTimeRef.current = performance.now()
                }
            },
            { threshold: 0.12 }
        )
        intersectionObserver.observe(container)

        measureLayout()
        if (triggerMode === "mount") {
            animStartTimeRef.current = performance.now()
            hasTriggeredAppearRef.current = true
        }

        if (typeof document !== "undefined" && (document as any).fonts?.ready) {
            ;(document as any).fonts.ready.then(() => {
                measureLayout()
                renderFrame(performance.now(), !shouldAnimate)
            })
        }

        if (!shouldAnimate) {
            renderFrame(performance.now(), true)
        } else {
            const tick = (now: number) => {
                if (isIntersectingRef.current) {
                    const forceCompleted =
                        triggerMode === "hover" &&
                        !hasTriggeredAppearRef.current
                    renderFrame(now, forceCompleted)
                }
                frameId = requestAnimationFrame(tick)
            }
            frameId = requestAnimationFrame(tick)
        }

        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
        }
    }, [measureLayout, renderFrame, shouldAnimate, triggerMode])

    // Trigger manual frame push on prop updates when static/paused (Rule 12)
    useEffect(() => {
        measureLayout()
        if (!shouldAnimate) {
            renderFrame(performance.now(), true)
        }
    }, [
        safeText,
        font,
        activeCursors,
        textColor,
        boxColor,
        boxStrokeWidth,
        handleSize,
        highlightOpacity,
        scaleWithText,
        badgeScale,
        paddingX,
        paddingY,
        measureLayout,
        renderFrame,
        shouldAnimate,
    ])

    // ========================================================================
    // INTERACTION HANDLERS (HOVER, CLICK REPLAY & SAFE NAVIGATION)
    // ========================================================================
    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const el = mountRef.current
            if (!el) return
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) return

            pointerRef.current.targetX =
                ((e.clientX - r.left) / r.width - 0.5) * 2
            pointerRef.current.targetY =
                ((e.clientY - r.top) / r.height - 0.5) * 2

            const dx = e.clientX - pointerRef.current.downX
            const dy = e.clientY - pointerRef.current.downY
            if (dx * dx + dy * dy > 36) {
                pointerRef.current.isDragging = true
            }

            if (!shouldAnimate) {
                renderFrame(performance.now(), true)
            }
        },
        [shouldAnimate, renderFrame]
    )

    const handlePointerEnter = useCallback(() => {
        if (triggerMode === "hover" && shouldAnimate) {
            hasTriggeredAppearRef.current = true
            animStartTimeRef.current = performance.now()
        }
    }, [triggerMode, shouldAnimate])

    const handlePointerLeave = useCallback(() => {
        pointerRef.current.targetX = 0
        pointerRef.current.targetY = 0
        if (!shouldAnimate) {
            renderFrame(performance.now(), true)
        }
    }, [shouldAnimate, renderFrame])

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            pointerRef.current.downX = e.clientX
            pointerRef.current.downY = e.clientY
            pointerRef.current.isDragging = false
        },
        []
    )

    const handleReplayClick = useCallback(
        (e: React.MouseEvent) => {
            if (pointerRef.current.isDragging) {
                e.preventDefault()
                return
            }
            if (replayOnClick && shouldAnimate) {
                hasTriggeredAppearRef.current = true
                animStartTimeRef.current = performance.now()
            }
        },
        [replayOnClick, shouldAnimate]
    )

    // ========================================================================
    // RENDER VECTOR EFFECT LAYER FOR EACH CURSOR
    // ========================================================================
    const handleCorners = [
        { left: "0%", top: "0%" },
        { left: "100%", top: "0%" },
        { left: "100%", top: "100%" },
        { left: "0%", top: "100%" },
    ]

    const renderEffectElement = (cfg: CursorConfig, k: number) => {
        const effType = cfg.effectType || "selectBox"
        const effColor = cfg.useCustomEffectColor ? cfg.color : boxColor

        if (!effectHandlesRefs.current[k]) {
            effectHandlesRefs.current[k] = []
        }

        return (
            <div
                key={`effect-${k}`}
                ref={(el) => {
                    effectGroupRefs.current[k] = el
                }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: "none",
                    zIndex: effType === "highlightSweep" ? 1 : 3,
                    willChange: "transform, width, height, opacity",
                }}
            >
                {/* 1. SELECTION BOX EFFECT */}
                {effType === "selectBox" && (
                    <>
                        <div
                            ref={(el) => {
                                effectFillRefs.current[k] = el
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: effColor,
                                opacity: 0,
                            }}
                        />
                        <svg
                            width="100%"
                            height="100%"
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "visible",
                                display: "block",
                            }}
                        >
                            <rect
                                ref={(el) => {
                                    effectSvgRectRefs.current[k] = el
                                }}
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                fill="none"
                                stroke={effColor}
                                strokeWidth={boxStrokeWidth}
                                vectorEffect="non-scaling-stroke"
                            />
                        </svg>
                        {handleCorners.map((pos, hIdx) => (
                            <div
                                key={hIdx}
                                ref={(el) => {
                                    effectHandlesRefs.current[k][hIdx] = el
                                }}
                                style={{
                                    position: "absolute",
                                    left: pos.left,
                                    top: pos.top,
                                    width: handleSize,
                                    height: handleSize,
                                    backgroundColor: "#FFFFFF",
                                    border: `${Math.max(1.5, boxStrokeWidth)}px solid ${effColor}`,
                                    boxSizing: "border-box",
                                    transform: "translate(-50%, -50%)",
                                    willChange: "transform",
                                }}
                            />
                        ))}
                    </>
                )}

                {/* 2. HIGHLIGHT SWEEP EFFECT */}
                {effType === "highlightSweep" && (
                    <>
                        <div
                            ref={(el) => {
                                effectFillRefs.current[k] = el
                            }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: cfg.color,
                                borderRadius: 6,
                                opacity: 0,
                            }}
                        />
                        {[0, 1].map((side) => (
                            <div
                                key={side}
                                ref={(el) => {
                                    effectHandlesRefs.current[k][side] = el
                                }}
                                style={{
                                    position: "absolute",
                                    left: side === 0 ? 0 : "100%",
                                    top: -2,
                                    bottom: -2,
                                    width: Math.max(2, boxStrokeWidth),
                                    backgroundColor: cfg.color,
                                    borderRadius: 2,
                                    transformOrigin:
                                        side === 0 ? "top" : "bottom",
                                }}
                            >
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: side === 0 ? -4 : "100%",
                                        width: 7,
                                        height: 7,
                                        borderRadius: "50%",
                                        backgroundColor: cfg.color,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                />
                            </div>
                        ))}
                    </>
                )}

                {/* 3. UNDERLINE DRAW, DIMENSION RULE, OR NUDGE GUIDE */}
                {(effType === "underlineDraw" ||
                    effType === "dimensionRule" ||
                    effType === "nudgeTap") && (
                    <>
                        <svg
                            width="100%"
                            height="100%"
                            style={{
                                position: "absolute",
                                inset: 0,
                                overflow: "visible",
                                display: "block",
                            }}
                        >
                            <path
                                ref={(el) => {
                                    effectPathRefs.current[k] = el
                                }}
                                fill="none"
                                stroke={cfg.color}
                                strokeWidth={
                                    effType === "underlineDraw"
                                        ? Math.max(2.5, boxStrokeWidth * 1.3)
                                        : Math.max(1.5, boxStrokeWidth)
                                }
                                strokeLinecap="round"
                                strokeDasharray={
                                    effType === "nudgeTap" ? "4 4" : undefined
                                }
                            />
                        </svg>
                        {effType === "dimensionRule" && (
                            <div
                                ref={(el) => {
                                    effectSpecLabelRefs.current[k] = el
                                }}
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top:
                                        cfg.lane === "top"
                                            ? -8
                                            : "calc(100% + 8px)",
                                    backgroundColor: cfg.color,
                                    color: cfg.textColor || "#FFFFFF",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    fontFamily: "monospace",
                                    whiteSpace: "nowrap",
                                    transform: "translate(-50%, -50%)",
                                }}
                            />
                        )}
                    </>
                )}
            </div>
        )
    }

    // ========================================================================
    // RENDER COLLABORATIVE CURSOR DART + PILL BADGE
    // ========================================================================
    const renderCursorElement = (cfg: CursorConfig, k: number) => {
        const bgColor = cfg.color || "#7B2BF9"
        const fgColor = cfg.textColor || "#FFFFFF"

        return (
            <div
                key={`cursor-${k}`}
                ref={(el) => {
                    cursorOuterRefs.current[k] = el
                }}
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    pointerEvents: "none",
                    zIndex: 5 + k,
                    willChange: "transform, opacity",
                }}
            >
                <div
                    ref={(el) => {
                        cursorInnerRefs.current[k] = el
                    }}
                    style={{
                        position: "relative",
                        transformOrigin: "3.5px 3.5px",
                        willChange: "transform",
                    }}
                >
                    {/* Click Ripple Ring */}
                    <div
                        ref={(el) => {
                            cursorRippleRefs.current[k] = el
                        }}
                        style={{
                            position: "absolute",
                            left: 4,
                            top: 4,
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: `2px solid ${bgColor}`,
                            opacity: 0,
                            pointerEvents: "none",
                        }}
                    />

                    {/* Vector Cursor Dart SVG */}
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        style={{
                            display: "block",
                            overflow: "visible",
                            filter: "drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.18))",
                        }}
                    >
                        <path
                            d="M 3.5 3.5 L 27.5 11.8 L 16.5 16.5 L 11.8 27.5 Z"
                            fill={bgColor}
                            stroke="#FFFFFF"
                            strokeWidth="2.6"
                            strokeLinejoin="round"
                        />
                    </svg>

                    {/* Name Pill Badge */}
                    {cfg.name && (
                        <div
                            style={{
                                position: "absolute",
                                left: 21,
                                top: 21,
                                backgroundColor: bgColor,
                                color: fgColor,
                                padding: "5px 12px",
                                borderRadius: 8,
                                fontSize: 20,
                                fontWeight: 500,
                                fontFamily:
                                    font?.fontFamily ||
                                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                                lineHeight: 1.15,
                                letterSpacing: "-0.01em",
                                whiteSpace: "nowrap",
                                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.12)",
                                userSelect: "none",
                            }}
                        >
                            {cfg.name}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const textAlign = font?.textAlign || "center"
    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"

    const stageContent = (
        <div
            ref={stageRef}
            style={{
                position: "relative",
                display: "inline-block",
                padding: `${paddingY}px ${paddingX}px`,
                boxSizing: "border-box",
                maxWidth: "100%",
                textAlign,
            }}
        >
            {/* LOTTIE MOTION TRAIL SVG LAYER */}
            <svg
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            >
                {activeCursors.map((cfg, k) => (
                    <path
                        key={`trail-${k}`}
                        ref={(el) => {
                            trailPathRefs.current[k] = el
                        }}
                        fill="none"
                        stroke={cfg.color || "#7B2BF9"}
                        strokeWidth="1.75"
                        strokeDasharray="5 5"
                        strokeLinecap="round"
                        style={{ opacity: 0 }}
                    />
                ))}
            </svg>

            {/* NATIVE FRAMER TYPOGRAPHY LAYER (WITH WORD-BOUNDARY WRAPPING) */}
            <div
                style={{
                    position: "relative",
                    zIndex: 2,
                    color: textColor,
                    margin: 0,
                    userSelect: "none",
                    ...font,
                }}
                aria-label={safeText}
            >
                {parsedText.tokens.map((tok, tIdx) => {
                    if (tok.type === "newline") {
                        const cInfo = tok.chars[0]
                        return (
                            <React.Fragment key={`nl-${tIdx}`}>
                                <span
                                    ref={(el) => {
                                        charLayoutRefs.current[
                                            cInfo.globalIndex
                                        ] = el
                                    }}
                                    style={{
                                        display: "inline-block",
                                        width: 0,
                                    }}
                                />
                                <br />
                            </React.Fragment>
                        )
                    }

                    if (tok.type === "space") {
                        const cInfo = tok.chars[0]
                        return (
                            <React.Fragment key={`sp-${tIdx}`}>
                                <span
                                    ref={(el) => {
                                        charLayoutRefs.current[
                                            cInfo.globalIndex
                                        ] = el
                                    }}
                                    style={{
                                        display: "inline-block",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    <span
                                        ref={(el) => {
                                            charAnimRefs.current[
                                                cInfo.globalIndex
                                            ] = el
                                        }}
                                        style={{
                                            display: "inline-block",
                                            whiteSpace: "pre",
                                        }}
                                    >
                                        {"\u00A0"}
                                    </span>
                                </span>
                                <wbr />
                            </React.Fragment>
                        )
                    }

                    // Non-breaking Word Wrapper so words wrap cleanly between words
                    return (
                        <span
                            key={`word-${tIdx}`}
                            style={{
                                display: "inline-block",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {tok.chars.map(({ ch, globalIndex }) => (
                                <span
                                    key={`ch-${globalIndex}`}
                                    ref={(el) => {
                                        charLayoutRefs.current[globalIndex] = el
                                    }}
                                    style={{
                                        position: "relative",
                                        display: "inline-block",
                                        whiteSpace: "pre",
                                    }}
                                >
                                    {/* Vector Outline Draw Layer */}
                                    <span
                                        ref={(el) => {
                                            charStrokeRefs.current[
                                                globalIndex
                                            ] = el
                                        }}
                                        aria-hidden="true"
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            display: "inline-block",
                                            color: "transparent",
                                            WebkitTextStroke: `1.5px ${textColor}`,
                                            pointerEvents: "none",
                                            opacity: 0,
                                            willChange:
                                                "transform, opacity, clip-path",
                                        }}
                                    >
                                        {ch}
                                    </span>

                                    {/* Solid Typography Character Layer */}
                                    <span
                                        ref={(el) => {
                                            charAnimRefs.current[globalIndex] =
                                                el
                                        }}
                                        style={{
                                            display: "inline-block",
                                            willChange:
                                                "transform, opacity, clip-path",
                                        }}
                                    >
                                        {ch}
                                    </span>
                                </span>
                            ))}
                        </span>
                    )
                })}
            </div>

            {/* DYNAMIC VECTOR EFFECTS (BOXES, HIGHLIGHTS, UNDERLINES, SPECS) */}
            {activeCursors.map((cfg, k) => renderEffectElement(cfg, k))}

            {/* DYNAMIC COLLABORATIVE CURSORS */}
            {activeCursors.map((cfg, k) => renderCursorElement(cfg, k))}
        </div>
    )

    // ========================================================================
    // ROOT CONTAINER (RULE 10 & RULE 17)
    // ========================================================================
    return (
        <div
            {...props}
            ref={mountRef}
            onPointerMove={handlePointerMove}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onClick={handleReplayClick}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent,
                backgroundColor,
                overflow: "visible",
                cursor: normalizedHref || replayOnClick ? "pointer" : "default",
                boxSizing: "border-box",
                ...props.style,
            }}
        >
            {normalizedHref ? (
                <a
                    href={normalizedHref}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    onClick={handleReplayClick}
                    style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent,
                        maxWidth: "100%",
                    }}
                >
                    {stageContent}
                </a>
            ) : (
                stageContent
            )}
        </div>
    )
}

// ============================================================================
// STEP 2: NESTED DEFAULTS (RULE 9)
// ============================================================================
CollaborativeTextReveal.defaultProps = {
    livePreview: true,
    text: "PORTFOLIO",
    font: {"fontSize":"142px","variant":"Regular","letterSpacing":"-0.07em","lineHeight":"1.1em","textAlign":"center","fontWeight":500,"fontStyle":"normal","fontFamily":"\"Roboto Condensed\", \"Roboto Condensed Placeholder\", sans-serif"},
    cursors: DEFAULT_CURSORS,
    typography: {
        textColor: "rgb(0, 0, 0)",
        backgroundColor: "rgba(255, 255, 255, 0)",
        scaleWithText: true,
        badgeScale: 100,
        autoAddOnLongText: false,
        paddingX: 44,
        paddingY: 44,
    },
    animation: {
        triggerMode: "appear",
        textAnimationStyle: "drawAndSpring",
        duration: 2.5,
        delay: 0,
        stagger: 35,
        springOvershoot: 250,
        showMotionTrails: true,
        idleMotion: true,
        idleIntensity: 100,
        loopAnimation: false,
        loopDelay: 3.0,
    },
    boxStyleGroup: {
        boxColor: "rgb(24, 144, 255)",
        boxStrokeWidth: 2.5,
        handleSize: 8,
        highlightOpacity: 5,
    },
    interaction: {
        interactiveHover: true,
        replayOnClick: false,
        link: "",
        openInNewTab: false,
    },
}

// ============================================================================
// STEP 3: UI CATEGORIZATION & PROPERTY CONTROLS (RULES 9, 13, 14, 16, 17)
// ============================================================================
addPropertyControls(CollaborativeTextReveal, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Play animation inside Framer editor.",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "PORTFOLIO",
        description: "Short word or long multi-word text.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "142px",
            variant: "Medium",
            letterSpacing: "-0.07em",
            lineHeight: "1.1em",
            textAlign: "center",
        },
        description: "Native Framer typography picker.",
    },
    cursors: {
        type: ControlType.Array,
        title: "Cursors & Effects",
        description: "Add unlimited cursors and custom effects.",
        defaultValue: DEFAULT_CURSORS,
        control: {
            type: ControlType.Object,
            title: "Cursor Effect",
            controls: {
                enabled: {
                    type: ControlType.Boolean,
                    title: "Enabled",
                    defaultValue: true,
                    enabledTitle: "Show",
                    disabledTitle: "Hide",
                    description: "Toggle this cursor on or off.",
                },
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "Alex M",
                    description: "Badge label text.",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#7B2BF9",
                    description: "Cursor and badge accent color.",
                },
                textColor: {
                    type: ControlType.Color,
                    title: "Label Color",
                    defaultValue: "#FFFFFF",
                    description: "Text color inside badge pill.",
                },
                effectType: {
                    type: ControlType.Enum,
                    title: "Effect Type",
                    options: [
                        "selectBox",
                        "highlightSweep",
                        "underlineDraw",
                        "dimensionRule",
                        "nudgeTap",
                        "floatingCursor",
                    ],
                    optionTitles: [
                        "Selection Box (Handles)",
                        "Highlight Sweep",
                        "Vector Underline Draw",
                        "Measure Spec Rule",
                        "Elastic Tap & Guide",
                        "Cursor Only",
                    ],
                    defaultValue: "selectBox",
                    description: "Visual action drawn by cursor.",
                },
                textReaction: {
                    type: ControlType.Enum,
                    title: "Text Reaction",
                    options: [
                        "subtlePop",
                        "colorAccent",
                        "tiltWithBox",
                        "none",
                    ],
                    optionTitles: [
                        "Elastic Pop",
                        "Color Accent Tint",
                        "Tilt With Box",
                        "None",
                    ],
                    defaultValue: "subtlePop",
                    description: "How target letters react.",
                },
                placementMode: {
                    type: ControlType.Enum,
                    title: "Target Mode",
                    options: ["auto", "percent", "word", "chars"],
                    optionTitles: [
                        "Smart Auto-Balance",
                        "By Percentage (%)",
                        "By Word Number",
                        "By Char Index",
                    ],
                    defaultValue: "auto",
                    description: "How cursor picks target letters.",
                },
                targetPosition: {
                    type: ControlType.Number,
                    title: "Target Pos",
                    defaultValue: 50,
                    min: 0,
                    max: 200,
                    step: 1,
                    unit: "%",
                    hidden: (p) =>
                        !p.placementMode || p.placementMode === "auto",
                    description: "Target percent, word #, or char.",
                },
                targetSpan: {
                    type: ControlType.Number,
                    title: "Span Length",
                    defaultValue: 3,
                    min: 1,
                    max: 30,
                    step: 1,
                    unit: "ch",
                    hidden: (p) =>
                        !p.placementMode ||
                        p.placementMode === "auto" ||
                        p.placementMode === "word",
                    description: "Number of letters to select.",
                },
                lane: {
                    type: ControlType.Enum,
                    title: "Park Lane",
                    options: ["auto", "top", "bottom", "right"],
                    optionTitles: ["Auto", "Top", "Bottom", "Right"],
                    defaultValue: "auto",
                    description: "Where cursor parks after draw.",
                },
                boxRotation: {
                    type: ControlType.Number,
                    title: "Box Tilt",
                    defaultValue: 0,
                    min: -45,
                    max: 45,
                    step: 1,
                    unit: "deg",
                    hidden: (p) => p.effectType && p.effectType !== "selectBox",
                    description: "Tilt angle of selection box.",
                },
                useCustomEffectColor: {
                    type: ControlType.Boolean,
                    title: "Box Color",
                    defaultValue: false,
                    enabledTitle: "Cursor",
                    disabledTitle: "Global",
                    hidden: (p) => p.effectType && p.effectType !== "selectBox",
                    description: "Use cursor color for box border.",
                },
                offsetX: {
                    type: ControlType.Number,
                    title: "Offset X",
                    defaultValue: 0,
                    min: -200,
                    max: 200,
                    step: 2,
                    unit: "px",
                    description: "Fine-tune horizontal offset.",
                },
                offsetY: {
                    type: ControlType.Number,
                    title: "Offset Y",
                    defaultValue: 0,
                    min: -200,
                    max: 200,
                    step: 2,
                    unit: "px",
                    description: "Fine-tune vertical offset.",
                },
            },
        },
    },
    typography: {
        type: ControlType.Object,
        title: "Layout & Balance",
        description: "Colors, UI scaling, and long-text balance.",
        controls: {
            textColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue: "rgb(0, 0, 0)",
                description: "Primary headline text color.",
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "rgba(255, 255, 255, 0)",
                description: "Component background fill.",
            },
            scaleWithText: {
                type: ControlType.Boolean,
                title: "Smart Scale",
                defaultValue: true,
                enabledTitle: "Smart",
                disabledTitle: "Fixed",
                description: "Balanced UI scaling with font size.",
            },
            badgeScale: {
                type: ControlType.Number,
                title: "Badge Scale",
                defaultValue: 100,
                min: 40,
                max: 200,
                step: 5,
                unit: "%",
                description: "Overall size multiplier for cursors.",
            },
            autoAddOnLongText: {
                type: ControlType.Boolean,
                title: "Long Text Fill",
                defaultValue: false,
                enabledTitle: "Auto +",
                disabledTitle: "Exact",
                description: "Auto-add extra cursors on long text.",
            },
            paddingX: {
                type: ControlType.Number,
                title: "Padding X",
                defaultValue: 44,
                min: 0,
                max: 240,
                step: 4,
                unit: "px",
                description: "Horizontal inner stage padding.",
            },
            paddingY: {
                type: ControlType.Number,
                title: "Padding Y",
                defaultValue: 44,
                min: 0,
                max: 240,
                step: 4,
                unit: "px",
                description: "Vertical inner stage padding.",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "GSAP & Lottie Motion",
        description: "Timeline timing, spring physics, and style.",
        controls: {
            triggerMode: {
                type: ControlType.Enum,
                title: "Trigger",
                options: ["appear", "mount", "hover"],
                optionTitles: ["On Scroll Appear", "On Mount", "On Hover"],
                defaultValue: "appear",
                description: "When the draw sequence starts.",
            },
            textAnimationStyle: {
                type: ControlType.Enum,
                title: "Draw Style",
                options: [
                    "drawAndSpring",
                    "gsapSplitSpring",
                    "strokeLineDraw",
                    "typewriterDraw",
                ],
                optionTitles: [
                    "Lottie Draw + Spring",
                    "GSAP Split Spring",
                    "Vector Stroke Draw",
                    "Typewriter Reveal",
                ],
                defaultValue: "drawAndSpring",
                description: "Character reveal animation mode.",
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                defaultValue: 2.5,
                min: 0.4,
                max: 8.0,
                step: 0.1,
                unit: "s",
                description: "Total timeline animation length.",
            },
            delay: {
                type: ControlType.Number,
                title: "Delay",
                defaultValue: 0,
                min: 0,
                max: 5.0,
                step: 0.1,
                unit: "s",
                description: "Wait time before starting.",
            },
            stagger: {
                type: ControlType.Number,
                title: "Char Stagger",
                defaultValue: 35,
                min: 0,
                max: 150,
                step: 4,
                unit: "ms",
                description: "Time offset between letters.",
            },
            springOvershoot: {
                type: ControlType.Number,
                title: "Spring Bounce",
                defaultValue: 250,
                min: 0,
                max: 250,
                step: 10,
                unit: "%",
                description: "Elastic bounce overshoot intensity.",
            },
            showMotionTrails: {
                type: ControlType.Boolean,
                title: "Motion Trails",
                defaultValue: true,
                enabledTitle: "Show",
                disabledTitle: "Hide",
                description: "Draw dashed cursor flight paths.",
            },
            idleMotion: {
                type: ControlType.Boolean,
                title: "Idle Float",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Subtle cursor float after appear.",
            },
            idleIntensity: {
                type: ControlType.Number,
                title: "Float Amount",
                defaultValue: 100,
                min: 0,
                max: 250,
                step: 10,
                unit: "%",
                description: "Amplitude of ambient cursor drift.",
            },
            loopAnimation: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: false,
                enabledTitle: "Loop",
                disabledTitle: "Once",
                description: "Repeat sequence automatically.",
            },
            loopDelay: {
                type: ControlType.Number,
                title: "Loop Pause",
                defaultValue: 3.0,
                min: 0.5,
                max: 15.0,
                step: 0.5,
                unit: "s",
                description: "Wait time between loop cycles.",
            },
        },
    },
    boxStyleGroup: {
        type: ControlType.Object,
        title: "Box & Effect Style",
        description: "Global border, handle, and highlight styles.",
        controls: {
            boxColor: {
                type: ControlType.Color,
                title: "Box Color",
                defaultValue: "rgb(24, 144, 255)",
                description: "Default selection box border color.",
            },
            boxStrokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                defaultValue: 2.5,
                min: 1,
                max: 6,
                step: 0.5,
                unit: "px",
                description: "Thickness of box and effect lines.",
            },
            handleSize: {
                type: ControlType.Number,
                title: "Handle Size",
                defaultValue: 8,
                min: 4,
                max: 16,
                step: 1,
                unit: "px",
                description: "Size of corner resize squares.",
            },
            highlightOpacity: {
                type: ControlType.Number,
                title: "Highlight Fill",
                defaultValue: 5,
                min: 5,
                max: 60,
                step: 1,
                unit: "%",
                description: "Opacity of highlight sweep bars.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction & Link",
        description:
            "Hover parallax, click replay, and navigation.\n\nMore components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            interactiveHover: {
                type: ControlType.Boolean,
                title: "Hover Parallax",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Cursors react to mouse movement.",
            },
            replayOnClick: {
                type: ControlType.Boolean,
                title: "Click Replay",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Replay draw animation on click.",
            },
            link: {
                type: ControlType.Link,
                title: "Link",
                description: "Optional click destination URL.",
            },
            openInNewTab: {
                type: ControlType.Boolean,
                title: "New Tab",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Open link in a new browser tab.",
            },
        },
    },
})
