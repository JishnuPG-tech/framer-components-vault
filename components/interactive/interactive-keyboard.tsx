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

import { startTransition } from "react"

type SoundProfile = "sound1" | "sound2"

type SwitchType = "linear" | "tactile" | "clicky"

type ResponsiveImage = {
    src: string
    srcSet?: string
    alt?: string
}

type KeyDef = {
    id: string
    code?: string
    label: string
    width: number
    isSpacer?: boolean
}

interface KeyboardShowcaseProps {
    backgroundColor: string
    surfaceColor: string
    keyColor: string
    keyTextColor: string
    keyBorderColor: string
    keyShadowColor: string
    keyShadowPressedColor: string
    accentColor: string

    borderRadius: string
    keyRadius: string
    padding: string
    gap: number
    rowGap: number
    keyHeight: number
    keyFont: any

    enableGlow: boolean
    glowIntensity: number
    rgbMode: "reactive" | "wave" | "ripple"
    rgbSpeed: number

    soundEnabled: boolean
    volume: number
    thockMix: number
    clickMix: number
    reverbMix: number

    switchType: SwitchType
    showSwitchToggle: boolean

    profile: SoundProfile
    showProfileToggle: boolean

    showTypingTest: boolean
    typingFont: any
    typingHint: string
    typingBackground: string
    typingTextColor: string
    footerTextColor: string
    toggleTextColor: string
    toggleTextColorActive: string

    keycapOverrides: { code: string; color: string }[]

    style?: React.CSSProperties

    // Custom keypress sounds (uploaded files)
    sound1Files: string
    sound1FilesAlt: string
    sound1FilesAlt2: string
    sound2Files: string
    sound2FilesAlt: string
    sound2FilesAlt2: string
}

/* User instructions:
Create an interactive keyboard showcase component for a modern website built in React (compatible with Framer code components).
- Render a full keyboard layout (QWERTY), each key as individual component, minimal modern premium style.
- Sync with real keyboard input via keydown/keyup. Animate pressed state (translateY + subtle scale + shadow).
- Sound system with multiple variations, selectable profiles (thocky/clicky/silent), low latency, reuse audio objects.
- Performance: handle fast typing, no new audio objects per press, cleanup listeners.
- Optional: RGB glow on press, toggle sound profiles, typing test text.
- Use functional components + hooks, clean modular (Keyboard, Key, SoundManager), Framer compatible.
*/

