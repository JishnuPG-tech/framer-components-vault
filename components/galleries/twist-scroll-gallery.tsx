/**
 * Twisted Scroll Tiles — Framer code component
 *
 * A direct port of the "threejs_scroll_driven_tiles_20_rows" preview.
 * Rows of images (2 per row) stay still until you scroll inside the
 * component (mouse wheel, trackpad, or drag / swipe). Scrolling moves the
 * images up: they enter at the bottom small and pinched from both sides
 * and open into flat images by the middle of the screen. The scroll is
 * finite — it starts at the first row and stops after the last row.
 *
 * Scroll input works exactly like the preview:
 *  - wheel: wheel deltaY drives the offset (same sign as the preview)
 *  - drag / swipe: (previous Y - current Y) drives the offset
 *
 * Accessibility: in Inside mode the gallery is focusable (Tab) and can be
 * moved with the keyboard — Arrow Up/Down (one row), Page Up/Down and
 * Space (one screen), Home/End (first/last row).
 *
 * Three.js is imported from the "three" package (bundled by Framer).
 * Images that fail to load fall back to a neutral tile.
 */
import { useRef, useState, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "three"

// Horizontal positions from the reference layout (same as the preview)
const XS = [
    0.312, 0.814, 0.061, 0.69, 0.187, 0.563, 0.312, 0.941, 0.061, 0.814, 0.186,
    0.69,
]
const PAL = [
    ["#cfc9bd", "#8a4b2f", "#f2efe9"],
    ["#0f7f8c", "#d92b2b", "#1d1d1f"],
    ["#d8b48a", "#8c6a45", "#f3e6d2"],
    ["#8a4a3a", "#c8402e", "#2b1a17"],
    ["#14505f", "#e0242f", "#0c2a33"],
    ["#2b3a6b", "#2fd0e0", "#e255b8"],
    ["#6b0c10", "#ff4b3e", "#1a0507"],
    ["#d9d9d9", "#555555", "#f5f5f5"],
    ["#e08a2e", "#7a3a12", "#f6c35c"],
    ["#0c0c10", "#e8b020", "#2a2a30"],
    ["#d11fa0", "#2a0f3a", "#ff7ad6"],
    ["#c8a46a", "#5a3c22", "#e9d7b0"],
]
const FOV = 45
// Scroll hint animation: scroll-wheel dot drops, chevrons cascade downward
const HINT_CSS = `
@keyframes tstDot { 0% { opacity: 0; transform: translateY(-2px); } 20% { opacity: 1; } 75% { opacity: 0; transform: translateY(9px); } 100% { opacity: 0; transform: translateY(9px); } }
@keyframes tstChev { 0%, 100% { opacity: var(--o); } 40% { opacity: 1; } }
.tst-dot { animation: tstDot 1.8s ease-in-out infinite; }
.tst-chev { animation: tstChev 1.8s ease-in-out infinite; }
.tst-c1 { --o: 0.85; opacity: 0.85; animation-delay: 0s; }
.tst-c2 { --o: 0.5; opacity: 0.5; animation-delay: 0.2s; }
.tst-c3 { --o: 0.22; opacity: 0.22; animation-delay: 0.4s; }
@media (prefers-reduced-motion: reduce) { .tst-dot, .tst-chev { animation: none; } }
`
// Visible focus ring for keyboard users only
const FOCUS_CSS = `
[data-tst-gallery]:focus { outline: none; }
[data-tst-gallery]:focus-visible { outline: 2px solid #2a78d6; outline-offset: -4px; }
`
const SR_ONLY: any = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    border: 0,
}
const CAM_Z = 10
const SEG = 20

const normX = (i: number) => (XS[i % 12] - 0.061) / (0.941 - 0.061)

function smooth(a: number, b: number, x: number) {
    const t = Math.min(1, Math.max(0, (x - a) / Math.max(1e-4, b - a)))
    return t * t * (3 - 2 * t)
}

// Newer three.js versions colour-manage textures: mark images as sRGB so
// they look exactly like the original files.
function setSRGB(t: any) {
    const T: any = THREE
    if (T.SRGBColorSpace !== undefined) t.colorSpace = T.SRGBColorSpace
}

