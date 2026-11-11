// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"
import React, { useState, useEffect } from "react"

// --- 1. LOGIC ENGINE ---
const changeTheme = (t) => {
    if (typeof window === "undefined" || typeof document === "undefined") return
    const h = document.documentElement,
        b = document.body
    h.setAttribute("toggle-theme", t)
    b.setAttribute("toggle-theme", t)
    localStorage.setItem("theme", t)
    window.dispatchEvent(new Event("themeChange"))
}

function extractAndApplyThemeTokens() {
    if (typeof document === "undefined") return
    let l = [],
        d = ""
    for (let i = 0; i < document.styleSheets.length; i++) {
        try {
            const rules = document.styleSheets[i].cssRules || []
            for (let k = 0; k < rules.length; k++) {
                const r = rules[k]
                if (r.selectorText === "body") {
                    for (let j = 0; j < r.style.length; j++) {
                        const p = r.style[j]
                        if (p.includes("--token"))
                            l.push(`${p}: ${r.style.getPropertyValue(p)};`)
                    }
                } else if (r.conditionText === "(prefers-color-scheme: dark)") {
                    if (r.cssRules.length > 0)
                        d = r.cssRules[0].cssText
                            .replace("body", "")
                            .replace(/\s*{\s*/, "")
                            .replace(/\s*}\s*$/, "")
                }
            }
        } catch (e) {}
    }
    const id = "toggle-theme-styles"
    const old = document.getElementById(id)
    if (old) document.head.removeChild(old)
    const s = document.createElement("style")
    s.id = id

    s.textContent = `
        body[toggle-theme="light"]{${l.join(" ")}} 
        body[toggle-theme="dark"]{${d}} 
        html[toggle-theme="light"]{color-scheme:light} 
        html[toggle-theme="dark"]{color-scheme:dark}
    `
    document.head.appendChild(s)
}

// @framerDisableUnlink
/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

// --- 2. COMPONENT ---

