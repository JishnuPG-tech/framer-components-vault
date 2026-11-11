import * as React from "react"
import { useEffect, useId, useMemo, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


/* ------------------------------------------------------------------ */
/* Types + icons                                                       */
/* ------------------------------------------------------------------ */

type MenuItem = {
    label: string
    icon: string
    hoverIcon?: string
    badge: string
    angle: number
    distance: number
    link?: string
}

type ImageValue = { src: string; srcSet?: string; alt?: string }

type HoverEffect = "blob" | "squish" | "spin" | "swap" | "none"

const ICONS: Record<string, string[]> = {
    settings: [
        "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
        "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
    ],
    user: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2", "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"],
    bell: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
    basket: [
        "m5 11 4-7",
        "m19 11-4-7",
        "M2 11h20",
        "m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4",
        "m9 11 1 9",
        "m15 11-1 9",
    ],
    mushroom: [
        "M12 3C6.5 3 3 7 3 11c0 .6.4 1 1 1h16c.6 0 1-.4 1-1 0-4-3.5-8-9-8Z",
        "M9 12v6a3 3 0 0 0 6 0v-6",
        "M8 8.5h.01",
        "M13 7h.01",
        "M16 9.5h.01",
    ],
    home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
    search: ["M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z", "m21 21-4.3-4.3"],
    heart: [
        "M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z",
    ],
    mail: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "m22 7-10 6L2 7"],
    star: ["m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"],
    plus: ["M12 5v14", "M5 12h14"],
}

const ICON_KEYS = Object.keys(ICONS)

/* ------------------------------------------------------------------ */
/* Colour helper (shader needs plain RGB)                              */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number]

