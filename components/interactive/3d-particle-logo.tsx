import * as React from "react"
import { useRef, useEffect, useState } from "react"
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


// Default SVG Placeholder
const DEFAULT_LOGO =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTIgTDg1IDg4IEw3MiA4OCBMNjAgNTUgTDQwIDU1IEwyOCA4OCBMMTUgODggWiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg=="

export default function CinematicSandLogo(incomingProps) {
    // STEP 1: Intercept & Flatten Props
    const rawProps = {
        ...CinematicSandLogo.defaultProps,
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.lighting || {}),
        ...(incomingProps.interaction || {}),
        ...(incomingProps.behavior || {}),
    }

    // PERFORMANCE FIX: Debounce property changes by 300ms to prevent the
    // main thread from locking up when actively dragging sliders in Framer.
    const [props, setProps] = useState(rawProps)

    useEffect(() => {
        const timer = setTimeout(() => {
            setProps(rawProps)
        }, 300)
        return () => clearTimeout(timer)
    }, [
        rawProps.logoImage,
        rawProps.useOriginalColors,
        rawProps.particleDensity,
        rawProps.particleSize,
        rawProps.volumeDepth,
        rawProps.bevel,
        rawProps.logoScale,
        rawProps.color1,
        rawProps.color2,
        rawProps.lightColor,
        rawProps.shadowColor,
        rawProps.animationSpeed,
        rawProps.noiseAmplitude,
        rawProps.mouseRadius,
        rawProps.mouseForce,
        rawProps.cameraDistance,
        rawProps.enableRotation,
        rawProps.rotationSpeed,
        rawProps.editorPreview,
    ])

    const mountRef = useRef(null)
    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.editorPreview ?? true)

    // Interaction & Camera states
    const targetMouse = useRef(new THREE.Vector3(0, 0, 0))
    const isHovering = useRef(false)
    const isIntersecting = useRef(true)

    // Hold & Drag 360 Rotation state
    const cameraAngle = useRef({ theta: 0, phi: Math.PI / 2 })
    const targetCameraAngle = useRef({ theta: 0, phi: Math.PI / 2 })
    const isDragging = useRef(false)
    const lastPointer = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let frameId
        let renderer, scene, camera
        let particleSystem
        let uniforms
        const raycaster = new THREE.Raycaster()
        const intersectionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

        // Setup WebGL Architecture - Max Performance
        const initScene = () => {
            scene = new THREE.Scene()

            camera = new THREE.PerspectiveCamera(
                45,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            )
            camera.position.setFromSphericalCoords(
                props.cameraDistance,
                cameraAngle.current.phi,
                cameraAngle.current.theta
            )

            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
                failIfMajorPerformanceCaveat: false,
            })
            // Pure transparent background
            renderer.setClearColor(0x000000, 0)
            renderer.setSize(container.clientWidth, container.clientHeight)
            // Limit pixel ratio to 1.5 to maintain 60FPS on high-DPI screens at max density (50)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

            container.appendChild(renderer.domElement)
        }

        const loadImageAndCreateParticles = () => {
            const img = new Image()
            img.crossOrigin = "Anonymous"
            img.onload = () => {
                createParticles(img)
                if (!shouldAnimate) renderLoop()
            }
            img.onerror = () => {
                if (img.src !== DEFAULT_LOGO) img.src = DEFAULT_LOGO
            }
            img.src = props.logoImage || DEFAULT_LOGO
        }

        const createParticles = (image) => {
            if (particleSystem) {
                particleSystem.geometry.dispose()
                particleSystem.material.dispose()
                scene.remove(particleSystem)
            }

            const canvas = document.createElement("canvas")
            // PERFORMANCE FIX: Reduced from 256 to 128 to drastically cut down nested loop iterations
            const sampleRes = 128
            canvas.width = sampleRes
            canvas.height = sampleRes
            const ctx = canvas.getContext("2d", { willReadFrequently: true })

            ctx.clearRect(0, 0, sampleRes, sampleRes)
            const scale = Math.min(
                sampleRes / image.width,
                sampleRes / image.height
            )
            const w = image.width * scale
            const h = image.height * scale
            const dx = (sampleRes - w) / 2
            const dy = (sampleRes - h) / 2
            ctx.drawImage(image, dx, dy, w, h)

            const imageData = ctx.getImageData(0, 0, sampleRes, sampleRes).data

            const density = props.particleDensity
            const volumeDepth = props.volumeDepth / 10
            const bevel = props.bevel / 10
            const logoScale = props.logoScale / 10

            // Pre-calculate valid pixel count
            let validPixels = 0
            const totalPixels = sampleRes * sampleRes
            for (let i = 0; i < totalPixels; i++) {
                if (imageData[i * 4 + 3] > 80) validPixels++
            }

            // PERFORMANCE FIX: Strict particle cap. Prevents WebGL buffer from blowing up memory footprint
            const MAX_PARTICLES = 250000
            const targetTotal = validPixels * density
            const finalTotalParticles = Math.min(targetTotal, MAX_PARTICLES)

            const positions = new Float32Array(finalTotalParticles * 3)
            const colors = new Float32Array(finalTotalParticles * 3)
            const normals = new Float32Array(finalTotalParticles * 3)
            const randoms = new Float32Array(finalTotalParticles)

            let idx3 = 0
            let idx1 = 0

            const color1 = new THREE.Color(props.color1)
            const color2 = new THREE.Color(props.color2)
            const baseColor = new THREE.Color()
            const mixedColor = new THREE.Color()
            const PI2 = Math.PI * 2.0

            // Accumulator drops particles perfectly evenly if count exceeds the MAX_PARTICLES cap
            const step =
                finalTotalParticles > 0 ? targetTotal / finalTotalParticles : 1
            let accumulator = 0

            for (let y = 0; y < sampleRes; y++) {
                for (let x = 0; x < sampleRes; x++) {
                    const index = (y * sampleRes + x) * 4
                    const alpha = imageData[index + 3]

                    if (alpha > 80) {
                        const nx = (x / sampleRes) * 2 - 1
                        const ny = -(y / sampleRes) * 2 + 1

                        if (props.useOriginalColors) {
                            baseColor.setRGB(
                                imageData[index] / 255,
                                imageData[index + 1] / 255,
                                imageData[index + 2] / 255
                            )
                        } else {
                            const colorMixRatio = (ny + 1) / 2
                            baseColor.lerpColors(color2, color1, colorMixRatio)
                        }

                        for (let i = 0; i < density; i++) {
                            accumulator += 1.0

                            if (
                                accumulator >= step &&
                                idx1 < finalTotalParticles
                            ) {
                                accumulator -= step

                                // Spherical distribution for the rounded bevel edge
                                const u = Math.random()
                                const v = Math.random()
                                const theta = u * PI2
                                const phi = Math.acos(2.0 * v - 1.0)

                                // Bias towards core for solid look
                                const r = Math.pow(Math.random(), 1.5)

                                // Bevel forms the rounded XYZ shape of the individual cluster
                                const localX =
                                    r * Math.sin(phi) * Math.cos(theta) * bevel
                                const localY =
                                    r * Math.sin(phi) * Math.sin(theta) * bevel
                                const localZ = r * Math.cos(phi) * bevel

                                // Volume Depth strictly extrudes along the Z axis
                                const extZ =
                                    (Math.random() - 0.5) * 2.0 * volumeDepth

                                positions[idx3] = nx * logoScale + localX
                                positions[idx3 + 1] = ny * logoScale + localY
                                positions[idx3 + 2] = extZ + localZ

                                // Normal calculation based primarily on the bevel rounding for cinematic light reflection
                                const nLen =
                                    Math.sqrt(
                                        localX * localX +
                                            localY * localY +
                                            localZ * localZ
                                    ) || 1.0
                                normals[idx3] = localX / nLen
                                normals[idx3 + 1] = localY / nLen
                                normals[idx3 + 2] = localZ / nLen

                                // Color variation
                                mixedColor.copy(baseColor)
                                const hueShift =
                                    (Math.random() - 0.5) *
                                    (props.useOriginalColors ? 0.02 : 0.03)
                                mixedColor.offsetHSL(hueShift, 0, 0)

                                colors[idx3] = mixedColor.r
                                colors[idx3 + 1] = mixedColor.g
                                colors[idx3 + 2] = mixedColor.b

                                randoms[idx1] = Math.random()

                                idx3 += 3
                                idx1 += 1
                            }
                        }
                    }
                }
            }

            const geometry = new THREE.BufferGeometry()
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            )
            geometry.setAttribute(
                "aColor",
                new THREE.BufferAttribute(colors, 3)
            )
            geometry.setAttribute(
                "aNormal",
                new THREE.BufferAttribute(normals, 3)
            )
            geometry.setAttribute(
                "aRandom",
                new THREE.BufferAttribute(randoms, 1)
            )

            // Ensures trailing 0s from float discrepancies aren't drawn at coordinates 0,0,0
            geometry.setDrawRange(0, idx1)
            // Prevent expensive and unnecessary bounds recalculation
            geometry.computeBoundingSphere()

            const lightVec = new THREE.Vector3(1.0, 1.0, 1.0).normalize()

            uniforms = {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector3(0, 0, 0) },
                uHoverStrength: { value: 0.0 },
                uMouseRadius: { value: props.mouseRadius / 100 },
                uMouseForce: { value: props.mouseForce / 100 },
                uParticleSize: {
                    value: props.particleSize * renderer.getPixelRatio(),
                },
                uNoiseSpeed: { value: props.animationSpeed / 100 },
                uNoiseAmplitude: { value: props.noiseAmplitude / 100 },
                uLightColor: { value: new THREE.Color(props.lightColor) },
                uShadowColor: { value: new THREE.Color(props.shadowColor) },
                uLightDir: { value: lightVec },
                uDepthVolume: { value: volumeDepth + bevel },
            }

            const material = new THREE.ShaderMaterial({
                uniforms: uniforms,
                vertexShader: `
                    uniform float uTime;
                    uniform vec3 uMouse;
                    uniform float uHoverStrength;
                    uniform float uMouseRadius;
                    uniform float uMouseForce;
                    uniform float uParticleSize;
                    uniform float uNoiseSpeed;
                    uniform float uNoiseAmplitude;
                    
                    attribute vec3 aColor;
                    attribute vec3 aNormal;
                    attribute float aRandom;
                    
                    varying vec3 vColor;
                    varying vec3 vNormal;
                    varying vec3 vMvPos;
                    varying float vLocalZ;

                    // Simplex Curl Noise
                    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                    float snoise(vec3 v) {
                        const vec2  C = vec2(1.0/6.0, 1.0/3.0);
                        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                        vec3 i  = floor(v + dot(v, C.yyy) );
                        vec3 x0 = v - i + dot(i, C.xxx) ;
                        vec3 g = step(x0.yzx, x0.xyz);
                        vec3 l = 1.0 - g;
                        vec3 i1 = min( g.xyz, l.zxy );
                        vec3 i2 = max( g.xyz, l.zxy );
                        vec3 x1 = x0 - i1 + C.xxx;
                        vec3 x2 = x0 - i2 + C.yyy;
                        vec3 x3 = x0 - D.yyy;
                        i = mod289(i);
                        vec4 p = permute( permute( permute(
                                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                        vec3  ns = 0.142857142857 * D.wyz - D.xzx;
                        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
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
                        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                        m = m * m;
                        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                    }
                    vec3 curlNoise( vec3 p ){
                        const float e = 0.1;
                        vec3 dx = vec3( e   , 0.0 , 0.0 );
                        vec3 dy = vec3( 0.0 , e   , 0.0 );
                        vec3 dz = vec3( 0.0 , 0.0 , e   );
                        vec3 p_x0 = vec3( snoise(p - dx), snoise(p - dx + 13.5), snoise(p - dx + 31.2) );
                        vec3 p_x1 = vec3( snoise(p + dx), snoise(p + dx + 13.5), snoise(p + dx + 31.2) );
                        vec3 p_y0 = vec3( snoise(p - dy), snoise(p - dy + 13.5), snoise(p - dy + 31.2) );
                        vec3 p_y1 = vec3( snoise(p + dy), snoise(p + dy + 13.5), snoise(p - dy + 31.2) );
                        vec3 p_z0 = vec3( snoise(p - dz), snoise(p - dz + 13.5), snoise(p - dz + 31.2) );
                        vec3 p_z1 = vec3( snoise(p + dz), snoise(p + dz + 13.5), snoise(p + dz + 31.2) );
                        float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
                        float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
                        float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
                        return normalize( vec3( x , y , z ) );
                    }

                    void main() {
                        vColor = aColor;
                        vLocalZ = position.z;
                        vec3 pos = position;

                        // Idle Ambient Fluid Motion
                        vec3 idleNoise = curlNoise(pos * 1.5 + uTime * uNoiseSpeed + aRandom * 10.0);
                        pos += idleNoise * uNoiseAmplitude;

                        // Dynamic, Smooth "Scatter Sand" Effect
                        vec3 dirToMouse = pos - uMouse;
                        float distToMouse = length(dirToMouse);
                        
                        // Extremely smooth transition curve for the scatter radius
                        float influence = smoothstep(uMouseRadius, uMouseRadius * 0.1, distToMouse) * uHoverStrength;
                        
                        if (influence > 0.0) {
                            vec3 normDir = normalize(dirToMouse);
                            
                            // Creates a beautiful swirling vortex perpendicular to the mouse direction
                            vec3 vortex = cross(normDir, vec3(0.0, 0.0, 1.0));
                            
                            // Chaotic fluid curling for sand storm texture
                            vec3 sandCurl = curlNoise(pos * 2.5 - uTime * 1.2);
                            
                            // Blend outward push, twisting vortex, and chaotic curl
                            vec3 fluidScatter = (normDir * 0.3 + vortex * 0.5 + sandCurl * 0.8);
                            
                            pos += fluidScatter * influence * uMouseForce;
                        }

                        // Normal perturbation for dynamic glittering lighting
                        vec3 finalNormal = normalize(aNormal + idleNoise * 0.2);
                        vNormal = normalMatrix * finalNormal;

                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        vMvPos = mvPosition.xyz;
                        
                        // Size attenuation
                        gl_PointSize = uParticleSize * (10.0 / -mvPosition.z);
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform vec3 uLightColor;
                    uniform vec3 uShadowColor;
                    uniform vec3 uLightDir;
                    uniform float uDepthVolume;
                    
                    varying vec3 vColor;
                    varying vec3 vNormal;
                    varying vec3 vMvPos;
                    varying float vLocalZ;

                    void main() {
                        vec2 coord = gl_PointCoord - vec2(0.5);
                        float dist = length(coord);
                        
                        // STRICT FIX FOR "WEIRD ANGLES": 
                        // Sharp circular cutout combined with depthWrite: true ensures flawless 
                        // Z-sorting of dense 3D volumes at any camera rotation angle.
                        if (dist > 0.5) discard; 

                        // Micro-normal mapping to make particles perfectly spherical for lighting
                        float z = sqrt(max(0.0, 0.25 - dist * dist));
                        vec3 microNormal = normalize(vec3(coord.x, -coord.y, z));
                        vec3 normal = normalize(vNormal * 0.7 + microNormal * 0.3);

                        // Cinematic Lighting
                        vec3 viewDir = normalize(-vMvPos);
                        vec3 lightDir = normalize(uLightDir);
                        
                        float diff = max(dot(normal, lightDir), 0.0);
                        
                        // Fake Volumetric Ambient Occlusion based on depth
                        // Particles deeper inside the volume become darker naturally
                        float ao = smoothstep(-uDepthVolume, uDepthVolume, vLocalZ);
                        
                        vec3 diffuse = diff * uLightColor * (0.3 + 0.7 * ao);
                        // Increase base ambient slightly to prevent pitch blackness from the rear view
                        vec3 ambient = mix(uShadowColor, uLightColor, 0.15) * (1.0 - ao * 0.7);
                        
                        // Sharp Specular highlights for grit/sand realism
                        vec3 halfVector = normalize(lightDir + viewDir);
                        float spec = pow(max(dot(normal, halfVector), 0.0), 32.0);
                        vec3 specular = spec * uLightColor * ao * 1.5;

                        // Final composition
                        vec3 finalColor = vColor * (diffuse + ambient) + specular;
                        
                        // Write full alpha to ensure depth buffer is populated correctly
                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                transparent: false,
                depthWrite: true,
                depthTest: true,
            })

            particleSystem = new THREE.Points(geometry, material)
            particleSystem.frustumCulled = false
            scene.add(particleSystem)
        }

        const renderLoop = () => {
            if (!renderer || !scene || !camera) return

            if (uniforms && shouldAnimate) {
                uniforms.uTime.value += 0.016

                // Smoothly lerp hover strength for natural settling of sand
                const targetHover = isHovering.current ? 1.0 : 0.0
                uniforms.uHoverStrength.value +=
                    (targetHover - uniforms.uHoverStrength.value) * 0.05

                // Smoothly track mouse position in 3D space
                if (isHovering.current) {
                    uniforms.uMouse.value.lerp(targetMouse.current, 0.1)
                }
            }

            // Smooth Camera Orbit Logic
            const lerpFactor = shouldAnimate ? 0.08 : 1.0
            cameraAngle.current.theta +=
                (targetCameraAngle.current.theta - cameraAngle.current.theta) *
                lerpFactor
            cameraAngle.current.phi +=
                (targetCameraAngle.current.phi - cameraAngle.current.phi) *
                lerpFactor

            camera.position.setFromSphericalCoords(
                props.cameraDistance,
                cameraAngle.current.phi,
                cameraAngle.current.theta
            )
            camera.lookAt(0, 0, 0)

            renderer.render(scene, camera)

            if (shouldAnimate && isIntersecting.current) {
                frameId = requestAnimationFrame(renderLoop)
            }
        }

        initScene()
        loadImageAndCreateParticles()

        // Setup Observers
        const resizeObserver = new ResizeObserver(() => {
            if (!container || !camera || !renderer) return
            const width = container.clientWidth
            const height = container.clientHeight
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
            if (!shouldAnimate) renderLoop()
        })
        resizeObserver.observe(container)

        const visibilityObserver = new IntersectionObserver(([entry]) => {
            isIntersecting.current = entry.isIntersecting
            if (isIntersecting.current && shouldAnimate) {
                cancelAnimationFrame(frameId)
                renderLoop()
            }
        })
        visibilityObserver.observe(container)

        // Interaction Event Handlers
        const onPointerDown = (e) => {
            if (!props.enableRotation) return
            isDragging.current = true
            lastPointer.current = { x: e.clientX, y: e.clientY }
        }

        const onPointerMove = (e) => {
            // Drag to Rotate 360
            if (isDragging.current && props.enableRotation) {
                const deltaX = e.clientX - lastPointer.current.x
                const deltaY = e.clientY - lastPointer.current.y
                targetCameraAngle.current.theta -=
                    deltaX * (props.rotationSpeed / 10000)
                targetCameraAngle.current.phi -=
                    deltaY * (props.rotationSpeed / 10000)

                targetCameraAngle.current.phi = Math.max(
                    0.1,
                    Math.min(Math.PI - 0.1, targetCameraAngle.current.phi)
                )

                lastPointer.current = { x: e.clientX, y: e.clientY }
                if (!shouldAnimate) renderLoop()
            }

            // Raycaster for Sand Scatter
            // Calculate a plane at Z=0 that always faces the camera to ensure raycast works at any rotation
            const planeNormal = new THREE.Vector3()
                .subVectors(camera.position, new THREE.Vector3(0, 0, 0))
                .normalize()
            intersectionPlane.set(planeNormal, 0)

            const rect = container.getBoundingClientRect()
            const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
            const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1

            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera)
            const intersectPoint = new THREE.Vector3()

            if (
                raycaster.ray.intersectPlane(intersectionPlane, intersectPoint)
            ) {
                isHovering.current = true
                targetMouse.current.copy(intersectPoint)
            } else {
                isHovering.current = false
            }

            if (!shouldAnimate && !isDragging.current) renderLoop()
        }

        const onPointerUp = () => {
            isDragging.current = false
        }

        const onPointerLeave = () => {
            isDragging.current = false
            isHovering.current = false
            if (!shouldAnimate) renderLoop()
        }

        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointerleave", onPointerLeave)

        // Strict Cleanup for Framer Stability
        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            visibilityObserver.disconnect()

            if (container) {
                container.removeEventListener("pointerdown", onPointerDown)
                container.removeEventListener("pointermove", onPointerMove)
                container.removeEventListener("pointerup", onPointerUp)
                container.removeEventListener("pointerleave", onPointerLeave)
            }

            if (scene) {
                scene.traverse((object) => {
                    if (object.geometry) object.geometry.dispose()
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach((m) => m.dispose())
                        } else {
                            object.material.dispose()
                        }
                    }
                })
                scene.clear()
            }

            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement)
                }
            }
        }
    }, [
        props.logoImage,
        props.useOriginalColors,
        props.particleDensity,
        props.particleSize,
        props.volumeDepth,
        props.bevel,
        props.logoScale,
        props.color1,
        props.color2,
        props.lightColor,
        props.shadowColor,
        props.animationSpeed,
        props.noiseAmplitude,
        props.mouseRadius,
        props.mouseForce,
        props.cameraDistance,
        props.enableRotation,
        props.rotationSpeed,
        shouldAnimate,
    ])

    return (
        <div
            ref={mountRef}
            // Passing rawProps.style allows native Framer layout shifts & properties to apply instantly without being debounced
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                backgroundColor: "transparent",
                overflow: "hidden",
                touchAction: "none",
                cursor: rawProps.enableRotation
                    ? isDragging.current
                        ? "grabbing"
                        : "grab"
                    : "default",
                ...rawProps.style,
            }}
        />
    )
}

CinematicSandLogo.defaultProps = {
    editorPreview: true,
    appearance: {
        logoImage: DEFAULT_LOGO,
        useOriginalColors: true,
        color1: "#FFFFFF",
        color2: "#8F8F8F",
        particleDensity: 30,
        particleSize: 1.4,
        volumeDepth: 2,
        bevel: 1,
        logoScale: 20,
        cameraDistance: 6,
    },
    lighting: {
        lightColor: "#CCCCCC",
        shadowColor: "#0D0D0D",
    },
    interaction: {
        enableRotation: true,
        rotationSpeed: 153,
        mouseRadius: 200,
        mouseForce: 10,
    },
    behavior: {
        animationSpeed: 4,
        noiseAmplitude: 5,
    },
}

addPropertyControls(CinematicSandLogo, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            logoImage: {
                type: ControlType.Image,
                title: "Logo Source",
            },
            useOriginalColors: {
                type: ControlType.Boolean,
                title: "Use SVG Colors",
                defaultValue: true,
                description: "Extract original logo colors.",
            },
            color1: {
                type: ControlType.Color,
                title: "Highlight Color",
                defaultValue: "#FFFFFF",
                hidden(props) {
                    return props.useOriginalColors === true
                },
            },
            color2: {
                type: ControlType.Color,
                title: "Midtone Color",
                defaultValue: "#8F8F8F",
                hidden(props) {
                    return props.useOriginalColors === true
                },
            },
            particleDensity: {
                type: ControlType.Number,
                title: "Density (x)",
                defaultValue: 30,
                min: 1,
                max: 30, // Adjusted max density for better safety scaling
                step: 1,
                description: "Extreme particle count for solid volume.",
            },
            particleSize: {
                type: ControlType.Number,
                title: "Sand Size (px)",
                defaultValue: 1.4,
                min: 0.5,
                max: 10.0,
                step: 0.1,
                description: "Size of individual grains.",
            },
            volumeDepth: {
                type: ControlType.Number,
                title: "Volume Depth (%)",
                defaultValue: 2,
                min: 0,
                max: 200,
                description: "Extrudes 3D depth straight back.",
            },
            bevel: {
                type: ControlType.Number,
                title: "Bevel / Rounding (%)",
                defaultValue: 1,
                min: 0,
                max: 100,
                description: "Puffs out edges for a rounded 3D look.",
            },
            logoScale: {
                type: ControlType.Number,
                title: "Scale (%)",
                defaultValue: 20,
                min: 10,
                max: 100,
            },
            cameraDistance: {
                type: ControlType.Number,
                title: "Cam Dist (m)",
                defaultValue: 6,
                min: 2,
                max: 20,
                step: 0.5,
            },
        },
    },
    lighting: {
        type: ControlType.Object,
        title: "Cinematic Lights",
        controls: {
            lightColor: {
                type: ControlType.Color,
                title: "Sunlight",
                defaultValue: "#CCCCCC",
                description: "Bright light hitting outer sand.",
            },
            shadowColor: {
                type: ControlType.Color,
                title: "Deep Shadow",
                defaultValue: "#0D0D0D",
                description: "Ambient occlusion interior color.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        controls: {
            enableRotation: {
                type: ControlType.Boolean,
                title: "Drag to Spin",
                defaultValue: true,
                description: "Allow 360 rotation on hold.",
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Spin Speed (%)",
                defaultValue: 153,
                min: 10,
                max: 200,
                hidden(props) {
                    return !props.enableRotation
                },
            },
            mouseRadius: {
                type: ControlType.Number,
                title: "Scatter Area (px)",
                defaultValue: 200,
                min: 0,
                max: 500,
                description: "Radius of the smooth sand storm.",
            },
            mouseForce: {
                type: ControlType.Number,
                title: "Scatter Power (%)",
                defaultValue: 10,
                min: 0,
                max: 200,
                description: "Energy of the swirling scatter.",
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Physics",
        controls: {
            animationSpeed: {
                type: ControlType.Number,
                title: "Idle Speed (%)",
                defaultValue: 4,
                min: 0,
                max: 200,
                description: "Base ambient movement.",
            },
            noiseAmplitude: {
                type: ControlType.Number,
                title: "Idle Sway (%)",
                defaultValue: 5,
                min: 0,
                max: 150,
                description: "Natural drift size.",
            },
        },
    },
})
