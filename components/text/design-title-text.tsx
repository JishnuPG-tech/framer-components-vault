import React, { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export type Swatch = { bg: string; fg: string }

export function generateSwatches(primary: string, accent: string): Swatch[] {
    return [
        { bg: primary, fg: "#ffffff" },
        { bg: accent, fg: "#0a0a0a" },
        { bg: "#f0c2f7", fg: "#0a0a0a" },
        { bg: "#22e58b", fg: "#0a0a0a" },
        { bg: "#7c4dff", fg: "#ffffff" },
        { bg: "#ffe14d", fg: "#0a0a0a" },
        { bg: "#18b6ff", fg: "#0a0a0a" },
        { bg: "#ff7a1a", fg: "#0a0a0a" },
        { bg: "#ff4fa3", fg: "#0a0a0a" },
    ]
}

export function randomSwatchAvoiding(pool: Swatch[], used: Swatch[]): Swatch {
    const free = pool.filter((s) => !used.includes(s))
    const selectedPool = free.length > 0 ? free : pool
    return selectedPool[(Math.random() * selectedPool.length) | 0]
}

// --- Text Measurement Helper ---
export const REF_FS = 72
export const BASELINE_Y = 82

export type GlyphMetrics = {
    ch: string
    x: number
    w: number
    top: number
    bottom: number
}

export type WordMetrics = {
    width: number
    glyphs: GlyphMetrics[]
}

let canvasCtx: CanvasRenderingContext2D | null = null

function getCtx(): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") return null
    if (!canvasCtx) {
        const c = document.createElement("canvas")
        canvasCtx = c.getContext("2d", { willReadFrequently: true })
    }
    return canvasCtx
}

export function measureWord(
    word: string,
    fontFamily: string,
    fontWeight = "500"
): WordMetrics | null {
    const ctx = getCtx()
    if (!ctx) return null

    const fontStr = `${fontWeight} ${REF_FS}px ${fontFamily}`
    ctx.font = fontStr

    const chars = [...word]
    let currentX = 0
    const glyphs: GlyphMetrics[] = []

    for (let i = 0; i < chars.length; i++) {
        const ch = chars[i]
        const m = ctx.measureText(ch)
        const w = m.width

        const top = BASELINE_Y - (m.actualBoundingBoxAscent || REF_FS * 0.75)
        const bottom =
            BASELINE_Y + (m.actualBoundingBoxDescent || REF_FS * 0.25)

        glyphs.push({ ch, x: currentX, w, top, bottom })
        currentX += w
    }

    const totalWidth = ctx.measureText(word).width || currentX
    return { width: totalWidth, glyphs }
}

// --- Engine ---
const SVGNS = "http://www.w3.org/2000/svg"

const FLY_STAGGER = 130
const FLY_MS = 760
const SHUFFLE_MIN = 1300
const SHUFFLE_MAX = 3200
const COLOR_MS = 520

const PAD_Y = 6
const PAD_X = 2

const BAND_ASCENT = 82
const BAND_DESCENT = 26

type LetterRect = {
    el: SVGRectElement
    x0: number
    x1: number
    baseY: number
    baseH: number
    hovered: boolean
}

type Tile = {
    outer: HTMLSpanElement
    svg: SVGSVGElement
    rects: LetterRect[]
    textEl: SVGTextElement
    word: string
    swatch: Swatch
    nextShuffle: number
}

export class DesignTiles {
    private host: HTMLElement
    private root: HTMLDivElement
    private bar: HTMLDivElement
    private tiles: Tile[] = []
    private fontFamily = "sans-serif"
    private customWords: string[] = ["design", "is", "how", "it", "works"]
    private swatches: Swatch[] = []

    private raf = 0
    private running = false
    private disposed = false
    private revealed = false
    private now = 0

    private ro?: ResizeObserver
    private cleanup: (() => void)[] = []

