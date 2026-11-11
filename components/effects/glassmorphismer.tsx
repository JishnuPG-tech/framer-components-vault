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


interface GlassProps {
    preset: string
    bgBlur: number
    transparency: number
    saturation: number
    glassColor: string
    radius: number
    borderOptions: boolean
    borderWidth: number
    borderOpacity: number
    borderColor: string
    shadowOptions: boolean
    shadowDepth: number
    shadowColor: string
    diffusion: number
    glowOptions: boolean
    glowIntensity: number
    glowAngle: number
    grain: number
    grainOn: boolean
    liquidGlass: boolean
    ior: number
    bezelWidth: number
    liquidBlur: number
    bezelSoften: number
    dispersionStrength: number
    style?: React.CSSProperties
    credits: boolean
}

const BASE_DEFAULTS: GlassProps = {
    preset: "Custom",
    bgBlur: 32,
    transparency: 8,
    saturation: 140,
    glassColor: "#ffffff",
    radius: 48,
    borderOptions: false,
    borderWidth: 1.5,
    borderOpacity: 55,
    borderColor: "#ffffff",
    shadowOptions: false,
    shadowDepth: 25,
    shadowColor: "#000000",
    diffusion: 15,
    glowOptions: false,
    glowIntensity: 95,
    glowAngle: 315,
    grain: 12,
    grainOn: true,
    liquidGlass: false,
    ior: 1.5,
    bezelWidth: 0.22,
    liquidBlur: 2,
    bezelSoften: 2.5,
    dispersionStrength: 0,
    credits: false,
}

const PRESETS: Record<string, Partial<GlassProps>> = {
    Frosted: {
        bgBlur: 20,
        transparency: 15,
        saturation: 110,
        glassColor: "#ffffff",
        radius: 24,
        glowOptions: true,
        glowIntensity: 45,
        glowAngle: 315,
        shadowOptions: true,
        shadowDepth: 20,
        shadowColor: "#1a1a1a",
        grain: 15,
        grainOn: true,
        borderOptions: true,
        borderColor: "#ffffff",
        borderOpacity: 25,
        borderWidth: 1,
        diffusion: 0,
        liquidGlass: false,
        ior: 1.5,
        bezelWidth: 0.18,
        liquidBlur: 20,
        bezelSoften: 1,
        dispersionStrength: 0,
    },
    Dark: {
        bgBlur: 24,
        transparency: 25,
        saturation: 90,
        glassColor: "#0a0a12",
        radius: 16,
        glowIntensity: 60,
        glowAngle: 225,
        shadowDepth: 32,
        shadowColor: "#000000",
        grain: 18,
        grainOn: true,
        borderColor: "#ffffff",
        borderOpacity: 15,
        borderWidth: 1,
        diffusion: 0,
        liquidGlass: false,
        ior: 1.5,
        bezelWidth: 0.18,
        liquidBlur: 24,
        bezelSoften: 1,
        dispersionStrength: 0,
        glowOptions: true,
        borderOptions: true,
        shadowOptions: true,
    },
    Ice: {
        bgBlur: 45,
        transparency: 8,
        saturation: 140,
        glassColor: "#e0f4ff",
        radius: 32,
        glowIntensity: 85,
        glowAngle: 270,
        shadowDepth: 16,
        shadowColor: "#000000",
        grain: 0,
        grainOn: false,
        borderColor: "#ffffff",
        borderOpacity: 55,
        borderWidth: 1,
        diffusion: 0,
        liquidGlass: false,
        ior: 1.5,
        bezelWidth: 0.18,
        liquidBlur: 45,
        bezelSoften: 1,
        dispersionStrength: 0,
        glowOptions: true,
        borderOptions: true,
        shadowOptions: true,
    },

    Prismatic: {
        bgBlur: 40,
        transparency: 5,
        saturation: 160,
        glassColor: "#ffffff",
        radius: 48,
        glowIntensity: 100,
        glowAngle: 45,
        shadowDepth: 30,
        shadowColor: "#000000",
        grain: 12,
        grainOn: true,
        borderColor: "#ffffff",
        borderOpacity: 60,
        borderWidth: 1.5,
        diffusion: 15,
        glowOptions: true,
        borderOptions: true,
        shadowOptions: true,
    },
}

