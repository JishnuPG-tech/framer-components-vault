// [생성일] 2026-10-14
// [경위] 달러벌기 16번 상품 — Physics Tag Pile. 포트폴리오 스킬·서비스 태그가 중력으로 떨어져 쌓이고, 잡아서 던질 수 있는 컴포넌트 (무료, 트래픽 유도용)
// [변경이력]
//   - 2026-10-14: 최초 생성 (외부 라이브러리 없는 자체 캡슐 물리, 태그 링크, 커서 밀어내기, 낙하 스타일 3종,
//                 캔버스·정적 렌더·reduced-motion 에서는 정착된 더미만 표시, 화면 밖에서는 정지)
//   - 2026-10-14: Keep Readable·Max Tilt 추가 — 프리뷰에서 태그가 거꾸로·세로로 정착해 가독성이 나빠지는 문제.
//                 회전을 ±Max Tilt 안으로 스프링 복원(잡고 있는 동안은 자유), 잠들 때 한계 안으로 스냅

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
interface Tag {
    label?: string
    link?: string
    featured?: boolean
}

interface PhysicsTagPileProps {
    tags?: Tag[]
    trigger?: "load" | "view"
    replay?: boolean
    dropStyle?: "rain" | "pour" | "burst"
    gravity?: number
    bounce?: number
    friction?: number
    stagger?: number
    drag?: boolean
    cursorPush?: boolean
    keepReadable?: boolean
    maxTilt?: number
    newTab?: boolean
    colors?: string[]
    featuredColor?: string
    textMode?: "auto" | "custom"
    textColor?: string
    borderWidth?: number
    borderColor?: string
    radius?: number
    paddingX?: number
    paddingY?: number
    background?: string
    font?: any
    style?: CSSProperties
}

// 물리 몸체 하나 = 태그 하나 (캡슐: 중심 선분 길이 2*hl + 반지름 r)
interface Body {
    x: number
    y: number
    a: number // 각도(rad)
    vx: number
    vy: number
    va: number // 각속도
    w: number
    h: number
    hl: number // 선분 절반 길이
    r: number // 캡슐 반지름 (= 높이/2)
    invM: number
    invI: number
    active: boolean // 아직 안 떨어진 태그는 false
    delay: number // 낙하 시작 시각(초)
    held: boolean
    gx: number // 잡은 지점 (몸체 기준 좌표)
    gy: number
    lx: number // 직전 프레임 위치 (정착 판정용 — 접촉 떨림 때문에 속도 대신 실제 이동량을 본다)
    ly: number
    la: number
    still: number // 거의 안 움직인 연속 프레임 수
    sleep: boolean // 잠든 몸체: 중력·이동 없음, 충돌에서는 벽처럼 취급 (깊은 더미의 영구 떨림 방지)
    el: HTMLElement | null
}

// 물리 설정값 (렌더마다 ref 에 갱신, 프레임마다 읽음)
interface PhysParams {
    gravity: number
    bounce: number
    friction: number
    maxTilt: number // 허용 기울기(rad). 음수면 제한 없음 (Keep Readable Off)
}

// 각도를 -π~π 로 감는다
function wrapAngle(a: number) {
    return a - Math.PI * 2 * Math.round(a / (Math.PI * 2))
}

// Keep Readable: 허용 기울기 안으로 각도를 자른다
function clampTilt(a: number, maxTilt: number) {
    if (maxTilt < 0) return a
    const wa = wrapAngle(a)
    return Math.max(-maxTilt, Math.min(maxTilt, wa))
}

interface World {
    bodies: Body[]
    W: number
    H: number
    t: number // 시뮬레이션 시각(초)
    quiet: number // 연속으로 조용했던 프레임 수
    calm: number // 연속으로 거의 조용했던 프레임 수 (안전망)
    run: number // 이번에 깨어난 뒤 흐른 시간(초) — 30초 넘으면 강제 정착 (최후 안전망)
    px: number // 포인터 위치 (컴포넌트 기준)
    py: number
}

const MAX_TAGS = 60
const SUB = 1 / 240 // 물리 한 스텝 (초) — 한 프레임을 4번으로 쪼개 안정화
// 서버 렌더에서는 useLayoutEffect 경고가 나므로 브라우저에서만 layout effect 사용
const useIsoLayoutEffect = typeof document !== "undefined" ? useLayoutEffect : useEffect
const WALL = { x: 0, y: 0, vx: 0, vy: 0, va: 0, invM: 0, invI: 0 } // 벽·바닥 (움직이지 않는 몸체)

// 설치 직후 보이는 샘플 태그
const SAMPLE: Tag[] = [
    { label: "Brand Strategy", featured: true },
    { label: "UI Design" },
    { label: "Framer", featured: true },
    { label: "Webflow" },
    { label: "Motion" },
    { label: "Illustration" },
    { label: "Typography" },
    { label: "React" },
    { label: "Figma" },
    { label: "Art Direction" },
    { label: "Copywriting" },
    { label: "SEO" },
    { label: "Prototyping" },
    { label: "Design Systems" },
    { label: "3D" },
    { label: "No-code" },
    { label: "Photography" },
    { label: "Pitch Decks" },
]

