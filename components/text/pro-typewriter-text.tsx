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

import { motion } from "framer-motion"

type Mode = "chars" | "words"
type ContentMode = "lines" | "paragraph"
type LoopStyle = "delete" | "fade"
type DeleteMode = "chars" | "words" | "line" | "instant"
type CaretStyle = "bar" | "block" | "underscore" | "custom"
type GradientCompletion = "solid" | "full" | "trail" | "fade"
type Phase =
    | "idleDelay"
    | "typing"
    | "pauseAfterType"
    | "deleting"
    | "pauseAfterDelete"
    | "fadingOut"
    | "fadingIn"

type TypingGroup = {
    enabled: boolean
    mode: Mode
    loop: boolean
    loopStyle: LoopStyle
    deleteMode: DeleteMode
}

type TimingGroup = {
    startDelay: number
    typeSpeed: number
    wordDelay: number
    deleteSpeed: number
    pauseAfterType: number
    pauseAfterDelete: number
    fadeDuration: number
}

type SmartPauseGroup = {
    enabled: boolean
    commaPause: number
    periodPause: number
    ellipsisPause: number
    linePause: number
}

type CursorGroup = {
    enabled: boolean
    caretStyle: CaretStyle
    caretCustom: string
    caretGap: number
    autoSize: boolean
    caretWidth: number
    caretHeight: number
    caretRadius: number
    caretOffsetX: number
    caretOffsetY: number
    blink: boolean
    blinkSpeed: number
    glow: boolean
    glowBlur: number
    glowOpacity: number
    caretColorIdle: string
    caretColorTyping: string
    caretFadeSpeed: number
}

type EffectsGroup = {
    highlight: boolean
    highlightColor: string
    highlightFadeMs: number
    scramble: boolean
    scrambleIntensity: number
    scrambleChars: string
}

type LayoutGroup = {
    stableHeight: boolean
    maxLines: number
    preserveBlankLines: boolean
    lineGap: number
}

type GradientGroup = {
    enabled: boolean
    from: string
    to: string
    angle: number
    trailChars: number
    completion: GradientCompletion
    completionFadeMs: number
    lineFadeMs: number
}

type BackgroundGroup = {
    enabled: boolean
    color: string
    radius: number
    padY: number
    padX: number
}

type PerformanceGroup = {
    respectReducedMotion: boolean
    pauseOffscreen: boolean
}

