// User instructions: "ya code dekhy es component ko perfect banao es ma kuch positon sahi nahi ha or neccy ap palte ha us pa animation na lagao simple glow ho or border working ma ho"
// User instructions (update): "create this type of modern... line working me ho" (modern integration wheel like attached reference)
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
    type CSSProperties,
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


type IconKey = string

type IconDef = {
    key: IconKey
    color: string
    left: number
    top: number
    anim: string
    dur: string
    delay: string
    svg?: React.ReactNode
}

type Star = {
    id: number
    size: number
    left: string
    top: string
    opacity: number
    dur: string
    delay: string
}

type WheelNode = {
    label: string
    color: string
    image?: { src: string; srcSet?: string; alt?: string }
}

type ResponsiveImageLike = { src: string; srcSet?: string; alt?: string }

type Props = {
    backgroundStart: string
    backgroundMid: string
    backgroundEnd: string

    cornerRadius: string

    centerImage?: ResponsiveImageLike
    showCenterImage: boolean

    showNodeImages: boolean
    nodeImageFit: "cover" | "contain"

    showStars: boolean
    starsCount: number
    starsSeed: number
    starsAreaHeightPct: number

    animateIcons: boolean
    iconSize: number
    iconRadius: number
    iconBackgroundA: string
    iconBackgroundB: string
    iconBorderColor: string
    iconBorderWidth: number
    iconShadow: string

    tooltipBackground: string
    tooltipBorder: string
    tooltipText: string
    tooltipFont: any

    showPlatform: boolean
    platformWidthPct: number
    platformHeightPct: number
    platformBottomPct: number

    platformDiscA: string
    platformDiscB: string
    platformDiscC: string
    platformBorderColor: string
    platformBorderWidth: number

    platformGlowA: string
    platformGlowB: string
    platformGlowC: string
    platformGlowOpacity: number

    rimEnabled: boolean
    rimColorA: string
    rimColorB: string
    rimOpacity: number

    nodes: WheelNode[]
    centerColor: string
    centerBorderColor: string
    centerBorderWidth: number
    centerGlow: string

    ringColor: string
    ringWidth: number
    ringDashSize: number
    ringDashGap: number
    ringRadius: number
    ringAnimate: boolean

    style?: CSSProperties
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function FloatingIconsPlatform(props: Props) {
    const {
        backgroundStart,
        backgroundMid,
        backgroundEnd,
        cornerRadius,

        centerImage = {
            src: "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg",
            alt: "Center image",
        },
        showCenterImage,

        showNodeImages,
        nodeImageFit,

        showStars,
        starsCount,
        starsSeed,
        starsAreaHeightPct,

        animateIcons,
        iconSize,
        iconRadius,
        iconBackgroundA,
        iconBackgroundB,
        iconBorderColor,
        iconBorderWidth,
        iconShadow,

        tooltipBackground,
        tooltipBorder,
        tooltipText,
        tooltipFont,

        showPlatform,
        platformWidthPct,
        platformHeightPct,
        platformBottomPct,

        platformDiscA,
        platformDiscB,
        platformDiscC,
        platformBorderColor,
        platformBorderWidth,

        platformGlowA,
        platformGlowB,
        platformGlowC,
        platformGlowOpacity,

        rimEnabled,
        rimColorA,
        rimColorB,
        rimOpacity,

        nodes,
        centerColor,
        centerBorderColor,
        centerBorderWidth,
        centerGlow,

        ringColor,
        ringWidth,
        ringDashSize,
        ringDashGap,
        ringRadius,
        ringAnimate,

        style,
    } = props

    const injected = useRef(false)
    const isStatic = useIsStaticRenderer()

    const sceneWrapRef = useRef<HTMLDivElement | null>(null)
    const [sceneScale, setSceneScale] = useState(1)

    useEffect(() => {
        if (injected.current) return
        injected.current = true
        if (typeof document === "undefined") return

        const css = buildCSS()
        const el = Object.assign(document.createElement("style"), { textContent: css })
        document.head.appendChild(el)
        return () => el.remove()
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        const el = sceneWrapRef.current
        if (!el) return

        const update = () => {
            const rect = el.getBoundingClientRect()
            const s = rect.width > 0 ? Math.min(1, rect.width / 420) : 1
            startTransition(() => setSceneScale(s))
        }

        update()

        const ro = new ResizeObserver(() => update())
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Deterministic stars (no Math.random at module scope)
    const stars = useMemo(() => {
        if (!showStars) return [] as Star[]
        const count = Math.max(0, Math.min(200, Math.round(starsCount)))
        return generateStars(count, starsSeed, starsAreaHeightPct)
    }, [showStars, starsCount, starsSeed, starsAreaHeightPct])

    const baseIcons = useMemo(() => getIcons(nodes, ringRadius, iconSize), [nodes, ringRadius, iconSize])
    const [hoverKey, setHoverKey] = useState<IconKey | null>(null)

    const rootBg = useMemo(() => {
        return `radial-gradient(ellipse 110% 80% at 50% 100%, ${backgroundStart} 0%, ${backgroundMid} 38%, ${backgroundEnd} 100%)`
    }, [backgroundStart, backgroundMid, backgroundEnd])

    const iconBg = useMemo(() => {
        return `linear-gradient(150deg, ${iconBackgroundA} 0%, ${iconBackgroundB} 100%)`
    }, [iconBackgroundA, iconBackgroundB])

    const discBg = useMemo(() => {
        return `linear-gradient(180deg, ${platformDiscA} 0%, ${platformDiscB} 46%, ${platformDiscC} 100%)`
    }, [platformDiscA, platformDiscB, platformDiscC])

    const rimBg = useMemo(() => {
        return `conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(140,90,255,${0.15 * rimOpacity}) 15%,
            ${withAlpha(rimColorA, 0.55 * rimOpacity)} 28%,
            rgba(255,245,255,${0.35 * rimOpacity}) 33%,
            ${withAlpha(rimColorB, 0.45 * rimOpacity)} 40%,
            transparent 54%,
            rgba(110,65,210,${0.18 * rimOpacity}) 78%,
            transparent 100%
        )`
    }, [rimColorA, rimColorB, rimOpacity])

    const platformGlow = useMemo(() => {
        const oa = clamp01(platformGlowOpacity)
        return {
            gb: `radial-gradient(ellipse, ${withAlpha(platformGlowA, 0.55 * oa)} 0%, ${withAlpha(
                platformGlowB,
                0.28 * oa,
            )} 42%, transparent 70%)`,
            gc: `radial-gradient(ellipse, ${withAlpha(platformGlowC, 0.42 * oa)} 0%, ${withAlpha(
                platformGlowB,
                0.18 * oa,
            )} 42%, transparent 70%)`,
            gspot: `radial-gradient(ellipse, rgba(255,255,255,${0.45 * oa}) 0%, ${withAlpha(
                platformGlowC,
                0.28 * oa,
            )} 30%, transparent 68%)`,
            gamb: `radial-gradient(ellipse, ${withAlpha(platformGlowB, 0.2 * oa)} 0%, transparent 68%)`,
            beam: `radial-gradient(ellipse, ${withAlpha(platformGlowA, 0.34 * oa)}, transparent 70%)`,
        }
    }, [platformGlowA, platformGlowB, platformGlowC, platformGlowOpacity])

    const discBorder = useMemo(() => {
        const w = Math.max(0, platformBorderWidth)
        if (w === 0) return "none"
        return `${w}px solid ${platformBorderColor}`
    }, [platformBorderWidth, platformBorderColor])

    const iconBorder = useMemo(() => {
        const w = Math.max(0, iconBorderWidth)
        if (w === 0) return "none"
        return `${w}px solid ${iconBorderColor}`
    }, [iconBorderWidth, iconBorderColor])

    const centerBorder = useMemo(() => {
        const w = Math.max(0, centerBorderWidth)
        if (w === 0) return "none"
        return `${w}px solid ${centerBorderColor}`
    }, [centerBorderWidth, centerBorderColor])

    const canAnimate = !isStatic && RenderTarget.current() !== RenderTarget.thumbnail

    const geometry = useMemo(() => {
        const cx = 210
        const cy = 190
        const r = Math.max(70, Math.min(175, ringRadius))
        const iconHalf = iconSize / 2
        const nodesGeom = baseIcons.map((n) => {
            const x = n.left + iconHalf
            const y = n.top + iconHalf
            return { ...n, cx: x, cy: y }
        })
        return { cx, cy, r, iconHalf, nodesGeom }
    }, [baseIcons, iconSize, ringRadius])

    return (
        <div
            style={{
                ...style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius: cornerRadius,
                background: rootBg,
                userSelect: "none",
                fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            }}
        >
            {showStars &&
                stars.map((st) => (
                    <div
                        key={st.id}
                        style={{
                            position: "absolute",
                            borderRadius: "50%",
                            background: "#fff",
                            width: st.size,
                            height: st.size,
                            left: st.left,
                            top: st.top,
                            opacity: st.opacity,
                            pointerEvents: "none",
                            animation: canAnimate ? `fp_twk ${st.dur} ease-in-out infinite ${st.delay}` : "none",
                        }}
                    />
                ))}

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    padding: "8% 6%",
                }}
            >
                <div
                    ref={sceneWrapRef}
                    style={{
                        position: "relative",
                        width: "min(420px, 100%)",
                        aspectRatio: "420 / 400",
                        transform: "translateZ(0)",
                        transformOrigin: "top left",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            transformOrigin: "top left",
                            transform: `scale(${sceneScale})`,
                            width: 420,
                            height: 400,
                        }}
                    >
                        <svg
                            width={420}
                            height={400}
                            viewBox="0 0 420 400"
                            style={{ position: "absolute", inset: 0, overflow: "visible" }}
                            aria-hidden="true"
                        >
                            <defs>
                                <filter id="fpGlow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur stdDeviation="2.5" result="b" />
                                    <feColorMatrix
                                        in="b"
                                        type="matrix"
                                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
                                        result="c"
                                    />
                                    <feMerge>
                                        <feMergeNode in="c" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            <g opacity={0.9} filter="url(#fpGlow)">
                                {geometry.nodesGeom.map((n) => (
                                    <line
                                        key={n.key}
                                        x1={geometry.cx}
                                        y1={geometry.cy}
                                        x2={n.cx}
                                        y2={n.cy}
                                        stroke={withAlpha(n.color, 0.6)}
                                        strokeWidth={1.2}
                                        strokeLinecap="round"
                                    />
                                ))}
                            </g>

                            <circle
                                cx={geometry.cx}
                                cy={geometry.cy}
                                r={geometry.r}
                                fill="none"
                                stroke={withAlpha(ringColor, 0.9)}
                                strokeWidth={ringWidth}
                                strokeDasharray={`${Math.max(1, ringDashSize)} ${Math.max(1, ringDashGap)}`}
                                style={{
                                    animation:
                                        canAnimate && ringAnimate
                                            ? "fp_dash 10s linear infinite"
                                            : "none",
                                }}
                            />
                        </svg>

                        <div
                            style={{
                                position: "absolute",
                                left: geometry.cx,
                                top: geometry.cy,
                                transform: "translate(-50%, -50%)",
                                width: 46,
                                height: 46,
                                borderRadius: 14,
                                background: centerColor,
                                border: centerBorder,
                                boxShadow: centerGlow,
                                display: "grid",
                                placeItems: "center",
                                zIndex: 20,
                                overflow: "hidden",
                            }}
                            role="img"
                            aria-label="Center"
                        >
                            {showCenterImage && centerImage?.src ? (
                                <img
                                    src={centerImage.src}
                                    srcSet={centerImage.srcSet}
                                    alt={centerImage.alt || ""}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <svg viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden="true">
                                    <path
                                        d="M10.3 2.6h3.4l.4 2a7.7 7.7 0 0 1 1.6.7l1.8-1.1 2.4 2.4-1.1 1.8c.3.5.6 1 .7 1.6l2 .4v3.4l-2 .4a7.7 7.7 0 0 1-.7 1.6l1.1 1.8-2.4 2.4-1.8-1.1c-.5.3-1 .6-1.6.7l-.4 2h-3.4l-.4-2a7.7 7.7 0 0 1-1.6-.7l-1.8 1.1-2.4-2.4 1.1-1.8a7.7 7.7 0 0 1-.7-1.6l-2-.4v-3.4l2-.4c.1-.6.4-1.1.7-1.6L2.6 6.5 5 4.1l1.8 1.1c.5-.3 1-.6 1.6-.7l.4-2ZM12 15.3A3.3 3.3 0 1 0 12 8.7a3.3 3.3 0 0 0 0 6.6Z"
                                        fill="rgba(230,220,255,0.95)"
                                    />
                                </svg>
                            )}
                        </div>

                        {baseIcons.map((ic, i) => {
                            const hover = hoverKey === ic.key
                            const z = 30 - i + (hover ? 200 : 0)

                            return (
                                <div
                                    key={ic.key}
                                    className="fp-ic"
                                    style={{
                                        position: "absolute",
                                        left: `${ic.left}px`,
                                        top: `${ic.top}px`,
                                        zIndex: z,

                                        width: iconSize,
                                        height: iconSize,
                                        borderRadius: iconRadius,

                                        background: iconBg,
                                        border: iconBorder,
                                        boxShadow: iconShadow,

                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",

                                        cursor: "pointer",
                                        transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease",

                                        animation:
                                            canAnimate && animateIcons && !hover
                                                ? `${ic.anim} ${ic.dur} ease-in-out infinite ${ic.delay}`
                                                : "none",
                                    }}
                                    role="button"
                                    aria-label={ic.key}
                                    tabIndex={0}
                                    onMouseEnter={() => startTransition(() => setHoverKey(ic.key))}
                                    onMouseLeave={() => startTransition(() => setHoverKey(null))}
                                    onFocus={() => startTransition(() => setHoverKey(ic.key))}
                                    onBlur={() => startTransition(() => setHoverKey(null))}
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") startTransition(() => setHoverKey(null))
                                    }}
                                >
                                    <div
                                        className="fp-tip"
                                        style={{
                                            position: "absolute",
                                            bottom: "calc(100% + 8px)",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: tooltipBackground,
                                            border: `1px solid ${tooltipBorder}`,
                                            color: tooltipText,
                                            padding: "4px 9px",
                                            borderRadius: 6,
                                            whiteSpace: "nowrap",
                                            pointerEvents: "none",
                                            opacity: hover ? 1 : 0,
                                            transition: "opacity .18s ease",
                                            ...tooltipFont,
                                            fontSize: (tooltipFont?.fontSize as any) ?? 10,
                                            letterSpacing: (tooltipFont?.letterSpacing as any) ?? ".04em",
                                            lineHeight: (tooltipFont?.lineHeight as any) ?? "1.1em",
                                        }}
                                    >
                                        {ic.key}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                        }}
                                    >
                                        {showNodeImages && nodes?.[i]?.image?.src ? (
                                            <img
                                                src={nodes[i].image!.src}
                                                srcSet={nodes[i].image!.srcSet}
                                                alt={nodes[i].image!.alt || ""}
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 8,
                                                    objectFit: nodeImageFit,
                                                    boxShadow: `0 0 16px ${withAlpha(ic.color, 0.45)}`,
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: 6,
                                                    height: 6,
                                                    borderRadius: 99,
                                                    background: ic.color,
                                                    boxShadow: `0 0 16px ${withAlpha(ic.color, 0.7)}`,
                                                }}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span
                                            style={{
                                                color: "rgba(238,234,255,0.92)",
                                                fontSize: 11,
                                                letterSpacing: "0.01em",
                                                lineHeight: "1.05em",
                                                padding: "0 6px",
                                                textAlign: "center",
                                                width: "max-content",
                                                maxWidth: iconSize - 10,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {ic.key}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}

                        {showPlatform && (
                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    bottom: `${platformBottomPct}%`,
                                    transform: "translateX(-50%)",
                                    width: `${platformWidthPct}%`,
                                    height: `${platformHeightPct}%`,
                                    pointerEvents: "none",
                                }}
                            >
                                {rimEnabled && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: "-8%",
                                            borderRadius: "999px",
                                            background: rimBg,
                                            filter: "blur(3.5px)",
                                            opacity: 1,
                                        }}
                                        aria-hidden="true"
                                    />
                                )}

                                <div
                                    className="fp-disc"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        borderRadius: "999px",
                                        overflow: "hidden",
                                        background: discBg,
                                        border: discBorder,
                                        boxShadow: `0 18px 45px rgba(0,0,0,.55), 0 0 28px ${withAlpha(platformBorderColor, 0.22)}, inset 0 1px 0 rgba(255,255,255,.08)`,
                                        // For pseudo-element styling
                                        //@ts-ignore
                                        "--fp-border": withAlpha(platformBorderColor, 0.35),
                                        //@ts-ignore
                                        "--fp-border-dark": withAlpha(platformBorderColor, 0.22),
                                    }}
                                    aria-hidden="true"
                                >
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "18%",
                                            left: "5.5%",
                                            right: "5.5%",
                                            bottom: "22%",
                                            borderRadius: "999px",
                                            borderTop: `1px solid ${withAlpha(platformBorderColor, 0.22)}`,
                                            opacity: 0.7,
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            background:
                                                "radial-gradient(ellipse 120% 100% at 50% 20%, rgba(255,255,255,.10) 0%, transparent 55%)",
                                            mixBlendMode: "screen",
                                            opacity: 0.7,
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-32%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "70%",
                                        height: "120%",
                                        background: platformGlow.gb,
                                        filter: "blur(15px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-88%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "56%",
                                        height: "180%",
                                        background: platformGlow.gc,
                                        filter: "blur(28px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-120%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "36%",
                                        height: "150%",
                                        background: platformGlow.gspot,
                                        filter: "blur(20px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-145%",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        width: "110%",
                                        height: "200%",
                                        background: platformGlow.gamb,
                                        filter: "blur(24px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-8%",
                                        left: "-4%",
                                        width: "24%",
                                        height: "50%",
                                        background: platformGlow.beam,
                                        filter: "blur(11px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "-8%",
                                        right: "-4%",
                                        width: "24%",
                                        height: "50%",
                                        background: platformGlow.beam,
                                        filter: "blur(11px)",
                                        opacity: 1,
                                    }}
                                    aria-hidden="true"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function buildCSS() {
    // Keep icon float animations; platform stays static (simple glow + working border)
    return `
@keyframes fp_fl0{0%,100%{transform:translateY(0px) rotate(-8deg)} 50%{transform:translateY(-14px) rotate(-8deg)}}
@keyframes fp_fl1{0%,100%{transform:translateY(0px) rotate(7deg)}  50%{transform:translateY(-11px) rotate(7deg)}}
@keyframes fp_fl2{0%,100%{transform:translateY(0px) rotate(-11deg)}50%{transform:translateY(-18px) rotate(-11deg)}}
@keyframes fp_fl3{0%,100%{transform:translateY(0px) rotate(10deg)} 50%{transform:translateY(-13px) rotate(10deg)}}
@keyframes fp_fl4{0%,100%{transform:translateY(0px) rotate(-6deg)} 50%{transform:translateY(-16px) rotate(-6deg)}}
@keyframes fp_fl5{0%,100%{transform:translateY(0px) rotate(13deg)} 50%{transform:translateY(-10px) rotate(13deg)}}
@keyframes fp_fl6{0%,100%{transform:translateY(0px) rotate(-4deg)} 50%{transform:translateY(-20px) rotate(-4deg)}}
@keyframes fp_fl7{0%,100%{transform:translateY(0px) rotate(-9deg)} 50%{transform:translateY(-15px) rotate(-9deg)}}
@keyframes fp_fl8{0%,100%{transform:translateY(0px) rotate(8deg)}  50%{transform:translateY(-12px) rotate(8deg)}}

@keyframes fp_twk{0%,100%{opacity:.08} 50%{opacity:.6}}
@keyframes fp_dash{to{stroke-dashoffset:-120}}

.fp-disc::before{
  content:'';
  position:absolute;
  top:0; left:0; right:0;
  height:2.5px;
  border-radius:999px;
  background:linear-gradient(90deg,transparent 0%, var(--fp-border, rgba(190,155,255,.25)) 18%, rgba(255,248,255,.72) 50%, var(--fp-border, rgba(190,155,255,.25)) 82%,transparent 100%);
  opacity:.9;
}
.fp-disc::after{
  content:'';
  position:absolute;
  bottom:0; left:12%; right:12%;
  height:1px;
  background:var(--fp-border-dark, rgba(70,42,170,.35));
  border-radius:999px;
  opacity:.9;
}

.fp-ic:hover{
  box-shadow:0 20px 52px rgba(0,0,0,.85),0 0 28px rgba(140,90,255,.4), inset 0 1px 0 rgba(255,255,255,.12) !important;
  transform:scale(1.12) translateY(-4px) !important;
}
`
}

