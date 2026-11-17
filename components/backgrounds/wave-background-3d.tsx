import * as React from "react"
import { useRef, useEffect } from "react"
import * as THREE from "three"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// --- Interfaces ---
interface AnimatedDotWaveProps {
    editorQuality?: number
    styleType?: "lines" | "halftone" | "topo" | "rings"
    layout?: object
    style?: React.CSSProperties
    styling?: any
    wave?: any
    interaction?: any
    patternLines?: any
    patternHalftone?: any
    patternTopo?: any
    patternRings?: any
    customPattern?: any
    camera?: any
    [key: string]: any
}

// --- Shaders ---
const vertexShader = `
uniform float uTime;
uniform float uNoiseScale;
uniform float uAmplitude;
uniform vec2 uMouse;
uniform float uHoverRadius;
uniform float uHoverStrength;

varying vec2 vUv;
varying float vElevation;

// Classic 3D Simplex Noise by Ashima Arts
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                    dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Multi-octave displacement for organic wave flow
    float n = snoise(vec3(pos.x * uNoiseScale, pos.y * uNoiseScale, uTime));
    n += 0.4 * snoise(vec3(pos.x * uNoiseScale * 2.0, pos.y * uNoiseScale * 2.0, uTime * 1.5));
    n = n / 1.4; // Normalize back to approx -1.0 to 1.0 range
    
    // Interactive hover displacement
    float mouseDist = distance(pos.xy, uMouse);
    float hoverEffect = smoothstep(uHoverRadius, 0.0, mouseDist);
    
    // Combine noise wave and hover push
    pos.z += (n * uAmplitude) + (hoverEffect * uHoverStrength);
    
    // Pass to fragment for coloring (Hover also subtly lights up the wave by adding to elevation)
    vElevation = n + (hoverEffect * 0.5); 
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const fragmentShader = `
uniform int uStyle;
uniform vec3 uColorPeak;
uniform vec3 uColorValley;

// Style 0: Dashed Lines
uniform float uLinesCount;
uniform float uDotsCount;
uniform float uLineWidth;
uniform float uDotWidth;

// Style 1: Halftone Dots
uniform float uHalftoneScale;
uniform float uHalftoneDotBase;
uniform float uHalftoneDotElevScale;

// Style 2: Topographic Contours
uniform float uContourCount;
uniform float uContourWidth;

// Style 3: Rings
uniform float uRingsScale;
uniform float uRingRadius;
uniform float uRingThickness;

// Custom SVG Logo Replacement
uniform bool uUseCustomSvg;
uniform sampler2D uCustomTexture;
uniform float uHasTexture;
uniform float uSvgScale;

varying vec2 vUv;
varying float vElevation;

