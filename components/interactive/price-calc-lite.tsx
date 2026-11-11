// [생성일] 2026-10-22
// [경위] 판매 진단(10-22) — 무료 체험판(Lite)으로 손님을 모아 정식판(18 Price Calculator)으로 연결. 18번 코드를 복사해 차별 기능을 뺀 무료판
// [제작] BrandingUp (https://brandingupstudio.com)
// [변경이력]
//   - 2026-10-22: 최초 생성 (18 PricingCalculator.tsx 복사 → 구간 3개 상한, 월/연 토글·Custom at Max·Compact 레이아웃·통화 서식 제어·문구 편집은 정식판 전용으로 제거)
//   - 2026-10-22: 폭 설정을 any로 바꿔 봤다가(붙여넣기 시 스티커 폭 0) 원래 any-prefer-fixed로 되돌림

import { useEffect, useId, useMemo, useState, startTransition } from "react"
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


// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface Tier {
    name?: string
    upTo?: number
    pricing?: "unit" | "flat"
    price?: number
    note?: string
}

interface CurrencyOptions {
    symbol?: string
    position?: "before" | "after"
    space?: boolean
    decimals?: number
    thousands?: "," | "." | " " | "none"
    decimal?: "." | ","
}

interface Labels {
    monthly?: string
    yearly?: string
    saveBadge?: string
    billedMonthly?: string
    billedYearly?: string
    perMonth?: string
    recommended?: string
    perUnit?: string
    savings?: string
}

interface Appearance {
    cardColor?: string
    textColor?: string
    subColor?: string
    trackColor?: string
    fillColor?: string
    thumbColor?: string
    accentColor?: string
    borderColor?: string
    radius?: number
    shadow?: boolean
}

interface PricingCalculatorLiteProps {
    title?: string
    subtitle?: string
    unitLabel?: string
    unitSingular?: string
    min?: number
    max?: number
    step?: number
    defaultValue?: number
    tiers?: Tier[]
    basePrice?: number
    showLadder?: boolean
    showMarks?: boolean
    showPerUnit?: boolean
    showSavings?: boolean
    currency?: string
    rolling?: boolean
    rollDuration?: number
    ctaText?: string
    ctaLink?: string
    ctaNewTab?: boolean
    appearance?: Appearance
    titleFont?: any
    priceFont?: any
    bodyFont?: any
    style?: CSSProperties
}

// 설치 직후 보이는 샘플 구간 (3단계 볼륨 할인)
// Lite: 구간은 최대 3개까지 사용 (정식판은 무제한)
const MAX_TIERS = 3

const SAMPLE_TIERS: Tier[] = [
    { name: "Starter", upTo: 10, pricing: "unit", price: 5, note: "For small teams" },
    { name: "Growth", upTo: 50, pricing: "unit", price: 4, note: "Most popular" },
    { name: "Scale", upTo: 200, pricing: "unit", price: 3, note: "Volume pricing" },
]

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const ROW = "1.15em" // 롤링 숫자 한 줄 높이 (lineHeight 와 같아야 함)

// 색상에 투명도 입히기 — 프레이머는 rgb()/rgba() 로도 넘기므로 HEX·rgb 둘 다 처리
function withAlpha(color: string, alpha: number) {
    const rgb = typeof color === "string" ? color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i) : null
    if (rgb) return "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ", " + alpha + ")"
    if (typeof color === "string" && color.charAt(0) === "#") {
        let h = color.slice(1)
        if (h.length === 3) h = h.split("").map((c) => c + c).join("")
        return "rgba(" + parseInt(h.slice(0, 2), 16) + ", " + parseInt(h.slice(2, 4), 16) + ", " + parseInt(h.slice(4, 6), 16) + ", " + alpha + ")"
    }
    return color
}

// 숫자 서식: 소수 자릿수 + 천 단위 구분자 + 소수점 구분자
function formatNumber(value: number, decimals: number, thousands: string, decimal: string) {
    const fixed = Math.abs(value).toFixed(decimals)
    const parts = fixed.split(".")
    const sep = thousands === "none" ? "" : thousands
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep)
    const out = parts.length > 1 ? int + decimal + parts[1] : int
    return (value < 0 ? "-" : "") + out
}

