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

import { motion, animate, useReducedMotion } from "framer-motion"

/**
 * WebX Editorial Stat
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 */

const EASE = [0.16, 1, 0.1, 1] as const
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
type Direction = "Up" | "Down" | "Left" | "Right"
type Position =
    | "Top Left"
    | "Top Center"
    | "Top Right"
    | "Bottom Left"
    | "Bottom Center"
    | "Bottom Right"

type Props = {
    value: number
    unit: string
    decimals: number
    useGrouping: boolean
    valuePrefix: string
    valueSuffix: string
    countFrom: number
    countStyle: "Number Count" | "Character Roll"
    direction: Direction
    duration: number
    statDelay: number
    characterStagger: number
    unitCharacterStagger: number
    stagger: number
    infoItemStagger: number
    infoDelay: number
    triggerAmount: number
    replayOnReentry: boolean
    font: any
    fontWeight: number
    fontSize: number
    unitSizeRatio: number
    valueUnitGap: number
    letterSpacing: number
    textColor: string
    bgColor: string
    paddingX: number
    paddingY: number
    statVerticalPosition: "Top" | "Center" | "Bottom"
    infoPosition: Position
    infoTextAlign: "left" | "center" | "right"
    infoTitle: string
    infoSubtitle: string
    infoDescription: string
    infoFont: any
    infoWidth: number
    infoGap: number
    infoOffsetX: number
    infoOffsetY: number
    infoTitleSize: number
    infoSubtitleSize: number
    infoDescriptionSize: number
    infoColor: string
    infoOpacity: number
    infoAnimate: boolean
    responsiveLayout: "Auto" | "Stack" | "Anchored"
    stackBreakpoint: number
    compactGap: number
    mobileBreakpoint: number
    mobileInfoGap: number
    mobileUnitWidth: number
    showCreativeEditor: boolean
    style?: React.CSSProperties
}

function entrance(direction: Direction) {
    return {
        x:
            direction === "Left"
                ? "110%"
                : direction === "Right"
                  ? "-110%"
                  : "0%",
        y: direction === "Up" ? "110%" : direction === "Down" ? "-110%" : "0%",
        opacity: 0,
    }
}

/** Each digit has a different track and delay; never wrap the complete number in a motion element. */
function DigitReels({
    text,
    direction,
    visible,
    duration,
    delay,
    stagger,
    size,
    reduced,
}: {
    text: string
    direction: Direction
    visible: boolean
    duration: number
    delay: number
    stagger: number
    size: number
    reduced: boolean
}) {
    const vertical = direction === "Up" || direction === "Down"
    const forward = direction === "Up" || direction === "Left"
    const sequence = Array.from(
        forward ? "01234567890123456789" : "98765432109876543210"
    )
    let digitOrder = -1
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                lineHeight: 1,
                letterSpacing: 0,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "pre",
            }}
        >
            {Array.from(text).map((char, index) => {
                if (!/\d/.test(char))
                    return (
                        <span key={index} style={{ whiteSpace: "pre" }}>
                            {char}
                        </span>
                    )
                digitOrder++
                const target = 10 + (forward ? Number(char) : 9 - Number(char))
                const destination = -target * size
                return (
                    <span
                        key={`${index}-${char}`}
                        style={{
                            display: "inline-block",
                            flex: "0 0 1ch",
                            width: "1ch",
                            height: "1em",
                            lineHeight: 1,
                            position: "relative",
                            overflow: "hidden",
                            letterSpacing: 0,
                        }}
                    >
                        <motion.span
                            initial={false}
                            animate={
                                vertical
                                    ? {
                                          x: 0,
                                          y:
                                              visible || reduced
                                                  ? destination
                                                  : 0,
                                      }
                                    : {
                                          y: 0,
                                          x:
                                              visible || reduced
                                                  ? destination
                                                  : 0,
                                      }
                            }
                            transition={{
                                duration: reduced ? 0 : duration,
                                delay: reduced
                                    ? 0
                                    : delay + digitOrder * stagger,
                                ease: EASE,
                            }}
                            style={{
                                display: "flex",
                                position: "absolute",
                                top: 0,
                                left: 0,
                                flexDirection: vertical ? "column" : "row",
                                width: vertical ? "1ch" : "20ch",
                                height: vertical ? "20em" : "1em",
                                lineHeight: 1,
                                letterSpacing: 0,
                                willChange: "transform",
                            }}
                        >
                            {sequence.map((digit, i) => (
                                <span
                                    key={i}
                                    style={{
                                        display: "block",
                                        width: "1ch",
                                        height: "1em",
                                        lineHeight: 1,
                                        flex: "0 0 auto",
                                        textAlign: "center",
                                    }}
                                >
                                    {digit}
                                </span>
                            ))}
                        </motion.span>
                    </span>
                )
            })}
        </span>
    )
}