const DEFAULT_COLORS = ["#111114", "#2DE5A0", "#F4F1EA", "#5B5BF6", "#FFD166"]

// 같은 입력이면 항상 같은 더미가 되도록 시드 난수 사용 (캔버스 썸네일이 매번 바뀌지 않게)
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

// 두 선분 사이 가장 가까운 두 점 (Ericson, Real-Time Collision Detection)
function closestSegSeg(p1x: number, p1y: number, q1x: number, q1y: number, p2x: number, p2y: number, q2x: number, q2y: number, out: number[]) {
    const d1x = q1x - p1x, d1y = q1y - p1y
    const d2x = q2x - p2x, d2y = q2y - p2y
    const rx = p1x - p2x, ry = p1y - p2y
    const a = d1x * d1x + d1y * d1y
    const e = d2x * d2x + d2y * d2y
    const f = d2x * rx + d2y * ry
    let s = 0, t = 0
    const EPS = 1e-8
    if (a <= EPS && e <= EPS) {
        s = 0; t = 0
    } else if (a <= EPS) {
        s = 0; t = Math.max(0, Math.min(1, f / e))
    } else {
        const c = d1x * rx + d1y * ry
        if (e <= EPS) {
            t = 0; s = Math.max(0, Math.min(1, -c / a))
        } else {
            const b = d1x * d2x + d1y * d2y
            const denom = a * e - b * b
            s = denom !== 0 ? Math.max(0, Math.min(1, (b * f - c * e) / denom)) : 0
            t = (b * s + f) / e
            if (t < 0) {
                t = 0; s = Math.max(0, Math.min(1, -c / a))
            } else if (t > 1) {
                t = 1; s = Math.max(0, Math.min(1, (b - c) / a))
            }
        }
    }
    out[0] = p1x + d1x * s; out[1] = p1y + d1y * s
    out[2] = p2x + d2x * t; out[3] = p2y + d2y * t
}

// 잠든 몸체를 깨우고, 맞닿아 있는 이웃까지 연쇄로 깨운다 (받치고 있던 태그가 빠지면 위 태그도 떨어져야 하므로)
function wakeBody(w: World, b: Body) {
    if (!b.sleep && b.still === 0) return
    const stack = [b]
    b.sleep = false; b.still = 0
    while (stack.length) {
        const a = stack.pop() as Body
        for (const o of w.bodies) {
            if (!o.active || (!o.sleep && o.still === 0)) continue
            const reach = a.hl + a.r + o.hl + o.r + 6
            if ((o.x - a.x) ** 2 + (o.y - a.y) ** 2 > reach * reach) continue
            o.sleep = false; o.still = 0
            stack.push(o)
        }
    }
}

// 충돌 해결: 위치 보정 + 반발(바운스) 충격량 + 마찰 충격량 (B 가 벽이면 invM=0 이라 A 만 움직임)
function resolve(w: World, A: Body, B: any, Px: number, Py: number, nx: number, ny: number, pen: number, p: PhysParams) {
    // 접촉점 기준 상대 속도 (잠든 몸체 깨우기 판단에 먼저 필요)
    const rax = Px - A.x, ray = Py - A.y
    const rbx = Px - B.x, rby = Py - B.y
    const vax = A.vx - A.va * ray, vay = A.vy + A.va * rax
    const vbx = B.vx - B.va * rby, vby = B.vy + B.va * rbx
    const rvx = vbx - vax, rvy = vby - vay
    const vn = rvx * nx + rvy * ny
    // 세게 부딪히면 잠든 쪽을 깨운다
    if (vn < -120) {
        if (A.sleep) wakeBody(w, A)
        if (B.sleep) wakeBody(w, B)
    }
    // 잠든 몸체는 벽처럼 (질량 무한)
    const iMA = A.sleep ? 0 : A.invM, iIA = A.sleep ? 0 : A.invI
    const iMB = B.sleep ? 0 : B.invM, iIB = B.sleep ? 0 : B.invI
    const invMass = iMA + iMB
    if (invMass === 0) return
    // 위치 보정 (살짝 겹침은 허용해 떨림 방지)
    const corr = (Math.max(pen - 0.5, 0) * 0.5) / invMass
    A.x -= nx * corr * iMA; A.y -= ny * corr * iMA
    B.x += nx * corr * iMB; B.y += ny * corr * iMB
    if (vn > 0) return // 이미 멀어지는 중
    const raCn = rax * ny - ray * nx
    const rbCn = rbx * ny - rby * nx
    const denom = invMass + raCn * raCn * iIA + rbCn * rbCn * iIB
    const e = Math.abs(vn) < 80 ? 0 : p.bounce // 느린 접촉은 튀지 않게 (안정화)
    const j = (-(1 + e) * vn) / denom
    A.vx -= j * nx * iMA; A.vy -= j * ny * iMA; A.va -= raCn * j * iIA
    B.vx += j * nx * iMB; B.vy += j * ny * iMB; B.va += rbCn * j * iIB
    // 마찰
    let tx = rvx - vn * nx, ty = rvy - vn * ny
    const tl = Math.hypot(tx, ty)
    if (tl < 1e-6) return
    tx /= tl; ty /= tl
    const raCt = rax * ty - ray * tx
    const rbCt = rbx * ty - rby * tx
    const denomT = invMass + raCt * raCt * iIA + rbCt * rbCt * iIB
    let jt = -(rvx * tx + rvy * ty) / denomT
    const maxF = p.friction * j
    jt = Math.max(-maxF, Math.min(maxF, jt))
    A.vx -= jt * tx * iMA; A.vy -= jt * ty * iMA; A.va -= raCt * jt * iIA
    B.vx += jt * tx * iMB; B.vy += jt * ty * iMB; B.va += rbCt * jt * iIB
}

