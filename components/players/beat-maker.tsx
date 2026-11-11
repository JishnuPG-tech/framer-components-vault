import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
} from "react"
// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};


// Audio Context Management
let globalAudioContext: AudioContext | null = null
let mainVolumeNode: GainNode | null = null

// Get or create audio context
const initializeAudioContext = (): AudioContext => {
    if (!globalAudioContext) {
        globalAudioContext = new AudioContext()
    }
    return globalAudioContext
}

// Get or create master volume control
const getVolumeControl = (level: number = 0.7): GainNode => {
    const ctx = initializeAudioContext()

    if (!mainVolumeNode) {
        mainVolumeNode = ctx.createGain()
        mainVolumeNode.connect(ctx.destination)
    }

    // Smooth volume changes
    if (ctx.state === "running") {
        mainVolumeNode.gain.setValueAtTime(
            mainVolumeNode.gain.value,
            ctx.currentTime
        )
        mainVolumeNode.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, level),
            ctx.currentTime + 0.03
        )
    } else {
        mainVolumeNode.gain.value = level
    }

    if (ctx.state === "suspended") {
        ctx.resume()
    }

    return mainVolumeNode
}

// Enhanced impact sound with multiple intensity levels
const playImpact = (intensity: number = 1, volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const masterImpactGain = ctx.createGain()
    const startTime = ctx.currentTime

    const durations = [0.25, 0.5, 0.8, 1.2]
    const duration = durations[Math.min(intensity, 3)]

    // Deep bass oscillator
    const bassOsc = ctx.createOscillator()
    const bassGain = ctx.createGain()

    bassOsc.type = "sine"
    bassOsc.frequency.setValueAtTime(65, startTime)
    bassOsc.frequency.exponentialRampToValueAtTime(
        30,
        startTime + duration * 0.75
    )

    bassGain.gain.setValueAtTime(0, startTime)
    bassGain.gain.linearRampToValueAtTime(0.85, startTime + 0.008)
    bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

    // Mid-range oscillator for punch
    const midOsc = ctx.createOscillator()
    const midGain = ctx.createGain()
    const midFilter = ctx.createBiquadFilter()

    midOsc.type = "sawtooth"
    midOsc.frequency.setValueAtTime(110, startTime)
    midOsc.frequency.exponentialRampToValueAtTime(35, startTime + duration)

    midFilter.type = "lowpass"
    midFilter.frequency.setValueAtTime(1800, startTime)
    midFilter.frequency.exponentialRampToValueAtTime(
        180,
        startTime + duration * 0.6
    )
    midFilter.Q.value = 10

    midGain.gain.setValueAtTime(0, startTime)
    midGain.gain.linearRampToValueAtTime(0.7, startTime + 0.004)
    midGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6)

    // Impact noise buffer
    const noiseBuffer = ctx.createBuffer(
        1,
        ctx.sampleRate * duration,
        ctx.sampleRate
    )
    const noiseData = noiseBuffer.getChannelData(0)

    for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] =
            (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08))
    }

    const noiseSource = ctx.createBufferSource()
    const noiseGain = ctx.createGain()
    const noiseFilter = ctx.createBiquadFilter()

    noiseSource.buffer = noiseBuffer
    noiseFilter.type = "bandpass"
    noiseFilter.frequency.value = 900
    noiseFilter.Q.value = 3

    noiseGain.gain.setValueAtTime(0.3, startTime)
    noiseGain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration * 0.15
    )

    // Connect audio chain
    bassOsc.connect(bassGain)
    midOsc.connect(midFilter)
    midFilter.connect(midGain)
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)

    masterImpactGain.gain.value = 0.95
    bassGain.connect(masterImpactGain)
    midGain.connect(masterImpactGain)
    noiseGain.connect(masterImpactGain)
    masterImpactGain.connect(volumeNode || ctx.destination)

    // Start and schedule stop
    bassOsc.start(startTime)
    midOsc.start(startTime)
    noiseSource.start(startTime)

    bassOsc.stop(startTime + duration)
    midOsc.stop(startTime + duration)
}

// Drum sound generators
const generateKickDrum = (volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.setValueAtTime(140, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)

    gain.gain.setValueAtTime(1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)

    osc.connect(gain)
    gain.connect(volumeNode || ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
}

const generateSnare = (volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const noise = ctx.createBufferSource()
    const noiseBuffer = ctx.createBuffer(
        1,
        ctx.sampleRate * 0.15,
        ctx.sampleRate
    )
    const noiseData = noiseBuffer.getChannelData(0)

    const gain = ctx.createGain()

    for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = Math.random() * 2 - 1
    }

    noise.buffer = noiseBuffer

    gain.gain.setValueAtTime(0.8, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

    noise.connect(gain)
    gain.connect(volumeNode || ctx.destination)

    noise.start(ctx.currentTime)
}

const generateHiHat = (volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const noise = ctx.createBufferSource()
    const noiseBuffer = ctx.createBuffer(
        1,
        ctx.sampleRate * 0.08,
        ctx.sampleRate
    )
    const noiseData = noiseBuffer.getChannelData(0)

    const gain = ctx.createGain()
    const highpass = ctx.createBiquadFilter()

    for (let i = 0; i < noiseBuffer.length; i++) {
        noiseData[i] = Math.random() * 2 - 1
    }

    noise.buffer = noiseBuffer

    highpass.type = "highpass"
    highpass.frequency.value = 7500

    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

    noise.connect(highpass)
    highpass.connect(gain)
    gain.connect(volumeNode || ctx.destination)

    noise.start(ctx.currentTime)
}

// Musical note frequencies (A Minor Pentatonic Scale)
const PentatonicFrequencies = [
    220.0, // A3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.0, // G4
    440.0, // A4
]

// Synthesizer sound
const playSynthNote = (noteIndex: number, volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(
        PentatonicFrequencies[noteIndex],
        ctx.currentTime
    )

    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

    osc.connect(gain)
    gain.connect(volumeNode || ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
}

// Bass synthesizer
const playBassNote = (noteIndex: number, volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(
        PentatonicFrequencies[noteIndex] / 2,
        ctx.currentTime
    )

    gain.gain.setValueAtTime(0.6, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(volumeNode || ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
}

// String synthesizer with vibrato
const playStringNote = (noteIndex: number, volumeNode?: GainNode) => {
    const ctx = initializeAudioContext()

    const noteDuration = 1.0
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const lfo = ctx.createOscillator()

    const mainGain = ctx.createGain()
    const lfoGain = ctx.createGain()

    osc1.type = "sine"
    osc2.type = "triangle"
    lfo.type = "sine"

    const baseFreq = PentatonicFrequencies[noteIndex]

    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    osc2.frequency.setValueAtTime(baseFreq, ctx.currentTime)

    lfo.frequency.value = 5.5
    lfoGain.gain.value = 2.5

    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)
    lfoGain.connect(osc2.frequency)

    mainGain.gain.setValueAtTime(0, ctx.currentTime)
    mainGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.08)
    mainGain.gain.setValueAtTime(0.3, ctx.currentTime + 0.08)
    mainGain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.25)
    mainGain.gain.setValueAtTime(0.25, ctx.currentTime + noteDuration - 0.4)
    mainGain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + noteDuration
    )

    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = 1100
    filter.Q.value = 0.8

    osc1.connect(mainGain)
    osc2.connect(mainGain)

    mainGain.connect(filter)
    filter.connect(volumeNode || ctx.destination)

    const startTime = ctx.currentTime
    osc1.start(startTime)
    osc2.start(startTime)
    lfo.start(startTime)

    osc1.stop(startTime + noteDuration)
    osc2.stop(startTime + noteDuration)
    lfo.stop(startTime + noteDuration)
}