function placeholderTex(p: string[]) {
    const c = document.createElement("canvas")
    c.width = c.height = 128
    const g = c.getContext("2d")!
    g.fillStyle = p[0]
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = p[2]
    g.fillRect(92, 0, 36, 128)
    g.fillStyle = p[1]
    g.fillRect(36, 68, 56, 60)
    g.fillStyle = p[2]
    g.beginPath()
    g.arc(64, 46, 17, 0, 7)
    g.fill()
    const t = new THREE.CanvasTexture(c)
    setSRGB(t)
    t.userData = { aspect: 1 }
    return t
}

// Stable fallback shown while an image loads, and kept if it fails
function neutralTex(color: string) {
    const c = document.createElement("canvas")
    c.width = c.height = 4
    const g = c.getContext("2d")!
    g.fillStyle = color
    g.fillRect(0, 0, 4, 4)
    const t = new THREE.CanvasTexture(c)
    setSRGB(t)
    t.userData = { aspect: 1 }
    return t
}

// Loads one image; calls done(texture) on success or done(null) on failure
function loadImageTex(src: string, done: (t: any) => void) {
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin("anonymous")
    let finished = false
    const finish = (t: any) => {
        if (finished) return
        finished = true
        done(t)
    }
    try {
        loader.load(
            src,
            (tex: any) => {
                const img = tex.image
                if (!img || !img.width) {
                    tex.dispose()
                    finish(null)
                    return
                }
                setSRGB(tex)
                tex.minFilter = THREE.LinearFilter
                tex.generateMipmaps = false
                tex.userData = { aspect: img.width / Math.max(1, img.height) }
                finish(tex)
            },
            undefined,
            () => finish(null)
        )
    } catch (_) {
        finish(null)
    }
}

// Live sites can hand over missing / empty values for controls that were
// added after the instance was placed — fall back to the defaults.
const num = (v: any, d: number) =>
    typeof v === "number" && isFinite(v) ? v : d

