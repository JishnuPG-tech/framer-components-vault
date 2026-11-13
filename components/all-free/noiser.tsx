// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useId, useMemo, useRef } from "react"
import { useInView } from "framer-motion"

type NoiseType = "pixel" | "gaussian" | "uniform"
type ColorMode = "mono" | "duo" | "multi"

interface NoiserProps {
    noiseType: NoiseType
    grainSize: number
    baseFrequency: number
    numOctaves: number
    isAnimated: boolean
    animationSpeed: number
    colorMode: ColorMode
    monoColor: string
    duoColor1: string
    duoColor2: string
    hardDuo: boolean
    duoThreshold: number
}

interface RendererProps extends NoiserProps {
    isStatic: boolean
}

const rootStyle = {
    width: "100%",
    height: "100%",
    position: "relative" as const,
    overflow: "hidden",
    pointerEvents: "none" as const,
    background: "transparent",
}

function PixelNoise(props: RendererProps) {
    const {
        grainSize,
        isAnimated,
        animationSpeed,
        colorMode,
        monoColor,
        duoColor1,
        duoColor2,
        hardDuo,
        duoThreshold,
        isStatic,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const glRef = useRef<WebGLRenderingContext | null>(null)
    const programRef = useRef<WebGLProgram | null>(null)
    const bufferRef = useRef<WebGLBuffer | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef(0)
    const startTimeRef = useRef(0)
    const inView = useInView(containerRef, { margin: "200px" })

    const colors = useMemo(() => {
        const mono = Color(monoColor)
        const duo1 = Color(duoColor1)
        const duo2 = Color(duoColor2)
        return {
            mono: [mono.r / 255, mono.g / 255, mono.b / 255, mono.a],
            duo1: [duo1.r / 255, duo1.g / 255, duo1.b / 255, duo1.a],
            duo2: [duo2.r / 255, duo2.g / 255, duo2.b / 255, duo2.a],
        }
    }, [monoColor, duoColor1, duoColor2])

    const vertexSource = useMemo(
        () => `attribute vec2 aPosition;
varying vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`,
        []
    )

    const fragmentSource = useMemo(
        () => `precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uSeed;
uniform float uPixelSize;
uniform int uColorMode;
uniform vec4 uMono;
uniform vec4 uDuo1;
uniform vec4 uDuo2;
uniform int uHardDuo;
uniform float uDuoThreshold;

float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

void main() {
    float cellSize = max(1.0, floor(uPixelSize));
    vec2 cell = floor(vUv * uResolution / cellSize);
    float n = hash(vec3(cell, uSeed));
    vec4 color;

    if (uColorMode == 2) {
        float green = hash(vec3(cell, uSeed + 13.1));
        float blue = hash(vec3(cell, uSeed - 7.7));
        color = vec4(n, green, blue, 1.0);
    } else if (uColorMode == 1) {
        color = uHardDuo == 1
            ? (n < uDuoThreshold ? uDuo1 : uDuo2)
            : mix(uDuo1, uDuo2, n);
    } else {
        color = vec4(uMono.rgb, uMono.a * n);
    }

    gl_FragColor = color;
}`,
        []
    )

    const compileShader = useCallback(
        (gl: WebGLRenderingContext, type: number, source: string) => {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader)
                return null
            }
            return shader
        },
        []
    )

    const resizeCanvas = useCallback(() => {
        if (typeof window === "undefined") return
        const container = containerRef.current
        const canvas = canvasRef.current
        const gl = glRef.current
        if (!container || !canvas || !gl) return

        const rect = container.getBoundingClientRect()
        const dpr = Math.min(2, window.devicePixelRatio || 1)
        const width = Math.max(1, Math.round(rect.width * dpr))
        const height = Math.max(1, Math.round(rect.height * dpr))

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width
            canvas.height = height
            gl.viewport(0, 0, width, height)
        }
    }, [])

    const draw = useCallback(
        (seed: number) => {
            const gl = glRef.current
            const program = programRef.current
            const canvas = canvasRef.current
            if (!gl || !program || !canvas) return

            resizeCanvas()
            gl.useProgram(program)
            gl.uniform2f(
                gl.getUniformLocation(program, "uResolution"),
                canvas.width,
                canvas.height
            )
            gl.uniform1f(gl.getUniformLocation(program, "uSeed"), seed)
            gl.uniform1f(
                gl.getUniformLocation(program, "uPixelSize"),
                Math.max(1, grainSize)
            )
            gl.uniform1i(
                gl.getUniformLocation(program, "uColorMode"),
                colorMode === "mono" ? 0 : colorMode === "duo" ? 1 : 2
            )
            gl.uniform4fv(gl.getUniformLocation(program, "uMono"), colors.mono)
            gl.uniform4fv(gl.getUniformLocation(program, "uDuo1"), colors.duo1)
            gl.uniform4fv(gl.getUniformLocation(program, "uDuo2"), colors.duo2)
            gl.uniform1i(
                gl.getUniformLocation(program, "uHardDuo"),
                hardDuo ? 1 : 0
            )
            gl.uniform1f(
                gl.getUniformLocation(program, "uDuoThreshold"),
                Math.max(0, Math.min(1, duoThreshold))
            )
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        },
        [colorMode, colors, duoThreshold, grainSize, hardDuo, resizeCanvas]
    )

    useEffect(() => {
        if (typeof window === "undefined") return
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
        })
        if (!gl) return

        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
        const fragmentShader = compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentSource
        )
        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()
        const buffer = gl.createBuffer()
        if (!program || !buffer) return

        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            return
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
            gl.STATIC_DRAW
        )
        const position = gl.getAttribLocation(program, "aPosition")
        gl.enableVertexAttribArray(position)
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        glRef.current = gl
        programRef.current = program
        bufferRef.current = buffer

        const observer = new ResizeObserver(() => draw(0))
        observer.observe(container)
        draw(0)

        return () => {
            observer.disconnect()
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
            gl.deleteBuffer(buffer)
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            bufferRef.current = null
            programRef.current = null
            glRef.current = null
        }
    }, [compileShader, draw, fragmentSource, vertexSource])

    useEffect(() => {
        draw(0)
    }, [draw])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!isAnimated || isStatic || !inView) return

        const fps = Math.max(1, Math.min(60, animationSpeed))
        const interval = 1000 / fps
        startTimeRef.current = 0
        lastFrameRef.current = 0

        const renderFrame = (time: number) => {
            if (startTimeRef.current === 0) startTimeRef.current = time
            if (time - lastFrameRef.current >= interval) {
                const elapsed = time - startTimeRef.current
                draw(Math.floor(elapsed / interval) + 1)
                lastFrameRef.current = time
            }
            rafRef.current = requestAnimationFrame(renderFrame)
        }

        rafRef.current = requestAnimationFrame(renderFrame)
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [animationSpeed, draw, inView, isAnimated, isStatic])

    return (
        <div ref={containerRef} style={rootStyle}>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    display: "block",
                }}
            />
        </div>
    )
}

