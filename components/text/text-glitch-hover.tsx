// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import React, { useEffect, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FuzzyText(props) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState<number | undefined>(undefined)

    const frameHeight =
        typeof (props as any).height === "number"
            ? (props as any).height
            : undefined

    const getFontSizePx = () => {
        const raw = props.font?.fontSize ?? 80
        if (typeof raw === "number") return raw
        const n = parseFloat(String(raw))
        return Number.isFinite(n) ? n : 80
    }

    const parseFamilies = (familyRaw?: string) => {
        const raw =
            familyRaw ||
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        const parts = raw
            .split(",")
            .map((p) => p.trim().replace(/^['"]|['"]$/g, ""))
        const primary = parts[0] || "Inter"
        const quoteIfNeeded = (name: string) =>
            /\s/.test(name) ? `"${name}"` : name
        const fullList = parts.map(quoteIfNeeded).join(", ")
        const cssPrimary = quoteIfNeeded(primary)
        return { primary, cssPrimary, fullList }
    }

    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return
            setWidth(containerRef.current.offsetWidth || 0)
            setHeight(containerRef.current.offsetHeight || undefined)
        }
        update()
        const ro = new ResizeObserver(update)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        let raf: number
        let isCancelled = false
        const canvas = canvasRef.current
        if (!canvas) return

        const init = async () => {
            if (document.fonts?.ready) await document.fonts.ready
            if (isCancelled) return

            const ctx = canvas.getContext("2d")
            if (!ctx) return

            const weight = props.font?.fontWeight ?? 900
            const style = props.font?.fontStyle ?? "normal"
            const minSize = props.minFontSize ?? 10
            const maxSize = props.maxFontSize ?? 300
            const baseSize = getFontSizePx()
            const { cssPrimary, fullList } = parseFamilies(
                props.font?.fontFamily
            )
            const sidePadding = props.sidePadding ?? 40

            const splitIntoLogicalLines = (text: string) => text.split(/\r?\n/)

            const layoutForSize = (
                fontPx: number,
                availableOverride?: number
            ) => {
                const temp = document.createElement("canvas")
                const tctx = temp.getContext("2d")!
                const fontCanvas = `${style} ${weight} ${fontPx}px ${fullList}`
                tctx.font = fontCanvas

                const logical = splitIntoLogicalLines(props.text || "")
                const available =
                    typeof availableOverride === "number"
                        ? availableOverride
                        : Math.max(0, width - sidePadding)

                const lines: string[] = []
                for (const logicalLine of logical) {
                    const words = logicalLine.split(" ")
                    if (available === Infinity) {
                        lines.push(logicalLine)
                        continue
                    }
                    let cur = words[0] || ""
                    for (let i = 1; i < words.length; i++) {
                        const test = cur + " " + words[i]
                        if (tctx.measureText(test).width > available && cur) {
                            lines.push(cur)
                            cur = words[i]
                        } else {
                            cur = test
                        }
                    }
                    if (cur) lines.push(cur)
                }

                const lineHeight = Math.ceil(fontPx * (props.lineHeight || 1.2))
                const totalHeight = Math.max(
                    lineHeight,
                    lines.length * lineHeight
                )
                const maxLineWidth = lines.length
                    ? Math.max(
                          ...lines.map((line) => tctx.measureText(line).width)
                      )
                    : 0

                return {
                    lines,
                    fontCanvas,
                    lineHeight,
                    totalHeight,
                    maxLineWidth,
                }
            }

            const mode = props.sizeMode || "fixed"
            let chosenSize = baseSize

            if (mode === "fitHeight") {
                const targetH =
                    (props.targetHeight as number) ||
                    frameHeight ||
                    height ||
                    undefined
                if (targetH) {
                    let lo = minSize
                    let hi = maxSize
                    for (let i = 0; i < 14; i++) {
                        const mid = Math.floor((lo + hi) / 2)
                        const pass = layoutForSize(mid)
                        if (pass.totalHeight > targetH) hi = mid - 1
                        else lo = mid + 1
                    }
                    chosenSize = Math.max(minSize, Math.min(maxSize, hi))
                }
            } else {
                chosenSize = baseSize
            }

            const noWrapLayout = layoutForSize(chosenSize, Infinity)
            const naturalContentWidth =
                Math.ceil(noWrapLayout.maxLineWidth) + 20
            const lineHeight = noWrapLayout.lineHeight

            if (containerRef.current) {
                containerRef.current.style.width = `${naturalContentWidth}px`
            }

            const finalLayout = layoutForSize(chosenSize)

            try {
                const loadStr = `${style} ${weight} ${Math.ceil(
                    chosenSize
                )}px ${cssPrimary}`
                await document.fonts.load(loadStr)
            } catch {}

            const offscreens = finalLayout.lines.map((line) => {
                const off = document.createElement("canvas")
                const octx = off.getContext("2d")!
                octx.font = finalLayout.fontCanvas
                octx.textBaseline = "top"
                const w = Math.ceil(octx.measureText(line).width)
                off.width = w + 20
                off.height = lineHeight
                octx.font = finalLayout.fontCanvas
                octx.textBaseline = "top"
                octx.fillStyle = props.textColor || "#ffffff"
                octx.textAlign = "left"
                octx.clearRect(0, 0, off.width, off.height)
                octx.fillText(line, 10, 0)
                return { canvas: off, width: w, height: lineHeight }
            })

            const contentWidth =
                offscreens.length > 0
                    ? Math.max(...offscreens.map((o) => o.width + 20))
                    : 1
            const totalHeight = Math.max(
                lineHeight,
                offscreens.length * lineHeight
            )

            const drawWidth = Math.max(contentWidth, 1)

            const dpr = window.devicePixelRatio || 1
            canvas.style.width = `${drawWidth}px`
            canvas.style.height = `${totalHeight}px`
            canvas.width = Math.ceil(drawWidth * dpr)
            canvas.height = Math.ceil(totalHeight * dpr)
            const align = props.align || "left"
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            if (containerRef.current) {
                containerRef.current.style.height = `${totalHeight}px`
            }

            const xBaseFor = (lineInnerWidth: number) => {
                const full = lineInnerWidth + 20
                if (align === "center")
                    return Math.max(0, Math.floor((drawWidth - full) / 2))
                if (align === "right") return Math.max(0, drawWidth - full)
                return 0
            }

            let hovering = false
            const fuzzRange = 30

            const run = () => {
                if (isCancelled) return
                ctx.clearRect(0, 0, drawWidth, totalHeight)
                const intensity =
                    props.enableHover && hovering
                        ? props.hoverIntensity
                        : props.baseIntensity

                offscreens.forEach((off, idx) => {
                    const y = idx * lineHeight
                    const xBase = xBaseFor(off.width)
                    for (let j = 0; j < off.height; j++) {
                        const dx = Math.floor(
                            intensity * (Math.random() - 0.5) * fuzzRange
                        )
                        ctx.drawImage(
                            off.canvas,
                            0,
                            j,
                            off.canvas.width,
                            1,
                            xBase + dx,
                            y + j,
                            off.canvas.width,
                            1
                        )
                    }
                })
                raf = requestAnimationFrame(run)
            }
            run()

            const onMove = (e: MouseEvent) => {
                if (!props.enableHover) return
                const rect = canvas.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                const within =
                    x >= 0 && x <= drawWidth && y >= 0 && y <= totalHeight
                hovering = within
            }
            const onLeave = () => {
                hovering = false
            }

            canvas.addEventListener("mousemove", onMove)
            canvas.addEventListener("mouseleave", onLeave)
            ;(canvas as any).cleanupFuzzyText = () => {
                cancelAnimationFrame(raf)
                canvas.removeEventListener("mousemove", onMove)
                canvas.removeEventListener("mouseleave", onLeave)
            }
        }

        init()

        return () => {
            isCancelled = true
            cancelAnimationFrame(raf)
            const c = canvasRef.current as any
            if (c?.cleanupFuzzyText) c.cleanupFuzzyText()
        }
    }, [
        width,
        height,
        (props as any).height,
        props.text,
        props.font?.fontFamily,
        props.font?.fontWeight,
        props.font?.fontStyle,
        props.font?.fontSize,
        props.lineHeight,
        props.textColor,
        props.enableHover,
        props.baseIntensity,
        props.hoverIntensity,
        props.sizeMode,
        props.minFontSize,
        props.maxFontSize,
        props.sidePadding,
        props.targetHeight,
        props.align, // important
    ])

    return (
        <div
            ref={containerRef}
            style={{
                display: "inline-block",
                width: "fit-content",
                maxWidth: "100%",
                height: "auto",
                position: "relative",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    cursor: "pointer",
                    height: "auto",
                }}
            />
        </div>
    )
}