function getIcons(nodes: WheelNode[], radius: number, iconSize: number): IconDef[] {
    const safeNodes = Array.isArray(nodes) && nodes.length > 0 ? nodes : defaultNodes
    const cx = 210
    const cy = 190
    const r = Math.max(70, Math.min(175, radius))
    const half = iconSize / 2

    const list = safeNodes.slice(0, 12)
    const step = (Math.PI * 2) / list.length
    const start = -Math.PI / 2

    return list.map((n, i) => {
        const a = start + i * step
        const x = cx + r * Math.cos(a) - half
        const y = cy + r * Math.sin(a) - half
        return {
            key: n.label,
            color: n.color,
            left: x,
            top: y,
            anim: `fp_fl${i % 9}`,
            dur: `${(3.6 + (i % 4) * 0.35).toFixed(2)}s`,
            delay: `${(i * 0.12).toFixed(2)}s`,
        }
    })
}

const defaultNodes: WheelNode[] = [
    { label: "AI Apps", color: "#6ea8ff" },
    { label: "Sources", color: "#6ea8ff" },
    { label: "Realtime", color: "#b27cff" },
    { label: "Ingestion", color: "#6ea8ff" },
    { label: "Batch", color: "#b27cff" },
    { label: "Transform", color: "#6ea8ff" },
    { label: "ML", color: "#b27cff" },
    { label: "Quality", color: "#6ea8ff" },
    { label: "Analytics", color: "#6ea8ff" },
    { label: "Storage", color: "#6ea8ff" },
    { label: "BI", color: "#b27cff" },
    { label: "Serving", color: "#6ea8ff" },
]

