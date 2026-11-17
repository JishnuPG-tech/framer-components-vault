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


/**

 * WebX Component Lab ready:

 * - preserves the original Framer component API and visual behavior

 * - exports defaultProps for predictable preview initialization

 * - exports propertyControls for exact Lab inspector rendering

 *

 * @framerSupportedLayoutWidth any

 * @framerSupportedLayoutHeight fixed

 * @framerIntrinsicWidth 1200

 * @framerIntrinsicHeight 760

 */

// ======================================================

// GLSL

// ======================================================

const VERTEX_SHADER = `

attribute vec2 a_position;



void main() {

    gl_Position = vec4(a_position, 0.0, 1.0);

}

`

const FRAGMENT_SHADER = `

precision highp float;



uniform vec2 u_resolution;

uniform float u_time;



uniform vec2 u_pointer;

uniform float u_pointerInfluence;



uniform vec3 u_primary;

uniform vec3 u_secondary;

uniform vec3 u_highlight;



uniform vec3 u_light;



uniform float u_radius;

uniform float u_distortion;

uniform float u_detail;



uniform float u_rim;

uniform float u_glow;



uniform float u_mode;





// ======================================================

// RANDOM / NOISE

// ======================================================



float hash31(vec3 p) {

    p = fract(p * 0.1031);

    p += dot(p, p.yzx + 33.33);



    return fract((p.x + p.y) * p.z);

}



float noise3(vec3 p) {

    vec3 i = floor(p);

    vec3 f = fract(p);



    f = f * f * (3.0 - 2.0 * f);



    float n000 = hash31(i + vec3(0.0,0.0,0.0));

    float n100 = hash31(i + vec3(1.0,0.0,0.0));

    float n010 = hash31(i + vec3(0.0,1.0,0.0));

    float n110 = hash31(i + vec3(1.0,1.0,0.0));



    float n001 = hash31(i + vec3(0.0,0.0,1.0));

    float n101 = hash31(i + vec3(1.0,0.0,1.0));

    float n011 = hash31(i + vec3(0.0,1.0,1.0));

    float n111 = hash31(i + vec3(1.0,1.0,1.0));



    float nx00 = mix(n000, n100, f.x);

    float nx10 = mix(n010, n110, f.x);

    float nx01 = mix(n001, n101, f.x);

    float nx11 = mix(n011, n111, f.x);



    float nxy0 = mix(nx00, nx10, f.y);

    float nxy1 = mix(nx01, nx11, f.y);



    return mix(nxy0, nxy1, f.z);

}



float fbm(vec3 p) {

    float value = 0.0;

    float amplitude = 0.5;



    value += noise3(p) * amplitude;



    p = p * 2.02 + vec3(13.1, 7.7, 5.3);

    amplitude *= 0.5;

    value += noise3(p) * amplitude;



    p = p * 2.03 + vec3(3.9, 17.2, 9.1);

    amplitude *= 0.5;

    value += noise3(p) * amplitude;



    p = p * 2.01 + vec3(11.4, 2.6, 15.8);

    amplitude *= 0.5;

    value += noise3(p) * amplitude;



    return value;

}





// ======================================================

// CHROME

// ======================================================



vec3 chromeMode(

    vec3 normal,

    float noiseValue,

    float diffuse,

    float fresnel,

    float time

) {

    float warped =

        normal.y +

        noiseValue * u_distortion;



    float bandA =

        0.5 +

        0.5 *

        sin(

            warped * 12.0 +

            time * 0.65

        );



    float bandB =

        0.5 +

        0.5 *

        sin(

            normal.x * 8.0 -

            normal.y * 6.0 +

            noiseValue * 7.0 -

            time * 0.4

        );



    float metallic =

        mix(

            bandA,

            bandB,

            0.45

        );



    vec3 color =

        mix(

            u_primary,

            u_secondary,

            metallic

        );



    color =

        mix(

            color,

            u_highlight,

            pow(diffuse, 5.0) *

            0.85

        );



    color +=

        u_highlight *

        fresnel *

        u_rim *

        0.55;



    return color;

}





// ======================================================

// GLASS

// ======================================================



vec3 glassMode(

    vec3 normal,

    float noiseValue,

    float diffuse,

    float fresnel,

    float time

) {

    float softNoise =

        smoothstep(

            0.15,

            0.9,

            noiseValue

        );



    float gradient =

        normal.y * 0.5 +

        0.5;



    vec3 color =

        mix(

            u_primary,

            u_secondary,

            gradient

        );



    color =

        mix(

            color,

            u_highlight,

            softNoise * 0.18

        );



    color *=

        0.75 +

        diffuse * 0.4;



    color +=

        u_highlight *

        fresnel *

        u_rim *

        0.8;



    return color;

}





// ======================================================

// PLASMA

// ======================================================



vec3 plasmaMode(

    vec3 normal,

    float noiseValue,

    float diffuse,

    float fresnel,

    float time

) {

    float waveA =

        sin(

            normal.x * 10.0 +

            normal.y * 8.0 +

            noiseValue * 8.0 +

            time * 1.3

        );



    float waveB =

        cos(

            normal.y * 13.0 -

            normal.x * 5.0 +

            noiseValue * 6.0 -

            time * 0.9

        );



    float energy =

        0.5 +

        0.25 * waveA +

        0.25 * waveB;



    energy =

        clamp(

            energy,

            0.0,

            1.0

        );



    vec3 color =

        mix(

            u_primary,

            u_secondary,

            energy

        );



    float hot =

        pow(

            max(

                0.0,

                energy

            ),

            3.0

        );



    color =

        mix(

            color,

            u_highlight,

            hot * 0.7

        );



    color +=

        u_highlight *

        fresnel *

        u_rim *

        0.45;



    return color;

}





// ======================================================

// MAIN

// ======================================================



void main() {



    vec2 resolution =

        max(

            u_resolution,

            vec2(1.0)

        );



    float minDimension =

        min(

            resolution.x,

            resolution.y

        );



    vec2 p =

        (

            gl_FragCoord.xy -

            resolution * 0.5

        ) /

        minDimension;



    p.y *= -1.0;



    // Orb position displacement.

    // Pointer values are already inverted in JS,

    // so this creates the opposite-direction interaction.

    vec2 pointerShift =

        u_pointer *

        u_pointerInfluence *

        0.10;



    p -= pointerShift;



    float radius =

        u_radius;



    float distanceFromCenter =

        length(p);



    float edgeSoftness =

        0.008;



    float orbMask =

        1.0 -

        smoothstep(

            radius - edgeSoftness,

            radius + edgeSoftness,

            distanceFromCenter

        );



    float normalizedRadius =

        distanceFromCenter /

        max(

            radius,

            0.001

        );



    float z =

        sqrt(

            max(

                0.0,

                1.0 -

                normalizedRadius *

                normalizedRadius

            )

        );



    vec3 sphere =

        normalize(

            vec3(

                p /

                max(

                    radius,

                    0.001

                ),

                z

            )

        );



    float time =

        u_time;



    vec3 noisePosition =

        sphere *

        u_detail;



    noisePosition +=

        vec3(

            time * 0.26,

            time * -0.19,

            time * 0.22

        );



    noisePosition.xy +=

        u_pointer.xy *

        u_pointerInfluence *

        0.45;



    float noiseValue =

        fbm(

            noisePosition

        );



    float noiseSecondary =

        fbm(

            noisePosition *

            1.55 +

            vec3(

                5.1,

                9.2,

                2.3

            )

        );



    float warp =

        (

            noiseValue -

            0.5

        ) *

        u_distortion;



    vec3 warpedNormal =

        normalize(

            sphere +

            vec3(

                warp,



                (

                    noiseSecondary -

                    0.5

                ) *

                u_distortion,



                warp * 0.35

            )

        );



    vec3 lightDirection =

        normalize(

            u_light

        );



    float diffuse =

        max(

            0.0,

            dot(

                warpedNormal,

                lightDirection

            )

        );



    float fresnel =

        pow(

            clamp(

                1.0 -

                warpedNormal.z,

                0.0,

                1.0

            ),

            2.2

        );



    vec3 color;



    if (

        u_mode < 0.5

    ) {

        color =

            chromeMode(

                warpedNormal,

                noiseValue,

                diffuse,

                fresnel,

                time

            );

    }

    else if (

        u_mode < 1.5

    ) {

        color =

            glassMode(

                warpedNormal,

                noiseValue,

                diffuse,

                fresnel,

                time

            );

    }

    else {

        color =

            plasmaMode(

                warpedNormal,

                noiseValue,

                diffuse,

                fresnel,

                time

            );

    }



    float outside =

        max(

            0.0,

            distanceFromCenter -

            radius

        );



    float glow =

        exp(

            -outside * 26.0

        ) *

        u_glow;



    glow *=

        1.0 -

        orbMask;



    vec3 glowColor =

        mix(

            u_secondary,

            u_highlight,

            0.55

        );



    vec3 finalColor =

        color *

        orbMask +

        glowColor *

        glow *

        0.45;



    float alpha =

        max(

            orbMask,

            glow * 0.28

        );



    gl_FragColor =

        vec4(

            finalColor,

            clamp(

                alpha,

                0.0,

                1.0

            )

        );

}

`

