/**
 * Shader Hero — Framer Component (Full Edition)
 * Every visual aspect is editable from the Framer property panel
 *
 * SECTIONS
 *  • Shader / Background  — speed, color overlay, blend mode
 *  • Trust Badge          — toggle, emoji, text, colors, size, radius
 *  • Headline             — 2 lines, size, weight, letter-spacing, gradient
 *  • Subtitle             — text, color, size, weight, line-height, max-width
 *  • Layout               — alignment, max-width, padding, gap
 *  • Primary Button       — label, gradient, text color, size, radius, padding
 *  • Secondary Button     — label, fill, border, text, size, radius, padding
 *  • Button Group         — direction, gap
 *  • Entrance Animation   — on/off, duration
 */
import React, { useRef, useEffect } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// ─────────────────────────────────────────────────────────────────────────────
// GLSL  (speed controlled via uniform)
// ─────────────────────────────────────────────────────────────────────────────
const FRAG = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2  resolution;
uniform float time;
uniform float speed;
#define FC gl_FragCoord.xy
#define T  (time*speed)
#define R  resolution
#define MN min(R.x,R.y)
float rnd(vec2 p){p=fract(p*vec2(12.9898,78.233));p+=dot(p,p+34.56);return fract(p.x*p.y);}
float noise(in vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);float a=rnd(i),b=rnd(i+vec2(1,0)),c=rnd(i+vec2(0,1)),d=rnd(i+1.);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float t=.0,a=1.;mat2 m=mat2(1.,-.5,.2,1.2);for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}return t;}
float clouds(vec2 p){float d=1.,t=.0;for(float i=.0;i<3.;i++){float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);t=mix(t,d,a);d=a;p*=2./(i+1.);}return t;}
void main(void){
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for(float i=1.;i<12.;i++){
    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv; float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`

const VERT = `#version 300 es
precision highp float;
in vec4 position;
void main(){gl_Position=position;}`

// ─────────────────────────────────────────────────────────────────────────────
// WebGL Renderer
// ─────────────────────────────────────────────────────────────────────────────
class GLRenderer {
    gl: WebGL2RenderingContext
    canvas: HTMLCanvasElement
    program: WebGLProgram | null = null
    vs: WebGLShader | null = null
    fs: WebGLShader | null = null
    buf: WebGLBuffer | null = null
    mouse: number[] = [0, 0]
    move: number[] = [0, 0]
    ptCoords: number[] = [0, 0]
    ptCount: number = 0
    speed: number = 1
    private verts = [-1, 1, -1, -1, 1, 1, 1, -1]

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.gl = canvas.getContext("webgl2")!
    }

    private compile(sh: WebGLShader, src: string) {
        const { gl } = this
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
            console.error("Shader:", gl.getShaderInfoLog(sh))
    }

    setup() {
        const { gl } = this
        this.vs = gl.createShader(gl.VERTEX_SHADER)!
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!
        this.compile(this.vs, VERT)
        this.compile(this.fs, FRAG)
        this.program = gl.createProgram()!
        gl.attachShader(this.program, this.vs)
        gl.attachShader(this.program, this.fs)
        gl.linkProgram(this.program)
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
            console.error(gl.getProgramInfoLog(this.program))
    }

    init() {
        const { gl, program: p } = this
        if (!p) return
        this.buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.verts),
            gl.STATIC_DRAW
        )
        const pos = gl.getAttribLocation(p, "position")
        gl.enableVertexAttribArray(pos)
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
        ;(p as any).res = gl.getUniformLocation(p, "resolution")
        ;(p as any).t = gl.getUniformLocation(p, "time")
        ;(p as any).spd = gl.getUniformLocation(p, "speed")
        ;(p as any).mv = gl.getUniformLocation(p, "move")
        ;(p as any).tch = gl.getUniformLocation(p, "touch")
        ;(p as any).pc = gl.getUniformLocation(p, "pointerCount")
        ;(p as any).pts = gl.getUniformLocation(p, "pointers")
    }

    resize(w: number, h: number) {
        const dpr = Math.max(1, 0.5 * window.devicePixelRatio)
        this.canvas.width = w * dpr
        this.canvas.height = h * dpr
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    }

    render(now = 0) {
        const { gl, program: p } = this
        if (!p || gl.getProgramParameter(p, gl.DELETE_STATUS)) return
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(p)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
        gl.uniform2f((p as any).res, this.canvas.width, this.canvas.height)
        gl.uniform1f((p as any).t, now * 1e-3)
        gl.uniform1f((p as any).spd, this.speed)
        gl.uniform2f((p as any).mv, this.move[0], this.move[1])
        gl.uniform2f((p as any).tch, this.mouse[0], this.mouse[1])
        gl.uniform1i((p as any).pc, this.ptCount)
        gl.uniform2fv((p as any).pts, this.ptCoords)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    destroy() {
        const { gl } = this
        if (!this.program) return
        if (this.vs) {
            gl.detachShader(this.program, this.vs)
            gl.deleteShader(this.vs)
        }
        if (this.fs) {
            gl.detachShader(this.program, this.fs)
            gl.deleteShader(this.fs)
        }
        gl.deleteProgram(this.program)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pointer Tracker
// ─────────────────────────────────────────────────────────────────────────────
class Pointers {
    map = new Map<number, number[]>()
    last = [0, 0]
    moves = [0, 0]

    constructor(el: HTMLElement) {
        const pos = (e: PointerEvent) => {
            const r = el.getBoundingClientRect()
            return [e.clientX - r.left, r.height - (e.clientY - r.top)]
        }
        el.addEventListener("pointerdown", (e) =>
            this.map.set(e.pointerId, pos(e))
        )
        el.addEventListener("pointerup", (e) => {
            if (this.map.size === 1) this.last = this.first
            this.map.delete(e.pointerId)
        })
        el.addEventListener("pointerleave", (e) => {
            if (this.map.size === 1) this.last = this.first
            this.map.delete(e.pointerId)
        })
        el.addEventListener("pointermove", (e) => {
            if (!this.map.has(e.pointerId)) return
            this.map.set(e.pointerId, pos(e))
            this.moves = [
                this.moves[0] + e.movementX,
                this.moves[1] - e.movementY,
            ]
        })
    }

    get count() {
        return this.map.size
    }
    get coords() {
        return this.map.size > 0 ? Array.from(this.map.values()).flat() : [0, 0]
    }
    get first() {
        return this.map.values().next().value || this.last
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const hexToRgba = (hex: string, pct: number): string => {
    if (!hex || !hex.startsWith("#")) return hex ?? "transparent"
    let h = hex.slice(1)
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const n = parseInt(h, 16)
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${(pct / 100).toFixed(3)})`
}

const grad = (from: string, to: string, angle: number) =>
    `linear-gradient(${angle}deg, ${from}, ${to})`

// ─────────────────────────────────────────────────────────────────────────────
// Keyframe CSS
// ─────────────────────────────────────────────────────────────────────────────
const KEYFRAMES = `
@keyframes sh-down{from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:translateY(0)}}
@keyframes sh-up  {from{opacity:0;transform:translateY( 24px)}to{opacity:1;transform:translateY(0)}}
`

// ─────────────────────────────────────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
    // Shader / Background
    shaderSpeed: number
    overlayColor: string
    overlayOpacity: number
    overlayBlend: string

    // Badge
    showBadge: boolean
    badgeEmoji: string
    badgeText: string
    badgeBg: string
    badgeBgOpacity: number
    badgeBorderColor: string
    badgeBorderOpacity: number
    badgeTextColor: string
    badgeFontSize: number
    badgeRadius: number

    // Headline
    line1: string
    showLine2: boolean
    line2: string
    headlineSize: number
    headlineWeight: string
    headlineSpacing: number
    headlineLineHeight: number
    gradientFrom: string
    gradientTo: string
    gradientAngle: number

    // Subtitle
    subtitle: string
    subtitleColor: string
    subtitleSize: number
    subtitleWeight: string
    subtitleLineHeight: number
    subtitleMaxWidth: number

    // Layout
    textAlign: string
    contentMaxWidth: number
    verticalAlign: string
    paddingX: number
    paddingY: number
    elementGap: number

    // Primary Button
    showPrimary: boolean
    primaryLabel: string
    primaryBgFrom: string
    primaryBgTo: string
    primaryBgAngle: number
    primaryTextColor: string
    primaryFontSize: number
    primaryRadius: number
    primaryPaddingH: number
    primaryPaddingV: number
    onPrimaryClick?: () => void

    // Secondary Button
    showSecondary: boolean
    secondaryLabel: string
    secondaryBg: string
    secondaryBgOpacity: number
    secondaryTextColor: string
    secondaryBorderColor: string
    secondaryBorderOpacity: number
    secondaryFontSize: number
    secondaryRadius: number
    secondaryPaddingH: number
    secondaryPaddingV: number
    onSecondaryClick?: () => void

    // Button Group
    buttonDirection: string
    buttonGap: number

    // Animation
    enableAnimations: boolean
    animDuration: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ShaderHero(props: Props) {
    const {
        // Shader
        shaderSpeed = 1,
        overlayColor = "#000000",
        overlayOpacity = 0,
        overlayBlend = "normal",

        // Badge
        showBadge = true,
        badgeEmoji = "⭐⭐⭐",
        badgeText = "Trusted by 10,000+ teams worldwide",
        badgeBg = "#f97316",
        badgeBgOpacity = 10,
        badgeBorderColor = "#fba878",
        badgeBorderOpacity = 30,
        badgeTextColor = "#fed7aa",
        badgeFontSize = 14,
        badgeRadius = 9999,

        // Headline
        line1 = "Build Something",
        showLine2 = true,
        line2 = "Extraordinary",
        headlineSize = 80,
        headlineWeight = "700",
        headlineSpacing = -0.5,
        headlineLineHeight = 1.1,
        gradientFrom = "#fb923c",
        gradientTo = "#facc15",
        gradientAngle = 90,

        // Subtitle
        subtitle = "A powerful platform to bring your ideas to life with beautiful animations.",
        subtitleColor = "#fed7aa",
        subtitleSize = 20,
        subtitleWeight = "300",
        subtitleLineHeight = 1.7,
        subtitleMaxWidth = 600,

        // Layout
        textAlign = "center",
        contentMaxWidth = 900,
        verticalAlign = "center",
        paddingX = 24,
        paddingY = 48,
        elementGap = 24,

        // Primary
        showPrimary = true,
        primaryLabel = "Get Started Free",
        primaryBgFrom = "#f97316",
        primaryBgTo = "#eab308",
        primaryBgAngle = 90,
        primaryTextColor = "#000000",
        primaryFontSize = 17,
        primaryRadius = 9999,
        primaryPaddingH = 32,
        primaryPaddingV = 14,
        onPrimaryClick,

        // Secondary
        showSecondary = true,
        secondaryLabel = "Watch Demo",
        secondaryBg = "#f97316",
        secondaryBgOpacity = 10,
        secondaryTextColor = "#fed7aa",
        secondaryBorderColor = "#fba878",
        secondaryBorderOpacity = 30,
        secondaryFontSize = 17,
        secondaryRadius = 9999,
        secondaryPaddingH = 32,
        secondaryPaddingV = 14,
        onSecondaryClick,

        // Buttons
        buttonDirection = "row",
        buttonGap = 16,

        // Animation
        enableAnimations = true,
        animDuration = 0.8,
    } = props

    // ── Refs ──────────────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>()
    const glRef = useRef<GLRenderer>()
    // Stable instance ID so gradient CSS classes are scoped per component instance
    const instanceId = useRef(`sh${Math.floor(Math.random() * 1e6)}`).current

    // Hot-update shader speed without remounting WebGL context
    useEffect(() => {
        if (glRef.current) glRef.current.speed = shaderSpeed
    }, [shaderSpeed])

    // ── WebGL lifecycle ───────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = new GLRenderer(canvas)
        const pt = new Pointers(canvas)
        glRef.current = gl
        gl.speed = shaderSpeed

        gl.setup()
        gl.init()
        gl.resize(container.clientWidth, container.clientHeight)

        const loop = (now: number) => {
            gl.mouse = pt.first
            gl.ptCount = pt.count
            gl.ptCoords = pt.coords
            gl.move = pt.moves
            gl.render(now)
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)

        const ro = new ResizeObserver(() =>
            gl.resize(container.clientWidth, container.clientHeight)
        )
        ro.observe(container)

        return () => {
            cancelAnimationFrame(rafRef.current!)
            ro.disconnect()
            gl.destroy()
        }
    }, []) // mount/unmount only

    // ── Animation helper ──────────────────────────────────────────────────────
    const anim = (dir: "up" | "down", delay: number): React.CSSProperties =>
        enableAnimations
            ? {
                  animation: `sh-${dir} ${animDuration}s ease-out ${delay}s both`,
              }
            : {}

    // ── Button hover helper ───────────────────────────────────────────────────
    const onHover = (e: React.MouseEvent<HTMLButtonElement>, s: number) =>
        (e.currentTarget.style.transform = `scale(${s})`)

    // ── Derived values ────────────────────────────────────────────────────────
    const alignItems =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center"
    const justContent =
        verticalAlign === "top"
            ? "flex-start"
            : verticalAlign === "bottom"
              ? "flex-end"
              : "center"
    const textAlignCSS = textAlign as React.CSSProperties["textAlign"]

    // Fluid type: scales from ~45% of max on mobile → full size at 1440px desktop
    const headlineMin = Math.round(headlineSize * 0.45)
    const headlineVw = (headlineSize / 14.4).toFixed(1) // hits max at 1440px viewport

    const subtitleMin = Math.max(13, Math.round(subtitleSize * 0.72))
    const subtitleVw = (subtitleSize / 14.4).toFixed(1)

    const h1Base: React.CSSProperties = {
        fontSize: `clamp(${headlineMin}px, ${headlineVw}vw, ${headlineSize}px)`,
        fontWeight: headlineWeight,
        letterSpacing: `${headlineSpacing}px`,
        lineHeight: headlineLineHeight,
        margin: 0,
    }

    // Inject gradient-text CSS via <style> tag so Framer cannot override it.
    // Inline styles lose to Framer's internal style system; !important in a
    // <style> block wins regardless of what Framer injects on the element.
    const gradientCSS = `
.${instanceId}-g1 {
  display: block;
  background: linear-gradient(${gradientAngle}deg, ${gradientFrom}, ${gradientTo}) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}
.${instanceId}-g2 {
  display: block;
  background: linear-gradient(${gradientAngle}deg, ${gradientTo}, ${gradientFrom}) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
  color: transparent !important;
}`

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000",
                minHeight: 400,
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif",
            }}
        >
            <style>{KEYFRAMES + gradientCSS}</style>

            {/* ── WebGL canvas ── */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    touchAction: "none",
                }}
            />

            {/* ── Color overlay ── */}
            {overlayOpacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: hexToRgba(overlayColor, overlayOpacity),
                        mixBlendMode:
                            overlayBlend as React.CSSProperties["mixBlendMode"],
                    }}
                />
            )}

            {/* ── Content overlay ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems,
                    justifyContent: justContent,
                    padding: `${paddingY}px ${paddingX}px`,
                    gap: `${elementGap}px`,
                    color: "#fff",
                    boxSizing: "border-box",
                }}
            >
                {/* ── Trust Badge ── */}
                {showBadge && (
                    <div style={anim("down", 0)}>
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                padding: `${Math.round(badgeFontSize * 0.72)}px ${Math.round(badgeFontSize * 1.7)}px`,
                                background: hexToRgba(badgeBg, badgeBgOpacity),
                                backdropFilter: "blur(12px)",
                                border: `1px solid ${hexToRgba(badgeBorderColor, badgeBorderOpacity)}`,
                                borderRadius: badgeRadius,
                                fontSize: badgeFontSize,
                                color: badgeTextColor,
                            }}
                        >
                            {badgeEmoji && <span>{badgeEmoji}</span>}
                            <span>{badgeText}</span>
                        </div>
                    </div>
                )}

                {/* ── Headlines ── */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        maxWidth: contentMaxWidth,
                        width: "100%",
                        textAlign: textAlignCSS,
                    }}
                >
                    <h1 style={{ ...h1Base, ...anim("up", 0.15) }}>
                        <span className={`${instanceId}-g1`}>{line1}</span>
                    </h1>

                    {showLine2 && (
                        <h1 style={{ ...h1Base, ...anim("up", 0.3) }}>
                            <span className={`${instanceId}-g2`}>{line2}</span>
                        </h1>
                    )}
                </div>

                {/* ── Subtitle ── */}
                {subtitle && (
                    <p
                        style={{
                            ...anim("up", 0.45),
                            maxWidth: subtitleMaxWidth,
                            fontSize: `clamp(${subtitleMin}px, ${subtitleVw}vw, ${subtitleSize}px)`,
                            fontWeight: subtitleWeight,
                            lineHeight: subtitleLineHeight,
                            color: subtitleColor,
                            margin: 0,
                            textAlign: textAlignCSS,
                        }}
                    >
                        {subtitle}
                    </p>
                )}

                {/* ── Button Group ── */}
                {(showPrimary || showSecondary) && (
                    <div
                        style={{
                            ...anim("up", 0.6),
                            display: "flex",
                            flexDirection:
                                buttonDirection as React.CSSProperties["flexDirection"],
                            flexWrap: "wrap",
                            gap: buttonGap,
                            justifyContent: alignItems,
                        }}
                    >
                        {/* Primary */}
                        {showPrimary && (
                            <button
                                onClick={onPrimaryClick}
                                onMouseEnter={(e) => onHover(e, 1.05)}
                                onMouseLeave={(e) => onHover(e, 1.0)}
                                onMouseDown={(e) => onHover(e, 0.97)}
                                onMouseUp={(e) => onHover(e, 1.05)}
                                style={{
                                    padding: `${primaryPaddingV}px ${primaryPaddingH}px`,
                                    background: grad(
                                        primaryBgFrom,
                                        primaryBgTo,
                                        primaryBgAngle
                                    ),
                                    color: primaryTextColor,
                                    fontSize: primaryFontSize,
                                    fontWeight: 600,
                                    fontFamily: "inherit",
                                    borderRadius: primaryRadius,
                                    border: "none",
                                    cursor: "pointer",
                                    transition:
                                        "transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s",
                                    boxShadow: `0 4px 28px ${hexToRgba(primaryBgFrom, 28)}`,
                                }}
                            >
                                {primaryLabel}
                            </button>
                        )}

                        {/* Secondary */}
                        {showSecondary && (
                            <button
                                onClick={onSecondaryClick}
                                onMouseEnter={(e) => onHover(e, 1.05)}
                                onMouseLeave={(e) => onHover(e, 1.0)}
                                onMouseDown={(e) => onHover(e, 0.97)}
                                onMouseUp={(e) => onHover(e, 1.05)}
                                style={{
                                    padding: `${secondaryPaddingV}px ${secondaryPaddingH}px`,
                                    background: hexToRgba(
                                        secondaryBg,
                                        secondaryBgOpacity
                                    ),
                                    color: secondaryTextColor,
                                    fontSize: secondaryFontSize,
                                    fontWeight: 600,
                                    fontFamily: "inherit",
                                    borderRadius: secondaryRadius,
                                    border: `1px solid ${hexToRgba(secondaryBorderColor, secondaryBorderOpacity)}`,
                                    cursor: "pointer",
                                    backdropFilter: "blur(10px)",
                                    transition:
                                        "transform .22s cubic-bezier(.34,1.56,.64,1)",
                                }}
                            >
                                {secondaryLabel}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Property Controls  (60 controls across 9 sections)
// ─────────────────────────────────────────────────────────────────────────────
addPropertyControls(ShaderHero, {
    // ══════════════════════════════════════════════════════════════════════════
    // SHADER / BACKGROUND
    // ══════════════════════════════════════════════════════════════════════════
    shaderSpeed: {
        type: ControlType.Number,
        title: "Anim Speed",
        defaultValue: 1,
        min: 0,
        max: 4,
        step: 0.05,
        unit: "×",
        description: "0 = paused · 1 = normal · 2 = double speed",
    },
    overlayColor: {
        type: ControlType.Color,
        title: "Overlay Color",
        defaultValue: "#000000",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Overlay Opacity",
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
    },
    overlayBlend: {
        type: ControlType.Enum,
        title: "Blend Mode",
        defaultValue: "normal",
        options: [
            "normal",
            "multiply",
            "screen",
            "overlay",
            "color",
            "soft-light",
            "hard-light",
            "color-dodge",
            "color-burn",
        ],
        optionTitles: [
            "Normal",
            "Multiply",
            "Screen",
            "Overlay",
            "Color",
            "Soft Light",
            "Hard Light",
            "Color Dodge",
            "Color Burn",
        ],
        hidden: (p) => p.overlayOpacity === 0,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // TRUST BADGE
    // ══════════════════════════════════════════════════════════════════════════
    showBadge: {
        type: ControlType.Boolean,
        title: "Badge",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    badgeEmoji: {
        type: ControlType.String,
        title: "Emoji",
        defaultValue: "⭐⭐⭐",
        hidden: (p) => !p.showBadge,
    },
    badgeText: {
        type: ControlType.String,
        title: "Badge Text",
        defaultValue: "Trusted by 10,000+ teams worldwide",
        hidden: (p) => !p.showBadge,
    },
    badgeFontSize: {
        type: ControlType.Number,
        title: "Badge Size",
        defaultValue: 14,
        min: 10,
        max: 24,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showBadge,
    },
    badgeRadius: {
        type: ControlType.Number,
        title: "Badge Radius",
        defaultValue: 9999,
        min: 0,
        max: 9999,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showBadge,
    },
    badgeBg: {
        type: ControlType.Color,
        title: "Badge Fill",
        defaultValue: "#f97316",
        hidden: (p) => !p.showBadge,
    },
    badgeBgOpacity: {
        type: ControlType.Number,
        title: "Fill Opacity",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showBadge,
    },
    badgeBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#fba878",
        hidden: (p) => !p.showBadge,
    },
    badgeBorderOpacity: {
        type: ControlType.Number,
        title: "Border Opacity",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showBadge,
    },
    badgeTextColor: {
        type: ControlType.Color,
        title: "Badge Text",
        defaultValue: "#fed7aa",
        hidden: (p) => !p.showBadge,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // HEADLINE
    // ══════════════════════════════════════════════════════════════════════════
    line1: {
        type: ControlType.String,
        title: "Headline 1",
        defaultValue: "Build Something",
    },
    showLine2: {
        type: ControlType.Boolean,
        title: "Line 2",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    line2: {
        type: ControlType.String,
        title: "Headline 2",
        defaultValue: "Extraordinary",
        hidden: (p) => !p.showLine2,
    },
    headlineSize: {
        type: ControlType.Number,
        title: "Max Font Size",
        defaultValue: 80,
        min: 24,
        max: 160,
        step: 2,
        unit: "px",
    },
    headlineWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        defaultValue: "700",
        options: ["300", "400", "500", "600", "700", "800", "900"],
        optionTitles: [
            "Light",
            "Regular",
            "Medium",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
    },
    headlineSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: -0.5,
        min: -8,
        max: 12,
        step: 0.5,
        unit: "px",
    },
    headlineLineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.1,
        min: 0.8,
        max: 2,
        step: 0.05,
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "Gradient From",
        defaultValue: "#fb923c",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "Gradient To",
        defaultValue: "#facc15",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Gradient Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SUBTITLE
    // ══════════════════════════════════════════════════════════════════════════
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue:
            "A powerful platform to bring your ideas to life with beautiful animations.",
        displayTextArea: true,
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Subtitle Color",
        defaultValue: "#fed7aa",
    },
    subtitleSize: {
        type: ControlType.Number,
        title: "Subtitle Size",
        defaultValue: 20,
        min: 12,
        max: 40,
        step: 1,
        unit: "px",
    },
    subtitleWeight: {
        type: ControlType.Enum,
        title: "Subtitle Weight",
        defaultValue: "300",
        options: ["300", "400", "500", "600"],
        optionTitles: ["Light", "Regular", "Medium", "SemiBold"],
    },
    subtitleLineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 1.7,
        min: 1,
        max: 3,
        step: 0.1,
    },
    subtitleMaxWidth: {
        type: ControlType.Number,
        title: "Max Width",
        defaultValue: 600,
        min: 200,
        max: 1400,
        step: 20,
        unit: "px",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        defaultValue: "center",
        options: ["left", "center", "right"],
        optionTitles: ["Left", "Center", "Right"],
        displaySegmentedControl: true,
    },
    verticalAlign: {
        type: ControlType.Enum,
        title: "Vertical",
        defaultValue: "center",
        options: ["top", "center", "bottom"],
        optionTitles: ["Top", "Center", "Bottom"],
        displaySegmentedControl: true,
    },
    contentMaxWidth: {
        type: ControlType.Number,
        title: "Content Width",
        defaultValue: 900,
        min: 320,
        max: 1600,
        step: 20,
        unit: "px",
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 24,
        min: 0,
        max: 160,
        step: 4,
        unit: "px",
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 48,
        min: 0,
        max: 200,
        step: 4,
        unit: "px",
    },
    elementGap: {
        type: ControlType.Number,
        title: "Section Gap",
        defaultValue: 24,
        min: 0,
        max: 80,
        step: 4,
        unit: "px",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // PRIMARY BUTTON
    // ══════════════════════════════════════════════════════════════════════════
    showPrimary: {
        type: ControlType.Boolean,
        title: "Primary Btn",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    primaryLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started Free",
        hidden: (p) => !p.showPrimary,
    },
    primaryBgFrom: {
        type: ControlType.Color,
        title: "Gradient A",
        defaultValue: "#f97316",
        hidden: (p) => !p.showPrimary,
    },
    primaryBgTo: {
        type: ControlType.Color,
        title: "Gradient B",
        defaultValue: "#eab308",
        hidden: (p) => !p.showPrimary,
    },
    primaryBgAngle: {
        type: ControlType.Number,
        title: "Grad Angle",
        defaultValue: 90,
        min: 0,
        max: 360,
        step: 5,
        unit: "°",
        hidden: (p) => !p.showPrimary,
    },
    primaryTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
        hidden: (p) => !p.showPrimary,
    },
    primaryFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 17,
        min: 12,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showPrimary,
    },
    primaryRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 9999,
        min: 0,
        max: 9999,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showPrimary,
    },
    primaryPaddingH: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 32,
        min: 8,
        max: 80,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showPrimary,
    },
    primaryPaddingV: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showPrimary,
    },
    onPrimaryClick: {
        type: ControlType.EventHandler,
        title: "→ On Click",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SECONDARY BUTTON
    // ══════════════════════════════════════════════════════════════════════════
    showSecondary: {
        type: ControlType.Boolean,
        title: "Secondary Btn",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    secondaryLabel: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Watch Demo",
        hidden: (p) => !p.showSecondary,
    },
    secondaryBg: {
        type: ControlType.Color,
        title: "Fill Color",
        defaultValue: "#f97316",
        hidden: (p) => !p.showSecondary,
    },
    secondaryBgOpacity: {
        type: ControlType.Number,
        title: "Fill Opacity",
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showSecondary,
    },
    secondaryTextColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#fed7aa",
        hidden: (p) => !p.showSecondary,
    },
    secondaryBorderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#fba878",
        hidden: (p) => !p.showSecondary,
    },
    secondaryBorderOpacity: {
        type: ControlType.Number,
        title: "Border Opacity",
        defaultValue: 30,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showSecondary,
    },
    secondaryFontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 17,
        min: 12,
        max: 32,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showSecondary,
    },
    secondaryRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 9999,
        min: 0,
        max: 9999,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showSecondary,
    },
    secondaryPaddingH: {
        type: ControlType.Number,
        title: "Padding H",
        defaultValue: 32,
        min: 8,
        max: 80,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showSecondary,
    },
    secondaryPaddingV: {
        type: ControlType.Number,
        title: "Padding V",
        defaultValue: 14,
        min: 4,
        max: 40,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showSecondary,
    },
    onSecondaryClick: {
        type: ControlType.EventHandler,
        title: "→ On Click",
    },

    // ══════════════════════════════════════════════════════════════════════════
    // BUTTON GROUP
    // ══════════════════════════════════════════════════════════════════════════
    buttonDirection: {
        type: ControlType.Enum,
        title: "Btn Layout",
        defaultValue: "row",
        options: ["row", "column"],
        optionTitles: ["Horizontal", "Vertical"],
        displaySegmentedControl: true,
        hidden: (p) => !p.showPrimary && !p.showSecondary,
    },
    buttonGap: {
        type: ControlType.Number,
        title: "Button Gap",
        defaultValue: 16,
        min: 0,
        max: 60,
        step: 2,
        unit: "px",
        hidden: (p) => !p.showPrimary && !p.showSecondary,
    },

    // ══════════════════════════════════════════════════════════════════════════
    // ENTRANCE ANIMATION
    // ══════════════════════════════════════════════════════════════════════════
    enableAnimations: {
        type: ControlType.Boolean,
        title: "Animate In",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    animDuration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.8,
        min: 0.2,
        max: 3,
        step: 0.1,
        unit: "s",
        hidden: (p) => !p.enableAnimations,
    },
})