// ─── Physics ──────────────────────────────────────────────────────────────────

function surfaceHeight(t: number): number {
    return Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)))
}

function refractedDisplacement(d: number, n2: number): number {
    const delta = 0.001
    const h1 = surfaceHeight(Math.max(0, d - delta))
    const h2 = surfaceHeight(Math.min(1, d + delta))
    const derivative = (h2 - h1) / (2 * delta)
    const nx = -derivative
    const ny = 1
    const len = Math.sqrt(nx * nx + ny * ny)
    const nnx = nx / len
    const sinI = Math.abs(nnx)
    const sinT_sq = (1 / n2) ** 2 * sinI * sinI
    if (sinT_sq >= 1) return 0
    const sinT = Math.sqrt(sinT_sq)
    const lateralShift = sinT * Math.sign(nnx) - sinI * Math.sign(nnx)
    return lateralShift * (n2 - 1) * 6
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0,
        g = 0,
        b = 0
    if (h < 60) {
        r = c
        g = x
    } else if (h < 120) {
        r = x
        g = c
    } else if (h < 180) {
        g = c
        b = x
    } else if (h < 240) {
        g = x
        b = c
    } else if (h < 300) {
        r = x
        b = c
    } else {
        r = c
        b = x
    }
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ]
}

function getEdgeInfo(
    px: number,
    py: number,
    w: number,
    h: number,
    radiusPx: number
) {
    const cx = Math.min(Math.max(px, radiusPx), w - radiusPx)
    const cy = Math.min(Math.max(py, radiusPx), h - radiusPx)
    const ddx = px - cx,
        ddy = py - cy
    let distFromEdge: number,
        ox = 0,
        oy = 0
    if (ddx !== 0 || ddy !== 0) {
        const el = Math.sqrt(ddx * ddx + ddy * ddy)
        distFromEdge = radiusPx - el
        ox = -ddx / el
        oy = -ddy / el
    } else {
        const dL = px,
            dR = w - 1 - px,
            dT = py,
            dB = h - 1 - py
        const m = Math.min(dL, dR, dT, dB)
        distFromEdge = m
        if (m === dL) {
            ox = -1
        } else if (m === dR) {
            ox = 1
        } else if (m === dT) {
            oy = -1
        } else {
            oy = 1
        }
    }
    return { distFromEdge, ox, oy }
}

function generateDisplacementMap(
    w: number,
    h: number,
    radiusPx: number,
    bezelFraction: number,
    ior: number
) {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    const imageData = ctx.createImageData(w, h)
    const data = imageData.data
    const SAMPLES = 128
    const magnitudes = Array.from({ length: SAMPLES }, (_, i) =>
        refractedDisplacement(i / (SAMPLES - 1), ior)
    )
    let maxMag = Math.max(...magnitudes.map(Math.abs)) || 1
    const normalised = magnitudes.map((m) => m / maxMag)
    const bezelPx = Math.min(w, h) * bezelFraction
    const maxScale = maxMag * Math.min(w, h) * 0.08

    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const { distFromEdge, ox, oy } = getEdgeInfo(px, py, w, h, radiusPx)
            let r = 128,
                g = 128
            if (distFromEdge >= 0 && distFromEdge < bezelPx) {
                const t = 1 - distFromEdge / bezelPx
                const normMag =
                    normalised[
                        Math.min(Math.round(t * (SAMPLES - 1)), SAMPLES - 1)
                    ]
                r = Math.min(
                    255,
                    Math.max(
                        0,
                        Math.round(
                            128 + (-ox * normMag * maxScale * 127) / maxScale
                        )
                    )
                )
                g = Math.min(
                    255,
                    Math.max(
                        0,
                        Math.round(
                            128 + (-oy * normMag * maxScale * 127) / maxScale
                        )
                    )
                )
            }
            const idx = (py * w + px) * 4
            data[idx] = r
            data[idx + 1] = g
            data[idx + 2] = 128
            data[idx + 3] = 255
        }
    }
    ctx.putImageData(imageData, 0, 0)
    return { canvas, scale: maxScale }
}

