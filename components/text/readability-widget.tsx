// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useMemo, useRef, useState } from "react"

type Tone = "normal" | "warm" | "cool" | "mono"
type Appearance = "auto" | "light" | "dark"
type SiteTheme = "light" | "dark"
type PreviewMode = "closed" | "open" | "demo"

type Settings = {
    dyslexiaFont: boolean
    textScale: number
    textSpacing: boolean
    reducedMotion: boolean
    readingGuide: boolean
    tone: Tone
    lofiMode: boolean
    cursorTrail: boolean
}

type Props = {
    accent: string
    panelTitle: string
    targetName: string
    side: "left" | "right"
    vertical: "top" | "bottom"
    offsetX: number
    offsetY: number
    zIndex: number
    appearance: Appearance
    previewMode: PreviewMode
    showDyslexiaFont: boolean
    showTextSize: boolean
    showTextSpacing: boolean
    showReducedMotion: boolean
    showReadingGuide: boolean
    showLofiMode: boolean
    eyeComfortColor: string
    eyeComfortStrength: number
    showColorTone: boolean
    showCursorTrail: boolean
    showCelebrate: boolean
}

const STORAGE_KEY = "readability-fun-settings-v2"
const LEGACY_STORAGE_KEY = "readability-fun-settings"
const SITE_THEME_STORAGE_KEY = "site-theme"
const LEGACY_SITE_THEME_STORAGE_KEYS = ["theme", "framer-theme", "color-theme"]
const STYLE_ID = "readability-fun-global-style"
const WIDGET_ATTR = "data-readability-fun-widget"
const DEFAULT_TARGET_NAME = "Readability Scope"
const TARGET_CLASS = "rf-readability-target"
const TARGET_CLASSES = [
    TARGET_CLASS,
    "rf-dyslexia-font",
    "rf-text-spacing",
    "rf-reduced-motion",
    "rf-tone-warm",
    "rf-tone-cool",
    "rf-tone-mono",
]
const TEXT_SELECTORS =
    "p,h1,h2,h3,h4,h5,h6,span,a,button,label,li,td,th,blockquote,figcaption,input,textarea,select,small,strong,em"

const DEFAULT_SETTINGS: Settings = {
    dyslexiaFont: false,
    textScale: 100,
    textSpacing: false,
    reducedMotion: false,
    readingGuide: false,
    tone: "normal",
    lofiMode: false,
    cursorTrail: false,
}

const DEMO_SETTINGS: Settings = {
    ...DEFAULT_SETTINGS,
    textScale: 120,
    textSpacing: true,
}

