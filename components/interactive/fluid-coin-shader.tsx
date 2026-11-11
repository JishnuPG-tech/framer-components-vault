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


/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 100
 * @framerIntrinsicHeight 100
 */
export default function SmoothCoin(incomingProps) {
    // Flatten organized property objects into a single props object
    // to maintain perfect compatibility with all the original physics/math.
    const props = {
        ...incomingProps,
        ...(incomingProps.logo || {}),
        ...(incomingProps.shape || {}),
        ...(incomingProps.position || {}),
        ...(incomingProps.gradient || {}),
    }

    const mountRef = useRef(null)

    useEffect(() => {
        if (!mountRef.current) return
        if (!props.livePreview) return

        let animationFrameId
        let isVisible = true
        const container = mountRef.current

        // PERFORMANCE OPTIMIZATION: Detect Framer Canvas
        // Drops geometric density and pixel ratio to 30% in editor for zero-lag editing
        const isCanvas = RenderTarget.current() === RenderTarget.canvas
        const qScale = isCanvas ? 0.3 : 1.0

        // 1. Core Scene Setup
        const scene = new THREE.Scene()
        // scene.background removed to allow the HTML div's background color (supporting opacity) to show through

        const width = container.clientWidth
        const height = container.clientHeight

        // Dynamic camera distance preventing clipping at extremely high thickness levels (like 20)
        const camDistance = 9 + Math.max(0, props.bottomThickness * 0.8)
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150)
        camera.position.set(0, 0, camDistance)

        const renderer = new THREE.WebGLRenderer({
            antialias: !isCanvas,
            alpha: true, // This allows the background to be completely transparent from WebGL
            powerPreference: "high-performance",
        })

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * qScale)
        renderer.setSize(width, height)
        container.appendChild(renderer.domElement)

        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                isVisible = entries[0].isIntersecting
            },
            { threshold: 0.0 }
        )
        intersectionObserver.observe(container)

        // 2. High-Fidelity Lighting Setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientLight)

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.65)
        dirLight.position.set(3, 8, 5)
        scene.add(dirLight)

        const rimLight = new THREE.SpotLight(0xa0b0ff, 0.8)
        rimLight.position.set(-6, -6, 2)
        rimLight.lookAt(0, 0, 0)
        scene.add(rimLight)

        // 3. Extruded Geometry Base Shape (Perfect Rounding Math)
        const extent = 1.6
        const radiusPercent =
            typeof props.coinRadius === "number" ? props.coinRadius : 100
        const eps = 0.0001
        const r3d = Math.max(
            eps,
            Math.min(extent, (radiusPercent / 100) * extent)
        ) // Enforce boundaries securely

        const shape = new THREE.Shape()
        // Perfect corner rounding math mapped safely dynamically with strict precision clamps above
        shape.moveTo(extent, extent - r3d)
        shape.absarc(extent - r3d, extent - r3d, r3d, 0, Math.PI / 2, false)
        shape.lineTo(-extent + r3d, extent)
        shape.absarc(
            -extent + r3d,
            extent - r3d,
            r3d,
            Math.PI / 2,
            Math.PI,
            false
        )
        shape.lineTo(-extent, -extent + r3d)
        shape.absarc(
            -extent + r3d,
            -extent + r3d,
            r3d,
            Math.PI,
            Math.PI * 1.5,
            false
        )
        shape.lineTo(extent - r3d, -extent)
        shape.absarc(
            extent - r3d,
            -extent + r3d,
            r3d,
            Math.PI * 1.5,
            Math.PI * 2,
            false
        )
        shape.lineTo(extent, extent - r3d)
        shape.closePath()

        const sharedExtrudeSettings = {
            bevelEnabled: true,
            bevelSegments: isCanvas ? 2 : 5,
            steps: 1,
            bevelSize: 0.04,
            bevelThickness: 0.04,
            curveSegments: isCanvas ? 12 : 48,
        }

        const topGeo = new THREE.ExtrudeGeometry(shape, {
            ...sharedExtrudeSettings,
            depth: props.topThickness,
        })

        const bottomGeo = new THREE.ExtrudeGeometry(shape, {
            ...sharedExtrudeSettings,
            depth: props.bottomThickness,
        })
        bottomGeo.rotateX(Math.PI)

        // 4. Ultra-High Resolution Base Texture Generation
        const size = isCanvas ? 512 : 2048
        const cvs = document.createElement("canvas")
        cvs.width = size
        cvs.height = size
        const ctx = cvs.getContext("2d", { willReadFrequently: true })

        const bumpCvs = document.createElement("canvas")
        bumpCvs.width = size
        bumpCvs.height = size
        const bumpCtx = bumpCvs.getContext("2d", { willReadFrequently: true })

        const tex = new THREE.CanvasTexture(cvs)
        const bumpTex = new THREE.CanvasTexture(bumpCvs)
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        bumpTex.anisotropy = renderer.capabilities.getMaxAnisotropy()

        tex.repeat.set(1 / (extent * 2), 1 / (extent * 2))
        tex.offset.set(0.5, 0.5)
        bumpTex.repeat.set(1 / (extent * 2), 1 / (extent * 2))
        bumpTex.offset.set(0.5, 0.5)

        const generateTextures = (loadedImage = null) => {
            const centerColor = new THREE.Color(props.themeColor)
            const edgeColor = centerColor.clone().offsetHSL(0.02, -0.05, -0.35)

            const grad = ctx.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 1.5
            )
            grad.addColorStop(0, `#${centerColor.getHexString()}`)
            grad.addColorStop(1, `#${edgeColor.getHexString()}`)
            ctx.fillStyle = grad
            ctx.fillRect(0, 0, size, size)

            const imgData = ctx.getImageData(0, 0, size, size)
            for (let i = 0; i < imgData.data.length; i += 4) {
                const noise = (Math.random() - 0.5) * 40
                imgData.data[i] = Math.min(
                    255,
                    Math.max(0, imgData.data[i] + noise)
                )
                imgData.data[i + 1] = Math.min(
                    255,
                    Math.max(0, imgData.data[i + 1] + noise)
                )
                imgData.data[i + 2] = Math.min(
                    255,
                    Math.max(0, imgData.data[i + 2] + noise)
                )
            }
            ctx.putImageData(imgData, 0, 0)
            bumpCtx.putImageData(imgData, 0, 0)

            const drawDetails = (context, isBump) => {
                context.save()

                if (!isBump) {
                    context.shadowColor = "rgba(0,0,0,0.6)"
                    context.shadowBlur = 30
                    context.shadowOffsetY = 15
                }

                const inset = size * 0.05
                const w = size - inset * 2
                const rCanvas = Math.max(
                    0.1,
                    Math.min(w / 2, (radiusPercent / 100) * (w / 2))
                )

                // Proper true circle / rounded rect paths via canvas 2d Context
                context.beginPath()
                if (typeof context.roundRect === "function") {
                    context.roundRect(inset, inset, w, w, rCanvas)
                } else {
                    context.moveTo(inset + rCanvas, inset)
                    context.arcTo(
                        inset + w,
                        inset,
                        inset + w,
                        inset + w,
                        rCanvas
                    )
                    context.arcTo(
                        inset + w,
                        inset + w,
                        inset,
                        inset + w,
                        rCanvas
                    )
                    context.arcTo(inset, inset + w, inset, inset, rCanvas)
                    context.arcTo(inset, inset, inset + w, inset, rCanvas)
                }
                context.closePath()

                context.lineWidth = size * 0.022
                context.strokeStyle = isBump
                    ? "#ffffff"
                    : `#${centerColor.clone().offsetHSL(0.05, 0.1, 0.2).getHexString()}`
                context.stroke()

                const baseDim = size * 0.4
                const dim = baseDim * props.logoScale
                const x = (size - dim) / 2
                const y = (size - dim) / 2

                if (loadedImage) {
                    const offCvs = document.createElement("canvas")
                    offCvs.width = dim
                    offCvs.height = dim
                    const oCtx = offCvs.getContext("2d")
                    oCtx.imageSmoothingEnabled = true
                    oCtx.imageSmoothingQuality = "high"

                    oCtx.drawImage(loadedImage, 0, 0, dim, dim)
                    oCtx.globalCompositeOperation = "source-in"
                    oCtx.fillStyle = isBump ? "#ffffff" : props.logoColor
                    oCtx.fillRect(0, 0, dim, dim)
                    context.drawImage(offCvs, x, y)
                } else {
                    context.fillStyle = isBump ? "#ffffff" : props.logoColor
                    context.textAlign = "center"
                    context.textBaseline = "middle"
                    context.font = `bold ${size * 0.22 * props.logoScale}px sans-serif`
                    context.fillText(
                        "$",
                        size / 2,
                        size / 2 + size * 0.012 * props.logoScale
                    )
                }

                context.restore()
            }

            drawDetails(ctx, false)
            drawDetails(bumpCtx, true)

            tex.needsUpdate = true
            bumpTex.needsUpdate = true
        }

        requestAnimationFrame(() => {
            generateTextures(null)
            if (props.logoImage) {
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.src = props.logoImage
                img.onload = () => generateTextures(img)
            }
        })

        // 5. Unlimited Color Gradient Setup
        const getSatColor = (hexCode) => {
            const c = new THREE.Color(hexCode)
            const hsl = { h: 0, s: 0, l: 0 }
            c.getHSL(hsl)
            c.setHSL(
                hsl.h,
                Math.min(1.0, Math.max(0.0, hsl.s * props.gradientSaturation)),
                hsl.l
            )
            return c
        }

        const rampSize = 512
        const rampCvs = document.createElement("canvas")
        rampCvs.width = rampSize
        rampCvs.height = 1
        const rampCtx = rampCvs.getContext("2d")
        const rampTex = new THREE.CanvasTexture(rampCvs)

        const updateGradientRamp = () => {
            const grad = rampCtx.createLinearGradient(0, 0, rampSize, 0)
            const colors =
                props.gradientColors && props.gradientColors.length > 0
                    ? props.gradientColors
                    : ["#6100FF", "#FFA600", "#007BFF"]

            colors.forEach((c, i) => {
                const step = colors.length > 1 ? i / (colors.length - 1) : 0
                grad.addColorStop(step, `#${getSatColor(c).getHexString()}`)
            })

            rampCtx.fillStyle = grad
            rampCtx.fillRect(0, 0, rampSize, 1)
            rampTex.needsUpdate = true
        }
        updateGradientRamp()

        // 6. Materials Setup
        const coinMat = new THREE.MeshPhysicalMaterial({
            map: tex,
            bumpMap: bumpTex,
            bumpScale: 0.12,
            roughness: 0.45,
            metalness: 0.75,
            clearcoat: 0.1,
            clearcoatRoughness: 0.3,
        })

        const edgeCvs = document.createElement("canvas")
        edgeCvs.width = isCanvas ? 256 : 1024
        edgeCvs.height = isCanvas ? 64 : 128
        const eCtx = edgeCvs.getContext("2d", { willReadFrequently: true })
        const eData = eCtx.createImageData(edgeCvs.width, edgeCvs.height)
        for (let i = 0; i < eData.data.length; i += 4) {
            const n = 60 + Math.random() * 80
            eData.data[i] = eData.data[i + 1] = eData.data[i + 2] = n
            eData.data[i + 3] = 255
        }
        eCtx.putImageData(eData, 0, 0)
        const edgeTex = new THREE.CanvasTexture(edgeCvs)
        edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping

        const edgeMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(props.themeColor).offsetHSL(
                0.05,
                -0.3,
                -0.15
            ),
            bumpMap: edgeTex,
            bumpScale: 0.04,
            roughness: 0.55,
            metalness: 0.7,
        })

        const flowMap = {
            right: 0.0,
            left: 1.0,
            top: 2.0,
            bottom: 3.0,
            splash: 4.0,
        }

        // Dynamic Shader Mapping for Unlimited Colors + Hover Saturation Addition
        const shaderCoreMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uFlowType: { value: flowMap[props.gradientFlow] || 4.0 },
                uFadeEnabled: { value: props.gradientFade ? 1.0 : 0.0 },
                uThickness: { value: props.bottomThickness },
                uColorRamp: { value: rampTex },
                uHoverFactor: { value: 0.0 },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uFlowType;
                uniform float uFadeEnabled;
                uniform float uThickness;
                uniform float uHoverFactor;
                uniform sampler2D uColorRamp;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                    vec3 pos = vPosition * 0.45;
                    float t = uTime; 
                    
                    float mixVal = 0.5;

                    // Physical fluid streaking mathematics (Translates along axis, stretches perpendicular)
                    if (uFlowType < 0.5) { // Right Flow (X streak)
                        vec3 f = pos; f.x -= t * 2.0;
                        float n1 = sin(f.y * 4.0 + f.x * 0.5);
                        float n2 = cos(f.y * 2.5 - f.x * 1.2 + f.z * 3.0);
                        float n3 = sin(f.y * 5.0 + f.x * 0.2 - t);
                        mixVal = (n1 + n2 + n3) * 0.33 + 0.5;
                    } else if (uFlowType < 1.5) { // Left Flow (X streak)
                        vec3 f = pos; f.x += t * 2.0;
                        float n1 = sin(f.y * 4.0 + f.x * 0.5);
                        float n2 = cos(f.y * 2.5 - f.x * 1.2 + f.z * 3.0);
                        float n3 = sin(f.y * 5.0 + f.x * 0.2 - t);
                        mixVal = (n1 + n2 + n3) * 0.33 + 0.5;
                    } else if (uFlowType < 2.5) { // Top Flow (Y streak)
                        vec3 f = pos; f.y -= t * 2.0;
                        float n1 = sin(f.x * 4.0 + f.y * 0.5);
                        float n2 = cos(f.x * 2.5 - f.y * 1.2 + f.z * 3.0);
                        float n3 = sin(f.x * 5.0 + f.y * 0.2 - t);
                        mixVal = (n1 + n2 + n3) * 0.33 + 0.5;
                    } else if (uFlowType < 3.5) { // Bottom Waterfall (Y streak)
                        vec3 f = pos; f.y += t * 2.0;
                        float n1 = sin(f.x * 4.0 + f.y * 0.5);
                        float n2 = cos(f.x * 2.5 - f.y * 1.2 + f.z * 3.0);
                        float n3 = sin(f.x * 5.0 + f.y * 0.2 - t);
                        mixVal = (n1 + n2 + n3) * 0.33 + 0.5;
                    } else { // Splash
                        float n1 = sin(pos.x * 2.8 + pos.z * 3.0 + t) * cos(pos.y * 2.8 - t * 0.7);
                        float n2 = sin(pos.x * -3.1 - t * 1.3) * cos(pos.y * 3.1 + pos.z * 2.0 + t * 1.1);
                        float n3 = sin((pos.x + pos.y + pos.z) * 2.2 + t * 0.9);
                        mixVal = (n1 + n2 + n3) * 0.33 + 0.5;
                    }
                    
                    float clampedMix = clamp(mixVal, 0.01, 0.99);
                    vec3 finalColor = texture2D(uColorRamp, vec2(clampedMix, 0.5)).rgb;

                    // Add Fresnel Edge wrapper grabbing end color of the array
                    vec3 fresnelColor = texture2D(uColorRamp, vec2(0.99, 0.5)).rgb;
                    float viewFactor = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    float fresnel = smoothstep(0.0, 1.0, 1.0 - viewFactor);
                    finalColor += fresnelColor * fresnel * 0.45;
                    
                    // Explicit Hover Saturation Injector (Oversaturates dynamically, no glow geometry added)
                    float lum = dot(finalColor, vec3(0.299, 0.587, 0.114));
                    vec3 grayscale = vec3(lum);
                    finalColor = mix(grayscale, finalColor, 1.0 + (uHoverFactor * 0.8)); // +80% Saturation cleanly
                    
                    if (uFadeEnabled > 0.5) {
                        float depthNorm = abs(vPosition.z) / max(uThickness, 0.001);
                        finalColor *= smoothstep(1.0, 0.1, depthNorm); 
                    }

                    // ANTI-BANDING DITHERING: Neutralizes harsh stripping cleanly 
                    float ditherNoise = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
                    finalColor += (ditherNoise / 255.0) * 4.0;

                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
        })

        const coinGroup = new THREE.Group()
        coinGroup.scale.setScalar(props.coinScale)
        coinGroup.position.x = props.posX
        coinGroup.position.y = props.posY

        const topCoinChunk = new THREE.Mesh(topGeo, [coinMat, edgeMat])
        const bottomShaderChunk = new THREE.Mesh(bottomGeo, [
            shaderCoreMat,
            shaderCoreMat,
        ])

        // Exact mathematical center pivot offset to perfectamente balance the rotation axis for any thickness
        const pivotOffsetZ = -(props.topThickness - props.bottomThickness) / 2
        topCoinChunk.position.z = pivotOffsetZ
        bottomShaderChunk.position.z = pivotOffsetZ

        coinGroup.add(topCoinChunk)
        coinGroup.add(bottomShaderChunk)

        coinGroup.rotation.order = "YXZ"
        scene.add(coinGroup)

        // 7. Interactive Physics Setup (Raycaster Hover Tracking & Exact Drag Addition Math)
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2(-10, -10)

        let isDragging = false
        let hoverFactor = 0.0
        let prevPointer = { x: 0, y: 0 }
        let velocity = { x: 0, y: 0 }

        const currentRot = {
            x: (props.tiltX * Math.PI) / 180,
            y: (props.tiltY * Math.PI) / 180,
            z: (props.tiltZ * Math.PI) / 180,
        }

        container.style.cursor = "grab"

        const onPointerDown = (e) => {
            isDragging = true
            prevPointer = { x: e.clientX, y: e.clientY }
            velocity = { x: 0, y: 0 }
            container.style.cursor = "grabbing"
        }

        const onPointerMove = (e) => {
            // Track physical pointer for 3D Geometric mesh hitting
            const rect = container.getBoundingClientRect()
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

            if (!isDragging) return
            const deltaX = e.clientX - prevPointer.x
            const deltaY = e.clientY - prevPointer.y

            // Addition maps pointer movement directly to object spin naturally in all axes
            currentRot.y += deltaX * 0.01
            currentRot.x += deltaY * 0.01

            velocity = { x: deltaX * 0.01, y: deltaY * 0.01 }
            prevPointer = { x: e.clientX, y: e.clientY }
        }

        const onPointerUp = () => {
            isDragging = false
            container.style.cursor = "grab"
        }

        const onPointerLeave = () => {
            mouse.x = -10
            mouse.y = -10
            isDragging = false
            container.style.cursor = "grab"
        }

        container.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointerleave", onPointerLeave)

        // 8. Time Accumulation Render Engine
        const clock = new THREE.Clock()
        let accumulatedTime = 0
        let lastTime = clock.getElapsedTime()

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            if (!isVisible && !isDragging && !isCanvas) {
                lastTime = clock.getElapsedTime() // Pre-sync time against warp breaks
                return
            }

            const now = clock.getElapsedTime()
            const delta = now - lastTime
            lastTime = now

            // Actual 3D Object ray-intersection target (Not HTML bounding box)
            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(
                coinGroup.children,
                false
            )
            const isHoveringCoin = intersects.length > 0

            const targetHover = isHoveringCoin || isDragging ? 1.0 : 0.0
            hoverFactor += (targetHover - hoverFactor) * 0.1

            // Speed accumulates correctly instead of breaking the shader time sequence
            const speedMod = 1.0 + hoverFactor * 0.6 // Slightly ramps velocity cleanly
            accumulatedTime += delta * (0.6 * props.gradientSpeed) * speedMod

            if (!isDragging) {
                velocity.x *= 0.94
                velocity.y *= 0.94
                currentRot.y += velocity.x
                currentRot.x += velocity.y

                // Fixed: handles 0 properly without defaulting to 1
                const floatIntensity =
                    props.idleFloat !== undefined ? props.idleFloat : 0
                currentRot.x +=
                    Math.sin(accumulatedTime * 3.3) * 0.001 * floatIntensity
                currentRot.y +=
                    Math.cos(accumulatedTime * 2.5) * 0.001 * floatIntensity
                currentRot.z +=
                    Math.sin(accumulatedTime * 2.0) * 0.001 * floatIntensity
            }

            coinGroup.rotation.x = currentRot.x
            coinGroup.rotation.y = currentRot.y
            coinGroup.rotation.z = currentRot.z

            shaderCoreMat.uniforms.uTime.value = accumulatedTime
            shaderCoreMat.uniforms.uHoverFactor.value = hoverFactor
            shaderCoreMat.uniforms.uFlowType.value =
                flowMap[props.gradientFlow] || 4.0

            renderer.render(scene, camera)
        }
        animate()

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const w = entry.contentRect.width
                const h = entry.contentRect.height
                camera.aspect = w / h
                camera.updateProjectionMatrix()
                renderer.setSize(w, h)
            }
        })
        resizeObserver.observe(container)

        // 9. Strict Cleanup
        return () => {
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            intersectionObserver.disconnect()

            container.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)

            if (container && renderer.domElement) {
                container.removeChild(renderer.domElement)
            }
            renderer.dispose()

            topGeo.dispose()
            bottomGeo.dispose()
            coinMat.dispose()
            edgeMat.dispose()
            shaderCoreMat.dispose()
            tex.dispose()
            bumpTex.dispose()
            edgeTex.dispose()
            rampTex.dispose()
        }
    }, [
        props.livePreview,
        props.themeColor,
        props.logoImage,
        props.logoColor,
        props.logoScale,
        props.coinRadius,
        props.coinScale,
        props.posX,
        props.posY,
        props.topThickness,
        props.bottomThickness,
        props.idleFloat,
        props.gradientFlow,
        (props.gradientColors || []).join(","), // Binds dynamic size array
        props.gradientSaturation,
        props.gradientSpeed,
        props.gradientFade,
        props.tiltX,
        props.tiltY,
        props.tiltZ,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "hidden",
                background: props.backgroundColor, // Applied dynamically for proper opacity support via Framer properties
                touchAction: "none",
            }}
        />
    )
}