// Type definitions for sequencer
export type StepPattern = boolean[]
export type DrumPatterns = {
    kick: StepPattern
    snare: StepPattern
    hihat: StepPattern
}
export type InstrumentPatterns = {
    drums: DrumPatterns
    bass: StepPattern[]
    synth: StepPattern[]
    impact: StepPattern[]
    strings: StepPattern[]
}

export type InstrumentType = "drums" | "bass" | "synth" | "impact" | "strings"

type BeatMakerContextType = {
    currentInstrument: InstrumentType
    setCurrentInstrument: (instrument: InstrumentType) => void
    patterns: InstrumentPatterns
    toggleStep: (
        instrument: InstrumentType,
        row: number | keyof DrumPatterns,
        step: number
    ) => void
    isActive: boolean
    togglePlayback: () => void
    activeStep: number
    bpm: number
    setBpm: (bpm: number) => void
    loadDemo: () => void
    clearAll: () => void
    masterVolume: number
    setMasterVolume: (volume: number) => void
    downloadMusic: (loops: number) => void
}

// Create context
const BeatMakerContext = createContext<BeatMakerContextType | undefined>(
    undefined
)

// Sequencer configuration
const SEQUENCE_LENGTH = 16

// Instrument color mapping
const INSTRUMENT_COLORS = {
    drums: "#FF6B9D",
    bass: "#4ECDC4",
    synth: "#45B7D1",
    strings: "#96CEB4",
    impact: "#FFEAA7",
}

// Create empty pattern
const createEmptyPattern = (): StepPattern => Array(SEQUENCE_LENGTH).fill(false)

const createEmptyDrumPatterns = (): DrumPatterns => ({
    kick: createEmptyPattern(),
    snare: createEmptyPattern(),
    hihat: createEmptyPattern(),
})

const createEmptyMelodicPatterns = (): StepPattern[] =>
    Array(6)
        .fill(null)
        .map(() => createEmptyPattern())

const createEmptyImpactPatterns = (): StepPattern[] =>
    Array(4)
        .fill(null)
        .map(() => createEmptyPattern())

// Create demonstration patterns
const createDemoPatterns = (): InstrumentPatterns => {
    const demo: InstrumentPatterns = {
        drums: {
            kick: Array(SEQUENCE_LENGTH).fill(false),
            snare: Array(SEQUENCE_LENGTH).fill(false),
            hihat: Array(SEQUENCE_LENGTH).fill(false),
        },
        bass: createEmptyMelodicPatterns(),
        synth: createEmptyMelodicPatterns(),
        impact: createEmptyImpactPatterns(),
        strings: createEmptyMelodicPatterns(),
    }

    // Kick pattern
    demo.drums.kick[0] = true
    demo.drums.kick[4] = true
    demo.drums.kick[8] = true
    demo.drums.kick[12] = true
    demo.drums.kick[15] = true

    // Snare pattern
    demo.drums.snare[4] = true
    demo.drums.snare[12] = true

    // Hi-hat pattern
    for (let i = 0; i < SEQUENCE_LENGTH; i += 2) {
        demo.drums.hihat[i] = true
    }

    // Bass pattern
    demo.bass[0][0] = true
    demo.bass[1][4] = true
    demo.bass[0][8] = true
    demo.bass[2][12] = true
    demo.bass[4][14] = true
    demo.bass[2][15] = true

    // Synth melody
    demo.synth[1][1] = true
    demo.synth[3][3] = true
    demo.synth[2][5] = true
    demo.synth[2][8] = true
    demo.synth[1][9] = true
    demo.synth[2][10] = true
    demo.synth[4][12] = true
    demo.synth[2][14] = true

    // String accompaniment
    demo.strings[2][6] = true
    demo.strings[0][10] = true
    demo.strings[1][12] = true

    // Impact accompaniment
    demo.impact[3][0] = true
    demo.impact[3][2] = true
    demo.impact[3][3] = true
    demo.impact[2][5] = true
    demo.impact[1][6] = true
    demo.impact[2][7] = true
    demo.impact[2][10] = true

    return demo
}

