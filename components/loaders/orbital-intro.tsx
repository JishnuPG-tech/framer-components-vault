import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { gsap } from "gsap"

/**
 * Orbit Preloader — Framer code component (GSAP)
 *
 * Drop it anywhere on the page (any size). On the live site it renders
 * into <body>, covers the viewport, counts up with rolling digits, then
 * reveals the brand name centered, and opens an iris to show the page.
 * In static contexts (canvas, export) it shows a static preview with no
 * animation, so you can style it.
 *
 * Typography: counter, % sign, status and brand each have
 * their own font settings.
 */

const DEFAULT_STATUSES = [
    "Warming up",
    "Loading assets",
    "Setting the stage",
    "Almost there",
    "Ready",
]
const THRESHOLDS = [0, 30, 60, 90, 100]

const DEFAULT_IMAGES = Array.from(
    { length: 6 },
    (_, i) => `https://picsum.photos/seed/atelier-${i + 11}/300/400`
)

const DH = 1.1 // digit slot height in em

const CSS = `
.ap-root{
  --r:0px;
  position:relative;width:100%;height:100%;
  container-type:size;
  display:grid;place-items:center;overflow:hidden;
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
  -webkit-mask-image:radial-gradient(circle at 50% 50%,transparent var(--r),#000 calc(var(--r) + 1px));
          mask-image:radial-gradient(circle at 50% 50%,transparent var(--r),#000 calc(var(--r) + 1px));
}
.ap-root.ap-live{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000}
.ap-static,.ap-static *{transition:none!important;animation:none!important}
.ap-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

.ap-stage{position:relative;width:min(72cqmin,540px);aspect-ratio:1/1;display:grid;place-items:center}
.ap-rings{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.ap-rings circle{fill:none;stroke:currentColor}
.ap-track{stroke-opacity:.1;stroke-width:1}
.ap-dash{stroke-opacity:.3;stroke-width:1.5;stroke-dasharray:1 9;stroke-linecap:round}
.ap-rings circle.ap-prog{stroke:var(--ap-accent);stroke-width:2;stroke-linecap:round}
.ap-rings circle.ap-dot{fill:var(--ap-accent);stroke:none}
.ap-rings circle.ap-pulse{stroke:var(--ap-accent);stroke-width:1.5;fill:none;pointer-events:none}

/* rolling counter */
.ap-counter{position:relative;display:flex;align-items:flex-start;line-height:1;font-weight:200;letter-spacing:-.05em}
.ap-num{display:flex;font-size:clamp(72px,16cqmin,150px);font-variant-numeric:tabular-nums}
.ap-dg{display:block;height:${DH}em;width:.6em;overflow:hidden;transition:width .6s cubic-bezier(.16,1,.3,1)}
.ap-dg-s{display:flex;flex-direction:column;transition:transform .7s cubic-bezier(.16,1,.3,1)}
.ap-dg-s span{display:block;height:${DH}em;line-height:${DH}em;text-align:center}
.ap-pct{position:absolute;left:100%;top:0;font-size:clamp(13px,2.6cqmin,22px);margin:.7em 0 0 .35em;color:var(--ap-accent);letter-spacing:0;font-weight:400;opacity:.85}

/* gallery */
.ap-gallery{--g:1;--b:0px;--cw:clamp(60px,10cqmin,124px);position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}
.ap-card{position:absolute;left:0;top:0;width:var(--cw);height:calc(var(--cw) * 1.3);will-change:transform}
.ap-card-in{width:100%;height:100%;border-radius:6px;overflow:hidden;background:#e6e6e8}
.ap-card img{width:100%;height:100%;display:block;object-fit:cover;filter:grayscale(var(--g)) blur(var(--b));transform:scale(1.08)}

/* hairline frame */
.ap-frame{position:absolute;inset:var(--fi,16px);border:1px solid color-mix(in srgb,currentColor 14%,transparent);pointer-events:none;z-index:2}
.ap-fc{position:absolute;width:10px;height:10px;border:0 solid color-mix(in srgb,currentColor 60%,transparent)}
.ap-fc-tl{top:-1px;left:-1px;border-top-width:1px;border-left-width:1px}
.ap-fc-tr{top:-1px;right:-1px;border-top-width:1px;border-right-width:1px}
.ap-fc-bl{bottom:-1px;left:-1px;border-bottom-width:1px;border-left-width:1px}
.ap-fc-br{bottom:-1px;right:-1px;border-bottom-width:1px;border-right-width:1px}

/* corners */
.ap-corner{position:absolute;font-size:11px;letter-spacing:.24em;text-transform:uppercase;z-index:3;--co:calc(var(--fi,16px) + 18px)}
.ap-tl{top:var(--co);left:var(--co)}
.ap-tr{top:var(--co);right:var(--co)}
.ap-ct{top:100%;left:50%;width:0;margin-top:6px;display:flex;justify-content:center;font-weight:400;white-space:nowrap}
.ap-bl{bottom:var(--co);left:var(--co)}
.ap-br{bottom:var(--co);right:var(--co)}
.ap-roll{display:inline-block;overflow:hidden;line-height:1.5;vertical-align:top}
.ap-roll-t{display:inline-block;will-change:transform}
.ap-cc{top:50%;left:50%;width:0;margin-top:-8px;display:flex;justify-content:center;font-weight:400;white-space:nowrap}
.ap-cl{top:100%;left:0;margin-top:6px;font-weight:400;white-space:nowrap}
.ap-cr{top:100%;right:0;margin-top:6px;font-weight:400;white-space:nowrap;text-align:right}
.ap-ct .ap-roll,.ap-cc .ap-roll{flex:none}

/* counter placed in a corner */
.ap-counter.ap-cp{position:absolute;z-index:3;--co:calc(var(--fi,16px) + 18px)}
.ap-counter.ap-cp .ap-num{font-size:clamp(48px,10cqmin,96px)}
.ap-p-tl{top:var(--co);left:var(--co)}
.ap-p-tr{top:var(--co);right:var(--co)}
.ap-p-bl{bottom:var(--co);left:var(--co)}
.ap-p-br{bottom:var(--co);right:var(--co)}
.ap-counter.ap-p-tr .ap-pct,.ap-counter.ap-p-br .ap-pct{position:static}
.ap-counter.ap-hide .ap-num,.ap-counter.ap-hide .ap-pct{display:none}

/* centered brand (revealed at the end) */
.ap-brand{
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;
  display:flex;white-space:nowrap;font-weight:600;letter-spacing:.32em;
  font-size:clamp(28px,7cqmin,72px);padding-left:.32em;
}
.ap-mask{display:inline-block;overflow:hidden;line-height:1.3}
.ap-ch{display:inline-block;transform:translateY(120%)}
`

