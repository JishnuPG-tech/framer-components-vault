import * as React from "react"
// Internal module path: LiquidMetalButton.tsx
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


type Mode = "ambient" | "hover" | "off"
type HoverTone = "auto" | "light" | "dark"
interface LiquidMetalButtonPlusProps {
    label?: string
    link?: string
    newTab?: boolean
    theme?: "frost" | "obsidian" | "pearl" | "custom"
    fill?: string
    textColor?: string
    font?: React.CSSProperties
    radius?: string
    padding?: string
    gap?: number
    shadow?: string
    trailing?: "arrow" | "chevron" | "none"
    icon?: {
        glyph?: string
        size?: number
        glyphSize?: number
        color?: string
        fill?: string
        position?: "left" | "right"
        image?: { src: string; srcSet?: string; alt?: string }
    }
    iconStyle?: {
        finish?: "original" | "chrome" | "prism" | "custom"
        animated?: boolean
        angle?: number
        highlight?: string
        shade?: string
        accent?: string
    }
    edge?: {
        enabled?: boolean
        width?: number
        intensity?: number
        speed?: number
        prism?: number
        flow?: number
    }
    metal?: {
        thickness?: number
        flow?: number
        dispersion?: number
        glow?: number
        warmth?: number
    }
    glass?: { blur?: number; edge?: number }
    hoverStyle?: { tone?: HoverTone; intensity?: number }
    motion?: {
        mode?: Mode
        speed?: number
        attraction?: number
        response?: number
        release?: boolean
    }
    accessibilityLabel?: string
    disabled?: boolean
    onTap?: () => void
    style?: React.CSSProperties
}

const CREDIT =
    "Built by Matthias Ölschlegel 💪\n[Explore more components](https://dub.sh/dsw13)"
