/**
 * Shiny Button — Framer code component.
 * Ported from Magic UI (magicui.design), MIT License. Copyright (c) Magic UI / magicuidesign.
 *
 * A softly bordered, rounded button whose label and 1px border are swept by a looping light band.
 * The band is driven by an animated CSS variable (--x) on a spring loop; the button springs in on mount
 * and squishes on tap. Light and dark themes mirror Magic UI's light / dark styling.
 */
import * as React from "react"
import { useEffect, useState } from "react"
import type { CSSProperties } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useReducedMotion } from "framer-motion"

const CLASS = "mui-shiny-button"

const CSS = `
.${CLASS}-btn{position:relative;cursor:pointer;margin:0;font:inherit;-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);transition:box-shadow .3s ease-in-out;-webkit-tap-highlight-color:transparent;box-sizing:border-box;outline:none}
.${CLASS}-btn[data-theme="light"]:hover{box-shadow:0 1px 3px 0 rgb(0 0 0 / .1),0 1px 2px -1px rgb(0 0 0 / .1)}
.${CLASS}-btn[data-theme="dark"]:hover{box-shadow:0 0 20px var(--${CLASS}-glow)}
.${CLASS}-btn:focus-visible{outline:2px solid var(--${CLASS}-ring);outline-offset:2px}
.${CLASS}-label{position:relative;display:block;width:100%;height:100%;letter-spacing:.025em;text-transform:uppercase;white-space:nowrap}
.${CLASS}-edge{position:absolute;inset:0;z-index:10;display:block;border-radius:inherit;padding:1px;pointer-events:none;box-sizing:border-box}
`

function useInjectedStyle() {
    useEffect(() => {
        if (typeof document === "undefined") return
        const id = `${CLASS}-style`
        if (document.getElementById(id)) return
        const el = document.createElement("style")
        el.id = id
        el.textContent = CSS
        document.head.appendChild(el)
    }, [])
}

// Resolved Magic UI theme tokens (oklch → hex): --primary, --border, foreground text.
const THEMES = {
    Light: {
        text: "rgba(0,0,0,0.65)",
        primary: "#171717",
        border: "#E5E5E5",
        background: "rgba(0,0,0,0)",
        weight: 500,
    },
    Dark: {
        text: "rgba(255,255,255,0.9)",
        primary: "#EBEBEB",
        border: "rgba(255,255,255,0.1)",
        background: "rgba(0,0,0,0)",
        weight: 300,
    },
} as const

/** Mixes a color with transparency using color-mix so any CSS color from Framer works. */
const alpha = (color: string, pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, transparent)`

interface Props {
    text: string
    theme: "Light" | "Dark"
    customColors: boolean
    textColor: string
    shineColor: string
    borderColor: string
    background: string
    radius: number
    paddingX: number
    paddingY: number
    repeatDelay: number
    font: CSSProperties
    onClick?: () => void
    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ShinyButton(props: Props) {
    const {
        text = "Shiny Button",
        theme = "Light",
        customColors = false,
        radius = 10,
        paddingX = 24,
        paddingY = 8,
        repeatDelay = 1,
        font,
        onClick,
        style,
    } = props
    useInjectedStyle()

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const prefersReduced = useReducedMotion()
    const [hydrated, setHydrated] = useState(false)
    useEffect(() => setHydrated(true), [])
    const still = isCanvas || (hydrated && !!prefersReduced)

    const t = THEMES[theme] || THEMES.Light
    const textColor = customColors ? props.textColor : t.text
    const primary = customColors ? props.shineColor : t.primary
    const borderColor = customColors ? props.borderColor : t.border
    const isDark = theme === "Dark"
    const fill = customColors ? props.background : t.background
    const backgroundImage = isDark
        ? `radial-gradient(circle at 50% 0%, ${alpha(primary, 10)} 0%, transparent 60%)`
        : undefined

    const motionProps = still
        ? {
              initial: false as const,
              animate: { "--x": "-100%", scale: 1 } as any,
          }
        : {
              initial: { "--x": "100%", scale: 0.8 } as any,
              animate: { "--x": "-100%", scale: 1 } as any,
              whileTap: { scale: 0.95 },
              transition: {
                  repeat: Infinity,
                  repeatType: "loop" as const,
                  repeatDelay,
                  type: "spring" as const,
                  stiffness: 20,
                  damping: 15,
                  mass: 2,
                  scale: {
                      type: "spring" as const,
                      stiffness: 200,
                      damping: 5,
                      mass: 0.5,
                  },
              },
          }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <motion.button
                type="button"
                className={`${CLASS}-btn`}
                data-theme={isDark ? "dark" : "light"}
                onClick={onClick}
                {...motionProps}
                style={
                    {
                        "--x": "-100%",
                        [`--${CLASS}-glow`]: alpha(primary, 10),
                        [`--${CLASS}-ring`]: alpha(primary, 50),
                        width: "100%",
                        height: "100%",
                        borderRadius: radius,
                        border: `1px solid ${borderColor}`,
                        padding: `${paddingY}px ${paddingX}px`,
                        backgroundColor: fill,
                        backgroundImage,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    } as any
                }
            >
                <span
                    className={`${CLASS}-label`}
                    style={{
                        fontSize: 14,
                        fontWeight: t.weight,
                        color: textColor,
                        ...font,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        maskImage: `linear-gradient(-75deg, ${primary} calc(var(--x) + 20%), transparent calc(var(--x) + 30%), ${primary} calc(var(--x) + 100%))`,
                        WebkitMaskImage: `linear-gradient(-75deg, ${primary} calc(var(--x) + 20%), transparent calc(var(--x) + 30%), ${primary} calc(var(--x) + 100%))`,
                    }}
                >
                    {text}
                </span>
                <span
                    aria-hidden="true"
                    className={`${CLASS}-edge`}
                    style={
                        {
                            mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude, linear-gradient(rgb(0,0,0), rgb(0,0,0))",
                            WebkitMask:
                                "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box, linear-gradient(rgb(0,0,0), rgb(0,0,0))",
                            WebkitMaskComposite: "xor",
                            backgroundImage: `linear-gradient(-75deg, ${alpha(primary, 10)} calc(var(--x) + 20%), ${alpha(primary, 50)} calc(var(--x) + 25%), ${alpha(primary, 10)} calc(var(--x) + 100%))`,
                        } as any
                    }
                />
            </motion.button>
        </div>
    )
}

ShinyButton.displayName = "Shiny Button"

addPropertyControls(ShinyButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Shiny Button",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["Light", "Dark"],
        defaultValue: "Light",
        displaySegmentedControl: true,
    },
    customColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(0,0,0,0.65)",
        hidden: (p: any) => !p.customColors,
    },
    shineColor: {
        type: ControlType.Color,
        title: "Shine Color",
        defaultValue: "#171717",
        hidden: (p: any) => !p.customColors,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#E5E5E5",
        hidden: (p: any) => !p.customColors,
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0,0,0,0)",
        hidden: (p: any) => !p.customColors,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        defaultValue: 10,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 24,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
        defaultValue: 8,
    },
    repeatDelay: {
        type: ControlType.Number,
        title: "Shine Delay",
        min: 0,
        max: 10,
        step: 0.1,
        unit: "s",
        defaultValue: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: 14 },
    } as any,
    onClick: { type: ControlType.EventHandler, title: "On Click" },
})
