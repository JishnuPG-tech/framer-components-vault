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


/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

type RGB = [number, number, number]

type Preset = "Molten" | "Ice" | "Neon" | "Mono" | "Vaporwave" | "Custom"

type PresetColors = {
    diffuse: RGB
    specular: RGB
    rim: RGB
}

type AnimationSettings = {
    speed?: number
    bumpFactor?: number
}

type VisualSettings = {
    patternScale?: number
    lightIntensity?: number
    lightOrbit?: number
}

type ColorSettings = {
    diffuse?: string
    specular?: string
    rim?: string
}

type OutputSettings = {
    gamma?: number
    alpha?: number
}

type Props = {
    style?: React.CSSProperties
    /** Canvas-only live preview override. */
    preview?: boolean
    preset?: Preset
    animation?: AnimationSettings
    visuals?: VisualSettings
    /** Only read when preset === "Custom". */
    colors?: ColorSettings
    output?: OutputSettings
}

/* ================================================================== */
/*  Presets                                                            */
/* ================================================================== */

const PRESETS: Record<Exclude<Preset, "Custom">, PresetColors> = {
    // The original shader's look, verbatim.
    Molten: {
        diffuse: [1.0, 0.97, 0.92],
        specular: [1.0, 0.6, 0.2],
        rim: [0.25, 0.5, 1.0],
    },
    Ice: {
        diffuse: [0.85, 0.92, 1.0],
        specular: [0.7, 0.9, 1.0],
        rim: [0.3, 0.85, 1.0],
    },
    Neon: {
        diffuse: [1.0, 0.3, 0.9],
        specular: [1.0, 1.0, 0.3],
        rim: [0.2, 1.0, 0.4],
    },
    Mono: {
        diffuse: [1.0, 1.0, 1.0],
        specular: [1.0, 1.0, 1.0],
        rim: [0.0, 0.0, 0.0], // kills the rim contribution entirely
    },
    Vaporwave: {
        diffuse: [1.0, 0.6, 0.9],
        specular: [0.6, 1.0, 1.0],
        rim: [0.5, 0.2, 1.0],
    },
}

/* ================================================================== */
/*  Color parsing                                                      */
/* ================================================================== */

/**
 * Parse any color string Framer's Color control can produce into a
 * normalized [r, g, b] triplet in the 0–1 range.
 *
 * Handles:
 *   - "#rgb" / "#rgba"           (shorthand)
 *   - "#rrggbb" / "#rrggbbaa"    (with optional alpha)
 *   - "rgb(r,g,b)" / "rgba(...)" (functional)
 *
 * Falls back to white so a WebGL uniform is never NaN.
 */
function parseColor(input: string | undefined | null): RGB {
    const fallback: RGB = [1, 1, 1]
    if (!input || typeof input !== "string") return fallback

    const s = input.trim()

    // rgb() / rgba() functional form
    const rgbMatch = s.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    )
    if (rgbMatch) {
        return [
            Math.min(255, Math.max(0, parseFloat(rgbMatch[1]))) / 255,
            Math.min(255, Math.max(0, parseFloat(rgbMatch[2]))) / 255,
            Math.min(255, Math.max(0, parseFloat(rgbMatch[3]))) / 255,
        ]
    }

    // Hex form — 3, 4, 6, or 8 chars, with or without leading "#"
    const hexMatch = s.match(/^#?([0-9a-f]+)$/i)
    if (hexMatch) {
        const hex = hexMatch[1]
        if (hex.length === 3 || hex.length === 4) {
            return [
                parseInt(hex[0] + hex[0], 16) / 255,
                parseInt(hex[1] + hex[1], 16) / 255,
                parseInt(hex[2] + hex[2], 16) / 255,
            ]
        }
        if (hex.length === 6 || hex.length === 8) {
            return [
                parseInt(hex.slice(0, 2), 16) / 255,
                parseInt(hex.slice(2, 4), 16) / 255,
                parseInt(hex.slice(4, 6), 16) / 255,
            ]
        }
    }

    return fallback
}

