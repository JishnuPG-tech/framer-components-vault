import { useEffect, useRef } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Bundled as real dependencies (declared in package.json) instead of being
// fetched from a third-party CDN at runtime — Framer resolves and bundles
// these at publish time, so no external code is loaded on the live site.
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"

/**
 * Fullscreen Scroll Slider
 * -------------------------------------------------------
 * A scroll-pinned fullscreen image slider with a crossfade
 * transition, a word-by-word title reveal, and a progress
 * indicator. Ported from a GSAP + ScrollTrigger demo into a
 * self-contained Framer Code Component.
 *
 * All content (images, titles, colors, timings) is exposed
 * through Property Controls, so nothing is hardcoded.
 */

interface Slide {
    image: string
    title: string
}

interface Props {
    slides: Slide[]
    introText: string
    outroText: string
    navLabel: string
    showIntroOutro: boolean
    showIndices: boolean
    vhPerSlide: number
    overlayOpacity: number
    accentColor: string
    backgroundColor: string
    textColor: string
    titleFont: any
    captionFont: any
    enableSmoothScroll: boolean
}

export default function FullscreenScrollSlider(props: Props) {
    const {
        slides,
        introText,
        outroText,
        navLabel,
        showIntroOutro,
        showIndices,
        vhPerSlide,
        overlayOpacity,
        accentColor,
        backgroundColor,
        textColor,
        titleFont,
        captionFont,
        enableSmoothScroll,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const sliderSectionRef = useRef<HTMLDivElement>(null)
    const imagesWrapRef = useRef<HTMLDivElement>(null)
    const titleWrapRef = useRef<HTMLDivElement>(null)
    const indicesWrapRef = useRef<HTMLDivElement>(null)
    const progressRef = useRef<HTMLDivElement>(null)

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    // True during thumbnail generation, image export, PDF export, etc.
    // No scroll exists in that context, so ScrollTrigger/Lenis must not run.
    const isStatic = useIsStaticRenderer()
    const disableAnimation = isCanvas || isStatic

    // Spread the whole Font control object (fontFamily, fontSize, fontWeight,
    // lineHeight, letterSpacing, textAlign, etc.) so every field set in the
    // Framer panel actually takes effect, not just the family. Computed here
    // (before the effect) so the effect always closes over the latest value.
    const titleFontStyle = titleFont ? { ...titleFont } : {}
    const captionFontStyle = captionFont ? { ...captionFont } : {}
    const titleFontKey = JSON.stringify(titleFontStyle)

    useEffect(() => {
        if (disableAnimation || slides.length === 0) return

        gsap.registerPlugin(ScrollTrigger)

        let lenis: any = null
        let rafId: number | null = null
        let lenisObserver: IntersectionObserver | null = null

        function startRaf() {
            if (rafId !== null) return
            const raf = (time: number) => {
                lenis?.raf(time)
                rafId = requestAnimationFrame(raf)
            }
            rafId = requestAnimationFrame(raf)
        }

        function stopRaf() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId)
                rafId = null
            }
        }

        const ctx = gsap.context(() => {
            // ---- optional smooth scroll (off by default to avoid
            // conflicting with Framer's own scroll / other components) ----
            if (enableSmoothScroll) {
                lenis = new Lenis()
                lenis.on("scroll", ScrollTrigger.update)

                // Only run the rAF loop while the component is actually
                // on screen — pause it when scrolled out of view, resume
                // when it scrolls back in, instead of ticking forever.
                lenisObserver = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            startRaf()
                        } else {
                            stopRaf()
                        }
                    },
                    { threshold: 0 }
                )
                if (rootRef.current) lenisObserver.observe(rootRef.current)
            }
            gsap.ticker.lagSmoothing(0)

            const imagesWrap = imagesWrapRef.current
            const titleWrap = titleWrapRef.current
            const indicesWrap = indicesWrapRef.current
            const progressEl = progressRef.current
            if (!imagesWrap || !titleWrap || !indicesWrap || !progressEl) return

            let activeSlide = 0

            // ---- build the index list on the right ----
            indicesWrap.innerHTML = ""
            slides.forEach((_, index) => {
                const num = (index + 1).toString().padStart(2, "0")
                const el = document.createElement("p")
                el.style.cssText =
                    "display:flex;align-items:center;gap:0.75rem;margin:0;font-size:0.75rem;letter-spacing:0.05em;"
                el.innerHTML = `<span class="fs-marker" style="display:inline-block;width:0.75rem;height:1px;background:${accentColor};transform-origin:right;transform:scaleX(${index === 0 ? 1 : 0});"></span><span class="fs-index" style="opacity:${index === 0 ? 1 : 0.35};color:${textColor};">${num}</span>`
                indicesWrap.appendChild(el)
            })

            function animateIndicators(index: number) {
                const items = indicesWrap!.querySelectorAll("p")
                items.forEach((item, i) => {
                    const marker = item.querySelector(
                        ".fs-marker"
                    ) as HTMLElement
                    const idxEl = item.querySelector(".fs-index") as HTMLElement
                    gsap.to(idxEl, {
                        opacity: i === index ? 1 : 0.35,
                        duration: 0.3,
                        ease: "power2.out",
                    })
                    gsap.to(marker, {
                        scaleX: i === index ? 1 : 0,
                        duration: 0.3,
                        ease: "power2.out",
                    })
                })
            }

            // ---- word-by-word title reveal (no paid SplitText needed) ----
            function animateNewTitle(index: number) {
                titleWrap!.innerHTML = ""
                const h1 = document.createElement("h1")
                h1.style.margin = "0"
                h1.style.color = textColor
                // Apply the full Font control (size, weight, line-height,
                // letter-spacing, family) directly on the element — browsers
                // give <h1> its own default font-size/line-height, which
                // would otherwise win over an inherited value from a parent.
                Object.assign(h1.style, titleFontStyle)
                const words = slides[index].title.split(" ")
                words.forEach((word, i) => {
                    const mask = document.createElement("span")
                    mask.style.cssText =
                        "display:inline-block;overflow:hidden;vertical-align:top;"
                    const inner = document.createElement("span")
                    inner.style.cssText = "display:inline-block;"
                    inner.textContent =
                        word + (i < words.length - 1 ? "\u00A0" : "")
                    mask.appendChild(inner)
                    h1.appendChild(mask)
                    gsap.set(inner, { yPercent: 100, opacity: 0 })
                    gsap.to(inner, {
                        yPercent: 0,
                        opacity: 1,
                        duration: 0.6,
                        delay: i * 0.02,
                        ease: "power3.out",
                    })
                })
                titleWrap!.appendChild(h1)
            }

            function animateNewSlide(index: number) {
                const img = document.createElement("img")
                img.src = slides[index].image
                img.alt = `Slide ${index + 1}`
                img.style.cssText =
                    "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:center;will-change:transform,opacity;"
                gsap.set(img, { opacity: 0, scale: 1.1 })
                imagesWrap!.appendChild(img)
                gsap.to(img, { opacity: 1, duration: 0.5, ease: "power2.out" })
                gsap.to(img, { scale: 1, duration: 1, ease: "power2.out" })

                const allImages = imagesWrap!.querySelectorAll("img")
                if (allImages.length > 3) {
                    const removeCount = allImages.length - 3
                    for (let i = 0; i < removeCount; i++) {
                        imagesWrap!.removeChild(allImages[i])
                    }
                }
                animateNewTitle(index)
                animateIndicators(index)
            }

            // paint the first slide immediately
            animateNewSlide(0)

            const pinDistance =
                window.innerHeight * slides.length * (vhPerSlide / 100)

            const st = ScrollTrigger.create({
                trigger: sliderSectionRef.current,
                start: "top top",
                end: `+=${pinDistance}px`,
                scrub: 1,
                pin: true,
                pinSpacing: true,
                onUpdate: (self) => {
                    gsap.set(progressEl, { scaleY: self.progress })
                    const current = Math.min(
                        Math.floor(self.progress * slides.length),
                        slides.length - 1
                    )
                    if (activeSlide !== current) {
                        activeSlide = current
                        animateNewSlide(activeSlide)
                    }
                },
            })

            return () => st.kill()
        }, rootRef)

        return () => {
            ctx.revert()
            stopRaf()
            if (lenisObserver) lenisObserver.disconnect()
            if (lenis) lenis.destroy()
            ScrollTrigger.getAll().forEach((t) => t.kill())
        }
    }, [
        disableAnimation,
        slides,
        vhPerSlide,
        accentColor,
        textColor,
        titleFontKey,
        enableSmoothScroll,
    ])

    return (
        <div
            ref={rootRef}
            style={{ width: "100%", position: "relative", ...captionFontStyle }}
        >
            <nav
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "2rem",
                    zIndex: 2,
                    pointerEvents: "none",
                }}
            >
                <p
                    style={{
                        textTransform: "uppercase",
                        fontSize: "0.75rem",
                        color: "#fff",
                        margin: 0,
                        ...captionFontStyle,
                    }}
                >
                    {navLabel}
                </p>
            </nav>

            {showIntroOutro && (
                <section
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100vh",
                        display: "grid",
                        placeItems: "center",
                        background: backgroundColor,
                        color: textColor,
                        padding: "2rem",
                        boxSizing: "border-box",
                    }}
                >
                    <h1
                        style={{
                            width: "50%",
                            textAlign: "center",
                            margin: "0 auto",
                            fontSize: "3rem",
                            fontWeight: 400,
                            letterSpacing: "-0.05em",
                            lineHeight: 1.2,
                            ...titleFontStyle,
                        }}
                    >
                        {introText}
                    </h1>
                </section>
            )}

            <section
                ref={sliderSectionRef}
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                }}
            >
                <div
                    ref={imagesWrapRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `rgba(0,0,0,${overlayOpacity})`,
                            zIndex: 1,
                        }}
                    />
                </div>

                <div
                    ref={titleWrapRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "2rem",
                        transform: "translateY(-50%)",
                        width: "50%",
                        zIndex: 2,
                        fontSize: "3rem",
                        fontWeight: 400,
                        letterSpacing: "-0.05em",
                        lineHeight: 1.2,
                        ...titleFontStyle,
                    }}
                />

                {showIndices && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            right: "2rem",
                            transform: "translateY(-50%)",
                            zIndex: 2,
                        }}
                    >
                        <div
                            ref={indicesWrapRef}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                padding: "1rem 1.25rem",
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                width: "1px",
                                height: "100%",
                                background: "rgba(255,255,255,0.35)",
                            }}
                        >
                            <div
                                ref={progressRef}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: "50%",
                                    transform: "translateX(-50%) scaleY(0)",
                                    width: "3px",
                                    height: "100%",
                                    background: accentColor,
                                    transformOrigin: "top",
                                }}
                            />
                        </div>
                    </div>
                )}

                {disableAnimation && slides.length > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            zIndex: 3,
                            background: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url(${slides[0].image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <h1
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "2rem",
                                transform: "translateY(-50%)",
                                width: "50%",
                                margin: 0,
                                fontSize: "3rem",
                                fontWeight: 400,
                                letterSpacing: "-0.05em",
                                lineHeight: 1.2,
                                color: textColor,
                                ...titleFontStyle,
                            }}
                        >
                            {slides[0].title}
                        </h1>
                        {isCanvas && (
                            <p
                                style={{
                                    position: "absolute",
                                    bottom: "1rem",
                                    right: "1rem",
                                    margin: 0,
                                    fontSize: "0.7rem",
                                    color: "rgba(255,255,255,0.6)",
                                    ...captionFontStyle,
                                }}
                            >
                                Scroll animation plays in Preview / Live
                            </p>
                        )}
                    </div>
                )}
            </section>

            {showIntroOutro && (
                <section
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100vh",
                        display: "grid",
                        placeItems: "center",
                        background: backgroundColor,
                        color: textColor,
                        padding: "2rem",
                        boxSizing: "border-box",
                    }}
                >
                    <h1
                        style={{
                            width: "50%",
                            textAlign: "center",
                            margin: "0 auto",
                            fontSize: "3rem",
                            fontWeight: 400,
                            letterSpacing: "-0.05em",
                            lineHeight: 1.2,
                            ...titleFontStyle,
                        }}
                    >
                        {outroText}
                    </h1>
                </section>
            )}
        </div>
    )
}