function generateStars(count: number, seed: number, areaHeightPct: number): Star[] {
    const rng = mulberry32(Math.floor(seed) || 1)
    const h = clamp(0, 100, areaHeightPct)

    const stars: Star[] = []
    for (let i = 0; i < count; i++) {
        const size = rng() * 1.6 + 0.4
        const left = `${(rng() * 100).toFixed(1)}%`
        const top = `${(rng() * h).toFixed(1)}%`
        const opacity = +((rng() * 0.3 + 0.04).toFixed(2))
        const dur = `${(2 + rng() * 3).toFixed(1)}s`
        const delay = `${(rng() * 6).toFixed(1)}s`
        stars.push({ id: i, size, left, top, opacity, dur, delay })
    }
    return stars
}

function mulberry32(a: number) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function clamp(min: number, max: number, v: number) {
    return Math.max(min, Math.min(max, v))
}
function clamp01(v: number) {
    return clamp(0, 1, v)
}

function withAlpha(color: string, alpha: number) {
    const a = clamp01(alpha)
    if (!color) return `rgba(0,0,0,${a})`
    if (color.startsWith("rgba(") || color.startsWith("hsla(")) return color
    if (color.startsWith("rgb(")) {
        const inner = color.slice(4, -1)
        return `rgba(${inner}, ${a})`
    }
    // hex -> rgba
    const hex = color.replace("#", "").trim()
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex
    if (full.length !== 6) return color
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${a})`
}

addPropertyControls(FloatingIconsPlatform, {
    backgroundStart: { type: ControlType.Color, title: "BG Start", defaultValue: "#12094a" },
    backgroundMid: { type: ControlType.Color, title: "BG Mid", defaultValue: "#080518" },
    backgroundEnd: { type: ControlType.Color, title: "BG End", defaultValue: "#020108" },

    cornerRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "18px" },

    centerImage: { type: ControlType.ResponsiveImage, title: "Center Image" },
    showCenterImage: {
        type: ControlType.Boolean,
        title: "Center Img",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    showNodeImages: {
        type: ControlType.Boolean,
        title: "Node Images",
        defaultValue: false,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    nodeImageFit: {
        type: ControlType.Enum,
        title: "Img Fit",
        options: ["cover", "contain"],
        optionTitles: ["Cover", "Contain"],
        defaultValue: "contain",
        displaySegmentedControl: true,
        hidden: (p) => !p.showNodeImages,
    },

    showStars: { type: ControlType.Boolean, title: "Stars", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    starsCount: {
        type: ControlType.Number,
        title: "Star Count",
        defaultValue: 45,
        min: 0,
        max: 200,
        step: 1,
        hidden: (p) => !p.showStars,
    },
    starsSeed: {
        type: ControlType.Number,
        title: "Star Seed",
        defaultValue: 7,
        min: 1,
        max: 9999,
        step: 1,
        hidden: (p) => !p.showStars,
    },
    starsAreaHeightPct: {
        type: ControlType.Number,
        title: "Star Area",
        defaultValue: 78,
        min: 20,
        max: 100,
        step: 1,
        unit: "%",
        hidden: (p) => !p.showStars,
    },

    animateIcons: {
        type: ControlType.Boolean,
        title: "Node Anim",
        defaultValue: true,
        enabledTitle: "Float",
        disabledTitle: "Off",
    },
    iconSize: { type: ControlType.Number, title: "Node Size", defaultValue: 62, min: 46, max: 96, step: 1, unit: "px" },
    iconRadius: { type: ControlType.Number, title: "Node Radius", defaultValue: 16, min: 10, max: 40, step: 1, unit: "px" },
    iconBackgroundA: { type: ControlType.Color, title: "Node BG A", defaultValue: "#1a1835" },
    iconBackgroundB: { type: ControlType.Color, title: "Node BG B", defaultValue: "#0b091c" },
    iconBorderColor: { type: ControlType.Color, title: "Node Border", defaultValue: "rgba(255,255,255,.055)" },
    iconBorderWidth: { type: ControlType.Number, title: "Node Border W", defaultValue: 1, min: 0, max: 4, step: 1, unit: "px" },
    iconShadow: {
        type: ControlType.BoxShadow,
        title: "Node Shadow",
        defaultValue: "0 12px 36px rgba(0,0,0,.65),0 2px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.06)",
    },

    tooltipBackground: { type: ControlType.Color, title: "Tip BG", defaultValue: "rgba(12,7,30,.95)" },
    tooltipBorder: { type: ControlType.Color, title: "Tip Border", defaultValue: "rgba(130,90,240,.35)" },
    tooltipText: { type: ControlType.Color, title: "Tip Text", defaultValue: "rgba(210,190,255,.9)" },
    tooltipFont: {
        type: ControlType.Font,
        title: "Tip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "10px", variant: "Bold", letterSpacing: ".04em", lineHeight: "1.1em" },
    },

    ringColor: { type: ControlType.Color, title: "Ring", defaultValue: "rgba(120,160,255,0.65)" },
    ringWidth: { type: ControlType.Number, title: "Ring W", defaultValue: 2, min: 1, max: 6, step: 1, unit: "px" },
    ringDashSize: { type: ControlType.Number, title: "Dash", defaultValue: 3, min: 1, max: 10, step: 1 },
    ringDashGap: { type: ControlType.Number, title: "Gap", defaultValue: 9, min: 2, max: 20, step: 1 },
    ringRadius: { type: ControlType.Number, title: "Radius", defaultValue: 150, min: 90, max: 175, step: 1, unit: "px" },
    ringAnimate: { type: ControlType.Boolean, title: "Ring Anim", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },

    centerColor: { type: ControlType.Color, title: "Center", defaultValue: "rgba(120,80,255,0.22)" },
    centerBorderColor: { type: ControlType.Color, title: "Center Border", defaultValue: "rgba(255,255,255,0.14)" },
    centerBorderWidth: { type: ControlType.Number, title: "Center BW", defaultValue: 1, min: 0, max: 6, step: 1, unit: "px" },
    centerGlow: {
        type: ControlType.BoxShadow,
        title: "Center Glow",
        defaultValue: "0 10px 30px rgba(0,0,0,.55), 0 0 26px rgba(140,90,255,.45)",
    },

    nodes: {
        type: ControlType.Array,
        title: "Nodes",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label", defaultValue: "AI Apps" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#6ea8ff" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: defaultNodes,
    },

    showPlatform: { type: ControlType.Boolean, title: "Platform", defaultValue: false, enabledTitle: "Show", disabledTitle: "Hide" },
    platformWidthPct: {
        type: ControlType.Number,
        title: "Plat W",
        defaultValue: 78.5,
        min: 40,
        max: 100,
        step: 0.5,
        unit: "%",
        hidden: (p) => !p.showPlatform,
    },
    platformHeightPct: {
        type: ControlType.Number,
        title: "Plat H",
        defaultValue: 14,
        min: 8,
        max: 22,
        step: 0.5,
        unit: "%",
        hidden: (p) => !p.showPlatform,
    },
    platformBottomPct: {
        type: ControlType.Number,
        title: "Plat Bottom",
        defaultValue: 8,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "%",
        hidden: (p) => !p.showPlatform,
    },

    platformDiscA: { type: ControlType.Color, title: "Disc A", defaultValue: "rgba(155,115,255,.20)", hidden: (p) => !p.showPlatform },
    platformDiscB: { type: ControlType.Color, title: "Disc B", defaultValue: "rgba(80,48,200,.44)", hidden: (p) => !p.showPlatform },
    platformDiscC: { type: ControlType.Color, title: "Disc C", defaultValue: "rgba(38,18,118,.14)", hidden: (p) => !p.showPlatform },
    platformBorderColor: { type: ControlType.Color, title: "Plat Border", defaultValue: "rgba(255,255,255,.10)", hidden: (p) => !p.showPlatform },
    platformBorderWidth: {
        type: ControlType.Number,
        title: "Plat Border W",
        defaultValue: 1,
        min: 0,
        max: 6,
        step: 1,
        unit: "px",
        hidden: (p) => !p.showPlatform,
    },

    platformGlowA: { type: ControlType.Color, title: "Glow A", defaultValue: "rgba(140,82,255,1)", hidden: (p) => !p.showPlatform },
    platformGlowB: { type: ControlType.Color, title: "Glow B", defaultValue: "rgba(90,44,195,1)", hidden: (p) => !p.showPlatform },
    platformGlowC: { type: ControlType.Color, title: "Glow C", defaultValue: "rgba(215,195,255,1)", hidden: (p) => !p.showPlatform },
    platformGlowOpacity: { type: ControlType.Number, title: "Glow Op", defaultValue: 0.9, min: 0, max: 1, step: 0.05, hidden: (p) => !p.showPlatform },

    rimEnabled: {
        type: ControlType.Boolean,
        title: "Rim",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        hidden: (p) => !p.showPlatform,
    },
    rimColorA: {
        type: ControlType.Color,
        title: "Rim A",
        defaultValue: "rgba(200,160,255,1)",
        hidden: (p) => !p.showPlatform || !p.rimEnabled,
    },
    rimColorB: {
        type: ControlType.Color,
        title: "Rim B",
        defaultValue: "rgba(170,120,255,1)",
        hidden: (p) => !p.showPlatform || !p.rimEnabled,
    },
    rimOpacity: {
        type: ControlType.Number,
        title: "Rim Op",
        defaultValue: 1,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.showPlatform || !p.rimEnabled,
    },
})