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

import { motion, useReducedMotion } from "framer-motion"

const ContraSVG = ({ fill }: { fill: string }) => {
    return (
        <svg
            fill="none"
            height="28"
            viewBox="0 0 40 40"
            width="28"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
        >
            <path
                clipRule="evenodd"
                d="M20.8107 19.0432H33.3399C33.4819 19.0432 33.5969 18.9281 33.5969 18.7862V18.4019C33.5969 18.2847 33.5176 18.1825 33.404 18.153C27.5285 16.6434 22.9181 12.0599 21.3712 6.19175C21.3413 6.07891 21.2392 6 21.1227 6H20.8107C20.6688 6 20.5537 6.11505 20.5537 6.25701V18.7862C20.5537 18.9281 20.6688 19.0432 20.8107 19.0432Z"
                fill={fill}
                fillRule="evenodd"
            />
            <path
                clipRule="evenodd"
                d="M20.8107 33.5811H21.195C21.3122 33.5811 21.4147 33.5019 21.4439 33.3883C22.9535 27.5131 27.537 22.9023 33.4055 21.3555C33.5184 21.3256 33.5969 21.2235 33.5969 21.1069V20.795C33.5969 20.6534 33.4819 20.5383 33.3399 20.5383H20.8107C20.6688 20.5383 20.5537 20.6534 20.5537 20.795V33.3241C20.5537 33.4661 20.6688 33.5811 20.8107 33.5811Z"
                fill={fill}
                fillRule="evenodd"
            />
            <path
                clipRule="evenodd"
                d="M18.4742 33.5815H18.7858C18.9278 33.5815 19.0428 33.4665 19.0428 33.3241V20.7953C19.0428 20.6534 18.9278 20.5383 18.7858 20.5383H6.25701C6.11505 20.5383 6 20.6534 6 20.7953V21.1792C6 21.2968 6.07928 21.399 6.19285 21.4285C12.068 22.9381 16.6788 27.5212 18.2257 33.3898C18.2556 33.5026 18.3573 33.5815 18.4742 33.5815Z"
                fill={fill}
                fillRule="evenodd"
            />
            <path
                clipRule="evenodd"
                d="M6.25701 19.0432H18.7858C18.9278 19.0432 19.0428 18.9281 19.0428 18.7862V6.25701C19.0428 6.11505 18.9278 6 18.7858 6H18.4019C18.2847 6 18.1822 6.07965 18.153 6.19322C16.643 12.0684 12.0599 16.6792 6.19138 18.2261C6.07854 18.2556 6 18.3577 6 18.4746V18.7862C6 18.9281 6.11505 19.0432 6.25701 19.0432Z"
                fill={fill}
                fillRule="evenodd"
            />
        </svg>
    )
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min

const prefersReducedMotionDOM = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

/**
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 *
 * @framerDisableUnlink
 */
export default function ContraProductButton(props) {
    const { label, href, mode, styleVariant } = props
    const [isHovering, setIsHovering] = React.useState(false)
    const reduceMotion = useReducedMotion()

    const isBlobs = styleVariant === "Blobs"

    // -------- PRESET: EXACT per original component --------
    const PRESET = isBlobs
        ? mode === "Light"
            ? {
                  bg: "#FFFFFF",
                  bgHover: "#F5F6F9",
                  text: "#222834",
                  textHover: "#222834",
                  borderColor: "rgba(0,0,0,0.08)",
                  borderColorHover: "rgba(0,0,0,0.12)",
                  icon: "#222834",
                  radius: 12,
                  height: 48,
              }
            : {
                  bg: "#222834",
                  bgHover: "#222834",
                  text: "#FFFFFF",
                  textHover: "#FFFFFF",
                  borderColor: "rgba(255,255,255,0)",
                  borderColorHover: "rgba(255,255,255,0)",
                  icon: "#FFFFFF",
                  radius: 12,
                  height: 48,
              }
        : mode === "Light"
          ? {
                bg: "#FFFFFF",
                bgHover: "#F5F6F9",
                text: "#222834",
                textHover: "#222834",
                icon: "#222834",
                border: "rgba(0,0,0,0.14)",
                borderHover: "rgba(0,0,0,0.18)",
            }
          : {
                bg: "#222834",
                bgHover: "#373F51",
                text: "#FFFFFF",
                textHover: "#FFFFFF",
                icon: "#FFFFFF",
                border: "rgba(255,255,255,0.10)",
                borderHover: "rgba(255,255,255,0.14)",
            }

    // -------- Shared click behavior (kept from rotor original) --------
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Only intercept normal left-click; let cmd/ctrl/middle-click behave normally.
        if (
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
        ) {
            return
        }
        e.preventDefault()
        if (!href) return
        window.open(href, "_blank", "noopener,noreferrer")
    }

    // -------- BLOBS variant: EXACT logic/styles --------
    const blobs = React.useMemo(
        () => [
            {
                color: "#6A57E3",
                animation: "contraBlobA",
                duration: rand(7.2, 10.2),
                delay: rand(-4.6, -0.2),
            },
            {
                color: "#CD74DD",
                animation: "contraBlobB",
                duration: rand(8.0, 11.2),
                delay: rand(-5.6, -0.2),
            },
            {
                color: "#6A57E3",
                animation: "contraBlobC",
                duration: rand(9.0, 12.6),
                delay: rand(-6.2, -0.2),
            },
        ],
        []
    )

    const anchorRef = React.useRef<HTMLAnchorElement | null>(null)
    const blobTranslateRef = React.useRef<HTMLDivElement | null>(null)

    const rafRef = React.useRef<number | null>(null)
    const targetRef = React.useRef({ x: 0, y: 0 })
    const currentRef = React.useRef({ x: 0, y: 0 })
    const reducedMotionDOMRef = React.useRef(false)

    React.useEffect(() => {
        reducedMotionDOMRef.current = prefersReducedMotionDOM()
    }, [])

    const stopRAF = React.useCallback(() => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }
    }, [])

    const tick = React.useCallback(() => {
        const el = blobTranslateRef.current
        if (!el) {
            stopRAF()
            return
        }

        const ease = 0.1
        currentRef.current.x +=
            (targetRef.current.x - currentRef.current.x) * ease
        currentRef.current.y +=
            (targetRef.current.y - currentRef.current.y) * ease

        const x = currentRef.current.x
        const y = currentRef.current.y

        // Only translation here (scale handled on inner wrapper)
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`

        const stillMoving =
            Math.abs(targetRef.current.x - x) > 0.1 ||
            Math.abs(targetRef.current.y - y) > 0.1

        if (isHovering || stillMoving) {
            rafRef.current = requestAnimationFrame(tick)
        } else {
            stopRAF()
        }
    }, [isHovering, stopRAF])

    const ensureRAF = React.useCallback(() => {
        if (reducedMotionDOMRef.current) return
        if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(tick)
        }
    }, [tick])

    const handleMouseMoveBlobs = (e: React.MouseEvent) => {
        if (reducedMotionDOMRef.current) return
        const a = anchorRef.current
        if (!a) return

        const r = a.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5

        const strength = 24
        targetRef.current.x = nx * strength * 2
        targetRef.current.y = ny * strength * 2

        ensureRAF()
    }

    const handleMouseEnterBlobs = () => {
        setIsHovering(true)
        ensureRAF()
    }

    const handleMouseLeaveBlobs = () => {
        setIsHovering(false)
        targetRef.current.x = 0
        targetRef.current.y = 0
        ensureRAF()
    }

    React.useEffect(() => {
        return () => stopRAF()
    }, [stopRAF])

    const styleBlobs: React.CSSProperties = {
        width: "auto",
        height: (PRESET as any).height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "12px 18px",
        borderRadius: (PRESET as any).radius,
        backgroundColor: isHovering
            ? (PRESET as any).bgHover
            : (PRESET as any).bg,
        color: isHovering ? (PRESET as any).textHover : (PRESET as any).text,
        border: `1px solid ${
            isHovering
                ? (PRESET as any).borderColorHover
                : (PRESET as any).borderColor
        }`,
        cursor: href ? "pointer" : "default",
        userSelect: "none",
        textDecoration: "none",
        whiteSpace: "nowrap",
        transition:
            "background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: "24px",
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
    }

    const contentStyleBlobs: React.CSSProperties = {
        position: "relative",
        zIndex: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
    }

    const blobTranslateStyle: React.CSSProperties = {
        position: "absolute",
        inset: -24,
        zIndex: 1,
        pointerEvents: "none",
        opacity: mode === "Light" ? 0.1 : 0.5, // intentional
        willChange: "transform",
        transform: "translate3d(0,0,0)", // initial
    }

    const blobScaleStyle: React.CSSProperties = {
        position: "absolute",
        inset: 0,
        transition: "transform 0.25s ease-out",
        transform: isHovering ? "scale(0.92)" : "scale(1)",
        willChange: "transform",
    }

    const blobBase: React.CSSProperties = {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 54,
        height: 54,
        borderRadius: 999,
        filter: "blur(12px)",
        transform: "translate(-50%, -50%)",
        willChange: "transform",
        mixBlendMode: mode === "Light" ? "multiply" : "screen",
    }

    // -------- ROTOR variant: EXACT styles --------
    const radiusRotor = 12
    const heightRotor = 48
    const paddingRotor = "12px 18px"
    const insetRotor = 1.5
    const spinSeconds = 7

    const c1 = "#6A57E3"
    const c2 = "#CD74DD"

    const wrapStyleRotor: React.CSSProperties = {
        width: "auto",
        height: heightRotor,
        position: "relative",
        display: "inline-flex",
        overflow: "hidden",
        borderRadius: radiusRotor,
        cursor: href ? "pointer" : "default",
        userSelect: "none",
        textDecoration: "none",
        whiteSpace: "nowrap",
        isolation: "isolate",
    }

    const rotorStyle: React.CSSProperties = {
        position: "absolute",
        top: "-450%",
        left: 0,
        right: 0,
        height: "1000%",
        zIndex: 1,
        background: `conic-gradient(
            transparent 220deg,
            ${c1} 250deg,
            ${c2} 290deg,
            transparent 300deg
        )`,
        opacity: 1,
        filter:
            mode === "Light"
                ? `drop-shadow(0 0 6px ${c1}) drop-shadow(0 0 10px ${c2})`
                : `drop-shadow(0 0 8px ${c1}) drop-shadow(0 0 14px ${c2})`,
        willChange: "transform",
        pointerEvents: "none",
    }

    const surfaceStyle: React.CSSProperties = {
        position: "absolute",
        inset: insetRotor,
        borderRadius: Math.max(0, radiusRotor - insetRotor),
        backgroundColor: isHovering
            ? (PRESET as any).bgHover
            : (PRESET as any).bg,
        border: `1px solid ${
            isHovering ? (PRESET as any).borderHover : (PRESET as any).border
        }`,
        transition:
            "background-color 0.15s ease-out, border-color 0.15s ease-out",
        zIndex: 2,
        pointerEvents: "none",
    }

    const contentStyleRotor: React.CSSProperties = {
        position: "relative",
        zIndex: 3,
        height: "100%",
        width: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: paddingRotor,
        color: isHovering ? (PRESET as any).textHover : (PRESET as any).text,
        transition: "color 0.15s ease-out",
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: "24px",
    }

    // -------- Render --------
    if (isBlobs) {
        return (
            <>
                <style>{`
                    @keyframes contraBlobA {
                        0%   { transform: translate(-50%, -50%) translate(-28px, -10px) scale(1); }
                        25%  { transform: translate(-50%, -50%) translate(44px, -22px) scale(1.10); }
                        50%  { transform: translate(-50%, -50%) translate(18px, 30px) scale(0.95); }
                        75%  { transform: translate(-50%, -50%) translate(-40px, 18px) scale(1.06); }
                        100% { transform: translate(-50%, -50%) translate(-28px, -10px) scale(1); }
                    }

                    @keyframes contraBlobB {
                        0%   { transform: translate(-50%, -50%) translate(36px, 26px) scale(1); }
                        30%  { transform: translate(-50%, -50%) translate(-44px, 10px) scale(1.08); }
                        60%  { transform: translate(-50%, -50%) translate(10px, -32px) scale(0.96); }
                        100% { transform: translate(-50%, -50%) translate(36px, 26px) scale(1); }
                    }

                    @keyframes contraBlobC {
                        0%   { transform: translate(-50%, -50%) translate(0px, -34px) scale(1); }
                        35%  { transform: translate(-50%, -50%) translate(46px, 6px) scale(1.12); }
                        70%  { transform: translate(-50%, -50%) translate(-46px, 24px) scale(0.94); }
                        100% { transform: translate(-50%, -50%) translate(0px, -34px) scale(1); }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        .contra-blob { animation: none !important; }
                    }
                `}</style>

                <a
                    ref={anchorRef}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styleBlobs}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnterBlobs}
                    onMouseLeave={handleMouseLeaveBlobs}
                    onMouseMove={handleMouseMoveBlobs}
                >
                    {/* Animated blurred blobs */}
                    <div
                        ref={blobTranslateRef}
                        style={blobTranslateStyle}
                        aria-hidden="true"
                    >
                        <div style={blobScaleStyle}>
                            {blobs.map((blob, i) => (
                                <div
                                    key={i}
                                    className="contra-blob"
                                    style={{
                                        ...blobBase,
                                        background: blob.color,
                                        animation: `${blob.animation} ${blob.duration}s ease-in-out infinite`,
                                        animationDelay: `${blob.delay}s`,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <span style={contentStyleBlobs}>
                        <ContraSVG fill={(PRESET as any).icon} />
                        <span>{label}</span>
                    </span>
                </a>
            </>
        )
    }

    // ROTOR
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={wrapStyleRotor}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {reduceMotion ? (
                <div style={{ ...rotorStyle, opacity: 0.35 }} />
            ) : (
                <motion.div
                    style={rotorStyle}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: spinSeconds,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
            )}

            <div style={surfaceStyle} />

            <span style={contentStyleRotor}>
                <ContraSVG fill={(PRESET as any).icon} />
                <span>{label}</span>
            </span>
        </a>
    )
}

ContraProductButton.defaultProps = {
    label: "Buy on Contra",
    href: "https://contra.com",
    mode: "Dark",
    styleVariant: "Blobs",
}

addPropertyControls(ContraProductButton, {
    styleVariant: {
        type: ControlType.Enum,
        title: "Style",
        options: ["Blobs", "Rotor"],
        optionTitles: ["Blobs", "Rotor"],
        defaultValue: "Blobs",
    },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["Dark", "Light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "Dark",
    },
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Buy on Contra",
    },
    href: {
        type: ControlType.String,
        title: "Link",
        defaultValue: "https://contra.com",
        placeholder: "https://...",
    },
})