FullscreenScrollSlider.displayName = "Fullscreen Scroll Slider"

addPropertyControls(FullscreenScrollSlider, {
    slides: {
        type: ControlType.Array,
        title: "Slides",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.Image,
                    title: "Image",
                },
                title: {
                    type: ControlType.String,
                    title: "Caption",
                    displayTextArea: true,
                },
            },
        },
        defaultValue: [
            {
                image: "https://picsum.photos/seed/fsslide1/1600/1000",
                title: "Replace this caption with your own story for slide one.",
            },
            {
                image: "https://picsum.photos/seed/fsslide2/1600/1000",
                title: "Every slide pairs one image with one short line of text.",
            },
            {
                image: "https://picsum.photos/seed/fsslide3/1600/1000",
                title: "Add, remove, or reorder slides from the property panel.",
            },
            {
                image: "https://picsum.photos/seed/fsslide4/1600/1000",
                title: "Drop in your own photography to replace these placeholders.",
            },
            {
                image: "https://picsum.photos/seed/fsslide5/1600/1000",
                title: "Scrolling advances the story one frame at a time.",
            },
        ],
    },
    showIntroOutro: {
        type: ControlType.Boolean,
        title: "Intro / Outro",
        defaultValue: true,
    },
    introText: {
        type: ControlType.String,
        title: "Intro Text",
        displayTextArea: true,
        defaultValue:
            "Scroll to explore the rhythm of still images that move quietly between story and sensation.",
        hidden: (props) => !props.showIntroOutro,
    },
    outroText: {
        type: ControlType.String,
        title: "Outro Text",
        displayTextArea: true,
        defaultValue:
            "As the sequence slows the silence takes over, holding the last traces of motion in the air.",
        hidden: (props) => !props.showIntroOutro,
    },
    navLabel: {
        type: ControlType.String,
        title: "Nav Label",
        defaultValue: "[ Scroll Motion Slider ]",
    },
    showIndices: {
        type: ControlType.Boolean,
        title: "Show Indices",
        defaultValue: true,
    },
    vhPerSlide: {
        type: ControlType.Number,
        title: "Scroll Length",
        defaultValue: 100,
        min: 40,
        max: 200,
        step: 10,
        description: "% of viewport height of scroll per slide",
    },
    overlayOpacity: {
        type: ControlType.Number,
        title: "Image Overlay",
        defaultValue: 0.35,
        min: 0,
        max: 0.8,
        step: 0.05,
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#ffffff",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Intro/Outro BG",
        defaultValue: "#0f0f0f",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    titleFont: {
        type: ControlType.Font,
        title: "Title Font",
        defaultValue: { fontFamily: "Inter" },
        controls: "extended",
    },
    captionFont: {
        type: ControlType.Font,
        title: "Caption Font",
        defaultValue: { fontFamily: "Inter" },
        controls: "extended",
    },
    enableSmoothScroll: {
        type: ControlType.Boolean,
        title: "Smooth Scroll (Lenis)",
        defaultValue: false,
        description:
            "Turn off if your Framer page already has smooth scroll enabled",
    },
})
