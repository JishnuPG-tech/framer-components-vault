import * as React from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export interface Props {
    width?: number | string
    height?: number | string
    cursor: "default" | "pointer" | "crosshair" | "none"
    grid: {
        cellSize: number
        gap: number
        cornerRadius: number
        lineWidth: number
        lineColor: string
        lineOpacity: number
        majorEvery: number
        majorLineWidth: number
        majorLineColor: string
        majorLineOpacity: number
    }
    tile: {
        faceColor: string
        faceOpacity: number
        faceLight: string
        faceShade: string
        faceGrad: number
        sheen: number
        highlightColor: string // LIGHT COLOR: rim, glow, sheen, bloom, cursor shine
        highlightOpacity: number
        shadeColor: string
        shadeOpacity: number
        raise: number
        scale: number
        brighten: number
        cursorShine: number
    }
    shadow: {
        color: string
        recess: number
        ambientOpacity: number
        ambientGrow: number
        contactOpacity: number
        contactGrow: number
        blur: number
        offsetX: number
        offsetY: number
        soften: number
    }
    wave: {
        enabled: boolean
        amplitude: number
        speed: number
        falloff: number
        duration: number
        dip: number
        impact: number
        pressRadius: number
        maxWaves: number
    }
    tint: {
        enabled: boolean
        color: string
        strength: number
        falloff: number
        duration: number
    }
    hover: { enabled: boolean; radius: number; lift: number; smoothing: number }
    demo: { enabled: boolean; interval: number; strength: number }
    background: {
        gradient: boolean
        topColor: string
        bottomColor: string
        angle: number
        baseColor: string
        vignette: boolean
        vignetteColor: string
        vignetteStrength: number
    }
    performance: { dprCap: number }
}

interface Wave {
    x: number
    y: number
    t0: number
    s: number
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const gauss = (x: number, c: number, w: number) =>
    Math.exp(-((x - c) * (x - c)) / (2 * w * w))
const smoothstep = (t: number) => t * t * (3 - 2 * t)

function rgba(color: string, opacity: number): string {
    if (color.startsWith("#")) {
        let h = color.slice(1)
        if (h.length === 3)
            h = h
                .split("")
                .map((c) => c + c)
                .join("")
        const r = parseInt(h.slice(0, 2), 16)
        const g = parseInt(h.slice(2, 4), 16)
        const b = parseInt(h.slice(4, 6), 16)
        const a = h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
        return `rgba(${r}, ${g}, ${b}, ${clamp(a * opacity, 0, 1).toFixed(3)})`
    }
    const m = color.match(/rgba?\(([^)]+)\)/)
    if (m) {
        const p = m[1].split(",").map(parseFloat)
        return `rgba(${p[0]}, ${p[1]}, ${p[2]}, ${clamp((p[3] ?? 1) * opacity, 0, 1).toFixed(3)})`
    }
    return color
}

function rr(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const rad = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rad, y)
    ctx.arcTo(x + w, y, x + w, y + h, rad)
    ctx.arcTo(x + w, y + h, x, y + h, rad)
    ctx.arcTo(x, y + h, x, y, rad)
    ctx.arcTo(x, y, x + w, y, rad)
    ctx.closePath()
}

function makeCanvas(cssW: number, cssH: number, ss: number) {
    const c = document.createElement("canvas")
    c.width = Math.max(1, Math.ceil(cssW * ss))
    c.height = Math.max(1, Math.ceil(cssH * ss))
    const x = c.getContext("2d")!
    x.setTransform(ss, 0, 0, ss, 0, 0)
    return { c, x }
}

