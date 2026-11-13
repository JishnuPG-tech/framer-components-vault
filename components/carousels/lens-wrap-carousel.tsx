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
// TYPES & INTERFACES
// ============================================================================
interface CardItem {
    mediaType?: "auto" | "image" | "video" | "preset"
    image?: string | { src?: string }
    video?: string
    preset?: "1" | "2" | "3" | "4" | "5" | "6"
}

interface CarouselProps {
    livePreview?: boolean
    cards?: CardItem[]
    carousel?: {
        autoPlay?: boolean
        speed?: number
        direction?: "left" | "right"
        cardScale?: number
        cardAspect?: number
        cardGap?: number
        depthCurve?: number
    }
    distortion?: {
        distortionIntensity?: number
        edgeZone?: number
        verticalFlare?: number
        horizontalSmear?: number
        chromaticAberration?: number
        refractionRipple?: number
        edgeGlow?: number
    }
    appearance?: {
        backgroundColor?: string
        transparentBg?: boolean
        cornerRadius?: number
        cardShadow?: number
    }
    interaction?: {
        enableDrag?: boolean
        dragSensitivity?: number
        damping?: number
        snapToCard?: boolean
    }
    style?: React.CSSProperties
    [key: string]: any
}

// ============================================================================
// HELPER: EXTRACT MEDIA URL FROM FRAMER PROP
// ============================================================================
function resolveMediaUrl(input: any): string {
    if (!input) return ""
    if (typeof input === "string") return input.trim()
    if (typeof input === "object" && typeof input.src === "string") {
        return input.src.trim()
    }
    return ""
}

// ============================================================================
// STUDIO-GRADE PROCEDURAL DEFAULT CARDS (1200x1480 HIGH-DPI)
// ============================================================================
function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
}

function drawPaginationBars(
    ctx: CanvasRenderingContext2D,
    W: number,
    y: number,
    lightMode: boolean
) {
    const barW = 84
    const barH = 6.5
    const gap = 20
    const count = 5
    const totalW = count * barW + (count - 1) * gap
    const startX = (W - totalW) * 0.5

    for (let i = 0; i < count; i++) {
        const bx = startX + i * (barW + gap)
        drawRoundedRect(ctx, bx, y, barW, barH, barH / 2)
        if (i === 3) {
            ctx.fillStyle = lightMode ? "#FFFFFF" : "#222630"
        } else {
            ctx.fillStyle = lightMode
                ? "rgba(255, 255, 255, 0.30)"
                : "rgba(34, 38, 48, 0.10)"
        }
        ctx.fill()
    }
}

function drawPillButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    icon: "chevron" | "plus",
    frosted: boolean
) {
    ctx.save()
    if (!frosted) {
        ctx.shadowColor = "rgba(20, 30, 60, 0.05)"
        ctx.shadowBlur = 22
        ctx.shadowOffsetY = 6
    }
    drawRoundedRect(ctx, x, y, w, h, h / 2)
    ctx.fillStyle = frosted
        ? "rgba(255, 255, 255, 0.22)"
        : "rgba(255, 255, 255, 0.96)"
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.font =
        "500 29px -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif"
    ctx.fillStyle = frosted ? "rgba(255, 255, 255, 0.96)" : "#262A34"
    ctx.textBaseline = "middle"
    ctx.textAlign = "left"
    const textX = x + 38
    const centerY = y + h * 0.51
    ctx.fillText(label, textX, centerY)

    const strokeColor = frosted ? "rgba(255, 255, 255, 0.96)" : "#262A34"
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 3.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    if (icon === "chevron") {
        const cx = x + w - 44
        const cy = centerY - 2
        ctx.beginPath()
        ctx.moveTo(cx - 9, cy - 4)
        ctx.lineTo(cx, cy + 5)
        ctx.lineTo(cx + 9, cy - 4)
        ctx.stroke()
    } else {
        const cx = x + w - 42
        const cy = centerY
        ctx.beginPath()
        ctx.moveTo(cx - 8, cy)
        ctx.lineTo(cx + 8, cy)
        ctx.moveTo(cx, cy - 8)
        ctx.lineTo(cx, cy + 8)
        ctx.stroke()
    }
    ctx.restore()
}

