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


// --- Helper Functions ---
const parseColor = (colorStr) => {
    let c = new THREE.Color()
    let a = 1.0
    if (!colorStr) return { color: c, alpha: a }

    if (colorStr.startsWith("rgba") || colorStr.startsWith("hsla")) {
        const parts = colorStr.match(/[\d.]+/g)
        if (parts && parts.length >= 4) {
            a = parseFloat(parts[3])
        }
        c.setStyle(colorStr)
    } else if (colorStr.startsWith("#") && colorStr.length === 9) {
        a = parseInt(colorStr.slice(7, 9), 16) / 255
        c.set(colorStr.slice(0, 7))
    } else {
        c.set(colorStr)
    }
    return { color: c, alpha: a }
}

// --- Icons & UI Styles ---
const LocationIcon = ({ color, shadowColor }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0px 0px 4px ${shadowColor || color})` }}
    >
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5 12 6.5C10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z"
            fill={color}
        />
    </svg>
)

const markerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px 6px 6px",
    borderRadius: "30px",
    background: "rgba(30, 30, 30, 0.4)",
    backgroundImage:
        "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.0) 100%)",
    backdropFilter: "blur(12px) saturate(120%)",
    WebkitBackdropFilter: "blur(12px) saturate(120%)",
    boxShadow:
        "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.2px",
    willChange: "transform, opacity",
}

// GSAP-style buttery easing
const butteryEase = "cubic-bezier(0.16, 1, 0.3, 1)"

export default function VariableDotsGlobe(incomingProps) {
    const props = {
        ...incomingProps,
        ...(incomingProps.layout || {}),
        ...(incomingProps.styling || {}),
        ...(incomingProps.particleSizing || {}),
        ...(incomingProps.interactions || {}),
        ...(incomingProps.uiCustomization || {}),
    }

    const {
        style,
        backgroundColor,
        oceanColorHighlight,
        oceanColorDark,
        oceanColorLight,
        dotColor,
        dotDensity,
        rotationSpeed,
        globeScale,
        positionX,
        positionY,
        baseSize,
        sizeRandomness,
        enableHover,
        hoverDelay,
        hoverParticleColor,
        lensRadius,
        lensMagnification,
        lensBulge,
        lensParticleScale,
        editorPreview,
        markers,
        markerType,
        useCustomCursor,

        cursorColor = "#D4D4D4",
        cursorLineOpacity = 0.2,
        cursorDotSize = 5,
        markerBgColor = "#1E1E23",
        markerIconBgColor = "#2A2A2A",
        markerActiveBgColor = "#FFFFFF",
        markerIconColor = "#FFFFFF",
        markerActiveIconColor = "#111111",
        markerTextColor = "#FFFFFF",
        pinColor = "#FFFFFF",
    } = props

    const isStatic = useIsStaticRenderer()
    const mountRef = useRef(null)
    const cursorRef = useRef(null)
    const isIntersecting = useRef(false)
    const markersRef = useRef(markers)
    const markerElsRef = useRef([])

    const markersDataRef = useRef([])

    const parsedCursor = parseColor(cursorColor)
    const rgbCursor = `${Math.round(parsedCursor.color.r * 255)}, ${Math.round(
        parsedCursor.color.g * 255
    )}, ${Math.round(parsedCursor.color.b * 255)}`

    const parsedPin = parseColor(pinColor)
    const pinShadowColor = `rgba(${Math.round(parsedPin.color.r * 255)}, ${Math.round(
        parsedPin.color.g * 255
    )}, ${Math.round(parsedPin.color.b * 255)}, 0.4)`

    // Pre-calculate local positions
    useEffect(() => {
        markersRef.current = markers
        markerElsRef.current = markerElsRef.current.slice(0, markers.length)

        markersDataRef.current = markers.map((marker) => {
            const latRad = marker.lat * (Math.PI / 180)
            const lngRad = marker.lng * (Math.PI / 180)

            const y = Math.sin(latRad)
            const radiusAtY = Math.cos(latRad)
            const x = Math.sin(lngRad) * radiusAtY
            const z = Math.cos(lngRad) * radiusAtY

            const markerRadius = 1.02
            const localPos = new THREE.Vector3(
                x * markerRadius,
                y * markerRadius,
                z * markerRadius
            )

            return { x: -9999, y: -9999, visible: false, localPos }
        })
    }, [markers])

    useEffect(() => {
        if (!mountRef.current) return

        let width = mountRef.current.clientWidth
        let height = mountRef.current.clientHeight

        // Pre-allocate zero-garbage variables
        const tempWorldPos = new THREE.Vector3()
        const tempCenter = new THREE.Vector3()
        const tempCamDir = new THREE.Vector3()
        const tempNormal = new THREE.Vector3()
        const inverseMatrix = new THREE.Matrix4()
        const localRay = new THREE.Ray()
        const intersectPoint = new THREE.Vector3()
        const mathSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 0.98)

        // 1. Scene Setup
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
        camera.position.z = 3.5

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setSize(width, height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        const container = mountRef.current
        container.appendChild(renderer.domElement)

        const mainGroup = new THREE.Group()
        mainGroup.rotation.order = "YXZ"

        let appearProgress = 0.0
        const effectiveScale =
            Math.min(1, width / 2.4, height / 2.4) * globeScale

        let baseScale = effectiveScale
        let currentScale = effectiveScale

        mainGroup.position.set(positionX, positionY, 0)
        mainGroup.scale.setScalar(currentScale)

        let targetRotationX = 0.2
        let targetRotationY = -Math.PI / 4

        mainGroup.rotation.set(0.6, -Math.PI / 1.5, 0)

        if (isStatic) {
            appearProgress = 1.0
            mainGroup.rotation.set(targetRotationX, targetRotationY, 0)
        }

        scene.add(mainGroup)

        // 2. Base Mesh (Animated Ocean Shader)
        const baseGeo = new THREE.SphereGeometry(0.98, 64, 64)

        const colorH = parseColor(oceanColorHighlight).color
        const colorD = parseColor(oceanColorDark).color
        const colorL = parseColor(oceanColorLight).color

        const oceanUniforms = {
            uTime: { value: 0.0 },
            uAppear: { value: appearProgress },
            uColorHighlight: {
                value: new THREE.Vector3(colorH.r, colorH.g, colorH.b),
            },
            uColorDark: {
                value: new THREE.Vector3(colorD.r, colorD.g, colorD.b),
            },
            uColorLight: {
                value: new THREE.Vector3(colorL.r, colorL.g, colorL.b),
            },
        }

        const baseMat = new THREE.ShaderMaterial({
            uniforms: oceanUniforms,
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * vec4(vPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uAppear;
                uniform vec3 uColorHighlight;
                uniform vec3 uColorDark;
                uniform vec3 uColorLight;

                varying vec3 vNormal;
                varying vec3 vPosition;

                vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
                vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
                vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec3 v) {
                    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy));
                    vec3 x0 = v - i + dot(i, C.xxx);
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
                    float n_ = 0.142857142857;
                    vec3 ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_);
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
                    vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    vec3 lightDir = normalize(vec3(1.0, -0.2, 0.5));
                    float ndotl = dot(normal, lightDir);
                    float rightSide = smoothstep(-0.5, 1.0, ndotl);
                    
                    float n1 = snoise(normal * 2.0 + uTime * 0.15) * 0.5 + 0.5;
                    float n2 = snoise(normal * 4.0 - uTime * 0.1) * 0.5 + 0.5;
                    
                    float mixVal = rightSide * 0.7 + n1 * 0.3;
                    vec3 base = mix(uColorHighlight, uColorDark, smoothstep(0.1, 0.9, mixVal));
                    base = mix(base, uColorLight, n2 * 0.2);
                    
                    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
                    float rimNoise = snoise(normal * 12.0 + uTime * 0.2) * 0.5 + 0.5;
                    float rimStrength = smoothstep(0.65 - rimNoise * 0.1, 0.85, rim);
                    
                    vec3 finalColor = mix(base, uColorHighlight, rimStrength * 0.6);
                    
                    // Smooth ocean fade in
                    float easeAppear = 1.0 - pow(1.0 - clamp(uAppear * 1.5, 0.0, 1.0), 3.0);
                    gl_FragColor = vec4(finalColor, easeAppear);
                }
            `,
            transparent: true,
            opacity: 1,
            depthWrite: true,
        })
        const baseMesh = new THREE.Mesh(baseGeo, baseMat)
        baseMesh.renderOrder = 0
        mainGroup.add(baseMesh)

        // 3. Globe Small Particles
        let dotsMesh = null
        const parsedDotLocal = parseColor(dotColor)
        const parsedHoverColor = parseColor(hoverParticleColor)

        const dotsUniforms = {
            color: { value: parsedDotLocal.color },
            uHoverColor: { value: parsedHoverColor.color },
            opacity: { value: parsedDotLocal.alpha },
            uHoverPos: { value: new THREE.Vector3(0, 0, 0) },
            uHoverActive: { value: 0.0 },
            uHoverRadius: { value: lensRadius },
            uTime: { value: 0.0 },
            uAppear: { value: appearProgress },
            uLensMag: { value: lensMagnification },
            uLensBulge: { value: lensBulge },
            uLensScale: { value: lensParticleScale },
        }

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src =
            "https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png"
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas")
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, 0, 0)
                const imgData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                )

                const positions = []
                const sizes = []
                const randoms = []
                const phi = Math.PI * (3 - Math.sqrt(5))
                const actualNumPoints = dotDensity * 3

                for (let i = 0; i < actualNumPoints; i++) {
                    let rawY = 1 - (i / (actualNumPoints - 1)) * 2
                    const radiusAtY = Math.sqrt(1 - rawY * rawY)
                    const theta = phi * i

                    let x = Math.cos(theta) * radiusAtY
                    let y = rawY
                    let z = Math.sin(theta) * radiusAtY

                    x += (Math.random() - 0.5) * 0.008
                    y += (Math.random() - 0.5) * 0.008
                    z += (Math.random() - 0.5) * 0.008

                    const len = Math.sqrt(x * x + y * y + z * z)
                    x /= len
                    y /= len
                    z /= len

                    let u = 0.5 + Math.atan2(x, z) / (2 * Math.PI)
                    let v = 0.5 - Math.asin(y) / Math.PI

                    const px = Math.min(
                        Math.floor(u * imgData.width),
                        imgData.width - 1
                    )
                    const py = Math.min(
                        Math.floor(v * imgData.height),
                        imgData.height - 1
                    )

                    if (
                        px >= 0 &&
                        py >= 0 &&
                        imgData.data[(py * imgData.width + px) * 4] < 128
                    ) {
                        const randVal = Math.random()
                        let finalSize =
                            baseSize *
                            (1.0 + (randVal - 0.5) * sizeRandomness * 2.0)

                        positions.push(x, y, z)
                        sizes.push(Math.max(0.1, finalSize))
                        randoms.push(randVal)
                    }
                }

                const geo = new THREE.BufferGeometry()
                geo.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(positions, 3)
                )
                geo.setAttribute(
                    "aSize",
                    new THREE.Float32BufferAttribute(sizes, 1)
                )
                geo.setAttribute(
                    "aRandom",
                    new THREE.Float32BufferAttribute(randoms, 1)
                )

                const mat = new THREE.ShaderMaterial({
                    uniforms: dotsUniforms,
                    vertexShader: `
                        attribute float aSize;
                        attribute float aRandom;
                        
                        uniform vec3 uHoverPos;
                        uniform float uHoverActive;
                        uniform float uHoverRadius;
                        uniform float uTime;
                        uniform float uAppear;
                        
                        uniform float uLensMag;
                        uniform float uLensBulge;
                        uniform float uLensScale;
                        
                        varying float vAlpha;
                        varying float vEffect;
                        
                        void main() { 
                            vec3 pos = position;
                            
                            // Particles Cinematic Assembly Animation
                            float delay = aRandom * 0.5; 
                            float p = clamp((uAppear - delay) / 0.5, 0.0, 1.0); 
                            float easeP = 1.0 - pow(1.0 - p, 3.0); 
                            
                            vec3 normal = normalize(pos);
                            vec3 startPos = pos + normal * (1.0 - easeP) * (0.5 + aRandom * 0.5);
                            pos = mix(startPos, pos, easeP);

                            float dist = distance(pos, uHoverPos);
                            float effect = 1.0 - smoothstep(0.0, uHoverRadius, dist);
                            vEffect = effect * uHoverActive;
                            
                            if (vEffect > 0.0) {
                                vec3 toCenter = pos - uHoverPos;
                                float distToCenter = length(toCenter);
                                
                                if (distToCenter > 0.001) {
                                    vec3 tangentPush = normalize(toCenter - dot(toCenter, normal) * normal);
                                    float magnify = sin(effect * 3.14159) * uLensMag * uHoverActive;
                                    pos += tangentPush * magnify;
                                    
                                    float bulge = sin(effect * 1.570796) * uLensBulge * uHoverActive;
                                    pos += normal * bulge;
                                }
                            }

                            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); 
                            gl_Position = projectionMatrix * mvPosition; 
                            
                            float pulse = sin(uTime * 2.0 + aRandom * 10.0) * 0.15 + 0.85;
                            float scale = 1.0 + (effect * uLensScale * uHoverActive);
                            scale *= easeP; 

                            gl_PointSize = (aSize * scale * pulse) * (2.0 / -mvPosition.z); 
                            vAlpha = 0.4 + 0.6 * aRandom; 
                        }
                    `,
                    fragmentShader: `
                        uniform vec3 color; 
                        uniform vec3 uHoverColor;
                        uniform float opacity;
                        uniform float uAppear;
                        
                        varying float vAlpha;
                        varying float vEffect;
                        
                        void main() { 
                            float dist = length(gl_PointCoord - vec2(0.5)); 
                            if (dist > 0.5) discard; 
                            
                            float strength = 1.0 - (dist * 2.0);
                            strength = pow(strength, 1.2);
                            
                            vec3 finalColor = mix(color, uHoverColor, vEffect);
                            gl_FragColor = vec4(finalColor, strength * opacity * vAlpha * uAppear); 
                        }
                    `,
                    transparent: true,
                    depthWrite: false,
                    blending: THREE.NormalBlending,
                })
                dotsMesh = new THREE.Points(geo, mat)
                dotsMesh.renderOrder = 1
                mainGroup.add(dotsMesh)
            } catch (e) {}
        }

        // 4. Interaction
        let isDragging = false
        let previousMousePosition = { x: 0, y: 0 }
        let dragVelocity = { x: 0, y: 0 }

        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2(-2, -2)
        let targetHoverActive = 0
        let currentHoverActive = 0
        const localHoverPos = new THREE.Vector3()

        let rawMouseX = -9999
        let rawMouseY = -9999
        let cursorPosX = -9999
        let cursorPosY = -9999
        let currentSnappedIdx = -1
        let zoomedIdx = -1
        let isHoveringGlobe = false
        let isHoveringUI = false
        let hoverStartTimestamp = 0

        const onPointerDown = (e) => {
            const btn = e.target.closest(".marker-button")
            if (btn) return

            const container = e.target.closest(".marker-glass-container")
            if (
                markerType === "plus" &&
                currentSnappedIdx !== -1 &&
                container
            ) {
                if (zoomedIdx === currentSnappedIdx) {
                    zoomedIdx = -1
                } else {
                    zoomedIdx = currentSnappedIdx
                }
                return
            }

            zoomedIdx = -1
            isDragging = true
            previousMousePosition = { x: e.clientX, y: e.clientY }
            dragVelocity = { x: 0, y: 0 }
        }

        const onPointerMove = (e) => {
            const rect = container.getBoundingClientRect()
            rawMouseX = e.clientX - rect.left
            rawMouseY = e.clientY - rect.top

            isHoveringUI =
                !!e.target.closest(".marker-glass-container") ||
                !!e.target.closest(".marker-pin-wrap")

            if (isDragging) {
                const deltaX = e.clientX - previousMousePosition.x
                const deltaY = e.clientY - previousMousePosition.y

                dragVelocity.x = deltaX * 0.005
                dragVelocity.y = deltaY * 0.005

                targetRotationY += dragVelocity.x
                targetRotationX += dragVelocity.y

                previousMousePosition = { x: e.clientX, y: e.clientY }
            }

            if (cursorRef.current && useCustomCursor) {
                if (cursorRef.current.style.opacity === "0") {
                    cursorRef.current.style.opacity = "1"
                }
            }
        }

        const onPointerUp = () => {
            isDragging = false
        }

        const onPointerLeave = () => {
            if (!isDragging) {
                rawMouseX = -9999
                rawMouseY = -9999
                isHoveringUI = false
            }
            if (cursorRef.current && useCustomCursor) {
                cursorRef.current.style.opacity = "0"
            }
        }

        const onPointerEnter = () => {
            if (cursorRef.current && useCustomCursor) {
                cursorRef.current.style.opacity = "1"
            }
        }

        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointerenter", onPointerEnter)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        container.addEventListener("pointerleave", onPointerLeave)

        const snapMarker = (idx) => {
            const el = markerElsRef.current[idx]
            if (!el) return
            const container = el.querySelector(".marker-glass-container")
            const iconBox = el.querySelector(".marker-icon-box")
            const iconSvg = el.querySelector(".marker-svg")
            const textWrap = el.querySelector(".marker-title-wrap")
            const bodyWrap = el.querySelector(".marker-body-wrap")

            if (container) {
                container.style.backgroundColor = "var(--marker-bg)"
                container.style.backgroundImage =
                    "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)"
                container.style.backdropFilter = "blur(24px) saturate(200%)"
                container.style.WebkitBackdropFilter =
                    "blur(24px) saturate(200%)"
                container.style.borderColor = "var(--marker-border-active)"
                container.style.boxShadow =
                    "0 16px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                container.style.pointerEvents = "auto"
                container.style.cursor = "pointer"
            }
            if (iconBox) {
                iconBox.style.backgroundColor = "var(--marker-active-bg)"
            }
            if (iconSvg) {
                iconSvg.style.transform = "rotate(45deg) scale(1.1)"
                iconSvg.style.fill = "var(--marker-active-icon-color)"
            }
            if (textWrap) {
                textWrap.style.maxWidth = "250px"
                textWrap.style.opacity = "1"
            }
            if (bodyWrap) {
                bodyWrap.style.maxHeight = "400px"
                bodyWrap.style.opacity = "1"
                bodyWrap.style.marginTop = "8px"
            }

            const pinWrap = el.querySelector(".marker-pin-wrap")
            if (pinWrap) {
                pinWrap.style.transform = "scale(1.15)"
            }
        }

        const unSnapMarker = (idx) => {
            const el = markerElsRef.current[idx]
            if (!el) return
            const container = el.querySelector(".marker-glass-container")
            const iconBox = el.querySelector(".marker-icon-box")
            const iconSvg = el.querySelector(".marker-svg")
            const textWrap = el.querySelector(".marker-title-wrap")
            const bodyWrap = el.querySelector(".marker-body-wrap")

            if (container) {
                container.style.backgroundColor = "rgba(20, 20, 25, 0.0)"
                container.style.backgroundImage = "none"
                container.style.backdropFilter = "blur(0px)"
                container.style.WebkitBackdropFilter = "blur(0px)"
                container.style.borderColor = "rgba(0,0,0,0)"
                container.style.boxShadow = "none"
                container.style.pointerEvents = "none"
                container.style.cursor = "default"
            }
            if (iconBox) {
                iconBox.style.backgroundColor = "var(--marker-icon-bg)"
            }
            if (iconSvg) {
                iconSvg.style.transform = "rotate(0deg) scale(1)"
                iconSvg.style.fill = "var(--marker-icon-color)"
            }
            if (textWrap) {
                textWrap.style.maxWidth = "0px"
                textWrap.style.opacity = "0"
            }
            if (bodyWrap) {
                bodyWrap.style.maxHeight = "0px"
                bodyWrap.style.opacity = "0"
                bodyWrap.style.marginTop = "0px"
            }

            const pinWrap = el.querySelector(".marker-pin-wrap")
            if (pinWrap) {
                pinWrap.style.transform = "scale(1)"
            }
        }

        let animationFrameId = null

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate)

            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !editorPreview) return
            if (!isStatic && !isIntersecting.current) return

            const time = performance.now() * 0.001

            // Slower Cinematic Reveal Lerp
            if (appearProgress < 1.0) {
                appearProgress += (1.0 - appearProgress) * 0.008
                if (appearProgress > 0.999) appearProgress = 1.0

                if (baseMesh && baseMesh.material.uniforms) {
                    baseMesh.material.uniforms.uAppear.value = appearProgress
                }
                if (dotsMesh && dotsMesh.material.uniforms) {
                    dotsMesh.material.uniforms.uAppear.value = appearProgress
                }
            }

            if (baseMesh && baseMesh.material.uniforms) {
                baseMesh.material.uniforms.uTime.value = time
            }
            if (dotsMesh && dotsMesh.material.uniforms) {
                dotsMesh.material.uniforms.uTime.value = time
            }

            // Zoom / Fly-To Lerp Logic
            if (zoomedIdx !== -1 && markersRef.current[zoomedIdx]) {
                const marker = markersRef.current[zoomedIdx]
                const latRad = marker.lat * (Math.PI / 180)
                const lngRad = marker.lng * (Math.PI / 180)

                targetRotationY = -lngRad
                targetRotationX = latRad

                currentScale += (baseScale * 1.55 - currentScale) * 0.08
            } else {
                const introEffectiveScale =
                    baseScale * (0.85 + 0.15 * appearProgress)
                currentScale += (introEffectiveScale - currentScale) * 0.08
            }
            mainGroup.scale.setScalar(currentScale)

            // Apply momentum, auto-rotation, and smooth damping
            if (!isDragging && zoomedIdx === -1 && currentSnappedIdx === -1) {
                const cinematicSpin = (1.0 - appearProgress) * 0.015
                targetRotationY += rotationSpeed * 0.016 + cinematicSpin
            }

            if (!isDragging) {
                targetRotationY += dragVelocity.x
                targetRotationX += dragVelocity.y
                dragVelocity.x *= 0.95
                dragVelocity.y *= 0.95
            }

            mainGroup.rotation.y +=
                (targetRotationY - mainGroup.rotation.y) * 0.1
            mainGroup.rotation.x +=
                (targetRotationX - mainGroup.rotation.x) * 0.1

            renderer.render(scene, camera)

            // 2. High-Performance Zero-Garbage Marker Positioning
            tempCenter.set(0, 0, 0).applyMatrix4(mainGroup.matrixWorld)

            if (markersRef.current && markersRef.current.length > 0) {
                markersRef.current.forEach((marker, idx) => {
                    const el = markerElsRef.current[idx]
                    const mData = markersDataRef.current[idx]
                    if (!el || !mData) return

                    tempWorldPos
                        .copy(mData.localPos)
                        .applyMatrix4(mainGroup.matrixWorld)

                    tempNormal.copy(tempWorldPos).sub(tempCenter).normalize()
                    tempCamDir
                        .copy(camera.position)
                        .sub(tempWorldPos)
                        .normalize()
                    const dot = tempNormal.dot(tempCamDir)

                    let opacity = 1
                    if (dot < -0.1) opacity = 0
                    else if (dot < 0.2) opacity = (dot + 0.1) / 0.3

                    if (opacity > 0) {
                        tempWorldPos.project(camera)
                        const screenX = (tempWorldPos.x * 0.5 + 0.5) * width
                        const screenY = (-(tempWorldPos.y * 0.5) + 0.5) * height

                        el.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`
                        el.style.opacity = (
                            Math.max(0, Math.min(1, opacity)) * appearProgress
                        ).toFixed(2)
                        el.style.visibility = "visible"

                        mData.x = screenX
                        mData.y = screenY
                        mData.visible = true
                    } else {
                        el.style.opacity = "0"
                        el.style.visibility = "hidden"
                        mData.visible = false
                    }
                })
            }

            // 3. Snapping Logic (Only active if markerType is "plus")
            let nextSnapIdx = -1

            if (markerType === "plus") {
                if (zoomedIdx !== -1) {
                    nextSnapIdx = zoomedIdx
                } else if (isHoveringUI && currentSnappedIdx !== -1) {
                    nextSnapIdx = currentSnappedIdx
                } else if (!isDragging && rawMouseX !== -9999) {
                    if (
                        currentSnappedIdx !== -1 &&
                        markersDataRef.current[currentSnappedIdx] &&
                        markersDataRef.current[currentSnappedIdx].visible
                    ) {
                        const dist = Math.hypot(
                            markersDataRef.current[currentSnappedIdx].x -
                                rawMouseX,
                            markersDataRef.current[currentSnappedIdx].y -
                                rawMouseY
                        )
                        if (dist < 140) nextSnapIdx = currentSnappedIdx
                    }

                    if (nextSnapIdx === -1) {
                        let minDist = 40
                        markersDataRef.current.forEach((pos, idx) => {
                            if (pos.visible) {
                                const dist = Math.hypot(
                                    pos.x - rawMouseX,
                                    pos.y - rawMouseY
                                )
                                if (dist < minDist) {
                                    minDist = dist
                                    nextSnapIdx = idx
                                }
                            }
                        })
                    }
                }
            }

            // 4. State changes for snapping
            if (nextSnapIdx !== currentSnappedIdx) {
                if (currentSnappedIdx !== -1) unSnapMarker(currentSnappedIdx)
                if (nextSnapIdx !== -1) snapMarker(nextSnapIdx)
                currentSnappedIdx = nextSnapIdx
            }

            // 5. Cursor Target Calculation & Lerping
            let targetX = rawMouseX
            let targetY = rawMouseY
            if (
                markerType === "plus" &&
                currentSnappedIdx !== -1 &&
                markersDataRef.current[currentSnappedIdx]
            ) {
                targetX = markersDataRef.current[currentSnappedIdx].x
                targetY = markersDataRef.current[currentSnappedIdx].y
            }

            if (rawMouseX !== -9999) {
                if (cursorPosX === -9999) {
                    cursorPosX = rawMouseX
                    cursorPosY = rawMouseY
                } else {
                    cursorPosX += (targetX - cursorPosX) * 0.15
                    cursorPosY += (targetY - cursorPosY) * 0.15
                }
            } else {
                cursorPosX = -9999
                cursorPosY = -9999
            }

            // 6. High Performance Raycast Update (Zero allocations)
            if (cursorPosX !== -9999) {
                mouse.x = (cursorPosX / width) * 2 - 1
                mouse.y = -(cursorPosY / height) * 2 + 1
            } else {
                mouse.x = -2
                mouse.y = -2
            }

            if (enableHover && cursorPosX !== -9999) {
                raycaster.setFromCamera(mouse, camera)

                inverseMatrix.copy(mainGroup.matrixWorld).invert()
                localRay.copy(raycaster.ray).applyMatrix4(inverseMatrix)

                let isIntersected = false

                if (localRay.intersectSphere(mathSphere, intersectPoint)) {
                    isIntersected = true
                }

                if (isIntersected) {
                    if (!isHoveringGlobe) {
                        isHoveringGlobe = true
                        hoverStartTimestamp = performance.now()
                    }
                    if (
                        performance.now() - hoverStartTimestamp >=
                        hoverDelay * 1000
                    ) {
                        targetHoverActive = 1.0
                        localHoverPos.copy(intersectPoint)
                    }
                } else {
                    isHoveringGlobe = false
                    targetHoverActive = 0.0
                }
            } else {
                targetHoverActive = 0.0
            }

            currentHoverActive +=
                (targetHoverActive - currentHoverActive) * 0.15
            if (dotsMesh) {
                dotsMesh.material.uniforms.uHoverActive.value =
                    currentHoverActive
                if (currentHoverActive > 0.01) {
                    dotsMesh.material.uniforms.uHoverPos.value.copy(
                        localHoverPos
                    )
                }
            }

            // 7. Apply to Custom Cursor DOM via translate3d
            if (cursorRef.current && useCustomCursor && cursorPosX !== -9999) {
                cursorRef.current.style.transform = `translate3d(${cursorPosX}px, ${cursorPosY}px, 0)`
            }
        }

        const visibilityObserver = new IntersectionObserver((entries) => {
            isIntersecting.current = entries[0].isIntersecting
        })
        visibilityObserver.observe(container)

        if (isStatic) {
            setTimeout(() => renderer.render(scene, camera), 100)
        } else {
            animate()
        }

        const resizeObserver = new ResizeObserver((entries) => {
            width = entries[0].contentRect.width
            height = entries[0].contentRect.height
            camera.aspect = width / height
            camera.updateProjectionMatrix()
            renderer.setSize(width, height)
        })
        resizeObserver.observe(container)

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
            visibilityObserver.disconnect()
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointerenter", onPointerEnter)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointerleave", onPointerLeave)

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

            renderer.forceContextLoss()
            renderer.dispose()
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [
        oceanColorHighlight,
        oceanColorDark,
        oceanColorLight,
        dotColor,
        dotDensity,
        baseSize,
        sizeRandomness,
        globeScale,
        rotationSpeed,
        positionX,
        positionY,
        enableHover,
        hoverDelay,
        hoverParticleColor,
        lensRadius,
        lensMagnification,
        lensBulge,
        lensParticleScale,
        markerType,
        isStatic,
        editorPreview,
        useCustomCursor,
    ])

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                ...style,
                position: "relative",
                background: backgroundColor,
                overflow: "hidden",
                cursor: useCustomCursor ? "none" : "default",
                userSelect: "none",
                WebkitUserSelect: "none",

                // Injecting CSS Custom Properties mapping to Framer props
                "--marker-bg": markerBgColor,
                "--marker-border-active": `rgba(${rgbCursor}, 0.3)`,
                "--marker-icon-bg": markerIconBgColor,
                "--marker-active-bg": markerActiveBgColor,
                "--marker-icon-color": markerIconColor,
                "--marker-active-icon-color": markerActiveIconColor,
                "--marker-text-color": markerTextColor,
            }}
        >
            {/* GSAP-Style Custom Cursor Crosshair Layer */}
            {useCustomCursor && (
                <div
                    ref={cursorRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        zIndex: 99999,
                        opacity: 0,
                        transition: `opacity 0.3s ${butteryEase}`,
                        willChange: "transform",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            width: "200vw",
                            height: "1px",
                            background: `rgba(${rgbCursor}, ${cursorLineOpacity})`,
                            top: "0",
                            left: "-100vw",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: "1px",
                            height: "200vh",
                            background: `rgba(${rgbCursor}, ${cursorLineOpacity})`,
                            top: "-100vh",
                            left: "0",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: `${cursorDotSize}px`,
                            height: `${cursorDotSize}px`,
                            background: `rgb(${rgbCursor})`,
                            boxShadow: `0 0 10px rgb(${rgbCursor})`,
                            borderRadius: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                    />
                </div>
            )}

            {/* 3D Canvas Container */}
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    zIndex: 1,
                }}
            />

            {/* GSAP-Style Interactive Markers UI Overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 2,
                    overflow: "hidden",
                }}
            >
                {markers.map((marker, idx) => (
                    <div
                        key={idx}
                        ref={(el) => (markerElsRef.current[idx] = el)}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            opacity: 0,
                            willChange: "transform, opacity",
                            pointerEvents: "none",
                        }}
                    >
                        {markerType === "plus" ? (
                            <div
                                className="marker-glass-container"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    backgroundColor: "rgba(20, 20, 25, 0)",
                                    backdropFilter: "blur(0px)",
                                    WebkitBackdropFilter: "blur(0px)",
                                    borderRadius: "10px",
                                    padding: "4px",
                                    border: `1px solid rgba(0, 0, 0, 0)`,
                                    transition: `background-color 0.5s ease, backdrop-filter 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease`,
                                    transform: "translate(-18px, -18px)",
                                    pointerEvents: "none",
                                }}
                            >
                                {/* Header (Icon + Label) */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        className="marker-icon-box"
                                        style={{
                                            width: "28px",
                                            height: "28px",
                                            borderRadius: "8px",
                                            backgroundColor:
                                                "var(--marker-icon-bg)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            transition: `background-color 0.5s ease, transform 0.5s ${butteryEase}`,
                                        }}
                                    >
                                        <svg
                                            className="marker-svg"
                                            width="12"
                                            height="12"
                                            viewBox="0 0 12 12"
                                            fill="var(--marker-icon-color)"
                                            style={{
                                                transition: `transform 0.5s ${butteryEase}, fill 0.5s ease`,
                                            }}
                                        >
                                            <path d="M5.5 0v5.5H0v1h5.5V12h1V6.5H12v-1H6.5V0h-1z" />
                                        </svg>
                                    </div>
                                    <div
                                        className="marker-title-wrap"
                                        style={{
                                            maxWidth: "0px",
                                            opacity: 0,
                                            overflow: "hidden",
                                            transition: `max-width 0.6s ${butteryEase}, opacity 0.5s ${butteryEase}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                paddingLeft: "10px",
                                                paddingRight: "8px",
                                                color: "var(--marker-text-color)",
                                                fontFamily:
                                                    "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {marker.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanding Rich Media Body */}
                                <div
                                    className="marker-body-wrap"
                                    style={{
                                        maxHeight: "0px",
                                        opacity: 0,
                                        marginTop: "0px",
                                        overflow: "hidden",
                                        transition: `max-height 0.6s ${butteryEase}, opacity 0.5s ${butteryEase}, margin-top 0.6s ${butteryEase}`,
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "0 4px 4px 4px",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            width: "220px",
                                        }}
                                    >
                                        {marker.image && (
                                            <img
                                                src={marker.image}
                                                alt={marker.label}
                                                loading="lazy"
                                                decoding="async"
                                                style={{
                                                    width: "100%",
                                                    height: "120px",
                                                    objectFit: "cover",
                                                    borderRadius: "6px",
                                                    willChange: "transform",
                                                }}
                                            />
                                        )}
                                        {marker.description && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "rgba(255,255,255,0.8)",
                                                    whiteSpace: "normal",
                                                    lineHeight: "1.4",
                                                    fontFamily:
                                                        "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                                                }}
                                            >
                                                {marker.description}
                                            </div>
                                        )}
                                        {marker.buttonText && (
                                            <a
                                                className="marker-button"
                                                href={marker.buttonLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onPointerDown={(e) => {
                                                    e.stopPropagation()
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                }}
                                                style={{
                                                    display: "block",
                                                    textAlign: "center",
                                                    textDecoration: "none",
                                                    padding: "8px",
                                                    background:
                                                        "rgba(255,255,255,0.1)",
                                                    border: "1px solid rgba(255,255,255,0.2)",
                                                    color: "#fff",
                                                    borderRadius: "6px",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    fontFamily:
                                                        "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
                                                    transition:
                                                        "background 0.2s",
                                                    pointerEvents: "auto",
                                                }}
                                                onMouseOver={(e) =>
                                                    (e.target.style.background =
                                                        "rgba(255,255,255,0.2)")
                                                }
                                                onMouseOut={(e) =>
                                                    (e.target.style.background =
                                                        "rgba(255,255,255,0.1)")
                                                }
                                            >
                                                {marker.buttonText}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="marker-pin-wrap"
                                style={{
                                    ...markerStyle,
                                    transform: "translate(-50%, -50%) scale(1)",
                                    transition: `transform 0.4s ${butteryEase}`,
                                    pointerEvents: "none",
                                }}
                            >
                                <LocationIcon
                                    color={pinColor}
                                    shadowColor={pinShadowColor}
                                />
                                <span
                                    style={{
                                        color: "var(--marker-text-color)",
                                    }}
                                >
                                    {marker.label}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// STEP 2: Beautiful Premium Default Props
VariableDotsGlobe.defaultProps = {
    style: { width: 500, height: 500 },
    editorPreview: true,
    markers: [
        {
            label: "KINSHASA, DRC",
            lat: -4.4419,
            lng: 15.2663,
            description: "A major cultural and intellectual center.",
            image: "https://images.unsplash.com/photo-1547471080-7fc2caa7f5a6?auto=format&fit=crop&q=80&w=600",
            buttonText: "Explore More",
            buttonLink: "https://framer.com",
        },
        {
            label: "TOKYO, JPN",
            lat: 35.6762,
            lng: 139.6503,
            description: "The bustling capital of Japan.",
            image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600",
            buttonText: "View City",
            buttonLink: "https://framer.com",
        },
        {
            label: "NEW YORK, USA",
            lat: 40.7128,
            lng: -74.006,
            description: "The city that never sleeps.",
            image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=600",
            buttonText: "Discover",
            buttonLink: "https://framer.com",
        },
        { label: "LONDON, UK", lat: 51.5074, lng: -0.1278 },
        { label: "SYDNEY, AUS", lat: -33.8688, lng: 151.2093 },
        { label: "SAO PAULO, BRA", lat: -23.5505, lng: -46.6333 },
    ],
    styling: {
        oceanColorHighlight: "#FAFAFC",
        oceanColorDark: "#A2B9DB",
        oceanColorLight: "#D1E0F2",
        dotColor: "#FFFFFF",
        backgroundColor: "#000000",
    },
    uiCustomization: {
        cursorColor: "#D4D4D4",
        cursorLineOpacity: 0.2,
        cursorDotSize: 5,
        markerBgColor: "#1E1E23",
        markerIconBgColor: "#2A2A2A",
        markerActiveBgColor: "#FFFFFF",
        markerIconColor: "#FFFFFF",
        markerActiveIconColor: "#111111",
        markerTextColor: "#FFFFFF",
        pinColor: "#FFFFFF",
    },
    layout: {
        globeScale: 1.1,
        rotationSpeed: 0.06,
        positionX: 0,
        positionY: 0,
        dotDensity: 80000,
        markerType: "plus",
        useCustomCursor: true,
    },
    particleSizing: {
        baseSize: 5,
        sizeRandomness: 1,
    },
    interactions: {
        enableHover: true,
        hoverDelay: 0,
        hoverParticleColor: "#C8D7FA",
        lensRadius: 0.45,
        lensMagnification: 0.02,
        lensBulge: 0.02,
        lensParticleScale: 1,
    },
}

// STEP 3: UI Categorization
addPropertyControls(VariableDotsGlobe, {
    editorPreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: VariableDotsGlobe.defaultProps.editorPreview,
    },
    markers: {
        type: ControlType.Array,
        title: "Markers",
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Location",
                },
                lat: {
                    type: ControlType.Number,
                    title: "Latitude",
                    defaultValue: 0,
                    min: -90,
                    max: 90,
                    displayStepper: true,
                },
                lng: {
                    type: ControlType.Number,
                    title: "Longitude",
                    defaultValue: 0,
                    min: -180,
                    max: 180,
                    displayStepper: true,
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                buttonText: {
                    type: ControlType.String,
                    title: "Button Text",
                    placeholder: "Read More",
                },
                buttonLink: {
                    type: ControlType.String,
                    title: "Button Link",
                    placeholder: "https://",
                },
            },
        },
        defaultValue: VariableDotsGlobe.defaultProps.markers,
    },
    styling: {
        type: ControlType.Object,
        title: "Styling",
        controls: {
            oceanColorHighlight: {
                type: ControlType.Color,
                title: "Ocean Highlight",
                defaultValue:
                    VariableDotsGlobe.defaultProps.styling.oceanColorHighlight,
            },
            oceanColorDark: {
                type: ControlType.Color,
                title: "Ocean Dark",
                defaultValue:
                    VariableDotsGlobe.defaultProps.styling.oceanColorDark,
            },
            oceanColorLight: {
                type: ControlType.Color,
                title: "Ocean Light",
                defaultValue:
                    VariableDotsGlobe.defaultProps.styling.oceanColorLight,
            },
            dotColor: {
                type: ControlType.Color,
                title: "Particle Base",
                defaultValue: VariableDotsGlobe.defaultProps.styling.dotColor,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue:
                    VariableDotsGlobe.defaultProps.styling.backgroundColor,
            },
        },
    },
    uiCustomization: {
        type: ControlType.Object,
        title: "UI Customization",
        controls: {
            cursorColor: {
                type: ControlType.Color,
                title: "Cursor Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization.cursorColor,
            },
            cursorLineOpacity: {
                type: ControlType.Number,
                title: "Line Opacity",
                min: 0,
                max: 1,
                step: 0.05,
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .cursorLineOpacity,
            },
            cursorDotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                min: 2,
                max: 20,
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .cursorDotSize,
            },
            markerBgColor: {
                type: ControlType.Color,
                title: "Snap BG Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerBgColor,
            },
            markerIconBgColor: {
                type: ControlType.Color,
                title: "Icon Box BG",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerIconBgColor,
            },
            markerActiveBgColor: {
                type: ControlType.Color,
                title: "Snapped Icon BG",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerActiveBgColor,
            },
            markerIconColor: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerIconColor,
            },
            markerActiveIconColor: {
                type: ControlType.Color,
                title: "Snapped Icon",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerActiveIconColor,
            },
            markerTextColor: {
                type: ControlType.Color,
                title: "Text Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization
                        .markerTextColor,
            },
            pinColor: {
                type: ControlType.Color,
                title: "Pin Style Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.uiCustomization.pinColor,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            globeScale: {
                type: ControlType.Number,
                title: "Globe Scale",
                defaultValue: VariableDotsGlobe.defaultProps.layout.globeScale,
                min: 0.1,
                max: 5.0,
                step: 0.05,
                displayStepper: true,
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Globe Speed",
                defaultValue:
                    VariableDotsGlobe.defaultProps.layout.rotationSpeed,
                min: 0,
                max: 0.5,
                step: 0.01,
                displayStepper: true,
            },
            positionX: {
                type: ControlType.Number,
                title: "Position X",
                defaultValue: VariableDotsGlobe.defaultProps.layout.positionX,
                min: -10,
                max: 10,
                step: 0.1,
                displayStepper: true,
            },
            positionY: {
                type: ControlType.Number,
                title: "Position Y",
                defaultValue: VariableDotsGlobe.defaultProps.layout.positionY,
                min: -10,
                max: 10,
                step: 0.1,
                displayStepper: true,
            },
            dotDensity: {
                type: ControlType.Number,
                title: "Land Density",
                defaultValue: VariableDotsGlobe.defaultProps.layout.dotDensity,
                min: 2000,
                max: 80000,
                step: 1000,
            },
            markerType: {
                type: ControlType.Enum,
                title: "Marker Style",
                options: ["pin", "plus"],
                optionTitles: ["Location Pin", "Plus Snapping UI"],
                defaultValue: VariableDotsGlobe.defaultProps.layout.markerType,
            },
            useCustomCursor: {
                type: ControlType.Boolean,
                title: "Custom Cursor",
                defaultValue:
                    VariableDotsGlobe.defaultProps.layout.useCustomCursor,
            },
        },
    },
    particleSizing: {
        type: ControlType.Object,
        title: "Particles",
        controls: {
            baseSize: {
                type: ControlType.Number,
                title: "Base Size",
                defaultValue:
                    VariableDotsGlobe.defaultProps.particleSizing.baseSize,
                min: 0.1,
                max: 10.0,
                step: 0.1,
                displayStepper: true,
            },
            sizeRandomness: {
                type: ControlType.Number,
                title: "Organic Varience",
                defaultValue:
                    VariableDotsGlobe.defaultProps.particleSizing
                        .sizeRandomness,
                min: 0,
                max: 1,
                step: 0.05,
            },
        },
    },
    interactions: {
        type: ControlType.Object,
        title: "Interactions",
        controls: {
            enableHover: {
                type: ControlType.Boolean,
                title: "Liquid Hover Lens",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions.enableHover,
            },
            hoverDelay: {
                type: ControlType.Number,
                title: "Hover Delay",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions.hoverDelay,
                min: 0,
                max: 2,
                step: 0.1,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
            hoverParticleColor: {
                type: ControlType.Color,
                title: "Hover Color",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions
                        .hoverParticleColor,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
            lensRadius: {
                type: ControlType.Number,
                title: "Lens Radius",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions.lensRadius,
                min: 0.1,
                max: 1.0,
                step: 0.05,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
            lensMagnification: {
                type: ControlType.Number,
                title: "Magnification",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions
                        .lensMagnification,
                min: 0,
                max: 0.5,
                step: 0.01,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
            lensBulge: {
                type: ControlType.Number,
                title: "Lens Bulge",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions.lensBulge,
                min: 0,
                max: 0.5,
                step: 0.01,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
            lensParticleScale: {
                type: ControlType.Number,
                title: "Hover Scale",
                defaultValue:
                    VariableDotsGlobe.defaultProps.interactions
                        .lensParticleScale,
                min: 0,
                max: 5.0,
                step: 0.1,
                hidden: (props) =>
                    !props.enableHover &&
                    (!props.interactions || !props.interactions.enableHover),
            },
        },
    },
})
