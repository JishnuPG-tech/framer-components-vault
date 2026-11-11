import * as React from "react"
import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/**
 * Curved Carousel
 * Cards are rendered on a canvas column-by-column, so the top and bottom
 * edges of every card bend smoothly along the curve (like a cylinder).
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 600
 * @framerDisableUnlink
 */
const DEFAULTS: Record<string, any> = {
    layout: {
        cardHeight: 42,
        aspect: 1,
        gap: 12,
        cardRadius: 0,
        imageZoom: 1,
        offsetY: 0,
    },
    curve: { curve: 0.8, power: 2, slant: 0, smoothness: 2 },
    appearance: {
        background: "#EFEFEF",
        radius: "40px",
        edgeShade: 0,
        shadeColor: "#EFEFEF",
    },
    motion: {
        autoplay: true,
        speed: 40,
        direction: "left",
        pauseOnHover: true,
    },
    interaction: {
        draggable: true,
        inertia: true,
        friction: 3,
        dragSensitivity: 1,
        snap: false,
        wheel: true,
    },
    media: { loopMode: "finite", videoPlay: "always" },
    hoverFx: {
        hoverEnabled: true,
        hoverScale: 1.12,
        hoverDuration: 300,
        hoverDim: 0,
    },
    arrowsGroup: {
        arrows: false,
        arrowSize: 44,
        arrowOffset: 20,
        arrowBg: "rgba(255,255,255,0.92)",
        arrowColor: "#111111",
    },
}

// Picks the best drawable source (video frame if ready, else image)
function pickSource(m: any) {
    if (!m) return null
    const v = m.video
    if (v && v.readyState >= 2 && v.videoWidth)
        return { el: v, w: v.videoWidth, h: v.videoHeight }
    const i = m.img
    if (i && i.complete && i.naturalWidth)
        return { el: i, w: i.naturalWidth, h: i.naturalHeight }
    return null
}

// Merge the grouped (Object) controls into one flat props object
function flatten(raw: any) {
    const out: any = { ...raw }
    Object.keys(DEFAULTS).forEach((g) =>
        Object.assign(out, DEFAULTS[g], raw[g] || {})
    )
    return out
}

/**

 * @framerDisableUnlink
 */

