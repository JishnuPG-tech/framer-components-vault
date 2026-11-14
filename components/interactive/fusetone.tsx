/*
FuseTone for Framer
Product and integration © 2026 InterFuse Agency

This file includes sound-engine code adapted from Cuelume.
The original engine remains available under the MIT License below.

MIT License

Copyright (c) 2026 Daniel Belyi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
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

type SoundName =
    | "chime"
    | "sparkle"
    | "droplet"
    | "bloom"
    | "whisper"
    | "tick"
    | "press"
    | "release"
    | "toggle"
    | "success"
    | "error"
    | "page"
    | "loading"
    | "ready"
    | "pulse"
    | "scan"
    | "arrival"
type Cue = SoundName | "none"
type ToneLayer = {
    kind: "tone"
    waveform: OscillatorType
    frequency: number
    offset?: number
    attack: number
    decay: number
    peak: number
    detune?: number
    glideTo?: number
    glideTime?: number
}
type NoiseLayer = {
    kind: "noise"
    filterType: BiquadFilterType
    filterFrequency: number
    filterQ?: number
    offset?: number
    attack: number
    decay: number
    peak: number
}
type SoundLayer = ToneLayer | NoiseLayer
type Shimmer = {
    delay: number
    feedback: number
    wet: number
    lowpass: number
}
type SoundRecipe = {
    masterGain: number
    layers: SoundLayer[]
    shimmer?: Shimmer
}
const RECIPES: Record<SoundName, SoundRecipe> = {
    chime: {
        masterGain: 0.5,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1046.5,
                attack: 0.006,
                decay: 0.22,
                peak: 0.09,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1568,
                offset: 0.09,
                attack: 0.006,
                decay: 0.26,
                peak: 0.08,
            },
        ],
        shimmer: {
            delay: 0.12,
            feedback: 0.25,
            wet: 0.18,
            lowpass: 4000,
        },
    },
    sparkle: {
        masterGain: 0.5,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1760,
                attack: 0.003,
                decay: 0.09,
                peak: 0.045,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 2217,
                offset: 0.045,
                attack: 0.003,
                decay: 0.09,
                peak: 0.04,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 2637,
                offset: 0.09,
                attack: 0.003,
                decay: 0.1,
                peak: 0.038,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 3520,
                offset: 0.135,
                attack: 0.003,
                decay: 0.12,
                peak: 0.032,
            },
        ],
        shimmer: {
            delay: 0.07,
            feedback: 0.35,
            wet: 0.22,
            lowpass: 6000,
        },
    },
    droplet: {
        masterGain: 0.55,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1200,
                glideTo: 550,
                glideTime: 0.14,
                attack: 0.004,
                decay: 0.2,
                peak: 0.075,
            },
        ],
        shimmer: {
            delay: 0.09,
            feedback: 0.2,
            wet: 0.15,
            lowpass: 3000,
        },
    },
    bloom: {
        masterGain: 0.5,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 528,
                attack: 0.06,
                decay: 0.32,
                peak: 0.06,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 528,
                detune: 12,
                attack: 0.06,
                decay: 0.34,
                peak: 0.05,
            },
        ],
        shimmer: {
            delay: 0.15,
            feedback: 0.2,
            wet: 0.12,
            lowpass: 2500,
        },
    },
    whisper: {
        masterGain: 0.5,
        layers: [
            {
                kind: "noise",
                filterType: "lowpass",
                filterFrequency: 1200,
                filterQ: 0.7,
                attack: 0.04,
                decay: 0.16,
                peak: 0.05,
            },
        ],
    },
    tick: {
        masterGain: 0.4,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 5400,
                filterQ: 1.8,
                attack: 0.001,
                decay: 0.018,
                peak: 0.14,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 2600,
                attack: 0.001,
                decay: 0.012,
                peak: 0.018,
            },
        ],
    },
    press: {
        masterGain: 0.4,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 1700,
                filterQ: 1.4,
                attack: 0.001,
                decay: 0.02,
                peak: 0.13,
            },
        ],
    },
    release: {
        masterGain: 0.4,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 4600,
                filterQ: 1.8,
                attack: 0.001,
                decay: 0.016,
                peak: 0.12,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 3200,
                offset: 0.006,
                attack: 0.001,
                decay: 0.05,
                peak: 0.02,
            },
        ],
    },
    toggle: {
        masterGain: 0.4,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 2200,
                filterQ: 1.6,
                attack: 0.001,
                decay: 0.016,
                peak: 0.12,
            },
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 3800,
                filterQ: 1.6,
                offset: 0.024,
                attack: 0.001,
                decay: 0.02,
                peak: 0.1,
            },
        ],
    },
    success: {
        masterGain: 0.5,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 880,
                attack: 0.004,
                decay: 0.09,
                peak: 0.06,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1108.73,
                offset: 0.06,
                attack: 0.004,
                decay: 0.1,
                peak: 0.06,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1318.51,
                offset: 0.12,
                attack: 0.004,
                decay: 0.18,
                peak: 0.07,
            },
        ],
        shimmer: {
            delay: 0.1,
            feedback: 0.22,
            wet: 0.16,
            lowpass: 4500,
        },
    },
    error: {
        masterGain: 0.42,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 850,
                filterQ: 1.1,
                attack: 0.001,
                decay: 0.035,
                peak: 0.13,
            },
            {
                kind: "tone",
                waveform: "triangle",
                frequency: 440,
                offset: 0.025,
                attack: 0.004,
                decay: 0.09,
                peak: 0.045,
            },
            {
                kind: "tone",
                waveform: "triangle",
                frequency: 349.23,
                offset: 0.1,
                attack: 0.004,
                decay: 0.14,
                peak: 0.04,
            },
        ],
    },
    page: {
        masterGain: 0.38,
        layers: [
            {
                kind: "noise",
                filterType: "lowpass",
                filterFrequency: 1800,
                filterQ: 0.7,
                attack: 0.006,
                decay: 0.08,
                peak: 0.11,
            },
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 4200,
                filterQ: 1.2,
                offset: 0.04,
                attack: 0.004,
                decay: 0.065,
                peak: 0.08,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 2400,
                offset: 0.075,
                attack: 0.002,
                decay: 0.045,
                peak: 0.02,
            },
        ],
    },
    loading: {
        masterGain: 0.42,
        layers: [
            {
                kind: "noise",
                filterType: "lowpass",
                filterFrequency: 1400,
                filterQ: 0.6,
                attack: 0.035,
                decay: 0.14,
                peak: 0.035,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 420,
                glideTo: 630,
                glideTime: 0.18,
                attack: 0.025,
                decay: 0.18,
                peak: 0.05,
            },
        ],
        shimmer: {
            delay: 0.11,
            feedback: 0.18,
            wet: 0.12,
            lowpass: 2800,
        },
    },
    ready: {
        masterGain: 0.45,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 3200,
                filterQ: 1.7,
                attack: 0.001,
                decay: 0.018,
                peak: 0.1,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 659.25,
                offset: 0.025,
                attack: 0.012,
                decay: 0.2,
                peak: 0.05,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 987.77,
                offset: 0.025,
                attack: 0.012,
                decay: 0.22,
                peak: 0.035,
            },
        ],
        shimmer: {
            delay: 0.13,
            feedback: 0.2,
            wet: 0.13,
            lowpass: 3600,
        },
    },
    pulse: {
        masterGain: 0.42,
        layers: [
            {
                kind: "noise",
                filterType: "bandpass",
                filterFrequency: 2600,
                filterQ: 2.4,
                attack: 0.001,
                decay: 0.022,
                peak: 0.08,
            },
            {
                kind: "tone",
                waveform: "triangle",
                frequency: 620,
                glideTo: 1240,
                glideTime: 0.07,
                attack: 0.002,
                decay: 0.085,
                peak: 0.055,
            },
        ],
    },
    scan: {
        masterGain: 0.4,
        layers: [
            {
                kind: "tone",
                waveform: "sine",
                frequency: 740,
                attack: 0.002,
                decay: 0.055,
                peak: 0.05,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1110,
                offset: 0.045,
                attack: 0.002,
                decay: 0.055,
                peak: 0.045,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 1665,
                offset: 0.09,
                attack: 0.002,
                decay: 0.07,
                peak: 0.04,
            },
        ],
        shimmer: {
            delay: 0.065,
            feedback: 0.16,
            wet: 0.1,
            lowpass: 4200,
        },
    },
    arrival: {
        masterGain: 0.44,
        layers: [
            {
                kind: "noise",
                filterType: "lowpass",
                filterFrequency: 900,
                filterQ: 0.8,
                attack: 0.05,
                decay: 0.24,
                peak: 0.035,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 220,
                glideTo: 440,
                glideTime: 0.32,
                attack: 0.04,
                decay: 0.34,
                peak: 0.055,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 659.25,
                offset: 0.12,
                attack: 0.045,
                decay: 0.32,
                peak: 0.04,
            },
            {
                kind: "tone",
                waveform: "sine",
                frequency: 987.77,
                offset: 0.19,
                attack: 0.045,
                decay: 0.34,
                peak: 0.032,
            },
        ],
        shimmer: {
            delay: 0.16,
            feedback: 0.28,
            wet: 0.18,
            lowpass: 3200,
        },
    },
}
const SOUND_OPTIONS: Cue[] = [
    "none",
    "chime",
    "sparkle",
    "droplet",
    "bloom",
    "whisper",
    "tick",
    "press",
    "release",
    "toggle",
    "success",
    "error",
    "page",
    "loading",
    "ready",
    "pulse",
    "scan",
    "arrival",
]
const SOUND_TITLES = [
    "None",
    "Chime",
    "Sparkle",
    "Droplet",
    "Bloom",
    "Whisper",
    "Tick",
    "Press",
    "Release",
    "Toggle",
    "Success",
    "Error",
    "Page",
    "Loading",
    "Ready",
    "Pulse",
    "Scan",
    "Arrival",
]
const SOURCE_STOP_PADDING = 0.05
const CLEANUP_MARGIN = 0.05
const INAUDIBLE_GAIN = 0.001
const OUTPUT_GAIN = 4
let sharedContext: AudioContext | null = null
let sharedOutput: GainNode | null = null
function getAudioContext(): AudioContext | null {
    if (sharedContext?.state === "closed") {
        sharedContext = null
        sharedOutput = null
    }
    if (sharedContext) return sharedContext
    if (typeof window === "undefined") return null
    const AudioContextConstructor =
        window.AudioContext ||
        (
            window as typeof window & {
                webkitAudioContext?: typeof AudioContext
            }
        ).webkitAudioContext
    if (!AudioContextConstructor) return null
    try {
        sharedContext = new AudioContextConstructor()
        return sharedContext
    } catch {
        return null
    }
}
let audioUnlockPromise: Promise<boolean> | null = null
function primeAudioContext(context: AudioContext) {
    try {
        const buffer = context.createBuffer(1, 1, context.sampleRate)
        const source = context.createBufferSource()
        const silentGain = context.createGain()
        source.buffer = buffer
        silentGain.gain.value = 0
        source.connect(silentGain).connect(context.destination)
        source.start()
    } catch {}
}
async function unlockAudioContext(): Promise<boolean> {
    const context = getAudioContext()
    if (!context) return false
    if (context.state === "running") return true
    if (audioUnlockPromise) return audioUnlockPromise
    audioUnlockPromise = (async () => {
        try {
            await context.resume()
            if (context.state !== "running") return false
            primeAudioContext(context)
            return true
        } catch {
            return false
        } finally {
            audioUnlockPromise = null
        }
    })()
    return audioUnlockPromise
}
function getOutput(context: AudioContext): GainNode {
    if (sharedOutput) return sharedOutput
    const output = context.createGain()
    output.gain.value = OUTPUT_GAIN
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.knee.value = 6
    limiter.ratio.value = 12
    limiter.attack.value = 0.002
    limiter.release.value = 0.08
    output.connect(limiter).connect(context.destination)
    sharedOutput = output
    return output
}
function renderTone(
    context: AudioContext,
    destination: AudioNode,
    layer: ToneLayer,
    startTime: number
) {
    const oscillator = context.createOscillator()
    oscillator.type = layer.waveform
    oscillator.frequency.setValueAtTime(layer.frequency, startTime)
    if (layer.detune) {
        oscillator.detune.value = layer.detune
    }
    if (layer.glideTo !== undefined) {
        const glideTime = layer.glideTime ?? layer.attack + layer.decay
        oscillator.frequency.exponentialRampToValueAtTime(
            layer.glideTo,
            startTime + glideTime
        )
    }
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack)
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + layer.attack + layer.decay
    )
    oscillator.connect(gain).connect(destination)
    oscillator.start(startTime)
    oscillator.stop(
        startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING
    )
}
function renderNoise(
    context: AudioContext,
    destination: AudioNode,
    layer: NoiseLayer,
    startTime: number
) {
    const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING
    const length = Math.max(1, Math.floor(duration * context.sampleRate))
    const buffer = context.createBuffer(1, length, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < length; index++) {
        data[index] = Math.random() * 2 - 1
    }
    const source = context.createBufferSource()
    source.buffer = buffer
    const filter = context.createBiquadFilter()
    filter.type = layer.filterType
    filter.frequency.value = layer.filterFrequency
    if (layer.filterQ !== undefined) {
        filter.Q.value = layer.filterQ
    }
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack)
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        startTime + layer.attack + layer.decay
    )
    source.connect(filter).connect(gain).connect(destination)
    source.start(startTime)
    source.stop(startTime + duration)
}
function attachShimmer(
    context: AudioContext,
    source: AudioNode,
    destination: AudioNode,
    shimmer: Shimmer
): AudioNode[] {
    const delay = context.createDelay(1)
    delay.delayTime.value = shimmer.delay
    const feedbackFilter = context.createBiquadFilter()
    feedbackFilter.type = "lowpass"
    feedbackFilter.frequency.value = shimmer.lowpass
    const feedbackGain = context.createGain()
    feedbackGain.gain.value = shimmer.feedback
    const wetGain = context.createGain()
    wetGain.gain.value = shimmer.wet
    source.connect(delay)
    delay.connect(feedbackFilter)
    feedbackFilter.connect(feedbackGain)
    feedbackGain.connect(delay)
    feedbackFilter.connect(wetGain)
    wetGain.connect(destination)
    return [delay, feedbackFilter, feedbackGain, wetGain]
}
function sourceEnd(recipe: SoundRecipe): number {
    return Math.max(
        ...recipe.layers.map(
            (layer) =>
                (layer.offset ?? 0) +
                layer.attack +
                layer.decay +
                SOURCE_STOP_PADDING
        )
    )
}
function shimmerTail(shimmer?: Shimmer): number {
    if (!shimmer || shimmer.feedback <= 0) return 0
    if (shimmer.feedback >= 1) return shimmer.delay
    return (
        shimmer.delay *
        (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
    )
}
function renderRecipe(
    context: AudioContext,
    recipe: SoundRecipe,
    volume: number
) {
    const now = context.currentTime
    const output = getOutput(context)
    const master = context.createGain()
    master.gain.value = recipe.masterGain * volume
    master.connect(output)
    const shimmerNodes = recipe.shimmer
        ? attachShimmer(context, master, output, recipe.shimmer)
        : []
    for (const layer of recipe.layers) {
        const startTime = now + (layer.offset ?? 0)
        if (layer.kind === "tone") {
            renderTone(context, master, layer, startTime)
        } else {
            renderNoise(context, master, layer, startTime)
        }
    }
    const cleanupAfter =
        (sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN) *
        1000
    window.setTimeout(() => {
        master.disconnect()
        shimmerNodes.forEach((node) => node.disconnect())
    }, cleanupAfter)
}
function play(sound: SoundName, volume: number) {
    const safeVolume = Math.min(
        1,
        Math.max(0, Number.isFinite(volume) ? volume : 1)
    )
    if (safeVolume === 0) return
    const context = getAudioContext()
    if (!context) return
    const render = () => {
        renderRecipe(context, RECIPES[sound], safeVolume)
    }
    if (context.state === "running") {
        render()
        return
    }
    const activation =
        typeof navigator !== "undefined" ? navigator.userActivation : undefined
    if (activation && !activation.isActive) return
    void unlockAudioContext().then((unlocked) => {
        if (unlocked && context.state === "running") {
            render()
        }
    })
}
function playCue(sound: Cue, volume: number) {
    if (sound !== "none") {
        play(sound, volume)
    }
}
type NavigationType = "auto" | "page" | "section" | "external"
type InputFormSettings = {
    enabled: boolean
    focusSound: Cue
    changeSound: Cue
    submitSound: Cue
    invalidSound: Cue
    detectResult: boolean
    successText: string
    successSound: Cue
    errorText: string
    errorSound: Cue
}
type Props = {
    children?: React.ReactNode
    enabled: boolean
    volume: number
    hoverSound: Cue
    pressSound: Cue
    releaseSound: Cue
    clickSound: Cue
    navigationEnabled: boolean
    navigationType: NavigationType
    pageSound: Cue
    sectionSound: Cue
    externalSound: Cue
    inputForms?: InputFormSettings
    style?: React.CSSProperties
}
type DetectedNavigation = "page" | "section" | "external" | null
type FormResult = "success" | "error" | null
const DEFAULT_INPUT_FORMS: InputFormSettings = {
    enabled: false,
    focusSound: "chime",
    changeSound: "tick",
    submitSound: "loading",
    invalidSound: "error",
    detectResult: false,
    successText: "Thank you",
    successSound: "success",
    errorText: "Error",
    errorSound: "error",
}
const VALIDATION_WINDOW_MS = 700
const INVALID_DEBOUNCE_MS = 350
const RESULT_DEBOUNCE_MS = 140
const RESULT_OBSERVER_LIFETIME_MS = 12000
const invalidTimes = new WeakMap<Element, number>()
const validationAttempts = new WeakMap<Element, number>()
const RESULT_CONTROL_SELECTOR = [
    "button",
    "[role='button']",
    "input[type='submit']",
    "input[type='button']",
].join(",")
function isNearestWrapper(root: HTMLElement, event: Event): boolean {
    const nearestWrapper = event.composedPath().find((item) => {
        return (
            item instanceof HTMLElement &&
            item.dataset.fusetoneWrapper === "true"
        )
    })
    return nearestWrapper === root
}
function isPrimaryPointer(event: PointerEvent): boolean {
    return event.pointerType !== "mouse" || event.button === 0
}
function isMouseHover(event: PointerEvent): boolean {
    return event.pointerType !== "touch" && event.pointerType !== "pen"
}
function isDisabledInteraction(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest("[disabled], [aria-disabled='true']"))
}
function isFieldElement(target: EventTarget | null): target is HTMLElement {
    if (!(target instanceof HTMLElement)) return false
    return target.matches(
        [
            "input",
            "textarea",
            "select",
            "[contenteditable='true']",
            "[role='textbox']",
            "[role='combobox']",
            "[role='checkbox']",
            "[role='radio']",
            "[role='switch']",
        ].join(",")
    )
}
function isMultilineField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    return target instanceof HTMLTextAreaElement || target.isContentEditable
}
function getSubmitControl(
    target: EventTarget | null
): HTMLButtonElement | HTMLInputElement | null {
    if (!(target instanceof Element)) return null
    const control = target.closest<HTMLButtonElement | HTMLInputElement>(
        "button, input"
    )
    if (!control) return null
    const isSubmit =
        control instanceof HTMLButtonElement
            ? control.type === "submit"
            : control.type === "submit" || control.type === "image"
    if (!isSubmit) return null
    const form = control.form ?? control.closest("form")
    return form ? control : null
}
function findForm(event: Event, root: HTMLElement): HTMLFormElement | null {
    if (event.target instanceof HTMLFormElement) {
        return root.contains(event.target) ? event.target : null
    }
    if (!(event.target instanceof Element)) return null
    const submitControl = getSubmitControl(event.target)
    const form =
        submitControl?.form ?? event.target.closest<HTMLFormElement>("form")
    return form && root.contains(form) ? form : null
}
function isManagedFormInteraction(event: Event): boolean {
    return (
        isFieldElement(event.target) || getSubmitControl(event.target) !== null
    )
}
function eventScope(event: Event, root: HTMLElement): Element {
    return findForm(event, root) ?? root
}
function markValidationAttempt(event: Event, root: HTMLElement) {
    validationAttempts.set(
        eventScope(event, root),
        performance.now() + VALIDATION_WINDOW_MS
    )
}
function isDuringValidationAttempt(event: Event, root: HTMLElement): boolean {
    const validUntil = validationAttempts.get(eventScope(event, root)) ?? 0
    return performance.now() < validUntil
}
function canPlayInvalid(event: Event, root: HTMLElement): boolean {
    const scope = eventScope(event, root)
    const now = performance.now()
    const previous = invalidTimes.get(scope) ?? 0
    if (now - previous < INVALID_DEBOUNCE_MS) return false
    invalidTimes.set(scope, now)
    return true
}
function findAnchor(event: Event, root: HTMLElement): HTMLAnchorElement | null {
    for (const item of event.composedPath()) {
        if (item === root) break
        if (item instanceof HTMLAnchorElement && root.contains(item)) {
            return item
        }
    }
    return null
}
function detectNavigationFromAnchor(
    anchor: HTMLAnchorElement
): DetectedNavigation {
    const rawHref = anchor.getAttribute("href")
    if (!rawHref) return null
    if (
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
    ) {
        return null
    }
    try {
        const destination = new URL(anchor.href, window.location.href)
        const current = new URL(window.location.href)
        if (destination.origin !== current.origin) return "external"
        const sameDocument =
            destination.pathname === current.pathname &&
            destination.search === current.search
        if (sameDocument && destination.hash) return "section"
        return "page"
    } catch {
        return null
    }
}
function resolveNavigation(
    event: Event,
    root: HTMLElement,
    selectedType: NavigationType
): DetectedNavigation {
    if (selectedType !== "auto") return selectedType
    const anchor = findAnchor(event, root)
    return anchor ? detectNavigationFromAnchor(anchor) : null
}
function getNavigationSound(
    type: DetectedNavigation,
    pageSound: Cue,
    sectionSound: Cue,
    externalSound: Cue
): Cue {
    if (type === "page") return pageSound
    if (type === "section") return sectionSound
    if (type === "external") return externalSound
    return "none"
}
function normalizeResultText(value: string): string {
    return value.trim().toLocaleLowerCase().replace(/\s+/g, " ")
}
function elementResultText(element: Element): string {
    if (element instanceof HTMLInputElement) {
        return normalizeResultText(
            [
                element.value,
                element.getAttribute("aria-label") ?? "",
                element.getAttribute("title") ?? "",
            ].join(" ")
        )
    }
    return normalizeResultText(
        [
            element.textContent ?? "",
            element.getAttribute("aria-label") ?? "",
            element.getAttribute("title") ?? "",
        ].join(" ")
    )
}
function elementIsVisible(element: Element): boolean {
    if (!(element instanceof HTMLElement)) return true
    const style = window.getComputedStyle(element)
    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0.01
    )
}
function detectFormResult(
    form: HTMLFormElement,
    successText: string,
    errorText: string
): FormResult {
    const normalizedSuccess = normalizeResultText(successText)
    const normalizedError = normalizeResultText(errorText)
    if (!normalizedSuccess && !normalizedError) return null
    const controls = form.querySelectorAll(RESULT_CONTROL_SELECTOR)
    for (const control of controls) {
        if (!elementIsVisible(control)) continue
        const label = elementResultText(control)
        if (normalizedSuccess && label.includes(normalizedSuccess)) {
            return "success"
        }
        if (normalizedError && label.includes(normalizedError)) {
            return "error"
        }
    }
    return null
}
/**
 * Wrap one Framer component with FuseTone.
 * All listeners are scoped to this wrapper and its connected content.
 *
 * @framerDisableUnlink
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 * @framerIntrinsicWidth 240
 * @framerIntrinsicHeight 64
 */
