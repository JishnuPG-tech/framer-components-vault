// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useId, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

/**
 * Gilded Wheat Emblem — a pair of gilded wheat stalks with a customizable
 * center slot (text / image / component). Classic gold gradient with an
 * animated shimmer highlight that sweeps across both stalks.
 *
 * Rendering: two inline <svg> elements, each with its own <linearGradient>
 * whose x1/x2 attributes are driven by React state + requestAnimationFrame,
 * so the shimmer runs reliably inside Framer's rendering environment.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 420
 * @framerIntrinsicHeight 320
 */
export default function GildedWheatEmblem(props: Partial<Props>) {
    const {
        wheatColor = "#C9A24E",
        shimmerEnabled = true,
        shimmerSpeed = 3,
        shimmerIntensity = 0.9,
        shimmerDirection = "diagonal",
        textWheatRatio = 6,
        wheatHeight = 140,
        gap = 16,
        contentMode = "text",
        text = "AWARD",
        textColor = "#C9A24E",
        font,
        image,
        imageSize = 80,
        slot,
        style,
    } = props

    const rawId = useId()
    const uid = rawId.replace(/:/g, "")
    const gradIdL = `gwe-gL-${uid}`
    const gradIdR = `gwe-gR-${uid}`

    const { dark, mid, highlight } = deriveGoldStops(wheatColor)

    // font オブジェクトから fontSize を取り出す（麦穂サイズの連動計算用）
    const fontSizeValue = (() => {
        const fs = font?.fontSize
        if (typeof fs === "number") return fs
        if (typeof fs === "string") {
            const n = parseFloat(fs)
            if (!isNaN(n)) return n
        }
        return 18 // フォールバック
    })()

    // 麦穂の高さ:
    //   Text モード → フォントサイズに連動（textWheatRatio 倍率）
    //   それ以外 → 明示的な px 指定（wheatHeight）
    const effectiveWheatHeight =
        contentMode === "text"
            ? Math.max(8, fontSizeValue) * Math.max(1, textWheatRatio)
            : Math.max(20, wheatHeight)

    const aspect = VB_W / VB_H
    const wheatWidth = effectiveWheatHeight * aspect

    // ─── Shimmer animation (React state + RAF) ───────────────────────────
    // phase: 0 → 1 ループ。1周で光が麦穂を1回通り抜ける。
    const [phase, setPhase] = useState(0)
    const rafRef = useRef<number | null>(null)
    const safeSpeed = Math.max(0.1, shimmerSpeed)

    // prefers-reduced-motion: OS側で「視差効果を減らす」設定をしているユーザーは
    // シマーアニメーションを停止する（アクセシビリティ配慮）
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => setPrefersReducedMotion(mq.matches)
        update()
        mq.addEventListener?.("change", update)
        return () => mq.removeEventListener?.("change", update)
    }, [])

    const shimmerActive = shimmerEnabled && !prefersReducedMotion

    useEffect(() => {
        if (!shimmerActive) {
            setPhase(0)
            return
        }
        let start = performance.now()
        const tick = (now: number) => {
            const elapsed = (now - start) / 1000
            setPhase((elapsed / safeSpeed) % 1)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        }
    }, [shimmerActive, safeSpeed])

    // phase [0, 1] → グラデーションラインの横位置
    // 左の月桂樹：通常どおり SVG座標空間で L→R に光が流れる
    // 右の月脂樹：scaleX(-1) がかかっているため、視覚的に L→R / BL→TR にするには
    //   SVG座標空間では逆向きに動かす必要がある。
    // さらに右側は phase を +0.5 オフセットして、左→右と流れるように見せる。
    const leftPhase = phase
    const rightPhase = (phase + 0.5) % 1

    // 光の流れる方向（horizontal = 真横、diagonal = 左下→右上）
    const isDiagonal = shimmerDirection === "diagonal"

    // 補助：phase と鏡面フラグからグラデーション線の端点を計算
    const computeLine = (p: number, mirror: boolean) => {
        if (!shimmerActive) {
            return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }
        }
        const t = p * 200 // 進捗量 [0, 200]
        if (isDiagonal) {
            // 左下 → 右上 の対角。視覚方向 (+x, -y)
            // 左側：SVG空間でもそのまま (+x, -y)
            // 右側：scaleX(-1) で反転されるので SVG空間では (-x, -y)
            if (!mirror) {
                return {
                    x1: `${t - 100}%`,
                    y1: `${200 - t}%`,
                    x2: `${t}%`,
                    y2: `${100 - t}%`,
                }
            }
            return {
                x1: `${200 - t}%`,
                y1: `${200 - t}%`,
                x2: `${100 - t}%`,
                y2: `${100 - t}%`,
            }
        }
        // horizontal: 真横 L → R
        if (!mirror) {
            return {
                x1: `${t - 100}%`,
                y1: "0%",
                x2: `${t}%`,
                y2: "0%",
            }
        }
        return {
            x1: `${100 - t}%`,
            y1: "0%",
            x2: `${200 - t}%`,
            y2: "0%",
        }
    }

    const leftLine = computeLine(leftPhase, false)
    const rightLine = computeLine(rightPhase, true)

    // シマーOFF時は静止したグラデ、ON時は光の帯が走るグラデ
    const gradientStops = shimmerActive ? (
        <>
            <stop offset="0%" stopColor={dark} />
            <stop offset="40%" stopColor={mid} />
            <stop
                offset="50%"
                stopColor={highlight}
                stopOpacity={shimmerIntensity}
            />
            <stop offset="60%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
        </>
    ) : (
        <>
            <stop offset="0%" stopColor={dark} />
            <stop offset="50%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
        </>
    )

    const renderStalk = (
        gradId: string,
        mirror: boolean,
        line: { x1: string; y1: string; x2: string; y2: string }
    ) => (
        <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
                flexShrink: 0,
                width: wheatWidth,
                height: effectiveWheatHeight,
                display: "block",
                transform: mirror ? "scaleX(-1)" : undefined,
            }}
            aria-hidden
        >
            <defs>
                <linearGradient
                    id={gradId}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                >
                    {gradientStops}
                </linearGradient>
            </defs>
            <path d={WHEAT_PATH_D} fill={`url(#${gradId})`} />
        </svg>
    )

    const center = renderCenter({
        contentMode,
        text,
        textColor,
        font,
        image,
        imageSize,
        slot,
    })

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                gap,
                ...style,
            }}
        >
            {renderStalk(gradIdL, false, leftLine)}
            {center}
            {renderStalk(gradIdR, true, rightLine)}
        </div>
    )
}