function createPresetCardTexture(presetId: number): THREE.CanvasTexture {
    const W = 1200
    const H = 1480
    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")!

    const fontStack =
        "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', sans-serif"

    if (presetId === 1) {
        // ====================================================================
        // CARD 1: "Success Rate" (82% - Luminous Peach / Sage Green / Aqua)
        // ====================================================================
        ctx.fillStyle = "#FCFBF9"
        ctx.fillRect(0, 0, W, H)

        // Warm pastel apricot/peach outer aura
        const gPeach = ctx.createRadialGradient(
            W * 0.5,
            H * 0.5,
            W * 0.1,
            W * 0.5,
            H * 0.5,
            W * 0.66
        )
        gPeach.addColorStop(0.0, "#FBD3B9")
        gPeach.addColorStop(0.55, "#FCE0CC")
        gPeach.addColorStop(0.84, "#FDEEE2")
        gPeach.addColorStop(1.0, "rgba(252, 251, 249, 0)")
        ctx.fillStyle = gPeach
        ctx.fillRect(0, 0, W, H)

        // Soft pastel lime/sage green middle
        const gGreen = ctx.createRadialGradient(
            W * 0.47,
            H * 0.51,
            W * 0.05,
            W * 0.47,
            H * 0.51,
            W * 0.46
        )
        gGreen.addColorStop(0.0, "#8FD982")
        gGreen.addColorStop(0.55, "#ACE296")
        gGreen.addColorStop(0.84, "rgba(192, 232, 168, 0.42)")
        gGreen.addColorStop(1.0, "rgba(192, 232, 168, 0)")
        ctx.fillStyle = gGreen
        ctx.fillRect(0, 0, W, H)

        // Vibrant aqua/turquoise core
        const gTeal = ctx.createRadialGradient(
            W * 0.53,
            H * 0.53,
            W * 0.02,
            W * 0.53,
            H * 0.53,
            W * 0.31
        )
        gTeal.addColorStop(0.0, "#32BAC8")
        gTeal.addColorStop(0.52, "#54CBD2")
        gTeal.addColorStop(0.85, "rgba(95, 212, 208, 0.30)")
        gTeal.addColorStop(1.0, "rgba(95, 212, 208, 0)")
        ctx.fillStyle = gTeal
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 39px ${fontStack}`
        ctx.fillStyle = "#2B2F38"
        ctx.textAlign = "left"
        ctx.fillText("Success Rate", 86, 112)

        drawPillButton(ctx, W - 294, 62, 214, 70, "Daily", "chevron", false)

        // Metric "82%"
        ctx.textAlign = "center"
        ctx.font = `400 144px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("82%", 685, 472)

        ctx.font = `400 34px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.90)"
        ctx.fillText("Average weekly", 685, 532)

        // Vertical highlight column under peak
        const peakX = 656
        const peakY = 602
        const gCol = ctx.createLinearGradient(0, peakY, 0, 1120)
        gCol.addColorStop(0.0, "rgba(255, 255, 255, 0.38)")
        gCol.addColorStop(0.65, "rgba(255, 255, 255, 0.09)")
        gCol.addColorStop(1.0, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = gCol
        ctx.beginPath()
        ctx.moveTo(504, 865)
        ctx.lineTo(520, 695)
        ctx.lineTo(568, 676)
        ctx.lineTo(peakX, peakY)
        ctx.lineTo(peakX, 1120)
        ctx.lineTo(504, 1120)
        ctx.closePath()
        ctx.fill()

        // Solid white line chart
        ctx.save()
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 5.5
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(0, 830)
        ctx.lineTo(298, 830)
        ctx.lineTo(364, 865)
        ctx.lineTo(482, 865)
        ctx.lineTo(520, 695)
        ctx.lineTo(568, 676)
        ctx.lineTo(peakX, peakY)
        ctx.stroke()

        // Dashed white projection curve
        ctx.setLineDash([8, 13])
        ctx.strokeStyle = "rgba(255, 255, 255, 0.86)"
        ctx.lineWidth = 4.5
        ctx.beginPath()
        ctx.moveTo(peakX, peakY)
        ctx.bezierCurveTo(745, 608, 830, 725, 918, 845)
        ctx.stroke()
        ctx.restore()

        // Glowing node at peak
        ctx.save()
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)"
        ctx.shadowBlur = 22
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(peakX, peakY, 19, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Bottom remarks text
        ctx.textAlign = "center"
        ctx.font = `400 31px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.86)"
        ctx.fillText("Weekly growth report updated remarks:", W * 0.5, 1198)
        ctx.fillText("Stable and healthy.", W * 0.5, 1244)

        drawPaginationBars(ctx, W, 1388, false)
    } else if (presetId === 2) {
        // ====================================================================
        // CARD 2: "B2.Score" (853 - Pastel Pink & Azure Orb with White Orbit)
        // ====================================================================
        ctx.fillStyle = "#FAFBFD"
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 39px ${fontStack}`
        ctx.fillStyle = "#262A34"
        ctx.textAlign = "left"
        ctx.fillText("B2.Score", 86, 112)

        drawPillButton(ctx, W - 308, 62, 228, 70, "Weekly", "chevron", false)

        const cx = W * 0.5
        const cy = 622

        // Outer soft pastel rose-pink aura
        const gPink = ctx.createRadialGradient(cx, cy, 85, cx, cy, 315)
        gPink.addColorStop(0.0, "#FF94BE")
        gPink.addColorStop(0.56, "#FFB2D0")
        gPink.addColorStop(0.82, "rgba(255, 205, 225, 0.48)")
        gPink.addColorStop(1.0, "rgba(250, 251, 253, 0)")
        ctx.fillStyle = gPink
        ctx.beginPath()
        ctx.arc(cx, cy, 325, 0, Math.PI * 2)
        ctx.fill()

        // Inner luminous cobalt/azure core
        const gBlue = ctx.createRadialGradient(
            cx - 18,
            cy - 18,
            12,
            cx,
            cy,
            224
        )
        gBlue.addColorStop(0.0, "#2E6FF2")
        gBlue.addColorStop(0.54, "#4C8EFF")
        gBlue.addColorStop(0.82, "rgba(115, 178, 255, 0.48)")
        gBlue.addColorStop(1.0, "rgba(115, 178, 255, 0)")
        ctx.fillStyle = gBlue
        ctx.beginPath()
        ctx.arc(cx, cy, 232, 0, Math.PI * 2)
        ctx.fill()

        // Tilted white orbital ellipse
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate((-34 * Math.PI) / 180)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)"
        ctx.lineWidth = 6
        ctx.shadowColor = "rgba(255, 255, 255, 0.75)"
        ctx.shadowBlur = 16
        ctx.beginPath()
        ctx.ellipse(0, 0, 342, 156, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        // Center score "853"
        ctx.textAlign = "center"
        ctx.font = `400 148px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("853", cx, cy + 32)

        ctx.font = `400 30px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)"
        ctx.fillText("Score: Great (25+)", cx, cy + 90)

        // Bottom white rounded card box
        ctx.save()
        ctx.shadowColor = "rgba(20, 30, 60, 0.045)"
        ctx.shadowBlur = 34
        ctx.shadowOffsetY = 12
        drawRoundedRect(ctx, 76, 1045, W - 152, 256, 42)
        ctx.fillStyle = "#FFFFFF"
        ctx.fill()
        ctx.restore()

        ctx.textAlign = "center"
        ctx.font = `400 33px ${fontStack}`
        ctx.fillStyle = "#323742"
        ctx.fillText("Expect your revenue to rise and shine", cx, 1160)
        ctx.fillText("before this month closes.", cx, 1208)

        drawPaginationBars(ctx, W, 1388, false)
    } else if (presetId === 3) {
        // ====================================================================
        // CARD 3: "Growth Insights" (75% - Luminous Lavender & Royal Blue)
        // ====================================================================
        ctx.fillStyle = "#F8F6FF"
        ctx.fillRect(0, 0, W, H)

        // Soft lavender/violet outer aura
        const gOuter = ctx.createRadialGradient(
            W * 0.5,
            H * 0.48,
            W * 0.08,
            W * 0.5,
            H * 0.5,
            W * 0.68
        )
        gOuter.addColorStop(0.0, "#8B72FF")
        gOuter.addColorStop(0.54, "#B59AFF")
        gOuter.addColorStop(0.84, "#E6DAFF")
        gOuter.addColorStop(1.0, "#FAF8FF")
        ctx.fillStyle = gOuter
        ctx.fillRect(0, 0, W, H)

        // Deep electric royal blue center
        const gCore = ctx.createRadialGradient(
            W * 0.5,
            H * 0.56,
            W * 0.04,
            W * 0.5,
            H * 0.56,
            W * 0.48
        )
        gCore.addColorStop(0.0, "#2148EC")
        gCore.addColorStop(0.54, "#355CF4")
        gCore.addColorStop(0.85, "rgba(85, 108, 248, 0.36)")
        gCore.addColorStop(1.0, "rgba(85, 108, 248, 0)")
        ctx.fillStyle = gCore
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 39px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)"
        ctx.textAlign = "left"
        ctx.fillText("Growth Insights", 86, 112)

        drawPillButton(ctx, W - 308, 62, 228, 70, "Weekly", "chevron", true)

        // Center metric "75%"
        const cx = W * 0.5
        ctx.textAlign = "center"
        ctx.font = `400 30px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.84)"
        ctx.fillText("Revenue Growth", cx, 272)

        ctx.font = `400 140px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("75%", cx - 12, 402)

        ctx.font = `400 48px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
        ctx.fillText("↗", cx + 148, 336)

        // White glowing dot under 75%
        ctx.fillStyle = "#FFFFFF"
        ctx.beginPath()
        ctx.arc(568, 468, 10, 0, Math.PI * 2)
        ctx.fill()

        // Angular chart with 3D prism curtain fill
        const x1 = 325,
            y1 = 694
        const x2 = 568,
            y2 = 578
        const x3 = 864,
            y3 = 578
        const bottomY = 1075

        const gLeft = ctx.createLinearGradient(0, y2, 0, bottomY)
        gLeft.addColorStop(0.0, "rgba(190, 160, 255, 0.38)")
        gLeft.addColorStop(0.75, "rgba(55, 88, 240, 0.12)")
        gLeft.addColorStop(1.0, "rgba(55, 88, 240, 0)")
        ctx.fillStyle = gLeft
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x2, bottomY)
        ctx.lineTo(x1, bottomY)
        ctx.closePath()
        ctx.fill()

        const gRight = ctx.createLinearGradient(0, y2, 0, bottomY)
        gRight.addColorStop(0.0, "rgba(222, 195, 255, 0.48)")
        gRight.addColorStop(0.75, "rgba(75, 105, 245, 0.16)")
        gRight.addColorStop(1.0, "rgba(75, 105, 245, 0)")
        ctx.fillStyle = gRight
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x3, y3)
        ctx.lineTo(x3, bottomY)
        ctx.lineTo(x2, bottomY)
        ctx.closePath()
        ctx.fill()

        const gRidge = ctx.createLinearGradient(0, y2, 0, bottomY)
        gRidge.addColorStop(0.0, "rgba(255, 255, 255, 0.42)")
        gRidge.addColorStop(1.0, "rgba(255, 255, 255, 0)")
        ctx.strokeStyle = gRidge
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(x2, bottomY)
        ctx.stroke()

        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 6.5
        ctx.lineJoin = "round"
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineTo(x3, y3)
        ctx.stroke()

        // Footer text
        ctx.textAlign = "center"
        ctx.font = `400 32px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.90)"
        ctx.fillText("Expect your revenue to rise and shine", cx, 1198)
        ctx.fillText("before this month closes.", cx, 1244)

        drawPaginationBars(ctx, W, 1388, true)
    } else if (presetId === 4) {
        // ====================================================================
        // CARD 4: "Measure" (93 - Stippled Dotted Halftone Ring & Orchid Orb)
        // ====================================================================
        ctx.fillStyle = "#FAFBFD"
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 39px ${fontStack}`
        ctx.fillStyle = "#262A34"
        ctx.textAlign = "left"
        ctx.fillText("Measure", 86, 112)

        drawPillButton(ctx, W - 308, 62, 228, 70, "Weekly", "chevron", false)

        const cx = W * 0.5
        const cy = 605

        // Outer soft pink-peach aura
        const gOuter = ctx.createRadialGradient(cx, cy, 100, cx, cy, 355)
        gOuter.addColorStop(0.0, "#EA84FF")
        gOuter.addColorStop(0.52, "#FFA8CA")
        gOuter.addColorStop(0.78, "#FFD8E5")
        gOuter.addColorStop(1.0, "rgba(250, 251, 253, 0)")
        ctx.fillStyle = gOuter
        ctx.beginPath()
        ctx.arc(cx, cy, 360, 0, Math.PI * 2)
        ctx.fill()

        // Inner violet-orchid core
        const gInner = ctx.createRadialGradient(cx, cy, 12, cx, cy, 228)
        gInner.addColorStop(0.0, "#A958EE")
        gInner.addColorStop(0.6, "#D06EFF")
        gInner.addColorStop(1.0, "rgba(220, 125, 255, 0)")
        ctx.fillStyle = gInner
        ctx.beginPath()
        ctx.arc(cx, cy, 235, 0, Math.PI * 2)
        ctx.fill()

        // Stippled white particle dot rings
        const ringRadii = [212, 230, 248, 266, 285]
        const ringCounts = [46, 54, 60, 66, 62]
        for (let rIdx = 0; rIdx < ringRadii.length; rIdx++) {
            const rad = ringRadii[rIdx]
            const cnt = ringCounts[rIdx]
            for (let i = 0; i < cnt; i++) {
                const angle =
                    (i / cnt) * Math.PI * 2 +
                    rIdx * 0.37 +
                    Math.sin(i * 1.7) * 0.02
                const jitterR = rad + Math.cos(i * 2.3 + rIdx) * 4.0
                const px = cx + Math.cos(angle) * jitterR
                const py = cy + Math.sin(angle) * jitterR

                const wave =
                    0.5 +
                    0.5 *
                        Math.sin(angle * 3.0 + rIdx * 0.8) *
                        Math.cos(angle * 2.0)
                const dotRadius =
                    (3.2 + wave * 6.0) * (1.0 - Math.abs(rIdx - 1.8) * 0.18)
                const alpha = 0.58 + 0.4 * wave

                ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
                ctx.beginPath()
                ctx.arc(px, py, Math.max(2.2, dotRadius), 0, Math.PI * 2)
                ctx.fill()
            }
        }

        // Center metric "93"
        ctx.textAlign = "center"
        ctx.font = `400 140px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("93", cx, cy + 26)

        ctx.font = `400 30px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.86)"
        ctx.fillText("out of 100", cx, cy + 86)

        // "Withings +" pill badge
        drawPillButton(ctx, cx - 132, 1040, 264, 68, "Withings", "plus", false)

        // Footer text
        ctx.textAlign = "center"
        ctx.font = `400 31px ${fontStack}`
        ctx.fillStyle = "#7E8492"
        ctx.fillText("Amazing! Your system growth rate improvement", cx, 1196)
        ctx.fillText("score has increased by 5 points", cx, 1242)

        drawPaginationBars(ctx, W, 1388, false)
    } else if (presetId === 5) {
        // ====================================================================
        // CARD 5: "Operation Performance" (25 - Azure Gradient & Ruler Scale)
        // ====================================================================
        const gBg = ctx.createLinearGradient(0, 0, 0, H)
        gBg.addColorStop(0.0, "#6E85FA")
        gBg.addColorStop(0.28, "#4767F2")
        gBg.addColorStop(0.58, "#829CFF")
        gBg.addColorStop(0.84, "#D0DBFF")
        gBg.addColorStop(1.0, "#F7F9FD")
        ctx.fillStyle = gBg
        ctx.fillRect(0, 0, W, H)

        // Luminous cobalt glow at upper center
        const gTop = ctx.createRadialGradient(
            W * 0.52,
            H * 0.25,
            24,
            W * 0.52,
            H * 0.25,
            W * 0.52
        )
        gTop.addColorStop(0.0, "#2C50EC")
        gTop.addColorStop(0.6, "rgba(55, 88, 240, 0.45)")
        gTop.addColorStop(1.0, "rgba(55, 88, 240, 0)")
        ctx.fillStyle = gTop
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 37px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)"
        ctx.textAlign = "left"
        ctx.fillText("Operation Performance", 86, 112)

        drawPillButton(ctx, W - 308, 62, 228, 70, "Create", "plus", true)

        // Left-aligned metric "25 ↗"
        ctx.textAlign = "left"
        ctx.font = `400 160px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("25", 86, 480)

        ctx.font = `400 50px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
        ctx.fillText("↗", 282, 388)

        // Horizontal Ruler Tick Scale
        const rulerLeft = 86
        const rulerRight = W - 86
        const rulerW = rulerRight - rulerLeft
        const tickTop = 622
        const totalTicks = 48

        for (let i = 0; i <= totalTicks; i++) {
            const tx = rulerLeft + (i / totalTicks) * rulerW
            const isMajor = i % 6 === 0
            const tickLen = isMajor ? 65 : 35
            ctx.strokeStyle = isMajor
                ? "rgba(255, 255, 255, 0.56)"
                : "rgba(255, 255, 255, 0.32)"
            ctx.lineWidth = 2.8
            ctx.beginPath()
            ctx.moveTo(tx, tickTop)
            ctx.lineTo(tx, tickTop + tickLen)
            ctx.stroke()
        }

        // Active glowing indicator bar at ~34%
        const activeX = rulerLeft + 0.34 * rulerW
        const gGlow = ctx.createRadialGradient(
            activeX,
            tickTop + 76,
            5,
            activeX,
            tickTop + 76,
            112
        )
        gGlow.addColorStop(0.0, "rgba(255, 255, 255, 0.70)")
        gGlow.addColorStop(1.0, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = gGlow
        ctx.beginPath()
        ctx.arc(activeX, tickTop + 76, 112, 0, Math.PI * 2)
        ctx.fill()

        ctx.save()
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 6.5
        ctx.lineCap = "round"
        ctx.shadowColor = "rgba(255, 255, 255, 0.92)"
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.moveTo(activeX, tickTop + 2)
        ctx.lineTo(activeX, tickTop + 154)
        ctx.stroke()
        ctx.restore()

        // Scale numbers 0, 50, 100
        ctx.font = `400 27px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.80)"
        ctx.textAlign = "left"
        ctx.fillText("0", rulerLeft, tickTop + 196)
        ctx.textAlign = "center"
        ctx.fillText("50", W * 0.5, tickTop + 196)
        ctx.textAlign = "right"
        ctx.fillText("100", rulerRight, tickTop + 196)

        // Footer text
        ctx.textAlign = "center"
        ctx.font = `400 32px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
        ctx.fillText("Protect the next 25 minutes of your", W * 0.5, 1165)
        ctx.fillText("highest value task.", W * 0.5, 1212)

        drawPaginationBars(ctx, W, 1388, false)
    } else {
        // ====================================================================
        // CARD 6: "Conversion" (250% - Pastel Violet/Pink Aurora & Wave Curve)
        // ====================================================================
        ctx.fillStyle = "#FAFBFD"
        ctx.fillRect(0, 0, W, H)

        // Top violet-magenta-pink aurora dome
        const gDome = ctx.createRadialGradient(
            W * 0.5,
            H * 0.25,
            35,
            W * 0.5,
            H * 0.34,
            W * 0.62
        )
        gDome.addColorStop(0.0, "#9768FA")
        gDome.addColorStop(0.42, "#E358F4")
        gDome.addColorStop(0.72, "#F882C2")
        gDome.addColorStop(0.9, "#FCD8EC")
        gDome.addColorStop(1.0, "rgba(250, 251, 253, 0)")
        ctx.fillStyle = gDome
        ctx.fillRect(0, 0, W, H)

        // Header
        ctx.font = `500 39px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)"
        ctx.textAlign = "left"
        ctx.fillText("Conversion", 86, 112)

        drawPillButton(ctx, W - 308, 62, 228, 70, "Weekly", "chevron", true)

        // Center metric "250%"
        const cx = W * 0.5
        ctx.textAlign = "center"
        ctx.font = `400 30px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.86)"
        ctx.fillText("Conversion Rate", cx, 276)

        ctx.font = `400 140px ${fontStack}`
        ctx.fillStyle = "#FFFFFF"
        ctx.fillText("250%", cx - 10, 406)

        ctx.font = `400 48px ${fontStack}`
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
        ctx.fillText("↗", cx + 188, 340)

        // Smooth wave curve
        const crestX = 696
        const crestY = 550
        ctx.save()
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 6.5
        ctx.lineCap = "round"
        ctx.shadowColor = "rgba(255, 255, 255, 0.88)"
        ctx.shadowBlur = 22
        ctx.beginPath()
        ctx.moveTo(164, 718)
        ctx.bezierCurveTo(292, 718, 356, 758, 456, 742)
        ctx.bezierCurveTo(555, 726, 612, crestY, crestX, crestY)
        ctx.bezierCurveTo(780, crestY, 870, 718, 1032, 722)
        ctx.stroke()
        ctx.restore()

        // 3D glossy sphere node at crest
        const gSphere = ctx.createRadialGradient(
            crestX - 9,
            crestY - 9,
            4,
            crestX,
            crestY,
            28
        )
        gSphere.addColorStop(0.0, "#FFFFFF")
        gSphere.addColorStop(0.6, "#F8D8FE")
        gSphere.addColorStop(1.0, "#E056F2")
        ctx.save()
        ctx.shadowColor = "rgba(180, 40, 140, 0.32)"
        ctx.shadowBlur = 18
        ctx.shadowOffsetY = 7
        ctx.fillStyle = gSphere
        ctx.beginPath()
        ctx.arc(crestX, crestY, 27, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Bottom white rounded card box
        ctx.save()
        ctx.shadowColor = "rgba(30, 20, 60, 0.05)"
        ctx.shadowBlur = 36
        ctx.shadowOffsetY = 14
        drawRoundedRect(ctx, 98, 978, W - 196, 270, 52)
        ctx.fillStyle = "#FFFFFF"
        ctx.fill()
        ctx.restore()

        ctx.textAlign = "left"
        ctx.font = `400 33px ${fontStack}`
        ctx.fillStyle = "#2C303A"
        ctx.fillText("Conversions set to", 192, 1098)
        ctx.fillText("rise this month.", 192, 1146)

        // Plus icon on right side of bottom box
        const plusX = W - 220
        const plusY = 1116
        ctx.strokeStyle = "#2C303A"
        ctx.lineWidth = 3.5
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(plusX - 11, plusY)
        ctx.lineTo(plusX + 11, plusY)
        ctx.moveTo(plusX, plusY - 11)
        ctx.lineTo(plusX, plusY + 11)
        ctx.stroke()

        drawPaginationBars(ctx, W, 1388, false)
    }

    const texture = new THREE.CanvasTexture(canvas)
    // Keep NoColorSpace so custom ShaderMaterial reads exact 1:1 sRGB values without gamma darkening
    texture.colorSpace = THREE.NoColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
    return texture
}

