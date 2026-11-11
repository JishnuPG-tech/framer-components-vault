// [생성일] 2026-10-16
// [경위] 달러벌기 22번 상품 — Plinko Links. 탭하면 공이 떨어져 못(peg)에 튕기며 내려가 라벨이 붙은 칸(bin)에 들어가는
//        플린코 보드. 칸은 링크가 될 수 있어 "공이 들어간 페이지로 이동" 같은 놀이형 내비게이션·히어로 장난감으로 쓴다 (무료 상품)
// [변경이력]
//   - 2026-10-16: 최초 생성 (외부 라이브러리 없는 자체 원형 물리: 못·칸막이·벽·공끼리 충돌, 탭해서 떨어뜨리기·잡아 던지기,
//                 공 자동 낙하·시작 공·최대 공 수 재사용, 칸 점등·집계·색종이·합성 효과음(기본 꺼짐), 칸 링크(점등만 / 열기),
//                 Enter/Space 로 떨어뜨리기, 캔버스·정적 렌더·reduced-motion 은 정착된 공만 표시, 화면 밖·정착 시 루프 정지)

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
interface Bin {
    label?: string
    link?: string
    color?: string
}

interface PlinkoLinksProps {
    bins?: Bin[]
    rows?: number
    ballSize?: number
    ballStyle?: "solid" | "image"
    ballImage?: { src?: string; srcSet?: string; alt?: string }
    ballColors?: string[]
    startBalls?: number
    maxBalls?: number
    autoDrop?: boolean
    autoEvery?: number
    drag?: boolean
    landAction?: "highlight" | "open"
    newTab?: boolean
    confetti?: boolean
    showCount?: boolean
    sound?: boolean
    hint?: string
    gravity?: number
    bounce?: number
    pegStyle?: "dot" | "ring" | "diamond"
    pegSize?: number
    pegColor?: string
    pegHitColor?: string
    lineColor?: string
    binColor?: string
    binLitColor?: string
    binDepth?: number
    textMode?: "auto" | "custom"
    textColor?: string
    background?: string
    font?: any
    style?: CSSProperties
}

// 공 하나 (풀에서 재사용 — React 상태를 거치지 않고 DOM 에 직접 그린다)
interface Ball {
    id: number // 생성 순번 (가장 오래된 공부터 재사용)
    active: boolean
    x: number
    y: number
    vx: number
    vy: number
    r: number
    ci: number // 색 번호
    held: boolean
    sleep: boolean
    still: number
    landed: boolean // 칸 영역에 들어왔는지 (한 번만 점등·집계)
    bin: number
    user: boolean // 사람이 떨어뜨린 공인지 (링크 열기는 이 공만)
    lx: number
    ly: number
    el: HTMLElement | null
}

// 못 하나 (고정) — hit 는 맞았을 때 1 에서 0 으로 줄어드는 점등값
interface Peg {
    x: number
    y: number
    hit: number
    el: SVGGElement | null
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
    ci: number
    el: HTMLElement | null
}

// 보드 치수 (렌더마다 계산)
interface Layout {
    W: number
    H: number
    M: number // 칸 수
    binW: number
    pegTop: number
    pegBottom: number
    divTop: number // 칸막이 윗끝
    floorY: number // 칸 바닥 (라벨 띠 위)
    pr: number // 못 반지름
    r: number // 공 반지름 (칸 너비에 맞게 자름)
    rows: number
}

interface PhysParams {
    gravity: number
    bounce: number
}

type Ev = { type: "peg"; i: number } | { type: "land"; b: Ball }

interface World {
    balls: Ball[]
    pegs: Peg[]
    conf: Conf[]
    L: Layout
    t: number
    quiet: number
    run: number
    px: number
    py: number
    rnd: () => number
    events: Ev[]
    queue: { t: number; x: number; user: boolean }[] // 예약된 낙하
    nextAuto: number
    litUntil: number[] // 칸별 점등 종료 시각
    counts: number[]
    nextId: number
}

const MAX_POOL = 24
const CONF_POOL = 60
const SUB = 1 / 240
const DIV_T = 1.5 // 칸막이 절반 두께
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect

// 설치 직후 보이는 샘플 칸
const SAMPLE: Bin[] = [
    { label: "Branding" },
    { label: "Web Design" },
    { label: "Motion" },
    { label: "Strategy" },
    { label: "Say hi" },
]
const DEFAULT_COLORS = ["#2DE5A0", "#5B5BF6", "#FFD166", "#FF6B6B", "#F4F1EA"]

// 같은 입력이면 같은 결과가 나오도록 시드 난수 (캔버스 썸네일이 매번 바뀌지 않게)
function makeRandom(seed: number) {
    let s = seed >>> 0 || 1
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

// 보드 치수 계산 — 못 줄은 아래에서 위로: 맨 아랫줄은 칸막이 위에, 그 위는 칸 가운데 위에 번갈아 (깔때기 모양)
function computeLayout(W: number, H: number, M: number, rows: number, ballSize: number, pegSize: number, binDepth: number, labelH: number): Layout {
    const binW = W / Math.max(1, M)
    const r = Math.max(4, Math.min(ballSize / 2, binW * 0.42))
    const pr = Math.max(1.5, pegSize / 2)
    const floorY = Math.max(r * 2 + 20, H - labelH)
    const divTop = Math.max(r * 2 + 10, floorY - binDepth)
    const pegTop = r * 2.2 + 8
    const pegBottom = Math.max(pegTop + 10, divTop - r * 1.4)
    return { W, H, M, binW, pegTop, pegBottom, divTop, floorY, pr, r, rows: Math.max(1, Math.round(rows)) }
}

function makePegs(L: Layout): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = []
    const sy = L.rows > 1 ? (L.pegBottom - L.pegTop) / (L.rows - 1) : 0
    for (let k = 0; k < L.rows; k++) {
        const y = L.pegBottom - sy * k
        const dividerRow = k % 2 === 0 // 아래에서 짝수 번째 줄 = 칸막이 위
        if (dividerRow) {
            for (let i = 1; i < L.M; i++) out.push({ x: i * L.binW, y })
        } else {
            for (let i = 0; i < L.M; i++) out.push({ x: (i + 0.5) * L.binW, y })
        }
    }
    return out
}

