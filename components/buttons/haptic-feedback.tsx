// Standalone Framer Shim for Next.js / React
const useIsStaticRenderer = () => false;
const addPropertyControls = () => {};
const ControlType = {
    Boolean: 'boolean', Number: 'number', String: 'string',
    Color: 'color', Enum: 'enum', Object: 'object',
    Array: 'array', Image: 'image', ResponsiveImage: 'responsiveImage',
    Font: 'font', Transition: 'transition', Link: 'link'
};

import { useEffect, useRef, useCallback } from "react"

// ─── Audio Engine ─────────────────────────────────────────────────────────────
// All sounds synthesized with Web Audio API — zero external files, zero base64.
// This keeps the component tiny (~12KB) so Framer's canvas can always load it.

const AudioSounds = {
    // ── ORIGINAL ────────────────────────────────────────────────────────────
    softClick(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06)
        gain.gain.setValueAtTime(0.18 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
        osc.start()
        osc.stop(ctx.currentTime + 0.06)
    },

    pop(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(900, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(0.22 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
    },

    tick(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "triangle"
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015)
        osc.start()
        osc.stop(ctx.currentTime + 0.015)
    },

    whoosh(ctx, vol) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.15)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = "bandpass"
        filter.frequency.setValueAtTime(200, ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(
            2000,
            ctx.currentTime + 0.1
        )
        filter.Q.value = 3
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.001, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.12 * vol, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start()
        source.stop(ctx.currentTime + 0.15)
    },

    chime(ctx, vol) {
        ;[
            [523, 0],
            [659, 0.1],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.15 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.18
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.2)
        })
    },

    buzz(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.value = 80
        gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime)
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
    },

    rise(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
    },

    coin(ctx, vol) {
        const osc = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "triangle"
        osc.frequency.value = 987
        osc2.type = "triangle"
        osc2.frequency.value = 1318
        gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
        osc.start()
        osc.stop(ctx.currentTime + 0.22)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.22)
    },

    // ── ISOCONS ──────────────────────────────────────────────────────────────
    isoDownload(ctx, vol) {
        const thud = ctx.createOscillator()
        const thudGain = ctx.createGain()
        thud.connect(thudGain)
        thudGain.connect(ctx.destination)
        thud.type = "sine"
        thud.frequency.setValueAtTime(200, ctx.currentTime)
        thud.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.09)
        thudGain.gain.setValueAtTime(0.45 * vol, ctx.currentTime)
        thudGain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.09
        )
        thud.start()
        thud.stop(ctx.currentTime + 0.09)[([880, 0.08], [1047, 0.17])].forEach(
            ([freq, delay]) => {
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.type = "sine"
                osc.frequency.value = freq
                gain.gain.setValueAtTime(0, ctx.currentTime + delay)
                gain.gain.linearRampToValueAtTime(
                    0.1 * vol,
                    ctx.currentTime + delay + 0.01
                )
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + delay + 0.2
                )
                osc.start(ctx.currentTime + delay)
                osc.stop(ctx.currentTime + delay + 0.22)
            }
        )
    },

    isoCopySVG(ctx, vol) {
        const tick = ctx.createOscillator()
        const tickGain = ctx.createGain()
        tick.connect(tickGain)
        tickGain.connect(ctx.destination)
        tick.type = "triangle"
        tick.frequency.setValueAtTime(1800, ctx.currentTime)
        tickGain.gain.setValueAtTime(0.14 * vol, ctx.currentTime)
        tickGain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.018
        )
        tick.start()
        tick.stop(ctx.currentTime + 0.018)
        const pop = ctx.createOscillator()
        const popGain = ctx.createGain()
        pop.connect(popGain)
        popGain.connect(ctx.destination)
        pop.type = "sine"
        pop.frequency.setValueAtTime(700, ctx.currentTime + 0.02)
        pop.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.07)
        popGain.gain.setValueAtTime(0.18 * vol, ctx.currentTime + 0.02)
        popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)
        pop.start(ctx.currentTime + 0.02)
        pop.stop(ctx.currentTime + 0.08)
    },

    isoTuning(ctx, vol) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.2)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = "bandpass"
        filter.frequency.setValueAtTime(100, ctx.currentTime)
        filter.frequency.exponentialRampToValueAtTime(
            3200,
            ctx.currentTime + 0.18
        )
        filter.Q.value = 12
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.001, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.18 * vol, ctx.currentTime + 0.06)
        gain.gain.linearRampToValueAtTime(0.18 * vol, ctx.currentTime + 0.16)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start()
        source.stop(ctx.currentTime + 0.21)
    },

    // ── MIXKIT INTERFACE (all 15) ─────────────────────────────────────────────
    mxInterfaceStart(ctx, vol) {
        ;[
            [392, 0],
            [523, 0.12],
            [659, 0.24],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.11 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.22
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.24)
        })
    },

    mxInterfaceBack(ctx, vol) {
        ;[
            [659, 0],
            [523, 0.1],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.11 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.18
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.2)
        })
    },

    mxSelectClick(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(1000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.03)
        gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        osc.start()
        osc.stop(ctx.currentTime + 0.04)
    },

    mxInterfaceRemove(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(500, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14)
        gain.gain.setValueAtTime(0.18 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
    },

    mxOptionSelect(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "triangle"
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.13 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
    },

    mxCoolClickTone(ctx, vol) {
        const osc = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 1320
        osc2.type = "sine"
        osc2.frequency.value = 1760
        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        osc.start()
        osc.stop(ctx.currentTime + 0.25)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.25)
    },

    mxClickError(ctx, vol) {
        ;[110, 155].forEach((freq) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sawtooth"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.14 * vol, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.12
            )
            osc.start()
            osc.stop(ctx.currentTime + 0.12)
        })
    },

    mxNegativeTap(ctx, vol) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.06)
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
            const t = i / ctx.sampleRate
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 80)
        }
        const source = ctx.createBufferSource()
        source.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = "lowpass"
        filter.frequency.value = 300
        const gain = ctx.createGain()
        gain.gain.value = 0.55 * vol
        source.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        source.start()
        source.stop(ctx.currentTime + 0.06)
    },

    mxDeviceClick(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "square"
        osc.frequency.value = 900
        gain.gain.setValueAtTime(0.08 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
        osc.start()
        osc.stop(ctx.currentTime + 0.025)
    },

    mxPageForward(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 1047
        gain.gain.setValueAtTime(0.16 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
    },

    mxPageBack(ctx, vol) {
        ;[
            [1047, 0],
            [880, 0.1],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.13 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.2
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.22)
        })
    },

    mxOpeningInterface(ctx, vol) {
        ;[
            [261, 0],
            [329, 0.08],
            [392, 0.16],
            [523, 0.24],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.1 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.2
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.22)
        })
    },

    mxGameUITone(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "square"
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.05)
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        osc.start()
        osc.stop(ctx.currentTime + 0.18)
    },

    mxPageTurn(ctx, vol) {
        const bufSize = Math.floor(ctx.sampleRate * 0.12)
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const dat = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            const t = i / ctx.sampleRate
            dat[i] = (Math.random() * 2 - 1) * Math.exp(-t * 40)
        }
        const src = ctx.createBufferSource()
        src.buffer = buf
        const hpf = ctx.createBiquadFilter()
        hpf.type = "highpass"
        hpf.frequency.value = 2000
        const noiseGain = ctx.createGain()
        noiseGain.gain.value = 0.08 * vol
        src.connect(hpf)
        hpf.connect(noiseGain)
        noiseGain.connect(ctx.destination)
        src.start()
        src.stop(ctx.currentTime + 0.12)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 784
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.06)
        gain.gain.linearRampToValueAtTime(0.12 * vol, ctx.currentTime + 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26)
        osc.start(ctx.currentTime + 0.06)
        osc.stop(ctx.currentTime + 0.27)
    },

    mxGameInterface(ctx, vol) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.08 * vol, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.12 * vol, ctx.currentTime + 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
    },

    // ── NEW MIXKIT GAME SOUNDS ────────────────────────────────────────────────
    mxVideoGameTreasure(ctx, vol) {
        // Rising arpeggio + sparkle — triumphant chest-open moment
        ;[
            [523, 0],
            [659, 0.07],
            [784, 0.14],
            [1047, 0.21],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "triangle"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.14 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.22
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.24)
        })
    },

    mxWinningCoin(ctx, vol) {
        // 8-bit coin collect — bright square wave blip
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "square"
        osc.frequency.setValueAtTime(988, ctx.currentTime)
        osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start()
        osc.stop(ctx.currentTime + 0.13)
    },

    mxUnlockGame(ctx, vol) {
        // Ascending three-tone unlock — clean and bright
        ;[
            [523, 0],
            [784, 0.09],
            [1047, 0.18],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.15 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.14
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.15)
        })
    },

    mxGameBonus(ctx, vol) {
        // Happy fanfare chord — major triad hit, short decay
        ;[523, 659, 784].forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "triangle"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + 0.35
            )
            osc.start()
            osc.stop(ctx.currentTime + 0.36)
        })
    },

    mxExtraBonus(ctx, vol) {
        // Quick upward sweep then bell hit
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06)
        gain.gain.setValueAtTime(0.1 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
        osc.start()
        osc.stop(ctx.currentTime + 0.09)
        const bell = ctx.createOscillator()
        const bellGain = ctx.createGain()
        bell.connect(bellGain)
        bellGain.connect(ctx.destination)
        bell.type = "sine"
        bell.frequency.value = 1318
        bellGain.gain.setValueAtTime(0, ctx.currentTime + 0.08)
        bellGain.gain.linearRampToValueAtTime(
            0.16 * vol,
            ctx.currentTime + 0.09
        )
        bellGain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + 0.28
        )
        bell.start(ctx.currentTime + 0.08)
        bell.stop(ctx.currentTime + 0.3)
    },

    mxGamingLock(ctx, vol) {
        // Mechanical lock click — short thud + metallic tail
        const bufSize = Math.floor(ctx.sampleRate * 0.04)
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const dat = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) {
            const t = i / ctx.sampleRate
            dat[i] = (Math.random() * 2 - 1) * Math.exp(-t * 120)
        }
        const src = ctx.createBufferSource()
        src.buffer = buf
        const lpf = ctx.createBiquadFilter()
        lpf.type = "lowpass"
        lpf.frequency.value = 800
        const noiseG = ctx.createGain()
        noiseG.gain.value = 0.5 * vol
        src.connect(lpf)
        lpf.connect(noiseG)
        noiseG.connect(ctx.destination)
        src.start()
        src.stop(ctx.currentTime + 0.04)
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 220
        gain.gain.setValueAtTime(0.18 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
        osc.start()
        osc.stop(ctx.currentTime + 0.06)
    },

    // ── NEW MIXKIT NOTIFICATION/INTERFACE SOUNDS ──────────────────────────────
    mxSoftwareBack(ctx, vol) {
        // Two descending tones — navigating back in UI
        ;[
            [784, 0],
            [523, 0.1],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.13 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.12
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.13)
        })
    },

    mxPositiveNotification(ctx, vol) {
        // Bright upward two-note chime — cheerful positive alert
        ;[
            [880, 0],
            [1175, 0.1],
        ].forEach(([freq, delay]) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.type = "sine"
            osc.frequency.value = freq
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(
                0.15 * vol,
                ctx.currentTime + delay + 0.01
            )
            gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + delay + 0.2
            )
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + 0.22)
        })
    },

    mxConfirmationTone(ctx, vol) {
        // Clean single bleep — confirms an action, clinical and clear
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 1046
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.18 * vol, ctx.currentTime + 0.005)
        gain.gain.setValueAtTime(0.18 * vol, ctx.currentTime + 0.055)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.11)
    },

    mxSoftwareRemove(ctx, vol) {
        // Downward sweep — item dismissed/deleted from UI
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14)
        osc.start()
        osc.stop(ctx.currentTime + 0.14)
    },

    mxElevatorTone(ctx, vol) {
        // Gentle warm ding — elevator arrival, single bell strike
        const osc = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 880
        osc2.type = "sine"
        osc2.frequency.value = 1109 // minor 3rd overtone
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.2 * vol, ctx.currentTime + 0.008)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start()
        osc.stop(ctx.currentTime + 0.62)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.62)
    },

    mxAtmKeyPress(ctx, vol) {
        // Hard mechanical ATM/keypad press — crisp with slight buzz
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "square"
        osc.frequency.value = 700
        gain.gain.setValueAtTime(0.14 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035)
        osc.start()
        osc.stop(ctx.currentTime + 0.035)
        const bufSize = Math.floor(ctx.sampleRate * 0.02)
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const dat = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++)
            dat[i] =
                (Math.random() * 2 - 1) * Math.exp(-(i / ctx.sampleRate) * 200)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const g = ctx.createGain()
        g.gain.value = 0.06 * vol
        src.connect(g)
        g.connect(ctx.destination)
        src.start()
        src.stop(ctx.currentTime + 0.02)
    },

    mxDigitalQuickTone(ctx, vol) {
        // Ultra-short digital blip — very quick single tone
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.value = 1400
        gain.gain.setValueAtTime(0.2 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)
        osc.start()
        osc.stop(ctx.currentTime + 0.025)
    },

    mxFastDoubleClick(ctx, vol) {
        // Two rapid mechanical mouse clicks in quick succession
        ;[0, 0.065].forEach((delay) => {
            const bufSize = Math.floor(ctx.sampleRate * 0.018)
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
            const dat = buf.getChannelData(0)
            for (let i = 0; i < bufSize; i++)
                dat[i] =
                    (Math.random() * 2 - 1) *
                    Math.exp(-(i / ctx.sampleRate) * 350)
            const src = ctx.createBufferSource()
            src.buffer = buf
            const lpf = ctx.createBiquadFilter()
            lpf.type = "bandpass"
            lpf.frequency.value = 2200
            lpf.Q.value = 2
            const g = ctx.createGain()
            g.gain.value = 0.35 * vol
            src.connect(lpf)
            lpf.connect(g)
            g.connect(ctx.destination)
            src.start(ctx.currentTime + delay)
            src.stop(ctx.currentTime + delay + 0.02)
        })
    },

    // ── NEW MIXKIT SCI-FI / ELECTRIC SOUNDS ──────────────────────────────────
    mxWrongElectricity(ctx, vol) {
        // Error buzz with electric character — wrong/fail with buzz
        const osc = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.value = 120
        osc2.type = "square"
        osc2.frequency.value = 127 // slight detune = buzz
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime)
        gain.gain.setValueAtTime(0.12 * vol, ctx.currentTime + 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
        osc.start()
        osc.stop(ctx.currentTime + 0.18)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.18)
    },

    mxScifiClick(ctx, vol) {
        // Crisp sci-fi interface click — high-freq snap with resonance
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(2400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.022)
        gain.gain.setValueAtTime(0.18 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)
        osc.start()
        osc.stop(ctx.currentTime + 0.03)
    },

    mxWaterScifiBleep(ctx, vol) {
        // Wet bubbly sci-fi bleep — watery resonant blip
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.04)
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)
        filter.type = "bandpass"
        filter.frequency.value = 900
        filter.Q.value = 8
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.2 * vol, ctx.currentTime + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start()
        osc.stop(ctx.currentTime + 0.13)
    },

    mxFastScifiBleep(ctx, vol) {
        // Ultra-quick high-pitched sci-fi bleep — zippy and sharp
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(3200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.03)
        gain.gain.setValueAtTime(0.15 * vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        osc.start()
        osc.stop(ctx.currentTime + 0.04)
    },

    none() {},
}

