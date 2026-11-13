import * as React from "react"
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


const { useEffect, useRef } = React

// ==========================================
// 1. UNIVERSAL / SHARED SHADERS
// ==========================================

const BASE_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
    vUv = uv;
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 viewSpacePos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`

const PUFF_FRAGMENT = `
uniform vec3 colorCenter;
uniform vec3 colorEdge;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    float rim = 1.0 - max(dot(n, v), 0.0);
    float mixFactor = pow(smoothstep(0.15, 0.85, rim), 1.2); 
    vec3 col = mix(colorCenter, colorEdge, mixFactor);
    vec3 l = normalize(vec3(0.2, 1.0, 0.8)); 
    vec3 h = normalize(l + v); 
    float spec = pow(max(dot(n, h), 0.0), 60.0); 
    col += vec3(1.0) * spec * 0.6; 
    gl_FragColor = vec4(col, 1.0);
}
`

// Botty (Chatbot) Shaders: Features procedural tail wagging inside the vertex shader
const BOTTY_VERTEX = `
uniform float uTime;
varying vec3 vNormal;
varying float vHeight;
varying vec3 vViewDir;

void main() {
    vec3 pos = position;
    
    // Tail wagging animation (adjusted for the shorter tail)
    if (pos.y < -0.95) {
        float tailT = (abs(pos.y) - 0.95) / 0.6; 
        pos.x += sin(uTime * 5.0) * (tailT * tailT) * 0.12;
    }
    
    vNormal = normalize(normalMatrix * normalize(pos));
    vHeight = pos.y; 
    vec4 viewSpacePos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`

const BOTTY_FRAGMENT = `
uniform vec3 colorTop;
uniform vec3 colorBottom;
varying vec3 vNormal;
varying float vHeight;
varying vec3 vViewDir;

void main() {
    float h = clamp((vHeight + 1.15) / 2.3, 0.0, 1.0);
    vec3 col = mix(colorBottom, colorTop, smoothstep(0.15, 0.85, h));
    
    float rim = smoothstep(0.5, 1.0, 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0));
    col += vec3(1.0) * rim * 0.45;
    
    gl_FragColor = vec4(col, 1.0);
}
`

const PIP_VERTEX = `
uniform vec2 uCurve;
uniform vec3 uLocalOffset;
uniform vec3 uLocalScale;
uniform float uTime;
varying vec3 vFakeNormal;
varying float vHeight;
varying vec3 vViewDir;
void main() {
    vec3 pos = position;
    if (pos.y > 0.0) {
        float t = pos.y / 1.5; 
        float curveStrength = (pos.y * pos.y) * 0.25;
        pos.x += curveStrength * uCurve.x;
        pos.z += curveStrength * uCurve.y;
        pos.x += sin(t * 3.14 - uTime * 3.5) * (t * t * 0.12);
        pos.z += cos(t * 2.5 - uTime * 2.8) * (t * t * 0.08);
    }
    vec3 groupPos = (pos * uLocalScale) + uLocalOffset;
    vFakeNormal = normalize(normalMatrix * normalize(vec3(groupPos.x, groupPos.y * 0.8, groupPos.z)));
    vHeight = groupPos.y; 
    vec4 viewSpacePos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-viewSpacePos.xyz);
    gl_Position = projectionMatrix * viewSpacePos;
}
`

const PIP_FRAGMENT = `
uniform vec3 colorBottom;
uniform vec3 colorMiddle;
uniform vec3 colorTop;
varying vec3 vFakeNormal;
varying float vHeight;
varying vec3 vViewDir;
void main() {
    float h = clamp((vHeight + 1.0) / 2.5, 0.0, 1.0);
    vec3 col = mix(mix(colorBottom, colorMiddle, smoothstep(0.0, 0.45, h)), colorTop, smoothstep(0.45, 0.95, h));
    float rim = smoothstep(0.4, 1.0, 1.0 - max(dot(normalize(vFakeNormal), normalize(vViewDir)), 0.0));
    col += vec3(1.0, 0.85, 0.4) * rim * 0.55;
    gl_FragColor = vec4(col, 1.0);
}
`

const SPOOK_FRAGMENT = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vLocalPos;

void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    
    vec3 pink = vec3(1.0, 0.75, 0.85);
    vec3 yellow = vec3(1.0, 0.95, 0.6);
    vec3 green = vec3(0.6, 1.0, 0.8);
    vec3 blue = vec3(0.6, 0.8, 1.0);
    
    float mixX = clamp((vLocalPos.x + 1.0) / 2.0, 0.0, 1.0);
    float mixY = clamp((vLocalPos.y + 1.0) / 2.0, 0.0, 1.0);
    
    vec3 c1 = mix(pink, yellow, smoothstep(0.1, 0.6, mixX));
    vec3 c2 = mix(green, blue, smoothstep(0.4, 0.9, mixX));
    vec3 col = mix(c1, c2, smoothstep(0.2, 0.8, mixY));
    
    float rim = 1.0 - max(dot(n, v), 0.0);
    col = mix(vec3(1.0), col, smoothstep(0.0, 0.7, rim)); 
    
    vec3 l = normalize(vec3(0.5, 1.0, 0.8)); 
    vec3 h = normalize(l + v); 
    float spec = pow(max(dot(n, h), 0.0), 40.0); 
    col += vec3(1.0) * spec * 0.4; 
    
    gl_FragColor = vec4(col, 1.0);
}
`

