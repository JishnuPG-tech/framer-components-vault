// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useState } from "react"

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 150
 */
export default function SourcePlank(props) {
    const {
        label,
        labelFont,
        labelColor,
        labelGap,
        shape,
        taper,
        cornerRadius,
        woodImage,
        woodTint,
        plankHeight,
        shading,
        sheen,
        links,
        iconSize,
        iconOverlap,
        tipBackground,
        tipColor,
        tipFont,
        driftX,
        driftY,
        tiltAmount,
        hoverBoost,
        liftAmount,
        style,
    } = props

    const wrapRef = useRef(null)
    const plankRef = useRef(null)
    const woodRef = useRef(null)
    const sheenRef = useRef(null)

    const targetRef = useRef({ x: 0, y: 0 })
    const currentRef = useRef({ x: 0, y: 0, hover: 0 })
    const hoverRef = useRef(false)
    const rafRef = useRef(null)
    const visibleRef = useRef(true)

    const [size, setSize] = useState({ w: 0, h: 0 })

    // True on the Framer canvas and during export. Everything that moves
    // continuously is switched off in that case and a single still frame is
    // rendered instead, which keeps the editor light and exports clean.
    const isStatic = useIsStaticRenderer()

    // The plank drifts with the cursor anywhere on the page, the same way the
    // robot head does, and leans harder while the pointer is over it.
    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return

        const onMove = (event) => {
            const node = plankRef.current
            if (!node) return
            const rect = node.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2
            const dx = event.clientX - cx
            const dy = event.clientY - cy

            targetRef.current = {
                x: Math.max(Math.min(dx / (window.innerWidth * 0.4), 1), -1),
                y: Math.max(Math.min(dy / (window.innerHeight * 0.4), 1), -1),
            }
        }

        const tick = () => {
            if (visibleRef.current) {
                const t = targetRef.current
                const c = currentRef.current
                const hoverTarget = hoverRef.current ? 1 : 0

                currentRef.current = {
                    x: c.x + (t.x - c.x) * 0.09,
                    y: c.y + (t.y - c.y) * 0.09,
                    hover: c.hover + (hoverTarget - c.hover) * 0.12,
                }

                const n = currentRef.current
                const boost = 1 + n.hover * hoverBoost

                const plank = plankRef.current
                if (plank) {
                    plank.style.transform = `
                        translate3d(${n.x * driftX}px, ${
                            n.y * driftY - n.hover * liftAmount
                        }px, 0)
                        rotateX(${-n.y * tiltAmount * boost}deg)
                        rotateY(${n.x * tiltAmount * boost}deg)
                    `
                }

                const wood = woodRef.current
                if (wood) {
                    const depth = 5 + n.hover * (liftAmount + 6)
                    const spread = 10 + n.hover * (liftAmount + 8)
                    wood.style.filter = `drop-shadow(${
                        -n.x * driftX * 0.4
                    }px ${depth}px ${spread}px rgba(60,38,18,${
                        0.25 + n.hover * 0.12
                    }))`
                }

                // The specular band slides across the board as it turns,
                // which is what actually reads as a solid tilting object
                const band = sheenRef.current
                if (band) {
                    band.style.transform = `translate3d(${
                        -n.x * 55
                    }%, ${-n.y * 25}%, 0)`
                }
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        window.addEventListener("pointermove", onMove, { passive: true })
        rafRef.current = requestAnimationFrame(tick)

        // Idle while the plank is off screen
        let observer
        if (wrapRef.current && typeof IntersectionObserver !== "undefined") {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        visibleRef.current = entry.isIntersecting
                    })
                },
                { threshold: 0 }
            )
            observer.observe(wrapRef.current)
        }

        return () => {
            window.removeEventListener("pointermove", onMove)
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
            if (observer) observer.disconnect()
        }
    }, [isStatic, driftX, driftY, tiltAmount, hoverBoost, liftAmount])

    // The rounded silhouette has to be built in pixels, so the board is
    // measured and the path rebuilt whenever it resizes
    useEffect(() => {
        const node = woodRef.current
        if (!node || typeof ResizeObserver === "undefined") return

        const measure = () => {
            setSize({ w: node.offsetWidth, h: node.offsetHeight })
        }
        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    // Plank silhouettes as fractions of the board, so they scale with it
    const f = taper / 100
    const shapePoints = {
        straight: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
        ],
        taperRight: [
            [0, 0],
            [1, f],
            [1, 1 - f],
            [0, 1],
        ],
        taperLeft: [
            [0, f],
            [1, 0],
            [1, 1],
            [0, 1 - f],
        ],
        barrel: [
            [0, f],
            [0.5, 0],
            [1, f],
            [1, 1 - f],
            [0.5, 1],
            [0, 1 - f],
        ],
    }
    const points = shapePoints[shape] || shapePoints.straight

    // Walks the corners, cutting each one back along both edges and joining
    // them with a curve, which is what gives a rounded polygon
    const roundedPath = (pts, w, h, r) => {
        const p = pts.map(([x, y]) => [x * w, y * h])
        const count = p.length
        let d = ""

        for (let i = 0; i < count; i++) {
            const prev = p[(i - 1 + count) % count]
            const curr = p[i]
            const next = p[(i + 1) % count]

            const toPrev = [prev[0] - curr[0], prev[1] - curr[1]]
            const toNext = [next[0] - curr[0], next[1] - curr[1]]
            const lenPrev = Math.hypot(toPrev[0], toPrev[1]) || 1
            const lenNext = Math.hypot(toNext[0], toNext[1]) || 1

            const cut = Math.min(r, lenPrev / 2, lenNext / 2)

            const start = [
                curr[0] + (toPrev[0] / lenPrev) * cut,
                curr[1] + (toPrev[1] / lenPrev) * cut,
            ]
            const end = [
                curr[0] + (toNext[0] / lenNext) * cut,
                curr[1] + (toNext[1] / lenNext) * cut,
            ]

            d +=
                i === 0
                    ? `M ${start[0]} ${start[1]} `
                    : `L ${start[0]} ${start[1]} `
            d += `Q ${curr[0]} ${curr[1]} ${end[0]} ${end[1]} `
        }

        return `${d}Z`
    }

    const polygonFallback = `polygon(${points
        .map(([x, y]) => `${x * 100}% ${y * 100}%`)
        .join(", ")})`

    const clip =
        size.w > 0 && size.h > 0
            ? `path('${roundedPath(points, size.w, size.h, cornerRadius)}')`
            : polygonFallback

    // Shading stack painted over the wood. Inset box-shadows would follow the
    // element's rectangle rather than the cut silhouette, so this is done with
    // gradient layers inside the clipped element instead.
    const s = shading
    const shadingLayers = [
        // soft top light
        `linear-gradient(to bottom, rgba(255,244,225,${
            0.5 * s
        }) 0%, rgba(255,244,225,0) 22%)`,
        // weight along the bottom edge
        `linear-gradient(to top, rgba(48,26,8,${
            0.62 * s
        }) 0%, rgba(48,26,8,0) 34%)`,
        // rolled-off left and right ends
        `linear-gradient(to right, rgba(48,26,8,${
            0.5 * s
        }) 0%, rgba(48,26,8,0) 14%, rgba(48,26,8,0) 86%, rgba(48,26,8,${
            0.5 * s
        }) 100%)`,
        // centre lift so the board is not flat across its face
        `radial-gradient(120% 90% at 42% 34%, rgba(255,238,210,${
            0.34 * s
        }) 0%, rgba(255,238,210,0) 62%)`,
    ].join(", ")

    // Accepts a bare domain as well as a full URL, since a link typed without
    // a protocol would otherwise fail to parse and leave the icon blank
    const hostOf = (url) => {
        if (!url) return ""
        const raw = String(url).trim()
        if (!raw) return ""
        const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
            ? raw
            : `https://${raw}`
        try {
            return new URL(withScheme).hostname.replace(/^www\./, "")
        } catch (error) {
            // Last resort, pull the host out by hand
            return raw
                .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
                .replace(/^www\./, "")
                .split(/[/?#]/)[0]
        }
    }

    // An uploaded icon wins. Otherwise two favicon services are tried in
    // order, since neither covers every domain on its own.
    const iconSources = (item) => {
        const host = hostOf(item.url)
        const list = []
        if (item.icon?.src) list.push(item.icon.src)
        if (host) {
            list.push(`https://logo.clearbit.com/${host}`)
            list.push(
                `https://www.google.com/s2/favicons?domain=${host}&sz=128`
            )
            list.push(`https://icons.duckduckgo.com/ip3/${host}.ico`)
        }
        return list
    }

    // A name is optional now, an entry only needs one of name or url
    const items = (links || []).filter(
        (item) => item && (item.name || item.url)
    )

    return (
        <div
            ref={wrapRef}
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                perspective: 900,
                ...style,
            }}
        >
            <style>{`
                .plank-src { position: relative; display: block; text-decoration: none; }
                .plank-dot {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background-color: #FFFFFF;
                    overflow: hidden;
                    box-shadow: 0 3px 7px rgba(30,16,4,0.5), 0 0 0 2px rgba(255,255,255,0.92);
                    transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease-out;
                    will-change: transform;
                }
                /* Hidden until every icon source has failed */
                .plank-initial {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: inherit;
                    font-size: 44%;
                    font-weight: 700;
                    color: #6B5540;
                    opacity: 0;
                    z-index: 0;
                }
                .plank-dot img { position: relative; z-index: 1; }
                .plank-src:hover .plank-dot {
                    transform: translateY(-6px) scale(1.14);
                    box-shadow: 0 9px 16px rgba(30,16,4,0.55), 0 0 0 2px #FFFFFF;
                }
                .plank-src:hover { z-index: 5; }
                .plank-tip {
                    position: absolute;
                    left: 50%;
                    bottom: 100%;
                    margin-bottom: 12px;
                    padding: 5px 10px;
                    border-radius: 6px;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transform: translateX(-50%) translateY(4px);
                    transition: opacity 0.16s ease-out, transform 0.16s ease-out;
                }
                .plank-src:hover .plank-tip {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                @media (prefers-reduced-motion: reduce) {
                    .plank-dot, .plank-tip { transition: none; }
                }
                ${
                    isStatic
                        ? `
                /* Static renderer: no motion, no hover states, so the canvas
                   stays calm and exports capture one clean frame */
                .plank-dot, .plank-tip {
                    transition: none !important;
                    will-change: auto !important;
                }
                .plank-src:hover .plank-dot {
                    transform: none;
                    box-shadow: 0 3px 7px rgba(30,16,4,0.5), 0 0 0 2px rgba(255,255,255,0.92);
                }
                .plank-src:hover .plank-tip { opacity: 0; }
                `
                        : ""
                }
            `}</style>

            {label ? (
                <div
                    style={{
                        marginBottom: labelGap,
                        color: labelColor,
                        whiteSpace: "nowrap",
                        fontSize: 15,
                        fontWeight: 500,
                        lineHeight: 1.2,
                        ...(labelFont || {}),
                    }}
                >
                    {label}
                </div>
            ) : null}

            <div
                ref={plankRef}
                onPointerEnter={
                    isStatic ? undefined : () => (hoverRef.current = true)
                }
                onPointerLeave={
                    isStatic ? undefined : () => (hoverRef.current = false)
                }
                style={{
                    position: "relative",
                    width: "100%",
                    height: plankHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transformStyle: isStatic ? "flat" : "preserve-3d",
                    // At rest on the canvas and in exports, animated live
                    transform: isStatic ? "none" : undefined,
                    willChange: isStatic ? "auto" : "transform",
                }}
            >
                {/* The wood is its own clipped layer so tooltips can rise
                    past the plank edge instead of being cut off */}
                <div
                    ref={woodRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        clipPath: clip,
                        overflow: "hidden",
                        backgroundColor: woodTint,
                        backgroundImage: woodImage?.src
                            ? `url(${woodImage.src})`
                            : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        filter: "drop-shadow(0 5px 10px rgba(60,38,18,0.25))",
                    }}
                >
                    {/* Moving specular band, parked in its neutral position
                        whenever the renderer is static */}
                    <div
                        ref={sheenRef}
                        style={{
                            position: "absolute",
                            top: "-40%",
                            left: "-40%",
                            width: "180%",
                            height: "180%",
                            background: `linear-gradient(104deg, rgba(255,247,228,0) 32%, rgba(255,247,228,${
                                0.5 * sheen
                            }) 47%, rgba(255,247,228,0) 62%)`,
                            transform: isStatic
                                ? "translate3d(0, 0, 0)"
                                : undefined,
                            willChange: isStatic ? "auto" : "transform",
                            pointerEvents: "none",
                        }}
                    />
                    {/* Fixed form shading */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: shadingLayers,
                            pointerEvents: "none",
                        }}
                    />
                </div>

                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: isStatic ? "none" : "translateZ(22px)",
                    }}
                >
                    {items.map((item, index) => {
                        const sources = iconSources(item)
                        const displayName = item.name || hostOf(item.url)
                        const inner = (
                            <>
                                <div
                                    className="plank-dot"
                                    style={{
                                        width: iconSize,
                                        height: iconSize,
                                    }}
                                >
                                    {sources.length > 0 ? (
                                        <img
                                            src={sources[0]}
                                            alt=""
                                            draggable={false}
                                            data-fallbacks={JSON.stringify(
                                                sources.slice(1)
                                            )}
                                            onError={(event) => {
                                                // Step through the remaining
                                                // sources, then give up and
                                                // let the initial show
                                                const el = event.currentTarget
                                                let queue = []
                                                try {
                                                    queue = JSON.parse(
                                                        el.dataset.fallbacks ||
                                                            "[]"
                                                    )
                                                } catch (error) {
                                                    queue = []
                                                }
                                                const next = queue.shift()
                                                el.dataset.fallbacks =
                                                    JSON.stringify(queue)
                                                if (next) {
                                                    el.src = next
                                                    return
                                                }
                                                // Everything failed, so hand
                                                // over to the letter
                                                el.style.display = "none"
                                                const fallback =
                                                    el.parentElement?.querySelector(
                                                        ".plank-initial"
                                                    )
                                                if (fallback) {
                                                    fallback.style.opacity = "1"
                                                }
                                            }}
                                            style={{
                                                width: "72%",
                                                height: "72%",
                                                objectFit: "contain",
                                            }}
                                        />
                                    ) : null}
                                    <span
                                        className="plank-initial"
                                        style={
                                            sources.length === 0
                                                ? { opacity: 1 }
                                                : undefined
                                        }
                                    >
                                        {(displayName || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <span
                                    className="plank-tip"
                                    style={{
                                        backgroundColor: tipBackground,
                                        color: tipColor,
                                        fontSize: 12,
                                        fontWeight: 500,
                                        ...(tipFont || {}),
                                    }}
                                >
                                    {displayName}
                                </span>
                            </>
                        )

                        const wrapperStyle = {
                            marginLeft: index > 0 ? -iconOverlap : 0,
                        }

                        if (!item.url || isStatic) {
                            return (
                                <div
                                    key={index}
                                    className="plank-src"
                                    style={wrapperStyle}
                                >
                                    {inner}
                                </div>
                            )
                        }

                        return (
                            <a
                                key={index}
                                className="plank-src"
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={item.name}
                                style={wrapperStyle}
                            >
                                {inner}
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

SourcePlank.defaultProps = {
    label: "Platforms & Data",
    labelColor: "#4A3520",
    labelGap: 12,
    shape: "taperRight",
    taper: 12,
    cornerRadius: 10,
    woodTint: "#B98A55",
    plankHeight: 88,
    shading: 0.85,
    sheen: 0.5,
    iconSize: 40,
    iconOverlap: 12,
    tipBackground: "#2E2015",
    tipColor: "#FDF1E1",
    driftX: 12,
    driftY: 8,
    tiltAmount: 7,
    hoverBoost: 1.2,
    liftAmount: 10,
    links: [
        { name: "LinkedIn", url: "https://www.linkedin.com/jobs/" },
        { name: "Crunchbase", url: "https://www.crunchbase.com" },
        { name: "Wellfound", url: "https://wellfound.com" },
        { name: "PitchBook", url: "https://pitchbook.com" },
        { name: "Tracxn", url: "https://tracxn.com" },
        { name: "Y Combinator Jobs", url: "https://www.workatastartup.com" },
    ],
}

addPropertyControls(SourcePlank, {
    label: {
        type: ControlType.String,
        title: "Label",
        defaultValue: "Platforms & Data",
    },
    labelFont: {
        type: ControlType.Font,
        title: "Label Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        defaultValue: "#4A3520",
    },
    labelGap: {
        type: ControlType.Number,
        title: "Label Gap",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    shape: {
        type: ControlType.Enum,
        title: "Shape",
        defaultValue: "taperRight",
        options: ["straight", "taperRight", "taperLeft", "barrel"],
        optionTitles: [
            "Straight",
            "Narrow Right",
            "Narrow Left",
            "Narrow Both Ends",
        ],
    },
    taper: {
        type: ControlType.Number,
        title: "Taper",
        defaultValue: 12,
        min: 0,
        max: 40,
        step: 1,
        unit: "%",
        hidden(props) {
            return props.shape === "straight"
        },
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 10,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    woodImage: {
        type: ControlType.ResponsiveImage,
        title: "Wood",
    },
    woodTint: {
        type: ControlType.Color,
        title: "Fallback",
        defaultValue: "#B98A55",
        description: "Shows where the wood image has not loaded.",
    },
    plankHeight: {
        type: ControlType.Number,
        title: "Height",
        defaultValue: 88,
        min: 40,
        max: 300,
        step: 2,
        unit: "px",
    },
    shading: {
        type: ControlType.Number,
        title: "Shading",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Depth of the baked light and shadow on the board.",
    },
    sheen: {
        type: ControlType.Number,
        title: "Sheen",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        description: "Light band that slides across as the board turns.",
    },
    links: {
        type: ControlType.Array,
        title: "Sources",
        control: {
            type: ControlType.Object,
            controls: {
                name: {
                    type: ControlType.String,
                    title: "Name",
                    defaultValue: "LinkedIn",
                },
                url: {
                    type: ControlType.Link,
                    title: "URL",
                },
                icon: {
                    type: ControlType.ResponsiveImage,
                    title: "Icon",
                },
            },
        },
    },
    iconSize: {
        type: ControlType.Number,
        title: "Icon Size",
        defaultValue: 40,
        min: 16,
        max: 120,
        step: 2,
        unit: "px",
    },
    iconOverlap: {
        type: ControlType.Number,
        title: "Overlap",
        defaultValue: 12,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
    tipBackground: {
        type: ControlType.Color,
        title: "Tip BG",
        defaultValue: "#2E2015",
    },
    tipColor: {
        type: ControlType.Color,
        title: "Tip Text",
        defaultValue: "#FDF1E1",
    },
    tipFont: {
        type: ControlType.Font,
        title: "Tip Font",
        controls: "extended",
        defaultFontType: "sans-serif",
    },
    driftX: {
        type: ControlType.Number,
        title: "Drift X",
        defaultValue: 12,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    driftY: {
        type: ControlType.Number,
        title: "Drift Y",
        defaultValue: 8,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    tiltAmount: {
        type: ControlType.Number,
        title: "Tilt",
        defaultValue: 7,
        min: 0,
        max: 30,
        step: 0.5,
        unit: "deg",
    },
    hoverBoost: {
        type: ControlType.Number,
        title: "Hover Boost",
        defaultValue: 1.2,
        min: 0,
        max: 4,
        step: 0.1,
        description: "Extra tilt while the pointer is over the plank.",
    },
    liftAmount: {
        type: ControlType.Number,
        title: "Hover Lift",
        defaultValue: 10,
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
    },
})