const toneLabels: Record<Tone, string> = {
    normal: "Normal",
    warm: "Warm",
    cool: "Cool",
    mono: "Mono",
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 * @framerIntrinsicWidth 40
 * @framerIntrinsicHeight 40
 */
export default function ReadabilityFunWidget(props: Props) {
    const {
        accent,
        panelTitle,
        targetName = DEFAULT_TARGET_NAME,
        side,
        vertical,
        offsetX,
        offsetY,
        zIndex,
        appearance,
        previewMode,
        showDyslexiaFont,
        showTextSize,
        showTextSpacing,
        showReducedMotion,
        showReadingGuide,
        showLofiMode,
        eyeComfortColor,
        eyeComfortStrength,
        showColorTone,
        showCursorTrail,
        showCelebrate,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const launcherRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLElement>(null)
    const [open, setOpen] = useState(() => previewMode !== "closed")
    const [detectedDark, setDetectedDark] = useState(() => shouldUseDarkPanel())
    const [guideY, setGuideY] = useState(0)
    const [settings, setSettings] = useState<Settings>(() =>
        readInitialSettings(previewMode)
    )

    const positionStyle = useMemo(
        () => ({ [side]: offsetX, [vertical]: offsetY, zIndex }),
        [offsetX, offsetY, side, vertical, zIndex]
    )

    const darkPanel =
        appearance === "dark" || (appearance === "auto" && detectedDark)
    const theme = darkPanel ? darkPanelTheme : lightPanelTheme

    const readabilityVisible =
        showDyslexiaFont ||
        showTextSize ||
        showTextSpacing ||
        showReducedMotion ||
        showReadingGuide
    const extrasVisible =
        showLofiMode || showColorTone || showCursorTrail || showCelebrate

    useEffect(() => {
        ensureGlobalStyles()
        return () => removeGlobalEffects()
    }, [])

    useEffect(() => {
        if (previewMode === "closed") {
            setOpen(false)
            setSettings(readSettings())
            return
        }

        setOpen(true)
        setSettings(previewMode === "demo" ? DEMO_SETTINGS : readSettings())
    }, [previewMode])

    useEffect(() => {
        if (previewMode === "demo") return
        if (typeof window === "undefined") return
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
        } catch {
            // The component remains functional when storage is unavailable.
        }
    }, [previewMode, settings])

    useEffect(() => {
        if (typeof document === "undefined") return

        let frame = 0
        const updateTheme = () => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(() =>
                setDetectedDark(shouldUseDarkPanel())
            )
        }
        const onThemeChange = (event: Event) => {
            const nextTheme = (event as CustomEvent<{ theme?: SiteTheme }>)
                .detail?.theme
            if (nextTheme === "dark" || nextTheme === "light") {
                setDetectedDark(nextTheme === "dark")
                return
            }
            updateTheme()
        }
        const onStorage = (event: StorageEvent) => {
            if (
                event.key === SITE_THEME_STORAGE_KEY &&
                (event.newValue === "dark" || event.newValue === "light")
            ) {
                setDetectedDark(event.newValue === "dark")
            }
        }

        updateTheme()
        window.addEventListener("themechange", onThemeChange)
        window.addEventListener("framer-theme-change", onThemeChange)
        window.addEventListener("storage", onStorage)
        const observer = new MutationObserver(updateTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: [
                "class",
                "style",
                "data-site-theme",
                "data-theme",
                "data-framer-theme",
                "data-color-mode",
            ],
        })
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: [
                "class",
                "style",
                "data-site-theme",
                "data-theme",
                "data-framer-theme",
                "data-color-mode",
            ],
        })

        return () => {
            window.cancelAnimationFrame(frame)
            window.removeEventListener("themechange", onThemeChange)
            window.removeEventListener("framer-theme-change", onThemeChange)
            window.removeEventListener("storage", onStorage)
            observer.disconnect()
        }
    }, [])

    useEffect(() => {
        if (typeof document === "undefined" || isCanvas) return

        let frame = 0
        const apply = () => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(() =>
                applyTargetClasses(targetName, settings)
            )
        }

        apply()
        const observer = new MutationObserver(apply)
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-framer-name", "data-name", "aria-label"],
        })

        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
            clearTargetClasses()
        }
    }, [isCanvas, settings, targetName])

    useEffect(() => {
        if (typeof document === "undefined" || isCanvas) return

        let frame = 0
        const apply = () => {
            window.cancelAnimationFrame(frame)
            frame = window.requestAnimationFrame(() =>
                applyTextScale(settings.textScale / 100, targetName)
            )
        }

        apply()
        const observer = new MutationObserver(apply)
        observer.observe(document.body, { childList: true, subtree: true })

        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
            restoreTextScale()
        }
    }, [isCanvas, settings.textScale, targetName])

    useEffect(() => {
        if (typeof window === "undefined" || isCanvas || !settings.cursorTrail)
            return

        let last = 0
        const onPointerMove = (event: PointerEvent) => {
            const now = performance.now()
            if (now - last < 32) return
            last = now
            spawnTrailDot(event.clientX, event.clientY, accent)
        }

        window.addEventListener("pointermove", onPointerMove, { passive: true })
        return () => window.removeEventListener("pointermove", onPointerMove)
    }, [accent, isCanvas, settings.cursorTrail])

    useEffect(() => {
        if (typeof window === "undefined" || isCanvas || !settings.readingGuide)
            return

        const onPointerMove = (event: PointerEvent) => setGuideY(event.clientY)
        setGuideY(Math.round(window.innerHeight / 2))
        window.addEventListener("pointermove", onPointerMove, { passive: true })
        return () => window.removeEventListener("pointermove", onPointerMove)
    }, [isCanvas, settings.readingGuide])

    useEffect(() => {
        if (!open || typeof document === "undefined") return

        const focusableSelector =
            'button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault()
                closePanel()
                return
            }

            if (event.key !== "Tab" || !panelRef.current) return
            const focusable = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(
                    focusableSelector
                )
            )
            if (!focusable.length) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node
            if (
                panelRef.current?.contains(target) ||
                launcherRef.current?.contains(target)
            )
                return
            closePanel(false)
        }

        document.addEventListener("keydown", onKeyDown)
        document.addEventListener("pointerdown", onPointerDown)
        window.requestAnimationFrame(() => {
            panelRef.current
                ?.querySelector<HTMLElement>(focusableSelector)
                ?.focus()
        })

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.removeEventListener("pointerdown", onPointerDown)
        }
    }, [open])

    const setPartial = (partial: Partial<Settings>) => {
        setSettings((current) => ({ ...current, ...partial }))
    }

    const closePanel = (returnFocus = true) => {
        setOpen(false)
        if (returnFocus)
            window.requestAnimationFrame(() => launcherRef.current?.focus())
    }

    const resetAll = () => {
        restoreTextScale()
        setSettings(DEFAULT_SETTINGS)
    }

    const celebrate = () => {
        if (typeof window === "undefined" || typeof document === "undefined")
            return
        for (let index = 0; index < 36; index += 1) {
            window.setTimeout(() => spawnCelebrationItem(accent), index * 38)
        }
    }

    return (
        <div
            {...{ [WIDGET_ATTR]: "true" }}
            style={{ ...widgetStyle, ...positionStyle }}
        >
            {settings.lofiMode && !isCanvas && (
                <div
                    aria-hidden="true"
                    style={{
                        ...eyeComfortShieldStyle,
                        background: eyeComfortColor,
                        opacity: eyeComfortStrength,
                    }}
                />
            )}

            {settings.readingGuide && !isCanvas && (
                <div
                    aria-hidden="true"
                    style={{
                        ...readingGuideStyle,
                        top: guideY,
                        borderColor: accent,
                    }}
                />
            )}

            <button
                ref={launcherRef}
                type="button"
                aria-label={
                    open
                        ? "Close readability controls"
                        : "Open readability controls"
                }
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={() => (open ? closePanel() : setOpen(true))}
                style={{
                    ...launcherStyle,
                    background: theme.panel,
                    borderColor: accent,
                    color: theme.text,
                    boxShadow: theme.shadow,
                }}
            >
                <span aria-hidden="true" style={launcherIconStyle}>
                    Aa
                </span>
            </button>

            {open && (
                <section
                    ref={panelRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={panelTitle}
                    style={{
                        ...panelStyle,
                        background: theme.panel,
                        color: theme.text,
                        borderColor: theme.borderStrong,
                        boxShadow: theme.shadow,
                        [side]: 0,
                        top: vertical === "top" ? 44 : "auto",
                        bottom: vertical === "bottom" ? 44 : "auto",
                    }}
                >
                    <header
                        style={{
                            ...panelHeaderStyle,
                            borderBottomColor: theme.border,
                        }}
                    >
                        <span
                            style={{ ...panelTitleStyle, color: theme.muted }}
                        >
                            {panelTitle}
                        </span>
                        <button
                            type="button"
                            aria-label="Close readability controls"
                            onClick={() => closePanel()}
                            style={{ ...closeButtonStyle, color: theme.muted }}
                        >
                            ×
                        </button>
                    </header>

                    <div style={panelContentStyle}>
                        {readabilityVisible && (
                            <SectionHeader label="Readability" theme={theme} />
                        )}

                        {showDyslexiaFont && (
                            <PanelRow
                                icon="T"
                                label="Readable Font"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.dyslexiaFont}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            dyslexiaFont:
                                                !settings.dyslexiaFont,
                                        })
                                    }
                                    label="Toggle readable font"
                                />
                            </PanelRow>
                        )}

                        {showTextSize && (
                            <PanelRow icon="A" label="Text Size" theme={theme}>
                                <div
                                    style={sizeControlStyle}
                                    aria-label="Text size controls"
                                >
                                    <MiniButton
                                        label="Decrease text size"
                                        theme={theme}
                                        onClick={() =>
                                            setPartial({
                                                textScale: Math.max(
                                                    80,
                                                    settings.textScale - 10
                                                ),
                                            })
                                        }
                                    >
                                        A-
                                    </MiniButton>
                                    <span
                                        style={{
                                            ...sizeValueStyle,
                                            color: theme.muted,
                                        }}
                                    >
                                        {settings.textScale}
                                    </span>
                                    <MiniButton
                                        label="Increase text size"
                                        theme={theme}
                                        onClick={() =>
                                            setPartial({
                                                textScale: Math.min(
                                                    140,
                                                    settings.textScale + 10
                                                ),
                                            })
                                        }
                                    >
                                        A+
                                    </MiniButton>
                                </div>
                            </PanelRow>
                        )}

                        {showTextSpacing && (
                            <PanelRow
                                icon="↔"
                                label="Text Spacing"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.textSpacing}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            textSpacing: !settings.textSpacing,
                                        })
                                    }
                                    label="Toggle text spacing"
                                />
                            </PanelRow>
                        )}

                        {showReducedMotion && (
                            <PanelRow
                                icon="M"
                                label="Reduce Motion"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.reducedMotion}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            reducedMotion:
                                                !settings.reducedMotion,
                                        })
                                    }
                                    label="Toggle reduced motion"
                                />
                            </PanelRow>
                        )}

                        {showReadingGuide && (
                            <PanelRow
                                icon="—"
                                label="Reading Guide"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.readingGuide}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            readingGuide:
                                                !settings.readingGuide,
                                        })
                                    }
                                    label="Toggle reading guide"
                                />
                            </PanelRow>
                        )}

                        {extrasVisible && (
                            <SectionHeader label="Fun & Focus" theme={theme} />
                        )}

                        {showLofiMode && (
                            <PanelRow
                                icon="◐"
                                label="Eye Comfort"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.lofiMode}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            lofiMode: !settings.lofiMode,
                                        })
                                    }
                                    label="Toggle eye comfort shield"
                                />
                            </PanelRow>
                        )}

                        {showColorTone && (
                            <PanelRow icon="O" label="Color Tone" theme={theme}>
                                <select
                                    value={settings.tone}
                                    onChange={(event) =>
                                        setPartial({
                                            tone: event.target.value as Tone,
                                        })
                                    }
                                    style={{
                                        ...selectStyle,
                                        background: theme.control,
                                        color: theme.text,
                                        borderColor: theme.borderStrong,
                                    }}
                                    aria-label="Adaptive color tone"
                                >
                                    {Object.entries(toneLabels).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </PanelRow>
                        )}

                        {showCursorTrail && (
                            <PanelRow
                                icon="·"
                                label="Cursor Trail"
                                theme={theme}
                            >
                                <Toggle
                                    checked={settings.cursorTrail}
                                    accent={accent}
                                    theme={theme}
                                    onClick={() =>
                                        setPartial({
                                            cursorTrail: !settings.cursorTrail,
                                        })
                                    }
                                    label="Toggle cursor trail"
                                />
                            </PanelRow>
                        )}

                        {showCelebrate && (
                            <PanelRow icon="*" label="Celebrate" theme={theme}>
                                <button
                                    type="button"
                                    aria-label="Launch celebration"
                                    onClick={celebrate}
                                    style={{
                                        ...celebrateButtonStyle,
                                        background: theme.control,
                                        color: accent,
                                    }}
                                >
                                    🎉
                                </button>
                            </PanelRow>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={resetAll}
                        style={{
                            ...resetButtonStyle,
                            background: theme.panel,
                            color: theme.muted,
                            borderTopColor: theme.border,
                        }}
                    >
                        Reset All
                    </button>
                </section>
            )}
        </div>
    )
}

