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

type CheckState = "unchecked" | "checked"

interface ContentProps {
    label: string
    showLabel: boolean
    optionalText: boolean
    required: boolean
    showInfo: boolean
    infoText: string
    helperText: string
    showHelper: boolean
}

interface AppearanceProps {
    style: "checkbox" | "toggle"
    size: number
    radius: number
    borderWidth: number
    borderColor: string
    accentColor: string
    checkColor: string
    labelColor: string
    helperColor: string
    mutedColor: string
    requiredColor: string
}

interface InteractionProps {
    ringColor: string
    ringWidth: number
    duration: number
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

function InfoIcon({ color, size = 14 }: { color: string; size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <circle cx="8" cy="8" r="6.75" stroke={color} strokeWidth="1.4" />
            <line
                x1="8"
                y1="7.2"
                x2="8"
                y2="11.2"
                stroke={color}
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            <circle cx="8" cy="4.7" r="0.9" fill={color} />
        </svg>
    )
}

function CheckboxVisual({
    state,
    disabled,
    ring,
    size,
    radius,
    borderWidth,
    borderColor,
    accentColor,
    checkColor,
    ringColor,
    ringWidth,
    duration,
    style,
}: {
    state: CheckState
    disabled: boolean
    ring: boolean
    size: number
    radius: number
    borderWidth: number
    borderColor: string
    accentColor: string
    checkColor: string
    ringColor: string
    ringWidth: number
    duration: number
    style: "checkbox" | "toggle"
}) {
    const isStatic = useIsStaticRenderer()
    const isOn = state !== "unchecked"
    const isToggle = style === "toggle"
    const iconSize = size * (isToggle ? 0.6 : 0.64)
    const checkStrokeWidth = isToggle ? 2.5 : 2
    const animationDuration = isStatic ? 0 : duration

    return (
        <motion.div
            style={{
                position: "relative",
                width: size,
                height: size,
                borderRadius: radius,
                border: `${borderWidth}px solid`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: disabled ? 0.45 : 1,
            }}
            initial={false}
            animate={{
                backgroundColor: isOn ? accentColor : "rgba(0,0,0,0)",
                borderColor: isOn ? accentColor : borderColor,
                boxShadow: ring
                    ? `0 0 0 ${ringWidth}px ${ringColor}`
                    : "0 0 0 0px rgba(0,0,0,0)",
            }}
            whileTap={disabled || isStatic ? undefined : { scale: 0.92 }}
            transition={{ duration: animationDuration }}
        >
            <svg
                width={iconSize}
                height={iconSize}
                viewBox="0 0 16 16"
                style={{ position: "absolute" }}
            >
                <motion.path
                    d="M3 8.2L6.4 11.6L13 4.4"
                    fill="none"
                    stroke={checkColor}
                    strokeWidth={checkStrokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{
                        pathLength: state === "checked" ? 1 : 0,
                        opacity: state === "checked" ? 1 : 0,
                    }}
                    transition={{
                        duration: animationDuration,
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </motion.div>
    )
}

function CheckboxField({
    state,
    onToggle,
    disabled,
    forceRing,
    content,
    appearance,
    interaction,
}: {
    state: CheckState
    onToggle: () => void
    disabled: boolean
    forceRing?: boolean
    content: ContentProps
    appearance: AppearanceProps
    interaction: InteractionProps
}) {
    const [focused, setFocused] = useState(false)

    return (
        <label
            aria-disabled={disabled}
            style={{
                display: "inline-flex",
                alignItems: content.showLabel ? "flex-start" : "center",
                gap: 10,
                fontFamily: "Inter, sans-serif",
                cursor: disabled ? "default" : "pointer",
                userSelect: "none",
            }}
        >
            <div
                style={{
                    position: "relative",
                    flexShrink: 0,
                    width: appearance.size,
                    height: appearance.size,
                }}
            >
                <input
                    type="checkbox"
                    role={appearance.style === "toggle" ? "switch" : undefined}
                    aria-checked={
                        appearance.style === "toggle"
                            ? state === "checked"
                            : undefined
                    }
                    checked={state === "checked"}
                    disabled={disabled}
                    onChange={onToggle}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    aria-label={content.label || "checkbox"}
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
                <CheckboxVisual
                    state={state}
                    disabled={disabled}
                    ring={forceRing ?? focused}
                    size={appearance.size}
                    radius={appearance.radius}
                    borderWidth={appearance.borderWidth}
                    borderColor={appearance.borderColor}
                    accentColor={appearance.accentColor}
                    checkColor={appearance.checkColor}
                    ringColor={interaction.ringColor}
                    ringWidth={interaction.ringWidth}
                    duration={interaction.duration}
                    style={appearance.style}
                />
            </div>
            {content.showLabel && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        paddingTop: Math.max(0, (appearance.size - 18) / 2),
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 600,
                                lineHeight: 1.3,
                                letterSpacing: "-0.01em",
                                color: appearance.labelColor,
                            }}
                        >
                            {content.label}
                        </span>
                        {content.optionalText && (
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 400,
                                    color: appearance.mutedColor,
                                }}
                            >
                                (optional)
                            </span>
                        )}
                        {content.required && (
                            <span
                                style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: appearance.requiredColor,
                                }}
                            >
                                *
                            </span>
                        )}
                        {content.showInfo && (
                            <span
                                title={content.infoText}
                                style={{ display: "flex" }}
                            >
                                <InfoIcon color={appearance.mutedColor} />
                            </span>
                        )}
                    </div>
                    {content.showHelper && (
                        <span
                            style={{
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

const STATES: CheckState[] = ["unchecked", "checked"]

const DEMO_CONTENT: ContentProps = {
    label: "Label",
    showLabel: true,
    optionalText: true,
    required: true,
    showInfo: true,
    infoText: "Additional information about this option",
    helperText: "Helper text",
    showHelper: true,
}

function DemoCheckboxField({
    initialState,
    disabled,
    forceRing,
    content,
    appearance,
    interaction,
}: {
    initialState: CheckState
    disabled?: boolean
    forceRing?: boolean
    content: ContentProps
    appearance: AppearanceProps
    interaction: InteractionProps
}) {
    const [state, setState] = useState<CheckState>(initialState)

    return (
        <CheckboxField
            state={state}
            onToggle={() =>
                setState((s) => (s === "checked" ? "unchecked" : "checked"))
            }
            disabled={!!disabled}
            forceRing={forceRing}
            content={content}
            appearance={appearance}
            interaction={interaction}
        />
    )
}

function CheckboxShowcase({
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
            mutedColor: "#9CA3AF",
            borderColor: "#D1D5DB",
            caption: "rgba(17,17,17,0.4)",
            divider: "rgba(17,17,17,0.08)",
        },
        {
            bg: showcase.darkBg,
            labelColor: "#FFFFFF",
            helperColor: "rgba(255,255,255,0.55)",
            mutedColor: "rgba(255,255,255,0.4)",
            borderColor: "rgba(255,255,255,0.28)",
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
                    mutedColor: panel.mutedColor,
                    borderColor: panel.borderColor,
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
                                        gap: showcase.gap,
                                    }}
                                >
                                    {STATES.map((s) => (
                                        <DemoCheckboxField
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
                                        fontFamily: "Inter, sans-serif",
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
                                        <DemoCheckboxField
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

export default function AnimatedCheckboxUI(props: Props) {
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
            <CheckboxShowcase
                appearance={appearance}
                interaction={interaction}
                showcase={showcase}
            />
        )
    }

    const disabled = previewState === "disabled"
    const forceRing = previewState === "focused" ? true : undefined

    const state: CheckState = internalChecked ? "checked" : "unchecked"

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
            <CheckboxField
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

addPropertyControls(AnimatedCheckboxUI, {
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
                defaultValue: "Accept terms and conditions",
            },
            showLabel: {
                type: ControlType.Boolean,
                title: "Show Label",
                defaultValue: true,
            },
            optionalText: {
                type: ControlType.Boolean,
                title: "(optional)",
                defaultValue: false,
                hidden(props) {
                    return !props.showLabel
                },
            },
            required: {
                type: ControlType.Boolean,
                title: "Required *",
                defaultValue: false,
                hidden(props) {
                    return !props.showLabel
                },
            },
            showInfo: {
                type: ControlType.Boolean,
                title: "Info Icon",
                defaultValue: false,
                hidden(props) {
                    return !props.showLabel
                },
            },
            infoText: {
                type: ControlType.String,
                title: "Info Text",
                defaultValue: "Additional information about this option",
                hidden(props) {
                    return !props.showLabel || !props.showInfo
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
                defaultValue: "We'll only use this to improve your experience",
                displayTextArea: true,
                hidden(props) {
                    return !props.showLabel || !props.showHelper
                },
            },
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Style",
                options: ["checkbox", "toggle"],
                optionTitles: ["Checkbox", "Toggle"],
                defaultValue: "checkbox",
                displaySegmentedControl: true,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                defaultValue: 20,
                min: 12,
                max: 96,
                step: 1,
                unit: "px",
                displayStepper: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                defaultValue: 6,
                min: 0,
                max: 24,
                step: 1,
                displayStepper: true,
            },
            borderWidth: {
                type: ControlType.Number,
                title: "Border",
                defaultValue: 1.5,
                min: 1,
                max: 4,
                step: 0.5,
                displayStepper: true,
            },
            accentColor: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#7C3AED",
            },
            checkColor: {
                type: ControlType.Color,
                title: "Check Icon",
                defaultValue: "#FFFFFF",
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#D1D5DB",
                hidden(_props, rootProps) {
                    return !!rootProps.demo
                },
            },
            requiredColor: {
                type: ControlType.Color,
                title: "Required Mark",
                defaultValue: "#EF4444",
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
            mutedColor: {
                type: ControlType.Color,
                title: "Muted",
                defaultValue: "#9CA3AF",
                hidden(_props, rootProps) {
                    return !!rootProps.demo
                },
            },
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Focus Ring",
        controls: {
            ringColor: {
                type: ControlType.Color,
                title: "Color",
                defaultValue: "rgba(124,58,237,0.25)",
            },
            ringWidth: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 3,
                min: 0,
                max: 8,
                step: 0.5,
                displayStepper: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.18,
                min: 0.05,
                max: 0.6,
                step: 0.01,
                unit: "s",
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
