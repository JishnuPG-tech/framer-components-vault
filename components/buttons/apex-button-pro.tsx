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
import { useRef, useState, useLayoutEffect } from "react"
import type {
    CSSProperties,
    MouseEvent,
    TouchEvent,
    KeyboardEvent,
} from "react"

type FillMode = "radial" | "linearWipe" | "centered"
type TextAnimation = "none" | "rollUp"
type WidthMode = "auto" | "fixed" | "fill"
type HeightMode = "auto" | "fixed"

type ButtonFont = CSSProperties & {
    fontSize?: number
    fontWeight?: number | string
}

interface OriginButtonProV2Props {
    label: string
    link?: string
    openInNewTab: boolean
    disabled: boolean
    backgroundColor: string
    textColor: string
    borderColor: string
    borderWidth: number
    disabledBackgroundColor: string
    disabledTextColor: string
    disabledBorderColor: string
    fillMode: FillMode
    fillColor: string
    hoverTextColor: string
    cursorFollowing: boolean
    animationDuration: number
    textAnimation: TextAnimation
    rollStaggerDelay: number
    rollDuration: number
    borderRadius: number
    paddingX: number
    paddingY: number
    font: ButtonFont
    widthMode?: WidthMode
    buttonWidth: number
    heightMode?: HeightMode
    buttonHeight: number
}

/**
 * ORIGIN BUTTON PRO
 * A premium animated CTA button with cursor-origin fill effects and an
 * optional staggered roll-up text animation.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerDisableUnlink
 */
