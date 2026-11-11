// @ts-nocheck

/*
 * Copyright (c) 2026 Fred Moon (x.com/fw3d). All rights reserved.
 *
 * This code is the exclusive property of Fred Moon. Any unauthorized use,
 * reproduction, modification, distribution, or incorporation into other
 * software, in whole or in part, is strictly prohibited without the express
 * written permission of the author.
 *
 * This code is provided "AS IS" without warranty of any kind, either
 * expressed or implied, including but not limited to the implied warranties
 * of merchantability and fitness for a particular purpose.
 *
 * For licensing inquiries, please contact Fred Moon at x.com/fw3d
 *
 * This copyright notice and permission notice shall be included in all
 * copies or substantial portions of this software.
 *
 * THIRD-PARTY LIBRARIES:
 * This component uses WaveSurfer.js (https://github.com/katspaugh/wavesurfer.js)
 * Copyright (c) 2012-2023, katspaugh and contributors
 * Licensed under BSD 3-Clause License
 *
 * WaveSurfer.js and other third-party libraries are subject to their own
 * licenses and are excluded from this copyright claim.
 */

import * as React from "react"
import { useState, useRef, useEffect, useId, useMemo } from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import WaveSurfer from "https://esm.sh/wavesurfer.js@7.8.10"

/**
 * @framerDisableUnlink
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 120
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function WaveSurferPlayer(props) {
    const {
        useUrl,
        audioUrl,
        audioFile,
        title,
        subtitle,
        titleFont,
        titleColor,
        subtitleFont,
        subtitleColor,
        waveColor,
        progressColor,
        backgroundColor,
        bgImage,
        buttonColor,
        waveStyle,
        barWidth,
        barGap,
        barRadius,
        cursorWidth,
        cursorColor,
        amplify,
        contrast,
        autoPlay,
        showTimeRemaining,
        timerFont,
        timerColor,
        borderRadius,
    } = props

    const instanceId = useId().replace(/:/g, "")
    const containerRef = useRef(null)
    const waveformRef = useRef(null)
    const wavesurferRef = useRef(null)
    const renderTargetRef = useRef(RenderTarget.current())

    const [isLoaded, setIsLoaded] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState("0:00")
    const [duration, setDuration] = useState("0:00")
    const [isLoading, setIsLoading] = useState(false)
    const [waveformHeight, setWaveformHeight] = useState(60)
    const [error, setError] = useState(null)

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00"
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    const audioSource = useMemo(
        () => (useUrl ? audioUrl : audioFile) || null,
        [useUrl, audioFile, audioUrl]
    )

    // Handle Resize
    useEffect(() => {
        const calculateHeight = () => {
            if (containerRef.current) {
                const h = Math.max(30, containerRef.current.clientHeight - 140)
                setWaveformHeight(h)
            }
        }
        calculateHeight()
        const observer = new ResizeObserver(calculateHeight)
        if (containerRef.current) observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // Main WaveSurfer Lifecycle
    useEffect(() => {
        if (typeof window === "undefined" || !waveformRef.current) return

        let ws = null
        let isMounted = true

        const handleGlobalPlay = (e) => {
            if (e.detail.id !== instanceId && ws?.isPlaying()) {
                ws.pause()
            }
        }

        const initWaveSurfer = async () => {
            if (!isMounted || !waveformRef.current || !audioSource) return

            try {
                // Custom render function for bars with contrast adjustment
                const renderBars = (channelData, ctx) => {
                    const { width, height } = ctx.canvas
                    const barCount = Math.floor(
                        width / (barWidth + (barGap === 0 ? 0.1 : barGap))
                    )
                    const samplesPerBar = Math.floor(
                        channelData[0].length / barCount
                    )

                    ctx.beginPath()
                    for (let i = 0; i < barCount; i++) {
                        const start = i * samplesPerBar
                        const end = start + samplesPerBar
                        let max = 0
                        for (
                            let j = start;
                            j < end && j < channelData[0].length;
                            j++
                        ) {
                            const val = Math.abs(channelData[0][j])
                            if (val > max) max = val
                        }
                        // Apply contrast curve: peak^contrast (higher = more contrast)
                        const adjusted = Math.pow(max, contrast) * amplify
                        const barH = Math.min(adjusted * height, height)
                        const x = i * (barWidth + (barGap === 0 ? 0.1 : barGap))
                        const y = (height - barH) / 2

                        if (barRadius > 0) {
                            ctx.roundRect(x, y, barWidth, barH, barRadius)
                        } else {
                            ctx.rect(x, y, barWidth, barH)
                        }
                    }
                    ctx.fill()
                }

                ws = WaveSurfer.create({
                    container: waveformRef.current,
                    waveColor: waveColor,
                    progressColor: progressColor,
                    ...(waveStyle === "bars" && {
                        barWidth: barWidth,
                        barGap: barGap === 0 ? 0.1 : barGap,
                        barRadius: barRadius,
                        renderFunction: renderBars,
                    }),
                    ...(waveStyle !== "bars" && {
                        barHeight: amplify,
                    }),
                    height: waveformHeight,
                    hideScrollbar: true,
                    cursorWidth: cursorWidth,
                    cursorColor: cursorColor,
                    url: audioSource,
                })

                wavesurferRef.current = ws

                ws.on("ready", () => {
                    if (!isMounted) return
                    setIsLoaded(true)
                    setIsLoading(false)
                    setDuration(formatTime(ws.getDuration()))
                    setError(null)

                    if (
                        autoPlay &&
                        renderTargetRef.current === RenderTarget.preview
                    ) {
                        ws.play()
                    }
                })

                ws.on("play", () => {
                    if (!isMounted) return
                    setIsPlaying(true)
                    window.dispatchEvent(
                        new CustomEvent("framer-audio-play", {
                            detail: { id: instanceId },
                        })
                    )
                })

                ws.on("pause", () => {
                    if (!isMounted) return
                    setIsPlaying(false)
                })

                ws.on("error", (err) => {
                    if (!isMounted) return
                    console.error("WaveSurfer error:", err)
                    setError("Failed to load audio")
                    setIsLoading(false)
                    setIsLoaded(false)
                })

                ws.on("audioprocess", (time) => {
                    if (!isMounted) return
                    const tot = ws.getDuration()
                    setCurrentTime(
                        showTimeRemaining
                            ? `-${formatTime(tot - time)}`
                            : formatTime(time)
                    )
                })

                ws.on("seeking", (time) => {
                    if (!isMounted) return
                    const tot = ws.getDuration()
                    setCurrentTime(
                        showTimeRemaining
                            ? `-${formatTime(tot - time)}`
                            : formatTime(time)
                    )
                })

                setIsLoading(true)
                setError(null)
            } catch (err) {
                if (!isMounted) return
                console.error("WaveSurfer initialization error:", err)
                setError("Failed to initialize player")
                setIsLoading(false)
            }
        }

        window.addEventListener("framer-audio-play", handleGlobalPlay)
        initWaveSurfer()

        return () => {
            isMounted = false
            window.removeEventListener("framer-audio-play", handleGlobalPlay)
            if (ws) {
                ws.destroy()
            }
            wavesurferRef.current = null
        }
    }, [
        waveColor,
        progressColor,
        waveStyle,
        barWidth,
        barGap,
        barRadius,
        amplify,
        contrast,
        cursorWidth,
        cursorColor,
        waveformHeight,
        audioSource,
        autoPlay,
        showTimeRemaining,
        instanceId,
    ])

    const togglePlayPause = () => {
        if (!wavesurferRef.current || !isLoaded) return
        wavesurferRef.current.playPause()
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundColor,
                backgroundImage: bgImage ? `url(${bgImage})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                borderRadius: `${borderRadius}px`,
                position: "relative",
                gap: "15px",
                overflow: "hidden",
                ...props.style,
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    flexShrink: 0,
                }}
            >
                <button
                    onClick={togglePlayPause}
                    disabled={!isLoaded || isLoading}
                    style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        border: `2px solid ${isPlaying ? progressColor : buttonColor}`,
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isLoaded ? "pointer" : "not-allowed",
                        opacity: isLoading ? 0.5 : 1,
                    }}
                >
                    {isLoading ? (
                        <div
                            style={{
                                width: "18px",
                                height: "18px",
                                border: `2px solid ${buttonColor}`,
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                    ) : isPlaying ? (
                        <div style={{ display: "flex", gap: "3px" }}>
                            <div
                                style={{
                                    width: "3px",
                                    height: "14px",
                                    backgroundColor: progressColor,
                                }}
                            />
                            <div
                                style={{
                                    width: "3px",
                                    height: "14px",
                                    backgroundColor: progressColor,
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: `9px solid ${buttonColor}`,
                                borderTop: "7px solid transparent",
                                borderBottom: "7px solid transparent",
                                marginLeft: "2px",
                            }}
                        />
                    )}
                </button>

                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                    }}
                >
                    {subtitle && (
                        <div
                            style={{
                                ...subtitleFont,
                                color: subtitleColor,
                                marginBottom: "2px",
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                    <div
                        style={{
                            ...titleFont,
                            color: titleColor,
                            margin: 0,
                        }}
                    >
                        {title}
                    </div>
                </div>
            </div>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: `${waveformHeight}px`,
                    flex: 1,
                    minHeight: "30px",
                }}
            >
                <div
                    id={`waveform-${instanceId}`}
                    ref={waveformRef}
                    style={{ width: "100%", height: "100%" }}
                />
                {error && (
                    <div
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#ff4444",
                            fontSize: "12px",
                        }}
                    >
                        {error}
                    </div>
                )}
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        bottom: "5px",
                        ...timerFont,
                        color: timerColor,
                    }}
                >
                    {showTimeRemaining
                        ? currentTime
                        : `${currentTime} / ${duration}`}
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                #waveform-${instanceId} ::part(canvases) { clip-path: none !important; }
                #waveform-${instanceId} ::part(cursor) { opacity: ${isPlaying ? 1 : 0}; }
            `}</style>
        </div>
    )
}

WaveSurferPlayer.displayName = "🚀 MP3 Player"

WaveSurferPlayer.defaultProps = {
    useUrl: false,
    audioUrl: "",
    audioFile: null,
    title: "Track Title",
    subtitle: "ARTIST NAME",
    titleFont: {
        fontFamily: "Inter, sans-serif",
        fontSize: 18,
        fontWeight: 400,
    },
    titleColor: "#ffffff",
    subtitleFont: {
        fontFamily: "Inter, sans-serif",
        fontSize: 12,
        fontWeight: 500,
    },
    subtitleColor: "#ffffff",
    timerFont: { fontFamily: "monospace", fontSize: 12, fontWeight: 400 },
    timerColor: "rgba(255, 255, 255, 0.6)",
    waveColor: "#666666",
    progressColor: "#ff4500",
    backgroundColor: "#1a1a1a",
    bgImage: null,
    buttonColor: "#ffffff",
    waveStyle: "bars",
    barWidth: 2,
    barGap: 1,
    barRadius: 0,
    cursorWidth: 0,
    cursorColor: "rgba(255, 255, 255, 0.5)",
    amplify: 0.8,
    contrast: 1,
    borderRadius: 6,
    autoPlay: false,
    showTimeRemaining: false,
}

addPropertyControls(WaveSurferPlayer, {
    // ─── AUDIO SOURCE ───
    useUrl: {
        type: ControlType.Boolean,
        title: "Use URL",
        enabledTitle: "URL",
        disabledTitle: "File",
    },
    audioFile: {
        type: ControlType.File,
        title: "Audio File",
        allowedFileTypes: ["mp3", "wav", "m4a"],
        hidden: (p) => p.useUrl,
    },
    audioUrl: {
        type: ControlType.String,
        title: "Audio URL",
        hidden: (p) => !p.useUrl,
    },

    // ─── PLAYBACK ───
    autoPlay: {
        type: ControlType.Boolean,
        title: "Auto Play",
        description: " ",
    },

    // ─── TRACK INFO ───
    title: { type: ControlType.String, title: "Track" },
    titleFont: {
        type: ControlType.Font,
        title: "Track Font",
        controls: "extended",
    },
    titleColor: {
        type: ControlType.Color,
        title: "Track Color",
        description: " ",
    },
    subtitle: { type: ControlType.String, title: "Artist" },
    subtitleFont: {
        type: ControlType.Font,
        title: "Artist Font",
        controls: "extended",
    },
    subtitleColor: {
        type: ControlType.Color,
        title: "Artist Color",
        description: " ",
    },

    // ─── BUTTON ───
    buttonColor: {
        type: ControlType.Color,
        title: "Button Color",
        description: " ",
    },

    // ─── WAVEFORM ───
    waveColor: { type: ControlType.Color, title: "Wave Color" },
    progressColor: { type: ControlType.Color, title: "Progress Color" },
    amplify: {
        type: ControlType.Number,
        title: "Amplify",
        min: 0.1,
        max: 2,
        step: 0.1,
    },
    waveStyle: {
        type: ControlType.Enum,
        title: "Style",
        options: ["bars", "wave"],
        optionTitles: ["Bars", "Wave"],
        description: " ",
    },
    contrast: {
        type: ControlType.Number,
        title: "Contrast",
        min: 1,
        max: 10,
        step: 0.5,
        hidden: (p) => p.waveStyle !== "bars",
    },
    barWidth: {
        type: ControlType.Number,
        title: "Bar Width",
        min: 1,
        max: 10,
        hidden: (p) => p.waveStyle !== "bars",
    },
    barGap: {
        type: ControlType.Number,
        title: "Bar Gap",
        min: 0,
        max: 5,
        hidden: (p) => p.waveStyle !== "bars",
    },
    barRadius: {
        type: ControlType.Number,
        title: "Bar Radius",
        min: 0,
        max: 10,
        step: 1,
        hidden: (p) => p.waveStyle !== "bars",
        description: " ",
    },

    // ─── CURSOR ───
    cursorWidth: {
        type: ControlType.Number,
        title: "Cursor Width",
        min: 0,
        max: 5,
        step: 1,
    },
    cursorColor: {
        type: ControlType.Color,
        title: "Cursor Color",
        description: " ",
    },

    // ─── TIMER ───
    timerFont: {
        type: ControlType.Font,
        title: "Timer Font",
        controls: "extended",
    },
    timerColor: { type: ControlType.Color, title: "Timer Color" },
    showTimeRemaining: {
        type: ControlType.Boolean,
        title: "Time Left",
        description: " ",
    },

    // ─── BACKGROUND ───
    bgImage: { type: ControlType.Image, title: "BG Image" },
    backgroundColor: {
        type: ControlType.Color,
        title: "BG Color",
        hidden: (p) => !!p.bgImage,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        min: 0,
        max: 50,
        step: 1,
        description: "\n[Created by Fred Moon](https://x.com/fw3d)",
    },
})
