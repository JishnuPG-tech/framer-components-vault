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


/**
 * Hat Showcase
 * Floating cut-out products in a looping 3D carousel.
 * Swipe, use the arrows or the arrow keys to move. Click the centre item
 * to open its link, or flip it to show a details card.
 * Works best with transparent PNG cut-outs.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 760
 */

type Img = { src?: string; srcSet?: string; alt?: string }
type Hat = {
    image?: Img
    title?: string
    price?: string
    label?: string
    description?: string
    link?: string
    scale?: number
}

// Simple cap drawing used until you add your own images
const PLACEHOLDER_COLORS = [
    "#1c1c1f",
    "#b8452f",
    "#d9d4c7",
    "#2f4a3a",
    "#3b4f7a",
    "#8a6a3d",
]
const placeholder = (i: number) => {
    const c = PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 400 280">
<path d="M300 182c42-6 96 4 98 18 2 13-58 15-98 6z" fill="${c}" opacity=".8"/>
<path d="M66 192C66 102 136 52 212 52s124 58 124 136z" fill="${c}"/>
<path d="M212 54c-28 30-44 80-46 136M212 54c30 30 46 80 48 134" stroke="#000" stroke-opacity=".18" stroke-width="3" fill="none"/>
<rect x="64" y="182" width="274" height="16" rx="7" fill="${c}"/>
<rect x="64" y="182" width="274" height="16" rx="7" fill="#000" opacity=".2"/>
<circle cx="212" cy="50" r="8" fill="${c}"/><circle cx="212" cy="50" r="8" fill="#000" opacity=".2"/>
</svg>`
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)
}

const DEFAULT_HAT_IMAGE = {
    src: "https://framerusercontent.com/images/ebXyroy8JEDM5ySSjKYI05Db6os.png?width=1000&height=1000&kb=637",
    alt: "LA Red Snapback",
}

const DEFAULT_HATS: Hat[] = [
    {
        image: DEFAULT_HAT_IMAGE,
        title: "LA Red Snapback",
        price: "$49.99",
    },
    {
        image: DEFAULT_HAT_IMAGE,
        title: "LA Red Snapback",
        price: "$49.99",
    },
    {
        image: DEFAULT_HAT_IMAGE,
        title: "LA Red Snapback",
        price: "$49.99",
    },
]

const CSS = `
.hsx{position:relative;width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;justify-content:center;
  color:var(--hsx-text);padding:52px 0 44px;box-sizing:border-box;
  background:radial-gradient(120% 85% at 50% 28%,var(--hsx-top),var(--hsx-bottom) 72%);}
.hsx::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.18;
  background-image:
    radial-gradient(circle at 20% 30%,rgba(255,255,255,.045) 0 1px,transparent 1px),
    radial-gradient(circle at 80% 70%,rgba(255,255,255,.035) 0 1px,transparent 1px),
    radial-gradient(circle at 60% 20%,rgba(0,0,0,.09) 0 1px,transparent 1px);
  background-size:3px 3px,4px 4px,5px 5px;mix-blend-mode:soft-light}
.hsx--solid{background:var(--hsx-bottom)}
.hsx--clear{background:transparent}
.hsx *,.hsx *::before,.hsx *::after{box-sizing:border-box}
.hsx:focus{outline:none}
.hsx-muted{color:var(--hsx-text);opacity:.55}
.hsx-header{text-align:center;padding:8px 16px 12px}
.hsx-eyebrow{margin:0;font-size:11px;letter-spacing:.24em;text-transform:uppercase}
.hsx-heading{margin:12px 0 0}
.hsx-sub{margin:12px auto 0;max-width:560px;font-size:15px;line-height:1.5}

.hsx-stage{position:relative;flex:none;height:calc(var(--hsx-size) * 1.08 * max(1, var(--hsx-zoom)) + 64px);
  perspective:1600px;touch-action:pan-y;user-select:none;-webkit-user-select:none}
.hsx-glow{position:absolute;inset:0;pointer-events:none;opacity:var(--hsx-glow);
  background:radial-gradient(38% 55% at 50% 42%,rgba(255,255,255,.1),transparent 70%)}