// ==========================================
// 2. PROCEDURAL GEOMETRY GENERATORS
// ==========================================

const getPuffGeo = () => {
    const geo = new THREE.SphereGeometry(1, 128, 128)
    const pos = geo.attributes.position
    const vec = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i)
        const az = Math.atan2(vec.y, vec.x)
        const el = Math.pow(1.0 - Math.abs(vec.z), 1.5)
        let lobe = Math.cos(az * 8) * 0.12
        vec.x += Math.cos(az) * lobe * el
        vec.y += Math.sin(az) * lobe * el
        vec.z *= 0.4
        vec.x *= 1.05
        pos.setXYZ(i, vec.x, vec.y, vec.z)
    }
    geo.computeVertexNormals()
    return geo
}

const getPipGeo = () => {
    const pts = []
    for (let i = 0; i <= 100; i++) {
        let y = -1.0 + (i / 100.0) * 2.5
        let x =
            y < 0
                ? Math.sqrt(Math.max(0, 1 - y * y))
                : Math.pow(1 - Math.pow(y / 1.5, 2), 1.5)
        pts.push(new THREE.Vector2(x, y))
    }
    return new THREE.LatheGeometry(pts, 128)
}

const getBottyGeo = () => {
    const geo = new THREE.SphereGeometry(1, 128, 128)
    const pos = geo.attributes.position
    const vec = new THREE.Vector3()
    const blend = 0.55
    // Adjusted tail azimuth to the right side (from camera view)
    const tail_az = Math.PI / 2 - 0.65
    const tail_el = Math.PI - 0.35

    for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i)
        let az = Math.atan2(vec.z, vec.x)
        let el = Math.acos(vec.y)

        // Make Squircle base
        let l4 = Math.pow(
            Math.pow(Math.abs(vec.x), 4) +
                Math.pow(Math.abs(vec.y), 4) +
                Math.pow(Math.abs(vec.z), 4),
            0.25
        )
        let r = 1.0 / (l4 * blend + 1.0 * (1.0 - blend))

        vec.multiplyScalar(r)
        vec.x *= 1.2
        vec.y *= 1.05
        vec.z *= 0.85

        // Procedurally pull out the tail (shorter and pointing right)
        let dl = Math.sqrt(
            Math.pow((az - tail_az) * Math.sin(el) * 1.2, 2) +
                Math.pow(el - tail_el, 2)
        )
        if (dl < 0.5) {
            let t = 1.0 - dl / 0.5
            let pull = Math.pow(t, 2.0) * 0.45 // Reduced pull length
            vec.x += pull * Math.cos(tail_az) * 1.5
            vec.y -= pull * 1.0 // Reduced downward depth
            vec.z += pull * Math.sin(tail_az) * 0.2
        }

        pos.setXYZ(i, vec.x, vec.y, vec.z)
    }
    geo.computeVertexNormals()
    return geo
}

const getSpookGeo = () => {
    const geo = new THREE.SphereGeometry(
        1,
        128,
        128,
        0,
        Math.PI * 2,
        0,
        Math.PI - 0.5
    )
    const pos = geo.attributes.position
    const vec = new THREE.Vector3()

    for (let i = 0; i < pos.count; i++) {
        vec.fromBufferAttribute(pos, i)
        if (vec.y < 0) {
            let az = Math.atan2(vec.z, vec.x)
            let wave = Math.cos(az * 5) * 0.15
            let t = Math.abs(vec.y) / Math.abs(Math.cos(Math.PI - 0.5))
            vec.y += wave * Math.pow(t, 3)
            vec.x += vec.x * Math.pow(t, 2) * 0.1
            vec.z += vec.z * Math.pow(t, 2) * 0.1
        }
        vec.x *= 1.15
        vec.y *= 1.3
        vec.z *= 1.15
        pos.setXYZ(i, vec.x, vec.y, vec.z)
    }
    geo.computeVertexNormals()
    return geo
}

