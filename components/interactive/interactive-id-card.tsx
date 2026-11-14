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


// ============================================================================
// TYPES & DEFAULT CONFIGURATION
// ============================================================================

type CardLayoutStyle = "auroraOverlay" | "cyberPixel" | "executiveId"

type FramerFontConfig = {
    fontFamily?: string
    fontWeight?: string | number
    fontStyle?: string
    fontSize?: string | number
    letterSpacing?: string | number
    lineHeight?: string | number
    textAlign?: "left" | "center" | "right" | "justify"
}

type FlatProps = {
    livePreview: boolean
    // Card Layout & Media
    cardLayout: CardLayoutStyle
    mediaImage: string | { src?: string }
    mediaVideo: string
    mediaFit: "cover" | "contain"
    overlayOpacity: number
    clickToUpload: boolean
    // Badge Typography & Floating 3D Parallax
    brandName: string
    brandFont: FramerFontConfig
    roleTitle: string
    roleFont: FramerFontConfig
    attendeeName: string
    nameFont: FramerFontConfig
    jobTitle: string
    companyName: string
    badgeId: string
    metaFont: FramerFontConfig
    showLogoEmblem: boolean
    showStrapEmblem: boolean
    showQr: boolean
    textFloatDepth: number
    textParallax: number
    textShadowOpacity: number
    // Always-Visible Color Controls
    transparentBg: boolean
    bgColor: string
    strapColor: string
    strapEmblemColor: string
    metalColor: string
    cardBaseColor: string
    cardAccentColor: string
    cardSecondaryColor: string
    textColor: string
    strapDrop: number
    // Physics & Interaction
    interactivePhysics: boolean
    draggableCard: boolean
    gravity: number
    damping: number
    swivelFreedom: number
    idleSway: number
    hoverNudge: number
    // Camera & Render
    zoom: number
    restingYaw: number
    quality: number
}

type Props = Partial<FlatProps> & {
    media?: Partial<FlatProps>
    cardContent?: Partial<FlatProps>
    typography?: Partial<FlatProps>
    colors?: Partial<FlatProps>
    physics?: Partial<FlatProps>
    cameraView?: Partial<FlatProps>
    style?: React.CSSProperties
    id?: string
    className?: string
}

const defaults: FlatProps = {
    livePreview: true,
    cardLayout: "auroraOverlay",
    mediaImage: "",
    mediaVideo: "",
    mediaFit: "cover",
    overlayOpacity: 55,
    clickToUpload: true,
    brandName: "FutureTech\nSummit",
    brandFont: {
        fontFamily: "Inter",
        fontWeight: 600,
        fontStyle: "normal",
        fontSize: "18px",
        letterSpacing: "-0.01em",
        lineHeight: "1.18em",
    },
    roleTitle: "Organizer",
    roleFont: {
        fontFamily: "Inter",
        fontWeight: 600,
        fontStyle: "normal",
        fontSize: "72px",
        letterSpacing: "-0.03em",
        lineHeight: "1.05em",
    },
    attendeeName: "Alexander\nWeber",
    nameFont: {
        fontFamily: "Inter",
        fontWeight: 500,
        fontStyle: "normal",
        fontSize: "19px",
        letterSpacing: "-0.01em",
        lineHeight: "1.16em",
    },
    jobTitle: "Head of AI Innovation",
    companyName: "Nexora Company",
    badgeId: "LEVEL // ACCESS GRANTED ++++",
    metaFont: {
        fontFamily: "Inter",
        fontWeight: 500,
        fontStyle: "normal",
        fontSize: "12px",
        letterSpacing: "0em",
        lineHeight: "1.4em",
    },
    showLogoEmblem: true,
    showStrapEmblem: true,
    showQr: true,
    textFloatDepth: 88,
    textParallax: 92,
    textShadowOpacity: 70,
    transparentBg: false,
    bgColor: "#D6D8DC",
    strapColor: "#141518",
    strapEmblemColor: "#FFFFFF",
    metalColor: "#ECEFF4",
    cardBaseColor: "#0B0524",
    cardAccentColor: "#F5B895",
    cardSecondaryColor: "#5E2CA5",
    textColor: "#FFFFFF",
    strapDrop: 52,
    interactivePhysics: true,
    draggableCard: true,
    gravity: 65,
    damping: 72,
    swivelFreedom: 55,
    idleSway: 30,
    hoverNudge: 45,
    zoom: 100,
    restingYaw: -7,
    quality: 2,
}

function extractMediaUrl(val: unknown): string {
    if (!val) return ""
    if (typeof val === "string") return val.trim()
    if (typeof val === "object" && val !== null && "src" in val) {
        return String((val as { src?: string }).src || "").trim()
    }
    return ""
}

function isVideoFile(url: string, blobVideo = false): boolean {
    if (blobVideo) return true
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)
}

// Converts a Framer ControlType.Font object into high-DPI 2D Canvas font metrics
// (Canvas resolution is 1024x1472, so 1px in standard UI = 2px on the Retina texture)
const CANVAS_FONT_SCALE = 2.0

function resolveCanvasFont(
    fontProp: FramerFontConfig | undefined,
    fallbackSizeUi: number,
    fallbackWeight: string | number = 600,
    fallbackFamily = "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    extraScale = 1.0
) {
    const scale = CANVAS_FONT_SCALE * extraScale
    let rawSize = fallbackSizeUi
    if (fontProp?.fontSize !== undefined) {
        const parsed = parseFloat(String(fontProp.fontSize))
        if (!isNaN(parsed) && parsed > 0) rawSize = parsed
    }
    const pxSize = Math.max(10, Math.round(rawSize * scale))
    const weight = fontProp?.fontWeight ?? fallbackWeight
    const style = fontProp?.fontStyle || "normal"
    const rawFamily = fontProp?.fontFamily?.trim()
    const family = rawFamily
        ? `${rawFamily}, ${fallbackFamily}`
        : fallbackFamily

    let letterSpacing = "0px"
    if (
        fontProp?.letterSpacing !== undefined &&
        fontProp.letterSpacing !== ""
    ) {
        const lsStr = String(fontProp.letterSpacing).trim()
        const lsVal = parseFloat(lsStr)
        if (!isNaN(lsVal)) {
            if (lsStr.endsWith("em")) {
                letterSpacing = `${(lsVal * pxSize).toFixed(2)}px`
            } else {
                letterSpacing = `${(lsVal * scale).toFixed(2)}px`
            }
        }
    }

    let lineHeightPx = Math.round(pxSize * 1.16)
    if (fontProp?.lineHeight !== undefined && fontProp.lineHeight !== "") {
        const lhStr = String(fontProp.lineHeight).trim()
        const lhVal = parseFloat(lhStr)
        if (!isNaN(lhVal) && lhVal > 0) {
            if (lhStr.endsWith("em")) {
                lineHeightPx = Math.round(lhVal * pxSize)
            } else if (lhStr.endsWith("%")) {
                lineHeightPx = Math.round((lhVal / 100) * pxSize)
            } else if (lhStr.endsWith("px")) {
                lineHeightPx = Math.round(lhVal * scale)
            } else if (lhVal < 8) {
                lineHeightPx = Math.round(lhVal * pxSize)
            } else {
                lineHeightPx = Math.round(lhVal * scale)
            }
        }
    }

    const fontString = `${style} ${weight} ${pxSize}px ${family}`
    return {
        fontString,
        pxSize,
        lineHeightPx,
        letterSpacing,
        textAlign: fontProp?.textAlign,
    }
}

function applyResolvedFontToContext(
    ctx: CanvasRenderingContext2D,
    resolved: ReturnType<typeof resolveCanvasFont>
) {
    ctx.font = resolved.fontString
    if ("letterSpacing" in ctx) {
        try {
            ;(
                ctx as CanvasRenderingContext2D & { letterSpacing: string }
            ).letterSpacing = resolved.letterSpacing
        } catch {}
    }
}

// ============================================================================
// UPGRADED 3D GEOMETRY BUILDERS (CONTOURED STRAP, CLASP & GROMMETED CARD)
// ============================================================================

function getStrapProfilePoints(
    strapWidth = 0.58,
    strapThickness = 0.044
): [number, number, number, number, number][] {
    const hw = strapWidth * 0.5
    const ht = strapThickness * 0.5
    const beadH = ht * 1.28
    const inset = hw * 0.84

    return [
        [-hw, ht * 0.35, -0.7, 0.7, 0.01],
        [-inset, beadH, 0.0, 1.0, 0.08],
        [-hw * 0.45, ht * 0.96, 0.0, 1.0, 0.28],
        [0.0, ht, 0.0, 1.0, 0.5],
        [hw * 0.45, ht * 0.96, 0.0, 1.0, 0.72],
        [inset, beadH, 0.0, 1.0, 0.92],
        [hw, ht * 0.35, 0.7, 0.7, 0.99],
        [hw * 1.02, 0.0, 1.0, 0.0, 1.0],
        [hw, -ht * 0.35, 0.7, -0.7, 0.99],
        [inset, -beadH, 0.0, -1.0, 0.92],
        [hw * 0.45, -ht * 0.96, 0.0, -1.0, 0.72],
        [0.0, -ht, 0.0, -1.0, 0.5],
        [-hw * 0.45, -ht * 0.96, 0.0, -1.0, 0.28],
        [-inset, -beadH, 0.0, -1.0, 0.08],
        [-hw, -ht * 0.35, -0.7, -0.7, 0.01],
        [-hw * 1.02, 0.0, -1.0, 0.0, 0.0],
    ]
}