/* ================================================================== */
/*  Shaders                                                            */
/* ================================================================== */

const VERT = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAG = `
precision highp float;

uniform vec2  iResolution;
uniform float iTime;

uniform float uBumpFactor;
uniform float uAlpha;
uniform float uPatternScale;
uniform float uLightIntensity;
uniform float uLightOrbit;
uniform float uGamma;

uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;
uniform vec3 uRimColor;

varying vec2 v_uv;

vec2 W(vec2 p){
    p = (p + 3.0)*uPatternScale;

    float t = iTime/2.0;

    for (int i=0; i<3; i++){
        p += cos(p.yx*3.0 + vec2(t, 1.57))/3.0;
        p += sin(p.yx + t + vec2(1.57, 0.0))/2.0;
        p *= 1.3;
    }

    p += fract(sin(p+vec2(13.0, 7.0))*5e5)*0.03 - 0.015;
    return mod(p, 2.0) - 1.0;
}

float bumpFunc(vec2 p){
    return length(W(p))*0.7071;
}

vec3 smoothFract(vec3 x){
    x = fract(x);
    return min(x, x*(1.0-x)*12.0);
}

void main() {
    vec2 fragCoord = v_uv * iResolution;
    vec2 uv = (fragCoord - iResolution*0.5)/iResolution.y;

    vec3 sp = vec3(uv, 0.0);
    vec3 rd = normalize(vec3(uv, 1.0));
    vec3 lp = vec3(
        cos(iTime)*0.5*uLightOrbit,
        sin(iTime)*0.2*uLightOrbit,
        -1.0
    );
    vec3 sn = vec3(0.0, 0.0, -1.0);

    vec2 eps = vec2(4.0/iResolution.y, 0.0);

    float f  = bumpFunc(sp.xy);
    float fx = bumpFunc(sp.xy - eps.xy);
    float fy = bumpFunc(sp.xy - eps.yx);

    fx = (fx - f)/eps.x;
    fy = (fy - f)/eps.x;

    sn = normalize(sn + vec3(fx, fy, 0.0)*uBumpFactor);

    vec3 ld = lp - sp;
    float lDist = max(length(ld), 0.0001);
    ld /= lDist;

    float atten = 1.0/(1.0 + lDist*lDist*0.15);
    atten *= f*0.9 + 0.1;

    float diff = max(dot(sn, ld), 0.0);
    diff = pow(diff, 4.0)*0.66 + pow(diff, 8.0)*0.34;
    float spec = pow(max(dot(reflect(-ld, sn), -rd), 0.0), 12.0);

    // Procedural base pattern (was the fallback path; now the only path).
    vec3 texCol = smoothFract(W(sp.xy).xyy)*0.1 + 0.2;

    vec3 col = (
        texCol*(diff*uDiffuseColor*uLightIntensity + 0.5)
        + uSpecularColor*spec*uLightIntensity
    )*atten;

    float refv = max(dot(reflect(rd, sn), vec3(1.0)), 0.0);
    col += col*pow(refv, 4.0)*uRimColor*3.0;

    col = pow(clamp(col, 0.0, 1.0), vec3(uGamma));

    gl_FragColor = vec4(col, clamp(uAlpha, 0.0, 1.0));
}
`

/* ================================================================== */
/*  WebGL helpers                                                      */
/* ================================================================== */

function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type)
    if (!shader) throw new Error("Failed to create shader")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) || "Unknown shader error"
        gl.deleteShader(shader)
        throw new Error(log)
    }
    return shader
}

function createProgram(
    gl: WebGLRenderingContext,
    vsSource: string,
    fsSource: string
): WebGLProgram {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)

    const program = gl.createProgram()
    if (!program) {
        gl.deleteShader(vs)
        gl.deleteShader(fs)
        throw new Error("Failed to create program")
    }

    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)

    // Shaders can be deleted immediately after linking.
    gl.deleteShader(vs)
    gl.deleteShader(fs)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) || "Unknown link error"
        gl.deleteProgram(program)
        throw new Error(log)
    }
    return program
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