// 공 vs 고정된 점(못·칸막이 가장 가까운 점) 충돌 — 위치 보정 + 반발. jitter 는 못 정중앙에 얹혀 멈추는 것을 막는 작은 흔들림
function hitPoint(b: Ball, px: number, py: number, minDist: number, p: PhysParams, friction: number, jitter: number, rnd: () => number) {
    const dx = b.x - px, dy = b.y - py
    const d = Math.hypot(dx, dy)
    if (d >= minDist) return false
    let nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1
    if (jitter > 0) {
        nx += (rnd() - 0.5) * jitter
        const nl = Math.hypot(nx, ny) || 1
        nx /= nl; ny /= nl
    }
    const pen = minDist - d
    b.x += nx * pen; b.y += ny * pen
    const vn = b.vx * nx + b.vy * ny
    if (vn < 0) {
        const vt = -b.vx * ny + b.vy * nx
        const vn2 = -vn * (Math.abs(vn) < 60 ? 0 : p.bounce) // 느린 접촉은 튀지 않게
        const vt2 = vt * (1 - friction)
        b.vx = vn2 * nx - vt2 * ny
        b.vy = vn2 * ny + vt2 * nx
    }
    return true
}

// 공끼리 (잠든 공·잡힌 공은 질량 무한)
function hitBalls(A: Ball, B: Ball, p: PhysParams) {
    const dx = B.x - A.x, dy = B.y - A.y
    const d = Math.hypot(dx, dy)
    const min = A.r + B.r
    if (d >= min) return
    const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : -1
    const rvx = B.vx - A.vx, rvy = B.vy - A.vy
    const vn = rvx * nx + rvy * ny
    if (vn < -80) {
        if (A.sleep) { A.sleep = false; A.still = 0 }
        if (B.sleep) { B.sleep = false; B.still = 0 }
    }
    const iA = A.sleep || A.held ? 0 : 1, iB = B.sleep || B.held ? 0 : 1
    const inv = iA + iB
    if (inv === 0) return
    const corr = Math.max(min - d - 0.3, 0) / inv
    A.x -= nx * corr * iA; A.y -= ny * corr * iA
    B.x += nx * corr * iB; B.y += ny * corr * iB
    if (vn > 0) return
    const e = Math.abs(vn) < 60 ? 0 : p.bounce
    const j = (-(1 + e) * vn) / inv
    A.vx -= j * nx * iA; A.vy -= j * ny * iA
    B.vx += j * nx * iB; B.vy += j * ny * iB
}

// 물리 한 스텝
function step(w: World, dt: number, p: PhysParams, interactive: boolean) {
    const { balls, pegs, L } = w
    const g = p.gravity * 1600
    for (let i = 0; i < balls.length; i++) {
        const b = balls[i]
        if (!b.active || b.sleep) continue
        if (b.held && interactive) {
            // 잡힌 공은 포인터 쪽으로 스프링처럼 끌려감 (놓으면 그 속도로 날아감)
            b.vx += ((w.px - b.x) * 500 - b.vx * 28) * dt
            b.vy += ((w.py - b.y) * 500 - b.vy * 28) * dt
        } else {
            b.vy += g * dt
        }
        b.vx -= b.vx * 0.1 * dt; b.vy -= b.vy * 0.1 * dt
        const sp = Math.hypot(b.vx, b.vy)
        if (sp > 3000) { b.vx *= 3000 / sp; b.vy *= 3000 / sp }
        b.x += b.vx * dt; b.y += b.vy * dt
    }
    for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < balls.length; i++) {
            const b = balls[i]
            if (!b.active) continue
            // 공끼리
            for (let j = i + 1; j < balls.length; j++) {
                const o = balls[j]
                if (!o.active || (b.sleep && o.sleep)) continue
                hitBalls(b, o, p)
            }
            if (b.sleep) continue
            // 못 (칸 영역 위에 있을 때만)
            if (b.y - b.r < L.divTop) {
                for (let k = 0; k < pegs.length; k++) {
                    const pg = pegs[k]
                    if (Math.abs(pg.x - b.x) > b.r + L.pr + 1 || Math.abs(pg.y - b.y) > b.r + L.pr + 1) continue
                    if (hitPoint(b, pg.x, pg.y, b.r + L.pr, p, 0.05, 0.08, w.rnd) && iter === 0 && Math.hypot(b.vx, b.vy) > 40) {
                        if (pg.hit < 0.3) w.events.push({ type: "peg", i: k })
                        pg.hit = 1
                    }
                }
            }
            // 칸막이 (세로 선분: 가장 가까운 점과 원 충돌 — 윗끝은 자연히 둥근 캡)
            if (b.y + b.r > L.divTop) {
                const k0 = Math.max(1, Math.floor((b.x - b.r - DIV_T) / L.binW))
                const k1 = Math.min(L.M - 1, Math.ceil((b.x + b.r + DIV_T) / L.binW))
                for (let k = k0; k <= k1; k++) {
                    const cx = k * L.binW
                    const cy = Math.max(L.divTop, Math.min(L.floorY, b.y))
                    hitPoint(b, cx, cy, b.r + DIV_T, p, 0.1, 0, w.rnd)
                }
            }
            // 벽·바닥
            if (b.x - b.r < 0) { b.x = b.r; if (b.vx < 0) b.vx = -b.vx * p.bounce }
            if (b.x + b.r > L.W) { b.x = L.W - b.r; if (b.vx > 0) b.vx = -b.vx * p.bounce }
            if (b.y + b.r > L.floorY) {
                b.y = L.floorY - b.r
                if (b.vy > 0) b.vy = Math.abs(b.vy) < 90 ? 0 : -b.vy * p.bounce
                b.vx -= b.vx * Math.min(1, 6 * dt) // 바닥 마찰
            }
            // 칸에 들어옴 → 한 번만 알림
            if (!b.landed && !b.held && b.y > L.divTop + b.r * 0.5) {
                b.landed = true
                b.bin = Math.max(0, Math.min(L.M - 1, Math.floor(b.x / L.binW)))
                w.events.push({ type: "land", b })
            }
        }
    }
    w.t += dt
}

