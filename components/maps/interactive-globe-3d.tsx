import * as React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import * as THREE from "https://esm.sh/three@0.160.0"
import {
    Canvas,
    useFrame,
} from "https://esm.sh/@react-three/fiber@8.15.16?external=react,react-dom&deps=three@0.160.0"
import { OrbitControls } from "https://esm.sh/@react-three/drei@9.99.0?external=react,react-dom&deps=three@0.160.0,@react-three/fiber@8.15.16"

const PhoneIcon = ({ size = 14 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
)
const MailIcon = ({ size = 14 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
)
const LinkIcon = ({ size = 14 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
)
const MapIcon = ({ size = 14 }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
)

const RenderIcon = ({ type, customSvg, size }) => {
    if (type === "None") return null
    if (type === "Phone") return <PhoneIcon size={size} />
    if (type === "Mail") return <MailIcon size={size} />
    if (type === "Link") return <LinkIcon size={size} />
    if (type === "Map") return <MapIcon size={size} />
    if (type === "Custom" && customSvg)
        return (
            <div
                style={{
                    width: size,
                    height: size,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                dangerouslySetInnerHTML={{ __html: customSvg }}
            />
        )
    return null
}

const countryLanguages = {
    "United States of America": "English",
    "United Kingdom": "English",
    Canada: "English, French",
    Australia: "English",
    China: "Mandarin",
    Japan: "Japanese",
    Germany: "German",
    France: "French",
    India: "Hindi, English",
    Brazil: "Portuguese",
    Russia: "Russian",
    Italy: "Italian",
    Spain: "Spanish",
    Mexico: "Spanish",
    "South Korea": "Korean",
    Indonesia: "Indonesian",
    Turkey: "Turkish",
    "Saudi Arabia": "Arabic",
    "South Africa": "English, Zulu",
    Argentina: "Spanish",
    Egypt: "Arabic",
    Nigeria: "English",
    Pakistan: "Urdu, English",
    Bangladesh: "Bengali",
    Vietnam: "Vietnamese",
    Philippines: "Filipino, English",
    Thailand: "Thai",
    Iran: "Persian",
    Colombia: "Spanish",
    Poland: "Polish",
    Ukraine: "Ukrainian",
    Morocco: "Arabic, Berber",
    Peru: "Spanish",
    Malaysia: "Malay",
    Netherlands: "Dutch",
    Chile: "Spanish",
    Romania: "Romanian",
    Kazakhstan: "Kazakh, Russian",
    Sweden: "Swedish",
    Greece: "Greek",
    Portugal: "Portuguese",
    Hungary: "Hungarian",
    "United Arab Emirates": "Arabic",
    Israel: "Hebrew",
    Switzerland: "German, French",
    Austria: "German",
    Denmark: "Danish",
    Finland: "Finnish",
    Norway: "Norwegian",
    Ireland: "English, Irish",
    "New Zealand": "English",
    Singapore: "English, Mandarin",
    Belgium: "Dutch, French",
    "Czech Republic": "Czech",
}

let cachedImgData = null,
    cachedIdImgData = null,
    cachedImgWidth = 0,
    cachedImgHeight = 0
let cachedBorderGap = null,
    cachedGeoJson = null,
    cachedWaterImg = null,
    cachedQuality = null

const getCountryData = (name) => {
    const language = countryLanguages[name] || "Local / Regional"
    let hash = 0
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return {
        language,
        users: ((Math.abs(hash) % 9000000) + 100000).toLocaleString(),
    }
}

const loadEarthData = async (borderGap, quality, callback) => {
    if (
        cachedImgData &&
        cachedIdImgData &&
        cachedBorderGap === borderGap &&
        cachedQuality === quality
    )
        return callback(
            cachedImgData,
            cachedIdImgData,
            cachedImgWidth,
            cachedImgHeight
        )
    cachedBorderGap = borderGap
    cachedQuality = quality
    let w = 2560,
        h = 1280
    if (quality === "4K") {
        w = 4096
        h = 2048
    } else if (quality === "1080p") {
        w = 1920
        h = 960
    }
    try {
        if (!cachedWaterImg) {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.src =
                "https://unpkg.com/three-globe/example/img/earth-water.png"
            await new Promise((resolve, reject) => {
                if (img.complete) resolve()
                else {
                    img.onload = resolve
                    img.onerror = reject
                }
            })
            cachedWaterImg = img
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.drawImage(cachedWaterImg, 0, 0, canvas.width, canvas.height)
        let imgDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
        let imgData = imgDataObj.data
        if (imgData[0] < 128) {
            for (let i = 0; i < imgData.length; i += 4) {
                imgData[i] = 255 - imgData[i]
                imgData[i + 1] = 255 - imgData[i + 1]
                imgData[i + 2] = 255 - imgData[i + 2]
            }
            ctx.putImageData(imgDataObj, 0, 0)
        }
        const idCanvas = document.createElement("canvas")
        idCanvas.width = w
        idCanvas.height = h
        const idCtx = idCanvas.getContext("2d")
        idCtx.imageSmoothingEnabled = false
        idCtx.fillStyle = "#000000"
        idCtx.fillRect(0, 0, idCanvas.width, idCanvas.height)
        if (!cachedGeoJson) {
            const res = await fetch(
                "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
            )
            cachedGeoJson = await res.json()
        }
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = borderGap
        cachedGeoJson.features.forEach((feature, index) => {
            if (!feature.geometry) return
            const type = feature.geometry.type,
                coords = feature.geometry.coordinates,
                id = index + 1
            const r = (id >> 16) & 255,
                g = (id >> 8) & 255,
                b = id & 255
            const drawPolygon = (ctxToDraw, isIdCanvas) => (polygon) => {
                ctxToDraw.beginPath()
                polygon.forEach((ring) =>
                    ring.forEach((coord, i) => {
                        const x = (coord[0] + 180) * (canvas.width / 360),
                            y = (90 - coord[1]) * (canvas.height / 180)
                        if (i === 0) ctxToDraw.moveTo(x, y)
                        else ctxToDraw.lineTo(x, y)
                    })
                )
                if (isIdCanvas) {
                    ctxToDraw.fillStyle = `rgb(${r},${g},${b})`
                    ctxToDraw.fill("evenodd")
                } else if (borderGap > 0) ctxToDraw.stroke()
            }
            if (type === "Polygon") {
                drawPolygon(ctx, false)(coords)
                drawPolygon(idCtx, true)(coords)
            } else if (type === "MultiPolygon") {
                coords.forEach(drawPolygon(ctx, false))
                coords.forEach(drawPolygon(idCtx, true))
            }
        })
        cachedImgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        cachedIdImgData = idCtx.getImageData(
            0,
            0,
            idCanvas.width,
            idCanvas.height
        ).data
        cachedImgWidth = canvas.width
        cachedImgHeight = canvas.height
        callback(
            cachedImgData,
            cachedIdImgData,
            cachedImgWidth,
            cachedImgHeight
        )
    } catch (e) {
        callback(new Uint8Array(w * h * 4), new Uint8Array(w * h * 4), w, h)
    }
}

const Atmosphere = ({ radius, color }) => (
    <mesh>
        <sphereGeometry args={[radius * 1.15, 64, 64]} />
        <shaderMaterial
            transparent
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            uniforms={{ color: { value: new THREE.Color(color) } }}
            vertexShader={`varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
            fragmentShader={`uniform vec3 color; varying vec3 vNormal; void main() { float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0); gl_FragColor = vec4(color, intensity * 0.8); }`}
        />
    </mesh>
)

const LocationMarker = ({
    marker,
    color,
    size,
    radius,
    uiScale,
    markerDomRef,
}) => {
    const pos = useMemo(() => {
        const latRad = (marker.lat * Math.PI) / 180,
            lonRad = (marker.lon * Math.PI) / 180
        return new THREE.Vector3(
            radius * Math.cos(latRad) * Math.sin(lonRad),
            radius * Math.sin(latRad),
            radius * Math.cos(latRad) * Math.cos(lonRad)
        )
    }, [marker.lat, marker.lon, radius])
    const quaternion = useMemo(
        () =>
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 0, 1),
                pos.clone().normalize()
            ),
        [pos]
    )
    const groupRef = useRef(null),
        ringRef = useRef(null)
    const pulseOffset = useMemo(
        () => (Math.abs(marker.lat) + Math.abs(marker.lon)) % 2.0,
        [marker.lat, marker.lon]
    )

    useFrame(({ clock, camera, size: canvasSize }) => {
        const t = clock.getElapsedTime()
        if (ringRef.current) {
            const progress = ((t + pulseOffset) % 2.0) / 2.0
            const scale = 1 + progress * 3
            ringRef.current.scale.set(scale, scale, scale)
            ringRef.current.material.opacity = (1 - progress) * 0.8
        }
        if (groupRef.current && markerDomRef && markerDomRef.current) {
            const worldPos = new THREE.Vector3()
            groupRef.current.getWorldPosition(worldPos)
            const dot = camera.position
                .clone()
                .normalize()
                .dot(worldPos.clone().normalize())
            const isVisible = dot > 0.15
            worldPos.project(camera)
            const x = (worldPos.x * 0.5 + 0.5) * canvasSize.width,
                y = (worldPos.y * -0.5 + 0.5) * canvasSize.height
            const el = markerDomRef.current
            const currentOpacity = parseFloat(el.style.opacity || 0),
                targetOpacity = isVisible ? 1 : 0
            const newOpacity =
                currentOpacity + (targetOpacity - currentOpacity) * 0.1
            el.style.opacity = newOpacity
            el.style.pointerEvents = newOpacity > 0.5 ? "auto" : "none"
            const scale = isVisible ? uiScale : uiScale * 0.9
            el.style.transform = `translate3d(-50%, -100%, 0) translate3d(${x}px, ${y - 15}px, 0) scale(${scale})`
        }
    })

    return (
        <group ref={groupRef} position={pos} quaternion={quaternion}>
            <mesh>
                <circleGeometry args={[size * 0.6, 32]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={ringRef}>
                <ringGeometry args={[size * 0.6, size * 1.0, 32]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}

const AnimatedLine = ({ start, end, radius, color, thickness, lineArc }) => {
    const curve = useMemo(() => {
        const getPos = (lat, lon) =>
            new THREE.Vector3(
                Math.cos((lat * Math.PI) / 180) *
                    Math.sin((lon * Math.PI) / 180),
                Math.sin((lat * Math.PI) / 180),
                Math.cos((lat * Math.PI) / 180) *
                    Math.cos((lon * Math.PI) / 180)
            )
        const p1 = getPos(start.lat, start.lon),
            p2 = getPos(end.lat, end.lon)
        const points = [],
            segments = 64,
            maxArcHeight = p1.distanceTo(p2) * lineArc * radius
        let axis = new THREE.Vector3().crossVectors(p1, p2)
        if (axis.lengthSq() < 0.0001) axis.set(0, 1, 0).cross(p1)
        axis.normalize()
        const angle = p1.angleTo(p2)
        for (let i = 0; i <= segments; i++) {
            const t = i / segments
            const p = p1.clone().applyAxisAngle(axis, angle * t)
            p.multiplyScalar(radius + Math.sin(t * Math.PI) * maxArcHeight)
            points.push(p)
        }
        return new THREE.CatmullRomCurve3(points)
    }, [start, end, radius, lineArc])

    const materialRef = useRef(null),
        timeRef = useRef((Math.abs(start.lat) + Math.abs(end.lon)) % 5)
    const uniforms = useMemo(
        () => ({
            time: { value: timeRef.current },
            color: { value: new THREE.Color(color) },
        }),
        [color]
    )

    useFrame((_, delta) => {
        timeRef.current += delta
        if (materialRef.current)
            materialRef.current.uniforms.time.value = timeRef.current
    })

    return (
        <mesh>
            <tubeGeometry args={[curve, 64, thickness, 8, false]} />
            <shaderMaterial
                ref={materialRef}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                uniforms={uniforms}
                vertexShader={`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
                fragmentShader={`uniform float time; uniform vec3 color; varying vec2 vUv; void main() { float dash = sin(vUv.x * 50.0 - time * 12.0); float dashAlpha = smoothstep(0.5, 1.0, dash) * 0.4; float t1 = fract(time * 0.4); float t2 = fract(time * 0.4 + 0.5); float tail1 = smoothstep(t1 - 0.3, t1, vUv.x) * step(vUv.x, t1); float tail2 = smoothstep(t2 - 0.3, t2, vUv.x) * step(vUv.x, t2); float head1 = smoothstep(t1 - 0.02, t1, vUv.x) * step(vUv.x, t1); float head2 = smoothstep(t2 - 0.02, t2, vUv.x) * step(vUv.x, t2); float pulses = (tail1 + tail2) * 0.8 + (head1 + head2) * 2.0; float intensity = 0.08 + dashAlpha + pulses; float edgeFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x); gl_FragColor = vec4(color * intensity, intensity * edgeFade); }`}
            />
        </mesh>
    )
}

const vertexShader = `uniform float size; uniform float randomizeSize; uniform float randomnessRatio; uniform float uHoveredId; uniform float uHoverProgress; attribute float randomSizeAttr; attribute float colorMixAttr; attribute float countryIdAttr; varying float vVisibility; varying float vColorMix; varying float vIsHovered; void main() { vIsHovered = (abs(countryIdAttr - uHoveredId) < 0.1 ? 1.0 : 0.0) * uHoverProgress; vec3 displacedPos = position + normalize(position) * (vIsHovered * 0.4); vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0); gl_PointSize = size * (mix(1.0, randomSizeAttr, randomizeSize * randomnessRatio) + vIsHovered * 0.5) * (10.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; vVisibility = mix(0.05, 1.0, smoothstep(-0.2, 0.2, normalize(normalMatrix * normalize(displacedPos)).z)); vColorMix = colorMixAttr; }`
const fragmentShader = `uniform vec3 color; uniform vec3 color2; uniform float useTwoColors; uniform float dotRadius; varying float vVisibility; varying float vColorMix; varying float vIsHovered; void main() { vec2 xy = gl_PointCoord.xy - vec2(0.5); vec2 d = abs(xy) - (0.5 - dotRadius); float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); if (dist > dotRadius) discard; float alpha = smoothstep(dotRadius, max(0.0, dotRadius - 0.1), dist); if (dotRadius < 0.01) alpha = 1.0; vec3 finalColor = mix(mix(color, color2, vColorMix * useTwoColors), vec3(1.0), vIsHovered * 0.7); gl_FragColor = vec4(finalColor, alpha * vVisibility); }`

const GlobeMesh = ({
    dotColor,
    dotColor2,
    useTwoColors,
    dotSize,
    dotRadius,
    randomizeSize,
    randomnessRatio,
    density,
    globeScale,
    boundaryMode,
    borderGap,
    boundaryColor,
    boundaryWidth,
    showRealOcean,
    oceanColor,
    quality,
    showMarkers,
    markers,
    markerColor,
    markerSize,
    showLines,
    lineArc,
    enableHover,
    onHoverChange,
    showAtmosphere,
    atmosphereColor,
    containerWidth,
    globeScaleFactor,
    uiScale,
    markerRefs,
    backgroundColor,
}) => {
    const groupRef = useRef(null)
    const [geometry, setGeometry] = useState(null)
    const [boundaryTexture, setBoundaryTexture] = useState(null)
    const [oceanTexture, setOceanTexture] = useState(null)
    const [normalTex, setNormalTex] = useState(null)
    const [targetHoverId, setTargetHoverId] = useState(0)
    const hoverState = useRef({ currentId: 0, progress: 0 })
    const radius = 5

    const bp = containerWidth < 500 ? 0.5 : containerWidth < 800 ? 0.75 : 1
    const finalDensity = density * bp
    const finalBorderGap =
        boundaryMode === "gap" ? Math.max(0, Math.floor(borderGap * bp)) : 0
    const finalGlobeScale = globeScale * globeScaleFactor

    useEffect(() => {
        let mounted = true,
            currentGeo = null
        loadEarthData(
            finalBorderGap,
            quality,
            (imgData, idImgData, imgWidth, imgHeight) => {
                if (!mounted) return
                const points = [],
                    randomSizes = [],
                    colorMixes = [],
                    countryIds = []
                const latLines = Math.floor(finalDensity),
                    lonLines = Math.floor(finalDensity * 2)
                for (let i = 0; i <= latLines; i++) {
                    const lat = (i / latLines) * Math.PI - Math.PI / 2
                    const currentLonLines = Math.max(
                        1,
                        Math.floor(lonLines * Math.cos(lat))
                    )
                    for (let j = 0; j < currentLonLines; j++) {
                        const lon =
                            (j / currentLonLines) * Math.PI * 2 - Math.PI
                        const px = Math.floor(
                            ((lon + Math.PI) / (2 * Math.PI)) * imgWidth
                        )
                        const py = Math.floor(
                            (1 - (lat + Math.PI / 2) / Math.PI) * imgHeight
                        )
                        const index = (py * imgWidth + px) * 4
                        if (imgData[index] < 128) {
                            points.push(
                                radius * Math.cos(lat) * Math.sin(lon),
                                radius * Math.sin(lat),
                                radius * Math.cos(lat) * Math.cos(lon)
                            )
                            const pseudoRand =
                                Math.abs(
                                    Math.sin((i * 1000 + j) * 12.9898) *
                                        43758.5453
                                ) % 1
                            const pseudoRandColor =
                                Math.abs(
                                    Math.cos((i * 1000 + j) * 78.233) *
                                        43758.5453
                                ) % 1
                            randomSizes.push(pseudoRand * 0.8 + 0.2)
                            colorMixes.push(pseudoRandColor > 0.5 ? 1.0 : 0.0)
                            countryIds.push(
                                (idImgData[index] << 16) |
                                    (idImgData[index + 1] << 8) |
                                    idImgData[index + 2]
                            )
                        }
                    }
                }
                const geo = new THREE.BufferGeometry()
                geo.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(points, 3)
                )
                geo.setAttribute(
                    "randomSizeAttr",
                    new THREE.Float32BufferAttribute(randomSizes, 1)
                )
                geo.setAttribute(
                    "colorMixAttr",
                    new THREE.Float32BufferAttribute(colorMixes, 1)
                )
                geo.setAttribute(
                    "countryIdAttr",
                    new THREE.Float32BufferAttribute(countryIds, 1)
                )
                if (mounted) {
                    setGeometry(geo)
                    currentGeo = geo
                } else geo.dispose()
            }
        )
        return () => {
            mounted = false
            if (currentGeo) currentGeo.dispose()
        }
    }, [finalDensity, finalBorderGap, quality])

    useEffect(() => {
        if (boundaryMode !== "lines" || !cachedGeoJson) {
            setBoundaryTexture(null)
            return
        }
        const canvas = document.createElement("canvas")
        let w = 2560,
            h = 1280
        if (quality === "4K") {
            w = 4096
            h = 2048
        } else if (quality === "1080p") {
            w = 1920
            h = 960
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.clearRect(0, 0, w, h)
        ctx.strokeStyle = boundaryColor
        ctx.lineWidth = boundaryWidth * (w / 2560)
        cachedGeoJson.features.forEach((feature) => {
            if (!feature.geometry) return
            const type = feature.geometry.type,
                coords = feature.geometry.coordinates
            const drawPolygon = (polygon) => {
                ctx.beginPath()
                polygon.forEach((ring) => {
                    ring.forEach((coord, i) => {
                        const x = (coord[0] + 180) * (w / 360),
                            y = (90 - coord[1]) * (h / 180)
                        if (i === 0) ctx.moveTo(x, y)
                        else ctx.lineTo(x, y)
                    })
                })
                ctx.stroke()
            }
            if (type === "Polygon") drawPolygon(coords)
            else if (type === "MultiPolygon") coords.forEach(drawPolygon)
        })
        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        setBoundaryTexture(texture)
        return () => texture.dispose()
    }, [boundaryMode, boundaryColor, boundaryWidth, quality, geometry])

    useEffect(() => {
        let currentOceanTex = null,
            currentNormalTex = null,
            isMounted = true
        if (!showRealOcean) {
            setOceanTexture(null)
            setNormalTex(null)
            return
        }

        const loadOceanImg = () => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            let hasLoaded = false
            img.onload = () => {
                if (hasLoaded || !isMounted) return
                hasLoaded = true
                const canvas = document.createElement("canvas")
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext("2d")
                ctx.drawImage(img, 0, 0)
                const imgDataObj = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                )
                const data = imgDataObj.data
                if (data[0] < 128) {
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i]
                        data[i + 1] = 255 - data[i + 1]
                        data[i + 2] = 255 - data[i + 2]
                    }
                    ctx.putImageData(imgDataObj, 0, 0)
                }
                const tex = new THREE.CanvasTexture(canvas)
                tex.needsUpdate = true
                currentOceanTex = tex
                setOceanTexture(tex)
            }
            img.src =
                "https://unpkg.com/three-globe/example/img/earth-water.png"
            if (img.complete && img.naturalHeight !== 0) {
                img.onload()
            }
        }
        loadOceanImg()

        new THREE.TextureLoader().load(
            "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg",
            (t) => {
                if (!isMounted) {
                    t.dispose()
                    return
                }
                t.wrapS = t.wrapT = THREE.RepeatWrapping
                t.repeat.set(12, 6)
                currentNormalTex = t
                setNormalTex(t)
            }
        )
        return () => {
            isMounted = false
            if (currentOceanTex) currentOceanTex.dispose()
            if (currentNormalTex) currentNormalTex.dispose()
        }
    }, [showRealOcean])

    const material = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(dotColor) },
                    color2: { value: new THREE.Color(dotColor2) },
                    size: { value: dotSize * globeScaleFactor },
                    dotRadius: { value: dotRadius },
                    useTwoColors: { value: useTwoColors ? 1.0 : 0.0 },
                    randomizeSize: { value: randomizeSize ? 1.0 : 0.0 },
                    randomnessRatio: { value: randomnessRatio },
                    uHoveredId: { value: 0 },
                    uHoverProgress: { value: 0 },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
            }),
        [
            dotColor,
            dotColor2,
            dotSize,
            dotRadius,
            globeScaleFactor,
            useTwoColors,
            randomizeSize,
            randomnessRatio,
        ]
    )

    useEffect(() => () => material?.dispose(), [material])

    useFrame((_, delta) => {
        if (enableHover && material) {
            const hs = hoverState.current
            if (targetHoverId !== hs.currentId) {
                hs.progress -= delta * 6.0
                if (hs.progress <= 0) {
                    hs.progress = 0
                    hs.currentId = targetHoverId
                }
            } else if (hs.currentId !== 0)
                hs.progress = Math.min(1.0, hs.progress + delta * 6.0)
            material.uniforms.uHoveredId.value = hs.currentId
            material.uniforms.uHoverProgress.value = hs.progress
        }
    })

    const handlePointerMove = (e) => {
        e.stopPropagation()
        if (!enableHover || !cachedIdImgData || !groupRef.current) return
        const localPt = groupRef.current.worldToLocal(e.point.clone())
        const lat = Math.asin(localPt.y / localPt.length()),
            lon = Math.atan2(localPt.x, localPt.z)
        const px = Math.max(
            0,
            Math.min(
                Math.floor(((lon + Math.PI) / (2 * Math.PI)) * cachedImgWidth),
                cachedImgWidth - 1
            )
        )
        const py = Math.max(
            0,
            Math.min(
                Math.floor(
                    (1 - (lat + Math.PI / 2) / Math.PI) * cachedImgHeight
                ),
                cachedImgHeight - 1
            )
        )
        const index = (py * cachedImgWidth + px) * 4
        const countryId =
            (cachedIdImgData[index] << 16) |
            (cachedIdImgData[index + 1] << 8) |
            cachedIdImgData[index + 2]
        if (countryId !== 0) {
            if (targetHoverId !== countryId) setTargetHoverId(countryId)
            if (onHoverChange)
                onHoverChange(
                    cachedGeoJson.features[countryId - 1],
                    e.clientX,
                    e.clientY
                )
        } else {
            if (targetHoverId !== 0) setTargetHoverId(0)
            if (onHoverChange) onHoverChange(null, e.clientX, e.clientY)
        }
    }

    if (!geometry) return null

    return (
        <group ref={groupRef} scale={finalGlobeScale} rotation={[0.2, 0, 0]}>
            {showAtmosphere && (
                <Atmosphere radius={radius} color={atmosphereColor} />
            )}
            {showRealOcean && oceanTexture && normalTex && (
                <group>
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[20, 10, 20]} intensity={1.5} />
                    <directionalLight
                        position={[-20, 10, -20]}
                        intensity={1.0}
                    />
                    <directionalLight position={[0, -20, 20]} intensity={0.8} />
                    <mesh rotation={[0, -Math.PI / 2, 0]}>
                        <sphereGeometry args={[radius * 0.99, 64, 64]} />
                        <meshPhongMaterial
                            color={oceanColor}
                            transparent={true}
                            alphaMap={oceanTexture}
                            alphaTest={0.05}
                            specular={new THREE.Color("#ffffff")}
                            shininess={90}
                            normalMap={normalTex}
                            normalScale={new THREE.Vector2(0.8, 0.8)}
                        />
                    </mesh>
                </group>
            )}
            {boundaryMode === "lines" && boundaryTexture && (
                <mesh rotation={[0, -Math.PI / 2, 0]}>
                    <sphereGeometry args={[radius * 1.002, 64, 64]} />
                    <meshBasicMaterial
                        map={boundaryTexture}
                        transparent
                        depthWrite={false}
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
            <points geometry={geometry} material={material} />

            {/* Invisible interaction mesh for hover raycasting */}
            <mesh
                onPointerMove={handlePointerMove}
                onPointerOut={(e) => {
                    e.stopPropagation()
                    setTargetHoverId(0)
                    if (onHoverChange) onHoverChange(null, e.clientX, e.clientY)
                }}
            >
                <sphereGeometry args={[radius, 32, 32]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Solid underlying core to prevent land transparency */}
            <mesh>
                <sphereGeometry args={[radius * 0.98, 64, 64]} />
                <meshBasicMaterial color={backgroundColor} />
            </mesh>

            {showMarkers &&
                markers.map((marker, idx) => (
                    <LocationMarker
                        key={`marker-${marker.id}`}
                        marker={marker}
                        color={markerColor}
                        size={markerSize * globeScaleFactor}
                        radius={radius}
                        uiScale={uiScale}
                        markerDomRef={markerRefs.current[idx]}
                    />
                ))}
            {showMarkers &&
                showLines &&
                markers.length > 1 &&
                markers.map((marker, idx) =>
                    idx === markers.length - 1 ? null : (
                        <AnimatedLine
                            key={`line-${marker.id}`}
                            start={marker}
                            end={markers[idx + 1]}
                            radius={radius}
                            color={markerColor}
                            thickness={0.02 * globeScaleFactor}
                            lineArc={lineArc}
                        />
                    )
                )}
        </group>
    )
}