/**
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 */
export default function BumpedSinusoidalWarp(props: Props) {
    const {
        style,
        preview = false,
        preset = "Molten",
        animation,
        visuals,
        colors,
        output,
    } = props

    /* -------- Resolve nested Object values with fallbacks ---------- */
    const speed = animation?.speed ?? 1
    const bumpFactor = animation?.bumpFactor ?? 0.05

    const patternScale = visuals?.patternScale ?? 4.0
    const lightIntensity = visuals?.lightIntensity ?? 2.0
    const lightOrbit = visuals?.lightOrbit ?? 1.0

    const gamma = output?.gamma ?? 0.5
    const alpha = output?.alpha ?? 1

    /* -------- Resolve preset colors (memoized) --------------------- */
    const resolvedColors = React.useMemo<PresetColors>(() => {
        if (preset === "Custom") {
            return {
                diffuse: parseColor(colors?.diffuse),
                specular: parseColor(colors?.specular),
                rim: parseColor(colors?.rim),
            }
        }
        return PRESETS[preset as Exclude<Preset, "Custom">] ?? PRESETS.Molten
    }, [preset, colors?.diffuse, colors?.specular, colors?.rim])

    /* -------- Refs ------------------------------------------------- */
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

    /* -------- Static vs. animated renderer ------------------------- */
    // useIsStaticRenderer() correctly reports TRUE for BOTH the Framer
    // Canvas and Export rendering. Preview may override the static
    // behaviour ONLY on the Canvas. Export must always stay static.
    const isStaticRenderer = useIsStaticRenderer()
    const currentTarget = RenderTarget.current()
    const isExport = currentTarget === RenderTarget.export
    const isThumbnail = currentTarget === RenderTarget.thumbnail
    const isCanvas = currentTarget === RenderTarget.canvas

    const shouldAnimate =
        !isExport &&
        !isThumbnail &&
        (!isStaticRenderer || (preview && isCanvas))

    /* -------- Live params — read from the loop via a single ref ---- */
    // This keeps the WebGL context alive when sliders move; nothing in
    // the effect dependency array depends on these values.
    type LiveParams = {
        speed: number
        bumpFactor: number
        alpha: number
        patternScale: number
        lightIntensity: number
        lightOrbit: number
        gamma: number
        diffuse: RGB
        specular: RGB
        rim: RGB
    }

    const paramsRef = React.useRef<LiveParams>({
        speed,
        bumpFactor,
        alpha,
        patternScale,
        lightIntensity,
        lightOrbit,
        gamma,
        diffuse: resolvedColors.diffuse,
        specular: resolvedColors.specular,
        rim: resolvedColors.rim,
    })

    React.useLayoutEffect(() => {
        paramsRef.current = {
            speed,
            bumpFactor,
            alpha,
            patternScale,
            lightIntensity,
            lightOrbit,
            gamma,
            diffuse: resolvedColors.diffuse,
            specular: resolvedColors.specular,
            rim: resolvedColors.rim,
        }
    })

    /* ============================================================== */
    /*  Effect: WebGL lifecycle                                        */
    /* ============================================================== */
    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            antialias: true,
            alpha: true,
            premultipliedAlpha: true,
        })
        if (!gl) {
            console.warn("BumpedSinusoidalWarp: WebGL not supported")
            return
        }

        let disposed = false
        let raf = 0
        let isVisible = true
        let isPageVisible =
            typeof document === "undefined" ? true : !document.hidden

        /* ---------------------------------------------------------- */
        /*  Static GPU resources (allocated ONCE per effect run).      */
        /* ---------------------------------------------------------- */
        const buffer = gl.createBuffer()
        if (!buffer) return
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
        )

        /* ---------------------------------------------------------- */
        /*  Compile + link once; cache all locations.                  */
        /*  Never allocate or look up GL resources in the RAF loop.    */
        /* ---------------------------------------------------------- */
        let program: WebGLProgram | null = null
        try {
            program = createProgram(gl, VERT, FRAG)
        } catch (err) {
            console.warn("BumpedSinusoidalWarp: shader compile failed", err)
        }
        if (!program) {
            gl.deleteBuffer(buffer)
            return
        }

        const aPos = gl.getAttribLocation(program, "a_position")
        const uRes = gl.getUniformLocation(program, "iResolution")
        const uTime = gl.getUniformLocation(program, "iTime")
        const uBump = gl.getUniformLocation(program, "uBumpFactor")
        const uAlpha = gl.getUniformLocation(program, "uAlpha")
        const uPatternScale = gl.getUniformLocation(program, "uPatternScale")
        const uLightIntensity = gl.getUniformLocation(
            program,
            "uLightIntensity"
        )
        const uLightOrbit = gl.getUniformLocation(program, "uLightOrbit")
        const uGamma = gl.getUniformLocation(program, "uGamma")
        const uDiffuse = gl.getUniformLocation(program, "uDiffuseColor")
        const uSpecular = gl.getUniformLocation(program, "uSpecularColor")
        const uRim = gl.getUniformLocation(program, "uRimColor")

        // Enable blending once — never toggled inside the loop.
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        const startTime = performance.now()

        /* ---------------------------------------------------------- */
        /*  Draw a single frame.                                       */
        /* ---------------------------------------------------------- */
        const drawFrame = (time: number) => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            const rect = canvas.getBoundingClientRect()
            const w = Math.max(1, Math.floor(rect.width * dpr))
            const h = Math.max(1, Math.floor(rect.height * dpr))
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w
                canvas.height = h
                gl.viewport(0, 0, w, h)
            }

            gl.useProgram(program)

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.enableVertexAttribArray(aPos)
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

            const p = paramsRef.current

            gl.uniform2f(uRes, canvas.width, canvas.height)
            gl.uniform1f(uTime, time)
            gl.uniform1f(uBump, p.bumpFactor)
            gl.uniform1f(uAlpha, p.alpha)
            gl.uniform1f(uPatternScale, p.patternScale)
            gl.uniform1f(uLightIntensity, p.lightIntensity)
            gl.uniform1f(uLightOrbit, p.lightOrbit)
            gl.uniform1f(uGamma, p.gamma)
            gl.uniform3fv(uDiffuse, p.diffuse)
            gl.uniform3fv(uSpecular, p.specular)
            gl.uniform3fv(uRim, p.rim)

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        /* ---------------------------------------------------------- */
        /*  RAF loop control — HARD GATED by `shouldAnimate`.          */
        /*  Static renderers (Canvas w/o Preview, Export, Thumbnail)   */
        /*  must NEVER start the RAF loop, no matter who calls.        */
        /* ---------------------------------------------------------- */
        const tick = () => {
            raf = 0
            if (disposed || !isVisible || !isPageVisible) return
            const t =
                ((performance.now() - startTime) / 1000) *
                paramsRef.current.speed
            drawFrame(t)
            raf = requestAnimationFrame(tick)
        }

        const startLoop = () => {
            if (!shouldAnimate) return
            if (raf !== 0 || disposed) return
            if (!isVisible || !isPageVisible) return
            raf = requestAnimationFrame(tick)
        }

        const stopLoop = () => {
            if (raf !== 0) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        }

        /* ---------------------------------------------------------- */
        /*  Initial render.                                            */
        /* ---------------------------------------------------------- */
        if (shouldAnimate) {
            startLoop()
        } else {
            // Static: exactly ONE deterministic frame, no RAF loop.
            drawFrame(0)
        }

        /* ---------------------------------------------------------- */
        /*  Observers — only installed when actually animating.        */
        /*  In static mode there is no loop to pause.                  */
        /* ---------------------------------------------------------- */
        const onVisibility = () => {
            isPageVisible = !document.hidden
            if (isPageVisible) startLoop()
            else stopLoop()
        }

        let io: IntersectionObserver | null = null
        if (shouldAnimate) {
            io = new IntersectionObserver(
                (entries) => {
                    for (const entry of entries) {
                        isVisible = entry.isIntersecting
                    }
                    if (isVisible) startLoop()
                    else stopLoop()
                },
                { threshold: 0 }
            )
            io.observe(canvas)
            document.addEventListener("visibilitychange", onVisibility)
        }

        /* ---------------------------------------------------------- */
        /*  Cleanup — every add* has a matching remove*.               */
        /* ---------------------------------------------------------- */
        return () => {
            disposed = true
            stopLoop()
            io?.disconnect()
            document.removeEventListener("visibilitychange", onVisibility)

            gl.deleteProgram(program)
            gl.deleteBuffer(buffer)
        }
    }, [shouldAnimate])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "100%", display: "block" }}
            />
        </div>
    )
}

