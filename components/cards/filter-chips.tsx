import * as React from "react"
import {
    motion,
    AnimatePresence,
    LayoutGroup,
    useReducedMotion,
} from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Theme = "dark" | "light"
type Size = "sm" | "md" | "lg"

const PALETTES = {
    dark: {
        text: "#F5F4F1",
        muted: "rgba(245,244,241,0.55)",
        faint: "rgba(245,244,241,0.32)",
        border: "rgba(255,255,255,0.13)",
        sel: "#F5F4F1",
        onSel: "#0A0A0A",
        panel: "#0E0E0E",
        panelBorder: "rgba(255,255,255,0.1)",
        line: "rgba(255,255,255,0.06)",
        toolbar: "#1A1A1A",
        toolbarBorder: "rgba(255,255,255,0.08)",
        focus: "rgba(245,244,241,0.85)",
    },
    light: {
        text: "#0A0A0A",
        muted: "rgba(10,10,10,0.55)",
        faint: "rgba(10,10,10,0.32)",
        border: "rgba(10,10,10,0.15)",
        sel: "#0A0A0A",
        onSel: "#FFFFFF",
        panel: "#FFFFFF",
        panelBorder: "rgba(10,10,10,0.1)",
        line: "rgba(10,10,10,0.06)",
        toolbar: "#F5F5F5",
        toolbarBorder: "rgba(0,0,0,0.08)",
        focus: "rgba(10,10,10,0.85)",
    },
}

const JOBS = [
    {
        title: "Senior Product Designer",
        team: "Design",
        place: "Remote",
        type: "Full-time",
    },
    {
        title: "Frontend Engineer",
        team: "Engineering",
        place: "Remote",
        type: "Full-time",
    },
    {
        title: "Brand Designer",
        team: "Design",
        place: "Berlin",
        type: "Contract",
    },
    {
        title: "Platform Engineer",
        team: "Engineering",
        place: "Berlin",
        type: "Full-time",
    },
    {
        title: "Content Designer",
        team: "Design",
        place: "Remote",
        type: "Contract",
    },
    {
        title: "Data Engineer",
        team: "Engineering",
        place: "London",
        type: "Full-time",
    },
    {
        title: "Growth Marketer",
        team: "Marketing",
        place: "London",
        type: "Full-time",
    },
]

const FACETS = [
    "Remote",
    "Design",
    "Engineering",
    "Full-time",
    "Contract",
] as const
const tagsOf = (j: (typeof JOBS)[number]) => [j.team, j.place, j.type]

interface Props {
    demoMode?: boolean
    theme?: Theme
    size?: Size
    showCounts?: boolean
    disabled?: boolean
    style?: React.CSSProperties
}

interface SegmentOption {
    value: string
    label: string
}

interface SegmentProps {
    label: string
    value: string
    options: SegmentOption[]
    onChange: (value: string) => void
    theme: Theme
}

