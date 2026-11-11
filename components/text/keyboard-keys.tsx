import React, { useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export default function KeyboardKeys(props) {
    const {
        text,
        keyStyle,
        keySize,
        keyColor,
        textColor,
        shadowDepth,
        borderColor,
        spacing,
        layout,
        hoverEffect,
        clickEffect,
        animationType,
        animationSpeed,
        glowEffect,
        glowColor,
        pressedColor,
        fontFamily, // ControlType.Font returns an object
        fontWeight,
        uppercase,
        showSpecialKeys,
        spaceBarMode,
        spaceBarPosition,
        spaceBarWidth,
        enhanced3D,
        ...rest
    } = props

    const [pressedKey, setPressedKey] = useState(null)
    const [animatedKeys, setAnimatedKeys] = useState(new Set())

    // Timeouts for typing animation (clean up on unmount)
    useEffect(() => {
        if (animationType === "typing") {
            setAnimatedKeys(new Set())
            const chars = text.split("")
            const timers = []
            chars.forEach((_, index) => {
                const t = setTimeout(() => {
                    setAnimatedKeys((prev) => new Set([...prev, index]))
                }, index * animationSpeed)
                timers.push(t)
            })
            return () => timers.forEach((t) => clearTimeout(t))
        } else {
            setAnimatedKeys(
                new Set(Array.from({ length: text.length }, (_, i) => i))
            )
        }
    }, [text, animationType, animationSpeed])

    // Helper: normalize font props returned by ControlType.Font
    const resolvedFontFamily = () => {
        // fontFamily might be: { fontFamily, fontWeight, fontStyle } or a string fallback
        if (!fontFamily)
            return {
                family: "Inter",
                weight: fontWeight || 500,
                style: "normal",
            }
        if (typeof fontFamily === "string")
            return {
                family: fontFamily,
                weight: fontWeight || 500,
                style: "normal",
            }
        return {
            family: fontFamily.fontFamily || "Inter",
            weight:
                fontFamily.fontWeight || fontFamily.weight || fontWeight || 500,
            style: fontFamily.fontStyle || "normal",
        }
    }

    // Helper: robust hex -> rgb (handles 3 or 6 char hex)
    const hexToRgb = (hex) => {
        if (!hex) return { r: 255, g: 255, b: 255 }
        let h = hex.replace("#", "")
        if (h.length === 3) {
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        }
        const num = parseInt(h, 16)
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        }
    }

    // Helper: is a color "light" (for contrast fallback)
    const isLightColor = (hex) => {
        try {
            const { r, g, b } = hexToRgb(hex)
            // relative luminance approximation
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
            return lum > 0.6
        } catch {
            return false
        }
    }

    // Helper to adjust brightness (kept similar to your original)
    const adjustBrightness = (color, amount) => {
        try {
            const usePound = color && color[0] === "#"
            let col = usePound ? color.slice(1) : color
            if (col.length === 3)
                col = col
                    .split("")
                    .map((c) => c + c)
                    .join("")
            const num = parseInt(col, 16)
            let r = (num >> 16) + amount
            let g = ((num >> 8) & 0x00ff) + amount
            let b = (num & 0x0000ff) + amount
            r = r > 255 ? 255 : r < 0 ? 0 : r
            g = g > 255 ? 255 : g < 0 ? 0 : g
            b = b > 255 ? 255 : b < 0 ? 0 : b
            return (
                (usePound ? "#" : "") +
                ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
            )
        } catch {
            return color
        }
    }

    // Get key dimensions
    const getKeyDimensions = (char, index) => {
        const baseSize = keySize
        const isSpace = char === " "
        const isSpecial = ["Enter", "Shift", "Ctrl", "Alt", "Cmd"].includes(
            char
        )

        if (isSpace && spaceBarMode !== "hidden") {
            const width =
                spaceBarMode === "custom" ? spaceBarWidth : baseSize * 3
            return { width: width, height: baseSize }
        } else if (isSpecial) {
            return { width: baseSize * 1.5, height: baseSize }
        } else {
            return { width: baseSize, height: baseSize }
        }
    }

    // Primary style generator
    const getKeyStyles = (char, index, isPressed, isHovered) => {
        const dims = getKeyDimensions(char, index)
        const isAnimated = animatedKeys.has(index)
        const depth3D = enhanced3D ? shadowDepth * 1.5 : shadowDepth
        const pressedDepth = enhanced3D ? 4 : 2

        const resolvedFont = resolvedFontFamily()
        const fontFamilyName = resolvedFont.family
        const fontWeightValue = resolvedFont.weight
        const fontStyleValue = resolvedFont.style

        // choose fallback border for contrast if borderColor not provided
        const computedBorderColor =
            borderColor || (isLightColor(keyColor) ? "#000000" : "#ffffff")

        const baseStyles = {
            width: dims.width,
            height: dims.height,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            margin: `${spacing / 2}px`,
            fontSize: Math.max(12, keySize * 0.28),
            fontFamily: fontFamilyName,
            fontWeight: fontWeightValue,
            fontStyle: fontStyleValue,
            color: textColor,
            backgroundColor: isPressed ? pressedColor : keyColor,
            border: `2px solid ${computedBorderColor}`, // guaranteed visible border
            borderBottom: enhanced3D
                ? `3px solid ${adjustBrightness(keyColor, -40)}`
                : `2px solid ${computedBorderColor}`,
            borderRight: enhanced3D
                ? `2px solid ${adjustBrightness(keyColor, -20)}`
                : `2px solid ${computedBorderColor}`,
            cursor: "pointer",
            transition: "all 0.15s ease",
            userSelect: "none",
            position: "relative",
            opacity: isAnimated ? 1 : animationType === "typing" ? 0 : 1,
            transform: `translateY(${isPressed ? `${pressedDepth}px` : "0px"}) translateZ(${enhanced3D ? "0px" : "0px"}) scale(${isAnimated ? 1 : animationType === "typing" ? 0.8 : 1})`,
            boxShadow: enhanced3D
                ? `0 ${depth3D}px 0 ${adjustBrightness(keyColor, -50)}, 0 ${depth3D + 2}px ${depth3D * 2}px rgba(0,0,0,0.3)`
                : `0 ${depth3D}px ${Math.max(2, depth3D)}px rgba(0,0,0,0.18)`, // guaranteed shadow
            filter:
                glowEffect && (isHovered || isPressed)
                    ? `drop-shadow(0 0 ${Math.max(2, keySize * 0.18)}px ${glowColor})`
                    : "none",
            borderRadius: keySize * 0.12,
        }

        // Style variants
        switch (keyStyle) {
            case "modern":
                return {
                    ...baseStyles,
                    borderRadius: keySize * 0.15,
                    background: enhanced3D
                        ? `linear-gradient(145deg, ${adjustBrightness(keyColor, 20)}, ${adjustBrightness(keyColor, -10)})`
                        : keyColor,
                    boxShadow: isPressed
                        ? `inset 0 ${pressedDepth}px ${depth3D}px rgba(0,0,0,0.4), inset 0 0 ${depth3D}px rgba(0,0,0,0.2)`
                        : baseStyles.boxShadow,
                }
            case "retro":
                return {
                    ...baseStyles,
                    borderRadius: keySize * 0.08,
                    borderWidth: enhanced3D ? "2px" : "3px",
                    borderStyle: "solid",
                    background: enhanced3D
                        ? `linear-gradient(145deg, ${adjustBrightness(keyColor, 15)}, ${keyColor}, ${adjustBrightness(keyColor, -15)})`
                        : keyColor,
                    boxShadow: isPressed
                        ? `inset 0 3px ${depth3D}px rgba(0,0,0,0.5)`
                        : baseStyles.boxShadow,
                }
            case "gaming":
                return {
                    ...baseStyles,
                    borderRadius: keySize * 0.1,
                    background: isPressed
                        ? pressedColor
                        : enhanced3D
                          ? `linear-gradient(145deg, ${adjustBrightness(keyColor, 30)}, ${keyColor}, ${adjustBrightness(keyColor, -30)})`
                          : keyColor,
                    borderColor: enhanced3D
                        ? adjustBrightness(
                              glowEffect ? glowColor : computedBorderColor,
                              20
                          )
                        : glowEffect
                          ? glowColor
                          : computedBorderColor,
                }
            case "minimal":
                return {
                    ...baseStyles,
                    borderRadius: keySize * 0.2,
                    border: enhanced3D
                        ? `1px solid ${adjustBrightness(keyColor, -20)}`
                        : `1px solid ${computedBorderColor}`,
                    boxShadow: isPressed
                        ? `inset 0 1px ${depth3D / 2}px rgba(0,0,0,0.3)`
                        : baseStyles.boxShadow,
                }
            default:
                return baseStyles
        }
    }

    // Convert text to keys
    const createKeys = () => {
        const chars = text.split("")
        const keys = []

        chars.forEach((char, index) => {
            let displayChar = char
            let shouldSkip = false

            // Handle space bar logic
            if (char === " ") {
                if (spaceBarMode === "hidden") {
                    shouldSkip = true
                } else if (
                    spaceBarMode === "position" &&
                    index !== spaceBarPosition - 1
                ) {
                    shouldSkip = true
                } else {
                    displayChar = showSpecialKeys ? "Space" : " "
                }
            }

            if (shouldSkip) return

            if (uppercase && char !== " ") {
                displayChar = displayChar.toUpperCase()
            }

            keys.push(
                <KeyComponent
                    key={index}
                    char={displayChar}
                    index={index}
                    isPressed={pressedKey === index}
                    styles={getKeyStyles(
                        char,
                        index,
                        pressedKey === index,
                        false
                    )}
                    hoverEffect={hoverEffect}
                    onPress={() => handleKeyPress(index)}
                    glowEffect={glowEffect}
                    glowColor={glowColor}
                    enhanced3D={enhanced3D}
                />
            )
        })

        return keys
    }

    // Handle key press animation
    const handleKeyPress = (index) => {
        if (!clickEffect) return
        setPressedKey(index)
        setTimeout(() => setPressedKey(null), 150)
    }

    // Arrange keys in layouts
    const arrangeKeys = (keys) => {
        if (layout === "single-row") {
            return (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {keys}
                </div>
            )
        } else if (layout === "auto-wrap") {
            return (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: "100%",
                    }}
                >
                    {keys}
                </div>
            )
        } else if (layout === "staggered") {
            return (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                    }}
                >
                    {keys.map((key, index) => (
                        <div
                            key={`stagger-${index}`}
                            style={{
                                transform: `translateY(${index % 2 === 1 ? keySize * 0.15 : -keySize * 0.15}px)`,
                                display: "inline-block",
                            }}
                        >
                            {key}
                        </div>
                    ))}
                </div>
            )
        } else if (layout === "staggered-rows") {
            const rows = []
            let currentRow = []
            const keysPerRow = Math.ceil(Math.sqrt(keys.length))
            keys.forEach((key, index) => {
                currentRow.push(key)
                if (
                    (index + 1) % keysPerRow === 0 ||
                    index === keys.length - 1
                ) {
                    const rowIndex = rows.length
                    const isEvenRow = rowIndex % 2 === 0
                    rows.push(
                        <div
                            key={`row-${rowIndex}`}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: spacing,
                                transform: `translateX(${isEvenRow ? 0 : keySize * 0.3}px)`,
                            }}
                        >
                            {currentRow.map((key, keyIndex) => (
                                <div
                                    key={`stagger-row-${rowIndex}-${keyIndex}`}
                                    style={{
                                        transform: `translateY(${keyIndex % 2 === 1 ? keySize * 0.1 : -keySize * 0.1}px)`,
                                        display: "inline-block",
                                    }}
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                    )
                    currentRow = []
                }
            })

            return <div>{rows}</div>
        } else {
            // fallback multi-row: split rows at spaces or every 10 chars
            const rows = []
            let currentRow = []
            const chars = text.split("")
            const keysNodes = keys
            keysNodes.forEach((key, index) => {
                currentRow.push(key)
                if ((index + 1) % 10 === 0 || chars[index] === " ") {
                    rows.push(
                        <div
                            key={rows.length}
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: spacing,
                            }}
                        >
                            {currentRow}
                        </div>
                    )
                    currentRow = []
                }
            })
            if (currentRow.length > 0) {
                rows.push(
                    <div
                        key={rows.length}
                        style={{ display: "flex", justifyContent: "center" }}
                    >
                        {currentRow}
                    </div>
                )
            }
            return <div>{rows}</div>
        }
    }

    return (
        <div
            {...rest}
            style={{
                padding: spacing,
                ...rest.style,
            }}
        >
            {arrangeKeys(createKeys())}
        </div>
    )
}

