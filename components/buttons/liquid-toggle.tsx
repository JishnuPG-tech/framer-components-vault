// LiquidToggle.tsx — Framer marketplace compliant rewrite
import * as React from "react"
import { useEffect, useRef, useState } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

// Real package imports — no runtime CDN fetching (marketplace requirement)
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"

interface Props {
    style?: React.CSSProperties
    startPressed: boolean
    preview: boolean
    animation: {
        bounce: boolean
        bubble: boolean
        useDelta: boolean
    }
    effects: {
        deviation: number
        alpha: number
    }
    colors: {
        hue: number
    }
    layout: {
        toggleWidth: number
        toggleHeight: number
    }
}

/**
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 140
 * @framerIntrinsicHeight 60
 */
export default function LiquidToggle(props: Props) {
    const {
        style,
        startPressed = false,
        preview = false,
        animation = { bounce: true, bubble: true, useDelta: true },
        effects = { deviation: 13, alpha: 13 },
        colors = { hue: 144 },
        layout = { toggleWidth: 140, toggleHeight: 60 },
    } = props

    const { bounce, bubble, useDelta } = animation
    const { deviation, alpha } = effects
    const { hue } = colors
    const { toggleWidth, toggleHeight } = layout

    // useIsStaticRenderer correctly detects BOTH canvas and export rendering,
    // unlike RenderTarget which only distinguishes render targets for UI logic.
    const isStaticRenderer = useIsStaticRenderer()

    // "Preview" control lets an editor opt back into live interaction on the
    // Canvas while tuning parameters. Export always stays static regardless.
    const isExport = isStaticRenderer && !preview
    // Export rendering must ALWAYS be static, even if Preview is enabled —
    // Preview only affects the Canvas, never export output.
    const [isVisible, setIsVisible] = useState(true)
    const [isTabVisible, setIsTabVisible] = useState(true)

    const rootRef = useRef<HTMLDivElement>(null)
    const toggleRef = useRef<HTMLButtonElement>(null)
    const draggableRef = useRef<any>(null)
    const configRef = useRef({ bounce, bubble, useDelta })
    configRef.current = { bounce, bubble, useDelta }

    // Pause interaction setup when off-screen or tab hidden, to avoid wasting
    // resources — required for animated components per marketplace rules.
    useEffect(() => {
        const el = rootRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(el)

        const onVisibilityChange = () =>
            setIsTabVisible(document.visibilityState === "visible")
        document.addEventListener("visibilitychange", onVisibilityChange)

        return () => {
            observer.disconnect()
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
    }, [])

    // Apply CSS custom properties + goo filter params. These are cheap,
    // deterministic DOM writes (not a continuous loop), so they run
    // regardless of static/animated mode — this is the "render one
    // deterministic frame" part of the static-renderer contract.
    useEffect(() => {
        const toggle = toggleRef.current
        if (!toggle) return

        const gooBlur = rootRef.current?.querySelector(
            "#lt-goo feGaussianBlur"
        ) as SVGFEGaussianBlurElement | null
        const gooMatrix = rootRef.current?.querySelector(
            "#lt-goo feColorMatrix"
        ) as SVGFEColorMatrixElement | null
        if (gooBlur) gooBlur.setAttribute("stdDeviation", String(deviation))
        if (gooMatrix) {
            gooMatrix.setAttribute(
                "values",
                `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alpha} -10`
            )
        }

        toggle.dataset.mapped = "false"
        toggle.dataset.bounce = String(bounce)
        toggle.style.setProperty("--hue", String(hue))
        toggle.style.setProperty("--width", String(toggleWidth))
        toggle.style.setProperty("--height", String(toggleHeight))
        toggle.style.setProperty("--complete", startPressed ? "100" : "0")
        toggle.setAttribute("aria-pressed", String(startPressed))
    }, [bounce, deviation, alpha, hue, toggleWidth, toggleHeight, startPressed])

    // Interaction setup (GSAP timelines + Draggable). Skipped in export
    // rendering, and paused when off-screen or the tab is hidden, so we
    // never waste CPU on invisible/inactive instances. Canvas gets this
    // too, but only when Preview = Yes.
    useEffect(() => {
        if (isExport) return
        if (!isVisible || !isTabVisible) return

        const toggle = toggleRef.current
        if (!toggle) return

        gsap.registerPlugin(Draggable)

        const toggleState = async () => {
            const { bounce, bubble } = configRef.current
            toggle.dataset.pressed = "true"
            if (bubble) toggle.dataset.active = "true"

            await Promise.allSettled(
                !bounce
                    ? toggle
                          .getAnimations({ subtree: true })
                          .map((a: any) => a.finished)
                    : []
            )

            const pressed = toggle.matches("[aria-pressed=true]")

            gsap.timeline({
                onComplete: () => {
                    gsap.delayedCall(0.05, () => {
                        toggle.dataset.active = "false"
                        toggle.dataset.pressed = "false"
                        toggle.setAttribute("aria-pressed", String(!pressed))
                    })
                },
            }).to(toggle, {
                "--complete": pressed ? 0 : 100,
                duration: 0.12,
                delay: bounce && bubble ? 0.18 : 0,
            })
        }

        const proxy = document.createElement("div")

        draggableRef.current = Draggable.create(proxy, {
            allowContextMenu: true,
            handle: toggle,
            onDragStart: function (this: any) {
                const rect = toggle.getBoundingClientRect()
                const pressed = toggle.matches("[aria-pressed=true]")
                this.dragBounds = pressed
                    ? rect.left - this.pointerX
                    : rect.left + rect.width - this.pointerX
                toggle.dataset.active = "true"
            },
            onDrag: function (this: any) {
                const pressed = toggle.matches("[aria-pressed=true]")
                const dragged = this.x - this.startX
                const complete = gsap.utils.clamp(
                    0,
                    100,
                    pressed
                        ? gsap.utils.mapRange(
                              this.dragBounds,
                              0,
                              0,
                              100,
                              dragged
                          )
                        : gsap.utils.mapRange(
                              0,
                              this.dragBounds,
                              0,
                              100,
                              dragged
                          )
                )
                this.complete = complete
                gsap.set(toggle, {
                    "--complete": complete,
                    "--delta": Math.min(Math.abs(this.deltaX), 12),
                })
            },
            onDragEnd: function (this: any) {
                const target = this.complete >= 50 ? 100 : 0
                gsap.fromTo(
                    toggle,
                    { "--complete": this.complete },
                    {
                        "--complete": target,
                        duration: 0.15,
                        onComplete: () => {
                            gsap.delayedCall(0.05, () => {
                                toggle.dataset.active = "false"
                                toggle.setAttribute(
                                    "aria-pressed",
                                    String(this.complete >= 50)
                                )
                            })
                        },
                    }
                )
            },
            onPress: function (this: any) {
                this.__pressTime = Date.now()
                if ("ontouchstart" in window && navigator.maxTouchPoints > 0) {
                    toggle.dataset.active = "true"
                }
            },
            onRelease: function (this: any) {
                this.__releaseTime = Date.now()
                gsap.set(toggle, { "--delta": 0 })

                const isTouch =
                    "ontouchstart" in window && navigator.maxTouchPoints > 0
                const wasTap =
                    (this.startX !== undefined &&
                        this.endX !== undefined &&
                        Math.abs(this.endX - this.startX) < 4) ||
                    this.endX === undefined

                if (isTouch && wasTap) toggle.dataset.active = "false"

                if (this.__releaseTime - this.__pressTime <= 150) {
                    toggleState()
                }
            },
        })[0]

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") toggleState()
            if (e.key === " ") e.preventDefault()
        }
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === " ") toggleState()
        }
        toggle.addEventListener("keydown", onKeyDown)
        toggle.addEventListener("keyup", onKeyUp)

        // Cleanup: kill the Draggable instance and remove listeners so
        // nothing leaks when the component unmounts or re-runs this effect.
        return () => {
            draggableRef.current?.kill()
            toggle.removeEventListener("keydown", onKeyDown)
            toggle.removeEventListener("keyup", onKeyUp)
        }
    }, [isExport, isVisible, isTabVisible])

    const css = `
    .lt-root {
      position: relative;
      display: inline-flex;
      justify-content: center;
      align-items: center;
    }
    .lt-toggle {
      --transition: 0.2s;
      --ease: ease-out;
      --border: 5px;
      --complete: 0;
      --delta: 0;
      --hue: 144;
      --width: 140;
      --height: 60;
      --checked: hsl(
        var(--hue),
        calc((8 + (var(--complete) / 100 * 92)) * 1%),
        calc((81 - (var(--complete) / 100 * 38)) * 1%)
      );
      height: calc(var(--height) * 1px);
      width: calc(var(--width) * 1px);
      border-radius: 100px;
      border: 0;
      padding: 0;
      cursor: pointer;
      position: relative;
      overflow: visible;
      background: transparent;
      container-type: inline-size;
      transition: outline var(--transition) var(--ease);
      outline-offset: 2px;
    }
    .lt-toggle:focus-visible {
      outline: 4px solid color-mix(in oklch, var(--checked), transparent);
    }
    .lt-toggle:active { outline: none; }
    .lt-toggle[data-active="true"]:focus-visible { outline: 4px solid transparent; }
    .lt-indicator {
      border-radius: 100px;
      pointer-events: none;
      height: 100%;
      width: 100%;
      background: var(--checked);
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
    }
    .lt-knockout {
      height: calc(var(--height) * 1px);
      width: calc(var(--width) * 1px);
      border-radius: 100px;
      filter: url(#lt-remove-black);
      position: absolute;
      inset: 0;
      will-change: filter;
      transform: translateZ(0);
    }
    .lt-indicator--masked {
      background: var(--checked);
      z-index: 12;
      height: 100%;
      width: 100%;
      border-radius: 100px;
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
      container-type: inline-size;
    }
    .lt-mask {
      position: absolute;
      height: calc(100% - (2 * var(--border)));
      width: calc(60% - (2 * var(--border)));
      top: 50%;
      background: #000;
      left: var(--border);
      border-radius: 100px;
      translate: calc((var(--complete) / 100) * (100cqi - 60cqi)) -50%;
      transition-property: height, width, margin-left;
      transition-duration: var(--transition);
      transition-timing-function: var(--ease);
      will-change: height, width, margin;
    }
    .lt-wrapper {
      position: absolute;
      inset: 0;
      border-radius: 100px;
      clip-path: inset(0 0 0 0 round 100px);
      filter: blur(6px);
      transition: filter var(--transition) var(--ease);
    }
    .lt-liquids {
      position: absolute;
      inset: 0;
      transform: translateZ(0);
      border-radius: 100px;
      overflow: hidden;
      filter: url(#lt-goo);
    }
    .lt-liquid__shadow {
      position: absolute;
      inset: 0;
      border-radius: 100px;
      box-shadow:
        inset 0px 0px 3px 4px var(--checked),
        inset calc(((var(--complete) / 100) * 8px) + -4px) 0px 3px 4px var(--checked);
      transition: box-shadow calc(var(--transition) * 0.5) ease-out;
    }
    .lt-liquid__track {
      height: calc(var(--height) * 1px);
      width: calc(var(--width) * 1px);
      background: var(--checked);
      border-radius: 100px;
      position: absolute;
      top: 50%;
      left: 0;
      translate: calc((var(--complete) / 100) * (100cqi - 100% - (6 * var(--border)))) -50%;
      transition-property: height, width, filter, left;
      transition-duration: var(--transition);
      transition-timing-function: var(--ease);
    }
    .lt-knob {
      position: absolute;
      height: calc(100% - (2 * var(--border)));
      width: calc(60% - (2 * var(--border)));
      container-type: inline-size;
      top: 50%;
      left: var(--border);
      border-radius: 100px;
      background: transparent;
      translate: calc((var(--complete) / 100) * (100cqi - 100% - (2 * var(--border)))) -50%;
      transition-property: scale;
      transition-duration: var(--transition);
      transition-timing-function: var(--ease);
    }
    .lt-knob__shadow {
      opacity: 0;
      position: absolute;
      inset: 0;
      border-radius: 100px;
      z-index: 20;
      transition: opacity var(--transition) var(--ease);
      box-shadow:
        1px -1px 2px hsl(0 0% 100% / 0.5) inset,
        0px -1px 2px hsl(0 0% 100% / 0.5) inset,
        -1px -1px 2px hsl(0 0% 100% / 0.5) inset,
        1px 1px 2px hsl(0 0% 30% / 0.5) inset,
        -8px 4px 10px -6px hsl(0 0% 30% / 0.25) inset,
        -1px 1px 6px hsl(0 0% 30% / 0.25) inset,
        -1px -1px 8px hsl(0 0% 60% / 0.15),
        1px 1px 2px hsl(0 0% 30% / 0.15),
        2px 2px 6px hsl(0 0% 30% / 0.15),
        -2px -1px 2px hsl(0 0% 100% / 0.25) inset,
        3px 6px 16px -6px hsl(0 0% 30% / 0.5);
    }
    .lt-knob__cover {
      position: absolute;
      inset: 0;
      background: white;
      border-radius: 100px;
      transition: opacity var(--transition) var(--ease);
    }
    [data-pressed="true"] .lt-liquid__track { min-height: 30px; }
    .lt-toggle[data-active="true"] .lt-mask,
    .lt-toggle:active .lt-mask {
      height: calc((100% - (2 * var(--border))) * (1.65 - (var(--delta) * 0.025)));
      width: calc((60% - (2 * var(--border))) * (1.65 + (var(--delta) * 0.025)));
      margin-left: calc((60% - (2 * var(--border))) * ((0.65 + (var(--delta) * 0.025)) * -0.5));
    }
    .lt-toggle[data-active="true"] .lt-knob,
    .lt-toggle:active .lt-knob {
      scale: calc(1.65 + (var(--delta) * 0.025)) calc(1.65 - (var(--delta) * 0.025));
    }
    .lt-toggle[data-active="true"] .lt-wrapper,
    .lt-toggle:active .lt-wrapper { filter: blur(0px); }
    .lt-toggle[data-active="true"] .lt-knob__shadow,
    .lt-toggle:active .lt-knob__shadow { opacity: 1; }
    .lt-toggle[data-active="true"] .lt-knob__cover,
    .lt-toggle:active .lt-knob__cover { opacity: 0; }
    .lt-toggle[data-active="true"] .lt-liquid__track,
    .lt-toggle:active .lt-liquid__track {
      left: calc(var(--border) * 3);
      height: calc((var(--height) * 1px) - (6 * var(--border)));
    }
    .lt-toggle[aria-pressed="true"]:not([data-active="true"]) .lt-liquid__track {
      left: calc(var(--border) * 6);
    }
    [data-bounce="true"]:has(.lt-toggle:active) .lt-mask,
    [data-bounce="true"]:has(.lt-toggle[data-pressed="true"]) .lt-mask {
      --transition: 0.6s;
      --ease: linear(
        0 0%, 0.6091 3.69%, 1.0259 7.24%, 1.1733 9.05%,
        1.283 10.92%, 1.3562 12.87%, 1.3948 14.95%, 1.4014 16.03%,
        1.3999 17.16%, 1.3731 19.64%, 1.3202 22.27%, 1.1394 29.39%,
        1.0582 33.17%, 0.9943 37.45%, 0.9734 39.64%, 0.9593 41.92%,
        0.9505 45.08%, 0.9517 48.7%, 0.9924 63.02%, 1.0046 71.2%,
        1.0061 78.24%, 1 100%
      );
    }
  `

    return (
        <div
            ref={rootRef}
            className="lt-root"
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                ...style,
            }}
        >
            {/* Plain string child avoids dangerouslySetInnerHTML */}
            <style>{css}</style>

            <svg
                aria-hidden="true"
                width="0"
                height="0"
                style={{ position: "absolute", overflow: "hidden" }}
            >
                <defs>
                    <filter id="lt-goo">
                        <feGaussianBlur
                            result="SvgjsFeGaussianBlur1000"
                            in="SourceGraphic"
                            stdDeviation={deviation}
                        />
                        <feColorMatrix
                            result="SvgjsFeColorMatrix1001"
                            in="SvgjsFeGaussianBlur1000"
                            type="matrix"
                            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${alpha} -10`}
                        />
                        <feComposite
                            result="SvgjsFeComposite1002"
                            in="SvgjsFeColorMatrix1001"
                            operator="atop"
                        />
                    </filter>
                    <filter
                        id="lt-remove-black"
                        colorInterpolationFilters="sRGB"
                    >
                        <feColorMatrix
                            type="matrix"
                            values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      -255 -255 -255 0 1"
                            result="black-pixels"
                        />
                        <feMorphology
                            in="black-pixels"
                            operator="dilate"
                            radius="0.5"
                            result="smoothed"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="smoothed"
                            operator="out"
                        />
                    </filter>
                </defs>
            </svg>

            <button
                ref={toggleRef}
                aria-label="Toggle"
                aria-pressed={startPressed ? "true" : "false"}
                className="lt-toggle"
            >
                <div className="lt-indicator" />
                <div className="lt-knockout">
                    <div className="lt-indicator--masked">
                        <div className="lt-mask" />
                    </div>
                </div>
                <div className="lt-wrapper">
                    <div className="lt-liquids">
                        <div className="lt-liquid__shadow" />
                        <div className="lt-liquid__track" />
                    </div>
                </div>
                <div className="lt-knob">
                    <div className="lt-knob__shadow" />
                    <div className="lt-knob__cover" />
                </div>
            </button>
        </div>
    )
}

LiquidToggle.defaultProps = {
    startPressed: false,
    preview: false,
    animation: { bounce: true, bubble: true, useDelta: true },
    effects: { deviation: 13, alpha: 13 },
    colors: { hue: 144 },
    layout: { toggleWidth: 140, toggleHeight: 60 },
}

addPropertyControls(LiquidToggle, {
    startPressed: {
        type: ControlType.Boolean,
        title: "Start ON",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    preview: {
        type: ControlType.Boolean,
        title: "Preview",
        defaultValue: false,
        enabledTitle: "Animate",
        disabledTitle: "Static",
        description:
            "Temporarily enable live interaction on the **Canvas** while tuning parameters. Keep this **Off** for normal editing — the component stays static on Canvas by default for editor performance. Preview mode and the published site always animate regardless of this setting.",
    },
    colors: {
        type: ControlType.Object,
        title: "Colors",
        controls: {
            hue: {
                type: ControlType.Number,
                title: "Hue",
                min: 0,
                max: 359,
                step: 1,
                defaultValue: 144,
                displayStepper: true,
            },
        },
    },
    layout: {
        type: ControlType.Object,
        title: "Layout",
        controls: {
            toggleWidth: {
                type: ControlType.Number,
                title: "Width",
                min: 80,
                max: 400,
                step: 2,
                defaultValue: 140,
                unit: "px",
            },
            toggleHeight: {
                type: ControlType.Number,
                title: "Height",
                min: 30,
                max: 120,
                step: 2,
                defaultValue: 60,
                unit: "px",
            },
        },
    },
    animation: {
        type: ControlType.Object,
        title: "Animation",
        controls: {
            bounce: {
                type: ControlType.Boolean,
                title: "Bounce",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            bubble: {
                type: ControlType.Boolean,
                title: "Bubble Press",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            useDelta: {
                type: ControlType.Boolean,
                title: "Delta Stretch",
                defaultValue: true,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },
    effects: {
        type: ControlType.Object,
        title: "Effects",
        controls: {
            deviation: {
                type: ControlType.Number,
                title: "Goo Blur",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 13,
                displayStepper: true,
            },
            alpha: {
                type: ControlType.Number,
                title: "Goo Alpha",
                min: 0,
                max: 50,
                step: 1,
                defaultValue: 13,
                displayStepper: true,
            },
        },
    },
})
