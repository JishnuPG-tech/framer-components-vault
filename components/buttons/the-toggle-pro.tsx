// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"

type ToggleState = "off" | "on"

interface ContentProps {
    label: string
    showLabel: boolean
    position: "left" | "right"
    helperText: string
    showHelper: boolean
    font: any
}

interface AppearanceProps {
    width: number
    height: number
    padding: number
    trackOffColor: string
    trackOnColor: string
    thumbColor: string
    labelColor: string
    helperColor: string
    shadowColor: string
}

interface InteractionProps {
    ringColor: string
    ringWidth: number
    duration: number
    squish: number
}

interface Props {
    checked: boolean
    previewState: "default" | "focused" | "disabled"
    demo: boolean
    content: ContentProps
    appearance: AppearanceProps
    interaction: InteractionProps
    showcase: {
        lightBg: string
        darkBg: string
        gap: number
        radius: number
    }
    onCheckedChange?: (checked: boolean) => void
}

function ToggleVisual({
    state,
    disabled,
    ring,
    appearance,
    interaction,
}: {
    state: ToggleState
    disabled: boolean
    ring: boolean
    appearance: AppearanceProps
    interaction: InteractionProps
}) {
    const isStatic = useIsStaticRenderer()
    const isOn = state === "on"
    const thumbSize = Math.max(4, appearance.height - appearance.padding * 2)
    const maxX = Math.max(
        appearance.padding,
        appearance.width - thumbSize - appearance.padding
    )
    const thumbX = isOn ? maxX : appearance.padding
    const animationDuration = isStatic ? 0 : interaction.duration

    return (
        <motion.div
            style={{
                position: "relative",
                width: appearance.width,
                height: appearance.height,
                borderRadius: appearance.height / 2,
                boxSizing: "border-box",
                flexShrink: 0,
                opacity: disabled ? 0.45 : 1,
            }}
            initial={false}
            animate={{
                backgroundColor: isOn
                    ? appearance.trackOnColor
                    : appearance.trackOffColor,
                boxShadow: ring
                    ? `0 0 0 ${interaction.ringWidth}px ${interaction.ringColor}`
                    : "0 0 0 0px rgba(0,0,0,0)",
            }}
            whileTap={disabled || isStatic ? undefined : { scale: 0.97 }}
            transition={{ duration: animationDuration }}
        >
            <motion.div
                style={{
                    position: "absolute",
                    top: appearance.padding,
                    left: 0,
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: "50%",
                    backgroundColor: appearance.thumbColor,
                    boxShadow: `0 1px 2px ${appearance.shadowColor}, 0 2px 6px ${appearance.shadowColor}`,
                }}
                initial={false}
                animate={{
                    x: thumbX,
                    scaleX: isStatic ? 1 : [1, 1 + interaction.squish, 1],
                    scaleY: isStatic ? 1 : [1, 1 - interaction.squish * 0.6, 1],
                }}
                transition={{
                    duration: animationDuration,
                    times: isStatic ? undefined : [0, 0.45, 1],
                    ease: "easeInOut",
                }}
            />
        </motion.div>
    )
}

function ToggleField({
    state,
    onToggle,
    disabled,
    forceRing,
    content,
    appearance,
    interaction,
}: {
    state: ToggleState
    onToggle: () => void
    disabled: boolean
    forceRing?: boolean
    content: ContentProps
    appearance: AppearanceProps
    interaction: InteractionProps
}) {
    const [focused, setFocused] = useState(false)

    const switchEl = (
        <div
            style={{
                position: "relative",
                flexShrink: 0,
                width: appearance.width,
                height: appearance.height,
            }}
        >
            <input
                type="checkbox"
                role="switch"
                aria-checked={state === "on"}
                checked={state === "on"}
                disabled={disabled}
                onChange={onToggle}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label={content.label || "toggle"}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    margin: 0,
                    opacity: 0,
                    cursor: disabled ? "default" : "pointer",
                }}
            />
            <ToggleVisual
                state={state}
                disabled={disabled}
                ring={forceRing ?? focused}
                appearance={appearance}
                interaction={interaction}
            />
        </div>
    )

    return (
        <label
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                cursor: disabled ? "default" : "pointer",
                userSelect: "none",
                flexDirection:
                    content.position === "left" ? "row-reverse" : "row",
            }}
        >
            {switchEl}
            {content.showLabel && (
                <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    <span
                        style={{
                            ...content.font,
                            color: appearance.labelColor,
                        }}
                    >
                        {content.label}
                    </span>
                    {content.showHelper && (
                        <span
                            style={{
                                fontFamily: content.font?.fontFamily,
                                fontSize: 13,
                                lineHeight: 1.4,
                                color: appearance.helperColor,
                            }}
                        >
                            {content.helperText}
                        </span>
                    )}
                </div>
            )}
        </label>
    )
}

const STATES: ToggleState[] = ["off", "on"]

const DEMO_FONT = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
}

const DEMO_CONTENT: ContentProps = {
    label: "Enable notifications",
    showLabel: true,
    position: "right",
    helperText: "Get notified about important updates",
    showHelper: true,
    font: DEMO_FONT,
}

