import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type PaletteKey = "site" | "daylight" | "gameboy" | "pico8" | "cga" | "mono" | "custom"
type PatternKey = "bayer4" | "bayer8" | "noise"
type FitKey = "cover" | "contain"
type HoverKey = "reveal" | "off" | "spotlight"

interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface DitherImageProps {
    image?: ImageValue
    palette: PaletteKey
    pixelSize: number
    pattern: PatternKey
    hoverReveal: boolean
    hoverMode: HoverKey
    radius: number
    softness: number
    alt: string
    fit: FitKey
    customColors: string[]
    style?: CSSProperties
}

// ---- palettes --------------------------------------------------------------
// 역할 순서: Sky, Wall, Ink, Brick, Leaf, Lamp (build.md 2절 C8). 겹치는 색은 합쳐서 쓴다.
const PRESETS: Record<Exclude<PaletteKey, "site" | "custom">, string[]> = {
    daylight: ["#BFE6FF", "#FFFFFF", "#1F1A3D", "#D0346C", "#3FA34D", "#FFD23F"],
    gameboy: ["#9BBC0F", "#8BAC0F", "#0F380F", "#0F380F", "#306230", "#8BAC0F"],
    pico8: ["#29ADFF", "#FFF1E8", "#1D2B53", "#7E2553", "#00E436", "#FFEC27"],
    cga: ["#55FFFF", "#FFFFFF", "#000000", "#AA00AA", "#FF55FF", "#FFFFFF"],
    mono: ["#FFFFFF", "#E6E6E6", "#000000", "#000000", "#7A7A7A", "#BDBDBD"],
}

const PRESET_ALIASES: Record<string, Exclude<PaletteKey, "site" | "custom">> = {
    daylight: "daylight",
    gameboy: "gameboy",
    dmg: "gameboy",
    pico8: "pico8",
    pico: "pico8",
    cga: "cga",
    mono: "mono",
    monochrome: "mono",
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i

function hexToRgb(hex: string): [number, number, number] | null {
    const m = HEX.exec(hex.trim())
    if (!m) return null
    let h = m[1]
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const n = parseInt(h, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function uniqueRgb(hexes: string[]): [number, number, number][] {
    const seen = new Set<number>()
    const out: [number, number, number][] = []
    for (const hex of hexes) {
        const rgb = typeof hex === "string" ? hexToRgb(hex) : null
        if (!rgb) continue
        const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2]
        if (seen.has(key)) continue
        seen.add(key)
        out.push(rgb)
    }
    return out
}

// 커스텀 팔레트: Framer 색 컨트롤은 rgba()/hex 문자열 → #rrggbb
function cssToHex(c: string): string {
    const m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(c || "")
    if (!m) return c
    return "#" + [m[1], m[2], m[3]].map((v) => Math.min(255, Number(v)).toString(16).padStart(2, "0")).join("")
}

function presetColors(name: string): string[] {
    const key = PRESET_ALIASES[name.toLowerCase().replace(/[^a-z0-9]/g, "")]
    return PRESETS[key || "daylight"]
}

// window.__tplStyle / tpl:style detail = { preset, colors } → 색 목록 (colors 는 배열 또는 역할 객체)
function colorsFromSite(detail: unknown): string[] {
    const d = (detail || {}) as { preset?: unknown; colors?: unknown }
    let list: string[] = []
    if (Array.isArray(d.colors)) list = d.colors as string[]
    else if (d.colors && typeof d.colors === "object") list = Object.values(d.colors as Record<string, string>)
    if (uniqueRgb(list).length >= 2) return list
    return presetColors(typeof d.preset === "string" ? d.preset : "daylight")
}

// ---- ordered dither --------------------------------------------------------
function bayer(n: number): number[] {
    let m = [0]
    let size = 1
    while (size < n) {
        const next = new Array(size * 2 * size * 2)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const v = m[y * size + x] * 4
                next[y * size * 2 * 2 + x * 2] = v
                next[y * size * 2 * 2 + x * 2 + 1] = v + 2
                next[(y * 2 + 1) * size * 2 + x * 2] = v + 3
                next[(y * 2 + 1) * size * 2 + x * 2 + 1] = v + 1
            }
        }
        m = next
        size *= 2
    }
    return m
}

const BAYER4 = bayer(4)
const BAYER8 = bayer(8)

// 고정 노이즈(프레임마다 흔들리지 않게 좌표 해시)
function hashNoise(x: number, y: number): number {
    let h = (x * 374761393 + y * 668265263) | 0
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    h ^= h >>> 16
    return ((h >>> 0) % 1024) / 1024
}