export default function OriginButtonProV2(props: OriginButtonProV2Props) {
    const isStaticRenderer = useIsStaticRenderer()
    const {
        label,
        link,
        openInNewTab,
        disabled,
        backgroundColor,
        textColor,
        borderColor,
        borderWidth,
        disabledBackgroundColor,
        disabledTextColor,
        disabledBorderColor,
        fillMode,
        fillColor,
        hoverTextColor,
        cursorFollowing,
        animationDuration,
        textAnimation,
        rollStaggerDelay,
        rollDuration,
        borderRadius,
        paddingX,
        paddingY,
        font,
        widthMode,
        buttonWidth,
        heightMode,
        buttonHeight,
    } = props

    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const measureRef = useRef<HTMLSpanElement | null>(null)
    const [clipPath, setClipPath] = useState(hiddenClip(fillMode))
    const [pressed, setPressed] = useState(false)
    const [isHovering, setIsHovering] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [rollHeight, setRollHeight] = useState((font.fontSize || 15) * 1.3)
    const hoveringRef = useRef(false)

    // Measure the real rendered height of this font so rolled characters do
    // not clip when a font has unusual ascender/descender metrics.
    useLayoutEffect(() => {
        if (isStaticRenderer) return
        if (measureRef.current) {
            const measured = measureRef.current.getBoundingClientRect().height
            if (measured > 0) setRollHeight(Math.ceil(measured))
        }
    }, [font, label, isStaticRenderer])

    function hiddenClip(mode: FillMode): string {
        if (mode === "linearWipe") return "inset(0 100% 0 0)"
        return "circle(0% at 50% 50%)"
    }

    function getOrigin(
        e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>
    ) {
        const rect = buttonRef.current?.getBoundingClientRect()
        if (!rect) return { x: 50, y: 50 }
        const isTouchEvent = "touches" in e
        const clientX = isTouchEvent
            ? (e.touches[0]?.clientX ?? rect.left + rect.width / 2)
            : e.clientX
        const clientY = isTouchEvent
            ? (e.touches[0]?.clientY ?? rect.top + rect.height / 2)
            : e.clientY
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100,
        }
    }

    function revealAt(origin: { x: number; y: number }) {
        if (fillMode === "linearWipe") {
            const fromLeft = origin.x < 50
            setClipPath(fromLeft ? "inset(0 0% 0 0)" : "inset(0 0 0 0%)")
        } else if (fillMode === "centered") {
            setClipPath("circle(150% at 50% 50%)")
        } else {
            setClipPath(`circle(150% at ${origin.x}% ${origin.y}%)`)
        }
    }

    function hideFill(origin?: { x: number; y: number }) {
        if (fillMode === "linearWipe") {
            const fromLeft = origin ? origin.x < 50 : true
            setClipPath(fromLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)")
        } else if (fillMode === "centered") {
            setClipPath("circle(0% at 50% 50%)")
        } else {
            setClipPath(
                `circle(0% at ${origin ? origin.x : 50}% ${origin ? origin.y : 50}%)`
            )
        }
    }

    function handleEnter(
        e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>
    ) {
        if (disabled || isStaticRenderer) return
        hoveringRef.current = true
        setIsHovering(true)
        const origin = getOrigin(e)
        revealAt(origin)
    }

    function handleMove(e: MouseEvent<HTMLButtonElement>) {
        if (
            disabled ||
            isStaticRenderer ||
            !hoveringRef.current ||
            !cursorFollowing ||
            fillMode === "linearWipe" ||
            fillMode === "centered"
        )
            return
        const origin = getOrigin(e)
        setClipPath(`circle(150% at ${origin.x}% ${origin.y}%)`)
    }

    function handleLeave(
        e: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>
    ) {
        if (disabled || isStaticRenderer) return
        hoveringRef.current = false
        setIsHovering(false)
        const origin = getOrigin(e)
        hideFill(origin)
    }

    function handleActivate() {
        if (disabled || !link) return
        if (openInNewTab) {
            window.open(link, "_blank", "noopener,noreferrer")
        } else {
            window.location.href = link
        }
    }

    function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
        if (disabled) return
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleActivate()
        }
    }

    const currentBg = disabled ? disabledBackgroundColor : backgroundColor
    const currentText = disabled ? disabledTextColor : textColor
    const currentBorder = disabled ? disabledBorderColor : borderColor
    const chars = label.split("")

    // "Auto" keeps the intrinsic size; "Fill" stretches to the parent width.
    // Fixed dimensions include padding and border because the button uses
    // border-box sizing.
    const resolvedWidthMode = widthMode ?? "auto"
    const resolvedHeightMode = heightMode ?? "auto"
    const buttonStyle: CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxSizing: "border-box",
        width:
            resolvedWidthMode === "fill"
                ? "100%"
                : resolvedWidthMode === "fixed"
                  ? buttonWidth
                  : undefined,
        height: resolvedHeightMode === "fixed" ? buttonHeight : undefined,
        padding: `${paddingY}px ${paddingX}px`,
        borderRadius,
        border: `${borderWidth}px solid ${currentBorder}`,
        backgroundColor: currentBg,
        cursor: disabled ? "not-allowed" : "pointer",
        transform: pressed && !disabled ? "scale(0.96)" : "scale(1)",
        transition:
            "transform 0.15s ease, background-color 0.2s ease, border-color 0.2s ease",
        outline: "none",
        outlineOffset: 3,
    }

    return (
        <>
            <style>{`.origin-button-pro-v2:focus-visible { outline: 2px solid currentColor !important; outline-offset: 4px !important; }`}</style>
            <button
                className="origin-button-pro-v2"
                ref={buttonRef}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onMouseEnter={handleEnter}
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                onTouchStart={handleEnter}
                onTouchEnd={handleLeave}
                onMouseDown={() => setPressed(true)}
                onMouseUp={() => setPressed(false)}
                onClick={handleActivate}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-disabled={disabled}
                style={{
                    ...buttonStyle,
                    boxShadow: isFocused
                        ? `0 0 0 2px ${currentBg}, 0 0 0 4px ${currentText}`
                        : undefined,
                }}
            >
                {/* Hidden font measurement element for accurate roll animation. */}
                <span
                    ref={measureRef}
                    aria-hidden="true"
                    style={{
                        ...font,
                        position: "absolute",
                        visibility: "hidden",
                        pointerEvents: "none",
                        height: "auto",
                        lineHeight: "normal",
                        whiteSpace: "nowrap",
                        top: -9999,
                        left: -9999,
                    }}
                >
                    Hg{label}
                </span>

                {/* Fill layer, clipped to reveal from the cursor origin. */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: fillColor,
                        clipPath,
                        transition: `clip-path ${animationDuration}ms ease`,
                        pointerEvents: "none",
                    }}
                />

                {textAnimation === "rollUp" && !isStaticRenderer ? (
                    <span
                        style={{
                            position: "relative",
                            display: "flex",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {chars.map((c, i) => (
                            <span
                                key={i}
                                style={{
                                    display: "inline-block",
                                    overflow: "hidden",
                                    height: rollHeight,
                                }}
                            >
                                <motion.div
                                    animate={{
                                        y:
                                            isHovering && !disabled
                                                ? -rollHeight
                                                : 0,
                                    }}
                                    transition={{
                                        duration: rollDuration / 1000,
                                        delay:
                                            (isHovering
                                                ? i
                                                : chars.length - 1 - i) *
                                            (rollStaggerDelay / 1000),
                                        ease: [0.65, 0, 0.35, 1],
                                    }}
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    <span
                                        style={{
                                            ...font,
                                            color: currentText,
                                            height: rollHeight,
                                            lineHeight: `${rollHeight}px`,
                                            display: "block",
                                        }}
                                    >
                                        {c === " " ? "\u00A0" : c}
                                    </span>
                                    <span
                                        style={{
                                            ...font,
                                            color: disabled
                                                ? currentText
                                                : hoverTextColor,
                                            height: rollHeight,
                                            lineHeight: `${rollHeight}px`,
                                            display: "block",
                                        }}
                                    >
                                        {c === " " ? "\u00A0" : c}
                                    </span>
                                </motion.div>
                            </span>
                        ))}
                    </span>
                ) : (
                    <>
                        {/* Base label. */}
                        <span
                            style={{
                                position: "relative",
                                color: currentText,
                                whiteSpace: "nowrap",
                                ...font,
                            }}
                        >
                            {label}
                        </span>

                        {/* Hover-color label uses the same mask as the fill. */}
                        {!disabled ? (
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: hoverTextColor,
                                    whiteSpace: "nowrap",
                                    clipPath,
                                    transition: `clip-path ${animationDuration}ms ease`,
                                    pointerEvents: "none",
                                    ...font,
                                }}
                            >
                                {label}
                            </span>
                        ) : null}
                    </>
                )}
            </button>
        </>
    )
}