addPropertyControls(ReadabilityFunWidget, {
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#0057ff",
    },
    panelTitle: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Readability & Fun",
    },
    targetName: {
        type: ControlType.String,
        title: "Target Name",
        defaultValue: DEFAULT_TARGET_NAME,
        placeholder: DEFAULT_TARGET_NAME,
    },
    appearance: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["auto", "light", "dark"],
        optionTitles: ["Auto", "Light", "Dark"],
        defaultValue: "auto",
        displaySegmentedControl: true,
    },
    previewMode: {
        type: ControlType.Enum,
        title: "Preview",
        options: ["closed", "open", "demo"],
        optionTitles: ["Closed", "Open Panel", "Demo Active"],
        defaultValue: "closed",
    },
    side: {
        type: ControlType.Enum,
        title: "Side",
        options: ["left", "right"],
        optionTitles: ["Left", "Right"],
        defaultValue: "right",
        displaySegmentedControl: true,
    },
    vertical: {
        type: ControlType.Enum,
        title: "Vertical",
        options: ["top", "bottom"],
        optionTitles: ["Top", "Bottom"],
        defaultValue: "top",
        displaySegmentedControl: true,
    },
    offsetX: {
        type: ControlType.Number,
        title: "X Offset",
        defaultValue: 24,
        min: 0,
        max: 120,
        step: 1,
    },
    offsetY: {
        type: ControlType.Number,
        title: "Y Offset",
        defaultValue: 24,
        min: 0,
        max: 160,
        step: 1,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Z Index",
        defaultValue: 2147483000,
        min: 1,
        max: 2147483000,
        step: 1,
    },
    showDyslexiaFont: featureControl("Readable Font"),
    showTextSize: featureControl("Text Size"),
    showTextSpacing: featureControl("Text Spacing"),
    showReducedMotion: featureControl("Reduce Motion"),
    showReadingGuide: featureControl("Reading Guide"),
    showLofiMode: featureControl("Eye Comfort"),
    eyeComfortColor: {
        type: ControlType.Color,
        title: "Comfort Tint",
        defaultValue: "#ffb347",
        hidden: (controlProps: Partial<Props>) => !controlProps.showLofiMode,
    },
    eyeComfortStrength: {
        type: ControlType.Number,
        title: "Tint Strength",
        defaultValue: 0.18,
        min: 0.08,
        max: 0.35,
        step: 0.01,
        hidden: (controlProps: Partial<Props>) => !controlProps.showLofiMode,
    },
    showColorTone: featureControl("Color Tone"),
    showCursorTrail: featureControl("Cursor Trail"),
    showCelebrate: featureControl("Celebrate"),
})