type Props = {
    texts: string
    contentMode: ContentMode

    titleFont: any
    color: string

    typing: TypingGroup
    timing: TimingGroup
    smartPause: SmartPauseGroup
    cursor: CursorGroup
    effects: EffectsGroup
    layout: LayoutGroup
    gradient: GradientGroup
    background: BackgroundGroup
    performance: PerformanceGroup
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 520
 * @framerIntrinsicHeight 240
 */
export default function TypewriterText(props: Partial<Props> & FrameProps) {
    const {
        texts = "Built for those who aim higher.\nDesign without distraction.",
        contentMode = "paragraph",

        titleFont,
        color = "#F7F8FF",

        typing,
        timing,
        smartPause,
        cursor,
        effects,
        layout,
        gradient,
        background,
        performance,

        style,
    } = props

    const typingEnabled = typing?.enabled ?? true
    const mode: Mode = typing?.mode ?? "chars"
    const loop = typing?.loop ?? true
    const loopStyle: LoopStyle = typing?.loopStyle ?? "delete"
    const deleteMode: DeleteMode = typing?.deleteMode ?? "chars"

    const startDelay = timing?.startDelay ?? 400
    const typeSpeed = timing?.typeSpeed ?? 45
    const wordDelay = timing?.wordDelay ?? 180
    const deleteSpeed = timing?.deleteSpeed ?? 30
    const pauseAfterType = timing?.pauseAfterType ?? 900
    const pauseAfterDelete = timing?.pauseAfterDelete ?? 300
    const fadeDuration = timing?.fadeDuration ?? 360

    const smartPauseEnabled = smartPause?.enabled ?? true
    const commaPause = smartPause?.commaPause ?? 140
    const periodPause = smartPause?.periodPause ?? 320
    const ellipsisPause = smartPause?.ellipsisPause ?? 520
    const linePause = smartPause?.linePause ?? 260

    const showCursor = cursor?.enabled ?? true
    const caretStyle: CaretStyle = cursor?.caretStyle ?? "block"
    const caretCustom = cursor?.caretCustom ?? "|"
    const caretGap = cursor?.caretGap ?? 0
    const caretAutoSize = cursor?.autoSize ?? true
    const caretWidth = cursor?.caretWidth ?? 10
    const caretHeight = cursor?.caretHeight ?? 42
    const caretRadius = cursor?.caretRadius ?? 0
    const caretOffsetX = cursor?.caretOffsetX ?? 0
    const caretOffsetY = cursor?.caretOffsetY ?? 0
    const blinkCursor = cursor?.blink ?? true
    const blinkSpeed = cursor?.blinkSpeed ?? 500
    const caretGlow = cursor?.glow ?? false
    const caretGlowBlur = cursor?.glowBlur ?? 10
    const caretGlowOpacity = cursor?.glowOpacity ?? 0.8
    const caretColorIdle = cursor?.caretColorIdle ?? "#ff3b30"
    const caretColorTyping = cursor?.caretColorTyping ?? "#ff3b30"
    const caretFadeSpeed = cursor?.caretFadeSpeed ?? 120

    const highlight = effects?.highlight ?? false
    const highlightColor =
        effects?.highlightColor ?? "rgba(255, 230, 130, 0.55)"
    const highlightFadeMs = effects?.highlightFadeMs ?? 260
    const scramble = effects?.scramble ?? false
    const scrambleIntensity = effects?.scrambleIntensity ?? 6
    const scrambleChars =
        effects?.scrambleChars ?? "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    const stableHeight = layout?.stableHeight ?? true
    const maxLines = layout?.maxLines ?? 0
    const preserveBlankLines = layout?.preserveBlankLines ?? true
    const lineGap = Math.max(0, layout?.lineGap ?? 0)

    const gradientEnabled = gradient?.enabled ?? true
    const gradientFrom = gradient?.from ?? "#ff8a80"
    const gradientTo = gradient?.to ?? "#ff3b30"
    const gradientAngle = gradient?.angle ?? 90
    const trailChars = Math.max(0, Math.floor(gradient?.trailChars ?? 3))
    const gradientCompletion: GradientCompletion =
        gradient?.completion ?? "full"
    const completionFadeMs = gradient?.completionFadeMs ?? 320
    const lineFadeMs = gradient?.lineFadeMs ?? 420

    const bgEnabled = background?.enabled ?? false
    const bgColor = background?.color ?? "rgba(0,0,0,0.35)"
    const bgRadius = background?.radius ?? 16
    const bgPadY = background?.padY ?? 14
    const bgPadX = background?.padX ?? 18

    const respectReducedMotion = performance?.respectReducedMotion ?? true
    const pauseOffscreen = performance?.pauseOffscreen ?? true

    const rootRef = React.useRef<HTMLDivElement>(null)
    const isStaticRenderer = useIsStaticRenderer()
    const reducedMotion = useReducedMotionPreference(respectReducedMotion)
    const isInView = useInViewport(rootRef, pauseOffscreen, isStaticRenderer)
    const motionAllowed = !reducedMotion && !isStaticRenderer
    const animationEnabled = typingEnabled && motionAllowed

    const blocks = React.useMemo(() => {
        const raw = (texts || "").replace(/\r\n/g, "\n")
        if (contentMode === "paragraph") return [raw.length ? raw : ""]

        const arr = raw.split("\n").map((s) => s.trimEnd())
        const normalized = preserveBlankLines
            ? arr
            : arr.filter((s) => s.length > 0)

        return normalized.length ? normalized : [""]
    }, [texts, contentMode, preserveBlankLines])

    const [index, setIndex] = React.useState(0)
    const [value, setValue] = React.useState("")
    const [phase, setPhase] = React.useState<Phase>(
        startDelay > 0 ? "idleDelay" : "typing"
    )
    const [cursorVisible, setCursorVisible] = React.useState(true)
    const [highlightOn, setHighlightOn] = React.useState(false)
    const [opacity, setOpacity] = React.useState(1)
    const highlightTimeoutRef = React.useRef<number | null>(null)

    const triggerHighlight = React.useCallback(() => {
        if (!highlight || !motionAllowed) return

        if (highlightTimeoutRef.current !== null) {
            window.clearTimeout(highlightTimeoutRef.current)
        }

        setHighlightOn(true)
        highlightTimeoutRef.current = window.setTimeout(
            () => {
                setHighlightOn(false)
                highlightTimeoutRef.current = null
            },
            Math.max(40, highlightFadeMs)
        )
    }, [highlight, highlightFadeMs, motionAllowed])

    React.useEffect(() => {
        if (highlight && motionAllowed) return

        if (highlightTimeoutRef.current !== null) {
            window.clearTimeout(highlightTimeoutRef.current)
            highlightTimeoutRef.current = null
        }
        setHighlightOn(false)
    }, [highlight, motionAllowed])

    React.useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current !== null) {
                window.clearTimeout(highlightTimeoutRef.current)
                highlightTimeoutRef.current = null
            }
        }
    }, [])

    React.useEffect(() => {
        setIndex(0)
        setValue("")
        setOpacity(1)
        setPhase(startDelay > 0 ? "idleDelay" : "typing")
    }, [blocks.join("\u0000"), startDelay, loopStyle, mode, deleteMode])

    React.useEffect(() => {
        if (!showCursor || !motionAllowed) {
            setCursorVisible(showCursor && motionAllowed)
            return
        }
        if (!blinkCursor || !isInView) {
            setCursorVisible(true)
            return
        }
        const i = window.setInterval(
            () => setCursorVisible((v) => !v),
            Math.max(120, blinkSpeed)
        )
        return () => window.clearInterval(i)
    }, [showCursor, blinkCursor, blinkSpeed, motionAllowed, isInView])

    const {
        fontCss,
        align,
        justify,
        fontSizePx,
        lineHeightNum,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacingPx,
    } = fontToCSS(titleFont)

    const safeLineHeight = Math.max(1.2, lineHeightNum || 1.2)
    const padY = Math.max(10, Math.round(fontSizePx * 0.35))
    const svgId = React.useId()

    const current = blocks[isStaticRenderer ? 0 : index] || ""

    React.useEffect(() => {
        if (!animationEnabled) {
            setValue(blocks[0] || "")
            setIndex(0)
            setOpacity(1)
            setPhase("pauseAfterType")
            return
        }

        if (!isInView) return

        const schedule = (fn: () => void, ms: number) => {
            const t = window.setTimeout(fn, Math.max(0, ms))
            return () => window.clearTimeout(t)
        }

        if (phase === "idleDelay") {
            return schedule(() => setPhase("typing"), startDelay)
        }

        if (phase === "typing") {
            const done = isDoneTyping({
                currentText: current,
                currentValue: value,
            })

            if (done) {
                setPhase("pauseAfterType")
                return
            }

            const nextMs = computeNextDelay({
                mode,
                currentText: current,
                currentValue: value,
                typeSpeed,
                wordDelay,
                smartPause: smartPauseEnabled,
                commaPause,
                periodPause,
                ellipsisPause,
                linePause,
            })

            return schedule(() => {
                const nextValue = nextTypedValue({
                    mode,
                    currentText: current,
                    currentValue: value,
                })

                if (highlight) triggerHighlight()
                setValue(nextValue)
            }, nextMs)
        }

        if (phase === "pauseAfterType") {
            return schedule(() => {
                if (!loop) return
                if (loopStyle === "fade") setPhase("fadingOut")
                else setPhase("deleting")
            }, pauseAfterType)
        }

        if (phase === "deleting") {
            return schedule(
                () => {
                    if (value.length > 0) {
                        if (highlight) triggerHighlight()
                        setValue(nextDeletedValue(value, deleteMode))
                        return
                    }
                    setPhase("pauseAfterDelete")
                },
                deleteMode === "instant" ? 0 : deleteSpeed
            )
        }

        if (phase === "pauseAfterDelete") {
            return schedule(() => {
                setIndex((i) => (i + 1) % blocks.length)
                setValue("")
                setPhase("typing")
            }, pauseAfterDelete)
        }

        if (phase === "fadingOut") {
            setOpacity(0)
            return schedule(() => setPhase("fadingIn"), fadeDuration)
        }

        if (phase === "fadingIn") {
            return schedule(() => {
                setIndex((i) => (i + 1) % blocks.length)
                setValue("")
                setOpacity(1)
                setPhase("typing")
            }, 10)
        }
    }, [
        animationEnabled,
        isInView,
        phase,
        startDelay,
        mode,
        loop,
        loopStyle,
        deleteMode,
        pauseAfterType,
        pauseAfterDelete,
        deleteSpeed,
        typeSpeed,
        wordDelay,
        smartPauseEnabled,
        commaPause,
        periodPause,
        ellipsisPause,
        linePause,
        current,
        blocks,
        value,
        highlight,
        highlightFadeMs,
        triggerHighlight,
        fadeDuration,
    ])

    const animatedDisplayValue = React.useMemo(() => {
        if (!scramble || !motionAllowed || phase !== "typing") return value
        const full = current
        const typed = value
        if (typed.length >= full.length) return typed
        const remaining = full.slice(typed.length)
        const n = Math.min(remaining.length, Math.max(1, scrambleIntensity))
        return typed + randomString(n, scrambleChars)
    }, [
        scramble,
        motionAllowed,
        phase,
        value,
        current,
        scrambleIntensity,
        scrambleChars,
    ])

    const displayValue = isStaticRenderer ? current : animatedDisplayValue
    const renderPhase: Phase = isStaticRenderer ? "pauseAfterType" : phase

    const normalTextStyle: React.CSSProperties = {
        ...fontCss,
        color,
        lineHeight: safeLineHeight,
        whiteSpace: "pre-wrap",
        wordBreak: contentMode === "paragraph" ? "break-word" : "normal",
    }

    const textClampStyle: React.CSSProperties =
        stableHeight && maxLines > 0
            ? {
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical" as any,
                  WebkitLineClamp: maxLines,
                  overflow: "hidden",
              }
            : {}

    const wrapperTextStyle: React.CSSProperties = {
        width: "100%",
        textAlign: align,
        lineHeight: safeLineHeight,
        whiteSpace: "normal",
        wordBreak: "normal",
        transition:
            highlight && motionAllowed
                ? `background-color ${Math.max(0, highlightFadeMs)}ms ease`
                : undefined,
        backgroundColor:
            highlight && highlightOn && motionAllowed
                ? highlightColor
                : "transparent",
        padding:
            highlight && highlightOn && motionAllowed ? "0.06em 0.14em" : "0",
        borderRadius:
            highlight && highlightOn && motionAllowed ? "0.22em" : "0",
        ...textClampStyle,
    }

    const caretColor =
        renderPhase === "typing" ? caretColorTyping : caretColorIdle
    const isFullyTyped =
        displayValue.length >= current.length && current.length > 0

    const visibleLines = displayValue.replace(/\r\n/g, "\n").split("\n")

    const renderLine = (
        line: string,
        lineIndex: number,
        lineCount: number,
        ghost = false
    ) => {
        const isActiveLine = lineIndex === lineCount - 1
        const shouldShowCaret = isActiveLine && !ghost
        const completionActive = isFullyTyped && renderPhase !== "typing"

        // Keep the trail layer mounted for every visible line. This is important:
        // when the caret moves to a new line, the previous line can fade its
        // gradient out instead of losing the trail instantly. The solid text
        // always remains underneath, so Fade Trail can never hide characters.
        const effectiveTrailChars = gradientEnabled
            ? Math.min(trailChars, line.length)
            : 0

        let trailOpacity = 0
        let fullGradientOpacity = 0

        if (gradientEnabled) {
            if (renderPhase === "typing") {
                trailOpacity = isActiveLine ? 1 : 0
            } else if (completionActive) {
                if (gradientCompletion === "full") {
                    fullGradientOpacity = 1
                    trailOpacity = 0
                } else if (gradientCompletion === "trail") {
                    trailOpacity = isActiveLine ? 1 : 0
                } else if (gradientCompletion === "fade") {
                    // The active trail transitions 1 → 0 while the solid base
                    // stays visible beneath it. No trailing characters vanish.
                    trailOpacity = 0
                }
            }
        }

        return (
            <div
                key={`${ghost ? "ghost" : "live"}-${svgId}-${lineIndex}`}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                        align === "center"
                            ? "center"
                            : align === "right"
                              ? "flex-end"
                              : "flex-start",
                    width: "100%",
                    minWidth: 0,
                    minHeight: fontSizePx * safeLineHeight,
                    marginTop: lineIndex > 0 ? lineGap : 0,
                }}
            >
                {ghost ? (
                    <span style={normalTextStyle}>{line || "\u00A0"}</span>
                ) : (
                    <SvgLineWithTrail
                        id={`${svgId}-${lineIndex}`}
                        text={line}
                        trailChars={effectiveTrailChars}
                        trailOpacity={trailOpacity}
                        fullGradientOpacity={fullGradientOpacity}
                        trailFadeMs={
                            completionActive &&
                            (gradientCompletion === "full" ||
                                gradientCompletion === "fade")
                                ? completionFadeMs
                                : lineFadeMs
                        }
                        fullGradientFadeMs={completionFadeMs}
                        staticRender={isStaticRenderer}
                        fontFamily={fontFamily}
                        fontSize={fontSizePx}
                        fontWeight={fontWeight}
                        fontStyle={fontStyle}
                        letterSpacingPx={letterSpacingPx}
                        lineHeight={safeLineHeight}
                        mainColor={color}
                        gradientFrom={gradientFrom}
                        gradientTo={gradientTo}
                        gradientAngle={gradientAngle}
                    />
                )}

                {shouldShowCaret ? (
                    <Caret
                        styleType={caretStyle}
                        custom={caretCustom}
                        gap={caretGap}
                        autoSize={caretAutoSize}
                        width={caretWidth}
                        height={caretHeight}
                        radius={caretRadius}
                        offsetX={caretOffsetX}
                        offsetY={caretOffsetY}
                        visible={
                            showCursor &&
                            (blinkCursor && motionAllowed
                                ? cursorVisible
                                : true)
                        }
                        color={caretColor}
                        fadeSpeed={caretFadeSpeed}
                        glow={caretGlow && motionAllowed}
                        glowBlur={caretGlowBlur}
                        glowOpacity={caretGlowOpacity}
                        fontCss={fontCss}
                        fontSize={fontSizePx}
                        lineHeight={safeLineHeight}
                    />
                ) : null}
            </div>
        )
    }

    const liveContent = (
        <div style={wrapperTextStyle}>
            {visibleLines.map((line, lineIndex) =>
                renderLine(line, lineIndex, visibleLines.length)
            )}
        </div>
    )

    const stableGhosts = stableHeight
        ? blocks.map((block, blockIndex) => {
              const ghostLines = block.replace(/\r\n/g, "\n").split("\n")
              return (
                  <div
                      key={`ghost-block-${blockIndex}`}
                      aria-hidden="true"
                      style={{
                          gridArea: "1 / 1",
                          visibility: "hidden",
                          pointerEvents: "none",
                          width: "100%",
                          minWidth: 0,
                          ...textClampStyle,
                      }}
                  >
                      {ghostLines.map((line, lineIndex) =>
                          renderLine(line, lineIndex, ghostLines.length, true)
                      )}
                  </div>
              )
          })
        : null

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                boxSizing: "border-box",
                padding: `${padY}px 0px`,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    width: "100%",
                    opacity,
                    transition:
                        loopStyle === "fade" && motionAllowed
                            ? `opacity ${Math.max(0, fadeDuration)}ms ease`
                            : undefined,
                    background: bgEnabled ? bgColor : "transparent",
                    borderRadius: bgEnabled ? Math.max(0, bgRadius) : 0,
                    padding: bgEnabled
                        ? `${Math.max(0, bgPadY)}px ${Math.max(0, bgPadX)}px`
                        : 0,
                    boxSizing: "border-box",
                    display: stableHeight ? "grid" : "block",
                    minWidth: 0,
                }}
            >
                {stableGhosts}
                <div
                    style={{
                        gridArea: stableHeight ? "1 / 1" : undefined,
                        width: "100%",
                        minWidth: 0,
                        alignSelf: "start",
                    }}
                >
                    {liveContent}
                </div>
            </div>
        </div>
    )
}

