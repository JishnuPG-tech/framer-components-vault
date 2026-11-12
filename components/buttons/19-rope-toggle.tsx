// [생성일] 2026-10-16
// [경위] 달러벌기 19번 상품 — Rope Toggle. 전등 당김줄처럼 당겼다 놓으면 상태가 바뀌는 토글.
//        기본 용도는 사이트 다크/라이트 모드 전환(프레이머 네이티브 색상 스타일), 일반 ON/OFF 로도 사용 (무료 상품)
// [변경이력]
//   - 2026-10-16: 최초 생성 (외부 라이브러리 없는 verlet 로프 물리, 당겨서 놓기·탭·키보드(Enter/Space) 토글,
//                 손잡이 6종(공·막대·고리·술·전구·이미지), 줄 3종(로프·체인·끈), 프레이머 라이트/다크 색상 스타일 전환,
//                 html 속성/클래스 모드, 이벤트 모드, localStorage 기억, 합성 클릭음(기본 꺼짐),
//                 캔버스·정적 렌더에서는 정지 상태만 표시, 화면 밖·정착 시 루프 정지, reduced-motion 은 흔들림 없음)

import { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react"
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
interface RopeToggleProps {
    knobStyle?: "ball" | "bar" | "ring" | "tassel" | "bulb" | "image"
    knobImage?: { src?: string; srcSet?: string; alt?: string }
    knobSize?: number
    knobColorOff?: string
    knobColorOn?: string
    glow?: boolean
    ropeStyle?: "rope" | "chain" | "cord"
    ropeColor?: string
    ropeWidth?: number
    ropeMode?: "auto" | "custom"
    ropeLength?: number
    anchorX?: number
    mount?: boolean
    pullDistance?: number
    stretch?: number
    gravity?: number
    damping?: number
    sound?: boolean
    action?: "framer" | "attribute" | "none"
    onIsDark?: boolean
    attrName?: string
    valueOn?: string
    valueOff?: string
    htmlClass?: string
    start?: "off" | "on" | "system"
    remember?: boolean
    storeKey?: string
    showLabel?: boolean
    labelOff?: string
    labelOn?: string
    labelColor?: string
    font?: any
    style?: CSSProperties
}

// 로프 한 마디의 점 (verlet: 현재 위치 + 직전 위치로 속도를 표현)
interface Pt {
    x: number
    y: number
    px: number
    py: number
}

// 로프 세계 (렌더마다 ref 로 유지, React state 를 거치지 않음)
interface Rope {
    pts: Pt[]
    ax: number // 천장 고정점
    ay: number
    len: number // 로프 전체 길이(px)
    W: number
    H: number
    dragging: boolean
    tx: number // 드래그 목표점 (손잡이가 끌려갈 자리)
    ty: number
    quiet: number // 거의 안 움직인 연속 프레임 수
    calm: number // 눈에 안 띄게(0.5px 미만) 움직인 연속 프레임 수 (안전망)
}

const SEGMENTS = 16
const ITER = 20 // 길이 제약 반복 횟수 (16마디 × 20회 — 적으면 중력 처짐·꺾임이 남는다, 2026-10-16 시뮬레이션으로 결정)
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect
const THEME_STYLE_ID = "rope-toggle-theme"
const THEME_ATTR = "data-rope-theme"
const EVENT_NAME = "ropetoggle"

// 로프 점들을 고정점에서 곧게 늘어뜨린 상태로 초기화
function resetRope(r: Rope) {
    const seg = r.len / SEGMENTS
    r.pts = []
    for (let i = 0; i <= SEGMENTS; i++) {
        const y = r.ay + seg * i
        r.pts.push({ x: r.ax, y, px: r.ax, py: y })
    }
    r.quiet = 0
    r.calm = 0
}

// verlet 한 스텝: 관성·중력 → 길이 제약 → 고정점·드래그 핀
function stepRope(r: Rope, gravity: number, friction: number, stretch: number) {
    const pts = r.pts
    const seg = r.len / SEGMENTS
    const g = gravity * 0.55
    for (let i = 1; i < pts.length; i++) {
        const p = pts[i]
        let vx = (p.x - p.px) * friction
        let vy = (p.y - p.py) * friction
        // 마디 속도 상한 (프레임당 px): 놓는 순간 줄이 너무 빨리 수축해 고리처럼 말리는 것을 막는다
        const sp = Math.hypot(vx, vy)
        if (sp > 14) { vx *= 14 / sp; vy *= 14 / sp }
        p.px = p.x
        p.py = p.y
        p.x += vx
        p.y += vy + g
    }
    // 드래그 목표점: 고정점에서 (길이 + 늘어남 한계) 안으로 자른다 (고무줄처럼 조금만 늘어남)
    let tx = r.tx, ty = r.ty
    if (r.dragging) {
        const dx = tx - r.ax, dy = ty - r.ay
        const d = Math.hypot(dx, dy) || 1
        const max = r.len + stretch
        if (d > max) { tx = r.ax + (dx / d) * max; ty = r.ay + (dy / d) * max }
    }
    const last = pts[pts.length - 1]
    for (let k = 0; k < ITER; k++) {
        pts[0].x = r.ax; pts[0].y = r.ay
        if (r.dragging) { last.x = tx; last.y = ty }
        for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1]
            let dx = b.x - a.x, dy = b.y - a.y
            const d = Math.hypot(dx, dy) || 0.0001
            const diff = (d - seg) / d
            // 끝점이 드래그 중이면 마지막 마디는 잡힌 쪽이 안 움직임
            const wa = i === 0 ? 0 : 0.5
            const wb = r.dragging && i === pts.length - 2 ? 0 : i === 0 ? 1 : 0.5
            const s = wa + wb || 1
            dx *= diff; dy *= diff
            a.x += dx * (wa / s); a.y += dy * (wa / s)
            b.x -= dx * (wb / s); b.y -= dy * (wb / s)
        }
    }
    pts[0].x = r.ax; pts[0].y = r.ay
    if (r.dragging) { last.x = tx; last.y = ty }
    // 마무리 패스: 위에서부터 각 마디를 제 길이 쪽으로 당겨 중력 처짐을 줄인다 (k=1 이면 정확히 맞춤).
    // 현재 위치와 직전 위치를 같이 옮겨 속도를 바꾸지 않는다 (에너지 주입 없음 → 튀어오르지 않음)
    if (!r.dragging) tightenRope(r, 0.5)
}

