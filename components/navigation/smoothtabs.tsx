// SmoothTabs.tsx
import * as React from "react"
import { motion, LayoutGroup } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Justify = "start" | "center" | "end"
type Tab = { label: string }

type Props = {
    items: Tab[]
    initialIndex: number
    controlled: boolean
    controlledIndex?: number
    onChange?: (i: number) => void
    align: Justify
    gap: number
    panelGap: number
    containerPadding: string
    scrollOnOverflow: boolean
    autoCenterActive: boolean
    barBg: string
    barBorder: string
    barPadding: string
    radius: string
    barShadow?: string
    tabPadding: string
    inactiveColor: string
    activeColor: string
    pillColor: string
    pillInset: number
    pillShadow?: string
    layoutScope: string
    font: any
    transition: any
    showPanels: boolean
    panels?: React.ReactNode[]
    width?: number
    height?: number
    uiBar?: {
        barBg?: string
        barBorder?: string
        barPadding?: string
        radius?: string
        barShadow?: string
        pillColor?: string
        pillInset?: number
        pillShadow?: string
    }
    uiTabs?: {
        tabPadding?: string
        inactiveColor?: string
        activeColor?: string
    }
    style?: React.CSSProperties
}

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */

export default function SmoothTabs(props: Props) {
    const isStatic = useIsStaticRenderer()
    const reactId = (React as any).useId?.() ?? String(Math.random()).slice(2)

    const {
        items = [],
        initialIndex,
        controlled,
        controlledIndex,
        onChange,
        align,
        gap,
        panelGap,
        containerPadding,
        layoutScope,
        pillColor: _pillColor,
        pillInset: _pillInset,
        pillShadow: _pillShadow,
        font,
        transition,
        panels = [],
    } = props

    const showPanels = props.showPanels
    const scrollOnOverflow = props.scrollOnOverflow

    // visuals (allow group overrides)
    let { barBg, barBorder, barPadding, radius, barShadow } = props
    let { tabPadding, inactiveColor, activeColor } = props
    let pillColor = _pillColor
    let pillInset = _pillInset
    let pillShadow = _pillShadow

    if (props.uiBar) {
        barBg = props.uiBar.barBg ?? barBg
        barBorder = props.uiBar.barBorder ?? barBorder
        barPadding = props.uiBar.barPadding ?? barPadding
        radius = props.uiBar.radius ?? radius
        barShadow = props.uiBar.barShadow ?? barShadow
        pillColor = props.uiBar.pillColor ?? pillColor
        pillInset = props.uiBar.pillInset ?? pillInset
        pillShadow = props.uiBar.pillShadow ?? pillShadow
    }
    if (props.uiTabs) {
        tabPadding = props.uiTabs.tabPadding ?? tabPadding
        inactiveColor = props.uiTabs.inactiveColor ?? inactiveColor
        activeColor = props.uiTabs.activeColor ?? activeColor
    }

    // state (back-compat)
    const safeInitial = clamp(initialIndex, 0, Math.max(items.length - 1, 0))
    const [internal, setInternal] = React.useState(safeInitial)
    const isControlled = controlled && typeof controlledIndex === "number"
    React.useEffect(() => {
        if (!isControlled)
            setInternal(clamp(initialIndex, 0, Math.max(items.length - 1, 0)))
    }, [initialIndex, items.length, isControlled])

    const current = clamp(
        isControlled ? (controlledIndex as number) : internal,
        0,
        Math.max(items.length - 1, 0)
    )

    const outerJustify: React.CSSProperties["justifyContent"] =
        align === "start"
            ? "flex-start"
            : align === "end"
              ? "flex-end"
              : "center"

    const textStyle = React.useMemo(() => toFontCSS(font), [font])

    // per-instance scope (avoids pill “teleporting” across instances)
    const baseScope = layoutScope || "default"
    const scope = `${baseScope}-${reactId}`
    const scrollerClass = React.useMemo(() => `st-scroll-${scope}`, [scope])

    // Always-on min height so Canvas == Preview
    const alwaysMinHeight: React.CSSProperties = showPanels
        ? { minHeight: 200 }
        : {}

    // ids for a11y
    const makeTabId = React.useCallback(
        (i: number) => `tab-${scope}-${i}`,
        [scope]
    )
    const makePanelId = React.useCallback(
        (i: number) => `panel-${scope}-${i}`,
        [scope]
    )

    // screenreader status
    const total = Math.max(items.length, 0)
    const currentLabel = total > 0 && items[current]?.label
    const announcement =
        total > 0 && currentLabel
            ? `Tab ${current + 1} of ${total}: ${currentLabel}`
            : "No tabs"

    const hasPanels = panels.length > 0

    return (
        <div
            style={{
                ...(props.style || {}),
                ...alwaysMinHeight,
                width: "100%",
                height: "100%", // definite height (Fixed)
                display: "grid",
                gridTemplateRows: showPanels
                    ? `auto ${panelGap}px 1fr`
                    : "auto",
                alignContent: "start",
                boxSizing: "border-box",
                minWidth: 0,
                padding: containerPadding,
            }}
        >
            {/* Hide horizontal scrollbar across engines */}
            <style
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                    __html: `
.${scrollerClass}{scrollbar-width:none;-ms-overflow-style:none}
.${scrollerClass}::-webkit-scrollbar{display:none;width:0;height:0}
`,
                }}
            />

            {/* SR-only live region */}
            <div
                aria-live="polite"
                role="status"
                style={{
                    position: "absolute",
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: "hidden",
                    clip: "rect(0 0 0 0)",
                    whiteSpace: "nowrap",
                    border: 0,
                }}
            >
                {announcement}
            </div>

            <LayoutGroup id={`group-${scope}`}>
                {/* Alignment row */}
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: outerJustify,
                        alignItems: "stretch",
                        boxSizing: "border-box",
                        minWidth: 0,
                    }}
                >
                    {/* SCROLLER — tabs bar is Hug (max-content) inside */}
                    <div
                        className={scrollerClass}
                        style={{
                            width: "100%",
                            minWidth: 0,
                            overflowX: scrollOnOverflow ? "auto" : "hidden",
                            overflowY: "hidden",
                            WebkitOverflowScrolling: "touch" as any,
                            touchAction: "pan-x",
                            overscrollBehaviorX: "contain",
                            display: "flex",
                            justifyContent:
                                align === "start"
                                    ? "flex-start"
                                    : align === "end"
                                      ? "flex-end"
                                      : "center",
                            boxSizing: "border-box",
                            borderRadius: radius,
                        }}
                    >
                        {/* BAR */}
                        <div
                            role="tablist"
                            aria-orientation="horizontal"
                            style={{
                                width: "max-content",
                                borderRadius: radius,
                                background: barBg,
                                border: `1px solid ${barBorder}`,
                                boxShadow: barShadow,
                                position: "relative",
                                boxSizing: "border-box",
                            }}
                        >
                            {/* RAIL */}
                            <div
                                style={{
                                    width: "max-content",
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "stretch",
                                    gap,
                                    padding: barPadding,
                                    boxSizing: "border-box",
                                }}
                            >
                                {items.map((t, i) => {
                                    const selected = i === current
                                    const tabId = makeTabId(i)
                                    const panelId = makePanelId(i)
                                    return (
                                        <button
                                            key={i}
                                            role="tab"
                                            id={tabId}
                                            aria-selected={selected}
                                            aria-controls={panelId}
                                            onClick={() => {
                                                if (!isControlled)
                                                    setInternal(i)
                                                onChange?.(i)
                                            }}
                                            type="button"
                                            style={{
                                                position: "relative",
                                                appearance: "none",
                                                border: 0,
                                                background: "transparent",
                                                cursor: "pointer",
                                                userSelect: "none",
                                                outline: "none",
                                                padding: tabPadding,
                                                borderRadius: radius,
                                                flex: "0 0 auto",
                                                minWidth: 0,
                                                whiteSpace: "nowrap",
                                                touchAction: "manipulation",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {selected && (
                                                <motion.div
                                                    layoutId={`pill-${scope}`}
                                                    transition={
                                                        isStatic
                                                            ? { duration: 0 }
                                                            : transition
                                                    }
                                                    style={{
                                                        position: "absolute",
                                                        top: pillInset,
                                                        bottom: pillInset,
                                                        left: pillInset,
                                                        right: pillInset,
                                                        borderRadius: "inherit",
                                                        background: pillColor,
                                                        boxShadow: pillShadow,
                                                        zIndex: 0,
                                                        pointerEvents: "none",
                                                    }}
                                                />
                                            )}
                                            <span
                                                style={{
                                                    position: "relative",
                                                    zIndex: 1,
                                                    ...textStyle,
                                                    color: selected
                                                        ? activeColor
                                                        : inactiveColor,
                                                }}
                                            >
                                                {t.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </LayoutGroup>

            {/* Spacer */}
            {showPanels && <div />}

            {/* Panels area */}
            {showPanels && (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        boxSizing: "border-box",
                        minWidth: 0,
                        overflow: "hidden",
                        borderRadius: radius,
                    }}
                >
                    {hasPanels ? (
                        // Normal panels
                        items.map((_, i) => {
                            const tabId = makeTabId(i)
                            const panelId = makePanelId(i)
                            return (
                                <div
                                    key={panelId}
                                    id={panelId}
                                    role="tabpanel"
                                    aria-labelledby={tabId}
                                    style={{
                                        display:
                                            i === current ? "block" : "none",
                                        width: "100%",
                                        height: "100%",
                                        overflow: "hidden",
                                        position: "absolute",
                                        inset: 0,
                                        pointerEvents:
                                            i === current ? "auto" : "none",
                                        boxSizing: "border-box",
                                        minWidth: 0,
                                    }}
                                >
                                    <FillSlot child={panels[i] ?? null} />
                                </div>
                            )
                        })
                    ) : (
                        // Empty state when no panels are connected
                        <EmptyState radius={radius} fontStyle={textStyle} />
                    )}
                </div>
            )}
        </div>
    )
}

/* Empty state (shown when showPanels && panels.length === 0) */
function EmptyState({
    radius,
    fontStyle,
}: {
    radius: string
    fontStyle: React.CSSProperties
}) {
    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: 24,
                boxSizing: "border-box",
                background: "rgba(103, 80, 255, 0.06)", // soft lilac like Framer's hint
                border: "1px solid rgba(103, 80, 255, 0.12)",
                borderRadius: radius,
                userSelect: "none",
            }}
        >
            <div style={{ fontSize: 40, lineHeight: "1em", marginBottom: 12 }}>
                ➕
            </div>
            <div style={{ ...fontStyle, fontWeight: 600, opacity: 0.9 }}>
                Connect to Content
            </div>
            <div
                style={{
                    ...fontStyle,
                    opacity: 0.7,
                    marginTop: 6,
                    maxWidth: 520,
                }}
            >
                Add layers or components to make tab panels.
            </div>
        </div>
    )
}