// Audio recording and download functionality
const recordAudio = async (
    patterns: InstrumentPatterns,
    bpm: number,
    loops: number,
    volume: number
): Promise<Blob> => {
    const ctx = new OfflineAudioContext(
        2,
        44100 * ((60 / bpm) * 4 * loops),
        44100
    )
    const masterGain = ctx.createGain()
    masterGain.gain.value = volume
    masterGain.connect(ctx.destination)

    const stepDuration = 60 / bpm / 4 // Duration of each step in seconds

    for (let loop = 0; loop < loops; loop++) {
        for (let step = 0; step < SEQUENCE_LENGTH; step++) {
            const stepTime = (loop * SEQUENCE_LENGTH + step) * stepDuration

            // Generate drum sounds
            if (patterns.drums.kick[step]) {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.type = "sine"
                osc.frequency.setValueAtTime(140, stepTime)
                osc.frequency.exponentialRampToValueAtTime(0.01, stepTime + 0.6)
                gain.gain.setValueAtTime(1, stepTime)
                gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.6)
                osc.connect(gain)
                gain.connect(masterGain)
                osc.start(stepTime)
                osc.stop(stepTime + 0.6)
            }

            if (patterns.drums.snare[step]) {
                const noise = ctx.createBufferSource()
                const noiseBuffer = ctx.createBuffer(
                    1,
                    ctx.sampleRate * 0.15,
                    ctx.sampleRate
                )
                const noiseData = noiseBuffer.getChannelData(0)
                const gain = ctx.createGain()

                for (let i = 0; i < noiseBuffer.length; i++) {
                    noiseData[i] = Math.random() * 2 - 1
                }
                noise.buffer = noiseBuffer
                gain.gain.setValueAtTime(0.8, stepTime)
                gain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.15)
                noise.connect(gain)
                gain.connect(masterGain)
                noise.start(stepTime)
            }

            if (patterns.drums.hihat[step]) {
                const noise = ctx.createBufferSource()
                const noiseBuffer = ctx.createBuffer(
                    1,
                    ctx.sampleRate * 0.08,
                    ctx.sampleRate
                )
                const noiseData = noiseBuffer.getChannelData(0)
                const gain = ctx.createGain()
                const highpass = ctx.createBiquadFilter()

                for (let i = 0; i < noiseBuffer.length; i++) {
                    noiseData[i] = Math.random() * 2 - 1
                }
                noise.buffer = noiseBuffer
                highpass.type = "highpass"
                highpass.frequency.value = 7500
                gain.gain.setValueAtTime(0.25, stepTime)
                gain.gain.exponentialRampToValueAtTime(0.01, stepTime + 0.08)
                noise.connect(highpass)
                highpass.connect(gain)
                gain.connect(masterGain)
                noise.start(stepTime)
            }

            // Generate melodic sounds
            patterns.bass.forEach((row, noteIndex) => {
                if (row[step]) {
                    const osc = ctx.createOscillator()
                    const gain = ctx.createGain()
                    osc.type = "triangle"
                    osc.frequency.setValueAtTime(
                        PentatonicFrequencies[noteIndex] / 2,
                        stepTime
                    )
                    gain.gain.setValueAtTime(0.6, stepTime)
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + 0.35
                    )
                    osc.connect(gain)
                    gain.connect(masterGain)
                    osc.start(stepTime)
                    osc.stop(stepTime + 0.35)
                }
            })

            patterns.synth.forEach((row, noteIndex) => {
                if (row[step]) {
                    const osc = ctx.createOscillator()
                    const gain = ctx.createGain()
                    osc.type = "sawtooth"
                    osc.frequency.setValueAtTime(
                        PentatonicFrequencies[noteIndex],
                        stepTime
                    )
                    gain.gain.setValueAtTime(0.35, stepTime)
                    gain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + 0.25
                    )
                    osc.connect(gain)
                    gain.connect(masterGain)
                    osc.start(stepTime)
                    osc.stop(stepTime + 0.25)
                }
            })

            // Fixed strings generation with proper vibrato and envelope
            patterns.strings.forEach((row, noteIndex) => {
                if (row[step]) {
                    const noteDuration = 1.0
                    const osc1 = ctx.createOscillator()
                    const osc2 = ctx.createOscillator()
                    const lfo = ctx.createOscillator()

                    const mainGain = ctx.createGain()
                    const lfoGain = ctx.createGain()

                    osc1.type = "sine"
                    osc2.type = "triangle"
                    lfo.type = "sine"

                    const baseFreq = PentatonicFrequencies[noteIndex]

                    osc1.frequency.setValueAtTime(baseFreq, stepTime)
                    osc2.frequency.setValueAtTime(baseFreq, stepTime)

                    lfo.frequency.value = 5.5
                    lfoGain.gain.value = 2.5

                    lfo.connect(lfoGain)
                    lfoGain.connect(osc1.frequency)
                    lfoGain.connect(osc2.frequency)

                    mainGain.gain.setValueAtTime(0, stepTime)
                    mainGain.gain.linearRampToValueAtTime(0.3, stepTime + 0.08)
                    mainGain.gain.setValueAtTime(0.3, stepTime + 0.08)
                    mainGain.gain.exponentialRampToValueAtTime(
                        0.25,
                        stepTime + 0.25
                    )
                    mainGain.gain.setValueAtTime(
                        0.25,
                        stepTime + noteDuration - 0.4
                    )
                    mainGain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + noteDuration
                    )

                    const filter = ctx.createBiquadFilter()
                    filter.type = "lowpass"
                    filter.frequency.value = 1100
                    filter.Q.value = 0.8

                    osc1.connect(mainGain)
                    osc2.connect(mainGain)

                    mainGain.connect(filter)
                    filter.connect(masterGain)

                    osc1.start(stepTime)
                    osc2.start(stepTime)
                    lfo.start(stepTime)

                    osc1.stop(stepTime + noteDuration)
                    osc2.stop(stepTime + noteDuration)
                    lfo.stop(stepTime + noteDuration)
                }
            })

            // Generate impact sounds
            patterns.impact.forEach((row, intensity) => {
                if (row[step]) {
                    // Generate impact sound for offline rendering
                    const masterImpactGain = ctx.createGain()
                    const durations = [0.25, 0.5, 0.8, 1.2]
                    const duration = durations[Math.min(intensity, 3)]

                    // Deep bass oscillator
                    const bassOsc = ctx.createOscillator()
                    const bassGain = ctx.createGain()

                    bassOsc.type = "sine"
                    bassOsc.frequency.setValueAtTime(65, stepTime)
                    bassOsc.frequency.exponentialRampToValueAtTime(
                        30,
                        stepTime + duration * 0.75
                    )

                    bassGain.gain.setValueAtTime(0, stepTime)
                    bassGain.gain.linearRampToValueAtTime(
                        0.85,
                        stepTime + 0.008
                    )
                    bassGain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + duration
                    )

                    // Mid-range oscillator for punch
                    const midOsc = ctx.createOscillator()
                    const midGain = ctx.createGain()
                    const midFilter = ctx.createBiquadFilter()

                    midOsc.type = "sawtooth"
                    midOsc.frequency.setValueAtTime(110, stepTime)
                    midOsc.frequency.exponentialRampToValueAtTime(
                        35,
                        stepTime + duration
                    )

                    midFilter.type = "lowpass"
                    midFilter.frequency.setValueAtTime(1800, stepTime)
                    midFilter.frequency.exponentialRampToValueAtTime(
                        180,
                        stepTime + duration * 0.6
                    )
                    midFilter.Q.value = 10

                    midGain.gain.setValueAtTime(0, stepTime)
                    midGain.gain.linearRampToValueAtTime(0.7, stepTime + 0.004)
                    midGain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + duration * 0.6
                    )

                    // Impact noise buffer
                    const noiseBuffer = ctx.createBuffer(
                        1,
                        ctx.sampleRate * duration,
                        ctx.sampleRate
                    )
                    const noiseData = noiseBuffer.getChannelData(0)

                    for (let i = 0; i < noiseBuffer.length; i++) {
                        noiseData[i] =
                            (Math.random() * 2 - 1) *
                            Math.exp(-i / (ctx.sampleRate * 0.08))
                    }

                    const noiseSource = ctx.createBufferSource()
                    const noiseGain = ctx.createGain()
                    const noiseFilter = ctx.createBiquadFilter()

                    noiseSource.buffer = noiseBuffer
                    noiseFilter.type = "bandpass"
                    noiseFilter.frequency.value = 900
                    noiseFilter.Q.value = 3

                    noiseGain.gain.setValueAtTime(0.3, stepTime)
                    noiseGain.gain.exponentialRampToValueAtTime(
                        0.001,
                        stepTime + duration * 0.15
                    )

                    // Connect audio chain
                    bassOsc.connect(bassGain)
                    midOsc.connect(midFilter)
                    midFilter.connect(midGain)
                    noiseSource.connect(noiseFilter)
                    noiseFilter.connect(noiseGain)

                    masterImpactGain.gain.value = 0.95
                    bassGain.connect(masterImpactGain)
                    midGain.connect(masterImpactGain)
                    noiseGain.connect(masterImpactGain)
                    masterImpactGain.connect(masterGain)

                    // Start and schedule stop
                    bassOsc.start(stepTime)
                    midOsc.start(stepTime)
                    noiseSource.start(stepTime)

                    bassOsc.stop(stepTime + duration)
                    midOsc.stop(stepTime + duration)
                }
            })
        }
    }

    const renderedBuffer = await ctx.startRendering()

    // Convert AudioBuffer to WAV
    const length = renderedBuffer.length
    const numberOfChannels = renderedBuffer.numberOfChannels
    const sampleRate = renderedBuffer.sampleRate
    const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i))
        }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * numberOfChannels * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * numberOfChannels * 2, true)

    // Convert audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const sample = Math.max(
                -1,
                Math.min(1, renderedBuffer.getChannelData(channel)[i])
            )
            view.setInt16(offset, sample * 0x7fff, true)
            offset += 2
        }
    }

    return new Blob([buffer], { type: "audio/wav" })
}

