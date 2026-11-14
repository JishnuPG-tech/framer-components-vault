import React, { useState, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useReducedMotion, useInView } from "framer-motion"

/* --------------------------------------------------
   Types
-------------------------------------------------- */
type ComponentMode = "Status Badge" | "Standalone Indicator"
type VisualPreset = "Minimal" | "Glow" | "Custom"
type StatusPreset =
    | "Available to work"
    | "Busy right now"
    | "Unavailable"
    | "Open for collabs"
    | "Custom"
type BackgroundStyle = "Solid" | "Subtle Gradient" | "Transparent"
type ColorMode = "Match Status" | "Custom"
type LabelPosition = "Left" | "Right"
type ContentAlignment = "Start" | "Center" | "End"
type IndicatorShape = "Circle" | "Square" | "Rounded Square"
type VerticalAlignment = "Start" | "Center" | "End"

interface FontValue {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    letterSpacing?: number | string
    lineHeight?: number | string
}

interface LiveIndicatorProProps {
    /* Status */
    statusPreset?: StatusPreset
    labelText?: string

    /* Mode & appearance */
    componentMode?: ComponentMode
    visualPreset?: VisualPreset

    /* Background */
    backgroundEnabled?: boolean
    backgroundColor?: string
    backgroundOpacity?: number
    backgroundStyle?: BackgroundStyle
    borderEnabled?: boolean
    borderColor?: string
    borderWidth?: number
    cornerRadius?: number
    paddingHorizontal?: number
    paddingVertical?: number
    minWidth?: number
    contentAlignment?: ContentAlignment
    contentVerticalAlignment?: VerticalAlignment

    /* Spacing */
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number

    /* Indicator */
    statusColor?: string
    dotSize?: number
    indicatorShape?: IndicatorShape
    indicatorWidth?: number
    indicatorHeight?: number
    indicatorRadius?: number

    /* Blink */
    enableBlink?: boolean
    blinkCycle?: number
    blinkMinOpacity?: number

    /* Pulse */
    enablePulse?: boolean
    ringCount?: number
    pulseDuration?: number
    pulseDelay?: number
    pulseStartOpacity?: number
    pulseEndOpacity?: number
    pulseScale?: number
    pulseColorMode?: ColorMode
    pulseColor?: string

    /* Shake */
    enableShake?: boolean
    shakeDistance?: number
    shakeDuration?: number
    shakeDelay?: number

    /* Glow */
    enableGlow?: boolean
    glowColorMode?: ColorMode
    glowColor?: string
    glowIntensity?: number
    glowBlur?: number
    glowSpread?: number
    glowBreathing?: boolean
    glowBreathingDuration?: number

    /* Label */
    showLabel?: boolean
    labelColor?: string
    labelFont?: FontValue
    labelGap?: number
    labelPosition?: LabelPosition

    /* Interaction */
    link?: string
    openInNewTab?: boolean
    hoverBackgroundColor?: string
    hoverBorderColor?: string
    pressedBackgroundColor?: string
    hoverScale?: number
    focusRingColor?: string
    disabled?: boolean

    /* Accessibility */
    accessibleLabel?: string
    respectReducedMotion?: boolean

    /* Framer */
    style?: React.CSSProperties
}

/* --------------------------------------------------
   Status preset definitions
-------------------------------------------------- */
const STATUS_PRESETS: Record<
    Exclude<StatusPreset, "Custom">,
    {
        label: string
        indicator: string
        background: string
        border: string
        glow: string
        wave: string
    }
> = {
    "Available to work": {
        label: "Available to work",
        indicator: "#22CC66",
        background: "#17191B",
        border: "#343638",
        glow: "#22CC66",
        wave: "#22CC66",
    },
    "Busy right now": {
        label: "Busy right now",
        indicator: "#FFB020",
        background: "#1F1A0E",
        border: "#4A3A1A",
        glow: "#FFB020",
        wave: "#FFB020",
    },
    Unavailable: {
        label: "Unavailable",
        indicator: "#FF4D4F",
        background: "#1F0E0E",
        border: "#4A1A1A",
        glow: "#FF4D4F",
        wave: "#FF4D4F",
    },
    "Open for collabs": {
        label: "Open for collabs",
        indicator: "#3B82F6",
        background: "#0E1A2F",
        border: "#1A2A4A",
        glow: "#3B82F6",
        wave: "#3B82F6",
    },
}

/* --------------------------------------------------
   Defaults
-------------------------------------------------- */
const DEFAULT_FONT: FontValue = {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.4,
}