export default function CurvedMediaCarousel(raw: any) {
    const props = flatten(raw)
    const { style } = raw
    const { background, radius, arrows } = props
    const images: any[] = (Array.isArray(raw.images) ? raw.images : []).slice(
        0,
        10
    )

    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const propsRef = useRef(props)
    propsRef.current = props

    const imgsRef = useRef<
        { img?: HTMLImageElement; video?: HTMLVideoElement }[]
    >([])
    const st = useRef({
        pos: 0, // position measured in cards (0 = first card centred)
        vel: 0, // inertia velocity in cards / second
        dragVel: 0,
        dragging: false,
        lastX: 0,
        lastMove: 0,
        last: 0,
        hover: false,
        px: -1,
        py: -1,
        hoverMap: new Map<number, number>(),
        hoverTarget: null as number | null,
        autoMul: 1,
        bounce: 1,
        inited: false,
        goto: null as number | null,
        w: 0,
        h: 0,
        dpr: 1,
        visible: true,
        needsDraw: true,
    })

    const getSrc = (it: any): string =>
        typeof it === "string"
            ? it
            : typeof it?.image === "string"
              ? it.image
              : it?.image?.src || it?.src || ""
    const getVideo = (it: any): string => {
        if (!it || typeof it === "string") return ""
        const url = typeof it.videoUrl === "string" ? it.videoUrl.trim() : ""
        if (url) return url
        return typeof it.video === "string" ? it.video : it.video?.src || ""
    }
    const srcKey = (images || [])
        .map((it) => getSrc(it) + "~" + getVideo(it))
        .join("|")

    // ---------- Load images + videos ----------
    useEffect(() => {
        const list: any[] = images || []
        const entries = list.map((it) => {
            const entry: { img?: HTMLImageElement; video?: HTMLVideoElement } =
                {}
            const src = getSrc(it)
            if (src) {
                const img = new Image()
                img.decoding = "async"
                img.onload = () => {
                    st.current.needsDraw = true
                }
                img.src = src
                entry.img = img
            }
            const vs = getVideo(it)
            if (vs) {
                const v = document.createElement("video")
                v.muted = true
                v.defaultMuted = true
                v.loop = true
                v.playsInline = true
                v.setAttribute("playsinline", "")
                v.preload = "auto"
                v.onloadeddata = () => {
                    st.current.needsDraw = true
                }
                v.src = vs
                entry.video = v
            }
            return entry
        })
        imgsRef.current = entries
        st.current.needsDraw = true
        return () => {
            entries.forEach((e) => {
                if (e.video) {
                    e.video.pause()
                    e.video.removeAttribute("src")
                    e.video.load()
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [srcKey])

    // Redraw whenever any prop changes
    useEffect(() => {
        st.current.needsDraw = true
    })

    // ---------- Metrics ----------
    const metrics = () => {
        const p = propsRef.current
        const s = st.current
        const cardH = (s.h * p.cardHeight) / 100
        const cardW = cardH * p.aspect
        const pitch = Math.max(1, cardW + p.gap)
        return { cardH, cardW, pitch }
    }

    const count = () => Math.max(1, imgsRef.current.length || 6)
    // Allowed scroll range (in cards) for "no repeat" mode.
    // If every card fits on screen they are simply centred.
    const getRange = (n: number): [number, number] => {
        const { cardW, pitch } = metrics()
        const W = st.current.w
        if (W && (n - 1) * pitch + cardW <= W) {
            const m = (n - 1) / 2
            return [m, m]
        }
        return [0, n - 1]
    }

    // ---------- Draw ----------
    const draw = () => {
        const c = canvasRef.current
        const s = st.current
        if (!c || !s.w || !s.h) return
        const ctx = c.getContext("2d")
        if (!ctx) return
        const p = propsRef.current
        const W = s.w
        const H = s.h
        ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0)
        ctx.clearRect(0, 0, W, H)

        const media = imgsRef.current
        const n = Math.max(1, media.length || 6)
        const finite = p.loopMode === "finite"
        const srcs = media.map(pickSource)
        const { cardH, cardW, pitch } = metrics()
        if (cardH <= 0 || cardW <= 0) return

        const cx = W / 2
        const baseCy = H / 2 + p.offsetY
        const col = Math.max(1, p.smoothness)
        const r = Math.max(0, Math.min(p.cardRadius, cardW / 2, cardH / 2))
        const slant = Math.tan((p.slant * Math.PI) / 180)
        const zoom = Math.max(1, p.imageZoom)
        const shade = p.edgeShade > 0

        const hm = s.hoverMap
        let hoverMax = 0
        hm.forEach((v: number) => {
            if (v > hoverMax) hoverMax = v
        })
        const dim = p.hoverEnabled ? p.hoverDim : 0

        // Draws one vertical slice of a card. hs = hover scale of that card.
        const drawCol = (
            x: number,
            xm: number,
            k: number,
            local: number,
            hs: number
        ) => {
            const base = ctx.globalAlpha
            const d = Math.abs(xm - cx) / (W / 2)
            const sc = Math.max(0.04, 1 + p.curve * Math.pow(d, p.power))

            // rounded corners (inset shrinks near the card's left / right edges)
            let inset = 0
            const e = Math.min(local, cardW - local)
            if (r > 0 && e < r) {
                inset = r - Math.sqrt(Math.max(0, r * r - (r - e) * (r - e)))
            }

            const k2 = sc * hs
            const full = cardH * k2
            const cy = baseCy + slant * (xm - cx)
            const top = cy - full / 2 + inset * k2
            const hh = full - 2 * inset * k2
            if (hh <= 0) return

            const srcI = srcs[k]
            if (srcI) {
                const img = srcI.el
                const iw = srcI.w
                const ih = srcI.h
                const ca = cardW / cardH
                const ia = iw / ih
                let cw: number
                let ch: number
                if (ia > ca) {
                    ch = ih
                    cw = ih * ca
                } else {
                    cw = iw
                    ch = iw / ca
                }
                cw /= zoom
                ch /= zoom
                const cxs = (iw - cw) / 2
                const cys = (ih - ch) / 2
                const sx = cxs + (local / cardW) * cw
                let sw = Math.max(0.5, (cw * col) / (cardW * hs))
                if (sx + sw > iw) sw = iw - sx
                if (sw <= 0) return
                const sy = cys + (inset / cardH) * ch
                const sh = ch * (1 - (2 * inset) / cardH)
                try {
                    ctx.drawImage(img, sx, sy, sw, sh, x, top, col + 0.6, hh)
                } catch (_) {}
            } else {
                const hue = (k * 47 + 200) % 360
                const light = 72 - 14 * (local / cardW)
                ctx.fillStyle = `hsl(${hue}, 28%, ${light}%)`
                ctx.fillRect(x, top, col + 0.6, hh)
            }

            if (shade) {
                ctx.globalAlpha = base * Math.min(1, p.edgeShade * d * d)
                ctx.fillStyle = p.shadeColor
                ctx.fillRect(x, top, col + 0.6, hh)
                ctx.globalAlpha = base
            }
        }

        // Pass 1: every card that is not hovered (optionally dimmed)
        ctx.globalAlpha = 1 - dim * hoverMax
        for (let x = 0; x < W; x += col) {
            const xm = x + col / 2
            const f = s.pos * pitch + cardW / 2 + (xm - cx)
            const idx = Math.floor(f / pitch)
            const local = f - idx * pitch
            if (local > cardW) continue // gap
            if (finite && (idx < 0 || idx > n - 1)) continue // no repeat
            if ((hm.get(idx) || 0) > 0.001) continue
            drawCol(x, xm, ((idx % n) + n) % n, local, 1)
        }
        ctx.globalAlpha = 1

        // Pass 2: hovered cards on top (higher z-index), strongest last
        const hovered = Array.from(hm.entries())
            .filter((en) => en[1] > 0.001)
            .sort((a, b) => a[1] - b[1])
        for (const [idx, v] of hovered) {
            const hs = 1 + (Math.max(1, p.hoverScale) - 1) * v
            const ccx = cx + (idx - s.pos) * pitch
            const half = (cardW * hs) / 2
            const k = ((idx % n) + n) % n
            const x0 = Math.max(0, Math.floor((ccx - half) / col) * col)
            for (let x = x0; x < W && x < ccx + half; x += col) {
                const xm = x + col / 2
                const local = cardW / 2 + (xm - ccx) / hs
                if (local < 0 || local > cardW) continue
                drawCol(x, xm, k, local, hs)
            }
        }
    }

    // ---------- Resize / visibility / loop / wheel ----------
    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        if (!wrap || !canvas) return
        const s = st.current

        const resize = () => {
            const rect = wrap.getBoundingClientRect()
            const w = wrap.clientWidth || rect.width
            const h = wrap.clientHeight || rect.height
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            s.w = w
            s.h = h
            s.dpr = dpr
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            s.needsDraw = true
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(wrap)

        const io = new IntersectionObserver(
            (entries) => {
                s.visible = entries[0]?.isIntersecting ?? true
                if (s.visible) s.needsDraw = true
            },
            { threshold: 0 }
        )
        io.observe(wrap)

        const onWheel = (ev: WheelEvent) => {
            const p = propsRef.current
            if (!p.wheel) return
            if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) {
                ev.preventDefault()
                const { pitch } = metrics()
                s.goto = null
                s.pos += (ev.deltaX / pitch) * p.dragSensitivity
                if (p.loopMode === "finite") {
                    const [lo, hi] = getRange(count())
                    s.pos = Math.max(lo, Math.min(hi, s.pos))
                }
                s.needsDraw = true
            }
        }
        wrap.addEventListener("wheel", onWheel, { passive: false })

        let raf = 0
        s.last = performance.now()
        const tick = (t: number) => {
            raf = requestAnimationFrame(tick)
            const dt = Math.min(0.05, (t - s.last) / 1000)
            s.last = t
            const p = propsRef.current
            const allowed =
                RenderTarget.current() !== RenderTarget.canvas ||
                p.animateInEditor

            const nn = count()
            const finite = p.loopMode === "finite"
            const [lo, hi] = getRange(nn)
            if (!s.inited && s.w) {
                s.inited = true
                if (finite) s.pos = lo
            }

            let moving = false
            if (s.visible && allowed && !s.dragging) {
                const { pitch } = metrics()

                if (s.goto !== null) {
                    s.vel = 0
                    s.pos += (s.goto - s.pos) * (1 - Math.exp(-7 * dt))
                    if (Math.abs(s.goto - s.pos) < 0.002) {
                        s.pos = s.goto
                        s.goto = null
                    }
                    moving = true
                } else {
                    // autoplay
                    const wantAuto =
                        p.autoplay && !(p.pauseOnHover && s.hover) ? 1 : 0
                    s.autoMul +=
                        (wantAuto - s.autoMul) * (1 - Math.exp(-6 * dt))
                    let dir = p.direction === "right" ? -1 : 1
                    if (finite) {
                        dir *= s.bounce
                        if (dir > 0 && s.pos >= hi - 0.001) {
                            s.bounce *= -1
                            dir = -dir
                        } else if (dir < 0 && s.pos <= lo + 0.001) {
                            s.bounce *= -1
                            dir = -dir
                        }
                    }
                    const canMove = !finite || hi > lo
                    const auto =
                        canMove && p.autoplay && s.autoMul > 0.001
                            ? (dir * p.speed * s.autoMul) / pitch
                            : 0

                    s.vel *= Math.exp(-p.friction * dt)
                    if (Math.abs(s.vel) < 0.001) s.vel = 0

                    s.pos += (auto + s.vel) * dt
                    if (auto !== 0 || s.vel !== 0) moving = true

                    // no-repeat mode: springy edges
                    if (finite && (s.pos < lo || s.pos > hi)) {
                        const t = s.pos < lo ? lo : hi
                        s.pos += (t - s.pos) * (1 - Math.exp(-10 * dt))
                        s.vel *= 0.5
                        moving = true
                    }

                    // snap to nearest card
                    if (p.snap && !p.autoplay && Math.abs(s.vel) < 0.3) {
                        let target = Math.round(s.pos)
                        if (finite) target = Math.max(lo, Math.min(hi, target))
                        if (Math.abs(target - s.pos) > 0.0005) {
                            s.pos += (target - s.pos) * (1 - Math.exp(-8 * dt))
                            moving = true
                        }
                    }
                }
            }

            // ----- video playback -----
            {
                const media = imgsRef.current
                let playing = false
                if (media.some((m) => m.video)) {
                    const rc = Math.round(s.pos)
                    const kc = finite
                        ? Math.max(0, Math.min(nn - 1, rc))
                        : ((rc % nn) + nn) % nn
                    media.forEach((m, k) => {
                        const v = m.video
                        if (!v) return
                        const want =
                            s.visible &&
                            allowed &&
                            (p.videoPlay === "always" || k === kc)
                        if (want) {
                            if (v.paused) v.play().catch(() => {})
                            if (v.readyState >= 2) playing = true
                        } else if (!v.paused) v.pause()
                    })
                }
                if (playing) s.needsDraw = true
            }

            // ----- hover scale -----
            if (p.hoverEnabled && s.visible && allowed) {
                const { cardH, cardW, pitch } = metrics()
                let target: number | null = null
                if (!s.dragging && s.px >= 0 && cardH > 0) {
                    const cxm = s.w / 2
                    const baseCy = s.h / 2 + p.offsetY
                    const slant = Math.tan((p.slant * Math.PI) / 180)
                    const test = (idx: number, hs: number) => {
                        if (finite && (idx < 0 || idx > nn - 1)) return false
                        const ccx = cxm + (idx - s.pos) * pitch
                        if (Math.abs(s.px - ccx) > (cardW * hs) / 2)
                            return false
                        const d = Math.abs(s.px - cxm) / (s.w / 2)
                        const sc = Math.max(
                            0.04,
                            1 + p.curve * Math.pow(d, p.power)
                        )
                        const cy = baseCy + slant * (s.px - cxm)
                        return Math.abs(s.py - cy) <= (cardH * sc * hs) / 2
                    }
                    // keep the current card while the cursor is inside its scaled area
                    if (s.hoverTarget !== null) {
                        const v = s.hoverMap.get(s.hoverTarget) || 0
                        if (
                            test(
                                s.hoverTarget,
                                1 + (Math.max(1, p.hoverScale) - 1) * v
                            )
                        )
                            target = s.hoverTarget
                    }
                    if (target === null) {
                        const f = s.pos * pitch + cardW / 2 + (s.px - cxm)
                        const idx = Math.floor(f / pitch)
                        if (test(idx, 1)) target = idx
                    }
                }
                s.hoverTarget = target
                if (target !== null && !s.hoverMap.has(target))
                    s.hoverMap.set(target, 0)
                const rate =
                    1 -
                    Math.exp((-dt * 4) / Math.max(0.05, p.hoverDuration / 1000))
                s.hoverMap.forEach((v: number, key: number) => {
                    const goal = key === target ? 1 : 0
                    let nv = v + (goal - v) * rate
                    if (Math.abs(goal - nv) < 0.002) nv = goal
                    if (nv === 0 && goal === 0) s.hoverMap.delete(key)
                    else s.hoverMap.set(key, nv)
                    if (nv !== v) moving = true
                })
            } else if (s.hoverMap.size) {
                s.hoverMap.clear()
                s.hoverTarget = null
                s.needsDraw = true
            }

            if (s.visible && (moving || s.dragging || s.needsDraw)) {
                draw()
                s.needsDraw = false
            }
        }
        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            wrap.removeEventListener("wheel", onWheel)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ---------- Pointer interaction ----------
    const onPointerDown = (e: React.PointerEvent) => {
        if (!props.draggable) return
        const s = st.current
        s.dragging = true
        s.goto = null
        s.lastX = e.clientX
        s.lastMove = performance.now()
        s.dragVel = 0
        s.vel = 0
        try {
            ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch (_) {}
    }
    const onPointerMove = (e: React.PointerEvent) => {
        const s = st.current
        if (e.pointerType === "mouse") {
            const rect = (
                e.currentTarget as HTMLElement
            ).getBoundingClientRect()
            s.px = e.clientX - rect.left
            s.py = e.clientY - rect.top
        }
        if (!s.dragging) return
        const { pitch } = metrics()
        const now = performance.now()
        const dx = e.clientX - s.lastX
        const dtMove = Math.max(0.001, (now - s.lastMove) / 1000)
        const dCards = (-dx * props.dragSensitivity) / pitch
        let dc = dCards
        if (props.loopMode === "finite") {
            const [lo, hi] = getRange(count())
            if ((s.pos < lo && dc < 0) || (s.pos > hi && dc > 0)) dc *= 0.35
        }
        s.pos += dc
        s.dragVel = s.dragVel * 0.6 + (dCards / dtMove) * 0.4
        s.lastX = e.clientX
        s.lastMove = now
        s.needsDraw = true
    }
    const endDrag = () => {
        const s = st.current
        if (!s.dragging) return
        s.dragging = false
        const stale = performance.now() - s.lastMove > 90
        s.vel = props.inertia && !stale ? s.dragVel : 0
    }

    const step = (dir: number) => {
        const s = st.current
        const base = s.goto !== null ? s.goto : Math.round(s.pos)
        let t = base + dir
        if (props.loopMode === "finite") {
            const [lo, hi] = getRange(count())
            t = Math.max(lo, Math.min(hi, t))
        }
        s.goto = t
        s.needsDraw = true
    }

    const arrowBtn = (dir: number): React.CSSProperties => ({
        position: "absolute",
        top: "50%",
        [dir < 0 ? "left" : "right"]: props.arrowOffset,
        transform: "translateY(-50%)",
        width: props.arrowSize,
        height: props.arrowSize,
        borderRadius: "50%",
        background: props.arrowBg,
        color: props.arrowColor,
        border: "none",
        padding: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    })

    const chevron = (dir: number) => (
        <svg
            width={props.arrowSize * 0.4}
            height={props.arrowSize * 0.4}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: dir > 0 ? "none" : "scaleX(-1)" }}
        >
            <path d="M9 5l7 7-7 7" />
        </svg>
    )

    return (
        <div
            ref={wrapRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerEnter={() => (st.current.hover = true)}
            onPointerLeave={() => {
                st.current.hover = false
                st.current.px = -1
                st.current.py = -1
                endDrag()
            }}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                borderRadius: radius,
                cursor: props.draggable ? "grab" : "default",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                    pointerEvents: "none",
                }}
            />
            {arrows && (
                <>
                    <button
                        aria-label="Previous"
                        style={arrowBtn(-1)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => step(-1)}
                    >
                        {chevron(-1)}
                    </button>
                    <button
                        aria-label="Next"
                        style={arrowBtn(1)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => step(1)}
                    >
                        {chevron(1)}
                    </button>
                </>
            )}
        </div>
    )
}

CurvedMediaCarousel.defaultProps = {
    width: 1000,
    height: 600,
    images: [],
    animateInEditor: false,
}

const n = (
    title: string,
    defaultValue: number,
    min: number,
    max: number,
    step = 1,
    extra: any = {}
) => ({
    type: ControlType.Number as const,
    title,
    defaultValue,
    min,
    max,
    step,
    ...extra,
})
const b = (title: string, defaultValue: boolean) => ({
    type: ControlType.Boolean as const,
    title,
    defaultValue,
})
const c = (title: string, defaultValue: string) => ({
    type: ControlType.Color as const,
    title,
    defaultValue,
})

addPropertyControls(CurvedMediaCarousel, {
    images: {
        type: ControlType.Array,
        title: "Images",
        maxCount: 10,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.Image, title: "Image / Poster" },
                video: {
                    type: ControlType.File,
                    title: "Video Upload",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
                },
                videoUrl: {
                    type: ControlType.String,
                    title: "Video URL",
                    placeholder: "https://…/clip.mp4",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "",
                },
            },
        },
    },

    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            cardHeight: n("Card Height", 42, 10, 100, 1, { unit: "%" }),
            aspect: n("Aspect (W/H)", 1, 0.3, 2.5, 0.05),
            gap: n("Gap", 12, 0, 120, 1, { unit: "px" }),
            cardRadius: n("Card Radius", 0, 0, 120, 1, { unit: "px" }),
            imageZoom: n("Image Zoom", 1, 1, 3, 0.05),
            offsetY: n("Vertical Offset", 0, -400, 400, 1, { unit: "px" }),
        },
    },

    curve: {
        type: ControlType.Object,
        title: "Curve",
        controls: {
            curve: n("Amount", 0.8, -0.9, 3, 0.05, {
                description:
                    "Positive: edges grow (concave). Negative: edges shrink (convex).",
            }),
            power: n("Shape", 2, 0.5, 6, 0.1, {
                description:
                    "1 = linear ramp, 2 = parabola, higher = sharper edges.",
            }),
            slant: n("Slant", 0, -30, 30, 0.5, { unit: "°" }),
            smoothness: n("Column Size", 2, 1, 8, 1, {
                unit: "px",
                description: "Lower = smoother curve, higher = faster.",
            }),
        },
    },

    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            background: c("Background", "#EFEFEF"),
            radius: {
                type: ControlType.BorderRadius,
                title: "Radius",
                defaultValue: "40px",
            },
            edgeShade: n("Edge Fade", 0, 0, 1, 0.05),
            shadeColor: c("Fade Color", "#EFEFEF"),
        },
    },

    motion: {
        type: ControlType.Object,
        title: "Motion",
        controls: {
            autoplay: b("Autoplay", true),
            speed: n("Speed", 40, 0, 400, 5, { unit: "px/s" }),
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
            },
            pauseOnHover: b("Pause on Hover", true),
        },
    },

    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            draggable: b("Draggable", true),
            inertia: b("Inertia", true),
            friction: n("Friction", 3, 0.5, 10, 0.1),
            dragSensitivity: n("Drag Speed", 1, 0.2, 3, 0.1),
            snap: b("Snap to Card", false),
            wheel: b("Trackpad Scroll", true),
        },
    },

    media: {
        type: ControlType.Object,
        title: "Media",
        controls: {
            loopMode: {
                type: ControlType.Enum,
                title: "Repeat",
                options: ["finite", "loop"],
                optionTitles: ["No Repeat", "Loop"],
                displaySegmentedControl: true,
                defaultValue: "finite",
                description:
                    "No Repeat shows each item once (bounces at the ends). Loop wraps endlessly and repeats items to fill the width.",
            },
            videoPlay: {
                type: ControlType.Enum,
                title: "Play Videos",
                options: ["always", "active"],
                optionTitles: ["All", "Centered"],
                displaySegmentedControl: true,
                defaultValue: "always",
            },
        },
    },

    hoverFx: {
        type: ControlType.Object,
        title: "Hover",
        controls: {
            hoverEnabled: b("Scale on Hover", true),
            hoverScale: n("Scale", 1.12, 1, 1.8, 0.01),
            hoverDuration: n("Speed", 300, 50, 1200, 10, { unit: "ms" }),
            hoverDim: n("Dim Others", 0, 0, 0.8, 0.05),
        },
    },

    arrowsGroup: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            arrows: b("Show Arrows", false),
            arrowSize: n("Size", 44, 24, 96, 1, { unit: "px" }),
            arrowOffset: n("Inset", 20, 0, 120, 1, { unit: "px" }),
            arrowBg: c("Background", "rgba(255,255,255,0.92)"),
            arrowColor: c("Icon", "#111111"),
        },
    },

    animateInEditor: {
        type: ControlType.Boolean,
        title: "Animate in Editor",
        defaultValue: false,
        description: "\n\n[More Components](https://framer.link/DqwW3uJ)",
    },
})