// Provider component
const BeatMakerProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [currentInstrument, setCurrentInstrument] =
        useState<InstrumentType>("synth")
    const [patterns, setPatterns] = useState<InstrumentPatterns>({
        drums: createEmptyDrumPatterns(),
        bass: createEmptyMelodicPatterns(),
        synth: createEmptyMelodicPatterns(),
        impact: createEmptyImpactPatterns(),
        strings: createEmptyMelodicPatterns(),
    })
    const [isActive, setIsActive] = useState<boolean>(false)
    const [activeStep, setActiveStep] = useState<number>(0)
    const [bpm, setBpm] = useState<number>(120)
    const [masterVolume, setMasterVolume] = useState<number>(0.7)

    // Volume handler
    const handleVolumeChange = (newVolume: number) => {
        setMasterVolume(newVolume)
        getVolumeControl(newVolume)
    }

    // Download music handler
    const downloadMusic = async (loops: number) => {
        try {
            const audioBlob = await recordAudio(
                patterns,
                bpm,
                loops,
                masterVolume
            )
            const url = URL.createObjectURL(audioBlob)
            const a = document.createElement("a")
            a.href = url
            a.download = `beat-maker-${loops}-loops.wav`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading music:", error)
        }
    }

    // Timer reference
    const intervalRef = useRef<number | null>(null)

    // Parameter refs to avoid interval recreation
    const bpmRef = useRef(bpm)
    const patternsRef = useRef(patterns)
    const volumeRef = useRef(masterVolume)

    useEffect(() => {
        bpmRef.current = bpm
    }, [bpm])

    useEffect(() => {
        patternsRef.current = patterns
    }, [patterns])

    useEffect(() => {
        volumeRef.current = masterVolume
        getVolumeControl(masterVolume)
    }, [masterVolume])

    // Calculate timing interval
    const getInterval = () => (60 * 1000) / (bpmRef.current * 4)

    // Play sounds for current step
    const playStepSounds = (step: number) => {
        initializeAudioContext()
        const volumeControl = getVolumeControl(volumeRef.current)
        const currentPatterns = patternsRef.current

        // Play drum sounds
        if (currentPatterns.drums.kick[step]) generateKickDrum(volumeControl)
        if (currentPatterns.drums.snare[step]) generateSnare(volumeControl)
        if (currentPatterns.drums.hihat[step]) generateHiHat(volumeControl)

        // Play bass notes
        currentPatterns.bass.forEach((row, noteIndex) => {
            if (row[step]) playBassNote(noteIndex, volumeControl)
        })

        // Play synth notes
        currentPatterns.synth.forEach((row, noteIndex) => {
            if (row[step]) playSynthNote(noteIndex, volumeControl)
        })

        // Play string notes
        currentPatterns.strings.forEach((row, noteIndex) => {
            if (row[step]) playStringNote(noteIndex, volumeControl)
        })

        // Play impact sounds
        currentPatterns.impact.forEach((row, intensity) => {
            if (row[step]) {
                playImpact(intensity, volumeControl)
            }
        })
    }

    // Toggle step in pattern
    const toggleStep = (
        instrument: InstrumentType,
        row: number | keyof DrumPatterns,
        step: number
    ) => {
        setPatterns((prev) => {
            const newPatterns = { ...prev }

            if (instrument === "drums") {
                const drumRow = row as keyof DrumPatterns
                newPatterns.drums[drumRow] = [...prev.drums[drumRow]]
                newPatterns.drums[drumRow][step] = !prev.drums[drumRow][step]
            } else {
                const melodicRow = row as number
                newPatterns[instrument] = [...prev[instrument]]
                newPatterns[instrument][melodicRow] = [
                    ...prev[instrument][melodicRow],
                ]
                newPatterns[instrument][melodicRow][step] =
                    !prev[instrument][melodicRow][step]
            }

            patternsRef.current = newPatterns

            if (isActive && activeStep === step) {
                playStepSounds(step)
            }

            return newPatterns
        })
    }

    // Toggle playback
    const togglePlayback = () => {
        if (isActive) {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current)
                intervalRef.current = null
            }
            setActiveStep(0)
            setIsActive(false)
        } else {
            setActiveStep(0)
            setIsActive(true)

            playStepSounds(0)

            intervalRef.current = window.setInterval(
                () => {
                    setActiveStep((prev) => {
                        const nextStep = (prev + 1) % SEQUENCE_LENGTH
                        playStepSounds(nextStep)
                        return nextStep
                    })
                },
                (60 * 1000) / (bpmRef.current * 4)
            )
        }
    }

    // Load demo patterns
    const loadDemo = () => {
        const demoPatterns = createDemoPatterns()
        patternsRef.current = demoPatterns
        setPatterns(demoPatterns)
    }

    // Clear all patterns
    const clearAll = () => {
        const emptyPatterns = {
            drums: createEmptyDrumPatterns(),
            bass: createEmptyMelodicPatterns(),
            synth: createEmptyMelodicPatterns(),
            impact: createEmptyImpactPatterns(),
            strings: createEmptyMelodicPatterns(),
        }

        patternsRef.current = emptyPatterns
        setPatterns(emptyPatterns)
    }

    // Update interval when BPM changes
    useEffect(() => {
        if (isActive && intervalRef.current !== null) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = window.setInterval(() => {
                setActiveStep((prev) => {
                    const nextStep = (prev + 1) % SEQUENCE_LENGTH
                    playStepSounds(nextStep)
                    return nextStep
                })
            }, getInterval())
        }
    }, [bpm, isActive])

    // Cleanup
    useEffect(() => {
        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current)
            }
        }
    }, [])

    const value: BeatMakerContextType = {
        currentInstrument,
        setCurrentInstrument,
        patterns,
        toggleStep,
        isActive,
        togglePlayback,
        activeStep,
        bpm,
        setBpm,
        loadDemo,
        clearAll,
        masterVolume,
        setMasterVolume: handleVolumeChange,
        downloadMusic,
    }

    return (
        <BeatMakerContext.Provider value={value}>
            {children}
        </BeatMakerContext.Provider>
    )
}