const ICON = {
    glyph: "sparkle",
    size: 62,
    glyphSize: 25,
    color: "#F8FAFC",
    fill: "#353B43",
    position: "left" as const,
}
const METAL = {
    thickness: 5.2,
    flow: 0.65,
    dispersion: 0.65,
    glow: 0.5,
    warmth: 0,
}
const MOTION = {
    mode: "ambient" as Mode,
    speed: 0.8,
    attraction: 0.7,
    response: 0.65,
    release: true,
}
const HOVER = { tone: "auto" as HoverTone, intensity: 0.72 }
const GLASS = { blur: 18, edge: 0.7 }
const EDGE = {
    enabled: true,
    width: 3.2,
    intensity: 1,
    speed: 1,
    prism: 0.8,
    flow: 0.75,
}
const ICON_STYLE = {
    finish: "chrome" as const,
    animated: true,
    angle: 135,
    highlight: "#FFFFFF",
    shade: "#64748C",
    accent: "#ABCFFF",
}
const FONT: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    fontSize: 19,
    fontWeight: 500,
    lineHeight: "1.2em",
    letterSpacing: "-.025em",
}
const VERTEX = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`

// Original analytic liquid torus: curved normals, moving studio reflections,
// localized surface tension and one travelling release wave. No textures/raymarch.
const FRAGMENT = `
precision highp float;
varying vec2 uv;
uniform float time, pixels, tube, flow, dispersion, glow, warmth, hover, hoverTone, hoverIntensity, press, response, release;
uniform vec2 pointer;
const float PI=3.14159265;
float pool(float a,float b,float sharp){return exp((cos(a-b)-1.)*sharp);}
float studio(vec3 r,float a,float q,float shift){
    float f=sin(a*2.-time*.53)+.28*sin(3.*a+time*.31)+q*.52+r.z*.12+shift;
    float main=smoothstep(-.5,-.28,f)-smoothstep(.37,.57,f);
    float strip=smoothstep(.84,.95,f);
    float curve=.5+.5*r.z;
    return .12+.75*main+.65*strip+.12*curve;
}
void main(){
    vec2 p=(vec2(uv.x,1.-uv.y)*2.-1.)*1.2;
    float r=max(length(p),.0001);
    float a=atan(p.y,p.x);
    float phase=time*.65;
    float aim=atan(pointer.y+.0001,pointer.x+.0001);
    float attraction=pool(a,aim,2.8)*hover;
    float wave=sin(3.*a-release*11.)*sin(PI*release)*exp(-release*2.7);
    float rip=flow*(.010*sin(3.*a-phase*1.3)+.006*sin(5.*a+phase*.8));
    float radius=.81+rip+attraction*.018*response-press*.012*response+wave*.035*response;
    float width=tube*(1.+flow*.16*sin(2.*a-phase)+attraction*.19*response+press*.24*response);
    float q=(r-radius)/max(width,.018);
    float aa=2.64/max(pixels,1.);
    float coverage=1.-smoothstep(width-aa,width+aa,abs(r-radius));
    float z=sqrt(max(.0001,1.-clamp(q*q,0.,1.)));
    vec2 tangent=vec2(-p.y,p.x)/r;
    vec3 normal=normalize(vec3(p/r*clamp(q,-1.,1.)+tangent*(.10*flow*sin(3.*a-phase)+wave*.35),z));
    vec3 reflected=reflect(vec3(0.,0.,-1.),normal);
    float shift=dispersion*(.08+.13*pool(a,phase+.7,2.));
    vec3 chrome=vec3(studio(reflected,a,q,shift),studio(reflected,a,q,0.),studio(reflected,a,q,-shift));
    float hot=pool(a,phase-1.9,12.)+pool(a,-phase*.71+1.2,20.)*.7;
    chrome+=vec3(.75,.87,1.)*hot*pow(z,2.)*.72;
    float hoverCore=attraction*pow(z,4.)*hoverIntensity;
    vec3 hoverTarget=mix(vec3(.08,.12,.19),vec3(1.),step(0.,hoverTone));
    chrome=mix(chrome,hoverTarget,hoverCore*mix(.50,.46,step(0.,hoverTone)));
    chrome*=mix(vec3(1.),vec3(1.14,.96,.72),max(0.,warmth));
    chrome*=mix(vec3(1.),vec3(.78,.93,1.13),max(0.,-warmth));
    chrome=mix(chrome,vec3(.94,.98,1.),pow(abs(clamp(q,-1.,1.)),14.)*.38);
    float halo=exp(-pow((r-radius)/(width*2.8),2.))*hot*glow*.21*(1.-smoothstep(1.08,1.2,r));
    vec3 haloColor=mix(vec3(.65,.79,1.),vec3(1.,.88,.65),.5+.5*sin(a+phase));
    float alpha=coverage+(1.-coverage)*halo;
    vec3 col=clamp(chrome,0.,1.)*coverage+haloColor*(1.-coverage)*halo;
    gl_FragColor=vec4(col,alpha);
}`

const CSS = `
.mo-orbit{appearance:none;-webkit-appearance:none;text-decoration:none;isolation:isolate;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.mo-orbit *{box-sizing:border-box}
.mo-orbit[data-renderer=webgl] .orb-fallback{visibility:hidden}
.mo-orbit:focus-visible{outline:2px solid #749EE8;outline-offset:5px}
.mo-orbit .orb-face{isolation:isolate;transform:translateY(0);transition:transform 180ms cubic-bezier(.2,.8,.2,1),filter 180ms ease}
.mo-orbit[data-pressed=true] .orb-face{transform:translateY(1px) scale(.988)}
.mo-orbit .orb-medallion{transform:scale(1);transition:transform 160ms cubic-bezier(.2,.8,.2,1)}
.mo-orbit[data-pressed=true] .orb-medallion{transform:scale(.975)}
.mo-orbit .orb-tail{transition:opacity 220ms ease;opacity:.7}
.mo-orbit[data-active=true] .orb-tail{opacity:1}
.mo-orbit .orb-wake{opacity:0;transition:opacity 260ms ease;background:radial-gradient(ellipse 42% 120% at var(--orb-wake-x,50%) var(--orb-wake-y,50%),var(--orb-hover-core,rgba(240,249,255,.28)),var(--orb-hover-mid,rgba(167,203,255,.09)) 42%,transparent 76%);box-shadow:inset 0 0 16px var(--orb-hover-shadow,rgba(216,233,255,.09))}
.mo-orbit[data-active=true] .orb-wake{opacity:var(--orb-hover-intensity,.72)}
.mo-orbit[data-static=true] .orb-wake,.mo-orbit[data-reduced=true] .orb-wake,.mo-orbit[data-disabled=true] .orb-wake,.mo-orbit[data-playback=off] .orb-wake{opacity:0!important;transition:none!important}
.mo-orbit[data-disabled=true]{opacity:.45;cursor:not-allowed!important}
.mo-orbit .orb-edge{padding:var(--orb-edge-top,var(--orb-edge-width,3.2px)) var(--orb-edge-right,var(--orb-edge-width,3.2px)) var(--orb-edge-bottom,var(--orb-edge-width,3.2px)) var(--orb-edge-left,var(--orb-edge-width,3.2px));background:radial-gradient(ellipse at var(--orb-light-x,24%) var(--orb-light-y,14%),rgba(255,255,255,.86),transparent 38%),conic-gradient(from var(--orb-phase,-55deg) at var(--orb-pool-x,48%) var(--orb-pool-y,52%),#8995a6 0deg,#e6f0ff 21deg,#101621 42deg,#445268 56deg,#fff 68deg,#fff 80deg,var(--orb-edge-cool,#80b8ff) 88deg,#181e2b 99deg,#cbd7e8 137deg,#69788e 163deg,#0a111b 183deg,#eff8ff 210deg,#fff 224deg,var(--orb-edge-warm,#f4b777) 232deg,#283a54 242deg,#a6b6cc 275deg,#e9f3ff 300deg,#192434 327deg,#8995a6 360deg);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude}
.mo-orbit .orb-hover-edge{padding:var(--orb-edge-top,var(--orb-edge-width,3.2px)) var(--orb-edge-right,var(--orb-edge-width,3.2px)) var(--orb-edge-bottom,var(--orb-edge-width,3.2px)) var(--orb-edge-left,var(--orb-edge-width,3.2px));background:radial-gradient(ellipse 64% 170% at var(--orb-wake-x,50%) var(--orb-wake-y,50%),var(--orb-hover-edge,rgba(255,255,255,.96)),transparent 56%);-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask-composite:exclude;opacity:0;transition:opacity 220ms ease}
.mo-orbit[data-active=true] .orb-hover-edge{opacity:var(--orb-hover-intensity,.72)}
.mo-orbit[data-static=true] .orb-hover-edge,.mo-orbit[data-reduced=true] .orb-hover-edge,.mo-orbit[data-disabled=true] .orb-hover-edge,.mo-orbit[data-playback=off] .orb-hover-edge{opacity:0!important;transition:none!important}
.mo-orbit .orb-edge-glow{filter:blur(3.5px);opacity:calc(var(--orb-edge-intensity,1)*.4)}
.mo-orbit .orb-edge-ridge{padding:clamp(.45px,calc(var(--orb-edge-width,3.2px)*.25),1px);background:conic-gradient(from var(--orb-counter,75deg),#fff 0deg,#d6e3f5 24deg,#0c1524 70deg,#fff 112deg,var(--orb-edge-cool,#80b8ff) 131deg,#112034 166deg,#fff 205deg,#fff 239deg,var(--orb-edge-warm,#f4b777) 252deg,#131c2d 284deg,#bacadd 334deg,#fff 360deg);opacity:var(--orb-edge-intensity,1)}
.mo-orbit .orb-icon-paint{background-position:var(--orb-icon-shift-x,50%) var(--orb-icon-shift-y,50%);background-size:220% 220%;mask-mode:alpha;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-position:center;mask-position:center}
.mo-orbit[data-static=true] .orb-face,.mo-orbit[data-static=true] .orb-medallion,.mo-orbit[data-static=true] .orb-tail{transition:none}
.mo-orbit[data-reduced=true] .orb-face,.mo-orbit[data-reduced=true] .orb-medallion,.mo-orbit[data-reduced=true] .orb-tail{transform:none!important;transition:none!important}
@media(prefers-reduced-motion:reduce){.mo-orbit .orb-face,.mo-orbit .orb-medallion,.mo-orbit .orb-tail{transform:none!important;transition:none!important}}
@media(prefers-reduced-motion:reduce){.mo-orbit .orb-wake,.mo-orbit .orb-hover-edge{opacity:0!important;transition:none!important}}
@media(forced-colors:active){.mo-orbit .orb-decoration{display:none!important}.mo-orbit .orb-face{background:ButtonFace!important;color:ButtonText!important;border:1px solid ButtonText!important;box-shadow:none!important}.mo-orbit .orb-disc{background:ButtonFace!important;border:1px solid ButtonText!important}.mo-orbit .orb-glyph{color:ButtonText!important;filter:none!important}}
@media(forced-colors:active){.mo-orbit .orb-icon-paint{background:ButtonText!important}.mo-orbit .orb-glyph svg{stroke:ButtonText!important}.mo-orbit .orb-glyph svg [fill]:not([fill=none]){fill:ButtonText!important}}
`

function Glyph({
    name,
    size,
    paint,
}: {
    name: string
    size: number
    paint?: string
}) {
    const paths: Record<string, React.ReactNode> = {
        sparkle: (
            <path
                d="M12 1.8C14.2 8.7 15.3 9.8 22.2 12 15.3 14.2 14.2 15.3 12 22.2 9.8 15.3 8.7 14.2 1.8 12 8.7 9.8 9.8 8.7 12 1.8Z"
                fill={paint || "currentColor"}
                stroke="none"
            />
        ),
        home: (
            <path
                d="m2.5 10 9.5-8 9.5 8v2h-3v9H14v-6h-4v6H5.5v-9h-3Z"
                fill={paint || "currentColor"}
                stroke="none"
            />
        ),
        arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
        "arrow-up-right": <path d="M6 18 18 6M6 6h12v12" />,
        plus: <path d="M12 4v16M4 12h16" />,
        play: (
            <path
                d="m8 5 11 7-11 7Z"
                fill={paint || "currentColor"}
                stroke="none"
            />
        ),
        search: (
            <>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
            </>
        ),
        chevron: <path d="m6 9 6 6 6-6" />,
    }
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={paint || "currentColor"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ display: "block" }}
        >
            {paths[name] || paths.sparkle}
        </svg>
    )
}

/**
 * Liquid Metal Button+ — fluid chrome surrounding a quiet icon, by Matthias Ölschlegel.
 * @framerDisableUnlink
 * @framerIntrinsicWidth 224
 * @framerIntrinsicHeight 80
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function LiquidMetalButtonPlus(
    props: LiquidMetalButtonPlusProps
) {
    const {
        label = "Make it flow",
        link = "",
        newTab = false,
        theme = "frost",
        fill = "rgba(218,229,238,0.18)",
        textColor,
        font,
        radius = "100px",
        padding = "8px 22px 8px 8px",
        gap = 13,
        trailing = "none",
        shadow = "0px 12px 24px -12px rgba(0,0,0,0.45)",
        disabled = false,
        accessibilityLabel = "",
        onTap,
        style,
    } = props
    const icon = { ...ICON, ...props.icon }
    const metal = { ...METAL, ...props.metal }
    const hoverStyle = { ...HOVER, ...props.hoverStyle }
    const motion = { ...MOTION, ...props.motion }
    const glass = { ...GLASS, ...props.glass }
    const edge = { ...EDGE, ...props.edge }
    const iconStyle = { ...ICON_STYLE, ...props.iconStyle }
    const gradientId = `orbit-icon-${React.useId().replace(/:/g, "")}`
    const gradientRef = React.useRef<SVGLinearGradientElement>(null)
    const [maskReady, setMaskReady] = React.useState("")
    const rootRef = React.useRef<HTMLButtonElement & HTMLAnchorElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const engineRef = React.useRef<{ wake: () => void } | null>(null)
    const input = React.useRef({
        x: -0.5,
        y: -0.5,
        sx: 0.5,
        sy: 0.5,
        hovering: false,
        focused: false,
        pressed: false,
        release: 1,
    })
    const phaseRef = React.useRef(1.4)
    const isStatic = useIsStaticRenderer()
    const [reduced, setReduced] = React.useState(false)
    const [version, setVersion] = React.useState(0)
    const light = theme === "pearl"
    const resolvedHoverTone =
        hoverStyle.tone === "auto"
            ? light
                ? "dark"
                : "light"
            : hoverStyle.tone
    const hoverIsDark = resolvedHoverTone === "dark"
    const fg = textColor || (light ? "#262C34" : "#F6F8FC")
    const surface =
        theme === "custom"
            ? fill
            : light
              ? "rgba(246,249,252,.92)"
              : theme === "obsidian"
                ? "rgba(21,24,30,.91)"
                : "rgba(148,165,182,.20)"
    const locked = disabled || isStatic
    const painted = iconStyle.finish !== "original"
    const highlight =
        iconStyle.finish === "custom" ? iconStyle.highlight : "#FFFFFF"
    const shade =
        iconStyle.finish === "custom"
            ? iconStyle.shade
            : iconStyle.finish === "prism"
              ? "#668DC2"
              : "#7A879B"
    const accent =
        iconStyle.finish === "custom"
            ? iconStyle.accent
            : iconStyle.finish === "prism"
              ? "#EEB596"
              : "#D7E4F5"
    const iconGradient = `linear-gradient(${iconStyle.angle}deg,${highlight} 8%,${shade} 31%,${accent} 43%,${highlight} 52%,${highlight} 59%,${shade} 78%,${highlight} 96%)`
    const imageSrc = icon.glyph === "image" ? icon.image?.src || "" : ""

    // Anonymous loading validates that this asset may be used as a CSS mask.
    // Until loaded (or on CORS failure), preserve the original visible image.
    React.useEffect(() => {
        setMaskReady("")
        if (!imageSrc || !painted || typeof window === "undefined") return
        if (
            !(
                window.CSS?.supports(
                    "mask-image",
                    "linear-gradient(white,white)"
                ) ||
                window.CSS?.supports(
                    "-webkit-mask-image",
                    "linear-gradient(white,white)"
                )
            )
        )
            return
        let cancelled = false
        const probe = new Image()
        probe.crossOrigin = "anonymous"
        probe.onload = () => {
            if (!cancelled) setMaskReady(imageSrc)
        }
        probe.src = imageSrc
        return () => {
            cancelled = true
            probe.onload = null
        }
    }, [imageSrc, painted])

    React.useEffect(() => {
        if (typeof window === "undefined") return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    React.useEffect(() => {
        if (!locked) return
        input.current = {
            x: -0.5,
            y: -0.5,
            sx: 0.5,
            sy: 0.5,
            hovering: false,
            focused: false,
            pressed: false,
            release: 1,
        }
        rootRef.current?.setAttribute("data-active", "false")
        rootRef.current?.setAttribute("data-pressed", "false")
    }, [locked])

    React.useEffect(() => {
        const canvas = canvasRef.current,
            root = rootRef.current
        if (!canvas || !root || typeof window === "undefined") return
        canvas.style.opacity = "0"
        let gl: WebGLRenderingContext | null = null
        try {
            gl = canvas.getContext("webgl", {
                alpha: true,
                premultipliedAlpha: true,
                antialias: false,
                depth: false,
                stencil: false,
                powerPreference: "low-power",
            })
        } catch {
            return
        }
        if (!gl) return // Rich static CSS fallback; semantics and link never depend on WebGL.
        const ctx = gl
        const compile = (type: number, source: string) => {
            const shader = ctx.createShader(type)
            if (!shader) return null
            ctx.shaderSource(shader, source)
            ctx.compileShader(shader)
            if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
                console.warn(
                    "Liquid Metal Button+ shader:",
                    ctx.getShaderInfoLog(shader)
                )
                ctx.deleteShader(shader)
                return null
            }
            return shader
        }
        const v = compile(ctx.VERTEX_SHADER, VERTEX),
            f = compile(ctx.FRAGMENT_SHADER, FRAGMENT)
        if (!v || !f) {
            if (v) ctx.deleteShader(v)
            if (f) ctx.deleteShader(f)
            return
        }
        const program = ctx.createProgram(),
            buffer = ctx.createBuffer()
        if (!program || !buffer) {
            ctx.deleteShader(v)
            ctx.deleteShader(f)
            if (program) ctx.deleteProgram(program)
            if (buffer) ctx.deleteBuffer(buffer)
            return
        }
        ctx.attachShader(program, v)
        ctx.attachShader(program, f)
        ctx.linkProgram(program)
        const cleanupGPU = () => {
            ctx.deleteShader(v)
            ctx.deleteShader(f)
            ctx.deleteBuffer(buffer)
            ctx.deleteProgram(program)
        }
        if (!ctx.getProgramParameter(program, ctx.LINK_STATUS)) {
            console.warn(
                "Liquid Metal Button+ renderer:",
                ctx.getProgramInfoLog(program)
            )
            cleanupGPU()
            return
        }
        ctx.useProgram(program)
        ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer)
        ctx.bufferData(
            ctx.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            ctx.STATIC_DRAW
        )
        const position = ctx.getAttribLocation(program, "position")
        ctx.enableVertexAttribArray(position)
        ctx.vertexAttribPointer(position, 2, ctx.FLOAT, false, 0, 0)
        const uniforms: Record<string, WebGLUniformLocation | null> = {}
        ;[
            "time",
            "pixels",
            "tube",
            "flow",
            "dispersion",
            "glow",
            "warmth",
            "hover",
            "hoverTone",
            "hoverIntensity",
            "press",
            "response",
            "release",
            "pointer",
        ].forEach((n) => {
            uniforms[n] = ctx.getUniformLocation(program, n)
        })
        const scalar = (name: string, value: number) =>
            ctx.uniform1f(uniforms[name], value)
        scalar(
            "tube",
            Math.min(0.16, Math.max(0.022, metal.thickness / icon.size))
        )
        scalar("flow", metal.flow)
        scalar("dispersion", metal.dispersion)
        scalar("glow", metal.glow)
        scalar("warmth", metal.warmth)
        scalar("response", motion.response)
        scalar("hoverTone", hoverIsDark ? -1 : 1)
        scalar("hoverIntensity", hoverStyle.intensity)
        let frame = 0,
            last = 0,
            visible = true,
            stopped = false,
            lost = false,
            hover = 0,
            press = 0,
            x = -0.5,
            y = -0.5,
            sx = 0.5,
            sy = 0.5
        const animate = !locked && !reduced && motion.mode !== "off"
        const draw = () => {
            if (stopped || lost) return
            ctx.viewport(0, 0, canvas.width, canvas.height)
            scalar("pixels", canvas.width)
            scalar("time", phaseRef.current)
            scalar("hover", hover * motion.attraction)
            scalar("press", press)
            scalar("release", animate ? input.current.release : 1)
            ctx.uniform2f(uniforms.pointer, x, y)
            ctx.drawArrays(ctx.TRIANGLES, 0, 6)
            canvas.style.opacity = "1"
            root.setAttribute("data-renderer", "webgl")
            const edgePhase = phaseRef.current * edge.speed
            root.style.setProperty("--orb-phase", `${edgePhase * 46 - 85}deg`)
            root.style.setProperty(
                "--orb-counter",
                `${-edgePhase * 31 + 75}deg`
            )
            // The reflection field and inner contour drift independently, so
            // the edge reads as flowing metal instead of one rotating stripe.
            root.style.setProperty(
                "--orb-pool-x",
                `${50 + Math.sin(edgePhase * 0.73) * 16 * edge.flow}%`
            )
            root.style.setProperty(
                "--orb-pool-y",
                `${50 + Math.cos(edgePhase * 0.57) * 22 * edge.flow}%`
            )
            const pull = hover * motion.attraction * hoverStyle.intensity
            const lightX = 50 + Math.cos(edgePhase * 0.91) * 48,
                lightY = 50 + Math.sin(edgePhase * 0.91) * 48
            root.style.setProperty(
                "--orb-light-x",
                `${lightX + (sx * 100 - lightX) * pull}%`
            )
            root.style.setProperty(
                "--orb-light-y",
                `${lightY + (sy * 100 - lightY) * pull}%`
            )
            root.style.setProperty("--orb-wake-x", `${sx * 100}%`)
            root.style.setProperty("--orb-wake-y", `${sy * 100}%`)
            ;["top", "right", "bottom", "left"].forEach((side, index) => {
                const pooling =
                    1 +
                    Math.sin(edgePhase * 1.13 + index * Math.PI * 0.5) *
                        0.28 *
                        edge.flow
                root.style.setProperty(
                    `--orb-edge-${side}`,
                    `${edge.width * pooling}px`
                )
            })
            const shift = iconStyle.animated
                ? Math.sin(phaseRef.current * 0.8) * 35
                : 0
            const angle = (iconStyle.angle * Math.PI) / 180
            root.style.setProperty(
                "--orb-icon-shift-x",
                `${50 + shift * Math.sin(angle)}%`
            )
            root.style.setProperty(
                "--orb-icon-shift-y",
                `${50 - shift * Math.cos(angle)}%`
            )
            gradientRef.current?.setAttribute(
                "gradientTransform",
                `rotate(${iconStyle.angle - 90 + shift * 0.45} .5 .5)`
            )
        }
        const tick = (now: number) => {
            frame = 0
            if (stopped || lost || !visible || document.hidden || !animate) {
                last = 0
                return
            }
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
            last = now
            const i = input.current,
                active = i.hovering || i.focused
            const k = 1 - Math.exp(-dt * 10)
            hover += ((active ? 1 : 0) - hover) * k
            press += ((i.pressed ? 1 : 0) - press) * (1 - Math.exp(-dt * 18))
            x += (i.x - x) * k
            y += (i.y - y) * k
            sx += (i.sx - sx) * k
            sy += (i.sy - sy) * k
            i.release = Math.min(1, i.release + dt * 1.35)
            if (motion.mode === "ambient" || active)
                phaseRef.current += dt * motion.speed
            draw()
            if (
                motion.mode === "ambient" ||
                active ||
                i.pressed ||
                i.release < 1 ||
                hover > 0.002 ||
                press > 0.002
            )
                frame = requestAnimationFrame(tick)
            else last = 0
        }
        const wake = () => {
            if (
                !frame &&
                animate &&
                visible &&
                !document.hidden &&
                !lost &&
                !stopped
            )
                frame = requestAnimationFrame(tick)
        }
        engineRef.current = { wake }
        const resize = () => {
            const box = canvas.getBoundingClientRect(),
                dpr = Math.min(window.devicePixelRatio || 1, 2)
            canvas.width = Math.max(
                1,
                Math.min(512, Math.round(box.width * dpr))
            )
            canvas.height = canvas.width
            draw()
            wake()
        }
        const onVisibility = () => {
            if (document.hidden) {
                cancelAnimationFrame(frame)
                frame = 0
                last = 0
            } else wake()
        }
        const onLost = (e: Event) => {
            e.preventDefault()
            lost = true
            canvas.style.opacity = "0"
            root.setAttribute("data-renderer", "fallback")
            cancelAnimationFrame(frame)
            frame = 0
        }
        const onRestore = () => setVersion((n) => n + 1)
        const ro = new ResizeObserver(resize)
        const io = new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? false
            if (visible) wake()
            else {
                cancelAnimationFrame(frame)
                frame = 0
                last = 0
            }
        })
        ro.observe(canvas)
        io.observe(root)
        document.addEventListener("visibilitychange", onVisibility)
        canvas.addEventListener("webglcontextlost", onLost)
        canvas.addEventListener("webglcontextrestored", onRestore)
        resize()
        return () => {
            stopped = true
            cancelAnimationFrame(frame)
            engineRef.current = null
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)
            canvas.removeEventListener("webglcontextlost", onLost)
            canvas.removeEventListener("webglcontextrestored", onRestore)
            root.setAttribute("data-renderer", "fallback")
            cleanupGPU()
        }
    }, [
        locked,
        reduced,
        version,
        icon.size,
        metal.thickness,
        metal.flow,
        metal.dispersion,
        metal.glow,
        metal.warmth,
        hoverIsDark,
        hoverStyle.intensity,
        motion.mode,
        motion.speed,
        motion.attraction,
        motion.response,
        edge.speed,
        edge.width,
        edge.flow,
        iconStyle.angle,
        iconStyle.animated,
    ])

    const active = () => {
        rootRef.current?.setAttribute(
            "data-active",
            String(input.current.hovering || input.current.focused)
        )
        engineRef.current?.wake()
    }
    const press = (value: boolean) => {
        if (value && locked) return
        input.current.pressed = value
        rootRef.current?.setAttribute("data-pressed", String(value))
        engineRef.current?.wake()
    }
    const release = () => {
        press(false)
        if (!locked && motion.release) input.current.release = 0
        engineRef.current?.wake()
    }
    const pointer = (e: React.PointerEvent) => {
        if (locked) return
        const b =
            canvasRef.current?.getBoundingClientRect() ||
            e.currentTarget.getBoundingClientRect()
        const px = ((e.clientX - b.left) / Math.max(1, b.width)) * 2 - 1
        const py = ((e.clientY - b.top) / Math.max(1, b.height)) * 2 - 1
        const length = Math.max(1, Math.hypot(px, py))
        input.current.x = px / length
        input.current.y = py / length
        const face = e.currentTarget.getBoundingClientRect()
        input.current.sx = Math.min(
            1,
            Math.max(0, (e.clientX - face.left) / Math.max(1, face.width))
        )
        input.current.sy = Math.min(
            1,
            Math.max(0, (e.clientY - face.top) / Math.max(1, face.height))
        )
        engineRef.current?.wake()
    }
    const Element = link ? "a" : "button"
    const layer: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",
    }
    return (
        <Element
            ref={rootRef}
            className="mo-orbit"
            data-static={isStatic}
            data-reduced={reduced}
            data-disabled={disabled}
            data-playback={motion.mode}
            data-hover-tone={resolvedHoverTone}
            href={link && !disabled ? link : undefined}
            target={link && newTab ? "_blank" : undefined}
            rel={link && newTab ? "noopener noreferrer" : undefined}
            type={link ? undefined : "button"}
            disabled={!link && disabled ? true : undefined}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            aria-label={accessibilityLabel || label || "Button"}
            onPointerEnter={(e) => {
                if (!locked && e.pointerType !== "touch") {
                    input.current.hovering = true
                    pointer(e)
                    active()
                }
            }}
            onPointerMove={pointer}
            onPointerLeave={() => {
                input.current.hovering = false
                press(false)
                active()
            }}
            onPointerDown={(e) => {
                if (e.button === 0) {
                    pointer(e)
                    press(true)
                }
            }}
            onPointerUp={() => {
                if (input.current.pressed) release()
            }}
            onPointerCancel={() => press(false)}
            onFocus={(e) => {
                if (!locked && e.currentTarget.matches(":focus-visible")) {
                    input.current.focused = true
                    input.current.sx = 0.5
                    input.current.sy = 0.5
                    active()
                }
            }}
            onBlur={() => {
                input.current.focused = false
                press(false)
                active()
            }}
            onKeyDown={(e) => {
                if (
                    !e.repeat &&
                    (e.key === "Enter" || (!link && e.key === " "))
                )
                    press(true)
            }}
            onKeyUp={(e) => {
                if (e.key === "Enter" || (!link && e.key === " ")) release()
            }}
            onClick={(e) => {
                if (locked) {
                    e.preventDefault()
                    return
                }
                onTap?.()
            }}
            style={
                {
                    "--orb-hover-intensity": hoverStyle.intensity,
                    "--orb-hover-core": hoverIsDark
                        ? "rgba(24,36,58,.34)"
                        : "rgba(240,249,255,.30)",
                    "--orb-hover-mid": hoverIsDark
                        ? "rgba(66,96,138,.16)"
                        : "rgba(167,203,255,.10)",
                    "--orb-hover-shadow": hoverIsDark
                        ? "rgba(26,46,78,.18)"
                        : "rgba(216,233,255,.10)",
                    "--orb-hover-edge": hoverIsDark
                        ? "rgba(21,34,57,.96)"
                        : "rgba(255,255,255,.98)",
                    "--orb-edge-width": `${edge.width}px`,
                    "--orb-edge-intensity": edge.intensity,
                    "--orb-edge-cool": `color-mix(in srgb,#80B8FF ${edge.prism * 100}%,#E8F0FA)`,
                    "--orb-edge-warm": `color-mix(in srgb,#F4B777 ${edge.prism * 100}%,#E8F0FA)`,
                    position: "relative",
                    display: "inline-flex",
                    width: "max-content",
                    height: "auto",
                    maxWidth: "100%",
                    minWidth: 0,
                    minHeight: 44,
                    margin: 0,
                    padding: 0,
                    border: 0,
                    background: "none",
                    color: fg,
                    cursor: disabled ? "not-allowed" : "pointer",
                    borderRadius: radius,
                    ...style,
                } as React.CSSProperties
            }
        >
            <style>{CSS}</style>
            <svg
                width="0"
                height="0"
                aria-hidden="true"
                style={{ position: "absolute", pointerEvents: "none" }}
            >
                <defs>
                    <linearGradient
                        ref={gradientRef}
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                        gradientTransform={`rotate(${iconStyle.angle - 90} .5 .5)`}
                    >
                        <stop offset="0%" stopColor={highlight} />
                        <stop offset="28%" stopColor={shade} />
                        <stop offset="43%" stopColor={accent} />
                        <stop offset="54%" stopColor={highlight} />
                        <stop offset="65%" stopColor={highlight} />
                        <stop offset="84%" stopColor={shade} />
                        <stop offset="100%" stopColor={highlight} />
                    </linearGradient>
                </defs>
            </svg>
            <span
                className="orb-face"
                style={{
                    display: "flex",
                    flex: 1,
                    minWidth: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection:
                        icon.position === "right" ? "row-reverse" : "row",
                    gap,
                    padding,
                    position: "relative",
                    borderRadius: radius,
                    boxShadow: shadow,
                    background: surface,
                    backdropFilter: `blur(${glass.blur}px) saturate(1.2)`,
                    WebkitBackdropFilter: `blur(${glass.blur}px) saturate(1.2)`,
                }}
            >
                <span
                    className="orb-decoration orb-wake"
                    aria-hidden="true"
                    style={layer}
                />
                <span
                    className="orb-decoration"
                    style={{
                        ...layer,
                        opacity: glass.edge,
                        border: `1px solid ${light ? "rgba(255,255,255,.9)" : "rgba(234,241,255,.16)"}`,
                        background:
                            "linear-gradient(145deg,rgba(255,255,255,.15),transparent 37%,rgba(255,255,255,.025) 70%,rgba(255,255,255,.09))",
                        boxShadow:
                            "inset 0 1px 2px rgba(255,255,255,.22),inset 0 -1px 3px rgba(0,0,0,.10)",
                    }}
                />
                {edge.enabled && (
                    <>
                        <span
                            className="orb-decoration orb-edge orb-edge-glow"
                            style={layer}
                        />
                        <span
                            className="orb-decoration orb-edge"
                            style={{ ...layer, opacity: edge.intensity }}
                        />
                        <span
                            className="orb-decoration orb-edge orb-edge-ridge"
                            style={layer}
                        />
                        <span
                            className="orb-decoration orb-hover-edge"
                            style={layer}
                        />
                    </>
                )}
                <span
                    className="orb-medallion"
                    style={{
                        width: icon.size,
                        height: icon.size,
                        maxWidth: "100%",
                        flexShrink: 0,
                        position: "relative",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                    }}
                >
                    <span
                        className="orb-disc"
                        style={{
                            position: "absolute",
                            inset: "9.5%",
                            borderRadius: "50%",
                            background: `linear-gradient(140deg,rgba(255,255,255,.12),transparent 48%,rgba(0,0,0,.18)),${icon.fill}`,
                            boxShadow:
                                "inset 0 1px 3px rgba(255,255,255,.25),inset 0 -1px 3px rgba(0,0,0,.6),0 5px 8px -3px rgba(0,0,0,.38)",
                        }}
                    />
                    <span
                        className="orb-decoration orb-fallback"
                        style={{
                            position: "absolute",
                            inset: "6%",
                            borderRadius: "50%",
                            border: "2px solid transparent",
                            background:
                                "linear-gradient(140deg,#ecf3ff,#161b26 20%,#eef6ff 43%,#111721 51%,#7187a9 69%,#faf4de 76%,#cadfff) border-box",
                            WebkitMask:
                                "linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        className="orb-decoration"
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: "-10%",
                            left: "-10%",
                            width: "120%",
                            height: "120%",
                            pointerEvents: "none",
                        }}
                    />
                    <span
                        className="orb-glyph"
                        style={{
                            position: "relative",
                            color: icon.color,
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.4))",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        {imageSrc ? (
                            painted && maskReady === imageSrc ? (
                                <span
                                    className="orb-icon-paint"
                                    aria-hidden="true"
                                    style={{
                                        display: "block",
                                        width: icon.glyphSize,
                                        height: icon.glyphSize,
                                        backgroundImage: iconGradient,
                                        WebkitMaskImage: `url(${JSON.stringify(imageSrc)})`,
                                        maskImage: `url(${JSON.stringify(imageSrc)})`,
                                    }}
                                />
                            ) : (
                                <img
                                    src={imageSrc}
                                    srcSet={icon.image?.srcSet}
                                    alt=""
                                    style={{
                                        display: "block",
                                        width: icon.glyphSize,
                                        height: icon.glyphSize,
                                        objectFit: "contain",
                                    }}
                                />
                            )
                        ) : (
                            <Glyph
                                name={icon.glyph}
                                size={icon.glyphSize}
                                paint={
                                    painted ? `url(#${gradientId})` : undefined
                                }
                            />
                        )}
                    </span>
                </span>
                {label && (
                    <span
                        className="orb-label"
                        style={{
                            ...FONT,
                            ...font,
                            minWidth: 0,
                            position: "relative",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: "0 1 auto",
                            textAlign: font?.textAlign || "left",
                        }}
                    >
                        {label}
                    </span>
                )}
                {trailing !== "none" && label && (
                    <span
                        className="orb-tail"
                        style={{ position: "relative", flexShrink: 0 }}
                    >
                        <Glyph name={trailing} size={18} />
                    </span>
                )}
            </span>
        </Element>
    )
}

addPropertyControls(LiquidMetalButtonPlus, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Make it flow",
    },
    link: { type: ControlType.Link, title: "Link", defaultValue: "" },
    newTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
        description:
            "Opens the Link above in a new browser tab. Add a link first; otherwise this setting has no effect.",
    },
    theme: {
        type: ControlType.Enum,
        title: "Surface",
        options: ["frost", "obsidian", "pearl", "custom"],
        optionTitles: ["Frost", "Obsidian", "Pearl", "Custom"],
        defaultValue: "frost",
    },
    fill: {
        type: ControlType.Color,
        title: "Fill",
        defaultValue: "rgba(218,229,238,0.18)",
        hidden: (p) => p.theme !== "custom",
    },
    textColor: { type: ControlType.Color, title: "Text Color", optional: true },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: "19px",
            variant: "Medium",
            letterSpacing: "-0.025em",
            lineHeight: "1.2em",
            textAlign: "left",
        },
    },
    icon: {
        type: ControlType.Object,
        title: "Icon",
        buttonTitle: "Medallion",
        defaultValue: ICON,
        controls: {
            glyph: {
                type: ControlType.Enum,
                title: "Icon",
                options: [
                    "sparkle",
                    "home",
                    "arrow-up-right",
                    "plus",
                    "play",
                    "search",
                    "image",
                ],
                optionTitles: [
                    "Sparkle",
                    "Home",
                    "Arrow",
                    "Plus",
                    "Play",
                    "Search",
                    "Custom Image",
                ],
                defaultValue: "sparkle",
            },
            image: {
                type: ControlType.ResponsiveImage,
                title: "Image",
                hidden: (p) => p.glyph !== "image",
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                displaySegmentedControl: true,
                defaultValue: "left",
            },
            size: {
                type: ControlType.Number,
                title: "Disc Size",
                min: 32,
                max: 120,
                step: 1,
                unit: "px",
                defaultValue: 62,
            },
            glyphSize: {
                type: ControlType.Number,
                title: "Icon Size",
                min: 12,
                max: 56,
                step: 1,
                unit: "px",
                defaultValue: 25,
            },
            color: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: "#F8FAFC",
            },
            fill: {
                type: ControlType.Color,
                title: "Disc Fill",
                defaultValue: "#353B43",
            },
        },
    },
    iconStyle: {
        type: ControlType.Object,
        title: "Icon Fill",
        buttonTitle: "Gradient",
        icon: "color",
        defaultValue: ICON_STYLE,
        controls: {
            finish: {
                type: ControlType.Enum,
                title: "Fill",
                options: ["original", "chrome", "prism", "custom"],
                optionTitles: ["Original", "Chrome", "Prism", "Custom"],
                defaultValue: "chrome",
            },
            animated: {
                type: ControlType.Boolean,
                title: "Animate",
                defaultValue: true,
                hidden: (p) => p.finish === "original",
            },
            angle: {
                type: ControlType.Number,
                title: "Angle",
                min: 0,
                max: 360,
                step: 1,
                unit: "°",
                defaultValue: 135,
                hidden: (p) => p.finish === "original",
            },
            highlight: {
                type: ControlType.Color,
                title: "Highlight",
                defaultValue: "#FFFFFF",
                hidden: (p) => p.finish !== "custom",
            },
            shade: {
                type: ControlType.Color,
                title: "Shade",
                defaultValue: "#64748C",
                hidden: (p) => p.finish !== "custom",
            },
            accent: {
                type: ControlType.Color,
                title: "Accent",
                defaultValue: "#ABCFFF",
                hidden: (p) => p.finish !== "custom",
            },
        },
        description:
            "Recolors built-in icons and transparent SVG/PNG uploads. Opaque images fill as a rectangle. Original preserves the uploaded colors; unavailable masks fall back to the original image.",
    },
    trailing: {
        type: ControlType.Enum,
        title: "Trailing",
        options: ["arrow", "chevron", "none"],
        optionTitles: ["Arrow", "Chevron", "None"],
        defaultValue: "none",
        hidden: (p) => !p.label,
    },
    edge: {
        type: ControlType.Object,
        title: "Animated Border",
        buttonTitle: "Chrome Edge",
        icon: "effect",
        defaultValue: EDGE,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: true,
            },
            width: {
                type: ControlType.Number,
                title: "Width",
                defaultValue: 3.2,
                min: 0.5,
                max: 6,
                step: 0.1,
                unit: "px",
                hidden: (p) => !p.enabled,
            },
            intensity: {
                type: ControlType.Number,
                title: "Brightness",
                defaultValue: 1,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 1,
                min: 0.1,
                max: 3,
                step: 0.05,
                hidden: (p) => !p.enabled,
            },
            prism: {
                type: ControlType.Number,
                title: "Prism",
                defaultValue: 0.8,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
            flow: {
                type: ControlType.Number,
                title: "Liquid",
                defaultValue: 0.75,
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.enabled,
            },
        },
        description:
            "Layered chrome reflections around the whole button. Liquid varies the edge thickness and reflection field. Preview to see motion; respects Motion playback and reduced motion.",
    },
    metal: {
        type: ControlType.Object,
        title: "Liquid Metal",
        buttonTitle: "Chrome",
        icon: "effect",
        defaultValue: METAL,
        controls: {
            thickness: {
                type: ControlType.Number,
                title: "Thickness",
                defaultValue: 5.2,
                min: 2,
                max: 10,
                step: 0.1,
                unit: "px",
            },
            flow: {
                type: ControlType.Number,
                title: "Liquid",
                defaultValue: 0.65,
                min: 0,
                max: 1,
                step: 0.01,
            },
            dispersion: {
                type: ControlType.Number,
                title: "Prism",
                defaultValue: 0.65,
                min: 0,
                max: 1,
                step: 0.01,
            },
            glow: {
                type: ControlType.Number,
                title: "Glow",
                defaultValue: 0.5,
                min: 0,
                max: 1,
                step: 0.01,
            },
            warmth: {
                type: ControlType.Number,
                title: "Warmth",
                defaultValue: 0,
                min: -1,
                max: 1,
                step: 0.01,
            },
        },
    },
    glass: {
        type: ControlType.Object,
        title: "Glass",
        buttonTitle: "Shell",
        icon: "effect",
        defaultValue: GLASS,
        controls: {
            blur: {
                type: ControlType.Number,
                title: "Blur",
                defaultValue: 18,
                min: 0,
                max: 40,
                step: 1,
                unit: "px",
            },
            edge: {
                type: ControlType.Number,
                title: "Bevel",
                defaultValue: 0.7,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
    },
    hoverStyle: {
        type: ControlType.Object,
        title: "Hover",
        buttonTitle: "Tone",
        icon: "interaction",
        defaultValue: HOVER,
        controls: {
            tone: {
                type: ControlType.Enum,
                title: "Tone",
                options: ["auto", "light", "dark"],
                optionTitles: ["Auto", "Light", "Dark"],
                displaySegmentedControl: true,
                defaultValue: "auto",
            },
            intensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 0.72,
                min: 0,
                max: 1,
                step: 0.01,
            },
        },
        description:
            "Choose whether the hover reflection brightens or darkens the material. Auto darkens Pearl and brightens the other surfaces. Intensity controls the glass, border and metal response. Preview to see it.",
    },
    motion: {
        type: ControlType.Object,
        title: "Motion",
        buttonTitle: "Orbit",
        icon: "interaction",
        defaultValue: MOTION,
        controls: {
            mode: {
                type: ControlType.Enum,
                title: "Playback",
                options: ["ambient", "hover", "off"],
                optionTitles: ["Always", "On Hover", "Off"],
                defaultValue: "ambient",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.8,
                min: 0.1,
                max: 3,
                step: 0.05,
                hidden: (p) => p.mode === "off",
            },
            attraction: {
                type: ControlType.Number,
                title: "Attraction",
                defaultValue: 0.7,
                min: 0,
                max: 1,
                step: 0.01,
                description:
                    "Pointer pull and local liquid-metal deformation. The surface stays in place. Use Hover → Intensity for highlight strength.",
            },
            response: {
                type: ControlType.Number,
                title: "Pressure",
                defaultValue: 0.65,
                min: 0,
                max: 1,
                step: 0.01,
            },
            release: {
                type: ControlType.Boolean,
                title: "Release Wave",
                defaultValue: true,
            },
        },
        description:
            "Preview to see liquid orbit, cursor attraction and release waves. Canvas/export stay still. Reduced motion is respected.",
    },
    radius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "100px",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "8px 22px 8px 8px",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        defaultValue: 13,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    shadow: {
        type: ControlType.BoxShadow,
        title: "Shadow",
        defaultValue: "0px 12px 24px -12px rgba(0,0,0,0.45)",
    },
    onTap: { type: ControlType.EventHandler, title: "On Tap" },
    disabled: {
        type: ControlType.Boolean,
        title: "Disabled",
        defaultValue: false,
        description:
            "Turns the button off: blocks clicks and links, dims its appearance and pauses animation. Leave this off for a normal, clickable button.",
    },
    accessibilityLabel: {
        type: ControlType.String,
        title: "ARIA Label",
        defaultValue: "",
        placeholder: "Uses visible label",
        description: `Optional accessible name. Set a name for icon-only buttons.\n\n${CREDIT}`,
    },
})