// ======================================================

// TYPES

// ======================================================

type RGB = {
    r: number

    g: number

    b: number
}

type OrbConfig = {
    speed: number

    primary: string

    secondary: string

    highlight: string

    radius: number

    distortion: number

    detail: number

    rim: number

    glow: number

    lightX: number

    lightY: number

    lightZ: number

    pointerInfluence: number

    mode: number

    quality: number

    dprCap: number
}

// ======================================================

// HELPERS

// ======================================================

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
}

function colorToRGB(color: string): RGB {
    if (!color) {
        return {
            r: 1,

            g: 1,

            b: 1,
        }
    }

    if (color.startsWith("#")) {
        let hex = color.slice(1)

        if (hex.length === 3) {
            hex = hex

                .split("")

                .map((value) => value + value)

                .join("")
        }

        if (hex.length >= 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16) / 255,

                g: parseInt(hex.slice(2, 4), 16) / 255,

                b: parseInt(hex.slice(4, 6), 16) / 255,
            }
        }
    }

    const rgbMatch = color.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/
    )

    if (rgbMatch) {
        return {
            r: Number(rgbMatch[1]) / 255,

            g: Number(rgbMatch[2]) / 255,

            b: Number(rgbMatch[3]) / 255,
        }
    }

    return {
        r: 1,

        g: 1,

        b: 1,
    }
}

function compileShader(
    gl: WebGLRenderingContext,

    type: number,

    source: string
) {
    const shader = gl.createShader(type)

    if (!shader) {
        return null
    }

    gl.shaderSource(shader, source)

    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn("WebGL shader error:", gl.getShaderInfoLog(shader))

        gl.deleteShader(shader)

        return null
    }

    return shader
}

function createProgram(gl: WebGLRenderingContext) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)

    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)

    if (!vertex || !fragment) {
        return null
    }

    const program = gl.createProgram()

    if (!program) {
        return null
    }

    gl.attachShader(program, vertex)

    gl.attachShader(program, fragment)

    gl.linkProgram(program)

    gl.deleteShader(vertex)

    gl.deleteShader(fragment)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn("WebGL program error:", gl.getProgramInfoLog(program))

        gl.deleteProgram(program)

        return null
    }

    return program
}

// ======================================================

// WEBGL ORB

// ======================================================

