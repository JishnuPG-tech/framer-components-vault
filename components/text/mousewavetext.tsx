import * as React from "react"
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

import gsap from "gsap"

function loadGoogleFont(fontName: string) {
    if (!fontName) return
    const id = `google-font-${fontName.replace(/\s+/g, "-").toLowerCase()}`
    if (document.getElementById(id)) return

    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, "+")}&display=swap`
    document.head.appendChild(link)
}

export default function MouseWaveText(props) {
    const {
        text,
        font,
        fontSize,
        textColor,
        effectColor,
        rotate,
        skewY,
        waveY,
        blurAmount,
        glowIntensity,
        shadowDistance,
        shadowColor,
        rainbowMode,
        colorShift,
        fragmentDensity,
        letterSpacing,
        strokeWidth,
        strokeColor,
        hoverScale,
        clickScale,
        clickOpacity,
        clickBlur,
        clickShift,
        mouseRange,
    } = props

    const wrapperRef = useRef(null)
    const srcRef = useRef(null)
    const topRef = useRef(null)
    const tl = useRef(null)

    const fontFamily = font?.family || font?.font || "sans-serif"

    React.useEffect(() => {
        if (fontFamily && fontFamily !== "sans-serif") {
            loadGoogleFont(fontFamily)
        }
    }, [fontFamily])

    useEffect(() => {
        const srcEl = srcRef.current
        const topEl = topRef.current
        const wrapper = wrapperRef.current

        const bb = srcEl.getBoundingClientRect()
        const textContent = srcEl.textContent
        const stripCount = Math.floor(bb.width * fragmentDensity)

        topEl.innerHTML = ""

        for (let i = 0; i <= stripCount; i++) {
            const div = document.createElement("div")
            div.textContent = textContent
            topEl.appendChild(div)

            gsap.set(div, {
                position: "absolute",
                width: 4,
                height: bb.height,
                x: i * 2,
                y: -bb.height,
                textIndent: -i * 2,
                color: rainbowMode
                    ? `hsl(${(i * 10 + colorShift) % 360}, 100%, 50%)`
                    : effectColor,
                overflow: "hidden",
                pointerEvents: "none",
            })
        }

        gsap.set(wrapper, {
            rotate,
            skewY,
            scaleX: 0.75,
        })

        tl.current = gsap
            .timeline({
                paused: true,
                defaults: {
                    duration: 0.25,
                    ease: "power3.inOut",
                    yoyoEase: "sine.inOut",
                },
            })
            .to(topEl.children, {
                y: `-=${waveY}`,
                stagger: {
                    amount: 1,
                    yoyo: true,
                    repeat: 1,
                    ease: "none",
                },
            })

        gsap.timeline()
            .fromTo(
                tl.current,
                { progress: 0.9 },
                { duration: 1.5, progress: 0.1, ease: "power2.inOut" }
            )
            .to(tl.current, {
                duration: 4,
                progress: 0.4,
                ease: "elastic.out(0.8)",
            })

        const onMove = (e) => {
            const xp = e.clientX / window.innerWidth
            gsap.to(tl.current, { progress: xp, overwrite: true })
            gsap.to(wrapper, {
                x: gsap.utils.mapRange(0, 1, mouseRange, -mouseRange, xp),
                y: gsap.utils.mapRange(0, 1, -mouseRange, mouseRange, xp),
            })
        }

        const onDown = () => {
            gsap.timeline({ defaults: { duration: 0.2, overwrite: "auto" } })
                .to(topEl, { y: -clickShift })
                .to(
                    srcEl,
                    {
                        filter: `blur(${clickBlur}px) drop-shadow(${shadowDistance}px ${shadowDistance}px ${glowIntensity}px ${shadowColor})`,
                        opacity: clickOpacity,
                        scale: clickScale,
                    },
                    0
                )
        }

        const onUp = () => {
            gsap.timeline({ defaults: { ease: "bounce" } })
                .to(topEl, { y: 0 })
                .to(
                    srcEl,
                    {
                        filter: `blur(0px) drop-shadow(${shadowDistance}px ${shadowDistance}px ${glowIntensity}px ${shadowColor})`,
                        opacity: 1,
                        scale: hoverScale,
                    },
                    0
                )
        }

        window.addEventListener("pointermove", onMove)
        window.addEventListener("mousedown", onDown)
        window.addEventListener("mouseup", onUp)

        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("mousedown", onDown)
            window.removeEventListener("mouseup", onUp)
        }
    }, [
        text,
        fontSize,
        effectColor,
        rotate,
        skewY,
        waveY,
        blurAmount,
        fontFamily,
        glowIntensity,
        shadowDistance,
        shadowColor,
        rainbowMode,
        colorShift,
        fragmentDensity,
        letterSpacing,
        strokeWidth,
        strokeColor,
        hoverScale,
        clickScale,
        clickOpacity,
        clickBlur,
        clickShift,
        mouseRange,
    ])

    return (
        <div
            ref={wrapperRef}
            style={{
                fontFamily: `'${fontFamily}', sans-serif`,
                ...font,
                fontSize,
                fontWeight: 700,
                display: "inline-block",
                whiteSpace: "nowrap",
                position: "relative",
                color: textColor,
                width: "fit-content",
                height: "fit-content",
                userSelect: "none",
                letterSpacing,
                WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
            }}
        >
            <div ref={srcRef} style={{ position: "relative" }}>
                {text}
            </div>
            <div ref={topRef} style={{ position: "relative" }} />
        </div>
    )
}

addPropertyControls(MouseWaveText, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "MOVE YOUR MOUSE HERE",
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 50,
        min: 20,
        max: 200,
        unit: "px",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: { family: "Roboto", fallback: "sans-serif" },
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "rgba(0, 0, 0, 0.2)",
    },
    effectColor: {
        type: ControlType.Color,
        title: "Effect Color",
        defaultValue: "#40FF4C",
    },
    rotate: {
        type: ControlType.Number,
        title: "Rotate",
        defaultValue: -8,
        min: -180,
        max: 180,
        unit: "°",
    },
    skewY: {
        type: ControlType.Number,
        title: "Skew Y",
        defaultValue: 0,
        min: -90,
        max: 90,
        unit: "°",
    },
    waveY: {
        type: ControlType.Number,
        title: "Wave Height",
        defaultValue: 33,
        min: 5,
        max: 100,
        unit: "px",
    },
    blurAmount: {
        type: ControlType.Number,
        title: "Blur on Click",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.1,
    },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow Intensity",
        defaultValue: 0,
        min: 0,
        max: 50,
    },
    shadowDistance: {
        type: ControlType.Number,
        title: "Shadow Distance",
        defaultValue: 0,
        min: 0,
        max: 50,
        unit: "px",
    },
    shadowColor: {
        type: ControlType.Color,
        title: "Shadow Color",
        defaultValue: "#000000",
    },
    rainbowMode: {
        type: ControlType.Boolean,
        title: "Rainbow Mode",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    colorShift: {
        type: ControlType.Number,
        title: "Color Shift",
        defaultValue: 0,
        min: 0,
        max: 360,
        unit: "°",
    },
    fragmentDensity: {
        type: ControlType.Number,
        title: "Fragment Density",
        defaultValue: 0.55,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -10,
        max: 20,
        unit: "px",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Stroke Width",
        defaultValue: 2,
        min: 0,
        max: 10,
        unit: "px",
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Stroke Color",
        defaultValue: "#40FF4C",
    },
    hoverScale: {
        type: ControlType.Number,
        title: "Hover Scale",
        defaultValue: 1,
        min: 0.5,
        max: 2,
        step: 0.01,
    },
    clickScale: {
        type: ControlType.Number,
        title: "Click Scale",
        defaultValue: 0.96,
        min: 0.5,
        max: 2,
        step: 0.01,
    },
    clickOpacity: {
        type: ControlType.Number,
        title: "Click Opacity",
        defaultValue: 0.85,
        min: 0,
        max: 1,
        step: 0.01,
    },
    clickBlur: {
        type: ControlType.Number,
        title: "Click Blur",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 0.1,
    },
    clickShift: {
        type: ControlType.Number,
        title: "Click Shift",
        defaultValue: 25,
        min: 0,
        max: 100,
        unit: "px",
    },
    mouseRange: {
        type: ControlType.Number,
        title: "Mouse Range",
        defaultValue: 30,
        min: 0,
        max: 100,
        unit: "px",
    },
})
