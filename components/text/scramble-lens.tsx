import { useRef, useEffect, useCallback, useLayoutEffect } from "react"
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


type AlignMode = "left" | "center" | "right"

interface ScrambleTextProps {
    text: string
    font: CSSProperties
    color: string
    lensColor: string
    background: string
    cornerRadius: number
    padding: number
    align: AlignMode
    radius: number
    softness: number
    churn: number
    animate: number
    scrambleChars: string
    style?: CSSProperties
}

/**
 * SCRAMBLE TEXT (readable lens)
 *
 * The text reads normally when idle. When the pointer hovers OVER THE TEXT, a
 * soft circular lens follows the cursor: letters INSIDE the lens stay the real,
 * readable text, while letters OUTSIDE the lens turn into scrambled characters
 * (in the scramble colour). Moving the cursor off the text returns everything
 * to normal — empty space around the text does not trigger the effect.
 *
 * The scrambled glyphs don't all change at once: each time the pointer moves, a
 * RANDOM fraction of the scrambled letters re-roll, so the noise churns
 * organically. When the pointer is still, nothing changes. Character swaps and
 * colour are smoothly animated.
 *
 * Each letter cell is locked to the width of its real glyph, so swapping to a
 * scrambled character never shifts the layout. Spaces are preserved.
 *
 * Pure React — no external dependencies. Every property is editable and the
 * component is responsive.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 460
 * @framerIntrinsicHeight 80
 */
