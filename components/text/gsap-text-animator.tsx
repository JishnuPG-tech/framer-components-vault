import * as React from "react"
import { useEffect, useRef, useState, useLayoutEffect } from "react"
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
 * GSAP PREMIER TEXT — FRAMER NATIVE (FINAL)
 * Font family + weight fully controlled by Framer
 */

const GSAP_VER = "3.12.2"
const SCRIPTS = [
    `https://cdnjs.cloudflare.com/ajax/libs/gsap/${GSAP_VER}/gsap.min.js`,
    `https://cdnjs.cloudflare.com/ajax/libs/gsap/${GSAP_VER}/ScrollTrigger.min.js`,
    "https://unpkg.com/split-type",
]

let loadPromise: Promise<void> | null = null
const loadScripts = () => {
    if (typeof window === "undefined") return Promise.resolve()
    if (loadPromise) return loadPromise

    loadPromise = new Promise((resolve) => {
        let loaded = 0
        const done = () => ++loaded === SCRIPTS.length && resolve()

        SCRIPTS.forEach((src) => {
            if (document.querySelector(`script[src="${src}"]`)) return done()
            const s = document.createElement("script")
            s.src = src
            s.async = true
            s.onload = done
            document.head.appendChild(s)
        })
    })

    return loadPromise
}

if (typeof window !== "undefined") loadScripts()

/**
 * @framerDisableUnlink
 */
export default function GSAPText(props) {
    const {
        text,
        tag,
        font,
        fontSize,
        lineHeight,
        textAlign,
        color,
        animType,
        sideDirection,
        sideDistance,
        duration,
        delay,
        stagger,
        highlightColor,
        baseOpacity,
        scrubStart,
        scrubEnd,
        useBlur,
    } = props

    const containerRef = useRef<HTMLElement>(null)
    const [isReady, setIsReady] = useState(false)
    const instanceId = React.useId().replace(/:/g, "")
    const Tag = tag as any
    const isCanvas = RenderTarget.current() === RenderTarget.canvas

    // Layout-only CSS (NO typography overrides)
    useLayoutEffect(() => {
        const styleId = `gsap-text-${instanceId}`
        if (document.getElementById(styleId)) return

        const style = document.createElement("style")
        style.id = styleId
        style.innerHTML = `
            .gsap-text-${instanceId} {
                visibility: hidden;
                opacity: 0;
                display: block;
            }
            .gsap-text-${instanceId}.is-ready {
                visibility: visible;
                opacity: 1;
            }
            .char-mask {
                display: inline-block;
                position: relative;
                overflow: hidden;
                vertical-align: bottom;
                /* Added padding/margin buffer to account for descenders */
                padding-bottom: 0.25em;
                margin-bottom: -0.25em;
            }
            .char,
            .word,
            .split-line,
            .line-mask {
                display: inline-block;
                will-change: transform, opacity, filter;
            }
            .char-clone {
                position: absolute;
                left: 0;
                top: 100%;
                width: 100%;
            }
            .line-mask {
                overflow: hidden;
                display: block;
                /* Added buffer for line-level animations */
                padding-bottom: 0.1em;
                margin-bottom: -0.1em;
            }
        `
        document.head.appendChild(style)
    }, [instanceId])

    useEffect(() => {
        if (isCanvas) {
            setIsReady(true)
            return
        }

        let ctx: any
        let split: any

        const init = async () => {
            await loadScripts()

            const gsap = (window as any).gsap
            const ScrollTrigger = (window as any).ScrollTrigger
            const SplitType = (window as any).SplitType

            if (!gsap || !ScrollTrigger || !SplitType || !containerRef.current)
                return

            gsap.registerPlugin(ScrollTrigger)
            split?.revert()

            split = new SplitType(containerRef.current, {
                types: "lines, words, chars",
                charClass: "char",
                lineClass:
                    animType === "side_left" ||
                    animType === "side_right" ||
                    animType === "down" ||
                    animType === "entrance"
                        ? "line-mask"
                        : "split-line",
            })

            // Portal prep
            if (animType === "portal") {
                split.chars.forEach((char) => {
                    const mask = document.createElement("span")
                    mask.className = "char-mask"
                    char.parentNode.insertBefore(mask, char)
                    mask.appendChild(char)

                    const clone = char.cloneNode(true) as HTMLElement
                    clone.classList.add("char-clone")
                    mask.appendChild(clone)
                })
            }

            ctx = gsap.context(() => {
                const trigger = {
                    trigger: containerRef.current,
                    start: "top 95%",
                    toggleActions: "play none none reverse",
                }

                if (animType === "portal") {
                    containerRef
                        .current!.querySelectorAll(".char-mask")
                        .forEach((mask, i) => {
                            const char = mask.children[0]
                            const clone = mask.children[1]
                            gsap.to([char, clone], {
                                scrollTrigger: trigger,
                                y: "-100%",
                                duration:
                                    duration + (Math.random() * 0.4 - 0.2),
                                delay:
                                    delay + i * stagger + Math.random() * 0.2,
                                ease: "power4.out",
                            })
                        })
                }

                if (animType === "down") {
                    gsap.from(split.chars, {
                        scrollTrigger: trigger,
                        y: "-110%",
                        opacity: 0,
                        rotateX: 15,
                        filter: useBlur ? "blur(10px)" : "none",
                        duration,
                        delay,
                        stagger,
                        ease: "power4.out",
                    })
                }

                if (animType === "wave") {
                    gsap.from(split.chars, {
                        scrollTrigger: trigger,
                        y: 80,
                        rotate: 10,
                        scale: 0.8,
                        opacity: 0,
                        duration,
                        delay,
                        stagger,
                        ease: "elastic.out(1, 0.75)",
                    })
                }

                if (animType === "elastic") {
                    gsap.from(split.chars, {
                        scrollTrigger: trigger,
                        scale: 0,
                        opacity: 0,
                        duration,
                        delay,
                        stagger,
                        ease: "back.out(1.7)",
                    })
                }

                if (animType === "flow") {
                    gsap.from(split.chars, {
                        scrollTrigger: trigger,
                        y: 50,
                        opacity: 0,
                        scale: 0.9,
                        rotateX: -30,
                        duration,
                        delay,
                        stagger,
                        ease: "power2.out",
                    })
                }

                if (animType === "entrance") {
                    gsap.from(split.chars, {
                        scrollTrigger: trigger,
                        y: "110%",
                        opacity: 0,
                        rotateX: -15,
                        filter: useBlur ? "blur(10px)" : "none",
                        duration,
                        delay,
                        stagger,
                        ease: "power4.out",
                    })
                }

                if (animType === "side_left" || animType === "side_right") {
                    const x =
                        animType === "side_left" ? -sideDistance : sideDistance

                    gsap.from(split.words, {
                        scrollTrigger: { ...trigger, start: "top 90%" },
                        x,
                        opacity: 0,
                        filter: useBlur ? "blur(10px)" : "none",
                        duration,
                        delay,
                        stagger,
                        ease: "power3.out",
                    })
                }

                if (animType === "scrub") {
                    gsap.set(split.chars, {
                        color,
                        opacity: baseOpacity,
                    })

                    gsap.to(split.chars, {
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: `top ${scrubStart}%`,
                            end: `bottom ${scrubEnd}%`,
                            scrub: true,
                        },
                        color: highlightColor,
                        opacity: 1,
                        stagger,
                    })
                }
            })

            requestAnimationFrame(() => {
                setIsReady(true)
                ScrollTrigger.refresh()
            })
        }

        init()

        return () => {
            ctx?.revert()
            split?.revert()
        }
    }, [
        text,
        animType,
        sideDirection,
        sideDistance,
        delay,
        stagger,
        duration,
        highlightColor,
        baseOpacity,
        scrubStart,
        scrubEnd,
        color,
        useBlur,
    ])

    return (
        <Tag
            ref={containerRef}
            className={`gsap-text-${instanceId} ${isReady ? "is-ready" : ""}`}
            style={{
                ...font,
                fontSize,
                lineHeight,
                textAlign,
                margin: 0,
                padding: 0,
                perspective: "1000px",
                color: animType === "scrub" ? "inherit" : color,
            }}
        >
            {text}
        </Tag>
    )
}