// ─── Option arrays ────────────────────────────────────────────────────────────
const SOUND_OPTIONS = Object.keys(AudioSounds)
const SOUND_TITLES = [
    // Original
    "Soft Click",
    "Pop",
    "Tick",
    "Whoosh",
    "Chime",
    "Buzz",
    "Rise",
    "Coin",
    // Isocons
    "Download",
    "Copy SVG",
    "Tuning",
    // Mixkit: Original Interface
    "Interface Start",
    "Interface Back",
    "Select Click",
    "Interface Remove",
    "Option Select",
    "Cool Click Tone",
    "Click Error",
    "Negative Tap",
    "Device Click",
    "Page Forward",
    "Page Back",
    "Opening Interface",
    "Game UI Tone",
    "Page Turn",
    "Game Interface",
    // Mixkit: Game Sounds
    "Video Game Treasure",
    "Winning a Coin",
    "Unlock Game",
    "Game Bonus Reached",
    "Extra Bonus",
    "Gaming Lock",
    // Mixkit: Notification & Interface
    "Software Back",
    "Positive Notification",
    "Confirmation Tone",
    "Software Remove",
    "Elevator Tone",
    "ATM Key Press",
    "Digital Quick Tone",
    "Fast Double Click",
    // Mixkit: Sci-Fi & Electric
    "Wrong Electricity",
    "Sci-Fi Click",
    "Water Sci-Fi Bleep",
    "Fast Sci-Fi Bleep",
    // None
    "None",
]
const TRIGGER_OPTIONS = ["click", "hover", "drag", "click + hover", "all"]