function generateAngularHueMap(w: number, h: number, lightAngle: number) {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    const imgData = ctx.createImageData(w, h)
    const d = imgData.data
    const cx = w / 2,
        cy = h / 2
    const hueOffset = lightAngle + 90

    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const nx = (px - cx) / (w / 2),
                ny = (py - cy) / (h / 2)
            const angleDeg =
                ((Math.atan2(ny, nx) * 180) / Math.PI + hueOffset + 360) % 360
            const radialDist = Math.min(1, Math.sqrt(nx * nx + ny * ny))
            const sat = Math.pow(radialDist, 2.0)
            const lit = 0.42 + 0.12 * radialDist
            const [r, g, b] = hslToRgb(angleDeg, sat, lit)
            const idx = (py * w + px) * 4
            d[idx] = r
            d[idx + 1] = g
            d[idx + 2] = b
            d[idx + 3] = 255
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return canvas
}

function generateSpecularMap(
    w: number,
    h: number,
    radiusPx: number,
    bezelWidth: number,
    glowAngle: number,
    glowIntensity: number
) {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    const imgData = ctx.createImageData(w, h)
    const d = imgData.data
    const li = glowIntensity / 100
    const angle = (glowAngle * Math.PI) / 180
    const lx = Math.cos(angle - Math.PI / 2)
    const ly = Math.sin(angle - Math.PI / 2)
    const bezelPx = Math.min(w, h) * bezelWidth

    for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
            const { distFromEdge, ox, oy } = getEdgeInfo(px, py, w, h, radiusPx)
            if (distFromEdge >= 0 && distFromEdge < bezelPx) {
                const t = 1 - distFromEdge / bezelPx
                const dot = Math.max(0, ox * lx + oy * ly)
                const intensity = dot * (1 - t * t) * li
                const idx = (py * w + px) * 4
                d[idx] = 255
                d[idx + 1] = 255
                d[idx + 2] = 255
                d[idx + 3] = Math.min(255, Math.round(intensity * 200))
            }
        }
    }
    ctx.putImageData(imgData, 0, 0)
    return canvas
}

// ─── SVG Filter ───────────────────────────────────────────────────────────────

