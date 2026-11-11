// Pixel Blast
// Created by Frankie from Framer-Expert.com

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


interface Props {
    variant?: "square" | "circle" | "triangle" | "diamond" | "star" | "cross"
    pixelSize?: number
    color?: string
    pixelSizeJitter?: number
    rippleIntensity?: number
    rippleThickness?: number
    rippleSpeed?: number
    rippleDuration?: number
    edgeFade?: number
    hintText?: string
    hintColor?: string
    showHint?: boolean
}

const SHAPE_MAP: Record<string, number> = {
    square: 0,
    circle: 1,
    triangle: 2,
    diamond: 3,
    star: 4,
    cross: 5,
}
const MAX_CLICKS = 10

const VERT = `precision highp float;
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}`

const FRAG = `precision highp float;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uPixelJitter;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uRippleDuration;
uniform float uEdgeFade;
uniform int uShapeType;

const int MAX_CLICKS = 10;
uniform vec2 uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

float hash11(float n) {
    return fract(sin(n) * 43758.5453);
}

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Square - full cell coverage
float maskSquare(vec2 p, float cov) {
    if (cov <= 0.0) return 0.0;
    float size = sqrt(cov);
    vec2 d = abs(p - 0.5);
    return cov * (1.0 - smoothstep(size * 0.45, size * 0.5, max(d.x, d.y)));
}

// Circle - round shape
float maskCircle(vec2 p, float cov) {
    if (cov <= 0.0) return 0.0;
    float r = sqrt(cov) * 0.5;
    return cov * (1.0 - smoothstep(r * 0.8, r, length(p - 0.5)));
}

// Triangle - pointed shape
float maskTriangle(vec2 p, vec2 id, float cov) {
    if (cov <= 0.0) return 0.0;
    float flip = mod(id.x + id.y, 2.0);
    vec2 tp = p - 0.5;
    if (flip > 0.5) tp.y = -tp.y;
    float size = sqrt(cov) * 0.6;
    float tri = max(abs(tp.x) * 1.73 + tp.y, -tp.y * 2.0);
    return cov * (1.0 - smoothstep(size * 0.8, size, tri));
}

// Diamond - rotated square, sharp points
float maskDiamond(vec2 p, float cov) {
    if (cov <= 0.0) return 0.0;
    float size = sqrt(cov) * 0.7;
    float d = abs(p.x - 0.5) + abs(p.y - 0.5);
    return cov * (1.0 - smoothstep(size * 0.4, size * 0.5, d));
}

// Star - 4-pointed star
float maskStar(vec2 p, float cov) {
    if (cov <= 0.0) return 0.0;
    vec2 d = abs(p - 0.5);
    float size = sqrt(cov) * 0.5;
    float star = min(d.x + d.y * 0.4, d.y + d.x * 0.4);
    return cov * (1.0 - smoothstep(size * 0.3, size * 0.4, star));
}

// Cross - plus shape
float maskCross(vec2 p, float cov) {
    if (cov <= 0.0) return 0.0;
    vec2 d = abs(p - 0.5);
    float size = sqrt(cov) * 0.5;
    float thickness = size * 0.3;
    float cross = min(d.x, d.y);
    float bounds = max(d.x, d.y);
    return cov * (1.0 - smoothstep(thickness * 0.8, thickness, cross)) * (1.0 - smoothstep(size * 0.9, size, bounds));
}

void main() {
    float ps = uPixelSize;
    float dpr = 1.0;
    vec2 fc = gl_FragCoord.xy;
    float ar = uResolution.x / uResolution.y;
    
    vec2 pid = floor(fc / ps);
    vec2 puv = fract(fc / ps);
    
    // Calculate ripple contribution from clicks only
    float feed = 0.0;
    
    for (int i = 0; i < MAX_CLICKS; i++) {
        vec2 pos = uClickPos[i];
        if (pos.x < 0.0) continue;
        
        float clickTime = uClickTimes[i];
        float elapsed = uTime - clickTime;
        if (elapsed < 0.0 || elapsed > uRippleDuration) continue;
        
        // Distance from click point
        float dist = distance(fc, pos);
        
        // Expanding ring
        float ringRadius = elapsed * uRippleSpeed * 500.0;
        float ringDist = abs(dist - ringRadius);
        
        // Ring intensity with thickness control
        float ring = exp(-ringDist * ringDist / (uRippleThickness * 5000.0));
        
        // Fade out over time
        float timeFade = 1.0 - (elapsed / uRippleDuration);
        timeFade = timeFade * timeFade;
        
        // Distance fade
        float distFade = exp(-dist * 0.002);
        
        feed = max(feed, ring * timeFade * distFade * uRippleIntensity);
    }
    
    // Apply threshold and jitter
    float h = hash21(pid);
    float threshold = 0.3 + h * 0.2;
    float cov = smoothstep(threshold - 0.1, threshold + 0.1, feed);
    cov *= (1.0 + (h - 0.5) * uPixelJitter);
    
    // Apply shape mask
    float M = cov;
    if (uShapeType == 0) M = maskSquare(puv, cov);
    else if (uShapeType == 1) M = maskCircle(puv, cov);
    else if (uShapeType == 2) M = maskTriangle(puv, pid, cov);
    else if (uShapeType == 3) M = maskDiamond(puv, cov);
    else if (uShapeType == 4) M = maskStar(puv, cov);
    else if (uShapeType == 5) M = maskCross(puv, cov);
    
    // Edge fade
    if (uEdgeFade > 0.0) {
        vec2 n = gl_FragCoord.xy / uResolution;
        M *= smoothstep(0.0, uEdgeFade, min(min(n.x, n.y), min(1.0 - n.x, 1.0 - n.y)));
    }
    
    gl_FragColor = vec4(uColor, M);
}`