function featureControl(title: string) {
    return {
        type: ControlType.Boolean,
        title,
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    } as const
}

function SectionHeader({ label, theme }: { label: string; theme: any }) {
    return (
        <div
            style={{
                ...sectionHeaderStyle,
                color: theme.muted,
                borderBottomColor: theme.border,
            }}
        >
            {label}
        </div>
    )
}

function PanelRow({
    icon,
    label,
    children,
    theme,
}: {
    icon: string
    label: string
    children: any
    theme: any
}) {
    return (
        <div style={{ ...rowStyle, borderBottomColor: theme.border }}>
            <span
                aria-hidden="true"
                style={{ ...rowIconStyle, color: theme.muted }}
            >
                {icon}
            </span>
            <span style={{ ...rowLabelStyle, color: theme.text }}>{label}</span>
            <div style={rowActionStyle}>{children}</div>
        </div>
    )
}

function Toggle({
    checked,
    accent,
    label,
    onClick,
    theme,
}: {
    checked: boolean
    accent: string
    label: string
    onClick: () => void
    theme: any
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onClick}
            style={{
                ...toggleStyle,
                background: checked ? accent : theme.toggleOff,
            }}
        >
            <span
                style={{
                    ...knobStyle,
                    background: checked ? "#ffffff" : theme.toggleKnob,
                    transform: checked ? "translateX(15px)" : "translateX(0)",
                }}
            />
        </button>
    )
}