interface ToggleProps {
    label: string
    value: boolean
    onChange: (value: boolean) => void
    theme: Theme
}

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function OpenRolesDemo(props: Props) {
    const {
        demoMode = true,
        theme: propTheme = "light",
        size: propSize = "md",
        showCounts: propShowCounts = true,
        disabled: propDisabled = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const [theme, setTheme] = React.useState<Theme>(propTheme)
    const [size, setSize] = React.useState<Size>(propSize)
    const [showCounts, setShowCounts] = React.useState(propShowCounts)
    const [disabled, setDisabled] = React.useState(propDisabled)

    React.useEffect(() => setTheme(propTheme), [propTheme])
    React.useEffect(() => setSize(propSize), [propSize])
    React.useEffect(() => setShowCounts(propShowCounts), [propShowCounts])
    React.useEffect(() => setDisabled(propDisabled), [propDisabled])

    const p = PALETTES[theme]
    const reduce = isStatic || Boolean(useReducedMotion())
    const [sel, setSel] = React.useState<string[]>(["Remote"])
    const chipsRef = React.useRef<(HTMLButtonElement | null)[]>([])

    const groups = React.useMemo(
        () => [
            ["Design", "Engineering"],
            ["Full-time", "Contract"],
            ["Remote"],
        ],
        []
    )
    const shown = React.useMemo(
        () =>
            JOBS.filter((j) =>
                groups.every((g) => {
                    const picked = g.filter((x) => sel.includes(x))
                    return (
                        picked.length === 0 ||
                        picked.some((x) => tagsOf(j).includes(x))
                    )
                })
            ),
        [sel, groups]
    )

    const countFor = React.useCallback(
        (f: string) => JOBS.filter((j) => tagsOf(j).includes(f)).length,
        []
    )

    const chipHeight = size === "sm" ? 28 : size === "lg" ? 40 : 34
    const font = size === "sm" ? 12 : size === "lg" ? 15 : 13.5
    const spring = reduce
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 520, damping: 36 }

    const commit = (next: string[]) => setSel(next)
    const toggle = (v: string) =>
        commit(sel.includes(v) ? sel.filter((x) => x !== v) : [...sel, v])

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (disabled) return
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault()
            const next = (index + 1) % FACETS.length
            chipsRef.current[next]?.focus()
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault()
            const prev = (index - 1 + FACETS.length) % FACETS.length
            chipsRef.current[prev]?.focus()
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault()
            toggle(FACETS[index])
        }
    }

    const Segment: React.FC<SegmentProps> = ({
        label,
        value,
        options,
        onChange,
        theme,
    }) => {
        const refs = React.useRef<(HTMLButtonElement | null)[]>([])

        const onKeyDown = (e: React.KeyboardEvent, index: number) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault()
                const next = (index + 1) % options.length
                refs.current[next]?.focus()
                onChange(options[next].value)
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault()
                const prev = (index - 1 + options.length) % options.length
                refs.current[prev]?.focus()
                onChange(options[prev].value)
            } else if (e.key === " " || e.key === "Enter") {
                e.preventDefault()
                onChange(options[index].value)
            }
        }

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                    style={{
                        fontSize: 10,
                        letterSpacing: 0.5,
                        color: p.muted,
                        fontWeight: 600,
                        textTransform: "uppercase",
                    }}
                >
                    {label}
                </span>
                <div
                    role="radiogroup"
                    aria-label={label}
                    style={{
                        display: "flex",
                        background:
                            theme === "dark"
                                ? "rgba(255,255,255,0.06)"
                                : "rgba(0,0,0,0.05)",
                        borderRadius: 999,
                        padding: 3,
                    }}
                >
                    {options.map((opt, index) => (
                        <button
                            key={opt.value}
                            ref={(el) => (refs.current[index] = el)}
                            role="radio"
                            aria-checked={value === opt.value}
                            tabIndex={value === opt.value ? 0 : -1}
                            onClick={() => onChange(opt.value)}
                            onKeyDown={(e) => onKeyDown(e, index)}
                            style={{
                                padding: "4px 12px",
                                borderRadius: 999,
                                border: "none",
                                fontSize: 12.5,
                                fontWeight: 500,
                                cursor: "pointer",
                                background:
                                    value === opt.value
                                        ? theme === "dark"
                                            ? "#F5F4F1"
                                            : "#0A0A0A"
                                        : "transparent",
                                color:
                                    value === opt.value
                                        ? theme === "dark"
                                            ? "#0A0A0A"
                                            : "#FFFFFF"
                                        : p.text,
                                outline: "none",
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    const Toggle: React.FC<ToggleProps> = ({
        label,
        value,
        onChange,
        theme,
    }) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
                style={{
                    fontSize: 10,
                    letterSpacing: 0.5,
                    color: p.muted,
                    fontWeight: 600,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </span>
            <button
                role="switch"
                aria-checked={value}
                aria-label={label}
                onClick={() => onChange(!value)}
                onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                        e.preventDefault()
                        onChange(!value)
                    }
                }}
                style={{
                    width: 36,
                    height: 20,
                    borderRadius: 999,
                    border: "none",
                    background: value
                        ? theme === "dark"
                            ? "#F5F4F1"
                            : "#0A0A0A"
                        : theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.12)",
                    position: "relative",
                    cursor: "pointer",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 2,
                        left: value ? 18 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: value
                            ? theme === "dark"
                                ? "#0A0A0A"
                                : "#FFFFFF"
                            : "#888",
                        transition: reduce ? "none" : "left 0.15s ease",
                    }}
                />
            </button>
        </div>
    )

    return (
        <section
            aria-label="Open roles filter demo"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                width: "100%",
                ...style,
            }}
        >
            {demoMode && (
                <div
                    role="toolbar"
                    aria-label="Demo customization controls"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "10px 14px",
                        background: p.toolbar,
                        border: `1px solid ${p.toolbarBorder}`,
                        borderRadius: 16,
                        flexWrap: "wrap",
                    }}
                >
                    <Segment
                        label="Size"
                        value={size}
                        options={[
                            { value: "sm", label: "S" },
                            { value: "md", label: "M" },
                            { value: "lg", label: "L" },
                        ]}
                        onChange={setSize}
                        theme={theme}
                    />
                    <Segment
                        label="Theme"
                        value={theme}
                        options={[
                            { value: "dark", label: "Dark" },
                            { value: "light", label: "Light" },
                        ]}
                        onChange={setTheme}
                        theme={theme}
                    />
                    <Toggle
                        label="Counts"
                        value={showCounts}
                        onChange={setShowCounts}
                        theme={theme}
                    />
                    <Toggle
                        label="Disabled"
                        value={disabled}
                        onChange={setDisabled}
                        theme={theme}
                    />
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    padding: 18,
                    borderRadius: 18,
                    background: p.panel,
                    border: `1px solid ${p.panelBorder}`,
                    fontFamily: "Inter, system-ui, sans-serif",
                    color: p.text,
                    opacity: disabled ? 0.5 : 1,
                    pointerEvents: disabled ? "none" : "auto",
                }}
            >
                <header
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                    }}
                >
                    <h2 style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>
                        Open roles
                    </h2>
                    <span
                        style={{
                            fontSize: 12.5,
                            color: p.muted,
                            fontVariantNumeric: "tabular-nums",
                        }}
                        aria-live="polite"
                    >
                        {shown.length} of {JOBS.length}
                    </span>
                </header>

                <LayoutGroup>
                    <div
                        role="group"
                        aria-label="Filter by category"
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        {FACETS.map((f, index) => {
                            const on = sel.includes(f)
                            const count = countFor(f)
                            return (
                                <motion.button
                                    key={f}
                                    ref={(el) => (chipsRef.current[index] = el)}
                                    layout="position"
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`${f}${showCounts ? `, ${count} roles` : ""}`}
                                    disabled={disabled}
                                    onClick={() => toggle(f)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    whileTap={
                                        reduce || disabled
                                            ? undefined
                                            : { scale: 0.95 }
                                    }
                                    transition={spring}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        height: chipHeight,
                                        padding: `0 ${size === "sm" ? 11 : 13}px`,
                                        fontSize: font,
                                        fontWeight: 500,
                                        color: on ? p.onSel : p.text,
                                        background: on ? p.sel : "transparent",
                                        border: `1px solid ${on ? p.sel : p.border}`,
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        outline: "none",
                                        transition: reduce
                                            ? "none"
                                            : "background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease",
                                    }}
                                >
                                    <motion.span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            overflow: "hidden",
                                        }}
                                        initial={false}
                                        animate={{
                                            width: on ? font + 5 : 0,
                                            opacity: on ? 1 : 0,
                                        }}
                                        transition={spring}
                                        aria-hidden
                                    >
                                        <svg
                                            width={font}
                                            height={font}
                                            viewBox="0 0 12 12"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.9"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ flexShrink: 0 }}
                                        >
                                            <motion.path
                                                d="M2.4 6.3 4.9 8.7 9.6 3.4"
                                                initial={false}
                                                animate={{
                                                    pathLength: on ? 1 : 0,
                                                }}
                                                transition={{
                                                    duration: reduce ? 0 : 0.22,
                                                    delay:
                                                        on && !reduce
                                                            ? 0.06
                                                            : 0,
                                                }}
                                            />
                                        </svg>
                                    </motion.span>
                                    {f}
                                    {showCounts && (
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                fontSize: font - 1.5,
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                                color: on
                                                    ? `color-mix(in srgb, ${p.onSel} 55%, transparent)`
                                                    : p.faint,
                                            }}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </motion.button>
                            )
                        })}

                        <AnimatePresence initial={false} mode="popLayout">
                            {sel.length > 0 && (
                                <motion.button
                                    key="clear"
                                    layout="position"
                                    type="button"
                                    onClick={() => commit([])}
                                    aria-label={`Clear ${sel.length} active filter${sel.length === 1 ? "" : "s"}`}
                                    initial={
                                        reduce
                                            ? false
                                            : { opacity: 0, scale: 0.8 }
                                    }
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={
                                        reduce
                                            ? { opacity: 0 }
                                            : { opacity: 0, scale: 0.8 }
                                    }
                                    transition={spring}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        height: chipHeight,
                                        padding: "0 10px",
                                        gap: 5,
                                        fontSize: font,
                                        fontWeight: 500,
                                        color: p.muted,
                                        background: "transparent",
                                        border: "none",
                                        borderRadius: 999,
                                        cursor: "pointer",
                                    }}
                                >
                                    <svg
                                        width="11"
                                        height="11"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        aria-hidden
                                    >
                                        <path d="M3 3l6 6M9 3L3 9" />
                                    </svg>
                                    Clear
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </LayoutGroup>

                <div
                    role="list"
                    aria-label="Filtered job listings"
                    style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: 5 * 52,
                        overflowY: "auto",
                        scrollbarWidth: "thin",
                    }}
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {shown.map((j) => (
                            <motion.article
                                key={j.title}
                                layout
                                role="listitem"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    height: 52,
                                    borderTop: `1px solid ${p.line}`,
                                    gap: 12,
                                    flexShrink: 0,
                                }}
                                initial={reduce ? false : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={
                                    reduce
                                        ? { opacity: 0 }
                                        : { opacity: 0, scale: 0.97 }
                                }
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : {
                                              type: "spring",
                                              stiffness: 480,
                                              damping: 38,
                                          }
                                }
                            >
                                <span
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 500,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {j.title}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: p.muted,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {j.team} · {j.place}
                                    </span>
                                </span>
                                <span
                                    style={{
                                        flexShrink: 0,
                                        fontSize: 11.5,
                                        fontWeight: 500,
                                        padding: "3px 8px",
                                        borderRadius: 999,
                                        border: `1px solid ${p.border}`,
                                        color: p.muted,
                                    }}
                                >
                                    {j.type}
                                </span>
                            </motion.article>
                        ))}
                    </AnimatePresence>

                    {shown.length === 0 && (
                        <div
                            role="status"
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                color: p.faint,
                            }}
                        >
                            No roles match these filters
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                button:focus-visible {
                    outline: 2px solid ${p.focus};
                    outline-offset: 2px;
                }
            `}</style>
        </section>
    )
}

OpenRolesDemo.defaultProps = {
    demoMode: true,
    theme: "light",
    size: "md",
    showCounts: true,
    disabled: false,
}

addPropertyControls(OpenRolesDemo, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Shows live customization toolbar",
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["light", "dark"],
        optionTitles: ["Light", "Dark"],
        defaultValue: "light",
        displaySegmentedControl: true,
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["sm", "md", "lg"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "md",
        displaySegmentedControl: true,
    },
    showCounts: {
        type: ControlType.Boolean,
        title: "Show Counts",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
})
