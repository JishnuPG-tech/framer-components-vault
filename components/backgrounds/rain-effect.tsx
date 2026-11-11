import { useEffect, useRef, useState, startTransition } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


interface RainEffectProps {
    rainColor: string
    splashColor: string
    backgroundColor: string
    rainIntensity: number
    rainSpeed: number
    splashSize: number
    enableLighting: boolean
    lightColor: string
    lightIntensity: number
    lightRadius: number
    enableLightning: boolean
    lightningColor: string
    lightningFrequency: number
}

/**
 * @framerIntrinsicWidth 500
 * @framerIntrinsicHeight 500
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function RainEffect(props: RainEffectProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isStatic = useIsStaticRenderer()
    const [isInView, setIsInView] = useState(false)

    const isInViewRef = useRef(false)
    const propsRef = useRef(props)

    useEffect(() => {
        propsRef.current = props
    }, [props])

    const targetMouse = useRef({ x: 0, y: 0 })
    const currentMouse = useRef({ x: 0, y: 0 })
    const lightningState = useRef({
        active: false,
        intensity: 0,
        timer: 0,
        delayTimer: Math.random() * 3000 + 2000,
    })

    useEffect(() => {
        if (typeof window === "undefined" || isStatic) return

        const handleMouseMove = (e: MouseEvent) => {
            targetMouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
            targetMouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [isStatic])

    useEffect(() => {
        if (isStatic || !canvasRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                isInViewRef.current = entry.isIntersecting
            },
            { threshold: 0 }
        )

        observer.observe(canvasRef.current)
        return () => observer.disconnect()
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return

        const canvas = canvasRef.current
        if (!canvas) return

        const gl = canvas.getContext("webgl", {
            alpha: true,
            antialias: false,
            preserveDrawingBuffer: false,
        })
        if (!gl) return

        let animationId: number

        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_life;
            attribute float a_type;
            attribute vec2 a_velocity;
            attribute float a_depth;
            
            uniform vec2 u_mouse; 
            
            varying float v_life;
            varying float v_type;
            varying vec2 v_velocity;
            varying float v_depth;
            varying vec2 v_worldPos;
            
            void main() {
                float parallaxStrength = (1.5 - a_depth) * 0.15;
                vec2 parallaxPos = a_position + (u_mouse * parallaxStrength);
                
                gl_Position = vec4(parallaxPos, 0.0, 1.0);
                
                if (a_type > 0.5) {
                    gl_PointSize = 3.0 * a_depth + 1.0; 
                } else {
                    gl_PointSize = 25.0 * a_depth + 10.0;  
                }
                
                v_life = a_life;
                v_type = a_type;
                v_velocity = a_velocity;
                v_depth = a_depth;
                v_worldPos = parallaxPos;
            }
        `

        const fragmentShaderSource = `
            precision mediump float;
            uniform vec3 u_rainColor;
            uniform vec3 u_splashColor;
            uniform bool u_enableLighting;
            uniform vec3 u_lightColor;
            uniform float u_lightIntensity;
            uniform float u_lightRadius;
            uniform vec2 u_lightPos;
            uniform float u_lightningIntensity;
            uniform vec3 u_lightningColor;
            
            varying float v_life;
            varying float v_type;
            varying vec2 v_velocity;
            varying float v_depth;
            varying vec2 v_worldPos;
            
            void main() {
                float lightDist = distance(v_worldPos, u_lightPos);
                float lightFalloff = 1.0 / (1.0 + (lightDist * lightDist) / (u_lightRadius * u_lightRadius));
                float lightEffect = lightFalloff * u_lightIntensity;
                
                float flashEffect = u_lightningIntensity * 0.8;
                
                if (v_type < 0.5) {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    
                    float speed = length(v_velocity);
                    float dropLength = speed * 60.0; 
                    
                    float angle = atan(v_velocity.y, v_velocity.x) - 1.5708;
                    float c = cos(angle);
                    float s = sin(angle);
                    vec2 rotated = vec2(
                        coord.x * c - coord.y * s,
                        coord.x * s + coord.y * c
                    );
                    
                    float taper = smoothstep(0.4, -0.4, rotated.y);
                    float thickness = 25.0 + (1.0 - v_depth) * 15.0;
                    
                    float distX = rotated.x * thickness / (taper + 0.15); 
                    float distY = (rotated.y + 0.15) / dropLength;
                    float dist = length(vec2(distX, distY));
                    
                    float alpha = smoothstep(1.0, 0.1, dist);
                    
                    float tailGradient = smoothstep(-0.4, 0.4, rotated.y);
                    alpha *= (1.0 - tailGradient * 0.9);
                    
                    float glowDist = length(vec2(rotated.x * thickness * 0.8, (rotated.y + 0.2) / (dropLength * 0.4)));
                    float glow = exp(-glowDist * 6.0) * 0.8;
                    alpha = max(alpha, glow);
                    
                    alpha *= (0.15 + 0.85 * v_depth);
                    
                    vec3 highlightColor = clamp(u_rainColor * 1.5 + vec3(0.1, 0.2, 0.25), 0.0, 1.0);
                    vec3 finalColor = mix(u_rainColor, highlightColor, glow * 1.2);
                    
                    if (u_enableLighting) {
                        finalColor *= (1.0 + u_lightColor * lightEffect * 1.5);
                        alpha *= (1.0 + lightEffect * 0.5);
                    }
                    
                    finalColor += u_lightningColor * flashEffect * 0.6;
                    alpha *= (1.0 + flashEffect * 0.3);
                    
                    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), alpha);
                } else {
                    vec2 coord = gl_PointCoord - vec2(0.5);
                    float dist = length(coord);
                    
                    float alpha = max(0.0, (1.0 - dist * 2.0)) * v_life * 1.5;
                    alpha *= (0.3 + 0.7 * v_depth); 
                    
                    vec3 highlightColor = clamp(u_splashColor * 1.2 + vec3(0.1, 0.2, 0.25), 0.0, 1.0);
                    vec3 finalColor = mix(u_splashColor, highlightColor, (1.0 - dist) * v_life);

                    if (u_enableLighting) {
                        finalColor *= (1.0 + u_lightColor * lightEffect * 2.0);
                        alpha *= (1.0 + lightEffect * 0.8);
                    }

                    finalColor += u_lightningColor * flashEffect * 0.8;
                    alpha *= (1.0 + flashEffect * 0.5);

                    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), alpha);
                }
            }
        `

        function createShader(
            gl: WebGLRenderingContext,
            type: number,
            source: string
        ) {
            const shader = gl.createShader(type)
            if (!shader) return null
            gl.shaderSource(shader, source)
            gl.compileShader(shader)
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                gl.deleteShader(shader)
                return null
            }
            return shader
        }

        const vertexShader = createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexShaderSource
        )
        const fragmentShader = createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        )
        if (!vertexShader || !fragmentShader) return

        const program = gl.createProgram()
        if (!program) return
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

        gl.useProgram(program)

        const positionLocation = gl.getAttribLocation(program, "a_position")
        const lifeLocation = gl.getAttribLocation(program, "a_life")
        const typeLocation = gl.getAttribLocation(program, "a_type")
        const velocityLocation = gl.getAttribLocation(program, "a_velocity")
        const depthLocation = gl.getAttribLocation(program, "a_depth")

        const rainColorLocation = gl.getUniformLocation(program, "u_rainColor")
        const splashColorLocation = gl.getUniformLocation(
            program,
            "u_splashColor"
        )
        const mouseLocation = gl.getUniformLocation(program, "u_mouse")
        const enableLightingLocation = gl.getUniformLocation(
            program,
            "u_enableLighting"
        )
        const lightColorLocation = gl.getUniformLocation(
            program,
            "u_lightColor"
        )
        const lightIntensityLocation = gl.getUniformLocation(
            program,
            "u_lightIntensity"
        )
        const lightRadiusLocation = gl.getUniformLocation(
            program,
            "u_lightRadius"
        )
        const lightPosLocation = gl.getUniformLocation(program, "u_lightPos")
        const lightningIntensityLocation = gl.getUniformLocation(
            program,
            "u_lightningIntensity"
        )
        const lightningColorLocation = gl.getUniformLocation(
            program,
            "u_lightningColor"
        )

        const rainCount = Math.floor(props.rainIntensity * 5)
        const splashPoolCount = rainCount
        const maxParticles = rainCount + splashPoolCount

        const positions = new Float32Array(maxParticles * 2)
        const velocities = new Float32Array(maxParticles * 2)
        const lives = new Float32Array(maxParticles)
        const types = new Float32Array(maxParticles)
        const depths = new Float32Array(maxParticles)

        function parseColorToRgba(
            colorStr: string
        ): [number, number, number, number] {
            if (colorStr === "transparent") return [0, 0, 0, 0]
            if (colorStr.startsWith("rgba")) {
                const parts = colorStr.match(/[\d.]+/g)
                if (parts && parts.length >= 4) {
                    return [
                        parseFloat(parts[0]) / 255,
                        parseFloat(parts[1]) / 255,
                        parseFloat(parts[2]) / 255,
                        parseFloat(parts[3]),
                    ]
                }
            }
            if (colorStr.startsWith("rgb")) {
                const parts = colorStr.match(/[\d.]+/g)
                if (parts && parts.length >= 3) {
                    return [
                        parseFloat(parts[0]) / 255,
                        parseFloat(parts[1]) / 255,
                        parseFloat(parts[2]) / 255,
                        1,
                    ]
                }
            }
            const hex = colorStr.replace("#", "")
            if (hex.length === 3 || hex.length === 4) {
                return [
                    parseInt(hex[0] + hex[0], 16) / 255,
                    parseInt(hex[1] + hex[1], 16) / 255,
                    parseInt(hex[2] + hex[2], 16) / 255,
                    hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1,
                ]
            }
            if (hex.length >= 6) {
                return [
                    parseInt(hex.substring(0, 2), 16) / 255,
                    parseInt(hex.substring(2, 4), 16) / 255,
                    parseInt(hex.substring(4, 6), 16) / 255,
                    hex.length === 8
                        ? parseInt(hex.substring(6, 8), 16) / 255
                        : 1,
                ]
            }
            return [0, 0, 0, 1]
        }

        for (let i = 0; i < maxParticles; i++) {
            if (i < rainCount) {
                depths[i] = Math.random()
                positions[i * 2] = Math.random() * 2 - 1
                positions[i * 2 + 1] = 1 + Math.random() * 2
                velocities[i * 2] = (Math.random() - 0.5) * 0.002
                velocities[i * 2 + 1] =
                    -(0.01 + depths[i] * 0.02) * props.rainSpeed -
                    Math.random() * 0.005
                lives[i] = 1
                types[i] = 0
            } else {
                depths[i] = 0
                positions[i * 2] = -2
                positions[i * 2 + 1] = -2
                velocities[i * 2] = 0
                velocities[i * 2 + 1] = 0
                lives[i] = 0
                types[i] = 1
            }
        }

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.enableVertexAttribArray(positionLocation)
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

        const velocityBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer)
        gl.enableVertexAttribArray(velocityLocation)
        gl.vertexAttribPointer(velocityLocation, 2, gl.FLOAT, false, 0, 0)

        const lifeBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer)
        gl.enableVertexAttribArray(lifeLocation)
        gl.vertexAttribPointer(lifeLocation, 1, gl.FLOAT, false, 0, 0)

        const typeBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
        gl.enableVertexAttribArray(typeLocation)
        gl.vertexAttribPointer(typeLocation, 1, gl.FLOAT, false, 0, 0)

        const depthBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, depthBuffer)
        gl.enableVertexAttribArray(depthLocation)
        gl.vertexAttribPointer(depthLocation, 1, gl.FLOAT, false, 0, 0)

        function createSplash(
            x: number,
            y: number,
            depth: number,
            splashSizeParam: number
        ) {
            const splashesToCreate = Math.floor(
                (3 + depth * 3) * splashSizeParam
            )
            let created = 0

            for (
                let i = rainCount;
                i < maxParticles && created < splashesToCreate;
                i++
            ) {
                if (lives[i] <= 0) {
                    types[i] = 1
                    depths[i] = depth
                    positions[i * 2] = x
                    positions[i * 2 + 1] = y
                    const angle = Math.random() * Math.PI
                    const speed =
                        (0.01 + Math.random() * 0.02) * (0.5 + depth * 0.5)
                    velocities[i * 2] = Math.cos(angle) * speed
                    velocities[i * 2 + 1] = Math.sin(angle) * speed * 0.5
                    lives[i] = 1
                    created++
                }
            }
        }

        let lastTime = performance.now()
        let canvasWidth = canvas.clientWidth
        let canvasHeight = canvas.clientHeight

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                canvasWidth = entry.contentRect.width
                canvasHeight = entry.contentRect.height
            }
        })
        resizeObserver.observe(canvas)

        function render(now: number) {
            if (!isInViewRef.current) {
                lastTime = now
                animationId = requestAnimationFrame(render)
                return
            }

            const dpr = window.devicePixelRatio || 1
            if (
                canvas &&
                (canvas.width !== canvasWidth * dpr ||
                    canvas.height !== canvasHeight * dpr)
            ) {
                canvas.width = canvasWidth * dpr
                canvas.height = canvasHeight * dpr
                gl.viewport(0, 0, canvas.width, canvas.height)
            }

            const deltaTime = now - lastTime
            lastTime = now

            const p = propsRef.current
            const bgRgba = parseColorToRgba(p.backgroundColor)
            const rainRgba = parseColorToRgba(p.rainColor)
            const splashRgba = parseColorToRgba(p.splashColor)
            const lightRgba = parseColorToRgba(p.lightColor)
            const lightningRgba = parseColorToRgba(p.lightningColor)

            currentMouse.current.x +=
                (targetMouse.current.x - currentMouse.current.x) * 0.08
            currentMouse.current.y +=
                (targetMouse.current.y - currentMouse.current.y) * 0.08

            if (p.enableLightning) {
                if (!lightningState.current.active) {
                    lightningState.current.delayTimer -= deltaTime

                    if (lightningState.current.delayTimer <= 0) {
                        lightningState.current.active = true
                        lightningState.current.intensity = 1.0
                        lightningState.current.timer = 0
                    }
                } else {
                    lightningState.current.timer += deltaTime
                    const elapsed = lightningState.current.timer

                    if (elapsed < 100) {
                        lightningState.current.intensity = 1.0
                    } else if (elapsed < 150) {
                        lightningState.current.intensity = 0.0
                    } else if (elapsed < 200) {
                        lightningState.current.intensity = 0.6
                    } else if (elapsed < 250) {
                        lightningState.current.intensity = 0.0
                    } else {
                        lightningState.current.active = false
                        lightningState.current.intensity = 0.0
                        const baseDelay = 3000 / p.lightningFrequency
                        lightningState.current.delayTimer =
                            baseDelay + Math.random() * baseDelay
                    }
                }
            } else {
                lightningState.current.intensity = 0.0
            }

            const bgBrightness = lightningState.current.intensity * 0.5
            const flashAlpha = Math.max(
                bgRgba[3],
                lightningState.current.intensity * 0.6
            )

            gl.clearColor(
                Math.min(1.0, bgRgba[0] + lightningRgba[0] * bgBrightness),
                Math.min(1.0, bgRgba[1] + lightningRgba[1] * bgBrightness),
                Math.min(1.0, bgRgba[2] + lightningRgba[2] * bgBrightness),
                flashAlpha
            )
            gl.clear(gl.COLOR_BUFFER_BIT)

            for (let i = 0; i < maxParticles; i++) {
                if (types[i] === 0) {
                    positions[i * 2] += velocities[i * 2]
                    positions[i * 2 + 1] += velocities[i * 2 + 1]

                    if (positions[i * 2 + 1] < -1) {
                        createSplash(
                            positions[i * 2],
                            -1,
                            depths[i],
                            p.splashSize
                        )

                        depths[i] = Math.random()
                        positions[i * 2] = Math.random() * 2 - 1
                        positions[i * 2 + 1] = 1 + Math.random()
                        velocities[i * 2] = (Math.random() - 0.5) * 0.002
                        velocities[i * 2 + 1] =
                            -(0.01 + depths[i] * 0.02) * p.rainSpeed -
                            Math.random() * 0.005
                    }
                } else if (types[i] === 1) {
                    if (lives[i] > 0) {
                        positions[i * 2] += velocities[i * 2]
                        positions[i * 2 + 1] += velocities[i * 2 + 1]
                        velocities[i * 2 + 1] -= 0.0015
                        lives[i] -= 0.03

                        if (lives[i] <= 0) {
                            positions[i * 2] = -2
                            positions[i * 2 + 1] = -2
                        }
                    }
                }
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW)

            gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW)

            gl.bindBuffer(gl.ARRAY_BUFFER, lifeBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, lives, gl.DYNAMIC_DRAW)

            gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, types, gl.DYNAMIC_DRAW)

            gl.bindBuffer(gl.ARRAY_BUFFER, depthBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, depths, gl.DYNAMIC_DRAW)

            gl.uniform3f(
                rainColorLocation,
                rainRgba[0],
                rainRgba[1],
                rainRgba[2]
            )
            gl.uniform3f(
                splashColorLocation,
                splashRgba[0],
                splashRgba[1],
                splashRgba[2]
            )

            gl.uniform2f(
                mouseLocation,
                currentMouse.current.x,
                currentMouse.current.y
            )

            gl.uniform1i(enableLightingLocation, p.enableLighting ? 1 : 0)
            gl.uniform3f(
                lightColorLocation,
                lightRgba[0],
                lightRgba[1],
                lightRgba[2]
            )
            gl.uniform1f(lightIntensityLocation, p.lightIntensity)
            gl.uniform1f(lightRadiusLocation, p.lightRadius)

            const lightX = currentMouse.current.x * 0.8 - 0.3
            const lightY = currentMouse.current.y * 0.5 + 0.5
            gl.uniform2f(lightPosLocation, lightX, lightY)

            gl.uniform1f(
                lightningIntensityLocation,
                lightningState.current.intensity
            )
            gl.uniform3f(
                lightningColorLocation,
                lightningRgba[0],
                lightningRgba[1],
                lightningRgba[2]
            )

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            gl.drawArrays(gl.POINTS, 0, maxParticles)

            animationId = requestAnimationFrame(render)
        }

        animationId = requestAnimationFrame(render)

        return () => {
            cancelAnimationFrame(animationId)
            resizeObserver.disconnect()
            gl.deleteProgram(program)
            gl.deleteShader(vertexShader)
            gl.deleteShader(fragmentShader)
            gl.deleteBuffer(positionBuffer)
            gl.deleteBuffer(velocityBuffer)
            gl.deleteBuffer(lifeBuffer)
            gl.deleteBuffer(typeBuffer)
            gl.deleteBuffer(depthBuffer)
        }
    }, [props.rainIntensity])

    if (isStatic) {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: props.backgroundColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: props.rainColor,
                    fontSize: 14,
                    fontFamily: "sans-serif",
                }}
            >
                Realistic Rain Preview
            </div>
        )
    }

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    )
}

addPropertyControls(RainEffect, {
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "transparent",
    },
    rainColor: {
        type: ControlType.Color,
        title: "Rain Base",
        defaultValue: "#9bb8d6",
    },
    splashColor: {
        type: ControlType.Color,
        title: "Splash Tint",
        defaultValue: "#cce5ff",
    },
    rainIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        defaultValue: 100,
        min: 10,
        max: 300,
        step: 10,
    },
    rainSpeed: {
        type: ControlType.Number,
        title: "Speed",
        defaultValue: 1.2,
        min: 0.5,
        max: 1.5,
        step: 0.1,
    },
    splashSize: {
        type: ControlType.Number,
        title: "Splash Size",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
    },
    enableLighting: {
        type: ControlType.Boolean,
        title: "Enable Lighting",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lightColor: {
        type: ControlType.Color,
        title: "Light Color",
        defaultValue: "#ffdd88",
        hidden: ({ enableLighting }) => !enableLighting,
    },
    lightIntensity: {
        type: ControlType.Number,
        title: "Light Intensity",
        defaultValue: 1.0,
        min: 0,
        max: 3,
        step: 0.1,
        hidden: ({ enableLighting }) => !enableLighting,
    },
    lightRadius: {
        type: ControlType.Number,
        title: "Light Spread",
        defaultValue: 0.5,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        hidden: ({ enableLighting }) => !enableLighting,
    },
    enableLightning: {
        type: ControlType.Boolean,
        title: "Lightning Flash",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    lightningColor: {
        type: ControlType.Color,
        title: "Lightning Color",
        defaultValue: "#eef5ff",
        hidden: ({ enableLightning }) => !enableLightning,
    },
    lightningFrequency: {
        type: ControlType.Number,
        title: "Lightning Freq",
        defaultValue: 0.5,
        min: 0.1,
        max: 2,
        step: 0.1,
        hidden: ({ enableLightning }) => !enableLightning,
    },
})