// ─── Component ────────────────────────────────────────────────────────────────
export default function HapticFeedback({
    enabled = true,
    triggers = "click + hover",
    enableAppear = false,
    appearSound = "mxInterfaceStart",
    enableSound = true,
    clickSound = "softClick",
    hoverSound = "tick",
    dragSound = "whoosh",
    volume = 90,
    style,
}) {
    const audioCtxRef = useRef(null)
    const overlayRef = useRef(null)
    const hasAppeared = useRef(false)

    const getCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext ||
                window.webkitAudioContext)()
        }
        if (audioCtxRef.current.state === "suspended") {
            audioCtxRef.current.resume()
        }
        return audioCtxRef.current
    }, [])

    const playSound = useCallback(
        (soundName) => {
            if (!enabled || !enableSound || soundName === "none") return
            try {
                const ctx = getCtx()
                const fn = AudioSounds[soundName]
                if (fn) fn(ctx, volume / 100)
            } catch (_) {}
        },
        [enabled, enableSound, volume, getCtx]
    )

    const wantsClick =
        triggers === "click" ||
        triggers === "click + hover" ||
        triggers === "all"
    const wantsHover =
        triggers === "hover" ||
        triggers === "click + hover" ||
        triggers === "all"
    const wantsDrag = triggers === "drag" || triggers === "all"

    const handleClick = useCallback(() => {
        if (!wantsClick) return
        playSound(clickSound)
    }, [wantsClick, clickSound, playSound])

    const handleHover = useCallback(() => {
        if (!wantsHover) return
        playSound(hoverSound)
    }, [wantsHover, hoverSound, playSound])

    const handleDrag = useCallback(() => {
        if (!wantsDrag) return
        playSound(dragSound)
    }, [wantsDrag, dragSound, playSound])

    // ── Appear sound (IntersectionObserver) ───────────────────────────────────
    useEffect(() => {
        if (!enabled || !enableAppear) return
        const overlay = overlayRef.current
        if (!overlay) return
        const target = overlay.parentElement || overlay
        hasAppeared.current = false

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAppeared.current) {
                        hasAppeared.current = true
                        playSound(appearSound)
                    }
                })
            },
            { threshold: 0.1 }
        )
        observer.observe(target)
        return () => observer.disconnect()
    }, [enabled, enableAppear, appearSound, playSound])

    // ── Interaction listeners ─────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) return
        const overlay = overlayRef.current
        if (!overlay) return
        const parent = overlay.parentElement
        if (!parent) return

        const SELECTORS = [
            "button",
            "a",
            "[role='button']",
            "[role='link']",
            "[draggable='true']",
            "input[type='submit']",
            "input[type='button']",
            "input[type='checkbox']",
            "input[type='radio']",
            "select",
            "[tabindex]",
        ].join(",")

        let targets = Array.from(parent.querySelectorAll(SELECTORS)).filter(
            (el) => el !== overlay
        )
        if (targets.length === 0) targets = [parent]

        const attached = []
        targets.forEach((el) => {
            const onClick = () => handleClick()
            const onMouseEnter = () => handleHover()
            const onDragStart = () => handleDrag()
            const onTouchStart = () => handleClick()
            el.addEventListener("click", onClick)
            el.addEventListener("mouseenter", onMouseEnter)
            el.addEventListener("dragstart", onDragStart)
            el.addEventListener("touchstart", onTouchStart, { passive: true })
            attached.push({
                el,
                onClick,
                onMouseEnter,
                onDragStart,
                onTouchStart,
            })
        })

        return () => {
            attached.forEach(
                ({ el, onClick, onMouseEnter, onDragStart, onTouchStart }) => {
                    el.removeEventListener("click", onClick)
                    el.removeEventListener("mouseenter", onMouseEnter)
                    el.removeEventListener("dragstart", onDragStart)
                    el.removeEventListener("touchstart", onTouchStart)
                }
            )
        }
    }, [enabled, handleClick, handleHover, handleDrag])

    return (
        <div
            ref={overlayRef}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...style,
            }}
        >
            <div
                style={{
                    background: enabled
                        ? "rgba(99,102,241,0.10)"
                        : "rgba(120,120,120,0.08)",
                    border: `1.5px dashed ${enabled ? "rgba(99,102,241,0.45)" : "rgba(150,150,150,0.3)"}`,
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontFamily: "monospace",
                    fontSize: 10,
                    color: enabled
                        ? "rgba(99,102,241,0.75)"
                        : "rgba(150,150,150,0.5)",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    pointerEvents: "none",
                }}
            >
                {enabled ? "⚡" : "○"} Haptic {enabled ? "ON" : "OFF"}
                {enabled && enableSound ? ` · ${clickSound}` : ""}
            </div>
        </div>
    )
}

