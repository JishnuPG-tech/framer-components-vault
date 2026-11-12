import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useCallback, useEffect, useId, useRef, useState } from "react"
import type { CSSProperties } from "react"

// Gooey Glass Nav — 원형 토글에서 유리 메뉴 박스가 끈적하게(gooey) 짜내지듯 솟아났다가,
// 멈추면 원과 분리된 글래스모피즘 박스로 안착한다.

type NavItem = { label: string; link?: string }

// 유리 재질(고정) — 반투명 흰색 + 이중 inset 베벨. GLASS_ALPHA를 goo 레이어에도 씌워
// 흘러내리는 젤리를 유리와 같은 투명도로 보이게 한다(불투명→투명 이음새 제거).
const GLASS_SURFACE = "rgba(255,255,255,0.3)"
const GLASS_ALPHA = 0.3
const RIM_HI = "rgba(255,255,255,0.6)"
const RIM_LO = "rgba(255,255,255,0.25)"
const GOO_FILL = "#ffffff" // goo 블롭 색 — 필터가 뭉치려면 불투명이어야 함
const HOVER_SPRING = { type: "spring", stiffness: 350, damping: 20 } as const

// 레이아웃 상수
const PANEL_RADIUS = 18 // 패널 모서리(원형 토글과 어울리게)
const PANEL_PAD = 24 // 패널 안쪽 여백(상·하·좌·우 동일)
const ITEM_GAP = 8 // 메뉴 항목 사이 간격
const PANEL_ANCHOR_RATIO = 1 // 패널 코너를 원 대각선 밖으로 미는 배율(circleSize 기준). ~0.86 아래면 원과 겹침