function parseColor(c: string): [number, number, number] {
    if (!c) return [0.69, 0.62, 0.94]
    const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m)
        return [
            parseInt(m[1]) / 255,
            parseInt(m[2]) / 255,
            parseInt(m[3]) / 255,
        ]
    let h = c.replace("#", "")
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    if (h.length === 8) h = h.slice(0, 6)
    const r = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    return r
        ? [
              parseInt(r[1], 16) / 255,
              parseInt(r[2], 16) / 255,
              parseInt(r[3], 16) / 255,
          ]
        : [0.69, 0.62, 0.94]
}

function PixelBlast(props: Props): JSX.Element {
    const {
        variant = "circle",
        pixelSize = 4,
        color = "#B19EEF",
        pixelSizeJitter = 0.2,
        rippleIntensity = 1.5,
        rippleThickness = 0.15,
        rippleSpeed = 0.4,
        rippleDuration = 2,
        edgeFade = 0.1,
        hintText = "Click to see the magic ✨",
        hintColor = "#ffffff",
        showHint = true,
    } = props

    const containerRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const stateRef = React.useRef<{
        gl: WebGLRenderingContext | null
        u: Record<string, WebGLUniformLocation | null>
        raf: number
        start: number
        clickPos: Float32Array | null
        clickTimes: Float32Array | null
        clickIdx: number
    }>({
        gl: null,
        u: {},
        raf: 0,
        start: 0,
        clickPos: null,
        clickTimes: null,
        clickIdx: 0,
    })
    const propsRef = React.useRef(props)
    const [mounted, setMounted] = React.useState(false)
    const [isHovering, setIsHovering] = React.useState(false)
    const [hasClicked, setHasClicked] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    React.useEffect(() => {
        propsRef.current = props
    }, [props])

    React.useEffect(() => {
        if (!mounted) return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const s = stateRef.current
        s.clickPos = new Float32Array(MAX_CLICKS * 2).fill(-1)
        s.clickTimes = new Float32Array(MAX_CLICKS).fill(-100)

        const gl = canvas.getContext("webgl", {
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
        })
        if (!gl) return
        s.gl = gl

        const vs = gl.createShader(gl.VERTEX_SHADER)!
        gl.shaderSource(vs, VERT)
        gl.compileShader(vs)
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vs))
            return
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER)!
        gl.shaderSource(fs, FRAG)
        gl.compileShader(fs)
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fs))
            return
        }

        const prog = gl.createProgram()!
        gl.attachShader(prog, vs)
        gl.attachShader(prog, fs)
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]),
            gl.STATIC_DRAW
        )
        const pos = gl.getAttribLocation(prog, "position")
        gl.enableVertexAttribArray(pos)
        gl.vertexAttribPointer(pos, 3, gl.FLOAT, false, 0, 0)

        s.u = {
            uResolution: gl.getUniformLocation(prog, "uResolution"),
            uTime: gl.getUniformLocation(prog, "uTime"),
            uColor: gl.getUniformLocation(prog, "uColor"),
            uPixelSize: gl.getUniformLocation(prog, "uPixelSize"),
            uPixelJitter: gl.getUniformLocation(prog, "uPixelJitter"),
            uShapeType: gl.getUniformLocation(prog, "uShapeType"),
            uRippleSpeed: gl.getUniformLocation(prog, "uRippleSpeed"),
            uRippleThickness: gl.getUniformLocation(prog, "uRippleThickness"),
            uRippleIntensity: gl.getUniformLocation(prog, "uRippleIntensity"),
            uRippleDuration: gl.getUniformLocation(prog, "uRippleDuration"),
            uEdgeFade: gl.getUniformLocation(prog, "uEdgeFade"),
            uClickPos: gl.getUniformLocation(prog, "uClickPos"),
            uClickTimes: gl.getUniformLocation(prog, "uClickTimes"),
        }

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        s.start = performance.now() / 1000

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const w = container.clientWidth
            const h = container.clientHeight
            canvas.width = w * dpr
            canvas.height = h * dpr
            canvas.style.width = w + "px"
            canvas.style.height = h + "px"
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(container)

        const animate = () => {
            const p = propsRef.current
            const [r, g, b] = parseColor(p.color || "#B19EEF")
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const time = performance.now() / 1000 - s.start
            const u = s.u

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.uniform2f(u.uResolution, canvas.width, canvas.height)
            gl.uniform1f(u.uTime, time)
            gl.uniform3f(u.uColor, r, g, b)
            gl.uniform1f(u.uPixelSize, (p.pixelSize || 4) * dpr)
            gl.uniform1f(u.uPixelJitter, p.pixelSizeJitter ?? 0.2)
            gl.uniform1i(u.uShapeType, SHAPE_MAP[p.variant || "circle"] ?? 1)
            gl.uniform1f(u.uRippleSpeed, p.rippleSpeed ?? 0.4)
            gl.uniform1f(u.uRippleThickness, p.rippleThickness ?? 0.15)
            gl.uniform1f(u.uRippleIntensity, p.rippleIntensity ?? 1.5)
            gl.uniform1f(u.uRippleDuration, p.rippleDuration ?? 2)
            gl.uniform1f(u.uEdgeFade, p.edgeFade ?? 0.1)
            if (s.clickPos && s.clickTimes) {
                gl.uniform2fv(u.uClickPos, s.clickPos)
                gl.uniform1fv(u.uClickTimes, s.clickTimes)
            }
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
            s.raf = requestAnimationFrame(animate)
        }
        s.raf = requestAnimationFrame(animate)

        const onClick = (e: PointerEvent) => {
            if (!s.clickPos || !s.clickTimes) return
            const rect = canvas.getBoundingClientRect()
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const x = (e.clientX - rect.left) * dpr
            const y = (rect.height - (e.clientY - rect.top)) * dpr
            s.clickPos[s.clickIdx * 2] = x
            s.clickPos[s.clickIdx * 2 + 1] = y
            s.clickTimes[s.clickIdx] = performance.now() / 1000 - s.start
            s.clickIdx = (s.clickIdx + 1) % MAX_CLICKS
            setHasClicked(true)
        }
        canvas.addEventListener("pointerdown", onClick)

        return () => {
            cancelAnimationFrame(s.raf)
            ro.disconnect()
            canvas.removeEventListener("pointerdown", onClick)
        }
    }, [mounted])

    return (
        <div
            ref={containerRef}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                overflow: "hidden",
                background: "transparent",
                cursor: "pointer",
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />

            {/* Hover hint */}
            {showHint && isHovering && !hasClicked && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: hintColor,
                        fontSize: 16,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 500,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                        opacity: 0.9,
                        animation: "fadeIn 0.3s ease",
                    }}
                >
                    {hintText}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                    to { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
                }
            `}</style>
        </div>
    )
}

export default PixelBlast

addPropertyControls(PixelBlast, {
    variant: {
        type: ControlType.Enum,
        title: "Shape",
        options: ["square", "circle", "triangle", "diamond", "star", "cross"],
        optionTitles: [
            "Square",
            "Circle",
            "Triangle",
            "Diamond",
            "Star",
            "Cross",
        ],
        defaultValue: "circle",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#B19EEF",
    },
    pixelSize: {
        type: ControlType.Number,
        title: "Pixel Size",
        min: 2,
        max: 30,
        step: 1,
        defaultValue: 4,
    },
    pixelSizeJitter: {
        type: ControlType.Number,
        title: "Size Jitter",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.2,
    },
    rippleIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0.5,
        max: 3,
        step: 0.1,
        defaultValue: 1.5,
    },
    rippleSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.1,
        max: 1,
        step: 0.05,
        defaultValue: 0.4,
    },
    rippleThickness: {
        type: ControlType.Number,
        title: "Thickness",
        min: 0.05,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.15,
    },
    rippleDuration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.5,
        max: 5,
        step: 0.1,
        defaultValue: 2,
    },
    edgeFade: {
        type: ControlType.Number,
        title: "Edge Fade",
        min: 0,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.1,
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Show Hint",
        defaultValue: true,
    },
    hintText: {
        type: ControlType.String,
        title: "Hint Text",
        defaultValue: "Click to see the magic ✨",
        hidden: (p) => !p.showHint,
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint Color",
        defaultValue: "#ffffff",
        hidden: (p) => !p.showHint,
    },
})
;(PixelBlast as any).defaultProps = {
    width: 400,
    height: 300,
}

PixelBlast.displayName = "Pixel Blast"