function WebGLOrb({
    preset,

    speed,

    primary,

    secondary,

    highlight,

    radius,

    distortion,

    detail,

    rim,

    glow,

    lightX,

    lightY,

    lightZ,

    pointerInfluence,

    quality,

    dprCap,

    pauseOffscreen,

    reducedMotion,

    orbScale,

    isStaticRenderer,
}: any) {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    const wrapperRef = React.useRef<HTMLDivElement>(null)

    const rafRef = React.useRef<number | null>(null)

    const drawRef = React.useRef<(() => void) | null>(null)

    const visibleRef = React.useRef(true)

    const runningRef = React.useRef(false)

    const startTimeRef = React.useRef(0)

    const pointerRef = React.useRef({
        x: 0,

        y: 0,
    })

    const targetPointerRef = React.useRef({
        x: 0,

        y: 0,
    })

    const prefersReducedMotionRef = React.useRef(false)

    // Start optimistic so the canvas can mount and WebGL can be tested.
    // If context creation fails, switch to the CSS fallback.
    const [webGLAvailable, setWebGLAvailable] = React.useState(true)

    // ==================================================

    // CONFIG REF

    // ==================================================

    const configRef = React.useRef<OrbConfig>({} as OrbConfig)

    const mode =
        preset === "Soft Glass" ? 1 : preset === "Electric Plasma" ? 2 : 0

    configRef.current = {
        speed,

        primary,

        secondary,

        highlight,

        radius,

        distortion,

        detail,

        rim,

        glow,

        lightX,

        lightY,

        lightZ,

        pointerInfluence,

        mode,

        quality,

        dprCap,
    }

    // ==================================================

    // POINTER

    //

    // IMPORTANT CHANGE:

    //

    // Pointer is intentionally inverted.

    //

    // Mouse right  -> orb reacts left

    // Mouse left   -> orb reacts right

    // Mouse down   -> orb reacts up

    // Mouse up     -> orb reacts down

    // ==================================================

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (isStaticRenderer) return

        const rect = wrapperRef.current?.getBoundingClientRect()

        if (!rect) return

        const normalizedX = clamp(
            (event.clientX - rect.left) / rect.width,

            0,

            1
        )

        const normalizedY = clamp(
            (event.clientY - rect.top) / rect.height,

            0,

            1
        )

        const naturalX = normalizedX * 2 - 1

        const naturalY = normalizedY * 2 - 1

        // ----------------------------------------------

        // INVERSE POINTER DIRECTION

        // ----------------------------------------------

        targetPointerRef.current = {
            x: -naturalX,

            y: -naturalY,
        }
    }

    const handlePointerLeave = () => {
        targetPointerRef.current = {
            x: 0,

            y: 0,
        }
    }

    // ==================================================

    // WEBGL

    // ==================================================

    React.useEffect(() => {
        const canvas = canvasRef.current

        const wrapper = wrapperRef.current

        if (!canvas || !wrapper) {
            return
        }

        const media = window.matchMedia("(prefers-reduced-motion: reduce)")

        prefersReducedMotionRef.current = media.matches

        const gl = canvas.getContext("webgl", {
            alpha: true,

            antialias: false,

            depth: false,

            stencil: false,

            premultipliedAlpha: true,

            preserveDrawingBuffer: false,

            powerPreference: "high-performance",
        })

        if (!gl) {
            console.warn("WebGL is not available.")
            setWebGLAvailable(false)

            return
        }

        // A context was created successfully. Keep/render the live canvas.
        setWebGLAvailable(true)

        const program = createProgram(gl)

        if (!program) return

        gl.useProgram(program)

        // ==================================================

        // FULLSCREEN TRIANGLES

        // ==================================================

        const buffer = gl.createBuffer()

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

        gl.bufferData(
            gl.ARRAY_BUFFER,

            new Float32Array([
                -1, -1,

                1, -1,

                -1, 1,

                -1, 1,

                1, -1,

                1, 1,
            ]),

            gl.STATIC_DRAW
        )

        const positionLocation = gl.getAttribLocation(program, "a_position")

        gl.enableVertexAttribArray(positionLocation)

        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        // ==================================================

        // UNIFORMS

        // ==================================================

        const uniforms = {
            resolution: gl.getUniformLocation(program, "u_resolution"),

            time: gl.getUniformLocation(program, "u_time"),

            pointer: gl.getUniformLocation(program, "u_pointer"),

            pointerInfluence: gl.getUniformLocation(
                program,

                "u_pointerInfluence"
            ),

            primary: gl.getUniformLocation(program, "u_primary"),

            secondary: gl.getUniformLocation(program, "u_secondary"),

            highlight: gl.getUniformLocation(program, "u_highlight"),

            light: gl.getUniformLocation(program, "u_light"),

            radius: gl.getUniformLocation(program, "u_radius"),

            distortion: gl.getUniformLocation(program, "u_distortion"),

            detail: gl.getUniformLocation(program, "u_detail"),

            rim: gl.getUniformLocation(program, "u_rim"),

            glow: gl.getUniformLocation(program, "u_glow"),

            mode: gl.getUniformLocation(program, "u_mode"),
        }

        // ==================================================

        // RESIZE

        // ==================================================

        const resize = () => {
            const rect = wrapper.getBoundingClientRect()

            const config = configRef.current

            const nativeDpr = window.devicePixelRatio || 1

            const dpr = Math.min(nativeDpr, config.dprCap) * config.quality

            const width = Math.max(1, Math.round(rect.width * dpr))

            const height = Math.max(1, Math.round(rect.height * dpr))

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width

                canvas.height = height

                gl.viewport(0, 0, width, height)
            }

            if (!runningRef.current) {
                drawRef.current?.()
            }
        }

        // ==================================================

        // DRAW

        // ==================================================

        const draw = () => {
            const config = configRef.current

            const elapsed = (performance.now() - startTimeRef.current) / 1000

            // Smooth inverse-pointer movement.

            pointerRef.current.x +=
                (targetPointerRef.current.x - pointerRef.current.x) * 0.075

            pointerRef.current.y +=
                (targetPointerRef.current.y - pointerRef.current.y) * 0.075

            const primaryRGB = colorToRGB(config.primary)

            const secondaryRGB = colorToRGB(config.secondary)

            const highlightRGB = colorToRGB(config.highlight)

            gl.clearColor(0, 0, 0, 0)

            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)

            gl.uniform1f(uniforms.time, elapsed * config.speed)

            gl.uniform2f(
                uniforms.pointer,

                pointerRef.current.x,

                pointerRef.current.y
            )

            gl.uniform1f(uniforms.pointerInfluence, config.pointerInfluence)

            gl.uniform3f(
                uniforms.primary,

                primaryRGB.r,

                primaryRGB.g,

                primaryRGB.b
            )

            gl.uniform3f(
                uniforms.secondary,

                secondaryRGB.r,

                secondaryRGB.g,

                secondaryRGB.b
            )

            gl.uniform3f(
                uniforms.highlight,

                highlightRGB.r,

                highlightRGB.g,

                highlightRGB.b
            )

            gl.uniform3f(
                uniforms.light,

                config.lightX,

                config.lightY,

                config.lightZ
            )

            gl.uniform1f(uniforms.radius, config.radius)

            gl.uniform1f(uniforms.distortion, config.distortion)

            gl.uniform1f(uniforms.detail, config.detail)

            gl.uniform1f(uniforms.rim, config.rim)

            gl.uniform1f(uniforms.glow, config.glow)

            gl.uniform1f(uniforms.mode, config.mode)

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        drawRef.current = draw

        // ==================================================

        // LOOP

        // ==================================================

        const loop = () => {
            if (!runningRef.current) {
                return
            }

            draw()

            rafRef.current = requestAnimationFrame(loop)
        }

        const start = () => {
            const shouldReduce =
                reducedMotion && prefersReducedMotionRef.current

            if (shouldReduce) {
                runningRef.current = false

                draw()

                return
            }

            if (pauseOffscreen && !visibleRef.current) {
                return
            }

            if (runningRef.current) {
                return
            }

            runningRef.current = true

            rafRef.current = requestAnimationFrame(loop)
        }

        const stop = () => {
            runningRef.current = false

            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)

                rafRef.current = null
            }
        }

        // ==================================================

        // RESIZE OBSERVER

        // ==================================================

        const resizeObserver = new ResizeObserver(resize)

        resizeObserver.observe(wrapper)

        resize()

        // ==================================================

        // VISIBILITY

        // ==================================================

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]

                visibleRef.current = entry.isIntersecting

                if (entry.isIntersecting) {
                    start()
                } else if (pauseOffscreen) {
                    stop()
                }
            },

            {
                rootMargin: "150px",
            }
        )

        intersectionObserver.observe(wrapper)

        // ==================================================

        // REDUCED MOTION

        // ==================================================

        const handleMotionChange = () => {
            prefersReducedMotionRef.current = media.matches

            stop()

            start()
        }

        media.addEventListener?.("change", handleMotionChange)

        start()

        // ==================================================

        // CLEANUP

        // ==================================================

        return () => {
            stop()

            resizeObserver.disconnect()

            intersectionObserver.disconnect()

            media.removeEventListener?.("change", handleMotionChange)

            if (buffer) {
                gl.deleteBuffer(buffer)
            }

            gl.deleteProgram(program)

            drawRef.current = null
        }
    }, [pauseOffscreen, reducedMotion, isStaticRenderer])

    // ==================================================

    // REPAINT CONTROL CHANGES

    // ==================================================

    React.useEffect(() => {
        if (isStaticRenderer) return
        drawRef.current?.()
    }, [
        preset,

        speed,

        primary,

        secondary,

        highlight,

        radius,

        distortion,

        detail,

        rim,

        glow,

        lightX,

        lightY,

        lightZ,

        pointerInfluence,

        quality,

        dprCap,
        isStaticRenderer,
    ])

    return (
        <div
            ref={wrapperRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                display: "grid",
                placeItems: "center",
                overflow: "visible",
                pointerEvents: isStaticRenderer ? "none" : "auto",
            }}
        >
            {isStaticRenderer || !webGLAvailable ? (
                <div
                    aria-hidden="true"
                    style={{
                        width: "68%",
                        aspectRatio: "1 / 1",
                        borderRadius: "50%",
                        transform: `scale(${orbScale})`,
                        background: `radial-gradient(circle at 32% 28%, ${highlight} 0%, ${secondary} 34%, ${primary} 72%, transparent 74%)`,
                        boxShadow: `0 0 90px ${secondary}55`,
                        opacity: 0.94,
                    }}
                />
            ) : (
                <canvas
                    ref={canvasRef}
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: "100%",
                        height: "100%",
                        transform: `translate(-50%, -50%) scale(${orbScale})`,
                        transformOrigin: "center center",
                        pointerEvents: "none",
                        display: "block",
                    }}
                />
            )}
        </div>
    )
}