// Hook for using context
const useBeatMaker = () => {
    const context = useContext(BeatMakerContext)
    if (context === undefined) {
        throw new Error("useBeatMaker must be used within a BeatMakerProvider")
    }
    return context
}

// Helper function for pattern button styles with instrument-specific colors
const getPatternButtonStyle = (
    active: boolean,
    isActiveStep: boolean,
    instrumentType: InstrumentType,
    activeBorderColor: string,
    inactiveBorderColor: string,
    patternSize: number,
    borderRadius: number
) => {
    const instrumentColor = INSTRUMENT_COLORS[instrumentType]

    let borderStyle = `2px solid ${inactiveBorderColor}`
    let backgroundColor = "transparent"

    if (isActiveStep) {
        borderStyle = "3px solid white"
        backgroundColor = active ? instrumentColor : "transparent"
    } else if (active) {
        borderStyle = `2px solid ${activeBorderColor}`
        backgroundColor = instrumentColor
    }

    return {
        backgroundColor,
        border: borderStyle,
        opacity: active ? 1 : 0.3,
        width: `${patternSize}px`,
        height: `${patternSize}px`,
        borderRadius: `${borderRadius}px`,
        flexShrink: 0,
        position: "relative" as const,
        cursor: "pointer",
        transition: "all 0.15s ease",
    }
}

// Step Grid Sequencer Component - now uses CSS Grid with instrument colors
const PatternGrid: React.FC<{
    patterns: StepPattern[]
    instrumentType: InstrumentType
    activeBorderColor: string
    inactiveBorderColor: string
    patternSize: number
    borderRadius: number
    onToggle: (row: number, step: number) => void
}> = ({
    patterns,
    instrumentType,
    activeBorderColor,
    inactiveBorderColor,
    patternSize,
    borderRadius,
    onToggle,
}) => {
    const { activeStep, isActive } = useBeatMaker()

    const [isDragging, setIsDragging] = useState(false)
    const [initialState, setInitialState] = useState<boolean | null>(null)
    const processedStepsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const handleMouseUp = () => {
            setIsDragging(false)
            setInitialState(null)
            processedStepsRef.current.clear()
        }

        document.addEventListener("mouseup", handleMouseUp)
        document.addEventListener("touchend", handleMouseUp)

        return () => {
            document.removeEventListener("mouseup", handleMouseUp)
            document.removeEventListener("touchend", handleMouseUp)
        }
    }, [])

    const handleMouseDown = (
        rowIndex: number,
        stepIndex: number,
        active: boolean
    ) => {
        setIsDragging(true)
        setInitialState(active)
        processedStepsRef.current.clear()
        const key = `${rowIndex}-${stepIndex}`
        processedStepsRef.current.add(key)
        onToggle(rowIndex, stepIndex)
    }

    const handleMouseOver = (rowIndex: number, stepIndex: number) => {
        const key = `${rowIndex}-${stepIndex}`
        if (
            isDragging &&
            initialState !== null &&
            !processedStepsRef.current.has(key)
        ) {
            processedStepsRef.current.add(key)
            const currentState = patterns[rowIndex][stepIndex]
            if (currentState === initialState) {
                onToggle(rowIndex, stepIndex)
            }
        }
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(16, 1fr)",
                gridTemplateRows: `repeat(${patterns.length}, 1fr)`,
                gap: "4px",
                width: "fit-content",
                margin: "0 auto",
            }}
        >
            {patterns.map((pattern, rowIndex) =>
                pattern.map((active, stepIndex) => (
                    <button
                        key={`${instrumentType}-${rowIndex}-${stepIndex}`}
                        onMouseDown={() =>
                            handleMouseDown(rowIndex, stepIndex, active)
                        }
                        onTouchStart={() =>
                            handleMouseDown(rowIndex, stepIndex, active)
                        }
                        onMouseOver={() => handleMouseOver(rowIndex, stepIndex)}
                        onTouchMove={(e) => {
                            e.preventDefault()
                            const touch = e.touches[0]
                            const element = document.elementFromPoint(
                                touch.clientX,
                                touch.clientY
                            )
                            if (element) {
                                const dataKey =
                                    element.getAttribute("data-step-key")
                                if (dataKey) {
                                    const parts = dataKey.split("-")
                                    const touchedRowIndex = parseInt(
                                        parts[parts.length - 2]
                                    )
                                    const touchedStepIndex = parseInt(
                                        parts[parts.length - 1]
                                    )
                                    if (
                                        !isNaN(touchedRowIndex) &&
                                        !isNaN(touchedStepIndex)
                                    ) {
                                        handleMouseOver(
                                            touchedRowIndex,
                                            touchedStepIndex
                                        )
                                    }
                                }
                            }
                        }}
                        data-step-key={`${instrumentType}-${rowIndex}-${stepIndex}`}
                        style={getPatternButtonStyle(
                            active,
                            isActive && activeStep === stepIndex,
                            instrumentType,
                            activeBorderColor,
                            inactiveBorderColor,
                            patternSize,
                            borderRadius
                        )}
                        aria-label={`Toggle step ${stepIndex + 1}, row ${rowIndex + 1}`}
                    />
                ))
            )}
        </div>
    )
}