// 물리 한 스텝
const tmp = [0, 0, 0, 0]
function step(w: World, dt: number, p: PhysParams, interactive: boolean) {
    const { bodies, W, H } = w
    const g = p.gravity * 1600
    // 1) 힘 적용 + 이동
    for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i]
        if (!b.active || b.sleep) continue
        b.vy += g * dt
        // Keep Readable: 한계를 넘은 회전은 스프링으로 바로 세운다 (잡고 있는 동안은 자유롭게 돌아감)
        if (p.maxTilt >= 0 && !b.held) {
            b.a = wrapAngle(b.a)
            const over = b.a - Math.max(-p.maxTilt, Math.min(p.maxTilt, b.a))
            if (over !== 0) {
                b.va += (-over * 300 - b.va * 12) * dt
            }
        }
        if (b.held && interactive) {
            // 잡은 지점을 포인터 쪽으로 끌어당기는 스프링 (자연스럽게 흔들리며 따라옴)
            const ca = Math.cos(b.a), sa = Math.sin(b.a)
            const rx = ca * b.gx - sa * b.gy, ry = sa * b.gx + ca * b.gy
            const Gx = b.x + rx, Gy = b.y + ry
            const vGx = b.vx - b.va * ry, vGy = b.vy + b.va * rx
            const Fx = (w.px - Gx) * 400 - vGx * 25
            const Fy = (w.py - Gy) * 400 - vGy * 25
            b.vx += Fx * dt; b.vy += Fy * dt
            b.va += ((rx * Fy - ry * Fx) * 12) / (b.w * b.w + b.h * b.h) * dt
            b.va -= b.va * 4 * dt
        }
        // 공기 저항·회전 감쇠
        b.vx -= b.vx * 0.15 * dt; b.vy -= b.vy * 0.15 * dt
        b.va -= b.va * 1.2 * dt
        // 거의 멈춘 몸체는 강하게 감쇠 — 깊은 더미에서 조금씩 기어가는 현상(크리프) 방지
        if (!b.held && Math.abs(b.vx) + Math.abs(b.vy) < 40 && Math.abs(b.va) < 0.6) {
            const k = 1 - 10 * dt
            b.vx *= k; b.vy *= k; b.va *= k
        }
        // 속도 상한 (폭주 방지)
        const sp = Math.hypot(b.vx, b.vy)
        if (sp > 3000) { b.vx *= 3000 / sp; b.vy *= 3000 / sp }
        if (b.va > 30) b.va = 30; else if (b.va < -30) b.va = -30
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.va * dt
    }
    // 2) 충돌 (3회 반복해 쌓임 안정화)
    const ceil = -H * 3
    for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < bodies.length; i++) {
            const A = bodies[i]
            if (!A.active) continue
            const ca = Math.cos(A.a), sa = Math.sin(A.a)
            const p1x = A.x - ca * A.hl, p1y = A.y - sa * A.hl, q1x = A.x + ca * A.hl, q1y = A.y + sa * A.hl
            // 태그끼리 (둘 다 잠들어 있으면 건너뜀)
            for (let j = i + 1; j < bodies.length; j++) {
                const B = bodies[j]
                if (!B.active || (A.sleep && B.sleep)) continue
                const dx = B.x - A.x, dy = B.y - A.y
                const reach = A.hl + A.r + B.hl + B.r
                if (dx * dx + dy * dy > reach * reach) continue
                const cb = Math.cos(B.a), sb = Math.sin(B.a)
                closestSegSeg(p1x, p1y, q1x, q1y, B.x - cb * B.hl, B.y - sb * B.hl, B.x + cb * B.hl, B.y + sb * B.hl, tmp)
                let nx = tmp[2] - tmp[0], ny = tmp[3] - tmp[1]
                const d = Math.hypot(nx, ny)
                const pen = A.r + B.r - d
                if (pen <= 0) continue
                if (d < 1e-6) { nx = 0; ny = -1 } else { nx /= d; ny /= d }
                resolve(w, A, B, tmp[0] + nx * (A.r - pen / 2), tmp[1] + ny * (A.r - pen / 2), nx, ny, pen, p)
            }
            if (A.sleep) continue
            // 벽·바닥·천장 (캡슐 양 끝 원으로 검사)
            for (let k = 0; k < 2; k++) {
                const ex = k === 0 ? p1x : q1x, ey = k === 0 ? p1y : q1y
                if (ey + A.r > H) resolve(w, A, WALL, ex, H, 0, 1, ey + A.r - H, p)
                if (ex - A.r < 0) resolve(w, A, WALL, 0, ey, -1, 0, A.r - ex, p)
                if (ex + A.r > W) resolve(w, A, WALL, W, ey, 1, 0, ex + A.r - W, p)
                if (ey - A.r < ceil) resolve(w, A, WALL, ex, ceil, 0, -1, ceil - (ey - A.r), p)
            }
        }
    }
    w.t += dt
}