function Caret(props: {
    styleType: CaretStyle
    custom: string
    gap: number
    autoSize: boolean
    width: number
    height: number
    radius: number
    offsetX: number
    offsetY: number
    visible: boolean
    color: string
    fadeSpeed: number
    glow: boolean
    glowBlur: number
    glowOpacity: number
    fontCss: React.CSSProperties
    fontSize: number
    lineHeight: number
}) {
    const {
        styleType,
        custom,
        gap,
        autoSize,
        width,
        height,
        radius,
        offsetX,
        offsetY,
        visible,
        color,
        fadeSpeed,
        glow,
        glowBlur,
        glowOpacity,
        fontCss,
        fontSize,
        lineHeight,
    } = props

    const auto = getAutoCaretMetrics(styleType, fontSize)
    const resolvedWidth = autoSize ? auto.width : Math.max(1, width)
    const resolvedHeight = autoSize ? auto.height : Math.max(1, height)

    const shadow = glow
        ? `0 0 ${Math.max(0, glowBlur)}px ${hexOrRgbaWithOpacity(
              color,
              clamp01(glowOpacity)
          )}`
        : undefined

    const slotStyle: React.CSSProperties = {
        width:
            styleType === "custom"
                ? "auto"
                : Math.max(1, resolvedWidth + Math.max(0, gap)),
        height: fontSize * lineHeight,
        marginLeft: styleType === "custom" ? Math.max(0, gap) : 0,
        flexShrink: 0,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "visible",
        opacity: visible ? 1 : 0,
        transition: `opacity ${Math.max(0, fadeSpeed)}ms ease, color ${Math.max(
            0,
            fadeSpeed
        )}ms ease, background-color ${Math.max(0, fadeSpeed)}ms ease`,
        userSelect: "none",
        pointerEvents: "none",
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        willChange: "opacity, transform",
    }

    if (styleType === "custom") {
        const caret = (custom || "|").trim() || "|"
        return (
            <span
                aria-hidden="true"
                style={{
                    ...slotStyle,
                    ...fontCss,
                    width: "auto",
                    height: "auto",
                    lineHeight,
                    color,
                    textShadow: shadow,
                    whiteSpace: "pre",
                }}
            >
                {caret.slice(0, 4)}
            </span>
        )
    }

    const shapeStyle: React.CSSProperties = {
        width: resolvedWidth,
        height: resolvedHeight,
        background: color,
        borderRadius: Math.max(0, radius),
        boxShadow: shadow,
        flexShrink: 0,
    }

    if (styleType === "underscore") {
        return (
            <span
                aria-hidden="true"
                style={{
                    ...slotStyle,
                    alignItems: "flex-end",
                    paddingBottom: Math.max(0, fontSize * 0.05),
                }}
            >
                <span style={shapeStyle} />
            </span>
        )
    }

    return (
        <span aria-hidden="true" style={slotStyle}>
            <span style={shapeStyle} />
        </span>
    )
}