export default function FuseTone(props: Props) {
    const {
        children,
        enabled,
        volume,
        hoverSound,
        pressSound,
        releaseSound,
        clickSound,
        navigationEnabled,
        navigationType,
        pageSound,
        sectionSound,
        externalSound,
        inputForms,
        style,
    } = props
    const formSettings = {
        ...DEFAULT_INPUT_FORMS,
        ...inputForms,
    }
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        const root = rootRef.current
        if (
            !root ||
            !enabled ||
            RenderTarget.current() !== RenderTarget.preview
        ) {
            return
        }
        let resultObserver: MutationObserver | null = null
        let resultTimer: number | undefined
        let observerLifetimeTimer: number | undefined
        const stopResultObserver = () => {
            resultObserver?.disconnect()
            resultObserver = null
            if (resultTimer !== undefined) {
                window.clearTimeout(resultTimer)
                resultTimer = undefined
            }
            if (observerLifetimeTimer !== undefined) {
                window.clearTimeout(observerLifetimeTimer)
                observerLifetimeTimer = undefined
            }
        }
        const trigger = (sound: Cue) => {
            playCue(sound, volume)
        }
        const startResultObserver = (form: HTMLFormElement) => {
            stopResultObserver()
            if (!formSettings.detectResult) return
            let previousResult = detectFormResult(
                form,
                formSettings.successText,
                formSettings.errorText
            )
            const checkResult = () => {
                resultTimer = undefined
                const nextResult = detectFormResult(
                    form,
                    formSettings.successText,
                    formSettings.errorText
                )
                if (nextResult === previousResult) return
                previousResult = nextResult
                if (nextResult === "success") {
                    trigger(formSettings.successSound)
                    stopResultObserver()
                }
                if (nextResult === "error") {
                    trigger(formSettings.errorSound)
                    stopResultObserver()
                }
            }
            const scheduleCheck = () => {
                if (resultTimer !== undefined) {
                    window.clearTimeout(resultTimer)
                }
                resultTimer = window.setTimeout(checkResult, RESULT_DEBOUNCE_MS)
            }
            resultObserver = new MutationObserver(scheduleCheck)
            resultObserver.observe(form, {
                subtree: true,
                childList: true,
                characterData: true,
                attributes: true,
                attributeFilter: [
                    "value",
                    "aria-label",
                    "title",
                    "style",
                    "class",
                    "hidden",
                ],
            })
            observerLifetimeTimer = window.setTimeout(
                stopResultObserver,
                RESULT_OBSERVER_LIFETIME_MS
            )
        }
        const hasNavigationPriority = (event: Event) => {
            return Boolean(
                navigationEnabled &&
                    resolveNavigation(event, root, navigationType)
            )
        }
        const handlePointerOver = (event: PointerEvent) => {
            if (
                !isNearestWrapper(root, event) ||
                !isMouseHover(event) ||
                isDisabledInteraction(event.target)
            ) {
                return
            }
            const relatedTarget = event.relatedTarget
            if (relatedTarget instanceof Node && root.contains(relatedTarget)) {
                return
            }
            trigger(hoverSound)
        }
        const handlePointerDown = (event: PointerEvent) => {
            if (!isNearestWrapper(root, event)) return
            void unlockAudioContext()
            if (
                !isPrimaryPointer(event) ||
                isDisabledInteraction(event.target)
            ) {
                return
            }
            if (formSettings.enabled && getSubmitControl(event.target)) {
                markValidationAttempt(event, root)
            }
            if (
                isManagedFormInteraction(event) ||
                hasNavigationPriority(event)
            ) {
                return
            }
            trigger(pressSound)
        }
        const handlePointerUp = (event: PointerEvent) => {
            if (
                !isNearestWrapper(root, event) ||
                !isPrimaryPointer(event) ||
                isDisabledInteraction(event.target) ||
                isManagedFormInteraction(event) ||
                hasNavigationPriority(event)
            ) {
                return
            }
            trigger(releaseSound)
        }
        const handleClick = (event: MouseEvent) => {
            if (
                !isNearestWrapper(root, event) ||
                event.button !== 0 ||
                isDisabledInteraction(event.target)
            ) {
                return
            }
            if (formSettings.enabled && getSubmitControl(event.target)) {
                markValidationAttempt(event, root)
            }
            if (isManagedFormInteraction(event)) return
            const navigation = navigationEnabled
                ? resolveNavigation(event, root, navigationType)
                : null
            if (navigation) {
                trigger(
                    getNavigationSound(
                        navigation,
                        pageSound,
                        sectionSound,
                        externalSound
                    )
                )
                return
            }
            trigger(clickSound)
        }
        const handleFocus = (event: FocusEvent) => {
            if (
                !isNearestWrapper(root, event) ||
                !formSettings.enabled ||
                !isFieldElement(event.target) ||
                isDisabledInteraction(event.target) ||
                isDuringValidationAttempt(event, root)
            ) {
                return
            }
            trigger(formSettings.focusSound)
        }
        const handleChange = (event: Event) => {
            if (
                !isNearestWrapper(root, event) ||
                !formSettings.enabled ||
                !isFieldElement(event.target) ||
                isDisabledInteraction(event.target) ||
                isDuringValidationAttempt(event, root)
            ) {
                return
            }
            trigger(formSettings.changeSound)
        }
        const handleSubmit = (event: SubmitEvent) => {
            if (!isNearestWrapper(root, event) || !formSettings.enabled) {
                return
            }
            const form = findForm(event, root)
            if (!form) return
            markValidationAttempt(event, root)
            startResultObserver(form)
            trigger(formSettings.submitSound)
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isNearestWrapper(root, event)) return
            void unlockAudioContext()
            if (
                !formSettings.enabled ||
                event.key !== "Enter" ||
                !isFieldElement(event.target) ||
                isMultilineField(event.target)
            ) {
                return
            }
            markValidationAttempt(event, root)
        }
        const handleInvalid = (event: Event) => {
            if (
                !isNearestWrapper(root, event) ||
                !formSettings.enabled ||
                !canPlayInvalid(event, root)
            ) {
                return
            }
            markValidationAttempt(event, root)
            trigger(formSettings.invalidSound)
        }
        root.addEventListener("pointerover", handlePointerOver, true)
        root.addEventListener("pointerdown", handlePointerDown, true)
        root.addEventListener("pointerup", handlePointerUp, true)
        root.addEventListener("click", handleClick, true)
        root.addEventListener("focusin", handleFocus, true)
        root.addEventListener("change", handleChange, true)
        root.addEventListener("submit", handleSubmit, true)
        root.addEventListener("keydown", handleKeyDown, true)
        root.addEventListener("invalid", handleInvalid, true)
        return () => {
            stopResultObserver()
            root.removeEventListener("pointerover", handlePointerOver, true)
            root.removeEventListener("pointerdown", handlePointerDown, true)
            root.removeEventListener("pointerup", handlePointerUp, true)
            root.removeEventListener("click", handleClick, true)
            root.removeEventListener("focusin", handleFocus, true)
            root.removeEventListener("change", handleChange, true)
            root.removeEventListener("submit", handleSubmit, true)
            root.removeEventListener("keydown", handleKeyDown, true)
            root.removeEventListener("invalid", handleInvalid, true)
        }
    }, [
        enabled,
        volume,
        hoverSound,
        pressSound,
        releaseSound,
        clickSound,
        navigationEnabled,
        navigationType,
        pageSound,
        sectionSound,
        externalSound,
        formSettings.enabled,
        formSettings.focusSound,
        formSettings.changeSound,
        formSettings.submitSound,
        formSettings.invalidSound,
        formSettings.detectResult,
        formSettings.successText,
        formSettings.successSound,
        formSettings.errorText,
        formSettings.errorSound,
    ])
    const hasContent = React.Children.count(children) > 0
    const showPlaceholder =
        !hasContent && RenderTarget.current() === RenderTarget.canvas
    return (
        <div
            ref={rootRef}
            data-fusetone-wrapper="true"
            style={{
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                position: "relative",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
                ...style,
            }}
        >
            {hasContent ? (
                children
            ) : showPlaceholder ? (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        minWidth: 180,
                        minHeight: 64,
                        boxSizing: "border-box",
                        border: "1px dashed rgba(127,127,127,0.5)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 16,
                        fontFamily: "Inter, system-ui, sans-serif",
                        fontSize: 13,
                        lineHeight: 1.4,
                        textAlign: "center",
                        color: "rgba(127,127,127,0.9)",
                    }}
                >
                    Connect a component in Content
                </div>
            ) : null}
        </div>
    )
}
FuseTone.defaultProps = {
    enabled: true,
    volume: 0.7,
    hoverSound: "tick",
    pressSound: "press",
    releaseSound: "release",
    clickSound: "none",
    navigationEnabled: true,
    navigationType: "auto",
    pageSound: "page",
    sectionSound: "tick",
    externalSound: "page",
    inputForms: DEFAULT_INPUT_FORMS,
}
addPropertyControls(FuseTone, {
    children: {
        type: ControlType.ComponentInstance,
        title: "Content",
    },
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    volume: {
        type: ControlType.Number,
        title: "Volume",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.05,
        displayStepper: true,
    },
    hoverSound: {
        type: ControlType.Enum,
        title: "Hover",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "tick",
    },
    pressSound: {
        type: ControlType.Enum,
        title: "Press",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "press",
    },
    releaseSound: {
        type: ControlType.Enum,
        title: "Release",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "release",
    },
    clickSound: {
        type: ControlType.Enum,
        title: "Click",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "none",
    },
    navigationEnabled: {
        type: ControlType.Boolean,
        title: "Navigation",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    navigationType: {
        type: ControlType.Enum,
        title: "Nav Type",
        options: ["auto", "page", "section", "external"],
        optionTitles: ["Auto Detect", "Page", "Page Section", "External Site"],
        defaultValue: "auto",
        hidden: (props: Props) => !props.navigationEnabled,
    },
    pageSound: {
        type: ControlType.Enum,
        title: "Page Sound",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "page",
        hidden: (props: Props) => !props.navigationEnabled,
    },
    sectionSound: {
        type: ControlType.Enum,
        title: "Section Sound",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "tick",
        hidden: (props: Props) => !props.navigationEnabled,
    },
    externalSound: {
        type: ControlType.Enum,
        title: "External Sound",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "page",
        hidden: (props: Props) => !props.navigationEnabled,
    },
    inputForms: {
        type: ControlType.Object,
        title: "Inputs & Forms",
        buttonTitle: "Edit Sounds",
        icon: "interact",
        defaultValue: DEFAULT_INPUT_FORMS,
        controls: {
            enabled: {
                type: ControlType.Boolean,
                title: "Enabled",
                defaultValue: false,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            focusSound: {
                type: ControlType.Enum,
                title: "Field Focus",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "chime",
            },
            changeSound: {
                type: ControlType.Enum,
                title: "Value Change",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "tick",
            },
            submitSound: {
                type: ControlType.Enum,
                title: "Form Submit",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "loading",
                description: "Plays when the connected form submits.",
            },
            invalidSound: {
                type: ControlType.Enum,
                title: "Invalid Form",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "error",
                description: "Plays when browser validation blocks submit.",
            },
            detectResult: {
                type: ControlType.Boolean,
                title: "Form Result",
                defaultValue: false,
                enabledTitle: "Watch",
                disabledTitle: "Off",
                description:
                    "Watches only the submitted form for up to 12 seconds.",
            },
            successText: {
                type: ControlType.String,
                title: "Success Text",
                defaultValue: "Thank you",
                placeholder: "Thank you",
                hidden: (props: InputFormSettings) => !props.detectResult,
            },
            successSound: {
                type: ControlType.Enum,
                title: "Success Sound",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "success",
                hidden: (props: InputFormSettings) => !props.detectResult,
            },
            errorText: {
                type: ControlType.String,
                title: "Error Text",
                defaultValue: "Error",
                placeholder: "Something went wrong",
                hidden: (props: InputFormSettings) => !props.detectResult,
            },
            errorSound: {
                type: ControlType.Enum,
                title: "Error Sound",
                options: SOUND_OPTIONS,
                optionTitles: SOUND_TITLES,
                defaultValue: "error",
                hidden: (props: InputFormSettings) => !props.detectResult,
            },
        },
    },
})