function LiquidGlassFilter({
    id,
    width,
    height,
    radiusPx,
    bezelWidth,
    ior,
    glowAngle,
    glowIntensity,
    glowOptions,
    bezelSoften,
    dispersionStrength,
    saturation,
    isStatic,
}: {
    id: string
    width: number
    height: number
    radiusPx: number
    bezelWidth: number
    ior: number
    glowAngle: number
    glowIntensity: number
    glowOptions: boolean
    bezelSoften: number
    dispersionStrength: number
    saturation: number
    isStatic: boolean
}) {
    if (isStatic) return null
    const [maps, setMaps] = React.useState({
        mapUrl: "",
        scale: 20,
        specUrl: "",
        hueUrl: "",
    })

    React.useEffect(() => {
        if (width <= 0 || height <= 0) return
        const w = Math.round(width),
            h = Math.round(height)
        const { canvas: dc, scale } = generateDisplacementMap(
            w,
            h,
            radiusPx,
            bezelWidth,
            ior
        )
        const hc = generateAngularHueMap(w, h, glowAngle)
        const sc = generateSpecularMap(
            w,
            h,
            radiusPx,
            bezelWidth,
            glowAngle,
            glowIntensity
        )
        setMaps({
            mapUrl: dc.toDataURL(),
            scale,
            specUrl: glowOptions ? sc.toDataURL() : "",
            hueUrl: hc.toDataURL(),
        })
    }, [
        width,
        height,
        radiusPx,
        bezelWidth,
        ior,
        glowAngle,
        glowIntensity,
        glowOptions,
    ])

    const { mapUrl, scale, specUrl, hueUrl } = maps
    if (!mapUrl) return null
    const dispScale = scale * (dispersionStrength / 100) * 1.6

    return (
        <svg
            style={{
                position: "absolute",
                width: 0,
                height: 0,
                overflow: "hidden",
            }}
        >
            <defs>
                <filter
                    id={`lg-${id}`}
                    x="0"
                    y="0"
                    width={`${width}px`}
                    height={`${height}px`}
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feImage
                        href={mapUrl}
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        result="dispMap"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="dispMap"
                        scale={scale}
                        xChannelSelector="R"
                        yChannelSelector="G"
                        result="refracted"
                    />
                    {specUrl ? (
                        <>
                            <feImage
                                href={specUrl}
                                x={0}
                                y={0}
                                width={width}
                                height={height}
                                result="specRaw"
                            />
                            <feGaussianBlur
                                in="specRaw"
                                stdDeviation={bezelSoften}
                                result="specBlurred"
                            />
                            <feBlend
                                in="refracted"
                                in2="specBlurred"
                                mode="screen"
                                result="withSpec"
                            />
                            <feComposite
                                in="withSpec"
                                in2="SourceGraphic"
                                operator="in"
                                result="clipped"
                            />
                            <feColorMatrix
                                type="saturate"
                                values={String(saturation / 100)}
                            />
                        </>
                    ) : (
                        <>
                            <feComposite
                                in="refracted"
                                in2="SourceGraphic"
                                operator="in"
                                result="clipped"
                            />
                            <feColorMatrix
                                type="saturate"
                                values={String(saturation / 100)}
                            />
                        </>
                    )}
                </filter>
                {dispersionStrength > 0 && hueUrl && (
                    <filter
                        id={`disp-${id}`}
                        x="0"
                        y="0"
                        width={`${width}px`}
                        height={`${height}px`}
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feImage
                            href={hueUrl}
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            result="hueMap"
                        />
                        <feImage
                            href={mapUrl}
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            result="dispVec"
                        />
                        <feDisplacementMap
                            in="hueMap"
                            in2="dispVec"
                            scale={dispScale}
                            xChannelSelector="R"
                            yChannelSelector="G"
                            result="shiftedHue"
                        />
                        <feGaussianBlur
                            in="shiftedHue"
                            stdDeviation={bezelSoften * 1.4}
                            result="softHue"
                        />
                        <feColorMatrix
                            in="softHue"
                            type="saturate"
                            values={String(1.8 + dispersionStrength / 60)}
                            result="saturatedHue"
                        />
                        <feComposite
                            in="saturatedHue"
                            in2="SourceGraphic"
                            operator="in"
                        />
                    </filter>
                )}
            </defs>
        </svg>
    )
}

function colorToRgb(color: string) {
    if (!color || typeof color !== "string") return { r: 0, g: 0, b: 0 }
    if (color.startsWith("#")) {
        const c = color.replace("#", "")
        const f =
            c.length === 3
                ? c
                      .split("")
                      .map((x) => x + x)
                      .join("")
                : c
        return {
            r: parseInt(f.slice(0, 2), 16) || 0,
            g: parseInt(f.slice(2, 4), 16) || 0,
            b: parseInt(f.slice(4, 6), 16) || 0,
        }
    }
    const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m) return { r: +m[1], g: +m[2], b: +m[3] }
    return { r: 0, g: 0, b: 0 }
}