// Drum Grid Component - special handling for drums with instrument colors
const DrumGrid: React.FC<{
    drumPatterns: DrumPatterns
    activeBorderColor: string
    inactiveBorderColor: string
    patternSize: number
    borderRadius: number
    onToggle: (drumType: keyof DrumPatterns, step: number) => void
}> = ({
    drumPatterns,
    activeBorderColor,
    inactiveBorderColor,
    patternSize,
    borderRadius,
    onToggle,
}) => {
    const { activeStep, isActive } = useBeatMaker()

    const drumTypes = ["hihat", "snare", "kick"] as (keyof DrumPatterns)[]

    const [isDragging, setIsDragging] = useState(false)
    const [initialState, setInitialState] = useState<boolean | null>(null)
    const processedStepsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
        const handleMouseUp = () => {
            setIsDragging(false)
            setInitialState(null)
            processedStepsRef.current.clear()
        }

        document.addEventListener("mouseup", handleMouseUp)
        document.addEventListener("touchend", handleMouseUp)

        return () => {
            document.removeEventListener("mouseup", handleMouseUp)
            document.removeEventListener("touchend", handleMouseUp)
        }
    }, [])

    const handleMouseDown = (
        drumType: keyof DrumPatterns,
        stepIndex: number,
        active: boolean
    ) => {
        setIsDragging(true)
        setInitialState(active)
        processedStepsRef.current.clear()
        const key = `${drumType}-${stepIndex}`
        processedStepsRef.current.add(key)
        onToggle(drumType, stepIndex)
    }

    const handleMouseOver = (
        drumType: keyof DrumPatterns,
        stepIndex: number
    ) => {
        const key = `${drumType}-${stepIndex}`
        if (
            isDragging &&
            initialState !== null &&
            !processedStepsRef.current.has(key)
        ) {
            processedStepsRef.current.add(key)
            const currentState = drumPatterns[drumType][stepIndex]
            if (currentState === initialState) {
                onToggle(drumType, stepIndex)
            }
        }
    }

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(16, 1fr)",
                gridTemplateRows: "repeat(3, 1fr)",
                gap: "4px",
                width: "fit-content",
                margin: "0 auto",
            }}
        >
            {drumTypes.map((drumType, drumIndex) =>
                drumPatterns[drumType].map((active, stepIndex) => (
                    <button
                        key={`drum-${drumType}-${stepIndex}`}
                        onMouseDown={() =>
                            handleMouseDown(drumType, stepIndex, active)
                        }
                        onTouchStart={() =>
                            handleMouseDown(drumType, stepIndex, active)
                        }
                        onMouseOver={() => handleMouseOver(drumType, stepIndex)}
                        onTouchMove={(e) => {
                            e.preventDefault()
                            const touch = e.touches[0]
                            const element = document.elementFromPoint(
                                touch.clientX,
                                touch.clientY
                            )
                            if (element) {
                                const dataKey =
                                    element.getAttribute("data-step-key")
                                if (dataKey) {
                                    const parts = dataKey.split("-")
                                    const touchedDrumType = parts[
                                        parts.length - 2
                                    ] as keyof DrumPatterns
                                    const touchedStepIndex = parseInt(
                                        parts[parts.length - 1]
                                    )
                                    if (
                                        touchedDrumType &&
                                        !isNaN(touchedStepIndex)
                                    ) {
                                        handleMouseOver(
                                            touchedDrumType,
                                            touchedStepIndex
                                        )
                                    }
                                }
                            }
                        }}
                        data-step-key={`drum-${drumType}-${stepIndex}`}
                        style={getPatternButtonStyle(
                            active,
                            isActive && activeStep === stepIndex,
                            "drums",
                            activeBorderColor,
                            inactiveBorderColor,
                            patternSize,
                            borderRadius
                        )}
                        aria-label={`Toggle ${drumType} step ${stepIndex + 1}`}
                    />
                ))
            )}
        </div>
    )
}