/* ================================================================== */
/*  Property controls                                                  */
/* ================================================================== */

addPropertyControls(BumpedSinusoidalWarp, {
    // Preview MUST be the first control and never grouped.
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        description:
            "Play the animation live inside the Framer Canvas while editing.\n\n" +
            "**Export rendering is always static** regardless of this setting. " +
            "Preview and published sites always animate.",
    },
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Molten", "Ice", "Neon", "Mono", "Vaporwave", "Custom"],
        optionTitles: ["Molten", "Ice", "Neon", "Mono", "Vaporwave", "Custom…"],
        defaultValue: "Molten",
        description:
            "Curated color palettes tuned for the bump-lighting model.\n\n" +
            "Pick **Custom…** to unlock per-channel color controls.",
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0,
                max: 5,
                step: 0.05,
                defaultValue: 1,
            },
            bumpFactor: {
                type: ControlType.Number,
                title: "Bump",
                min: 0,
                max: 0.25,
                step: 0.005,
                defaultValue: 0.05,
                description: "Strength of the surface normal perturbation.",
            },
        },
    },
    visuals: {
        type: ControlType.Object,
        title: "Visuals",
        controls: {
            patternScale: {
                type: ControlType.Number,
                title: "Pattern Scale",
                min: 0.5,
                max: 12,
                step: 0.1,
                defaultValue: 4,
                description:
                    "Density of the underlying warp field.\n\n" +
                    "Lower = big rolling waves, higher = fine grain.",
            },
            lightIntensity: {
                type: ControlType.Number,
                title: "Light Intensity",
                min: 0,
                max: 6,
                step: 0.05,
                defaultValue: 2,
                description: "Brightness of the diffuse and specular response.",
            },
            lightOrbit: {
                type: ControlType.Number,
                title: "Light Orbit",
                min: 0,
                max: 3,
                step: 0.05,
                defaultValue: 1,
                description:
                    "How far the animated light sweeps across the surface.",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        // Only relevant when the user has opted out of a preset.
        hidden: (p) => p.preset !== "Custom",
        controls: {
            diffuse: {
                type: ControlType.Color,
                title: "Diffuse",
                defaultValue: "#fff7eb",
                description: "Base light color reflected from the surface.",
            },
            specular: {
                type: ControlType.Color,
                title: "Specular",
                defaultValue: "#ff9933",
                description: "Highlight color for specular reflections.",
            },
            rim: {
                type: ControlType.Color,
                title: "Rim",
                defaultValue: "#4080ff",
                description:
                    "Fresnel rim color. Set to black to disable the rim effect.",
            },
        },
    },
    output: {
        type: ControlType.Object,
        title: "Output",
        controls: {
            gamma: {
                type: ControlType.Number,
                title: "Gamma",
                min: 0.2,
                max: 1.5,
                step: 0.01,
                defaultValue: 0.5,
                description:
                    "Output tone curve.\n\n" +
                    "**0.5** = original brightness (sqrt). " +
                    "Lower = airier, higher = punchier.",
            },
            alpha: {
                type: ControlType.Number,
                title: "Alpha",
                min: 0,
                max: 1,
                step: 0.01,
                defaultValue: 1,
                description:
                    "Opacity of the shader output. Lower values reveal whatever " +
                    "is behind the component.\n\n" +
                    "More components at [Visual Mess Studio](https://visualmess.framer.website/).",
            },
        },
    },
})