// HERO

// ======================================================

export default function WebGLOrbHero(props: any) {
    const {
        background,

        contentPadding,

        gap,

        mobileBreakpoint,

        eyebrow,

        headline,

        body,

        eyebrowFont,

        eyebrowSize,

        eyebrowColor,

        headlineFont,

        headlineSize,

        mobileHeadlineSize,

        headlineLineHeight,

        headlineSpacing,

        headlineColor,

        bodyFont,

        bodySize,

        bodyLineHeight,

        bodyColor,

        bodyWidth,

        showCTA,

        ctaLabel,

        ctaLink,

        ctaFont,

        ctaSize,

        ctaBackground,

        ctaColor,

        ctaBorderColor,

        ctaBorderWidth,

        ctaRadius,

        ctaPadX,

        ctaPadY,

        contentRatio,

        orbRatio,

        orbOrderMobile,

        preset,

        speed,

        primary,

        secondary,

        highlight,

        radius,

        distortion,

        detail,

        rim,

        glow,

        lightX,

        lightY,

        lightZ,

        pointerInfluence,

        orbScale,

        quality,

        dprCap,

        pauseOffscreen,

        reducedMotion,

        showPlayground,
        playgroundPosition,

        style,
    } = props

    const rootRef = React.useRef<HTMLDivElement>(null)

    const isStaticRenderer = useIsStaticRenderer()

    const [width, setWidth] = React.useState(1200)
    const [playgroundOpen, setPlaygroundOpen] = React.useState(false)
    const [playgroundPreset, setPlaygroundPreset] = React.useState(preset)
    const [playgroundSpeed, setPlaygroundSpeed] = React.useState(speed)
    const [playgroundDistortion, setPlaygroundDistortion] =
        React.useState(distortion)
    const [playgroundPointer, setPlaygroundPointer] =
        React.useState(pointerInfluence)

    React.useEffect(() => {
        setPlaygroundPreset(preset)
        setPlaygroundSpeed(speed)
        setPlaygroundDistortion(distortion)
        setPlaygroundPointer(pointerInfluence)
    }, [preset, speed, distortion, pointerInfluence, showPlayground])

    React.useLayoutEffect(() => {
        const node = rootRef.current

        if (!node) return

        const measure = () => {
            const nextWidth = node.getBoundingClientRect().width

            if (nextWidth > 0) {
                setWidth(nextWidth)
            }
        }

        measure()

        const observer = new ResizeObserver(measure)

        observer.observe(node)

        return () => {
            observer.disconnect()
        }
    }, [])

    const mobile = width <= mobileBreakpoint

    const livePreset = showPlayground ? playgroundPreset : preset
    const liveSpeed = showPlayground ? playgroundSpeed : speed
    const liveDistortion = showPlayground ? playgroundDistortion : distortion
    const livePointerInfluence = showPlayground
        ? playgroundPointer
        : pointerInfluence

    // ==================================================

    // CONTENT

    // ==================================================

    const content = (
        <div
            style={{
                position: "relative",

                zIndex: 3,

                minWidth: 0,

                display: "flex",

                flexDirection: "column",

                justifyContent: "center",

                alignItems: "flex-start",

                padding: mobile
                    ? `${Math.max(24, contentPadding * 0.6)}px`
                    : `${contentPadding}px`,

                boxSizing: "border-box",
            }}
        >
            {eyebrow && (
                <div
                    style={{
                        ...eyebrowFont,

                        fontSize: `${eyebrowSize}px`,

                        lineHeight: 1.2,

                        color: eyebrowColor,

                        marginBottom: "22px",

                        letterSpacing: "0.06em",

                        textTransform: "uppercase",
                    }}
                >
                    {eyebrow}
                </div>
            )}

            <div
                style={{
                    ...headlineFont,

                    width: "100%",

                    maxWidth: "780px",

                    fontSize: `${mobile ? mobileHeadlineSize : headlineSize}px`,

                    lineHeight: headlineLineHeight,

                    letterSpacing: `${headlineSpacing}em`,

                    color: headlineColor,

                    whiteSpace: "normal",

                    textWrap: "balance",
                }}
            >
                {headline}
            </div>

            {body && (
                <div
                    style={{
                        ...bodyFont,

                        width: "100%",

                        maxWidth: `${bodyWidth}px`,

                        marginTop: "26px",

                        fontSize: `${bodySize}px`,

                        lineHeight: bodyLineHeight,

                        color: bodyColor,
                    }}
                >
                    {body}
                </div>
            )}

            {showCTA && (
                <a
                    href={ctaLink || undefined}
                    style={{
                        ...ctaFont,

                        marginTop: "34px",

                        border: `${ctaBorderWidth}px solid ${ctaBorderColor}`,

                        borderRadius: `${ctaRadius}px`,

                        padding: `${ctaPadY}px ${ctaPadX}px`,

                        background: ctaBackground,

                        color: ctaColor,

                        fontSize: `${ctaSize}px`,

                        lineHeight: 1,

                        cursor: ctaLink ? "pointer" : "default",

                        whiteSpace: "nowrap",

                        appearance: "none",

                        WebkitAppearance: "none",

                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",

                        transition: "transform 450ms cubic-bezier(.11,1,.1,1)",
                    }}
                    onPointerEnter={(event) => {
                        event.currentTarget.style.transform = "scale(1.04)"
                    }}
                    onPointerLeave={(event) => {
                        event.currentTarget.style.transform = "scale(1)"
                    }}
                    onFocus={(event) => {
                        event.currentTarget.style.transform = "scale(1.04)"
                    }}
                    onBlur={(event) => {
                        event.currentTarget.style.transform = "scale(1)"
                    }}
                >
                    {ctaLabel}
                </a>
            )}
        </div>
    )

    // ==================================================

    // ORB

    // ==================================================

    const orb = (
        <div
            style={{
                position: "relative",

                minWidth: 0,

                minHeight: mobile ? "330px" : "100%",

                overflow: "visible",

                zIndex: 2,
            }}
        >
            <WebGLOrb
                preset={livePreset}
                speed={liveSpeed}
                primary={primary}
                secondary={secondary}
                highlight={highlight}
                radius={radius}
                distortion={liveDistortion}
                detail={detail}
                rim={rim}
                glow={glow}
                lightX={lightX}
                lightY={lightY}
                lightZ={lightZ}
                pointerInfluence={livePointerInfluence}
                orbScale={mobile ? orbScale * 0.9 : orbScale}
                quality={quality}
                dprCap={dprCap}
                pauseOffscreen={pauseOffscreen}
                reducedMotion={reducedMotion}
                isStaticRenderer={isStaticRenderer}
            />
        </div>
    )

    return (
        <div
            ref={rootRef}
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 0,
                boxSizing: "border-box",
                overflow: "hidden",
                background,
                display: "grid",
                gridTemplateColumns: mobile
                    ? "1fr"
                    : `${contentRatio}fr ${orbRatio}fr`,
                gridTemplateRows: mobile ? "auto 1fr" : "1fr",
                gap: `${gap}px`,
            }}
        >
            {mobile && orbOrderMobile === "Top" ? (
                <>
                    {orb}
                    {content}
                </>
            ) : (
                <>
                    {content}
                    {orb}
                </>
            )}

            {showPlayground && (
                <div
                    style={{
                        position: "absolute",
                        left:
                            playgroundPosition === "Bottom Left"
                                ? mobile
                                    ? 16
                                    : 22
                                : undefined,
                        right:
                            playgroundPosition === "Bottom Right"
                                ? mobile
                                    ? 16
                                    : 22
                                : undefined,
                        bottom: mobile ? 16 : 22,
                        zIndex: 20,
                        display: "flex",
                        flexDirection: "column",
                        alignItems:
                            playgroundPosition === "Bottom Left"
                                ? "flex-start"
                                : "flex-end",
                        gap: 10,
                        fontFamily: "Inter, system-ui, sans-serif",
                    }}
                >
                    {playgroundOpen && (
                        <div
                            role="group"
                            aria-label="WebGL Orb playground controls"
                            style={{
                                width: mobile ? 248 : 270,
                                padding: 14,
                                borderRadius: 18,
                                background: "rgba(14,14,18,.86)",
                                border: "1px solid rgba(255,255,255,.14)",
                                boxShadow: "0 18px 60px rgba(0,0,0,.34)",
                                backdropFilter: "blur(18px)",
                                WebkitBackdropFilter: "blur(18px)",
                                color: "#fff",
                                boxSizing: "border-box",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    marginBottom: 14,
                                }}
                            >
                                {[
                                    "Liquid Chrome",
                                    "Soft Glass",
                                    "Electric Plasma",
                                ].map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={
                                            playgroundPreset === option
                                        }
                                        onClick={() =>
                                            setPlaygroundPreset(option)
                                        }
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            border: "1px solid rgba(255,255,255,.14)",
                                            borderRadius: 999,
                                            padding: "8px 7px",
                                            background:
                                                playgroundPreset === option
                                                    ? "#fff"
                                                    : "rgba(255,255,255,.06)",
                                            color:
                                                playgroundPreset === option
                                                    ? "#111"
                                                    : "#fff",
                                            fontSize: 10,
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {option === "Liquid Chrome"
                                            ? "Chrome"
                                            : option === "Soft Glass"
                                              ? "Glass"
                                              : "Plasma"}
                                    </button>
                                ))}
                            </div>

                            {[
                                [
                                    "Motion",
                                    playgroundSpeed,
                                    setPlaygroundSpeed,
                                    0,
                                    2,
                                    0.05,
                                ],
                                [
                                    "Distort",
                                    playgroundDistortion,
                                    setPlaygroundDistortion,
                                    0,
                                    1.5,
                                    0.02,
                                ],
                                [
                                    "Pointer",
                                    playgroundPointer,
                                    setPlaygroundPointer,
                                    0,
                                    2,
                                    0.05,
                                ],
                            ].map(
                                ([
                                    label,
                                    value,
                                    setter,
                                    min,
                                    max,
                                    step,
                                ]: any) => (
                                    <label
                                        key={label}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns:
                                                "58px 1fr 34px",
                                            alignItems: "center",
                                            gap: 8,
                                            marginTop: 10,
                                            fontSize: 11,
                                            color: "rgba(255,255,255,.78)",
                                        }}
                                    >
                                        <span>{label}</span>
                                        <input
                                            aria-label={`${label} amount`}
                                            type="range"
                                            min={min}
                                            max={max}
                                            step={step}
                                            value={value}
                                            onChange={(event) =>
                                                setter(
                                                    Number(event.target.value)
                                                )
                                            }
                                            style={{
                                                width: "100%",
                                                accentColor: "#fff",
                                                cursor: "pointer",
                                            }}
                                        />
                                        <span
                                            style={{
                                                textAlign: "right",
                                                fontVariantNumeric:
                                                    "tabular-nums",
                                            }}
                                        >
                                            {Number(value).toFixed(1)}
                                        </span>
                                    </label>
                                )
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setPlaygroundPreset(preset)
                                    setPlaygroundSpeed(speed)
                                    setPlaygroundDistortion(distortion)
                                    setPlaygroundPointer(pointerInfluence)
                                }}
                                style={{
                                    width: "100%",
                                    marginTop: 14,
                                    border: "1px solid rgba(255,255,255,.14)",
                                    borderRadius: 10,
                                    padding: "9px 10px",
                                    background: "rgba(255,255,255,.06)",
                                    color: "rgba(255,255,255,.82)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        aria-expanded={playgroundOpen}
                        aria-label={
                            playgroundOpen
                                ? "Close orb playground"
                                : "Open orb playground"
                        }
                        onClick={() => setPlaygroundOpen((open) => !open)}
                        style={{
                            border: "1px solid rgba(255,255,255,.18)",
                            borderRadius: 999,
                            padding: "10px 14px",
                            background: "rgba(14,14,18,.82)",
                            color: "#fff",
                            boxShadow: "0 10px 30px rgba(0,0,0,.24)",
                            backdropFilter: "blur(16px)",
                            WebkitBackdropFilter: "blur(16px)",
                            fontSize: 11,
                            fontWeight: 650,
                            letterSpacing: ".01em",
                            cursor: "pointer",
                        }}
                    >
                        {playgroundOpen ? "Close controls" : "Play with orb"}
                    </button>
                </div>
            )}
        </div>
    )
}