// Instrument Selector Component
const InstrumentPicker: React.FC<{ instrumentBorderColor: string }> = ({
    instrumentBorderColor,
}) => {
    const { currentInstrument, setCurrentInstrument } = useBeatMaker()

    const instruments: { id: InstrumentType; name: string; color: string }[] = [
        { id: "drums", name: "Drums", color: "#FF6B9D" },
        { id: "bass", name: "Bass", color: "#4ECDC4" },
        { id: "synth", name: "Synth", color: "#45B7D1" },
        { id: "strings", name: "Strings", color: "#96CEB4" },
        { id: "impact", name: "Impact", color: "#FFEAA7" },
    ]

    return (
        <div
            style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
            }}
        >
            {instruments.map((instrument) => (
                <button
                    key={instrument.id}
                    onClick={() => setCurrentInstrument(instrument.id)}
                    style={{
                        backgroundColor:
                            currentInstrument === instrument.id
                                ? instrument.color
                                : "transparent",
                        border:
                            currentInstrument === instrument.id
                                ? "none"
                                : `1px solid ${instrumentBorderColor}`,
                        borderRadius: "8px",
                        width: "80px",
                        height: "44px",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        color:
                            currentInstrument === instrument.id
                                ? "#292929"
                                : "#ffffff",
                        fontSize: "14px",
                        fontWeight: "600",
                    }}
                    aria-label={`Select ${instrument.name}`}
                >
                    {instrument.name}
                </button>
            ))}
        </div>
    )
}

// Volume Control Component
const VolumeControl: React.FC<{
    min: number
    max: number
    step: number
    value: number
    onChange: (value: number) => void
}> = ({ min, max, step, value, onChange }) => {
    const sliderRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState(false)

    const percentage = ((value - min) / (max - min)) * 100

    const updateValue = (clientX: number) => {
        if (!sliderRef.current) return

        const rect = sliderRef.current.getBoundingClientRect()
        const width = rect.width
        const offset = clientX - rect.left

        let newPercentage = offset / width
        newPercentage = Math.max(0, Math.min(1, newPercentage))

        const range = max - min
        const rawValue = min + newPercentage * range

        const steppedValue = Math.round(rawValue / step) * step
        const clampedValue = Math.max(min, Math.min(max, steppedValue))

        onChange(clampedValue)
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        updateValue(e.clientX)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true)
        updateValue(e.touches[0].clientX)
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateValue(e.clientX)
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                updateValue(e.touches[0].clientX)
            }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("touchmove", handleTouchMove)
            document.addEventListener("mouseup", handleMouseUp)
            document.addEventListener("touchend", handleMouseUp)
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("touchmove", handleTouchMove)
            document.removeEventListener("mouseup", handleMouseUp)
            document.removeEventListener("touchend", handleMouseUp)
        }
    }, [isDragging])

    return (
        <div
            style={{
                position: "relative",
                height: "24px",
                width: "100%",
                cursor: "pointer",
                minWidth: "120px",
            }}
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            role="slider"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            tabIndex={0}
            aria-label="Volume Control"
        >
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    height: "6px",
                    width: "100%",
                    transform: "translateY(-50%)",
                    borderRadius: "9999px",
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "100%",
                        borderRadius: "9999px",
                        backgroundColor: "white",
                        width: `${percentage}%`,
                    }}
                />
            </div>
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    height: "16px",
                    width: "16px",
                    transform: "translate(-50%, -50%)",
                    borderRadius: "50%",
                    backgroundColor: "white",
                    border: "2px solid rgba(0, 0, 0, 0.2)",
                    left: `${percentage}%`,
                }}
            />
        </div>
    )
}

// Download Controls Component
const DownloadControls: React.FC = () => {
    const { downloadMusic } = useBeatMaker()
    const [loops, setLoops] = useState(2)

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
            }}
        >
            <button
                onClick={() => setLoops(Math.max(1, loops - 1))}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    height: "32px",
                    width: "32px",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                }}
                aria-label="Decrease loops"
            >
                -
            </button>
            <div
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    height: "32px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    minWidth: "60px",
                    border: "1px solid rgba(255,255,255,0.3)",
                }}
            >
                {loops} loop{loops !== 1 ? "s" : ""}
            </div>
            <button
                onClick={() => setLoops(Math.min(16, loops + 1))}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    height: "32px",
                    width: "32px",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                }}
                aria-label="Increase loops"
            >
                +
            </button>
            <button
                onClick={() => downloadMusic(loops)}
                style={{
                    borderRadius: "8px",
                    padding: "8px 16px",
                    border: "2px solid rgba(76, 175, 80, 0.6)",
                    backgroundColor: "rgba(76, 175, 80, 0.2)",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                }}
                aria-label="Download Music"
            >
                ⬇ Download
            </button>
        </div>
    )
}

// BPM Control Component
const BPMControl: React.FC = () => {
    const { bpm, setBpm } = useBeatMaker()

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
            }}
        >
            <button
                onClick={() => setBpm(Math.max(60, bpm - 10))}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    height: "34px",
                    width: "44px",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                }}
                aria-label="Decrease BPM"
            >
                -
            </button>
            <div
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    height: "34px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 20px",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    minWidth: "80px",
                    border: "1px solid rgba(255,255,255,0.3)",
                }}
            >
                {bpm}
            </div>
            <button
                onClick={() => setBpm(Math.min(200, bpm + 10))}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    height: "34px",
                    width: "44px",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                }}
                aria-label="Increase BPM"
            >
                +
            </button>
            <div
                style={{
                    color: "#ffffff",
                    fontSize: "12px",
                    opacity: 0.8,
                    marginLeft: "8px",
                }}
            >
                BPM
            </div>
        </div>
    )
}

// Volume Control with Label Component
const VolumeSection: React.FC = () => {
    const { masterVolume, setMasterVolume } = useBeatMaker()

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minWidth: "150px",
            }}
        >
            <span style={{ color: "white", fontSize: "14px" }}>Vol:</span>
            <VolumeControl
                min={0}
                max={1}
                step={0.01}
                value={masterVolume}
                onChange={setMasterVolume}
            />
        </div>
    )
}

// Transport Controls Component
const TransportControls: React.FC = () => {
    const { isActive, togglePlayback, clearAll, loadDemo } = useBeatMaker()

    return (
        <div
            style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
            }}
        >
            <button
                onClick={togglePlayback}
                style={{
                    borderRadius: "10px",
                    padding: "12px 22px",
                    border: "1px solid rgba(255,255,255,0.6)",
                    backgroundColor: isActive ? "#036306" : "transparent",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                }}
                aria-label={isActive ? "Stop" : "Play"}
            >
                {isActive ? "■ Stop" : "▶ Play"}
            </button>
            <button
                onClick={clearAll}
                style={{
                    borderRadius: "10px",
                    padding: "12px 22px",
                    border: "1px solid rgba(255,255,255,0.4)",
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                }}
                aria-label="Clear All"
            >
                Clear
            </button>
            <button
                onClick={loadDemo}
                style={{
                    borderRadius: "10px",
                    padding: "12px 22px",
                    border: "1px solid rgba(255,255,255,0.4)",
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                }}
                aria-label="Load Demo"
            >
                Demo
            </button>
        </div>
    )
}