function Tron_Tiles(props: Props) {
    const wrapRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const propsRef = React.useRef(props)
    propsRef.current = props
    const isStatic = useIsStaticRenderer()

    const stRef = React.useRef({
        waves: [] as Wave[],
        stains: [] as Wave[],
        px: 0,
        py: 0,
        active: false,
        sx: 0,
        sy: 0,
        hoverFade: 0,
        lastDown: -1,
        lastTime: -1,
        dpr: 1,
        w: 0,
        h: 0,
        cols: 0,
        rows: 0,
        lifts: new Float32Array(0),
        tints: new Float32Array(0),
        order: [] as number[],
        dips: [] as number[],
        staticCanvas: null as HTMLCanvasElement | null,
        staticKey: "",
        sprite: null as { c: HTMLCanvasElement; cssW: number } | null,
        spriteKey: "",
        restSpr: null as { c: HTMLCanvasElement } | null,
        restKey: "",
        liftSpr: null as { c: HTMLCanvasElement } | null,
        liftKey: "",
        tintSpr: null as { c: HTMLCanvasElement } | null,
        tintKey: "",
        dirty: true,
        wasDynamic: false,
        visible: true,
        handleProps: null as null | (() => void),
    })

    /* ------------------------- sprites ------------------------- */
    function rebuildRest(P: Props, st: any, ss: number) {
        const T = P.tile
        const size = P.grid.cellSize - P.grid.gap
        const cr = P.grid.cornerRadius
        const key = `r|${size}|${cr}|${ss}|${T.faceColor}|${T.faceLight}|${T.faceShade}|${T.faceGrad}|${T.faceOpacity}|${T.sheen}|${T.highlightColor}`
        if (key === st.restKey && st.restSpr) return
        st.restKey = key
        const { c, x } = makeCanvas(size + 4, size + 4, ss)
        const a = T.faceOpacity * 0.55
        const g = x.createLinearGradient(0, 2, 0, 2 + size)
        g.addColorStop(
            0,
            mixColor(
                rgba(T.faceColor, a),
                rgba(T.faceLight, a),
                0.5 * T.faceGrad
            )
        )
        g.addColorStop(0.55, rgba(T.faceColor, a))
        g.addColorStop(
            1,
            mixColor(
                rgba(T.faceColor, a),
                rgba(T.faceShade, a),
                0.6 * T.faceGrad
            )
        )
        x.fillStyle = g
        rr(x, 2, 2, size, size, cr)
        x.fill()
        glassRim(
            x,
            size,
            cr,
            0.5,
            0.05 + T.sheen * 0.05,
            T.shadeColor,
            T.highlightColor
        )
        st.restSpr = { c }
    }

    function rebuildLift(P: Props, st: any, ss: number) {
        const T = P.tile
        const size = P.grid.cellSize - P.grid.gap
        const cr = P.grid.cornerRadius
        const key = `l|${size}|${cr}|${ss}|${T.faceColor}|${T.faceLight}|${T.faceShade}|${T.faceGrad}|${T.faceOpacity}|${T.sheen}|${T.highlightColor}`
        if (key === st.liftKey && st.liftSpr) return
        st.liftKey = key
        const { c, x } = makeCanvas(size + 4, size + 4, ss)
        const a = T.faceOpacity * 0.88
        const g = x.createLinearGradient(0, 2, 0, 2 + size)
        g.addColorStop(
            0,
            mixColor(
                rgba(T.faceColor, a),
                rgba(T.faceLight, a),
                0.4 + T.faceGrad * 0.25
            )
        )
        g.addColorStop(
            0.5,
            mixColor(rgba(T.faceColor, a), rgba(T.faceLight, a), 0.16)
        )
        g.addColorStop(
            1,
            mixColor(rgba(T.faceColor, a), rgba(T.faceShade, a), 0.3)
        )
        x.fillStyle = g
        rr(x, 2, 2, size, size, cr)
        x.fill()
        if (T.sheen > 0.001) {
            const sg = x.createLinearGradient(0, 2, 0, 2 + size)
            sg.addColorStop(0, rgba(T.highlightColor, T.sheen * 0.5))
            sg.addColorStop(0.4, rgba(T.highlightColor, 0))
            x.fillStyle = sg
            rr(x, 2, 2, size, size, cr)
            x.fill()
        }
        glassRim(
            x,
            size,
            cr,
            0.95,
            0.1 + T.sheen * 0.07,
            T.shadeColor,
            T.highlightColor
        )
        st.liftSpr = { c }
    }

    function glassRim(
        x: CanvasRenderingContext2D,
        size: number,
        cr: number,
        rim: number,
        glow: number,
        shade: string,
        light: string
    ) {
        x.strokeStyle = rgba(light, glow)
        x.lineWidth = 1.75
        rr(x, 3.5, 3.5, size - 3, size - 3, Math.max(0, cr - 1.5))
        x.stroke()
        const rg = x.createLinearGradient(2, 2, 2 + size, 2 + size)
        rg.addColorStop(0, rgba(light, 0.95 * rim))
        rg.addColorStop(0.3, rgba(light, 0.35 * rim))
        rg.addColorStop(0.62, rgba(light, 0.12 * rim))
        rg.addColorStop(1, rgba(light, 0.42 * rim))
        x.strokeStyle = rg
        x.lineWidth = 1
        rr(x, 2.5, 2.5, size - 1, size - 1, Math.max(0, cr - 0.5))
        x.stroke()
        x.strokeStyle = rgba(shade, 0.14)
        x.lineWidth = 1
        rr(x, 1.5, 1.5, size + 1, size + 1, cr + 0.5)
        x.stroke()
    }

    function rebuildStatic(P: Props, st: any, dpr: number) {
        const key =
            JSON.stringify(P.grid) + `|${st.restKey}|${st.w}x${st.h}|${dpr}`
        if (key === st.staticKey && st.staticCanvas) return
        st.staticKey = key
        const c = document.createElement("canvas")
        c.width = Math.max(1, Math.round(st.w * dpr))
        c.height = Math.max(1, Math.round(st.h * dpr))
        const x = c.getContext("2d")!
        x.setTransform(dpr, 0, 0, dpr, 0, 0)
        const g = P.grid
        const size = g.cellSize - g.gap
        const off = g.gap / 2 - 2
        for (let j = 0; j <= st.rows; j++)
            for (let i = 0; i <= st.cols; i++)
                x.drawImage(
                    st.restSpr.c,
                    i * g.cellSize + off,
                    j * g.cellSize + off,
                    size + 4,
                    size + 4
                )
        if (g.lineWidth > 0 && g.lineOpacity > 0) {
            x.lineWidth = g.lineWidth
            x.strokeStyle = rgba(g.lineColor, g.lineOpacity)
            x.beginPath()
            for (let i = 0; i <= st.cols; i++) {
                const X = i * g.cellSize + 0.5
                x.moveTo(X, 0)
                x.lineTo(X, st.h)
            }
            for (let j = 0; j <= st.rows; j++) {
                const Y = j * g.cellSize + 0.5
                x.moveTo(0, Y)
                x.lineTo(st.w, Y)
            }
            x.stroke()
        }

        if (
            g.majorEvery > 1 &&
            g.majorLineWidth > 0 &&
            g.majorLineOpacity > 0
        ) {
            x.lineWidth = g.majorLineWidth
            x.strokeStyle = rgba(g.majorLineColor, g.majorLineOpacity)
            x.beginPath()
            for (let i = 0; i <= st.cols; i++)
                if (i % g.majorEvery === 0) {
                    const X = i * g.cellSize + 0.5
                    x.moveTo(X, 0)
                    x.lineTo(X, st.h)
                }
            for (let j = 0; j <= st.rows; j++)
                if (j % g.majorEvery === 0) {
                    const Y = j * g.cellSize + 0.5
                    x.moveTo(0, Y)
                    x.lineTo(st.w, Y)
                }
            x.stroke()
        }
        st.staticCanvas = c
    }

    function rebuildSprite(P: Props, st: any, ss: number) {
        const size = P.grid.cellSize - P.grid.gap
        const key = `${size}|${P.grid.cornerRadius}|${P.shadow.blur}|${P.shadow.color}|${ss}`
        if (key === st.spriteKey && st.sprite) return
        st.spriteKey = key
        const pad = Math.max(P.shadow.blur * 2.5, 8)
        const cssW = size + pad * 2
        const { c, x } = makeCanvas(cssW, cssW, ss)
        x.shadowColor = P.shadow.color
        x.shadowBlur = P.shadow.blur * 1.2 * ss
        x.shadowOffsetY = P.shadow.blur * 0.3 * ss
        x.fillStyle = P.shadow.color
        rr(x, pad, pad, size, size, P.grid.cornerRadius)
        x.fill()
        x.shadowBlur = P.shadow.blur * 0.6 * ss
        x.shadowOffsetY = P.shadow.blur * 0.15 * ss
        rr(x, pad, pad, size, size, P.grid.cornerRadius)
        x.fill()
        st.sprite = { c, cssW }
    }

    function rebuildTint(P: Props, st: any, ss: number) {
        const T = P.tint
        const tile = P.tile
        const size = P.grid.cellSize - P.grid.gap
        const cr = P.grid.cornerRadius
        const key = `t|${size}|${cr}|${ss}|${T.color}|${tile.faceGrad}|${tile.sheen}|${tile.shadeColor}|${tile.highlightColor}`
        if (key === st.tintKey && st.tintSpr) return
        st.tintKey = key
        const { c, x } = makeCanvas(size + 4, size + 4, ss)
        const base = rgba(T.color, 1)
        const light = mixColor(base, rgba("#ffffff", 1), 0.55)
        const dark = mixColor(base, rgba(tile.shadeColor, 1), 0.35)
        const g = x.createLinearGradient(0, 2, 0, 2 + size)
        g.addColorStop(0, mixColor(base, light, 0.5 + tile.faceGrad * 0.2))
        g.addColorStop(0.5, base)
        g.addColorStop(1, mixColor(base, dark, 0.55))
        x.fillStyle = g
        rr(x, 2, 2, size, size, cr)
        x.fill()
        glassRim(x, size, cr, 0.85, 0.12, tile.shadeColor, tile.highlightColor)
        st.tintSpr = { c }
    }

    function mixColor(a: string, b: string, t: number): string {
        const pa = parseRgba(a),
            pb = parseRgba(b)
        if (!pa || !pb) return a
        return `rgba(${Math.round(pa[0] * (1 - t) + pb[0] * t)}, ${Math.round(pa[1] * (1 - t) + pb[1] * t)}, ${Math.round(
            pa[2] * (1 - t) + pb[2] * t
        )}, ${(pa[3] * (1 - t) + pb[3] * t).toFixed(3)})`
    }
    function parseRgba(c: string): [number, number, number, number] | null {
        const m = c.match(/rgba?\(([^)]+)\)/)
        if (!m) return null
        const p = m[1].split(",").map(parseFloat)
        return [p[0], p[1], p[2], p[3] ?? 1]
    }

    /* ------------------------- fields ------------------------- */
    function computeLifts(P: Props, st: any, now: number) {
        const cell = P.grid.cellSize
        const W = P.wave
        const falloff = Math.max(40, W.falloff)
        const pr2 = 2 * Math.max(10, W.pressRadius) ** 2
        const wavs = st.waves.map((wv: Wave) => ({
            x: wv.x,
            y: wv.y,
            age: (now - wv.t0) / 1000,
            s: wv.s,
            fade: clamp(1 - (now - wv.t0) / 1000 / W.duration, 0, 1),
        }))
        const hoverOn = P.hover.enabled && st.hoverFade > 0.01
        const hr2 = P.hover.radius * P.hover.radius
        let k = 0
        for (let j = 0; j <= st.rows; j++) {
            const cyv = j * cell + cell / 2
            for (let i = 0; i <= st.cols; i++) {
                const cxv = i * cell + cell / 2
                let L = 0
                for (let n = 0; n < wavs.length; n++) {
                    const wv = wavs[n]
                    const d = Math.hypot(cxv - wv.x, cyv - wv.y)
                    const E = Math.exp(-d / falloff) * wv.fade * wv.s
                    const tu = wv.age - d / Math.max(60, W.speed)
                    if (tu > 0) {
                        const pop =
                            (1 - Math.exp(-tu / 0.04)) * Math.exp(-tu / 0.4)
                        L += W.amplitude * E * pop * 2.0
                        L -= W.dip * E * gauss(tu, 0.5, 0.2)
                    }
                    L -=
                        W.impact *
                        wv.s *
                        Math.exp(-(d * d) / pr2) *
                        Math.exp(-wv.age * 14)
                }
                if (hoverOn) {
                    const dx = cxv - st.sx,
                        dy = cyv - st.sy
                    L +=
                        P.hover.lift *
                        st.hoverFade *
                        Math.exp(-(dx * dx + dy * dy) / (2 * hr2))
                }
                st.lifts[k++] = clamp(L, -0.55, 1.25)
            }
        }
    }

    function computeTints(P: Props, st: any, now: number) {
        const cell = P.grid.cellSize
        const T = P.tint
        const tints = st.tints as Float32Array
        if (!T.enabled || st.stains.length === 0) {
            tints.fill(0)
            return
        }
        const radius = Math.max(30, T.falloff)
        const travelRate = Math.max(60, P.wave.speed) * 1.6
        const stains = st.stains.map((wv: Wave) => {
            const age = (now - wv.t0) / 1000
            const f = clamp(1 - age / T.duration, 0, 1)
            return {
                x: wv.x,
                y: wv.y,
                s: wv.s,
                fade: smoothstep(f),
                reach: Math.min(age * travelRate, radius),
            }
        })
        let k = 0
        for (let j = 0; j <= st.rows; j++) {
            const cyv = j * cell + cell / 2
            for (let i = 0; i <= st.cols; i++) {
                const cxv = i * cell + cell / 2
                let t = 0
                for (let n = 0; n < stains.length; n++) {
                    const sn = stains[n]
                    const d = Math.hypot(cxv - sn.x, cyv - sn.y)
                    if (d > sn.reach) continue
                    const v =
                        T.strength *
                        sn.s *
                        sn.fade *
                        smoothstep(clamp(1 - d / radius, 0, 1))
                    if (v > t) t = v
                }
                tints[k++] = t
            }
        }
    }

    /* ------------------------- draw ------------------------- */
    function drawSockets(P: Props, st: any, ctx: CanvasRenderingContext2D) {
        const cell = P.grid.cellSize
        const size = cell - P.grid.gap
        const T = P.tile
        const S = P.shadow
        const cr = P.grid.cornerRadius
        const half = size / 2
        const cols1 = st.cols + 1
        const order = st.order as number[]

        ctx.globalCompositeOperation = "destination-out"
        for (let n = 0; n < order.length; n++) {
            const k = order[n]
            const L = st.lifts[k]
            if (L <= 0.03) continue
            const i = k % cols1,
                j = (k / cols1) | 0
            ctx.globalAlpha = Math.min(1, L * 2.5)
            ctx.fillStyle = "#000"
            rr(
                ctx,
                i * cell + cell / 2 - half - 1,
                j * cell + cell / 2 - half - 1,
                size + 2,
                size + 2,
                cr + 1
            )
            ctx.fill()
        }
        ctx.globalCompositeOperation = "source-over"
        ctx.globalAlpha = 1

        for (let n = 0; n < order.length; n++) {
            const k = order[n]
            const L = st.lifts[k]
            if (L <= 0.03) continue
            const l = Math.min(1, L)
            const i = k % cols1,
                j = (k / cols1) | 0
            const cxv = i * cell + cell / 2,
                cyv = j * cell + cell / 2
            if (S.recess > 0.001) {
                ctx.fillStyle = rgba(T.shadeColor, S.recess * l)
                rr(ctx, cxv - half, cyv - half, size, size, cr)
                ctx.fill()
            }
            if (st.sprite) {
                const sprW = st.sprite.cssW
                const soft = 1 - S.soften * 0.55 * l
                const dc = sprW * (1 + S.contactGrow * l)
                ctx.globalAlpha = S.contactOpacity * l * soft
                ctx.drawImage(
                    st.sprite.c,
                    cxv - dc / 2 + S.offsetX * 0.4 * l,
                    cyv - dc / 2 + S.offsetY * 0.5 * l + 1.5,
                    dc,
                    dc
                )
                const da = sprW * (1 + S.ambientGrow * l)
                ctx.globalAlpha = S.ambientOpacity * l * soft
                ctx.drawImage(
                    st.sprite.c,
                    cxv - da / 2 + S.offsetX * l,
                    cyv - da / 2 + S.offsetY * 1.1 * l,
                    da,
                    da
                )
                ctx.globalAlpha = 1
            }
        }
        for (let n = 0; n < st.dips.length; n++) {
            const k = st.dips[n]
            const a = -st.lifts[k]
            const i = k % cols1,
                j = (k / cols1) | 0
            ctx.fillStyle = rgba(T.shadeColor, a * T.shadeOpacity * 0.9)
            rr(
                ctx,
                i * cell + cell / 2 - half,
                j * cell + cell / 2 - half,
                size,
                size,
                cr
            )
            ctx.fill()
        }
    }

    function drawFaces(
        P: Props,
        st: any,
        ctx: CanvasRenderingContext2D,
        shineOn: boolean
    ) {
        const cell = P.grid.cellSize
        const size = cell - P.grid.gap
        const T = P.tile
        const cr = P.grid.cornerRadius
        const cols1 = st.cols + 1
        const dpr = st.dpr
        const al = (v: number) => Math.round(v * dpr) / dpr
        const order = st.order as number[]

        // pass 1: faces + edges
        for (let n = 0; n < order.length; n++) {
            const k = order[n]
            const L = st.lifts[k]
            if (L <= 0.03) continue
            const l = Math.min(1, L)
            const i = k % cols1,
                j = (k / cols1) | 0
            const cxv = i * cell + cell / 2,
                cyv = j * cell + cell / 2
            const rs = size * (1 + T.scale * L)
            const rx = cxv - rs / 2
            const ry = cyv - rs / 2 - T.raise * L

            ctx.drawImage(st.restSpr!.c, rx - 2, ry - 2, rs + 4, rs + 4)
            ctx.globalAlpha = Math.min(1, L * 1.8)
            ctx.drawImage(st.liftSpr!.c, rx - 2, ry - 2, rs + 4, rs + 4)
            ctx.globalAlpha = 1

            if (T.brighten > 0.001 && l > 0.2) {
                ctx.fillStyle = rgba(
                    T.highlightColor,
                    T.brighten * (l - 0.2) * 0.35
                )
                rr(ctx, rx, ry, rs, rs, cr)
                ctx.fill()
            }
            if (T.highlightOpacity > 0) {
                ctx.strokeStyle = rgba(
                    T.highlightColor,
                    T.highlightOpacity * l * 0.8
                )
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(rx + cr, al(ry + 0.75))
                ctx.lineTo(rx + rs - cr, al(ry + 0.75))
                ctx.stroke()
            }
            if (T.shadeOpacity > 0) {
                ctx.strokeStyle = rgba(T.shadeColor, T.shadeOpacity * l * 0.8)
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(rx + cr, al(ry + rs - 0.75))
                ctx.lineTo(rx + rs - cr, al(ry + rs - 0.75))
                ctx.stroke()
            }
        }

        // pass 2: glaze tint
        let anyTint = false
        for (let n = 0; n < order.length; n++)
            if (st.tints[order[n]] > 0.02) {
                anyTint = true
                break
            }
        if (anyTint && st.tintSpr) {
            ctx.globalCompositeOperation = "color"
            for (let n = 0; n < order.length; n++) {
                const k = order[n]
                const Tt = st.tints[k]
                if (Tt <= 0.02) continue
                const L = st.lifts[k]
                const i = k % cols1,
                    j = (k / cols1) | 0
                const cxv = i * cell + cell / 2,
                    cyv = j * cell + cell / 2
                let rx: number, ry: number, rs: number
                if (L > 0.03) {
                    rs = size * (1 + T.scale * L)
                    rx = cxv - rs / 2
                    ry = cyv - rs / 2 - T.raise * Math.min(1.25, L)
                } else {
                    rs = size
                    rx = cxv - rs / 2
                    ry = cyv - rs / 2
                }
                ctx.globalAlpha = Math.min(1, Tt)
                ctx.drawImage(st.tintSpr.c, rx - 2, ry - 2, rs + 4, rs + 4)
            }
            ctx.globalCompositeOperation = "source-over"
            ctx.globalAlpha = 1
        }

        // pass 3: DIRECTIONAL cursor rim — bright toward cursor, dim away
        if (shineOn) {
            for (let n = 0; n < order.length; n++) {
                const k = order[n]
                const L = st.lifts[k]
                const i = k % cols1,
                    j = (k / cols1) | 0
                const cxv = i * cell + cell / 2,
                    cyv = j * cell + cell / 2
                const d = Math.hypot(cxv - st.sx, cyv - st.sy)
                let prox = clamp(1 - d / 120, 0, 1)
                prox *= prox
                if (prox <= 0.08) continue
                const l = clamp(L, 0, 1)
                let rx: number, ry: number, rs: number
                if (L > 0.03) {
                    rs = size * (1 + T.scale * L)
                    rx = cxv - rs / 2
                    ry = cyv - rs / 2 - T.raise * L
                } else {
                    rs = size
                    rx = cxv - rs / 2
                    ry = cyv - rs / 2
                }
                const shine =
                    prox * T.cursorShine * st.hoverFade * (0.45 + l * 0.55)
                if (shine <= 0.02) continue

                // gradient axis: cursor-facing edge -> opposite edge
                let ux = st.sx - cxv,
                    uy = st.sy - cyv
                const len = Math.hypot(ux, uy) || 1
                ux /= len
                uy /= len
                const g = ctx.createLinearGradient(
                    cxv + ux * rs * 0.62,
                    cyv + uy * rs * 0.62,
                    cxv - ux * rs * 0.62,
                    cyv - uy * rs * 0.62
                )
                g.addColorStop(0, rgba(T.highlightColor, shine * 0.9))
                g.addColorStop(0.45, rgba(T.highlightColor, shine * 0.35))
                g.addColorStop(1, rgba(T.highlightColor, 0))
                ctx.strokeStyle = g
                ctx.lineWidth = 1.25
                rr(ctx, rx + 1, ry + 1, rs - 2, rs - 2, Math.max(0, cr - 1))
                ctx.stroke()
            }
        }
    }

    /* ------------------------- lifecycle ------------------------- */
    React.useEffect(() => {
        const el = wrapRef.current
        const canvas = canvasRef.current
        if (!el || !canvas) return
        const st = stRef.current
        let raf = 0
        let running = false
        let demoTimer: number | null = null
        let ro: ResizeObserver | null = null
        let io: IntersectionObserver | null = null

        const applySize = (w: number, h: number) => {
            const P = propsRef.current
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                P.performance.dprCap
            )
            st.dpr = dpr
            st.w = w
            st.h = h
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            st.cols = Math.ceil(w / P.grid.cellSize)
            st.rows = Math.ceil(h / P.grid.cellSize)
            const n = (st.cols + 1) * (st.rows + 1)
            st.lifts = new Float32Array(n)
            st.tints = new Float32Array(n)
            st.staticKey = ""
            st.dirty = true
        }

        const spawnPulse = (x: number, y: number, s: number) => {
            const P = propsRef.current
            const t0 = performance.now()
            if (P.wave.enabled) {
                st.waves.push({ x, y, t0, s })
                if (st.waves.length > P.wave.maxWaves) st.waves.shift()
            }
            if (P.tint.enabled) {
                st.stains.push({ x, y, t0, s })
                if (st.stains.length > 10) st.stains.shift()
            }
            st.dirty = true
        }

        const stopLoop = () => {
            if (raf) cancelAnimationFrame(raf)
            raf = 0
            running = false
        }

        const loop = (now: number) => {
            raf = 0
            running = false
            const P = propsRef.current
            if (!st.visible) return

            if (st.lastTime < 0) {
                st.lastTime = now
                st.sx = st.px
                st.sy = st.py
            }
            const dt = Math.min(48, now - st.lastTime)
            st.lastTime = now

            const dpr = Math.min(
                window.devicePixelRatio || 1,
                P.performance.dprCap
            )
            if (canvas.width !== Math.max(1, Math.round(st.w * dpr)))
                applySize(st.w, st.h)
            const ctx = canvas.getContext("2d")
            if (!ctx || st.w === 0) return
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            rebuildRest(P, st, dpr)
            rebuildStatic(P, st, dpr)
            rebuildSprite(P, st, dpr)
            rebuildLift(P, st, dpr)
            rebuildTint(P, st, dpr)

            const baseSmooth = clamp(P.hover.smoothing, 0.02, 0.95)
            const smoothFactor = 1 - Math.pow(1 - baseSmooth, dt / 16)
            st.sx += (st.px - st.sx) * smoothFactor
            st.sy += (st.py - st.sy) * smoothFactor
            st.hoverFade +=
                ((st.active ? 1 : 0) - st.hoverFade) *
                (1 - Math.pow(0.85, dt / 16))

            st.waves = st.waves.filter(
                (wv) => (now - wv.t0) / 1000 < P.wave.duration
            )
            st.stains = st.stains.filter(
                (wv) => (now - wv.t0) / 1000 < P.tint.duration
            )

            const shineOn =
                P.tile.cursorShine > 0.01 &&
                P.hover.enabled &&
                st.hoverFade > 0.01
            const dynamic =
                st.waves.length > 0 ||
                st.stains.length > 0 ||
                (P.hover.enabled && st.hoverFade > 0.01)
            if (!dynamic && !st.dirty) return
            if (st.wasDynamic && !dynamic) st.dirty = true
            st.wasDynamic = dynamic

            ctx.clearRect(0, 0, st.w, st.h)
            if (st.staticCanvas)
                ctx.drawImage(st.staticCanvas, 0, 0, st.w, st.h)
            if (dynamic) {
                computeLifts(P, st, now)
                computeTints(P, st, now)
                const order = st.order
                const dips = st.dips
                order.length = 0
                dips.length = 0
                const shineR2 = 120 * 120
                for (let k = 0; k < st.lifts.length; k++) {
                    const L = st.lifts[k]
                    if (L > 0.03 || st.tints[k] > 0.02) {
                        order.push(k)
                        continue
                    }
                    if (L < -0.03) {
                        dips.push(k)
                        continue
                    }
                    if (shineOn) {
                        const i = k % (st.cols + 1),
                            j = (k / (st.cols + 1)) | 0
                        const dx =
                            i * P.grid.cellSize + P.grid.cellSize / 2 - st.sx
                        const dy =
                            j * P.grid.cellSize + P.grid.cellSize / 2 - st.sy
                        if (dx * dx + dy * dy < shineR2) order.push(k)
                    }
                }
                order.sort((a, b) => st.lifts[a] - st.lifts[b])
                drawSockets(P, st, ctx)
                drawFaces(P, st, ctx, shineOn)
            }
            if (!dynamic) st.dirty = false

            raf = requestAnimationFrame(loop)
            running = true
        }

        const kick = () => {
            if (!running && st.visible && !isStatic) {
                running = true
                raf = requestAnimationFrame(loop)
            }
        }

        const renderOnce = () => {
            const P = propsRef.current
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                P.performance.dprCap
            )
            st.dpr = dpr
            const ctx = canvas.getContext("2d")
            if (!ctx || st.w === 0) return
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            rebuildRest(P, st, dpr)
            rebuildStatic(P, st, dpr)
            ctx.clearRect(0, 0, st.w, st.h)
            if (st.staticCanvas)
                ctx.drawImage(st.staticCanvas, 0, 0, st.w, st.h)
        }

        const syncDemo = () => {
            const P = propsRef.current
            const want = P.demo.enabled && st.visible && !isStatic
            if (want && demoTimer === null) {
                demoTimer = window.setInterval(
                    () => {
                        if (!st.visible) return
                        const m = P.grid.cellSize * 2
                        spawnPulse(
                            m + Math.random() * Math.max(1, st.w - m * 2),
                            m + Math.random() * Math.max(1, st.h - m * 2),
                            P.demo.strength
                        )
                        kick()
                    },
                    Math.max(0.5, P.demo.interval) * 1000
                )
            } else if (!want && demoTimer !== null) {
                clearInterval(demoTimer)
                demoTimer = null
            }
        }

        st.handleProps = () => {
            st.dirty = true
            st.staticKey = ""
            st.restKey = ""
            st.liftKey = ""
            st.tintKey = ""
            st.spriteKey = ""
            syncDemo()
            if (isStatic) renderOnce()
            else kick()
        }

        const r0 = el.getBoundingClientRect()
        applySize(r0.width, r0.height)

        if (isStatic) {
            renderOnce()
            return () => {
                st.handleProps = null
            }
        }

        const downAt = (clientX: number, clientY: number, ts: number) => {
            if (ts === st.lastDown) return
            st.lastDown = ts
            const r = el.getBoundingClientRect()
            const x = clientX - r.left,
                y = clientY - r.top
            if (x < 0 || y < 0 || x > r.width || y > r.height) return
            spawnPulse(x, y, 1)
            kick()
        }
        const winDown = (e: PointerEvent) =>
            downAt(e.clientX, e.clientY, e.timeStamp)
        const onDown = (e: React.PointerEvent) =>
            downAt(e.clientX, e.clientY, e.timeStamp)
        ;(st as any).onDown = onDown
        const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            st.px = e.clientX - r.left
            st.py = e.clientY - r.top
            st.active = true
            kick()
        }
        const enter = (e: PointerEvent) => move(e)
        const leave = () => {
            st.active = false
            kick()
        }
        window.addEventListener("pointerdown", winDown)
        el.addEventListener("pointermove", move)
        el.addEventListener("pointerenter", enter as any)
        el.addEventListener("pointerleave", leave)

        if (typeof ResizeObserver !== "undefined") {
            ro = new ResizeObserver((entries) => {
                for (const en of entries) {
                    const cr = en.contentRect
                    if (
                        Math.abs(cr.width - st.w) > 0.5 ||
                        Math.abs(cr.height - st.h) > 0.5
                    )
                        applySize(cr.width, cr.height)
                }
                if (isStatic) renderOnce()
                else kick()
            })
            ro.observe(el)
        }

        if (typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    for (const en of entries) st.visible = en.isIntersecting
                    if (st.visible) {
                        st.lastTime = -1
                        syncDemo()
                        kick()
                    } else {
                        stopLoop()
                        syncDemo()
                    }
                },
                { threshold: 0 }
            )
            io.observe(el)
        }

        syncDemo()
        kick()

        return () => {
            stopLoop()
            if (demoTimer !== null) clearInterval(demoTimer)
            if (ro) ro.disconnect()
            if (io) io.disconnect()
            window.removeEventListener("pointerdown", winDown)
            el.removeEventListener("pointermove", move)
            el.removeEventListener("pointerenter", enter as any)
            el.removeEventListener("pointerleave", leave)
            st.handleProps = null
            ;(st as any).onDown = null
        }
    }, [isStatic])

    React.useEffect(() => {
        const st = stRef.current
        if (st.handleProps) st.handleProps()
        else {
            st.dirty = true
            st.staticKey = ""
        }
    }, [props])

    const b = props.background
    return (
        <div
            ref={wrapRef}
            onPointerDown={(e) => {
                const fn = (stRef.current as any).onDown as
                    | undefined
                    | ((e: React.PointerEvent) => void)
                if (fn) fn(e)
            }}
            style={{
                position: "relative",
                overflow: "hidden",
                width: props.width ?? "100%",
                height: props.height ?? "100%",
                cursor: props.cursor,
                userSelect: "none",
                background: b.baseColor,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: b.gradient
                        ? `linear-gradient(${b.angle}deg, ${b.topColor} 0%, ${b.bottomColor} 100%)`
                        : b.baseColor,
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                }}
            />
            {b.vignette && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: `radial-gradient(120% 120% at 50% 50%, transparent 55%, ${rgba(b.vignetteColor, b.vignetteStrength)} 100%)`,
                    }}
                />
            )}
        </div>
    )
}