// 공을 꺼내 떨어뜨린다 (풀이 가득 차면 가장 오래된 공을 재사용)
function spawn(w: World, x: number, user: boolean, ci: number): Ball | null {
    const L = w.L
    let b: Ball | null = null
    for (const o of w.balls) if (!o.active) { b = o; break }
    if (!b) {
        for (const o of w.balls) if (!o.held && (!b || o.id < b.id)) b = o
    }
    if (!b) return null
    b.id = w.nextId++
    b.active = true
    b.x = Math.max(L.r + 1, Math.min(L.W - L.r - 1, x))
    b.y = -L.r
    b.vx = 0; b.vy = 0
    b.r = L.r
    b.ci = ci
    b.held = false; b.sleep = false; b.still = 0
    b.landed = false; b.bin = -1; b.user = user
    b.lx = b.x; b.ly = b.y
    w.quiet = 0; w.run = 0
    return b
}

// 애니메이션 없이 정착될 때까지 한 번에 계산 (캔버스·정적 렌더·reduced-motion 용)
function settleNow(w: World, p: PhysParams) {
    for (let i = 0; i < 2400; i++) {
        step(w, SUB, p, false)
        let moving = false
        for (const b of w.balls) if (b.active && (Math.abs(b.vx) > 2 || Math.abs(b.vy) > 2 || b.y < w.L.divTop)) { moving = true; break }
        if (!moving && i > 240) break
    }
    for (const b of w.balls) if (b.active) { b.vx = 0; b.vy = 0; b.sleep = true }
    for (const pg of w.pegs) pg.hit = 0
}

function newBall(): Ball {
    return { id: 0, active: false, x: 0, y: 0, vx: 0, vy: 0, r: 10, ci: 0, held: false, sleep: false, still: 0, landed: false, bin: -1, user: false, lx: 0, ly: 0, el: null }
}

function makeWorld(L: Layout, seed: number): World {
    return {
        balls: [], pegs: makePegs(L).map((p) => ({ x: p.x, y: p.y, hit: 0, el: null })), conf: [], L, t: 0, quiet: 0, run: 0, px: 0, py: 0,
        rnd: makeRandom(seed), events: [], queue: [], nextAuto: 0, litUntil: [], counts: [], nextId: 1,
    }
}

// 정적 화면용: n 개의 공이 칸에 정착한 위치 (순수 계산, 브라우저 API 없음 → 서버·브라우저 결과 동일)
function restingBalls(L: Layout, n: number, colors: number, p: PhysParams): Ball[] {
    if (n <= 0) return []
    const w = makeWorld(L, Math.round(L.W * 31 + L.H * 7 + n * 101 + L.rows))
    for (let i = 0; i < n; i++) {
        const b = newBall()
        b.active = true
        b.r = L.r
        b.x = L.r + 4 + w.rnd() * Math.max(1, L.W - L.r * 2 - 8)
        b.y = -L.r - i * (L.r * 2.4) // 겹치지 않게 위로 줄 세워 한 번에 떨어뜨림
        b.ci = i % Math.max(1, colors)
        b.lx = b.x; b.ly = b.y
        w.balls.push(b)
    }
    settleNow(w, p)
    w.events.length = 0
    return w.balls
}

// 합성 효과음 (외부 파일 없음): 못에 맞으면 짧은 "틱", 칸에 들어가면 "딩"
function playTone(ctxRef: { current: any }, kind: "tick" | "ding") {
    const g: any = globalThis as any
    const AC = g.AudioContext || g.webkitAudioContext
    if (!AC) return
    try {
        const ctx = ctxRef.current || (ctxRef.current = new AC())
        if (ctx.state === "suspended" && ctx.resume) ctx.resume()
        const t = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        if (kind === "tick") {
            osc.type = "triangle"
            osc.frequency.setValueAtTime(1400 + Math.random() * 400, t)
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.03)
            gain.gain.setValueAtTime(0.05, t)
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
            osc.stop(t + 0.06)
        } else {
            osc.type = "sine"
            osc.frequency.setValueAtTime(880, t)
            osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08)
            gain.gain.setValueAtTime(0.09, t)
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
            osc.stop(t + 0.36)
        }
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
    } catch (_) {}
}