const DEFAULTS = {
    statusPreset: "Available to work" as StatusPreset,
    labelText: "Available to work",

    componentMode: "Status Badge" as ComponentMode,
    visualPreset: "Minimal" as VisualPreset,

    backgroundEnabled: true,
    backgroundColor: "#17191B",
    backgroundOpacity: 1,
    backgroundStyle: "Solid" as BackgroundStyle,
    borderEnabled: true,
    borderColor: "#343638",
    borderWidth: 1,
    cornerRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    minWidth: 0,
    contentAlignment: "Center" as ContentAlignment,
    contentVerticalAlignment: "Center" as VerticalAlignment,

    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,

    statusColor: "#22CC66",
    dotSize: 8,
    indicatorShape: "Circle" as IndicatorShape,
    indicatorWidth: 24,
    indicatorHeight: 24,
    indicatorRadius: 6,

    enableBlink: true,
    blinkCycle: 1200,
    blinkMinOpacity: 0.2,

    enablePulse: true,
    ringCount: 2,
    pulseDuration: 1600,
    pulseDelay: 0,
    pulseStartOpacity: 0.35,
    pulseEndOpacity: 0,
    pulseScale: 2.2,
    pulseColorMode: "Match Status" as ColorMode,
    pulseColor: "#22CC66",

    enableShake: false,
    shakeDistance: 2,
    shakeDuration: 600,
    shakeDelay: 2000,

    enableGlow: true,
    glowColorMode: "Match Status" as ColorMode,
    glowColor: "#22CC66",
    glowIntensity: 0.5,
    glowBlur: 6,
    glowSpread: 0,
    glowBreathing: false,
    glowBreathingDuration: 3000,

    showLabel: true,
    labelColor: "#F5F5F5",
    labelFont: DEFAULT_FONT,
    labelGap: 8,
    labelPosition: "Right" as LabelPosition,

    link: "",
    openInNewTab: false,
    hoverBackgroundColor: "#1F2224",
    hoverBorderColor: "#4A4D4F",
    pressedBackgroundColor: "#121415",
    hoverScale: 1.02,
    focusRingColor: "#22CC66",
    disabled: false,

    accessibleLabel: "",
    respectReducedMotion: true,
}

/* --------------------------------------------------
   Helpers
-------------------------------------------------- */
function clamp(
    value: number,
    min: number,
    max: number,
    fallback: number
): number {
    if (typeof value !== "number" || Number.isNaN(value)) return fallback
    return Math.min(max, Math.max(min, value))
}

function normalizeHex(hex: string): string {
    const h = hex.replace("#", "").trim()
    if (h.length === 3)
        return h
            .split("")
            .map((c) => c + c)
            .join("")
    if (h.length === 6) return h
    return ""
}