Tron_Tiles.defaultProps = {
    width: "100%",
    height: "100%",
    cursor: "pointer",
    grid: {
        cellSize: 28,
        gap: 2,
        cornerRadius: 6,
        lineWidth: 0,
        lineColor: "#3d4451",
        lineOpacity: 0,
        majorEvery: 0,
        majorLineWidth: 2,
        majorLineColor: "#3d4451",
        majorLineOpacity: 0.5,
    },
    tile: {
        faceColor: "#ffffff",
        faceOpacity: 0.6,
        faceLight: "#ffffff",
        faceShade: "#c9d2de",
        faceGrad: 0.5,
        sheen: 0.5,
        highlightColor: "#ffffff",
        highlightOpacity: 0.4,
        shadeColor: "#0b0e13",
        shadeOpacity: 0.2,
        raise: 12,
        scale: 0.04,
        brighten: 0.18,
        cursorShine: 0.6,
    },
    shadow: {
        color: "#0d1117",
        recess: 0.3,
        ambientOpacity: 0.22,
        ambientGrow: 1.5,
        contactOpacity: 0.5,
        contactGrow: 0.3,
        blur: 12,
        offsetX: 0,
        offsetY: 4,
        soften: 0.5,
    },
    wave: {
        enabled: true,
        amplitude: 1,
        speed: 1000,
        falloff: 300,
        duration: 1.2,
        dip: 0.22,
        impact: 0.35,
        pressRadius: 60,
        maxWaves: 8,
    },
    tint: {
        enabled: true,
        color: "#4c7dff",
        strength: 0.6,
        falloff: 240,
        duration: 2.4,
    },
    hover: { enabled: true, radius: 110, lift: 0.2, smoothing: 0.3 },
    demo: { enabled: true, interval: 2.4, strength: 0.85 },
    background: {
        gradient: true,
        topColor: "#9aa1ac",
        bottomColor: "#e9ecf1",
        angle: 180,
        baseColor: "#e9ecf1",
        vignette: false,
        vignetteColor: "#0b0e13",
        vignetteStrength: 0.35,
    },
    performance: { dprCap: 2 },
}