function parseColor(input: string | undefined, fallback: RGB): RGB {
    if (!input) return fallback
    let s = String(input).trim()
    const v = s.match(/var\(\s*--[^,]+,\s*(.+)\)\s*$/)
    if (v) s = v[1].trim()
    const hex = s.match(/^#([0-9a-f]{3,8})$/i)
    if (hex) {
        let h = hex[1]
        if (h.length <= 4) h = h.split("").map((c) => c + c).join("")
        const n = parseInt(h.slice(0, 6), 16)
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
    }
    const rgb = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
    if (rgb) return [+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255]
    return fallback
}

/* ------------------------------------------------------------------ */
/* Chrome ring: WebGL gradient shader with CSS fallback                */
/* ------------------------------------------------------------------ */

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uQ;
uniform float uR;
uniform float uT;
uniform float uTint;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;

vec3 grad(float t){
    t = fract(t);
    if (t < 0.3333) return mix(uC1, uC2, smoothstep(0.0, 1.0, t * 3.0));
    if (t < 0.6666) return mix(uC2, uC3, smoothstep(0.0, 1.0, (t - 0.3333) * 3.0));
    return mix(uC3, uC1, smoothstep(0.0, 1.0, (t - 0.6666) * 3.0));
}

vec3 env(vec3 r, float t){
    float c = cos(t * 0.35);
    float s = sin(t * 0.35);
    r.xy = mat2(c, -s, s, c) * r.xy;
    float h = r.y * 0.5 + 0.5;
    float horizon = smoothstep(0.44, 0.56, h);
    vec3 sky = mix(vec3(0.70, 0.82, 1.0), vec3(1.0), h);
    vec3 ground = mix(vec3(0.01, 0.01, 0.03), vec3(0.32, 0.35, 0.44), pow(1.0 - h, 2.0) * 0.7);
    vec3 col = mix(ground, sky, horizon);
    float strip = smoothstep(0.10, 0.0, abs(r.x * 0.9 + r.y * 0.45 - 0.45));
    float strip2 = smoothstep(0.07, 0.0, abs(r.x * 0.8 - r.y * 0.6 + 0.55));
    col += strip * 1.1 + strip2 * 0.7;
    col *= 0.9 + 0.1 * sin(r.x * 6.0 + t);
    return col;
}

void main(){
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uQ;
    p.y = -p.y;
    float r = length(p);
    float hw = uT * 0.5;
    float d = (r - uR) / hw;
    float aa = 1.5 / hw;
    float alpha = 1.0 - smoothstep(1.0 - aa, 1.0, abs(d));
    if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

    float a = atan(p.y, p.x);
    float dd = clamp(d, -0.999, 0.999);
    vec2 dir = p / max(r, 0.0001);
    vec3 n = vec3(dir * dd, sqrt(1.0 - dd * dd));
    vec3 refl = reflect(vec3(0.0, 0.0, -1.0), n);

    vec3 chrome = env(refl, uTime);
    float lum = dot(chrome, vec3(0.3333));

    vec3 g = grad(a / 6.28318 + uTime * 0.08);
    vec3 tinted = g * (0.30 + 1.15 * lum) + pow(clamp(lum, 0.0, 1.0), 6.0) * 0.55;
    vec3 col = mix(chrome, tinted, uTint);

    float la = uTime * 1.1;
    float spec = pow(max(dot(dir, vec2(cos(la), sin(la))), 0.0), 26.0) * n.z * n.z;
    col += vec3(1.0) * spec * 0.75;
    col *= 0.82 + 0.18 * n.z;

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col * alpha, alpha);
}
`

type RingParams = {
    box: number
    radius: number
    thickness: number
    c1: string
    c2: string
    c3: string
    tint: number
    animate: boolean
    quality: number
    uid: string
}

function ChromeRing(props: RingParams) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const paramsRef = useRef<RingParams>(props)
    paramsRef.current = props
    const kickRef = useRef<null | (() => void)>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const gl = canvas.getContext("webgl", {
            alpha: true,
            premultipliedAlpha: true,
            antialias: true,
        }) as WebGLRenderingContext | null
        if (!gl) {
            setFailed(true)
            return
        }

        const compile = (type: number, src: string) => {
            const sh = gl.createShader(type)
            if (!sh) return null
            gl.shaderSource(sh, src)
            gl.compileShader(sh)
            return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null
        }
        const vs = compile(gl.VERTEX_SHADER, VERT)
        const fs = compile(gl.FRAGMENT_SHADER, FRAG)
        const prog = gl.createProgram()
        if (!vs || !fs || !prog) {
            setFailed(true)
            return
        }
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            setFailed(true)
            return
        }
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        const U = (name: string) => gl.getUniformLocation(prog, name)
        const uRes = U("uRes")
        const uTime = U("uTime")
        const uQ = U("uQ")
        const uR = U("uR")
        const uT = U("uT")
        const uTint = U("uTint")
        const uC1 = U("uC1")
        const uC2 = U("uC2")
        const uC3 = U("uC3")

        const start = performance.now()
        let raf = 0
        let visible = true

        const draw = () => {
            const P = paramsRef.current
            const px = Math.max(1, Math.round(P.box * P.quality))
            if (canvas.width !== px || canvas.height !== px) {
                canvas.width = px
                canvas.height = px
            }
            gl.viewport(0, 0, px, px)
            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            const t = P.animate ? (performance.now() - start) / 1000 : 1.7
            gl.uniform2f(uRes, px, px)
            gl.uniform1f(uTime, t)
            gl.uniform1f(uQ, P.quality)
            gl.uniform1f(uR, P.radius)
            gl.uniform1f(uT, P.thickness)
            gl.uniform1f(uTint, P.tint)
            const c1 = parseColor(P.c1, [0.62, 0.85, 1])
            const c2 = parseColor(P.c2, [0.79, 0.72, 1])
            const c3 = parseColor(P.c3, [1, 0.72, 0.9])
            gl.uniform3f(uC1, c1[0], c1[1], c1[2])
            gl.uniform3f(uC2, c2[0], c2[1], c2[2])
            gl.uniform3f(uC3, c3[0], c3[1], c3[2])
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }

        const loop = () => {
            draw()
            if (paramsRef.current.animate && visible && !document.hidden) {
                raf = requestAnimationFrame(loop)
            } else {
                raf = 0
            }
        }
        const kick = () => {
            if (!raf) raf = requestAnimationFrame(loop)
        }
        kickRef.current = kick

        const io = new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true
            if (visible) kick()
        })
        io.observe(canvas)
        const onVis = () => {
            if (!document.hidden) kick()
        }
        document.addEventListener("visibilitychange", onVis)
        kick()

        return () => {
            if (raf) cancelAnimationFrame(raf)
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            kickRef.current = null
        }
    }, [])

    // Redraw when any visual parameter changes (covers the non-animated case)
    useEffect(() => {
        kickRef.current?.()
    }, [props.box, props.radius, props.thickness, props.c1, props.c2, props.c3, props.tint, props.animate, props.quality])

    if (failed) {
        const inner = props.radius - props.thickness / 2
        const outer = props.radius + props.thickness / 2
        const mask = `radial-gradient(circle at center, transparent ${inner}px, #000 ${inner + 1}px, #000 ${outer - 1}px, transparent ${outer}px)`
        return (
            <>
                <style>{`@keyframes ${props.uid}spin{to{transform:rotate(360deg)}}`}</style>
                <div
                    style={{
                        width: props.box,
                        height: props.box,
                        borderRadius: "50%",
                        background: `conic-gradient(from 0deg, ${props.c1}, #ffffff, ${props.c2}, #1a1a1f, ${props.c3}, #ffffff, #2a2a30, ${props.c1})`,
                        WebkitMaskImage: mask,
                        maskImage: mask,
                        animation: props.animate ? `${props.uid}spin 8s linear infinite` : undefined,
                    }}
                />
            </>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{ width: props.box, height: props.box, display: "block" }}
        />
    )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
    items: MenuItem[]
    rotation: number
    hoverEffect: HoverEffect
    hoverScale: number
    hoverDuration: number
    morph: "blob" | "none"
    morphColor: string
    labelColor: string
    labelSize: number
    responsive: boolean
    scaleUp: boolean
    centerImage?: ImageValue
    centerSize: number
    itemSize: number
    spread: number
    centerColor: string
    showRing: boolean
    ringGap: number
    ringThickness: number
    ringColor1: string
    ringColor2: string
    ringColor3: string
    ringTint: number
    ringAnimate: boolean
    animateOnCanvas: boolean
    itemColor: string
    itemHoverColor: string
    iconColor: string
    badgeColor: string
    badgeTextColor: string
    duration: number
    stagger: number
    spinCenter: boolean
    closeOnSelect: boolean
    openInNewTab: boolean
    defaultOpen: boolean
    openOnCanvas: boolean
    ariaLabel: string
    style?: React.CSSProperties
}