// ============================================================================
// GLSL SHADERS: 3D CARD PASS + STUDIO LIQUID-GLASS LENS POST-PROCESSING
// ============================================================================

const CARD_VERTEX_SHADER = `
uniform float uCurveDepth;
uniform float uViewportHalfWidth;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    float nx = worldPos.x / max(0.001, uViewportHalfWidth);
    // Gentle 3D surface curvature across the card mesh
    worldPos.z -= (nx * nx) * 0.18 * uCurveDepth;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const CARD_FRAGMENT_SHADER = `
precision highp float;
uniform sampler2D uTexture;
uniform float uMediaAspect;
uniform float uCardAspect;
uniform float uCornerRadius;
varying vec2 vUv;

void main() {
    // Aspect-fill (object-fit: cover) UV calculation
    vec2 coverUv = vUv - 0.5;
    if (uMediaAspect > uCardAspect) {
        coverUv.x *= uCardAspect / max(0.0001, uMediaAspect);
    } else {
        coverUv.y *= uMediaAspect / max(0.0001, uCardAspect);
    }
    coverUv += 0.5;

    vec4 texColor = texture2D(uTexture, clamp(coverUv, 0.001, 0.999));

    // Rounded Rectangle SDF in aspect-corrected space
    vec2 halfSize = vec2(0.5, 0.5 / max(0.001, uCardAspect));
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.0 / max(0.001, uCardAspect));
    float r = clamp(uCornerRadius, 0.0, min(halfSize.x, halfSize.y) - 0.001);
    vec2 q = abs(p) - (halfSize - vec2(r));
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    float aa = 0.003;
    float alpha = 1.0 - smoothstep(-aa, aa, dist);
    if (alpha <= 0.001) discard;

    // Delicate specular inner rim highlight on card border
    float rim = smoothstep(-aa * 3.5, -aa * 0.5, dist) * (1.0 - smoothstep(-aa * 0.5, aa, dist));
    vec3 finalRgb = mix(texColor.rgb, vec3(1.0), rim * 0.45);

    gl_FragColor = vec4(finalRgb, texColor.a * alpha);
}
`

const SHADOW_FRAGMENT_SHADER = `
precision highp float;
uniform float uCardAspect;
uniform float uCornerRadius;
uniform float uShadowStrength;
varying vec2 vUv;