/* Panels sized like Slideshow — no measuring, just stretch child to the box */
function FillSlot({ child }: { child: React.ReactNode }) {
    const childEl = React.isValidElement(child)
        ? React.cloneElement(child as any, {
              style: {
                  ...((child as any).props?.style ?? {}),
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  height: "100%",
                  boxSizing: "border-box",
              } as React.CSSProperties,
          })
        : child

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                minWidth: 0,
                boxSizing: "border-box",
            }}
        >
            {childEl}
        </div>
    )
}

/* Utils */
function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}
function toFontCSS(f: any): React.CSSProperties {
    if (!f) return {}
    if (typeof f === "string") return { fontFamily: f }
    const out: React.CSSProperties = {}
    const pick = (...keys: string[]) =>
        keys.find((k) => f?.[k] !== undefined)
            ? f[keys.find((k) => f?.[k] !== undefined)!]
            : undefined
    out.fontFamily = pick("fontFamily", "family")
    out.fontWeight = pick("fontWeight", "weight")
    out.fontStyle = pick("fontStyle", "style")
    out.fontSize = pick("fontSize", "size")
    out.lineHeight = pick("lineHeight")
    out.letterSpacing = pick("letterSpacing")
    out.textTransform = pick("textTransform")
    out.textDecoration = pick("textDecoration")
    return out
}