// All sizes are converted from px to the preview's world units
function metrics(p: any, e: any) {
    const visH = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z
    const visW = visH * (e.W / e.H)
    const pxU = e.H / visH // pixels per world unit
    const size = num(p.imageSize, 120)
    const S = size / pxU
    const gap = (size + num(p.rowGap, 34)) / pxU
    const span = visH + S
    const pad = num(p.sidePadding, 5) / pxU
    const lo = -visW / 2 + S / 2 + pad
    const hi = visW / 2 - S / 2 - pad
    const startFilled = p.startFilled !== false
    const endAtCenter = p.endAtCenter !== false
    // start position: first row's top edge sits "Top Padding" px below the top
    const topPad = num(p.topPadding, 50) / pxU
    const minOff = startFilled ? Math.max(0, visH - topPad) : 0
    const maxOff = Math.max(
        minOff + 0.01,
        (num(p.rows, 20) - 1) * gap + (endAtCenter ? span * 0.62 : span)
    )
    return { visH, visW, pxU, S, gap, span, lo, hi, minOff, maxOff }
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 800
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function TwistedScrollTiles(props: any) {
    const {
        images,
        rows,
        background,
        showHint,
        hintColor,
        showProgress,
        progressColor,
        trackColor,
        scrollMode,
        style,
    } = props
    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null) // outer box (tall in Page mode)
    const stageRef = useRef<HTMLDivElement>(null) // visible area (sticky in Page mode)
    const canvasHostRef = useRef<HTMLDivElement>(null) // empty div only for the WebGL canvas
    const hintRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const engineRef = useRef<any>(null)
    // scroll position lives outside the scene so a rebuild never resets it to the top
    const scrollRef = useRef<{ target: number | null; current: number | null }>(
        { target: null, current: null }
    )
    const propsRef = useRef(props)
    propsRef.current = props
    const [inView, setInView] = useState(false)
    const [buildId, setBuildId] = useState(0)
    const [webglFailed, setWebglFailed] = useState(false)
    const pageMode = scrollMode === "page"
    const descId = useRef(
        "tst-desc-" + Math.random().toString(36).slice(2, 9)
    ).current

    const imagesKey = (images || []).map((i: any) => i?.src || "").join("|")

    // --- Viewport detection ---
    useEffect(() => {
        if (isStatic) return
        const el = containerRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isStatic])

    // --- Build the WebGL scene ---
    useEffect(() => {
        if (isStatic) return
        const host = canvasHostRef.current
        if (!host) return

        let renderer: any
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        } catch (_) {
            setWebglFailed(true) // no WebGL → show the flat layout instead
            return
        }
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
        const canvas = renderer.domElement
        Object.assign(canvas.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            display: "block",
        })
        canvas.setAttribute("aria-hidden", "true")
        host.appendChild(canvas)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
        camera.position.z = CAM_Z

        const e: any = {
            renderer,
            scene,
            camera,
            meshes: [],
            textures: [],
            W: 1,
            H: 1,
            dirty: true,
            hinted: false,
            lastWheel: 0,
            get target() {
                return scrollRef.current.target
            },
            set target(v: number | null) {
                scrollRef.current.target = v
            },
            get current() {
                return scrollRef.current.current
            },
            set current(v: number | null) {
                scrollRef.current.current = v
            },
        }

        const resize = () => {
            const w = host.clientWidth
            const h = host.clientHeight
            if (!w || !h) return // not laid out yet (happens on live sites during load)
            e.W = w
            e.H = h
            renderer.setSize(e.W, e.H, false)
            camera.aspect = e.W / e.H
            camera.updateProjectionMatrix()
            e.dirty = true
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(host)

        const srcs = (images || []).map((i: any) => i?.src).filter(Boolean)
        const fallback = neutralTex("#e9e9e7")
        e.textures = srcs.length ? [fallback] : PAL.map(placeholderTex)
        // one slot per image: meshes start on the fallback, swap when loaded
        const slots: any[] = srcs.map(() => ({ meshes: [] as any[] }))
        let disposed = false

        const total = Math.max(1, Math.round(num(rows, 20))) * 2
        for (let i = 0; i < total; i++) {
            const geo = new THREE.PlaneGeometry(1, 1, SEG, SEG)
            geo.userData.base = Float32Array.from(geo.attributes.position.array)
            const tex = srcs.length
                ? fallback
                : e.textures[(i * 5) % e.textures.length]
            const m = new THREE.Mesh(
                geo,
                new THREE.MeshBasicMaterial({
                    map: tex,
                    side: THREE.DoubleSide,
                })
            )
            m.userData = { row: i >> 1, dir: i % 2 ? 1 : -1, index: i }
            m.frustumCulled = false
            scene.add(m)
            e.meshes.push(m)
            if (srcs.length) slots[i % srcs.length].meshes.push(m)
        }

        srcs.forEach((src: string, k: number) => {
            loadImageTex(src, (tex) => {
                if (disposed) {
                    if (tex) tex.dispose()
                    return
                }
                if (!tex) {
                    // keep the neutral fallback tile for this image
                    console.warn(
                        "[TwistedScrollTiles] Image failed to load:",
                        src
                    )
                    e.dirty = true
                    return
                }
                e.textures.push(tex)
                slots[k].meshes.forEach((m: any) => {
                    m.material.map = tex
                    m.material.needsUpdate = true
                })
                e.dirty = true
            })
        })

        engineRef.current = e
        if (e.target !== null) e.hinted = true
        layout(e, propsRef.current, barRef.current)
        setBuildId((n) => n + 1)

        return () => {
            disposed = true
            ro.disconnect()
            e.meshes.forEach((m: any) => {
                m.geometry.dispose()
                m.material.dispose()
            })
            e.textures.forEach((t: any) => t.dispose())
            renderer.dispose()
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
            if (engineRef.current === e) engineRef.current = null
        }
    }, [isStatic, rows, imagesKey])

    // --- Input for "Inside" mode (wheel / drag / swipe on the component) ---
    useEffect(() => {
        if (isStatic || pageMode) return
        const wrap = containerRef.current
        if (!wrap) return

        const hideHint = (e: any) => {
            if (e.hinted) return
            e.hinted = true
            if (hintRef.current) hintRef.current.style.opacity = "0"
        }
        const push = (d: number) => {
            const e = engineRef.current
            if (!e) return false
            const p = propsRef.current
            const mt = metrics(p, e)
            const sign = p.reverse ? 1 : -1
            const cur = e.target ?? mt.minOff
            const next = Math.min(
                mt.maxOff,
                Math.max(
                    mt.minOff,
                    cur + d * sign * num(p.sensitivity, 5) * 0.0004
                )
            )
            e.target = next
            e.dirty = true
            hideHint(e)
            return Math.abs(next - cur) > 1e-6
        }

        // On live sites Framer's smooth scroll also listens to the wheel and
        // moves the page at the same time — stopPropagation keeps it out.
        const onWheel = (ev: WheelEvent) => {
            const e = engineRef.current
            if (!e) return
            let d = ev.deltaY
            if (ev.deltaMode === 1) d *= 16
            else if (ev.deltaMode === 2) d *= e.H
            const now = performance.now()
            const sincePrev = now - e.lastWheel
            e.lastWheel = now
            if (push(d)) {
                ev.preventDefault()
                ev.stopPropagation()
                return
            }
            const p = propsRef.current
            const settled =
                e.current !== null && Math.abs(e.target - e.current) < 0.01
            const release = p.releaseAtEnd && settled && sincePrev > 350
            if (!release) {
                ev.preventDefault()
                ev.stopPropagation()
            }
        }

        let lastY: number | null = null
        const onDown = (ev: PointerEvent) => {
            lastY = ev.clientY
            try {
                wrap.setPointerCapture(ev.pointerId)
            } catch (_) {}
        }
        const onMove = (ev: PointerEvent) => {
            if (lastY === null) return
            push((lastY - ev.clientY) * 4)
            lastY = ev.clientY
        }
        const onUp = (ev: PointerEvent) => {
            lastY = null
            try {
                wrap.releasePointerCapture(ev.pointerId)
            } catch (_) {}
        }
        // stop the page / smooth scroll from also reacting to swipes
        const blockTouch = (ev: TouchEvent) => {
            ev.stopPropagation()
            if (ev.cancelable) ev.preventDefault()
        }

        wrap.addEventListener("wheel", onWheel, { passive: false })
        wrap.addEventListener("pointerdown", onDown)
        wrap.addEventListener("pointermove", onMove)
        wrap.addEventListener("pointerup", onUp)
        wrap.addEventListener("pointercancel", onUp)
        // Keyboard: same direction as scrolling the wheel down / up
        const moveBy = (dw: number) => {
            const e = engineRef.current
            if (!e) return false
            const p = propsRef.current
            const mt = metrics(p, e)
            const sign = p.reverse ? 1 : -1
            const cur = e.target ?? mt.minOff
            const next = Math.min(
                mt.maxOff,
                Math.max(mt.minOff, cur + dw * sign)
            )
            e.target = next
            e.dirty = true
            hideHint(e)
            return Math.abs(next - cur) > 1e-6
        }
        const jumpTo = (end: "first" | "last") => {
            const e = engineRef.current
            if (!e) return false
            const mt = metrics(propsRef.current, e)
            const sign = propsRef.current.reverse ? 1 : -1
            // "last" = as far as scrolling down goes, "first" = start
            const goMax = (end === "last") === sign > 0
            const next = goMax ? mt.maxOff : mt.minOff
            const moved = Math.abs((e.target ?? mt.minOff) - next) > 1e-6
            e.target = next
            e.dirty = true
            hideHint(e)
            return moved
        }
        const onKey = (ev: KeyboardEvent) => {
            if (ev.altKey || ev.ctrlKey || ev.metaKey) return
            const e = engineRef.current
            if (!e) return
            const mt = metrics(propsRef.current, e)
            let handled = false
            switch (ev.key) {
                case "ArrowDown":
                case "Down":
                    handled = moveBy(mt.gap)
                    break
                case "ArrowUp":
                case "Up":
                    handled = moveBy(-mt.gap)
                    break
                case "PageDown":
                    handled = moveBy(mt.visH * 0.8)
                    break
                case "PageUp":
                    handled = moveBy(-mt.visH * 0.8)
                    break
                case " ":
                case "Spacebar":
                    handled = moveBy((ev.shiftKey ? -1 : 1) * mt.visH * 0.8)
                    break
                case "Home":
                    handled = jumpTo("first")
                    break
                case "End":
                    handled = jumpTo("last")
                    break
            }
            if (handled) ev.preventDefault()
        }

        wrap.addEventListener("keydown", onKey)
        wrap.addEventListener("touchmove", blockTouch, { passive: false })
        return () => {
            wrap.removeEventListener("wheel", onWheel)
            wrap.removeEventListener("pointerdown", onDown)
            wrap.removeEventListener("pointermove", onMove)
            wrap.removeEventListener("pointerup", onUp)
            wrap.removeEventListener("pointercancel", onUp)
            wrap.removeEventListener("touchmove", blockTouch)
            wrap.removeEventListener("keydown", onKey)
        }
    }, [isStatic, pageMode, buildId])

    // Any prop change → redraw
    useEffect(() => {
        if (engineRef.current) engineRef.current.dirty = true
    })

    // --- Animation loop: only while visible ---
    useEffect(() => {
        if (isStatic || !inView) return
        let raf = 0
        const frame = () => {
            const e = engineRef.current
            const outer = containerRef.current
            const stage = stageRef.current
            if (e && outer && stage) {
                const p = propsRef.current
                const mt = metrics(p, e)
                if (pageMode) {
                    // Page mode: progress through the tall component = progress through the rows
                    const rect = outer.getBoundingClientRect()
                    const scrollable = rect.height - stage.clientHeight
                    const prog =
                        scrollable > 0
                            ? Math.min(1, Math.max(0, -rect.top / scrollable))
                            : 0
                    // page scrolling down always moves the images up and opens them
                    e.target = mt.minOff + prog * (mt.maxOff - mt.minOff)
                    if (prog > 0.001 && !e.hinted) {
                        e.hinted = true
                        if (hintRef.current) hintRef.current.style.opacity = "0"
                    }
                }
                if (e.target === null) e.target = mt.minOff
                if (e.current === null) {
                    e.current = e.target
                    e.dirty = true
                }
                e.target = Math.min(mt.maxOff, Math.max(mt.minOff, e.target))
                const diff = e.target - e.current
                if (Math.abs(diff) > 0.00002) {
                    e.current += diff * num(p.smoothing, 0.09)
                    e.dirty = true
                }
                // Which part of the gallery is really on screen? On live pages
                // the component can be taller than the window or partly
                // scrolled away, so the twist zone (bottom of the screen) is
                // measured from what the visitor actually sees.
                const r = stage.getBoundingClientRect()
                const vh = window.innerHeight || r.height
                const visTop = Math.max(r.top, 0)
                const visBot = Math.min(r.bottom, vh)
                const visPx = visBot - visTop
                const band =
                    visPx > 120
                        ? { hidden: Math.max(0, r.bottom - visBot), vis: visPx }
                        : { hidden: 0, vis: r.height }
                if (
                    !e.band ||
                    Math.abs(e.band.hidden - band.hidden) > 0.5 ||
                    Math.abs(e.band.vis - band.vis) > 0.5
                ) {
                    e.band = band
                    e.dirty = true
                }
                if (e.dirty) {
                    layout(e, p, barRef.current)
                    e.dirty = false
                }
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [isStatic, inView, buildId, pageMode])

    // --- Static canvas preview ---
    if (isStatic || webglFailed) {
        const p = props
        const H = p.height || 800
        const W = p.width || 1000
        const pitch = p.imageSize + p.rowGap
        const usable = Math.max(0, W - 2 * p.sidePadding - p.imageSize)
        const srcs = (images || []).map((i: any) => i?.src).filter(Boolean)
        const n = Math.min(p.rows, Math.ceil(Math.min(H, 1200) / pitch) + 1) * 2
        const tiles = []
        for (let i = 0; i < n; i++) {
            const c = PAL[(i * 5) % 12]
            tiles.push(
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: p.sidePadding + normX(i) * usable,
                        top: num(p.topPadding, 50) + (i >> 1) * pitch,
                        width: p.imageSize,
                        height: p.imageSize,
                        background: srcs.length
                            ? `center / cover no-repeat url(${srcs[i % srcs.length]})`
                            : `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
                    }}
                />
            )
        }
        return (
            <div
                style={{
                    ...style,
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    overflow: "hidden",
                    background,
                }}
            >
                {tiles}
                <div
                    style={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        fontFamily: "sans-serif",
                        fontSize: 12,
                        color: "#888",
                        background: "rgba(255,255,255,0.85)",
                        padding: "4px 10px",
                        borderRadius: 999,
                    }}
                >
                    Twisted Scroll Tiles ·{" "}
                    {pageMode ? "Page scroll" : "Inside scroll"}
                </div>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            data-lenis-prevent={pageMode ? undefined : ""}
            data-tst-gallery=""
            role="region"
            aria-roledescription="scrolling image gallery"
            aria-label={props.ariaLabel || "Image gallery"}
            aria-describedby={descId}
            tabIndex={pageMode ? undefined : 0}
            style={{
                ...style,
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: pageMode ? "visible" : "hidden", // hidden would break sticky
                background,
                touchAction: pageMode ? "auto" : "none",
                overscrollBehavior: pageMode ? "auto" : "contain",
                cursor: pageMode ? "auto" : "ns-resize",
            }}
        >
            <style>{FOCUS_CSS}</style>
            <span id={descId} style={SR_ONLY}>
                {pageMode
                    ? "Scroll the page to move through the images."
                    : "Scroll, swipe, or use the arrow keys, Page Up, Page Down, Home and End to move through the images."}
            </span>
            <div
                ref={stageRef}
                style={{
                    position: pageMode ? "sticky" : "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: pageMode ? "100vh" : "100%",
                    maxHeight: "100%",
                    overflow: "hidden",
                }}
            >
                <div
                    ref={canvasHostRef}
                    style={{ position: "absolute", inset: 0 }}
                />
                {showHint && (
                    <div
                        ref={hintRef}
                        style={{
                            position: "absolute",
                            right: num(props.hintRight, 32),
                            bottom: num(props.hintOffset, 32),
                            pointerEvents: "none",
                            transition: "opacity .5s ease",
                            zIndex: 2,
                        }}
                    >
                        <style>{HINT_CSS}</style>
                        <svg
                            width={num(props.arrowSize, 72) * (30 / 64)}
                            height={num(props.arrowSize, 72)}
                            viewBox="0 0 30 64"
                            fill="none"
                            stroke={hintColor}
                            strokeWidth={num(props.arrowStroke, 2)}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ display: "block", overflow: "visible" }}
                            aria-hidden="true"
                        >
                            {/* mouse */}
                            <rect x="4" y="1" width="22" height="34" rx="11" />
                            <circle
                                className="tst-dot"
                                cx="15"
                                cy="10"
                                r="2.2"
                                fill={hintColor}
                                stroke="none"
                            />
                            {/* cascading chevrons */}
                            <polyline
                                className="tst-chev tst-c1"
                                points="8,43 15,49 22,43"
                            />
                            <polyline
                                className="tst-chev tst-c2"
                                points="8,50 15,56 22,50"
                            />
                            <polyline
                                className="tst-chev tst-c3"
                                points="8,57 15,63 22,57"
                            />
                        </svg>
                    </div>
                )}
                {showProgress && (
                    <div
                        style={{
                            position: "absolute",
                            right: 8,
                            top: 14,
                            bottom: 14,
                            width: 3,
                            background: trackColor,
                            borderRadius: 3,
                            zIndex: 2,
                            pointerEvents: "none",
                        }}
                    >
                        <div
                            ref={barRef}
                            style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: 0,
                                height: "0%",
                                background: progressColor,
                                borderRadius: 3,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// Same layout + twist maths as the preview
function layout(e: any, p: any, bar: HTMLDivElement | null) {
    const mt = metrics(p, e)
    const { visH, S, gap, span, lo, hi } = mt
    const current = e.current ?? mt.minOff
    const twi = num(p.twist, 8)
    const shr = num(p.shrink, 4)
    const openPoint = num(p.openPoint, 0.5)
    const band = e.band || { hidden: 0, vis: e.H }
    const sizePx = mt.S * mt.pxU
    const tileAspect = 1

    for (const m of e.meshes) {
        const { row, dir, index } = m.userData
        const t = (current - row * gap) / span
        if (t < 0 || t > 1) {
            m.visible = false
            continue
        }
        m.visible = true
        const d = p.mirror === false ? 1 : dir
        m.position.set(
            lo + normX(index) * (hi - lo),
            -visH / 2 - S / 2 + t * span,
            0
        )

        // tile centre measured from the bottom of the VISIBLE area
        const cyPx = (t * span - S / 2) * mt.pxU - band.hidden
        const tScreen = (cyPx + sizePx / 2) / (band.vis + sizePx)
        const open = 1 - smooth(0, openPoint, tScreen)
        const k = open * (twi / 10)
        const sc = 1 - open * (shr / 10) * 0.75

        const pos = m.geometry.attributes.position
        const b = m.geometry.userData.base
        const h = S / 2
        for (let j = 0; j < pos.count; j++) {
            const x = b[j * 3] * S
            const y = b[j * 3 + 1] * S
            const v = (y + h) / S
            const w = 1 - v
            const u = x / h
            const pinch =
                1 -
                k * 0.62 * Math.pow(w, 1.2) -
                k * 0.1 * Math.sin(v * Math.PI)
            const squash = 1 - k * 0.42 * w
            const tilt = k * 0.2 * S * u * (v - 0.5) * d
            const ex = x * pinch + d * k * 0.06 * S * w
            const ey =
                (y + h) * squash - h + tilt - k * 0.18 * S * w * (1 - u * u)
            const ez = k * 0.55 * S * u * w * Math.sin(v * Math.PI) * d
            pos.array[j * 3] = ex * sc
            pos.array[j * 3 + 1] = ey * sc
            pos.array[j * 3 + 2] = ez * sc
        }
        pos.needsUpdate = true
        m.rotation.z = k * 0.06 * d

        // object-fit: cover for real images
        const tex = m.material.map
        const ia = tex?.userData?.aspect || 1
        if (tex) {
            if (ia > tileAspect) {
                const r = tileAspect / ia
                tex.repeat.set(r, 1)
                tex.offset.set((1 - r) / 2, 0)
            } else {
                const r = ia / tileAspect
                tex.repeat.set(1, r)
                tex.offset.set(0, (1 - r) / 2)
            }
        }
    }

    if (bar) {
        const prog = (current - mt.minOff) / (mt.maxOff - mt.minOff)
        bar.style.height = Math.max(0, Math.min(1, prog)) * 100 + "%"
    }
    e.renderer.render(e.scene, e.camera)
}

TwistedScrollTiles.defaultProps = {
    width: 1000,
    height: 800,
    images: [],
    rows: 20,
    imageSize: 120,
    rowGap: 34,
    sidePadding: 5,
    topPadding: 50,
    twist: 8,
    shrink: 4,
    openPoint: 0.5,
    mirror: true,
    sensitivity: 5,
    smoothing: 0.09,
    reverse: true,
    startFilled: true,
    endAtCenter: true,
    releaseAtEnd: false,
    scrollMode: "inside",
    background: "#ffffff",
    ariaLabel: "Image gallery",
    showHint: true,
    hintColor: "#000000",
    arrowSize: 72,
    arrowStroke: 2,
    hintOffset: 32,
    hintRight: 32,
    showProgress: true,
    progressColor: "#555555",
    trackColor: "rgba(0,0,0,0.1)",
}

addPropertyControls(TwistedScrollTiles, {
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        maxCount: 80,
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        min: 1,
        max: 60,
        step: 1,
        displayStepper: true,
        defaultValue: 20,
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 40,
        max: 500,
        step: 2,
        unit: "px",
        defaultValue: 120,
    },
    rowGap: {
        type: ControlType.Number,
        title: "Row Spacing",
        min: 0,
        max: 500,
        step: 2,
        unit: "px",
        defaultValue: 34,
    },
    sidePadding: {
        type: ControlType.Number,
        title: "Side Padding",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: 5,
    },
    topPadding: {
        type: ControlType.Number,
        title: "Top Padding",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 50,
        description: "Space above the first row at the start.",
    },
    twist: {
        type: ControlType.Number,
        title: "Twist",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 8,
    },
    shrink: {
        type: ControlType.Number,
        title: "Shrink",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 4,
        description: "How small images are when they enter at the bottom.",
    },
    openPoint: {
        type: ControlType.Number,
        title: "Open Point",
        min: 0.2,
        max: 1,
        step: 0.05,
        defaultValue: 0.5,
        description:
            "Where images are fully open (0.5 = middle of the screen).",
    },
    mirror: {
        type: ControlType.Boolean,
        title: "Mirror Sides",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    scrollMode: {
        type: ControlType.Enum,
        title: "Scroll Mode",
        options: ["inside", "page"],
        optionTitles: ["Inside", "Page"],
        displaySegmentedControl: true,
        defaultValue: "inside",
        description:
            "Page: best for live sites. Make the component tall (e.g. 4000px) — the gallery sticks to the screen and plays as the page scrolls.",
    },
    sensitivity: {
        type: ControlType.Number,
        title: "Scroll Feel",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 5,
        hidden: (p: any) => p.scrollMode === "page",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.01,
        defaultValue: 0.09,
        description: "Lower = smoother, floatier motion.",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        enabledTitle: "On",
        disabledTitle: "Off",
        defaultValue: true,
        description:
            "On: scrolling / swiping down opens the images. Turn Off if it feels backwards.",
        hidden: (p: any) => p.scrollMode === "page",
    },
    startFilled: {
        type: ControlType.Boolean,
        title: "Start Filled",
        enabledTitle: "Yes",
        disabledTitle: "No",
        defaultValue: true,
    },
    endAtCenter: {
        type: ControlType.Boolean,
        title: "End",
        enabledTitle: "At Centre",
        disabledTitle: "Off Top",
        defaultValue: true,
    },
    releaseAtEnd: {
        type: ControlType.Boolean,
        title: "Page Scroll",
        enabledTitle: "At Ends",
        disabledTitle: "Never",
        defaultValue: false,
        description:
            "At Ends: after the last row, pause and scroll again to continue down the page.",
        hidden: (p: any) => p.scrollMode === "page",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#ffffff",
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Accessible Name",
        defaultValue: "Image gallery",
        description: "Read out by screen readers.",
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Scroll Arrow",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Arrow Color",
        defaultValue: "#000000",
        hidden: (p: any) => !p.showHint,
    },
    arrowSize: {
        type: ControlType.Number,
        title: "Arrow Size",
        min: 30,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 72,
        hidden: (p: any) => !p.showHint,
    },
    arrowStroke: {
        type: ControlType.Number,
        title: "Arrow Weight",
        min: 0.5,
        max: 5,
        step: 0.25,
        defaultValue: 2,
        hidden: (p: any) => !p.showHint,
    },
    hintOffset: {
        type: ControlType.Number,
        title: "Arrow Bottom",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: 32,
        hidden: (p: any) => !p.showHint,
    },
    hintRight: {
        type: ControlType.Number,
        title: "Arrow Right",
        min: 0,
        max: 300,
        step: 1,
        unit: "px",
        defaultValue: 32,
        hidden: (p: any) => !p.showHint,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Scroll Bar",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: true,
    },
    progressColor: {
        type: ControlType.Color,
        title: "Bar Color",
        defaultValue: "#555555",
        hidden: (p: any) => !p.showProgress,
    },
    trackColor: {
        type: ControlType.Color,
        title: "Track Color",
        defaultValue: "rgba(0,0,0,0.1)",
        hidden: (p: any) => !p.showProgress,
    },
})