function getAutoCaretMetrics(style: CaretStyle, fontSize: number) {
    if (style === "bar") {
        return {
            width: Math.max(2, fontSize * 0.035),
            height: fontSize * 0.94,
        }
    }

    if (style === "underscore") {
        return {
            width: fontSize * 0.62,
            height: Math.max(2, fontSize * 0.055),
        }
    }

    return {
        width: fontSize * 0.62,
        height: fontSize * 0.82,
    }
}

function SvgLineWithTrail(props: {
    id: string
    text: string
    trailChars: number
    trailOpacity: number
    fullGradientOpacity: number
    trailFadeMs: number
    fullGradientFadeMs: number
    staticRender: boolean
    fontFamily: string
    fontSize: number
    fontWeight: string | number
    fontStyle: string
    letterSpacingPx: number
    lineHeight: number
    mainColor: string
    gradientFrom: string
    gradientTo: string
    gradientAngle: number
}) {
    const {
        id,
        text,
        trailChars,
        trailOpacity,
        fullGradientOpacity,
        trailFadeMs,
        fullGradientFadeMs,
        staticRender,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacingPx,
        lineHeight,
        mainColor,
        gradientFrom,
        gradientTo,
        gradientAngle,
    } = props

    const safeTrailChars = Math.min(Math.max(0, trailChars), text.length)
    const trailSplitAt = Math.max(0, text.length - safeTrailChars)
    const trailPrefix = text.slice(0, trailSplitAt)
    const trailText = text.slice(trailSplitAt)

    const textWidth = measureTextWidth(text, {
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacingPx,
    })
    const trailX = measureTextWidth(trailPrefix, {
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        letterSpacingPx,
    })

    const width = Math.max(1, Math.ceil(textWidth + 2))
    const height = Math.max(1, Math.ceil(fontSize * lineHeight))
    const baselineY = fontSize * 0.82
    const gradient = angleToSvgGradient(gradientAngle)
    const fadeMs = Math.max(0, trailFadeMs)
    const fullFadeMs = Math.max(0, fullGradientFadeMs)
    const ease = [0.22, 1, 0.36, 1] as const

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{
                display: "inline-block",
                overflow: "visible",
                verticalAlign: "baseline",
                flexShrink: 0,
            }}
        >
            <defs>
                <linearGradient
                    id={`trail-grad-${id}`}
                    x1={gradient.x1}
                    y1={gradient.y1}
                    x2={gradient.x2}
                    y2={gradient.y2}
                >
                    <stop offset="0%" stopColor={gradientFrom} />
                    <stop offset="100%" stopColor={gradientTo} />
                </linearGradient>
                <linearGradient
                    id={`full-grad-${id}`}
                    x1={gradient.x1}
                    y1={gradient.y1}
                    x2={gradient.x2}
                    y2={gradient.y2}
                >
                    <stop offset="0%" stopColor={gradientFrom} />
                    <stop offset="100%" stopColor={gradientTo} />
                </linearGradient>
            </defs>

            {/* Permanent solid base. Gradient layers only sit on top of this. */}
            {text ? (
                <text
                    x="0"
                    y={baselineY}
                    fill={mainColor}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={fontWeight as any}
                    fontStyle={fontStyle}
                    letterSpacing={letterSpacingPx}
                    xmlSpace="preserve"
                >
                    {text}
                </text>
            ) : null}

            {/* Full-text gradient used by the completion mode. It crossfades in
                instead of replacing the live trail layer. */}
            {text ? (
                staticRender ? (
                    <text
                        x="0"
                        y={baselineY}
                        fill={`url(#full-grad-${id})`}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={fontWeight as any}
                        fontStyle={fontStyle}
                        letterSpacing={letterSpacingPx}
                        opacity={fullGradientOpacity}
                        xmlSpace="preserve"
                    >
                        {text}
                    </text>
                ) : (
                    <motion.text
                        x="0"
                        y={baselineY}
                        fill={`url(#full-grad-${id})`}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={fontWeight as any}
                        fontStyle={fontStyle}
                        letterSpacing={letterSpacingPx}
                        xmlSpace="preserve"
                        initial={false}
                        animate={{ opacity: fullGradientOpacity }}
                        transition={{
                            duration: fullFadeMs / 1000,
                            ease,
                        }}
                        style={{ willChange: "opacity" }}
                    >
                        {text}
                    </motion.text>
                )
            ) : null}

            {/* Trail stays mounted even at opacity 0. That lets CSS interpolate
                the previous line from 1 → 0 when the caret enters the next line. */}
            {trailText ? (
                staticRender ? (
                    <text
                        x={trailX}
                        y={baselineY}
                        fill={`url(#trail-grad-${id})`}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={fontWeight as any}
                        fontStyle={fontStyle}
                        letterSpacing={letterSpacingPx}
                        opacity={trailOpacity}
                        xmlSpace="preserve"
                    >
                        {trailText}
                    </text>
                ) : (
                    <motion.text
                        x={trailX}
                        y={baselineY}
                        fill={`url(#trail-grad-${id})`}
                        fontFamily={fontFamily}
                        fontSize={fontSize}
                        fontWeight={fontWeight as any}
                        fontStyle={fontStyle}
                        letterSpacing={letterSpacingPx}
                        xmlSpace="preserve"
                        initial={false}
                        animate={{ opacity: trailOpacity }}
                        transition={{
                            duration: fadeMs / 1000,
                            ease,
                        }}
                        style={{ willChange: "opacity" }}
                    >
                        {trailText}
                    </motion.text>
                )
            ) : null}

            {!text ? (
                <text
                    x="0"
                    y={baselineY}
                    fill="transparent"
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={fontWeight as any}
                    fontStyle={fontStyle}
                    letterSpacing={letterSpacingPx}
                    xmlSpace="preserve"
                >
                    {"\u00A0"}
                </text>
            ) : null}
        </svg>
    )
}