function MiniButton({
    label,
    theme,
    onClick,
    children,
}: {
    label: string
    theme: any
    onClick: () => void
    children: any
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            style={{ ...miniButtonStyle, color: theme.text }}
        >
            {children}
        </button>
    )
}

function readSettings(): Settings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS

    try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved) return sanitizeSettings(JSON.parse(saved))

        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY)
        if (!legacy) return DEFAULT_SETTINGS
        return sanitizeSettings(JSON.parse(legacy))
    } catch {
        return DEFAULT_SETTINGS
    }
}

function readInitialSettings(previewMode: PreviewMode): Settings {
    return previewMode === "demo" ? DEMO_SETTINGS : readSettings()
}

function sanitizeSettings(value: any): Settings {
    const textScale = Number(value?.textScale)
    const tone = value?.tone
    return {
        dyslexiaFont: Boolean(value?.dyslexiaFont),
        textScale: Number.isFinite(textScale)
            ? Math.min(140, Math.max(80, textScale))
            : 100,
        textSpacing: Boolean(value?.textSpacing),
        reducedMotion: Boolean(value?.reducedMotion),
        readingGuide: Boolean(value?.readingGuide),
        tone:
            tone === "warm" || tone === "cool" || tone === "mono"
                ? tone
                : "normal",
        lofiMode: Boolean(value?.lofiMode),
        cursorTrail: Boolean(value?.cursorTrail),
    }
}

function readStoredSiteTheme(key: string): SiteTheme | null {
    if (typeof window === "undefined") return null

    try {
        const value = window.localStorage.getItem(key)
        return value === "dark" || value === "light" ? value : null
    } catch {
        return null
    }
}

function readSavedSiteTheme(): SiteTheme | null {
    const saved = readStoredSiteTheme(SITE_THEME_STORAGE_KEY)
    if (saved) return saved

    for (const key of LEGACY_SITE_THEME_STORAGE_KEYS) {
        const legacyTheme = readStoredSiteTheme(key)
        if (legacyTheme) return legacyTheme
    }

    return null
}

