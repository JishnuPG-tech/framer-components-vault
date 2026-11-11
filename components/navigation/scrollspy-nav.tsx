import { useEffect, useMemo, useRef, useState } from "react"
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


// Self-contained on purpose: this file is meant to be pasted straight into
// Framer, so it imports nothing but react and framer.

type ScrollspyNavProps = {
    sections: string
    orientation: "vertical" | "horizontal"
    markerStyle: "line" | "dot" | "none"
    smooth: boolean
    offset: number
    gap: number
    fontSize: number
    fontWeight: "regular" | "medium" | "semibold" | "bold"
    letterSpacing: number
    idleColor: string
    activeColor: string
    markerColor: string
    markerThickness: number
    style?: CSSProperties
}

const WEIGHTS = {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
} as const

/**
 * Turns "Work: work, About: about" into a list. The label is what the visitor
 * sees; the id is the section's name on the canvas. A bare entry uses the same
 * text for both, lowercased.
 */
function parseSections(raw: string) {
    return raw
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const at = part.indexOf(":")
            if (at === -1) return { label: part, id: part.toLowerCase().replace(/\s+/g, "-") }
            return {
                label: part.slice(0, at).trim(),
                id: part.slice(at + 1).trim(),
            }
        })
}

/**
 * A section navigation for one-page sites that highlights where you are.
 *
 * This is not a table of contents — it does not read headings out of an
 * article. You name the sections you already have on the canvas, and the
 * matching link lights up as each one reaches the top of the viewport.
 *
 * Give each section an ID in Framer (right panel, bottom) and use those IDs
 * here.
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 160
 */
//@framerDisableUnlink
export default function ScrollspyNav({
    sections = "Intro: intro, Work: work, About: about, Contact: contact",
    orientation = "vertical",
    markerStyle = "line",
    smooth = true,
    offset = 120,
    gap = 12,
    fontSize = 15,
    fontWeight = "medium",
    letterSpacing = 0,
    idleColor = "#A1A1AA",
    activeColor = "#18181B",
    markerColor = "#18181B",
    markerThickness = 2,
    style,
}: Partial<ScrollspyNavProps>) {
    // On the canvas there is nothing to scroll, so the first item is shown as
    // active rather than leaving the whole nav looking disabled.
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const items = useMemo(() => parseSections(sections), [sections])
    const [activeId, setActiveId] = useState<string | null>(null)

    // The live list of ids the observer should watch. Kept in a ref so the
    // effect reads the current value instead of a captured one.
    const idsRef = useRef<string[]>([])
    idsRef.current = items.map((i) => i.id)

    useEffect(() => {
        if (isCanvas) return
        if (typeof document === "undefined") return

        const targets = idsRef.current
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => Boolean(el))

        if (!targets.length) return

        // Only the band just below the header counts as "here". Without the
        // bottom margin every section on a tall screen would be intersecting
        // at once and the highlight would jump around.
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                if (visible[0]) setActiveId(visible[0].target.id)
            },
            { rootMargin: `-${Math.max(0, offset)}px 0px -55% 0px`, threshold: 0 }
        )

        targets.forEach((t) => observer.observe(t))
        return () => observer.disconnect()
    }, [isCanvas, offset, sections])

    const go = (id: string) => {
        if (typeof document === "undefined") return
        const el = document.getElementById(id)
        if (!el) return
        const top = el.getBoundingClientRect().top + window.scrollY - Math.max(0, offset)
        window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
    }

    const vertical = orientation === "vertical"
    const current = isCanvas ? items[0]?.id ?? null : activeId

    return (
        <nav
            aria-label="Section navigation"
            style={{
                position: "relative",
                display: "flex",
                flexDirection: vertical ? "column" : "row",
                gap,
                minWidth: 0,
                fontFamily: "inherit",
                ...style,
            }}
        >
            {items.map((item) => {
                const on = item.id === current
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => go(item.id)}
                        aria-current={on ? "true" : undefined}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer",
                            textAlign: "left",
                            color: on ? activeColor : idleColor,
                            fontSize,
                            fontWeight: WEIGHTS[fontWeight] ?? WEIGHTS.medium,
                            letterSpacing,
                            fontFamily: "inherit",
                            transition: "color 180ms ease",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {markerStyle === "line" && (
                            <span
                                aria-hidden="true"
                                style={{
                                    display: "block",
                                    height: markerThickness,
                                    width: on ? 24 : 10,
                                    borderRadius: markerThickness,
                                    background: on ? markerColor : idleColor,
                                    opacity: on ? 1 : 0.45,
                                    transition: "width 200ms ease, opacity 200ms ease",
                                    flex: "0 0 auto",
                                }}
                            />
                        )}
                        {markerStyle === "dot" && (
                            <span
                                aria-hidden="true"
                                style={{
                                    display: "block",
                                    width: markerThickness * 3,
                                    height: markerThickness * 3,
                                    borderRadius: "50%",
                                    background: on ? markerColor : idleColor,
                                    opacity: on ? 1 : 0.35,
                                    transform: on ? "scale(1)" : "scale(0.7)",
                                    transition: "transform 200ms ease, opacity 200ms ease",
                                    flex: "0 0 auto",
                                }}
                            />
                        )}
                        {item.label}
                    </button>
                )
            })}
        </nav>
    )
}

addPropertyControls(ScrollspyNav, {
    sections: {
        type: ControlType.String,
        title: "Sections",
        defaultValue: "Intro: intro, Work: work, About: about, Contact: contact",
        displayTextArea: true,
        description:
            "Label: section-id, one per comma. Set the ID on each section in Framer's right panel.",
    },
    orientation: {
        type: ControlType.Enum,
        title: "Layout",
        defaultValue: "vertical",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        displaySegmentedControl: true,
    },
    markerStyle: {
        type: ControlType.Enum,
        title: "Marker",
        defaultValue: "line",
        options: ["line", "dot", "none"],
        optionTitles: ["Line", "Dot", "None"],
    },
    smooth: {
        type: ControlType.Boolean,
        title: "Smooth scroll",
        defaultValue: true,
    },
    offset: {
        type: ControlType.Number,
        title: "Top offset",
        defaultValue: 120,
        min: 0,
        max: 400,
        step: 10,
        unit: "px",
        description: "Height of your fixed header, so sections land below it.",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 12,
        min: 0,
        max: 64,
        step: 2,
        unit: "px",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 15,
        min: 10,
        max: 40,
        step: 1,
        unit: "px",
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Weight",
        defaultValue: "medium",
        // Word values, not "500" — numeric-looking enum options get read as
        // numbers and silently fall back to the default.
        options: ["regular", "medium", "semibold", "bold"],
        optionTitles: ["Regular", "Medium", "Semibold", "Bold"],
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Tracking",
        defaultValue: 0,
        min: -2,
        max: 10,
        step: 0.5,
        unit: "px",
    },
    markerThickness: {
        type: ControlType.Number,
        title: "Marker size",
        defaultValue: 2,
        min: 1,
        max: 10,
        step: 1,
        unit: "px",
    },
    idleColor: {
        type: ControlType.Color,
        title: "Idle",
        defaultValue: "#A1A1AA",
    },
    activeColor: {
        type: ControlType.Color,
        title: "Active",
        defaultValue: "#18181B",
    },
    markerColor: {
        type: ControlType.Color,
        title: "Marker color",
        defaultValue: "#18181B",
        description: "More components by this maker: [vivi park](https://www.framer.com/@vivi-park/?tab=marketplace)",
    },
})