    constructor(
        host: HTMLElement,
        options: {
            words?: string[]
            fontFamily?: string
            primaryColor?: string
            accentColor?: string
        } = {}
    ) {
        this.host = host
        if (options.words && options.words.length > 0) {
            this.customWords = options.words
        }

        this.swatches = generateSwatches(
            options.primaryColor || "#0a0a0a",
            options.accentColor || "#ff2e20"
        )

        const root = document.createElement("div")
        Object.assign(root.style, {
            position: "absolute",
            inset: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            userSelect: "none",
        })
        root.setAttribute("aria-label", this.customWords.join(" "))

        this.fontFamily = options.fontFamily || "sans-serif"

        const bar = document.createElement("div")
        Object.assign(bar.style, { display: "flex", alignItems: "center" })

        this.customWords.forEach((word, i) => {
            const sw =
                this.swatches[i % this.swatches.length] ??
                randomSwatchAvoiding(this.swatches, [])

            const outer = document.createElement("span")
            Object.assign(outer.style, {
                display: "grid",
                gridTemplateColumns: "0fr",
                transition: `grid-template-columns ${FLY_MS}ms cubic-bezier(.16,1,.3,1)`,
            })

            const clip = document.createElement("span")
            clip.style.overflow = "hidden"

            const svg = document.createElementNS(SVGNS, "svg")
            Object.assign(svg.style, {
                display: "block",
                height: "clamp(1.6rem, 4vw, 2.9rem)",
                opacity: "0",
                transition: `opacity ${Math.round(FLY_MS * 0.8)}ms ease`,
            })

            const gBg = document.createElementNS(SVGNS, "g")
            const textEl = document.createElementNS(SVGNS, "text")
            textEl.setAttribute("font-family", this.fontFamily)
            textEl.setAttribute("font-weight", "500")
            textEl.setAttribute("font-size", String(REF_FS))
            textEl.setAttribute("dominant-baseline", "alphabetic")
            textEl.style.fill = sw.fg
            textEl.style.transition = `fill ${COLOR_MS}ms ease`
            textEl.textContent = word

            svg.appendChild(gBg)
            svg.appendChild(textEl)
            clip.appendChild(svg)
            outer.appendChild(clip)
            bar.appendChild(outer)

            this.tiles.push({
                outer,
                svg,
                rects: [],
                textEl,
                word,
                swatch: sw,
                nextShuffle: 0,
            })
        })

        root.appendChild(bar)
        host.appendChild(root)
        this.root = root
        this.bar = bar

        this.layout()
        this.bindEvents()
    }

    private layout() {
        for (const tile of this.tiles) {
            const m = measureWord(tile.word, this.fontFamily, "500")

            for (const r of tile.rects) r.el.remove()
            tile.rects = []
            if (!m) {
                this.buildFallback(tile)
                continue
            }
            this.buildRects(tile, m)
        }
    }