void main() {
    vec2 halfSize = vec2(0.44, 0.44 / max(0.001, uCardAspect));
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.0 / max(0.001, uCardAspect));
    float r = clamp(uCornerRadius, 0.0, min(halfSize.x, halfSize.y) - 0.001);
    vec2 q = abs(p) - (halfSize - vec2(r));
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;

    float shadow = (1.0 - smoothstep(-0.02, 0.08, dist)) * 0.048 * uShadowStrength;
    if (shadow <= 0.001) discard;

    gl_FragColor = vec4(0.52, 0.56, 0.64, shadow);
}
`

const POST_VERTEX_SHADER = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const POST_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSceneTex;
uniform vec3 uBgColor;
uniform float uTransparentBg;
uniform float uDistortion;
uniform float uEdgeZone;
uniform float uVerticalFlare;
uniform float uHorizontalSmear;
uniform float uChromatic;
uniform float uRefractionRipple;
uniform float uEdgeGlow;
uniform float uMaxTargetAx;

varying vec2 vUv;

// Smooth 3-channel spectral dispersion weight
vec3 spectralWeight(float u) {
    vec3 w = vec3(
        exp(-pow((u - 0.18) / 0.28, 2.0)),
        exp(-pow((u - 0.50) / 0.28, 2.0)),
        exp(-pow((u - 0.82) / 0.28, 2.0))
    );
    return max(w, vec3(0.0001));
}

// Interleaved Gradient Noise for zero-banding optical blur dithering
float ignNoise(vec2 fragCoord) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(fragCoord, magic.xy))) - 0.5;
}

void main() {
    vec2 ndc = (vUv - 0.5) * 2.0;
    float ax = abs(ndc.x);
    float ay = abs(ndc.y);
    float sgnX = sign(ndc.x);

    float edgeStart = clamp(1.0 - uEdgeZone, 0.18, 0.85);
    float rawT = max(0.0, (ax - edgeStart) / max(0.001, 1.0 - edgeStart));

    vec4 finalColor = vec4(0.0);

    if (rawT <= 0.0005 || uDistortion <= 0.001) {
        finalColor = texture2D(uSceneTex, vUv);
    } else {
        // ====================================================================
        // 1. HYPERBOLIC S-CURVE VERTICAL FLARE (FLAT INNER -> STEEP OUTER FLARE)
        // ====================================================================
        // Slight perspective waist near entry, then steep exponential horn flare
        float waist = -0.05 * smoothstep(0.0, 0.32, rawT) * (1.0 - smoothstep(0.32, 0.72, rawT));
        float hornFlare = 1.38 * pow(rawT, 2.95) + 0.72 * pow(rawT, 5.2);
        float vStretch = 1.0 + (waist + uVerticalFlare * hornFlare) * uDistortion;
        float mappedNdcY = ndc.y / max(0.08, vStretch);

        // ====================================================================
        // 2. LOCALIZED CENTER-LOBE HORIZONTAL LIQUID STRETCH
        // ====================================================================
        // Stronger horizontal pull in the vertical center (orb/chart zone)
        // while keeping top headers ("B2.Score", "Measure") crisp & legible
        float centerLobe = exp(-mappedNdcY * mappedNdcY * 1.85);
        float basePull = 0.44 + 0.14 * centerLobe;
        float maxSpan = max(0.05, 1.0 - edgeStart);

        // Adaptive pull ensures at ax = 1.0 we never sample past the side card's outer edge
        float adaptiveCap = clamp(1.0 - (uMaxTargetAx - edgeStart) / maxSpan, 0.35, 0.68);
        float pullStrength = clamp(
            mix(basePull, adaptiveCap, 0.65) * uHorizontalSmear * uDistortion,
            0.0,
            0.68
        );

        float compressedT = rawT - pullStrength * pow(rawT, 1.78);
        float mappedAx = edgeStart + maxSpan * compressedT;
        float mappedNdcX = sgnX * mappedAx;

        vec2 baseUv = vec2(mappedNdcX, mappedNdcY) * 0.5 + 0.5;

        // ====================================================================
        // 3. ORGANIC LIQUID-GLASS REFRACTION WAVE
        // ====================================================================
        float glassWave1 = sin(vUv.y * 42.0 + sgnX * vUv.x * 28.0);
        float glassWave2 = cos(vUv.y * 24.0 - sgnX * vUv.x * 36.0);
        float ripple = (glassWave1 * 0.6 + glassWave2 * 0.4)
            * pow(rawT, 2.2) * 0.0042 * uRefractionRipple * uDistortion;

        // ====================================================================
        // 4. 32-TAP DITHERED OPTICAL SMEAR & PRISMATIC DISPERSION
        // ====================================================================
        float smearProfile = (0.45 + 0.55 * centerLobe) * pow(rawT, 1.95);
        float smearSpan = smearProfile * 0.082 * uHorizontalSmear * uDistortion;

        // Chromatic dispersion strongest along the curved top/bottom borders & outer edge
        float caCurve = pow(rawT, 1.85) * (0.55 + 0.85 * abs(mappedNdcY));
        float caStrength = caCurve * 0.028 * uChromatic * uDistortion;

        vec2 caVector = vec2(sgnX * caStrength, ndc.y * caStrength * 0.95)
                      + vec2(ripple * sgnX, ripple * 0.85);

        float jitter = ignNoise(gl_FragCoord.xy) / 32.0;

        vec3 accumRgb = vec3(0.0);
        float accumAlpha = 0.0;
        vec3 weightSum = vec3(0.0);

        const int SAMPLES = 32;
        for (int i = 0; i < SAMPLES; i++) {
            float u = clamp((float(i) + 0.5) / float(SAMPLES) + jitter, 0.0, 1.0);
            float centered = u - 0.5;

            // Smooth bell envelope so smeared trails taper organically with zero hard edges
            float bell = exp(-centered * centered * 5.5);

            vec2 smearOffset = vec2(-sgnX * centered * smearSpan, 0.0);
            vec2 sampleUv = clamp(baseUv + smearOffset + caVector * centered, 0.002, 0.998);

            vec4 tap = texture2D(uSceneTex, sampleUv);
            vec3 w = spectralWeight(u) * bell;

            accumRgb += tap.rgb * w;
            accumAlpha += tap.a * bell;
            weightSum += w;
        }

        vec3 dispersedRgb = accumRgb / max(weightSum, vec3(0.0001));
        float normAlpha = accumAlpha / max(0.0001, (weightSum.r + weightSum.g + weightSum.b) / 3.0);

        // ====================================================================
        // 5. SILKY PRISMATIC IRIDESCENCE ON HIGH-CONTRAST WARPED BORDERS
        // ====================================================================
        vec2 gradUvA = clamp(baseUv + caVector * 0.42, 0.002, 0.998);
        vec2 gradUvB = clamp(baseUv - caVector * 0.42, 0.002, 0.998);
        vec3 colA = texture2D(uSceneTex, gradUvA).rgb;
        vec3 colB = texture2D(uSceneTex, gradUvB).rgb;
        float contrast = length(colA - colB);

        float specAngle = (vUv.y - 0.5) * 6.5 + rawT * 4.2 + glassWave1 * 0.35;
        vec3 prismSpectrum = 0.55 + 0.45 * cos(6.28318 * (specAngle * 0.22 + vec3(0.0, 0.33, 0.67)));
        float prismFactor = smoothstep(0.04, 0.38, contrast)
            * pow(rawT, 1.55) * clamp(uChromatic * uDistortion * 0.72, 0.0, 0.75);
        dispersedRgb = mix(dispersedRgb, mix(dispersedRgb, prismSpectrum, 0.58), prismFactor);

        // ====================================================================
        // 6. VISION-OS GLASS SPECULAR SHEEN & LUMINOUS WHITE EDGE BLOOM
        // ====================================================================
        float glassSheen = pow(rawT, 2.4) * exp(-pow(abs(ndc.y) - 0.45, 2.0) * 3.5) * 0.22 * uEdgeGlow * uDistortion;
        dispersedRgb = mix(dispersedRgb, vec3(1.0), clamp(glassSheen, 0.0, 0.45));

        float borderBloom = smoothstep(0.68, 1.0, rawT) * 0.52 * uEdgeGlow * uDistortion;
        vec3 luminousMist = mix(uBgColor, vec3(1.0), 0.72);
        dispersedRgb = mix(dispersedRgb, luminousMist, clamp(borderBloom, 0.0, 0.85));

        finalColor = vec4(dispersedRgb, clamp(normAlpha, 0.0, 1.0));
    }

    // ========================================================================
    // 7. TOP & BOTTOM VIEWPORT BORDER AMBIENT LENS REFLECTIONS
    // ========================================================================
    float tbMask = smoothstep(0.88, 1.0, ay) * (1.0 - smoothstep(0.42, 0.90, ax)) * uEdgeGlow * uDistortion;
    if (tbMask > 0.001) {
        float reflectY = 0.5 + sign(ndc.y) * 0.18;
        vec3 reflAcc = vec3(0.0);
        for (int j = -3; j <= 3; j++) {
            float ox = float(j) * 0.024;
            vec2 rUv = clamp(vec2(vUv.x + ox, reflectY), 0.01, 0.99);
            reflAcc += texture2D(uSceneTex, rUv).rgb;
        }
        reflAcc /= 7.0;
        vec3 reflColor = mix(uBgColor, mix(reflAcc, vec3(1.0), 0.25), 0.65);
        finalColor.rgb = mix(finalColor.rgb, reflColor, tbMask * 0.35);
    }

    if (uTransparentBg > 0.5) {
        gl_FragColor = finalColor;
    } else {
        gl_FragColor = vec4(finalColor.rgb, 1.0);
    }
}
`

