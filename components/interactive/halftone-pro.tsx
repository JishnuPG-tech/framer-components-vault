import * as React from "react"
import { useEffect, useId, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


const SHEET_URL =
    "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85"

const SHEET_CROPS: number[][] = [
    [0, 0.06, 0.47, 0.4],
    [0.53, 0.06, 0.47, 0.4],
    [0, 0.55, 0.47, 0.4],
    [0.53, 0.55, 0.47, 0.4],
]
const SHEET_TILE_ASPECT = (0.47 * 2688) / (0.4 * 1520)
const TAU = Math.PI * 2
const TILE_PX = 560
// sub-samples taken per dot cell (horizontal × vertical) — averages the whole cell, not one pixel
const SUB_X = 2
const SUB_Y = 3
const INTRO_SECONDS = 1.8
const UI_FONT = "Inter, system-ui, -apple-system, sans-serif"

/* ───────────────────────── themes ───────────────────────── */

type Theme = {
    id: string
    name: string
    bg: string
    inkA: string
    inkB: string
    glow: number
    vignette: number
    scan: number
    dark: boolean
}

const THEMES: Theme[] = [
    {
        id: "paper",
        name: "Paper",
        bg: "#f7f7f5",
        inkA: "#0d0d0d",
        inkB: "#0d0d0d",
        glow: 0,
        vignette: 0,
        scan: 0,
        dark: false,
    },
    {
        id: "graphite",
        name: "Graphite",
        bg: "#0c0c0d",
        inkA: "#f4f1ea",
        inkB: "#f4f1ea",
        glow: 3,
        vignette: 0.4,
        scan: 0,
        dark: true,
    },
    {
        id: "phosphor",
        name: "Phosphor",
        bg: "#030805",
        inkA: "#2dff7e",
        inkB: "#b9ffd4",
        glow: 9,
        vignette: 0.6,
        scan: 0.4,
        dark: true,
    },
    {
        id: "amber",
        name: "Amber CRT",
        bg: "#0d0702",
        inkA: "#ff9a24",
        inkB: "#ffd57c",
        glow: 10,
        vignette: 0.6,
        scan: 0.4,
        dark: true,
    },
    {
        id: "blueprint",
        name: "Blueprint",
        bg: "#0a2b4f",
        inkA: "#e0efff",
        inkB: "#8cc6ff",
        glow: 3,
        vignette: 0.35,
        scan: 0,
        dark: true,
    },
    {
        id: "riso",
        name: "Risograph",
        bg: "#f3ede1",
        inkA: "#ff4a7d",
        inkB: "#2b57ff",
        glow: 0,
        vignette: 0.08,
        scan: 0,
        dark: false,
    },
    {
        id: "ember",
        name: "Ember",
        bg: "#130605",
        inkA: "#ff4527",
        inkB: "#ffc85e",
        glow: 8,
        vignette: 0.55,
        scan: 0,
        dark: true,
    },
    {
        id: "neon",
        name: "Neon Night",
        bg: "#08051a",
        inkA: "#ff3ccf",
        inkB: "#33e9ff",
        glow: 10,
        vignette: 0.5,
        scan: 0.2,
        dark: true,
    },
    {
        id: "sage",
        name: "Sage",
        bg: "#e6eae0",
        inkA: "#1f3528",
        inkB: "#55735a",
        glow: 0,
        vignette: 0.14,
        scan: 0,
        dark: false,
    },
    {
        id: "gilt",
        name: "Gilt",
        bg: "#0f0f0f",
        inkA: "#b5853a",
        inkB: "#f4dc9e",
        glow: 5,
        vignette: 0.5,
        scan: 0,
        dark: true,
    },
    {
        id: "ice",
        name: "Glacier",
        bg: "#edf3f7",
        inkA: "#0f3557",
        inkB: "#3a86bd",
        glow: 0,
        vignette: 0.1,
        scan: 0,
        dark: false,
    },
]

function customTheme(c: any): Theme {
    return {
        id: "custom",
        name: c.name || "Custom",
        bg: c.background,
        inkA: c.inkA,
        inkB: c.inkB,
        glow: c.glow,
        vignette: c.vignette / 100,
        scan: c.scanlines / 100,
        dark: c.dark,
    }
}

function themeList(p: any): Theme[] {
    return p.theme.initial === "custom" || p.custom.inMenu
        ? [...THEMES, customTheme(p.custom)]
        : THEMES
}

function findTheme(id: string, p: any): Theme {
    if (id === "custom") return customTheme(p.custom)
    return THEMES.find((t) => t.id === id) || THEMES[0]
}

/* ───────────────────────── defaults ───────────────────────── */

const DEFAULTS: any = {
    theme: {
        initial: "paper",
        switcher: true,
        label: "Theme",
        inset: 16,
        glow: 100,
        vignette: true,
        scanlines: true,
    },
    custom: {
        name: "Custom",
        background: "#f7f7f5",
        inkA: "#0d0d0d",
        inkB: "#0d0d0d",
        dark: false,
        glow: 0,
        vignette: 0,
        scanlines: 0,
        inMenu: false,
    },
    hands: {
        source: "sheet",
        sheetUrl: SHEET_URL,
        leftAUrl: "",
        rightAUrl: "",
        leftBUrl: "",
        rightBUrl: "",
        width: 56,
        centerY: 50,
        bleed: 4.5,
        gap: 9,
    },
    dots: {
        shape: "circle",
        density: 190,
        rowGap: 1.9,
        size: 94,
        levels: 6,
        minDot: 30,
        threshold: 14,
        softness: 44,
        contrast: 1.15,
        detail: 0.9,
    },
    motion: {
        loop: 20,
        speed: 1,
        drift: 100,
        breathe: 100,
        roll: 100,
        morph: true,
        glitch: true,
        shimmer: 100,
        intro: true,
    },
    lens: {
        enabled: true,
        radius: 130,
        swell: 40,
        push: 6,
        reveal: 25,
    },
}

const GROUPS = ["theme", "custom", "hands", "dots", "motion", "lens"]

function resolve(p: any) {
    const o: any = { ...DEFAULTS, ...p }
    for (const k of GROUPS) o[k] = { ...DEFAULTS[k], ...(p?.[k] || {}) }
    return o
}

/* ───────────────────────── shared pure helpers ───────────────────────── */

const pickSrc = (img: any, url?: string) =>
    (typeof img === "string" ? img : img?.src) || (url || "").trim()

function handPlan(h: any): { srcs: string[]; crops: (number[] | null)[] } {
    if (h.source === "split") {
        let la = pickSrc(h.leftA, h.leftAUrl)
        let ra = pickSrc(h.rightA, h.rightAUrl)
        let lb = pickSrc(h.leftB, h.leftBUrl)
        let rb = pickSrc(h.rightB, h.rightBUrl)
        la = la || lb
        ra = ra || rb
        lb = lb || la
        rb = rb || ra
        return { srcs: [la, ra, lb, rb], crops: [null, null, null, null] }
    }
    const s = pickSrc(h.sheet, h.sheetUrl)
    return { srcs: [s, s, s, s], crops: SHEET_CROPS }
}

const rgbCache = new Map<string, number[]>()
function toRgb(c: string): number[] {
    const hit = rgbCache.get(c)
    if (hit) return hit
    let out = [13, 13, 13]
    const s = (c || "").trim()
    if (s[0] === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((ch) => ch + ch)
                .join("")
        const n = parseInt(h.slice(0, 6), 16)
        if (!isNaN(n)) out = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    } else {
        const m = s.match(/[\d.]+/g)
        if (m && m.length >= 3) out = [+m[0], +m[1], +m[2]]
    }
    rgbCache.set(c, out)
    return out
}
const rgba = (c: string, a: number) => {
    const [r, g, b] = toRgb(c)
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

const vignetteFill = (t: Theme) =>
    `radial-gradient(120% 95% at 50% 50%, transparent 52%, rgba(0,0,0,${(t.dark ? 0.85 : 0.35) * t.vignette}) 100%)`
const scanFill = (t: Theme) =>
    `repeating-linear-gradient(0deg, rgba(0,0,0,${0.32 * t.scan}) 0px, rgba(0,0,0,${0.32 * t.scan}) 1px, transparent 1px, transparent 3px)`

const chrome = (t: Theme) =>
    t.dark
        ? {
              surface: "rgba(22, 22, 26, 0.72)",
              line: "rgba(255,255,255,0.12)",
              text: "#f3f1ec",
              sub: "rgba(243,241,236,0.55)",
              hover: "rgba(255,255,255,0.08)",
          }
        : {
              surface: "rgba(255, 255, 255, 0.78)",
              line: "rgba(0,0,0,0.09)",
              text: "#141414",
              sub: "rgba(20,20,20,0.5)",
              hover: "rgba(0,0,0,0.05)",
          }

const pillBase = (t: Theme): React.CSSProperties => {
    const c = chrome(t)
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 12px 0 7px",
        borderRadius: 999,
        background: c.surface,
        border: `1px solid ${c.line}`,
        color: c.text,
        fontFamily: UI_FONT,
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "-0.01em",
        boxShadow: t.dark
            ? "0 6px 24px rgba(0,0,0,0.35)"
            : "0 6px 24px rgba(0,0,0,0.08)",
        whiteSpace: "nowrap",
    }
}

const swatchDot = (t: Theme, size: number): React.CSSProperties => ({
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0,
    background: `linear-gradient(135deg, ${t.inkA} 0 50%, ${t.inkB} 50% 100%)`,
    boxShadow: `0 0 0 2px ${t.bg}, 0 0 0 3px ${t.dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.14)"}`,
})

function Caret({ open, color }: { open?: boolean; color: string }) {
    return (
        <svg
            width={10}
            height={10}
            viewBox="0 0 10 10"
            aria-hidden
            style={{
                display: "block",
                transform: open ? "rotate(180deg)" : undefined,
                transition:
                    open === undefined ? undefined : "transform .25s ease",
            }}
        >
            <path
                d="M2 3.6 5 6.6 8 3.6"
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/* ───────────────────────── entry ───────────────────────── */

/**
 * @framerIntrinsicWidth 700
 * @framerIntrinsicHeight 700
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerDisableUnlink
 */
export default function HalftoneHands(props: any) {
    const isStatic = useIsStaticRenderer()
    if (isStatic) return <StillFrame {...props} />
    return <LiveFrame {...props} />
}

/* ───────────────────────── static branch ───────────────────────── */

function StillFrame(raw: any) {
    const p = resolve(raw)
    const { hands, dots, theme } = p
    const t = findTheme(theme.initial, p)
    const plan = handPlan(hands)
    const pitch = Math.max(3, 700 / Math.max(40, dots.density))
    const row = pitch * dots.rowGap
    const gapIn = 50 - hands.gap * 0.32
    const gapOut = 50 - hands.gap
    const seamMask = `linear-gradient(90deg, #000 ${gapOut}%, transparent ${gapIn}%, transparent ${100 - gapIn}%, #000 ${100 - gapOut}%)`
    const dotMask =
        dots.shape === "square"
            ? `linear-gradient(#000 0 0)`
            : `radial-gradient(circle closest-side, #000 ${Math.round(dots.size * 0.92)}%, transparent ${Math.round(dots.size)}%)`
    const sq = Math.max(1, pitch * (dots.size / 100) * 0.86)
    const dotSize =
        dots.shape === "square" ? `${sq}px ${sq}px` : `${pitch}px ${row}px`

    const handBox = (side: number) => {
        const src = plan.srcs[side]
        const crop = plan.crops[side]
        const left = side === 0
        let size = "100% 100%"
        let pos = "0% 0%"
        if (crop) {
            const [x, y, w, h] = crop
            size = `${100 / w}% ${100 / h}%`
            pos = `${w < 1 ? (x / (1 - w)) * 100 : 0}% ${h < 1 ? (y / (1 - h)) * 100 : 0}%`
        }
        return (
            <div
                style={{
                    position: "absolute",
                    top: `${hands.centerY}%`,
                    width: `${hands.width}%`,
                    aspectRatio: `${SHEET_TILE_ASPECT}`,
                    transform: "translateY(-50%)",
                    [left ? "left" : "right"]: `${-hands.bleed}%`,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: left ? t.inkA : t.inkB,
                        WebkitMaskImage: dotMask,
                        maskImage: dotMask,
                        WebkitMaskSize: dotSize,
                        maskSize: dotSize,
                        WebkitMaskRepeat:
                            dots.shape === "square" ? "space" : "repeat",
                        maskRepeat:
                            dots.shape === "square" ? "space" : "repeat",
                    }}
                />
                {src && (
                    <div
                        style={
                            {
                                position: "absolute",
                                inset: 0,
                                background: t.bg,
                                maskImage: `url("${src}")`,
                                maskMode: "luminance",
                                maskSize: size,
                                maskPosition: pos,
                                maskRepeat: "no-repeat",
                            } as React.CSSProperties
                        }
                    />
                )}
            </div>
        )
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: t.bg,
            }}
        >
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    WebkitMaskImage: seamMask,
                    maskImage: seamMask,
                }}
            >
                {handBox(0)}
                {handBox(1)}
            </div>
            {theme.scanlines && t.scan > 0 && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: scanFill(t),
                    }}
                />
            )}
            {theme.vignette && t.vignette > 0 && (
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        background: vignetteFill(t),
                    }}
                />
            )}
            {theme.switcher && (
                <div
                    style={{
                        position: "absolute",
                        top: theme.inset,
                        left: theme.inset,
                        zIndex: 5,
                    }}
                >
                    <div style={pillBase(t)}>
                        <span style={swatchDot(t, 18)} />
                        <span style={{ color: chrome(t).sub }}>
                            {theme.label}
                        </span>
                        <span>{t.name}</span>
                        <Caret color={chrome(t).text} />
                    </div>
                </div>
            )}
        </div>
    )
}