// [-0.5, 0.5) 문턱값
function threshold(pattern: PatternKey, x: number, y: number): number {
    if (pattern === "bayer4") return (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5
    if (pattern === "bayer8") return (BAYER8[(y & 7) * 8 + (x & 7)] + 0.5) / 64 - 0.5
    return hashNoise(x, y) - 0.5
}

// 가중 RGB 거리(redmean)
function nearest(pal: [number, number, number][], r: number, g: number, b: number): number {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < pal.length; i++) {
        const p = pal[i]
        const rm = (r + p[0]) / 2
        const dr = r - p[0]
        const dg = g - p[1]
        const db = b - p[2]
        const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db
        if (d < bestD) {
            bestD = d
            best = i
        }
    }
    return best
}

function quantize(src: Uint8ClampedArray, out: Uint8ClampedArray, w: number, h: number, pal: [number, number, number][], pattern: PatternKey) {
    const spread = Math.min(255, Math.max(48, 255 / Math.max(1, pal.length - 1)))
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4
            if (src[i + 3] < 128) {
                out[i + 3] = 0
                continue
            }
            const t = threshold(pattern, x, y) * spread
            const c = pal[nearest(pal, src[i] + t, src[i + 1] + t, src[i + 2] + t)]
            out[i] = c[0]
            out[i + 1] = c[1]
            out[i + 2] = c[2]
            out[i + 3] = 255
        }
    }
}

// ---- 기본 그림(이미지 없을 때): 코드로 그린 하늘·해·언덕 ---------------------
const DEFAULT_SRC =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">' +
            '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6fb0"/><stop offset="0.6" stop-color="#bfe0f5"/><stop offset="1" stop-color="#fff3d6"/></linearGradient></defs>' +
            '<rect width="640" height="400" fill="url(#s)"/><circle cx="470" cy="130" r="58" fill="#ffd23f"/>' +
            '<path d="M0 300 Q120 200 260 270 T520 250 T640 280 V400 H0Z" fill="#4a8a4f"/>' +
            '<path d="M0 340 Q160 270 320 330 T640 320 V400 H0Z" fill="#1f4d3a"/></svg>'
    )

// ---- component -------------------------------------------------------------
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 320
 */
