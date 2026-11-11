import * as React from "react"
// @ts-ignore
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Variant = "solid" | "outline" | "ghost" | "glass" | "gradient" | "magnetic"
type Size = "small" | "medium" | "large" | "custom"
type WidthMode = "auto" | "fill"
type Intensity = "subtle" | "medium" | "high"
type ArrowDirection = "right" | "down" | "external"
type IconPosition = "left" | "right"
type TextTransform = "none" | "uppercase"
type FillDirection = "none" | "left" | "right" | "center" | "radial"
type TextAnimation = "none" | "slide"
type TextSizeMode = "auto" | "preset" | "custom"

type FontControlValue = {
    fontFamily?: string
    fontSize?: number | string
    fontWeight?: number | string
    fontStyle?: string
    lineHeight?: number | string
    letterSpacing?: number | string
}

type CSSVars = React.CSSProperties & {
    [key: string]: string | number | undefined
}

export interface PremiumAnimatedButtonProps {
    text: string
    href: string
    openInNewTab: boolean
    variant: Variant
    size: Size
    widthMode: WidthMode
    horizontalPadding: number
    verticalPadding: number
    borderRadius: number
    font: FontControlValue
    textSizeMode: TextSizeMode
    customTextSize: number
    autoTextScale: number
    minAutoTextSize: number
    maxAutoTextSize: number
    textColor: string
    backgroundColor: string
    hoverBackgroundColor: string
    borderColor: string
    hoverBorderColor: string
    accentColor: string
    gradientColor1: string
    gradientColor2: string
    glowColor: string
    showGlow: boolean
    glowIntensity: number
    showShine: boolean
    shineIntensity: number
    showAnimatedBorder: boolean
    showAnimatedArrow: boolean
    arrowDirection: ArrowDirection
    iconPosition: IconPosition
    leftIcon: string
    rightIcon: string
    loading: boolean
    loadingText: string
    disabled: boolean
    animationIntensity: Intensity
    hoverLiftAmount: number
    hoverScaleAmount: number
    pressScaleAmount: number
    transitionDuration: number
    fullWidth: boolean
    textTransform: TextTransform
    letterSpacing: number
    accessibilityLabel: string
    backgroundFill: FillDirection
    textAnimation: TextAnimation
    showCursorGlow: boolean
    cursorGlowIntensity: number
    onClick?: (event: React.MouseEvent<HTMLElement>) => void
}

const defaultFont: FontControlValue = {
    fontFamily: "Inter",
    fontWeight: 600,
}

const sizePresets: Record<
    Exclude<Size, "custom">,
    { x: number; y: number; fontSize: number; gap: number }
> = {
    small: { x: 18, y: 10, fontSize: 14, gap: 8 },
    medium: { x: 24, y: 14, fontSize: 15, gap: 9 },
    large: { x: 30, y: 17, fontSize: 17, gap: 10 },
}

const intensityScale: Record<Intensity, number> = {
    subtle: 0.75,
    medium: 1,
    high: 1.3,
}

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max)

const toNumber = (value: unknown, fallback: number) => {
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function useReducedMotion(isStatic: boolean) {
    const [prefersReducedMotion, setPrefersReducedMotion] =
        React.useState(false)

    React.useEffect(() => {
        if (
            isStatic ||
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        )
            return

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReducedMotion(mediaQuery.matches)
        update()

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", update)
            return () => mediaQuery.removeEventListener("change", update)
        }

        mediaQuery.addListener(update)
        return () => mediaQuery.removeListener(update)
    }, [isStatic])

    return prefersReducedMotion
}

function useTouchPointer(isStatic: boolean) {
    const [isTouchPointer, setIsTouchPointer] = React.useState(false)

    React.useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const mediaQuery =
            typeof window.matchMedia === "function"
                ? window.matchMedia("(pointer: coarse)")
                : undefined

        const update = () => {
            const hasTouchPoints =
                typeof navigator !== "undefined" &&
                typeof navigator.maxTouchPoints === "number" &&
                navigator.maxTouchPoints > 0

            setIsTouchPointer(Boolean(mediaQuery?.matches || hasTouchPoints))
        }

        update()

        if (!mediaQuery) return

        if (typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", update)
            return () => mediaQuery.removeEventListener("change", update)
        }

        mediaQuery.addListener(update)
        return () => mediaQuery.removeListener(update)
    }, [isStatic])

    return isTouchPointer
}

function useViewportVisibility(
    ref: React.RefObject<HTMLElement | null>,
    enabled: boolean
) {
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        if (!enabled) {
            setIsVisible(false)
            return
        }

        const element = ref.current
        if (!element) return

        if (
            typeof window === "undefined" ||
            typeof window.IntersectionObserver !== "function"
        ) {
            setIsVisible(true)
            return
        }

        const observer = new window.IntersectionObserver(
            ([entry]) => {
                setIsVisible(Boolean(entry?.isIntersecting))
            },
            { rootMargin: "200px 0px", threshold: 0 }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [enabled, ref])

    return isVisible
}

function ArrowIcon({ direction }: { direction: ArrowDirection }) {
    if (direction === "down") {
        return (
            <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M9 3.75v9.5" />
                <path d="m4.75 9.25 4.25 4.25 4.25-4.25" />
            </svg>
        )
    }

    if (direction === "external") {
        return (
            <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
                <path d="M6 5h7v7" />
                <path d="M13 5 5 13" />
            </svg>
        )
    }

    return (
        <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <path d="M3.75 9h10" />
            <path d="m9.75 4.75 4.25 4.25-4.25 4.25" />
        </svg>
    )
}