type Props = {
    brand: string
    statuses: string[]
    images: string[]
    background: string
    textColor: string
    accent: string
    brandColor: string
    statusColor: string
    showCounter: boolean
    counterPosition: "center" | "bl" | "br" | "tl" | "tr"
    counterFont: React.CSSProperties
    percentFont: React.CSSProperties
    statusFont: React.CSSProperties
    brandFont: React.CSSProperties
    statusSpeed: number
    statusHold: number
    cardsConverge: boolean
    cardsDistance: number
    parallax: boolean
    parallaxStrength: number
    statusPosition: "bl" | "br" | "tl" | "tr" | "center"
    showFrame: boolean
    frameInset: number
    galleryBlur: number
    showRings: boolean
    showPulse: boolean
    enableBlur: boolean
    minTime: number
    brandHold: number
    pageReveal: boolean
    showOnce: boolean
    style?: React.CSSProperties
}
/**
 * @framerDisableUnlink
 */
export default function OrbitalIntroPreloader(props: Props) {
    const {
        brand,
        statuses,
        images,
        background,
        textColor,
        accent,
        brandColor,
        statusColor,
        showCounter,
        counterPosition,
        counterFont,
        percentFont,
        statusFont,
        brandFont,
        statusPosition,
        statusSpeed,
        statusHold,
        cardsConverge,
        cardsDistance,
        parallax,
        parallaxStrength,
        showFrame,
        frameInset,
        galleryBlur,
        showRings,
        showPulse,
        enableBlur,
        minTime,
        brandHold,
        pageReveal,
        showOnce,
        style,
    } = props

    // Static contexts (Framer canvas, export, thumbnails): no animations,
    // no timers, no listeners, no page cover — just a plain styled preview.
    const isStatic = useIsStaticRenderer()
    const isCanvas = isStatic || RenderTarget.current() === RenderTarget.canvas
    const [done, setDone] = useState(false)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    const rootRef = useRef<HTMLDivElement>(null)
    const numRef = useRef<HTMLDivElement>(null)
    const statusRef = useRef<HTMLDivElement>(null)
    const pulseRef = useRef<SVGGElement>(null)
    const ringCRef = useRef<SVGCircleElement>(null)
    const dotRef = useRef<SVGCircleElement>(null)
    const galleryRef = useRef<HTMLDivElement>(null)

    const imgs = images && images.length ? images : DEFAULT_IMAGES
    const labels =
        statuses && statuses.length === 5 ? statuses : DEFAULT_STATUSES
    const imgKey = imgs.join("|")
    const labelKey = labels.join("|")

    // Keep the brand's optical centering when a custom letter-spacing is set
    const brandLS = (brandFont as any)?.letterSpacing
    const brandPad =
        brandLS === undefined || brandLS === null || brandLS === ""
            ? undefined
            : typeof brandLS === "number"
              ? `${brandLS}px`
              : String(brandLS)

    useEffect(() => {
        const root = rootRef.current
        const gallery = galleryRef.current
        const numWrap = numRef.current
        const statusEl = statusRef.current
        const ringC = ringCRef.current
        const dot = dotRef.current
        const pulseG = pulseRef.current
        if (
            !root ||
            !gallery ||
            !numWrap ||
            !statusEl ||
            !ringC ||
            !dot ||
            !pulseG
        )
            return

        if (!isCanvas && showOnce) {
            try {
                if (sessionStorage.getItem("orbit-preloader-seen")) {
                    setDone(true)
                    return
                }
            } catch (e) {}
        }

        const cards = Array.from(gallery.children) as HTMLElement[]
        const slots = Array.from(
            numWrap.querySelectorAll(".ap-dg")
        ) as HTMLElement[]
        const strips = Array.from(
            numWrap.querySelectorAll(".ap-dg-s")
        ) as HTMLElement[]
        const [hSlot, tSlot] = slots
        const [hStrip, tStrip, oStrip] = strips

        const CC = 2 * Math.PI * 130
        ringC.style.strokeDasharray = `${CC} ${CC}`

        const state = { p: 0 }
        let lastV = -1

        const setDigits = (v: number) => {
            if (v === lastV) return
            lastV = v
            const h = v >= 100 ? 1 : 0
            const t = v >= 10 ? (Math.floor(v / 10) % 10) + 1 : 0
            const o = v % 10
            hSlot.style.width = h ? ".6em" : "0em"
            tSlot.style.width = v >= 10 ? ".6em" : "0em"
            hStrip.style.transform = `translateY(${-h * DH}em)`
            tStrip.style.transform = `translateY(${-t * DH}em)`
            oStrip.style.transform = `translateY(${-o * DH}em)`
        }

        // Text roll: old text slides up out of its mask, new text rises in
        const rollTo = (
            el: HTMLElement | null,
            text: string,
            anim: boolean,
            done?: () => void
        ) => {
            const inner = el?.querySelector(".ap-roll-t") as HTMLElement | null
            if (!inner) return
            gsap.killTweensOf(inner)
            if (!anim) {
                inner.textContent = text
                gsap.set(inner, { yPercent: 0 })
                return
            }
            gsap.timeline({ onComplete: () => done && done() })
                .to(inner, {
                    yPercent: -110,
                    duration: statusSpeed * 0.4,
                    ease: "power2.in",
                })
                .add(() => {
                    inner.textContent = text
                })
                .fromTo(
                    inner,
                    { yPercent: 110 },
                    {
                        yPercent: 0,
                        duration: statusSpeed * 0.6,
                        ease: "power3.out",
                    }
                )
        }

        // Milestone pulse: ripple from the progress dot + echo of the ring
        const SVGNS = "http://www.w3.org/2000/svg"
        const pulse = (big: boolean) => {
            const mk = (cx: string, cy: string, r: number) => {
                const c = document.createElementNS(SVGNS, "circle")
                c.setAttribute("class", "ap-pulse")
                c.setAttribute("cx", cx)
                c.setAttribute("cy", cy)
                c.setAttribute("r", String(r))
                pulseG.appendChild(c)
                return c
            }
            const dotPulse = mk(
                dot.getAttribute("cx") || "200",
                dot.getAttribute("cy") || "70",
                4
            )
            gsap.fromTo(
                dotPulse,
                { attr: { r: 4 }, opacity: 0.9 },
                {
                    attr: { r: big ? 64 : 42 },
                    opacity: 0,
                    duration: 1.3,
                    ease: "power2.out",
                    onComplete: () => dotPulse.remove(),
                }
            )
            const echo = mk("200", "200", 130)
            gsap.fromTo(
                echo,
                { attr: { r: 130 }, opacity: 0.45 },
                {
                    attr: { r: big ? 178 : 152 },
                    opacity: 0,
                    duration: 1.5,
                    ease: "power2.out",
                    onComplete: () => echo.remove(),
                }
            )
        }

        // Status queue: every label is shown in order, rolls in, then holds
        // for `statusHold` seconds so it can actually be read.
        const lastIdx = THRESHOLDS.length - 1
        let shown = 0
        let target = 0
        let busy = false
        let holdCall: gsap.core.Tween | null = null
        let drainCb: (() => void) | null = null
        const step = () => {
            if (!alive) return
            if (busy) return
            if (shown >= target) {
                if (drainCb && shown >= lastIdx) {
                    const cb = drainCb
                    drainCb = null
                    cb()
                }
                return
            }
            busy = true
            shown++
            if (showPulse) pulse(shown === lastIdx)
            rollTo(statusEl, labels[shown], true, () => {
                holdCall = gsap.delayedCall(statusHold, () => {
                    busy = false
                    step()
                })
            })
        }
        // Resolves once the last label ("Ready") has been shown and held
        const whenStatusDone = (cb: () => void) => {
            drainCb = cb
            target = lastIdx
            step()
        }

        const render = () => {
            const p = state.p
            setDigits(Math.round(p))
            ringC.style.strokeDashoffset = String(CC * (1 - p / 100))
            const ang = ((-90 + p * 3.6) * Math.PI) / 180
            dot.setAttribute("cx", String(200 + 130 * Math.cos(ang)))
            dot.setAttribute("cy", String(200 + 130 * Math.sin(ang)))
            gallery.style.setProperty("--g", (1 - p / 100).toFixed(3))
            gallery.style.setProperty(
                "--b",
                (
                    Math.pow(1 - p / 100, 1.4) * (enableBlur ? galleryBlur : 0)
                ).toFixed(2) + "px"
            )
            let t = 0
            for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
                if (p >= THRESHOLDS[i]) {
                    t = i
                    break
                }
            }
            if (isCanvas) {
                if (t !== shown) {
                    shown = t
                    rollTo(statusEl, labels[t], false)
                }
            } else {
                target = Math.max(target, t)
                step()
            }
        }

        const orbit = { a: 0, r: 1 }

        // Parallax: each card sits at its own depth, so it shifts (and tilts)
        // by a different amount as the pointer moves. Eased via `mouse`.
        const DEPTHS = [0.6, 1.4, 0.9, 1.7, 0.5, 1.2]
        const mouse = { x: 0, y: 0 }
        const cardsIn = Array.from(
            gallery.querySelectorAll(".ap-card-in")
        ) as HTMLElement[]

        const place = () => {
            const box = root.getBoundingClientRect()
            const R =
                Math.min(box.width, box.height) *
                (cardsDistance / 100) *
                orbit.r
            // parallax fades out as the cards converge to the center
            const k = parallax ? Math.min(1, orbit.r) : 0
            cards.forEach((c, i) => {
                const t = orbit.a + i * ((Math.PI * 2) / cards.length)
                const d = DEPTHS[i % DEPTHS.length] * k
                gsap.set(c, {
                    x: Math.cos(t) * R - mouse.x * parallaxStrength * d,
                    y: Math.sin(t) * R - mouse.y * parallaxStrength * d,
                    rotation: Math.cos(t) * 7,
                })
                if (k > 0 && cardsIn[i]) {
                    gsap.set(cardsIn[i], {
                        transformPerspective: 700,
                        rotationY: mouse.x * 9 * d,
                        rotationX: -mouse.y * 9 * d,
                    })
                }
            })
        }

        const onPointerMove = (e: PointerEvent) => {
            if (e.pointerType === "touch") return
            const box = root.getBoundingClientRect()
            const nx = ((e.clientX - box.left) / box.width) * 2 - 1
            const ny = ((e.clientY - box.top) / box.height) * 2 - 1
            gsap.to(mouse, {
                x: Math.max(-1, Math.min(1, nx)),
                y: Math.max(-1, Math.min(1, ny)),
                duration: 1.1,
                ease: "power3.out",
                overwrite: true,
            })
        }

        // ---- Canvas: static preview ---------------------------------
        if (isCanvas) {
            state.p = 65
            gsap.set(cards, { xPercent: -50, yPercent: -50 })
            render()
            place()
            return
        }

        // ---- Live ---------------------------------------------------
        const html = document.documentElement
        const prevOverflow = html.style.overflow
        html.style.overflow = "hidden"
        const unlock = () => {
            html.style.overflow = prevOverflow
        }

        const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches

        const pageLoaded = new Promise<void>((res) =>
            document.readyState === "complete"
                ? res()
                : window.addEventListener("load", () => res(), { once: true })
        )
        const imagesLoaded = Promise.all(
            Array.from(gallery.querySelectorAll("img")).map(
                (img) =>
                    new Promise<void>((res) => {
                        if (img.complete) return res()
                        img.addEventListener("load", () => res(), {
                            once: true,
                        })
                        img.addEventListener("error", () => res(), {
                            once: true,
                        })
                    })
            )
        )
        const loaded = Promise.race([
            Promise.all([pageLoaded, imagesLoaded]),
            new Promise((r) => setTimeout(r, 8000)),
        ])
        const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

        let alive = true

        const finish = () => {
            if (!alive) return
            unlock()
            if (showOnce) {
                try {
                    sessionStorage.setItem("orbit-preloader-seen", "1")
                } catch (e) {}
            }
            setDone(true)
        }

        if (reduce) {
            Promise.all([loaded, wait(400)]).then(finish)
            return () => {
                alive = false
                unlock()
            }
        }

        if (parallax) window.addEventListener("pointermove", onPointerMove)

        const ctx = gsap.context(() => {
            render()
            gsap.set(cards, { xPercent: -50, yPercent: -50 })
            place()

            // Gallery orbit — slow and calm
            const spin = gsap.to(orbit, {
                a: Math.PI * 2,
                duration: 70,
                ease: "none",
                repeat: -1,
                onUpdate: place,
            })
            spin.timeScale(7)
            gsap.to(spin, { timeScale: 1, duration: 3.2, ease: "power3.out" })
            gsap.from(".ap-card-in", {
                scale: 0,
                opacity: 0,
                duration: 1.1,
                stagger: 0.09,
                ease: "back.out(1.5)",
                delay: 0.4,
            })

            // Intro
            gsap.from(".ap-ring", {
                opacity: 0,
                scale: 0.6,
                svgOrigin: "200 200",
                duration: 1.4,
                stagger: 0.12,
                ease: "expo.out",
            })
            gsap.from(".ap-frame", {
                opacity: 0,
                duration: 1.4,
                ease: "power2.out",
            })
            gsap.from(".ap-corner, .ap-counter", {
                opacity: 0,
                y: 14,
                duration: 0.9,
                stagger: 0.08,
                ease: "power3.out",
                delay: 0.3,
            })

            // Ambient
            gsap.to(".ap-spin-b", {
                rotation: -360,
                svgOrigin: "200 200",
                duration: 40,
                ease: "none",
                repeat: -1,
            })

            // Irregular, human-feeling progress up to ~90%
            const T = minTime / 1000
            const prog = gsap.timeline({ onUpdate: render })
            prog.to(state, { p: 14, duration: T * 0.22, ease: "power2.out" })
                .to(state, { p: 14, duration: T * 0.08 })
                .to(state, { p: 46, duration: T * 0.22, ease: "power3.inOut" })
                .to(state, { p: 58, duration: T * 0.1, ease: "none" })
                .to(state, { p: 79, duration: T * 0.2, ease: "power2.inOut" })
                .to(state, { p: 90, duration: T * 0.18, ease: "sine.out" })

            // Iris opens, brand slides out, page is revealed
            const exit = () =>
                ctx.add(() => {
                    const box = root.getBoundingClientRect()
                    const reach = Math.hypot(box.width, box.height) / 2 + 60
                    const page = pageReveal
                        ? document.getElementById("main")
                        : null
                    const out = gsap.timeline({
                        onComplete: () => {
                            spin.kill()
                            finish()
                        },
                    })
                    out.to(
                        ".ap-brand .ap-ch",
                        {
                            yPercent: -120,
                            duration: 0.6,
                            stagger: 0.04,
                            ease: "power2.in",
                        },
                        0
                    )
                        .to(
                            ".ap-corner",
                            {
                                opacity: 0,
                                y: -16,
                                duration: 0.45,
                                stagger: 0.04,
                                ease: "power2.in",
                            },
                            0
                        )
                        .to(
                            ".ap-frame",
                            { opacity: 0, duration: 0.6, ease: "power2.in" },
                            0
                        )
                        .to(
                            ".ap-rings",
                            {
                                scale: 1.9,
                                opacity: 0,
                                duration: 1.1,
                                ease: "power3.in",
                            },
                            0.05
                        )
                        .to(
                            orbit,
                            {
                                r: cardsConverge ? 0 : 2.3,
                                duration: 1.2,
                                ease: "power3.in",
                                onUpdate: place,
                            },
                            0.05
                        )
                        .to(
                            ".ap-card-in",
                            {
                                scale: cardsConverge ? 0 : 0.7,
                                duration: 0.8,
                                stagger: { each: 0.06, from: "random" },
                                ease: "power2.in",
                            },
                            0.1
                        )
                        .to(
                            ".ap-card",
                            {
                                opacity: 0,
                                duration: 0.6,
                                stagger: { each: 0.06, from: "random" },
                                ease: "power2.in",
                            },
                            0.3
                        )
                        .to(
                            root,
                            {
                                "--r": reach + "px",
                                duration: 1.6,
                                ease: "expo.inOut",
                            },
                            0.45
                        )
                    if (page) {
                        out.fromTo(
                            page,
                            { scale: 1.07, transformOrigin: "50% 50%" },
                            {
                                scale: 1,
                                duration: 1.9,
                                ease: "expo.out",
                                clearProps: "transform,transformOrigin",
                            },
                            0.55
                        )
                    }
                })

            // Last part: counter leaves, brand appears centered, short hold
            const showBrand = () =>
                ctx.add(() => {
                    const tl = gsap.timeline({ onComplete: exit })
                    // brand only: status text leaves with the counter
                    tl.to(
                        ".ap-corner",
                        { opacity: 0, duration: 0.4, ease: "power2.in" },
                        0.1
                    )
                        .to(
                            ".ap-counter",
                            {
                                scale: 1.12,
                                opacity: 0,
                                duration: 0.5,
                                ease: "power2.in",
                            },
                            0.2
                        )
                        .to(
                            ".ap-rings",
                            {
                                opacity: 0.25,
                                duration: 0.6,
                                ease: "power2.out",
                            },
                            0.2
                        )
                        .to(
                            ".ap-brand .ap-ch",
                            {
                                y: 0,
                                yPercent: 0,
                                duration: 0.9,
                                stagger: 0.06,
                                ease: "expo.out",
                            },
                            0.55
                        )
                    // Cards glide into the center, behind the brand text
                    if (cardsConverge) {
                        tl.to(
                            orbit,
                            {
                                r: 0,
                                duration: 1.3,
                                ease: "power3.inOut",
                                onUpdate: place,
                            },
                            0.15
                        )
                            .to(
                                ".ap-card",
                                {
                                    opacity: 0.4,
                                    duration: 0.9,
                                    ease: "power2.out",
                                },
                                0.15
                            )
                            .to(
                                ".ap-card-in",
                                {
                                    scale: 0.85,
                                    duration: 1.1,
                                    ease: "power3.inOut",
                                },
                                0.15
                            )
                    }
                    tl.to({}, { duration: brandHold / 1000 })
                })

            Promise.all([loaded, wait(minTime)]).then(() => {
                if (!alive) return
                ctx.add(() => {
                    prog.kill()
                    gsap.to(state, {
                        p: 100,
                        duration: 0.8,
                        ease: "power3.inOut",
                        onUpdate: render,
                        onComplete: () =>
                            whenStatusDone(() =>
                                ctx.add(() => gsap.delayedCall(0.35, showBrand))
                            ),
                    })
                })
            })
        }, root)

        return () => {
            alive = false
            window.removeEventListener("pointermove", onPointerMove)
            gsap.killTweensOf(mouse)
            holdCall?.kill()
            drainCb = null
            ctx.revert()
            gsap.killTweensOf(pulseG.children)
            pulseG.innerHTML = ""
            gsap.killTweensOf(statusEl.querySelector(".ap-roll-t"))
            unlock()
        }
    }, [
        isCanvas,
        mounted,
        minTime,
        brandHold,
        showOnce,
        pageReveal,
        imgKey,
        labelKey,
        galleryBlur,
        enableBlur,
        showPulse,
        statusPosition,
        counterPosition,
        showCounter,
        statusSpeed,
        statusHold,
        cardsConverge,
        cardsDistance,
        parallax,
        parallaxStrength,
        showFrame,
    ])

    if (done) return null

    // Live site, before hydration: plain cover so the page never flashes
    if (!isCanvas && !mounted) {
        return (
            <>
                <style>{CSS}</style>
                {/* Covers the whole page from the very first paint (server HTML),
                    even before React hydrates, and regardless of where the
                    component sits in the Framer layer tree. */}
                <style>{`html{overflow:hidden}body::before{content:"";position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483646;background:${background}}`}</style>
                <div className="ap-root ap-live" style={{ background }} />
            </>
        )
    }

    const counterPos = counterPosition || "center"
    const statusPos = statusPosition || "bl"
    // Same spot as the counter -> status sits right below it
    const belowCounter = showCounter && statusPos === counterPos
    const statusClass = belowCounter
        ? statusPos === "center"
            ? "ap-ct"
            : statusPos.endsWith("l")
              ? "ap-cl"
              : "ap-cr"
        : statusPos === "center"
          ? "ap-cc"
          : `ap-${statusPos}`
    const statusNode = (
        <div
            className={`ap-corner ${statusClass}`}
            ref={statusRef}
            aria-hidden="true"
            style={{ ...statusFont, color: statusColor }}
        >
            <span className="ap-roll">
                <span className="ap-roll-t">{labels[0]}</span>
            </span>
        </div>
    )

    const counterNode = (
        <div
            className={`ap-counter${counterPos === "center" ? "" : ` ap-cp ap-p-${counterPos}`}${showCounter ? "" : " ap-hide"}`}
        >
            <div className="ap-num" ref={numRef} style={{ ...counterFont }}>
                <span className="ap-dg" style={{ width: 0 }}>
                    <span className="ap-dg-s">
                        <span />
                        <span>1</span>
                    </span>
                </span>
                <span className="ap-dg" style={{ width: 0 }}>
                    <span className="ap-dg-s">
                        <span />
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <span key={n}>{n}</span>
                        ))}
                    </span>
                </span>
                <span className="ap-dg">
                    <span className="ap-dg-s">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <span key={n}>{n}</span>
                        ))}
                    </span>
                </span>
            </div>
            <span className="ap-pct" style={{ ...percentFont }}>
                %
            </span>
            {belowCounter && statusNode}
        </div>
    )

    const overlay = (
        <div
            ref={rootRef}
            className={`ap-root${isCanvas ? " ap-static" : " ap-live"}`}
            role="status"
            aria-live="polite"
            style={
                {
                    background,
                    color: textColor,
                    "--ap-accent": accent,
                    "--fi": `${frameInset}px`,
                    ...(isCanvas ? style : {}),
                } as React.CSSProperties
            }
        >
            <style>{CSS}</style>
            <span className="ap-sr">Loading</span>

            {showFrame && (
                <div className="ap-frame" aria-hidden="true">
                    <i className="ap-fc ap-fc-tl" />
                    <i className="ap-fc ap-fc-tr" />
                    <i className="ap-fc ap-fc-bl" />
                    <i className="ap-fc ap-fc-br" />
                </div>
            )}

            {!belowCounter && statusNode}

            <div className="ap-stage" aria-hidden="true">
                <svg
                    className="ap-rings"
                    viewBox="0 0 400 400"
                    style={showRings ? undefined : { display: "none" }}
                >
                    <g className="ap-ring">
                        <circle
                            className="ap-track"
                            cx="200"
                            cy="200"
                            r="190"
                        />
                    </g>
                    <g className="ap-ring">
                        <g className="ap-spin-b">
                            <circle
                                className="ap-dash"
                                cx="200"
                                cy="200"
                                r="160"
                            />
                        </g>
                    </g>
                    <g className="ap-ring">
                        <circle
                            className="ap-track"
                            cx="200"
                            cy="200"
                            r="130"
                        />
                        <circle
                            className="ap-prog"
                            ref={ringCRef}
                            cx="200"
                            cy="200"
                            r="130"
                            transform="rotate(-90 200 200)"
                        />
                        <circle
                            className="ap-dot"
                            ref={dotRef}
                            cx="200"
                            cy="70"
                            r="4"
                        />
                    </g>
                    <g className="ap-pulses" ref={pulseRef} />
                </svg>
                {counterPos === "center" && counterNode}
            </div>

            {counterPos !== "center" && counterNode}

            <div className="ap-gallery" ref={galleryRef} aria-hidden="true">
                {imgs.map((src, i) => (
                    <div className="ap-card" key={i}>
                        <div className="ap-card-in">
                            <img src={src} alt="" draggable={false} />
                        </div>
                    </div>
                ))}
            </div>

            <div
                className="ap-brand"
                aria-label={brand}
                style={{
                    ...brandFont,
                    color: brandColor,
                    ...(brandPad ? { paddingLeft: brandPad } : {}),
                }}
            >
                {[...brand].map((c, i) => (
                    <span className="ap-mask" key={i} aria-hidden="true">
                        <span className="ap-ch">
                            {c === " " ? "\u00A0" : c}
                        </span>
                    </span>
                ))}
            </div>
        </div>
    )

    // Live: render into <body> so it is truly fixed to the viewport
    return isCanvas ? overlay : createPortal(overlay, document.body)
}

