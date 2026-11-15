import * as React from "react"
import { useRef, useEffect, useState } from "react"
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
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText as GSAPSplitText } from "gsap/SplitText"

gsap.registerPlugin(ScrollTrigger, GSAPSplitText)

export default function SplitTextFramer({
    text,
    font,
    className,
    tag,
    fontSize,
    color,
    delay,
    duration,
    splitType,
    fromOpacity,
    dropDistance,
    bounce,
    toOpacity,
    threshold,
    rootMargin,
    textAlign,
    direction,
    onLetterAnimationComplete,
}) {
    const ref = useRef(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (!mounted || !ref.current || !text) return
        const el = ref.current

        if (el._splitInstance) {
            try {
                el._splitInstance.revert()
            } catch (_) {}
            el._splitInstance = null
        }

        const startPct = (1 - threshold) * 100
        const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin)
        const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0
        const marginUnit = marginMatch ? marginMatch[2] || "px" : "px"
        const sign =
            marginValue === 0
                ? ""
                : marginValue < 0
                  ? `-=${Math.abs(marginValue)}${marginUnit}`
                  : `+=${marginValue}${marginUnit}`
        const start = `top ${startPct}%${sign}`

        let targets
        const assignTargets = (self) => {
            if (splitType.includes("chars") && self.chars.length)
                targets = self.chars
            if (!targets && splitType.includes("words") && self.words.length)
                targets = self.words
            if (!targets && splitType.includes("lines") && self.lines.length)
                targets = self.lines
            if (!targets) targets = self.chars || self.words || self.lines
        }

        const splitInstance = new GSAPSplitText(el, {
            type: splitType,
            smartWrap: true,
            autoSplit: splitType === "lines",
            linesClass: "split-line",
            wordsClass: "split-word",
            charsClass: "split-char",
            reduceWhiteSpace: false,
            onSplit: (self) => {
                assignTargets(self)
                gsap.fromTo(
                    targets,
                    {
                        opacity: fromOpacity,
                        y: direction === "down" ? -dropDistance : dropDistance,
                    },
                    {
                        opacity: toOpacity,
                        y: 0,
                        duration,
                        ease: `back.out(${bounce})`,
                        stagger: delay / 1000,
                        scrollTrigger: {
                            trigger: el,
                            start,
                            once: true,
                        },
                        onComplete: () => onLetterAnimationComplete?.(),
                        willChange: "transform, opacity",
                        force3D: true,
                    }
                )
            },
        })

        el._splitInstance = splitInstance

        return () => {
            ScrollTrigger.getAll().forEach((st) => {
                if (st.trigger === el) st.kill()
            })
            try {
                splitInstance.revert()
            } catch (_) {}
            el._splitInstance = null
        }
    }, [
        mounted,
        text,
        delay,
        duration,
        splitType,
        fromOpacity,
        dropDistance,
        bounce,
        toOpacity,
        threshold,
        rootMargin,
        direction,
        onLetterAnimationComplete,
    ])

    const style = {
        textAlign,
        fontSize,
        color,
        margin: 0,
        padding: 0,
        whiteSpace: "normal",
        wordWrap: "break-word",
        willChange: "transform, opacity",
        ...(font || {}),
    }

    const Tag = tag || "p"

    return (
        <div
            className={className}
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent:
                    textAlign === "left"
                        ? "flex-start"
                        : textAlign === "right"
                          ? "flex-end"
                          : "center",
                alignItems: "center",
                overflow: "hidden",
            }}
        >
            <Tag ref={ref} style={style}>
                {text}
            </Tag>
        </div>
    )
}

// Framer property controls
addPropertyControls(SplitTextFramer, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Hello, GSAP!",
    },
    font: {
        type: ControlType.Font,
        title: "Font",
        defaultValue: {
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 40,
            letterSpacing: 0,
        },
        controls: "extended",
        defaultFontType: "sans-serif",
        displayFontSize: false,
    },
    tag: {
        type: ControlType.Enum,
        title: "Tag",
        options: ["p", "h1", "h2", "h3", "h4", "h5", "h6"],
        defaultValue: "p",
    },
    fontSize: {
        type: ControlType.String,
        title: "Font Size",
        defaultValue: "2rem",
    },
    color: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#000000",
    },
    delay: {
        type: ControlType.Number,
        title: "Stagger Delay (ms)",
        defaultValue: 100,
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        defaultValue: 0.6,
    },
    splitType: {
        type: ControlType.Enum,
        title: "Split Type",
        options: ["chars", "words", "lines"],
        defaultValue: "chars",
    },
    fromOpacity: {
        type: ControlType.Number,
        title: "From Opacity",
        defaultValue: 0,
        min: 0,
        max: 1,
    },
    dropDistance: {
        type: ControlType.Number,
        title: "Drop Distance",
        defaultValue: 40,
        min: 0,
        max: 200,
    },
    bounce: {
        type: ControlType.Number,
        title: "Bounce",
        defaultValue: 1.7,
        min: 0,
        max: 5,
    },
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["down", "up"],
        defaultValue: "down",
    },
    toOpacity: {
        type: ControlType.Number,
        title: "To Opacity",
        defaultValue: 1,
        min: 0,
        max: 1,
    },
    threshold: {
        type: ControlType.Number,
        title: "Threshold",
        defaultValue: 0.1,
        min: 0,
        max: 1,
    },
    rootMargin: {
        type: ControlType.String,
        title: "Root Margin",
        defaultValue: "-100px",
    },
    textAlign: {
        type: ControlType.Enum,
        title: "Text Align",
        options: ["left", "center", "right"],
        defaultValue: "center",
        description:
            "More Components at [DiverseKit](https://framer.link/se2heI4)",
    },
})