// 각 마디를 제 길이 쪽으로 k 비율만큼 당긴다 (속도 보존)
function tightenRope(r: Rope, k: number) {
    const pts = r.pts
    const seg = r.len / SEGMENTS
    for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1]
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 0.0001
        const cx = (a.x + (dx / d) * seg - b.x) * k
        const cy = (a.y + (dy / d) * seg - b.y) * k
        b.x += cx; b.y += cy; b.px += cx; b.py += cy
    }
}

// 점들을 지나는 부드러운 경로 (중점 2차 베지어)
function ropePath(pts: Pt[]) {
    if (pts.length < 2) return ""
    let d = "M" + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1)
    for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2
        d += " Q" + pts[i].x.toFixed(1) + " " + pts[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1)
    }
    const l = pts[pts.length - 1]
    d += " L" + l.x.toFixed(1) + " " + l.y.toFixed(1)
    return d
}

// ─────────────────────────────────────────────
// 프레이머 네이티브 라이트/다크 색상 스타일 강제 전환
// 프레이머는 다크 토큰을 @media (prefers-color-scheme: dark) { body { --token… } } 로만 내보낸다.
// 그 토큰 묶음을 읽어 html[data-rope-theme=…] 기준 스타일시트로 다시 써 넣으면 시스템 설정과 무관하게 전환된다.
// ─────────────────────────────────────────────
function collectTokens(rule: any, into: string[]) {
    const sel = rule && rule.selectorText
    if (!sel || !(sel === "body" || sel === ":root" || sel === "html")) return
    const st = rule.style
    for (let i = 0; i < st.length; i++) {
        const name = st[i]
        if (name.indexOf("--token") === 0) into.push(name + ":" + st.getPropertyValue(name) + ";")
    }
}

function ensureFramerThemeStyle(doc: Document) {
    const light: string[] = []
    const dark: string[] = []
    const sheets = doc.styleSheets
    for (let s = 0; s < sheets.length; s++) {
        let rules: any
        try { rules = sheets[s].cssRules } catch (_) { continue } // 교차 출처 시트는 건너뜀
        if (!rules) continue
        for (let i = 0; i < rules.length; i++) {
            const rule: any = rules[i]
            if (rule.conditionText && rule.conditionText.replace(/\s/g, "") === "(prefers-color-scheme:dark)") {
                const inner = rule.cssRules || []
                for (let j = 0; j < inner.length; j++) collectTokens(inner[j], dark)
            } else collectTokens(rule, light)
        }
    }
    let el = doc.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null
    if (!el) {
        el = doc.createElement("style")
        el.id = THEME_STYLE_ID
        doc.head.appendChild(el)
    }
    el.textContent =
        "html[" + THEME_ATTR + '="light"] body{' + light.join("") + "}" +
        "html[" + THEME_ATTR + '="dark"] body{' + dark.join("") + "}" +
        "html[" + THEME_ATTR + '="light"]{color-scheme:light}' +
        "html[" + THEME_ATTR + '="dark"]{color-scheme:dark}'
}