function SvgNoise(props: RendererProps) {
    const {
        noiseType,
        grainSize,
        baseFrequency,
        numOctaves,
        isAnimated,
        animationSpeed,
        colorMode,
        monoColor,
        duoColor1,
        duoColor2,
        hardDuo,
        duoThreshold,
        isStatic,
    } = props

    const containerRef = useRef<HTMLDivElement | null>(null)
    const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const lastFrameRef = useRef(0)
    const seedRef = useRef(0)
    const inView = useInView(containerRef, { margin: "200px" })
    const reactId = useId()
    const filterId = useMemo(
        () => `noiser-${reactId.replace(/:/g, "")}`,
        [reactId]
    )

    const mono = Color(monoColor)
    const duo1 = Color(duoColor1)
    const duo2 = Color(duoColor2)
    const safeFrequency = Math.max(
        0.0001,
        baseFrequency / Math.max(0.1, grainSize)
    )
    const thresholdSlope = 100
    const thresholdIntercept =
        0.5 - thresholdSlope * Math.max(0, Math.min(1, duoThreshold))

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!isAnimated || isStatic || !inView) return

        const fps = Math.max(1, Math.min(60, animationSpeed))
        const interval = 1000 / fps
        lastFrameRef.current = 0

        const renderFrame = (time: number) => {
            if (time - lastFrameRef.current >= interval) {
                seedRef.current += 1
                turbulenceRef.current?.setAttribute(
                    "seed",
                    String(seedRef.current)
                )
                lastFrameRef.current = time
            }
            rafRef.current = requestAnimationFrame(renderFrame)
        }

        rafRef.current = requestAnimationFrame(renderFrame)
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [animationSpeed, inView, isAnimated, isStatic])

    return (
        <div ref={containerRef} style={rootStyle}>
            <svg
                width="0"
                height="0"
                aria-hidden="true"
                style={{ position: "absolute", pointerEvents: "none" }}
            >
                <filter id={filterId} x="0" y="0" width="100%" height="100%">
                    <feTurbulence
                        ref={turbulenceRef}
                        type={
                            noiseType === "gaussian"
                                ? "fractalNoise"
                                : "turbulence"
                        }
                        baseFrequency={safeFrequency}
                        numOctaves={Math.max(
                            1,
                            Math.min(5, Math.round(numOctaves))
                        )}
                        seed={0}
                        stitchTiles="stitch"
                        result="noise"
                    />
                    {colorMode === "multi" ? (
                        <feColorMatrix
                            in="noise"
                            type="matrix"
                            values={`1 0 0 0 0
                                     0 1 0 0 0
                                     0 0 1 0 0
                                     0 0 0 0 1`}
                        />
                    ) : (
                        <>
                            <feColorMatrix
                                in="noise"
                                type="matrix"
                                values="1 0 0 0 0
                                        1 0 0 0 0
                                        1 0 0 0 0
                                        0 0 0 1 0"
                                result="grayNoise"
                            />
                            {colorMode === "mono" ? (
                                <feColorMatrix
                                    in="grayNoise"
                                    type="matrix"
                                    values={`0 0 0 0 ${mono.r / 255}
                                             0 0 0 0 ${mono.g / 255}
                                             0 0 0 0 ${mono.b / 255}
                                             1 0 0 0 0`}
                                />
                            ) : (
                                <>
                                    {hardDuo && (
                                        <feComponentTransfer
                                            in="grayNoise"
                                            result="duoNoise"
                                        >
                                            <feFuncR
                                                type="linear"
                                                slope={thresholdSlope}
                                                intercept={thresholdIntercept}
                                            />
                                            <feFuncG
                                                type="linear"
                                                slope={thresholdSlope}
                                                intercept={thresholdIntercept}
                                            />
                                            <feFuncB
                                                type="linear"
                                                slope={thresholdSlope}
                                                intercept={thresholdIntercept}
                                            />
                                        </feComponentTransfer>
                                    )}
                                    <feComponentTransfer
                                        in={hardDuo ? "duoNoise" : "grayNoise"}
                                    >
                                        <feFuncR
                                            type="table"
                                            tableValues={`${duo1.r / 255} ${duo2.r / 255}`}
                                        />
                                        <feFuncG
                                            type="table"
                                            tableValues={`${duo1.g / 255} ${duo2.g / 255}`}
                                        />
                                        <feFuncB
                                            type="table"
                                            tableValues={`${duo1.b / 255} ${duo2.b / 255}`}
                                        />
                                        <feFuncA
                                            type="table"
                                            tableValues={`${duo1.a} ${duo2.a}`}
                                        />
                                    </feComponentTransfer>
                                </>
                            )}
                        </>
                    )}
                </filter>
            </svg>
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    filter: `url(#${filterId})`,
                    background: "white",
                }}
            />
        </div>
    )
}

