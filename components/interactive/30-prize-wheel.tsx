// [생성일] 2026-10-18
// [경위] 달러벌기 30번 상품 — Prize Wheel. 손으로 튕겨서(flick) 돌리는 룰렛. 칸마다 라벨·쿠폰 코드·링크·가중치가 있고,
//        멈추면 결과 카드(코드 복사·Claim 링크)를 띄우거나 그 링크로 이동한다. 팝업·이메일 게이트 없는 인라인 섹션용 (유료 $12)
// [변경이력]
//   - 2026-10-18: 최초 생성 (튕겨 돌리기 + 허브 버튼 + Enter/Space, 가중 확률·Force Prize, 플래퍼 포인터 튕김·합성 틱 소리(기본 꺼짐),
//                 결과 카드/링크 열기, 1인 1회(localStorage), Idle Spin(선택), 색종이, 캔버스·정적 렌더는 정지 화면,
//                 reduced-motion 은 즉시 결과, 화면 밖에서는 루프 정지)
//   - 2026-10-31: 프레이머 자동 심사 권고 반영 — outline:none 제거 후 키보드 초점(:focus-visible) 테두리 추가, any 타입을 실제 타입으로 교체

import { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from "react"
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, SyntheticEvent } from "react" // 2026-10-31: 이벤트 핸들러 타입용
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
interface Prize {
    label?: string
    code?: string
    link?: string
    weight?: number
    color?: string
    icon?: { src?: string; srcSet?: string; alt?: string }
}

interface PrizeWheelProps {
    prizes?: Prize[]
    buttonText?: string
    flick?: boolean
    duration?: number
    turns?: number
    onResult?: "card" | "link" | "both"
    newTab?: boolean
    wonText?: string
    copyText?: string
    claimText?: string
    againText?: string
    spins?: "unlimited" | "once"
    storageKey?: string
    forceResult?: number
    idleSpin?: boolean
    idleSpeed?: number
    confetti?: boolean
    sound?: boolean
    previewCard?: boolean
    startAngle?: number
    pointer?: "top" | "right"
    pointerColor?: string
    colors?: string[]
    textMode?: "auto" | "custom"
    textColor?: string
    rimColor?: string
    rimWidth?: number
    rimDots?: boolean
    hubColor?: string
    hubTextColor?: string
    cardColor?: string
    cardTextColor?: string
    accent?: string
    background?: string
    font?: CSSProperties
    cardFont?: CSSProperties
    style?: CSSProperties
}

// 정리된 칸 (렌더·추첨에 쓰는 형태)
interface Seg {
    label: string
    code: string
    link: string
    weight: number
    color: string
    icon: string
}

// 진행 중인 스핀 (rAF 루프가 읽음)
interface Spin {
    a0: number // 시작 각도
    total: number // 돌아갈 총 각도 (절댓값)
    dir: number // +1 시계 / -1 반시계
    T: number // 걸리는 시간(초)
    t: number // 경과 시간
    winner: number
}

// 색종이 조각 (풀)
interface Conf {
    active: boolean
    x: number
    y: number
    vx: number
    vy: number
    a: number
    va: number
    life: number
    el: HTMLElement | null
}

const CONF_POOL = 24
const MAX_SEGS = 16
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect

// 설치 직후 보이는 샘플 칸 (프로모션 룰렛의 전형)
const SAMPLE: Prize[] = [
    { label: "10% OFF", code: "SPIN10", weight: 3 },
    { label: "Free shipping", code: "FREESHIP", weight: 2 },
    { label: "Try again", weight: 4 },
    { label: "20% OFF", code: "SPIN20", weight: 1 },
    { label: "Sticker pack", code: "STICKERS", weight: 2 },
    { label: "Try again", weight: 4 },
    { label: "15% OFF", code: "SPIN15", weight: 2 },
    { label: "Mystery gift", code: "MYSTERY", weight: 1 },
]
const DEFAULT_COLORS = ["#2DE5A0", "#111114", "#FFD166", "#5B5BF6", "#F4F1EA", "#FF8A5B"]

// 색의 밝기(0~1) — 프레이머는 Color 값을 rgb()/rgba() 로 넘기기도 하므로 둘 다 처리
function luminance(color: string): number {
    if (typeof color !== "string") return 0.5
    let r = 0, g = 0, b = 0
    const m = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
    if (m) {
        r = +m[1]; g = +m[2]; b = +m[3]
    } else if (color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("")
        r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16)
    } else return 0.5
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

// 각도를 0~360 으로 정리
function norm(a: number) {
    return ((a % 360) + 360) % 360
}

// 극좌표 → 화면 좌표 (각도는 12시 방향에서 시계 방향, 도 단위)
function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

// 부채꼴 path
function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number) {
    const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1)
    const large = a1 - a0 > 180 ? 1 : 0
    return "M" + cx + " " + cy + " L" + p0.x.toFixed(2) + " " + p0.y.toFixed(2) + " A" + r + " " + r + " 0 " + large + " 1 " + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + " Z"
}