/**
 * Plinko Links — 탭하면 공이 떨어져 못에 튕기며 내려가 라벨 달린 칸에 들어간다. 칸은 링크가 될 수 있고,
 * 공을 잡아 던질 수도 있다. 캔버스·정적 렌더·reduced-motion 에서는 정착된 공만 보여준다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 640
 * @framerIntrinsicHeight 560
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PlinkoLinks(props: PlinkoLinksProps) {
    const {
        bins,
        rows = 8,
        ballSize = 22,
        ballStyle = "solid",
        ballImage,
        ballColors,
        startBalls = 3,
        maxBalls = 12,
        autoDrop = false,
        autoEvery = 2,
        drag = true,
        landAction = "highlight",
        newTab = false,
        confetti = true,
        showCount = false,
        sound = false,
        hint = "Tap to drop",
        gravity = 1,
        bounce = 0.5,
        pegStyle = "dot",
        pegSize = 8,
        pegColor = "#B8B8C4",
        pegHitColor = "#2DE5A0",
        lineColor = "rgba(128, 128, 140, 0.5)",
        binColor = "rgba(128, 128, 140, 0.12)",
        binLitColor = "#2DE5A0",
        binDepth = 56,
        textMode = "auto",
        textColor = "#111114",
        background = "rgba(0, 0, 0, 0)",
        font = { fontFamily: "Inter", fontWeight: 500, fontSize: 14 },
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 정착된 공만, 상호작용 없음
    const interactive = !isStatic && !isCanvas

    const list = useMemo(() => {
        const src = bins && bins.length ? bins : SAMPLE
        return src.slice(0, 12).map((b) => ({ label: (b.label || "").trim() || "Bin", link: b.link || "", color: b.color || "" }))
    }, [bins])
    const palette = ballColors && ballColors.length ? ballColors : DEFAULT_COLORS
    const pool = Math.max(1, Math.min(MAX_POOL, Math.round(maxBalls)))
    const nStart = Math.max(0, Math.min(pool, Math.round(startBalls)))
    const params: PhysParams = { gravity: Math.max(0.1, gravity), bounce: Math.max(0, Math.min(0.95, bounce)) }

    // 크기: 첫 렌더는 프레이머가 주는 style 의 숫자 크기(없으면 기본 640×560), 브라우저에서 ResizeObserver 로 보정
    const sw = style && typeof style.width === "number" ? style.width : 640
    const sh = style && typeof style.height === "number" ? style.height : 560
    const [size, setSize] = useState({ W: sw, H: sh })
    const [labelH, setLabelH] = useState(40)
    const [live, setLive] = useState(false) // 브라우저에서 물리 단계로 전환 (hydration 안전)

    const L = useMemo(
        () => computeLayout(size.W, size.H, list.length, rows, ballSize, pegSize, binDepth, labelH),
        [size.W, size.H, list.length, rows, ballSize, pegSize, binDepth, labelH]
    )
    const pegPts = useMemo(() => makePegs(L), [L])
    // 캔버스·정적 렌더·첫 렌더용 정착 공
    const staticBalls = useMemo(() => (live ? [] : restingBalls(L, nStart, palette.length, params)), [L, nStart, palette.length, live, params.gravity, params.bounce])

    const rootRef = useRef<HTMLDivElement>(null)
    const stripRef = useRef<HTMLDivElement>(null)
    const hintRef = useRef<HTMLDivElement>(null)
    const ballRefs = useRef<(HTMLElement | null)[]>([])
    const confRefs = useRef<(HTMLElement | null)[]>([])
    const pegRefs = useRef<(SVGGElement | null)[]>([])
    const binRefs = useRef<(HTMLElement | null)[]>([])
    const countRefs = useRef<(HTMLElement | null)[]>([])
    const worldRef = useRef<World>(makeWorld(L, 1))
    const paramsRef = useRef(params)
    paramsRef.current = params
    const optsRef = useRef({ autoDrop, autoEvery, drag, landAction, newTab, confetti, sound, palette, pegColor, pegHitColor, binColor, binLitColor, list, showCount })
    optsRef.current = { autoDrop, autoEvery, drag, landAction, newTab, confetti, sound, palette, pegColor, pegHitColor, binColor, binLitColor, list, showCount }

    const rafRef = useRef(0)
    const runningRef = useRef(false)
    const lastRef = useRef(0)
    const accRef = useRef(0)
    const inViewRef = useRef(false)
    const startedRef = useRef(false) // 시작 공을 떨어뜨렸는지
    const reducedRef = useRef(false)
    const heldRef = useRef<Ball | null>(null)
    const zTopRef = useRef(10) // 잡은 공을 맨 앞으로 — 풀의 초기 z-index(1)보다 항상 큼
    const audioRef = useRef<any>(null)
    const lastTickRef = useRef(0)
    const tapRef = useRef({ x: 0, y: 0, t: 0, id: -1 })
    const navTimerRef = useRef(0)

    // ── 그리기 (DOM 직접 반영) ──
    const draw = () => {
        const w = worldRef.current
        const o = optsRef.current
        for (const b of w.balls) {
            if (!b.el) continue
            if (!b.active) { b.el.style.visibility = "hidden"; continue }
            b.el.style.visibility = "visible"
            b.el.style.transform = "translate(" + (b.x - b.r) + "px," + (b.y - b.r) + "px)"
        }
        for (let i = 0; i < w.pegs.length; i++) {
            const pg = w.pegs[i]
            if (!pg.el) continue
            const s = 1 + pg.hit * 0.35
            pg.el.setAttribute("transform", "translate(" + pg.x + " " + pg.y + ") scale(" + s.toFixed(3) + ")")
            pg.el.style.color = pg.hit > 0.02 ? o.pegHitColor : o.pegColor
        }
        for (const c of w.conf) {
            if (!c.el) continue
            if (!c.active) { c.el.style.visibility = "hidden"; continue }
            c.el.style.visibility = "visible"
            c.el.style.opacity = String(Math.max(0, Math.min(1, c.life * 2)))
            c.el.style.transform = "translate(" + c.x + "px," + c.y + "px) rotate(" + c.a + "rad)"
        }
    }

    // ── 루프 제어 ──
    const stopLoop = () => {
        runningRef.current = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }
    const wake = () => {
        // reduced-motion 에서는 애니메이션 루프를 절대 돌리지 않는다 (낙하는 즉시 정착으로 처리)
        if (runningRef.current || !interactive || !inViewRef.current || reducedRef.current) return
        runningRef.current = true
        lastRef.current = 0
        accRef.current = 0
        worldRef.current.quiet = 0
        rafRef.current = requestAnimationFrame(loop)
    }
    const spawnBall = (x: number, user: boolean) => {
        const w = worldRef.current
        const o = optsRef.current
        const b = spawn(w, x, user, Math.floor(w.rnd() * o.palette.length))
        if (!b) return
        if (b.el) {
            b.el.style.width = b.r * 2 + "px"
            b.el.style.height = b.r * 2 + "px"
            b.el.style.zIndex = "1"
            const fill = o.palette[b.ci % o.palette.length]
            b.el.style.background = "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0) 48%), " + fill
        }
        if (user && hintRef.current) hintRef.current.style.opacity = "0"
        if (reducedRef.current) {
            // 동작 줄이기: 애니메이션 없이 바로 칸에 넣는다
            settleNow(w, paramsRef.current)
            handleEvents(w)
            draw()
            return
        }
        wake()
    }
    // 이벤트 처리: 못 점등음, 칸 점등·집계·색종이·링크 열기
    const handleEvents = (w: World) => {
        const o = optsRef.current
        for (const ev of w.events) {
            if (ev.type === "peg") {
                if (o.sound && w.t - lastTickRef.current > 0.04) { lastTickRef.current = w.t; playTone(audioRef, "tick") }
                continue
            }
            const b = ev.b
            const i = b.bin
            w.counts[i] = (w.counts[i] || 0) + 1
            w.litUntil[i] = w.t + 1.2
            const el = binRefs.current[i]
            if (el) el.style.background = o.binLitColor
            const ce = countRefs.current[i]
            if (ce) ce.textContent = String(w.counts[i])
            if (o.sound) playTone(audioRef, "ding")
            if (o.confetti && !reducedRef.current) {
                const cx = (i + 0.5) * w.L.binW, cy = w.L.divTop
                let n = 0
                for (const c of w.conf) {
                    if (c.active) continue
                    c.active = true
                    c.x = cx + (w.rnd() - 0.5) * w.L.binW * 0.5; c.y = cy
                    const ang = -Math.PI / 2 + (w.rnd() - 0.5) * 1.6
                    const sp = 250 + w.rnd() * 350
                    c.vx = Math.cos(ang) * sp; c.vy = Math.sin(ang) * sp
                    c.a = w.rnd() * Math.PI; c.va = (w.rnd() - 0.5) * 20
                    c.life = 0.7 + w.rnd() * 0.5
                    c.ci = Math.floor(w.rnd() * o.palette.length)
                    if (c.el) c.el.style.background = o.palette[c.ci % o.palette.length]
                    if (++n >= 14) break
                }
            }
            const bin = o.list[i]
            if (b.user && o.landAction === "open" && bin && bin.link) {
                const link = bin.link
                const g: any = globalThis as any
                if (navTimerRef.current) clearTimeout(navTimerRef.current)
                navTimerRef.current = setTimeout(() => {
                    try {
                        if (o.newTab) g.open(link, "_blank", "noopener")
                        else g.location.href = link
                    } catch (_) {}
                }, 650) as unknown as number
            }
        }
        w.events.length = 0
    }
    const loop = (ts: number) => {
        if (!runningRef.current) return
        const w = worldRef.current
        const o = optsRef.current
        const dtFrame = lastRef.current ? Math.min((ts - lastRef.current) / 1000, 1 / 30) : 1 / 60
        lastRef.current = ts
        accRef.current += dtFrame
        let n = 0
        while (accRef.current >= SUB && n < 8) {
            step(w, SUB, paramsRef.current, true)
            accRef.current -= SUB
            n++
        }
        // 예약 낙하·자동 낙하
        while (w.queue.length && w.t >= w.queue[0].t) {
            const q = w.queue.shift() as { x: number; user: boolean }
            spawnBall(q.x, q.user)
        }
        if (o.autoDrop) {
            if (w.t >= w.nextAuto) {
                w.nextAuto = w.t + Math.max(0.3, o.autoEvery)
                spawnBall(w.L.r + 4 + w.rnd() * Math.max(1, w.L.W - w.L.r * 2 - 8), false)
            }
        }
        handleEvents(w)
        // 못 점등 감쇠, 칸 점등 종료, 색종이
        let busy = false
        for (const pg of w.pegs) {
            if (pg.hit > 0) { pg.hit = Math.max(0, pg.hit - dtFrame * 3); busy = true }
        }
        for (let i = 0; i < w.litUntil.length; i++) {
            if (w.litUntil[i] > 0) {
                if (w.t >= w.litUntil[i]) {
                    w.litUntil[i] = 0
                    const el = binRefs.current[i]
                    if (el) el.style.background = o.list[i] && o.list[i].color ? o.list[i].color : o.binColor
                } else busy = true
            }
        }
        for (const c of w.conf) {
            if (!c.active) continue
            c.vy += 1400 * dtFrame
            c.vx -= c.vx * 1.5 * dtFrame
            c.x += c.vx * dtFrame; c.y += c.vy * dtFrame; c.a += c.va * dtFrame
            c.life -= dtFrame
            if (c.life <= 0 || c.y > w.L.H + 20) c.active = false
            else busy = true
        }
        // 정착 판정: 이동량 기준 (접촉 떨림 때문에 속도 대신 실제 이동량)
        let maxMove = 0
        for (const b of w.balls) {
            if (!b.active) continue
            const mv = Math.max(Math.abs(b.x - b.lx), Math.abs(b.y - b.ly))
            maxMove = Math.max(maxMove, mv)
            if (!b.sleep && !b.held) {
                if (mv < 0.3 && b.landed) b.still++
                else b.still = 0
                if (b.still > 30) { b.sleep = true; b.vx = 0; b.vy = 0 }
            }
            b.lx = b.x; b.ly = b.y
        }
        draw()
        const idle = !heldRef.current && !w.queue.length && !(o.autoDrop && inViewRef.current)
        if (idle && maxMove < 0.08) w.quiet++
        else w.quiet = 0
        w.run += dtFrame
        if (idle && !busy && (w.quiet > 40 || w.run > 40)) {
            for (const b of w.balls) if (b.active) { b.sleep = true; b.vx = 0; b.vy = 0 }
            draw()
            stopLoop()
            return
        }
        rafRef.current = requestAnimationFrame(loop)
    }

    // ── 브라우저에서 물리 단계로 전환 (정적 렌더·캔버스는 정착 화면 유지) ──
    useEffect(() => {
        if (!interactive) return
        startTransition(() => setLive(true))
    }, [interactive])

    // ── 크기·라벨 띠 높이 측정 ──
    useIsoLayoutEffect(() => {
        const root = rootRef.current
        if (!root) return
        const apply = () => {
            const W = root.clientWidth, H = root.clientHeight
            const lh = stripRef.current ? stripRef.current.offsetHeight : 40
            if (W > 0 && H > 0 && (Math.abs(W - size.W) >= 0.5 || Math.abs(H - size.H) >= 0.5)) startTransition(() => setSize({ W, H }))
            if (lh > 0 && Math.abs(lh - labelH) >= 0.5) startTransition(() => setLabelH(lh))
        }
        apply()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => apply())
        ro.observe(root)
        if (stripRef.current) ro.observe(stripRef.current)
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size.W, size.H, labelH, font, list.length])

    // ── 월드 초기화 (물리 단계에서 치수가 바뀔 때마다: 공은 비우고 시작 공을 다시 예약) ──
    useIsoLayoutEffect(() => {
        if (!live) return
        stopLoop()
        const w = makeWorld(L, Math.round(L.W * 31 + L.H * 7 + nStart * 101 + L.rows))
        for (let i = 0; i < pool; i++) {
            const b = newBall()
            b.el = ballRefs.current[i]
            if (b.el) b.el.style.visibility = "hidden"
            w.balls.push(b)
        }
        for (let i = 0; i < CONF_POOL; i++) {
            const c: Conf = { active: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, life: 0, ci: 0, el: confRefs.current[i] }
            if (c.el) c.el.style.visibility = "hidden"
            w.conf.push(c)
        }
        for (let i = 0; i < w.pegs.length; i++) w.pegs[i].el = pegRefs.current[i]
        for (let i = 0; i < L.M; i++) { w.litUntil[i] = 0; w.counts[i] = 0 }
        for (let i = 0; i < L.M; i++) {
            const ce = countRefs.current[i]
            if (ce) ce.textContent = "0"
            const el = binRefs.current[i]
            if (el) el.style.background = list[i] && list[i].color ? list[i].color : binColor
        }
        worldRef.current = w
        heldRef.current = null
        const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        reducedRef.current = !!(mq && mq.matches)
        startedRef.current = false
        // 시작 공: 보일 때 차례로 떨어뜨림 (reduced-motion 이면 바로 정착)
        const queueStart = () => {
            for (let i = 0; i < nStart; i++) {
                w.queue.push({ t: w.t + 0.12 * i, x: L.r + 4 + w.rnd() * Math.max(1, L.W - L.r * 2 - 8), user: false })
            }
        }
        if (reducedRef.current) {
            queueStart()
            while (w.queue.length) { const q = w.queue.shift() as { x: number }; spawn(w, q.x, false, Math.floor(w.rnd() * palette.length)) }
            for (const b of w.balls) if (b.active && b.el) {
                b.el.style.width = b.r * 2 + "px"; b.el.style.height = b.r * 2 + "px"; b.el.style.zIndex = "1"
                b.el.style.background = "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0) 48%), " + palette[b.ci % palette.length]
            }
            settleNow(w, paramsRef.current)
            handleEvents(w)
            startedRef.current = true
            draw()
            return
        }
        draw()
        if (inViewRef.current) {
            startedRef.current = true
            queueStart()
            wake()
        }
        return () => stopLoop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live, L, pool, nStart])

    // ── 화면에 보이는지 감지: 보일 때만 재생, 벗어나면 정지 (마켓 AI 심사 요구사항) ──
    useEffect(() => {
        if (!live) return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") {
            inViewRef.current = true
            return
        }
        const io = new IntersectionObserver((entries) => {
            const visible = entries[0].isIntersecting
            inViewRef.current = visible
            const w = worldRef.current
            if (visible) {
                if (!startedRef.current && !reducedRef.current) {
                    startedRef.current = true
                    for (let i = 0; i < nStart; i++) {
                        w.queue.push({ t: w.t + 0.12 * i, x: w.L.r + 4 + w.rnd() * Math.max(1, w.L.W - w.L.r * 2 - 8), user: false })
                    }
                }
                w.nextAuto = w.t + 0.4
                wake()
            } else stopLoop()
        }, { threshold: 0.15 })
        io.observe(root)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live])

    // ── Auto Drop 이 켜지면 바로 루프를 깨운다 ──
    useEffect(() => {
        if (!live || !autoDrop) return
        worldRef.current.nextAuto = worldRef.current.t + 0.3
        wake()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [live, autoDrop])

    // ── 포인터 이동: 잡은 공이 따라오도록 (창 전체에서 감지) ──
    useEffect(() => {
        if (!live) return
        const win: any = typeof globalThis !== "undefined" ? globalThis : null
        if (!win || !win.addEventListener) return
        const onMove = (e: PointerEvent) => {
            const root = rootRef.current
            if (!root) return
            const rect = root.getBoundingClientRect()
            const w = worldRef.current
            w.px = e.clientX - rect.left; w.py = e.clientY - rect.top
        }
        win.addEventListener("pointermove", onMove, { passive: true })
        return () => {
            win.removeEventListener("pointermove", onMove)
            if (navTimerRef.current) clearTimeout(navTimerRef.current)
        }
    }, [live])

    // ── 보드 탭 → 공 떨어뜨리기 (누른 뒤 8px·400ms 안에 떼면 탭, 라벨 띠는 제외) ──
    const localXY = (e: any) => {
        const root = rootRef.current
        const rect = root ? root.getBoundingClientRect() : { left: 0, top: 0 }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onBoardDown = (e: any) => {
        if (!interactive || e.button > 0) return
        const { x, y } = localXY(e)
        if (y >= worldRef.current.L.floorY) return
        tapRef.current = { x, y, t: e.timeStamp || Date.now(), id: e.pointerId }
    }
    const onBoardUp = (e: any) => {
        const tp = tapRef.current
        if (tp.id !== e.pointerId) return
        tp.id = -1
        const { x, y } = localXY(e)
        const dt = (e.timeStamp || Date.now()) - tp.t
        if (Math.hypot(x - tp.x, y - tp.y) > 8 || dt > 400) return
        spawnBall(x, true)
    }
    const onKeyDown = (e: any) => {
        if (!interactive) return
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
            e.preventDefault()
            const w = worldRef.current
            spawnBall(w.L.r + 4 + w.rnd() * Math.max(1, w.L.W - w.L.r * 2 - 8), true)
        }
    }

    // ── 공 잡기·던지기 ──
    const onBallDown = (e: any, i: number) => {
        e.stopPropagation()
        if (!interactive || !optsRef.current.drag || reducedRef.current || e.button > 0) return
        const w = worldRef.current
        const b = w.balls[i]
        if (!b || !b.active) return
        const { x, y } = localXY(e)
        w.px = x; w.py = y
        b.held = true; b.sleep = false; b.still = 0
        heldRef.current = b
        if (b.el) {
            b.el.style.zIndex = String(++zTopRef.current)
            b.el.style.cursor = "grabbing"
        }
        if (e.currentTarget && e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
        }
        wake()
    }
    const onBallUp = (e: any) => {
        e.stopPropagation()
        const b = heldRef.current
        if (b) {
            b.held = false
            // 잡은 채 칸 밖으로 꺼냈으면 다시 들어갈 때 점등되도록 초기화
            if (b.y + b.r < worldRef.current.L.divTop) { b.landed = false; b.user = true }
            heldRef.current = null
            if (b.el) b.el.style.cursor = "grab"
        }
        wake()
    }

    // ── 스타일 ──
    const binFill = (i: number) => (list[i].color ? list[i].color : binColor)
    const img = ballStyle === "image" && ballImage && ballImage.src ? ballImage : null
    const ballBase: CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        borderRadius: "50%",
        boxSizing: "border-box",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        overflow: "hidden",
        willChange: "transform",
        zIndex: 1,
    }
    const ballFill = (ci: number) => "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0) 48%), " + palette[ci % palette.length]

    const renderPegShape = () => {
        const pr = L.pr
        if (pegStyle === "ring") return <circle r={pr} fill="none" stroke="currentColor" strokeWidth={Math.max(1, pr * 0.55)} />
        if (pegStyle === "diamond") return <rect x={-pr} y={-pr} width={pr * 2} height={pr * 2} rx={pr * 0.2} fill="currentColor" transform="rotate(45)" />
        return <circle r={pr} fill="currentColor" />
    }

    return (
        <div
            ref={rootRef}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? "Plinko board. Press Enter to drop a ball" : "Plinko board"}
            tabIndex={interactive ? 0 : -1}
            onPointerDown={onBoardDown}
            onPointerUp={onBoardUp}
            onKeyDown={onKeyDown}
            style={{
                ...style,
                ...font,
                position: "relative",
                overflow: "hidden",
                background,
                boxSizing: "border-box",
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "pan-y", // 빈 곳에서는 세로 스크롤 허용, 탭만 낙하
                cursor: interactive ? "pointer" : "default",
                outline: "none",
            }}
        >
            {/* 못·칸막이·바닥 (SVG) */}
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, display: "block", pointerEvents: "none", overflow: "visible" }} aria-hidden="true">
                {Array.from({ length: Math.max(0, L.M - 1) }).map((_, i) => (
                    <line key={"d" + i} x1={(i + 1) * L.binW} y1={L.divTop} x2={(i + 1) * L.binW} y2={L.floorY} stroke={lineColor} strokeWidth={DIV_T * 2} strokeLinecap="round" />
                ))}
                <line x1={0} y1={L.floorY} x2={L.W} y2={L.floorY} stroke={lineColor} strokeWidth={DIV_T * 2} />
                {pegPts.map((p, i) => (
                    <g
                        key={"p" + i}
                        ref={(el) => { pegRefs.current[i] = el }}
                        transform={"translate(" + p.x + " " + p.y + ") scale(1)"}
                        style={{ color: pegColor }}
                    >
                        {renderPegShape()}
                    </g>
                ))}
            </svg>

            {/* 칸 배경 (점등 영역) */}
            {list.map((b, i) => (
                <div
                    key={"b" + i}
                    ref={(el) => { binRefs.current[i] = el }}
                    style={{
                        position: "absolute",
                        left: i * L.binW + DIV_T,
                        top: L.divTop,
                        width: Math.max(0, L.binW - DIV_T * 2),
                        height: Math.max(0, L.floorY - L.divTop),
                        background: binFill(i),
                        transition: "background 0.35s ease",
                        borderRadius: "6px 6px 0 0",
                        pointerEvents: "none",
                    }}
                />
            ))}

            {/* 안내 문구 */}
            {hint ? (
                <div
                    ref={hintRef}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: Math.max(12, L.pegTop - L.pr - 2), // 첫 못 줄 위 빈 공간에 세로 가운데
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        opacity: 0.6,
                        transition: "opacity 0.4s ease",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    {hint}
                </div>
            ) : null}

            {/* 공: 물리 단계에서는 풀(재사용), 정적·캔버스에서는 정착 위치 */}
            {live
                ? Array.from({ length: pool }).map((_, i) => (
                      <div
                          key={"ball" + i}
                          ref={(el) => { ballRefs.current[i] = el }}
                          onPointerDown={(e) => onBallDown(e, i)}
                          onPointerUp={onBallUp}
                          onPointerCancel={onBallUp}
                          onDragStart={(e) => e.preventDefault()}
                          style={{ ...ballBase, visibility: "hidden", width: L.r * 2, height: L.r * 2, cursor: drag ? "grab" : "default", touchAction: "none" }}
                      >
                          {img ? <img src={img.src} srcSet={img.srcSet} alt={img.alt || ""} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }} /> : null}
                      </div>
                  ))
                : staticBalls.map((b, i) => (
                      <div
                          key={"sball" + i}
                          style={{ ...ballBase, width: b.r * 2, height: b.r * 2, transform: "translate(" + (b.x - b.r) + "px," + (b.y - b.r) + "px)", background: img ? undefined : ballFill(b.ci) }}
                      >
                          {img ? <img src={img.src} srcSet={img.srcSet} alt={img.alt || ""} draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : null}
                      </div>
                  ))}

            {/* 색종이 풀 */}
            {live && confetti
                ? Array.from({ length: CONF_POOL }).map((_, i) => (
                      <div
                          key={"c" + i}
                          ref={(el) => { confRefs.current[i] = el }}
                          style={{ position: "absolute", left: -3, top: -5, width: 6, height: 10, borderRadius: 1, visibility: "hidden", pointerEvents: "none", willChange: "transform", zIndex: 0 }}
                      />
                  ))
                : null}

            {/* 라벨 띠 (링크가 있으면 <a>) */}
            <div
                ref={stripRef}
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "stretch", zIndex: 2 }}
            >
                {list.map((b, i) => {
                    const inner = (
                        <>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.label}</span>
                            <span
                                ref={(el) => { countRefs.current[i] = el }}
                                style={{ display: showCount ? "inline-block" : "none", minWidth: "1.4em", padding: "0 0.3em", borderRadius: 999, fontSize: "0.8em", lineHeight: 1.6, background: binLitColor, color: luminance(binLitColor) > 0.6 ? "#111114" : "#FFFFFF", textAlign: "center" }}
                            >
                                0
                            </span>
                        </>
                    )
                    const common: any = {
                        key: "l" + i,
                        style: {
                            flex: "1 1 0",
                            minWidth: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "10px 6px",
                            textAlign: "center",
                            color: textMode === "custom" ? textColor : "inherit",
                            textDecoration: "none",
                            cursor: b.link && interactive ? "pointer" : "default",
                            boxSizing: "border-box",
                        } as CSSProperties,
                        onPointerDown: (e: any) => e.stopPropagation(),
                        onPointerUp: (e: any) => e.stopPropagation(),
                    }
                    return b.link ? (
                        <a {...common} href={b.link} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined}>
                            {inner}
                        </a>
                    ) : (
                        <div {...common}>{inner}</div>
                    )
                })}
            </div>
        </div>
    )
}