// ─── Property Controls ────────────────────────────────────────────────────────
addPropertyControls(HapticFeedback, {
    // ── Master toggle ──
    enabled: {
        type: ControlType.Boolean,
        title: "Enabled",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
        description:
            "Drop the component into a Button or Frame to get started. toggle off to disable",
    },
    triggers: {
        type: ControlType.Enum,
        title: "Triggers",
        options: TRIGGER_OPTIONS,
        defaultValue: "click + hover",
        hidden: (p) => !p.enabled,
        description: "Select when to trigger",
    },

    // ── Appear ──
    enableAppear: {
        type: ControlType.Boolean,
        title: "Appear",
        defaultValue: false,
        hidden: (p) => !p.enabled,
        description: "Play sound when component appears",
    },
    appearSound: {
        type: ControlType.Enum,
        title: "  Appear Sound",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "mxInterfaceStart",
        hidden: (p) => !p.enabled || !p.enableAppear,
        description: "Pick appear sound",
    },

    // ── Sound ──
    enableSound: {
        type: ControlType.Boolean,
        title: "Sound",
        defaultValue: true,
        hidden: (p) => !p.enabled,
        description: "Add sound to trigger",
    },
    clickSound: {
        type: ControlType.Enum,
        title: "  Click Sound",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "softClick",
        hidden: (p) => !p.enabled || !p.enableSound,
        description: "Pick the click sound",
    },
    volume: {
        type: ControlType.Number,
        title: "  Volume",
        min: 0,
        max: 100,
        step: 5,
        displayStepper: true,
        defaultValue: 90,
        hidden: (p) => !p.enabled || !p.enableSound,
    },
    hoverSound: {
        type: ControlType.Enum,
        title: "  Hover",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "tick",
        hidden: (p) =>
            !p.enabled ||
            !p.enableSound ||
            p.triggers === "click" ||
            p.triggers === "drag",
    },
    dragSound: {
        type: ControlType.Enum,
        title: "  Drag",
        options: SOUND_OPTIONS,
        optionTitles: SOUND_TITLES,
        defaultValue: "whoosh",
        hidden: (p) =>
            !p.enabled ||
            !p.enableSound ||
            (p.triggers !== "drag" && p.triggers !== "all"),
    },
})