// Individual Key component
function KeyComponent({
    char,
    index,
    isPressed,
    styles,
    hoverEffect,
    onPress,
    glowEffect,
    glowColor,
    enhanced3D,
}) {
    const [isHovered, setIsHovered] = useState(false)

    const hoverStyles =
        hoverEffect && isHovered
            ? {
                  transform: enhanced3D
                      ? (styles.transform || "translateY(0px)").replace(
                            "translateY(0px)",
                            "translateY(-2px)"
                        )
                      : (styles.transform || "translateY(0px)").replace(
                            "0px",
                            "-1px"
                        ),
                  filter: glowEffect
                      ? `drop-shadow(0 0 ${Math.max(2, styles.fontSize * 0.8)}px ${glowColor})`
                      : styles.filter,
              }
            : {}

    return (
        <div
            role="button"
            aria-label={`key-${char}-${index}`}
            tabIndex={0}
            style={{
                ...styles,
                ...hoverStyles,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={onPress}
            onMouseUp={() => {}}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    onPress && onPress()
                }
            }}
        >
            {char}
        </div>
    )
}

// Default props
KeyboardKeys.defaultProps = {
    text: "HELLO WORLD",
    keyStyle: "modern",
    keySize: 50,
    keyColor: "#ffffff",
    textColor: "#333333",
    shadowDepth: 6,
    borderColor: "#cccccc",
    spacing: 6,
    layout: "single-row",
    hoverEffect: true,
    clickEffect: true,
    animationType: "none",
    animationSpeed: 150,
    glowEffect: false,
    glowColor: "#00ff88",
    pressedColor: "#f0f0f0",
    fontFamily: { fontFamily: "Inter", fontWeight: 500, fontStyle: "normal" },
    fontWeight: 500,
    uppercase: true,
    showSpecialKeys: true,
    spaceBarMode: "normal",
    spaceBarPosition: 6,
    spaceBarWidth: 150,
    enhanced3D: true,
}