// 금액 서식: 기호 위치(앞/뒤)·공백
function formatMoney(value: number, c: Required<CurrencyOptions>) {
    const n = formatNumber(value, c.decimals, c.thousands, c.decimal)
    const gap = c.space ? " " : ""
    return c.position === "after" ? n + gap + c.symbol : c.symbol + gap + n
}

// 문자열 안의 {n} 자리표시 치환 (라벨 문구용)
function fill(template: string, n: string) {
    return template.replace("{n}", n)
}

// ─────────────────────────────────────────────
// 롤링 숫자 — 자릿수마다 0~9 세로 띠를 목표 숫자까지만 이동 (반복 없음)
// 키를 오른쪽 기준으로 매겨 자릿수가 늘어도 기존 자리는 제자리에서 굴러간다
// ─────────────────────────────────────────────
function RollingText({ text, animate, duration }: { text: string; animate: boolean; duration: number }) {
    const chars = text.split("")
    const n = chars.length
    return (
        <span aria-label={text} role="img" style={{ display: "inline-flex", whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }}>
            {chars.map((ch, i) => {
                const key = "c" + (n - i)
                if (!/\d/.test(ch)) {
                    return (
                        <span key={key} aria-hidden="true" style={{ display: "inline-block", height: ROW, lineHeight: ROW }}>
                            {ch}
                        </span>
                    )
                }
                return (
                    <span key={key} aria-hidden="true" style={{ display: "inline-block", height: ROW, overflow: "hidden", verticalAlign: "top" }}>
                        <span
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                transform: "translateY(calc(" + ROW + " * -" + ch + "))",
                                transition: animate ? "transform " + duration + "ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
                                willChange: animate ? "transform" : undefined,
                            }}
                        >
                            {DIGITS.map((d) => (
                                <span key={d} style={{ height: ROW, lineHeight: ROW }}>
                                    {d}
                                </span>
                            ))}
                        </span>
                    </span>
                )
            })}
        </span>
    )
}