function hexToRgba(hex: string, opacity: number): string {
    const n = normalizeHex(hex)
    if (!n) return hex
    const r = parseInt(n.slice(0, 2), 16)
    const g = parseInt(n.slice(2, 4), 16)
    const b = parseInt(n.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${clamp(opacity, 0, 1, 1)})`
}

function shiftHex(hex: string, amount: number): string {
    const n = normalizeHex(hex)
    if (!n) return hex
    const r = Math.min(255, Math.max(0, parseInt(n.slice(0, 2), 16) + amount))
    const g = Math.min(255, Math.max(0, parseInt(n.slice(2, 4), 16) + amount))
    const b = Math.min(255, Math.max(0, parseInt(n.slice(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function buildBackground(
    color: string,
    opacity: number,
    style: BackgroundStyle
): string {
    if (style === "Transparent") return "transparent"
    if (style === "Subtle Gradient") {
        return `linear-gradient(135deg, ${hexToRgba(
            shiftHex(color, 14),
            opacity
        )} 0%, ${hexToRgba(color, opacity)} 100%)`
    }
    return hexToRgba(color, opacity)
}

function resolveColor(
    mode: ColorMode,
    customColor: string,
    statusColor: string
): string {
    return mode === "Custom" ? customColor : statusColor
}

function presetGlowMultiplier(preset: VisualPreset): number {
    if (preset === "Glow") return 1.8
    if (preset === "Minimal") return 0.8
    return 1
}

function presetWaveMultiplier(preset: VisualPreset): number {
    if (preset === "Glow") return 1.3
    if (preset === "Minimal") return 0.9
    return 1
}

const horizontalAlignmentMap: Record<
    ContentAlignment,
    React.CSSProperties["justifyContent"]
> = {
    Start: "flex-start",
    Center: "center",
    End: "flex-end",
}

const verticalAlignmentMap: Record<
    VerticalAlignment,
    React.CSSProperties["alignItems"]
> = {
    Start: "flex-start",
    Center: "center",
    End: "flex-end",
}

/* --------------------------------------------------
   Component
-------------------------------------------------- */

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 36
 */
export default function LiveIndicatorPro(props: LiveIndicatorProProps) {
    const p = { ...DEFAULTS, ...props }
    const { style } = props

    const isStatic = useIsStaticRenderer()
    const prefersReducedMotion = useReducedMotion()
    const reduceMotion =
        p.respectReducedMotion === true && prefersReducedMotion === true

    const rootRef = useRef<HTMLAnchorElement | HTMLDivElement | null>(null)
    const isInView = useInView(rootRef)

    const shouldAnimate = !isStatic && !reduceMotion && isInView

    const [isHovered, setIsHovered] = useState(false)
    const [isPressed, setIsPressed] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    /* ---------- Resolve preset values ---------- */
    const presetValues =
        p.statusPreset !== "Custom" ? STATUS_PRESETS[p.statusPreset] : null

    const effectiveLabel = presetValues
        ? presetValues.label
        : p.labelText || DEFAULTS.labelText

    const effectiveStatusColor = presetValues
        ? presetValues.indicator
        : p.statusColor || DEFAULTS.statusColor

    const effectiveBackgroundColor = presetValues
        ? presetValues.background
        : p.backgroundColor || DEFAULTS.backgroundColor

    const effectiveBorderColor = presetValues
        ? presetValues.border
        : p.borderColor || DEFAULTS.borderColor

    const effectiveGlowColor = presetValues
        ? presetValues.glow
        : resolveColor(
              p.glowColorMode,
              p.glowColor || DEFAULTS.glowColor,
              effectiveStatusColor
          )

    const effectivePulseColor = presetValues
        ? presetValues.wave
        : resolveColor(
              p.pulseColorMode,
              p.pulseColor || DEFAULTS.pulseColor,
              effectiveStatusColor
          )

    /* ---------- Normalize values ---------- */
    const dotSize = clamp(p.dotSize, 4, 64, 8)
    const ringCount = Math.round(clamp(p.ringCount, 1, 3, 2))
    const pulseDuration = clamp(p.pulseDuration, 300, 5000, 1600)
    const pulseDelay = clamp(p.pulseDelay, 0, 2000, 0)
    const pulseEndOpacity = clamp(p.pulseEndOpacity, 0, 1, 0)
    const pulseScale = clamp(p.pulseScale, 1, 8, 2.2)
    const blinkCycle = clamp(p.blinkCycle, 300, 3000, 1200)
    const blinkMinOpacity = clamp(p.blinkMinOpacity, 0.05, 1, 0.2)
    const shakeDistance = clamp(p.shakeDistance, 0, 10, 2)
    const shakeDuration = clamp(p.shakeDuration, 100, 2000, 600)
    const shakeDelay = clamp(p.shakeDelay, 0, 10000, 2000)
    const glowBlur = clamp(p.glowBlur, 0, 30, 6)
    const glowSpread = clamp(p.glowSpread, 0, 20, 0)
    const glowBreathingDuration = clamp(
        p.glowBreathingDuration,
        500,
        8000,
        3000
    )
    const paddingHorizontal = clamp(p.paddingHorizontal, 0, 64, 13)
    const paddingVertical = clamp(p.paddingVertical, 0, 64, 8)
    const cornerRadius = clamp(p.cornerRadius, 0, 999, 999)
    const borderWidth = clamp(p.borderWidth, 0, 8, 1)
    const hoverScale = clamp(p.hoverScale, 0.8, 1.2, 1.02)
    const minWidth = clamp(p.minWidth, 0, 400, 0)

    const marginTop = clamp(p.marginTop, 0, 200, 0)
    const marginRight = clamp(p.marginRight, 0, 200, 0)
    const marginBottom = clamp(p.marginBottom, 0, 200, 0)
    const marginLeft = clamp(p.marginLeft, 0, 200, 0)

    const indicatorWidth = clamp(
        p.indicatorWidth,
        8,
        200,
        p.componentMode === "Standalone Indicator" ? 24 : dotSize
    )
    const indicatorHeight = clamp(
        p.indicatorHeight,
        8,
        200,
        p.componentMode === "Standalone Indicator" ? 24 : dotSize
    )
    const indicatorRadius = clamp(p.indicatorRadius, 0, 100, 6)

    /* ---------- Dimensions ---------- */
    const isStandalone = p.componentMode === "Standalone Indicator"
    const link = (p.link ?? "").trim()
    const isButton = !isStandalone && link.length > 0
    const isDisabled = isButton && p.disabled === true
    const isInteractive = isButton && !isDisabled

    const dotWidth = isStandalone ? indicatorWidth : dotSize
    const dotHeight = isStandalone ? indicatorHeight : dotSize
    const centerX = dotWidth / 2
    const centerY = dotHeight / 2

    const shapeRadius =
        p.indicatorShape === "Circle"
            ? Math.min(dotWidth, dotHeight) / 2
            : p.indicatorShape === "Square"
              ? 0
              : indicatorRadius

    const baseRadius = Math.min(dotWidth, dotHeight) / 2
    const ringEndRadius = baseRadius * pulseScale

    /* ---------- Apply visual preset multipliers ---------- */
    const presetActive = !isStandalone
    const baseGlowIntensity = clamp(p.glowIntensity, 0, 1, 0.5)
    const basePulseStartOpacity = clamp(p.pulseStartOpacity, 0, 1, 0.35)
    const glowIntensity = presetActive
        ? Math.min(1, baseGlowIntensity * presetGlowMultiplier(p.visualPreset))
        : baseGlowIntensity
    const pulseStartOpacity = presetActive
        ? Math.min(
              1,
              basePulseStartOpacity * presetWaveMultiplier(p.visualPreset)
          )
        : basePulseStartOpacity

    /* ---------- SVG unique ids ---------- */
    const reactId = React.useId()
    const uid = `lip-${reactId.replace(/:/g, "")}`
    const glowFilterId = `${uid}-glow`

    /* ---------- Pulse rings ---------- */
    const rings =
        shouldAnimate && p.enablePulse
            ? Array.from({ length: ringCount }, (_, index) => {
                  const stagger = (pulseDuration / ringCount) * index
                  const begin = `${pulseDelay - stagger}ms`

                  return (
                      <circle
                          key={`ring-${index}`}
                          cx={centerX}
                          cy={centerY}
                          r={baseRadius}
                          fill="none"
                          stroke={effectivePulseColor}
                          strokeWidth={1.5}
                          opacity={0}
                          style={{ transition: "stroke 0.35s ease" }}
                      >
                          <animate
                              attributeName="r"
                              from={baseRadius}
                              to={ringEndRadius}
                              dur={`${pulseDuration}ms`}
                              begin={begin}
                              repeatCount="indefinite"
                              calcMode="spline"
                              keyTimes="0;1"
                              keySplines="0.22 0.61 0.36 1"
                          />
                          <animate
                              attributeName="opacity"
                              values={`${pulseStartOpacity};${pulseEndOpacity}`}
                              dur={`${pulseDuration}ms`}
                              begin={begin}
                              repeatCount="indefinite"
                              calcMode="spline"
                              keyTimes="0;1"
                              keySplines="0.22 0.61 0.36 1"
                          />
                      </circle>
                  )
              })
            : null

    /* ---------- Glow ---------- */
    const showGlow = p.enableGlow && glowIntensity > 0
    const glowRadius = baseRadius + glowSpread

    const glowElements = showGlow ? (
        <>
            <defs>
                <filter
                    id={glowFilterId}
                    x="-200%"
                    y="-200%"
                    width="400%"
                    height="400%"
                >
                    <feGaussianBlur stdDeviation={glowBlur} />
                </filter>
            </defs>
            <circle
                cx={centerX}
                cy={centerY}
                r={glowRadius}
                fill={effectiveGlowColor}
                opacity={glowIntensity}
                filter={`url(#${glowFilterId})`}
                style={{ transition: "fill 0.35s ease" }}
            >
                {shouldAnimate && p.glowBreathing ? (
                    <animate
                        attributeName="opacity"
                        values={`${glowIntensity};${glowIntensity * 0.35};${glowIntensity}`}
                        dur={`${glowBreathingDuration}ms`}
                        repeatCount="indefinite"
                        calcMode="spline"
                        keyTimes="0;0.5;1"
                        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                    />
                ) : null}
            </circle>
        </>
    ) : null

    /* ---------- Main dot ---------- */
    const dotElement = (
        <rect
            x={0}
            y={0}
            width={dotWidth}
            height={dotHeight}
            rx={shapeRadius}
            ry={shapeRadius}
            fill={effectiveStatusColor}
            style={{ transition: "fill 0.35s ease" }}
            opacity={1}
        >
            {shouldAnimate && p.enableBlink ? (
                <animate
                    attributeName="opacity"
                    values={`1;${blinkMinOpacity};1`}
                    keyTimes="0;0.5;1"
                    dur={`${blinkCycle}ms`}
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
                />
            ) : null}
        </rect>
    )

    /* ---------- Shake ---------- */
    const showShake = shouldAnimate && p.enableShake && shakeDistance > 0

    const shakeAnimation = showShake ? (
        <animateTransform
            attributeName="transform"
            type="translate"
            values={`0 0; ${shakeDistance} 0; ${-shakeDistance} 0; 0 0`}
            dur={`${shakeDuration}ms`}
            begin={`${shakeDelay}ms`}
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;0.25;0.5;0.75;1"
            keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
        />
    ) : null

    const indicatorContent = (
        <g style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
            {shakeAnimation}
            {rings}
            {glowElements}
            {dotElement}
        </g>
    )

    const glowPadding = glowBlur * 2 + glowSpread
    const ringPadding = p.enablePulse ? baseRadius * (pulseScale - 1) : 0
    const visualPadding = Math.max(glowPadding, ringPadding)

    const indicatorWrapper = (
        <div
            style={{
                position: "relative",
                width: dotWidth,
                height: dotHeight,
                flexShrink: 0,
                flexGrow: 0,
                overflow: "visible",
                pointerEvents: "none",
            }}
        >
            <svg
                aria-hidden="true"
                focusable="false"
                width={dotWidth + visualPadding * 2}
                height={dotHeight + visualPadding * 2}
                viewBox={`${-visualPadding} ${-visualPadding} ${
                    dotWidth + visualPadding * 2
                } ${dotHeight + visualPadding * 2}`}
                style={{
                    position: "absolute",
                    left: -visualPadding,
                    top: -visualPadding,
                    overflow: "visible",
                    display: "block",
                    pointerEvents: "none",
                }}
            >
                {indicatorContent}
            </svg>
        </div>
    )

    /* ---------- Label ---------- */
    const font = p.labelFont ?? DEFAULT_FONT
    const accessibleLabel = (p.accessibleLabel || "").trim()
    const labelText = effectiveLabel.trim()

    const labelStyle: React.CSSProperties = {
        color: p.labelColor || DEFAULTS.labelColor,
        ...font,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        minWidth: 0,
        userSelect: "none",
    }

    const label =
        p.showLabel && !isStandalone ? (
            <span
                aria-hidden={accessibleLabel ? true : undefined}
                style={labelStyle}
            >
                {effectiveLabel}
            </span>
        ) : null

    const contentRow = (
        <div
            style={{
                display: "flex",
                flexDirection:
                    p.labelPosition === "Left" ? "row-reverse" : "row",
                alignItems: "center",
                gap: p.labelGap,
                minWidth: 0,
                maxWidth: "100%",
            }}
        >
            {indicatorWrapper}
            {label}
        </div>
    )

    /* ---------- Background & border ---------- */
    const baseBgColor =
        isPressed && isInteractive
            ? p.pressedBackgroundColor || DEFAULTS.pressedBackgroundColor
            : isHovered && isInteractive
              ? p.hoverBackgroundColor || DEFAULTS.hoverBackgroundColor
              : effectiveBackgroundColor

    const backgroundCss =
        isStandalone || p.backgroundEnabled === false
            ? "transparent"
            : buildBackground(
                  baseBgColor,
                  clamp(p.backgroundOpacity, 0, 1, 1),
                  p.backgroundStyle
              )

    const resolvedBorderColor =
        isHovered && isInteractive
            ? p.hoverBorderColor || DEFAULTS.hoverBorderColor
            : effectiveBorderColor

    const borderCss =
        isStandalone || p.borderEnabled === false || borderWidth <= 0
            ? "none"
            : `${borderWidth}px solid ${resolvedBorderColor}`

    /* ---------- Outer wrapper (sizing + margins) ---------- */
    const outerWrapperStyle: React.CSSProperties = {
        width: "fit-content",
        height: "fit-content",
        display: "flex",
        boxSizing: "border-box",
        marginTop,
        marginRight,
        marginBottom,
        marginLeft,
        overflow: "visible",
        ...style,
    }

    /* ---------- Visual container (background, border, padding) ---------- */
    const visualContainerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: isStandalone
            ? "center"
            : verticalAlignmentMap[p.contentVerticalAlignment],
        justifyContent: isStandalone
            ? "center"
            : horizontalAlignmentMap[p.contentAlignment],
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: isStandalone
            ? 0
            : `${paddingVertical}px ${paddingHorizontal}px`,
        borderRadius: isStandalone ? 0 : cornerRadius,
        background: backgroundCss,
        border: borderCss,
        overflow: "visible",
        minWidth: isStandalone
            ? undefined
            : minWidth > 0
              ? minWidth
              : undefined,
        transition:
            "background 0.35s ease, border-color 0.35s ease, transform 0.18s ease",
        cursor: isInteractive
            ? "pointer"
            : isDisabled
              ? "not-allowed"
              : "default",
        transform:
            isInteractive && isPressed
                ? "scale(0.98)"
                : isInteractive && isHovered
                  ? `scale(${hoverScale})`
                  : "none",
        outline: isFocused
            ? `2px solid ${p.focusRingColor || DEFAULTS.focusRingColor}`
            : "none",
        outlineOffset: isFocused ? 2 : 0,
        textDecoration: "none",
        color: "inherit",
        font: "inherit",
        margin: 0,
        appearance: "none",
        WebkitAppearance: "none",
        userSelect: "none",
        opacity: isDisabled ? 0.5 : 1,
    }

    /* ---------- Interaction handlers ---------- */
    const interactionHandlers = {
        onMouseEnter: () => {
            if (isInteractive) setIsHovered(true)
        },
        onMouseLeave: () => {
            setIsHovered(false)
            setIsPressed(false)
        },
        onMouseDown: () => {
            if (isInteractive) setIsPressed(true)
        },
        onMouseUp: () => setIsPressed(false),
        onFocus: () => {
            if (isButton) setIsFocused(true)
        },
        onBlur: () => {
            setIsFocused(false)
            setIsHovered(false)
            setIsPressed(false)
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            if (isInteractive && e.key === "Enter" && !e.repeat) {
                setIsPressed(true)
            }
        },
        onKeyUp: (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === "Enter") setIsPressed(false)
        },
    }

    /* ---------- Button mode (link is set) ---------- */
    if (isButton) {
        const accessibleName =
            accessibleLabel ||
            (!p.showLabel ? labelText || "Status button" : undefined)

        return (
            <a
                ref={(el) => {
                    rootRef.current = el
                }}
                href={link}
                target={p.openInNewTab ? "_blank" : undefined}
                rel={p.openInNewTab ? "noopener noreferrer" : undefined}
                aria-label={accessibleName}
                aria-disabled={isDisabled || undefined}
                tabIndex={isDisabled ? -1 : undefined}
                onClick={(e) => {
                    if (isDisabled) e.preventDefault()
                }}
                style={outerWrapperStyle}
                {...interactionHandlers}
            >
                <div style={visualContainerStyle}>{contentRow}</div>
            </a>
        )
    }

    /* ---------- Badge / standalone mode ---------- */
    // This is static, property-driven status content. Using role="status" or
    // aria-live="polite" would make the wrapper a live region, causing screen
    // readers to re-announce the label whenever React re-renders (hover,
    // focus, isInView, isStatic, etc.). The accessible name is preserved via
    // aria-label when the visible label is hidden, and the visible label is
    // otherwise exposed naturally.
    const badgeName =
        accessibleLabel || (!p.showLabel ? "Status indicator" : undefined)

    return (
        <div
            ref={(el) => {
                rootRef.current = el
            }}
            aria-label={badgeName}
            style={outerWrapperStyle}
        >
            <div style={visualContainerStyle}>{contentRow}</div>
        </div>
    )
}