function readThemeFromElement(
    element: HTMLElement | null | undefined
): SiteTheme | null {
    if (!element) return null

    const themeText = [
        element.dataset.siteTheme,
        element.dataset.theme,
        element.dataset.framerTheme,
        element.dataset.colorMode,
        element.getAttribute("data-site-theme"),
        element.getAttribute("data-theme"),
        element.getAttribute("data-framer-theme"),
        element.getAttribute("data-color-mode"),
        element.className,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

    if (themeText.includes("dark")) return "dark"
    if (themeText.includes("light")) return "light"

    return null
}

function removeGlobalEffects() {
    if (typeof document === "undefined") return
    clearTargetClasses()
    restoreTextScale()
    document
        .querySelectorAll(".rf-trail-dot,.rf-celebration-item")
        .forEach((node) => node.remove())
}

function shouldUseDarkPanel() {
    if (typeof window === "undefined" || typeof document === "undefined")
        return false

    const savedTheme = readSavedSiteTheme()
    if (savedTheme) return savedTheme === "dark"

    const elementTheme =
        readThemeFromElement(document.documentElement) ||
        readThemeFromElement(document.body)
    if (elementTheme) return elementTheme === "dark"

    const background = findVisibleBackground(document.elementFromPoint(8, 8))
    const match = background.match(/\d+(\.\d+)?/g)
    if (!match || match.length < 3) return false
    const [r, g, b] = match.map(Number)
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45
}

function findVisibleBackground(element: Element | null) {
    if (typeof window === "undefined") return ""
    let current = element
    while (current) {
        const color = window.getComputedStyle(current).backgroundColor
        if (color && color !== "transparent" && !color.endsWith(", 0)"))
            return color
        current = current.parentElement
    }
    return window.getComputedStyle(document.body).backgroundColor
}

function ensureGlobalStyles() {
    if (typeof document === "undefined") return

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
        style = document.createElement("style")
        style.id = STYLE_ID
        document.head.appendChild(style)
    }

    style.textContent = GLOBAL_STYLES
}

function applyTargetClasses(targetName: string, settings: Settings) {
    if (typeof document === "undefined") return

    clearTargetClasses()

    const target = findTargetElement(targetName)
    if (!target) return

    target.classList.add(TARGET_CLASS)
    target.classList.toggle("rf-dyslexia-font", settings.dyslexiaFont)
    target.classList.toggle("rf-text-spacing", settings.textSpacing)
    target.classList.toggle("rf-reduced-motion", settings.reducedMotion)
    target.classList.toggle("rf-tone-warm", settings.tone === "warm")
    target.classList.toggle("rf-tone-cool", settings.tone === "cool")
    target.classList.toggle("rf-tone-mono", settings.tone === "mono")
}

function clearTargetClasses() {
    if (typeof document === "undefined") return
    document
        .querySelectorAll<HTMLElement>(`.${TARGET_CLASS}`)
        .forEach((element) => {
            element.classList.remove(...TARGET_CLASSES)
        })
}

function findTargetElement(targetName: string) {
    if (typeof document === "undefined") return null

    const name = targetName.trim()
    if (!name) return null

    const escapedName = escapeSelectorValue(name)
    const selectors = [
        `[data-framer-name="${escapedName}"]`,
        `[data-name="${escapedName}"]`,
        `[aria-label="${escapedName}"]`,
    ].join(",")

    const target = document.querySelector<HTMLElement>(selectors)
    if (!target || target.closest(`[${WIDGET_ATTR}]`)) return null
    return target
}

function escapeSelectorValue(value: string) {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}

function applyTextScale(scale: number, targetName: string) {
    if (typeof document === "undefined") return

    const target = findTargetElement(targetName)
    if (!target) {
        restoreTextScale()
        return
    }

    const elements = Array.from(
        target.querySelectorAll<HTMLElement>(TEXT_SELECTORS)
    )
    for (const element of elements) {
        if (element.closest(`[${WIDGET_ATTR}]`)) continue

        if (scale === 1) {
            restoreElementFontSize(element)
            continue
        }

        if (!element.dataset.rfBaseFontSize) {
            element.dataset.rfBaseFontSize =
                window.getComputedStyle(element).fontSize
            element.dataset.rfOriginalFontSize =
                element.style.fontSize || "__none__"
        }

        const base = parseFloat(element.dataset.rfBaseFontSize || "")
        if (Number.isFinite(base))
            element.style.fontSize = `${Math.round(base * scale * 100) / 100}px`
    }
}