export default function FramerGlobe(incomingProps) {
    const props = {
        ...incomingProps,
        ...(incomingProps.demo || {}),
        ...(incomingProps.globe || {}),
        ...(incomingProps.boundaries || {}),
        ...(incomingProps.ocean || {}),
        ...(incomingProps.colors || {}),
        ...(incomingProps.interactivity || {}),
        ...(incomingProps.markersGroup || {}),
    }

    const containerRef = useRef(null)
    const [containerWidth, setContainerWidth] = useState(800)
    const [tooltipData, setTooltipData] = useState(null)
    const [isTooltipVisible, setIsTooltipVisible] = useState(false)
    const tooltipRef = useRef(null)
    const currentCountryRef = useRef(null)

    const [demoConfig, setDemoConfig] = useState({
        dotColor: props.dotColor,
        dotColor2: props.dotColor2,
        useTwoColors: props.useTwoColors,
        backgroundColor: props.backgroundColor,
        density: props.density,
        rotationSpeed: props.rotationSpeed,
        showRealOcean: props.showRealOcean,
        boundaryMode: props.boundaryMode,
    })

    useEffect(() => {
        setDemoConfig({
            dotColor: props.dotColor,
            dotColor2: props.dotColor2,
            useTwoColors: props.useTwoColors,
            backgroundColor: props.backgroundColor,
            density: props.density,
            rotationSpeed: props.rotationSpeed,
            showRealOcean: props.showRealOcean,
            boundaryMode: props.boundaryMode,
        })
    }, [
        props.dotColor,
        props.dotColor2,
        props.useTwoColors,
        props.backgroundColor,
        props.density,
        props.rotationSpeed,
        props.showRealOcean,
        props.boundaryMode,
    ])

    const activeProps = props.showDemoUI ? { ...props, ...demoConfig } : props

    useEffect(() => {
        if (!containerRef.current) return
        let timeoutId = null
        const observer = new ResizeObserver((entries) => {
            if (timeoutId) clearTimeout(timeoutId)
            timeoutId = setTimeout(
                () => setContainerWidth(entries[0].contentRect.width),
                50
            )
        })
        observer.observe(containerRef.current)
        return () => {
            observer.disconnect()
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [])

    const globeScaleFactor = Math.max(0.4, Math.min(containerWidth / 800, 1.5))
    const uiScale =
        Math.max(0.65, Math.min(containerWidth / 800, 1.1)) *
        (activeProps.markerUIScale || 1)

    const parsedMarkers = useMemo(() => {
        if (!activeProps.markers || !Array.isArray(activeProps.markers))
            return []
        return activeProps.markers.map((m, index) => {
            let formattedLink = (m.link || "").trim()
            if (
                formattedLink.includes("@") &&
                !formattedLink.startsWith("mailto:") &&
                !formattedLink.startsWith("http")
            )
                formattedLink = `mailto:${formattedLink}`
            else if (formattedLink.startsWith("www."))
                formattedLink = `https://${formattedLink}`
            return {
                id: index,
                lat: m.lat || 0,
                lon: m.lon || 0,
                name: m.name || "Office",
                link: formattedLink,
            }
        })
    }, [activeProps.markers])

    const markerRefs = useRef([])
    if (markerRefs.current.length !== parsedMarkers.length)
        markerRefs.current = parsedMarkers.map(
            (_, i) => markerRefs.current[i] || React.createRef()
        )

    const handleHover = (feature, x, y) => {
        if (tooltipRef.current) {
            tooltipRef.current.style.left = `${x}px`
            tooltipRef.current.style.top = `${y - 24}px`
        }
        if (feature) {
            const name = feature.properties?.name || "Unknown"
            if (currentCountryRef.current !== name) {
                currentCountryRef.current = name
                setTooltipData({ name, ...getCountryData(name) })
                setIsTooltipVisible(true)
            }
        } else if (currentCountryRef.current !== null) {
            currentCountryRef.current = null
            setIsTooltipVisible(false)
        }
    }

    const currentQuality = activeProps.quality || "2K"
    let dprSetting = 1
    if (currentQuality === "4K") dprSetting = 2
    else if (currentQuality === "2K") dprSetting = 1.5

    const demoUiScale = Math.max(0.6, Math.min(0.9, containerWidth / 600))

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: "100px",
                minHeight: "100px",
                background: activeProps.backgroundColor,
                position: "relative",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
            >
                <Canvas
                    style={{ width: "100%", height: "100%", display: "block" }}
                    camera={{ position: [0, 0, 14], fov: 45 }}
                    dpr={[1, dprSetting]}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: "default",
                    }}
                >
                    <GlobeMesh
                        {...activeProps}
                        quality={currentQuality}
                        markers={parsedMarkers}
                        onHoverChange={handleHover}
                        containerWidth={containerWidth}
                        globeScaleFactor={globeScaleFactor}
                        uiScale={uiScale}
                        markerRefs={markerRefs}
                    />
                    <OrbitControls
                        enablePan={false}
                        enableZoom={false}
                        autoRotate={!isTooltipVisible}
                        autoRotateSpeed={activeProps.rotationSpeed * 1000}
                    />
                </Canvas>
            </div>

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 10,
                }}
            >
                {activeProps.showMarkers &&
                    parsedMarkers.map((marker, idx) => (
                        <div
                            key={`label-${marker.id}`}
                            ref={markerRefs.current[idx]}
                            style={{
                                ...(activeProps.textFont || {}),
                                position: "absolute",
                                top: 0,
                                left: 0,
                                opacity: 0,
                                transformOrigin: "center center",
                                willChange: "transform, opacity",
                                background:
                                    "linear-gradient(180deg, rgba(20, 20, 22, 0.65) 0%, rgba(10, 10, 12, 0.85) 100%)",
                                backdropFilter: "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                padding: "14px",
                                borderRadius: "16px",
                                color: "#fff",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                                alignItems: "center",
                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                                whiteSpace: "nowrap",
                                minWidth: "140px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "2px",
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: "600",
                                        fontSize: "15px",
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {marker.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "rgba(255,255,255,0.4)",
                                        fontWeight: "500",
                                    }}
                                >
                                    {marker.lat.toFixed(2)}°,{" "}
                                    {marker.lon.toFixed(2)}°
                                </div>
                            </div>
                            {marker.link && (
                                <a
                                    href={marker.link}
                                    target={
                                        marker.link.startsWith("http")
                                            ? "_blank"
                                            : "_self"
                                    }
                                    rel="noopener noreferrer"
                                    style={{
                                        textDecoration: "none",
                                        width: "100%",
                                        padding: "10px 16px",
                                        background: activeProps.buttonBgColor,
                                        color: activeProps.buttonTextColor,
                                        borderRadius: `${activeProps.buttonRadius}px`,
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        boxShadow: `0 4px 16px ${activeProps.buttonBgColor}50`,
                                        transition: "all 0.2s ease",
                                        pointerEvents: "auto",
                                        boxSizing: "border-box",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform =
                                            "scale(1.03)"
                                        e.currentTarget.style.boxShadow = `0 6px 20px ${activeProps.buttonBgColor}70`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform =
                                            "scale(1)"
                                        e.currentTarget.style.boxShadow = `0 4px 16px ${activeProps.buttonBgColor}50`
                                    }}
                                >
                                    <RenderIcon
                                        type={activeProps.buttonIconType}
                                        customSvg={activeProps.buttonCustomSvg}
                                        size={14}
                                    />
                                    {activeProps.buttonText}
                                </a>
                            )}
                        </div>
                    ))}
            </div>

            {activeProps.showTooltip && (
                <div
                    ref={tooltipRef}
                    style={{
                        ...(activeProps.textFont || {}),
                        position: "absolute",
                        transform: `translate(-50%, -100%) scale(${isTooltipVisible ? uiScale : 0.95 * uiScale})`,
                        transformOrigin: "bottom center",
                        opacity: isTooltipVisible ? 1 : 0,
                        transition: "opacity 0.2s ease, transform 0.2s ease",
                        pointerEvents: "none",
                        background:
                            "linear-gradient(180deg, rgba(20, 20, 22, 0.65) 0%, rgba(10, 10, 12, 0.85) 100%)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "16px",
                        borderRadius: "16px",
                        color: "#fff",
                        zIndex: 1000,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                        minWidth: "200px",
                        willChange: "left, top, opacity, transform",
                        boxSizing: "border-box",
                    }}
                >
                    {tooltipData && (
                        <>
                            <div
                                style={{
                                    fontWeight: "600",
                                    fontSize: "15px",
                                    letterSpacing: "-0.02em",
                                    color: "#fff",
                                    textAlign: "center",
                                }}
                            >
                                {tooltipData.name}
                            </div>
                            <div
                                style={{
                                    height: "1px",
                                    background:
                                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                                    margin: "4px 0",
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        color: "rgba(255,255,255,0.5)",
                                        fontSize: "12px",
                                    }}
                                >
                                    Language
                                </span>
                                <span
                                    style={{
                                        color: "rgba(255,255,255,0.9)",
                                        fontSize: "12px",
                                        fontWeight: "500",
                                    }}
                                >
                                    {tooltipData.language}
                                </span>
                            </div>
                            {activeProps.showActiveUsers && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "rgba(255,255,255,0.5)",
                                            fontSize: "12px",
                                        }}
                                    >
                                        Active Users
                                    </span>
                                    <span
                                        style={{
                                            color: activeProps.markerColor,
                                            fontSize: "12px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {tooltipData.users}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {props.showDemoUI && (
                <div
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        zIndex: 2000,
                        pointerEvents: "auto",
                        transform: `scale(${demoUiScale})`,
                        transformOrigin: "top right",
                        background: "rgba(15, 15, 18, 0.85)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        padding: "14px",
                        borderRadius: "12px",
                        color: "white",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        width: "200px",
                        maxHeight: "calc(100% - 32px)",
                        overflowY: "auto",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontFamily: "sans-serif",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            letterSpacing: "-0.02em",
                            marginBottom: "2px",
                        }}
                    >
                        Globe Customizer
                    </div>
                    <div
                        style={{
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "rgba(255,255,255,0.4)",
                        }}
                    >
                        Colors
                    </div>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        Background
                        <input
                            type="color"
                            value={demoConfig.backgroundColor}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    backgroundColor: e.target.value,
                                })
                            }
                            style={{
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                padding: 0,
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                overflow: "hidden",
                            }}
                        />
                    </label>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        Use Two Colors
                        <input
                            type="checkbox"
                            checked={demoConfig.useTwoColors}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    useTwoColors: e.target.checked,
                                })
                            }
                            style={{
                                cursor: "pointer",
                                width: "13px",
                                height: "13px",
                                accentColor: "#00ffcc",
                            }}
                        />
                    </label>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        Primary Dot
                        <input
                            type="color"
                            value={demoConfig.dotColor}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    dotColor: e.target.value,
                                })
                            }
                            style={{
                                cursor: "pointer",
                                background: "none",
                                border: "none",
                                padding: 0,
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                overflow: "hidden",
                            }}
                        />
                    </label>
                    {demoConfig.useTwoColors && (
                        <label
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.8)",
                                animation: "fadeIn 0.2s ease",
                            }}
                        >
                            Secondary Dot
                            <input
                                type="color"
                                value={demoConfig.dotColor2}
                                onChange={(e) =>
                                    setDemoConfig({
                                        ...demoConfig,
                                        dotColor2: e.target.value,
                                    })
                                }
                                style={{
                                    cursor: "pointer",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                }}
                            />
                        </label>
                    )}
                    <div
                        style={{
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "rgba(255,255,255,0.4)",
                            marginTop: "4px",
                        }}
                    >
                        Features
                    </div>
                    <label
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Density</span>{" "}
                            <span>{demoConfig.density}</span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="400"
                            step="1"
                            value={demoConfig.density}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    density: parseInt(e.target.value),
                                })
                            }
                            style={{
                                cursor: "pointer",
                                accentColor: "#00ffcc",
                            }}
                        />
                    </label>
                    <label
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                            }}
                        >
                            <span>Speed</span>{" "}
                            <span>{demoConfig.rotationSpeed.toFixed(3)}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="0.02"
                            step="0.001"
                            value={demoConfig.rotationSpeed}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    rotationSpeed: parseFloat(e.target.value),
                                })
                            }
                            style={{
                                cursor: "pointer",
                                accentColor: "#00ffcc",
                            }}
                        />
                    </label>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                        }}
                    >
                        Boundaries
                        <select
                            value={demoConfig.boundaryMode}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    boundaryMode: e.target.value,
                                })
                            }
                            style={{
                                background: "rgba(255,255,255,0.1)",
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.2)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                cursor: "pointer",
                                outline: "none",
                            }}
                        >
                            <option value="gap" style={{ background: "#111" }}>
                                Dot Gap
                            </option>
                            <option
                                value="lines"
                                style={{ background: "#111" }}
                            >
                                Solid Lines
                            </option>
                        </select>
                    </label>
                    <label
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "11px",
                            color: "rgba(255,255,255,0.8)",
                            cursor: "pointer",
                        }}
                    >
                        Real Ocean
                        <input
                            type="checkbox"
                            checked={demoConfig.showRealOcean}
                            onChange={(e) =>
                                setDemoConfig({
                                    ...demoConfig,
                                    showRealOcean: e.target.checked,
                                })
                            }
                            style={{
                                cursor: "pointer",
                                width: "13px",
                                height: "13px",
                                accentColor: "#00ffcc",
                            }}
                        />
                    </label>
                    <div
                        style={{
                            marginTop: "6px",
                            padding: "10px",
                            background:
                                "linear-gradient(135deg, rgba(0, 255, 204, 0.1), rgba(0, 136, 255, 0.1))",
                            border: "1px solid rgba(0, 255, 204, 0.2)",
                            borderRadius: "8px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "10px",
                                color: "rgba(255,255,255,0.9)",
                                lineHeight: "1.3",
                            }}
                        >
                            Purchase to unlock <b>endless customization</b>{" "}
                            possibilities.
                        </span>
                        <a
                            href={activeProps.demoCtaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "block",
                                background: "#00ffcc",
                                color: "#000",
                                textDecoration: "none",
                                padding: "6px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                transition: "transform 0.2s",
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.transform =
                                    "scale(1.03)")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                            }
                        >
                            Get Full Access
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}