function buildWrappedStrapGeometry(
    segments = 80,
    strapWidth = 0.58,
    strapThickness = 0.044
) {
    const profilePts = getStrapProfilePoints(strapWidth, strapThickness)
    const vertsPerRing = profilePts.length
    const positions = new Float32Array((segments + 1) * vertsPerRing * 3)
    const normals = new Float32Array((segments + 1) * vertsPerRing * 3)
    const uvs = new Float32Array((segments + 1) * vertsPerRing * 2)
    const indices: number[] = []

    let uvIdx = 0
    for (let i = 0; i <= segments; i++) {
        const v = i / segments
        for (let j = 0; j < vertsPerRing; j++) {
            uvs[uvIdx++] = profilePts[j][4]
            uvs[uvIdx++] = v
        }
        if (i > 0) {
            const baseA = (i - 1) * vertsPerRing
            const baseB = i * vertsPerRing
            for (let j = 0; j < vertsPerRing; j++) {
                const jNext = (j + 1) % vertsPerRing
                const a = baseA + j
                const b = baseA + jNext
                const c = baseB + j
                const d = baseB + jNext
                indices.push(a, c, b, b, c, d)
            }
        }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    return geo
}

function updateWrappedStrapVertices(
    geo: THREE.BufferGeometry,
    topAnchor: THREE.Vector3,
    midControl: THREE.Vector3,
    dRingTopBar: THREE.Vector3,
    swivelYaw: number,
    segments = 80,
    strapWidth = 0.58,
    strapThickness = 0.044
) {
    const profilePts = getStrapProfilePoints(strapWidth, strapThickness)
    const vertsPerRing = profilePts.length

    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute
    const normAttr = geo.getAttribute("normal") as THREE.BufferAttribute
    const positions = posAttr.array as Float32Array
    const normals = normAttr.array as Float32Array

    const spineDir = new THREE.Vector3()
        .subVectors(dRingTopBar, topAnchor)
        .normalize()
    const pt = new THREE.Vector3()
    const tan = new THREE.Vector3()
    const right = new THREE.Vector3()
    const fwd = new THREE.Vector3()

    let idx = 0
    const mainSegs = Math.floor(segments * 0.76)
    const loopSegs = segments - mainSegs

    for (let i = 0; i <= segments; i++) {
        let widthScale = 1.0
        let thickScale = 1.0

        if (i <= mainSegs) {
            const t = i / mainSegs
            const omt = 1 - t
            const cuffBulge =
                t > 0.72
                    ? Math.sin(((t - 0.72) / 0.28) * Math.PI * 0.5) * 0.026
                    : 0
            pt.set(
                omt * omt * topAnchor.x +
                    2 * omt * t * midControl.x +
                    t * t * dRingTopBar.x,
                omt * omt * topAnchor.y +
                    2 * omt * t * midControl.y +
                    t * t * dRingTopBar.y,
                omt * omt * topAnchor.z +
                    2 * omt * t * midControl.z +
                    t * t * dRingTopBar.z +
                    cuffBulge
            )
            tan.set(
                2 * omt * (midControl.x - topAnchor.x) +
                    2 * t * (dRingTopBar.x - midControl.x),
                2 * omt * (midControl.y - topAnchor.y) +
                    2 * t * (dRingTopBar.y - midControl.y),
                2 * omt * (midControl.z - topAnchor.z) +
                    2 * t * (dRingTopBar.z - midControl.z)
            ).normalize()

            if (t > 0.82) {
                const pinchT = (t - 0.82) / 0.18
                widthScale = 1.0 - Math.sin(pinchT * Math.PI * 0.5) * 0.095
            }
        } else {
            const lt = (i - mainSegs) / loopSegs
            if (lt < 0.54) {
                const ang = (lt / 0.54) * Math.PI
                const rLoop = 0.054
                pt.set(
                    dRingTopBar.x,
                    dRingTopBar.y - Math.sin(ang) * rLoop,
                    dRingTopBar.z + Math.cos(ang) * rLoop * 0.72
                )
                tan.set(0, -Math.cos(ang), -Math.sin(ang)).normalize()
                widthScale = 0.905
                thickScale = 0.95
            } else {
                const ft = (lt - 0.54) / 0.46
                const cuffHeight = 0.46
                pt.copy(dRingTopBar).addScaledVector(spineDir, -ft * cuffHeight)
                pt.z -= 0.036 * (1.0 - ft * 0.35)
                tan.copy(spineDir).negate()
                widthScale = 0.905 + ft * 0.08
                thickScale = 1.12
            }
        }

        const twistAngle = swivelYaw * Math.min(1.0, i / mainSegs) * 0.58
        right.set(Math.cos(twistAngle), 0, -Math.sin(twistAngle))
        right.addScaledVector(tan, -right.dot(tan)).normalize()
        fwd.crossVectors(right, tan).normalize()

        for (let j = 0; j < vertsPerRing; j++) {
            const lx = profilePts[j][0] * widthScale
            const ly = profilePts[j][1] * thickScale
            const nx = profilePts[j][2]
            const ny = profilePts[j][3]

            positions[idx] = pt.x + right.x * lx + fwd.x * ly
            positions[idx + 1] = pt.y + right.y * lx + fwd.y * ly
            positions[idx + 2] = pt.z + right.z * lx + fwd.z * ly

            normals[idx] = right.x * nx + fwd.x * ny
            normals[idx + 1] = right.y * nx + fwd.y * ny
            normals[idx + 2] = right.z * nx + fwd.z * ny
            idx += 3
        }
    }

    posAttr.needsUpdate = true
    normAttr.needsUpdate = true
    geo.computeBoundingSphere()
}

function buildChromeLobsterClasp(
    chromeMat: THREE.Material,
    pinMat: THREE.Material,
    strapMat: THREE.Material
) {
    const root = new THREE.Group()
    const createdGeos: THREE.BufferGeometry[] = []

    // 1. Stitched Nylon Keeper Collar / Box-Seam Cuff right above D-ring
    const keeperShape = new THREE.Shape()
    const kw = 0.56,
        kd = 0.115,
        kr = 0.035
    keeperShape.moveTo(-kw / 2 + kr, -kd / 2)
    keeperShape.lineTo(kw / 2 - kr, -kd / 2)
    keeperShape.quadraticCurveTo(kw / 2, -kd / 2, kw / 2, -kd / 2 + kr)
    keeperShape.lineTo(kw / 2, kd / 2 - kr)
    keeperShape.quadraticCurveTo(kw / 2, kd / 2, kw / 2 - kr, kd / 2)
    keeperShape.lineTo(-kw / 2 + kr, kd / 2)
    keeperShape.quadraticCurveTo(-kw / 2, kd / 2, -kw / 2, kd / 2 - kr)
    keeperShape.lineTo(-kw / 2, -kd / 2 + kr)
    keeperShape.quadraticCurveTo(-kw / 2, -kd / 2, -kw / 2 + kr, -kd / 2)

    const keeperGeo = new THREE.ExtrudeGeometry(keeperShape, {
        depth: 0.12,
        steps: 1,
        curveSegments: 16,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.008,
        bevelThickness: 0.008,
    })
    keeperGeo.rotateX(Math.PI / 2)
    keeperGeo.translate(0, 0.22, -0.008)
    createdGeos.push(keeperGeo)
    const keeperMesh = new THREE.Mesh(keeperGeo, strapMat)
    root.add(keeperMesh)

    // 2. Precision Polished Chrome D-Ring
    const dRingPts = [
        new THREE.Vector3(-0.265, 0.0, 0),
        new THREE.Vector3(0.0, 0.0, 0),
        new THREE.Vector3(0.265, 0.0, 0),
        new THREE.Vector3(0.355, -0.065, 0),
        new THREE.Vector3(0.28, -0.24, 0),
        new THREE.Vector3(0.105, -0.37, 0),
        new THREE.Vector3(0.0, -0.392, 0),
        new THREE.Vector3(-0.105, -0.37, 0),
        new THREE.Vector3(-0.28, -0.24, 0),
        new THREE.Vector3(-0.355, -0.065, 0),
    ]
    const dRingCurve = new THREE.CatmullRomCurve3(
        dRingPts,
        true,
        "centripetal",
        0.45
    )
    const dRingGeo = new THREE.TubeGeometry(dRingCurve, 96, 0.046, 28, true)
    createdGeos.push(dRingGeo)
    const dRingMesh = new THREE.Mesh(dRingGeo, chromeMat)
    root.add(dRingMesh)

    // 3. Swivel Hub Assembly
    const swivelGroup = new THREE.Group()
    swivelGroup.position.set(0, -0.392, 0)
    root.add(swivelGroup)

    const swivelLathePts = [
        new THREE.Vector2(0.0, 0.072),
        new THREE.Vector2(0.118, 0.072),
        new THREE.Vector2(0.128, 0.055),
        new THREE.Vector2(0.128, 0.028),
        new THREE.Vector2(0.076, 0.022),
        new THREE.Vector2(0.076, -0.042),
        new THREE.Vector2(0.132, -0.052),
        new THREE.Vector2(0.136, -0.082),
        new THREE.Vector2(0.122, -0.092),
        new THREE.Vector2(0.136, -0.102),
        new THREE.Vector2(0.134, -0.128),
        new THREE.Vector2(0.094, -0.14),
        new THREE.Vector2(0.112, -0.27),
        new THREE.Vector2(0.092, -0.375),
        new THREE.Vector2(0.045, -0.405),
        new THREE.Vector2(0.0, -0.412),
    ]
    const swivelBodyGeo = new THREE.LatheGeometry(swivelLathePts, 40)
    swivelBodyGeo.scale(1.0, 1.0, 0.7)
    swivelBodyGeo.computeVertexNormals()
    createdGeos.push(swivelBodyGeo)
    const swivelBodyMesh = new THREE.Mesh(swivelBodyGeo, chromeMat)
    swivelGroup.add(swivelBodyMesh)

    const rivetGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.162, 24)
    rivetGeo.rotateX(Math.PI / 2)
    createdGeos.push(rivetGeo)
    const rivetMesh = new THREE.Mesh(rivetGeo, pinMat)
    rivetMesh.position.set(0.0, -0.265, 0)
    swivelGroup.add(rivetMesh)

    const washerGeo = new THREE.TorusGeometry(0.032, 0.006, 12, 24)
    createdGeos.push(washerGeo)
    const washerFront = new THREE.Mesh(washerGeo, chromeMat)
    washerFront.position.set(0, -0.265, 0.078)
    swivelGroup.add(washerFront)

    const trigPts = [
        new THREE.Vector3(-0.06, -0.24, 0),
        new THREE.Vector3(-0.155, -0.278, 0),
        new THREE.Vector3(-0.205, -0.325, 0),
        new THREE.Vector3(-0.175, -0.355, 0),
        new THREE.Vector3(-0.08, -0.345, 0),
    ]
    const trigCurve = new THREE.CatmullRomCurve3(trigPts)
    const trigGeo = new THREE.TubeGeometry(trigCurve, 28, 0.028, 18, false)
    trigGeo.scale(1.0, 1.0, 0.78)
    createdGeos.push(trigGeo)
    const trigMesh = new THREE.Mesh(trigGeo, chromeMat)
    swivelGroup.add(trigMesh)

    // 4. Sculpted Lower J-Hook Claw
    const hookPts = [
        new THREE.Vector3(0.068, -0.335, 0.0),
        new THREE.Vector3(0.112, -0.49, 0.014),
        new THREE.Vector3(0.082, -0.64, 0.026),
        new THREE.Vector3(-0.005, -0.688, 0.012),
        new THREE.Vector3(-0.092, -0.635, -0.014),
        new THREE.Vector3(-0.095, -0.52, -0.012),
        new THREE.Vector3(-0.076, -0.485, -0.006),
    ]
    const hookCurve = new THREE.CatmullRomCurve3(hookPts)
    const hookGeo = new THREE.TubeGeometry(hookCurve, 60, 0.038, 24, false)
    createdGeos.push(hookGeo)
    const hookMesh = new THREE.Mesh(hookGeo, chromeMat)
    swivelGroup.add(hookMesh)

    const tipCapGeo = new THREE.SphereGeometry(0.037, 18, 18)
    createdGeos.push(tipCapGeo)
    const tipCapMesh = new THREE.Mesh(tipCapGeo, chromeMat)
    tipCapMesh.position.set(-0.076, -0.485, -0.006)
    swivelGroup.add(tipCapMesh)

    const gateGeo = new THREE.CylinderGeometry(0.018, 0.021, 0.21, 18)
    gateGeo.rotateZ(-0.25)
    createdGeos.push(gateGeo)
    const gateMesh = new THREE.Mesh(gateGeo, pinMat)
    gateMesh.position.set(-0.058, -0.425, 0)
    swivelGroup.add(gateMesh)

    return { root, swivelGroup, geometries: createdGeos }
}

function buildBadgeCardAssembly(
    cardMat: THREE.Material,
    chromeMat: THREE.Material,
    bezelMat: THREE.Material,
    cardW = 2.56,
    cardH = 3.68,
    cardR = 0.17,
    thickness = 0.044
) {
    const group = new THREE.Group()
    const createdGeos: THREE.BufferGeometry[] = []

    const x = -cardW / 2
    const y = -cardH
    const w = cardW
    const h = cardH
    const r = cardR

    const shape = new THREE.Shape()
    shape.moveTo(x + r, y)
    shape.lineTo(x + w - r, y)
    shape.quadraticCurveTo(x + w, y, x + w, y + r)
    shape.lineTo(x + w, y + h - r)
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    shape.lineTo(x + r, y + h)
    shape.quadraticCurveTo(x, y + h, x, y + h - r)
    shape.lineTo(x, y + r)
    shape.quadraticCurveTo(x, y, x + r, y)

    const holeRadius = 0.132
    const holeCenterY = -0.24
    const hole = new THREE.Path()
    hole.absarc(0, holeCenterY, holeRadius, 0, Math.PI * 2, false)
    shape.holes.push(hole)

    const bevelSize = 0.015
    const bevelThick = 0.015
    const cardGeo = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        steps: 1,
        curveSegments: 32,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize,
        bevelThickness: bevelThick,
    })
    cardGeo.translate(0, 0, -thickness / 2)

    const pos = cardGeo.getAttribute("position")
    const uv = cardGeo.getAttribute("uv")
    for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i)
        const py = pos.getY(i)
        const u = (px + cardW / 2) / cardW
        const v = (py + cardH) / cardH
        uv.setXY(i, u, v)
    }
    uv.needsUpdate = true
    cardGeo.computeVertexNormals()
    createdGeos.push(cardGeo)

    const cardMesh = new THREE.Mesh(cardGeo, cardMat)
    group.add(cardMesh)

    // 2. Machined 3D Chrome Eyelet / Grommet Ring lining the punched card hole
    const halfSpanZ = thickness * 0.5 + bevelThick + 0.005
    const grommetLathePts = [
        new THREE.Vector2(holeRadius + 0.048, -halfSpanZ * 0.82),
        new THREE.Vector2(holeRadius + 0.052, -halfSpanZ),
        new THREE.Vector2(holeRadius + 0.012, -halfSpanZ * 1.06),
        new THREE.Vector2(holeRadius - 0.008, -halfSpanZ * 0.9),
        new THREE.Vector2(holeRadius - 0.008, halfSpanZ * 0.9),
        new THREE.Vector2(holeRadius + 0.012, halfSpanZ * 1.06),
        new THREE.Vector2(holeRadius + 0.052, halfSpanZ),
        new THREE.Vector2(holeRadius + 0.048, halfSpanZ * 0.82),
    ]
    const grommetGeo = new THREE.LatheGeometry(grommetLathePts, 48)
    grommetGeo.rotateX(Math.PI / 2)
    grommetGeo.translate(0, holeCenterY, 0)
    grommetGeo.computeVertexNormals()
    createdGeos.push(grommetGeo)

    const grommetMesh = new THREE.Mesh(grommetGeo, chromeMat)
    group.add(grommetMesh)

    // 3. Subtle 3D Perimeter Rim Frame catching studio edge highlights
    const rimOuterShape = new THREE.Shape()
    const pad = 0.016
    const rx = x - pad,
        ry = y - pad,
        rw = w + pad * 2,
        rh = h + pad * 2,
        rr = r + pad
    rimOuterShape.moveTo(rx + rr, ry)
    rimOuterShape.lineTo(rx + rw - rr, ry)
    rimOuterShape.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr)
    rimOuterShape.lineTo(rx + rw, ry + rh - rr)
    rimOuterShape.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh)
    rimOuterShape.lineTo(rx + rr, ry + rh)
    rimOuterShape.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr)
    rimOuterShape.lineTo(rx, ry + rr)
    rimOuterShape.quadraticCurveTo(rx, ry, rx + rr, ry)

    const rimHole = new THREE.Path()
    rimHole.moveTo(x + r, y)
    rimHole.lineTo(x + w - r, y)
    rimHole.quadraticCurveTo(x + w, y, x + w, y + r)
    rimHole.lineTo(x + w, y + h - r)
    rimHole.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    rimHole.lineTo(x + r, y + h)
    rimHole.quadraticCurveTo(x, y + h, x, y + h - r)
    rimHole.lineTo(x, y + r)
    rimHole.quadraticCurveTo(x, y, x + r, y)
    rimOuterShape.holes.push(rimHole)

    const rimGeo = new THREE.ExtrudeGeometry(rimOuterShape, {
        depth: thickness * 0.72,
        steps: 1,
        curveSegments: 32,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.008,
        bevelThickness: 0.008,
    })
    rimGeo.translate(0, 0, -(thickness * 0.72) / 2)
    rimGeo.computeVertexNormals()
    createdGeos.push(rimGeo)

    const rimMesh = new THREE.Mesh(rimGeo, bezelMat)
    group.add(rimMesh)

    return { group, cardMesh, geometries: createdGeos }
}