function restoreTextScale() {
    if (typeof document === "undefined") return
    document
        .querySelectorAll<HTMLElement>("[data-rf-base-font-size]")
        .forEach(restoreElementFontSize)
}

function restoreElementFontSize(element: HTMLElement) {
    const original = element.dataset.rfOriginalFontSize
    if (original === "__none__") element.style.removeProperty("font-size")
    else if (original) element.style.fontSize = original
    delete element.dataset.rfBaseFontSize
    delete element.dataset.rfOriginalFontSize
}

function spawnTrailDot(x: number, y: number, accent: string) {
    if (typeof document === "undefined") return
    const dot = document.createElement("span")
    dot.className = "rf-trail-dot"
    dot.style.left = `${x}px`
    dot.style.top = `${y}px`
    dot.style.background = accent
    document.body.appendChild(dot)
    window.setTimeout(() => dot.remove(), 700)
}

function spawnCelebrationItem(accent: string) {
    if (typeof document === "undefined") return
    const items = ["🎉", "✨", "⭐", "🎊", "💫", "🥳"]
    const item = document.createElement("span")
    item.className = "rf-celebration-item"
    item.textContent = items[Math.floor(Math.random() * items.length)]
    item.style.left = `${Math.random() * 96 + 2}vw`
    item.style.color = Math.random() > 0.5 ? accent : "#111111"
    item.style.setProperty("--rf-drift", `${Math.random() * 160 - 80}px`)
    item.style.setProperty("--rf-rotate", `${Math.random() * 220 - 110}deg`)
    document.body.appendChild(item)
    window.setTimeout(() => item.remove(), 2100)
}

const GLOBAL_STYLES = `
[data-readability-fun-widget] :where(button,select):focus-visible {
    outline: 2px solid currentColor !important;
    outline-offset: 2px !important;
}
.rf-readability-target.rf-dyslexia-font :where(p,h1,h2,h3,h4,h5,h6,span,a,button,label,li,td,th,blockquote,figcaption,input,textarea,select):not([data-readability-fun-widget] *) {
    font-family: "OpenDyslexic", "Atkinson Hyperlegible", Verdana, Arial, sans-serif !important;
    line-height: 1.55 !important;
}
.rf-readability-target.rf-text-spacing :where(p,h1,h2,h3,h4,h5,h6,span,a,button,label,li,td,th,blockquote,figcaption,input,textarea,select):not([data-readability-fun-widget] *) {
    letter-spacing: 0.05em !important;
    word-spacing: 0.12em !important;
    line-height: 1.7 !important;
}
.rf-readability-target.rf-reduced-motion :where(*):not([data-readability-fun-widget]):not([data-readability-fun-widget] *) {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
}
.rf-readability-target.rf-tone-warm { filter: sepia(0.18) saturate(0.9) brightness(1.04); }
.rf-readability-target.rf-tone-cool { filter: hue-rotate(178deg) saturate(0.82) brightness(1.02); }
.rf-readability-target.rf-tone-mono { filter: grayscale(1) contrast(1.08); }
.rf-trail-dot {
    position: fixed; width: 10px; height: 10px; border-radius: 999px;
    pointer-events: none; z-index: 2147483647;
    animation: rf-trail-fade 620ms ease-out forwards;
}
.rf-celebration-item {
    position: fixed; top: -32px; pointer-events: none; z-index: 2147483647;
    font: 700 18px/1.1 Inter, Arial, sans-serif;
    animation: rf-celebrate-fall 1800ms cubic-bezier(.2,.72,.26,1) forwards;
}
@keyframes rf-trail-fade {
    from { opacity: .9; transform: translate(-50%,-50%) scale(1); }
    to { opacity: 0; transform: translate(-50%,-50%) scale(.15); }
}
@keyframes rf-celebrate-fall {
    0% { opacity: 0; transform: translate3d(0,-20px,0) rotate(0deg); }
    12% { opacity: 1; }
    100% { opacity: 0; transform: translate3d(var(--rf-drift),110vh,0) rotate(var(--rf-rotate)); }
}
@media (prefers-reduced-motion: reduce) {
    .rf-trail-dot,.rf-celebration-item { animation-duration: 1ms; }
}
`

const widgetStyle = {
    position: "fixed",
    fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif",
} as const

const launcherStyle = {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    borderRadius: 999,
    border: "2px solid",
    cursor: "inherit",
} as const