const getStarGeo = () => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.5)
    shape.quadraticCurveTo(0.1, 0.1, 0.5, 0)
    shape.quadraticCurveTo(0.1, -0.1, 0, -0.5)
    shape.quadraticCurveTo(-0.1, -0.1, -0.5, 0)
    shape.quadraticCurveTo(-0.1, 0.1, 0, 0.5)
    return new THREE.ShapeGeometry(shape)
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function InteractivePet(incomingProps) {
    const isStatic = useIsStaticRenderer()

    const props = {
        ...incomingProps,
        ...(incomingProps.appearance || {}),
        ...(incomingProps.behavior || {}),
        ...(incomingProps.chatBubble || {}),
    }

    const mountRef = useRef(null)
    const bubbleRef = useRef(null)
    const textNodeRef = useRef(null)

    const isIntersecting = useRef(true)
    const mousePos = useRef({ x: 0, y: 0 })
    const lastMouseTime = useRef(performance.now())
    const sizeRef = useRef({ w: 0, h: 0 })

    const propsRef = useRef(props)
    propsRef.current = props

    const sharedUniformsRef = useRef(null)
    const materialsRef = useRef({})

    const spookStarRef = useRef(null)
    const eyesRef = useRef([])

    const loadedTexturesRef = useRef([])

    useEffect(() => {
        if (isStatic) return // Strictly abort WebGL mounting during Framer's static rendering phase
        if (!mountRef.current) return

        spookStarRef.current = null
        eyesRef.current = []
        loadedTexturesRef.current = []

        const w = mountRef.current.clientWidth
        const h = mountRef.current.clientHeight
        sizeRef.current = { w, h }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
        camera.position.z = 5.5

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        mountRef.current.appendChild(renderer.domElement)

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        scene.add(ambientLight)
        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0)
        dirLight.position.set(2, 5, 5)
        scene.add(dirLight)

        const petGroup = new THREE.Group()
        scene.add(petGroup)

        const geometries = []
        const materials = []

        // ----------------------------------------
        // BUILD SELECTED CHARACTER
        // ----------------------------------------
        if (props.characterType === "custom") {
            const customGroup = new THREE.Group()
            petGroup.add(customGroup)

            if (props.customImage) {
                new THREE.TextureLoader().load(props.customImage, (texture) => {
                    texture.colorSpace = THREE.SRGBColorSpace
                    texture.minFilter = THREE.LinearFilter
                    texture.magFilter = THREE.LinearFilter
                    texture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy()
                    loadedTexturesRef.current.push(texture)

                    const aspect = texture.image.width / texture.image.height
                    const layers = 30
                    const depth = props.customDepth || 0.25
                    const step = depth / layers

                    const faceMat = new THREE.MeshStandardMaterial({
                        map: texture,
                        transparent: false,
                        alphaTest: 0.5,
                        roughness: 0.15,
                        metalness: 0.1,
                        side: THREE.DoubleSide,
                    })
                    const extrudeMat = new THREE.MeshStandardMaterial({
                        map: texture,
                        transparent: false,
                        alphaTest: 0.5,
                        roughness: 0.4,
                        color: new THREE.Color(0x999999),
                        side: THREE.DoubleSide,
                    })

                    materials.push(faceMat, extrudeMat)
                    const scaleMult = props.customImageSize || 1.8
                    const geo = new THREE.PlaneGeometry(
                        scaleMult * aspect,
                        scaleMult
                    )
                    geometries.push(geo)

                    for (let i = 0; i < layers; i++) {
                        const z = (i - layers / 2) * step
                        const isOuter = i === layers - 1 || i === 0
                        const mesh = new THREE.Mesh(
                            geo,
                            isOuter ? faceMat : extrudeMat
                        )
                        mesh.position.z = z
                        if (i === 0) mesh.rotation.y = Math.PI
                        customGroup.add(mesh)
                    }
                })
            }
        } else if (props.characterType === "botty") {
            // ==================== BOTTY (CHATBOT) ====================
            const bodyGeo = getBottyGeo()
            geometries.push(bodyGeo)

            const sharedUniforms = {
                colorTop: { value: new THREE.Color(props.bottyColorTop) },
                colorBottom: { value: new THREE.Color(props.bottyColorBottom) },
                uTime: { value: 0.0 },
            }
            sharedUniformsRef.current = sharedUniforms

            const mat = new THREE.ShaderMaterial({
                vertexShader: BOTTY_VERTEX,
                fragmentShader: BOTTY_FRAGMENT,
                uniforms: sharedUniforms,
            })
            materials.push(mat)
            petGroup.add(new THREE.Mesh(bodyGeo, mat))

            const faceGroup = new THREE.Group()
            petGroup.add(faceGroup)

            const eyeGeo = new THREE.CapsuleGeometry(0.14, 0.38, 32, 32)
            geometries.push(eyeGeo)
            const eyeMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(props.bottyEyeColor),
            })
            materials.push(eyeMat)
            materialsRef.current.bottyEyes = eyeMat

            const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
            leftEye.position.set(-0.35, 0.05, 0.82)
            leftEye.userData.origScaleY = 1.0
            faceGroup.add(leftEye)
            eyesRef.current.push(leftEye)

            const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
            rightEye.position.set(0.35, 0.05, 0.82)
            rightEye.userData.origScaleY = 1.0
            faceGroup.add(rightEye)
            eyesRef.current.push(rightEye)
        } else if (props.characterType === "spook") {
            // ==================== SPOOK (GHOST) ====================
            const geo = getSpookGeo()
            geometries.push(geo)

            const mat = new THREE.ShaderMaterial({
                vertexShader: BASE_VERTEX_SHADER,
                fragmentShader: SPOOK_FRAGMENT,
                side: THREE.DoubleSide,
            })
            materials.push(mat)
            petGroup.add(new THREE.Mesh(geo, mat))

            const faceGroup = new THREE.Group()
            petGroup.add(faceGroup)

            const eyeGeo = new THREE.SphereGeometry(0.18, 64, 64)
            geometries.push(eyeGeo)
            const eyeMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(props.globalEyeColor),
            })
            materials.push(eyeMat)
            materialsRef.current.globalEyes = eyeMat

            const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
            leftEye.scale.set(0.65, 1.0, 0.4)
            leftEye.position.set(-0.35, 0.1, 1.05)
            leftEye.rotation.z = 0.1
            leftEye.userData.origScaleY = 1.0
            faceGroup.add(leftEye)
            eyesRef.current.push(leftEye)

            const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
            rightEye.scale.set(0.65, 1.0, 0.4)
            rightEye.position.set(0.35, 0.1, 1.05)
            rightEye.rotation.z = -0.1
            rightEye.userData.origScaleY = 1.0
            faceGroup.add(rightEye)
            eyesRef.current.push(rightEye)

            // Improved visibility: Scaled up slightly, pushed out in XYZ so it pops clearly from the body
            const starGeo = getStarGeo()
            geometries.push(starGeo)
            const starMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
            })
            materials.push(starMat)
            const star = new THREE.Mesh(starGeo, starMat)
            star.scale.set(0.35, 0.35, 0.35)
            star.position.set(1.3, 1.1, 0.8) // Further out to avoid clipping
            petGroup.add(star)
            spookStarRef.current = star
        } else if (props.characterType === "puff") {
            // ==================== PUFF ====================
            const geo = getPuffGeo()
            geometries.push(geo)
            const sharedUniforms = {
                colorCenter: { value: new THREE.Color(props.puffColorCenter) },
                colorEdge: { value: new THREE.Color(props.puffColorEdge) },
            }
            sharedUniformsRef.current = sharedUniforms
            const mat = new THREE.ShaderMaterial({
                vertexShader: BASE_VERTEX_SHADER,
                fragmentShader: PUFF_FRAGMENT,
                uniforms: sharedUniforms,
            })
            materials.push(mat)
            petGroup.add(new THREE.Mesh(geo, mat))

            const eyeGeo = new THREE.SphereGeometry(0.08, 64, 64)
            geometries.push(eyeGeo)
            const eyeMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(props.globalEyeColor),
            })
            materials.push(eyeMat)
            materialsRef.current.globalEyes = eyeMat

            const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
            leftEye.scale.set(0.9, 1.8, 0.4)
            leftEye.position.set(-0.22, 0.0, 0.38)
            leftEye.userData.origScaleY = 1.8
            petGroup.add(leftEye)
            eyesRef.current.push(leftEye)

            const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
            rightEye.scale.set(0.9, 1.8, 0.4)
            rightEye.position.set(0.22, 0.0, 0.38)
            rightEye.userData.origScaleY = 1.8
            petGroup.add(rightEye)
            eyesRef.current.push(rightEye)
        } else if (props.characterType === "pip") {
            // ==================== PIP ====================
            const geo = getPipGeo()
            geometries.push(geo)
            const sharedUniforms = {
                colorBottom: { value: new THREE.Color(props.pipColorBottom) },
                colorMiddle: { value: new THREE.Color(props.pipColorMiddle) },
                colorTop: { value: new THREE.Color(props.pipColorTop) },
                uTime: { value: 0.0 },
            }
            sharedUniformsRef.current = sharedUniforms

            const matMain = new THREE.ShaderMaterial({
                vertexShader: PIP_VERTEX,
                fragmentShader: PIP_FRAGMENT,
                uniforms: {
                    ...sharedUniforms,
                    uCurve: { value: new THREE.Vector2(0, 0) },
                    uLocalOffset: { value: new THREE.Vector3(0, 0, 0) },
                    uLocalScale: { value: new THREE.Vector3(1, 1, 1) },
                },
            })
            materials.push(matMain)
            petGroup.add(new THREE.Mesh(geo, matMain))

            const matLeft = new THREE.ShaderMaterial({
                vertexShader: PIP_VERTEX,
                fragmentShader: PIP_FRAGMENT,
                uniforms: {
                    ...sharedUniforms,
                    uCurve: { value: new THREE.Vector2(-1.8, 0) },
                    uLocalOffset: { value: new THREE.Vector3(-0.62, 0.25, 0) },
                    uLocalScale: { value: new THREE.Vector3(0.4, 0.65, 0.4) },
                },
            })
            materials.push(matLeft)
            const meshLeft = new THREE.Mesh(geo, matLeft)
            meshLeft.scale.set(0.4, 0.65, 0.4)
            meshLeft.position.set(-0.62, 0.25, 0)
            petGroup.add(meshLeft)

            const matRight = new THREE.ShaderMaterial({
                vertexShader: PIP_VERTEX,
                fragmentShader: PIP_FRAGMENT,
                uniforms: {
                    ...sharedUniforms,
                    uCurve: { value: new THREE.Vector2(1.8, 0) },
                    uLocalOffset: { value: new THREE.Vector3(0.62, 0.2, 0) },
                    uLocalScale: { value: new THREE.Vector3(0.35, 0.55, 0.35) },
                },
            })
            materials.push(matRight)
            const meshRight = new THREE.Mesh(geo, matRight)
            meshRight.scale.set(0.35, 0.55, 0.35)
            meshRight.position.set(0.62, 0.2, 0)
            petGroup.add(meshRight)

            const faceGroup = new THREE.Group()
            petGroup.add(faceGroup)
            const eyeGeo = new THREE.SphereGeometry(0.09, 64, 64)
            geometries.push(eyeGeo)
            const eyeMat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(props.globalEyeColor),
                roughness: 0.1,
                metalness: 0.1,
            })
            materials.push(eyeMat)
            materialsRef.current.globalEyes = eyeMat
            const clGeo = new THREE.SphereGeometry(0.025, 32, 32)
            geometries.push(clGeo)
            const clMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
            materials.push(clMat)

            const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
            leftEye.scale.set(1.0, 1.4, 2.0)
            leftEye.position.set(-0.35, -0.05, 0.85)
            leftEye.rotation.y = -0.15
            leftEye.rotation.z = 0.05
            leftEye.userData.origScaleY = 1.4
            const clL = new THREE.Mesh(clGeo, clMat)
            clL.scale.set(1.0, 1.0 / 1.4, 1.0 / 2.0)
            clL.position.set(0.035, 0.04, 0.075)
            leftEye.add(clL)
            faceGroup.add(leftEye)
            eyesRef.current.push(leftEye)

            const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
            rightEye.scale.set(1.0, 1.4, 2.0)
            rightEye.position.set(0.35, -0.05, 0.85)
            rightEye.rotation.y = 0.15
            rightEye.rotation.z = -0.05
            rightEye.userData.origScaleY = 1.4
            const clR = new THREE.Mesh(clGeo, clMat)
            clR.scale.set(1.0, 1.0 / 1.4, 1.0 / 2.0)
            clR.position.set(0.035, 0.04, 0.075)
            rightEye.add(clR)
            faceGroup.add(rightEye)
            eyesRef.current.push(rightEye)

            const mouthGeo = new THREE.SphereGeometry(0.04, 64, 64)
            geometries.push(mouthGeo)
            const mouthMat = new THREE.MeshStandardMaterial({
                color: 0x2a0800,
                roughness: 0.6,
            })
            materials.push(mouthMat)
            const mouth = new THREE.Mesh(mouthGeo, mouthMat)
            mouth.scale.set(1.0, 0.5, 1.0)
            mouth.position.set(0, -0.22, 0.96)
            faceGroup.add(mouth)
        }

        // ----------------------------------------
        // GLOBAL INTERACTION OBSERVERS
        // ----------------------------------------
        const handleMove = (clientX, clientY) => {
            if (!mountRef.current) return
            lastMouseTime.current = performance.now()
            const rect = mountRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            mousePos.current.x = (clientX - centerX) / (window.innerWidth / 2)
            mousePos.current.y = -(
                (clientY - centerY) /
                (window.innerHeight / 2)
            )
        }

        const onMouseMove = (e) => handleMove(e.clientX, e.clientY)
        const onTouchMove = (e) => {
            // FIX: Ensure a touch point is available before accessing e.touches[0]
            if (!e.touches || e.touches.length === 0) return
            handleMove(e.touches[0].clientX, e.touches[0].clientY)
        }

        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("touchmove", onTouchMove)

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect
                sizeRef.current = { w: width, h: height }
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            }
        })
        resizeObserver.observe(mountRef.current)

        const io = new IntersectionObserver(([entry]) => {
            isIntersecting.current = entry.isIntersecting
        })
        io.observe(mountRef.current)

        // ----------------------------------------
        // ANIMATION LOOP & LOGIC
        // ----------------------------------------
        let frameId
        const tempV = new THREE.Vector3()

        const animate = () => {
            frameId = requestAnimationFrame(animate)

            const inEditor = RenderTarget.current() === RenderTarget.canvas
            if (inEditor && !propsRef.current.editorPreview) return
            if (!isIntersecting.current && !inEditor) return

            const time = performance.now() * 0.001
            const p = propsRef.current

            // 1. Idle Detection
            const isIdle =
                p.enableIdle && performance.now() - lastMouseTime.current > 3000

            if (textNodeRef.current) {
                const targetText = isIdle
                    ? p.idleText || p.bubbleText
                    : p.bubbleText
                if (textNodeRef.current.innerText !== targetText)
                    textNodeRef.current.innerText = targetText
            }

            // 2. Smooth Organic Blinking & Sleeping Engine
            let targetScaleY = 1.0
            if (isIdle) {
                targetScaleY = 0.1 // Sleeping
            } else {
                if (time % 4.0 < 0.15 || time % 7.0 > 6.85) targetScaleY = 0.1 // Blinking
            }

            eyesRef.current.forEach((eye) => {
                if (eye.userData.origScaleY !== undefined) {
                    eye.scale.y +=
                        (eye.userData.origScaleY * targetScaleY - eye.scale.y) *
                        0.2
                }
            })

            if (
                sharedUniformsRef.current &&
                (p.characterType === "pip" || p.characterType === "botty")
            ) {
                sharedUniformsRef.current.uTime.value = time
            }

            // 3. Special Animations
            if (p.characterType === "spook" && spookStarRef.current) {
                spookStarRef.current.rotation.z = time * 1.5
                spookStarRef.current.position.y =
                    1.1 + Math.sin(time * 3.0) * 0.1 // matched offset
            }

            // 4. Breathing Mechanics
            const wobbleSpeed = p.wobbleSpeed || 2.0
            const breathY =
                1.0 + Math.sin(time * wobbleSpeed) * (isIdle ? 0.035 : 0.02)
            const breathXZ =
                1.0 - Math.sin(time * wobbleSpeed) * (isIdle ? 0.02 : 0.01)
            const baseScale = p.scale || 1.0

            petGroup.scale.set(
                baseScale * breathXZ,
                baseScale * breathY,
                baseScale * breathXZ
            )

            const floatOffset = Math.sin(time * wobbleSpeed * 0.8) * 0.08

            // 5. Physics & Tracking
            let targetX = mousePos.current.x * 2.5
            let targetY = mousePos.current.y * 1.5 + floatOffset
            let targetRotY = mousePos.current.x * 0.6
            let targetRotX = -mousePos.current.y * 0.4

            if (isIdle) {
                targetX = Math.sin(time * 0.8) * 0.4
                targetY = Math.cos(time * 0.6) * 0.3 + floatOffset
                targetRotY = Math.sin(time * 0.5) * 0.3
                targetRotX = Math.cos(time * 0.4) * 0.1
            }

            const speed = p.speed || 0.06

            petGroup.position.x += (targetX - petGroup.position.x) * speed
            petGroup.position.y += (targetY - petGroup.position.y) * speed
            const velocityX = targetX - petGroup.position.x
            const targetRotZ = -velocityX * 0.15
            petGroup.rotation.y +=
                (targetRotY - petGroup.rotation.y) * (speed * 1.5)
            petGroup.rotation.x +=
                (targetRotX - petGroup.rotation.x) * (speed * 1.5)
            petGroup.rotation.z +=
                (targetRotZ - petGroup.rotation.z) * (speed * 1.5)

            // Calculate 2D Screen Position for HTML Overlay
            if (p.showBubble && bubbleRef.current && sizeRef.current) {
                tempV.copy(petGroup.position)
                tempV.x += (p.bubbleOffsetX || 1.2) * baseScale
                tempV.y += (p.bubbleOffsetY || 1.5) * baseScale
                tempV.project(camera)

                const px = (tempV.x * 0.5 + 0.5) * sizeRef.current.w
                const py = (tempV.y * -0.5 + 0.5) * sizeRef.current.h
                bubbleRef.current.style.transform = `translate3d(-50%, -100%, 0) translate3d(${px}px, ${py}px, 0)`
            }

            renderer.render(scene, camera)
        }

        animate()

        // ----------------------------------------
        // STRICT WEBGL CLEANUP
        // ----------------------------------------
        return () => {
            cancelAnimationFrame(frameId)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("touchmove", onTouchMove)
            resizeObserver.disconnect()
            io.disconnect()

            petGroup.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose()
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach((m) => {
                                if (m.map) m.map.dispose()
                                m.dispose()
                            })
                        } else {
                            if (child.material.map) child.material.map.dispose()
                            child.material.dispose()
                        }
                    }
                }
            })

            loadedTexturesRef.current.forEach((t) => t.dispose())
            geometries.forEach((g) => g.dispose())
            materials.forEach((m) => m.dispose())

            scene.clear()
            renderer.forceContextLoss()
            renderer.dispose()

            if (
                mountRef.current &&
                mountRef.current.contains(renderer.domElement)
            ) {
                mountRef.current.removeChild(renderer.domElement)
            }
        }
    }, [
        props.characterType,
        props.customImage,
        props.customImageSize,
        props.customDepth,
        isStatic, // Added dependency
    ])

    // Reactive Color Property Updates
    useEffect(() => {
        if (sharedUniformsRef.current) {
            if (props.characterType === "pip") {
                sharedUniformsRef.current.colorBottom?.value.set(
                    props.pipColorBottom
                )
                sharedUniformsRef.current.colorMiddle?.value.set(
                    props.pipColorMiddle
                )
                sharedUniformsRef.current.colorTop?.value.set(props.pipColorTop)
            } else if (props.characterType === "puff") {
                sharedUniformsRef.current.colorCenter?.value.set(
                    props.puffColorCenter
                )
                sharedUniformsRef.current.colorEdge?.value.set(
                    props.puffColorEdge
                )
            } else if (props.characterType === "botty") {
                sharedUniformsRef.current.colorTop?.value.set(
                    props.bottyColorTop
                )
                sharedUniformsRef.current.colorBottom?.value.set(
                    props.bottyColorBottom
                )
            }
        }
        if (materialsRef.current.globalEyes)
            materialsRef.current.globalEyes.color.set(props.globalEyeColor)
        if (materialsRef.current.bottyEyes)
            materialsRef.current.bottyEyes.color.set(props.bottyEyeColor)
    }, [
        props.pipColorBottom,
        props.pipColorMiddle,
        props.pipColorTop,
        props.globalEyeColor,
        props.puffColorCenter,
        props.puffColorEdge,
        props.bottyColorTop,
        props.bottyColorBottom,
        props.bottyEyeColor,
        props.characterType,
    ])

    const isLinked = !!props.link
    const WrapperElement = isLinked ? "a" : "div"

    // FIX: Provide a "simplified visual" fallback for Framer's Static Renderer
    if (isStatic) {
        const emojis = {
            pip: "🔥",
            puff: "☁️",
            botty: "🤖",
            spook: "👻",
            custom: "✨",
        }
        return (
            <WrapperElement
                {...(isLinked ? { href: props.link } : {})}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    minWidth: 100,
                    minHeight: 100,
                    textDecoration: "none",
                    ...props.style,
                }}
            >
                {props.showBubble && (
                    <div
                        style={{
                            backgroundColor: props.bubbleBg,
                            color: props.bubbleColor,
                            padding: "12px 22px",
                            borderRadius: "24px",
                            boxShadow:
                                "0px 14px 34px rgba(0,0,0,0.12), 0px 4px 10px rgba(0,0,0,0.06)",
                            fontWeight: 600,
                            fontSize: "14px",
                            fontFamily: '"Inter", -apple-system, sans-serif',
                            marginBottom: "16px",
                            position: "relative",
                        }}
                    >
                        {props.bubbleText}
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-7px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                width: 0,
                                height: 0,
                                borderLeft: "8px solid transparent",
                                borderRight: "8px solid transparent",
                                borderTop: `8px solid ${props.bubbleBg}`,
                            }}
                        />
                    </div>
                )}
                <div style={{ fontSize: "64px", lineHeight: 1 }}>
                    {emojis[props.characterType] || "🤖"}
                </div>
            </WrapperElement>
        )
    }

    return (
        <WrapperElement
            {...(isLinked ? { href: props.link } : {})}
            onClick={props.onClick}
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "visible",
                cursor: isLinked || props.onClick ? "pointer" : "default",
                textDecoration: "none",
                ...props.style,
            }}
        >
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    overflow: "visible",
                }}
            />

            {props.showBubble && (
                <div
                    ref={bubbleRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        pointerEvents: "none",
                        zIndex: 100,
                        willChange: "transform",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: props.bubbleBg,
                            color: props.bubbleColor,
                            padding: "12px 22px",
                            borderRadius: "24px",
                            boxShadow:
                                "0px 14px 34px rgba(0,0,0,0.12), 0px 4px 10px rgba(0,0,0,0.06)",
                            fontWeight: 600,
                            fontSize: "14px",
                            fontFamily: '"Inter", -apple-system, sans-serif',
                            whiteSpace: "nowrap",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span ref={textNodeRef}>{props.bubbleText}</span>
                        <div
                            style={{
                                position: "absolute",
                                bottom: "-7px",
                                left: "24px",
                                width: 0,
                                height: 0,
                                borderLeft: "8px solid transparent",
                                borderRight: "8px solid transparent",
                                borderTop: `8px solid ${props.bubbleBg}`,
                            }}
                        />
                    </div>
                </div>
            )}
        </WrapperElement>
    )
}