// Main Component
const RhythmMachine: React.FC<any> = (props) => {
    const { currentInstrument, patterns, toggleStep } = useBeatMaker()

    const {
        separatorColor = "#545454",
        activeBorderColor = "#ffffff",
        inactiveBorderColor = "rgba(255,255,255,0.3)",
        instrumentBorderColor = "#ffffff",
        patternSize = 32,
        patternBorderRadius = 8,
        moveBoxesX = 0,
        moveBoxesY = 0,
    } = props

    const renderInstrument = () => {
        switch (currentInstrument) {
            case "drums":
                return (
                    <DrumGrid
                        drumPatterns={patterns.drums}
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        patternSize={patternSize}
                        borderRadius={patternBorderRadius}
                        onToggle={(drumType, step) =>
                            toggleStep("drums", drumType, step)
                        }
                    />
                )
            case "bass":
                return (
                    <PatternGrid
                        patterns={patterns.bass}
                        instrumentType="bass"
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        patternSize={patternSize}
                        borderRadius={patternBorderRadius}
                        onToggle={(row, step) => toggleStep("bass", row, step)}
                    />
                )
            case "synth":
                return (
                    <PatternGrid
                        patterns={patterns.synth}
                        instrumentType="synth"
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        patternSize={patternSize}
                        borderRadius={patternBorderRadius}
                        onToggle={(row, step) => toggleStep("synth", row, step)}
                    />
                )
            case "strings":
                return (
                    <PatternGrid
                        patterns={patterns.strings}
                        instrumentType="strings"
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        patternSize={patternSize}
                        borderRadius={patternBorderRadius}
                        onToggle={(row, step) =>
                            toggleStep("strings", row, step)
                        }
                    />
                )
            case "impact":
                return (
                    <PatternGrid
                        patterns={patterns.impact}
                        instrumentType="impact"
                        activeBorderColor={activeBorderColor}
                        inactiveBorderColor={inactiveBorderColor}
                        patternSize={patternSize}
                        borderRadius={patternBorderRadius}
                        onToggle={(row, step) =>
                            toggleStep("impact", row, step)
                        }
                    />
                )
            default:
                return null
        }
    }

    return (
        <div
            style={{
                backgroundColor: "transparent",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                padding: "20px",
                boxSizing: "border-box",
            }}
        >
            {/* Top Section - Instruments (left) and BPM (right) */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "32px",
                    width: "100%",
                    gap: "14px",
                    flexWrap: "wrap",
                }}
            >
                {/* Instrument Selector - Top Left */}
                <div>
                    <InstrumentPicker
                        instrumentBorderColor={instrumentBorderColor}
                    />
                </div>

                {/* BPM Control - Top Right */}
                <div>
                    <BPMControl />
                </div>
            </div>

            {/* Main Sequencer - Center */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                    transform: `translate(${moveBoxesX}px, ${moveBoxesY}px)`,
                    transition: "transform 0.3s ease",
                }}
            >
                {renderInstrument()}
            </div>

            {/* Bottom Section - Transport, Volume, Download */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    paddingTop: "32px",
                    borderTop: `1px solid ${separatorColor}`,
                    flexWrap: "wrap",
                    gap: "14px",
                }}
            >
                {/* Transport Controls - Bottom Left */}
                <div>
                    <TransportControls />
                </div>

                {/* Volume Control - Bottom Center */}
                <div>
                    <VolumeSection />
                </div>

                {/* Download Controls - Bottom Right */}
                <div>
                    <DownloadControls />
                </div>
            </div>
        </div>
    )
}

/** Main Framer Component
/* @framerDisableUnlink
/* @framerSupportedLayoutWidth any
/* @framerSupportedLayoutHeight any
*/
export default function BeatMaker(props: any) {
    // Canvas detection for optimized performance
    const renderContext = RenderTarget.current()
    const isCanvasMode = renderContext === RenderTarget.canvas

    return (
        <BeatMakerProvider>
            <RhythmMachine {...props} />
        </BeatMakerProvider>
    )
}

// Component display name
BeatMaker.displayName = "Beat Maker"

// Updated Property Controls - removed instrument position controls
addPropertyControls(BeatMaker, {
    activeBorderColor: {
        type: ControlType.Color,
        title: "Active Border Color",
        defaultValue: "#ffffff",
        description: "Color for pattern button borders when active",
    },

    inactiveBorderColor: {
        type: ControlType.Color,
        title: "Inactive Border Color",
        defaultValue: "rgba(255,255,255,0.3)",
        description: "Color for pattern button borders when inactive",
    },

    instrumentBorderColor: {
        type: ControlType.Color,
        title: "Instrument Border Color",
        defaultValue: "#ffffff",
        description: "Color for instrument selector button borders",
    },

    patternSize: {
        type: ControlType.Number,
        title: "Pattern Size",
        defaultValue: 32,
        min: 16,
        max: 64,
        step: 2,
        description: "Size of pattern buttons (1:1 ratio)",
    },

    patternBorderRadius: {
        type: ControlType.Number,
        title: "Pattern Border Radius",
        defaultValue: 8,
        min: 0,
        max: 32,
        step: 1,
        description: "Border radius of pattern buttons",
    },

    separatorColor: {
        type: ControlType.Color,
        title: "Separator Color",
        defaultValue: "#545454",
        description: "Color for the separator line",
    },

    moveBoxesX: {
        type: ControlType.Number,
        title: "Pattern X",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 1,
        description: "Move pattern sequencer horizontally",
    },

    moveBoxesY: {
        type: ControlType.Number,
        title: "Pattern Y",
        defaultValue: 0,
        min: -500,
        max: 500,
        step: 1,
        description:
            "Move pattern sequencer vertically\n\nMade with ❤️ by [Nitso](https://framer.link/MBYIDPK)",
    },
})