/**
 * @framerIntrinsicWidth 980
 * @framerIntrinsicHeight 420
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function KeyboardShowcase(props: KeyboardShowcaseProps) {
    const isStatic = useIsStaticRenderer()

    const {
        backgroundColor,
        surfaceColor,
        keyColor,
        keyTextColor,
        keyBorderColor,
        keyShadowColor,
        keyShadowPressedColor,
        accentColor,

        borderRadius,
        keyRadius,
        padding,
        gap,
        rowGap,
        keyHeight,
        keyFont,

        enableGlow,
        glowIntensity,
        rgbMode,
        rgbSpeed,

        soundEnabled,
        volume,
        thockMix,
        clickMix,
        reverbMix,

        switchType,
        showSwitchToggle,

        profile,
        showProfileToggle,

        showTypingTest,
        typingFont,
        typingHint,
        typingBackground,
        typingTextColor,
        footerTextColor,
        toggleTextColor,
        toggleTextColorActive,
        keycapOverrides,
        style,
        sound1Files,
        sound1FilesAlt,
        sound1FilesAlt2,
        sound2Files,
        sound2FilesAlt,
        sound2FilesAlt2,
    } = props

    const rootRef = React.useRef<HTMLElement | null>(null)
    const [isFocused, setIsFocused] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)

    const [pressed, setPressed] = React.useState<Record<string, boolean>>({})
    const pressedRef = React.useRef<Record<string, boolean>>({})
    const [typed, setTyped] = React.useState<string>("")
    const typedRef = React.useRef<string>("")

    const [localProfile, setLocalProfile] = React.useState<SoundProfile>(profile)
    React.useEffect(() => {
        startTransition(() => setLocalProfile(profile))
    }, [profile])

    const [localSwitchType, setLocalSwitchType] = React.useState<SwitchType>(switchType)
    React.useEffect(() => {
        startTransition(() => setLocalSwitchType(switchType))
    }, [switchType])

    const effectiveProfile = showProfileToggle ? localProfile : profile
    const effectiveSwitchType = showSwitchToggle ? localSwitchType : switchType

    const effectiveProfileRef = React.useRef<SoundProfile>(effectiveProfile)
    const effectiveSwitchTypeRef = React.useRef<SwitchType>(effectiveSwitchType)

    React.useEffect(() => {
        effectiveProfileRef.current = effectiveProfile
        effectiveSwitchTypeRef.current = effectiveSwitchType
    }, [effectiveProfile, effectiveSwitchType])

    React.useEffect(() => {
        pressedRef.current = pressed
    }, [pressed])

    React.useEffect(() => {
        typedRef.current = typed
    }, [typed])

    const soundEngineRef = React.useRef<WebAudioSoundEngine | null>(null)
    if (!soundEngineRef.current) soundEngineRef.current = new WebAudioSoundEngine()

    const urlsByProfile = React.useMemo(() => {
        const s1 = [sound1Files, sound1FilesAlt, sound1FilesAlt2].filter(Boolean)
        const s2 = [sound2Files, sound2FilesAlt, sound2FilesAlt2].filter(Boolean)
        return {
            sound1: s1,
            sound2: s2,
        } as Record<SoundProfile, string[]>
    }, [sound1Files, sound1FilesAlt, sound1FilesAlt2, sound2Files, sound2FilesAlt, sound2FilesAlt2])

    React.useEffect(() => {
        if (isStatic) return
        soundEngineRef.current?.configure({
            urlsByProfile,
            masterVolume: volume,
            thockMix,
            clickMix,
            reverbMix,
        })
        return () => {
            soundEngineRef.current?.dispose()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStatic, urlsByProfile, volume, thockMix, clickMix, reverbMix])

    const shouldIgnoreEventTarget = React.useCallback((target: EventTarget | null) => {
        const el = target as HTMLElement | null
        if (!el) return false
        const tag = (el.tagName || "").toLowerCase()
        if (tag === "input" || tag === "textarea" || tag === "select") return true
        if (el.isContentEditable) return true
        return false
    }, [])

    const updateTypedFromEvent = React.useCallback((e: KeyboardEvent) => {
        if (!showTypingTest) return
        if (e.metaKey || e.ctrlKey || e.altKey) return
        const code = e.code

        // Basic editing keys
        if (code === "Backspace") {
            const current = typedRef.current
            if (current.length === 0) return
            startTransition(() => setTyped(current.slice(0, -1)))
            return
        }
        if (code === "Enter") {
            startTransition(() => setTyped(typedRef.current + "\n"))
            return
        }
        if (code === "Tab") {
            e.preventDefault()
            startTransition(() => setTyped(typedRef.current + "\t"))
            return
        }
        if (code === "Space") {
            startTransition(() => setTyped(typedRef.current + " "))
            return
        }

        // Printable characters
        if (e.key && e.key.length === 1) {
            startTransition(() => setTyped(typedRef.current + e.key))
        }
    }, [showTypingTest])

    const handleKeyDown = React.useCallback(
        (e: KeyboardEvent) => {
            if (shouldIgnoreEventTarget(e.target)) return
            if (e.repeat) {
                // Still keep pressed visual without spamming state if already pressed
                const already = pressedRef.current[e.code]
                if (already) {
                    if (soundEnabled)
                        soundEngineRef.current?.play({
                            profile: effectiveProfileRef.current,
                            switchType: effectiveSwitchTypeRef.current,
                            phase: "down",
                        })
                    return
                }
            }

            const code = e.code
            startTransition(() => {
                setPressed((prev) => {
                    if (prev[code]) return prev
                    return { ...prev, [code]: true }
                })
            })

            if (soundEnabled)
                soundEngineRef.current?.play({
                    profile: effectiveProfileRef.current,
                    switchType: effectiveSwitchTypeRef.current,
                    phase: "down",
                })
            updateTypedFromEvent(e)
        },
        [soundEnabled, shouldIgnoreEventTarget, updateTypedFromEvent],
    )

    const handleKeyUp = React.useCallback(
        (e: KeyboardEvent) => {
            if (shouldIgnoreEventTarget(e.target)) return
            const code = e.code
            if (soundEnabled)
                soundEngineRef.current?.play({
                    profile: effectiveProfileRef.current,
                    switchType: effectiveSwitchTypeRef.current,
                    phase: "up",
                })
            startTransition(() => {
                setPressed((prev) => {
                    if (!prev[code]) return prev
                    const next = { ...prev }
                    delete next[code]
                    return next
                })
            })
        },
        [shouldIgnoreEventTarget, soundEnabled],
    )

    React.useEffect(() => {
        if (isStatic) {
            startTransition(() => setIsVisible(true))
            return
        }
        const node = rootRef.current
        if (!node) return
        if (typeof window === "undefined") return
        if (typeof (window as any).IntersectionObserver === "undefined") return

        const obs = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                const next = !!entry?.isIntersecting
                startTransition(() => setIsVisible(next))
            },
            { root: null, threshold: 0.08 },
        )

        obs.observe(node)
        return () => {
            try {
                obs.disconnect()
            } catch {}
        }
    }, [isStatic])

    React.useEffect(() => {
        if (isStatic) return
        const node = rootRef.current
        if (!node) return

        const onKeyDown = (e: KeyboardEvent) => handleKeyDown(e)
        const onKeyUp = (e: KeyboardEvent) => handleKeyUp(e)

        node.addEventListener("keydown", onKeyDown as any, { passive: false } as any)
        node.addEventListener("keyup", onKeyUp as any, { passive: true } as any)

        return () => {
            node.removeEventListener("keydown", onKeyDown as any)
            node.removeEventListener("keyup", onKeyUp as any)
        }
    }, [isStatic, handleKeyDown, handleKeyUp])

    React.useEffect(() => {
        if (!isFocused) {
            startTransition(() => setPressed({}))
        }
    }, [isFocused])

    const keyboardTheme = React.useMemo(() => {
        return {
            backgroundColor,
            surfaceColor,
            keyColor,
            keyTextColor,
            keyBorderColor,
            keyShadowColor,
            keyShadowPressedColor,
            accentColor,
            keyRadius,
            keyHeight,
            keyFont,
            enableGlow,
            glowIntensity,
            rgbMode,
            rgbSpeed,
            switchType: effectiveSwitchType,
        }
    }, [
        backgroundColor,
        surfaceColor,
        keyColor,
        keyTextColor,
        keyBorderColor,
        keyShadowColor,
        keyShadowPressedColor,
        accentColor,
        keyRadius,
        keyHeight,
        keyFont,
        enableGlow,
        glowIntensity,
        rgbMode,
        rgbSpeed,
        effectiveSwitchType,
    ])

    const handleUnlockAudio = React.useCallback(() => {
        if (!soundEnabled) return
        soundEngineRef.current?.unlock()
    }, [soundEnabled])

    const layout = React.useMemo(() => getKeyboardLayout(), [])

    const keycapOverrideMap = React.useMemo(() => {
        const map: Record<string, string> = {}
        ;(keycapOverrides || []).forEach((o) => {
            if (!o) return
            const code = String((o as any).code || "").trim()
            const color = String((o as any).color || "").trim()
            if (!code || !color) return
            map[code] = color
        })
        return map
    }, [keycapOverrides])

    return (
        <section
            ref={rootRef as any}
            tabIndex={0}
            onFocus={isStatic ? undefined : () => startTransition(() => setIsFocused(true))}
            onBlur={isStatic ? undefined : () => startTransition(() => setIsFocused(false))}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                borderRadius,
                padding,
                background: backgroundColor,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                outline: "none",
                outlineOffset: 2,
                boxShadow: isFocused ? `0 0 0 6px ${withAlpha(accentColor, 0.14)}, 0 18px 50px ${withAlpha(accentColor, 0.12)}` : undefined,
                transition: "box-shadow 160ms ease",
                ...style,
            }}
            aria-label="Interactive keyboard showcase"
            onPointerDown={
                isStatic
                    ? undefined
                    : (e) => {
                          ;(e.currentTarget as HTMLElement).focus()
                          handleUnlockAudio()
                      }
            }
        >
            <style>{`\n                @keyframes kb-rgb-hue {\n                    0% { filter: hue-rotate(0deg); }\n                    100% { filter: hue-rotate(360deg); }\n                }\n            `}</style>
            {(showProfileToggle || showTypingTest || showSwitchToggle) && (
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                    }}
                >
                    {showTypingTest ? (
                        <div
                            style={{
                                position: "relative",
                                flex: 1,
                                minWidth: 0,
                                borderRadius: "12px",
                                padding: "10px 12px",
                                background: typingBackground,
                                color: typingTextColor,
                                boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
                                border: "1px solid rgba(0,0,0,0.06)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                            }}
                        >
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                    style={{
                                        ...typingFont,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        overflowWrap: "anywhere",
                                        margin: 0,
                                        opacity: typed.length ? 1 : 0.7,
                                    }}
                                >
                                    {typed.length ? typed : typingHint}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => startTransition(() => setTyped(""))}
                                style={{
                                    appearance: "none",
                                    border: "1px solid rgba(0,0,0,0.12)",
                                    background: "rgba(255,255,255,0.7)",
                                    color: "#111",
                                    borderRadius: 10,
                                    padding: "8px 10px",
                                    cursor: "pointer",
                                    ...keyFont,
                                    fontSize: 12,
                                    lineHeight: "1em",
                                    whiteSpace: "nowrap",
                                }}
                                aria-label="Clear typed text"
                            >
                                Clear
                            </button>
                        </div>
                    ) : (
                        <div style={{ flex: 1 }} />
                    )}

                    {(showProfileToggle || showSwitchToggle) && (
                        <div
                            style={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                borderRadius: "12px",
                                padding: "6px",
                                background: "rgba(255,255,255,0.55)",
                                border: "1px solid rgba(0,0,0,0.06)",
                                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                                backdropFilter: "blur(8px)",
                                WebkitBackdropFilter: "blur(8px)",
                                flexWrap: "wrap",
                            }}
                            aria-label="Keyboard controls"
                        >
                            {showSwitchToggle && (
                                <>
                                    <ProfileButton
                                        label="Linear"
                                        active={effectiveSwitchType === "linear"}
                                        onClick={() => startTransition(() => setLocalSwitchType("linear"))}
                                        font={keyFont}
                                        textColor={toggleTextColor}
                                        activeTextColor={toggleTextColorActive}
                                    />
                                    <ProfileButton
                                        label="Tactile"
                                        active={effectiveSwitchType === "tactile"}
                                        onClick={() => startTransition(() => setLocalSwitchType("tactile"))}
                                        font={keyFont}
                                        textColor={toggleTextColor}
                                        activeTextColor={toggleTextColorActive}
                                    />
                                    <ProfileButton
                                        label="Clicky"
                                        active={effectiveSwitchType === "clicky"}
                                        onClick={() => startTransition(() => setLocalSwitchType("clicky"))}
                                        font={keyFont}
                                        textColor={toggleTextColor}
                                        activeTextColor={toggleTextColorActive}
                                    />
                                </>
                            )}

                            <ProfileButton
                                label="Sound 1"
                                active={effectiveProfile === "sound1"}
                                onClick={() => startTransition(() => setLocalProfile("sound1"))}
                                font={keyFont}
                                textColor={toggleTextColor}
                                activeTextColor={toggleTextColorActive}
                            />
                            <ProfileButton
                                label="Sound 2"
                                active={effectiveProfile === "sound2"}
                                onClick={() => startTransition(() => setLocalProfile("sound2"))}
                                font={keyFont}
                                textColor={toggleTextColor}
                                activeTextColor={toggleTextColorActive}
                            />
                        </div>
                    )}
                </div>
            )}

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    borderRadius: "16px",
                    padding: "14px",
                    background: surfaceColor,
                    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "16px",
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 35%, rgba(0,0,0,0.06) 100%)",
                        boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -18px 30px rgba(0,0,0,0.10), 0 22px 60px rgba(0,0,0,0.20)",
                        pointerEvents: "none",
                    }}
                    aria-hidden="true"
                />
                <div
                    style={{
                        position: "absolute",
                        left: 16,
                        right: 16,
                        bottom: 10,
                        height: 18,
                        borderRadius: 999,
                        background: "rgba(0,0,0,0.10)",
                        filter: "blur(10px)",
                        pointerEvents: "none",
                        transform: "translateY(10px)",
                    }}
                    aria-hidden="true"
                />
                <Keyboard
                    layout={layout}
                    pressed={pressed}
                    theme={keyboardTheme}
                    gap={gap}
                    rowGap={rowGap}
                    isStatic={isStatic}
                    keycapOverrideMap={keycapOverrideMap}
                    isVisible={isVisible}
                />
            </div>

            <div
                style={{
                    position: "relative",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    color: footerTextColor,
                    ...keyFont,
                    fontSize: 12,
                    lineHeight: "1.2em",
                }}
                aria-hidden="true"
            >
                <div style={{ minWidth: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Type on your keyboard to see and hear the keys.
                </div>
                <div style={{ whiteSpace: "nowrap" }}>
                    Switch: {effectiveSwitchType} · Sound: {soundEnabled ? effectiveProfile : "Off"}
                </div>
            </div>
            {!isStatic && !isFocused && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "18px",
                        background: "rgba(0,0,0,0.06)",
                        backdropFilter: "blur(2px)",
                        WebkitBackdropFilter: "blur(2px)",
                        opacity: 1,
                        transition: "opacity 160ms ease",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            padding: "10px 12px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.78)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
                            color: footerTextColor,
                            ...keyFont,
                            fontSize: 12,
                            lineHeight: "1em",
                            whiteSpace: "nowrap",
                        }}
                    >
                        Click to activate keyboard
                    </div>
                </div>
            )}
        </section>
    )
}

function Keyboard({
    layout,
    pressed,
    theme,
    gap,
    rowGap,
    isStatic,
    keycapOverrideMap,
    isVisible,
}: {
    layout: KeyDef[][]
    pressed: Record<string, boolean>
    theme: {
        backgroundColor: string
        surfaceColor: string
        keyColor: string
        keyTextColor: string
        keyBorderColor: string
        keyShadowColor: string
        keyShadowPressedColor: string
        accentColor: string
        keyRadius: string
        keyHeight: number
        keyFont: any
        enableGlow: boolean
        glowIntensity: number
        rgbMode: "reactive" | "wave" | "ripple"
        rgbSpeed: number
        switchType: SwitchType
    }
    gap: number
    rowGap: number
    isStatic: boolean
    keycapOverrideMap: Record<string, string>
    isVisible: boolean
}) {
    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                userSelect: "none",
                WebkitUserSelect: "none",
                display: "flex",
                flexDirection: "column",
                gap: rowGap,
            }}
            role="application"
            aria-label="Keyboard"
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: rowGap,
                }}
            >
                {layout.map((row, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        style={{
                            position: "relative",
                            width: "100%",
                            display: "flex",
                            gap,
                            alignItems: "stretch",
                        }}
                    >
                        {row.map((k) => {
                            if (k.isSpacer) {
                                return <div key={k.id} style={{ position: "relative", flex: k.width }} aria-hidden="true" />
                            }
                            const isPressed = !!(k.code && pressed[k.code])
                            const overrideColor = k.code ? keycapOverrideMap[k.code] : undefined
                            return (
                                <Keycap
                                    key={k.id}
                                    label={k.label}
                                    code={k.code}
                                    width={k.width}
                                    pressed={isStatic ? false : isPressed}
                                    theme={theme}
                                    colorOverride={overrideColor}
                                    waveRunning={isVisible}
                                />
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}

const Keycap = React.memo(function Keycap({
    label,
    code,
    width,
    pressed,
    theme,
    colorOverride,
    waveRunning,
}: {
    label: string
    code?: string
    width: number
    pressed: boolean
    theme: {
        keyColor: string
        keyTextColor: string
        keyBorderColor: string
        keyShadowColor: string
        keyShadowPressedColor: string
        accentColor: string
        keyRadius: string
        keyHeight: number
        keyFont: any
        enableGlow: boolean
        glowIntensity: number
        rgbMode: "reactive" | "wave" | "ripple"
        rgbSpeed: number
        switchType: SwitchType
    }
    colorOverride?: string
    waveRunning: boolean
}) {
    const {
        keyColor,
        keyTextColor,
        keyShadowColor,
        keyShadowPressedColor,
        accentColor,
        keyRadius,
        keyHeight,
        keyFont,
        enableGlow,
        glowIntensity,
        switchType,
        rgbMode,
        rgbSpeed,
    } = theme

    const rootRef = React.useRef<HTMLDivElement>(null)
    const prevPressedRef = React.useRef<boolean>(false)

    React.useEffect(() => {
        const node = rootRef.current
        const prev = prevPressedRef.current
        prevPressedRef.current = pressed
        if (!node) return
        if (!pressed || prev) return
        if (typeof node.animate !== "function") return

        const effectiveKeyColor = colorOverride || keyColor

        if (pressed && rgbMode === "ripple") {
            try {
                node.animate(
                    [
                        { boxShadow: baseShadow, filter: "none" },
                        {
                            boxShadow: `${baseShadow}, 0 0 ${Math.max(14, glowIntensity * 1.2)}px ${withAlpha(accentColor, 0.7)}`,
                            filter: `drop-shadow(0 0 ${Math.max(18, glowIntensity * 1.6)}px ${withAlpha(accentColor, 0.55)})`,
                        },
                        { boxShadow: baseShadow, filter: "none" },
                    ],
                    { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
                )
            } catch {}
        }

        if (switchType === "tactile") {
            node.animate(
                [
                    { transform: "translateY(0px) scale(1)" },
                    { transform: "translateY(1.5px) scale(0.992)", offset: 0.45 },
                    { transform: "translateY(3px) scale(0.985)" },
                ],
                { duration: 110, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
            )
        }

        if (switchType === "clicky") {
            node.animate(
                [
                    { transform: "translateY(0px) scale(1)" },
                    { transform: "translateY(3px) scale(0.982)", offset: 0.55 },
                    { transform: "translateY(2.3px) scale(0.988)", offset: 0.78 },
                    { transform: "translateY(3px) scale(0.985)" },
                ],
                { duration: 95, easing: "cubic-bezier(0.15, 0.85, 0.2, 1)" },
            )
        }
    }, [pressed, switchType])

    const effectiveKeyColor = colorOverride || keyColor

    const keycapBackground = React.useMemo(() => makeKeycapBackground(effectiveKeyColor), [effectiveKeyColor])

    const pressY = 3
    const baseShadow = `0 18px 34px ${keyShadowColor}, 0 7px 0 rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -10px 18px rgba(0,0,0,0.10)`
    const pressedShadow = `0 10px 22px ${keyShadowPressedColor}, 0 3px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -8px 14px rgba(0,0,0,0.12)`

    const waveDurationMs = Math.round(lerp(2200, 650, clamp(rgbSpeed, 0, 1)))
    const waveDelayMs = Math.round(((code ? hashCode(code) : label.length) % 17) * 40)

    const glow = enableGlow && (pressed || rgbMode === "wave")
    const glowShadow = glow
        ? `0 0 ${Math.max(8, glowIntensity)}px rgba(0,0,0,0), 0 0 ${Math.max(
              16,
              glowIntensity * 1.8
          )}px ${withAlpha(accentColor, 0.55)}`
        : "none"

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                flex: width,
                height: keyHeight,
                borderRadius: keyRadius,
                background: keycapBackground,
                border: "none",
                boxShadow: pressed ? pressedShadow : baseShadow,
                transform: pressed ? `translateY(${pressY}px) scale(0.985)` : "translateY(0px) scale(1)",
                transitionProperty: "transform, box-shadow, filter",
                transitionDuration: "100ms",
                transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                filter: glow ? `drop-shadow(${glowShadow})` : "none",
                animation:
                    enableGlow && rgbMode === "wave" && waveRunning
                        ? `kb-rgb-hue ${waveDurationMs}ms linear infinite`
                        : undefined,
                animationDelay: enableGlow && rgbMode === "wave" ? `-${waveDelayMs}ms` : undefined,
                animationPlayState: enableGlow && rgbMode === "wave" && !waveRunning ? ("paused" as any) : undefined,
                willChange: "transform",
                transformStyle: "preserve-3d",
            }}
            role="button"
            aria-label={code ? `Key ${label}` : label}
            aria-pressed={pressed}
            tabIndex={-1}
        >
            {enableGlow && rgbMode === "wave" && (
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: -18,
                        borderRadius: keyRadius,
                        background: withAlpha(accentColor, 0.28),
                        filter: "blur(14px)",
                        opacity: waveRunning ? 1 : 0,
                        transition: "opacity 260ms ease",
                        animation: `kb-rgb-hue ${waveDurationMs}ms linear infinite`,
                        animationDelay: `-${waveDelayMs}ms`,
                        animationPlayState: waveRunning ? ("running" as any) : ("paused" as any),
                        pointerEvents: "none",
                        transform: "translateZ(0px)",
                    }}
                />
            )}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -9,
                    height: 12,
                    borderRadius: `0 0 ${keyRadius} ${keyRadius}`,
                    background: adjustColorLightness(effectiveKeyColor, -0.08),
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                    transform: pressed ? "translateZ(-1px) translateY(-3px)" : "translateZ(-1px)",
                    filter: "saturate(1.02)",
                    opacity: 0.95,
                    pointerEvents: "none",
                }}
                aria-hidden="true"
            />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: keyRadius,
                    boxShadow:
                        "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 -14px 22px rgba(0,0,0,0.10)",
                    opacity: pressed ? 0.7 : 1,
                    transition: "opacity 100ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    pointerEvents: "none",
                    transform: "translateZ(1px)",
                }}
                aria-hidden="true"
            />
            <span
                style={{
                    position: "relative",
                    color: keyTextColor,
                    ...keyFont,
                    fontSize: (keyFont?.fontSize as any) ?? "13px",
                    lineHeight: "1em",
                    letterSpacing: (keyFont?.letterSpacing as any) ?? "-0.01em",
                    opacity: pressed ? 0.98 : 0.92,
                    transform: pressed ? "translateY(0.5px)" : "translateY(0px)",
                    transition: "transform 100ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 100ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    whiteSpace: "pre",
                    textAlign: "center",
                    padding: "0 8px",
                }}
            >
                {label}
            </span>
        </div>
    )
})

function makeKeycapBackground(color: string) {
    // Flat color so custom keycap colors stay accurate (3D comes from shadows/insets)
    return color
}

function adjustColorLightness(color: string, delta: number) {
    const rgb = parseCssColorToRgb(color)
    if (!rgb) return color
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hsl.l = clamp(hsl.l + delta, 0, 1)
    const out = hslToRgb(hsl.h, hsl.s, hsl.l)
    return `rgb(${out.r},${out.g},${out.b})`
}

function parseCssColorToRgb(color: string): { r: number; g: number; b: number } | null {
    if (!color) return null
    const c = color.trim()

    if (c[0] === "#") {
        const hex = c.slice(1)
        const full =
            hex.length === 3
                ? hex
                      .split("")
                      .map((x) => x + x)
                      .join("")
                : hex.length === 6
                  ? hex
                  : hex.length === 8
                    ? hex.slice(0, 6)
                    : ""
        if (full.length !== 6) return null
        const r = parseInt(full.slice(0, 2), 16)
        const g = parseInt(full.slice(2, 4), 16)
        const b = parseInt(full.slice(4, 6), 16)
        if ([r, g, b].some((n) => Number.isNaN(n))) return null
        return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) }
    }

    const m = c.match(/rgba?\(([^)]+)\)/i)
    if (m) {
        const parts = m[1].split(",").map((p) => p.trim())
        const r = Math.round(Number(parts[0] ?? 0))
        const g = Math.round(Number(parts[1] ?? 0))
        const b = Math.round(Number(parts[2] ?? 0))
        if ([r, g, b].some((n) => Number.isNaN(n))) return null
        return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) }
    }

    return null
}

function rgbToHsl(r0: number, g0: number, b0: number) {
    const r = r0 / 255
    const g = g0 / 255
    const b = b0 / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min

    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (d !== 0) {
        s = d / (1 - Math.abs(2 * l - 1))
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6
                break
            case g:
                h = ((b - r) / d + 2) / 6
                break
            case b:
                h = ((r - g) / d + 4) / 6
                break
        }
    }

    return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number) {
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
    }

    let r: number, g: number, b: number

    if (s === 0) {
        r = g = b = l
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

function ProfileButton({
    label,
    active,
    onClick,
    font,
    textColor,
    activeTextColor,
}: {
    label: string
    active: boolean
    onClick: () => void
    font: any
    textColor: string
    activeTextColor: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                position: "relative",
                appearance: "none",
                border: "1px solid rgba(0,0,0,0.10)",
                background: active ? "rgba(0,0,0,0.88)" : "rgba(255,255,255,0.8)",
                color: active ? activeTextColor : textColor,
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                ...font,
                fontSize: 12,
                lineHeight: "1em",
                transition: "background 120ms ease, color 120ms ease, transform 120ms ease",
                transform: active ? "translateY(0px)" : "translateY(0px)",
                whiteSpace: "nowrap",
            }}
            aria-pressed={active}
        >
            {label}
        </button>
    )
}

class WebAudioSoundEngine {
    private ctx: AudioContext | null = null
    private master: GainNode | null = null
    private lowShelf: BiquadFilterNode | null = null
    private highShelf: BiquadFilterNode | null = null
    private convolver: ConvolverNode | null = null
    private reverbGain: GainNode | null = null
    private analyser: AnalyserNode | null = null

    private thockBuffers: Record<SoundProfile, AudioBuffer[]> = { sound1: [], sound2: [] }
    private clickBuffers: Record<SoundProfile, AudioBuffer[]> = { sound1: [], sound2: [] }

    private masterVolume = 0.6
    private thockMix = 0.75
    private clickMix = 0.45
    private reverbMix = 0.1

    private configured = false
    private lastUrlsByProfile: Record<SoundProfile, string[]> = { sound1: [], sound2: [] }
    private loadToken = 0

    getAnalyser() {
        return this.analyser
    }

    configure(opts: {
        urlsByProfile: Record<SoundProfile, string[]>
        masterVolume: number
        thockMix: number
        clickMix: number
        reverbMix: number
    }) {
        this.masterVolume = clamp(opts.masterVolume, 0, 1)

        // Mixer tuning exposed via props
        this.thockMix = clamp(opts.thockMix, 0, 1)
        this.clickMix = clamp(opts.clickMix, 0, 1)
        this.reverbMix = clamp(opts.reverbMix, 0, 1)

        this.ensureGraph()
        this.updateMix()
        this.ensureCustomBuffers(opts.urlsByProfile)
        this.ensureBuffers()
        this.configured = true
        return
    }

    unlock() {
        if (typeof window === "undefined") return
        this.ensureGraph()
        const ctx = this.ctx
        if (!ctx) return
        if (ctx.state === "suspended") {
            ctx.resume().catch(() => {})
        }
    }

    play(opts: { profile: SoundProfile; switchType: SwitchType; phase: "down" | "up" }) {
        if (typeof window === "undefined") return
        this.ensureGraph()
        if (!this.ctx || !this.master || !this.lowShelf || !this.highShelf || !this.reverbGain || !this.convolver) return
        if (!this.configured) return

        // Autoplay policy safety
        if (this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {})
        }

        const profile = opts.profile
        const sw = opts.switchType
        const now = this.ctx.currentTime

        const thock = pickRandom(this.thockBuffers[profile])
        const click = pickRandom(this.clickBuffers[profile])

        if (!thock && !click) return

        const phase = opts.phase
        const downTransientBoost = sw === "clicky" ? 1.0 : sw === "tactile" ? 0.55 : 0.25
        const bumpDelay = sw === "tactile" ? 0.012 : 0
        const clickDelay = sw === "clicky" ? 0.002 : 0

        if (phase === "down") {
            if (thock) {
                this.spawn(thock, now, 1.0, 0.94 + Math.random() * 0.12)
                if (bumpDelay > 0) this.spawn(thock, now + bumpDelay, 0.55, 0.96 + Math.random() * 0.1)
            }

            if (click) {
                this.spawn(click, now + clickDelay, downTransientBoost, 0.98 + Math.random() * 0.18)
                if (sw === "clicky") this.spawn(click, now + 0.01, 0.35, 1.02 + Math.random() * 0.18)
            }
        } else {
            // Upstroke: slightly higher pitch, quieter, mostly click layer
            if (click) this.spawn(click, now, 0.22, 1.12 + Math.random() * 0.18)
            if (sw === "clicky" && click) this.spawn(click, now + 0.008, 0.12, 1.18 + Math.random() * 0.14)
        }
    }

    dispose() {
        this.loadToken++
        try {
            this.master?.disconnect()
        } catch {}
        try {
            this.analyser?.disconnect()
        } catch {}
        try {
            this.ctx?.close()
        } catch {}
        this.ctx = null
        this.master = null
        this.lowShelf = null
        this.highShelf = null
        this.convolver = null
        this.reverbGain = null
        this.analyser = null
        this.thockBuffers = { sound1: [], sound2: [] }
        this.clickBuffers = { sound1: [], sound2: [] }
        this.configured = false
    }

    private ensureGraph() {
        if (this.ctx) return
        if (typeof window === "undefined") return
        const AudioContextCtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
        if (!AudioContextCtor) return

        const ctx = new AudioContextCtor({ latencyHint: "interactive" } as any)
        const master = ctx.createGain()
        const lowShelf = ctx.createBiquadFilter()
        lowShelf.type = "lowshelf"
        lowShelf.frequency.value = 180

        const highShelf = ctx.createBiquadFilter()
        highShelf.type = "highshelf"
        highShelf.frequency.value = 2600

        const convolver = ctx.createConvolver()
        convolver.buffer = createImpulseResponse(ctx, 1.15, 2.2)

        const reverbGain = ctx.createGain()

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.8

        // Dry path
        master.connect(lowShelf)
        lowShelf.connect(highShelf)
        highShelf.connect(ctx.destination)

        // Tap for visualizer (no additional output)
        try {
            highShelf.connect(analyser)
        } catch {}

        // Wet path
        highShelf.connect(reverbGain)
        reverbGain.connect(convolver)
        convolver.connect(ctx.destination)

        this.ctx = ctx
        this.master = master
        this.lowShelf = lowShelf
        this.highShelf = highShelf
        this.convolver = convolver
        this.reverbGain = reverbGain
        this.analyser = analyser

        this.updateMix()
    }

    private updateMix() {
        if (!this.ctx || !this.master || !this.lowShelf || !this.highShelf || !this.reverbGain) return
        this.master.gain.value = this.masterVolume

        // Mixer: thock -> lowshelf gain, click -> highshelf gain
        this.lowShelf.gain.value = lerp(-8, 10, this.thockMix)
        this.highShelf.gain.value = lerp(-12, 10, this.clickMix)
        this.reverbGain.gain.value = this.reverbMix
    }

    private ensureBuffers() {
        if (!this.ctx) return
        const ctx = this.ctx
        const count = 10

        ;([`sound1`, `sound2`] as SoundProfile[]).forEach((p) => {
            // If user uploaded custom audio, keep it (don't overwrite)
            const hasCustom = this.lastUrlsByProfile[p]?.length > 0 && this.thockBuffers[p].length > 0
            if (!hasCustom && this.thockBuffers[p].length < count) {
                this.thockBuffers[p] = Array.from({ length: count }, (_, i) =>
                    createKeyBuffer(ctx, {
                        kind: "thock",
                        seed: i + (p === "sound1" ? 0 : 60),
                        profile: p,
                    })
                )
            }

            if (!hasCustom && this.clickBuffers[p].length < count) {
                this.clickBuffers[p] = Array.from({ length: count }, (_, i) =>
                    createKeyBuffer(ctx, {
                        kind: "click",
                        seed: i + (p === "sound1" ? 150 : 240),
                        profile: p,
                    })
                )
            }
        })
    }

    private ensureCustomBuffers(urlsByProfile: Record<SoundProfile, string[]>) {
        if (!this.ctx) return
        const ctx = this.ctx
        const token = ++this.loadToken

        ;([`sound1`, `sound2`] as SoundProfile[]).forEach((p) => {
            const urls = (urlsByProfile[p] || []).filter(Boolean)
            const prev = this.lastUrlsByProfile[p] || []
            if (arrayShallowEqual(urls, prev)) return
            this.lastUrlsByProfile[p] = urls

            if (urls.length === 0) {
                // Fall back to synthesized buffers
                this.thockBuffers[p] = []
                this.clickBuffers[p] = []
                return
            }

            Promise.all(
                urls.map(async (url) => {
                    try {
                        const res = await fetch(url)
                        const arr = await res.arrayBuffer()
                        const decoded = await ctx.decodeAudioData(arr.slice(0))
                        return decoded
                    } catch {
                        return null
                    }
                }),
            ).then((buffers) => {
                if (token !== this.loadToken) return
                const valid = buffers.filter(Boolean) as AudioBuffer[]
                if (valid.length === 0) return
                // Use user-provided buffers for both layers (filters/mix still apply)
                this.thockBuffers[p] = valid
                this.clickBuffers[p] = valid
            })
        })
    }

    private spawn(buffer: AudioBuffer, when: number, amp: number, playbackRate: number) {
        if (!this.ctx || !this.master) return
        const src = this.ctx.createBufferSource()
        src.buffer = buffer
        src.playbackRate.value = playbackRate

        const gain = this.ctx.createGain()
        gain.gain.value = amp

        src.connect(gain)
        gain.connect(this.master)
        try {
            src.start(when)
        } catch {}

        // Cleanup
        src.onended = () => {
            try {
                src.disconnect()
            } catch {}
            try {
                gain.disconnect()
            } catch {}
        }
    }
}

function getKeyboardLayout(): KeyDef[][] {
    // Width units are relative weights per row.
    return [
        // Row 1
        [
            { id: "esc", code: "Escape", label: "Esc", width: 1 },
            { id: "sp1", isSpacer: true, label: "", width: 0.3 },
            { id: "d1", code: "Digit1", label: "1", width: 1 },
            { id: "d2", code: "Digit2", label: "2", width: 1 },
            { id: "d3", code: "Digit3", label: "3", width: 1 },
            { id: "d4", code: "Digit4", label: "4", width: 1 },
            { id: "d5", code: "Digit5", label: "5", width: 1 },
            { id: "d6", code: "Digit6", label: "6", width: 1 },
            { id: "d7", code: "Digit7", label: "7", width: 1 },
            { id: "d8", code: "Digit8", label: "8", width: 1 },
            { id: "d9", code: "Digit9", label: "9", width: 1 },
            { id: "d0", code: "Digit0", label: "0", width: 1 },
            { id: "minus", code: "Minus", label: "-", width: 1 },
            { id: "equal", code: "Equal", label: "=", width: 1 },
            { id: "backspace", code: "Backspace", label: "Backspace", width: 2.2 },
        ],
        // Row 2
        [
            { id: "tab", code: "Tab", label: "Tab", width: 1.6 },
            { id: "q", code: "KeyQ", label: "Q", width: 1 },
            { id: "w", code: "KeyW", label: "W", width: 1 },
            { id: "e", code: "KeyE", label: "E", width: 1 },
            { id: "r", code: "KeyR", label: "R", width: 1 },
            { id: "t", code: "KeyT", label: "T", width: 1 },
            { id: "y", code: "KeyY", label: "Y", width: 1 },
            { id: "u", code: "KeyU", label: "U", width: 1 },
            { id: "i", code: "KeyI", label: "I", width: 1 },
            { id: "o", code: "KeyO", label: "O", width: 1 },
            { id: "p", code: "KeyP", label: "P", width: 1 },
            { id: "bracketL", code: "BracketLeft", label: "[", width: 1 },
            { id: "bracketR", code: "BracketRight", label: "]", width: 1 },
            { id: "backslash", code: "Backslash", label: "\\", width: 1.6 },
        ],
        // Row 3
        [
            { id: "caps", code: "CapsLock", label: "Caps", width: 1.9 },
            { id: "a", code: "KeyA", label: "A", width: 1 },
            { id: "s", code: "KeyS", label: "S", width: 1 },
            { id: "d", code: "KeyD", label: "D", width: 1 },
            { id: "f", code: "KeyF", label: "F", width: 1 },
            { id: "g", code: "KeyG", label: "G", width: 1 },
            { id: "h", code: "KeyH", label: "H", width: 1 },
            { id: "j", code: "KeyJ", label: "J", width: 1 },
            { id: "k", code: "KeyK", label: "K", width: 1 },
            { id: "l", code: "KeyL", label: "L", width: 1 },
            { id: "semi", code: "Semicolon", label: ";", width: 1 },
            { id: "quote", code: "Quote", label: "'", width: 1 },
            { id: "enter", code: "Enter", label: "Enter", width: 2.35 },
        ],
        // Row 4
        [
            { id: "shiftL", code: "ShiftLeft", label: "Shift", width: 2.5 },
            { id: "z", code: "KeyZ", label: "Z", width: 1 },
            { id: "x", code: "KeyX", label: "X", width: 1 },
            { id: "c", code: "KeyC", label: "C", width: 1 },
            { id: "v", code: "KeyV", label: "V", width: 1 },
            { id: "b", code: "KeyB", label: "B", width: 1 },
            { id: "n", code: "KeyN", label: "N", width: 1 },
            { id: "m", code: "KeyM", label: "M", width: 1 },
            { id: "comma", code: "Comma", label: ",", width: 1 },
            { id: "dot", code: "Period", label: ".", width: 1 },
            { id: "slash", code: "Slash", label: "/", width: 1 },
            { id: "shiftR", code: "ShiftRight", label: "Shift", width: 2.9 },
            { id: "spArrowsTop", isSpacer: true, label: "", width: 0.6 },
            { id: "spArrowTopL", isSpacer: true, label: "", width: 1 },
            { id: "arrowU", code: "ArrowUp", label: "↑", width: 1 },
            { id: "spArrowTopR", isSpacer: true, label: "", width: 1 },
        ],
        // Row 5
        [
            { id: "ctrlL", code: "ControlLeft", label: "Ctrl", width: 1.4 },
            { id: "metaL", code: "MetaLeft", label: "Win", width: 1.4 },
            { id: "altL", code: "AltLeft", label: "Alt", width: 1.4 },
            { id: "space", code: "Space", label: "Space", width: 6.8 },
            { id: "altR", code: "AltRight", label: "Alt", width: 1.4 },
            { id: "metaR", code: "MetaRight", label: "Win", width: 1.4 },
            { id: "menu", code: "ContextMenu", label: "Menu", width: 1.4 },
            { id: "ctrlR", code: "ControlRight", label: "Ctrl", width: 1.4 },
            { id: "spArrows", isSpacer: true, label: "", width: 0.6 },
            { id: "arrowL", code: "ArrowLeft", label: "←", width: 1 },
            { id: "arrowD", code: "ArrowDown", label: "↓", width: 1 },
            { id: "arrowR", code: "ArrowRight", label: "→", width: 1 },
        ],
    ]
}

function withAlpha(color: string, alpha: number) {
    const a = clamp(alpha, 0, 1)
    if (!color) return `rgba(255,255,255,${a})`
    const c = color.trim()

    // hex
    if (c[0] === "#") {
        const hex = c.slice(1)
        const full =
            hex.length === 3
                ? hex
                      .split("")
                      .map((x) => x + x)
                      .join("")
                : hex.length === 6
                  ? hex
                  : hex.length === 8
                    ? hex.slice(0, 6)
                    : "ffffff"
        const r = parseInt(full.slice(0, 2), 16)
        const g = parseInt(full.slice(2, 4), 16)
        const b = parseInt(full.slice(4, 6), 16)
        return `rgba(${r},${g},${b},${a})`
    }

    // rgb/rgba
    const rgbMatch = c.match(/rgba?\(([^)]+)\)/i)
    if (rgbMatch) {
        const parts = rgbMatch[1].split(",").map((p) => p.trim())
        const r = parts[0] ?? "255"
        const g = parts[1] ?? "255"
        const b = parts[2] ?? "255"
        return `rgba(${r},${g},${b},${a})`
    }

    return c
}

function hashCode(str: string) {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
    return h
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
}

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * clamp(t, 0, 1)
}

function pickRandom<T>(arr: T[]) {
    if (!arr || arr.length === 0) return null
    return arr[(Math.random() * arr.length) | 0]
}

function mulberry32(seed: number) {
    let t = seed >>> 0
    return () => {
        t += 0x6d2b79f5
        let r = Math.imul(t ^ (t >>> 15), 1 | t)
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    }
}

function createImpulseResponse(ctx: AudioContext, duration: number, decay: number) {
    const rate = ctx.sampleRate
    const length = Math.max(1, Math.floor(rate * duration))
    const impulse = ctx.createBuffer(2, length, rate)
    for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch)
        for (let i = 0; i < length; i++) {
            const t = i / length
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay)
        }
    }
    return impulse
}

function createKeyBuffer(
    ctx: AudioContext,
    opts: { kind: "thock" | "click"; seed: number; profile: SoundProfile },
) {
    const rand = mulberry32(opts.seed)
    const rate = ctx.sampleRate

    const baseDur = opts.kind === "thock" ? 0.06 : 0.018
    const dur = baseDur * (0.92 + rand() * 0.22)
    const length = Math.max(1, Math.floor(rate * dur))
    const buffer = ctx.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)

    // Profile shaping
    const lowBias = opts.profile === "sound1" ? 1.0 : 0.82
    const highBias = opts.profile === "sound2" ? 1.0 : 0.62

    let prev = 0
    const smoothing = opts.kind === "thock" ? 0.92 : 0.72

    for (let i = 0; i < length; i++) {
        const t = i / length
        const env = opts.kind === "thock" ? Math.pow(1 - t, 2.6) : Math.pow(1 - t, 6.0)
        const n = rand() * 2 - 1

        // Simple low-pass / high-pass blend from filtered noise
        prev = prev * smoothing + n * (1 - smoothing)
        const low = prev
        const high = n - prev

        let sample = 0
        if (opts.kind === "thock") {
            // Add a tiny sine to simulate housing resonance
            const f = 90 + rand() * 60
            const sine = Math.sin((2 * Math.PI * f * i) / rate)
            sample = (low * 0.9 * lowBias + sine * 0.25 * lowBias) * env
        } else {
            sample = (high * 0.9 * highBias) * env
        }

        // micro variation
        sample *= 0.85 + rand() * 0.3
        data[i] = sample
    }

    return buffer
}

function arrayShallowEqual(a: string[], b: string[]) {
    if (a === b) return true
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
    return true
}

addPropertyControls(KeyboardShowcase, {
    backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" },
    surfaceColor: { type: ControlType.Color, title: "Surface", defaultValue: "#F5F5F5" },
    keyColor: { type: ControlType.Color, title: "Key", defaultValue: "#FFFFFF" },
    keyTextColor: { type: ControlType.Color, title: "Key Text", defaultValue: "#000000" },
    keyBorderColor: { type: ControlType.Color, title: "Key Border", defaultValue: "#EEEEEE" },
    keyShadowColor: { type: ControlType.Color, title: "Shadow", defaultValue: "rgba(0,0,0,0.18)" },
    keyShadowPressedColor: { type: ControlType.Color, title: "Shadow Press", defaultValue: "rgba(0,0,0,0.14)" },
    accentColor: { type: ControlType.Color, title: "Accent", defaultValue: "#0099FF" },

    borderRadius: { type: ControlType.BorderRadius, title: "Radius", defaultValue: "20px" },
    keyRadius: { type: ControlType.BorderRadius, title: "Key Radius", defaultValue: "14px" },
    padding: { type: ControlType.Padding, title: "Padding", defaultValue: "16px" },

    gap: { type: ControlType.Number, title: "Key Gap", defaultValue: 10, min: 4, max: 18, step: 1, unit: "px" },
    rowGap: { type: ControlType.Number, title: "Row Gap", defaultValue: 10, min: 4, max: 18, step: 1, unit: "px" },
    keyHeight: { type: ControlType.Number, title: "Key Height", defaultValue: 54, min: 36, max: 78, step: 1, unit: "px" },

    keyFont: {
        type: ControlType.Font,
        title: "Key Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Semibold", letterSpacing: "-0.01em", lineHeight: "1em" },
    },

    keycapOverrides: {
        type: ControlType.Array,
        title: "Key Colors",
        defaultValue: [{ code: "KeyW", color: "#0099FF" }],
        control: {
            type: ControlType.Object,
            controls: {
                code: { type: ControlType.String, title: "Code", defaultValue: "KeyW" },
                color: { type: ControlType.Color, title: "Color", defaultValue: "#0099FF" },
            },
        },
    },

    enableGlow: { type: ControlType.Boolean, title: "RGB Glow", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    glowIntensity: {
        type: ControlType.Number,
        title: "Glow",
        defaultValue: 18,
        min: 0,
        max: 48,
        step: 1,
        unit: "px",
        hidden: (p) => !p.enableGlow,
    },

    soundEnabled: { type: ControlType.Boolean, title: "Sound", defaultValue: true, enabledTitle: "On", disabledTitle: "Off" },
    volume: { type: ControlType.Number, title: "Volume", defaultValue: 0.6, min: 0, max: 1, step: 0.05 },
    thockMix: { type: ControlType.Number, title: "Thock", defaultValue: 0.75, min: 0, max: 1, step: 0.05, hidden: (p) => !p.soundEnabled },
    clickMix: { type: ControlType.Number, title: "Click", defaultValue: 0.45, min: 0, max: 1, step: 0.05, hidden: (p) => !p.soundEnabled },
    reverbMix: { type: ControlType.Number, title: "Reverb", defaultValue: 0.1, min: 0, max: 1, step: 0.05, hidden: (p) => !p.soundEnabled },

    switchType: {
        type: ControlType.Enum,
        title: "Switch",
        options: ["linear", "tactile", "clicky"],
        optionTitles: ["Linear", "Tactile", "Clicky"],
        defaultValue: "linear",
    },
    showSwitchToggle: {
        type: ControlType.Boolean,
        title: "Switch UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    profile: {
        type: ControlType.Enum,
        title: "Sound",
        options: ["sound1", "sound2"],
        optionTitles: ["Sound 1", "Sound 2"],
        defaultValue: "sound1",
    },
    showProfileToggle: {
        type: ControlType.Boolean,
        title: "Profile UI",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },

    showTypingTest: { type: ControlType.Boolean, title: "Typing Test", defaultValue: true, enabledTitle: "Show", disabledTitle: "Hide" },
    typingHint: { type: ControlType.String, title: "Hint", defaultValue: "Try: The quick brown fox jumps over the lazy dog." },
    typingBackground: { type: ControlType.Color, title: "Hint Bg", defaultValue: "#F5F5F5", hidden: (p) => !p.showTypingTest },
    typingTextColor: { type: ControlType.Color, title: "Hint Text", defaultValue: "#000000", hidden: (p) => !p.showTypingTest },
    typingFont: {
        type: ControlType.Font,
        title: "Hint Font",
        controls: "extended",
        defaultFontType: "sans-serif",
        defaultValue: { fontSize: "13px", variant: "Medium", letterSpacing: "-0.01em", lineHeight: "1.25em" },
        hidden: (p) => !p.showTypingTest,
    },
    rgbMode: {
        type: ControlType.Enum,
        title: "RGB Mode",
        options: ["reactive", "wave", "ripple"],
        optionTitles: ["Reactive", "Wave", "Ripple"],
        defaultValue: "reactive",
        hidden: (p) => !p.enableGlow,
    },
    rgbSpeed: {
        type: ControlType.Number,
        title: "RGB Speed",
        defaultValue: 0.5,
        min: 0,
        max: 1,
        step: 0.05,
        hidden: (p) => !p.enableGlow || p.rgbMode !== "wave",
    },

    sound1Files: { type: ControlType.File, title: "Sound 1", allowedFileTypes: ["mp3", "wav", "ogg"] },
    sound1FilesAlt: { type: ControlType.File, title: "Sound 1 Alt", allowedFileTypes: ["mp3", "wav", "ogg"], hidden: (p) => !p.soundEnabled },
    sound1FilesAlt2: { type: ControlType.File, title: "Sound 1 Alt 2", allowedFileTypes: ["mp3", "wav", "ogg"], hidden: (p) => !p.soundEnabled },

    sound2Files: { type: ControlType.File, title: "Sound 2", allowedFileTypes: ["mp3", "wav", "ogg"], hidden: (p) => !p.soundEnabled },
    sound2FilesAlt: { type: ControlType.File, title: "Sound 2 Alt", allowedFileTypes: ["mp3", "wav", "ogg"], hidden: (p) => !p.soundEnabled },
    sound2FilesAlt2: { type: ControlType.File, title: "Sound 2 Alt 2", allowedFileTypes: ["mp3", "wav", "ogg"], hidden: (p) => !p.soundEnabled },
    footerTextColor: { type: ControlType.Color, title: "Footer Text", defaultValue: "rgba(0,0,0,0.55)" },
    toggleTextColor: { type: ControlType.Color, title: "Toggle Text", defaultValue: "#111111", hidden: (p) => !p.showProfileToggle && !p.showSwitchToggle },
    toggleTextColorActive: { type: ControlType.Color, title: "Toggle Text Active", defaultValue: "#FFFFFF", hidden: (p) => !p.showProfileToggle && !p.showSwitchToggle },
})