function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
    const pmrem = new THREE.PMREMGenerator(renderer)
    pmrem.compileEquirectangularShader()
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0x14171f)

    const softbox1 = new THREE.Mesh(
        new THREE.PlaneGeometry(26, 26),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    softbox1.position.set(-9, 12, 14)
    softbox1.lookAt(0, 0, 0)
    envScene.add(softbox1)

    const softbox2 = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 28),
        new THREE.MeshBasicMaterial({ color: 0xf0f5ff })
    )
    softbox2.position.set(12, 6, 10)
    softbox2.lookAt(0, 0, 0)
    envScene.add(softbox2)

    const topStrip = new THREE.Mesh(
        new THREE.PlaneGeometry(32, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    topStrip.position.set(0, 16, 2)
    topStrip.rotation.x = Math.PI / 2
    envScene.add(topStrip)

    const darkCard = new THREE.Mesh(
        new THREE.PlaneGeometry(12, 24),
        new THREE.MeshBasicMaterial({ color: 0x040507 })
    )
    darkCard.position.set(1.5, -1, 11)
    darkCard.lookAt(0, 0, 0)
    envScene.add(darkCard)

    const envRT = pmrem.fromScene(envScene, 0.03)
    pmrem.dispose()
    return envRT
}

function drawGeometricRadarEmblem(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    color: string,
    lineWidth = 4
) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    ctx.arc(-radius * 0.08, 0, radius, Math.PI * 0.5, Math.PI * 1.5, false)
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
        -radius * 0.08,
        0,
        radius * 0.56,
        Math.PI * 0.5,
        Math.PI * 1.5,
        false
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-radius * 1.08, 0)
    ctx.lineTo(radius * 0.92, 0)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(radius * 0.08, -radius * 0.12)
    ctx.arc(
        radius * 0.08,
        -radius * 0.12,
        radius * 0.78,
        -Math.PI * 0.5,
        0,
        false
    )
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
}

function drawQrCode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    inkColor: string
) {
    ctx.save()
    ctx.fillStyle = "#FFFFFF"
    ctx.beginPath()
    ctx.roundRect(x, y, size, size, size * 0.08)
    ctx.fill()

    const pad = size * 0.1
    const inner = size - pad * 2
    const cells = 21
    const cellSz = inner / cells
    const ox = x + pad
    const oy = y + pad

    ctx.fillStyle = inkColor

    const isFinder = (r: number, c: number) =>
        (r < 7 && c < 7) ||
        (r < 7 && c >= cells - 7) ||
        (r >= cells - 7 && c < 7)

    const drawFinder = (fr: number, fc: number) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const border = r === 0 || r === 6 || c === 0 || c === 6
                const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
                if (border || core) {
                    ctx.fillRect(
                        ox + (fc + c) * cellSz,
                        oy + (fr + r) * cellSz,
                        cellSz + 0.4,
                        cellSz + 0.4
                    )
                }
            }
        }
    }

    drawFinder(0, 0)
    drawFinder(0, cells - 7)
    drawFinder(cells - 7, 0)

    for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
            if (isFinder(r, c)) continue
            if (r === 6 || c === 6) {
                if ((r + c) % 2 === 0) {
                    ctx.fillRect(
                        ox + c * cellSz,
                        oy + r * cellSz,
                        cellSz + 0.3,
                        cellSz + 0.3
                    )
                }
                continue
            }
            const hash = Math.sin(r * 127.1 + c * 311.7) * 43758.5453
            if (hash - Math.floor(hash) > 0.46) {
                ctx.fillRect(
                    ox + c * cellSz,
                    oy + r * cellSz,
                    cellSz + 0.3,
                    cellSz + 0.3
                )
            }
        }
    }
    ctx.restore()
}