OrbitalIntroPreloader.defaultProps = {
    brand: "ATELIER",
    statuses: DEFAULT_STATUSES,
    images: DEFAULT_IMAGES,
    background: "#ffffff",
    textColor: "#0b0b0c",
    accent: "#ff4d2e",
    brandColor: "#0b0b0c",
    statusColor: "#6b6b70",
    statusPosition: "center",
    statusSpeed: 0.8,
    statusHold: 0.8,
    cardsConverge: false,
    cardsDistance: 41,
    parallax: false,
    parallaxStrength: 24,
    showCounter: true,
    counterPosition: "br",
    showFrame: false,
    frameInset: 16,
    galleryBlur: 8,
    showRings: false,
    showPulse: false,
    enableBlur: false,
    minTime: 5400,
    brandHold: 900,
    pageReveal: true,
    showOnce: false,
}

addPropertyControls(OrbitalIntroPreloader, {
    brand: { type: ControlType.String, title: "Brand" },
    statuses: {
        type: ControlType.Array,
        title: "Statuses",
        control: { type: ControlType.String },
        maxCount: 5,
        defaultValue: DEFAULT_STATUSES,
        description: "Exactly 5: shown at 0, 30, 60, 90 and 100%.",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.Image },
        description: "5–6 consistently graded images look best.",
    },

    // ---- Typography -------------------------------------------------
    showCounter: {
        type: ControlType.Boolean,
        title: "Show Counter",
        defaultValue: true,
        description: "Off hides the number and % sign. The status stays.",
    },
    counterPosition: {
        type: ControlType.Enum,
        title: "Counter Position",
        options: ["center", "bl", "br", "tl", "tr"],
        optionTitles: [
            "Center",
            "Bottom Left",
            "Bottom Right",
            "Top Left",
            "Top Right",
        ],
        defaultValue: "br",
        hidden: (p: any) => !p.showCounter,
        description:
            "Corner positions use a smaller size by default; set it in the Counter font.",
    },
    counterFont: {
        type: ControlType.Font,
        title: "Counter",
        hidden: (p: any) => !p.showCounter,
        controls: "extended",
        description: "Big number. Size is in the font size field.",
    },
    percentFont: {
        type: ControlType.Font,
        title: "% Sign",
        hidden: (p: any) => !p.showCounter,
        controls: "extended",
    },
    statusFont: {
        type: ControlType.Font,
        title: "Status",
        controls: "extended",
        description: "Bottom-left loading status.",
    },
    brandFont: {
        type: ControlType.Font,
        title: "Brand",
        controls: "extended",
    },

    statusPosition: {
        type: ControlType.Enum,
        title: "Status Position",
        options: ["bl", "br", "tl", "tr", "center"],
        optionTitles: [
            "Bottom Left",
            "Bottom Right",
            "Top Left",
            "Top Right",
            "Center",
        ],
        defaultValue: "center",
        description: "Same position as the counter = sits right below it.",
    },

    // ---- Layout & motion --------------------------------------------
    statusSpeed: {
        type: ControlType.Number,
        title: "Status Speed",
        min: 0.3,
        max: 4,
        step: 0.1,
        unit: "s",
        defaultValue: 0.8,
        description: "Duration of the status text roll. Higher = slower.",
    },
    statusHold: {
        type: ControlType.Number,
        title: "Status Hold",
        min: 0,
        max: 4,
        step: 0.1,
        unit: "s",
        defaultValue: 0.8,
        description: "How long each status stays readable before the next.",
    },
    cardsDistance: {
        type: ControlType.Number,
        title: "Cards Distance",
        min: 10,
        max: 80,
        step: 1,
        unit: "%",
        defaultValue: 41,
        description:
            "Orbit radius of the cards from the center, as a % of the smaller screen side.",
    },
    parallax: {
        type: ControlType.Boolean,
        title: "Gallery Parallax",
        defaultValue: false,
        description:
            "Cards shift and tilt with the mouse, each at its own depth.",
    },
    parallaxStrength: {
        type: ControlType.Number,
        title: "Parallax Amount",
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
        defaultValue: 24,
        hidden: (p: any) => !p.parallax,
    },
    cardsConverge: {
        type: ControlType.Boolean,
        title: "Cards Fly Into Brand",
        defaultValue: false,
        description:
            "Cards glide to the center behind the brand, then shrink away as the iris opens. Off = they fly outward.",
    },
    showFrame: {
        type: ControlType.Boolean,
        title: "Hairline Frame",
        defaultValue: false,
    },
    frameInset: {
        type: ControlType.Number,
        title: "Frame Inset",
        min: 0,
        max: 60,
        step: 1,
        unit: "px",
        hidden: (p: any) => !p.showFrame,
        description: "Corner text keeps 18px clear of the frame.",
    },
    showRings: {
        type: ControlType.Boolean,
        title: "Orbit Rings",
        defaultValue: false,
        description: "Rings, progress ring and dot. Off hides them all.",
    },
    showPulse: {
        type: ControlType.Boolean,
        title: "Milestone Pulse",
        hidden: (p: any) => !p.showRings,
        defaultValue: false,
        description: "Ripple from the progress dot at 30 / 60 / 90 / 100%.",
    },
    enableBlur: {
        type: ControlType.Boolean,
        title: "Gallery Blur",
        defaultValue: false,
        description: "Images start blurred and sharpen as it loads.",
    },
    galleryBlur: {
        type: ControlType.Number,
        title: "Blur Amount",
        hidden: (p: any) => !p.enableBlur,
        min: 0,
        max: 20,
        step: 1,
        unit: "px",
    },

    // ---- Colors & timing --------------------------------------------
    background: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text" },
    accent: { type: ControlType.Color, title: "Accent" },
    brandColor: { type: ControlType.Color, title: "Brand Color" },
    statusColor: { type: ControlType.Color, title: "Status Color" },
    minTime: {
        type: ControlType.Number,
        title: "Min Time",
        min: 1000,
        max: 8000,
        step: 100,
        unit: "ms",
    },
    brandHold: {
        type: ControlType.Number,
        title: "Brand Hold",
        min: 0,
        max: 3000,
        step: 100,
        unit: "ms",
        description: "How long the centered brand stays before the reveal.",
    },
    pageReveal: {
        type: ControlType.Boolean,
        title: "Page Zoom Reveal",
        defaultValue: true,
        description: "Page scales down into place as the iris opens.",
    },
    showOnce: {
        type: ControlType.Boolean,
        title: "Once / Session",
        defaultValue: false,
    },
})
