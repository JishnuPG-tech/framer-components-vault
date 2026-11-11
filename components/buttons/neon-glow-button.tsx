//@framerDisableUnlink

/*
 * [구현 가정 사항]
 * 1. Framer 스킬 가이드(framer-code-components-overrides) 표준을 준수한 코드 컴포넌트입니다.
 *    - SSR/하이드레이션 안전성(isClient) 및 Framer RenderTarget(캔버스/프리뷰)을 지원합니다.
 *    - 렌더링 성능 최적화를 위해 마우스 좌표는 CSS 커스텀 프로퍼티(--mouse-x, --mouse-y)로 직접 업데이트합니다.
 * 2. [확인 필요] 상시 다방향 네온 그린 인터랙션 (Idle):
 *    - 마우스를 올리지 않아도 테두리와 표면에 360도 회전하는 Conic/Radial 네온 앰비언트 그래디언트가 지속적으로 흐르며 여러 방향으로 빛을 발산합니다.
 * 3. [확인 필요] 마우스 호버 인터랙션 (Hover):
 *    - 마우스를 가져다대면 커서 위치 좌표로 스팟 네온 라이트가 집중되며 그쪽 방향으로 빛이 실시간으로 이동 및 강화됩니다.
 * 4. [확인 필요] 클릭 압력 인터랙션 (Click / Pressed):
 *    - 마우스 클릭(Down) 시 버튼이 약 1.06배로 커지면서 강한 압력이 가해지는 듯한 내부 음영(inset shadow)과 농축된 네온 발광 효과가 적용됩니다.
 *    - 마우스 릴리즈 시 탄성 바운스(cubic-bezier)로 기분 좋게 텐션 있게 복귀합니다.
 * 5. loading, complete 상태를 완전히 제거하고 단일 default 버튼 구조로 단순화했습니다.
 * 6. 사용자 문구 커스텀(text prop)을 지원하며 기본 문구는 "Button"입니다.
 * 7. 사용자 규칙 준수: 이모지 금지, Pretendard/시스템 산세리프 및 굵기 400/500 사용, 폰트 11px 이상.
 */