function drawFloatingReticle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    alpha = 0.55
) {
    ctx.save()
    ctx.strokeStyle = color
    ctx.globalAlpha = alpha
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(x - size, y)
    ctx.lineTo(x + size, y)
    ctx.moveTo(x, y - size)
    ctx.lineTo(x, y + size)
    ctx.stroke()
    ctx.restore()
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 860
 * @framerIntrinsicHeight 980
 */
export default function CreativePassLanyard(incomingProps: Props) {
    // STEP 1: Intercept & Flatten grouped property controls
    const props: FlatProps = {
        ...defaults,
        ...incomingProps,
        ...(incomingProps.media || {}),
        ...(incomingProps.cardContent || {}),
        ...(incomingProps.typography || {}),
        ...(incomingProps.colors || {}),
        ...(incomingProps.physics || {}),
        ...(incomingProps.cameraView || {}),
    }

    const mountRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isIntersecting = useRef(true)
    const isStatic = useIsStaticRenderer()

    const latest = useRef({ props, isStatic })
    latest.current = { props, isStatic }

    const refreshRef = useRef<(() => void) | null>(null)
    const localUploadRef = useRef<((file: File) => void) | null>(null)

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let renderer: THREE.WebGLRenderer | undefined
        let scene: THREE.Scene | undefined
        let camera: THREE.PerspectiveCamera | undefined
        let envRT: THREE.WebGLRenderTarget | undefined
        let resizeObserver: ResizeObserver | undefined
        let intersectionObserver: IntersectionObserver | undefined

        let frameId = 0
        let disposed = false
        let prevTime = 0
        let elapsed = 0

        const geometries = new Set<THREE.BufferGeometry>()
        const materials = new Set<THREE.Material>()
        const textures = new Set<THREE.Texture>()

        const rootGroup = new THREE.Group()
        let claspRootGroup: THREE.Group | undefined
        let swivelHubGroup: THREE.Group | undefined
        const cardAttachmentGroup = new THREE.Group()

        // ====================================================================
        // TANGLE-FREE COUPLED DOUBLE-PENDULUM + CATENARY WHIP PHYSICS STATE
        // ====================================================================
        let topViewportY = 3.6
        let restStrapLen = 1.9
        const topAnchor = new THREE.Vector3(0, topViewportY, 0)
        const dRingPos = new THREE.Vector3(0, topViewportY - restStrapLen, 0)
        const dRingVel = new THREE.Vector3(0, 0, 0)
        const midCurvePos = new THREE.Vector3(
            0,
            topViewportY - restStrapLen * 0.5,
            0
        )
        const midCurveVel = new THREE.Vector3(0, 0, 0)

        let cardRollZ = 0
        let cardVelRollZ = 0
        let cardPitchX = 0
        let cardVelPitchX = 0
        let cardYawY = (-7 * Math.PI) / 180
        let cardVelYawY = 0

        let pointerTargetX = 0
        let pointerTargetY = 0
        let smoothPointerX = 0
        let smoothPointerY = 0

        let isDragging = false
        let activePointerId = -1
        let dragStartScreenX = 0
        let dragStartScreenY = 0
        const dragStartDRingPos = new THREE.Vector3()
        const dragStartHitWorld = new THREE.Vector3()
        const dragCurrentWorld = new THREE.Vector3()
        const grabCardLocal = new THREE.Vector3()
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        const raycaster = new THREE.Raycaster()
        const mouse = new THREE.Vector2()
        const prevMouse = new THREE.Vector2()

        let activeMediaUrl = ""
        let localObjectUrl = ""
        let localIsVideo = false
        let loadedImg: HTMLImageElement | null = null
        let loadedVideo: HTMLVideoElement | null = null
        let videoPlaying = false
        let lastCardKey = ""
        let lastStrapKey = ""

        // ====================================================================
        // MULTI-PLANE CANVASES (BASE CARD + CAST SHADOW + MID UI + HERO TEXT)
        // ====================================================================
        const CW = 1024
        const CH = 1472

        const cardBaseCanvas = document.createElement("canvas")
        cardBaseCanvas.width = CW
        cardBaseCanvas.height = CH
        const cardBaseCtx = cardBaseCanvas.getContext("2d")!

        const midFloatCanvas = document.createElement("canvas")
        midFloatCanvas.width = CW
        midFloatCanvas.height = CH
        const midFloatCtx = midFloatCanvas.getContext("2d")!

        const highFloatCanvas = document.createElement("canvas")
        highFloatCanvas.width = CW
        highFloatCanvas.height = CH
        const highFloatCtx = highFloatCanvas.getContext("2d")!

        const shadowFloatCanvas = document.createElement("canvas")
        shadowFloatCanvas.width = 512
        shadowFloatCanvas.height = 736
        const shadowFloatCtx = shadowFloatCanvas.getContext("2d")!

        const strapCanvas = document.createElement("canvas")
        strapCanvas.width = 512
        strapCanvas.height = 2048
        const strapCtx = strapCanvas.getContext("2d")!

        let cardBaseTexture: THREE.CanvasTexture | undefined
        let midFloatTexture: THREE.CanvasTexture | undefined
        let highFloatTexture: THREE.CanvasTexture | undefined
        let shadowFloatTexture: THREE.CanvasTexture | undefined
        let strapTexture: THREE.CanvasTexture | undefined

        let strapGeo: THREE.BufferGeometry | undefined
        let strapMat: THREE.MeshStandardMaterial | undefined
        let chromeMat: THREE.MeshStandardMaterial | undefined
        let pinMat: THREE.MeshStandardMaterial | undefined
        let bezelMat: THREE.MeshStandardMaterial | undefined
        let cardMat: THREE.MeshStandardMaterial | undefined
        let cardMesh: THREE.Mesh | undefined

        let shadowFloatMesh: THREE.Mesh | undefined
        let midFloatMesh: THREE.Mesh | undefined
        let highFloatMesh: THREE.Mesh | undefined
        let shadowFloatMat: THREE.MeshBasicMaterial | undefined
        let midFloatMat: THREE.MeshBasicMaterial | undefined
        let highFloatMat: THREE.MeshBasicMaterial | undefined

        const shouldAnimate = () =>
            !latest.current.isStatic &&
            (latest.current.props.livePreview ?? true)

        function drawMediaFitted(
            ctx: CanvasRenderingContext2D,
            source: HTMLImageElement | HTMLVideoElement,
            sw: number,
            sh: number,
            dx: number,
            dy: number,
            dw: number,
            dh: number,
            fit: "cover" | "contain"
        ) {
            if (!sw || !sh) return
            const sAspect = sw / sh
            const dAspect = dw / dh
            let rw = dw,
                rh = dh
            if (fit === "cover") {
                if (sAspect > dAspect) {
                    rh = dh
                    rw = dh * sAspect
                } else {
                    rw = dw
                    rh = dw / sAspect
                }
            } else {
                if (sAspect > dAspect) {
                    rw = dw
                    rh = dw / sAspect
                } else {
                    rh = dh
                    rw = dh * sAspect
                }
            }
            const rx = dx + (dw - rw) / 2
            const ry = dy + (dh - rh) / 2
            ctx.drawImage(source, rx, ry, rw, rh)
        }

        function drawWovenStrapTexture(force = false) {
            const p = latest.current.props
            const key = JSON.stringify([
                p.showStrapEmblem,
                p.strapColor,
                p.strapEmblemColor,
            ])
            if (!force && key === lastStrapKey) return
            lastStrapKey = key

            const W = strapCanvas.width
            const H = strapCanvas.height
            const ctx = strapCtx

            ctx.fillStyle = p.strapColor
            ctx.fillRect(0, 0, W, H)

            for (let y = 0; y < H; y += 10) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.09)"
                ctx.fillRect(0, y, W, 4)
                ctx.fillStyle = "rgba(0, 0, 0, 0.55)"
                ctx.fillRect(0, y + 5, W, 4)
            }

            ctx.fillStyle = "rgba(255, 255, 255, 0.035)"
            for (let x = 44; x < W - 44; x += 8) {
                ctx.fillRect(x, 0, 3, H)
            }

            const borderW = 42
            ctx.fillStyle = "rgba(0, 0, 0, 0.45)"
            ctx.fillRect(0, 0, borderW, H)
            ctx.fillRect(W - borderW, 0, borderW, H)

            ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
            ctx.fillRect(borderW - 4, 0, 5, H)
            ctx.fillRect(W - borderW - 1, 0, 5, H)

            ctx.fillStyle = "rgba(255, 255, 255, 0.16)"
            for (let y = 0; y < H; y += 14) {
                ctx.beginPath()
                ctx.roundRect(7, y + 2, borderW - 16, 9, 4)
                ctx.roundRect(W - borderW + 9, y + 2, borderW - 16, 9, 4)
                ctx.fill()
            }

            const seamY = H * 0.71
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)"
            ctx.fillRect(0, seamY - 10, W, 20)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"
            ctx.lineWidth = 4
            ctx.setLineDash([12, 7])
            ctx.beginPath()
            ctx.moveTo(borderW + 6, seamY - 3)
            ctx.lineTo(W - borderW - 6, seamY - 3)
            ctx.moveTo(borderW + 6, seamY + 5)
            ctx.lineTo(W - borderW - 6, seamY + 5)
            ctx.stroke()
            ctx.setLineDash([])

            if (p.showStrapEmblem) {
                drawGeometricRadarEmblem(
                    ctx,
                    W * 0.5,
                    H * 0.55,
                    72,
                    p.strapEmblemColor,
                    8.5
                )
            }

            if (strapTexture) strapTexture.needsUpdate = true
        }

        function drawCardBaseSurface() {
            const p = latest.current.props
            const W = cardBaseCanvas.width
            const H = cardBaseCanvas.height
            const ctx = cardBaseCtx

            const hasMedia = Boolean(loadedVideo || loadedImg)

            const renderUploadedMedia = (
                dx: number,
                dy: number,
                dw: number,
                dh: number
            ) => {
                if (loadedVideo && loadedVideo.videoWidth > 0) {
                    drawMediaFitted(
                        ctx,
                        loadedVideo,
                        loadedVideo.videoWidth,
                        loadedVideo.videoHeight,
                        dx,
                        dy,
                        dw,
                        dh,
                        p.mediaFit
                    )
                } else if (loadedImg && loadedImg.naturalWidth > 0) {
                    drawMediaFitted(
                        ctx,
                        loadedImg,
                        loadedImg.naturalWidth,
                        loadedImg.naturalHeight,
                        dx,
                        dy,
                        dw,
                        dh,
                        p.mediaFit
                    )
                }
            }

            if (p.cardLayout === "auroraOverlay") {
                ctx.fillStyle = p.cardBaseColor
                ctx.fillRect(0, 0, W, H)

                if (hasMedia) {
                    renderUploadedMedia(0, 0, W, H)
                    const op = (p.overlayOpacity / 100) * 0.92
                    const overlayGrad = ctx.createLinearGradient(0, 0, 0, H)
                    overlayGrad.addColorStop(
                        0.0,
                        `rgba(6, 5, 18, ${op * 0.78})`
                    )
                    overlayGrad.addColorStop(
                        0.32,
                        `rgba(6, 5, 18, ${op * 0.15})`
                    )
                    overlayGrad.addColorStop(
                        0.62,
                        `rgba(6, 5, 18, ${op * 0.65})`
                    )
                    overlayGrad.addColorStop(
                        1.0,
                        `rgba(6, 5, 18, ${op * 0.96})`
                    )
                    ctx.fillStyle = overlayGrad
                    ctx.fillRect(0, 0, W, H)
                } else {
                    const grad = ctx.createRadialGradient(
                        W * 0.52,
                        H * 0.68,
                        W * 0.31,
                        W * 0.52,
                        H * 0.68,
                        W * 0.88
                    )
                    grad.addColorStop(0.0, p.cardBaseColor)
                    grad.addColorStop(0.41, p.cardBaseColor)
                    grad.addColorStop(0.53, p.cardAccentColor)
                    grad.addColorStop(0.68, p.cardSecondaryColor)
                    grad.addColorStop(1.0, p.cardBaseColor)
                    ctx.fillStyle = grad
                    ctx.fillRect(0, 0, W, H)
                }

                ctx.strokeStyle = "rgba(255, 255, 255, 0.045)"
                ctx.lineWidth = 1.5
                for (let gx = 86; gx < W; gx += 106) {
                    ctx.beginPath()
                    ctx.moveTo(gx, 0)
                    ctx.lineTo(gx, H)
                    ctx.stroke()
                }
                for (let gy = 140; gy < H; gy += 106) {
                    ctx.beginPath()
                    ctx.moveTo(0, gy)
                    ctx.lineTo(W, gy)
                    ctx.stroke()
                }

                ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.roundRect(38, 38, W - 76, H - 76, 48)
                ctx.stroke()

                if (cardBaseTexture) cardBaseTexture.needsUpdate = true
                return
            }

            if (p.cardLayout === "cyberPixel") {
                ctx.fillStyle = p.cardSecondaryColor
                ctx.fillRect(0, 0, W, H)

                ctx.strokeStyle = "rgba(255, 255, 255, 0.32)"
                ctx.lineWidth = 2
                for (let gx = 0; gx < W; gx += 64) {
                    ctx.beginPath()
                    ctx.moveTo(gx, 0)
                    ctx.lineTo(gx, H)
                    ctx.stroke()
                }
                for (let gy = 0; gy < H; gy += 64) {
                    ctx.beginPath()
                    ctx.moveTo(0, gy)
                    ctx.lineTo(W, gy)
                    ctx.stroke()
                }

                ctx.fillStyle = p.cardAccentColor
                const topSteps = [
                    290, 290, 240, 240, 310, 310, 195, 195, 235, 235, 275, 275,
                    320, 320, 225, 225,
                ]
                const colW = W / topSteps.length
                for (let c = 0; c < topSteps.length; c++) {
                    ctx.fillRect(c * colW, 0, colW + 1, topSteps[c])
                }
                const botSteps = [
                    280, 280, 225, 225, 255, 320, 320, 275, 275, 235, 310, 310,
                    210, 210, 185, 185,
                ]
                for (let c = 0; c < botSteps.length; c++) {
                    ctx.fillRect(
                        c * colW,
                        H - botSteps[c],
                        colW + 1,
                        botSteps[c]
                    )
                }

                if (hasMedia) {
                    const winX = 56,
                        winY = 735,
                        winW = W - 112,
                        winH = 385
                    ctx.save()
                    ctx.beginPath()
                    ctx.roundRect(winX, winY, winW, winH, 18)
                    ctx.clip()
                    ctx.fillStyle = p.cardBaseColor
                    ctx.fillRect(winX, winY, winW, winH)
                    renderUploadedMedia(winX, winY, winW, winH)
                    ctx.strokeStyle = p.cardAccentColor
                    ctx.lineWidth = 8
                    ctx.strokeRect(winX + 4, winY + 4, winW - 8, winH - 8)
                    ctx.restore()
                }

                if (cardBaseTexture) cardBaseTexture.needsUpdate = true
                return
            }

            // LAYOUT 3: EXECUTIVE SPLIT ID BASE
            ctx.fillStyle = p.cardBaseColor
            ctx.fillRect(0, 0, W, H)

            ctx.fillStyle = p.cardAccentColor
            ctx.fillRect(0, 0, W, 310)

            const frameX = 72,
                frameY = 365,
                frameW = W - 144,
                frameH = 560
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(frameX, frameY, frameW, frameH, 24)
            ctx.clip()
            if (hasMedia) {
                renderUploadedMedia(frameX, frameY, frameW, frameH)
            } else {
                const pGrad = ctx.createLinearGradient(
                    frameX,
                    frameY,
                    frameX + frameW,
                    frameY + frameH
                )
                pGrad.addColorStop(0, p.cardSecondaryColor)
                pGrad.addColorStop(1, p.cardAccentColor)
                ctx.fillStyle = pGrad
                ctx.fillRect(frameX, frameY, frameW, frameH)
            }
            ctx.restore()

            if (cardBaseTexture) cardBaseTexture.needsUpdate = true
        }

        // Renders the Detached 3D Floating Typography & UI Layers using Framer Native Font Configs
        function drawFloatingTextLayers() {
            const p = latest.current.props
            const W = CW
            const H = CH
            const hasMedia = Boolean(loadedVideo || loadedImg)

            midFloatCtx.clearRect(0, 0, W, H)
            highFloatCtx.clearRect(0, 0, W, H)
            shadowFloatCtx.clearRect(
                0,
                0,
                shadowFloatCanvas.width,
                shadowFloatCanvas.height
            )

            // Resolve Framer Native Typography props for Canvas
            const resolvedBrand = resolveCanvasFont(p.brandFont, 18, 600)
            const resolvedRole = resolveCanvasFont(p.roleFont, 72, 600)
            const resolvedName = resolveCanvasFont(p.nameFont, 19, 500)
            const resolvedMeta = resolveCanvasFont(p.metaFont, 12, 500)

            const applyFloatingCrispEdge = (ctx: CanvasRenderingContext2D) => {
                ctx.shadowColor = "rgba(0, 0, 0, 0.38)"
                ctx.shadowBlur = 10
                ctx.shadowOffsetX = 0
                ctx.shadowOffsetY = 4
            }

            // ================================================================
            // LAYOUT 1 FLOATING PLANES: AURORA OVERLAY
            // ================================================================
            if (p.cardLayout === "auroraOverlay") {
                // --- MID FLOAT LAYER (Brand Header + Job/Company + QR) ---
                applyFloatingCrispEdge(midFloatCtx)
                let brandTextX = 88
                if (p.showLogoEmblem) {
                    drawGeometricRadarEmblem(
                        midFloatCtx,
                        126,
                        235,
                        42,
                        p.textColor,
                        5.2
                    )
                    brandTextX = 190
                }
                midFloatCtx.fillStyle = p.textColor
                applyResolvedFontToContext(midFloatCtx, resolvedBrand)
                midFloatCtx.textAlign = "left"
                midFloatCtx.textBaseline = "middle"
                const brandLines = String(
                    p.brandName || "FutureTech\nSummit"
                ).split("\n")
                brandLines.forEach((line, i) => {
                    midFloatCtx.fillText(
                        line,
                        brandTextX,
                        216 +
                            i * resolvedBrand.lineHeightPx -
                            (brandLines.length - 1) *
                                (resolvedBrand.lineHeightPx * 0.25)
                    )
                })

                const rightX = p.showQr ? W - 236 : W - 86
                applyResolvedFontToContext(midFloatCtx, resolvedMeta)
                midFloatCtx.textAlign = "right"
                midFloatCtx.fillStyle = p.textColor
                midFloatCtx.globalAlpha = 0.92
                midFloatCtx.fillText(
                    String(p.jobTitle || "Head of AI Innovation"),
                    rightX,
                    H - 168
                )
                midFloatCtx.fillText(
                    String(p.companyName || "Nexora Company"),
                    rightX,
                    H - 168 + resolvedMeta.lineHeightPx
                )
                midFloatCtx.globalAlpha = 1.0

                if (p.showQr) {
                    drawQrCode(midFloatCtx, W - 204, H - 224, 124, "#080B0E")
                }

                // --- HIGH FLOAT HERO LAYER (Main Role Headline + Attendee Name + Tech Reticles) ---
                applyFloatingCrispEdge(highFloatCtx)
                highFloatCtx.fillStyle = p.textColor
                applyResolvedFontToContext(highFloatCtx, resolvedRole)
                highFloatCtx.textAlign = resolvedRole.textAlign || "left"
                highFloatCtx.textBaseline = "middle"
                const roleX =
                    highFloatCtx.textAlign === "center"
                        ? W * 0.5
                        : highFloatCtx.textAlign === "right"
                          ? W - 86
                          : 86
                const roleLines = String(p.roleTitle || "Organizer").split("\n")
                roleLines.forEach((line, i) => {
                    highFloatCtx.fillText(
                        line,
                        roleX,
                        H * 0.62 +
                            (i - (roleLines.length - 1) * 0.5) *
                                resolvedRole.lineHeightPx
                    )
                })

                applyResolvedFontToContext(highFloatCtx, resolvedName)
                highFloatCtx.textAlign = resolvedName.textAlign || "left"
                const nameX =
                    highFloatCtx.textAlign === "center"
                        ? W * 0.5
                        : highFloatCtx.textAlign === "right"
                          ? W - 86
                          : 86
                highFloatCtx.fillStyle = p.textColor
                const nameLines = String(
                    p.attendeeName || "Alexander\nWeber"
                ).split("\n")
                nameLines.forEach((line, i) => {
                    highFloatCtx.fillText(
                        line,
                        nameX,
                        H - 178 + i * resolvedName.lineHeightPx
                    )
                })

                drawFloatingReticle(highFloatCtx, W - 96, 225, 11, p.textColor)
                drawFloatingReticle(highFloatCtx, 92, H * 0.51, 9, p.textColor)
            }

            // ================================================================
            // LAYOUT 2 FLOATING PLANES: CYBER PIXEL PASS
            // ================================================================
            else if (p.cardLayout === "cyberPixel") {
                // --- MID FLOAT LAYER (Sub-Banner Pill + Access Metadata + QR) ---
                applyFloatingCrispEdge(midFloatCtx)
                const pillX = 56,
                    pillY = 635,
                    pillW = W - 112,
                    pillH = 68
                midFloatCtx.fillStyle = p.cardAccentColor
                midFloatCtx.beginPath()
                midFloatCtx.roundRect(
                    pillX,
                    pillY,
                    pillW,
                    pillH,
                    [6, 34, 34, 6]
                )
                midFloatCtx.fill()

                midFloatCtx.save()
                midFloatCtx.translate(pillX + 26, pillY + pillH / 2 + 2)
                midFloatCtx.scale(0.85, 1.15)
                midFloatCtx.fillStyle = p.cardBaseColor
                applyResolvedFontToContext(midFloatCtx, resolvedName)
                midFloatCtx.textAlign = "left"
                midFloatCtx.textBaseline = "middle"
                midFloatCtx.fillText(
                    String(p.attendeeName || "SECTOR: VISUAL OPS")
                        .replace(/\n/g, " ")
                        .toUpperCase(),
                    0,
                    0
                )
                midFloatCtx.restore()

                if (!hasMedia) {
                    midFloatCtx.fillStyle = p.cardBaseColor
                    applyResolvedFontToContext(midFloatCtx, resolvedMeta)
                    midFloatCtx.textAlign = "left"
                    midFloatCtx.fillText(
                        String(p.badgeId || "LEVEL // ACCESS GRANTED ++++"),
                        62,
                        835
                    )
                    midFloatCtx.textAlign = "right"
                    midFloatCtx.fillText(
                        String(p.jobTitle || "CHANNEL: BLENDER_MODE"),
                        W - 62,
                        915
                    )
                    midFloatCtx.textAlign = "left"
                    midFloatCtx.fillText(
                        String(p.companyName || "RENDERED BY HUMAN ++++"),
                        62,
                        1010
                    )
                }

                if (p.showQr) {
                    drawQrCode(midFloatCtx, 76, H - 220, 144, p.cardBaseColor)
                }

                // --- HIGH FLOAT HERO LAYER (Main Headline Banner) ---
                applyFloatingCrispEdge(highFloatCtx)
                const bannerX = 56,
                    bannerY = 390,
                    bannerW = W - 112,
                    bannerH = 205
                highFloatCtx.fillStyle = p.cardAccentColor
                highFloatCtx.beginPath()
                highFloatCtx.roundRect(bannerX, bannerY, bannerW, bannerH, 10)
                highFloatCtx.fill()

                highFloatCtx.save()
                highFloatCtx.translate(W / 2, bannerY + bannerH / 2 + 5)
                highFloatCtx.scale(0.75, 1.28)
                highFloatCtx.fillStyle = p.cardBaseColor
                applyResolvedFontToContext(highFloatCtx, resolvedRole)
                highFloatCtx.textAlign = "center"
                highFloatCtx.textBaseline = "middle"
                highFloatCtx.fillText(
                    String(p.roleTitle || "CREATIVE PASS").toUpperCase(),
                    0,
                    0
                )
                highFloatCtx.restore()
            }

            // ================================================================
            // LAYOUT 3 FLOATING PLANES: EXECUTIVE SPLIT ID
            // ================================================================
            else {
                // --- MID FLOAT LAYER (Top Brand Header + Job/Company + QR) ---
                applyFloatingCrispEdge(midFloatCtx)
                let execBrandX = 76
                if (p.showLogoEmblem) {
                    drawGeometricRadarEmblem(
                        midFloatCtx,
                        112,
                        205,
                        38,
                        p.cardBaseColor,
                        4.8
                    )
                    execBrandX = 172
                }
                midFloatCtx.fillStyle = p.cardBaseColor
                applyResolvedFontToContext(midFloatCtx, resolvedBrand)
                midFloatCtx.textAlign = "left"
                midFloatCtx.textBaseline = "middle"
                const ebLines = String(
                    p.brandName || "FutureTech\nSummit"
                ).split("\n")
                ebLines.forEach((line, i) => {
                    midFloatCtx.fillText(
                        line,
                        execBrandX,
                        188 + i * resolvedBrand.lineHeightPx
                    )
                })

                midFloatCtx.fillStyle = p.textColor
                midFloatCtx.globalAlpha = 0.85
                applyResolvedFontToContext(midFloatCtx, resolvedMeta)
                midFloatCtx.textAlign = "left"
                midFloatCtx.fillText(
                    `${p.jobTitle || "Head of AI Innovation"} · ${p.companyName || "Nexora"}`,
                    76,
                    1192
                )
                midFloatCtx.globalAlpha = 1.0

                if (p.showQr) {
                    drawQrCode(midFloatCtx, W - 216, H - 224, 140, "#080B0E")
                }

                // --- HIGH FLOAT HERO LAYER (Role Headline + Attendee Name) ---
                applyFloatingCrispEdge(highFloatCtx)
                const execRoleResolved = resolveCanvasFont(
                    p.roleFont,
                    72,
                    700,
                    "Inter, -apple-system, sans-serif",
                    0.66
                )
                highFloatCtx.fillStyle = p.cardAccentColor
                applyResolvedFontToContext(highFloatCtx, execRoleResolved)
                highFloatCtx.textAlign = execRoleResolved.textAlign || "left"
                highFloatCtx.textBaseline = "middle"
                highFloatCtx.fillText(
                    String(p.roleTitle || "Organizer"),
                    76,
                    1020
                )

                const execNameResolved = resolveCanvasFont(
                    p.nameFont,
                    19,
                    600,
                    "Inter, -apple-system, sans-serif",
                    1.18
                )
                highFloatCtx.fillStyle = p.textColor
                applyResolvedFontToContext(highFloatCtx, execNameResolved)
                highFloatCtx.textAlign = execNameResolved.textAlign || "left"
                highFloatCtx.fillText(
                    String(p.attendeeName || "Alexander Weber").replace(
                        /\n/g,
                        " "
                    ),
                    76,
                    1125
                )
            }

            // ================================================================
            // COMPOSITE SOFT BLURRED CAST SHADOW ONTO `shadowFloatCanvas`
            // ================================================================
            const sw = shadowFloatCanvas.width
            const sh = shadowFloatCanvas.height
            shadowFloatCtx.save()
            shadowFloatCtx.filter = "blur(10px)"
            shadowFloatCtx.drawImage(midFloatCanvas, 0, 0, sw, sh)
            shadowFloatCtx.drawImage(highFloatCanvas, 0, 0, sw, sh)
            shadowFloatCtx.filter = "none"
            shadowFloatCtx.globalCompositeOperation = "source-in"
            shadowFloatCtx.fillStyle = "#000000"
            shadowFloatCtx.fillRect(0, 0, sw, sh)
            shadowFloatCtx.restore()

            if (midFloatTexture) midFloatTexture.needsUpdate = true
            if (highFloatTexture) highFloatTexture.needsUpdate = true
            if (shadowFloatTexture) shadowFloatTexture.needsUpdate = true
        }

        function drawAllCardCanvases() {
            drawCardBaseSurface()
            drawFloatingTextLayers()
        }

        function onFontLoadingDone() {
            if (disposed) return
            drawFloatingTextLayers()
            triggerFrameOrLoop()
        }

        function syncMediaSource() {
            const p = latest.current.props
            const propVideo = extractMediaUrl(p.mediaVideo)
            const propImage = extractMediaUrl(p.mediaImage)
            const desiredUrl = localObjectUrl || propVideo || propImage
            const isVid = localObjectUrl
                ? localIsVideo
                : Boolean(propVideo) || isVideoFile(desiredUrl)

            if (desiredUrl === activeMediaUrl) return
            activeMediaUrl = desiredUrl

            if (loadedVideo) {
                loadedVideo.pause()
                loadedVideo.src = ""
                loadedVideo = null
                videoPlaying = false
            }
            loadedImg = null

            if (!desiredUrl) {
                drawAllCardCanvases()
                triggerFrameOrLoop()
                return
            }

            if (isVid) {
                const vid = document.createElement("video")
                vid.crossOrigin = "anonymous"
                vid.muted = true
                vid.loop = true
                vid.playsInline = true
                vid.autoplay = true
                vid.src = desiredUrl
                vid.addEventListener("loadeddata", () => {
                    if (disposed || activeMediaUrl !== desiredUrl) return
                    loadedVideo = vid
                    vid.play()
                        .then(() => {
                            videoPlaying = true
                            triggerFrameOrLoop()
                        })
                        .catch(() => {
                            videoPlaying = false
                            drawAllCardCanvases()
                            triggerFrameOrLoop()
                        })
                })
                vid.load()
            } else {
                const img = new Image()
                img.crossOrigin = "anonymous"
                img.onload = () => {
                    if (disposed || activeMediaUrl !== desiredUrl) return
                    loadedImg = img
                    drawAllCardCanvases()
                    triggerFrameOrLoop()
                }
                img.src = desiredUrl
            }
        }

        localUploadRef.current = (file: File) => {
            if (localObjectUrl) URL.revokeObjectURL(localObjectUrl)
            localObjectUrl = URL.createObjectURL(file)
            localIsVideo = file.type.startsWith("video/")
            syncMediaSource()
        }

        function syncMaterialsAndColors() {
            const p = latest.current.props
            if (chromeMat) chromeMat.color.set(p.metalColor)
            if (pinMat) {
                pinMat.color.set(p.metalColor).multiplyScalar(0.62)
            }
            if (bezelMat) {
                bezelMat.color
                    .set(p.cardAccentColor)
                    .lerp(new THREE.Color(p.metalColor), 0.55)
            }
            if (shadowFloatMat) {
                shadowFloatMat.opacity = (p.textShadowOpacity / 100) * 0.78
            }
            drawWovenStrapTexture(false)

            const cKey = JSON.stringify([
                p.cardLayout,
                p.brandName,
                p.brandFont,
                p.roleTitle,
                p.roleFont,
                p.attendeeName,
                p.nameFont,
                p.jobTitle,
                p.companyName,
                p.badgeId,
                p.metaFont,
                p.showLogoEmblem,
                p.showQr,
                p.mediaFit,
                p.overlayOpacity,
                p.cardBaseColor,
                p.cardAccentColor,
                p.cardSecondaryColor,
                p.textColor,
            ])
            if (cKey !== lastCardKey) {
                lastCardKey = cKey
                drawAllCardCanvases()

                // Trigger browser WebFont loader so newly selected Framer fonts redraw immediately once ready
                if (typeof document !== "undefined" && document.fonts?.load) {
                    const fontSpecs = [
                        resolveCanvasFont(p.brandFont, 18, 600).fontString,
                        resolveCanvasFont(p.roleFont, 72, 600).fontString,
                        resolveCanvasFont(p.nameFont, 19, 500).fontString,
                        resolveCanvasFont(p.metaFont, 12, 500).fontString,
                    ]
                    Promise.allSettled(
                        fontSpecs.map((spec) => document.fonts.load(spec))
                    ).then(() => {
                        if (!disposed) {
                            drawFloatingTextLayers()
                            triggerFrameOrLoop()
                        }
                    })
                }
            }
        }

        function updateCameraAndTopAnchor() {
            if (!renderer || !camera || !container) return
            const w = Math.max(1, container.clientWidth)
            const h = Math.max(1, container.clientHeight)
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                latest.current.props.quality || 2
            )
            renderer.setPixelRatio(dpr)
            renderer.setSize(w, h, false)

            camera.aspect = w / h
            const aspectScale =
                camera.aspect < 0.78 ? 0.78 / camera.aspect : 1.0
            const zoomFactor = Math.max(
                0.45,
                (latest.current.props.zoom || 100) / 100
            )
            const camDist = (7.4 * aspectScale) / zoomFactor
            camera.position.set(0, -0.35, camDist)
            camera.lookAt(0, -0.35, 0)
            camera.updateProjectionMatrix()

            const halfVisibleH =
                Math.tan((camera.fov * Math.PI) / 360) * camDist
            topViewportY = -0.35 + halfVisibleH + 0.14

            const p = latest.current.props
            restStrapLen = 0.95 + (p.strapDrop / 100) * 1.75
            topAnchor.set(0, topViewportY, 0)
        }

        function stepPhysicsAndAnimation(dt: number, snap: boolean) {
            const p = latest.current.props
            const restYaw = (p.restingYaw * Math.PI) / 180
            const restTargetY = topViewportY - restStrapLen

            if (snap) {
                dRingPos.set(0, restTargetY, 0)
                dRingVel.set(0, 0, 0)
                midCurvePos.set(0, topViewportY - restStrapLen * 0.5, 0)
                midCurveVel.set(0, 0, 0)
                cardRollZ = 0
                cardPitchX = 0
                cardYawY = restYaw
                cardVelRollZ = 0
                cardVelPitchX = 0
                cardVelYawY = 0
                smoothPointerX = pointerTargetX
                smoothPointerY = pointerTargetY
            } else {
                elapsed += dt

                const pointerLerp = 1.0 - Math.exp(-dt * 10.0)
                smoothPointerX +=
                    (pointerTargetX - smoothPointerX) * pointerLerp
                smoothPointerY +=
                    (pointerTargetY - smoothPointerY) * pointerLerp

                const kSpring = 24.0 + (p.gravity / 100) * 38.0
                const damp = 3.2 + (p.damping / 100) * 5.5

                const swayAmp = (p.idleSway / 100) * 0.055
                const breezeX =
                    Math.sin(elapsed * 1.2) * swayAmp +
                    Math.cos(elapsed * 0.65) * swayAmp * 0.4
                const breezeZ = Math.cos(elapsed * 0.95) * swayAmp * 0.45

                if (isDragging) {
                    const pullDeltaX = dragCurrentWorld.x - dragStartHitWorld.x
                    const pullDeltaY = dragCurrentWorld.y - dragStartHitWorld.y

                    const targetX = Math.max(
                        -2.4,
                        Math.min(2.4, dragStartDRingPos.x + pullDeltaX)
                    )
                    const targetY = Math.max(
                        topViewportY - restStrapLen - 1.35,
                        Math.min(
                            topViewportY - 0.65,
                            dragStartDRingPos.y + pullDeltaY * 0.72
                        )
                    )
                    const targetZ = Math.max(
                        -0.6,
                        Math.min(0.6, Math.abs(pullDeltaX) * 0.12)
                    )

                    const prevX = dRingPos.x
                    const prevY = dRingPos.y
                    const blend = 1.0 - Math.exp(-dt * 24.0)
                    dRingPos.x += (targetX - dRingPos.x) * blend
                    dRingPos.y += (targetY - dRingPos.y) * blend
                    dRingPos.z += (targetZ - dRingPos.z) * blend

                    dRingVel.set(
                        ((dRingPos.x - prevX) / Math.max(0.001, dt)) * 0.55,
                        ((dRingPos.y - prevY) / Math.max(0.001, dt)) * 0.55,
                        0
                    )

                    const leverTorqueZ =
                        -grabCardLocal.x * 0.18 + pullDeltaX * 0.16
                    const clampedTargetRoll = Math.max(
                        -0.52,
                        Math.min(0.52, leverTorqueZ)
                    )
                    cardRollZ +=
                        (clampedTargetRoll - cardRollZ) *
                        (1.0 - Math.exp(-dt * 14.0))
                    cardYawY +=
                        (restYaw + pullDeltaX * 0.28 - cardYawY) *
                        (1.0 - Math.exp(-dt * 12.0))
                    cardVelRollZ = 0
                } else {
                    const fx =
                        -kSpring * (dRingPos.x - breezeX) - damp * dRingVel.x
                    const fy =
                        -kSpring * 1.35 * (dRingPos.y - restTargetY) -
                        damp * 1.15 * dRingVel.y
                    const fz =
                        -kSpring * (dRingPos.z - breezeZ) - damp * dRingVel.z

                    dRingVel.x += fx * dt
                    dRingVel.y += fy * dt
                    dRingVel.z += fz * dt

                    dRingPos.x += dRingVel.x * dt
                    dRingPos.y += dRingVel.y * dt
                    dRingPos.z += dRingVel.z * dt

                    const dx = dRingPos.x - topAnchor.x
                    const dy = dRingPos.y - topAnchor.y
                    const dz = dRingPos.z - topAnchor.z
                    const curLen = Math.hypot(dx, dy, dz) || 0.001
                    const maxStretch = restStrapLen * 1.35
                    if (curLen > maxStretch) {
                        const scale = maxStretch / curLen
                        dRingPos.x = topAnchor.x + dx * scale
                        dRingPos.y = topAnchor.y + dy * scale
                        dRingPos.z = topAnchor.z + dz * scale
                    }
                    if (dRingPos.y > topViewportY - 0.65) {
                        dRingPos.y = topViewportY - 0.65
                        if (dRingVel.y > 0) dRingVel.y *= -0.3
                    }

                    const strapAngleZ = Math.atan2(
                        dRingPos.x - topAnchor.x,
                        topAnchor.y - dRingPos.y
                    )
                    const strapAngleX = Math.atan2(
                        dRingPos.z - topAnchor.z,
                        topAnchor.y - dRingPos.y
                    )

                    const wristStiff = 22.0 + (p.gravity / 100) * 28.0
                    const wristDamp =
                        Math.max(1.2, 5.2 - (p.swivelFreedom / 100) * 3.0) *
                        (0.55 + (p.damping / 100) * 0.85)

                    const pointerYawBias =
                        smoothPointerX * (p.textParallax / 100) * 0.16
                    const pointerPitchBias =
                        -smoothPointerY * (p.textParallax / 100) * 0.11

                    const targetRoll = strapAngleZ * 0.45
                    const targetPitch = -strapAngleX * 0.45 + pointerPitchBias
                    const targetYaw =
                        restYaw +
                        Math.sin(elapsed * 0.9) * (p.idleSway / 100) * 0.15 +
                        pointerYawBias

                    cardVelRollZ +=
                        (-wristStiff * (cardRollZ - targetRoll) -
                            wristDamp * cardVelRollZ -
                            dRingVel.x * 0.25) *
                        dt
                    cardVelPitchX +=
                        (-wristStiff * (cardPitchX - targetPitch) -
                            wristDamp * cardVelPitchX +
                            dRingVel.z * 0.25) *
                        dt
                    cardVelYawY +=
                        (-wristStiff * 0.5 * (cardYawY - targetYaw) -
                            wristDamp * 0.7 * cardVelYawY) *
                        dt

                    cardRollZ = Math.max(
                        -0.65,
                        Math.min(0.65, cardRollZ + cardVelRollZ * dt)
                    )
                    cardPitchX = Math.max(
                        -0.5,
                        Math.min(0.5, cardPitchX + cardVelPitchX * dt)
                    )
                    cardYawY += cardVelYawY * dt
                }

                const idealMidX = (topAnchor.x + dRingPos.x) * 0.5
                const idealMidY = (topAnchor.y + dRingPos.y) * 0.5
                const idealMidZ = (topAnchor.z + dRingPos.z) * 0.5
                const midStiff = 42.0
                const midDamp = 6.5

                midCurveVel.x +=
                    (-midStiff * (midCurvePos.x - idealMidX) -
                        midDamp * midCurveVel.x) *
                    dt
                midCurveVel.y +=
                    (-midStiff * (midCurvePos.y - idealMidY) -
                        midDamp * midCurveVel.y) *
                    dt
                midCurveVel.z +=
                    (-midStiff * (midCurvePos.z - idealMidZ) -
                        midDamp * midCurveVel.z) *
                    dt

                midCurvePos.x += midCurveVel.x * dt
                midCurvePos.y = idealMidY
                midCurvePos.z += midCurveVel.z * dt
            }

            if (strapGeo) {
                updateWrappedStrapVertices(
                    strapGeo,
                    topAnchor,
                    midCurvePos,
                    dRingPos,
                    cardYawY,
                    80,
                    0.58,
                    0.044
                )
            }

            if (claspRootGroup && swivelHubGroup) {
                claspRootGroup.position.copy(dRingPos)

                const strapAngleZ = Math.atan2(
                    dRingPos.x - midCurvePos.x,
                    midCurvePos.y - dRingPos.y
                )
                const strapAngleX = Math.atan2(
                    dRingPos.z - midCurvePos.z,
                    midCurvePos.y - dRingPos.y
                )

                claspRootGroup.rotation.set(
                    -strapAngleX * 0.7,
                    cardYawY * 0.5,
                    strapAngleZ * 0.7
                )

                swivelHubGroup.rotation.set(
                    cardPitchX + strapAngleX * 0.3,
                    cardYawY * 0.5,
                    cardRollZ - strapAngleZ * 0.3
                )
            }

            // ================================================================
            // UPDATE 3D FLOATING TEXT PLANES (STRONG DETACHED PARALLAX)
            // ================================================================
            const floatFactor = Math.max(0, p.textFloatDepth / 100)
            const parallaxStrength = Math.max(0, p.textParallax / 100)

            const effectiveYaw = Math.sin(cardYawY) + smoothPointerX * 0.68
            const effectivePitch =
                Math.sin(cardPitchX) -
                smoothPointerY * 0.62 +
                Math.sin(elapsed * 1.8) * 0.06

            const shiftX = effectiveYaw * parallaxStrength
            const shiftY = effectivePitch * parallaxStrength

            const baseCardCenterY = -1.84
            const cardFrontSurfaceZ = 0.039

            if (midFloatMesh) {
                const midZ = cardFrontSurfaceZ + floatFactor * 0.19
                midFloatMesh.position.set(
                    shiftX * 0.14,
                    baseCardCenterY + shiftY * 0.12,
                    midZ
                )
                midFloatMesh.rotation.set(
                    -effectivePitch * parallaxStrength * 0.08,
                    effectiveYaw * parallaxStrength * 0.11,
                    -cardRollZ * parallaxStrength * 0.08
                )
            }

            if (highFloatMesh) {
                const highZ =
                    cardFrontSurfaceZ +
                    floatFactor * 0.35 +
                    Math.sin(elapsed * 2.1) * 0.012 * floatFactor
                highFloatMesh.position.set(
                    shiftX * 0.27,
                    baseCardCenterY + shiftY * 0.23,
                    highZ
                )
                highFloatMesh.rotation.set(
                    -effectivePitch * parallaxStrength * 0.15,
                    effectiveYaw * parallaxStrength * 0.2,
                    -cardRollZ * parallaxStrength * 0.14
                )
            }

            if (shadowFloatMesh) {
                shadowFloatMesh.visible =
                    p.textShadowOpacity > 0 && p.textFloatDepth > 2
                shadowFloatMesh.position.set(
                    -shiftX * 0.085 + 0.028 * floatFactor,
                    baseCardCenterY - shiftY * 0.085 - 0.042 * floatFactor,
                    cardFrontSurfaceZ + 0.003
                )
            }

            if (videoPlaying && loadedVideo && !loadedVideo.paused) {
                drawCardBaseSurface()
            }
        }

        function renderSingleFrame() {
            if (!renderer || !scene || !camera || disposed) return
            stepPhysicsAndAnimation(0, true)
            renderer.render(scene, camera)
        }

        function animateLoop(now: number) {
            frameId = 0
            if (disposed || !isIntersecting.current) {
                prevTime = 0
                return
            }
            const dt = prevTime
                ? Math.min(0.033, Math.max(0.001, (now - prevTime) / 1000))
                : 1 / 60
            prevTime = now

            stepPhysicsAndAnimation(dt, false)
            if (renderer && scene && camera) {
                renderer.render(scene, camera)
            }

            if (shouldAnimate()) {
                frameId = requestAnimationFrame(animateLoop)
            }
        }

        function triggerFrameOrLoop() {
            if (disposed || !isIntersecting.current) return
            if (shouldAnimate()) {
                if (!frameId) {
                    prevTime = 0
                    frameId = requestAnimationFrame(animateLoop)
                }
            } else {
                cancelAnimationFrame(frameId)
                frameId = 0
                renderSingleFrame()
            }
        }

        function onPointerDown(e: PointerEvent) {
            if (e.button !== 0 || !container || !camera || !cardMesh) return
            const p = latest.current.props
            if (!p.interactivePhysics) return

            const rect = container.getBoundingClientRect()
            mouse.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            )
            prevMouse.copy(mouse)
            pointerTargetX = mouse.x
            pointerTargetY = mouse.y

            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObject(cardMesh, false)

            if (hits.length > 0 && p.draggableCard) {
                isDragging = true
                activePointerId = e.pointerId
                dragStartScreenX = e.clientX
                dragStartScreenY = e.clientY

                const hitPt = hits[0].point.clone()
                dragPlane.setFromNormalAndCoplanarPoint(
                    new THREE.Vector3(0, 0, 1),
                    hitPt
                )
                dragStartHitWorld.copy(hitPt)
                dragCurrentWorld.copy(hitPt)
                dragStartDRingPos.copy(dRingPos)

                grabCardLocal.copy(hitPt)
                cardMesh.worldToLocal(grabCardLocal)

                container.style.cursor = "grabbing"
                try {
                    container.setPointerCapture(e.pointerId)
                } catch {}
            } else {
                dRingVel.x += (mouse.x > 0 ? -1 : 1) * 1.4
                cardVelYawY += (mouse.x > 0 ? -1 : 1) * 2.8
            }
            triggerFrameOrLoop()
        }

        function onPointerMove(e: PointerEvent) {
            if (!container || !camera || !cardMesh) return
            const p = latest.current.props

            const rect = container.getBoundingClientRect()
            if (!rect.width || !rect.height) return
            mouse.set(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -(((e.clientY - rect.top) / rect.height) * 2 - 1)
            )
            const mdx = mouse.x - prevMouse.x
            const mdy = mouse.y - prevMouse.y
            prevMouse.copy(mouse)

            pointerTargetX = Math.max(-1, Math.min(1, mouse.x))
            pointerTargetY = Math.max(-1, Math.min(1, mouse.y))

            if (!p.interactivePhysics) {
                if (!shouldAnimate()) renderSingleFrame()
                else triggerFrameOrLoop()
                return
            }

            if (isDragging && e.pointerId === activePointerId) {
                raycaster.setFromCamera(mouse, camera)
                raycaster.ray.intersectPlane(dragPlane, dragCurrentWorld)
            } else if (p.hoverNudge > 0) {
                raycaster.setFromCamera(mouse, camera)
                const hits = raycaster.intersectObject(cardMesh, false)
                if (hits.length > 0) {
                    const nudge = (p.hoverNudge / 100) * 1.8
                    dRingVel.x += mdx * nudge
                    dRingVel.y += mdy * nudge * 0.4
                    cardVelYawY += mdx * nudge * 4.5
                    cardVelRollZ -= mdx * nudge * 1.6
                }
            }

            if (!shouldAnimate()) renderSingleFrame()
            else triggerFrameOrLoop()
        }

        function onPointerLeave() {
            pointerTargetX = 0
            pointerTargetY = 0
            triggerFrameOrLoop()
        }

        function onPointerUp(e: PointerEvent) {
            if (!isDragging || e.pointerId !== activePointerId) return
            isDragging = false
            activePointerId = -1
            if (container) {
                container.style.cursor = latest.current.props.draggableCard
                    ? "grab"
                    : "default"
                try {
                    if (container.hasPointerCapture(e.pointerId)) {
                        container.releasePointerCapture(e.pointerId)
                    }
                } catch {}
            }
            const movedDist = Math.hypot(
                e.clientX - dragStartScreenX,
                e.clientY - dragStartScreenY
            )
            if (movedDist < 5 && latest.current.props.clickToUpload) {
                fileInputRef.current?.click()
            }
            triggerFrameOrLoop()
        }

        function onDragOver(e: DragEvent) {
            e.preventDefault()
        }

        function onDrop(e: DragEvent) {
            e.preventDefault()
            const file = e.dataTransfer?.files?.[0]
            if (
                file &&
                (file.type.startsWith("image/") ||
                    file.type.startsWith("video/"))
            ) {
                localUploadRef.current?.(file)
            }
        }

        try {
            renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
            })
            renderer.setClearColor(0x000000, 0)
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = 1.05
            renderer.domElement.style.cssText =
                "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;"
            container.appendChild(renderer.domElement)

            scene = new THREE.Scene()
            envRT = createStudioEnvironment(renderer)
            scene.environment = envRT.texture

            camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
            scene.add(rootGroup)

            scene.add(new THREE.AmbientLight(0xdce6f5, 0.55))
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.85)
            keyLight.position.set(-5, 9, 10)
            scene.add(keyLight)

            const fillLight = new THREE.DirectionalLight(0xd0e2ff, 0.85)
            fillLight.position.set(7, 3, 6)
            scene.add(fillLight)

            cardBaseTexture = new THREE.CanvasTexture(cardBaseCanvas)
            cardBaseTexture.colorSpace = THREE.SRGBColorSpace
            cardBaseTexture.anisotropy = 8
            textures.add(cardBaseTexture)

            midFloatTexture = new THREE.CanvasTexture(midFloatCanvas)
            midFloatTexture.colorSpace = THREE.SRGBColorSpace
            midFloatTexture.anisotropy = 8
            textures.add(midFloatTexture)

            highFloatTexture = new THREE.CanvasTexture(highFloatCanvas)
            highFloatTexture.colorSpace = THREE.SRGBColorSpace
            highFloatTexture.anisotropy = 8
            textures.add(highFloatTexture)

            shadowFloatTexture = new THREE.CanvasTexture(shadowFloatCanvas)
            shadowFloatTexture.colorSpace = THREE.SRGBColorSpace
            textures.add(shadowFloatTexture)

            strapTexture = new THREE.CanvasTexture(strapCanvas)
            strapTexture.colorSpace = THREE.SRGBColorSpace
            strapTexture.anisotropy = 8
            textures.add(strapTexture)

            drawWovenStrapTexture(true)
            drawAllCardCanvases()

            strapMat = new THREE.MeshStandardMaterial({
                map: strapTexture,
                roughness: 0.82,
                metalness: 0.04,
                envMapIntensity: 0.22,
            })
            strapMat.onBeforeCompile = (shader) => {
                shader.vertexShader =
                    "varying vec2 vWovenUv;\n" + shader.vertexShader
                shader.vertexShader = shader.vertexShader.replace(
                    "#include <begin_vertex>",
                    "#include <begin_vertex>\nvWovenUv = uv;"
                )
                shader.fragmentShader =
                    "varying vec2 vWovenUv;\n" + shader.fragmentShader
                shader.fragmentShader = shader.fragmentShader.replace(
                    "#include <color_fragment>",
                    `#include <color_fragment>
                    float ribWave = sin(vWovenUv.y * 540.0);
                    float threadWave = sin(vWovenUv.x * 165.0);
                    float edgeDist = min(vWovenUv.x, 1.0 - vWovenUv.x);
                    float isSelvage = 1.0 - smoothstep(0.06, 0.095, edgeDist);
                    float selvageBead = sin(vWovenUv.y * 360.0) * isSelvage;
                    float groove = smoothstep(0.06, 0.08, edgeDist) * (1.0 - smoothstep(0.08, 0.105, edgeDist));

                    float weaveRelief = (ribWave * 0.09 + threadWave * 0.03) * (1.0 - isSelvage) + selvageBead * 0.12 - groove * 0.22;
                    diffuseColor.rgb *= (0.94 + weaveRelief);`
                )
            }
            strapMat.customProgramCacheKey = () => "macro-woven-strap-v4"
            materials.add(strapMat)

            strapGeo = buildWrappedStrapGeometry(80, 0.58, 0.044)
            geometries.add(strapGeo)
            const strapMesh = new THREE.Mesh(strapGeo, strapMat)
            strapMesh.frustumCulled = false
            rootGroup.add(strapMesh)

            chromeMat = new THREE.MeshStandardMaterial({
                color: props.metalColor,
                roughness: 0.09,
                metalness: 0.96,
                envMapIntensity: 1.55,
            })
            pinMat = new THREE.MeshStandardMaterial({
                color: "#8E949E",
                roughness: 0.24,
                metalness: 0.9,
                envMapIntensity: 1.15,
            })
            bezelMat = new THREE.MeshStandardMaterial({
                color: props.cardAccentColor,
                roughness: 0.22,
                metalness: 0.78,
                envMapIntensity: 1.2,
            })
            materials.add(chromeMat)
            materials.add(pinMat)
            materials.add(bezelMat)

            const builtClasp = buildChromeLobsterClasp(
                chromeMat,
                pinMat,
                strapMat
            )
            builtClasp.geometries.forEach((g) => geometries.add(g))
            claspRootGroup = builtClasp.root
            swivelHubGroup = builtClasp.swivelGroup
            rootGroup.add(claspRootGroup)

            cardAttachmentGroup.position.set(0, -0.44, 0.012)
            swivelHubGroup.add(cardAttachmentGroup)

            cardMat = new THREE.MeshStandardMaterial({
                map: cardBaseTexture,
                roughness: 0.25,
                metalness: 0.06,
                envMapIntensity: 0.68,
            })
            materials.add(cardMat)

            const builtCard = buildBadgeCardAssembly(
                cardMat,
                chromeMat,
                bezelMat,
                2.56,
                3.68,
                0.17,
                0.044
            )
            builtCard.geometries.forEach((g) => geometries.add(g))
            cardMesh = builtCard.cardMesh
            cardAttachmentGroup.add(builtCard.group)

            const floatPlaneGeo = new THREE.PlaneGeometry(2.56, 3.68)
            geometries.add(floatPlaneGeo)

            shadowFloatMat = new THREE.MeshBasicMaterial({
                map: shadowFloatTexture,
                transparent: true,
                opacity: (props.textShadowOpacity / 100) * 0.78,
                depthWrite: false,
            })
            midFloatMat = new THREE.MeshBasicMaterial({
                map: midFloatTexture,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
            })
            highFloatMat = new THREE.MeshBasicMaterial({
                map: highFloatTexture,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
            })
            materials.add(shadowFloatMat)
            materials.add(midFloatMat)
            materials.add(highFloatMat)

            shadowFloatMesh = new THREE.Mesh(floatPlaneGeo, shadowFloatMat)
            shadowFloatMesh.position.set(0, -1.84, 0.042)
            shadowFloatMesh.renderOrder = 1
            cardAttachmentGroup.add(shadowFloatMesh)

            midFloatMesh = new THREE.Mesh(floatPlaneGeo, midFloatMat)
            midFloatMesh.position.set(0, -1.84, 0.2)
            midFloatMesh.renderOrder = 2
            cardAttachmentGroup.add(midFloatMesh)

            highFloatMesh = new THREE.Mesh(floatPlaneGeo, highFloatMat)
            highFloatMesh.position.set(0, -1.84, 0.35)
            highFloatMesh.renderOrder = 3
            cardAttachmentGroup.add(highFloatMesh)

            updateCameraAndTopAnchor()
            dRingPos.set(0, topViewportY - restStrapLen, 0)
            midCurvePos.set(0, topViewportY - restStrapLen * 0.5, 0)

            syncMediaSource()
            syncMaterialsAndColors()
            triggerFrameOrLoop()

            if (typeof document !== "undefined" && document.fonts) {
                document.fonts.addEventListener(
                    "loadingdone",
                    onFontLoadingDone
                )
            }

            resizeObserver = new ResizeObserver(() => {
                if (disposed) return
                updateCameraAndTopAnchor()
                if (!shouldAnimate()) renderSingleFrame()
            })
            resizeObserver.observe(container)

            intersectionObserver = new IntersectionObserver((entries) => {
                isIntersecting.current = entries[0]?.isIntersecting ?? true
                if (!isIntersecting.current) {
                    cancelAnimationFrame(frameId)
                    frameId = 0
                } else {
                    triggerFrameOrLoop()
                }
            })
            intersectionObserver.observe(container)

            container.addEventListener("pointerdown", onPointerDown)
            container.addEventListener("pointermove", onPointerMove, {
                passive: true,
            })
            container.addEventListener("pointerleave", onPointerLeave)
            container.addEventListener("pointerup", onPointerUp)
            container.addEventListener("pointercancel", onPointerUp)
            container.addEventListener("dragover", onDragOver)
            container.addEventListener("drop", onDrop)

            refreshRef.current = () => {
                if (disposed) return
                syncMediaSource()
                syncMaterialsAndColors()
                updateCameraAndTopAnchor()
                triggerFrameOrLoop()
            }
        } catch (err) {
            console.warn("CreativePassLanyard WebGL error:", err)
        }

        return () => {
            disposed = true
            refreshRef.current = null
            localUploadRef.current = null
            cancelAnimationFrame(frameId)
            resizeObserver?.disconnect()
            intersectionObserver?.disconnect()
            if (typeof document !== "undefined" && document.fonts) {
                document.fonts.removeEventListener(
                    "loadingdone",
                    onFontLoadingDone
                )
            }
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerleave", onPointerLeave)
            container.removeEventListener("pointerup", onPointerUp)
            container.removeEventListener("pointercancel", onPointerUp)
            container.removeEventListener("dragover", onDragOver)
            container.removeEventListener("drop", onDrop)

            if (loadedVideo) {
                loadedVideo.pause()
                loadedVideo.src = ""
            }
            if (localObjectUrl) URL.revokeObjectURL(localObjectUrl)

            envRT?.dispose()
            geometries.forEach((g) => g.dispose())
            materials.forEach((m) => m.dispose())
            textures.forEach((t) => t.dispose())
            scene?.clear()

            if (renderer) {
                renderer.forceContextLoss()
                renderer.dispose()
                if (container && container.contains(renderer.domElement)) {
                    container.removeChild(renderer.domElement)
                }
            }
        }
    }, [])

    useEffect(() => {
        refreshRef.current?.()
    })

    return (
        <div
            id={props.id}
            className={props.className}
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                backgroundColor: props.transparentBg
                    ? "transparent"
                    : props.bgColor,
                userSelect: "none",
                cursor: props.draggableCard ? "grab" : "default",
                ...props.style,
            }}
        >
            {/* Hidden DOM Warmup Node so Framer's Font Loader injects @font-face CSS for selected fonts */}
            <div
                aria-hidden="true"
                style={{
                    position: "absolute",
                    width: 0,
                    height: 0,
                    overflow: "hidden",
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <span style={props.brandFont as React.CSSProperties}>
                    {props.brandName}
                </span>
                <span style={props.roleFont as React.CSSProperties}>
                    {props.roleTitle}
                </span>
                <span style={props.nameFont as React.CSSProperties}>
                    {props.attendeeName}
                </span>
                <span style={props.metaFont as React.CSSProperties}>
                    {props.jobTitle} {props.companyName} {props.badgeId}
                </span>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                aria-label="Upload local image or video to badge card"
                style={{ display: "none" }}
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) localUploadRef.current?.(file)
                    e.target.value = ""
                }}
            />
        </div>
    )
}