export default function DitherImage(props: DitherImageProps) {
    const { image, palette, pixelSize, pattern, hoverReveal, hoverMode, radius, softness, alt, fit, customColors, style } = props
    const isStatic = useIsStaticRenderer()
    const src = image?.src || DEFAULT_SRC
    const label = alt || image?.alt || ""
    const ps = Math.max(1, Math.min(8, Math.round(pixelSize) || 3))

    const rootRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const srcPixels = useRef<{ key: string; data: Uint8ClampedArray } | null>(null)

    const [loaded, setLoaded] = useState(false)
    const [failed, setFailed] = useState(false)
    const [cors, setCors] = useState(true)
    const [tainted, setTainted] = useState(false)
    const [size, setSize] = useState({ w: 0, h: 0 })
    const [inView, setInView] = useState(true)
    const [reduced, setReduced] = useState(false)
    const [hover, setHover] = useState(false)
    const [focus, setFocus] = useState(false)
    const [spot, setSpot] = useState<{ x: number; y: number } | null>(null)
    const [focusRing, setFocusRing] = useState(false)
    const [siteColors, setSiteColors] = useState<string[]>(PRESETS.daylight)

    // 이미지가 바뀌면 상태를 처음으로
    useEffect(() => {
        setLoaded(false)
        setFailed(false)
        setCors(true)
        setTainted(false)
        srcPixels.current = null
        // 하이드레이션·캐시로 onLoad 가 이미 지나갔을 수 있음
        const img = imgRef.current
        if (img && img.complete) {
            if (img.naturalWidth > 0) setLoaded(true)
            else if (img.getAttribute("src")) setFailed(true)
        }
    }, [src])

    // reduced-motion
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const sync = () => setReduced(mq.matches)
        sync()
        mq.addEventListener?.("change", sync)
        return () => mq.removeEventListener?.("change", sync)
    }, [])

    // Site 모드: __tplStyle 읽고 tpl:style 듣기
    useEffect(() => {
        if (palette !== "site") return
        const w = window as unknown as { __tplStyle?: unknown }
        if (w.__tplStyle) setSiteColors(colorsFromSite(w.__tplStyle))
        const onStyle = (e: Event) => setSiteColors(colorsFromSite((e as CustomEvent).detail ?? w.__tplStyle))
        window.addEventListener("tpl:style", onStyle)
        return () => window.removeEventListener("tpl:style", onStyle)
    }, [palette])

    // 컨테이너 크기·화면 안 여부
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => {
            const r = el.getBoundingClientRect()
            setSize((s) => (s.w === Math.round(r.width) && s.h === Math.round(r.height) ? s : { w: Math.round(r.width), h: Math.round(r.height) }))
        }
        measure()
        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
        ro?.observe(el)
        const io =
            typeof IntersectionObserver !== "undefined"
                ? new IntersectionObserver((entries) => entries.forEach((en) => setInView(en.isIntersecting)))
                : null
        io?.observe(el)
        return () => {
            ro?.disconnect()
            io?.disconnect()
        }
    }, [])

    const colors =
        palette === "site" ? siteColors : palette === "custom" ? (customColors || []).map(cssToHex) : PRESETS[palette] || PRESETS.daylight
    const paletteKey = colors.join("|")
    const pal = useMemo(() => uniqueRgb(colors), [paletteKey])
    const cw = Math.max(1, Math.ceil(size.w / ps))
    const ch = Math.max(1, Math.ceil(size.h / ps))

    // 예전 인스턴스: Hover 가 기본값(reveal)인데 옛 체크박스가 꺼져 있으면 Off
    const hoverKey: HoverKey = hoverMode === "spotlight" ? "spotlight" : hoverMode === "off" || hoverReveal === false ? "off" : "reveal"
    const spotlight = hoverKey === "spotlight"
    const rad = Math.max(40, Math.min(400, Number(radius) || 120))
    const soft = Math.max(0, Math.min(100, Number.isFinite(Number(softness)) ? Number(softness) : 30))
    // 스포트라이트는 움직임이 없어서 reduced-motion 이어도 디더 위에 원을 그림
    const dormant = reduced && !spotlight

    const active = !isStatic && !dormant && !failed && !tainted && loaded && size.w > 0 && size.h > 0

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        const img = imgRef.current
        if (!canvas || !img || pal.length < 2) return
        const key = [img.currentSrc || img.src, cw, ch, fit].join("|")
        if (!srcPixels.current || srcPixels.current.key !== key) {
            const tmp = document.createElement("canvas")
            tmp.width = cw
            tmp.height = ch
            const tctx = tmp.getContext("2d", { willReadFrequently: true })
            if (!tctx) return
            tctx.imageSmoothingEnabled = true
            const iw = img.naturalWidth || 1
            const ih = img.naturalHeight || 1
            const s = fit === "cover" ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih)
            const dw = iw * s
            const dh = ih * s
            tctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
            try {
                srcPixels.current = { key, data: tctx.getImageData(0, 0, cw, ch).data }
            } catch {
                setTainted(true)
                return
            }
        }
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const out = ctx.createImageData(cw, ch)
        quantize(srcPixels.current.data, out.data, cw, ch, pal, pattern)
        ctx.putImageData(out, 0, 0)
        if (rootRef.current) {
            rootRef.current.setAttribute("data-pal", paletteKey)
            rootRef.current.setAttribute("data-draw", `${cw}x${ch}`)
        }
    }, [cw, ch, fit, pal, paletteKey, pattern])

    // 화면 안에 있을 때만 다시 그림(밖이면 다음에 들어올 때)
    useEffect(() => {
        if (active && inView) draw()
    }, [active, inView, draw])

    const ink = pal.length ? `rgb(${pal.reduce((a, b) => (a[0] + a[1] + a[2] < b[0] + b[1] + b[2] ? a : b)).join(",")})` : "#000"
    const wall = pal.length ? `rgb(${pal.reduce((a, b) => (a[0] + a[1] + a[2] > b[0] + b[1] + b[2] ? a : b)).join(",")})` : "#fff"

    const revealed = hoverKey === "reveal" ? hover || focus : spotlight && focus
    const showOriginal = !active || revealed
    const mode = isStatic ? "static" : failed ? "failed" : dormant ? "reduced" : tainted ? "blocked" : !loaded ? "loading" : "dither"

    const fill: CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }
    const interactive = hoverKey !== "off" && !isStatic

    // 스포트라이트: 디더 캔버스에 구멍(마스크)을 뚫어 아래 원본이 보이게 함
    const holeInner = Math.round(rad * (1 - soft / 100) * 10) / 10
    const spotMask =
        spotlight && spot && active
            ? `radial-gradient(circle ${rad}px at ${spot.x}px ${spot.y}px, transparent ${holeInner}px, #000 ${rad}px)`
            : undefined
    const spotMove = (e: PointerEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        const r = el.getBoundingClientRect()
        const k = r.width / (el.offsetWidth || r.width) || 1
        setSpot({ x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k })
    }
    const spotOff = () => setSpot(null)

    return (
        <div
            ref={rootRef}
            role="img"
            aria-label={label}
            tabIndex={interactive ? 0 : undefined}
            data-dither-image=""
            data-mode={mode}
            data-reveal={revealed ? "on" : "off"}
            data-hover={hoverKey}
            data-spot={spotMask ? "on" : "off"}
            onPointerEnter={
                interactive
                    ? (e) => {
                          if (spotlight) spotMove(e)
                          else setHover(true)
                      }
                    : undefined
            }
            onPointerDown={interactive && spotlight ? spotMove : undefined}
            onPointerMove={interactive && spotlight ? spotMove : undefined}
            onPointerUp={interactive && spotlight ? (e) => e.pointerType === "touch" && spotOff() : undefined}
            onPointerCancel={interactive && spotlight ? spotOff : undefined}
            onPointerLeave={
                interactive
                    ? () => {
                          setHover(false)
                          spotOff()
                      }
                    : undefined
            }
            onFocus={
                interactive
                    ? (e) => {
                          setFocus(true)
                          setFocusRing(e.currentTarget.matches(":focus-visible"))
                      }
                    : undefined
            }
            onBlur={interactive ? () => (setFocus(false), setFocusRing(false)) : undefined}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                outline: "none",
                ...(spotlight ? { WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none", touchAction: "pan-y" } : null),
                boxShadow: focusRing ? `inset 0 0 0 3px ${ink}, inset 0 0 0 6px ${wall}` : "none",
                ...style,
            }}
        >
            <img
                ref={imgRef}
                src={src}
                srcSet={image?.srcSet}
                alt=""
                aria-hidden="true"
                draggable={false}
                crossOrigin={cors ? "anonymous" : undefined}
                onLoad={() => setLoaded(true)}
                onError={() => (cors && !src.startsWith("data:") ? setCors(false) : setFailed(true))}
                style={{
                    ...fill,
                    display: "block",
                    objectFit: fit,
                    opacity: showOriginal || spotlight ? 1 : 0,
                    transition: reduced ? "none" : "opacity 0.2s",
                    maxWidth: "none",
                    border: 0,
                    margin: 0,
                    padding: 0,
                }}
            />
            {!isStatic && !failed && (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: cw * ps,
                        height: ch * ps,
                        imageRendering: "pixelated",
                        opacity: showOriginal ? 0 : 1,
                        transition: reduced ? "none" : "opacity 0.2s",
                        pointerEvents: "none",
                        display: "block",
                        WebkitMaskImage: spotMask,
                        maskImage: spotMask,
                    }}
                />
            )}
        </div>
    )
}

