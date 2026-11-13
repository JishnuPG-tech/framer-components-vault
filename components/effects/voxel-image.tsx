import { useEffect, useRef, useState } from "react"
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
 * VoxelImage: turns any picture into real 3D blocks. Each block takes its
 * colour from the image and its height from the brightness. Blocks scatter
 * away from the cursor and fly together as the image enters the screen.
 * Transparent PNGs keep their shape, so logos and cut-outs work too.
 * Falls back to the plain image without WebGL, and holds still for visitors
 * who prefer reduced motion.
 *
 * @framerIntrinsicWidth 720
 * @framerIntrinsicHeight 540
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

type Props = {
    image?: { src?: string; alt?: string }
    imageUrl: string
    alt: string
    columns: number
    depth: number
    invert: boolean
    gap: number
    zoom: number
    radius: number
    force: number
    tilt: number
    reveal: "view" | "scroll" | "none"
    duration: number
    background: string
    style?: React.CSSProperties
}

const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec4 aCell;
layout(location=3) in vec3 aColor;
uniform mat4 uVP, uModel;
uniform vec2 uMouse;
uniform float uHover, uRadius, uForce, uCell, uGap, uProgress, uTime, uIdle, uSpread, uPlate;
out vec3 vNormal;
out vec3 vColor;
out vec3 vLocal;
mat3 spin(vec3 a, float r){
  float s=sin(r), c=cos(r), o=1.0-c;
  return mat3(o*a.x*a.x+c, o*a.x*a.y+a.z*s, o*a.z*a.x-a.y*s,
              o*a.x*a.y-a.z*s, o*a.y*a.y+c, o*a.y*a.z+a.x*s,
              o*a.z*a.x+a.y*s, o*a.y*a.z-a.x*s, o*a.z*a.z+c);
}
void main(){
  vec2 cell=aCell.xy;
  float h=aCell.z, seed=aCell.w;
  float t=clamp(uProgress*1.55-seed*0.55,0.0,1.0);
  float e=1.0-pow(1.0-t,3.0);
  if(uPlate>0.5){
    // A dim copy of the picture behind the blocks, so gaps never show a hairline of background.
    vNormal=mat3(uModel)*vec3(0.0,0.0,1.0);
    vColor=aColor*0.32;
    vLocal=vec3(0.0);
    gl_Position=uVP*uModel*vec4(cell+aPos.xy*uCell*1.02*e,aPos.z*uCell*0.02,1.0);
    return;
  }
  vec2 dv=cell-uMouse;
  float d=length(dv)/uRadius;
  float f=exp(-d*d*1.6)*uHover;
  float ripple=sin(d*5.0-uTime*3.0)*f*0.1;
  vec2 push=d>0.001?normalize(dv)*f*uCell*1.4*uForce:vec2(0.0);
  float lift=(f*0.3+ripple)*uForce;
  float idle=sin(uTime*0.8+seed*6.283)*0.01*uIdle;
  vec3 size=vec3(uCell*(1.0-uGap),uCell*(1.0-uGap),h);
  vec3 p=aPos*size;
  p.z+=h*0.5;
  vec3 axis=normalize(vec3(sin(seed*91.0),cos(seed*47.0),sin(seed*13.0)+0.2));
  mat3 r=spin(axis,(1.0-e)*3.14159);
  p=r*p*e;
  vec3 scatter=vec3(cos(seed*40.0),sin(seed*67.0),(seed-0.5)*1.4+0.6)*uSpread;
  vec3 world=vec3(cell+push,lift+idle)+p+scatter*(1.0-e)*(1.0-e);
  vNormal=mat3(uModel)*(r*aNormal);
  vColor=aColor;
  vLocal=aPos;
  gl_Position=uVP*uModel*vec4(world,1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vColor;
in vec3 vLocal;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  float diff=max(dot(n,normalize(vec3(-0.35,0.5,0.8))),0.0);
  vec3 c=vColor*(0.42+0.72*diff);
  vec3 a=abs(vLocal);
  vec2 face=a.z>a.x&&a.z>a.y?a.xy:(a.x>a.y?a.yz:a.xz);
  c*=1.0-smoothstep(0.42,0.5,max(face.x,face.y))*0.22;
  outColor=vec4(c,1.0);
}`

const CUBE = (() => {
    const faces: [number[], number[], number[]][] = [
        [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
        [[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
        [[1, 0, 0], [0, 0, -1], [0, 1, 0]],
        [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 0, 0], [0, 0, -1]],
        [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
    ]
    const out: number[] = []
    for (const [n, u, v] of faces) {
        const corner = (a: number, b: number) => [0, 1, 2].map((i) => n[i] * 0.5 + u[i] * a + v[i] * b)
        for (const [a, b] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) out.push(...corner(a, b), ...n)
    }
    return new Float32Array(out)
})()

const DEMO_FILL = "linear-gradient(180deg, #1B1440, #B23A62 50%, #FF8A3C 72%, #FFD27A)"

// Shown until an image is chosen, so the component looks right the moment it's dropped in.
function drawDemo(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, "#1B1440")
    sky.addColorStop(0.5, "#B23A62")
    sky.addColorStop(0.72, "#FF8A3C")
    sky.addColorStop(1, "#FFD27A")
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = "#FFF3C4"
    ctx.beginPath()
    ctx.arc(w * 0.62, h * 0.56, h * 0.17, 0, Math.PI * 2)
    ctx.fill()
    for (const [base, amp, col] of [[0.74, 0.1, "#3A1B4F"], [0.84, 0.08, "#1E1033"], [0.94, 0.05, "#0D0818"]] as [number, number, string][]) {
        ctx.fillStyle = col
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += w / 40) ctx.lineTo(x, h * (base - amp * Math.sin(x / w * 7 + base * 20) * Math.cos(x / w * 3)))
        ctx.lineTo(w, h)
        ctx.fill()
    }
}

function sample(source: HTMLImageElement | null, cols: number, rows: number, cover: { w: number; h: number }) {
    const c = document.createElement("canvas")
    c.width = cols
    c.height = rows
    const ctx = c.getContext("2d", { willReadFrequently: true })!
    ctx.imageSmoothingQuality = "high"
    if (source) {
        const s = Math.max(cols / source.naturalWidth, rows / source.naturalHeight)
        const dw = source.naturalWidth * s
        const dh = source.naturalHeight * s
        ctx.drawImage(source, (cols - dw) / 2, (rows - dh) / 2, dw, dh)
    } else {
        const art = document.createElement("canvas")
        art.width = Math.max(64, Math.round(cover.w))
        art.height = Math.max(64, Math.round(cover.h))
        drawDemo(art.getContext("2d")!, art.width, art.height)
        ctx.drawImage(art, 0, 0, cols, rows)
    }
    return ctx.getImageData(0, 0, cols, rows).data
}

function shader(gl: WebGL2RenderingContext, type: number, code: string) {
    const s = gl.createShader(type)!
    gl.shaderSource(s, code)
    gl.compileShader(s)
    return s
}

const perspective = (fov: number, aspect: number, near: number, far: number) => {
    const f = 1 / Math.tan(fov / 2)
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0]
}
const model = (rx: number, ry: number, s: number, z: number) => {
    const [cx, sx, cy, sy] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry)]
    return [cy * s, sx * sy * s, -cx * sy * s, 0, 0, cx * s, sx * s, 0, sy * s, -sx * cy * s, cx * cy * s, 0, 0, 0, z, 1]
}

export default function VoxelImage(props: Props) {
    const p = { ...VoxelImage.defaultProps, ...props } as Props
    const { columns, depth, invert, gap, zoom, radius, force, tilt, reveal, duration, background } = p
    const src = p.image?.src || p.imageUrl
    const alt = p.image?.alt || p.alt
    const box = useRef<HTMLDivElement>(null)
    const ref = useRef<HTMLCanvasElement>(null)
    const [failed, setFailed] = useState(false)
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    useEffect(() => {
        setFailed(false)
        const canvas = ref.current
        const host = box.current
        if (!canvas || !host) return
        const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: isCanvas })
        if (!gl) {
            setFailed(true)
            return
        }
        const onLost = () => setFailed(true)
        canvas.addEventListener("webglcontextlost", onLost)

        const prog = gl.createProgram()!
        gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            setFailed(true)
            return
        }
        gl.useProgram(prog)
        const u = (n: string) => gl.getUniformLocation(prog, n)
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
        gl.bufferData(gl.ARRAY_BUFFER, CUBE, gl.STATIC_DRAW)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0)
        gl.enableVertexAttribArray(1)
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12)
        const inst = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, inst)
        gl.enableVertexAttribArray(2)
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 28, 0)
        gl.vertexAttribDivisor(2, 1)
        gl.enableVertexAttribArray(3)
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 28, 16)
        gl.vertexAttribDivisor(3, 1)
        gl.enable(gl.DEPTH_TEST)
        gl.enable(gl.CULL_FACE)
        gl.clearColor(0, 0, 0, 0)

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        const still = isCanvas || reduce
        const fov = 0.5
        const dist = 0.5 / Math.tan(fov / 2)
        let picture: HTMLImageElement | null = null
        let count = 0
        let aspect = 1
        let cell = 0.02

        const build = () => {
            const w = host.clientWidth
            const h = host.clientHeight
            if (!w || !h) return false
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            gl.viewport(0, 0, canvas.width, canvas.height)
            aspect = w / h
            const cols = Math.min(Math.round(columns), Math.max(12, Math.round(w / 8))) // keep blocks chunky on small screens
            const rows = Math.max(1, Math.round(cols / aspect))
            cell = aspect / cols
            let data: Uint8ClampedArray
            try {
                data = sample(picture, cols, rows, { w, h })
            } catch {
                setFailed(true) // the image host refused cross-origin reads
                return false
            }
            const out = new Float32Array(cols * rows * 7)
            let n = 0
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = (y * cols + x) * 4
                    if (data[i + 3] < 24) continue
                    const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255]
                    const lum = 0.3 * r + 0.59 * g + 0.11 * b
                    out[n++] = (x + 0.5) * cell - aspect / 2
                    out[n++] = 0.5 - (y + 0.5) / rows
                    out[n++] = Math.max(cell * 0.3, (invert ? 1 - lum : lum) * depth * 0.4)
                    out[n++] = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
                    out[n++] = r
                    out[n++] = g
                    out[n++] = b
                }
            }
            count = n / 7
            gl.bindBuffer(gl.ARRAY_BUFFER, inst)
            gl.bufferData(gl.ARRAY_BUFFER, out.subarray(0, n), gl.STATIC_DRAW)
            gl.uniformMatrix4fv(u("uVP"), false, new Float32Array(mul(perspective(fov, aspect, 0.05, 20), [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -dist, 1])))
            gl.uniform1f(u("uCell"), cell)
            gl.uniform1f(u("uGap"), gap)
            gl.uniform1f(u("uRadius"), radius * Math.max(aspect, 1))
            gl.uniform1f(u("uForce"), force)
            gl.uniform1f(u("uSpread"), 0.9)
            return true
        }

        const mouse = { x: 0, y: 0, tx: 0, ty: 0, hover: 0, on: 0 }
        let progress = still || reveal === "none" ? 1 : 0
        let shown = false
        let started = 0
        let visible = false
        let raf = 0
        const t0 = performance.now()

        const frame = (now: number) => {
            raf = 0
            const time = (now - t0) / 1000
            mouse.x += (mouse.tx - mouse.x) * 0.14
            mouse.y += (mouse.ty - mouse.y) * 0.14
            mouse.hover += (mouse.on - mouse.hover) * 0.1
            if (!still && reveal === "view" && shown) {
                started = started || now
                progress = Math.min(1, (now - started) / (duration * 1000))
            }
            if (!still && reveal === "scroll") {
                const r = host.getBoundingClientRect()
                const vh = window.innerHeight
                progress = Math.min(1, Math.max(0, (vh - r.top) / (r.height * 0.75 + vh * 0.25)))
            }
            const nx = (mouse.x / (aspect / 2)) * mouse.hover
            const ny = (mouse.y / 0.5) * mouse.hover
            const deg = (tilt * Math.PI) / 180
            gl.uniformMatrix4fv(u("uModel"), false, new Float32Array(model(-ny * deg, nx * deg, zoom, -depth * 0.28)))
            gl.uniform2f(u("uMouse"), mouse.x, mouse.y)
            gl.uniform1f(u("uHover"), mouse.hover)
            gl.uniform1f(u("uProgress"), progress)
            gl.uniform1f(u("uTime"), time)
            gl.uniform1f(u("uIdle"), still ? 0 : 1)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
            gl.uniform1f(u("uPlate"), 1)
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, count)
            gl.uniform1f(u("uPlate"), 0)
            gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, count)
            if (!still && visible) raf = requestAnimationFrame(frame)
        }
        const kick = () => {
            if (!raf) raf = requestAnimationFrame(frame)
        }

        const move = (e: PointerEvent) => {
            const r = host.getBoundingClientRect()
            mouse.tx = (((e.clientX - r.left) / r.width - 0.5) * aspect) / zoom
            mouse.ty = (0.5 - (e.clientY - r.top) / r.height) / zoom
            mouse.on = 1
        }
        const leave = () => {
            mouse.on = 0
        }
        const up = (e: PointerEvent) => {
            if (e.pointerType === "touch") leave()
        }
        if (!still) {
            host.addEventListener("pointermove", move)
            host.addEventListener("pointerdown", move)
            host.addEventListener("pointerleave", leave)
            host.addEventListener("pointerup", up)
        }

        const io = new IntersectionObserver(
            ([e]) => {
                visible = e.isIntersecting
                if (e.intersectionRatio >= 0.2) shown = true
                if (visible) kick()
            },
            { threshold: [0, 0.2] }
        )
        const ro = new ResizeObserver(() => {
            if (build()) kick()
        })
        let alive = true
        const start = () => {
            if (!alive) return
            ro.observe(host)
            io.observe(host)
            if (build()) kick()
        }
        if (src) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                picture = img
                start()
            }
            img.onerror = () => setFailed(true)
            img.src = src
        } else start()

        return () => {
            alive = false
            cancelAnimationFrame(raf)
            io.disconnect()
            ro.disconnect()
            canvas.removeEventListener("webglcontextlost", onLost)
            host.removeEventListener("pointermove", move)
            host.removeEventListener("pointerdown", move)
            host.removeEventListener("pointerleave", leave)
            host.removeEventListener("pointerup", up)
        }
    }, [src, columns, depth, invert, gap, zoom, radius, force, tilt, reveal, duration, isCanvas])

    return (
        <div ref={box} style={{ ...p.style, position: "relative", width: "100%", height: "100%", overflow: "hidden", background: failed && !src ? DEMO_FILL : background, touchAction: "pan-y" }}>
            {src && <img src={src} alt={alt} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: failed ? 1 : 0 }} />}
            {!failed && <canvas ref={ref} aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />}
        </div>
    )
}

const mul = (a: number[], b: number[]) => {
    const out = new Array(16).fill(0)
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]
    return out
}

VoxelImage.defaultProps = {
    imageUrl: "",
    alt: "",
    columns: 56,
    depth: 0.6,
    invert: false,
    gap: 0.06,
    zoom: 0.96,
    radius: 0.2,
    force: 1,
    tilt: 12,
    reveal: "view",
    duration: 1.6,
    background: "rgba(0, 0, 0, 0)",
}

addPropertyControls(VoxelImage, {
    image: { type: ControlType.ResponsiveImage, title: "Image" },
    imageUrl: { type: ControlType.String, title: "Image URL", description: "Used when Image is empty. The host must allow cross-origin reads." },
    alt: { type: ControlType.String, title: "Alt Text" },
    columns: { type: ControlType.Number, title: "Blocks Across", min: 12, max: 120, step: 1, description: "Blocks never go below 8px, so small screens use fewer." },
    depth: { type: ControlType.Number, title: "Depth", min: 0, max: 2, step: 0.05 },
    invert: { type: ControlType.Boolean, title: "Dark Is Tall" },
    gap: { type: ControlType.Number, title: "Gap", min: 0, max: 0.5, step: 0.01 },
    zoom: { type: ControlType.Number, title: "Zoom", min: 0.4, max: 1.4, step: 0.01 },
    radius: { type: ControlType.Number, title: "Cursor Size", min: 0.05, max: 0.6, step: 0.01 },
    force: { type: ControlType.Number, title: "Cursor Force", min: 0, max: 3, step: 0.05 },
    tilt: { type: ControlType.Number, title: "Tilt", min: 0, max: 40, step: 1, unit: "°" },
    reveal: {
        type: ControlType.Enum,
        title: "Reveal",
        options: ["view", "scroll", "none"],
        optionTitles: ["On View", "On Scroll", "None"],
        displaySegmentedControl: true,
    },
    duration: { type: ControlType.Number, title: "Reveal Time", min: 0.3, max: 4, step: 0.1, unit: "s", hidden: (p) => p.reveal !== "view" },
    background: { type: ControlType.Color, title: "Background" },
})