function measureTextWidth(
    text: string,
    opts: {
        fontFamily: string
        fontSize: number
        fontWeight: string | number
        fontStyle: string
        letterSpacingPx: number
    }
) {
    if (!text) return 0

    if (typeof document === "undefined") {
        return text.length * opts.fontSize * 0.6
    }

    const canvas =
        measureTextWidthCanvas.current ||
        (measureTextWidthCanvas.current = document.createElement("canvas"))
    const ctx = canvas.getContext("2d")
    if (!ctx) return text.length * opts.fontSize * 0.6

    ctx.font = `${opts.fontStyle} ${opts.fontWeight} ${opts.fontSize}px ${opts.fontFamily}`
    const metrics = ctx.measureText(text)
    const spacing = Math.max(0, text.length - 1) * opts.letterSpacingPx
    return metrics.width + spacing
}

const measureTextWidthCanvas: { current: HTMLCanvasElement | null } = {
    current: null,
}

function angleToSvgGradient(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180
    const x = Math.cos(rad) * 0.5
    const y = Math.sin(rad) * 0.5
    return {
        x1: 0.5 - x,
        y1: 0.5 - y,
        x2: 0.5 + x,
        y2: 0.5 + y,
    }
}

function isDoneTyping(args: { currentText: string; currentValue: string }) {
    return args.currentValue.length >= args.currentText.length
}