// Property Controls
addPropertyControls(KeyboardKeys, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "HELLO WORLD",
    },
    keyStyle: {
        type: ControlType.Enum,
        title: "Key Style",
        options: ["modern", "retro", "gaming", "minimal"],
        optionTitles: ["Modern", "Retro", "Gaming", "Minimal"],
        defaultValue: "modern",
    },
    keySize: {
        type: ControlType.Number,
        title: "Key Size",
        min: 30,
        max: 100,
        step: 2,
        defaultValue: 50,
    },
    enhanced3D: {
        type: ControlType.Boolean,
        title: "Enhanced 3D Effect",
        defaultValue: true,
    },
    keyColor: {
        type: ControlType.Color,
        title: "Key Color",
        defaultValue: "#ffffff",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#333333",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#cccccc",
    },
    pressedColor: {
        type: ControlType.Color,
        title: "Pressed Color",
        defaultValue: "#f0f0f0",
    },
    shadowDepth: {
        type: ControlType.Number,
        title: "Shadow Depth",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 6,
    },
    spacing: {
        type: ControlType.Number,
        title: "Key Spacing",
        min: 0,
        max: 30,
        step: 1,
        defaultValue: 6,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: [
            "single-row",
            "auto-wrap",
            "multi-row",
            "staggered",
            "staggered-rows",
        ],
        optionTitles: [
            "Single Row",
            "Auto Wrap",
            "Multi Row",
            "Staggered Horizontal",
            "Staggered Multi-Row",
        ],
        defaultValue: "single-row",
    },
    spaceBarMode: {
        type: ControlType.Enum,
        title: "Space Bar Mode",
        options: ["normal", "hidden", "position", "custom"],
        optionTitles: ["Normal", "Hidden", "Specific Position", "Custom Width"],
        defaultValue: "normal",
    },
    spaceBarPosition: {
        type: ControlType.Number,
        title: "Space Bar Position",
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 6,
        hidden: (props) => props.spaceBarMode !== "position",
    },
    spaceBarWidth: {
        type: ControlType.Number,
        title: "Space Bar Width",
        min: 40,
        max: 400,
        step: 10,
        defaultValue: 150,
        hidden: (props) => props.spaceBarMode !== "custom",
    },

    // ✅ Full Framer font picker control
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 500,
            fontStyle: "normal",
        },
    },

    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: ["400", "500", "600", "700"],
        optionTitles: ["400", "500", "600", "700"],
        defaultValue: 500,
    },
    uppercase: {
        type: ControlType.Boolean,
        title: "Uppercase",
        defaultValue: true,
    },
    showSpecialKeys: {
        type: ControlType.Boolean,
        title: "Show Special Key Names",
        defaultValue: true,
    },
    hoverEffect: {
        type: ControlType.Boolean,
        title: "Hover Effect",
        defaultValue: true,
    },
    clickEffect: {
        type: ControlType.Boolean,
        title: "Click Effect",
        defaultValue: true,
    },
    glowEffect: {
        type: ControlType.Boolean,
        title: "Glow Effect",
        defaultValue: false,
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        defaultValue: "#00ff88",
        hidden: (props) => !props.glowEffect,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["none", "typing"],
        optionTitles: ["None", "Typing Effect"],
        defaultValue: "none",
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Animation Speed (ms)",
        min: 50,
        max: 500,
        step: 25,
        defaultValue: 150,
        hidden: (props) => props.animationType === "none",
    },
})
