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
 * HoverSound
 *
 * A single video that autoplays muted.
 * Hover to unmute. On touch devices, tap to toggle sound.
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 600
 */
//@framerDisableUnlink
export default function HoverSound(props) {
    const {
        video,
        borderRadius,
        backgroundColor,
        showHint,
        hintText,
        hintListeningText,
        hintFont,
        hintColor,
        loop,
        objectFit,
    } = props

    const videoRef = React.useRef(null)
    const [isAudible, setIsAudible] = React.useState(false)
    const isTouchRef = React.useRef(false)

    // Detect touch device
    React.useEffect(() => {
        isTouchRef.current =
            typeof window !== "undefined" &&
            ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    }, [])

    // Autoplay muted on mount / video change
    React.useEffect(() => {
        const v = videoRef.current
        if (!v) return
        v.muted = true
        const p = v.play()
        if (p !== undefined) p.catch(() => {})
    }, [video])

    // Sync mute state
    React.useEffect(() => {
        const v = videoRef.current
        if (!v) return
        v.muted = !isAudible
        if (v.paused) v.play().catch(() => {})
    }, [isAudible])

    return (
        <div
            onMouseEnter={() => !isTouchRef.current && setIsAudible(true)}
            onMouseLeave={() => !isTouchRef.current && setIsAudible(false)}
            onClick={() => isTouchRef.current && setIsAudible((v) => !v)}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius,
                overflow: "hidden",
                backgroundColor,
                cursor: "pointer",
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
            }}
        >
            {video ? (
                <video
                    ref={videoRef}
                    src={video}
                    playsInline
                    loop={loop}
                    muted
                    preload="auto"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit,
                        display: "block",
                    }}
                />
            ) : (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        color: "rgba(255,255,255,0.5)",
                        textAlign: "center",
                        padding: 16,
                    }}
                >
                    Upload a video in the right panel
                </div>
            )}

            {showHint && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 96,
                            background:
                                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
                            pointerEvents: "none",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: 16,
                            right: 16,
                            bottom: 16,
                            fontSize: hintFont.fontSize,
                            fontWeight: hintFont.fontWeight,
                            letterSpacing: hintFont.letterSpacing,
                            color: hintColor,
                            pointerEvents: "none",
                            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <SoundIcon active={isAudible} />
                        <span>
                            {isAudible
                                ? hintListeningText
                                : isTouchRef.current
                                  ? "Tap for sound"
                                  : hintText}
                        </span>
                    </div>
                </>
            )}
        </div>
    )
}

function SoundIcon({ active }) {
    return (
        <svg
            width={14}
            height={14}
            viewBox="0 0 14 14"
            fill="none"
            style={{ flexShrink: 0 }}
        >
            <path d="M3 5h2l3-2.5v9L5 9H3V5z" fill="currentColor" />
            {active ? (
                <path
                    d="M10 4.5c.9.7 1.5 1.8 1.5 3s-.6 2.3-1.5 3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    fill="none"
                />
            ) : (
                <path
                    d="M10 5l3 3M13 5l-3 3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            )}
        </svg>
    )
}

HoverSound.defaultProps = {
    borderRadius: 16,
    backgroundColor: "rgb(0, 0, 0)",
    showHint: true,
    hintText: "Hover for sound",
    hintListeningText: "Sound on",
    hintColor: "rgb(255, 255, 255)",
    hintFont: { fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" },
    loop: true,
    objectFit: "cover",
}

addPropertyControls(HoverSound, {
    video: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov", "m4v"],
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        defaultValue: "cover",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 1,
        unit: "px",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "rgb(0, 0, 0)",
    },
    showHint: {
        type: ControlType.Boolean,
        title: "Show hint",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    hintText: {
        type: ControlType.String,
        title: "Hint idle",
        defaultValue: "Hover for sound",
    },
    hintListeningText: {
        type: ControlType.String,
        title: "Hint active",
        defaultValue: "Sound on",
    },
    hintColor: {
        type: ControlType.Color,
        title: "Hint color",
        defaultValue: "rgb(255, 255, 255)",
    },
    hintFont: {
        type: ControlType.Object,
        title: "Hint style",
        controls: {
            fontSize: {
                type: ControlType.Number,
                defaultValue: 13,
                min: 8,
                max: 32,
                step: 1,
                unit: "px",
            },
            fontWeight: {
                type: ControlType.Number,
                defaultValue: 500,
                min: 100,
                max: 900,
                step: 100,
            },
            letterSpacing: { type: ControlType.String, defaultValue: "0.02em" },
        },
    },
})