// ============================================================================
//HELPER: PARSE HEX/CSS COLOR INTO EXACT SRGB 0..1 FLOATS (NO GAMMA CRUSH)
// ============================================================================
function parseSrgbColor(colorStr: string): [number, number, number] {
    const c = new THREE.Color(colorStr || "#ECEEF2")
    // THREE.Color converts hex from sRGB to Linear internally in r152+;
    // convert back to sRGB space so our pass-through shader outputs exact CSS hex colors
    const srgb = c.clone().convertLinearToSRGB()
    return [srgb.r, srgb.g, srgb.b]
}

// ============================================================================
// MAIN FRAMER COMPONENT
// ============================================================================

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 960
 * @framerIntrinsicHeight 680
 * @framerDisableUnlink
 */
export default function PrismaticMediaCarousel(incomingProps: CarouselProps) {
    // STEP 1 (Intercept & Flatten): Flatten grouped property controls
    const props = {
        ...incomingProps,
        ...(incomingProps.carousel || {}),
        ...(incomingProps.distortion || {}),
        ...(incomingProps.appearance || {}),
        ...(incomingProps.interaction || {}),
    }

    const mountRef = useRef<HTMLDivElement | null>(null)
    const isIntersecting = useRef<boolean>(true)

    const isStatic = useIsStaticRenderer()
    const shouldAnimate = !isStatic && (props.livePreview ?? true)

    // Mutable animation & interaction state stored in refs to bypass React re-renders
    const scrollState = useRef({
        current: 0,
        target: 0,
        velocity: 0,
        isDragging: false,
        lastPointerX: 0,
    })

    const latestPropsRef = useRef(props)
    latestPropsRef.current = props

    const renderSingleFrameRef = useRef<(() => void) | null>(null)

    const cardsKey = JSON.stringify(
        (props.cards || []).map((c) => ({
            t: c?.mediaType || "auto",
            i: resolveMediaUrl(c?.image),
            v: resolveMediaUrl(c?.video),
            p: c?.preset || "",
        }))
    )

    useEffect(() => {
        const container = mountRef.current
        if (!container) return

        let frameId = 0
        let resizeObserver: ResizeObserver | null = null
        let intersectionObserver: IntersectionObserver | null = null

        const disposableGeometries: THREE.BufferGeometry[] = []
        const disposableMaterials: THREE.Material[] = []
        const disposableTextures: THREE.Texture[] = []
        const activeVideos: HTMLVideoElement[] = []

        const width = Math.max(100, container.clientWidth || 800)
        const height = Math.max(100, container.clientHeight || 600)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        // 1. Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
        })
        renderer.setPixelRatio(dpr)
        renderer.setSize(width, height)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.domElement.style.width = "100%"
        renderer.domElement.style.height = "100%"
        renderer.domElement.style.display = "block"
        renderer.domElement.style.userSelect = "none"
        renderer.domElement.style.touchAction = "pan-y"
        container.appendChild(renderer.domElement)

        // 2. RenderTarget (NoColorSpace so custom ShaderMaterial preserves exact 1:1 sRGB colors)
        const renderTarget = new THREE.WebGLRenderTarget(
            Math.max(2, Math.floor(width * dpr)),
            Math.max(2, Math.floor(height * dpr)),
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                colorSpace: THREE.NoColorSpace,
                depthBuffer: true,
                stencilBuffer: false,
            }
        )
        renderTarget.texture.wrapS = THREE.ClampToEdgeWrapping
        renderTarget.texture.wrapT = THREE.ClampToEdgeWrapping

        // 3. 3D Scene & Camera
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
        camera.position.set(0, 0, 6.0)

        // 4. Post-Processing Scene & Camera
        const postScene = new THREE.Scene()
        const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const postQuadGeo = new THREE.PlaneGeometry(2, 2)
        disposableGeometries.push(postQuadGeo)

        const [bgR, bgG, bgB] = parseSrgbColor(
            props.backgroundColor || "#ECEEF2"
        )

        const postMaterial = new THREE.ShaderMaterial({
            vertexShader: POST_VERTEX_SHADER,
            fragmentShader: POST_FRAGMENT_SHADER,
            uniforms: {
                uSceneTex: { value: renderTarget.texture },
                uBgColor: { value: new THREE.Vector3(bgR, bgG, bgB) },
                uTransparentBg: { value: props.transparentBg ? 1.0 : 0.0 },
                uDistortion: {
                    value: (props.distortionIntensity ?? 100) / 100,
                },
                uEdgeZone: { value: (props.edgeZone ?? 58) / 100 },
                uVerticalFlare: { value: (props.verticalFlare ?? 125) / 100 },
                uHorizontalSmear: {
                    value: (props.horizontalSmear ?? 105) / 100,
                },
                uChromatic: {
                    value: (props.chromaticAberration ?? 100) / 100,
                },
                uRefractionRipple: {
                    value: (props.refractionRipple ?? 100) / 100,
                },
                uEdgeGlow: { value: (props.edgeGlow ?? 100) / 100 },
                uMaxTargetAx: { value: 0.72 },
            },
            depthTest: false,
            depthWrite: false,
            transparent: Boolean(props.transparentBg),
        })
        disposableMaterials.push(postMaterial)

        const postQuadMesh = new THREE.Mesh(postQuadGeo, postMaterial)
        postScene.add(postQuadMesh)

        // 5. Build Carousel Cards
        const rawCards: CardItem[] =
            Array.isArray(props.cards) && props.cards.length > 0
                ? props.cards
                : [
                      { mediaType: "preset", preset: "1" },
                      { mediaType: "preset", preset: "2" },
                      { mediaType: "preset", preset: "3" },
                      { mediaType: "preset", preset: "4" },
                      { mediaType: "preset", preset: "5" },
                      { mediaType: "preset", preset: "6" },
                  ]

        const slotItems: CardItem[] = []
        while (slotItems.length < Math.max(6, rawCards.length)) {
            for (let i = 0; i < rawCards.length; i++) {
                slotItems.push(rawCards[i])
                if (
                    slotItems.length >= Math.max(6, rawCards.length) &&
                    slotItems.length % rawCards.length === 0
                ) {
                    break
                }
            }
        }

        const sharedCardGeo = new THREE.PlaneGeometry(1, 1, 48, 48)
        const sharedShadowGeo = new THREE.PlaneGeometry(1.18, 1.18, 16, 16)
        disposableGeometries.push(sharedCardGeo, sharedShadowGeo)

        const sharedShadowMat = new THREE.ShaderMaterial({
            vertexShader: CARD_VERTEX_SHADER,
            fragmentShader: SHADOW_FRAGMENT_SHADER,
            uniforms: {
                uCurveDepth: { value: (props.depthCurve ?? 100) / 100 },
                uViewportHalfWidth: { value: 2.5 },
                uCardAspect: { value: (props.cardAspect ?? 81) / 100 },
                uCornerRadius: {
                    value: Math.min(0.45, (props.cornerRadius ?? 24) / 340),
                },
                uShadowStrength: { value: (props.cardShadow ?? 100) / 100 },
            },
            transparent: true,
            depthWrite: false,
        })
        disposableMaterials.push(sharedShadowMat)

        const textureLoader = new THREE.TextureLoader()
        textureLoader.setCrossOrigin("anonymous")

        const presetCache = new Map<number, THREE.CanvasTexture>()
        const getPresetTexture = (id: number) => {
            if (!presetCache.has(id)) {
                const tex = createPresetCardTexture(id)
                presetCache.set(id, tex)
                disposableTextures.push(tex)
            }
            return presetCache.get(id)!
        }

        interface CardSlot {
            group: THREE.Group
            cardMesh: THREE.Mesh
            shadowMesh: THREE.Mesh
            material: THREE.ShaderMaterial
        }

        const cardSlots: CardSlot[] = []

        slotItems.forEach((item, index) => {
            const presetNum =
                item?.preset &&
                ["1", "2", "3", "4", "5", "6"].includes(item.preset)
                    ? parseInt(item.preset, 10)
                    : (index % 6) + 1

            const fallbackTex = getPresetTexture(presetNum)
            const cardMat = new THREE.ShaderMaterial({
                vertexShader: CARD_VERTEX_SHADER,
                fragmentShader: CARD_FRAGMENT_SHADER,
                uniforms: {
                    uTexture: { value: fallbackTex },
                    uMediaAspect: { value: 1200 / 1480 },
                    uCardAspect: { value: (props.cardAspect ?? 81) / 100 },
                    uCornerRadius: {
                        value: Math.min(0.45, (props.cornerRadius ?? 24) / 340),
                    },
                    uCurveDepth: { value: (props.depthCurve ?? 100) / 100 },
                    uViewportHalfWidth: { value: 2.5 },
                },
                transparent: true,
                depthWrite: true,
            })
            disposableMaterials.push(cardMat)

            const mode = item?.mediaType || "auto"
            const videoUrl = resolveMediaUrl(item?.video)
            const imageUrl = resolveMediaUrl(item?.image)

            const shouldUseVideo =
                (mode === "video" || mode === "auto") && videoUrl.length > 0
            const shouldUseImage =
                !shouldUseVideo &&
                (mode === "image" || mode === "auto") &&
                imageUrl.length > 0

            if (shouldUseVideo) {
                const video = document.createElement("video")
                video.crossOrigin = "anonymous"
                video.src = videoUrl
                video.muted = true
                video.loop = true
                video.playsInline = true
                video.autoplay = true
                video.preload = "auto"
                activeVideos.push(video)

                const vidTex = new THREE.VideoTexture(video)
                vidTex.colorSpace = THREE.NoColorSpace
                vidTex.minFilter = THREE.LinearFilter
                vidTex.magFilter = THREE.LinearFilter
                vidTex.generateMipmaps = false
                disposableTextures.push(vidTex)

                const onVideoReady = () => {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        cardMat.uniforms.uMediaAspect.value =
                            video.videoWidth / video.videoHeight
                    }
                    cardMat.uniforms.uTexture.value = vidTex
                    video.play().catch(() => {})
                    if (renderSingleFrameRef.current) {
                        renderSingleFrameRef.current()
                    }
                }

                video.addEventListener("loadedmetadata", onVideoReady)
                video.addEventListener("loadeddata", onVideoReady)
                video.addEventListener("canplay", onVideoReady)
                video.load()
                video.play().catch(() => {})
            } else if (shouldUseImage) {
                textureLoader.load(
                    imageUrl,
                    (loadedTex) => {
                        loadedTex.colorSpace = THREE.NoColorSpace
                        loadedTex.minFilter = THREE.LinearFilter
                        loadedTex.magFilter = THREE.LinearFilter
                        loadedTex.generateMipmaps = false
                        disposableTextures.push(loadedTex)

                        if (
                            loadedTex.image &&
                            loadedTex.image.width > 0 &&
                            loadedTex.image.height > 0
                        ) {
                            cardMat.uniforms.uMediaAspect.value =
                                loadedTex.image.width / loadedTex.image.height
                        }
                        cardMat.uniforms.uTexture.value = loadedTex
                        if (renderSingleFrameRef.current) {
                            renderSingleFrameRef.current()
                        }
                    },
                    undefined,
                    () => {}
                )
            }

            const group = new THREE.Group()
            const shadowMesh = new THREE.Mesh(sharedShadowGeo, sharedShadowMat)
            shadowMesh.position.set(0, -0.02, -0.02)

            const cardMesh = new THREE.Mesh(sharedCardGeo, cardMat)
            group.add(shadowMesh)
            group.add(cardMesh)
            scene.add(group)

            cardSlots.push({
                group,
                cardMesh,
                shadowMesh,
                material: cardMat,
            })
        })

        // 6. Scene Layout & Render Function
        let lastTime = performance.now()
        const clearColorTemp = new THREE.Color()

        const renderFrame = (now: number, isManualPush = false) => {
            const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000))
            lastTime = now

            const p = latestPropsRef.current
            const cScale = (p.cardScale ?? 100) / 100
            const cAspect = (p.cardAspect ?? 81) / 100
            const cGap = (p.cardGap ?? 100) / 100
            const depthFactor = (p.depthCurve ?? 100) / 100
            const cornerNorm = Math.min(0.45, (p.cornerRadius ?? 24) / 340)

            // Frustum dimensions at Z = 0
            const vHeight =
                2.0 *
                Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
                camera.position.z
            const vWidth = vHeight * camera.aspect
            const halfW = vWidth * 0.5

            // Responsive sizing: scales up gracefully on widescreens while respecting vertical headroom
            const wideBoost = Math.pow(
                Math.max(1.0, Math.min(1.65, camera.aspect / 1.25)),
                0.38
            )
            const cardH = Math.min(
                vHeight * 0.72,
                vHeight * 0.505 * wideBoost * cScale
            )
            const cardW = cardH * cAspect

            // Compact, consistent gap between cards matching reference video
            const stepX = cardW * 1.25 * cGap
            const totalTrack = cardSlots.length * stepX

            // Calculate where the side card sits in NDC [0..1] so the edge lens
            // ALWAYS stretches the side card to the screen border without overshooting into empty space
            const sideCardOuterEdgeNdc = (stepX + cardW * 0.36) / halfW
            const maxTargetAx = THREE.MathUtils.clamp(
                sideCardOuterEdgeNdc,
                0.56,
                0.78
            )

            // Update scroll physics
            const s = scrollState.current
            const live = !isStatic && (p.livePreview ?? true)

            if (!s.isDragging) {
                if (live && !isManualPush) {
                    const dirSign = p.direction === "right" ? -1 : 1
                    const autoSpeed =
                        (p.autoPlay ?? true) ? (p.speed ?? 0.4) : 0

                    if (p.snapToCard && autoSpeed === 0) {
                        const nearest = Math.round(s.target / stepX) * stepX
                        s.target += (nearest - s.target) * 0.12
                    } else {
                        s.target += dirSign * autoSpeed * stepX * dt
                    }

                    const dampingFactor = Math.min(
                        0.99,
                        Math.max(0.5, (p.damping ?? 92) / 100)
                    )
                    s.target += s.velocity * dt
                    s.velocity *= Math.pow(dampingFactor, dt * 60)
                }
            }

            if (!live) {
                s.current = s.target
            } else {
                const lerpRate = 1.0 - Math.pow(0.001, dt)
                s.current +=
                    (s.target - s.current) * Math.min(1.0, lerpRate * 2.2)
            }

            sharedShadowMat.uniforms.uCurveDepth.value = depthFactor
            sharedShadowMat.uniforms.uViewportHalfWidth.value = halfW
            sharedShadowMat.uniforms.uCardAspect.value = cAspect
            sharedShadowMat.uniforms.uCornerRadius.value = cornerNorm
            sharedShadowMat.uniforms.uShadowStrength.value =
                (p.cardShadow ?? 100) / 100

            for (let i = 0; i < cardSlots.length; i++) {
                const slot = cardSlots[i]
                const rawOffset = i * stepX - s.current
                const wrappedX =
                    ((((rawOffset + totalTrack * 0.5) % totalTrack) +
                        totalTrack) %
                        totalTrack) -
                    totalTrack * 0.5

                const normX = wrappedX / Math.max(0.001, halfW)

                // Hide cards that are well past the 3-card visible stage so a 4th card never peeks in
                const isVisibleOnStage = Math.abs(wrappedX) < stepX * 1.65
                slot.group.visible = isVisibleOnStage

                slot.group.position.x = wrappedX
                slot.group.position.y = 0
                slot.group.position.z =
                    -Math.pow(Math.abs(normX), 1.75) * 0.28 * depthFactor
                slot.group.rotation.y = -normX * 0.13 * depthFactor

                slot.cardMesh.scale.set(cardW, cardH, 1)
                slot.shadowMesh.scale.set(cardW, cardH, 1)

                slot.material.uniforms.uCardAspect.value = cAspect
                slot.material.uniforms.uCornerRadius.value = cornerNorm
                slot.material.uniforms.uCurveDepth.value = depthFactor
                slot.material.uniforms.uViewportHalfWidth.value = halfW
            }

            // Exact sRGB background color without gamma darkening
            const [rSrgb, gSrgb, bSrgb] = parseSrgbColor(
                p.backgroundColor || "#ECEEF2"
            )
            clearColorTemp.setRGB(rSrgb, gSrgb, bSrgb)
            const isTrans = Boolean(p.transparentBg)

            postMaterial.uniforms.uBgColor.value.set(rSrgb, gSrgb, bSrgb)
            postMaterial.uniforms.uTransparentBg.value = isTrans ? 1.0 : 0.0
            postMaterial.uniforms.uDistortion.value =
                (p.distortionIntensity ?? 100) / 100
            postMaterial.uniforms.uEdgeZone.value = (p.edgeZone ?? 58) / 100
            postMaterial.uniforms.uVerticalFlare.value =
                (p.verticalFlare ?? 125) / 100
            postMaterial.uniforms.uHorizontalSmear.value =
                (p.horizontalSmear ?? 105) / 100
            postMaterial.uniforms.uChromatic.value =
                (p.chromaticAberration ?? 100) / 100
            postMaterial.uniforms.uRefractionRipple.value =
                (p.refractionRipple ?? 100) / 100
            postMaterial.uniforms.uEdgeGlow.value = (p.edgeGlow ?? 100) / 100
            postMaterial.uniforms.uMaxTargetAx.value = maxTargetAx
            postMaterial.transparent = isTrans

            // Pass 1: Render 3D Carousel into RenderTarget
            renderer.setRenderTarget(renderTarget)
            renderer.setClearColor(clearColorTemp, isTrans ? 0.0 : 1.0)
            renderer.clear()
            renderer.render(scene, camera)

            // Pass 2: Render Full-Screen Liquid Lens Post-Processing to Screen
            renderer.setRenderTarget(null)
            renderer.setClearColor(clearColorTemp, isTrans ? 0.0 : 1.0)
            renderer.clear()
            renderer.render(postScene, postCamera)
        }

        const pushSingleFrame = () => {
            renderFrame(performance.now(), true)
        }
        renderSingleFrameRef.current = pushSingleFrame

        // 7. Pointer Drag & Horizontal Wheel Interactions
        const domEl = renderer.domElement
        domEl.style.cursor = (props.enableDrag ?? true) ? "grab" : "default"

        const onPointerDown = (e: PointerEvent) => {
            if (!(latestPropsRef.current.enableDrag ?? true)) return
            scrollState.current.isDragging = true
            scrollState.current.lastPointerX = e.clientX
            scrollState.current.velocity = 0
            domEl.style.cursor = "grabbing"
            try {
                domEl.setPointerCapture(e.pointerId)
            } catch {}
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!scrollState.current.isDragging) return
            const dx = e.clientX - scrollState.current.lastPointerX
            scrollState.current.lastPointerX = e.clientX

            const w = Math.max(100, container.clientWidth || 800)
            const vHeight =
                2.0 *
                Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
                camera.position.z
            const vWidth = vHeight * camera.aspect
            const sens = (latestPropsRef.current.dragSensitivity ?? 100) / 100
            const worldDelta = -(dx / w) * vWidth * 1.15 * sens

            scrollState.current.target += worldDelta
            scrollState.current.velocity = worldDelta * 28

            if (!shouldAnimate) {
                scrollState.current.current = scrollState.current.target
                pushSingleFrame()
            }
        }

        const onPointerUp = (e: PointerEvent) => {
            if (!scrollState.current.isDragging) return
            scrollState.current.isDragging = false
            domEl.style.cursor =
                (latestPropsRef.current.enableDrag ?? true) ? "grab" : "default"
            try {
                domEl.releasePointerCapture(e.pointerId)
            } catch {}
            if (!shouldAnimate) {
                pushSingleFrame()
            }
        }

        const onWheel = (e: WheelEvent) => {
            if (!(latestPropsRef.current.enableDrag ?? true)) return
            if (
                Math.abs(e.deltaX) > Math.abs(e.deltaY) &&
                Math.abs(e.deltaX) > 1
            ) {
                e.preventDefault()
                const sens =
                    (latestPropsRef.current.dragSensitivity ?? 100) / 100
                scrollState.current.target += e.deltaX * 0.0045 * sens
                if (!shouldAnimate) {
                    scrollState.current.current = scrollState.current.target
                    pushSingleFrame()
                }
            }
        }

        domEl.addEventListener("pointerdown", onPointerDown)
        window.addEventListener("pointermove", onPointerMove)
        window.addEventListener("pointerup", onPointerUp)
        window.addEventListener("pointercancel", onPointerUp)
        domEl.addEventListener("wheel", onWheel, { passive: false })

        // 8. Responsive ResizeObserver
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect
                const newW = Math.max(100, cr.width)
                const newH = Math.max(100, cr.height)
                const curDpr = Math.min(window.devicePixelRatio || 1, 2)

                camera.aspect = newW / newH
                camera.updateProjectionMatrix()
                renderer.setSize(newW, newH)
                renderTarget.setSize(
                    Math.max(2, Math.floor(newW * curDpr)),
                    Math.max(2, Math.floor(newH * curDpr))
                )
                pushSingleFrame()
            }
        })
        resizeObserver.observe(container)

        // 9. Viewport IntersectionObserver
        intersectionObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0]) {
                    isIntersecting.current = entries[0].isIntersecting
                }
            },
            { threshold: 0.01 }
        )
        intersectionObserver.observe(container)

        // 10. Main Animation Loop
        const animate = (now: number) => {
            if (shouldAnimate) {
                frameId = requestAnimationFrame(animate)
            }
            if (!isIntersecting.current && shouldAnimate) return
            renderFrame(now, false)
        }

        pushSingleFrame()
        if (shouldAnimate) {
            frameId = requestAnimationFrame(animate)
        }

        // 11. STRICT WEBGL CLEANUP FOR FRAMER HOT-RELOADING
        return () => {
            cancelAnimationFrame(frameId)
            renderSingleFrameRef.current = null

            if (resizeObserver) {
                resizeObserver.disconnect()
                resizeObserver = null
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect()
                intersectionObserver = null
            }

            domEl.removeEventListener("pointerdown", onPointerDown)
            window.removeEventListener("pointermove", onPointerMove)
            window.removeEventListener("pointerup", onPointerUp)
            window.removeEventListener("pointercancel", onPointerUp)
            domEl.removeEventListener("wheel", onWheel)

            activeVideos.forEach((vid) => {
                try {
                    vid.pause()
                    vid.removeAttribute("src")
                    vid.load()
                } catch {}
            })

            disposableTextures.forEach((tex) => tex.dispose())
            disposableMaterials.forEach((mat) => mat.dispose())
            disposableGeometries.forEach((geo) => geo.dispose())
            renderTarget.dispose()

            scene.clear()
            postScene.clear()

            renderer.forceContextLoss()
            renderer.dispose()

            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement)
            }
        }
    }, [cardsKey, shouldAnimate])

    useEffect(() => {
        if (!shouldAnimate && renderSingleFrameRef.current) {
            renderSingleFrameRef.current()
        }
    }, [
        shouldAnimate,
        props.cardScale,
        props.cardAspect,
        props.cardGap,
        props.depthCurve,
        props.distortionIntensity,
        props.edgeZone,
        props.verticalFlare,
        props.horizontalSmear,
        props.chromaticAberration,
        props.refractionRipple,
        props.edgeGlow,
        props.backgroundColor,
        props.transparentBg,
        props.cornerRadius,
        props.cardShadow,
    ])

    return (
        <div
            ref={mountRef}
            style={{
                width: "100%",
                height: "100%",
                minWidth: 100,
                minHeight: 100,
                position: "relative",
                overflow: "hidden",
                ...incomingProps.style,
            }}
        />
    )
}