function nextTypedValue(args: {
    mode: Mode
    currentText: string
    currentValue: string
}) {
    const { mode, currentText, currentValue } = args

    if (mode === "chars") {
        return currentText.slice(
            0,
            Math.min(currentText.length, currentValue.length + 1)
        )
    }

    const boundaries = getWordBoundaries(currentText)
    const nextBoundary =
        boundaries.find((boundary) => boundary > currentValue.length) ??
        currentText.length

    return currentText.slice(0, nextBoundary)
}

function getWordBoundaries(text: string) {
    if (!text.length) return [0]

    const boundaries: number[] = []
    const regex = /\S+(?:\s+|$)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        boundaries.push(match.index + match[0].length)
    }

    if (!boundaries.length || boundaries[boundaries.length - 1] < text.length) {
        boundaries.push(text.length)
    }

    return boundaries
}

function nextDeletedValue(value: string, mode: DeleteMode) {
    if (!value) return ""
    if (mode === "instant") return ""
    if (mode === "chars") return value.slice(0, -1)

    if (mode === "line") {
        const withoutTrailingNewline = value.replace(/\n+$/, "")
        const lastBreak = withoutTrailingNewline.lastIndexOf("\n")
        return lastBreak >= 0 ? value.slice(0, lastBreak + 1) : ""
    }

    const trimmedRight = value.replace(/\s+$/, "")
    const lastWordStart = trimmedRight.search(/\S+$/)
    if (lastWordStart < 0) return ""
    return value.slice(0, lastWordStart)
}

function computeNextDelay(args: {
    mode: Mode
    currentText: string
    currentValue: string
    typeSpeed: number
    wordDelay: number
    smartPause: boolean
    commaPause: number
    periodPause: number
    ellipsisPause: number
    linePause: number
}) {
    const {
        mode,
        currentText,
        currentValue,
        typeSpeed,
        wordDelay,
        smartPause,
        commaPause,
        periodPause,
        ellipsisPause,
        linePause,
    } = args

    const base = mode === "words" ? wordDelay : typeSpeed
    if (!smartPause) return base

    const nextCharIndex = currentValue.length
    const prevChar = currentText[Math.max(0, nextCharIndex - 1)] || ""
    const prev3 = currentText.slice(
        Math.max(0, nextCharIndex - 3),
        nextCharIndex
    )

    if (prev3 === "...") return base + ellipsisPause
    if (prevChar === "\n") return base + linePause
    if (prevChar === "," || prevChar === ";") return base + commaPause
    if (prevChar === "." || prevChar === "!" || prevChar === "?") {
        return base + periodPause
    }
    return base
}

function randomString(n: number, chars: string) {
    const pool = (chars || "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789").trim()
    if (!pool.length) return ""
    let out = ""
    for (let i = 0; i < n; i++) {
        out += pool[Math.floor(Math.random() * pool.length)]
    }
    return out
}

function clamp01(v: any) {
    const n = typeof v === "number" && isFinite(v) ? v : 0
    return Math.max(0, Math.min(1, n))
}

function fontToCSS(font: any) {
    const f = font || {}
    const align = (f.textAlign || "left") as "left" | "center" | "right"
    const justify =
        align === "left"
            ? "flex-start"
            : align === "right"
              ? "flex-end"
              : "center"

    const fontCss: any = { ...f }
    if (!fontCss.fontFamily && f.family) fontCss.fontFamily = f.family
    delete fontCss.family

    const fs = fontCss.fontSize
    const fontSizePx =
        typeof fs === "number"
            ? fs
            : typeof fs === "string"
              ? parseFloat(fs) || 16
              : 16

    const lh = fontCss.lineHeight
    const lineHeightNum =
        typeof lh === "number"
            ? lh
            : typeof lh === "string"
              ? parseFloat(lh) || undefined
              : undefined

    const fontFamily = fontCss.fontFamily || "Inter, sans-serif"
    const fontWeight = fontCss.fontWeight || 400
    const fontStyle = fontCss.fontStyle || "normal"

    const rawLetterSpacing = fontCss.letterSpacing
    const letterSpacingPx =
        typeof rawLetterSpacing === "number"
            ? rawLetterSpacing
            : typeof rawLetterSpacing === "string"
              ? parseFloat(rawLetterSpacing) || 0
              : 0

    return {
        fontCss,
        align,
        justify,
        fontSizePx,
        lineHeightNum,
        fontFamily,
        fontWeight,
        fontStyle,
        letterSpacingPx,
    }
}

function hexOrRgbaWithOpacity(color: string, opacity: number) {
    const safeOpacity = clamp01(opacity)
    if (!color) return `rgba(255,255,255,${safeOpacity})`

    if (color.startsWith("rgba(")) {
        return color.replace(/rgba\((.+?),\s*([0-9.]+)\)/, (_, rgb) => {
            return `rgba(${rgb}, ${safeOpacity})`
        })
    }

    if (color.startsWith("rgb(")) {
        return color.replace("rgb(", "rgba(").replace(")", `, ${safeOpacity})`)
    }

    const hex = color.replace("#", "")
    if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16)
        const g = parseInt(hex[1] + hex[1], 16)
        const b = parseInt(hex[2] + hex[2], 16)
        return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`
    }

    if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16)
        const g = parseInt(hex.slice(2, 4), 16)
        const b = parseInt(hex.slice(4, 6), 16)
        return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`
    }

    return color
}

function useReducedMotionPreference(enabled: boolean) {
    const [reduced, setReduced] = React.useState(false)

    React.useEffect(() => {
        if (!enabled || typeof window === "undefined") {
            setReduced(false)
            return
        }

        const query = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(query.matches)
        update()
        query.addEventListener?.("change", update)
        return () => query.removeEventListener?.("change", update)
    }, [enabled])

    return enabled && reduced
}