/**
 * Chrome Radial Menu
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 360
 */
export default function ChromeRadialMenu(props: Props) {
    const {
        items,
        rotation,
        hoverEffect,
        hoverScale,
        hoverDuration,
        morph,
        morphColor,
        labelColor,
        labelSize,
        responsive,
        scaleUp,
        centerImage,
        centerSize,
        itemSize,
        spread,
        centerColor,
        showRing,
        ringGap,
        ringThickness,
        ringColor1,
        ringColor2,
        ringColor3,
        ringTint,
        ringAnimate,
        animateOnCanvas,
        itemColor,
        itemHoverColor,
        iconColor,
        badgeColor,
        badgeTextColor,
        duration,
        stagger,
        spinCenter,
        closeOnSelect,
        openInNewTab,
        defaultOpen,
        openOnCanvas,
        ariaLabel,
    } = props

    const uid = "crm" + useId().replace(/[^a-zA-Z0-9]/g, "")
    const rootRef = useRef<HTMLDivElement>(null)
    const [box, setBox] = useState({ w: 0, h: 0 })
    const [open, setOpen] = useState(defaultOpen)
    const [hover, setHover] = useState<number | null>(null)
    const [dpr, setDpr] = useState(1)
    const [reduced, setReduced] = useState(false)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const isOpen = isCanvas ? openOnCanvas : open

    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        setDpr(window.devicePixelRatio || 1)
        setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
        return () => ro.disconnect()
    }, [])

    const list = Array.isArray(items) ? items : []

    // Design-space layout (px at scale 1). Everything is measured from the centre button.
    // `rotation` turns the whole fan around the centre, so you can choose which way the menu opens.
    const layout = useMemo(() => {
        const ringRadius = centerSize / 2 + ringGap + ringThickness / 2
        const outer = showRing ? ringRadius + ringThickness / 2 : centerSize / 2
        const pts = list.map((it) => {
            const a = (((it.angle || 0) + (rotation || 0)) * Math.PI) / 180
            const d = (it.distance || 0) * spread
            return { x: Math.cos(a) * d, y: -Math.sin(a) * d }
        })
        const pad = 16
        const itemR = itemSize / 2 + 8
        let minX = -outer,
            maxX = outer,
            minY = -outer,
            maxY = outer
        pts.forEach((p) => {
            minX = Math.min(minX, p.x - itemR)
            maxX = Math.max(maxX, p.x + itemR)
            minY = Math.min(minY, p.y - itemR)
            maxY = Math.max(maxY, p.y + itemR)
        })
        minX -= pad
        maxX += pad
        minY -= pad
        maxY += pad + labelSize + 10
        return {
            ringRadius,
            outer,
            pts,
            W: maxX - minX,
            H: maxY - minY,
            cx: -minX,
            cy: -minY,
        }
    }, [list, rotation, centerSize, ringGap, ringThickness, showRing, spread, itemSize, labelSize])

    const { W, H, cx, cy, pts, ringRadius, outer } = layout

    const fit = box.w > 0 && box.h > 0 ? Math.min(box.w / W, box.h / H) : 1
    const scale = responsive ? (scaleUp ? fit : Math.min(1, fit)) : 1
    const quality = Math.min(3, Math.max(1, dpr * Math.max(1, scale)))

    const ringBox = Math.ceil((outer + 4) * 2)
    const ringAnimated = ringAnimate && (!isCanvas || animateOnCanvas) && !reduced

    const ease = "cubic-bezier(0.34, 1.4, 0.64, 1)"
    const spring = "cubic-bezier(0.34, 1.56, 0.64, 1)"
    const n = list.length
    const delayFor = (i: number) => (isOpen ? i * stagger : (n - 1 - i) * stagger * 0.5)

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false)
    }

    const renderIcon = (key: string) => (
        <svg
            width={itemSize * 0.5}
            height={itemSize * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            stroke={iconColor}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ display: "block" }}
        >
            {(ICONS[key] || ICONS.star).map((d, k) => (
                <path key={k} d={d} />
            ))}
        </svg>
    )

    return (
        <div
            ref={rootRef}
            onKeyDown={onKeyDown}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: W,
                    height: H,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                {/* Blob / goo morph layer */}
                {morph === "blob" && (
                    <svg
                        width={W}
                        height={H}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            overflow: "visible",
                            pointerEvents: "none",
                            zIndex: 1,
                        }}
                    >
                        <defs>
                            <filter
                                id={`${uid}goo`}
                                filterUnits="userSpaceOnUse"
                                x={-20}
                                y={-20}
                                width={W + 40}
                                height={H + 40}
                            >
                                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
                                <feColorMatrix
                                    in="b"
                                    mode="matrix"
                                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
                                />
                            </filter>
                        </defs>
                        <g filter={`url(#${uid}goo)`} fill={morphColor}>
                            <circle cx={cx} cy={cy} r={centerSize / 2 + 2} />
                            {pts.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={cx}
                                    cy={cy}
                                    r={itemSize / 2 + 4}
                                    style={{
                                        transformOrigin: `${cx}px ${cy}px`,
                                        transform: isOpen
                                            ? `translate(${p.x}px, ${p.y}px) scale(1)`
                                            : "translate(0px, 0px) scale(0.3)",
                                        transition: reduced
                                            ? "none"
                                            : `transform ${duration}s ${ease} ${delayFor(i)}s`,
                                    }}
                                />
                            ))}
                        </g>
                    </svg>
                )}

                {/* Chrome ring */}
                {showRing && (
                    <div
                        style={{
                            position: "absolute",
                            left: cx - ringBox / 2,
                            top: cy - ringBox / 2,
                            width: ringBox,
                            height: ringBox,
                            pointerEvents: "none",
                            zIndex: 2,
                            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
                        }}
                    >
                        <ChromeRing
                            box={ringBox}
                            radius={ringRadius}
                            thickness={ringThickness}
                            c1={ringColor1}
                            c2={ringColor2}
                            c3={ringColor3}
                            tint={ringTint}
                            animate={ringAnimated}
                            quality={quality}
                            uid={uid}
                        />
                    </div>
                )}

                {/* Centre button */}
                <button
                    type="button"
                    aria-label={ariaLabel}
                    aria-expanded={isOpen}
                    onClick={() => setOpen((o) => !o)}
                    style={{
                        position: "absolute",
                        left: cx - centerSize / 2,
                        top: cy - centerSize / 2,
                        width: centerSize,
                        height: centerSize,
                        borderRadius: "50%",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        background: centerColor,
                        overflow: "hidden",
                        cursor: "pointer",
                        zIndex: 3,
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    {centerImage?.src ? (
                        <img
                            src={centerImage.src}
                            srcSet={centerImage.srcSet}
                            alt={centerImage.alt || ""}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                transform: `rotate(${isOpen && spinCenter ? 180 : 0}deg)`,
                                transition: reduced ? "none" : `transform ${duration}s ${ease}`,
                            }}
                        />
                    ) : (
                        <svg
                            width={centerSize * 0.4}
                            height={centerSize * 0.4}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={iconColor}
                            strokeWidth={2}
                            strokeLinecap="round"
                            style={{
                                transform: `rotate(${isOpen ? 45 : 0}deg)`,
                                transition: reduced ? "none" : `transform ${duration}s ${ease}`,
                            }}
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    )}
                </button>

                {/* Items */}
                {list.map((it, i) => {
                    const p = pts[i]
                    const hovered = hover === i
                    const fx: HoverEffect = hoverEffect || "none"
                    const active = hovered && !reduced && fx !== "none"
                    const hs = hoverScale || 1
                    const dir = (Math.atan2(p.y, p.x) * 180) / Math.PI

                    // Hover morph: the shell (circle) and the icon each get their own transform,
                    // always written as the same function list so CSS can interpolate smoothly.
                    let shellTransform = "scale(1) rotate(0deg)"
                    let iconTransform = "scale(1) rotate(0deg)"
                    let shellRadius = "50%"
                    if (fx === "blob") {
                        shellTransform = active ? `scale(${hs}) rotate(10deg)` : "scale(1) rotate(0deg)"
                        iconTransform = active ? "scale(1.08) rotate(-10deg)" : "scale(1) rotate(0deg)"
                        shellRadius = active ? "42% 58% 55% 45% / 55% 42% 58% 45%" : "50%"
                    } else if (fx === "squish") {
                        const sx = active ? hs * 1.14 : 1
                        const sy = active ? hs * 0.88 : 1
                        shellTransform = `rotate(${dir}deg) scale(${sx}, ${sy}) rotate(${-dir}deg)`
                        iconTransform = `rotate(${dir}deg) scale(${1 / sx}, ${1 / sy}) rotate(${-dir}deg)`
                        shellRadius = active ? "50% 50% 50% 50% / 50% 50% 50% 50%" : "50%"
                    } else if (fx === "spin") {
                        shellTransform = active ? `scale(${hs}) rotate(0deg)` : "scale(1) rotate(0deg)"
                        iconTransform = active ? "scale(1.1) rotate(360deg)" : "scale(1) rotate(0deg)"
                    } else if (fx === "swap") {
                        shellTransform = active ? `scale(${hs}) rotate(0deg)` : "scale(1) rotate(0deg)"
                    }

                    const hoverT = `${hoverDuration}s ${spring}`
                    const swapKey = it.hoverIcon && it.hoverIcon !== "none" ? it.hoverIcon : null
                    const swapping = fx === "swap" && !!swapKey

                    const common: React.CSSProperties = {
                        position: "absolute",
                        left: cx - itemSize / 2,
                        top: cy - itemSize / 2,
                        width: itemSize,
                        height: itemSize,
                        borderRadius: "50%",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        background: "transparent",
                        display: "block",
                        textDecoration: "none",
                        cursor: "pointer",
                        zIndex: 4,
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? "auto" : "none",
                        transform: isOpen
                            ? `translate(${p.x}px, ${p.y}px) scale(1)`
                            : "translate(0px, 0px) scale(0.2)",
                        transition: reduced
                            ? "none"
                            : `transform ${duration}s ${ease} ${delayFor(i)}s, opacity ${duration * 0.6}s ease ${delayFor(i)}s`,
                    }

                    const swapLayer = (visible: boolean, enter: boolean): React.CSSProperties => ({
                        gridArea: "1 / 1",
                        display: "grid",
                        placeItems: "center",
                        opacity: visible ? 1 : 0,
                        transform: visible
                            ? "scale(1) rotate(0deg)"
                            : enter
                              ? "scale(0.4) rotate(90deg)"
                              : "scale(0.4) rotate(-90deg)",
                        filter: visible ? "blur(0px)" : "blur(3px)",
                        transition: reduced
                            ? "none"
                            : `transform ${hoverT}, opacity ${hoverDuration * 0.7}s ease, filter ${hoverDuration * 0.7}s ease`,
                    })

                    const inner = (
                        <>
                            <span
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "grid",
                                    placeItems: "center",
                                    borderRadius: shellRadius,
                                    background: hovered ? itemHoverColor : itemColor,
                                    boxShadow: active
                                        ? "0 8px 20px rgba(0,0,0,0.35)"
                                        : "0 0 0 rgba(0,0,0,0)",
                                    transform: shellTransform,
                                    transition: reduced
                                        ? "background 0.2s ease"
                                        : `transform ${hoverT}, border-radius ${hoverT}, background 0.25s ease, box-shadow 0.25s ease`,
                                }}
                            >
                                <span
                                    style={{
                                        display: "grid",
                                        placeItems: "center",
                                        transform: iconTransform,
                                        transition: reduced ? "none" : `transform ${hoverT}`,
                                    }}
                                >
                                    {swapping ? (
                                        <>
                                            <span style={swapLayer(!active, false)}>{renderIcon(it.icon)}</span>
                                            <span style={swapLayer(active, true)}>{renderIcon(swapKey as string)}</span>
                                        </>
                                    ) : (
                                        renderIcon(it.icon)
                                    )}
                                </span>
                            </span>
                            {it.badge ? (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: -4,
                                        right: -4,
                                        minWidth: 16,
                                        height: 16,
                                        padding: "0 4px",
                                        boxSizing: "border-box",
                                        borderRadius: 999,
                                        background: badgeColor,
                                        color: badgeTextColor,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        lineHeight: "16px",
                                        textAlign: "center",
                                        fontFamily: "Inter, system-ui, sans-serif",
                                        zIndex: 1,
                                    }}
                                >
                                    {it.badge}
                                </span>
                            ) : null}
                            <span
                                style={{
                                    position: "absolute",
                                    top: "calc(100% + 8px)",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    whiteSpace: "nowrap",
                                    fontSize: labelSize,
                                    color: labelColor,
                                    fontFamily: "Inter, system-ui, sans-serif",
                                    opacity: hovered ? 1 : 0,
                                    transition: "opacity 0.2s ease",
                                    pointerEvents: "none",
                                }}
                            >
                                {it.label}
                            </span>
                        </>
                    )
                    const handlers = {
                        onMouseEnter: () => setHover(i),
                        onMouseLeave: () => setHover(null),
                        onFocus: () => setHover(i),
                        onBlur: () => setHover(null),
                        onClick: () => {
                            if (closeOnSelect) setOpen(false)
                        },
                        "aria-label": it.label,
                        "aria-hidden": !isOpen,
                        tabIndex: isOpen ? 0 : -1,
                    }
                    return it.link ? (
                        <a
                            key={i}
                            href={it.link}
                            target={openInNewTab ? "_blank" : undefined}
                            rel={openInNewTab ? "noopener noreferrer" : undefined}
                            style={common}
                            {...handlers}
                        >
                            {inner}
                        </a>
                    ) : (
                        <button key={i} type="button" style={common} {...handlers}>
                            {inner}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

ChromeRadialMenu.defaultProps = {
    items: [
        { label: "Settings", icon: "settings", hoverIcon: "none", badge: "", angle: 90, distance: 70 },
        { label: "Profile", icon: "user", hoverIcon: "none", badge: "", angle: 45, distance: 70 },
        { label: "Discover", icon: "mushroom", hoverIcon: "none", badge: "", angle: 0, distance: 70 },
        { label: "Basket", icon: "basket", hoverIcon: "none", badge: "2", angle: 66, distance: 109 },
        { label: "Notifications", icon: "bell", hoverIcon: "none", badge: "12", angle: 25, distance: 110 },
    ],
    rotation: 0,
    hoverEffect: "blob",
    hoverScale: 1.15,
    hoverDuration: 0.5,
    morph: "blob",
    morphColor: "rgb(94, 94, 94)",
    labelColor: "rgb(255, 255, 255)",
    labelSize: 12,
    responsive: true,
    scaleUp: true,
    centerImage: {
        src: "https://framerusercontent.com/images/oAzg38s01RmKmesuu4FkAW2cs.png",
    },
    centerSize: 72,
    itemSize: 40,
    spread: 1,
    centerColor: "rgb(0, 0, 0)",
    showRing: true,
    ringGap: 6,
    ringThickness: 7,
    ringColor1: "#9fd8ff",
    ringColor2: "#c9b8ff",
    ringColor3: "#ffb8e6",
    ringTint: 0.55,
    ringAnimate: true,
    animateOnCanvas: false,
    itemColor: "rgb(41, 41, 41)",
    itemHoverColor: "rgb(157, 158, 158)",
    iconColor: "rgb(255, 255, 255)",
    badgeColor: "rgb(41, 41, 41)",
    badgeTextColor: "rgb(255, 255, 255)",
    duration: 0.45,
    stagger: 0.08,
    spinCenter: true,
    closeOnSelect: true,
    openInNewTab: false,
    defaultOpen: true,
    openOnCanvas: true,
    ariaLabel: "Radial menu",
}

addPropertyControls(ChromeRadialMenu, {
    items: {
        type: ControlType.Array,
        title: "Items",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "Item" },
                icon: {
                    type: ControlType.Enum,
                    title: "Icon",
                    options: ICON_KEYS,
                    optionTitles: ICON_KEYS.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
                    defaultValue: "star",
                },
                hoverIcon: {
                    type: ControlType.Enum,
                    title: "Hover Icon",
                    description: "Used by the Swap hover effect.",
                    options: ["none", ...ICON_KEYS],
                    optionTitles: ["None", ...ICON_KEYS.map((k) => k.charAt(0).toUpperCase() + k.slice(1))],
                    defaultValue: "none",
                },
                badge: { type: ControlType.String, title: "Badge", defaultValue: "" },
                angle: {
                    type: ControlType.Number,
                    title: "Angle",
                    min: -360,
                    max: 360,
                    step: 1,
                    unit: "°",
                    defaultValue: 45,
                },
                distance: {
                    type: ControlType.Number,
                    title: "Distance",
                    min: 20,
                    max: 400,
                    step: 1,
                    defaultValue: 70,
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    rotation: {
        type: ControlType.Number,
        title: "Direction",
        description: "Turns the whole menu around the center. 0° = as designed, 90° = rotate counter-clockwise, -90° = clockwise.",
        min: -360,
        max: 360,
        step: 1,
        unit: "°",
        displayStepper: true,
        defaultValue: 0,
    },
    hoverEffect: {
        type: ControlType.Enum,
        title: "Hover Morph",
        options: ["blob", "squish", "spin", "swap", "none"],
        optionTitles: ["Blob", "Squish", "Spin", "Swap Icon", "None"],
        defaultValue: "blob",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        min: 1,
        max: 1.6,
        step: 0.05,
        defaultValue: 1.15,
        hidden: (p) => p.hoverEffect === "none",
    },
    hoverDuration: {
        type: ControlType.Number,
        title: "Hover Speed",
        min: 0.15,
        max: 1.2,
        step: 0.05,
        unit: "s",
        defaultValue: 0.5,
        hidden: (p) => p.hoverEffect === "none",
    },
    morph: {
        type: ControlType.Enum,
        title: "Open Morph",
        options: ["blob", "none"],
        optionTitles: ["Blob", "None"],
        defaultValue: "blob",
    },
    morphColor: { type: ControlType.Color, title: "Blob", hidden: (p) => p.morph !== "blob" },
    responsive: { type: ControlType.Boolean, title: "Responsive", defaultValue: true },
    scaleUp: {
        type: ControlType.Boolean,
        title: "Scale Up",
        defaultValue: true,
        hidden: (p) => !p.responsive,
    },
    centerImage: { type: ControlType.ResponsiveImage, title: "Center" },
    centerSize: { type: ControlType.Number, title: "Center Size", min: 30, max: 200, defaultValue: 72 },
    centerColor: { type: ControlType.Color, title: "Center BG" },
    itemSize: { type: ControlType.Number, title: "Item Size", min: 24, max: 100, defaultValue: 40 },
    spread: { type: ControlType.Number, title: "Spread", min: 0.5, max: 2, step: 0.05, defaultValue: 1 },
    showRing: { type: ControlType.Boolean, title: "Chrome Ring", defaultValue: true },
    ringGap: {
        type: ControlType.Number,
        title: "Ring Gap",
        min: 0,
        max: 40,
        defaultValue: 6,
        hidden: (p) => !p.showRing,
    },
    ringThickness: {
        type: ControlType.Number,
        title: "Ring Width",
        min: 2,
        max: 24,
        step: 0.5,
        defaultValue: 7,
        hidden: (p) => !p.showRing,
    },
    ringColor1: { type: ControlType.Color, title: "Gradient 1", hidden: (p) => !p.showRing },
    ringColor2: { type: ControlType.Color, title: "Gradient 2", hidden: (p) => !p.showRing },
    ringColor3: { type: ControlType.Color, title: "Gradient 3", hidden: (p) => !p.showRing },
    ringTint: {
        type: ControlType.Number,
        title: "Gradient Mix",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.55,
        hidden: (p) => !p.showRing,
    },
    ringAnimate: {
        type: ControlType.Boolean,
        title: "Shimmer",
        defaultValue: true,
        hidden: (p) => !p.showRing,
    },
    animateOnCanvas: {
        type: ControlType.Boolean,
        title: "Shimmer on Canvas",
        defaultValue: false,
        hidden: (p) => !p.showRing || !p.ringAnimate,
    },
    itemColor: { type: ControlType.Color, title: "Item" },
    itemHoverColor: { type: ControlType.Color, title: "Item Hover" },
    iconColor: { type: ControlType.Color, title: "Icon" },
    badgeColor: { type: ControlType.Color, title: "Badge BG" },
    badgeTextColor: { type: ControlType.Color, title: "Badge Text" },
    labelColor: { type: ControlType.Color, title: "Label" },
    labelSize: { type: ControlType.Number, title: "Label Size", min: 8, max: 24, defaultValue: 12 },
    duration: { type: ControlType.Number, title: "Duration", min: 0.1, max: 2, step: 0.05, unit: "s", defaultValue: 0.45 },
    stagger: { type: ControlType.Number, title: "Stagger", min: 0, max: 0.4, step: 0.01, unit: "s", defaultValue: 0.08 },
    spinCenter: { type: ControlType.Boolean, title: "Spin Center", defaultValue: true },
    closeOnSelect: { type: ControlType.Boolean, title: "Close on Select", defaultValue: true },
    openInNewTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false },
    defaultOpen: { type: ControlType.Boolean, title: "Default Open", defaultValue: true },
    openOnCanvas: { type: ControlType.Boolean, title: "Open on Canvas", defaultValue: true },
    ariaLabel: { type: ControlType.String, title: "Aria Label", defaultValue: "Radial menu" },
})