OriginButtonProV2.displayName = "Origin Button Pro V2"

addPropertyControls(OriginButtonProV2, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started",
    },
    link: { type: ControlType.Link, title: "Link" },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "Open In New Tab",
        defaultValue: false,
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
    },

    // New size controls
    widthMode: {
        type: ControlType.Enum,
        title: "Width Mode",
        options: ["auto", "fixed", "fill"],
        optionTitles: ["Auto / Fit", "Fixed Width", "Fill Parent"],
        defaultValue: "auto",
    },
    buttonWidth: {
        type: ControlType.Number,
        title: "Fixed Width",
        defaultValue: 220,
        min: 1,
        max: 1200,
        step: 1,
        hidden: (p) => p.widthMode !== "fixed",
    },
    heightMode: {
        type: ControlType.Enum,
        title: "Height Mode",
        options: ["auto", "fixed"],
        optionTitles: ["Auto / Fit", "Fixed Height"],
        defaultValue: "auto",
    },
    buttonHeight: {
        type: ControlType.Number,
        title: "Fixed Height",
        defaultValue: 48,
        min: 1,
        max: 400,
        step: 1,
        hidden: (p) => p.heightMode !== "fixed",
    },

    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#111111",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#111111",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        defaultValue: 0,
        min: 0,
        max: 8,
    },

    disabledBackgroundColor: {
        type: ControlType.Color,
        title: "Disabled Background",
        defaultValue: "#e5e5e5",
    },
    disabledTextColor: {
        type: ControlType.Color,
        title: "Disabled Text",
        defaultValue: "#a0a0a0",
    },
    disabledBorderColor: {
        type: ControlType.Color,
        title: "Disabled Border",
        defaultValue: "#e5e5e5",
    },

    fillMode: {
        type: ControlType.Enum,
        title: "Fill Mode",
        options: ["radial", "linearWipe", "centered"],
        optionTitles: ["Radial Fill", "Linear Wipe", "Centered Fill"],
        defaultValue: "radial",
    },
    fillColor: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#ffffff",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text Color",
        defaultValue: "#111111",
    },
    cursorFollowing: {
        type: ControlType.Boolean,
        title: "Cursor Following",
        defaultValue: true,
        hidden: (p) => p.fillMode !== "radial",
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Fill Duration (ms)",
        defaultValue: 400,
        min: 100,
        max: 1000,
        step: 50,
    },

    textAnimation: {
        type: ControlType.Enum,
        title: "Text Animation",
        options: ["none", "rollUp"],
        optionTitles: ["None (Mask Reveal)", "Roll Up"],
        defaultValue: "none",
    },
    rollDuration: {
        type: ControlType.Number,
        title: "Roll Duration (ms)",
        defaultValue: 350,
        min: 100,
        max: 800,
        step: 50,
        hidden: (p) => p.textAnimation !== "rollUp",
    },
    rollStaggerDelay: {
        type: ControlType.Number,
        title: "Roll Stagger (ms)",
        defaultValue: 25,
        min: 0,
        max: 100,
        step: 5,
        hidden: (p) => p.textAnimation !== "rollUp",
    },

    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        defaultValue: 999,
        min: 0,
        max: 999,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 28,
        min: 0,
        max: 100,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 14,
        min: 0,
        max: 60,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 15, fontWeight: 600 },
    },
})