// 포인터 아래에 있는 칸 번호
function segAt(rot: number, pointerDeg: number, span: number, n: number) {
    return Math.min(n - 1, Math.max(0, Math.floor(norm(pointerDeg - rot) / span)))
}

// 가중치 추첨 (전부 0 이면 균등)
function pickWeighted(segs: Seg[], rnd: () => number) {
    let total = 0
    for (const s of segs) total += Math.max(0, s.weight)
    if (total <= 0) return Math.floor(rnd() * segs.length)
    let x = rnd() * total
    for (let i = 0; i < segs.length; i++) {
        x -= Math.max(0, segs[i].weight)
        if (x < 0) return i
    }
    return segs.length - 1
}

// 감속 곡선 (처음 빠르고 끝에서 천천히 멈춤)
function easeOut(p: number) {
    return 1 - Math.pow(1 - p, 3.6)
}

// 합성 효과음 (외부 파일 없음): 경계 통과 "틱", 당첨 "차임"
function playTone(ctxRef: { current: AudioContext | null }, kind: "tick" | "win") {
    const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const AC = g.AudioContext || g.webkitAudioContext
    if (!AC) return
    try {
        const ctx = ctxRef.current || (ctxRef.current = new AC())
        if (ctx.state === "suspended") ctx.resume()
        const t = ctx.currentTime
        if (kind === "tick") {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "triangle"
            osc.frequency.setValueAtTime(1600, t)
            osc.frequency.exponentialRampToValueAtTime(700, t + 0.025)
            gain.gain.setValueAtTime(0.045, t)
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045)
            osc.connect(gain); gain.connect(ctx.destination)
            osc.start(t); osc.stop(t + 0.05)
        } else {
            const notes = [660, 880, 1320]
            for (let i = 0; i < notes.length; i++) {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "sine"
                osc.frequency.setValueAtTime(notes[i], t + i * 0.09)
                gain.gain.setValueAtTime(0.0001, t + i * 0.09)
                gain.gain.exponentialRampToValueAtTime(0.08, t + i * 0.09 + 0.02)
                gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.4)
                osc.connect(gain); gain.connect(ctx.destination)
                osc.start(t + i * 0.09); osc.stop(t + i * 0.09 + 0.42)
            }
        }
    } catch (_) {}
}