const launcherIconStyle = {
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0,
} as const

const panelStyle = {
    position: "absolute",
    width: 222,
    height: 370,
    maxWidth: "calc(100vw - 24px)",
    maxHeight: "calc(100vh - 64px)",
    border: "1px solid",
    borderRadius: 8,
    boxSizing: "border-box",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "40px minmax(0,1fr) 36px",
} as const

const panelHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px 0 14px",
    borderBottom: "1px solid",
} as const

const panelTitleStyle = {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1.35,
    textTransform: "uppercase",
} as const

const closeButtonStyle = {
    width: 28,
    height: 28,
    border: 0,
    background: "transparent",
    borderRadius: 6,
    padding: 0,
    fontSize: 20,
    lineHeight: 1,
    cursor: "inherit",
} as const

const panelContentStyle = {
    minHeight: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollbarWidth: "thin",
} as const

const sectionHeaderStyle = {
    height: 30,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    borderBottom: "1px solid",
    boxSizing: "border-box",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
} as const

const rowStyle = {
    height: 40,
    display: "grid",
    gridTemplateColumns: "18px minmax(0,1fr) auto",
    alignItems: "center",
    gap: 8,
    padding: "0 12px",
    borderBottom: "1px solid",
    boxSizing: "border-box",
} as const

const rowIconStyle = {
    width: 16,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
} as const
const rowLabelStyle = {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 11,
    fontWeight: 700,
} as const
const rowActionStyle = {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
} as const

const toggleStyle = {
    width: 34,
    height: 20,
    padding: 2,
    border: 0,
    borderRadius: 999,
    cursor: "inherit",
} as const
const knobStyle = {
    display: "block",
    width: 16,
    height: 16,
    borderRadius: 999,
    transition: "transform 140ms ease",
} as const

const sizeControlStyle = {
    display: "grid",
    gridTemplateColumns: "22px 28px 22px",
    alignItems: "center",
    gap: 3,
} as const
const miniButtonStyle = {
    border: 0,
    background: "transparent",
    fontSize: 10,
    fontWeight: 800,
    cursor: "inherit",
    padding: 0,
} as const
const sizeValueStyle = {
    textAlign: "center",
    fontSize: 9,
    fontWeight: 600,
} as const

const selectStyle = {
    width: 68,
    height: 26,
    border: "1px solid",
    borderRadius: 7,
    padding: "0 5px",
    fontSize: 9,
    fontWeight: 700,
} as const

const celebrateButtonStyle = {
    width: 28,
    height: 26,
    border: "1px solid currentColor",
    borderRadius: 7,
    padding: 0,
    fontSize: 12,
    cursor: "inherit",
} as const

const resetButtonStyle = {
    width: "100%",
    height: 36,
    border: 0,
    borderTop: "1px solid",
    fontSize: 10,
    fontWeight: 700,
    cursor: "inherit",
} as const

const eyeComfortShieldStyle = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100vh",
    zIndex: -2,
    pointerEvents: "none",
    backdropFilter: "saturate(0.78) brightness(0.93)",
    WebkitBackdropFilter: "saturate(0.78) brightness(0.93)",
} as const

const readingGuideStyle = {
    position: "fixed",
    left: 0,
    width: "100vw",
    height: 34,
    transform: "translateY(-50%)",
    borderTop: "2px solid",
    borderBottom: "2px solid",
    boxShadow:
        "0 -100vh 0 100vh rgba(0,0,0,.12), 0 100vh 0 100vh rgba(0,0,0,.12)",
    pointerEvents: "none",
    zIndex: -1,
    boxSizing: "border-box",
} as const

const lightPanelTheme = {
    panel: "#ffffff",
    text: "#111111",
    muted: "#666666",
    border: "rgba(0,0,0,.1)",
    borderStrong: "rgba(0,0,0,.18)",
    control: "#ffffff",
    toggleOff: "#e3e3e3",
    toggleKnob: "#666666",
    shadow: "0 16px 38px rgba(0,0,0,.16)",
}

const darkPanelTheme = {
    panel: "#141414",
    text: "#f5f5f5",
    muted: "#a7a7a7",
    border: "rgba(255,255,255,.12)",
    borderStrong: "rgba(255,255,255,.22)",
    control: "#1f1f1f",
    toggleOff: "#333333",
    toggleKnob: "#a7a7a7",
    shadow: "0 18px 42px rgba(0,0,0,.38)",
}
