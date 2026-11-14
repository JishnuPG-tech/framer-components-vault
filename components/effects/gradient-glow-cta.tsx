// @framerDisableUnlink
import type { CSSProperties } from "react"
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
 * GradientButton
 * A gradient call-to-action. On hover or keyboard focus the gradient sweeps across the
 * button (CSS background-position transition). An optional glow sits behind it, with an
 * intensity control and an optional slow pulse (CSS keyframes). Both respect
 * prefers-reduced-motion: no sweep motion, no pulse, static glow.
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 56
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */

type ColorValue = string | { value?: string }
type FontValue = { fontFamily?: string; fontWeight?: number | string; fontStyle?: string }
type Size = "small" | "medium" | "large"

type Props = {
    label: string
    href?: string
    newTab: boolean
    gradientFrom: ColorValue
    gradientTo: ColorValue
    gradientAngle: number
    textColor: ColorValue
    radius: number
    size: Size
    fullWidth: boolean
    glow: boolean
    glowIntensity: number
    pulse: boolean
    font?: FontValue
    style?: CSSProperties
}

// ControlType.Color 토큰 언랩 — 문자열은 그대로 통과(G12 rgb() 불변).
const tok = (v?: ColorValue): string => (!v ? "" : typeof v === "string" ? v : v.value || "")