/* ───────────────────────── live branch: theme switcher ───────────────────────── */

function ThemeMenu({
    themes,
    active,
    onPick,
    label,
    inset,
    maxHeight,
}: {
    themes: Theme[]
    active: Theme
    onPick: (id: string) => void
    label: string
    inset: number
    maxHeight: number
}) {
    const [open, setOpen] = useState(false)
    const [focus, setFocus] = useState(-1)
    const boxRef = useRef<HTMLDivElement>(null)
    const scope = "tgm" + useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const c = chrome(active)

    useEffect(() => {
        if (!open) return
        const onDown = (ev: PointerEvent) => {
            if (boxRef.current && !boxRef.current.contains(ev.target as Node))
                setOpen(false)
        }
        const onKey = (ev: KeyboardEvent) => {
            if (ev.key === "Escape") setOpen(false)
        }
        document.addEventListener("pointerdown", onDown, true)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("pointerdown", onDown, true)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    const choose = (id: string) => {
        onPick(id)
        setOpen(false)
    }

    const onListKey = (ev: React.KeyboardEvent) => {
        if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            ev.preventDefault()
            const d = ev.key === "ArrowDown" ? 1 : -1
            setFocus((f) => (f + d + themes.length) % themes.length)
        } else if ((ev.key === "Enter" || ev.key === " ") && focus >= 0) {
            ev.preventDefault()
            choose(themes[focus].id)
        }
    }

    const css = `
.${scope}-pill{cursor:pointer;transition:background .5s ease,color .5s ease,border-color .5s ease,transform .2s ease;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
.${scope}-pill:hover{transform:translateY(-1px)}
.${scope}-pill:focus-visible{outline:2px solid ${active.inkA};outline-offset:2px}
.${scope}-menu{transition:opacity .22s ease,transform .26s cubic-bezier(.2,.8,.2,1),visibility 0s linear .26s;-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
.${scope}-menu[data-open="true"]{transition:opacity .22s ease,transform .26s cubic-bezier(.2,.8,.2,1),visibility 0s}
.${scope}-row{transition:background .15s ease}
.${scope}-row:hover,.${scope}-row[data-focus="true"]{background:${c.hover}}
.${scope}-menu::-webkit-scrollbar{width:0;height:0}
`

    return (
        <div
            ref={boxRef}
            style={{
                position: "absolute",
                top: inset,
                left: inset,
                zIndex: 5,
                fontFamily: UI_FONT,
            }}
        >
            <style>{css}</style>
            <button
                type="button"
                className={`${scope}-pill`}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => {
                    setOpen((o) => !o)
                    setFocus(themes.findIndex((x) => x.id === active.id))
                }}
                onKeyDown={(ev) => {
                    if (
                        !open &&
                        (ev.key === "ArrowDown" || ev.key === "ArrowUp")
                    ) {
                        ev.preventDefault()
                        setOpen(true)
                        setFocus(themes.findIndex((x) => x.id === active.id))
                    } else if (open) onListKey(ev)
                }}
                style={{ ...pillBase(active), outline: "none" }}
            >
                <span
                    style={{
                        ...swatchDot(active, 18),
                        transition: "background .5s ease, box-shadow .5s ease",
                    }}
                />
                <span style={{ color: c.sub }}>{label}</span>
                <span>{active.name}</span>
                <Caret open={open} color={c.text} />
            </button>

            <div
                role="listbox"
                aria-label={label}
                className={`${scope}-menu`}
                data-open={open ? "true" : "false"}
                style={{
                    position: "absolute",
                    top: 42,
                    left: 0,
                    width: 214,
                    maxHeight: Math.max(120, maxHeight),
                    overflowY: "auto",
                    padding: 6,
                    borderRadius: 16,
                    background: c.surface,
                    border: `1px solid ${c.line}`,
                    boxShadow: active.dark
                        ? "0 18px 50px rgba(0,0,0,0.5)"
                        : "0 18px 50px rgba(0,0,0,0.14)",
                    opacity: open ? 1 : 0,
                    transform: open
                        ? "translateY(0) scale(1)"
                        : "translateY(-6px) scale(0.97)",
                    transformOrigin: "top left",
                    visibility: open ? "visible" : "hidden",
                    pointerEvents: open ? "auto" : "none",
                }}
            >
                {themes.map((t, i) => {
                    const on = t.id === active.id
                    return (
                        <div
                            key={t.id}
                            role="option"
                            aria-selected={on}
                            className={`${scope}-row`}
                            data-focus={focus === i ? "true" : "false"}
                            onPointerEnter={() => setFocus(i)}
                            onClick={() => choose(t.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                height: 36,
                                padding: "0 8px",
                                borderRadius: 10,
                                cursor: "pointer",
                                color: c.text,
                                fontSize: 12.5,
                                fontWeight: on ? 600 : 500,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            <span
                                style={{
                                    position: "relative",
                                    width: 26,
                                    height: 20,
                                    borderRadius: 6,
                                    background: t.bg,
                                    flexShrink: 0,
                                    boxShadow: `inset 0 0 0 1px ${t.dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.1)"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 3,
                                }}
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: t.inkA,
                                        boxShadow: t.glow
                                            ? `0 0 5px ${t.inkA}`
                                            : undefined,
                                    }}
                                />
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: t.inkB,
                                        boxShadow: t.glow
                                            ? `0 0 5px ${t.inkB}`
                                            : undefined,
                                    }}
                                />
                            </span>
                            <span style={{ flex: 1 }}>{t.name}</span>
                            {on && (
                                <svg
                                    width={12}
                                    height={12}
                                    viewBox="0 0 12 12"
                                    aria-hidden
                                >
                                    <path
                                        d="M2.5 6.2 5 8.6 9.6 3.6"
                                        fill="none"
                                        stroke={c.text}
                                        strokeWidth={1.6}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ───────────────────────── live branch: canvas engine helpers ───────────────────────── */

const ease = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
}
const gate = (t: number, on: number, off: number, d: number) =>
    ease(on, on + d, t) * (1 - ease(off, off + d, t))
const noise = (a: number, b: number) => {
    const v = Math.sin(a * 91.373 + b * 263.917) * 47453.531
    return v - Math.floor(v)
}

function fetchImage(
    src: string,
    cors: boolean
): Promise<HTMLImageElement | null> {
    return new Promise((res) => {
        const img = new Image()
        if (cors) img.crossOrigin = "anonymous"
        img.decoding = "async"
        img.onload = () => res(img)
        img.onerror = () => res(null)
        img.src = src
    })
}
async function loadImage(src: string) {
    return (await fetchImage(src, true)) || (await fetchImage(src, false))
}

function cutTile(
    img: HTMLImageElement,
    crop: number[] | null
): HTMLCanvasElement | null {
    const nw = img.naturalWidth
    const nh = img.naturalHeight
    if (!nw || !nh) return null
    const [fx, fy, fw, fh] = crop || [0, 0, 1, 1]
    const cw = nw * fw
    const ch = nh * fh
    const c = document.createElement("canvas")
    c.width = TILE_PX
    c.height = Math.max(1, Math.round((TILE_PX * ch) / cw))
    const x = c.getContext("2d")
    if (!x) return null
    x.imageSmoothingEnabled = true
    x.imageSmoothingQuality = "high"
    x.fillStyle = "#ffffff"
    x.fillRect(0, 0, c.width, c.height)
    x.drawImage(img, fx * nw, fy * nh, cw, ch, 0, 0, c.width, c.height)
    return c
}

function isTainted(tile: HTMLCanvasElement | null) {
    if (!tile) return false
    try {
        tile.getContext("2d")!.getImageData(0, 0, 1, 1)
        return false
    } catch {
        return true
    }
}

function placeHand(
    g: CanvasRenderingContext2D,
    tile: HTMLCanvasElement | null,
    side: number,
    a: number,
    P: any,
    W: number,
    H: number,
    sx: number,
    sy: number,
    ox: number
) {
    if (!tile) return
    const left = side === 0
    const ph = left ? 0 : Math.PI
    const portrait = H > W * 1.02
    const hw = W * (P.hands.width / 100) * (portrait ? 1.245 : 1)
    const hh = (hw * tile.height) / tile.width
    const cy = (H * P.hands.centerY) / 100
    const m = P.motion
    const reach =
        (0.035 * Math.sin(a + ph) + 0.012 * Math.sin(2 * a + 1.3 + ph)) *
        W *
        (m.drift / 100)
    const swell = 1 + 0.07 * (m.breathe / 100) * Math.sin(a + 0.9 + ph)
    const tilt =
        (left ? 1 : -1) * 0.045 * (m.roll / 100) * Math.sin(a + 2.1 + ph)
    const bleed = (W * P.hands.bleed) / 100
    const x = left ? reach - bleed : W - hw + bleed - reach
    const pivot = left ? 0 : W
    g.setTransform(sx, 0, 0, sy, ox, 0)
    g.translate(pivot, cy)
    g.rotate(tilt)
    g.scale(swell, swell)
    g.translate(-pivot, -cy)
    g.imageSmoothingEnabled = true
    g.imageSmoothingQuality = "high"
    g.drawImage(tile, x, cy - hh / 2, hw, hh)
}

function stampDot(
    path: Path2D,
    shape: string,
    x: number,
    y: number,
    r: number
) {
    if (shape === "square") {
        const s = r * 0.9
        path.rect(x - s, y - s, s * 2, s * 2)
    } else if (shape === "diamond") {
        const s = r * 1.15
        path.moveTo(x, y - s)
        path.lineTo(x + s, y)
        path.lineTo(x, y + s)
        path.lineTo(x - s, y)
        path.closePath()
    } else if (shape === "bar") {
        const w = r * 0.62
        const h = r * 1.35
        path.rect(x - w, y - h, w * 2, h * 2)
    } else {
        path.moveTo(x + r, y)
        path.arc(x, y, r, 0, TAU)
    }
}

type Engine = {
    W: number
    H: number
    dpr: number
    step: number
    rowStep: number
    cols: number
    rows: number
    seeds: Float32Array
    inkA: Float32Array
    inkB: Float32Array
    field: HTMLCanvasElement | null
    fctx: CanvasRenderingContext2D | null
    tiles: (HTMLCanvasElement | null)[] | null
    tainted: boolean
    pattern: CanvasPattern | null
    reduce: boolean
    lastDensity: number
    lastRowGap: number
    pointer: { x: number; y: number; inside: boolean }
    lensAmt: number
    lensX: number
    lensY: number
    introT: number
    colA: number[] | null
    colB: number[] | null
    relayout: () => void
    still: () => void
}

/* ───────────────────────── live branch ───────────────────────── */

function LiveFrame(raw: any) {
    const p = resolve(raw)
    const { hands, dots, theme } = p

    const [activeId, setActiveId] = useState<string>(theme.initial)
    useEffect(() => setActiveId(theme.initial), [theme.initial])
    const t = findTheme(activeId, p)
    const themeRef = useRef(t)
    themeRef.current = t
    const [boxH, setBoxH] = useState(700)

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(p)
    propsRef.current = p
    const kickRef = useRef<() => void>(() => {})

    const engRef = useRef<Engine | null>(null)
    if (!engRef.current) {
        engRef.current = {
            W: 0,
            H: 0,
            dpr: 1,
            step: 5,
            rowStep: 10,
            cols: 0,
            rows: 0,
            seeds: new Float32Array(0),
            inkA: new Float32Array(0),
            inkB: new Float32Array(0),
            field: null,
            fctx: null,
            tiles: null,
            tainted: false,
            pattern: null,
            reduce: false,
            lastDensity: 0,
            lastRowGap: 0,
            pointer: { x: 0, y: 0, inside: false },
            lensAmt: 0,
            lensX: 0,
            lensY: 0,
            introT: 0,
            colA: null,
            colB: null,
            relayout: () => {},
            still: () => {},
        }
    }
    const e = engRef.current

    /* engine, sizing, gating and loop */
    useEffect(() => {
        const root = rootRef.current
        const cv = canvasRef.current
        if (!root || !cv) return
        const ctx = cv.getContext("2d")
        if (!ctx) return
        let alive = true

        const relayout = () => {
            const P = propsRef.current
            const W = root.clientWidth
            const H = root.clientHeight
            if (!W || !H) return
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            e.W = W
            e.H = H
            e.dpr = dpr
            cv.width = Math.round(W * dpr)
            cv.height = Math.round(H * dpr)
            const step = Math.max(3, W / Math.max(40, P.dots.density))
            const rowStep = step * Math.max(1, P.dots.rowGap)
            e.step = step
            e.rowStep = rowStep
            e.lastDensity = P.dots.density
            e.lastRowGap = P.dots.rowGap
            const cols = Math.ceil(W / step)
            const rows = Math.ceil(H / rowStep)
            if (cols !== e.cols || rows !== e.rows || !e.field) {
                e.cols = cols
                e.rows = rows
                if (!e.field) e.field = document.createElement("canvas")
                e.field.width = cols * 2 * SUB_X
                e.field.height = rows * SUB_Y
                e.fctx = e.field.getContext("2d", {
                    willReadFrequently: true,
                } as any) as CanvasRenderingContext2D
                const s = new Float32Array(cols * rows)
                for (let j = 0; j < rows; j++) {
                    const rowBias = noise(j * 3.7, 5.3)
                    for (let i = 0; i < cols; i++)
                        s[j * cols + i] = 0.55 * noise(i, j) + 0.45 * rowBias
                }
                e.seeds = s
                e.inkA = new Float32Array(cols * rows)
                e.inkB = new Float32Array(cols * rows)
            }
            e.pattern = null
            setBoxH(H)
        }

        const ensurePattern = () => {
            if (e.pattern) return e.pattern
            const c = document.createElement("canvas")
            c.width = Math.max(1, Math.round(e.step * e.dpr))
            c.height = Math.max(1, Math.round(e.rowStep * e.dpr))
            const x = c.getContext("2d")!
            x.fillStyle = "#000"
            x.beginPath()
            x.arc(
                c.width / 2,
                c.height / 2,
                Math.min(
                    c.width / 2,
                    (e.step * e.dpr * propsRef.current.dots.size) / 200
                ),
                0,
                TAU
            )
            x.fill()
            e.pattern = ctx.createPattern(c, "repeat")
            return e.pattern
        }

        // fallback when the image host blocks pixel reads: draw the photo through a dot stencil
        const paintRaw = (a: number, P: any) => {
            cv.style.mixBlendMode = themeRef.current.dark
                ? "screen"
                : "multiply"
            const tiles = e.tiles!
            for (let side = 0; side < 2; side++)
                placeHand(
                    ctx,
                    tiles[side],
                    side,
                    a,
                    P,
                    e.W,
                    e.H,
                    e.dpr,
                    e.dpr,
                    0
                )
            const pat = ensurePattern()
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            if (pat) {
                ctx.globalCompositeOperation = "destination-in"
                ctx.fillStyle = pat
                ctx.fillRect(0, 0, cv.width, cv.height)
                ctx.globalCompositeOperation = "source-over"
            }
        }

        // average every sub-sample of each cell into an ink value (0 white → 1 black), per pose
        const sampleInk = (px: Uint8ClampedArray) => {
            const { cols, rows, inkA, inkB } = e
            const FW = cols * 2 * SUB_X
            const norm = 1 / (255 * SUB_X * SUB_Y)
            for (let j = 0; j < rows; j++) {
                const y0 = j * SUB_Y
                for (let i = 0; i < cols; i++) {
                    let sa = 0
                    let sb = 0
                    const xa = i * SUB_X
                    const xb = (cols + i) * SUB_X
                    for (let yy = 0; yy < SUB_Y; yy++) {
                        const rowOff = (y0 + yy) * FW
                        for (let xx = 0; xx < SUB_X; xx++) {
                            sa += px[(rowOff + xa + xx) * 4]
                            sb += px[(rowOff + xb + xx) * 4]
                        }
                    }
                    const k = j * cols + i
                    inkA[k] = 1 - sa * norm
                    inkB[k] = 1 - sb * norm
                }
            }
        }

        // ink colours glide toward the active theme instead of snapping
        const inkStyle = (
            dt: number,
            snap: boolean
        ): string | CanvasGradient => {
            const T = themeRef.current
            const ta = toRgb(T.inkA)
            const tb = toRgb(T.inkB)
            if (!e.colA || !e.colB || snap) {
                e.colA = ta.slice()
                e.colB = tb.slice()
            } else {
                const k = 1 - Math.exp(-dt * 5)
                for (let n = 0; n < 3; n++) {
                    e.colA[n] += (ta[n] - e.colA[n]) * k
                    e.colB[n] += (tb[n] - e.colB[n]) * k
                }
            }
            const ca = `rgb(${e.colA.map(Math.round).join(",")})`
            const cb = `rgb(${e.colB.map(Math.round).join(",")})`
            if (ca === cb) return ca
            const g = ctx.createLinearGradient(e.W * 0.08, 0, e.W * 0.92, 0)
            g.addColorStop(0, ca)
            g.addColorStop(1, cb)
            return g
        }

        const paint = (t: number, still: boolean, dt: number) => {
            const P = propsRef.current
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, cv.width, cv.height)
            if (!e.tiles || !e.W || !e.fctx) return
            const { W, H, cols, rows, step, rowStep, dpr, seeds, inkA, inkB } =
                e
            const L = Math.max(1, P.motion.loop)
            const a = still ? 0 : (TAU * t) / L
            if (e.tainted) return paintRaw(a, P)

            const f = e.fctx
            const FW = cols * 2 * SUB_X
            const FH = rows * SUB_Y
            f.setTransform(1, 0, 0, 1, 0, 0)
            f.fillStyle = "#ffffff"
            f.fillRect(0, 0, FW, FH)
            for (let pose = 0; pose < 2; pose++) {
                f.save()
                f.beginPath()
                f.rect(pose * cols * SUB_X, 0, cols * SUB_X, FH)
                f.clip()
                for (let side = 0; side < 2; side++)
                    placeHand(
                        f,
                        e.tiles[pose * 2 + side],
                        side,
                        a,
                        P,
                        W,
                        H,
                        (cols * SUB_X) / W,
                        FH / H,
                        pose * cols * SUB_X
                    )
                f.restore()
            }
            let px: Uint8ClampedArray
            try {
                px = f.getImageData(0, 0, FW, FH).data
            } catch {
                e.tainted = true
                return paintRaw(a, P)
            }
            sampleInk(px)

            /* per-frame parameters */
            const D = P.dots
            const morph = !still && P.motion.morph
            const mixRight = morph ? gate(t, 0.12 * L, 0.52 * L, 0.08 * L) : 0
            const mixLeft = morph ? gate(t, 0.31 * L, 0.73 * L, 0.08 * L) : 0
            const glitch = !still && P.motion.glitch
            const shim = still ? 0 : (P.motion.shimmer / 100) * 0.12
            const shimFreq =
                (Math.max(1, Math.round((3.2 * L) / TAU)) * TAU) / L
            const tick = Math.floor(t * 7)
            const lift = D.threshold / 100
            const span = Math.max(0.05, D.softness / 100)
            const gamma = 1 / Math.max(0.3, D.contrast)
            const detail = Math.max(0, D.detail)
            const levels = Math.max(2, Math.round(D.levels))
            const minDot = Math.min(1, Math.max(0.05, D.minDot / 100))
            const gapOut = P.hands.gap / 100
            const gapIn = gapOut * 0.32
            const R = (step * D.size) / 200
            const shape = D.shape

            /* cursor lens — eased in/out so it never pops */
            const Ls = P.lens
            const lensOn = !still && Ls.enabled
            const target = lensOn && e.pointer.inside ? 1 : 0
            const k = 1 - Math.exp(-dt * 7)
            e.lensAmt += (target - e.lensAmt) * k
            if (e.pointer.inside) {
                e.lensX += (e.pointer.x - e.lensX) * Math.min(1, k * 2.2)
                e.lensY += (e.pointer.y - e.lensY) * Math.min(1, k * 2.2)
            }
            const lensAmt = lensOn ? e.lensAmt : 0
            const lensR = Math.max(20, Ls.radius)
            const lensR2 = lensR * lensR
            const swell = Ls.swell / 100
            const push = Ls.push
            const reveal = Ls.reveal / 100
            const lx = e.lensX
            const ly = e.lensY

            /* intro build-up on first view */
            if (!still && P.motion.intro) e.introT += dt
            const intro =
                still || !P.motion.intro ? 2 : e.introT / INTRO_SECONDS

            const path = new Path2D()
            const half = cols / 2
            const lastC = cols - 1
            const lastR = rows - 1

            for (let j = 0; j < rows; j++) {
                let shift = 0
                if (glitch && noise(j, tick) > 0.965)
                    shift = Math.round((noise(tick + 0.5, j) - 0.5) * 8)
                const yc = (j + 0.5) * rowStep
                const up = (j > 0 ? j - 1 : 0) * cols
                const dn = (j < lastR ? j + 1 : lastR) * cols
                const me = j * cols
                const dyL = yc - ly
                for (let i = 0; i < cols; i++) {
                    let si = i - shift
                    if (si < 0) si = 0
                    else if (si > lastC) si = lastC
                    const seed = seeds[me + i]
                    const m = i < half ? mixLeft : mixRight
                    const ink = seed < m ? inkB : inkA
                    const c0 = ink[me + si]
                    // local-contrast boost so knuckles, nails and creases read crisply
                    const nb =
                        (ink[me + (si > 0 ? si - 1 : 0)] +
                            ink[me + (si < lastC ? si + 1 : lastC)] +
                            ink[up + si] +
                            ink[dn + si]) *
                        0.25
                    let tone = c0 + detail * (c0 - nb)

                    const x0 = (i + 0.5) * step
                    let lensF = 0
                    let dxL = 0
                    if (lensAmt > 0.002) {
                        dxL = x0 - lx
                        const d2 = dxL * dxL + dyL * dyL
                        if (d2 < lensR2) {
                            const q = 1 - Math.sqrt(d2) / lensR
                            lensF = q * q * (3 - 2 * q) * lensAmt
                            tone += reveal * lensF * Math.min(1, c0 * 4)
                        }
                    }

                    let v = (tone - lift) / span
                    if (v <= 0) continue
                    if (v > 1) v = 1
                    v = Math.pow(v, gamma)

                    if (m > 0.001 && m < 0.999) {
                        const d = Math.abs(seed - m)
                        if (d < 0.12) {
                            v *= d / 0.12
                            if (noise(i + tick, j) <= 0.4) v *= 0.3
                        }
                    }
                    if (shim)
                        v *=
                            1 - shim + shim * Math.sin(t * shimFreq + seed * 40)
                    if (gapOut > 0)
                        v *= ease(gapIn, gapOut, Math.abs(x0 / W - 0.5))
                    if (intro < 1.6)
                        v *= ease(seed * 0.75, seed * 0.75 + 0.3, intro)

                    const q = Math.round(v * levels)
                    if (q <= 0) continue
                    let r = R * Math.max(minDot, q / levels)
                    let x = x0
                    let y = yc
                    if (lensF > 0) {
                        r *= 1 + swell * lensF
                        const len = Math.hypot(dxL, dyL) || 1
                        x += (dxL / len) * push * lensF
                        y += (dyL / len) * push * lensF
                    }
                    stampDot(path, shape, x, y, r)
                }
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            ctx.fillStyle = inkStyle(dt, still)
            ctx.fill(path)
        }

        /* gating */
        let inView = typeof IntersectionObserver === "undefined"
        let tabVisible =
            typeof document === "undefined" ? true : !document.hidden
        const mq = window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)")
            : null
        e.reduce = !!mq?.matches
        const permit = () => alive && inView && tabVisible && !e.reduce

        let raf = 0
        let last = 0
        let clock = 0
        const frame = (now: number) => {
            raf = 0
            if (!permit()) return
            const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
            last = now
            const P = propsRef.current
            const L = Math.max(1, P.motion.loop)
            clock = (clock + dt * Math.max(0, P.motion.speed)) % L
            paint(clock, false, dt)
            raf = requestAnimationFrame(frame)
        }
        const park = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            last = 0
        }
        const wake = () => {
            if (raf || !permit()) return
            last = 0
            raf = requestAnimationFrame(frame)
        }
        const still = () => paint(0, true, 0)
        const kick = () => {
            if (e.reduce) still()
            else if (!raf && permit()) wake()
        }

        e.relayout = relayout
        e.still = still
        kickRef.current = kick

        relayout()

        const ro =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(() => {
                      relayout()
                      if (e.reduce) still()
                  })
                : null
        ro?.observe(root)

        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver(
                      (entries) => {
                          inView = entries.some((en) => en.isIntersecting)
                          if (inView) wake()
                          else park()
                      },
                      { rootMargin: "80px" }
                  )
                : null
        io?.observe(root)

        const onVis = () => {
            tabVisible = !document.hidden
            if (tabVisible) wake()
            else park()
        }
        document.addEventListener("visibilitychange", onVis)

        const onMotion = () => {
            e.reduce = !!mq?.matches
            if (e.reduce) {
                park()
                still()
            } else wake()
        }
        mq?.addEventListener?.("change", onMotion)

        const toLocal = (ev: PointerEvent) => {
            const r = root.getBoundingClientRect()
            const s = r.width ? e.W / r.width : 1
            return { x: (ev.clientX - r.left) * s, y: (ev.clientY - r.top) * s }
        }
        const onMove = (ev: PointerEvent) => {
            const pt = toLocal(ev)
            if (!e.pointer.inside && e.lensAmt < 0.02) {
                e.lensX = pt.x
                e.lensY = pt.y
            }
            e.pointer.x = pt.x
            e.pointer.y = pt.y
            e.pointer.inside = true
        }
        const onLeave = () => {
            e.pointer.inside = false
        }
        root.addEventListener("pointermove", onMove)
        root.addEventListener("pointerleave", onLeave)

        kick()

        return () => {
            alive = false
            park()
            ro?.disconnect()
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            mq?.removeEventListener?.("change", onMotion)
            root.removeEventListener("pointermove", onMove)
            root.removeEventListener("pointerleave", onLeave)
            kickRef.current = () => {}
        }
    }, [])

    /* hand image loading */
    const plan = handPlan(hands)
    const planKey = plan.srcs.join("|") + "#" + hands.source
    useEffect(() => {
        let dead = false
        const unique = Array.from(new Set(plan.srcs.filter(Boolean)))
        if (!unique.length) {
            e.tiles = null
            kickRef.current()
            return
        }
        Promise.all(unique.map(loadImage)).then((imgs) => {
            if (dead) return
            const bySrc = new Map<string, HTMLImageElement | null>()
            unique.forEach((u, k) => bySrc.set(u, imgs[k]))
            const tiles = plan.srcs.map((s, k) => {
                const img = s ? bySrc.get(s) : null
                return img ? cutTile(img, plan.crops[k]) : null
            })
            e.tiles = tiles
            e.tainted = isTainted(tiles.find(Boolean) || null)
            e.introT = 0
            if (!e.tainted && canvasRef.current)
                canvasRef.current.style.mixBlendMode = ""
            kickRef.current()
        })
        return () => {
            dead = true
        }
    }, [planKey])

    /* prop or theme edits: re-grid if density changed, refresh a still frame */
    useEffect(() => {
        if (dots.density !== e.lastDensity || dots.rowGap !== e.lastRowGap)
            e.relayout()
        else e.pattern = null
        if (e.reduce) e.still()
    })

    const glowPx = t.glow * (theme.glow / 100)
    const showScan = theme.scanlines && t.scan > 0
    const showVig = theme.vignette && t.vignette > 0

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: t.bg,
                transition: "background-color .6s ease",
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    filter:
                        glowPx > 0
                            ? `drop-shadow(0 0 ${glowPx.toFixed(1)}px ${rgba(t.inkA, 0.55)})`
                            : "none",
                    transition: "filter .6s ease",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: scanFill(t),
                    opacity: showScan ? 1 : 0,
                    transition: "opacity .6s ease",
                }}
            />
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: vignetteFill(t),
                    opacity: showVig ? 1 : 0,
                    transition: "opacity .6s ease",
                }}
            />
            {theme.switcher && (
                <ThemeMenu
                    themes={themeList(p)}
                    active={t}
                    onPick={setActiveId}
                    label={theme.label}
                    inset={theme.inset}
                    maxHeight={boxH - theme.inset - 58}
                />
            )}
        </div>
    )
}

/* ───────────────────────── property controls ───────────────────────── */

const imageSlot = (title: string, hidden?: (o: any) => boolean) => ({
    image: { type: ControlType.ResponsiveImage, title, hidden },
    url: {
        type: ControlType.String,
        title: `${title} URL`,
        defaultValue: "",
        placeholder: "https://…",
        hidden,
    },
})
const splitHidden = (o: any) => o.source !== "split"
const sheetHidden = (o: any) => o.source === "split"
const la = imageSlot("Pose A Left", splitHidden)
const ra = imageSlot("Pose A Right", splitHidden)
const lb = imageSlot("Pose B Left", splitHidden)
const rb = imageSlot("Pose B Right", splitHidden)

addPropertyControls(HalftoneHands, {
    theme: {
        type: ControlType.Object,
        title: "Theme",
        controls: {
            initial: {
                type: ControlType.Enum,
                title: "Theme",
                options: [...THEMES.map((x) => x.id), "custom"],
                optionTitles: [...THEMES.map((x) => x.name), "Custom"],
                defaultValue: "paper",
            },
            switcher: {
                type: ControlType.Boolean,
                title: "Switcher",
                defaultValue: true,
            },
            label: {
                type: ControlType.String,
                title: "Label",
                defaultValue: "Theme",
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 80,
                step: 1,
                unit: "px",
                defaultValue: 16,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
            },
            vignette: {
                type: ControlType.Boolean,
                title: "Vignette",
                defaultValue: true,
            },
            scanlines: {
                type: ControlType.Boolean,
                title: "Scanlines",
                defaultValue: true,
            },
        },
    },

    custom: {
        type: ControlType.Object,
        title: "Custom Theme",
        controls: {
            name: {
                type: ControlType.String,
                title: "Name",
                defaultValue: "Custom",
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#f7f7f5",
            },
            inkA: {
                type: ControlType.Color,
                title: "Ink Left",
                defaultValue: "#0d0d0d",
            },
            inkB: {
                type: ControlType.Color,
                title: "Ink Right",
                defaultValue: "#0d0d0d",
            },
            dark: {
                type: ControlType.Boolean,
                title: "Dark UI",
                defaultValue: false,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                min: 0,
                max: 24,
                step: 1,
                unit: "px",
                defaultValue: 0,
            },
            vignette: {
                type: ControlType.Number,
                title: "Vignette",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: 0,
            },
            scanlines: {
                type: ControlType.Number,
                title: "Scanlines",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: 0,
            },
            inMenu: {
                type: ControlType.Boolean,
                title: "In Switcher",
                defaultValue: false,
            },
        },
    },

    hands: {
        type: ControlType.Object,
        title: "Hands",
        controls: {
            source: {
                type: ControlType.Enum,
                title: "Source",
                options: ["sheet", "split"],
                optionTitles: ["2×2 Sheet", "Four Images"],
                displaySegmentedControl: true,
                defaultValue: "sheet",
            },
            sheet: {
                type: ControlType.ResponsiveImage,
                title: "Sheet",
                hidden: sheetHidden,
            },
            sheetUrl: {
                type: ControlType.String,
                title: "Sheet URL",
                defaultValue: SHEET_URL,
                placeholder: "https://…",
                hidden: sheetHidden,
            },
            leftA: la.image,
            leftAUrl: la.url,
            rightA: ra.image,
            rightAUrl: ra.url,
            leftB: lb.image,
            leftBUrl: lb.url,
            rightB: rb.image,
            rightBUrl: rb.url,
            width: {
                type: ControlType.Number,
                title: "Hand Width",
                min: 25,
                max: 90,
                step: 1,
                unit: "%",
                defaultValue: 56,
            },
            centerY: {
                type: ControlType.Number,
                title: "Vertical",
                min: 15,
                max: 85,
                step: 0.5,
                unit: "%",
                defaultValue: 50,
            },
            bleed: {
                type: ControlType.Number,
                title: "Edge Bleed",
                min: 0,
                max: 20,
                step: 0.5,
                unit: "%",
                defaultValue: 4.5,
            },
            gap: {
                type: ControlType.Number,
                title: "Centre Gap",
                min: 0,
                max: 30,
                step: 0.5,
                unit: "%",
                defaultValue: 9,
            },
        },
    },

    dots: {
        type: ControlType.Object,
        title: "Pixels",
        controls: {
            shape: {
                type: ControlType.Enum,
                title: "Shape",
                options: ["circle", "square", "diamond", "bar"],
                optionTitles: ["Circle", "Square", "Diamond", "Bar"],
                defaultValue: "circle",
            },
            density: {
                type: ControlType.Number,
                title: "Columns",
                min: 60,
                max: 320,
                step: 1,
                defaultValue: 190,
            },
            rowGap: {
                type: ControlType.Number,
                title: "Row Spacing",
                min: 1,
                max: 3.5,
                step: 0.05,
                defaultValue: 1.9,
            },
            size: {
                type: ControlType.Number,
                title: "Max Size",
                min: 40,
                max: 110,
                step: 1,
                unit: "%",
                defaultValue: 94,
            },
            levels: {
                type: ControlType.Number,
                title: "Tone Steps",
                min: 2,
                max: 12,
                step: 1,
                displayStepper: true,
                defaultValue: 6,
            },
            minDot: {
                type: ControlType.Number,
                title: "Min Size",
                min: 5,
                max: 80,
                step: 1,
                unit: "%",
                defaultValue: 30,
            },
            threshold: {
                type: ControlType.Number,
                title: "Threshold",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 14,
            },
            softness: {
                type: ControlType.Number,
                title: "Tone Range",
                min: 10,
                max: 80,
                step: 1,
                defaultValue: 44,
            },
            contrast: {
                type: ControlType.Number,
                title: "Contrast",
                min: 0.5,
                max: 2.5,
                step: 0.05,
                defaultValue: 1.15,
            },
            detail: {
                type: ControlType.Number,
                title: "Detail",
                min: 0,
                max: 2.5,
                step: 0.05,
                defaultValue: 0.9,
            },
        },
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            loop: {
                type: ControlType.Number,
                title: "Loop",
                min: 6,
                max: 60,
                step: 1,
                unit: "s",
                defaultValue: 20,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
            },
            drift: {
                type: ControlType.Number,
                title: "Reach",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
            },
            breathe: {
                type: ControlType.Number,
                title: "Breathe",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
            },
            roll: {
                type: ControlType.Number,
                title: "Roll",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
            },
            morph: {
                type: ControlType.Boolean,
                title: "Pose Switch",
                defaultValue: true,
            },
            glitch: {
                type: ControlType.Boolean,
                title: "Row Glitch",
                defaultValue: true,
            },
            shimmer: {
                type: ControlType.Number,
                title: "Shimmer",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 100,
            },
            intro: {
                type: ControlType.Boolean,
                title: "Build In",
                defaultValue: true,
            },
        },
    },

    lens: {
        type: ControlType.Object,
        title: "Cursor Lens",
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: true,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 30,
                max: 400,
                step: 5,
                unit: "px",
                defaultValue: 130,
            },
            swell: {
                type: ControlType.Number,
                title: "Swell",
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                defaultValue: 40,
            },
            push: {
                type: ControlType.Number,
                title: "Push",
                min: 0,
                max: 30,
                step: 1,
                unit: "px",
                defaultValue: 6,
            },
            reveal: {
                type: ControlType.Number,
                title: "Reveal",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: 25,
            },
        },
    },
})