/* =========================
    PROPERTY CONTROLS
========================= */

addPropertyControls(GSAPText, {
    text: { type: ControlType.String, defaultValue: "PRO PORTAL" },

    tag: {
        type: ControlType.Enum,
        options: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "div"],
        defaultValue: "h1",
    },

    font: {
        type: ControlType.Font,
        defaultValue: { family: "Inter", size: 64 },
    },

    fontSize: {
        type: ControlType.Number,
        defaultValue: 64,
    },

    lineHeight: {
        type: ControlType.Number,
        defaultValue: 1.2,
        step: 0.1,
    },

    textAlign: {
        type: ControlType.Enum,
        options: ["left", "center", "right"],
        defaultValue: "left",
    },

    color: {
        type: ControlType.Color,
        defaultValue: "#333",
    },

    animType: {
        type: ControlType.Enum,
        title: "Animation",
        options: [
            "entrance",
            "down",
            "side_left",
            "side_right",
            "scrub",
            "wave",
            "elastic",
            "flow",
            "portal",
        ],
        optionTitles: [
            "Stagger Up",
            "Stagger Down",
            "Slide in Left",
            "Slide in Right",
            "Scroll Reveal",
            "Wave",
            "Elastic Pop",
            "Flow",
            "Portal",
        ],
        defaultValue: "entrance",
    },

    sideDistance: {
        type: ControlType.Number,
        title: "Slide Distance",
        defaultValue: 150,
        hidden: (p) => !["side_left", "side_right"].includes(p.animType),
    },

    duration: { type: ControlType.Number, defaultValue: 0.6 },
    delay: { type: ControlType.Number, defaultValue: 0 },
    stagger: { type: ControlType.Number, defaultValue: 0.05 },

    useBlur: {
        type: ControlType.Boolean,
        defaultValue: false,
        hidden: (p) =>
            ["scrub", "portal", "elastic", "wave", "flow"].includes(p.animType),
    },

    highlightColor: {
        type: ControlType.Color,
        defaultValue: "#000",
        hidden: (p) => p.animType !== "scrub",
    },

    baseOpacity: {
        type: ControlType.Number,
        defaultValue: 0.2,
        hidden: (p) => p.animType !== "scrub",
    },

    scrubStart: {
        type: ControlType.Number,
        defaultValue: 85,
        hidden: (p) => p.animType !== "scrub",
    },

    scrubEnd: {
        type: ControlType.Number,
        defaultValue: 20,
        hidden: (p) => p.animType !== "scrub",
    },
})