// 몸체 위치를 DOM 에 반영 (React state 를 거치지 않음 — 60fps 유지)
function draw(w: World) {
    for (let i = 0; i < w.bodies.length; i++) {
        const b = w.bodies[i]
        if (!b.el) continue
        if (!b.active) { b.el.style.visibility = "hidden"; continue }
        b.el.style.visibility = "visible"
        b.el.style.transform = "translate(" + (b.x - b.w / 2) + "px," + (b.y - b.h / 2) + "px) rotate(" + b.a + "rad)"
    }
}

// 태그들을 출발 위치로 되돌림 (낙하 스타일별 출발점·초기 속도)
function place(w: World, style: string, stagger: number, allActive: boolean) {
    const rnd = makeRandom(w.bodies.length * 7919 + Math.round(w.W))
    const { W, H } = w
    w.t = 0; w.quiet = 0; w.calm = 0; w.run = 0
    for (let i = 0; i < w.bodies.length; i++) {
        const b = w.bodies[i]
        const half = b.hl + b.r
        b.vx = 0; b.vy = 0; b.va = 0; b.held = false
        b.a = (rnd() - 0.5) * 0.6
        if (style === "pour") {
            b.x = W / 2 + (rnd() - 0.5) * 40
            b.y = -b.h - 10 - rnd() * 30
            b.vx = (rnd() - 0.5) * 320; b.vy = 150
            b.delay = i * stagger
        } else if (style === "burst") {
            b.x = W / 2 + (rnd() - 0.5) * 60
            b.y = H - b.r - 4
            b.vx = (rnd() - 0.5) * 1800; b.vy = -(700 + rnd() * 800)
            b.va = (rnd() - 0.5) * 10
            b.delay = i * stagger * 0.5
        } else {
            b.x = half + rnd() * Math.max(1, W - half * 2)
            b.y = -b.h - 20 - rnd() * H * 0.6
            b.delay = i * stagger
        }
        if (allActive) {
            // 정적 더미 계산용: 겹치지 않게 위로 차곡차곡 세워 두고 한 번에 떨어뜨림
            b.x = half + rnd() * Math.max(1, W - half * 2)
            b.y = -(i + 1) * (b.h + 6)
            b.vx = 0; b.vy = 0; b.va = 0
            b.delay = 0
        }
        b.active = allActive
        b.lx = b.x; b.ly = b.y; b.la = b.a
        b.sleep = false; b.still = 0
    }
}

// 애니메이션 없이 정착된 상태까지 한 번에 계산 (캔버스·reduced-motion 용)
function settleNow(w: World, p: PhysParams) {
    for (let i = 0; i < 1000; i++) step(w, SUB, p, false)
    for (const b of w.bodies) { b.vx = 0; b.vy = 0; b.va = 0; b.a = clampTilt(b.a, p.maxTilt) }
}