/**
 * Prize Wheel — 손으로 튕겨서 돌리는 룰렛. 칸마다 라벨·코드·링크·가중치가 있고, 멈추면 결과 카드를 띄우거나 링크로 이동한다.
 * 캔버스·정적 렌더에서는 Start Angle 에서 정지한 휠만 보여주고, reduced-motion 에서는 스핀 없이 바로 결과를 보여준다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PrizeWheel(props: PrizeWheelProps) {
    const {
        prizes,
        buttonText = "SPIN",
        flick = true,
        duration = 5,
        turns = 5,
        onResult = "card",
        newTab = false,
        wonText = "You won",
        copyText = "Copy code",
        claimText = "Claim",
        againText = "Spin again",
        spins = "unlimited",
        storageKey = "wheel",
        forceResult = 0,
        idleSpin = false,
        idleSpeed = 10,
        confetti = true,
        sound = false,
        previewCard = false,
        startAngle = 0,
        pointer = "top",
        pointerColor = "#111114",
        colors,
        textMode = "auto",
        textColor = "#111114",
        rimColor = "#111114",
        rimWidth = 14,
        rimDots = true,
        hubColor = "#111114",
        hubTextColor = "#FFFFFF",
        cardColor = "#FFFFFF",
        cardTextColor = "#111114",
        accent = "#2DE5A0",
        background = "rgba(0, 0, 0, 0)",
        font = { fontFamily: "Inter", fontWeight: 600, fontSize: 15 },
        cardFont = { fontFamily: "Inter", fontWeight: 500, fontSize: 16 },
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 정지 화면, 상호작용 없음
    const interactive = !isStatic && !isCanvas

    // ── 칸 정리 ──
    const palette = colors && colors.length ? colors : DEFAULT_COLORS
    const segs: Seg[] = useMemo(() => {
        const src = prizes && prizes.length ? prizes : SAMPLE
        return src.slice(0, MAX_SEGS).map((p, i) => ({
            label: (p.label || "").trim() || "Prize " + (i + 1),
            code: (p.code || "").trim(),
            link: (p.link || "").trim(),
            weight: typeof p.weight === "number" ? p.weight : 1,
            color: p.color || palette[i % palette.length],
            icon: p.icon && p.icon.src ? p.icon.src : "",
        }))
    }, [prizes, palette])
    const n = segs.length
    const span = 360 / n
    const pointerDeg = pointer === "right" ? 90 : 0 // 포인터가 가리키는 각도 (12시 = 0)

    // ── 크기: 첫 렌더는 프레이머가 주는 style 숫자(없으면 480), 브라우저에서 ResizeObserver 로 보정 ──
    const sw = style && typeof style.width === "number" ? style.width : 480
    const sh = style && typeof style.height === "number" ? style.height : 480
    const [size, setSize] = useState({ W: sw, H: sh })
    const PAD = 14 // 플래퍼 피벗 여백
    const D = Math.max(80, Math.min(size.W, size.H) - PAD * 2)
    const R = D / 2
    const cx = size.W / 2, cy = size.H / 2
    const rim = Math.max(0, Math.min(rimWidth, R * 0.3))
    const rIn = R - rim // 색 칸의 바깥 반지름
    const hubR = Math.max(18, R * 0.17)

    // ── 상태 ──
    const [live, setLive] = useState(false) // 브라우저 상호작용 단계 (hydration 안전)
    const [result, setResult] = useState<number>(-1) // 카드에 보여줄 당첨 칸
    const [winner, setWinner] = useState<number>(-1) // 강조할 칸
    const [locked, setLocked] = useState(false) // 1인 1회 사용 완료
    const [copied, setCopied] = useState(false)
    const [busy, setBusy] = useState(false) // 스핀 중 (허브 버튼 비활성)
    const rotRef = useRef(norm(startAngle)) // 현재 회전각 (DOM 직접 반영)
    const flapRef = useRef(0) // 플래퍼 기울기(도)
    const spinRef = useRef<Spin | null>(null)
    const rafRef = useRef(0)
    const runningRef = useRef(false)
    const lastRef = useRef(0)
    const inViewRef = useRef(false)
    const reducedRef = useRef(false)
    const audioRef = useRef<AudioContext | null>(null)
    const navTimerRef = useRef(0)
    const copyTimerRef = useRef(0)
    const wheelRef = useRef<HTMLDivElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const flapEl = useRef<SVGGElement>(null)
    const confRefs = useRef<(HTMLElement | null)[]>([])
    const confRef = useRef<Conf[]>([])
    const drag = useRef<{ on: boolean; id: number; a: number; rot: number; samples: { t: number; a: number }[] }>({ on: false, id: -1, a: 0, rot: 0, samples: [] })
    const optsRef = useRef({ segs, span, pointerDeg, duration, turns, onResult, newTab, spins, storageKey, forceResult, idleSpin, idleSpeed, confetti, sound, accent, palette, flick })
    optsRef.current = { segs, span, pointerDeg, duration, turns, onResult, newTab, spins, storageKey, forceResult, idleSpin, idleSpeed, confetti, sound, accent, palette, flick }
    const stateRef = useRef({ result, locked }) // rAF 루프(옛 클로저)가 최신 상태를 읽도록
    stateRef.current = { result, locked }
    const lockedRef = useRef(false) // 1인 1회 잠금 (상태 반영 전에 효과들이 바로 읽도록)

    // ── 그리기 (휠 회전·플래퍼는 상태 대신 DOM 에 직접) ──
    const draw = () => {
        const w = wheelRef.current
        if (w) w.style.transform = "rotate(" + rotRef.current.toFixed(3) + "deg)"
        const f = flapEl.current
        if (f) f.setAttribute("transform", "rotate(" + flapRef.current.toFixed(2) + ")")
        for (const c of confRef.current) {
            if (!c.el) continue
            if (!c.active) { c.el.style.visibility = "hidden"; continue }
            c.el.style.visibility = "visible"
            c.el.style.opacity = String(Math.max(0, Math.min(1, c.life * 2)))
            c.el.style.transform = "translate(" + c.x.toFixed(1) + "px," + c.y.toFixed(1) + "px) rotate(" + c.a.toFixed(2) + "rad)"
        }
    }

    // ── 루프 제어 ──
    const stopLoop = () => {
        runningRef.current = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }
    const wake = () => {
        if (runningRef.current || !interactive || !inViewRef.current || reducedRef.current) return
        runningRef.current = true
        lastRef.current = 0
        rafRef.current = requestAnimationFrame(loop)
    }

    // 색종이 터뜨리기 (포인터 위치에서)
    const burst = () => {
        const o = optsRef.current
        if (!o.confetti || reducedRef.current) return
        const p = polar(cx, cy, R - 4, o.pointerDeg)
        let k = 0
        for (const c of confRef.current) {
            if (c.active) continue
            c.active = true
            c.x = p.x + (Math.random() - 0.5) * 20; c.y = p.y + (Math.random() - 0.5) * 20
            const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
            const sp = 260 + Math.random() * 380
            c.vx = Math.cos(ang) * sp; c.vy = Math.sin(ang) * sp
            c.a = Math.random() * Math.PI; c.va = (Math.random() - 0.5) * 22
            c.life = 0.8 + Math.random() * 0.6
            if (c.el) c.el.style.background = o.palette[k % o.palette.length]
            if (++k >= CONF_POOL) break
        }
    }

    // 스핀 종료 처리: 카드·링크·저장·색종이
    const finish = (i: number) => {
        const o = optsRef.current
        const seg = o.segs[i]
        if (o.sound) playTone(audioRef, "win")
        burst()
        startTransition(() => {
            setWinner(i)
            setBusy(false)
            if (o.onResult !== "link") setResult(i)
        })
        if (o.spins === "once") {
            try {
                const ls = (globalThis as unknown as Window).localStorage
                if (ls) ls.setItem("bu-prize-wheel:" + o.storageKey, JSON.stringify({ i, rot: norm(rotRef.current) }))
            } catch (_) {}
            lockedRef.current = true
            startTransition(() => setLocked(true))
        }
        if ((o.onResult === "link" || o.onResult === "both") && seg && seg.link) {
            const link = seg.link
            const g = globalThis as unknown as Window
            if (navTimerRef.current) clearTimeout(navTimerRef.current)
            navTimerRef.current = setTimeout(() => {
                try {
                    if (o.newTab) g.open(link, "_blank", "noopener")
                    else g.location.href = link
                } catch (_) {}
            }, 900) as unknown as number
        }
    }

    // 스핀 시작: 당첨 칸을 뽑고 목표각을 정한다. dir = 방향, strength = 튕긴 세기(1 = 버튼)
    const startSpin = (dir: number, strength: number) => {
        const o = optsRef.current
        if (spinRef.current || locked || !interactive) return
        const rnd = Math.random
        const forced = Math.round(o.forceResult)
        const winnerIdx = forced >= 1 && forced <= o.segs.length ? forced - 1 : pickWeighted(o.segs, rnd)
        const frac = 0.15 + rnd() * 0.7 // 칸 안 어디에 멈출지 (경계 피함)
        const target = norm(o.pointerDeg - (winnerIdx + frac) * o.span) // 최종 회전각 (mod 360)
        const a0 = rotRef.current
        const nTurns = Math.max(1, Math.round(Math.max(2, o.turns) * strength))
        const rest = dir > 0 ? norm(target - a0) : norm(a0 - target)
        const total = nTurns * 360 + rest
        const T = Math.max(1.6, Math.min(o.duration * 1.6, Math.max(2, o.duration) * (0.65 + 0.35 * strength)))
        startTransition(() => { setWinner(-1); setResult(-1); setCopied(false); setBusy(true) })
        if (reducedRef.current) {
            // 동작 줄이기: 회전 애니메이션 없이 바로 결과
            rotRef.current = norm(a0 + dir * total)
            draw()
            finish(winnerIdx)
            return
        }
        spinRef.current = { a0, total, dir, T, t: 0, winner: winnerIdx }
        wake()
    }

    const loop = (ts: number) => {
        if (!runningRef.current) return
        const o = optsRef.current
        const dt = lastRef.current ? Math.min((ts - lastRef.current) / 1000, 1 / 20) : 1 / 60
        lastRef.current = ts
        let active = false
        const prevRot = rotRef.current // 회전각은 루프 안에서 0~360 으로 접지 않는다 (경계 통과 계산이 연속이어야 함)
        const sp = spinRef.current
        let done = -1
        const st = stateRef.current
        if (sp) {
            sp.t += dt
            const p = Math.min(1, sp.t / sp.T)
            rotRef.current = sp.a0 + sp.dir * sp.total * easeOut(p)
            active = true
            if (p >= 1) {
                spinRef.current = null
                done = sp.winner
            }
        } else if (drag.current.on) {
            active = true
        } else if (o.idleSpin && st.result < 0 && !st.locked) {
            rotRef.current += o.idleSpeed * dt // 천천히 도는 대기 모션
            active = true
        }
        // 경계(못) 통과 수 → 플래퍼 튕김 + 틱 (대기 모션에서는 소리 없음)
        const delta = rotRef.current - prevRot
        if (delta !== 0) {
            const k0 = Math.floor((o.pointerDeg - prevRot) / o.span)
            const k1 = Math.floor((o.pointerDeg - rotRef.current) / o.span)
            if (k1 !== k0) {
                flapRef.current = (delta > 0 ? -1 : 1) * Math.min(32, 18 + Math.abs(delta) * 2)
                if (o.sound && (sp || drag.current.on)) playTone(audioRef, "tick")
            }
        }
        if (done >= 0) {
            rotRef.current = norm(rotRef.current) // 멈춘 뒤에만 0~360 으로 정리 (화면상 같은 각도)
            finish(done)
        }
        if (Math.abs(flapRef.current) > 0.05) {
            flapRef.current += (0 - flapRef.current) * Math.min(1, dt * 14)
            if (Math.abs(flapRef.current) < 0.05) flapRef.current = 0
            else active = true
        }
        for (const c of confRef.current) {
            if (!c.active) continue
            c.vy += 1300 * dt
            c.vx -= c.vx * 1.6 * dt
            c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.va * dt
            c.life -= dt
            if (c.life <= 0 || c.y > size.H + 30) c.active = false
            else active = true
        }
        draw()
        if (!active) { stopLoop(); return }
        rafRef.current = requestAnimationFrame(loop)
    }

    // ── 브라우저에서 상호작용 단계로 전환 (정적 렌더·캔버스는 정지 화면 유지) ──
    useEffect(() => {
        if (!interactive) return
        startTransition(() => setLive(true))
    }, [interactive])

    // ── 크기 측정 ──
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const apply = () => {
            const W = root.clientWidth, H = root.clientHeight
            if (W > 0 && H > 0 && (Math.abs(W - size.W) >= 0.5 || Math.abs(H - size.H) >= 0.5)) startTransition(() => setSize({ W, H }))
        }
        apply()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => apply())
        ro.observe(root)
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.W, size.H])

    // ── 초기화: 색종이 풀, reduced-motion, 1인 1회 저장값 ──
    useIsoLayoutEffect(() => {
        if (!live) return
        const pool: Conf[] = []
        for (let i = 0; i < CONF_POOL; i++) {
            const c: Conf = { active: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, life: 0, el: confRefs.current[i] }
            if (c.el) c.el.style.visibility = "hidden"
            pool.push(c)
        }
        confRef.current = pool
        const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        reducedRef.current = !!(mq && mq.matches)
        rotRef.current = norm(startAngle)
        lockedRef.current = false
        if (spins === "once") {
            try {
                const ls = (globalThis as unknown as Window).localStorage
                const raw = ls ? ls.getItem("bu-prize-wheel:" + storageKey) : null
                if (raw) {
                    const saved = JSON.parse(raw)
                    if (typeof saved.i === "number" && saved.i >= 0 && saved.i < n) {
                        rotRef.current = norm(typeof saved.rot === "number" ? saved.rot : pointerDeg - (saved.i + 0.5) * span)
                        lockedRef.current = true
                        startTransition(() => { setLocked(true); setWinner(saved.i); setResult(onResult === "link" ? -1 : saved.i) })
                    }
                }
            } catch (_) {}
        } else {
            startTransition(() => { setLocked(false) })
        }
        draw()
        return () => stopLoop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live, spins, storageKey, n])

    // Start Angle 을 바꾸면(스핀 중이 아닐 때) 그 각도로
    useEffect(() => {
        if (spinRef.current || lockedRef.current) return
        rotRef.current = norm(startAngle)
        draw()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startAngle, live])

    // ── 화면에 보이는지 감지: 보일 때만 루프, 벗어나면 정지 (마켓 AI 심사 요구사항) ──
    useEffect(() => {
        if (!live) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") {
            inViewRef.current = true
            if (idleSpin) wake()
            return
        }
        const io = new IntersectionObserver((entries) => {
            const visible = entries[0].isIntersecting
            inViewRef.current = visible
            if (visible) wake()
            else stopLoop()
        }, { threshold: 0.1 })
        io.observe(root)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live])

    // Idle Spin 을 켜거나 카드를 닫으면 루프를 깨운다
    useEffect(() => {
        if (!live || !idleSpin) return
        wake()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live, idleSpin, result, locked])

    useEffect(() => () => {
        if (navTimerRef.current) clearTimeout(navTimerRef.current)
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }, [])

    // ── 튕겨서 돌리기 (포인터 각도 추적 → 놓을 때 각속도로 스핀) ──
    const angleOf = (e: { clientX: number; clientY: number }) => {
        const root = rootRef.current
        const rect = root ? root.getBoundingClientRect() : { left: 0, top: 0 }
        const x = e.clientX - rect.left - cx, y = e.clientY - rect.top - cy
        return (Math.atan2(y, x) * 180) / Math.PI
    }
    const onWheelDown = (e: ReactPointerEvent<HTMLElement>) => {
        if (!interactive || !optsRef.current.flick || spinRef.current || locked || result >= 0 || e.button > 0) return
        const d = drag.current
        d.on = true; d.id = e.pointerId; d.a = angleOf(e); d.rot = rotRef.current
        d.samples = [{ t: e.timeStamp || Date.now(), a: 0 }]
        if (e.currentTarget && e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
        }
        wake()
    }
    const onWheelMove = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current
        if (!d.on || d.id !== e.pointerId) return
        let da = angleOf(e) - d.a
        da = ((da + 540) % 360) - 180 // -180~180
        // 누적 회전: 직전 샘플과 연속되게 (한 바퀴 넘김 처리)
        const last = d.samples[d.samples.length - 1]
        let acc = da
        while (acc - last.a > 180) acc -= 360
        while (acc - last.a < -180) acc += 360
        const now = e.timeStamp || Date.now()
        d.samples.push({ t: now, a: acc })
        while (d.samples.length > 2 && now - d.samples[0].t > 110) d.samples.shift()
        rotRef.current = d.rot + acc
        if (!runningRef.current) draw()
    }
    const onWheelUp = (e: ReactPointerEvent<HTMLElement>) => {
        const d = drag.current
        if (!d.on || d.id !== e.pointerId) return
        d.on = false; d.id = -1
        const s = d.samples
        if (s.length >= 2) {
            const first = s[0], last = s[s.length - 1]
            const dtMs = Math.max(8, last.t - first.t)
            const v = ((last.a - first.a) / dtMs) * 1000 // 도/초
            if (Math.abs(v) >= 120) {
                const strength = Math.max(0.6, Math.min(2.2, Math.abs(v) / 900))
                startSpin(v > 0 ? 1 : -1, strength)
                return
            }
        }
        rotRef.current = norm(rotRef.current) // 느리게 놓으면 그 자리에 둔다 (루프는 플래퍼가 잠잠해지면 스스로 멈춤)
    }
    const onHubClick = (e: SyntheticEvent) => {
        e.stopPropagation()
        if (!interactive || locked || result >= 0) return
        startSpin(1, 1)
    }
    const onHubKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault()
            onHubClick(e)
        }
    }
    const onCopy = () => {
        const seg = segs[result]
        if (!seg || !seg.code) return
        const g = globalThis as unknown as Window
        try {
            if (g.navigator && g.navigator.clipboard) g.navigator.clipboard.writeText(seg.code)
        } catch (_) {}
        startTransition(() => setCopied(true))
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
        copyTimerRef.current = setTimeout(() => startTransition(() => setCopied(false)), 1600) as unknown as number
    }
    const onAgain = () => {
        startTransition(() => { setResult(-1); setWinner(-1); setCopied(false) })
    }

    // ── 렌더 ──
    const showCard = result >= 0 || (!interactive && previewCard)
    const cardSeg = result >= 0 ? segs[result] : segs[0]
    const pointerPos = polar(cx, cy, R + 2, pointerDeg)
    const flapLen = Math.max(22, R * 0.16)
    const fontSize = parseFloat(String((font || {}).fontSize)) || 15 // 라벨 길이 추정용 ("15px" 문자열도 처리, 폰트 적용은 통째로 spread)
    const labelIn = hubR + R * 0.12
    const hasAnyIcon = segs.some((s) => !!s.icon)

    const rootStyle: CSSProperties = {
        ...style,
        position: "relative",
        overflow: "hidden",
        background,
        userSelect: "none",
        WebkitUserSelect: "none",
    }

    return (
        <div ref={rootRef} style={rootStyle}>
            {/* 휠 (회전하는 부분) */}
            <div
                ref={wheelRef}
                onPointerDown={live ? onWheelDown : undefined}
                onPointerMove={live ? onWheelMove : undefined}
                onPointerUp={live ? onWheelUp : undefined}
                onPointerCancel={live ? onWheelUp : undefined}
                style={{
                    position: "absolute",
                    left: cx - R,
                    top: cy - R,
                    width: D,
                    height: D,
                    borderRadius: "50%",
                    transform: "rotate(" + norm(startAngle) + "deg)",
                    touchAction: flick && interactive ? "none" : "auto",
                    cursor: flick && interactive && !locked && result < 0 ? "grab" : "default",
                    willChange: "transform",
                }}
            >
                <svg width={D} height={D} viewBox={"0 0 " + D + " " + D} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
                    {/* 테두리 */}
                    <circle cx={R} cy={R} r={R} fill={rimColor} />
                    {/* 칸 */}
                    {segs.map((s, i) => {
                        const a0 = i * span, a1 = (i + 1) * span
                        const mid = a0 + span / 2
                        const isWin = winner === i
                        const tc = textMode === "custom" ? textColor : luminance(s.color) > 0.6 ? "#111114" : "#FFFFFF"
                        const maxLen = (s.icon ? rIn * 0.56 : rIn * 0.9) - labelIn
                        const est = s.label.length * fontSize * 0.56
                        const squeeze = est > maxLen
                        // 아이콘 크기: 칸이 좁아지면(칸 수 증가) 그 반지름에서의 현 길이에 맞춰 줄인다
                        const chord = 2 * rIn * 0.75 * Math.sin(((span / 2) * Math.PI) / 180)
                        const iconR = Math.max(8, Math.min(rIn * 0.14, chord * 0.42))
                        const ip = polar(R, R, rIn * 0.75, mid)
                        return (
                            <g key={i}>
                                <path d={sectorPath(R, R, rIn, a0, a1)} fill={s.color} stroke={rimColor} strokeWidth={Math.max(1, rim * 0.12)} />
                                {isWin && <path d={sectorPath(R, R, rIn, a0, a1)} fill="rgba(255,255,255,0.28)" stroke={accent} strokeWidth={3} />}
                                <text
                                    transform={"rotate(" + (mid - 90) + " " + R + " " + R + ")"}
                                    x={R + labelIn}
                                    y={R}
                                    fill={tc}
                                    dominantBaseline="middle"
                                    textAnchor="start"
                                    style={{ ...font, pointerEvents: "none" }}
                                    textLength={squeeze ? maxLen : undefined}
                                    lengthAdjust={squeeze ? "spacingAndGlyphs" : undefined}
                                >
                                    {s.label}
                                </text>
                                {s.icon && (
                                    <image
                                        href={s.icon}
                                        x={ip.x - iconR}
                                        y={ip.y - iconR}
                                        width={iconR * 2}
                                        height={iconR * 2}
                                        preserveAspectRatio="xMidYMid slice"
                                        style={{ clipPath: "circle(50%)" }}
                                        transform={"rotate(" + mid + " " + ip.x + " " + ip.y + ")"}
                                    />
                                )}
                            </g>
                        )
                    })}
                    {/* 테두리 점(못) */}
                    {rimDots && rim >= 6 && segs.map((_, i) => {
                        const p = polar(R, R, R - rim / 2, i * span)
                        return <circle key={"d" + i} cx={p.x} cy={p.y} r={Math.min(5, rim * 0.28)} fill={luminance(rimColor) > 0.6 ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.75)"} />
                    })}
                </svg>
            </div>

            {/* 허브 버튼 (실제 button — 키보드·스크린리더) */}
            <button
                type="button"
                onClick={live ? onHubClick : undefined}
                onKeyDown={live ? onHubKey : undefined}
                onPointerDown={(e) => e.stopPropagation()}
                disabled={!interactive || locked || busy}
                aria-label={buttonText || "Spin the wheel"}
                style={{
                    position: "absolute",
                    left: cx - hubR,
                    top: cy - hubR,
                    width: hubR * 2,
                    height: hubR * 2,
                    borderRadius: "50%",
                    border: "none",
                    background: hubColor,
                    color: hubTextColor,
                    ...font,
                    fontSize: Math.min(fontSize, hubR * 0.42),
                    letterSpacing: "0.06em",
                    cursor: interactive && !locked && !busy ? "pointer" : "default",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.25), inset 0 0 0 3px rgba(255,255,255,0.18)",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outlineOffset: 3,
                }}
            >
                {buttonText}
            </button>

            {/* 플래퍼 포인터 (못을 지날 때 튕김) */}
            <svg
                width={size.W}
                height={size.H}
                viewBox={"0 0 " + size.W + " " + size.H}
                style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }}
                aria-hidden="true"
            >
                <g transform={"translate(" + pointerPos.x + " " + pointerPos.y + ") rotate(" + pointerDeg + ")"}>
                    <g ref={flapEl}>
                        <path
                            d={"M-" + (flapLen * 0.42) + " -4 L" + (flapLen * 0.42) + " -4 L0 " + flapLen + " Z"}
                            fill={pointerColor}
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth={1.5}
                            strokeLinejoin="round"
                        />
                        <circle cx={0} cy={-2} r={flapLen * 0.22} fill={pointerColor} stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} />
                    </g>
                </g>
            </svg>

            {/* 색종이 풀 */}
            {interactive && confetti && Array.from({ length: CONF_POOL }).map((_, i) => (
                <div
                    key={"c" + i}
                    ref={(el) => { confRefs.current[i] = el }}
                    style={{ position: "absolute", left: 0, top: 0, width: 7, height: 11, borderRadius: 2, visibility: "hidden", pointerEvents: "none", background: palette[i % palette.length] }}
                />
            ))}

            {/* 결과 카드 */}
            {showCard && cardSeg && (
                <div
                    role="dialog"
                    aria-live="polite"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: Math.min(size.W - 32, Math.max(220, D * 0.68)),
                        background: cardColor,
                        color: cardTextColor,
                        ...cardFont,
                        borderRadius: 18,
                        padding: "22px 20px 18px",
                        boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
                        textAlign: "center",
                        boxSizing: "border-box",
                    }}
                >
                    {interactive && (
                        <button
                            type="button"
                            onClick={locked ? () => startTransition(() => setResult(-1)) : onAgain}
                            aria-label="Close"
                            style={{ position: "absolute", right: 10, top: 8, border: "none", background: "transparent", color: cardTextColor, opacity: 0.55, fontSize: 18, cursor: "pointer", lineHeight: 1, padding: 4 }}
                        >
                            ×
                        </button>
                    )}
                    <div style={{ opacity: 0.6, fontSize: "0.8em", letterSpacing: "0.08em", textTransform: "uppercase" }}>{wonText}</div>
                    <div style={{ fontSize: "1.5em", fontWeight: 700, marginTop: 6, lineHeight: 1.15 }}>{cardSeg.label}</div>
                    {cardSeg.code && (
                        <button
                            type="button"
                            onClick={interactive ? onCopy : undefined}
                            style={{
                                marginTop: 14,
                                border: "1px dashed " + accent,
                                background: "rgba(0,0,0,0.04)",
                                color: cardTextColor,
                                borderRadius: 10,
                                padding: "10px 14px",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                fontSize: "1em",
                                letterSpacing: "0.08em",
                                cursor: "pointer",
                                width: "100%",
                            }}
                        >
                            {cardSeg.code}
                            <span style={{ display: "block", fontFamily: "inherit", fontSize: "0.7em", opacity: 0.6, marginTop: 4, letterSpacing: 0 }}>{copied ? "Copied" : copyText}</span>
                        </button>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "center", flexWrap: "wrap" }}>
                        {cardSeg.link && (
                            <a
                                href={cardSeg.link}
                                target={newTab ? "_blank" : undefined}
                                rel={newTab ? "noopener noreferrer" : undefined}
                                style={{ background: accent, color: luminance(accent) > 0.6 ? "#111114" : "#FFFFFF", textDecoration: "none", borderRadius: 999, padding: "10px 18px", fontWeight: 600, fontSize: "0.95em" }}
                            >
                                {claimText}
                            </a>
                        )}
                        {interactive && !locked && (
                            <button
                                type="button"
                                onClick={onAgain}
                                style={{ ...cardFont, background: "transparent", color: cardTextColor, border: "1px solid rgba(128,128,140,0.4)", borderRadius: 999, padding: "10px 18px", fontWeight: 500, fontSize: "0.95em", cursor: "pointer" }}
                            >
                                {againText}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// 캔버스 우측 패널 속성 (중요도순)
addPropertyControls(PrizeWheel, {
    prizes: {
        type: ControlType.Array,
        title: "Prizes",
        maxCount: MAX_SEGS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Prize" },
                code: { type: ControlType.String, title: "Code", placeholder: "Coupon code (optional)" },
                link: { type: ControlType.Link, title: "Link" },
                weight: { type: ControlType.Number, title: "Weight", defaultValue: 1, min: 0, max: 10, step: 1 },
                color: { type: ControlType.Color, title: "Color", optional: true },
                icon: { type: ControlType.ResponsiveImage, title: "Icon" },
            },
        },
        defaultValue: SAMPLE,
    },
    buttonText: { type: ControlType.String, title: "Button", defaultValue: "SPIN" },
    flick: { type: ControlType.Boolean, title: "Flick", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    duration: { type: ControlType.Number, title: "Spin Time", defaultValue: 5, min: 2, max: 12, step: 0.5, unit: "s" },
    turns: { type: ControlType.Number, title: "Min Turns", defaultValue: 5, min: 2, max: 12, step: 1 },
    onResult: {
        type: ControlType.Enum,
        title: "On Result",
        options: ["card", "link", "both"],
        optionTitles: ["Show Card", "Open Link", "Card + Link"],
        defaultValue: "card",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "Links Open",
        defaultValue: false,
        enabledTitle: "New Tab",
        disabledTitle: "Same Tab",
    },
    wonText: { type: ControlType.String, title: "Won Text", defaultValue: "You won", hidden: (p: PrizeWheelProps) => p.onResult === "link" },
    copyText: { type: ControlType.String, title: "Copy Text", defaultValue: "Copy code", hidden: (p: PrizeWheelProps) => p.onResult === "link" },
    claimText: { type: ControlType.String, title: "Claim Text", defaultValue: "Claim", hidden: (p: PrizeWheelProps) => p.onResult === "link" },
    againText: { type: ControlType.String, title: "Again Text", defaultValue: "Spin again", hidden: (p: PrizeWheelProps) => p.onResult === "link" || p.spins === "once" },
    spins: {
        type: ControlType.Enum,
        title: "Spins",
        options: ["unlimited", "once"],
        optionTitles: ["Unlimited", "Once per visitor"],
        defaultValue: "unlimited",
    },
    storageKey: { type: ControlType.String, title: "Storage Key", defaultValue: "wheel", hidden: (p: PrizeWheelProps) => p.spins !== "once" },
    forceResult: { type: ControlType.Number, title: "Force Prize", defaultValue: 0, min: 0, max: MAX_SEGS, step: 1 },
    idleSpin: { type: ControlType.Boolean, title: "Idle Spin", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    idleSpeed: { type: ControlType.Number, title: "Idle Speed", defaultValue: 10, min: 2, max: 60, step: 1, unit: "°/s", hidden: (p: PrizeWheelProps) => !p.idleSpin },
    confetti: { type: ControlType.Boolean, title: "Confetti", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    sound: { type: ControlType.Boolean, title: "Sound", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    previewCard: { type: ControlType.Boolean, title: "Preview Card", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    startAngle: { type: ControlType.Number, title: "Start Angle", defaultValue: 0, min: 0, max: 359, step: 1, unit: "°" },
    pointer: {
        type: ControlType.Enum,
        title: "Pointer",
        options: ["top", "right"],
        optionTitles: ["Top", "Right"],
        defaultValue: "top",
        displaySegmentedControl: true,
    },
    pointerColor: { type: ControlType.Color, title: "Pointer Color", defaultValue: "#111114" },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        maxCount: MAX_SEGS,
    },
    textMode: {
        type: ControlType.Enum,
        title: "Text",
        options: ["auto", "custom"],
        optionTitles: ["Auto", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#111114", hidden: (p: PrizeWheelProps) => p.textMode !== "custom" },
    rimColor: { type: ControlType.Color, title: "Rim", defaultValue: "#111114" },
    rimWidth: { type: ControlType.Number, title: "Rim Width", defaultValue: 14, min: 0, max: 40, step: 1, unit: "px" },
    rimDots: { type: ControlType.Boolean, title: "Rim Dots", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    hubColor: { type: ControlType.Color, title: "Hub", defaultValue: "#111114" },
    hubTextColor: { type: ControlType.Color, title: "Hub Text", defaultValue: "#FFFFFF" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF" },
    cardTextColor: { type: ControlType.Color, title: "Card Text", defaultValue: "#111114" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#2DE5A0" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif", // 프레이머 typecheck — Font 기본값에 fontFamily 불가 (23·24번과 같은 형식)
        defaultValue: { fontSize: "15px", variant: "Semibold" },
    },
    cardFont: {
        type: ControlType.Font,
        title: "Card Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "16px", variant: "Medium" },
        description: "Created by BrandingUp",
    },
})