const tok = (v: any) =>
    v && typeof v === "object" && "value" in v ? v.value : v

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 48
 * @framerIntrinsicHeight 48
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function GooeyGlassNav(props) {
    const { style, items, circleSize, ink, blur, itemFont } = props

    const [open, setOpen] = useState(false)
    const [morphing, setMorphing] = useState(false)
    const navRef = useRef<HTMLElement>(null)
    const morphTimer = useRef<number>()
    // reduced-motion 사용자 + 정적 렌더(캔버스 썸네일/익스포트)에선 애니메이션 정지 — 캔버스 성능(반려 방지)
    const reduceMotion = useReducedMotion() || useIsStaticRenderer()

    // 유니크 id — 복수 배치 시 goo 필터 / 스코프 CSS 충돌 방지
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "")
    const gooId = `goo-${uid}`
    const scope = `gn-${uid}`

    const inkC = tok(ink)
    const iconSize = Math.round(circleSize * 0.42) // 토글 아이콘 — 원 크기 비례(48→20)
    // 패널 우상단 코너를 원 대각선(좌하) 바깥에 띄워 배치 — 겹치지 않고 코너만 닿는다.
    // goo 늘어나는 방향(대각선)과 최종 위치가 일치.
    const panelAnchor = Math.round(circleSize * PANEL_ANCHOR_RATIO)
    const panelRight = panelAnchor
    const panelTop = panelAnchor

    // 패널·항목을 글자에 맞춘다: 행 높이는 글자에 hug, 항목 사이는 gap, 패널 안쪽은 균일
    // 패딩. 너비는 가장 긴 라벨에서 추정(180~460 clamp). 측정 없는 동기 계산이라 닫힘
    // 상태에서도 모핑 타깃 크기를 안다.
    const fontPx = parseFloat(itemFont?.fontSize) || 18
    const rowHeight = Math.round(fontPx * 1.5) // 글자에 맞춘 행 높이
    const longest = items.reduce(
        (m: number, it: NavItem) => Math.max(m, (it.label || "").length),
        0
    )
    const panelWidth = Math.max(
        200,
        Math.min(460, Math.ceil(longest * fontPx * 0.62 + PANEL_PAD * 2))
    )
    const panelHeight =
        PANEL_PAD * 2 +
        items.length * rowHeight +
        Math.max(0, items.length - 1) * ITEM_GAP
    const originX = panelWidth - circleSize / 2 + panelRight // 모핑 원점 = 원 중심(패널 우상단 코너)
    const originY = -(panelTop - circleSize / 2)

    const glass: CSSProperties = {
        background: GLASS_SURFACE,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        boxShadow: `inset 1px 1px 1px 0 ${RIM_HI}, inset -1px -1px 1px 0 ${RIM_LO}`,
    }

    const changeOpen = useCallback(
        (next: boolean) => {
            setOpen(next)
            if (reduceMotion) return
            setMorphing(true)
            if (morphTimer.current) clearTimeout(morphTimer.current)
            morphTimer.current = window.setTimeout(
                () => setMorphing(false),
                next ? 450 : 475
            )
        },
        [reduceMotion]
    )

    // 바깥 클릭 / Esc → 닫힘
    useEffect(() => {
        if (!open) return
        const onPointer = (e: PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node))
                changeOpen(false)
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") changeOpen(false)
        }
        window.addEventListener("pointerdown", onPointer)
        window.addEventListener("keydown", onKey)
        return () => {
            window.removeEventListener("pointerdown", onPointer)
            window.removeEventListener("keydown", onKey)
        }
    }, [open, changeOpen])

    useEffect(
        () => () => {
            if (morphTimer.current) clearTimeout(morphTimer.current)
        },
        []
    )

    const openSpring = reduceMotion
        ? { duration: 0.001 }
        : ({ type: "spring", stiffness: 190, damping: 21, mass: 1 } as const)

    return (
        <nav
            ref={navRef}
            aria-label="Main menu"
            style={{
                ...style,
                position: "relative",
                width: circleSize,
                height: circleSize,
                overflow: "visible",
                pointerEvents: "auto",
            }}
        >
            <style>{`
                .${scope} .gn-circle:focus-visible { box-shadow: 0 0 0 2px ${RIM_HI}; outline: none; }
            `}</style>

            <div className={scope}>
                {/* gooey 필터 — 인접 블롭들을 끈적하게 하나로 뭉친다(화면엔 안 보임) */}
                <svg
                    aria-hidden="true"
                    style={{ position: "absolute", width: 0, height: 0 }}
                    focusable="false"
                >
                    <defs>
                        <filter id={gooId}>
                            <feGaussianBlur
                                in="SourceGraphic"
                                stdDeviation="8"
                                result="blur"
                            />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -13"
                                result="goo"
                            />
                            <feComposite
                                in="SourceGraphic"
                                in2="goo"
                                operator="atop"
                            />
                        </filter>
                    </defs>
                </svg>

                {/* goo 블롭 레이어 — 전환 중 액체 목만 담당. 레이어 opacity를 유리와 같게 씌워
                    젤리가 유리와 같은 투명도로 흐르게 한다(진해짐/이음새 제거). */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        opacity: GLASS_ALPHA,
                        pointerEvents: "none",
                        filter: `url(#${gooId})`,
                    }}
                >
                    <motion.span
                        style={{
                            position: "absolute",
                            right: panelRight,
                            top: panelTop,
                            display: "block",
                            width: panelWidth,
                            height: panelHeight,
                            transformOrigin: `${originX}px ${originY}px`,
                            borderRadius: PANEL_RADIUS,
                            background: GOO_FILL,
                        }}
                        initial={false}
                        animate={
                            open
                                ? { scale: 1, opacity: 0 }
                                : { scale: 0.02, opacity: 1 }
                        }
                        transition={{
                            scale: open
                                ? openSpring
                                : reduceMotion
                                  ? { duration: 0.001 }
                                  : {
                                        duration: 0.4,
                                        ease: [0.4, 0.05, 0.55, 1],
                                    },
                            opacity: open
                                ? {
                                      delay: reduceMotion ? 0 : 0.22,
                                      duration: reduceMotion ? 0.001 : 0.12,
                                  }
                                : { duration: reduceMotion ? 0.001 : 0.1 },
                        }}
                    />
                    <motion.span
                        style={{
                            position: "absolute",
                            right: 0,
                            top: 0,
                            display: "block",
                            width: circleSize,
                            height: circleSize,
                            borderRadius: "50%",
                            background: GOO_FILL,
                        }}
                        initial={false}
                        animate={{ opacity: morphing ? 1 : 0 }}
                        transition={{
                            duration: reduceMotion ? 0 : morphing ? 0 : 0.16,
                        }}
                    />
                </div>

                {/* 유리 패널 — 멈춘 상태의 실제 박스 */}
                <motion.div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: panelRight,
                        top: panelTop,
                        width: panelWidth,
                        height: panelHeight,
                        borderRadius: PANEL_RADIUS,
                        pointerEvents: "none",
                        ...glass,
                    }}
                    initial={false}
                    animate={{ opacity: open ? 1 : 0 }}
                    transition={{
                        delay: open ? (reduceMotion ? 0 : 0.22) : 0,
                        duration: reduceMotion ? 0.001 : open ? 0.14 : 0.12,
                    }}
                />

                {/* 유리 원 — 토글 바탕. 끈적이는 중엔 숨겨 goo 원 블롭에 자리를 넘긴다(딱딱한
                    테두리와 goo가 겹쳐 쪼개져 보이는 것 방지). 멈추면 다시 등장. */}
                <motion.span
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        display: "block",
                        width: circleSize,
                        height: circleSize,
                        borderRadius: "50%",
                        pointerEvents: "none",
                        ...glass,
                    }}
                    initial={false}
                    animate={{ opacity: morphing ? 0 : 1 }}
                    transition={{
                        duration: reduceMotion ? 0 : morphing ? 0.08 : 0.16,
                    }}
                />

                {/* 토글 버튼 (햄버거 ↔ X) — 호버 부풀기 + 클릭 눌림(젤리 스퀴시) */}
                <motion.button
                    type="button"
                    className="gn-circle"
                    onClick={() => changeOpen(!open)}
                    aria-expanded={open}
                    aria-label={open ? "Close menu" : "Open menu"}
                    style={toggleButtonStyle(circleSize, inkC)}
                    whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    transition={HOVER_SPRING}
                >
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        aria-hidden="true"
                    >
                        <motion.line
                            initial={false}
                            animate={
                                open
                                    ? {
                                          x1: 7.76,
                                          y1: 7.76,
                                          x2: 16.24,
                                          y2: 16.24,
                                      }
                                    : { x1: 6, y1: 9.5, x2: 18, y2: 9.5 }
                            }
                            transition={{
                                duration: reduceMotion ? 0 : 0.45,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        />
                        <motion.line
                            initial={false}
                            animate={
                                open
                                    ? {
                                          x1: 16.24,
                                          y1: 7.76,
                                          x2: 7.76,
                                          y2: 16.24,
                                      }
                                    : { x1: 6, y1: 14.5, x2: 18, y2: 14.5 }
                            }
                            transition={{
                                duration: reduceMotion ? 0 : 0.45,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                        />
                    </svg>
                </motion.button>

                {/* 메뉴 항목 */}
                <AnimatePresence>
                    {open && (
                        <motion.ul
                            style={{
                                position: "absolute",
                                right: panelRight + PANEL_PAD,
                                top: panelTop + PANEL_PAD,
                                width: panelWidth - PANEL_PAD * 2,
                                display: "flex",
                                flexDirection: "column",
                                gap: ITEM_GAP,
                                margin: 0,
                                padding: 0,
                                listStyle: "none",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                transition: {
                                    delay: reduceMotion ? 0 : 0.28,
                                    duration: 0.18,
                                },
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.14 },
                            }}
                        >
                            {items.map((item: NavItem, i: number) => (
                                <motion.li
                                    key={i}
                                    initial={
                                        reduceMotion
                                            ? { opacity: 0 }
                                            : { opacity: 0, y: 6 }
                                    }
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: reduceMotion
                                            ? { duration: 0.001 }
                                            : {
                                                  delay: 0.3 + 0.035 * i,
                                                  duration: 0.17,
                                                  ease: [0.16, 1, 0.3, 1],
                                              },
                                    }}
                                >
                                    <motion.a
                                        href={item.link || "#"}
                                        onClick={() => changeOpen(false)}
                                        tabIndex={open ? 0 : -1}
                                        whileHover={
                                            reduceMotion ? undefined : { x: 8 }
                                        }
                                        whileFocus={
                                            reduceMotion ? undefined : { x: 8 }
                                        }
                                        transition={HOVER_SPRING}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            height: rowHeight,
                                            width: "100%",
                                            color: inkC,
                                            textDecoration: "none",
                                            whiteSpace: "nowrap",
                                            boxSizing: "border-box",
                                            ...itemFont,
                                        }}
                                    >
                                        {item.label}
                                    </motion.a>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    )
}

function toggleButtonStyle(size: number, ink: string): CSSProperties {
    return {
        position: "absolute",
        right: 0,
        top: 0,
        display: "grid",
        placeItems: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: ink,
        cursor: "pointer",
        padding: 0,
    }
}

GooeyGlassNav.defaultProps = {
    items: [
        { label: "Menu", link: "" },
        { label: "Menu", link: "" },
        { label: "Menu", link: "" },
        { label: "Menu", link: "" },
    ],
    circleSize: 48,
    ink: "#1d1d1f",
    blur: 8,
    itemFont: {
        fontFamily: "Inter",
        fontWeight: 300,
        fontSize: 18,
        lineHeight: "1.2em",
    },
}

addPropertyControls(GooeyGlassNav, {
    items: {
        type: ControlType.Array,
        title: "Menu",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Menu",
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
    },
    ink: {
        type: ControlType.Color,
        title: "Text & icon",
        defaultValue: "#1d1d1f",
    },
    blur: {
        type: ControlType.Number,
        title: "Blur",
        defaultValue: 8,
        min: 0,
        max: 10,
        step: 1,
        unit: "px",
        description:
            "Frosted-glass strength — how much the background behind the menu is blurred. Raise it over busy photos, lower it on flat backgrounds.",
    },
    itemFont: {
        type: ControlType.Font,
        title: "Menu font",
        controls: "extended",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 300,
            fontSize: 18,
            lineHeight: "1.2em",
        },
    },
    circleSize: {
        type: ControlType.Number,
        title: "Circle size",
        defaultValue: 48,
        min: 36,
        max: 72,
        step: 1,
        unit: "px",
        description:
            "Explore more components at [mx.bear](https://www.framer.com/%40mxbear/?tab=marketplace)",
    },
})