/**
 * Physics Tag Pile — 스킬·서비스 태그가 중력으로 떨어져 쌓이고, 잡아서 던지거나 커서로 밀 수 있다.
 * 태그마다 링크를 달면 탭/클릭으로 이동. 캔버스·정적 렌더·reduced-motion 에서는 정착된 더미만 보여준다.
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 480
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function PhysicsTagPile(props: PhysicsTagPileProps) {
    const {
        tags,
        trigger = "view",
        replay = true,
        dropStyle = "rain",
        gravity = 1,
        bounce = 0.35,
        friction = 0.4,
        stagger = 0.06,
        drag = true,
        cursorPush = true,
        keepReadable = true,
        maxTilt = 25,
        newTab = false,
        colors,
        featuredColor = "#2DE5A0",
        textMode = "auto",
        textColor = "#111114",
        borderWidth = 0,
        borderColor = "rgba(0, 0, 0, 0.12)",
        radius = 999,
        paddingX = 18,
        paddingY = 10,
        background = "rgba(0, 0, 0, 0)",
        font = { fontFamily: "Inter", fontWeight: 500, fontSize: 15 },
        style,
    } = props

    const isStatic = useIsStaticRenderer() // 정적 렌더(서버·내보내기): 자바스크립트 없이 보이는 더미
    const isCanvas = RenderTarget.current() === RenderTarget.canvas // 캔버스: 정착된 더미, 애니메이션 없음

    const list = useMemo(() => {
        const src = tags && tags.length ? tags : SAMPLE
        return src.slice(0, MAX_TAGS).map((t) => ({ label: (t.label || "").trim() || "Tag", link: t.link || "", featured: !!t.featured }))
    }, [tags])
    const palette = colors && colors.length ? colors : DEFAULT_COLORS

    // 서버·첫 렌더는 "flow"(바닥 정렬 줄바꿈) → 브라우저에서 "physics" 로 전환 (hydration 안전)
    const [phase, setPhase] = useState<"flow" | "physics">("flow")
    const rootRef = useRef<HTMLDivElement>(null)
    const tagRefs = useRef<(HTMLElement | null)[]>([])
    const worldRef = useRef<World>({ bodies: [], W: 0, H: 0, t: 0, quiet: 0, calm: 0, run: 0, px: 0, py: 0 })
    const paramsRef = useRef<PhysParams>({ gravity, bounce, friction, maxTilt: -1 })
    paramsRef.current = {
        gravity: Math.max(0.05, gravity),
        bounce: Math.max(0, Math.min(1, bounce)),
        friction: Math.max(0, Math.min(1, friction)),
        maxTilt: keepReadable ? (Math.max(0, Math.min(90, maxTilt)) * Math.PI) / 180 : -1,
    }

    const rafRef = useRef(0)
    const runningRef = useRef(false)
    const lastRef = useRef(0)
    const accRef = useRef(0)
    const inViewRef = useRef(false)
    const ioReadyRef = useRef(false) // IntersectionObserver 가 첫 판정을 내렸는지
    const startedRef = useRef(false) // 한 번이라도 낙하를 시작했는지
    const reducedRef = useRef(false) // prefers-reduced-motion
    const frozenRef = useRef(false) // 캔버스·reduced-motion: 상호작용 없음
    const pointerRef = useRef({ prevX: 0, prevY: 0, prevT: 0, downX: 0, downY: 0, downT: 0, moved: false })
    const heldRef = useRef<Body | null>(null)
    const optsRef = useRef({ dropStyle, stagger, trigger, replay, drag, cursorPush })
    optsRef.current = { dropStyle, stagger, trigger, replay, drag, cursorPush }

    // 측정에 영향을 주는 값이 바뀌면 몸체를 다시 만든다
    const layoutKey = useMemo(
        () => JSON.stringify([list.map((t) => t.label), font, paddingX, paddingY, borderWidth, dropStyle]),
        [list, font, paddingX, paddingY, borderWidth, dropStyle]
    )

    // ── 루프 제어 ──
    const stopLoop = () => {
        runningRef.current = false
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
    }
    const wake = () => {
        if (runningRef.current || frozenRef.current || !inViewRef.current || !startedRef.current) return
        runningRef.current = true
        lastRef.current = 0
        accRef.current = 0
        worldRef.current.quiet = 0
        worldRef.current.calm = 0
        worldRef.current.run = 0
        rafRef.current = requestAnimationFrame(loop)
    }
    const loop = (ts: number) => {
        if (!runningRef.current) return
        const w = worldRef.current
        const dtFrame = lastRef.current ? Math.min((ts - lastRef.current) / 1000, 1 / 30) : 1 / 60
        lastRef.current = ts
        accRef.current += dtFrame
        let n = 0
        while (accRef.current >= SUB && n < 8) {
            step(w, SUB, paramsRef.current, true)
            accRef.current -= SUB
            n++
        }
        // 지연 시간이 지난 태그를 떨어뜨린다 + 이번 프레임 실제 이동량 측정
        let pending = false
        let maxMove = 0
        for (const b of w.bodies) {
            if (!b.active) {
                if (w.t >= b.delay) b.active = true
                else pending = true
            }
            if (b.active) {
                const mv = Math.max(Math.abs(b.x - b.lx), Math.abs(b.y - b.ly), Math.abs(b.a - b.la) * (b.hl + b.r))
                maxMove = Math.max(maxMove, mv)
                // 거의 안 움직인 채(프레임당 0.35px 미만) 25프레임이 지나면 잠재운다 (잡고 있는 태그 제외)
                if (!b.sleep && !b.held) {
                    if (mv < 0.35) b.still++
                    else b.still = 0
                    if (b.still > 25) { b.sleep = true; b.vx = 0; b.vy = 0; b.va = 0; b.a = clampTilt(b.a, paramsRef.current.maxTilt) }
                }
            }
            b.lx = b.x; b.ly = b.y; b.la = b.a
        }
        draw(w)
        // 전부 멈추면 루프 종료 (정지 상태에서 CPU 0) — 한 프레임에 0.08px 미만 이동이 40프레임 이어지면 정착.
        // 안전망: 눈에 안 띄는 미세 움직임(0.5px 미만)이 1.5초 이어져도 정착으로 간주 (깊은 더미의 잔떨림)
        if (!pending && !heldRef.current && maxMove < 0.08) w.quiet++
        else w.quiet = 0
        if (!pending && !heldRef.current && maxMove < 0.5) w.calm++
        else w.calm = 0
        w.run += dtFrame
        if (w.quiet > 40 || w.calm > 90 || (w.run > 30 && !pending && !heldRef.current)) {
            for (const b of w.bodies) { b.sleep = true; b.still = 0; b.a = clampTilt(b.a, paramsRef.current.maxTilt) }
            for (const b of w.bodies) { b.vx = 0; b.vy = 0; b.va = 0 }
            draw(w)
            stopLoop()
            return
        }
        rafRef.current = requestAnimationFrame(loop)
    }
    const restart = () => {
        const w = worldRef.current
        if (!w.bodies.length) return
        if (frozenRef.current) {
            place(w, "rain", 0, true)
            settleNow(w, paramsRef.current)
            draw(w)
            return
        }
        stopLoop()
        place(w, optsRef.current.dropStyle, optsRef.current.stagger, false)
        draw(w)
        startedRef.current = true
        wake()
    }

    // ── 브라우저에서 물리 단계로 전환 (정적 렌더는 flow 유지) ──
    useEffect(() => {
        if (isStatic) return
        startTransition(() => setPhase("physics"))
    }, [isStatic])

    // ── 몸체 생성·측정 (물리 단계에서, 태그·폰트가 바뀔 때마다) ──
    useIsoLayoutEffect(() => {
        if (phase !== "physics") return
        const root = rootRef.current
        if (!root) return
        const w = worldRef.current
        w.W = root.clientWidth
        w.H = root.clientHeight
        w.bodies = list.map((_, i) => {
            const el = tagRefs.current[i]
            const bw = el ? el.offsetWidth : 80
            const bh = el ? el.offsetHeight : 36
            const m = (bw * bh) / 1600
            return {
                x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0,
                w: bw, h: bh, hl: Math.max(0, (bw - bh) / 2), r: bh / 2,
                invM: 1 / m, invI: 12 / (m * (bw * bw + bh * bh)),
                active: false, delay: 0, held: false, gx: 0, gy: 0, lx: 0, ly: 0, la: 0, still: 0, sleep: false, el,
            }
        })
        heldRef.current = null
        // 캔버스·reduced-motion → 정착된 더미를 바로 계산해 보여준다
        const mq = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null
        reducedRef.current = !!(mq && mq.matches)
        frozenRef.current = isCanvas || reducedRef.current
        if (frozenRef.current) {
            place(w, "rain", 0, true)
            settleNow(w, paramsRef.current)
            draw(w)
            return
        }
        // 트리거: In View 는 보일 때 시작(아래 IntersectionObserver). On Load 는 지금 바로 —
        // 화면 밖이면 애니메이션 대신 정착된 상태로 미리 계산해 둔다 (화면 밖 재생 금지 + "도착하면 이미 쌓여 있음")
        stopLoop()
        startedRef.current = false
        place(w, optsRef.current.dropStyle, optsRef.current.stagger, false)
        draw(w)
        if (optsRef.current.trigger === "load" && ioReadyRef.current && !inViewRef.current) {
            place(w, "rain", 0, true)
            settleNow(w, paramsRef.current)
            draw(w)
            startedRef.current = true
        } else if (inViewRef.current) {
            startedRef.current = true
            wake()
        }
        return () => stopLoop()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, layoutKey, isCanvas])

    // ── 화면에 보이는지 감지: 보일 때만 재생, 벗어나면 정지 (마켓 AI 심사 요구사항) ──
    useEffect(() => {
        if (phase !== "physics") return
        const root = rootRef.current
        if (!root || typeof IntersectionObserver === "undefined") {
            inViewRef.current = true
            return
        }
        const io = new IntersectionObserver((entries) => {
            const visible = entries[0].isIntersecting
            const wasInView = inViewRef.current
            const first = !ioReadyRef.current
            inViewRef.current = visible
            ioReadyRef.current = true
            if (frozenRef.current) return
            const w = worldRef.current
            if (visible) {
                if (!startedRef.current) {
                    startedRef.current = true
                    wake()
                } else if (!wasInView && optsRef.current.replay && optsRef.current.trigger === "view") {
                    restart() // 다시 스크롤해 들어오면 재생
                } else {
                    wake()
                }
            } else {
                stopLoop()
                // On Load 인데 처음부터 화면 밖이면: 정착된 더미로 미리 계산 (도착했을 때 이미 쌓여 있음)
                if (first && optsRef.current.trigger === "load" && !startedRef.current && w.bodies.length) {
                    place(w, "rain", 0, true)
                    settleNow(w, paramsRef.current)
                    draw(w)
                    startedRef.current = true
                }
            }
        }, { threshold: 0.15 })
        io.observe(root)
        return () => io.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    // ── 컨테이너 크기 변화: 벽 위치 갱신 ──
    useEffect(() => {
        if (phase !== "physics") return
        const root = rootRef.current
        if (!root || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect
            const w = worldRef.current
            if (Math.abs(rect.width - w.W) < 1 && Math.abs(rect.height - w.H) < 1) return
            w.W = rect.width; w.H = rect.height
            for (const b of w.bodies) { b.sleep = false; b.still = 0 } // 벽이 움직였으니 전부 깨운다
            if (frozenRef.current) {
                place(w, "rain", 0, true)
                settleNow(w, paramsRef.current)
                draw(w)
            } else wake()
        })
        ro.observe(root)
        return () => ro.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    // ── 커서 밀어내기: 잡지 않아도 포인터가 지나가면 가까운 태그를 밀어낸다 (창 전체에서 감지 — 컨테이너는 클릭 통과) ──
    useEffect(() => {
        if (phase !== "physics") return
        const win: any = typeof globalThis !== "undefined" ? globalThis : null
        if (!win || !win.addEventListener) return
        const onMove = (e: PointerEvent) => {
            const root = rootRef.current
            const w = worldRef.current
            if (!root) return
            const rect = root.getBoundingClientRect()
            const px = e.clientX - rect.left, py = e.clientY - rect.top
            w.px = px; w.py = py
            const pr = pointerRef.current
            const now = e.timeStamp || Date.now()
            const dtp = Math.max(0.004, (now - pr.prevT) / 1000)
            const pvx = (px - pr.prevX) / dtp, pvy = (py - pr.prevY) / dtp
            pr.prevX = px; pr.prevY = py; pr.prevT = now
            if (heldRef.current) {
                if (Math.hypot(px - pr.downX, py - pr.downY) > 6) pr.moved = true
                return
            }
            if (!optsRef.current.cursorPush || frozenRef.current || !inViewRef.current || !startedRef.current) return
            if (px < -60 || py < -60 || px > w.W + 60 || py > w.H + 60) return
            const speed = Math.min(Math.hypot(pvx, pvy), 2500)
            if (speed < 20) return
            let touched = false
            for (const b of w.bodies) {
                if (!b.active) continue
                const ca = Math.cos(b.a), sa = Math.sin(b.a)
                // 포인터에서 캡슐 중심선까지 가장 가까운 점
                const dx = px - b.x, dy = py - b.y
                const t = Math.max(-b.hl, Math.min(b.hl, dx * ca + dy * sa))
                const cx = b.x + ca * t, cy = b.y + sa * t
                let nx = cx - px, ny = cy - py
                const d = Math.hypot(nx, ny)
                const R = b.r + 36
                if (d > R) continue
                if (d < 1e-3) { nx = pvx; ny = pvy }
                const nl = Math.hypot(nx, ny) || 1
                nx /= nl; ny /= nl
                const k = (1 - d / R) * (120 + speed * 0.4)
                wakeBody(w, b)
                b.vx += nx * k; b.vy += ny * k
                b.va += ((cx - b.x) * ny * k - (cy - b.y) * nx * k) * 12 / (b.w * b.w + b.h * b.h) * 0.3
                touched = true
            }
            if (touched) wake()
        }
        win.addEventListener("pointermove", onMove, { passive: true })
        return () => win.removeEventListener("pointermove", onMove)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase])

    // ── 잡기·던지기 (태그 요소에서 포인터 캡처) ──
    const onPointerDown = (e: any, i: number) => {
        const pr = pointerRef.current
        const root = rootRef.current
        if (!root) return
        const rect = root.getBoundingClientRect()
        const px = e.clientX - rect.left, py = e.clientY - rect.top
        pr.downX = px; pr.downY = py; pr.downT = e.timeStamp || Date.now(); pr.moved = false
        pr.prevX = px; pr.prevY = py; pr.prevT = pr.downT
        if (!optsRef.current.drag || frozenRef.current || e.button > 0) return
        const w = worldRef.current
        const b = w.bodies[i]
        if (!b || !b.active) return
        w.px = px; w.py = py
        const dx = px - b.x, dy = py - b.y
        const ca = Math.cos(b.a), sa = Math.sin(b.a)
        b.gx = ca * dx + sa * dy
        b.gy = -sa * dx + ca * dy
        wakeBody(w, b)
        b.held = true
        heldRef.current = b
        if (e.currentTarget && e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}
        }
        if (e.currentTarget) e.currentTarget.style.cursor = "grabbing"
        wake()
    }
    const onPointerUp = (e: any) => {
        const b = heldRef.current
        if (b) {
            b.held = false
            heldRef.current = null
            if (e.currentTarget) e.currentTarget.style.cursor = "grab"
        }
        wake()
    }
    // 드래그였으면 링크 이동을 막는다 (6px·300ms 이내만 클릭으로 인정)
    const onClick = (e: any) => {
        const pr = pointerRef.current
        const dt = (e.timeStamp || Date.now()) - pr.downT
        if (pr.moved || dt > 300) e.preventDefault()
    }

    // ── 스타일 ──
    const tagStyle = (i: number, physics: boolean): CSSProperties => {
        const t = list[i]
        const fill = t.featured ? featuredColor : palette[i % palette.length]
        const color = textMode === "custom" ? textColor : luminance(fill) > 0.6 ? "#111114" : "#FFFFFF"
        return {
            ...font,
            boxSizing: "border-box",
            display: "inline-flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            padding: paddingY + "px " + paddingX + "px",
            borderRadius: radius,
            background: fill,
            color,
            border: borderWidth > 0 ? borderWidth + "px solid " + borderColor : "none",
            textDecoration: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            pointerEvents: "auto",
            ...(physics
                ? ({
                      position: "absolute",
                      left: 0,
                      top: 0,
                      visibility: "hidden",
                      touchAction: "none",
                      cursor: drag && !isCanvas ? "grab" : t.link ? "pointer" : "default",
                      willChange: "transform",
                  } as CSSProperties)
                : {}),
        }
    }

    const renderTag = (i: number, physics: boolean) => {
        const t = list[i]
        const common: any = {
            ref: (el: HTMLElement | null) => { tagRefs.current[i] = el },
            style: tagStyle(i, physics),
            draggable: false,
            onPointerDown: physics ? (e: any) => onPointerDown(e, i) : undefined,
            onPointerUp: physics ? onPointerUp : undefined,
            onPointerCancel: physics ? onPointerUp : undefined,
            onClick: physics ? onClick : undefined,
            onDragStart: (e: any) => e.preventDefault(),
        }
        if (t.link) {
            return (
                <a key={i} {...common} href={t.link} target={newTab ? "_blank" : undefined} rel={newTab ? "noopener noreferrer" : undefined}>
                    {t.label}
                </a>
            )
        }
        return <div key={i} {...common}>{t.label}</div>
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                overflow: "hidden",
                background,
                pointerEvents: "none", // 빈 공간은 클릭 통과 (푸터 링크 위에 올려도 됨)
                boxSizing: "border-box",
            }}
            aria-label="Tags"
        >
            {phase === "flow" ? (
                // 정적 렌더·첫 렌더: 바닥에 정렬된 줄바꿈 더미 (자바스크립트 없이도 보임)
                <div style={{ position: "absolute", inset: 0, display: "flex", flexWrap: "wrap", alignContent: "flex-end", justifyContent: "center", gap: 6, padding: 8, boxSizing: "border-box" }}>
                    {list.map((_, i) => renderTag(i, false))}
                </div>
            ) : (
                list.map((_, i) => renderTag(i, true))
            )}
        </div>
    )
}

PhysicsTagPile.displayName = "Physics Tag Pile"

addPropertyControls(PhysicsTagPile, {
    tags: {
        type: ControlType.Array,
        title: "Tags",
        maxCount: MAX_TAGS,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "New skill" },
                link: { type: ControlType.Link, title: "Link" },
                featured: { type: ControlType.Boolean, title: "Featured", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
            },
        },
        defaultValue: SAMPLE,
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["view", "load"],
        optionTitles: ["In View", "On Load"],
        defaultValue: "view",
        displaySegmentedControl: true,
    },
    replay: { type: ControlType.Boolean, title: "Replay", defaultValue: true, enabledTitle: "On", disabledTitle: "Off", hidden: (p: any) => p.trigger !== "view" },
    dropStyle: {
        type: ControlType.Enum,
        title: "Drop Style",
        options: ["rain", "pour", "burst"],
        optionTitles: ["Rain", "Pour", "Burst"],
        defaultValue: "rain",
        displaySegmentedControl: true,
    },
    gravity: { type: ControlType.Number, title: "Gravity", defaultValue: 1, min: 0.1, max: 3, step: 0.05 },
    bounce: { type: ControlType.Number, title: "Bounce", defaultValue: 0.35, min: 0, max: 1, step: 0.05 },
    friction: { type: ControlType.Number, title: "Friction", defaultValue: 0.4, min: 0, max: 1, step: 0.05 },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.06, min: 0, max: 0.3, step: 0.01, unit: "s" },
    drag: { type: ControlType.Boolean, title: "Drag & Throw", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    cursorPush: { type: ControlType.Boolean, title: "Cursor Push", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    keepReadable: { type: ControlType.Boolean, title: "Keep Readable", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    maxTilt: { type: ControlType.Number, title: "Max Tilt", defaultValue: 25, min: 0, max: 90, step: 1, unit: "°", hidden: (p: any) => p.keepReadable === false },
    newTab: { type: ControlType.Boolean, title: "Links Open", defaultValue: false, enabledTitle: "New Tab", disabledTitle: "Same Tab" },
    colors: {
        type: ControlType.Array,
        title: "Colors",
        control: { type: ControlType.Color },
        defaultValue: DEFAULT_COLORS,
        maxCount: 12,
    },
    featuredColor: { type: ControlType.Color, title: "Featured", defaultValue: "#2DE5A0" },
    textMode: {
        type: ControlType.Enum,
        title: "Text",
        options: ["auto", "custom"],
        optionTitles: ["Auto", "Custom"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#111114", hidden: (p: any) => p.textMode !== "custom" },
    borderWidth: { type: ControlType.Number, title: "Border", defaultValue: 0, min: 0, max: 6, step: 0.5, unit: "px" },
    borderColor: { type: ControlType.Color, title: "Border Color", defaultValue: "rgba(0, 0, 0, 0.12)", hidden: (p: any) => !p.borderWidth },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 999, min: 0, max: 999, step: 1, unit: "px" },
    paddingX: { type: ControlType.Number, title: "Padding X", defaultValue: 18, min: 4, max: 60, step: 1, unit: "px" },
    paddingY: { type: ControlType.Number, title: "Padding Y", defaultValue: 10, min: 2, max: 40, step: 1, unit: "px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0, 0, 0, 0)" },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "15px", variant: "Medium", lineHeight: "1.2em" },
        description: "Created by BrandingUp",
    },
})