function DemoToggleField({
    initialState,
    disabled,
    forceRing,
    content,
    appearance,
    interaction,
}: {
    initialState: ToggleState
    disabled?: boolean
    forceRing?: boolean
    content: ContentProps
    appearance: AppearanceProps
    interaction: InteractionProps
}) {
    const [state, setState] = useState<ToggleState>(initialState)

    return (
        <ToggleField
            state={state}
            onToggle={() => setState((s) => (s === "on" ? "off" : "on"))}
            disabled={!!disabled}
            forceRing={forceRing}
            content={content}
            appearance={appearance}
            interaction={interaction}
        />
    )
}

function ToggleShowcase({
    appearance,
    interaction,
    showcase,
}: {
    appearance: AppearanceProps
    interaction: InteractionProps
    showcase: Props["showcase"]
}) {
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? 0
            setIsMobile(width < 600)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    const rows: { label: string; ring?: boolean; disabled?: boolean }[] = [
        { label: "Default" },
        { label: "Focused", ring: true },
        { label: "Disabled", disabled: true },
    ]

    const panels = [
        {
            bg: showcase.lightBg,
            labelColor: "#111111",
            helperColor: "#6B7280",
            trackOffColor: "#E5E7EB",
            caption: "rgba(17,17,17,0.4)",
            divider: "rgba(17,17,17,0.08)",
        },
        {
            bg: showcase.darkBg,
            labelColor: "#FFFFFF",
            helperColor: "rgba(255,255,255,0.55)",
            trackOffColor: "rgba(255,255,255,0.16)",
            caption: "rgba(255,255,255,0.4)",
            divider: "rgba(255,255,255,0.08)",
        },
    ]

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                overflow: "hidden",
                borderRadius: showcase.radius,
            }}
        >
            {panels.map((panel, idx) => {
                const panelAppearance: AppearanceProps = {
                    ...appearance,
                    labelColor: panel.labelColor,
                    helperColor: panel.helperColor,
                    trackOffColor: panel.trackOffColor,
                }

                return (
                    <div
                        key={idx}
                        style={{
                            flex: 1,
                            backgroundColor: panel.bg,
                            padding: showcase.gap,
                            display: "flex",
                            flexDirection: "column",
                            gap: showcase.gap,
                            boxSizing: "border-box",
                            overflow: "auto",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 14,
                            }}
                        >
                            {rows.map((row) => (
                                <div
                                    key={row.label}
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        gap: showcase.gap,
                                    }}
                                >
                                    {STATES.map((s) => (
                                        <DemoToggleField
                                            key={s}
                                            initialState={s}
                                            disabled={row.disabled}
                                            forceRing={row.ring}
                                            content={{
                                                ...DEMO_CONTENT,
                                                showLabel: false,
                                            }}
                                            appearance={panelAppearance}
                                            interaction={interaction}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div
                            style={{
                                height: 1,
                                backgroundColor: panel.divider,
                            }}
                        />

                        {rows.map((row) => (
                            <div
                                key={row.label}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                        color: panel.caption,
                                        fontFamily: DEMO_FONT.fontFamily,
                                    }}
                                >
                                    {row.label}
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: showcase.gap,
                                    }}
                                >
                                    {STATES.map((s) => (
                                        <DemoToggleField
                                            key={s}
                                            initialState={s}
                                            disabled={row.disabled}
                                            forceRing={row.ring}
                                            content={DEMO_CONTENT}
                                            appearance={panelAppearance}
                                            interaction={interaction}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            })}
        </div>
    )
}

export default function TogglePro(props: Props) {
    const {
        checked,
        previewState,
        demo,
        content,
        appearance,
        interaction,
        showcase,
        onCheckedChange,
    } = props

    const [internalChecked, setInternalChecked] = useState(checked)

    useEffect(() => setInternalChecked(checked), [checked])

    if (demo) {
        return (
            <ToggleShowcase
                appearance={appearance}
                interaction={interaction}
                showcase={showcase}
            />
        )
    }

    const disabled = previewState === "disabled"
    const forceRing = previewState === "focused" ? true : undefined

    const state: ToggleState = internalChecked ? "on" : "off"

    const handleToggle = () => {
        if (disabled) return
        const next = !internalChecked
        setInternalChecked(next)
        onCheckedChange?.(next)
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
            }}
        >
            <ToggleField
                state={state}
                onToggle={handleToggle}
                disabled={disabled}
                forceRing={forceRing}
                content={content}
                appearance={appearance}
                interaction={interaction}
            />
        </div>
    )
}

TogglePro.defaultProps = {
    checked: false,
    previewState: "default" as const,
    demo: false,
    content: {
        label: "Enable notifications",
        showLabel: true,
        position: "right" as const,
        helperText: "Get notified about important updates",
        showHelper: false,
        font: DEMO_FONT,
    },
    appearance: {
        width: 52,
        height: 30,
        padding: 3,
        trackOffColor: "#D1D5DB",
        trackOnColor: "#3B82F6",
        thumbColor: "#FFFFFF",
        labelColor: "#111111",
        helperColor: "#6B7280",
        shadowColor: "rgba(0,0,0,0.15)",
    },
    interaction: {
        ringColor: "rgba(59,130,246,0.25)",
        ringWidth: 3,
        duration: 0.35,
        squish: 0.35,
    },
    showcase: {
        lightBg: "#FFFFFF",
        darkBg: "#0A0A0A",
        gap: 28,
        radius: 20,
    },
}

addPropertyControls(TogglePro, {
    checked: {
        type: ControlType.Boolean,
        title: "Checked",
        defaultValue: false,
        hidden(props) {
            return !!props.demo
        },
    },
    previewState: {
        type: ControlType.Enum,
        title: "State",
        options: ["default", "focused", "disabled"],
        optionTitles: ["Default", "Focused", "Disabled"],
        defaultValue: "default",
        hidden(props) {
            return !!props.demo
        },
    },
    demo: {
        type: ControlType.Boolean,
        title: "Presentation",
        defaultValue: false,
        enabledTitle: "Demo",
        disabledTitle: "Single",
    },

    content: {
        type: ControlType.Object,
        title: "Content",
        hidden(props) {
            return !!props.demo
        },
        controls: {
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Enable notifications",
            },
            showLabel: {
                type: ControlType.Boolean,
                title: "Show Label",
                defaultValue: true,
            },
            position: {
                type: ControlType.Enum,
                title: "Label Position",
                options: ["right", "left"],
                optionTitles: ["Right", "Left"],
                defaultValue: "right",
                displaySegmentedControl: true,
                hidden(props) {
                    return !props.showLabel
                },
            },
            showHelper: {
                type: ControlType.Boolean,
                title: "Helper Text",
                defaultValue: false,
                hidden(props) {
                    return !props.showLabel
                },
            },
            helperText: {
                type: ControlType.String,
                title: "Helper",
                defaultValue: "Get notified about important updates",
                displayTextArea: true,
                hidden(props) {
                    return !props.showLabel || !props.showHelper
                },
            },
            font: {
                type: ControlType.Font,
                title: "Font",
                controls: "extended",
                defaultValue: {
                    fontSize: 14,
                    lineHeight: 1.3,
                    letterSpacing: "-0.01em",
                },
                hidden(props) {
                    return !props.showLabel
                },
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 52,
                min: 32,
                max: 120,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                defaultValue: 30,
                min: 18,
                max: 64,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            padding: {
                type: ControlType.Number,
                title: "Inset",
                defaultValue: 3,
                min: 0,
                max: 10,
                step: 0.5,
                displayStepper: true,
            },
            trackOnColor: {
                type: ControlType.Color,
                title: "On Color",
                defaultValue: "#3B82F6",
            },
            thumbColor: {
                type: ControlType.Color,
                title: "Thumb",
                defaultValue: "#FFFFFF",
            },
            trackOffColor: {
                type: ControlType.Color,
                title: "Off Color",
                defaultValue: "#D1D5DB",
                hidden(_props, rootProps) {
                    return !!rootProps.demo
                },
            },
            labelColor: {
                type: ControlType.Color,
                title: "Label",
                defaultValue: "#111111",
                hidden(_props, rootProps) {
                    return !!rootProps.demo
                },
            },
            helperColor: {
                type: ControlType.Color,
                title: "Helper",
                defaultValue: "#6B7280",
                hidden(_props, rootProps) {
                    return !!rootProps.demo
                },
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Shadow",
                defaultValue: "rgba(0,0,0,0.15)",
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            ringColor: {
                type: ControlType.Color,
                title: "Ring Color",
                defaultValue: "rgba(59,130,246,0.25)",
            },
            ringWidth: {
                type: ControlType.Number,
                title: "Ring Width",
                defaultValue: 3,
                min: 0,
                max: 8,
                step: 0.5,
                displayStepper: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.35,
                min: 0.1,
                max: 0.8,
                step: 0.01,
                unit: "s",
                displayStepper: true,
            },
            squish: {
                type: ControlType.Number,
                title: "Squish",
                defaultValue: 0.35,
                min: 0,
                max: 1,
                step: 0.05,
                displayStepper: true,
            },
        },
    },

    showcase: {
        type: ControlType.Object,
        title: "Showcase",
        hidden(props) {
            return !props.demo
        },
        controls: {
            lightBg: {
                type: ControlType.Color,
                title: "Light BG",
                defaultValue: "#FFFFFF",
            },
            darkBg: {
                type: ControlType.Color,
                title: "Dark BG",
                defaultValue: "#0A0A0A",
            },
            gap: {
                type: ControlType.Number,
                title: "Spacing",
                defaultValue: 28,
                min: 8,
                max: 80,
                step: 1,
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 20,
                min: 0,
                max: 60,
                step: 1,
                displayStepper: true,
            },
        },
    },

    onCheckedChange: {
        type: ControlType.EventHandler,
        title: "On Change",
        hidden(props) {
            return !!props.demo
        },
    },
})