addPropertyControls(FuzzyText, {
    text: {
        title: "Text",
        type: ControlType.String,
        defaultValue: "404",
    },
    align: {
        title: "Align",
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        defaultValue: "left",
        displaySegmentedControl: true,
    },
    sizeMode: {
        title: "Size Mode",
        type: ControlType.Enum,
        options: ["fixed", "fitWidth", "fitHeight"],
        optionTitles: ["Fixed", "Fit width", "Fit height"],
        defaultValue: "fixed",
        displaySegmentedControl: true,
    },
    minFontSize: {
        title: "Min Size",
        type: ControlType.Number,
        defaultValue: 10,
        min: 6,
        max: 300,
        step: 1,
        hidden: (p) => p.sizeMode === "fixed",
    },
    maxFontSize: {
        title: "Max Size",
        type: ControlType.Number,
        defaultValue: 300,
        min: 6,
        max: 400,
        step: 1,
        hidden: (p) => p.sizeMode === "fixed",
    },
    targetHeight: {
        title: "Target Height",
        type: ControlType.Number,
        defaultValue: 300,
        min: 40,
        max: 2000,
        step: 1,
        hidden: (p) => p.sizeMode !== "fitHeight",
    },
    sidePadding: {
        title: "Side Padding",
        type: ControlType.Number,
        defaultValue: 40,
        min: 0,
        max: 200,
        step: 1,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: {
            fontSize: 80,
            fontFamily:
                "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
            fontWeight: 900,
            fontStyle: "normal",
        },
    },
    lineHeight: {
        title: "Line Height",
        type: ControlType.Number,
        defaultValue: 1.2,
        min: 0.5,
        max: 3,
        step: 0.1,
    },
    textColor: {
        title: "Text Color",
        type: ControlType.Color,
        defaultValue: "#ffffff",
    },
    enableHover: {
        title: "Enable Hover",
        type: ControlType.Boolean,
        defaultValue: true,
    },
    baseIntensity: {
        title: "Base Intensity",
        type: ControlType.Number,
        defaultValue: 0.18,
        min: 0,
        max: 1,
        step: 0.01,
    },
    hoverIntensity: {
        title: "Hover Intensity",
        type: ControlType.Number,
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
    },
})
