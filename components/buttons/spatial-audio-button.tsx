// Get Started: https://www.framer.com/developers

import * as React from "react"
import { useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
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
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerDisableUnlink
 */
export default function SpatialAudioButton(props) {
    const {
        text,
        url,
        newTab,
        ariaLabel,
        textFont,
        padding,
        borderRadius,
        backgroundColor,
        textColor,
        clickSoundFile,
        volume,
        enableSpatialAudio,
        enableClickSound,
        width,
        height,
    } = props

    const buttonRef = useRef<HTMLDivElement>(null)
    const ctxRef = useRef<AudioContext | null>(null)
    const filterRef = useRef<BiquadFilterNode | null>(null)
    const pannerRef = useRef<StereoPannerNode | null>(null)
    const gainRef = useRef<GainNode | null>(null)
    const clickBufferRef = useRef<AudioBuffer | null>(null)

    const effectiveClickFile = enableClickSound ? clickSoundFile : undefined

    const applyFontStyles = (font: any) => {
        if (!font || typeof font === "string") {
            return {
                fontFamily: font || "Inter, sans-serif",
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
            }
        }
        return {
            fontFamily: font.fontFamily || font.family || "Inter, sans-serif",
            fontSize: font.fontSize || font.size || 16,
            fontWeight: font.fontWeight || font.weight || 600,
            lineHeight: font.lineHeight || 1.5,
            letterSpacing: font.letterSpacing || "0.1em",
            textAlign: font.alignment || font.textAlign || "center",
        }
    }

    const textStyles = applyFontStyles(textFont)

    const initAudio = useCallback(() => {
        if (typeof window === "undefined" || ctxRef.current)
            return ctxRef.current
        const AudioCtx =
            window.AudioContext || (window as any).webkitAudioContext
        if (!AudioCtx) return null
        const ctx = new AudioCtx()
        ctxRef.current = ctx
        gainRef.current = ctx.createGain()
        gainRef.current.gain.value = 0
        filterRef.current = ctx.createBiquadFilter()
        filterRef.current.type = "lowpass"
        filterRef.current.frequency.value = 20000
        filterRef.current.Q.value = 2
        if (ctx.createStereoPanner) {
            pannerRef.current = ctx.createStereoPanner()
            filterRef.current.connect(pannerRef.current)
            pannerRef.current.connect(gainRef.current)
        } else {
            filterRef.current.connect(gainRef.current)
        }
        gainRef.current.connect(ctx.destination)
        return ctx
    }, [])

    useEffect(() => {
        clickBufferRef.current = null
        if (!effectiveClickFile) return
        const load = async () => {
            const ctx = initAudio()
            if (!ctx) return
            try {
                const res = await fetch(effectiveClickFile)
                const buf = await res.arrayBuffer()
                clickBufferRef.current = await ctx.decodeAudioData(buf)
            } catch (e) {}
        }
        load()
    }, [effectiveClickFile, initAudio])

    const playClickSound = useCallback(
        (normX = 0, normY = 0) => {
            if (!enableClickSound || !clickBufferRef.current) return
            const ctx = initAudio()
            if (!ctx || !gainRef.current || !filterRef.current) return
            if (ctx.state === "suspended") ctx.resume()
            const source = ctx.createBufferSource()
            source.buffer = clickBufferRef.current
            source.connect(filterRef.current)
            const now = ctx.currentTime
            if (enableSpatialAudio) {
                if (pannerRef.current) pannerRef.current.pan.value = normX
                filterRef.current.frequency.value =
                    400 + ((1 - normY) / 2) * 11600
                const clickVolume =
                    volume *
                    Math.max(0.4, 1 - Math.sqrt(normX ** 2 + normY ** 2) * 0.3)
                gainRef.current.gain.cancelScheduledValues(now)
                gainRef.current.gain.setValueAtTime(clickVolume, now)
                gainRef.current.gain.linearRampToValueAtTime(0, now + 0.4)
            } else {
                gainRef.current.gain.cancelScheduledValues(now)
                gainRef.current.gain.setValueAtTime(volume, now)
                gainRef.current.gain.linearRampToValueAtTime(0, now + 0.4)
            }
            source.start()
        },
        [enableClickSound, enableSpatialAudio, initAudio, volume]
    )

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (buttonRef.current && enableSpatialAudio) {
                const rect = buttonRef.current.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                const normX = Math.max(
                    -1,
                    Math.min(1, (x / rect.width) * 2 - 1)
                )
                const normY = Math.max(
                    -1,
                    Math.min(1, (y / rect.height) * 2 - 1)
                )
                playClickSound(normX, normY)
            } else {
                playClickSound()
            }
        },
        [enableSpatialAudio, playClickSound]
    )

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
            if (e.key === " ") e.preventDefault()
            playClickSound()
            if (url)
                window.open(
                    url,
                    newTab ? "_blank" : "_self",
                    "noopener noreferrer"
                )
        }
    }

    useEffect(() => {
        return () => {
            if (ctxRef.current) ctxRef.current.close()
        }
    }, [])

    const Component = url ? motion.a : motion.div
    const componentProps = url
        ? {
              href: url,
              target: newTab ? "_blank" : "_self",
              rel: "noopener noreferrer",
          }
        : { role: "button" }

    return (
        <div style={{ ...containerStyle, width, height }}>
            <Component
                {...componentProps}
                ref={buttonRef as any}
                tabIndex={0}
                aria-label={ariaLabel || text}
                onPointerDown={handlePointerDown}
                onKeyDown={handleKeyDown}
                whileTap={{ scale: 0.96 }}
                style={{
                    ...buttonStyle,
                    padding: padding,
                    borderRadius: borderRadius,
                    backgroundColor,
                    color: textColor,
                    border: `1px solid ${textColor}20`,
                    ...textStyles,
                    width: "100%",
                    height: "100%",
                    outline: "none",
                }}
            >
                <span style={{ position: "relative", zIndex: 1, margin: 0 }}>
                    {text}
                </span>
            </Component>
        </div>
    )
}

const containerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
}

const buttonStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textDecoration: "none",
    cursor: "pointer",
    overflow: "hidden",
    boxSizing: "border-box",
}

addPropertyControls(SpatialAudioButton, {
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Button",
    },
    url: { type: ControlType.Link, title: "Link URL" },
    newTab: {
        type: ControlType.Boolean,
        title: "Open in New Tab",
        defaultValue: true,
    },
    ariaLabel: {
        type: ControlType.String,
        title: "Aria Label",
        defaultValue: "",
        description: "Description for screen readers",
    },
    textFont: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#7D40ED",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        defaultValue: "#ffffff",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "12px 24px 12px 24px",
    },
    borderRadius: {
        type: ControlType.BorderRadius,
        title: "Radius",
        defaultValue: "12px",
    },
    enableSpatialAudio: {
        type: ControlType.Boolean,
        title: "Spatial FX",
        defaultValue: true,
    },
    enableClickSound: {
        type: ControlType.Boolean,
        title: "Click Sound",
        defaultValue: true,
    },
    clickSoundFile: {
        type: ControlType.File,
        title: "Click Audio",
        allowedFileTypes: ["mp3", "wav", "ogg", "m4a", "aac"],
        hidden: (props) => !props.enableClickSound,
    },
    volume: {
        type: ControlType.Number,
        title: "Max Volume",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
    },
})