.hsx-floor{position:absolute;left:50%;bottom:2%;width:calc(var(--hsx-size) * 3.2);height:calc(var(--hsx-size) * .52);
  transform:translateX(-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(255,255,255,.08),rgba(255,255,255,.02) 76%,transparent);
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.hsx-item{position:absolute;left:50%;top:46%;width:var(--hsx-size);aspect-ratio:1/.82;
  transform:translate(-50%,-50%) translateX(var(--x,0px)) translateZ(var(--z,0px)) rotateY(var(--ry,0deg)) scale(var(--s,1));
  opacity:var(--o,1);transform-style:preserve-3d;
  transition:transform .85s var(--hsx-ease),opacity .6s var(--hsx-ease)}
.hsx-item[aria-hidden="true"]{pointer-events:none}
.hsx-card{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .9s var(--hsx-ease)}
.hsx-card.is-flipped{transform:rotateY(180deg)}
.hsx-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.hsx-front{appearance:none;background:none;border:0;margin:0;padding:0 0 8%;width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;color:inherit;cursor:pointer}
.hsx-front:focus-visible{outline:none}
.hsx-hat{position:relative;width:100%;display:flex;justify-content:center;
  filter:brightness(var(--dim,1)) blur(var(--blur,0px));transition:filter .6s var(--hsx-ease)}
.hsx-bob{display:block;animation:hsx-bob 6s ease-in-out infinite}
.hsx-tilt{display:block;position:relative;transform:perspective(900px) rotateX(var(--tx,0deg)) rotateY(var(--ty,0deg));
  transition:transform .5s var(--hsx-ease);will-change:transform}
.hsx-img-wrap{display:block;overflow:hidden}
.hsx-img,.hsx-reflect{display:block;width:auto;height:auto;pointer-events:none;-webkit-user-drag:none;
  max-width:calc(var(--hsx-size) * var(--hsx-zoom) * var(--iz,1));
  max-height:calc(var(--hsx-size) * .68 * var(--hsx-zoom) * var(--iz,1))}
.hsx-img{transform:translate(var(--hsx-img-x),var(--hsx-img-y)) scale(var(--hsx-img-crop));
  transform-origin:center center}
.hsx-img{filter:drop-shadow(0 24px 28px rgba(0,0,0,.45))}
.hsx-shadow{position:absolute;left:14%;right:14%;top:94%;height:16%;border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(0,0,0,.55),transparent);animation:hsx-shadow 6s ease-in-out infinite}
.hsx-reflect{position:absolute;left:50%;top:100%;opacity:.14;transform:translateX(-50%) translate(var(--hsx-img-x),var(--hsx-img-y)) scale(var(--hsx-img-crop)) scaleY(-1);
  -webkit-mask:linear-gradient(to top,#000,transparent 42%);mask:linear-gradient(to top,#000,transparent 42%)}
.hsx--still .hsx-bob,.hsx--still .hsx-shadow{animation:none}
@keyframes hsx-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes hsx-shadow{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.88);opacity:.75}}

.hsx-back{transform:rotateY(180deg);display:flex;flex-direction:column;gap:8px;padding:clamp(18px,7%,30px);
  border-radius:22px;border:1px solid rgba(255,255,255,.12);text-align:left;overflow:auto;cursor:pointer;
  background:linear-gradient(160deg,var(--hsx-card1),var(--hsx-card2));box-shadow:0 30px 60px -20px rgba(0,0,0,.7)}
.hsx-back-label{margin:0;font-size:10px;letter-spacing:.22em;text-transform:uppercase}
.hsx-back-title{margin:0;font-size:clamp(20px,3vw,26px) !important;padding-right:36px}
.hsx-back-price{margin:0;font-size:15px}
.hsx-back-desc{margin:0;font-size:13px;line-height:1.5}
.hsx-btn{margin-top:auto;display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:999px;
  background:var(--hsx-text);color:var(--hsx-bottom);font-size:13px;font-weight:600;letter-spacing:.04em;text-decoration:none}