FramerGlobe.defaultProps = {
    width: 100,
    height: 100,
    demo: {
        showDemoUI: false,
        demoCtaLink: "https://framer.com",
    },
    globe: {
        quality: "2K",
        globeScale: 1,
        rotationSpeed: 0.0015,
        backgroundColor: "#000000",
        density: 200,
        dotSize: 2.0,
        dotRadius: 0.5,
        randomizeSize: false,
        randomnessRatio: 0.5,
        showAtmosphere: true,
        atmosphereColor: "#0088ff",
    },
    boundaries: {
        boundaryMode: "gap",
        borderGap: 8,
        boundaryColor: "#ffffff",
        boundaryWidth: 1,
    },
    ocean: {
        showRealOcean: false,
        oceanColor: "#0044ff",
    },
    colors: {
        dotColor: "#ffffff",
        useTwoColors: false,
        dotColor2: "#0088ff",
    },
    interactivity: {
        enableHover: true,
        showTooltip: true,
        showActiveUsers: true,
    },
    markersGroup: {
        showMarkers: true,
        markerColor: "#00ffcc",
        markerSize: 0.15,
        markerUIScale: 1.0,
        showLines: true,
        lineArc: 0.4,
        buttonIconType: "Link",
        buttonCustomSvg:
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
        buttonText: "Visit Site",
        buttonBgColor: "#00ffcc",
        buttonTextColor: "#000000",
        buttonRadius: 8,
        markers: [
            {
                lat: 37.7749,
                lon: -122.4194,
                name: "San Francisco",
                link: "https://framer.com",
            },
            {
                lat: 51.5074,
                lon: -0.1278,
                name: "London",
                link: "https://framer.com",
            },
            {
                lat: 35.6895,
                lon: 139.6917,
                name: "Tokyo",
                link: "https://framer.com",
            },
            {
                lat: -33.8688,
                lon: 151.2093,
                name: "Sydney",
                link: "https://framer.com",
            },
        ],
    },
}

