import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    startTransition,
} from "react"
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

/**
 * BUTTON GROUP V4.4 (Align → Text Fix)
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 */

// --- Shared Align → Flex/Text mapping ---
// Used both for positioning buttons inside the container (wrap mode) and
// for aligning each button's label internally. Lifted out of containerStyle's
// useMemo so buttonStyle can reuse it too (previously duplicated/missing).
const ALIGN_TO_JUSTIFY = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
}

export default function ButtonGroupPro(props) {
    const {
        options,
        multiSelect,
        required,
        layout,
        // Visuals
        font,
        radius,
        padding,
        // Colors
        defaultFill,
        defaultTextColor,
        defaultBorderColor,
        hover,
        selected,
        // Animation
        animation, // Agora é o objeto de transição direto
        // Form
        name,
        style,
        onValueChange,
    } = props

    // Marketplace review fix: disable motion/whileHover/whileTap animations
    // when rendering in a static context (canvas thumbnail, export, PDF, etc.)
    const isStatic = useIsStaticRenderer()

    const [selectedValues, setSelectedValues] = useState([])

    const handleButtonClick = useCallback(
        (value) => {
            startTransition(() => {
                if (multiSelect) {
                    setSelectedValues((prev) =>
                        prev.includes(value)
                            ? prev.filter((v) => v !== value)
                            : [...prev, value]
                    )
                } else {
                    if (!required && selectedValues.includes(value)) {
                        setSelectedValues([])
                    } else {
                        setSelectedValues([value])
                    }
                }
            })
        },
        [multiSelect, required, selectedValues]
    )

    useEffect(() => {
        if (onValueChange) {
            onValueChange(
                multiSelect ? selectedValues : selectedValues[0] || ""
            )
        }
    }, [selectedValues, multiSelect, onValueChange])

    // Layout Logic
    const containerStyle = useMemo(() => {
        const { mode, columns, horizontalAlign, verticalAlign, gapH, gapV } =
            layout

        const alignValue =
            mode === "grid"
                ? horizontalAlign
                : ALIGN_TO_JUSTIFY[horizontalAlign]

        if (mode === "wrap") {
            return {
                display: "flex",
                flexWrap: "wrap",
                gap: `${gapV}px ${gapH}px`,
                width: "100%",
                justifyContent: alignValue,
                alignItems: verticalAlign,
                ...style,
            }
        } else {
            return {
                display: "grid",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gapV}px ${gapH}px`,
                width: "100%",
                justifyItems: alignValue,
                alignItems: verticalAlign,
                ...style,
            }
        }
    }, [layout, style])

    const formValue = multiSelect
        ? selectedValues.join(",")
        : selectedValues[0] || ""

    // Fix: "Align" (layout.horizontalAlign) is "start" | "center" | "end".
    // It was only ever used to position buttons *inside the container*
    // (justifyItems / justifyContent above). The label *inside* each button
    // was hardcoded to justifyContent/textAlign: "center", so changing Align
    // never had any visible effect on the text — this is the reported bug.
    // This matters most in "fill" width mode, where the button already
    // stretches to fill its cell/row, so Align's only remaining job is
    // aligning the label within that stretched button.
    const buttonJustify = ALIGN_TO_JUSTIFY[layout.horizontalAlign] || "center"
    const buttonTextAlign = layout.horizontalAlign || "center" // "start"/"center"/"end" are valid CSS text-align keywords

    return (
        <div style={{ width: "100%" }}>
            <div style={containerStyle}>
                {options.map((option, index) => {
                    const isSelected = selectedValues.includes(option.value)

                    // Color Resolution
                    const currentFill = isSelected ? selected.fill : defaultFill
                    const currentText = isSelected
                        ? selected.textColor
                        : defaultTextColor
                    const currentBorder = isSelected
                        ? selected.borderColor
                        : defaultBorderColor

                    const hoverFill = isSelected
                        ? selected.fill
                        : hover.fill || defaultFill
                    const hoverText = isSelected
                        ? selected.textColor
                        : hover.textColor || defaultTextColor
                    const hoverBorder = isSelected
                        ? selected.borderColor
                        : hover.borderColor || defaultBorderColor

                    const buttonStyle = {
                        padding: padding,
                        borderRadius: radius,
                        borderStyle: "solid",
                        borderWidth: 1,
                        cursor: isStatic ? "default" : "pointer",
                        minHeight: "36px",
                        outline: "none",
                        // Static fallback needs the resolved colors set directly,
                        // since there is no animate() driving them.
                        backgroundColor: currentFill,
                        color: currentText,
                        borderColor: currentBorder,
                        flexGrow:
                            layout.mode === "wrap" && layout.width === "fill"
                                ? 1
                                : 0,
                        width:
                            layout.mode === "grid" && layout.width === "fill"
                                ? "100%"
                                : "auto",
                        ...font,
                        display: "flex",
                        alignItems: "center",
                        // Was hardcoded to "center" — now follows the Align control.
                        justifyContent: buttonJustify,
                        textAlign: buttonTextAlign,
                        // Needed so the visually-hidden "(selected)" span in the
                        // static fallback positions relative to this element.
                        position: "relative",
                    }

                    // ─── Static Fallback (thumbnail / export) ───
                    // Plain, non-animated element: no spring/tween loop, no
                    // whileHover/whileTap gesture listeners.
                    // Fix (Marketplace review): a disabled <button> is pulled
                    // out of the focus order, and many screen readers drop
                    // disabled controls from the accessibility tree entirely —
                    // so aria-pressed on it was never reliably announced.
                    // A non-interactive <div> is always exposed to AT, and we
                    // convey the selected state with aria-current plus a
                    // visually-hidden "(selected)" string instead of an ARIA
                    // attribute (aria-pressed) that implies interactivity.
                    if (isStatic) {
                        return (
                            <div
                                key={index}
                                style={buttonStyle}
                                aria-current={isSelected ? "true" : undefined}
                            >
                                {option.label}
                                {isSelected && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            width: 1,
                                            height: 1,
                                            padding: 0,
                                            margin: -1,
                                            overflow: "hidden",
                                            clip: "rect(0, 0, 0, 0)",
                                            whiteSpace: "nowrap",
                                            border: 0,
                                        }}
                                    >
                                        {" "}
                                        (selected)
                                    </span>
                                )}
                            </div>
                        )
                    }

                    // ─── Live Component ───
                    return (
                        <motion.button
                            key={index}
                            type="button"
                            onClick={() => handleButtonClick(option.value)}
                            initial={false}
                            animate={{
                                backgroundColor: currentFill,
                                color: currentText,
                                borderColor: currentBorder,
                            }}
                            // AQUI: Usa a prop 'animation' diretamente para a troca de estado
                            transition={animation}
                            whileHover={{
                                backgroundColor: hoverFill,
                                color: hoverText,
                                borderColor: hoverBorder,
                                transition: hover.transition, // Hover tem sua própria transição rápida
                            }}
                            whileTap={{ scale: 0.98 }}
                            style={buttonStyle}
                            aria-pressed={isSelected}
                        >
                            {option.label}
                        </motion.button>
                    )
                })}
            </div>

            <input
                type="hidden"
                name={name}
                value={formValue}
                required={required}
            />
        </div>
    )
}

ButtonGroupPro.defaultProps = {
    layout: {
        mode: "grid",
        columns: 3,
        width: "fill",
        horizontalAlign: "start",
        verticalAlign: "center",
        gapH: 10,
        gapV: 10,
    },
    animation: { type: "spring", stiffness: 500, damping: 30 },
    hover: {
        fill: "rgba(187, 187, 187, 0.25)",
        textColor: "#FFF",
        borderColor: "rgba(136, 136, 136, 0.3)",
        transition: { type: "tween", duration: 0.2 },
    },
    selected: {
        fill: "#0099FF",
        textColor: "#FFFFFF",
        borderColor: "#0099FF",
    },
    defaultFill: "rgba(255, 255, 255, 0.05)",
    defaultTextColor: "#999",
    defaultBorderColor: "rgba(255, 255, 255, 0.1)",
    radius: 8,
    padding: "12px 16px",
}

addPropertyControls(ButtonGroupPro, {
    // 1. DATA
    name: { type: ControlType.String, title: "Name", defaultValue: "options" },
    options: {
        type: ControlType.Array,
        title: "Options",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                value: { type: ControlType.String, title: "Value" },
            },
        },
        defaultValue: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
            { label: "Option C", value: "c" },
        ],
    },
    multiSelect: {
        type: ControlType.Boolean,
        title: "Multi-select",
        defaultValue: false,
    },
    required: {
        type: ControlType.Boolean,
        title: "Required",
        defaultValue: false,
    },

    // 2. LAYOUT
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Display",
                options: ["grid", "wrap"],
                optionTitles: ["Grid", "Wrap"],
                defaultValue: "grid",
                displaySegmentedControl: true,
            },
            columns: {
                type: ControlType.Number,
                title: "Columns",
                defaultValue: 3,
                min: 1,
                max: 12,
                displayStepper: true,
                hidden: (props) => props.layout.mode === "wrap",
            },
            width: {
                type: ControlType.Enum,
                title: "Btn Width",
                options: ["fit", "fill"],
                optionTitles: ["Fit Text", "Fill Space"],
                defaultValue: "fill",
                displaySegmentedControl: true,
            },
            horizontalAlign: {
                type: ControlType.Enum,
                title: "Align",
                options: ["start", "center", "end"],
                optionTitles: ["Left", "Center", "Right"],
                defaultValue: "start",
                displaySegmentedControl: true,
                // Fix: this control now also drives the label's text alignment
                // inside each button (see buttonTextAlign above), which matters
                // most when width is "fill" — so it can no longer be hidden in
                // that case. It stays visible in both width modes.
            },
            gapH: { type: ControlType.Number, title: "Gap H", min: 0, max: 50 },
            gapV: { type: ControlType.Number, title: "Gap V", min: 0, max: 50 },
        },
    },

    // 3. ANIMATION (Direct Transition Control)
    animation: {
        type: ControlType.Transition,
        title: "Animation",
    },

    // 4. VISUALS
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        displayFontSize: true,
        displayTextAlignment: true,
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 16px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 8,
        min: 0,
        max: 50,
    },

    // 5. COLORS (Default)
    defaultFill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgba(255, 255, 255, 0.05)",
    },
    defaultTextColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#999",
    },
    defaultBorderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(255, 255, 255, 0.1)",
    },

    // 6. COLORS (Hover)
    hover: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", optional: true },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                optional: true,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                optional: true,
            },
            transition: { type: ControlType.Transition, title: "Hover Ease" },
        },
    },

    // 7. COLORS (Selected)
    selected: {
        type: ControlType.Object,
        title: "Selected",
        controls: {
            fill: { type: ControlType.Color, title: "Fill", optional: true },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                optional: true,
            },
            borderColor: {
                type: ControlType.Color,
                title: "Border",
                optional: true,
            },
        },
    },
})
