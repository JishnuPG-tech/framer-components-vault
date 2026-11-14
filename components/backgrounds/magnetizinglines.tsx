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
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 800
 */

type SizingMode = "Frame" | "Fill Frame" | "Fill Viewport" | "Custom"
type Falloff = "Linear" | "Smooth"

type MagnetizingLinesProps = {
    sizing: SizingMode
    customWidth: string
    customHeight: string
    rows: number
    columns: number
    gap: string

    color: string
    thickness: number
    thicknessUnit: "px" | "vmin" | "rem"
    length: number
    lengthUnit: "px" | "vmin" | "rem"
    rounded: boolean
    baseAngle: number

    shrinkEnabled: boolean
    shrinkRadius: number
    minThickness: number
    minLength: number
    falloff: Falloff
}

export default function MagnetizingLines(
    props: Partial<MagnetizingLinesProps>
) {
    const {
        sizing = "Frame",
        customWidth = "80vmin",
        customHeight = "80vmin",

        rows = 9,
        columns = 9,
        gap = "0px",

        color = "#efefef",
        thickness = 1,
        thicknessUnit = "vmin",
        length = 6,
        lengthUnit = "vmin",
        rounded = false,
        baseAngle = -10,

        shrinkEnabled = true,
        shrinkRadius = 120,
        minThickness = 0.3,
        minLength = 1,
        falloff = "Smooth",
    } = props

    const containerRef = React.useRef<HTMLDivElement | null>(null)

    const baseWidthStr = `${thickness}${thicknessUnit}`
    const baseHeightStr = `${length}${lengthUnit}`

    const sizeStyle = React.useMemo<React.CSSProperties>(() => {
        switch (sizing) {
            case "Fill Frame":
                return { width: "100%", height: "100%" }
            case "Fill Viewport":
                return { width: "100vw", height: "100vh" }
            case "Custom":
                return { width: customWidth, height: customHeight }
            default:
                return {}
        }
    }, [sizing, customWidth, customHeight])

    const interp = React.useCallback(
        (d: number, max: number, minVal: number, baseVal: number) => {
            if (!shrinkEnabled) return baseVal
            if (d >= shrinkRadius) return baseVal
            const t = Math.max(0, Math.min(1, d / shrinkRadius))
            let k = t
            if (falloff === "Smooth") k = 1 - Math.pow(1 - t, 3)
            return minVal + (baseVal - minVal) * k
        },
        [falloff, shrinkEnabled, shrinkRadius]
    )

    React.useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const items = Array.from(
            container.querySelectorAll("span")
        ) as HTMLSpanElement[]

        const onPointerMove = (e: PointerEvent | { x: number; y: number }) => {
            const px = "x" in e ? e.x : e.clientX
            const py = "y" in e ? e.y : e.clientY

            for (const item of items) {
                const rect = item.getBoundingClientRect()
                const cx = rect.x + rect.width / 2
                const cy = rect.y + rect.height / 2
                const dx = px - cx
                const dy = py - cy
                const dist = Math.hypot(dx, dy)

                const c = Math.sqrt(dx * dx + dy * dy) || 1
                const r =
                    ((Math.acos(dx / c) * 180) / Math.PI) * (py > cy ? 1 : -1)
                item.style.setProperty("--rotate", `${r}deg`)

                const w = interp(dist, shrinkRadius, minThickness, thickness)
                const h = interp(dist, shrinkRadius, minLength, length)
                item.style.setProperty("--thickness", `${w}${thicknessUnit}`)
                item.style.setProperty("--height", `${h}${lengthUnit}`)
            }
        }

        for (const item of items) {
            item.style.setProperty("--rotate", `${baseAngle}deg`)
            item.style.setProperty("--thickness", baseWidthStr)
            item.style.setProperty("--height", baseHeightStr)
        }

        window.addEventListener("pointermove", onPointerMove, { passive: true })

        if (items.length) {
            const mid = Math.floor(items.length / 2)
            const rect = items[mid].getBoundingClientRect()
            onPointerMove({ x: rect.x, y: rect.y })
        }

        return () => window.removeEventListener("pointermove", onPointerMove)
    }, [
        rows,
        columns,
        baseAngle,
        baseWidthStr,
        baseHeightStr,
        interp,
        thickness,
        length,
        thicknessUnit,
        lengthUnit,
    ])

    const total = rows * columns
    const children = Array.from({ length: total }, (_, i) => (
        <span
            key={i}
            style={{
                display: "block",
                transformOrigin: "center",
                backgroundColor: color,
                width: "var(--thickness, " + baseWidthStr + ")",
                height: "var(--height, " + baseHeightStr + ")",
                transform: "rotate(var(--rotate, " + `${baseAngle}deg` + "))",
                willChange: "transform, width, height",
                borderRadius: rounded ? "999px" : "0px",
            }}
        />
    ))

    return (
        <div
            ref={containerRef}
            style={{
                display: "grid",
                placeItems: "center",
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap,
                ...sizeStyle,
            }}
        >
            {children}
        </div>
    )
}