// 커스텀 프로퍼티 값 가드: 선언 구분자·중괄호·꺾쇠·주석 시작 제거.
function cssToken(value: string): string {
    return String(value || "").replace(/[;{}<>\\]|\/\*|\*\//g, "").slice(0, 200)
}

function fontFamilyOf(f?: FontValue): string {
    return cssToken((f && f.fontFamily) || "") || "Inter, system-ui, -apple-system, sans-serif"
}

const SIZES: Record<Size, { padding: string; fontSize: number }> = {
    small: { padding: "10px 18px", fontSize: 14 },
    medium: { padding: "14px 26px", fontSize: 16 },
    large: { padding: "18px 34px", fontSize: 18 },
}

function clamp(n: number, lo: number, hi: number): number {
    const v = Number.isFinite(n) ? n : lo
    return Math.min(hi, Math.max(lo, v))
}

// 글로 강도(0–1) → box-shadow. 강도가 커질수록 번짐·오프셋·확산이 커진다.
// 헤일로는 버튼보다 4px 안쪽에 두고 펄스는 opacity 만 움직인다: 바깥 그림자는 자기 박스 안쪽을 칠하지 않아
// 박스가 버튼 밖으로 나오면(scale) 빈 테두리(밝은 링)가 보인다(gbt-qa pulse-on t1300 · pre-gate v1200 실측).
function glowShadow(k: number, from: string, to: string): string {
    if (k <= 0) return "none"
    const y1 = Math.round(4 + 6 * k)
    const b1 = Math.round(10 + 26 * k)
    const y2 = Math.round(8 + 10 * k)
    const b2 = Math.round(18 + 42 * k)
    const s2 = Math.round(-4 + 6 * k)
    return `0 ${y1}px ${b1}px -2px ${from}, 0 ${y2}px ${b2}px ${s2}px ${to}`
}

// 스타일시트: 설정값 보간 없음(값은 루트 인라인 CSS 변수로만). 자식 결합자(>) 미사용(SSR 이스케이프).
const CSS = `.agbt { transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1); -webkit-tap-highlight-color: transparent; }
.agbt:focus { outline: none; }
.agbt:focus-visible { outline: 2px solid var(--agbt-ring); outline-offset: 3px; }
.agbt:hover, .agbt:focus-visible { transform: scale(1.03); }
.agbt:active { transform: scale(0.97); }
.agbt .agbt-face { background-color: var(--agbt-from); background-image: linear-gradient(var(--agbt-ang), var(--agbt-from) 0%, var(--agbt-to) 50%, var(--agbt-from) 100%); background-size: 200% 100%; background-position: 0% 50%; background-repeat: no-repeat; transition: background-position 0.9s cubic-bezier(0.22, 0.61, 0.36, 1); }
.agbt:hover .agbt-face, .agbt:focus-visible .agbt-face { background-position: 100% 50%; }
.agbt .agbt-halo.agbt-pulse { animation: agbt-pulse 2.6s ease-in-out infinite; }
@keyframes agbt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@media (prefers-reduced-motion: reduce) {
.agbt, .agbt .agbt-face { transition: none; }
.agbt:hover, .agbt:focus-visible, .agbt:active { transform: none; }
.agbt .agbt-halo.agbt-pulse { animation: none; }
}`

export default function GradientButton(props: Props) {
    const {
        label = "Get Started",
        href,
        newTab = false,
        gradientFrom = "#6D5EF6",
        gradientTo = "#2DD4BF",
        gradientAngle = 120,
        textColor = "#FFFFFF",
        radius = 12,
        size = "medium",
        fullWidth = false,
        glow = true,
        glowIntensity = 60,
        pulse = true,
        font,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    const s = SIZES[size] || SIZES.medium
    const from = cssToken(tok(gradientFrom)) || "#6D5EF6"
    const to = cssToken(tok(gradientTo)) || "#2DD4BF"
    const ink = cssToken(tok(textColor)) || "#FFFFFF"
    const ang = `${clamp(gradientAngle, 0, 360)}deg`
    const r = clamp(radius, 0, 999)
    const k = glow ? clamp(glowIntensity, 0, 100) / 100 : 0
    const link = typeof href === "string" && href.trim() !== "" ? href : undefined

    const rootStyle: CSSProperties = {
        position: "relative",
        display: "inline-flex",
        alignItems: "stretch",
        boxSizing: "border-box",
        width: fullWidth ? "100%" : "auto",
        height: fullWidth ? "100%" : "auto",
        margin: 0,
        padding: 0,
        border: 0,
        background: "transparent",
        borderRadius: r,
        fontFamily: fontFamilyOf(font),
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
        isolation: "isolate",
        WebkitAppearance: "none",
        appearance: "none",
        ...style,
    }

    const faceBase: CSSProperties = {
        position: "relative",
        zIndex: 1,
        flex: "1 1 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: (font && font.fontWeight) || 600,
        fontStyle: (font && font.fontStyle) || "normal",
        lineHeight: 1.2,
        color: ink,
        whiteSpace: "nowrap",
        borderRadius: "inherit",
    }

    const layer: CSSProperties = {
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        pointerEvents: "none",
    }

    const halo =
        k > 0 ? (
            <span aria-hidden="true" style={{ ...layer, zIndex: 0, opacity: 0.35 + 0.65 * k }}>
                <span
                    className={isStatic ? undefined : pulse ? "agbt-halo agbt-pulse" : "agbt-halo"}
                    style={{ ...layer, inset: 4, boxShadow: glowShadow(k, from, to) }}
                />
            </span>
        ) : null

    // 정적 렌더러: 스타일시트·hover·transition·animation 없이 같은 레이아웃의 정적 그라디언트.
    if (isStatic) {
        return (
            <span style={rootStyle}>
                {halo}
                <span style={{ ...faceBase, background: `linear-gradient(${ang}, ${from}, ${to})` }}>{label}</span>
            </span>
        )
    }

    const vars = {
        "--agbt-from": from,
        "--agbt-to": to,
        "--agbt-ang": ang,
        "--agbt-ring": from,
    } as CSSProperties

    const children = (
        <>
            <style>{CSS}</style>
            {halo}
            <span className="agbt-face" style={faceBase}>
                {label}
            </span>
        </>
    )

    if (link) {
        return (
            <a
                className="agbt"
                href={link}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                style={{ ...rootStyle, ...vars }}
            >
                {children}
            </a>
        )
    }
    return (
        <button type="button" className="agbt" style={{ ...rootStyle, ...vars }}>
            {children}
        </button>
    )
}

addPropertyControls(GradientButton, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Get Started",
        description: "Button text.",
    },
    href: {
        type: ControlType.Link,
        title: "Link",
        description: "Where the button goes. Leave empty to render a plain button.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Open the link in a new tab. Off keeps internal links in the same tab.",
    },
    gradientFrom: {
        type: ControlType.Color,
        title: "From",
        defaultValue: "#6D5EF6",
        description: "Start color of the gradient. Also used for the focus ring.",
    },
    gradientTo: {
        type: ControlType.Color,
        title: "To",
        defaultValue: "#2DD4BF",
        description: "End color of the gradient.",
    },
    gradientAngle: {
        type: ControlType.Number,
        title: "Angle",
        defaultValue: 120,
        min: 0,
        max: 360,
        step: 1,
        unit: "°",
        description: "Gradient direction in degrees.",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#FFFFFF",
        description: "Label color.",
    },
    radius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        description: "Corner radius. The glow follows the same shape.",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        controls: "basic",
        description: "Label font. Defaults to Inter / system sans.",
    },
    size: {
        type: ControlType.Enum,
        title: "Size",
        options: ["small", "medium", "large"],
        optionTitles: ["Small", "Medium", "Large"],
        defaultValue: "medium",
        description: "Padding and font size preset.",
    },
    fullWidth: {
        type: ControlType.Boolean,
        title: "Fill frame",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Stretch the button to fill its frame.",
    },
    glow: {
        type: ControlType.Boolean,
        title: "Glow",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Soft colored glow behind the button, made from the two gradient colors.",
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow intensity",
        defaultValue: 60,
        min: 0,
        max: 100,
        step: 1,
        unit: "%",
        description: "Strength and spread of the glow. 0 hides it.",
        hidden: (p: Partial<Props>) => !p.glow,
    },
    pulse: {
        type: ControlType.Boolean,
        title: "Pulse",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description: "Slowly pulse the glow. Stays still when the visitor prefers reduced motion.",
        hidden: (p: Partial<Props>) => !p.glow,
    },
})