// ==========================================
// 5. FRAMER PROPERTY CONTROLS
// ==========================================
InteractivePet.defaultProps = {
    link: "",
    editorPreview: true,
    appearance: {
        characterType: "botty",
        scale: 1.0,
        globalEyeColor: "#111111",

        pipColorBottom: "#FFD700",
        pipColorMiddle: "#FF5500",
        pipColorTop: "#FF2244",
        puffColorCenter: "#FFFFFF",
        puffColorEdge: "#3A64FF",
        bottyColorTop: "#6EA8FF",
        bottyColorBottom: "#2A7DFF",
        bottyEyeColor: "#FFFFFF",

        customImageSize: 1.8,
        customDepth: 0.25,
    },
    behavior: { speed: 0.05, wobbleSpeed: 2.0, enableIdle: true },
    chatBubble: {
        showBubble: true,
        bubbleText: "Need any help? 👋",
        idleText: "Zzz... 💤",
        bubbleBg: "#FFFFFF",
        bubbleColor: "#111827",
        bubbleOffsetX: 1.2,
        bubbleOffsetY: 1.5,
    },
}

addPropertyControls(InteractivePet, {
    link: { type: ControlType.Link, title: "Link" },
    onClick: { type: ControlType.EventHandler, title: "On Click" },
    editorPreview: { type: ControlType.Boolean, title: "Editor Preview" },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        controls: {
            characterType: {
                type: ControlType.Enum,
                title: "Select Mascot",
                options: ["pip", "puff", "botty", "spook", "custom"],
                optionTitles: [
                    "🔥 Pip (Flame)",
                    "☁️ Puff (Cloud)",
                    "🤖 Botty (Chatbot)",
                    "👻 Spook (Ghost)",
                    "✨ 3D Custom Logo",
                ],
            },
            customImage: {
                type: ControlType.Image,
                title: "Upload Logo",
                hidden(props) {
                    return props.characterType !== "custom"
                },
            },
            customImageSize: {
                type: ControlType.Number,
                title: "Logo Scale",
                min: 0.5,
                max: 4.0,
                step: 0.1,
                hidden(props) {
                    return props.characterType !== "custom"
                },
            },
            customDepth: {
                type: ControlType.Number,
                title: "3D Thickness",
                min: 0.05,
                max: 1.0,
                step: 0.05,
                hidden(props) {
                    return props.characterType !== "custom"
                },
            },

            scale: {
                type: ControlType.Number,
                title: "Size Scale",
                min: 0.1,
                max: 3.0,
                step: 0.1,
                displayStepper: true,
            },
            globalEyeColor: {
                type: ControlType.Color,
                title: "👁️ Base Eye Color",
                hidden(props) {
                    return (
                        props.characterType === "custom" ||
                        props.characterType === "spook" ||
                        props.characterType === "botty"
                    )
                },
            },

            pipColorBottom: {
                type: ControlType.Color,
                title: "🔥 Pip Bottom",
                hidden(props) {
                    return props.characterType !== "pip"
                },
            },
            pipColorMiddle: {
                type: ControlType.Color,
                title: "🔥 Pip Middle",
                hidden(props) {
                    return props.characterType !== "pip"
                },
            },
            pipColorTop: {
                type: ControlType.Color,
                title: "🔥 Pip Top",
                hidden(props) {
                    return props.characterType !== "pip"
                },
            },

            puffColorCenter: {
                type: ControlType.Color,
                title: "☁️ Puff Center",
                hidden(props) {
                    return props.characterType !== "puff"
                },
            },
            puffColorEdge: {
                type: ControlType.Color,
                title: "☁️ Puff Edge",
                hidden(props) {
                    return props.characterType !== "puff"
                },
            },

            bottyColorTop: {
                type: ControlType.Color,
                title: "🤖 Botty Top",
                hidden(props) {
                    return props.characterType !== "botty"
                },
            },
            bottyColorBottom: {
                type: ControlType.Color,
                title: "🤖 Botty Base",
                hidden(props) {
                    return props.characterType !== "botty"
                },
            },
            bottyEyeColor: {
                type: ControlType.Color,
                title: "🤖 Botty Eyes",
                hidden(props) {
                    return props.characterType !== "botty"
                },
            },
        },
    },
    chatBubble: {
        type: ControlType.Object,
        title: "Chat Bubble",
        controls: {
            showBubble: { type: ControlType.Boolean, title: "Show Bubble" },
            bubbleText: { type: ControlType.String, title: "Active Text" },
            idleText: { type: ControlType.String, title: "Idle Text (3s)" },
            bubbleBg: { type: ControlType.Color, title: "Background" },
            bubbleColor: { type: ControlType.Color, title: "Text Color" },
            bubbleOffsetX: {
                type: ControlType.Number,
                title: "Offset X",
                min: -3,
                max: 3,
                step: 0.1,
            },
            bubbleOffsetY: {
                type: ControlType.Number,
                title: "Offset Y",
                min: -3,
                max: 5,
                step: 0.1,
            },
        },
    },
    behavior: {
        type: ControlType.Object,
        title: "Behavior",
        controls: {
            enableIdle: {
                type: ControlType.Boolean,
                title: "Enable Idle Mode",
            },
            speed: {
                type: ControlType.Number,
                title: "Follow Speed",
                min: 0.01,
                max: 0.2,
                step: 0.01,
            },
            wobbleSpeed: {
                type: ControlType.Number,
                title: "Wobble Speed",
                min: 0.5,
                max: 8.0,
                step: 0.5,
            },
        },
    },
})