LiveIndicatorPro.defaultProps = DEFAULTS

/* --------------------------------------------------
   Property Controls (unchanged)
-------------------------------------------------- */

addPropertyControls(LiveIndicatorPro, {
    /* ===== STATUS ===== */
    statusPreset: {
        type: ControlType.Enum,
        title: "Status",
        options: [
            "Available to work",
            "Busy right now",
            "Unavailable",
            "Open for collabs",
            "Custom",
        ],
        optionTitles: [
            "Available",
            "Busy",
            "Unavailable",
            "Open for collabs",
            "Custom",
        ],
        defaultValue: "Available to work",
        description:
            "Preset colours and label. Choose Custom to expose individual colour controls.",
    },
    labelText: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Available to work",
        placeholder: "Available to work",
        hidden: (props: LiveIndicatorProProps) =>
            props.statusPreset !== "Custom" || props.showLabel === false,
    },

    /* ===== APPEARANCE ===== */
    componentMode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Status Badge", "Standalone Indicator"],
        optionTitles: ["Badge", "Indicator"],
        defaultValue: "Status Badge",
        displaySegmentedControl: true,
    },
    visualPreset: {
        type: ControlType.Enum,
        title: "Pill Style",
        options: ["Minimal", "Glow", "Custom"],
        optionTitles: ["Minimal", "Glow", "Custom"],
        defaultValue: "Minimal",
        displaySegmentedControl: true,
        description:
            "Minimal and Glow scale glow and wave intensity. Custom uses your exact values.",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },

    /* ===== BACKGROUND ===== */
    backgroundEnabled: {
        type: ControlType.Boolean,
        title: "Background",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#17191B",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            props.backgroundEnabled === false ||
            props.statusPreset !== "Custom",
    },
    backgroundStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["Solid", "Subtle Gradient", "Transparent"],
        defaultValue: "Solid",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            props.backgroundEnabled === false,
    },
    backgroundOpacity: {
        type: ControlType.Number,
        title: "Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            props.backgroundEnabled === false ||
            props.backgroundStyle === "Transparent",
    },
    borderEnabled: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#343638",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            props.borderEnabled === false ||
            props.statusPreset !== "Custom",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 1,
        min: 0,
        max: 8,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            props.borderEnabled === false,
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
        description: "999 creates a pill.",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    paddingHorizontal: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 13,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    paddingVertical: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 8,
        min: 0,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    minWidth: {
        type: ControlType.Number,
        title: "Min Width",
        defaultValue: 0,
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        description: "0 leaves the pill content-sized.",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    contentAlignment: {
        type: ControlType.Enum,
        title: "Align X",
        options: ["Start", "Center", "End"],
        defaultValue: "Center",
        displaySegmentedControl: true,
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    contentVerticalAlignment: {
        type: ControlType.Enum,
        title: "Align Y",
        options: ["Start", "Center", "End"],
        defaultValue: "Center",
        displaySegmentedControl: true,
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },

    /* ===== SPACING ===== */
    marginTop: {
        type: ControlType.Number,
        title: "Margin Top",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    marginRight: {
        type: ControlType.Number,
        title: "Margin Right",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    marginBottom: {
        type: ControlType.Number,
        title: "Margin Bottom",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },
    marginLeft: {
        type: ControlType.Number,
        title: "Margin Left",
        defaultValue: 0,
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
    },

    /* ===== INDICATOR ===== */
    statusColor: {
        type: ControlType.Color,
        title: "Status Color",
        defaultValue: "#22CC66",
        hidden: (props: LiveIndicatorProProps) =>
            props.statusPreset !== "Custom",
    },
    dotSize: {
        type: ControlType.Number,
        title: "Dot Size",
        defaultValue: 8,
        min: 4,
        max: 64,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    indicatorShape: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["Circle", "Square", "Rounded Square"],
        defaultValue: "Circle",
        displaySegmentedControl: true,
    },
    indicatorWidth: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 24,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode !== "Standalone Indicator",
    },
    indicatorHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 24,
        min: 8,
        max: 200,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode !== "Standalone Indicator",
    },
    indicatorRadius: {
        type: ControlType.Number,
        title: "Corner",
        defaultValue: 6,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) =>
            props.indicatorShape !== "Rounded Square",
    },

    /* ===== BLINK ===== */
    enableBlink: {
        type: ControlType.Boolean,
        title: "Blink",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    blinkCycle: {
        type: ControlType.Number,
        title: "Blink Cycle",
        defaultValue: 1200,
        min: 300,
        max: 3000,
        step: 50,
        unit: "ms",
        description: "Full fade-out and fade-in cycle.",
        hidden: (props: LiveIndicatorProProps) => props.enableBlink === false,
    },
    blinkMinOpacity: {
        type: ControlType.Number,
        title: "Min Opacity",
        defaultValue: 0.2,
        min: 0.05,
        max: 1,
        step: 0.05,
        hidden: (props: LiveIndicatorProProps) => props.enableBlink === false,
    },

    /* ===== PULSE ===== */
    enablePulse: {
        type: ControlType.Boolean,
        title: "Pulse Rings",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    ringCount: {
        type: ControlType.Number,
        title: "Ring Count",
        defaultValue: 2,
        min: 1,
        max: 3,
        step: 1,
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 1600,
        min: 300,
        max: 5000,
        step: 100,
        unit: "ms",
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 0,
        min: 0,
        max: 2000,
        step: 50,
        unit: "ms",
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseStartOpacity: {
        type: ControlType.Number,
        title: "Start Opacity",
        defaultValue: 0.35,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseEndOpacity: {
        type: ControlType.Number,
        title: "End Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseScale: {
        type: ControlType.Number,
        title: "Expansion",
        defaultValue: 2.2,
        min: 1,
        max: 8,
        step: 0.1,
        description: "Multiplier applied to the dot radius.",
        hidden: (props: LiveIndicatorProProps) => props.enablePulse === false,
    },
    pulseColorMode: {
        type: ControlType.Enum,
        title: "Ring Color",
        options: ["Match Status", "Custom"],
        defaultValue: "Match Status",
        displaySegmentedControl: true,
        hidden: (props: LiveIndicatorProProps) =>
            props.enablePulse === false || props.statusPreset !== "Custom",
    },
    pulseColor: {
        type: ControlType.Color,
        title: "Custom Ring",
        defaultValue: "#22CC66",
        hidden: (props: LiveIndicatorProProps) =>
            props.enablePulse === false ||
            props.statusPreset !== "Custom" ||
            props.pulseColorMode !== "Custom",
    },

    /* ===== SHAKE ===== */
    enableShake: {
        type: ControlType.Boolean,
        title: "Shake",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    shakeDistance: {
        type: ControlType.Number,
        title: "Distance",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.5,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) => props.enableShake === false,
    },
    shakeDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 600,
        min: 100,
        max: 2000,
        step: 50,
        unit: "ms",
        hidden: (props: LiveIndicatorProProps) => props.enableShake === false,
    },
    shakeDelay: {
        type: ControlType.Number,
        title: "Delay",
        defaultValue: 2000,
        min: 0,
        max: 10000,
        step: 100,
        unit: "ms",
        hidden: (props: LiveIndicatorProProps) => props.enableShake === false,
    },

    /* ===== GLOW ===== */
    enableGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    glowColorMode: {
        type: ControlType.Enum,
        title: "Glow Color",
        options: ["Match Status", "Custom"],
        defaultValue: "Match Status",
        displaySegmentedControl: true,
        hidden: (props: LiveIndicatorProProps) =>
            props.enableGlow === false || props.statusPreset !== "Custom",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Custom Glow",
        defaultValue: "#22CC66",
        hidden: (props: LiveIndicatorProProps) =>
            props.enableGlow === false ||
            props.statusPreset !== "Custom" ||
            props.glowColorMode !== "Custom",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props: LiveIndicatorProProps) => props.enableGlow === false,
    },
    glowBlur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) => props.enableGlow === false,
    },
    glowSpread: {
        type: ControlType.Number,
        title: "Spread",
        defaultValue: 0,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) => props.enableGlow === false,
    },
    glowBreathing: {
        type: ControlType.Boolean,
        title: "Breathing",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props: LiveIndicatorProProps) => props.enableGlow === false,
    },
    glowBreathingDuration: {
        type: ControlType.Number,
        title: "Breath Duration",
        defaultValue: 3000,
        min: 500,
        max: 8000,
        step: 100,
        unit: "ms",
        hidden: (props: LiveIndicatorProProps) =>
            props.enableGlow === false || props.glowBreathing === false,
    },

    /* ===== LABEL ===== */
    showLabel: {
        type: ControlType.Boolean,
        title: "Show Label",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#F5F5F5",
        hidden: (props: LiveIndicatorProProps) => props.showLabel === false,
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        defaultValue: DEFAULT_FONT,
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: false,
        hidden: (props: LiveIndicatorProProps) => props.showLabel === false,
    },
    labelGap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 8,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (props: LiveIndicatorProProps) => props.showLabel === false,
    },
    labelPosition: {
        type: ControlType.Enum,
        title: "Label Position",
        options: ["Left", "Right"],
        defaultValue: "Right",
        displaySegmentedControl: true,
        hidden: (props: LiveIndicatorProProps) => props.showLabel === false,
    },

    /* ===== INTERACTION ===== */
    link: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "",
        description:
            "When set, the badge becomes a semantic link. Leave empty for a non-interactive badge.",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover BG",
        defaultValue: "#1F2224",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "#4A4D4F",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim() ||
            props.borderEnabled === false,
    },
    pressedBackgroundColor: {
        type: ControlType.Color,
        title: "Pressed BG",
        defaultValue: "#121415",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.02,
        min: 0.8,
        max: 1.2,
        step: 0.01,
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },
    focusRingColor: {
        type: ControlType.Color,
        title: "Focus Ring",
        defaultValue: "#22CC66",
        hidden: (props: LiveIndicatorProProps) =>
            props.componentMode === "Standalone Indicator" ||
            !props.link?.trim(),
    },

    /* ===== ACCESSIBILITY ===== */
    accessibleLabel: {
        type: ControlType.String,
        title: "Accessible Label",
        defaultValue: "",
        placeholder: "Optional status description",
        description:
            "Used by screen readers when the visible label is hidden or needs extra context.",
    },
    respectReducedMotion: {
        type: ControlType.Boolean,
        title: "Reduced Motion",
        defaultValue: true,
        enabledTitle: "Respect",
        disabledTitle: "Ignore",
        description:
            "When on, decorative animations stop for visitors who have enabled reduced motion.",
    },
})