/**
 * Noiser
 *
 * Hybrid noise renderer: WebGL pixel noise and SVG Gaussian/Uniform noise.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerDisableUnlink
 */
export default function Noiser(props: NoiserProps) {
    const {
        noiseType = "pixel",
        grainSize = 1,
        baseFrequency = 0.65,
        numOctaves = 3,
        isAnimated = false,
        animationSpeed = 24,
        colorMode = "mono",
        monoColor = "#000000",
        duoColor1 = "#000000",
        duoColor2 = "#FFFFFF",
        hardDuo = false,
        duoThreshold = 0.5,
    } = props

    const rendererProps = {
        noiseType,
        grainSize,
        baseFrequency,
        numOctaves,
        isAnimated,
        animationSpeed,
        colorMode,
        monoColor,
        duoColor1,
        duoColor2,
        hardDuo,
        duoThreshold,
        isStatic: useIsStaticRenderer(),
    }

    return (
        <div
            style={{
                ...rootStyle,
            }}
        >
            {noiseType === "pixel" ? (
                <PixelNoise {...rendererProps} />
            ) : (
                <SvgNoise {...rendererProps} />
            )}
        </div>
    )
}

addPropertyControls(Noiser, {
    noiseType: {
        type: ControlType.Enum,
        title: "Type",
        options: ["pixel", "gaussian", "uniform"],
        optionTitles: ["Pixel", "Gaussian", "Uniform"],
        defaultValue: "pixel",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    colorMode: {
        type: ControlType.Enum,
        title: "Color Mode",
        options: ["mono", "duo", "multi"],
        optionTitles: ["Mono", "Duo", "Multi"],
        defaultValue: "mono",
        displaySegmentedControl: true,
        segmentedControlDirection: "vertical",
    },
    monoColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#000000",
        hidden: (props) => props.colorMode !== "mono",
    },
    duoColor1: {
        type: ControlType.Color,
        title: "Color 1",
        defaultValue: "#000000",
        hidden: (props) => props.colorMode !== "duo",
    },
    duoColor2: {
        type: ControlType.Color,
        title: "Color 2",
        defaultValue: "#FFFFFF",
        hidden: (props) => props.colorMode !== "duo",
    },
    hardDuo: {
        type: ControlType.Boolean,
        title: "Hard Duo",
        defaultValue: false,
        hidden: (props) => props.colorMode !== "duo",
    },
    duoThreshold: {
        type: ControlType.Number,
        title: "Threshold",
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: 0.5,
        hidden: (props) => props.colorMode !== "duo" || !props.hardDuo,
    },
    grainSize: {
        type: ControlType.Number,
        title: "Noise Size",
        min: 0.1,
        max: 100,
        step: 0.1,
        defaultValue: 1,
    },
    baseFrequency: {
        type: ControlType.Number,
        title: "Density",
        min: 0.1,
        max: 2,
        step: 0.1,
        defaultValue: 0.65,
        hidden: (props) => props.noiseType === "pixel",
    },
    numOctaves: {
        type: ControlType.Number,
        title: "Roughness",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 3,
        displayStepper: true,
        hidden: (props) => props.noiseType === "pixel",
    },
    isAnimated: {
        type: ControlType.Boolean,
        title: "Animate",
        defaultValue: false,
    },
    animationSpeed: {
        type: ControlType.Number,
        title: "Speed (FPS)",
        min: 1,
        max: 60,
        step: 1,
        defaultValue: 24,
        description: "\nMade by *[arkuš.design](https://framer.link/S5pisEA)*",
        hidden: (props) => !props.isAnimated,
    },
})