/**
 * 가격 계산기 슬라이더 (Pricing Calculator) — 사용량 슬라이더 + 구간별 단위가 + 자동 추천 플랜 + 월/연 토글 + 롤링 숫자
 * 최대치에서 "Custom / Contact sales" 로 전환하는 엔터프라이즈 캡, 통화 기호·구분자 서식 제어
 *
 * @framerDisableUnlink
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 460
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function PricingCalculatorLite(props: PricingCalculatorLiteProps) {
    const {
        title = "Estimate your price",
        subtitle = "Drag the slider to match your team size.",
        unitLabel = "seats",
        unitSingular = "seat",
        tiers,
        basePrice = 0,
        showLadder = true,
        showMarks = true,
        showPerUnit = true,
        showSavings = true,
        currency = "$",
        rolling = true,
        rollDuration = 600,
        ctaText = "Get started",
        ctaLink,
        ctaNewTab = false,
        appearance,
        titleFont,
        priceFont,
        bodyFont,
        style,
    } = props

    // Lite: 아래 값들은 정식판에서만 조절 가능 (여기서는 고정값)
    const layout = "card" as "card" | "compact" // 카드형만
    const customAtMax = false as boolean // 최대치 Custom 전환 없음
    const customLabel = "Custom"
    const customCta = "Contact sales"
    const customLink = undefined as string | undefined
    const billingToggle = false as boolean // 월/연 토글 없음
    const yearlyDiscount = 0
    const defaultBilling = "monthly" as "monthly" | "yearly"
    const labels = undefined as Labels | undefined // 문구 편집 없음

    const isStatic = useIsStaticRenderer() // 캔버스·정적 렌더에서는 롤링 없이 최종값만
    const uid = "pc" + useId().replace(/[:]/g, "")
    const isCompact = layout === "compact"

    // ── 범위 정리 (min < max, step > 0) ──
    const min = Math.max(0, props.min ?? 1)
    const max = Math.max(min + 1, props.max ?? 200)
    const step = Math.max(0.01, props.step ?? 1)
    const clamp = (v: number) => {
        const snapped = min + Math.round((v - min) / step) * step
        return Math.min(max, Math.max(min, Number(snapped.toFixed(4))))
    }
    const initial = clamp(props.defaultValue ?? 25)

    // ── 상태: 슬라이더 값·결제 주기 ──
    // (슬라이더는 제어 input 이라 즉시 반영해야 썸이 튀지 않음 → startTransition 미사용. 그 외 상태는 startTransition)
    const [value, setValue] = useState(initial)
    const [billing, setBilling] = useState<"monthly" | "yearly">(defaultBilling)
    useEffect(() => {
        setValue(initial)
    }, [initial])
    useEffect(() => {
        startTransition(() => setBilling(defaultBilling))
    }, [defaultBilling])

    // ── 움직임 줄이기(prefers-reduced-motion) 감지 → 롤링 즉시 전환 ──
    const [reduceMotion, setReduceMotion] = useState(false)
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const update = () => startTransition(() => setReduceMotion(mq.matches))
        update()
        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])
    const animate = rolling && !isStatic && !reduceMotion

    // ── 설정 기본값 ──
    const cur: Required<CurrencyOptions> = {
        symbol: currency || "$",
        position: "before",
        space: false,
        decimals: 0,
        thousands: ",",
        decimal: ".",
    }
    const L: Required<Labels> = {
        monthly: labels?.monthly || "Monthly",
        yearly: labels?.yearly || "Yearly",
        saveBadge: labels?.saveBadge || "Save {n}%",
        billedMonthly: labels?.billedMonthly || "Billed monthly",
        billedYearly: labels?.billedYearly || "Billed {n} per year",
        perMonth: labels?.perMonth || "/mo",
        recommended: labels?.recommended || "Recommended plan",
        perUnit: labels?.perUnit || "{n} per",
        savings: labels?.savings || "Save {n}% vs",
    }
    const theme = {
        cardColor: appearance?.cardColor ?? "#FFFFFF",
        textColor: appearance?.textColor ?? "#111114",
        subColor: appearance?.subColor ?? "#6B6B76",
        trackColor: appearance?.trackColor ?? "#E9E9EE",
        fillColor: appearance?.fillColor ?? "#111114",
        thumbColor: appearance?.thumbColor ?? "#111114",
        accentColor: appearance?.accentColor ?? "#2DE5A0",
        borderColor: appearance?.borderColor ?? "rgba(17, 17, 20, 0.08)",
        radius: appearance?.radius ?? 20,
        shadow: appearance?.shadow ?? true,
    }
    const bodyBase: CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "1.4em", ...bodyFont }

    // ── 구간 정리: Up To 오름차순, 마지막 구간은 최대치까지 ──
    const sorted = useMemo(() => {
        const list = (tiers && tiers.length ? tiers : SAMPLE_TIERS).slice(0, MAX_TIERS).map((t, i) => ({
            name: t.name || "Plan " + (i + 1),
            upTo: Number(t.upTo ?? max),
            pricing: t.pricing === "flat" ? "flat" : "unit",
            price: Math.max(0, Number(t.price ?? 0)),
            note: t.note || "",
        }))
        list.sort((a, b) => a.upTo - b.upTo)
        list[list.length - 1].upTo = Math.max(list[list.length - 1].upTo, max)
        return list
    }, [tiers, max])

    // ── 현재 구간·가격 계산 ──
    const tierIndex = Math.max(0, sorted.findIndex((t) => value <= t.upTo))
    const tier = sorted[tierIndex]
    const isCustom = customAtMax && value >= max
    const monthly = basePrice + (tier.pricing === "flat" ? tier.price : tier.price * value)
    const discount = Math.max(0, Math.min(90, yearlyDiscount))
    const isYearly = billingToggle && billing === "yearly"
    const yearlyTotal = monthly * 12 * (1 - discount / 100)
    const shown = isYearly ? yearlyTotal / 12 : monthly // 큰 숫자는 항상 "월 환산"
    const perUnit = value > 0 ? shown / value : 0
    // 첫 구간(정가) 대비 절약률 — 첫 구간이 단위당 가격일 때만 의미 있음
    const first = sorted[0]
    const listPrice = first.pricing === "unit" ? first.price * value + basePrice : 0
    const savingsPct = listPrice > 0 && monthly < listPrice ? Math.round((1 - monthly / listPrice) * 100) : 0

    const pct = ((value - min) / (max - min)) * 100
    const unitText = value === 1 ? unitSingular : unitLabel
    const priceText = isCustom ? customLabel : formatMoney(shown, cur)
    const valueText = isCustom
        ? formatNumber(value, 0, cur.thousands, cur.decimal) + "+ " + unitLabel + ", " + customLabel
        : formatNumber(value, 0, cur.thousands, cur.decimal) + " " + unitText + ", " + priceText + " per month"

    const onSlide = (e: any) => {
        setValue(clamp(Number(e.target.value)))
    }

    // ── 스타일: 네이티브 range 슬라이더 (키보드·스크린리더 기본 지원, 24px 터치 썸) ──
    const ring = withAlpha(theme.accentColor, 0.35)
    const css = `
.${uid}-range { -webkit-appearance: none; appearance: none; width: 100%; height: 28px; margin: 0; background: transparent; cursor: pointer; outline: none; touch-action: pan-y; }
.${uid}-range::-webkit-slider-runnable-track { height: 6px; border-radius: 3px; background: linear-gradient(to right, ${theme.fillColor} 0%, ${theme.fillColor} ${pct}%, ${theme.trackColor} ${pct}%, ${theme.trackColor} 100%); }
.${uid}-range::-webkit-slider-thumb { -webkit-appearance: none; width: 24px; height: 24px; margin-top: -9px; border-radius: 50%; background: ${theme.thumbColor}; border: 3px solid ${theme.cardColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.22); transition: ${isStatic ? "none" : "transform 0.15s ease, box-shadow 0.15s ease"}; }
.${uid}-range:hover::-webkit-slider-thumb, .${uid}-range:active::-webkit-slider-thumb { transform: scale(1.12); }
.${uid}-range:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 4px ${ring}, 0 2px 8px rgba(0,0,0,0.22); }
.${uid}-range::-moz-range-track { height: 6px; border-radius: 3px; background: ${theme.trackColor}; }
.${uid}-range::-moz-range-progress { height: 6px; border-radius: 3px; background: ${theme.fillColor}; }
.${uid}-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: ${theme.thumbColor}; border: 3px solid ${theme.cardColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.22); }
.${uid}-range:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px ${ring}, 0 2px 8px rgba(0,0,0,0.22); }
.${uid}-btn { transition: ${isStatic ? "none" : "background 0.2s ease, color 0.2s ease, transform 0.15s ease, opacity 0.2s ease"}; }
.${uid}-cta:hover { transform: translateY(-1px); opacity: 0.92; }
.${uid}-root :focus-visible { outline: 2px solid ${theme.accentColor}; outline-offset: 2px; }
.${uid}-range:focus-visible { outline: none; }
`

    // ── 월/연 토글 (segmented, aria-pressed) ──
    const toggle = billingToggle && (
        <div role="group" aria-label="Billing period" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: withAlpha(theme.subColor, 0.12), gap: 2, alignSelf: isCompact ? "flex-start" : "center" }}>
            {(["monthly", "yearly"] as const).map((b) => {
                const active = billing === b
                return (
                    <button
                        key={b}
                        type="button"
                        className={uid + "-btn"}
                        aria-pressed={active}
                        onClick={() => startTransition(() => setBilling(b))}
                        style={{
                            all: "unset",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 999,
                            background: active ? theme.cardColor : "transparent",
                            color: active ? theme.textColor : theme.subColor,
                            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                            ...bodyBase,
                            fontWeight: 600,
                            fontSize: 13,
                            lineHeight: "1em",
                        }}
                    >
                        {b === "monthly" ? L.monthly : L.yearly}
                        {b === "yearly" && discount > 0 && (
                            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 7px", borderRadius: 999, background: theme.accentColor, color: "#0B0B0D", lineHeight: "1em", whiteSpace: "nowrap" }}>
                                {fill(L.saveBadge, String(discount))}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )

    // ── 슬라이더 + 구간 눈금 + 구간 사다리 ──
    const slider = (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <label htmlFor={uid + "-input"} style={{ ...bodyBase, color: theme.subColor }}>
                    {unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}
                </label>
                <span style={{ ...bodyBase, color: theme.textColor, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(value, 0, cur.thousands, cur.decimal)}
                    {isCustom ? "+" : ""} {unitText}
                </span>
            </div>
            <div style={{ position: "relative" }}>
                <input
                    id={uid + "-input"}
                    className={uid + "-range"}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onSlide}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-valuetext={valueText}
                    aria-label={unitLabel}
                />
                {/* 구간 경계 눈금 (마지막 구간 제외) */}
                {showMarks &&
                    sorted.slice(0, -1).map((t, i) => {
                        const p = ((t.upTo - min) / (max - min)) * 100
                        if (p <= 0 || p >= 100) return null
                        return (
                            <span
                                key={i}
                                aria-hidden="true"
                                style={{ position: "absolute", left: p + "%", top: 11, width: 2, height: 6, marginLeft: -1, borderRadius: 1, background: value > t.upTo ? theme.cardColor : theme.subColor, opacity: 0.7, pointerEvents: "none" }}
                            />
                        )
                    })}
            </div>
            {/* 구간 사다리: 현재 구간이 자동 강조 */}
            {showLadder && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sorted.map((t, i) => {
                        const active = i === tierIndex && !isCustom
                        const from = i === 0 ? min : sorted[i - 1].upTo + (step < 1 ? step : 1)
                        const range = i === sorted.length - 1
                            ? formatNumber(from, 0, cur.thousands, cur.decimal) + "+"
                            : formatNumber(from, 0, cur.thousands, cur.decimal) + "–" + formatNumber(t.upTo, 0, cur.thousands, cur.decimal)
                        return (
                            <span
                                key={i}
                                className={uid + "-btn"}
                                aria-current={active ? "true" : undefined}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "5px 10px",
                                    borderRadius: 999,
                                    border: "1px solid " + (active ? theme.accentColor : theme.borderColor),
                                    background: active ? withAlpha(theme.accentColor, 0.16) : "transparent",
                                    color: active ? theme.textColor : theme.subColor,
                                    ...bodyBase,
                                    fontSize: 12,
                                    lineHeight: "1em",
                                    fontWeight: active ? 700 : 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {t.name}
                                <span style={{ opacity: 0.65, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{range}</span>
                            </span>
                        )
                    })}
                </div>
            )}
        </div>
    )

    // ── 가격 패널: 추천 플랜 칩 + 큰 금액(롤링) + 결제 안내 + 단위당·절약 + CTA ──
    const perUnitText = fill(L.perUnit, formatMoney(perUnit, { ...cur, decimals: Math.max(cur.decimals, perUnit % 1 ? 2 : 0) })) + " " + unitSingular
    const link = isCustom ? customLink : ctaLink
    const ctaLabel = isCustom ? customCta : ctaText
    const price = (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: isCompact ? "flex-end" : "flex-start", textAlign: isCompact ? "right" : "left", minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, ...bodyBase, fontSize: 12, color: theme.subColor, lineHeight: "1em" }}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: theme.accentColor }} />
                {L.recommended}: <strong style={{ color: theme.textColor }}>{isCustom ? customLabel : tier.name}</strong>
                {!isCustom && tier.note ? <span style={{ opacity: 0.8 }}>· {tier.note}</span> : null}
            </span>
            <div aria-live="polite" style={{ display: "flex", alignItems: "baseline", gap: 6, color: theme.textColor, ...priceFont, lineHeight: ROW }}>
                <RollingText text={priceText} animate={animate} duration={Math.max(100, rollDuration)} />
                {!isCustom && <span style={{ ...bodyBase, color: theme.subColor, fontWeight: 500 }}>{L.perMonth}</span>}
            </div>
            {!isCustom && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, ...bodyBase, fontSize: 13, color: theme.subColor }}>
                    <span>{isYearly ? fill(L.billedYearly, formatMoney(yearlyTotal, cur)) : L.billedMonthly}</span>
                    {(showPerUnit || (showSavings && savingsPct > 0)) && (
                        <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: isCompact ? "flex-end" : "flex-start" }}>
                            {showPerUnit && tier.pricing === "unit" && <span style={{ fontVariantNumeric: "tabular-nums" }}>{perUnitText}</span>}
                            {showSavings && savingsPct > 0 && (
                                <span style={{ color: theme.textColor, fontWeight: 600 }}>
                                    {showPerUnit && tier.pricing === "unit" ? "· " : ""}
                                    {fill(L.savings, String(savingsPct))} {first.name}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}
            <a
                className={uid + "-btn " + uid + "-cta"}
                href={link || undefined}
                target={ctaNewTab ? "_blank" : undefined}
                rel={ctaNewTab ? "noopener noreferrer" : undefined}
                role={link ? undefined : "button"}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 6,
                    padding: "13px 22px",
                    borderRadius: Math.min(theme.radius, 14),
                    background: isCustom ? theme.textColor : theme.accentColor,
                    color: isCustom ? theme.cardColor : "#0B0B0D",
                    textDecoration: "none",
                    cursor: "pointer",
                    width: isCompact ? "auto" : "100%",
                    boxSizing: "border-box",
                    ...bodyBase,
                    fontWeight: 700,
                    fontSize: 15,
                    lineHeight: "1em",
                }}
            >
                {ctaLabel}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
            </a>
        </div>
    )

    return (
        <section
            className={uid + "-root"}
            aria-label={title || "Pricing calculator"}
            style={{
                ...style,
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: isCompact ? 20 : 22,
                padding: isCompact ? 0 : 28,
                background: isCompact ? "transparent" : theme.cardColor,
                border: isCompact ? "none" : "1px solid " + theme.borderColor,
                borderRadius: isCompact ? 0 : theme.radius,
                boxShadow: isCompact || !theme.shadow ? "none" : "0 18px 40px -24px rgba(0,0,0,0.3)",
                color: theme.textColor,
            }}
        >
            <style>{css}</style>

            {/* 머리글 + 토글 */}
            {(title || subtitle || billingToggle) && (
                <div style={{ display: "flex", flexDirection: isCompact ? "row" : "column", justifyContent: "space-between", alignItems: isCompact ? "center" : "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        {title && <h3 style={{ margin: 0, color: theme.textColor, ...titleFont }}>{title}</h3>}
                        {subtitle && <p style={{ margin: 0, ...bodyBase, color: theme.subColor }}>{subtitle}</p>}
                    </div>
                    {toggle}
                </div>
            )}

            {/* 본문: 카드는 세로, 컴팩트는 가로 (좁으면 자동 줄바꿈) */}
            <div style={{ display: "flex", flexDirection: isCompact ? "row" : "column", flexWrap: isCompact ? "wrap" : "nowrap", gap: isCompact ? 32 : 22, alignItems: isCompact ? "center" : "stretch" }}>
                <div style={{ flex: isCompact ? "1 1 280px" : "0 0 auto", minWidth: 0 }}>{slider}</div>
                <div style={{ flex: isCompact ? "0 1 auto" : "0 0 auto", minWidth: 0 }}>{price}</div>
            </div>
        </section>
    )
}

PricingCalculatorLite.displayName = "Price Calculator Lite"

addPropertyControls(PricingCalculatorLite, {
    title: { type: ControlType.String, title: "Title", defaultValue: "Estimate your price" },
    subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: "Drag the slider to match your team size." },
    unitLabel: { type: ControlType.String, title: "Unit Label", defaultValue: "seats", placeholder: "seats, users, credits…" },
    unitSingular: { type: ControlType.String, title: "Unit Singular", defaultValue: "seat" },
    min: { type: ControlType.Number, title: "Min", defaultValue: 1, min: 0, max: 1000000, step: 1 },
    max: { type: ControlType.Number, title: "Max", defaultValue: 200, min: 1, max: 1000000, step: 1 },
    step: { type: ControlType.Number, title: "Step", defaultValue: 1, min: 0.01, max: 100000, step: 1 },
    defaultValue: { type: ControlType.Number, title: "Default", defaultValue: 25, min: 0, max: 1000000, step: 1 },
    tiers: {
        type: ControlType.Array,
        title: "Tiers",
        maxCount: MAX_TIERS, // Lite 상한
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Plan", defaultValue: "Plan" },
                upTo: { type: ControlType.Number, title: "Up To", defaultValue: 50, min: 0, max: 1000000, step: 1 },
                pricing: { type: ControlType.Enum, title: "Pricing", options: ["unit", "flat"], optionTitles: ["Per unit", "Flat"], defaultValue: "unit", displaySegmentedControl: true },
                price: { type: ControlType.Number, title: "Price", defaultValue: 4, min: 0, max: 10000000, step: 0.01, displayStepper: true },
                note: { type: ControlType.String, title: "Note", defaultValue: "", placeholder: "Most popular" },
            },
        },
        defaultValue: SAMPLE_TIERS,
    },
    basePrice: { type: ControlType.Number, title: "Base Price", defaultValue: 0, min: 0, max: 10000000, step: 1 },
    showLadder: { type: ControlType.Boolean, title: "Tier Ladder", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showMarks: { type: ControlType.Boolean, title: "Tier Marks", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showPerUnit: { type: ControlType.Boolean, title: "Per-Unit Price", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    showSavings: { type: ControlType.Boolean, title: "Savings", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    currency: { type: ControlType.String, title: "Currency", defaultValue: "$" },
    rolling: { type: ControlType.Boolean, title: "Rolling Numbers", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    rollDuration: { type: ControlType.Number, title: "Roll Duration", defaultValue: 600, min: 100, max: 2000, step: 50, unit: "ms", hidden: (p: any) => !p.rolling },
    ctaText: { type: ControlType.String, title: "CTA Text", defaultValue: "Get started" },
    ctaLink: { type: ControlType.Link, title: "CTA Link" },
    ctaNewTab: { type: ControlType.Boolean, title: "New Tab", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    appearance: {
        type: ControlType.Object,
        title: "Style",
        icon: "color",
        controls: {
            cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FFFFFF" },
            textColor: { type: ControlType.Color, title: "Text", defaultValue: "#111114" },
            subColor: { type: ControlType.Color, title: "Sub Text", defaultValue: "#6B6B76" },
            trackColor: { type: ControlType.Color, title: "Track", defaultValue: "#E9E9EE" },
            fillColor: { type: ControlType.Color, title: "Fill", defaultValue: "#111114" },
            thumbColor: { type: ControlType.Color, title: "Thumb", defaultValue: "#111114" },
            accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#2DE5A0" },
            borderColor: { type: ControlType.Color, title: "Border", defaultValue: "rgba(17, 17, 20, 0.08)" },
            radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 48, step: 1, unit: "px" },
            shadow: { type: ControlType.Boolean, title: "Shadow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "20px", variant: "Semibold", lineHeight: "1.25em", letterSpacing: "-0.01em" },
    },
    priceFont: {
        type: ControlType.Font,
        title: "Price Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "48px", variant: "Bold", lineHeight: "1.15em", letterSpacing: "-0.03em" },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "14px", variant: "Regular", lineHeight: "1.4em" },
        description: "Created by BrandingUp",
    },
})
