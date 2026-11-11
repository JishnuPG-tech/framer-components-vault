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


type Props = {
    coverText: string
    coverColor: string
    coverTextColor: string
    revealText: string
    revealBg: string
    revealTextColor: string
    textSize: number
    brush: number
    autoReveal: number
    showReset: boolean
    resetLabel: string
    padding: number
    radius: number
}

/**
 * Scratch to reveal
 * A cover you scratch away with a finger or cursor to find a message underneath.
 * Optionally clears itself once enough has been scratched off.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ScratchReveal(props: Props) {
    const {
        coverText,
        coverColor,
        coverTextColor,
        revealText,
        revealBg,
        revealTextColor,
        textSize,
        brush,
        autoReveal,
        showReset,
        resetLabel,
        padding,
        radius,
    } = props

    const wrap = React.useRef<HTMLDivElement>(null)
    const canvas = React.useRef<HTMLCanvasElement>(null)
    const down = React.useRef(false)
    const size = React.useRef({ w: 0, h: 0, dpr: 1 })
    const [gone, setGone] = React.useState(false)
    const [touched, setTouched] = React.useState(false)

    // Framer colour tokens come through as var(--...), which canvas can't read.
    const resolve = React.useCallback((c: string) => {
        const box = wrap.current
        if (!box || !c || !c.startsWith("var(")) return c
        const probe = document.createElement("span")
        probe.style.color = c
        box.appendChild(probe)
        const out = getComputedStyle(probe).color
        box.removeChild(probe)
        return out
    }, [])

    const cover = React.useCallback(() => {
        const el = canvas.current
        const box = wrap.current
        if (!el || !box) return
        const ctx = el.getContext("2d")
        if (!ctx) return
        const r = box.getBoundingClientRect()
        if (!(r.width >= 2) || !(r.height >= 2)) return
        const dpr = window.devicePixelRatio || 1
        size.current = { w: r.width, h: r.height, dpr }
        el.width = Math.round(r.width * dpr)
        el.height = Math.round(r.height * dpr)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalCompositeOperation = "source-over"
        ctx.fillStyle = resolve(coverColor)
        ctx.fillRect(0, 0, r.width, r.height)
        if (coverText) {
            ctx.fillStyle = resolve(coverTextColor)
            ctx.font = '12px "IBM Plex Mono", ui-monospace, monospace'
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            const anyCtx = ctx as any
            if ("letterSpacing" in anyCtx) anyCtx.letterSpacing = "1.5px"
            ctx.fillText(coverText.toUpperCase(), r.width / 2, r.height / 2)
        }
        setGone(false)
        setTouched(false)
    }, [coverColor, coverText, coverTextColor, resolve])

    React.useEffect(() => {
        cover()
        const box = wrap.current
        const ro = box ? new ResizeObserver(() => cover()) : null
        if (box && ro) ro.observe(box)
        const fonts = (document as any).fonts
        if (fonts && fonts.ready) fonts.ready.then(() => cover())
        return () => {
            if (ro) ro.disconnect()
        }
    }, [cover])

    const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const el = canvas.current
        if (!el || !down.current) return
        const ctx = el.getContext("2d")
        if (!ctx) return
        const r = el.getBoundingClientRect()
        ctx.globalCompositeOperation = "destination-out"
        ctx.beginPath()
        ctx.arc(
            e.clientX - r.left,
            e.clientY - r.top,
            Math.max(4, brush),
            0,
            Math.PI * 2
        )
        ctx.fill()
        if (!touched) setTouched(true)
    }

    // How much of the cover is gone? Sampled, so it stays quick.
    const coverage = () => {
        const el = canvas.current
        if (!el) return 0
        const ctx = el.getContext("2d")
        if (!ctx || !el.width || !el.height) return 0
        const data = ctx.getImageData(0, 0, el.width, el.height).data
        let clear = 0
        let total = 0
        const step = 6
        for (let y = 0; y < el.height; y += step) {
            for (let x = 0; x < el.width; x += step) {
                total++
                if (data[(y * el.width + x) * 4 + 3] < 40) clear++
            }
        }
        return total ? (clear / total) * 100 : 0
    }

    const end = () => {
        if (!down.current) return
        down.current = false
        if (autoReveal > 0 && coverage() >= autoReveal) setGone(true)
    }

    return (
        <div
            ref={wrap}
            style={{
                position: "relative",
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 140,
                overflow: "hidden",
                borderRadius: radius,
                background: revealBg,
                color: revealTextColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding,
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            }}
        >
            <span
                style={{
                    fontSize: textSize,
                    lineHeight: 1.4,
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                }}
            >
                {revealText}
            </span>
            <canvas
                ref={canvas}
                onPointerDown={(e) => {
                    down.current = true
                    e.currentTarget.setPointerCapture(e.pointerId)
                    scratch(e)
                }}
                onPointerMove={scratch}
                onPointerUp={end}
                onPointerCancel={end}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    cursor: "crosshair",
                    touchAction: "none",
                    opacity: gone ? 0 : 1,
                    pointerEvents: gone ? "none" : "auto",
                    transition: "opacity .5s ease",
                }}
            />
            {showReset && (touched || gone) && (
                <button
                    type="button"
                    onClick={cover}
                    style={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        zIndex: 2,
                        cursor: "pointer",
                        fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                        fontSize: 14,
                        lineHeight: 1.2,
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: `1px solid ${revealTextColor}`,
                        background: "transparent",
                        color: revealTextColor,
                    }}
                >
                    {resetLabel}
                </button>
            )}
        </div>
    )
}

ScratchReveal.defaultProps = {
    width: 560,
    height: 220,
    coverText: "Scratch to reveal",
    coverColor: "#E4DCF7",
    coverTextColor: "#5B5478",
    revealText: "Yey! You made it!",
    revealBg: "#DCFF50",
    revealTextColor: "#161616",
    textSize: 24,
    brush: 22,
    autoReveal: 55,
    showReset: true,
    resetLabel: "Cover it again",
    padding: 24,
    radius: 12,
}

addPropertyControls(ScratchReveal, {
    coverText: { type: ControlType.String, title: "Cover text" },
    coverColor: { type: ControlType.Color, title: "Cover" },
    coverTextColor: { type: ControlType.Color, title: "Cover text colour" },
    revealText: {
        type: ControlType.String,
        title: "Hidden text",
        displayTextArea: true,
    },
    revealBg: { type: ControlType.Color, title: "Hidden background" },
    revealTextColor: { type: ControlType.Color, title: "Hidden text colour" },
    textSize: {
        type: ControlType.Number,
        title: "Text size",
        min: 12,
        max: 72,
        step: 1,
        unit: "px",
    },
    brush: {
        type: ControlType.Number,
        title: "Brush size",
        min: 6,
        max: 60,
        step: 1,
        unit: "px",
    },
    autoReveal: {
        type: ControlType.Number,
        title: "Auto-clear at",
        min: 0,
        max: 95,
        step: 5,
        unit: "%",
        description:
            "Clears the rest once this much is scratched off. 0 = never.",
    },
    showReset: {
        type: ControlType.Boolean,
        title: "Reset button",
        defaultValue: true,
    },
    resetLabel: {
        type: ControlType.String,
        title: "Reset label",
        hidden: (p: Props) => !p.showReset,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
})