// ─── Types ────────────────────────────────────────────────────────────────

interface Props {
    wheatColor: string
    shimmerEnabled: boolean
    shimmerSpeed: number
    shimmerIntensity: number
    shimmerDirection: "horizontal" | "diagonal"
    textWheatRatio: number
    wheatHeight: number
    gap: number
    contentMode: "text" | "image" | "slot" | "none"
    text: string
    textColor: string
    font?: CSSProperties
    image?: string | { src: string }
    imageSize: number
    slot?: ReactNode
    style?: CSSProperties
}

// ─── Center content renderer ──────────────────────────────────────────────

function renderCenter(p: {
    contentMode: Props["contentMode"]
    text: string
    textColor: string
    font?: CSSProperties
    image?: string | { src: string }
    imageSize: number
    slot?: ReactNode
}) {
    if (p.contentMode === "none") {
        return <div style={{ width: 0 }} />
    }

    if (p.contentMode === "slot") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {p.slot}
            </div>
        )
    }

    if (p.contentMode === "image") {
        const src = typeof p.image === "string" ? p.image : (p.image?.src ?? "")
        if (!src) {
            return (
                <div
                    style={{
                        width: p.imageSize,
                        height: p.imageSize,
                        border: "1px dashed rgba(255,255,255,0.3)",
                        borderRadius: 8,
                        flexShrink: 0,
                    }}
                />
            )
        }
        return (
            <img
                src={src}
                alt=""
                style={{
                    width: p.imageSize,
                    height: p.imageSize,
                    objectFit: "contain",
                    flexShrink: 0,
                }}
            />
        )
    }

    // text
    return (
        <div
            style={{
                textAlign: "center",
                whiteSpace: "pre-wrap",
                flexShrink: 0,
                ...(p.font ?? {}),
                color: p.textColor,
            }}
        >
            {p.text}
        </div>
    )
}

// ─── Color helpers ────────────────────────────────────────────────────────

