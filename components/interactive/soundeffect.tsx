// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, type MutableRefObject } from "react"

// FIX REQUEST: Resolve Framer error "No component name found in generated code. Missing default export?" by ensuring a named default export and explicit displayName.

type Variant = "Default" | "Hover" | "Clicked"
type SoundSource = "upload" | "url"

interface SoundEffectProps {
    variant: Variant

    hoverSoundSource: SoundSource
    hoverSoundFile: string
    hoverSoundURL: string

    clickSoundSource: SoundSource
    clickSoundFile: string
    clickSoundURL: string

    volume: number
}

function resolveURL(
    source: SoundSource,
    file: string,
    url: string
): string | null {
    const src = source === "upload" ? file : url
    return src && src.trim() !== "" ? src.trim() : null
}

function safeVolume(v: number): number {
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
}

/**
 * SoundEffect
 *
 * @framerIntrinsicWidth 200
 * @framerIntrinsicHeight 60
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
function SoundEffect(props: SoundEffectProps) {
    const {
        variant = "Default",
        hoverSoundSource = "upload",
        hoverSoundFile = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        hoverSoundURL = "",
        clickSoundSource = "upload",
        clickSoundFile = "https://framerusercontent.com/assets/8w3IUatLX9a5JVJ6XPCVuHi94.mp3",
        clickSoundURL = "",
        volume = 1,
    } = props

    const isStatic = useIsStaticRenderer()

    const hoverAudioRef = useRef<HTMLAudioElement | null>(null)
    const clickAudioRef = useRef<HTMLAudioElement | null>(null)
    const prevVariantRef = useRef<Variant>("Default")

    // True from the moment a click fires until the mouse fully exits (Default).
    // While set, any Hover transition is silenced.
    const suppressHoverRef = useRef<boolean>(false)

    // Keep Audio elements in sync with prop changes
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const syncAudio = (
            ref: MutableRefObject<HTMLAudioElement | null>,
            src: string | null
        ) => {
            if (!src) {
                if (ref.current) {
                    try {
                        ref.current.pause()
                    } catch {
                        // ignore
                    }
                }
                ref.current = null
                return
            }

            try {
                const absolute = new URL(src, window.location.href).href
                if (!ref.current || ref.current.src !== absolute) {
                    const audio = new Audio(absolute)
                    audio.preload = "auto"
                    ref.current = audio
                }
                ref.current.volume = safeVolume(volume)
            } catch {
                ref.current = null
            }
        }

        syncAudio(
            hoverAudioRef,
            resolveURL(hoverSoundSource, hoverSoundFile, hoverSoundURL)
        )
        syncAudio(
            clickAudioRef,
            resolveURL(clickSoundSource, clickSoundFile, clickSoundURL)
        )
    }, [
        isStatic,
        hoverSoundSource,
        hoverSoundFile,
        hoverSoundURL,
        clickSoundSource,
        clickSoundFile,
        clickSoundURL,
        volume,
    ])

    // Detect variant changes and trigger the correct sound
    useEffect(() => {
        if (isStatic || typeof window === "undefined") return

        const prev = prevVariantRef.current
        prevVariantRef.current = variant

        const play = (ref: MutableRefObject<HTMLAudioElement | null>) => {
            const audio = ref.current
            if (!audio) return
            try {
                audio.currentTime = 0
                audio.play().catch(() => {
                    // Browser autoplay policy — fails silently until first user gesture.
                })
            } catch {
                // Defensive catch for sync errors on detached/errored media elements.
            }
        }

        if (variant === "Clicked" && prev !== "Clicked") {
            suppressHoverRef.current = true
            play(clickAudioRef)
        } else if (variant === "Hover" && prev !== "Hover") {
            if (!suppressHoverRef.current) play(hoverAudioRef)
        } else if (variant === "Default") {
            suppressHoverRef.current = false
        }
    }, [variant, isStatic])

    // Must return an element for Framer’s loader; keep it invisible and non-interactive.
    return (
        <div
            aria-hidden="true"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                background: "transparent",
            }}
        />
    )
}

// Help Framer reliably detect the component name in all build/parse scenarios.
SoundEffect.displayName = "SoundEffect"

export default SoundEffect

addPropertyControls(SoundEffect, {
    variant: {
        type: ControlType.Enum,
        title: "Variant",
        options: ["Default", "Hover", "Clicked"],
        defaultValue: "Default",
    },

    hoverSoundSource: {
        type: ControlType.Enum,
        title: "Hover — Source",
        options: ["upload", "url"],
        optionTitles: ["File Upload", "External URL"],
        defaultValue: "upload",
    },
    hoverSoundFile: {
        type: ControlType.File,
        title: "Hover — File",
        allowedFileTypes: ["mp3", "wav", "ogg", "aac", "webm"],
        hidden: (props) => props.hoverSoundSource !== "upload",
    },
    hoverSoundURL: {
        type: ControlType.String,
        title: "Hover — URL",
        placeholder: "https://example.com/hover.mp3",
        defaultValue: "",
        hidden: (props) => props.hoverSoundSource !== "url",
    },

    clickSoundSource: {
        type: ControlType.Enum,
        title: "Click — Source",
        options: ["upload", "url"],
        optionTitles: ["File Upload", "External URL"],
        defaultValue: "upload",
    },
    clickSoundFile: {
        type: ControlType.File,
        title: "Click — File",
        allowedFileTypes: ["mp3", "wav", "ogg", "aac", "webm"],
        hidden: (props) => props.clickSoundSource !== "upload",
    },
    clickSoundURL: {
        type: ControlType.String,
        title: "Click — URL",
        placeholder: "https://example.com/click.mp3",
        defaultValue: "",
        hidden: (props) => props.clickSoundSource !== "url",
    },

    volume: {
        type: ControlType.Number,
        title: "Volume",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 1,
        displayStepper: true,
    },
})