// DEFAULTS

// ======================================================

export const defaultProps = {
    background: "#0B0B0D",

    contentPadding: 70,

    gap: 20,

    mobileBreakpoint: 700,

    contentRatio: 1,

    orbRatio: 1,

    orbOrderMobile: "Bottom",

    eyebrow: "BODILUM / DIGITAL EXPERIENCE",

    headline: "Digital worlds that feel alive.",

    body: "Interactive experiences built with motion, depth and technology without sacrificing clarity or performance.",

    eyebrowSize: 12,

    eyebrowColor: "#9B9B9F",

    headlineSize: 82,

    mobileHeadlineSize: 50,

    headlineLineHeight: 0.9,

    headlineSpacing: -0.055,

    headlineColor: "#FFFFFF",

    bodySize: 17,

    bodyLineHeight: 1.45,

    bodyColor: "#A8A8AC",

    bodyWidth: 520,

    showCTA: true,

    ctaLabel: "Explore Work",

    ctaLink: "#",

    ctaSize: 15,

    ctaBackground: "#FFFFFF",

    ctaColor: "#111111",

    ctaBorderColor: "#FFFFFF",

    ctaBorderWidth: 1,

    ctaRadius: 999,

    ctaPadX: 24,

    ctaPadY: 14,

    preset: "Liquid Chrome",

    speed: 0.55,

    primary: "#16161A",

    secondary: "#7857FF",

    highlight: "#F3EEFF",

    radius: 0.34,

    distortion: 0.52,

    detail: 3.2,

    rim: 1.25,

    glow: 0.7,

    lightX: -0.4,

    lightY: -0.45,

    lightZ: 1,

    pointerInfluence: 0.6,

    orbScale: 1,

    quality: 1,

    dprCap: 1.6,

    pauseOffscreen: true,

    reducedMotion: true,

    showPlayground: false,
    playgroundPosition: "Bottom Left",
}