addPropertyControls(MagnetizingLines, {
    sizing: {
        type: ControlType.Enum,
        title: "Sizing Mode 🧩",
        description: "Choose how the component fills space",
        options: ["Frame", "Fill Frame", "Fill Viewport", "Custom"],
        defaultValue: "Frame",
    },
    customWidth: {
        type: ControlType.String,
        title: "Custom Width",
        description: "Width for custom sizing (e.g. 80vmin)",
        defaultValue: "80vmin",
        hidden: (p) => p.sizing !== "Custom",
    },
    customHeight: {
        type: ControlType.String,
        title: "Custom Height",
        description: "Height for custom sizing (e.g. 80vmin)",
        defaultValue: "80vmin",
        hidden: (p) => p.sizing !== "Custom",
    },
    rows: {
        type: ControlType.Number,
        title: "Rows 🔳",
        description: "Number of horizontal rows",
        min: 1,
        max: 50,
        defaultValue: 9,
    },
    columns: {
        type: ControlType.Number,
        title: "Columns 🔲",
        description: "Number of vertical columns",
        min: 1,
        max: 50,
        defaultValue: 9,
    },
    gap: {
        type: ControlType.String,
        title: "Grid Gap",
        description: "Spacing between lines (e.g. 1vmin, 8px)",
        defaultValue: "0px",
    },
    color: {
        type: ControlType.Color,
        title: "Line Color 🎨",
        defaultValue: "#efefef",
    },
    thickness: {
        type: ControlType.Number,
        title: "Line Thickness",
        description: "Default line width",
        min: 0.1,
        max: 20,
        step: 0.1,
        defaultValue: 1,
    },
    thicknessUnit: {
        type: ControlType.Enum,
        title: "Thickness Unit",
        options: ["px", "vmin", "rem"],
        defaultValue: "vmin",
    },
    length: {
        type: ControlType.Number,
        title: "Line Length",
        description: "Default line height",
        min: 0.5,
        max: 100,
        step: 0.5,
        defaultValue: 6,
    },
    lengthUnit: {
        type: ControlType.Enum,
        title: "Length Unit",
        options: ["px", "vmin", "rem"],
        defaultValue: "vmin",
    },
    rounded: {
        type: ControlType.Boolean,
        title: "Rounded Ends ⚪",
        defaultValue: false,
    },
    baseAngle: {
        type: ControlType.Number,
        title: "Base Angle 🎯",
        description: "Initial rotation angle of all lines",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: -10,
    },
    shrinkEnabled: {
        type: ControlType.Boolean,
        title: "Magnetize Effect 🧲",
        description: "Enable shrinking near cursor",
        defaultValue: true,
    },
    shrinkRadius: {
        type: ControlType.Number,
        title: "Effect Radius",
        min: 20,
        max: 600,
        defaultValue: 120,
        hidden: (p) => !p.shrinkEnabled,
    },
    minThickness: {
        type: ControlType.Number,
        title: "Min Thickness",
        min: 0.05,
        max: 10,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (p) => !p.shrinkEnabled,
    },
    minLength: {
        type: ControlType.Number,
        title: "Min Length",
        min: 0.2,
        max: 50,
        step: 0.1,
        defaultValue: 1,
        hidden: (p) => !p.shrinkEnabled,
    },
    falloff: {
        type: ControlType.Enum,
        title: "Falloff Curve",
        options: ["Linear", "Smooth"],
        defaultValue: "Smooth",
        hidden: (p) => !p.shrinkEnabled,
    },
})