DitherImage.defaultProps = {
    palette: "site",
    pixelSize: 3,
    pattern: "bayer4",
    hoverReveal: true,
    hoverMode: "reveal",
    radius: 120,
    softness: 30,
    alt: "",
    fit: "cover",
    customColors: ["#101820", "#4F6D7A", "#EAB308", "#F8F5EC"],
    width: 480,
    height: 320,
}

addPropertyControls(DitherImage, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    alt: { type: ControlType.String, title: "Alt", defaultValue: "" },
    palette: {
        type: ControlType.Enum,
        title: "Palette",
        options: ["site", "daylight", "gameboy", "pico8", "cga", "mono", "custom"],
        optionTitles: ["Auto (Daylight, or the template style switcher)", "Daylight", "Game Boy", "PICO-8", "CGA", "Mono", "Custom colors"],
        defaultValue: "site",
    },
    customColors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        maxCount: 6,
        defaultValue: ["#101820", "#4F6D7A", "#EAB308", "#F8F5EC"],
        hidden: (props: Partial<DitherImageProps>) => props.palette !== "custom",
    },
    pixelSize: { type: ControlType.Number, title: "Pixel size", min: 1, max: 8, step: 1, defaultValue: 3, displayStepper: true },
    pattern: {
        type: ControlType.Enum,
        title: "Pattern",
        options: ["bayer4", "bayer8", "noise"],
        optionTitles: ["Bayer 4", "Bayer 8", "Noise"],
        defaultValue: "bayer4",
    },
    hoverMode: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["off", "reveal", "spotlight"],
        optionTitles: ["Off", "Reveal", "Spotlight"],
        defaultValue: "reveal",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        min: 40,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 120,
        hidden: (props: Partial<DitherImageProps>) => props.hoverMode !== "spotlight",
    },
    softness: {
        type: ControlType.Number,
        title: "Softness",
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        defaultValue: 30,
        hidden: (props: Partial<DitherImageProps>) => props.hoverMode !== "spotlight",
    },
    // 예전 체크박스: 꺼져 있던 인스턴스(Hover 가 Reveal 이고 체크 해제)에서만 보여 다시 켤 수 있게 함
    hoverReveal: {
        type: ControlType.Boolean,
        title: "Hover reveal (old)",
        defaultValue: true,
        hidden: (props: Partial<DitherImageProps>) => props.hoverReveal !== false || (props.hoverMode ?? "reveal") !== "reveal",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "cover",
        displaySegmentedControl: true,
    },
})