function Spinner() {
    return (
        <svg
            className="premiumButtonSpinner"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="10" cy="10" r="7.25" />
        </svg>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 220
 * @framerIntrinsicHeight 56
 */
export function PremiumAnimatedButton(
    props: Partial<PremiumAnimatedButtonProps>
) {
    const {
        text = "Let’s Talk",
        href = "",
        openInNewTab = false,
        variant = "gradient",
        size = "medium",
        widthMode = "auto",
        horizontalPadding = 24,
        verticalPadding = 14,
        borderRadius = 999,
        font = defaultFont,
        textSizeMode = "auto",
        customTextSize = 18,
        autoTextScale = 0.32,
        minAutoTextSize = 12,
        maxAutoTextSize = 140,
        textColor = "#FFFFFF",
        backgroundColor = "#090D0B",
        hoverBackgroundColor = "#101915",
        borderColor = "rgba(255, 255, 255, 0.16)",
        hoverBorderColor = "rgba(255, 255, 255, 0.42)",
        accentColor = "#39E89C",
        gradientColor1 = "#0EA66D",
        gradientColor2 = "#F1FFF8",
        glowColor = "rgba(57, 232, 156, 0.32)",
        showGlow = true,
        glowIntensity = 0.95,
        showShine = true,
        shineIntensity = 0.42,
        showAnimatedBorder = true,
        showAnimatedArrow = true,
        arrowDirection = "right",
        iconPosition = "right",
        leftIcon = "",
        rightIcon = "",
        loading = false,
        loadingText = "Loading",
        disabled = false,
        animationIntensity = "medium",
        hoverLiftAmount = 2,
        hoverScaleAmount = 1.025,
        pressScaleAmount = 0.975,
        transitionDuration = 420,
        fullWidth = false,
        textTransform = "none",
        letterSpacing = 0,
        accessibilityLabel = "",
        backgroundFill = "none",
        textAnimation = "slide",
        showCursorGlow = true,
        cursorGlowIntensity = 0.16,
        onClick,
    } = props

    const isStatic =
        typeof useIsStaticRenderer === "function"
            ? useIsStaticRenderer()
            : false
    const prefersReducedMotion = useReducedMotion(isStatic)
    const isTouchPointer = useTouchPointer(isStatic)
    const rawId = React.useId()
    const scope = React.useMemo(
        () => `premiumButtonScope${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`,
        [rawId]
    )
    const buttonRef = React.useRef<HTMLElement | null>(null)
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const frameRef = React.useRef<number | null>(null)
    const pointerRef = React.useRef({
        x: "50%",
        y: "50%",
        tx: "0px",
        ty: "0px",
    })
    const [isPressed, setIsPressed] = React.useState(false)
    const [frameSize, setFrameSize] = React.useState({ width: 220, height: 56 })
    const setButtonRef = React.useCallback((node: HTMLElement | null) => {
        buttonRef.current = node
    }, [])

    const blocked = disabled || loading
    const isInViewport = useViewportVisibility(rootRef, !isStatic)
    const canAnimate = !isStatic && !prefersReducedMotion && isInViewport
    const canUseInteractiveMotion = canAnimate && !blocked
    const canTrackPointer =
        canUseInteractiveMotion &&
        !isTouchPointer &&
        (variant === "magnetic" || showCursorGlow)
    const cleanHref = typeof href === "string" ? href.trim() : ""
    const isLink = cleanHref.length > 0
    const hasCustomIcon = Boolean(leftIcon || rightIcon)
    const shouldShowArrow = !loading && showAnimatedArrow && !hasCustomIcon
    const label = loading ? loadingText || text : text
    const accessibleLabel =
        typeof accessibilityLabel === "string" ? accessibilityLabel.trim() : ""
    const labelText = typeof label === "string" ? label.trim() : ""
    const fallbackAccessibleName = labelText ? undefined : "Button"
    const reserveLabel = [text, loadingText].reduce(
        (longest, item) => (item.length > longest.length ? item : longest),
        ""
    )
    const selectedSize = size === "custom" ? undefined : sizePresets[size]
    const paddingX = selectedSize
        ? selectedSize.x
        : toNumber(horizontalPadding, 24)
    const paddingY = selectedSize
        ? selectedSize.y
        : toNumber(verticalPadding, 14)
    const presetFontSize = selectedSize ? selectedSize.fontSize : 15
    const hasVisibleIcon =
        shouldShowArrow || Boolean(leftIcon || rightIcon) || loading
    const labelFitUnits = Math.max(
        6,
        reserveLabel.length * 0.62 + (hasVisibleIcon ? 3.1 : 0)
    )
    const normalizedMinAutoTextSize = clamp(
        toNumber(minAutoTextSize, 12),
        6,
        240
    )
    const normalizedMaxAutoTextSize = Math.max(
        normalizedMinAutoTextSize,
        clamp(toNumber(maxAutoTextSize, 140), 8, 320)
    )
    const autoHeightSize =
        frameSize.height * clamp(toNumber(autoTextScale, 0.32), 0.08, 0.75)
    const autoWidthSize = frameSize.width / labelFitUnits
    const autoFontSize = clamp(
        Math.min(autoHeightSize, autoWidthSize),
        normalizedMinAutoTextSize,
        normalizedMaxAutoTextSize
    )
    const fontSize =
        textSizeMode === "auto"
            ? autoFontSize
            : textSizeMode === "custom"
              ? clamp(toNumber(customTextSize, 18), 6, 320)
              : presetFontSize
    const contentGap =
        textSizeMode === "preset"
            ? selectedSize
                ? selectedSize.gap
                : 9
            : clamp(fontSize * 0.58, 6, 56)
    const motionScale = intensityScale[animationIntensity] ?? 1
    const hoverLift = clamp(toNumber(hoverLiftAmount, 2) * motionScale, 0, 12)
    const hoverScale = clamp(toNumber(hoverScaleAmount, 1.025), 1, 1.08)
    const surfaceScale = clamp(1 + (hoverScale - 1) * 2.2, 1, 1.14)
    const contentScale = clamp(1 + (hoverScale - 1) * 0.8, 1, 1.06)
    const pressScale = clamp(toNumber(pressScaleAmount, 0.975), 0.9, 1)
    const duration = clamp(toNumber(transitionDuration, 420), 180, 1200)
    const hoverDuration = clamp(duration * 1.18, 240, 1200)
    const textDuration = clamp(duration * 1.45, 320, 1400)
    const arrowDuration = clamp(duration * 1.25, 260, 1200)
    const normalizedGlow = clamp(toNumber(glowIntensity, 0.8), 0, 1.5)
    const normalizedShine = clamp(toNumber(shineIntensity, 0.55), 0, 1)
    const normalizedCursorGlow = clamp(
        toNumber(cursorGlowIntensity, 0.28),
        0,
        1
    )
    const buttonFillsWidth = fullWidth || widthMode === "fill"
    const fillOpacity =
        variant === "ghost"
            ? 0.18
            : variant === "glass"
              ? 0.12
              : variant === "gradient"
                ? 0.06
                : 0.22

    React.useEffect(() => {
        return () => {
            if (
                frameRef.current !== null &&
                typeof window !== "undefined" &&
                typeof window.cancelAnimationFrame === "function"
            ) {
                window.cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [])

    React.useEffect(() => {
        const element = buttonRef.current
        if (
            !element ||
            typeof window === "undefined" ||
            typeof window.ResizeObserver !== "function"
        )
            return

        const updateFrameSize = (width: number, height: number) => {
            if (!width || !height) return

            const nextWidth = Math.round(width)
            const nextHeight = Math.round(height)

            setFrameSize((current) =>
                current.width === nextWidth && current.height === nextHeight
                    ? current
                    : { width: nextWidth, height: nextHeight }
            )
        }

        const rect = element.getBoundingClientRect()
        updateFrameSize(rect.width, rect.height)

        const observer = new window.ResizeObserver((entries) => {
            const entry = entries[0]
            if (!entry) return

            updateFrameSize(entry.contentRect.width, entry.contentRect.height)
        })

        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const resetPointerPosition = React.useCallback(() => {
        const element = buttonRef.current
        if (!element) return

        if (
            frameRef.current !== null &&
            typeof window !== "undefined" &&
            typeof window.cancelAnimationFrame === "function"
        ) {
            window.cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }

        element.style.setProperty("--pb-cursor-x", "50%")
        element.style.setProperty("--pb-cursor-y", "50%")
        element.style.setProperty("--pb-magnetic-x", "0px")
        element.style.setProperty("--pb-magnetic-y", "0px")
    }, [])

    React.useEffect(() => {
        if (isInViewport) return
        setIsPressed(false)
        resetPointerPosition()
    }, [isInViewport, resetPointerPosition])

    const handlePointerMove = React.useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            if (!canTrackPointer || typeof window === "undefined") return

            const element = buttonRef.current || event.currentTarget
            const rect = element.getBoundingClientRect()
            if (!rect.width || !rect.height) return

            const x = clamp(event.clientX - rect.left, 0, rect.width)
            const y = clamp(event.clientY - rect.top, 0, rect.height)
            const normalizedX = x / rect.width - 0.5
            const normalizedY = y / rect.height - 0.5
            const maxTravel = variant === "magnetic" ? 13 * motionScale : 0

            pointerRef.current = {
                x: `${x}px`,
                y: `${y}px`,
                tx: `${clamp(normalizedX * maxTravel, -16, 16)}px`,
                ty: `${clamp(normalizedY * maxTravel, -16, 16)}px`,
            }

            if (typeof window.requestAnimationFrame !== "function") {
                const latest = pointerRef.current
                element.style.setProperty("--pb-cursor-x", latest.x)
                element.style.setProperty("--pb-cursor-y", latest.y)
                element.style.setProperty("--pb-magnetic-x", latest.tx)
                element.style.setProperty("--pb-magnetic-y", latest.ty)
                return
            }

            if (frameRef.current !== null) return

            frameRef.current = window.requestAnimationFrame(() => {
                frameRef.current = null
                const latest = pointerRef.current
                element.style.setProperty("--pb-cursor-x", latest.x)
                element.style.setProperty("--pb-cursor-y", latest.y)
                element.style.setProperty("--pb-magnetic-x", latest.tx)
                element.style.setProperty("--pb-magnetic-y", latest.ty)
            })
        },
        [canTrackPointer, motionScale, variant]
    )

    const handlePointerDown = React.useCallback(() => {
        if (canUseInteractiveMotion) setIsPressed(true)
    }, [canUseInteractiveMotion])

    const handlePointerUp = React.useCallback(() => {
        setIsPressed(false)
    }, [])

    const handlePointerLeave = React.useCallback(() => {
        setIsPressed(false)
        resetPointerPosition()
    }, [resetPointerPosition])

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            if (!canUseInteractiveMotion) return
            if (event.key === "Enter" || event.key === " ") setIsPressed(true)
        },
        [canUseInteractiveMotion]
    )

    const handleKeyUp = React.useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            if (event.key === "Enter" || event.key === " ") setIsPressed(false)
        },
        []
    )

    const handleClick = React.useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            if (blocked) {
                event.preventDefault()
                event.stopPropagation()
                return
            }

            onClick?.(event)
        },
        [blocked, onClick]
    )

    const rootStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
    }

    const buttonStyle: CSSVars = {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        minHeight: 0,
        "--pb-radius": `${Math.max(0, toNumber(borderRadius, 999))}px`,
        "--pb-padding-x": `${Math.max(0, paddingX)}px`,
        "--pb-padding-y": `${Math.max(0, paddingY)}px`,
        "--pb-font-size": `${Math.max(1, fontSize)}px`,
        "--pb-gap": `${Math.max(0, contentGap)}px`,
        "--pb-text": textColor,
        "--pb-bg": backgroundColor,
        "--pb-hover-bg": hoverBackgroundColor,
        "--pb-border": borderColor,
        "--pb-hover-border": hoverBorderColor,
        "--pb-edge-color": showAnimatedBorder ? borderColor : "transparent",
        "--pb-hover-edge-color": showAnimatedBorder
            ? hoverBorderColor
            : borderColor,
        "--pb-accent": accentColor,
        "--pb-gradient-one": gradientColor1,
        "--pb-gradient-two": gradientColor2,
        "--pb-glow": glowColor,
        "--pb-glow-size": `${Math.round(42 * normalizedGlow)}px`,
        "--pb-glow-spread": `${Math.round(8 * normalizedGlow)}px`,
        "--pb-shine-alpha": normalizedShine,
        "--pb-cursor-alpha": normalizedCursorGlow,
        "--pb-fill-opacity": fillOpacity,
        "--pb-hover-lift": `${hoverLift}px`,
        "--pb-hover-scale": hoverScale,
        "--pb-surface-scale": surfaceScale,
        "--pb-content-scale": contentScale,
        "--pb-press-scale": pressScale,
        "--pb-duration": `${duration}ms`,
        "--pb-hover-duration": `${hoverDuration}ms`,
        "--pb-text-duration": `${textDuration}ms`,
        "--pb-arrow-duration": `${arrowDuration}ms`,
        "--pb-shine-duration": `${clamp(900 / Math.max(motionScale, 0.5), 700, 1200)}ms`,
        "--pb-cursor-x": "50%",
        "--pb-cursor-y": "50%",
        "--pb-magnetic-x": "0px",
        "--pb-magnetic-y": "0px",
        fontFamily: font?.fontFamily || defaultFont.fontFamily,
        fontWeight: font?.fontWeight || defaultFont.fontWeight,
        fontStyle: font?.fontStyle,
        lineHeight: 1,
        letterSpacing: `${toNumber(letterSpacing, 0)}px`,
        textTransform: textTransform === "uppercase" ? "uppercase" : "none",
    }

    const buttonContent = (
        <>
            <span className="premiumButtonSurface" aria-hidden="true" />
            <span className="premiumButtonFill" aria-hidden="true" />
            <span className="premiumButtonCursor" aria-hidden="true" />
            <span className="premiumButtonPress" aria-hidden="true" />
            <span className="premiumButtonShine" aria-hidden="true" />
            <span className="premiumButtonContent">
                {loading && iconPosition === "left" && (
                    <span className="premiumButtonIcon" aria-hidden="true">
                        <Spinner />
                    </span>
                )}
                {!loading && leftIcon && (
                    <span
                        className="premiumButtonIcon premiumButtonCustomIcon"
                        aria-hidden="true"
                    >
                        {leftIcon}
                    </span>
                )}
                {shouldShowArrow && iconPosition === "left" && (
                    <span
                        className="premiumButtonIcon premiumButtonArrow"
                        data-arrow={arrowDirection}
                        aria-hidden="true"
                    >
                        <ArrowIcon direction={arrowDirection} />
                    </span>
                )}
                <span className="premiumButtonTextWrap">
                    <span className="premiumButtonTextSizer" aria-hidden="true">
                        {reserveLabel}
                    </span>
                    <span className="premiumButtonTextPrimary">{label}</span>
                    <span
                        className="premiumButtonTextDuplicate"
                        aria-hidden="true"
                    >
                        {label}
                    </span>
                </span>
                {shouldShowArrow && iconPosition === "right" && (
                    <span
                        className="premiumButtonIcon premiumButtonArrow"
                        data-arrow={arrowDirection}
                        aria-hidden="true"
                    >
                        <ArrowIcon direction={arrowDirection} />
                    </span>
                )}
                {!loading && rightIcon && (
                    <span
                        className="premiumButtonIcon premiumButtonCustomIcon"
                        aria-hidden="true"
                    >
                        {rightIcon}
                    </span>
                )}
                {loading && iconPosition === "right" && (
                    <span className="premiumButtonIcon" aria-hidden="true">
                        <Spinner />
                    </span>
                )}
            </span>
        </>
    )

    const sharedProps = {
        ref: setButtonRef,
        className: "premiumButtonControl",
        style: buttonStyle,
        "aria-label": accessibleLabel || fallbackAccessibleName,
        "aria-busy": loading || undefined,
        "aria-disabled": blocked || undefined,
        "data-variant": variant,
        "data-animate": canAnimate ? "true" : "false",
        "data-disabled": blocked ? "true" : "false",
        "data-pressed": isPressed ? "true" : "false",
        "data-glow": showGlow ? "true" : "false",
        "data-shine": canAnimate && showShine ? "true" : "false",
        "data-border": showAnimatedBorder ? "true" : "false",
        "data-cursor": canTrackPointer && showCursorGlow ? "true" : "false",
        "data-fill": backgroundFill,
        "data-width": buttonFillsWidth ? "fill" : "auto",
        "data-text-slide":
            canUseInteractiveMotion && textAnimation === "slide"
                ? "true"
                : "false",
        "data-icon-position": iconPosition,
        onPointerMove: handlePointerMove,
        onPointerDown: handlePointerDown,
        onPointerUp: handlePointerUp,
        onPointerCancel: handlePointerUp,
        onPointerLeave: handlePointerLeave,
        onKeyDown: handleKeyDown,
        onKeyUp: handleKeyUp,
        onBlur: handlePointerLeave,
        onClick: handleClick,
    }

    return (
        <div
            ref={rootRef}
            className={`${scope} premiumButtonRoot`}
            style={rootStyle}
        >
            <style>{`
                .${scope}.premiumButtonRoot,
                .${scope} .premiumButtonControl,
                .${scope} .premiumButtonControl * {
                    box-sizing: border-box;
                }

                .${scope} .premiumButtonControl {
                    appearance: none;
                    -webkit-appearance: none;
                    position: relative;
                    isolation: isolate;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 0;
                    border: 1px solid var(--pb-border);
                    border-radius: var(--pb-radius);
                    padding: var(--pb-padding-y) var(--pb-padding-x);
                    color: var(--pb-text);
                    font: inherit;
                    font-size: var(--pb-font-size);
                    line-height: 1;
                    text-decoration: none;
                    white-space: nowrap;
                    cursor: pointer;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    overflow: hidden;
                    outline: none;
                    background: transparent;
                    background-clip: border-box;
                    transform: translate3d(0, 0, 0) scale(1);
                    box-shadow: none;
                    will-change: transform;
                    transition:
                        transform var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        border-color var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        box-shadow var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        background-position var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        opacity 160ms ease;
                }

                .${scope} .premiumButtonControl[data-variant="outline"] {
                    background: transparent;
                }

                .${scope} .premiumButtonControl[data-variant="ghost"] {
                    background: transparent;
                    border-color: transparent;
                }

                .${scope} .premiumButtonControl[data-variant="glass"] {
                    backdrop-filter: blur(16px) saturate(145%);
                    -webkit-backdrop-filter: blur(16px) saturate(145%);
                }

                .${scope} .premiumButtonControl[data-variant="gradient"],
                .${scope} .premiumButtonControl[data-variant="magnetic"] {
                    border-color: transparent;
                    box-shadow: inset 0 0 0 1px var(--pb-edge-color);
                }

                .${scope} .premiumButtonControl[data-glow="true"] {
                    box-shadow:
                        0 12px 30px -26px var(--pb-glow),
                        inset 0 0 0 1px var(--pb-edge-color),
                        inset 0 1px 0 rgba(255, 255, 255, 0.12);
                }

                .${scope} .premiumButtonControl[data-disabled="true"] {
                    opacity: 0.52;
                    cursor: not-allowed;
                }

                .${scope} .premiumButtonControl:focus-visible {
                    outline: 2px solid var(--pb-accent);
                    outline-offset: 3px;
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover {
                    border-color: var(--pb-hover-border);
                    transform: translate3d(0, calc(var(--pb-hover-lift) * -1), 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="gradient"],
                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="magnetic"] {
                    border-color: transparent;
                    box-shadow: inset 0 0 0 1px var(--pb-hover-edge-color);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-glow="true"]:not([data-disabled="true"]):hover {
                    box-shadow:
                        0 18px var(--pb-glow-size) calc(var(--pb-glow-spread) - 2px) var(--pb-glow),
                        0 2px 18px -14px var(--pb-gradient-two),
                        inset 0 0 0 1px var(--pb-hover-edge-color),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-pressed="true"],
                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):active {
                    transform: translate3d(0, 0, 0) scale(var(--pb-press-scale));
                    box-shadow:
                        0 10px 24px -16px var(--pb-glow),
                        inset 0 0 0 1px var(--pb-hover-edge-color),
                        inset 0 1px 8px rgba(0, 0, 0, 0.18);
                    transition:
                        transform 110ms cubic-bezier(0.23, 1, 0.32, 1),
                        box-shadow 110ms cubic-bezier(0.23, 1, 0.32, 1);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="gradient"],
                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="magnetic"] {
                    background-position: 0% 50%;
                }

                .${scope} .premiumButtonSurface,
                .${scope} .premiumButtonFill,
                .${scope} .premiumButtonCursor,
                .${scope} .premiumButtonPress,
                .${scope} .premiumButtonShine {
                    position: absolute;
                    pointer-events: none;
                    border-radius: inherit;
                }

                .${scope} .premiumButtonSurface {
                    inset: 0;
                    z-index: 0;
                    background: var(--pb-bg);
                    background-repeat: no-repeat;
                    background-size: 100% 100%;
                    background-position: 50% 50%;
                    transform: scale(1);
                    transition:
                        transform var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        background-position var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-variant="outline"] .premiumButtonSurface,
                .${scope} .premiumButtonControl[data-variant="ghost"] .premiumButtonSurface {
                    background: transparent;
                }

                .${scope} .premiumButtonControl[data-variant="gradient"] .premiumButtonSurface,
                .${scope} .premiumButtonControl[data-variant="magnetic"] .premiumButtonSurface {
                    background:
                        linear-gradient(135deg, var(--pb-bg) -24%, var(--pb-gradient-one) 58%, var(--pb-gradient-two) 154%);
                    background-size: 220% 220%;
                    background-position: 0% 50%;
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonSurface {
                    transform: scale(var(--pb-surface-scale));
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="gradient"] .premiumButtonSurface,
                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover[data-variant="magnetic"] .premiumButtonSurface {
                    background-position: 88% 50%;
                }

                .${scope} .premiumButtonFill {
                    inset: 0;
                    z-index: 1;
                    background:
                        linear-gradient(135deg, var(--pb-hover-bg), var(--pb-gradient-one));
                    opacity: 0;
                    transition:
                        opacity var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        transform var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-variant="gradient"] .premiumButtonFill,
                .${scope} .premiumButtonControl[data-variant="magnetic"] .premiumButtonFill {
                    background:
                        linear-gradient(135deg, var(--pb-gradient-one), var(--pb-gradient-two));
                }

                .${scope} .premiumButtonControl[data-fill="none"] .premiumButtonFill {
                    display: none;
                }

                .${scope} .premiumButtonControl[data-fill="left"] .premiumButtonFill {
                    transform: scaleX(0);
                    transform-origin: left center;
                }

                .${scope} .premiumButtonControl[data-fill="right"] .premiumButtonFill {
                    transform: scaleX(0);
                    transform-origin: right center;
                }

                .${scope} .premiumButtonControl[data-fill="center"] .premiumButtonFill {
                    transform: scaleX(0);
                    transform-origin: center center;
                }

                .${scope} .premiumButtonControl[data-fill="radial"] .premiumButtonFill {
                    inset: -85%;
                    border-radius: 999px;
                    transform: scale(0);
                    transform-origin: center center;
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonFill {
                    opacity: var(--pb-fill-opacity);
                    transform: scaleX(1);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-fill="radial"]:not([data-disabled="true"]):hover .premiumButtonFill {
                    transform: scale(1);
                }

                .${scope} .premiumButtonCursor {
                    inset: 0;
                    z-index: 2;
                    opacity: 0;
                    background:
                        radial-gradient(circle at var(--pb-cursor-x) var(--pb-cursor-y), rgba(255, 255, 255, 0.18), transparent 15%),
                        radial-gradient(circle at var(--pb-cursor-x) var(--pb-cursor-y), var(--pb-glow), transparent 38%);
                    transition:
                        opacity var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        transform var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-cursor="true"]:not([data-disabled="true"]):hover .premiumButtonCursor {
                    opacity: var(--pb-cursor-alpha);
                    transform: scale(1.04);
                }

                .${scope} .premiumButtonPress {
                    inset: -45%;
                    z-index: 3;
                    opacity: 0;
                    transform: scale(0.2);
                    background:
                        radial-gradient(circle at var(--pb-cursor-x) var(--pb-cursor-y), rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.16) 14%, transparent 34%);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-pressed="true"]:not([data-disabled="true"]) .premiumButtonPress {
                    animation: ${scope}Press 360ms cubic-bezier(0.23, 1, 0.32, 1) both;
                }

                .${scope} .premiumButtonShine {
                    top: -70%;
                    bottom: -70%;
                    left: -54%;
                    z-index: 3;
                    width: 32%;
                    opacity: 0;
                    transform: translate3d(-120%, 0, 0) rotate(18deg);
                    background:
                        linear-gradient(90deg, transparent, rgba(255, 255, 255, var(--pb-shine-alpha)), transparent);
                    filter: blur(0.2px);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-shine="true"]:not([data-disabled="true"]):hover .premiumButtonShine {
                    animation: ${scope}Shine var(--pb-shine-duration) cubic-bezier(0.23, 1, 0.32, 1) both;
                }

                .${scope} .premiumButtonContent {
                    position: relative;
                    z-index: 4;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--pb-gap);
                    max-width: 100%;
                    min-width: 0;
                    transform: translate3d(var(--pb-magnetic-x), var(--pb-magnetic-y), 0);
                    transition: transform var(--pb-hover-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonContent {
                    transform: translate3d(var(--pb-magnetic-x), var(--pb-magnetic-y), 0) scale(var(--pb-content-scale));
                }

                .${scope} .premiumButtonTextWrap {
                    position: relative;
                    display: inline-grid;
                    align-items: center;
                    justify-items: center;
                    overflow: hidden;
                    max-width: 100%;
                    min-width: 0;
                    line-height: 1;
                }

                .${scope} .premiumButtonTextSizer,
                .${scope} .premiumButtonTextPrimary,
                .${scope} .premiumButtonTextDuplicate {
                    grid-area: 1 / 1;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .${scope} .premiumButtonTextSizer {
                    visibility: hidden;
                }

                .${scope} .premiumButtonTextPrimary,
                .${scope} .premiumButtonTextDuplicate {
                    transition:
                        transform var(--pb-text-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        opacity var(--pb-text-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonTextDuplicate {
                    opacity: 0;
                    transform: translate3d(0, 105%, 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-text-slide="true"]:not([data-disabled="true"]):hover .premiumButtonTextPrimary {
                    opacity: 0;
                    transform: translate3d(0, -105%, 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-text-slide="true"]:not([data-disabled="true"]):hover .premiumButtonTextDuplicate {
                    opacity: 1;
                    transform: translate3d(0, 0, 0);
                }

                .${scope} .premiumButtonIcon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    width: 1.08em;
                    height: 1.08em;
                    line-height: 1;
                }

                .${scope} .premiumButtonArrow {
                    width: 1.46em;
                    height: 1.46em;
                    margin-right: -0.22em;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.1);
                    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
                    transform: translate3d(0, 0, 0) scale(0.94);
                    transition:
                        background var(--pb-arrow-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        box-shadow var(--pb-arrow-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        transform var(--pb-arrow-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-icon-position="left"] .premiumButtonArrow {
                    margin-left: -0.22em;
                    margin-right: 0;
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonArrow {
                    background: rgba(255, 255, 255, 0.18);
                    box-shadow:
                        inset 0 0 0 1px rgba(255, 255, 255, 0.22),
                        0 4px 14px -10px var(--pb-gradient-two);
                    transform: translate3d(0.08em, 0, 0) scale(1);
                }

                .${scope} .premiumButtonControl[data-animate="true"][data-icon-position="left"]:not([data-disabled="true"]):hover .premiumButtonArrow {
                    transform: translate3d(-0.08em, 0, 0) scale(1);
                }

                .${scope} .premiumButtonCustomIcon {
                    font-size: 0.98em;
                }

                .${scope} .premiumButtonIcon svg {
                    display: block;
                    width: 100%;
                    height: 100%;
                    overflow: visible;
                }

                .${scope} .premiumButtonArrow svg {
                    stroke: currentColor;
                    stroke-width: 1.65;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    fill: none;
                    opacity: 0.92;
                    transform: translate3d(-0.08em, 0, 0);
                    transition:
                        transform var(--pb-arrow-duration) cubic-bezier(0.19, 1, 0.22, 1),
                        opacity var(--pb-arrow-duration) cubic-bezier(0.19, 1, 0.22, 1);
                }

                .${scope} .premiumButtonControl[data-icon-position="left"] .premiumButtonArrow svg {
                    transform: translate3d(0.08em, 0, 0);
                }

                .${scope} .premiumButtonArrow[data-arrow="down"] svg {
                    transform: translate3d(0, -0.08em, 0);
                }

                .${scope} .premiumButtonArrow[data-arrow="external"] svg {
                    transform: translate3d(-0.06em, 0.06em, 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonArrow[data-arrow="right"] svg {
                    opacity: 1;
                    transform: translate3d(0.13em, 0, 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonArrow[data-arrow="down"] svg {
                    opacity: 1;
                    transform: translate3d(0, 0.13em, 0);
                }

                .${scope} .premiumButtonControl[data-animate="true"]:not([data-disabled="true"]):hover .premiumButtonArrow[data-arrow="external"] svg {
                    opacity: 1;
                    transform: translate3d(0.11em, -0.11em, 0);
                }

                .${scope} .premiumButtonSpinner {
                    stroke: currentColor;
                    stroke-width: 2;
                    stroke-linecap: round;
                    fill: none;
                    stroke-dasharray: 34 50;
                    transform-origin: center;
                    opacity: 0.92;
                }

                .${scope} .premiumButtonControl[data-animate="true"] .premiumButtonSpinner {
                    animation: ${scope}Spin 850ms linear infinite;
                }

                @keyframes ${scope}Shine {
                    0% {
                        opacity: 0;
                        transform: translate3d(-130%, 0, 0) rotate(18deg);
                    }
                    15% {
                        opacity: 1;
                    }
                    100% {
                        opacity: 0;
                        transform: translate3d(365%, 0, 0) rotate(18deg);
                    }
                }

                @keyframes ${scope}Press {
                    0% {
                        opacity: 0.72;
                        transform: scale(0.18);
                    }
                    100% {
                        opacity: 0;
                        transform: scale(1);
                    }
                }

                @keyframes ${scope}Spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    .${scope} .premiumButtonControl,
                    .${scope} .premiumButtonControl *,
                    .${scope} .premiumButtonControl::before,
                    .${scope} .premiumButtonControl::after {
                        animation: none !important;
                        transition-duration: 1ms !important;
                    }
                }
            `}</style>
            {isLink ? (
                <a
                    {...sharedProps}
                    href={blocked ? undefined : cleanHref}
                    target={openInNewTab ? "_blank" : undefined}
                    rel={openInNewTab ? "noopener noreferrer" : undefined}
                    tabIndex={blocked ? -1 : undefined}
                >
                    {buttonContent}
                </a>
            ) : (
                <button {...sharedProps} type="button" disabled={blocked}>
                    {buttonContent}
                </button>
            )}
        </div>
    )
}