addPropertyControls(FramerGlobe, {
    demo: {
        type: ControlType.Object,
        title: "Demo UI",
        controls: {
            showDemoUI: { type: ControlType.Boolean, title: "Show Demo UI" },
            demoCtaLink: {
                type: ControlType.String,
                title: "Demo CTA Link",
                hidden: (p) => !p.showDemoUI,
            },
        },
    },
    globe: {
        type: ControlType.Object,
        title: "Globe Settings",
        controls: {
            quality: {
                type: ControlType.Enum,
                title: "Quality",
                options: ["1080p", "2K", "4K"],
                displaySegmentedControl: true,
            },
            globeScale: {
                type: ControlType.Number,
                title: "Globe Scale",
                min: 0.5,
                max: 2,
                step: 0.1,
                displayStepper: true,
                unit: "x",
            },
            rotationSpeed: {
                type: ControlType.Number,
                title: "Rotation Speed",
                min: 0,
                max: 0.01,
                step: 0.0001,
                unit: "x",
            },
            backgroundColor: { type: ControlType.Color, title: "Background" },
            density: {
                type: ControlType.Number,
                title: "Dot Density",
                min: 50,
                max: 400,
                step: 10,
                unit: "pts",
            },
            dotSize: {
                type: ControlType.Number,
                title: "Dot Size",
                min: 0.5,
                max: 30,
                step: 0.1,
                unit: "px",
            },
            dotRadius: {
                type: ControlType.Number,
                title: "Dot Radius",
                min: 0,
                max: 0.5,
                step: 0.01,
                unit: "px",
            },
            randomizeSize: {
                type: ControlType.Boolean,
                title: "Randomize Size",
            },
            randomnessRatio: {
                type: ControlType.Number,
                title: "Randomness",
                min: 0,
                max: 1,
                step: 0.01,
                hidden: (p) => !p.randomizeSize,
                unit: "x",
            },
            showAtmosphere: { type: ControlType.Boolean, title: "Atmosphere" },
            atmosphereColor: {
                type: ControlType.Color,
                title: "Atmos Color",
                hidden: (p) => !p.showAtmosphere,
            },
        },
    },
    boundaries: {
        type: ControlType.Object,
        title: "Boundaries",
        controls: {
            boundaryMode: {
                type: ControlType.Enum,
                title: "Boundaries",
                options: ["gap", "lines", "none"],
                optionTitles: ["Dot Gap", "Solid Lines", "None"],
            },
            borderGap: {
                type: ControlType.Number,
                title: "Border Gap",
                min: 0,
                max: 20,
                step: 1,
                hidden: (p) => p.boundaryMode !== "gap",
                unit: "px",
            },
            boundaryColor: {
                type: ControlType.Color,
                title: "Boundary Color",
                hidden: (p) => p.boundaryMode !== "lines",
            },
            boundaryWidth: {
                type: ControlType.Number,
                title: "Boundary Width",
                min: 0.5,
                max: 5,
                step: 0.5,
                hidden: (p) => p.boundaryMode !== "lines",
                unit: "px",
            },
        },
    },
    ocean: {
        type: ControlType.Object,
        title: "Ocean",
        controls: {
            showRealOcean: { type: ControlType.Boolean, title: "Real Ocean" },
            oceanColor: {
                type: ControlType.Color,
                title: "Ocean Color",
                hidden: (p) => !p.showRealOcean,
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Dot Colors",
        controls: {
            dotColor: { type: ControlType.Color, title: "Dot Color 1" },
            useTwoColors: { type: ControlType.Boolean, title: "Use 2 Colors" },
            dotColor2: {
                type: ControlType.Color,
                title: "Dot Color 2",
                hidden: (p) => !p.useTwoColors,
            },
        },
    },
    interactivity: {
        type: ControlType.Object,
        title: "Interactivity",
        controls: {
            enableHover: { type: ControlType.Boolean, title: "Enable Hover" },
            showTooltip: {
                type: ControlType.Boolean,
                title: "Show Tooltip",
                hidden: (p) => !p.enableHover,
            },
            showActiveUsers: {
                type: ControlType.Boolean,
                title: "Show Users",
                hidden: (p) => !p.enableHover || !p.showTooltip,
            },
        },
    },
    markersGroup: {
        type: ControlType.Object,
        title: "Markers",
        controls: {
            showMarkers: { type: ControlType.Boolean, title: "Show Markers" },
            markerColor: {
                type: ControlType.Color,
                title: "Marker Color",
                hidden: (p) => !p.showMarkers,
            },
            markerSize: {
                type: ControlType.Number,
                title: "Marker Size",
                min: 0.05,
                max: 0.5,
                step: 0.01,
                hidden: (p) => !p.showMarkers,
                unit: "x",
            },
            markerUIScale: {
                type: ControlType.Number,
                title: "Marker UI Scale",
                min: 0.1,
                max: 3.0,
                step: 0.1,
                hidden: (p) => !p.showMarkers,
                unit: "x",
            },
            showLines: {
                type: ControlType.Boolean,
                title: "Connect Lines",
                hidden: (p) => !p.showMarkers,
            },
            lineArc: {
                type: ControlType.Number,
                title: "Line Arc",
                min: 0.1,
                max: 2,
                step: 0.05,
                hidden: (p) => !p.showMarkers || !p.showLines,
                unit: "x",
            },
            buttonIconType: {
                type: ControlType.Enum,
                title: "Button Icon",
                options: ["None", "Phone", "Mail", "Link", "Map", "Custom"],
                hidden: (p) => !p.showMarkers,
            },
            buttonCustomSvg: {
                type: ControlType.String,
                title: "Custom SVG",
                hidden: (p) => !p.showMarkers || p.buttonIconType !== "Custom",
            },
            buttonText: {
                type: ControlType.String,
                title: "Button Text",
                hidden: (p) => !p.showMarkers,
            },
            buttonBgColor: {
                type: ControlType.Color,
                title: "Button BG",
                hidden: (p) => !p.showMarkers,
            },
            buttonTextColor: {
                type: ControlType.Color,
                title: "Button Text",
                hidden: (p) => !p.showMarkers,
            },
            buttonRadius: {
                type: ControlType.Number,
                title: "Button Radius",
                min: 0,
                max: 24,
                step: 1,
                hidden: (p) => !p.showMarkers,
                unit: "px",
            },
            markers: {
                type: ControlType.Array,
                title: "Locations",
                control: {
                    type: ControlType.Object,
                    controls: {
                        name: { type: ControlType.String, title: "Name" },
                        lat: {
                            type: ControlType.Number,
                            title: "Latitude",
                            min: -90,
                            max: 90,
                            unit: "°",
                        },
                        lon: {
                            type: ControlType.Number,
                            title: "Longitude",
                            min: -180,
                            max: 180,
                            unit: "°",
                        },
                        link: { type: ControlType.String, title: "Link/Email" },
                    },
                },
                hidden: (p) => !p.showMarkers,
            },
        },
    },
})