function hexToHSL(hex: string): [number, number, number] {
    let h = hex.replace("#", "")
    if (h.length === 3)
        h = h
            .split("")
            .map((c) => c + c)
            .join("")
    if (h.length !== 6) return [40, 60, 50]
    const r = parseInt(h.slice(0, 2), 16) / 255
    const g = parseInt(h.slice(2, 4), 16) / 255
    const b = parseInt(h.slice(4, 6), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    let s = 0
    let hue = 0
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r:
                hue = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                hue = (b - r) / d + 2
                break
            case b:
                hue = (r - g) / d + 4
                break
        }
        hue *= 60
    }
    return [hue, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
    const L = Math.max(0, Math.min(100, l)) / 100
    const S = Math.max(0, Math.min(100, s)) / 100
    const a = S * Math.min(L, 1 - L)
    const f = (n: number) => {
        const k = (n + h / 30) % 12
        const c = L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return Math.round(c * 255)
            .toString(16)
            .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

function deriveGoldStops(baseColor: string) {
    const [h, s, l] = hexToHSL(baseColor)
    return {
        dark: hslToHex(h, s, Math.max(l - 28, 8)),
        mid: baseColor,
        highlight: hslToHex(h, Math.max(s - 15, 10), Math.min(l + 35, 96)),
    }
}

// ─── Property Controls ────────────────────────────────────────────────────

addPropertyControls(GildedWheatEmblem, {
    wheatColor: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#C9A24E",
        description:
            "Base gold color. Darker and lighter shades are derived automatically for depth.",
    },
    shimmerEnabled: {
        type: ControlType.Boolean,
        title: "Shimmer",
        defaultValue: true,
        description:
            "Animated gold highlight that sweeps across both stalks. Respects the viewer's reduced-motion preference.",
    },
    shimmerSpeed: {
        type: ControlType.Number,
        title: "Speed",
        min: 0.5,
        max: 15,
        step: 0.1,
        unit: "s",
        defaultValue: 3,
        description: "Seconds for the light to complete one pass.",
        hidden: (p: Props) => !p.shimmerEnabled,
    },
    shimmerIntensity: {
        type: ControlType.Number,
        title: "Intensity",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.9,
        displayStepper: true,
        description:
            "Brightness of the moving highlight (0 = invisible, 1 = maximum).",
        hidden: (p: Props) => !p.shimmerEnabled,
    },
    shimmerDirection: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["horizontal", "diagonal"],
        optionTitles: ["Horizontal \u2192", "Diagonal \u2197"],
        defaultValue: "diagonal",
        displaySegmentedControl: true,
        description:
            "Light travels left to right, or from bottom-left to top-right.",
        hidden: (p: Props) => !p.shimmerEnabled,
    },
    textWheatRatio: {
        type: ControlType.Number,
        title: "Wheat Size",
        min: 2,
        max: 20,
        step: 0.1,
        unit: "\u00d7 text",
        defaultValue: 6,
        description:
            "Wheat height as a multiplier of the text size (e.g. 6 = wheat is 6x as tall as the text). Keeps the emblem balanced as you change font size.",
        hidden: (p: Props) => p.contentMode !== "text",
    },
    wheatHeight: {
        type: ControlType.Number,
        title: "Wheat Height",
        min: 20,
        max: 1000,
        step: 1,
        unit: "px",
        defaultValue: 140,
        description: "Explicit wheat stalk height in pixels.",
        hidden: (p: Props) => p.contentMode === "text",
    },
    gap: {
        type: ControlType.Number,
        title: "Gap",
        min: 0,
        max: 400,
        step: 1,
        unit: "px",
        defaultValue: 16,
        description: "Space between each stalk and the center content.",
    },
    contentMode: {
        type: ControlType.Enum,
        title: "Center",
        options: ["text", "image", "slot", "none"],
        optionTitles: ["Text", "Image", "Slot", "None"],
        defaultValue: "text",
        displaySegmentedControl: true,
        description:
            "What appears between the two stalks: text, an image, any component (Slot), or nothing.",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "AWARD",
        displayTextArea: true,
        hidden: (p: Props) => p.contentMode !== "text",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#C9A24E",
        hidden: (p: Props) => p.contentMode !== "text",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 18,
            variant: "Bold",
            letterSpacing: "0.01em",
            lineHeight: "1.1em",
        },
        hidden: (p: Props) => p.contentMode !== "text",
    },
    image: {
        type: ControlType.Image,
        title: "Image",
        hidden: (p: Props) => p.contentMode !== "image",
    },
    imageSize: {
        type: ControlType.Number,
        title: "Image Size",
        min: 20,
        max: 600,
        step: 1,
        unit: "px",
        defaultValue: 80,
        hidden: (p: Props) => p.contentMode !== "image",
    },
    slot: {
        type: ControlType.ComponentInstance,
        title: "Slot",
        description:
            "Drop any Framer component here to place it between the two stalks (logo, badge, custom graphic, etc.).",
        hidden: (p: Props) => p.contentMode !== "slot",
    },
})