    private buildRects(tile: Tile, m: WordMetrics) {
        const gBg = tile.svg.firstChild as SVGGElement

        const bandTop = BASELINE_Y - BAND_ASCENT
        const bandBottom = BASELINE_Y + BAND_DESCENT

        for (let i = 0; i < m.glyphs.length; i++) {
            const g = m.glyphs[i]
            if (g.ch === " ") continue
            const top = Math.max(bandTop, g.top - PAD_Y)
            const bottom = Math.min(bandBottom, g.bottom + PAD_Y)

            const next = m.glyphs[i + 1]
            const right = next ? next.x : g.x + g.w
            const left = g.x - (i === 0 ? PAD_X : 0)
            const width = right - left + PAD_X
            const rect = document.createElementNS(SVGNS, "rect")
            rect.setAttribute("x", String(left))
            rect.setAttribute("y", String(top))
            rect.setAttribute("width", String(width))
            rect.setAttribute("height", String(bottom - top))
            rect.style.fill = tile.swatch.bg

            rect.style.transition = `fill ${COLOR_MS}ms ease, y 160ms ease, height 160ms ease`
            gBg.appendChild(rect)
            tile.rects.push({
                el: rect,
                x0: left,
                x1: left + width,
                baseY: top,
                baseH: bottom - top,
                hovered: false,
            })
        }

        tile.textEl.setAttribute("x", "0")
        tile.textEl.setAttribute("y", String(BASELINE_Y))
        const vbX = -PAD_X
        const vbW = m.width + PAD_X * 2
        const vbY = bandTop
        const vbH = bandBottom - bandTop
        tile.svg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`)
        tile.svg.setAttribute("preserveAspectRatio", "xMidYMid meet")

        tile.svg.removeAttribute("width")
        tile.svg.removeAttribute("height")
        tile.svg.style.width = "auto"
    }

    private buildFallback(tile: Tile) {
        const gBg = tile.svg.firstChild as SVGGElement
        const rect = document.createElementNS(SVGNS, "rect")
        rect.setAttribute("x", "0")
        rect.setAttribute("y", "0")
        rect.setAttribute("width", "100")
        rect.setAttribute("height", "100")
        rect.style.fill = tile.swatch.bg
        gBg.appendChild(rect)
        tile.rects.push({
            el: rect,
            x0: 0,
            x1: 100,
            baseY: 0,
            baseH: 100,
            hovered: false,
        })
        tile.svg.setAttribute("viewBox", "0 0 100 100")
    }

    private bindEvents() {
        this.tiles.forEach((tile) => {
            const onEnter = () => this.recolor(tile)
            tile.svg.addEventListener("pointerenter", onEnter)

            const onMove = (e: PointerEvent) => this.hoverLetter(tile, e)
            const onLeave = () => this.clearHover(tile)
            tile.svg.addEventListener("pointermove", onMove)
            tile.svg.addEventListener("pointerleave", onLeave)
            this.cleanup.push(() => {
                tile.svg.removeEventListener("pointerenter", onEnter)
                tile.svg.removeEventListener("pointermove", onMove)
                tile.svg.removeEventListener("pointerleave", onLeave)
            })
        })

        if (typeof ResizeObserver !== "undefined") {
            this.ro = new ResizeObserver(() => this.layout())
            this.ro.observe(this.host)
        }
    }

    private hoverLetter(tile: Tile, e: PointerEvent) {
        const rect = tile.svg.getBoundingClientRect()
        if (rect.width < 1) return
        const vb = tile.svg.viewBox.baseVal
        const scale = vb.width / rect.width
        const grow = 2 * scale
        const px = vb.x + ((e.clientX - rect.left) / rect.width) * vb.width

        for (const r of tile.rects) {
            const isHit = px >= r.x0 && px < r.x1
            if (isHit === r.hovered) continue
            r.hovered = isHit
            if (isHit) {
                r.el.style.y = `${r.baseY - grow / 2}px`
                r.el.style.height = `${r.baseH + grow}px`
            } else {
                r.el.style.y = `${r.baseY}px`
                r.el.style.height = `${r.baseH}px`
            }
        }
    }

    private clearHover(tile: Tile) {
        for (const r of tile.rects) {
            if (!r.hovered) continue
            r.hovered = false
            r.el.style.y = `${r.baseY}px`
            r.el.style.height = `${r.baseH}px`
        }
    }

    private recolor(tile: Tile) {
        const used = this.tiles.filter((t) => t !== tile).map((t) => t.swatch)
        const sw = randomSwatchAvoiding(this.swatches, used)
        tile.swatch = sw
        for (const r of tile.rects) r.el.style.fill = sw.bg
        tile.textEl.style.fill = sw.fg
    }

    private reveal() {
        if (this.revealed) return
        this.revealed = true
        this.tiles.forEach((tile, i) => {
            const delay = i * FLY_STAGGER
            const t = window.setTimeout(() => {
                tile.outer.style.gridTemplateColumns = "1fr"
                tile.svg.style.opacity = "1"
            }, delay)
            this.cleanup.push(() => window.clearTimeout(t))
        })
        const assembledAt = this.tiles.length * FLY_STAGGER + FLY_MS
        this.tiles.forEach((tile) => {
            tile.nextShuffle =
                performance.now() +
                assembledAt +
                SHUFFLE_MIN +
                Math.random() * (SHUFFLE_MAX - SHUFFLE_MIN)
        })
    }

    start() {
        if (this.running || this.disposed) return
        this.running = true
        this.reveal()
        this.raf = requestAnimationFrame(this.loop)
    }

    stop() {
        this.running = false
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = 0
    }

    private loop = () => {
        if (!this.running) return
        this.now = performance.now()
        for (const tile of this.tiles) {
            if (tile.nextShuffle === 0) continue
            if (this.now >= tile.nextShuffle) {
                this.recolor(tile)
                tile.nextShuffle =
                    this.now +
                    SHUFFLE_MIN +
                    Math.random() * (SHUFFLE_MAX - SHUFFLE_MIN)
            }
        }
        this.raf = requestAnimationFrame(this.loop)
    }

    renderStill() {
        this.revealed = true
        this.tiles.forEach((tile) => {
            tile.outer.style.transition = "none"
            tile.outer.style.gridTemplateColumns = "1fr"
            tile.svg.style.transition = "none"
            tile.svg.style.opacity = "1"
            for (const r of tile.rects) {
                r.el.style.transition = "none"
            }
            tile.textEl.style.transition = "none"
        })
    }

    destroy() {
        this.disposed = true
        this.stop()
        this.ro?.disconnect()
        this.cleanup.forEach((fn) => fn())
        this.root.parentNode?.removeChild(this.root)
        void this.bar
    }
}

// --- Framer Smart Component ---
export default function DesignTilesComponent(props) {
    const hostRef = useRef<HTMLDivElement>(null)

    // Check Framer static rendering context (Canvas / SSG Export)
    const isStatic = useIsStaticRenderer()

    useEffect(() => {
        const host = hostRef.current
        if (!host) return

        const words = props.text ? props.text.split(" ").filter(Boolean) : []
        const fontFamily = props.fontFamily?.fontFamily || "sans-serif"

        const engine = new DesignTiles(host, {
            words,
            fontFamily,
            primaryColor: props.primaryColor,
            accentColor: props.accentColor,
        })

        const prefersReducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (isStatic || prefersReducedMotion) {
            engine.renderStill()
        } else {
            engine.start()
        }

        return () => {
            engine.destroy()
        }
    }, [
        props.text,
        props.fontFamily,
        props.primaryColor,
        props.accentColor,
        isStatic,
    ])

    return (
        <div
            ref={hostRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                backgroundColor: props.backgroundColor,
            }}
        />
    )
}

DesignTilesComponent.defaultProps = {
    text: "design is how it works",
    fontFamily: { fontFamily: "sans-serif" },
    primaryColor: "#0a0a0a",
    accentColor: "#ff2e20",
    backgroundColor: "transparent",
}

// --- Framer Property Controls ---
addPropertyControls(DesignTilesComponent, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "design is how it works",
        description: "Space-separated words for the design tiles.",
    },
    fontFamily: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: { fontFamily: "sans-serif" },
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Tile",
        defaultValue: "#0a0a0a",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Tile",
        defaultValue: "#ff2e20",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
        description: "Made with 💛 by [@karimsaif](https://x.com/karimsaif0)",
    },
})
