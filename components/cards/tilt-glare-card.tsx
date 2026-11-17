// @framerDisableUnlink
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

/**
 * TiltCard3D
 * A card that tilts in 3D toward the cursor, with an optional glare sheen.
 * Drop in your own layers, or use the built-in image + title + subtitle.
 *
 * @framerIntrinsicWidth 320
 * @framerIntrinsicHeight 400
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
// ControlType.Color 토큰 언랩 — framerlabs SKILL.md Pitfalls
const tok = (v: any) => (v && typeof v === "object" && "value" in v ? v.value : v)
function fontFamilyOf(f?: { fontFamily?: string }): string {
    return (f && f.fontFamily) || "Inter, sans-serif"
}

// ---------------------------------------------------------------- URL guards (R7)
// Browsers ignore tabs, newlines and control characters inside a scheme, so the scheme is tested without them.
const SCHEME = /^([a-z][a-z0-9+.-]*):/i
const flatUrl = (s: string) => s.replace(/[\u0000- \u007f]+/g, "")
// http is lifted to https (the published site is https; the browser would upgrade or block it anyway).
const toHttps = (s: string) => s.replace(/^\s*http:/i, "https:")
// Images and posters: https (framerusercontent.com included), http (lifted), data:image/, blob: and same-site paths.
function safeImageUrl(raw: string): string {
    const src = String(raw || "").trim()
    const flat = flatUrl(src)
    if (!flat || flat.startsWith("//") || flat.startsWith("\\")) return ""
    const m = SCHEME.exec(flat)
    if (!m) return src
    const scheme = m[1].toLowerCase()
    if (scheme === "http") return toHttps(src)
    if (scheme === "https" || scheme === "blob") return src
    return flat.toLowerCase().startsWith("data:image/") ? src : ""
}
function resolveImage(image: any, imageUrl: string) {
    if (typeof image === "string" && image) return image
    if (image && image.src) return image.src
    return imageUrl || ""
}

function CardCopy({ title, subtitle, align, ff }: any) {
    if (!title && !subtitle) return null
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: 24,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                textAlign: align,
                background:
                    "linear-gradient(to top, rgba(8,8,12,0.85), rgba(8,8,12,0))",
                pointerEvents: "none",
            }}
        >
            {title ? (
                <span
                    style={{
                        color: "#FFFFFF",
                        fontFamily: ff,
                        fontSize: 22,
                        fontWeight: 600,
                        lineHeight: 1.25,
                    }}
                >
                    {title}
                </span>
            ) : null}
            {subtitle ? (
                <span
                    style={{
                        color: "rgba(245,245,250,0.72)",
                        fontFamily: ff,
                        fontSize: 14,
                        lineHeight: 1.4,
                    }}
                >
                    {subtitle}
                </span>
            ) : null}
        </div>
    )
}

// R21: defaultProps 대신 컴포넌트 안에서 기본값 병합(값이 undefined 일 때만). 예전 defaultProps 와 같은 키·값.
// 크기(320×400)는 위 @framerIntrinsicWidth/Height 주석이 맡는다.
const DEFAULTS = {
    font: { fontFamily: "Inter, sans-serif" },
    // 기본 데모는 외부 요청 0(Framer 심사 9/7): 이미지 URL 없음 → BG 색 카드로 렌더
    imageUrl: "",
    title: "Aurora Pass",
    subtitle: "Tilt the card — the glare follows your cursor.",
    textAlign: "left",
}

function withDefaults(props: any): any {
    const out: any = { ...props }
    for (const k of Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[]) if (out[k] === undefined) out[k] = DEFAULTS[k]
    return out
}

// R11: 정적 렌더러는 기본 export 첫 줄에서 가른다(정적 경로 = motion 훅 0 · 리스너 0)
export default function TiltCard3D(rawProps: any) {
    const isStatic = useIsStaticRenderer()
    const props = withDefaults(rawProps)
    return isStatic ? <StaticTiltCard {...props} /> : <LiveTiltCard {...props} />
}

function cardStyles(props: any) {
    const { image, imageUrl, radius, background, style } = props
    const imageSrc = safeImageUrl(resolveImage(image, imageUrl))
    const outerStyle = {
        width: "100%",
        height: "100%",
        boxSizing: "border-box" as const,
        perspective: 900,
        ...style,
    }
    const cardStyle = {
        position: "relative" as const,
        width: "100%",
        height: "100%",
        boxSizing: "border-box" as const,
        borderRadius: radius,
        overflow: "hidden",
        background: imageSrc ? "#000" : tok(background),
        boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        border: "1px solid rgba(255,255,255,0.08)",
    }
    const imageStyle = {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        pointerEvents: "none" as const,
    }
    const slotStyle = {
        position: "relative" as const,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }
    return { imageSrc, outerStyle, cardStyle, imageStyle, slotStyle }
}

// 정적 렌더러: 완전 분리된 순수 DOM 분기 (motion 0 · 리스너 0)
function StaticTiltCard(props: any) {
    const { title, subtitle, textAlign, children, font } = props
    const ff = fontFamilyOf(font)
    const { imageSrc, outerStyle, cardStyle, imageStyle, slotStyle } = cardStyles(props)
    return (
        <div style={outerStyle}>
            <div style={cardStyle}>
                {imageSrc ? (
                    <img src={imageSrc} alt="" style={imageStyle} />
                ) : null}
                <div style={slotStyle}>{children}</div>
                {!children ? (
                    <CardCopy
                        title={title}
                        subtitle={subtitle}
                        align={textAlign}
                        ff={ff}
                    />
                ) : null}
            </div>
        </div>
    )
}

function LiveTiltCard(props: any) {
    const {
        title,
        subtitle,
        textAlign,
        children,
        tiltStrength,
        glare,
        font,
    } = props

    const ff = fontFamilyOf(font)

    const mx = useMotionValue(0.5)
    const my = useMotionValue(0.5)

    const springCfg = { stiffness: 200, damping: 20, mass: 0.5 }
    const rx = useSpring(
        useTransform(my, [0, 1], [tiltStrength, -tiltStrength]),
        springCfg
    )
    const ry = useSpring(
        useTransform(mx, [0, 1], [-tiltStrength, tiltStrength]),
        springCfg
    )

    const glareX = useTransform(mx, [0, 1], ["0%", "100%"])
    const glareY = useTransform(my, [0, 1], ["0%", "100%"])
    const glareBg = useTransform(
        [glareX, glareY],
        ([x, y]) =>
            `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)`
    )

    function handleMove(e: any) {
        const rect = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - rect.left) / rect.width)
        my.set((e.clientY - rect.top) / rect.height)
    }

    function handleLeave() {
        mx.set(0.5)
        my.set(0.5)
    }

    const { imageSrc, outerStyle, cardStyle, imageStyle, slotStyle } = cardStyles(props)

    return (
        <div style={outerStyle}>
            <motion.div
                onMouseMove={handleMove}
                onMouseLeave={handleLeave}
                style={{
                    ...cardStyle,
                    transformStyle: "preserve-3d",
                    rotateX: rx,
                    rotateY: ry,
                    cursor: "pointer",
                }}
            >
                {imageSrc ? (
                    <img src={imageSrc} alt="" style={imageStyle} />
                ) : null}
                <div style={slotStyle}>{children}</div>
                {!children ? (
                    <CardCopy
                        title={title}
                        subtitle={subtitle}
                        align={textAlign}
                        ff={ff}
                    />
                ) : null}
                {glare && (
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                            background: glareBg,
                            mixBlendMode: "overlay",
                        }}
                    />
                )}
            </motion.div>
        </div>
    )
}

addPropertyControls(TiltCard3D, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    imageUrl: {
        type: ControlType.String,
        title: "Image URL",
        defaultValue: "",
        placeholder: "https://…",
        description: "Used when no image is uploaded. CMS friendly.",
    },
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Aurora Pass",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Tilt the card — the glare follows your cursor.",
        displayTextArea: true,
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Align",
        defaultValue: "left",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        displaySegmentedControl: true,
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
    },
    children: {
        type: ControlType.ComponentInstance,
        title: "Overlay",
    },
    tiltStrength: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 12,
        min: 0,
        max: 30,
        step: 1,
        unit: "°",
    },
    glare: {
        type: ControlType.Boolean,
        title: "Glare",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    background: {
        type: ControlType.Color,
        title: "BG",
        defaultValue: "#141418",
        description: "Optional.",
    },
})