// ============================================================================
// STEP 2: NESTED DEFAULT PROPS MIRRORING UI GROUPS
// ============================================================================
PrismaticMediaCarousel.defaultProps = {
    livePreview: true,
    cards: [
        { mediaType: "auto", preset: "1" },
        { mediaType: "auto", preset: "2" },
        { mediaType: "auto", preset: "3" },
        { mediaType: "auto", preset: "4" },
        { mediaType: "auto", preset: "5" },
        { mediaType: "auto", preset: "6" },
    ],
    carousel: {
        autoPlay: true,
        speed: 0.4,
        direction: "left",
        cardScale: 100,
        cardAspect: 81,
        cardGap: 100,
        depthCurve: 100,
    },
    distortion: {
        distortionIntensity: 100,
        edgeZone: 58,
        verticalFlare: 125,
        horizontalSmear: 105,
        chromaticAberration: 100,
        refractionRipple: 100,
        edgeGlow: 100,
    },
    appearance: {
        backgroundColor: "#ECEEF2",
        transparentBg: false,
        cornerRadius: 24,
        cardShadow: 100,
    },
    interaction: {
        enableDrag: true,
        dragSensitivity: 100,
        damping: 92,
        snapToCard: false,
    },
}

// ============================================================================
// STEP 3: FRAMER PROPERTY CONTROLS
// ============================================================================
addPropertyControls(PrismaticMediaCarousel, {
    livePreview: {
        type: ControlType.Boolean,
        title: "Live Preview",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Animate in Framer canvas.",
    },
    cards: {
        type: ControlType.Array,
        title: "Media Cards",
        description: "Upload local images, videos, or use presets.",
        defaultValue: [
            { mediaType: "auto", preset: "1" },
            { mediaType: "auto", preset: "2" },
            { mediaType: "auto", preset: "3" },
            { mediaType: "auto", preset: "4" },
            { mediaType: "auto", preset: "5" },
            { mediaType: "auto", preset: "6" },
        ],
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Source",
                    options: ["auto", "image", "video", "preset"],
                    optionTitles: [
                        "Auto Detect",
                        "Local Image",
                        "Local Video",
                        "Default Card",
                    ],
                    defaultValue: "auto",
                    description: "Choose media source type.",
                },
                image: {
                    type: ControlType.Image,
                    title: "Image",
                    description: "Upload a local image file.",
                    hidden: (item) =>
                        item?.mediaType === "video" ||
                        item?.mediaType === "preset",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogg"],
                    description: "Upload a local video file.",
                    hidden: (item) =>
                        item?.mediaType === "image" ||
                        item?.mediaType === "preset",
                },
                preset: {
                    type: ControlType.Enum,
                    title: "Preset",
                    options: ["1", "2", "3", "4", "5", "6"],
                    optionTitles: [
                        "1. Success Rate (82%)",
                        "2. B2.Score (853)",
                        "3. Growth Insights (75%)",
                        "4. Measure (93)",
                        "5. Operation (25)",
                        "6. Conversion (250%)",
                    ],
                    defaultValue: "1",
                    description: "Fallback card design.",
                },
            },
        },
    },
    carousel: {
        type: ControlType.Object,
        title: "Carousel & Layout",
        description: "Card motion and 3D layout.",
        controls: {
            autoPlay: {
                type: ControlType.Boolean,
                title: "Auto Play",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            speed: {
                type: ControlType.Number,
                title: "Speed",
                defaultValue: 0.4,
                min: 0,
                max: 2.5,
                step: 0.05,
                unit: "x",
                description: "Continuous scroll speed.",
            },
            direction: {
                type: ControlType.Enum,
                title: "Direction",
                options: ["left", "right"],
                optionTitles: ["Left", "Right"],
                defaultValue: "left",
            },
            cardScale: {
                type: ControlType.Number,
                title: "Card Size",
                defaultValue: 100,
                min: 50,
                max: 150,
                step: 1,
                unit: "%",
                description: "Overall card scale.",
            },
            cardAspect: {
                type: ControlType.Number,
                title: "Aspect Ratio",
                defaultValue: 81,
                min: 50,
                max: 150,
                step: 1,
                unit: "%",
                description: "Card width-to-height ratio.",
            },
            cardGap: {
                type: ControlType.Number,
                title: "Card Spacing",
                defaultValue: 100,
                min: 70,
                max: 160,
                step: 1,
                unit: "%",
                description: "Distance between cards.",
            },
            depthCurve: {
                type: ControlType.Number,
                title: "3D Depth",
                defaultValue: 100,
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                description: "3D perspective tilt curve.",
            },
        },
    },
    distortion: {
        type: ControlType.Object,
        title: "Edge Lens Effect",
        description: "Liquid warp and prism refraction at edges.",
        controls: {
            distortionIntensity: {
                type: ControlType.Number,
                title: "Intensity",
                defaultValue: 100,
                min: 0,
                max: 200,
                step: 1,
                unit: "%",
                description: "Master edge effect strength.",
            },
            edgeZone: {
                type: ControlType.Number,
                title: "Edge Width",
                defaultValue: 58,
                min: 25,
                max: 80,
                step: 1,
                unit: "%",
                description: "Size of left/right warp zones.",
            },
            verticalFlare: {
                type: ControlType.Number,
                title: "Vertical Flare",
                defaultValue: 125,
                min: 0,
                max: 250,
                step: 5,
                unit: "%",
                description: "Vertical stretch at borders.",
            },
            horizontalSmear: {
                type: ControlType.Number,
                title: "Liquid Smear",
                defaultValue: 105,
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                description: "Horizontal pull and streak blur.",
            },
            chromaticAberration: {
                type: ControlType.Number,
                title: "Prism RGB",
                defaultValue: 100,
                min: 0,
                max: 250,
                step: 5,
                unit: "%",
                description: "Rainbow color split at edges.",
            },
            refractionRipple: {
                type: ControlType.Number,
                title: "Glass Ripple",
                defaultValue: 100,
                min: 0,
                max: 250,
                step: 5,
                unit: "%",
                description: "Fine glass wave in refraction.",
            },
            edgeGlow: {
                type: ControlType.Number,
                title: "Border Glow",
                defaultValue: 100,
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                description: "Edge mist and top/bottom reflection.",
            },
        },
    },
    appearance: {
        type: ControlType.Object,
        title: "Appearance",
        description: "Colors, corners, and shadows.",
        controls: {
            backgroundColor: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: "#ECEEF2",
                description: "Viewport background color.",
            },
            transparentBg: {
                type: ControlType.Boolean,
                title: "Transparent",
                defaultValue: false,
                enabledTitle: "Yes",
                disabledTitle: "No",
                description: "Hide background fill.",
            },
            cornerRadius: {
                type: ControlType.Number,
                title: "Corner Radius",
                defaultValue: 24,
                min: 0,
                max: 64,
                step: 1,
                unit: "px",
                description: "Card corner rounding.",
            },
            cardShadow: {
                type: ControlType.Number,
                title: "Card Shadow",
                defaultValue: 100,
                min: 0,
                max: 200,
                step: 5,
                unit: "%",
                description: "Soft shadow behind cards.",
            },
        },
    },
    interaction: {
        type: ControlType.Object,
        title: "Interaction",
        description:
            "Drag and momentum settings.\n\nMore components by [Saadat Ali](https://www.framer.com/%40saadat-ali-designsbysadat/)",
        controls: {
            enableDrag: {
                type: ControlType.Boolean,
                title: "Draggable",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Allow mouse and touch dragging.",
            },
            dragSensitivity: {
                type: ControlType.Number,
                title: "Sensitivity",
                defaultValue: 100,
                min: 20,
                max: 250,
                step: 5,
                unit: "%",
                description: "Drag responsiveness.",
            },
            damping: {
                type: ControlType.Number,
                title: "Momentum",
                defaultValue: 92,
                min: 70,
                max: 98,
                step: 1,
                unit: "%",
                description: "Inertia smoothness after release.",
            },
            snapToCard: {
                type: ControlType.Boolean,
                title: "Snap to Card",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
                description: "Snap when Auto Play is off.",
            },
        },
    },
})