// ─── Traced wheat silhouette ──────────────────────────────────────────────

const VB_W = 183
const VB_H = 555
const WHEAT_PATH_D =
    "M148.8,531.8C144.7,527.2 138.8,520.6 135.9,517.0C132.9,513.4 130.3,510.3 129.9,510.0C129.2,509.4 117.0,493.1 115.0,490.1C114.2,488.8 113.0,487.2 112.4,486.6C111.8,486.0 110.1,483.5 108.6,481.0C104.0,473.3 103.5,472.6 102.3,471.3C101.6,470.5 101.3,469.3 101.7,468.5C102.5,466.2 111.0,460.9 113.3,461.2C114.6,461.4 116.9,464.0 119.5,468.3C121.7,472.0 124.3,476.0 125.0,477.1C134.1,489.9 139.4,497.0 142.5,500.4C143.1,501.0 146.5,505.1 150.2,509.5C153.8,513.9 159.3,520.0 162.4,523.0C165.5,526.0 168.0,529.1 168.0,530.0C168.0,532.1 160.2,540.0 158.1,540.0C157.2,540.0 153.0,536.3 148.8,531.8zM76.9,463.1C70.3,461.8 65.6,458.8 58.5,451.5C51.6,444.4 44.0,432.1 44.0,428.0C44.0,424.7 50.2,422.7 60.5,422.6C68.8,422.5 70.0,422.8 76.1,425.8C83.1,429.3 86.4,432.0 91.9,438.5L95.2,442.5L94.5,439.5C90.9,423.1 95.0,411.4 107.5,402.4C114.9,397.1 119.5,396.5 121.1,400.8C125.7,412.3 127.2,427.1 124.4,434.9C119.7,448.6 104.1,460.8 88.6,463.1C81.8,464.1 82.0,464.1 76.9,463.1zM53.8,412.3C47.3,410.4 37.3,400.7 32.8,392.0C28.6,383.9 25.5,374.8 26.3,372.7C26.9,371.0 32.8,369.0 37.2,369.0C42.3,369.0 53.2,372.1 57.3,374.7C62.7,378.1 68.0,383.4 71.1,388.8C72.5,391.1 73.9,392.8 74.2,392.5C74.5,392.2 74.5,389.1 74.3,385.7C73.8,380.2 74.1,378.7 77.0,372.7C79.4,367.5 81.6,364.8 86.1,361.0C89.4,358.2 92.8,356.0 93.6,356.0C94.4,356.0 96.2,355.3 97.5,354.4C98.8,353.6 101.1,353.0 102.6,353.2C106.2,353.6 107.1,356.9 107.7,371.0C108.3,386.0 106.8,390.2 97.0,400.0C89.4,407.5 87.5,408.6 75.3,412.4C69.0,414.3 60.2,414.3 53.8,412.3zM45.5,361.5C39.2,359.9 35.9,358.1 30.9,353.6C27.0,350.1 20.0,338.2 20.0,335.0C20.0,334.1 19.6,333.0 19.0,332.4C18.5,331.9 17.6,328.2 17.0,324.2C15.4,314.2 16.0,313.5 25.9,314.4C31.6,314.9 35.0,315.8 40.2,318.5C48.9,322.9 53.9,328.5 59.6,340.0L61.8,344.5L61.9,339.3C62.1,328.7 69.7,316.1 78.5,312.1C80.2,311.4 82.3,310.4 83.3,309.8C86.4,308.2 94.4,307.1 96.1,308.1C100.0,310.2 98.9,329.1 94.2,340.1C92.2,344.8 84.2,353.5 80.5,355.1C79.4,355.6 77.8,356.4 77.0,356.8C72.3,359.5 70.2,360.2 62.7,361.5C53.2,363.2 52.2,363.2 45.5,361.5zM41.0,309.4C40.2,309.1 36.8,307.5 33.5,305.9C22.0,300.0 15.5,287.6 14.3,268.9C13.6,258.4 14.6,256.6 20.4,257.7C37.2,260.7 48.4,270.5 53.2,286.5L55.4,293.5L56.2,290.0C58.6,280.0 59.8,277.5 64.2,272.5C66.8,269.6 70.7,266.4 72.7,265.3C77.8,262.7 86.6,260.8 91.5,261.2C95.4,261.5 95.5,261.6 95.8,265.8C96.0,268.2 95.4,273.4 94.5,277.2C91.2,291.9 85.1,300.2 73.2,306.1C66.8,309.3 65.9,309.5 54.5,309.7C47.9,309.8 41.8,309.7 41.0,309.4zM49.0,258.3C47.1,258.1 45.1,257.4 44.5,256.9C44.0,256.4 42.6,256.0 41.4,256.0C38.9,256.0 30.9,250.4 27.2,246.2C21.2,239.2 18.3,227.0 19.3,212.5C20.3,198.9 20.6,198.7 34.6,205.1C41.5,208.3 47.3,214.2 51.3,222.2C53.3,226.2 55.0,230.4 55.0,231.5C55.0,232.6 55.3,234.5 55.6,235.8C56.1,237.6 56.5,237.8 57.6,236.9C58.4,236.3 59.0,235.2 59.0,234.6C59.0,232.7 66.8,222.6 69.0,221.6C70.1,221.1 71.0,220.4 71.0,220.0C71.0,219.6 73.2,218.3 75.9,217.1C79.7,215.5 82.9,215.0 89.7,215.0C95.1,215.0 99.1,215.5 99.8,216.2C101.7,218.1 100.0,226.0 95.5,235.5C90.4,246.2 85.9,251.0 77.0,255.2C71.4,258.0 69.3,258.4 61.5,258.6C56.5,258.7 50.9,258.6 49.0,258.3zM62.5,207.9C59.8,207.5 56.4,206.6 55.0,205.9C53.6,205.3 50.9,204.1 49.0,203.2C36.9,197.6 30.1,186.4 30.0,172.0C30.0,169.0 30.8,162.3 31.7,157.1C33.2,149.2 33.8,147.6 35.7,146.7C39.4,145.0 47.3,149.4 55.2,157.5C59.0,161.3 64.0,171.8 64.1,176.2C64.1,178.0 64.5,181.5 64.8,184.0L65.5,188.5L69.2,182.9C73.9,175.6 75.5,174.3 87.1,169.0C89.9,167.7 102.0,168.1 108.0,169.7C112.4,170.8 112.9,173.2 110.1,179.4C108.9,181.9 108.0,184.4 108.0,184.9C108.0,185.5 107.6,186.0 107.2,186.0C106.7,186.0 105.6,187.8 104.6,190.0C102.9,193.9 91.7,205.0 89.5,205.0C88.8,205.0 87.0,205.6 85.4,206.4C81.7,208.2 69.0,209.0 62.5,207.9zM79.0,159.3C76.7,158.6 70.9,156.1 67.0,154.2C65.1,153.3 61.0,150.0 57.9,147.0C51.3,140.6 48.0,133.1 48.0,124.5C48.0,113.0 55.2,92.0 59.1,92.0C61.1,92.0 70.6,100.0 74.2,104.8C79.9,112.3 82.3,120.6 81.6,130.9L81.1,139.3L86.0,133.8C94.7,124.1 107.1,119.9 117.7,123.2C120.3,124.1 123.8,125.1 125.3,125.4C129.1,126.3 130.9,130.3 128.7,132.8C127.7,133.8 127.0,135.0 127.0,135.3C127.0,136.8 119.4,146.7 115.1,150.9C107.9,157.8 101.7,160.0 90.1,159.9C84.8,159.9 79.8,159.6 79.0,159.3zM102.9,113.0C96.1,110.8 90.4,107.3 84.2,101.7C75.1,93.3 72.2,84.8 74.0,72.0C75.6,60.6 84.8,42.0 88.8,42.0C91.3,42.0 101.1,52.7 104.0,58.5C106.2,62.9 106.5,64.7 106.4,74.0C106.3,81.2 105.7,85.7 104.6,88.4C103.7,90.5 103.0,92.5 103.0,92.7C103.0,93.0 105.3,91.1 108.1,88.6C115.6,81.9 127.1,77.1 132.7,78.4C134.2,78.8 137.1,79.5 139.0,79.9C146.5,81.7 154.0,86.2 154.0,88.9C154.0,89.9 150.5,94.5 146.1,99.1C140.0,105.6 136.6,108.4 130.9,111.3C124.2,114.6 122.8,115.0 116.0,114.9C111.6,114.9 106.2,114.1 102.9,113.0zM116.7,71.3C115.1,69.7 116.0,54.3 118.1,48.5C121.7,38.3 123.5,35.4 132.0,27.3C138.7,20.8 156.5,13.2 161.8,14.5C163.9,15.0 164.0,15.4 163.4,20.3C161.2,37.0 152.2,53.0 140.4,60.9C133.1,65.9 125.2,70.0 123.1,70.0C122.0,70.0 120.8,70.5 120.5,71.0C119.8,72.1 117.7,72.3 116.7,71.3z"