/* Defaults — tuned palette and sensible layout */
;(SmoothTabs as any).defaultProps = {
    width: 400,
    height: 200, // definite height; users can drag-resize
    items: [
        { label: "Tab 1" },
        { label: "Tab 2" },
        { label: "Tab 3" },
        { label: "Tab 4" },
    ],
    initialIndex: 0,
    controlled: false,

    align: "center" as Justify,
    gap: 2,
    panelGap: 27,
    containerPadding: "16px",

    scrollOnOverflow: true,
    autoCenterActive: false,

    // Bar
    barBg: "#F5F5FF",
    barBorder: "#D4D4D4",
    barPadding: "4px",
    radius: "30px",
    barShadow: undefined,

    // Tabs
    tabPadding: "12px 20px 12px 20px",
    inactiveColor: "#89899A",
    activeColor: "#232329",

    // Highlight pill
    pillColor: "#FFFFFF",
    pillInset: 0,
    pillShadow: "0 1px 2px rgba(0,0,0,0.06)",

    transition: { type: "spring", stiffness: 600, damping: 40, mass: 0.4 },
    layoutScope: "default",
    showPanels: true,
}

/* Property controls — explicit defaults so Canvas == Preview on insert */
addPropertyControls(SmoothTabs as any, {
    items: {
        type: ControlType.Array,
        title: "Tabs",
        description: "Add labels (order here = order in the bar).",
        defaultValue: [
            { label: "Tab 1" },
            { label: "Tab 2" },
            { label: "Tab 3" },
            { label: "Tab 4" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Tab",
                },
            },
        },
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["start", "center", "end"],
        optionTitles: ["Start", "Center", "End"],
        displaySegmentedControl: true,
        defaultValue: "center",
        description: "Horizontal alignment of the tabs.",
    },
    gap: {
        type: ControlType.Number,
        title: "Tab Gap",
        min: 0,
        step: 1,
        unit: "px",
        displayStepper: true,
        defaultValue: 2,
        description: "Space between tab buttons.",
    },
    panelGap: {
        type: ControlType.Number,
        title: "Panel Gap",
        min: 0,
        step: 1,
        unit: "px",
        displayStepper: true,
        defaultValue: 27,
        description: "Space between bar and panel.",
    },
    containerPadding: {
        type: ControlType.Padding,
        title: "Container Padding",
        description: "Inner padding applied to the component.",
        defaultValue: "16px",
    },
    uiBar: {
        type: ControlType.Object,
        title: "Bar",
        description: "Visual styles of the bar and the highlight.",
        controls: {
            barBg: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#F5F5FF",
            },
            barBorder: {
                type: ControlType.Color,
                title: "Border",
                defaultValue: "#D4D4D4",
            },
            barPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "4px",
            },
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "30px",
            },
            barShadow: { type: ControlType.BoxShadow, title: "Shadow" },
            pillColor: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#FFFFFF",
            },
            pillInset: {
                type: ControlType.Number,
                title: "Highlight Inset",
                min: 0,
                step: 1,
                unit: "px",
                displayStepper: true,
                defaultValue: 0,
            },
            pillShadow: {
                type: ControlType.BoxShadow,
                title: "Highlight Shadow",
                defaultValue: "0 1px 2px rgba(0,0,0,0.06)",
            },
        },
    },
    uiTabs: {
        type: ControlType.Object,
        title: "Tabs (Style)",
        description: "Padding and text colors for tab buttons.",
        controls: {
            tabPadding: {
                type: ControlType.Padding,
                title: "Padding",
                defaultValue: "12px 20px 12px 20px",
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inactive Text",
                defaultValue: "#89899A",
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active Text",
                defaultValue: "#232329",
            },
        },
    },
    panels: {
        type: ControlType.Array,
        title: "Panels",
        description: "Connect frames in the same order as your tabs.",
        control: { type: ControlType.ComponentInstance },
        maxCount: 20,
    },
    onChange: {
        type: ControlType.EventHandler,
        title: "onChange",
        description: "Callback with the new tab index.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        description: "Typeface, weight, size, line height, etc.",
    },
    transition: {
        type: ControlType.Transition,
        title: "Transition",
        description: "Spring for the highlight animation.",
    },
})
