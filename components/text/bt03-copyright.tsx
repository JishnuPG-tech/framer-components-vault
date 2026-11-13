import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Copyright (Framer Code Component)
 * - Auto current year or range (Start Year – Current Year)
 * - Symbol variants: © / Copyright / COPYRIGHT / None
 * - Gap / Align / Padding
 * - Extended Font control (family/weight/size/line/letter/align/OpenType)
 * - Robust wrapping for long/unbreakable strings
 */

type YearMode = "current" | "range"
type Align = "left" | "center" | "right"
type SymbolMode = "symbol" | "word" | "wordUpper" | "none"

type Props = {
    // Content
    name: string
    symbol: SymbolMode
    prefix: string
    suffix: string

    // Year
    yearMode: YearMode
    startYear?: number

    // Style
    color: string
    font?: any
    align: Align
    padding: number
    gap: number
}

/** @framerDisableUnlink */
export default function Copyright(props: Props) {
    const {
        name,
        symbol,
        prefix,
        suffix,
        yearMode,
        startYear,
        color,
        font,
        align,
        padding,
        gap,
    } = props

    // Year text (range only when start < current)
    const currentYear = new Date().getFullYear()
    const normalizedStart = Math.max(
        1900,
        Math.min(currentYear, Number(startYear ?? currentYear))
    )
    const yearText =
        yearMode === "range" && normalizedStart < currentYear
            ? `${normalizedStart}–${currentYear}`
            : String(currentYear)

    // Build visible segments in reading order
    const segments: Array<React.ReactNode> = []
    if (prefix) segments.push(<span key="prefix">{prefix}</span>)
    const yearSegment =
        symbol === "none" ? (
            <span key="year">{yearText}</span>
        ) : (
            <span key="copyright-year">
                {symbol === "symbol"
                    ? "©"
                    : symbol === "word"
                      ? "Copyright"
                      : "COPYRIGHT"}
                {yearText}
            </span>
        )
    segments.push(yearSegment)
    if (name) segments.push(<span key="name">{name}</span>)
    if (suffix) segments.push(<span key="suffix">{suffix}</span>)

    // Lean font mapping (apply only if provided)
    const f = (font ?? {}) as any
    const style: React.CSSProperties = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
            align === "center"
                ? "center"
                : align === "right"
                  ? "flex-end"
                  : "flex-start",
        textAlign: align,
        padding,
        boxSizing: "border-box",
        gap,
        color,

        // Robust wrapping
        flexWrap: "wrap",
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        minWidth: 0,

        // Font styles (only if user touched the Font modal)
        ...(f.family || f.fontFamily
            ? { fontFamily: f.fontFamily ?? f.family }
            : {}),
        ...(f.weight || f.fontWeight
            ? { fontWeight: f.fontWeight ?? f.weight }
            : {}),
        ...(f.style ? { fontStyle: f.style } : {}),
        ...(f.size || f.fontSize ? { fontSize: f.size ?? f.fontSize } : {}),
        ...(f.line || f.lineHeight
            ? { lineHeight: f.line ?? f.lineHeight }
            : {}),
        ...(f.letter || f.letterSpacing
            ? { letterSpacing: f.letter ?? f.letterSpacing }
            : {}),
        ...(f.fontFeatureSettings
            ? { fontFeatureSettings: f.fontFeatureSettings }
            : {}),
        ...(f.fontVariationSettings
            ? { fontVariationSettings: f.fontVariationSettings }
            : {}),
    }

    return (
        <div role="contentinfo" aria-label="Copyright notice" style={style}>
            {segments}
            {/* Machine-readable extras */}
            <meta itemProp="copyrightYear" content={String(currentYear)} />
            <meta itemProp="copyrightHolder" content={name || ""} />
        </div>
    )
}

/* ---------- Defaults (first-load experience) ---------- */
Copyright.defaultProps = {
    // Content
    name: "",
    symbol: "symbol", // ©
    prefix: "",
    suffix: "ALL RIGHTS RESERVED.",

    // Year
    yearMode: "current",
    startYear: 2020,

    // Style
    color: "#000000",
    align: "left",
    padding: 0,
    gap: 4,
}

Copyright.displayName = "Copyright Statement"

/* ---------- Property Controls (UX-ordered) ---------- */
addPropertyControls(Copyright, {
    // Content in reading order
    symbol: {
        type: ControlType.Enum,
        title: "Symbol",
        options: ["symbol", "word", "wordUpper", "none"],
        optionTitles: ["©", "Copyright", "COPYRIGHT", "None"],
        defaultValue: "symbol",
    },
    yearMode: {
        type: ControlType.SegmentedEnum,
        title: "Year",
        options: ["current", "range"],
        optionTitles: ["Current", "Range"],
        defaultValue: "current",
    },
    startYear: {
        type: ControlType.Number,
        title: "Start Year",
        defaultValue: 2020,
        min: 1900,
        max: 9999,
        step: 1,
        displayStepper: true,
        hidden: (p) => p.yearMode !== "range",
    },
    name: {
        type: ControlType.String,
        title: "Name",
        defaultValue: "",
        placeholder: "Company / Brand Name",
    },
    prefix: { type: ControlType.String, title: "Prefix", defaultValue: "" },
    suffix: {
        type: ControlType.String,
        title: "Suffix",
        defaultValue: "ALL RIGHTS RESERVED.",
        placeholder: "e.g. All rights reserved.",
    },

    // Layout
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 4,
        min: 0,
        max: 100,
        step: 1,
        unit: "px",
        description: "Space between Prefix, Copyright/Year, Name, Suffix",
    },
    align: {
        type: ControlType.SegmentedEnum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        defaultValue: 0,
        min: 0,
        max: 128,
        step: 1,
        unit: "px",
    },

    // Style
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        description: "Component by [BENNI TRAN](https://www.bennitran.com/)",
    },
})