export default function ScrambleText(props: ScrambleTextProps) {
    const {
        text,
        font,
        color,
        lensColor,
        background,
        cornerRadius,
        padding,
        align,
        radius,
        softness,
        churn,
        animate,
        scrambleChars,
        style,
    } = props

    const safeText = text != null ? String(text) : ""
    const chars =
        scrambleChars && scrambleChars.length > 0
            ? scrambleChars
            : "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+0123456789"

    const wrapRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLDivElement>(null)
    const charRefs = useRef<Array<HTMLSpanElement | null>>([])
    const mouse = useRef({ x: -99999, y: -99999, active: false })
    const moved = useRef(false)
    const raf = useRef<number>(0)

    const scrambleAmt = useRef<number[]>([])
    const scrambleCache = useRef<string[]>([])
    const wasScrambled = useRef<boolean[]>([])

    const charsArr = safeText.split("")

    const baseRGB = parseColor(color)
    const lensRGB = parseColor(lensColor)

    const animMs = Math.max(0, animate)

    const randChar = useCallback(
        () => chars[Math.floor(Math.random() * chars.length)],
        [chars]
    )

    useEffect(() => {
        scrambleAmt.current = charsArr.map(() => 0)
        scrambleCache.current = charsArr.map(() => randChar())
        wasScrambled.current = charsArr.map(() => false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeText, scrambleChars])

    useLayoutEffect(() => {
        const measure = () => {
            for (let i = 0; i < charRefs.current.length; i++) {
                const el = charRefs.current[i]
                if (!el) continue
                const ch = charsArr[i]
                if (ch === " " || ch === "\n") continue
                el.style.width = "auto"
                const prev = el.textContent
                el.textContent = ch
                const w = el.getBoundingClientRect().width
                el.style.width = w + "px"
                el.textContent = prev || ch
            }
        }
        measure()
        const t = setTimeout(measure, 60)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeText, font, scrambleChars])

    useEffect(() => {
        const R = Math.max(10, radius)
        const soft = Math.max(1, softness)
        const churnFrac = clamp01(churn / 100)

        const loop = () => {
            const m = mouse.current
            const didMove = moved.current
            moved.current = false

            const scrambledIdx: number[] = []
            for (let i = 0; i < charRefs.current.length; i++) {
                const el = charRefs.current[i]
                if (!el) continue
                const ch = charsArr[i]
                if (ch === " " || ch === "\n") continue

                let near = 0
                if (m.active) {
                    const r = el.getBoundingClientRect()
                    const wrap = wrapRef.current?.getBoundingClientRect()
                    if (wrap) {
                        const cx = r.left + r.width / 2 - wrap.left
                        const cy = r.top + r.height / 2 - wrap.top
                        const d = Math.hypot(cx - m.x, cy - m.y)
                        if (d <= R) near = 1
                        else if (d >= R + soft) near = 0
                        else near = 1 - (d - R) / soft
                    }
                }

                const scrambleTarget = m.active ? 1 - near : 0
                const cur = scrambleAmt.current[i] ?? 0
                const next = cur + (scrambleTarget - cur) * 0.25
                scrambleAmt.current[i] = next

                if (next > 0.5) scrambledIdx.push(i)
            }

            if (didMove && scrambledIdx.length > 0 && churnFrac > 0) {
                for (let a = scrambledIdx.length - 1; a > 0; a--) {
                    const b = Math.floor(Math.random() * (a + 1))
                    const tmp = scrambledIdx[a]
                    scrambledIdx[a] = scrambledIdx[b]
                    scrambledIdx[b] = tmp
                }
                const count = Math.max(
                    1,
                    Math.round(scrambledIdx.length * churnFrac)
                )
                for (let k = 0; k < count; k++) {
                    scrambleCache.current[scrambledIdx[k]] = randChar()
                }
            }

            for (let i = 0; i < charRefs.current.length; i++) {
                const el = charRefs.current[i]
                if (!el) continue
                const ch = charsArr[i]
                if (ch === " " || ch === "\n") continue
                const v = scrambleAmt.current[i] ?? 0
                const isScr = v > 0.5
                if (isScr) {
                    const g = scrambleCache.current[i] || ch
                    if (el.textContent !== g) el.textContent = g
                } else {
                    if (el.textContent !== ch) el.textContent = ch
                }
                el.style.color = lerpColorStr(baseRGB, lensRGB, clamp01(v))
                wasScrambled.current[i] = isScr
            }

            raf.current = requestAnimationFrame(loop)
        }
        raf.current = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeText, radius, softness, churn, scrambleChars, color, lensColor])

    // Pointer handlers live on the TEXT block, not the whole component, so the
    // effect only triggers when the cursor is actually over the text — not the
    // empty space around it.
    const onMove = (e: React.PointerEvent) => {
        const wrap = wrapRef.current
        if (!wrap) return
        const r = wrap.getBoundingClientRect()
        mouse.current.x = e.clientX - r.left
        mouse.current.y = e.clientY - r.top
        mouse.current.active = true
        moved.current = true
    }
    const onLeave = () => {
        mouse.current.active = false
        mouse.current.x = -99999
        mouse.current.y = -99999
        moved.current = true
    }

    const charTransition =
        animMs > 0
            ? `color ${animMs}ms linear, opacity ${animMs}ms linear`
            : "none"

    let charIndex = 0
    const nodes: any[] = []
    const words = safeText.split(/(\s+)/)
    words.forEach((word, wi) => {
        if (word === "") return
        const isSpace = /^\s+$/.test(word)
        if (isSpace) {
            const spaceSpans = word.split("").map((sp) => {
                const idx = charIndex++
                return (
                    <span key={"s" + idx} style={{ whiteSpace: "pre" }}>
                        {sp === "\n" ? "\n" : "\u00A0"}
                    </span>
                )
            })
            nodes.push(
                <span key={"w" + wi} style={{ whiteSpace: "pre" }}>
                    {spaceSpans}
                </span>
            )
        } else {
            const letterSpans = word.split("").map((ch) => {
                const idx = charIndex++
                return (
                    <span
                        key={"c" + idx}
                        ref={(el) => {
                            charRefs.current[idx] = el
                        }}
                        style={{
                            display: "inline-block",
                            textAlign: "center",
                            color,
                            transition: charTransition,
                        }}
                    >
                        {ch}
                    </span>
                )
            })
            nodes.push(
                <span
                    key={"w" + wi}
                    style={{ display: "inline-block", whiteSpace: "nowrap" }}
                >
                    {letterSpans}
                </span>
            )
        }
    })

    return (
        <div
            ref={wrapRef}
            style={{
                ...style,
                ...font,
                color,
                background,
                borderRadius: cornerRadius,
                padding,
                boxSizing: "border-box",
                textAlign: align,
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
                cursor: "default",
                overflow: "hidden",
            }}
        >
            <div
                ref={textRef}
                onPointerMove={onMove}
                onPointerLeave={onLeave}
                style={{
                    // shrink-to-fit the text so hover area matches the words,
                    // not the full component width.
                    width: align === "left" ? "fit-content" : "100%",
                    maxWidth: "100%",
                    whiteSpace: "pre-wrap",
                }}
            >
                {nodes}
            </div>
        </div>
    )
}

interface RGB {
    r: number
    g: number
    b: number
}

function parseColor(c: string): RGB {
    const s = (c || "#000000").trim()
    if (s.startsWith("#")) {
        let hex = s.slice(1)
        if (hex.length === 3)
            hex = hex
                .split("")
                .map((x) => x + x)
                .join("")
        const n = parseInt(hex, 16)
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
    }
    if (s.startsWith("rgb")) {
        const nums = s.replace(/[^0-9.,]/g, "").split(",")
        return {
            r: parseFloat(nums[0]) || 0,
            g: parseFloat(nums[1]) || 0,
            b: parseFloat(nums[2]) || 0,
        }
    }
    return { r: 0, g: 0, b: 0 }
}

function clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v
}