// STEP 2: Nested DefaultProps mirroring UI Sections
CreativePassLanyard.defaultProps = {
    livePreview: true,
    media: {
        cardLayout: defaults.cardLayout,
        mediaImage: defaults.mediaImage,
        mediaVideo: defaults.mediaVideo,
        mediaFit: defaults.mediaFit,
        overlayOpacity: defaults.overlayOpacity,
        clickToUpload: defaults.clickToUpload,
    },
    cardContent: {
        brandName: defaults.brandName,
        brandFont: defaults.brandFont,
        roleTitle: defaults.roleTitle,
        roleFont: defaults.roleFont,
        attendeeName: defaults.attendeeName,
        nameFont: defaults.nameFont,
        jobTitle: defaults.jobTitle,
        companyName: defaults.companyName,
        badgeId: defaults.badgeId,
        metaFont: defaults.metaFont,
        showLogoEmblem: defaults.showLogoEmblem,
        showStrapEmblem: defaults.showStrapEmblem,
        showQr: defaults.showQr,
        textFloatDepth: defaults.textFloatDepth,
        textParallax: defaults.textParallax,
        textShadowOpacity: defaults.textShadowOpacity,
    },
    colors: {
        transparentBg: defaults.transparentBg,
        bgColor: defaults.bgColor,
        strapColor: defaults.strapColor,
        strapEmblemColor: defaults.strapEmblemColor,
        metalColor: defaults.metalColor,
        cardBaseColor: defaults.cardBaseColor,
        cardAccentColor: defaults.cardAccentColor,
        cardSecondaryColor: defaults.cardSecondaryColor,
        textColor: defaults.textColor,
        strapDrop: defaults.strapDrop,
    },
    physics: {
        interactivePhysics: defaults.interactivePhysics,
        draggableCard: defaults.draggableCard,
        gravity: defaults.gravity,
        damping: defaults.damping,
        swivelFreedom: defaults.swivelFreedom,
        idleSway: defaults.idleSway,
        hoverNudge: defaults.hoverNudge,
    },
    cameraView: {
        zoom: defaults.zoom,
        restingYaw: defaults.restingYaw,
        quality: defaults.quality,
    },
}