function isChrome() {
    if (typeof navigator === "undefined") return false
    return (
        /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @framerDisableUnlink
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 200
 */

export default function Glassmorphismer(props: GlassProps) {
    const isStatic = useIsStaticRenderer()

    const isCustom = props.preset === "Custom"
    const p: GlassProps = isCustom
        ? props
        : {
              ...BASE_DEFAULTS,
              ...(PRESETS[props.preset] || {}),
              style: props.style,
              preset: props.preset,
              credits: props.credits,
          }

    const {
        bgBlur,
        transparency,
        saturation,
        glassColor,
        radius,
        borderOptions,
        borderWidth,
        borderOpacity,
        borderColor,
        shadowOptions,
        shadowDepth,
        shadowColor,
        diffusion,
        glowOptions,
        glowIntensity,
        glowAngle,
        grain,
        grainOn,
        liquidGlass,
        ior,
        bezelWidth,
        liquidBlur,
        bezelSoften,
        dispersionStrength,
        style,
        credits,
    } = p

    const uid = React.useId().replace(/:/g, "")
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [size, setSize] = React.useState({ w: 320, h: 200 })
    const chrome = React.useMemo(() => isChrome(), [])
    const useLiquid = liquidGlass && chrome && !isStatic
    const useDisp = useLiquid && dispersionStrength > 0

    React.useEffect(() => {
        if (!useLiquid) return
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            for (const e of entries)
                setSize({
                    w: Math.round(e.contentRect.width),
                    h: Math.round(e.contentRect.height),
                })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [useLiquid])

    const rgb = colorToRgb(glassColor)
    const bgColor = `rgba(${rgb.r},${rgb.g},${rgb.b},${transparency / 100})`

    const bRgb = colorToRgb(borderColor)
    const border = borderOptions
        ? `${borderWidth}px solid rgba(${bRgb.r},${bRgb.g},${bRgb.b},${borderOpacity / 100})`
        : "none"

    const sdRgb = colorToRgb(shadowColor)
    const shadowAlpha = (shadowDepth / 100) * 0.45
    const spread = diffusion * 0.5
    const shadows: string[] = []
    if (shadowOptions && shadowDepth > 0) {
        shadows.push(
            `0 ${Math.round(shadowDepth / 2)}px ${Math.round(shadowDepth + spread)}px rgba(${sdRgb.r},${sdRgb.g},${sdRgb.b},${shadowAlpha})`
        )
        shadows.push(
            `0 ${Math.round(shadowDepth)}px ${Math.round(shadowDepth * 2 + spread * 2)}px rgba(${sdRgb.r},${sdRgb.g},${sdRgb.b},${shadowAlpha * 0.3})`
        )
    }

    const highlightAlpha = (glowIntensity / 100) * 0.6
    const bgGradient =
        glowOptions && glowIntensity > 0
            ? `linear-gradient(${glowAngle}deg, rgba(255,255,255,${highlightAlpha}) 0%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.06) 100%)`
            : ""

    const radiusPx = Math.min(radius, size.w / 2, size.h / 2)
    const backdropFilter = useLiquid
        ? `url(#lg-${uid}) blur(${liquidBlur}px)`
        : `blur(${bgBlur}px) saturate(${saturation}%)`

    const gRgb = colorToRgb("#ffffff")
    const grainSvg =
        grainOn && grain > 0
            ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' fill='rgb(${gRgb.r}%2C${gRgb.g}%2C${gRgb.b})' opacity='${(grain / 100).toFixed(2)}'/%3E%3C/svg%3E")`
            : undefined

    const { width: _w, height: _h, ...safeStyle } = (style as any) || {}

    return (
        <div
            ref={containerRef}
            style={{
                ...safeStyle,
                width: _w ?? 320,
                height: _h ?? 200,
                borderRadius: radius,
                border,
                boxShadow: shadows.join(", ") || "none",
                overflow: "hidden",
                position: "relative",
                backdropFilter,
                WebkitBackdropFilter: backdropFilter,
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {useLiquid && size.w > 0 && (
                <LiquidGlassFilter
                    id={uid}
                    width={size.w}
                    height={size.h}
                    radiusPx={radiusPx}
                    bezelWidth={bezelWidth}
                    ior={ior}
                    glowAngle={glowAngle}
                    glowIntensity={glowIntensity}
                    glowOptions={glowOptions}
                    bezelSoften={bezelSoften}
                    dispersionStrength={dispersionStrength}
                    saturation={saturation}
                    isStatic={isStatic}
                />
            )}

            {/* Glass tint + light gradient */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                    backgroundColor: bgColor,
                    backgroundImage: bgGradient || undefined,
                    borderRadius: radius,
                }}
            />

            {/* Spectral dispersion overlay */}
            {useDisp && size.w > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 1,
                        borderRadius: radius,
                        filter: `url(#disp-${uid})`,
                        backgroundColor: "white",
                        mixBlendMode: "screen",
                        opacity: Math.pow(dispersionStrength / 100, 0.7),
                        pointerEvents: "none",
                    }}
                />
            )}

            {/* Grain */}
            {grainSvg && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 2,
                        mixBlendMode: "overlay",
                        opacity: 0.9,
                        backgroundImage: grainSvg,
                    }}
                />
            )}

            {/* Not-Chrome notice */}
            {liquidGlass && !chrome && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 8,
                        left: 0,
                        right: 0,
                        textAlign: "center",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        zIndex: 5,
                        pointerEvents: "none",
                    }}
                >
                    Liquid Glass requires Chrome
                </div>
            )}
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────