.hsx-close{position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,.12);
  background:transparent;color:inherit;font:inherit;font-size:16px;line-height:1;cursor:pointer}

.hsx-info{text-align:center;padding:0 16px;animation:hsx-in .45s var(--hsx-ease) both}
.hsx-title{margin:0}
.hsx-price{margin:4px 0 0;font-size:13px}
.hsx-hint{margin:6px 0 0;font-size:11px;letter-spacing:.08em;opacity:.38}
@keyframes hsx-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.hsx-controls{display:flex;align-items:center;justify-content:center;gap:18px;margin-top:18px}
.hsx-arrow{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:transparent;
  color:inherit;cursor:pointer;display:grid;place-items:center;padding:0;transition:background .2s}
.hsx-arrow:hover{background:rgba(255,255,255,.08)}
.hsx-progress{position:relative;width:120px;height:2px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}
.hsx-thumb{position:absolute;top:0;bottom:0;left:0;background:var(--hsx-text);border-radius:2px;transition:transform .6s var(--hsx-ease)}
.hsx-empty{margin:auto;opacity:.6;font-size:14px;text-align:center;padding:24px}
@media (prefers-reduced-motion:reduce){
  .hsx-bob,.hsx-shadow,.hsx-info{animation:none}
  .hsx-item,.hsx-card,.hsx-tilt{transition-duration:.01s}
}`

export default function HatShowcase(props) {
    const {
        hats = DEFAULT_HATS,
        eyebrow = "FALL DROP / 03 HATS",
        heading = "Snap Back Collection",
        subheading = "Structured snapbacks, built to last. Tap a hat to see the details.",
        hint = "Tap the hat to flip",
        showInfo = true,
        clickAction = "flip",
        newTab = false,
        buttonText = "Shop now",
        hatSize = 420,
        maxWidth = 68,
        imageScale = 100,
        spacing = 44,
        spacingMobile = 44,
        sideScale = 65,
        depth = 100,
        sideAngle = 5,
        imageCrop = 122,
        imageOffsetX = 0,
        imageOffsetY = -4,
        reflection = true,
        float = true,
        tilt = true,
        showArrows = true,
        showProgress = true,
        autoplay = 0,
        bgStyle = "spotlight",
        bgTop = "#3A3A3D",
        bgBottom = "#121214",
        textColor = "#F2F2F0",
        cardTop = "rgba(58, 58, 62, 0.97)",
        cardBottom = "rgba(24, 24, 26, 0.97)",
        glow = 100,
        floor = true,
        headingFont,
        titleFont,
        bodyFont,
        style,
    } = props

    const n = hats.length
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    const [index, setIndex] = React.useState(0)
    const [flipped, setFlipped] = React.useState(-1)
    const [stageW, setStageW] = React.useState(0)

    const rootRef = React.useRef<HTMLDivElement>(null)
    const stageRef = React.useRef<HTMLDivElement>(null)
    const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
    const tiltRefs = React.useRef<(HTMLSpanElement | null)[]>([])
    const lastOffsets = React.useRef<number[]>([])
    const drag = React.useRef({ x: null as number | null, moved: false })
    const hovering = React.useRef(false)

    const safeIndex = n ? Math.min(index, n - 1) : 0
    // Hat size follows the component width, capped by the "Hat size" setting
    const size = Math.max(
        80,
        Math.min(
            hatSize,
            (stageW || hatSize / (maxWidth / 100)) * (maxWidth / 100)
        )
    )

    const go = React.useCallback(
        (i: number) => {
            if (!n) return
            setFlipped(-1)
            setIndex(((i % n) + n) % n)
        },
        [n]
    )

    // Keep track of the stage width
    React.useLayoutEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        const update = () => setStageW(stage.clientWidth)
        update()
        const ro = new ResizeObserver(update)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [n])

    // Position every hat around the centre one (looping)
    React.useLayoutEffect(() => {
        const w = stageW
        const step = size * ((w < 640 ? spacingMobile : spacing) / 100)
        for (let i = 0; i < n; i++) {
            const el = itemRefs.current[i]
            if (!el) continue
            let off = i - safeIndex
            if (off > n / 2) off -= n
            if (off < -n / 2) off += n
            const a = Math.abs(off)
            const visible = a <= 2
            // A hat that wraps from one end to the other jumps there out of sight
            const prev = lastOffsets.current[i]
            if (prev !== undefined && Math.abs(off - prev) > 1) {
                el.style.transition = "none"
                el.style.opacity = "0"
                requestAnimationFrame(() =>
                    requestAnimationFrame(() => {
                        el.style.transition = ""
                        el.style.opacity = ""
                    })
                )
            }
            lastOffsets.current[i] = off
            el.style.setProperty("--x", off * step * (a > 1 ? 0.9 : 1) + "px")
            el.style.setProperty("--z", -a * depth + "px")
            el.style.setProperty("--ry", off * -sideAngle + "deg")
            el.style.setProperty(
                "--s",
                String([1, sideScale / 100, (sideScale / 100) * 0.72][a] ?? 0.4)
            )
            el.style.setProperty(
                "--o",
                String(!visible ? 0 : a === 0 ? 1 : a === 1 ? 0.92 : 0.4)
            )
            el.style.setProperty("--dim", String([1, 0.6, 0.42][a] ?? 0.3))
            el.style.setProperty(
                "--blur",
                a === 0 ? "0px" : a === 1 ? "0.5px" : "2px"
            )
            el.style.zIndex = String(10 - a)
            el.setAttribute("aria-hidden", visible ? "false" : "true")
        }
    }, [
        safeIndex,
        n,
        size,
        stageW,
        spacing,
        spacingMobile,
        depth,
        sideAngle,
        sideScale,
    ])

    // Autoplay (off on the Framer canvas, paused on hover or while a card is flipped)
    React.useEffect(() => {
        if (!autoplay || isCanvas || n < 2 || flipped > -1) return
        const t = setInterval(() => {
            if (!hovering.current) setIndex((i) => (i + 1) % n)
        }, autoplay * 1000)
        return () => clearInterval(t)
    }, [autoplay, isCanvas, n, flipped])

    const onFrontClick = (e: React.MouseEvent, i: number) => {
        // A side hat always slides to the centre first
        if (i !== safeIndex) return go(i)
        if (clickAction === "link") {
            const url = hats[i]?.link
            if (!url || isCanvas) return
            if (newTab || e.metaKey || e.ctrlKey)
                window.open(url, "_blank", "noopener")
            else window.location.href = url
        } else if (clickAction === "flip") {
            setFlipped((f) => (f === i ? -1 : i))
        }
    }

    // Tap anywhere on the back card to flip it round again (links still work)
    const onBackClick = (e: React.MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest("a, input, select, textarea, button:not(.hsx-close)"))
            return
        setFlipped(-1)
    }

    const onTilt = (e: React.PointerEvent, i: number) => {
        if (!tilt || e.pointerType !== "mouse" || i !== safeIndex) return
        const el = tiltRefs.current[i]
        if (!el) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        el.style.setProperty("--tx", (0.5 - py) * 16 + "deg")
        el.style.setProperty("--ty", (px - 0.5) * 22 + "deg")
    }
    const resetTilt = (i: number) => {
        const el = tiltRefs.current[i]
        if (!el) return
        el.style.setProperty("--tx", "0deg")
        el.style.setProperty("--ty", "0deg")
    }

    const classes = ["hsx"]
    if (bgStyle === "solid") classes.push("hsx--solid")
    if (bgStyle === "none") classes.push("hsx--clear")
    if (!float) classes.push("hsx--still")

    const rootStyle = {
        ...style,
        ...bodyFont,
        "--hsx-top": bgTop,
        "--hsx-bottom": bgBottom,
        "--hsx-text": textColor,
        "--hsx-card1": cardTop,
        "--hsx-card2": cardBottom,
        "--hsx-size": size + "px",
        "--hsx-zoom": imageScale / 100,
        "--hsx-glow": glow / 100,
        "--hsx-img-crop": imageCrop / 100,
        "--hsx-img-x": imageOffsetX + "%",
        "--hsx-img-y": imageOffsetY + "%",
        "--hsx-ease": "cubic-bezier(0.22, 0.8, 0.24, 1)",
    } as React.CSSProperties

    const current = hats[safeIndex] || {}

    return (
        <div
            ref={rootRef}
            className={classes.join(" ")}
            style={rootStyle}
            tabIndex={-1}
            onPointerEnter={() => (hovering.current = true)}
            onPointerLeave={() => (hovering.current = false)}
            onKeyDown={(e) => {
                if (
                    (e.target as HTMLElement).closest("input, select, textarea")
                )
                    return
                if (e.key === "ArrowLeft") go(safeIndex - 1)
                else if (e.key === "ArrowRight") go(safeIndex + 1)
                else if (e.key === "Escape") setFlipped(-1)
            }}
        >
            <style>{CSS}</style>

            {(eyebrow || heading || subheading) && (
                <div className="hsx-header">
                    {eyebrow && (
                        <p className="hsx-eyebrow hsx-muted">{eyebrow}</p>
                    )}
                    {heading && (
                        <h2 className="hsx-heading" style={headingFont}>
                            {heading}
                        </h2>
                    )}
                    {subheading && (
                        <p className="hsx-sub hsx-muted">{subheading}</p>
                    )}
                </div>
            )}

            {n === 0 ? (
                <p className="hsx-empty">Add hats in the properties panel →</p>
            ) : (
                <div
                    ref={stageRef}
                    className="hsx-stage"
                    onPointerDown={(e) => {
                        drag.current = { x: e.clientX, moved: false }
                    }}
                    onPointerMove={(e) => {
                        const d = drag.current
                        if (d.x !== null && Math.abs(e.clientX - d.x) > 8)
                            d.moved = true
                    }}
                    onPointerUp={(e) => {
                        const d = drag.current
                        if (d.x === null) return
                        const dx = e.clientX - d.x
                        d.x = null
                        if (dx > 50) go(safeIndex - 1)
                        else if (dx < -50) go(safeIndex + 1)
                    }}
                    onPointerCancel={() => (drag.current.x = null)}
                    onClickCapture={(e) => {
                        // Ignore the click that follows a swipe
                        if (drag.current.moved) {
                            e.stopPropagation()
                            e.preventDefault()
                            drag.current.moved = false
                        }
                    }}
                    onClick={(e) => {
                        // Tapping the empty space around the hats flips a card back
                        if (!(e.target as HTMLElement).closest(".hsx-item"))
                            setFlipped(-1)
                    }}
                >
                    <div className="hsx-glow" />
                    {floor && <div className="hsx-floor" />}

                    {hats.map((hat: Hat, i: number) => {
                        const src = hat.image?.src || DEFAULT_HAT_IMAGE.src
                        const title = hat.title || "Untitled"
                        return (
                            <div
                                key={i}
                                ref={(el) => {
                                    itemRefs.current[i] = el
                                }}
                                className="hsx-item"
                                style={
                                    {
                                        "--iz": (hat.scale ?? 100) / 100,
                                    } as React.CSSProperties
                                }
                            >
                                <div
                                    className={
                                        "hsx-card" +
                                        (flipped === i ? " is-flipped" : "")
                                    }
                                >
                                    <button
                                        type="button"
                                        className="hsx-face hsx-front"
                                        aria-label={title}
                                        onClick={(e) => onFrontClick(e, i)}
                                        onPointerMove={(e) => onTilt(e, i)}
                                        onPointerLeave={() => resetTilt(i)}
                                    >
                                        <span className="hsx-hat">
                                            <span className="hsx-bob">
                                                <span
                                                    className="hsx-tilt"
                                                    ref={(el) => {
                                                        tiltRefs.current[i] =
                                                            el
                                                    }}
                                                >
                                                    <img
                                                        className="hsx-img"
                                                        src={src}
                                                        srcSet={
                                                            hat.image?.srcSet
                                                        }
                                                        alt={
                                                            hat.image?.alt ||
                                                            DEFAULT_HAT_IMAGE.alt ||
                                                            title
                                                        }
                                                        draggable={false}
                                                    />
                                                </span>
                                            </span>
                                            <span className="hsx-shadow" />
                                            {reflection && (
                                                <img
                                                    className="hsx-reflect"
                                                    src={src}
                                                    alt=""
                                                    draggable={false}
                                                />
                                            )}
                                        </span>
                                    </button>

                                    {clickAction === "flip" && (
                                        <div
                                            className="hsx-face hsx-back"
                                            onClick={onBackClick}
                                        >
                                            <button
                                                type="button"
                                                className="hsx-close"
                                                aria-label="Flip back"
                                                onClick={() => setFlipped(-1)}
                                            >
                                                ×
                                            </button>
                                            {hat.label && (
                                                <p className="hsx-back-label hsx-muted">
                                                    {hat.label}
                                                </p>
                                            )}
                                            <h3
                                                className="hsx-back-title"
                                                style={titleFont}
                                            >
                                                {title}
                                            </h3>
                                            {hat.price && (
                                                <p className="hsx-back-price">
                                                    {hat.price}
                                                </p>
                                            )}
                                            {hat.description && (
                                                <p className="hsx-back-desc hsx-muted">
                                                    {hat.description}
                                                </p>
                                            )}
                                            {hat.link && buttonText && (
                                                <a
                                                    className="hsx-btn"
                                                    href={hat.link}
                                                    target={
                                                        newTab
                                                            ? "_blank"
                                                            : undefined
                                                    }
                                                    rel={
                                                        newTab
                                                            ? "noopener"
                                                            : undefined
                                                    }
                                                >
                                                    {buttonText}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {n > 0 && showInfo && (
                <div className="hsx-info" key={safeIndex}>
                    <h3 className="hsx-title" style={titleFont}>
                        {current.title || "Untitled"}
                    </h3>
                    {current.price && (
                        <p className="hsx-price hsx-muted">{current.price}</p>
                    )}
                    {hint && <p className="hsx-hint">{hint}</p>}
                </div>
            )}

            {n > 1 && (showArrows || showProgress) && (
                <div className="hsx-controls">
                    {showArrows && (
                        <button
                            type="button"
                            className="hsx-arrow"
                            aria-label="Previous"
                            onClick={() => go(safeIndex - 1)}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                    )}
                    {showProgress && (
                        <div className="hsx-progress">
                            <span
                                className="hsx-thumb"
                                style={{
                                    width: 100 / n + "%",
                                    transform: `translateX(${safeIndex * 100}%)`,
                                }}
                            />
                        </div>
                    )}
                    {showArrows && (
                        <button
                            type="button"
                            className="hsx-arrow"
                            aria-label="Next"
                            onClick={() => go(safeIndex + 1)}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

HatShowcase.displayName = "Hat Showcase"

addPropertyControls(HatShowcase, {
    hats: {
        type: ControlType.Array,
        title: "Hats",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Cut-out" },
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Hat name",
                },
                price: {
                    type: ControlType.String,
                    title: "Price",
                    defaultValue: "$45",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Snapback",
                },
                description: {
                    type: ControlType.String,
                    title: "Back text",
                    displayTextArea: true,
                    defaultValue: "",
                },
                link: { type: ControlType.Link, title: "Link" },
                scale: {
                    type: ControlType.Number,
                    title: "Image size",
                    min: 50,
                    max: 150,
                    step: 5,
                    unit: "%",
                    defaultValue: 100,
                },
            },
        },
        defaultValue: DEFAULT_HATS,
    },

    eyebrow: {
        type: ControlType.String,
        title: "Eyebrow",
        defaultValue: "FALL DROP / 03 HATS",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        defaultValue: "Snap Back Collection",
    },
    subheading: {
        type: ControlType.String,
        title: "Subheading",
        displayTextArea: true,
        defaultValue: "",
    },
    showInfo: {
        type: ControlType.Boolean,
        title: "Name & price",
        defaultValue: true,
    },
    hint: {
        type: ControlType.String,
        title: "Hint",
        defaultValue: "Tap the hat to flip",
        hidden: (p) => !p.showInfo,
    },

    clickAction: {
        type: ControlType.Enum,
        title: "On click",
        options: ["link", "flip", "none"],
        optionTitles: ["Open link", "Flip card", "Nothing"],
        defaultValue: "flip",
        description:
            "Clicking a side hat always brings it to the centre first.",
    },
    newTab: {
        type: ControlType.Boolean,
        title: "New tab",
        defaultValue: false,
        hidden: (p) => p.clickAction === "none",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button",
        defaultValue: "Shop now",
        hidden: (p) => p.clickAction !== "flip",
    },

    hatSize: {
        type: ControlType.Number,
        title: "Hat size",
        min: 120,
        max: 800,
        step: 10,
        unit: "px",
        defaultValue: 420,
    },
    maxWidth: {
        type: ControlType.Number,
        title: "Max width",
        min: 30,
        max: 95,
        step: 1,
        unit: "%",
        defaultValue: 68,
        description:
            "Hat size never goes past this share of the component width (keeps mobile tidy).",
    },
    imageScale: {
        type: ControlType.Number,
        title: "Image size",
        min: 50,
        max: 150,
        step: 5,
        unit: "%",
        defaultValue: 100,
    },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        min: 30,
        max: 130,
        step: 5,
        unit: "%",
        defaultValue: 44,
        description: "Under 100% the hats overlap.",
    },
    spacingMobile: {
        type: ControlType.Number,
        title: "Spacing (mobile)",
        min: 30,
        max: 130,
        step: 5,
        unit: "%",
        defaultValue: 44,
        description: "Used when the component is narrower than 640px.",
    },
    reflection: {
        type: ControlType.Boolean,
        title: "Reflection",
        defaultValue: true,
    },
    float: { type: ControlType.Boolean, title: "Float", defaultValue: true },
    tilt: {
        type: ControlType.Boolean,
        title: "Mouse tilt",
        defaultValue: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Arrows",
        defaultValue: true,
    },
    showProgress: {
        type: ControlType.Boolean,
        title: "Progress",
        defaultValue: true,
    },
    autoplay: {
        type: ControlType.Number,
        title: "Autoplay",
        min: 0,
        max: 10,
        step: 1,
        unit: "s",
        defaultValue: 0,
        description: "0 is off.",
    },

    bgStyle: {
        type: ControlType.Enum,
        title: "Background",
        options: ["spotlight", "solid", "none"],
        optionTitles: ["Spotlight", "Solid", "None"],
        displaySegmentedControl: true,
        defaultValue: "spotlight",
    },
    bgTop: {
        type: ControlType.Color,
        title: "Centre",
        defaultValue: "#3A3A3D",
        hidden: (p) => p.bgStyle !== "spotlight",
    },
    bgBottom: {
        type: ControlType.Color,
        title: "Edges",
        defaultValue: "#121214",
        hidden: (p) => p.bgStyle === "none",
    },
    glow: {
        type: ControlType.Number,
        title: "Glow",
        min: 0,
        max: 100,
        step: 5,
        unit: "%",
        defaultValue: 100,
    },
    floor: {
        type: ControlType.Boolean,
        title: "Floor ring",
        defaultValue: true,
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#F2F2F0",
    },
    cardTop: {
        type: ControlType.Color,
        title: "Card top",
        defaultValue: "rgba(58, 58, 62, 0.97)",
        hidden: (p) => p.clickAction !== "flip",
    },
    cardBottom: {
        type: ControlType.Color,
        title: "Card bottom",
        defaultValue: "rgba(24, 24, 26, 0.97)",
        hidden: (p) => p.clickAction !== "flip",
    },

    headingFont: {
        type: ControlType.Font,
        title: "Heading font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 48,
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.05em",
        },
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: {
            fontSize: 34,
            variant: "Bold",
            letterSpacing: "-0.02em",
            lineHeight: "1.1em",
        },
    },
    bodyFont: {
        type: ControlType.Font,
        title: "Body font",
        controls: "basic",
        defaultFontType: "sans-serif",
    },
})