PlinkoLinks.displayName = "Plinko Links"

addPropertyControls(PlinkoLinks, {
    bins: {
        type: ControlType.Array,
        title: "Bins",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "New bin" },
                link: { type: ControlType.Link, title: "Link" },
                color: { type: ControlType.Color, title: "Color", optional: true },
            },
        },
        defaultValue: SAMPLE,
    },
    rows: { type: ControlType.Number, title: "Peg Rows", defaultValue: 8, min: 1, max: 14, step: 1 },
    ballSize: { type: ControlType.Number, title: "Ball Size", defaultValue: 22, min: 10, max: 60, step: 1, unit: "px" },
    ballStyle: {
        type: ControlType.Enum,
        title: "Ball",
        options: ["solid", "image"],
        optionTitles: ["Color", "Image"],
        defaultValue: "solid",
        displaySegmentedControl: true,
    },
    ballImage: { type: ControlType.ResponsiveImage, title: "Ball Image", hidden: (p: any) => p.ballStyle !== "image" },
    ballColors: {
        type: ControlType.Array,
        title: "Ball Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        maxCount: 12,
    },
    startBalls: { type: ControlType.Number, title: "Start Balls", defaultValue: 3, min: 0, max: 12, step: 1 },
    maxBalls: { type: ControlType.Number, title: "Max Balls", defaultValue: 12, min: 1, max: MAX_POOL, step: 1 },
    autoDrop: { type: ControlType.Boolean, title: "Auto Drop", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    autoEvery: { type: ControlType.Number, title: "Every", defaultValue: 2, min: 0.3, max: 10, step: 0.1, unit: "s", hidden: (p: any) => !p.autoDrop },
    drag: { type: ControlType.Boolean, title: "Grab & Throw", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    landAction: {
        type: ControlType.Enum,
        title: "On Land",
        options: ["highlight", "open"],
        optionTitles: ["Highlight", "Open Link"],
        defaultValue: "highlight",
        displaySegmentedControl: true,
    },
    newTab: { type: ControlType.Boolean, title: "Links Open", defaultValue: false, enabledTitle: "New Tab", disabledTitle: "Same Tab" },
    confetti: { type: ControlType.Boolean, title: "Confetti", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    showCount: { type: ControlType.Boolean, title: "Count", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    sound: { type: ControlType.Boolean, title: "Sound", defaultValue: false, enabledTitle: "On", disabledTitle: "Off" },
    hint: { type: ControlType.String, title: "Hint", defaultValue: "Tap to drop", placeholder: "leave empty to hide" },
    gravity: { type: ControlType.Number, title: "Gravity", defaultValue: 1, min: 0.2, max: 3, step: 0.05 },
    bounce: { type: ControlType.Number, title: "Bounce", defaultValue: 0.5, min: 0, max: 0.95, step: 0.05 },
    pegStyle: {
        type: ControlType.Enum,
        title: "Peg",
        options: ["dot", "ring", "diamond"],
        optionTitles: ["Dot", "Ring", "Diamond"],
        defaultValue: "dot",
        displaySegmentedControl: true,
    },
    pegSize: { type: ControlType.Number, title: "Peg Size", defaultValue: 8, min: 3, max: 20, step: 1, unit: "px" },
    pegColor: { type: ControlType.Color, title: "Peg Color", defaultValue: "#B8B8C4" },
    pegHitColor: { type: ControlType.Color, title: "Peg Hit", defaultValue: "#2DE5A0" },
    lineColor: { type: ControlType.Color, title: "Lines", defaultValue: "rgba(128, 128, 140, 0.5)" },
    binColor: { type: ControlType.Color, title: "Bin", defaultValue: "rgba(128, 128, 140, 0.12)" },
    binLitColor: { type: ControlType.Color, title: "Bin Lit", defaultValue: "#2DE5A0" },
    binDepth: { type: ControlType.Number, title: "Bin Depth", defaultValue: 56, min: 24, max: 240, step: 1, unit: "px" },
    textMode: {
        type: ControlType.Enum,
        title: "Text",
        options: ["auto", "custom"],
        optionTitles: ["Inherit", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#111114", hidden: (p: any) => p.textMode !== "custom" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Medium", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