// STEP 3: Categorized Property Controls (With Native Framer ControlType.Font Pickers)
addPropertyControls(CreativePassLanyard, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        description: "Run real-time pendulum physics in editor.",
    },
    media: {
        type: ControlType.Object,
        title: "Card Layout & Media",
        controls: {
            cardLayout: {
                type: ControlType.Enum,
                title: "Card Style",
                options: ["auroraOverlay", "cyberPixel", "executiveId"],
                optionTitles: [
                    "1. Hero Media + Badge Overlay",
                    "2. Cyber Pixel Pass",
                    "3. Executive Split ID",
                ],
                defaultValue: defaults.cardLayout,
                description: "Badge layout style with text & media.",
            },
            mediaImage: {
                type: ControlType.Image,
                title: "Local Image",
                description: "Upload a photo or GIF onto the badge.",
            },
            mediaVideo: {
                type: ControlType.File,
                title: "Local Video",
                allowedFileTypes: [
                    "mp4",
                    "webm",
                    "mov",
                    "ogg",
                    "png",
                    "jpg",
                    "jpeg",
                    "webp",
                    "gif",
                ],
                description: "Upload a local MP4/WebM video file.",
            },
            mediaFit: {
                type: ControlType.Enum,
                title: "Media Fit",
                options: ["cover", "contain"],
                optionTitles: ["Cover (Fill)", "Contain (Fit)"],
                defaultValue: defaults.mediaFit,
                description: "How uploaded media scales on card.",
            },
            overlayOpacity: {
                type: ControlType.Number,
                title: "Text Shade",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: defaults.overlayOpacity,
                description: "Dark gradient behind badge text.",
                hidden: (p) => p.cardLayout !== "auroraOverlay",
            },
            clickToUpload: {
                type: ControlType.Boolean,
                title: "Click Upload",
                defaultValue: defaults.clickToUpload,
                description: "Click card or drop file to load media.",
            },
        },
    },
    cardContent: {
        type: ControlType.Object,
        title: "Badge Text & Fonts",
        controls: {
            textFloatDepth: {
                type: ControlType.Number,
                title: "Text Float",
                min: 0,
                max: 100,
                step: 2,
                unit: "%",
                defaultValue: defaults.textFloatDepth,
                description: "3D Z-distance text floats off the card.",
            },
            textParallax: {
                type: ControlType.Number,
                title: "Text Parallax",
                min: 0,
                max: 100,
                step: 2,
                unit: "%",
                defaultValue: defaults.textParallax,
                description: "Strength of floating text parallax motion.",
            },
            textShadowOpacity: {
                type: ControlType.Number,
                title: "Float Shadow",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: defaults.textShadowOpacity,
                description: "Soft shadow cast onto card by floating text.",
            },
            brandName: {
                type: ControlType.String,
                title: "Event Brand",
                displayTextArea: true,
                defaultValue: defaults.brandName,
                description: "Top-left summit or brand title.",
            },
            brandFont: {
                type: ControlType.Font,
                title: "Brand Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: defaults.brandFont,
                description: "Framer native font for event brand.",
            },
            roleTitle: {
                type: ControlType.String,
                title: "Role / Pass",
                defaultValue: defaults.roleTitle,
                description: "Main badge headline (e.g. Organizer).",
            },
            roleFont: {
                type: ControlType.Font,
                title: "Role Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: defaults.roleFont,
                description: "Framer native font for main role headline.",
            },
            attendeeName: {
                type: ControlType.String,
                title: "Name / Sub",
                displayTextArea: true,
                defaultValue: defaults.attendeeName,
                description: "Attendee name or sector label.",
            },
            nameFont: {
                type: ControlType.Font,
                title: "Name Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: defaults.nameFont,
                description: "Framer native font for attendee name.",
            },
            jobTitle: {
                type: ControlType.String,
                title: "Job Title",
                defaultValue: defaults.jobTitle,
                description: "Role or channel caption on card.",
            },
            companyName: {
                type: ControlType.String,
                title: "Company",
                defaultValue: defaults.companyName,
                description: "Organization name at bottom-right.",
            },
            badgeId: {
                type: ControlType.String,
                title: "Access Code",
                defaultValue: defaults.badgeId,
                description: "Technical status line for Pixel Pass.",
                hidden: (p) => p.cardLayout !== "cyberPixel",
            },
            metaFont: {
                type: ControlType.Font,
                title: "Details Font",
                controls: "extended",
                defaultFontType: "sans-serif",
                defaultValue: defaults.metaFont,
                description: "Framer native font for job title & company.",
            },
            showLogoEmblem: {
                type: ControlType.Boolean,
                title: "Card Emblem",
                defaultValue: defaults.showLogoEmblem,
                description: "Show geometric radar mark on card.",
            },
            showStrapEmblem: {
                type: ControlType.Boolean,
                title: "Strap Emblem",
                defaultValue: defaults.showStrapEmblem,
                description: "Show white geometric mark on strap.",
            },
            showQr: {
                type: ControlType.Boolean,
                title: "QR Code",
                defaultValue: defaults.showQr,
                description: "Display scannable QR code badge.",
            },
        },
    },
    colors: {
        type: ControlType.Object,
        title: "Colors & Strap",
        controls: {
            transparentBg: {
                type: ControlType.Boolean,
                title: "Transparent BG",
                defaultValue: defaults.transparentBg,
                description: "Overlay hanging lanyard on any page.",
            },
            bgColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaults.bgColor,
                description: "Canvas background color.",
                hidden: (p) => Boolean(p.transparentBg),
            },
            strapColor: {
                type: ControlType.Color,
                title: "Strap Color",
                defaultValue: defaults.strapColor,
                description: "Color of ribbed woven nylon strap.",
            },
            strapEmblemColor: {
                type: ControlType.Color,
                title: "Strap Emblem",
                defaultValue: defaults.strapEmblemColor,
                description: "Ink color of the emblem on strap.",
            },
            metalColor: {
                type: ControlType.Color,
                title: "Chrome Clasp",
                defaultValue: defaults.metalColor,
                description: "Polished metal D-ring & claw tint.",
            },
            cardBaseColor: {
                type: ControlType.Color,
                title: "Card Base",
                defaultValue: defaults.cardBaseColor,
                description: "Primary background color of card.",
            },
            cardAccentColor: {
                type: ControlType.Color,
                title: "Card Accent",
                defaultValue: defaults.cardAccentColor,
                description: "Highlight aura or pixel banner color.",
            },
            cardSecondaryColor: {
                type: ControlType.Color,
                title: "Card Midtone",
                defaultValue: defaults.cardSecondaryColor,
                description: "Secondary gradient or grid zone tint.",
            },
            textColor: {
                type: ControlType.Color,
                title: "Badge Text",
                defaultValue: defaults.textColor,
                description: "Color of badge titles and labels.",
            },
            strapDrop: {
                type: ControlType.Number,
                title: "Strap Length",
                min: 20,
                max: 90,
                step: 2,
                unit: "%",
                defaultValue: defaults.strapDrop,
                description: "How far strap hangs from top edge.",
            },
        },
    },
    physics: {
        type: ControlType.Object,
        title: "Real Physics",
        controls: {
            interactivePhysics: {
                type: ControlType.Boolean,
                title: "Interactive",
                defaultValue: defaults.interactivePhysics,
                description: "Enable coupled pendulum physics.",
            },
            draggableCard: {
                type: ControlType.Boolean,
                title: "Grab & Pull",
                defaultValue: defaults.draggableCard,
                description: "Grab card to pull and swing strap.",
                hidden: (p) => !p.interactivePhysics,
            },
            gravity: {
                type: ControlType.Number,
                title: "Gravity",
                min: 20,
                max: 100,
                step: 2,
                unit: "%",
                defaultValue: defaults.gravity,
                description: "Restoring weight and swing speed.",
            },
            damping: {
                type: ControlType.Number,
                title: "Air Damping",
                min: 15,
                max: 100,
                step: 2,
                unit: "%",
                defaultValue: defaults.damping,
                description: "How smoothly swing settles down.",
            },
            swivelFreedom: {
                type: ControlType.Number,
                title: "Hook Freedom",
                min: 10,
                max: 100,
                step: 2,
                unit: "%",
                defaultValue: defaults.swivelFreedom,
                description: "Secondary tilt freedom at clasp hook.",
            },
            idleSway: {
                type: ControlType.Number,
                title: "Gentle Breeze",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: defaults.idleSway,
                description: "Subtle natural air sway at rest.",
            },
            hoverNudge: {
                type: ControlType.Number,
                title: "Hover Nudge",
                min: 0,
                max: 100,
                step: 5,
                unit: "%",
                defaultValue: defaults.hoverNudge,
                description: "Nudge card when sweeping cursor past.",
            },
        },
    },
    cameraView: {
        type: ControlType.Object,
        title: "Camera & View",
        description:
            "Adjust camera zoom and resting swivel angle.\n\nMore components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            zoom: {
                type: ControlType.Number,
                title: "Camera Zoom",
                min: 60,
                max: 150,
                step: 2,
                unit: "%",
                defaultValue: defaults.zoom,
                description: "Zoom in or out on the hanging badge.",
            },
            restingYaw: {
                type: ControlType.Number,
                title: "Swivel Angle",
                min: -45,
                max: 45,
                step: 1,
                unit: "°",
                defaultValue: defaults.restingYaw,
                description: "Resting horizontal swivel angle.",
            },
            quality: {
                type: ControlType.Number,
                title: "Pixel Ratio",
                min: 1,
                max: 3,
                step: 0.25,
                unit: "×",
                defaultValue: defaults.quality,
                description: "Maximum render pixel density.",
            },
        },
    },
})
