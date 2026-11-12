// [생성일] 2026-10-22
// [경위] 판매 진단(10-22) — 무료 체험판(Lite)으로 손님을 모아 정식판(20 Sticker Board)으로 연결. 20번 코드를 복사해 차별 기능을 뺀 무료판
// [제작] BrandingUp (https://brandingupstudio.com)
// [변경이력]
//   - 2026-10-22: 최초 생성 (20 StickerBoard.tsx 복사 → 스티커 8개 상한, 이미지 스티커·스티커별 링크·Arc/Manual 배치·던지기 관성은 정식판 전용으로 제거)
//   - 2026-10-22: 폭 설정을 any로 바꿔 봤다가(붙여넣기 시 스티커 폭 0) 원래 any-prefer-fixed로 되돌림
//   - 2026-10-24: 마켓 심사 권고 3건 반영 — ref 초기화를 useLayoutEffect로, Enter/Space 활성화+aria-describedby, Lite에 없는 manual/arc/이미지 경로 제거 · 미노출 link 경로 제거

import {
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from "react"
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


// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
type Shape = "pill" | "rect" | "circle" | "star" | "burst" | "arch"

interface Sticker {
    label?: string
    shape?: Shape
    color?: string
    size?: number // % (100 = 기본 크기)
}

interface StickerBoardLiteProps {
    stickers?: Sticker[]
    layout?: "scatter" | "grid"
    seed?: number
    stickerSize?: number
    sizeVariance?: number
    maxTilt?: number
    drag?: boolean
    peel?: number
    lift?: number
    lean?: number
    slap?: number
    bringToFront?: boolean
    keepInside?: boolean
    resetOnDoubleClick?: boolean
    borderWidth?: number
    borderColor?: string
    radius?: number
    shadow?: number
    textMode?: "auto" | "custom"
    textColor?: string
    paddingX?: number
    paddingY?: number
    background?: string
    font?: any
    style?: CSSProperties
}

// 스티커 하나의 런타임 상태 (React state 를 거치지 않고 DOM 에 바로 반영 — 드래그 중 60fps 유지)
interface Body {
    x: number // 중심 위치 (% of board)
    y: number
    r: number // 현재 기울기 (°)
    s: number // 개별 크기 배율
    vx: number // 던지기 속도 (px/s)
    vy: number
    held: boolean
    kbGrab: boolean // 키보드로 들어 올린 상태 (Enter/Space)
    moved: boolean
    downT: number
    downX: number
    downY: number
    prevX: number
    prevY: number
    prevT: number
    cornerX: number // 벗겨지는 모서리 (0 또는 100, %)
    cornerY: number
    el: HTMLElement | null // 위치 래퍼
    tiltEl: HTMLElement | null // 기울임(lean) 레이어
    peelEl: HTMLElement | null // 뒷면(curl) 오버레이
    raf: number
}

interface Placement {
    x: number
    y: number
    r: number
    s: number
}

// Lite: 스티커는 최대 8개 (정식판은 30개)
const MAX_STICKERS = 8
const PALETTE = [
    "#111114",
    "#2DE5A0",
    "#F4F1EA",
    "#5B5BF6",
    "#FFD166",
    "#FF6B8A",
]

// 설치 직후 보이는 샘플 — 이미지 0장으로도 완성된 보드가 보이도록 전부 텍스트·도형 스티커
const SAMPLE: Sticker[] = [
    { label: "Hello!", shape: "burst", color: "#FFD166", size: 110 },
    { label: "Open to work", shape: "pill", color: "#2DE5A0" },
    { label: "★ 5.0", shape: "circle", color: "#111114", size: 80 },
    { label: "Framer", shape: "rect", color: "#5B5BF6" },
    { label: "Drag me", shape: "arch", color: "#FF6B8A", size: 90 },
    { label: "Est. 2026", shape: "pill", color: "#F4F1EA" },
    { label: "NEW", shape: "star", color: "#FF6B8A", size: 105 },
    { label: "Made with ♥", shape: "pill", color: "#111114" },
]

// 도형 클립 패스 (별·톱니 도장은 꼭짓점 좌표를 계산해서 만든다)
function polygon(points: number, outer: number, inner: number) {
    const pts: string[] = []
    for (let i = 0; i < points * 2; i++) {
        const a = (Math.PI * i) / points - Math.PI / 2
        const rad = i % 2 === 0 ? outer : inner
        pts.push(
            (50 + Math.cos(a) * rad).toFixed(2) +
                "% " +
                (50 + Math.sin(a) * rad).toFixed(2) +
                "%"
        )
    }
    return "polygon(" + pts.join(", ") + ")"
}
const CLIP: Partial<Record<Shape, string>> = {
    star: polygon(5, 50, 22),
    burst: polygon(12, 50, 41),
}

// 같은 입력이면 항상 같은 배치가 되도록 시드 난수 사용 (캔버스·썸네일이 매번 바뀌지 않게)
function makeRandom(seed: number) {
    let s = (seed * 2654435761) >>> 0 || 1
    return () => {
        s = (s + 0x6d2b79f5) >>> 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

// 색의 밝기(0~1) — 프레이머는 Color 값을 rgb()/rgba() 로 넘기기도 하므로 둘 다 처리
function luminance(color: string): number {
    if (typeof color !== "string") return 0.5
    let r = 0,
        g = 0,
        b = 0
    const m = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (m) {
        r = +m[1]
        g = +m[2]
        b = +m[3]
    } else if (color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3 || h.length === 4)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        r = parseInt(h.slice(0, 2), 16)
        g = parseInt(h.slice(2, 4), 16)
        b = parseInt(h.slice(4, 6), 16)
    } else return 0.5
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v))

// 초기 배치 계산 — Scatter(시드 난수, 서로 멀어지게) / Grid(격자 + 흔들림)
function computeLayout(
    items: Sticker[],
    layout: string,
    seed: number,
    variance: number,
    maxTilt: number
): Placement[] {
    const n = items.length
    const rnd = makeRandom(seed * 131 + n)
    const out: Placement[] = []
    const sizeOf = (it: Sticker, i: number) => {
        const base = clamp(it.size == null ? 100 : it.size, 20, 300) / 100
        if (variance <= 0) return base
        // 흔들림: 짝수·홀수 번갈아 크고 작게 + 난수
        const v = (variance / 100) * ((i % 2 ? 1 : -1) * 0.5 + (rnd() - 0.5))
        return clamp(base * (1 + v), 0.3, 3)
    }
    if (layout === "grid") {
        const cols = Math.max(1, Math.ceil(Math.sqrt(n * 1.6)))
        const rows = Math.max(1, Math.ceil(n / cols))
        for (let i = 0; i < n; i++) {
            const c = i % cols,
                rw = Math.floor(i / cols)
            const inRow = Math.min(cols, n - rw * cols) // 마지막 줄은 가운데 정렬
            const cc = c + (cols - inRow) / 2
            out.push({
                x: ((cc + 0.5) / cols) * 100 + (rnd() - 0.5) * 4,
                y: ((rw + 0.5) / rows) * 100 + (rnd() - 0.5) * 6,
                r: (rnd() - 0.5) * 2 * maxTilt,
                s: sizeOf(items[i], i),
            })
        }
        return out
    }
    // scatter: 후보 여러 개 중 기존 스티커들과 가장 먼 자리를 고른다 (겹침 최소화)
    const placed: { x: number; y: number }[] = []
    const minD = 150 / Math.sqrt(Math.max(1, n)) // 개수가 많을수록 간격 허용치를 줄인다
    for (let i = 0; i < n; i++) {
        let best = { x: 50, y: 50 },
            bestScore = -1
        for (let k = 0; k < 24; k++) {
            const cx = 12 + rnd() * 76,
                cy = 14 + rnd() * 72
            let score = Infinity
            for (const p of placed)
                score = Math.min(
                    score,
                    Math.hypot((cx - p.x) * 1.0, (cy - p.y) * 1.3)
                )
            if (score > bestScore) {
                bestScore = score
                best = { x: cx, y: cy }
            }
            if (score >= minD) break
        }
        placed.push(best)
        out.push({
            x: best.x,
            y: best.y,
            r: (rnd() - 0.5) * 2 * maxTilt,
            s: sizeOf(items[i], i),
        })
    }
    return out
}

/**
 * Sticker Board — 다이컷 스티커(텍스트·도형)를 잡아서 떼어내듯 끌고, 놓으면 살짝 돌아가며 찰싹 붙는 보드.
 * 스티커마다 링크(탭=이동, 드래그=이동 안 함). 캔버스·정적 렌더에서는 배치만 보여주고 상호작용은 하지 않는다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function StickerBoardLite(props: StickerBoardLiteProps) {
    const {
        stickers,
        layout = "scatter",
        seed = 7,
        stickerSize = 140,
        sizeVariance = 20,
        maxTilt = 14,
        drag = true,
        peel = 60,
        lift = 1.08,
        lean = 14,
        slap = 6,
        bringToFront = true,
        keepInside = true,
        resetOnDoubleClick = true,
        borderWidth = 5,
        borderColor = "#FFFFFF",
        radius = 12,
        shadow = 50,
        textMode = "auto",
        textColor = "#111114",
        paddingX = 22,
        paddingY = 12,
        background = "rgba(0, 0, 0, 0)",
        font = { fontFamily: "Inter", fontWeight: 700, fontSize: 18 },
        style,
    } = props

    // Lite: 던지기 관성은 정식판 전용 (여기서는 꺼짐). 스티커 링크도 정식판 전용이라 코드 경로 자체를 뺌 (2026-10-24)
    const throwing = false

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기): 배치만 보임
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 배치 확인용, 드래그 없음

    const list = useMemo(() => {
        const src = stickers && stickers.length ? stickers : SAMPLE
        return src.slice(0, MAX_STICKERS).map((it, i) => ({
            label: (it.label || "").trim() || "Sticker",
            shape: (it.shape || "pill") as Shape,
            color: it.color || PALETTE[i % PALETTE.length],
            size: it.size,
        }))
    }, [stickers])

    const init = useMemo(
        () => computeLayout(list, layout, seed, sizeVariance, maxTilt),
        [list, layout, seed, sizeVariance, maxTilt]
    )

    // 브라우저에서만 상호작용 활성화 (hydration 안전)
    const [live, setLive] = useState(false)
    useEffect(() => {
        if (isStatic) return
        startTransition(() => setLive(true))
    }, [isStatic])
    const interactive = live && !isCanvas && drag

    const rootRef = useRef<HTMLDivElement>(null)
    const bodies = useRef<Body[]>([])
    const zRef = useRef(10)
    const inViewRef = useRef(true)
    const reducedRef = useRef(false)
    const boardRef = useRef({ W: 1, H: 1 })
    const opts = useRef({
        peel,
        lift,
        lean,
        slap,
        throwing,
        bringToFront,
        keepInside,
        shadow,
    })
    opts.current = {
        peel,
        lift,
        lean,
        slap,
        throwing,
        bringToFront,
        keepInside,
        shadow,
    }

    // 스티커별 DOM 요소 보관 (렌더 중 ref 콜백이 채움 — bodies 가 아직 없어도 요소를 잃지 않는다)
    const parts = useRef<
        {
            el: HTMLElement | null
            tiltEl: HTMLElement | null
            peelEl: HTMLElement | null
        }[]
    >([])
    const part = (i: number) =>
        parts.current[i] ||
        (parts.current[i] = { el: null, tiltEl: null, peelEl: null })
    const hintId = "sbl-hint-" + useId().replace(/[^a-zA-Z0-9_-]/g, "")

    // 배치가 바뀌면 런타임 상태를 초기값으로 되돌린다 (렌더 중이 아니라 커밋 직후 — 서버에서는 useEffect 로 대체해 경고 방지)
    const useIsoLayoutEffect =
        typeof window !== "undefined" ? useLayoutEffect : useEffect
    useIsoLayoutEffect(() => {
        bodies.current = init.map((p, i) => {
            const pt = part(i)
            return {
                x: p.x,
                y: p.y,
                r: p.r,
                s: p.s,
                vx: 0,
                vy: 0,
                held: false,
                kbGrab: false,
                moved: false,
                downT: 0,
                downX: 0,
                downY: 0,
                prevX: 0,
                prevY: 0,
                prevT: 0,
                cornerX: 100,
                cornerY: 0,
                el: pt.el,
                tiltEl: pt.tiltEl,
                peelEl: pt.peelEl,
                raf: 0,
            }
        })
    }, [init])

    // reduced-motion 감지 (들어올림·peel·관성 없이 바로 이동)
    useEffect(() => {
        const mq =
            typeof matchMedia === "function"
                ? matchMedia("(prefers-reduced-motion: reduce)")
                : null
        reducedRef.current = !!(mq && mq.matches)
    }, [])

    // ── 화면 밖에서는 관성 루프 정지 (마켓 AI 심사 요구사항) ──
    useEffect(() => {
        if (!live) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") return
        const io = new IntersectionObserver(
            (entries) => {
                inViewRef.current = entries[0].isIntersecting
                if (!inViewRef.current)
                    for (const b of bodies.current) stopThrow(b)
            },
            { threshold: 0.05 }
        )
        io.observe(root)
        return () => io.disconnect()
    }, [live])

    // 언마운트 시 루프 정리
    useEffect(
        () => () => {
            for (const b of bodies.current) stopThrow(b)
        },
        []
    )

    // ── 스타일 계산 ──
    const shadowFilter = (held: boolean) => {
        const k = clamp(opts.current.shadow, 0, 100) / 100
        if (k === 0) return "none"
        return held
            ? "drop-shadow(0 " +
                  (10 + 14 * k) +
                  "px " +
                  (10 + 18 * k) +
                  "px rgba(0,0,0," +
                  (0.18 + 0.3 * k) +
                  "))"
            : "drop-shadow(0 " +
                  (1 + 4 * k) +
                  "px " +
                  (2 + 6 * k) +
                  "px rgba(0,0,0," +
                  (0.08 + 0.22 * k) +
                  "))"
    }
    const wrapperTransform = (b: Body, held: boolean) =>
        "translate(-50%, -50%) rotate(" +
        b.r +
        "deg) scale(" +
        b.s * (held && !reducedRef.current ? opts.current.lift : 1) +
        ")"
    const peelClip = (b: Body, amount: number) => {
        // 벗겨지는 모서리에서 삼각형으로 뒷면이 드러난다 (amount 0 = 모서리 한 점)
        const cx = b.cornerX,
            cy = b.cornerY
        const px = cx === 0 ? amount : 100 - amount
        const py = cy === 0 ? amount : 100 - amount
        return (
            "polygon(" +
            cx +
            "% " +
            cy +
            "%, " +
            px +
            "% " +
            cy +
            "%, " +
            cx +
            "% " +
            py +
            "%)"
        )
    }
    const peelGradient = (b: Body) => {
        const deg =
            b.cornerX === 0
                ? b.cornerY === 0
                    ? 135
                    : 45
                : b.cornerY === 0
                  ? 225
                  : 315
        return (
            "linear-gradient(" +
            deg +
            "deg, #ffffff 0%, #ededed 45%, #b9b9b9 100%)"
        )
    }
    const draw = (b: Body) => {
        if (!b.el) return
        b.el.style.left = b.x + "%"
        b.el.style.top = b.y + "%"
    }

    // ── 범위 제한: 스티커가 보드 밖으로 못 나가게 (중심 기준, 보이는 크기 절반만큼 여유) ──
    const confine = (b: Body) => {
        if (!opts.current.keepInside || !b.el) return
        const { W, H } = boardRef.current
        const rect = b.el.getBoundingClientRect()
        const hw = (rect.width / 2 / W) * 100,
            hh = (rect.height / 2 / H) * 100
        b.x = clamp(b.x, hw, 100 - hw)
        b.y = clamp(b.y, hh, 100 - hh)
    }

    // ── 던지기 관성 (짧게 미끄러지다 멈춤 — 멈추면 루프 종료, 화면 밖이면 즉시 종료) ──
    const stopThrow = (b: Body) => {
        if (b.raf) cancelAnimationFrame(b.raf)
        b.raf = 0
        b.vx = 0
        b.vy = 0
    }
    const startThrow = (b: Body) => {
        if (reducedRef.current || !opts.current.throwing || !inViewRef.current)
            return
        if (Math.hypot(b.vx, b.vy) < 120) return
        let last = 0
        const tick = (ts: number) => {
            if (!b.raf || !inViewRef.current) return
            const dt = last ? Math.min((ts - last) / 1000, 1 / 30) : 1 / 60
            last = ts
            const { W, H } = boardRef.current
            b.x += ((b.vx * dt) / W) * 100
            b.y += ((b.vy * dt) / H) * 100
            const k = Math.exp(-5 * dt)
            b.vx *= k
            b.vy *= k
            if (opts.current.keepInside && b.el) {
                const before = { x: b.x, y: b.y }
                confine(b)
                if (before.x !== b.x) b.vx *= -0.3 // 벽에 닿으면 살짝 튕기고 힘을 잃는다
                if (before.y !== b.y) b.vy *= -0.3
            }
            draw(b)
            if (Math.hypot(b.vx, b.vy) < 15) {
                stopThrow(b)
                return
            }
            b.raf = requestAnimationFrame(tick)
        }
        b.raf = requestAnimationFrame(tick)
    }

    // ── 잡기 (포인터 캡처) ──
    const onPointerDown = (e: any, i: number) => {
        const b = bodies.current[i]
        const root = rootRef.current
        if (!b || !root) return
        const now = e.timeStamp || Date.now()
        b.downT = now
        b.downX = e.clientX
        b.downY = e.clientY
        b.moved = false
        b.prevX = e.clientX
        b.prevY = e.clientY
        b.prevT = now
        if (!interactive || e.button > 0) return
        const rr = root.getBoundingClientRect()
        boardRef.current = {
            W: Math.max(1, rr.width),
            H: Math.max(1, rr.height),
        }
        stopThrow(b)
        b.held = true
        if (b.el) {
            const rect = b.el.getBoundingClientRect()
            const gx = e.clientX - (rect.left + rect.width / 2)
            const gy = e.clientY - (rect.top + rect.height / 2)
            b.cornerX = gx < 0 ? 100 : 0 // 잡은 곳의 반대편 모서리가 벗겨진다
            b.cornerY = gy < 0 ? 100 : 0
            if (opts.current.bringToFront)
                b.el.style.zIndex = String(
                    (zRef.current =
                        Math.max(zRef.current, 10 + bodies.current.length) + 1)
                ) // 10-16: 초기 순서(10+i)보다 항상 위로
            b.el.style.cursor = "grabbing"
            b.el.style.transition = reducedRef.current
                ? "none"
                : "transform .28s cubic-bezier(.2,1.3,.4,1), filter .28s ease"
            b.el.style.transform = wrapperTransform(b, true)
            b.el.style.filter = shadowFilter(true)
        }
        if (b.peelEl && !reducedRef.current) {
            b.peelEl.style.background = peelGradient(b)
            b.peelEl.style.clipPath = peelClip(b, 0)
            // 다음 프레임에 펼쳐야 transition 이 걸린다
            // 알약·원·별처럼 모서리가 비어 있는(둥근) 도형은 삼각형을 더 크게 펼쳐야 벗겨진 면이 보인다
            const roundShape = b.el
                ? b.el.getAttribute("data-round") === "1"
                : false
            requestAnimationFrame(() => {
                if (b.held && b.peelEl)
                    b.peelEl.style.clipPath = peelClip(
                        b,
                        clamp(opts.current.peel, 0, 100) *
                            (roundShape ? 0.95 : 0.55)
                    )
            })
        }
        if (e.currentTarget && e.currentTarget.setPointerCapture) {
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch (_) {}
        }
    }

    // ── 끌기: 위치 + 진행 방향으로 기울임(lean) ──
    const onPointerMove = (e: any, i: number) => {
        const b = bodies.current[i]
        if (!b || !b.held) return
        const { W, H } = boardRef.current
        const now = e.timeStamp || Date.now()
        const dx = e.clientX - b.prevX,
            dy = e.clientY - b.prevY
        const dt = Math.max(0.004, (now - b.prevT) / 1000)
        // 속도는 완만하게 섞어서 떨림을 줄인다
        b.vx = b.vx * 0.6 + (dx / dt) * 0.4
        b.vy = b.vy * 0.6 + (dy / dt) * 0.4
        b.prevX = e.clientX
        b.prevY = e.clientY
        b.prevT = now
        if (Math.hypot(e.clientX - b.downX, e.clientY - b.downY) > 6)
            b.moved = true
        b.x += (dx / W) * 100
        b.y += (dy / H) * 100
        confine(b)
        draw(b)
        if (b.tiltEl && !reducedRef.current) {
            const L = opts.current.lean
            const ry = clamp(b.vx / 60, -L, L),
                rx = clamp(-b.vy / 60, -L, L)
            b.tiltEl.style.transform =
                "rotateX(" + rx + "deg) rotateY(" + ry + "deg)"
        }
    }

    // ── 놓기: 찰싹 — 살짝 돌아간 각도로 내려앉고, 세게 던졌으면 미끄러진다 ──
    const onPointerUp = (e: any, i: number) => {
        const b = bodies.current[i]
        if (!b || !b.held) return
        b.held = false
        const sp = Math.hypot(b.vx, b.vy)
        const dir = Math.abs(b.vx) > 20 ? Math.sign(b.vx) : i % 2 ? 1 : -1
        const drift = reducedRef.current
            ? 0
            : dir * clamp(opts.current.slap, 0, 30) * clamp(sp / 900, 0.35, 1)
        b.r = b.r + drift
        if (b.el) {
            b.el.style.cursor = "grab"
            b.el.style.transition = reducedRef.current
                ? "none"
                : "transform .45s cubic-bezier(.2,1.6,.35,1), filter .35s ease"
            b.el.style.transform = wrapperTransform(b, false)
            b.el.style.filter = shadowFilter(false)
        }
        if (b.tiltEl) b.tiltEl.style.transform = "rotateX(0deg) rotateY(0deg)"
        if (b.peelEl) b.peelEl.style.clipPath = peelClip(b, 0)
        const wasFast = sp >= 120
        if (wasFast) startThrow(b)
        else {
            b.vx = 0
            b.vy = 0
        }
    }

    // 드래그였으면 링크 이동을 막는다 (6px·300ms 이내만 탭으로 인정)
    const onClick = (e: any, i: number) => {
        const b = bodies.current[i]
        if (!b) return
        const dt = (e.timeStamp || Date.now()) - b.downT
        if (b.moved || dt > 300) e.preventDefault()
    }

    // 키보드: Enter/Space = 스티커 들어 올리기/내려놓기(찰싹), 화살표 = 이동 (Shift = 5칸)
    const bringFront = (b: Body) => {
        if (b.el && opts.current.bringToFront)
            b.el.style.zIndex = String(
                (zRef.current =
                    Math.max(zRef.current, 10 + bodies.current.length) + 1)
            ) // 10-16: 초기 순서(10+i)보다 항상 위로
    }
    const kbDrop = (b: Body, i: number) => {
        if (!b.kbGrab) return
        b.kbGrab = false
        b.r =
            b.r +
            (reducedRef.current
                ? 0
                : (i % 2 ? 1 : -1) * clamp(opts.current.slap, 0, 30) * 0.5) // 마우스 놓기와 같은 찰싹 (약하게)
        if (b.el) {
            b.el.setAttribute("aria-pressed", "false")
            b.el.style.transition = reducedRef.current
                ? "none"
                : "transform .45s cubic-bezier(.2,1.6,.35,1), filter .35s ease"
            b.el.style.transform = wrapperTransform(b, false)
            b.el.style.filter = shadowFilter(false)
        }
    }
    const onKeyDown = (e: any, i: number) => {
        if (!interactive) return
        const b = bodies.current[i]
        const root = rootRef.current
        if (!b || !root) return
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault() // Space 가 페이지를 스크롤하지 않게
            if (b.held) return // 마우스로 잡고 있는 중이면 무시
            if (b.kbGrab) {
                kbDrop(b, i)
            } else {
                b.kbGrab = true
                bringFront(b)
                if (b.el) {
                    b.el.setAttribute("aria-pressed", "true")
                    b.el.style.transition = reducedRef.current
                        ? "none"
                        : "transform .28s cubic-bezier(.2,1.3,.4,1), filter .28s ease"
                    b.el.style.transform = wrapperTransform(b, true)
                    b.el.style.filter = shadowFilter(true)
                }
            }
            return
        }
        if (e.key === "Escape") {
            kbDrop(b, i)
            return
        }
        const step = e.shiftKey ? 5 : 1
        let dx = 0,
            dy = 0
        if (e.key === "ArrowLeft") dx = -step
        else if (e.key === "ArrowRight") dx = step
        else if (e.key === "ArrowUp") dy = -step
        else if (e.key === "ArrowDown") dy = step
        else return
        e.preventDefault()
        const rr = root.getBoundingClientRect()
        boardRef.current = {
            W: Math.max(1, rr.width),
            H: Math.max(1, rr.height),
        }
        b.x += dx
        b.y += dy
        confine(b)
        if (b.el) {
            b.el.style.transition = reducedRef.current
                ? "none"
                : "left .15s ease, top .15s ease, transform .28s cubic-bezier(.2,1.3,.4,1), filter .28s ease"
        }
        bringFront(b)
        draw(b)
    }
    // 포커스를 잃으면 들어 올린 스티커를 내려놓는다
    const onBlur = (i: number) => {
        const b = bodies.current[i]
        if (b) kbDrop(b, i)
    }

    // 더블클릭: 모든 스티커를 처음 자리로 (부드럽게 돌아감)
    const onDoubleClick = () => {
        if (!interactive || !resetOnDoubleClick) return
        bodies.current.forEach((b, i) => {
            const p = init[i]
            if (!p) return
            stopThrow(b)
            b.kbGrab = false
            if (b.el) b.el.setAttribute("aria-pressed", "false")
            b.x = p.x
            b.y = p.y
            b.r = p.r
            if (b.el) {
                b.el.style.transition = reducedRef.current
                    ? "none"
                    : "left .6s cubic-bezier(.2,1,.3,1), top .6s cubic-bezier(.2,1,.3,1), transform .6s cubic-bezier(.2,1,.3,1)"
                b.el.style.transform = wrapperTransform(b, false)
                b.el.style.zIndex = String(10 + i)
            }
            draw(b)
        })
        zRef.current = 10 + bodies.current.length
    }

    // ── 스티커 한 장 렌더 ──
    const renderSticker = (i: number) => {
        const it = list[i]
        const p = init[i]
        const sq =
            it.shape === "circle" || it.shape === "star" || it.shape === "burst"
        const clip = CLIP[it.shape]
        const bw = Math.max(0, borderWidth)
        const fill = it.color
        const color =
            textMode === "custom"
                ? textColor
                : luminance(fill) > 0.6
                  ? "#111114"
                  : "#FFFFFF"
        const shapeRadius: string | number =
            it.shape === "pill" || it.shape === "circle"
                ? 999
                : it.shape === "arch"
                  ? "50% 50% " +
                    radius +
                    "px " +
                    radius +
                    "px / 55% 55% " +
                    radius +
                    "px " +
                    radius +
                    "px"
                  : radius
        const base = stickerSize

        // 위치 래퍼 (좌표 %, 회전·크기는 transform) — 서버 렌더에서도 그대로 보인다
        const wrapperStyle: CSSProperties = {
            position: "absolute",
            left: p.x + "%",
            top: p.y + "%",
            transform:
                "translate(-50%, -50%) rotate(" +
                p.r +
                "deg) scale(" +
                p.s +
                ")",
            zIndex: 10 + i,
            filter: shadowFilter(false),
            perspective: 700,
            cursor: interactive ? "grab" : "default",
            touchAction: interactive ? "none" : "auto",
            userSelect: "none",
            WebkitUserSelect: "none",
            willChange: interactive ? "transform, left, top" : undefined,
            textDecoration: "none",
            color: "inherit",
        }
        const tiltStyle: CSSProperties = {
            transition: reducedRef.current ? "none" : "transform .12s ease-out",
            transformStyle: "preserve-3d",
        }
        // 뒷면(curl) 오버레이 — 잡으면 모서리에서 삼각형으로 펼쳐지고, 놓으면 접힌다
        const peelStyle: CSSProperties = {
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            clipPath: "polygon(100% 0%, 100% 0%, 100% 0%)",
            background:
                "linear-gradient(225deg, #ffffff 0%, #ededed 45%, #b9b9b9 100%)",
            transition: reducedRef.current
                ? "none"
                : "clip-path .32s cubic-bezier(.2,1,.3,1)",
            borderRadius: shapeRadius,
        }

        // 텍스트·도형 스티커: 바깥(테두리색) → 안쪽(채움색) 두 겹으로 다이컷 흰 테두리
        const outer: CSSProperties = {
            position: "relative",
            boxSizing: "border-box",
            background: borderColor,
            padding: clip ? bw * 1.9 : bw,
            borderRadius: clip ? 0 : shapeRadius,
            clipPath: clip,
            overflow: "hidden",
            width: sq ? base : "auto",
            height: sq ? base : "auto",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "stretch",
        }
        const inner: CSSProperties = {
            ...font,
            color,
            background: fill,
            boxSizing: "border-box",
            borderRadius: clip
                ? 0
                : typeof shapeRadius === "number"
                  ? Math.max(0, shapeRadius - bw)
                  : shapeRadius,
            clipPath: clip,
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            whiteSpace: sq ? "normal" : "nowrap",
            padding: sq ? "14%" : paddingY + "px " + paddingX + "px",
            lineHeight: 1.1,
            overflow: "hidden",
        }
        const face = (
            <div style={outer}>
                <div style={inner}>{it.label}</div>
                <div
                    ref={(el) => {
                        part(i).peelEl = el
                        if (bodies.current[i]) bodies.current[i].peelEl = el
                    }}
                    style={peelStyle}
                />
            </div>
        )

        const common: any = {
            ref: (el: HTMLElement | null) => {
                part(i).el = el
                if (bodies.current[i]) bodies.current[i].el = el
            },
            style: wrapperStyle,
            draggable: false,
            "data-round": it.shape !== "rect" ? "1" : "0",
            tabIndex: interactive ? 0 : undefined,
            "aria-label": it.label,
            "aria-describedby": interactive ? hintId : undefined,
            onPointerDown: live ? (e: any) => onPointerDown(e, i) : undefined,
            onPointerMove: interactive
                ? (e: any) => onPointerMove(e, i)
                : undefined,
            onPointerUp: interactive
                ? (e: any) => onPointerUp(e, i)
                : undefined,
            onPointerCancel: interactive
                ? (e: any) => onPointerUp(e, i)
                : undefined,
            onKeyDown: interactive ? (e: any) => onKeyDown(e, i) : undefined,
            onBlur: interactive ? () => onBlur(i) : undefined,
            onClick: live ? (e: any) => onClick(e, i) : undefined,
            onDragStart: (e: any) => e.preventDefault(),
        }
        const content = (
            <div
                ref={(el) => {
                    part(i).tiltEl = el
                    if (bodies.current[i]) bodies.current[i].tiltEl = el
                }}
                style={tiltStyle}
            >
                {face}
            </div>
        )
        return (
            <div key={i} {...common} role={interactive ? "button" : undefined}>
                {content}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            onDoubleClick={onDoubleClick}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background,
                boxSizing: "border-box",
                minHeight: 120,
            }}
            aria-label="Sticker board"
        >
            {interactive && (
                <span
                    id={hintId}
                    style={{
                        position: "absolute",
                        width: 1,
                        height: 1,
                        margin: -1,
                        padding: 0,
                        overflow: "hidden",
                        clip: "rect(0 0 0 0)",
                        clipPath: "inset(50%)",
                        whiteSpace: "nowrap",
                        border: 0,
                    }}
                >
                    Use arrow keys to move the sticker. Press Enter or Space to
                    lift it. Double-click to reset.
                </span>
            )}
            {list.map((_, i) => renderSticker(i))}
        </div>
    )
}

StickerBoardLite.displayName = "Sticker Board Lite"

addPropertyControls(StickerBoardLite, {
    stickers: {
        type: ControlType.Array,
        title: "Stickers",
        maxCount: MAX_STICKERS,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "New",
                },
                shape: {
                    type: ControlType.Enum,
                    title: "Shape",
                    options: [
                        "pill",
                        "rect",
                        "circle",
                        "star",
                        "burst",
                        "arch",
                    ],
                    optionTitles: [
                        "Pill",
                        "Rect",
                        "Circle",
                        "Star",
                        "Burst",
                        "Arch",
                    ],
                    defaultValue: "pill",
                },
                color: {
                    type: ControlType.Color,
                    title: "Color",
                    defaultValue: "#2DE5A0",
                },
                size: {
                    type: ControlType.Number,
                    title: "Size",
                    defaultValue: 100,
                    min: 20,
                    max: 300,
                    step: 5,
                    unit: "%",
                },
            },
        },
        defaultValue: SAMPLE,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["scatter", "grid"],
        optionTitles: ["Scatter", "Grid"],
        defaultValue: "scatter",
        displaySegmentedControl: true,
    },
    seed: {
        type: ControlType.Number,
        title: "Shuffle",
        defaultValue: 7,
        min: 1,
        max: 99,
        step: 1,
    },
    stickerSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 140,
        min: 60,
        max: 320,
        step: 2,
        unit: "px",
    },
    sizeVariance: {
        type: ControlType.Number,
        title: "Size Variety",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 1,
        unit: "%",
    },
    maxTilt: {
        type: ControlType.Number,
        title: "Max Tilt",
        defaultValue: 14,
        min: 0,
        max: 45,
        step: 1,
        unit: "°",
    },
    drag: {
        type: ControlType.Boolean,
        title: "Drag",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    peel: {
        type: ControlType.Number,
        title: "Peel",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p: any) => p.drag === false,
    },
    lift: {
        type: ControlType.Number,
        title: "Lift",
        defaultValue: 1.08,
        min: 1,
        max: 1.3,
        step: 0.01,
        unit: "×",
        hidden: (p: any) => p.drag === false,
    },
    lean: {
        type: ControlType.Number,
        title: "Lean",
        defaultValue: 14,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
        hidden: (p: any) => p.drag === false,
    },
    slap: {
        type: ControlType.Number,
        title: "Slap Tilt",
        defaultValue: 6,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
        hidden: (p: any) => p.drag === false,
    },
    bringToFront: {
        type: ControlType.Boolean,
        title: "Grab",
        defaultValue: true,
        enabledTitle: "To Front",
        disabledTitle: "Keep",
        hidden: (p: any) => p.drag === false,
    },
    keepInside: {
        type: ControlType.Boolean,
        title: "Bounds",
        defaultValue: true,
        enabledTitle: "Inside",
        disabledTitle: "Free",
        hidden: (p: any) => p.drag === false,
    },
    resetOnDoubleClick: {
        type: ControlType.Boolean,
        title: "Dbl-click",
        defaultValue: true,
        enabledTitle: "Reset",
        disabledTitle: "Nothing",
        hidden: (p: any) => p.drag === false,
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Die-cut",
        defaultValue: 5,
        min: 0,
        max: 14,
        step: 0.5,
        unit: "px",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Die-cut Color",
        defaultValue: "#FFFFFF",
        hidden: (p: any) => !p.borderWidth,
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.Number,
        title: "Shadow",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    textMode: {
        type: ControlType.Enum,
        title: "Text",
        options: ["auto", "custom"],
        optionTitles: ["Auto", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#111114",
        hidden: (p: any) => p.textMode !== "custom",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 22,
        min: 4,
        max: 80,
        step: 1,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 12,
        min: 2,
        max: 60,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgba(0, 0, 0, 0)",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "18px",
            variant: "Bold",
            lineHeight: "1.1em",
        },
        description: "Created by BrandingUp",
    },
})