function useInViewport(
    ref: React.RefObject<HTMLElement | null>,
    pauseOffscreen: boolean,
    isStaticRenderer: boolean
) {
    const [visible, setVisible] = React.useState(true)

    React.useEffect(() => {
        if (
            !pauseOffscreen ||
            isStaticRenderer ||
            typeof IntersectionObserver === "undefined"
        ) {
            setVisible(true)
            return
        }

        const node = ref.current
        if (!node) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                setVisible(Boolean(entry?.isIntersecting))
            },
            { rootMargin: "100px 0px", threshold: 0 }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [ref, pauseOffscreen, isStaticRenderer])

    return visible
}

TypewriterText.defaultProps = {
    width: 520,
    height: 240,
}
;(TypewriterText as any).disableImageRendering = true
;(TypewriterText as any).supportsLayout = true

addPropertyControls(TypewriterText as any, {
    texts: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
        defaultValue:
            "Built for those who aim higher.\nDesign without distraction.",
    },

    contentMode: {
        type: ControlType.Enum,
        title: "Content",
        options: ["lines", "paragraph"],
        optionTitles: ["Lines", "Paragraph"],
        defaultValue: "paragraph",
    },

    titleFont: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            textAlign: "left",
            fontSize: 54,
            letterSpacing: -0.02,
            lineHeight: 1.12,
            variant: "Regular",
        },
        defaultFontType: "sans-serif",
        displayTextAlignment: true,
        displayFontSize: true,
        controls: "extended",
    },

    color: { type: ControlType.Color, title: "Color", defaultValue: "#F7F8FF" },

    typing: {
        type: ControlType.Object,
        title: "Typing",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            mode: {
                type: ControlType.Enum,
                title: "Type",
                options: ["chars", "words"],
                optionTitles: ["Chars", "Words"],
                defaultValue: "chars",
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            loopStyle: {
                type: ControlType.Enum,
                title: "Loop Style",
                options: ["delete", "fade"],
                optionTitles: ["Delete", "Fade"],
                defaultValue: "delete",
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            deleteMode: {
                type: ControlType.Enum,
                title: "Delete",
                options: ["chars", "words", "line", "instant"],
                optionTitles: ["Chars", "Words", "Line", "Instant"],
                defaultValue: "chars",
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.loopStyle ?? "delete") !== "delete",
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: true,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
        },
    },

    timing: {
        type: ControlType.Object,
        title: "Timing",
        controls: {
            startDelay: {
                type: ControlType.Number,
                title: "Start Delay",
                unit: "ms",
                min: 0,
                max: 60000,
                step: 10,
                defaultValue: 400,
                hidden: (p: any) => !(p?.typing?.enabled ?? true),
            },
            typeSpeed: {
                type: ControlType.Number,
                title: "Type Speed",
                unit: "ms",
                min: 10,
                max: 2000,
                step: 1,
                defaultValue: 45,
                hidden: (p: any) => !(p?.typing?.enabled ?? true),
            },
            wordDelay: {
                type: ControlType.Number,
                title: "Word Delay",
                unit: "ms",
                min: 10,
                max: 4000,
                step: 1,
                defaultValue: 180,
                hidden: (p: any) =>
                    !(p?.typing?.enabled ?? true) ||
                    (p?.typing?.mode ?? "chars") !== "words",
            },
            deleteSpeed: {
                type: ControlType.Number,
                title: "Delete Speed",
                unit: "ms",
                min: 10,
                max: 2000,
                step: 1,
                defaultValue: 30,
                hidden: (p: any) =>
                    !(p?.typing?.enabled ?? true) ||
                    (p?.typing?.loopStyle ?? "delete") !== "delete" ||
                    (p?.typing?.deleteMode ?? "chars") === "instant",
            },
            pauseAfterType: {
                type: ControlType.Number,
                title: "Pause After",
                unit: "ms",
                min: 0,
                max: 60000,
                step: 10,
                defaultValue: 900,
                hidden: (p: any) => !(p?.typing?.enabled ?? true),
            },
            pauseAfterDelete: {
                type: ControlType.Number,
                title: "Pause Empty",
                unit: "ms",
                min: 0,
                max: 60000,
                step: 10,
                defaultValue: 300,
                hidden: (p: any) =>
                    !(p?.typing?.enabled ?? true) ||
                    (p?.typing?.loopStyle ?? "delete") !== "delete",
            },
            fadeDuration: {
                type: ControlType.Number,
                title: "Fade",
                unit: "ms",
                min: 50,
                max: 4000,
                step: 10,
                defaultValue: 360,
                hidden: (p: any) =>
                    (p?.typing?.loopStyle ?? "delete") !== "fade",
            },
        },
    },

    smartPause: {
        type: ControlType.Object,
        title: "Smart Pause",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            commaPause: {
                type: ControlType.Number,
                title: "Comma +",
                unit: "ms",
                min: 0,
                max: 3000,
                step: 10,
                defaultValue: 140,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            periodPause: {
                type: ControlType.Number,
                title: "Period +",
                unit: "ms",
                min: 0,
                max: 3000,
                step: 10,
                defaultValue: 320,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            ellipsisPause: {
                type: ControlType.Number,
                title: "Ellipsis +",
                unit: "ms",
                min: 0,
                max: 5000,
                step: 10,
                defaultValue: 520,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            linePause: {
                type: ControlType.Number,
                title: "New Line +",
                unit: "ms",
                min: 0,
                max: 5000,
                step: 10,
                defaultValue: 260,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
        },
    },

    cursor: {
        type: ControlType.Object,
        title: "Cursor",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            caretStyle: {
                type: ControlType.Enum,
                title: "Caret",
                options: ["bar", "block", "underscore", "custom"],
                optionTitles: ["Bar", "Block", "Underscore", "Custom"],
                defaultValue: "block",
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            caretCustom: {
                type: ControlType.String,
                title: "Custom",
                defaultValue: "|",
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.caretStyle ?? "block") !== "custom",
            },
            caretGap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            autoSize: {
                type: ControlType.Boolean,
                title: "Auto Size",
                defaultValue: true,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.caretStyle ?? "block") === "custom",
            },
            caretWidth: {
                type: ControlType.Number,
                title: "Width",
                unit: "px",
                min: 1,
                max: 120,
                step: 1,
                defaultValue: 10,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.caretStyle ?? "block") === "custom" ||
                    (p?.autoSize ?? true),
            },
            caretHeight: {
                type: ControlType.Number,
                title: "Height",
                unit: "px",
                min: 1,
                max: 200,
                step: 1,
                defaultValue: 42,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.caretStyle ?? "block") === "custom" ||
                    (p?.autoSize ?? true),
            },
            caretRadius: {
                type: ControlType.Number,
                title: "Radius",
                unit: "px",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) ||
                    (p?.caretStyle ?? "block") === "custom",
            },
            caretOffsetX: {
                type: ControlType.Number,
                title: "Offset X",
                unit: "px",
                min: -80,
                max: 80,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            caretOffsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                unit: "px",
                min: -80,
                max: 80,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            blink: {
                type: ControlType.Boolean,
                title: "Blink",
                defaultValue: true,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            blinkSpeed: {
                type: ControlType.Number,
                title: "Blink Speed",
                unit: "ms",
                min: 120,
                max: 5000,
                step: 10,
                defaultValue: 500,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) || !(p?.blink ?? true),
            },
            glow: {
                type: ControlType.Boolean,
                title: "Glow",
                defaultValue: false,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            glowBlur: {
                type: ControlType.Number,
                title: "Glow Blur",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: 10,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) || !(p?.glow ?? false),
            },
            glowOpacity: {
                type: ControlType.Number,
                title: "Glow Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue: 0.8,
                hidden: (p: any) =>
                    !(p?.enabled ?? true) || !(p?.glow ?? false),
            },
            caretColorIdle: {
                type: ControlType.Color,
                title: "Idle Color",
                defaultValue: "#ff3b30",
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            caretColorTyping: {
                type: ControlType.Color,
                title: "Typing Color",
                defaultValue: "#ff3b30",
                hidden: (p: any) => !(p?.enabled ?? true),
            },
            caretFadeSpeed: {
                type: ControlType.Number,
                title: "Fade",
                unit: "ms",
                min: 0,
                max: 1000,
                step: 10,
                defaultValue: 120,
                hidden: (p: any) => !(p?.enabled ?? true),
            },
        },
    },

    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            highlight: {
                type: ControlType.Boolean,
                title: "Highlight",
                defaultValue: false,
            },
            highlightColor: {
                type: ControlType.Color,
                title: "Hi Color",
                defaultValue: "rgba(255, 230, 130, 0.55)",
                hidden: (p: any) => !(p?.highlight ?? false),
            },
            highlightFadeMs: {
                type: ControlType.Number,
                title: "Hi Fade",
                unit: "ms",
                min: 40,
                max: 2000,
                step: 10,
                defaultValue: 260,
                hidden: (p: any) => !(p?.highlight ?? false),
            },
            scramble: {
                type: ControlType.Boolean,
                title: "Scramble",
                defaultValue: false,
            },
            scrambleIntensity: {
                type: ControlType.Number,
                title: "Intensity",
                min: 1,
                max: 30,
                step: 1,
                defaultValue: 6,
                hidden: (p: any) => !(p?.scramble ?? false),
            },
            scrambleChars: {
                type: ControlType.String,
                title: "Charset",
                defaultValue: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                hidden: (p: any) => !(p?.scramble ?? false),
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            stableHeight: {
                type: ControlType.Boolean,
                title: "Stable Height",
                defaultValue: true,
            },
            maxLines: {
                type: ControlType.Number,
                title: "Max Lines",
                min: 0,
                max: 30,
                step: 1,
                defaultValue: 0,
                hidden: (p: any) => !(p?.stableHeight ?? true),
                description: "0 = no clamp.",
            },
            preserveBlankLines: {
                type: ControlType.Boolean,
                title: "Blank Lines",
                defaultValue: true,
                description: "Keep intentional empty lines in Lines mode.",
            },
            lineGap: {
                type: ControlType.Number,
                title: "Line Gap",
                unit: "px",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: 0,
            },
        },
    },

    gradient: {
        type: ControlType.Object,
        title: "Gradient",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            from: {
                type: ControlType.Color,
                title: "From",
                defaultValue: "#ff8a80",
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            to: {
                type: ControlType.Color,
                title: "To",
                defaultValue: "#ff3b30",
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 360,
                step: 1,
                defaultValue: 90,
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            trailChars: {
                type: ControlType.Number,
                title: "Trail",
                min: 0,
                max: 20,
                step: 1,
                defaultValue: 3,
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            completion: {
                type: ControlType.Enum,
                title: "Complete",
                options: ["solid", "full", "trail", "fade"],
                optionTitles: [
                    "Solid Color",
                    "Full Gradient",
                    "Keep Trail",
                    "Fade Trail",
                ],
                defaultValue: "full",
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            completionFadeMs: {
                type: ControlType.Number,
                title: "Trail Fade",
                unit: "ms",
                min: 0,
                max: 4000,
                step: 10,
                defaultValue: 320,
                hidden: (p: any) =>
                    !(p?.enabled ?? false) ||
                    (p?.completion ?? "full") !== "fade",
            },
            lineFadeMs: {
                type: ControlType.Number,
                title: "Line Fade",
                unit: "ms",
                min: 80,
                max: 2000,
                step: 10,
                defaultValue: 420,
                hidden: (p: any) => !(p?.enabled ?? false),
                description:
                    "Smoothly releases the previous line gradient when the caret moves to the next line.",
            },
        },
    },

    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
            },
            color: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(0,0,0,0.35)",
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 16,
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            padY: {
                type: ControlType.Number,
                title: "Pad Y",
                min: 0,
                max: 80,
                step: 1,
                defaultValue: 14,
                hidden: (p: any) => !(p?.enabled ?? false),
            },
            padX: {
                type: ControlType.Number,
                title: "Pad X",
                min: 0,
                max: 120,
                step: 1,
                defaultValue: 18,
                hidden: (p: any) => !(p?.enabled ?? false),
            },
        },
    },

    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            respectReducedMotion: {
                type: ControlType.Boolean,
                title: "Reduced Motion",
                defaultValue: true,
                description:
                    "Show static text when reduced motion is requested.",
            },
            pauseOffscreen: {
                type: ControlType.Boolean,
                title: "Pause Offscreen",
                defaultValue: true,
                description:
                    "Pause timers when the component is outside the viewport.",
            },
        },
    },
})