// 합성 클릭음 (외부 파일 없음) — 켤 때는 높게, 끌 때는 낮게 "틱"
function playClick(ctxRef: { current: any }, on: boolean) {
    const g: any = globalThis as any
    const AC = g.AudioContext || g.webkitAudioContext
    if (!AC) return
    try {
        const ctx = ctxRef.current || (ctxRef.current = new AC())
        if (ctx.state === "suspended" && ctx.resume) ctx.resume()
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "square"
        osc.frequency.setValueAtTime(on ? 1900 : 1300, t)
        osc.frequency.exponentialRampToValueAtTime(on ? 700 : 350, t + 0.045)
        gain.gain.setValueAtTime(0.12, t)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.08)
    } catch (_) {}
}

/**
 * Rope Toggle — 천장에서 내려온 당김줄. 당겼다 놓으면(또는 탭·Enter/Space) 상태가 바뀌고 줄이 흔들린다.
 * 기본은 사이트 다크/라이트 모드 전환(프레이머 색상 스타일), html 속성/클래스나 이벤트만 쏘는 모드도 있다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 160
 * @framerIntrinsicHeight 320
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RopeToggle(props: RopeToggleProps) {
    const {
        knobStyle = "bulb",
        knobImage,
        knobSize = 36,
        knobColorOff = "#3A3A40",
        knobColorOn = "#FFD166",
        glow = true,
        ropeStyle = "rope",
        ropeColor = "#C9B79C",
        ropeWidth = 5,
        ropeMode = "auto",
        ropeLength = 200,
        anchorX = 50,
        mount = true,
        pullDistance = 40,
        stretch = 60,
        gravity = 1,
        damping = 0.3,
        sound = false,
        action = "framer",
        onIsDark = true,
        attrName = "data-theme",
        valueOn = "dark",
        valueOff = "light",
        htmlClass = "dark",
        start = "off",
        remember = true,
        storeKey = "rope-toggle",
        showLabel = false,
        labelOff = "Light",
        labelOn = "Dark",
        labelColor = "#8A8A8F",
        font = { fontFamily: "Inter", fontWeight: 500, fontSize: 13 },
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기): 곧게 늘어진 줄만
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 정지 상태, 페이지 테마는 건드리지 않음
    const interactive = !isStatic && !isCanvas

    // 시작 상태 (서버·캔버스에서는 System = Off 로 보임, 브라우저에서 mount 후 보정)
    const [on, setOn] = useState<boolean>(start === "on")
    const [pulling, setPulling] = useState(false) // 당김 한계를 넘겼는지 (손잡이 살짝 커짐)
    const [size, setSize] = useState({ W: 160, H: 320 })

    const rootRef = useRef<HTMLDivElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const pathRef2 = useRef<SVGPathElement>(null)
    const pathRef3 = useRef<SVGPathElement>(null)
    const knobRef = useRef<SVGGElement>(null)
    const imgRef = useRef<HTMLDivElement>(null)
    const labelRef = useRef<HTMLDivElement>(null)
    const ropeRef = useRef<Rope>({ pts: [], ax: 80, ay: 0, len: 200, W: 160, H: 320, dragging: false, tx: 0, ty: 0, quiet: 0, calm: 0 })
    const rafRef = useRef(0)
    const runningRef = useRef(false)
    const inViewRef = useRef(true)
    const reducedRef = useRef(false)
    const audioRef = useRef<any>(null)
    const onRef = useRef(on)
    onRef.current = on
    const pointer = useRef({ id: -1, downX: 0, downY: 0, knobX: 0, knobY: 0, moved: false, past: false })
    const paramsRef = useRef({ gravity, damping, stretch, pullDistance })
    paramsRef.current = { gravity, damping, stretch, pullDistance }
    const themeRef = useRef({ action, onIsDark, attrName, valueOn, valueOff, htmlClass, remember, storeKey, sound })
    themeRef.current = { action, onIsDark, attrName, valueOn, valueOff, htmlClass, remember, storeKey, sound }

    // 손잡이 치수 (스타일별로 세로 길이가 다름)
    const knobH = knobStyle === "bar" ? knobSize * 0.5 : knobStyle === "tassel" ? knobSize * 1.6 : knobStyle === "bulb" ? knobSize * 1.25 : knobSize
    const ropeLen = useMemo(() => {
        const auto = Math.max(24, size.H - knobH - (showLabel ? 28 : 6))
        return ropeMode === "custom" ? Math.max(20, ropeLength) : auto
    }, [ropeMode, ropeLength, size.H, knobH, showLabel])
    const ax = (Math.max(0, Math.min(100, anchorX)) / 100) * size.W

    // ── 그리기: 로프 경로·손잡이·라벨 위치를 DOM 에 직접 반영 ──
    const draw = () => {
        const r = ropeRef.current
        const pts = r.pts
        if (pts.length < 2) return
        const d = ropePath(pts)
        if (pathRef.current) pathRef.current.setAttribute("d", d)
        if (pathRef2.current) pathRef2.current.setAttribute("d", d)
        if (pathRef3.current) pathRef3.current.setAttribute("d", d)
        const a = pts[pts.length - 2], b = pts[pts.length - 1]
        const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90
        const tr = "translate(" + b.x.toFixed(1) + " " + b.y.toFixed(1) + ") rotate(" + ang.toFixed(1) + ")"
        if (knobRef.current) knobRef.current.setAttribute("transform", tr)
        if (imgRef.current) imgRef.current.style.transform = "translate(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px) rotate(" + ang.toFixed(1) + "deg)"
        if (labelRef.current) labelRef.current.style.transform = "translate(" + (b.x - 60).toFixed(1) + "px," + (b.y + knobH + 6).toFixed(1) + "px)"
    }

    // ── 루프 제어: 움직임이 있을 때만 돌고, 정착하면 멈춘다 (CPU 0) ──
    const stopLoop = () => {
        runningRef.current = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }
    const loop = () => {
        if (!runningRef.current) return
        const r = ropeRef.current
        const p = paramsRef.current
        const friction = 0.985 - Math.max(0, Math.min(1, p.damping)) * 0.05
        if (reducedRef.current) {
            // 동작 줄이기: 흔들림 없이, 당기는 동안만 곧게 따라가고 놓으면 즉시 제자리
            let ex = r.ax, ey = r.ay + r.len
            if (r.dragging) {
                const dx = r.tx - r.ax, dy = r.ty - r.ay
                const d = Math.hypot(dx, dy) || 1
                const L = Math.min(d, r.len + p.stretch)
                ex = r.ax + (dx / d) * L; ey = r.ay + (dy / d) * L
            }
            for (let i = 0; i <= SEGMENTS; i++) {
                const t = i / SEGMENTS
                const q = r.pts[i]
                q.x = q.px = r.ax + (ex - r.ax) * t
                q.y = q.py = r.ay + (ey - r.ay) * t
            }
            draw()
            if (!r.dragging) { stopLoop(); return }
            rafRef.current = requestAnimationFrame(loop)
            return
        }
        stepRope(r, p.gravity, friction, p.stretch)
        let maxMove = 0
        for (const q of r.pts) maxMove = Math.max(maxMove, Math.abs(q.x - q.px), Math.abs(q.y - q.py))
        draw()
        // 정착 판정: 프레임당 0.1px 미만이 40프레임 이어지면 정지. 안전망: 0.5px 미만 잔떨림이 2초 이어져도 정지
        if (!r.dragging && maxMove < 0.1) r.quiet++
        else r.quiet = 0
        if (!r.dragging && maxMove < 0.5) r.calm++
        else r.calm = 0
        if (r.quiet > 40 || r.calm > 120) {
            tightenRope(r, 1) // 멈출 때 길이를 정확히 맞춰 처짐 없이 곧게
            for (const q of r.pts) { q.px = q.x; q.py = q.y }
            draw()
            stopLoop()
            return
        }
        rafRef.current = requestAnimationFrame(loop)
    }
    const wake = () => {
        if (runningRef.current || !interactive || !inViewRef.current) return
        runningRef.current = true
        ropeRef.current.quiet = 0
        ropeRef.current.calm = 0
        rafRef.current = requestAnimationFrame(loop)
    }

    // ── 테마 적용: 캔버스에서는 절대 페이지를 건드리지 않음 ──
    const applyTheme = (next: boolean, emit: boolean) => {
        if (!interactive || typeof document === "undefined") return
        const t = themeRef.current
        const html = document.documentElement
        const theme = next === t.onIsDark ? "dark" : "light"
        try {
            if (t.action === "framer") {
                ensureFramerThemeStyle(document)
                html.setAttribute(THEME_ATTR, theme)
            } else if (t.action === "attribute") {
                if (t.attrName) html.setAttribute(t.attrName, next ? t.valueOn : t.valueOff)
                if (t.htmlClass) html.classList.toggle(t.htmlClass, next)
            }
            if (t.remember && t.storeKey) localStorage.setItem(t.storeKey, next ? "on" : "off")
        } catch (_) {}
        if (emit) {
            try {
                globalThis.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { on: next, theme } }))
            } catch (_) {}
        }
    }

    const toggle = (tug: boolean) => {
        const next = !onRef.current
        onRef.current = next
        startTransition(() => setOn(next))
        applyTheme(next, true)
        if (themeRef.current.sound) playClick(audioRef, next)
        if (tug && !reducedRef.current) {
            // 키보드·탭: 끝점에 아래쪽 충격을 줘서 살짝 당겨졌다 돌아오는 느낌
            const r = ropeRef.current
            const last = r.pts[r.pts.length - 1]
            if (last) { last.py -= 7; last.px -= 1.5 }
            wake()
        }
    }

    // ── 브라우저 mount: 저장값·시스템 설정으로 시작 상태 보정 + 다른 인스턴스와 동기화 ──
    useEffect(() => {
        if (!interactive) return
        const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        reducedRef.current = !!(mq && mq.matches)
        const t = themeRef.current
        let initial: boolean | null = null
        try {
            const saved = t.remember && t.storeKey ? localStorage.getItem(t.storeKey) : null
            if (saved === "on") initial = true
            else if (saved === "off") initial = false
        } catch (_) {}
        if (initial === null) {
            if (start === "system") {
                const dark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches
                initial = t.action === "framer" ? dark === t.onIsDark : dark
            } else initial = start === "on"
        }
        onRef.current = initial
        startTransition(() => setOn(initial as boolean))
        applyTheme(initial, false)
        // 같은 페이지의 다른 Rope Toggle 이 바뀌면 따라간다
        const onEvt = (e: any) => {
            const v = e && e.detail && typeof e.detail.on === "boolean" ? e.detail.on : null
            if (v === null || v === onRef.current) return
            onRef.current = v
            startTransition(() => setOn(v))
        }
        globalThis.addEventListener(EVENT_NAME, onEvt)
        return () => globalThis.removeEventListener(EVENT_NAME, onEvt)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interactive])

    // ── 속성(모드·속성명 등)이 바뀌면 현재 상태를 다시 적용 ──
    useEffect(() => {
        if (!interactive) return
        applyTheme(onRef.current, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, onIsDark, attrName, valueOn, valueOff, htmlClass, interactive])

    // ── 크기 측정 (ResizeObserver) ──
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const apply = (W: number, H: number) => {
            if (Math.abs(W - size.W) < 0.5 && Math.abs(H - size.H) < 0.5) return
            startTransition(() => setSize({ W, H }))
        }
        apply(root.clientWidth, root.clientHeight)
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const rc = entries[0].contentRect
            apply(rc.width, rc.height)
        })
        ro.observe(root)
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.W, size.H])

    // ── 로프 초기화 (크기·길이·고정점이 바뀔 때) ──
    useIsoLayoutEffect(() => {
        const r = ropeRef.current
        r.W = size.W; r.H = size.H; r.ax = ax; r.ay = 0; r.len = ropeLen
        r.dragging = false
        resetRope(r)
        draw()
        return () => stopLoop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.W, size.H, ax, ropeLen, knobH])

    // ── 화면에 보일 때만 재생 (마켓 AI 심사 요구사항) ──
    useEffect(() => {
        if (!interactive) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") { inViewRef.current = true; return }
        const io = new IntersectionObserver((entries) => {
            inViewRef.current = entries[0].isIntersecting
            if (!inViewRef.current) stopLoop()
            else if (ropeRef.current.dragging) wake()
        }, { threshold: 0 })
        io.observe(root)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interactive])

    // ── 포인터: 어디를 잡아도 손잡이가 끌려온다 (이동량 기준) ──
    const onPointerDown = (e: any) => {
        if (!interactive || e.button > 0) return
        const r = ropeRef.current
        const last = r.pts[r.pts.length - 1]
        if (!last) return
        const pr = pointer.current
        pr.id = e.pointerId; pr.downX = e.clientX; pr.downY = e.clientY
        pr.knobX = last.x; pr.knobY = last.y; pr.moved = false; pr.past = false
        r.dragging = true; r.tx = last.x; r.ty = last.y
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
        if (rootRef.current) rootRef.current.style.cursor = "grabbing"
        wake()
    }
    const onPointerMove = (e: any) => {
        const r = ropeRef.current
        const pr = pointer.current
        if (!r.dragging || e.pointerId !== pr.id) return
        const dx = e.clientX - pr.downX, dy = e.clientY - pr.downY
        if (Math.hypot(dx, dy) > 6) pr.moved = true
        r.tx = pr.knobX + dx; r.ty = pr.knobY + dy
        const past = r.ty - (r.ay + r.len) > paramsRef.current.pullDistance
        if (past !== pr.past) { pr.past = past; startTransition(() => setPulling(past)) }
        wake()
    }
    const onPointerUp = (e: any) => {
        const r = ropeRef.current
        const pr = pointer.current
        if (!r.dragging || e.pointerId !== pr.id) return
        r.dragging = false
        pr.id = -1
        if (rootRef.current) rootRef.current.style.cursor = "grab"
        // 한계를 넘겨 당겼다 놓으면 토글, 거의 안 움직인 탭도 토글, 조금만 당겼다 놓으면 그냥 흔들림
        if (pr.past || !pr.moved) toggle(!pr.moved)
        if (pr.past) { pr.past = false; startTransition(() => setPulling(false)) }
        wake()
    }
    const onKeyDown = (e: any) => {
        if (!interactive) return
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault()
            toggle(true)
        }
    }

    // ── 손잡이 그리기 (원점 = 줄 끝, 아래쪽 +y) ──
    const knobColor = on ? knobColorOn : knobColorOff
    const glowFilter = glow && on ? "drop-shadow(0 0 " + Math.round(knobSize * 0.45) + "px " + knobColorOn + ")" : "none"
    const knobScale = pulling ? 1.08 : 1
    const s = knobSize
    const renderKnob = () => {
        switch (knobStyle) {
            case "ball":
                return (
                    <g>
                        <circle cx={0} cy={s / 2} r={s / 2} fill={knobColor} />
                        <circle cx={-s * 0.15} cy={s * 0.32} r={s * 0.18} fill="rgba(255,255,255,0.35)" />
                        <circle cx={0} cy={s / 2} r={s / 2} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
                    </g>
                )
            case "bar":
                return (
                    <g>
                        <rect x={-s * 0.8} y={0} width={s * 1.6} height={s * 0.5} rx={s * 0.25} fill={knobColor} />
                        <rect x={-s * 0.8} y={s * 0.06} width={s * 1.6} height={s * 0.14} rx={s * 0.07} fill="rgba(255,255,255,0.3)" />
                        <rect x={-s * 0.8} y={0} width={s * 1.6} height={s * 0.5} rx={s * 0.25} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
                    </g>
                )
            case "ring":
                return (
                    <g>
                        <circle cx={0} cy={s / 2} r={s / 2 - s * 0.12} fill="none" stroke={knobColor} strokeWidth={s * 0.24} />
                        <circle cx={0} cy={s / 2} r={s / 2 - s * 0.12} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={s * 0.08} strokeDasharray={s * 0.6 + " " + s * 2} />
                    </g>
                )
            case "tassel": {
                const strands = []
                const n = 7
                for (let i = 0; i < n; i++) {
                    const t = (i / (n - 1)) * 2 - 1
                    strands.push(
                        <path key={i} d={"M0 " + s * 0.4 + " Q" + t * s * 0.35 + " " + s * 1.0 + " " + t * s * 0.42 + " " + s * 1.6} fill="none" stroke={knobColor} strokeWidth={Math.max(1.5, s * 0.07)} strokeLinecap="round" />
                    )
                }
                return (
                    <g>
                        <rect x={-s * 0.18} y={0} width={s * 0.36} height={s * 0.42} rx={s * 0.08} fill={knobColor} />
                        <rect x={-s * 0.18} y={s * 0.14} width={s * 0.36} height={s * 0.06} fill="rgba(0,0,0,0.25)" />
                        {strands}
                    </g>
                )
            }
            case "bulb":
                return (
                    <g>
                        <rect x={-s * 0.2} y={0} width={s * 0.4} height={s * 0.3} rx={s * 0.05} fill="#8A8A8F" />
                        <rect x={-s * 0.2} y={s * 0.08} width={s * 0.4} height={s * 0.05} fill="rgba(0,0,0,0.3)" />
                        <rect x={-s * 0.2} y={s * 0.18} width={s * 0.4} height={s * 0.05} fill="rgba(0,0,0,0.3)" />
                        <path d={"M" + -s * 0.2 + " " + s * 0.3 + " L" + -s * 0.28 + " " + s * 0.5 + " A" + s * 0.5 + " " + s * 0.5 + " 0 1 0 " + s * 0.28 + " " + s * 0.5 + " L" + s * 0.2 + " " + s * 0.3 + " Z"} fill={knobColor} />
                        <path d={"M" + -s * 0.12 + " " + s * 0.5 + " Q0 " + s * 0.72 + " " + s * 0.12 + " " + s * 0.5} fill="none" stroke={on ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.15)"} strokeWidth={Math.max(1, s * 0.05)} strokeLinecap="round" />
                        <circle cx={-s * 0.16} cy={s * 0.72} r={s * 0.1} fill="rgba(255,255,255,0.3)" />
                    </g>
                )
            default:
                return null
        }
    }

    // 자바스크립트 실행 전(정적 렌더)에도 곧게 늘어진 줄이 보이도록 초기 경로·위치를 넣어 둔다
    const initialPath = "M" + ax.toFixed(1) + " 0 L" + ax.toFixed(1) + " " + ropeLen.toFixed(1)
    const initialKnob = "translate(" + ax.toFixed(1) + " " + ropeLen.toFixed(1) + ") rotate(0)"
    // ── 줄 스타일별 겹침 선 ──
    const w = Math.max(1, ropeWidth)
    const ropeLayers = (() => {
        if (ropeStyle === "chain") {
            return (
                <>
                    <path ref={pathRef} d={initialPath} fill="none" stroke={ropeColor} strokeOpacity={0.55} strokeWidth={Math.max(1, w * 0.3)} strokeLinecap="round" strokeLinejoin="round" />
                    <path ref={pathRef2} d={initialPath} fill="none" stroke={ropeColor} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={"0.01 " + w * 1.35} />
                    <path ref={pathRef3} d={initialPath} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={w * 0.4} strokeLinecap="round" strokeDasharray={"0.01 " + w * 1.35} strokeDashoffset={w * 0.2} />
                </>
            )
        }
        if (ropeStyle === "cord") {
            return (
                <>
                    <path ref={pathRef} d={initialPath} fill="none" stroke={ropeColor} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
                    <path ref={pathRef2} d={initialPath} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={Math.max(0.8, w * 0.3)} strokeLinecap="round" strokeLinejoin="round" />
                    <path ref={pathRef3} d={initialPath} fill="none" stroke="none" />
                </>
            )
        }
        // rope: 바탕 + 밝은 사선 꼬임 + 어두운 꼬임
        return (
            <>
                <path ref={pathRef} d={initialPath} fill="none" stroke={ropeColor} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
                <path ref={pathRef2} d={initialPath} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={w * 0.55} strokeLinecap="butt" strokeDasharray={w * 0.9 + " " + w * 1.1} />
                <path ref={pathRef3} d={initialPath} fill="none" stroke="rgba(0,0,0,0.22)" strokeWidth={w * 0.55} strokeLinecap="butt" strokeDasharray={w * 0.9 + " " + w * 1.1} strokeDashoffset={w} />
            </>
        )
    })()

    const img = knobImage && knobImage.src ? knobImage : null
    const label = on ? labelOn : labelOff
    const ariaLabel = action === "framer" ? "Toggle dark mode" : "Toggle"

    return (
        <div
            ref={rootRef}
            className="rope-toggle-root"
            role="switch"
            aria-checked={on}
            aria-label={ariaLabel}
            tabIndex={interactive ? 0 : -1}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            style={{
                ...style,
                position: "relative",
                boxSizing: "border-box",
                overflow: "visible",
                touchAction: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: interactive ? "grab" : "default",
                outline: "none",
            }}
        >
            <style>{".rope-toggle-root:focus-visible{outline:2px solid " + knobColorOn + ";outline-offset:4px;border-radius:8px}"}</style>
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", display: "block" }} aria-hidden="true">
                {mount && (
                    <g>
                        <rect x={ax - Math.max(8, w * 2.2)} y={0} width={Math.max(16, w * 4.4)} height={Math.max(5, w * 1.4)} rx={2} fill={knobColorOff} />
                        <rect x={ax - Math.max(8, w * 2.2)} y={0} width={Math.max(16, w * 4.4)} height={Math.max(1.5, w * 0.4)} fill="rgba(255,255,255,0.25)" />
                    </g>
                )}
                {ropeLayers}
                {knobStyle !== "image" && (
                    <g ref={knobRef} transform={initialKnob} style={{ filter: glowFilter, transition: "filter 0.25s ease" }}>
                        <g transform={"scale(" + knobScale + ")"} style={{ transition: "transform 0.15s ease" }}>{renderKnob()}</g>
                    </g>
                )}
            </svg>
            {knobStyle === "image" && (
                <div ref={imgRef} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, pointerEvents: "none", willChange: "transform" }}>
                    <div
                        style={{
                            position: "absolute",
                            left: -s / 2,
                            top: 0,
                            width: s,
                            height: s,
                            borderRadius: "50%",
                            overflow: "hidden",
                            background: knobColor,
                            boxShadow: glow && on ? "0 0 " + Math.round(s * 0.5) + "px " + knobColorOn : "0 1px 3px rgba(0,0,0,0.25)",
                            transform: "scale(" + knobScale + ")",
                            transition: "transform 0.15s ease, box-shadow 0.25s ease, background 0.25s ease",
                        }}
                    >
                        {img && (
                            <img
                                src={img.src}
                                srcSet={img.srcSet}
                                alt={img.alt || ""}
                                draggable={false}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: on ? 1 : 0.75, transition: "opacity 0.25s ease" }}
                            />
                        )}
                    </div>
                </div>
            )}
            {showLabel && (
                <div
                    ref={labelRef}
                    style={{
                        ...font,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: 120,
                        textAlign: "center",
                        color: labelColor,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        willChange: "transform",
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    )
}

RopeToggle.displayName = "Rope Toggle"

addPropertyControls(RopeToggle, {
    knobStyle: {
        type: ControlType.Enum,
        title: "Knob",
        options: ["bulb", "ball", "bar", "ring", "tassel", "image"],
        optionTitles: ["Bulb", "Ball", "Bar", "Ring", "Tassel", "Image"],
        defaultValue: "bulb",
    },
    knobImage: { type: ControlType.ResponsiveImage, title: "Knob Image", hidden: (p: any) => p.knobStyle !== "image" },
    knobSize: { type: ControlType.Number, title: "Knob Size", defaultValue: 36, min: 12, max: 160, step: 1, unit: "px" },
    knobColorOff: { type: ControlType.Color, title: "Knob Off", defaultValue: "#3A3A40" },
    knobColorOn: { type: ControlType.Color, title: "Knob On", defaultValue: "#FFD166" },
    glow: { type: ControlType.Boolean, title: "Glow When On", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    ropeStyle: {
        type: ControlType.Enum,
        title: "Rope",
        options: ["rope", "chain", "cord"],
        optionTitles: ["Rope", "Chain", "Cord"],
        defaultValue: "rope",
        displaySegmentedControl: true,
    },
    ropeColor: { type: ControlType.Color, title: "Rope Color", defaultValue: "#C9B79C" },
    ropeWidth: { type: ControlType.Number, title: "Rope Width", defaultValue: 5, min: 1, max: 16, step: 0.5, unit: "px" },
    ropeMode: {
        type: ControlType.Enum,
        title: "Length",
        options: ["auto", "custom"],
        optionTitles: ["Fill", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    ropeLength: { type: ControlType.Number, title: "Rope Length", defaultValue: 200, min: 20, max: 800, step: 1, unit: "px", hidden: (p: any) => p.ropeMode !== "custom" },
    anchorX: { type: ControlType.Number, title: "Anchor X", defaultValue: 50, min: 0, max: 100, step: 1, unit: "%" },
    mount: { type: ControlType.Boolean, title: "Ceiling Mount", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    pullDistance: { type: ControlType.Number, title: "Pull to Toggle", defaultValue: 40, min: 5, max: 200, step: 1, unit: "px" },
    stretch: { type: ControlType.Number, title: "Stretch", defaultValue: 60, min: 0, max: 200, step: 1, unit: "px" },
    gravity: { type: ControlType.Number, title: "Gravity", defaultValue: 1, min: 0.2, max: 3, step: 0.05 },
    damping: { type: ControlType.Number, title: "Damping", defaultValue: 0.3, min: 0, max: 1, step: 0.05 },
    sound: { type: ControlType.Boolean, title: "Click Sound", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    action: {
        type: ControlType.Enum,
        title: "Controls",
        options: ["framer", "attribute", "none"],
        optionTitles: ["Framer Theme", "HTML Attribute", "Event Only"],
        defaultValue: "framer",
    },
    onIsDark: { type: ControlType.Boolean, title: "On Means", defaultValue: true, enabledTitle: "Dark", disabledTitle: "Light", hidden: (p: any) => p.action !== "framer" },
    attrName: { type: ControlType.String, title: "Attribute", defaultValue: "data-theme", placeholder: "data-theme", hidden: (p: any) => p.action !== "attribute" },
    valueOn: { type: ControlType.String, title: "Value On", defaultValue: "dark", hidden: (p: any) => p.action !== "attribute" },
    valueOff: { type: ControlType.String, title: "Value Off", defaultValue: "light", hidden: (p: any) => p.action !== "attribute" },
    htmlClass: { type: ControlType.String, title: "Class When On", defaultValue: "dark", placeholder: "leave empty to skip", hidden: (p: any) => p.action !== "attribute" },
    start: {
        type: ControlType.Enum,
        title: "Start",
        options: ["off", "on", "system"],
        optionTitles: ["Off", "On", "System"],
        defaultValue: "off",
        displaySegmentedControl: true,
    },
    remember: { type: ControlType.Boolean, title: "Remember", defaultValue: true, enabledTitle: "Yes", disabledTitle: "No" },
    storeKey: { type: ControlType.String, title: "Storage Key", defaultValue: "rope-toggle", hidden: (p: any) => !p.remember },
    showLabel: { type: ControlType.Boolean, title: "Label", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    labelOff: { type: ControlType.String, title: "Label Off", defaultValue: "Light", hidden: (p: any) => !p.showLabel },
    labelOn: { type: ControlType.String, title: "Label On", defaultValue: "Dark", hidden: (p: any) => !p.showLabel },
    labelColor: { type: ControlType.Color, title: "Label Color", defaultValue: "#8A8A8F", hidden: (p: any) => !p.showLabel },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Medium", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
