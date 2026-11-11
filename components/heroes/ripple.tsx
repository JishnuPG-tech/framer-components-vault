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

import { useEffect, useRef } from "react"

const loadRippleScript = (callback: () => void) => {
    if (!window.$) {
        const jq = document.createElement("script")
        jq.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"
        jq.async = true
        jq.onload = () => {
            const rp = document.createElement("script")
            rp.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js"
            rp.async = true
            rp.onload = callback
            document.body.appendChild(rp)
        }
        document.body.appendChild(jq)
    } else if (!window.$.fn?.ripples) {
        const rp = document.createElement("script")
        rp.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js"
        rp.async = true
        rp.onload = callback
        document.body.appendChild(rp)
    } else {
        callback()
    }
}

/**
 *
 * @framerIntrinsicWidth 1400
 * @framerIntrinsicHeight 1000
 *
 * @framerDisableUnlink
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function WebGLWaterRipples({
    image,
    intensity,
    rippleCount,
    rippleInterval,
    rippleSize,
}) {
    const containerRef = useRef(null)

    useEffect(() => {
        // ── All cleanup state hoisted here so React's return can reach them ──
        let active = true
        let intervalId: ReturnType<typeof setInterval> | null = null
        let observer: IntersectionObserver | null = null

        const stopInterval = () => {
            if (intervalId !== null) {
                clearInterval(intervalId)
                intervalId = null
            }
        }

        // Always clears first — prevents stacking if called multiple times
        const startInterval = () => {
            stopInterval()
            intervalId = setInterval(() => {
                if (!containerRef.current || !window.$?.fn?.ripples) return
                const $el = window.$(containerRef.current)
                for (let i = 0; i < rippleCount; i++) {
                    $el.ripples(
                        "drop",
                        Math.random() * $el.outerWidth(),
                        Math.random() * $el.outerHeight(),
                        rippleSize,
                        0.02 + Math.random() * 0.02
                    )
                }
            }, rippleInterval)
        }

        // Stop accumulating drops when tab is hidden, start fresh when visible again
        const handleVisibility = () => {
            if (document.hidden) {
                stopInterval()
            } else {
                startInterval()
            }
        }

        loadRippleScript(() => {
            if (!active || !containerRef.current) return
            if (!window.$ || typeof window.$.fn?.ripples !== "function") {
                console.error("Ripples.js failed to load.")
                return
            }

            const $el = window.$(containerRef.current)

            try {
                $el.ripples("destroy")
            } catch (_) {}

            $el.ripples({
                resolution: 512,
                perturbance: 0.01 + (intensity / 100) * 0.05,
                interactive: true,
            })

            // Only start if the tab is already visible
            if (!document.hidden) startInterval()

            document.addEventListener("visibilitychange", handleVisibility)

            // Also pause when scrolled out of view
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        if (!document.hidden) startInterval()
                    } else {
                        stopInterval()
                    }
                },
                { threshold: 0.1 }
            )
            observer.observe(containerRef.current)
        })

        // React cleanup — always runs, always reaches these refs
        return () => {
            active = false
            stopInterval()
            document.removeEventListener("visibilitychange", handleVisibility)
            observer?.disconnect()
            if (containerRef.current && window.$?.fn?.ripples) {
                try {
                    window.$(containerRef.current).ripples("destroy")
                } catch (_) {}
            }
        }
    }, [intensity, rippleCount, rippleInterval, rippleSize, image])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        />
    )
}

addPropertyControls(WebGLWaterRipples, {
    image: {
        type: ControlType.Image,
        title: "Image",
        description: "Set your image",
    },
    intensity: {
        type: ControlType.Number,
        title: "Ripple Intensity",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 3,
        description: "Set an Intensity",
    },
    rippleCount: {
        type: ControlType.Number,
        title: "Number of Ripples",
        min: 1,
        max: 10,
        step: 1,
        defaultValue: 2,
        description: "Set ripple count",
    },
    rippleInterval: {
        type: ControlType.Number,
        title: "Ripple Interval (ms)",
        min: 1000,
        max: 10000,
        step: 500,
        defaultValue: 4000,
        description: "Set ripple interval",
    },
    rippleSize: {
        type: ControlType.Number,
        title: "Ripple Size",
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 30,
        description:
            "Set ripple size \n \n Made with 🖤  for [Framer](https://framer.link/harshupadhyay) by [Harsh](https://harsh.works) for any support please reach out via website",
    },
})