import type {
    CSSProperties,
    ReactElement,
    PointerEvent as ReactPointerEvent,
} from "react"
import {
    useState,
    useEffect,
    useRef,
    useCallback,
    startTransition,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


export interface RealComponent1Props {
    text?: string
    backgroundColor?: string
    neonColor?: string
    textColor?: string
    style?: CSSProperties
    className?: string
}

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function Real_component_1(
    props: RealComponent1Props
): ReactElement {
    const {
        text = "Button",
        backgroundColor = "#000000",
        neonColor = "#00ff66", // 네온 그린
        textColor = "#ffffff",
        style,
        className,
    } = props

    // 1. Framer 하이드레이션 안전성
    const [isClient, setIsClient] = useState<boolean>(false)
    useEffect(() => {
        setIsClient(true)
    }, [])

    // 2. Framer RenderTarget 감지
    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    // 마우스 호버 및 클릭 압력(Pressed) 상태
    const [isHovered, setIsHovered] = useState<boolean>(false)
    const [isPressed, setIsPressed] = useState<boolean>(false)

    // 마우스 좌표 추적 참조
    const buttonWrapperRef = useRef<HTMLDivElement | null>(null)

    // 마우스 이동 시: CSS 변수를 직접 업데이트하여 리렌더링 없이 초당 60fps 네온 빛 추적
    const handlePointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            const wrapper = buttonWrapperRef.current
            if (!wrapper) return

            const rect = wrapper.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            wrapper.style.setProperty("--mouse-x", `${x}px`)
            wrapper.style.setProperty("--mouse-y", `${y}px`)
        },
        []
    )

    const handlePointerEnter = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            const wrapper = buttonWrapperRef.current
            if (wrapper) {
                const rect = wrapper.getBoundingClientRect()
                wrapper.style.setProperty(
                    "--mouse-x",
                    `${e.clientX - rect.left}px`
                )
                wrapper.style.setProperty(
                    "--mouse-y",
                    `${e.clientY - rect.top}px`
                )
            }
            startTransition(() => {
                setIsHovered(true)
            })
        },
        []
    )

    const handlePointerLeave = useCallback(() => {
        startTransition(() => {
            setIsHovered(false)
            setIsPressed(false)
        })
    }, [])

    const handlePointerDown = useCallback(() => {
        startTransition(() => {
            setIsPressed(true)
        })
    }, [])

    const handlePointerUp = useCallback(() => {
        startTransition(() => {
            setIsPressed(false)
        })
    }, [])

    return (
        <div
            className={className}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 200,
                minHeight: 100,
                backgroundColor: backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                boxSizing: "border-box",
                overflow: "hidden",
                userSelect: "none",
                WebkitUserSelect: "none",
                fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
                ...style,
            }}
        >
            {/* 네온 회전 및 앰비언트 광원 애니메이션 스타일 */}
            <style>{`
                @property --neon-angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                @keyframes rotateNeonOrbit {
                    0% {
                        --neon-angle: 0deg;
                        transform: rotate(0deg);
                    }
                    100% {
                        --neon-angle: 360deg;
                        transform: rotate(360deg);
                    }
                }

                @keyframes ambientMultiPulse {
                    0% {
                        opacity: 0.55;
                        transform: scale(0.98);
                    }
                    50% {
                        opacity: 0.9;
                        transform: scale(1.02);
                    }
                    100% {
                        opacity: 0.55;
                        transform: scale(0.98);
                    }
                }
            `}</style>

            {/* 
              버튼 외곽 래퍼 (마우스 추적 및 회전 네온 테두리)
            */}
            <div
                ref={buttonWrapperRef}
                onPointerMove={handlePointerMove}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                style={{
                    position: "relative",
                    width: "fit-content",
                    padding: "1.5px", // 테두리 두께
                    borderRadius: "100px",
                    overflow: "hidden",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    // 클릭 시 커지면서 탄성 있는 스케일 변화
                    transform: isPressed
                        ? "scale(1.06)"
                        : isHovered
                          ? "scale(1.02)"
                          : "scale(1)",
                    transition: isPressed
                        ? "transform 0.12s cubic-bezier(0.15, 0.9, 0.3, 1.2)"
                        : "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    willChange: "transform",
                }}
            >
                {/* 
                  1. 상시 다방향 네온 그래디언트 회전 레이어 (Idle 앰비언트)
                  - 마우스를 올리지 않아도 360도로 여러 방향으로 네온 그린 컬러가 순환 회전함
                */}
                <div
                    style={{
                        position: "absolute",
                        inset: "-100%",
                        pointerEvents: "none",
                        background: `conic-gradient(from 0deg, transparent 0deg, ${neonColor} 70deg, transparent 140deg, rgba(0, 255, 102, 0.4) 220deg, ${neonColor} 290deg, transparent 360deg)`,
                        animation: "rotateNeonOrbit 4s linear infinite",
                        opacity: isHovered ? 0.4 : 0.85,
                        transition: "opacity 0.3s ease",
                        willChange: "transform, opacity",
                    }}
                />

                {/* 
                  2. 다방향 앰비언트 글로우 블렌딩 레이어
                  - 버튼 상하좌우 여러 방향에서 네온 그린 광채가 퍼지도록 보조
                */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "100px",
                        pointerEvents: "none",
                        background: `radial-gradient(circle at 15% 50%, rgba(0, 255, 102, 0.5) 0%, transparent 60%), radial-gradient(circle at 85% 50%, rgba(0, 255, 102, 0.5) 0%, transparent 60%)`,
                        animation: "ambientMultiPulse 3s ease-in-out infinite",
                        opacity: isHovered ? 0.3 : 0.7,
                        transition: "opacity 0.3s ease",
                    }}
                />

                {/* 
                  3. 마우스 호버 시 커서 방향 네온 집중 레이어 (Hover 스팟라이트)
                  - 마우스를 가져다대면 마우스가 위치한 곳으로 네온 그린 색상이 진하게 이동/집중됨
                */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "100px",
                        pointerEvents: "none",
                        opacity: isHovered ? 1 : 0,
                        transition: "opacity 0.25s ease",
                        background: `radial-gradient(circle 95px at var(--mouse-x, 50%) var(--mouse-y, 50%), ${neonColor} 0%, rgba(0, 255, 102, 0.4) 45%, transparent 75%)`,
                        willChange: "background, opacity",
                    }}
                />

                {/* 
                  4. 버튼 본체 (반투명 글래스 + 클릭 압력 햅틱 인터랙션)
                */}
                <button
                    type="button"
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "120px",
                        height: "42px",
                        padding: "0 28px",
                        borderRadius: "100px",
                        // 클릭 압력 가해질 때 더 깊어지는 글래스 배경
                        backgroundColor: isPressed
                            ? "rgba(0, 255, 102, 0.12)"
                            : "rgba(255, 255, 255, 0.08)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxSizing: "border-box",
                        overflow: "hidden",
                        // 클릭 압력(Click Pressure) 시 깊은 내부 음영과 외곽 네온 발광 폭발
                        boxShadow: isPressed
                            ? "inset 0 3px 8px rgba(0, 0, 0, 0.7), inset 0 0 14px rgba(0, 255, 102, 0.5), 0 0 24px rgba(0, 255, 102, 0.65)"
                            : isHovered
                              ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), 0 0 16px rgba(0, 255, 102, 0.3)"
                              : "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), 0 0 10px rgba(0, 255, 102, 0.15)",
                        transition:
                            "background-color 0.2s ease, box-shadow 0.18s ease, transform 0.18s ease",
                    }}
                >
                    {/* 버튼 내부 마우스 방향 네온 표면 굴절광 */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "100px",
                            pointerEvents: "none",
                            opacity: isHovered ? 1 : 0.3,
                            transition: "opacity 0.25s ease",
                            background: isHovered
                                ? `radial-gradient(circle 85px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0, 255, 102, 0.35) 0%, rgba(0, 255, 102, 0.08) 60%, transparent 80%)`
                                : `radial-gradient(circle 80px at 50% 50%, rgba(0, 255, 102, 0.18) 0%, transparent 70%)`,
                            willChange: "background, opacity",
                        }}
                    />

                    {/* 클릭 압력 시 표면에 순간 번지는 충격광 (Ripple Pressure Glow) */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "100px",
                            pointerEvents: "none",
                            backgroundColor: "rgba(0, 255, 102, 0.22)",
                            opacity: isPressed ? 1 : 0,
                            transition: "opacity 0.1s ease",
                        }}
                    />

                    {/* 버튼 텍스트 (사용자 정의 문구, 기본값 "Button") */}
                    <span
                        style={{
                            position: "relative",
                            zIndex: 3,
                            display: "inline-block",
                            color: textColor,
                            fontSize: "14px",
                            fontWeight: 500,
                            letterSpacing: "-0.2px",
                            // 클릭 압력 시 텍스트가 약간 안쪽으로 가라앉는 듯한 미세 뎁스 연출
                            transform: isPressed
                                ? "scale(0.97) translateY(0.5px)"
                                : "scale(1)",
                            textShadow: isPressed
                                ? "0 0 12px rgba(0, 255, 102, 0.8), 0 1px 3px rgba(0, 0, 0, 0.8)"
                                : isHovered
                                  ? "0 0 8px rgba(0, 255, 102, 0.45)"
                                  : "none",
                            transition:
                                "transform 0.12s ease, text-shadow 0.2s ease, color 0.3s ease",
                        }}
                    >
                        {text}
                    </span>
                </button>
            </div>
        </div>
    )
}

Real_component_1.displayName = "Interactive Neon Glow Button"

Real_component_1.defaultProps = {
    text: "Button",
    backgroundColor: "#000000",
    neonColor: "#00ff66",
    textColor: "#ffffff",
}

addPropertyControls(Real_component_1, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Button",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background Color",
        defaultValue: "#000000",
    },
    neonColor: {
        type: ControlType.Color,
        title: "Button Color",
        defaultValue: "#00ff66",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
})