PremiumAnimatedButton.displayName = "PremiumAnimatedButton"

addPropertyControls(PremiumAnimatedButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Let’s Talk",
    },
    href: {
        type: ControlType.String,
        title: "Href",
        defaultValue: "",
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
        hidden: (props) => !props.href,
    },
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        defaultValue: "gradient",
        options: ["solid", "outline", "ghost", "glass", "gradient", "magnetic"],
        optionTitles: [
            "Solid",
            "Outline",
            "Ghost",
            "Glass",
            "Gradient",
            "Magnetic",
        ],
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        defaultValue: "medium",
        options: ["small", "medium", "large", "custom"],
        optionTitles: ["Small", "Medium", "Large", "Custom"],
        displaySegmentedControl: true,
    },
    widthMode: {
        type: ControlType.Enum,
        title: "Width",
        defaultValue: "auto",
        options: ["auto", "fill"],
        optionTitles: ["Auto", "Fill"],
        displaySegmentedControl: true,
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Full Width",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    horizontalPadding: {
        type: ControlType.Number,
        title: "Pad X",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        hidden: (props) => props.size !== "custom",
    },
    verticalPadding: {
        type: ControlType.Number,
        title: "Pad Y",
        defaultValue: 14,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (props) => props.size !== "custom",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
    },
    font: {
        // @ts-ignore
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        displayFontSize: false,
        displayTextAlignment: false,
        defaultFontType: "sans-serif",
        defaultValue: defaultFont,
    },
    textSizeMode: {
        type: ControlType.Enum,
        title: "Text Size",
        defaultValue: "auto",
        options: ["auto", "preset", "custom"],
        optionTitles: ["Auto", "Preset", "Custom"],
        displaySegmentedControl: true,
    },
    customTextSize: {
        type: ControlType.Number,
        title: "Text px",
        defaultValue: 18,
        min: 6,
        max: 320,
        step: 1,
        unit: "px",
        hidden: (props) => (props.textSizeMode || "auto") !== "custom",
    },
    autoTextScale: {
        type: ControlType.Number,
        title: "Auto Scale",
        defaultValue: 0.32,
        min: 0.08,
        max: 0.75,
        step: 0.01,
        hidden: (props) => (props.textSizeMode || "auto") !== "auto",
    },
    minAutoTextSize: {
        type: ControlType.Number,
        title: "Min Text",
        defaultValue: 12,
        min: 6,
        max: 240,
        step: 1,
        unit: "px",
        hidden: (props) => (props.textSizeMode || "auto") !== "auto",
    },
    maxAutoTextSize: {
        type: ControlType.Number,
        title: "Max Text",
        defaultValue: 140,
        min: 8,
        max: 320,
        step: 1,
        unit: "px",
        hidden: (props) => (props.textSizeMode || "auto") !== "auto",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Bg",
        defaultValue: "#090D0B",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Bg",
        defaultValue: "#101915",
        hidden: (props) => props.backgroundFill === "none",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.16)",
        hidden: (props) => props.variant === "ghost",
    },
    hoverBorderColor: {
        type: ControlType.Color,
        title: "Hover Border",
        defaultValue: "rgba(255, 255, 255, 0.42)",
        hidden: (props) => props.variant === "ghost",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#39E89C",
    },
    gradientColor1: {
        type: ControlType.Color,
        title: "Gradient 1",
        defaultValue: "#0EA66D",
        hidden: (props) =>
            props.variant !== "gradient" && props.variant !== "magnetic",
    },
    gradientColor2: {
        type: ControlType.Color,
        title: "Gradient 2",
        defaultValue: "#F1FFF8",
        hidden: (props) =>
            props.variant !== "gradient" && props.variant !== "magnetic",
    },
    showGlow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "rgba(57, 232, 156, 0.32)",
        hidden: (props) => !props.showGlow,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Amt",
        defaultValue: 0.95,
        min: 0,
        max: 1.5,
        step: 0.05,
        hidden: (props) => !props.showGlow,
    },
    showShine: {
        type: ControlType.Boolean,
        title: "Shine",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    shineIntensity: {
        type: ControlType.Number,
        title: "Shine Amt",
        defaultValue: 0.42,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.showShine,
    },
    showAnimatedBorder: {
        type: ControlType.Boolean,
        title: "Border FX",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (props) => props.variant === "ghost",
    },
    backgroundFill: {
        type: ControlType.Enum,
        title: "Fill FX",
        defaultValue: "none",
        options: ["none", "left", "right", "center", "radial"],
        optionTitles: ["None", "Left", "Right", "Center", "Radial"],
    },
    textAnimation: {
        type: ControlType.Enum,
        title: "Text FX",
        defaultValue: "slide",
        options: ["none", "slide"],
        optionTitles: ["None", "Slide"],
        displaySegmentedControl: true,
    },
    showCursorGlow: {
        type: ControlType.Boolean,
        title: "Cursor Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cursorGlowIntensity: {
        type: ControlType.Number,
        title: "Cursor Amt",
        defaultValue: 0.16,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (props) => !props.showCursorGlow,
    },
    leftIcon: {
        type: ControlType.String,
        title: "Left Text Icon",
        defaultValue: "",
        placeholder: "Text or emoji only",
        description:
            "Renders plain text or emoji, not a full SVG/icon picker input.",
    },
    rightIcon: {
        type: ControlType.String,
        title: "Right Text Icon",
        defaultValue: "",
        placeholder: "Text or emoji only",
        description:
            "Renders plain text or emoji, not a full SVG/icon picker input.",
    },
    showAnimatedArrow: {
        type: ControlType.Boolean,
        title: "Arrow",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
        hidden: (props) => Boolean(props.leftIcon || props.rightIcon),
    },
    arrowDirection: {
        type: ControlType.Enum,
        title: "Arrow Dir",
        defaultValue: "right",
        options: ["right", "down", "external"],
        optionTitles: ["Right", "Down", "External"],
        displaySegmentedControl: true,
        hidden: (props) =>
            !props.showAnimatedArrow ||
            Boolean(props.leftIcon || props.rightIcon),
    },
    iconPosition: {
        type: ControlType.Enum,
        title: "Icon Pos",
        defaultValue: "right",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        displaySegmentedControl: true,
    },
    loading: {
        type: ControlType.Boolean,
        title: "Loading",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    loadingText: {
        type: ControlType.String,
        title: "Loading Text",
        defaultValue: "Loading",
        hidden: (props) => !props.loading,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    animationIntensity: {
        type: ControlType.Enum,
        title: "Intensity",
        defaultValue: "medium",
        options: ["subtle", "medium", "high"],
        optionTitles: ["Subtle", "Medium", "High"],
        displaySegmentedControl: true,
    },
    hoverLiftAmount: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    hoverScaleAmount: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1.025,
        min: 1,
        max: 1.08,
        step: 0.005,
    },
    pressScaleAmount: {
        type: ControlType.Number,
        title: "Press Scale",
        defaultValue: 0.975,
        min: 0.9,
        max: 1,
        step: 0.005,
    },
    transitionDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 420,
        min: 180,
        max: 1200,
        step: 10,
        unit: "ms",
    },
    textTransform: {
        type: ControlType.Enum,
        title: "Transform",
        defaultValue: "none",
        options: ["none", "uppercase"],
        optionTitles: ["None", "Uppercase"],
        displaySegmentedControl: true,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0,
        min: 0,
        max: 5,
        step: 0.1,
        unit: "px",
    },
    accessibilityLabel: {
        type: ControlType.String,
        title: "A11y Label",
        defaultValue: "",
        placeholder: "Optional",
    },
})

export default PremiumAnimatedButton