function RevealedLetters({
    text,
    visible,
    direction,
    duration,
    delay,
    stagger,
    reduced,
}: {
    text: string
    visible: boolean
    direction: Direction
    duration: number
    delay: number
    stagger: number
    reduced: boolean
}) {
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "pre",
                lineHeight: 1,
            }}
        >
            {Array.from(text).map((char, i) => (
                <span
                    key={i}
                    style={{
                        display: "inline-block",
                        overflow: "hidden",
                        paddingRight: ".035em",
                        marginRight: "-.035em",
                        whiteSpace: "pre",
                        lineHeight: 1.16,
                    }}
                >
                    <motion.span
                        initial={false}
                        animate={
                            visible
                                ? { x: 0, y: 0, opacity: 1 }
                                : entrance(direction)
                        }
                        transition={{
                            duration: reduced ? 0 : duration,
                            delay: reduced ? 0 : delay + i * stagger,
                            ease: EASE,
                        }}
                        style={{ display: "inline-block", lineHeight: 1.16 }}
                    >
                        {char}
                    </motion.span>
                </span>
            ))}
        </span>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 620
 */
export default function WebXEditorialStat(raw: Props) {
    // Preview-only overrides never mutate the authored Framer properties.
    const [editorOpen, setEditorOpen] = React.useState(true)
    const [demo, setDemo] = React.useState("Original")
    const [editorMode, setEditorMode] = React.useState<
        "Original" | "Character Roll" | "Number Count"
    >("Original")
    const [editorDirection, setEditorDirection] = React.useState<
        "Original" | Direction
    >("Original")
    const [editorSpeed, setEditorSpeed] = React.useState<
        "Original" | "Slow" | "Fast"
    >("Original")
    const [editorTheme, setEditorTheme] = React.useState<
        "Original" | "Dark" | "Light" | "Warm"
    >("Original")
    const [editorLayout, setEditorLayout] = React.useState<
        "Original" | "Auto" | "Stack" | "Anchored"
    >("Original")
    const [previewNonce, setPreviewNonce] = React.useState(0)
    const demoOverrides: Partial<Props> =
        demo === "Studio"
            ? {
                  value: 128,
                  unit: "projects",
                  infoTitle: "A CREATIVE PRACTICE",
                  infoSubtitle: "WORK MADE WITH PURPOSE",
                  infoDescription: "",
              }
            : demo === "Years"
              ? {
                    value: 12,
                    unit: "years",
                    infoTitle: "THE LONG WAY FORWARD",
                    infoSubtitle: "OF EXPLORATION & EXPERIMENTATION",
                    infoDescription: "",
                }
              : demo === "Global"
                ? {
                      value: 34,
                      unit: "countries",
                      infoTitle: "BOUNDARIES ARE BORING",
                      infoSubtitle: "IDEAS WITHOUT BORDERS",
                      infoDescription: "",
                  }
                : demo === "Rating"
                  ? {
                        value: 4.9,
                        unit: "/ 5",
                        decimals: 1,
                        infoTitle: "CRAFT WITH CARE",
                        infoSubtitle: "AVERAGE CLIENT SATISFACTION",
                        infoDescription: "",
                    }
                  : {}
    const themeOverrides: Partial<Props> =
        editorTheme === "Light"
            ? { bgColor: "#F0EFEA", textColor: "#171716", infoColor: "#171716" }
            : editorTheme === "Warm"
              ? {
                    bgColor: "#352C26",
                    textColor: "#F2D5AF",
                    infoColor: "#F2D5AF",
                }
              : editorTheme === "Dark"
                ? {
                      bgColor: "#111111",
                      textColor: "#F7F7F5",
                      infoColor: "#F7F7F5",
                  }
                : {}
    const p = {
        ...WebXEditorialStat.defaultProps,
        ...raw,
        ...demoOverrides,
        ...themeOverrides,
        ...(editorMode !== "Original" ? { countStyle: editorMode } : {}),
        ...(editorDirection !== "Original"
            ? { direction: editorDirection }
            : {}),
        ...(editorSpeed !== "Original"
            ? { duration: editorSpeed === "Fast" ? 0.8 : 2.6 }
            : {}),
        ...(editorLayout !== "Original"
            ? { responsiveLayout: editorLayout }
            : {}),
    } as Props
    const rootRef = React.useRef<HTMLDivElement>(null)
    const measureRef = React.useRef<HTMLDivElement>(null)
    const mobileNumberRef = React.useRef<HTMLSpanElement>(null)
    const mobileUnitRef = React.useRef<HTMLSpanElement>(null)
    const played = React.useRef(false)
    const reduced = !!useReducedMotion()
    const isStaticRenderer = useIsStaticRenderer()
    const showFinal = isStaticRenderer || reduced
    const [visible, setVisible] = React.useState(false)
    const showEditor = !!raw.showCreativeEditor && !isStaticRenderer
    const animatedVisible = showFinal || visible
    const [count, setCount] = React.useState(p.countFrom)
    const [width, setWidth] = React.useState(1440)
    const [fitted, setFitted] = React.useState(p.fontSize)
    const [mobileNumberSize, setMobileNumberSize] = React.useState(p.fontSize)
    const [mobileUnitSize, setMobileUnitSize] = React.useState(p.fontSize)
    const safeValue = Number.isFinite(p.value) ? p.value : 0
    const decimals = clamp(Math.round(p.decimals), 0, 6)
    const formatter = React.useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                useGrouping: p.useGrouping,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            }),
        [decimals, p.useGrouping]
    )
    const format = React.useCallback(
        (n: number) => `${p.valuePrefix}${formatter.format(n)}${p.valueSuffix}`,
        [formatter, p.valuePrefix, p.valueSuffix]
    )
    const number = format(safeValue)
    const unit = (p.unit || "").slice(0, 60)
    const fontFamily = p.font?.fontFamily || "Inter, Arial, sans-serif"
    const statFont: React.CSSProperties = {
        ...p.font,
        fontFamily,
        fontWeight: p.fontWeight,
        letterSpacing: `${p.letterSpacing}em`,
        lineHeight: 1,
    }
    const referenceSize = 200

    const measure = React.useCallback(() => {
        const root = rootRef.current,
            node = measureRef.current
        if (!root || !node) return
        const w = root.clientWidth
        const available = Math.max(
            1,
            w - 2 * Math.min(p.paddingX, Math.max(12, w * 0.05))
        )
        const natural = node.getBoundingClientRect().width
        setWidth(w)
        if (natural > 0)
            setFitted(
                Math.max(
                    8,
                    Math.min(
                        p.fontSize,
                        ((available * 0.97) / natural) * referenceSize
                    )
                )
            )
        // Fit the number and unit independently on mobile so each may fill the width.
        const numberNatural =
            mobileNumberRef.current?.getBoundingClientRect().width || 1
        const unitNatural =
            mobileUnitRef.current?.getBoundingClientRect().width || 1
        setMobileNumberSize(
            Math.max(
                8,
                Math.min(
                    p.fontSize * 1.75,
                    ((available * 0.98) / numberNatural) * referenceSize
                )
            )
        )
        setMobileUnitSize(
            Math.max(
                8,
                Math.min(
                    p.fontSize * 1.6,
                    ((available * clamp(p.mobileUnitWidth, 0.5, 1)) /
                        unitNatural) *
                        referenceSize
                )
            )
        )
    }, [
        p.fontSize,
        p.paddingX,
        p.valueUnitGap,
        p.unitSizeRatio,
        p.letterSpacing,
        p.fontWeight,
        fontFamily,
        number,
        unit,
        p.countStyle,
        p.mobileUnitWidth,
    ])

    React.useLayoutEffect(() => {
        if (isStaticRenderer) return
        measure()
        const observer =
            typeof ResizeObserver === "undefined"
                ? null
                : new ResizeObserver(measure)
        if (rootRef.current) observer?.observe(rootRef.current)
        if (typeof document !== "undefined")
            document.fonts?.ready.then(measure).catch(() => {})
        return () => observer?.disconnect()
    }, [measure, isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        const el = rootRef.current
        if (!el || typeof IntersectionObserver === "undefined") {
            setVisible(true)
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    (!played.current || p.replayOnReentry)
                ) {
                    played.current = true
                    setVisible(true)
                } else if (!entry.isIntersecting && p.replayOnReentry)
                    setVisible(false)
            },
            { threshold: clamp(p.triggerAmount, 0.01, 0.9) }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [p.triggerAmount, p.replayOnReentry, isStaticRenderer])

    React.useEffect(() => {
        if (isStaticRenderer) return
        if (!visible) {
            setCount(p.countFrom)
            return
        }
        if (p.countStyle === "Character Roll" || reduced) {
            setCount(safeValue)
            return
        }
        const controller = animate(p.countFrom, safeValue, {
            duration: p.duration,
            delay: p.statDelay,
            ease: EASE,
            onUpdate: setCount,
        })
        return () => controller.stop()
    }, [
        visible,
        p.countStyle,
        p.countFrom,
        p.duration,
        p.statDelay,
        reduced,
        safeValue,
        isStaticRenderer,
    ])

    const paddingX = Math.min(p.paddingX, Math.max(12, width * 0.05))
    const mobile = width <= p.mobileBreakpoint
    const compact =
        mobile ||
        p.responsiveLayout === "Stack" ||
        (p.responsiveLayout === "Auto" &&
            (width <= p.stackBreakpoint || fitted < p.fontSize * 0.7))
    const centered = p.infoPosition.endsWith("Center")
    const right = p.infoPosition.endsWith("Right")
    const top = p.infoPosition.startsWith("Top")
    const align = centered ? "center" : right ? "flex-end" : "flex-start"
    const infoItems = [
        {
            text: (p.infoTitle || "").slice(0, 100),
            size: p.infoTitleSize,
            weight: 700,
            line: 1.2,
        },
        {
            text: (p.infoSubtitle || "").slice(0, 180),
            size: p.infoSubtitleSize,
            weight: 700,
            line: 1.2,
        },
        {
            text: (p.infoDescription || "").slice(0, 320),
            size: p.infoDescriptionSize,
            weight: 400,
            line: 1.45,
        },
    ].filter((x) => x.text)

    // Starts close to the end of the digit sequence, not after every digit has stopped.
    const digitCount = Array.from(number).filter((x) => /\d/.test(x)).length
    const unitStart =
        p.statDelay +
        (p.countStyle === "Character Roll"
            ? Math.max(0, digitCount - 1) * p.characterStagger
            : 0) +
        p.stagger
    const unitDuration = Math.max(
        0.3,
        p.duration - Math.max(0, unit.length - 1) * p.unitCharacterStagger * 0.7
    )
    const dynamicGap = mobile
        ? Math.max(0, p.mobileInfoGap)
        : Math.max(8, Math.min(p.compactGap, width * 0.035))
    const replayPreview = () => {
        // A two-frame reset ensures Motion sees the hidden state before restarting.
        setVisible(false)
        setPreviewNonce((n) => n + 1)
        requestAnimationFrame(() =>
            requestAnimationFrame(() => setVisible(true))
        )
    }
    const resetPreview = () => {
        setDemo("Original")
        setEditorMode("Original")
        setEditorDirection("Original")
        setEditorSpeed("Original")
        setEditorTheme("Original")
        setEditorLayout("Original")
        replayPreview()
    }
    const editorButton: React.CSSProperties = {
        background: "#242424",
        color: "#F8F8F7",
        border: "1px solid #444",
        borderRadius: 7,
        padding: "7px 10px",
        fontSize: 11,
        fontFamily: "Inter, system-ui, sans-serif",
        cursor: "pointer",
        lineHeight: 1.3,
    }
    const editorActive: React.CSSProperties = {
        background: "#F5F4F0",
        color: "#151515",
        borderColor: "#F5F4F0",
    }
    const editorLabel: React.CSSProperties = {
        fontSize: 10,
        letterSpacing: ".07em",
        textTransform: "uppercase",
        color: "#999",
        marginBottom: 5,
        display: "block",
    }

    const stat = (
        <div
            key={`stat-${previewNonce}`}
            aria-hidden="true"
            style={{
                ...statFont,
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                width: "max-content",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                fontSize: isStaticRenderer
                    ? `min(${p.fontSize}px, 17cqw)`
                    : fitted,
                gap: `${(p.valueUnitGap * fitted) / p.fontSize}px`,
            }}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    lineHeight: 1,
                    letterSpacing:
                        p.countStyle === "Character Roll"
                            ? 0
                            : `${p.letterSpacing}em`,
                    flexShrink: 0,
                }}
            >
                {isStaticRenderer ? (
                    <span
                        style={{
                            fontVariantNumeric: "tabular-nums",
                            whiteSpace: "pre",
                        }}
                    >
                        {number}
                    </span>
                ) : p.countStyle === "Character Roll" ? (
                    <DigitReels
                        text={number}
                        direction={p.direction}
                        visible={animatedVisible}
                        duration={p.duration}
                        delay={p.statDelay}
                        stagger={p.characterStagger}
                        size={fitted}
                        reduced={reduced}
                    />
                ) : (
                    <span
                        style={{
                            display: "inline-block",
                            overflow: "hidden",
                            lineHeight: 1.12,
                        }}
                    >
                        <motion.span
                            initial={false}
                            animate={
                                animatedVisible
                                    ? { x: 0, y: 0, opacity: 1 }
                                    : entrance(p.direction)
                            }
                            transition={{
                                duration: reduced ? 0 : p.duration,
                                delay: reduced ? 0 : p.statDelay,
                                ease: EASE,
                            }}
                            style={{
                                display: "inline-block",
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            {isStaticRenderer ? number : format(count)}
                        </motion.span>
                    </span>
                )}
            </span>
            {unit && (
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: `${p.unitSizeRatio}em`,
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                >
                    {isStaticRenderer ? (
                        <span>{unit}</span>
                    ) : (
                        <RevealedLetters
                            text={unit}
                            visible={animatedVisible}
                            direction={p.direction}
                            duration={unitDuration}
                            delay={unitStart}
                            stagger={p.unitCharacterStagger}
                            reduced={reduced}
                        />
                    )}
                </span>
            )}
        </div>
    )

    const mobileStat = (
        <div
            key={`mobile-stat-${previewNonce}`}
            aria-hidden="true"
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: 0,
                ...statFont,
            }}
        >
            <div
                style={{
                    fontSize: mobileNumberSize,
                    lineHeight: 1.06,
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    whiteSpace: "nowrap",
                    letterSpacing:
                        p.countStyle === "Character Roll"
                            ? 0
                            : `${p.letterSpacing}em`,
                }}
            >
                {isStaticRenderer ? (
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {number}
                    </span>
                ) : p.countStyle === "Character Roll" ? (
                    <DigitReels
                        text={number}
                        direction={p.direction}
                        visible={animatedVisible}
                        duration={p.duration}
                        delay={p.statDelay}
                        stagger={p.characterStagger}
                        size={mobileNumberSize}
                        reduced={reduced}
                    />
                ) : (
                    <span
                        style={{ overflow: "hidden", display: "inline-flex" }}
                    >
                        <motion.span
                            initial={false}
                            animate={
                                animatedVisible
                                    ? { x: 0, y: 0, opacity: 1 }
                                    : entrance(p.direction)
                            }
                            transition={{
                                duration: reduced ? 0 : p.duration,
                                delay: reduced ? 0 : p.statDelay,
                                ease: EASE,
                            }}
                            style={{
                                fontVariantNumeric: "tabular-nums",
                                display: "inline-block",
                            }}
                        >
                            {format(count)}
                        </motion.span>
                    </span>
                )}
            </div>
            {unit && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        fontSize: mobileUnitSize,
                        lineHeight: 1.12,
                        whiteSpace: "nowrap",
                    }}
                >
                    {isStaticRenderer ? (
                        <span>{unit}</span>
                    ) : (
                        <RevealedLetters
                            text={unit}
                            visible={animatedVisible}
                            direction={p.direction}
                            duration={unitDuration}
                            delay={unitStart}
                            stagger={p.unitCharacterStagger}
                            reduced={reduced}
                        />
                    )}
                </div>
            )}
        </div>
    )

    const info = (
        <div
            key={`info-${previewNonce}`}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: align,
                width: compact ? "100%" : `min(${p.infoWidth}px, 100%)`,
                maxWidth: "100%",
                gap: p.infoGap,
                textAlign: p.infoTextAlign,
                color: p.infoColor,
                fontFamily: p.infoFont?.fontFamily || fontFamily,
                opacity: p.infoOpacity,
                overflowWrap: "anywhere",
                marginLeft: compact ? 0 : p.infoOffsetX,
                marginTop: compact ? 0 : p.infoOffsetY,
            }}
        >
            {infoItems.map((item, i) => (
                <div
                    key={i}
                    style={{
                        overflow: "hidden",
                        width: compact ? "100%" : "auto",
                        maxWidth: "100%",
                    }}
                >
                    <motion.div
                        initial={false}
                        animate={
                            animatedVisible || !p.infoAnimate
                                ? { opacity: 1, y: 0 }
                                : { opacity: 0, y: 18 }
                        }
                        transition={{
                            duration:
                                reduced || !p.infoAnimate ? 0 : p.duration,
                            delay: reduced
                                ? 0
                                : p.infoDelay + i * p.infoItemStagger,
                            ease: EASE,
                        }}
                        style={{
                            fontSize: item.size,
                            fontWeight: item.weight,
                            lineHeight: item.line,
                        }}
                    >
                        {item.text}
                    </motion.div>
                </div>
            ))}
        </div>
    )

    const desktopInfoStyle: React.CSSProperties = {
        position: "absolute",
        ...(top ? { top: p.paddingY } : { bottom: p.paddingY }),
        ...(centered
            ? { left: "50%", transform: "translateX(-50%)" }
            : right
              ? { right: paddingX }
              : { left: paddingX }),
        width: `min(${p.infoWidth}px, calc(100% - ${paddingX * 2}px))`,
    }

    return (
        <div
            ref={rootRef}
            role="group"
            aria-label={`${number} ${unit}. ${infoItems.map((i) => i.text).join(". ")}`}
            style={{
                boxSizing: "border-box",
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: mobile ? 220 : 320,
                containerType: "inline-size",
                padding: `${p.paddingY}px ${paddingX}px`,
                background: p.bgColor,
                color: p.textColor,
                overflow: "hidden",
                ...p.style,
            }}
        >
            <div
                ref={measureRef}
                aria-hidden="true"
                style={{
                    ...statFont,
                    position: "absolute",
                    left: -99999,
                    top: -99999,
                    display: "flex",
                    alignItems: "center",
                    width: "max-content",
                    whiteSpace: "nowrap",
                    visibility: "hidden",
                    pointerEvents: "none",
                    fontSize: referenceSize,
                    gap: (p.valueUnitGap * referenceSize) / p.fontSize,
                }}
            >
                <span
                    style={{
                        letterSpacing:
                            p.countStyle === "Character Roll"
                                ? 0
                                : `${p.letterSpacing}em`,
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {number}
                </span>
                {unit && (
                    <span
                        style={{
                            fontSize: `${p.unitSizeRatio}em`,
                            lineHeight: 1.16,
                        }}
                    >
                        {unit}
                    </span>
                )}
            </div>
            <span
                ref={mobileNumberRef}
                aria-hidden="true"
                style={{
                    ...statFont,
                    position: "absolute",
                    left: -99999,
                    top: -99999,
                    width: "max-content",
                    fontSize: referenceSize,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    visibility: "hidden",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing:
                        p.countStyle === "Character Roll"
                            ? 0
                            : `${p.letterSpacing}em`,
                }}
            >
                {number}
            </span>
            <span
                ref={mobileUnitRef}
                aria-hidden="true"
                style={{
                    ...statFont,
                    position: "absolute",
                    left: -99999,
                    top: -99999,
                    width: "max-content",
                    fontSize: referenceSize,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    visibility: "hidden",
                }}
            >
                {unit}
            </span>
            {compact ? (
                <div
                    style={{
                        height: "100%",
                        minHeight: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "stretch",
                        gap: dynamicGap,
                    }}
                >
                    {!mobile && top && infoItems.length > 0 && info}
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {mobile ? mobileStat : stat}
                    </div>
                    {(mobile || !top) && infoItems.length > 0 && info}
                </div>
            ) : (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: p.paddingY,
                            bottom: p.paddingY,
                            left: paddingX,
                            right: paddingX,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent:
                                p.statVerticalPosition === "Top"
                                    ? "flex-start"
                                    : p.statVerticalPosition === "Bottom"
                                      ? "flex-end"
                                      : "center",
                            pointerEvents: "none",
                        }}
                    >
                        {stat}
                    </div>
                    {infoItems.length > 0 && (
                        <div style={desktopInfoStyle}>{info}</div>
                    )}
                </>
            )}
            {showEditor && (
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        zIndex: 999,
                        bottom: 12,
                        left: 12,
                        width: editorOpen
                            ? "min(330px, calc(100% - 24px))"
                            : "auto",
                        maxHeight: "min(80%, 530px)",
                        overflowY: "auto",
                        boxSizing: "border-box",
                        color: "#F7F7F5",
                        background: "rgba(20,20,20,.96)",
                        border: "1px solid rgba(255,255,255,.16)",
                        borderRadius: 13,
                        boxShadow: "0 14px 40px rgba(0,0,0,.35)",
                        padding: 12,
                        fontFamily: "Inter, system-ui, sans-serif",
                        pointerEvents: "auto",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                            }}
                        >
                            <strong style={{ fontSize: 12 }}>
                                Editorial Stat{" "}
                                <span
                                    style={{
                                        color: "#9B9B9B",
                                        fontWeight: 400,
                                    }}
                                >
                                    {" "}
                                    / Creative Editor
                                </span>
                            </strong>
                            {editorOpen && (
                                <span style={{ fontSize: 10, color: "#AAA" }}>
                                    Try an effect without changing the component
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setEditorOpen((v) => !v)}
                            aria-label={
                                editorOpen
                                    ? "Collapse creative editor"
                                    : "Expand creative editor"
                            }
                            aria-expanded={editorOpen}
                            style={editorButton}
                        >
                            {editorOpen ? "Hide" : "Edit"}
                        </button>
                    </div>
                    {editorOpen && (
                        <div
                            style={{ display: "grid", gap: 12, marginTop: 15 }}
                        >
                            <div>
                                <label style={editorLabel}>
                                    Demo statistic
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 5,
                                    }}
                                >
                                    {[
                                        "Original",
                                        "Studio",
                                        "Years",
                                        "Global",
                                        "Rating",
                                    ].map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => {
                                                setDemo(v)
                                                replayPreview()
                                            }}
                                            style={{
                                                ...editorButton,
                                                ...(demo === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={editorLabel}>
                                    Counter animation
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 5,
                                    }}
                                >
                                    {(
                                        [
                                            "Original",
                                            "Character Roll",
                                            "Number Count",
                                        ] as const
                                    ).map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => {
                                                setEditorMode(v)
                                                replayPreview()
                                            }}
                                            style={{
                                                ...editorButton,
                                                ...(editorMode === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v === "Character Roll"
                                                ? "Digit Roll"
                                                : v === "Number Count"
                                                  ? "Count Up"
                                                  : "Default"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={editorLabel}>
                                    Reveal direction
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 5,
                                    }}
                                >
                                    {(
                                        [
                                            "Original",
                                            "Up",
                                            "Down",
                                            "Left",
                                            "Right",
                                        ] as const
                                    ).map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => {
                                                setEditorDirection(v)
                                                replayPreview()
                                            }}
                                            style={{
                                                ...editorButton,
                                                ...(editorDirection === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v === "Original" ? "Default" : v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={editorLabel}>
                                    Animation pace
                                </label>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {(
                                        ["Original", "Slow", "Fast"] as const
                                    ).map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => {
                                                setEditorSpeed(v)
                                                replayPreview()
                                            }}
                                            style={{
                                                ...editorButton,
                                                ...(editorSpeed === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v === "Original" ? "Default" : v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={editorLabel}>Colour theme</label>
                                <div style={{ display: "flex", gap: 5 }}>
                                    {(
                                        [
                                            "Original",
                                            "Dark",
                                            "Light",
                                            "Warm",
                                        ] as const
                                    ).map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => setEditorTheme(v)}
                                            style={{
                                                ...editorButton,
                                                ...(editorTheme === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v === "Original" ? "Default" : v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={editorLabel}>
                                    Responsive layout
                                </label>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 5,
                                    }}
                                >
                                    {(
                                        [
                                            "Original",
                                            "Auto",
                                            "Stack",
                                            "Anchored",
                                        ] as const
                                    ).map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => setEditorLayout(v)}
                                            style={{
                                                ...editorButton,
                                                ...(editorLayout === v
                                                    ? editorActive
                                                    : {}),
                                            }}
                                        >
                                            {v === "Original" ? "Default" : v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 7,
                                    paddingTop: 4,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={replayPreview}
                                    style={{
                                        ...editorButton,
                                        ...editorActive,
                                        flex: 1,
                                    }}
                                >
                                    ↻ Replay animation
                                </button>
                                <button
                                    type="button"
                                    onClick={resetPreview}
                                    style={{ ...editorButton, flex: 1 }}
                                >
                                    Reset preview
                                </button>
                            </div>
                            <span style={{ fontSize: 10, color: "#9B9B9B" }}>
                                Preview-only controls. Hide the editor in Framer
                                properties for your live site.
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

WebXEditorialStat.defaultProps = {
    width: 1200,
    height: 620,
    value: 128,
    unit: "projects",
    decimals: 0,
    useGrouping: true,
    valuePrefix: "",
    valueSuffix: "",
    countFrom: 0,
    countStyle: "Character Roll",
    direction: "Up",
    duration: 1.65,
    statDelay: 0,
    characterStagger: 0.14,
    unitCharacterStagger: 0.035,
    stagger: 0.1,
    infoItemStagger: 0.12,
    infoDelay: 0.2,
    triggerAmount: 0.2,
    replayOnReentry: false,
    fontWeight: 700,
    fontSize: 330,
    unitSizeRatio: 1,
    valueUnitGap: 16,
    letterSpacing: -0.065,
    textColor: "#F7F7F5",
    bgColor: "#111111",
    paddingX: 48,
    paddingY: 55,
    statVerticalPosition: "Top",
    infoPosition: "Bottom Right",
    infoTextAlign: "right",
    infoTitle: "A CREATIVE PRACTICE",
    infoSubtitle: "WORK MADE WITH PURPOSE",
    infoDescription: "",
    infoWidth: 520,
    infoGap: 6,
    infoOffsetX: 0,
    infoOffsetY: 0,
    infoTitleSize: 18,
    infoSubtitleSize: 18,
    infoDescriptionSize: 14,
    infoColor: "#F7F7F5",
    infoOpacity: 1,
    infoAnimate: true,
    responsiveLayout: "Auto",
    stackBreakpoint: 1300,
    compactGap: 22,
    mobileBreakpoint: 700,
    mobileInfoGap: 10,
    mobileUnitWidth: 0.96,
    showCreativeEditor: false,
}

addPropertyControls(WebXEditorialStat, {
    showCreativeEditor: {
        type: ControlType.Boolean,
        title: "Creative Editor",
        defaultValue: false,
        description:
            "Show preview-only demo controls. Switch off before publishing your site.",
    },
    value: { type: ControlType.Number, title: "Value", defaultValue: 128 },
    unit: {
        type: ControlType.String,
        title: "Unit",
        defaultValue: "projects",
        maxLength: 60,
    },
    decimals: {
        type: ControlType.Number,
        title: "Decimals",
        min: 0,
        max: 6,
        step: 1,
        defaultValue: 0,
    },
    countFrom: {
        type: ControlType.Number,
        title: "Count From",
        defaultValue: 0,
    },
    useGrouping: {
        type: ControlType.Boolean,
        title: "Separators",
        defaultValue: true,
    },
    valuePrefix: {
        type: ControlType.String,
        title: "Prefix",
        defaultValue: "",
        maxLength: 12,
    },
    valueSuffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "",
        maxLength: 12,
    },
    countStyle: {
        type: ControlType.Enum,
        title: "Count Style",
        options: ["Number Count", "Character Roll"],
        defaultValue: "Character Roll",
        optionTitles: ["Numeric Count", "Digit Roll"],
    },
    direction: {
        type: ControlType.Enum,
        title: "Reveal From",
        options: ["Up", "Down", "Left", "Right"],
        defaultValue: "Up",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 5,
        step: 0.05,
        defaultValue: 1.65,
        unit: "s",
    },
    statDelay: {
        type: ControlType.Number,
        title: "Stat Delay",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0,
        unit: "s",
    },
    characterStagger: {
        type: ControlType.Number,
        title: "Digit Stagger",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.14,
        unit: "s",
        hidden: (p) => p.countStyle !== "Character Roll",
    },
    unitCharacterStagger: {
        type: ControlType.Number,
        title: "Unit Stagger",
        min: 0,
        max: 0.5,
        step: 0.005,
        defaultValue: 0.035,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Block Stagger",
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 0.1,
        unit: "s",
        description:
            "Delay between the last digit starting and the first unit letter starting.",
    },
    infoItemStagger: {
        type: ControlType.Number,
        title: "Info Stagger",
        min: 0,
        max: 1.5,
        step: 0.025,
        defaultValue: 0.12,
        unit: "s",
    },
    infoDelay: {
        type: ControlType.Number,
        title: "Info Delay",
        min: 0,
        max: 3,
        step: 0.05,
        defaultValue: 0.2,
        unit: "s",
    },
    triggerAmount: {
        type: ControlType.Number,
        title: "Scroll Trigger",
        min: 0.01,
        max: 0.9,
        step: 0.05,
        defaultValue: 0.2,
    },
    replayOnReentry: {
        type: ControlType.Boolean,
        title: "Replay",
        defaultValue: false,
    },
    font: {
        type: ControlType.Font,
        title: "Stat Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    fontWeight: {
        type: ControlType.Number,
        title: "Weight",
        min: 100,
        max: 900,
        step: 100,
        defaultValue: 700,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Max Size",
        min: 24,
        max: 800,
        step: 4,
        defaultValue: 330,
    },
    unitSizeRatio: {
        type: ControlType.Number,
        title: "Unit Scale",
        min: 0.2,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    valueUnitGap: {
        type: ControlType.Number,
        title: "Stat Gap",
        min: 0,
        max: 100,
        defaultValue: 16,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        min: -0.12,
        max: 0.12,
        step: 0.005,
        defaultValue: -0.065,
    },
    statVerticalPosition: {
        type: ControlType.Enum,
        title: "Stat Position",
        options: ["Top", "Center", "Bottom"],
        defaultValue: "Top",
    },
    textColor: {
        type: ControlType.Color,
        title: "Stat Color",
        defaultValue: "#F7F7F5",
    },
    bgColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Side Padding",
        min: 0,
        max: 200,
        defaultValue: 48,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Y Padding",
        min: 0,
        max: 200,
        defaultValue: 55,
    },
    responsiveLayout: {
        type: ControlType.Enum,
        title: "Responsive",
        options: ["Auto", "Stack", "Anchored"],
        optionTitles: ["Automatic", "Always Stack", "Anchored"],
        defaultValue: "Auto",
    },
    stackBreakpoint: {
        type: ControlType.Number,
        title: "Stack Below",
        min: 320,
        max: 2000,
        step: 20,
        defaultValue: 1300,
        hidden: (p) => p.responsiveLayout !== "Auto",
    },
    compactGap: {
        type: ControlType.Number,
        title: "Compact Gap",
        min: 0,
        max: 120,
        step: 2,
        defaultValue: 22,
        hidden: (p) => p.responsiveLayout === "Anchored",
    },
    mobileBreakpoint: {
        type: ControlType.Number,
        title: "Mobile Below",
        min: 280,
        max: 900,
        step: 20,
        defaultValue: 700,
    },
    mobileInfoGap: {
        type: ControlType.Number,
        title: "Mobile Info Gap",
        min: 0,
        max: 80,
        step: 2,
        defaultValue: 10,
    },
    mobileUnitWidth: {
        type: ControlType.Number,
        title: "Mobile Unit Fill",
        min: 0.5,
        max: 1,
        step: 0.02,
        defaultValue: 0.96,
        description: "Target fraction of available width occupied by the unit",
    },
    infoPosition: {
        type: ControlType.Enum,
        title: "Info Position",
        options: [
            "Top Left",
            "Top Center",
            "Top Right",
            "Bottom Left",
            "Bottom Center",
            "Bottom Right",
        ],
        defaultValue: "Bottom Right",
    },
    infoTextAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        defaultValue: "right",
    },
    infoTitle: {
        type: ControlType.String,
        title: "Title",
        maxLength: 100,
        defaultValue: "A CREATIVE PRACTICE",
    },
    infoSubtitle: {
        type: ControlType.String,
        title: "Subtitle",
        maxLength: 180,
        defaultValue: "WORK MADE WITH PURPOSE",
    },
    infoDescription: {
        type: ControlType.String,
        title: "Description",
        maxLength: 320,
        displayTextArea: true,
        defaultValue: "",
    },
    infoFont: {
        type: ControlType.Font,
        title: "Info Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    infoWidth: {
        type: ControlType.Number,
        title: "Info Width",
        min: 100,
        max: 1200,
        defaultValue: 520,
    },
    infoGap: {
        type: ControlType.Number,
        title: "Info Gap",
        min: 0,
        max: 50,
        defaultValue: 6,
    },
    infoOffsetX: {
        type: ControlType.Number,
        title: "Info X",
        min: -250,
        max: 250,
        defaultValue: 0,
    },
    infoOffsetY: {
        type: ControlType.Number,
        title: "Info Y",
        min: -250,
        max: 250,
        defaultValue: 0,
    },
    infoTitleSize: {
        type: ControlType.Number,
        title: "Title Size",
        min: 8,
        max: 120,
        defaultValue: 18,
    },
    infoSubtitleSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        min: 8,
        max: 120,
        defaultValue: 18,
    },
    infoDescriptionSize: {
        type: ControlType.Number,
        title: "Body Size",
        min: 8,
        max: 80,
        defaultValue: 14,
    },
    infoColor: {
        type: ControlType.Color,
        title: "Info Color",
        defaultValue: "#F7F7F5",
    },
    infoOpacity: {
        type: ControlType.Number,
        title: "Info Opacity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
    },
    infoAnimate: {
        type: ControlType.Boolean,
        title: "Animate Info",
        defaultValue: true,
    },
})