/* -------------------- property panel with hidden() rules --------------------
   Inside an Object group the hidden callback receives THE GROUP OBJECT,
   so siblings are read directly: hidden: (p) => p.enabled === false        */

addPropertyControls(Tron_Tiles, {
    cursor: {
        type: ControlType.Enum,
        title: "Cursor",
        options: ["default", "pointer", "crosshair", "none"],
    },

    grid: {
        type: ControlType.Object,
        title: "Grid",
        controls: {
            cellSize: {
                type: ControlType.Number,
                title: "Cell Size",
                min: 12,
                max: 120,
                unit: "px",
            },
            gap: {
                type: ControlType.Number,
                title: "Tile Gap",
                min: 0,
                max: 12,
                step: 0.5,
                unit: "px",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                min: 0,
                max: 30,
                unit: "px",
            },
            lineWidth: {
                type: ControlType.Number,
                title: "Line Width",
                min: 0,
                max: 8,
                step: 0.5,
                unit: "px",
            },
            lineColor: {
                type: ControlType.Color,
                title: "Line Color",
                hidden: (p) => p.lineWidth <= 0,
            },
            lineOpacity: {
                type: ControlType.Number,
                title: "Line Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => p.lineWidth <= 0,
            },
            majorEvery: {
                type: ControlType.Number,
                title: "Major Every N",
                min: 0,
                max: 16,
                step: 1,
            },
            majorLineWidth: {
                type: ControlType.Number,
                title: "Major Width",
                min: 0.5,
                max: 8,
                step: 0.5,
                unit: "px",
                hidden: (p) => p.majorEvery <= 1,
            },
            majorLineColor: {
                type: ControlType.Color,
                title: "Major Color",
                hidden: (p) => p.majorEvery <= 1,
            },
            majorLineOpacity: {
                type: ControlType.Number,
                title: "Major Opacity",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => p.majorEvery <= 1,
            },
        },
    },

    tile: {
        type: ControlType.Object,
        title: "Glass Tile",
        controls: {
            faceColor: { type: ControlType.Color, title: "Face Color" },
            faceOpacity: {
                type: ControlType.Number,
                title: "Glass Opacity",
                min: 0.1,
                max: 1,
                step: 0.01,
            },
            faceLight: {
                type: ControlType.Color,
                title: "Top Tint",
                hidden: (p) => p.faceGrad <= 0,
            },
            faceShade: {
                type: ControlType.Color,
                title: "Bottom Tint",
                hidden: (p) => p.faceGrad <= 0,
            },
            faceGrad: {
                type: ControlType.Number,
                title: "Top→Bottom Grad.",
                min: 0,
                max: 1,
                step: 0.01,
            },
            sheen: {
                type: ControlType.Number,
                title: "Specular Sheen",
                min: 0,
                max: 1,
                step: 0.01,
            },
            highlightColor: { type: ControlType.Color, title: "Light Color" },
            highlightOpacity: {
                type: ControlType.Number,
                title: "Top Edge Opacity",
                min: 0,
                max: 1,
                step: 0.01,
            },
            shadeColor: { type: ControlType.Color, title: "Shade Color" },
            shadeOpacity: {
                type: ControlType.Number,
                title: "Shade Opacity",
                min: 0,
                max: 1,
                step: 0.01,
            },
            raise: {
                type: ControlType.Number,
                title: "Raise Height",
                min: 0,
                max: 30,
                unit: "px",
            },
            scale: {
                type: ControlType.Number,
                title: "Lift Scale",
                min: 0,
                max: 0.2,
                step: 0.005,
            },
            brighten: {
                type: ControlType.Number,
                title: "Brighten @ Peak",
                min: 0,
                max: 1,
                step: 0.01,
            },
            cursorShine: {
                type: ControlType.Number,
                title: "Cursor Edge Shine",
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },

    shadow: {
        type: ControlType.Object,
        title: "Shadow",
        controls: {
            color: { type: ControlType.Color, title: "Color" },
            recess: {
                type: ControlType.Number,
                title: "Socket Recess",
                min: 0,
                max: 1,
                step: 0.01,
            },
            ambientOpacity: {
                type: ControlType.Number,
                title: "Ambient Op.",
                min: 0,
                max: 1,
                step: 0.01,
            },
            ambientGrow: {
                type: ControlType.Number,
                title: "Ambient Grow",
                min: 0,
                max: 3,
                step: 0.05,
                hidden: (p) => p.ambientOpacity <= 0,
            },
            contactOpacity: {
                type: ControlType.Number,
                title: "Contact Op.",
                min: 0,
                max: 1,
                step: 0.01,
            },
            contactGrow: {
                type: ControlType.Number,
                title: "Contact Grow",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => p.contactOpacity <= 0,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur",
                min: 0,
                max: 40,
                unit: "px",
                hidden: (p) => p.ambientOpacity <= 0 && p.contactOpacity <= 0,
            },
            offsetX: {
                type: ControlType.Number,
                title: "Offset X",
                min: -30,
                max: 30,
                unit: "px",
                hidden: (p) => p.ambientOpacity <= 0 && p.contactOpacity <= 0,
            },
            offsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                min: -30,
                max: 30,
                unit: "px",
                hidden: (p) => p.ambientOpacity <= 0 && p.contactOpacity <= 0,
            },
            soften: {
                type: ControlType.Number,
                title: "Soften @ Height",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => p.ambientOpacity <= 0 && p.contactOpacity <= 0,
            },
        },
    },

    wave: {
        type: ControlType.Object,
        title: "Click Pulse",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Enabled" },
            amplitude: {
                type: ControlType.Number,
                title: "Amplitude",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Travel Speed",
                min: 60,
                max: 2000,
                unit: "px/s",
                hidden: (p) => !p.enabled,
            },
            falloff: {
                type: ControlType.Number,
                title: "Distance Fade",
                min: 40,
                max: 900,
                unit: "px",
                hidden: (p) => !p.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0.2,
                max: 4,
                step: 0.05,
                unit: "s",
                hidden: (p) => !p.enabled,
            },
            dip: {
                type: ControlType.Number,
                title: "Settle Undershoot",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            impact: {
                type: ControlType.Number,
                title: "Press-Down",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            pressRadius: {
                type: ControlType.Number,
                title: "Press Radius",
                min: 10,
                max: 300,
                unit: "px",
                hidden: (p) => !p.enabled || p.impact <= 0,
            },
            maxWaves: {
                type: ControlType.Number,
                title: "Max Pulses",
                min: 1,
                max: 12,
                step: 1,
                hidden: (p) => !p.enabled,
            },
        },
    },

    tint: {
        type: ControlType.Object,
        title: "Click Tint",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Enabled" },
            color: {
                type: ControlType.Color,
                title: "Tint Color",
                hidden: (p) => !p.enabled,
            },
            strength: {
                type: ControlType.Number,
                title: "Strength @ Click",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            falloff: {
                type: ControlType.Number,
                title: "Tint Radius (hard)",
                min: 30,
                max: 900,
                unit: "px",
                hidden: (p) => !p.enabled,
            },
            duration: {
                type: ControlType.Number,
                title: "Fade Out After",
                min: 0.5,
                max: 8,
                step: 0.1,
                unit: "s",
                hidden: (p) => !p.enabled,
            },
        },
    },

    hover: {
        type: ControlType.Object,
        title: "Hover Swell",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Enabled" },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 20,
                max: 400,
                unit: "px",
                hidden: (p) => !p.enabled,
            },
            lift: {
                type: ControlType.Number,
                title: "Lift",
                min: 0,
                max: 0.6,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            smoothing: {
                type: ControlType.Number,
                title: "Smoothing",
                min: 0.02,
                max: 0.95,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
        },
    },

    demo: {
        type: ControlType.Object,
        title: "Auto Demo",
        controls: {
            enabled: { type: ControlType.Boolean, title: "Enabled" },
            interval: {
                type: ControlType.Number,
                title: "Every",
                min: 0.5,
                max: 10,
                step: 0.1,
                unit: "s",
                hidden: (p) => !p.enabled,
            },
            strength: {
                type: ControlType.Number,
                title: "Strength",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
        },
    },

    background: {
        type: ControlType.Object,
        title: "Background",
        controls: {
            gradient: { type: ControlType.Boolean, title: "Gradient" },
            topColor: {
                type: ControlType.Color,
                title: "Top Color",
                hidden: (p) => !p.gradient,
            },
            bottomColor: {
                type: ControlType.Color,
                title: "Bottom Color",
                hidden: (p) => !p.gradient,
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 360,
                unit: "deg",
                hidden: (p) => !p.gradient,
            },
            baseColor: { type: ControlType.Color, title: "Base Color" },
            vignette: { type: ControlType.Boolean, title: "Vignette" },
            vignetteColor: {
                type: ControlType.Color,
                title: "Vignette Color",
                hidden: (p) => !p.vignette,
            },
            vignetteStrength: {
                type: ControlType.Number,
                title: "Vignette Str.",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.vignette,
            },
        },
    },

    performance: {
        type: ControlType.Object,
        title: "Performance",
        controls: {
            dprCap: {
                type: ControlType.Number,
                title: "DPR Cap",
                min: 1,
                max: 3,
                step: 0.5,
            },
        },
    },
})

export default Tron_Tiles