SmoothCoin.defaultProps = {
    // Base defaults
    livePreview: true,
    backgroundColor: "#000000",
    themeColor: "#4F4F4F",

    // Group defaults
    logo: {
        logoImage:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJN0IDBIMjBWOEgxMkw0IDBaTTQgOEgxMkwyMCAxNkg0VjhaTTQgMTZIMTJWMjRM0AxNloiIGZpbGw9IndoaXRlIi8+PC9zdmc+",
        logoColor: "#FFFFFF",
        logoScale: 1.5,
    },
    shape: {
        coinScale: 1.0,
        coinRadius: 100,
        topThickness: 0.01,
        bottomThickness: 1.61,
    },
    position: {
        posX: 0,
        posY: 0,
        tiltX: -31,
        tiltY: 23,
        tiltZ: -1,
        idleFloat: 0.4,
    },
    gradient: {
        gradientFlow: "bottom",
        gradientColors: ["#6100FF", "#FFA600", "#007BFF"],
        gradientSaturation: 3.0,
        gradientSpeed: 1.3,
        gradientFade: true,
    },
}

addPropertyControls(SmoothCoin, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    themeColor: {
        type: ControlType.Color,
        title: "Theme Color",
        defaultValue: "#4F4F4F",
    },
    logo: {
        type: ControlType.Object,
        title: "Logo Settings",
        controls: {
            logoImage: { type: ControlType.Image, title: "SVG / Image" },
            logoColor: {
                type: ControlType.Color,
                title: "Tint",
                defaultValue: "#FFFFFF",
            },
            logoScale: {
                type: ControlType.Number,
                title: "Scale",
                min: 0.1,
                max: 2.0,
                defaultValue: 1.5,
                step: 0.1,
            },
        },
    },
    shape: {
        type: ControlType.Object,
        title: "Geometry Settings",
        controls: {
            coinScale: {
                type: ControlType.Number,
                title: "Global Scale",
                min: 0.1,
                max: 3.0,
                defaultValue: 1.0,
                step: 0.1,
            },
            coinRadius: {
                type: ControlType.Number,
                title: "Radius %",
                min: 0,
                max: 100,
                defaultValue: 100,
                step: 1,
            },
            topThickness: {
                type: ControlType.Number,
                title: "Top Thick",
                min: 0.01,
                max: 1.0,
                defaultValue: 0.01,
                step: 0.01,
            },
            bottomThickness: {
                type: ControlType.Number,
                title: "Shader Thick",
                min: 0.01,
                max: 20.0,
                defaultValue: 1.61,
                step: 0.1,
            },
        },
    },
    position: {
        type: ControlType.Object,
        title: "Position & Layout",
        controls: {
            posX: {
                type: ControlType.Number,
                title: "Position X",
                min: -10,
                max: 10,
                defaultValue: 0,
                step: 0.1,
            },
            posY: {
                type: ControlType.Number,
                title: "Position Y",
                min: -10,
                max: 10,
                defaultValue: 0,
                step: 0.1,
            },
            tiltX: {
                type: ControlType.Number,
                title: "Persp X",
                min: -90,
                max: 90,
                defaultValue: -31,
                step: 1,
            },
            tiltY: {
                type: ControlType.Number,
                title: "Persp Y",
                min: -90,
                max: 90,
                defaultValue: 23,
                step: 1,
            },
            tiltZ: {
                type: ControlType.Number,
                title: "Persp Z",
                min: -90,
                max: 90,
                defaultValue: -1,
                step: 1,
            },
            idleFloat: {
                type: ControlType.Number,
                title: "Idle Float",
                min: 0.0,
                max: 5.0,
                defaultValue: 0.4,
                step: 0.1,
            },
        },
    },
    gradient: {
        type: ControlType.Object,
        title: "Gradient Flow",
        controls: {
            gradientFlow: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["right", "left", "bottom", "top", "splash"],
                optionTitles: ["Right", "Left", "Bottom", "Top", "Splash"],
                defaultValue: "bottom",
            },
            gradientColors: {
                type: ControlType.Array,
                control: { type: ControlType.Color },
                title: "Colors",
                defaultValue: ["#6100FF", "#FFA600", "#007BFF"],
            },
            gradientSaturation: {
                type: ControlType.Number,
                title: "Saturation",
                min: 0.0,
                max: 3.0,
                defaultValue: 3.0,
                step: 0.05,
            },
            gradientSpeed: {
                type: ControlType.Number,
                title: "Speed",
                min: 0.0,
                max: 5.0,
                defaultValue: 1.3,
                step: 0.1,
            },
            gradientFade: {
                type: ControlType.Boolean,
                title: "Gradual Fade",
                defaultValue: true,
            },
        },
    },
})