addPropertyControls(Glassmorphismer, {
    preset: {
        type: ControlType.Enum,
        title: "Preset",
        options: ["Custom", "Frosted", "Dark", "Ice", "Prismatic"],
        defaultValue: "Frosted",
        description:
            "Choose a style or use Custom to adjust all settings manually.",
    },

    // ── Glass ─────────────────────────────────────────────────────────────────
    bgBlur: {
        type: ControlType.Number,
        title: "Background Blur",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 32,
        group: "Glass",
        description: "Intensity of the frosted background blur effect.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    transparency: {
        type: ControlType.Number,
        title: "Alpha",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 8,
        group: "Glass",
        description: "Surface opacity—how clear or milky the glass looks.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    saturation: {
        type: ControlType.Number,
        title: "Saturation",
        unit: "%",
        min: 0,
        max: 200,
        defaultValue: 140,
        group: "Glass",
        description: "Saturation of the colors behind the glass.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    glassColor: {
        type: ControlType.Color,
        title: "Glass Color",
        defaultValue: "#ffffff",
        group: "Glass",
        description: "The base color tint of the glass surface.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    radius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 500,
        defaultValue: 48,
        group: "Glass",
        description: "Round the container edges.",
        hidden: (p: any) => p.preset !== "Custom",
    },

    // ── Glow ──────────────────────────────────────────────────────────────────
    glowOptions: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: false,
        group: "Glow",
        description: "Enable a subtle light reflection on the surface.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 95,
        group: "Glow",
        description: "Brightness of the surface light gradient.",
        hidden: (p: any) => p.preset !== "Custom" || !p.glowOptions,
    },
    glowAngle: {
        type: ControlType.Number,
        title: "Glow Angle",
        unit: "°",
        min: 0,
        max: 360,
        defaultValue: 315,
        group: "Glow",
        description: "Angle of the light source hitting the glass.",
        hidden: (p: any) => p.preset !== "Custom" || !p.glowOptions,
    },

    // ── Border ────────────────────────────────────────────────────────────────
    borderOptions: {
        type: ControlType.Boolean,
        title: "Border",
        defaultValue: false,
        group: "Border",
        description: "Enable a sharp edge border for detail.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    borderWidth: {
        type: ControlType.Number,
        title: "Border Width",
        min: 0,
        max: 20,
        step: 0.5,
        defaultValue: 1.5,
        group: "Border",
        description: "Thickness of the edge stroke.",
        hidden: (p: any) => p.preset !== "Custom" || !p.borderOptions,
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border Color",
        defaultValue: "#ffffff",
        group: "Border",
        description: "The color of the edge stroke.",
        hidden: (p: any) => p.preset !== "Custom" || !p.borderOptions,
    },
    borderOpacity: {
        type: ControlType.Number,
        title: "Border Opacity",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 55,
        group: "Border",
        description: "Visibility of the edge stroke.",
        hidden: (p: any) => p.preset !== "Custom" || !p.borderOptions,
    },

    // ── Shadow ────────────────────────────────────────────────────────────────
    shadowOptions: {
        type: ControlType.Boolean,
        title: "Shadow",
        defaultValue: false,
        group: "Shadow",
        description: "Enable a multi-layered drop shadow.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    shadowDepth: {
        type: ControlType.Number,
        title: "Shadow Depth",
        min: 0,
        max: 200,
        defaultValue: 25,
        group: "Shadow",
        description: "Distance of the glass from the background.",
        hidden: (p: any) => p.preset !== "Custom" || !p.shadowOptions,
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
        group: "Shadow",
        description: "Color of the shadows cast by the glass.",
        hidden: (p: any) => p.preset !== "Custom" || !p.shadowOptions,
    },
    diffusion: {
        type: ControlType.Number,
        title: "Shadow Spread",
        min: 0,
        max: 200,
        defaultValue: 15,
        group: "Shadow",
        description: "Softness and reach of the shadows.",
        hidden: (p: any) => p.preset !== "Custom" || !p.shadowOptions,
    },

    // ── Texture ───────────────────────────────────────────────────────────────
    grainOn: {
        type: ControlType.Boolean,
        title: "Grain",
        defaultValue: true,
        group: "Texture",
        description: "Add a subtle film grain texture to the glass.",
        hidden: (p: any) => p.preset !== "Custom",
    },
    grain: {
        type: ControlType.Number,
        title: "Grain Amount",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 12,
        group: "Texture",
        description: "Intensity of the grain pattern.",
        hidden: (p: any) => p.preset !== "Custom" || !p.grainOn,
    },

    // ── Liquid Glass ──────────────────────────────────────────────────────────
    liquidGlass: {
        type: ControlType.Boolean,
        title: "liquid Glass",
        defaultValue: false,
        group: "Liquid Glass",
        description: "Realistic physics-based refraction (Best in Chrome).",
        hidden: (p: any) => p.preset !== "Custom",
    },
    ior: {
        type: ControlType.Number,
        title: "Refraction (IOR)",
        min: 1.0,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.5,
        group: "Liquid Glass",
        description: "Bending of light. 1 = Standard Glass.",
        hidden: (p: any) => p.preset !== "Custom" || !p.liquidGlass,
    },
    bezelWidth: {
        type: ControlType.Number,
        title: "Edge Width",
        min: 0.05,
        max: 0.5,
        step: 0.01,
        defaultValue: 0.22,
        group: "Liquid Glass",
        description: "Thickness of the refractive curved edge.",
        hidden: (p: any) => p.preset !== "Custom" || !p.liquidGlass,
    },
    liquidBlur: {
        type: ControlType.Number,
        title: "Blur",
        min: 0,
        max: 50,
        defaultValue: 2,
        group: "Liquid Glass",
        description: "Distortion smoothness of the backdrop.",
        hidden: (p: any) => p.preset !== "Custom" || !p.liquidGlass,
    },
    bezelSoften: {
        type: ControlType.Number,
        title: "Edge Soften",
        min: 0,
        max: 10,
        step: 0.1,
        defaultValue: 2.5,
        group: "Liquid Glass",
        description: "Softness of the light hitting the refractive edge.",
        hidden: (p: any) => p.preset !== "Custom" || !p.liquidGlass,
    },
    dispersionStrength: {
        type: ControlType.Number,
        title: "Dispersion",
        unit: "%",
        min: 0,
        max: 100,
        defaultValue: 0,
        group: "Liquid Glass",
        description: "Prismatic rainbow highlights in refractive zones.",
        hidden: (p: any) => p.preset !== "Custom" || !p.liquidGlass,
    },
    credits: {
        type: ControlType.Boolean,
        defaultValue: false,
        title: "Show Credits",
        description:
            "[Explore more components](https://dub.sh/explore-new)\n\n[Made by Sillyweb](https://dub.sh/Made-by-sillyweb)",
    },
})