function lerpColorStr(a: RGB, b: RGB, t: number): string {
    const r = Math.round(a.r + (b.r - a.r) * t)
    const g = Math.round(a.g + (b.g - a.g) * t)
    const bl = Math.round(a.b + (b.b - a.b) * t)
    return `rgb(${r},${g},${bl})`
}

const defaultProps: ScrambleTextProps = {
    text: "Hover over this text to scramble it",
    font: { fontFamily: "Inter, sans-serif", fontSize: 36, fontWeight: 700 },
    color: "#111111",
    lensColor: "#6C5CE7",
    background: "rgba(0,0,0,0)",
    cornerRadius: 0,
    padding: 0,
    align: "left",
    radius: 70,
    softness: 40,
    churn: 20,
    animate: 90,
    scrambleChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+0123456789",
}

ScrambleText.defaultProps = defaultProps

addPropertyControls(ScrambleText, {
    text: {
        type: ControlType.String,
        title: "Text",
        displayTextArea: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    color: { type: ControlType.Color, title: "Text Color" },
    lensColor: {
        type: ControlType.Color,
        title: "Scramble Color",
        description: "Colour of the scrambled letters outside the lens.",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 120,
        step: 2,
        unit: "px",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    radius: {
        type: ControlType.Number,
        title: "Lens Size",
        min: 10,
        max: 400,
        step: 5,
        unit: "px",
        description: "Radius of the readable area around the cursor.",
    },
    softness: {
        type: ControlType.Number,
        title: "Edge Softness",
        min: 1,
        max: 200,
        step: 1,
        unit: "px",
        description: "Width of the fade from readable to scrambled.",
    },
    churn: {
        type: ControlType.Number,
        title: "Churn",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description:
            "Random share of scrambled letters that re-roll each time the pointer moves (0 = frozen).",
    },
    animate: {
        type: ControlType.Number,
        title: "Animation",
        min: 0,
        max: 400,
        step: 10,
        unit: "ms",
        description: "Smoothing time for character colour/fade transitions.",
    },
    scrambleChars: {
        type: ControlType.String,
        title: "Scramble Set",
        description: "Characters used for the scrambled letters.",
    },
})