void main() {
    float pattern = 0.0;
    
    // Normalize elevation mapping for color gradient
    float elev = smoothstep(-0.8, 0.8, vElevation);

    if (uUseCustomSvg && uHasTexture > 0.5) {
        // --- Custom Logo/SVG Pattern ---
        // Using seamless wrapping handled by Three.js instead of fract() to eliminate mipmap boundary lines
        vec2 uv = vUv * uSvgScale;
        vec4 texColor = texture2D(uCustomTexture, uv);
        
        // Extracts the alpha channel to create the mask for the logo pattern
        pattern = texColor.a;
        
    } else if (uStyle == 0) {
        // --- Dashed Lines Pattern ---
        float lineCoord = fract(vUv.y * uLinesCount);
        float dotCoord = fract(vUv.x * uDotsCount);
        
        float lineDist = abs(lineCoord - 0.5);
        float dotDist = abs(dotCoord - 0.5);

        float fwY = max(fwidth(vUv.y * uLinesCount), 0.01);
        float fwX = max(fwidth(vUv.x * uDotsCount), 0.01);
        
        float lineAlpha = 1.0 - smoothstep(uLineWidth/2.0 - fwY, uLineWidth/2.0 + fwY, lineDist);
        float dotAlpha = 1.0 - smoothstep(uDotWidth/2.0 - fwX, uDotWidth/2.0 + fwX, dotDist);
        
        pattern = lineAlpha * dotAlpha;
        
    } else if (uStyle == 1) {
        // --- Halftone Dots Pattern ---
        float gridX = fract(vUv.x * uHalftoneScale);
        float gridY = fract(vUv.y * uHalftoneScale);
        float dist = distance(vec2(gridX, gridY), vec2(0.5));
        
        float fw = max(fwidth(dist), 0.01);
        
        float dotRadius = uHalftoneDotBase + (elev * uHalftoneDotElevScale);
        pattern = 1.0 - smoothstep(dotRadius - fw, dotRadius + fw, dist);
        
    } else if (uStyle == 2) {
        // --- Topographic Contours Pattern ---
        float contourVal = vElevation * uContourCount;
        float fwC = max(fwidth(contourVal), 0.0001);
        float dist = abs(fract(contourVal + 0.5) - 0.5) / fwC;
        pattern = smoothstep(uContourWidth * 0.5 + 0.75, uContourWidth * 0.5 - 0.75, dist);
        
    } else if (uStyle == 3) {
        // --- Rings Pattern ---
        float gridX = fract(vUv.x * uRingsScale);
        float gridY = fract(vUv.y * uRingsScale);
        float dist = distance(vec2(gridX, gridY), vec2(0.5));
        
        float fw = max(fwidth(dist), 0.01);
        
        float outerEdge = 1.0 - smoothstep(uRingRadius - fw, uRingRadius + fw, dist);
        float innerEdge = 1.0 - smoothstep(uRingRadius - uRingThickness - fw, uRingRadius - uRingThickness + fw, dist);
        
        pattern = outerEdge - innerEdge;
    }

    // Mix colors based on the elevation (Z-displacement from vertex shader)
    vec3 color = mix(uColorValley, uColorPeak, elev);

    // Soft vignette to fade boundaries into the background smoothly
    float vignette = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x) 
                   * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);

    // Opaque surface rendering: elements where pattern == 0 will render as pure black
    vec3 finalColor = color * pattern * vignette;

    gl_FragColor = vec4(finalColor, 1.0);
}
`

// --- Default Props Data ---
const defaultPropsData = {
    editorQuality: 50, // Defaults to 50% on canvas
    styleType: "rings",
    styling: {
        peakColor: "#ffffff",
        valleyColor: "#111111",
        bgColor: "#000000",
    },
    wave: {
        speed: 0.05,
        amplitude: 1.8,
        noiseScale: 0.08,
    },
    interaction: {
        hoverStrength: 2.5,
        hoverRadius: 5.0,
    },
    customPattern: {
        useCustomSvg: false,
        customSvg: "",
        svgScale: 20.0,
    },
    patternLines: {
        linesCount: 180,
        dotsCount: 600,
        lineWidth: 0.15,
        dotWidth: 0.5,
    },
    patternHalftone: {
        halftoneScale: 280,
        halftoneDotBase: 0.1,
        halftoneDotElevScale: 0.35,
    },
    patternTopo: {
        contourCount: 30,
        contourWidth: 1.2,
    },
    patternRings: {
        ringsScale: 100,
        ringRadius: 0.35,
        ringThickness: 0.08,
    },
    camera: {
        tilt: 30,
        height: 4.0,
        zoom: 12.0,
    },
}

export default function AnimatedDotWave(incomingProps: AnimatedDotWaveProps) {
    // Destructure strictly so custom framer controls don't leak into the DOM <div {...restProps}>, which crashes React.
    const {
        editorQuality,
        styleType,
        layout,
        style,
        styling,
        wave,
        interaction,
        patternLines,
        patternHalftone,
        patternTopo,
        patternRings,
        customPattern,
        camera,
        ...restProps // Safe to spread Framer interaction DOM events (e.g., onMouseEnter)
    } = incomingProps

    // Helper to safely merge nested object props and prevent undefined crashes in Three.js
    const merge = (defaultObj: any, incomingObj: any) => {
        const result = { ...defaultObj }
        if (incomingObj) {
            for (const key in incomingObj) {
                if (incomingObj[key] !== undefined) {
                    result[key] = incomingObj[key]
                }
            }
        }
        return result
    }

    const mergedProps = {
        editorQuality: editorQuality ?? defaultPropsData.editorQuality,
        styleType: styleType ?? defaultPropsData.styleType,
        ...layout,
        ...merge(defaultPropsData.styling, styling),
        ...merge(defaultPropsData.wave, wave),
        ...merge(defaultPropsData.interaction, interaction),
        ...merge(defaultPropsData.patternLines, patternLines),
        ...merge(defaultPropsData.patternHalftone, patternHalftone),
        ...merge(defaultPropsData.patternTopo, patternTopo),
        ...merge(defaultPropsData.patternRings, patternRings),
        ...merge(defaultPropsData.customPattern, customPattern),
        ...merge(defaultPropsData.camera, camera),
    }

    const mountRef = useRef<HTMLDivElement>(null)
    const propsRef = useRef(mergedProps)
    const isIntersecting = useRef(true)

    // Framer Contexts
    const inEditor = RenderTarget.current() === RenderTarget.canvas

    // Update refs safely to prevent WebGL context resyncs
    propsRef.current = mergedProps

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let frameId: number
        const clock = new THREE.Clock()

        // Variables for strictly scoped custom texture cleanup
        let activeTextureUrl = ""
        let activeTexture: THREE.Texture | null = null

        // --- Helpers for Editor Quality Filtering ---
        // Bypasses quality scaling entirely on live site.
        // Inside canvas, scales resolution and segment complexity.
        const getPixelRatio = (quality: number) => {
            const maxRatio = Math.min(window.devicePixelRatio, 2)
            if (!inEditor) return maxRatio
            return maxRatio * Math.max(0.1, quality / 100)
        }

        const getSegments = (quality: number) => {
            if (!inEditor) return 400
            // Scale geometry strictly between 20 segments (low quality) up to 400 (max)
            return Math.max(20, Math.floor((quality / 100) * 400))
        }

        let currentQuality = propsRef.current.editorQuality

        // --- 1. Init WebGL Renderer ---
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(getPixelRatio(currentQuality))
        container.appendChild(renderer.domElement)

        // --- 2. Init Scene & Camera ---
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)

        // --- 3. Build Mesh & Material ---
        const PLANE_SIZE = 50
        const initialSegments = getSegments(currentQuality)
        let geometry = new THREE.PlaneGeometry(
            PLANE_SIZE,
            PLANE_SIZE,
            initialSegments,
            initialSegments
        )
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            extensions: { derivatives: true },
            transparent: false,
            uniforms: {
                uTime: { value: 0 },
                uNoiseScale: { value: 0 },
                uAmplitude: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uHoverRadius: { value: 0 },
                uHoverStrength: { value: 0 },
                uStyle: { value: 0 },

                // Lines
                uLinesCount: { value: 0 },
                uDotsCount: { value: 0 },
                uLineWidth: { value: 0 },
                uDotWidth: { value: 0 },

                // Halftone
                uHalftoneScale: { value: 0 },
                uHalftoneDotBase: { value: 0 },
                uHalftoneDotElevScale: { value: 0 },

                // Topo
                uContourCount: { value: 0 },
                uContourWidth: { value: 0 },

                // Rings
                uRingsScale: { value: 0 },
                uRingRadius: { value: 0 },
                uRingThickness: { value: 0 },

                // Custom Logo Pattern
                uUseCustomSvg: { value: false },
                uCustomTexture: { value: null },
                uHasTexture: { value: 0.0 },
                uSvgScale: { value: 1.0 },

                uColorPeak: { value: new THREE.Color() },
                uColorValley: { value: new THREE.Color() },
            },
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)

        const tempColor = new THREE.Color()

        // --- 4. Observers (Resizing & Viewport Gating) ---
        const handleResize = () => {
            const width = container.clientWidth
            const height = container.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        }

        const resizeObserver = new ResizeObserver(handleResize)
        resizeObserver.observe(container)
        handleResize()

        const intersectionObserver = new IntersectionObserver(
            ([entry]) => {
                isIntersecting.current = entry.isIntersecting
            },
            { threshold: 0 }
        )
        intersectionObserver.observe(container)

        // --- 5. Interactive Mouse Raycasting ---
        const raycaster = new THREE.Raycaster()
        const targetMouse = new THREE.Vector2(0, 0)
        const currentMouse = new THREE.Vector2(0, 0)
        let isMouseInside = false
        let currentHoverStrength = 0

        const onMouseMove = (e: MouseEvent) => {
            isMouseInside = true
            const rect = container.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera({ x, y }, camera)

            // Raycast directly against the mesh to perfectly match its rotation & scale
            const intersects = raycaster.intersectObject(mesh)
            if (intersects.length > 0 && intersects[0].uv) {
                const uv = intersects[0].uv
                targetMouse.set(
                    (uv.x - 0.5) * PLANE_SIZE,
                    (uv.y - 0.5) * PLANE_SIZE
                )
            }
        }

        const onMouseLeave = () => {
            isMouseInside = false
        }

        container.addEventListener("mousemove", onMouseMove)
        container.addEventListener("mouseleave", onMouseLeave)

        // --- 6. Animation Loop ---
        const tick = () => {
            frameId = requestAnimationFrame(tick)

            if (!inEditor && !isIntersecting.current) return

            const p = propsRef.current

            // Check if Editor Quality has changed on the slider
            if (inEditor && p.editorQuality !== currentQuality) {
                currentQuality = p.editorQuality

                // Adjust Pixel Ratio Dynamically
                renderer.setPixelRatio(getPixelRatio(currentQuality))
                renderer.setSize(container.clientWidth, container.clientHeight)

                // Adjust Geometry Dynamically (Saves GPU/CPU drastically on canvas)
                const newSegments = getSegments(currentQuality)
                if (geometry.parameters.widthSegments !== newSegments) {
                    const newGeometry = new THREE.PlaneGeometry(
                        PLANE_SIZE,
                        PLANE_SIZE,
                        newSegments,
                        newSegments
                    )
                    mesh.geometry.dispose()
                    mesh.geometry = newGeometry
                    geometry = newGeometry
                }
            }

            const elapsedTime = clock.getElapsedTime()

            // Smooth mouse interpolation
            currentMouse.lerp(targetMouse, 0.15)
            const targetStrength = isMouseInside ? p.hoverStrength : 0.0
            currentHoverStrength +=
                (targetStrength - currentHoverStrength) * 0.1

            // Dynamic Custom Image Loader
            if (
                p.useCustomSvg &&
                p.customSvg &&
                p.customSvg !== activeTextureUrl
            ) {
                activeTextureUrl = p.customSvg
                const loader = new THREE.TextureLoader()
                loader.setCrossOrigin("anonymous")
                loader.load(p.customSvg, (tex) => {
                    tex.wrapS = THREE.RepeatWrapping
                    tex.wrapT = THREE.RepeatWrapping
                    tex.minFilter = THREE.LinearMipMapLinearFilter
                    tex.magFilter = THREE.LinearFilter
                    tex.generateMipmaps = true

                    if (activeTexture) activeTexture.dispose()
                    activeTexture = tex
                    material.uniforms.uCustomTexture.value = activeTexture
                    material.uniforms.uHasTexture.value = 1.0
                })
            } else if (!p.useCustomSvg || !p.customSvg) {
                material.uniforms.uHasTexture.value = 0.0
                activeTextureUrl = ""
            }

            // Uniform Mappings
            material.uniforms.uTime.value = elapsedTime * p.speed
            material.uniforms.uAmplitude.value = p.amplitude
            material.uniforms.uNoiseScale.value = p.noiseScale

            material.uniforms.uMouse.value.copy(currentMouse)
            material.uniforms.uHoverStrength.value = currentHoverStrength
            material.uniforms.uHoverRadius.value = p.hoverRadius

            material.uniforms.uStyle.value =
                p.styleType === "halftone"
                    ? 1
                    : p.styleType === "topo"
                      ? 2
                      : p.styleType === "rings"
                        ? 3
                        : 0

            material.uniforms.uLinesCount.value = p.linesCount
            material.uniforms.uDotsCount.value = p.dotsCount
            material.uniforms.uLineWidth.value = p.lineWidth
            material.uniforms.uDotWidth.value = p.dotWidth

            material.uniforms.uHalftoneScale.value = p.halftoneScale
            material.uniforms.uHalftoneDotBase.value = p.halftoneDotBase
            material.uniforms.uHalftoneDotElevScale.value =
                p.halftoneDotElevScale

            material.uniforms.uContourCount.value = p.contourCount
            material.uniforms.uContourWidth.value = p.contourWidth

            material.uniforms.uRingsScale.value = p.ringsScale
            material.uniforms.uRingRadius.value = p.ringRadius
            material.uniforms.uRingThickness.value = p.ringThickness

            material.uniforms.uUseCustomSvg.value = p.useCustomSvg
            material.uniforms.uSvgScale.value = p.svgScale

            tempColor.set(p.peakColor)
            material.uniforms.uColorPeak.value.copy(tempColor)
            tempColor.set(p.valleyColor)
            material.uniforms.uColorValley.value.copy(tempColor)

            scene.background = new THREE.Color(p.bgColor)

            // Adjust Camera and Mesh alignment
            const tiltRad = (p.tilt * Math.PI) / 180
            mesh.rotation.x = -tiltRad
            camera.position.set(0, p.height, p.zoom)
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)
        }
        tick()

        // --- 7. Strict Cleanup Routine ---
        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()
            container.removeEventListener("mousemove", onMouseMove)
            container.removeEventListener("mouseleave", onMouseLeave)

            geometry.dispose()
            material.dispose()
            if (activeTexture) activeTexture.dispose()
            scene.clear()

            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [])

    // Container Global Style
    const containerStyle: React.CSSProperties = {
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
        backgroundColor: mergedProps.bgColor || "#000000",
        overflow: "hidden",
        ...style,
    }

    return <div {...restProps} ref={mountRef} style={containerStyle} />
}

// --- Default Props Definition ---
AnimatedDotWave.defaultProps = defaultPropsData

// --- Framer Property Controls ---
addPropertyControls(AnimatedDotWave, {
    editorQuality: {
        type: ControlType.Number,
        title: "Editor Quality",
        description:
            "Adjusts the rendering resolution and geometry strictly in the Framer Canvas. Does not affect the live site.",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        unit: "%",
    },
    styleType: {
        type: ControlType.Enum,
        title: "Style",
        options: ["lines", "halftone", "topo", "rings"],
        optionTitles: ["Dashed", "Halftone", "Contours", "Rings"],
        description: "Select the base procedural pattern.",
        defaultValue: "rings",
    },
    customPattern: {
        type: ControlType.Object,
        title: "Custom Logo/SVG",
        controls: {
            useCustomSvg: {
                type: ControlType.Boolean,
                title: "Enable Custom",
                description:
                    "Toggle on to override the procedural pattern with your own Logo/SVG.",
                defaultValue: false,
            },
            customSvg: {
                type: ControlType.Image,
                title: "Upload Logo",
                description: "Upload a transparent SVG or PNG.",
                hidden: (props) => !props.useCustomSvg,
            },
            svgScale: {
                type: ControlType.Number,
                title: "Scale Tiling",
                unit: "x",
                step: 0.1,
                min: 1,
                max: 100,
                description:
                    "Adjust how densely the logo tiles across the waves.",
                defaultValue: 20.0,
                hidden: (props) => !props.useCustomSvg,
            },
        },
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            peakColor: {
                type: ControlType.Color,
                title: "Peak Color",
                defaultValue: "#ffffff",
            },
            valleyColor: {
                type: ControlType.Color,
                title: "Valley Color",
                defaultValue: "#111111",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background Color",
                defaultValue: "#000000",
            },
        },
    },
    wave: {
        type: ControlType.Object,
        title: "Wave Physics",
        controls: {
            speed: {
                type: ControlType.Number,
                title: "Speed",
                unit: "x",
                step: 0.01,
                min: 0,
                max: 1,
                defaultValue: 0.05,
            },
            amplitude: {
                type: ControlType.Number,
                title: "Amplitude",
                unit: "px",
                step: 0.1,
                min: 0,
                max: 10,
                defaultValue: 1.8,
            },
            noiseScale: {
                type: ControlType.Number,
                title: "Noise Scale",
                unit: "x",
                step: 0.01,
                min: 0.01,
                max: 1.0,
                defaultValue: 0.08,
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Hover Effect",
        controls: {
            hoverStrength: {
                type: ControlType.Number,
                title: "Push Strength",
                unit: "px",
                step: 0.1,
                min: 0,
                max: 10,
                defaultValue: 2.5,
            },
            hoverRadius: {
                type: ControlType.Number,
                title: "Radius",
                unit: "px",
                step: 0.1,
                min: 1,
                max: 20,
                defaultValue: 5.0,
            },
        },
    },
    patternLines: {
        type: ControlType.Object,
        title: "Dashed Controls",
        hidden: (props) => props.styleType !== "lines",
        controls: {
            linesCount: {
                type: ControlType.Number,
                title: "Lines Count",
                unit: "qty",
                step: 1,
                min: 10,
                max: 500,
                defaultValue: 180,
            },
            dotsCount: {
                type: ControlType.Number,
                title: "Dots Count",
                unit: "qty",
                step: 1,
                min: 10,
                max: 2000,
                defaultValue: 600,
            },
            lineWidth: {
                type: ControlType.Number,
                title: "Line Width",
                unit: "%",
                step: 0.01,
                min: 0.01,
                max: 1.0,
                defaultValue: 0.15,
            },
            dotWidth: {
                type: ControlType.Number,
                title: "Dot Width",
                unit: "%",
                step: 0.01,
                min: 0.01,
                max: 1.0,
                defaultValue: 0.5,
            },
        },
    },
    patternHalftone: {
        type: ControlType.Object,
        title: "Halftone Controls",
        hidden: (props) => props.styleType !== "halftone",
        controls: {
            halftoneScale: {
                type: ControlType.Number,
                title: "Density Scale",
                unit: "x",
                step: 1,
                min: 50,
                max: 800,
                defaultValue: 280,
            },
            halftoneDotBase: {
                type: ControlType.Number,
                title: "Base Dot Size",
                unit: "%",
                step: 0.01,
                min: 0.0,
                max: 0.5,
                defaultValue: 0.1,
            },
            halftoneDotElevScale: {
                type: ControlType.Number,
                title: "3D Shading",
                unit: "%",
                step: 0.01,
                min: 0.0,
                max: 0.5,
                defaultValue: 0.35,
            },
        },
    },
    patternTopo: {
        type: ControlType.Object,
        title: "Contours Controls",
        hidden: (props) => props.styleType !== "topo",
        controls: {
            contourCount: {
                type: ControlType.Number,
                title: "Contour Count",
                unit: "qty",
                step: 1,
                min: 5,
                max: 150,
                defaultValue: 30,
            },
            contourWidth: {
                type: ControlType.Number,
                title: "Line Width",
                unit: "px",
                step: 0.1,
                min: 0.5,
                max: 10.0,
                defaultValue: 1.2,
            },
        },
    },
    patternRings: {
        type: ControlType.Object,
        title: "Rings Controls",
        hidden: (props) => props.styleType !== "rings",
        controls: {
            ringsScale: {
                type: ControlType.Number,
                title: "Density Scale",
                unit: "x",
                step: 1,
                min: 10,
                max: 500,
                defaultValue: 100,
            },
            ringRadius: {
                type: ControlType.Number,
                title: "Radius",
                unit: "%",
                step: 0.01,
                min: 0.05,
                max: 0.5,
                defaultValue: 0.35,
            },
            ringThickness: {
                type: ControlType.Number,
                title: "Thickness",
                unit: "%",
                step: 0.01,
                min: 0.01,
                max: 0.25,
                defaultValue: 0.08,
            },
        },
    },
    camera: {
        type: ControlType.Object,
        title: "Camera View",
        controls: {
            tilt: {
                type: ControlType.Number,
                title: "Tilt",
                unit: "deg",
                step: 1,
                min: 0,
                max: 90,
                defaultValue: 30,
            },
            height: {
                type: ControlType.Number,
                title: "Height",
                unit: "px",
                step: 0.1,
                min: 0,
                max: 20,
                defaultValue: 4.0,
            },
            zoom: {
                type: ControlType.Number,
                title: "Zoom",
                unit: "px",
                step: 0.1,
                min: 1,
                max: 50,
                defaultValue: 12.0,
            },
        },
    },
})