// ======================================================

// CONTROLS

// ======================================================

WebGLOrbHero.defaultProps = defaultProps

// Export the exact Framer control schema so WebX Component Lab

// can render nested arrays, objects, enums, hidden states, and defaults.

export const propertyControls = {
    eyebrow: {
        type: ControlType.String,

        title: "Eyebrow",

        defaultValue: "BODILUM / DIGITAL EXPERIENCE",
    },

    headline: {
        type: ControlType.String,

        title: "Headline",

        displayTextArea: true,

        defaultValue: "Digital worlds that feel alive.",
    },

    body: {
        type: ControlType.String,

        title: "Body",

        displayTextArea: true,

        defaultValue:
            "Interactive experiences built with motion, depth and technology without sacrificing clarity or performance.",
    },

    background: {
        type: ControlType.Color,

        title: "Background",

        defaultValue: "#0B0B0D",
    },

    contentPadding: {
        type: ControlType.Number,

        title: "Content Pad",

        defaultValue: 70,

        min: 0,

        max: 160,

        step: 2,

        unit: "px",
    },

    gap: {
        type: ControlType.Number,

        title: "Hero Gap",

        defaultValue: 20,

        min: 0,

        max: 100,

        step: 2,

        unit: "px",
    },

    contentRatio: {
        type: ControlType.Number,

        title: "Content Ratio",

        defaultValue: 1,

        min: 0.4,

        max: 2,

        step: 0.05,
    },

    orbRatio: {
        type: ControlType.Number,

        title: "Orb Ratio",

        defaultValue: 1,

        min: 0.4,

        max: 2,

        step: 0.05,
    },

    mobileBreakpoint: {
        type: ControlType.Number,

        title: "Mobile BP",

        defaultValue: 700,

        min: 400,

        max: 1000,

        step: 10,

        unit: "px",
    },

    orbOrderMobile: {
        type: ControlType.Enum,

        title: "Mobile Orb",

        options: ["Top", "Bottom"],

        defaultValue: "Bottom",
    },

    eyebrowFont: {
        type: ControlType.Font,

        title: "Eyebrow Font",

        controls: "extended",
    },

    eyebrowSize: {
        type: ControlType.Number,

        title: "Eyebrow Size",

        defaultValue: 12,

        min: 8,

        max: 30,

        step: 1,

        unit: "px",
    },

    eyebrowColor: {
        type: ControlType.Color,

        title: "Eyebrow Color",

        defaultValue: "#9B9B9F",
    },

    headlineFont: {
        type: ControlType.Font,

        title: "Headline Font",

        controls: "extended",
    },

    headlineSize: {
        type: ControlType.Number,

        title: "Headline Size",

        defaultValue: 82,

        min: 30,

        max: 180,

        step: 1,

        unit: "px",
    },

    mobileHeadlineSize: {
        type: ControlType.Number,

        title: "Mobile Headline",

        defaultValue: 50,

        min: 24,

        max: 100,

        step: 1,

        unit: "px",
    },

    headlineLineHeight: {
        type: ControlType.Number,

        title: "Headline Line",

        defaultValue: 0.9,

        min: 0.7,

        max: 1.5,

        step: 0.01,
    },

    headlineSpacing: {
        type: ControlType.Number,

        title: "Headline Spacing",

        defaultValue: -0.055,

        min: -0.15,

        max: 0.1,

        step: 0.005,

        unit: "em",
    },

    headlineColor: {
        type: ControlType.Color,

        title: "Headline Color",

        defaultValue: "#FFFFFF",
    },

    bodyFont: {
        type: ControlType.Font,

        title: "Body Font",

        controls: "extended",
    },

    bodySize: {
        type: ControlType.Number,

        title: "Body Size",

        defaultValue: 17,

        min: 10,

        max: 40,

        step: 1,

        unit: "px",
    },

    bodyLineHeight: {
        type: ControlType.Number,

        title: "Body Line",

        defaultValue: 1.45,

        min: 0.9,

        max: 2.2,

        step: 0.02,
    },

    bodyColor: {
        type: ControlType.Color,

        title: "Body Color",

        defaultValue: "#A8A8AC",
    },

    bodyWidth: {
        type: ControlType.Number,

        title: "Body Width",

        defaultValue: 520,

        min: 180,

        max: 900,

        step: 10,

        unit: "px",
    },

    showCTA: {
        type: ControlType.Boolean,

        title: "CTA",

        defaultValue: true,
    },

    ctaLabel: {
        type: ControlType.String,

        title: "CTA Label",

        defaultValue: "Explore Work",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaLink: {
        type: ControlType.Link,

        title: "CTA Link",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaFont: {
        type: ControlType.Font,

        title: "CTA Font",

        controls: "extended",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaSize: {
        type: ControlType.Number,

        title: "CTA Size",

        defaultValue: 15,

        min: 10,

        max: 32,

        step: 1,

        unit: "px",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaBackground: {
        type: ControlType.Color,

        title: "CTA BG",

        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaColor: {
        type: ControlType.Color,

        title: "CTA Text",

        defaultValue: "#111111",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaBorderColor: {
        type: ControlType.Color,

        title: "CTA Border",

        defaultValue: "#FFFFFF",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaBorderWidth: {
        type: ControlType.Number,

        title: "CTA Border W",

        defaultValue: 1,

        min: 0,

        max: 8,

        step: 1,

        unit: "px",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaRadius: {
        type: ControlType.Number,

        title: "CTA Radius",

        defaultValue: 999,

        min: 0,

        max: 999,

        step: 1,

        unit: "px",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaPadX: {
        type: ControlType.Number,

        title: "CTA Pad X",

        defaultValue: 24,

        min: 8,

        max: 60,

        step: 1,

        unit: "px",

        hidden(props) {
            return !props.showCTA
        },
    },

    ctaPadY: {
        type: ControlType.Number,

        title: "CTA Pad Y",

        defaultValue: 14,

        min: 6,

        max: 40,

        step: 1,

        unit: "px",

        hidden(props) {
            return !props.showCTA
        },
    },

    preset: {
        type: ControlType.Enum,

        title: "Orb Style",

        options: ["Liquid Chrome", "Soft Glass", "Electric Plasma"],

        defaultValue: "Liquid Chrome",
    },

    primary: {
        type: ControlType.Color,

        title: "Primary",

        defaultValue: "#16161A",
    },

    secondary: {
        type: ControlType.Color,

        title: "Secondary",

        defaultValue: "#7857FF",
    },

    highlight: {
        type: ControlType.Color,

        title: "Highlight",

        defaultValue: "#F3EEFF",
    },

    speed: {
        type: ControlType.Number,

        title: "Speed",

        defaultValue: 0.55,

        min: 0,

        max: 3,

        step: 0.05,
    },

    radius: {
        type: ControlType.Number,

        title: "Orb Radius",

        defaultValue: 0.34,

        min: 0.15,

        max: 0.48,

        step: 0.005,
    },

    orbScale: {
        type: ControlType.Number,

        title: "Orb Scale",

        defaultValue: 1,

        min: 0.4,

        max: 1.8,

        step: 0.02,
    },

    distortion: {
        type: ControlType.Number,

        title: "Distortion",

        defaultValue: 0.52,

        min: 0,

        max: 1.5,

        step: 0.02,
    },

    detail: {
        type: ControlType.Number,

        title: "Detail",

        defaultValue: 3.2,

        min: 0.5,

        max: 8,

        step: 0.1,
    },

    pointerInfluence: {
        type: ControlType.Number,

        title: "Pointer",

        defaultValue: 0.6,

        min: 0,

        max: 2,

        step: 0.05,
    },

    rim: {
        type: ControlType.Number,

        title: "Rim",

        defaultValue: 1.25,

        min: 0,

        max: 3,

        step: 0.05,
    },

    glow: {
        type: ControlType.Number,

        title: "Glow",

        defaultValue: 0.7,

        min: 0,

        max: 3,

        step: 0.05,
    },

    lightX: {
        type: ControlType.Number,

        title: "Light X",

        defaultValue: -0.4,

        min: -2,

        max: 2,

        step: 0.05,
    },

    lightY: {
        type: ControlType.Number,

        title: "Light Y",

        defaultValue: -0.45,

        min: -2,

        max: 2,

        step: 0.05,
    },

    lightZ: {
        type: ControlType.Number,

        title: "Light Z",

        defaultValue: 1,

        min: 0.1,

        max: 3,

        step: 0.05,
    },

    quality: {
        type: ControlType.Number,

        title: "Quality",

        defaultValue: 1,

        min: 0.4,

        max: 1,

        step: 0.05,
    },

    dprCap: {
        type: ControlType.Number,

        title: "DPR Cap",

        defaultValue: 1.6,

        min: 1,

        max: 2,

        step: 0.1,
    },

    showPlayground: {
        type: ControlType.Boolean,
        title: "Playground",
        defaultValue: false,
    },

    playgroundPosition: {
        type: ControlType.Enum,
        title: "Playground Pos",
        options: ["Bottom Left", "Bottom Right"],
        optionTitles: ["Bottom Left", "Bottom Right"],
        defaultValue: "Bottom Left",
        hidden(props) {
            return !props.showPlayground
        },
    },

    pauseOffscreen: {
        type: ControlType.Boolean,

        title: "Pause Offscreen",

        defaultValue: true,
    },

    reducedMotion: {
        type: ControlType.Boolean,

        title: "Reduce Motion",

        defaultValue: true,
    },
}

addPropertyControls(WebGLOrbHero, propertyControls)