export default function SpringSwitch(props) {
    const {
        // Dimensions
        width = 60,
        height = 100,
        radius = 12,
        autoSize = false,

        // String properties

        string: {
            lineColor = "#333",
            darkLineColor = "#fff",
            stringLength = 200,
            stringThickness = 3,
        } = {},

        // Physics & Timing
        threshold = 150,
        stiffness = 300,
        damping = 20,
        themeTransition = 0.4,

        // Slots
        lightSlot,
        darkSlot,
    } = props

    const [isDark, setIsDark] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Physics
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const controls = useAnimation()

    // Setup initial theme and tokens
    useEffect(() => {
        if (typeof window === "undefined") return
        extractAndApplyThemeTokens()
        const saved = localStorage.getItem("theme")
        const sysDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        let start = saved === "dark" || (!saved && sysDark)
        setIsDark(start)
        changeTheme(start ? "dark" : "light")
    }, [])

    // Dedicated effect to handle global transition timing dynamically
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = "toggle-theme-transition-style"
        let s = document.getElementById(id)
        if (!s) {
            s = document.createElement("style")
            s.id = id
            document.head.appendChild(s)
        }
        s.textContent = `body { transition: background-color ${themeTransition}s ease, color ${themeTransition}s ease; }`
    }, [themeTransition])

    const toggleTheme = () => {
        const newMode = !isDark
        setIsDark(newMode)
        changeTheme(newMode ? "dark" : "light")
        if (navigator.vibrate) navigator.vibrate(50)
    }

    // Path Logic: Draw line to the center.
    const path = useTransform(
        [x, y],
        ([cx, cy]: [number, number]) => `M 50 0 L ${50 + cx} ${stringLength + cy + 1}`
    )

    const handleDragEnd = () => {
        setIsDragging(false)
        if (y.get() > threshold) toggleTheme()
        controls.start({
            x: 0,
            y: 0,
            transition: { type: "spring", stiffness, damping },
        })
    }

    // Dynamic Colors
    const currentBg = isDark ? "#222" : "#fff"
    const currentLine = isDark ? darkLineColor : lineColor
    // FIXED: Mapped border and icon colors to use the line colors instead of the removed tint props
    const currentBorder = isDark ? "#fff" : lineColor
    const currentIconColor = currentLine

    // Content
    const hasCustomSlots = lightSlot && darkSlot

    const baseStyle = {
        marginTop: stringLength,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "grab",
        pointerEvents: "auto" as const,
        zIndex: 10,
    }

    const sizeStyle = autoSize
        ? {
              width: "auto",
              height: "auto",
              padding: 0,
          }
        : {
              width: width,
              height: height,
          }

    const visualStyle = hasCustomSlots
        ? {
              backgroundColor: "transparent",
              boxShadow: "none",
              border: "none",
          }
        : {
              backgroundColor: currentBg,
              border: `3px solid ${currentBorder}`,
              borderRadius: radius,
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              transition: `background-color ${themeTransition}s ease, border-color ${themeTransition}s ease`,
          }

    return (
        <div
            style={{
                width: 100,
                height: 400,
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                overflow: "visible",
                zIndex: 9999,
                pointerEvents: "none",
                lineHeight: 0,
            }}
        >
            {/* String */}
            <svg
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    zIndex: 0,
                }}
            >
                <motion.path
                    d={path}
                    stroke={currentLine}
                    strokeWidth={stringThickness}
                    strokeLinecap="round"
                    fill="none"
                    style={{ transition: `stroke ${themeTransition}s ease` }}
                />
            </svg>

            {/* Handle */}
            <motion.div
                drag
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 300 }}
                dragElastic={0.2}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{
                    x,
                    y,
                    ...baseStyle,
                    ...sizeStyle,
                    ...visualStyle,
                }}
                whileTap={{ cursor: "grabbing" }}
            >
                {hasCustomSlots ? (
                    <div style={{ pointerEvents: "none", display: "flex" }}>
                        {isDark ? darkSlot : lightSlot}
                    </div>
                ) : (
                    <div
                        style={{ position: "relative", width: 24, height: 24 }}
                    >
                        <motion.svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={currentIconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            animate={{
                                rotate: isDark ? 180 : 0,
                                scale: isDark ? 0 : 1,
                                opacity: isDark ? 0 : 1,
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                transition: `stroke ${themeTransition}s ease`,
                            }}
                        >
                            <circle cx="12" cy="12" r="5"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line
                                x1="4.22"
                                y1="4.22"
                                x2="5.64"
                                y2="5.64"
                            ></line>
                            <line
                                x1="18.36"
                                y1="18.36"
                                x2="19.78"
                                y2="19.78"
                            ></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                            <line
                                x1="4.22"
                                y1="19.78"
                                x2="5.64"
                                y2="18.36"
                            ></line>
                            <line
                                x1="18.36"
                                y1="5.64"
                                x2="19.78"
                                y2="4.22"
                            ></line>
                        </motion.svg>
                        <motion.svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={currentIconColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{
                                rotate: isDark ? 0 : -90,
                                scale: isDark ? 1 : 0,
                                opacity: isDark ? 1 : 0,
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                transition: `stroke ${themeTransition}s ease`,
                            }}
                        >
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </motion.svg>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

addPropertyControls(SpringSwitch, {
    // 1. SLOTS
    lightSlot: { type: ControlType.ComponentInstance, title: "Light Handle" },
    darkSlot: { type: ControlType.ComponentInstance, title: "Dark Handle" },

    // 2. BEHAVIOR
    autoSize: {
        type: ControlType.Boolean,
        title: "Auto Size",
        defaultValue: true,
        description: "Shrink drag area to fit content",
    },

    // 3. DIMENSIONS
    width: {
        type: ControlType.Number,
        title: "Width",
        defaultValue: 60,
        min: 20,
        max: 200,
        hidden: (props) => props.autoSize,
    },
    height: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 100,
        min: 20,
        max: 300,
        hidden: (props) => props.autoSize,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 50,
        hidden: (props) => props.autoSize,
    },

    // 4. STRING GROUP
    string: {
        type: ControlType.Object,
        title: "String Styles",
        controls: {
            lineColor: {
                type: ControlType.Color,
                title: "Light",
                defaultValue: "#333",
            },
            darkLineColor: {
                type: ControlType.Color,
                title: "Dark",
                defaultValue: "#fff",
            },
            stringLength: {
                type: ControlType.Number,
                title: "Length",
                defaultValue: 200,
                min: 0,
                max: 200,
            },
            stringThickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 3,
                min: 1,
                max: 10,
                step: 0.5,
            },
        },
    },

    // 5. PHYSICS & TIMING
    themeTransition: {
        type: ControlType.Number,
        title: "Fade Speed",
        description: "Theme switch duration in seconds",
        defaultValue: 0.4,
        min: 0,
        max: 3,
        step: 0.1,
        displayStepper: true,
    },
    threshold: {
        type: ControlType.Number,
        title: "Pull Dist",
        defaultValue: 150,
        min: 50,
        max: 400,
    },
    stiffness: {
        type: ControlType.Number,
        title: "Stiffness",
        defaultValue: 300,
        min: 50,
        max: 1000,
    },
    damping: {
        type: ControlType.Number,
        title: "Damping",
        defaultValue: 20,
        min: 5,
        max: 100,
    },
})
